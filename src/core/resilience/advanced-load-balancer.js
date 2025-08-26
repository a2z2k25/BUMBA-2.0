/**
 * Advanced Load Balancer - Intelligent load distribution with multiple algorithms
 * Provides sophisticated load balancing strategies for optimal resource utilization
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Load balancing algorithms
 */
const LoadBalancingAlgorithm = {
  ROUND_ROBIN: 'round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  IP_HASH: 'ip_hash',
  LEAST_RESPONSE_TIME: 'least_response_time',
  ADAPTIVE: 'adaptive',
  GEOGRAPHIC: 'geographic',
  RESOURCE_BASED: 'resource_based'
};

/**
 * Advanced Load Balancer
 */
class AdvancedLoadBalancer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      algorithm: LoadBalancingAlgorithm.ADAPTIVE,
      healthCheckInterval: 5000,
      metricsWindow: 60000,
      stickySession: false,
      sessionTimeout: 300000,
      enablePredictiveBalancing: true,
      enableGeoRouting: true,
      maxConnectionsPerNode: 1000,
      ...config
    };
    
    // Node management
    this.nodes = new Map(); // nodeId -> node info
    this.nodeMetrics = new Map(); // nodeId -> performance metrics
    this.sessionAffinity = new Map(); // sessionId -> nodeId
    
    // Algorithm state
    this.roundRobinIndex = 0;
    this.ipHashTable = new Map();
    
    // Performance tracking
    this.metrics = {
      requestsRouted: 0,
      loadDistribution: new Map(),
      averageResponseTime: 0,
      failedRoutings: 0,
      rebalanceOperations: 0
    };
    
    // Predictive balancing
    this.predictor = new LoadPredictor();
    
    // Start monitoring
    this.startHealthMonitoring();
    
    logger.info('🟡️ Advanced Load Balancer initialized', {
      algorithm: this.config.algorithm,
      predictive: this.config.enablePredictiveBalancing
    });
  }

  /**
   * Register a node for load balancing
   */
  registerNode(nodeId, nodeConfig) {
    const node = {
      id: nodeId,
      endpoint: nodeConfig.endpoint,
      weight: nodeConfig.weight || 1,
      capacity: nodeConfig.capacity || 100,
      region: nodeConfig.region || 'default',
      currentLoad: 0,
      activeConnections: 0,
      healthy: true,
      responseTime: 0,
      cpu: 0,
      memory: 0,
      registeredAt: Date.now(),
      lastHealthCheck: Date.now()
    };
    
    this.nodes.set(nodeId, node);
    this.nodeMetrics.set(nodeId, {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      history: []
    });
    
    this.emit('node:registered', { node });
    logger.info(`📍 Node registered: ${nodeId}`);
    
    return node;
  }

  /**
   * Route request to appropriate node
   */
  async route(request, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check for session affinity
      if (this.config.stickySession && context.sessionId) {
        const affinityNode = this.sessionAffinity.get(context.sessionId);
        if (affinityNode && this.isNodeHealthy(affinityNode)) {
          return this.routeToNode(affinityNode, request, context);
        }
      }
      
      // Select node based on algorithm
      const selectedNode = await this.selectNode(request, context);
      
      if (!selectedNode) {
        throw new Error('No healthy nodes available');
      }
      
      // Route to selected node
      const result = await this.routeToNode(selectedNode, request, context);
      
      // Update metrics
      this.updateMetrics(selectedNode, Date.now() - startTime, true);
      
      // Store session affinity if enabled
      if (this.config.stickySession && context.sessionId) {
        this.sessionAffinity.set(context.sessionId, selectedNode);
      }
      
      return result;
      
    } catch (error) {
      this.metrics.failedRoutings++;
      logger.error('Routing failed:', error);
      throw error;
    }
  }

  /**
   * Select node based on configured algorithm
   */
  async selectNode(request, context) {
    const healthyNodes = this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      return null;
    }
    
    switch (this.config.algorithm) {
      case LoadBalancingAlgorithm.ROUND_ROBIN:
        return this.selectRoundRobin(healthyNodes);
      
      case LoadBalancingAlgorithm.LEAST_CONNECTIONS:
        return this.selectLeastConnections(healthyNodes);
      
      case LoadBalancingAlgorithm.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(healthyNodes);
      
      case LoadBalancingAlgorithm.IP_HASH:
        return this.selectIPHash(healthyNodes, context.clientIP);
      
      case LoadBalancingAlgorithm.LEAST_RESPONSE_TIME:
        return this.selectLeastResponseTime(healthyNodes);
      
      case LoadBalancingAlgorithm.ADAPTIVE:
        return this.selectAdaptive(healthyNodes, request, context);
      
      case LoadBalancingAlgorithm.GEOGRAPHIC:
        return this.selectGeographic(healthyNodes, context.clientRegion);
      
      case LoadBalancingAlgorithm.RESOURCE_BASED:
        return this.selectResourceBased(healthyNodes);
      
      default:
        return this.selectRoundRobin(healthyNodes);
    }
  }

  /**
   * Round-robin selection
   */
  selectRoundRobin(nodes) {
    const node = nodes[this.roundRobinIndex % nodes.length];
    this.roundRobinIndex++;
    return node.id;
  }

  /**
   * Least connections selection
   */
  selectLeastConnections(nodes) {
    let minConnections = Infinity;
    let selectedNode = null;
    
    for (const node of nodes) {
      if (node.activeConnections < minConnections) {
        minConnections = node.activeConnections;
        selectedNode = node;
      }
    }
    
    return selectedNode ? selectedNode.id : null;
  }

  /**
   * Weighted round-robin selection
   */
  selectWeightedRoundRobin(nodes) {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node.id;
      }
    }
    
    return nodes[0].id;
  }

  /**
   * IP hash selection for session persistence
   */
  selectIPHash(nodes, clientIP) {
    if (!clientIP) {
      return this.selectRoundRobin(nodes);
    }
    
    const hash = this.hashIP(clientIP);
    const index = hash % nodes.length;
    return nodes[index].id;
  }

  /**
   * Least response time selection
   */
  selectLeastResponseTime(nodes) {
    let minResponseTime = Infinity;
    let selectedNode = null;
    
    for (const node of nodes) {
      if (node.responseTime < minResponseTime) {
        minResponseTime = node.responseTime;
        selectedNode = node;
      }
    }
    
    return selectedNode ? selectedNode.id : null;
  }

  /**
   * Adaptive selection using ML predictions
   */
  async selectAdaptive(nodes, request, context) {
    if (this.config.enablePredictiveBalancing) {
      const prediction = await this.predictor.predictBestNode(nodes, request, context);
      if (prediction) {
        return prediction;
      }
    }
    
    // Fallback to resource-based selection
    return this.selectResourceBased(nodes);
  }

  /**
   * Geographic selection for proximity routing
   */
  selectGeographic(nodes, clientRegion) {
    if (!clientRegion) {
      return this.selectLeastConnections(nodes);
    }
    
    // Find nodes in same region
    const regionalNodes = nodes.filter(n => n.region === clientRegion);
    
    if (regionalNodes.length > 0) {
      return this.selectLeastConnections(regionalNodes);
    }
    
    // Fallback to any node
    return this.selectLeastConnections(nodes);
  }

  /**
   * Resource-based selection
   */
  selectResourceBased(nodes) {
    let bestScore = -Infinity;
    let selectedNode = null;
    
    for (const node of nodes) {
      const score = this.calculateResourceScore(node);
      if (score > bestScore) {
        bestScore = score;
        selectedNode = node;
      }
    }
    
    return selectedNode ? selectedNode.id : null;
  }

  /**
   * Calculate resource score for node
   */
  calculateResourceScore(node) {
    const loadScore = (node.capacity - node.currentLoad) / node.capacity;
    const cpuScore = (100 - node.cpu) / 100;
    const memoryScore = (100 - node.memory) / 100;
    const responseScore = node.responseTime > 0 ? 1000 / node.responseTime : 1;
    
    return (loadScore * 0.3 + cpuScore * 0.3 + memoryScore * 0.2 + responseScore * 0.2);
  }

  /**
   * Route request to specific node
   */
  async routeToNode(nodeId, request, context) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    node.activeConnections++;
    node.currentLoad++;
    
    this.emit('request:routed', {
      nodeId,
      request,
      context
    });
    
    // Simulate routing (in production, this would make actual request)
    return {
      nodeId,
      endpoint: node.endpoint,
      routed: true,
      timestamp: Date.now()
    };
  }

  /**
   * Update node metrics
   */
  updateMetrics(nodeId, responseTime, success) {
    const node = this.nodes.get(nodeId);
    const metrics = this.nodeMetrics.get(nodeId);
    
    if (node && metrics) {
      node.activeConnections--;
      node.responseTime = (node.responseTime * 0.9) + (responseTime * 0.1);
      
      metrics.requests++;
      if (!success) metrics.errors++;
      metrics.totalResponseTime += responseTime;
      
      // Update history for predictive analysis
      metrics.history.push({
        timestamp: Date.now(),
        responseTime,
        success,
        load: node.currentLoad
      });
      
      // Keep only recent history
      const cutoff = Date.now() - this.config.metricsWindow;
      metrics.history = metrics.history.filter(h => h.timestamp > cutoff);
    }
    
    this.metrics.requestsRouted++;
  }

  /**
   * Get healthy nodes
   */
  getHealthyNodes() {
    return Array.from(this.nodes.values()).filter(node => 
      node.healthy && 
      node.activeConnections < this.config.maxConnectionsPerNode
    );
  }

  /**
   * Check if node is healthy
   */
  isNodeHealthy(nodeId) {
    const node = this.nodes.get(nodeId);
    return node && node.healthy;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all nodes
   */
  async performHealthChecks() {
    for (const [nodeId, node] of this.nodes) {
      try {
        const isHealthy = await this.checkNodeHealth(node);
        node.healthy = isHealthy;
        node.lastHealthCheck = Date.now();
        
        if (!isHealthy) {
          logger.warn(`Node unhealthy: ${nodeId}`);
          this.emit('node:unhealthy', { nodeId });
        }
      } catch (error) {
        node.healthy = false;
        logger.error(`Health check failed for ${nodeId}:`, error);
      }
    }
    
    // Trigger rebalancing if needed
    if (this.shouldRebalance()) {
      await this.rebalance();
    }
  }

  /**
   * Check individual node health
   */
  async checkNodeHealth(node) {
    // Simulate health check (in production, would make actual health request)
    return Math.random() > 0.05; // 95% healthy
  }

  /**
   * Determine if rebalancing is needed
   */
  shouldRebalance() {
    const nodes = Array.from(this.nodes.values());
    const loads = nodes.map(n => n.currentLoad);
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
    
    return variance > 100; // Rebalance if load variance is high
  }

  /**
   * Rebalance load across nodes
   */
  async rebalance() {
    logger.info('🔄 Rebalancing load across nodes');
    
    // Clear session affinity to allow redistribution
    this.sessionAffinity.clear();
    
    this.metrics.rebalanceOperations++;
    
    this.emit('load:rebalanced', {
      timestamp: Date.now(),
      nodes: this.nodes.size
    });
  }

  /**
   * Hash IP address for consistent routing
   */
  hashIP(ip) {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = ((hash << 5) - hash) + ip.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    const nodeStats = [];
    
    for (const [nodeId, node] of this.nodes) {
      const metrics = this.nodeMetrics.get(nodeId);
      nodeStats.push({
        nodeId,
        healthy: node.healthy,
        activeConnections: node.activeConnections,
        currentLoad: node.currentLoad,
        responseTime: node.responseTime,
        requests: metrics.requests,
        errors: metrics.errors,
        errorRate: metrics.requests > 0 ? metrics.errors / metrics.requests : 0
      });
    }
    
    return {
      algorithm: this.config.algorithm,
      nodes: nodeStats,
      totalRequests: this.metrics.requestsRouted,
      failedRoutings: this.metrics.failedRoutings,
      rebalanceOperations: this.metrics.rebalanceOperations,
      sessionAffinitySize: this.sessionAffinity.size
    };
  }

  /**
   * Shutdown load balancer
   */
  shutdown() {
    this.removeAllListeners();
    this.nodes.clear();
    this.nodeMetrics.clear();
    this.sessionAffinity.clear();
    
    logger.info('🟡️ Advanced Load Balancer shut down');
  }
}

/**
 * Load Predictor for adaptive balancing
 */
class LoadPredictor {
  async predictBestNode(nodes, request, context) {
    // Simplified prediction logic
    // In production, this would use ML models
    
    const scores = nodes.map(node => ({
      node,
      score: Math.random() * node.capacity
    }));
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores[0]?.node.id;
  }
}

module.exports = {
  AdvancedLoadBalancer,
  LoadBalancingAlgorithm,
  LoadPredictor
};