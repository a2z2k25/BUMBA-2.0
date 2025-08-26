/**
 * BUMBA Unified Failure Manager
 * Centralized failure handling, recovery, and notification system
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');
const path = require('path');
const fs = require('fs');

class UnifiedFailureManager extends EventEmitter {
  constructor() {
    super();
    
    // Failure tracking
    this.failures = new Map();
    this.failurePatterns = new Map();
    this.recoveryStrategies = new Map();
    
    // Statistics
    this.stats = {
      totalFailures: 0,
      recoveredFailures: 0,
      criticalFailures: 0,
      failuresByType: {},
      failuresByComponent: {},
      averageRecoveryTime: 0
    };
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      notificationThreshold: 5,
      criticalThreshold: 10,
      autoRecovery: true,
      persistFailures: true,
      failureLogPath: path.join(process.cwd(), 'logs', 'failures.json')
    };
    
    // Recovery strategies
    this.initializeRecoveryStrategies();
    
    // Notification handlers
    this.notificationHandlers = new Set();
    
    // Circuit breakers
    this.circuitBreakers = new Map();
    
    logger.info('🛡️ Unified Failure Manager initialized');
  }

  /**
   * Initialize default recovery strategies
   */
  initializeRecoveryStrategies() {
    // Network failures
    this.registerRecoveryStrategy('NETWORK_ERROR', {
      maxRetries: 5,
      retryDelay: 2000,
      exponentialBackoff: true,
      async recover(error, context) {
        logger.info('Attempting network recovery...');
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return { retry: true };
      }
    });
    
    // Memory failures
    this.registerRecoveryStrategy('MEMORY_LIMIT', {
      maxRetries: 2,
      async recover(error, context) {
        logger.info('Attempting memory recovery...');
        if (global.gc) {
          global.gc();
        }
        // Clear caches
        if (context.clearCache) {
          await context.clearCache();
        }
        return { retry: true, cleared: true };
      }
    });
    
    // Specialist failures
    this.registerRecoveryStrategy('SPECIALIST_FAILURE', {
      maxRetries: 3,
      async recover(error, context) {
        logger.info('Attempting specialist recovery...');
        if (context.specialist && context.specialist.reset) {
          await context.specialist.reset();
        }
        return { retry: true };
      }
    });
    
    // API failures
    this.registerRecoveryStrategy('API_ERROR', {
      maxRetries: 3,
      retryDelay: 3000,
      exponentialBackoff: true,
      async recover(error, context) {
        const statusCode = error.statusCode || error.response?.status;
        
        // Don't retry on client errors
        if (statusCode >= 400 && statusCode < 500) {
          return { retry: false, reason: 'Client error - no retry' };
        }
        
        // Retry on server errors
        return { retry: true };
      }
    });
    
    // Database failures
    this.registerRecoveryStrategy('DATABASE_ERROR', {
      maxRetries: 3,
      retryDelay: 2000,
      async recover(error, context) {
        logger.info('Attempting database recovery...');
        if (context.reconnect) {
          await context.reconnect();
        }
        return { retry: true };
      }
    });
  }

  /**
   * Register a custom recovery strategy
   */
  registerRecoveryStrategy(type, strategy) {
    this.recoveryStrategies.set(type, {
      maxRetries: strategy.maxRetries || 3,
      retryDelay: strategy.retryDelay || 1000,
      exponentialBackoff: strategy.exponentialBackoff || false,
      recover: strategy.recover
    });
  }

  /**
   * Handle a failure with automatic recovery
   */
  async handleFailure(error, context = {}) {
    const failureId = this.generateFailureId();
    const timestamp = Date.now();
    
    // Create failure record
    const failure = {
      id: failureId,
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        type: error.type || this.classifyError(error)
      },
      context: {
        component: context.component || 'unknown',
        operation: context.operation || 'unknown',
        metadata: context.metadata || {}
      },
      attempts: 0,
      recovered: false,
      recoveryTime: null
    };
    
    this.failures.set(failureId, failure);
    this.updateStatistics(failure);
    
    // Log the failure
    logger.error(`Failure ${failureId}: ${error.message}`, {
      component: failure.context.component,
      operation: failure.context.operation
    });
    
    // Emit failure event
    this.emit('failure', failure);
    
    // Check circuit breaker
    if (this.isCircuitOpen(failure.context.component)) {
      logger.warn(`Circuit breaker open for ${failure.context.component}`);
      throw new Error(`Circuit breaker open: ${failure.context.component}`);
    }
    
    // Attempt recovery if enabled
    if (this.config.autoRecovery) {
      const recovered = await this.attemptRecovery(failure, context);
      
      if (recovered) {
        failure.recovered = true;
        failure.recoveryTime = Date.now() - timestamp;
        this.stats.recoveredFailures++;
        
        logger.info(`✅ Failure ${failureId} recovered in ${failure.recoveryTime}ms`);
        this.emit('recovery', failure);
        
        return { recovered: true, failureId };
      }
    }
    
    // Check if critical
    if (this.isCriticalFailure(failure)) {
      this.stats.criticalFailures++;
      this.emit('critical-failure', failure);
      await this.handleCriticalFailure(failure);
    }
    
    // Persist failure if configured
    if (this.config.persistFailures) {
      await this.persistFailure(failure);
    }
    
    // Send notifications if threshold reached
    await this.checkNotificationThreshold();
    
    return { recovered: false, failureId };
  }

  /**
   * Attempt to recover from failure
   */
  async attemptRecovery(failure, context) {
    const strategy = this.recoveryStrategies.get(failure.error.type);
    
    if (!strategy) {
      logger.debug(`No recovery strategy for ${failure.error.type}`);
      return false;
    }
    
    const maxRetries = strategy.maxRetries;
    let delay = strategy.retryDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      failure.attempts = attempt;
      
      logger.info(`Recovery attempt ${attempt}/${maxRetries} for ${failure.id}`);
      
      try {
        // Wait before retry
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Exponential backoff
          if (strategy.exponentialBackoff) {
            delay *= 2;
          }
        }
        
        // Execute recovery strategy
        const result = await strategy.recover.call(strategy, failure.error, context);
        
        if (result.retry === false) {
          logger.debug(`Recovery strategy declined retry: ${result.reason}`);
          return false;
        }
        
        // If context has retry function, use it
        if (context.retry) {
          await context.retry();
          return true;
        }
        
        // Recovery succeeded
        return true;
        
      } catch (retryError) {
        logger.warn(`Recovery attempt ${attempt} failed:`, retryError.message);
        
        if (attempt === maxRetries) {
          logger.error(`All recovery attempts failed for ${failure.id}`);
          return false;
        }
      }
    }
    
    return false;
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    const code = error.code;
    
    // Network errors
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
      return 'NETWORK_ERROR';
    }
    
    // Memory errors
    if (message.includes('heap') || message.includes('memory')) {
      return 'MEMORY_LIMIT';
    }
    
    // Database errors
    if (message.includes('database') || message.includes('connection')) {
      return 'DATABASE_ERROR';
    }
    
    // API errors
    if (error.statusCode || error.response) {
      return 'API_ERROR';
    }
    
    // Specialist errors
    if (message.includes('specialist')) {
      return 'SPECIALIST_FAILURE';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Handle critical failures
   */
  async handleCriticalFailure(failure) {
    logger.error(`🚨 CRITICAL FAILURE DETECTED: ${failure.error.message}`);
    
    // Notify all handlers immediately
    for (const handler of this.notificationHandlers) {
      try {
        await handler({
          type: 'CRITICAL',
          failure,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to send critical notification:', error);
      }
    }
    
    // Take emergency action based on component
    const component = failure.context.component;
    
    if (component === 'memory') {
      logger.warn('Emergency memory cleanup triggered');
      if (global.gc) global.gc();
    } else if (component === 'database') {
      logger.warn('Emergency database disconnect');
      // Trigger database disconnection
      this.emit('emergency-disconnect', 'database');
    }
  }

  /**
   * Check if circuit breaker should be opened
   */
  isCircuitOpen(component) {
    const breaker = this.circuitBreakers.get(component);
    
    if (!breaker) {
      return false;
    }
    
    return breaker.state === 'open' && Date.now() < breaker.resetTime;
  }

  /**
   * Trip circuit breaker
   */
  tripCircuitBreaker(component, duration = 60000) {
    this.circuitBreakers.set(component, {
      state: 'open',
      resetTime: Date.now() + duration,
      tripCount: (this.circuitBreakers.get(component)?.tripCount || 0) + 1
    });
    
    logger.warn(`Circuit breaker tripped for ${component} (${duration}ms)`);
    
    // Auto-reset after duration
    setTimeout(() => {
      this.resetCircuitBreaker(component);
    }, duration);
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(component) {
    const breaker = this.circuitBreakers.get(component);
    
    if (breaker) {
      breaker.state = 'closed';
      logger.info(`Circuit breaker reset for ${component}`);
    }
  }

  /**
   * Check notification threshold
   */
  async checkNotificationThreshold() {
    const recentFailures = Array.from(this.failures.values())
      .filter(f => Date.now() - f.timestamp < 300000); // Last 5 minutes
    
    if (recentFailures.length >= this.config.notificationThreshold) {
      for (const handler of this.notificationHandlers) {
        try {
          await handler({
            type: 'THRESHOLD',
            count: recentFailures.length,
            failures: recentFailures.slice(0, 5),
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error('Failed to send threshold notification:', error);
        }
      }
    }
  }

  /**
   * Register notification handler
   */
  registerNotificationHandler(handler) {
    this.notificationHandlers.add(handler);
    logger.debug('Notification handler registered');
  }

  /**
   * Determine if failure is critical
   */
  isCriticalFailure(failure) {
    // Memory failures are critical
    if (failure.error.type === 'MEMORY_LIMIT') {
      return true;
    }
    
    // Multiple attempts without recovery
    if (failure.attempts >= 3 && !failure.recovered) {
      return true;
    }
    
    // Specific components
    const criticalComponents = ['database', 'authentication', 'core'];
    if (criticalComponents.includes(failure.context.component)) {
      return true;
    }
    
    return false;
  }

  /**
   * Update statistics
   */
  updateStatistics(failure) {
    this.stats.totalFailures++;
    
    // By type
    const type = failure.error.type;
    this.stats.failuresByType[type] = (this.stats.failuresByType[type] || 0) + 1;
    
    // By component
    const component = failure.context.component;
    this.stats.failuresByComponent[component] = (this.stats.failuresByComponent[component] || 0) + 1;
  }

  /**
   * Persist failure to disk
   */
  async persistFailure(failure) {
    try {
      const logDir = path.dirname(this.config.failureLogPath);
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      let failures = [];
      if (fs.existsSync(this.config.failureLogPath)) {
        const content = fs.readFileSync(this.config.failureLogPath, 'utf-8');
        failures = JSON.parse(content);
      }
      
      failures.push({
        ...failure,
        persisted: new Date().toISOString()
      });
      
      // Keep only last 1000 failures
      if (failures.length > 1000) {
        failures = failures.slice(-1000);
      }
      
      fs.writeFileSync(this.config.failureLogPath, JSON.stringify(failures, null, 2));
      
    } catch (error) {
      logger.error('Failed to persist failure:', error);
    }
  }

  /**
   * Generate unique failure ID
   */
  generateFailureId() {
    return `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get failure statistics
   */
  getStatistics() {
    const recoveryRate = this.stats.totalFailures > 0
      ? (this.stats.recoveredFailures / this.stats.totalFailures * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      recoveryRate: `${recoveryRate}%`,
      activeFailures: this.failures.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([component, breaker]) => ({
        component,
        ...breaker
      }))
    };
  }

  /**
   * Clear old failures from memory
   */
  cleanupFailures(maxAge = 3600000) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, failure] of this.failures) {
      if (now - failure.timestamp > maxAge) {
        this.failures.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} old failures`);
    }
    
    return cleaned;
  }

  /**
   * Create wrapped function with automatic failure handling
   */
  wrap(fn, context = {}) {
    const manager = this;
    
    return async function wrapped(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        const result = await manager.handleFailure(error, {
          ...context,
          function: fn.name || 'anonymous',
          args: args.length
        });
        
        if (result.recovered) {
          // Retry the function
          return await fn.apply(this, args);
        }
        
        // Re-throw with failure ID
        error.failureId = result.failureId;
        throw error;
      }
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  UnifiedFailureManager,
  getInstance: () => {
    if (!instance) {
      instance = new UnifiedFailureManager();
    }
    return instance;
  }
};