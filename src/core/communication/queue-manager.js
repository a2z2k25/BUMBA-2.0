/**
 * Queue Manager - Manages multiple message queues and integrates with agent lifecycle
 * Provides centralized queue coordination, load balancing, and cross-queue operations
 */

const EventEmitter = require('events');
const { MessageQueue, MessagePriority } = require('./message-queue');
const { logger } = require('../logging/bumba-logger');

/**
 * Queue Types for different use cases
 */
const QueueType = {
  AGENT_TASKS: 'agent-tasks',
  INTER_AGENT: 'inter-agent',
  SYSTEM_EVENTS: 'system-events',
  NOTIFICATIONS: 'notifications',
  HIGH_PRIORITY: 'high-priority',
  BACKGROUND: 'background'
};

/**
 * Queue Manager for centralized queue coordination
 */
class QueueManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(1000);
    
    this.config = {
      defaultQueueConfig: {
        maxSize: 10000,
        batchSize: 100,
        maxRetries: 3,
        retryDelay: 1000,
        enablePersistence: false,
        deadLetterQueueEnabled: true,
        enableAutoAdjustment: true
      },
      loadBalancing: {
        strategy: 'round-robin', // round-robin, least-loaded, priority-based
        enableDynamicRouting: true
      },
      healthMonitoring: {
        enabled: true,
        interval: 30000,
        alertThresholds: {
          critical: 30,
          warning: 60
        }
      },
      ...config
    };
    
    // Queue registry
    this.queues = new Map();
    this.queueStats = new Map();
    this.routingTable = new Map();
    
    // Load balancing state
    this.lastUsedQueue = new Map(); // For round-robin
    this.queueMetrics = new Map();
    
    // Integration components
    this.agentLifecycleHooks = new Map();
    this.messageProcessors = new Map();
    this.queuePolicies = new Map();
    
    // Performance tracking
    this.globalStats = {
      totalQueuesManaged: 0,
      totalMessagesProcessed: 0,
      totalErrors: 0,
      uptime: Date.now()
    };
    
    this.startGlobalMonitoring();
    
    logger.info('🟡 Queue Manager initialized', {
      loadBalancingStrategy: this.config.loadBalancing.strategy,
      healthMonitoringEnabled: this.config.healthMonitoring.enabled
    });
  }

  /**
   * Create and register a new queue
   */
  async createQueue(name, type = QueueType.AGENT_TASKS, config = {}) {
    if (this.queues.has(name)) {
      throw new Error(`Queue '${name}' already exists`);
    }
    
    const queueConfig = {
      ...this.config.defaultQueueConfig,
      ...this.getQueueTypeDefaults(type),
      ...config
    };
    
    const queue = new MessageQueue(name, queueConfig);
    
    // Set up event forwarding
    this.setupQueueEventForwarding(queue, name, type);
    
    // Register queue
    this.queues.set(name, queue);
    this.queueStats.set(name, {
      type,
      createdAt: Date.now(),
      config: queueConfig,
      metrics: {
        messagesProcessed: 0,
        errors: 0,
        avgProcessingTime: 0
      }
    });
    
    // Add to routing table if needed
    if (!this.routingTable.has(type)) {
      this.routingTable.set(type, []);
    }
    this.routingTable.get(type).push(name);
    
    // Start health monitoring for this queue
    if (this.config.healthMonitoring.enabled) {
      queue.startHealthMonitoring({
        interval: this.config.healthMonitoring.interval,
        alertThresholds: this.config.healthMonitoring.alertThresholds
      });
    }
    
    this.globalStats.totalQueuesManaged++;
    
    this.emit('queue:created', { name, type, config: queueConfig });
    logger.info(`📬 Queue created: ${name} (type: ${type})`);
    
    return queue;
  }

  /**
   * Get queue type-specific default configurations
   */
  getQueueTypeDefaults(type) {
    const defaults = {
      [QueueType.AGENT_TASKS]: {
        maxSize: 5000,
        batchSize: 50,
        maxRetries: 3,
        processingTimeout: 30000
      },
      [QueueType.INTER_AGENT]: {
        maxSize: 2000,
        batchSize: 20,
        maxRetries: 5,
        processingTimeout: 10000
      },
      [QueueType.SYSTEM_EVENTS]: {
        maxSize: 10000,
        batchSize: 100,
        maxRetries: 2,
        processingTimeout: 5000
      },
      [QueueType.NOTIFICATIONS]: {
        maxSize: 15000,
        batchSize: 200,
        maxRetries: 1,
        processingTimeout: 15000
      },
      [QueueType.HIGH_PRIORITY]: {
        maxSize: 1000,
        batchSize: 10,
        maxRetries: 5,
        processingTimeout: 5000
      },
      [QueueType.BACKGROUND]: {
        maxSize: 20000,
        batchSize: 500,
        maxRetries: 2,
        processingTimeout: 60000
      }
    };
    
    return defaults[type] || {};
  }

  /**
   * Set up event forwarding from individual queues to manager
   */
  setupQueueEventForwarding(queue, name, type) {
    const events = [
      'message:enqueued', 'message:dequeued', 'message:completed', 'message:failed',
      'batch:enqueued', 'batch:dequeued', 'batch:acknowledged', 'batch:rejected',
      'health:status', 'health:alert', 'queue:scaling_up', 'queue:scaling_down'
    ];
    
    events.forEach(event => {
      queue.on(event, (data) => {
        // Forward event with queue context
        this.emit(`queue:${event}`, {
          queueName: name,
          queueType: type,
          ...data
        });
        
        // Update stats
        this.updateQueueStats(name, event, data);
      });
    });
  }

  /**
   * Route message to appropriate queue based on content and load balancing
   */
  async routeMessage(payload, options = {}) {
    const {
      queueType = QueueType.AGENT_TASKS,
      routingStrategy = this.config.loadBalancing.strategy,
      forceQueue = null
    } = options;
    
    let targetQueue;
    
    if (forceQueue) {
      targetQueue = this.queues.get(forceQueue);
      if (!targetQueue) {
        throw new Error(`Forced queue '${forceQueue}' not found`);
      }
    } else {
      // Use load balancing to select queue
      const queueName = await this.selectQueueForType(queueType, routingStrategy);
      targetQueue = this.queues.get(queueName);
      
      if (!targetQueue) {
        throw new Error(`No queues available for type '${queueType}'`);
      }
    }
    
    // Add routing metadata
    const routingOptions = {
      ...options,
      metadata: {
        routedBy: 'queue-manager',
        routingStrategy,
        selectedQueue: targetQueue.name,
        routingTimestamp: Date.now(),
        ...options.metadata
      }
    };
    
    const messageId = await targetQueue.enqueue(payload, routingOptions);
    
    this.emit('message:routed', {
      messageId,
      queueName: targetQueue.name,
      queueType,
      routingStrategy
    });
    
    return { messageId, queueName: targetQueue.name };
  }

  /**
   * Select optimal queue for a given type using load balancing
   */
  async selectQueueForType(queueType, strategy) {
    const availableQueues = this.routingTable.get(queueType) || [];
    
    if (availableQueues.length === 0) {
      throw new Error(`No queues registered for type '${queueType}'`);
    }
    
    if (availableQueues.length === 1) {
      return availableQueues[0];
    }
    
    switch (strategy) {
      case 'round-robin':
        return this.selectRoundRobin(queueType, availableQueues);
      
      case 'least-loaded':
        return this.selectLeastLoaded(availableQueues);
      
      case 'priority-based':
        return this.selectPriorityBased(availableQueues);
      
      default:
        return availableQueues[0];
    }
  }

  /**
   * Round-robin queue selection
   */
  selectRoundRobin(queueType, availableQueues) {
    const lastUsed = this.lastUsedQueue.get(queueType) || -1;
    const nextIndex = (lastUsed + 1) % availableQueues.length;
    this.lastUsedQueue.set(queueType, nextIndex);
    return availableQueues[nextIndex];
  }

  /**
   * Select queue with lowest current load
   */
  selectLeastLoaded(availableQueues) {
    let leastLoadedQueue = availableQueues[0];
    let lowestLoad = this.calculateQueueLoad(leastLoadedQueue);
    
    for (let i = 1; i < availableQueues.length; i++) {
      const queueName = availableQueues[i];
      const load = this.calculateQueueLoad(queueName);
      
      if (load < lowestLoad) {
        lowestLoad = load;
        leastLoadedQueue = queueName;
      }
    }
    
    return leastLoadedQueue;
  }

  /**
   * Select queue based on priority and health
   */
  selectPriorityBased(availableQueues) {
    // Score queues based on health and performance
    const scores = availableQueues.map(queueName => {
      const queue = this.queues.get(queueName);
      const health = queue.calculateQueueHealth();
      const load = this.calculateQueueLoad(queueName);
      
      // Higher health score and lower load = higher priority
      const score = health.score - (load * 50);
      
      return { queueName, score };
    });
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    return scores[0].queueName;
  }

  /**
   * Calculate current load for a queue (0-1 scale)
   */
  calculateQueueLoad(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return 1; // Max load if queue not found
    
    const stats = queue.getQueueStats();
    const utilization = stats.totalSize / queue.config.maxSize;
    const processingLoad = stats.processingCount / queue.config.batchSize;
    
    return Math.min(1, (utilization + processingLoad) / 2);
  }

  /**
   * Integrate with agent lifecycle for task distribution
   */
  registerAgentLifecycleHook(hookName, handler) {
    this.agentLifecycleHooks.set(hookName, handler);
    logger.debug(`🔗 Agent lifecycle hook registered: ${hookName}`);
  }

  /**
   * Process agent lifecycle events and route to appropriate queues
   */
  async handleAgentLifecycleEvent(eventType, agentData) {
    const hook = this.agentLifecycleHooks.get(eventType);
    
    if (hook) {
      try {
        await hook(agentData, this);
      } catch (error) {
        logger.error(`🔴 Agent lifecycle hook failed: ${eventType}`, error);
      }
    }
    
    // Route common lifecycle events
    switch (eventType) {
      case 'agent:spawned':
        await this.routeMessage(
          { type: 'agent-ready', agentId: agentData.id, capabilities: agentData.capabilities },
          { queueType: QueueType.SYSTEM_EVENTS, priority: MessagePriority.HIGH }
        );
        break;
      
      case 'agent:task-assigned':
        await this.routeMessage(
          agentData.task,
          { queueType: QueueType.AGENT_TASKS, priority: agentData.priority || MessagePriority.NORMAL }
        );
        break;
      
      case 'agent:communication':
        await this.routeMessage(
          agentData.message,
          { queueType: QueueType.INTER_AGENT, priority: MessagePriority.HIGH }
        );
        break;
    }
  }

  /**
   * Get comprehensive stats for all managed queues
   */
  getAllQueueStats() {
    const queueStats = {};
    
    for (const [name, queue] of this.queues) {
      queueStats[name] = {
        ...queue.getQueueStats(),
        health: queue.calculateQueueHealth(),
        performance: queue.getPerformanceMetrics(),
        type: this.queueStats.get(name)?.type
      };
    }
    
    return {
      timestamp: Date.now(),
      globalStats: this.globalStats,
      queues: queueStats,
      routingTable: Object.fromEntries(this.routingTable),
      loadBalancing: {
        strategy: this.config.loadBalancing.strategy,
        lastUsedQueues: Object.fromEntries(this.lastUsedQueue)
      }
    };
  }

  /**
   * Batch operations across multiple queues
   */
  async enqueueBatchAcrossQueues(messages, options = {}) {
    const results = {
      total: messages.length,
      successful: 0,
      failed: 0,
      queueResults: new Map()
    };
    
    for (const messageData of messages) {
      try {
        const routingResult = await this.routeMessage(messageData.payload, {
          ...messageData.options,
          ...options
        });
        
        results.successful++;
        
        if (!results.queueResults.has(routingResult.queueName)) {
          results.queueResults.set(routingResult.queueName, { successful: 0, failed: 0, messageIds: [] });
        }
        
        const queueResult = results.queueResults.get(routingResult.queueName);
        queueResult.successful++;
        queueResult.messageIds.push(routingResult.messageId);
        
      } catch (error) {
        results.failed++;
        logger.error(`🔴 Failed to route message in batch: ${error.message}`);
      }
    }
    
    this.emit('batch:cross_queue_enqueued', results);
    logger.info(`📦 Cross-queue batch processed: ${results.successful}/${results.total} successful`);
    
    return results;
  }

  /**
   * Update queue statistics based on events
   */
  updateQueueStats(queueName, event, data) {
    const stats = this.queueStats.get(queueName);
    if (!stats) return;
    
    switch (event) {
      case 'message:completed':
        stats.metrics.messagesProcessed++;
        this.globalStats.totalMessagesProcessed++;
        if (data.processingTime) {
          stats.metrics.avgProcessingTime = 
            (stats.metrics.avgProcessingTime + data.processingTime) / 2;
        }
        break;
      
      case 'message:failed':
        stats.metrics.errors++;
        this.globalStats.totalErrors++;
        break;
    }
  }

  /**
   * Start global monitoring across all queues
   */
  startGlobalMonitoring() {
    this.globalMonitorInterval = setInterval(() => {
      const allStats = this.getAllQueueStats();
      
      // Emit global health status
      this.emit('manager:health_status', allStats);
      
      // Check for global alerts
      this.checkGlobalHealth(allStats);
      
    }, this.config.healthMonitoring.interval);
    
    logger.info('📊 Global queue monitoring started');
  }

  /**
   * Check global health across all queues
   */
  checkGlobalHealth(allStats) {
    const alerts = [];
    let unhealthyQueues = 0;
    let totalMessages = 0;
    let totalErrors = 0;
    
    for (const [name, stats] of Object.entries(allStats.queues)) {
      if (stats.health.status === 'critical' || stats.health.status === 'warning') {
        unhealthyQueues++;
      }
      
      totalMessages += stats.stats.totalProcessed;
      totalErrors += stats.stats.totalFailed;
    }
    
    const globalErrorRate = totalMessages > 0 ? (totalErrors / totalMessages) * 100 : 0;
    const unhealthyRate = (unhealthyQueues / this.queues.size) * 100;
    
    // Global alerts
    if (unhealthyRate > 50) {
      alerts.push({
        level: 'critical',
        message: `More than 50% of queues are unhealthy (${unhealthyQueues}/${this.queues.size})`,
        metric: 'queue_health',
        value: unhealthyRate
      });
    }
    
    if (globalErrorRate > 15) {
      alerts.push({
        level: 'warning',
        message: `Global error rate is high: ${globalErrorRate.toFixed(1)}%`,
        metric: 'global_error_rate',
        value: globalErrorRate
      });
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      this.emit('manager:alert', {
        timestamp: Date.now(),
        ...alert
      });
      
      logger.warn(`🔴 Queue Manager Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
    });
  }

  /**
   * Get specific queue by name
   */
  getQueue(name) {
    return this.queues.get(name);
  }

  /**
   * Get all queues of a specific type
   */
  getQueuesByType(type) {
    const queueNames = this.routingTable.get(type) || [];
    return queueNames.map(name => this.queues.get(name)).filter(Boolean);
  }

  /**
   * Gracefully shutdown all queues
   */
  async shutdown() {
    logger.info('🔄 Shutting down Queue Manager...');
    
    // Stop global monitoring
    if (this.globalMonitorInterval) {
      clearInterval(this.globalMonitorInterval);
    }
    
    // Shutdown all queues
    const shutdownPromises = Array.from(this.queues.values()).map(queue => queue.shutdown());
    await Promise.all(shutdownPromises);
    
    this.emit('manager:shutdown');
    logger.info('🏁 Queue Manager shutdown complete');
  }
}

module.exports = {
  QueueManager,
  QueueType
};