/**
 * TTL-Based Router for Intelligent Specialist Assignment
 * Routes tasks to specialists based on time-to-live requirements
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * TTL Tier Definitions
 */
const TTL_TIERS = {
  ULTRA_FAST: {
    id: 1,
    name: 'Ultra-Fast',
    minTTL: 0,
    maxTTL: 5000,        // 5 seconds
    priority: 4,
    source: 'cache',
    color: 'red',
    sla: 0.95,           // 95% success rate target
    description: 'Immediate response required, use cached specialists'
  },
  FAST: {
    id: 2,
    name: 'Fast',
    minTTL: 5000,
    maxTTL: 30000,       // 30 seconds
    priority: 3,
    source: 'warm_pool',
    color: 'orange',
    sla: 0.90,           // 90% success rate target
    description: 'Quick response needed, use warm pool specialists'
  },
  STANDARD: {
    id: 3,
    name: 'Standard',
    minTTL: 30000,
    maxTTL: 180000,      // 3 minutes
    priority: 2,
    source: 'cold_pool',
    color: 'yellow',
    sla: 0.85,           // 85% success rate target
    description: 'Normal processing, can warm up specialists'
  },
  EXTENDED: {
    id: 4,
    name: 'Extended',
    minTTL: 180000,
    maxTTL: Infinity,    // No upper limit
    priority: 1,
    source: 'batch',
    color: 'green',
    sla: 0.80,           // 80% success rate target
    description: 'Complex tasks, batch processing acceptable'
  }
};

/**
 * Routing Decision Structure
 */
class RoutingDecision {
  constructor(taskId, tier, specialist, metadata = {}) {
    this.taskId = taskId;
    this.tier = tier;
    this.specialist = specialist;
    this.timestamp = Date.now();
    this.metadata = metadata;
    this.ttl = metadata.ttl || tier.maxTTL;
    this.priority = metadata.priority || tier.priority;
    this.confidence = metadata.confidence || 0.8;
    this.alternativeRoutes = metadata.alternativeRoutes || [];
  }
  
  isValid() {
    return this.specialist && this.tier && this.ttl > 0;
  }
  
  getTimeRemaining() {
    const elapsed = Date.now() - this.timestamp;
    return Math.max(0, this.ttl - elapsed);
  }
  
  isExpired() {
    return this.getTimeRemaining() <= 0;
  }
}

/**
 * Priority Queue Implementation
 */
class TTLPriorityQueue {
  constructor(maxSize = 1000) {
    this.queue = [];
    this.maxSize = maxSize;
    this.processedCount = 0;
    this.droppedCount = 0;
  }
  
  enqueue(item) {
    if (this.queue.length >= this.maxSize) {
      this.droppedCount++;
      logger.warn(`Queue full, dropping task ${item.taskId}`);
      return false;
    }
    
    // Insert based on priority and TTL
    const insertIndex = this.findInsertIndex(item);
    this.queue.splice(insertIndex, 0, item);
    
    return true;
  }
  
  dequeue() {
    const item = this.queue.shift();
    if (item) {
      this.processedCount++;
    }
    return item;
  }
  
  findInsertIndex(item) {
    let left = 0;
    let right = this.queue.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midItem = this.queue[mid];
      
      // Higher priority first, then shorter TTL
      if (midItem.priority < item.priority ||
          (midItem.priority === item.priority && midItem.ttl > item.ttl)) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    
    return left;
  }
  
  peek() {
    return this.queue[0];
  }
  
  size() {
    return this.queue.length;
  }
  
  isEmpty() {
    return this.queue.length === 0;
  }
  
  clear() {
    this.queue = [];
  }
  
  getStats() {
    return {
      size: this.queue.length,
      processed: this.processedCount,
      dropped: this.droppedCount,
      utilization: this.queue.length / this.maxSize
    };
  }
  
  removeExpired() {
    const now = Date.now();
    const expired = [];
    
    this.queue = this.queue.filter(item => {
      if (item.isExpired && item.isExpired()) {
        expired.push(item);
        return false;
      }
      return true;
    });
    
    return expired;
  }
}

/**
 * Main TTL Router
 */
class TTLRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // TTL thresholds (can be overridden)
      tiers: config.tiers || TTL_TIERS,
      
      // Queue settings
      maxQueueSize: config.maxQueueSize || 1000,
      queueTimeout: config.queueTimeout || 60000,    // 1 minute
      
      // Routing behavior
      enableFallback: config.enableFallback !== false,
      enablePreemption: config.enablePreemption || false,
      enableBatching: config.enableBatching || true,
      
      // Performance tuning
      routingInterval: config.routingInterval || 100,  // 100ms
      expirationCheckInterval: config.expirationCheckInterval || 5000, // 5s
      
      // Monitoring
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 10000 // 10s
    };
    
    // Routing state
    this.queues = new Map(); // tier -> queue
    this.activeRoutes = new Map(); // taskId -> route
    this.routingHistory = [];
    this.maxHistorySize = 1000;
    
    // Tier-specific statistics
    this.tierStatistics = new Map();
    
    // Statistics
    this.statistics = {
      totalRouted: 0,
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      tierCounts: {},
      byTier: {},
      successRate: {},
      avgRoutingTime: 0,
      queuedTasks: 0,
      expiredTasks: 0,
      failedRoutes: 0
    };
    
    // Initialize tier queues
    this.initializeQueues();
    
    // Start routing engine
    this.startRoutingEngine();
    
    logger.info('🟠 TTL Router initialized');
  }
  
  /**
   * Initialize priority queues for each tier
   */
  initializeQueues() {
    for (const [tierName, tierConfig] of Object.entries(this.config.tiers)) {
      const queue = new TTLPriorityQueue(this.config.maxQueueSize);
      this.queues.set(tierName, queue);
      
      // Initialize statistics
      this.statistics.byTier[tierName] = {
        routed: 0,
        success: 0,
        failed: 0,
        expired: 0,
        avgResponseTime: 0
      };
      
      this.statistics.tierCounts[tierName] = 0;
      this.statistics.successRate[tierName] = 0;
      
      // Initialize tier statistics
      this.tierStatistics.set(tierName, {
        totalDuration: 0,
        completed: 0,
        failed: 0
      });
    }
    
    logger.debug(`Initialized ${this.queues.size} tier queues`);
  }
  
  /**
   * Route a task based on TTL requirements
   */
  async routeTask(task, ttl, metadata = {}) {
    const startTime = Date.now();
    
    try {
      // Determine appropriate tier
      const tier = this.determineTier(ttl);
      
      if (!tier) {
        logger.error(`No tier found for TTL ${ttl}ms`);
        this.statistics.failedRoutes++;
        return null;
      }
      
      // Calculate actual TTL with buffer
      const effectiveTTL = this.calculateEffectiveTTL(ttl, tier);
      
      // Create routing request
      const routingRequest = {
        taskId: task.id || `task-${Date.now()}`,
        task,
        ttl: effectiveTTL,
        tier: tier.name,
        priority: this.calculatePriority(task, tier, metadata),
        timestamp: Date.now(),
        metadata
      };
      
      // Check if immediate routing possible
      const immediateRoute = await this.attemptImmediateRouting(routingRequest);
      
      if (immediateRoute) {
        this.recordRoute(immediateRoute, Date.now() - startTime);
        return immediateRoute;
      }
      
      // Queue for processing
      const queued = this.queueTask(routingRequest);
      
      if (!queued) {
        logger.error(`Failed to queue task ${routingRequest.taskId}`);
        this.statistics.failedRoutes++;
        return null;
      }
      
      logger.debug(`Task ${routingRequest.taskId} queued in tier ${tier.name}`);
      
      // Return pending route
      return new RoutingDecision(
        routingRequest.taskId,
        tier,
        null,
        {
          status: 'queued',
          queuePosition: this.getQueuePosition(routingRequest),
          estimatedWait: this.estimateWaitTime(tier.name)
        }
      );
      
    } catch (error) {
      logger.error('Routing failed:', error);
      this.statistics.failedRoutes++;
      throw error;
    }
  }
  
  /**
   * Determine appropriate tier based on TTL
   */
  determineTier(ttl) {
    for (const [tierName, tierConfig] of Object.entries(this.config.tiers)) {
      if (ttl >= tierConfig.minTTL && ttl < tierConfig.maxTTL) {
        return tierConfig;
      }
    }
    
    // Default to extended tier for very long TTLs
    return this.config.tiers.EXTENDED;
  }
  
  /**
   * Calculate effective TTL with safety buffer
   */
  calculateEffectiveTTL(requestedTTL, tier) {
    // Apply safety margin based on tier
    const safetyMargin = {
      ULTRA_FAST: 0.8,   // 80% of requested
      FAST: 0.85,         // 85% of requested
      STANDARD: 0.9,      // 90% of requested
      EXTENDED: 0.95      // 95% of requested
    };
    
    const margin = safetyMargin[tier.name] || 0.9;
    return Math.floor(requestedTTL * margin);
  }
  
  /**
   * Calculate task priority
   */
  calculatePriority(task, tier, metadata) {
    let priority = tier.priority;
    
    // Adjust based on metadata
    if (metadata.urgent) priority += 2;
    if (metadata.critical) priority += 3;
    if (metadata.lowPriority) priority -= 1;
    
    // Adjust based on task properties
    if (task.complexity === 'simple') priority += 1;
    if (task.retryCount > 0) priority += task.retryCount;
    
    return Math.max(1, Math.min(10, priority)); // Clamp between 1-10
  }
  
  /**
   * Attempt immediate routing without queuing
   */
  async attemptImmediateRouting(request) {
    const tier = this.config.tiers[request.tier];
    
    // For ultra-fast tier, always try immediate routing
    if (tier.name === 'ULTRA_FAST') {
      const specialist = await this.findAvailableSpecialist(tier.source, request.task);
      
      if (specialist) {
        return new RoutingDecision(
          request.taskId,
          tier,
          specialist,
          {
            ttl: request.ttl,
            routedImmediately: true,
            confidence: 0.95
          }
        );
      }
    }
    
    return null;
  }
  
  /**
   * Queue task for processing
   */
  queueTask(request) {
    const queue = this.queues.get(request.tier);
    
    if (!queue) {
      logger.error(`No queue for tier ${request.tier}`);
      return false;
    }
    
    const queued = queue.enqueue(request);
    
    if (queued) {
      this.statistics.queuedTasks++;
      this.emit('task:queued', {
        taskId: request.taskId,
        tier: request.tier,
        queueSize: queue.size()
      });
    }
    
    return queued;
  }
  
  /**
   * Get queue position for request
   */
  getQueuePosition(request) {
    const queue = this.queues.get(request.tier);
    if (!queue) return -1;
    
    const index = queue.queue.findIndex(item => item.taskId === request.taskId);
    return index + 1; // 1-based position
  }
  
  /**
   * Estimate wait time for tier
   */
  estimateWaitTime(tierName) {
    const stats = this.statistics.byTier[tierName];
    if (!stats || stats.routed === 0) {
      // Default estimates
      const defaults = {
        ULTRA_FAST: 100,
        FAST: 500,
        STANDARD: 2000,
        EXTENDED: 10000
      };
      return defaults[tierName] || 1000;
    }
    
    return Math.floor(stats.avgResponseTime * 1.2); // Add 20% buffer
  }
  
  /**
   * Find available specialist (mock implementation)
   */
  async findAvailableSpecialist(source, task) {
    // This would integrate with the pooling system
    // For now, return mock specialist
    return {
      id: `specialist-${Date.now()}`,
      type: task.type || 'general',
      source,
      available: true
    };
  }
  
  /**
   * Get tier for given TTL value
   */
  getTierForTTL(ttl) {
    if (ttl <= TTL_TIERS.ULTRA_FAST.maxTTL) {
      return 'ULTRA_FAST';
    } else if (ttl <= TTL_TIERS.FAST.maxTTL) {
      return 'FAST';
    } else if (ttl <= TTL_TIERS.STANDARD.maxTTL) {
      return 'STANDARD';
    } else {
      return 'EXTENDED';
    }
  }
  
  /**
   * Route task based on TTL
   */
  routeTask(task) {
    const ttl = task.ttl || 30000; // Default 30 seconds
    const tierName = this.getTierForTTL(ttl);
    const tier = TTL_TIERS[tierName];
    
    const decision = new RoutingDecision(
      task.id || `task-${Date.now()}`,
      tier,
      task.specialist || null,
      {
        ttl,
        priority: task.priority || tier.priority,
        originalTask: task
      }
    );
    
    // Add to appropriate queue
    const queue = this.queues.get(tierName);
    if (queue) {
      queue.enqueue(decision);
    }
    
    // Track routing
    this.statistics.totalTasks++;
    this.statistics.tierCounts[tierName] = (this.statistics.tierCounts[tierName] || 0) + 1;
    
    this.emit('task:routed', {
      task: task.id,
      tier: tierName,
      specialist: decision.specialist
    });
    
    return decision;
  }
  
  /**
   * Record task completion
   */
  recordTaskCompletion(completion) {
    const { task, tier, specialist, actualDuration, success } = completion;
    
    // Update statistics
    if (success) {
      this.statistics.successfulTasks++;
    } else {
      this.statistics.failedTasks++;
    }
    
    // Update tier-specific stats
    const tierStats = this.tierStatistics.get(tier) || {
      completed: 0,
      failed: 0,
      totalDuration: 0,
      avgDuration: 0
    };
    
    if (success) {
      tierStats.completed++;
    } else {
      tierStats.failed++;
    }
    
    tierStats.totalDuration += actualDuration;
    tierStats.avgDuration = tierStats.totalDuration / (tierStats.completed + tierStats.failed);
    
    this.tierStatistics.set(tier, tierStats);
    
    // Update specialist performance
    const specialistStats = this.specialistPerformance.get(specialist) || {
      tasks: 0,
      successes: 0,
      failures: 0,
      avgDuration: 0
    };
    
    specialistStats.tasks++;
    if (success) {
      specialistStats.successes++;
    } else {
      specialistStats.failures++;
    }
    
    this.specialistPerformance.set(specialist, specialistStats);
    
    this.emit('task:completed', completion);
  }
  
  /**
   * Get routing statistics
   */
  getStatistics() {
    const tierDistribution = {};
    for (const tierName of Object.keys(TTL_TIERS)) {
      tierDistribution[tierName] = this.statistics.tierCounts[tierName] || 0;
    }
    
    return {
      totalTasks: this.statistics.totalTasks,
      successfulTasks: this.statistics.successfulTasks,
      failedTasks: this.statistics.failedTasks,
      successRate: this.statistics.totalTasks > 0 
        ? this.statistics.successfulTasks / this.statistics.totalTasks 
        : 0,
      tierDistribution,
      averageDuration: this.calculateAverageDuration(),
      queueSizes: this.getQueueSizes()
    };
  }
  
  /**
   * Calculate average duration across all tasks
   */
  calculateAverageDuration() {
    let totalDuration = 0;
    let totalTasks = 0;
    
    for (const stats of this.tierStatistics.values()) {
      totalDuration += stats.totalDuration;
      totalTasks += stats.completed + stats.failed;
    }
    
    return totalTasks > 0 ? totalDuration / totalTasks : 0;
  }
  
  /**
   * Get current queue sizes
   */
  getQueueSizes() {
    const sizes = {};
    for (const [tierName, queue] of this.queues) {
      sizes[tierName] = queue.queue.length;
    }
    return sizes;
  }
  
  /**
   * Process queued tasks
   */
  async processQueues() {
    for (const [tierName, queue] of this.queues) {
      if (queue.isEmpty()) continue;
      
      // Remove expired tasks
      const expired = queue.removeExpired();
      if (expired.length > 0) {
        this.handleExpiredTasks(expired, tierName);
      }
      
      // Process tasks based on tier
      await this.processTier(tierName, queue);
    }
  }
  
  /**
   * Process tasks for a specific tier
   */
  async processTier(tierName, queue) {
    const tier = this.config.tiers[tierName];
    const maxBatch = tierName === 'EXTENDED' ? 10 : 1;
    
    const tasks = [];
    for (let i = 0; i < maxBatch && !queue.isEmpty(); i++) {
      const task = queue.peek();
      
      // Check if task is still valid
      if (task && !this.isTaskExpired(task)) {
        tasks.push(queue.dequeue());
      } else {
        queue.dequeue(); // Remove expired
        this.statistics.expiredTasks++;
      }
    }
    
    if (tasks.length === 0) return;
    
    // Route tasks
    for (const task of tasks) {
      await this.executeRouting(task, tier);
    }
  }
  
  /**
   * Execute routing for a task
   */
  async executeRouting(request, tier) {
    const startTime = Date.now();
    
    try {
      // Find specialist based on tier source
      const specialist = await this.findAvailableSpecialist(tier.source, request.task);
      
      if (!specialist) {
        // Try fallback if enabled
        if (this.config.enableFallback) {
          return this.attemptFallback(request, tier);
        }
        
        throw new Error(`No specialist available for tier ${tier.name}`);
      }
      
      // Create routing decision
      const decision = new RoutingDecision(
        request.taskId,
        tier,
        specialist,
        {
          ttl: request.ttl,
          actualResponseTime: Date.now() - request.timestamp,
          confidence: 0.85
        }
      );
      
      // Record successful route
      this.recordRoute(decision, Date.now() - startTime);
      
      // Update statistics
      this.updateTierStatistics(tier.name, true, Date.now() - request.timestamp);
      
      // Emit routing event
      this.emit('task:routed', {
        taskId: request.taskId,
        tier: tier.name,
        specialist: specialist.id,
        responseTime: Date.now() - request.timestamp
      });
      
      return decision;
      
    } catch (error) {
      logger.error(`Routing failed for task ${request.taskId}:`, error);
      
      this.updateTierStatistics(tier.name, false, Date.now() - request.timestamp);
      this.statistics.failedRoutes++;
      
      this.emit('routing:failed', {
        taskId: request.taskId,
        tier: tier.name,
        error: error.message
      });
      
      return null;
    }
  }
  
  /**
   * Attempt fallback routing
   */
  async attemptFallback(request, originalTier) {
    logger.debug(`Attempting fallback for task ${request.taskId}`);
    
    // Try next tier down
    const tierOrder = ['ULTRA_FAST', 'FAST', 'STANDARD', 'EXTENDED'];
    const currentIndex = tierOrder.indexOf(originalTier.name);
    
    if (currentIndex < tierOrder.length - 1) {
      const nextTier = this.config.tiers[tierOrder[currentIndex + 1]];
      request.tier = nextTier.name;
      
      return this.executeRouting(request, nextTier);
    }
    
    return null;
  }
  
  /**
   * Check if task is expired
   */
  isTaskExpired(task) {
    const elapsed = Date.now() - task.timestamp;
    return elapsed > task.ttl;
  }
  
  /**
   * Handle expired tasks
   */
  handleExpiredTasks(tasks, tierName) {
    for (const task of tasks) {
      this.statistics.expiredTasks++;
      this.statistics.byTier[tierName].expired++;
      
      logger.warn(`Task ${task.taskId} expired in tier ${tierName}`);
      
      this.emit('task:expired', {
        taskId: task.taskId,
        tier: tierName,
        ttl: task.ttl,
        waitTime: Date.now() - task.timestamp
      });
    }
  }
  
  /**
   * Record routing decision
   */
  recordRoute(decision, routingTime) {
    this.activeRoutes.set(decision.taskId, decision);
    
    this.routingHistory.push({
      taskId: decision.taskId,
      tier: decision.tier.name,
      timestamp: decision.timestamp,
      routingTime,
      specialist: decision.specialist?.id
    });
    
    // Trim history
    if (this.routingHistory.length > this.maxHistorySize) {
      this.routingHistory.shift();
    }
    
    this.statistics.totalRouted++;
    this.statistics.avgRoutingTime = 
      (this.statistics.avgRoutingTime * (this.statistics.totalRouted - 1) + routingTime) / 
      this.statistics.totalRouted;
  }
  
  /**
   * Update tier statistics
   */
  updateTierStatistics(tierName, success, responseTime) {
    const stats = this.statistics.byTier[tierName];
    
    if (!stats) return;
    
    stats.routed++;
    if (success) {
      stats.success++;
    } else {
      stats.failed++;
    }
    
    // Update average response time
    stats.avgResponseTime = 
      (stats.avgResponseTime * (stats.routed - 1) + responseTime) / stats.routed;
    
    // Update success rate
    this.statistics.successRate[tierName] = 
      stats.routed > 0 ? stats.success / stats.routed : 0;
  }
  
  /**
   * Start routing engine
   */
  startRoutingEngine() {
    // Main routing loop
    this.routingInterval = setInterval(() => {
      this.processQueues();
    }, this.config.routingInterval);
    
    // Expiration check
    this.expirationInterval = setInterval(() => {
      this.checkExpirations();
    }, this.config.expirationCheckInterval);
    
    // Metrics collection
    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(() => {
        this.collectMetrics();
      }, this.config.metricsInterval);
    }
    
    logger.debug('Routing engine started');
  }
  
  /**
   * Stop routing engine
   */
  stopRoutingEngine() {
    if (this.routingInterval) {
      clearInterval(this.routingInterval);
    }
    
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    logger.debug('Routing engine stopped');
  }
  
  /**
   * Check for expired routes
   */
  checkExpirations() {
    for (const [taskId, route] of this.activeRoutes) {
      if (route.isExpired()) {
        this.activeRoutes.delete(taskId);
        this.statistics.expiredTasks++;
        
        this.emit('route:expired', {
          taskId,
          tier: route.tier.name
        });
      }
    }
  }
  
  /**
   * Collect and emit metrics
   */
  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      totalRouted: this.statistics.totalRouted,
      activeRoutes: this.activeRoutes.size,
      queuedTasks: this.getTotalQueuedTasks(),
      expiredTasks: this.statistics.expiredTasks,
      failedRoutes: this.statistics.failedRoutes,
      avgRoutingTime: this.statistics.avgRoutingTime,
      tierMetrics: this.getTierMetrics(),
      queueMetrics: this.getQueueMetrics()
    };
    
    this.emit('metrics:collected', metrics);
    
    return metrics;
  }
  
  /**
   * Get total queued tasks across all tiers
   */
  getTotalQueuedTasks() {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.size();
    }
    return total;
  }
  
  /**
   * Get tier-specific metrics
   */
  getTierMetrics() {
    const metrics = {};
    
    for (const [tierName, stats] of Object.entries(this.statistics.byTier)) {
      const tier = this.config.tiers[tierName];
      metrics[tierName] = {
        ...stats,
        successRate: this.statistics.successRate[tierName],
        slaCompliance: this.statistics.successRate[tierName] >= tier.sla
      };
    }
    
    return metrics;
  }
  
  /**
   * Get queue metrics
   */
  getQueueMetrics() {
    const metrics = {};
    
    for (const [tierName, queue] of this.queues) {
      metrics[tierName] = queue.getStats();
    }
    
    return metrics;
  }
  
  /**
   * Get router status
   */
  getStatus() {
    return {
      active: true,
      tiers: Object.keys(this.config.tiers),
      statistics: this.statistics,
      queues: this.getQueueMetrics(),
      activeRoutes: this.activeRoutes.size,
      config: {
        enableFallback: this.config.enableFallback,
        enablePreemption: this.config.enablePreemption,
        enableBatching: this.config.enableBatching
      }
    };
  }
  
  /**
   * Shutdown router
   */
  shutdown() {
    logger.info('Shutting down TTL Router...');
    
    this.stopRoutingEngine();
    
    // Clear queues
    for (const queue of this.queues.values()) {
      queue.clear();
    }
    
    // Clear active routes
    this.activeRoutes.clear();
    
    this.emit('shutdown');
    
    logger.info('TTL Router shutdown complete');
  }
}

module.exports = {
  TTLRouter,
  TTL_TIERS,
  RoutingDecision,
  TTLPriorityQueue
};