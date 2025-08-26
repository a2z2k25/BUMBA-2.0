/**
 * Advanced Retry Mechanism - Comprehensive retry strategies with exponential backoff
 * Provides sophisticated retry patterns for resilient operations
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Retry strategies
 */
const RetryStrategy = {
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  LINEAR_BACKOFF: 'linear_backoff',
  FIBONACCI_BACKOFF: 'fibonacci_backoff',
  JITTER_BACKOFF: 'jitter_backoff',
  ADAPTIVE: 'adaptive',
  CIRCUIT_BREAKER: 'circuit_breaker'
};

/**
 * Retry policies
 */
const RetryPolicy = {
  OPTIMISTIC: { maxRetries: 3, initialDelay: 100, maxDelay: 5000 },
  STANDARD: { maxRetries: 5, initialDelay: 500, maxDelay: 30000 },
  AGGRESSIVE: { maxRetries: 10, initialDelay: 1000, maxDelay: 60000 },
  PERSISTENT: { maxRetries: 20, initialDelay: 2000, maxDelay: 120000 }
};

/**
 * Advanced Retry Mechanism
 */
class AdvancedRetryMechanism extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      policy: RetryPolicy.STANDARD,
      enableJitter: true,
      enableAdaptiveRetry: true,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      metricsWindow: 300000,
      ...config
    };
    
    // Retry state management
    this.retryQueues = new Map(); // operationId -> retry state
    this.circuitBreakers = new Map(); // service -> circuit state
    this.adaptiveState = new Map(); // service -> adaptive parameters
    
    // Metrics tracking
    this.metrics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      abandonedOperations: 0,
      averageRetryCount: 0,
      successRate: 0
    };
    
    // Fibonacci sequence cache
    this.fibCache = [0, 1];
    
    logger.info('🔄 Advanced Retry Mechanism initialized', {
      strategy: this.config.strategy,
      adaptive: this.config.enableAdaptiveRetry
    });
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(operation, context = {}) {
    const operationId = this.generateOperationId();
    const startTime = Date.now();
    
    const retryState = {
      operationId,
      operation,
      context,
      attempt: 0,
      maxRetries: context.maxRetries || this.config.policy.maxRetries,
      strategy: context.strategy || this.config.strategy,
      lastError: null,
      startTime,
      delays: [],
      errors: []
    };
    
    this.retryQueues.set(operationId, retryState);
    
    try {
      const result = await this.attemptOperation(retryState);
      
      this.recordSuccess(retryState);
      this.retryQueues.delete(operationId);
      
      return result;
      
    } catch (finalError) {
      this.recordFailure(retryState, finalError);
      this.retryQueues.delete(operationId);
      
      throw finalError;
    }
  }

  /**
   * Attempt operation with retry logic
   */
  async attemptOperation(retryState) {
    const { operation, maxRetries, strategy } = retryState;
    
    while (retryState.attempt <= maxRetries) {
      try {
        // Check circuit breaker if enabled
        if (this.config.enableCircuitBreaker) {
          const serviceName = retryState.context.service || 'default';
          if (this.isCircuitOpen(serviceName)) {
            throw new Error(`Circuit breaker open for service: ${serviceName}`);
          }
        }
        
        // Execute the operation
        const result = await this.executeOperation(operation, retryState);
        
        // Operation succeeded
        if (retryState.attempt > 0) {
          logger.info(`🏁 Retry succeeded after ${retryState.attempt} attempts`);
        }
        
        // Update adaptive parameters if enabled
        if (this.config.enableAdaptiveRetry) {
          this.updateAdaptiveParameters(retryState, true);
        }
        
        return result;
        
      } catch (error) {
        retryState.lastError = error;
        retryState.errors.push({
          attempt: retryState.attempt,
          error: error.message,
          timestamp: Date.now()
        });
        
        // Check if we should retry
        if (!this.shouldRetry(error, retryState)) {
          throw error;
        }
        
        // Check if we've exhausted retries
        if (retryState.attempt >= maxRetries) {
          logger.error(`🔴 All retry attempts exhausted (${maxRetries} retries)`);
          throw new Error(`Operation failed after ${maxRetries} retries: ${error.message}`);
        }
        
        // Calculate delay before next retry
        const delay = this.calculateDelay(retryState);
        retryState.delays.push(delay);
        
        logger.warn(`🟠️ Attempt ${retryState.attempt} failed, retrying in ${delay}ms...`);
        
        // Wait before retrying
        await this.delay(delay);
        
        retryState.attempt++;
        this.metrics.totalRetries++;
        
        this.emit('retry:attempted', {
          operationId: retryState.operationId,
          attempt: retryState.attempt,
          delay,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute the actual operation
   */
  async executeOperation(operation, retryState) {
    if (typeof operation === 'function') {
      return await operation(retryState.attempt);
    }
    throw new Error('Operation must be a function');
  }

  /**
   * Determine if operation should be retried
   */
  shouldRetry(error, retryState) {
    // Don't retry on non-retryable errors
    if (this.isNonRetryableError(error)) {
      return false;
    }
    
    // Check if we have retries remaining
    if (retryState.attempt >= retryState.maxRetries) {
      return false;
    }
    
    // Check circuit breaker state
    if (this.config.enableCircuitBreaker) {
      const serviceName = retryState.context.service || 'default';
      if (this.isCircuitOpen(serviceName)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate delay based on retry strategy
   */
  calculateDelay(retryState) {
    const { attempt, strategy } = retryState;
    const { initialDelay, maxDelay } = this.config.policy;
    
    let baseDelay;
    
    switch (strategy) {
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        baseDelay = this.exponentialBackoff(attempt, initialDelay, maxDelay);
        break;
      
      case RetryStrategy.LINEAR_BACKOFF:
        baseDelay = this.linearBackoff(attempt, initialDelay, maxDelay);
        break;
      
      case RetryStrategy.FIBONACCI_BACKOFF:
        baseDelay = this.fibonacciBackoff(attempt, initialDelay, maxDelay);
        break;
      
      case RetryStrategy.JITTER_BACKOFF:
        baseDelay = this.jitterBackoff(attempt, initialDelay, maxDelay);
        break;
      
      case RetryStrategy.ADAPTIVE:
        baseDelay = this.adaptiveBackoff(retryState);
        break;
      
      default:
        baseDelay = this.exponentialBackoff(attempt, initialDelay, maxDelay);
    }
    
    // Add jitter if enabled
    if (this.config.enableJitter && strategy !== RetryStrategy.JITTER_BACKOFF) {
      baseDelay = this.addJitter(baseDelay);
    }
    
    return Math.min(baseDelay, maxDelay);
  }

  /**
   * Exponential backoff calculation
   */
  exponentialBackoff(attempt, initialDelay, maxDelay) {
    const delay = initialDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Linear backoff calculation
   */
  linearBackoff(attempt, initialDelay, maxDelay) {
    const delay = initialDelay * (attempt + 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Fibonacci backoff calculation
   */
  fibonacciBackoff(attempt, initialDelay, maxDelay) {
    const fib = this.getFibonacci(attempt + 1);
    const delay = initialDelay * fib;
    return Math.min(delay, maxDelay);
  }

  /**
   * Jitter backoff with full jitter
   */
  jitterBackoff(attempt, initialDelay, maxDelay) {
    const expDelay = this.exponentialBackoff(attempt, initialDelay, maxDelay);
    return Math.random() * expDelay;
  }

  /**
   * Adaptive backoff based on historical data
   */
  adaptiveBackoff(retryState) {
    const serviceName = retryState.context.service || 'default';
    const adaptiveParams = this.adaptiveState.get(serviceName) || {
      baseDelay: this.config.policy.initialDelay,
      successRate: 0.5,
      avgRetries: 0
    };
    
    // Adjust delay based on success rate
    let delay = adaptiveParams.baseDelay;
    
    if (adaptiveParams.successRate < 0.3) {
      // Low success rate, increase delay
      delay *= 2;
    } else if (adaptiveParams.successRate > 0.7) {
      // High success rate, decrease delay
      delay *= 0.8;
    }
    
    // Factor in average retries
    if (adaptiveParams.avgRetries > 3) {
      delay *= 1.5;
    }
    
    return Math.min(delay, this.config.policy.maxDelay);
  }

  /**
   * Add jitter to delay
   */
  addJitter(delay) {
    const jitter = delay * 0.2; // 20% jitter
    return delay + (Math.random() - 0.5) * jitter;
  }

  /**
   * Get Fibonacci number
   */
  getFibonacci(n) {
    if (n < this.fibCache.length) {
      return this.fibCache[n];
    }
    
    for (let i = this.fibCache.length; i <= n; i++) {
      this.fibCache[i] = this.fibCache[i - 1] + this.fibCache[i - 2];
    }
    
    return this.fibCache[n];
  }

  /**
   * Check if error is non-retryable
   */
  isNonRetryableError(error) {
    const nonRetryableMessages = [
      'invalid credentials',
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'invalid input'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Circuit breaker management
   */
  isCircuitOpen(serviceName) {
    const circuit = this.circuitBreakers.get(serviceName);
    
    if (!circuit) {
      return false;
    }
    
    if (circuit.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - circuit.openedAt > this.config.circuitBreakerTimeout) {
        // Move to half-open state
        circuit.state = 'half-open';
        circuit.testAttempts = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(serviceName, success) {
    if (!this.config.enableCircuitBreaker) {
      return;
    }
    
    let circuit = this.circuitBreakers.get(serviceName);
    
    if (!circuit) {
      circuit = {
        state: 'closed',
        failures: 0,
        testAttempts: 0,
        openedAt: null
      };
      this.circuitBreakers.set(serviceName, circuit);
    }
    
    if (success) {
      if (circuit.state === 'half-open') {
        circuit.testAttempts++;
        if (circuit.testAttempts >= 3) {
          // Successful tests, close circuit
          circuit.state = 'closed';
          circuit.failures = 0;
          logger.info(`🟢 Circuit breaker closed for ${serviceName}`);
        }
      } else {
        circuit.failures = 0;
      }
    } else {
      circuit.failures++;
      
      if (circuit.failures >= this.config.circuitBreakerThreshold) {
        circuit.state = 'open';
        circuit.openedAt = Date.now();
        logger.warn(`🔴 Circuit breaker opened for ${serviceName}`);
        
        this.emit('circuit:opened', { service: serviceName });
      }
    }
  }

  /**
   * Update adaptive parameters
   */
  updateAdaptiveParameters(retryState, success) {
    const serviceName = retryState.context.service || 'default';
    
    let params = this.adaptiveState.get(serviceName);
    if (!params) {
      params = {
        baseDelay: this.config.policy.initialDelay,
        successRate: 0.5,
        avgRetries: 0,
        totalOperations: 0,
        successfulOperations: 0
      };
      this.adaptiveState.set(serviceName, params);
    }
    
    params.totalOperations++;
    if (success) {
      params.successfulOperations++;
    }
    
    params.successRate = params.successfulOperations / params.totalOperations;
    params.avgRetries = (params.avgRetries * 0.9) + (retryState.attempt * 0.1);
    
    // Adjust base delay based on performance
    if (params.successRate < 0.3) {
      params.baseDelay = Math.min(params.baseDelay * 1.2, this.config.policy.maxDelay);
    } else if (params.successRate > 0.8) {
      params.baseDelay = Math.max(params.baseDelay * 0.8, 100);
    }
  }

  /**
   * Record successful operation
   */
  recordSuccess(retryState) {
    if (retryState.attempt > 0) {
      this.metrics.successfulRetries++;
    }
    
    const serviceName = retryState.context.service || 'default';
    this.updateCircuitBreaker(serviceName, true);
    
    this.updateMetrics();
    
    this.emit('retry:success', {
      operationId: retryState.operationId,
      attempts: retryState.attempt,
      totalDelay: retryState.delays.reduce((a, b) => a + b, 0),
      duration: Date.now() - retryState.startTime
    });
  }

  /**
   * Record failed operation
   */
  recordFailure(retryState, error) {
    this.metrics.failedRetries++;
    this.metrics.abandonedOperations++;
    
    const serviceName = retryState.context.service || 'default';
    this.updateCircuitBreaker(serviceName, false);
    
    this.updateMetrics();
    
    this.emit('retry:failure', {
      operationId: retryState.operationId,
      attempts: retryState.attempt,
      totalDelay: retryState.delays.reduce((a, b) => a + b, 0),
      duration: Date.now() - retryState.startTime,
      error: error.message
    });
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    const total = this.metrics.successfulRetries + this.metrics.failedRetries;
    if (total > 0) {
      this.metrics.successRate = this.metrics.successfulRetries / total;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate operation ID
   */
  generateOperationId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get retry statistics
   */
  getStats() {
    const circuitStates = {};
    for (const [service, circuit] of this.circuitBreakers) {
      circuitStates[service] = circuit.state;
    }
    
    const adaptiveParams = {};
    for (const [service, params] of this.adaptiveState) {
      adaptiveParams[service] = {
        successRate: params.successRate,
        avgRetries: params.avgRetries,
        baseDelay: params.baseDelay
      };
    }
    
    return {
      metrics: { ...this.metrics },
      activeRetries: this.retryQueues.size,
      circuitBreakers: circuitStates,
      adaptiveParameters: adaptiveParams
    };
  }

  /**
   * Shutdown retry mechanism
   */
  shutdown() {
    this.retryQueues.clear();
    this.circuitBreakers.clear();
    this.adaptiveState.clear();
    
    logger.info('🔄 Advanced Retry Mechanism shut down');
  }
}

module.exports = {
  AdvancedRetryMechanism,
  RetryStrategy,
  RetryPolicy
};