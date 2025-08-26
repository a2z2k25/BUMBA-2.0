/**
 * Memory Optimizer
 * Automatic memory optimization and garbage collection tuning
 * Sprint 33-36 - Performance Optimization
 */

const v8 = require('v8');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');

class MemoryOptimizer {
  constructor(options = {}) {
    this.options = {
      targetHeapUsage: options.targetHeapUsage || 0.7, // 70% of max
      gcThreshold: options.gcThreshold || 0.8, // 80% triggers GC
      compactionThreshold: options.compactionThreshold || 0.9, // 90% triggers compaction
      monitorInterval: options.monitorInterval || 5000, // 5 seconds
      enableAutoGC: options.enableAutoGC !== false,
      enableCompaction: options.enableCompaction !== false,
      enableObjectPooling: options.enableObjectPooling !== false
    };
    
    // Object pools
    this.objectPools = new Map();
    
    // Memory tracking
    this.memoryHistory = [];
    this.leakCandidates = new Map();
    
    // Weak references for cleanup
    this.weakRefs = new Map();
    this.finalizationRegistry = new FinalizationRegistry((heldValue) => {
      this.handleFinalization(heldValue);
    });
    
    // Timers
    this.timers = new ComponentTimers('memory-optimizer');
    
    // Statistics
    this.stats = {
      gcRuns: 0,
      compactionRuns: 0,
      objectsPooled: 0,
      objectsRecycled: 0,
      memoryReclaimed: 0
    };
    
    // Start monitoring
    this.startMonitoring();
    
    // Register with state manager
    stateManager.register('memoryOptimizer', {
      stats: this.stats,
      currentUsage: {}
    });
  }
  
  /**
   * Start memory monitoring
   */
  startMonitoring() {
    this.timers.setInterval('monitor', () => {
      this.monitorMemory();
    }, this.options.monitorInterval);
  }
  
  /**
   * Monitor memory usage
   */
  monitorMemory() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    const heapUsedPercent = heapStats.used_heap_size / heapStats.heap_size_limit;
    
    // Store history
    this.memoryHistory.push({
      timestamp: Date.now(),
      heapUsed: heapStats.used_heap_size,
      heapTotal: heapStats.total_heap_size,
      heapPercent: heapUsedPercent,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    });
    
    // Limit history
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
    
    // Check thresholds
    if (heapUsedPercent > this.options.compactionThreshold) {
      this.performCompaction();
    } else if (heapUsedPercent > this.options.gcThreshold) {
      this.performGC();
    }
    
    // Detect leaks
    this.detectLeaks();
    
    // Update state
    this.updateState(heapStats);
  }
  
  /**
   * Perform garbage collection
   */
  performGC() {
    if (!this.options.enableAutoGC) return;
    
    const before = v8.getHeapStatistics().used_heap_size;
    
    if (global.gc) {
      global.gc();
      this.stats.gcRuns++;
      
      const after = v8.getHeapStatistics().used_heap_size;
      const reclaimed = before - after;
      
      if (reclaimed > 0) {
        this.stats.memoryReclaimed += reclaimed;
        logger.info(`GC reclaimed ${(reclaimed / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }
  
  /**
   * Perform heap compaction
   */
  performCompaction() {
    if (!this.options.enableCompaction) return;
    
    const before = v8.getHeapStatistics().used_heap_size;
    
    // Write heap snapshot to trigger compaction
    const stream = v8.getHeapSnapshot();
    let chunks = '';
    
    stream.on('data', (chunk) => {
      chunks += chunk;
    });
    
    stream.on('end', () => {
      // Snapshot complete, memory should be compacted
      const after = v8.getHeapStatistics().used_heap_size;
      const reclaimed = before - after;
      
      if (reclaimed > 0) {
        this.stats.memoryReclaimed += reclaimed;
        this.stats.compactionRuns++;
        logger.info(`Compaction reclaimed ${(reclaimed / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  }
  
  /**
   * Detect memory leaks
   */
  detectLeaks() {
    if (this.memoryHistory.length < 10) return;
    
    // Check for consistent growth
    const recent = this.memoryHistory.slice(-10);
    let isGrowing = true;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].heapUsed <= recent[i-1].heapUsed) {
        isGrowing = false;
        break;
      }
    }
    
    if (isGrowing) {
      const growth = recent[recent.length-1].heapUsed - recent[0].heapUsed;
      const growthRate = growth / (recent[recent.length-1].timestamp - recent[0].timestamp) * 1000; // per second
      
      if (growthRate > 1024 * 1024) { // 1MB/s
        logger.warn(`Potential memory leak detected: ${(growthRate / 1024 / 1024).toFixed(2)}MB/s growth`);
        
        // Take heap snapshot for analysis
        this.takeHeapSnapshot();
      }
    }
  }
  
  /**
   * Take heap snapshot for analysis
   */
  takeHeapSnapshot() {
    const snapshot = v8.getHeapSnapshot();
    const chunks = [];
    
    snapshot.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    snapshot.on('end', () => {
      const data = chunks.join('');
      this.analyzeHeapSnapshot(JSON.parse(data));
    });
  }
  
  /**
   * Analyze heap snapshot
   */
  analyzeHeapSnapshot(snapshot) {
    // Find large objects
    const largeObjects = [];
    const threshold = 1024 * 1024; // 1MB
    
    if (snapshot.nodes) {
      for (const node of snapshot.nodes) {
        if (node.size > threshold) {
          largeObjects.push({
            type: node.type,
            name: node.name,
            size: node.size
          });
        }
      }
    }
    
    if (largeObjects.length > 0) {
      logger.warn('Large objects in heap:', largeObjects.slice(0, 10));
    }
  }
  
  /**
   * Create object pool
   */
  createObjectPool(name, factory, options = {}) {
    const pool = new ObjectPool(factory, {
      maxSize: options.maxSize || 100,
      minSize: options.minSize || 10,
      ...options
    });
    
    this.objectPools.set(name, pool);
    
    return pool;
  }
  
  /**
   * Get object from pool
   */
  getFromPool(name) {
    const pool = this.objectPools.get(name);
    if (!pool) {
      throw new Error(`Object pool not found: ${name}`);
    }
    
    const obj = pool.acquire();
    this.stats.objectsPooled++;
    
    return obj;
  }
  
  /**
   * Return object to pool
   */
  returnToPool(name, obj) {
    const pool = this.objectPools.get(name);
    if (!pool) {
      throw new Error(`Object pool not found: ${name}`);
    }
    
    pool.release(obj);
    this.stats.objectsRecycled++;
  }
  
  /**
   * Create weak reference
   */
  createWeakRef(key, object) {
    const ref = new WeakRef(object);
    this.weakRefs.set(key, ref);
    
    // Register for finalization callback
    this.finalizationRegistry.register(object, key);
    
    return ref;
  }
  
  /**
   * Get weak reference
   */
  getWeakRef(key) {
    const ref = this.weakRefs.get(key);
    if (!ref) return null;
    
    const obj = ref.deref();
    if (!obj) {
      // Object was garbage collected
      this.weakRefs.delete(key);
      return null;
    }
    
    return obj;
  }
  
  /**
   * Handle finalization
   */
  handleFinalization(key) {
    this.weakRefs.delete(key);
    logger.debug(`Object finalized: ${key}`);
  }
  
  /**
   * Optimize buffer allocation
   */
  allocateBuffer(size) {
    // Use buffer pool for common sizes
    const roundedSize = Math.pow(2, Math.ceil(Math.log2(size)));
    const poolName = `buffer_${roundedSize}`;
    
    if (!this.objectPools.has(poolName)) {
      this.createObjectPool(poolName, () => Buffer.allocUnsafe(roundedSize), {
        maxSize: 10,
        reset: (buf) => buf.fill(0)
      });
    }
    
    const buffer = this.getFromPool(poolName);
    
    // Return a slice if needed
    if (size < roundedSize) {
      return buffer.slice(0, size);
    }
    
    return buffer;
  }
  
  /**
   * Free buffer
   */
  freeBuffer(buffer) {
    const roundedSize = Math.pow(2, Math.ceil(Math.log2(buffer.length)));
    const poolName = `buffer_${roundedSize}`;
    
    if (this.objectPools.has(poolName)) {
      this.returnToPool(poolName, buffer);
    }
  }
  
  /**
   * Get memory report
   */
  getReport() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    return {
      current: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
        arrayBuffers: `${(memUsage.arrayBuffers / 1024 / 1024).toFixed(2)}MB`
      },
      heap: {
        limit: `${(heapStats.heap_size_limit / 1024 / 1024).toFixed(2)}MB`,
        usage: `${(heapStats.used_heap_size / heapStats.heap_size_limit * 100).toFixed(2)}%`
      },
      optimization: {
        gcRuns: this.stats.gcRuns,
        compactionRuns: this.stats.compactionRuns,
        memoryReclaimed: `${(this.stats.memoryReclaimed / 1024 / 1024).toFixed(2)}MB`
      },
      pooling: {
        pools: this.objectPools.size,
        objectsPooled: this.stats.objectsPooled,
        objectsRecycled: this.stats.objectsRecycled
      },
      weakRefs: this.weakRefs.size
    };
  }
  
  /**
   * Update state
   */
  updateState(heapStats) {
    stateManager.set('memoryOptimizer', 'stats', this.stats);
    stateManager.set('memoryOptimizer', 'currentUsage', {
      heapUsed: heapStats.used_heap_size,
      heapLimit: heapStats.heap_size_limit,
      percentage: (heapStats.used_heap_size / heapStats.heap_size_limit * 100).toFixed(2)
    });
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    this.timers.clearAll();
    
    // Clear object pools
    for (const [, pool] of this.objectPools) {
      pool.clear();
    }
    this.objectPools.clear();
    
    // Clear weak refs
    this.weakRefs.clear();
  }
}

/**
 * Object Pool Implementation
 */
class ObjectPool {
  constructor(factory, options = {}) {
    this.factory = factory;
    this.options = {
      maxSize: options.maxSize || 100,
      minSize: options.minSize || 0,
      reset: options.reset || (() => {}),
      validate: options.validate || (() => true)
    };
    
    this.available = [];
    this.inUse = new Set();
    
    // Pre-populate pool
    for (let i = 0; i < this.options.minSize; i++) {
      this.available.push(this.factory());
    }
  }
  
  acquire() {
    let obj;
    
    if (this.available.length > 0) {
      obj = this.available.pop();
      
      if (!this.options.validate(obj)) {
        obj = this.factory();
      }
    } else {
      obj = this.factory();
    }
    
    this.inUse.add(obj);
    return obj;
  }
  
  release(obj) {
    if (!this.inUse.has(obj)) {
      return false;
    }
    
    this.inUse.delete(obj);
    
    if (this.available.length < this.options.maxSize) {
      this.options.reset(obj);
      this.available.push(obj);
    }
    
    return true;
  }
  
  clear() {
    this.available = [];
    this.inUse.clear();
  }
  
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}

// Singleton instance
let instance = null;

function getMemoryOptimizer(options) {
  if (!instance) {
    instance = new MemoryOptimizer(options);
  }
  return instance;
}

module.exports = {
  MemoryOptimizer,
  ObjectPool,
  getMemoryOptimizer,
  memoryOptimizer: getMemoryOptimizer()
};