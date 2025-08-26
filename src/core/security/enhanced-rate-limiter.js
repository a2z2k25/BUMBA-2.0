/**
 * BUMBA Enhanced Rate Limiter
 * Comprehensive rate limiting with multiple strategies and intelligent throttling
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const crypto = require('crypto');

class EnhancedRateLimiter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Rate limiting strategies
    this.strategies = {
      SLIDING_WINDOW: 'sliding_window',
      TOKEN_BUCKET: 'token_bucket',
      FIXED_WINDOW: 'fixed_window',
      LEAKY_BUCKET: 'leaky_bucket',
      ADAPTIVE: 'adaptive'
    };
    
    this.config = {
      defaultStrategy: options.defaultStrategy || this.strategies.SLIDING_WINDOW,
      cleanupInterval: options.cleanupInterval || 60000, // 1 minute
      blacklistDuration: options.blacklistDuration || 3600000, // 1 hour
      adaptiveScaling: options.adaptiveScaling !== false,
      distributedMode: options.distributedMode || false,
      persistState: options.persistState !== false,
      ...options
    };
    
    // Storage for different strategies
    this.limits = new Map(); // Resource -> limit config
    this.slidingWindows = new Map(); // For sliding window
    this.tokenBuckets = new Map(); // For token bucket
    this.fixedWindows = new Map(); // For fixed window
    this.leakyBuckets = new Map(); // For leaky bucket
    
    // Advanced tracking
    this.blacklist = new Map(); // identifier -> blacklist info
    this.whitelist = new Set(); // Whitelisted identifiers
    this.reputations = new Map(); // Track identifier reputation
    this.patterns = new Map(); // Attack pattern detection
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      blacklistedIdentifiers: 0,
      detectedPatterns: 0,
      strategyUsage: {},
      resourceMetrics: new Map()
    };
    
    this.initializeStrategies();
    this.startCleanup();
  }

  /**
   * Initialize rate limiting strategies
   */
  initializeStrategies() {
    // Initialize strategy-specific settings
    for (const strategy of Object.values(this.strategies)) {
      this.metrics.strategyUsage[strategy] = 0;
    }
  }

  /**
   * Configure rate limit for a resource
   */
  configure(resource, config) {
    const limitConfig = {
      resource,
      limit: config.limit || 100,
      window: config.window || 60000, // 1 minute default
      strategy: config.strategy || this.config.defaultStrategy,
      burst: config.burst || config.limit,
      priority: config.priority || 'normal',
      
      // Advanced options
      adaptiveScaling: config.adaptiveScaling !== false,
      costFunction: config.costFunction || null,
      penaltyMultiplier: config.penaltyMultiplier || 2,
      autoBlacklist: config.autoBlacklist !== false,
      blacklistThreshold: config.blacklistThreshold || 10,
      
      // Per-resource overrides
      whitelist: config.whitelist || [],
      customRules: config.customRules || [],
      
      // Response configuration
      blockDuration: config.blockDuration || 60000,
      messageTemplate: config.messageTemplate || 'Rate limit exceeded',
      headers: config.headers !== false
    };
    
    this.limits.set(resource, limitConfig);
    
    // Initialize resource metrics
    if (!this.metrics.resourceMetrics.has(resource)) {
      this.metrics.resourceMetrics.set(resource, {
        requests: 0,
        allowed: 0,
        blocked: 0,
        averageRate: 0
      });
    }
    
    // Add to whitelist if specified
    if (limitConfig.whitelist.length > 0) {
      limitConfig.whitelist.forEach(id => this.whitelist.add(id));
    }
    
    this.emit('limit:configured', { resource, config: limitConfig });
    logger.info(`Rate limit configured for ${resource}: ${limitConfig.limit}/${limitConfig.window}ms`);
    
    return limitConfig;
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(resource, identifier, cost = 1) {
    this.metrics.totalRequests++;
    
    // Check whitelist
    if (this.whitelist.has(identifier)) {
      this.metrics.allowedRequests++;
      return this.createAllowedResponse(resource, identifier);
    }
    
    // Check blacklist
    const blacklistInfo = this.checkBlacklist(identifier);
    if (blacklistInfo.blocked) {
      this.metrics.blockedRequests++;
      return this.createBlockedResponse(resource, identifier, blacklistInfo);
    }
    
    // Get limit configuration
    const config = this.limits.get(resource);
    if (!config) {
      // No limit configured, allow by default
      this.metrics.allowedRequests++;
      return this.createAllowedResponse(resource, identifier);
    }
    
    // Update resource metrics
    const resourceMetrics = this.metrics.resourceMetrics.get(resource);
    resourceMetrics.requests++;
    
    // Apply strategy
    let result;
    switch (config.strategy) {
      case this.strategies.SLIDING_WINDOW:
        result = await this.checkSlidingWindow(resource, identifier, cost, config);
        break;
      case this.strategies.TOKEN_BUCKET:
        result = await this.checkTokenBucket(resource, identifier, cost, config);
        break;
      case this.strategies.FIXED_WINDOW:
        result = await this.checkFixedWindow(resource, identifier, cost, config);
        break;
      case this.strategies.LEAKY_BUCKET:
        result = await this.checkLeakyBucket(resource, identifier, cost, config);
        break;
      case this.strategies.ADAPTIVE:
        result = await this.checkAdaptive(resource, identifier, cost, config);
        break;
      default:
        result = await this.checkSlidingWindow(resource, identifier, cost, config);
    }
    
    // Update metrics
    this.metrics.strategyUsage[config.strategy]++;
    
    if (result.allowed) {
      this.metrics.allowedRequests++;
      resourceMetrics.allowed++;
      this.updateReputation(identifier, 1);
    } else {
      this.metrics.blockedRequests++;
      resourceMetrics.blocked++;
      this.updateReputation(identifier, -1);
      
      // Check for auto-blacklist
      if (config.autoBlacklist) {
        this.checkAutoBlacklist(identifier, config);
      }
      
      // Detect patterns
      this.detectAttackPatterns(identifier, resource);
    }
    
    // Emit events
    this.emit('limit:checked', {
      resource,
      identifier,
      allowed: result.allowed,
      strategy: config.strategy
    });
    
    return result;
  }

  /**
   * Sliding window rate limiting
   */
  async checkSlidingWindow(resource, identifier, cost, config) {
    const key = `${resource}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.window;
    
    // Get or create window
    if (!this.slidingWindows.has(key)) {
      this.slidingWindows.set(key, []);
    }
    
    const window = this.slidingWindows.get(key);
    
    // Remove old entries
    const validEntries = window.filter(timestamp => timestamp > windowStart);
    
    // Check if adding this request would exceed limit
    const currentCount = validEntries.reduce((sum, entry) => {
      return sum + (entry.cost || 1);
    }, 0);
    
    if (currentCount + cost > config.limit) {
      const oldestEntry = validEntries[0];
      const resetTime = oldestEntry ? oldestEntry + config.window : now + config.window;
      
      return {
        allowed: false,
        limit: config.limit,
        remaining: Math.max(0, config.limit - currentCount),
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }
    
    // Add new entry
    validEntries.push({ timestamp: now, cost });
    this.slidingWindows.set(key, validEntries);
    
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - (currentCount + cost),
      resetTime: now + config.window
    };
  }

  /**
   * Token bucket rate limiting
   */
  async checkTokenBucket(resource, identifier, cost, config) {
    const key = `${resource}:${identifier}`;
    const now = Date.now();
    
    // Get or create bucket
    if (!this.tokenBuckets.has(key)) {
      this.tokenBuckets.set(key, {
        tokens: config.burst || config.limit,
        lastRefill: now
      });
    }
    
    const bucket = this.tokenBuckets.get(key);
    
    // Refill tokens
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / config.window) * config.limit;
    bucket.tokens = Math.min(config.burst || config.limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if enough tokens
    if (bucket.tokens < cost) {
      const tokensNeeded = cost - bucket.tokens;
      const timeToWait = (tokensNeeded / config.limit) * config.window;
      
      return {
        allowed: false,
        limit: config.limit,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + timeToWait,
        retryAfter: Math.ceil(timeToWait / 1000)
      };
    }
    
    // Consume tokens
    bucket.tokens -= cost;
    
    return {
      allowed: true,
      limit: config.limit,
      remaining: Math.floor(bucket.tokens),
      resetTime: now + config.window
    };
  }

  /**
   * Fixed window rate limiting
   */
  async checkFixedWindow(resource, identifier, cost, config) {
    const key = `${resource}:${identifier}`;
    const now = Date.now();
    const windowId = Math.floor(now / config.window);
    
    // Get or create window
    if (!this.fixedWindows.has(key)) {
      this.fixedWindows.set(key, {
        windowId,
        count: 0
      });
    }
    
    const window = this.fixedWindows.get(key);
    
    // Reset if new window
    if (window.windowId !== windowId) {
      window.windowId = windowId;
      window.count = 0;
    }
    
    // Check limit
    if (window.count + cost > config.limit) {
      const windowEnd = (windowId + 1) * config.window;
      
      return {
        allowed: false,
        limit: config.limit,
        remaining: Math.max(0, config.limit - window.count),
        resetTime: windowEnd,
        retryAfter: Math.ceil((windowEnd - now) / 1000)
      };
    }
    
    // Increment count
    window.count += cost;
    
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - window.count,
      resetTime: (windowId + 1) * config.window
    };
  }

  /**
   * Leaky bucket rate limiting
   */
  async checkLeakyBucket(resource, identifier, cost, config) {
    const key = `${resource}:${identifier}`;
    const now = Date.now();
    
    // Get or create bucket
    if (!this.leakyBuckets.has(key)) {
      this.leakyBuckets.set(key, {
        volume: 0,
        lastLeak: now
      });
    }
    
    const bucket = this.leakyBuckets.get(key);
    
    // Leak based on time passed
    const timePassed = now - bucket.lastLeak;
    const leakAmount = (timePassed / config.window) * config.limit;
    bucket.volume = Math.max(0, bucket.volume - leakAmount);
    bucket.lastLeak = now;
    
    // Check if bucket would overflow
    if (bucket.volume + cost > config.limit) {
      const overflow = (bucket.volume + cost) - config.limit;
      const timeToWait = (overflow / config.limit) * config.window;
      
      return {
        allowed: false,
        limit: config.limit,
        remaining: Math.max(0, config.limit - bucket.volume),
        resetTime: now + timeToWait,
        retryAfter: Math.ceil(timeToWait / 1000)
      };
    }
    
    // Add to bucket
    bucket.volume += cost;
    
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - bucket.volume,
      resetTime: now + config.window
    };
  }

  /**
   * Adaptive rate limiting
   */
  async checkAdaptive(resource, identifier, cost, config) {
    // Get reputation score
    const reputation = this.getReputation(identifier);
    
    // Adjust limits based on reputation
    const adjustedLimit = Math.round(config.limit * (0.5 + reputation));
    const adjustedConfig = { ...config, limit: adjustedLimit };
    
    // Use sliding window with adjusted limits
    const result = await this.checkSlidingWindow(resource, identifier, cost, adjustedConfig);
    
    // Add adaptive info
    result.adaptive = {
      reputation,
      originalLimit: config.limit,
      adjustedLimit
    };
    
    return result;
  }

  /**
   * Check blacklist status
   */
  checkBlacklist(identifier) {
    const blacklistEntry = this.blacklist.get(identifier);
    
    if (!blacklistEntry) {
      return { blocked: false };
    }
    
    const now = Date.now();
    
    // Check if blacklist expired
    if (now > blacklistEntry.until) {
      this.blacklist.delete(identifier);
      this.metrics.blacklistedIdentifiers--;
      return { blocked: false };
    }
    
    return {
      blocked: true,
      reason: blacklistEntry.reason,
      until: blacklistEntry.until,
      remainingTime: blacklistEntry.until - now
    };
  }

  /**
   * Add to blacklist
   */
  addToBlacklist(identifier, duration = this.config.blacklistDuration, reason = 'Rate limit violations') {
    const until = Date.now() + duration;
    
    this.blacklist.set(identifier, {
      identifier,
      reason,
      until,
      addedAt: Date.now(),
      violations: (this.blacklist.get(identifier)?.violations || 0) + 1
    });
    
    this.metrics.blacklistedIdentifiers++;
    
    this.emit('blacklist:added', { identifier, until, reason });
    logger.warn(`Added to blacklist: ${identifier} until ${new Date(until).toISOString()}`);
  }

  /**
   * Remove from blacklist
   */
  removeFromBlacklist(identifier) {
    if (this.blacklist.delete(identifier)) {
      this.metrics.blacklistedIdentifiers--;
      this.emit('blacklist:removed', { identifier });
      logger.info(`Removed from blacklist: ${identifier}`);
      return true;
    }
    return false;
  }

  /**
   * Add to whitelist
   */
  addToWhitelist(identifier) {
    this.whitelist.add(identifier);
    this.emit('whitelist:added', { identifier });
    logger.info(`Added to whitelist: ${identifier}`);
  }

  /**
   * Remove from whitelist
   */
  removeFromWhitelist(identifier) {
    if (this.whitelist.delete(identifier)) {
      this.emit('whitelist:removed', { identifier });
      logger.info(`Removed from whitelist: ${identifier}`);
      return true;
    }
    return false;
  }

  /**
   * Update reputation score
   */
  updateReputation(identifier, change) {
    const current = this.reputations.get(identifier) || 0.5;
    const updated = Math.max(0, Math.min(1, current + (change * 0.01)));
    this.reputations.set(identifier, updated);
    
    return updated;
  }

  /**
   * Get reputation score
   */
  getReputation(identifier) {
    return this.reputations.get(identifier) || 0.5;
  }

  /**
   * Check for auto-blacklist
   */
  checkAutoBlacklist(identifier, config) {
    const key = `violations:${identifier}`;
    const violations = (this.patterns.get(key) || 0) + 1;
    this.patterns.set(key, violations);
    
    if (violations >= config.blacklistThreshold) {
      this.addToBlacklist(identifier, config.blacklistDuration, 'Exceeded violation threshold');
      this.patterns.delete(key);
    }
  }

  /**
   * Detect attack patterns
   */
  detectAttackPatterns(identifier, resource) {
    const patternKey = `pattern:${identifier}`;
    const pattern = this.patterns.get(patternKey) || {
      resources: new Set(),
      timestamps: [],
      detected: false
    };
    
    pattern.resources.add(resource);
    pattern.timestamps.push(Date.now());
    
    // Keep only recent timestamps (last minute)
    const oneMinuteAgo = Date.now() - 60000;
    pattern.timestamps = pattern.timestamps.filter(t => t > oneMinuteAgo);
    
    // Detect patterns
    if (!pattern.detected) {
      // Rapid fire: Many requests in short time
      if (pattern.timestamps.length > 100) {
        pattern.detected = 'rapid-fire';
        this.metrics.detectedPatterns++;
        this.emit('pattern:detected', {
          identifier,
          pattern: 'rapid-fire',
          requestCount: pattern.timestamps.length
        });
      }
      
      // Resource scanning: Hitting many different resources
      if (pattern.resources.size > 20) {
        pattern.detected = 'resource-scanning';
        this.metrics.detectedPatterns++;
        this.emit('pattern:detected', {
          identifier,
          pattern: 'resource-scanning',
          resourceCount: pattern.resources.size
        });
      }
      
      // If pattern detected, increase blacklist duration
      if (pattern.detected) {
        this.addToBlacklist(identifier, this.config.blacklistDuration * 2, `Attack pattern: ${pattern.detected}`);
      }
    }
    
    this.patterns.set(patternKey, pattern);
  }

  /**
   * Create allowed response
   */
  createAllowedResponse(resource, identifier) {
    const config = this.limits.get(resource);
    
    return {
      allowed: true,
      identifier,
      resource,
      limit: config?.limit || Infinity,
      remaining: config?.limit || Infinity,
      resetTime: Date.now() + (config?.window || 0)
    };
  }

  /**
   * Create blocked response
   */
  createBlockedResponse(resource, identifier, blacklistInfo) {
    return {
      allowed: false,
      identifier,
      resource,
      reason: blacklistInfo.reason || 'Rate limit exceeded',
      retryAfter: Math.ceil(blacklistInfo.remainingTime / 1000) || 60,
      blacklisted: true
    };
  }

  /**
   * Apply rate limit headers to response
   */
  applyHeaders(response, result) {
    if (!response || !response.setHeader) return;
    
    response.setHeader('X-RateLimit-Limit', result.limit || '');
    response.setHeader('X-RateLimit-Remaining', result.remaining || 0);
    response.setHeader('X-RateLimit-Reset', result.resetTime || '');
    
    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfter || 60);
    }
    
    if (result.adaptive) {
      response.setHeader('X-RateLimit-Reputation', result.adaptive.reputation);
    }
  }

  /**
   * Express/Connect middleware
   */
  middleware(resource, options = {}) {
    return async (req, res, next) => {
      // Determine identifier
      const identifier = this.getIdentifier(req, options);
      
      // Calculate cost
      const cost = options.costFunction ? options.costFunction(req) : 1;
      
      // Check limit
      const result = await this.checkLimit(resource, identifier, cost);
      
      // Apply headers
      this.applyHeaders(res, result);
      
      if (!result.allowed) {
        // Rate limit exceeded
        const status = result.blacklisted ? 403 : 429;
        const message = result.reason || 'Too Many Requests';
        
        return res.status(status).json({
          error: message,
          retryAfter: result.retryAfter
        });
      }
      
      // Request allowed
      next();
    };
  }

  /**
   * Get identifier from request
   */
  getIdentifier(req, options) {
    if (options.identifier) {
      return typeof options.identifier === 'function'
        ? options.identifier(req)
        : options.identifier;
    }
    
    // Default identifiers
    return req.ip || 
           req.connection?.remoteAddress || 
           req.headers['x-forwarded-for'] || 
           'unknown';
  }

  /**
   * Start cleanup timer
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean sliding windows
    for (const [key, window] of this.slidingWindows) {
      const config = this.limits.get(key.split(':')[0]);
      if (config) {
        const windowStart = now - config.window;
        const validEntries = window.filter(entry => entry.timestamp > windowStart);
        
        if (validEntries.length === 0) {
          this.slidingWindows.delete(key);
          cleaned++;
        } else {
          this.slidingWindows.set(key, validEntries);
        }
      }
    }
    
    // Clean expired blacklist entries
    for (const [identifier, entry] of this.blacklist) {
      if (now > entry.until) {
        this.blacklist.delete(identifier);
        this.metrics.blacklistedIdentifiers--;
        cleaned++;
      }
    }
    
    // Clean old patterns
    for (const [key, pattern] of this.patterns) {
      if (key.startsWith('pattern:')) {
        const oneMinuteAgo = now - 60000;
        pattern.timestamps = pattern.timestamps.filter(t => t > oneMinuteAgo);
        
        if (pattern.timestamps.length === 0) {
          this.patterns.delete(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} entries`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      blacklistSize: this.blacklist.size,
      whitelistSize: this.whitelist.size,
      reputationScores: this.reputations.size,
      activePatterns: Array.from(this.patterns.keys()).filter(k => k.startsWith('pattern:')).length
    };
  }

  /**
   * Reset all limits and metrics
   */
  reset() {
    this.slidingWindows.clear();
    this.tokenBuckets.clear();
    this.fixedWindows.clear();
    this.leakyBuckets.clear();
    this.blacklist.clear();
    this.patterns.clear();
    this.reputations.clear();
    
    // Reset metrics
    this.metrics.totalRequests = 0;
    this.metrics.allowedRequests = 0;
    this.metrics.blockedRequests = 0;
    this.metrics.blacklistedIdentifiers = 0;
    this.metrics.detectedPatterns = 0;
    
    for (const strategy of Object.values(this.strategies)) {
      this.metrics.strategyUsage[strategy] = 0;
    }
    
    this.metrics.resourceMetrics.clear();
    
    logger.info('Rate limiter reset complete');
  }

  /**
   * Stop the rate limiter
   */
  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Export singleton instance
module.exports = new EnhancedRateLimiter();