/**
 * BUMBA Command Rate Limiter
 * Prevents command flooding and ensures fair usage
 */

const { logger } = require('../logging/bumba-logger');

class CommandRateLimiter {
  constructor(options = {}) {
    this.options = {
      windowSize: options.windowSize || 60000, // 1 minute default
      maxRequests: options.maxRequests || 30, // 30 requests per window
      blockDuration: options.blockDuration || 300000, // 5 minutes block
      enableBurst: options.enableBurst !== false,
      burstSize: options.burstSize || 5,
      cleanupInterval: options.cleanupInterval || 60000, // Cleanup every minute
      ...options
    };
    
    // Rate limit buckets
    this.buckets = new Map();
    
    // Blocked users
    this.blocked = new Map();
    
    // Command-specific limits
    this.commandLimits = new Map([
      ['deploy', { maxRequests: 5, windowSize: 300000 }], // 5 per 5 minutes
      ['urgent', { maxRequests: 3, windowSize: 60000 }], // 3 per minute
      ['secure', { maxRequests: 10, windowSize: 60000 }], // 10 per minute
      ['test', { maxRequests: 20, windowSize: 60000 }], // 20 per minute
      ['implement', { maxRequests: 15, windowSize: 60000 }], // 15 per minute
    ]);
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      commandStats: new Map()
    };
    
    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(command, identifier = 'global') {
    this.stats.totalRequests++;
    
    // Check if user is blocked
    if (this.isBlocked(identifier)) {
      this.stats.blockedRequests++;
      return {
        allowed: false,
        reason: 'User is temporarily blocked',
        retryAfter: this.getBlockRemainingTime(identifier)
      };
    }
    
    // Get limits for this command
    const limits = this.getCommandLimits(command);
    
    // Get or create bucket for this identifier
    const bucketKey = `${identifier}-${command}`;
    let bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      bucket = this.createBucket(limits);
      this.buckets.set(bucketKey, bucket);
    }
    
    // Clean old requests from bucket
    this.cleanBucket(bucket, limits);
    
    // Check if within limits
    const result = this.checkBucket(bucket, limits);
    
    if (result.allowed) {
      // Add request to bucket
      bucket.requests.push({
        timestamp: Date.now(),
        command
      });
      
      // Update statistics
      this.stats.allowedRequests++;
      this.updateCommandStats(command, 'allowed');
      
      // Check for burst
      if (this.options.enableBurst && bucket.burstAvailable > 0) {
        bucket.burstAvailable--;
      }
      
    } else {
      // Rate limited
      this.stats.rateLimitedRequests++;
      this.updateCommandStats(command, 'limited');
      
      // Check if should block user
      bucket.violations = (bucket.violations || 0) + 1;
      
      if (bucket.violations >= 3) {
        this.blockUser(identifier, this.options.blockDuration);
        result.reason = 'Too many rate limit violations - user blocked';
      }
    }
    
    return result;
  }

  /**
   * Get command-specific limits
   */
  getCommandLimits(command) {
    const specific = this.commandLimits.get(command);
    if (specific) {
      return {
        ...this.options,
        ...specific
      };
    }
    
    // Default limits based on command category
    if (this.isHighRiskCommand(command)) {
      return {
        ...this.options,
        maxRequests: Math.floor(this.options.maxRequests / 3),
        windowSize: this.options.windowSize * 2
      };
    }
    
    if (this.isReadOnlyCommand(command)) {
      return {
        ...this.options,
        maxRequests: this.options.maxRequests * 2,
        windowSize: this.options.windowSize
      };
    }
    
    return this.options;
  }

  /**
   * Create a new bucket
   */
  createBucket(limits) {
    return {
      requests: [],
      createdAt: Date.now(),
      burstAvailable: limits.burstSize || this.options.burstSize,
      violations: 0
    };
  }

  /**
   * Clean old requests from bucket
   */
  cleanBucket(bucket, limits) {
    const now = Date.now();
    const cutoff = now - limits.windowSize;
    
    // Remove old requests
    bucket.requests = bucket.requests.filter(req => req.timestamp > cutoff);
    
    // Replenish burst tokens
    if (this.options.enableBurst) {
      const timeSinceCreation = now - bucket.createdAt;
      const windowsPassed = Math.floor(timeSinceCreation / limits.windowSize);
      
      if (windowsPassed > 0) {
        bucket.burstAvailable = Math.min(
          limits.burstSize || this.options.burstSize,
          bucket.burstAvailable + windowsPassed
        );
        bucket.createdAt = now;
      }
    }
  }

  /**
   * Check if bucket is within limits
   */
  checkBucket(bucket, limits) {
    const requestCount = bucket.requests.length;
    const maxAllowed = limits.maxRequests;
    
    // Check burst allowance
    if (this.options.enableBurst && bucket.burstAvailable > 0) {
      // Allow burst
      return {
        allowed: true,
        remaining: maxAllowed - requestCount + bucket.burstAvailable,
        resetTime: this.getResetTime(bucket, limits),
        burst: true
      };
    }
    
    // Check normal limit
    if (requestCount < maxAllowed) {
      return {
        allowed: true,
        remaining: maxAllowed - requestCount - 1,
        resetTime: this.getResetTime(bucket, limits)
      };
    }
    
    // Rate limited
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfter: this.getRetryAfter(bucket, limits),
      resetTime: this.getResetTime(bucket, limits)
    };
  }

  /**
   * Get reset time for bucket
   */
  getResetTime(bucket, limits) {
    if (bucket.requests.length === 0) {
      return Date.now() + limits.windowSize;
    }
    
    const oldestRequest = bucket.requests[0];
    return oldestRequest.timestamp + limits.windowSize;
  }

  /**
   * Get retry after time
   */
  getRetryAfter(bucket, limits) {
    const resetTime = this.getResetTime(bucket, limits);
    const retryAfter = Math.max(0, resetTime - Date.now());
    return Math.ceil(retryAfter / 1000); // Return in seconds
  }

  /**
   * Block a user
   */
  blockUser(identifier, duration = this.options.blockDuration) {
    const blockUntil = Date.now() + duration;
    this.blocked.set(identifier, {
      until: blockUntil,
      blockedAt: Date.now(),
      reason: 'Rate limit violations'
    });
    
    logger.warn(`User ${identifier} blocked until ${new Date(blockUntil).toISOString()}`);
  }

  /**
   * Unblock a user
   */
  unblockUser(identifier) {
    if (this.blocked.delete(identifier)) {
      logger.info(`User ${identifier} unblocked`);
      return true;
    }
    return false;
  }

  /**
   * Check if user is blocked
   */
  isBlocked(identifier) {
    const block = this.blocked.get(identifier);
    if (!block) return false;
    
    if (Date.now() > block.until) {
      // Block expired
      this.blocked.delete(identifier);
      return false;
    }
    
    return true;
  }

  /**
   * Get remaining block time
   */
  getBlockRemainingTime(identifier) {
    const block = this.blocked.get(identifier);
    if (!block) return 0;
    
    const remaining = Math.max(0, block.until - Date.now());
    return Math.ceil(remaining / 1000); // Return in seconds
  }

  /**
   * Check if command is high risk
   */
  isHighRiskCommand(command) {
    const highRisk = ['deploy', 'urgent', 'secure', 'admin', 'settings'];
    return highRisk.includes(command);
  }

  /**
   * Check if command is read-only
   */
  isReadOnlyCommand(command) {
    const readOnly = ['help', 'status', 'menu', 'docs', 'analyze'];
    return readOnly.includes(command) || command.startsWith('docs-');
  }

  /**
   * Update command statistics
   */
  updateCommandStats(command, result) {
    if (!this.stats.commandStats.has(command)) {
      this.stats.commandStats.set(command, {
        total: 0,
        allowed: 0,
        limited: 0
      });
    }
    
    const cmdStats = this.stats.commandStats.get(command);
    cmdStats.total++;
    cmdStats[result]++;
  }

  /**
   * Start cleanup timer
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clean up old buckets and expired blocks
   */
  cleanup() {
    const now = Date.now();
    
    // Clean up old buckets
    for (const [key, bucket] of this.buckets) {
      // Remove if no requests in last 2 windows
      const lastRequest = bucket.requests[bucket.requests.length - 1];
      if (!lastRequest || now - lastRequest.timestamp > this.options.windowSize * 2) {
        this.buckets.delete(key);
      }
    }
    
    // Clean up expired blocks
    for (const [id, block] of this.blocked) {
      if (now > block.until) {
        this.blocked.delete(id);
      }
    }
    
    logger.debug(`Rate limiter cleanup: ${this.buckets.size} buckets, ${this.blocked.size} blocked`);
  }

  /**
   * Reset rate limiter
   */
  reset() {
    this.buckets.clear();
    this.blocked.clear();
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      commandStats: new Map()
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const commandStats = {};
    for (const [cmd, stats] of this.stats.commandStats) {
      commandStats[cmd] = {
        ...stats,
        limitRate: stats.total > 0 ? 
          ((stats.limited / stats.total) * 100).toFixed(2) + '%' : '0%'
      };
    }
    
    return {
      ...this.stats,
      commandStats,
      activeBuckets: this.buckets.size,
      blockedUsers: this.blocked.size,
      allowRate: this.stats.totalRequests > 0 ?
        ((this.stats.allowedRequests / this.stats.totalRequests) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Get configuration for a command
   */
  getCommandConfig(command) {
    return this.getCommandLimits(command);
  }

  /**
   * Update command-specific limits
   */
  setCommandLimit(command, limits) {
    this.commandLimits.set(command, limits);
    logger.info(`Updated rate limits for command ${command}:`, limits);
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier, command = null) {
    const usage = {};
    
    if (command) {
      // Get usage for specific command
      const bucketKey = `${identifier}-${command}`;
      const bucket = this.buckets.get(bucketKey);
      
      if (bucket) {
        const limits = this.getCommandLimits(command);
        this.cleanBucket(bucket, limits);
        
        usage[command] = {
          requests: bucket.requests.length,
          limit: limits.maxRequests,
          remaining: limits.maxRequests - bucket.requests.length,
          resetTime: this.getResetTime(bucket, limits),
          burstAvailable: bucket.burstAvailable || 0
        };
      }
    } else {
      // Get usage for all commands
      for (const [key, bucket] of this.buckets) {
        if (key.startsWith(`${identifier}-`)) {
          const cmd = key.substring(identifier.length + 1);
          const limits = this.getCommandLimits(cmd);
          this.cleanBucket(bucket, limits);
          
          usage[cmd] = {
            requests: bucket.requests.length,
            limit: limits.maxRequests,
            remaining: limits.maxRequests - bucket.requests.length,
            resetTime: this.getResetTime(bucket, limits),
            burstAvailable: bucket.burstAvailable || 0
          };
        }
      }
    }
    
    // Add block status
    if (this.isBlocked(identifier)) {
      usage.blocked = {
        until: this.blocked.get(identifier).until,
        remaining: this.getBlockRemainingTime(identifier)
      };
    }
    
    return usage;
  }
}

module.exports = CommandRateLimiter;