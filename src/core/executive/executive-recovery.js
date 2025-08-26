/**
 * BUMBA Executive Recovery System
 * Handles edge cases and failure scenarios
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ExecutiveRecovery extends EventEmitter {
  constructor() {
    super();
    
    // Recovery configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      escalationThreshold: 2,
      recoveryTimeout: 30000,
      fallbackStrategies: true
    };
    
    // Recovery state
    this.recoveryAttempts = new Map();
    this.failedOperations = [];
    this.inRecovery = false;
    
    // Edge case handlers
    this.edgeCaseHandlers = new Map();
    
    // Circuit breaker for preventing cascading failures
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      timeout: 60000,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailure: null
    };
    
    this.initialize();
  }
  
  /**
   * Initialize recovery system
   */
  initialize() {
    logger.info('🟡️ Executive Recovery System initialized');
    this.registerDefaultHandlers();
  }
  
  /**
   * Register default edge case handlers
   */
  registerDefaultHandlers() {
    // Department unresponsive
    this.registerEdgeCase('DEPARTMENT_UNRESPONSIVE', async (context) => {
      logger.warn(`🔧 Department ${context.department} unresponsive`);
      
      // Try to restart department
      if (context.departmentRef && context.departmentRef.restart) {
        await context.departmentRef.restart();
        return { success: true, action: 'restarted' };
      }
      
      // Fallback: bypass department
      return { 
        success: true, 
        action: 'bypassed',
        fallback: true 
      };
    });
    
    // Executive activation failure
    this.registerEdgeCase('EXECUTIVE_ACTIVATION_FAILED', async (context) => {
      logger.error('🔴 Executive activation failed!');
      
      // Try force activation
      if (context.productStrategist) {
        try {
          context.productStrategist.organizationalAuthority = true;
          logger.info('🏁 Forced executive authority');
          return { success: true, action: 'forced' };
        } catch (error) {
          logger.error(`Force activation failed: ${error.message}`);
        }
      }
      
      return { 
        success: false, 
        action: 'manual_intervention_required' 
      };
    });
    
    // Crisis detector failure
    this.registerEdgeCase('CRISIS_DETECTOR_FAILURE', async (context) => {
      logger.error('🔴 Crisis detector failure!');
      
      // Manual crisis trigger
      if (context.framework) {
        context.framework.modeManager.forceMode('CRISIS', 'detector_failure');
        return { success: true, action: 'manual_crisis_triggered' };
      }
      
      return { success: false, action: 'monitoring_disabled' };
    });
    
    // Metrics overflow
    this.registerEdgeCase('METRICS_OVERFLOW', async (context) => {
      logger.warn('📊 Metrics overflow detected');
      
      // Reset metrics
      if (context.metrics) {
        context.metrics.reset();
        return { success: true, action: 'metrics_reset' };
      }
      
      return { success: false };
    });
    
    // Deadlock detected
    this.registerEdgeCase('DEADLOCK_DETECTED', async (context) => {
      logger.error('🔒 Deadlock detected between departments!');
      
      // Release all locks
      if (context.departments) {
        for (const dept of context.departments) {
          if (dept.releaseLocks) {
            await dept.releaseLocks();
          }
        }
        return { success: true, action: 'locks_released' };
      }
      
      return { success: false };
    });
    
    // Memory pressure
    this.registerEdgeCase('MEMORY_PRESSURE', async (context) => {
      logger.warn('💾 High memory pressure detected');
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Garbage collection triggered');
      }
      
      // Clear caches
      if (context.framework) {
        this.clearCaches(context.framework);
      }
      
      return { success: true, action: 'memory_cleared' };
    });
    
    // Infinite loop detected
    this.registerEdgeCase('INFINITE_LOOP', async (context) => {
      logger.error('🟢️ Infinite loop detected!');
      
      // Break the loop
      if (context.operation) {
        context.operation.cancelled = true;
        return { success: true, action: 'loop_broken' };
      }
      
      return { success: false };
    });
    
    // Mode transition stuck
    this.registerEdgeCase('TRANSITION_STUCK', async (context) => {
      logger.error('🔄 Mode transition stuck!');
      
      // Force complete transition
      if (context.modeManager) {
        context.modeManager.transitionInProgress = false;
        return { success: true, action: 'transition_forced' };
      }
      
      return { success: false };
    });
  }
  
  /**
   * Register edge case handler
   */
  registerEdgeCase(type, handler) {
    this.edgeCaseHandlers.set(type, handler);
    logger.info(`   Registered handler: ${type}`);
  }
  
  /**
   * Handle edge case
   */
  async handleEdgeCase(type, context = {}) {
    logger.warn(`🔧 Handling edge case: ${type}`);
    
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      logger.error('Circuit breaker OPEN - refusing operations');
      return { 
        success: false, 
        error: 'Circuit breaker open',
        waitTime: this.getCircuitResetTime()
      };
    }
    
    const handler = this.edgeCaseHandlers.get(type);
    
    if (!handler) {
      logger.error(`No handler for edge case: ${type}`);
      this.recordFailure(type);
      return { success: false, error: 'No handler available' };
    }
    
    try {
      const result = await this.executeWithRetry(
        () => handler(context),
        type
      );
      
      if (result.success) {
        this.recordSuccess(type);
        logger.info(`🏁 Edge case handled: ${type}`);
        
        this.emit('edgecase:resolved', {
          type,
          result,
          context
        });
      } else {
        this.recordFailure(type);
        logger.error(`🔴 Edge case handling failed: ${type}`);
        
        this.emit('edgecase:failed', {
          type,
          result,
          context
        });
      }
      
      return result;
      
    } catch (error) {
      this.recordFailure(type);
      logger.error(`Edge case handler error: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Execute with retry logic
   */
  async executeWithRetry(operation, operationId) {
    const attempts = this.recoveryAttempts.get(operationId) || 0;
    
    if (attempts >= this.config.maxRetries) {
      logger.error(`Max retries exceeded for ${operationId}`);
      return { 
        success: false, 
        error: 'Max retries exceeded' 
      };
    }
    
    try {
      this.recoveryAttempts.set(operationId, attempts + 1);
      const result = await operation();
      
      // Success - reset attempts
      this.recoveryAttempts.delete(operationId);
      return result;
      
    } catch (error) {
      logger.warn(`Attempt ${attempts + 1} failed for ${operationId}: ${error.message}`);
      
      if (attempts + 1 < this.config.maxRetries) {
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * (attempts + 1))
        );
        
        // Recursive retry
        return this.executeWithRetry(operation, operationId);
      }
      
      throw error;
    }
  }
  
  /**
   * Handle cascading failure
   */
  async handleCascadingFailure(failures) {
    logger.error('🔥 CASCADING FAILURE DETECTED!');
    logger.error(`   ${failures.length} components affected`);
    
    this.inRecovery = true;
    
    // Open circuit breaker
    this.openCircuit();
    
    // Emit emergency event
    this.emit('emergency:cascading_failure', {
      failures,
      timestamp: Date.now()
    });
    
    // Attempt recovery for each failure
    const recoveryResults = [];
    
    for (const failure of failures) {
      const result = await this.attemptRecovery(failure);
      recoveryResults.push({
        component: failure.component,
        success: result.success,
        action: result.action
      });
    }
    
    // Check if recovery successful
    const successCount = recoveryResults.filter(r => r.success).length;
    const successRate = successCount / recoveryResults.length;
    
    if (successRate > 0.5) {
      logger.info(`🏁 Partial recovery: ${successCount}/${recoveryResults.length} components`);
      
      // Close circuit after delay
      setTimeout(() => this.closeCircuit(), this.config.recoveryTimeout);
      
      this.inRecovery = false;
      return { 
        success: true, 
        partial: true,
        recovered: successCount,
        total: recoveryResults.length
      };
    } else {
      logger.error('🔴 Recovery failed - manual intervention required');
      this.inRecovery = false;
      
      return {
        success: false,
        error: 'Recovery failed',
        results: recoveryResults
      };
    }
  }
  
  /**
   * Attempt recovery for single component
   */
  async attemptRecovery(failure) {
    const recoveryStrategies = [
      () => this.restartComponent(failure),
      () => this.resetComponent(failure),
      () => this.bypassComponent(failure)
    ];
    
    for (const strategy of recoveryStrategies) {
      try {
        const result = await strategy();
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.debug(`Recovery strategy failed: ${error.message}`);
      }
    }
    
    return { success: false, error: 'All strategies failed' };
  }
  
  /**
   * Restart component
   */
  async restartComponent(failure) {
    if (failure.component && failure.component.restart) {
      await failure.component.restart();
      return { success: true, action: 'restarted' };
    }
    return { success: false };
  }
  
  /**
   * Reset component
   */
  async resetComponent(failure) {
    if (failure.component && failure.component.reset) {
      await failure.component.reset();
      return { success: true, action: 'reset' };
    }
    return { success: false };
  }
  
  /**
   * Bypass component
   */
  async bypassComponent(failure) {
    if (this.config.fallbackStrategies) {
      logger.info(`Bypassing ${failure.name || 'component'}`);
      return { success: true, action: 'bypassed', fallback: true };
    }
    return { success: false };
  }
  
  /**
   * Clear framework caches
   */
  clearCaches(framework) {
    // Clear metrics time series
    if (framework.executiveMetrics) {
      framework.executiveMetrics.timeSeries = {
        responseTimes: [],
        errorRates: [],
        resolutionTimes: [],
        departmentLoads: []
      };
    }
    
    // Clear mode history
    if (framework.modeManager) {
      const history = framework.modeManager.modeHistory;
      if (history.length > 10) {
        framework.modeManager.modeHistory = history.slice(-10);
      }
    }
    
    logger.info('Caches cleared');
  }
  
  /**
   * Circuit breaker methods
   */
  openCircuit() {
    this.circuitBreaker.state = 'OPEN';
    this.circuitBreaker.lastFailure = Date.now();
    logger.error('🟢 Circuit breaker OPENED');
  }
  
  closeCircuit() {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failures = 0;
    logger.info('🟢 Circuit breaker CLOSED');
  }
  
  isCircuitOpen() {
    if (this.circuitBreaker.state === 'OPEN') {
      // Check if timeout passed
      const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailure;
      if (timeSinceFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        logger.info('🟢 Circuit breaker HALF_OPEN');
      }
    }
    return this.circuitBreaker.state === 'OPEN';
  }
  
  getCircuitResetTime() {
    if (this.circuitBreaker.state === 'OPEN') {
      const remaining = this.circuitBreaker.timeout - 
        (Date.now() - this.circuitBreaker.lastFailure);
      return Math.max(0, remaining);
    }
    return 0;
  }
  
  /**
   * Record success/failure
   */
  recordSuccess(operation) {
    this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1);
    
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.closeCircuit();
    }
  }
  
  recordFailure(operation) {
    this.circuitBreaker.failures++;
    this.failedOperations.push({
      operation,
      timestamp: Date.now()
    });
    
    // Keep limited history
    if (this.failedOperations.length > 100) {
      this.failedOperations.shift();
    }
    
    // Check if circuit should open
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.openCircuit();
    }
  }
  
  /**
   * Get recovery status
   */
  getStatus() {
    return {
      inRecovery: this.inRecovery,
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        resetTime: this.getCircuitResetTime()
      },
      failedOperations: this.failedOperations.length,
      recoveryAttempts: Array.from(this.recoveryAttempts.entries()),
      handlers: Array.from(this.edgeCaseHandlers.keys())
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ExecutiveRecovery,
  getInstance: () => {
    if (!instance) {
      instance = new ExecutiveRecovery();
    }
    return instance;
  }
};