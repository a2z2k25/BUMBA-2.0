/**
 * Advanced Connection Manager - Robust network connection handling with auto-healing
 * Provides intelligent connection pooling, failover, and recovery mechanisms
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Connection states
 */
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  DEGRADED: 'degraded'
};

/**
 * Connection types
 */
const ConnectionType = {
  PRIMARY: 'primary',
  BACKUP: 'backup',
  FALLBACK: 'fallback',
  EMERGENCY: 'emergency'
};

/**
 * Advanced Connection Manager
 */
class AdvancedConnectionManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      maxConnections: 100,
      connectionTimeout: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      healthCheckInterval: 15000,
      degradedThreshold: 2000, // ms
      failureThreshold: 5,
      enableAutoHealing: true,
      enableLoadBalancing: true,
      enableConnectionPooling: true,
      poolSizeMin: 5,
      poolSizeMax: 50,
      idleTimeout: 300000, // 5 minutes
      ...config
    };
    
    // Connection management
    this.connections = new Map(); // connectionId -> connection
    this.connectionPools = new Map(); // poolId -> pool
    this.endpoints = new Map(); // endpointId -> endpoint config
    this.routingTable = new Map(); // route -> endpoint priorities
    
    // Health monitoring
    this.healthStatus = new Map(); // connectionId -> health data
    this.failureHistory = new Map(); // connectionId -> failures
    this.performanceMetrics = new Map(); // connectionId -> metrics
    
    // Auto-healing system
    this.healingQueue = [];
    this.healingInProgress = new Set();
    
    // Load balancing
    this.loadBalancer = new LoadBalancer(this.config);
    this.circuitBreakers = new Map(); // endpointId -> circuit breaker
    
    // Metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      reconnectAttempts: 0,
      healingOperations: 0,
      averageLatency: 0,
      throughput: 0
    };
    
    // Start monitoring systems
    this.startHealthMonitoring();
    this.startAutoHealing();
    
    logger.info('🔗 Advanced Connection Manager initialized', {
      maxConnections: this.config.maxConnections,
      autoHealing: this.config.enableAutoHealing,
      loadBalancing: this.config.enableLoadBalancing
    });
  }

  /**
   * Register endpoint for connection management
   */
  registerEndpoint(endpointId, endpointConfig) {
    const endpoint = {
      id: endpointId,
      url: endpointConfig.url,
      type: endpointConfig.type || ConnectionType.PRIMARY,
      priority: endpointConfig.priority || 1,
      weight: endpointConfig.weight || 1,
      maxConnections: endpointConfig.maxConnections || this.config.maxConnections,
      healthCheckUrl: endpointConfig.healthCheckUrl,
      metadata: endpointConfig.metadata || {},
      registeredAt: Date.now(),
      lastHealthCheck: null,
      isHealthy: true
    };
    
    this.endpoints.set(endpointId, endpoint);
    
    // Initialize circuit breaker
    this.circuitBreakers.set(endpointId, new CircuitBreaker({
      failureThreshold: this.config.failureThreshold,
      recoveryTimeout: 30000,
      monitoringWindow: 60000
    }));
    
    // Create connection pool if enabled
    if (this.config.enableConnectionPooling) {
      this.createConnectionPool(endpointId, endpoint);
    }
    
    logger.info(`📝 Endpoint registered: ${endpointId}`, {
      type: endpoint.type,
      priority: endpoint.priority
    });
    
    return endpoint;
  }

  /**
   * Create connection pool for endpoint
   */
  createConnectionPool(endpointId, endpoint) {
    const pool = new ConnectionPool({
      endpointId,
      endpoint,
      minConnections: this.config.poolSizeMin,
      maxConnections: Math.min(this.config.poolSizeMax, endpoint.maxConnections),
      idleTimeout: this.config.idleTimeout,
      connectionFactory: (config) => this.createConnection(endpointId, config)
    });
    
    this.connectionPools.set(endpointId, pool);
    
    // Initialize pool
    pool.initialize();
    
    return pool;
  }

  /**
   * Create connection to endpoint
   */
  async createConnection(endpointId, connectionConfig = {}) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    
    const connectionId = this.generateConnectionId();
    const startTime = Date.now();
    
    try {
      const connection = {
        id: connectionId,
        endpointId,
        state: ConnectionState.CONNECTING,
        endpoint: endpoint.url,
        type: endpoint.type,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        metadata: {
          attempts: 0,
          lastError: null,
          ...connectionConfig.metadata
        },
        performance: {
          latency: 0,
          throughput: 0,
          errorRate: 0,
          lastMeasurement: Date.now()
        }
      };
      
      // Simulate connection establishment
      connection.handle = await this.establishConnection(endpoint, connectionConfig);
      
      connection.state = ConnectionState.CONNECTED;
      connection.connectedAt = Date.now();
      connection.performance.latency = Date.now() - startTime;
      
      this.connections.set(connectionId, connection);
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      
      // Start health monitoring for this connection
      this.startConnectionMonitoring(connectionId);
      
      this.emit('connection:established', { connection });
      
      logger.debug(`🔗 Connection established: ${connectionId} -> ${endpoint.url}`);
      
      return connection;
      
    } catch (error) {
      this.metrics.failedConnections++;
      this.recordConnectionFailure(endpointId, error);
      
      logger.error(`🔴 Connection failed: ${endpointId}`, error);
      throw error;
    }
  }

  /**
   * Get connection from pool or create new one
   */
  async getConnection(endpointId, options = {}) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointId}`);
    }
    
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(endpointId);
    if (circuitBreaker && !circuitBreaker.canExecute()) {
      throw new Error(`Circuit breaker open for endpoint: ${endpointId}`);
    }
    
    // Try to get from pool first
    if (this.config.enableConnectionPooling) {
      const pool = this.connectionPools.get(endpointId);
      if (pool) {
        try {
          return await pool.acquire(options.timeout || this.config.connectionTimeout);
        } catch (poolError) {
          logger.warn(`Pool acquisition failed for ${endpointId}, creating direct connection`);
        }
      }
    }
    
    // Create direct connection
    return await this.createConnection(endpointId, options);
  }

  /**
   * Release connection back to pool or close
   */
  releaseConnection(connectionId, error = null) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    connection.lastActivity = Date.now();
    
    if (error) {
      connection.metadata.lastError = error;
      this.recordConnectionFailure(connection.endpointId, error);
    }
    
    // Return to pool if available
    const pool = this.connectionPools.get(connection.endpointId);
    if (pool && !error) {
      pool.release(connection);
    } else {
      this.closeConnection(connectionId);
    }
  }

  /**
   * Close connection
   */
  closeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    try {
      if (connection.handle && connection.handle.close) {
        connection.handle.close();
      }
      
      connection.state = ConnectionState.DISCONNECTED;
      connection.closedAt = Date.now();
      
      this.connections.delete(connectionId);
      this.metrics.activeConnections--;
      
      this.emit('connection:closed', { connectionId, connection });
      
    } catch (error) {
      logger.error(`Error closing connection ${connectionId}:`, error);
    }
  }

  /**
   * Get best available connection using load balancing
   */
  async getBestConnection(criteria = {}) {
    if (this.config.enableLoadBalancing) {
      const selectedEndpoint = this.loadBalancer.selectEndpoint(
        Array.from(this.endpoints.values()),
        criteria
      );
      
      if (selectedEndpoint) {
        return await this.getConnection(selectedEndpoint.id, criteria);
      }
    }
    
    // Fallback to first available endpoint
    for (const [endpointId, endpoint] of this.endpoints) {
      if (endpoint.isHealthy) {
        try {
          return await this.getConnection(endpointId, criteria);
        } catch (error) {
          continue; // Try next endpoint
        }
      }
    }
    
    throw new Error('No healthy endpoints available');
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all connections and endpoints
   */
  async performHealthChecks() {
    // Check endpoint health
    for (const [endpointId, endpoint] of this.endpoints) {
      await this.checkEndpointHealth(endpointId, endpoint);
    }
    
    // Check connection health
    for (const [connectionId, connection] of this.connections) {
      await this.checkConnectionHealth(connectionId, connection);
    }
    
    this.emit('health:check_completed', {
      endpoints: this.endpoints.size,
      connections: this.connections.size,
      timestamp: Date.now()
    });
  }

  /**
   * Check health of specific endpoint
   */
  async checkEndpointHealth(endpointId, endpoint) {
    try {
      const healthCheckStart = Date.now();
      
      // Perform health check (simplified)
      const isHealthy = await this.performEndpointHealthCheck(endpoint);
      const responseTime = Date.now() - healthCheckStart;
      
      const healthData = {
        isHealthy,
        responseTime,
        lastCheck: Date.now(),
        status: isHealthy ? 'healthy' : 'unhealthy'
      };
      
      // Update endpoint health
      endpoint.isHealthy = isHealthy;
      endpoint.lastHealthCheck = Date.now();
      
      // Record health status
      this.healthStatus.set(endpointId, healthData);
      
      // Update circuit breaker
      const circuitBreaker = this.circuitBreakers.get(endpointId);
      if (circuitBreaker) {
        if (isHealthy) {
          circuitBreaker.recordSuccess();
        } else {
          circuitBreaker.recordFailure(new Error('Health check failed'));
        }
      }
      
      // Trigger healing if needed
      if (!isHealthy && this.config.enableAutoHealing) {
        this.scheduleHealing(endpointId, 'health_check_failed');
      }
      
    } catch (error) {
      logger.error(`Health check failed for endpoint ${endpointId}:`, error);
      endpoint.isHealthy = false;
    }
  }

  /**
   * Check health of specific connection
   */
  async checkConnectionHealth(connectionId, connection) {
    const now = Date.now();
    const idleTime = now - connection.lastActivity;
    
    // Mark degraded if response time is high
    if (connection.performance.latency > this.config.degradedThreshold) {
      connection.state = ConnectionState.DEGRADED;
    }
    
    // Close idle connections
    if (idleTime > this.config.idleTimeout) {
      this.closeConnection(connectionId);
      return;
    }
    
    // Check connection responsiveness
    try {
      const pingStart = Date.now();
      await this.pingConnection(connection);
      connection.performance.latency = Date.now() - pingStart;
      connection.lastActivity = now;
      
      if (connection.state === ConnectionState.DEGRADED && 
          connection.performance.latency < this.config.degradedThreshold) {
        connection.state = ConnectionState.CONNECTED;
      }
      
    } catch (error) {
      logger.warn(`Connection health check failed: ${connectionId}`, error);
      this.recordConnectionFailure(connection.endpointId, error);
    }
  }

  /**
   * Start auto-healing system
   */
  startAutoHealing() {
    if (!this.config.enableAutoHealing) return;
    
    this.healingInterval = setInterval(() => {
      this.processHealingQueue();
    }, 10000); // Every 10 seconds
  }

  /**
   * Schedule healing operation
   */
  scheduleHealing(endpointId, reason) {
    if (this.healingInProgress.has(endpointId)) {
      return; // Already healing
    }
    
    const healingOperation = {
      endpointId,
      reason,
      scheduledAt: Date.now(),
      attempts: 0,
      maxAttempts: 3
    };
    
    this.healingQueue.push(healingOperation);
    
    logger.info(`🔧 Healing scheduled for endpoint ${endpointId}: ${reason}`);
  }

  /**
   * Process healing queue
   */
  async processHealingQueue() {
    while (this.healingQueue.length > 0) {
      const healing = this.healingQueue.shift();
      
      if (this.healingInProgress.has(healing.endpointId)) {
        continue;
      }
      
      await this.performHealing(healing);
    }
  }

  /**
   * Perform healing operation
   */
  async performHealing(healingOperation) {
    const { endpointId, reason } = healingOperation;
    
    this.healingInProgress.add(endpointId);
    healingOperation.attempts++;
    
    try {
      logger.info(`🔧 Starting healing for endpoint ${endpointId}: ${reason}`);
      
      const endpoint = this.endpoints.get(endpointId);
      if (!endpoint) {
        throw new Error(`Endpoint not found: ${endpointId}`);
      }
      
      // Attempt to restore endpoint health
      await this.restoreEndpointHealth(endpointId, endpoint);
      
      // Reset circuit breaker if healing successful
      const circuitBreaker = this.circuitBreakers.get(endpointId);
      if (circuitBreaker) {
        circuitBreaker.reset();
      }
      
      // Clear failure history
      this.failureHistory.delete(endpointId);
      
      this.metrics.healingOperations++;
      
      this.emit('healing:completed', {
        endpointId,
        reason,
        attempts: healingOperation.attempts
      });
      
      logger.info(`🏁 Healing completed for endpoint ${endpointId}`);
      
    } catch (error) {
      logger.error(`🔴 Healing failed for endpoint ${endpointId}:`, error);
      
      // Retry if attempts remaining
      if (healingOperation.attempts < healingOperation.maxAttempts) {
        this.healingQueue.push(healingOperation);
      }
      
    } finally {
      this.healingInProgress.delete(endpointId);
    }
  }

  /**
   * Record connection failure
   */
  recordConnectionFailure(endpointId, error) {
    if (!this.failureHistory.has(endpointId)) {
      this.failureHistory.set(endpointId, []);
    }
    
    const failures = this.failureHistory.get(endpointId);
    failures.push({
      timestamp: Date.now(),
      error: error.message,
      type: error.constructor.name
    });
    
    // Keep only recent failures
    const cutoff = Date.now() - 300000; // 5 minutes
    this.failureHistory.set(endpointId, 
      failures.filter(f => f.timestamp > cutoff)
    );
    
    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(endpointId);
    if (circuitBreaker) {
      circuitBreaker.recordFailure(error);
    }
  }

  /**
   * Get connection manager statistics
   */
  getConnectionStats() {
    const endpointStats = {};
    
    for (const [endpointId, endpoint] of this.endpoints) {
      const pool = this.connectionPools.get(endpointId);
      const circuitBreaker = this.circuitBreakers.get(endpointId);
      const health = this.healthStatus.get(endpointId);
      const failures = this.failureHistory.get(endpointId) || [];
      
      endpointStats[endpointId] = {
        endpoint: {
          url: endpoint.url,
          type: endpoint.type,
          isHealthy: endpoint.isHealthy
        },
        pool: pool ? pool.getStats() : null,
        circuitBreaker: circuitBreaker ? circuitBreaker.getState() : null,
        health: health || null,
        recentFailures: failures.length
      };
    }
    
    return {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      endpoints: endpointStats,
      healing: {
        queueSize: this.healingQueue.length,
        inProgress: this.healingInProgress.size
      }
    };
  }

  /**
   * Helper methods
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async establishConnection(endpoint, config) {
    // Simplified connection establishment
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    return {
      endpoint: endpoint.url,
      connected: true,
      close: () => { /* cleanup */ }
    };
  }

  async performEndpointHealthCheck(endpoint) {
    // Simplified health check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    return Math.random() > 0.1; // 90% success rate
  }

  async pingConnection(connection) {
    // Simplified ping
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    return true;
  }

  async restoreEndpointHealth(endpointId, endpoint) {
    // Simplified healing process
    await new Promise(resolve => setTimeout(resolve, 1000));
    endpoint.isHealthy = true;
  }

  startConnectionMonitoring(connectionId) {
    // Start monitoring for specific connection
    // Implementation would track metrics, detect issues, etc.
  }

  /**
   * Shutdown connection manager
   */
  shutdown() {
    if (this.healthInterval) clearInterval(this.healthInterval);
    if (this.healingInterval) clearInterval(this.healingInterval);
    
    // Close all connections
    for (const connectionId of this.connections.keys()) {
      this.closeConnection(connectionId);
    }
    
    // Shutdown connection pools
    for (const pool of this.connectionPools.values()) {
      pool.shutdown();
    }
    
    this.emit('connection_manager:shutdown');
    logger.info('🔗 Advanced Connection Manager shut down');
  }
}

/**
 * Load Balancer
 */
class LoadBalancer {
  constructor(config) {
    this.config = config;
    this.roundRobinIndex = 0;
  }

  selectEndpoint(endpoints, criteria) {
    const healthy = endpoints.filter(ep => ep.isHealthy);
    
    if (healthy.length === 0) {
      return null;
    }
    
    // Simple round-robin for now
    const selected = healthy[this.roundRobinIndex % healthy.length];
    this.roundRobinIndex++;
    
    return selected;
  }
}

/**
 * Circuit Breaker
 */
class CircuitBreaker {
  constructor(config) {
    this.config = config;
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }

  canExecute() {
    const now = Date.now();
    
    switch (this.state) {
      case 'closed':
        return true;
      case 'open':
        if (now - this.lastFailureTime > this.config.recoveryTimeout) {
          this.state = 'half-open';
          this.halfOpenCalls = 0;
          return true;
        }
        return false;
      case 'half-open':
        return this.halfOpenCalls < 3;
      default:
        return false;
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = null;
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime
    };
  }
}

/**
 * Connection Pool
 */
class ConnectionPool {
  constructor(config) {
    this.config = config;
    this.connections = [];
    this.available = [];
    this.active = new Set();
  }

  async initialize() {
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      try {
        const connection = await this.config.connectionFactory({});
        this.connections.push(connection);
        this.available.push(connection);
      } catch (error) {
        logger.warn(`Failed to create initial connection for pool ${this.config.endpointId}`);
      }
    }
  }

  async acquire(timeout = 10000) {
    return new Promise((resolve, reject) => {
      // Check for available connection
      if (this.available.length > 0) {
        const connection = this.available.pop();
        this.active.add(connection);
        resolve(connection);
        return;
      }
      
      // Create new if under limit
      if (this.connections.length < this.config.maxConnections) {
        this.config.connectionFactory({})
          .then(connection => {
            this.connections.push(connection);
            this.active.add(connection);
            resolve(connection);
          })
          .catch(reject);
        return;
      }
      
      // Wait for available connection
      setTimeout(() => {
        reject(new Error('Connection pool timeout'));
      }, timeout);
    });
  }

  release(connection) {
    if (this.active.has(connection)) {
      this.active.delete(connection);
      this.available.push(connection);
    }
  }

  getStats() {
    return {
      total: this.connections.length,
      available: this.available.length,
      active: this.active.size
    };
  }

  shutdown() {
    // Close all connections
    this.connections.forEach(conn => {
      if (conn.handle && conn.handle.close) {
        conn.handle.close();
      }
    });
    
    this.connections = [];
    this.available = [];
    this.active.clear();
  }
}

module.exports = {
  AdvancedConnectionManager,
  ConnectionState,
  ConnectionType,
  LoadBalancer,
  CircuitBreaker,
  ConnectionPool
};