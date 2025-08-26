/**
 * Executive Scalability Manager
 * Horizontal scaling, load balancing, and cluster management
 */

const cluster = require('cluster');
const os = require('os');
const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Scaling strategies
 */
const ScalingStrategy = {
  REACTIVE: 'reactive',
  PREDICTIVE: 'predictive',
  SCHEDULED: 'scheduled',
  MANUAL: 'manual',
  HYBRID: 'hybrid'
};

/**
 * Load balancing algorithms
 */
const LoadBalancingAlgorithm = {
  ROUND_ROBIN: 'round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  IP_HASH: 'ip_hash',
  LEAST_RESPONSE_TIME: 'least_response_time',
  RANDOM: 'random',
  CONSISTENT_HASH: 'consistent_hash'
};

class ScalabilityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      minInstances: 2,
      maxInstances: 100,
      targetCPU: 70,
      targetMemory: 80,
      targetResponseTime: 100,
      scaleUpThreshold: 80,
      scaleDownThreshold: 20,
      cooldownPeriod: 300000, // 5 minutes
      healthCheckInterval: 30000,
      strategy: ScalingStrategy.HYBRID,
      loadBalancingAlgorithm: LoadBalancingAlgorithm.LEAST_RESPONSE_TIME,
      enableAutoScaling: true,
      enableConnectionPooling: true,
      maxConnectionsPerInstance: 1000,
      ...config
    };
    
    // Cluster management
    this.workers = new Map();
    this.instances = new Map();
    this.connectionPools = new Map();
    
    // Load balancer state
    this.loadBalancer = {
      algorithm: this.config.loadBalancingAlgorithm,
      currentIndex: 0,
      weights: new Map(),
      connections: new Map(),
      responseTimes: new Map()
    };
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      currentInstances: 0,
      scalingEvents: [],
      loadDistribution: new Map()
    };
    
    // Auto-scaling state
    this.scalingState = {
      lastScaleTime: 0,
      pendingScale: null,
      currentLoad: 0,
      predictedLoad: 0
    };
    
    // Sharding configuration
    this.sharding = {
      enabled: false,
      shards: 4,
      strategy: 'hash',
      distribution: new Map()
    };
    
    this.initialize();
  }

  /**
   * Initialize scalability manager
   */
  async initialize() {
    logger.info('🟢 Initializing Scalability Manager');
    
    if (cluster.isMaster) {
      await this.initializeMaster();
    } else {
      await this.initializeWorker();
    }
  }

  /**
   * Initialize master process
   */
  async initializeMaster() {
    // Start initial instances
    await this.startInitialInstances();
    
    // Setup cluster management
    this.setupClusterManagement();
    
    // Initialize load balancer
    this.initializeLoadBalancer();
    
    // Setup connection pooling
    if (this.config.enableConnectionPooling) {
      this.setupConnectionPooling();
    }
    
    // Start auto-scaling
    if (this.config.enableAutoScaling) {
      this.startAutoScaling();
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Setup sharding if enabled
    if (this.sharding.enabled) {
      this.setupSharding();
    }
    
    logger.info(`🏁 Master process initialized with ${this.workers.size} workers`);
  }

  /**
   * Initialize worker process
   */
  async initializeWorker() {
    process.on('message', (msg) => {
      this.handleWorkerMessage(msg);
    });
    
    // Report readiness
    process.send({ type: 'ready', pid: process.pid });
    
    logger.info(`🏁 Worker ${process.pid} initialized`);
  }

  /**
   * Start initial instances
   */
  async startInitialInstances() {
    const numCPUs = os.cpus().length;
    const initialInstances = Math.min(
      Math.max(this.config.minInstances, Math.floor(numCPUs / 2)),
      this.config.maxInstances
    );
    
    for (let i = 0; i < initialInstances; i++) {
      await this.spawnInstance();
    }
    
    this.metrics.currentInstances = initialInstances;
  }

  /**
   * Spawn new instance
   */
  async spawnInstance() {
    if (this.workers.size >= this.config.maxInstances) {
      logger.warn('Maximum instances reached');
      return null;
    }
    
    const worker = cluster.fork();
    const instanceId = `instance_${worker.id}`;
    
    const instance = {
      id: instanceId,
      workerId: worker.id,
      pid: worker.process.pid,
      status: 'starting',
      startTime: Date.now(),
      requests: 0,
      connections: 0,
      cpu: 0,
      memory: 0,
      responseTime: 0,
      health: 100
    };
    
    this.workers.set(worker.id, worker);
    this.instances.set(instanceId, instance);
    
    // Initialize load balancer entries
    this.loadBalancer.connections.set(instanceId, 0);
    this.loadBalancer.responseTimes.set(instanceId, 100);
    this.loadBalancer.weights.set(instanceId, 1);
    
    worker.on('message', (msg) => {
      this.handleInstanceMessage(instanceId, msg);
    });
    
    worker.on('exit', (code, signal) => {
      this.handleInstanceExit(instanceId, code, signal);
    });
    
    this.emit('instance:spawned', { instanceId, pid: worker.process.pid });
    
    logger.info(`🔄 Spawned instance ${instanceId} (PID: ${worker.process.pid})`);
    
    return instanceId;
  }

  /**
   * Setup cluster management
   */
  setupClusterManagement() {
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.id} died (${signal || code})`);
      
      // Remove from tracking
      this.workers.delete(worker.id);
      const instanceId = `instance_${worker.id}`;
      this.instances.delete(instanceId);
      
      // Respawn if needed
      if (this.workers.size < this.config.minInstances) {
        this.spawnInstance();
      }
    });
    
    cluster.on('disconnect', (worker) => {
      logger.warn(`Worker ${worker.id} disconnected`);
    });
  }

  /**
   * Initialize load balancer
   */
  initializeLoadBalancer() {
    // Setup load balancing based on algorithm
    switch (this.config.loadBalancingAlgorithm) {
      case LoadBalancingAlgorithm.WEIGHTED_ROUND_ROBIN:
        this.initializeWeightedRoundRobin();
        break;
      case LoadBalancingAlgorithm.CONSISTENT_HASH:
        this.initializeConsistentHashing();
        break;
      default:
        // Default setup
        break;
    }
  }

  /**
   * Route request to instance
   */
  async routeRequest(request) {
    const instanceId = this.selectInstance(request);
    
    if (!instanceId) {
      throw new Error('No available instances');
    }
    
    const instance = this.instances.get(instanceId);
    const workerId = instance.workerId;
    const worker = this.workers.get(workerId);
    
    // Update metrics
    instance.requests++;
    instance.connections++;
    this.metrics.totalRequests++;
    
    // Track load distribution
    const currentCount = this.metrics.loadDistribution.get(instanceId) || 0;
    this.metrics.loadDistribution.set(instanceId, currentCount + 1);
    
    // Send request to worker
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Setup timeout
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
        instance.connections--;
      }, 30000);
      
      // Setup response handler
      const responseHandler = (msg) => {
        if (msg.type === 'response' && msg.requestId === requestId) {
          clearTimeout(timeout);
          instance.connections--;
          
          // Update response time
          const responseTime = Date.now() - msg.startTime;
          this.updateResponseTime(instanceId, responseTime);
          
          resolve(msg.result);
        }
      };
      
      worker.once('message', responseHandler);
      
      // Send request
      worker.send({
        type: 'request',
        requestId,
        data: request,
        startTime: Date.now()
      });
    });
  }

  /**
   * Select instance based on load balancing algorithm
   */
  selectInstance(request) {
    const availableInstances = Array.from(this.instances.entries())
      .filter(([id, instance]) => 
        instance.status === 'ready' && 
        instance.connections < this.config.maxConnectionsPerInstance
      );
    
    if (availableInstances.length === 0) {
      return null;
    }
    
    switch (this.loadBalancer.algorithm) {
      case LoadBalancingAlgorithm.ROUND_ROBIN:
        return this.selectRoundRobin(availableInstances);
        
      case LoadBalancingAlgorithm.LEAST_CONNECTIONS:
        return this.selectLeastConnections(availableInstances);
        
      case LoadBalancingAlgorithm.LEAST_RESPONSE_TIME:
        return this.selectLeastResponseTime(availableInstances);
        
      case LoadBalancingAlgorithm.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(availableInstances);
        
      case LoadBalancingAlgorithm.IP_HASH:
        return this.selectIPHash(availableInstances, request);
        
      case LoadBalancingAlgorithm.CONSISTENT_HASH:
        return this.selectConsistentHash(availableInstances, request);
        
      case LoadBalancingAlgorithm.RANDOM:
        return this.selectRandom(availableInstances);
        
      default:
        return availableInstances[0][0];
    }
  }

  /**
   * Round-robin selection
   */
  selectRoundRobin(instances) {
    const index = this.loadBalancer.currentIndex % instances.length;
    this.loadBalancer.currentIndex++;
    return instances[index][0];
  }

  /**
   * Least connections selection
   */
  selectLeastConnections(instances) {
    let minConnections = Infinity;
    let selectedId = null;
    
    for (const [id, instance] of instances) {
      if (instance.connections < minConnections) {
        minConnections = instance.connections;
        selectedId = id;
      }
    }
    
    return selectedId;
  }

  /**
   * Least response time selection
   */
  selectLeastResponseTime(instances) {
    let minTime = Infinity;
    let selectedId = null;
    
    for (const [id, instance] of instances) {
      const responseTime = this.loadBalancer.responseTimes.get(id) || Infinity;
      if (responseTime < minTime) {
        minTime = responseTime;
        selectedId = id;
      }
    }
    
    return selectedId;
  }

  /**
   * Weighted round-robin selection
   */
  selectWeightedRoundRobin(instances) {
    const weights = instances.map(([id]) => this.loadBalancer.weights.get(id) || 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < instances.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return instances[i][0];
      }
    }
    
    return instances[instances.length - 1][0];
  }

  /**
   * IP hash selection
   */
  selectIPHash(instances, request) {
    const hash = this.hashString(request.clientIp || 'default');
    const index = hash % instances.length;
    return instances[index][0];
  }

  /**
   * Consistent hash selection
   */
  selectConsistentHash(instances, request) {
    const key = request.key || request.id || 'default';
    const hash = this.hashString(key);
    
    // Find the instance with the closest hash
    let minDistance = Infinity;
    let selectedId = null;
    
    for (const [id] of instances) {
      const instanceHash = this.hashString(id);
      const distance = Math.abs(instanceHash - hash);
      
      if (distance < minDistance) {
        minDistance = distance;
        selectedId = id;
      }
    }
    
    return selectedId;
  }

  /**
   * Random selection
   */
  selectRandom(instances) {
    const index = Math.floor(Math.random() * instances.length);
    return instances[index][0];
  }

  /**
   * Setup connection pooling
   */
  setupConnectionPooling() {
    for (const [instanceId] of this.instances) {
      this.connectionPools.set(instanceId, {
        connections: [],
        available: [],
        inUse: new Set(),
        maxSize: 100,
        minSize: 10
      });
      
      // Pre-create minimum connections
      const pool = this.connectionPools.get(instanceId);
      for (let i = 0; i < pool.minSize; i++) {
        const conn = this.createConnection(instanceId);
        pool.connections.push(conn);
        pool.available.push(conn);
      }
    }
    
    logger.info('📊 Connection pooling initialized');
  }

  /**
   * Create connection
   */
  createConnection(instanceId) {
    return {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instanceId,
      created: Date.now(),
      lastUsed: null,
      requests: 0
    };
  }

  /**
   * Get connection from pool
   */
  async getConnection(instanceId) {
    const pool = this.connectionPools.get(instanceId);
    
    if (!pool) {
      throw new Error(`No pool for instance ${instanceId}`);
    }
    
    // Get available connection
    let connection = pool.available.pop();
    
    // Create new if needed and under limit
    if (!connection && pool.connections.length < pool.maxSize) {
      connection = this.createConnection(instanceId);
      pool.connections.push(connection);
    }
    
    // Wait if no connections available
    if (!connection) {
      await this.waitForConnection(pool);
      connection = pool.available.pop();
    }
    
    pool.inUse.add(connection);
    connection.lastUsed = Date.now();
    connection.requests++;
    
    return connection;
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connection) {
    const pool = this.connectionPools.get(connection.instanceId);
    
    if (pool && pool.inUse.has(connection)) {
      pool.inUse.delete(connection);
      pool.available.push(connection);
    }
  }

  /**
   * Start auto-scaling
   */
  startAutoScaling() {
    this.scalingInterval = setInterval(async () => {
      await this.evaluateScaling();
    }, 30000); // Every 30 seconds
    
    logger.info('🔄 Auto-scaling started');
  }

  /**
   * Evaluate scaling needs
   */
  async evaluateScaling() {
    if (!this.canScale()) {
      return;
    }
    
    const metrics = await this.collectMetrics();
    const decision = this.makeScalingDecision(metrics);
    
    if (decision.action === 'scale_up') {
      await this.scaleUp(decision.count);
    } else if (decision.action === 'scale_down') {
      await this.scaleDown(decision.count);
    }
  }

  /**
   * Check if scaling is allowed
   */
  canScale() {
    const timeSinceLastScale = Date.now() - this.scalingState.lastScaleTime;
    return timeSinceLastScale >= this.config.cooldownPeriod;
  }

  /**
   * Collect scaling metrics
   */
  async collectMetrics() {
    const instances = Array.from(this.instances.values());
    
    const avgCPU = instances.reduce((sum, i) => sum + i.cpu, 0) / instances.length;
    const avgMemory = instances.reduce((sum, i) => sum + i.memory, 0) / instances.length;
    const avgResponseTime = instances.reduce((sum, i) => sum + i.responseTime, 0) / instances.length;
    const totalConnections = instances.reduce((sum, i) => sum + i.connections, 0);
    
    return {
      avgCPU,
      avgMemory,
      avgResponseTime,
      totalConnections,
      instanceCount: instances.length
    };
  }

  /**
   * Make scaling decision
   */
  makeScalingDecision(metrics) {
    // Check if scale up needed
    if (metrics.avgCPU > this.config.scaleUpThreshold ||
        metrics.avgMemory > this.config.scaleUpThreshold ||
        metrics.avgResponseTime > this.config.targetResponseTime * 1.5) {
      
      const targetInstances = Math.min(
        this.config.maxInstances,
        Math.ceil(metrics.instanceCount * 1.5)
      );
      
      return {
        action: 'scale_up',
        count: targetInstances - metrics.instanceCount,
        reason: 'high_load'
      };
    }
    
    // Check if scale down needed
    if (metrics.avgCPU < this.config.scaleDownThreshold &&
        metrics.avgMemory < this.config.scaleDownThreshold &&
        metrics.avgResponseTime < this.config.targetResponseTime * 0.5) {
      
      const targetInstances = Math.max(
        this.config.minInstances,
        Math.floor(metrics.instanceCount * 0.75)
      );
      
      return {
        action: 'scale_down',
        count: metrics.instanceCount - targetInstances,
        reason: 'low_load'
      };
    }
    
    return { action: 'none' };
  }

  /**
   * Scale up instances
   */
  async scaleUp(count) {
    logger.info(`📈 Scaling up by ${count} instances`);
    
    const spawned = [];
    for (let i = 0; i < count; i++) {
      const instanceId = await this.spawnInstance();
      if (instanceId) {
        spawned.push(instanceId);
      }
    }
    
    this.scalingState.lastScaleTime = Date.now();
    this.metrics.currentInstances = this.instances.size;
    
    this.metrics.scalingEvents.push({
      timestamp: Date.now(),
      action: 'scale_up',
      count: spawned.length,
      newTotal: this.instances.size
    });
    
    this.emit('scaling:complete', {
      action: 'scale_up',
      instances: spawned
    });
  }

  /**
   * Scale down instances
   */
  async scaleDown(count) {
    logger.info(`📉 Scaling down by ${count} instances`);
    
    // Select instances to terminate (least loaded)
    const instancesToTerminate = Array.from(this.instances.entries())
      .sort((a, b) => a[1].connections - b[1].connections)
      .slice(0, count)
      .map(([id]) => id);
    
    for (const instanceId of instancesToTerminate) {
      await this.terminateInstance(instanceId);
    }
    
    this.scalingState.lastScaleTime = Date.now();
    this.metrics.currentInstances = this.instances.size;
    
    this.metrics.scalingEvents.push({
      timestamp: Date.now(),
      action: 'scale_down',
      count: instancesToTerminate.length,
      newTotal: this.instances.size
    });
    
    this.emit('scaling:complete', {
      action: 'scale_down',
      instances: instancesToTerminate
    });
  }

  /**
   * Terminate instance
   */
  async terminateInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    
    if (!instance) {
      return;
    }
    
    // Graceful shutdown
    instance.status = 'terminating';
    
    // Wait for connections to drain
    await this.drainConnections(instanceId);
    
    // Kill worker
    const worker = this.workers.get(instance.workerId);
    if (worker) {
      worker.kill();
    }
    
    // Cleanup
    this.instances.delete(instanceId);
    this.workers.delete(instance.workerId);
    this.connectionPools.delete(instanceId);
    
    logger.info(`🔴 Terminated instance ${instanceId}`);
  }

  /**
   * Setup sharding
   */
  setupSharding() {
    // Initialize shards
    for (let i = 0; i < this.sharding.shards; i++) {
      this.sharding.distribution.set(i, []);
    }
    
    // Distribute instances across shards
    let shardIndex = 0;
    for (const [instanceId] of this.instances) {
      const shard = this.sharding.distribution.get(shardIndex);
      shard.push(instanceId);
      shardIndex = (shardIndex + 1) % this.sharding.shards;
    }
    
    logger.info(`🟡 Sharding initialized with ${this.sharding.shards} shards`);
  }

  /**
   * Get shard for data
   */
  getShard(key) {
    if (!this.sharding.enabled) {
      return null;
    }
    
    const hash = this.hashString(key);
    const shardIndex = hash % this.sharding.shards;
    
    return this.sharding.distribution.get(shardIndex);
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthInterval = setInterval(async () => {
      await this.checkInstanceHealth();
    }, this.config.healthCheckInterval);
  }

  /**
   * Check instance health
   */
  async checkInstanceHealth() {
    for (const [instanceId, instance] of this.instances) {
      // Simulate health check
      instance.cpu = Math.random() * 100;
      instance.memory = Math.random() * 100;
      instance.responseTime = 50 + Math.random() * 150;
      
      // Calculate health score
      const cpuHealth = 100 - instance.cpu;
      const memHealth = 100 - instance.memory;
      const respHealth = Math.max(0, 100 - (instance.responseTime / 2));
      
      instance.health = (cpuHealth + memHealth + respHealth) / 3;
      
      // Update status
      if (instance.health < 50) {
        instance.status = 'degraded';
      } else if (instance.status !== 'ready') {
        instance.status = 'ready';
      }
      
      // Restart unhealthy instances
      if (instance.health < 20) {
        await this.restartInstance(instanceId);
      }
    }
  }

  /**
   * Restart instance
   */
  async restartInstance(instanceId) {
    logger.warn(`🔄 Restarting unhealthy instance ${instanceId}`);
    
    await this.terminateInstance(instanceId);
    await this.spawnInstance();
  }

  /**
   * Helper methods
   */
  
  handleInstanceMessage(instanceId, msg) {
    const instance = this.instances.get(instanceId);
    
    if (!instance) return;
    
    switch (msg.type) {
      case 'ready':
        instance.status = 'ready';
        break;
      case 'metrics':
        instance.cpu = msg.cpu;
        instance.memory = msg.memory;
        break;
      case 'error':
        logger.error(`Instance ${instanceId} error: ${msg.error}`);
        break;
    }
  }
  
  handleInstanceExit(instanceId, code, signal) {
    logger.warn(`Instance ${instanceId} exited: ${signal || code}`);
    this.instances.delete(instanceId);
  }
  
  handleWorkerMessage(msg) {
    // Worker process message handling
    if (msg.type === 'request') {
      // Process request
      const result = this.processRequest(msg.data);
      
      // Send response
      process.send({
        type: 'response',
        requestId: msg.requestId,
        result,
        startTime: msg.startTime
      });
    }
  }
  
  processRequest(data) {
    // Simulate request processing
    return {
      processed: true,
      timestamp: Date.now(),
      data
    };
  }
  
  updateResponseTime(instanceId, responseTime) {
    const current = this.loadBalancer.responseTimes.get(instanceId) || 100;
    const updated = current * 0.7 + responseTime * 0.3; // Exponential moving average
    this.loadBalancer.responseTimes.set(instanceId, updated);
  }
  
  async drainConnections(instanceId) {
    const instance = this.instances.get(instanceId);
    
    if (!instance) return;
    
    // Wait for connections to close
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (instance.connections > 0 && Date.now() - startTime < maxWait) {
      await this.delay(1000);
    }
  }
  
  async waitForConnection(pool) {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (pool.available.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
  
  initializeWeightedRoundRobin() {
    // Set initial weights based on instance capacity
    for (const [instanceId] of this.instances) {
      this.loadBalancer.weights.set(instanceId, 1);
    }
  }
  
  initializeConsistentHashing() {
    // Initialize consistent hash ring
    // Implementation would go here
  }
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get scalability status
   */
  getStatus() {
    return {
      instances: this.instances.size,
      workers: this.workers.size,
      minInstances: this.config.minInstances,
      maxInstances: this.config.maxInstances,
      loadBalancer: {
        algorithm: this.loadBalancer.algorithm,
        totalRequests: this.metrics.totalRequests,
        distribution: Object.fromEntries(this.metrics.loadDistribution)
      },
      scaling: {
        enabled: this.config.enableAutoScaling,
        strategy: this.config.strategy,
        lastScaleTime: this.scalingState.lastScaleTime,
        events: this.metrics.scalingEvents.slice(-10)
      },
      connectionPools: this.connectionPools.size,
      sharding: this.sharding.enabled ? {
        shards: this.sharding.shards,
        distribution: Object.fromEntries(this.sharding.distribution)
      } : null,
      metrics: this.metrics
    };
  }
  
  /**
   * Shutdown scalability manager
   */
  shutdown() {
    if (this.scalingInterval) clearInterval(this.scalingInterval);
    if (this.healthInterval) clearInterval(this.healthInterval);
    
    // Terminate all workers
    for (const [, worker] of this.workers) {
      worker.kill();
    }
    
    logger.info('🔌 Scalability Manager shut down');
  }
}

module.exports = {
  ScalabilityManager,
  ScalingStrategy,
  LoadBalancingAlgorithm
};