/**
 * Smart Cache for Intelligent Pooling
 * LRU cache with predictive retention and intelligent eviction
 */

const { logger } = require('../logging/bumba-logger');

class SmartCache {
  constructor(maxSize = 15) {
    // Cache configuration
    this.maxSize = maxSize;
    this.minSize = 3; // Never go below this
    this.cache = new Map();
    
    // Access tracking
    this.accessHistory = new Map(); // specialist -> access details
    this.accessPatterns = new Map(); // access pattern analysis
    
    // Predictive retention
    this.retentionScores = new Map();
    this.predictionEngine = null; // Will be set externally
    
    // Cache metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      predictions: 0,
      correctPredictions: 0,
      avgAccessTime: 0,
      memoryUsage: 0
    };
    
    // Memory tracking
    this.memoryPerSpecialist = 5; // MB average
    this.memoryLimit = 75; // MB total
    
    // TTL management
    this.ttlMap = new Map(); // specialist -> expiry time
    this.defaultTTL = 300000; // 5 minutes
    
    // Priority levels
    this.priorityLevels = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };
    
    logger.debug(`Smart cache initialized (size: ${maxSize})`);
  }
  
  /**
   * Get specialist from cache
   */
  get(specialistType) {
    if (this.cache.has(specialistType)) {
      // Move to end (most recently used)
      const specialist = this.cache.get(specialistType);
      this.cache.delete(specialistType);
      this.cache.set(specialistType, specialist);
      
      // Update access tracking
      this.trackAccess(specialistType, true);
      
      // Update TTL
      this.refreshTTL(specialistType);
      
      this.metrics.hits++;
      
      logger.debug(`Cache hit: ${specialistType}`);
      return specialist;
    }
    
    this.trackAccess(specialistType, false);
    this.metrics.misses++;
    
    return null;
  }
  
  /**
   * Set specialist in cache
   */
  set(specialistType, specialist, priority = 'NORMAL') {
    // Check memory limit
    if (this.isMemoryPressure() && !this.shouldAcceptUnderPressure(specialistType)) {
      logger.warn(`Cache rejected ${specialistType} due to memory pressure`);
      return false;
    }
    
    // Remove if already exists (to update position)
    if (this.cache.has(specialistType)) {
      this.cache.delete(specialistType);
    } else if (this.cache.size >= this.maxSize) {
      // Need to evict
      this.evictSmartly();
    }
    
    // Add to cache with metadata
    const entry = {
      ...specialist,
      cachedAt: Date.now(),
      priority: this.priorityLevels[priority] || this.priorityLevels.NORMAL,
      accessCount: 0
    };
    
    this.cache.set(specialistType, entry);
    
    // Set TTL
    this.setTTL(specialistType, this.calculateTTL(specialistType, priority));
    
    // Update memory usage
    this.updateMemoryUsage();
    
    logger.debug(`Cached: ${specialistType} (priority: ${priority})`);
    return true;
  }
  
  /**
   * Smart eviction strategy
   */
  evictSmartly() {
    // Never evict if below minimum size
    if (this.cache.size <= this.minSize) {
      logger.warn('Cache at minimum size, skipping eviction');
      return null;
    }
    
    // Calculate eviction scores
    const evictionCandidates = [];
    
    for (const [type, entry] of this.cache) {
      const score = this.calculateEvictionScore(type, entry);
      evictionCandidates.push({ type, score, entry });
    }
    
    // Sort by score (higher score = more likely to evict)
    evictionCandidates.sort((a, b) => b.score - a.score);
    
    // Evict the worst candidate
    const victim = evictionCandidates[0];
    
    if (victim && !this.isPredictedSoon(victim.type)) {
      this.cache.delete(victim.type);
      this.ttlMap.delete(victim.type);
      this.metrics.evictions++;
      
      logger.debug(`Evicted: ${victim.type} (score: ${victim.score.toFixed(2)})`);
      return victim.type;
    }
    
    // Fallback: evict oldest
    const oldest = this.cache.keys().next().value;
    this.cache.delete(oldest);
    this.ttlMap.delete(oldest);
    this.metrics.evictions++;
    
    logger.debug(`Evicted (fallback): ${oldest}`);
    return oldest;
  }
  
  /**
   * Calculate eviction score (higher = more likely to evict)
   */
  calculateEvictionScore(type, entry) {
    let score = 0;
    
    // Age factor (older = higher score)
    const age = Date.now() - entry.cachedAt;
    const ageScore = age / (1000 * 60 * 60); // Hours old
    score += ageScore * 2;
    
    // Access frequency (less accessed = higher score)
    const accessCount = entry.accessCount || 0;
    const accessScore = 10 / (accessCount + 1);
    score += accessScore * 3;
    
    // Priority (lower priority = higher score)
    const priorityScore = 5 - (entry.priority || 2);
    score += priorityScore * 2;
    
    // Retention score (if set by predictions)
    const retentionScore = this.retentionScores.get(type) || 0;
    score -= retentionScore * 5; // Subtract (negative is better)
    
    // TTL consideration
    const ttl = this.ttlMap.get(type);
    if (ttl && ttl < Date.now() + 60000) { // Expiring soon
      score += 10;
    }
    
    return score;
  }
  
  /**
   * Check if specialist is predicted to be needed soon
   */
  isPredictedSoon(specialistType) {
    if (!this.predictionEngine) return false;
    
    try {
      const predictions = this.predictionEngine.predictNext(specialistType);
      return predictions && predictions.includes(specialistType);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Track access patterns
   */
  trackAccess(specialistType, wasHit) {
    const now = Date.now();
    
    if (!this.accessHistory.has(specialistType)) {
      this.accessHistory.set(specialistType, {
        totalAccesses: 0,
        hits: 0,
        misses: 0,
        lastAccess: 0,
        avgTimeBetween: 0
      });
    }
    
    const history = this.accessHistory.get(specialistType);
    
    // Update basic stats
    history.totalAccesses++;
    if (wasHit) {
      history.hits++;
    } else {
      history.misses++;
    }
    
    // Calculate average time between accesses
    if (history.lastAccess > 0) {
      const timeSince = now - history.lastAccess;
      history.avgTimeBetween = history.avgTimeBetween * 0.7 + timeSince * 0.3;
    }
    
    history.lastAccess = now;
    
    // Update cached entry if exists
    if (this.cache.has(specialistType)) {
      const entry = this.cache.get(specialistType);
      entry.accessCount = (entry.accessCount || 0) + 1;
      entry.lastAccessed = now;
    }
  }
  
  /**
   * Calculate dynamic TTL
   */
  calculateTTL(specialistType, priority) {
    let ttl = this.defaultTTL;
    
    // Adjust by priority
    const priorityMultiplier = {
      CRITICAL: 3,
      HIGH: 2,
      NORMAL: 1,
      LOW: 0.5
    };
    
    ttl *= priorityMultiplier[priority] || 1;
    
    // Adjust by access history
    const history = this.accessHistory.get(specialistType);
    if (history && history.avgTimeBetween > 0) {
      // Set TTL to 2x average time between accesses
      ttl = Math.min(ttl, history.avgTimeBetween * 2);
    }
    
    // Minimum TTL
    return Math.max(ttl, 60000); // At least 1 minute
  }
  
  /**
   * Set TTL for specialist
   */
  setTTL(specialistType, ttl) {
    this.ttlMap.set(specialistType, Date.now() + ttl);
  }
  
  /**
   * Refresh TTL on access
   */
  refreshTTL(specialistType) {
    const currentTTL = this.ttlMap.get(specialistType);
    if (currentTTL) {
      // Extend by 50% of default TTL
      this.ttlMap.set(specialistType, Date.now() + this.defaultTTL * 0.5);
    }
  }
  
  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    const expired = [];
    
    for (const [type, expiry] of this.ttlMap) {
      if (expiry < now) {
        expired.push(type);
      }
    }
    
    for (const type of expired) {
      // Don't remove if it's been accessed recently
      const entry = this.cache.get(type);
      if (entry && entry.lastAccessed && now - entry.lastAccessed < 60000) {
        // Refresh TTL instead
        this.refreshTTL(type);
      } else {
        this.cache.delete(type);
        this.ttlMap.delete(type);
        logger.debug(`Expired from cache: ${type}`);
      }
    }
    
    return expired.length;
  }
  
  /**
   * Pre-warm cache with predictions
   */
  preWarm(specialists, priority = 'NORMAL') {
    const warmed = [];
    
    for (const specialistType of specialists) {
      if (!this.cache.has(specialistType)) {
        // Create placeholder entry
        const placeholder = {
          type: specialistType,
          state: 'pre-warmed',
          cachedAt: Date.now(),
          priority: this.priorityLevels[priority],
          accessCount: 0
        };
        
        if (this.set(specialistType, placeholder, priority)) {
          warmed.push(specialistType);
        }
      }
    }
    
    if (warmed.length > 0) {
      logger.debug(`Pre-warmed cache: ${warmed.join(', ')}`);
    }
    
    return warmed;
  }
  
  /**
   * Set retention scores for specialists
   */
  setRetentionScores(scores) {
    this.retentionScores = new Map(Object.entries(scores));
  }
  
  /**
   * Check memory pressure
   */
  isMemoryPressure() {
    return this.metrics.memoryUsage > this.memoryLimit * 0.8;
  }
  
  /**
   * Should accept under memory pressure
   */
  shouldAcceptUnderPressure(specialistType) {
    // Always accept critical specialists
    const entry = this.cache.get(specialistType);
    if (entry && entry.priority >= this.priorityLevels.HIGH) {
      return true;
    }
    
    // Accept if predicted soon
    return this.isPredictedSoon(specialistType);
  }
  
  /**
   * Update memory usage estimate
   */
  updateMemoryUsage() {
    this.metrics.memoryUsage = this.cache.size * this.memoryPerSpecialist;
  }
  
  /**
   * Get cache status
   */
  getStatus() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(1)
      : 0;
    
    // Get cache contents summary
    const contents = Array.from(this.cache.entries()).map(([type, entry]) => ({
      type,
      priority: Object.keys(this.priorityLevels).find(k => 
        this.priorityLevels[k] === entry.priority
      ),
      accessCount: entry.accessCount || 0,
      age: Math.floor((Date.now() - entry.cachedAt) / 1000), // seconds
      ttl: this.ttlMap.has(type) 
        ? Math.floor((this.ttlMap.get(type) - Date.now()) / 1000)
        : 0
    }));
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      evictions: this.metrics.evictions,
      memoryUsage: `${this.metrics.memoryUsage}MB`,
      memoryLimit: `${this.memoryLimit}MB`,
      contents: contents.sort((a, b) => b.accessCount - a.accessCount)
    };
  }
  
  /**
   * Delete specific entry from cache
   */
  delete(specialistType) {
    if (this.cache.has(specialistType)) {
      this.cache.delete(specialistType);
      this.ttlMap.delete(specialistType);
      this.updateMemoryUsage();
      logger.debug(`Deleted from cache: ${specialistType}`);
      return true;
    }
    return false;
  }
  
  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
    this.accessHistory.clear();
    this.retentionScores.clear();
    this.metrics.memoryUsage = 0;
    
    logger.debug('Cache cleared');
  }
  
  /**
   * Set prediction engine
   */
  setPredictionEngine(engine) {
    this.predictionEngine = engine;
    logger.debug('Prediction engine connected to cache');
  }
  
  /**
   * Export cache state
   */
  export() {
    return {
      cache: Array.from(this.cache.entries()),
      accessHistory: Array.from(this.accessHistory.entries()),
      ttlMap: Array.from(this.ttlMap.entries()),
      metrics: this.metrics
    };
  }
  
  /**
   * Import cache state
   */
  import(state) {
    if (state.cache) {
      this.cache = new Map(state.cache);
    }
    if (state.accessHistory) {
      this.accessHistory = new Map(state.accessHistory);
    }
    if (state.ttlMap) {
      this.ttlMap = new Map(state.ttlMap);
    }
    if (state.metrics) {
      this.metrics = { ...this.metrics, ...state.metrics };
    }
    
    this.updateMemoryUsage();
    logger.debug('Cache state imported');
  }
}

module.exports = { SmartCache };