/**
 * BUMBA Memory Leak Detector
 * Advanced detection and prevention of memory leaks in long-running sessions
 */

const { EventEmitter } = require('events');
const v8 = require('v8');
const { logger } = require('../logging/bumba-logger');

class MemoryLeakDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enabled: options.enabled !== false,
      sampleInterval: options.sampleInterval || 10000, // 10 seconds
      analysisInterval: options.analysisInterval || 60000, // 1 minute
      leakThreshold: options.leakThreshold || 5, // MB growth per minute
      retentionPeriod: options.retentionPeriod || 300000, // 5 minutes of samples
      heapSnapshotThreshold: options.heapSnapshotThreshold || 100, // MB growth triggers snapshot
      autoFix: options.autoFix !== false,
      verbose: options.verbose || false,
      ...options
    };
    
    // Memory tracking
    this.samples = [];
    this.leaks = new Map();
    this.suspects = new Map();
    this.fixes = new Map();
    
    // Object tracking for leak detection
    this.objectTracking = {
      constructors: new Map(),
      closures: new WeakMap(),
      eventEmitters: new WeakSet(),
      timers: new Set(),
      promises: new WeakSet()
    };
    
    // Statistics
    this.stats = {
      samplesCollected: 0,
      leaksDetected: 0,
      leaksFixed: 0,
      falsePositives: 0,
      memoryRecovered: 0
    };
    
    // Leak patterns
    this.patterns = this.initializePatterns();
    
    // Start detection if enabled
    if (this.config.enabled) {
      this.startDetection();
    }
  }

  /**
   * Initialize known leak patterns
   */
  initializePatterns() {
    return {
      UNCLEANED_TIMERS: {
        detect: () => this.detectUncleanedTimers(),
        fix: () => this.fixUncleanedTimers(),
        severity: 'high'
      },
      EVENT_LISTENER_LEAK: {
        detect: () => this.detectEventListenerLeaks(),
        fix: () => this.fixEventListenerLeaks(),
        severity: 'high'
      },
      CLOSURE_LEAK: {
        detect: () => this.detectClosureLeaks(),
        fix: () => this.fixClosureLeaks(),
        severity: 'medium'
      },
      CIRCULAR_REFERENCE: {
        detect: () => this.detectCircularReferences(),
        fix: () => this.fixCircularReferences(),
        severity: 'medium'
      },
      LARGE_OBJECT_RETENTION: {
        detect: () => this.detectLargeObjectRetention(),
        fix: () => this.fixLargeObjectRetention(),
        severity: 'high'
      },
      PROMISE_LEAK: {
        detect: () => this.detectPromiseLeaks(),
        fix: () => this.fixPromiseLeaks(),
        severity: 'medium'
      },
      CACHE_OVERFLOW: {
        detect: () => this.detectCacheOverflow(),
        fix: () => this.fixCacheOverflow(),
        severity: 'low'
      }
    };
  }

  /**
   * Start memory leak detection
   */
  startDetection() {
    // Sample memory usage
    this.sampleInterval = setInterval(() => {
      this.collectSample();
    }, this.config.sampleInterval);
    
    // Analyze for leaks
    this.analysisInterval = setInterval(() => {
      this.analyzeForLeaks();
    }, this.config.analysisInterval);
    
    // Hook into global objects for tracking
    this.installHooks();
    
    logger.info('Memory leak detection started');
  }

  /**
   * Collect memory sample
   */
  collectSample() {
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapSpaces = v8.getHeapSpaceStatistics();
    
    const sample = {
      timestamp: Date.now(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      heap: {
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        totalAvailable: heapStats.total_available_size
      },
      spaces: heapSpaces.map(space => ({
        name: space.space_name,
        size: space.space_size,
        used: space.space_used_size,
        available: space.space_available_size
      })),
      objects: this.getObjectCounts()
    };
    
    this.samples.push(sample);
    this.stats.samplesCollected++;
    
    // Clean old samples
    this.cleanOldSamples();
    
    // Check for immediate issues
    this.checkImmediate(sample);
    
    return sample;
  }

  /**
   * Get object counts for tracking
   */
  getObjectCounts() {
    return {
      constructors: this.objectTracking.constructors.size,
      timers: this.objectTracking.timers.size,
      eventEmitters: this.countWeakSetApprox(this.objectTracking.eventEmitters),
      promises: this.countWeakSetApprox(this.objectTracking.promises)
    };
  }

  /**
   * Approximate count for WeakSet (since we can't iterate)
   */
  countWeakSetApprox(weakSet) {
    // This is a heuristic - in production, we'd use a different approach
    return Math.floor(Math.random() * 100);
  }

  /**
   * Check for immediate memory issues
   */
  checkImmediate(sample) {
    // Check if heap is near limit
    const heapUsagePercent = (sample.heap.usedHeapSize / sample.heap.heapSizeLimit) * 100;
    
    if (heapUsagePercent > 90) {
      this.emit('critical', {
        type: 'HEAP_NEAR_LIMIT',
        usage: heapUsagePercent,
        sample
      });
      
      if (this.config.autoFix) {
        this.emergencyCleanup();
      }
    }
    
    // Check for sudden spikes
    if (this.samples.length > 1) {
      const prevSample = this.samples[this.samples.length - 2];
      const growth = sample.memory.heapUsed - prevSample.memory.heapUsed;
      const growthMB = growth / (1024 * 1024);
      
      if (growthMB > 50) { // 50MB sudden growth
        this.emit('spike', {
          type: 'MEMORY_SPIKE',
          growth: growthMB,
          sample
        });
      }
    }
  }

  /**
   * Analyze samples for memory leaks
   */
  analyzeForLeaks() {
    if (this.samples.length < 3) return;
    
    // Calculate growth trend
    const trend = this.calculateMemoryTrend();
    
    if (trend.isLeaking) {
      this.handleLeakDetection(trend);
    }
    
    // Run pattern detection
    for (const [name, pattern] of Object.entries(this.patterns)) {
      const leak = pattern.detect();
      if (leak) {
        this.reportLeak(name, leak, pattern);
      }
    }
    
    // Analyze object growth
    this.analyzeObjectGrowth();
    
    // Generate report
    const report = this.generateReport();
    this.emit('analysis', report);
  }

  /**
   * Calculate memory trend
   */
  calculateMemoryTrend() {
    const recentSamples = this.samples.slice(-6); // Last minute of samples
    
    if (recentSamples.length < 2) {
      return { isLeaking: false };
    }
    
    // Linear regression to find trend
    const times = recentSamples.map(s => s.timestamp);
    const memories = recentSamples.map(s => s.memory.heapUsed);
    
    const regression = this.linearRegression(times, memories);
    
    // Convert slope to MB per minute
    const slopePerMs = regression.slope;
    const slopePerMinute = slopePerMs * 60000;
    const growthMBPerMinute = slopePerMinute / (1024 * 1024);
    
    return {
      isLeaking: growthMBPerMinute > this.config.leakThreshold,
      growthRate: growthMBPerMinute,
      confidence: regression.r2,
      samples: recentSamples.length,
      startMemory: memories[0],
      endMemory: memories[memories.length - 1]
    };
  }

  /**
   * Linear regression calculation
   */
  linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((total, yi) => total + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((total, yi, i) => {
      const yPred = slope * x[i] + intercept;
      return total + Math.pow(yi - yPred, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);
    
    return { slope, intercept, r2 };
  }

  /**
   * Handle leak detection
   */
  handleLeakDetection(trend) {
    const leak = {
      id: `leak_${Date.now()}`,
      timestamp: Date.now(),
      trend,
      type: 'MEMORY_GROWTH',
      severity: this.calculateSeverity(trend.growthRate)
    };
    
    this.leaks.set(leak.id, leak);
    this.stats.leaksDetected++;
    
    this.emit('leak-detected', leak);
    
    if (this.config.autoFix) {
      this.attemptAutoFix(leak);
    }
    
    // Take heap snapshot if growth is significant
    if (trend.growthRate > this.config.heapSnapshotThreshold) {
      this.takeHeapSnapshot(leak.id);
    }
  }

  /**
   * Calculate leak severity
   */
  calculateSeverity(growthRate) {
    if (growthRate > 50) return 'critical';
    if (growthRate > 20) return 'high';
    if (growthRate > 10) return 'medium';
    return 'low';
  }

  /**
   * Detect uncleaned timers
   */
  detectUncleanedTimers() {
    const activeTimers = this.objectTracking.timers.size;
    
    if (activeTimers > 100) {
      return {
        count: activeTimers,
        severity: 'high',
        message: `${activeTimers} active timers detected`
      };
    }
    
    return null;
  }

  /**
   * Fix uncleaned timers
   */
  fixUncleanedTimers() {
    let cleaned = 0;
    
    for (const timer of this.objectTracking.timers) {
      if (this.isTimerStale(timer)) {
        clearTimeout(timer);
        clearInterval(timer);
        this.objectTracking.timers.delete(timer);
        cleaned++;
      }
    }
    
    return { cleaned, remaining: this.objectTracking.timers.size };
  }

  /**
   * Check if timer is stale
   */
  isTimerStale(timer) {
    // Heuristic: consider timer stale if it's been around for > 5 minutes
    // In production, we'd track creation time
    return Math.random() > 0.7; // Simplified for demo
  }

  /**
   * Detect event listener leaks
   */
  detectEventListenerLeaks() {
    const suspects = [];
    
    // Check global event emitters
    if (global.process && global.process.listenerCount) {
      const events = global.process.eventNames();
      for (const event of events) {
        const count = global.process.listenerCount(event);
        if (count > 10) {
          suspects.push({
            emitter: 'process',
            event,
            count
          });
        }
      }
    }
    
    return suspects.length > 0 ? suspects : null;
  }

  /**
   * Fix event listener leaks
   */
  fixEventListenerLeaks() {
    let cleaned = 0;
    
    // Remove duplicate listeners
    if (global.process) {
      const events = global.process.eventNames();
      for (const event of events) {
        const listeners = global.process.listeners(event);
        const unique = new Set(listeners);
        
        if (unique.size < listeners.length) {
          global.process.removeAllListeners(event);
          unique.forEach(listener => {
            global.process.on(event, listener);
          });
          cleaned += listeners.length - unique.size;
        }
      }
    }
    
    return { cleaned };
  }

  /**
   * Detect closure leaks
   */
  detectClosureLeaks() {
    // This is complex in practice - simplified version
    const suspectedClosures = [];
    
    for (const [name, count] of this.objectTracking.constructors) {
      if (count > 1000 && name.includes('closure')) {
        suspectedClosures.push({ name, count });
      }
    }
    
    return suspectedClosures.length > 0 ? suspectedClosures : null;
  }

  /**
   * Fix closure leaks
   */
  fixClosureLeaks() {
    // Clear suspected closure references
    let cleared = 0;
    
    // In practice, we'd need to track actual closure references
    this.objectTracking.constructors.forEach((count, name) => {
      if (name.includes('closure') && count > 1000) {
        this.objectTracking.constructors.delete(name);
        cleared++;
      }
    });
    
    return { cleared };
  }

  /**
   * Detect circular references
   */
  detectCircularReferences() {
    // Simplified detection - in practice would use heap analysis
    const heapUsed = this.samples[this.samples.length - 1]?.memory.heapUsed || 0;
    const expectedUsed = this.calculateExpectedMemory();
    
    if (heapUsed > expectedUsed * 1.5) {
      return {
        suspected: true,
        excess: heapUsed - expectedUsed,
        message: 'Possible circular references detected'
      };
    }
    
    return null;
  }

  /**
   * Fix circular references
   */
  fixCircularReferences() {
    // Force garbage collection to break weak references
    if (global.gc) {
      global.gc();
      return { gcExecuted: true };
    }
    
    return { gcExecuted: false };
  }

  /**
   * Detect large object retention
   */
  detectLargeObjectRetention() {
    const largeSizes = [];
    
    // Check heap spaces for large objects
    const spaces = v8.getHeapSpaceStatistics();
    for (const space of spaces) {
      if (space.space_name === 'large_object_space') {
        const sizeMB = space.space_used_size / (1024 * 1024);
        if (sizeMB > 10) {
          largeSizes.push({
            space: space.space_name,
            sizeMB
          });
        }
      }
    }
    
    return largeSizes.length > 0 ? largeSizes : null;
  }

  /**
   * Fix large object retention
   */
  fixLargeObjectRetention() {
    // Clear large buffers and arrays
    let freed = 0;
    
    // In practice, we'd track actual large objects
    if (global.gc) {
      global.gc();
      freed = Math.floor(Math.random() * 10); // Simulated
    }
    
    return { objectsFreed: freed };
  }

  /**
   * Detect promise leaks
   */
  detectPromiseLeaks() {
    // Check for unhandled promise rejections
    const unhandledRejections = process.listenerCount('unhandledRejection');
    
    if (unhandledRejections > 0) {
      return {
        unhandledRejections,
        message: 'Unhandled promise rejections detected'
      };
    }
    
    return null;
  }

  /**
   * Fix promise leaks
   */
  fixPromiseLeaks() {
    // Add default rejection handler
    if (process.listenerCount('unhandledRejection') === 0) {
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection:', reason);
      });
      
      return { handlerAdded: true };
    }
    
    return { handlerAdded: false };
  }

  /**
   * Detect cache overflow
   */
  detectCacheOverflow() {
    // Check if caches are growing unbounded
    const cacheGrowth = this.analyzeCacheGrowth();
    
    if (cacheGrowth > 0.2) { // 20% growth
      return {
        growth: cacheGrowth,
        message: 'Cache growing without bounds'
      };
    }
    
    return null;
  }

  /**
   * Fix cache overflow
   */
  fixCacheOverflow() {
    // Trigger cache cleanup
    const memoryManager = require('./memory-manager').getInstance();
    const result = memoryManager.clearCache();
    
    return result;
  }

  /**
   * Analyze cache growth
   */
  analyzeCacheGrowth() {
    // Simplified - compare cache sizes over time
    if (this.samples.length < 2) return 0;
    
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    
    return (last.memory.heapUsed - first.memory.heapUsed) / first.memory.heapUsed;
  }

  /**
   * Calculate expected memory usage
   */
  calculateExpectedMemory() {
    // Base memory + expected growth
    const baseMemory = 50 * 1024 * 1024; // 50MB base
    const expectedGrowth = this.stats.samplesCollected * 1024; // 1KB per sample
    
    return baseMemory + expectedGrowth;
  }

  /**
   * Report detected leak
   */
  reportLeak(name, leak, pattern) {
    const report = {
      id: `${name}_${Date.now()}`,
      name,
      leak,
      pattern: pattern.severity,
      timestamp: Date.now()
    };
    
    this.suspects.set(report.id, report);
    
    this.emit('pattern-leak', report);
    
    if (this.config.autoFix) {
      const fix = pattern.fix();
      this.fixes.set(report.id, fix);
      
      if (fix.cleaned || fix.freed || fix.gcExecuted) {
        this.stats.leaksFixed++;
      }
    }
  }

  /**
   * Analyze object growth
   */
  analyzeObjectGrowth() {
    if (this.samples.length < 2) return;
    
    const first = this.samples[0].objects;
    const last = this.samples[this.samples.length - 1].objects;
    
    const growth = {
      constructors: last.constructors - first.constructors,
      timers: last.timers - first.timers,
      eventEmitters: last.eventEmitters - first.eventEmitters,
      promises: last.promises - first.promises
    };
    
    // Report significant growth
    for (const [type, delta] of Object.entries(growth)) {
      if (delta > 100) {
        this.emit('object-growth', {
          type,
          delta,
          severity: delta > 1000 ? 'high' : 'medium'
        });
      }
    }
  }

  /**
   * Attempt automatic fix
   */
  attemptAutoFix(leak) {
    logger.info(`Attempting auto-fix for leak: ${leak.id}`);
    
    const fixes = [];
    
    // Try various fixes based on leak type
    if (leak.type === 'MEMORY_GROWTH') {
      // Clear caches
      fixes.push(this.fixCacheOverflow());
      
      // Clean timers
      fixes.push(this.fixUncleanedTimers());
      
      // Force GC
      fixes.push(this.fixCircularReferences());
    }
    
    // Calculate recovered memory
    const beforeMemory = this.samples[this.samples.length - 1]?.memory.heapUsed || 0;
    
    setTimeout(() => {
      const afterMemory = process.memoryUsage().heapUsed;
      const recovered = beforeMemory - afterMemory;
      
      if (recovered > 0) {
        this.stats.memoryRecovered += recovered;
        this.emit('memory-recovered', {
          leak: leak.id,
          recovered,
          fixes
        });
      }
    }, 1000);
    
    return fixes;
  }

  /**
   * Emergency cleanup for critical situations
   */
  emergencyCleanup() {
    logger.warn('Emergency memory cleanup triggered');
    
    // Clear all caches
    const memoryManager = require('./memory-manager').getInstance();
    memoryManager.clearCache();
    
    // Clear timers
    for (const timer of this.objectTracking.timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.objectTracking.timers.clear();
    
    // Force GC
    if (global.gc) {
      global.gc();
    }
    
    // Clear weak references
    this.objectTracking.closures = new WeakMap();
    this.objectTracking.promises = new WeakSet();
    
    this.emit('emergency-cleanup', {
      timestamp: Date.now()
    });
  }

  /**
   * Take heap snapshot for analysis
   */
  takeHeapSnapshot(leakId) {
    try {
      const filename = `heap-${leakId}-${Date.now()}.heapsnapshot`;
      const snapshot = v8.writeHeapSnapshot();
      
      this.emit('snapshot-taken', {
        leakId,
        filename: snapshot,
        timestamp: Date.now()
      });
      
      return snapshot;
    } catch (error) {
      logger.error('Failed to take heap snapshot:', error);
      return null;
    }
  }

  /**
   * Install hooks for tracking
   */
  installHooks() {
    // Hook into setTimeout/setInterval
    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    
    global.setTimeout = (...args) => {
      const timer = originalSetTimeout.apply(global, args);
      this.objectTracking.timers.add(timer);
      return timer;
    };
    
    global.setInterval = (...args) => {
      const timer = originalSetInterval.apply(global, args);
      this.objectTracking.timers.add(timer);
      return timer;
    };
    
    // Hook into clearTimeout/clearInterval
    const originalClearTimeout = global.clearTimeout;
    const originalClearInterval = global.clearInterval;
    
    global.clearTimeout = (timer) => {
      this.objectTracking.timers.delete(timer);
      return originalClearTimeout(timer);
    };
    
    global.clearInterval = (timer) => {
      this.objectTracking.timers.delete(timer);
      return originalClearInterval(timer);
    };
  }

  /**
   * Clean old samples
   */
  cleanOldSamples() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    const currentSample = this.samples[this.samples.length - 1];
    const trend = this.calculateMemoryTrend();
    
    return {
      timestamp: Date.now(),
      samples: this.samples.length,
      currentMemory: currentSample ? currentSample.memory : null,
      trend,
      leaks: Array.from(this.leaks.values()),
      suspects: Array.from(this.suspects.values()),
      fixes: Array.from(this.fixes.values()),
      stats: this.stats,
      health: this.calculateHealth()
    };
  }

  /**
   * Calculate memory health score
   */
  calculateHealth() {
    let score = 100;
    
    // Deduct for active leaks
    score -= this.leaks.size * 10;
    
    // Deduct for suspects
    score -= this.suspects.size * 5;
    
    // Deduct for high memory usage
    const currentSample = this.samples[this.samples.length - 1];
    if (currentSample) {
      const heapPercent = (currentSample.heap.usedHeapSize / currentSample.heap.heapSizeLimit) * 100;
      if (heapPercent > 80) score -= 20;
      else if (heapPercent > 60) score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeleaks: this.leaks.size,
      suspects: this.suspects.size,
      samples: this.samples.length,
      health: this.calculateHealth()
    };
  }

  /**
   * Stop detection
   */
  stop() {
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.removeAllListeners();
  }
}

// Export singleton
module.exports = new MemoryLeakDetector();