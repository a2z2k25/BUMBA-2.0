/**
 * BUMBA Smart Cache Invalidation System
 * Intelligent cache invalidation with multiple strategies
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

class SmartCacheInvalidation extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      strategy: options.strategy || 'hybrid', // ttl, lru, lfu, arc, hybrid
      ttl: options.ttl || 3600000, // 1 hour default
      maxSize: options.maxSize || 1000,
      maxMemory: options.maxMemory || 100 * 1024 * 1024, // 100MB
      checkInterval: options.checkInterval || 60000, // 1 minute
      enableDependencyTracking: options.enableDependencyTracking !== false,
      enablePredictiveInvalidation: options.enablePredictiveInvalidation !== false,
      enablePatternRecognition: options.enablePatternRecognition !== false,
      ...options
    };
    
    // Cache storage with metadata
    this.cache = new Map();
    this.metadata = new Map();
    this.dependencies = new Map();
    this.accessPatterns = new Map();
    
    // Strategy implementations
    this.strategies = {
      ttl: new TTLStrategy(this),
      lru: new LRUStrategy(this),
      lfu: new LFUStrategy(this),
      arc: new ARCStrategy(this),
      hybrid: new HybridStrategy(this)
    };
    
    // Current strategy
    this.currentStrategy = this.strategies[this.config.strategy];
    
    // Invalidation tracking
    this.invalidationStats = {
      total: 0,
      byStrategy: {},
      byReason: {},
      predictive: 0,
      manual: 0
    };
    
    // Pattern recognition
    this.patterns = {
      access: new Map(),
      invalidation: new Map(),
      predictions: new Map()
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Get cache entry with strategy
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss(key);
      return undefined;
    }
    
    // Check if valid
    if (!this.isValid(key, entry)) {
      this.invalidate(key, 'expired');
      return undefined;
    }
    
    // Update metadata
    this.updateMetadata(key, 'access');
    
    // Apply strategy
    this.currentStrategy.onAccess(key, entry);
    
    // Record access pattern
    if (this.config.enablePatternRecognition) {
      this.recordAccessPattern(key);
    }
    
    return entry.value;
  }

  /**
   * Set cache entry with strategy
   */
  set(key, value, options = {}) {
    // Check size limits
    if (this.shouldEvict()) {
      this.evict();
    }
    
    const entry = {
      key,
      value,
      size: this.calculateSize(value),
      created: Date.now(),
      accessed: Date.now(),
      hits: 0,
      ttl: options.ttl || this.config.ttl,
      expires: Date.now() + (options.ttl || this.config.ttl),
      tags: options.tags || [],
      dependencies: options.dependencies || [],
      priority: options.priority || 'normal'
    };
    
    // Store entry
    this.cache.set(key, entry);
    
    // Initialize metadata
    this.metadata.set(key, {
      accessCount: 0,
      lastAccess: Date.now(),
      frequency: 0,
      recency: Date.now(),
      predictedNextAccess: null,
      invalidationProbability: 0
    });
    
    // Track dependencies
    if (options.dependencies && this.config.enableDependencyTracking) {
      this.trackDependencies(key, options.dependencies);
    }
    
    // Apply strategy
    this.currentStrategy.onSet(key, entry);
    
    // Predict invalidation if enabled
    if (this.config.enablePredictiveInvalidation) {
      this.predictInvalidation(key, entry);
    }
    
    this.emit('set', { key, size: entry.size });
    
    return true;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key, reason = 'manual') {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Remove from cache
    this.cache.delete(key);
    this.metadata.delete(key);
    
    // Handle dependencies
    if (this.config.enableDependencyTracking) {
      this.invalidateDependents(key);
    }
    
    // Update stats
    this.invalidationStats.total++;
    this.invalidationStats.byReason[reason] = 
      (this.invalidationStats.byReason[reason] || 0) + 1;
    
    // Record invalidation pattern
    if (this.config.enablePatternRecognition) {
      this.recordInvalidationPattern(key, reason);
    }
    
    this.emit('invalidate', { key, reason, age: Date.now() - entry.created });
    
    return true;
  }

  /**
   * Invalidate by tag
   */
  invalidateByTag(tag) {
    const invalidated = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.invalidate(key, 'tag');
        invalidated.push(key);
      }
    }
    
    this.emit('invalidate-tag', { tag, count: invalidated.length });
    
    return invalidated;
  }

  /**
   * Invalidate by pattern
   */
  invalidateByPattern(pattern) {
    const regex = new RegExp(pattern);
    const invalidated = [];
    
    for (const [key, entry] of this.cache) {
      if (regex.test(key)) {
        this.invalidate(key, 'pattern');
        invalidated.push(key);
      }
    }
    
    this.emit('invalidate-pattern', { pattern, count: invalidated.length });
    
    return invalidated;
  }

  /**
   * Check if entry is valid
   */
  isValid(key, entry) {
    // Check TTL
    if (entry.expires && Date.now() > entry.expires) {
      return false;
    }
    
    // Check custom validation
    if (entry.validator && typeof entry.validator === 'function') {
      return entry.validator(entry);
    }
    
    // Apply strategy validation
    return this.currentStrategy.isValid(key, entry);
  }

  /**
   * Update metadata for entry
   */
  updateMetadata(key, action) {
    const meta = this.metadata.get(key);
    if (!meta) return;
    
    switch (action) {
      case 'access':
        meta.accessCount++;
        meta.lastAccess = Date.now();
        meta.recency = Date.now();
        meta.frequency = this.calculateFrequency(meta);
        break;
        
      case 'update':
        meta.lastUpdate = Date.now();
        break;
    }
    
    // Update predictions
    if (this.config.enablePredictiveInvalidation) {
      this.updatePredictions(key, meta);
    }
  }

  /**
   * Calculate access frequency
   */
  calculateFrequency(meta) {
    const age = Date.now() - meta.recency;
    const ageHours = age / (1000 * 60 * 60);
    
    // Exponential decay
    return meta.accessCount / Math.max(1, ageHours);
  }

  /**
   * Should evict based on limits
   */
  shouldEvict() {
    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      return true;
    }
    
    // Check memory limit
    const totalSize = this.calculateTotalSize();
    if (totalSize >= this.config.maxMemory) {
      return true;
    }
    
    return false;
  }

  /**
   * Evict entries based on strategy
   */
  evict() {
    const toEvict = this.currentStrategy.selectEviction();
    
    for (const key of toEvict) {
      this.invalidate(key, 'eviction');
    }
    
    return toEvict.length;
  }

  /**
   * Calculate total cache size
   */
  calculateTotalSize() {
    let total = 0;
    
    for (const entry of this.cache.values()) {
      total += entry.size || 0;
    }
    
    return total;
  }

  /**
   * Calculate entry size
   */
  calculateSize(value) {
    try {
      if (Buffer.isBuffer(value)) {
        return value.length;
      }
      
      const str = JSON.stringify(value);
      return Buffer.byteLength(str, 'utf8');
    } catch (error) {
      // Estimate for non-serializable objects
      return 1024;
    }
  }

  /**
   * Track dependencies
   */
  trackDependencies(key, deps) {
    // Track what this key depends on
    this.dependencies.set(key, new Set(deps));
    
    // Track reverse dependencies
    for (const dep of deps) {
      if (!this.dependencies.has(`_reverse_${dep}`)) {
        this.dependencies.set(`_reverse_${dep}`, new Set());
      }
      this.dependencies.get(`_reverse_${dep}`).add(key);
    }
  }

  /**
   * Invalidate dependent entries
   */
  invalidateDependents(key) {
    const dependents = this.dependencies.get(`_reverse_${key}`);
    
    if (dependents) {
      for (const dependent of dependents) {
        this.invalidate(dependent, 'dependency');
      }
    }
  }

  /**
   * Record access pattern
   */
  recordAccessPattern(key) {
    const pattern = this.patterns.access.get(key) || {
      accesses: [],
      intervals: [],
      avgInterval: 0
    };
    
    const now = Date.now();
    
    if (pattern.accesses.length > 0) {
      const lastAccess = pattern.accesses[pattern.accesses.length - 1];
      pattern.intervals.push(now - lastAccess);
      
      // Keep only recent intervals
      if (pattern.intervals.length > 10) {
        pattern.intervals.shift();
      }
      
      // Calculate average interval
      pattern.avgInterval = pattern.intervals.reduce((a, b) => a + b, 0) / pattern.intervals.length;
    }
    
    pattern.accesses.push(now);
    
    // Keep only recent accesses
    if (pattern.accesses.length > 20) {
      pattern.accesses.shift();
    }
    
    this.patterns.access.set(key, pattern);
  }

  /**
   * Record invalidation pattern
   */
  recordInvalidationPattern(key, reason) {
    const pattern = this.patterns.invalidation.get(key) || {
      invalidations: [],
      reasons: {},
      avgLifetime: 0
    };
    
    pattern.invalidations.push({
      timestamp: Date.now(),
      reason
    });
    
    pattern.reasons[reason] = (pattern.reasons[reason] || 0) + 1;
    
    // Calculate average lifetime
    const entry = this.cache.get(key);
    if (entry) {
      const lifetime = Date.now() - entry.created;
      pattern.avgLifetime = (pattern.avgLifetime + lifetime) / 2;
    }
    
    this.patterns.invalidation.set(key, pattern);
  }

  /**
   * Predict when entry will be invalidated
   */
  predictInvalidation(key, entry) {
    const accessPattern = this.patterns.access.get(key);
    const invalidationPattern = this.patterns.invalidation.get(key);
    
    let prediction = {
      probability: 0,
      estimatedTime: null,
      reason: null
    };
    
    // Based on TTL
    if (entry.expires) {
      prediction.estimatedTime = entry.expires;
      prediction.reason = 'ttl';
      prediction.probability = 0.9;
    }
    
    // Based on access patterns
    if (accessPattern && accessPattern.avgInterval > 0) {
      const nextAccess = Date.now() + accessPattern.avgInterval;
      
      if (!prediction.estimatedTime || nextAccess > entry.expires) {
        prediction.probability = 0.3; // Low probability if accessed regularly
      }
    }
    
    // Based on invalidation history
    if (invalidationPattern && invalidationPattern.avgLifetime > 0) {
      const predictedInvalidation = entry.created + invalidationPattern.avgLifetime;
      
      if (!prediction.estimatedTime || predictedInvalidation < prediction.estimatedTime) {
        prediction.estimatedTime = predictedInvalidation;
        prediction.reason = 'historical';
        prediction.probability = 0.7;
      }
    }
    
    this.patterns.predictions.set(key, prediction);
    
    // Schedule predictive invalidation if high probability
    if (prediction.probability > 0.8 && prediction.estimatedTime) {
      this.schedulePredictiveInvalidation(key, prediction);
    }
  }

  /**
   * Update predictions based on new data
   */
  updatePredictions(key, meta) {
    const prediction = this.patterns.predictions.get(key);
    if (!prediction) return;
    
    // Adjust based on actual access
    if (meta.lastAccess > prediction.estimatedTime) {
      prediction.probability *= 0.8; // Reduce probability if still being accessed
    }
    
    this.patterns.predictions.set(key, prediction);
  }

  /**
   * Schedule predictive invalidation
   */
  schedulePredictiveInvalidation(key, prediction) {
    const delay = prediction.estimatedTime - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        // Check if still valid before invalidating
        const entry = this.cache.get(key);
        if (entry && this.shouldPredictivelyInvalidate(key, entry)) {
          this.invalidate(key, 'predictive');
          this.invalidationStats.predictive++;
        }
      }, delay);
    }
  }

  /**
   * Should predictively invalidate
   */
  shouldPredictivelyInvalidate(key, entry) {
    const meta = this.metadata.get(key);
    if (!meta) return false;
    
    // Don't invalidate if recently accessed
    const timeSinceAccess = Date.now() - meta.lastAccess;
    if (timeSinceAccess < 60000) { // Less than 1 minute
      return false;
    }
    
    // Don't invalidate high-priority items
    if (entry.priority === 'high') {
      return false;
    }
    
    return true;
  }

  /**
   * Record cache miss
   */
  recordMiss(key) {
    this.emit('miss', { key, timestamp: Date.now() });
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.performMaintenance();
    }, this.config.checkInterval);
  }

  /**
   * Perform periodic maintenance
   */
  performMaintenance() {
    // Clean expired entries
    this.cleanExpired();
    
    // Optimize based on patterns
    if (this.config.enablePatternRecognition) {
      this.optimizeBasedOnPatterns();
    }
    
    // Generate report
    const report = this.generateReport();
    this.emit('maintenance', report);
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.expires && now > entry.expires) {
        expired.push(key);
      }
    }
    
    for (const key of expired) {
      this.invalidate(key, 'expired');
    }
    
    return expired.length;
  }

  /**
   * Optimize based on patterns
   */
  optimizeBasedOnPatterns() {
    // Identify hot keys
    const hotKeys = this.identifyHotKeys();
    
    // Extend TTL for hot keys
    for (const key of hotKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        entry.expires = Date.now() + entry.ttl * 2; // Double TTL
        entry.priority = 'high';
      }
    }
    
    // Identify cold keys
    const coldKeys = this.identifyColdKeys();
    
    // Reduce TTL for cold keys
    for (const key of coldKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        entry.expires = Date.now() + entry.ttl / 2; // Half TTL
        entry.priority = 'low';
      }
    }
  }

  /**
   * Identify hot keys
   */
  identifyHotKeys() {
    const hot = [];
    
    for (const [key, meta] of this.metadata) {
      if (meta.frequency > 10 && meta.accessCount > 5) {
        hot.push(key);
      }
    }
    
    return hot;
  }

  /**
   * Identify cold keys
   */
  identifyColdKeys() {
    const cold = [];
    const now = Date.now();
    
    for (const [key, meta] of this.metadata) {
      const age = now - meta.lastAccess;
      if (age > 300000 && meta.accessCount < 2) { // 5 minutes old, accessed < 2 times
        cold.push(key);
      }
    }
    
    return cold;
  }

  /**
   * Generate report
   */
  generateReport() {
    return {
      size: this.cache.size,
      memoryUsed: this.calculateTotalSize(),
      stats: this.invalidationStats,
      strategy: this.config.strategy,
      hotKeys: this.identifyHotKeys().length,
      coldKeys: this.identifyColdKeys().length,
      predictions: this.patterns.predictions.size
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      memory: this.calculateTotalSize(),
      invalidations: this.invalidationStats,
      patterns: {
        access: this.patterns.access.size,
        invalidation: this.patterns.invalidation.size,
        predictions: this.patterns.predictions.size
      }
    };
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.metadata.clear();
    this.dependencies.clear();
    this.patterns.access.clear();
    this.patterns.invalidation.clear();
    this.patterns.predictions.clear();
    
    this.emit('clear');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}

/**
 * TTL Strategy
 */
class TTLStrategy {
  constructor(cache) {
    this.cache = cache;
  }
  
  onAccess(key, entry) {
    // No special handling for TTL
  }
  
  onSet(key, entry) {
    // TTL is set in entry.expires
  }
  
  isValid(key, entry) {
    return Date.now() <= entry.expires;
  }
  
  selectEviction() {
    // Evict oldest expired entries first
    const candidates = [];
    const now = Date.now();
    
    for (const [key, entry] of this.cache.cache) {
      if (now > entry.expires) {
        candidates.push(key);
      }
    }
    
    // If no expired, evict soonest to expire
    if (candidates.length === 0) {
      const sorted = Array.from(this.cache.cache.entries())
        .sort((a, b) => a[1].expires - b[1].expires);
      
      candidates.push(sorted[0][0]);
    }
    
    return candidates;
  }
}

/**
 * LRU Strategy
 */
class LRUStrategy {
  constructor(cache) {
    this.cache = cache;
    this.accessOrder = new Map();
  }
  
  onAccess(key, entry) {
    // Move to end (most recent)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
  }
  
  onSet(key, entry) {
    this.accessOrder.set(key, Date.now());
  }
  
  isValid(key, entry) {
    return true; // LRU doesn't invalidate based on time
  }
  
  selectEviction() {
    // Evict least recently used
    const sorted = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]);
    
    return sorted.slice(0, Math.ceil(this.cache.cache.size * 0.1))
      .map(item => item[0]);
  }
}

/**
 * LFU Strategy
 */
class LFUStrategy {
  constructor(cache) {
    this.cache = cache;
  }
  
  onAccess(key, entry) {
    entry.hits++;
  }
  
  onSet(key, entry) {
    entry.hits = 0;
  }
  
  isValid(key, entry) {
    return true;
  }
  
  selectEviction() {
    // Evict least frequently used
    const sorted = Array.from(this.cache.cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits);
    
    return sorted.slice(0, Math.ceil(this.cache.cache.size * 0.1))
      .map(item => item[0]);
  }
}

/**
 * ARC (Adaptive Replacement Cache) Strategy
 */
class ARCStrategy {
  constructor(cache) {
    this.cache = cache;
    this.t1 = new Set(); // Recent cache
    this.t2 = new Set(); // Frequent cache
    this.b1 = new Set(); // Recent evicted
    this.b2 = new Set(); // Frequent evicted
    this.p = 0; // Target size for t1
  }
  
  onAccess(key, entry) {
    if (this.t1.has(key)) {
      // Move from t1 to t2
      this.t1.delete(key);
      this.t2.add(key);
    } else if (this.b1.has(key)) {
      // Adapt p
      this.p = Math.min(this.cache.config.maxSize, this.p + 1);
      this.b1.delete(key);
      this.t2.add(key);
    } else if (this.b2.has(key)) {
      // Adapt p
      this.p = Math.max(0, this.p - 1);
      this.b2.delete(key);
      this.t2.add(key);
    }
  }
  
  onSet(key, entry) {
    this.t1.add(key);
  }
  
  isValid(key, entry) {
    return true;
  }
  
  selectEviction() {
    const candidates = [];
    
    // Evict from t1 if it's larger than target
    if (this.t1.size > this.p) {
      candidates.push(this.t1.values().next().value);
    } else if (this.t2.size > 0) {
      // Otherwise evict from t2
      candidates.push(this.t2.values().next().value);
    } else if (this.t1.size > 0) {
      // Fall back to t1
      candidates.push(this.t1.values().next().value);
    }
    
    return candidates;
  }
}

/**
 * Hybrid Strategy - Combines multiple strategies
 */
class HybridStrategy {
  constructor(cache) {
    this.cache = cache;
    this.strategies = {
      ttl: new TTLStrategy(cache),
      lru: new LRUStrategy(cache),
      lfu: new LFUStrategy(cache)
    };
  }
  
  onAccess(key, entry) {
    // Apply all strategies
    for (const strategy of Object.values(this.strategies)) {
      strategy.onAccess(key, entry);
    }
  }
  
  onSet(key, entry) {
    for (const strategy of Object.values(this.strategies)) {
      strategy.onSet(key, entry);
    }
  }
  
  isValid(key, entry) {
    // All strategies must agree
    for (const strategy of Object.values(this.strategies)) {
      if (!strategy.isValid(key, entry)) {
        return false;
      }
    }
    return true;
  }
  
  selectEviction() {
    // Combine recommendations from all strategies
    const scores = new Map();
    
    for (const [name, strategy] of Object.entries(this.strategies)) {
      const candidates = strategy.selectEviction();
      
      for (const key of candidates) {
        const score = scores.get(key) || 0;
        scores.set(key, score + 1);
      }
    }
    
    // Sort by score and return highest scored
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return sorted.slice(0, Math.ceil(this.cache.cache.size * 0.1))
      .map(item => item[0]);
  }
}

// Export singleton
module.exports = new SmartCacheInvalidation();