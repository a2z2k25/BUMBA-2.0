/**
 * Executive Fault Tolerance System
 * Bulkhead isolation, circuit breakers, and resilience patterns
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Resilience patterns
 */
const ResiliencePattern = {
  BULKHEAD: 'bulkhead',
  CIRCUIT_BREAKER: 'circuit_breaker',
  RETRY: 'retry',
  TIMEOUT: 'timeout',
  FALLBACK: 'fallback',
  CACHE: 'cache',
  RATE_LIMITER: 'rate_limiter',
  DEBOUNCE: 'debounce',
  THROTTLE: 'throttle'
};

/**
 * Bulkhead types
 */
const BulkheadType = {
  THREAD_POOL: 'thread_pool',
  SEMAPHORE: 'semaphore',
  QUEUE: 'queue'
};

/**
 * Circuit breaker states
 */
const CircuitState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

class FaultToleranceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      enableBulkheads: true,
      enableCircuitBreakers: true,
      enableRetries: true,
      enableFallbacks: true,
      enableDeadLetterQueues: true,
      enableTimeoutManagement: true,
      bulkheadSize: 10,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutDuration: 30000,
      queueSize: 1000,
      ...config
    };
    
    // Bulkhead isolation
    this.bulkheads = new Map();
    
    // Circuit breakers
    this.circuitBreakers = new Map();
    
    // Fallback handlers
    this.fallbacks = new Map();
    
    // Dead letter queues
    this.deadLetterQueues = new Map();
    
    // Queue management
    this.queues = new Map();
    
    // Timeout management
    this.timeouts = new Map();
    
    // Metrics
    this.metrics = {
      bulkheadRejections: 0,
      circuitBreakerTrips: 0,
      retryAttempts: 0,
      fallbackExecutions: 0,
      deadLetterMessages: 0,
      timeouts: 0,
      successfulRecoveries: 0
    };
    
    this.initialize();
  }

  /**
   * Initialize fault tolerance system
   */
  async initialize() {
    logger.info('🟡️ Initializing Fault Tolerance System');
    
    // Setup default bulkheads
    this.setupDefaultBulkheads();
    
    // Setup default circuit breakers
    this.setupDefaultCircuitBreakers();
    
    // Setup dead letter queues
    this.setupDeadLetterQueues();
    
    // Start monitoring
    this.startMonitoring();
    
    logger.info('🏁 Fault Tolerance System initialized');
  }

  /**
   * Setup default bulkheads
   */
  setupDefaultBulkheads() {
    // Critical operations bulkhead
    this.createBulkhead('critical', {
      type: BulkheadType.SEMAPHORE,
      maxConcurrent: 5,
      maxQueueSize: 10,
      timeout: 60000
    });
    
    // Database operations bulkhead
    this.createBulkhead('database', {
      type: BulkheadType.THREAD_POOL,
      maxConcurrent: 20,
      maxQueueSize: 100,
      timeout: 30000
    });
    
    // External API bulkhead
    this.createBulkhead('external_api', {
      type: BulkheadType.QUEUE,
      maxConcurrent: 10,
      maxQueueSize: 50,
      timeout: 15000
    });
    
    // Background tasks bulkhead
    this.createBulkhead('background', {
      type: BulkheadType.QUEUE,
      maxConcurrent: 30,
      maxQueueSize: 200,
      timeout: 120000
    });
  }

  /**
   * Create bulkhead
   */
  createBulkhead(name, config) {
    const bulkhead = {
      name,
      type: config.type || BulkheadType.SEMAPHORE,
      maxConcurrent: config.maxConcurrent || this.config.bulkheadSize,
      maxQueueSize: config.maxQueueSize || 100,
      timeout: config.timeout || this.config.timeoutDuration,
      currentConcurrent: 0,
      queue: [],
      rejected: 0,
      completed: 0,
      failed: 0
    };
    
    this.bulkheads.set(name, bulkhead);
    
    logger.info(`📦 Bulkhead created: ${name} (max: ${bulkhead.maxConcurrent})`);
    
    return bulkhead;
  }

  /**
   * Execute with bulkhead protection
   */
  async executeBulkhead(bulkheadName, operation, context = {}) {
    const bulkhead = this.bulkheads.get(bulkheadName);
    
    if (!bulkhead) {
      throw new Error(`Bulkhead not found: ${bulkheadName}`);
    }
    
    // Check if bulkhead is full
    if (bulkhead.currentConcurrent >= bulkhead.maxConcurrent) {
      // Try to queue
      if (bulkhead.queue.length >= bulkhead.maxQueueSize) {
        bulkhead.rejected++;
        this.metrics.bulkheadRejections++;
        
        this.emit('bulkhead:rejected', {
          bulkhead: bulkheadName,
          queueSize: bulkhead.queue.length
        });
        
        throw new Error(`Bulkhead ${bulkheadName} is full`);
      }
      
      // Queue the operation
      return this.queueOperation(bulkhead, operation, context);
    }
    
    // Execute immediately
    return this.executeInBulkhead(bulkhead, operation, context);
  }

  /**
   * Execute operation in bulkhead
   */
  async executeInBulkhead(bulkhead, operation, context) {
    bulkhead.currentConcurrent++;
    
    const timeoutId = setTimeout(() => {
      this.handleTimeout(bulkhead, context);
    }, bulkhead.timeout);
    
    try {
      const result = await operation();
      
      clearTimeout(timeoutId);
      bulkhead.completed++;
      
      this.emit('bulkhead:success', {
        bulkhead: bulkhead.name,
        concurrent: bulkhead.currentConcurrent
      });
      
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      bulkhead.failed++;
      
      this.emit('bulkhead:failure', {
        bulkhead: bulkhead.name,
        error: error.message
      });
      
      throw error;
      
    } finally {
      bulkhead.currentConcurrent--;
      
      // Process queued operations
      if (bulkhead.queue.length > 0) {
        const queued = bulkhead.queue.shift();
        this.executeInBulkhead(bulkhead, queued.operation, queued.context)
          .then(queued.resolve)
          .catch(queued.reject);
      }
    }
  }

  /**
   * Queue operation
   */
  queueOperation(bulkhead, operation, context) {
    return new Promise((resolve, reject) => {
      bulkhead.queue.push({
        operation,
        context,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.emit('bulkhead:queued', {
        bulkhead: bulkhead.name,
        queueSize: bulkhead.queue.length
      });
    });
  }

  /**
   * Setup default circuit breakers
   */
  setupDefaultCircuitBreakers() {
    // Database circuit breaker
    this.createCircuitBreaker('database', {
      threshold: 5,
      timeout: 60000,
      resetTimeout: 30000,
      monitoringPeriod: 10000
    });
    
    // External API circuit breaker
    this.createCircuitBreaker('external_api', {
      threshold: 3,
      timeout: 30000,
      resetTimeout: 60000,
      monitoringPeriod: 5000
    });
    
    // Critical service circuit breaker
    this.createCircuitBreaker('critical_service', {
      threshold: 2,
      timeout: 120000,
      resetTimeout: 120000,
      monitoringPeriod: 15000
    });
  }

  /**
   * Create circuit breaker
   */
  createCircuitBreaker(name, config) {
    const circuitBreaker = {
      name,
      state: CircuitState.CLOSED,
      threshold: config.threshold || this.config.circuitBreakerThreshold,
      timeout: config.timeout || this.config.circuitBreakerTimeout,
      resetTimeout: config.resetTimeout || 60000,
      monitoringPeriod: config.monitoringPeriod || 10000,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      nextAttemptTime: null,
      totalRequests: 0,
      stats: {
        trips: 0,
        recoveries: 0,
        rejections: 0
      }
    };
    
    this.circuitBreakers.set(name, circuitBreaker);
    
    logger.info(`🟢 Circuit breaker created: ${name} (threshold: ${circuitBreaker.threshold})`);
    
    return circuitBreaker;
  }

  /**
   * Execute with circuit breaker protection
   */
  async executeCircuitBreaker(breakerName, operation, fallback = null) {
    const breaker = this.circuitBreakers.get(breakerName);
    
    if (!breaker) {
      throw new Error(`Circuit breaker not found: ${breakerName}`);
    }
    
    // Check circuit state
    if (breaker.state === CircuitState.OPEN) {
      // Check if we should attempt half-open
      if (Date.now() >= breaker.nextAttemptTime) {
        breaker.state = CircuitState.HALF_OPEN;
        logger.info(`🟢 Circuit breaker ${breakerName} entering half-open state`);
      } else {
        breaker.stats.rejections++;
        
        this.emit('circuit:rejected', {
          breaker: breakerName,
          nextAttempt: breaker.nextAttemptTime
        });
        
        // Execute fallback if available
        if (fallback) {
          return this.executeFallback(breakerName, fallback);
        }
        
        throw new Error(`Circuit breaker ${breakerName} is open`);
      }
    }
    
    // Execute operation
    breaker.totalRequests++;
    
    try {
      const result = await this.executeWithTimeout(operation, breaker.timeout);
      
      // Success
      this.handleCircuitSuccess(breaker);
      
      return result;
      
    } catch (error) {
      // Failure
      this.handleCircuitFailure(breaker, error);
      
      // Execute fallback if available
      if (fallback) {
        return this.executeFallback(breakerName, fallback);
      }
      
      throw error;
    }
  }

  /**
   * Handle circuit success
   */
  handleCircuitSuccess(breaker) {
    breaker.successes++;
    breaker.lastSuccessTime = Date.now();
    
    if (breaker.state === CircuitState.HALF_OPEN) {
      // Successful in half-open, close the circuit
      breaker.state = CircuitState.CLOSED;
      breaker.failures = 0;
      breaker.stats.recoveries++;
      
      logger.info(`🏁 Circuit breaker ${breaker.name} recovered to closed state`);
      
      this.emit('circuit:closed', {
        breaker: breaker.name,
        recoveries: breaker.stats.recoveries
      });
    }
  }

  /**
   * Handle circuit failure
   */
  handleCircuitFailure(breaker, error) {
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.state === CircuitState.HALF_OPEN) {
      // Failed in half-open, re-open the circuit
      this.openCircuit(breaker);
    } else if (breaker.failures >= breaker.threshold) {
      // Threshold exceeded, open the circuit
      this.openCircuit(breaker);
    }
    
    this.emit('circuit:failure', {
      breaker: breaker.name,
      failures: breaker.failures,
      error: error.message
    });
  }

  /**
   * Open circuit breaker
   */
  openCircuit(breaker) {
    breaker.state = CircuitState.OPEN;
    breaker.nextAttemptTime = Date.now() + breaker.resetTimeout;
    breaker.stats.trips++;
    
    this.metrics.circuitBreakerTrips++;
    
    logger.warn(`🟠️ Circuit breaker ${breaker.name} tripped (trips: ${breaker.stats.trips})`);
    
    this.emit('circuit:open', {
      breaker: breaker.name,
      trips: breaker.stats.trips,
      nextAttempt: breaker.nextAttemptTime
    });
  }

  /**
   * Execute with retry
   */
  async executeRetry(operation, options = {}) {
    const config = {
      attempts: options.attempts || this.config.retryAttempts,
      delay: options.delay || this.config.retryDelay,
      backoff: options.backoff || 'exponential',
      maxDelay: options.maxDelay || 30000,
      shouldRetry: options.shouldRetry || (() => true)
    };
    
    let lastError;
    
    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.metrics.successfulRecoveries++;
          
          this.emit('retry:success', {
            attempt,
            totalAttempts: config.attempts
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.metrics.retryAttempts++;
        
        // Check if we should retry
        if (!config.shouldRetry(error, attempt)) {
          throw error;
        }
        
        if (attempt < config.attempts) {
          const delay = this.calculateRetryDelay(attempt, config);
          
          this.emit('retry:attempt', {
            attempt,
            totalAttempts: config.attempts,
            delay,
            error: error.message
          });
          
          await this.delay(delay);
        }
      }
    }
    
    // All retries exhausted
    this.emit('retry:exhausted', {
      attempts: config.attempts,
      error: lastError.message
    });
    
    throw lastError;
  }

  /**
   * Calculate retry delay
   */
  calculateRetryDelay(attempt, config) {
    let delay;
    
    switch (config.backoff) {
      case 'exponential':
        delay = Math.min(config.delay * Math.pow(2, attempt - 1), config.maxDelay);
        break;
        
      case 'linear':
        delay = Math.min(config.delay * attempt, config.maxDelay);
        break;
        
      case 'fibonacci':
        delay = Math.min(this.fibonacci(attempt) * config.delay, config.maxDelay);
        break;
        
      default:
        delay = config.delay;
    }
    
    // Add jitter
    delay += Math.random() * 1000;
    
    return delay;
  }

  /**
   * Register fallback handler
   */
  registerFallback(name, handler) {
    this.fallbacks.set(name, handler);
    
    logger.info(`🔄 Fallback registered: ${name}`);
  }

  /**
   * Execute fallback
   */
  async executeFallback(name, fallbackHandler = null) {
    const handler = fallbackHandler || this.fallbacks.get(name);
    
    if (!handler) {
      throw new Error(`No fallback handler for: ${name}`);
    }
    
    this.metrics.fallbackExecutions++;
    
    try {
      const result = await handler();
      
      this.emit('fallback:executed', {
        name,
        success: true
      });
      
      return result;
      
    } catch (error) {
      this.emit('fallback:failed', {
        name,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Setup dead letter queues
   */
  setupDeadLetterQueues() {
    // Create default DLQs
    this.createDeadLetterQueue('critical', {
      maxSize: 1000,
      retentionTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      retryPolicy: {
        maxRetries: 5,
        retryDelay: 60000
      }
    });
    
    this.createDeadLetterQueue('standard', {
      maxSize: 5000,
      retentionTime: 3 * 24 * 60 * 60 * 1000, // 3 days
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 30000
      }
    });
    
    this.createDeadLetterQueue('low_priority', {
      maxSize: 10000,
      retentionTime: 24 * 60 * 60 * 1000, // 1 day
      retryPolicy: {
        maxRetries: 1,
        retryDelay: 300000
      }
    });
  }

  /**
   * Create dead letter queue
   */
  createDeadLetterQueue(name, config) {
    const dlq = {
      name,
      messages: [],
      maxSize: config.maxSize || 1000,
      retentionTime: config.retentionTime || 24 * 60 * 60 * 1000,
      retryPolicy: config.retryPolicy || { maxRetries: 3, retryDelay: 60000 },
      stats: {
        total: 0,
        processed: 0,
        failed: 0,
        expired: 0
      }
    };
    
    this.deadLetterQueues.set(name, dlq);
    
    // Start processor
    this.startDLQProcessor(dlq);
    
    logger.info(`💀 Dead letter queue created: ${name} (max: ${dlq.maxSize})`);
    
    return dlq;
  }

  /**
   * Send to dead letter queue
   */
  async sendToDeadLetterQueue(queueName, message, error) {
    const dlq = this.deadLetterQueues.get(queueName);
    
    if (!dlq) {
      logger.error(`Dead letter queue not found: ${queueName}`);
      return;
    }
    
    // Check queue size
    if (dlq.messages.length >= dlq.maxSize) {
      // Remove oldest message
      const removed = dlq.messages.shift();
      dlq.stats.expired++;
    }
    
    const dlqMessage = {
      id: `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      error: error ? error.message : null,
      timestamp: Date.now(),
      retries: 0,
      nextRetry: Date.now() + dlq.retryPolicy.retryDelay
    };
    
    dlq.messages.push(dlqMessage);
    dlq.stats.total++;
    this.metrics.deadLetterMessages++;
    
    this.emit('dlq:message', {
      queue: queueName,
      messageId: dlqMessage.id
    });
    
    logger.warn(`💀 Message sent to DLQ ${queueName}: ${dlqMessage.id}`);
  }

  /**
   * Start DLQ processor
   */
  startDLQProcessor(dlq) {
    setInterval(async () => {
      await this.processDLQMessages(dlq);
      await this.cleanExpiredDLQMessages(dlq);
    }, 10000); // Every 10 seconds
  }

  /**
   * Process DLQ messages
   */
  async processDLQMessages(dlq) {
    const now = Date.now();
    const messagesToRetry = dlq.messages.filter(msg => 
      msg.nextRetry <= now && 
      msg.retries < dlq.retryPolicy.maxRetries
    );
    
    for (const msg of messagesToRetry) {
      try {
        // Attempt to reprocess
        await this.reprocessMessage(msg);
        
        // Success - remove from DLQ
        const index = dlq.messages.indexOf(msg);
        dlq.messages.splice(index, 1);
        dlq.stats.processed++;
        
        this.emit('dlq:processed', {
          queue: dlq.name,
          messageId: msg.id
        });
        
      } catch (error) {
        // Failed - update retry info
        msg.retries++;
        msg.nextRetry = now + dlq.retryPolicy.retryDelay * Math.pow(2, msg.retries);
        
        if (msg.retries >= dlq.retryPolicy.maxRetries) {
          dlq.stats.failed++;
          
          this.emit('dlq:failed', {
            queue: dlq.name,
            messageId: msg.id,
            retries: msg.retries
          });
        }
      }
    }
  }

  /**
   * Clean expired DLQ messages
   */
  async cleanExpiredDLQMessages(dlq) {
    const cutoff = Date.now() - dlq.retentionTime;
    const before = dlq.messages.length;
    
    dlq.messages = dlq.messages.filter(msg => msg.timestamp > cutoff);
    
    const removed = before - dlq.messages.length;
    if (removed > 0) {
      dlq.stats.expired += removed;
      
      logger.info(`🧹 Cleaned ${removed} expired messages from DLQ ${dlq.name}`);
    }
  }

  /**
   * Reprocess message
   */
  async reprocessMessage(dlqMessage) {
    // This would be overridden with actual reprocessing logic
    logger.info(`Reprocessing DLQ message: ${dlqMessage.id}`);
    
    // Simulate reprocessing
    if (Math.random() > 0.5) {
      throw new Error('Reprocessing failed');
    }
    
    return true;
  }

  /**
   * Create queue-based decoupling
   */
  createQueue(name, config = {}) {
    const queue = {
      name,
      messages: [],
      maxSize: config.maxSize || this.config.queueSize,
      processing: false,
      processors: config.processors || 1,
      stats: {
        enqueued: 0,
        processed: 0,
        failed: 0
      }
    };
    
    this.queues.set(name, queue);
    
    // Start processors
    for (let i = 0; i < queue.processors; i++) {
      this.startQueueProcessor(queue);
    }
    
    logger.info(`📬 Queue created: ${name} (max: ${queue.maxSize})`);
    
    return queue;
  }

  /**
   * Enqueue message
   */
  async enqueue(queueName, message, priority = 0) {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    
    if (queue.messages.length >= queue.maxSize) {
      throw new Error(`Queue ${queueName} is full`);
    }
    
    const queueMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: message,
      priority,
      timestamp: Date.now(),
      attempts: 0
    };
    
    // Insert based on priority
    let inserted = false;
    for (let i = 0; i < queue.messages.length; i++) {
      if (queue.messages[i].priority < priority) {
        queue.messages.splice(i, 0, queueMessage);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      queue.messages.push(queueMessage);
    }
    
    queue.stats.enqueued++;
    
    this.emit('queue:enqueued', {
      queue: queueName,
      messageId: queueMessage.id,
      size: queue.messages.length
    });
    
    return queueMessage.id;
  }

  /**
   * Start queue processor
   */
  startQueueProcessor(queue) {
    setInterval(async () => {
      if (queue.processing || queue.messages.length === 0) {
        return;
      }
      
      queue.processing = true;
      
      try {
        const message = queue.messages.shift();
        
        if (message) {
          await this.processQueueMessage(queue, message);
          queue.stats.processed++;
        }
      } catch (error) {
        queue.stats.failed++;
      } finally {
        queue.processing = false;
      }
    }, 100);
  }

  /**
   * Process queue message
   */
  async processQueueMessage(queue, message) {
    // This would be overridden with actual processing logic
    logger.debug(`Processing message from queue ${queue.name}: ${message.id}`);
    
    // Simulate processing
    await this.delay(Math.random() * 100);
    
    return true;
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(operation, timeout = null) {
    const timeoutDuration = timeout || this.config.timeoutDuration;
    
    return new Promise((resolve, reject) => {
      let timeoutId;
      let completed = false;
      
      // Setup timeout
      timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          this.metrics.timeouts++;
          
          this.emit('timeout:exceeded', {
            duration: timeoutDuration
          });
          
          reject(new Error(`Operation timed out after ${timeoutDuration}ms`));
        }
      }, timeoutDuration);
      
      // Execute operation
      Promise.resolve(operation())
        .then(result => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        })
        .catch(error => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            reject(error);
          }
        });
    });
  }

  /**
   * Handle timeout
   */
  handleTimeout(bulkhead, context) {
    this.metrics.timeouts++;
    
    this.emit('timeout:bulkhead', {
      bulkhead: bulkhead.name,
      context
    });
    
    logger.warn(`⏱️ Timeout in bulkhead ${bulkhead.name}`);
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // Every 30 seconds
  }

  /**
   * Check system health
   */
  checkSystemHealth() {
    // Check bulkheads
    for (const [name, bulkhead] of this.bulkheads) {
      const utilization = (bulkhead.currentConcurrent / bulkhead.maxConcurrent) * 100;
      
      if (utilization > 80) {
        logger.warn(`🟠️ Bulkhead ${name} at ${utilization.toFixed(1)}% capacity`);
      }
    }
    
    // Check circuit breakers
    for (const [name, breaker] of this.circuitBreakers) {
      if (breaker.state === CircuitState.OPEN) {
        logger.warn(`🟠️ Circuit breaker ${name} is open`);
      }
    }
    
    // Check dead letter queues
    for (const [name, dlq] of this.deadLetterQueues) {
      if (dlq.messages.length > dlq.maxSize * 0.8) {
        logger.warn(`🟠️ DLQ ${name} at ${(dlq.messages.length / dlq.maxSize * 100).toFixed(1)}% capacity`);
      }
    }
  }

  /**
   * Helper methods
   */
  
  fibonacci(n) {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get fault tolerance status
   */
  getStatus() {
    const bulkheadStats = {};
    for (const [name, bulkhead] of this.bulkheads) {
      bulkheadStats[name] = {
        utilization: (bulkhead.currentConcurrent / bulkhead.maxConcurrent * 100).toFixed(1) + '%',
        queued: bulkhead.queue.length,
        rejected: bulkhead.rejected,
        completed: bulkhead.completed
      };
    }
    
    const circuitStats = {};
    for (const [name, breaker] of this.circuitBreakers) {
      circuitStats[name] = {
        state: breaker.state,
        failures: breaker.failures,
        trips: breaker.stats.trips,
        recoveries: breaker.stats.recoveries
      };
    }
    
    const dlqStats = {};
    for (const [name, dlq] of this.deadLetterQueues) {
      dlqStats[name] = {
        messages: dlq.messages.length,
        capacity: (dlq.messages.length / dlq.maxSize * 100).toFixed(1) + '%',
        processed: dlq.stats.processed,
        failed: dlq.stats.failed
      };
    }
    
    return {
      bulkheads: bulkheadStats,
      circuitBreakers: circuitStats,
      deadLetterQueues: dlqStats,
      queues: this.queues.size,
      metrics: this.metrics
    };
  }
  
  /**
   * Shutdown fault tolerance
   */
  shutdown() {
    // Clear all intervals and timeouts
    logger.info('🔌 Fault Tolerance System shut down');
  }
}

module.exports = {
  FaultToleranceManager,
  ResiliencePattern,
  BulkheadType,
  CircuitState
};