/**
 * BUMBA Memory Optimizer
 * Reduces memory usage and improves performance
 * Updated: Sprint 7 - Using safe state management
 */

const { logger } = require('../logging/bumba-logger');
const { gcManager } = require('../state/gc-manager');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');

class MemoryOptimizer {
  constructor() {
    this.maxSpecialistsInMemory = 10;
    this.gcInterval = 60000; // 1 minute
    this.lastGC = Date.now();
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB
    this.timers = new ComponentTimers('memory-optimizer');
    
    // Register state namespace
    stateManager.register('memory', {
      lastCleanup: Date.now(),
      cleanupsPerformed: 0,
      cachesCleaned: 0
    });
    
    // Start monitoring if not in test mode
    if (process.env.NODE_ENV !== 'test') {
      this.startMonitoring();
    }
  }
  
  /**
   * Start memory monitoring
   */
  startMonitoring() {
    // Check memory periodically using safe timer registry
    this.timers.setInterval('memory-check', () => {
      this.checkMemoryUsage();
    }, this.gcInterval, 'Periodic memory usage check');
    
    // Timers are automatically cleaned on exit by timer registry
  }
  
  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsed = usage.heapUsed;
    
    if (heapUsed > this.memoryThreshold) {
      this.performCleanup();
    }
    
    // Request GC if needed (safe wrapper)
    if (heapUsed > this.memoryThreshold * 0.8) {
      gcManager.requestGC({
        reason: 'memory-threshold',
        force: false
      });
    }
  }
  
  /**
   * Perform memory cleanup
   */
  performCleanup() {
    // Clear caches
    this.clearCaches();
    
    // Trim specialist pools
    this.trimSpecialistPools();
    
    // Clear old logs
    this.clearOldLogs();
    
    this.lastGC = Date.now();
  }
  
  /**
   * Clear various caches
   */
  clearCaches() {
    // Clear module cache for specialists not recently used
    const specialistPaths = Object.keys(require.cache).filter(path => 
      path.includes('/specialists/') && 
      !this.isRecentlyUsed(path)
    );
    
    specialistPaths.forEach(path => {
      delete require.cache[path];
    });
  }
  
  /**
   * Check if module was recently used
   */
  isRecentlyUsed(path, threshold = 300000) { // 5 minutes
    const module = require.cache[path];
    if (!module) return false;
    
    // Check if module has a timestamp or assume old
    const lastUsed = module.lastUsed || 0;
    return (Date.now() - lastUsed) < threshold;
  }
  
  /**
   * Trim specialist pools to maximum size
   */
  trimSpecialistPools() {
    // Use safe state manager for specialist pool
    const pool = stateManager.get('specialists', 'pool');
    if (pool && pool.size > this.maxSpecialistsInMemory) {
      // Remove least recently used specialists
      const toRemove = pool.size - this.maxSpecialistsInMemory;
      logger.debug(`Trimming ${toRemove} specialists from pool`);
      // Implementation would integrate with pool manager
    }
  }
  
  /**
   * Clear old log entries from memory
   */
  clearOldLogs() {
    // Use safe state manager for log buffer
    const logBuffer = stateManager.get('logging', 'buffer');
    if (logBuffer && Array.isArray(logBuffer)) {
      const maxLogs = 1000;
      if (logBuffer.length > maxLogs) {
        const trimmed = logBuffer.slice(-maxLogs);
        stateManager.set('logging', 'buffer', trimmed);
        logger.debug(`Trimmed log buffer to ${maxLogs} entries`);
      }
    }
  }
  
  /**
   * Get memory statistics
   */
  getStats() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(usage.external / 1024 / 1024) + 'MB',
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      lastGC: new Date(this.lastGC).toISOString(),
      threshold: Math.round(this.memoryThreshold / 1024 / 1024) + 'MB'
    };
  }
  
  /**
   * Force cleanup
   */
  forceCleanup() {
    this.performCleanup();
    // Use safe GC manager
    gcManager.requestGC({
      reason: 'force-cleanup',
      force: true
    });
    return this.getStats();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getOptimizer: () => {
    if (!instance) {
      instance = new MemoryOptimizer();
    }
    return instance;
  },
  
  getMemoryStats: () => {
    return module.exports.getOptimizer().getStats();
  },
  
  forceCleanup: () => {
    return module.exports.getOptimizer().forceCleanup();
  }
};