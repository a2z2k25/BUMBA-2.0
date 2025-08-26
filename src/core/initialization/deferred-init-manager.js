/**
 * BUMBA Deferred Initialization Manager
 * Manages progressive initialization with timeout control and retry logic
 */

const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

class DeferredInitManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxInitTime: options.maxInitTime || 5000, // 5 seconds max per component
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      priorityOrder: options.priorityOrder || ['critical', 'high', 'normal', 'low'],
      ...options
    };
    
    this.initQueue = new Map();
    this.initStatus = new Map();
    this.initPromises = new Map();
    this.startTime = null;
    this.isInitializing = false;
  }

  /**
   * Register a component for deferred initialization
   */
  register(name, initFunction, options = {}) {
    const priority = options.priority || 'normal';
    const timeout = options.timeout || this.options.maxInitTime;
    
    if (!this.initQueue.has(priority)) {
      this.initQueue.set(priority, []);
    }
    
    this.initQueue.get(priority).push({
      name,
      initFunction,
      timeout,
      retryCount: 0,
      options
    });
    
    this.initStatus.set(name, 'pending');
    logger.debug(`Registered ${name} for deferred initialization (priority: ${priority})`);
  }

  /**
   * Execute deferred initialization with proper timeout and retry logic
   */
  async initialize() {
    if (this.isInitializing) {
      logger.warn('Deferred initialization already in progress');
      return this.getInitPromise();
    }
    
    this.isInitializing = true;
    this.startTime = Date.now();
    
    logger.info('🟢 Starting deferred initialization process...');
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    try {
      // Process initialization by priority
      for (const priority of this.options.priorityOrder) {
        const components = this.initQueue.get(priority) || [];
        
        if (components.length > 0) {
          logger.info(`Initializing ${priority} priority components...`);
          
          // Use Promise.allSettled for parallel initialization within priority group
          const initPromises = components.map(component => 
            this.initializeComponent(component)
          );
          
          const settledResults = await Promise.allSettled(initPromises);
          
          settledResults.forEach((result, index) => {
            const component = components[index];
            if (result.status === 'fulfilled' && result.value) {
              results.successful.push(component.name);
            } else {
              results.failed.push({
                name: component.name,
                error: result.reason || 'Unknown error'
              });
            }
          });
        }
      }
      
      const elapsed = Date.now() - this.startTime;
      
      logger.info(`🏁 Deferred initialization complete in ${elapsed}ms`);
      logger.info(`  Successful: ${results.successful.length}`);
      if (results.failed.length > 0) {
        logger.warn(`  Failed: ${results.failed.length}`);
        results.failed.forEach(f => 
          logger.warn(`    - ${f.name}: ${f.error}`)
        );
      }
      
      this.emit('initialized', results);
      return results;
      
    } catch (error) {
      logger.error('Fatal error during deferred initialization:', error);
      this.emit('error', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initialize a single component with timeout and retry
   */
  async initializeComponent(component) {
    const { name, initFunction, timeout, options } = component;
    
    try {
      this.initStatus.set(name, 'initializing');
      this.emit('component:start', name);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
      });
      
      // Race between initialization and timeout
      const result = await Promise.race([
        initFunction(),
        timeoutPromise
      ]);
      
      this.initStatus.set(name, 'initialized');
      this.emit('component:success', name);
      logger.debug(`🏁 ${name} initialized successfully`);
      
      return result;
      
    } catch (error) {
      component.retryCount++;
      
      // Check if we should retry
      if (component.retryCount < this.options.retryAttempts && !options.noRetry) {
        logger.warn(`${name} failed (attempt ${component.retryCount}), retrying...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        
        // Recursive retry
        return this.initializeComponent(component);
      }
      
      // Max retries reached or no retry allowed
      this.initStatus.set(name, 'failed');
      this.emit('component:failed', name, error);
      logger.error(`🔴 ${name} initialization failed: ${error.message}`);
      
      // Don't throw if component is optional
      if (options.optional) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Get initialization promise for await support
   */
  getInitPromise() {
    if (!this.initPromises.has('main')) {
      this.initPromises.set('main', this.initialize());
    }
    return this.initPromises.get('main');
  }

  /**
   * Check if a component is initialized
   */
  isInitialized(name) {
    return this.initStatus.get(name) === 'initialized';
  }

  /**
   * Get initialization status
   */
  getStatus() {
    const status = {
      isInitializing: this.isInitializing,
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      components: {}
    };
    
    for (const [name, state] of this.initStatus) {
      status.components[name] = state;
    }
    
    return status;
  }

  /**
   * Force initialization of a specific component
   */
  async initializeNow(name) {
    // Find component in queue
    for (const [priority, components] of this.initQueue) {
      const component = components.find(c => c.name === name);
      if (component) {
        return await this.initializeComponent(component);
      }
    }
    
    throw new Error(`Component ${name} not found in initialization queue`);
  }

  /**
   * Clear initialization state (for testing)
   */
  reset() {
    this.initQueue.clear();
    this.initStatus.clear();
    this.initPromises.clear();
    this.startTime = null;
    this.isInitializing = false;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  DeferredInitManager,
  getInstance: (options) => {
    if (!instance) {
      instance = new DeferredInitManager(options);
    }
    return instance;
  },
  resetInstance: () => {
    instance = null;
  }
};