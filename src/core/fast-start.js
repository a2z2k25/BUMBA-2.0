/**
 * BUMBA Fast Start Mode
 * Optimizes loading time by deferring non-critical initialization
 */

const { logger } = require('./logging/bumba-logger');

class FastStart {
  constructor() {
    this.enabled = process.env.BUMBA_FAST_START === 'true' || 
                   process.env.BUMBA_OFFLINE === 'true';
    
    this.deferredTasks = [];
    this.initialized = false;
  }
  
  /**
   * Initialize only critical components
   */
  async initializeCritical() {
    const start = Date.now();
    
    // Critical components only
    const critical = [
      './config/offline-mode',
      './commands/index',
      './memory/memory-optimizer'
    ];
    
    for (const module of critical) {
      try {
        require(module);
      } catch (error) {
        // Non-blocking - continue even if module fails
        if (process.env.LOG_LEVEL === 'DEBUG') {
          logger.debug(`Optional module ${module} not loaded`);
        }
      }
    }
    
    this.initialized = true;
    
    if (process.env.LOG_LEVEL === 'DEBUG') {
      logger.info(`Critical components loaded in ${Date.now() - start}ms`);
    }
    
    // Defer non-critical initialization
    if (this.enabled) {
      setImmediate(() => this.initializeDeferred());
    }
    
    return true;
  }
  
  /**
   * Defer initialization of a component
   */
  defer(task) {
    this.deferredTasks.push(task);
  }
  
  /**
   * Initialize deferred components in background
   */
  async initializeDeferred() {
    // Wait a bit for main process to stabilize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Process deferred tasks
    for (const task of this.deferredTasks) {
      try {
        if (typeof task === 'function') {
          await task();
        }
      } catch (error) {
        // Non-critical failures are ignored
        if (process.env.LOG_LEVEL === 'DEBUG') {
          logger.debug('Deferred task failed:', error.message);
        }
      }
    }
    
    this.deferredTasks = [];
  }
  
  /**
   * Lazy load a module only when needed
   */
  lazyRequire(modulePath) {
    let cached = null;
    
    return new Proxy({}, {
      get(target, prop) {
        if (!cached) {
          cached = require(modulePath);
        }
        return cached[prop];
      }
    });
  }
  
  /**
   * Create lazy-loaded department managers
   */
  createLazyManagers() {
    return {
      backend: this.lazyRequire('./departments/backend-engineer-manager-optimized'),
      design: this.lazyRequire('./departments/design-engineer-manager'),
      product: this.lazyRequire('./departments/product-strategist-manager')
    };
  }
  
  /**
   * Get startup statistics
   */
  getStats() {
    return {
      mode: this.enabled ? 'fast' : 'normal',
      initialized: this.initialized,
      deferredPending: this.deferredTasks.length,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getFastStart: () => {
    if (!instance) {
      instance = new FastStart();
    }
    return instance;
  },
  
  initialize: async () => {
    return module.exports.getFastStart().initializeCritical();
  },
  
  defer: (task) => {
    module.exports.getFastStart().defer(task);
  },
  
  lazyRequire: (path) => {
    return module.exports.getFastStart().lazyRequire(path);
  }
};