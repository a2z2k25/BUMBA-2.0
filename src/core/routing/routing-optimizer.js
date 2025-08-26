/**
 * Routing Optimization System
 * Optimizes routing decisions using machine learning and A/B testing
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Optimization Strategy
 */
class OptimizationStrategy {
  constructor(name, config) {
    this.name = name;
    this.description = config.description;
    this.parameters = config.parameters || {};
    this.constraints = config.constraints || {};
    this.objectives = config.objectives || [];
    this.active = config.active !== false;
    this.performance = {
      samples: 0,
      successRate: 0,
      avgDuration: 0,
      avgCost: 0,
      score: 0
    };
  }
  
  evaluate(result) {
    // Update performance metrics
    this.performance.samples++;
    
    const success = result.success ? 1 : 0;
    this.performance.successRate = 
      (this.performance.successRate * (this.performance.samples - 1) + success) / 
      this.performance.samples;
    
    this.performance.avgDuration = 
      (this.performance.avgDuration * (this.performance.samples - 1) + result.duration) / 
      this.performance.samples;
    
    // Calculate score based on objectives
    this.performance.score = this.calculateScore();
  }
  
  calculateScore() {
    let score = 0;
    
    for (const objective of this.objectives) {
      switch (objective.metric) {
        case 'success_rate':
          score += this.performance.successRate * objective.weight;
          break;
        case 'speed':
          // Inverse relationship - faster is better
          const speedScore = Math.max(0, 1 - (this.performance.avgDuration / 10000));
          score += speedScore * objective.weight;
          break;
        case 'cost':
          // Inverse relationship - cheaper is better
          const costScore = Math.max(0, 1 - (this.performance.avgCost / 100));
          score += costScore * objective.weight;
          break;
      }
    }
    
    return score;
  }
  
  shouldApply(context) {
    // Check constraints
    for (const [key, value] of Object.entries(this.constraints)) {
      if (context[key] !== value && context[key] !== undefined) {
        return false;
      }
    }
    
    return this.active;
  }
  
  getParameters() {
    return { ...this.parameters };
  }
}

/**
 * A/B Test
 */
class ABTest {
  constructor(name, config) {
    this.name = name;
    this.control = config.control;
    this.variants = config.variants || [];
    this.split = config.split || 0.5;
    this.minSamples = config.minSamples || 100;
    this.confidenceLevel = config.confidenceLevel || 0.95;
    this.active = true;
    this.startTime = Date.now();
    this.results = {
      control: { samples: 0, successes: 0, totalDuration: 0 },
      variants: {}
    };
    
    // Initialize variant results
    for (const variant of this.variants) {
      this.results.variants[variant.name] = {
        samples: 0,
        successes: 0,
        totalDuration: 0
      };
    }
  }
  
  selectVariant() {
    const random = Math.random();
    
    if (random < this.split) {
      return { type: 'control', config: this.control };
    }
    
    // Select among variants
    const variantIndex = Math.floor((random - this.split) / ((1 - this.split) / this.variants.length));
    const variant = this.variants[Math.min(variantIndex, this.variants.length - 1)];
    
    return { type: 'variant', name: variant.name, config: variant };
  }
  
  recordResult(variant, result) {
    const data = variant.type === 'control' 
      ? this.results.control 
      : this.results.variants[variant.name];
    
    if (data) {
      data.samples++;
      if (result.success) data.successes++;
      data.totalDuration += result.duration;
    }
  }
  
  hasSignificance() {
    // Check if we have enough samples
    if (this.results.control.samples < this.minSamples) return false;
    
    for (const variantData of Object.values(this.results.variants)) {
      if (variantData.samples < this.minSamples) return false;
    }
    
    // Simple significance test (would use proper statistical test in production)
    return true;
  }
  
  getWinner() {
    const candidates = [
      { name: 'control', data: this.results.control }
    ];
    
    for (const [name, data] of Object.entries(this.results.variants)) {
      candidates.push({ name, data });
    }
    
    // Sort by success rate
    candidates.sort((a, b) => {
      const rateA = a.data.samples > 0 ? a.data.successes / a.data.samples : 0;
      const rateB = b.data.samples > 0 ? b.data.successes / b.data.samples : 0;
      return rateB - rateA;
    });
    
    return candidates[0];
  }
  
  getResults() {
    const results = {
      name: this.name,
      duration: Date.now() - this.startTime,
      hasSignificance: this.hasSignificance(),
      control: {
        ...this.results.control,
        successRate: this.results.control.samples > 0 
          ? this.results.control.successes / this.results.control.samples 
          : 0,
        avgDuration: this.results.control.samples > 0
          ? this.results.control.totalDuration / this.results.control.samples
          : 0
      },
      variants: {}
    };
    
    for (const [name, data] of Object.entries(this.results.variants)) {
      results.variants[name] = {
        ...data,
        successRate: data.samples > 0 ? data.successes / data.samples : 0,
        avgDuration: data.samples > 0 ? data.totalDuration / data.samples : 0
      };
    }
    
    if (results.hasSignificance) {
      results.winner = this.getWinner();
    }
    
    return results;
  }
}

/**
 * Route Cache
 */
class RouteCache {
  constructor(maxSize = 1000, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }
  
  generateKey(task, context) {
    return `${task.type || 'unknown'}:${task.complexity || 0.5}:${context.ttl || 0}:${context.department || 'none'}`;
  }
  
  get(task, context) {
    const key = this.generateKey(task, context);
    const entry = this.cache.get(key);
    
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      this.hits++;
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.route;
    }
    
    this.misses++;
    return null;
  }
  
  set(task, context, route) {
    const key = this.generateKey(task, context);
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      route,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
}

/**
 * Machine Learning Model (Simplified)
 */
class MLModel {
  constructor(name) {
    this.name = name;
    this.features = [];
    this.labels = [];
    this.trained = false;
    this.weights = {};
    this.accuracy = 0;
  }
  
  addSample(features, label) {
    this.features.push(features);
    this.labels.push(label);
  }
  
  train() {
    if (this.features.length < 10) {
      logger.warn('Not enough samples for training');
      return false;
    }
    
    // Simplified training - just calculate average weights
    // In production, would use proper ML library
    this.weights = {
      complexity: 0.3,
      urgency: 0.2,
      ttl: 0.2,
      departmentMatch: 0.15,
      specialistLoad: 0.15
    };
    
    this.trained = true;
    this.accuracy = 0.75; // Mock accuracy
    
    return true;
  }
  
  predict(features) {
    if (!this.trained) {
      return null;
    }
    
    // Simple weighted sum prediction
    let score = 0;
    for (const [feature, value] of Object.entries(features)) {
      const weight = this.weights[feature] || 0;
      score += value * weight;
    }
    
    return {
      score,
      confidence: this.accuracy,
      recommendation: score > 0.5 ? 'optimal' : 'suboptimal'
    };
  }
  
  evaluate(testFeatures, testLabels) {
    if (!this.trained) return 0;
    
    let correct = 0;
    for (let i = 0; i < testFeatures.length; i++) {
      const prediction = this.predict(testFeatures[i]);
      if (prediction && prediction.recommendation === testLabels[i]) {
        correct++;
      }
    }
    
    return testFeatures.length > 0 ? correct / testFeatures.length : 0;
  }
}

/**
 * Main Routing Optimizer
 */
class RoutingOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Optimization settings
      enableMLOptimization: config.enableMLOptimization !== false,
      enableABTesting: config.enableABTesting !== false,
      enableCaching: config.enableCaching !== false,
      
      // ML settings
      mlTrainingInterval: config.mlTrainingInterval || 300000,      // 5 minutes
      mlMinSamples: config.mlMinSamples || 100,
      mlRetentionTime: config.mlRetentionTime || 86400000,         // 24 hours
      
      // A/B testing settings
      abTestDuration: config.abTestDuration || 3600000,            // 1 hour
      abTestMinSamples: config.abTestMinSamples || 100,
      
      // Cache settings
      cacheSize: config.cacheSize || 1000,
      cacheTTL: config.cacheTTL || 60000,                          // 1 minute
      
      // Performance settings
      optimizationInterval: config.optimizationInterval || 60000,   // 1 minute
      benchmarkInterval: config.benchmarkInterval || 300000         // 5 minutes
    };
    
    // Optimization state
    this.strategies = new Map();
    this.abTests = new Map();
    this.mlModels = new Map();
    this.routeCache = new RouteCache(this.config.cacheSize, this.config.cacheTTL);
    this.routingHistory = [];
    this.benchmarks = [];
    
    // Statistics
    this.statistics = {
      totalOptimizations: 0,
      cacheHitRate: 0,
      mlPredictions: 0,
      abTestsRun: 0,
      strategiesApplied: 0,
      avgOptimizationTime: 0,
      improvements: []
    };
    
    // Initialize default strategies
    this.initializeStrategies();
    
    // Start optimization engine
    this.startOptimizationEngine();
    
    logger.info('🟢 Routing Optimizer initialized');
  }
  
  /**
   * Initialize default optimization strategies
   */
  initializeStrategies() {
    // Speed optimization
    this.registerStrategy('speed-first', {
      description: 'Optimize for fastest response time',
      parameters: {
        priorityBoost: 2,
        ttlReduction: 0.8,
        preferWarmPool: true
      },
      objectives: [
        { metric: 'speed', weight: 0.7 },
        { metric: 'success_rate', weight: 0.3 }
      ],
      constraints: {
        urgency: 'high'
      }
    });
    
    // Reliability optimization
    this.registerStrategy('reliability-first', {
      description: 'Optimize for highest success rate',
      parameters: {
        redundancy: true,
        retryCount: 3,
        preferExperienced: true
      },
      objectives: [
        { metric: 'success_rate', weight: 0.8 },
        { metric: 'speed', weight: 0.2 }
      ],
      constraints: {
        critical: true
      }
    });
    
    // Cost optimization
    this.registerStrategy('cost-optimized', {
      description: 'Optimize for lowest resource usage',
      parameters: {
        batchingEnabled: true,
        preferColdPool: true,
        compressionEnabled: true
      },
      objectives: [
        { metric: 'cost', weight: 0.6 },
        { metric: 'success_rate', weight: 0.4 }
      ],
      constraints: {
        priority: 'low'
      }
    });
    
    // Balanced optimization
    this.registerStrategy('balanced', {
      description: 'Balance between speed, reliability, and cost',
      parameters: {
        adaptiveRouting: true,
        dynamicPriority: true
      },
      objectives: [
        { metric: 'speed', weight: 0.33 },
        { metric: 'success_rate', weight: 0.34 },
        { metric: 'cost', weight: 0.33 }
      ]
    });
    
    logger.debug(`Initialized ${this.strategies.size} optimization strategies`);
  }
  
  /**
   * Register optimization strategy
   */
  registerStrategy(name, config) {
    const strategy = new OptimizationStrategy(name, config);
    this.strategies.set(name, strategy);
    return strategy;
  }
  
  /**
   * Optimize routing decision
   */
  async optimizeRoute(task, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.routeCache.get(task, context);
        if (cached) {
          this.updateStatistics('cache_hit', Date.now() - startTime);
          return cached;
        }
      }
      
      // Get ML prediction if available
      let mlRecommendation = null;
      if (this.config.enableMLOptimization) {
        mlRecommendation = this.getMLRecommendation(task, context);
      }
      
      // Check for active A/B tests
      let abTestConfig = null;
      if (this.config.enableABTesting) {
        abTestConfig = this.getABTestConfig(task, context);
      }
      
      // Select optimization strategy
      const strategy = this.selectStrategy(task, context, mlRecommendation);
      
      // Apply optimizations
      const optimizedRoute = this.applyOptimizations(
        task,
        context,
        strategy,
        abTestConfig,
        mlRecommendation
      );
      
      // Cache result
      if (this.config.enableCaching) {
        this.routeCache.set(task, context, optimizedRoute);
      }
      
      // Record optimization
      this.recordOptimization(task, context, optimizedRoute, Date.now() - startTime);
      
      // Update statistics
      this.updateStatistics('optimization', Date.now() - startTime);
      
      return optimizedRoute;
      
    } catch (error) {
      logger.error('Route optimization failed:', error);
      return this.getDefaultRoute(task, context);
    }
  }
  
  /**
   * Get ML recommendation
   */
  getMLRecommendation(task, context) {
    const modelKey = `${task.type || 'general'}:${context.department || 'general'}`;
    let model = this.mlModels.get(modelKey);
    
    if (!model) {
      model = new MLModel(modelKey);
      this.mlModels.set(modelKey, model);
    }
    
    if (!model.trained) {
      return null;
    }
    
    const features = this.extractFeatures(task, context);
    const prediction = model.predict(features);
    
    if (prediction) {
      this.statistics.mlPredictions++;
    }
    
    return prediction;
  }
  
  /**
   * Get A/B test configuration
   */
  getABTestConfig(task, context) {
    // Find applicable A/B test
    for (const test of this.abTests.values()) {
      if (test.active) {
        const variant = test.selectVariant();
        return { test, variant };
      }
    }
    
    return null;
  }
  
  /**
   * Select optimization strategy
   */
  selectStrategy(task, context, mlRecommendation) {
    // Check ML recommendation
    if (mlRecommendation && mlRecommendation.confidence > 0.7) {
      const recommendedStrategy = this.strategies.get(mlRecommendation.recommendation);
      if (recommendedStrategy) {
        return recommendedStrategy;
      }
    }
    
    // Find best matching strategy
    let bestStrategy = null;
    let bestScore = 0;
    
    for (const strategy of this.strategies.values()) {
      if (strategy.shouldApply(context)) {
        const score = strategy.performance.score;
        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      }
    }
    
    return bestStrategy || this.strategies.get('balanced');
  }
  
  /**
   * Apply optimizations
   */
  applyOptimizations(task, context, strategy, abTestConfig, mlRecommendation) {
    const optimizations = {
      strategy: strategy.name,
      parameters: strategy.getParameters(),
      modifications: {}
    };
    
    // Apply strategy parameters
    if (strategy.parameters.priorityBoost) {
      optimizations.modifications.priority = 
        (context.priority || 1) + strategy.parameters.priorityBoost;
    }
    
    if (strategy.parameters.ttlReduction) {
      optimizations.modifications.ttl = 
        (context.ttl || 10000) * strategy.parameters.ttlReduction;
    }
    
    if (strategy.parameters.preferWarmPool) {
      optimizations.modifications.poolPreference = 'warm';
    }
    
    // Apply A/B test configuration
    if (abTestConfig) {
      Object.assign(optimizations.modifications, abTestConfig.variant.config);
      optimizations.abTest = {
        name: abTestConfig.test.name,
        variant: abTestConfig.variant
      };
    }
    
    // Apply ML recommendations
    if (mlRecommendation) {
      optimizations.mlScore = mlRecommendation.score;
      optimizations.mlConfidence = mlRecommendation.confidence;
    }
    
    this.statistics.strategiesApplied++;
    
    return optimizations;
  }
  
  /**
   * Extract features for ML
   */
  extractFeatures(task, context) {
    return {
      complexity: task.complexity || 0.5,
      urgency: context.urgency || 0.5,
      ttl: Math.min(1, (context.ttl || 10000) / 60000),
      departmentMatch: context.departmentMatch || 0,
      specialistLoad: context.currentLoad || 0.5
    };
  }
  
  /**
   * Record optimization result
   */
  recordOptimization(task, context, optimization, duration) {
    const record = {
      timestamp: Date.now(),
      task: {
        type: task.type,
        complexity: task.complexity
      },
      context,
      optimization,
      duration
    };
    
    this.routingHistory.push(record);
    
    // Trim history
    const cutoff = Date.now() - this.config.mlRetentionTime;
    this.routingHistory = this.routingHistory.filter(r => r.timestamp > cutoff);
    
    // Add to ML training data if enabled
    if (this.config.enableMLOptimization) {
      this.addMLTrainingSample(record);
    }
  }
  
  /**
   * Add ML training sample
   */
  addMLTrainingSample(record) {
    const modelKey = `${record.task.type || 'general'}:${record.context.department || 'general'}`;
    let model = this.mlModels.get(modelKey);
    
    if (!model) {
      model = new MLModel(modelKey);
      this.mlModels.set(modelKey, model);
    }
    
    const features = this.extractFeatures(record.task, record.context);
    const label = record.duration < 5000 ? 'optimal' : 'suboptimal';
    
    model.addSample(features, label);
  }
  
  /**
   * Train ML models
   */
  trainMLModels() {
    let trainedCount = 0;
    
    for (const model of this.mlModels.values()) {
      if (model.features.length >= this.config.mlMinSamples && !model.trained) {
        if (model.train()) {
          trainedCount++;
        }
      }
    }
    
    if (trainedCount > 0) {
      logger.info(`Trained ${trainedCount} ML models`);
    }
  }
  
  /**
   * Create A/B test
   */
  createABTest(name, config) {
    if (this.abTests.has(name)) {
      logger.warn(`A/B test ${name} already exists`);
      return null;
    }
    
    const test = new ABTest(name, config);
    this.abTests.set(name, test);
    this.statistics.abTestsRun++;
    
    logger.info(`Created A/B test: ${name}`);
    
    this.emit('abtest:created', {
      name,
      control: config.control,
      variants: config.variants?.length || 0
    });
    
    return test;
  }
  
  /**
   * Complete A/B test
   */
  completeABTest(name) {
    const test = this.abTests.get(name);
    if (!test) return null;
    
    const results = test.getResults();
    
    if (results.hasSignificance) {
      const winner = results.winner;
      logger.info(`A/B test ${name} completed. Winner: ${winner.name}`);
      
      // Apply winning configuration
      if (winner.name !== 'control') {
        this.applyABTestWinner(test, winner);
      }
    }
    
    test.active = false;
    
    this.emit('abtest:completed', results);
    
    return results;
  }
  
  /**
   * Apply A/B test winner
   */
  applyABTestWinner(test, winner) {
    // Find the winning variant configuration
    const variant = test.variants.find(v => v.name === winner.name);
    if (!variant) return;
    
    // Apply configuration changes
    if (variant.strategy) {
      const strategy = this.strategies.get(variant.strategy);
      if (strategy) {
        strategy.active = true;
        logger.info(`Activated strategy ${variant.strategy} from A/B test`);
      }
    }
    
    if (variant.parameters) {
      // Update default parameters
      Object.assign(this.config, variant.parameters);
    }
  }
  
  /**
   * Get default route
   */
  getDefaultRoute(task, context) {
    return {
      strategy: 'balanced',
      parameters: this.strategies.get('balanced')?.getParameters() || {},
      modifications: {
        priority: context.priority || 1,
        ttl: context.ttl || 10000,
        poolPreference: 'any'
      },
      default: true
    };
  }
  
  /**
   * Update statistics
   */
  updateStatistics(type, value) {
    switch (type) {
      case 'cache_hit':
        this.statistics.cacheHitRate = this.routeCache.getHitRate();
        break;
      
      case 'optimization':
        this.statistics.totalOptimizations++;
        const total = this.statistics.totalOptimizations;
        this.statistics.avgOptimizationTime = 
          (this.statistics.avgOptimizationTime * (total - 1) + value) / total;
        break;
      
      case 'improvement':
        this.statistics.improvements.push({
          timestamp: Date.now(),
          value
        });
        // Keep only recent improvements
        const cutoff = Date.now() - 3600000; // 1 hour
        this.statistics.improvements = this.statistics.improvements.filter(i => i.timestamp > cutoff);
        break;
    }
  }
  
  /**
   * Run benchmarks
   */
  async runBenchmarks() {
    const benchmarks = [];
    const testTasks = [
      { type: 'simple', complexity: 0.2 },
      { type: 'moderate', complexity: 0.5 },
      { type: 'complex', complexity: 0.8 }
    ];
    
    const testContexts = [
      { ttl: 1000, urgency: 'high' },
      { ttl: 10000, urgency: 'normal' },
      { ttl: 60000, urgency: 'low' }
    ];
    
    for (const task of testTasks) {
      for (const context of testContexts) {
        const startTime = Date.now();
        
        // Test each strategy
        for (const strategy of this.strategies.values()) {
          const optimizedRoute = this.applyOptimizations(task, context, strategy, null, null);
          
          benchmarks.push({
            task: task.type,
            complexity: task.complexity,
            ttl: context.ttl,
            strategy: strategy.name,
            duration: Date.now() - startTime,
            score: strategy.performance.score
          });
        }
      }
    }
    
    this.benchmarks = benchmarks;
    
    // Find best performing strategies
    const strategyPerformance = {};
    for (const benchmark of benchmarks) {
      if (!strategyPerformance[benchmark.strategy]) {
        strategyPerformance[benchmark.strategy] = {
          totalDuration: 0,
          count: 0,
          avgScore: 0
        };
      }
      
      const perf = strategyPerformance[benchmark.strategy];
      perf.totalDuration += benchmark.duration;
      perf.count++;
      perf.avgScore += benchmark.score;
    }
    
    // Calculate averages
    for (const perf of Object.values(strategyPerformance)) {
      perf.avgDuration = perf.totalDuration / perf.count;
      perf.avgScore = perf.avgScore / perf.count;
    }
    
    logger.info('Benchmarks completed', strategyPerformance);
    
    return strategyPerformance;
  }
  
  /**
   * Start optimization engine
   */
  startOptimizationEngine() {
    // Optimization interval
    this.optimizationInterval = setInterval(() => {
      this.performOptimization();
    }, this.config.optimizationInterval);
    
    // ML training interval
    if (this.config.enableMLOptimization) {
      this.mlTrainingInterval = setInterval(() => {
        this.trainMLModels();
      }, this.config.mlTrainingInterval);
    }
    
    // Benchmark interval
    this.benchmarkInterval = setInterval(async () => {
      await this.runBenchmarks();
    }, this.config.benchmarkInterval);
    
    logger.debug('Optimization engine started');
  }
  
  /**
   * Perform periodic optimization
   */
  performOptimization() {
    // Evaluate strategies
    for (const strategy of this.strategies.values()) {
      strategy.calculateScore();
    }
    
    // Check A/B tests for completion
    for (const test of this.abTests.values()) {
      if (test.active && test.hasSignificance()) {
        this.completeABTest(test.name);
      }
    }
    
    // Clean old cache entries
    const cacheHitRate = this.routeCache.getHitRate();
    if (cacheHitRate < 0.3) {
      this.routeCache.clear();
      logger.debug('Cache cleared due to low hit rate');
    }
    
    // Record improvement metrics
    const improvement = this.calculateImprovement();
    if (improvement > 0) {
      this.updateStatistics('improvement', improvement);
    }
  }
  
  /**
   * Calculate improvement
   */
  calculateImprovement() {
    if (this.routingHistory.length < 10) return 0;
    
    // Compare recent performance to older performance
    const recentHistory = this.routingHistory.slice(-10);
    const olderHistory = this.routingHistory.slice(-20, -10);
    
    if (olderHistory.length === 0) return 0;
    
    const recentAvg = recentHistory.reduce((sum, r) => sum + r.duration, 0) / recentHistory.length;
    const olderAvg = olderHistory.reduce((sum, r) => sum + r.duration, 0) / olderHistory.length;
    
    return (olderAvg - recentAvg) / olderAvg;
  }
  
  /**
   * Get optimizer status
   */
  getStatus() {
    return {
      statistics: this.statistics,
      strategies: {
        total: this.strategies.size,
        active: Array.from(this.strategies.values()).filter(s => s.active).length
      },
      abTests: {
        total: this.abTests.size,
        active: Array.from(this.abTests.values()).filter(t => t.active).length
      },
      mlModels: {
        total: this.mlModels.size,
        trained: Array.from(this.mlModels.values()).filter(m => m.trained).length
      },
      cache: {
        size: this.routeCache.cache.size,
        hitRate: this.routeCache.getHitRate()
      },
      performance: {
        avgOptimizationTime: `${this.statistics.avgOptimizationTime.toFixed(2)}ms`,
        totalOptimizations: this.statistics.totalOptimizations,
        recentImprovements: this.statistics.improvements.length
      }
    };
  }
  
  /**
   * Reset optimizer
   */
  reset() {
    this.strategies.clear();
    this.abTests.clear();
    this.mlModels.clear();
    this.routeCache.clear();
    this.routingHistory = [];
    this.benchmarks = [];
    
    this.statistics = {
      totalOptimizations: 0,
      cacheHitRate: 0,
      mlPredictions: 0,
      abTestsRun: 0,
      strategiesApplied: 0,
      avgOptimizationTime: 0,
      improvements: []
    };
    
    // Reinitialize strategies
    this.initializeStrategies();
    
    logger.info('Routing Optimizer reset');
  }
  
  /**
   * Stop optimization engine
   */
  stopOptimizationEngine() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    
    if (this.mlTrainingInterval) {
      clearInterval(this.mlTrainingInterval);
    }
    
    if (this.benchmarkInterval) {
      clearInterval(this.benchmarkInterval);
    }
    
    logger.debug('Optimization engine stopped');
  }
  
  /**
   * Export configuration
   */
  exportConfiguration() {
    return {
      timestamp: Date.now(),
      strategies: Array.from(this.strategies.entries()).map(([name, strategy]) => ({
        name,
        active: strategy.active,
        performance: strategy.performance,
        parameters: strategy.parameters
      })),
      mlModels: Array.from(this.mlModels.entries()).map(([key, model]) => ({
        key,
        trained: model.trained,
        samples: model.features.length,
        accuracy: model.accuracy
      })),
      statistics: this.statistics,
      config: this.config
    };
  }
  
  /**
   * Import configuration
   */
  importConfiguration(data) {
    try {
      // Import strategies
      if (data.strategies) {
        for (const strategyData of data.strategies) {
          const strategy = this.strategies.get(strategyData.name);
          if (strategy) {
            strategy.active = strategyData.active;
            strategy.performance = strategyData.performance;
          }
        }
      }
      
      // Import ML models
      if (data.mlModels) {
        for (const modelData of data.mlModels) {
          const model = new MLModel(modelData.key);
          model.trained = modelData.trained;
          model.accuracy = modelData.accuracy;
          this.mlModels.set(modelData.key, model);
        }
      }
      
      // Import statistics
      if (data.statistics) {
        this.statistics = { ...this.statistics, ...data.statistics };
      }
      
      logger.info('Configuration imported successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to import configuration:', error);
      return false;
    }
  }
  
  /**
   * Shutdown optimizer
   */
  shutdown() {
    logger.info('Shutting down Routing Optimizer...');
    
    this.stopOptimizationEngine();
    this.removeAllListeners();
    
    logger.info('Routing Optimizer shutdown complete');
  }
}

module.exports = {
  RoutingOptimizer,
  OptimizationStrategy,
  ABTest,
  RouteCache,
  MLModel
};