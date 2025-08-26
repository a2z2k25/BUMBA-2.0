/**
 * Communication Adapter
 * Provides unified message bus without modifying existing systems
 * Part of Sprint 2: Safe Unification
 */

const { EventEmitter } = require('events');
const { logger } = require('../../core/logging/bumba-logger');

class CommunicationAdapter extends EventEmitter {
  constructor() {
    super();
    
    // Wrap existing communication systems WITHOUT modifying them
    this.wrappedSystems = new Map();
    this.adapterVersion = '1.0.0';
    this.enabled = false; // Start disabled for safety
    
    // Unified message bus (doesn't affect original systems)
    this.unifiedBus = {
      channels: new Map(),
      subscribers: new Map(),
      messageQueue: [],
      routingTable: new Map()
    };
    
    // Message history for debugging and replay
    this.messageHistory = [];
    this.maxHistorySize = 1000;
    
    // Metrics for monitoring
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesRouted: 0,
      messagesFailed: 0,
      channelsActive: 0
    };
    
    logger.info('📡 CommunicationAdapter created (disabled by default)');
  }
  
  /**
   * Enable adapter
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.startMessageProcessor();
    logger.info('🏁 CommunicationAdapter enabled');
    this.emit('adapter:enabled');
  }
  
  /**
   * Disable adapter
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.stopMessageProcessor();
    this.removeAllListeners();
    logger.info('🔌 CommunicationAdapter disabled');
    this.emit('adapter:disabled');
  }
  
  /**
   * Register existing communication system WITHOUT modifying it
   */
  registerSystem(name, system) {
    if (!system) {
      logger.warn(`Cannot register null communication system: ${name}`);
      return false;
    }
    
    // Store reference without modification
    this.wrappedSystems.set(name, {
      instance: system,
      registered: Date.now(),
      messageCount: 0
    });
    
    // Attach listeners if system is EventEmitter
    if (this.enabled && system.on && typeof system.on === 'function') {
      this.attachSystemListeners(name, system);
    }
    
    logger.info(`🔗 Registered communication system: ${name}`);
    return true;
  }
  
  /**
   * Attach listeners to wrapped system WITHOUT modifying it
   */
  attachSystemListeners(name, system) {
    // Listen to common communication events
    const events = ['message', 'broadcast', 'error', 'connect', 'disconnect'];
    
    events.forEach(eventName => {
      if (system.listenerCount && system.listenerCount(eventName) > 0) {
        system.on(eventName, (data) => {
          if (this.enabled) {
            this.handleSystemEvent(name, eventName, data);
          }
        });
      }
    });
  }
  
  /**
   * Handle events from wrapped systems
   */
  handleSystemEvent(systemName, eventName, data) {
    // Route to unified bus if enabled
    if (this.enabled) {
      this.emit('unified:system:event', {
        system: systemName,
        event: eventName,
        data,
        timestamp: Date.now()
      });
      
      // Special handling for messages
      if (eventName === 'message' || eventName === 'broadcast') {
        this.routeMessage({
          source: systemName,
          type: eventName,
          data,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Create or get channel
   */
  createChannel(channelName, options = {}) {
    if (!this.enabled) {
      logger.warn('CommunicationAdapter disabled - cannot create channel');
      return null;
    }
    
    if (this.unifiedBus.channels.has(channelName)) {
      return this.unifiedBus.channels.get(channelName);
    }
    
    const channel = {
      name: channelName,
      created: Date.now(),
      options,
      subscribers: new Set(),
      messageCount: 0
    };
    
    this.unifiedBus.channels.set(channelName, channel);
    this.metrics.channelsActive++;
    
    logger.info(`📢 Created channel: ${channelName}`);
    this.emit('unified:channel:created', { channel: channelName });
    
    return channel;
  }
  
  /**
   * Subscribe to channel
   */
  subscribe(channelName, subscriber, handler) {
    if (!this.enabled) return false;
    
    const channel = this.createChannel(channelName);
    if (!channel) return false;
    
    // Add subscriber
    const subscriberId = `${subscriber}-${Date.now()}`;
    channel.subscribers.add(subscriberId);
    
    // Store handler
    if (!this.unifiedBus.subscribers.has(subscriberId)) {
      this.unifiedBus.subscribers.set(subscriberId, {
        subscriber,
        channels: new Set(),
        handler
      });
    }
    
    this.unifiedBus.subscribers.get(subscriberId).channels.add(channelName);
    
    logger.info(`👂 ${subscriber} subscribed to ${channelName}`);
    this.emit('unified:subscribed', { channel: channelName, subscriber });
    
    return true;
  }
  
  /**
   * Publish message to channel
   */
  async publish(channelName, message, options = {}) {
    if (!this.enabled) {
      // Fallback to first available system
      const firstSystem = this.wrappedSystems.values().next().value;
      if (firstSystem && firstSystem.instance.send) {
        return await firstSystem.instance.send(message);
      }
      return false;
    }
    
    const channel = this.unifiedBus.channels.get(channelName);
    if (!channel) {
      logger.warn(`Channel not found: ${channelName}`);
      this.metrics.messagesFailed++;
      return false;
    }
    
    // Create message envelope
    const envelope = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel: channelName,
      message,
      options,
      timestamp: Date.now()
    };
    
    // Add to queue
    this.unifiedBus.messageQueue.push(envelope);
    channel.messageCount++;
    this.metrics.messagesSent++;
    
    // Store in history
    this.addToHistory(envelope);
    
    // Process immediately if processor is running
    if (this.messageProcessor) {
      this.processNextMessage();
    }
    
    this.emit('unified:message:published', envelope);
    
    return true;
  }
  
  /**
   * Route message to appropriate handlers
   */
  async routeMessage(message) {
    this.metrics.messagesReceived++;
    
    // Check routing table for custom routes
    const route = this.unifiedBus.routingTable.get(message.type);
    if (route) {
      await this.executeRoute(route, message);
      this.metrics.messagesRouted++;
      return;
    }
    
    // Default routing: broadcast to all subscribers of the channel
    if (message.channel) {
      const channel = this.unifiedBus.channels.get(message.channel);
      if (channel) {
        for (const subscriberId of channel.subscribers) {
          const subscriber = this.unifiedBus.subscribers.get(subscriberId);
          if (subscriber && subscriber.handler) {
            try {
              await subscriber.handler(message);
            } catch (error) {
              logger.error(`Handler error for ${subscriberId}:`, error);
              this.metrics.messagesFailed++;
            }
          }
        }
      }
    }
  }
  
  /**
   * Execute custom route
   */
  async executeRoute(route, message) {
    if (route.transform) {
      message = route.transform(message);
    }
    
    if (route.targets) {
      for (const target of route.targets) {
        const system = this.wrappedSystems.get(target);
        if (system && system.instance.send) {
          await system.instance.send(message);
          system.messageCount++;
        }
      }
    }
    
    if (route.handler) {
      await route.handler(message);
    }
  }
  
  /**
   * Add routing rule
   */
  addRoute(messageType, route) {
    this.unifiedBus.routingTable.set(messageType, route);
    logger.info(`🗺️ Added route for message type: ${messageType}`);
  }
  
  /**
   * Start message processor
   */
  startMessageProcessor() {
    if (this.messageProcessor) return;
    
    this.messageProcessor = setInterval(() => {
      this.processNextMessage();
    }, 10); // Process messages every 10ms
    
    logger.info('🟢️ Message processor started');
  }
  
  /**
   * Stop message processor
   */
  stopMessageProcessor() {
    if (this.messageProcessor) {
      clearInterval(this.messageProcessor);
      this.messageProcessor = null;
      logger.info('⏹️ Message processor stopped');
    }
  }
  
  /**
   * Process next message in queue
   */
  async processNextMessage() {
    if (this.unifiedBus.messageQueue.length === 0) return;
    
    const envelope = this.unifiedBus.messageQueue.shift();
    await this.routeMessage(envelope);
  }
  
  /**
   * Broadcast to all channels
   */
  async broadcast(message, options = {}) {
    if (!this.enabled) return false;
    
    const results = [];
    for (const [channelName] of this.unifiedBus.channels) {
      results.push(await this.publish(channelName, message, options));
    }
    
    this.emit('unified:broadcast', { message, channels: results.length });
    return results;
  }
  
  /**
   * Send direct message between components
   */
  async sendDirect(from, to, message) {
    if (!this.enabled) {
      // Try to use wrapped system
      const system = this.wrappedSystems.values().next().value;
      if (system && system.instance.sendDirect) {
        return await system.instance.sendDirect(from, to, message);
      }
      return false;
    }
    
    const envelope = {
      id: `direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      message,
      timestamp: Date.now(),
      type: 'direct'
    };
    
    // Route directly
    await this.routeMessage(envelope);
    
    this.emit('unified:direct:sent', envelope);
    return true;
  }
  
  /**
   * Add message to history
   */
  addToHistory(message) {
    this.messageHistory.push(message);
    
    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }
  
  /**
   * Get message history
   */
  getHistory(filter = {}) {
    let history = [...this.messageHistory];
    
    if (filter.channel) {
      history = history.filter(m => m.channel === filter.channel);
    }
    
    if (filter.type) {
      history = history.filter(m => m.type === filter.type);
    }
    
    if (filter.since) {
      history = history.filter(m => m.timestamp > filter.since);
    }
    
    return history;
  }
  
  /**
   * Get unified metrics
   */
  getMetrics() {
    return {
      enabled: this.enabled,
      ...this.metrics,
      systems: Array.from(this.wrappedSystems.keys()),
      queueLength: this.unifiedBus.messageQueue.length,
      historySize: this.messageHistory.length
    };
  }
  
  /**
   * Get channel status
   */
  getChannelStatus(channelName) {
    const channel = this.unifiedBus.channels.get(channelName);
    if (!channel) return null;
    
    return {
      name: channel.name,
      created: channel.created,
      subscribers: channel.subscribers.size,
      messageCount: channel.messageCount
    };
  }
  
  /**
   * Clear message queue
   */
  clearQueue() {
    const cleared = this.unifiedBus.messageQueue.length;
    this.unifiedBus.messageQueue = [];
    logger.info(`🧹 Cleared ${cleared} messages from queue`);
    return cleared;
  }
  
  /**
   * Rollback adapter
   */
  rollback() {
    this.disable();
    this.wrappedSystems.clear();
    this.unifiedBus.channels.clear();
    this.unifiedBus.subscribers.clear();
    this.unifiedBus.messageQueue = [];
    this.unifiedBus.routingTable.clear();
    this.messageHistory = [];
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesRouted: 0,
      messagesFailed: 0,
      channelsActive: 0
    };
    
    logger.info('↩️ CommunicationAdapter rolled back');
  }
  
  /**
   * Health check
   */
  isHealthy() {
    const systemHealth = {};
    for (const [name, data] of this.wrappedSystems) {
      systemHealth[name] = data.instance !== null;
    }
    
    return {
      adapterHealthy: true,
      enabled: this.enabled,
      systemCount: this.wrappedSystems.size,
      systemHealth,
      queueHealth: this.unifiedBus.messageQueue.length < 10000, // Prevent overflow
      processorRunning: this.messageProcessor !== null
    };
  }
}

module.exports = CommunicationAdapter;