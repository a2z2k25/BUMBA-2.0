/**
 * Optimized Specialist Pool
 * Efficient resource management with automatic cleanup
 */

const { logger } = require('../logging/bumba-logger');

class OptimizedSpecialistPool {
  constructor(config = {}) {
    this.maxSize = config.maxSize || 10;
    this.ttl = config.ttl || 300000; // 5 minutes
    this.pool = new Map();
    this.lastAccess = new Map();
    this.creationCount = 0;
    this.reuseCount = 0;
    
    // Start cleanup interval
    this.startCleanup();
  }
  
  /**
   * Get or create a specialist
   */
  async acquire(type, createFn) {
    // Check pool first
    if (this.pool.has(type)) {
      const specialist = this.pool.get(type);
      this.lastAccess.set(type, Date.now());
      this.reuseCount++;
      return specialist;
    }
    
    // Check size limit
    if (this.pool.size >= this.maxSize) {
      this.evictOldest();
    }
    
    // Create new specialist
    try {
      const specialist = await createFn();
      this.pool.set(type, specialist);
      this.lastAccess.set(type, Date.now());
      this.creationCount++;
      return specialist;
    } catch (error) {
      if (process.env.LOG_LEVEL === 'DEBUG') {
        logger.error(`Failed to create specialist ${type}:`, error);
      }
      return null;
    }
  }
  
  /**
   * Release a specialist back to pool
   */
  release(type) {
    // Mark as available
    if (this.pool.has(type)) {
      this.lastAccess.set(type, Date.now());
    }
  }
  
  /**
   * Evict the oldest specialist
   */
  evictOldest() {
    let oldestTime = Date.now();
    let oldestType = null;
    
    for (const [type, time] of this.lastAccess) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestType = type;
      }
    }
    
    if (oldestType) {
      this.pool.delete(oldestType);
      this.lastAccess.delete(oldestType);
      if (process.env.LOG_LEVEL === 'DEBUG') {
        logger.debug(`Evicted specialist: ${oldestType}`);
      }
    }
  }
  
  /**
   * Start periodic cleanup
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
    
    // Clean up on exit
    process.on('exit', () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
    });
  }
  
  /**
   * Remove expired specialists
   */
  cleanup() {
    const now = Date.now();
    const expired = [];
    
    for (const [type, time] of this.lastAccess) {
      if (now - time > this.ttl) {
        expired.push(type);
      }
    }
    
    expired.forEach(type => {
      this.pool.delete(type);
      this.lastAccess.delete(type);
    });
    
    if (expired.length > 0 && process.env.LOG_LEVEL === 'DEBUG') {
      logger.debug(`Cleaned up ${expired.length} expired specialists`);
    }
  }
  
  /**
   * Clear the entire pool
   */
  clear() {
    this.pool.clear();
    this.lastAccess.clear();
    this.creationCount = 0;
    this.reuseCount = 0;
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    const reuseRate = this.creationCount + this.reuseCount > 0
      ? (this.reuseCount / (this.creationCount + this.reuseCount) * 100).toFixed(2)
      : 0;
    
    return {
      size: this.pool.size,
      maxSize: this.maxSize,
      created: this.creationCount,
      reused: this.reuseCount,
      reuseRate: `${reuseRate}%`,
      ttl: `${this.ttl / 1000}s`
    };
  }
  
  /**
   * Shutdown the pool
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global pool instance
let globalPool = null;

module.exports = {
  getPool: (config) => {
    if (!globalPool) {
      globalPool = new OptimizedSpecialistPool(config);
    }
    return globalPool;
  },
  
  acquireSpecialist: async (type, createFn) => {
    return module.exports.getPool().acquire(type, createFn);
  },
  
  releaseSpecialist: (type) => {
    module.exports.getPool().release(type);
  },
  
  getPoolStats: () => {
    return module.exports.getPool().getStats();
  },
  
  clearPool: () => {
    module.exports.getPool().clear();
  }
};