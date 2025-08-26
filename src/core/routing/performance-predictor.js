/**
 * Performance Predictor for TTL-Based Routing
 * Predicts task completion times based on historical data and system load
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Performance Model
 */
class PerformanceModel {
  constructor(specialistId, taskType) {
    this.specialistId = specialistId;
    this.taskType = taskType;
    this.samples = [];
    this.statistics = {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: Infinity,
      max: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0
    };
    this.lastUpdated = Date.now();
    this.confidence = 0;
  }
  
  addSample(duration, complexity, success) {
    this.samples.push({
      duration,
      complexity,
      success,
      timestamp: Date.now()
    });
    
    // Keep only recent samples (last 100)
    if (this.samples.length > 100) {
      this.samples.shift();
    }
    
    this.updateStatistics();
  }
  
  updateStatistics() {
    if (this.samples.length === 0) return;
    
    const durations = this.samples
      .filter(s => s.success)
      .map(s => s.duration)
      .sort((a, b) => a - b);
    
    if (durations.length === 0) return;
    
    // Calculate mean
    this.statistics.mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    // Calculate median
    const mid = Math.floor(durations.length / 2);
    this.statistics.median = durations.length % 2 === 0
      ? (durations[mid - 1] + durations[mid]) / 2
      : durations[mid];
    
    // Calculate standard deviation
    const variance = durations.reduce((sum, d) => {
      return sum + Math.pow(d - this.statistics.mean, 2);
    }, 0) / durations.length;
    this.statistics.stdDev = Math.sqrt(variance);
    
    // Min/Max
    this.statistics.min = durations[0];
    this.statistics.max = durations[durations.length - 1];
    
    // Percentiles
    this.statistics.p50 = this.getPercentile(durations, 50);
    this.statistics.p75 = this.getPercentile(durations, 75);
    this.statistics.p90 = this.getPercentile(durations, 90);
    this.statistics.p95 = this.getPercentile(durations, 95);
    this.statistics.p99 = this.getPercentile(durations, 99);
    
    // Update confidence based on sample size
    this.confidence = Math.min(1, this.samples.length / 20);
    this.lastUpdated = Date.now();
  }
  
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
  
  predict(complexity, percentile = 90) {
    if (this.samples.length < 3) {
      return null; // Not enough data
    }
    
    // Base prediction on percentile
    let basePrediction = this.statistics[`p${percentile}`] || this.statistics.p90;
    
    // Adjust for complexity
    const avgComplexity = this.samples.reduce((sum, s) => sum + s.complexity, 0) / this.samples.length;
    const complexityFactor = complexity / avgComplexity;
    
    return Math.floor(basePrediction * complexityFactor);
  }
}

/**
 * Load Tracker
 */
class LoadTracker {
  constructor() {
    this.currentLoad = {
      cpu: 0,
      memory: 0,
      activeTasks: 0,
      queuedTasks: 0,
      specialists: new Map()
    };
    
    this.loadHistory = [];
    this.maxHistorySize = 100;
  }
  
  updateLoad(metrics) {
    this.currentLoad = {
      ...this.currentLoad,
      ...metrics,
      timestamp: Date.now()
    };
    
    this.loadHistory.push({ ...this.currentLoad });
    
    if (this.loadHistory.length > this.maxHistorySize) {
      this.loadHistory.shift();
    }
  }
  
  updateSpecialistLoad(specialistId, load) {
    this.currentLoad.specialists.set(specialistId, {
      load,
      timestamp: Date.now()
    });
  }
  
  getSpecialistLoad(specialistId) {
    const load = this.currentLoad.specialists.get(specialistId);
    return load ? load.load : 0;
  }
  
  getSystemLoad() {
    return {
      cpu: this.currentLoad.cpu,
      memory: this.currentLoad.memory,
      tasks: this.currentLoad.activeTasks + this.currentLoad.queuedTasks,
      specialists: this.currentLoad.specialists.size
    };
  }
  
  getLoadFactor() {
    // Calculate overall load factor (0-1)
    const cpuFactor = this.currentLoad.cpu / 100;
    const memoryFactor = this.currentLoad.memory / 100;
    const taskFactor = Math.min(1, this.currentLoad.activeTasks / 50);
    
    return (cpuFactor * 0.3 + memoryFactor * 0.3 + taskFactor * 0.4);
  }
  
  predictLoadImpact(duration) {
    const loadFactor = this.getLoadFactor();
    
    // High load increases duration
    if (loadFactor > 0.8) {
      return duration * 1.5;
    } else if (loadFactor > 0.6) {
      return duration * 1.2;
    } else if (loadFactor > 0.4) {
      return duration * 1.1;
    }
    
    return duration;
  }
}

/**
 * Main Performance Predictor
 */
class PerformancePredictor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Prediction settings
      defaultPercentile: config.defaultPercentile || 90,
      confidenceThreshold: config.confidenceThreshold || 0.5,
      enableLearning: config.enableLearning !== false,
      
      // Model settings
      modelUpdateInterval: config.modelUpdateInterval || 60000,    // 1 minute
      minSamplesForPrediction: config.minSamplesForPrediction || 5,
      sampleRetentionTime: config.sampleRetentionTime || 3600000,  // 1 hour
      
      // Load tracking
      loadUpdateInterval: config.loadUpdateInterval || 5000,        // 5 seconds
      loadImpactEnabled: config.loadImpactEnabled !== false,
      
      // Caching
      enableCache: config.enableCache !== false,
      cacheSize: config.cacheSize || 100,
      cacheTTL: config.cacheTTL || 30000                           // 30 seconds
    };
    
    // Prediction state
    this.models = new Map(); // key: specialistId:taskType
    this.loadTracker = new LoadTracker();
    this.predictionCache = new Map();
    this.historicalData = [];
    
    // Statistics
    this.statistics = {
      totalPredictions: 0,
      accuratePredictions: 0,
      averageError: 0,
      cacheHits: 0,
      cacheMisses: 0,
      modelsCreated: 0,
      samplesCollected: 0
    };
    
    // Start background processes
    this.startBackgroundProcesses();
    
    logger.info('📊 Performance Predictor initialized');
  }
  
  /**
   * Predict task completion time
   */
  async predictCompletion(task, specialist, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(task, specialist);
      const cached = this.getCachedPrediction(cacheKey);
      
      if (cached) {
        this.statistics.cacheHits++;
        return cached;
      }
      
      this.statistics.cacheMisses++;
      
      // Get or create performance model
      const model = this.getOrCreateModel(specialist.id, task.type);
      
      // Make prediction
      let prediction = this.makePrediction(model, task, specialist);
      
      // Adjust for system load
      if (this.config.loadImpactEnabled) {
        prediction = this.adjustForLoad(prediction);
      }
      
      // Adjust for specialist current state
      prediction = this.adjustForSpecialistState(prediction, specialist);
      
      // Create prediction result
      const result = {
        estimatedDuration: prediction.duration,
        confidence: prediction.confidence,
        factors: prediction.factors,
        percentile: this.config.defaultPercentile,
        timestamp: Date.now()
      };
      
      // Cache result
      this.cachePrediction(cacheKey, result);
      
      // Update statistics
      this.statistics.totalPredictions++;
      
      // Emit prediction event
      this.emit('prediction:made', {
        task: task.id || 'unknown',
        specialist: specialist.id,
        duration: result.estimatedDuration,
        confidence: result.confidence,
        predictionTime: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      logger.error('Prediction failed:', error);
      
      // Return fallback prediction
      return this.getFallbackPrediction(task, specialist);
    }
  }
  
  /**
   * Record actual performance
   */
  recordPerformance(task, specialist, actualDuration, success = true) {
    try {
      // Get model
      const model = this.getOrCreateModel(specialist.id, task.type);
      
      // Add sample
      model.addSample(
        actualDuration,
        task.complexity || 0.5,
        success
      );
      
      // Update statistics
      this.statistics.samplesCollected++;
      
      // Store historical data
      this.historicalData.push({
        timestamp: Date.now(),
        specialistId: specialist.id,
        taskType: task.type,
        complexity: task.complexity,
        duration: actualDuration,
        success
      });
      
      // Trim historical data
      const cutoff = Date.now() - this.config.sampleRetentionTime;
      this.historicalData = this.historicalData.filter(d => d.timestamp > cutoff);
      
      // Learn from performance if enabled
      if (this.config.enableLearning) {
        this.learnFromPerformance(task, specialist, actualDuration);
      }
      
      // Emit performance event
      this.emit('performance:recorded', {
        specialist: specialist.id,
        task: task.type,
        duration: actualDuration,
        success
      });
      
    } catch (error) {
      logger.error('Failed to record performance:', error);
    }
  }
  
  /**
   * Get or create performance model
   */
  getOrCreateModel(specialistId, taskType) {
    const key = `${specialistId}:${taskType || 'general'}`;
    
    if (!this.models.has(key)) {
      const model = new PerformanceModel(specialistId, taskType);
      this.models.set(key, model);
      this.statistics.modelsCreated++;
      
      // Initialize with historical data if available
      this.initializeModel(model);
    }
    
    return this.models.get(key);
  }
  
  /**
   * Initialize model with historical data
   */
  initializeModel(model) {
    const relevantData = this.historicalData.filter(d => 
      d.specialistId === model.specialistId &&
      d.taskType === model.taskType
    );
    
    for (const data of relevantData) {
      model.addSample(data.duration, data.complexity, data.success);
    }
  }
  
  /**
   * Make prediction using model
   */
  makePrediction(model, task, specialist) {
    const factors = {};
    let duration = 0;
    let confidence = 0;
    
    // Check if model has enough data
    if (model.samples.length >= this.config.minSamplesForPrediction) {
      // Use model prediction
      duration = model.predict(task.complexity || 0.5, this.config.defaultPercentile);
      confidence = model.confidence;
      factors.model = 'statistical';
    } else {
      // Use heuristic prediction
      duration = this.heuristicPrediction(task, specialist);
      confidence = 0.3;
      factors.model = 'heuristic';
    }
    
    // Add factors
    factors.samples = model.samples.length;
    factors.complexity = task.complexity || 0.5;
    factors.taskType = task.type || 'general';
    
    return {
      duration,
      confidence,
      factors
    };
  }
  
  /**
   * Heuristic prediction when no model data
   */
  heuristicPrediction(task, specialist) {
    // Base duration by task type
    const baseDurations = {
      'query': 1000,
      'computation': 5000,
      'generation': 10000,
      'integration': 8000,
      'validation': 3000,
      'optimization': 15000,
      'deployment': 20000,
      'maintenance': 7000
    };
    
    let duration = baseDurations[task.type] || 5000;
    
    // Adjust for complexity
    const complexity = task.complexity || 0.5;
    duration *= (0.5 + complexity);
    
    // Adjust for specialist type
    const specialistMultipliers = {
      'backend-engineer': 1.0,
      'frontend-developer': 0.9,
      'database-specialist': 1.2,
      'devops-engineer': 1.1,
      'security-specialist': 1.3,
      'qa-engineer': 1.0
    };
    
    const multiplier = specialistMultipliers[specialist.type] || 1.0;
    duration *= multiplier;
    
    return Math.floor(duration);
  }
  
  /**
   * Adjust prediction for system load
   */
  adjustForLoad(prediction) {
    const adjustedDuration = this.loadTracker.predictLoadImpact(prediction.duration);
    
    if (adjustedDuration !== prediction.duration) {
      prediction.factors.loadAdjustment = adjustedDuration / prediction.duration;
      prediction.duration = adjustedDuration;
      prediction.confidence *= 0.9; // Reduce confidence due to load uncertainty
    }
    
    return prediction;
  }
  
  /**
   * Adjust for specialist current state
   */
  adjustForSpecialistState(prediction, specialist) {
    // Check specialist load
    const specialistLoad = this.loadTracker.getSpecialistLoad(specialist.id);
    
    if (specialistLoad > 0.8) {
      prediction.duration *= 1.3;
      prediction.factors.specialistLoad = 'high';
      prediction.confidence *= 0.85;
    } else if (specialistLoad > 0.5) {
      prediction.duration *= 1.1;
      prediction.factors.specialistLoad = 'medium';
      prediction.confidence *= 0.95;
    } else {
      prediction.factors.specialistLoad = 'low';
    }
    
    // Check specialist state
    if (specialist.state === 'cold') {
      prediction.duration += 100; // Add cold start time
      prediction.factors.coldStart = true;
    }
    
    return prediction;
  }
  
  /**
   * Get fallback prediction
   */
  getFallbackPrediction(task, specialist) {
    const duration = this.heuristicPrediction(task, specialist);
    
    return {
      estimatedDuration: duration,
      confidence: 0.2,
      factors: {
        model: 'fallback',
        reason: 'prediction_failed'
      },
      percentile: this.config.defaultPercentile,
      timestamp: Date.now()
    };
  }
  
  /**
   * Learn from performance data
   */
  learnFromPerformance(task, specialist, actualDuration) {
    // Find recent prediction for this task
    const cacheKey = this.getCacheKey(task, specialist);
    const prediction = this.predictionCache.get(cacheKey);
    
    if (prediction && prediction.data) {
      const predictedDuration = prediction.data.estimatedDuration;
      const error = Math.abs(actualDuration - predictedDuration) / predictedDuration;
      
      // Update accuracy statistics
      if (error < 0.2) { // Within 20% is considered accurate
        this.statistics.accuratePredictions++;
      }
      
      // Update average error
      const totalPredictions = this.statistics.totalPredictions;
      this.statistics.averageError = 
        (this.statistics.averageError * (totalPredictions - 1) + error) / totalPredictions;
      
      // Emit learning event
      this.emit('learning:complete', {
        specialist: specialist.id,
        task: task.type,
        predicted: predictedDuration,
        actual: actualDuration,
        error: error
      });
    }
  }
  
  /**
   * Update system load
   */
  updateSystemLoad(metrics) {
    this.loadTracker.updateLoad(metrics);
    
    // Invalidate cache if load changed significantly
    const loadFactor = this.loadTracker.getLoadFactor();
    if (Math.abs(loadFactor - this.lastLoadFactor) > 0.2) {
      this.clearCache();
      this.lastLoadFactor = loadFactor;
    }
  }
  
  /**
   * Update specialist load
   */
  updateSpecialistLoad(specialistId, load) {
    this.loadTracker.updateSpecialistLoad(specialistId, load);
  }
  
  /**
   * Get cache key
   */
  getCacheKey(task, specialist) {
    return `${specialist.id}:${task.type || 'general'}:${task.complexity || 0.5}`;
  }
  
  /**
   * Get cached prediction
   */
  getCachedPrediction(key) {
    const cached = this.predictionCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }
    
    return null;
  }
  
  /**
   * Cache prediction
   */
  cachePrediction(key, prediction) {
    if (!this.config.enableCache) return;
    
    this.predictionCache.set(key, {
      data: prediction,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.predictionCache.size > this.config.cacheSize) {
      const firstKey = this.predictionCache.keys().next().value;
      this.predictionCache.delete(firstKey);
    }
  }
  
  /**
   * Start background processes
   */
  startBackgroundProcesses() {
    // Model update interval
    this.modelUpdateInterval = setInterval(() => {
      this.updateModels();
    }, this.config.modelUpdateInterval);
    
    // Load tracking interval
    if (this.config.loadImpactEnabled) {
      this.loadUpdateInterval = setInterval(() => {
        this.monitorLoad();
      }, this.config.loadUpdateInterval);
    }
    
    logger.debug('Background processes started');
  }
  
  /**
   * Stop background processes
   */
  stopBackgroundProcesses() {
    if (this.modelUpdateInterval) {
      clearInterval(this.modelUpdateInterval);
    }
    
    if (this.loadUpdateInterval) {
      clearInterval(this.loadUpdateInterval);
    }
    
    logger.debug('Background processes stopped');
  }
  
  /**
   * Update models periodically
   */
  updateModels() {
    for (const model of this.models.values()) {
      // Remove old samples
      const cutoff = Date.now() - this.config.sampleRetentionTime;
      model.samples = model.samples.filter(s => s.timestamp > cutoff);
      
      // Update statistics
      if (model.samples.length > 0) {
        model.updateStatistics();
      }
    }
  }
  
  /**
   * Monitor system load
   */
  monitorLoad() {
    // This would integrate with actual system monitoring
    // For now, simulate with random values
    const metrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      activeTasks: Math.floor(Math.random() * 20),
      queuedTasks: Math.floor(Math.random() * 50)
    };
    
    this.updateSystemLoad(metrics);
  }
  
  /**
   * Get predictor status
   */
  getStatus() {
    const accuracy = this.statistics.totalPredictions > 0
      ? this.statistics.accuratePredictions / this.statistics.totalPredictions
      : 0;
    
    return {
      models: {
        total: this.models.size,
        withData: Array.from(this.models.values()).filter(m => m.samples.length > 0).length
      },
      statistics: {
        ...this.statistics,
        accuracy: `${(accuracy * 100).toFixed(1)}%`,
        averageError: `${(this.statistics.averageError * 100).toFixed(1)}%`
      },
      load: this.loadTracker.getSystemLoad(),
      cache: {
        size: this.predictionCache.size,
        hitRate: this.statistics.cacheHits / 
                 (this.statistics.cacheHits + this.statistics.cacheMisses) || 0
      },
      config: {
        learning: this.config.enableLearning,
        loadImpact: this.config.loadImpactEnabled,
        percentile: this.config.defaultPercentile
      }
    };
  }
  
  /**
   * Get performance report
   */
  getPerformanceReport(specialistId = null, taskType = null) {
    const report = {
      timestamp: Date.now(),
      models: [],
      summary: {
        totalModels: 0,
        averageSamples: 0,
        averageConfidence: 0,
        predictedTasks: {}
      }
    };
    
    for (const [key, model] of this.models) {
      if (specialistId && !key.startsWith(specialistId)) continue;
      if (taskType && !key.endsWith(taskType)) continue;
      
      report.models.push({
        key,
        specialistId: model.specialistId,
        taskType: model.taskType,
        samples: model.samples.length,
        confidence: model.confidence,
        statistics: model.statistics,
        lastUpdated: model.lastUpdated
      });
      
      report.summary.totalModels++;
      report.summary.averageSamples += model.samples.length;
      report.summary.averageConfidence += model.confidence;
      
      if (!report.summary.predictedTasks[model.taskType]) {
        report.summary.predictedTasks[model.taskType] = 0;
      }
      report.summary.predictedTasks[model.taskType]++;
    }
    
    if (report.summary.totalModels > 0) {
      report.summary.averageSamples /= report.summary.totalModels;
      report.summary.averageConfidence /= report.summary.totalModels;
    }
    
    return report;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.predictionCache.clear();
    logger.info('Prediction cache cleared');
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalPredictions: 0,
      accuratePredictions: 0,
      averageError: 0,
      cacheHits: 0,
      cacheMisses: 0,
      modelsCreated: 0,
      samplesCollected: 0
    };
    
    logger.info('Statistics reset');
  }
  
  /**
   * Export models for backup
   */
  exportModels() {
    const exported = {
      timestamp: Date.now(),
      models: {},
      historicalData: this.historicalData
    };
    
    for (const [key, model] of this.models) {
      exported.models[key] = {
        specialistId: model.specialistId,
        taskType: model.taskType,
        samples: model.samples,
        statistics: model.statistics,
        confidence: model.confidence
      };
    }
    
    return exported;
  }
  
  /**
   * Import models from backup
   */
  importModels(data) {
    try {
      // Import models
      for (const [key, modelData] of Object.entries(data.models)) {
        const model = new PerformanceModel(modelData.specialistId, modelData.taskType);
        model.samples = modelData.samples;
        model.statistics = modelData.statistics;
        model.confidence = modelData.confidence;
        this.models.set(key, model);
      }
      
      // Import historical data
      if (data.historicalData) {
        this.historicalData = data.historicalData;
      }
      
      logger.info(`Imported ${Object.keys(data.models).length} models`);
      return true;
      
    } catch (error) {
      logger.error('Failed to import models:', error);
      return false;
    }
  }
  
  /**
   * Shutdown predictor
   */
  shutdown() {
    logger.info('Shutting down Performance Predictor...');
    
    this.stopBackgroundProcesses();
    this.clearCache();
    this.removeAllListeners();
    
    logger.info('Performance Predictor shutdown complete');
  }
}

module.exports = {
  PerformancePredictor,
  PerformanceModel,
  LoadTracker
};