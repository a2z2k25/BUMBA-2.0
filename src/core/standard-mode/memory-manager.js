/**
 * BUMBA Standard Mode - Sprint 2: Memory Management System
 * 
 * Advanced memory optimization with proactive garbage collection,
 * memory leak detection, and intelligent memory pooling
 */

const EventEmitter = require('events');
const v8 = require('v8');

/**
 * Memory Manager for Standard Mode
 * Provides intelligent memory management and optimization
 */
class MemoryManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Memory thresholds
      maxHeapUsage: config.maxHeapUsage || 500 * 1024 * 1024, // 500MB
      warningThreshold: config.warningThreshold || 0.7, // 70%
      criticalThreshold: config.criticalThreshold || 0.9, // 90%
      
      // GC settings
      gcInterval: config.gcInterval || 30000, // 30 seconds
      forceGcThreshold: config.forceGcThreshold || 0.8, // 80%
      
      // Monitoring
      monitorInterval: config.monitorInterval || 5000, // 5 seconds
      leakDetectionInterval: config.leakDetectionInterval || 60000, // 1 minute
      
      // Pooling
      enablePooling: config.enablePooling !== false,
      poolSizes: config.poolSizes || {
        small: 100,
        medium: 50,
        large: 20
      }
    };
    
    // Memory state
    this.state = {
      currentUsage: 0,
      peakUsage: 0,
      averageUsage: 0,
      trend: 'stable',
      health: 'healthy'
    };
    
    // Memory pools
    this.pools = {
      small: new ObjectPool('small', this.config.poolSizes.small),
      medium: new ObjectPool('medium', this.config.poolSizes.medium),
      large: new ObjectPool('large', this.config.poolSizes.large)
    };
    
    // Leak detection
    this.leakDetector = new LeakDetector();
    
    // Metrics history
    this.history = [];
    this.maxHistorySize = 100;
    
    // State
    this.isManaging = false;
    this.lastGC = null;
    this.gcCount = 0;
  }

  /**
   * Start memory management
   */
  start() {
    if (this.isManaging) return;
    
    this.isManaging = true;
    console.log('💾 Memory Manager: Started');
    
    // Start monitoring
    this.startMonitoring();
    
    // Start proactive GC
    this.startProactiveGC();
    
    // Start leak detection
    this.startLeakDetection();
    
    // Initial measurement
    this.measureMemory();
  }

  /**
   * Stop memory management
   */
  stop() {
    if (!this.isManaging) return;
    
    this.isManaging = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
    
    if (this.leakInterval) {
      clearInterval(this.leakInterval);
    }
    
    console.log('💾 Memory Manager: Stopped');
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.measureMemory();
      this.analyzeMemory();
      this.checkThresholds();
    }, this.config.monitorInterval);
  }

  /**
   * Start proactive garbage collection
   */
  startProactiveGC() {
    this.gcInterval = setInterval(() => {
      this.considerGC();
    }, this.config.gcInterval);
  }

  /**
   * Start leak detection
   */
  startLeakDetection() {
    this.leakInterval = setInterval(() => {
      this.detectLeaks();
    }, this.config.leakDetectionInterval);
  }

  /**
   * Measure current memory usage
   */
  measureMemory() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    const measurement = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapLimit: heapStats.heap_size_limit,
      totalAvailable: heapStats.total_available_size,
      usagePercent: memUsage.heapUsed / heapStats.heap_size_limit
    };
    
    // Update state
    this.state.currentUsage = measurement.heapUsed;
    this.state.peakUsage = Math.max(this.state.peakUsage, measurement.heapUsed);
    
    // Store in history
    this.history.push(measurement);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Calculate average
    const recentHistory = this.history.slice(-10);
    const avgUsage = recentHistory.reduce((sum, m) => sum + m.heapUsed, 0) / recentHistory.length;
    this.state.averageUsage = avgUsage;
    
    // Determine trend
    this.state.trend = this.calculateTrend();
    
    return measurement;
  }

  /**
   * Analyze memory patterns
   */
  analyzeMemory() {
    const current = this.state.currentUsage;
    const average = this.state.averageUsage;
    const limit = this.config.maxHeapUsage;
    
    // Analyze usage pattern
    const analysis = {
      usageRatio: current / limit,
      averageRatio: average / limit,
      trend: this.state.trend,
      volatility: this.calculateVolatility(),
      pressure: this.calculateMemoryPressure()
    };
    
    // Emit analysis
    this.emit('memory-analysis', analysis);
    
    return analysis;
  }

  /**
   * Calculate memory trend
   */
  calculateTrend() {
    if (this.history.length < 5) return 'stable';
    
    const recent = this.history.slice(-5).map(h => h.heapUsed);
    const older = this.history.slice(-10, -5).map(h => h.heapUsed);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate memory volatility
   */
  calculateVolatility() {
    if (this.history.length < 5) return 0;
    
    const recent = this.history.slice(-5).map(h => h.heapUsed);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    const variance = recent.reduce((sum, val) => {
      return sum + Math.pow(val - avg, 2);
    }, 0) / recent.length;
    
    return Math.sqrt(variance) / avg;
  }

  /**
   * Calculate memory pressure
   */
  calculateMemoryPressure() {
    const usage = this.state.currentUsage / this.config.maxHeapUsage;
    const trend = this.state.trend === 'increasing' ? 0.2 : 0;
    const volatility = Math.min(this.calculateVolatility(), 0.3);
    
    return Math.min(usage + trend + volatility, 1);
  }

  /**
   * Check memory thresholds
   */
  checkThresholds() {
    const ratio = this.state.currentUsage / this.config.maxHeapUsage;
    const previousHealth = this.state.health;
    
    if (ratio >= this.config.criticalThreshold) {
      this.state.health = 'critical';
      this.handleCriticalMemory();
    } else if (ratio >= this.config.warningThreshold) {
      this.state.health = 'warning';
      this.handleWarningMemory();
    } else {
      this.state.health = 'healthy';
    }
    
    // Emit health change
    if (previousHealth !== this.state.health) {
      this.emit('health-changed', {
        previous: previousHealth,
        current: this.state.health,
        usage: this.state.currentUsage,
        ratio
      });
    }
  }

  /**
   * Handle critical memory situation
   */
  handleCriticalMemory() {
    console.log('🔴 Memory Manager: CRITICAL memory usage detected');
    
    // Force immediate GC
    this.forceGC();
    
    // Clear all pools
    this.clearAllPools();
    
    // Emit critical event
    this.emit('memory-critical', {
      usage: this.state.currentUsage,
      limit: this.config.maxHeapUsage
    });
  }

  /**
   * Handle warning memory situation
   */
  handleWarningMemory() {
    console.log('🟠️ Memory Manager: High memory usage detected');
    
    // Schedule GC
    this.scheduleGC();
    
    // Reduce pool sizes
    this.reducePools();
    
    // Emit warning event
    this.emit('memory-warning', {
      usage: this.state.currentUsage,
      limit: this.config.maxHeapUsage
    });
  }

  /**
   * Consider proactive garbage collection
   */
  considerGC() {
    const ratio = this.state.currentUsage / this.config.maxHeapUsage;
    const pressure = this.calculateMemoryPressure();
    
    // GC if pressure is high or ratio exceeds threshold
    if (pressure > 0.7 || ratio > this.config.forceGcThreshold) {
      this.performGC();
    }
  }

  /**
   * Perform garbage collection
   */
  performGC() {
    if (!global.gc) {
      console.log('💾 GC not exposed. Run with --expose-gc flag');
      return;
    }
    
    const before = process.memoryUsage().heapUsed;
    
    try {
      global.gc();
      this.gcCount++;
      this.lastGC = Date.now();
      
      const after = process.memoryUsage().heapUsed;
      const freed = before - after;
      
      console.log(`💾 GC performed: ${this.formatBytes(freed)} freed`);
      
      this.emit('gc-performed', {
        before,
        after,
        freed,
        count: this.gcCount
      });
    } catch (error) {
      console.error('💾 GC failed:', error);
    }
  }

  /**
   * Force immediate GC
   */
  forceGC() {
    console.log('💾 Forcing immediate GC');
    this.performGC();
  }

  /**
   * Schedule GC
   */
  scheduleGC() {
    // Schedule GC in next tick
    process.nextTick(() => {
      this.performGC();
    });
  }

  /**
   * Detect memory leaks
   */
  detectLeaks() {
    const leaks = this.leakDetector.detect(this.history);
    
    if (leaks.length > 0) {
      console.log(`🟠️ Memory Manager: ${leaks.length} potential leaks detected`);
      
      this.emit('leaks-detected', {
        leaks,
        timestamp: Date.now()
      });
      
      // Attempt to fix leaks
      this.attemptLeakFix(leaks);
    }
  }

  /**
   * Attempt to fix detected leaks
   */
  attemptLeakFix(leaks) {
    leaks.forEach(leak => {
      switch (leak.type) {
        case 'growing-heap':
          this.forceGC();
          break;
        case 'unclosed-resources':
          this.cleanupResources();
          break;
        case 'large-objects':
          this.clearLargeObjects();
          break;
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanupResources() {
    // Clear timers and intervals
    const activeTimers = process._getActiveHandles();
    console.log(`💾 Active handles: ${activeTimers.length}`);
    
    // Clear pools
    this.reducePools();
  }

  /**
   * Clear large objects
   */
  clearLargeObjects() {
    // Clear large pool
    this.pools.large.clear();
  }

  /**
   * Object pooling - acquire object
   */
  acquire(size = 'small') {
    if (!this.config.enablePooling) {
      return {};
    }
    
    const pool = this.pools[size];
    if (pool) {
      return pool.acquire();
    }
    
    return {};
  }

  /**
   * Object pooling - release object
   */
  release(obj, size = 'small') {
    if (!this.config.enablePooling) {
      return;
    }
    
    const pool = this.pools[size];
    if (pool) {
      pool.release(obj);
    }
  }

  /**
   * Clear all pools
   */
  clearAllPools() {
    Object.values(this.pools).forEach(pool => pool.clear());
    console.log('💾 All memory pools cleared');
  }

  /**
   * Reduce pool sizes
   */
  reducePools() {
    Object.values(this.pools).forEach(pool => pool.reduce());
    console.log('💾 Memory pool sizes reduced');
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }

  /**
   * Get memory status
   */
  getStatus() {
    const current = this.measureMemory();
    
    return {
      isManaging: this.isManaging,
      state: this.state,
      current: {
        heapUsed: this.formatBytes(current.heapUsed),
        heapTotal: this.formatBytes(current.heapTotal),
        external: this.formatBytes(current.external),
        rss: this.formatBytes(current.rss),
        usagePercent: `${(current.usagePercent * 100).toFixed(1)}%`
      },
      pools: {
        small: this.pools.small.getStatus(),
        medium: this.pools.medium.getStatus(),
        large: this.pools.large.getStatus()
      },
      gc: {
        count: this.gcCount,
        lastGC: this.lastGC ? new Date(this.lastGC).toISOString() : 'Never'
      },
      leaks: this.leakDetector.getStatus()
    };
  }

  /**
   * Get memory recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const ratio = this.state.currentUsage / this.config.maxHeapUsage;
    
    if (ratio > 0.8) {
      recommendations.push('Consider increasing heap size limit');
    }
    
    if (this.state.trend === 'increasing') {
      recommendations.push('Memory usage is trending upward - investigate causes');
    }
    
    if (this.calculateVolatility() > 0.3) {
      recommendations.push('High memory volatility detected - stabilize allocations');
    }
    
    if (this.leakDetector.hasLeaks()) {
      recommendations.push('Memory leaks detected - review resource cleanup');
    }
    
    return recommendations;
  }
}

/**
 * Object Pool for memory reuse
 */
class ObjectPool {
  constructor(name, maxSize) {
    this.name = name;
    this.maxSize = maxSize;
    this.pool = [];
    this.created = 0;
    this.reused = 0;
  }

  acquire() {
    if (this.pool.length > 0) {
      this.reused++;
      return this.pool.pop();
    }
    
    this.created++;
    return this.createObject();
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.resetObject(obj);
      this.pool.push(obj);
    }
  }

  createObject() {
    // Create appropriate sized object
    switch (this.name) {
      case 'small':
        return {};
      case 'medium':
        return { data: new Array(100) };
      case 'large':
        return { data: new Array(1000), cache: new Map() };
      default:
        return {};
    }
  }

  resetObject(obj) {
    // Clear object properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
    }
  }

  clear() {
    this.pool = [];
  }

  reduce() {
    // Reduce pool size by half
    const newSize = Math.floor(this.pool.length / 2);
    this.pool = this.pool.slice(0, newSize);
  }

  getStatus() {
    return {
      size: this.pool.length,
      maxSize: this.maxSize,
      created: this.created,
      reused: this.reused,
      reuseRate: this.created > 0 ? (this.reused / (this.created + this.reused)) : 0
    };
  }
}

/**
 * Memory Leak Detector
 */
class LeakDetector {
  constructor() {
    this.suspectedLeaks = [];
    this.confirmed = [];
  }

  detect(history) {
    if (history.length < 10) return [];
    
    const leaks = [];
    
    // Check for continuously growing heap
    if (this.isGrowingHeap(history)) {
      leaks.push({
        type: 'growing-heap',
        severity: 'high',
        description: 'Heap usage continuously increasing'
      });
    }
    
    // Check for large objects
    if (this.hasLargeObjects(history)) {
      leaks.push({
        type: 'large-objects',
        severity: 'medium',
        description: 'Large objects detected in memory'
      });
    }
    
    // Check for external memory growth
    if (this.isGrowingExternal(history)) {
      leaks.push({
        type: 'external-growth',
        severity: 'medium',
        description: 'External memory continuously increasing'
      });
    }
    
    this.suspectedLeaks = leaks;
    return leaks;
  }

  isGrowingHeap(history) {
    const recent = history.slice(-10);
    let increasing = 0;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].heapUsed > recent[i - 1].heapUsed) {
        increasing++;
      }
    }
    
    return increasing > 7; // 70% increasing
  }

  hasLargeObjects(history) {
    const latest = history[history.length - 1];
    if (!latest) return false;
    
    // Check if external memory is significant
    return latest.external > 50 * 1024 * 1024; // 50MB
  }

  isGrowingExternal(history) {
    const recent = history.slice(-10);
    let increasing = 0;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].external > recent[i - 1].external) {
        increasing++;
      }
    }
    
    return increasing > 7; // 70% increasing
  }

  hasLeaks() {
    return this.suspectedLeaks.length > 0;
  }

  getStatus() {
    return {
      suspected: this.suspectedLeaks.length,
      confirmed: this.confirmed.length,
      leaks: this.suspectedLeaks
    };
  }
}

module.exports = MemoryManager;