/**
 * BUMBA Circuit Breaker for MCP Resilience
 * Prevents cascading failures in distributed systems
 */

const { EventEmitter } = require('events');

class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = 0;
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      stateChanges: []
    };
  }

  async execute(fn, fallback = null) {
    this.stats.totalRequests++;
    
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        this.stats.rejectedRequests++;
        this.emit('rejected', {
          state: this.state,
          nextAttempt: this.nextAttempt
        });
        
        if (fallback) {
          return fallback();
        }
        
        throw new Error('Circuit breaker is OPEN');
      }
      
      // Try to recover
      this.state = 'HALF_OPEN';
      this.emit('state-change', { from: 'OPEN', to: 'HALF_OPEN' });
    }

    try {
      const result = await this.callWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      
      if (fallback) {
        return fallback();
      }
      
      throw error;
    }
  }

  async callWithTimeout(fn) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Circuit breaker timeout'));
      }, this.timeout);

      try {
        const result = await fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  onSuccess() {
    this.stats.successfulRequests++;
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.emit('state-change', { from: 'HALF_OPEN', to: 'CLOSED' });
      this.emit('recovered');
    }
    
    this.emit('success', { state: this.state });
  }

  onFailure(error) {
    this.stats.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    this.emit('failure', { 
      error, 
      failureCount: this.failureCount,
      state: this.state 
    });
    
    if (this.failureCount >= this.threshold) {
      this.tripCircuit();
    }
  }

  tripCircuit() {
    if (this.state !== 'OPEN') {
      const previousState = this.state;
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      
      this.stats.stateChanges.push({
        from: previousState,
        to: 'OPEN',
        timestamp: Date.now(),
        reason: `Failure threshold (${this.threshold}) exceeded`
      });
      
      this.emit('state-change', { 
        from: previousState, 
        to: 'OPEN',
        nextAttempt: this.nextAttempt
      });
      
      this.emit('open', {
        failures: this.failureCount,
        lastFailure: this.lastFailureTime
      });
    }
  }

  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = 0;
    
    this.emit('reset');
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold,
      nextAttempt: this.state === 'OPEN' ? this.nextAttempt : null
    };
  }

  getStats() {
    return {
      ...this.stats,
      currentState: this.state,
      failureRate: this.stats.totalRequests > 0 
        ? (this.stats.failedRequests / this.stats.totalRequests) * 100 
        : 0,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0
    };
  }

  updateSettings(settings) {
    if (settings.threshold !== undefined) {
      this.threshold = settings.threshold;
    }
    if (settings.timeout !== undefined) {
      this.timeout = settings.timeout;
    }
    if (settings.resetTimeout !== undefined) {
      this.resetTimeout = settings.resetTimeout;
    }
    
    this.emit('settings-updated', settings);
  }
}

/**
 * MCP Resilience System with Circuit Breakers
 */
class MCPResilienceSystem extends EventEmitter {
  constructor() {
    super();
    
    this.circuitBreakers = new Map();
    this.healthChecks = new Map();
    this.fallbacks = new Map();
    
    this.config = {
      defaultThreshold: 5,
      defaultTimeout: 60000,
      defaultResetTimeout: 30000,
      healthCheckInterval: 30000
    };
    
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      fallbackCalls: 0
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async executeWithCircuitBreaker(serverName, fn, options = {}) {
    this.stats.totalCalls++;
    
    // Get or create circuit breaker for this server
    if (!this.circuitBreakers.has(serverName)) {
      this.createCircuitBreaker(serverName, options);
    }
    
    const breaker = this.circuitBreakers.get(serverName);
    const fallback = this.fallbacks.get(serverName);
    
    try {
      const result = await breaker.execute(fn, fallback);
      this.stats.successfulCalls++;
      return result;
    } catch (error) {
      this.stats.failedCalls++;
      
      if (fallback && breaker.getState().state === 'OPEN') {
        this.stats.fallbackCalls++;
        return fallback();
      }
      
      throw error;
    }
  }

  /**
   * Create a circuit breaker for a server
   */
  createCircuitBreaker(serverName, options = {}) {
    const breaker = new CircuitBreaker({
      threshold: options.threshold || this.config.defaultThreshold,
      timeout: options.timeout || this.config.defaultTimeout,
      resetTimeout: options.resetTimeout || this.config.defaultResetTimeout
    });
    
    // Set up event forwarding
    breaker.on('state-change', (data) => {
      this.emit('breaker-state-change', {
        server: serverName,
        ...data
      });
    });
    
    breaker.on('open', (data) => {
      this.emit('breaker-open', {
        server: serverName,
        ...data
      });
    });
    
    breaker.on('recovered', () => {
      this.emit('breaker-recovered', {
        server: serverName
      });
    });
    
    this.circuitBreakers.set(serverName, breaker);
    
    return breaker;
  }

  /**
   * Register a fallback function for a server
   */
  registerFallback(serverName, fallbackFn) {
    this.fallbacks.set(serverName, fallbackFn);
  }

  /**
   * Register a health check for a server
   */
  registerHealthCheck(serverName, checkFn, interval = null) {
    const healthCheck = {
      fn: checkFn,
      interval: interval || this.config.healthCheckInterval,
      lastCheck: null,
      lastResult: null,
      timer: null
    };
    
    // Start health check
    healthCheck.timer = setInterval(async () => {
      try {
        healthCheck.lastResult = await checkFn();
        healthCheck.lastCheck = Date.now();
        
        this.emit('health-check', {
          server: serverName,
          healthy: healthCheck.lastResult,
          timestamp: healthCheck.lastCheck
        });
        
        // Reset circuit breaker if healthy
        if (healthCheck.lastResult && this.circuitBreakers.has(serverName)) {
          const breaker = this.circuitBreakers.get(serverName);
          if (breaker.getState().state === 'OPEN') {
            breaker.reset();
          }
        }
      } catch (error) {
        healthCheck.lastResult = false;
        healthCheck.lastCheck = Date.now();
        
        this.emit('health-check-failed', {
          server: serverName,
          error: error.message,
          timestamp: healthCheck.lastCheck
        });
      }
    }, healthCheck.interval);
    
    this.healthChecks.set(serverName, healthCheck);
  }

  /**
   * Get circuit breaker for a server
   */
  getCircuitBreaker(serverName) {
    return this.circuitBreakers.get(serverName);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates() {
    const states = {};
    
    for (const [server, breaker] of this.circuitBreakers) {
      states[server] = breaker.getState();
    }
    
    return states;
  }

  /**
   * Get resilience statistics
   */
  getStats() {
    const serverStats = {};
    
    for (const [server, breaker] of this.circuitBreakers) {
      serverStats[server] = breaker.getStats();
    }
    
    return {
      global: this.stats,
      servers: serverStats,
      healthChecks: this.getHealthCheckStatus()
    };
  }

  /**
   * Get health check status
   */
  getHealthCheckStatus() {
    const status = {};
    
    for (const [server, check] of this.healthChecks) {
      status[server] = {
        lastCheck: check.lastCheck,
        healthy: check.lastResult,
        interval: check.interval
      };
    }
    
    return status;
  }

  /**
   * Reset a specific circuit breaker
   */
  resetCircuitBreaker(serverName) {
    const breaker = this.circuitBreakers.get(serverName);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Stop all health checks
   */
  stopHealthChecks() {
    for (const check of this.healthChecks.values()) {
      if (check.timer) {
        clearInterval(check.timer);
      }
    }
    this.healthChecks.clear();
  }

  /**
   * Shutdown the resilience system
   */
  shutdown() {
    this.stopHealthChecks();
    this.circuitBreakers.clear();
    this.fallbacks.clear();
    this.removeAllListeners();
  }
}

// Export both classes
module.exports = {
  CircuitBreaker,
  MCPResilienceSystem,
  
  // Singleton instance of resilience system
  getInstance() {
    if (!global.mcpResilienceSystem) {
      global.mcpResilienceSystem = new MCPResilienceSystem();
    }
    return global.mcpResilienceSystem;
  }
};