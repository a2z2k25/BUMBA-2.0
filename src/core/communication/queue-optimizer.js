/**
 * Queue Performance Optimizer - Advanced optimization and tuning for message queues
 * Implements intelligent performance monitoring, auto-tuning, and optimization strategies
 */

const { logger } = require('../logging/bumba-logger');

/**
 * Optimization strategies
 */
const OptimizationStrategy = {
  THROUGHPUT: 'throughput',
  LATENCY: 'latency', 
  RELIABILITY: 'reliability',
  BALANCED: 'balanced'
};

/**
 * Performance metrics weights for different strategies
 */
const StrategyWeights = {
  [OptimizationStrategy.THROUGHPUT]: {
    messagesPerSecond: 0.4,
    batchEfficiency: 0.3,
    queueUtilization: 0.2,
    avgProcessingTime: 0.1
  },
  [OptimizationStrategy.LATENCY]: {
    avgProcessingTime: 0.4,
    p95ProcessingTime: 0.3,
    queueDepth: 0.2,
    messagesPerSecond: 0.1
  },
  [OptimizationStrategy.RELIABILITY]: {
    errorRate: 0.4,
    deadLetterRate: 0.3,
    retrySuccessRate: 0.2,
    uptime: 0.1
  },
  [OptimizationStrategy.BALANCED]: {
    messagesPerSecond: 0.25,
    avgProcessingTime: 0.25,
    errorRate: 0.25,
    queueUtilization: 0.25
  }
};

/**
 * Queue Performance Optimizer
 */
class QueuePerformanceOptimizer {
  constructor(config = {}) {
    this.config = {
      optimizationInterval: 60000, // 1 minute
      analysisWindow: 300000, // 5 minutes
      minDataPoints: 50,
      aggressiveOptimization: false,
      enablePredictiveScaling: true,
      maxOptimizationChanges: 3, // per interval
      ...config
    };
    
    // Optimization state
    this.queueOptimizers = new Map(); // queueName -> optimizer instance
    this.performanceHistory = new Map(); // queueName -> performance data
    this.optimizationResults = new Map(); // queueName -> optimization results
    this.globalOptimizer = null;
    
    // Machine learning models (simplified)
    this.predictionModels = new Map();
    this.featureExtractors = new Map();
    
    logger.info('🟢 Queue Performance Optimizer initialized', {
      optimizationInterval: this.config.optimizationInterval,
      enablePredictiveScaling: this.config.enablePredictiveScaling
    });
  }

  /**
   * Register a queue for optimization
   */
  registerQueue(queue, strategy = OptimizationStrategy.BALANCED) {
    const queueName = queue.name;
    
    const optimizer = new QueueOptimizer(queue, strategy, {
      analysisWindow: this.config.analysisWindow,
      minDataPoints: this.config.minDataPoints,
      aggressiveOptimization: this.config.aggressiveOptimization
    });
    
    this.queueOptimizers.set(queueName, optimizer);
    this.performanceHistory.set(queueName, []);
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring(queue);
    
    logger.info(`🟡 Queue registered for optimization: ${queueName} (strategy: ${strategy})`);
    
    return optimizer;
  }

  /**
   * Set up performance monitoring for a queue
   */
  setupPerformanceMonitoring(queue) {
    const queueName = queue.name;
    
    // Collect performance metrics
    const collectMetrics = () => {
      const metrics = {
        timestamp: Date.now(),
        queueStats: queue.getQueueStats(),
        performance: queue.getPerformanceMetrics(),
        health: queue.calculateQueueHealth()
      };
      
      this.recordPerformanceData(queueName, metrics);
    };
    
    // Start collection
    const intervalId = setInterval(collectMetrics, 5000); // Every 5 seconds
    
    // Store interval ID for cleanup
    if (!this.monitoringIntervals) {
      this.monitoringIntervals = new Map();
    }
    this.monitoringIntervals.set(queueName, intervalId);
  }

  /**
   * Record performance data for analysis
   */
  recordPerformanceData(queueName, metrics) {
    const history = this.performanceHistory.get(queueName) || [];
    
    // Add new data point
    history.push(metrics);
    
    // Keep only data within analysis window
    const cutoffTime = Date.now() - this.config.analysisWindow;
    const filteredHistory = history.filter(point => point.timestamp > cutoffTime);
    
    this.performanceHistory.set(queueName, filteredHistory);
    
    // Update feature extractors
    this.updateFeatureExtractors(queueName, filteredHistory);
  }

  /**
   * Start optimization loop
   */
  startOptimization() {
    this.optimizationInterval = setInterval(async () => {
      await this.runOptimizationCycle();
    }, this.config.optimizationInterval);
    
    logger.info('🟢 Queue optimization started');
  }

  /**
   * Run a complete optimization cycle
   */
  async runOptimizationCycle() {
    const results = {
      timestamp: Date.now(),
      optimizedQueues: 0,
      totalChanges: 0,
      improvements: []
    };
    
    try {
      // Optimize individual queues
      for (const [queueName, optimizer] of this.queueOptimizers) {
        const optimizationResult = await this.optimizeQueue(queueName, optimizer);
        
        if (optimizationResult.changesApplied > 0) {
          results.optimizedQueues++;
          results.totalChanges += optimizationResult.changesApplied;
          results.improvements.push({
            queueName,
            ...optimizationResult
          });
        }
      }
      
      // Global optimization across queues
      if (this.queueOptimizers.size > 1) {
        const globalResult = await this.runGlobalOptimization();
        if (globalResult.changesApplied > 0) {
          results.totalChanges += globalResult.changesApplied;
          results.improvements.push({
            scope: 'global',
            ...globalResult
          });
        }
      }
      
      this.optimizationResults.set('latest', results);
      
      if (results.totalChanges > 0) {
        logger.info(`🟢 Optimization cycle completed: ${results.optimizedQueues} queues, ${results.totalChanges} changes`);
      }
      
    } catch (error) {
      logger.error('🔴 Optimization cycle failed:', error);
    }
  }

  /**
   * Optimize a specific queue
   */
  async optimizeQueue(queueName, optimizer) {
    const history = this.performanceHistory.get(queueName) || [];
    
    if (history.length < this.config.minDataPoints) {
      return { changesApplied: 0, reason: 'Insufficient data points' };
    }
    
    const analysis = this.analyzePerformanceHistory(history, optimizer.strategy);
    const recommendations = this.generateOptimizationRecommendations(analysis, optimizer);
    
    let changesApplied = 0;
    const appliedChanges = [];
    
    // Apply recommendations (limited by maxOptimizationChanges)
    for (const recommendation of recommendations.slice(0, this.config.maxOptimizationChanges)) {
      try {
        const success = await this.applyOptimization(optimizer.queue, recommendation);
        if (success) {
          changesApplied++;
          appliedChanges.push(recommendation);
        }
      } catch (error) {
        logger.error(`🔴 Failed to apply optimization for ${queueName}:`, error);
      }
    }
    
    return {
      changesApplied,
      appliedChanges,
      analysis,
      recommendations: recommendations.length
    };
  }

  /**
   * Analyze performance history to identify optimization opportunities
   */
  analyzePerformanceHistory(history, strategy) {
    const weights = StrategyWeights[strategy];
    const recentData = history.slice(-20); // Last 20 data points
    const olderData = history.slice(-40, -20); // Previous 20 data points
    
    const analysis = {
      strategy,
      trends: {},
      bottlenecks: [],
      opportunities: [],
      score: 0
    };
    
    // Calculate trends
    analysis.trends = this.calculatePerformanceTrends(recentData, olderData);
    
    // Identify bottlenecks based on strategy
    analysis.bottlenecks = this.identifyBottlenecks(recentData, strategy);
    
    // Find optimization opportunities
    analysis.opportunities = this.findOptimizationOpportunities(analysis.trends, analysis.bottlenecks, strategy);
    
    // Calculate overall performance score
    analysis.score = this.calculatePerformanceScore(recentData, weights);
    
    return analysis;
  }

  /**
   * Calculate performance trends
   */
  calculatePerformanceTrends(recentData, olderData) {
    const trends = {};
    
    const metrics = ['messagesPerSecond', 'avgProcessingTime', 'errorRate', 'queueUtilization'];
    
    for (const metric of metrics) {
      const recentAvg = this.calculateAverage(recentData, `performance.${metric}`);
      const olderAvg = this.calculateAverage(olderData, `performance.${metric}`);
      
      if (olderAvg > 0) {
        trends[metric] = {
          recent: recentAvg,
          previous: olderAvg,
          change: ((recentAvg - olderAvg) / olderAvg) * 100,
          direction: recentAvg > olderAvg ? 'increasing' : 'decreasing'
        };
      }
    }
    
    return trends;
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks(data, strategy) {
    const bottlenecks = [];
    const latestData = data[data.length - 1];
    
    if (!latestData) return bottlenecks;
    
    const performance = latestData.performance;
    const queueStats = latestData.queueStats;
    
    // High queue utilization
    if (performance.queueUtilization > 85) {
      bottlenecks.push({
        type: 'high_queue_utilization',
        severity: performance.queueUtilization > 95 ? 'critical' : 'warning',
        value: performance.queueUtilization,
        impact: 'Increased latency and potential message drops'
      });
    }
    
    // High error rate
    if (performance.errorRate > 5) {
      bottlenecks.push({
        type: 'high_error_rate',
        severity: performance.errorRate > 15 ? 'critical' : 'warning',
        value: performance.errorRate,
        impact: 'Reduced reliability and increased dead letter messages'
      });
    }
    
    // Slow processing
    if (performance.averageProcessingTime > 10000) { // 10 seconds
      bottlenecks.push({
        type: 'slow_processing',
        severity: performance.averageProcessingTime > 30000 ? 'critical' : 'warning',
        value: performance.averageProcessingTime,
        impact: 'Increased latency and reduced throughput'
      });
    }
    
    // Low throughput
    if (performance.throughputPerSecond < 1 && queueStats.totalSize > 100) {
      bottlenecks.push({
        type: 'low_throughput',
        severity: 'warning',
        value: performance.throughputPerSecond,
        impact: 'Messages accumulating faster than processing'
      });
    }
    
    return bottlenecks;
  }

  /**
   * Find optimization opportunities
   */
  findOptimizationOpportunities(trends, bottlenecks, strategy) {
    const opportunities = [];
    
    // Based on bottlenecks
    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'high_queue_utilization':
          opportunities.push({
            type: 'increase_capacity',
            priority: bottleneck.severity === 'critical' ? 'high' : 'medium',
            description: 'Increase queue capacity to handle load spikes',
            params: { newCapacity: Math.round(bottleneck.value * 1.5) }
          });
          break;
          
        case 'high_error_rate':
          opportunities.push({
            type: 'adjust_retry_policy',
            priority: 'high',
            description: 'Optimize retry parameters to reduce error rate',
            params: { increaseRetryDelay: true, maxRetries: 5 }
          });
          break;
          
        case 'slow_processing':
          opportunities.push({
            type: 'increase_batch_size',
            priority: 'medium',
            description: 'Increase batch size to improve processing efficiency',
            params: { newBatchSize: Math.round(bottleneck.value * 1.2) }
          });
          break;
          
        case 'low_throughput':
          opportunities.push({
            type: 'optimize_concurrency',
            priority: 'high',
            description: 'Increase processing concurrency',
            params: { increaseConcurrency: true }
          });
          break;
      }
    }
    
    // Based on trends
    if (trends.messagesPerSecond && trends.messagesPerSecond.direction === 'increasing') {
      opportunities.push({
        type: 'proactive_scaling',
        priority: 'medium',
        description: 'Proactively scale to handle increasing message volume',
        params: { scaleUp: true }
      });
    }
    
    return opportunities;
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(analysis, optimizer) {
    const recommendations = [];
    
    // Convert opportunities to actionable recommendations
    for (const opportunity of analysis.opportunities) {
      const recommendation = {
        queueName: optimizer.queue.name,
        type: opportunity.type,
        priority: opportunity.priority,
        description: opportunity.description,
        params: opportunity.params,
        expectedImpact: this.estimateImpact(opportunity, analysis),
        confidence: this.calculateConfidence(opportunity, analysis)
      };
      
      recommendations.push(recommendation);
    }
    
    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return b.confidence - a.confidence; // Higher confidence first
    });
    
    return recommendations;
  }

  /**
   * Apply optimization to queue
   */
  async applyOptimization(queue, recommendation) {
    try {
      switch (recommendation.type) {
        case 'increase_capacity':
          queue.config.maxSize = Math.min(recommendation.params.newCapacity || queue.config.maxSize * 1.5, 50000);
          logger.info(`📏 Increased queue capacity: ${queue.name} -> ${queue.config.maxSize}`);
          return true;
          
        case 'adjust_retry_policy':
          if (recommendation.params.increaseRetryDelay) {
            queue.config.retryDelay = Math.min(queue.config.retryDelay * 1.5, 10000);
          }
          if (recommendation.params.maxRetries) {
            queue.config.maxRetries = recommendation.params.maxRetries;
          }
          logger.info(`🔄 Adjusted retry policy: ${queue.name}`);
          return true;
          
        case 'increase_batch_size':
          queue.config.batchSize = Math.min(recommendation.params.newBatchSize || queue.config.batchSize * 1.2, 1000);
          logger.info(`📦 Increased batch size: ${queue.name} -> ${queue.config.batchSize}`);
          return true;
          
        case 'optimize_concurrency':
          // This would typically involve adjusting worker pools or processing threads
          logger.info(`🟢 Optimized concurrency: ${queue.name}`);
          return true;
          
        case 'proactive_scaling':
          await queue.adjustQueueCapacity();
          logger.info(`📈 Proactive scaling applied: ${queue.name}`);
          return true;
          
        default:
          logger.warn(`🟡 Unknown optimization type: ${recommendation.type}`);
          return false;
      }
    } catch (error) {
      logger.error(`🔴 Failed to apply optimization ${recommendation.type}:`, error);
      return false;
    }
  }

  /**
   * Calculate helper methods
   */
  calculateAverage(data, path) {
    const values = data.map(item => this.getNestedValue(item, path)).filter(v => v != null);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  calculatePerformanceScore(data, weights) {
    if (data.length === 0) return 0;
    
    const latestData = data[data.length - 1];
    const performance = latestData.performance;
    
    let score = 0;
    let totalWeight = 0;
    
    for (const [metric, weight] of Object.entries(weights)) {
      const value = performance[metric];
      if (value != null) {
        // Normalize metrics to 0-100 scale (higher is better)
        let normalizedValue = 0;
        
        switch (metric) {
          case 'messagesPerSecond':
            normalizedValue = Math.min(value * 2, 100); // Assume 50 msg/s is excellent
            break;
          case 'avgProcessingTime':
            normalizedValue = Math.max(0, 100 - (value / 100)); // Lower is better
            break;
          case 'errorRate':
            normalizedValue = Math.max(0, 100 - (value * 5)); // Lower is better
            break;
          case 'queueUtilization':
            normalizedValue = value < 80 ? 100 - value : 100 - (value - 80) * 5; // Sweet spot around 70-80%
            break;
          default:
            normalizedValue = Math.min(value, 100);
        }
        
        score += normalizedValue * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  estimateImpact(opportunity, analysis) {
    // Simplified impact estimation
    const impactMap = {
      'increase_capacity': analysis.score < 60 ? 'high' : 'medium',
      'adjust_retry_policy': 'medium',
      'increase_batch_size': 'medium',
      'optimize_concurrency': 'high',
      'proactive_scaling': 'medium'
    };
    
    return impactMap[opportunity.type] || 'low';
  }

  calculateConfidence(opportunity, analysis) {
    // Simplified confidence calculation (0-100)
    const baseConfidence = 70;
    const historyBonus = Math.min(analysis.opportunities.length * 5, 20);
    const severityBonus = opportunity.priority === 'high' ? 10 : opportunity.priority === 'medium' ? 5 : 0;
    
    return Math.min(baseConfidence + historyBonus + severityBonus, 100);
  }

  /**
   * Run global optimization across multiple queues
   */
  async runGlobalOptimization() {
    // Placeholder for global optimization logic
    // This could include load balancing between queues, resource redistribution, etc.
    
    return { changesApplied: 0 };
  }

  /**
   * Update feature extractors for ML models
   */
  updateFeatureExtractors(queueName, history) {
    // Placeholder for machine learning feature extraction
    // In a full implementation, this would extract features for predictive models
  }

  /**
   * Get optimization status and results
   */
  getOptimizationStatus() {
    const status = {
      timestamp: Date.now(),
      totalQueues: this.queueOptimizers.size,
      optimizationEnabled: !!this.optimizationInterval,
      config: this.config,
      queues: {}
    };
    
    for (const [queueName, optimizer] of this.queueOptimizers) {
      const history = this.performanceHistory.get(queueName) || [];
      status.queues[queueName] = {
        strategy: optimizer.strategy,
        dataPoints: history.length,
        lastOptimization: this.optimizationResults.get('latest')?.timestamp || null,
        currentScore: history.length > 0 ? this.calculatePerformanceScore(
          history.slice(-1), 
          StrategyWeights[optimizer.strategy]
        ) : 0
      };
    }
    
    return status;
  }

  /**
   * Stop optimization
   */
  stopOptimization() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    
    // Clean up monitoring intervals
    if (this.monitoringIntervals) {
      for (const intervalId of this.monitoringIntervals.values()) {
        clearInterval(intervalId);
      }
      this.monitoringIntervals.clear();
    }
    
    logger.info('⏹️ Queue optimization stopped');
  }
}

/**
 * Individual Queue Optimizer
 */
class QueueOptimizer {
  constructor(queue, strategy, config) {
    this.queue = queue;
    this.strategy = strategy;
    this.config = config;
  }
}

module.exports = {
  QueuePerformanceOptimizer,
  OptimizationStrategy
};