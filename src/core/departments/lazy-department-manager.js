/**
 * BUMBA Lazy Department Manager Base Class
 * Memory-optimized base class for all department managers
 * Implements lazy loading, caching, and memory pooling
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class LazyDepartmentManager extends EventEmitter {
  constructor(name) {
    super();
    this.departmentName = name;
    
    // Lazy loading storage
    this.specialistMetadata = new Map(); // Lightweight metadata only
    this.loadedSpecialists = new Map();  // Actually loaded specialists
    this.loadingPromises = new Map();    // Prevent duplicate loads
    
    // Memory management
    this.maxCacheSize = parseInt(process.env.MAX_SPECIALIST_CACHE || '10');
    this.cacheAccessOrder = [];
    this.lastCleanup = Date.now();
    this.cleanupInterval = 60000; // 1 minute
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryCleanups: 0,
      averageLoadTime: 0
    };
    
    // Resource tracking for cleanup
    this.activeTimers = new Set();
    this.activeListeners = new Map();
    
    logger.info(`🚀 Lazy ${name} Department Manager initialized (Max cache: ${this.maxCacheSize})`);
  }

  /**
   * Register a specialist without loading it
   */
  registerSpecialist(name, metadata) {
    this.specialistMetadata.set(name, {
      name,
      path: metadata.path,
      description: metadata.description || '',
      capabilities: metadata.capabilities || [],
      priority: metadata.priority || 'normal',
      memoryEstimate: metadata.memoryEstimate || 'medium'
    });
  }

  /**
   * Get specialist metadata without loading
   */
  getSpecialistInfo(name) {
    return this.specialistMetadata.get(name);
  }

  /**
   * List all available specialists (metadata only)
   */
  listAvailableSpecialists() {
    return Array.from(this.specialistMetadata.entries()).map(([name, meta]) => ({
      name,
      description: meta.description,
      loaded: this.loadedSpecialists.has(name),
      capabilities: meta.capabilities
    }));
  }

  /**
   * Lazy load a specialist on demand
   */
  async getSpecialist(name) {
    this.stats.totalRequests++;
    
    // Check if already loaded
    if (this.loadedSpecialists.has(name)) {
      this.stats.cacheHits++;
      this.updateCacheAccess(name);
      return this.loadedSpecialists.get(name);
    }
    
    // Check if currently loading
    if (this.loadingPromises.has(name)) {
      return await this.loadingPromises.get(name);
    }
    
    // Check if specialist is registered
    const metadata = this.specialistMetadata.get(name);
    if (!metadata) {
      throw new Error(`Specialist "${name}" not registered in ${this.departmentName} department`);
    }
    
    // Load the specialist
    this.stats.cacheMisses++;
    const loadPromise = this.loadSpecialist(name, metadata);
    this.loadingPromises.set(name, loadPromise);
    
    try {
      const specialist = await loadPromise;
      this.loadingPromises.delete(name);
      return specialist;
    } catch (error) {
      this.loadingPromises.delete(name);
      throw error;
    }
  }

  /**
   * Actually load a specialist module
   */
  async loadSpecialist(name, metadata) {
    const startTime = Date.now();
    
    try {
      logger.debug(`📦 Lazy loading specialist: ${name}`);
      
      // Check memory before loading
      await this.checkMemoryBeforeLoad(metadata);
      
      // Dynamic import
      const SpecialistModule = await this.safeRequire(metadata.path);
      
      // Create instance
      let specialist;
      if (SpecialistModule.default) {
        specialist = new SpecialistModule.default();
      } else if (SpecialistModule[name]) {
        specialist = new SpecialistModule[name]();
      } else if (typeof SpecialistModule === 'function') {
        specialist = new SpecialistModule();
      } else {
        throw new Error(`Cannot instantiate specialist: ${name}`);
      }
      
      // Store in cache
      this.loadedSpecialists.set(name, specialist);
      this.updateCacheAccess(name);
      
      // Update stats
      const loadTime = Date.now() - startTime;
      this.updateLoadStats(loadTime);
      
      logger.info(`✅ Loaded ${name} in ${loadTime}ms (Cache: ${this.loadedSpecialists.size}/${this.maxCacheSize})`);
      
      this.emit('specialist:loaded', { name, loadTime });
      
      return specialist;
      
    } catch (error) {
      logger.error(`Failed to load specialist ${name}:`, error);
      this.emit('specialist:load-failed', { name, error: error.message });
      throw error;
    }
  }

  /**
   * Safe require with error handling
   */
  async safeRequire(path) {
    try {
      // Try dynamic import first
      return await import(path);
    } catch (error) {
      // Fallback to require
      try {
        return require(path);
      } catch (requireError) {
        logger.error(`Cannot load module: ${path}`, requireError);
        throw requireError;
      }
    }
  }

  /**
   * Check memory and cleanup if needed before loading
   */
  async checkMemoryBeforeLoad(metadata) {
    // Check cache size
    if (this.loadedSpecialists.size >= this.maxCacheSize) {
      await this.evictLeastUsed();
    }
    
    // Periodic cleanup check
    if (Date.now() - this.lastCleanup > this.cleanupInterval) {
      await this.performMemoryCleanup();
    }
  }

  /**
   * Update cache access order for LRU
   */
  updateCacheAccess(name) {
    const index = this.cacheAccessOrder.indexOf(name);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
    this.cacheAccessOrder.push(name);
  }

  /**
   * Evict least recently used specialist
   */
  async evictLeastUsed() {
    if (this.cacheAccessOrder.length === 0) return;
    
    const toEvict = this.cacheAccessOrder.shift();
    const specialist = this.loadedSpecialists.get(toEvict);
    
    // Clean up specialist resources
    if (specialist && typeof specialist.destroy === 'function') {
      await specialist.destroy();
    }
    
    this.loadedSpecialists.delete(toEvict);
    
    logger.debug(`🗑️ Evicted specialist from cache: ${toEvict}`);
    
    this.emit('specialist:evicted', { name: toEvict });
  }

  /**
   * Perform memory cleanup
   */
  async performMemoryCleanup() {
    this.lastCleanup = Date.now();
    this.stats.memoryCleanups++;
    
    // Clean up specialists marked for removal
    for (const [name, specialist] of this.loadedSpecialists) {
      if (this.shouldEvictSpecialist(name, specialist)) {
        if (typeof specialist.destroy === 'function') {
          await specialist.destroy();
        }
        this.loadedSpecialists.delete(name);
        const index = this.cacheAccessOrder.indexOf(name);
        if (index > -1) {
          this.cacheAccessOrder.splice(index, 1);
        }
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      logger.debug('🧹 Forced garbage collection');
    }
    
    logger.debug(`🧹 Memory cleanup completed (Cache size: ${this.loadedSpecialists.size})`);
  }

  /**
   * Determine if a specialist should be evicted
   */
  shouldEvictSpecialist(name, specialist) {
    // Keep high-priority specialists
    const metadata = this.specialistMetadata.get(name);
    if (metadata && metadata.priority === 'high') {
      return false;
    }
    
    // Check if specialist is idle
    if (specialist.isIdle && specialist.isIdle()) {
      return true;
    }
    
    // Check last access time
    const lastAccessIndex = this.cacheAccessOrder.indexOf(name);
    if (lastAccessIndex < Math.floor(this.cacheAccessOrder.length / 3)) {
      return true; // In bottom third of access order
    }
    
    return false;
  }

  /**
   * Update loading statistics
   */
  updateLoadStats(loadTime) {
    const totalLoads = this.stats.cacheMisses;
    const currentAverage = this.stats.averageLoadTime;
    this.stats.averageLoadTime = ((currentAverage * (totalLoads - 1)) + loadTime) / totalLoads;
  }

  /**
   * Preload specialists (optional)
   */
  async preloadSpecialists(names) {
    logger.info(`📦 Preloading ${names.length} specialists...`);
    
    const results = await Promise.allSettled(
      names.map(name => this.getSpecialist(name))
    );
    
    const loaded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`✅ Preloaded ${loaded} specialists (${failed} failed)`);
    
    return { loaded, failed };
  }

  /**
   * Clear all cached specialists
   */
  async clearCache() {
    logger.info(`🗑️ Clearing all cached specialists...`);
    
    // Destroy all loaded specialists
    for (const [name, specialist] of this.loadedSpecialists) {
      if (typeof specialist.destroy === 'function') {
        await specialist.destroy();
      }
    }
    
    this.loadedSpecialists.clear();
    this.cacheAccessOrder = [];
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    logger.info('✅ Cache cleared');
    
    this.emit('cache:cleared');
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    const used = process.memoryUsage();
    
    return {
      department: this.departmentName,
      specialists: {
        registered: this.specialistMetadata.size,
        loaded: this.loadedSpecialists.size,
        maxCache: this.maxCacheSize
      },
      performance: {
        totalRequests: this.stats.totalRequests,
        cacheHitRate: this.stats.totalRequests > 0 
          ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(2) + '%'
          : '0%',
        averageLoadTime: Math.round(this.stats.averageLoadTime) + 'ms',
        memoryCleanups: this.stats.memoryCleanups
      },
      memory: {
        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(used.external / 1024 / 1024) + 'MB'
      }
    };
  }

  /**
   * Clean up resources on destroy
   */
  async destroy() {
    logger.info(`🔚 Destroying ${this.departmentName} department manager...`);
    
    // Clear all timers
    for (const timer of this.activeTimers) {
      clearInterval(timer);
      clearTimeout(timer);
    }
    this.activeTimers.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    // Clear cache
    await this.clearCache();
    
    // Clear metadata
    this.specialistMetadata.clear();
    
    logger.info(`✅ ${this.departmentName} department manager destroyed`);
  }
}

module.exports = LazyDepartmentManager;