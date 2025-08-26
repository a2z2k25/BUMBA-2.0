/**
 * BUMBA Production Mode - Sprint 2: Load Balancing & Traffic Management
 * 
 * Dynamic load balancing with intelligent traffic distribution,
 * health monitoring, and circuit breaker patterns
 */

const EventEmitter = require('events');

/**
 * Load balancing strategies
 */
const LoadBalancingStrategy = {
  ROUND_ROBIN: 'ROUND_ROBIN',
  WEIGHTED_ROUND_ROBIN: 'WEIGHTED_ROUND_ROBIN',
  LEAST_CONNECTIONS: 'LEAST_CONNECTIONS',
  LEAST_RESPONSE_TIME: 'LEAST_RESPONSE_TIME',
  CONSISTENT_HASH: 'CONSISTENT_HASH',
  INTELLIGENT: 'INTELLIGENT'
};

/**
 * Service health states
 */
const HealthState = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Circuit breaker states
 */
const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Circuit is open (failing)
  HALF_OPEN: 'HALF_OPEN'  // Testing if service recovered
};

/**
 * Health Monitor - Monitors service health and availability
 */
class ServiceHealthMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      checkInterval: config.checkInterval || 10000, // 10 seconds
      timeout: config.timeout || 5000, // 5 seconds
      retries: config.retries || 3,
      healthyThreshold: config.healthyThreshold || 2,
      unhealthyThreshold: config.unhealthyThreshold || 3,
      degradedResponseTime: config.degradedResponseTime || 2000 // 2 seconds
    };
    
    this.services = new Map();
    this.healthChecks = new Map();
    this.metrics = new Map();
    
    this.monitoringInterval = null;
    this.startMonitoring();
  }
  
  /**
   * Register a service for health monitoring
   */
  registerService(serviceId, config) {
    const service = {
      id: serviceId,
      endpoint: config.endpoint || config.url,
      healthEndpoint: config.healthEndpoint || `${config.endpoint}/health`,
      weight: config.weight || 1,
      maxConnections: config.maxConnections || 100,
      responseTimeThreshold: config.responseTimeThreshold || 2000,
      
      // Current state
      state: HealthState.UNKNOWN,
      currentConnections: 0,
      responseTime: 0,
      lastCheck: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      
      // Metrics
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0
    };
    
    this.services.set(serviceId, service);
    this.metrics.set(serviceId, {
      healthChecks: 0,
      uptime: Date.now(),
      downtimeEvents: [],
      responseTimeHistory: [],
      errorHistory: []
    });
    
    console.log(`🟢 Health Monitor: Registered service ${serviceId}`);
    this.emit('service:registered', { serviceId, service });
  }
  
  /**
   * Unregister a service
   */
  unregisterService(serviceId) {
    this.services.delete(serviceId);
    this.metrics.delete(serviceId);
    
    console.log(`🟢 Health Monitor: Unregistered service ${serviceId}`);
    this.emit('service:unregistered', { serviceId });
  }
  
  /**
   * Start health monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.checkInterval);
    
    console.log('🟢 Health Monitor: Started monitoring');
  }
  
  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('🟢 Health Monitor: Stopped monitoring');
  }
  
  /**
   * Perform health checks on all services
   */
  async performHealthChecks() {
    const promises = [];
    
    for (const [serviceId, service] of this.services) {
      promises.push(this.checkServiceHealth(serviceId, service));
    }
    
    await Promise.allSettled(promises);
  }
  
  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceId, service) {
    const startTime = Date.now();
    const metrics = this.metrics.get(serviceId);
    
    try {
      metrics.healthChecks++;
      
      // Simulate health check (in production, would make actual HTTP request)
      const isHealthy = await this.simulateHealthCheck(service);
      const responseTime = Date.now() - startTime;
      
      // Update service state
      service.lastCheck = Date.now();
      service.responseTime = responseTime;
      
      // Record response time
      metrics.responseTimeHistory.push({
        time: responseTime,
        timestamp: Date.now()
      });
      
      // Keep only last 50 response times
      if (metrics.responseTimeHistory.length > 50) {
        metrics.responseTimeHistory.shift();
      }
      
      if (isHealthy) {
        service.consecutiveFailures = 0;
        service.consecutiveSuccesses++;
        
        // Determine state based on response time
        let newState;
        if (responseTime > this.config.degradedResponseTime) {
          newState = HealthState.DEGRADED;
        } else {
          newState = HealthState.HEALTHY;
        }
        
        this.updateServiceState(serviceId, service, newState);
        
      } else {
        service.consecutiveSuccesses = 0;
        service.consecutiveFailures++;
        
        // Record error
        metrics.errorHistory.push({
          error: 'Health check failed',
          timestamp: Date.now()
        });
        
        if (service.consecutiveFailures >= this.config.unhealthyThreshold) {
          this.updateServiceState(serviceId, service, HealthState.UNHEALTHY);
        }
      }
      
    } catch (error) {
      service.consecutiveSuccesses = 0;
      service.consecutiveFailures++;
      
      metrics.errorHistory.push({
        error: error.message,
        timestamp: Date.now()
      });
      
      if (service.consecutiveFailures >= this.config.unhealthyThreshold) {
        this.updateServiceState(serviceId, service, HealthState.UNHEALTHY);
      }
    }
  }
  
  /**
   * Simulate health check (replace with actual HTTP request in production)
   */
  async simulateHealthCheck(service) {
    // Simulate variable health status
    const random = Math.random();
    
    // 95% healthy, 5% unhealthy
    if (random < 0.95) {
      // Simulate response time variation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return true;
    } else {
      throw new Error('Service unhealthy');
    }
  }
  
  /**
   * Update service state
   */
  updateServiceState(serviceId, service, newState) {
    const oldState = service.state;
    if (oldState !== newState) {
      service.state = newState;
      
      const metrics = this.metrics.get(serviceId);
      
      // Record state change
      if (newState === HealthState.UNHEALTHY) {
        metrics.downtimeEvents.push({
          start: Date.now(),
          previousState: oldState
        });
      } else if (oldState === HealthState.UNHEALTHY) {
        // Service recovered
        const lastDowntime = metrics.downtimeEvents[metrics.downtimeEvents.length - 1];
        if (lastDowntime && !lastDowntime.end) {
          lastDowntime.end = Date.now();
          lastDowntime.duration = lastDowntime.end - lastDowntime.start;
        }
      }
      
      console.log(`🟢 Service ${serviceId}: ${oldState} → ${newState}`);
      this.emit('service:stateChanged', {
        serviceId,
        oldState,
        newState,
        service
      });
    }
  }
  
  /**
   * Get healthy services
   */
  getHealthyServices() {
    const healthy = [];
    for (const [serviceId, service] of this.services) {
      if (service.state === HealthState.HEALTHY || service.state === HealthState.DEGRADED) {
        healthy.push({ serviceId, service });
      }
    }
    return healthy;
  }
  
  /**
   * Get service by ID
   */
  getService(serviceId) {
    return this.services.get(serviceId);
  }
  
  /**
   * Get all services
   */
  getAllServices() {
    return Array.from(this.services.entries()).map(([id, service]) => ({ id, service }));
  }
  
  /**
   * Get health statistics
   */
  getHealthStats() {
    const stats = {
      totalServices: this.services.size,
      healthyServices: 0,
      degradedServices: 0,
      unhealthyServices: 0,
      unknownServices: 0,
      totalHealthChecks: 0,
      avgResponseTime: 0
    };
    
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    for (const [serviceId, service] of this.services) {
      const metrics = this.metrics.get(serviceId);
      stats.totalHealthChecks += metrics.healthChecks;
      
      switch (service.state) {
        case HealthState.HEALTHY:
          stats.healthyServices++;
          break;
        case HealthState.DEGRADED:
          stats.degradedServices++;
          break;
        case HealthState.UNHEALTHY:
          stats.unhealthyServices++;
          break;
        default:
          stats.unknownServices++;
      }
      
      if (service.responseTime > 0) {
        totalResponseTime += service.responseTime;
        responseTimeCount++;
      }
    }
    
    stats.avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    stats.healthRate = stats.totalServices > 0 ? stats.healthyServices / stats.totalServices : 0;
    
    return stats;
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.stopMonitoring();
    this.services.clear();
    this.metrics.clear();
    this.removeAllListeners();
  }
}

/**
 * Circuit Breaker - Implements circuit breaker pattern for fault tolerance
 */
class CircuitBreaker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 10000, // 10 seconds
      halfOpenMaxCalls: config.halfOpenMaxCalls || 3
    };
    
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      circuitOpened: 0,
      circuitClosed: 0,
      rejectedCalls: 0
    };
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn) {
    this.metrics.totalCalls++;
    
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCalls = 0;
        console.log('🔄 Circuit breaker: OPEN → HALF_OPEN');
        this.emit('stateChanged', { state: this.state });
      } else {
        this.metrics.rejectedCalls++;
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.halfOpenCalls > this.config.halfOpenMaxCalls) {
        this.metrics.rejectedCalls++;
        throw new Error('Circuit breaker HALF_OPEN call limit exceeded');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  onSuccess() {
    this.metrics.successfulCalls++;
    this.successes++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.halfOpenMaxCalls) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.metrics.circuitClosed++;
        
        console.log('🏁 Circuit breaker: HALF_OPEN → CLOSED');
        this.emit('stateChanged', { state: this.state });
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }
  
  /**
   * Handle failed execution
   */
  onFailure() {
    this.metrics.failedCalls++;
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.metrics.circuitOpened++;
      
      console.log('🔴 Circuit breaker: HALF_OPEN → OPEN');
      this.emit('stateChanged', { state: this.state });
    } else if (this.state === CircuitState.CLOSED && 
               this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.metrics.circuitOpened++;
      
      console.log(`🔴 Circuit breaker: CLOSED → OPEN (${this.failures} failures)`);
      this.emit('stateChanged', { state: this.state });
    }
  }
  
  /**
   * Get circuit breaker state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      ...this.metrics
    };
  }
  
  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    
    console.log('🔄 Circuit breaker reset');
    this.emit('stateChanged', { state: this.state });
  }
}

/**
 * Production Load Balancer - Intelligent traffic distribution
 */
class ProductionLoadBalancer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      strategy: config.strategy || LoadBalancingStrategy.INTELLIGENT,
      healthMonitoring: config.healthMonitoring !== false,
      circuitBreaker: config.circuitBreaker !== false,
      
      // Rate limiting
      rateLimit: config.rateLimit || 1000, // requests per minute
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
      
      // Connection management
      maxConnectionsPerService: config.maxConnectionsPerService || 100,
      connectionTimeout: config.connectionTimeout || 30000, // 30 seconds
      
      // Retry logic
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      
      // Analytics
      enableAnalytics: config.enableAnalytics !== false,
      
      // Consistent hashing (for sticky sessions)
      hashRing: config.hashRing || false,
      virtualNodes: config.virtualNodes || 150
    };
    
    // Core components
    this.healthMonitor = new ServiceHealthMonitor({
      checkInterval: 10000,
      timeout: 5000
    });
    
    this.circuitBreakers = new Map();
    
    // Load balancing state
    this.services = new Map();
    this.roundRobinIndex = 0;
    this.connections = new Map(); // Track active connections per service
    
    // Rate limiting
    this.rateLimitWindows = new Map();
    
    // Analytics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      rateLimitedRequests: 0,
      avgResponseTime: 0,
      startTime: Date.now()
    };
    
    // Consistent hashing ring (if enabled)
    this.hashRing = this.config.hashRing ? new Map() : null;
    
    this.setupEventHandlers();
    this.startAnalytics();
    
    console.log('🟡️ Production Load Balancer initialized');
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Health monitor events
    this.healthMonitor.on('service:stateChanged', (event) => {
      this.handleServiceStateChange(event);
    });
    
    // Circuit breaker events
    this.on('circuitBreaker:stateChanged', (event) => {
      console.log(`🔄 Circuit breaker for ${event.serviceId}: ${event.state}`);
    });
  }
  
  /**
   * Register a service with the load balancer
   */
  registerService(serviceId, config) {
    const service = {
      id: serviceId,
      endpoint: config.endpoint,
      weight: config.weight || 1,
      maxConnections: config.maxConnections || this.config.maxConnectionsPerService,
      priority: config.priority || 1,
      tags: config.tags || [],
      
      // Metrics
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      currentConnections: 0
    };
    
    this.services.set(serviceId, service);
    this.connections.set(serviceId, 0);
    
    // Register with health monitor
    if (this.config.healthMonitoring) {
      this.healthMonitor.registerService(serviceId, config);
    }
    
    // Create circuit breaker
    if (this.config.circuitBreaker) {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000
      });
      
      circuitBreaker.on('stateChanged', (event) => {
        this.emit('circuitBreaker:stateChanged', { serviceId, ...event });
      });
      
      this.circuitBreakers.set(serviceId, circuitBreaker);
    }
    
    // Update hash ring
    if (this.hashRing) {
      this.updateHashRing();
    }
    
    console.log(`🟡️ Load Balancer: Registered service ${serviceId}`);
    this.emit('service:registered', { serviceId, service });
  }
  
  /**
   * Unregister a service
   */
  unregisterService(serviceId) {
    this.services.delete(serviceId);
    this.connections.delete(serviceId);
    
    if (this.config.healthMonitoring) {
      this.healthMonitor.unregisterService(serviceId);
    }
    
    if (this.config.circuitBreaker) {
      this.circuitBreakers.delete(serviceId);
    }
    
    if (this.hashRing) {
      this.updateHashRing();
    }
    
    console.log(`🟡️ Load Balancer: Unregistered service ${serviceId}`);
    this.emit('service:unregistered', { serviceId });
  }
  
  /**
   * Route request to best available service
   */
  async routeRequest(request) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Rate limiting check
      if (!this.checkRateLimit(request)) {
        this.metrics.rateLimitedRequests++;
        throw new Error('Rate limit exceeded');
      }
      
      // Select target service
      const serviceId = await this.selectService(request);
      if (!serviceId) {
        throw new Error('No healthy services available');
      }
      
      const service = this.services.get(serviceId);
      
      // Execute request with retries and circuit breaker
      const result = await this.executeWithRetries(serviceId, request);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateServiceMetrics(serviceId, true, responseTime);
      this.updateGlobalMetrics(true, responseTime);
      
      this.emit('request:success', {
        serviceId,
        responseTime,
        request: request.id || 'unknown'
      });
      
      return {
        success: true,
        result,
        serviceId,
        responseTime,
        retries: 0
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateGlobalMetrics(false, responseTime);
      
      this.emit('request:failed', {
        error: error.message,
        responseTime,
        request: request.id || 'unknown'
      });
      
      throw error;
    }
  }
  
  /**
   * Select best service based on strategy
   */
  async selectService(request) {
    const availableServices = this.getAvailableServices();
    
    if (availableServices.length === 0) {
      return null;
    }
    
    switch (this.config.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(availableServices);
        
      case LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(availableServices);
        
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(availableServices);
        
      case LoadBalancingStrategy.LEAST_RESPONSE_TIME:
        return this.selectLeastResponseTime(availableServices);
        
      case LoadBalancingStrategy.CONSISTENT_HASH:
        return this.selectConsistentHash(availableServices, request);
        
      case LoadBalancingStrategy.INTELLIGENT:
        return this.selectIntelligent(availableServices, request);
        
      default:
        return this.selectRoundRobin(availableServices);
    }
  }
  
  /**
   * Get available (healthy) services
   */
  getAvailableServices() {
    const available = [];
    
    for (const [serviceId, service] of this.services) {
      // Check health status
      let isHealthy = true;
      if (this.config.healthMonitoring) {
        const healthService = this.healthMonitor.getService(serviceId);
        isHealthy = healthService && 
          (healthService.state === HealthState.HEALTHY || 
           healthService.state === HealthState.DEGRADED);
      }
      
      // Check circuit breaker
      let circuitOpen = false;
      if (this.config.circuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(serviceId);
        circuitOpen = circuitBreaker && circuitBreaker.getState() === CircuitState.OPEN;
      }
      
      // Check connection limits
      const currentConnections = this.connections.get(serviceId) || 0;
      const connectionLimitReached = currentConnections >= service.maxConnections;
      
      if (isHealthy && !circuitOpen && !connectionLimitReached) {
        available.push(serviceId);
      }
    }
    
    return available;
  }
  
  /**
   * Round robin selection
   */
  selectRoundRobin(availableServices) {
    if (availableServices.length === 0) return null;
    
    const selected = availableServices[this.roundRobinIndex % availableServices.length];
    this.roundRobinIndex++;
    
    return selected;
  }
  
  /**
   * Weighted round robin selection
   */
  selectWeightedRoundRobin(availableServices) {
    if (availableServices.length === 0) return null;
    
    // Calculate total weight
    let totalWeight = 0;
    const weightedServices = [];
    
    for (const serviceId of availableServices) {
      const service = this.services.get(serviceId);
      totalWeight += service.weight;
      
      // Add service multiple times based on weight
      for (let i = 0; i < service.weight; i++) {
        weightedServices.push(serviceId);
      }
    }
    
    if (weightedServices.length === 0) return availableServices[0];
    
    const selected = weightedServices[this.roundRobinIndex % weightedServices.length];
    this.roundRobinIndex++;
    
    return selected;
  }
  
  /**
   * Least connections selection
   */
  selectLeastConnections(availableServices) {
    if (availableServices.length === 0) return null;
    
    let leastConnections = Infinity;
    let selectedService = null;
    
    for (const serviceId of availableServices) {
      const connections = this.connections.get(serviceId) || 0;
      if (connections < leastConnections) {
        leastConnections = connections;
        selectedService = serviceId;
      }
    }
    
    return selectedService;
  }
  
  /**
   * Least response time selection
   */
  selectLeastResponseTime(availableServices) {
    if (availableServices.length === 0) return null;
    
    let leastResponseTime = Infinity;
    let selectedService = null;
    
    for (const serviceId of availableServices) {
      const service = this.services.get(serviceId);
      if (service.avgResponseTime < leastResponseTime) {
        leastResponseTime = service.avgResponseTime;
        selectedService = serviceId;
      }
    }
    
    return selectedService || availableServices[0];
  }
  
  /**
   * Consistent hash selection (for sticky sessions)
   */
  selectConsistentHash(availableServices, request) {
    if (availableServices.length === 0) return null;
    if (!this.hashRing) return this.selectRoundRobin(availableServices);
    
    const key = request.sessionId || request.userId || request.id || 'default';
    const hash = this.hash(key);
    
    // Find the next service in the ring
    const sortedHashes = Array.from(this.hashRing.keys()).sort((a, b) => a - b);
    
    for (const ringHash of sortedHashes) {
      if (hash <= ringHash) {
        const serviceId = this.hashRing.get(ringHash);
        if (availableServices.includes(serviceId)) {
          return serviceId;
        }
      }
    }
    
    // Wrap around to first service
    const firstHash = sortedHashes[0];
    const firstService = this.hashRing.get(firstHash);
    return availableServices.includes(firstService) ? firstService : availableServices[0];
  }
  
  /**
   * Intelligent selection (combines multiple factors)
   */
  selectIntelligent(availableServices, request) {
    if (availableServices.length === 0) return null;
    if (availableServices.length === 1) return availableServices[0];
    
    let bestScore = -1;
    let selectedService = null;
    
    for (const serviceId of availableServices) {
      const service = this.services.get(serviceId);
      const connections = this.connections.get(serviceId) || 0;
      
      // Calculate composite score
      let score = 0;
      
      // Weight factor (higher weight = higher score)
      score += (service.weight / 10) * 0.3;
      
      // Connection factor (fewer connections = higher score)
      const connectionRatio = connections / service.maxConnections;
      score += (1 - connectionRatio) * 0.3;
      
      // Response time factor (faster = higher score)
      const responseTimeScore = service.avgResponseTime > 0 ? 
        Math.max(0, 1 - (service.avgResponseTime / 5000)) : 1; // Normalize to 5 seconds
      score += responseTimeScore * 0.2;
      
      // Success rate factor
      const successRate = service.totalRequests > 0 ? 
        service.successfulRequests / service.totalRequests : 1;
      score += successRate * 0.2;
      
      if (score > bestScore) {
        bestScore = score;
        selectedService = serviceId;
      }
    }
    
    return selectedService;
  }
  
  /**
   * Execute request with retries and circuit breaker protection
   */
  async executeWithRetries(serviceId, request, retryCount = 0) {
    const service = this.services.get(serviceId);
    
    try {
      // Increment connection count
      this.connections.set(serviceId, (this.connections.get(serviceId) || 0) + 1);
      
      // Execute with circuit breaker if enabled
      let result;
      if (this.config.circuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(serviceId);
        result = await circuitBreaker.execute(() => this.executeRequest(service, request));
      } else {
        result = await this.executeRequest(service, request);
      }
      
      return result;
      
    } catch (error) {
      // Update service metrics
      this.updateServiceMetrics(serviceId, false, 0);
      
      // Retry logic
      if (retryCount < this.config.maxRetries) {
        this.metrics.retriedRequests++;
        
        console.log(`🔄 Retry ${retryCount + 1}/${this.config.maxRetries} for service ${serviceId}`);
        
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * (retryCount + 1))
        );
        
        // Try different service if available
        const alternativeServices = this.getAvailableServices()
          .filter(id => id !== serviceId);
        
        if (alternativeServices.length > 0) {
          const alternativeService = this.selectService(request);
          if (alternativeService && alternativeService !== serviceId) {
            return this.executeWithRetries(alternativeService, request, retryCount + 1);
          }
        }
        
        // Retry same service
        return this.executeWithRetries(serviceId, request, retryCount + 1);
      }
      
      throw error;
      
    } finally {
      // Decrement connection count
      this.connections.set(serviceId, Math.max(0, (this.connections.get(serviceId) || 0) - 1));
    }
  }
  
  /**
   * Execute request to service (simulated)
   */
  async executeRequest(service, request) {
    // Simulate request execution
    const responseTime = Math.random() * 1000; // 0-1000ms
    await new Promise(resolve => setTimeout(resolve, responseTime));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Service request failed');
    }
    
    return {
      success: true,
      data: `Response from ${service.id}`,
      timestamp: Date.now()
    };
  }
  
  /**
   * Check rate limiting
   */
  checkRateLimit(request) {
    const key = request.clientId || request.ip || 'global';
    const now = Date.now();
    const window = this.rateLimitWindows.get(key);
    
    if (!window) {
      this.rateLimitWindows.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }
    
    if (now > window.resetTime) {
      // Reset window
      window.count = 1;
      window.resetTime = now + this.config.rateLimitWindow;
      return true;
    }
    
    if (window.count >= this.config.rateLimit) {
      return false;
    }
    
    window.count++;
    return true;
  }
  
  /**
   * Update service metrics
   */
  updateServiceMetrics(serviceId, success, responseTime) {
    const service = this.services.get(serviceId);
    if (!service) return;
    
    service.totalRequests++;
    
    if (success) {
      service.successfulRequests++;
      
      // Update average response time
      if (service.avgResponseTime === 0) {
        service.avgResponseTime = responseTime;
      } else {
        service.avgResponseTime = 
          (service.avgResponseTime * (service.successfulRequests - 1) + responseTime) / 
          service.successfulRequests;
      }
    } else {
      service.failedRequests++;
    }
  }
  
  /**
   * Update global metrics
   */
  updateGlobalMetrics(success, responseTime) {
    if (success) {
      this.metrics.successfulRequests++;
      
      if (this.metrics.avgResponseTime === 0) {
        this.metrics.avgResponseTime = responseTime;
      } else {
        this.metrics.avgResponseTime = 
          (this.metrics.avgResponseTime * (this.metrics.successfulRequests - 1) + responseTime) / 
          this.metrics.successfulRequests;
      }
    } else {
      this.metrics.failedRequests++;
    }
  }
  
  /**
   * Handle service state changes
   */
  handleServiceStateChange(event) {
    const { serviceId, oldState, newState } = event;
    
    console.log(`🟡️ Service ${serviceId}: Health ${oldState} → ${newState}`);
    
    // Could trigger additional actions like:
    // - Adjusting weights
    // - Scaling services
    // - Alerting administrators
    
    this.emit('service:healthChanged', event);
  }
  
  /**
   * Update consistent hash ring
   */
  updateHashRing() {
    if (!this.hashRing) return;
    
    this.hashRing.clear();
    
    for (const [serviceId, service] of this.services) {
      // Add virtual nodes for better distribution
      for (let i = 0; i < this.config.virtualNodes; i++) {
        const virtualKey = `${serviceId}-${i}`;
        const hash = this.hash(virtualKey);
        this.hashRing.set(hash, serviceId);
      }
    }
  }
  
  /**
   * Hash function for consistent hashing
   */
  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Start analytics collection
   */
  startAnalytics() {
    if (!this.config.enableAnalytics) return;
    
    this.analyticsInterval = setInterval(() => {
      this.emitAnalytics();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Emit analytics data
   */
  emitAnalytics() {
    const analytics = this.getAnalytics();
    this.emit('analytics', analytics);
    
    if (analytics.global.totalRequests > 0) {
      console.log(`🟡️ Load Balancer Analytics: ${analytics.global.successRate.toFixed(1)}% success rate, ${analytics.global.avgResponseTime.toFixed(0)}ms avg response`);
    }
  }
  
  /**
   * Get comprehensive analytics
   */
  getAnalytics() {
    const healthStats = this.config.healthMonitoring ? 
      this.healthMonitor.getHealthStats() : null;
    
    const serviceStats = [];
    for (const [serviceId, service] of this.services) {
      const circuitStats = this.circuitBreakers.has(serviceId) ? 
        this.circuitBreakers.get(serviceId).getMetrics() : null;
      
      serviceStats.push({
        serviceId,
        totalRequests: service.totalRequests,
        successfulRequests: service.successfulRequests,
        failedRequests: service.failedRequests,
        successRate: service.totalRequests > 0 ? 
          service.successfulRequests / service.totalRequests : 0,
        avgResponseTime: service.avgResponseTime,
        currentConnections: this.connections.get(serviceId) || 0,
        maxConnections: service.maxConnections,
        weight: service.weight,
        circuitBreakerState: circuitStats ? circuitStats.state : null
      });
    }
    
    const successRate = this.metrics.totalRequests > 0 ? 
      this.metrics.successfulRequests / this.metrics.totalRequests : 0;
    
    return {
      global: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        retriedRequests: this.metrics.retriedRequests,
        rateLimitedRequests: this.metrics.rateLimitedRequests,
        successRate,
        avgResponseTime: this.metrics.avgResponseTime,
        uptime: Date.now() - this.metrics.startTime
      },
      services: serviceStats,
      health: healthStats,
      strategy: this.config.strategy,
      circuitBreakersEnabled: this.config.circuitBreaker,
      healthMonitoringEnabled: this.config.healthMonitoring
    };
  }
  
  /**
   * Get load balancer status
   */
  getStatus() {
    return {
      totalServices: this.services.size,
      availableServices: this.getAvailableServices().length,
      totalConnections: Array.from(this.connections.values())
        .reduce((sum, count) => sum + count, 0),
      strategy: this.config.strategy,
      healthMonitoring: this.config.healthMonitoring,
      circuitBreaker: this.config.circuitBreaker,
      ...this.metrics
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🟡️ Load Balancer shutting down...');
    
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
    
    this.healthMonitor.destroy();
    
    // Emit final analytics
    const finalAnalytics = this.getAnalytics();
    console.log(`📊 Final Load Balancer Stats: ${(finalAnalytics.global.successRate * 100).toFixed(1)}% success rate, ${finalAnalytics.global.totalRequests} total requests`);
    
    this.removeAllListeners();
    console.log('🏁 Load Balancer shutdown complete');
  }
}

module.exports = {
  ProductionLoadBalancer,
  ServiceHealthMonitor,
  CircuitBreaker,
  LoadBalancingStrategy,
  HealthState,
  CircuitState
};