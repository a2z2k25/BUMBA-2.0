/**
 * Cache Manager
 * Multi-layer caching with automatic invalidation
 * Sprint 29-32 - Caching Strategy
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');
const EventEmitter = require('events');

class CacheManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      defaultTTL: options.defaultTTL || 3600000, // 1 hour
      maxSize: options.maxSize || 1000,
      maxMemory: options.maxMemory || 100 * 1024 * 1024, // 100MB
      enableCompression: options.enableCompression || false,
      enableStatistics: options.enableStatistics !== false,
      cleanupInterval: options.cleanupInterval || 60000, // 1 minute
      layers: options.layers || ['memory', 'disk']
    };
    
    // Cache layers
    this.layers = new Map();
    this.initializeLayers();
    
    // Cache metadata
    this.metadata = new Map();
    this.dependencies = new Map();
    this.tags = new Map();
    
    // Timers
    this.timers = new ComponentTimers('cache-manager');
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0
    };
    
    // Start cleanup timer
    this.startCleanup();
    
    // Register with state manager
    stateManager.register('cache', {
      stats: this.stats,
      size: 0,
      memory: 0
    });
  }
  
  /**
   * Initialize cache layers
   */
  initializeLayers() {
    for (const layer of this.options.layers) {
      switch (layer) {
        case 'memory':
          this.layers.set('memory', new MemoryCache(this.options));
          break;
        case 'disk':
          this.layers.set('disk', new DiskCache(this.options));
          break;
        case 'redis':
          // Redis would be initialized here if available
          break;
      }
    }
  }
  
  /**
   * Get value from cache
   */
  async get(key, options = {}) {
    const normalizedKey = this.normalizeKey(key);
    
    // Try each layer
    for (const [layerName, layer] of this.layers) {
      const value = await layer.get(normalizedKey);
      
      if (value !== undefined) {
        this.stats.hits++;
        
        // Promote to higher layers
        if (options.promote !== false) {
          await this.promoteToHigherLayers(layerName, normalizedKey, value);
        }
        
        // Check if stale
        const metadata = this.metadata.get(normalizedKey);
        if (metadata && this.isStale(metadata)) {
          // Trigger background refresh
          this.refreshInBackground(key, metadata);
        }
        
        this.emit('cache:hit', { key, layer: layerName });
        this.updateState();
        return value;
      }
    }
    
    this.stats.misses++;
    this.emit('cache:miss', { key });
    this.updateState();
    return undefined;
  }
  
  /**
   * Set value in cache
   */
  async set(key, value, options = {}) {
    const normalizedKey = this.normalizeKey(key);
    const ttl = options.ttl || this.options.defaultTTL;
    
    // Calculate size
    const size = this.calculateSize(value);
    
    // Check memory limit
    if (this.stats.memoryUsage + size > this.options.maxMemory) {
      await this.evictLRU(size);
    }
    
    // Store metadata
    const metadata = {
      key: normalizedKey,
      size,
      ttl,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: options.tags || [],
      dependencies: options.dependencies || [],
      refreshFunction: options.refresh || null
    };
    
    this.metadata.set(normalizedKey, metadata);
    
    // Store in tags index
    for (const tag of metadata.tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(normalizedKey);
    }
    
    // Store in dependencies index
    for (const dep of metadata.dependencies) {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep).add(normalizedKey);
    }
    
    // Set in all layers based on options
    const layers = options.layers || Array.from(this.layers.keys());
    for (const layerName of layers) {
      const layer = this.layers.get(layerName);
      if (layer) {
        await layer.set(normalizedKey, value, ttl);
      }
    }
    
    this.stats.sets++;
    this.stats.memoryUsage += size;
    
    this.emit('cache:set', { key, size, ttl });
    this.updateState();
    
    return true;
  }
  
  /**
   * Delete value from cache
   */
  async delete(key) {
    const normalizedKey = this.normalizeKey(key);
    
    // Remove from all layers
    for (const [, layer] of this.layers) {
      await layer.delete(normalizedKey);
    }
    
    // Remove metadata
    const metadata = this.metadata.get(normalizedKey);
    if (metadata) {
      this.stats.memoryUsage -= metadata.size;
      
      // Remove from tags
      for (const tag of metadata.tags) {
        const tagSet = this.tags.get(tag);
        if (tagSet) {
          tagSet.delete(normalizedKey);
          if (tagSet.size === 0) {
            this.tags.delete(tag);
          }
        }
      }
      
      // Remove from dependencies
      for (const dep of metadata.dependencies) {
        const depSet = this.dependencies.get(dep);
        if (depSet) {
          depSet.delete(normalizedKey);
          if (depSet.size === 0) {
            this.dependencies.delete(dep);
          }
        }
      }
      
      this.metadata.delete(normalizedKey);
    }
    
    this.stats.deletes++;
    
    this.emit('cache:delete', { key });
    this.updateState();
    
    return true;
  }
  
  /**
   * Clear entire cache
   */
  async clear() {
    for (const [, layer] of this.layers) {
      await layer.clear();
    }
    
    this.metadata.clear();
    this.dependencies.clear();
    this.tags.clear();
    this.stats.memoryUsage = 0;
    
    this.emit('cache:clear');
    this.updateState();
  }
  
  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag) {
    const keys = this.tags.get(tag);
    if (!keys) return 0;
    
    let invalidated = 0;
    for (const key of keys) {
      await this.delete(key);
      invalidated++;
    }
    
    return invalidated;
  }
  
  /**
   * Invalidate by dependency
   */
  async invalidateByDependency(dependency) {
    const keys = this.dependencies.get(dependency);
    if (!keys) return 0;
    
    let invalidated = 0;
    for (const key of keys) {
      await this.delete(key);
      invalidated++;
    }
    
    return invalidated;
  }
  
  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet(key, fetchFunction, options = {}) {
    let value = await this.get(key);
    
    if (value === undefined) {
      value = await fetchFunction();
      
      if (value !== undefined) {
        await this.set(key, value, options);
      }
    }
    
    return value;
  }
  
  /**
   * Memoize function
   */
  memoize(fn, options = {}) {
    const self = this;
    
    return async function(...args) {
      const key = options.key 
        ? options.key(...args)
        : `memoize:${fn.name}:${JSON.stringify(args)}`;
      
      return self.getOrSet(key, () => fn(...args), options);
    };
  }
  
  /**
   * Promote value to higher layers
   */
  async promoteToHigherLayers(currentLayer, key, value) {
    const layers = Array.from(this.layers.keys());
    const currentIndex = layers.indexOf(currentLayer);
    
    for (let i = 0; i < currentIndex; i++) {
      const layer = this.layers.get(layers[i]);
      const metadata = this.metadata.get(key);
      
      if (layer && metadata) {
        await layer.set(key, value, metadata.expiresAt - Date.now());
      }
    }
  }
  
  /**
   * Check if value is stale
   */
  isStale(metadata) {
    if (!metadata.refreshFunction) return false;
    
    const age = Date.now() - metadata.createdAt;
    const ttl = metadata.expiresAt - metadata.createdAt;
    
    // Consider stale if > 80% of TTL
    return age > ttl * 0.8;
  }
  
  /**
   * Refresh value in background
   */
  async refreshInBackground(key, metadata) {
    if (!metadata.refreshFunction) return;
    
    try {
      const newValue = await metadata.refreshFunction();
      
      if (newValue !== undefined) {
        await this.set(key, newValue, {
          ttl: metadata.ttl,
          tags: metadata.tags,
          dependencies: metadata.dependencies,
          refresh: metadata.refreshFunction
        });
      }
    } catch (error) {
      logger.error(`Failed to refresh cache key ${key}:`, error);
    }
  }
  
  /**
   * Evict LRU entries
   */
  async evictLRU(requiredSize) {
    const entries = Array.from(this.metadata.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    let freed = 0;
    
    for (const [key, metadata] of entries) {
      await this.delete(key);
      freed += metadata.size;
      this.stats.evictions++;
      
      if (freed >= requiredSize) break;
    }
    
    return freed;
  }
  
  /**
   * Cleanup expired entries
   */
  async cleanup() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.expiresAt < now) {
        expired.push(key);
      }
    }
    
    for (const key of expired) {
      await this.delete(key);
    }
    
    if (expired.length > 0) {
      logger.debug(`Cache cleanup: removed ${expired.length} expired entries`);
    }
  }
  
  /**
   * Start cleanup timer
   */
  startCleanup() {
    this.timers.setInterval('cleanup', () => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }
  
  /**
   * Calculate size of value
   */
  calculateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2; // Unicode
    }
    if (Buffer.isBuffer(value)) {
      return value.length;
    }
    return JSON.stringify(value).length * 2;
  }
  
  /**
   * Normalize cache key
   */
  normalizeKey(key) {
    if (typeof key === 'string') {
      return key;
    }
    if (typeof key === 'object') {
      return crypto.createHash('md5')
        .update(JSON.stringify(key))
        .digest('hex');
    }
    return String(key);
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const layerStats = {};
    
    for (const [name, layer] of this.layers) {
      layerStats[name] = layer.getStats();
    }
    
    return {
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
        : '0%',
      size: this.metadata.size,
      memoryUsage: `${(this.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
      layers: layerStats
    };
  }
  
  /**
   * Update state
   */
  updateState() {
    if (this.options.enableStatistics) {
      stateManager.set('cache', 'stats', this.stats);
      stateManager.set('cache', 'size', this.metadata.size);
      stateManager.set('cache', 'memory', this.stats.memoryUsage);
    }
  }
  
  /**
   * Destroy cache manager
   */
  async destroy() {
    this.timers.clearAll();
    await this.clear();
    
    for (const [, layer] of this.layers) {
      if (layer.destroy) {
        await layer.destroy();
      }
    }
    
    this.removeAllListeners();
  }
}

/**
 * Memory cache layer
 */
class MemoryCache {
  constructor(options) {
    this.options = options;
    this.cache = new Map();
    this.lru = new Map(); // For LRU tracking
  }
  
  async get(key) {
    const entry = this.cache.get(key);
    
    if (entry && entry.expiresAt > Date.now()) {
      // Update LRU
      this.lru.delete(key);
      this.lru.set(key, Date.now());
      
      return entry.value;
    }
    
    if (entry) {
      // Expired, remove it
      this.cache.delete(key);
      this.lru.delete(key);
    }
    
    return undefined;
  }
  
  async set(key, value, ttl) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
    
    this.lru.set(key, Date.now());
    
    // Enforce max size
    if (this.cache.size > this.options.maxSize) {
      const oldestKey = this.lru.keys().next().value;
      this.cache.delete(oldestKey);
      this.lru.delete(oldestKey);
    }
  }
  
  async delete(key) {
    this.cache.delete(key);
    this.lru.delete(key);
  }
  
  async clear() {
    this.cache.clear();
    this.lru.clear();
  }
  
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize
    };
  }
}

/**
 * Disk cache layer (simplified)
 */
class DiskCache {
  constructor(options) {
    this.options = options;
    this.index = new Map(); // In-memory index
  }
  
  async get(key) {
    // Would read from disk
    return this.index.get(key);
  }
  
  async set(key, value, ttl) {
    // Would write to disk
    this.index.set(key, value);
  }
  
  async delete(key) {
    // Would delete from disk
    this.index.delete(key);
  }
  
  async clear() {
    this.index.clear();
  }
  
  getStats() {
    return {
      size: this.index.size
    };
  }
  
  async destroy() {
    await this.clear();
  }
}

// Singleton instance
let instance = null;

function getCacheManager(options) {
  if (!instance) {
    instance = new CacheManager(options);
  }
  return instance;
}

module.exports = {
  CacheManager,
  MemoryCache,
  DiskCache,
  getCacheManager,
  cacheManager: getCacheManager()
};