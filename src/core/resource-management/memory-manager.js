/**
 * BUMBA Memory Manager
 * Prevents memory leaks, manages caches, and ensures efficient resource usage
 */

const os = require('os');
const { logger } = require('../logging/bumba-logger');

const v8 = require('v8');
const { EventEmitter } = require('events');

class MemoryManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration - standardized with optimization systems
    this.config = {
      maxMemoryMB: options.maxMemoryMB || 1024,  // Increased to 1GB
      maxCacheSize: options.maxCacheSize || 5000,  // Increased cache size
      maxArraySize: options.maxArraySize || 50000,  // Increased array size
      gcInterval: options.gcInterval || 60000, // 1 minute
      monitorInterval: options.monitorInterval || 30000, // 30 seconds
      warningThreshold: options.warningThreshold || 0.8, // 80% memory usage
      criticalThreshold: options.criticalThreshold || 0.9, // 90% memory usage
      enableOptimization: options.enableOptimization !== false,
      enableMonitoring: options.enableMonitoring !== false,
      enableGarbageCollection: options.enableGarbageCollection !== false,
      ...options
    };
    
    // Resource tracking
    this.resources = new Map();
    this.caches = new Map();
    this.intervals = new Set();
    this.timers = new Set();
    this.eventListeners = new WeakMap();
    
    // Memory statistics
    this.stats = {
      gcRuns: 0,
      cacheEvictions: 0,
      resourcesFreed: 0,
      warnings: 0,
      criticals: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    // Memory monitor
    this.monitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.monitorInterval);
    
    // Garbage collection interval
    if (global.gc) {
      this.gcInterval = setInterval(() => {
        this.runGarbageCollection();
      }, this.config.gcInterval);
    }
    
    // Track these intervals
    this.intervals.add(this.monitorInterval);
    if (this.gcInterval) {
      this.intervals.add(this.gcInterval);
    }
  }

  /**
   * Register a resource for tracking
   */
  registerResource(id, resource, options = {}) {
    const resourceInfo = {
      id,
      resource,
      type: options.type || 'generic',
      created: Date.now(),
      lastAccessed: Date.now(),
      size: this.estimateSize(resource),
      cleanup: options.cleanup || null,
      ttl: options.ttl || null
    };
    
    this.resources.set(id, resourceInfo);
    
    // Set up TTL if specified
    if (options.ttl) {
      const timer = setTimeout(() => {
        this.freeResource(id);
      }, options.ttl);
      
      this.timers.add(timer);
      resourceInfo.timer = timer;
    }
    
    return id;
  }

  /**
   * Register a cache with size limits
   */
  registerCache(name, cache, options = {}) {
    const cacheInfo = {
      name,
      cache,
      maxSize: options.maxSize || this.config.maxCacheSize,
      evictionPolicy: options.evictionPolicy || 'lru', // lru, fifo, random
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    this.caches.set(name, cacheInfo);
    
    // Wrap cache methods to track usage
    this.wrapCacheMethods(cacheInfo);
    
    return name;
  }

  /**
   * Wrap cache methods for monitoring
   */
  wrapCacheMethods(cacheInfo) {
    const { cache } = cacheInfo;
    
    // Wrap set method
    const originalSet = cache.set;
    if (originalSet) {
      cache.set = (key, value) => {
        // Check size limit
        if (cache.size >= cacheInfo.maxSize) {
          this.evictFromCache(cacheInfo);
        }
        
        return originalSet.call(cache, key, value);
      };
    }
    
    // Wrap get method
    const originalGet = cache.get;
    if (originalGet) {
      cache.get = (key) => {
        const result = originalGet.call(cache, key);
        
        if (result !== undefined) {
          cacheInfo.hits++;
        } else {
          cacheInfo.misses++;
        }
        
        return result;
      };
    }
  }

  /**
   * Evict items from cache based on policy
   */
  evictFromCache(cacheInfo) {
    const { cache, evictionPolicy } = cacheInfo;
    
    switch (evictionPolicy) {
      case 'lru':
        // Least Recently Used (requires access tracking)
        const lru = this.findLRUItem(cache);
        if (lru) {cache.delete(lru);}
        break;
        
      case 'fifo':
        // First In First Out
        const firstKey = cache.keys().next().value;
        if (firstKey) {cache.delete(firstKey);}
        break;
        
      case 'random':
        // Random eviction
        const keys = Array.from(cache.keys());
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (randomKey) {cache.delete(randomKey);}
        break;
    }
    
    cacheInfo.evictions++;
    this.stats.cacheEvictions++;
  }

  /**
   * Find least recently used item (simplified)
   */
  findLRUItem(cache) {
    // In a real implementation, this would track access times
    // For now, just return the first key
    return cache.keys().next().value;
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    const usage = this.getMemoryUsage();
    const usageRatio = usage.heapUsed / usage.heapTotal;
    
    this.emit('memory-check', {
      usage,
      ratio: usageRatio,
      timestamp: Date.now()
    });
    
    // Check thresholds
    if (usageRatio > this.config.criticalThreshold) {
      this.stats.criticals++;
      this.handleCriticalMemory(usage);
    } else if (usageRatio > this.config.warningThreshold) {
      this.stats.warnings++;
      this.handleMemoryWarning(usage);
    }
  }

  /**
   * Get detailed memory usage
   */
  getMemoryUsage() {
    const nodeUsage = process.memoryUsage();
    const v8Usage = v8.getHeapStatistics();
    const systemUsage = os.freemem() / os.totalmem();
    
    return {
      // Node.js memory
      rss: nodeUsage.rss,
      heapTotal: nodeUsage.heapTotal,
      heapUsed: nodeUsage.heapUsed,
      external: nodeUsage.external,
      arrayBuffers: nodeUsage.arrayBuffers,
      
      // V8 details
      totalHeapSize: v8Usage.total_heap_size,
      usedHeapSize: v8Usage.used_heap_size,
      heapSizeLimit: v8Usage.heap_size_limit,
      mallocedMemory: v8Usage.malloced_memory,
      
      // System
      systemFreeRatio: systemUsage,
      
      // Calculated
      heapUsedMB: Math.round(nodeUsage.heapUsed / 1024 / 1024),
      heapUsedPercent: Math.round((nodeUsage.heapUsed / nodeUsage.heapTotal) * 100)
    };
  }

  /**
   * Handle memory warning
   */
  handleMemoryWarning(usage) {
    this.emit('memory-warning', usage);
    
    // Clean up old resources
    this.cleanupOldResources();
    
    // Reduce cache sizes
    this.reduceCacheSizes(0.2); // Reduce by 20%
  }

  /**
   * Handle critical memory situation
   */
  handleCriticalMemory(usage) {
    this.emit('memory-critical', usage);
    
    // Aggressive cleanup
    this.cleanupOldResources(true);
    
    // Clear caches
    this.clearAllCaches();
    
    // Force garbage collection
    if (global.gc) {
      this.runGarbageCollection();
    }
    
    // Free large resources
    this.freeLargeResources();
  }

  /**
   * Clean up old resources
   */
  cleanupOldResources(aggressive = false) {
    const now = Date.now();
    const maxAge = aggressive ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5 or 30 minutes
    
    for (const [id, info] of this.resources) {
      if (now - info.lastAccessed > maxAge) {
        this.freeResource(id);
      }
    }
  }

  /**
   * Free a specific resource
   */
  freeResource(id) {
    const info = this.resources.get(id);
    if (!info) {return false;}
    
    // Run cleanup function if provided
    if (info.cleanup && typeof info.cleanup === 'function') {
      try {
        info.cleanup(info.resource);
      } catch (error) {
        // Log error but continue
        logger.error(`Cleanup error for resource ${id}:`, error);
      }
    }
    
    // Clear timer if exists
    if (info.timer) {
      clearTimeout(info.timer);
      this.timers.delete(info.timer);
    }
    
    // Remove from tracking
    this.resources.delete(id);
    this.stats.resourcesFreed++;
    
    return true;
  }

  /**
   * Free resources above a certain size
   */
  freeLargeResources(thresholdMB = 10) {
    const thresholdBytes = thresholdMB * 1024 * 1024;
    
    for (const [id, info] of this.resources) {
      if (info.size > thresholdBytes) {
        this.freeResource(id);
      }
    }
  }

  /**
   * Reduce cache sizes
   */
  reduceCacheSizes(factor = 0.2) {
    for (const [name, cacheInfo] of this.caches) {
      const { cache } = cacheInfo;
      const targetSize = Math.floor(cache.size * (1 - factor));
      
      while (cache.size > targetSize) {
        this.evictFromCache(cacheInfo);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    for (const [name, cacheInfo] of this.caches) {
      cacheInfo.cache.clear();
      this.emit('cache-cleared', name);
    }
  }

  /**
   * Run garbage collection
   */
  runGarbageCollection() {
    if (!global.gc) {return;}
    
    const before = this.getMemoryUsage();
    global.gc();
    const after = this.getMemoryUsage();
    
    this.stats.gcRuns++;
    
    this.emit('gc-complete', {
      before,
      after,
      freed: before.heapUsed - after.heapUsed
    });
  }

  /**
   * Estimate size of an object (simplified)
   */
  estimateSize(obj) {
    // This is a very rough estimate
    try {
      const str = JSON.stringify(obj);
      return str.length * 2; // Rough estimate for Unicode
    } catch (error) {
      return 1024; // Default 1KB for non-serializable objects
    }
  }

  /**
   * Track event listeners to prevent leaks
   */
  trackEventListener(emitter, event, listener) {
    if (!this.eventListeners.has(emitter)) {
      this.eventListeners.set(emitter, new Map());
    }
    
    const listeners = this.eventListeners.get(emitter);
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    
    listeners.get(event).add(listener);
  }

  /**
   * Clean up event listeners
   */
  cleanupEventListeners(emitter) {
    const listeners = this.eventListeners.get(emitter);
    if (!listeners) {return;}
    
    for (const [event, listenerSet] of listeners) {
      for (const listener of listenerSet) {
        emitter.removeListener(event, listener);
      }
    }
    
    this.eventListeners.delete(emitter);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentUsage: this.getMemoryUsage(),
      resourceCount: this.resources.size,
      cacheCount: this.caches.size,
      timerCount: this.timers.size
    };
  }

  /**
   * Check if memory usage is within limits
   */
  checkMemoryLimit() {
    const usage = this.getMemoryUsage();
    const currentMB = usage.heapUsedMB;
    const isWithinLimit = currentMB <= this.config.maxMemoryMB;
    
    return {
      withinLimit: isWithinLimit,
      currentMB,
      limitMB: this.config.maxMemoryMB,
      percentUsed: (currentMB / this.config.maxMemoryMB) * 100,
      headroom: this.config.maxMemoryMB - currentMB
    };
  }

  /**
   * Force garbage collection
   */
  forceGC() {
    if (!global.gc) {
      // Try to enable GC if not available
      try {
        require('expose-gc');
      } catch (e) {
        logger.warn('Garbage collection not available. Run with --expose-gc flag');
        return {
          success: false,
          message: 'GC not available - run with --expose-gc flag'
        };
      }
    }
    
    const before = this.getMemoryUsage();
    const startTime = Date.now();
    
    try {
      global.gc();
      const after = this.getMemoryUsage();
      const duration = Date.now() - startTime;
      
      this.stats.gcRuns++;
      
      const result = {
        success: true,
        duration,
        freedMB: Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024),
        before: before.heapUsedMB,
        after: after.heapUsedMB
      };
      
      this.emit('gc-forced', result);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set memory limit
   */
  setMemoryLimit(limitMB) {
    if (typeof limitMB !== 'number' || limitMB <= 0) {
      throw new Error(`Invalid memory limit: ${limitMB}`);
    }
    
    const oldLimit = this.config.maxMemoryMB;
    this.config.maxMemoryMB = limitMB;
    
    logger.info(`Memory limit changed from ${oldLimit}MB to ${limitMB}MB`);
    
    // Check if current usage exceeds new limit
    const status = this.checkMemoryLimit();
    if (!status.withinLimit) {
      logger.warn(`Current usage (${status.currentMB}MB) exceeds new limit (${limitMB}MB)`);
      // Trigger cleanup
      this.handleCriticalMemory(this.getMemoryUsage());
    }
    
    this.emit('limit-changed', {
      oldLimit,
      newLimit: limitMB,
      currentUsage: status.currentMB
    });
    
    return status;
  }

  /**
   * Monitor memory usage continuously
   */
  monitorMemory(callback, interval = 1000) {
    const monitorId = `monitor_${Date.now()}_${Math.random()}`;
    
    const monitor = setInterval(() => {
      const usage = this.getMemoryUsage();
      const status = this.checkMemoryLimit();
      
      const report = {
        id: monitorId,
        timestamp: Date.now(),
        usage,
        status,
        stats: this.stats
      };
      
      if (callback) {
        callback(report);
      }
      
      this.emit('memory-monitor', report);
    }, interval);
    
    this.intervals.add(monitor);
    
    return {
      id: monitorId,
      stop: () => {
        clearInterval(monitor);
        this.intervals.delete(monitor);
      }
    };
  }

  /**
   * Get heap snapshot for debugging
   */
  getHeapSnapshot() {
    try {
      const snapshot = v8.writeHeapSnapshot();
      
      return {
        success: true,
        path: snapshot,
        timestamp: Date.now(),
        memoryUsage: this.getMemoryUsage(),
        stats: this.stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        alternativeData: {
          heapStatistics: v8.getHeapStatistics(),
          heapSpaceStatistics: v8.getHeapSpaceStatistics(),
          memoryUsage: this.getMemoryUsage()
        }
      };
    }
  }

  /**
   * Clear cache (enhanced version of clearAllCaches)
   */
  clearCache(cacheName = null) {
    if (cacheName) {
      // Clear specific cache
      const cacheInfo = this.caches.get(cacheName);
      if (cacheInfo) {
        const sizeBefore = cacheInfo.cache.size;
        cacheInfo.cache.clear();
        
        this.emit('cache-cleared', {
          name: cacheName,
          itemsCleared: sizeBefore,
          timestamp: Date.now()
        });
        
        return {
          success: true,
          cleared: cacheName,
          itemsCleared: sizeBefore
        };
      } else {
        return {
          success: false,
          error: `Cache '${cacheName}' not found`
        };
      }
    } else {
      // Clear all caches
      let totalCleared = 0;
      const clearedCaches = [];
      
      for (const [name, cacheInfo] of this.caches) {
        const sizeBefore = cacheInfo.cache.size;
        cacheInfo.cache.clear();
        totalCleared += sizeBefore;
        clearedCaches.push(name);
      }
      
      this.emit('all-caches-cleared', {
        caches: clearedCaches,
        totalItemsCleared: totalCleared,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        clearedCaches,
        totalItemsCleared: totalCleared
      };
    }
  }

  /**
   * Shutdown and cleanup
   */
  shutdown() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // Free all resources
    for (const id of this.resources.keys()) {
      this.freeResource(id);
    }
    
    // Clear all caches
    this.clearAllCaches();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  MemoryManager,
  
  // Get singleton instance
  getInstance(options) {
    if (!instance) {
      instance = new MemoryManager(options);
    }
    return instance;
  },
  
  // Convenience methods
  registerResource: (id, resource, options) => {
    if (!instance) {
      instance = new MemoryManager();
    }
    return instance.registerResource(id, resource, options);
  },
  
  freeResource: (id) => {
    if (!instance) {
      instance = new MemoryManager();
    }
    return instance.freeResource(id);
  },
  
  getMemoryUsage: () => {
    if (!instance) {
      instance = new MemoryManager();
    }
    return instance.getMemoryUsage();
  }
};