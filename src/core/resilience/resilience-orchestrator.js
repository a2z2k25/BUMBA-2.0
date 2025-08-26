/**
 * BUMBA Resilience Orchestrator
 * Coordinates all resilience patterns and provides unified interface
 * Includes timeout management, monitoring, graceful degradation, and self-healing
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { BumbaError } = require('../error-handling/bumba-error-system');
const { 
  EnhancedCircuitBreaker, 
  RetryManager, 
  BulkheadManager, 
  HealthCheckManager 
} = require('./resilient-agent-system');

/**
 * Timeout Manager for Long-Running Operations
 */
class TimeoutManager {
  constructor() {
    this.activeOperations = new Map();
    this.timeoutConfig = {
      default: 30000,
      short: 5000,
      medium: 30000,
      long: 120000,
      extended: 300000
    };
    
    this.metrics = {
      totalOperations: 0,
      timedOutOperations: 0,
      completedOperations: 0,
      averageCompletionTime: 0
    };
  }

  async executeWithTimeout(operation, timeout = null, context = {}) {
    const operationId = this.generateOperationId();
    const timeoutMs = timeout || this.determineTimeout(operation, context);
    
    this.metrics.totalOperations++;
    
    const operationInfo = {
      id: operationId,
      startTime: Date.now(),
      timeout: timeoutMs,
      context,
      status: 'running'
    };
    
    this.activeOperations.set(operationId, operationInfo);
    
    try {
      const result = await Promise.race([
        this.wrapOperation(operation, operationId, context),
        this.createTimeoutPromise(timeoutMs, operationId)
      ]);
      
      this.recordCompletion(operationId, true);
      return result;
      
    } catch (error) {
      this.recordCompletion(operationId, false, error);
      throw error;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  async wrapOperation(operation, operationId, context) {
    const startTime = Date.now();
    
    try {
      const result = await operation(context);
      const completionTime = Date.now() - startTime;
      
      // Update metrics
      this.updateCompletionMetrics(completionTime);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  createTimeoutPromise(timeout, operationId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const operation = this.activeOperations.get(operationId);
        if (operation) {
          operation.status = 'timed_out';
        }
        
        reject(new BumbaError('OPERATION_TIMEOUT', 
          `Operation ${operationId} timed out after ${timeout}ms`,
          { operationId, timeout }
        ));
      }, timeout);
    });
  }

  determineTimeout(operation, context) {
    // Analyze operation characteristics to determine appropriate timeout
    const operationStr = typeof operation === 'string' ? operation : operation.toString();
    
    if (context.timeoutCategory) {
      return this.timeoutConfig[context.timeoutCategory] || this.timeoutConfig.default;
    }
    
    // Heuristic-based timeout determination
    if (operationStr.includes('database') || operationStr.includes('query')) {
      return this.timeoutConfig.medium;
    } else if (operationStr.includes('network') || operationStr.includes('http')) {
      return this.timeoutConfig.medium;
    } else if (operationStr.includes('analyze') || operationStr.includes('process')) {
      return this.timeoutConfig.long;
    } else if (operationStr.includes('install') || operationStr.includes('deploy')) {
      return this.timeoutConfig.extended;
    }
    
    return this.timeoutConfig.default;
  }

  recordCompletion(operationId, success, error = null) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {return;}
    
    const completionTime = Date.now() - operation.startTime;
    
    if (success) {
      this.metrics.completedOperations++;
      operation.status = 'completed';
    } else if (error?.type === 'OPERATION_TIMEOUT') {
      this.metrics.timedOutOperations++;
      operation.status = 'timed_out';
    } else {
      operation.status = 'failed';
    }
    
    operation.completionTime = completionTime;
    operation.error = error?.message;
  }

  updateCompletionMetrics(completionTime) {
    const completed = this.metrics.completedOperations;
    this.metrics.averageCompletionTime = (
      (this.metrics.averageCompletionTime * (completed - 1)) + completionTime
    ) / completed;
  }

  generateOperationId() {
    return `timeout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveOperations() {
    return Array.from(this.activeOperations.values());
  }

  getMetrics() {
    return {
      ...this.metrics,
      timeoutRate: this.metrics.totalOperations > 0 ?
        (this.metrics.timedOutOperations / this.metrics.totalOperations) * 100 : 0,
      completionRate: this.metrics.totalOperations > 0 ?
        (this.metrics.completedOperations / this.metrics.totalOperations) * 100 : 0,
      activeOperationsCount: this.activeOperations.size
    };
  }

  updateTimeoutConfig(config) {
    this.timeoutConfig = { ...this.timeoutConfig, ...config };
  }
}

/**
 * Graceful Degradation Manager
 */
class GracefulDegradationManager extends EventEmitter {
  constructor() {
    super();
    
    this.degradationLevels = {
      NORMAL: 0,
      REDUCED: 1,
      MINIMAL: 2,
      EMERGENCY: 3
    };
    
    this.currentLevel = this.degradationLevels.NORMAL;
    this.degradationStrategies = new Map();
    this.featureFlags = new Map();
    
    this.metrics = {
      degradationEvents: 0,
      recoveryEvents: 0,
      currentlyDegraded: [],
      totalDegradationTime: 0,
      lastDegradationTime: null
    };
  }

  registerDegradationStrategy(featureName, strategy) {
    this.degradationStrategies.set(featureName, {
      ...strategy,
      currentLevel: this.degradationLevels.NORMAL,
      degradedAt: null,
      recoveredAt: null
    });
    
    this.featureFlags.set(featureName, true);
    
    logger.info(`🟢 Degradation strategy registered for feature: ${featureName}`);
  }

  async degradeFeature(featureName, level, reason = 'unknown') {
    const strategy = this.degradationStrategies.get(featureName);
    if (!strategy) {
      logger.warn(`🟡 No degradation strategy found for feature: ${featureName}`);
      return false;
    }
    
    const previousLevel = strategy.currentLevel;
    strategy.currentLevel = level;
    strategy.degradedAt = Date.now();
    strategy.reason = reason;
    
    // Update feature flag
    this.featureFlags.set(featureName, level === this.degradationLevels.NORMAL);
    
    // Track metrics
    if (previousLevel === this.degradationLevels.NORMAL) {
      this.metrics.degradationEvents++;
      this.metrics.currentlyDegraded.push(featureName);
      this.metrics.lastDegradationTime = Date.now();
    }
    
    // Execute degradation action
    try {
      if (strategy.onDegrade) {
        await strategy.onDegrade(level, reason);
      }
      
      this.emit('feature-degraded', {
        feature: featureName,
        level,
        previousLevel,
        reason,
        timestamp: Date.now()
      });
      
      logger.warn(`🟢 Feature degraded: ${featureName} to level ${level} (${reason})`);
      return true;
      
    } catch (error) {
      logger.error(`🔴 Failed to degrade feature ${featureName}:`, error.message);
      return false;
    }
  }

  async recoverFeature(featureName, reason = 'manual') {
    const strategy = this.degradationStrategies.get(featureName);
    if (!strategy) {return false;}
    
    const previousLevel = strategy.currentLevel;
    
    if (previousLevel === this.degradationLevels.NORMAL) {
      return true; // Already at normal level
    }
    
    strategy.currentLevel = this.degradationLevels.NORMAL;
    strategy.recoveredAt = Date.now();
    strategy.reason = reason;
    
    // Update feature flag
    this.featureFlags.set(featureName, true);
    
    // Track metrics
    this.metrics.recoveryEvents++;
    this.metrics.currentlyDegraded = this.metrics.currentlyDegraded.filter(
      name => name !== featureName
    );
    
    if (strategy.degradedAt) {
      this.metrics.totalDegradationTime += Date.now() - strategy.degradedAt;
    }
    
    // Execute recovery action
    try {
      if (strategy.onRecover) {
        await strategy.onRecover(reason);
      }
      
      this.emit('feature-recovered', {
        feature: featureName,
        previousLevel,
        reason,
        timestamp: Date.now(),
        degradationDuration: strategy.degradedAt ? Date.now() - strategy.degradedAt : 0
      });
      
      logger.info(`🟢 Feature recovered: ${featureName} (${reason})`);
      return true;
      
    } catch (error) {
      logger.error(`🔴 Failed to recover feature ${featureName}:`, error.message);
      return false;
    }
  }

  async systemWideDegradation(level, reason = 'system_health') {
    logger.warn(`🔴 System-wide degradation to level ${level}: ${reason}`);
    
    const results = [];
    for (const [featureName, strategy] of this.degradationStrategies) {
      if (strategy.systemWide !== false) {
        const result = await this.degradeFeature(featureName, level, reason);
        results.push({ feature: featureName, success: result });
      }
    }
    
    this.currentLevel = level;
    
    this.emit('system-degraded', {
      level,
      reason,
      affectedFeatures: results.filter(r => r.success).map(r => r.feature),
      timestamp: Date.now()
    });
    
    return results;
  }

  async systemWideRecovery(reason = 'system_recovered') {
    logger.info(`🏁 System-wide recovery: ${reason}`);
    
    const results = [];
    for (const [featureName] of this.degradationStrategies) {
      const result = await this.recoverFeature(featureName, reason);
      results.push({ feature: featureName, success: result });
    }
    
    this.currentLevel = this.degradationLevels.NORMAL;
    
    this.emit('system-recovered', {
      reason,
      recoveredFeatures: results.filter(r => r.success).map(r => r.feature),
      timestamp: Date.now()
    });
    
    return results;
  }

  isFeatureAvailable(featureName) {
    return this.featureFlags.get(featureName) || false;
  }

  getFeatureLevel(featureName) {
    const strategy = this.degradationStrategies.get(featureName);
    return strategy ? strategy.currentLevel : this.degradationLevels.NORMAL;
  }

  getDegradationStatus() {
    const status = {};
    
    for (const [featureName, strategy] of this.degradationStrategies) {
      status[featureName] = {
        currentLevel: strategy.currentLevel,
        isAvailable: this.featureFlags.get(featureName),
        degradedAt: strategy.degradedAt,
        recoveredAt: strategy.recoveredAt,
        reason: strategy.reason
      };
    }
    
    return {
      systemLevel: this.currentLevel,
      features: status,
      metrics: this.metrics
    };
  }
}

/**
 * Self-Healing Manager
 */
class SelfHealingManager extends EventEmitter {
  constructor() {
    super();
    
    this.healingStrategies = new Map();
    this.activeHealing = new Map();
    this.healingHistory = [];
    
    this.config = {
      maxConcurrentHealing: 3,
      healingCooldown: 60000, // 1 minute
      maxHealingAttempts: 3,
      healingTimeout: 30000
    };
    
    this.metrics = {
      totalHealingAttempts: 0,
      successfulHealing: 0,
      failedHealing: 0,
      activeHealingProcesses: 0
    };
  }

  registerHealingStrategy(problemType, healingFunction, options = {}) {
    const strategy = {
      problemType,
      healingFunction,
      priority: options.priority || 5,
      cooldownPeriod: options.cooldownPeriod || this.config.healingCooldown,
      maxAttempts: options.maxAttempts || this.config.maxHealingAttempts,
      timeout: options.timeout || this.config.healingTimeout,
      lastAttempt: null,
      attemptCount: 0,
      ...options
    };
    
    this.healingStrategies.set(problemType, strategy);
    logger.info(`🟢 Self-healing strategy registered: ${problemType}`);
  }

  async attemptHealing(problemType, context = {}) {
    const strategy = this.healingStrategies.get(problemType);
    if (!strategy) {
      logger.warn(`🟡 No healing strategy found for problem: ${problemType}`);
      return { success: false, reason: 'no_strategy' };
    }
    
    // Check if we're in cooldown period
    if (this.isInCooldown(strategy)) {
      logger.info(`⏳ Healing for ${problemType} is in cooldown period`);
      return { success: false, reason: 'cooldown' };
    }
    
    // Check concurrent healing limit
    if (this.metrics.activeHealingProcesses >= this.config.maxConcurrentHealing) {
      logger.warn('🔴 Maximum concurrent healing processes reached');
      return { success: false, reason: 'max_concurrent' };
    }
    
    // Check attempt limit
    if (strategy.attemptCount >= strategy.maxAttempts) {
      logger.error(`🔴 Maximum healing attempts reached for ${problemType}`);
      return { success: false, reason: 'max_attempts' };
    }
    
    return this.executeHealing(strategy, context);
  }

  async executeHealing(strategy, context) {
    const healingId = this.generateHealingId();
    const startTime = Date.now();
    
    strategy.attemptCount++;
    strategy.lastAttempt = startTime;
    this.metrics.totalHealingAttempts++;
    this.metrics.activeHealingProcesses++;
    
    const healingProcess = {
      id: healingId,
      problemType: strategy.problemType,
      startTime,
      status: 'running'
    };
    
    this.activeHealing.set(healingId, healingProcess);
    
    logger.info(`🟢 Starting self-healing for ${strategy.problemType} (attempt ${strategy.attemptCount})`);
    
    this.emit('healing-started', {
      problemType: strategy.problemType,
      healingId,
      attempt: strategy.attemptCount
    });
    
    try {
      const result = await Promise.race([
        strategy.healingFunction(context),
        this.createHealingTimeout(strategy.timeout, healingId)
      ]);
      
      const duration = Date.now() - startTime;
      
      // Reset attempt count on success
      strategy.attemptCount = 0;
      
      this.recordHealingSuccess(healingId, strategy, result, duration);
      return { success: true, result, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordHealingFailure(healingId, strategy, error, duration);
      return { success: false, error: error.message, duration };
      
    } finally {
      this.metrics.activeHealingProcesses--;
      this.activeHealing.delete(healingId);
    }
  }

  createHealingTimeout(timeout, healingId) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new BumbaError('HEALING_TIMEOUT', 
          `Self-healing process ${healingId} timed out after ${timeout}ms`
        ));
      }, timeout);
    });
  }

  recordHealingSuccess(healingId, strategy, result, duration) {
    this.metrics.successfulHealing++;
    
    const record = {
      id: healingId,
      problemType: strategy.problemType,
      success: true,
      result,
      duration,
      timestamp: Date.now(),
      attempt: strategy.attemptCount
    };
    
    this.healingHistory.push(record);
    this.trimHealingHistory();
    
    this.emit('healing-success', record);
    
    logger.info(`🏁 Self-healing successful for ${strategy.problemType} in ${duration}ms`);
  }

  recordHealingFailure(healingId, strategy, error, duration) {
    this.metrics.failedHealing++;
    
    const record = {
      id: healingId,
      problemType: strategy.problemType,
      success: false,
      error: error.message,
      duration,
      timestamp: Date.now(),
      attempt: strategy.attemptCount
    };
    
    this.healingHistory.push(record);
    this.trimHealingHistory();
    
    this.emit('healing-failure', record);
    
    logger.error(`🔴 Self-healing failed for ${strategy.problemType}: ${error.message}`);
  }

  isInCooldown(strategy) {
    if (!strategy.lastAttempt) {return false;}
    return Date.now() - strategy.lastAttempt < strategy.cooldownPeriod;
  }

  generateHealingId() {
    return `heal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trimHealingHistory() {
    // Keep only last 100 healing records
    if (this.healingHistory.length > 100) {
      this.healingHistory = this.healingHistory.slice(-50);
    }
  }

  getHealingStatus() {
    const strategies = {};
    
    for (const [problemType, strategy] of this.healingStrategies) {
      strategies[problemType] = {
        attemptCount: strategy.attemptCount,
        maxAttempts: strategy.maxAttempts,
        lastAttempt: strategy.lastAttempt,
        inCooldown: this.isInCooldown(strategy),
        cooldownRemaining: this.isInCooldown(strategy) ? 
          strategy.cooldownPeriod - (Date.now() - strategy.lastAttempt) : 0
      };
    }
    
    return {
      strategies,
      activeProcesses: Array.from(this.activeHealing.values()),
      metrics: this.metrics,
      recentHistory: this.healingHistory.slice(-10)
    };
  }

  resetStrategy(problemType) {
    const strategy = this.healingStrategies.get(problemType);
    if (strategy) {
      strategy.attemptCount = 0;
      strategy.lastAttempt = null;
      logger.info(`🟢 Reset healing strategy for ${problemType}`);
    }
  }
}

/**
 * Main Resilience Orchestrator
 */
class ResilienceOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.circuitBreakers = new Map();
    this.retryManager = new RetryManager(options.retry);
    this.bulkheadManager = new BulkheadManager();
    this.healthCheckManager = new HealthCheckManager();
    this.timeoutManager = new TimeoutManager();
    this.degradationManager = new GracefulDegradationManager();
    this.healingManager = new SelfHealingManager();
    
    this.config = {
      defaultCircuitBreakerOptions: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 60000,
        resetTimeout: 30000
      },
      consciousnessIntegration: true,
      metricsInterval: 30000,
      ...options
    };
    
    this.globalMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      fallbackOperations: 0,
      startTime: Date.now()
    };
    
    this.setupEventHandlers();
    this.startMetricsCollection();
    
    logger.info('🟢 BUMBA Resilience Orchestrator initialized');
  }

  setupEventHandlers() {
    // Forward events from managers
    this.healthCheckManager.on('health-degraded', (data) => {
      this.handleHealthDegradation(data);
    });
    
    this.healthCheckManager.on('health-recovered', (data) => {
      this.handleHealthRecovery(data);
    });
    
    this.degradationManager.on('feature-degraded', (data) => {
      this.emit('feature-degraded', data);
    });
    
    this.healingManager.on('healing-success', (data) => {
      this.emit('healing-success', data);
    });
  }

  async executeResilientOperation(operationName, operation, options = {}) {
    const startTime = Date.now();
    this.globalMetrics.totalOperations++;
    
    const config = {
      circuitBreaker: true,
      retry: true,
      bulkhead: null,
      timeout: null,
      fallback: null,
      consciousnessValidation: this.config.consciousnessIntegration,
      ...options
    };
    
    try {
      let result;
      
      // Execute with circuit breaker if enabled
      if (config.circuitBreaker) {
        const breaker = this.getOrCreateCircuitBreaker(operationName, config.circuitBreakerOptions);
        result = await breaker.execute(async (context) => {
            return this.executeWithResiliencePatterns(operation, config, context);
          },
          config.fallback,
          config.context || {}
        );
      } else {
        result = await this.executeWithResiliencePatterns(operation, config, {});
      }
      
      this.globalMetrics.successfulOperations++;
      const duration = Date.now() - startTime;
      
      this.emit('operation-success', {
        operationName,
        duration,
        patterns: this.getUsedPatterns(config)
      });
      
      return result;
      
    } catch (error) {
      this.globalMetrics.failedOperations++;
      const duration = Date.now() - startTime;
      
      this.emit('operation-failure', {
        operationName,
        error: error.message,
        duration,
        patterns: this.getUsedPatterns(config)
      });
      
      // Attempt self-healing
      if (config.autoHealing !== false) {
        this.attemptAutoHealing(error, operationName, config);
      }
      
      throw error;
    }
  }

  async executeWithResiliencePatterns(operation, config, context) {
    let wrappedOperation = operation;
    
    // Apply timeout management
    if (config.timeout !== false) {
      wrappedOperation = async (ctx) => {
        return this.timeoutManager.executeWithTimeout(operation, config.timeout, ctx);
      };
    }
    
    // Apply bulkhead isolation
    if (config.bulkhead) {
      const originalOperation = wrappedOperation;
      wrappedOperation = async (ctx) => {
        return this.bulkheadManager.executeInBulkhead(
          config.bulkhead.name || 'default',
          originalOperation,
          ctx
        );
      };
    }
    
    // Apply retry logic
    if (config.retry) {
      const originalOperation = wrappedOperation;
      wrappedOperation = async (ctx) => {
        return this.retryManager.executeWithRetry(originalOperation, ctx);
      };
    }
    
    // Execute consciousness validation if enabled
    if (config.consciousnessValidation) {
      await this.validateConsciousness(operation, context);
    }
    
    return wrappedOperation(context);
  }

  getOrCreateCircuitBreaker(name, options = {}) {
    if (!this.circuitBreakers.has(name)) {
      const breakerOptions = {
        ...this.config.defaultCircuitBreakerOptions,
        ...options
      };
      
      const breaker = new EnhancedCircuitBreaker(name, breakerOptions);
      
      // Forward events
      breaker.on('state-change', (data) => {
        this.emit('circuit-breaker-state-change', { name, ...data });
      });
      
      this.circuitBreakers.set(name, breaker);
    }
    
    return this.circuitBreakers.get(name);
  }

  async validateConsciousness(operation, context) {
    // Simple consciousness validation
    const operationStr = typeof operation === 'string' ? operation : operation.toString();
    
    const suspiciousPatterns = [
      'delete', 'destroy', 'remove', 'drop', 'truncate',
      'exec', 'eval', 'system', 'shell'
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      operationStr.toLowerCase().includes(pattern)
    );
    
    if (hasSuspiciousPattern && !context.consciousnessOverride) {
      throw new BumbaError('CONSCIOUSNESS_VALIDATION_FAILED',
        'Operation failed consciousness validation',
        { operation: operationStr.substring(0, 100) }
      );
    }
  }

  async handleHealthDegradation(healthData) {
    logger.warn(`🟢 Health degradation detected: ${healthData.name}`);
    
    // Auto-degrade related features
    await this.degradationManager.degradeFeature(
      healthData.name, 
      this.degradationManager.degradationLevels.REDUCED,
      'health_check_failure'
    );
    
    // Attempt healing
    await this.healingManager.attemptHealing('health_check_failure', healthData);
  }

  async handleHealthRecovery(healthData) {
    logger.info(`🏁 Health recovery detected: ${healthData.name}`);
    
    // Auto-recover related features
    await this.degradationManager.recoverFeature(
      healthData.name,
      'health_check_recovery'
    );
  }

  async attemptAutoHealing(error, operationName, config) {
    const problemType = this.determineProblemType(error);
    
    if (problemType) {
      setTimeout(async () => {
        await this.healingManager.attemptHealing(problemType, {
          error,
          operationName,
          config
        });
      }, 1000); // Small delay to avoid immediate retry
    }
  }

  determineProblemType(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout')) {return 'timeout_failure';}
    if (errorMessage.includes('connection')) {return 'connection_failure';}
    if (errorMessage.includes('memory')) {return 'memory_exhaustion';}
    if (errorMessage.includes('rate limit')) {return 'rate_limit_exceeded';}
    if (errorMessage.includes('circuit breaker')) {return 'circuit_breaker_open';}
    
    return 'unknown_failure';
  }

  getUsedPatterns(config) {
    const patterns = [];
    
    if (config.circuitBreaker) {patterns.push('circuit_breaker');}
    if (config.retry) {patterns.push('retry');}
    if (config.bulkhead) {patterns.push('bulkhead');}
    if (config.timeout !== false) {patterns.push('timeout');}
    if (config.fallback) {patterns.push('fallback');}
    
    return patterns;
  }

  startMetricsCollection() {
    setInterval(() => {
      this.collectAndEmitMetrics();
    }, this.config.metricsInterval);
  }

  collectAndEmitMetrics() {
    const metrics = this.getComprehensiveMetrics();
    this.emit('metrics-update', metrics);
  }

  getComprehensiveMetrics() {
    const now = Date.now();
    const uptime = now - this.globalMetrics.startTime;
    
    return {
      timestamp: now,
      uptime,
      global: {
        ...this.globalMetrics,
        operationsPerSecond: this.globalMetrics.totalOperations / (uptime / 1000),
        successRate: this.globalMetrics.totalOperations > 0 ?
          (this.globalMetrics.successfulOperations / this.globalMetrics.totalOperations) * 100 : 0
      },
      circuitBreakers: this.getCircuitBreakerMetrics(),
      bulkheads: this.bulkheadManager.getAllStats(),
      healthChecks: this.healthCheckManager.getAllHealthCheckDetails(),
      timeouts: this.timeoutManager.getMetrics(),
      degradation: this.degradationManager.getDegradationStatus(),
      healing: this.healingManager.getHealingStatus()
    };
  }

  getCircuitBreakerMetrics() {
    const metrics = {};
    
    for (const [name, breaker] of this.circuitBreakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  // Public API methods
  registerHealthCheck(name, checkFunction, options) {
    return this.healthCheckManager.registerHealthCheck(name, checkFunction, options);
  }

  createBulkhead(name, options) {
    return this.bulkheadManager.createBulkhead(name, options);
  }

  registerDegradationStrategy(featureName, strategy) {
    return this.degradationManager.registerDegradationStrategy(featureName, strategy);
  }

  registerHealingStrategy(problemType, healingFunction, options) {
    return this.healingManager.registerHealingStrategy(problemType, healingFunction, options);
  }

  getSystemHealth() {
    return {
      overall: this.healthCheckManager.getOverallHealth(),
      degradation: this.degradationManager.getDegradationStatus(),
      healing: this.healingManager.getHealingStatus(),
      circuitBreakers: this.getCircuitBreakerMetrics()
    };
  }

  shutdown() {
    logger.info('🟢 Shutting down Resilience Orchestrator...');
    
    this.healthCheckManager.stopAllHealthChecks();
    
    for (const breaker of this.circuitBreakers.values()) {
      breaker.removeAllListeners();
    }
    
    this.removeAllListeners();
  }
}

module.exports = {
  ResilienceOrchestrator,
  TimeoutManager,
  GracefulDegradationManager,
  SelfHealingManager
};