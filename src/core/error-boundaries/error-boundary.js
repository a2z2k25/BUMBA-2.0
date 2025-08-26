/**
 * Error Boundary System
 * React-style error boundaries for non-React applications
 * Sprint 9 - Security & Stability Fix
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const EventEmitter = require('events');

/**
 * Base Error Boundary class
 * Wraps code execution with error catching and recovery
 */
class ErrorBoundary extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      fallback: options.fallback || null,
      onError: options.onError || null,
      captureAsync: options.captureAsync !== false,
      timeout: options.timeout || 30000,
      silent: options.silent || false
    };
    
    // Initialize state
    this.errorCount = 0;
    this.retryCount = 0;
    this.lastError = null;
    this.state = 'ready';
    this.hasErrored = false;
    
    // Register with state manager
    stateManager.register(`errorBoundary:${name}`, {
      errorCount: 0,
      retryCount: 0,
      state: 'ready',
      lastError: null
    });
  }

  /**
   * Execute code within error boundary
   */
  async execute(fn, context = {}) {
    try {
      this.state = 'executing';
      this.updateState({ state: 'executing' });
      
      // Set timeout if configured
      const timeoutPromise = this.options.timeout ? 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after ${this.options.timeout}ms`)), 
                    this.options.timeout)
        ) : null;
      
      // Execute function
      let result;
      if (timeoutPromise) {
        result = await Promise.race([
          this.wrapAsync(fn, context),
          timeoutPromise
        ]);
      } else {
        result = await this.wrapAsync(fn, context);
      }
      
      // Success - reset error state
      this.resetErrorState();
      this.state = 'success';
      this.updateState({ state: 'success', errorCount: 0, retryCount: 0 });
      
      return result;
      
    } catch (error) {
      return this.handleError(error, fn, context);
    }
  }

  /**
   * Wrap async functions to capture errors
   */
  async wrapAsync(fn, context) {
    if (this.options.captureAsync && typeof fn === 'function') {
      try {
        const result = fn(context);
        // Handle both async and sync functions
        if (result && typeof result.then === 'function') {
          return await result;
        }
        return result;
      } catch (error) {
        throw this.enhanceError(error, context);
      }
    }
    return fn(context);
  }

  /**
   * Handle caught errors
   */
  async handleError(error, fn, context) {
    this.errorCount++;
    this.lastError = error;
    this.hasErrored = true;
    this.state = 'error';
    
    // Log error
    if (!this.options.silent) {
      logger.error(`ErrorBoundary [${this.name}] caught error:`, error);
    }
    
    // Update state
    this.updateState({
      state: 'error',
      errorCount: this.errorCount,
      lastError: this.serializeError(error)
    });
    
    // Emit error event
    this.emit('error', {
      boundary: this.name,
      error,
      context,
      errorCount: this.errorCount
    });
    
    // Call custom error handler
    if (this.options.onError) {
      try {
        await this.options.onError(error, context, this);
      } catch (handlerError) {
        logger.error(`Error in onError handler:`, handlerError);
      }
    }
    
    // Attempt retry if within limits
    if (this.retryCount < this.options.maxRetries) {
      return this.retry(fn, context);
    }
    
    // Use fallback if available
    if (this.options.fallback) {
      return this.executeFallback(context);
    }
    
    // Re-throw if no recovery options
    throw this.createBoundaryError(error);
  }

  /**
   * Retry failed operation
   */
  async retry(fn, context) {
    this.retryCount++;
    
    logger.info(`Retrying operation [${this.name}] - Attempt ${this.retryCount}/${this.options.maxRetries}`);
    
    // Exponential backoff
    const delay = this.options.retryDelay * Math.pow(2, this.retryCount - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Update state
    this.updateState({ retryCount: this.retryCount, state: 'retrying' });
    
    // Retry execution
    return this.execute(fn, context);
  }

  /**
   * Execute fallback function
   */
  async executeFallback(context) {
    try {
      logger.info(`Executing fallback for [${this.name}]`);
      this.state = 'fallback';
      this.updateState({ state: 'fallback' });
      
      const result = typeof this.options.fallback === 'function' 
        ? await this.options.fallback(this.lastError, context)
        : this.options.fallback;
      
      this.emit('fallback', {
        boundary: this.name,
        error: this.lastError,
        result
      });
      
      return result;
      
    } catch (fallbackError) {
      logger.error(`Fallback failed for [${this.name}]:`, fallbackError);
      throw this.createBoundaryError(fallbackError);
    }
  }

  /**
   * Reset error state
   */
  resetErrorState() {
    this.errorCount = 0;
    this.retryCount = 0;
    this.lastError = null;
    this.hasErrored = false;
  }

  /**
   * Update state manager
   */
  updateState(updates) {
    const namespace = `errorBoundary:${this.name}`;
    for (const [key, value] of Object.entries(updates)) {
      stateManager.set(namespace, key, value);
    }
  }

  /**
   * Enhance error with context
   */
  enhanceError(error, context) {
    if (error && typeof error === 'object') {
      error.boundary = this.name;
      error.context = context;
      error.timestamp = Date.now();
    }
    return error;
  }

  /**
   * Create boundary-specific error
   */
  createBoundaryError(originalError) {
    const error = new Error(`ErrorBoundary [${this.name}] failed after ${this.retryCount} retries`);
    error.name = 'ErrorBoundaryError';
    error.boundary = this.name;
    error.originalError = originalError;
    error.errorCount = this.errorCount;
    error.retryCount = this.retryCount;
    return error;
  }

  /**
   * Serialize error for state storage
   */
  serializeError(error) {
    if (!error) return null;
    
    return {
      message: error.message || String(error),
      name: error.name || 'Error',
      stack: error.stack || '',
      code: error.code,
      timestamp: Date.now()
    };
  }

  /**
   * Get boundary statistics
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      errorCount: this.errorCount,
      retryCount: this.retryCount,
      hasErrored: this.hasErrored,
      lastError: this.serializeError(this.lastError)
    };
  }

  /**
   * Check if boundary is healthy
   */
  isHealthy() {
    return this.state !== 'error' && this.errorCount === 0;
  }

  /**
   * Reset boundary
   */
  reset() {
    this.resetErrorState();
    this.state = 'ready';
    this.updateState({
      state: 'ready',
      errorCount: 0,
      retryCount: 0,
      lastError: null
    });
    
    this.emit('reset', { boundary: this.name });
  }
}

/**
 * Component Error Boundary
 * Wraps entire components with error handling
 */
class ComponentBoundary extends ErrorBoundary {
  constructor(component, options = {}) {
    super(`component:${component.name || 'unknown'}`, options);
    this.component = component;
    
    // Wrap component methods
    this.wrapComponent();
  }

  /**
   * Wrap all component methods with error handling
   */
  wrapComponent() {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.component))
      .filter(prop => 
        typeof this.component[prop] === 'function' && 
        prop !== 'constructor'
      );
    
    methods.forEach(method => {
      const original = this.component[method];
      this.component[method] = async (...args) => {
        return this.execute(() => original.apply(this.component, args), {
          method,
          args
        });
      };
    });
  }
}

/**
 * Async Error Boundary
 * Special handling for async operations
 */
class AsyncBoundary extends ErrorBoundary {
  constructor(name, options = {}) {
    super(name, {
      ...options,
      captureAsync: true
    });
    
    this.pendingOperations = new Map();
  }

  /**
   * Execute async operation with tracking
   */
  async executeAsync(id, fn, context = {}) {
    // Track pending operation
    this.pendingOperations.set(id, {
      startTime: Date.now(),
      context
    });
    
    try {
      const result = await this.execute(fn, context);
      this.pendingOperations.delete(id);
      return result;
    } catch (error) {
      this.pendingOperations.delete(id);
      throw error;
    }
  }

  /**
   * Cancel pending operation
   */
  cancel(id) {
    if (this.pendingOperations.has(id)) {
      this.pendingOperations.delete(id);
      this.emit('cancelled', { boundary: this.name, operationId: id });
      return true;
    }
    return false;
  }

  /**
   * Get pending operations
   */
  getPending() {
    return Array.from(this.pendingOperations.entries()).map(([id, data]) => ({
      id,
      ...data,
      duration: Date.now() - data.startTime
    }));
  }
}

/**
 * Global Error Boundary Manager
 */
class ErrorBoundaryManager {
  constructor() {
    this.boundaries = new Map();
    this.globalHandlers = [];
    
    // Register state namespace
    stateManager.register('errorBoundaries', {
      count: 0,
      totalErrors: 0,
      boundaries: []
    });
    
    // Set up global error catching
    this.setupGlobalHandlers();
  }

  /**
   * Create new error boundary
   */
  create(name, options = {}) {
    if (this.boundaries.has(name)) {
      logger.warn(`ErrorBoundary ${name} already exists`);
      return this.boundaries.get(name);
    }
    
    const boundary = new ErrorBoundary(name, options);
    
    // Track boundary
    this.boundaries.set(name, boundary);
    
    // Listen to boundary events
    boundary.on('error', (data) => this.handleBoundaryError(data));
    boundary.on('fallback', (data) => this.handleBoundaryFallback(data));
    boundary.on('reset', (data) => this.handleBoundaryReset(data));
    
    // Update state
    this.updateGlobalState();
    
    return boundary;
  }

  /**
   * Create component boundary
   */
  wrapComponent(component, options = {}) {
    const boundary = new ComponentBoundary(component, options);
    const name = boundary.name;
    
    this.boundaries.set(name, boundary);
    this.updateGlobalState();
    
    return boundary;
  }

  /**
   * Create async boundary
   */
  createAsync(name, options = {}) {
    if (this.boundaries.has(name)) {
      return this.boundaries.get(name);
    }
    
    const boundary = new AsyncBoundary(name, options);
    this.boundaries.set(name, boundary);
    this.updateGlobalState();
    
    return boundary;
  }

  /**
   * Get boundary by name
   */
  get(name) {
    return this.boundaries.get(name);
  }

  /**
   * Remove boundary
   */
  remove(name) {
    if (this.boundaries.has(name)) {
      const boundary = this.boundaries.get(name);
      boundary.removeAllListeners();
      this.boundaries.delete(name);
      this.updateGlobalState();
      return true;
    }
    return false;
  }

  /**
   * Handle boundary error event
   */
  handleBoundaryError(data) {
    stateManager.set('errorBoundaries', 'totalErrors', 
      (stateManager.get('errorBoundaries', 'totalErrors') || 0) + 1
    );
    
    // Call global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler('error', data);
      } catch (err) {
        logger.error('Global error handler failed:', err);
      }
    });
  }

  /**
   * Handle boundary fallback event
   */
  handleBoundaryFallback(data) {
    logger.info(`Boundary ${data.boundary} using fallback`);
  }

  /**
   * Handle boundary reset event
   */
  handleBoundaryReset(data) {
    logger.info(`Boundary ${data.boundary} reset`);
  }

  /**
   * Update global state
   */
  updateGlobalState() {
    const boundaries = Array.from(this.boundaries.values()).map(b => b.getStats());
    
    stateManager.set('errorBoundaries', 'count', this.boundaries.size);
    stateManager.set('errorBoundaries', 'boundaries', boundaries);
  }

  /**
   * Set up global error handlers
   */
  setupGlobalHandlers() {
    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', reason);
      
      // Find appropriate boundary or create default
      const boundary = this.getDefaultBoundary();
      boundary.handleError(reason, () => promise, { type: 'unhandledRejection' });
    });
    
    // Catch uncaught exceptions (be very careful with this)
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      
      // Try to handle gracefully
      const boundary = this.getDefaultBoundary();
      boundary.handleError(error, () => {}, { type: 'uncaughtException' });
      
      // Give time for logging before exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  /**
   * Get or create default boundary
   */
  getDefaultBoundary() {
    if (!this.boundaries.has('global')) {
      return this.create('global', {
        maxRetries: 1,
        fallback: () => {
          logger.error('Global error boundary fallback triggered');
          return null;
        }
      });
    }
    return this.boundaries.get('global');
  }

  /**
   * Add global error handler
   */
  addGlobalHandler(handler) {
    if (typeof handler === 'function') {
      this.globalHandlers.push(handler);
    }
  }

  /**
   * Get all boundaries statistics
   */
  getAllStats() {
    return {
      count: this.boundaries.size,
      totalErrors: stateManager.get('errorBoundaries', 'totalErrors') || 0,
      boundaries: Array.from(this.boundaries.values()).map(b => b.getStats())
    };
  }

  /**
   * Reset all boundaries
   */
  resetAll() {
    this.boundaries.forEach(boundary => boundary.reset());
    stateManager.set('errorBoundaries', 'totalErrors', 0);
  }
}

// Create singleton instance
const errorBoundaryManager = new ErrorBoundaryManager();

// Export classes and manager
module.exports = {
  ErrorBoundary,
  ComponentBoundary,
  AsyncBoundary,
  ErrorBoundaryManager,
  errorBoundaryManager,
  
  // Convenience functions
  createBoundary: (name, options) => errorBoundaryManager.create(name, options),
  wrapComponent: (component, options) => errorBoundaryManager.wrapComponent(component, options),
  createAsyncBoundary: (name, options) => errorBoundaryManager.createAsync(name, options)
};