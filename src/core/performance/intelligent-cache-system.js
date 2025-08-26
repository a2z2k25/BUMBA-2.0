/**
 * BUMBA Intelligent Cache System
 * Multi-tier caching with compression, intelligent eviction, and performance optimization
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class IntelligentCacheSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // Tier configuration
      tiers: {
        hot: {
          maxSize: options.hotCacheSize || 100 * 1024 * 1024, // 100MB
          maxItems: options.hotCacheItems || 1000,
          ttl: options.hotCacheTTL || 300000 // 5 minutes
        },
        warm: {
          maxSize: options.warmCacheSize || 500 * 1024 * 1024, // 500MB
          maxItems: options.warmCacheItems || 5000,
          ttl: options.warmCacheTTL || 3600000 // 1 hour
        },
        cold: {
          maxSize: options.coldCacheSize || 1024 * 1024 * 1024, // 1GB
          maxItems: options.coldCacheItems || 10000,
          ttl: options.coldCacheTTL || 86400000 // 24 hours
        }
      },
      
      // Features
      compression: options.compression !== false,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      deduplication: options.deduplication !== false,
      prefetching: options.prefetching !== false,
      adaptiveEviction: options.adaptiveEviction !== false,
      
      // Performance
      maxConcurrentOperations: options.maxConcurrentOperations || 100,
      batchSize: options.batchSize || 50,
      cleanupInterval: options.cleanupInterval || 60000, // 1 minute
      
      ...options
    };
    
    // Cache tiers
    this.tiers = {
      hot: new Map(),  // In-memory, fastest
      warm: new Map(), // In-memory, compressed
      cold: new Map()  // Could be disk-based in production
    };
    
    // Metadata tracking
    this.metadata = new Map(); // key -> metadata
    this.accessPatterns = new Map(); // key -> access pattern
    this.dependencies = new Map(); // key -> dependent keys
    this.hashes = new Map(); // For deduplication
    
    // Performance tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      decompressions: 0,
      promotions: 0,
      demotions: 0,
      bytesCompressed: 0,
      bytesSaved: 0,
      prefetchHits: 0,
      deduplicationHits: 0
    };
    
    // Tier statistics
    this.tierStats = {
      hot: { hits: 0, misses: 0, size: 0, items: 0 },
      warm: { hits: 0, misses: 0, size: 0, items: 0 },
      cold: { hits: 0, misses: 0, size: 0, items: 0 }
    };
    
    // Operation queue
    this.operationQueue = [];
    this.processingOperations = false;
    
    // Prefetch predictions
    this.prefetchPredictions = new Map();
    
    this.initialize();
  }

  /**
   * Initialize cache system
   */
  initialize() {
    // Start cleanup timer
    this.startCleanupTimer();
    
    // Start promotion/demotion timer
    this.startTierManagement();
    
    // Start prefetch predictor
    if (this.config.prefetching) {
      this.startPrefetchPredictor();
    }
    
    logger.info('Intelligent cache system initialized');
  }

  /**
   * Get value from cache
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    
    // Check if deduplicated
    if (this.config.deduplication && this.hashes.has(key)) {
      const realKey = this.hashes.get(key);
      if (realKey !== key) {
        this.stats.deduplicationHits++;
        return this.get(realKey, options);
      }
    }
    
    // Try each tier in order
    for (const tierName of ['hot', 'warm', 'cold']) {
      const tier = this.tiers[tierName];
      
      if (tier.has(key)) {
        // Found in tier
        let value = tier.get(key);
        
        // Update metadata
        this.updateAccessMetadata(key, tierName);
        
        // Decompress if needed
        if (tierName !== 'hot' && this.isCompressed(value)) {
          value = await this.decompress(value);
          this.stats.decompressions++;
        }
        
        // Update stats
        this.stats.hits++;
        this.tierStats[tierName].hits++;
        
        // Consider promotion
        if (options.promote !== false) {
          this.considerPromotion(key, tierName, value);
        }
        
        // Trigger prefetch
        if (this.config.prefetching) {
          this.triggerPrefetch(key);
        }
        
        // Track access pattern
        this.trackAccessPattern(key);
        
        this.emit('cache:hit', {
          key,
          tier: tierName,
          latency: Date.now() - startTime
        });
        
        return value;
      }
    }
    
    // Cache miss
    this.stats.misses++;
    
    this.emit('cache:miss', {
      key,
      latency: Date.now() - startTime
    });
    
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();
    
    // Calculate size
    const size = this.calculateSize(value);
    
    // Check for deduplication
    if (this.config.deduplication) {
      const hash = this.calculateHash(value);
      const existingKey = this.findKeyByHash(hash);
      
      if (existingKey && existingKey !== key) {
        // Deduplicate - just create a reference
        this.hashes.set(key, existingKey);
        this.stats.deduplicationHits++;
        
        this.emit('cache:deduplicated', { key, existingKey });
        return;
      }
    }
    
    // Determine target tier
    const tier = options.tier || this.determineTier(size, options);
    
    // Prepare value for storage
    let storedValue = value;
    let compressed = false;
    
    // Compress if appropriate
    if (tier !== 'hot' && this.shouldCompress(value, size)) {
      storedValue = await this.compress(value);
      compressed = true;
      this.stats.compressions++;
      this.stats.bytesCompressed += size;
      this.stats.bytesSaved += size - this.calculateSize(storedValue);
    }
    
    // Ensure space in tier
    await this.ensureSpace(tier, size);
    
    // Store in tier
    this.tiers[tier].set(key, storedValue);
    
    // Update metadata
    this.metadata.set(key, {
      key,
      tier,
      size,
      compressed,
      created: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: options.ttl || this.config.tiers[tier].ttl,
      priority: options.priority || 'normal',
      tags: options.tags || [],
      dependencies: options.dependencies || []
    });
    
    // Update tier stats
    this.tierStats[tier].items++;
    this.tierStats[tier].size += size;
    
    // Track dependencies
    if (options.dependencies) {
      this.trackDependencies(key, options.dependencies);
    }
    
    // Store hash for deduplication
    if (this.config.deduplication) {
      const hash = this.calculateHash(value);
      this.hashes.set(key, key); // Points to itself
    }
    
    this.emit('cache:set', {
      key,
      tier,
      size,
      compressed,
      latency: Date.now() - startTime
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    // Check all tiers
    for (const tierName of ['hot', 'warm', 'cold']) {
      const tier = this.tiers[tierName];
      
      if (tier.has(key)) {
        // Get metadata
        const metadata = this.metadata.get(key);
        
        // Remove from tier
        tier.delete(key);
        
        // Update stats
        if (metadata) {
          this.tierStats[tierName].items--;
          this.tierStats[tierName].size -= metadata.size;
        }
        
        // Remove metadata
        this.metadata.delete(key);
        this.accessPatterns.delete(key);
        
        // Remove dependent keys
        this.invalidateDependents(key);
        
        // Remove hash reference
        if (this.config.deduplication) {
          this.hashes.delete(key);
        }
        
        this.emit('cache:delete', { key, tier: tierName });
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clear entire cache or specific tier
   */
  async clear(tierName = null) {
    if (tierName) {
      // Clear specific tier
      this.tiers[tierName].clear();
      this.tierStats[tierName] = { hits: 0, misses: 0, size: 0, items: 0 };
    } else {
      // Clear all tiers
      for (const tier of Object.keys(this.tiers)) {
        this.tiers[tier].clear();
        this.tierStats[tier] = { hits: 0, misses: 0, size: 0, items: 0 };
      }
      
      // Clear metadata
      this.metadata.clear();
      this.accessPatterns.clear();
      this.dependencies.clear();
      this.hashes.clear();
      this.prefetchPredictions.clear();
    }
    
    this.emit('cache:cleared', { tier: tierName });
  }

  /**
   * Determine appropriate tier for value
   */
  determineTier(size, options) {
    // Priority items go to hot cache
    if (options.priority === 'high') {
      return 'hot';
    }
    
    // Small, frequently accessed items to hot
    if (size < 10 * 1024) { // < 10KB
      return 'hot';
    }
    
    // Medium items to warm
    if (size < 100 * 1024) { // < 100KB
      return 'warm';
    }
    
    // Large items to cold
    return 'cold';
  }

  /**
   * Should compress value
   */
  shouldCompress(value, size) {
    if (!this.config.compression) return false;
    if (size < this.config.compressionThreshold) return false;
    
    // Don't compress already compressed data
    if (Buffer.isBuffer(value) && this.isCompressed(value)) {
      return false;
    }
    
    return true;
  }

  /**
   * Compress value
   */
  async compress(value) {
    const input = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value));
    const compressed = await gzip(input);
    
    // Add magic bytes to identify compressed data
    const result = Buffer.concat([
      Buffer.from('GZ'),
      compressed
    ]);
    
    return result;
  }

  /**
   * Decompress value
   */
  async decompress(value) {
    // Remove magic bytes
    const compressed = value.slice(2);
    const decompressed = await gunzip(compressed);
    
    // Try to parse as JSON
    try {
      return JSON.parse(decompressed.toString());
    } catch {
      return decompressed;
    }
  }

  /**
   * Check if value is compressed
   */
  isCompressed(value) {
    return Buffer.isBuffer(value) && 
           value.length > 2 && 
           value[0] === 0x47 && // 'G'
           value[1] === 0x5A;   // 'Z'
  }

  /**
   * Calculate size of value
   */
  calculateSize(value) {
    if (Buffer.isBuffer(value)) {
      return value.length;
    }
    
    if (typeof value === 'string') {
      return Buffer.byteLength(value);
    }
    
    // For objects, estimate size
    try {
      return Buffer.byteLength(JSON.stringify(value));
    } catch {
      return 1024; // Default estimate
    }
  }

  /**
   * Calculate hash of value
   */
  calculateHash(value) {
    const input = Buffer.isBuffer(value) ? value : JSON.stringify(value);
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Find key by hash
   */
  findKeyByHash(hash) {
    for (const [key, keyHash] of this.hashes) {
      if (keyHash === key) { // Only check primary keys
        const metadata = this.metadata.get(key);
        if (metadata) {
          // Calculate hash of actual value
          const value = this.getValueFromTier(key, metadata.tier);
          if (value && this.calculateHash(value) === hash) {
            return key;
          }
        }
      }
    }
    return null;
  }

  /**
   * Get value from specific tier
   */
  getValueFromTier(key, tierName) {
    return this.tiers[tierName].get(key);
  }

  /**
   * Ensure space in tier
   */
  async ensureSpace(tierName, requiredSize) {
    const tier = this.tiers[tierName];
    const config = this.config.tiers[tierName];
    const stats = this.tierStats[tierName];
    
    // Check item limit
    while (tier.size >= config.maxItems) {
      await this.evictFromTier(tierName);
    }
    
    // Check size limit
    while (stats.size + requiredSize > config.maxSize) {
      await this.evictFromTier(tierName);
    }
  }

  /**
   * Evict item from tier
   */
  async evictFromTier(tierName) {
    const tier = this.tiers[tierName];
    
    if (tier.size === 0) return;
    
    // Choose eviction candidate
    const candidate = this.chooseEvictionCandidate(tierName);
    
    if (!candidate) {
      // Fallback to FIFO
      const firstKey = tier.keys().next().value;
      await this.delete(firstKey);
      this.stats.evictions++;
      return;
    }
    
    // Try to demote instead of evict
    const nextTier = this.getNextTier(tierName);
    if (nextTier) {
      await this.demoteToTier(candidate, tierName, nextTier);
      this.stats.demotions++;
    } else {
      await this.delete(candidate);
      this.stats.evictions++;
    }
  }

  /**
   * Choose eviction candidate
   */
  chooseEvictionCandidate(tierName) {
    const tier = this.tiers[tierName];
    let candidates = [];
    
    for (const key of tier.keys()) {
      const metadata = this.metadata.get(key);
      if (!metadata) continue;
      
      // Calculate eviction score
      const score = this.calculateEvictionScore(metadata);
      candidates.push({ key, score });
    }
    
    // Sort by score (higher = more likely to evict)
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates[0]?.key;
  }

  /**
   * Calculate eviction score
   */
  calculateEvictionScore(metadata) {
    const now = Date.now();
    const age = now - metadata.created;
    const idleTime = now - metadata.lastAccessed;
    const accessRate = metadata.accessCount / (age / 1000); // per second
    
    // Higher score = more likely to evict
    let score = 0;
    
    // Factor in idle time (longer idle = higher score)
    score += idleTime / 1000;
    
    // Factor in access frequency (lower frequency = higher score)
    score += 1 / (accessRate + 1);
    
    // Factor in size (larger = higher score)
    score += metadata.size / 1024;
    
    // Factor in priority (lower priority = higher score)
    if (metadata.priority === 'low') score *= 2;
    if (metadata.priority === 'high') score *= 0.5;
    
    // Factor in TTL expiration
    if (metadata.created + metadata.ttl < now) {
      score *= 10; // Expired items get high eviction score
    }
    
    return score;
  }

  /**
   * Get next tier for demotion
   */
  getNextTier(currentTier) {
    const tiers = ['hot', 'warm', 'cold'];
    const index = tiers.indexOf(currentTier);
    return index < tiers.length - 1 ? tiers[index + 1] : null;
  }

  /**
   * Get previous tier for promotion
   */
  getPreviousTier(currentTier) {
    const tiers = ['hot', 'warm', 'cold'];
    const index = tiers.indexOf(currentTier);
    return index > 0 ? tiers[index - 1] : null;
  }

  /**
   * Demote item to lower tier
   */
  async demoteToTier(key, fromTier, toTier) {
    const value = this.tiers[fromTier].get(key);
    const metadata = this.metadata.get(key);
    
    if (!value || !metadata) return;
    
    // Remove from current tier
    this.tiers[fromTier].delete(key);
    this.tierStats[fromTier].items--;
    this.tierStats[fromTier].size -= metadata.size;
    
    // Add to new tier
    this.tiers[toTier].set(key, value);
    this.tierStats[toTier].items++;
    this.tierStats[toTier].size += metadata.size;
    
    // Update metadata
    metadata.tier = toTier;
    
    this.emit('cache:demoted', { key, from: fromTier, to: toTier });
  }

  /**
   * Consider promoting item to higher tier
   */
  considerPromotion(key, currentTier, value) {
    const metadata = this.metadata.get(key);
    if (!metadata) return;
    
    // Check access frequency
    const accessRate = metadata.accessCount / ((Date.now() - metadata.created) / 1000);
    
    // Promote if frequently accessed
    if (accessRate > 1 && currentTier !== 'hot') {
      const targetTier = this.getPreviousTier(currentTier);
      if (targetTier) {
        this.promoteToTier(key, currentTier, targetTier, value);
      }
    }
  }

  /**
   * Promote item to higher tier
   */
  async promoteToTier(key, fromTier, toTier, value) {
    const metadata = this.metadata.get(key);
    if (!metadata) return;
    
    // Ensure space in target tier
    await this.ensureSpace(toTier, metadata.size);
    
    // Remove from current tier
    this.tiers[fromTier].delete(key);
    this.tierStats[fromTier].items--;
    this.tierStats[fromTier].size -= metadata.size;
    
    // Decompress if moving to hot tier
    let storedValue = value;
    if (toTier === 'hot' && this.isCompressed(value)) {
      storedValue = await this.decompress(value);
      metadata.compressed = false;
    }
    
    // Add to new tier
    this.tiers[toTier].set(key, storedValue);
    this.tierStats[toTier].items++;
    this.tierStats[toTier].size += metadata.size;
    
    // Update metadata
    metadata.tier = toTier;
    
    this.stats.promotions++;
    this.emit('cache:promoted', { key, from: fromTier, to: toTier });
  }

  /**
   * Update access metadata
   */
  updateAccessMetadata(key, tier) {
    const metadata = this.metadata.get(key);
    if (metadata) {
      metadata.lastAccessed = Date.now();
      metadata.accessCount++;
    }
  }

  /**
   * Track access pattern
   */
  trackAccessPattern(key) {
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        timestamps: [],
        sequences: []
      });
    }
    
    const pattern = this.accessPatterns.get(key);
    const now = Date.now();
    
    pattern.timestamps.push(now);
    
    // Keep only recent history
    const cutoff = now - 3600000; // 1 hour
    pattern.timestamps = pattern.timestamps.filter(t => t > cutoff);
    
    // Detect access patterns
    this.detectAccessPattern(key, pattern);
  }

  /**
   * Detect access patterns
   */
  detectAccessPattern(key, pattern) {
    if (pattern.timestamps.length < 3) return;
    
    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < pattern.timestamps.length; i++) {
      intervals.push(pattern.timestamps[i] - pattern.timestamps[i - 1]);
    }
    
    // Check for regular pattern
    if (intervals.length > 2) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      
      // Low variance indicates regular pattern
      if (stdDev < avgInterval * 0.2) {
        pattern.type = 'regular';
        pattern.interval = avgInterval;
        
        // Schedule prefetch
        if (this.config.prefetching) {
          this.schedulePrefetch(key, avgInterval);
        }
      }
    }
  }

  /**
   * Track dependencies
   */
  trackDependencies(key, dependencies) {
    for (const dep of dependencies) {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep).add(key);
    }
  }

  /**
   * Invalidate dependent keys
   */
  invalidateDependents(key) {
    const dependents = this.dependencies.get(key);
    if (!dependents) return;
    
    for (const dependent of dependents) {
      this.delete(dependent);
    }
    
    this.dependencies.delete(key);
  }

  /**
   * Trigger prefetch
   */
  triggerPrefetch(key) {
    // Look for related keys to prefetch
    const metadata = this.metadata.get(key);
    if (!metadata) return;
    
    // Prefetch based on tags
    if (metadata.tags.length > 0) {
      this.prefetchByTags(metadata.tags);
    }
    
    // Prefetch based on access sequences
    const pattern = this.accessPatterns.get(key);
    if (pattern && pattern.sequences.length > 0) {
      const nextKey = pattern.sequences[0];
      this.prefetchKey(nextKey);
    }
  }

  /**
   * Prefetch by tags
   */
  prefetchByTags(tags) {
    for (const [key, metadata] of this.metadata) {
      if (tags.some(tag => metadata.tags.includes(tag))) {
        this.prefetchKey(key);
      }
    }
  }

  /**
   * Prefetch specific key
   */
  async prefetchKey(key) {
    // Move to hot tier if not already there
    const metadata = this.metadata.get(key);
    if (!metadata || metadata.tier === 'hot') return;
    
    const value = await this.get(key, { promote: false });
    if (value) {
      await this.promoteToTier(key, metadata.tier, 'hot', value);
      this.stats.prefetchHits++;
    }
  }

  /**
   * Schedule prefetch
   */
  schedulePrefetch(key, interval) {
    setTimeout(() => {
      this.prefetchKey(key);
    }, interval * 0.9); // Prefetch slightly before expected access
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired items
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, metadata] of this.metadata) {
      if (metadata.created + metadata.ttl < now) {
        this.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired items`);
    }
  }

  /**
   * Start tier management
   */
  startTierManagement() {
    this.tierInterval = setInterval(() => {
      this.manageTiers();
    }, 30000); // Every 30 seconds
  }

  /**
   * Manage cache tiers
   */
  manageTiers() {
    // Analyze access patterns and adjust tiers
    for (const [key, metadata] of this.metadata) {
      const pattern = this.accessPatterns.get(key);
      if (!pattern) continue;
      
      // Calculate access frequency
      const accessRate = metadata.accessCount / ((Date.now() - metadata.created) / 1000);
      
      // Promote frequently accessed items
      if (accessRate > 2 && metadata.tier !== 'hot') {
        const value = this.getValueFromTier(key, metadata.tier);
        if (value) {
          this.promoteToTier(key, metadata.tier, 'hot', value);
        }
      }
      
      // Demote rarely accessed items
      if (accessRate < 0.1 && metadata.tier === 'hot') {
        const value = this.getValueFromTier(key, metadata.tier);
        if (value) {
          this.demoteToTier(key, metadata.tier, 'warm');
        }
      }
    }
  }

  /**
   * Start prefetch predictor
   */
  startPrefetchPredictor() {
    // This would use ML in production
    // For now, simple sequence tracking
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      overall: this.stats,
      tiers: this.tierStats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      compressionRatio: this.stats.bytesSaved / this.stats.bytesCompressed || 0,
      totalItems: this.metadata.size,
      totalSize: Object.values(this.tierStats).reduce((sum, tier) => sum + tier.size, 0)
    };
  }

  /**
   * Get cache info
   */
  getInfo() {
    const info = {
      tiers: {}
    };
    
    for (const [tierName, tier] of Object.entries(this.tiers)) {
      info.tiers[tierName] = {
        items: tier.size,
        size: this.tierStats[tierName].size,
        maxItems: this.config.tiers[tierName].maxItems,
        maxSize: this.config.tiers[tierName].maxSize,
        utilization: (this.tierStats[tierName].size / this.config.tiers[tierName].maxSize) * 100
      };
    }
    
    return info;
  }

  /**
   * Stop cache system
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.tierInterval) {
      clearInterval(this.tierInterval);
    }
    
    logger.info('Cache system stopped');
  }
}

// Export singleton instance
module.exports = new IntelligentCacheSystem();