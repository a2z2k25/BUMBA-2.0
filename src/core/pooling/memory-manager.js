/**
 * Memory Manager for Intelligent Pooling
 * Tracks and optimizes memory usage across the pooling system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class MemoryManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      memoryLimit: config.memoryLimit || 100,           // MB total limit
      criticalThreshold: config.criticalThreshold || 0.9,  // 90% = critical
      warningThreshold: config.warningThreshold || 0.7,    // 70% = warning
      
      // Per-specialist memory estimates (MB)
      specialistMemory: {
        default: config.specialistMemory?.default || 5,
        heavy: config.specialistMemory?.heavy || 10,
        light: config.specialistMemory?.light || 2,
        
        // Specific specialist types
        'backend-engineer': 6,
        'frontend-developer': 7,
        'database-specialist': 8,
        'ml-engineer': 12,
        'data-scientist': 10,
        'devops-engineer': 5,
        'qa-engineer': 4,
        'ui-designer': 6,
        'security-specialist': 5
      },
      
      // GC configuration
      gcInterval: config.gcInterval || 60000,           // 1 minute
      gcThreshold: config.gcThreshold || 0.8,           // Trigger GC at 80%
      aggressiveGC: config.aggressiveGC || false,
      
      // Monitoring
      sampleInterval: config.sampleInterval || 5000,    // 5 seconds
      historySize: config.historySize || 100,
      
      // Actions
      autoEviction: config.autoEviction !== false,
      autoScaling: config.autoScaling !== false
    };
    
    // Memory tracking
    this.memoryUsage = {
      total: 0,
      specialists: new Map(),     // specialist -> memory usage
      cache: 0,
      overhead: 0,
      system: 0
    };
    
    // Backward compatibility
    this.currentUsage = 0;
    
    // Memory history
    this.memoryHistory = [];
    this.memoryTrend = 'stable';
    
    // Pressure levels
    this.pressureLevel = 'normal'; // normal, warning, critical
    this.pressure = 'normal'; // Alias for compatibility
    this.lastPressureChange = Date.now();
    
    // GC tracking
    this.gcStats = {
      lastGC: 0,
      gcCount: 0,
      totalReclaimed: 0,
      averageReclaimed: 0
    };
    
    // Specialist memory profiles
    this.specialistProfiles = new Map();
    
    // Eviction candidates
    this.evictionQueue = [];
    
    // Start monitoring
    this.startMonitoring();
    
    logger.info(`💾 Memory manager initialized (limit: ${this.config.memoryLimit}MB)`);
  }
  
  /**
   * Track specialist memory allocation
   */
  allocateMemory(specialistType, instance) {
    const memory = this.estimateSpecialistMemory(specialistType, instance);
    
    // Check if allocation would exceed limit
    if (this.memoryUsage.total + memory > this.config.memoryLimit) {
      logger.warn(`Memory allocation would exceed limit: ${specialistType} needs ${memory}MB`);
      
      if (this.config.autoEviction) {
        const freed = this.evictForSpace(memory);
        if (freed < memory) {
          this.emit('memory:allocation-failed', {
            specialist: specialistType,
            required: memory,
            available: this.config.memoryLimit - this.memoryUsage.total
          });
          return false;
        }
      } else {
        return false;
      }
    }
    
    // Track allocation
    const id = instance?.id || `${specialistType}-${Date.now()}`;
    this.memoryUsage.specialists.set(id, {
      type: specialistType,
      memory,
      allocatedAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0
    });
    
    this.memoryUsage.total += memory;
    this.currentUsage = this.memoryUsage.total; // Keep compatibility property in sync
    
    // Update pressure level
    this.updatePressureLevel();
    
    logger.debug(`Allocated ${memory}MB for ${specialistType} (total: ${this.memoryUsage.total}MB)`);
    
    this.emit('memory:allocated', {
      specialist: specialistType,
      memory,
      total: this.memoryUsage.total
    });
    
    return true;
  }
  
  /**
   * Release specialist memory
   */
  releaseMemory(specialistId) {
    const allocation = this.memoryUsage.specialists.get(specialistId);
    
    if (!allocation) {
      return 0;
    }
    
    const memory = allocation.memory;
    this.memoryUsage.specialists.delete(specialistId);
    this.memoryUsage.total -= memory;
    this.currentUsage = this.memoryUsage.total; // Keep compatibility property in sync
    
    // Update pressure level
    this.updatePressureLevel();
    
    logger.debug(`Released ${memory}MB from ${allocation.type} (total: ${this.memoryUsage.total}MB)`);
    
    this.emit('memory:released', {
      specialist: allocation.type,
      memory,
      total: this.memoryUsage.total
    });
    
    return memory;
  }
  
  /**
   * Estimate specialist memory usage
   */
  estimateSpecialistMemory(type, instance) {
    // Check specific type first
    if (this.config.specialistMemory[type]) {
      return this.config.specialistMemory[type];
    }
    
    // Check profile
    const profile = this.specialistProfiles.get(type);
    if (profile) {
      return profile.averageMemory;
    }
    
    // Categorize by type patterns
    if (type.includes('ml') || type.includes('data')) {
      return this.config.specialistMemory.heavy;
    }
    
    if (type.includes('ui') || type.includes('frontend')) {
      return this.config.specialistMemory.default;
    }
    
    if (type.includes('test') || type.includes('qa')) {
      return this.config.specialistMemory.light;
    }
    
    // Default
    return this.config.specialistMemory.default;
  }
  
  /**
   * Update memory pressure level
   */
  updatePressureLevel() {
    const usage = this.memoryUsage.total;
    const limit = this.config.memoryLimit;
    const ratio = usage / limit;
    
    let newLevel = 'normal';
    
    if (ratio >= this.config.criticalThreshold) {
      newLevel = 'critical';
    } else if (ratio >= this.config.warningThreshold) {
      newLevel = 'warning';
    }
    
    if (newLevel !== this.pressureLevel) {
      const oldLevel = this.pressureLevel;
      this.pressureLevel = newLevel;
      this.pressure = newLevel; // Keep alias in sync
      this.lastPressureChange = Date.now();
      
      logger.info(`Memory pressure changed: ${oldLevel} → ${newLevel} (${(ratio * 100).toFixed(1)}%)`);
      
      this.emit('memory:pressure-changed', {
        from: oldLevel,
        to: newLevel,
        usage,
        limit,
        ratio
      });
      
      // Trigger actions based on pressure
      this.handlePressureChange(newLevel);
    }
  }
  
  /**
   * Handle pressure level changes
   */
  handlePressureChange(level) {
    switch (level) {
      case 'critical':
        // Aggressive eviction
        if (this.config.autoEviction) {
          this.performAggressiveEviction();
        }
        // Trigger GC
        this.triggerGarbageCollection(true);
        // Alert
        this.emit('memory:critical');
        break;
        
      case 'warning':
        // Moderate eviction
        if (this.config.autoEviction) {
          this.performModerateEviction();
        }
        // Trigger GC
        this.triggerGarbageCollection(false);
        // Alert
        this.emit('memory:warning');
        break;
        
      case 'normal':
        // Recovery
        this.emit('memory:recovered');
        break;
    }
  }
  
  /**
   * Evict specialists to free space
   */
  evictForSpace(requiredMemory) {
    const candidates = this.getEvictionCandidates();
    let freedMemory = 0;
    const evicted = [];
    
    for (const candidate of candidates) {
      if (freedMemory >= requiredMemory) break;
      
      const memory = this.releaseMemory(candidate.id);
      freedMemory += memory;
      evicted.push(candidate);
    }
    
    if (evicted.length > 0) {
      logger.info(`Evicted ${evicted.length} specialists to free ${freedMemory}MB`);
      
      this.emit('memory:eviction', {
        count: evicted.length,
        freed: freedMemory,
        specialists: evicted.map(c => c.type)
      });
    }
    
    return freedMemory;
  }
  
  /**
   * Get eviction candidates sorted by priority
   */
  getEvictionCandidates() {
    const candidates = [];
    const now = Date.now();
    
    for (const [id, allocation] of this.memoryUsage.specialists) {
      const age = now - allocation.allocatedAt;
      const idleTime = now - allocation.lastAccessed;
      const memoryWeight = allocation.memory / this.config.specialistMemory.default;
      
      // Calculate eviction score (higher = more likely to evict)
      const score = (idleTime / 60000) * memoryWeight / (allocation.accessCount + 1);
      
      candidates.push({
        id,
        type: allocation.type,
        memory: allocation.memory,
        score,
        age,
        idleTime
      });
    }
    
    // Sort by score (highest first)
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Perform aggressive eviction
   */
  performAggressiveEviction() {
    const target = this.config.memoryLimit * 0.5; // Free to 50%
    const toFree = this.memoryUsage.total - target;
    
    if (toFree > 0) {
      this.evictForSpace(toFree);
    }
  }
  
  /**
   * Perform moderate eviction
   */
  performModerateEviction() {
    const target = this.config.memoryLimit * 0.6; // Free to 60%
    const toFree = this.memoryUsage.total - target;
    
    if (toFree > 0) {
      this.evictForSpace(toFree);
    }
  }
  
  /**
   * Trigger garbage collection
   */
  triggerGarbageCollection(aggressive = false) {
    if (!global.gc) {
      logger.debug('GC not exposed (run with --expose-gc)');
      return;
    }
    
    const before = process.memoryUsage().heapUsed / 1024 / 1024;
    
    if (aggressive && this.config.aggressiveGC) {
      // Force full GC
      global.gc(true);
    } else {
      // Regular GC
      global.gc();
    }
    
    const after = process.memoryUsage().heapUsed / 1024 / 1024;
    const reclaimed = before - after;
    
    // Update stats
    this.gcStats.lastGC = Date.now();
    this.gcStats.gcCount++;
    this.gcStats.totalReclaimed += Math.max(0, reclaimed);
    this.gcStats.averageReclaimed = this.gcStats.totalReclaimed / this.gcStats.gcCount;
    
    logger.debug(`GC triggered: reclaimed ${reclaimed.toFixed(2)}MB`);
    
    this.emit('memory:gc', {
      before,
      after,
      reclaimed,
      aggressive
    });
  }
  
  /**
   * Track memory access
   */
  trackAccess(specialistId) {
    const allocation = this.memoryUsage.specialists.get(specialistId);
    
    if (allocation) {
      allocation.lastAccessed = Date.now();
      allocation.accessCount++;
    }
  }
  
  /**
   * Sample current memory usage
   */
  sampleMemory() {
    const processMemory = process.memoryUsage();
    
    const sample = {
      timestamp: Date.now(),
      process: {
        rss: processMemory.rss / 1024 / 1024,
        heapTotal: processMemory.heapTotal / 1024 / 1024,
        heapUsed: processMemory.heapUsed / 1024 / 1024,
        external: processMemory.external / 1024 / 1024
      },
      pooling: {
        total: this.memoryUsage.total,
        specialists: this.memoryUsage.specialists.size,
        cache: this.memoryUsage.cache,
        overhead: this.memoryUsage.overhead
      },
      pressure: this.pressureLevel,
      ratio: this.memoryUsage.total / this.config.memoryLimit
    };
    
    // Add to history
    this.memoryHistory.push(sample);
    
    // Trim history
    if (this.memoryHistory.length > this.config.historySize) {
      this.memoryHistory.shift();
    }
    
    // Detect trend
    this.detectMemoryTrend();
    
    return sample;
  }
  
  /**
   * Detect memory usage trend
   */
  detectMemoryTrend() {
    if (this.memoryHistory.length < 10) return;
    
    const recent = this.memoryHistory.slice(-10);
    const older = this.memoryHistory.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.pooling.total, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((sum, s) => sum + s.pooling.total, 0) / older.length
      : recentAvg;
    
    const change = recentAvg - olderAvg;
    const changePercent = olderAvg > 0 ? (change / olderAvg) * 100 : 0;
    
    if (changePercent > 10) {
      this.memoryTrend = 'increasing';
    } else if (changePercent < -10) {
      this.memoryTrend = 'decreasing';
    } else {
      this.memoryTrend = 'stable';
    }
  }
  
  /**
   * Update specialist profile
   */
  updateProfile(type, memoryUsage) {
    if (!this.specialistProfiles.has(type)) {
      this.specialistProfiles.set(type, {
        samples: [],
        averageMemory: memoryUsage,
        peakMemory: memoryUsage,
        minMemory: memoryUsage
      });
    }
    
    const profile = this.specialistProfiles.get(type);
    profile.samples.push(memoryUsage);
    
    // Keep last 50 samples
    if (profile.samples.length > 50) {
      profile.samples.shift();
    }
    
    // Update statistics
    profile.averageMemory = profile.samples.reduce((sum, s) => sum + s, 0) / profile.samples.length;
    profile.peakMemory = Math.max(...profile.samples);
    profile.minMemory = Math.min(...profile.samples);
  }
  
  /**
   * Get memory report
   */
  getMemoryReport() {
    const processMemory = process.memoryUsage();
    
    return {
      system: {
        rss: `${(processMemory.rss / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(processMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(processMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        external: `${(processMemory.external / 1024 / 1024).toFixed(2)}MB`
      },
      
      pooling: {
        used: `${this.memoryUsage.total.toFixed(2)}MB`,
        limit: `${this.config.memoryLimit}MB`,
        usage: `${(this.memoryUsage.total / this.config.memoryLimit * 100).toFixed(1)}%`,
        specialists: this.memoryUsage.specialists.size,
        pressure: this.pressureLevel,
        trend: this.memoryTrend
      },
      
      specialists: Array.from(this.memoryUsage.specialists.values())
        .sort((a, b) => b.memory - a.memory)
        .slice(0, 10)
        .map(s => ({
          type: s.type,
          memory: `${s.memory}MB`,
          age: `${Math.floor((Date.now() - s.allocatedAt) / 1000)}s`,
          idle: `${Math.floor((Date.now() - s.lastAccessed) / 1000)}s`,
          accesses: s.accessCount
        })),
      
      gc: {
        count: this.gcStats.gcCount,
        lastGC: this.gcStats.lastGC ? `${Math.floor((Date.now() - this.gcStats.lastGC) / 1000)}s ago` : 'never',
        totalReclaimed: `${this.gcStats.totalReclaimed.toFixed(2)}MB`,
        averageReclaimed: `${this.gcStats.averageReclaimed.toFixed(2)}MB`
      },
      
      thresholds: {
        warning: `${(this.config.warningThreshold * 100).toFixed(0)}%`,
        critical: `${(this.config.criticalThreshold * 100).toFixed(0)}%`,
        gc: `${(this.config.gcThreshold * 100).toFixed(0)}%`
      }
    };
  }
  
  /**
   * Start memory monitoring
   */
  startMonitoring() {
    // Sample memory periodically
    this.sampleInterval = setInterval(() => {
      this.sampleMemory();
    }, this.config.sampleInterval);
    
    // GC interval
    this.gcInterval = setInterval(() => {
      const ratio = this.memoryUsage.total / this.config.memoryLimit;
      if (ratio > this.config.gcThreshold) {
        this.triggerGarbageCollection();
      }
    }, this.config.gcInterval);
    
    logger.debug('Memory monitoring started');
  }
  
  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    
    logger.debug('Memory monitoring stopped');
  }
  
  /**
   * Get memory status
   */
  getStatus() {
    return {
      usage: {
        current: `${this.memoryUsage.total.toFixed(2)}MB`,
        limit: `${this.config.memoryLimit}MB`,
        percentage: `${(this.memoryUsage.total / this.config.memoryLimit * 100).toFixed(1)}%`
      },
      pressure: this.pressureLevel,
      trend: this.memoryTrend,
      specialists: this.memoryUsage.specialists.size,
      gcStats: this.gcStats
    };
  }
  
  /**
   * Get current memory usage
   */
  getCurrentUsage() {
    return this.memoryUsage.total;
  }
  
  /**
   * Check if under memory pressure
   */
  isUnderPressure() {
    return this.pressureLevel === 'warning' || this.pressureLevel === 'critical';
  }
  
  /**
   * Shutdown memory manager
   */
  shutdown() {
    this.stopMonitoring();
    logger.info('Memory manager shut down');
  }
  
  /**
   * Export state
   */
  export() {
    return {
      memoryUsage: {
        total: this.memoryUsage.total,
        specialists: Array.from(this.memoryUsage.specialists.entries())
      },
      specialistProfiles: Array.from(this.specialistProfiles.entries()),
      gcStats: this.gcStats,
      pressureLevel: this.pressureLevel,
      memoryTrend: this.memoryTrend
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.memoryUsage) {
      this.memoryUsage.total = state.memoryUsage.total;
      this.memoryUsage.specialists = new Map(state.memoryUsage.specialists);
    }
    
    if (state.specialistProfiles) {
      this.specialistProfiles = new Map(state.specialistProfiles);
    }
    
    if (state.gcStats) {
      this.gcStats = { ...state.gcStats };
    }
    
    if (state.pressureLevel) {
      this.pressureLevel = state.pressureLevel;
    }
    
    if (state.memoryTrend) {
      this.memoryTrend = state.memoryTrend;
    }
    
    logger.debug('Memory manager state imported');
  }
}

module.exports = { MemoryManager };