/**
 * Event Broadcaster - Advanced event broadcasting system with topic routing and subscription management
 * Provides reliable, scalable event distribution across the Bumba ecosystem
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Event Types for different broadcasting scenarios
 */
const EventType = {
  SYSTEM: 'system',
  AGENT: 'agent',
  WORKFLOW: 'workflow',
  NOTIFICATION: 'notification',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  SECURITY: 'security'
};

/**
 * Delivery Guarantees
 */
const DeliveryGuarantee = {
  AT_MOST_ONCE: 'at-most-once',    // Fire and forget
  AT_LEAST_ONCE: 'at-least-once',  // Retry until acknowledged
  EXACTLY_ONCE: 'exactly-once'     // Deduplicated delivery
};

/**
 * Event Priority Levels
 */
const EventPriority = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  BACKGROUND: 5
};

/**
 * Event Broadcaster - Core broadcasting engine
 */
class EventBroadcaster extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000); // Support many subscribers
    
    this.config = {
      maxSubscribers: 10000,
      maxTopics: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      enablePersistence: false,
      enableMetrics: true,
      deliveryTimeout: 30000,
      batchDelivery: true,
      batchSize: 100,
      batchInterval: 1000,
      ...config
    };
    
    // Core state
    this.subscriptions = new Map(); // topic -> Set of subscriptions
    this.subscribers = new Map(); // subscriberId -> subscriber data
    this.topicFilters = new Map(); // topic -> array of filter functions
    this.deliveryTracking = new Map(); // eventId -> delivery status
    this.eventHistory = new Map(); // topic -> recent events (for replay)
    
    // Batch delivery
    this.batchQueues = new Map(); // subscriberId -> events to batch
    this.batchTimers = new Map(); // subscriberId -> timer
    
    // Metrics and monitoring
    this.metrics = {
      totalEvents: 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      totalSubscribers: 0,
      topicCount: 0,
      uptime: Date.now()
    };
    
    // Performance monitoring
    this.performanceWindow = [];
    this.startPerformanceMonitoring();
    
    logger.info('📡 Event Broadcaster initialized', {
      maxSubscribers: this.config.maxSubscribers,
      enablePersistence: this.config.enablePersistence,
      batchDelivery: this.config.batchDelivery
    });
  }

  /**
   * Subscribe to events on specific topics with filtering
   */
  subscribe(subscriberId, options = {}) {
    const {
      topics = [],
      eventTypes = [],
      filters = {},
      deliveryGuarantee = DeliveryGuarantee.AT_MOST_ONCE,
      handler = null,
      metadata = {}
    } = options;
    
    if (this.subscribers.size >= this.config.maxSubscribers) {
      throw new Error(`Maximum subscribers limit reached: ${this.config.maxSubscribers}`);
    }
    
    // Create subscription record
    const subscription = {
      id: subscriberId,
      topics: new Set(topics),
      eventTypes: new Set(eventTypes),
      filters,
      deliveryGuarantee,
      handler,
      metadata,
      subscribedAt: Date.now(),
      deliveryStats: {
        received: 0,
        successful: 0,
        failed: 0,
        lastDelivery: null
      }
    };
    
    // Register subscriber
    this.subscribers.set(subscriberId, subscription);
    
    // Add to topic subscriptions
    for (const topic of topics) {
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Set());
      }
      this.subscriptions.get(topic).add(subscriberId);
    }
    
    this.metrics.totalSubscribers = this.subscribers.size;
    this.metrics.topicCount = this.subscriptions.size;
    
    this.emit('subscriber:added', { subscriberId, subscription });
    logger.debug(`📢 Subscriber added: ${subscriberId} -> [${topics.join(', ')}]`);
    
    return subscription;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriberId, topics = null) {
    const subscription = this.subscribers.get(subscriberId);
    if (!subscription) {
      return false;
    }
    
    const topicsToRemove = topics ? new Set(topics) : subscription.topics;
    
    // Remove from topic subscriptions
    for (const topic of topicsToRemove) {
      const topicSubscriptions = this.subscriptions.get(topic);
      if (topicSubscriptions) {
        topicSubscriptions.delete(subscriberId);
        
        // Clean up empty topics
        if (topicSubscriptions.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
      
      subscription.topics.delete(topic);
    }
    
    // Remove subscriber if no topics left
    if (subscription.topics.size === 0) {
      this.subscribers.delete(subscriberId);
      
      // Clean up batch delivery
      this.cleanupBatchDelivery(subscriberId);
    }
    
    this.metrics.totalSubscribers = this.subscribers.size;
    this.metrics.topicCount = this.subscriptions.size;
    
    this.emit('subscriber:removed', { subscriberId, topics: Array.from(topicsToRemove) });
    logger.debug(`📢 Subscriber removed: ${subscriberId} from [${Array.from(topicsToRemove).join(', ')}]`);
    
    return true;
  }

  /**
   * Broadcast event to subscribed topics
   */
  async broadcast(event, options = {}) {
    const {
      topic,
      eventType = EventType.SYSTEM,
      priority = EventPriority.NORMAL,
      deliveryGuarantee = DeliveryGuarantee.AT_MOST_ONCE,
      metadata = {},
      ttl = null
    } = options;
    
    // Create event object
    const broadcastEvent = {
      id: this.generateEventId(),
      topic,
      eventType,
      priority,
      payload: event,
      metadata: {
        timestamp: Date.now(),
        source: 'event-broadcaster',
        ttl,
        ...metadata
      },
      deliveryGuarantee,
      deliveryStatus: {
        totalTargets: 0,
        successful: 0,
        failed: 0,
        pending: 0
      }
    };
    
    // Validate event
    const validation = this.validateEvent(broadcastEvent);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }
    
    // Store in history for replay
    this.storeEventInHistory(topic, broadcastEvent);
    
    // Find matching subscribers
    const targetSubscribers = this.findTargetSubscribers(broadcastEvent);
    broadcastEvent.deliveryStatus.totalTargets = targetSubscribers.length;
    
    if (targetSubscribers.length === 0) {
      logger.debug(`📡 No subscribers for topic: ${topic}`);
      return broadcastEvent;
    }
    
    // Track delivery if required
    if (deliveryGuarantee !== DeliveryGuarantee.AT_MOST_ONCE) {
      this.deliveryTracking.set(broadcastEvent.id, {
        event: broadcastEvent,
        targets: targetSubscribers,
        deliveryAttempts: new Map(),
        createdAt: Date.now()
      });
    }
    
    // Deliver to subscribers
    await this.deliverToSubscribers(broadcastEvent, targetSubscribers);
    
    // Update metrics
    this.metrics.totalEvents++;
    this.updatePerformanceMetrics(broadcastEvent);
    
    this.emit('event:broadcasted', broadcastEvent);
    logger.debug(`📡 Event broadcasted: ${broadcastEvent.id} to ${targetSubscribers.length} subscribers`);
    
    return broadcastEvent;
  }

  /**
   * Find subscribers matching the event criteria
   */
  findTargetSubscribers(event) {
    const targets = [];
    const topicSubscribers = this.subscriptions.get(event.topic) || new Set();
    
    for (const subscriberId of topicSubscribers) {
      const subscription = this.subscribers.get(subscriberId);
      if (!subscription) continue;
      
      // Check event type filter
      if (subscription.eventTypes.size > 0 && !subscription.eventTypes.has(event.eventType)) {
        continue;
      }
      
      // Apply custom filters
      if (!this.applyFilters(event, subscription.filters)) {
        continue;
      }
      
      targets.push(subscriberId);
    }
    
    return targets;
  }

  /**
   * Apply subscription filters to event
   */
  applyFilters(event, filters) {
    for (const [filterType, filterValue] of Object.entries(filters)) {
      switch (filterType) {
        case 'priority':
          if (Array.isArray(filterValue) && !filterValue.includes(event.priority)) {
            return false;
          }
          break;
          
        case 'source':
          if (filterValue && event.metadata.source !== filterValue) {
            return false;
          }
          break;
          
        case 'custom':
          if (typeof filterValue === 'function' && !filterValue(event)) {
            return false;
          }
          break;
          
        case 'tags':
          if (Array.isArray(filterValue) && event.metadata.tags) {
            const hasMatchingTag = filterValue.some(tag => event.metadata.tags.includes(tag));
            if (!hasMatchingTag) {
              return false;
            }
          }
          break;
      }
    }
    
    return true;
  }

  /**
   * Deliver event to target subscribers
   */
  async deliverToSubscribers(event, subscribers) {
    const deliveryPromises = subscribers.map(subscriberId => 
      this.deliverToSubscriber(event, subscriberId)
    );
    
    const results = await Promise.allSettled(deliveryPromises);
    
    // Update delivery status
    for (const result of results) {
      if (result.status === 'fulfilled') {
        event.deliveryStatus.successful++;
      } else {
        event.deliveryStatus.failed++;
      }
    }
    
    this.metrics.totalDeliveries += subscribers.length;
    this.metrics.successfulDeliveries += event.deliveryStatus.successful;
    this.metrics.failedDeliveries += event.deliveryStatus.failed;
  }

  /**
   * Deliver event to specific subscriber
   */
  async deliverToSubscriber(event, subscriberId) {
    const subscription = this.subscribers.get(subscriberId);
    if (!subscription) {
      throw new Error(`Subscriber not found: ${subscriberId}`);
    }
    
    try {
      // Check TTL
      if (event.metadata.ttl && Date.now() - event.metadata.timestamp > event.metadata.ttl) {
        throw new Error('Event expired (TTL exceeded)');
      }
      
      // Handle different delivery methods
      if (this.config.batchDelivery && event.deliveryGuarantee === DeliveryGuarantee.AT_MOST_ONCE) {
        await this.addToBatchDelivery(event, subscriberId);
      } else {
        await this.deliverEventDirectly(event, subscription);
      }
      
      // Update subscriber stats
      subscription.deliveryStats.received++;
      subscription.deliveryStats.successful++;
      subscription.deliveryStats.lastDelivery = Date.now();
      
      return { subscriberId, status: 'delivered' };
      
    } catch (error) {
      subscription.deliveryStats.failed++;
      
      // Handle retry for guaranteed delivery
      if (event.deliveryGuarantee === DeliveryGuarantee.AT_LEAST_ONCE) {
        await this.scheduleRetryDelivery(event, subscriberId, error);
      }
      
      logger.warn(`📡 Delivery failed: ${event.id} -> ${subscriberId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add event to batch delivery queue
   */
  async addToBatchDelivery(event, subscriberId) {
    if (!this.batchQueues.has(subscriberId)) {
      this.batchQueues.set(subscriberId, []);
    }
    
    const batchQueue = this.batchQueues.get(subscriberId);
    batchQueue.push(event);
    
    // Deliver immediately if batch is full
    if (batchQueue.length >= this.config.batchSize) {
      await this.deliverBatch(subscriberId);
      return;
    }
    
    // Set timer for batch delivery if not already set
    if (!this.batchTimers.has(subscriberId)) {
      const timer = setTimeout(() => {
        this.deliverBatch(subscriberId);
      }, this.config.batchInterval);
      
      this.batchTimers.set(subscriberId, timer);
    }
  }

  /**
   * Deliver batched events to subscriber
   */
  async deliverBatch(subscriberId) {
    const batchQueue = this.batchQueues.get(subscriberId);
    if (!batchQueue || batchQueue.length === 0) {
      return;
    }
    
    const subscription = this.subscribers.get(subscriberId);
    if (!subscription) {
      this.cleanupBatchDelivery(subscriberId);
      return;
    }
    
    try {
      // Clear timer
      const timer = this.batchTimers.get(subscriberId);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(subscriberId);
      }
      
      // Deliver batch
      const batch = [...batchQueue];
      batchQueue.length = 0; // Clear queue
      
      await this.deliverEventDirectly({
        id: `batch_${Date.now()}`,
        type: 'batch',
        events: batch,
        metadata: {
          timestamp: Date.now(),
          batchSize: batch.length
        }
      }, subscription);
      
      logger.debug(`📦 Batch delivered: ${batch.length} events -> ${subscriberId}`);
      
    } catch (error) {
      logger.error(`📦 Batch delivery failed: ${subscriberId}`, error);
    }
  }

  /**
   * Deliver event directly to subscriber handler
   */
  async deliverEventDirectly(event, subscription) {
    if (subscription.handler && typeof subscription.handler === 'function') {
      // Call subscriber handler
      await subscription.handler(event, subscription);
    } else {
      // Emit as event
      this.emit(`event:${subscription.id}`, event);
    }
  }

  /**
   * Schedule retry delivery for guaranteed delivery
   */
  async scheduleRetryDelivery(event, subscriberId, error) {
    const trackingData = this.deliveryTracking.get(event.id);
    if (!trackingData) {
      return;
    }
    
    const attempts = trackingData.deliveryAttempts.get(subscriberId) || 0;
    if (attempts >= this.config.retryAttempts) {
      // Max retries exceeded, move to dead letter
      this.handleDeadLetterEvent(event, subscriberId, error);
      return;
    }
    
    trackingData.deliveryAttempts.set(subscriberId, attempts + 1);
    
    // Schedule retry
    const retryDelay = this.config.retryDelay * Math.pow(2, attempts); // Exponential backoff
    setTimeout(async () => {
      try {
        await this.deliverToSubscriber(event, subscriberId);
      } catch (retryError) {
        await this.scheduleRetryDelivery(event, subscriberId, retryError);
      }
    }, retryDelay);
    
    logger.debug(`🔄 Retry scheduled: ${event.id} -> ${subscriberId} (attempt ${attempts + 1})`);
  }

  /**
   * Handle events that couldn't be delivered after all retries
   */
  handleDeadLetterEvent(event, subscriberId, error) {
    this.emit('event:dead_letter', {
      event,
      subscriberId,
      error: error.message,
      timestamp: Date.now()
    });
    
    logger.error(`💀 Event moved to dead letter: ${event.id} -> ${subscriberId}`);
  }

  /**
   * Validate event before broadcasting
   */
  validateEvent(event) {
    const errors = [];
    
    if (!event.topic) {
      errors.push('Topic is required');
    }
    
    if (event.topic && event.topic.length > 255) {
      errors.push('Topic name too long (max 255 characters)');
    }
    
    if (!event.payload) {
      errors.push('Payload is required');
    }
    
    const payloadSize = JSON.stringify(event.payload).length;
    if (payloadSize > 1024 * 1024) { // 1MB limit
      errors.push('Payload too large (max 1MB)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Store event in history for replay capability
   */
  storeEventInHistory(topic, event) {
    if (!this.eventHistory.has(topic)) {
      this.eventHistory.set(topic, []);
    }
    
    const history = this.eventHistory.get(topic);
    history.push({
      ...event,
      storedAt: Date.now()
    });
    
    // Keep only last 1000 events per topic
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Replay events for a subscriber
   */
  async replayEvents(subscriberId, options = {}) {
    const {
      topics = [],
      since = null,
      limit = 100,
      eventTypes = []
    } = options;
    
    const subscription = this.subscribers.get(subscriberId);
    if (!subscription) {
      throw new Error(`Subscriber not found: ${subscriberId}`);
    }
    
    const replayEvents = [];
    const topicsToReplay = topics.length > 0 ? topics : Array.from(subscription.topics);
    
    for (const topic of topicsToReplay) {
      const history = this.eventHistory.get(topic) || [];
      
      let filteredEvents = history;
      
      // Filter by timestamp
      if (since) {
        filteredEvents = filteredEvents.filter(event => event.metadata.timestamp >= since);
      }
      
      // Filter by event types
      if (eventTypes.length > 0) {
        filteredEvents = filteredEvents.filter(event => eventTypes.includes(event.eventType));
      }
      
      replayEvents.push(...filteredEvents);
    }
    
    // Sort by timestamp and limit
    replayEvents.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
    const limitedEvents = replayEvents.slice(0, limit);
    
    // Deliver replay events
    for (const event of limitedEvents) {
      try {
        await this.deliverEventDirectly({
          ...event,
          metadata: {
            ...event.metadata,
            replay: true,
            replayedAt: Date.now()
          }
        }, subscription);
      } catch (error) {
        logger.error(`📼 Replay delivery failed: ${event.id} -> ${subscriberId}`, error);
      }
    }
    
    logger.info(`📼 Event replay completed: ${limitedEvents.length} events -> ${subscriberId}`);
    
    return {
      subscriberId,
      eventsReplayed: limitedEvents.length,
      topics: topicsToReplay
    };
  }

  /**
   * Get broadcaster statistics
   */
  getBroadcasterStats() {
    const stats = {
      timestamp: Date.now(),
      uptime: Date.now() - this.metrics.uptime,
      metrics: { ...this.metrics },
      subscriptions: {
        totalSubscribers: this.subscribers.size,
        totalTopics: this.subscriptions.size,
        averageSubscriptionsPerTopic: this.subscriptions.size > 0 ? 
          Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.size, 0) / this.subscriptions.size : 0
      },
      performance: this.getPerformanceMetrics(),
      topicBreakdown: this.getTopicBreakdown()
    };
    
    return stats;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const windowSize = 60000; // 1 minute
    const now = Date.now();
    const recentMetrics = this.performanceWindow.filter(m => now - m.timestamp < windowSize);
    
    if (recentMetrics.length === 0) {
      return {
        eventsPerSecond: 0,
        averageDeliveryTime: 0,
        deliverySuccessRate: 0
      };
    }
    
    const eventsPerSecond = recentMetrics.length / (windowSize / 1000);
    const averageDeliveryTime = recentMetrics.reduce((sum, m) => sum + m.deliveryTime, 0) / recentMetrics.length;
    const successfulDeliveries = recentMetrics.filter(m => m.successful).length;
    const deliverySuccessRate = (successfulDeliveries / recentMetrics.length) * 100;
    
    return {
      eventsPerSecond,
      averageDeliveryTime,
      deliverySuccessRate
    };
  }

  /**
   * Get topic breakdown statistics
   */
  getTopicBreakdown() {
    const breakdown = {};
    
    for (const [topic, subscribers] of this.subscriptions) {
      const history = this.eventHistory.get(topic) || [];
      breakdown[topic] = {
        subscriberCount: subscribers.size,
        eventCount: history.length,
        lastEvent: history.length > 0 ? history[history.length - 1].metadata.timestamp : null
      };
    }
    
    return breakdown;
  }

  /**
   * Helper methods
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updatePerformanceMetrics(event) {
    this.performanceWindow.push({
      timestamp: Date.now(),
      eventId: event.id,
      deliveryTime: Date.now() - event.metadata.timestamp,
      successful: event.deliveryStatus.failed === 0
    });
    
    // Keep only last 1000 metrics
    if (this.performanceWindow.length > 1000) {
      this.performanceWindow.shift();
    }
  }

  startPerformanceMonitoring() {
    this.performanceInterval = setInterval(() => {
      const stats = this.getBroadcasterStats();
      this.emit('broadcaster:stats', stats);
    }, 30000); // Every 30 seconds
  }

  cleanupBatchDelivery(subscriberId) {
    const timer = this.batchTimers.get(subscriberId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(subscriberId);
    }
    
    this.batchQueues.delete(subscriberId);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🔄 Shutting down Event Broadcaster...');
    
    // Deliver pending batches
    for (const subscriberId of this.batchQueues.keys()) {
      await this.deliverBatch(subscriberId);
    }
    
    // Clear timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }
    
    this.emit('broadcaster:shutdown');
    logger.info('🏁 Event Broadcaster shutdown complete');
  }
}

module.exports = {
  EventBroadcaster,
  EventType,
  DeliveryGuarantee,
  EventPriority
};