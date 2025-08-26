/**
 * BUMBA State Cleanup Manager
 * Prevents memory leaks and ensures proper resource cleanup
 */

const { logger } = require('../logging/bumba-logger');

class StateCleanupManager {
  constructor() {
    this.intervals = new Set();
    this.timeouts = new Set();
    this.watchers = new Set();
    this.listeners = new Map();
    this.resources = new Map();
    this.cleanupHandlers = new Map();
    this.isShuttingDown = false;
    
    // Register process cleanup handlers
    this.registerProcessHandlers();
  }

  /**
   * Register a setInterval and track it
   */
  registerInterval(fn, delay, name = 'unnamed') {
    if (this.isShuttingDown) {
      logger.warn(`Cannot register interval during shutdown: ${name}`);
      return null;
    }

    const intervalId = setInterval(fn, delay);
    const intervalInfo = {
      id: intervalId,
      name,
      created: Date.now(),
      delay
    };
    
    this.intervals.add(intervalInfo);
    
    // Return wrapped interval with cleanup
    return {
      id: intervalId,
      clear: () => this.clearInterval(intervalInfo)
    };
  }

  /**
   * Register a setTimeout and track it
   */
  registerTimeout(fn, delay, name = 'unnamed') {
    if (this.isShuttingDown) {
      logger.warn(`Cannot register timeout during shutdown: ${name}`);
      return null;
    }

    const timeoutId = setTimeout(() => {
      fn();
      // Auto-remove from tracking after execution
      this.timeouts.delete(timeoutInfo);
    }, delay);
    
    const timeoutInfo = {
      id: timeoutId,
      name,
      created: Date.now(),
      delay
    };
    
    this.timeouts.add(timeoutInfo);
    
    // Return wrapped timeout with cleanup
    return {
      id: timeoutId,
      clear: () => this.clearTimeout(timeoutInfo)
    };
  }

  /**
   * Clear a tracked interval
   */
  clearInterval(intervalInfo) {
    clearInterval(intervalInfo.id);
    this.intervals.delete(intervalInfo);
  }

  /**
   * Clear a tracked timeout
   */
  clearTimeout(timeoutInfo) {
    clearTimeout(timeoutInfo.id);
    this.timeouts.delete(timeoutInfo);
  }

  /**
   * Register a file watcher
   */
  registerWatcher(watcher, path) {
    const watcherInfo = {
      watcher,
      path,
      created: Date.now()
    };
    
    this.watchers.add(watcherInfo);
    
    return {
      close: () => this.closeWatcher(watcherInfo)
    };
  }

  /**
   * Close a file watcher
   */
  closeWatcher(watcherInfo) {
    if (watcherInfo.watcher.close) {
      watcherInfo.watcher.close();
    }
    this.watchers.delete(watcherInfo);
  }

  /**
   * Track event listeners
   */
  trackListener(emitter, event, listener) {
    if (!this.listeners.has(emitter)) {
      this.listeners.set(emitter, new Map());
    }
    
    const emitterListeners = this.listeners.get(emitter);
    if (!emitterListeners.has(event)) {
      emitterListeners.set(event, new Set());
    }
    
    emitterListeners.get(event).add(listener);
  }

  /**
   * Remove tracked listener
   */
  removeListener(emitter, event, listener) {
    if (this.listeners.has(emitter)) {
      const emitterListeners = this.listeners.get(emitter);
      if (emitterListeners.has(event)) {
        emitterListeners.get(event).delete(listener);
      }
    }
  }

  /**
   * Register a generic resource
   */
  registerResource(name, resource, cleanupFn) {
    this.resources.set(name, {
      resource,
      cleanup: cleanupFn,
      created: Date.now()
    });
  }

  /**
   * Register a cleanup handler for a module
   */
  registerCleanupHandler(module, handler) {
    if (!this.cleanupHandlers.has(module)) {
      this.cleanupHandlers.set(module, []);
    }
    this.cleanupHandlers.get(module).push(handler);
  }

  /**
   * Clean up all resources
   */
  async cleanup() {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    logger.info('🧹 Starting state cleanup...');
    
    const cleanupTasks = [];
    
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval.id);
      logger.debug(`Cleared interval: ${interval.name}`);
    }
    this.intervals.clear();
    
    // Clear all timeouts
    for (const timeout of this.timeouts) {
      clearTimeout(timeout.id);
      logger.debug(`Cleared timeout: ${timeout.name}`);
    }
    this.timeouts.clear();
    
    // Close all watchers
    for (const watcherInfo of this.watchers) {
      if (watcherInfo.watcher.close) {
        watcherInfo.watcher.close();
        logger.debug(`Closed watcher: ${watcherInfo.path}`);
      }
    }
    this.watchers.clear();
    
    // Remove all tracked listeners
    for (const [emitter, events] of this.listeners) {
      for (const [event, listeners] of events) {
        for (const listener of listeners) {
          emitter.removeListener(event, listener);
        }
      }
    }
    this.listeners.clear();
    
    // Clean up generic resources
    for (const [name, info] of this.resources) {
      try {
        if (info.cleanup) {
          cleanupTasks.push(
            Promise.resolve(info.cleanup(info.resource))
              .catch(error => logger.error(`Resource cleanup failed for ${name}: ${error.message}`))
          );
        }
      } catch (error) {
        logger.error(`Resource cleanup failed for ${name}: ${error.message}`);
      }
    }
    this.resources.clear();
    
    // Run module cleanup handlers
    for (const [module, handlers] of this.cleanupHandlers) {
      for (const handler of handlers) {
        try {
          cleanupTasks.push(
            Promise.resolve(handler())
              .catch(error => logger.error(`Module cleanup failed for ${module}: ${error.message}`))
          );
        } catch (error) {
          logger.error(`Module cleanup failed for ${module}: ${error.message}`);
        }
      }
    }
    
    // Wait for all cleanup tasks
    await Promise.allSettled(cleanupTasks);
    
    logger.info('🏁 State cleanup complete');
  }

  /**
   * Get current resource usage
   */
  getResourceUsage() {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      watchers: this.watchers.size,
      listeners: Array.from(this.listeners.values()).reduce(
        (sum, events) => sum + Array.from(events.values()).reduce(
          (eventSum, listeners) => eventSum + listeners.size, 0
        ), 0
      ),
      resources: this.resources.size,
      memory: process.memoryUsage()
    };
  }

  /**
   * Check for potential memory leaks
   */
  checkForLeaks() {
    const issues = [];
    
    // Check for old intervals
    const now = Date.now();
    for (const interval of this.intervals) {
      const age = now - interval.created;
      if (age > 3600000) { // 1 hour
        issues.push({
          type: 'interval',
          name: interval.name,
          age: Math.round(age / 60000) + ' minutes'
        });
      }
    }
    
    // Check for excessive listeners
    for (const [emitter, events] of this.listeners) {
      for (const [event, listeners] of events) {
        if (listeners.size > 10) {
          issues.push({
            type: 'listeners',
            event,
            count: listeners.size
          });
        }
      }
    }
    
    // Check memory usage
    const mem = process.memoryUsage();
    if (mem.heapUsed > 500 * 1024 * 1024) { // 500MB
      issues.push({
        type: 'memory',
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB'
      });
    }
    
    return issues;
  }

  /**
   * Register process cleanup handlers
   */
  registerProcessHandlers() {
    // Handle process termination
    const handleShutdown = async (signal) => {
      logger.info(`🔴 Received ${signal}, cleaning up...`);
      await this.cleanup();
      process.exit(0);
    };
    
    // Register handlers
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.cleanup().then(() => process.exit(1));
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    });
  }

  /**
   * Create a managed context for operations
   */
  createManagedContext(name) {
    const context = {
      intervals: new Set(),
      timeouts: new Set(),
      resources: new Map(),
      
      setInterval: (fn, delay) => {
        const interval = this.registerInterval(fn, delay, `${name}:interval`);
        context.intervals.add(interval);
        return interval;
      },
      
      setTimeout: (fn, delay) => {
        const timeout = this.registerTimeout(fn, delay, `${name}:timeout`);
        context.timeouts.add(timeout);
        return timeout;
      },
      
      addResource: (resourceName, resource, cleanup) => {
        this.registerResource(`${name}:${resourceName}`, resource, cleanup);
        context.resources.set(resourceName, resource);
      },
      
      cleanup: async () => {
        // Clear context-specific resources
        for (const interval of context.intervals) {
          if (interval) interval.clear();
        }
        for (const timeout of context.timeouts) {
          if (timeout) timeout.clear();
        }
        for (const [resourceName] of context.resources) {
          const fullName = `${name}:${resourceName}`;
          const info = this.resources.get(fullName);
          if (info && info.cleanup) {
            await info.cleanup(info.resource);
          }
          this.resources.delete(fullName);
        }
      }
    };
    
    return context;
  }

  /**
   * Register a cleanup task
   */
  register(id, cleanupFn, options = {}) {
    if (this.isShuttingDown) {
      logger.warn(`Cannot register cleanup during shutdown: ${id}`);
      return false;
    }
    
    const cleanupInfo = {
      id,
      cleanup: cleanupFn,
      priority: options.priority || 0,
      timeout: options.timeout || 5000,
      registered: Date.now(),
      type: options.type || 'generic'
    };
    
    this.resources.set(id, cleanupInfo);
    
    logger.debug(`Registered cleanup task: ${id}`);
    
    return true;
  }

  /**
   * Unregister a cleanup task
   */
  unregister(id) {
    if (this.resources.has(id)) {
      this.resources.delete(id);
      logger.debug(`Unregistered cleanup task: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Clean up all registered resources
   */
  async cleanupAll(options = {}) {
    const timeout = options.timeout || 30000;
    const parallel = options.parallel !== false;
    
    logger.info(`Starting cleanup of ${this.resources.size} resources...`);
    
    // Sort by priority
    const sorted = Array.from(this.resources.entries())
      .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));
    
    const cleanupPromises = [];
    const errors = [];
    
    for (const [id, info] of sorted) {
      const cleanupPromise = this.executeCleanup(id, info, timeout)
        .catch(error => {
          errors.push({ id, error: error.message });
          logger.error(`Cleanup failed for ${id}: ${error.message}`);
        });
      
      if (parallel) {
        cleanupPromises.push(cleanupPromise);
      } else {
        await cleanupPromise;
      }
    }
    
    if (parallel) {
      await Promise.allSettled(cleanupPromises);
    }
    
    // Also run the existing cleanup
    await this.cleanup();
    
    return {
      cleaned: sorted.length - errors.length,
      failed: errors.length,
      errors
    };
  }

  /**
   * Execute a single cleanup task
   */
  async executeCleanup(id, info, timeout) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Cleanup timeout for ${id}`)), timeout)
    );
    
    const cleanupPromise = Promise.resolve(
      info.cleanup ? info.cleanup(info.resource) : null
    );
    
    return Promise.race([cleanupPromise, timeoutPromise]);
  }

  /**
   * Schedule a cleanup for later
   */
  scheduleCleanup(delay = 0, options = {}) {
    const cleanupId = `scheduled_${Date.now()}_${Math.random()}`;
    
    if (delay <= 0) {
      // Immediate cleanup
      setImmediate(() => this.cleanupAll(options));
      return cleanupId;
    }
    
    const timeoutId = setTimeout(() => {
      this.cleanupAll(options)
        .then(result => {
          logger.info(`Scheduled cleanup completed: ${result.cleaned} cleaned, ${result.failed} failed`);
        })
        .catch(error => {
          logger.error(`Scheduled cleanup failed: ${error.message}`);
        });
      
      // Remove from scheduled cleanups
      this.timeouts.delete(timeoutInfo);
    }, delay);
    
    const timeoutInfo = {
      id: timeoutId,
      name: `scheduled-cleanup-${cleanupId}`,
      created: Date.now(),
      delay,
      cleanupId
    };
    
    this.timeouts.add(timeoutInfo);
    
    logger.info(`Scheduled cleanup in ${delay}ms (ID: ${cleanupId})`);
    
    return cleanupId;
  }

  /**
   * Get list of pending cleanups
   */
  getPendingCleanups() {
    const pending = [];
    
    // Add registered resources
    for (const [id, info] of this.resources) {
      pending.push({
        id,
        type: info.type || 'resource',
        priority: info.priority || 0,
        age: Date.now() - (info.registered || info.created || 0)
      });
    }
    
    // Add scheduled cleanups
    for (const timeout of this.timeouts) {
      if (timeout.name && timeout.name.includes('scheduled-cleanup')) {
        pending.push({
          id: timeout.cleanupId || timeout.id,
          type: 'scheduled',
          remainingTime: Math.max(0, timeout.delay - (Date.now() - timeout.created)),
          created: timeout.created
        });
      }
    }
    
    // Add intervals
    for (const interval of this.intervals) {
      pending.push({
        id: interval.id,
        type: 'interval',
        name: interval.name,
        age: Date.now() - interval.created
      });
    }
    
    // Add watchers
    for (const watcher of this.watchers) {
      pending.push({
        id: watcher.path,
        type: 'watcher',
        path: watcher.path,
        age: Date.now() - watcher.created
      });
    }
    
    return {
      count: pending.length,
      pending,
      summary: {
        resources: this.resources.size,
        intervals: this.intervals.size,
        timeouts: this.timeouts.size,
        watchers: this.watchers.size,
        listeners: this.listeners.size
      }
    };
  }

  /**
   * Reset the cleanup manager
   */
  async reset(options = {}) {
    const force = options.force || false;
    
    if (!force && !this.isShuttingDown) {
      // Perform cleanup first
      await this.cleanup();
    }
    
    // Clear all collections
    this.intervals.clear();
    this.timeouts.clear();
    this.watchers.clear();
    this.listeners.clear();
    this.resources.clear();
    this.cleanupHandlers.clear();
    
    // Reset state
    this.isShuttingDown = false;
    
    logger.info('State Cleanup Manager has been reset');
    
    return {
      success: true,
      timestamp: Date.now()
    };
  }
}

// Create singleton instance
const stateCleanupManager = new StateCleanupManager();

// Export with standard pattern
module.exports = {
  StateCleanupManager,  // Class export
  stateCleanupManager,  // Singleton instance
  default: stateCleanupManager  // Default export for backward compatibility
};