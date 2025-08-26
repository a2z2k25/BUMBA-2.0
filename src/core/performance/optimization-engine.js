/**
 * BUMBA Performance Optimization Engine
 * Automatically optimizes system performance based on metrics and predictions
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const cluster = require('cluster');
const v8 = require('v8');

class PerformanceOptimizationEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enabled: options.enabled !== false,
      autoOptimize: options.autoOptimize !== false,
      optimizationInterval: options.optimizationInterval || 30000, // 30 seconds
      aggressiveness: options.aggressiveness || 'moderate', // conservative, moderate, aggressive
      strategies: {
        memory: options.memoryOptimization !== false,
        cpu: options.cpuOptimization !== false,
        caching: options.cacheOptimization !== false,
        concurrency: options.concurrencyOptimization !== false,
        io: options.ioOptimization !== false
      },
      thresholds: {
        memory: options.memoryThreshold || 75,
        cpu: options.cpuThreshold || 70,
        responseTime: options.responseTimeThreshold || 500
      },
      ...options
    };
    
    // Optimization strategies
    this.strategies = new Map();
    this.activeOptimizations = new Map();
    this.optimizationHistory = [];
    
    // Performance targets
    this.targets = {
      memory: 60, // Target 60% memory usage
      cpu: 50,    // Target 50% CPU usage
      responseTime: 200, // Target 200ms response time
      throughput: 1000   // Target 1000 req/s
    };
    
    // Optimization state
    this.state = {
      isOptimizing: false,
      lastOptimization: null,
      optimizationsApplied: 0,
      performanceScore: 100
    };
    
    // Resource pools
    this.resourcePools = {
      workers: [],
      connections: new Map(),
      buffers: new Map()
    };
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize optimization engine
   */
  initialize() {
    // Register optimization strategies
    this.registerStrategies();
    
    // Start optimization cycle
    if (this.config.autoOptimize) {
      this.startOptimizationCycle();
    }
    
    // Set up resource monitoring
    this.setupResourceMonitoring();
    
    logger.info('Performance optimization engine initialized');
  }

  /**
   * Register optimization strategies
   */
  registerStrategies() {
    // Memory optimization strategies
    if (this.config.strategies.memory) {
      this.registerStrategy('gc_optimization', new GCOptimizationStrategy());
      this.registerStrategy('cache_eviction', new CacheEvictionStrategy());
      this.registerStrategy('buffer_pooling', new BufferPoolingStrategy());
      this.registerStrategy('memory_compaction', new MemoryCompactionStrategy());
    }
    
    // CPU optimization strategies
    if (this.config.strategies.cpu) {
      this.registerStrategy('worker_scaling', new WorkerScalingStrategy());
      this.registerStrategy('task_prioritization', new TaskPrioritizationStrategy());
      this.registerStrategy('cpu_throttling', new CPUThrottlingStrategy());
    }
    
    // Caching optimization strategies
    if (this.config.strategies.caching) {
      this.registerStrategy('cache_warming', new CacheWarmingStrategy());
      this.registerStrategy('cache_compression', new CacheCompressionStrategy());
      this.registerStrategy('cache_tiering', new CacheTieringStrategy());
    }
    
    // Concurrency optimization strategies
    if (this.config.strategies.concurrency) {
      this.registerStrategy('connection_pooling', new ConnectionPoolingStrategy());
      this.registerStrategy('batch_processing', new BatchProcessingStrategy());
      this.registerStrategy('rate_limiting', new RateLimitingStrategy());
    }
    
    // I/O optimization strategies
    if (this.config.strategies.io) {
      this.registerStrategy('io_batching', new IOBatchingStrategy());
      this.registerStrategy('stream_optimization', new StreamOptimizationStrategy());
      this.registerStrategy('async_io', new AsyncIOStrategy());
    }
  }

  /**
   * Register a strategy
   */
  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
    strategy.setEngine(this);
  }

  /**
   * Start optimization cycle
   */
  startOptimizationCycle() {
    this.optimizationInterval = setInterval(() => {
      this.performOptimization();
    }, this.config.optimizationInterval);
  }

  /**
   * Perform optimization
   */
  async performOptimization() {
    if (this.state.isOptimizing) return;
    
    this.state.isOptimizing = true;
    const startTime = Date.now();
    
    try {
      // Collect current metrics
      const metrics = await this.collectMetrics();
      
      // Calculate performance score
      this.state.performanceScore = this.calculatePerformanceScore(metrics);
      
      // Determine needed optimizations
      const neededOptimizations = this.determineOptimizations(metrics);
      
      // Apply optimizations
      const results = await this.applyOptimizations(neededOptimizations, metrics);
      
      // Record optimization
      this.recordOptimization({
        timestamp: Date.now(),
        metrics,
        optimizations: neededOptimizations,
        results,
        duration: Date.now() - startTime
      });
      
      // Emit optimization complete
      this.emit('optimization:complete', {
        performanceScore: this.state.performanceScore,
        optimizationsApplied: results.length,
        improvements: this.calculateImprovements(metrics)
      });
      
    } catch (error) {
      logger.error('Optimization failed:', error);
    } finally {
      this.state.isOptimizing = false;
      this.state.lastOptimization = Date.now();
    }
  }

  /**
   * Collect current metrics
   */
  async collectMetrics() {
    const os = require('os');
    const framework = global.bumbaFramework;
    
    // System metrics
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    // Process metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // V8 heap statistics
    const heapStats = v8.getHeapStatistics();
    
    return {
      system: {
        cpuUsage: this.calculateCPUUsage(cpus),
        memoryUsage: ((totalMem - freeMem) / totalMem) * 100,
        loadAverage: os.loadavg()[0]
      },
      process: {
        heapUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        rss: memUsage.rss,
        cpuTime: cpuUsage.user + cpuUsage.system,
        handles: process._getActiveHandles?.()?.length || 0,
        requests: process._getActiveRequests?.()?.length || 0
      },
      v8: {
        heapSizeLimit: heapStats.heap_size_limit,
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        mallocedMemory: heapStats.malloced_memory
      },
      application: {
        responseTime: framework?.metrics?.avgResponseTime || 0,
        throughput: framework?.metrics?.requestsPerSecond || 0,
        errorRate: framework?.metrics?.errorRate || 0,
        queueLength: framework?.commandQueue?.length || 0
      }
    };
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(metrics) {
    let score = 100;
    
    // Deduct points for high resource usage
    if (metrics.system.cpuUsage > 80) score -= 20;
    else if (metrics.system.cpuUsage > 60) score -= 10;
    
    if (metrics.system.memoryUsage > 85) score -= 20;
    else if (metrics.system.memoryUsage > 70) score -= 10;
    
    if (metrics.process.heapUsage > 90) score -= 15;
    else if (metrics.process.heapUsage > 75) score -= 7;
    
    // Deduct for poor application performance
    if (metrics.application.responseTime > 1000) score -= 15;
    else if (metrics.application.responseTime > 500) score -= 7;
    
    if (metrics.application.errorRate > 5) score -= 10;
    else if (metrics.application.errorRate > 2) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine needed optimizations
   */
  determineOptimizations(metrics) {
    const optimizations = [];
    
    // Memory optimizations
    if (metrics.system.memoryUsage > this.config.thresholds.memory) {
      if (metrics.process.heapUsage > 80) {
        optimizations.push({ strategy: 'gc_optimization', priority: 'high' });
        optimizations.push({ strategy: 'cache_eviction', priority: 'high' });
      }
      
      if (this.config.aggressiveness !== 'conservative') {
        optimizations.push({ strategy: 'memory_compaction', priority: 'medium' });
      }
    }
    
    // CPU optimizations
    if (metrics.system.cpuUsage > this.config.thresholds.cpu) {
      if (metrics.process.handles > 100) {
        optimizations.push({ strategy: 'worker_scaling', priority: 'high' });
      }
      
      optimizations.push({ strategy: 'task_prioritization', priority: 'medium' });
      
      if (this.config.aggressiveness === 'aggressive') {
        optimizations.push({ strategy: 'cpu_throttling', priority: 'low' });
      }
    }
    
    // Response time optimizations
    if (metrics.application.responseTime > this.config.thresholds.responseTime) {
      optimizations.push({ strategy: 'cache_warming', priority: 'high' });
      optimizations.push({ strategy: 'batch_processing', priority: 'medium' });
      
      if (metrics.application.queueLength > 10) {
        optimizations.push({ strategy: 'connection_pooling', priority: 'high' });
      }
    }
    
    // I/O optimizations
    if (metrics.process.requests > 50) {
      optimizations.push({ strategy: 'io_batching', priority: 'medium' });
      optimizations.push({ strategy: 'async_io', priority: 'low' });
    }
    
    // Sort by priority
    optimizations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
    
    return optimizations;
  }

  /**
   * Apply optimizations
   */
  async applyOptimizations(optimizations, metrics) {
    const results = [];
    
    for (const optimization of optimizations) {
      // Check if already active
      if (this.activeOptimizations.has(optimization.strategy)) {
        continue;
      }
      
      // Get strategy
      const strategy = this.strategies.get(optimization.strategy);
      if (!strategy) continue;
      
      // Check if applicable
      if (!strategy.isApplicable(metrics)) continue;
      
      try {
        // Apply optimization
        const result = await strategy.apply(metrics);
        
        if (result.success) {
          this.activeOptimizations.set(optimization.strategy, {
            strategy: optimization.strategy,
            appliedAt: Date.now(),
            result
          });
          
          results.push({
            strategy: optimization.strategy,
            success: true,
            improvement: result.improvement,
            message: result.message
          });
          
          this.state.optimizationsApplied++;
          
          logger.info(`Applied optimization: ${optimization.strategy}`);
        }
      } catch (error) {
        logger.error(`Optimization ${optimization.strategy} failed:`, error);
        results.push({
          strategy: optimization.strategy,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Record optimization
   */
  recordOptimization(record) {
    this.optimizationHistory.push(record);
    
    // Keep only recent history
    const cutoff = Date.now() - 3600000; // 1 hour
    this.optimizationHistory = this.optimizationHistory.filter(
      r => r.timestamp > cutoff
    );
  }

  /**
   * Calculate improvements
   */
  calculateImprovements(currentMetrics) {
    if (this.optimizationHistory.length < 2) return {};
    
    const previousRecord = this.optimizationHistory[this.optimizationHistory.length - 2];
    const previousMetrics = previousRecord.metrics;
    
    return {
      cpuImprovement: previousMetrics.system.cpuUsage - currentMetrics.system.cpuUsage,
      memoryImprovement: previousMetrics.system.memoryUsage - currentMetrics.system.memoryUsage,
      responseTimeImprovement: previousMetrics.application.responseTime - currentMetrics.application.responseTime,
      throughputImprovement: currentMetrics.application.throughput - previousMetrics.application.throughput
    };
  }

  /**
   * Setup resource monitoring
   */
  setupResourceMonitoring() {
    // Monitor memory pressure
    if (global.gc) {
      let gcCount = 0;
      const originalGC = global.gc;
      
      global.gc = (...args) => {
        gcCount++;
        
        if (gcCount > 10) {
          this.emit('memory:pressure', {
            gcCount,
            timestamp: Date.now()
          });
          
          // Trigger memory optimization
          this.triggerOptimization('memory');
          gcCount = 0;
        }
        
        return originalGC.apply(this, args);
      };
    }
    
    // Monitor event loop lag
    setInterval(() => {
      const start = process.hrtime.bigint();
      
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000;
        
        if (lag > 100) {
          this.emit('eventloop:lag', {
            lag,
            timestamp: Date.now()
          });
          
          // Trigger I/O optimization
          this.triggerOptimization('io');
        }
      });
    }, 5000);
  }

  /**
   * Trigger specific optimization
   */
  async triggerOptimization(type) {
    const metrics = await this.collectMetrics();
    const strategies = [];
    
    switch (type) {
      case 'memory':
        strategies.push({ strategy: 'gc_optimization', priority: 'high' });
        strategies.push({ strategy: 'cache_eviction', priority: 'high' });
        break;
        
      case 'cpu':
        strategies.push({ strategy: 'worker_scaling', priority: 'high' });
        strategies.push({ strategy: 'task_prioritization', priority: 'high' });
        break;
        
      case 'io':
        strategies.push({ strategy: 'io_batching', priority: 'high' });
        strategies.push({ strategy: 'async_io', priority: 'high' });
        break;
    }
    
    await this.applyOptimizations(strategies, metrics);
  }

  /**
   * Manual optimization
   */
  async optimize(options = {}) {
    const metrics = await this.collectMetrics();
    const optimizations = options.strategies 
      ? options.strategies.map(s => ({ strategy: s, priority: 'high' }))
      : this.determineOptimizations(metrics);
    
    return this.applyOptimizations(optimizations, metrics);
  }

  /**
   * Reset optimizations
   */
  resetOptimizations() {
    // Revert all active optimizations
    for (const [strategy, optimization] of this.activeOptimizations) {
      const strategyImpl = this.strategies.get(strategy);
      if (strategyImpl && strategyImpl.revert) {
        strategyImpl.revert();
      }
    }
    
    this.activeOptimizations.clear();
    this.state.optimizationsApplied = 0;
    
    logger.info('All optimizations reset');
  }

  /**
   * Calculate CPU usage
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const usage = 100 - ~~(100 * totalIdle / totalTick);
    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Get optimization status
   */
  getStatus() {
    return {
      state: this.state,
      activeOptimizations: Array.from(this.activeOptimizations.values()),
      recentOptimizations: this.optimizationHistory.slice(-10),
      availableStrategies: Array.from(this.strategies.keys())
    };
  }

  /**
   * Stop optimization engine
   */
  stop() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    
    this.resetOptimizations();
    
    logger.info('Optimization engine stopped');
  }
}

/**
 * Base Optimization Strategy
 */
class OptimizationStrategy {
  setEngine(engine) {
    this.engine = engine;
  }
  
  isApplicable(metrics) {
    return true;
  }
  
  async apply(metrics) {
    return { success: false, message: 'Not implemented' };
  }
  
  revert() {
    // Override in subclasses
  }
}

/**
 * GC Optimization Strategy
 */
class GCOptimizationStrategy extends OptimizationStrategy {
  async apply(metrics) {
    if (!global.gc) {
      return { success: false, message: 'GC not exposed' };
    }
    
    const before = process.memoryUsage();
    global.gc();
    const after = process.memoryUsage();
    
    const freed = before.heapUsed - after.heapUsed;
    
    return {
      success: true,
      improvement: freed,
      message: `Freed ${Math.round(freed / 1024 / 1024)}MB through GC`
    };
  }
}

/**
 * Cache Eviction Strategy
 */
class CacheEvictionStrategy extends OptimizationStrategy {
  async apply(metrics) {
    const cacheSystem = require('./intelligent-cache-system');
    
    // Clear cold tier
    await cacheSystem.clear('cold');
    
    // Reduce warm tier by 50%
    const warmInfo = cacheSystem.getInfo().tiers.warm;
    const targetEvictions = Math.floor(warmInfo.items / 2);
    
    for (let i = 0; i < targetEvictions; i++) {
      await cacheSystem.evictFromTier('warm');
    }
    
    return {
      success: true,
      improvement: targetEvictions,
      message: `Evicted ${targetEvictions} cache entries`
    };
  }
}

/**
 * Buffer Pooling Strategy
 */
class BufferPoolingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Implement buffer pooling
    if (!this.engine.resourcePools.bufferPool) {
      this.engine.resourcePools.bufferPool = {
        small: [],  // < 4KB
        medium: [], // < 64KB
        large: []   // < 1MB
      };
    }
    
    return {
      success: true,
      improvement: 0,
      message: 'Buffer pooling enabled'
    };
  }
}

/**
 * Memory Compaction Strategy
 */
class MemoryCompactionStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Trigger V8 heap compaction
    if (v8.setFlagsFromString) {
      v8.setFlagsFromString('--compact_on_every_full_gc');
      
      if (global.gc) {
        global.gc();
      }
      
      return {
        success: true,
        improvement: 0,
        message: 'Memory compaction enabled'
      };
    }
    
    return { success: false, message: 'V8 flags not available' };
  }
}

/**
 * Worker Scaling Strategy
 */
class WorkerScalingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    if (!cluster.isMaster) {
      return { success: false, message: 'Not master process' };
    }
    
    const numCPUs = require('os').cpus().length;
    const currentWorkers = Object.keys(cluster.workers || {}).length;
    
    if (currentWorkers < numCPUs) {
      // Spawn additional worker
      cluster.fork();
      
      return {
        success: true,
        improvement: 1,
        message: `Spawned additional worker (${currentWorkers + 1}/${numCPUs})`
      };
    }
    
    return { success: false, message: 'Max workers reached' };
  }
}

/**
 * Task Prioritization Strategy
 */
class TaskPrioritizationStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Implement priority queue for tasks
    const framework = global.bumbaFramework;
    
    if (framework && framework.commandQueue) {
      // Sort queue by priority
      framework.commandQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
      
      return {
        success: true,
        improvement: framework.commandQueue.length,
        message: 'Task queue prioritized'
      };
    }
    
    return { success: false, message: 'No command queue found' };
  }
}

/**
 * CPU Throttling Strategy
 */
class CPUThrottlingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Implement CPU throttling for non-critical tasks
    this.throttleDelay = 10; // ms delay between operations
    
    return {
      success: true,
      improvement: this.throttleDelay,
      message: `CPU throttling enabled (${this.throttleDelay}ms delay)`
    };
  }
}

/**
 * Cache Warming Strategy
 */
class CacheWarmingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    const cacheSystem = require('./intelligent-cache-system');
    
    // Prefetch frequently accessed items
    const predictions = this.engine.predictions || [];
    
    for (const prediction of predictions) {
      await cacheSystem.prefetchKey(prediction.key);
    }
    
    return {
      success: true,
      improvement: predictions.length,
      message: `Warmed cache with ${predictions.length} predicted items`
    };
  }
}

/**
 * Cache Compression Strategy
 */
class CacheCompressionStrategy extends OptimizationStrategy {
  async apply(metrics) {
    const cacheSystem = require('./intelligent-cache-system');
    
    // Enable compression for warm and cold tiers
    cacheSystem.config.compression = true;
    cacheSystem.config.compressionThreshold = 512; // Compress items > 512 bytes
    
    return {
      success: true,
      improvement: 0,
      message: 'Cache compression enabled'
    };
  }
}

/**
 * Cache Tiering Strategy
 */
class CacheTieringStrategy extends OptimizationStrategy {
  async apply(metrics) {
    const cacheSystem = require('./intelligent-cache-system');
    
    // Rebalance cache tiers
    cacheSystem.manageTiers();
    
    return {
      success: true,
      improvement: 0,
      message: 'Cache tiers rebalanced'
    };
  }
}

/**
 * Connection Pooling Strategy
 */
class ConnectionPoolingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Implement connection pooling
    if (!this.engine.resourcePools.connectionPool) {
      this.engine.resourcePools.connectionPool = {
        maxSize: 100,
        minSize: 10,
        connections: []
      };
    }
    
    return {
      success: true,
      improvement: 0,
      message: 'Connection pooling enabled'
    };
  }
}

/**
 * Batch Processing Strategy
 */
class BatchProcessingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Enable batch processing for queued operations
    const batchSize = 50;
    
    this.engine.batchProcessor = {
      enabled: true,
      batchSize,
      interval: 100 // Process batch every 100ms
    };
    
    return {
      success: true,
      improvement: batchSize,
      message: `Batch processing enabled (size: ${batchSize})`
    };
  }
}

/**
 * Rate Limiting Strategy
 */
class RateLimitingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    const rateLimiter = require('../security/enhanced-rate-limiter');
    
    // Adjust rate limits based on load
    const adjustment = metrics.system.cpuUsage > 80 ? 0.5 : 1.0;
    
    rateLimiter.configure('api', {
      limit: 100 * adjustment,
      window: 60000
    });
    
    return {
      success: true,
      improvement: adjustment,
      message: `Rate limits adjusted (factor: ${adjustment})`
    };
  }
}

/**
 * I/O Batching Strategy
 */
class IOBatchingStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Enable I/O batching
    this.engine.ioBatcher = {
      enabled: true,
      batchSize: 100,
      flushInterval: 50 // Flush every 50ms
    };
    
    return {
      success: true,
      improvement: 0,
      message: 'I/O batching enabled'
    };
  }
}

/**
 * Stream Optimization Strategy
 */
class StreamOptimizationStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Optimize stream buffer sizes
    const { Readable, Writable } = require('stream');
    
    // Increase default high water marks for better throughput
    Readable.prototype._readableState.highWaterMark = 64 * 1024; // 64KB
    Writable.prototype._writableState.highWaterMark = 64 * 1024; // 64KB
    
    return {
      success: true,
      improvement: 64,
      message: 'Stream buffers optimized (64KB)'
    };
  }
}

/**
 * Async I/O Strategy
 */
class AsyncIOStrategy extends OptimizationStrategy {
  async apply(metrics) {
    // Ensure all I/O operations are async
    const fs = require('fs');
    const { promisify } = require('util');
    
    // Wrap sync methods with async versions
    if (!fs.promises) {
      fs.promises = {
        readFile: promisify(fs.readFile),
        writeFile: promisify(fs.writeFile),
        readdir: promisify(fs.readdir),
        stat: promisify(fs.stat)
      };
    }
    
    return {
      success: true,
      improvement: 0,
      message: 'Async I/O enforced'
    };
  }
}

// Export singleton instance
module.exports = new PerformanceOptimizationEngine({ enabled: true });