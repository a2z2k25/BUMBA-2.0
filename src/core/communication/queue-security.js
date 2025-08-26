/**
 * Queue Security Layer - Access control and security validation for message queues
 * Implements authentication, authorization, encryption, and audit logging
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

/**
 * Security levels for different operations
 */
const SecurityLevel = {
  PUBLIC: 'public',
  INTERNAL: 'internal', 
  RESTRICTED: 'restricted',
  CONFIDENTIAL: 'confidential',
  SECRET: 'secret'
};

/**
 * Permission types for queue operations
 */
const QueuePermission = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin',
  MONITOR: 'monitor'
};

/**
 * Queue Security Manager
 */
class QueueSecurityManager {
  constructor(config = {}) {
    this.config = {
      encryptionEnabled: true,
      encryptionAlgorithm: 'aes-256-gcm',
      keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      auditLogging: true,
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      ...config
    };
    
    // Security state
    this.accessControlList = new Map(); // user/agent -> permissions
    this.queueSecurityPolicies = new Map(); // queueName -> security policy
    this.encryptionKeys = new Map(); // keyId -> key data
    this.auditLog = [];
    this.failedAttempts = new Map(); // user -> { count, lastAttempt, lockedUntil }
    
    // Initialize default encryption key
    this.generateEncryptionKey();
    
    logger.info('🔒 Queue Security Manager initialized', {
      encryptionEnabled: this.config.encryptionEnabled,
      auditLogging: this.config.auditLogging
    });
  }

  /**
   * Set access control permissions for a user/agent
   */
  setPermissions(userId, queueName, permissions) {
    const key = `${userId}:${queueName}`;
    
    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }
    
    this.accessControlList.set(key, {
      userId,
      queueName,
      permissions,
      grantedAt: Date.now(),
      grantedBy: 'system' // In production, track who granted permissions
    });
    
    this.auditSecurityEvent('permissions_granted', {
      userId,
      queueName,
      permissions,
      grantedAt: Date.now()
    });
    
    logger.debug(`🔑 Permissions granted: ${userId} -> ${queueName} [${permissions.join(', ')}]`);
  }

  /**
   * Check if user has required permission for queue operation
   */
  hasPermission(userId, queueName, requiredPermission) {
    // Check if user is locked out
    if (this.isUserLockedOut(userId)) {
      this.auditSecurityEvent('access_denied_lockout', { userId, queueName, requiredPermission });
      return false;
    }
    
    const key = `${userId}:${queueName}`;
    const acl = this.accessControlList.get(key);
    
    if (!acl) {
      this.recordFailedAttempt(userId);
      this.auditSecurityEvent('access_denied_no_permissions', { userId, queueName, requiredPermission });
      return false;
    }
    
    // Check if user has the specific permission or admin permission
    const hasPermission = acl.permissions.includes(requiredPermission) || 
                         acl.permissions.includes(QueuePermission.ADMIN);
    
    if (!hasPermission) {
      this.recordFailedAttempt(userId);
      this.auditSecurityEvent('access_denied_insufficient_permissions', { 
        userId, 
        queueName, 
        requiredPermission,
        userPermissions: acl.permissions
      });
    } else {
      // Reset failed attempts on successful authorization
      this.failedAttempts.delete(userId);
    }
    
    return hasPermission;
  }

  /**
   * Set security policy for a queue
   */
  setQueueSecurityPolicy(queueName, policy) {
    const securityPolicy = {
      securityLevel: policy.securityLevel || SecurityLevel.INTERNAL,
      requireEncryption: policy.requireEncryption !== false,
      allowedUsers: policy.allowedUsers || [],
      deniedUsers: policy.deniedUsers || [],
      requireAuditLog: policy.requireAuditLog !== false,
      maxMessageSize: policy.maxMessageSize || 1024 * 1024, // 1MB default
      allowedMessageTypes: policy.allowedMessageTypes || [],
      rateLimit: policy.rateLimit || { maxMessages: 1000, windowMs: 60000 },
      ...policy
    };
    
    this.queueSecurityPolicies.set(queueName, securityPolicy);
    
    this.auditSecurityEvent('security_policy_updated', {
      queueName,
      policy: securityPolicy,
      updatedAt: Date.now()
    });
    
    logger.info(`🟡️ Security policy set for queue: ${queueName}`, {
      securityLevel: securityPolicy.securityLevel,
      requireEncryption: securityPolicy.requireEncryption
    });
  }

  /**
   * Validate message security before processing
   */
  async validateMessageSecurity(queueName, message, userId) {
    const policy = this.queueSecurityPolicies.get(queueName);
    if (!policy) {
      // No policy set, allow with basic validation
      return this.basicSecurityValidation(message);
    }
    
    const validationResult = {
      valid: true,
      violations: [],
      securityLevel: policy.securityLevel
    };
    
    // Check user allowlist/denylist
    if (policy.allowedUsers.length > 0 && !policy.allowedUsers.includes(userId)) {
      validationResult.valid = false;
      validationResult.violations.push('User not in allowlist');
    }
    
    if (policy.deniedUsers.includes(userId)) {
      validationResult.valid = false;
      validationResult.violations.push('User in denylist');
    }
    
    // Check message size
    const messageSize = JSON.stringify(message).length;
    if (messageSize > policy.maxMessageSize) {
      validationResult.valid = false;
      validationResult.violations.push(`Message size ${messageSize} exceeds limit ${policy.maxMessageSize}`);
    }
    
    // Check message type if restricted
    if (policy.allowedMessageTypes.length > 0) {
      const messageType = message.type || message.payload?.type || 'unknown';
      if (!policy.allowedMessageTypes.includes(messageType)) {
        validationResult.valid = false;
        validationResult.violations.push(`Message type '${messageType}' not allowed`);
      }
    }
    
    // Validate content for security threats
    const contentValidation = await this.validateMessageContent(message);
    if (!contentValidation.safe) {
      validationResult.valid = false;
      validationResult.violations.push(...contentValidation.threats);
    }
    
    // Audit validation result
    if (policy.requireAuditLog) {
      this.auditSecurityEvent('message_security_validation', {
        queueName,
        userId,
        messageId: message.id,
        valid: validationResult.valid,
        violations: validationResult.violations,
        securityLevel: policy.securityLevel
      });
    }
    
    return validationResult;
  }

  /**
   * Basic security validation for messages
   */
  basicSecurityValidation(message) {
    const violations = [];
    
    // Check for potentially dangerous content
    const messageStr = JSON.stringify(message);
    
    // Basic XSS/injection patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(messageStr)) {
        violations.push('Potentially malicious content detected');
        break;
      }
    }
    
    return {
      valid: violations.length === 0,
      violations,
      securityLevel: SecurityLevel.INTERNAL
    };
  }

  /**
   * Advanced content validation for security threats
   */
  async validateMessageContent(message) {
    const threats = [];
    const messageStr = JSON.stringify(message);
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b).*(\bFROM\b|\bWHERE\b|\bINTO\b)/i,
      /[\'\"];?\s*(\bOR\b|\bAND\b)\s*[\'\"]?\w*[\'\"]?\s*=\s*[\'\"]?\w*[\'\"]?/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(messageStr)) {
        threats.push('SQL injection pattern detected');
        break;
      }
    }
    
    // Check for command injection
    const commandPatterns = [
      /[\;\|\&]\s*(rm|cat|ls|ps|wget|curl|nc|ncat|bash|sh|cmd|powershell)/i,
      /\$\(.*\)/,
      /`.*`/
    ];
    
    for (const pattern of commandPatterns) {
      if (pattern.test(messageStr)) {
        threats.push('Command injection pattern detected');
        break;
      }
    }
    
    // Check for path traversal
    if (/\.\.\/|\.\.\\|\.\.\%2F|\.\.\%5C/i.test(messageStr)) {
      threats.push('Path traversal attempt detected');
    }
    
    // Check message size and complexity
    if (messageStr.length > 100000) { // 100KB
      threats.push('Message size suspiciously large');
    }
    
    return {
      safe: threats.length === 0,
      threats
    };
  }

  /**
   * Encrypt message payload if required
   */
  async encryptMessage(message, queueName) {
    const policy = this.queueSecurityPolicies.get(queueName);
    
    if (!this.config.encryptionEnabled || 
        (policy && !policy.requireEncryption)) {
      return message;
    }
    
    const currentKey = this.getCurrentEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.config.encryptionAlgorithm, currentKey.key);
    
    let encrypted = cipher.update(JSON.stringify(message.payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      ...message,
      payload: {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        keyId: currentKey.id,
        algorithm: this.config.encryptionAlgorithm
      }
    };
  }

  /**
   * Decrypt message payload
   */
  async decryptMessage(message) {
    if (!message.payload.encrypted) {
      return message;
    }
    
    const keyData = this.encryptionKeys.get(message.payload.keyId);
    if (!keyData) {
      throw new Error(`Encryption key not found: ${message.payload.keyId}`);
    }
    
    const decipher = crypto.createDecipher(
      message.payload.algorithm, 
      keyData.key
    );
    
    decipher.setAuthTag(Buffer.from(message.payload.authTag, 'hex'));
    
    let decrypted = decipher.update(message.payload.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return {
      ...message,
      payload: JSON.parse(decrypted)
    };
  }

  /**
   * Generate new encryption key
   */
  generateEncryptionKey() {
    const keyId = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const key = crypto.randomBytes(32); // 256 bits
    
    this.encryptionKeys.set(keyId, {
      id: keyId,
      key,
      createdAt: Date.now(),
      active: true
    });
    
    // Deactivate old keys
    for (const [id, keyData] of this.encryptionKeys) {
      if (id !== keyId) {
        keyData.active = false;
      }
    }
    
    logger.debug(`🔐 New encryption key generated: ${keyId}`);
    return keyId;
  }

  /**
   * Get current active encryption key
   */
  getCurrentEncryptionKey() {
    for (const keyData of this.encryptionKeys.values()) {
      if (keyData.active) {
        return keyData;
      }
    }
    
    // No active key found, generate one
    const keyId = this.generateEncryptionKey();
    return this.encryptionKeys.get(keyId);
  }

  /**
   * Record failed access attempt
   */
  recordFailedAttempt(userId) {
    const attempts = this.failedAttempts.get(userId) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
    
    attempts.count++;
    attempts.lastAttempt = Date.now();
    
    if (attempts.count >= this.config.maxFailedAttempts) {
      attempts.lockedUntil = Date.now() + this.config.lockoutDuration;
      
      this.auditSecurityEvent('user_locked_out', {
        userId,
        failedAttempts: attempts.count,
        lockedUntil: attempts.lockedUntil
      });
      
      logger.warn(`🔒 User locked out due to failed attempts: ${userId}`);
    }
    
    this.failedAttempts.set(userId, attempts);
  }

  /**
   * Check if user is currently locked out
   */
  isUserLockedOut(userId) {
    const attempts = this.failedAttempts.get(userId);
    if (!attempts) return false;
    
    return Date.now() < attempts.lockedUntil;
  }

  /**
   * Audit security events
   */
  auditSecurityEvent(eventType, eventData) {
    if (!this.config.auditLogging) return;
    
    const auditEntry = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      eventType,
      data: eventData,
      source: 'queue-security-manager'
    };
    
    this.auditLog.push(auditEntry);
    
    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }
    
    logger.debug(`📋 Security audit: ${eventType}`, eventData);
  }

  /**
   * Get security audit log
   */
  getAuditLog(options = {}) {
    const { 
      limit = 100, 
      offset = 0, 
      eventType = null, 
      userId = null,
      since = null 
    } = options;
    
    let filtered = [...this.auditLog];
    
    // Apply filters
    if (eventType) {
      filtered = filtered.filter(entry => entry.eventType === eventType);
    }
    
    if (userId) {
      filtered = filtered.filter(entry => 
        entry.data.userId === userId || 
        entry.data.grantedBy === userId
      );
    }
    
    if (since) {
      filtered = filtered.filter(entry => entry.timestamp >= since);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    
    return {
      entries: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    };
  }

  /**
   * Get security status and statistics
   */
  getSecurityStatus() {
    const activeKeys = Array.from(this.encryptionKeys.values()).filter(k => k.active).length;
    const lockedUsers = Array.from(this.failedAttempts.values()).filter(a => Date.now() < a.lockedUntil).length;
    const totalPermissions = this.accessControlList.size;
    const totalPolicies = this.queueSecurityPolicies.size;
    
    return {
      timestamp: Date.now(),
      encryption: {
        enabled: this.config.encryptionEnabled,
        activeKeys,
        totalKeys: this.encryptionKeys.size
      },
      accessControl: {
        totalPermissions,
        lockedUsers,
        maxFailedAttempts: this.config.maxFailedAttempts
      },
      policies: {
        totalPolicies,
        auditLogging: this.config.auditLogging
      },
      audit: {
        totalEntries: this.auditLog.length,
        oldestEntry: this.auditLog.length > 0 ? this.auditLog[0].timestamp : null,
        newestEntry: this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1].timestamp : null
      }
    };
  }

  /**
   * Clean up expired data
   */
  cleanup() {
    const now = Date.now();
    
    // Clean up expired lockouts
    for (const [userId, attempts] of this.failedAttempts) {
      if (attempts.lockedUntil > 0 && now > attempts.lockedUntil) {
        this.failedAttempts.delete(userId);
      }
    }
    
    // Clean up old encryption keys (keep for decryption)
    const oldKeyThreshold = now - (7 * 24 * 60 * 60 * 1000); // 7 days
    for (const [keyId, keyData] of this.encryptionKeys) {
      if (!keyData.active && keyData.createdAt < oldKeyThreshold) {
        this.encryptionKeys.delete(keyId);
      }
    }
    
    logger.debug('🧹 Security manager cleanup completed');
  }
}

module.exports = {
  QueueSecurityManager,
  SecurityLevel,
  QueuePermission
};