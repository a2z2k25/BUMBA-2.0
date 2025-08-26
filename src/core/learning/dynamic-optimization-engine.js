/**
 * BUMBA Dynamic Optimization Rules Engine
 * Adaptive optimization with learning-based rule generation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const patternModels = require('./pattern-recognition-models');

class DynamicOptimizationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      learningRate: config.learningRate || 0.1,
      explorationRate: config.explorationRate || 0.2,
      decayRate: config.decayRate || 0.99,
      updateInterval: config.updateInterval || 60000, // 1 minute
      historyWindow: config.historyWindow || 100,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      ...config
    };
    
    // Rule storage
    this.rules = new Map();
    this.activeRules = new Set();
    this.ruleHistory = [];
    
    // Performance tracking
    this.performance = new Map();
    this.metrics = {
      totalOptimizations: 0,
      successfulOptimizations: 0,
      averageImprovement: 0,
      ruleHitRate: 0
    };
    
    // Learning state
    this.learningState = {
      contextPatterns: new Map(),
      outcomeHistory: [],
      ruleEffectiveness: new Map(),
      adaptationRate: this.config.learningRate
    };
    
    // Initialize base rules
    this.initializeBaseRules();
    
    // Start learning cycle
    this.startLearningCycle();
  }
  
  /**
   * Initialize base optimization rules
   */
  initializeBaseRules() {
    // Performance optimization rules
    this.addRule('cache_optimization', {
      condition: (context) => context.cacheHitRate < 0.5,
      action: (context) => ({
        type: 'adjust_cache',
        params: {
          size: context.cacheSize * 1.5,
          strategy: 'lru',
          ttl: context.cacheTTL * 0.8
        }
      }),
      priority: 8,
      category: 'performance'
    });
    
    this.addRule('memory_optimization', {
      condition: (context) => context.memoryUsage > 0.8,
      action: (context) => ({
        type: 'reduce_memory',
        params: {
          gcForce: true,
          cacheEviction: 0.3,
          bufferReduction: 0.2
        }
      }),
      priority: 10,
      category: 'resource'
    });
    
    this.addRule('concurrency_optimization', {
      condition: (context) => context.cpuUsage < 0.3 && context.queueLength > 10,
      action: (context) => ({
        type: 'increase_concurrency',
        params: {
          workers: Math.min(context.workers * 2, 16),
          batchSize: context.batchSize * 1.5
        }
      }),
      priority: 6,
      category: 'performance'
    });
    
    this.addRule('network_optimization', {
      condition: (context) => context.networkLatency > 100,
      action: (context) => ({
        type: 'optimize_network',
        params: {
          compression: true,
          batching: true,
          connectionPooling: true,
          keepAlive: true
        }
      }),
      priority: 7,
      category: 'network'
    });
    
    this.addRule('error_rate_optimization', {
      condition: (context) => context.errorRate > 0.05,
      action: (context) => ({
        type: 'error_mitigation',
        params: {
          retryLimit: 5,
          circuitBreaker: true,
          fallbackEnabled: true,
          rateLimit: context.requestRate * 0.8
        }
      }),
      priority: 9,
      category: 'reliability'
    });
    
    logger.info(`Initialized ${this.rules.size} base optimization rules`);
  }
  
  /**
   * Add a new optimization rule
   */
  addRule(id, rule) {
    this.rules.set(id, {
      id,
      ...rule,
      created: Date.now(),
      applied: 0,
      successful: 0,
      effectiveness: 0,
      learned: false
    });
  }
  
  /**
   * Learn and generate new rules from patterns
   */
  async learnNewRules(context, outcome) {
    try {
      // Record context-outcome pair
      this.recordLearningData(context, outcome);
      
      // Analyze patterns
      const patterns = await this.analyzePatterns();
      
      // Generate new rules from patterns
      for (const pattern of patterns) {
        if (pattern.confidence > this.config.confidenceThreshold) {
          const newRule = this.generateRuleFromPattern(pattern);
          if (newRule) {
            this.addRule(newRule.id, newRule);
            logger.info(`Learned new rule: ${newRule.id}`);
          }
        }
      }
      
      // Adapt existing rules
      await this.adaptExistingRules(outcome);
      
      // Prune ineffective rules
      this.pruneIneffectiveRules();
      
    } catch (error) {
      logger.error('Failed to learn new rules:', error);
    }
  }
  
  /**
   * Record learning data
   */
  recordLearningData(context, outcome) {
    const dataPoint = {
      context: this.extractFeatures(context),
      outcome,
      timestamp: Date.now()
    };
    
    this.learningState.outcomeHistory.push(dataPoint);
    
    // Keep only recent history
    if (this.learningState.outcomeHistory.length > this.config.historyWindow) {
      this.learningState.outcomeHistory.shift();
    }
    
    // Update context patterns
    const contextKey = this.getContextKey(context);
    if (!this.learningState.contextPatterns.has(contextKey)) {
      this.learningState.contextPatterns.set(contextKey, []);
    }
    this.learningState.contextPatterns.get(contextKey).push(outcome);
  }
  
  /**
   * Extract features from context
   */
  extractFeatures(context) {
    return {
      performance: {
        cpu: context.cpuUsage || 0,
        memory: context.memoryUsage || 0,
        disk: context.diskUsage || 0,
        network: context.networkLatency || 0
      },
      load: {
        requests: context.requestRate || 0,
        queue: context.queueLength || 0,
        connections: context.activeConnections || 0
      },
      quality: {
        errorRate: context.errorRate || 0,
        responseTime: context.avgResponseTime || 0,
        successRate: context.successRate || 1
      },
      cache: {
        hitRate: context.cacheHitRate || 0,
        size: context.cacheSize || 0,
        evictionRate: context.cacheEvictionRate || 0
      }
    };
  }
  
  /**
   * Analyze patterns in learning data
   */
  async analyzePatterns() {
    const patterns = [];
    
    // Group by similar contexts
    const contextGroups = this.groupSimilarContexts();
    
    for (const [groupKey, group] of contextGroups) {
      // Calculate average outcome for this context
      const avgOutcome = this.calculateAverageOutcome(group.outcomes);
      
      // Identify significant patterns
      if (group.outcomes.length >= 3) {
        const pattern = {
          context: group.context,
          expectedOutcome: avgOutcome,
          confidence: this.calculateConfidence(group.outcomes),
          frequency: group.outcomes.length,
          trend: this.calculateTrend(group.outcomes)
        };
        
        patterns.push(pattern);
      }
    }
    
    // Use ML model for pattern recognition if available
    if (this.config.useML) {
      const mlPatterns = await this.detectMLPatterns();
      patterns.push(...mlPatterns);
    }
    
    return patterns;
  }
  
  /**
   * Group similar contexts
   */
  groupSimilarContexts() {
    const groups = new Map();
    
    for (const dataPoint of this.learningState.outcomeHistory) {
      const key = this.getContextKey(dataPoint.context);
      
      if (!groups.has(key)) {
        groups.set(key, {
          context: dataPoint.context,
          outcomes: []
        });
      }
      
      groups.get(key).outcomes.push(dataPoint.outcome);
    }
    
    return groups;
  }
  
  /**
   * Generate context key for grouping
   */
  getContextKey(context) {
    // Create a key based on discretized context values
    const features = typeof context === 'object' && context.performance ? 
      context : this.extractFeatures(context);
    
    return [
      Math.floor((features.performance.cpu || 0) * 10),
      Math.floor((features.performance.memory || 0) * 10),
      Math.floor((features.load.requests || 0) / 100),
      Math.floor((features.quality.errorRate || 0) * 100)
    ].join('-');
  }
  
  /**
   * Generate rule from pattern
   */
  generateRuleFromPattern(pattern) {
    const ruleId = `learned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create condition based on pattern context
    const condition = (context) => {
      const features = this.extractFeatures(context);
      return this.matchesPattern(features, pattern.context);
    };
    
    // Create action based on expected outcome
    const action = (context) => {
      return this.generateOptimalAction(context, pattern);
    };
    
    return {
      id: ruleId,
      condition,
      action,
      priority: Math.floor(pattern.confidence * 10),
      category: 'learned',
      pattern,
      learned: true
    };
  }
  
  /**
   * Check if context matches pattern
   */
  matchesPattern(features, patternContext) {
    const threshold = 0.8; // 80% similarity required
    let matches = 0;
    let total = 0;
    
    // Compare all feature values
    for (const category of Object.keys(features)) {
      for (const metric of Object.keys(features[category])) {
        total++;
        if (patternContext[category] && patternContext[category][metric] !== undefined) {
          const diff = Math.abs(features[category][metric] - patternContext[category][metric]);
          if (diff < 0.2) matches++; // Within 20% is considered a match
        }
      }
    }
    
    return (matches / total) >= threshold;
  }
  
  /**
   * Generate optimal action based on pattern
   */
  generateOptimalAction(context, pattern) {
    const actions = {
      type: 'optimize',
      params: {}
    };
    
    // Determine action based on pattern trend
    if (pattern.trend === 'improving') {
      // Continue current trajectory
      actions.type = 'maintain';
      actions.params = { adjustmentFactor: 1.1 };
    } else if (pattern.trend === 'degrading') {
      // Reverse current trajectory
      actions.type = 'reverse';
      actions.params = { adjustmentFactor: 0.8 };
    } else {
      // Apply learned optimization
      actions.type = 'learned_optimization';
      actions.params = this.calculateOptimalParameters(context, pattern);
    }
    
    return actions;
  }
  
  /**
   * Calculate optimal parameters
   */
  calculateOptimalParameters(context, pattern) {
    const params = {};
    
    // Resource adjustments
    if (pattern.context.performance) {
      if (pattern.context.performance.memory > 0.7) {
        params.memoryLimit = context.memoryLimit * 1.2;
      }
      if (pattern.context.performance.cpu > 0.7) {
        params.cpuShares = context.cpuShares * 1.5;
      }
    }
    
    // Load adjustments
    if (pattern.context.load) {
      if (pattern.context.load.requests > 1000) {
        params.rateLimit = pattern.context.load.requests * 0.9;
        params.cacheSize = (context.cacheSize || 100) * 1.5;
      }
    }
    
    // Quality adjustments
    if (pattern.context.quality) {
      if (pattern.context.quality.errorRate > 0.01) {
        params.retryPolicy = 'exponential';
        params.timeout = (context.timeout || 5000) * 1.2;
      }
    }
    
    return params;
  }
  
  /**
   * Adapt existing rules based on outcomes
   */
  async adaptExistingRules(outcome) {
    for (const [ruleId, rule] of this.rules) {
      if (this.activeRules.has(ruleId)) {
        // Update rule effectiveness
        const effectiveness = this.calculateRuleEffectiveness(rule, outcome);
        rule.effectiveness = rule.effectiveness * 0.9 + effectiveness * 0.1; // Exponential moving average
        
        // Adapt rule parameters if needed
        if (rule.effectiveness < 0.5 && rule.applied > 10) {
          this.adaptRuleParameters(rule);
        }
        
        // Update priority based on effectiveness
        rule.priority = Math.max(1, Math.min(10, Math.floor(rule.effectiveness * 10)));
      }
    }
  }
  
  /**
   * Calculate rule effectiveness
   */
  calculateRuleEffectiveness(rule, outcome) {
    const improvement = outcome.improvement || 0;
    const cost = outcome.cost || 0;
    const reliability = outcome.success ? 1 : 0;
    
    // Weighted effectiveness score
    return (improvement * 0.5 + (1 - cost) * 0.3 + reliability * 0.2);
  }
  
  /**
   * Adapt rule parameters
   */
  adaptRuleParameters(rule) {
    if (!rule.learned) return; // Don't adapt base rules
    
    // Adjust condition threshold
    if (rule.pattern) {
      rule.pattern.confidence *= 0.95; // Reduce confidence
      
      // Make condition less strict
      const originalCondition = rule.condition;
      rule.condition = (context) => {
        const result = originalCondition(context);
        // Add some randomness for exploration
        return result || (Math.random() < this.config.explorationRate);
      };
    }
    
    logger.info(`Adapted rule ${rule.id} due to low effectiveness`);
  }
  
  /**
   * Prune ineffective rules
   */
  pruneIneffectiveRules() {
    const toRemove = [];
    
    for (const [ruleId, rule] of this.rules) {
      // Remove learned rules that are ineffective
      if (rule.learned && rule.applied > 20 && rule.effectiveness < 0.3) {
        toRemove.push(ruleId);
      }
    }
    
    for (const ruleId of toRemove) {
      this.rules.delete(ruleId);
      this.activeRules.delete(ruleId);
      logger.info(`Pruned ineffective rule: ${ruleId}`);
    }
  }
  
  /**
   * Optimize based on current context
   */
  async optimize(context) {
    try {
      this.metrics.totalOptimizations++;
      
      // Find applicable rules
      const applicableRules = this.findApplicableRules(context);
      
      if (applicableRules.length === 0) {
        // No rules match, try exploration
        return this.exploratoryOptimization(context);
      }
      
      // Sort by priority
      applicableRules.sort((a, b) => b.priority - a.priority);
      
      // Apply highest priority rules
      const actions = [];
      const appliedRules = [];
      
      for (const rule of applicableRules.slice(0, 3)) { // Apply top 3 rules
        const action = rule.action(context);
        actions.push(action);
        appliedRules.push(rule.id);
        
        // Update rule statistics
        rule.applied++;
        this.activeRules.add(rule.id);
      }
      
      // Combine actions
      const combinedAction = this.combineActions(actions);
      
      // Record for learning
      this.ruleHistory.push({
        context,
        rules: appliedRules,
        action: combinedAction,
        timestamp: Date.now()
      });
      
      this.emit('optimization', {
        context,
        action: combinedAction,
        rules: appliedRules
      });
      
      return {
        action: combinedAction,
        rules: appliedRules,
        confidence: this.calculateActionConfidence(applicableRules),
        success: true
      };
      
    } catch (error) {
      logger.error('Optimization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Find applicable rules for context
   */
  findApplicableRules(context) {
    const applicable = [];
    
    for (const [ruleId, rule] of this.rules) {
      try {
        if (rule.condition(context)) {
          applicable.push(rule);
        }
      } catch (error) {
        logger.warn(`Rule ${ruleId} condition failed:`, error.message);
      }
    }
    
    return applicable;
  }
  
  /**
   * Exploratory optimization for unknown contexts
   */
  exploratoryOptimization(context) {
    logger.info('Performing exploratory optimization');
    
    // Try a random adjustment
    const exploration = {
      type: 'explore',
      params: {}
    };
    
    // Random resource adjustments
    if (Math.random() < 0.5) {
      exploration.params.cacheSize = context.cacheSize * (0.8 + Math.random() * 0.4);
    }
    if (Math.random() < 0.5) {
      exploration.params.workers = Math.floor(context.workers * (0.8 + Math.random() * 0.4));
    }
    if (Math.random() < 0.5) {
      exploration.params.batchSize = Math.floor(context.batchSize * (0.8 + Math.random() * 0.4));
    }
    
    return {
      action: exploration,
      rules: ['exploration'],
      confidence: 0.3,
      success: true
    };
  }
  
  /**
   * Combine multiple actions into one
   */
  combineActions(actions) {
    if (actions.length === 0) return null;
    if (actions.length === 1) return actions[0];
    
    // Merge actions intelligently
    const combined = {
      type: 'combined',
      params: {},
      subActions: actions
    };
    
    // Merge parameters
    for (const action of actions) {
      if (action.params) {
        for (const [key, value] of Object.entries(action.params)) {
          if (combined.params[key] === undefined) {
            combined.params[key] = value;
          } else if (typeof value === 'number') {
            // Average numeric values
            combined.params[key] = (combined.params[key] + value) / 2;
          } else if (typeof value === 'boolean') {
            // OR boolean values
            combined.params[key] = combined.params[key] || value;
          }
        }
      }
    }
    
    return combined;
  }
  
  /**
   * Calculate action confidence
   */
  calculateActionConfidence(rules) {
    if (rules.length === 0) return 0;
    
    // Average effectiveness of applied rules
    const avgEffectiveness = rules.reduce((sum, rule) => 
      sum + (rule.effectiveness || 0.5), 0) / rules.length;
    
    // Boost confidence if multiple rules agree
    const agreementBonus = Math.min(0.2, rules.length * 0.05);
    
    return Math.min(1, avgEffectiveness + agreementBonus);
  }
  
  /**
   * Provide optimization feedback
   */
  async provideFeedback(actionId, outcome) {
    // Find the action in history
    const historyEntry = this.ruleHistory.find(h => 
      h.timestamp === actionId || h.action === actionId
    );
    
    if (!historyEntry) {
      logger.warn('Action not found in history');
      return;
    }
    
    // Update rule effectiveness
    for (const ruleId of historyEntry.rules) {
      const rule = this.rules.get(ruleId);
      if (rule) {
        if (outcome.success) {
          rule.successful++;
        }
        rule.effectiveness = rule.successful / rule.applied;
      }
    }
    
    // Learn from outcome
    await this.learnNewRules(historyEntry.context, outcome);
    
    // Update metrics
    if (outcome.success) {
      this.metrics.successfulOptimizations++;
      this.metrics.averageImprovement = 
        (this.metrics.averageImprovement * (this.metrics.successfulOptimizations - 1) + 
         (outcome.improvement || 0)) / this.metrics.successfulOptimizations;
    }
    
    this.metrics.ruleHitRate = this.metrics.successfulOptimizations / this.metrics.totalOptimizations;
  }
  
  /**
   * Detect patterns using ML
   */
  async detectMLPatterns() {
    try {
      // Prepare data for ML model
      const data = this.learningState.outcomeHistory.map(d => ({
        input: this.flattenContext(d.context),
        output: this.encodeOutcome(d.outcome)
      }));
      
      if (data.length < 10) return [];
      
      // Use pattern recognition model
      const result = await patternModels.predictTimeSeries(
        data.map(d => d.output),
        5
      );
      
      // Convert predictions to patterns
      const patterns = [];
      if (result.predictions.length > 0) {
        patterns.push({
          context: this.reconstructContext(data[data.length - 1].input),
          expectedOutcome: this.decodeOutcome(result.predictions[0]),
          confidence: result.confidence,
          frequency: 1,
          trend: 'predicted'
        });
      }
      
      return patterns;
      
    } catch (error) {
      logger.error('ML pattern detection failed:', error);
      return [];
    }
  }
  
  /**
   * Flatten context for ML
   */
  flattenContext(context) {
    const flat = [];
    
    const flatten = (obj) => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'number') {
          flat.push(value);
        } else if (typeof value === 'object') {
          flatten(value);
        }
      }
    };
    
    flatten(context);
    return flat;
  }
  
  /**
   * Encode outcome for ML
   */
  encodeOutcome(outcome) {
    return outcome.improvement || 0;
  }
  
  /**
   * Decode outcome from ML
   */
  decodeOutcome(value) {
    return { improvement: value };
  }
  
  /**
   * Reconstruct context from flat array
   */
  reconstructContext(flat) {
    // Simplified reconstruction
    return {
      performance: {
        cpu: flat[0] || 0,
        memory: flat[1] || 0
      },
      load: {
        requests: flat[2] || 0
      }
    };
  }
  
  /**
   * Calculate average outcome
   */
  calculateAverageOutcome(outcomes) {
    if (outcomes.length === 0) return { improvement: 0 };
    
    const avg = {
      improvement: outcomes.reduce((sum, o) => sum + (o.improvement || 0), 0) / outcomes.length,
      success: outcomes.filter(o => o.success).length / outcomes.length
    };
    
    return avg;
  }
  
  /**
   * Calculate confidence in outcomes
   */
  calculateConfidence(outcomes) {
    if (outcomes.length < 2) return 0.5;
    
    // Calculate variance
    const avg = this.calculateAverageOutcome(outcomes);
    const variance = outcomes.reduce((sum, o) => {
      const diff = (o.improvement || 0) - avg.improvement;
      return sum + diff * diff;
    }, 0) / outcomes.length;
    
    // Lower variance = higher confidence
    return 1 / (1 + variance);
  }
  
  /**
   * Calculate trend in outcomes
   */
  calculateTrend(outcomes) {
    if (outcomes.length < 3) return 'stable';
    
    // Simple linear regression
    const recent = outcomes.slice(-5);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const avgFirst = this.calculateAverageOutcome(firstHalf).improvement;
    const avgSecond = this.calculateAverageOutcome(secondHalf).improvement;
    
    if (avgSecond > avgFirst * 1.1) return 'improving';
    if (avgSecond < avgFirst * 0.9) return 'degrading';
    return 'stable';
  }
  
  /**
   * Start learning cycle
   */
  startLearningCycle() {
    this.learningInterval = setInterval(() => {
      this.performLearningCycle();
    }, this.config.updateInterval);
  }
  
  /**
   * Perform one learning cycle
   */
  async performLearningCycle() {
    // Decay exploration rate
    this.config.explorationRate *= this.config.decayRate;
    this.config.explorationRate = Math.max(0.01, this.config.explorationRate);
    
    // Analyze recent performance
    const recentHistory = this.ruleHistory.slice(-20);
    if (recentHistory.length > 0) {
      const performance = this.analyzeRecentPerformance(recentHistory);
      
      // Adjust learning rate based on performance
      if (performance.trend === 'improving') {
        this.learningState.adaptationRate *= 0.95; // Slow down if improving
      } else if (performance.trend === 'degrading') {
        this.learningState.adaptationRate *= 1.05; // Speed up if degrading
      }
      
      this.learningState.adaptationRate = Math.max(0.001, Math.min(0.5, this.learningState.adaptationRate));
    }
    
    this.emit('learning-cycle', {
      explorationRate: this.config.explorationRate,
      adaptationRate: this.learningState.adaptationRate,
      totalRules: this.rules.size,
      activeRules: this.activeRules.size
    });
  }
  
  /**
   * Analyze recent performance
   */
  analyzeRecentPerformance(history) {
    const outcomes = history.map(h => h.outcome).filter(o => o);
    
    return {
      count: history.length,
      successRate: outcomes.filter(o => o.success).length / outcomes.length,
      avgImprovement: outcomes.reduce((sum, o) => sum + (o.improvement || 0), 0) / outcomes.length,
      trend: this.calculateTrend(outcomes)
    };
  }
  
  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      ...this.metrics,
      totalRules: this.rules.size,
      activeRules: this.activeRules.size,
      learnedRules: Array.from(this.rules.values()).filter(r => r.learned).length,
      explorationRate: this.config.explorationRate,
      adaptationRate: this.learningState.adaptationRate
    };
  }
  
  /**
   * Export rules for persistence
   */
  exportRules() {
    const exportable = [];
    
    for (const [ruleId, rule] of this.rules) {
      if (rule.learned) {
        exportable.push({
          id: ruleId,
          pattern: rule.pattern,
          priority: rule.priority,
          category: rule.category,
          effectiveness: rule.effectiveness,
          applied: rule.applied,
          successful: rule.successful
        });
      }
    }
    
    return {
      rules: exportable,
      learningState: {
        adaptationRate: this.learningState.adaptationRate,
        contextPatterns: Array.from(this.learningState.contextPatterns.entries())
      },
      metrics: this.metrics,
      exported: Date.now()
    };
  }
  
  /**
   * Import rules
   */
  importRules(data) {
    for (const ruleData of data.rules) {
      this.addRule(ruleData.id, {
        ...ruleData,
        condition: (context) => this.matchesPattern(
          this.extractFeatures(context),
          ruleData.pattern.context
        ),
        action: (context) => this.generateOptimalAction(context, ruleData.pattern),
        learned: true
      });
    }
    
    if (data.learningState) {
      this.learningState.adaptationRate = data.learningState.adaptationRate;
      this.learningState.contextPatterns = new Map(data.learningState.contextPatterns);
    }
    
    logger.info(`Imported ${data.rules.length} learned rules`);
  }
  
  /**
   * Stop learning cycle
   */
  stop() {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
  }
}

// Export singleton
module.exports = new DynamicOptimizationEngine();