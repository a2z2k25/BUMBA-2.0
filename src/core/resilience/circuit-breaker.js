/**
 * BUMBA Circuit Breaker
 * Prevents cascading failures by auto-disabling failing components
 * 
 * SOLVES: One failing component can bring down the entire system
 * RESULT: Automatic failure isolation with self-healing
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');
const { getFailureManager } = require('../failures/failure-manager');

/**
 * Circuit states
 */
const STATES = {
  CLOSED: 'CLOSED',      // Normal operation
  OPEN: 'OPEN',          // Circuit tripped, rejecting requests
  HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    
    this.name = name;
    this.state = STATES.CLOSED;
    this.options = {
      threshold: options.threshold || 5,           // Failures to open circuit
      timeout: options.timeout || 60000,           // Time before trying half-open
      resetTimeout: options.resetTimeout || 120000, // Time to fully reset
      volumeThreshold: options.volumeThreshold || 10, // Min requests for statistics
      errorThresholdPercentage: options.errorThresholdPercentage || 50,
      ...options
    };
    
    this.stats = {
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      totalRequests: 0,
      rejectedRequests: 0
    };
    
    this.stateChangeTime = Date.now();
    this.nextAttempt = null;
    this.halfOpenTests = 0;
    this.maxHalfOpenTests = 3;
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn, fallback = null) {
    // Check if circuit is open
    if (this.state === STATES.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        this.stats.rejectedRequests++;
        this.emit('rejected', { name: this.name, state: this.state });
        
        if (fallback) {
          logger.debug(`Circuit ${this.name} open, using fallback`);
          return await this.executeFallback(fallback);
        }
        
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }
    
    // Track request
    this.stats.totalRequests++;
    
    try {
      // Execute the function
      const result = await fn();
      
      // Record success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error);
      
      // Use fallback if available and circuit is now open
      if (this.state === STATES.OPEN && fallback) {
        return await this.executeFallback(fallback);
      }
      
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  onSuccess() {
    this.stats.successes++;
    this.stats.consecutiveSuccesses++;
    this.stats.consecutiveFailures = 0;
    this.stats.lastSuccessTime = Date.now();
    
    if (this.state === STATES.HALF_OPEN) {
      if (this.stats.consecutiveSuccesses >= this.maxHalfOpenTests) {
        this.transitionToClosed();
      }
    }
    
    this.emit('success', { 
      name: this.name, 
      state: this.state,
      consecutiveSuccesses: this.stats.consecutiveSuccesses 
    });
  }
  
  /**
   * Handle failed execution
   */
  onFailure(error) {
    this.stats.failures++;
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;
    this.stats.lastFailureTime = Date.now();
    
    // Report to failure manager
    const failureManager = getFailureManager();
    failureManager.handleFailure(error, `CircuitBreaker:${this.name}`, {
      state: this.state,
      stats: this.stats
    });
    
    // Check if we should open the circuit
    if (this.state === STATES.CLOSED) {
      if (this.shouldOpen()) {
        this.transitionToOpen();
      }
    } else if (this.state === STATES.HALF_OPEN) {
      // Single failure in half-open state reopens circuit
      this.transitionToOpen();
    }
    
    this.emit('failure', { 
      name: this.name, 
      state: this.state,
      error: error.message,
      consecutiveFailures: this.stats.consecutiveFailures 
    });
  }
  
  /**
   * Check if circuit should open
   */
  shouldOpen() {
    // Check consecutive failures
    if (this.stats.consecutiveFailures >= this.options.threshold) {
      return true;
    }
    
    // Check error percentage if we have enough volume
    if (this.stats.totalRequests >= this.options.volumeThreshold) {
      const errorPercentage = (this.stats.failures / this.stats.totalRequests) * 100;
      if (errorPercentage >= this.options.errorThresholdPercentage) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if we should attempt to reset
   */
  shouldAttemptReset() {
    const now = Date.now();
    const timeSinceStateChange = now - this.stateChangeTime;
    
    return timeSinceStateChange >= this.options.timeout;
  }
  
  /**
   * Transition to OPEN state
   */
  transitionToOpen() {
    this.state = STATES.OPEN;
    this.stateChangeTime = Date.now();
    this.nextAttempt = Date.now() + this.options.timeout;
    
    logger.warn(`Circuit breaker ${this.name} opened`, {
      failures: this.stats.failures,
      consecutiveFailures: this.stats.consecutiveFailures
    });
    
    this.emit('state-change', { 
      name: this.name, 
      from: this.state, 
      to: STATES.OPEN 
    });
  }
  
  /**
   * Transition to HALF_OPEN state
   */
  transitionToHalfOpen() {
    const previousState = this.state;
    this.state = STATES.HALF_OPEN;
    this.stateChangeTime = Date.now();
    this.halfOpenTests = 0;
    
    logger.info(`Circuit breaker ${this.name} half-open (testing recovery)`);
    
    this.emit('state-change', { 
      name: this.name, 
      from: previousState, 
      to: STATES.HALF_OPEN 
    });
  }
  
  /**
   * Transition to CLOSED state
   */
  transitionToClosed() {
    const previousState = this.state;
    this.state = STATES.CLOSED;
    this.stateChangeTime = Date.now();
    
    // Reset stats on successful recovery
    this.stats.consecutiveFailures = 0;
    this.halfOpenTests = 0;
    
    logger.info(`Circuit breaker ${this.name} closed (recovered)`, {
      successes: this.stats.successes,
      totalRequests: this.stats.totalRequests
    });
    
    this.emit('state-change', { 
      name: this.name, 
      from: previousState, 
      to: STATES.CLOSED 
    });
  }
  
  /**
   * Execute fallback function
   */
  async executeFallback(fallback) {
    try {
      if (typeof fallback === 'function') {
        return await fallback();
      }
      return fallback;
    } catch (fallbackError) {
      logger.error(`Fallback for ${this.name} also failed:`, fallbackError);
      throw fallbackError;
    }
  }
  
  /**
   * Get circuit status
   */
  getStatus() {
    const errorRate = this.stats.totalRequests > 0 ?
      (this.stats.failures / this.stats.totalRequests * 100).toFixed(2) : 0;
    
    return {
      name: this.name,
      state: this.state,
      stats: {
        ...this.stats,
        errorRate: `${errorRate}%`,
        uptime: Date.now() - this.stateChangeTime
      },
      nextAttempt: this.nextAttempt,
      healthy: this.state === STATES.CLOSED
    };
  }
  
  /**
   * Force reset the circuit
   */
  reset() {
    this.state = STATES.CLOSED;
    this.stats = {
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      totalRequests: 0,
      rejectedRequests: 0
    };
    this.stateChangeTime = Date.now();
    
    logger.info(`Circuit breaker ${this.name} manually reset`);
    this.emit('reset', { name: this.name });
  }
}

/**
 * Circuit Breaker Registry
 */
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
    this.globalOptions = {
      threshold: 5,
      timeout: 60000,
      errorThresholdPercentage: 50
    };
  }
  
  /**
   * Get or create circuit breaker
   */
  getBreaker(name, options = {}) {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(name, {
        ...this.globalOptions,
        ...options
      });
      
      this.breakers.set(name, breaker);
      
      // Set up monitoring
      breaker.on('state-change', (event) => {
        this.onStateChange(event);
      });
    }
    
    return this.breakers.get(name);
  }
  
  /**
   * Handle state changes
   */
  onStateChange(event) {
    const { name, to } = event;
    
    // Alert on circuit opening
    if (to === STATES.OPEN) {
      logger.error(`⚠️  Circuit ${name} is now OPEN - service disabled`);
      
      // Check for cascade risk
      const openCircuits = this.getOpenCircuits();
      if (openCircuits.length > 3) {
        logger.error(`🚨 ALERT: ${openCircuits.length} circuits open - cascade risk!`);
      }
    }
    
    // Log recovery
    if (to === STATES.CLOSED) {
      logger.info(`✅ Circuit ${name} recovered`);
    }
  }
  
  /**
   * Get all open circuits
   */
  getOpenCircuits() {
    return Array.from(this.breakers.values())
      .filter(breaker => breaker.state === STATES.OPEN)
      .map(breaker => breaker.name);
  }
  
  /**
   * Get all circuit statuses
   */
  getAllStatuses() {
    const statuses = {};
    
    this.breakers.forEach((breaker, name) => {
      statuses[name] = breaker.getStatus();
    });
    
    return statuses;
  }
  
  /**
   * Reset all circuits
   */
  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
    logger.info('All circuit breakers reset');
  }
  
  /**
   * Get health summary
   */
  getHealthSummary() {
    const statuses = this.getAllStatuses();
    const circuits = Object.values(statuses);
    
    return {
      total: circuits.length,
      healthy: circuits.filter(c => c.healthy).length,
      open: circuits.filter(c => c.state === STATES.OPEN).length,
      halfOpen: circuits.filter(c => c.state === STATES.HALF_OPEN).length,
      circuits: statuses
    };
  }
}

// Singleton registry
let registryInstance = null;

function getCircuitBreakerRegistry() {
  if (!registryInstance) {
    registryInstance = new CircuitBreakerRegistry();
  }
  return registryInstance;
}

/**
 * Create protected function with circuit breaker
 */
function protect(name, fn, options = {}) {
  const registry = getCircuitBreakerRegistry();
  const breaker = registry.getBreaker(name, options);
  
  return async function(...args) {
    return breaker.execute(async () => {
      return await fn.apply(this, args);
    }, options.fallback);
  };
}

module.exports = {
  CircuitBreaker,
  CircuitBreakerRegistry,
  getCircuitBreakerRegistry,
  protect,
  STATES
};