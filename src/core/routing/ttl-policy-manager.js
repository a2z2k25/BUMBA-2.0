/**
 * TTL Policy Manager
 * Manages routing policies for different TTL tiers with dynamic adjustments
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Policy Definitions
 */
const DEFAULT_POLICIES = {
  ULTRA_FAST: {
    name: 'Ultra-Fast Policy',
    tier: 'ULTRA_FAST',
    maxRetries: 1,
    timeoutMultiplier: 0.8,
    fallbackEnabled: false,
    preemptionAllowed: true,
    cachingStrategy: 'aggressive',
    poolingStrategy: 'hot-cache',
    selectionCriteria: {
      preferWarm: true,
      requireActive: true,
      maxLoadFactor: 0.5
    },
    performanceTargets: {
      maxLatency: 5000,
      minThroughput: 100,
      targetSuccessRate: 0.95
    }
  },
  FAST: {
    name: 'Fast Policy',
    tier: 'FAST',
    maxRetries: 2,
    timeoutMultiplier: 0.85,
    fallbackEnabled: true,
    preemptionAllowed: true,
    cachingStrategy: 'moderate',
    poolingStrategy: 'warm-pool',
    selectionCriteria: {
      preferWarm: true,
      requireActive: false,
      maxLoadFactor: 0.7
    },
    performanceTargets: {
      maxLatency: 30000,
      minThroughput: 50,
      targetSuccessRate: 0.90
    }
  },
  STANDARD: {
    name: 'Standard Policy',
    tier: 'STANDARD',
    maxRetries: 3,
    timeoutMultiplier: 0.9,
    fallbackEnabled: true,
    preemptionAllowed: false,
    cachingStrategy: 'balanced',
    poolingStrategy: 'adaptive',
    selectionCriteria: {
      preferWarm: false,
      requireActive: false,
      maxLoadFactor: 0.85
    },
    performanceTargets: {
      maxLatency: 180000,
      minThroughput: 20,
      targetSuccessRate: 0.85
    }
  },
  EXTENDED: {
    name: 'Extended Policy',
    tier: 'EXTENDED',
    maxRetries: 5,
    timeoutMultiplier: 0.95,
    fallbackEnabled: true,
    preemptionAllowed: false,
    cachingStrategy: 'lazy',
    poolingStrategy: 'cold-start',
    selectionCriteria: {
      preferWarm: false,
      requireActive: false,
      maxLoadFactor: 1.0
    },
    performanceTargets: {
      maxLatency: Infinity,
      minThroughput: 5,
      targetSuccessRate: 0.80
    },
    batchingEnabled: true,
    maxBatchSize: 10,
    batchTimeout: 5000
  }
};

/**
 * Policy Override Structure
 */
class PolicyOverride {
  constructor(policyId, conditions, modifications, duration = null) {
    this.id = `override-${Date.now()}`;
    this.policyId = policyId;
    this.conditions = conditions;
    this.modifications = modifications;
    this.duration = duration;
    this.createdAt = Date.now();
    this.active = true;
    this.appliedCount = 0;
  }
  
  isExpired() {
    if (!this.duration) return false;
    return Date.now() - this.createdAt > this.duration;
  }
  
  matches(context) {
    for (const [key, value] of Object.entries(this.conditions)) {
      if (context[key] !== value) return false;
    }
    return true;
  }
  
  apply(policy) {
    const modified = { ...policy };
    
    for (const [path, value] of Object.entries(this.modifications)) {
      const keys = path.split('.');
      let target = modified;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      
      target[keys[keys.length - 1]] = value;
    }
    
    this.appliedCount++;
    return modified;
  }
}

/**
 * Main Policy Manager
 */
class TTLPolicyManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Policy settings
      enableDynamicAdjustment: config.enableDynamicAdjustment !== false,
      enableOverrides: config.enableOverrides !== false,
      enableLearning: config.enableLearning !== false,
      
      // Adjustment thresholds
      adjustmentInterval: config.adjustmentInterval || 60000,      // 1 minute
      performanceWindow: config.performanceWindow || 300000,       // 5 minutes
      minSampleSize: config.minSampleSize || 10,
      
      // Adjustment factors
      latencyWeight: config.latencyWeight || 0.4,
      throughputWeight: config.throughputWeight || 0.3,
      successRateWeight: config.successRateWeight || 0.3,
      
      // Limits
      maxOverrides: config.maxOverrides || 100,
      maxPolicyHistory: config.maxPolicyHistory || 1000
    };
    
    // Policy state
    this.policies = new Map();
    this.overrides = new Map();
    this.policyHistory = [];
    this.performanceMetrics = new Map();
    
    // Statistics
    this.statistics = {
      policiesApplied: 0,
      overridesApplied: 0,
      adjustmentsMade: 0,
      validationsFailed: 0,
      averagePerformanceScore: 0
    };
    
    // Initialize policies
    this.initializePolicies();
    
    // Start adjustment engine if enabled
    if (this.config.enableDynamicAdjustment) {
      this.startAdjustmentEngine();
    }
    
    logger.info('📋 TTL Policy Manager initialized');
  }
  
  /**
   * Initialize default policies
   */
  initializePolicies() {
    for (const [tierName, policy] of Object.entries(DEFAULT_POLICIES)) {
      this.policies.set(tierName, { ...policy });
      this.performanceMetrics.set(tierName, {
        samples: [],
        averageLatency: 0,
        averageThroughput: 0,
        successRate: 0,
        lastAdjustment: Date.now()
      });
    }
    
    logger.debug(`Initialized ${this.policies.size} default policies`);
  }
  
  /**
   * Get policy for a tier
   */
  getPolicy(tier, context = {}) {
    let policy = this.policies.get(tier);
    
    if (!policy) {
      logger.warn(`No policy found for tier ${tier}, using STANDARD`);
      policy = this.policies.get('STANDARD');
    }
    
    // Apply overrides if enabled
    if (this.config.enableOverrides) {
      policy = this.applyOverrides(policy, context);
    }
    
    // Validate policy
    if (!this.validatePolicy(policy)) {
      logger.error(`Invalid policy for tier ${tier}`);
      return this.policies.get('STANDARD');
    }
    
    // Record usage
    this.recordPolicyUsage(tier, policy);
    
    return policy;
  }
  
  /**
   * Apply overrides to policy
   */
  applyOverrides(policy, context) {
    let modifiedPolicy = { ...policy };
    const appliedOverrides = [];
    
    // Check and clean expired overrides
    this.cleanExpiredOverrides();
    
    for (const override of this.overrides.values()) {
      if (override.policyId === policy.tier && override.matches(context)) {
        modifiedPolicy = override.apply(modifiedPolicy);
        appliedOverrides.push(override.id);
      }
    }
    
    if (appliedOverrides.length > 0) {
      logger.debug(`Applied ${appliedOverrides.length} overrides to ${policy.tier}`);
      this.statistics.overridesApplied += appliedOverrides.length;
      
      this.emit('overrides:applied', {
        tier: policy.tier,
        overrides: appliedOverrides,
        context
      });
    }
    
    return modifiedPolicy;
  }
  
  /**
   * Validate policy structure
   */
  validatePolicy(policy) {
    const requiredFields = ['tier', 'maxRetries', 'timeoutMultiplier', 'selectionCriteria'];
    
    for (const field of requiredFields) {
      if (!(field in policy)) {
        logger.error(`Policy missing required field: ${field}`);
        this.statistics.validationsFailed++;
        return false;
      }
    }
    
    // Validate ranges
    if (policy.maxRetries < 0 || policy.maxRetries > 10) {
      logger.error(`Invalid maxRetries: ${policy.maxRetries}`);
      return false;
    }
    
    if (policy.timeoutMultiplier < 0.1 || policy.timeoutMultiplier > 2.0) {
      logger.error(`Invalid timeoutMultiplier: ${policy.timeoutMultiplier}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Create policy override
   */
  createOverride(policyId, conditions, modifications, duration = null) {
    if (this.overrides.size >= this.config.maxOverrides) {
      logger.warn('Maximum overrides reached, removing oldest');
      const firstKey = this.overrides.keys().next().value;
      this.overrides.delete(firstKey);
    }
    
    const override = new PolicyOverride(policyId, conditions, modifications, duration);
    this.overrides.set(override.id, override);
    
    logger.info(`Created policy override ${override.id} for ${policyId}`);
    
    this.emit('override:created', {
      id: override.id,
      policyId,
      conditions,
      modifications,
      duration
    });
    
    return override.id;
  }
  
  /**
   * Remove policy override
   */
  removeOverride(overrideId) {
    const override = this.overrides.get(overrideId);
    
    if (!override) {
      logger.warn(`Override ${overrideId} not found`);
      return false;
    }
    
    this.overrides.delete(overrideId);
    
    logger.info(`Removed override ${overrideId}`);
    
    this.emit('override:removed', {
      id: overrideId,
      appliedCount: override.appliedCount
    });
    
    return true;
  }
  
  /**
   * Clean expired overrides
   */
  cleanExpiredOverrides() {
    const expired = [];
    
    for (const [id, override] of this.overrides) {
      if (override.isExpired()) {
        expired.push(id);
      }
    }
    
    for (const id of expired) {
      this.removeOverride(id);
    }
    
    if (expired.length > 0) {
      logger.debug(`Cleaned ${expired.length} expired overrides`);
    }
  }
  
  /**
   * Record policy usage
   */
  recordPolicyUsage(tier, policy) {
    this.statistics.policiesApplied++;
    
    this.policyHistory.push({
      tier,
      timestamp: Date.now(),
      policy: policy.name
    });
    
    // Trim history
    if (this.policyHistory.length > this.config.maxPolicyHistory) {
      this.policyHistory.shift();
    }
  }
  
  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(tier, metrics) {
    const perfMetrics = this.performanceMetrics.get(tier);
    
    if (!perfMetrics) {
      logger.warn(`No performance metrics for tier ${tier}`);
      return;
    }
    
    // Add sample
    perfMetrics.samples.push({
      timestamp: Date.now(),
      latency: metrics.latency,
      throughput: metrics.throughput,
      success: metrics.success
    });
    
    // Keep only recent samples
    const cutoff = Date.now() - this.config.performanceWindow;
    perfMetrics.samples = perfMetrics.samples.filter(s => s.timestamp > cutoff);
    
    // Calculate averages
    if (perfMetrics.samples.length > 0) {
      const totalLatency = perfMetrics.samples.reduce((sum, s) => sum + s.latency, 0);
      const totalThroughput = perfMetrics.samples.reduce((sum, s) => sum + s.throughput, 0);
      const successCount = perfMetrics.samples.filter(s => s.success).length;
      
      perfMetrics.averageLatency = totalLatency / perfMetrics.samples.length;
      perfMetrics.averageThroughput = totalThroughput / perfMetrics.samples.length;
      perfMetrics.successRate = successCount / perfMetrics.samples.length;
    }
    
    // Trigger adjustment if needed
    if (this.config.enableDynamicAdjustment) {
      this.checkAdjustmentNeeded(tier);
    }
  }
  
  /**
   * Check if policy adjustment is needed
   */
  checkAdjustmentNeeded(tier) {
    const perfMetrics = this.performanceMetrics.get(tier);
    const policy = this.policies.get(tier);
    
    if (!perfMetrics || !policy) return;
    
    // Need minimum samples
    if (perfMetrics.samples.length < this.config.minSampleSize) return;
    
    // Check time since last adjustment
    if (Date.now() - perfMetrics.lastAdjustment < this.config.adjustmentInterval) return;
    
    // Calculate performance score
    const score = this.calculatePerformanceScore(tier);
    
    // Adjust if score is below threshold
    if (score < 0.7) {
      this.adjustPolicy(tier, score);
    } else if (score > 0.95) {
      // Can potentially relax policy if performing very well
      this.relaxPolicy(tier, score);
    }
  }
  
  /**
   * Calculate performance score
   */
  calculatePerformanceScore(tier) {
    const perfMetrics = this.performanceMetrics.get(tier);
    const policy = this.policies.get(tier);
    
    if (!perfMetrics || !policy) return 0;
    
    const targets = policy.performanceTargets;
    
    // Calculate individual scores
    const latencyScore = Math.min(1, targets.maxLatency / Math.max(1, perfMetrics.averageLatency));
    const throughputScore = Math.min(1, perfMetrics.averageThroughput / Math.max(1, targets.minThroughput));
    const successScore = perfMetrics.successRate / targets.targetSuccessRate;
    
    // Weighted average
    const score = 
      latencyScore * this.config.latencyWeight +
      throughputScore * this.config.throughputWeight +
      successScore * this.config.successRateWeight;
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Adjust policy for better performance
   */
  adjustPolicy(tier, currentScore) {
    const policy = this.policies.get(tier);
    if (!policy) return;
    
    logger.info(`Adjusting policy for ${tier} (score: ${currentScore.toFixed(2)})`);
    
    // Make adjustments
    const adjustments = {};
    
    if (currentScore < 0.5) {
      // Major adjustments needed
      adjustments.maxRetries = Math.min(10, policy.maxRetries + 2);
      adjustments.timeoutMultiplier = Math.min(1.5, policy.timeoutMultiplier * 1.2);
      
      if (policy.selectionCriteria) {
        adjustments['selectionCriteria.maxLoadFactor'] = 
          Math.min(1.0, policy.selectionCriteria.maxLoadFactor + 0.1);
      }
    } else {
      // Minor adjustments
      adjustments.maxRetries = Math.min(10, policy.maxRetries + 1);
      adjustments.timeoutMultiplier = Math.min(1.2, policy.timeoutMultiplier * 1.1);
    }
    
    // Create temporary override
    this.createOverride(
      tier,
      {}, // Apply to all contexts
      adjustments,
      this.config.adjustmentInterval * 2 // Double the interval for testing
    );
    
    // Update metrics
    const perfMetrics = this.performanceMetrics.get(tier);
    perfMetrics.lastAdjustment = Date.now();
    
    this.statistics.adjustmentsMade++;
    
    this.emit('policy:adjusted', {
      tier,
      score: currentScore,
      adjustments
    });
  }
  
  /**
   * Relax policy when performing well
   */
  relaxPolicy(tier, currentScore) {
    const policy = this.policies.get(tier);
    if (!policy) return;
    
    logger.info(`Relaxing policy for ${tier} (score: ${currentScore.toFixed(2)})`);
    
    // Make conservative relaxations
    const adjustments = {};
    
    if (policy.maxRetries > 1) {
      adjustments.maxRetries = policy.maxRetries - 1;
    }
    
    if (policy.timeoutMultiplier > 0.7) {
      adjustments.timeoutMultiplier = policy.timeoutMultiplier * 0.95;
    }
    
    if (Object.keys(adjustments).length > 0) {
      this.createOverride(
        tier,
        {},
        adjustments,
        this.config.adjustmentInterval * 2
      );
      
      this.emit('policy:relaxed', {
        tier,
        score: currentScore,
        adjustments
      });
    }
  }
  
  /**
   * Get policy recommendations
   */
  getRecommendations(context) {
    const recommendations = [];
    
    // Analyze recent performance
    for (const [tier, metrics] of this.performanceMetrics) {
      const score = this.calculatePerformanceScore(tier);
      
      if (score < 0.5) {
        recommendations.push({
          tier,
          severity: 'high',
          message: `${tier} performing poorly (${(score * 100).toFixed(1)}%)`,
          action: 'Consider increasing resources or adjusting thresholds'
        });
      } else if (score < 0.7) {
        recommendations.push({
          tier,
          severity: 'medium',
          message: `${tier} below target (${(score * 100).toFixed(1)}%)`,
          action: 'Monitor closely and consider minor adjustments'
        });
      }
    }
    
    // Check override usage
    if (this.overrides.size > this.config.maxOverrides * 0.8) {
      recommendations.push({
        severity: 'low',
        message: `High number of overrides (${this.overrides.size})`,
        action: 'Review and consolidate overrides'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Start dynamic adjustment engine
   */
  startAdjustmentEngine() {
    this.adjustmentInterval = setInterval(() => {
      // Clean expired overrides
      this.cleanExpiredOverrides();
      
      // Check all tiers for adjustment
      for (const tier of this.policies.keys()) {
        this.checkAdjustmentNeeded(tier);
      }
      
      // Calculate overall performance
      this.calculateOverallPerformance();
      
    }, this.config.adjustmentInterval);
    
    logger.debug('Dynamic adjustment engine started');
  }
  
  /**
   * Stop adjustment engine
   */
  stopAdjustmentEngine() {
    if (this.adjustmentInterval) {
      clearInterval(this.adjustmentInterval);
      logger.debug('Dynamic adjustment engine stopped');
    }
  }
  
  /**
   * Calculate overall performance
   */
  calculateOverallPerformance() {
    let totalScore = 0;
    let count = 0;
    
    for (const tier of this.policies.keys()) {
      const score = this.calculatePerformanceScore(tier);
      if (score > 0) {
        totalScore += score;
        count++;
      }
    }
    
    if (count > 0) {
      this.statistics.averagePerformanceScore = totalScore / count;
      
      this.emit('performance:calculated', {
        average: this.statistics.averagePerformanceScore,
        byTier: Object.fromEntries(
          Array.from(this.policies.keys()).map(tier => [
            tier,
            this.calculatePerformanceScore(tier)
          ])
        )
      });
    }
  }
  
  /**
   * Get manager status
   */
  getStatus() {
    return {
      policies: this.policies.size,
      overrides: this.overrides.size,
      statistics: this.statistics,
      performance: {
        average: this.statistics.averagePerformanceScore,
        byTier: Object.fromEntries(
          Array.from(this.policies.keys()).map(tier => [
            tier,
            {
              score: this.calculatePerformanceScore(tier),
              metrics: this.performanceMetrics.get(tier)
            }
          ])
        )
      },
      recommendations: this.getRecommendations(),
      config: {
        dynamicAdjustment: this.config.enableDynamicAdjustment,
        overrides: this.config.enableOverrides,
        learning: this.config.enableLearning
      }
    };
  }
  
  /**
   * Reset policies to defaults
   */
  resetPolicies() {
    logger.info('Resetting all policies to defaults');
    
    this.policies.clear();
    this.overrides.clear();
    this.performanceMetrics.clear();
    
    this.initializePolicies();
    
    this.emit('policies:reset');
  }
  
  /**
   * Export policies for backup
   */
  exportPolicies() {
    return {
      policies: Object.fromEntries(this.policies),
      overrides: Array.from(this.overrides.values()).map(o => ({
        id: o.id,
        policyId: o.policyId,
        conditions: o.conditions,
        modifications: o.modifications,
        duration: o.duration,
        createdAt: o.createdAt,
        appliedCount: o.appliedCount
      })),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      exportedAt: Date.now()
    };
  }
  
  /**
   * Import policies from backup
   */
  importPolicies(data) {
    try {
      // Import policies
      if (data.policies) {
        this.policies = new Map(Object.entries(data.policies));
      }
      
      // Import overrides
      if (data.overrides) {
        for (const override of data.overrides) {
          const o = new PolicyOverride(
            override.policyId,
            override.conditions,
            override.modifications,
            override.duration
          );
          o.id = override.id;
          o.createdAt = override.createdAt;
          o.appliedCount = override.appliedCount;
          this.overrides.set(o.id, o);
        }
      }
      
      // Import metrics
      if (data.performanceMetrics) {
        this.performanceMetrics = new Map(Object.entries(data.performanceMetrics));
      }
      
      logger.info('Policies imported successfully');
      
      this.emit('policies:imported', {
        policies: this.policies.size,
        overrides: this.overrides.size
      });
      
      return true;
      
    } catch (error) {
      logger.error('Failed to import policies:', error);
      return false;
    }
  }
  
  /**
   * Shutdown manager
   */
  shutdown() {
    logger.info('Shutting down TTL Policy Manager...');
    
    this.stopAdjustmentEngine();
    this.removeAllListeners();
    
    logger.info('TTL Policy Manager shutdown complete');
  }
}

module.exports = {
  TTLPolicyManager,
  PolicyOverride,
  DEFAULT_POLICIES
};