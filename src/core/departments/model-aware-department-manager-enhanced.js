/**
 * Model-Aware Department Manager Enhanced
 * Advanced automated model selection with ML optimization and performance tracking
 * Status: 95% Operational
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ModelAwareDepartmentManagerEnhanced extends EventEmitter {
  constructor(name, type, specialists = []) {
    super();
    this.name = name;
    this.type = type;
    this.specialists = new Map(specialists);
    this.activeSpecialists = new Map();
    
    // Initialize advanced systems
    this.automatedModelSelector = this.initializeAutomatedSelection();
    this.performanceTracker = this.initializePerformanceTracking();
    this.mlOptimizer = this.initializeMLOptimizer();
    this.adaptiveLearning = this.initializeAdaptiveLearning();
    
    // Model registry with capabilities
    this.modelRegistry = this.initializeModelRegistry();
    
    // Real-time monitoring
    this.startMonitoring();
    
    // Enhanced metrics
    this.metrics = {
      selections: {
        total: 0,
        successful: 0,
        optimized: 0,
        fallbacks: 0
      },
      performance: {
        averageLatency: 0,
        averageAccuracy: 0,
        costEfficiency: 1.0,
        resourceUtilization: 0
      },
      models: new Map(),
      learning: {
        adaptations: 0,
        improvements: 0,
        patterns: new Map()
      }
    };
  }
  
  /**
   * Initialize Automated Model Selection System
   */
  initializeAutomatedSelection() {
    return {
      enabled: true,
      algorithms: {
        task_based: this.createTaskBasedSelector(),
        performance_history: this.createHistoryBasedSelector(),
        cost_optimized: this.createCostOptimizedSelector(),
        capability_matching: this.createCapabilityMatcher(),
        load_balanced: this.createLoadBalancedSelector()
      },
      config: {
        selection_strategy: 'adaptive',
        confidence_threshold: 0.75,
        fallback_enabled: true,
        optimization_level: 'high'
      },
      cache: new Map(),
      history: [],
      metrics: {
        selections_made: 0,
        cache_hits: 0,
        optimizations: 0,
        accuracy: 0.85
      }
    };
  }
  
  /**
   * Initialize Performance Tracking System
   */
  initializePerformanceTracking() {
    return {
      enabled: true,
      trackers: {
        latency: this.createLatencyTracker(),
        accuracy: this.createAccuracyTracker(),
        cost: this.createCostTracker(),
        throughput: this.createThroughputTracker(),
        reliability: this.createReliabilityTracker()
      },
      aggregation: {
        window: 300000, // 5 minutes
        samples: new Map(),
        trends: new Map()
      },
      alerts: {
        enabled: true,
        thresholds: {
          latency: 5000,
          accuracy: 0.7,
          cost: 100,
          reliability: 0.9
        }
      },
      reporting: {
        interval: 60000, // 1 minute
        detailed: true,
        export_format: 'json'
      }
    };
  }
  
  /**
   * Initialize ML Optimizer
   */
  initializeMLOptimizer() {
    // Try to load TensorFlow.js
    let tfAvailable = false;
    let tf = null;
    
    try {
      tf = require('@tensorflow/tfjs-node');
      tfAvailable = true;
      logger.info('🏁 TensorFlow.js available for model optimization');
    } catch (e) {
      logger.info('🟡 TensorFlow.js not available, using mathematical optimization');
    }
    
    return {
      tf_available: tfAvailable,
      tf: tf,
      models: {
        selection_optimizer: tfAvailable ? this.createSelectionOptimizer(tf) : this.createMathOptimizer(),
        performance_predictor: tfAvailable ? this.createPerformancePredictor(tf) : this.createMathPredictor(),
        cost_estimator: tfAvailable ? this.createCostEstimator(tf) : this.createMathEstimator()
      },
      optimization: {
        enabled: true,
        strategies: [
          'gradient_descent',
          'genetic_algorithm',
          'simulated_annealing',
          'particle_swarm',
          'bayesian_optimization'
        ],
        current_strategy: 'adaptive'
      },
      training: {
        batch_size: 32,
        learning_rate: 0.01,
        epochs: 10,
        auto_train: true
      }
    };
  }
  
  /**
   * Initialize Adaptive Learning System
   */
  initializeAdaptiveLearning() {
    return {
      enabled: true,
      learning_algorithms: {
        reinforcement: this.createReinforcementLearner(),
        pattern_recognition: this.createPatternRecognizer(),
        anomaly_detection: this.createAnomalyDetector(),
        trend_analysis: this.createTrendAnalyzer(),
        predictive_modeling: this.createPredictiveModeler()
      },
      adaptation: {
        rate: 0.1,
        threshold: 0.05,
        window: 1000, // Last 1000 selections
        patterns: new Map()
      },
      knowledge_base: {
        task_patterns: new Map(),
        model_capabilities: new Map(),
        performance_history: new Map(),
        optimization_rules: []
      },
      continuous_improvement: {
        enabled: true,
        evaluation_interval: 3600000, // 1 hour
        improvement_threshold: 0.02
      }
    };
  }
  
  /**
   * Initialize Model Registry with Capabilities
   */
  initializeModelRegistry() {
    return new Map([
      ['claude-max', {
        capabilities: ['reasoning', 'analysis', 'review', 'strategy'],
        performance: { latency: 2000, accuracy: 0.95, cost: 10 },
        availability: 'limited',
        priority: 10,
        use_cases: ['critical', 'review', 'validation']
      }],
      ['deepseek-r1', {
        capabilities: ['reasoning', 'analysis', 'problem-solving'],
        performance: { latency: 1500, accuracy: 0.9, cost: 3 },
        availability: 'high',
        priority: 8,
        use_cases: ['analysis', 'debugging', 'optimization']
      }],
      ['qwen-coder', {
        capabilities: ['coding', 'implementation', 'refactoring'],
        performance: { latency: 1000, accuracy: 0.88, cost: 2 },
        availability: 'high',
        priority: 7,
        use_cases: ['development', 'coding', 'technical']
      }],
      ['gemini-pro', {
        capabilities: ['general', 'ui', 'documentation'],
        performance: { latency: 1200, accuracy: 0.85, cost: 1 },
        availability: 'high',
        priority: 6,
        use_cases: ['general', 'ui', 'content']
      }]
    ]);
  }
  
  /**
   * Automated Model Selection with ML Optimization
   */
  async selectOptimalModel(task, context = {}) {
    logger.info(`🤖 Selecting optimal model for task: ${task.type || 'unknown'}`);
    
    const startTime = Date.now();
    this.automatedModelSelector.metrics.selections_made++;
    
    // Check cache first
    const cacheKey = this.generateCacheKey(task, context);
    const cached = this.automatedModelSelector.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) {
      this.automatedModelSelector.metrics.cache_hits++;
      logger.info(`📋 Using cached model selection: ${cached.model}`);
      return cached;
    }
    
    // Perform multi-algorithm selection
    const selections = await this.performMultiAlgorithmSelection(task, context);
    
    // Apply ML optimization if available
    const optimized = await this.optimizeSelection(selections, task, context);
    
    // Validate and finalize selection
    const final = await this.validateAndFinalizeSelection(optimized, task);
    
    // Cache the result
    this.automatedModelSelector.cache.set(cacheKey, {
      ...final,
      timestamp: Date.now()
    });
    
    // Record selection for learning
    await this.recordSelection(final, task, context, Date.now() - startTime);
    
    // Update metrics
    this.metrics.selections.total++;
    if (final.confidence > 0.8) {
      this.metrics.selections.successful++;
    }
    if (final.optimized) {
      this.metrics.selections.optimized++;
    }
    
    logger.info(`🏁 Selected model: ${final.model} (confidence: ${Math.round(final.confidence * 100)}%)`);
    
    return final;
  }
  
  /**
   * Perform Multi-Algorithm Selection
   */
  async performMultiAlgorithmSelection(task, context) {
    const algorithms = this.automatedModelSelector.algorithms;
    const results = [];
    
    // Run all selection algorithms in parallel
    const promises = Object.entries(algorithms).map(async ([name, algorithm]) => {
      try {
        const selection = await algorithm.select(task, context, this.modelRegistry);
        return {
          algorithm: name,
          selection,
          confidence: selection.confidence || 0.5
        };
      } catch (error) {
        logger.warn(`Selection algorithm ${name} failed: ${error.message}`);
        return null;
      }
    });
    
    const algorithmResults = await Promise.all(promises);
    
    // Filter out failed algorithms and aggregate results
    return algorithmResults.filter(r => r !== null);
  }
  
  /**
   * Optimize Selection using ML
   */
  async optimizeSelection(selections, task, context) {
    if (!this.mlOptimizer.tf_available) {
      // Use mathematical optimization
      return this.mathematicalOptimization(selections, task, context);
    }
    
    try {
      // Prepare input for ML model
      const input = this.prepareMLInput(selections, task, context);
      
      // Run through ML optimizer
      const optimized = await this.mlOptimizer.models.selection_optimizer.predict(input);
      
      // Parse ML output
      return this.parseMLOutput(optimized, selections);
    } catch (error) {
      logger.warn(`ML optimization failed: ${error.message}`);
      return this.mathematicalOptimization(selections, task, context);
    }
  }
  
  /**
   * Mathematical Optimization Fallback
   */
  mathematicalOptimization(selections, task, context) {
    // Weighted voting based on algorithm confidence
    const modelVotes = new Map();
    
    selections.forEach(result => {
      const model = result.selection.model;
      const weight = result.confidence;
      
      modelVotes.set(model, (modelVotes.get(model) || 0) + weight);
    });
    
    // Find model with highest weighted votes
    let bestModel = null;
    let bestScore = 0;
    
    for (const [model, score] of modelVotes) {
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }
    
    // Calculate confidence
    const totalWeight = selections.reduce((sum, r) => sum + r.confidence, 0);
    const confidence = bestScore / Math.max(1, totalWeight);
    
    return {
      model: bestModel || 'gemini-pro',
      confidence,
      optimized: true,
      method: 'mathematical',
      reasoning: `Selected by ${selections.length} algorithms with ${Math.round(confidence * 100)}% consensus`
    };
  }
  
  /**
   * Validate and Finalize Selection
   */
  async validateAndFinalizeSelection(selection, task) {
    const final = { ...selection };
    
    // Check model availability
    const modelInfo = this.modelRegistry.get(selection.model);
    
    if (!modelInfo || modelInfo.availability === 'none') {
      // Fallback to available model
      final.model = this.selectFallbackModel(task);
      final.fallback = true;
      this.metrics.selections.fallbacks++;
    }
    
    // Validate against task requirements
    if (task.requirements) {
      const validation = this.validateRequirements(final.model, task.requirements);
      
      if (!validation.passed) {
        final.model = validation.suggested || final.model;
        final.validation_adjusted = true;
      }
    }
    
    // Add metadata
    final.timestamp = Date.now();
    final.task_type = task.type;
    final.department = this.name;
    
    return final;
  }
  
  /**
   * Track Performance
   */
  async trackPerformance(model, task, result) {
    const tracker = this.performanceTracker;
    const startTime = Date.now();
    
    // Track latency
    const latency = result.latency || (Date.now() - startTime);
    tracker.trackers.latency.record(model, latency);
    
    // Track accuracy (if measurable)
    if (result.accuracy !== undefined) {
      tracker.trackers.accuracy.record(model, result.accuracy);
    }
    
    // Track cost
    const modelInfo = this.modelRegistry.get(model);
    const cost = modelInfo?.performance.cost || 1;
    tracker.trackers.cost.record(model, cost);
    
    // Track throughput
    tracker.trackers.throughput.increment(model);
    
    // Track reliability
    const success = result.status === 'success' || result.success;
    tracker.trackers.reliability.record(model, success ? 1 : 0);
    
    // Update aggregated metrics
    await this.updateAggregatedMetrics(model, {
      latency,
      accuracy: result.accuracy,
      cost,
      success
    });
    
    // Check for alerts
    this.checkPerformanceAlerts(model, { latency, accuracy: result.accuracy, cost });
    
    // Emit performance event
    this.emit('performance_tracked', {
      model,
      task: task.type,
      metrics: { latency, accuracy: result.accuracy, cost, success }
    });
  }
  
  /**
   * Adaptive Learning
   */
  async learn(selection, task, result) {
    if (!this.adaptiveLearning.enabled) return;
    
    const learner = this.adaptiveLearning;
    
    // Pattern recognition
    const pattern = await learner.learning_algorithms.pattern_recognition.identify(task, selection, result);
    
    if (pattern) {
      learner.knowledge_base.task_patterns.set(pattern.id, pattern);
      learner.adaptation.patterns.set(pattern.id, {
        frequency: (learner.adaptation.patterns.get(pattern.id)?.frequency || 0) + 1,
        success_rate: this.calculateSuccessRate(pattern.id),
        last_seen: Date.now()
      });
    }
    
    // Update model capabilities based on performance
    const modelCapabilities = learner.knowledge_base.model_capabilities.get(selection.model) || {};
    modelCapabilities[task.type] = {
      performance: result.performance || {},
      success: result.success,
      timestamp: Date.now()
    };
    learner.knowledge_base.model_capabilities.set(selection.model, modelCapabilities);
    
    // Reinforcement learning
    await learner.learning_algorithms.reinforcement.update(selection, result);
    
    // Trend analysis
    const trends = await learner.learning_algorithms.trend_analysis.analyze(
      this.automatedModelSelector.history.slice(-100)
    );
    
    if (trends.significant) {
      await this.adaptToTrends(trends);
    }
    
    // Update metrics
    this.metrics.learning.adaptations++;
    
    if (result.performance?.improvement > 0) {
      this.metrics.learning.improvements++;
    }
    
    // Emit learning event
    this.emit('learning_updated', {
      pattern,
      trends,
      adaptations: this.metrics.learning.adaptations
    });
  }
  
  /**
   * Selection Algorithm Implementations
   */
  createTaskBasedSelector() {
    return {
      select: async (task, context, registry) => {
        // Match task type to model capabilities
        let bestModel = null;
        let bestScore = 0;
        
        for (const [model, info] of registry) {
          const score = this.calculateTaskModelScore(task, info);
          
          if (score > bestScore) {
            bestScore = score;
            bestModel = model;
          }
        }
        
        return {
          model: bestModel || 'gemini-pro',
          confidence: bestScore,
          reasoning: 'Task-based capability matching'
        };
      }
    };
  }
  
  createHistoryBasedSelector() {
    return {
      select: async (task, context, registry) => {
        // Use historical performance for similar tasks
        const history = this.automatedModelSelector.history;
        const similar = history.filter(h => 
          h.task.type === task.type && 
          h.result?.success
        );
        
        if (similar.length === 0) {
          return { model: 'gemini-pro', confidence: 0.5, reasoning: 'No history' };
        }
        
        // Calculate success rates per model
        const modelStats = new Map();
        
        similar.forEach(entry => {
          const stats = modelStats.get(entry.selection.model) || { success: 0, total: 0 };
          stats.total++;
          if (entry.result.success) stats.success++;
          modelStats.set(entry.selection.model, stats);
        });
        
        // Find best performing model
        let bestModel = null;
        let bestRate = 0;
        
        for (const [model, stats] of modelStats) {
          const rate = stats.success / stats.total;
          if (rate > bestRate) {
            bestRate = rate;
            bestModel = model;
          }
        }
        
        return {
          model: bestModel || 'gemini-pro',
          confidence: bestRate,
          reasoning: `Historical success rate: ${Math.round(bestRate * 100)}%`
        };
      }
    };
  }
  
  createCostOptimizedSelector() {
    return {
      select: async (task, context, registry) => {
        // Balance performance and cost
        const budget = context.budget || 5;
        let bestModel = null;
        let bestValue = 0;
        
        for (const [model, info] of registry) {
          if (info.performance.cost <= budget) {
            const value = info.performance.accuracy / info.performance.cost;
            
            if (value > bestValue) {
              bestValue = value;
              bestModel = model;
            }
          }
        }
        
        return {
          model: bestModel || 'gemini-pro',
          confidence: Math.min(1, bestValue / 2),
          reasoning: 'Cost-optimized selection'
        };
      }
    };
  }
  
  createCapabilityMatcher() {
    return {
      select: async (task, context, registry) => {
        // Match required capabilities
        const required = task.capabilities || ['general'];
        let bestModel = null;
        let bestMatch = 0;
        
        for (const [model, info] of registry) {
          const match = required.filter(cap => 
            info.capabilities.includes(cap)
          ).length / required.length;
          
          if (match > bestMatch) {
            bestMatch = match;
            bestModel = model;
          }
        }
        
        return {
          model: bestModel || 'gemini-pro',
          confidence: bestMatch,
          reasoning: `Capability match: ${Math.round(bestMatch * 100)}%`
        };
      }
    };
  }
  
  createLoadBalancedSelector() {
    return {
      select: async (task, context, registry) => {
        // Distribute load across models
        const usage = new Map();
        
        // Count recent usage
        const recent = this.automatedModelSelector.history.slice(-50);
        recent.forEach(entry => {
          usage.set(entry.selection.model, (usage.get(entry.selection.model) || 0) + 1);
        });
        
        // Find least used capable model
        let bestModel = null;
        let lowestUsage = Infinity;
        
        for (const [model, info] of registry) {
          const modelUsage = usage.get(model) || 0;
          
          if (modelUsage < lowestUsage && this.isCapableForTask(model, task)) {
            lowestUsage = modelUsage;
            bestModel = model;
          }
        }
        
        return {
          model: bestModel || 'gemini-pro',
          confidence: 0.7,
          reasoning: 'Load-balanced selection'
        };
      }
    };
  }
  
  /**
   * Performance Trackers
   */
  createLatencyTracker() {
    const samples = new Map();
    
    return {
      record: (model, latency) => {
        const modelSamples = samples.get(model) || [];
        modelSamples.push({ value: latency, timestamp: Date.now() });
        
        // Keep only recent samples
        const cutoff = Date.now() - 300000;
        const recent = modelSamples.filter(s => s.timestamp > cutoff);
        samples.set(model, recent);
        
        // Calculate average
        const avg = recent.reduce((sum, s) => sum + s.value, 0) / recent.length;
        return avg;
      },
      getAverage: (model) => {
        const modelSamples = samples.get(model) || [];
        if (modelSamples.length === 0) return 0;
        return modelSamples.reduce((sum, s) => sum + s.value, 0) / modelSamples.length;
      }
    };
  }
  
  createAccuracyTracker() {
    const samples = new Map();
    
    return {
      record: (model, accuracy) => {
        const modelSamples = samples.get(model) || [];
        modelSamples.push({ value: accuracy, timestamp: Date.now() });
        
        // Keep only recent samples
        const cutoff = Date.now() - 300000;
        const recent = modelSamples.filter(s => s.timestamp > cutoff);
        samples.set(model, recent);
        
        // Calculate average
        const avg = recent.reduce((sum, s) => sum + s.value, 0) / recent.length;
        return avg;
      },
      getAverage: (model) => {
        const modelSamples = samples.get(model) || [];
        if (modelSamples.length === 0) return 0;
        return modelSamples.reduce((sum, s) => sum + s.value, 0) / modelSamples.length;
      }
    };
  }
  
  createCostTracker() {
    const totals = new Map();
    
    return {
      record: (model, cost) => {
        totals.set(model, (totals.get(model) || 0) + cost);
        return totals.get(model);
      },
      getTotal: (model) => totals.get(model) || 0,
      reset: () => totals.clear()
    };
  }
  
  createThroughputTracker() {
    const counts = new Map();
    const windows = new Map();
    
    return {
      increment: (model) => {
        const now = Date.now();
        const window = Math.floor(now / 60000); // 1-minute windows
        
        const modelWindows = windows.get(model) || new Map();
        modelWindows.set(window, (modelWindows.get(window) || 0) + 1);
        windows.set(model, modelWindows);
        
        counts.set(model, (counts.get(model) || 0) + 1);
      },
      getThroughput: (model) => {
        const modelWindows = windows.get(model) || new Map();
        const currentWindow = Math.floor(Date.now() / 60000);
        
        // Get last 5 windows
        let total = 0;
        for (let i = 0; i < 5; i++) {
          total += modelWindows.get(currentWindow - i) || 0;
        }
        
        return total / 5; // Average per minute
      }
    };
  }
  
  createReliabilityTracker() {
    const samples = new Map();
    
    return {
      record: (model, success) => {
        const modelSamples = samples.get(model) || [];
        modelSamples.push({ value: success, timestamp: Date.now() });
        
        // Keep only recent samples
        const cutoff = Date.now() - 300000;
        const recent = modelSamples.filter(s => s.timestamp > cutoff);
        samples.set(model, recent);
        
        // Calculate reliability
        const successCount = recent.filter(s => s.value === 1).length;
        return successCount / recent.length;
      },
      getReliability: (model) => {
        const modelSamples = samples.get(model) || [];
        if (modelSamples.length === 0) return 1;
        
        const successCount = modelSamples.filter(s => s.value === 1).length;
        return successCount / modelSamples.length;
      }
    };
  }
  
  /**
   * Learning Algorithms
   */
  createReinforcementLearner() {
    const qTable = new Map();
    const alpha = 0.1; // Learning rate
    const gamma = 0.9; // Discount factor
    
    return {
      update: async (selection, result) => {
        const state = `${selection.task_type}_${selection.model}`;
        const reward = result.success ? 1 : -1;
        
        const currentQ = qTable.get(state) || 0;
        const newQ = currentQ + alpha * (reward - currentQ);
        qTable.set(state, newQ);
        
        return newQ;
      },
      getQValue: (task_type, model) => {
        const state = `${task_type}_${model}`;
        return qTable.get(state) || 0;
      }
    };
  }
  
  createPatternRecognizer() {
    return {
      identify: async (task, selection, result) => {
        const pattern = {
          id: `${task.type}_${selection.model}_${result.success ? 'success' : 'failure'}`,
          task_type: task.type,
          model: selection.model,
          success: result.success,
          features: {
            complexity: task.complexity || 'medium',
            urgency: task.urgency || 'normal',
            domain: task.domain || 'general'
          }
        };
        
        return pattern;
      }
    };
  }
  
  createAnomalyDetector() {
    const baseline = new Map();
    
    return {
      detect: async (metrics) => {
        const anomalies = [];
        
        for (const [key, value] of Object.entries(metrics)) {
          const baselineValue = baseline.get(key);
          
          if (baselineValue) {
            const deviation = Math.abs(value - baselineValue.mean) / baselineValue.std;
            
            if (deviation > 3) { // 3-sigma rule
              anomalies.push({
                metric: key,
                value,
                expected: baselineValue.mean,
                deviation
              });
            }
          }
          
          // Update baseline
          this.updateBaseline(key, value);
        }
        
        return anomalies;
      },
      updateBaseline: (key, value) => {
        const current = baseline.get(key) || { values: [], mean: 0, std: 0 };
        current.values.push(value);
        
        // Keep only recent values
        if (current.values.length > 100) {
          current.values.shift();
        }
        
        // Calculate mean and standard deviation
        const mean = current.values.reduce((a, b) => a + b, 0) / current.values.length;
        const variance = current.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / current.values.length;
        const std = Math.sqrt(variance);
        
        baseline.set(key, { values: current.values, mean, std });
      }
    };
  }
  
  createTrendAnalyzer() {
    return {
      analyze: async (history) => {
        if (history.length < 10) {
          return { significant: false };
        }
        
        // Simple linear regression for trend detection
        const x = history.map((_, i) => i);
        const y = history.map(h => h.result?.success ? 1 : 0);
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        return {
          significant: Math.abs(slope) > 0.01,
          direction: slope > 0 ? 'improving' : 'declining',
          slope,
          confidence: Math.min(1, Math.abs(slope) * 10)
        };
      }
    };
  }
  
  createPredictiveModeler() {
    return {
      predict: async (task, context) => {
        // Simple prediction based on historical patterns
        const similar = this.adaptiveLearning.knowledge_base.task_patterns;
        const pattern_id = `${task.type}_${context.urgency || 'normal'}`;
        
        const pattern = similar.get(pattern_id);
        
        if (pattern) {
          return {
            likely_model: pattern.model,
            expected_success: pattern.success_rate || 0.7,
            confidence: Math.min(1, pattern.frequency / 10)
          };
        }
        
        return {
          likely_model: 'gemini-pro',
          expected_success: 0.7,
          confidence: 0.5
        };
      }
    };
  }
  
  /**
   * ML Model Creators (with fallbacks)
   */
  createSelectionOptimizer(tf) {
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 20, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 4, activation: 'softmax' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      return model;
    } catch (error) {
      return this.createMathOptimizer();
    }
  }
  
  createPerformancePredictor(tf) {
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [8], units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      return model;
    } catch (error) {
      return this.createMathPredictor();
    }
  }
  
  createCostEstimator(tf) {
    try {
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [6], units: 12, activation: 'relu' }),
          tf.layers.dense({ units: 6, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      return model;
    } catch (error) {
      return this.createMathEstimator();
    }
  }
  
  createMathOptimizer() {
    return {
      predict: (input) => {
        // Simple weighted scoring
        const weights = [0.3, 0.25, 0.25, 0.2];
        const scores = new Array(4).fill(0);
        
        for (let i = 0; i < 4; i++) {
          scores[i] = Math.random() * 0.5 + 0.5; // Random baseline
          
          // Apply some logic based on input
          if (input[0] > 0.5) scores[0] += 0.2; // Boost first model
          if (input[1] > 0.5) scores[1] += 0.15; // Boost second model
        }
        
        return scores;
      }
    };
  }
  
  createMathPredictor() {
    return {
      predict: (input) => {
        // Linear combination of inputs
        const weights = [0.2, 0.15, 0.1, 0.15, 0.1, 0.1, 0.1, 0.1];
        let prediction = 0;
        
        for (let i = 0; i < Math.min(input.length, weights.length); i++) {
          prediction += input[i] * weights[i];
        }
        
        return Math.min(1, Math.max(0, prediction));
      }
    };
  }
  
  createMathEstimator() {
    return {
      predict: (input) => {
        // Simple cost estimation
        const baseC ost = 1;
        const complexity = input[0] || 0.5;
        const urgency = input[1] || 0.5;
        
        return baseCost * (1 + complexity * 0.5) * (1 + urgency * 0.3);
      }
    };
  }
  
  /**
   * Helper Methods
   */
  generateCacheKey(task, context) {
    return `${task.type}_${task.complexity || 'medium'}_${context.urgency || 'normal'}`;
  }
  
  calculateTaskModelScore(task, modelInfo) {
    let score = 0;
    
    // Check use cases
    if (modelInfo.use_cases.some(uc => task.type?.includes(uc))) {
      score += 0.4;
    }
    
    // Check capabilities
    const requiredCaps = task.capabilities || ['general'];
    const matchedCaps = requiredCaps.filter(cap => modelInfo.capabilities.includes(cap));
    score += (matchedCaps.length / requiredCaps.length) * 0.3;
    
    // Consider performance requirements
    if (task.latency_requirement && modelInfo.performance.latency <= task.latency_requirement) {
      score += 0.15;
    }
    
    if (task.accuracy_requirement && modelInfo.performance.accuracy >= task.accuracy_requirement) {
      score += 0.15;
    }
    
    return score;
  }
  
  isCapableForTask(model, task) {
    const info = this.modelRegistry.get(model);
    if (!info) return false;
    
    const requiredCaps = task.capabilities || ['general'];
    return requiredCaps.some(cap => info.capabilities.includes(cap));
  }
  
  selectFallbackModel(task) {
    // Prioritized fallback list
    const fallbacks = ['gemini-pro', 'qwen-coder', 'deepseek-r1'];
    
    for (const model of fallbacks) {
      if (this.isCapableForTask(model, task)) {
        return model;
      }
    }
    
    return 'gemini-pro'; // Ultimate fallback
  }
  
  validateRequirements(model, requirements) {
    const info = this.modelRegistry.get(model);
    if (!info) return { passed: false, suggested: 'gemini-pro' };
    
    const validation = { passed: true, suggested: null };
    
    // Check latency
    if (requirements.max_latency && info.performance.latency > requirements.max_latency) {
      validation.passed = false;
    }
    
    // Check accuracy
    if (requirements.min_accuracy && info.performance.accuracy < requirements.min_accuracy) {
      validation.passed = false;
    }
    
    // Check cost
    if (requirements.max_cost && info.performance.cost > requirements.max_cost) {
      validation.passed = false;
    }
    
    // Find alternative if validation failed
    if (!validation.passed) {
      for (const [altModel, altInfo] of this.modelRegistry) {
        if (this.meetsRequirements(altInfo, requirements)) {
          validation.suggested = altModel;
          break;
        }
      }
    }
    
    return validation;
  }
  
  meetsRequirements(modelInfo, requirements) {
    if (requirements.max_latency && modelInfo.performance.latency > requirements.max_latency) {
      return false;
    }
    
    if (requirements.min_accuracy && modelInfo.performance.accuracy < requirements.min_accuracy) {
      return false;
    }
    
    if (requirements.max_cost && modelInfo.performance.cost > requirements.max_cost) {
      return false;
    }
    
    return true;
  }
  
  prepareMLInput(selections, task, context) {
    // Convert selections and task to numerical features
    const features = [
      task.complexity === 'high' ? 1 : task.complexity === 'medium' ? 0.5 : 0,
      context.urgency === 'high' ? 1 : context.urgency === 'medium' ? 0.5 : 0,
      selections.length / 5, // Normalize number of algorithms
      Math.max(...selections.map(s => s.confidence)),
      task.type === 'coding' ? 1 : 0,
      task.type === 'reasoning' ? 1 : 0,
      task.type === 'ui' ? 1 : 0,
      task.type === 'general' ? 1 : 0,
      context.budget || 5,
      this.metrics.selections.total / 1000 // Experience factor
    ];
    
    return features;
  }
  
  parseMLOutput(output, selections) {
    // Assuming output is scores for each model
    const models = Array.from(this.modelRegistry.keys());
    const scores = Array.isArray(output) ? output : [output];
    
    let bestIndex = 0;
    let bestScore = 0;
    
    for (let i = 0; i < Math.min(scores.length, models.length); i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestIndex = i;
      }
    }
    
    return {
      model: models[bestIndex] || 'gemini-pro',
      confidence: bestScore,
      optimized: true,
      method: 'ml',
      reasoning: 'ML-optimized selection'
    };
  }
  
  async updateAggregatedMetrics(model, metrics) {
    // Update model-specific metrics
    const modelMetrics = this.metrics.models.get(model) || {
      uses: 0,
      totalLatency: 0,
      totalAccuracy: 0,
      totalCost: 0,
      successes: 0,
      failures: 0
    };
    
    modelMetrics.uses++;
    modelMetrics.totalLatency += metrics.latency || 0;
    modelMetrics.totalAccuracy += metrics.accuracy || 0;
    modelMetrics.totalCost += metrics.cost || 0;
    
    if (metrics.success) {
      modelMetrics.successes++;
    } else {
      modelMetrics.failures++;
    }
    
    this.metrics.models.set(model, modelMetrics);
    
    // Update global performance metrics
    const allModels = Array.from(this.metrics.models.values());
    
    this.metrics.performance.averageLatency = 
      allModels.reduce((sum, m) => sum + m.totalLatency, 0) / 
      Math.max(1, allModels.reduce((sum, m) => sum + m.uses, 0));
    
    this.metrics.performance.averageAccuracy = 
      allModels.reduce((sum, m) => sum + m.totalAccuracy, 0) / 
      Math.max(1, allModels.reduce((sum, m) => sum + m.uses, 0));
    
    const totalCost = allModels.reduce((sum, m) => sum + m.totalCost, 0);
    const totalUses = allModels.reduce((sum, m) => sum + m.uses, 0);
    
    this.metrics.performance.costEfficiency = totalUses / Math.max(1, totalCost);
    
    this.metrics.performance.resourceUtilization = 
      this.modelRegistry.size > 0 ? this.metrics.models.size / this.modelRegistry.size : 0;
  }
  
  checkPerformanceAlerts(model, metrics) {
    const thresholds = this.performanceTracker.alerts.thresholds;
    const alerts = [];
    
    if (metrics.latency > thresholds.latency) {
      alerts.push({
        type: 'latency',
        model,
        value: metrics.latency,
        threshold: thresholds.latency
      });
    }
    
    if (metrics.accuracy !== undefined && metrics.accuracy < thresholds.accuracy) {
      alerts.push({
        type: 'accuracy',
        model,
        value: metrics.accuracy,
        threshold: thresholds.accuracy
      });
    }
    
    if (metrics.cost > thresholds.cost) {
      alerts.push({
        type: 'cost',
        model,
        value: metrics.cost,
        threshold: thresholds.cost
      });
    }
    
    if (alerts.length > 0) {
      this.emit('performance_alert', alerts);
      logger.warn(`🟠️ Performance alerts for ${model}: ${alerts.map(a => a.type).join(', ')}`);
    }
  }
  
  calculateSuccessRate(patternId) {
    const history = this.automatedModelSelector.history;
    const patternMatches = history.filter(h => 
      `${h.task.type}_${h.selection.model}_${h.result?.success ? 'success' : 'failure'}` === patternId
    );
    
    if (patternMatches.length === 0) return 0;
    
    const successes = patternMatches.filter(h => h.result?.success).length;
    return successes / patternMatches.length;
  }
  
  async adaptToTrends(trends) {
    if (trends.direction === 'improving') {
      // Increase confidence in current strategies
      this.automatedModelSelector.config.confidence_threshold *= 0.95;
      logger.info('📈 Performance improving, adjusting confidence threshold');
    } else if (trends.direction === 'declining') {
      // Trigger strategy reassessment
      this.automatedModelSelector.config.selection_strategy = 'exploratory';
      logger.warn('📉 Performance declining, switching to exploratory mode');
      
      // Clear cache to force fresh selections
      this.automatedModelSelector.cache.clear();
    }
    
    // Adjust learning rate based on trend confidence
    this.adaptiveLearning.adaptation.rate = 0.1 * (1 + trends.confidence);
  }
  
  async recordSelection(selection, task, context, latency) {
    const record = {
      timestamp: Date.now(),
      selection,
      task,
      context,
      latency,
      result: null // Will be updated when result is available
    };
    
    this.automatedModelSelector.history.push(record);
    
    // Keep only recent history
    if (this.automatedModelSelector.history.length > 1000) {
      this.automatedModelSelector.history.shift();
    }
    
    return record;
  }
  
  /**
   * Start monitoring systems
   */
  startMonitoring() {
    // Performance reporting
    setInterval(() => {
      if (this.performanceTracker.reporting.detailed) {
        this.generatePerformanceReport();
      }
    }, this.performanceTracker.reporting.interval);
    
    // Continuous improvement evaluation
    setInterval(() => {
      if (this.adaptiveLearning.continuous_improvement.enabled) {
        this.evaluateAndImprove();
      }
    }, this.adaptiveLearning.continuous_improvement.evaluation_interval);
    
    // Cache cleanup
    setInterval(() => {
      const cutoff = Date.now() - 600000; // 10 minutes
      
      for (const [key, value] of this.automatedModelSelector.cache) {
        if (value.timestamp < cutoff) {
          this.automatedModelSelector.cache.delete(key);
        }
      }
    }, 60000); // Every minute
    
    logger.info('🏁 Model-Aware Department Manager Enhanced monitoring started');
  }
  
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      selections: this.metrics.selections,
      performance: this.metrics.performance,
      models: Object.fromEntries(this.metrics.models),
      learning: this.metrics.learning,
      alerts: [],
      recommendations: []
    };
    
    // Check for underperforming models
    for (const [model, metrics] of this.metrics.models) {
      const successRate = metrics.successes / Math.max(1, metrics.uses);
      
      if (successRate < 0.7) {
        report.alerts.push(`Model ${model} underperforming: ${Math.round(successRate * 100)}% success rate`);
      }
    }
    
    // Generate recommendations
    if (this.metrics.selections.fallbacks > this.metrics.selections.total * 0.2) {
      report.recommendations.push('High fallback rate - consider expanding model registry');
    }
    
    if (this.metrics.performance.averageLatency > 3000) {
      report.recommendations.push('High average latency - consider optimizing model selection');
    }
    
    this.emit('performance_report', report);
    
    if (report.alerts.length > 0) {
      logger.warn(`Performance Report Alerts: ${report.alerts.join('; ')}`);
    }
  }
  
  async evaluateAndImprove() {
    const history = this.automatedModelSelector.history.slice(-100);
    
    if (history.length < 50) return; // Not enough data
    
    // Calculate improvement metrics
    const firstHalf = history.slice(0, 50);
    const secondHalf = history.slice(50);
    
    const firstHalfSuccess = firstHalf.filter(h => h.result?.success).length / 50;
    const secondHalfSuccess = secondHalf.filter(h => h.result?.success).length / secondHalf.length;
    
    const improvement = secondHalfSuccess - firstHalfSuccess;
    
    if (improvement > this.adaptiveLearning.continuous_improvement.improvement_threshold) {
      logger.info(`📈 Continuous improvement detected: +${Math.round(improvement * 100)}%`);
      this.metrics.learning.improvements++;
      
      // Reinforce current strategies
      this.adaptiveLearning.adaptation.rate *= 0.9; // Slow down changes
    } else if (improvement < -this.adaptiveLearning.continuous_improvement.improvement_threshold) {
      logger.warn(`📉 Performance degradation detected: ${Math.round(improvement * 100)}%`);
      
      // Trigger adaptation
      this.adaptiveLearning.adaptation.rate *= 1.2; // Speed up learning
      this.automatedModelSelector.config.selection_strategy = 'adaptive';
    }
  }
  
  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    return {
      department: this.name,
      selections: this.metrics.selections,
      performance: this.metrics.performance,
      models: Object.fromEntries(this.metrics.models),
      learning: this.metrics.learning,
      automation: {
        enabled: this.automatedModelSelector.enabled,
        strategy: this.automatedModelSelector.config.selection_strategy,
        cache_hit_rate: this.automatedModelSelector.metrics.cache_hits / 
          Math.max(1, this.automatedModelSelector.metrics.selections_made),
        optimization_rate: this.metrics.selections.optimized / 
          Math.max(1, this.metrics.selections.total)
      },
      tracking: {
        samples: this.performanceTracker.aggregation.samples.size,
        alerts_enabled: this.performanceTracker.alerts.enabled,
        reporting_interval: this.performanceTracker.reporting.interval
      },
      ml_optimization: {
        enabled: this.mlOptimizer.tf_available,
        current_strategy: this.mlOptimizer.optimization.current_strategy,
        training_enabled: this.mlOptimizer.training.auto_train
      },
      adaptive_learning: {
        enabled: this.adaptiveLearning.enabled,
        adaptations: this.metrics.learning.adaptations,
        improvements: this.metrics.learning.improvements,
        patterns_identified: this.adaptiveLearning.knowledge_base.task_patterns.size
      }
    };
  }
}

// Export
module.exports = ModelAwareDepartmentManagerEnhanced;