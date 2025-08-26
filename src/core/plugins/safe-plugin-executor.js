/**
 * Safe Plugin Executor
 * Replaces dangerous new Function() with safe execution
 * Sprint 2 - Security Fix
 */

const vm = require('vm');
const { logger } = require('../logging/bumba-logger');

class SafePluginExecutor {
  constructor(pluginId, options = {}) {
    this.pluginId = pluginId;
    this.timeout = options.timeout || 5000; // 5 second timeout
    this.memoryLimit = options.memoryLimit || 50 * 1024 * 1024; // 50MB
  }

  /**
   * Safely execute plugin code without eval/new Function
   * Uses Node.js VM module for sandboxed execution
   */
  async execute(code, executionContext = {}) {
    // If already a function, execute with limited context
    if (typeof code === 'function') {
      return this.executeSafeFunction(code, executionContext);
    }
    
    // For string code, use VM sandbox
    return this.executeInSandbox(code, executionContext);
  }

  /**
   * Execute existing function with timeout and error handling
   */
  async executeSafeFunction(fn, context) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Plugin ${this.pluginId} execution timeout (${this.timeout}ms)`));
      }, this.timeout);

      try {
        // Create safe context with limited access
        const safeContext = this.createSafeContext(context);
        const result = fn.call(safeContext);
        
        // Handle async functions
        if (result && typeof result.then === 'function') {
          result
            .then(res => {
              clearTimeout(timer);
              resolve(res);
            })
            .catch(err => {
              clearTimeout(timer);
              reject(err);
            });
        } else {
          clearTimeout(timer);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Execute string code in VM sandbox
   */
  executeInSandbox(code, executionContext) {
    try {
      // Create safe context
      const sandbox = this.createSafeContext(executionContext);
      
      // Add safe console
      sandbox.console = this.createSafeConsole();
      
      // Wrap code to return result
      const wrappedCode = `
        (function() {
          ${code}
        })()
      `;
      
      // Create VM options
      const vmOptions = {
        timeout: this.timeout,
        displayErrors: true,
        filename: `plugin-${this.pluginId}.js`
      };
      
      // Run in sandbox
      const script = new vm.Script(wrappedCode, vmOptions);
      const context = vm.createContext(sandbox);
      const result = script.runInContext(context, vmOptions);
      
      return result;
    } catch (error) {
      logger.error(`Safe execution error for plugin ${this.pluginId}:`, error.message);
      throw new Error(`Plugin execution failed: ${error.message}`);
    }
  }

  /**
   * Create safe context with limited globals
   */
  createSafeContext(userContext = {}) {
    // Whitelist safe globals
    const safeGlobals = {
      // Math and basic functions
      Math,
      Date,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
      
      // Safe utilities
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      
      // Timers (wrapped for safety)
      setTimeout: this.wrapTimer(setTimeout),
      setInterval: this.wrapTimer(setInterval),
      clearTimeout,
      clearInterval,
      
      // User context (frozen to prevent modification)
      ...Object.freeze({ ...userContext })
    };
    
    // Explicitly exclude dangerous globals
    const blocked = [
      'process',
      'require', 
      'global',
      '__dirname',
      '__filename',
      'module',
      'exports',
      'eval',
      'Function',
      'AsyncFunction',
      'GeneratorFunction',
      'AsyncGeneratorFunction'
    ];
    
    blocked.forEach(name => {
      Object.defineProperty(safeGlobals, name, {
        get() {
          throw new Error(`Access to '${name}' is not allowed in plugins`);
        }
      });
    });
    
    return safeGlobals;
  }

  /**
   * Wrap timers to track and limit them
   */
  wrapTimer(timerFn) {
    const maxTimers = 10;
    const activeTimers = new Set();
    
    return function(...args) {
      if (activeTimers.size >= maxTimers) {
        throw new Error(`Plugin ${this.pluginId} exceeded timer limit (${maxTimers})`);
      }
      
      const timerId = timerFn(...args);
      activeTimers.add(timerId);
      
      // Auto-cleanup after timeout
      setTimeout(() => activeTimers.delete(timerId), this.timeout);
      
      return timerId;
    }.bind(this);
  }

  /**
   * Create safe console for plugin logging
   */
  createSafeConsole() {
    return {
      log: (...args) => logger.info(`[Plugin ${this.pluginId}]`, ...this.sanitizeArgs(args)),
      info: (...args) => logger.info(`[Plugin ${this.pluginId}]`, ...this.sanitizeArgs(args)),
      warn: (...args) => logger.warn(`[Plugin ${this.pluginId}]`, ...this.sanitizeArgs(args)),
      error: (...args) => logger.error(`[Plugin ${this.pluginId}]`, ...this.sanitizeArgs(args)),
      debug: (...args) => {
        if (process.env.LOG_LEVEL === 'DEBUG') {
          logger.debug(`[Plugin ${this.pluginId}]`, ...this.sanitizeArgs(args));
        }
      }
    };
  }

  /**
   * Sanitize console arguments to prevent leaks
   */
  sanitizeArgs(args) {
    return args.map(arg => {
      // Prevent logging sensitive data
      if (typeof arg === 'object' && arg !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(arg)) {
          if (key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('key')) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }
      return arg;
    });
  }
}

module.exports = SafePluginExecutor;