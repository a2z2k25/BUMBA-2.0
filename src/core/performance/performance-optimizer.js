/**
 * BUMBA Performance Optimizer
 * Comprehensive performance profiling and optimization system
 */

const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const v8 = require('v8');
const { logger } = require('../logging/bumba-logger');

class PerformanceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      autoOptimize: config.autoOptimize !== false,
      profileInterval: config.profileInterval || 60000, // 1 minute
      memoryThreshold: config.memoryThreshold || 400 * 1024 * 1024, // 400MB
      cpuThreshold: config.cpuThreshold || 80, // 80%
      gcThreshold: config.gcThreshold || 300 * 1024 * 1024, // 300MB
      ...config
    };
    
    // Metrics storage
    this.metrics = {
      memory: [],
      cpu: [],
      operations: new Map(),
      gc: [],
      cache: {
        hits: 0,
        misses: 0,
        evictions: 0
      }
    };
    
    // Performance marks
    this.marks = new Map();
    this.measures = new Map();
    
    // Optimization state
    this.optimizations = {
      memoryOptimized: false,
      cacheOptimized: false,
      gcOptimized: false,
      lazyLoadingEnabled: false
    };
    
    // Start monitoring
    if (this.config.enabled) {
      this.startMonitoring();
    }
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Memory monitoring
    this.memoryInterval = setInterval(() => {
      this.profileMemory();
    }, this.config.profileInterval);
    
    // CPU monitoring
    this.cpuInterval = setInterval(() => {
      this.profileCPU();
    }, this.config.profileInterval);
    
    // GC monitoring
    if (global.gc) {
      this.gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.gc.push({
            type: entry.name,
            duration: entry.duration,
            timestamp: Date.now()
          });
        });
      });
      this.gcObserver.observe({ entryTypes: ['gc'] });
    }
    
    logger.info('🟢 Performance monitoring started');
  }
  
  /**
   * Profile memory usage
   */
  profileMemory() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    const profile = {
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      heapSizeLimit: heapStats.heap_size_limit,
      mallocedMemory: heapStats.malloced_memory,
      peakMallocedMemory: heapStats.peak_malloced_memory,
      percentUsed: (memUsage.heapUsed / heapStats.heap_size_limit) * 100
    };
    
    this.metrics.memory.push(profile);
    
    // Keep only last 100 samples
    if (this.metrics.memory.length > 100) {
      this.metrics.memory.shift();
    }
    
    // Check if optimization needed
    if (memUsage.heapUsed > this.config.memoryThreshold && this.config.autoOptimize) {
      this.optimizeMemory();
    }
    
    return profile;
  }
  
  /**
   * Profile CPU usage
   */
  profileCPU() {
    const startUsage = process.cpuUsage();
    
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalTime = (endUsage.user + endUsage.system) / 1000; // Convert to ms
      
      const profile = {
        timestamp: Date.now(),
        user: endUsage.user / 1000,
        system: endUsage.system / 1000,
        total: totalTime,
        percentage: (totalTime / 100) * 100 // Rough percentage
      };
      
      this.metrics.cpu.push(profile);
      
      // Keep only last 100 samples
      if (this.metrics.cpu.length > 100) {
        this.metrics.cpu.shift();
      }
      
      // Check if optimization needed
      if (profile.percentage > this.config.cpuThreshold && this.config.autoOptimize) {
        this.optimizeCPU();
      }
    }, 100);
  }
  
  /**
   * Mark performance point
   */
  mark(name) {
    this.marks.set(name, performance.now());
  }
  
  /**
   * Measure between marks
   */
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      logger.warn(`Performance mark '${startMark}' not found`);
      return null;
    }
    
    const duration = end - start;
    
    const measure = {
      name,
      start,
      end,
      duration,
      timestamp: Date.now()
    };
    
    // Store measure
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name).push(measure);
    
    // Track operation
    this.trackOperation(name, duration);
    
    return measure;
  }
  
  /**
   * Track operation performance
   */
  trackOperation(name, duration) {
    if (!this.metrics.operations.has(name)) {
      this.metrics.operations.set(name, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      });
    }
    
    const op = this.metrics.operations.get(name);
    op.count++;
    op.totalTime += duration;
    op.minTime = Math.min(op.minTime, duration);
    op.maxTime = Math.max(op.maxTime, duration);
    op.avgTime = op.totalTime / op.count;
  }
  
  /**
   * Optimize memory usage
   */
  async optimizeMemory() {
    if (this.optimizations.memoryOptimized) {
      return; // Already optimizing
    }
    
    this.optimizations.memoryOptimized = true;
    logger.info('🧹 Optimizing memory usage...');
    
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Clear caches
      this.clearCaches();
      
      // Emit optimization event
      this.emit('optimization:memory', {
        before: this.metrics.memory[this.metrics.memory.length - 1],
        timestamp: Date.now()
      });
      
      // Re-profile after optimization
      setTimeout(() => {
        const after = this.profileMemory();
        logger.info(`💾 Memory optimized: ${this.formatBytes(after.heapUsed)}`);
        this.optimizations.memoryOptimized = false;
      }, 1000);
      
    } catch (error) {
      logger.error('Memory optimization failed:', error);
      this.optimizations.memoryOptimized = false;
    }
  }
  
  /**
   * Optimize CPU usage
   */
  async optimizeCPU() {
    if (this.optimizations.cpuOptimized) {
      return;
    }
    
    this.optimizations.cpuOptimized = true;
    logger.info('🟢 Optimizing CPU usage...');
    
    try {
      // Enable lazy loading
      this.enableLazyLoading();
      
      // Reduce concurrent operations
      this.reduceConcurrency();
      
      // Emit optimization event
      this.emit('optimization:cpu', {
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        logger.info('🟢 CPU optimization complete');
        this.optimizations.cpuOptimized = false;
      }, 5000);
      
    } catch (error) {
      logger.error('CPU optimization failed:', error);
      this.optimizations.cpuOptimized = false;
    }
  }
  
  /**
   * Clear caches to free memory
   */
  clearCaches() {
    // Clear module cache selectively
    const cacheKeys = Object.keys(require.cache);
    let cleared = 0;
    
    cacheKeys.forEach(key => {
      // Only clear non-essential modules
      if (key.includes('node_modules') && !key.includes('express') && !key.includes('core')) {
        delete require.cache[key];
        cleared++;
      }
    });
    
    this.metrics.cache.evictions += cleared;
    logger.debug(`🗑️ Cleared ${cleared} cached modules`);
  }
  
  /**
   * Enable lazy loading
   */
  enableLazyLoading() {
    if (!this.optimizations.lazyLoadingEnabled) {
      this.optimizations.lazyLoadingEnabled = true;
      this.emit('optimization:lazyLoading', { enabled: true });
      logger.info('💤 Lazy loading enabled');
    }
  }
  
  /**
   * Reduce concurrency
   */
  reduceConcurrency() {
    this.emit('optimization:concurrency', { 
      action: 'reduce',
      reason: 'high_cpu_usage' 
    });
  }
  
  /**
   * Get performance report
   */
  getReport() {
    const memoryStats = this.calculateStats(this.metrics.memory.map(m => m.heapUsed));
    const cpuStats = this.calculateStats(this.metrics.cpu.map(c => c.total));
    
    // Get top operations by time
    const topOperations = Array.from(this.metrics.operations.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
    
    return {
      summary: {
        uptime: process.uptime(),
        currentMemory: this.formatBytes(process.memoryUsage().heapUsed),
        memoryLimit: this.formatBytes(v8.getHeapStatistics().heap_size_limit),
        optimizationsApplied: Object.values(this.optimizations).filter(v => v).length
      },
      memory: {
        current: this.metrics.memory[this.metrics.memory.length - 1],
        stats: memoryStats,
        trend: this.calculateTrend(this.metrics.memory.map(m => m.heapUsed))
      },
      cpu: {
        current: this.metrics.cpu[this.metrics.cpu.length - 1],
        stats: cpuStats,
        trend: this.calculateTrend(this.metrics.cpu.map(c => c.total))
      },
      operations: {
        total: this.metrics.operations.size,
        top: topOperations
      },
      cache: this.metrics.cache,
      gc: {
        collections: this.metrics.gc.length,
        totalTime: this.metrics.gc.reduce((sum, gc) => sum + gc.duration, 0),
        lastCollection: this.metrics.gc[this.metrics.gc.length - 1]
      },
      optimizations: this.optimizations
    };
  }
  
  /**
   * Calculate statistics
   */
  calculateStats(values) {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  /**
   * Calculate trend
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-10);
    const older = values.slice(-20, -10);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Format bytes
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    if (this.cpuInterval) {
      clearInterval(this.cpuInterval);
    }
    
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }
    
    logger.info('🔴 Performance monitoring stopped');
  }
  
  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      measures: Array.from(this.measures.entries()),
      optimizations: this.optimizations,
      report: this.getReport()
    };
  }
}

// Singleton instance
let instance = null;

function getInstance(config) {
  if (!instance) {
    instance = new PerformanceOptimizer(config);
  }
  return instance;
}

module.exports = {
  PerformanceOptimizer,
  getInstance,
  
  // Convenience methods
  mark: (name) => getInstance().mark(name),
  measure: (name, start, end) => getInstance().measure(name, start, end),
  getReport: () => getInstance().getReport(),
  optimize: () => {
    const instance = getInstance();
    instance.optimizeMemory();
    instance.optimizeCPU();
  }
};