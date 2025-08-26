/**
 * BUMBA Comprehensive Resilience System
 * Advanced circuit breakers, fallback strategies, health checks, and self-healing
 * Protects the framework from cascading failures while maintaining consciousness principles
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { BumbaError } = require('../error-handling/bumba-error-system');

/**
 * Enhanced Circuit Breaker with multiple states and advanced failure handling
 */
class EnhancedCircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    
    this.name = name;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    
    // Configuration
    this.config = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 3,
      timeout: options.timeout || 60000,
      resetTimeout: options.resetTimeout || 30000,
      halfOpenMaxRequests: options.halfOpenMaxRequests || 3,
      monitoringWindow: options.monitoringWindow || 60000,
      ...options
    };
    
    // State tracking
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
    
    // Advanced metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      timeouts: 0,
      averageResponseTime: 0,
      lastWindowFailures: [],
      stateTransitions: [],
      uptime: 0,
      downtime: 0
    };
    
    this.responseTimeHistory = [];
    this.stateStartTime = Date.now();
    
    // Consciousness integration
    this.consciousnessMetrics = {
      alignmentScore: 1.0,
      ethicalCompliance: 1.0,
      sustainabilityIndex: 1.0,
      communityBenefit: 1.0
    };
  }

  async execute(operation, fallback = null, context = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    // Update consciousness metrics based on operation
    this.updateConsciousnessMetrics(operation, context);
    
    // Check circuit state
    const stateCheck = this.checkState();
    if (!stateCheck.canExecute) {
      this.metrics.rejectedRequests++;
      this.emit('request-rejected', {
        reason: stateCheck.reason,
        state: this.state,
        nextAttempt: this.nextAttemptTime
      });
      
      if (fallback) {
        return this.executeFallback(fallback, context, 'circuit-open');
      }
      
      throw new BumbaError('CIRCUIT_BREAKER_OPEN', 
        `Circuit breaker ${this.name} is ${this.state}`, 
        { nextAttempt: this.nextAttemptTime }
      );
    }
    
    // Track half-open attempts
    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
    }
    
    try {
      const result = await this.executeWithTimeout(operation, context);
      const responseTime = Date.now() - startTime;
      
      this.recordSuccess(responseTime);
      this.emit('operation-success', { 
        responseTime, 
        state: this.state,
        consciousnessScore: this.getConsciousnessScore()
      });
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailure(error, responseTime);
      
      this.emit('operation-failure', { 
        error, 
        responseTime, 
        state: this.state,
        failures: this.failures
      });
      
      // Try fallback if available
      if (fallback && this.shouldUseFallback(error)) {
        return this.executeFallback(fallback, context, 'operation-failed');
      }
      
      throw error;
    }
  }

  async executeWithTimeout(operation, context) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        this.metrics.timeouts++;
        reject(new BumbaError('OPERATION_TIMEOUT', 
          `Operation timed out after ${this.config.timeout}ms`,
          { circuitBreaker: this.name, timeout: this.config.timeout }
        ));
      }, this.config.timeout);

      try {
        const result = await operation(context);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  async executeFallback(fallback, context, reason) {
    try {
      logger.info(`🟢 Circuit breaker ${this.name}: Using fallback due to ${reason}`);
      const result = await fallback(context);
      this.emit('fallback-success', { reason, result });
      return result;
    } catch (fallbackError) {
      this.emit('fallback-failure', { reason, error: fallbackError });
      throw new BumbaError('FALLBACK_FAILED', 
        `Fallback failed for circuit breaker ${this.name}`,
        { originalReason: reason, fallbackError: fallbackError.message }
      );
    }
  }

  checkState() {
    const now = Date.now();
    
    switch (this.state) {
      case 'CLOSED':
        return { canExecute: true, reason: 'circuit-closed' };
        
      case 'OPEN':
        if (now >= this.nextAttemptTime) {
          this.transitionTo('HALF_OPEN');
          this.halfOpenAttempts = 0;
          return { canExecute: true, reason: 'retry-attempt' };
        }
        return { canExecute: false, reason: 'circuit-open' };
        
      case 'HALF_OPEN':
        if (this.halfOpenAttempts >= this.config.halfOpenMaxRequests) {
          return { canExecute: false, reason: 'half-open-limit-reached' };
        }
        return { canExecute: true, reason: 'half-open-probe' };
        
      default:
        return { canExecute: false, reason: 'unknown-state' };
    }
  }

  recordSuccess(responseTime) {
    this.metrics.successfulRequests++;
    this.successes++;
    this.failures = 0; // Reset failure count on success
    this.lastSuccessTime = Date.now();
    
    this.updateResponseTimeMetrics(responseTime);
    
    // State transitions based on success
    if (this.state === 'HALF_OPEN') {
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
        this.successes = 0;
        this.halfOpenAttempts = 0;
      }
    }
  }

  recordFailure(error, responseTime) {
    this.metrics.failedRequests++;
    this.failures++;
    this.successes = 0; // Reset success count on failure
    this.lastFailureTime = Date.now();
    
    this.updateResponseTimeMetrics(responseTime);
    this.addFailureToWindow(error);
    
    // State transitions based on failure
    if (this.failures >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in half-open state triggers open
      this.transitionTo('OPEN');
    }
  }

  transitionTo(newState) {
    if (newState === this.state) {return;}
    
    const oldState = this.state;
    const now = Date.now();
    
    // Update uptime/downtime metrics
    const stateDuration = now - this.stateStartTime;
    if (oldState === 'CLOSED' || oldState === 'HALF_OPEN') {
      this.metrics.uptime += stateDuration;
    } else {
      this.metrics.downtime += stateDuration;
    }
    
    this.state = newState;
    this.stateStartTime = now;
    
    // Set next attempt time for OPEN state
    if (newState === 'OPEN') {
      this.nextAttemptTime = now + this.config.resetTimeout;
    }
    
    // Record state transition
    const transition = {
      from: oldState,
      to: newState,
      timestamp: now,
      failures: this.failures,
      successes: this.successes,
      reason: this.getTransitionReason(oldState, newState)
    };
    
    this.metrics.stateTransitions.push(transition);
    
    // Keep only recent transitions
    if (this.metrics.stateTransitions.length > 100) {
      this.metrics.stateTransitions = this.metrics.stateTransitions.slice(-50);
    }
    
    logger.info(`🟢 Circuit breaker ${this.name}: ${oldState} → ${newState} (${transition.reason})`);
    
    this.emit('state-change', transition);
    
    // Emit specific state events
    switch (newState) {
      case 'OPEN':
        this.emit('circuit-opened', { failures: this.failures, lastFailure: this.lastFailureTime });
        break;
      case 'HALF_OPEN':
        this.emit('circuit-half-open', { attempts: this.halfOpenAttempts });
        break;
      case 'CLOSED':
        this.emit('circuit-closed', { successes: this.successes, recovered: true });
        break;
    }
  }

  getTransitionReason(from, to) {
    if (from === 'CLOSED' && to === 'OPEN') {
      return 'failure-threshold-exceeded';
    } else if (from === 'OPEN' && to === 'HALF_OPEN') {
      return 'reset-timeout-elapsed';
    } else if (from === 'HALF_OPEN' && to === 'CLOSED') {
      return 'success-threshold-reached';
    } else if (from === 'HALF_OPEN' && to === 'OPEN') {
      return 'half-open-failure';
    }
    return 'unknown';
  }

  updateResponseTimeMetrics(responseTime) {
    this.responseTimeHistory.push({
      time: responseTime,
      timestamp: Date.now()
    });
    
    // Keep only recent history
    const cutoff = Date.now() - this.config.monitoringWindow;
    this.responseTimeHistory = this.responseTimeHistory.filter(
      entry => entry.timestamp > cutoff
    );
    
    // Update average
    if (this.responseTimeHistory.length > 0) {
      this.metrics.averageResponseTime = this.responseTimeHistory.reduce((sum, entry) => sum + entry.time, 0
      ) / this.responseTimeHistory.length;
    }
  }

  addFailureToWindow(error) {
    this.metrics.lastWindowFailures.push({
      error: error.message,
      type: error.constructor.name,
      timestamp: Date.now()
    });
    
    // Keep only recent failures
    const cutoff = Date.now() - this.config.monitoringWindow;
    this.metrics.lastWindowFailures = this.metrics.lastWindowFailures.filter(
      failure => failure.timestamp > cutoff
    );
  }

  updateConsciousnessMetrics(operation, context) {
    // Simple consciousness scoring based on operation type and context
    const operationStr = typeof operation === 'string' ? operation : operation.toString();
    
    // Boost score for ethical operations
    if (operationStr.includes('help') || operationStr.includes('assist') || 
        operationStr.includes('improve') || context.ethical) {
      this.consciousnessMetrics.ethicalCompliance = Math.min(1.0, 
        this.consciousnessMetrics.ethicalCompliance + 0.01
      );
    }
    
    // Boost score for sustainable practices
    if (operationStr.includes('optimize') || operationStr.includes('efficient') ||
        context.sustainable) {
      this.consciousnessMetrics.sustainabilityIndex = Math.min(1.0,
        this.consciousnessMetrics.sustainabilityIndex + 0.01
      );
    }
    
    // Boost score for community benefit
    if (operationStr.includes('community') || operationStr.includes('shared') ||
        context.communityBenefit) {
      this.consciousnessMetrics.communityBenefit = Math.min(1.0,
        this.consciousnessMetrics.communityBenefit + 0.01
      );
    }
  }

  shouldUseFallback(error) {
    // Always use fallback for timeout errors
    if (error.type === 'OPERATION_TIMEOUT') {return true;}
    
    // Use fallback when circuit is open or has many failures
    if (this.state === 'OPEN' || this.failures >= this.config.failureThreshold) {
      return true;
    }
    
    // Use fallback for specific error types
    const fallbackErrors = [
      'CONNECTION_FAILED',
      'SERVICE_UNAVAILABLE',
      'RESOURCE_EXHAUSTED',
      'AUTHENTICATION_FAILED'
    ];
    
    return fallbackErrors.includes(error.type);
  }

  getConsciousnessScore() {
    const metrics = this.consciousnessMetrics;
    return (metrics.alignmentScore + metrics.ethicalCompliance + 
            metrics.sustainabilityIndex + metrics.communityBenefit) / 4;
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      halfOpenAttempts: this.halfOpenAttempts,
      nextAttemptTime: this.nextAttemptTime,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      config: this.config,
      consciousnessScore: this.getConsciousnessScore()
    };
  }

  getMetrics() {
    const now = Date.now();
    const currentStateDuration = now - this.stateStartTime;
    
    return {
      ...this.metrics,
      currentState: this.state,
      currentStateDuration,
      failureRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0,
      successRate: this.metrics.totalRequests > 0 ?
        (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0,
      availabilityRate: this.metrics.uptime > 0 ?
        (this.metrics.uptime / (this.metrics.uptime + this.metrics.downtime)) * 100 : 100,
      consciousness: this.consciousnessMetrics,
      recentFailures: this.metrics.lastWindowFailures.slice(-10),
      recentTransitions: this.metrics.stateTransitions.slice(-5)
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.nextAttemptTime = null;
    this.stateStartTime = Date.now();
    
    logger.info(`🟢 Circuit breaker ${this.name} manually reset`);
    this.emit('reset');
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }
}

/**
 * Retry Logic with Exponential Backoff and Jitter
 */
class RetryManager {
  constructor(options = {}) {
    this.config = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffFactor: options.backoffFactor || 2,
      jitterFactor: options.jitterFactor || 0.1,
      retryableErrors: options.retryableErrors || [
        'CONNECTION_FAILED',
        'TIMEOUT',
        'SERVICE_UNAVAILABLE',
        'RATE_LIMITED'
      ]
    };
  }

  async executeWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation(context);
        
        if (attempt > 0) {
          logger.info(`🏁 Operation succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        logger.warn(`⏳ Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${error.message}`);
        
        await this.sleep(delay);
      }
    }
    
    throw new BumbaError('RETRY_EXHAUSTED', 
      `Operation failed after ${this.config.maxRetries + 1} attempts`,
      { lastError: lastError.message, attempts: this.config.maxRetries + 1 }
    );
  }

  isRetryableError(error) {
    return this.config.retryableErrors.includes(error.type) ||
           this.config.retryableErrors.some(pattern => 
             error.message.toLowerCase().includes(pattern.toLowerCase())
           );
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.config.jitterFactor * Math.random();
    
    return Math.floor(cappedDelay + jitter);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Bulkhead Pattern for Failure Isolation
 */
class BulkheadManager {
  constructor() {
    this.bulkheads = new Map();
    this.executionQueues = new Map();
  }

  createBulkhead(name, options = {}) {
    const bulkhead = {
      name,
      maxConcurrency: options.maxConcurrency || 10,
      maxQueueSize: options.maxQueueSize || 50,
      timeout: options.timeout || 30000,
      currentExecutions: 0,
      queuedRequests: 0,
      rejectedRequests: 0,
      totalRequests: 0,
      metrics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        rejectedExecutions: 0,
        averageExecutionTime: 0,
        maxExecutionTime: 0,
        minExecutionTime: Infinity
      }
    };
    
    this.bulkheads.set(name, bulkhead);
    this.executionQueues.set(name, []);
    
    return bulkhead;
  }

  async executeInBulkhead(bulkheadName, operation, context = {}) {
    const bulkhead = this.bulkheads.get(bulkheadName);
    if (!bulkhead) {
      throw new BumbaError('BULKHEAD_NOT_FOUND', 
        `Bulkhead ${bulkheadName} not found`
      );
    }

    bulkhead.totalRequests++;

    // Check if we can execute immediately
    if (bulkhead.currentExecutions < bulkhead.maxConcurrency) {
      return this.executeImmediately(bulkhead, operation, context);
    }

    // Queue the request if there's space
    const queue = this.executionQueues.get(bulkheadName);
    if (queue.length < bulkhead.maxQueueSize) {
      return this.queueExecution(bulkhead, queue, operation, context);
    }

    // Reject if bulkhead is full
    bulkhead.rejectedRequests++;
    bulkhead.metrics.rejectedExecutions++;
    
    throw new BumbaError('BULKHEAD_FULL', 
      `Bulkhead ${bulkheadName} is at capacity`,
      { 
        currentExecutions: bulkhead.currentExecutions,
        queueSize: queue.length,
        maxConcurrency: bulkhead.maxConcurrency,
        maxQueueSize: bulkhead.maxQueueSize
      }
    );
  }

  async executeImmediately(bulkhead, operation, context) {
    bulkhead.currentExecutions++;
    bulkhead.metrics.totalExecutions++;
    
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        operation(context),
        this.createTimeoutPromise(bulkhead.timeout)
      ]);
      
      const executionTime = Date.now() - startTime;
      this.updateExecutionMetrics(bulkhead, executionTime, true);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateExecutionMetrics(bulkhead, executionTime, false);
      throw error;
      
    } finally {
      bulkhead.currentExecutions--;
      this.processQueue(bulkhead.name);
    }
  }

  async queueExecution(bulkhead, queue, operation, context) {
    return new Promise((resolve, reject) => {
      bulkhead.queuedRequests++;
      
      const queueItem = {
        operation,
        context,
        resolve,
        reject,
        queuedAt: Date.now()
      };
      
      queue.push(queueItem);
    });
  }

  async processQueue(bulkheadName) {
    const bulkhead = this.bulkheads.get(bulkheadName);
    const queue = this.executionQueues.get(bulkheadName);
    
    if (queue.length === 0 || bulkhead.currentExecutions >= bulkhead.maxConcurrency) {
      return;
    }
    
    const queueItem = queue.shift();
    bulkhead.queuedRequests--;
    
    // Execute the queued operation
    this.executeImmediately(bulkhead, queueItem.operation, queueItem.context)
      .then(queueItem.resolve)
      .catch(queueItem.reject);
  }

  updateExecutionMetrics(bulkhead, executionTime, success) {
    const metrics = bulkhead.metrics;
    
    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }
    
    // Update timing metrics
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime);
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime);
    
    // Update average execution time
    const totalExecutions = metrics.successfulExecutions + metrics.failedExecutions;
    metrics.averageExecutionTime = (
      (metrics.averageExecutionTime * (totalExecutions - 1)) + executionTime
    ) / totalExecutions;
  }

  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new BumbaError('BULKHEAD_TIMEOUT', 
          `Operation timed out after ${timeout}ms in bulkhead`
        ));
      }, timeout);
    });
  }

  getBulkheadStats(name) {
    const bulkhead = this.bulkheads.get(name);
    const queue = this.executionQueues.get(name);
    
    if (!bulkhead) {return null;}
    
    return {
      ...bulkhead,
      currentQueueSize: queue?.length || 0,
      utilizationRate: (bulkhead.currentExecutions / bulkhead.maxConcurrency) * 100,
      queueUtilizationRate: (queue?.length || 0) / bulkhead.maxQueueSize * 100
    };
  }

  getAllStats() {
    const stats = {};
    for (const [name] of this.bulkheads) {
      stats[name] = this.getBulkheadStats(name);
    }
    return stats;
  }
}

/**
 * Health Check System
 */
class HealthCheckManager extends EventEmitter {
  constructor() {
    super();
    this.healthChecks = new Map();
    this.healthStatus = new Map();
  }

  registerHealthCheck(name, checkFunction, options = {}) {
    const config = {
      interval: options.interval || 30000,
      timeout: options.timeout || 5000,
      unhealthyThreshold: options.unhealthyThreshold || 3,
      healthyThreshold: options.healthyThreshold || 2,
      retryInterval: options.retryInterval || 5000,
      tags: options.tags || [],
      ...options
    };

    const healthCheck = {
      name,
      checkFunction,
      config,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      isHealthy: true,
      intervalId: null,
      metrics: {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      }
    };

    this.healthChecks.set(name, healthCheck);
    this.healthStatus.set(name, true);
    
    this.startHealthCheck(healthCheck);
    
    logger.info(`🟢 Health check registered: ${name} (interval: ${config.interval}ms)`);
    
    return healthCheck;
  }

  startHealthCheck(healthCheck) {
    const executeCheck = async () => {
      const startTime = Date.now();
      healthCheck.metrics.totalChecks++;
      
      try {
        const result = await Promise.race([
          healthCheck.checkFunction(),
          this.createTimeoutPromise(healthCheck.config.timeout)
        ]);
        
        const responseTime = Date.now() - startTime;
        this.recordHealthCheckSuccess(healthCheck, result, responseTime);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.recordHealthCheckFailure(healthCheck, error, responseTime);
      }
    };

    // Execute immediately
    executeCheck();
    
    // Set up interval
    healthCheck.intervalId = setInterval(executeCheck, healthCheck.config.interval);
  }

  recordHealthCheckSuccess(healthCheck, result, responseTime) {
    healthCheck.metrics.successfulChecks++;
    healthCheck.consecutiveSuccesses++;
    healthCheck.consecutiveFailures = 0;
    healthCheck.lastCheck = Date.now();
    healthCheck.lastSuccess = healthCheck.lastCheck;
    
    this.updateHealthCheckMetrics(healthCheck, responseTime);
    
    // Check if we should mark as healthy
    if (!healthCheck.isHealthy && 
        healthCheck.consecutiveSuccesses >= healthCheck.config.healthyThreshold) {
      healthCheck.isHealthy = true;
      this.healthStatus.set(healthCheck.name, true);
      
      this.emit('health-recovered', {
        name: healthCheck.name,
        consecutiveSuccesses: healthCheck.consecutiveSuccesses,
        result
      });
      
      logger.info(`🏁 Health check recovered: ${healthCheck.name}`);
    }
    
    this.emit('health-check-success', {
      name: healthCheck.name,
      result,
      responseTime,
      isHealthy: healthCheck.isHealthy
    });
  }

  recordHealthCheckFailure(healthCheck, error, responseTime) {
    healthCheck.metrics.failedChecks++;
    healthCheck.consecutiveFailures++;
    healthCheck.consecutiveSuccesses = 0;
    healthCheck.lastCheck = Date.now();
    healthCheck.lastFailure = healthCheck.lastCheck;
    
    this.updateHealthCheckMetrics(healthCheck, responseTime);
    
    // Check if we should mark as unhealthy
    if (healthCheck.isHealthy && 
        healthCheck.consecutiveFailures >= healthCheck.config.unhealthyThreshold) {
      healthCheck.isHealthy = false;
      this.healthStatus.set(healthCheck.name, false);
      
      this.emit('health-degraded', {
        name: healthCheck.name,
        consecutiveFailures: healthCheck.consecutiveFailures,
        error: error.message
      });
      
      logger.error(`🔴 Health check failed: ${healthCheck.name} - ${error.message}`);
    }
    
    this.emit('health-check-failure', {
      name: healthCheck.name,
      error,
      responseTime,
      isHealthy: healthCheck.isHealthy,
      consecutiveFailures: healthCheck.consecutiveFailures
    });
  }

  updateHealthCheckMetrics(healthCheck, responseTime) {
    const metrics = healthCheck.metrics;
    
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    
    // Update average
    const totalChecks = metrics.successfulChecks + metrics.failedChecks;
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (totalChecks - 1)) + responseTime
    ) / totalChecks;
  }

  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new BumbaError('HEALTH_CHECK_TIMEOUT', 
          `Health check timed out after ${timeout}ms`
        ));
      }, timeout);
    });
  }

  getHealthStatus(name = null) {
    if (name) {
      return this.healthStatus.get(name);
    }
    
    const status = {};
    for (const [checkName, isHealthy] of this.healthStatus) {
      status[checkName] = isHealthy;
    }
    return status;
  }

  getOverallHealth() {
    const allHealthy = Array.from(this.healthStatus.values()).every(status => status);
    const unhealthyChecks = [];
    
    for (const [name, isHealthy] of this.healthStatus) {
      if (!isHealthy) {
        unhealthyChecks.push(name);
      }
    }
    
    return {
      isHealthy: allHealthy,
      totalChecks: this.healthStatus.size,
      healthyChecks: this.healthStatus.size - unhealthyChecks.length,
      unhealthyChecks
    };
  }

  getHealthCheckDetails(name) {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck) {return null;}
    
    return {
      name: healthCheck.name,
      isHealthy: healthCheck.isHealthy,
      config: healthCheck.config,
      consecutiveFailures: healthCheck.consecutiveFailures,
      consecutiveSuccesses: healthCheck.consecutiveSuccesses,
      lastCheck: healthCheck.lastCheck,
      lastSuccess: healthCheck.lastSuccess,
      lastFailure: healthCheck.lastFailure,
      metrics: healthCheck.metrics
    };
  }

  getAllHealthCheckDetails() {
    const details = {};
    for (const [name] of this.healthChecks) {
      details[name] = this.getHealthCheckDetails(name);
    }
    return details;
  }

  stopHealthCheck(name) {
    const healthCheck = this.healthChecks.get(name);
    if (healthCheck && healthCheck.intervalId) {
      clearInterval(healthCheck.intervalId);
      healthCheck.intervalId = null;
      logger.info(`🟢 Health check stopped: ${name}`);
    }
  }

  stopAllHealthChecks() {
    for (const [name] of this.healthChecks) {
      this.stopHealthCheck(name);
    }
  }
}

module.exports = {
  EnhancedCircuitBreaker,
  RetryManager,
  BulkheadManager,
  HealthCheckManager
};