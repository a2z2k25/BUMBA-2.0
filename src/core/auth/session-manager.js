/**
 * Session Management System
 * Secure session handling with Redis/Memory support
 * Sprint 13 - Security Fix
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');
const EventEmitter = require('events');

class SessionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Session settings
      sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
      maxSessionsPerUser: options.maxSessionsPerUser || 5,
      slidingExpiration: options.slidingExpiration !== false,
      
      // Security settings
      secureCookie: options.secureCookie !== false,
      httpOnly: options.httpOnly !== false,
      sameSite: options.sameSite || 'strict',
      domain: options.domain || null,
      path: options.path || '/',
      
      // Storage
      store: options.store || 'memory', // memory|redis
      redisClient: options.redisClient || null,
      
      // Cleanup
      cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
      
      ...options
    };
    
    // Session storage
    this.sessions = new Map();
    this.userSessions = new Map(); // userId -> Set of sessionIds
    
    // Statistics
    this.stats = {
      created: 0,
      destroyed: 0,
      active: 0,
      expired: 0,
      concurrent: 0
    };
    
    // Timers
    this.timers = new ComponentTimers('session-manager');
    
    // Register state
    stateManager.register('sessions', {
      stats: this.stats,
      activeSessions: 0
    });
    
    // Start cleanup
    this.startCleanup();
  }
  
  /**
   * Create new session
   */
  async createSession(userId, data = {}) {
    // Check max sessions per user
    const userSessionIds = this.userSessions.get(userId) || new Set();
    
    if (userSessionIds.size >= this.options.maxSessionsPerUser) {
      // Remove oldest session
      const oldest = this.getOldestSession(userId);
      if (oldest) {
        await this.destroySession(oldest);
      }
    }
    
    // Generate session ID
    const sessionId = this.generateSessionId();
    
    // Create session object
    const session = {
      id: sessionId,
      userId,
      data: {
        ...data,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null
      },
      expiresAt: Date.now() + this.options.sessionTimeout,
      active: true
    };
    
    // Store session
    await this.storeSession(sessionId, session);
    
    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);
    
    // Update stats
    this.stats.created++;
    this.stats.active = this.sessions.size;
    this.updateState();
    
    // Emit event
    this.emit('session-created', {
      sessionId,
      userId
    });
    
    logger.debug(`Session created for user ${userId}: ${sessionId}`);
    
    return {
      sessionId,
      expiresAt: session.expiresAt,
      cookie: this.createSessionCookie(sessionId, session.expiresAt)
    };
  }
  
  /**
   * Get session
   */
  async getSession(sessionId) {
    const session = await this.loadSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > session.expiresAt) {
      await this.destroySession(sessionId);
      return null;
    }
    
    // Update activity and extend expiration if sliding
    if (this.options.slidingExpiration) {
      session.data.lastActivity = Date.now();
      session.expiresAt = Date.now() + this.options.sessionTimeout;
      await this.storeSession(sessionId, session);
    }
    
    return session;
  }
  
  /**
   * Update session data
   */
  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found or expired');
    }
    
    // Merge updates
    session.data = {
      ...session.data,
      ...updates,
      lastActivity: Date.now()
    };
    
    // Store updated session
    await this.storeSession(sessionId, session);
    
    return session;
  }
  
  /**
   * Destroy session
   */
  async destroySession(sessionId) {
    const session = await this.loadSession(sessionId);
    
    if (session) {
      // Remove from user sessions
      const userSessionIds = this.userSessions.get(session.userId);
      if (userSessionIds) {
        userSessionIds.delete(sessionId);
        if (userSessionIds.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      
      // Remove session
      await this.removeSession(sessionId);
      
      // Update stats
      this.stats.destroyed++;
      this.stats.active = this.sessions.size;
      this.updateState();
      
      // Emit event
      this.emit('session-destroyed', {
        sessionId,
        userId: session.userId
      });
      
      logger.debug(`Session destroyed: ${sessionId}`);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Destroy all user sessions
   */
  async destroyUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId);
    
    if (!sessionIds || sessionIds.size === 0) {
      return 0;
    }
    
    let destroyed = 0;
    for (const sessionId of sessionIds) {
      if (await this.destroySession(sessionId)) {
        destroyed++;
      }
    }
    
    return destroyed;
  }
  
  /**
   * Validate session
   */
  async validateSession(sessionId, options = {}) {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found or expired' };
    }
    
    // Check IP address if required
    if (options.checkIp && options.ipAddress) {
      if (session.data.ipAddress !== options.ipAddress) {
        logger.warn(`Session IP mismatch for ${sessionId}`);
        
        // Record security event
        errorTelemetry.recordError(new Error('Session IP mismatch'), {
          type: 'session_security',
          severity: 'medium',
          sessionId,
          expectedIp: session.data.ipAddress,
          actualIp: options.ipAddress
        });
        
        return { valid: false, reason: 'IP address mismatch' };
      }
    }
    
    // Check user agent if required
    if (options.checkUserAgent && options.userAgent) {
      if (session.data.userAgent !== options.userAgent) {
        logger.warn(`Session user agent mismatch for ${sessionId}`);
        return { valid: false, reason: 'User agent mismatch' };
      }
    }
    
    // Check if user is still valid
    if (options.validateUser) {
      const userValid = await options.validateUser(session.userId);
      if (!userValid) {
        return { valid: false, reason: 'User no longer valid' };
      }
    }
    
    return {
      valid: true,
      session,
      userId: session.userId
    };
  }
  
  /**
   * Get user sessions
   */
  async getUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId);
    
    if (!sessionIds || sessionIds.size === 0) {
      return [];
    }
    
    const sessions = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }
  
  /**
   * Get oldest session for user
   */
  getOldestSession(userId) {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds || sessionIds.size === 0) return null;
    
    let oldest = null;
    let oldestTime = Infinity;
    
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.data.createdAt < oldestTime) {
        oldest = sessionId;
        oldestTime = session.data.createdAt;
      }
    }
    
    return oldest;
  }
  
  /**
   * Generate session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Create session cookie
   */
  createSessionCookie(sessionId, expiresAt) {
    const parts = [`session=${sessionId}`];
    
    if (this.options.httpOnly) {
      parts.push('HttpOnly');
    }
    
    if (this.options.secureCookie) {
      parts.push('Secure');
    }
    
    if (this.options.sameSite) {
      parts.push(`SameSite=${this.options.sameSite}`);
    }
    
    if (this.options.domain) {
      parts.push(`Domain=${this.options.domain}`);
    }
    
    parts.push(`Path=${this.options.path}`);
    parts.push(`Expires=${new Date(expiresAt).toUTCString()}`);
    
    return parts.join('; ');
  }
  
  /**
   * Parse session from cookie
   */
  parseSessionCookie(cookieHeader) {
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'session') {
        return value;
      }
    }
    
    return null;
  }
  
  /**
   * Store session (memory or Redis)
   */
  async storeSession(sessionId, session) {
    if (this.options.store === 'redis' && this.options.redisClient) {
      await this.options.redisClient.setex(
        `session:${sessionId}`,
        Math.floor(this.options.sessionTimeout / 1000),
        JSON.stringify(session)
      );
    } else {
      this.sessions.set(sessionId, session);
    }
  }
  
  /**
   * Load session (memory or Redis)
   */
  async loadSession(sessionId) {
    if (this.options.store === 'redis' && this.options.redisClient) {
      const data = await this.options.redisClient.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } else {
      return this.sessions.get(sessionId) || null;
    }
  }
  
  /**
   * Remove session (memory or Redis)
   */
  async removeSession(sessionId) {
    if (this.options.store === 'redis' && this.options.redisClient) {
      await this.options.redisClient.del(`session:${sessionId}`);
    } else {
      this.sessions.delete(sessionId);
    }
  }
  
  /**
   * Start cleanup timer
   */
  startCleanup() {
    this.timers.setInterval('cleanup', () => {
      this.cleanup();
    }, this.options.cleanupInterval, 'Clean expired sessions');
  }
  
  /**
   * Clean expired sessions
   */
  async cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean memory store
    if (this.options.store === 'memory') {
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now > session.expiresAt) {
          await this.destroySession(sessionId);
          cleaned++;
        }
      }
    }
    
    // Redis cleanup handled by TTL
    
    if (cleaned > 0) {
      logger.debug(`Session cleanup: removed ${cleaned} expired sessions`);
      this.stats.expired += cleaned;
    }
    
    // Update concurrent sessions stat
    const userCounts = Array.from(this.userSessions.values()).map(s => s.size);
    this.stats.concurrent = Math.max(...userCounts, 0);
    
    this.updateState();
  }
  
  /**
   * Update state
   */
  updateState() {
    stateManager.set('sessions', 'stats', this.stats);
    stateManager.set('sessions', 'activeSessions', this.sessions.size);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      uniqueUsers: this.userSessions.size,
      averageSessionsPerUser: this.userSessions.size > 0 
        ? this.sessions.size / this.userSessions.size 
        : 0
    };
  }
  
  /**
   * Stop session manager
   */
  stop() {
    this.timers.clearAll();
  }
}

// Singleton instance
let instance = null;

function getSessionManager(options) {
  if (!instance) {
    instance = new SessionManager(options);
  }
  return instance;
}

module.exports = {
  SessionManager,
  getSessionManager,
  sessionManager: getSessionManager()
};