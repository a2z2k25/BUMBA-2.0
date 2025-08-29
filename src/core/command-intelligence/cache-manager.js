/**
 * BUMBA Cache Manager
 * Optimizes performance through intelligent caching
 */

const { logger } = require('../logging/bumba-logger');
const crypto = require('crypto');

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
    
    // Configuration
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB max cache size
      maxItems: 1000,
      ttl: 300000, // 5 minutes default TTL
      checkInterval: 60000 // Clean every minute
    };
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Generate cache key
   */
  generateKey(command, args, context = {}) {
    const keyData = {
      command,
      args,
      mode: context.mode || 'default',
      department: context.department
    };
    
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    return `cmd_${command}_${hash.substring(0, 8)}`;
  }

  /**
   * Get from cache
   */
  get(key) {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.cacheStats.misses++;
      return null;
    }
    
    // Update access time and hit count
    entry.lastAccess = Date.now();
    entry.hits++;
    this.cacheStats.hits++;
    
    logger.debug(`💾 Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set cache entry
   */
  set(key, data, ttl = null) {
    // Check if we need to evict items
    if (this.memoryCache.size >= this.config.maxItems) {
      this.evictLRU();
    }
    
    const size = this.estimateSize(data);
    
    // Check size constraints
    if (this.cacheStats.totalSize + size > this.config.maxSize) {
      this.evictUntilSpace(size);
    }
    
    const entry = {
      data,
      size,
      created: Date.now(),
      lastAccess: Date.now(),
      ttl: ttl || this.config.ttl,
      hits: 0
    };
    
    this.memoryCache.set(key, entry);
    this.cacheStats.totalSize += size;
    
    logger.debug(`💾 Cached key: ${key} (${this.formatSize(size)})`);
  }

  /**
   * Cache command result
   */
  cacheCommandResult(command, args, context, result) {
    // Don't cache errors or failed results
    if (!result || !result.success) {
      return;
    }
    
    // Don't cache large files
    if (result.file && this.estimateSize(result) > 10 * 1024 * 1024) {
      return;
    }
    
    const key = this.generateKey(command, args, context);
    
    // Cache with different TTLs based on command type
    const ttl = this.determineTTL(command, context);
    
    this.set(key, result, ttl);
  }

  /**
   * Get cached command result
   */
  getCachedCommandResult(command, args, context) {
    const key = this.generateKey(command, args, context);
    return this.get(key);
  }

  /**
   * Determine TTL based on command type
   */
  determineTTL(command, context) {
    // Longer TTL for analysis and documentation
    if (['analyze', 'prd', 'requirements', 'roadmap'].includes(command)) {
      return 1800000; // 30 minutes
    }
    
    // Shorter TTL for dynamic commands
    if (['status', 'metrics', 'health'].includes(command)) {
      return 30000; // 30 seconds
    }
    
    // Lite mode gets longer TTL
    if (context.mode === 'lite') {
      return 600000; // 10 minutes
    }
    
    return this.config.ttl; // Default 5 minutes
  }

  /**
   * Check if entry is expired
   */
  isExpired(entry) {
    return Date.now() - entry.created > entry.ttl;
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.evict(lruKey);
    }
  }

  /**
   * Evict items until enough space
   */
  evictUntilSpace(requiredSize) {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    for (const [key] of entries) {
      if (this.cacheStats.totalSize + requiredSize <= this.config.maxSize) {
        break;
      }
      this.evict(key);
    }
  }

  /**
   * Evict single item
   */
  evict(key) {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.memoryCache.delete(key);
      this.cacheStats.totalSize -= entry.size;
      this.cacheStats.evictions++;
      logger.debug(`🗑️ Evicted cache key: ${key}`);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    this.cacheStats.totalSize = 0;
    logger.info('🧹 Cache cleared');
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    let cleaned = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.evict(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, this.config.checkInterval);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Estimate size of data
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1024; // Default 1KB for non-serializable
    }
  }

  /**
   * Format size for display
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      items: this.memoryCache.size,
      size: this.formatSize(this.cacheStats.totalSize),
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: `${hitRate}%`,
      evictions: this.cacheStats.evictions,
      maxSize: this.formatSize(this.config.maxSize),
      maxItems: this.config.maxItems
    };
  }

  /**
   * Warm cache with common commands
   */
  async warmCache(commands = []) {
    logger.info('🔥 Warming cache...');
    
    const warmupCommands = commands.length > 0 ? commands : [
      { command: 'help', args: [] },
      { command: 'status', args: [] },
      { command: 'list', args: [] }
    ];
    
    for (const { command, args } of warmupCommands) {
      const key = this.generateKey(command, args);
      if (!this.memoryCache.has(key)) {
        // Would normally execute command here
        logger.debug(`📦 Pre-cached: ${command}`);
      }
    }
  }

  /**
   * Export cache for persistence
   */
  exportCache() {
    const data = {};
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isExpired(entry)) {
        data[key] = {
          data: entry.data,
          created: entry.created,
          ttl: entry.ttl
        };
      }
    }
    
    return data;
  }

  /**
   * Import cache from persistence
   */
  importCache(data) {
    for (const [key, entry] of Object.entries(data)) {
      if (!this.isExpired(entry)) {
        this.set(key, entry.data, entry.ttl);
      }
    }
    
    logger.info(`📥 Imported ${Object.keys(data).length} cache entries`);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CacheManager,
  getInstance: () => {
    if (!instance) {
      instance = new CacheManager();
    }
    return instance;
  }
};