/**
 * BUMBA Load Balancer
 * Distributes work across specialists and departments
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getResourceOptimizer } = require('./resource-optimizer');
const { getInstance: getPerformanceMonitor } = require('./performance-monitor');

class LoadBalancer {
  constructor() {
    this.resourceOptimizer = getResourceOptimizer();
    this.performanceMonitor = getPerformanceMonitor();
    
    // Worker pools
    this.specialistPools = new Map();
    this.departmentQueues = new Map();
    
    // Load balancing strategies
    this.strategies = {
      'round-robin': new RoundRobinStrategy(),
      'least-loaded': new LeastLoadedStrategy(),
      'weighted': new WeightedStrategy(),
      'priority': new PriorityStrategy(),
      'adaptive': new AdaptiveStrategy()
    };
    
    this.currentStrategy = 'adaptive';
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      balancedRequests: 0,
      queuedRequests: 0,
      completedRequests: 0,
      averageWaitTime: 0,
      averageProcessTime: 0
    };
    
    // Configuration
    this.config = {
      maxQueueSize: 100,
      maxWaitTime: 30000, // 30 seconds
      rebalanceInterval: 5000, // 5 seconds
      healthCheckInterval: 10000 // 10 seconds
    };
    
    this.initializeBalancer();
  }

  /**
   * Initialize load balancer
   */
  initializeBalancer() {
    // Start rebalancing interval
    this.rebalanceInterval = setInterval(() => {
      this.rebalance();
    }, this.config.rebalanceInterval);
    
    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    logger.info('⚖️ Load balancer initialized');
  }

  /**
   * Balance request to appropriate handler
   */
  async balance(request, context = {}) {
    this.metrics.totalRequests++;
    const startTime = Date.now();
    
    // Determine request type and priority
    const requestInfo = this.analyzeRequest(request, context);
    
    // Select strategy based on context
    const strategy = this.selectStrategy(requestInfo, context);
    
    // Find best handler
    const handler = await this.findBestHandler(requestInfo, strategy);
    
    if (!handler) {
      // Queue request if no handler available
      return this.queueRequest(request, requestInfo, context);
    }
    
    // Assign request to handler
    const result = await this.assignToHandler(handler, request, context);
    
    // Update metrics
    const endTime = Date.now();
    this.updateMetrics(startTime, endTime, result);
    
    return result;
  }

  /**
   * Analyze request characteristics
   */
  analyzeRequest(request, context) {
    const info = {
      type: this.detectRequestType(request),
      priority: this.calculatePriority(request, context),
      estimatedTime: this.estimateProcessingTime(request),
      requiredSpecialists: this.identifyRequiredSpecialists(request),
      department: this.identifyDepartment(request),
      complexity: this.calculateComplexity(request)
    };
    
    return info;
  }

  /**
   * Detect request type
   */
  detectRequestType(request) {
    if (request.command) {
      if (['implement', 'build', 'create'].includes(request.command)) {
        return 'implementation';
      }
      if (['analyze', 'review', 'audit'].includes(request.command)) {
        return 'analysis';
      }
      if (['design', 'architect', 'plan'].includes(request.command)) {
        return 'design';
      }
    }
    return 'general';
  }

  /**
   * Calculate request priority
   */
  calculatePriority(request, context) {
    let priority = 5; // Default medium priority
    
    // Urgent requests
    if (context.urgent || request.urgent) {
      priority = 10;
    }
    
    // Mode-based priority
    if (context.mode === 'turbo') {
      priority += 2;
    } else if (context.mode === 'eco') {
      priority -= 2;
    }
    
    // Command-based priority
    if (request.command === 'fix' || request.command === 'debug') {
      priority += 3;
    }
    
    return Math.min(10, Math.max(1, priority));
  }

  /**
   * Estimate processing time
   */
  estimateProcessingTime(request) {
    // Get historical data
    const stats = this.performanceMonitor.metrics.commands.get(request.command);
    
    if (stats && stats.averageTime) {
      return stats.averageTime;
    }
    
    // Default estimates
    const estimates = {
      'implementation': 15000,
      'analysis': 10000,
      'design': 12000,
      'general': 5000
    };
    
    return estimates[this.detectRequestType(request)] || 5000;
  }

  /**
   * Identify required specialists
   */
  identifyRequiredSpecialists(request) {
    const specialists = [];
    
    // Command-based specialists
    const commandSpecialists = {
      'api': ['api-specialist', 'backend-engineer'],
      'database': ['database-architect', 'data-engineer'],
      'ui': ['ui-designer', 'frontend-developer'],
      'test': ['test-engineer', 'qa-specialist']
    };
    
    if (commandSpecialists[request.command]) {
      specialists.push(...commandSpecialists[request.command]);
    }
    
    return specialists;
  }

  /**
   * Identify department
   */
  identifyDepartment(request) {
    const departmentMap = {
      'prd': 'product',
      'requirements': 'product',
      'design': 'design',
      'ui': 'design',
      'api': 'backend',
      'database': 'backend',
      'implement': 'backend'
    };
    
    return departmentMap[request.command] || 'general';
  }

  /**
   * Calculate complexity
   */
  calculateComplexity(request) {
    let complexity = 1;
    
    if (request.args && request.args.length > 3) complexity++;
    if (request.files && request.files.length > 5) complexity++;
    if (request.dependencies && request.dependencies.length > 10) complexity++;
    
    return Math.min(5, complexity);
  }

  /**
   * Select load balancing strategy
   */
  selectStrategy(requestInfo, context) {
    // Priority requests use priority strategy
    if (requestInfo.priority >= 8) {
      return this.strategies['priority'];
    }
    
    // High complexity uses least-loaded
    if (requestInfo.complexity >= 4) {
      return this.strategies['least-loaded'];
    }
    
    // Default to adaptive
    return this.strategies[this.currentStrategy];
  }

  /**
   * Find best handler for request
   */
  async findBestHandler(requestInfo, strategy) {
    // Get available handlers
    const handlers = await this.getAvailableHandlers(requestInfo);
    
    if (handlers.length === 0) {
      return null;
    }
    
    // Apply strategy to select handler
    return strategy.select(handlers, requestInfo);
  }

  /**
   * Get available handlers
   */
  async getAvailableHandlers(requestInfo) {
    const handlers = [];
    
    // Check specialist pools
    for (const specialist of requestInfo.requiredSpecialists) {
      const pool = this.getOrCreatePool(specialist);
      const available = pool.workers.filter(w => !w.busy && w.healthy);
      handlers.push(...available);
    }
    
    // Check department queues
    const deptQueue = this.departmentQueues.get(requestInfo.department);
    if (deptQueue && deptQueue.handlers) {
      const available = deptQueue.handlers.filter(h => !h.busy);
      handlers.push(...available);
    }
    
    return handlers;
  }

  /**
   * Get or create specialist pool
   */
  getOrCreatePool(specialist) {
    if (!this.specialistPools.has(specialist)) {
      this.specialistPools.set(specialist, {
        name: specialist,
        workers: this.createWorkers(specialist),
        queue: [],
        metrics: {
          processed: 0,
          failed: 0,
          averageTime: 0
        }
      });
    }
    
    return this.specialistPools.get(specialist);
  }

  /**
   * Create workers for specialist
   */
  createWorkers(specialist) {
    const workerCount = this.determineWorkerCount(specialist);
    const workers = [];
    
    for (let i = 0; i < workerCount; i++) {
      workers.push({
        id: `${specialist}-${i}`,
        specialist,
        busy: false,
        healthy: true,
        load: 0,
        processed: 0,
        errors: 0
      });
    }
    
    return workers;
  }

  /**
   * Determine worker count
   */
  determineWorkerCount(specialist) {
    // Base count on specialist type
    const counts = {
      'api-specialist': 3,
      'database-architect': 2,
      'ui-designer': 2,
      'test-engineer': 3,
      'backend-engineer': 4,
      'frontend-developer': 3
    };
    
    return counts[specialist] || 2;
  }

  /**
   * Assign request to handler
   */
  async assignToHandler(handler, request, context) {
    handler.busy = true;
    handler.load++;
    
    try {
      // Process request
      const result = await this.processWithHandler(handler, request, context);
      
      handler.processed++;
      this.metrics.completedRequests++;
      
      return result;
    } catch (error) {
      handler.errors++;
      logger.error(`Handler ${handler.id} error:`, error);
      throw error;
    } finally {
      handler.busy = false;
      handler.load--;
    }
  }

  /**
   * Process request with handler
   */
  async processWithHandler(handler, request, context) {
    // This would normally invoke the actual specialist
    // For now, simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      handler: handler.id,
      specialist: handler.specialist,
      request: request,
      timestamp: Date.now()
    };
  }

  /**
   * Queue request for later processing
   */
  async queueRequest(request, requestInfo, context) {
    this.metrics.queuedRequests++;
    
    const queueEntry = {
      request,
      requestInfo,
      context,
      timestamp: Date.now(),
      attempts: 0
    };
    
    // Add to department queue
    if (!this.departmentQueues.has(requestInfo.department)) {
      this.departmentQueues.set(requestInfo.department, {
        queue: [],
        handlers: []
      });
    }
    
    const deptQueue = this.departmentQueues.get(requestInfo.department);
    
    // Check queue size
    if (deptQueue.queue.length >= this.config.maxQueueSize) {
      throw new Error('Queue full - cannot accept request');
    }
    
    deptQueue.queue.push(queueEntry);
    
    logger.info(`📥 Request queued for ${requestInfo.department}`);
    
    // Try to process immediately
    this.processQueues();
    
    return {
      queued: true,
      position: deptQueue.queue.length,
      estimatedWait: this.estimateWaitTime(deptQueue)
    };
  }

  /**
   * Process queued requests
   */
  async processQueues() {
    for (const [dept, deptQueue] of this.departmentQueues.entries()) {
      while (deptQueue.queue.length > 0) {
        const entry = deptQueue.queue[0];
        
        // Check if request has waited too long
        if (Date.now() - entry.timestamp > this.config.maxWaitTime) {
          deptQueue.queue.shift();
          logger.warn(`⏱️ Request timed out in queue`);
          continue;
        }
        
        // Try to find handler
        const handler = await this.findBestHandler(entry.requestInfo, this.strategies[this.currentStrategy]);
        
        if (!handler) {
          break; // No handlers available
        }
        
        // Process request
        deptQueue.queue.shift();
        await this.assignToHandler(handler, entry.request, entry.context);
      }
    }
  }

  /**
   * Estimate wait time
   */
  estimateWaitTime(deptQueue) {
    const queueLength = deptQueue.queue.length;
    const avgProcessTime = this.metrics.averageProcessTime || 5000;
    const availableHandlers = deptQueue.handlers.filter(h => !h.busy).length || 1;
    
    return (queueLength * avgProcessTime) / availableHandlers;
  }

  /**
   * Rebalance load across handlers
   */
  rebalance() {
    // Check for imbalanced pools
    for (const pool of this.specialistPools.values()) {
      const loads = pool.workers.map(w => w.load);
      const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
      const maxLoad = Math.max(...loads);
      const minLoad = Math.min(...loads);
      
      // Rebalance if too imbalanced
      if (maxLoad - minLoad > 5) {
        this.rebalancePool(pool);
      }
    }
    
    // Process any queued requests
    this.processQueues();
  }

  /**
   * Rebalance specific pool
   */
  rebalancePool(pool) {
    logger.debug(`🔄 Rebalancing pool: ${pool.name}`);
    
    // Sort workers by load
    pool.workers.sort((a, b) => a.load - b.load);
    
    // Move work from overloaded to underloaded workers
    // This would involve actual work migration in production
  }

  /**
   * Perform health checks
   */
  performHealthChecks() {
    for (const pool of this.specialistPools.values()) {
      for (const worker of pool.workers) {
        // Check worker health
        if (worker.errors > 5) {
          worker.healthy = false;
          logger.warn(`❌ Worker ${worker.id} marked unhealthy`);
        } else if (!worker.healthy && worker.errors === 0) {
          worker.healthy = true;
          logger.info(`✅ Worker ${worker.id} recovered`);
        }
      }
    }
  }

  /**
   * Update metrics
   */
  updateMetrics(startTime, endTime, result) {
    const processTime = endTime - startTime;
    
    this.metrics.balancedRequests++;
    this.metrics.averageProcessTime = 
      (this.metrics.averageProcessTime * (this.metrics.balancedRequests - 1) + processTime) / 
      this.metrics.balancedRequests;
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    const poolStats = {};
    
    for (const [name, pool] of this.specialistPools.entries()) {
      const totalLoad = pool.workers.reduce((sum, w) => sum + w.load, 0);
      const busyWorkers = pool.workers.filter(w => w.busy).length;
      
      poolStats[name] = {
        workers: pool.workers.length,
        busy: busyWorkers,
        load: totalLoad,
        queued: pool.queue.length,
        processed: pool.metrics.processed
      };
    }
    
    return {
      strategy: this.currentStrategy,
      requests: {
        total: this.metrics.totalRequests,
        balanced: this.metrics.balancedRequests,
        queued: this.metrics.queuedRequests,
        completed: this.metrics.completedRequests
      },
      performance: {
        averageWait: `${this.metrics.averageWaitTime.toFixed(0)}ms`,
        averageProcess: `${this.metrics.averageProcessTime.toFixed(0)}ms`
      },
      pools: poolStats,
      queues: Object.fromEntries(
        Array.from(this.departmentQueues.entries()).map(([dept, q]) => [
          dept,
          { length: q.queue.length }
        ])
      )
    };
  }

  /**
   * Stop load balancer
   */
  stop() {
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    logger.info('⚖️ Load balancer stopped');
  }
}

/**
 * Load balancing strategies
 */

class RoundRobinStrategy {
  constructor() {
    this.index = 0;
  }
  
  select(handlers) {
    const handler = handlers[this.index % handlers.length];
    this.index++;
    return handler;
  }
}

class LeastLoadedStrategy {
  select(handlers) {
    return handlers.reduce((min, handler) => 
      handler.load < min.load ? handler : min
    );
  }
}

class WeightedStrategy {
  select(handlers, requestInfo) {
    // Weight by specialist match and load
    const weighted = handlers.map(h => ({
      handler: h,
      weight: (1 / (h.load + 1)) * (h.specialist === requestInfo.requiredSpecialists[0] ? 2 : 1)
    }));
    
    weighted.sort((a, b) => b.weight - a.weight);
    return weighted[0].handler;
  }
}

class PriorityStrategy {
  select(handlers, requestInfo) {
    // Prioritize by request priority and handler availability
    const prioritized = handlers.filter(h => !h.busy && h.healthy);
    
    if (prioritized.length === 0) {
      return handlers[0]; // Fallback to first handler
    }
    
    return prioritized[0];
  }
}

class AdaptiveStrategy {
  constructor() {
    this.strategies = {
      'round-robin': new RoundRobinStrategy(),
      'least-loaded': new LeastLoadedStrategy(),
      'weighted': new WeightedStrategy()
    };
  }
  
  select(handlers, requestInfo) {
    // Adapt strategy based on conditions
    if (handlers.length === 1) {
      return handlers[0];
    }
    
    const loads = handlers.map(h => h.load);
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    
    // Use least-loaded if load is imbalanced
    if (Math.max(...loads) - Math.min(...loads) > 3) {
      return this.strategies['least-loaded'].select(handlers);
    }
    
    // Use weighted for complex requests
    if (requestInfo.complexity >= 3) {
      return this.strategies['weighted'].select(handlers, requestInfo);
    }
    
    // Default to round-robin
    return this.strategies['round-robin'].select(handlers);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  LoadBalancer,
  getInstance: () => {
    if (!instance) {
      instance = new LoadBalancer();
    }
    return instance;
  }
};