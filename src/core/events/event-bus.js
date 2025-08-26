/**
 * Event Bus System
 * High-performance event system with memory leak prevention
 * Sprint 21-24 - Event System Fix
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.options = {
      maxListeners: options.maxListeners || 100,
      enableMetrics: options.enableMetrics !== false,
      enableDebug: options.enableDebug || false,
      warningThreshold: options.warningThreshold || 50,
      memoryCheckInterval: options.memoryCheckInterval || 60000, // 1 minute
      wildcardDelimiter: options.wildcardDelimiter || '.',
      enableAsync: options.enableAsync !== false
    };
    
    // Set max listeners
    this.setMaxListeners(this.options.maxListeners);
    
    // Listener tracking
    this.listeners = new Map();
    this.wildcardListeners = new Map();
    this.onceListeners = new Set();
    this.asyncListeners = new Map();
    
    // Metrics
    this.metrics = {
      eventsEmitted: 0,
      listenersAttached: 0,
      listenersDetached: 0,
      memoryLeaksDetected: 0,
      errors: 0,
      slowListeners: 0
    };
    
    // Timers
    this.timers = new ComponentTimers('event-bus');
    
    // Memory leak detection
    this.listenerCounts = new Map();
    this.startMemoryCheck();
    
    // Register with state manager
    stateManager.register('eventBus', {
      metrics: this.metrics,
      listenerCount: 0,
      events: []
    });
  }
  
  /**
   * Enhanced event emission with wildcard support
   */
  emit(event, ...args) {
    const startTime = Date.now();
    
    try {
      // Track metrics
      this.metrics.eventsEmitted++;
      
      // Emit to exact listeners
      const emitted = super.emit(event, ...args);
      
      // Handle wildcard listeners
      this.emitToWildcards(event, ...args);
      
      // Handle async listeners
      if (this.asyncListeners.has(event)) {
        this.emitAsync(event, ...args);
      }
      
      // Log slow events
      const duration = Date.now() - startTime;
      if (duration > 100) {
        this.metrics.slowListeners++;
        logger.warn(`Slow event emission: ${event} took ${duration}ms`);
      }
      
      // Debug logging
      if (this.options.enableDebug) {
        logger.debug(`Event emitted: ${event}`, { args, duration });
      }
      
      this.updateState();
      return emitted;
      
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Error emitting event ${event}:`, error);
      throw error;
    }
  }
  
  /**
   * Emit to wildcard listeners
   */
  emitToWildcards(event, ...args) {
    const parts = event.split(this.options.wildcardDelimiter);
    
    for (let i = parts.length; i > 0; i--) {
      const pattern = parts.slice(0, i).join(this.options.wildcardDelimiter) + '.*';
      
      if (this.wildcardListeners.has(pattern)) {
        const listeners = this.wildcardListeners.get(pattern);
        for (const listener of listeners) {
          try {
            listener(event, ...args);
          } catch (error) {
            logger.error(`Error in wildcard listener for ${pattern}:`, error);
          }
        }
      }
    }
    
    // Check for global wildcard
    if (this.wildcardListeners.has('*')) {
      const listeners = this.wildcardListeners.get('*');
      for (const listener of listeners) {
        try {
          listener(event, ...args);
        } catch (error) {
          logger.error('Error in global wildcard listener:', error);
        }
      }
    }
  }
  
  /**
   * Emit async events
   */
  async emitAsync(event, ...args) {
    if (!this.asyncListeners.has(event)) return;
    
    const listeners = this.asyncListeners.get(event);
    const promises = [];
    
    for (const listener of listeners) {
      promises.push(
        Promise.resolve(listener(...args)).catch(error => {
          logger.error(`Error in async listener for ${event}:`, error);
          this.metrics.errors++;
        })
      );
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Enhanced listener registration with leak prevention
   */
  on(event, listener, options = {}) {
    // Check for wildcard
    if (event.includes('*')) {
      return this.onWildcard(event, listener);
    }
    
    // Check if async
    if (options.async) {
      return this.onAsync(event, listener);
    }
    
    // Track listener
    this.trackListener(event, listener, 'on');
    
    // Check for potential memory leak
    if (this.listenerCount(event) > this.options.warningThreshold) {
      logger.warn(`Potential memory leak: ${event} has ${this.listenerCount(event)} listeners`);
      this.metrics.memoryLeaksDetected++;
    }
    
    // Add listener metadata
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    
    const listenerId = this.generateListenerId();
    this.listeners.get(event).set(listenerId, {
      fn: listener,
      addedAt: Date.now(),
      callCount: 0,
      totalDuration: 0,
      options
    });
    
    // Wrap listener for metrics
    const wrappedListener = this.wrapListener(event, listenerId, listener);
    
    super.on(event, wrappedListener);
    this.metrics.listenersAttached++;
    
    this.updateState();
    return this;
  }
  
  /**
   * Register wildcard listener
   */
  onWildcard(pattern, listener) {
    if (!this.wildcardListeners.has(pattern)) {
      this.wildcardListeners.set(pattern, new Set());
    }
    
    this.wildcardListeners.get(pattern).add(listener);
    this.metrics.listenersAttached++;
    
    return this;
  }
  
  /**
   * Register async listener
   */
  onAsync(event, listener) {
    if (!this.asyncListeners.has(event)) {
      this.asyncListeners.set(event, new Set());
    }
    
    this.asyncListeners.get(event).add(listener);
    this.metrics.listenersAttached++;
    
    return this;
  }
  
  /**
   * Once with tracking
   */
  once(event, listener) {
    const listenerId = this.generateListenerId();
    this.onceListeners.add(listenerId);
    
    const wrappedListener = (...args) => {
      this.onceListeners.delete(listenerId);
      this.metrics.listenersDetached++;
      return listener(...args);
    };
    
    super.once(event, wrappedListener);
    this.metrics.listenersAttached++;
    
    return this;
  }
  
  /**
   * Remove listener with cleanup
   */
  off(event, listener) {
    // Remove from wildcard listeners
    if (event.includes('*')) {
      if (this.wildcardListeners.has(event)) {
        this.wildcardListeners.get(event).delete(listener);
        if (this.wildcardListeners.get(event).size === 0) {
          this.wildcardListeners.delete(event);
        }
      }
      this.metrics.listenersDetached++;
      return this;
    }
    
    // Remove from async listeners
    if (this.asyncListeners.has(event)) {
      this.asyncListeners.get(event).delete(listener);
      if (this.asyncListeners.get(event).size === 0) {
        this.asyncListeners.delete(event);
      }
    }
    
    // Remove from regular listeners
    if (this.listeners.has(event)) {
      const eventListeners = this.listeners.get(event);
      for (const [id, data] of eventListeners) {
        if (data.fn === listener) {
          eventListeners.delete(id);
          break;
        }
      }
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
    
    super.off(event, listener);
    this.metrics.listenersDetached++;
    
    this.updateState();
    return this;
  }
  
  /**
   * Remove all listeners with cleanup
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      this.wildcardListeners.delete(event);
      this.asyncListeners.delete(event);
      
      const count = this.listenerCount(event);
      this.metrics.listenersDetached += count;
    } else {
      const totalCount = this.getTotalListenerCount();
      this.listeners.clear();
      this.wildcardListeners.clear();
      this.asyncListeners.clear();
      this.onceListeners.clear();
      
      this.metrics.listenersDetached += totalCount;
    }
    
    super.removeAllListeners(event);
    this.updateState();
    return this;
  }
  
  /**
   * Wrap listener for metrics and error handling
   */
  wrapListener(event, listenerId, listener) {
    return (...args) => {
      const startTime = Date.now();
      
      try {
        const result = listener(...args);
        
        // Update metrics
        if (this.listeners.has(event)) {
          const data = this.listeners.get(event).get(listenerId);
          if (data) {
            data.callCount++;
            data.totalDuration += Date.now() - startTime;
          }
        }
        
        return result;
      } catch (error) {
        this.metrics.errors++;
        logger.error(`Error in listener for ${event}:`, error);
        
        // Emit error event
        this.emit('error', {
          event,
          error,
          listenerId
        });
        
        throw error;
      }
    };
  }
  
  /**
   * Track listener for memory leak detection
   */
  trackListener(event, listener, type) {
    if (!this.listenerCounts.has(event)) {
      this.listenerCounts.set(event, {
        count: 0,
        addedAt: Date.now(),
        types: new Map()
      });
    }
    
    const eventData = this.listenerCounts.get(event);
    eventData.count++;
    
    if (!eventData.types.has(type)) {
      eventData.types.set(type, 0);
    }
    eventData.types.set(type, eventData.types.get(type) + 1);
  }
  
  /**
   * Start memory leak detection
   */
  startMemoryCheck() {
    this.timers.setInterval('memoryCheck', () => {
      this.checkForMemoryLeaks();
    }, this.options.memoryCheckInterval);
  }
  
  /**
   * Check for memory leaks
   */
  checkForMemoryLeaks() {
    const suspiciousEvents = [];
    
    for (const [event, data] of this.listenerCounts) {
      const count = this.listenerCount(event);
      
      // Check for too many listeners
      if (count > this.options.warningThreshold) {
        suspiciousEvents.push({
          event,
          count,
          duration: Date.now() - data.addedAt,
          types: Object.fromEntries(data.types)
        });
      }
      
      // Check for old listeners
      const age = Date.now() - data.addedAt;
      if (age > 3600000 && count > 10) { // 1 hour old with >10 listeners
        logger.warn(`Old event with many listeners: ${event} (${count} listeners, ${age}ms old)`);
      }
    }
    
    if (suspiciousEvents.length > 0) {
      logger.warn('Potential memory leaks detected:', suspiciousEvents);
      this.emit('memoryLeak', suspiciousEvents);
    }
    
    // Clean up old empty entries
    for (const [event, data] of this.listenerCounts) {
      if (this.listenerCount(event) === 0) {
        this.listenerCounts.delete(event);
      }
    }
  }
  
  /**
   * Generate unique listener ID
   */
  generateListenerId() {
    return crypto.randomBytes(8).toString('hex');
  }
  
  /**
   * Get total listener count
   */
  getTotalListenerCount() {
    let count = 0;
    
    for (const event of this.eventNames()) {
      count += this.listenerCount(event);
    }
    
    for (const listeners of this.wildcardListeners.values()) {
      count += listeners.size;
    }
    
    for (const listeners of this.asyncListeners.values()) {
      count += listeners.size;
    }
    
    return count;
  }
  
  /**
   * Wait for event with timeout
   */
  async waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = this.timers.setTimeout(`waitFor-${event}`, () => {
        this.off(event, handler);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);
      
      const handler = (...args) => {
        this.timers.clearTimeout(`waitFor-${event}`);
        resolve(args);
      };
      
      this.once(event, handler);
    });
  }
  
  /**
   * Create event channel for pub/sub pattern
   */
  createChannel(name) {
    return new EventChannel(this, name);
  }
  
  /**
   * Get listener statistics for event
   */
  getEventStats(event) {
    if (!this.listeners.has(event)) {
      return null;
    }
    
    const listeners = this.listeners.get(event);
    const stats = {
      count: listeners.size,
      listeners: []
    };
    
    for (const [id, data] of listeners) {
      stats.listeners.push({
        id,
        callCount: data.callCount,
        averageDuration: data.callCount > 0 
          ? (data.totalDuration / data.callCount).toFixed(2) 
          : 0,
        addedAt: new Date(data.addedAt).toISOString()
      });
    }
    
    return stats;
  }
  
  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalListeners: this.getTotalListenerCount(),
      eventCount: this.eventNames().length,
      wildcardPatterns: this.wildcardListeners.size,
      asyncEvents: this.asyncListeners.size,
      memoryUsage: process.memoryUsage()
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    if (this.options.enableMetrics) {
      stateManager.set('eventBus', 'metrics', this.metrics);
      stateManager.set('eventBus', 'listenerCount', this.getTotalListenerCount());
      stateManager.set('eventBus', 'events', this.eventNames());
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.timers.clearAll();
    this.removeAllListeners();
    this.listeners.clear();
    this.wildcardListeners.clear();
    this.asyncListeners.clear();
    this.onceListeners.clear();
    this.listenerCounts.clear();
  }
}

/**
 * Event Channel for pub/sub pattern
 */
class EventChannel {
  constructor(bus, name) {
    this.bus = bus;
    this.name = name;
    this.prefix = `channel:${name}:`;
  }
  
  publish(topic, data) {
    this.bus.emit(`${this.prefix}${topic}`, data);
  }
  
  subscribe(topic, handler) {
    this.bus.on(`${this.prefix}${topic}`, handler);
    return () => this.unsubscribe(topic, handler);
  }
  
  unsubscribe(topic, handler) {
    this.bus.off(`${this.prefix}${topic}`, handler);
  }
  
  once(topic, handler) {
    this.bus.once(`${this.prefix}${topic}`, handler);
  }
  
  async waitFor(topic, timeout) {
    return this.bus.waitFor(`${this.prefix}${topic}`, timeout);
  }
}

// Singleton instance
let instance = null;

function getEventBus(options) {
  if (!instance) {
    instance = new EventBus(options);
  }
  return instance;
}

module.exports = {
  EventBus,
  EventChannel,
  getEventBus,
  eventBus: getEventBus(),
  
  // Helper methods
  emit: (event, ...args) => getEventBus().emit(event, ...args),
  on: (event, listener, options) => getEventBus().on(event, listener, options),
  once: (event, listener) => getEventBus().once(event, listener),
  off: (event, listener) => getEventBus().off(event, listener),
  waitFor: (event, timeout) => getEventBus().waitFor(event, timeout)
};