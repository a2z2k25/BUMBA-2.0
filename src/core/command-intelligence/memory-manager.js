/**
 * BUMBA Memory Manager
 * Advanced memory management and garbage collection
 */

const { logger } = require('../logging/bumba-logger');
const v8 = require('v8');

class MemoryManager {
  constructor() {
    this.memoryThresholds = {
      warning: 0.7,  // 70% memory usage
      critical: 0.85, // 85% memory usage
      emergency: 0.95 // 95% memory usage
    };
    
    this.memoryPools = new Map();
    this.objectPools = new Map();
    this.weakRefs = new Map();
    
    this.stats = {
      allocations: 0,
      deallocations: 0,
      gcRuns: 0,
      poolHits: 0,
      poolMisses: 0,
      peakUsage: 0
    };
    
    this.gcInterval = null;
    this.monitorInterval = null;
    
    this.initializeMonitoring();
  }

  /**
   * Initialize memory monitoring
   */
  initializeMonitoring() {
    // Monitor memory usage
    this.monitorInterval = setInterval(() => {
      this.checkMemoryStatus();
    }, 5000); // Check every 5 seconds
    
    // Periodic garbage collection
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection();
    }, 60000); // GC every minute
    
    logger.info('💾 Memory management initialized');
  }

  /**
   * Check current memory status
   */
  checkMemoryStatus() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    const heapUsedPercent = memUsage.heapUsed / heapStats.heap_size_limit;
    
    // Update peak usage
    this.stats.peakUsage = Math.max(this.stats.peakUsage, memUsage.heapUsed);
    
    // Check thresholds
    if (heapUsedPercent > this.memoryThresholds.emergency) {
      this.handleEmergencyMemory();
    } else if (heapUsedPercent > this.memoryThresholds.critical) {
      this.handleCriticalMemory();
    } else if (heapUsedPercent > this.memoryThresholds.warning) {
      this.handleWarningMemory();
    }
    
    return {
      used: memUsage.heapUsed,
      total: heapStats.heap_size_limit,
      percent: heapUsedPercent,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    };
  }

  /**
   * Handle warning memory level
   */
  handleWarningMemory() {
    logger.warn('⚠️ Memory usage warning - initiating cleanup');
    
    // Clear unused pools
    this.cleanupPools();
    
    // Clear weak references
    this.cleanupWeakRefs();
    
    // Suggest garbage collection
    if (global.gc) {
      global.gc(false); // Minor GC
    }
  }

  /**
   * Handle critical memory level
   */
  handleCriticalMemory() {
    logger.error('🚨 Critical memory usage - aggressive cleanup');
    
    // Clear all pools
    this.clearAllPools();
    
    // Clear caches
    const cacheManager = require('./cache-manager').getInstance();
    cacheManager.reduceCacheSize(0.5);
    
    // Force garbage collection
    if (global.gc) {
      global.gc(true); // Major GC
      this.stats.gcRuns++;
    }
  }

  /**
   * Handle emergency memory level
   */
  handleEmergencyMemory() {
    logger.error('🔴 Emergency memory state - clearing everything');
    
    // Clear all managed memory
    this.emergencyClear();
    
    // Clear all caches
    const cacheManager = require('./cache-manager').getInstance();
    cacheManager.clear();
    
    // Force multiple GC runs
    if (global.gc) {
      global.gc(true);
      setTimeout(() => global.gc(true), 100);
      setTimeout(() => global.gc(true), 500);
      this.stats.gcRuns += 3;
    }
    
    // Notify system
    process.emit('memoryEmergency');
  }

  /**
   * Create memory pool
   */
  createPool(name, config = {}) {
    const pool = {
      name,
      maxSize: config.maxSize || 1024 * 1024, // 1MB default
      currentSize: 0,
      objects: [],
      factory: config.factory || (() => ({})),
      reset: config.reset || (() => {}),
      active: 0,
      available: []
    };
    
    this.memoryPools.set(name, pool);
    
    // Pre-allocate if specified
    if (config.preAllocate) {
      for (let i = 0; i < config.preAllocate; i++) {
        pool.available.push(pool.factory());
      }
    }
    
    return pool;
  }

  /**
   * Get object from pool
   */
  getFromPool(poolName) {
    const pool = this.memoryPools.get(poolName);
    
    if (!pool) {
      this.stats.poolMisses++;
      return null;
    }
    
    let obj;
    
    if (pool.available.length > 0) {
      obj = pool.available.pop();
      pool.reset(obj);
      this.stats.poolHits++;
    } else {
      obj = pool.factory();
      this.stats.poolMisses++;
    }
    
    pool.active++;
    this.stats.allocations++;
    
    return obj;
  }

  /**
   * Return object to pool
   */
  returnToPool(poolName, obj) {
    const pool = this.memoryPools.get(poolName);
    
    if (!pool) return;
    
    pool.reset(obj);
    pool.available.push(obj);
    pool.active--;
    this.stats.deallocations++;
  }

  /**
   * Create object pool for reusable objects
   */
  createObjectPool(className, factory, reset) {
    const pool = {
      className,
      factory,
      reset: reset || (obj => {
        // Default reset - clear all properties
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            delete obj[key];
          }
        }
      }),
      instances: [],
      available: [],
      inUse: new Set()
    };
    
    this.objectPools.set(className, pool);
    return pool;
  }

  /**
   * Allocate from object pool
   */
  allocate(className, ...args) {
    const pool = this.objectPools.get(className);
    
    if (!pool) {
      throw new Error(`Object pool not found: ${className}`);
    }
    
    let instance;
    
    if (pool.available.length > 0) {
      instance = pool.available.pop();
      pool.reset(instance);
      if (pool.factory.apply) {
        pool.factory.apply(instance, args);
      }
    } else {
      instance = pool.factory(...args);
      pool.instances.push(instance);
    }
    
    pool.inUse.add(instance);
    this.stats.allocations++;
    
    return instance;
  }

  /**
   * Deallocate to object pool
   */
  deallocate(className, instance) {
    const pool = this.objectPools.get(className);
    
    if (!pool || !pool.inUse.has(instance)) {
      return false;
    }
    
    pool.inUse.delete(instance);
    pool.reset(instance);
    pool.available.push(instance);
    this.stats.deallocations++;
    
    return true;
  }

  /**
   * Create weak reference
   */
  createWeakRef(key, object) {
    if (typeof WeakRef !== 'undefined') {
      this.weakRefs.set(key, new WeakRef(object));
    } else {
      // Fallback for older Node versions
      this.weakRefs.set(key, { deref: () => object });
    }
  }

  /**
   * Get weak reference
   */
  getWeakRef(key) {
    const ref = this.weakRefs.get(key);
    if (ref) {
      const obj = ref.deref();
      if (obj) {
        return obj;
      } else {
        // Object was garbage collected
        this.weakRefs.delete(key);
      }
    }
    return null;
  }

  /**
   * Cleanup weak references
   */
  cleanupWeakRefs() {
    let cleaned = 0;
    
    for (const [key, ref] of this.weakRefs.entries()) {
      if (!ref.deref()) {
        this.weakRefs.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`🧹 Cleaned ${cleaned} weak references`);
    }
  }

  /**
   * Cleanup unused pools
   */
  cleanupPools() {
    for (const [name, pool] of this.memoryPools.entries()) {
      if (pool.active === 0 && pool.available.length > 10) {
        // Keep only 10 pre-allocated objects
        pool.available = pool.available.slice(0, 10);
      }
    }
  }

  /**
   * Clear all pools
   */
  clearAllPools() {
    for (const pool of this.memoryPools.values()) {
      pool.available = [];
      pool.currentSize = 0;
    }
    
    for (const pool of this.objectPools.values()) {
      pool.available = [];
      pool.instances = Array.from(pool.inUse);
    }
    
    logger.info('🧹 Cleared all memory pools');
  }

  /**
   * Emergency memory clear
   */
  emergencyClear() {
    // Clear all pools
    this.memoryPools.clear();
    this.objectPools.clear();
    this.weakRefs.clear();
    
    // Reset stats
    this.stats.allocations = 0;
    this.stats.deallocations = 0;
    
    logger.error('🔴 Emergency memory clear completed');
  }

  /**
   * Perform garbage collection
   */
  performGarbageCollection() {
    const before = process.memoryUsage().heapUsed;
    
    // Clean up pools
    this.cleanupPools();
    
    // Clean up weak refs
    this.cleanupWeakRefs();
    
    // Run GC if available
    if (global.gc) {
      global.gc(false);
      this.stats.gcRuns++;
    }
    
    const after = process.memoryUsage().heapUsed;
    const freed = before - after;
    
    if (freed > 0) {
      logger.debug(`♻️ GC freed ${this.formatMemory(freed)}`);
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    return {
      current: {
        heap: this.formatMemory(memUsage.heapUsed),
        total: this.formatMemory(heapStats.heap_size_limit),
        external: this.formatMemory(memUsage.external),
        percent: `${((memUsage.heapUsed / heapStats.heap_size_limit) * 100).toFixed(1)}%`
      },
      peak: this.formatMemory(this.stats.peakUsage),
      pools: {
        memory: this.memoryPools.size,
        object: this.objectPools.size,
        weakRefs: this.weakRefs.size
      },
      operations: {
        allocations: this.stats.allocations,
        deallocations: this.stats.deallocations,
        gcRuns: this.stats.gcRuns,
        poolHits: this.stats.poolHits,
        poolMisses: this.stats.poolMisses,
        poolHitRate: this.stats.poolHits + this.stats.poolMisses > 0
          ? `${((this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses)) * 100).toFixed(1)}%`
          : '0%'
      }
    };
  }

  /**
   * Get heap snapshot
   */
  getHeapSnapshot() {
    const snapshot = v8.writeHeapSnapshot();
    logger.info(`📸 Heap snapshot saved: ${snapshot}`);
    return snapshot;
  }

  /**
   * Format memory size
   */
  formatMemory(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }

  /**
   * Stop memory management
   */
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    
    logger.info('💾 Memory management stopped');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  MemoryManager,
  getInstance: () => {
    if (!instance) {
      instance = new MemoryManager();
    }
    return instance;
  }
};