/**
 * BUMBA Command Permission System
 * Role-based access control for command execution
 */

const { logger } = require('../logging/bumba-logger');
const crypto = require('crypto');

class CommandPermissionSystem {
  constructor(options = {}) {
    this.options = {
      defaultRole: options.defaultRole || 'user',
      requireAuth: options.requireAuth || false,
      cachePermissions: options.cachePermissions !== false,
      cacheTTL: options.cacheTTL || 300000, // 5 minutes
      ...options
    };
    
    // Permission levels (higher number = more privileges)
    this.permissionLevels = {
      guest: 0,
      user: 1,
      developer: 2,
      admin: 3,
      superadmin: 4
    };
    
    // Role definitions
    this.roles = new Map([
      ['guest', {
        level: 0,
        permissions: ['read', 'help', 'status'],
        deniedCommands: ['deploy', 'secure', 'urgent', 'admin'],
        rateLimit: 10 // commands per minute
      }],
      ['user', {
        level: 1,
        permissions: ['read', 'write', 'analyze', 'test'],
        deniedCommands: ['deploy', 'admin', 'urgent'],
        rateLimit: 30
      }],
      ['developer', {
        level: 2,
        permissions: ['read', 'write', 'analyze', 'test', 'implement', 'secure'],
        deniedCommands: ['admin'],
        rateLimit: 60
      }],
      ['admin', {
        level: 3,
        permissions: ['*'], // All permissions
        deniedCommands: [],
        rateLimit: 100
      }],
      ['superadmin', {
        level: 4,
        permissions: ['*', 'sudo'], // All permissions plus sudo
        deniedCommands: [],
        rateLimit: -1 // Unlimited
      }]
    ]);
    
    // Command permission requirements
    this.commandPermissions = new Map([
      // Read-only commands
      ['help', { minLevel: 0, permissions: ['read'] }],
      ['status', { minLevel: 0, permissions: ['read'] }],
      ['menu', { minLevel: 0, permissions: ['read'] }],
      ['docs', { minLevel: 0, permissions: ['read'] }],
      
      // Analysis commands
      ['analyze', { minLevel: 1, permissions: ['read', 'analyze'] }],
      ['analyze-business', { minLevel: 1, permissions: ['read', 'analyze'] }],
      ['analyze-technical', { minLevel: 1, permissions: ['read', 'analyze'] }],
      ['analyze-ux', { minLevel: 1, permissions: ['read', 'analyze'] }],
      
      // Development commands
      ['implement', { minLevel: 2, permissions: ['write', 'implement'] }],
      ['implement-agents', { minLevel: 2, permissions: ['write', 'implement'] }],
      ['implement-design', { minLevel: 2, permissions: ['write', 'implement'] }],
      ['implement-strategy', { minLevel: 2, permissions: ['write', 'implement'] }],
      ['implement-technical', { minLevel: 2, permissions: ['write', 'implement'] }],
      
      // Testing commands
      ['test', { minLevel: 1, permissions: ['read', 'test'] }],
      ['validate', { minLevel: 1, permissions: ['read', 'test'] }],
      
      // Security commands
      ['secure', { minLevel: 2, permissions: ['security', 'write'] }],
      ['scan', { minLevel: 2, permissions: ['security', 'read'] }],
      
      // Deployment commands
      ['deploy', { minLevel: 3, permissions: ['deploy', 'admin'] }],
      ['publish', { minLevel: 3, permissions: ['deploy', 'write'] }],
      
      // Admin commands
      ['urgent', { minLevel: 3, permissions: ['admin', 'priority'] }],
      ['settings', { minLevel: 3, permissions: ['admin', 'write'] }],
      
      // Collaboration commands
      ['collaborate', { minLevel: 1, permissions: ['collaborate'] }],
      ['team', { minLevel: 1, permissions: ['collaborate', 'read'] }],
      ['handoff', { minLevel: 1, permissions: ['collaborate'] }]
    ]);
    
    // User sessions
    this.sessions = new Map();
    
    // Permission cache
    this.permissionCache = new Map();
    
    // Audit log
    this.auditLog = [];
  }

  /**
   * Authenticate user and create session
   */
  async authenticate(credentials) {
    try {
      // In production, this would validate against a real auth system
      const { username, password, token } = credentials;
      
      let user = null;
      
      if (token) {
        // Token-based auth
        user = await this.validateToken(token);
      } else if (username && password) {
        // Username/password auth
        user = await this.validateCredentials(username, password);
      }
      
      if (!user) {
        throw new Error('Authentication failed');
      }
      
      // Create session
      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        user,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        permissions: this.getUserPermissions(user)
      };
      
      this.sessions.set(sessionId, session);
      
      logger.info(`User ${user.username} authenticated with role ${user.role}`);
      
      return {
        success: true,
        sessionId,
        user: {
          username: user.username,
          role: user.role,
          level: this.permissionLevels[user.role]
        }
      };
      
    } catch (error) {
      logger.error('Authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user has permission to execute command
   */
  async checkPermission(command, context = {}) {
    try {
      // Get user from context
      const user = await this.getUserFromContext(context);
      
      // Check cache first
      const cacheKey = `${user.id || 'anonymous'}-${command}`;
      if (this.options.cachePermissions && this.permissionCache.has(cacheKey)) {
        const cached = this.permissionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.options.cacheTTL) {
          return cached.result;
        }
      }
      
      // Perform permission check
      const result = await this.performPermissionCheck(command, user);
      
      // Cache result
      if (this.options.cachePermissions) {
        this.permissionCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
      }
      
      // Log audit event
      this.logAudit({
        user: user.username || 'anonymous',
        command,
        allowed: result.allowed,
        reason: result.reason,
        timestamp: Date.now()
      });
      
      return result;
      
    } catch (error) {
      logger.error('Permission check error:', error);
      return {
        allowed: false,
        reason: `Permission check failed: ${error.message}`
      };
    }
  }

  /**
   * Perform actual permission check
   */
  async performPermissionCheck(command, user) {
    // Get command permission requirements
    const commandPerms = this.commandPermissions.get(command);
    
    if (!commandPerms) {
      // Command not in permission system, check default policy
      if (this.options.requireAuth && !user.authenticated) {
        return {
          allowed: false,
          reason: 'Authentication required'
        };
      }
      
      // Allow by default if not defined
      return {
        allowed: true,
        reason: 'Command has no permission requirements'
      };
    }
    
    // Check minimum level
    const userLevel = this.permissionLevels[user.role] || 0;
    if (userLevel < commandPerms.minLevel) {
      return {
        allowed: false,
        reason: `Insufficient permission level. Required: ${commandPerms.minLevel}, Current: ${userLevel}`
      };
    }
    
    // Check specific permissions
    const userPermissions = this.getUserPermissions(user);
    
    // Check if user has wildcard permission
    if (userPermissions.includes('*')) {
      return {
        allowed: true,
        reason: 'User has wildcard permissions'
      };
    }
    
    // Check required permissions
    for (const required of commandPerms.permissions) {
      if (!userPermissions.includes(required)) {
        return {
          allowed: false,
          reason: `Missing required permission: ${required}`
        };
      }
    }
    
    // Check role-based denied commands
    const roleConfig = this.roles.get(user.role);
    if (roleConfig && roleConfig.deniedCommands.includes(command)) {
      return {
        allowed: false,
        reason: `Command is denied for role: ${user.role}`
      };
    }
    
    // All checks passed
    return {
      allowed: true,
      reason: 'All permission requirements met'
    };
  }

  /**
   * Get user from context
   */
  async getUserFromContext(context) {
    // Check for session
    if (context.sessionId) {
      const session = this.sessions.get(context.sessionId);
      if (session) {
        // Update last activity
        session.lastActivity = Date.now();
        return session.user;
      }
    }
    
    // Check for user in context
    if (context.user) {
      return context.user;
    }
    
    // Return default/anonymous user
    return {
      username: 'anonymous',
      role: this.options.defaultRole,
      authenticated: false
    };
  }

  /**
   * Get user permissions based on role
   */
  getUserPermissions(user) {
    const roleConfig = this.roles.get(user.role);
    if (!roleConfig) {
      return [];
    }
    
    // Combine role permissions with any additional user-specific permissions
    const permissions = [...roleConfig.permissions];
    
    if (user.additionalPermissions) {
      permissions.push(...user.additionalPermissions);
    }
    
    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Validate token
   */
  async validateToken(token) {
    // In production, validate against auth service
    // For now, simple token validation
    if (token === 'admin-token') {
      return {
        id: 'admin-user',
        username: 'admin',
        role: 'admin',
        authenticated: true
      };
    }
    
    if (token === 'dev-token') {
      return {
        id: 'dev-user',
        username: 'developer',
        role: 'developer',
        authenticated: true
      };
    }
    
    return null;
  }

  /**
   * Validate credentials
   */
  async validateCredentials(username, password) {
    // In production, validate against auth service
    // For now, simple validation
    const users = {
      'admin': { password: 'admin123', role: 'admin' },
      'developer': { password: 'dev123', role: 'developer' },
      'user': { password: 'user123', role: 'user' }
    };
    
    const user = users[username];
    if (user && user.password === password) {
      return {
        id: username,
        username,
        role: user.role,
        authenticated: true
      };
    }
    
    return null;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Grant permission to user
   */
  grantPermission(userId, permission) {
    // Find user session
    for (const session of this.sessions.values()) {
      if (session.user.id === userId) {
        if (!session.user.additionalPermissions) {
          session.user.additionalPermissions = [];
        }
        session.user.additionalPermissions.push(permission);
        
        // Clear cache
        this.clearUserCache(userId);
        
        logger.info(`Granted permission '${permission}' to user ${userId}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Revoke permission from user
   */
  revokePermission(userId, permission) {
    // Find user session
    for (const session of this.sessions.values()) {
      if (session.user.id === userId) {
        if (session.user.additionalPermissions) {
          const index = session.user.additionalPermissions.indexOf(permission);
          if (index > -1) {
            session.user.additionalPermissions.splice(index, 1);
            
            // Clear cache
            this.clearUserCache(userId);
            
            logger.info(`Revoked permission '${permission}' from user ${userId}`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Change user role
   */
  changeUserRole(userId, newRole) {
    if (!this.roles.has(newRole)) {
      logger.error(`Invalid role: ${newRole}`);
      return false;
    }
    
    // Find user session
    for (const session of this.sessions.values()) {
      if (session.user.id === userId) {
        const oldRole = session.user.role;
        session.user.role = newRole;
        
        // Update permissions
        session.permissions = this.getUserPermissions(session.user);
        
        // Clear cache
        this.clearUserCache(userId);
        
        logger.info(`Changed user ${userId} role from ${oldRole} to ${newRole}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clear user permission cache
   */
  clearUserCache(userId) {
    // Clear all cache entries for this user
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}-`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Log audit event
   */
  logAudit(event) {
    this.auditLog.push(event);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }
    
    // In production, this would also persist to database
    logger.debug(`Audit: ${event.user} ${event.allowed ? 'allowed' : 'denied'} for ${event.command}`);
  }

  /**
   * Get audit log
   */
  getAuditLog(filter = {}) {
    let log = [...this.auditLog];
    
    if (filter.user) {
      log = log.filter(e => e.user === filter.user);
    }
    
    if (filter.command) {
      log = log.filter(e => e.command === filter.command);
    }
    
    if (filter.allowed !== undefined) {
      log = log.filter(e => e.allowed === filter.allowed);
    }
    
    if (filter.since) {
      log = log.filter(e => e.timestamp >= filter.since);
    }
    
    return log;
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    const expired = [];
    
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > maxAge) {
        expired.push(id);
      }
    }
    
    for (const id of expired) {
      this.sessions.delete(id);
      logger.debug(`Expired session: ${id}`);
    }
    
    return expired.length;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      cachedPermissions: this.permissionCache.size,
      auditLogSize: this.auditLog.length,
      roles: Array.from(this.roles.keys()),
      permissionLevels: this.permissionLevels
    };
  }
}

module.exports = CommandPermissionSystem;