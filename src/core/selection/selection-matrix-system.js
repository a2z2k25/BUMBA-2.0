/**
 * Complete Selection Matrix System
 * Integrates all components: Weight Calculator, Decision Engine, History Tracker,
 * Learning System, Matrix Optimizer, Confidence Calculator, Visualizer, and Integration Layer
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { SelectionMatrix } = require('./matrix-foundation');
const { ScoringEngine } = require('./scoring-engine');

/**
 * Sprint 3.3: Weight Calculator
 */
class WeightCalculator {
  constructor(config = {}) {
    this.weights = new Map();
    this.dynamicWeights = config.dynamicWeights !== false;
    this.baseWeights = config.baseWeights || {
      task: 1.0,
      specialist: 1.0,
      context: 0.8,
      quality: 0.9
    };
    this.adjustmentHistory = [];
  }
  
  calculateWeights(inputs, context) {
    const weights = { ...this.baseWeights };
    
    if (this.dynamicWeights) {
      // Adjust weights based on context
      if (context.urgency > 0.8) {
        weights.specialist *= 1.2; // Prioritize specialist availability
        weights.quality *= 0.8;    // Reduce quality requirements
      }
      
      if (context.systemLoad > 0.7) {
        weights.context *= 1.3;     // Context becomes more important
        weights.task *= 0.9;        // Task specifics less important
      }
      
      if (context.projectPhase === 'production') {
        weights.quality *= 1.5;     // Quality is critical
        weights.specialist *= 1.2;  // Experience matters more
      }
    }
    
    // Normalize weights
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    for (const key in weights) {
      weights[key] /= total;
    }
    
    this.recordAdjustment(weights, context);
    return weights;
  }
  
  recordAdjustment(weights, context) {
    this.adjustmentHistory.push({
      weights,
      context,
      timestamp: Date.now()
    });
    
    // Keep only recent history
    if (this.adjustmentHistory.length > 100) {
      this.adjustmentHistory.shift();
    }
  }
  
  learnFromOutcomes(outcomes) {
    // Analyze outcomes to adjust base weights
    for (const outcome of outcomes) {
      if (outcome.success) {
        // Increase weights that contributed to success
        for (const [key, contribution] of Object.entries(outcome.contributions)) {
          this.baseWeights[key] = Math.min(2.0, this.baseWeights[key] * (1 + contribution * 0.1));
        }
      }
    }
  }
}

/**
 * Sprint 3.4: Decision Engine
 */
class DecisionEngine {
  constructor(config = {}) {
    this.thresholds = {
      accept: config.acceptThreshold || 0.7,
      reject: config.rejectThreshold || 0.3,
      review: config.reviewThreshold || 0.5
    };
    this.decisionHistory = [];
    this.strategies = new Map();
  }
  
  makeDecision(score, confidence, context = {}) {
    // Adjust thresholds based on confidence
    const adjustedAccept = this.thresholds.accept * (0.8 + confidence * 0.2);
    const adjustedReject = this.thresholds.reject * (1.2 - confidence * 0.2);
    
    let decision = {
      action: 'review',
      score,
      confidence,
      reasoning: [],
      timestamp: Date.now()
    };
    
    // Primary decision logic
    if (score >= adjustedAccept && confidence >= 0.5) {
      decision.action = 'accept';
      decision.reasoning.push('Score exceeds acceptance threshold');
    } else if (score <= adjustedReject || confidence < 0.2) {
      decision.action = 'reject';
      decision.reasoning.push('Score below rejection threshold or low confidence');
    } else {
      decision.action = 'review';
      decision.reasoning.push('Score in review range');
    }
    
    // Apply context-based overrides
    if (context.critical && decision.action !== 'accept') {
      decision.action = 'escalate';
      decision.reasoning.push('Critical context requires escalation');
    }
    
    if (context.lowPriority && decision.action === 'review') {
      decision.action = 'defer';
      decision.reasoning.push('Low priority allows deferral');
    }
    
    this.recordDecision(decision);
    return decision;
  }
  
  recordDecision(decision) {
    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory.shift();
    }
  }
  
  getDecisionStats() {
    const stats = {
      total: this.decisionHistory.length,
      accept: 0,
      reject: 0,
      review: 0,
      escalate: 0,
      defer: 0
    };
    
    for (const decision of this.decisionHistory) {
      stats[decision.action]++;
    }
    
    return stats;
  }
}

/**
 * Sprint 3.5: History Tracker
 */
class HistoryTracker {
  constructor(config = {}) {
    this.maxHistorySize = config.maxHistorySize || 10000;
    this.history = [];
    this.indices = new Map(); // For fast lookups
    this.aggregates = new Map(); // Cached aggregations
  }
  
  record(entry) {
    const timestampedEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    
    this.history.push(timestampedEntry);
    this.updateIndices(timestampedEntry);
    
    // Maintain size limit
    if (this.history.length > this.maxHistorySize) {
      const removed = this.history.shift();
      this.removeFromIndices(removed);
    }
    
    return timestampedEntry.id;
  }
  
  updateIndices(entry) {
    // Index by type
    if (!this.indices.has(entry.type)) {
      this.indices.set(entry.type, new Set());
    }
    this.indices.get(entry.type).add(entry.id);
    
    // Index by specialist if present
    if (entry.specialistId) {
      const key = `specialist:${entry.specialistId}`;
      if (!this.indices.has(key)) {
        this.indices.set(key, new Set());
      }
      this.indices.get(key).add(entry.id);
    }
  }
  
  removeFromIndices(entry) {
    // Remove from type index
    const typeIndex = this.indices.get(entry.type);
    if (typeIndex) {
      typeIndex.delete(entry.id);
    }
    
    // Remove from specialist index
    if (entry.specialistId) {
      const key = `specialist:${entry.specialistId}`;
      const specialistIndex = this.indices.get(key);
      if (specialistIndex) {
        specialistIndex.delete(entry.id);
      }
    }
  }
  
  query(filters = {}) {
    let results = [...this.history];
    
    if (filters.type) {
      results = results.filter(e => e.type === filters.type);
    }
    
    if (filters.startTime) {
      results = results.filter(e => e.timestamp >= filters.startTime);
    }
    
    if (filters.endTime) {
      results = results.filter(e => e.timestamp <= filters.endTime);
    }
    
    if (filters.minScore !== undefined) {
      results = results.filter(e => e.score >= filters.minScore);
    }
    
    return results;
  }
  
  getStatistics(window = 3600000) {
    const cutoff = Date.now() - window;
    const recent = this.history.filter(e => e.timestamp > cutoff);
    
    return {
      total: recent.length,
      avgScore: recent.reduce((sum, e) => sum + (e.score || 0), 0) / recent.length,
      avgConfidence: recent.reduce((sum, e) => sum + (e.confidence || 0), 0) / recent.length,
      successRate: recent.filter(e => e.success).length / recent.length
    };
  }
}

/**
 * Sprint 3.6: Learning System
 */
class LearningSystem {
  constructor(config = {}) {
    this.learningRate = config.learningRate || 0.1;
    this.models = new Map();
    this.feedback = [];
    this.improvements = [];
  }
  
  learn(example) {
    const { inputs, output, success } = example;
    const modelKey = this.getModelKey(inputs);
    
    if (!this.models.has(modelKey)) {
      this.models.set(modelKey, {
        samples: [],
        weights: {},
        accuracy: 0
      });
    }
    
    const model = this.models.get(modelKey);
    model.samples.push({ inputs, output, success });
    
    // Update weights based on success
    if (success) {
      this.updateWeights(model, inputs, 1.0);
    } else {
      this.updateWeights(model, inputs, -0.5);
    }
    
    // Recalculate accuracy
    this.updateAccuracy(model);
    
    // Trim old samples
    if (model.samples.length > 100) {
      model.samples.shift();
    }
  }
  
  updateWeights(model, inputs, adjustment) {
    for (const [key, value] of Object.entries(inputs)) {
      if (!model.weights[key]) {
        model.weights[key] = 0;
      }
      model.weights[key] += adjustment * this.learningRate * value;
      model.weights[key] = Math.max(-1, Math.min(1, model.weights[key]));
    }
  }
  
  updateAccuracy(model) {
    if (model.samples.length === 0) {
      model.accuracy = 0;
      return;
    }
    
    const successful = model.samples.filter(s => s.success).length;
    model.accuracy = successful / model.samples.length;
  }
  
  predict(inputs) {
    const modelKey = this.getModelKey(inputs);
    const model = this.models.get(modelKey);
    
    if (!model || model.samples.length < 5) {
      return null; // Not enough data
    }
    
    let prediction = 0.5; // Base prediction
    
    for (const [key, value] of Object.entries(inputs)) {
      if (model.weights[key]) {
        prediction += model.weights[key] * value;
      }
    }
    
    return {
      value: Math.max(0, Math.min(1, prediction)),
      confidence: model.accuracy,
      samples: model.samples.length
    };
  }
  
  getModelKey(inputs) {
    // Create a simplified key from inputs
    const keys = [];
    if (inputs.taskType) keys.push(`task:${inputs.taskType}`);
    if (inputs.specialistType) keys.push(`spec:${inputs.specialistType}`);
    if (inputs.department) keys.push(`dept:${inputs.department}`);
    return keys.join('|') || 'general';
  }
  
  recordFeedback(id, success, details = {}) {
    this.feedback.push({
      id,
      success,
      details,
      timestamp: Date.now()
    });
    
    // Analyze feedback for improvements
    this.analyzeForImprovements();
  }
  
  analyzeForImprovements() {
    const recentFeedback = this.feedback.slice(-100);
    const successRate = recentFeedback.filter(f => f.success).length / recentFeedback.length;
    
    if (successRate < 0.7) {
      this.improvements.push({
        type: 'low_success_rate',
        value: successRate,
        suggestion: 'Consider adjusting selection criteria',
        timestamp: Date.now()
      });
    }
  }
}

/**
 * Sprint 3.7: Matrix Optimizer
 */
class MatrixOptimizer {
  constructor(config = {}) {
    this.optimizationInterval = config.optimizationInterval || 300000; // 5 minutes
    this.lastOptimization = Date.now();
    this.optimizationHistory = [];
  }
  
  optimize(matrix, performance) {
    const optimization = {
      timestamp: Date.now(),
      changes: [],
      metrics: {}
    };
    
    // Analyze current performance
    const analysis = this.analyzePerformance(performance);
    
    // Optimize based on analysis
    if (analysis.lowConfidenceCells > 0.3) {
      this.pruneLowConfidence(matrix);
      optimization.changes.push('Pruned low confidence cells');
    }
    
    if (analysis.cacheHitRate < 0.5) {
      this.optimizeCache(matrix);
      optimization.changes.push('Optimized cache');
    }
    
    if (analysis.avgResponseTime > 100) {
      this.reduceComplexity(matrix);
      optimization.changes.push('Reduced matrix complexity');
    }
    
    // Record optimization
    optimization.metrics = {
      cellsPruned: analysis.cellsPruned || 0,
      cacheOptimized: analysis.cacheHitRate < 0.5,
      complexityReduced: analysis.avgResponseTime > 100
    };
    
    this.optimizationHistory.push(optimization);
    this.lastOptimization = Date.now();
    
    return optimization;
  }
  
  analyzePerformance(performance) {
    return {
      lowConfidenceCells: performance.lowConfidenceCells || 0,
      cacheHitRate: performance.cacheHitRate || 0,
      avgResponseTime: performance.avgResponseTime || 0,
      totalCells: performance.totalCells || 0
    };
  }
  
  pruneLowConfidence(matrix) {
    for (const layer of matrix.layers.values()) {
      layer.prune(0.1);
    }
  }
  
  optimizeCache(matrix) {
    matrix.lookupCache.clear();
    matrix.cacheSize = Math.min(500, matrix.cacheSize * 1.5);
  }
  
  reduceComplexity(matrix) {
    // Reduce number of active layers
    const layers = Array.from(matrix.layers.values());
    const sorted = layers.sort((a, b) => b.stats.averageConfidence - a.stats.averageConfidence);
    
    // Keep only top performing layers active
    for (let i = 3; i < sorted.length; i++) {
      sorted[i].active = false;
    }
  }
}

/**
 * Sprint 3.8: Confidence Calculator
 */
class ConfidenceCalculator {
  constructor(config = {}) {
    this.factors = config.factors || {
      sampleSize: 0.3,
      consistency: 0.2,
      recency: 0.2,
      accuracy: 0.3
    };
    this.minSamples = config.minSamples || 5;
    this.decayRate = config.decayRate || 0.95;
  }
  
  calculateConfidence(data) {
    let confidence = 0;
    
    // Sample size factor
    const sampleFactor = Math.min(1, data.samples / (this.minSamples * 2));
    confidence += sampleFactor * this.factors.sampleSize;
    
    // Consistency factor
    const consistencyFactor = this.calculateConsistency(data.values || []);
    confidence += consistencyFactor * this.factors.consistency;
    
    // Recency factor
    const recencyFactor = this.calculateRecency(data.timestamp);
    confidence += recencyFactor * this.factors.recency;
    
    // Accuracy factor
    const accuracyFactor = data.accuracy || 0.5;
    confidence += accuracyFactor * this.factors.accuracy;
    
    return Math.min(1, confidence);
  }
  
  calculateConsistency(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation means higher consistency
    return Math.max(0, 1 - (stdDev / mean));
  }
  
  calculateRecency(timestamp) {
    const age = Date.now() - timestamp;
    const hours = age / 3600000;
    
    // Exponential decay based on age
    return Math.pow(this.decayRate, hours);
  }
  
  combineConfidences(confidences) {
    if (confidences.length === 0) return 0;
    
    // Weighted harmonic mean
    let weightSum = 0;
    let harmonicSum = 0;
    
    for (const conf of confidences) {
      const weight = conf.weight || 1;
      weightSum += weight;
      harmonicSum += weight / conf.value;
    }
    
    return weightSum / harmonicSum;
  }
}

/**
 * Sprint 3.9: Matrix Visualizer
 */
class MatrixVisualizer {
  constructor() {
    this.visualizations = new Map();
  }
  
  generateHeatmap(matrix, layer = 'primary') {
    const layerData = matrix.getLayer(layer);
    if (!layerData) return null;
    
    const heatmap = {
      name: `${layer}_heatmap`,
      type: 'heatmap',
      dimensions: layerData.dimensions,
      data: [],
      timestamp: Date.now()
    };
    
    // Convert cells to heatmap data
    for (const cell of layerData.cells.values()) {
      heatmap.data.push({
        x: cell.coordinates.task?.type || 'unknown',
        y: cell.coordinates.specialist?.type || 'unknown',
        value: cell.value,
        confidence: cell.confidence
      });
    }
    
    this.visualizations.set(heatmap.name, heatmap);
    return heatmap;
  }
  
  generateDistribution(scores) {
    const distribution = {
      name: 'score_distribution',
      type: 'histogram',
      bins: [],
      stats: {
        mean: 0,
        median: 0,
        stdDev: 0,
        min: Infinity,
        max: -Infinity
      },
      timestamp: Date.now()
    };
    
    // Create bins
    const binCount = 20;
    const binSize = 1.0 / binCount;
    
    for (let i = 0; i < binCount; i++) {
      distribution.bins.push({
        range: [i * binSize, (i + 1) * binSize],
        count: 0
      });
    }
    
    // Populate bins and calculate stats
    let sum = 0;
    const values = [];
    
    for (const score of scores) {
      const binIndex = Math.min(Math.floor(score * binCount), binCount - 1);
      distribution.bins[binIndex].count++;
      
      sum += score;
      values.push(score);
      distribution.stats.min = Math.min(distribution.stats.min, score);
      distribution.stats.max = Math.max(distribution.stats.max, score);
    }
    
    // Calculate statistics
    if (values.length > 0) {
      distribution.stats.mean = sum / values.length;
      
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      distribution.stats.median = values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];
      
      const variance = values.reduce((acc, v) => 
        acc + Math.pow(v - distribution.stats.mean, 2), 0) / values.length;
      distribution.stats.stdDev = Math.sqrt(variance);
    }
    
    this.visualizations.set(distribution.name, distribution);
    return distribution;
  }
  
  generateTimeSeries(history, metric = 'score') {
    const timeSeries = {
      name: `${metric}_timeseries`,
      type: 'line',
      data: [],
      aggregation: 'avg',
      window: 60000, // 1 minute windows
      timestamp: Date.now()
    };
    
    // Group by time windows
    const windows = new Map();
    
    for (const entry of history) {
      const windowStart = Math.floor(entry.timestamp / timeSeries.window) * timeSeries.window;
      
      if (!windows.has(windowStart)) {
        windows.set(windowStart, []);
      }
      
      windows.get(windowStart).push(entry[metric] || 0);
    }
    
    // Calculate aggregates for each window
    for (const [timestamp, values] of windows) {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      timeSeries.data.push({
        timestamp,
        value: avg,
        count: values.length
      });
    }
    
    // Sort by timestamp
    timeSeries.data.sort((a, b) => a.timestamp - b.timestamp);
    
    this.visualizations.set(timeSeries.name, timeSeries);
    return timeSeries;
  }
  
  getVisualization(name) {
    return this.visualizations.get(name);
  }
  
  listVisualizations() {
    return Array.from(this.visualizations.keys());
  }
}

/**
 * Sprint 3.10: Integration Layer
 */
class SelectionMatrixIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Core components
    this.matrix = new SelectionMatrix(config.matrix || {});
    this.scoringEngine = new ScoringEngine(config.scoring || {});
    this.weightCalculator = new WeightCalculator(config.weights || {});
    this.decisionEngine = new DecisionEngine(config.decision || {});
    this.historyTracker = new HistoryTracker(config.history || {});
    this.learningSystem = new LearningSystem(config.learning || {});
    this.optimizer = new MatrixOptimizer(config.optimization || {});
    this.confidenceCalculator = new ConfidenceCalculator(config.confidence || {});
    this.visualizer = new MatrixVisualizer();
    
    // Integration state
    this.initialized = false;
    this.statistics = {
      totalSelections: 0,
      successfulSelections: 0,
      averageScore: 0,
      averageConfidence: 0,
      averageResponseTime: 0
    };
    
    // Initialize integration
    this.initialize();
    
    logger.info('🔗 Selection Matrix Integration initialized');
  }
  
  initialize() {
    // Set up event handlers
    this.setupEventHandlers();
    
    // Start optimization cycle
    this.startOptimizationCycle();
    
    this.initialized = true;
  }
  
  setupEventHandlers() {
    // Matrix events
    this.matrix.on('matrix:updated', (data) => {
      this.historyTracker.record({
        type: 'matrix_update',
        ...data
      });
    });
    
    // Scoring events
    this.scoringEngine.on('score:calculated', (score) => {
      this.learningSystem.learn({
        inputs: score.inputs,
        output: score.score,
        success: score.score > 0.7
      });
    });
  }
  
  startOptimizationCycle() {
    setInterval(() => {
      const performance = this.getPerformanceMetrics();
      this.optimizer.optimize(this.matrix, performance);
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Main selection method
   */
  async select(task, specialists, context = {}) {
    const startTime = Date.now();
    this.statistics.totalSelections++;
    
    try {
      // Validate inputs
      if (!specialists || specialists.length === 0) {
        throw new Error('No specialists provided for selection');
      }
      
      // Calculate weights
      const weights = this.weightCalculator.calculateWeights(
        { task, specialists, context },
        context
      );
      
      // Score each specialist
      const scores = [];
      for (const specialist of specialists) {
        const inputs = {
          task,
          specialist,
          context,
          quality: context.qualityRequirements || {}
        };
        
        // Get score from engine
        const scoreResult = this.scoringEngine.calculateScore(inputs, { weights });
        
        // Look up in matrix
        const matrixResult = this.matrix.lookup({
          task: { type: task.type, complexity: task.complexity },
          specialist: { type: specialist.type, id: specialist.id }
        });
        
        // Combine scores
        const combinedScore = this.combineScores(scoreResult, matrixResult);
        
        // Calculate confidence
        const confidence = this.confidenceCalculator.calculateConfidence({
          samples: matrixResult?.samples || 1,
          values: [scoreResult.score],
          timestamp: Date.now(),
          accuracy: matrixResult?.confidence || 0.5
        });
        
        scores.push({
          specialist,
          score: combinedScore,
          confidence,
          breakdown: scoreResult.breakdown
        });
      }
      
      // Sort by score
      scores.sort((a, b) => b.score - a.score);
      
      // Make decision
      const topCandidate = scores[0];
      const decision = this.decisionEngine.makeDecision(
        topCandidate.score,
        topCandidate.confidence,
        context
      );
      
      // Record selection
      const selection = {
        task,
        selected: decision.action === 'accept' ? topCandidate.specialist : null,
        scores,
        decision,
        duration: Date.now() - startTime
      };
      
      // Update matrix
      if (selection.selected) {
        this.matrix.update(
          {
            task: { type: task.type, complexity: task.complexity },
            specialist: { type: selection.selected.type, id: selection.selected.id }
          },
          topCandidate.score
        );
      }
      
      // Record in history
      this.historyTracker.record({
        type: 'selection',
        ...selection
      });
      
      // Update statistics
      this.updateStatistics(selection);
      
      // Emit event
      this.emit('selection:complete', selection);
      
      return selection;
      
    } catch (error) {
      logger.error('Selection failed:', error);
      
      this.emit('selection:error', { error, task, context });
      
      return {
        error: error.message,
        selected: null,
        decision: { action: 'error' }
      };
    }
  }
  
  combineScores(engineScore, matrixScore) {
    if (!matrixScore) {
      return engineScore.score;
    }
    
    // Weighted combination based on confidence
    const engineWeight = 0.6;
    const matrixWeight = 0.4 * matrixScore.confidence;
    
    return (engineScore.score * engineWeight + matrixScore.value * matrixWeight) / 
           (engineWeight + matrixWeight);
  }
  
  updateStatistics(selection) {
    const total = this.statistics.totalSelections;
    
    if (selection.selected) {
      this.statistics.successfulSelections++;
    }
    
    this.statistics.averageScore = 
      (this.statistics.averageScore * (total - 1) + selection.scores[0].score) / total;
    
    this.statistics.averageConfidence = 
      (this.statistics.averageConfidence * (total - 1) + selection.scores[0].confidence) / total;
    
    this.statistics.averageResponseTime = 
      (this.statistics.averageResponseTime * (total - 1) + selection.duration) / total;
  }
  
  /**
   * Provide feedback on selection
   */
  provideFeedback(selectionId, success, details = {}) {
    this.learningSystem.recordFeedback(selectionId, success, details);
    
    // Update matrix based on feedback
    if (details.task && details.specialist) {
      const adjustment = success ? 0.1 : -0.1;
      this.matrix.update(
        {
          task: { type: details.task.type },
          specialist: { type: details.specialist.type }
        },
        adjustment,
        'primary',
        0.5
      );
    }
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const matrixStatus = this.matrix.getStatus();
    const scoringReport = this.scoringEngine.getScoringReport();
    const decisionStats = this.decisionEngine.getDecisionStats();
    const historyStats = this.historyTracker.getStatistics();
    
    return {
      lowConfidenceCells: matrixStatus.layers.primary?.averageConfidence < 0.5 ? 0.5 : 0,
      cacheHitRate: matrixStatus.cache.hitRate,
      avgResponseTime: this.statistics.averageResponseTime,
      totalCells: matrixStatus.layers.primary?.totalCells || 0,
      scoringAccuracy: scoringReport.statistics.averageScore,
      decisionDistribution: decisionStats,
      recentPerformance: historyStats
    };
  }
  
  /**
   * Generate visualizations
   */
  generateVisualizations() {
    // Generate heatmap
    this.visualizer.generateHeatmap(this.matrix, 'primary');
    
    // Generate score distribution
    const recentScores = this.historyTracker.query({ type: 'selection' })
      .map(s => s.scores?.[0]?.score || 0);
    this.visualizer.generateDistribution(recentScores);
    
    // Generate time series
    this.visualizer.generateTimeSeries(
      this.historyTracker.query({ type: 'selection' }),
      'score'
    );
    
    return this.visualizer.listVisualizations();
  }
  
  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      statistics: this.statistics,
      matrix: this.matrix.getStatus(),
      scoring: this.scoringEngine.getScoringReport(),
      decisions: this.decisionEngine.getDecisionStats(),
      learning: {
        models: this.learningSystem.models.size,
        feedback: this.learningSystem.feedback.length,
        improvements: this.learningSystem.improvements.length
      },
      optimization: {
        lastRun: this.optimizer.lastOptimization,
        history: this.optimizer.optimizationHistory.slice(-5)
      },
      visualizations: this.visualizer.listVisualizations()
    };
  }
  
  /**
   * Shutdown integration
   */
  shutdown() {
    logger.info('Shutting down Selection Matrix Integration...');
    
    this.matrix.shutdown();
    this.scoringEngine.shutdown();
    
    this.removeAllListeners();
    
    logger.info('Selection Matrix Integration shutdown complete');
  }
}

module.exports = {
  SelectionMatrixIntegration,
  WeightCalculator,
  DecisionEngine,
  HistoryTracker,
  LearningSystem,
  MatrixOptimizer,
  ConfidenceCalculator,
  MatrixVisualizer
};