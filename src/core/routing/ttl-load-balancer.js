/**
 * TTL Load Balancer Integration
 * Distributes tasks across specialists based on load and TTL requirements
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Load Balancing Algorithms
 */
const ALGORITHMS = {
  ROUND_ROBIN: 'round-robin',
  WEIGHTED_ROUND_ROBIN: 'weighted-round-robin',
  LEAST_CONNECTIONS: 'least-connections',
  LEAST_RESPONSE_TIME: 'least-response-time',
  ADAPTIVE: 'adaptive',
  TTL_AWARE: 'ttl-aware'
};

/**
 * Specialist Node
 */
class SpecialistNode {
  constructor(id, type, capacity = 10) {
    this.id = id;
    this.type = type;
    this.capacity = capacity;
    this.currentLoad = 0;
    this.activeTasks = new Set();
    this.weight = 1.0;
    this.healthy = true;
    this.performance = {
      avgResponseTime: 0,
      successRate: 1.0,
      tasksCompleted: 0,
      tasksInProgress: 0
    };
    this.lastAssigned = 0;
    this.metadata = {};
  }
  
  getLoadFactor() {
    return this.currentLoad / this.capacity;
  }
  
  isAvailable() {
    return this.healthy && this.currentLoad < this.capacity;
  }
  
  assignTask(taskId) {
    if (!this.isAvailable()) return false;
    
    this.activeTasks.add(taskId);
    this.currentLoad++;
    this.performance.tasksInProgress++;
    this.lastAssigned = Date.now();
    
    return true;
  }
  
  completeTask(taskId, duration, success = true) {
    if (!this.activeTasks.has(taskId)) return false;
    
    this.activeTasks.delete(taskId);
    this.currentLoad = Math.max(0, this.currentLoad - 1);
    this.performance.tasksInProgress = Math.max(0, this.performance.tasksInProgress - 1);
    this.performance.tasksCompleted++;
    
    // Update performance metrics
    this.updatePerformance(duration, success);
    
    return true;
  }
  
  updatePerformance(duration, success) {
    // Update average response time
    const total = this.performance.tasksCompleted;
    this.performance.avgResponseTime = 
      (this.performance.avgResponseTime * (total - 1) + duration) / total;
    
    // Update success rate
    if (!success) {
      this.performance.successRate = 
        (this.performance.successRate * (total - 1) + 0) / total;
    } else {
      this.performance.successRate = 
        (this.performance.successRate * (total - 1) + 1) / total;
    }
    
    // Update weight based on performance
    this.updateWeight();
  }
  
  updateWeight() {
    // Weight based on success rate and response time
    const successWeight = this.performance.successRate;
    const speedWeight = Math.max(0.1, 1 - (this.performance.avgResponseTime / 10000));
    const loadWeight = Math.max(0.1, 1 - this.getLoadFactor());
    
    this.weight = (successWeight * 0.4 + speedWeight * 0.3 + loadWeight * 0.3);
  }
  
  markUnhealthy() {
    this.healthy = false;
    this.weight = 0;
  }
  
  markHealthy() {
    this.healthy = true;
    this.updateWeight();
  }
  
  getScore(ttl = null) {
    if (!this.healthy) return 0;
    
    let score = this.weight;
    
    // Adjust for current load
    score *= (1 - this.getLoadFactor());
    
    // Adjust for TTL if provided
    if (ttl && this.performance.avgResponseTime > 0) {
      const ttlFit = Math.min(1, ttl / this.performance.avgResponseTime);
      score *= ttlFit;
    }
    
    return score;
  }
}

/**
 * Load Balancer Pool
 */
class LoadBalancerPool {
  constructor(name) {
    this.name = name;
    this.nodes = new Map();
    this.roundRobinIndex = 0;
    this.totalCapacity = 0;
    this.totalLoad = 0;
  }
  
  addNode(node) {
    this.nodes.set(node.id, node);
    this.totalCapacity += node.capacity;
    this.updateLoad();
  }
  
  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.totalCapacity -= node.capacity;
      this.nodes.delete(nodeId);
      this.updateLoad();
    }
  }
  
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }
  
  updateLoad() {
    this.totalLoad = 0;
    for (const node of this.nodes.values()) {
      this.totalLoad += node.currentLoad;
    }
  }
  
  getHealthyNodes() {
    return Array.from(this.nodes.values()).filter(n => n.healthy);
  }
  
  getAvailableNodes() {
    return Array.from(this.nodes.values()).filter(n => n.isAvailable());
  }
  
  getLoadFactor() {
    return this.totalCapacity > 0 ? this.totalLoad / this.totalCapacity : 0;
  }
  
  getBestNode(algorithm, ttl = null) {
    const available = this.getAvailableNodes();
    if (available.length === 0) return null;
    
    switch (algorithm) {
      case ALGORITHMS.ROUND_ROBIN:
        return this.getRoundRobinNode(available);
      
      case ALGORITHMS.WEIGHTED_ROUND_ROBIN:
        return this.getWeightedRoundRobinNode(available);
      
      case ALGORITHMS.LEAST_CONNECTIONS:
        return this.getLeastConnectionsNode(available);
      
      case ALGORITHMS.LEAST_RESPONSE_TIME:
        return this.getLeastResponseTimeNode(available);
      
      case ALGORITHMS.TTL_AWARE:
        return this.getTTLAwareNode(available, ttl);
      
      case ALGORITHMS.ADAPTIVE:
        return this.getAdaptiveNode(available, ttl);
      
      default:
        return available[0];
    }
  }
  
  getRoundRobinNode(nodes) {
    const node = nodes[this.roundRobinIndex % nodes.length];
    this.roundRobinIndex++;
    return node;
  }
  
  getWeightedRoundRobinNode(nodes) {
    // Sort by weight and last assigned
    nodes.sort((a, b) => {
      const weightDiff = b.weight - a.weight;
      if (Math.abs(weightDiff) > 0.1) return weightDiff;
      return a.lastAssigned - b.lastAssigned;
    });
    
    return nodes[0];
  }
  
  getLeastConnectionsNode(nodes) {
    return nodes.reduce((best, node) => {
      return node.currentLoad < best.currentLoad ? node : best;
    });
  }
  
  getLeastResponseTimeNode(nodes) {
    return nodes.reduce((best, node) => {
      return node.performance.avgResponseTime < best.performance.avgResponseTime ? node : best;
    });
  }
  
  getTTLAwareNode(nodes, ttl) {
    if (!ttl) return this.getLeastConnectionsNode(nodes);
    
    // Filter nodes that can meet TTL
    const capable = nodes.filter(n => n.performance.avgResponseTime <= ttl * 0.8);
    
    if (capable.length === 0) {
      // No nodes can meet TTL, get fastest
      return this.getLeastResponseTimeNode(nodes);
    }
    
    // Among capable, get least loaded
    return this.getLeastConnectionsNode(capable);
  }
  
  getAdaptiveNode(nodes, ttl) {
    // Score each node
    const scored = nodes.map(node => ({
      node,
      score: node.getScore(ttl)
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0]?.node || null;
  }
}

/**
 * Main TTL Load Balancer
 */
class TTLLoadBalancer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Algorithm settings
      algorithm: config.algorithm || ALGORITHMS.ADAPTIVE,
      enableFailover: config.enableFailover !== false,
      enableHealthChecks: config.enableHealthChecks !== false,
      
      // Load settings
      maxLoadFactor: config.maxLoadFactor || 0.9,
      loadRebalanceThreshold: config.loadRebalanceThreshold || 0.3,
      
      // Health check settings
      healthCheckInterval: config.healthCheckInterval || 10000,      // 10 seconds
      healthCheckTimeout: config.healthCheckTimeout || 5000,          // 5 seconds
      unhealthyThreshold: config.unhealthyThreshold || 3,
      healthyThreshold: config.healthyThreshold || 2,
      
      // Performance settings
      performanceWindow: config.performanceWindow || 300000,          // 5 minutes
      performanceUpdateInterval: config.performanceUpdateInterval || 30000, // 30 seconds
      
      // TTL settings
      ttlSafetyMargin: config.ttlSafetyMargin || 0.8,               // 80% of TTL
      enableTTLRouting: config.enableTTLRouting !== false
    };
    
    // Load balancer state
    this.pools = new Map();
    this.taskAssignments = new Map();
    this.healthStatus = new Map();
    this.performanceHistory = [];
    
    // Statistics
    this.statistics = {
      totalAssigned: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalRebalanced: 0,
      avgLoadFactor: 0,
      avgResponseTime: 0,
      successRate: 1.0,
      healthyNodes: 0,
      totalNodes: 0
    };
    
    // Start background processes
    this.startBackgroundProcesses();
    
    logger.info('🟡️ TTL Load Balancer initialized');
  }
  
  /**
   * Create or get pool
   */
  getOrCreatePool(poolName) {
    if (!this.pools.has(poolName)) {
      this.pools.set(poolName, new LoadBalancerPool(poolName));
    }
    return this.pools.get(poolName);
  }
  
  /**
   * Register specialist node
   */
  registerNode(poolName, nodeId, type, capacity = 10) {
    const pool = this.getOrCreatePool(poolName);
    const node = new SpecialistNode(nodeId, type, capacity);
    
    pool.addNode(node);
    this.statistics.totalNodes++;
    this.statistics.healthyNodes++;
    
    // Initialize health status
    this.healthStatus.set(nodeId, {
      healthy: true,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastCheck: Date.now()
    });
    
    logger.info(`Registered node ${nodeId} in pool ${poolName}`);
    
    this.emit('node:registered', {
      poolName,
      nodeId,
      type,
      capacity
    });
    
    return node;
  }
  
  /**
   * Unregister specialist node
   */
  unregisterNode(poolName, nodeId) {
    const pool = this.pools.get(poolName);
    if (!pool) return false;
    
    const node = pool.getNode(nodeId);
    if (!node) return false;
    
    // Reassign active tasks
    if (node.activeTasks.size > 0) {
      this.rebalanceTasks(node);
    }
    
    pool.removeNode(nodeId);
    this.statistics.totalNodes--;
    if (node.healthy) this.statistics.healthyNodes--;
    
    this.healthStatus.delete(nodeId);
    
    logger.info(`Unregistered node ${nodeId} from pool ${poolName}`);
    
    this.emit('node:unregistered', {
      poolName,
      nodeId
    });
    
    return true;
  }
  
  /**
   * Assign task to specialist
   */
  async assignTask(task, poolName, ttl = null) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      logger.error(`Pool ${poolName} not found`);
      return null;
    }
    
    // Determine algorithm to use
    const algorithm = ttl && this.config.enableTTLRouting 
      ? ALGORITHMS.TTL_AWARE 
      : this.config.algorithm;
    
    // Get best node
    const node = pool.getBestNode(algorithm, ttl);
    
    if (!node) {
      logger.warn(`No available nodes in pool ${poolName}`);
      this.statistics.totalFailed++;
      
      // Try failover if enabled
      if (this.config.enableFailover) {
        return this.attemptFailover(task, poolName, ttl);
      }
      
      return null;
    }
    
    // Assign task
    if (!node.assignTask(task.id)) {
      logger.error(`Failed to assign task ${task.id} to node ${node.id}`);
      this.statistics.totalFailed++;
      return null;
    }
    
    // Record assignment
    this.taskAssignments.set(task.id, {
      nodeId: node.id,
      poolName,
      assignedAt: Date.now(),
      ttl,
      task
    });
    
    // Update statistics
    this.statistics.totalAssigned++;
    pool.updateLoad();
    this.updateAverageLoadFactor();
    
    // Emit event
    this.emit('task:assigned', {
      taskId: task.id,
      nodeId: node.id,
      poolName,
      loadFactor: node.getLoadFactor()
    });
    
    return {
      nodeId: node.id,
      node,
      poolName,
      estimatedTime: node.performance.avgResponseTime
    };
  }
  
  /**
   * Complete task
   */
  completeTask(taskId, duration, success = true) {
    const assignment = this.taskAssignments.get(taskId);
    if (!assignment) {
      logger.warn(`No assignment found for task ${taskId}`);
      return false;
    }
    
    const pool = this.pools.get(assignment.poolName);
    const node = pool?.getNode(assignment.nodeId);
    
    if (!node) {
      logger.error(`Node ${assignment.nodeId} not found`);
      return false;
    }
    
    // Complete task on node
    node.completeTask(taskId, duration, success);
    
    // Update statistics
    if (success) {
      this.statistics.totalCompleted++;
    } else {
      this.statistics.totalFailed++;
    }
    
    this.updateAverageResponseTime(duration);
    this.updateSuccessRate(success);
    
    // Clean up assignment
    this.taskAssignments.delete(taskId);
    
    // Update pool load
    pool.updateLoad();
    this.updateAverageLoadFactor();
    
    // Record performance
    this.recordPerformance(assignment, duration, success);
    
    // Emit event
    this.emit('task:completed', {
      taskId,
      nodeId: node.id,
      duration,
      success
    });
    
    return true;
  }
  
  /**
   * Attempt failover to another pool
   */
  async attemptFailover(task, originalPool, ttl) {
    logger.info(`Attempting failover for task ${task.id}`);
    
    // Find alternative pools
    const alternativePools = Array.from(this.pools.keys())
      .filter(name => name !== originalPool);
    
    for (const poolName of alternativePools) {
      const result = await this.assignTask(task, poolName, ttl);
      if (result) {
        logger.info(`Failover successful to pool ${poolName}`);
        return result;
      }
    }
    
    logger.error(`Failover failed for task ${task.id}`);
    return null;
  }
  
  /**
   * Rebalance tasks from overloaded node
   */
  async rebalanceTasks(sourceNode) {
    const tasksToMove = Array.from(sourceNode.activeTasks);
    let moved = 0;
    
    for (const taskId of tasksToMove) {
      const assignment = this.taskAssignments.get(taskId);
      if (!assignment) continue;
      
      // Find alternative node
      const pool = this.pools.get(assignment.poolName);
      if (!pool) continue;
      
      const targetNode = pool.getBestNode(this.config.algorithm, assignment.ttl);
      if (!targetNode || targetNode.id === sourceNode.id) continue;
      
      // Move task
      sourceNode.completeTask(taskId, 0, true);
      targetNode.assignTask(taskId);
      
      // Update assignment
      assignment.nodeId = targetNode.id;
      assignment.rebalancedAt = Date.now();
      
      moved++;
      
      this.emit('task:rebalanced', {
        taskId,
        fromNode: sourceNode.id,
        toNode: targetNode.id
      });
    }
    
    this.statistics.totalRebalanced += moved;
    
    logger.info(`Rebalanced ${moved} tasks from node ${sourceNode.id}`);
    
    return moved;
  }
  
  /**
   * Check node health
   */
  async checkNodeHealth(node) {
    const healthData = this.healthStatus.get(node.id);
    if (!healthData) return;
    
    try {
      // Simulate health check (would be actual check in production)
      const healthy = node.performance.successRate > 0.5 && 
                     node.getLoadFactor() < this.config.maxLoadFactor;
      
      if (healthy) {
        healthData.consecutiveSuccesses++;
        healthData.consecutiveFailures = 0;
        
        if (!node.healthy && healthData.consecutiveSuccesses >= this.config.healthyThreshold) {
          node.markHealthy();
          this.statistics.healthyNodes++;
          
          logger.info(`Node ${node.id} marked healthy`);
          
          this.emit('node:healthy', { nodeId: node.id });
        }
      } else {
        healthData.consecutiveFailures++;
        healthData.consecutiveSuccesses = 0;
        
        if (node.healthy && healthData.consecutiveFailures >= this.config.unhealthyThreshold) {
          node.markUnhealthy();
          this.statistics.healthyNodes--;
          
          logger.warn(`Node ${node.id} marked unhealthy`);
          
          this.emit('node:unhealthy', { nodeId: node.id });
          
          // Rebalance tasks from unhealthy node
          await this.rebalanceTasks(node);
        }
      }
      
      healthData.lastCheck = Date.now();
      
    } catch (error) {
      logger.error(`Health check failed for node ${node.id}:`, error);
    }
  }
  
  /**
   * Perform load balancing
   */
  async performLoadBalancing() {
    for (const pool of this.pools.values()) {
      const nodes = pool.getHealthyNodes();
      if (nodes.length < 2) continue;
      
      // Find imbalanced nodes
      const avgLoad = pool.getLoadFactor();
      const overloaded = nodes.filter(n => 
        n.getLoadFactor() > avgLoad + this.config.loadRebalanceThreshold
      );
      const underloaded = nodes.filter(n => 
        n.getLoadFactor() < avgLoad - this.config.loadRebalanceThreshold
      );
      
      if (overloaded.length > 0 && underloaded.length > 0) {
        logger.info(`Rebalancing pool ${pool.name}`);
        
        for (const sourceNode of overloaded) {
          await this.rebalanceTasks(sourceNode);
        }
      }
    }
  }
  
  /**
   * Record performance history
   */
  recordPerformance(assignment, duration, success) {
    this.performanceHistory.push({
      timestamp: Date.now(),
      nodeId: assignment.nodeId,
      poolName: assignment.poolName,
      taskId: assignment.task.id,
      duration,
      success,
      ttl: assignment.ttl
    });
    
    // Trim history
    const cutoff = Date.now() - this.config.performanceWindow;
    this.performanceHistory = this.performanceHistory.filter(p => p.timestamp > cutoff);
  }
  
  /**
   * Update average load factor
   */
  updateAverageLoadFactor() {
    let totalLoad = 0;
    let totalCapacity = 0;
    
    for (const pool of this.pools.values()) {
      totalLoad += pool.totalLoad;
      totalCapacity += pool.totalCapacity;
    }
    
    this.statistics.avgLoadFactor = totalCapacity > 0 ? totalLoad / totalCapacity : 0;
  }
  
  /**
   * Update average response time
   */
  updateAverageResponseTime(duration) {
    const total = this.statistics.totalCompleted + this.statistics.totalFailed;
    
    if (total === 0) {
      this.statistics.avgResponseTime = duration;
    } else {
      this.statistics.avgResponseTime = 
        (this.statistics.avgResponseTime * (total - 1) + duration) / total;
    }
  }
  
  /**
   * Update success rate
   */
  updateSuccessRate(success) {
    const total = this.statistics.totalCompleted + this.statistics.totalFailed;
    
    if (total === 0) {
      this.statistics.successRate = success ? 1 : 0;
    } else {
      this.statistics.successRate = 
        (this.statistics.successRate * (total - 1) + (success ? 1 : 0)) / total;
    }
  }
  
  /**
   * Get pool status
   */
  getPoolStatus(poolName = null) {
    const status = {};
    
    const pools = poolName 
      ? [this.pools.get(poolName)].filter(Boolean)
      : Array.from(this.pools.values());
    
    for (const pool of pools) {
      status[pool.name] = {
        nodes: pool.nodes.size,
        healthy: pool.getHealthyNodes().length,
        available: pool.getAvailableNodes().length,
        loadFactor: pool.getLoadFactor(),
        totalCapacity: pool.totalCapacity,
        totalLoad: pool.totalLoad,
        nodeDetails: Array.from(pool.nodes.values()).map(node => ({
          id: node.id,
          type: node.type,
          healthy: node.healthy,
          loadFactor: node.getLoadFactor(),
          activeTasks: node.activeTasks.size,
          performance: node.performance
        }))
      };
    }
    
    return status;
  }
  
  /**
   * Get algorithm performance
   */
  getAlgorithmPerformance() {
    const performance = {};
    
    // Group by algorithm (would need tracking per algorithm in production)
    const algorithms = Object.values(ALGORITHMS);
    
    for (const algo of algorithms) {
      const algoHistory = this.performanceHistory.filter(p => {
        // Would need to track algorithm used per task
        return true; // Placeholder
      });
      
      if (algoHistory.length > 0) {
        const avgDuration = algoHistory.reduce((sum, p) => sum + p.duration, 0) / algoHistory.length;
        const successRate = algoHistory.filter(p => p.success).length / algoHistory.length;
        
        performance[algo] = {
          samples: algoHistory.length,
          avgDuration,
          successRate
        };
      }
    }
    
    return performance;
  }
  
  /**
   * Get load distribution
   */
  getLoadDistribution() {
    const distribution = {
      pools: {},
      overall: {
        balanced: true,
        variance: 0,
        suggestions: []
      }
    };
    
    for (const [poolName, pool] of this.pools) {
      const nodes = pool.getHealthyNodes();
      const loads = nodes.map(n => n.getLoadFactor());
      
      if (loads.length > 0) {
        const avg = loads.reduce((sum, l) => sum + l, 0) / loads.length;
        const variance = loads.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / loads.length;
        
        distribution.pools[poolName] = {
          avgLoad: avg,
          minLoad: Math.min(...loads),
          maxLoad: Math.max(...loads),
          variance,
          balanced: variance < 0.1
        };
        
        distribution.overall.variance += variance;
        
        if (variance > 0.2) {
          distribution.overall.balanced = false;
          distribution.overall.suggestions.push(
            `Pool ${poolName} has high load variance (${variance.toFixed(2)})`
          );
        }
      }
    }
    
    return distribution;
  }
  
  /**
   * Start background processes
   */
  startBackgroundProcesses() {
    // Health check interval
    if (this.config.enableHealthChecks) {
      this.healthCheckInterval = setInterval(async () => {
        for (const pool of this.pools.values()) {
          for (const node of pool.nodes.values()) {
            await this.checkNodeHealth(node);
          }
        }
      }, this.config.healthCheckInterval);
    }
    
    // Load balancing interval
    this.loadBalanceInterval = setInterval(async () => {
      await this.performLoadBalancing();
    }, this.config.performanceUpdateInterval);
    
    logger.debug('Background processes started');
  }
  
  /**
   * Stop background processes
   */
  stopBackgroundProcesses() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.loadBalanceInterval) {
      clearInterval(this.loadBalanceInterval);
    }
    
    logger.debug('Background processes stopped');
  }
  
  /**
   * Get load balancer status
   */
  getStatus() {
    return {
      pools: this.pools.size,
      nodes: this.statistics.totalNodes,
      healthy: this.statistics.healthyNodes,
      activeTasks: this.taskAssignments.size,
      statistics: this.statistics,
      poolStatus: this.getPoolStatus(),
      loadDistribution: this.getLoadDistribution(),
      config: {
        algorithm: this.config.algorithm,
        failover: this.config.enableFailover,
        healthChecks: this.config.enableHealthChecks,
        ttlRouting: this.config.enableTTLRouting
      }
    };
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalAssigned: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalRebalanced: 0,
      avgLoadFactor: 0,
      avgResponseTime: 0,
      successRate: 1.0,
      healthyNodes: this.statistics.healthyNodes,
      totalNodes: this.statistics.totalNodes
    };
    
    this.performanceHistory = [];
    
    logger.info('Statistics reset');
  }
  
  /**
   * Export configuration
   */
  exportConfiguration() {
    return {
      timestamp: Date.now(),
      pools: Array.from(this.pools.entries()).map(([name, pool]) => ({
        name,
        nodes: Array.from(pool.nodes.values()).map(node => ({
          id: node.id,
          type: node.type,
          capacity: node.capacity,
          weight: node.weight,
          performance: node.performance
        }))
      })),
      statistics: this.statistics,
      config: this.config
    };
  }
  
  /**
   * Import configuration
   */
  importConfiguration(data) {
    try {
      // Import pools and nodes
      if (data.pools) {
        for (const poolData of data.pools) {
          const pool = this.getOrCreatePool(poolData.name);
          
          for (const nodeData of poolData.nodes) {
            const node = new SpecialistNode(nodeData.id, nodeData.type, nodeData.capacity);
            node.weight = nodeData.weight;
            node.performance = nodeData.performance;
            pool.addNode(node);
          }
        }
      }
      
      // Import statistics
      if (data.statistics) {
        this.statistics = { ...this.statistics, ...data.statistics };
      }
      
      logger.info(`Imported ${data.pools?.length || 0} pools`);
      return true;
      
    } catch (error) {
      logger.error('Failed to import configuration:', error);
      return false;
    }
  }
  
  /**
   * Shutdown load balancer
   */
  shutdown() {
    logger.info('Shutting down TTL Load Balancer...');
    
    this.stopBackgroundProcesses();
    
    // Clear active tasks
    for (const assignment of this.taskAssignments.values()) {
      const pool = this.pools.get(assignment.poolName);
      const node = pool?.getNode(assignment.nodeId);
      if (node) {
        node.completeTask(assignment.task.id, 0, false);
      }
    }
    
    this.taskAssignments.clear();
    this.removeAllListeners();
    
    logger.info('TTL Load Balancer shutdown complete');
  }
}

module.exports = {
  TTLLoadBalancer,
  SpecialistNode,
  LoadBalancerPool,
  ALGORITHMS
};