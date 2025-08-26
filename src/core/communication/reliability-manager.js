/**
 * Communication Reliability Manager - Advanced reliability, performance, and failover systems
 * Provides circuit breakers, connection pooling, monitoring, and automatic recovery
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Circuit breaker states
 */
const CircuitState = {
  CLOSED: 'closed',     // Normal operation
  OPEN: 'open',         // Failing, requests blocked
  HALF_OPEN: 'half_open' // Testing if service recovered
};

/**
 * Health check statuses
 */
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

/**
 * Failover strategies
 */
const FailoverStrategy = {
  ROUND_ROBIN: 'round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  FASTEST_RESPONSE: 'fastest_response',
  PRIORITY_BASED: 'priority_based'
};

/**
 * Communication Reliability Manager
 */
class CommunicationReliabilityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      // Circuit breaker configuration
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringWindow: 60000,
        halfOpenMaxCalls: 3
      },
      // Connection pool configuration
      connectionPool: {
        minConnections: 5,
        maxConnections: 50,
        acquireTimeout: 10000,
        idleTimeout: 300000,
        healthCheckInterval: 30000
      },
      // Health monitoring configuration
      healthMonitoring: {
        checkInterval: 15000,
        unhealthyThreshold: 3,
        degradedThreshold: 2,
        responseTimeThreshold: 5000
      },
      // Failover configuration
      failover: {
        strategy: FailoverStrategy.LEAST_CONNECTIONS,
        maxRetries: 3,
        retryDelay: 1000,
        enableAutoRecovery: true
      },
      // Performance monitoring
      performance: {
        metricsWindow: 300000, // 5 minutes
        alertThresholds: {
          responseTime: 2000,
          errorRate: 5,
          throughput: 100
        }
      },
      ...config
    };
    
    // Core components
    this.circuitBreakers = new Map(); // service -> circuit breaker
    this.connectionPools = new Map(); // service -> connection pool
    this.healthCheckers = new Map(); // service -> health checker
    this.performanceMonitors = new Map(); // service -> performance monitor
    
    // Global state
    this.serviceRegistry = new Map(); // service -> service info
    this.failoverGroups = new Map(); // group -> services
    this.alertManager = new AlertManager(this.config.performance.alertThresholds);
    
    // Metrics aggregation
    this.globalMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      failovers: 0,
      averageResponseTime: 0,
      uptime: Date.now()
    };
    
    // Start global monitoring
    this.startGlobalMonitoring();
    
    logger.info('🟡️ Communication Reliability Manager initialized', {
      circuitBreakerEnabled: true,
      connectionPooling: true,
      healthMonitoring: true,
      failoverStrategy: this.config.failover.strategy
    });
  }

  /**
   * Register a service for reliability management
   */
  registerService(serviceId, serviceConfig = {}) {
    const service = {
      id: serviceId,
      endpoint: serviceConfig.endpoint,
      priority: serviceConfig.priority || 1,
      failoverGroup: serviceConfig.failoverGroup,
      healthCheckEndpoint: serviceConfig.healthCheckEndpoint,
      maxConcurrentRequests: serviceConfig.maxConcurrentRequests || 100,
      registeredAt: Date.now(),
      lastHealthCheck: null,
      status: HealthStatus.UNKNOWN,
      metadata: serviceConfig.metadata || {}
    };
    
    this.serviceRegistry.set(serviceId, service);
    
    // Initialize circuit breaker
    const circuitBreaker = new CircuitBreaker(serviceId, this.config.circuitBreaker);
    this.circuitBreakers.set(serviceId, circuitBreaker);
    
    // Initialize connection pool
    const connectionPool = new ConnectionPool(serviceId, this.config.connectionPool);
    this.connectionPools.set(serviceId, connectionPool);
    
    // Initialize health checker
    const healthChecker = new HealthChecker(serviceId, service, this.config.healthMonitoring);
    this.healthCheckers.set(serviceId, healthChecker);
    
    // Initialize performance monitor
    const performanceMonitor = new PerformanceMonitor(serviceId, this.config.performance);
    this.performanceMonitors.set(serviceId, performanceMonitor);
    
    // Add to failover group if specified
    if (service.failoverGroup) {
      this.addToFailoverGroup(service.failoverGroup, serviceId);
    }
    
    // Set up event listeners
    this.setupServiceEventListeners(serviceId);
    
    logger.info(`📝 Service registered: ${serviceId}`, {
      priority: service.priority,
      failoverGroup: service.failoverGroup
    });
    
    return service;
  }

  /**
   * Execute request with reliability guarantees
   */
  async executeRequest(serviceId, requestFunction, options = {}) {
    const startTime = Date.now();
    const {
      timeout = 30000,
      retries = this.config.failover.maxRetries,
      enableFailover = true,
      enableCircuitBreaker = true
    } = options;
    
    let lastError = null;
    let currentServiceId = serviceId;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check circuit breaker
        if (enableCircuitBreaker) {
          const circuitBreaker = this.circuitBreakers.get(currentServiceId);
          if (circuitBreaker && !circuitBreaker.canExecute()) {
            throw new Error(`Circuit breaker open for service: ${currentServiceId}`);
          }
        }
        
        // Get connection from pool
        const connectionPool = this.connectionPools.get(currentServiceId);
        const connection = await connectionPool.acquire();
        
        try {
          // Execute request with timeout
          const result = await this.executeWithTimeout(requestFunction, timeout, connection);
          
          // Record success
          await this.recordSuccess(currentServiceId, Date.now() - startTime);
          
          // Release connection
          connectionPool.release(connection);
          
          return result;
          
        } catch (executionError) {
          // Release connection
          connectionPool.release(connection, true); // Mark as potentially bad
          throw executionError;
        }
        
      } catch (error) {
        lastError = error;
        
        // Record failure
        await this.recordFailure(currentServiceId, error, Date.now() - startTime);
        
        // Try failover if enabled and more attempts available
        if (enableFailover && attempt < retries) {
          const failoverService = await this.selectFailoverService(currentServiceId);
          if (failoverService) {
            currentServiceId = failoverService;
            logger.warn(`🔄 Failing over to: ${currentServiceId} (attempt ${attempt + 1})`);
            continue;
          }
        }
        
        // If this is the last attempt or no failover available, break
        if (attempt === retries) {
          break;
        }
        
        // Wait before retry
        await this.sleep(this.config.failover.retryDelay * Math.pow(2, attempt));
      }
    }
    
    // All attempts failed
    this.globalMetrics.failedRequests++;
    throw new Error(`Request failed after ${retries + 1} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Record successful request
   */
  async recordSuccess(serviceId, responseTime) {
    this.globalMetrics.totalRequests++;
    this.globalMetrics.successfulRequests++;
    this.updateAverageResponseTime(responseTime);
    
    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (circuitBreaker) {
      circuitBreaker.recordSuccess();
    }
    
    // Update performance monitor
    const performanceMonitor = this.performanceMonitors.get(serviceId);
    if (performanceMonitor) {
      performanceMonitor.recordRequest(true, responseTime);
    }
    
    // Check for alerts
    await this.alertManager.checkResponseTime(serviceId, responseTime);
  }

  /**
   * Record failed request
   */
  async recordFailure(serviceId, error, responseTime) {
    this.globalMetrics.totalRequests++;
    this.globalMetrics.failedRequests++;
    
    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    if (circuitBreaker) {
      circuitBreaker.recordFailure(error);
    }
    
    // Update performance monitor
    const performanceMonitor = this.performanceMonitors.get(serviceId);
    if (performanceMonitor) {
      performanceMonitor.recordRequest(false, responseTime, error);
    }
    
    // Update service health
    const service = this.serviceRegistry.get(serviceId);
    if (service) {
      await this.updateServiceHealth(serviceId, false);
    }
    
    // Check for alerts
    await this.alertManager.checkErrorRate(serviceId, error);
  }

  /**
   * Select failover service
   */
  async selectFailoverService(originalServiceId) {
    const service = this.serviceRegistry.get(originalServiceId);
    if (!service || !service.failoverGroup) {
      return null;
    }
    
    const failoverServices = this.failoverGroups.get(service.failoverGroup) || [];
    const availableServices = failoverServices.filter(id => {
      if (id === originalServiceId) return false;
      
      const circuitBreaker = this.circuitBreakers.get(id);
      return !circuitBreaker || circuitBreaker.canExecute();
    });
    
    if (availableServices.length === 0) {
      return null;
    }
    
    // Apply failover strategy
    switch (this.config.failover.strategy) {
      case FailoverStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(availableServices);
      
      case FailoverStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(availableServices);
      
      case FailoverStrategy.FASTEST_RESPONSE:
        return this.selectFastestResponse(availableServices);
      
      case FailoverStrategy.PRIORITY_BASED:
        return this.selectByPriority(availableServices);
      
      default:
        return availableServices[0];
    }
  }

  /**
   * Failover selection strategies
   */
  selectRoundRobin(services) {
    // Simple round-robin selection
    const timestamp = Date.now();
    const index = timestamp % services.length;
    return services[index];
  }

  selectLeastConnections(services) {
    let minConnections = Infinity;
    let selectedService = null;
    
    for (const serviceId of services) {
      const pool = this.connectionPools.get(serviceId);
      const activeConnections = pool ? pool.getActiveCount() : 0;
      
      if (activeConnections < minConnections) {
        minConnections = activeConnections;
        selectedService = serviceId;
      }
    }
    
    return selectedService;
  }

  selectFastestResponse(services) {
    let fastestTime = Infinity;
    let selectedService = null;
    
    for (const serviceId of services) {
      const monitor = this.performanceMonitors.get(serviceId);
      const avgResponseTime = monitor ? monitor.getAverageResponseTime() : Infinity;
      
      if (avgResponseTime < fastestTime) {
        fastestTime = avgResponseTime;
        selectedService = serviceId;
      }
    }
    
    return selectedService || services[0];
  }

  selectByPriority(services) {
    let highestPriority = 0;
    let selectedService = null;
    
    for (const serviceId of services) {
      const service = this.serviceRegistry.get(serviceId);
      if (service && service.priority > highestPriority) {
        highestPriority = service.priority;
        selectedService = serviceId;
      }
    }
    
    return selectedService || services[0];
  }

  /**
   * Update service health status
   */
  async updateServiceHealth(serviceId, isHealthy) {
    const service = this.serviceRegistry.get(serviceId);
    if (!service) return;
    
    const healthChecker = this.healthCheckers.get(serviceId);
    if (healthChecker) {
      healthChecker.recordHealthCheck(isHealthy);
      service.status = healthChecker.getHealthStatus();
      service.lastHealthCheck = Date.now();
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(func, timeout, connection) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
      
      Promise.resolve(func(connection))
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Setup event listeners for service
   */
  setupServiceEventListeners(serviceId) {
    const circuitBreaker = this.circuitBreakers.get(serviceId);
    const healthChecker = this.healthCheckers.get(serviceId);
    const performanceMonitor = this.performanceMonitors.get(serviceId);
    
    // Circuit breaker events
    if (circuitBreaker) {
      circuitBreaker.on('state:changed', (data) => {
        this.emit('circuit_breaker:state_changed', { serviceId, ...data });
        
        if (data.newState === CircuitState.OPEN) {
          this.globalMetrics.circuitBreakerTrips++;
          logger.warn(`🔴 Circuit breaker opened: ${serviceId}`);
        } else if (data.newState === CircuitState.CLOSED) {
          logger.info(`🟢 Circuit breaker closed: ${serviceId}`);
        }
      });
    }
    
    // Health checker events
    if (healthChecker) {
      healthChecker.on('health:changed', (data) => {
        this.emit('service:health_changed', { serviceId, ...data });
        
        if (data.status === HealthStatus.UNHEALTHY) {
          logger.error(`🩺 Service unhealthy: ${serviceId}`);
        }
      });
    }
    
    // Performance monitor events
    if (performanceMonitor) {
      performanceMonitor.on('performance:alert', (data) => {
        this.emit('service:performance_alert', { serviceId, ...data });
        logger.warn(`🟢 Performance alert: ${serviceId} - ${data.alert}`);
      });
    }
  }

  /**
   * Add service to failover group
   */
  addToFailoverGroup(groupName, serviceId) {
    if (!this.failoverGroups.has(groupName)) {
      this.failoverGroups.set(groupName, []);
    }
    
    const group = this.failoverGroups.get(groupName);
    if (!group.includes(serviceId)) {
      group.push(serviceId);
    }
  }

  /**
   * Start global monitoring
   */
  startGlobalMonitoring() {
    setInterval(() => {
      this.performGlobalHealthCheck();
    }, 60000); // Every minute
    
    setInterval(() => {
      this.emitGlobalMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform global health check
   */
  async performGlobalHealthCheck() {
    const healthSummary = {
      timestamp: Date.now(),
      totalServices: this.serviceRegistry.size,
      healthyServices: 0,
      degradedServices: 0,
      unhealthyServices: 0,
      openCircuitBreakers: 0
    };
    
    for (const [serviceId, service] of this.serviceRegistry) {
      switch (service.status) {
        case HealthStatus.HEALTHY:
          healthSummary.healthyServices++;
          break;
        case HealthStatus.DEGRADED:
          healthSummary.degradedServices++;
          break;
        case HealthStatus.UNHEALTHY:
          healthSummary.unhealthyServices++;
          break;
      }
      
      const circuitBreaker = this.circuitBreakers.get(serviceId);
      if (circuitBreaker && circuitBreaker.getState() === CircuitState.OPEN) {
        healthSummary.openCircuitBreakers++;
      }
    }
    
    this.emit('global:health_summary', healthSummary);
  }

  /**
   * Emit global metrics
   */
  emitGlobalMetrics() {
    const metrics = {
      ...this.globalMetrics,
      timestamp: Date.now(),
      uptime: Date.now() - this.globalMetrics.uptime,
      successRate: this.globalMetrics.totalRequests > 0 ? 
        (this.globalMetrics.successfulRequests / this.globalMetrics.totalRequests) * 100 : 0
    };
    
    this.emit('global:metrics', metrics);
  }

  /**
   * Helper methods
   */
  updateAverageResponseTime(responseTime) {
    const total = this.globalMetrics.successfulRequests;
    this.globalMetrics.averageResponseTime = 
      (this.globalMetrics.averageResponseTime * (total - 1) + responseTime) / total;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get reliability statistics
   */
  getReliabilityStats() {
    const services = {};
    
    for (const [serviceId, service] of this.serviceRegistry) {
      const circuitBreaker = this.circuitBreakers.get(serviceId);
      const connectionPool = this.connectionPools.get(serviceId);
      const performanceMonitor = this.performanceMonitors.get(serviceId);
      
      services[serviceId] = {
        status: service.status,
        circuitBreakerState: circuitBreaker ? circuitBreaker.getState() : 'unknown',
        activeConnections: connectionPool ? connectionPool.getActiveCount() : 0,
        performance: performanceMonitor ? performanceMonitor.getStats() : null
      };
    }
    
    return {
      timestamp: Date.now(),
      globalMetrics: this.globalMetrics,
      services,
      failoverGroups: Object.fromEntries(this.failoverGroups)
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🔄 Shutting down Communication Reliability Manager...');
    
    // Shutdown all connection pools
    const shutdownPromises = Array.from(this.connectionPools.values()).map(pool => 
      pool.shutdown()
    );
    
    await Promise.all(shutdownPromises);
    
    // Clear timers and cleanup
    this.circuitBreakers.clear();
    this.connectionPools.clear();
    this.healthCheckers.clear();
    this.performanceMonitors.clear();
    
    this.emit('reliability:shutdown');
    logger.info('🏁 Communication Reliability Manager shutdown complete');
  }
}

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker extends EventEmitter {
  constructor(serviceId, config) {
    super();
    this.serviceId = serviceId;
    this.config = config;
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
    this.failureWindow = [];
  }

  canExecute() {
    const now = Date.now();
    
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
      
      case CircuitState.OPEN:
        if (now - this.lastFailureTime > this.config.recoveryTimeout) {
          this.setState(CircuitState.HALF_OPEN);
          return true;
        }
        return false;
      
      case CircuitState.HALF_OPEN:
        return this.halfOpenCalls < this.config.halfOpenMaxCalls;
      
      default:
        return false;
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.halfOpenCalls = 0;
    
    if (this.state !== CircuitState.CLOSED) {
      this.setState(CircuitState.CLOSED);
    }
  }

  recordFailure(error) {
    const now = Date.now();
    this.lastFailureTime = now;
    
    // Add to failure window
    this.failureWindow.push(now);
    this.failureWindow = this.failureWindow.filter(time => 
      now - time < this.config.monitoringWindow
    );
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failureWindow.length >= this.config.failureThreshold) {
        this.setState(CircuitState.OPEN);
      }
    }
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    this.emit('state:changed', { oldState, newState });
  }

  getState() {
    return this.state;
  }
}

/**
 * Connection Pool Implementation
 */
class ConnectionPool {
  constructor(serviceId, config) {
    this.serviceId = serviceId;
    this.config = config;
    this.connections = [];
    this.activeConnections = new Set();
    this.waitingQueue = [];
  }

  async acquire() {
    return new Promise((resolve, reject) => {
      // Check for available connection
      const availableConnection = this.connections.find(conn => !conn.inUse);
      
      if (availableConnection) {
        availableConnection.inUse = true;
        availableConnection.lastUsed = Date.now();
        this.activeConnections.add(availableConnection);
        resolve(availableConnection);
        return;
      }
      
      // Create new connection if under limit
      if (this.connections.length < this.config.maxConnections) {
        const newConnection = this.createConnection();
        this.connections.push(newConnection);
        newConnection.inUse = true;
        this.activeConnections.add(newConnection);
        resolve(newConnection);
        return;
      }
      
      // Add to waiting queue
      this.waitingQueue.push({ resolve, reject });
      
      // Set timeout
      setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          reject(new Error('Connection acquire timeout'));
        }
      }, this.config.acquireTimeout);
    });
  }

  release(connection, isError = false) {
    connection.inUse = false;
    connection.lastUsed = Date.now();
    this.activeConnections.delete(connection);
    
    if (isError) {
      connection.errorCount = (connection.errorCount || 0) + 1;
    }
    
    // Serve waiting requests
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      connection.inUse = true;
      this.activeConnections.add(connection);
      waiter.resolve(connection);
    }
  }

  createConnection() {
    return {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      inUse: false,
      errorCount: 0,
      serviceId: this.serviceId
    };
  }

  getActiveCount() {
    return this.activeConnections.size;
  }

  async shutdown() {
    // Close all connections
    this.connections = [];
    this.activeConnections.clear();
    
    // Reject waiting requests
    this.waitingQueue.forEach(waiter => {
      waiter.reject(new Error('Connection pool shutting down'));
    });
    this.waitingQueue = [];
  }
}

/**
 * Health Checker Implementation
 */
class HealthChecker extends EventEmitter {
  constructor(serviceId, service, config) {
    super();
    this.serviceId = serviceId;
    this.service = service;
    this.config = config;
    this.healthHistory = [];
    this.status = HealthStatus.UNKNOWN;
  }

  recordHealthCheck(isHealthy) {
    const now = Date.now();
    this.healthHistory.push({ timestamp: now, healthy: isHealthy });
    
    // Keep only recent history
    this.healthHistory = this.healthHistory.filter(record => 
      now - record.timestamp < this.config.checkInterval * 10
    );
    
    this.updateHealthStatus();
  }

  updateHealthStatus() {
    const recentChecks = this.healthHistory.slice(-5);
    const unhealthyCount = recentChecks.filter(check => !check.healthy).length;
    
    let newStatus;
    if (unhealthyCount >= this.config.unhealthyThreshold) {
      newStatus = HealthStatus.UNHEALTHY;
    } else if (unhealthyCount >= this.config.degradedThreshold) {
      newStatus = HealthStatus.DEGRADED;
    } else {
      newStatus = HealthStatus.HEALTHY;
    }
    
    if (newStatus !== this.status) {
      const oldStatus = this.status;
      this.status = newStatus;
      this.emit('health:changed', { oldStatus, status: newStatus });
    }
  }

  getHealthStatus() {
    return this.status;
  }
}

/**
 * Performance Monitor Implementation
 */
class PerformanceMonitor extends EventEmitter {
  constructor(serviceId, config) {
    super();
    this.serviceId = serviceId;
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0
    };
    this.responseTimeWindow = [];
  }

  recordRequest(success, responseTime, error = null) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = 
      this.metrics.totalResponseTime / this.metrics.totalRequests;
    
    // Add to response time window
    this.responseTimeWindow.push({
      timestamp: Date.now(),
      responseTime,
      success
    });
    
    // Keep only recent data
    const cutoff = Date.now() - this.config.metricsWindow;
    this.responseTimeWindow = this.responseTimeWindow.filter(entry => 
      entry.timestamp > cutoff
    );
    
    // Check for performance alerts
    this.checkPerformanceAlerts(responseTime, success);
  }

  checkPerformanceAlerts(responseTime, success) {
    const thresholds = this.config.alertThresholds;
    
    if (responseTime > thresholds.responseTime) {
      this.emit('performance:alert', {
        alert: 'high_response_time',
        value: responseTime,
        threshold: thresholds.responseTime
      });
    }
    
    const errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
    if (errorRate > thresholds.errorRate) {
      this.emit('performance:alert', {
        alert: 'high_error_rate',
        value: errorRate,
        threshold: thresholds.errorRate
      });
    }
  }

  getAverageResponseTime() {
    return this.metrics.averageResponseTime;
  }

  getStats() {
    return {
      ...this.metrics,
      errorRate: this.metrics.totalRequests > 0 ? 
        (this.metrics.failedRequests / this.metrics.totalRequests) * 100 : 0,
      recentRequests: this.responseTimeWindow.length
    };
  }
}

/**
 * Alert Manager Implementation
 */
class AlertManager {
  constructor(thresholds) {
    this.thresholds = thresholds;
    this.alertHistory = new Map();
  }

  async checkResponseTime(serviceId, responseTime) {
    if (responseTime > this.thresholds.responseTime) {
      await this.sendAlert(serviceId, 'high_response_time', {
        value: responseTime,
        threshold: this.thresholds.responseTime
      });
    }
  }

  async checkErrorRate(serviceId, error) {
    // Implementation would track error rates and send alerts
    await this.sendAlert(serviceId, 'service_error', {
      error: error.message,
      timestamp: Date.now()
    });
  }

  async sendAlert(serviceId, alertType, data) {
    const alert = {
      serviceId,
      type: alertType,
      data,
      timestamp: Date.now()
    };
    
    // Store alert history
    if (!this.alertHistory.has(serviceId)) {
      this.alertHistory.set(serviceId, []);
    }
    
    this.alertHistory.get(serviceId).push(alert);
    
    // In production, this would send to monitoring systems
    logger.warn(`🔴 Alert: ${alertType} for ${serviceId}`, data);
  }
}

module.exports = {
  CommunicationReliabilityManager,
  CircuitState,
  HealthStatus,
  FailoverStrategy,
  CircuitBreaker,
  ConnectionPool,
  HealthChecker,
  PerformanceMonitor
};