/**
 * TTL Queue Management System
 * Manages priority queues for each TTL tier with overflow handling
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Queue Configuration
 */
const QUEUE_CONFIG = {
  ULTRA_FAST: {
    maxSize: 100,
    processingRate: 50,  // tasks per second
    priority: 4,
    overflow: 'reject'   // reject, redirect, or backpressure
  },
  FAST: {
    maxSize: 500,
    processingRate: 20,
    priority: 3,
    overflow: 'redirect'
  },
  STANDARD: {
    maxSize: 1000,
    processingRate: 10,
    priority: 2,
    overflow: 'redirect'
  },
  EXTENDED: {
    maxSize: 5000,
    processingRate: 5,
    priority: 1,
    overflow: 'backpressure'
  }
};

/**
 * Task Queue Entry
 */
class QueueEntry {
  constructor(task, priority, ttl) {
    this.id = `entry-${Date.now()}-${Math.random()}`;
    this.task = task;
    this.priority = priority;
    this.ttl = ttl;
    this.enqueueTime = Date.now();
    this.attempts = 0;
    this.status = 'queued';
  }
  
  getWaitTime() {
    return Date.now() - this.enqueueTime;
  }
  
  isExpired() {
    return this.getWaitTime() > this.ttl;
  }
  
  incrementAttempts() {
    this.attempts++;
    return this.attempts;
  }
}

/**
 * Priority Queue Implementation
 */
class TierQueue {
  constructor(tier, config) {
    this.tier = tier;
    this.config = config;
    this.entries = [];
    this.processing = new Set();
    this.stats = {
      enqueued: 0,
      processed: 0,
      expired: 0,
      rejected: 0,
      redirected: 0,
      avgWaitTime: 0,
      avgProcessTime: 0
    };
  }
  
  enqueue(entry) {
    if (this.entries.length >= this.config.maxSize) {
      return this.handleOverflow(entry);
    }
    
    // Binary search insertion for priority
    const index = this.findInsertPosition(entry);
    this.entries.splice(index, 0, entry);
    this.stats.enqueued++;
    
    return { success: true, position: index + 1 };
  }
  
  findInsertPosition(entry) {
    let left = 0;
    let right = this.entries.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.comparePriority(entry, this.entries[mid]) > 0) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    
    return left;
  }
  
  comparePriority(a, b) {
    // Higher priority first, then shorter TTL
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.ttl - b.ttl;
  }
  
  dequeue() {
    const entry = this.entries.shift();
    if (entry) {
      this.processing.add(entry.id);
      entry.status = 'processing';
    }
    return entry;
  }
  
  peek() {
    return this.entries[0];
  }
  
  size() {
    return this.entries.length;
  }
  
  processingSize() {
    return this.processing.size;
  }
  
  handleOverflow(entry) {
    switch (this.config.overflow) {
      case 'reject':
        this.stats.rejected++;
        return { success: false, reason: 'queue_full' };
        
      case 'redirect':
        this.stats.redirected++;
        return { success: false, reason: 'redirect', suggestion: this.getRedirectTier() };
        
      case 'backpressure':
        // Remove lowest priority item
        const removed = this.removeLowPriority();
        if (removed) {
          return this.enqueue(entry);
        }
        return { success: false, reason: 'backpressure_failed' };
        
      default:
        return { success: false, reason: 'overflow' };
    }
  }
  
  removeLowPriority() {
    if (this.entries.length === 0) return null;
    
    // Find lowest priority entry
    let lowestIndex = this.entries.length - 1;
    let lowestPriority = this.entries[lowestIndex].priority;
    
    for (let i = this.entries.length - 2; i >= 0; i--) {
      if (this.entries[i].priority < lowestPriority) {
        lowestPriority = this.entries[i].priority;
        lowestIndex = i;
      }
    }
    
    return this.entries.splice(lowestIndex, 1)[0];
  }
  
  getRedirectTier() {
    const tiers = ['EXTENDED', 'STANDARD', 'FAST'];
    const currentIndex = tiers.indexOf(this.tier);
    return currentIndex >= 0 ? tiers[Math.max(0, currentIndex - 1)] : 'EXTENDED';
  }
  
  removeExpired() {
    const expired = [];
    const now = Date.now();
    
    this.entries = this.entries.filter(entry => {
      if (entry.isExpired()) {
        expired.push(entry);
        this.stats.expired++;
        return false;
      }
      return true;
    });
    
    return expired;
  }
  
  completeProcessing(entryId, processTime) {
    this.processing.delete(entryId);
    this.stats.processed++;
    
    // Update average process time
    this.stats.avgProcessTime = 
      (this.stats.avgProcessTime * (this.stats.processed - 1) + processTime) / 
      this.stats.processed;
  }
  
  getStatus() {
    return {
      tier: this.tier,
      size: this.entries.length,
      processing: this.processing.size,
      capacity: `${this.entries.length}/${this.config.maxSize}`,
      utilizationRate: this.entries.length / this.config.maxSize,
      stats: { ...this.stats }
    };
  }
  
  clear() {
    this.entries = [];
    this.processing.clear();
  }
}

/**
 * Main TTL Queue Manager
 */
class TTLQueueManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Queue settings
      queueConfigs: config.queueConfigs || QUEUE_CONFIG,
      
      // Processing settings
      processingInterval: config.processingInterval || 100,     // 100ms
      batchProcessing: config.batchProcessing !== false,
      maxBatchSize: config.maxBatchSize || 10,
      
      // Balancing settings
      enableLoadBalancing: config.enableLoadBalancing !== false,
      balancingInterval: config.balancingInterval || 5000,      // 5 seconds
      balancingThreshold: config.balancingThreshold || 0.8,     // 80% utilization
      
      // Monitoring
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 10000,         // 10 seconds
      
      // Overflow handling
      globalOverflowStrategy: config.globalOverflowStrategy || 'cascade'
    };
    
    // Queue state
    this.queues = new Map();
    this.queueMetrics = new Map();
    this.processingHandlers = new Map();
    
    // Statistics
    this.globalStats = {
      totalEnqueued: 0,
      totalProcessed: 0,
      totalExpired: 0,
      totalRejected: 0,
      totalRedirected: 0,
      averageWaitTime: 0,
      averageProcessTime: 0
    };
    
    // Initialize queues
    this.initializeQueues();
    
    // Start processing engine
    this.startProcessingEngine();
    
    logger.info('📬 TTL Queue Manager initialized');
  }
  
  /**
   * Initialize tier queues
   */
  initializeQueues() {
    for (const [tier, config] of Object.entries(this.config.queueConfigs)) {
      const queue = new TierQueue(tier, config);
      this.queues.set(tier, queue);
      
      this.queueMetrics.set(tier, {
        throughput: 0,
        latency: 0,
        errorRate: 0,
        lastProcessed: Date.now()
      });
    }
    
    logger.debug(`Initialized ${this.queues.size} tier queues`);
  }
  
  /**
   * Enqueue task to appropriate tier
   */
  async enqueueTask(task, tier, priority, ttl) {
    const queue = this.queues.get(tier);
    
    if (!queue) {
      logger.error(`No queue for tier ${tier}`);
      return { success: false, reason: 'invalid_tier' };
    }
    
    const entry = new QueueEntry(task, priority, ttl);
    const result = queue.enqueue(entry);
    
    if (result.success) {
      this.globalStats.totalEnqueued++;
      
      this.emit('task:enqueued', {
        id: entry.id,
        tier,
        position: result.position,
        queueSize: queue.size()
      });
    } else if (result.reason === 'redirect' && result.suggestion) {
      // Try redirect to suggested tier
      return this.enqueueTask(task, result.suggestion, priority, ttl);
    } else {
      this.globalStats.totalRejected++;
      
      this.emit('task:rejected', {
        tier,
        reason: result.reason
      });
    }
    
    return result;
  }
  
  /**
   * Register task processor
   */
  registerProcessor(tier, handler) {
    this.processingHandlers.set(tier, handler);
    logger.debug(`Registered processor for tier ${tier}`);
  }
  
  /**
   * Process queues
   */
  async processQueues() {
    for (const [tier, queue] of this.queues) {
      await this.processTierQueue(tier, queue);
    }
  }
  
  /**
   * Process single tier queue
   */
  async processTierQueue(tier, queue) {
    const handler = this.processingHandlers.get(tier);
    if (!handler) return;
    
    const config = this.config.queueConfigs[tier];
    const maxToProcess = Math.min(
      config.processingRate / 10, // Divide by 10 for 100ms interval
      this.config.maxBatchSize
    );
    
    const batch = [];
    for (let i = 0; i < maxToProcess && queue.size() > 0; i++) {
      const entry = queue.peek();
      
      if (entry && !entry.isExpired()) {
        batch.push(queue.dequeue());
      } else if (entry) {
        queue.dequeue(); // Remove expired
        this.globalStats.totalExpired++;
      }
    }
    
    if (batch.length === 0) return;
    
    // Process batch
    if (this.config.batchProcessing && batch.length > 1) {
      await this.processBatch(tier, batch, handler);
    } else {
      for (const entry of batch) {
        await this.processEntry(tier, entry, handler);
      }
    }
  }
  
  /**
   * Process single entry
   */
  async processEntry(tier, entry, handler) {
    const startTime = Date.now();
    
    try {
      entry.status = 'processing';
      await handler(entry.task);
      
      const processTime = Date.now() - startTime;
      const queue = this.queues.get(tier);
      
      queue.completeProcessing(entry.id, processTime);
      this.updateMetrics(tier, entry, processTime);
      
      this.globalStats.totalProcessed++;
      
      this.emit('task:processed', {
        id: entry.id,
        tier,
        processTime,
        waitTime: entry.getWaitTime()
      });
      
    } catch (error) {
      logger.error(`Processing failed for ${entry.id}:`, error);
      
      this.emit('task:failed', {
        id: entry.id,
        tier,
        error: error.message
      });
    }
  }
  
  /**
   * Process batch of entries
   */
  async processBatch(tier, batch, handler) {
    const startTime = Date.now();
    
    try {
      const tasks = batch.map(e => e.task);
      await handler(tasks);
      
      const processTime = Date.now() - startTime;
      const queue = this.queues.get(tier);
      
      for (const entry of batch) {
        queue.completeProcessing(entry.id, processTime);
        this.updateMetrics(tier, entry, processTime);
        this.globalStats.totalProcessed++;
      }
      
      this.emit('batch:processed', {
        tier,
        count: batch.length,
        processTime
      });
      
    } catch (error) {
      logger.error(`Batch processing failed:`, error);
    }
  }
  
  /**
   * Update metrics
   */
  updateMetrics(tier, entry, processTime) {
    const metrics = this.queueMetrics.get(tier);
    if (!metrics) return;
    
    const waitTime = entry.getWaitTime();
    
    // Update global stats
    this.globalStats.averageWaitTime = 
      (this.globalStats.averageWaitTime * (this.globalStats.totalProcessed - 1) + waitTime) /
      this.globalStats.totalProcessed;
    
    this.globalStats.averageProcessTime = 
      (this.globalStats.averageProcessTime * (this.globalStats.totalProcessed - 1) + processTime) /
      this.globalStats.totalProcessed;
    
    // Update tier metrics
    metrics.throughput++;
    metrics.latency = (metrics.latency + waitTime) / 2;
    metrics.lastProcessed = Date.now();
  }
  
  /**
   * Balance queue loads
   */
  async balanceQueues() {
    const overloaded = [];
    const underutilized = [];
    
    for (const [tier, queue] of this.queues) {
      const status = queue.getStatus();
      
      if (status.utilizationRate > this.config.balancingThreshold) {
        overloaded.push({ tier, queue, utilization: status.utilizationRate });
      } else if (status.utilizationRate < 0.3) {
        underutilized.push({ tier, queue, utilization: status.utilizationRate });
      }
    }
    
    // Rebalance if needed
    if (overloaded.length > 0 && underutilized.length > 0) {
      await this.rebalanceQueues(overloaded, underutilized);
    }
  }
  
  /**
   * Rebalance between queues
   */
  async rebalanceQueues(overloaded, underutilized) {
    logger.debug(`Rebalancing queues: ${overloaded.length} overloaded, ${underutilized.length} underutilized`);
    
    for (const source of overloaded) {
      for (const target of underutilized) {
        const toMove = Math.floor((source.utilization - this.config.balancingThreshold) * 
                                  source.queue.config.maxSize);
        
        for (let i = 0; i < toMove && source.queue.size() > 0; i++) {
          const entry = source.queue.dequeue();
          if (entry) {
            target.queue.enqueue(entry);
            this.globalStats.totalRedirected++;
          }
        }
      }
    }
    
    this.emit('queues:rebalanced', {
      moved: this.globalStats.totalRedirected
    });
  }
  
  /**
   * Start processing engine
   */
  startProcessingEngine() {
    // Main processing loop
    this.processingInterval = setInterval(() => {
      this.processQueues();
    }, this.config.processingInterval);
    
    // Load balancing
    if (this.config.enableLoadBalancing) {
      this.balancingInterval = setInterval(() => {
        this.balanceQueues();
      }, this.config.balancingInterval);
    }
    
    // Metrics collection
    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(() => {
        this.collectMetrics();
      }, this.config.metricsInterval);
    }
    
    logger.debug('Queue processing engine started');
  }
  
  /**
   * Stop processing engine
   */
  stopProcessingEngine() {
    if (this.processingInterval) clearInterval(this.processingInterval);
    if (this.balancingInterval) clearInterval(this.balancingInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    
    logger.debug('Queue processing engine stopped');
  }
  
  /**
   * Collect metrics
   */
  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      global: { ...this.globalStats },
      queues: {},
      health: this.calculateHealth()
    };
    
    for (const [tier, queue] of this.queues) {
      metrics.queues[tier] = {
        ...queue.getStatus(),
        metrics: this.queueMetrics.get(tier)
      };
    }
    
    this.emit('metrics:collected', metrics);
    return metrics;
  }
  
  /**
   * Calculate system health
   */
  calculateHealth() {
    let score = 100;
    
    // Check queue utilization
    for (const queue of this.queues.values()) {
      const status = queue.getStatus();
      if (status.utilizationRate > 0.9) score -= 10;
      if (status.stats.expired > status.stats.processed * 0.1) score -= 15;
      if (status.stats.rejected > status.stats.enqueued * 0.2) score -= 10;
    }
    
    // Check global metrics
    if (this.globalStats.totalExpired > this.globalStats.totalProcessed * 0.1) score -= 20;
    if (this.globalStats.averageWaitTime > 5000) score -= 10;
    
    return Math.max(0, score);
  }
  
  /**
   * Get manager status
   */
  getStatus() {
    return {
      queues: Object.fromEntries(
        Array.from(this.queues.entries()).map(([tier, queue]) => [
          tier, queue.getStatus()
        ])
      ),
      globalStats: this.globalStats,
      health: this.calculateHealth(),
      config: {
        batchProcessing: this.config.batchProcessing,
        loadBalancing: this.config.enableLoadBalancing
      }
    };
  }
  
  /**
   * Clear all queues
   */
  clearQueues() {
    for (const queue of this.queues.values()) {
      queue.clear();
    }
    logger.info('All queues cleared');
  }
  
  /**
   * Shutdown manager
   */
  shutdown() {
    logger.info('Shutting down TTL Queue Manager...');
    
    this.stopProcessingEngine();
    this.clearQueues();
    this.removeAllListeners();
    
    logger.info('TTL Queue Manager shutdown complete');
  }
}

module.exports = {
  TTLQueueManager,
  TierQueue,
  QueueEntry,
  QUEUE_CONFIG
};