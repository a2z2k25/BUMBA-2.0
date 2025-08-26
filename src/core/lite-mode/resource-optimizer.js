/**
 * BUMBA Lite Mode - Sprint 4: Resource Optimization
 * 
 * Advanced resource management and optimization for Lite Mode
 * Goals: <30MB memory, <100ms startup, <500ms response time
 */

/**
 * Memory Pool Manager
 * Reuses objects to minimize garbage collection
 */
class MemoryPool {
  constructor(maxSize = 100) {
    this.pool = [];
    this.maxSize = maxSize;
    this.created = 0;
    this.reused = 0;
  }

  acquire() {
    if (this.pool.length > 0) {
      this.reused++;
      return this.pool.pop();
    }
    this.created++;
    return {};
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      // Clear object properties
      for (const key in obj) {
        delete obj[key];
      }
      this.pool.push(obj);
    }
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      created: this.created,
      reused: this.reused,
      reuseRate: this.reused / (this.created + this.reused)
    };
  }
}

/**
 * Smart Cache with LRU eviction
 */
class SmartCache {
  constructor(maxSize = 50, maxMemory = 1024 * 1024) { // 1MB default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxMemory = maxMemory;
    this.currentMemory = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value.data;
    }
    this.misses++;
    return null;
  }

  set(key, value, size = 100) {
    // Check if we need to evict
    while (this.currentMemory + size > this.maxMemory || this.cache.size >= this.maxSize) {
      this.evict();
    }

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const old = this.cache.get(key);
      this.currentMemory -= old.size;
      this.cache.delete(key);
    }

    // Add new entry
    this.cache.set(key, { data: value, size, timestamp: Date.now() });
    this.currentMemory += size;
  }

  evict() {
    // Evict least recently used (first item)
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      const entry = this.cache.get(firstKey);
      this.currentMemory -= entry.size;
      this.cache.delete(firstKey);
      this.evictions++;
    }
  }

  clear() {
    this.cache.clear();
    this.currentMemory = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      memory: this.currentMemory,
      hitRate: this.hits / (this.hits + this.misses),
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions
    };
  }
}

/**
 * Resource Monitor
 * Tracks and controls resource usage
 */
class ResourceMonitor {
  constructor(limits = {}) {
    this.limits = {
      memory: limits.memory || 30 * 1024 * 1024, // 30MB
      cpuPercent: limits.cpuPercent || 50,
      concurrent: limits.concurrent || 3,
      cacheSize: limits.cacheSize || 1024 * 1024 // 1MB
    };

    this.current = {
      memory: 0,
      cpuPercent: 0,
      concurrent: 0,
      cacheSize: 0
    };

    this.history = [];
    this.warnings = [];
  }

  checkMemory() {
    if (global.gc) {
      global.gc(); // Force garbage collection if available
    }
    
    const usage = process.memoryUsage();
    this.current.memory = usage.heapUsed;
    
    if (this.current.memory > this.limits.memory) {
      this.addWarning('memory', `Memory usage (${this.formatBytes(this.current.memory)}) exceeds limit (${this.formatBytes(this.limits.memory)})`);
      return false;
    }
    return true;
  }

  checkConcurrency() {
    return this.current.concurrent < this.limits.concurrent;
  }

  acquire() {
    if (!this.checkConcurrency()) {
      throw new Error('Concurrency limit reached');
    }
    this.current.concurrent++;
  }

  release() {
    if (this.current.concurrent > 0) {
      this.current.concurrent--;
    }
  }

  addWarning(type, message) {
    this.warnings.push({
      type,
      message,
      timestamp: Date.now()
    });
    
    // Keep only last 10 warnings
    if (this.warnings.length > 10) {
      this.warnings.shift();
    }
  }

  formatBytes(bytes) {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  }

  getStatus() {
    return {
      memory: {
        current: this.current.memory,
        limit: this.limits.memory,
        usage: (this.current.memory / this.limits.memory * 100).toFixed(1) + '%'
      },
      concurrent: {
        current: this.current.concurrent,
        limit: this.limits.concurrent
      },
      warnings: this.warnings.length,
      healthy: this.checkMemory() && this.checkConcurrency()
    };
  }
}

/**
 * Task Queue with priority and batching
 */
class OptimizedTaskQueue {
  constructor(batchSize = 5, batchDelay = 50) {
    this.queue = [];
    this.processing = false;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.stats = {
      queued: 0,
      processed: 0,
      batches: 0,
      avgBatchSize: 0
    };
  }

  async add(task, priority = 5) {
    this.queue.push({ task, priority, timestamp: Date.now() });
    this.stats.queued++;
    
    // Sort by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.processing) {
      this.processBatch();
    }
  }

  async processBatch() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    
    // Wait for batch accumulation
    await new Promise(resolve => setTimeout(resolve, this.batchDelay));
    
    // Process batch
    const batch = this.queue.splice(0, this.batchSize);
    this.stats.batches++;
    this.stats.avgBatchSize = 
      (this.stats.avgBatchSize * (this.stats.batches - 1) + batch.length) / this.stats.batches;
    
    // Execute batch in parallel
    const results = await Promise.all(
      batch.map(item => this.executeTask(item.task))
    );
    
    this.stats.processed += batch.length;
    this.processing = false;
    
    // Process next batch if queue not empty
    if (this.queue.length > 0) {
      this.processBatch();
    }
    
    return results;
  }

  async executeTask(task) {
    try {
      if (typeof task === 'function') {
        return await task();
      }
      return await task.execute();
    } catch (error) {
      console.error('Task execution error:', error);
      return { error: error.message };
    }
  }

  getStats() {
    return {
      ...this.stats,
      pending: this.queue.length,
      efficiency: this.stats.avgBatchSize / this.batchSize
    };
  }
}

/**
 * Lazy Loading Manager
 * Loads components only when needed
 */
class LazyLoader {
  constructor() {
    this.loaded = new Map();
    this.loaders = new Map();
    this.stats = {
      loaded: 0,
      cached: 0,
      loadTime: 0
    };
  }

  register(name, loader) {
    this.loaders.set(name, loader);
  }

  async get(name) {
    // Check cache
    if (this.loaded.has(name)) {
      this.stats.cached++;
      return this.loaded.get(name);
    }

    // Load if loader exists
    if (this.loaders.has(name)) {
      const start = Date.now();
      const component = await this.loaders.get(name)();
      const loadTime = Date.now() - start;
      
      this.loaded.set(name, component);
      this.stats.loaded++;
      this.stats.loadTime += loadTime;
      
      return component;
    }

    throw new Error(`No loader registered for: ${name}`);
  }

  preload(names) {
    return Promise.all(names.map(name => this.get(name)));
  }

  unload(name) {
    if (this.loaded.has(name)) {
      this.loaded.delete(name);
      return true;
    }
    return false;
  }

  getStats() {
    return {
      ...this.stats,
      avgLoadTime: this.stats.loadTime / this.stats.loaded,
      cacheHitRate: this.stats.cached / (this.stats.loaded + this.stats.cached)
    };
  }
}

/**
 * Resource Optimizer
 * Main optimization controller
 */
class ResourceOptimizer {
  constructor(config = {}) {
    this.config = {
      enableMemoryPool: config.enableMemoryPool !== false,
      enableSmartCache: config.enableSmartCache !== false,
      enableLazyLoading: config.enableLazyLoading !== false,
      enableBatching: config.enableBatching !== false,
      ...config
    };

    // Initialize components
    this.memoryPool = this.config.enableMemoryPool ? new MemoryPool() : null;
    this.cache = this.config.enableSmartCache ? new SmartCache() : null;
    this.monitor = new ResourceMonitor(config.limits);
    this.taskQueue = this.config.enableBatching ? new OptimizedTaskQueue() : null;
    this.lazyLoader = this.config.enableLazyLoading ? new LazyLoader() : null;

    // Optimization stats
    this.optimizations = {
      memoryReclaimed: 0,
      tasksOptimized: 0,
      cacheHits: 0
    };
  }

  /**
   * Get optimized object from pool
   */
  acquireObject() {
    if (this.memoryPool) {
      return this.memoryPool.acquire();
    }
    return {};
  }

  /**
   * Return object to pool
   */
  releaseObject(obj) {
    if (this.memoryPool) {
      this.memoryPool.release(obj);
    }
  }

  /**
   * Cache with automatic memory management
   */
  cacheGet(key) {
    if (this.cache) {
      const result = this.cache.get(key);
      if (result) this.optimizations.cacheHits++;
      return result;
    }
    return null;
  }

  cacheSet(key, value, size) {
    if (this.cache) {
      this.cache.set(key, value, size);
    }
  }

  /**
   * Execute task with resource monitoring
   */
  async executeOptimized(task) {
    // Check resources
    if (!this.monitor.checkMemory()) {
      // Try to free memory
      await this.optimizeMemory();
      
      // Recheck
      if (!this.monitor.checkMemory()) {
        throw new Error('Insufficient memory for task execution');
      }
    }

    // Acquire execution slot
    this.monitor.acquire();

    try {
      // Execute directly - batching is for background tasks
      const result = await (typeof task === 'function' ? task() : task);
      this.optimizations.tasksOptimized++;
      return result;
    } finally {
      this.monitor.release();
    }
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory() {
    const before = process.memoryUsage().heapUsed;

    // Clear caches
    if (this.cache) {
      this.cache.clear();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const after = process.memoryUsage().heapUsed;
    const reclaimed = before - after;
    this.optimizations.memoryReclaimed += reclaimed;

    return reclaimed;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const stats = {
      monitor: this.monitor.getStatus(),
      optimizations: this.optimizations
    };

    if (this.memoryPool) {
      stats.memoryPool = this.memoryPool.getStats();
    }

    if (this.cache) {
      stats.cache = this.cache.getStats();
    }

    if (this.taskQueue) {
      stats.taskQueue = this.taskQueue.getStats();
    }

    if (this.lazyLoader) {
      stats.lazyLoader = this.lazyLoader.getStats();
    }

    return stats;
  }

  /**
   * Display optimization dashboard
   */
  dashboard() {
    const stats = this.getStats();

    console.log('\n' + '='.repeat(60));
    console.log('🟢 RESOURCE OPTIMIZATION DASHBOARD');
    console.log('='.repeat(60));

    console.log('\n💾 Memory Status:');
    console.log(`   Usage: ${stats.monitor.memory.usage}`);
    console.log(`   Current: ${Math.round(stats.monitor.memory.current / 1024 / 1024)}MB`);
    console.log(`   Limit: ${Math.round(stats.monitor.memory.limit / 1024 / 1024)}MB`);
    console.log(`   Reclaimed: ${Math.round(this.optimizations.memoryReclaimed / 1024 / 1024)}MB`);

    if (stats.memoryPool) {
      console.log('\n🔄 Memory Pool:');
      console.log(`   Reuse Rate: ${(stats.memoryPool.reuseRate * 100).toFixed(1)}%`);
      console.log(`   Created: ${stats.memoryPool.created}`);
      console.log(`   Reused: ${stats.memoryPool.reused}`);
    }

    if (stats.cache) {
      console.log('\n📦 Smart Cache:');
      console.log(`   Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
      console.log(`   Size: ${stats.cache.size} items`);
      console.log(`   Memory: ${Math.round(stats.cache.memory / 1024)}KB`);
      console.log(`   Evictions: ${stats.cache.evictions}`);
    }

    if (stats.taskQueue) {
      console.log('\n📋 Task Queue:');
      console.log(`   Processed: ${stats.taskQueue.processed}`);
      console.log(`   Pending: ${stats.taskQueue.pending}`);
      console.log(`   Batch Efficiency: ${(stats.taskQueue.efficiency * 100).toFixed(1)}%`);
    }

    console.log('\n🏁 Optimizations Applied:');
    console.log(`   Tasks Optimized: ${this.optimizations.tasksOptimized}`);
    console.log(`   Cache Hits: ${this.optimizations.cacheHits}`);
    console.log(`   Health Status: ${stats.monitor.healthy ? '🏁 Healthy' : '🟠️ Warning'}`);

    console.log('='.repeat(60) + '\n');
  }
}

// Export classes
module.exports = {
  MemoryPool,
  SmartCache,
  ResourceMonitor,
  OptimizedTaskQueue,
  LazyLoader,
  ResourceOptimizer
};