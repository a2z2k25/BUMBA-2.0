/**
 * Rate Limiting System
 * Prevents abuse through request throttling
 * Sprint 12 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');
const { ComponentTimers } = require('../timers/timer-registry');
const EventEmitter = require('events');

class RateLimiter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Default: 100 requests per minute
      windowMs: options.windowMs || 60000,
      maxRequests: options.maxRequests || 100,
      
      // Progressive delays
      delayAfter: options.delayAfter || 50,
      delayMs: options.delayMs || 100,
      
      // Blocking
      blockDuration: options.blockDuration || 900000, // 15 minutes
      
      // Store
      storeType: options.storeType || 'memory',
      
      // Behavior
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      
      // Key generation
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      
      // Messages
      message: options.message || 'Too many requests, please try again later',
      
      ...options
    };
    
    // Stores for different tracking
    this.requests = new Map(); // Request counts
    this.blocked = new Map();  // Blocked clients
    this.delays = new Map();   // Progressive delays
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      delayedRequests: 0,
      allowedRequests: 0
    };
    
    // Timers for cleanup
    this.timers = new ComponentTimers('rate-limiter');
    
    // Register state
    stateManager.register('rateLimiter', {
      requests: {},
      blocked: [],
      stats: this.stats
    });
    
    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Check if request should be limited
   */
  async limit(key, options = {}) {
    const identifier = typeof key === 'string' ? key : this.options.keyGenerator(key);
    
    // Update total stats
    this.stats.totalRequests++;
    
    // Check if blocked
    if (this.isBlocked(identifier)) {
      this.stats.blockedRequests++;
      this.updateState();
      
      const blockInfo = this.blocked.get(identifier);
      const remaining = blockInfo.until - Date.now();
      
      this.emit('blocked', {
        key: identifier,
        remaining,
        reason: blockInfo.reason
      });
      
      return {
        allowed: false,
        reason: 'blocked',
        retryAfter: Math.ceil(remaining / 1000),
        message: `Blocked for ${Math.ceil(remaining / 60000)} minutes`
      };
    }
    
    // Get or create request tracking
    const now = Date.now();
    let requestData = this.requests.get(identifier);
    
    if (!requestData) {
      requestData = {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        window: []
      };
      this.requests.set(identifier, requestData);
    }
    
    // Clean old requests from window
    requestData.window = requestData.window.filter(
      timestamp => timestamp > now - this.options.windowMs
    );
    
    // Check rate limit
    if (requestData.window.length >= this.options.maxRequests) {
      // Rate limit exceeded - block the client
      this.blockClient(identifier, 'rate_limit_exceeded');
      this.stats.blockedRequests++;
      
      this.emit('limit_exceeded', {
        key: identifier,
        requests: requestData.window.length,
        limit: this.options.maxRequests
      });
      
      return {
        allowed: false,
        reason: 'rate_limit',
        retryAfter: Math.ceil(this.options.blockDuration / 1000),
        message: this.options.message
      };
    }
    
    // Check if delay should be applied
    let delay = 0;
    if (requestData.window.length > this.options.delayAfter) {
      delay = this.calculateDelay(identifier, requestData.window.length);
      
      if (delay > 0) {
        this.stats.delayedRequests++;
        
        this.emit('delayed', {
          key: identifier,
          delay,
          requests: requestData.window.length
        });
        
        // Apply delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Record the request
    requestData.window.push(now);
    requestData.lastRequest = now;
    requestData.count++;
    
    this.stats.allowedRequests++;
    this.updateState();
    
    return {
      allowed: true,
      remaining: this.options.maxRequests - requestData.window.length,
      resetTime: now + this.options.windowMs,
      delay
    };
  }

  /**
   * Calculate progressive delay
   */
  calculateDelay(identifier, requestCount) {
    const overLimit = requestCount - this.options.delayAfter;
    if (overLimit <= 0) return 0;
    
    // Progressive delay: increases with each request over the threshold
    const baseDelay = this.options.delayMs;
    const multiplier = Math.min(overLimit, 10); // Cap at 10x
    
    return baseDelay * multiplier;
  }

  /**
   * Block a client
   */
  blockClient(identifier, reason = 'manual') {
    const blockUntil = Date.now() + this.options.blockDuration;
    
    this.blocked.set(identifier, {
      reason,
      since: Date.now(),
      until: blockUntil,
      attempts: 0
    });
    
    // Record in telemetry
    errorTelemetry.recordError(new Error(`Rate limit: Client blocked`), {
      type: 'rate_limit',
      severity: 'medium',
      identifier,
      reason
    });
    
    logger.warn(`Client blocked: ${identifier} - ${reason}`);
    
    this.emit('client_blocked', {
      key: identifier,
      reason,
      duration: this.options.blockDuration
    });
  }

  /**
   * Unblock a client
   */
  unblockClient(identifier) {
    if (this.blocked.has(identifier)) {
      this.blocked.delete(identifier);
      
      this.emit('client_unblocked', {
        key: identifier
      });
      
      return true;
    }
    return false;
  }

  /**
   * Check if client is blocked
   */
  isBlocked(identifier) {
    const blockInfo = this.blocked.get(identifier);
    
    if (!blockInfo) return false;
    
    // Check if block has expired
    if (Date.now() > blockInfo.until) {
      this.blocked.delete(identifier);
      return false;
    }
    
    // Increment attempt counter
    blockInfo.attempts++;
    
    // Extend block if too many attempts while blocked
    if (blockInfo.attempts > 5) {
      blockInfo.until = Date.now() + this.options.blockDuration * 2; // Double the block
      logger.warn(`Block extended for ${identifier} due to repeated attempts`);
    }
    
    return true;
  }

  /**
   * Reset limits for a specific key
   */
  reset(identifier) {
    this.requests.delete(identifier);
    this.blocked.delete(identifier);
    this.delays.delete(identifier);
    
    this.emit('reset', { key: identifier });
  }

  /**
   * Reset all limits
   */
  resetAll() {
    this.requests.clear();
    this.blocked.clear();
    this.delays.clear();
    
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      delayedRequests: 0,
      allowedRequests: 0
    };
    
    this.updateState();
    this.emit('reset_all');
  }

  /**
   * Default key generator
   */
  defaultKeyGenerator(request) {
    // In a real app, this would use IP address, user ID, etc.
    return request.ip || 
           request.userId || 
           request.sessionId || 
           'anonymous';
  }

  /**
   * Start cleanup timer
   */
  startCleanup() {
    // Clean up old data every minute
    this.timers.setInterval('cleanup', () => {
      this.cleanup();
    }, 60000, 'Clean old rate limit data');
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean expired blocks
    for (const [key, blockInfo] of this.blocked.entries()) {
      if (now > blockInfo.until) {
        this.blocked.delete(key);
        cleaned++;
      }
    }
    
    // Clean old request windows
    for (const [key, requestData] of this.requests.entries()) {
      // Remove if no recent requests
      if (now - requestData.lastRequest > this.options.windowMs * 2) {
        this.requests.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} entries`);
    }
    
    this.updateState();
  }

  /**
   * Update state manager
   */
  updateState() {
    // Convert maps to objects for state storage
    const requests = {};
    for (const [key, data] of this.requests.entries()) {
      requests[key] = {
        count: data.window.length,
        lastRequest: data.lastRequest
      };
    }
    
    const blocked = Array.from(this.blocked.entries()).map(([key, info]) => ({
      key,
      ...info
    }));
    
    stateManager.set('rateLimiter', 'requests', requests);
    stateManager.set('rateLimiter', 'blocked', blocked);
    stateManager.set('rateLimiter', 'stats', this.stats);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeClients: this.requests.size,
      blockedClients: this.blocked.size,
      configuration: {
        windowMs: this.options.windowMs,
        maxRequests: this.options.maxRequests,
        blockDuration: this.options.blockDuration
      }
    };
  }

  /**
   * Get client info
   */
  getClientInfo(identifier) {
    const requests = this.requests.get(identifier);
    const blocked = this.blocked.get(identifier);
    
    return {
      identifier,
      requests: requests ? {
        count: requests.window.length,
        firstRequest: requests.firstRequest,
        lastRequest: requests.lastRequest,
        remaining: Math.max(0, this.options.maxRequests - requests.window.length)
      } : null,
      blocked: blocked ? {
        reason: blocked.reason,
        since: blocked.since,
        until: blocked.until,
        remaining: Math.max(0, blocked.until - Date.now())
      } : null
    };
  }

  /**
   * Stop the rate limiter
   */
  stop() {
    this.timers.clearAll();
  }
}

/**
 * Rate Limiter Manager for multiple limiters
 */
class RateLimiterManager {
  constructor() {
    this.limiters = new Map();
    
    // Create default limiters
    this.createDefaultLimiters();
  }

  /**
   * Create default rate limiters
   */
  createDefaultLimiters() {
    // API rate limiter
    this.create('api', {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      delayAfter: 50,
      message: 'API rate limit exceeded'
    });
    
    // Auth rate limiter (stricter)
    this.create('auth', {
      windowMs: 900000, // 15 minutes
      maxRequests: 5,
      blockDuration: 3600000, // 1 hour
      message: 'Too many authentication attempts'
    });
    
    // File upload rate limiter
    this.create('upload', {
      windowMs: 3600000, // 1 hour
      maxRequests: 10,
      message: 'Upload rate limit exceeded'
    });
    
    // Command execution rate limiter
    this.create('command', {
      windowMs: 60000, // 1 minute
      maxRequests: 30,
      delayAfter: 15,
      message: 'Command rate limit exceeded'
    });
  }

  /**
   * Create a new rate limiter
   */
  create(name, options = {}) {
    if (this.limiters.has(name)) {
      logger.warn(`Rate limiter ${name} already exists`);
      return this.limiters.get(name);
    }
    
    const limiter = new RateLimiter(options);
    this.limiters.set(name, limiter);
    
    return limiter;
  }

  /**
   * Get a rate limiter
   */
  get(name) {
    return this.limiters.get(name);
  }

  /**
   * Check limit using specific limiter
   */
  async limit(limiterName, key, options) {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      logger.warn(`Rate limiter not found: ${limiterName}`);
      return { allowed: true };
    }
    
    return limiter.limit(key, options);
  }

  /**
   * Remove a rate limiter
   */
  remove(name) {
    const limiter = this.limiters.get(name);
    if (limiter) {
      limiter.stop();
      this.limiters.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    const stats = {};
    
    for (const [name, limiter] of this.limiters) {
      stats[name] = limiter.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all limiters
   */
  resetAll() {
    for (const limiter of this.limiters.values()) {
      limiter.resetAll();
    }
  }

  /**
   * Stop all limiters
   */
  stopAll() {
    for (const limiter of this.limiters.values()) {
      limiter.stop();
    }
  }
}

// Create singleton manager
const rateLimiterManager = new RateLimiterManager();

module.exports = {
  RateLimiter,
  RateLimiterManager,
  rateLimiterManager,
  
  // Convenience functions
  createLimiter: (name, options) => rateLimiterManager.create(name, options),
  limit: (limiterName, key, options) => rateLimiterManager.limit(limiterName, key, options),
  
  // Pre-configured limiters
  apiLimiter: rateLimiterManager.get('api'),
  authLimiter: rateLimiterManager.get('auth'),
  uploadLimiter: rateLimiterManager.get('upload'),
  commandLimiter: rateLimiterManager.get('command')
};