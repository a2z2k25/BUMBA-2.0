/**
 * Executive Security Manager
 * Comprehensive security management for Executive Systems
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Security levels
 */
const SecurityLevel = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  SECRET: 3,
  TOP_SECRET: 4
};

/**
 * Access control types
 */
const AccessControl = {
  RBAC: 'role_based',
  ABAC: 'attribute_based',
  MAC: 'mandatory',
  DAC: 'discretionary'
};

class ExecutiveSecurityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      enableEncryption: true,
      enableAuditLogging: true,
      enableComplianceChecks: true,
      enableThreatDetection: true,
      encryptionAlgorithm: 'aes-256-gcm',
      hashAlgorithm: 'sha256',
      saltRounds: 10,
      sessionTimeout: 3600000, // 1 hour
      maxLoginAttempts: 5,
      ...config
    };
    
    // Security components
    this.roles = new Map();
    this.permissions = new Map();
    this.sessions = new Map();
    this.auditLog = [];
    this.threats = [];
    
    // Encryption keys
    this.encryptionKey = this.generateKey();
    
    // Security policies
    this.policies = new Map();
    this.compliance = new Map();
    
    // Initialize security
    this.initializeSecurity();
    
    logger.info('🔒 Executive Security Manager initialized');
  }

  /**
   * Initialize security components
   */
  initializeSecurity() {
    // Initialize default roles
    this.initializeRoles();
    
    // Initialize permissions
    this.initializePermissions();
    
    // Initialize policies
    this.initializePolicies();
    
    // Initialize compliance rules
    this.initializeCompliance();
    
    // Start monitoring
    this.startSecurityMonitoring();
  }

  /**
   * Initialize default roles
   */
  initializeRoles() {
    // CEO role
    this.addRole('ceo', {
      level: SecurityLevel.TOP_SECRET,
      permissions: ['*'],
      description: 'Chief Executive Officer'
    });
    
    // Executive role
    this.addRole('executive', {
      level: SecurityLevel.SECRET,
      permissions: [
        'decision.create',
        'decision.approve',
        'strategy.manage',
        'resource.allocate'
      ],
      description: 'Executive Management'
    });
    
    // Manager role
    this.addRole('manager', {
      level: SecurityLevel.CONFIDENTIAL,
      permissions: [
        'decision.view',
        'strategy.view',
        'team.manage',
        'report.create'
      ],
      description: 'Department Manager'
    });
    
    // Analyst role
    this.addRole('analyst', {
      level: SecurityLevel.INTERNAL,
      permissions: [
        'data.analyze',
        'report.view',
        'metrics.view'
      ],
      description: 'Business Analyst'
    });
    
    // Viewer role
    this.addRole('viewer', {
      level: SecurityLevel.PUBLIC,
      permissions: [
        'dashboard.view',
        'report.view'
      ],
      description: 'Read-only Access'
    });
  }

  /**
   * Initialize permissions
   */
  initializePermissions() {
    const permissionCategories = {
      decision: ['create', 'view', 'approve', 'reject', 'delete'],
      strategy: ['create', 'view', 'manage', 'execute', 'delete'],
      resource: ['allocate', 'view', 'manage', 'optimize'],
      team: ['manage', 'view', 'assign', 'evaluate'],
      report: ['create', 'view', 'export', 'share'],
      data: ['analyze', 'export', 'import', 'modify'],
      system: ['configure', 'monitor', 'audit', 'maintain']
    };
    
    for (const [category, actions] of Object.entries(permissionCategories)) {
      for (const action of actions) {
        const permission = `${category}.${action}`;
        this.permissions.set(permission, {
          name: permission,
          category,
          action,
          requiresAudit: this.shouldAudit(category, action)
        });
      }
    }
  }

  /**
   * Initialize security policies
   */
  initializePolicies() {
    // Password policy
    this.addPolicy('password', {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      historyCount: 5
    });
    
    // Session policy
    this.addPolicy('session', {
      maxDuration: 8 * 60 * 60 * 1000, // 8 hours
      idleTimeout: 30 * 60 * 1000, // 30 minutes
      maxConcurrent: 3,
      requireMFA: true
    });
    
    // Data policy
    this.addPolicy('data', {
      encryptionRequired: true,
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      classificationRequired: true,
      anonymizationRequired: true
    });
  }

  /**
   * Initialize compliance rules
   */
  initializeCompliance() {
    // GDPR compliance
    this.addCompliance('gdpr', {
      dataMinimization: true,
      purposeLimitation: true,
      consentRequired: true,
      rightToErasure: true,
      dataPortability: true
    });
    
    // SOC2 compliance
    this.addCompliance('soc2', {
      accessControl: true,
      encryption: true,
      monitoring: true,
      incidentResponse: true,
      changeManagement: true
    });
    
    // ISO27001 compliance
    this.addCompliance('iso27001', {
      riskAssessment: true,
      assetManagement: true,
      accessControl: true,
      cryptography: true,
      physicalSecurity: true
    });
  }

  /**
   * Add role
   */
  addRole(name, config) {
    this.roles.set(name, {
      name,
      ...config,
      created: Date.now()
    });
  }

  /**
   * Add policy
   */
  addPolicy(name, rules) {
    this.policies.set(name, {
      name,
      rules,
      created: Date.now()
    });
  }

  /**
   * Add compliance rule
   */
  addCompliance(standard, requirements) {
    this.compliance.set(standard, {
      standard,
      requirements,
      created: Date.now()
    });
  }

  /**
   * Authenticate user
   */
  async authenticate(credentials) {
    const { username, password, mfaToken } = credentials;
    
    try {
      // Validate credentials
      const user = await this.validateCredentials(username, password);
      
      // Check MFA if required
      if (this.policies.get('session').rules.requireMFA) {
        const mfaValid = await this.validateMFA(user, mfaToken);
        if (!mfaValid) {
          throw new Error('Invalid MFA token');
        }
      }
      
      // Create session
      const session = this.createSession(user);
      
      // Audit log
      this.auditLog.push({
        event: 'authentication',
        user: username,
        success: true,
        timestamp: Date.now()
      });
      
      this.emit('auth:success', { user, session });
      
      return {
        success: true,
        session,
        user
      };
      
    } catch (error) {
      // Audit failed attempt
      this.auditLog.push({
        event: 'authentication',
        user: username,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      
      this.emit('auth:failed', { username, error: error.message });
      
      throw error;
    }
  }

  /**
   * Authorize action
   */
  async authorize(sessionId, action, resource = null) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Invalid session');
    }
    
    // Check session validity
    if (this.isSessionExpired(session)) {
      this.sessions.delete(sessionId);
      throw new Error('Session expired');
    }
    
    // Get user role
    const role = this.roles.get(session.user.role);
    if (!role) {
      throw new Error('Invalid role');
    }
    
    // Check permission
    const hasPermission = this.checkPermission(role, action, resource);
    
    // Audit if required
    if (this.shouldAuditAction(action)) {
      this.auditLog.push({
        event: 'authorization',
        user: session.user.username,
        action,
        resource,
        granted: hasPermission,
        timestamp: Date.now()
      });
    }
    
    if (!hasPermission) {
      this.emit('auth:denied', { 
        user: session.user.username, 
        action, 
        resource 
      });
      
      throw new Error('Permission denied');
    }
    
    return {
      granted: true,
      user: session.user.username,
      action,
      resource
    };
  }

  /**
   * Check permission
   */
  checkPermission(role, action, resource) {
    // Check wildcard permission
    if (role.permissions.includes('*')) {
      return true;
    }
    
    // Check specific permission
    if (role.permissions.includes(action)) {
      // Additional resource-level check if needed
      if (resource) {
        return this.checkResourceAccess(role, resource);
      }
      return true;
    }
    
    return false;
  }

  /**
   * Check resource access
   */
  checkResourceAccess(role, resource) {
    // Check security level
    if (resource.securityLevel && resource.securityLevel > role.level) {
      return false;
    }
    
    // Additional checks based on resource type
    return true;
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    if (!this.config.enableEncryption) {
      return data;
    }
    
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        this.config.encryptionAlgorithm,
        this.encryptionKey,
        iv
      );
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error(`Encryption failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    if (!this.config.enableEncryption) {
      return encryptedData;
    }
    
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipheriv(
        this.config.encryptionAlgorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error(`Decryption failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Hash data
   */
  hash(data) {
    return crypto
      .createHash(this.config.hashAlgorithm)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Validate credentials
   */
  async validateCredentials(username, password) {
    // This would connect to a real user database
    // For demo, using mock validation
    
    if (!username || !password) {
      throw new Error('Invalid credentials');
    }
    
    // Mock user
    return {
      id: 'user_' + this.hash(username),
      username,
      role: 'executive',
      email: `${username}@example.com`
    };
  }

  /**
   * Validate MFA
   */
  async validateMFA(user, token) {
    // This would validate against a real MFA service
    // For demo, accepting any 6-digit token
    return token && token.length === 6;
  }

  /**
   * Create session
   */
  createSession(user) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    const session = {
      id: sessionId,
      user,
      created: Date.now(),
      lastActivity: Date.now(),
      expires: Date.now() + this.config.sessionTimeout
    };
    
    this.sessions.set(sessionId, session);
    
    return session;
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session) {
    return Date.now() > session.expires;
  }

  /**
   * Detect threats
   */
  async detectThreats(activity) {
    if (!this.config.enableThreatDetection) {
      return [];
    }
    
    const threats = [];
    
    // Check for suspicious patterns
    if (this.isSuspiciousActivity(activity)) {
      threats.push({
        type: 'suspicious_activity',
        severity: 'medium',
        details: activity,
        timestamp: Date.now()
      });
    }
    
    // Check for brute force attempts
    if (this.isBruteForceAttempt(activity)) {
      threats.push({
        type: 'brute_force',
        severity: 'high',
        details: activity,
        timestamp: Date.now()
      });
    }
    
    // Check for privilege escalation
    if (this.isPrivilegeEscalation(activity)) {
      threats.push({
        type: 'privilege_escalation',
        severity: 'critical',
        details: activity,
        timestamp: Date.now()
      });
    }
    
    // Store threats
    this.threats.push(...threats);
    
    // Emit threat events
    for (const threat of threats) {
      this.emit('threat:detected', threat);
    }
    
    return threats;
  }

  /**
   * Check for suspicious activity
   */
  isSuspiciousActivity(activity) {
    // Check for unusual patterns
    const suspiciousPatterns = [
      'multiple_failed_logins',
      'unusual_access_time',
      'geographic_anomaly',
      'rapid_permission_changes'
    ];
    
    return suspiciousPatterns.some(pattern => 
      activity.type === pattern
    );
  }

  /**
   * Check for brute force attempts
   */
  isBruteForceAttempt(activity) {
    if (activity.type !== 'login_attempt') {
      return false;
    }
    
    // Count recent failed attempts
    const recentAttempts = this.auditLog.filter(log => 
      log.event === 'authentication' &&
      !log.success &&
      log.user === activity.user &&
      Date.now() - log.timestamp < 300000 // 5 minutes
    );
    
    return recentAttempts.length >= this.config.maxLoginAttempts;
  }

  /**
   * Check for privilege escalation
   */
  isPrivilegeEscalation(activity) {
    return activity.type === 'permission_change' &&
           activity.newLevel > activity.oldLevel;
  }

  /**
   * Check compliance
   */
  async checkCompliance(standard = null) {
    const results = {};
    
    const standards = standard ? [standard] : Array.from(this.compliance.keys());
    
    for (const std of standards) {
      const requirements = this.compliance.get(std);
      if (!requirements) continue;
      
      const checks = {};
      let compliant = true;
      
      for (const [req, expected] of Object.entries(requirements.requirements)) {
        const actual = await this.checkRequirement(std, req);
        checks[req] = {
          expected,
          actual,
          compliant: actual === expected
        };
        
        if (!checks[req].compliant) {
          compliant = false;
        }
      }
      
      results[std] = {
        compliant,
        checks,
        timestamp: Date.now()
      };
    }
    
    return results;
  }

  /**
   * Check specific requirement
   */
  async checkRequirement(standard, requirement) {
    // This would check actual compliance status
    // For demo, returning true for most requirements
    
    const implemented = [
      'accessControl',
      'encryption',
      'monitoring',
      'dataMinimization'
    ];
    
    return implemented.includes(requirement);
  }

  /**
   * Get audit log
   */
  getAuditLog(filters = {}) {
    let logs = [...this.auditLog];
    
    // Apply filters
    if (filters.user) {
      logs = logs.filter(log => log.user === filters.user);
    }
    
    if (filters.event) {
      logs = logs.filter(log => log.event === filters.event);
    }
    
    if (filters.startTime) {
      logs = logs.filter(log => log.timestamp >= filters.startTime);
    }
    
    if (filters.endTime) {
      logs = logs.filter(log => log.timestamp <= filters.endTime);
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }
    
    return logs;
  }

  /**
   * Should audit action
   */
  shouldAuditAction(action) {
    const permission = this.permissions.get(action);
    return permission && permission.requiresAudit;
  }

  /**
   * Should audit category/action
   */
  shouldAudit(category, action) {
    const auditableCategories = ['decision', 'strategy', 'resource', 'system'];
    const auditableActions = ['create', 'approve', 'delete', 'modify', 'configure'];
    
    return auditableCategories.includes(category) || 
           auditableActions.includes(action);
  }

  /**
   * Generate encryption key
   */
  generateKey() {
    return crypto.randomBytes(32);
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Every minute
  }

  /**
   * Perform security checks
   */
  async performSecurityChecks() {
    // Check for expired sessions
    for (const [id, session] of this.sessions) {
      if (this.isSessionExpired(session)) {
        this.sessions.delete(id);
        logger.info(`Session expired: ${id}`);
      }
    }
    
    // Check for threats
    const recentActivity = this.getRecentActivity();
    await this.detectThreats(recentActivity);
    
    // Check compliance
    if (Math.random() < 0.1) { // 10% chance to run compliance check
      await this.checkCompliance();
    }
  }

  /**
   * Get recent activity
   */
  getRecentActivity() {
    const fiveMinutesAgo = Date.now() - 300000;
    
    return {
      type: 'activity_summary',
      logins: this.auditLog.filter(log => 
        log.event === 'authentication' && 
        log.timestamp > fiveMinutesAgo
      ).length,
      authorizations: this.auditLog.filter(log => 
        log.event === 'authorization' && 
        log.timestamp > fiveMinutesAgo
      ).length
    };
  }

  /**
   * Get security status
   */
  getStatus() {
    return {
      encryptionEnabled: this.config.enableEncryption,
      auditLoggingEnabled: this.config.enableAuditLogging,
      complianceEnabled: this.config.enableComplianceChecks,
      threatDetectionEnabled: this.config.enableThreatDetection,
      activeSessions: this.sessions.size,
      auditLogSize: this.auditLog.length,
      threatsDetected: this.threats.length,
      rolesConfigured: this.roles.size,
      permissionsConfigured: this.permissions.size
    };
  }

  /**
   * Shutdown security manager
   */
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Clear sessions
    this.sessions.clear();
    
    logger.info('🔒 Security Manager shut down');
  }
}

module.exports = {
  ExecutiveSecurityManager,
  SecurityLevel,
  AccessControl
};