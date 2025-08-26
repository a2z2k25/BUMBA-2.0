/**
 * BUMBA Cache System
 * High-performance caching with LRU eviction and TTL support
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * LRU Cache implementation with TTL and memory awareness
 */
class CacheSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      maxSize: options.maxSize || 1000,              // Maximum number of entries
      maxMemory: options.maxMemory || 50 * 1024 * 1024, // 50MB default
      ttl: options.ttl || 3600000,                   // 1 hour default TTL
      checkPeriod: options.checkPeriod || 60000,     // Check expired entries every minute
      enableStats: options.enableStats !== false,
      enableMemoryCheck: options.enableMemoryCheck !== false,
      ...options
    };
    
    // Cache storage
    this.cache = new Map();
    this.accessOrder = new Map(); // Track access order for LRU
    this.ttlMap = new Map();      // Track TTL for entries
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expired: 0,
      memoryUsed: 0
    };
    
    // Start TTL checker
    this.startTTLChecker();
    
    // Memory monitoring
    if (this.config.enableMemoryCheck) {
      this.startMemoryMonitor();
    }
  }

  /**
   * Get a value from cache
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      this.emit('miss', key);
      return undefined;
    }
    
    const entry = this.cache.get(key);
    
    // Check if expired
    if (this.isExpired(key)) {
      this.delete(key);
      this.stats.expired++;
      this.stats.misses++;
      this.emit('expired', key);
      return undefined;
    }
    
    // Update access order for LRU
    this.updateAccessOrder(key);
    
    this.stats.hits++;
    this.emit('hit', key);
    
    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key, value, ttl = null) {
    // Check memory limit before adding
    if (this.config.enableMemoryCheck && this.isMemoryExceeded()) {
      this.evictLRU();
    }
    
    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }
    
    const entry = {
      value,
      size: this.calculateSize(value),
      timestamp: Date.now()
    };
    
    // Set TTL
    const entryTTL = ttl || this.config.ttl;
    if (entryTTL > 0) {
      this.ttlMap.set(key, Date.now() + entryTTL);
    }
    
    // Update cache
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    
    // Update stats
    this.stats.sets++;
    this.stats.memoryUsed += entry.size;
    
    this.emit('set', key, value);
    
    return true;
  }

  /**
   * Delete a value from cache
   */
  delete(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const entry = this.cache.get(key);
    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.ttlMap.delete(key);
    
    // Update stats
    this.stats.deletes++;
    this.stats.memoryUsed -= entry.size;
    
    this.emit('delete', key);
    
    return true;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const size = this.cache.size;
    
    this.cache.clear();
    this.accessOrder.clear();
    this.ttlMap.clear();
    
    // Reset stats
    this.stats.memoryUsed = 0;
    this.stats.evictions += size;
    
    this.emit('clear');
    
    return size;
  }

  /**
   * Check if key exists
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Check if expired
    if (this.isExpired(key)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Set TTL for a key
   */
  setTTL(key, ttl) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    if (ttl > 0) {
      this.ttlMap.set(key, Date.now() + ttl);
    } else {
      this.ttlMap.delete(key); // No expiration
    }
    
    return true;
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   */
  values() {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      memoryUsedMB: (this.stats.memoryUsed / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expired: 0,
      memoryUsed: this.stats.memoryUsed // Keep memory count
    };
  }

  /**
   * Check if key is expired
   */
  isExpired(key) {
    if (!this.ttlMap.has(key)) {
      return false;
    }
    
    return Date.now() > this.ttlMap.get(key);
  }

  /**
   * Update access order for LRU
   */
  updateAccessOrder(key) {
    // Remove from current position
    this.accessOrder.delete(key);
    // Add to end (most recently used)
    this.accessOrder.set(key, Date.now());
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    if (this.cache.size === 0) {
      return null;
    }
    
    // Get least recently used key (first in accessOrder)
    const lruKey = this.accessOrder.keys().next().value;
    
    if (lruKey) {
      const entry = this.cache.get(lruKey);
      this.delete(lruKey);
      this.stats.evictions++;
      
      this.emit('evict', lruKey, entry?.value);
      
      return lruKey;
    }
    
    return null;
  }

  /**
   * Check if memory limit exceeded
   */
  isMemoryExceeded() {
    return this.stats.memoryUsed > this.config.maxMemory;
  }

  /**
   * Calculate approximate size of value
   */
  calculateSize(value) {
    if (value === null || value === undefined) {
      return 0;
    }
    
    if (typeof value === 'string') {
      return value.length * 2; // 2 bytes per character
    }
    
    if (typeof value === 'number') {
      return 8; // 8 bytes for number
    }
    
    if (typeof value === 'boolean') {
      return 4; // 4 bytes for boolean
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2;
      } catch (e) {
        return 1024; // Default 1KB for objects that can't be stringified
      }
    }
    
    return 256; // Default size
  }

  /**
   * Start TTL checker
   */
  startTTLChecker() {
    this.ttlInterval = setInterval(() => {
      this.checkExpiredEntries();
    }, this.config.checkPeriod);
  }

  /**
   * Check and remove expired entries
   */
  checkExpiredEntries() {
    let expiredCount = 0;
    
    for (const [key] of this.ttlMap) {
      if (this.isExpired(key)) {
        this.delete(key);
        expiredCount++;
        this.stats.expired++;
      }
    }
    
    if (expiredCount > 0) {
      this.emit('cleanup', expiredCount);
    }
  }

  /**
   * Start memory monitor
   */
  startMemoryMonitor() {
    this.memoryInterval = setInterval(() => {
      if (this.isMemoryExceeded()) {
        // Evict entries until under limit
        while (this.isMemoryExceeded() && this.cache.size > 0) {
          this.evictLRU();
        }
        
        this.emit('memory-pressure', this.stats.memoryUsed);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Preload cache with data
   */
  preload(data) {
    if (!Array.isArray(data)) {
      throw new Error('Preload data must be an array of [key, value] pairs');
    }
    
    for (const [key, value] of data) {
      this.set(key, value);
    }
    
    return data.length;
  }

  /**
   * Export cache data
   */
  export() {
    const data = [];
    
    for (const [key, entry] of this.cache) {
      if (!this.isExpired(key)) {
        data.push({
          key,
          value: entry.value,
          ttl: this.ttlMap.get(key),
          timestamp: entry.timestamp
        });
      }
    }
    
    return data;
  }

  /**
   * Import cache data
   */
  import(data) {
    if (!Array.isArray(data)) {
      throw new Error('Import data must be an array');
    }
    
    for (const item of data) {
      if (item.ttl && item.ttl > Date.now()) {
        const remainingTTL = item.ttl - Date.now();
        this.set(item.key, item.value, remainingTTL);
      } else if (!item.ttl) {
        this.set(item.key, item.value, 0); // No expiration
      }
    }
    
    return data.length;
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.ttlInterval) {
      clearInterval(this.ttlInterval);
      this.ttlInterval = null;
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    
    this.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CacheSystem,
  
  // Get singleton instance
  getInstance(options) {
    if (!instance) {
      instance = new CacheSystem(options);
    }
    return instance;
  },
  
  // Create new instance
  createCache(options) {
    return new CacheSystem(options);
  }
};