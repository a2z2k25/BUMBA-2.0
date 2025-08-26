/**
 * BUMBA Resilience System - Main Export
 * Comprehensive resilience system with circuit breakers, fallback strategies,
 * health checks, retry logic, bulkhead pattern, timeout management,
 * graceful degradation, and self-healing capabilities
 * 
 * Enhanced with advanced load balancing, retry mechanisms, and auto-healing
 */

const { 
  EnhancedCircuitBreaker, 
  RetryManager, 
  BulkheadManager, 
  HealthCheckManager 
} = require('./resilient-agent-system');

const { 
  ResilienceOrchestrator,
  TimeoutManager,
  GracefulDegradationManager,
  SelfHealingManager
} = require('./resilience-orchestrator');

const { 
  BumbaResilienceManager,
  getResilienceManager
} = require('./bumba-resilience-integration');

// New advanced resilience components
const { 
  AdvancedLoadBalancer, 
  LoadBalancingAlgorithm 
} = require('./advanced-load-balancer');

const { 
  AdvancedRetryMechanism, 
  RetryStrategy, 
  RetryPolicy 
} = require('./retry-mechanism');

const { 
  AutoHealingSystem, 
  HealingStrategy, 
  HealthState 
} = require('./auto-healing-system');

/**
 * Main Resilience System Factory
 * Provides easy access to all resilience components
 */
class ResilienceSystemFactory {
  /**
   * Create a new circuit breaker
   */
  static createCircuitBreaker(name, options = {}) {
    return new EnhancedCircuitBreaker(name, options);
  }

  /**
   * Create a new retry manager
   */
  static createRetryManager(options = {}) {
    return new RetryManager(options);
  }

  /**
   * Create a new bulkhead manager
   */
  static createBulkheadManager() {
    return new BulkheadManager();
  }

  /**
   * Create a new health check manager
   */
  static createHealthCheckManager() {
    return new HealthCheckManager();
  }

  /**
   * Create a new timeout manager
   */
  static createTimeoutManager() {
    return new TimeoutManager();
  }

  /**
   * Create a new graceful degradation manager
   */
  static createGracefulDegradationManager() {
    return new GracefulDegradationManager();
  }

  /**
   * Create a new self-healing manager
   */
  static createSelfHealingManager() {
    return new SelfHealingManager();
  }

  /**
   * Create a new resilience orchestrator
   */
  static createResilienceOrchestrator(options = {}) {
    return new ResilienceOrchestrator(options);
  }

  /**
   * Create a new BUMBA resilience manager
   */
  static createBumbaResilienceManager(options = {}) {
    return new BumbaResilienceManager(options);
  }

  /**
   * Get the singleton BUMBA resilience manager
   */
  static getBumbaResilienceManager(options = {}) {
    return getResilienceManager(options);
  }
}

/**
 * Quick Setup Functions for Common Patterns
 */
class ResiliencePatterns {
  /**
   * Setup a basic circuit breaker pattern
   */
  static setupBasicCircuitBreaker(operationName, operation, options = {}) {
    const breaker = new EnhancedCircuitBreaker(operationName, {
      failureThreshold: 5,
      timeout: 30000,
      resetTimeout: 60000,
      ...options
    });

    return async (context = {}) => {
      return breaker.execute(operation, options.fallback, context);
    };
  }

  /**
   * Setup retry with exponential backoff
   */
  static setupRetryPattern(operation, options = {}) {
    const retryManager = new RetryManager({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      ...options
    });

    return async (context = {}) => {
      return retryManager.executeWithRetry(operation, context);
    };
  }

  /**
   * Setup bulkhead isolation
   */
  static setupBulkheadPattern(bulkheadName, operation, options = {}) {
    const bulkheadManager = new BulkheadManager();
    bulkheadManager.createBulkhead(bulkheadName, {
      maxConcurrency: 10,
      maxQueueSize: 50,
      timeout: 30000,
      ...options
    });

    return async (context = {}) => {
      return bulkheadManager.executeInBulkhead(bulkheadName, operation, context);
    };
  }

  /**
   * Setup timeout pattern
   */
  static setupTimeoutPattern(operation, timeout = 30000) {
    const timeoutManager = new TimeoutManager();

    return async (context = {}) => {
      return timeoutManager.executeWithTimeout(operation, timeout, context);
    };
  }

  /**
   * Setup complete resilience pattern (all patterns combined)
   */
  static setupCompleteResilience(operationName, operation, options = {}) {
    const orchestrator = new ResilienceOrchestrator(options.orchestrator);

    return async (context = {}) => {
      return orchestrator.executeResilientOperation(operationName, operation, {
        circuitBreaker: true,
        retry: true,
        bulkhead: options.bulkhead || { name: 'default' },
        timeout: options.timeout || 30000,
        fallback: options.fallback,
        consciousnessValidation: options.consciousnessValidation !== false,
        ...options.resilience
      });
    };
  }

  /**
   * Setup BUMBA agent resilience
   */
  static setupAgentResilience(agentName, operation, options = {}) {
    const resilienceManager = getResilienceManager();

    return async (context = {}) => {
      return resilienceManager.executeAgentOperation(agentName, operation, options);
    };
  }

  /**
   * Setup BUMBA hook resilience
   */
  static setupHookResilience(hookName, operation, options = {}) {
    const resilienceManager = getResilienceManager();

    return async (context = {}) => {
      return resilienceManager.executeHookOperation(hookName, operation, options);
    };
  }
}

/**
 * Resilience Decorators for Easy Integration
 */
class ResilienceDecorators {
  /**
   * Circuit breaker decorator
   */
  static circuitBreaker(options = {}) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      const breakerName = options.name || `${target.constructor.name}_${propertyKey}`;
      const breaker = new EnhancedCircuitBreaker(breakerName, options);

      descriptor.value = async function(...args) {
        return breaker.execute(() => originalMethod.apply(this, args), options.fallback);
      };

      return descriptor;
    };
  }

  /**
   * Retry decorator
   */
  static retry(options = {}) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      const retryManager = new RetryManager(options);

      descriptor.value = async function(...args) {
        return retryManager.executeWithRetry(() => originalMethod.apply(this, args));
      };

      return descriptor;
    };
  }

  /**
   * Timeout decorator
   */
  static timeout(timeoutMs = 30000) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      const timeoutManager = new TimeoutManager();

      descriptor.value = async function(...args) {
        return timeoutManager.executeWithTimeout(() => originalMethod.apply(this, args), timeoutMs);
      };

      return descriptor;
    };
  }

  /**
   * Complete resilience decorator
   */
  static resilient(options = {}) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      const operationName = options.name || `${target.constructor.name}_${propertyKey}`;
      const orchestrator = new ResilienceOrchestrator(options.orchestrator);

      descriptor.value = async function(...args) {
        return orchestrator.executeResilientOperation(operationName, () => originalMethod.apply(this, args),
          options
        );
      };

      return descriptor;
    };
  }
}

/**
 * Utility Functions
 */
const ResilienceUtils = {
  /**
   * Create a simple health check function
   */
  createHealthCheck: (name, checkFn, options = {}) => {
    const healthManager = new HealthCheckManager();
    return healthManager.registerHealthCheck(name, checkFn, options);
  },

  /**
   * Create a simple fallback function
   */
  createFallback: (fallbackValue) => {
    return async () => {
      if (typeof fallbackValue === 'function') {
        return fallbackValue();
      }
      return fallbackValue;
    };
  },

  /**
   * Create a consciousness-aware operation wrapper
   */
  createConsciousOperation: (operation) => {
    return async (context = {}) => {
      const resilienceManager = getResilienceManager();
      const validation = await resilienceManager.validateOperationConsciousness(operation, context);
      
      if (!validation.valid) {
        throw new Error(`Operation failed consciousness validation: score ${validation.score}`);
      }
      
      return operation(context);
    };
  },

  /**
   * Create a monitoring wrapper
   */
  createMonitoredOperation: (operationName, operation) => {
    return async (context = {}) => {
      const startTime = Date.now();
      
      try {
        const result = await operation(context);
        const duration = Date.now() - startTime;
        
        console.log(`🏁 ${operationName} completed in ${duration}ms`);
        return result;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`🔴 ${operationName} failed after ${duration}ms:`, error.message);
        throw error;
      }
    };
  }
};

// Export everything
module.exports = {
  // Core classes
  EnhancedCircuitBreaker,
  RetryManager,
  BulkheadManager,
  HealthCheckManager,
  TimeoutManager,
  GracefulDegradationManager,
  SelfHealingManager,
  ResilienceOrchestrator,
  BumbaResilienceManager,
  
  // Advanced resilience components
  AdvancedLoadBalancer,
  LoadBalancingAlgorithm,
  AdvancedRetryMechanism,
  RetryStrategy,
  RetryPolicy,
  AutoHealingSystem,
  HealingStrategy,
  HealthState,

  // Factory and patterns
  ResilienceSystemFactory,
  ResiliencePatterns,
  ResilienceDecorators,
  ResilienceUtils,

  // Convenience functions
  getResilienceManager,
  
  // Default exports for common use cases
  createCircuitBreaker: ResilienceSystemFactory.createCircuitBreaker,
  createRetryManager: ResilienceSystemFactory.createRetryManager,
  setupBasicCircuitBreaker: ResiliencePatterns.setupBasicCircuitBreaker,
  setupRetryPattern: ResiliencePatterns.setupRetryPattern,
  setupCompleteResilience: ResiliencePatterns.setupCompleteResilience,
  setupAgentResilience: ResiliencePatterns.setupAgentResilience,
  setupHookResilience: ResiliencePatterns.setupHookResilience,
  
  // New advanced patterns
  createAdvancedLoadBalancer: () => new AdvancedLoadBalancer(),
  createAdvancedRetryMechanism: () => new AdvancedRetryMechanism(),
  createAutoHealingSystem: () => new AutoHealingSystem()
};