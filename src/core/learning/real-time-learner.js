/**
 * BUMBA Real-Time Learner
 * Continuous learning during interactions with online algorithms
 * Part of Human Learning Module Enhancement - Sprint 2
 * 
 * FRAMEWORK DESIGN:
 * - Online learning algorithms
 * - Incremental model updates
 * - Stream processing capabilities
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Check for ML library availability
let tf = null;
try {
  tf = require('@tensorflow/tfjs-node');
  logger.info('🔄 TensorFlow.js connected for real-time learning');
} catch (error) {
  logger.info('🟢 Using incremental learning algorithms');
}

/**
 * Real-Time Learner for continuous adaptation
 */
class RealTimeLearner extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      learningRate: config.learningRate || 0.01,
      adaptationSpeed: config.adaptationSpeed || 0.1,
      batchSize: config.batchSize || 1,
      windowSize: config.windowSize || 100,
      updateThreshold: config.updateThreshold || 0.05,
      forgettingFactor: config.forgettingFactor || 0.95,
      minSamples: config.minSamples || 10,
      maxMemory: config.maxMemory || 1000,
      ...config
    };
    
    // Learning streams
    this.streams = {
      preference: new LearningStream('preference'),
      behavior: new LearningStream('behavior'),
      feedback: new LearningStream('feedback'),
      context: new LearningStream('context')
    };
    
    // Online models
    this.onlineModels = {
      sgd: null,           // Stochastic Gradient Descent
      perceptron: null,    // Online Perceptron
      passive: null,       // Passive-Aggressive
      adaptive: null       // Adaptive learning
    };
    
    // Incremental statistics
    this.statistics = {
      mean: new Map(),
      variance: new Map(),
      covariance: new Map(),
      weights: new Map()
    };
    
    // Learning buffer
    this.buffer = [];
    this.processedSamples = 0;
    
    // Metrics
    this.metrics = {
      samplesProcessed: 0,
      updatesApplied: 0,
      learningSpeed: 0,
      adaptationRate: 0,
      convergence: 0
    };
    
    this.mode = tf ? 'neural-online' : 'incremental';
    this.isLearning = true;
    
    this.initialize();
  }
  
  /**
   * Initialize real-time learner
   */
  async initialize() {
    try {
      if (this.mode === 'neural-online') {
        await this.createOnlineNeuralModels();
      } else {
        await this.createIncrementalModels();
      }
      
      // Start learning loop
      this.startLearningLoop();
      
      logger.info(`🟢 Real-Time Learner initialized (${this.mode} mode)`);
      
      this.emit('initialized', {
        mode: this.mode,
        streams: Object.keys(this.streams),
        models: Object.keys(this.onlineModels)
      });
      
    } catch (error) {
      logger.error('Failed to initialize Real-Time Learner:', error);
    }
  }
  
  /**
   * Create online neural models
   */
  async createOnlineNeuralModels() {
    if (!tf) {
      return this.createIncrementalModels();
    }
    
    // Stochastic Gradient Descent model
    this.onlineModels.sgd = {
      weights: tf.variable(tf.randomNormal([64, 32])),
      bias: tf.variable(tf.zeros([32])),
      optimizer: tf.train.sgd(this.config.learningRate),
      
      update: (input, target) => {
        const loss = tf.tidy(() => {
          const predicted = tf.sigmoid(
            tf.add(tf.matMul(input, this.onlineModels.sgd.weights),
                   this.onlineModels.sgd.bias)
          );
          return tf.losses.meanSquaredError(target, predicted);
        });
        
        this.onlineModels.sgd.optimizer.minimize(() => loss);
        return loss.dataSync()[0];
      }
    };
    
    logger.info('Online neural models created');
  }
  
  /**
   * Create incremental learning models
   */
  async createIncrementalModels() {
    // Online Perceptron
    this.onlineModels.perceptron = new OnlinePerceptron(this.config);
    
    // Passive-Aggressive Classifier
    this.onlineModels.passive = new PassiveAggressive(this.config);
    
    // Adaptive Filter
    this.onlineModels.adaptive = new AdaptiveFilter(this.config);
    
    // SGD (non-neural)
    this.onlineModels.sgd = new IncrementalSGD(this.config);
    
    logger.info('Incremental learning models created');
  }
  
  /**
   * Process incoming data in real-time
   */
  async learn(data, immediate = true) {
    const startTime = Date.now();
    
    try {
      // Add to buffer
      this.buffer.push({
        data,
        timestamp: Date.now(),
        processed: false
      });
      
      // Maintain buffer size
      if (this.buffer.length > this.config.maxMemory) {
        this.buffer.shift();
      }
      
      // Process immediately or batch
      if (immediate || this.buffer.length >= this.config.batchSize) {
        await this.processBatch();
      }
      
      // Update statistics
      this.updateStatistics(data);
      
      // Check for concept drift
      const drift = this.detectConceptDrift();
      if (drift.detected) {
        await this.handleConceptDrift(drift);
      }
      
      // Update metrics
      this.metrics.samplesProcessed++;
      this.metrics.learningSpeed = 1000 / (Date.now() - startTime);
      
      this.emit('sample-learned', {
        data,
        metrics: this.getMetrics(),
        drift
      });
      
      return {
        success: true,
        processingTime: Date.now() - startTime,
        drift
      };
      
    } catch (error) {
      logger.error('Real-time learning failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process batch of samples
   */
  async processBatch() {
    const unprocessed = this.buffer.filter(item => !item.processed);
    
    if (unprocessed.length === 0) return;
    
    // Extract features and targets
    const batch = unprocessed.map(item => ({
      features: this.extractFeatures(item.data),
      target: this.extractTarget(item.data)
    }));
    
    // Update each model
    for (const [name, model] of Object.entries(this.onlineModels)) {
      if (model && typeof model.update === 'function') {
        try {
          const loss = await model.update(batch);
          this.trackModelPerformance(name, loss);
        } catch (error) {
          logger.error(`Model ${name} update failed:`, error);
        }
      }
    }
    
    // Update stream processors
    for (const stream of Object.values(this.streams)) {
      stream.process(unprocessed.map(item => item.data));
    }
    
    // Mark as processed
    unprocessed.forEach(item => {
      item.processed = true;
    });
    
    this.metrics.updatesApplied++;
    
    this.emit('batch-processed', {
      size: unprocessed.length,
      models: Object.keys(this.onlineModels)
    });
  }
  
  /**
   * Update incremental statistics
   */
  updateStatistics(data) {
    const features = this.extractFeatures(data);
    
    // Update mean (Welford's algorithm)
    features.forEach((value, index) => {
      const key = `feature_${index}`;
      const n = this.processedSamples + 1;
      const oldMean = this.statistics.mean.get(key) || 0;
      const newMean = oldMean + (value - oldMean) / n;
      
      this.statistics.mean.set(key, newMean);
      
      // Update variance
      const oldVariance = this.statistics.variance.get(key) || 0;
      const newVariance = oldVariance + (value - oldMean) * (value - newMean);
      this.statistics.variance.set(key, newVariance);
    });
    
    this.processedSamples++;
  }
  
  /**
   * Detect concept drift
   */
  detectConceptDrift() {
    if (this.processedSamples < this.config.minSamples * 2) {
      return { detected: false };
    }
    
    // Page-Hinkley test for drift detection
    const threshold = 0.1;
    let driftScore = 0;
    
    for (const [key, variance] of this.statistics.variance) {
      const mean = this.statistics.mean.get(key) || 0;
      const normalizedVariance = variance / this.processedSamples;
      
      // Check if distribution has changed significantly
      if (normalizedVariance > mean * threshold) {
        driftScore++;
      }
    }
    
    const driftRatio = driftScore / this.statistics.variance.size;
    
    return {
      detected: driftRatio > 0.3,
      severity: driftRatio,
      type: driftRatio > 0.5 ? 'sudden' : 'gradual'
    };
  }
  
  /**
   * Handle concept drift
   */
  async handleConceptDrift(drift) {
    logger.warn(`Concept drift detected: ${drift.type} (severity: ${drift.severity.toFixed(2)})`);
    
    if (drift.type === 'sudden') {
      // Reset models for sudden drift
      await this.resetModels();
    } else {
      // Increase learning rate for gradual drift
      this.adjustLearningRate(this.config.learningRate * 1.5);
    }
    
    this.emit('concept-drift', drift);
  }
  
  /**
   * Predict in real-time
   */
  async predict(data) {
    const features = this.extractFeatures(data);
    const predictions = {};
    
    // Get predictions from each model
    for (const [name, model] of Object.entries(this.onlineModels)) {
      if (model && typeof model.predict === 'function') {
        try {
          predictions[name] = await model.predict(features);
        } catch (error) {
          predictions[name] = null;
        }
      }
    }
    
    // Ensemble prediction
    const ensemble = this.ensemblePredictions(predictions);
    
    return {
      individual: predictions,
      ensemble,
      confidence: this.calculatePredictionConfidence(predictions)
    };
  }
  
  /**
   * Apply learned adaptations
   */
  async applyAdaptations() {
    const adaptations = [];
    
    // Generate adaptations from statistics
    for (const [key, mean] of this.statistics.mean) {
      const variance = this.statistics.variance.get(key) || 0;
      const std = Math.sqrt(variance / Math.max(1, this.processedSamples));
      
      if (std < this.config.updateThreshold) {
        // Stable feature, can adapt
        adaptations.push({
          feature: key,
          value: mean,
          confidence: 1 - std,
          type: 'stable'
        });
      }
    }
    
    // Apply adaptations with forgetting factor
    adaptations.forEach(adaptation => {
      const currentWeight = this.statistics.weights.get(adaptation.feature) || 0;
      const newWeight = currentWeight * this.config.forgettingFactor + 
                       adaptation.value * (1 - this.config.forgettingFactor);
      
      this.statistics.weights.set(adaptation.feature, newWeight);
    });
    
    this.metrics.adaptationRate = adaptations.length / this.statistics.mean.size;
    
    this.emit('adaptations-applied', adaptations);
    
    return adaptations;
  }
  
  /**
   * Get real-time insights
   */
  getInsights() {
    const insights = {
      learningProgress: this.calculateLearningProgress(),
      convergence: this.calculateConvergence(),
      stability: this.calculateStability(),
      patterns: this.identifyPatterns(),
      recommendations: this.generateRecommendations()
    };
    
    return insights;
  }
  
  /**
   * Start learning loop
   */
  startLearningLoop() {
    setInterval(async () => {
      if (!this.isLearning) return;
      
      // Process pending batches
      if (this.buffer.filter(b => !b.processed).length > 0) {
        await this.processBatch();
      }
      
      // Apply adaptations periodically
      if (this.processedSamples % this.config.windowSize === 0) {
        await this.applyAdaptations();
      }
      
      // Calculate convergence
      this.metrics.convergence = this.calculateConvergence();
      
    }, 100); // 100ms update cycle
  }
  
  // Helper methods
  
  extractFeatures(data) {
    const features = [];
    
    // Extract numeric features
    const extract = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'number') {
          features.push(value);
        } else if (typeof value === 'boolean') {
          features.push(value ? 1 : 0);
        } else if (typeof value === 'object' && value !== null) {
          extract(value, `${prefix}${key}.`);
        }
      });
    };
    
    extract(data);
    
    // Pad to fixed size
    while (features.length < 64) {
      features.push(0);
    }
    
    return features.slice(0, 64);
  }
  
  extractTarget(data) {
    // Extract target value for supervised learning
    if (data.target !== undefined) {
      return Array.isArray(data.target) ? data.target : [data.target];
    }
    
    if (data.label !== undefined) {
      return Array.isArray(data.label) ? data.label : [data.label];
    }
    
    // Unsupervised, use features as target (autoencoder style)
    return this.extractFeatures(data).slice(0, 32);
  }
  
  trackModelPerformance(modelName, loss) {
    // Track model-specific metrics
    if (!this.modelMetrics) {
      this.modelMetrics = new Map();
    }
    
    const metrics = this.modelMetrics.get(modelName) || {
      losses: [],
      avgLoss: 0
    };
    
    metrics.losses.push(loss);
    if (metrics.losses.length > 100) {
      metrics.losses.shift();
    }
    
    metrics.avgLoss = metrics.losses.reduce((a, b) => a + b, 0) / metrics.losses.length;
    
    this.modelMetrics.set(modelName, metrics);
  }
  
  ensemblePredictions(predictions) {
    const validPredictions = Object.values(predictions).filter(p => p !== null);
    
    if (validPredictions.length === 0) {
      return null;
    }
    
    // Average ensemble
    const ensemble = validPredictions[0].map((_, index) => {
      const values = validPredictions.map(p => p[index] || 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    return ensemble;
  }
  
  calculatePredictionConfidence(predictions) {
    const validPredictions = Object.values(predictions).filter(p => p !== null);
    
    if (validPredictions.length === 0) {
      return 0;
    }
    
    // Calculate agreement between models
    const variance = validPredictions[0].map((_, index) => {
      const values = validPredictions.map(p => p[index] || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
    });
    
    const avgVariance = variance.reduce((a, b) => a + b, 0) / variance.length;
    
    // Lower variance = higher confidence
    return Math.max(0, 1 - avgVariance);
  }
  
  calculateLearningProgress() {
    if (this.processedSamples < this.config.minSamples) {
      return this.processedSamples / this.config.minSamples;
    }
    
    // Based on convergence rate
    return Math.min(1, this.metrics.convergence);
  }
  
  calculateConvergence() {
    if (!this.modelMetrics || this.modelMetrics.size === 0) {
      return 0;
    }
    
    // Check if losses are decreasing
    let converging = 0;
    
    for (const metrics of this.modelMetrics.values()) {
      if (metrics.losses.length < 10) continue;
      
      const recent = metrics.losses.slice(-5);
      const older = metrics.losses.slice(-10, -5);
      
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (recentAvg < olderAvg) {
        converging++;
      }
    }
    
    return converging / Math.max(1, this.modelMetrics.size);
  }
  
  calculateStability() {
    // Check variance stability
    let stableFeatures = 0;
    
    for (const [key, variance] of this.statistics.variance) {
      const normalizedVariance = variance / Math.max(1, this.processedSamples);
      if (normalizedVariance < 0.1) {
        stableFeatures++;
      }
    }
    
    return stableFeatures / Math.max(1, this.statistics.variance.size);
  }
  
  identifyPatterns() {
    const patterns = [];
    
    // Identify correlated features
    for (const [key1, mean1] of this.statistics.mean) {
      for (const [key2, mean2] of this.statistics.mean) {
        if (key1 >= key2) continue;
        
        const correlation = this.calculateCorrelation(key1, key2);
        if (Math.abs(correlation) > 0.7) {
          patterns.push({
            type: 'correlation',
            features: [key1, key2],
            strength: correlation
          });
        }
      }
    }
    
    return patterns;
  }
  
  calculateCorrelation(key1, key2) {
    // Simplified correlation calculation
    const mean1 = this.statistics.mean.get(key1) || 0;
    const mean2 = this.statistics.mean.get(key2) || 0;
    
    // Use covariance if available
    const covKey = `${key1}-${key2}`;
    const covariance = this.statistics.covariance.get(covKey) || 0;
    
    const var1 = this.statistics.variance.get(key1) || 1;
    const var2 = this.statistics.variance.get(key2) || 1;
    
    return covariance / Math.sqrt(var1 * var2);
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.convergence < 0.5) {
      recommendations.push('Continue learning for better convergence');
    }
    
    if (this.metrics.adaptationRate < 0.3) {
      recommendations.push('Consider increasing adaptation speed');
    }
    
    const stability = this.calculateStability();
    if (stability > 0.8) {
      recommendations.push('Model is stable, can reduce learning rate');
    }
    
    return recommendations;
  }
  
  adjustLearningRate(newRate) {
    this.config.learningRate = newRate;
    
    // Update model learning rates
    for (const model of Object.values(this.onlineModels)) {
      if (model && model.setLearningRate) {
        model.setLearningRate(newRate);
      }
    }
    
    logger.info(`Learning rate adjusted to ${newRate}`);
  }
  
  async resetModels() {
    // Reinitialize models
    if (this.mode === 'neural-online') {
      await this.createOnlineNeuralModels();
    } else {
      await this.createIncrementalModels();
    }
    
    // Clear statistics but keep some history
    const recentMean = new Map(this.statistics.mean);
    this.statistics.mean.clear();
    this.statistics.variance.clear();
    
    // Keep 50% of previous knowledge
    for (const [key, value] of recentMean) {
      this.statistics.mean.set(key, value * 0.5);
    }
    
    logger.info('Models reset due to concept drift');
  }
  
  /**
   * Pause/resume learning
   */
  pauseLearning() {
    this.isLearning = false;
    logger.info('Real-time learning paused');
  }
  
  resumeLearning() {
    this.isLearning = true;
    logger.info('Real-time learning resumed');
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      mode: this.mode,
      bufferSize: this.buffer.length,
      processedSamples: this.processedSamples,
      isLearning: this.isLearning,
      stability: this.calculateStability()
    };
  }
}

/**
 * Learning Stream for continuous data processing
 */
class LearningStream {
  constructor(name) {
    this.name = name;
    this.data = [];
    this.windowSize = 100;
  }
  
  process(samples) {
    this.data.push(...samples);
    
    // Maintain window
    if (this.data.length > this.windowSize) {
      this.data = this.data.slice(-this.windowSize);
    }
  }
  
  getStatistics() {
    // Calculate stream statistics
    return {
      count: this.data.length,
      name: this.name
    };
  }
}

/**
 * Online Perceptron implementation
 */
class OnlinePerceptron {
  constructor(config) {
    this.weights = new Array(64).fill(0);
    this.bias = 0;
    this.learningRate = config.learningRate;
  }
  
  update(batch) {
    let totalLoss = 0;
    
    for (const { features, target } of batch) {
      const prediction = this.predict(features);
      const error = (target[0] || 0) - prediction[0];
      
      // Update weights
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i] += this.learningRate * error * (features[i] || 0);
      }
      
      this.bias += this.learningRate * error;
      totalLoss += Math.abs(error);
    }
    
    return totalLoss / batch.length;
  }
  
  predict(features) {
    let sum = this.bias;
    
    for (let i = 0; i < Math.min(features.length, this.weights.length); i++) {
      sum += features[i] * this.weights[i];
    }
    
    return [sum > 0 ? 1 : 0];
  }
  
  setLearningRate(rate) {
    this.learningRate = rate;
  }
}

/**
 * Passive-Aggressive Classifier
 */
class PassiveAggressive {
  constructor(config) {
    this.weights = new Array(64).fill(0);
    this.aggressiveness = config.aggressiveness || 1.0;
  }
  
  update(batch) {
    let totalLoss = 0;
    
    for (const { features, target } of batch) {
      const prediction = this.predict(features);
      const loss = Math.max(0, 1 - (target[0] || 0) * prediction[0]);
      
      if (loss > 0) {
        // Calculate update magnitude
        const normSquared = features.reduce((sum, f) => sum + f * f, 0);
        const tau = Math.min(this.aggressiveness, loss / normSquared);
        
        // Update weights
        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] += tau * (target[0] || 0) * (features[i] || 0);
        }
      }
      
      totalLoss += loss;
    }
    
    return totalLoss / batch.length;
  }
  
  predict(features) {
    let sum = 0;
    
    for (let i = 0; i < Math.min(features.length, this.weights.length); i++) {
      sum += features[i] * this.weights[i];
    }
    
    return [sum];
  }
}

/**
 * Adaptive Filter (LMS algorithm)
 */
class AdaptiveFilter {
  constructor(config) {
    this.weights = new Array(64).fill(0);
    this.mu = config.adaptationSpeed || 0.01;
    this.history = [];
  }
  
  update(batch) {
    let totalError = 0;
    
    for (const { features, target } of batch) {
      const prediction = this.predict(features);
      const error = (target[0] || 0) - prediction[0];
      
      // LMS update rule
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i] += this.mu * error * (features[i] || 0);
      }
      
      totalError += error * error;
    }
    
    return Math.sqrt(totalError / batch.length);
  }
  
  predict(features) {
    let sum = 0;
    
    for (let i = 0; i < Math.min(features.length, this.weights.length); i++) {
      sum += features[i] * this.weights[i];
    }
    
    return [sum];
  }
}

/**
 * Incremental SGD
 */
class IncrementalSGD {
  constructor(config) {
    this.weights = new Array(64).fill(0).map(() => Math.random() * 0.1);
    this.learningRate = config.learningRate;
    this.momentum = new Array(64).fill(0);
    this.momentumFactor = 0.9;
  }
  
  update(batch) {
    let totalLoss = 0;
    
    for (const { features, target } of batch) {
      const prediction = this.predict(features);
      const error = (target[0] || 0) - prediction[0];
      
      // SGD with momentum
      for (let i = 0; i < this.weights.length; i++) {
        const gradient = -error * (features[i] || 0);
        this.momentum[i] = this.momentumFactor * this.momentum[i] + 
                          (1 - this.momentumFactor) * gradient;
        this.weights[i] -= this.learningRate * this.momentum[i];
      }
      
      totalLoss += error * error;
    }
    
    return totalLoss / batch.length;
  }
  
  predict(features) {
    let sum = 0;
    
    for (let i = 0; i < Math.min(features.length, this.weights.length); i++) {
      sum += features[i] * this.weights[i];
    }
    
    // Sigmoid activation
    return [1 / (1 + Math.exp(-sum))];
  }
  
  setLearningRate(rate) {
    this.learningRate = rate;
  }
}

module.exports = RealTimeLearner;