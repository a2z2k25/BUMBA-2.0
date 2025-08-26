/**
 * Unified Bus
 * Central message bus that subscribes to existing events
 * Part of Sprint 3: Safe Unification
 * 
 * IMPORTANT: This bus ONLY LISTENS to existing events
 * It does NOT modify any existing event emitters
 */

const { EventEmitter } = require('events');
const { logger } = require('../../core/logging/bumba-logger');

class UnifiedBus extends EventEmitter {
  constructor() {
    super();
    
    // Core properties
    this.enabled = false; // Start disabled for safety
    this.busVersion = '1.0.0';
    
    // Connected systems (references only, no modifications)
    this.connectedSystems = new Map();
    this.subscriptions = new Map();
    this.eventMappings = new Map();
    
    // Message handling
    this.messageQueue = [];
    this.processingInterval = null;
    this.maxQueueSize = 10000;
    
    // Event aggregation
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.eventPatterns = new Map();
    
    // Metrics
    this.metrics = {
      eventsReceived: 0,
      eventsProcessed: 0,
      systemsConnected: 0,
      subscriptionsActive: 0,
      patternsDetected: 0
    };
    
    logger.info('🟢 UnifiedBus created (disabled by default)');
  }
  
  /**
   * Enable the bus
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.startProcessing();
    
    // Re-attach all subscriptions
    for (const [systemId, subscription] of this.subscriptions) {
      this.attachSystemListeners(systemId, subscription.system, subscription.events);
    }
    
    logger.info('🏁 UnifiedBus enabled');
    this.emit('bus:enabled');
  }
  
  /**
   * Disable the bus (instant rollback)
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.stopProcessing();
    
    // Remove all listeners but keep references
    for (const [systemId, subscription] of this.subscriptions) {
      this.detachSystemListeners(systemId, subscription.system);
    }
    
    logger.info('🔌 UnifiedBus disabled');
    this.emit('bus:disabled');
  }
  
  /**
   * Connect to existing system WITHOUT modifying it
   * Only subscribes to its events
   */
  connectToExisting(systemId, system, eventList = []) {
    if (!system) {
      logger.warn(`Cannot connect to null system: ${systemId}`);
      return false;
    }
    
    // Store reference without modification
    this.connectedSystems.set(systemId, {
      system,
      connected: Date.now(),
      eventCount: 0
    });
    
    // Store subscription info for re-enabling
    this.subscriptions.set(systemId, {
      system,
      events: eventList,
      handlers: new Map()
    });
    
    // Attach listeners if enabled
    if (this.enabled) {
      this.attachSystemListeners(systemId, system, eventList);
    }
    
    this.metrics.systemsConnected++;
    logger.info(`🔗 Connected to system: ${systemId} (listening to ${eventList.length} events)`);
    
    return true;
  }
  
  /**
   * Attach listeners to system WITHOUT modifying it
   */
  attachSystemListeners(systemId, system, eventList) {
    // Only attach if system supports events
    if (!system.on || typeof system.on !== 'function') {
      logger.warn(`System ${systemId} doesn't support events`);
      return;
    }
    
    const subscription = this.subscriptions.get(systemId);
    if (!subscription) return;
    
    // Create handlers for each event
    for (const eventName of eventList) {
      const handler = (data) => {
        if (this.enabled) {
          this.handleSystemEvent(systemId, eventName, data);
        }
      };
      
      // Store handler reference for cleanup
      subscription.handlers.set(eventName, handler);
      
      // Attach listener
      system.on(eventName, handler);
      this.metrics.subscriptionsActive++;
    }
  }
  
  /**
   * Detach listeners from system (for disable/rollback)
   */
  detachSystemListeners(systemId, system) {
    if (!system.removeListener || typeof system.removeListener !== 'function') {
      return;
    }
    
    const subscription = this.subscriptions.get(systemId);
    if (!subscription) return;
    
    // Remove each handler
    for (const [eventName, handler] of subscription.handlers) {
      system.removeListener(eventName, handler);
      this.metrics.subscriptionsActive--;
    }
    
    // Clear handlers
    subscription.handlers.clear();
  }
  
  /**
   * Handle event from connected system
   */
  handleSystemEvent(systemId, eventName, data) {
    this.metrics.eventsReceived++;
    
    // Create unified event
    const unifiedEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: systemId,
      event: eventName,
      data,
      timestamp: Date.now()
    };
    
    // Add to history
    this.addToHistory(unifiedEvent);
    
    // Detect patterns
    this.detectPattern(unifiedEvent);
    
    // Add to processing queue
    this.messageQueue.push(unifiedEvent);
    
    // Update system stats
    const system = this.connectedSystems.get(systemId);
    if (system) {
      system.eventCount++;
    }
    
    // Emit unified event
    this.emit('unified:event', unifiedEvent);
    
    // Check for specific event mappings
    const mapping = this.eventMappings.get(`${systemId}:${eventName}`);
    if (mapping) {
      this.executeMaping(mapping, unifiedEvent);
    }
  }
  
  /**
   * Add event mapping (translate events between systems)
   */
  addEventMapping(sourceSystem, sourceEvent, targetSystem, targetEvent, transform = null) {
    const key = `${sourceSystem}:${sourceEvent}`;
    
    this.eventMappings.set(key, {
      source: { system: sourceSystem, event: sourceEvent },
      target: { system: targetSystem, event: targetEvent },
      transform,
      created: Date.now(),
      executionCount: 0
    });
    
    logger.info(`📍 Added event mapping: ${key} → ${targetSystem}:${targetEvent}`);
  }
  
  /**
   * Execute event mapping
   */
  executeMaping(mapping, unifiedEvent) {
    const targetSystem = this.connectedSystems.get(mapping.target.system);
    if (!targetSystem || !targetSystem.system.emit) {
      return;
    }
    
    // Transform data if needed
    let eventData = unifiedEvent.data;
    if (mapping.transform && typeof mapping.transform === 'function') {
      eventData = mapping.transform(eventData);
    }
    
    // Emit to target system
    targetSystem.system.emit(mapping.target.event, eventData);
    mapping.executionCount++;
    
    this.emit('unified:mapping:executed', {
      mapping: mapping.source,
      target: mapping.target,
      event: unifiedEvent
    });
  }
  
  /**
   * Start processing queue
   */
  startProcessing() {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 10); // Process every 10ms
    
    logger.info('🟢️ UnifiedBus processing started');
  }
  
  /**
   * Stop processing queue
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('⏹️ UnifiedBus processing stopped');
    }
  }
  
  /**
   * Process message queue
   */
  processQueue() {
    while (this.messageQueue.length > 0 && this.enabled) {
      const event = this.messageQueue.shift();
      this.processEvent(event);
    }
    
    // Trim queue if too large
    if (this.messageQueue.length > this.maxQueueSize) {
      const removed = this.messageQueue.length - this.maxQueueSize;
      this.messageQueue = this.messageQueue.slice(-this.maxQueueSize);
      logger.warn(`🟠️ Trimmed ${removed} events from queue`);
    }
  }
  
  /**
   * Process single event
   */
  processEvent(event) {
    this.metrics.eventsProcessed++;
    
    // Emit for any unified listeners
    this.emit(`unified:${event.source}:${event.event}`, event);
    
    // Check for cross-system patterns
    if (this.eventPatterns.has(event.event)) {
      const pattern = this.eventPatterns.get(event.event);
      pattern.count++;
      pattern.lastSeen = Date.now();
    }
  }
  
  /**
   * Detect patterns in events
   */
  detectPattern(event) {
    const key = `${event.source}:${event.event}`;
    
    if (!this.eventPatterns.has(key)) {
      this.eventPatterns.set(key, {
        pattern: key,
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        averageInterval: 0
      });
      this.metrics.patternsDetected++;
    } else {
      const pattern = this.eventPatterns.get(key);
      const interval = Date.now() - pattern.lastSeen;
      pattern.averageInterval = (pattern.averageInterval * pattern.count + interval) / (pattern.count + 1);
      pattern.count++;
      pattern.lastSeen = Date.now();
    }
  }
  
  /**
   * Add to event history
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
  
  /**
   * Get event history with filters
   */
  getHistory(filters = {}) {
    let history = [...this.eventHistory];
    
    if (filters.source) {
      history = history.filter(e => e.source === filters.source);
    }
    
    if (filters.event) {
      history = history.filter(e => e.event === filters.event);
    }
    
    if (filters.since) {
      history = history.filter(e => e.timestamp > filters.since);
    }
    
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }
    
    return history;
  }
  
  /**
   * Get detected patterns
   */
  getPatterns(minCount = 1) {
    const patterns = [];
    
    for (const [key, pattern] of this.eventPatterns) {
      if (pattern.count >= minCount) {
        patterns.push(pattern);
      }
    }
    
    // Sort by count
    patterns.sort((a, b) => b.count - a.count);
    
    return patterns;
  }
  
  /**
   * Subscribe to unified events
   */
  onUnified(eventPattern, handler) {
    if (!this.enabled) {
      logger.warn('UnifiedBus disabled - subscription deferred');
    }
    
    this.on(eventPattern, handler);
    logger.info(`👂 Subscribed to unified pattern: ${eventPattern}`);
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      enabled: this.enabled,
      ...this.metrics,
      queueLength: this.messageQueue.length,
      historySize: this.eventHistory.length,
      patternsTracked: this.eventPatterns.size,
      mappings: this.eventMappings.size
    };
  }
  
  /**
   * Get system status
   */
  getSystemStatus(systemId) {
    const system = this.connectedSystems.get(systemId);
    if (!system) return null;
    
    const subscription = this.subscriptions.get(systemId);
    
    return {
      id: systemId,
      connected: system.connected,
      eventCount: system.eventCount,
      eventsMonitored: subscription ? subscription.events.length : 0,
      handlersActive: subscription ? subscription.handlers.size : 0
    };
  }
  
  /**
   * Clear queue
   */
  clearQueue() {
    const cleared = this.messageQueue.length;
    this.messageQueue = [];
    logger.info(`🧹 Cleared ${cleared} events from queue`);
    return cleared;
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    const cleared = this.eventHistory.length;
    this.eventHistory = [];
    logger.info(`🧹 Cleared ${cleared} events from history`);
    return cleared;
  }
  
  /**
   * Rollback bus completely
   */
  rollback() {
    // Disable first
    this.disable();
    
    // Clear all data
    this.connectedSystems.clear();
    this.subscriptions.clear();
    this.eventMappings.clear();
    this.messageQueue = [];
    this.eventHistory = [];
    this.eventPatterns.clear();
    
    // Reset metrics
    this.metrics = {
      eventsReceived: 0,
      eventsProcessed: 0,
      systemsConnected: 0,
      subscriptionsActive: 0,
      patternsDetected: 0
    };
    
    logger.info('↩️ UnifiedBus rolled back completely');
  }
  
  /**
   * Health check
   */
  isHealthy() {
    return {
      busHealthy: true,
      enabled: this.enabled,
      processingActive: this.processingInterval !== null,
      queueHealth: this.messageQueue.length < this.maxQueueSize,
      systems: this.connectedSystems.size,
      subscriptions: this.subscriptions.size
    };
  }
}

module.exports = UnifiedBus;