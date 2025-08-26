/**
 * Global State Manager
 * Replaces dangerous global variable usage with managed state
 * Sprint 7 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');
const EventEmitter = require('events');

class GlobalStateManager extends EventEmitter {
  constructor() {
    super();
    this._namespaces = new Map();
    this._validators = new Map();
    this._readonly = new Set();
    this._accessed = new Map(); // Track access for debugging
    
    // Prevent accidental global pollution
    this.setupGlobalProtection();
    
    logger.info('Global State Manager initialized - replacing unsafe globals');
  }

  /**
   * Register a state namespace with optional validator
   */
  register(namespace, initialState = {}, options = {}) {
    if (this._namespaces.has(namespace)) {
      logger.warn(`Namespace already registered: ${namespace}`);
      return false;
    }

    // Deep clone to prevent external mutations
    const state = this.deepClone(initialState);
    
    this._namespaces.set(namespace, state);
    
    if (options.validator) {
      this._validators.set(namespace, options.validator);
    }
    
    if (options.readonly) {
      this._readonly.add(namespace);
    }

    logger.debug(`Registered namespace: ${namespace}`);
    return true;
  }

  /**
   * Get value from namespace
   */
  get(namespace, key = null) {
    if (!this._namespaces.has(namespace)) {
      logger.warn(`Namespace not found: ${namespace}`);
      return undefined;
    }

    // Track access for debugging
    this.trackAccess(namespace, key, 'get');

    const state = this._namespaces.get(namespace);
    
    if (key === null) {
      // Return deep clone to prevent mutations
      return this.deepClone(state);
    }

    // Support dot notation for nested access
    const value = this.getNestedValue(state, key);
    
    // Clone objects to prevent external mutations
    return typeof value === 'object' ? this.deepClone(value) : value;
  }

  /**
   * Set value in namespace
   */
  set(namespace, key, value) {
    if (!this._namespaces.has(namespace)) {
      logger.warn(`Cannot set - namespace not found: ${namespace}`);
      return false;
    }

    if (this._readonly.has(namespace)) {
      logger.error(`Cannot modify readonly namespace: ${namespace}`);
      return false;
    }

    // Validate if validator exists
    const validator = this._validators.get(namespace);
    if (validator && !validator(key, value)) {
      logger.error(`Validation failed for ${namespace}.${key}`);
      return false;
    }

    // Track access
    this.trackAccess(namespace, key, 'set');

    const state = this._namespaces.get(namespace);
    const oldValue = this.getNestedValue(state, key);
    
    // Set the new value
    this.setNestedValue(state, key, value);
    
    // Emit change event
    this.emit('change', {
      namespace,
      key,
      oldValue,
      newValue: value
    });

    return true;
  }

  /**
   * Delete a key from namespace
   */
  delete(namespace, key) {
    if (!this._namespaces.has(namespace)) {
      return false;
    }

    if (this._readonly.has(namespace)) {
      logger.error(`Cannot modify readonly namespace: ${namespace}`);
      return false;
    }

    const state = this._namespaces.get(namespace);
    const deleted = this.deleteNestedValue(state, key);
    
    if (deleted) {
      this.emit('delete', { namespace, key });
    }

    return deleted;
  }

  /**
   * Check if namespace exists
   */
  hasNamespace(namespace) {
    return this._namespaces.has(namespace);
  }

  /**
   * Check if key exists in namespace
   */
  has(namespace, key) {
    if (!this._namespaces.has(namespace)) {
      return false;
    }

    const state = this._namespaces.get(namespace);
    return this.getNestedValue(state, key) !== undefined;
  }

  /**
   * Clear all data in a namespace
   */
  clear(namespace) {
    if (!this._namespaces.has(namespace)) {
      return false;
    }

    if (this._readonly.has(namespace)) {
      logger.error(`Cannot clear readonly namespace: ${namespace}`);
      return false;
    }

    this._namespaces.set(namespace, {});
    this.emit('clear', { namespace });
    return true;
  }

  /**
   * Get all registered namespaces
   */
  getNamespaces() {
    return Array.from(this._namespaces.keys());
  }

  /**
   * Get access statistics
   */
  getAccessStats() {
    const stats = {};
    
    for (const [key, count] of this._accessed.entries()) {
      const [namespace, keyName, operation] = key.split(':');
      
      if (!stats[namespace]) {
        stats[namespace] = { gets: 0, sets: 0, keys: new Set() };
      }
      
      if (operation === 'get') {
        stats[namespace].gets += count;
      } else if (operation === 'set') {
        stats[namespace].sets += count;
      }
      
      if (keyName) {
        stats[namespace].keys.add(keyName);
      }
    }

    // Convert Sets to arrays for JSON serialization
    for (const namespace of Object.keys(stats)) {
      stats[namespace].keys = Array.from(stats[namespace].keys);
    }

    return stats;
  }

  /**
   * Track access for debugging
   */
  trackAccess(namespace, key, operation) {
    const accessKey = `${namespace}:${key || 'ROOT'}:${operation}`;
    const current = this._accessed.get(accessKey) || 0;
    this._accessed.set(accessKey, current + 1);
  }

  /**
   * Get nested value using dot notation
   */
  getNestedValue(obj, path) {
    if (!path) return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Set nested value using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Delete nested value
   */
  deleteNestedValue(obj, path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        return false;
      }
      current = current[key];
    }
    
    if (lastKey in current) {
      delete current[lastKey];
      return true;
    }
    
    return false;
  }

  /**
   * Deep clone an object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Set) return new Set([...obj].map(item => this.deepClone(item)));
    if (obj instanceof Map) {
      const cloned = new Map();
      obj.forEach((value, key) => {
        cloned.set(key, this.deepClone(value));
      });
      return cloned;
    }
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * Setup protection against direct global access
   */
  setupGlobalProtection() {
    // Warn when globals are accessed directly
    const protectedGlobals = [
      'specialistPool', 
      'apiCache', 
      'configCache',
      'activeSpecialists',
      'poolManager',
      'connectionPool',
      'logBuffer'
    ];

    protectedGlobals.forEach(globalName => {
      if (!(globalName in global)) {
        Object.defineProperty(global, globalName, {
          get() {
            logger.warn(`Direct global.${globalName} access detected! Use stateManager.get() instead`);
            return undefined;
          },
          set(value) {
            logger.error(`Direct global.${globalName} mutation attempted! Use stateManager.set() instead`);
          },
          configurable: true
        });
      }
    });
  }

  /**
   * Clean up all state
   */
  cleanup() {
    logger.info('Cleaning up global state manager');
    
    // Clear all namespaces
    for (const namespace of this._namespaces.keys()) {
      if (!this._readonly.has(namespace)) {
        this.clear(namespace);
      }
    }
    
    // Clear tracking
    this._accessed.clear();
    
    // Remove all listeners
    this.removeAllListeners();
  }

  /**
   * Export state for debugging
   */
  exportState() {
    const exported = {};
    
    for (const [namespace, state] of this._namespaces.entries()) {
      exported[namespace] = {
        state: this.deepClone(state),
        readonly: this._readonly.has(namespace),
        hasValidator: this._validators.has(namespace)
      };
    }
    
    return exported;
  }
}

// Singleton instance
let instance = null;

function getStateManager() {
  if (!instance) {
    instance = new GlobalStateManager();
    
    // Register cleanup on exit
    process.on('exit', () => instance.cleanup());
    process.on('SIGINT', () => {
      instance.cleanup();
      process.exit(0);
    });
  }
  
  return instance;
}

module.exports = {
  GlobalStateManager,
  getStateManager,
  stateManager: getStateManager()
};