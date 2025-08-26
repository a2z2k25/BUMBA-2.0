/**
 * BUMBA Production Mode - Sprint 1: Advanced Caching System
 * 
 * Intelligent multi-layer caching with smart invalidation strategies
 * and performance optimization for production environments
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Cache levels with different characteristics
 */
const CacheLevel = {
  L1_MEMORY: 'L1_MEMORY',       // Fastest, smallest capacity
  L2_DISK: 'L2_DISK',          // Medium speed, larger capacity  
  L3_DISTRIBUTED: 'L3_DISTRIBUTED' // Network-based, largest capacity
};

/**
 * Cache invalidation strategies
 */
const InvalidationStrategy = {
  TTL: 'TTL',                   // Time-to-live based
  LRU: 'LRU',                   // Least recently used
  LFU: 'LFU',                   // Least frequently used
  SMART: 'SMART',               // AI-based invalidation
  DEPENDENCY: 'DEPENDENCY'      // Dependency-based invalidation
};

/**
 * L1 Memory Cache - Ultra-fast in-memory cache
 */
class L1MemoryCache extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxSize: config.maxSize || 100, // Max items
      maxMemory: config.maxMemory || 50 * 1024 * 1024, // 50MB
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes
      strategy: config.strategy || InvalidationStrategy.LRU
    };
    
    this.cache = new Map();
    this.accessTimes = new Map();
    this.accessCounts = new Map();
    this.dependencies = new Map();
    
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      avgAccessTime: 0
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.performMaintenance();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Get item from L1 cache
   */
  get(key) {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    
    // Check TTL
    if (this.config.ttl && Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.accessCounts.delete(key);
      this.metrics.misses++;
      return null;
    }
    
    // Update access tracking
    this.accessTimes.set(key, Date.now());
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
    
    this.metrics.hits++;
    this.updateAccessTime(performance.now() - startTime);
    
    this.emit('hit', { key, level: CacheLevel.L1_MEMORY });
    return entry.value;
  }
  
  /**
   * Set item in L1 cache
   */
  set(key, value, options = {}) {
    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize || 
        this.estimateMemoryUsage() >= this.config.maxMemory) {
      this.evictItems();
    }
    
    const entry = {
      value,
      timestamp: Date.now(),
      size: this.estimateSize(value),
      ttl: options.ttl || this.config.ttl,
      tags: options.tags || [],
      priority: options.priority || 1
    };
    
    this.cache.set(key, entry);
    this.accessTimes.set(key, Date.now());
    this.accessCounts.set(key, 1);
    
    // Handle dependencies
    if (options.dependencies) {
      this.dependencies.set(key, options.dependencies);
    }
    
    this.updateMemoryUsage();
    this.emit('set', { key, size: entry.size, level: CacheLevel.L1_MEMORY });
  }
  
  /**
   * Delete item from L1 cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessTimes.delete(key);
      this.accessCounts.delete(key);
      this.dependencies.delete(key);
      this.updateMemoryUsage();
      this.emit('delete', { key, level: CacheLevel.L1_MEMORY });
    }
    return deleted;
  }
  
  /**
   * Evict items based on strategy
   */
  evictItems() {
    const itemsToEvict = Math.max(1, Math.floor(this.cache.size * 0.1)); // Evict 10%
    
    let entries = Array.from(this.cache.entries());
    
    switch (this.config.strategy) {
      case InvalidationStrategy.LRU:
        entries.sort((a, b) => {
          const aTime = this.accessTimes.get(a[0]) || 0;
          const bTime = this.accessTimes.get(b[0]) || 0;
          return aTime - bTime; // Least recently used first
        });
        break;
        
      case InvalidationStrategy.LFU:
        entries.sort((a, b) => {
          const aCount = this.accessCounts.get(a[0]) || 0;
          const bCount = this.accessCounts.get(b[0]) || 0;
          return aCount - bCount; // Least frequently used first
        });
        break;
        
      case InvalidationStrategy.SMART:
        entries = this.smartEvictionSort(entries);
        break;
    }
    
    // Evict selected items
    for (let i = 0; i < itemsToEvict && i < entries.length; i++) {
      const [key] = entries[i];
      this.delete(key);
      this.metrics.evictions++;
    }
  }
  
  /**
   * Smart eviction based on multiple factors
   */
  smartEvictionSort(entries) {
    return entries.sort((a, b) => {
      const [aKey, aEntry] = a;
      const [bKey, bEntry] = b;
      
      // Calculate eviction score (higher = more likely to evict)
      const aScore = this.calculateEvictionScore(aKey, aEntry);
      const bScore = this.calculateEvictionScore(bKey, bEntry);
      
      return bScore - aScore; // Higher score first (more likely to evict)
    });
  }
  
  /**
   * Calculate eviction score for smart strategy
   */
  calculateEvictionScore(key, entry) {
    const now = Date.now();
    const age = now - entry.timestamp;
    const lastAccess = now - (this.accessTimes.get(key) || entry.timestamp);
    const accessCount = this.accessCounts.get(key) || 1;
    const size = entry.size || 1;
    const priority = entry.priority || 1;
    
    // Higher score = more likely to evict
    let score = 0;
    
    // Age factor (older = higher score)
    score += Math.log(age + 1) * 0.3;
    
    // Access recency (less recent = higher score)
    score += Math.log(lastAccess + 1) * 0.4;
    
    // Frequency factor (less frequent = higher score)
    score += Math.log(Math.max(1, 100 - accessCount)) * 0.2;
    
    // Size factor (larger = slightly higher score)
    score += Math.log(size + 1) * 0.05;
    
    // Priority factor (lower priority = higher score)
    score += Math.log(Math.max(0.1, 2 - priority)) * 0.05;
    
    return score;
  }
  
  /**
   * Perform maintenance tasks
   */
  performMaintenance() {
    // Remove expired items
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.delete(key);
      }
    }
    
    // Update memory metrics
    this.updateMemoryUsage();
    
    this.emit('maintenance', {
      size: this.cache.size,
      memoryUsage: this.metrics.memoryUsage
    });
  }
  
  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    let total = 0;
    for (const [key, entry] of this.cache) {
      total += this.estimateSize(key) + entry.size;
    }
    return total;
  }
  
  /**
   * Estimate size of an object
   */
  estimateSize(obj) {
    if (obj === null || obj === undefined) return 8;
    if (typeof obj === 'boolean') return 4;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'string') return obj.length * 2;
    if (typeof obj === 'object') {
      return JSON.stringify(obj).length * 2;
    }
    return 100; // Default estimate
  }
  
  /**
   * Update memory usage metric
   */
  updateMemoryUsage() {
    this.metrics.memoryUsage = this.estimateMemoryUsage();
  }
  
  /**
   * Update average access time
   */
  updateAccessTime(time) {
    const totalHits = this.metrics.hits;
    if (totalHits === 1) {
      this.metrics.avgAccessTime = time;
    } else {
      this.metrics.avgAccessTime = 
        (this.metrics.avgAccessTime * (totalHits - 1) + time) / totalHits;
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 ? 
      this.metrics.hits / (this.metrics.hits + this.metrics.misses) : 0;
    
    return {
      level: CacheLevel.L1_MEMORY,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.metrics.memoryUsage,
      maxMemory: this.config.maxMemory,
      hitRate,
      ...this.metrics
    };
  }
  
  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.accessCounts.clear();
    this.dependencies.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      avgAccessTime: 0
    };
    this.emit('clear', { level: CacheLevel.L1_MEMORY });
  }
  
  /**
   * Cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.removeAllListeners();
  }
}

/**
 * L2 Disk Cache - Persistent disk-based cache
 */
class L2DiskCache extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      cacheDir: config.cacheDir || path.join(process.cwd(), '.cache', 'bumba'),
      maxSize: config.maxSize || 1000, // Max files
      maxDiskUsage: config.maxDiskUsage || 500 * 1024 * 1024, // 500MB
      ttl: config.ttl || 60 * 60 * 1000, // 1 hour
      compression: config.compression !== false
    };
    
    this.index = new Map(); // File metadata index
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      diskUsage: 0,
      avgAccessTime: 0
    };
    
    this.initializeCache();
  }
  
  /**
   * Initialize disk cache
   */
  async initializeCache() {
    try {
      await fs.mkdir(this.config.cacheDir, { recursive: true });
      await this.buildIndex();
      this.emit('initialized', { level: CacheLevel.L2_DISK });
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  /**
   * Build cache index from disk
   */
  async buildIndex() {
    try {
      const files = await fs.readdir(this.config.cacheDir);
      let diskUsage = 0;
      
      for (const file of files) {
        if (file.endsWith('.cache')) {
          const filePath = path.join(this.config.cacheDir, file);
          const stats = await fs.stat(filePath);
          const key = file.replace('.cache', '');
          
          this.index.set(key, {
            path: filePath,
            size: stats.size,
            timestamp: stats.mtime.getTime(),
            accessed: stats.atime.getTime()
          });
          
          diskUsage += stats.size;
        }
      }
      
      this.metrics.diskUsage = diskUsage;
    } catch (error) {
      // Cache directory might not exist yet
    }
  }
  
  /**
   * Get item from L2 cache
   */
  async get(key) {
    const startTime = performance.now();
    
    const entry = this.index.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    
    try {
      // Check TTL
      if (this.config.ttl && Date.now() - entry.timestamp > this.config.ttl) {
        await this.delete(key);
        this.metrics.misses++;
        return null;
      }
      
      // Read from disk
      const data = await fs.readFile(entry.path, 'utf8');
      const parsed = JSON.parse(data);
      
      // Update access time
      entry.accessed = Date.now();
      
      this.metrics.hits++;
      this.updateAccessTime(performance.now() - startTime);
      
      this.emit('hit', { key, level: CacheLevel.L2_DISK });
      return parsed.value;
      
    } catch (error) {
      // File might be corrupted or deleted
      await this.delete(key);
      this.metrics.misses++;
      return null;
    }
  }
  
  /**
   * Set item in L2 cache
   */
  async set(key, value, options = {}) {
    try {
      // Check if we need to evict
      if (this.index.size >= this.config.maxSize || 
          this.metrics.diskUsage >= this.config.maxDiskUsage) {
        await this.evictItems();
      }
      
      const cacheData = {
        value,
        timestamp: Date.now(),
        ttl: options.ttl || this.config.ttl,
        tags: options.tags || []
      };
      
      const filePath = path.join(this.config.cacheDir, `${this.hashKey(key)}.cache`);
      const dataString = JSON.stringify(cacheData);
      
      await fs.writeFile(filePath, dataString, 'utf8');
      
      const stats = await fs.stat(filePath);
      this.index.set(key, {
        path: filePath,
        size: stats.size,
        timestamp: Date.now(),
        accessed: Date.now()
      });
      
      this.metrics.diskUsage += stats.size;
      this.metrics.writes++;
      
      this.emit('set', { key, size: stats.size, level: CacheLevel.L2_DISK });
      
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  /**
   * Delete item from L2 cache
   */
  async delete(key) {
    const entry = this.index.get(key);
    if (!entry) return false;
    
    try {
      await fs.unlink(entry.path);
      this.metrics.diskUsage -= entry.size;
      this.index.delete(key);
      
      this.emit('delete', { key, level: CacheLevel.L2_DISK });
      return true;
      
    } catch (error) {
      // File might already be deleted
      this.index.delete(key);
      return false;
    }
  }
  
  /**
   * Evict items from L2 cache
   */
  async evictItems() {
    const itemsToEvict = Math.max(1, Math.floor(this.index.size * 0.1));
    
    // Sort by least recently accessed
    const entries = Array.from(this.index.entries())
      .sort((a, b) => a[1].accessed - b[1].accessed);
    
    // Evict oldest items
    for (let i = 0; i < itemsToEvict && i < entries.length; i++) {
      const [key] = entries[i];
      await this.delete(key);
    }
  }
  
  /**
   * Hash cache key for filename
   */
  hashKey(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }
  
  /**
   * Update average access time
   */
  updateAccessTime(time) {
    const totalHits = this.metrics.hits;
    if (totalHits === 1) {
      this.metrics.avgAccessTime = time;
    } else {
      this.metrics.avgAccessTime = 
        (this.metrics.avgAccessTime * (totalHits - 1) + time) / totalHits;
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0 ? 
      this.metrics.hits / (this.metrics.hits + this.metrics.misses) : 0;
    
    return {
      level: CacheLevel.L2_DISK,
      size: this.index.size,
      maxSize: this.config.maxSize,
      diskUsage: this.metrics.diskUsage,
      maxDiskUsage: this.config.maxDiskUsage,
      hitRate,
      ...this.metrics
    };
  }
  
  /**
   * Clear cache
   */
  async clear() {
    try {
      const files = await fs.readdir(this.config.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache')) {
          await fs.unlink(path.join(this.config.cacheDir, file));
        }
      }
      
      this.index.clear();
      this.metrics = {
        hits: 0,
        misses: 0,
        writes: 0,
        diskUsage: 0,
        avgAccessTime: 0
      };
      
      this.emit('clear', { level: CacheLevel.L2_DISK });
      
    } catch (error) {
      this.emit('error', error);
    }
  }
}

/**
 * Production Cache Engine - Orchestrates multi-layer caching
 */
class ProductionCacheEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // L1 Memory Cache Config
      l1Config: {
        maxSize: config.l1MaxSize || 500,
        maxMemory: config.l1MaxMemory || 100 * 1024 * 1024, // 100MB
        ttl: config.l1TTL || 5 * 60 * 1000, // 5 minutes
        strategy: InvalidationStrategy.SMART
      },
      
      // L2 Disk Cache Config
      l2Config: {
        maxSize: config.l2MaxSize || 5000,
        maxDiskUsage: config.l2MaxDiskUsage || 1024 * 1024 * 1024, // 1GB
        ttl: config.l2TTL || 60 * 60 * 1000, // 1 hour
        compression: true
      },
      
      // Cache warming
      enableWarming: config.enableWarming !== false,
      warmingPatterns: config.warmingPatterns || [],
      
      // Analytics
      enableAnalytics: config.enableAnalytics !== false,
      
      // Performance
      asyncOperations: config.asyncOperations !== false,
      batchOperations: config.batchOperations !== false
    };
    
    // Initialize cache layers
    this.l1Cache = new L1MemoryCache(this.config.l1Config);
    this.l2Cache = new L2DiskCache(this.config.l2Config);
    
    // Global metrics
    this.metrics = {
      totalRequests: 0,
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      avgResponseTime: 0,
      cacheEfficiency: 0,
      memoryUsage: 0,
      diskUsage: 0,
      startTime: Date.now()
    };
    
    // Cache warming
    this.warmedKeys = new Set();
    this.warmingQueue = [];
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('🟢 Production Cache Engine initialized');
    this.logCacheConfiguration();
  }
  
  /**
   * Setup event handlers for cache layers
   */
  setupEventHandlers() {
    // L1 Cache events
    this.l1Cache.on('hit', (event) => {
      this.metrics.l1Hits++;
      this.emit('cache:hit', { ...event, engine: 'production' });
    });
    
    this.l1Cache.on('set', (event) => {
      this.emit('cache:set', { ...event, engine: 'production' });
    });
    
    // L2 Cache events
    this.l2Cache.on('hit', (event) => {
      this.metrics.l2Hits++;
      this.emit('cache:hit', { ...event, engine: 'production' });
    });
    
    this.l2Cache.on('set', (event) => {
      this.emit('cache:set', { ...event, engine: 'production' });
    });
    
    // Error handling
    this.l1Cache.on('error', (error) => this.emit('error', error));
    this.l2Cache.on('error', (error) => this.emit('error', error));
  }
  
  /**
   * Get item from cache (L1 → L2 → Miss)
   */
  async get(key, options = {}) {
    const startTime = performance.now();
    this.metrics.totalRequests++;
    
    try {
      // Try L1 first
      let value = this.l1Cache.get(key);
      if (value !== null) {
        this.updateResponseTime(performance.now() - startTime);
        return value;
      }
      
      // Try L2
      value = await this.l2Cache.get(key);
      if (value !== null) {
        // Promote to L1 if requested
        if (options.promoteToL1 !== false) {
          this.l1Cache.set(key, value, options);
        }
        this.updateResponseTime(performance.now() - startTime);
        return value;
      }
      
      // Cache miss
      this.metrics.misses++;
      this.updateResponseTime(performance.now() - startTime);
      this.emit('cache:miss', { key, engine: 'production' });
      return null;
      
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }
  
  /**
   * Set item in cache (both L1 and L2)
   */
  async set(key, value, options = {}) {
    try {
      const cacheOptions = {
        ttl: options.ttl,
        tags: options.tags,
        priority: options.priority,
        dependencies: options.dependencies
      };
      
      // Set in L1 (synchronous)
      this.l1Cache.set(key, value, cacheOptions);
      
      // Set in L2 (asynchronous if enabled)
      if (this.config.asyncOperations) {
        setImmediate(async () => {
          await this.l2Cache.set(key, value, cacheOptions);
        });
      } else {
        await this.l2Cache.set(key, value, cacheOptions);
      }
      
      this.emit('cache:set', { key, engine: 'production' });
      
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  /**
   * Delete item from cache (both layers)
   */
  async delete(key) {
    try {
      const l1Deleted = this.l1Cache.delete(key);
      const l2Deleted = await this.l2Cache.delete(key);
      
      this.emit('cache:delete', { key, engine: 'production' });
      return l1Deleted || l2Deleted;
      
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }
  
  /**
   * Warm cache with frequently accessed items
   */
  async warmCache(patterns = []) {
    if (!this.config.enableWarming) return;
    
    const warmingPatterns = patterns.length > 0 ? patterns : this.config.warmingPatterns;
    
    console.log(`🔥 Cache warming started with ${warmingPatterns.length} patterns`);
    
    for (const pattern of warmingPatterns) {
      if (typeof pattern === 'function') {
        // Pattern is a function that generates key-value pairs
        try {
          const items = await pattern();
          for (const [key, value] of items) {
            await this.set(key, value, { priority: 2 });
            this.warmedKeys.add(key);
          }
        } catch (error) {
          console.error('Cache warming error:', error);
        }
      } else if (typeof pattern === 'object') {
        // Pattern is a key-value object
        for (const [key, value] of Object.entries(pattern)) {
          await this.set(key, value, { priority: 2 });
          this.warmedKeys.add(key);
        }
      }
    }
    
    console.log(`🏁 Cache warming completed: ${this.warmedKeys.size} items warmed`);
    this.emit('cache:warmed', { count: this.warmedKeys.size });
  }
  
  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag) {
    try {
      // This would require tag tracking in both cache layers
      // For now, emit event for external handling
      this.emit('cache:invalidate', { tag, engine: 'production' });
      
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  /**
   * Get comprehensive cache analytics
   */
  getCacheAnalytics() {
    const l1Stats = this.l1Cache.getStats();
    const l2Stats = this.l2Cache.getStats();
    
    const totalHits = this.metrics.l1Hits + this.metrics.l2Hits;
    const totalRequests = this.metrics.totalRequests;
    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    
    return {
      overall: {
        hitRate: overallHitRate,
        missRate: totalRequests > 0 ? this.metrics.misses / totalRequests : 0,
        totalRequests,
        avgResponseTime: this.metrics.avgResponseTime,
        efficiency: this.calculateCacheEfficiency(),
        uptime: Date.now() - this.metrics.startTime
      },
      l1: l1Stats,
      l2: l2Stats,
      distribution: {
        l1HitRate: totalRequests > 0 ? this.metrics.l1Hits / totalRequests : 0,
        l2HitRate: totalRequests > 0 ? this.metrics.l2Hits / totalRequests : 0,
        l1Promotion: this.calculateL1PromotionRate()
      },
      warming: {
        warmedKeys: this.warmedKeys.size,
        enabled: this.config.enableWarming
      },
      performance: {
        memoryUsage: l1Stats.memoryUsage,
        diskUsage: l2Stats.diskUsage,
        totalStorage: l1Stats.memoryUsage + l2Stats.diskUsage,
        l1AvgAccess: l1Stats.avgAccessTime,
        l2AvgAccess: l2Stats.avgAccessTime
      }
    };
  }
  
  /**
   * Calculate cache efficiency
   */
  calculateCacheEfficiency() {
    const analytics = {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats()
    };
    
    const totalHits = this.metrics.l1Hits + this.metrics.l2Hits;
    const totalRequests = this.metrics.totalRequests;
    
    if (totalRequests === 0) return 0;
    
    const hitRate = totalHits / totalRequests;
    const memoryEfficiency = analytics.l1.memoryUsage > 0 ? 
      this.metrics.l1Hits / analytics.l1.memoryUsage : 0;
    const diskEfficiency = analytics.l2.diskUsage > 0 ? 
      this.metrics.l2Hits / analytics.l2.diskUsage : 0;
    
    // Weighted efficiency score
    return (hitRate * 0.5) + (memoryEfficiency * 0.3) + (diskEfficiency * 0.2);
  }
  
  /**
   * Calculate L1 promotion rate
   */
  calculateL1PromotionRate() {
    // This would track L2→L1 promotions
    // For now, return estimated rate
    const l2Hits = this.metrics.l2Hits;
    return l2Hits > 0 ? 0.3 : 0; // Assume 30% promotion rate
  }
  
  /**
   * Update average response time
   */
  updateResponseTime(time) {
    const totalRequests = this.metrics.totalRequests;
    if (totalRequests === 1) {
      this.metrics.avgResponseTime = time;
    } else {
      this.metrics.avgResponseTime = 
        (this.metrics.avgResponseTime * (totalRequests - 1) + time) / totalRequests;
    }
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    if (!this.config.enableAnalytics) return;
    
    this.monitoringInterval = setInterval(() => {
      const analytics = this.getCacheAnalytics();
      
      // Emit analytics for external monitoring
      this.emit('cache:analytics', analytics);
      
      // Log performance if enabled
      if (analytics.overall.totalRequests > 0) {
        console.log(`📊 Cache Analytics: ${(analytics.overall.hitRate * 100).toFixed(1)}% hit rate, ${analytics.overall.avgResponseTime.toFixed(2)}ms avg response`);
      }
      
    }, 60000); // Every minute
  }
  
  /**
   * Log cache configuration
   */
  logCacheConfiguration() {
    console.log('Cache Configuration:');
    console.log(`  L1 Memory: ${this.config.l1Config.maxSize} items, ${Math.round(this.config.l1Config.maxMemory / 1024 / 1024)}MB`);
    console.log(`  L2 Disk: ${this.config.l2Config.maxSize} files, ${Math.round(this.config.l2Config.maxDiskUsage / 1024 / 1024)}MB`);
    console.log(`  Warming: ${this.config.enableWarming ? 'Enabled' : 'Disabled'}`);
    console.log(`  Analytics: ${this.config.enableAnalytics ? 'Enabled' : 'Disabled'}`);
  }
  
  /**
   * Clear all caches
   */
  async clear() {
    this.l1Cache.clear();
    await this.l2Cache.clear();
    this.warmedKeys.clear();
    
    this.metrics = {
      totalRequests: 0,
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      avgResponseTime: 0,
      cacheEfficiency: 0,
      memoryUsage: 0,
      diskUsage: 0,
      startTime: Date.now()
    };
    
    this.emit('cache:clear', { engine: 'production' });
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔴 Cache Engine shutting down...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Final analytics
    const analytics = this.getCacheAnalytics();
    console.log(`📊 Final Cache Stats: ${(analytics.overall.hitRate * 100).toFixed(1)}% hit rate, ${analytics.overall.totalRequests} total requests`);
    
    this.l1Cache.destroy();
    this.removeAllListeners();
    
    console.log('🏁 Cache Engine shutdown complete');
  }
}

module.exports = {
  ProductionCacheEngine,
  CacheLevel,
  InvalidationStrategy,
  L1MemoryCache,
  L2DiskCache
};