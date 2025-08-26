/**
 * Expertise Cache System
 * Intelligent caching with TTL, LRU eviction, and preloading
 */

const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

class ExpertiseCache extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxSize: config.maxSize || 50,
      ttl: config.ttl || 3600000, // 1 hour default
      enablePreloading: config.enablePreloading !== false,
      enableMetrics: config.enableMetrics !== false
    };
    
    // Main cache storage
    this.cache = new Map();
    this.accessOrder = []; // For LRU tracking
    this.expirationTimers = new Map();
    
    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      currentSize: 0,
      totalLoaded: 0
    };
    
    logger.info(`📦 Expertise cache initialized (max: ${this.config.maxSize}, TTL: ${this.config.ttl}ms)`);
  }
  
  /**
   * Get expertise from cache
   */
  get(specialistType) {
    const entry = this.cache.get(specialistType);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(specialistType);
      this.metrics.expirations++;
      this.metrics.misses++;
      return null;
    }
    
    // Update access order for LRU
    this.updateAccessOrder(specialistType);
    
    this.metrics.hits++;
    
    // Emit cache hit event
    this.emit('cache:hit', {
      specialistType,
      age: Date.now() - entry.timestamp
    });
    
    return entry.expertise;
  }
  
  /**
   * Set expertise in cache
   */
  set(specialistType, expertise) {
    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(specialistType)) {
      this.evictLRU();
    }
    
    // Clear existing expiration timer if updating
    if (this.expirationTimers.has(specialistType)) {
      clearTimeout(this.expirationTimers.get(specialistType));
    }
    
    // Create cache entry
    const entry = {
      expertise,
      timestamp: Date.now(),
      accessCount: 0
    };
    
    this.cache.set(specialistType, entry);
    this.updateAccessOrder(specialistType);
    
    // Set expiration timer
    if (this.config.ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(specialistType);
        this.metrics.expirations++;
        this.emit('cache:expired', { specialistType });
      }, this.config.ttl);
      
      this.expirationTimers.set(specialistType, timer);
    }
    
    this.metrics.currentSize = this.cache.size;
    this.metrics.totalLoaded++;
    
    // Emit cache set event
    this.emit('cache:set', { specialistType });
    
    logger.debug(`💾 Cached expertise for ${specialistType}`);
  }
  
  /**
   * Check if entry is expired
   */
  isExpired(entry) {
    if (this.config.ttl <= 0) return false;
    return Date.now() - entry.timestamp > this.config.ttl;
  }
  
  /**
   * Update access order for LRU
   */
  updateAccessOrder(specialistType) {
    // Remove from current position
    const index = this.accessOrder.indexOf(specialistType);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(specialistType);
    
    // Update access count
    const entry = this.cache.get(specialistType);
    if (entry) {
      entry.accessCount++;
    }
  }
  
  /**
   * Evict least recently used entry
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return;
    
    // Get least recently used
    const lru = this.accessOrder[0];
    
    logger.debug(`🗑️ Evicting LRU expertise: ${lru}`);
    
    this.delete(lru);
    this.metrics.evictions++;
    
    this.emit('cache:evicted', { specialistType: lru });
  }
  
  /**
   * Delete entry from cache
   */
  delete(specialistType) {
    // Clear expiration timer
    if (this.expirationTimers.has(specialistType)) {
      clearTimeout(this.expirationTimers.get(specialistType));
      this.expirationTimers.delete(specialistType);
    }
    
    // Remove from cache
    this.cache.delete(specialistType);
    
    // Remove from access order
    const index = this.accessOrder.indexOf(specialistType);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    this.metrics.currentSize = this.cache.size;
  }
  
  /**
   * Check if expertise is cached
   */
  has(specialistType) {
    const entry = this.cache.get(specialistType);
    if (!entry) return false;
    
    // Check expiration
    if (this.isExpired(entry)) {
      this.delete(specialistType);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear entire cache
   */
  clear() {
    // Clear all expiration timers
    this.expirationTimers.forEach(timer => clearTimeout(timer));
    this.expirationTimers.clear();
    
    // Clear cache and access order
    this.cache.clear();
    this.accessOrder = [];
    
    this.metrics.currentSize = 0;
    
    logger.info('🧹 Expertise cache cleared');
    this.emit('cache:cleared');
  }
  
  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }
  
  /**
   * Get all cached specialist types
   */
  keys() {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    
    return {
      ...this.metrics,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      utilizationRate: ((this.cache.size / this.config.maxSize) * 100).toFixed(2) + '%',
      avgAccessCount: this.getAverageAccessCount()
    };
  }
  
  /**
   * Get average access count
   */
  getAverageAccessCount() {
    if (this.cache.size === 0) return 0;
    
    let total = 0;
    this.cache.forEach(entry => {
      total += entry.accessCount;
    });
    
    return (total / this.cache.size).toFixed(2);
  }
  
  /**
   * Preload frequently used expertise
   */
  async preload(specialistTypes, loader) {
    if (!this.config.enablePreloading) return;
    
    logger.info(`📥 Preloading ${specialistTypes.length} expertise profiles`);
    
    const results = await Promise.allSettled(
      specialistTypes.map(async type => {
        if (!this.has(type)) {
          const expertise = await loader(type);
          if (expertise) {
            this.set(type, expertise);
          }
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.info(`✅ Preloaded ${successful}/${specialistTypes.length} expertise profiles`);
    
    return successful;
  }
  
  /**
   * Warm cache with most likely needed expertise
   */
  async warmCache(predictions, loader) {
    // Sort predictions by likelihood
    const sorted = predictions.sort((a, b) => b.likelihood - a.likelihood);
    
    // Take top N based on available cache space
    const availableSpace = this.config.maxSize - this.cache.size;
    const toPreload = sorted.slice(0, availableSpace).map(p => p.specialistType);
    
    return await this.preload(toPreload, loader);
  }
  
  /**
   * Get cache health status
   */
  getHealth() {
    const stats = this.getStats();
    const hitRate = parseFloat(stats.hitRate);
    
    let status = 'healthy';
    let issues = [];
    
    if (hitRate < 50) {
      status = 'degraded';
      issues.push('Low hit rate');
    }
    
    if (this.metrics.evictions > this.metrics.totalLoaded * 0.5) {
      status = 'degraded';
      issues.push('High eviction rate');
    }
    
    if (this.cache.size === this.config.maxSize) {
      issues.push('Cache at capacity');
    }
    
    return {
      status,
      issues,
      stats
    };
  }
  
  /**
   * Optimize cache based on access patterns
   */
  optimize() {
    // Find rarely accessed entries
    const rarelyUsed = [];
    
    this.cache.forEach((entry, type) => {
      if (entry.accessCount < 2) {
        rarelyUsed.push(type);
      }
    });
    
    // Evict rarely used if we need space
    if (this.cache.size > this.config.maxSize * 0.8) {
      rarelyUsed.forEach(type => {
        this.delete(type);
        this.metrics.evictions++;
      });
      
      logger.info(`🎯 Optimized cache, evicted ${rarelyUsed.length} rarely used entries`);
    }
    
    return rarelyUsed.length;
  }
  
  /**
   * Export cache state for persistence
   */
  export() {
    const state = {
      entries: [],
      metrics: this.metrics,
      config: this.config
    };
    
    this.cache.forEach((entry, type) => {
      state.entries.push({
        type,
        expertise: entry.expertise,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount
      });
    });
    
    return state;
  }
  
  /**
   * Import cache state
   */
  import(state) {
    this.clear();
    
    // Restore entries
    state.entries.forEach(entry => {
      if (!this.isExpired({ timestamp: entry.timestamp })) {
        this.cache.set(entry.type, {
          expertise: entry.expertise,
          timestamp: entry.timestamp,
          accessCount: entry.accessCount
        });
        this.accessOrder.push(entry.type);
      }
    });
    
    // Restore metrics
    if (state.metrics) {
      Object.assign(this.metrics, state.metrics);
      this.metrics.currentSize = this.cache.size;
    }
    
    logger.info(`📥 Imported ${this.cache.size} cache entries`);
  }
}

module.exports = ExpertiseCache;