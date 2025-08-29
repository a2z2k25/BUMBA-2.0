/**
 * BUMBA CLI 1.0 Agent Lifecycle Manager
 * Manages spawning, coordination, and dissolution of specialist agents
 */

const { EventEmitter } = require('events');
const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
// Lazy load specialist pool to avoid circular dependency
let SpecialistPool = null;
let PRIORITY_LEVELS = null;
const { logger } = require('../logging/bumba-logger');

/**
 * Custom Security Error for input validation failures
 */
class SecurityError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SecurityError';
    this.details = details;
    this.timestamp = Date.now();
  }
}

/**
 * Role-Based Access Control System
 */
class RoleBasedAccessControl {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.userRoles = new Map();
    
    this.initializeDefaultRoles();
  }

  initializeDefaultRoles() {
    // Define permissions
    const permissions = {
      'spawn:specialist': 'Can spawn new specialists',
      'dissolve:specialist': 'Can dissolve existing specialists', 
      'configure:specialist': 'Can configure specialist settings',
      'view:status': 'Can view system status',
      'admin:force_terminate': 'Can force terminate any specialist',
      'admin:dissolve_all': 'Can dissolve all specialists',
      'admin:system_control': 'Full system control access'
    };

    for (const [perm, desc] of Object.entries(permissions)) {
      this.permissions.set(perm, { description: desc, created: Date.now() });
    }

    // Define roles
    this.roles.set('user', {
      permissions: ['spawn:specialist', 'dissolve:specialist', 'configure:specialist', 'view:status'],
      description: 'Regular user with basic specialist management',
      level: 1
    });

    this.roles.set('admin', {
      permissions: ['*'], // All permissions
      description: 'Administrator with full system access',
      level: 10
    });

    this.roles.set('manager', {
      permissions: ['spawn:specialist', 'dissolve:specialist', 'configure:specialist', 'view:status', 'admin:force_terminate'],
      description: 'Manager with enhanced specialist control',
      level: 5
    });
  }

  assignRole(userId, role) {
    if (!this.roles.has(role)) {
      throw new Error(`Unknown role: ${role}`);
    }
    
    this.userRoles.set(userId, {
      role,
      assignedAt: Date.now(),
      assignedBy: 'system'
    });
    
    logger.info(`🔐 Role assigned: ${userId} -> ${role}`);
  }

  checkPermission(userId, permission) {
    const userRole = this.userRoles.get(userId);
    if (!userRole) {
      // Default role for unassigned users
      this.assignRole(userId, 'user');
      return this.checkPermission(userId, permission);
    }

    const role = this.roles.get(userRole.role);
    if (!role) {
      return false;
    }

    // Admin has all permissions
    if (role.permissions.includes('*')) {
      return true;
    }

    return role.permissions.includes(permission);
  }

  getUserRole(userId) {
    const userRole = this.userRoles.get(userId);
    return userRole ? userRole.role : null;
  }

  listUserPermissions(userId) {
    const userRole = this.userRoles.get(userId);
    if (!userRole) return [];

    const role = this.roles.get(userRole.role);
    if (!role) return [];

    if (role.permissions.includes('*')) {
      return Array.from(this.permissions.keys());
    }

    return role.permissions;
  }
}

/**
 * Comprehensive Audit Logger
 */
class AuditLogger {
  constructor() {
    this.auditLog = [];
    this.maxLogEntries = 10000;
    this.logFile = null; // In production, would write to file
  }

  logSecurityEvent(event, details = {}) {
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'security',
      event,
      details: this.sanitizeDetails(details),
      severity: this.determineSeverity(event),
      ip: details.ip || 'unknown',
      userId: details.userId || 'anonymous',
      action: details.action || event,
      resource: details.resource || 'system',
      result: details.result || 'unknown'
    };

    this.auditLog.push(auditEntry);
    this.enforceLogLimit();

    // Log to system logger based on severity
    if (auditEntry.severity === 'high' || auditEntry.severity === 'critical') {
      logger.error(`🔴 Security Audit [${auditEntry.severity.toUpperCase()}]:`, auditEntry);
    } else {
      logger.info(`🔍 Security Audit:`, auditEntry);
    }

    return auditEntry.id;
  }

  logAccessAttempt(userId, action, resource, result, details = {}) {
    return this.logSecurityEvent('access_attempt', {
      userId,
      action,
      resource,
      result,
      ...details
    });
  }

  logPrivilegeEscalation(userId, fromRole, toRole, details = {}) {
    return this.logSecurityEvent('privilege_escalation', {
      userId,
      fromRole,
      toRole,
      result: 'attempted',
      severity: 'high',
      ...details
    });
  }

  logSecurityViolation(violation, details = {}) {
    return this.logSecurityEvent('security_violation', {
      violation,
      severity: 'critical',
      ...details
    });
  }

  sanitizeDetails(details) {
    const sanitized = { ...details };
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  determineSeverity(event) {
    const severityMap = {
      'access_denied': 'medium',
      'privilege_escalation': 'high',
      'security_violation': 'critical',
      'unauthorized_access': 'high',
      'injection_attempt': 'critical',
      'rate_limit_exceeded': 'medium',
      'access_granted': 'low',
      'login_success': 'low',
      'login_failure': 'medium'
    };

    return severityMap[event] || 'low';
  }

  enforceLogLimit() {
    if (this.auditLog.length > this.maxLogEntries) {
      const overflow = this.auditLog.length - this.maxLogEntries;
      this.auditLog.splice(0, overflow);
      logger.warn(`🗂️ Audit log limit reached, removed ${overflow} oldest entries`);
    }
  }

  getAuditLog(filters = {}) {
    let filteredLog = [...this.auditLog];

    if (filters.userId) {
      filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
    }

    if (filters.type) {
      filteredLog = filteredLog.filter(entry => entry.type === filters.type);
    }

    if (filters.severity) {
      filteredLog = filteredLog.filter(entry => entry.severity === filters.severity);
    }

    if (filters.startTime) {
      filteredLog = filteredLog.filter(entry => entry.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      filteredLog = filteredLog.filter(entry => entry.timestamp <= filters.endTime);
    }

    return filteredLog;
  }

  getSecurityMetrics() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentEvents = this.auditLog.filter(entry => entry.timestamp >= last24h);

    return {
      totalEvents: this.auditLog.length,
      recentEvents: recentEvents.length,
      severityBreakdown: this.groupBySeverity(recentEvents),
      topEvents: this.getTopEvents(recentEvents),
      uniqueUsers: new Set(recentEvents.map(e => e.userId)).size,
      securityViolations: recentEvents.filter(e => e.event === 'security_violation').length
    };
  }

  groupBySeverity(events) {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});
  }

  getTopEvents(events) {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));
  }
}

/**
 * State Persistence Manager for Agent Lifecycle
 */
class StatePersistenceManager {
  constructor() {
    this.persistencePath = './data/agent-lifecycle-state';
    this.backupPath = './data/backups';
    this.stateCache = new Map();
    this.lastSave = Date.now();
    this.saveLock = false;
  }

  /**
   * Persist agent lifecycle state
   */
  async persistState(agentId, state, metadata = {}) {
    if (this.saveLock) {
      logger.debug('⏳ State save in progress, queuing...');
      return this.queueStateSave(agentId, state, metadata);
    }

    try {
      this.saveLock = true;
      
      const stateEntry = {
        agentId,
        state: this.sanitizeState(state),
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          version: this.getStateVersion(),
          checksum: this.calculateChecksum(state)
        },
        persisted: Date.now()
      };

      // Cache state
      this.stateCache.set(agentId, stateEntry);

      // Persist to storage (in production would use database/file system)
      await this.writeStateToStorage(stateEntry);
      
      this.lastSave = Date.now();
      
      logger.debug(`💾 State persisted for agent ${agentId}`);
      return stateEntry.metadata.checksum;
      
    } catch (error) {
      logger.error(`Failed to persist state for agent ${agentId}:`, error);
      throw error;
    } finally {
      this.saveLock = false;
    }
  }

  /**
   * Restore agent state from persistence
   */
  async restoreState(agentId) {
    try {
      // Check cache first
      if (this.stateCache.has(agentId)) {
        const cached = this.stateCache.get(agentId);
        logger.debug(`🔄 State restored from cache for agent ${agentId}`);
        return cached;
      }

      // Load from storage
      const stateEntry = await this.loadStateFromStorage(agentId);
      if (stateEntry) {
        // Validate state integrity
        const isValid = await this.validateStateIntegrity(stateEntry);
        if (!isValid) {
          logger.warn(`🟠️ State corruption detected for agent ${agentId}, attempting recovery`);
          return await this.recoverState(agentId);
        }

        // Cache restored state
        this.stateCache.set(agentId, stateEntry);
        logger.info(`📥 State restored for agent ${agentId}`);
        return stateEntry;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to restore state for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Backup current state
   */
  async createBackup() {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backup = {
        id: backupId,
        timestamp: Date.now(),
        states: Array.from(this.stateCache.entries()),
        metadata: {
          totalAgents: this.stateCache.size,
          version: this.getStateVersion(),
          compression: 'none'
        }
      };

      await this.writeBackupToStorage(backup);
      await this.cleanupOldBackups();
      
      logger.info(`📦 State backup created: ${backupId}`);
      return backupId;
    } catch (error) {
      logger.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Recover state from corruption
   */
  async recoverState(agentId) {
    try {
      // Try to load from most recent backup
      const backups = await this.getAvailableBackups();
      
      for (const backup of backups.slice(0, 3)) { // Try last 3 backups
        const backupData = await this.loadBackupFromStorage(backup.id);
        const agentState = backupData.states.find(([id]) => id === agentId);
        
        if (agentState) {
          const [, stateEntry] = agentState;
          const isValid = await this.validateStateIntegrity(stateEntry);
          
          if (isValid) {
            logger.info(`🔧 State recovered for agent ${agentId} from backup ${backup.id}`);
            this.stateCache.set(agentId, stateEntry);
            return stateEntry;
          }
        }
      }

      logger.warn(`🔴 Could not recover state for agent ${agentId}`);
      return null;
    } catch (error) {
      logger.error(`Recovery failed for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Clear persisted state for agent
   */
  async clearState(agentId) {
    try {
      this.stateCache.delete(agentId);
      await this.removeStateFromStorage(agentId);
      logger.debug(`🗑️ State cleared for agent ${agentId}`);
    } catch (error) {
      logger.error(`Failed to clear state for agent ${agentId}:`, error);
    }
  }

  // Helper methods (would interface with actual storage in production)
  
  sanitizeState(state) {
    const sanitized = { ...state };
    const sensitiveFields = ['password', 'token', 'key', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    }
    
    return sanitized;
  }

  calculateChecksum(state) {
    const stateStr = JSON.stringify(state);
    // Simple checksum - in production would use crypto
    return stateStr.length.toString(16) + '_' + Date.now().toString(36);
  }

  getStateVersion() {
    return '1.0.0';
  }

  async validateStateIntegrity(stateEntry) {
    if (!stateEntry || !stateEntry.state || !stateEntry.metadata) {
      return false;
    }
    
    const currentChecksum = this.calculateChecksum(stateEntry.state);
    return currentChecksum === stateEntry.metadata.checksum;
  }

  async writeStateToStorage(stateEntry) {
    // Mock storage write
    logger.debug(`💾 Writing state to storage: ${stateEntry.agentId}`);
  }

  async loadStateFromStorage(agentId) {
    // Mock storage read
    logger.debug(`📥 Loading state from storage: ${agentId}`);
    return null; // Would return actual state in production
  }

  async writeBackupToStorage(backup) {
    logger.debug(`📦 Writing backup to storage: ${backup.id}`);
  }

  async loadBackupFromStorage(backupId) {
    logger.debug(`📥 Loading backup from storage: ${backupId}`);
    return { states: [] };
  }

  async removeStateFromStorage(agentId) {
    logger.debug(`🗑️ Removing state from storage: ${agentId}`);
  }

  async getAvailableBackups() {
    return []; // Would return actual backups in production
  }

  async cleanupOldBackups() {
    logger.debug('🧹 Cleaning up old backups');
  }

  async queueStateSave(agentId, state, metadata) {
    // Simple queue implementation
    setTimeout(() => {
      this.persistState(agentId, state, metadata);
    }, 100);
  }
}

/**
 * Concurrent State Manager with locking
 */
class ConcurrentStateManager {
  constructor() {
    this.stateLocks = new Map();
    this.stateVersions = new Map();
    this.operationQueue = new Map();
  }

  /**
   * Acquire exclusive lock for state modification
   */
  async acquireStateLock(agentId, operation = 'modify') {
    const lockId = `lock_${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if already locked
    if (this.stateLocks.has(agentId)) {
      return await this.waitForLock(agentId, operation);
    }

    // Create lock
    const lock = {
      id: lockId,
      agentId,
      operation,
      acquired: Date.now(),
      holder: operation,
      timeout: setTimeout(() => {
        this.releaseLock(lockId);
        logger.warn(`⏰ Lock timeout for agent ${agentId}, operation ${operation}`);
      }, 30000) // 30 second timeout
    };

    this.stateLocks.set(agentId, lock);
    logger.debug(`🔒 State lock acquired: ${agentId} for ${operation}`);
    
    return {
      lockId,
      release: () => this.releaseLock(lockId)
    };
  }

  /**
   * Release state lock
   */
  releaseLock(lockId) {
    for (const [agentId, lock] of this.stateLocks.entries()) {
      if (lock.id === lockId) {
        clearTimeout(lock.timeout);
        this.stateLocks.delete(agentId);
        logger.debug(`🔓 State lock released: ${agentId}`);
        
        // Process queued operations
        this.processQueuedOperations(agentId);
        break;
      }
    }
  }

  /**
   * Wait for lock to be available
   */
  async waitForLock(agentId, operation) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Lock timeout for agent ${agentId}, operation ${operation}`));
      }, 30000);

      const checkLock = () => {
        if (!this.stateLocks.has(agentId)) {
          clearTimeout(timeout);
          this.acquireStateLock(agentId, operation).then(resolve).catch(reject);
        } else {
          setTimeout(checkLock, 100);
        }
      };

      checkLock();
    });
  }

  /**
   * Safely transition agent state
   */
  async safeStateTransition(agentId, currentState, newState, transitionFn) {
    const lock = await this.acquireStateLock(agentId, 'transition');
    
    try {
      // Increment version
      const currentVersion = this.stateVersions.get(agentId) || 0;
      const newVersion = currentVersion + 1;
      
      // Execute transition
      const result = await transitionFn(currentState, newState);
      
      // Update version
      this.stateVersions.set(agentId, newVersion);
      
      logger.debug(`🔄 State transition completed: ${agentId} v${currentVersion} -> v${newVersion}`);
      return result;
      
    } catch (error) {
      logger.error(`State transition failed for agent ${agentId}:`, error);
      throw error;
    } finally {
      lock.release();
    }
  }

  /**
   * Check for state conflicts
   */
  detectStateConflict(agentId, expectedVersion) {
    const currentVersion = this.stateVersions.get(agentId) || 0;
    return currentVersion !== expectedVersion;
  }

  /**
   * Process queued operations for an agent
   */
  processQueuedOperations(agentId) {
    const queue = this.operationQueue.get(agentId);
    if (queue && queue.length > 0) {
      const nextOperation = queue.shift();
      if (nextOperation) {
        setTimeout(() => {
          nextOperation.execute();
        }, 10);
      }
    }
  }

  /**
   * Get current state version
   */
  getStateVersion(agentId) {
    return this.stateVersions.get(agentId) || 0;
  }

  /**
   * Reset state version (for testing/recovery)
   */
  resetStateVersion(agentId) {
    this.stateVersions.delete(agentId);
    logger.debug(`🔄 State version reset for agent ${agentId}`);
  }
}

/**
 * Circuit Breaker Pattern Implementation
 */
class CircuitBreaker {
  constructor(config = {}) {
    this.threshold = config.threshold || 5; // Failure threshold
    this.timeout = config.timeout || 60000; // 1 minute timeout
    this.resetTimeout = config.resetTimeout || 300000; // 5 minutes reset
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
    
    this.operationMetrics = new Map();
    this.listeners = [];
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute(operationName, operation, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        logger.info(`🔄 Circuit breaker HALF_OPEN for ${operationName}`);
      } else {
        logger.warn(`🟢 Circuit breaker OPEN for ${operationName}, using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      }
    }

    try {
      const startTime = Date.now();
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);

      this.recordSuccess(operationName, Date.now() - startTime);
      return result;

    } catch (error) {
      this.recordFailure(operationName, error);
      throw error;
    }
  }

  /**
   * Record successful operation
   */
  recordSuccess(operationName, duration) {
    this.updateOperationMetrics(operationName, true, duration);

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successful operations
        this.state = 'CLOSED';
        this.failureCount = 0;
        logger.info(`🏁 Circuit breaker CLOSED for ${operationName}`);
        this.notifyStateChange('CLOSED', operationName);
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = Math.max(0, this.failureCount - 1); // Slowly reduce failure count on success
    }
  }

  /**
   * Record failed operation
   */
  recordFailure(operationName, error) {
    this.updateOperationMetrics(operationName, false);
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.warn(`🔴 Circuit breaker failure ${this.failureCount}/${this.threshold} for ${operationName}: ${error.message}`);

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      logger.error(`🟢 Circuit breaker OPEN for ${operationName} (${this.failureCount} failures)`);
      this.notifyStateChange('OPEN', operationName, error);
    }
  }

  /**
   * Update operation metrics
   */
  updateOperationMetrics(operationName, success, duration = 0) {
    if (!this.operationMetrics.has(operationName)) {
      this.operationMetrics.set(operationName, {
        totalCalls: 0,
        successCalls: 0,
        failureCalls: 0,
        averageDuration: 0,
        lastCall: 0
      });
    }

    const metrics = this.operationMetrics.get(operationName);
    metrics.totalCalls++;
    metrics.lastCall = Date.now();

    if (success) {
      metrics.successCalls++;
      // Update average duration (moving average)
      metrics.averageDuration = (metrics.averageDuration * (metrics.successCalls - 1) + duration) / metrics.successCalls;
    } else {
      metrics.failureCalls++;
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
      operations: Array.from(this.operationMetrics.entries()).map(([name, metrics]) => ({
        name,
        ...metrics,
        successRate: metrics.totalCalls > 0 ? Math.round((metrics.successCalls / metrics.totalCalls) * 100) : 0
      }))
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    logger.info('🔄 Circuit breaker manually reset');
    this.notifyStateChange('RESET');
  }

  /**
   * Add state change listener
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Notify listeners of state changes
   */
  notifyStateChange(newState, operationName = null, error = null) {
    const event = {
      timestamp: Date.now(),
      state: newState,
      operationName,
      error: error ? error.message : null
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        logger.error('Circuit breaker listener error:', err);
      }
    });
  }
}

/**
 * Retry Manager with Exponential Backoff
 */
class RetryManager {
  constructor(config = {}) {
    this.maxRetries = config.maxRetries || 3;
    this.baseDelay = config.baseDelay || 1000; // 1 second
    this.maxDelay = config.maxDelay || 30000; // 30 seconds
    this.jitterEnabled = config.jitterEnabled !== false;
    this.retryMetrics = new Map();
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(operationName, operation, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const retryCondition = options.retryCondition || this.defaultRetryCondition;
    
    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await operation();
        
        if (attempt > 0) {
          this.recordRetrySuccess(operationName, attempt);
          logger.info(`🏁 Operation ${operationName} succeeded on attempt ${attempt + 1}`);
        }
        
        return result;

      } catch (error) {
        lastError = error;
        
        if (attempt >= maxRetries || !retryCondition(error, attempt)) {
          this.recordRetryFailure(operationName, attempt + 1);
          logger.error(`🔴 Operation ${operationName} failed after ${attempt + 1} attempts: ${error.message}`);
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        logger.warn(`🔄 Retrying ${operationName} in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
        
        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  calculateDelay(attempt) {
    const exponentialDelay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    
    if (this.jitterEnabled) {
      // Add random jitter (±25%)
      const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
      return Math.max(0, exponentialDelay + jitter);
    }
    
    return exponentialDelay;
  }

  /**
   * Default retry condition
   */
  defaultRetryCondition(error, attempt) {
    // Retry on network errors, timeouts, and 5xx HTTP errors
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'NetworkError',
      'TimeoutError'
    ];

    return retryableErrors.some(errorType => error.message.includes(errorType)) ||
           (error.status >= 500 && error.status < 600);
  }

  /**
   * Record successful retry operation
   */
  recordRetrySuccess(operationName, attempts) {
    if (!this.retryMetrics.has(operationName)) {
      this.retryMetrics.set(operationName, {
        totalOperations: 0,
        totalRetries: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageAttempts: 0
      });
    }

    const metrics = this.retryMetrics.get(operationName);
    metrics.totalOperations++;
    metrics.totalRetries += attempts;
    metrics.successfulRetries++;
    metrics.averageAttempts = metrics.totalRetries / metrics.totalOperations;
  }

  /**
   * Record failed retry operation
   */
  recordRetryFailure(operationName, attempts) {
    if (!this.retryMetrics.has(operationName)) {
      this.retryMetrics.set(operationName, {
        totalOperations: 0,
        totalRetries: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageAttempts: 0
      });
    }

    const metrics = this.retryMetrics.get(operationName);
    metrics.totalOperations++;
    metrics.totalRetries += attempts;
    metrics.failedRetries++;
    metrics.averageAttempts = metrics.totalRetries / metrics.totalOperations;
  }

  /**
   * Get retry metrics
   */
  getMetrics() {
    return Array.from(this.retryMetrics.entries()).map(([operationName, metrics]) => ({
      operationName,
      ...metrics,
      successRate: metrics.totalOperations > 0 ? 
        Math.round((metrics.successfulRetries / metrics.totalOperations) * 100) : 0
    }));
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Comprehensive Health Monitor
 */
class HealthMonitor {
  constructor(config = {}) {
    this.checkInterval = config.checkInterval || 15000; // 15 seconds
    this.healthChecks = new Map();
    this.healthHistory = [];
    this.alertThresholds = {
      cpu: 80, // 80% CPU
      memory: 80, // 80% Memory
      responseTime: 5000, // 5 seconds
      errorRate: 10 // 10% error rate
    };
    this.isMonitoring = false;
    this.monitoringTimer = null;
  }

  /**
   * Register health check
   */
  registerHealthCheck(name, checkFunction, config = {}) {
    this.healthChecks.set(name, {
      name,
      checkFunction,
      enabled: config.enabled !== false,
      timeout: config.timeout || 5000,
      critical: config.critical || false,
      lastCheck: 0,
      lastResult: null,
      consecutiveFailures: 0,
      totalChecks: 0,
      successfulChecks: 0
    });

    logger.info(`🟢 Health check registered: ${name}`);
  }

  /**
   * Start health monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);

    logger.info('🟢 Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    logger.info('🟢 Health monitoring stopped');
  }

  /**
   * Perform all health checks
   */
  async performHealthChecks() {
    const timestamp = Date.now();
    const results = [];

    for (const [name, healthCheck] of this.healthChecks.entries()) {
      if (!healthCheck.enabled) continue;

      try {
        const result = await this.runSingleHealthCheck(healthCheck);
        results.push(result);
        
        healthCheck.lastCheck = timestamp;
        healthCheck.lastResult = result;
        healthCheck.totalChecks++;
        
        if (result.status === 'healthy') {
          healthCheck.successfulChecks++;
          healthCheck.consecutiveFailures = 0;
        } else {
          healthCheck.consecutiveFailures++;
        }

      } catch (error) {
        const result = {
          name,
          status: 'unhealthy',
          message: error.message,
          timestamp,
          duration: 0,
          critical: healthCheck.critical
        };

        results.push(result);
        healthCheck.lastCheck = timestamp;
        healthCheck.lastResult = result;
        healthCheck.totalChecks++;
        healthCheck.consecutiveFailures++;
        
        logger.error(`🔴 Health check failed: ${name} - ${error.message}`);
      }
    }

    // Record overall health status
    const healthStatus = this.calculateOverallHealth(results);
    this.recordHealthHistory(healthStatus, results);
    
    // Check for alerts
    this.checkHealthAlerts(healthStatus, results);

    return healthStatus;
  }

  /**
   * Run single health check with timeout
   */
  async runSingleHealthCheck(healthCheck) {
    const startTime = Date.now();
    
    const result = await Promise.race([
      healthCheck.checkFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
      )
    ]);

    const duration = Date.now() - startTime;

    return {
      name: healthCheck.name,
      status: result.status || 'healthy',
      message: result.message || 'OK',
      details: result.details || {},
      timestamp: Date.now(),
      duration,
      critical: healthCheck.critical
    };
  }

  /**
   * Calculate overall system health
   */
  calculateOverallHealth(results) {
    if (results.length === 0) {
      return { status: 'unknown', score: 0 };
    }

    const criticalFailures = results.filter(r => r.critical && r.status !== 'healthy').length;
    const totalFailures = results.filter(r => r.status !== 'healthy').length;
    const healthyChecks = results.filter(r => r.status === 'healthy').length;

    if (criticalFailures > 0) {
      return { status: 'critical', score: 0 };
    }

    const healthScore = (healthyChecks / results.length) * 100;

    if (healthScore >= 90) return { status: 'healthy', score: healthScore };
    if (healthScore >= 70) return { status: 'degraded', score: healthScore };
    return { status: 'unhealthy', score: healthScore };
  }

  /**
   * Record health history
   */
  recordHealthHistory(healthStatus, results) {
    this.healthHistory.push({
      timestamp: Date.now(),
      overall: healthStatus,
      checks: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      unhealthy: results.filter(r => r.status !== 'healthy').length,
      critical: results.filter(r => r.critical && r.status !== 'healthy').length
    });

    // Keep last 288 entries (24 hours at 5-minute intervals)
    if (this.healthHistory.length > 288) {
      this.healthHistory.shift();
    }
  }

  /**
   * Check for health alerts
   */
  checkHealthAlerts(healthStatus, results) {
    if (healthStatus.status === 'critical') {
      logger.error('🔴 CRITICAL: System health is critical!');
    } else if (healthStatus.status === 'unhealthy') {
      logger.warn('🟠️ WARNING: System health is degraded');
    }

    // Alert on consecutive failures
    for (const [name, healthCheck] of this.healthChecks.entries()) {
      if (healthCheck.consecutiveFailures >= 3) {
        logger.error(`🔴 ALERT: Health check ${name} has failed ${healthCheck.consecutiveFailures} times consecutively`);
      }
    }
  }

  /**
   * Get current health status
   */
  async getCurrentHealth() {
    if (!this.isMonitoring) {
      return await this.performHealthChecks();
    }

    // Return last known health status
    const recentHistory = this.healthHistory.slice(-1)[0];
    if (recentHistory) {
      return recentHistory.overall;
    }

    return { status: 'unknown', score: 0 };
  }

  /**
   * Get health metrics
   */
  getHealthMetrics() {
    const healthChecks = Array.from(this.healthChecks.entries()).map(([name, check]) => ({
      name,
      enabled: check.enabled,
      critical: check.critical,
      totalChecks: check.totalChecks,
      successfulChecks: check.successfulChecks,
      consecutiveFailures: check.consecutiveFailures,
      successRate: check.totalChecks > 0 ? 
        Math.round((check.successfulChecks / check.totalChecks) * 100) : 0,
      lastCheck: check.lastCheck,
      lastResult: check.lastResult
    }));

    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.checkInterval,
      healthChecks,
      recentHistory: this.healthHistory.slice(-24), // Last 24 checks
      overallStats: this.getOverallStats()
    };
  }

  /**
   * Get overall health statistics
   */
  getOverallStats() {
    if (this.healthHistory.length === 0) {
      return { uptime: 0, averageHealth: 0, incidents: 0 };
    }

    const totalChecks = this.healthHistory.length;
    const healthyChecks = this.healthHistory.filter(h => h.overall.status === 'healthy').length;
    const incidents = this.healthHistory.filter(h => h.overall.status === 'critical').length;
    const averageHealth = this.healthHistory.reduce((sum, h) => sum + h.overall.score, 0) / totalChecks;

    return {
      uptime: Math.round((healthyChecks / totalChecks) * 100),
      averageHealth: Math.round(averageHealth),
      incidents,
      totalChecks
    };
  }
}

/**
 * Advanced Event Manager with sophisticated event handling
 */
class AdvancedEventManager extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for complex systems
    
    this.eventHistory = [];
    this.eventMetrics = new Map();
    this.eventFilters = new Map();
    this.eventMiddleware = [];
    this.eventQueue = [];
    this.processingQueue = false;
    
    this.config = {
      enableHistory: true,
      enableMetrics: true,
      enableQueuing: true,
      maxHistorySize: 1000,
      queueProcessingInterval: 100
    };
    
    // Start queue processing
    this.startQueueProcessing();
  }

  /**
   * Enhanced emit with middleware and queuing
   */
  enhancedEmit(eventType, eventData, options = {}) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      source: options.source || 'unknown',
      priority: options.priority || 'normal',
      tags: options.tags || [],
      metadata: options.metadata || {},
      processed: false
    };

    // Apply middleware
    for (const middleware of this.eventMiddleware) {
      try {
        const result = middleware(event);
        if (result === false) {
          // Middleware cancelled the event
          return false;
        }
        if (result && typeof result === 'object') {
          Object.assign(event, result);
        }
      } catch (error) {
        logger.error(`Event middleware error for ${eventType}:`, error);
      }
    }

    // Apply filters
    if (this.shouldFilterEvent(event)) {
      return false;
    }

    // Queue or emit immediately based on priority
    if (options.immediate || event.priority === 'critical') {
      this.processEvent(event);
    } else {
      this.queueEvent(event);
    }

    return event.id;
  }

  /**
   * Process a single event
   */
  processEvent(event) {
    try {
      // Record metrics
      this.recordEventMetrics(event);
      
      // Store in history
      if (this.config.enableHistory) {
        this.addToHistory(event);
      }
      
      // Emit the event
      this.emit(event.type, event);
      
      // Emit wildcard event for monitoring
      this.emit('*', event);
      
      event.processed = true;
      
      logger.debug(`📡 Event processed: ${event.type} (${event.id})`);
      
    } catch (error) {
      logger.error(`Event processing error for ${event.type}:`, error);
      this.emit('event:error', { event, error });
    }
  }

  /**
   * Queue event for batch processing
   */
  queueEvent(event) {
    this.eventQueue.push(event);
    
    // Emit queue event for monitoring
    this.emit('event:queued', { 
      eventId: event.id, 
      queueSize: this.eventQueue.length 
    });
  }

  /**
   * Start queue processing
   */
  startQueueProcessing() {
    setInterval(() => {
      if (this.eventQueue.length > 0 && !this.processingQueue) {
        this.processQueuedEvents();
      }
    }, this.config.queueProcessingInterval);
  }

  /**
   * Process queued events in batches
   */
  async processQueuedEvents() {
    if (this.processingQueue || this.eventQueue.length === 0) return;
    
    this.processingQueue = true;
    const batchSize = 10;
    const batch = this.eventQueue.splice(0, batchSize);
    
    try {
      // Sort by priority (critical > high > normal > low)
      batch.sort((a, b) => {
        const priorities = { critical: 4, high: 3, normal: 2, low: 1 };
        return (priorities[b.priority] || 2) - (priorities[a.priority] || 2);
      });
      
      // Process batch
      for (const event of batch) {
        this.processEvent(event);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      logger.debug(`📦 Processed event batch: ${batch.length} events`);
      
    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Add event middleware
   */
  addMiddleware(middleware) {
    if (typeof middleware === 'function') {
      this.eventMiddleware.push(middleware);
      logger.debug('📡 Event middleware added');
    }
  }

  /**
   * Add event filter
   */
  addFilter(name, filterFunction) {
    this.eventFilters.set(name, filterFunction);
    logger.debug(`📡 Event filter added: ${name}`);
  }

  /**
   * Remove event filter
   */
  removeFilter(name) {
    this.eventFilters.delete(name);
    logger.debug(`📡 Event filter removed: ${name}`);
  }

  /**
   * Check if event should be filtered
   */
  shouldFilterEvent(event) {
    for (const [name, filter] of this.eventFilters.entries()) {
      try {
        if (filter(event) === false) {
          logger.debug(`📡 Event filtered by ${name}: ${event.type}`);
          return true;
        }
      } catch (error) {
        logger.error(`Event filter error (${name}):`, error);
      }
    }
    return false;
  }

  /**
   * Record event metrics
   */
  recordEventMetrics(event) {
    if (!this.config.enableMetrics) return;
    
    if (!this.eventMetrics.has(event.type)) {
      this.eventMetrics.set(event.type, {
        count: 0,
        lastEmitted: 0,
        averageSize: 0,
        totalSize: 0
      });
    }
    
    const metrics = this.eventMetrics.get(event.type);
    metrics.count++;
    metrics.lastEmitted = event.timestamp;
    
    // Calculate event size (approximation)
    const eventSize = JSON.stringify(event.data).length;
    metrics.totalSize += eventSize;
    metrics.averageSize = metrics.totalSize / metrics.count;
  }

  /**
   * Add event to history
   */
  addToHistory(event) {
    this.eventHistory.push({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source,
      priority: event.priority,
      tags: event.tags,
      dataSize: JSON.stringify(event.data).length
    });
    
    // Maintain history size limit
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event metrics
   */
  getEventMetrics() {
    return {
      totalEvents: this.eventHistory.length,
      queueSize: this.eventQueue.length,
      processingQueue: this.processingQueue,
      eventTypes: Array.from(this.eventMetrics.entries()).map(([type, metrics]) => ({
        type,
        ...metrics,
        frequency: metrics.count / Math.max(1, (Date.now() - metrics.lastEmitted) / 60000) // events per minute
      })),
      recentEvents: this.eventHistory.slice(-10),
      middleware: this.eventMiddleware.length,
      filters: this.eventFilters.size
    };
  }

  /**
   * Get events by criteria
   */
  getEvents(criteria = {}) {
    let events = [...this.eventHistory];
    
    if (criteria.type) {
      events = events.filter(e => e.type === criteria.type);
    }
    
    if (criteria.source) {
      events = events.filter(e => e.source === criteria.source);
    }
    
    if (criteria.tags && criteria.tags.length > 0) {
      events = events.filter(e => 
        criteria.tags.some(tag => e.tags.includes(tag))
      );
    }
    
    if (criteria.since) {
      events = events.filter(e => e.timestamp >= criteria.since);
    }
    
    if (criteria.until) {
      events = events.filter(e => e.timestamp <= criteria.until);
    }
    
    return events.slice(0, criteria.limit || 100);
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    logger.debug('📡 Event history cleared');
  }

  /**
   * Flush event queue
   */
  async flushQueue() {
    while (this.eventQueue.length > 0) {
      await this.processQueuedEvents();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    logger.debug('📡 Event queue flushed');
  }
}

/**
 * Event Aggregator for complex event patterns
 */
class EventAggregator {
  constructor() {
    this.aggregations = new Map();
    this.correlations = new Map();
    this.patterns = new Map();
    this.windows = new Map();
  }

  /**
   * Create event aggregation rule
   */
  createAggregation(name, config) {
    const aggregation = {
      name,
      eventTypes: config.eventTypes || [],
      windowSize: config.windowSize || 60000, // 1 minute
      threshold: config.threshold || 1,
      aggregateFunction: config.aggregateFunction || 'count',
      condition: config.condition || (() => true),
      action: config.action || (() => {}),
      enabled: true,
      matches: [],
      lastTriggered: 0
    };

    this.aggregations.set(name, aggregation);
    logger.info(`📊 Event aggregation created: ${name}`);
    return aggregation;
  }

  /**
   * Process event for aggregations
   */
  processEvent(event) {
    for (const [name, aggregation] of this.aggregations.entries()) {
      if (!aggregation.enabled) continue;
      
      if (this.matchesAggregation(event, aggregation)) {
        this.addToAggregation(name, event);
        this.checkAggregationThreshold(name);
      }
    }
    
    // Check for correlations
    this.checkCorrelations(event);
    
    // Check for patterns
    this.checkPatterns(event);
  }

  /**
   * Check if event matches aggregation criteria
   */
  matchesAggregation(event, aggregation) {
    // Check event type
    if (aggregation.eventTypes.length > 0 && 
        !aggregation.eventTypes.includes(event.type)) {
      return false;
    }
    
    // Check custom condition
    try {
      return aggregation.condition(event);
    } catch (error) {
      logger.error(`Aggregation condition error for ${aggregation.name}:`, error);
      return false;
    }
  }

  /**
   * Add event to aggregation window
   */
  addToAggregation(name, event) {
    const aggregation = this.aggregations.get(name);
    if (!aggregation) return;
    
    const now = Date.now();
    const windowStart = now - aggregation.windowSize;
    
    // Remove old events outside window
    aggregation.matches = aggregation.matches.filter(e => e.timestamp >= windowStart);
    
    // Add new event
    aggregation.matches.push({
      timestamp: event.timestamp,
      data: event.data,
      id: event.id
    });
  }

  /**
   * Check if aggregation threshold is met
   */
  checkAggregationThreshold(name) {
    const aggregation = this.aggregations.get(name);
    if (!aggregation) return;
    
    const value = this.calculateAggregateValue(aggregation);
    
    if (value >= aggregation.threshold) {
      const now = Date.now();
      
      // Prevent rapid re-triggering (1 second cooldown)
      if (now - aggregation.lastTriggered < 1000) return;
      
      aggregation.lastTriggered = now;
      
      logger.info(`📊 Aggregation threshold met: ${name} (${value}/${aggregation.threshold})`);
      
      try {
        aggregation.action({
          name,
          value,
          threshold: aggregation.threshold,
          matches: aggregation.matches,
          windowSize: aggregation.windowSize
        });
      } catch (error) {
        logger.error(`Aggregation action error for ${name}:`, error);
      }
    }
  }

  /**
   * Calculate aggregate value
   */
  calculateAggregateValue(aggregation) {
    const matches = aggregation.matches;
    
    switch (aggregation.aggregateFunction) {
      case 'count':
        return matches.length;
      case 'sum':
        return matches.reduce((sum, m) => sum + (m.data.value || 0), 0);
      case 'average':
        const values = matches.map(m => m.data.value || 0);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'max':
        return Math.max(...matches.map(m => m.data.value || 0));
      case 'min':
        return Math.min(...matches.map(m => m.data.value || 0));
      default:
        return matches.length;
    }
  }

  /**
   * Create event correlation
   */
  createCorrelation(name, eventA, eventB, config = {}) {
    const correlation = {
      name,
      eventA,
      eventB,
      maxDelay: config.maxDelay || 5000, // 5 seconds
      condition: config.condition || (() => true),
      action: config.action || (() => {}),
      enabled: true,
      pendingEvents: new Map(),
      correlations: []
    };

    this.correlations.set(name, correlation);
    logger.info(`🔗 Event correlation created: ${name} (${eventA} -> ${eventB})`);
    return correlation;
  }

  /**
   * Check for event correlations
   */
  checkCorrelations(event) {
    for (const [name, correlation] of this.correlations.entries()) {
      if (!correlation.enabled) continue;
      
      if (event.type === correlation.eventA) {
        // Store event A, waiting for event B
        correlation.pendingEvents.set(event.id, {
          timestamp: event.timestamp,
          data: event.data
        });
        
        // Clean up old pending events
        const cutoff = Date.now() - correlation.maxDelay;
        for (const [id, pending] of correlation.pendingEvents.entries()) {
          if (pending.timestamp < cutoff) {
            correlation.pendingEvents.delete(id);
          }
        }
      } else if (event.type === correlation.eventB) {
        // Look for matching event A
        for (const [idA, eventA] of correlation.pendingEvents.entries()) {
          if (event.timestamp - eventA.timestamp <= correlation.maxDelay) {
            try {
              if (correlation.condition(eventA, event)) {
                this.triggerCorrelation(name, eventA, event);
                correlation.pendingEvents.delete(idA);
                break;
              }
            } catch (error) {
              logger.error(`Correlation condition error for ${name}:`, error);
            }
          }
        }
      }
    }
  }

  /**
   * Trigger correlation action
   */
  triggerCorrelation(name, eventA, eventB) {
    const correlation = this.correlations.get(name);
    if (!correlation) return;
    
    const correlationData = {
      name,
      eventA,
      eventB,
      delay: eventB.timestamp - eventA.timestamp,
      timestamp: Date.now()
    };
    
    correlation.correlations.push(correlationData);
    
    // Keep last 100 correlations
    if (correlation.correlations.length > 100) {
      correlation.correlations.shift();
    }
    
    logger.info(`🔗 Event correlation triggered: ${name}`);
    
    try {
      correlation.action(correlationData);
    } catch (error) {
      logger.error(`Correlation action error for ${name}:`, error);
    }
  }

  /**
   * Create event pattern
   */
  createPattern(name, eventSequence, config = {}) {
    const pattern = {
      name,
      sequence: eventSequence, // Array of event types
      maxDuration: config.maxDuration || 30000, // 30 seconds
      condition: config.condition || (() => true),
      action: config.action || (() => {}),
      enabled: true,
      partialMatches: new Map(),
      completeMatches: []
    };

    this.patterns.set(name, pattern);
    logger.info(`🟡 Event pattern created: ${name} (${eventSequence.join(' -> ')})`);
    return pattern;
  }

  /**
   * Check for event patterns
   */
  checkPatterns(event) {
    for (const [name, pattern] of this.patterns.entries()) {
      if (!pattern.enabled) continue;
      
      this.updatePatternMatching(name, event);
    }
  }

  /**
   * Update pattern matching state
   */
  updatePatternMatching(name, event) {
    const pattern = this.patterns.get(name);
    if (!pattern) return;
    
    const expectedEventType = pattern.sequence[0];
    
    if (event.type === expectedEventType) {
      // Start new pattern match
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      pattern.partialMatches.set(matchId, {
        startTime: event.timestamp,
        events: [event],
        nextIndex: 1
      });
    }
    
    // Check existing partial matches
    for (const [matchId, match] of pattern.partialMatches.entries()) {
      const expectedType = pattern.sequence[match.nextIndex];
      
      if (event.type === expectedType) {
        match.events.push(event);
        match.nextIndex++;
        
        // Check if pattern is complete
        if (match.nextIndex >= pattern.sequence.length) {
          this.completePattern(name, matchId, match);
          pattern.partialMatches.delete(matchId);
        }
      }
    }
    
    // Clean up expired partial matches
    const now = Date.now();
    for (const [matchId, match] of pattern.partialMatches.entries()) {
      if (now - match.startTime > pattern.maxDuration) {
        pattern.partialMatches.delete(matchId);
      }
    }
  }

  /**
   * Complete pattern match
   */
  completePattern(name, matchId, match) {
    const pattern = this.patterns.get(name);
    if (!pattern) return;
    
    const patternData = {
      name,
      matchId,
      events: match.events,
      duration: match.events[match.events.length - 1].timestamp - match.events[0].timestamp,
      timestamp: Date.now()
    };
    
    pattern.completeMatches.push(patternData);
    
    // Keep last 50 matches
    if (pattern.completeMatches.length > 50) {
      pattern.completeMatches.shift();
    }
    
    logger.info(`🟡 Event pattern completed: ${name} (duration: ${patternData.duration}ms)`);
    
    try {
      if (pattern.condition(patternData)) {
        pattern.action(patternData);
      }
    } catch (error) {
      logger.error(`Pattern action error for ${name}:`, error);
    }
  }

  /**
   * Get aggregation metrics
   */
  getAggregationMetrics() {
    return {
      aggregations: Array.from(this.aggregations.entries()).map(([name, agg]) => ({
        name,
        enabled: agg.enabled,
        eventTypes: agg.eventTypes,
        threshold: agg.threshold,
        currentMatches: agg.matches.length,
        lastTriggered: agg.lastTriggered
      })),
      correlations: Array.from(this.correlations.entries()).map(([name, corr]) => ({
        name,
        enabled: corr.enabled,
        eventA: corr.eventA,
        eventB: corr.eventB,
        pendingEvents: corr.pendingEvents.size,
        totalCorrelations: corr.correlations.length
      })),
      patterns: Array.from(this.patterns.entries()).map(([name, pattern]) => ({
        name,
        enabled: pattern.enabled,
        sequence: pattern.sequence,
        partialMatches: pattern.partialMatches.size,
        completeMatches: pattern.completeMatches.length
      }))
    };
  }
}

class AgentLifecycleManager extends EventEmitter {
  constructor(enablePooling = true) {
    super();
    this.activeAgents = new Map();
    this.agentRegistry = new Map();
    this.lifecycleEvents = [];
    this.consciousnessLayer = new ConsciousnessLayer();
    this.performanceMonitor = new AgentPerformanceMonitor();
    this.knowledgeTransferSystem = new KnowledgeTransferSystem();
    this.systemStartTime = Date.now();
    this.lastSystemActivity = Date.now();
    
    // Performance optimization framework
    this.operationQueue = new Map();
    this.concurrencyLimits = {
      spawn: 5,
      terminate: 3,
      healthCheck: 10
    };
    this.performanceMetrics = {
      operationsPerSecond: 0,
      averageResponseTime: 0,
      concurrentOperations: 0
    };

    // Initialize RBAC and audit system
    this.rbac = new RoleBasedAccessControl();
    this.auditLogger = new AuditLogger();
    this.accessControl = {
      requirePermission: true,
      defaultRole: 'user',
      adminActions: ['dissolve_all', 'force_terminate', 'system_admin'],
      userActions: ['spawn', 'dissolve', 'get_status', 'configure']
    };

    // Initialize state persistence system
    this.statePersistence = new StatePersistenceManager();
    this.stateManager = new ConcurrentStateManager();
    this.persistenceConfig = {
      enablePersistence: true,
      autoSaveInterval: 30000, // 30 seconds
      maxBackups: 10,
      compressionEnabled: true,
      encryptionEnabled: false
    };

    // Initialize reliability and circuit breaker system
    this.circuitBreaker = new CircuitBreaker();
    this.retryManager = new RetryManager();
    this.healthMonitor = new HealthMonitor();
    this.reliabilityConfig = {
      enableCircuitBreaker: true,
      enableRetry: true,
      enableHealthMonitoring: true,
      maxRetries: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 15000, // 15 seconds
      gracefulDegradation: true
    };

    // Initialize advanced event system
    this.eventManager = new AdvancedEventManager();
    this.eventAggregator = new EventAggregator();
    this.eventConfig = {
      enableEventAggregation: true,
      enableEventPersistence: false,
      maxEventHistory: 1000,
      eventTimeout: 30000, // 30 seconds
      enableEventMetrics: true
    };
    
    // Initialize hooks
    this.hooks = null;
    this.initializeHooks();
    
    // Initialize specialist pool if enabled
    this.poolingEnabled = enablePooling;
    if (this.poolingEnabled) {
      // Lazy load specialist pool to avoid circular dependency
      this.specialistPool = null;
      this.specialistPoolConfig = {
        maxPoolSize: 50,
        minPoolSize: 5,
        enablePreWarming: false, // Disabled to prevent circular initialization
        healthCheckInterval: 30000,
        idleTimeout: 300000
      };
    }
    
    this.initializeAgentRegistry();
    this.initializeLifecycleRules();
  }

  /**
   * Initialize lifecycle hooks
   */
  initializeHooks() {
    try {
      const { UnifiedHookSystem } = require('../unified-hook-system');
      this.hooks = new UnifiedHookSystem();
      
      // Register lifecycle-specific hooks
      this.hooks.register('lifecycle:spawn', async (context) => {
        logger.info(`🟢 Spawning agent: ${context.agentType}`);
        return context;
      }, { category: 'agent', priority: 10 });
      
      this.hooks.register('lifecycle:activate', async (context) => {
        logger.info(`🏁 Activating agent: ${context.agentId}`);
        return context;
      }, { category: 'agent', priority: 10 });
      
      this.hooks.register('lifecycle:deactivate', async (context) => {
        logger.info(`⏸️ Deactivating agent: ${context.agentId}`);
        return context;
      }, { category: 'agent', priority: 10 });
      
      this.hooks.register('lifecycle:destroy', async (context) => {
        logger.info(`🗑️ Destroying agent: ${context.agentId}`);
        return context;
      }, { category: 'agent', priority: 10 });
      
      this.hooks.register('lifecycle:transfer', async (context) => {
        logger.info(`📤 Transferring knowledge from agent: ${context.agentId}`);
        return context;
      }, { category: 'agent', priority: 10 });
      
      logger.info('🪝 Lifecycle hooks initialized');
    } catch (error) {
      logger.warn('Could not initialize lifecycle hooks:', error.message);
    }
  }

  initializeAgentRegistry() {
    // Register all available specialist types with safe fallbacks
    this.agentRegistry.set('strategic', {
      'market-research': this.safeRequire('../specialists/strategic/market-research-specialist'),
      'competitive-analysis': this.safeRequire('../specialists/strategic/competitive-analysis-specialist'),
      'business-model': this.safeRequire('../specialists/strategic/business-model-specialist'),
      'stakeholder-comms': this.safeRequire('../specialists/strategic/stakeholder-comms-specialist'),
      'roi-analysis': this.safeRequire('../specialists/strategic/roi-analysis-specialist'),
      'requirements-engineering': this.safeRequire('../specialists/strategic/requirements-specialist'),
      'product-strategy': this.safeRequire('../specialists/strategic/product-strategy-specialist')
    });

    this.agentRegistry.set('experience', {
      'ux-research': this.safeRequire('../specialists/experience/ux-research-specialist'),
      'ui-design': this.safeRequire('../specialists/experience/ui-design-specialist'),
      'accessibility': this.safeRequire('../specialists/experience/accessibility-specialist'),
      'performance-optimization': this.safeRequire('../specialists/experience/performance-specialist'),
      'design-system': this.safeRequire('../specialists/experience/design-system-specialist'),
      'frontend-architecture': this.safeRequire('../specialists/experience/frontend-architecture-specialist'),
      'user-testing': this.safeRequire('../specialists/experience/user-testing-specialist'),
      'interaction-design': this.safeRequire('../specialists/experience/interaction-design-specialist')
    });

    this.agentRegistry.set('technical', {
      'database': this.safeRequire('../specialists/technical/database-specialist'),
      'api-architecture': this.safeRequire('../specialists/technical/api-architecture-specialist'),
      'security': this.safeRequire('../specialists/technical/security-specialist'),
      'devops': this.safeRequire('../specialists/technical/devops-specialist'),
      'performance-engineering': this.safeRequire('../specialists/technical/performance-specialist'),
      'infrastructure': this.safeRequire('../specialists/technical/infrastructure-specialist'),
      'microservices': this.safeRequire('../specialists/technical/microservices-specialist'),
      'cloud-architecture': this.safeRequire('../specialists/technical/cloud-specialist')
    });
  }

  safeRequire(modulePath) {
    try {
      return require(modulePath);
    } catch (error) {
      // Return a generic specialist class for missing modules
      return class GenericSpecialist {
        constructor(department, context) {
          this.department = department;
          this.context = context;
          this.type = modulePath.split('/').pop().replace('-specialist', '');
          this.id = null;
          this.manager = null;
          this.spawnedAt = null;
          this.lifecycleState = 'inactive';
          this.lastActivity = null;
          this.consciousness = null;
          this.consciousnessDriven = false;
          this.ethicalConstraints = null;
          this.currentTask = null;
          this.expertise = {};
          this.insights = [];
          this.patterns = [];
          this.bestPractices = [];
          this.consciousnessInsights = [];
        }

        async executeTask(task) {
          this.currentTask = task;
          this.lastActivity = Date.now();
          
          // Mock execution
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return {
            status: 'completed',
            result: `Mock execution of ${task.description} by ${this.type} specialist`,
            consciousness_alignment: 0.9,
            timestamp: new Date().toISOString()
          };
        }
      };
    }
  }

  initializeLifecycleRules() {
    this.lifecycleRules = {
      max_concurrent_specialists: 20,
      max_department_specialists: 8,
      idle_timeout_minutes: 30,
      max_task_duration_hours: 8,
      knowledge_transfer_required: true,
      consciousness_validation_required: true,
      performance_monitoring_enabled: true
    };
  }

  /**
   * Initialize specialist pool lazily to avoid circular dependencies
   */
  initializeSpecialistPool() {
    if (this.poolingEnabled && !this.specialistPool) {
      this.specialistPool = new SpecialistPool(this.specialistPoolConfig);
      // Now safe to set reference
      this.specialistPool.lifecycleManager = this;
      logger.info('🏁 Specialist pool initialized lazily');
    }
  }

  async spawnSpecialist(department, specialistType, context, manager, priority = PRIORITY_LEVELS.NORMAL) {
    logger.info(`🏁 Spawning ${specialistType} specialist for ${department} department`);

    // Execute pre-spawn hook
    if (this.hooks) {
      await this.hooks.execute('lifecycle:spawn', {
        department,
        agentType: specialistType,
        context,
        priority
      });
    }

    // Initialize pool if needed
    if (this.poolingEnabled && !this.specialistPool) {
      this.initializeSpecialistPool();
    }

    // If pooling is enabled, try to get from pool first
    if (this.poolingEnabled && this.specialistPool) {
      try {
        const specialist = await this.specialistPool.getSpecialist(department, specialistType, context, priority);
        
        // Set manager reference
        specialist.manager = manager;
        
        // Register with lifecycle manager
        this.activeAgents.set(specialist.id, specialist);
        
        // Register with manager
        if (manager && manager.activeSpecialists) {
          manager.activeSpecialists.add(specialist);
        }
        
        // Update task history for predictions
        this.specialistPool.taskHistory.recordTask(department, specialistType);
        
        logger.info(`🏁 ${specialistType} specialist obtained from pool with ID: ${specialist.id}`);
        return specialist;
        
      } catch (error) {
        logger.warn(`🏁 Pool spawning failed, falling back to direct creation: ${error.message}`);
        // Fall through to traditional spawning
      }
    }

    // Traditional spawning process
    // Validate spawn request and check resource limits in parallel
    await Promise.all([
      this.validateSpawnRequest(department, specialistType, context),
      this.checkResourceLimits(department)
    ]);

    // Create specialist instance
    const specialist = await this.createSpecialistInstance(department, specialistType, context, manager);

    // Execute registration, consciousness initialization, and logging in parallel
    await Promise.all([
      this.registerSpecialist(specialist, manager),
      this.initializeSpecialistConsciousness(specialist),
      this.logLifecycleEvent('spawn', specialist)
    ]);

    // Start performance monitoring (non-blocking)
    setImmediate(() => this.performanceMonitor.startMonitoring(specialist));

    logger.info(`🏁 ${specialistType} specialist spawned successfully with ID: ${specialist.id}`);

    return specialist;
  }

  /**
   * Security validation framework for input sanitization
   */
  async validateSecurityInput(input, schema = {}) {
    const errors = [];
    
    // Input sanitization
    if (typeof input !== 'object' || input === null) {
      errors.push('Input must be a valid object');
      throw new SecurityError('Invalid input type', { input: typeof input });
    }
    
    // SQL injection prevention
    const sqlPatterns = /['";\\x00\\n\\r\\x1a]/g;
    const stringFields = ['department', 'specialistType', 'reason'];
    
    for (const field of stringFields) {
      if (input[field] && typeof input[field] === 'string') {
        if (sqlPatterns.test(input[field])) {
          errors.push(`Potential SQL injection detected in ${field}`);
        }
        if (input[field].length > 1000) {
          errors.push(`Field ${field} exceeds maximum length (1000 chars)`);
        }
      }
    }
    
    // XSS prevention
    const xssPatterns = /<script[^>]*>.*?<\/script>/gi;
    for (const field of stringFields) {
      if (input[field] && xssPatterns.test(input[field])) {
        errors.push(`XSS attempt detected in ${field}`);
      }
    }
    
    // Command injection prevention
    const cmdPatterns = /[;&|`$(){}[\]]/g;
    for (const field of stringFields) {
      if (input[field] && cmdPatterns.test(input[field])) {
        errors.push(`Command injection attempt detected in ${field}`);
      }
    }
    
    // Validate department restrictions
    const allowedDepartments = ['strategic', 'experience', 'technical'];
    if (input.department && !allowedDepartments.includes(input.department)) {
      errors.push(`Invalid department: ${input.department}. Allowed: ${allowedDepartments.join(', ')}`);
    }
    
    // Context validation
    if (input.context) {
      if (typeof input.context !== 'object') {
        errors.push('Context must be an object');
      } else {
        // Validate context fields don't contain sensitive data
        const sensitivePatterns = /password|token|key|secret|credential/i;
        for (const [key, value] of Object.entries(input.context)) {
          if (sensitivePatterns.test(key) || (typeof value === 'string' && sensitivePatterns.test(value))) {
            errors.push(`Sensitive data detected in context field: ${key}`);
          }
        }
      }
    }
    
    // Rate limiting validation
    const requestKey = `${input.department}_${input.specialistType}`;
    if (!this.rateLimiter) {
      this.rateLimiter = new Map();
    }
    
    const now = Date.now();
    const windowSize = 60000; // 1 minute
    const maxRequests = 100; // Max 100 requests per minute per type
    
    if (!this.rateLimiter.has(requestKey)) {
      this.rateLimiter.set(requestKey, []);
    }
    
    const requests = this.rateLimiter.get(requestKey);
    const recentRequests = requests.filter(time => now - time < windowSize);
    
    if (recentRequests.length >= maxRequests) {
      errors.push(`Rate limit exceeded for ${requestKey}: ${recentRequests.length}/${maxRequests} requests`);
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(requestKey, recentRequests);
    
    if (errors.length > 0) {
      const securityError = new SecurityError('Security validation failed', {
        errors,
        input: this.sanitizeForLogging(input)
      });
      
      // Log security violation
      logger.error('🔒 Security validation failed:', {
        errors,
        timestamp: now,
        input: this.sanitizeForLogging(input)
      });
      
      throw securityError;
    }
    
    return true;
  }

  /**
   * Sanitize input for safe logging
   */
  sanitizeForLogging(input) {
    const sanitized = { ...input };
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    if (sanitized.context) {
      sanitized.context = { ...sanitized.context };
      for (const field of sensitiveFields) {
        if (sanitized.context[field]) {
          sanitized.context[field] = '[REDACTED]';
        }
      }
    }
    
    return sanitized;
  }

  /**
   * Enforce access control for protected operations
   */
  async enforceAccessControl(userId, action, resource = 'specialist', context = {}) {
    const requiredPermission = this.getRequiredPermission(action);
    
    if (!this.rbac.checkPermission(userId, requiredPermission)) {
      const userRole = this.rbac.getUserRole(userId);
      
      // Log access denial
      this.auditLogger.logAccessAttempt(
        userId, 
        action, 
        resource, 
        'denied',
        { userRole, requiredPermission, context }
      );
      
      throw new SecurityError(`Access denied: User ${userId} (${userRole}) lacks permission ${requiredPermission}`, {
        userId,
        userRole,
        action,
        resource,
        requiredPermission
      });
    }
    
    // Log successful access
    this.auditLogger.logAccessAttempt(
      userId, 
      action, 
      resource, 
      'granted',
      { userRole: this.rbac.getUserRole(userId), requiredPermission, context }
    );
    
    return true;
  }

  /**
   * Map actions to required permissions
   */
  getRequiredPermission(action) {
    const permissionMap = {
      'spawn': 'spawn:specialist',
      'dissolve': 'dissolve:specialist',
      'configure': 'configure:specialist',
      'status': 'view:status',
      'force_terminate': 'admin:force_terminate',
      'dissolve_all': 'admin:dissolve_all',
      'system_admin': 'admin:system_control'
    };
    
    return permissionMap[action] || 'view:status';
  }

  async validateSpawnRequest(department, specialistType, context, userId = 'system') {
    // Access control check first
    await this.enforceAccessControl(userId, 'spawn', 'specialist', {
      department,
      specialistType
    });

    // Security validation
    await this.validateSecurityInput({
      department,
      specialistType,
      context
    });

    // Validate department exists
    if (!this.agentRegistry.has(department)) {
      throw new Error(`Unknown department: ${department}`);
    }

    // Validate specialist type exists
    const departmentAgents = this.agentRegistry.get(department);
    if (!departmentAgents[specialistType]) {
      throw new Error(`Unknown specialist type: ${specialistType} for department: ${department}`);
    }

    // Validate context against consciousness principles
    await this.consciousnessLayer.validateIntent({
      description: `Spawn ${specialistType} specialist for ${department}`,
      context: context
    });

    return true;
  }

  async checkResourceLimits(department) {
    const totalActive = this.activeAgents.size;
    const departmentActive = Array.from(this.activeAgents.values())
      .filter(agent => agent.department === department).length;

    if (totalActive >= this.lifecycleRules.max_concurrent_specialists) {
      throw new Error(`Maximum concurrent specialists limit reached: ${this.lifecycleRules.max_concurrent_specialists}`);
    }

    if (departmentActive >= this.lifecycleRules.max_department_specialists) {
      throw new Error(`Maximum department specialists limit reached for ${department}: ${this.lifecycleRules.max_department_specialists}`);
    }

    return true;
  }

  async createSpecialistInstance(department, specialistType, context, manager) {
    const SpecialistClass = this.agentRegistry.get(department)[specialistType];
    
    // Ensure SpecialistPool is loaded when needed
    if (!SpecialistPool && this.poolingEnabled) {
      try {
        const poolModule = require('../specialists/specialist-pool');
        SpecialistPool = poolModule.SpecialistPool;
        PRIORITY_LEVELS = poolModule.PRIORITY_LEVELS;
      } catch (error) {
        logger.warn('Specialist pool not available, continuing without pooling');
        this.poolingEnabled = false;
      }
    }
    
    const specialist = new SpecialistClass(department, context);
    
    // Assign unique ID
    specialist.id = this.generateSpecialistId(department, specialistType);
    
    // Set manager reference
    specialist.manager = manager;
    
    // Set spawn timestamp
    specialist.spawnedAt = Date.now();
    
    // Initialize lifecycle state
    specialist.lifecycleState = 'spawned';
    specialist.lastActivity = Date.now();
    
    return specialist;
  }

  async registerSpecialist(specialist, manager) {
    // Register in active agents map
    this.activeAgents.set(specialist.id, specialist);

    // Register with manager
    if (manager && manager.activeSpecialists) {
      manager.activeSpecialists.add(specialist);
    }

    // Set up auto-dissolution timer
    this.scheduleAutoDissolution(specialist);

    return true;
  }

  async initializeSpecialistConsciousness(specialist) {
    // Apply consciousness layer to specialist
    specialist.consciousness = this.consciousnessLayer;
    
    // Validate specialist aligns with consciousness principles
    await specialist.consciousness.validateIntent({
      description: `Initialize ${specialist.type} specialist`,
      agent: specialist
    });

    // Set consciousness-driven behavior patterns
    specialist.consciousnessDriven = true;
    specialist.ethicalConstraints = await this.consciousnessLayer.ethicalFramework.validateEthicalCompliance({
      description: `${specialist.type} specialist operations`
    });

    return true;
  }

  async dissolveSpecialist(specialist, reason = 'task_completed') {
    logger.info(`🏁 Dissolving ${specialist.type} specialist (${reason})`);

    // Execute pre-destroy hook
    if (this.hooks) {
      await this.hooks.execute('lifecycle:destroy', {
        agentId: specialist.id,
        agentType: specialist.type,
        reason
      });
    }

    // If pooling is enabled and specialist should be returned to pool
    if (this.poolingEnabled && this.specialistPool && this.shouldReturnToPool(reason)) {
      try {
        // Perform lightweight knowledge transfer
        if (this.lifecycleRules.knowledge_transfer_required) {
          await this.performKnowledgeTransfer(specialist);
        }
        
        // Return to pool instead of dissolving
        await this.specialistPool.returnSpecialist(specialist, reason === 'force_recycle');
        
        // Remove from active agents but keep alive in pool
        this.activeAgents.delete(specialist.id);
        
        // Remove from manager's active specialists
        if (specialist.manager && specialist.manager.activeSpecialists) {
          specialist.manager.activeSpecialists.delete(specialist);
        }
        
        // Log pool return event
        await this.logLifecycleEvent('pool_return', specialist, reason);
        
        logger.info(`🏁 ${specialist.type} specialist returned to pool`);
        return true;
        
      } catch (error) {
        logger.warn(`🏁 Pool return failed, proceeding with dissolution: ${error.message}`);
        // Fall through to traditional dissolution
      }
    }

    // Traditional dissolution process
    // Validate dissolution is appropriate
    await this.validateDissolution(specialist, reason);

    // Perform knowledge transfer
    if (this.lifecycleRules.knowledge_transfer_required) {
      await this.performKnowledgeTransfer(specialist);
    }

    // Stop performance monitoring
    this.performanceMonitor.stopMonitoring(specialist);

    // Clean up resources
    await this.cleanupSpecialistResources(specialist);

    // Unregister specialist
    await this.unregisterSpecialist(specialist);

    // Log dissolution event
    await this.logLifecycleEvent('dissolve', specialist, reason);

    logger.info(`🏁 ${specialist.type} specialist dissolved successfully`);

    return true;
  }

  /**
   * Determine if specialist should return to pool or be dissolved
   */
  shouldReturnToPool(reason) {
    const poolReturnReasons = [
      'task_completed',
      'idle_timeout',
      'user_request'
    ];
    
    const dissolveReasons = [
      'error',
      'pool_termination',
      'force_dissolve',
      'unhealthy',
      'system_shutdown'
    ];
    
    if (dissolveReasons.includes(reason)) {
      return false;
    }
    
    return poolReturnReasons.includes(reason);
  }

  async validateDissolution(specialist, reason) {
    // Check if specialist has completed its work
    if (reason === 'task_completed' && specialist.currentTask) {
      logger.warn('🏁 Warning: Dissolving specialist with active task');
    }

    // Ensure consciousness validation of dissolution
    await this.consciousnessLayer.validateIntent({
      description: `Dissolve ${specialist.type} specialist due to ${reason}`,
      agent: specialist
    });

    return true;
  }

  async performKnowledgeTransfer(specialist) {
    logger.info(`🏁 Performing knowledge transfer for ${specialist.type} specialist`);

    const knowledge = await this.knowledgeTransferSystem.extractKnowledge(specialist);
    
    if (specialist.manager) {
      await specialist.manager.receiveSpecialistKnowledge(specialist, knowledge);
    }

    // Store knowledge in long-term memory
    await this.knowledgeTransferSystem.storeKnowledge(specialist, knowledge);

    return knowledge;
  }

  async cleanupSpecialistResources(specialist) {
    // Clean up any resources held by the specialist
    if (specialist.tools) {
      await this.cleanupTools(specialist.tools);
    }

    if (specialist.temporaryFiles) {
      await this.cleanupTemporaryFiles(specialist.temporaryFiles);
    }

    // Clear references
    specialist.manager = null;
    specialist.consciousness = null;
    specialist.currentTask = null;

    return true;
  }

  async unregisterSpecialist(specialist) {
    // Remove from active agents
    this.activeAgents.delete(specialist.id);

    // Remove from manager's active specialists
    if (specialist.manager && specialist.manager.activeSpecialists) {
      specialist.manager.activeSpecialists.delete(specialist);
    }

    // Cancel auto-dissolution timer
    if (specialist.autoDissolutionTimer) {
      clearTimeout(specialist.autoDissolutionTimer);
    }

    return true;
  }

  scheduleAutoDissolution(specialist) {
    const timeoutMs = this.lifecycleRules.idle_timeout_minutes * 60 * 1000;
    
    specialist.autoDissolutionTimer = setTimeout(async () => {
      try {
        const idleTime = Date.now() - specialist.lastActivity;
        const idleMinutes = idleTime / (60 * 1000);
        
        if (idleMinutes >= this.lifecycleRules.idle_timeout_minutes) {
          await this.dissolveSpecialist(specialist, 'idle_timeout');
        }
      } catch (error) {
        logger.error(`🏁 Error in auto-dissolution: ${error.message}`);
      }
    }, timeoutMs);
  }

  updateSpecialistActivity(specialist) {
    specialist.lastActivity = Date.now();
    
    // Reset auto-dissolution timer
    if (specialist.autoDissolutionTimer) {
      clearTimeout(specialist.autoDissolutionTimer);
      this.scheduleAutoDissolution(specialist);
    }
  }

  generateSpecialistId(department, specialistType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${department}-${specialistType}-${timestamp}-${random}`;
  }

  async logLifecycleEvent(eventType, specialist, reason = null) {
    const event = {
      type: eventType,
      specialist_id: specialist.id,
      specialist_type: specialist.type,
      department: specialist.department,
      timestamp: new Date().toISOString(),
      reason: reason,
      consciousness_validation: true
    };

    this.lifecycleEvents.push(event);

    // In production, this would log to monitoring system
    logger.info(`🏁 Lifecycle event: ${eventType} - ${specialist.type} specialist`);

    return event;
  }

  getActiveSpecialists() {
    return Array.from(this.activeAgents.values());
  }

  getSpecialistsByDepartment(department) {
    return Array.from(this.activeAgents.values())
      .filter(agent => agent.department === department);
  }

  getLifecycleMetrics() {
    const totalSpawned = this.lifecycleEvents.filter(e => e.type === 'spawn').length;
    const totalDissolved = this.lifecycleEvents.filter(e => e.type === 'dissolve').length;
    const poolReturns = this.lifecycleEvents.filter(e => e.type === 'pool_return').length;
    const currentlyActive = this.activeAgents.size;

    const metrics = {
      total_spawned: totalSpawned,
      total_dissolved: totalDissolved,
      pool_returns: poolReturns,
      currently_active: currentlyActive,
      department_distribution: this.getDepartmentDistribution(),
      average_lifespan: this.calculateAverageLifespan(),
      consciousness_compliance: '100%'
    };

    // Add pool metrics if available
    if (this.poolingEnabled && this.specialistPool) {
      metrics.pool_status = this.specialistPool.getPoolStatus();
      metrics.pool_efficiency = this.specialistPool.calculatePoolEfficiency();
    }

    return metrics;
  }

  getDepartmentDistribution() {
    const distribution = {};
    
    for (const agent of this.activeAgents.values()) {
      distribution[agent.department] = (distribution[agent.department] || 0) + 1;
    }
    
    return distribution;
  }

  calculateAverageLifespan() {
    const dissolvedEvents = this.lifecycleEvents.filter(e => e.type === 'dissolve');
    
    if (dissolvedEvents.length === 0) {return 0;}

    const lifespans = dissolvedEvents.map(event => {
      const spawnEvent = this.lifecycleEvents.find(e => 
        e.type === 'spawn' && e.specialist_id === event.specialist_id
      );
      
      if (spawnEvent) {
        return new Date(event.timestamp) - new Date(spawnEvent.timestamp);
      }
      
      return 0;
    });

    const averageMs = lifespans.reduce((sum, lifespan) => sum + lifespan, 0) / lifespans.length;
    return Math.round(averageMs / (60 * 1000)); // Convert to minutes
  }

  /**
   * Enable or disable pooling
   */
  setPoolingEnabled(enabled) {
    if (enabled && !this.poolingEnabled) {
      this.poolingEnabled = true;
      this.specialistPool = new SpecialistPool({
        maxPoolSize: 50,
        minPoolSize: 5,
        enablePreWarming: true,
        healthCheckInterval: 30000,
        idleTimeout: 300000
      });
      logger.info('🏁 Specialist pooling enabled');
    } else if (!enabled && this.poolingEnabled) {
      this.poolingEnabled = false;
      if (this.specialistPool) {
        this.specialistPool.shutdown();
        this.specialistPool = null;
      }
      logger.info('🏁 Specialist pooling disabled');
    }
  }

  /**
   * Get pool status
   */
  getPoolStatus() {
    if (this.poolingEnabled && this.specialistPool) {
      return this.specialistPool.getPoolStatus();
    }
    return { pooling_enabled: false };
  }

  /**
   * Force recycle a specialist
   */
  async forceRecycleSpecialist(specialist) {
    if (this.poolingEnabled && this.specialistPool) {
      await this.dissolveSpecialist(specialist, 'force_recycle');
    } else {
      await this.dissolveSpecialist(specialist, 'force_dissolve');
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🏁 Lifecycle Manager: Initiating shutdown');
    
    // Shutdown specialist pool first
    if (this.poolingEnabled && this.specialistPool) {
      await this.specialistPool.shutdown();
    }
    
    // Dissolve all remaining active agents
    for (const specialist of this.activeAgents.values()) {
      await this.dissolveSpecialist(specialist, 'system_shutdown');
    }
    
    logger.info('🏁 Lifecycle Manager: Shutdown complete');
  }
}

class AgentPerformanceMonitor {
  constructor() {
    this.performanceData = new Map();
  }

  startMonitoring(specialist) {
    this.performanceData.set(specialist.id, {
      specialist: specialist,
      start_time: Date.now(),
      tasks_completed: 0,
      errors_encountered: 0,
      consciousness_violations: 0,
      performance_score: 1.0
    });
  }

  stopMonitoring(specialist) {
    const data = this.performanceData.get(specialist.id);
    if (data) {
      data.end_time = Date.now();
      data.total_duration = data.end_time - data.start_time;
    }
    
    // Keep data for analysis but mark as completed
    if (data) {
      data.status = 'completed';
    }
  }

  recordTaskCompletion(specialist) {
    const data = this.performanceData.get(specialist.id);
    if (data) {
      data.tasks_completed++;
      this.updatePerformanceScore(specialist.id);
    }
  }

  recordError(specialist, error) {
    const data = this.performanceData.get(specialist.id);
    if (data) {
      data.errors_encountered++;
      this.updatePerformanceScore(specialist.id);
    }
  }

  updatePerformanceScore(specialistId) {
    const data = this.performanceData.get(specialistId);
    if (data) {
      const errorRate = data.errors_encountered / Math.max(data.tasks_completed, 1);
      data.performance_score = Math.max(0, 1.0 - errorRate);
    }
  }

  getPerformanceData(specialist) {
    return this.performanceData.get(specialist.id);
  }
}

class KnowledgeTransferSystem {
  constructor() {
    this.knowledgeStore = new Map();
  }

  async extractKnowledge(specialist) {
    const knowledge = {
      specialist_type: specialist.type,
      department: specialist.department,
      expertise_gained: specialist.expertise || {},
      insights_generated: specialist.insights || [],
      patterns_learned: specialist.patterns || [],
      best_practices: specialist.bestPractices || [],
      consciousness_insights: specialist.consciousnessInsights || [],
      extracted_at: new Date().toISOString()
    };

    return knowledge;
  }

  async storeKnowledge(specialist, knowledge) {
    const key = `${specialist.department}-${specialist.type}`;
    
    if (!this.knowledgeStore.has(key)) {
      this.knowledgeStore.set(key, []);
    }
    
    this.knowledgeStore.get(key).push(knowledge);
    
    // Limit stored knowledge to prevent memory growth
    const stored = this.knowledgeStore.get(key);
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }

    return true;
  }

  async getKnowledge(department, specialistType) {
    const key = `${department}-${specialistType}`;
    return this.knowledgeStore.get(key) || [];
  }

  /**
   * Standard lifecycle methods for agent management
   */

  /**
   * Spawn a new agent with specified configuration
   */
  async spawn(agentConfig) {
    try {
      const { department, specialistType, context, priority, manager } = agentConfig;
      
      // Use existing spawnSpecialist method
      const specialist = await this.spawnSpecialist(department, specialistType, context, manager, priority);
      
      logger.info(`🏁 Agent spawned successfully: ${specialist.id}`);
      return specialist;
    } catch (error) {
      logger.error('Failed to spawn agent:', error);
      throw error;
    }
  }

  /**
   * Terminate an agent
   */
  async terminate(agentId, reason = 'manual_termination') {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      await this.dissolveSpecialist(agent, reason);
      logger.info(`🔴 Agent terminated: ${agentId} (${reason})`);
      return true;
    } catch (error) {
      logger.error(`Failed to terminate agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Restart an agent
   */
  async restart(agentId, newConfig = null) {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const originalConfig = {
        department: agent.department,
        specialistType: agent.type,
        context: agent.context || {},
        manager: agent.manager
      };

      // Terminate current instance
      await this.terminate(agentId, 'restart_requested');

      // Spawn new instance with original or new config
      const config = newConfig ? { ...originalConfig, ...newConfig } : originalConfig;
      const newAgent = await this.spawn(config);

      logger.info(`🔄 Agent restarted: ${agentId} -> ${newAgent.id}`);
      return newAgent;
    } catch (error) {
      logger.error(`Failed to restart agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Pause an agent
   */
  async pause(agentId, reason = 'manual_pause') {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      agent.status = 'paused';
      agent.pausedAt = Date.now();
      agent.pauseReason = reason;

      await this.logLifecycleEvent('pause', agent, reason);
      
      this.emit('agent-paused', { agentId, reason, timestamp: Date.now() });
      
      logger.info(`⏸️ Agent paused: ${agentId} (${reason})`);
      return true;
    } catch (error) {
      logger.error(`Failed to pause agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Resume a paused agent
   */
  async resume(agentId) {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      if (agent.status !== 'paused') {
        throw new Error(`Agent ${agentId} is not paused (current status: ${agent.status})`);
      }

      agent.status = 'active';
      const pauseDuration = Date.now() - (agent.pausedAt || 0);
      delete agent.pausedAt;
      delete agent.pauseReason;

      await this.logLifecycleEvent('resume', agent, { pauseDuration });
      
      this.emit('agent-resumed', { agentId, pauseDuration, timestamp: Date.now() });
      
      logger.info(`▶️ Agent resumed: ${agentId} (paused for ${pauseDuration}ms)`);
      return true;
    } catch (error) {
      logger.error(`Failed to resume agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get agent state information
   */
  getState(agentId = null) {
    if (agentId) {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        return null;
      }

      return {
        id: agent.id,
        type: agent.type,
        department: agent.department,
        status: agent.status || 'active',
        createdAt: agent.createdAt,
        lastActivity: agent.lastActivity,
        taskCount: agent.taskCount || 0,
        performance: this.performanceMonitor.getAgentMetrics(agentId),
        pausedAt: agent.pausedAt || null,
        pauseReason: agent.pauseReason || null
      };
    }

    // Return overall system state
    return {
      totalAgents: this.activeAgents.size,
      agentsByStatus: this.getAgentsByStatus(),
      agentsByType: this.getAgentsByType(),
      systemUptime: Date.now() - this.systemStartTime,
      poolingEnabled: this.poolingEnabled,
      lastActivity: this.lastSystemActivity || Date.now()
    };
  }

  /**
   * Monitor agent health and perform recovery actions
   */
  async monitorHealth() {
    const healthReport = {
      timestamp: Date.now(),
      totalAgents: this.activeAgents.size,
      healthyAgents: 0,
      unhealthyAgents: 0,
      pausedAgents: 0,
      issues: [],
      actions: []
    };

    for (const [agentId, agent] of this.activeAgents) {
      try {
        const agentHealth = await this.checkAgentHealth(agent);
        
        if (agentHealth.healthy) {
          healthReport.healthyAgents++;
        } else {
          healthReport.unhealthyAgents++;
          healthReport.issues.push({
            agentId,
            type: agent.type,
            issues: agentHealth.issues
          });

          // Attempt recovery based on issue type
          if (agentHealth.issues.includes('unresponsive')) {
            await this.restart(agentId);
            healthReport.actions.push(`Restarted unresponsive agent: ${agentId}`);
          } else if (agentHealth.issues.includes('high_error_rate')) {
            await this.pause(agentId, 'health_check_failure');
            healthReport.actions.push(`Paused agent with high error rate: ${agentId}`);
          }
        }

        if (agent.status === 'paused') {
          healthReport.pausedAgents++;
        }
      } catch (error) {
        healthReport.issues.push({
          agentId,
          type: agent.type,
          issues: ['health_check_failed'],
          error: error.message
        });
      }
    }

    this.emit('health-check-complete', healthReport);
    
    logger.info('🟢 Health check complete', {
      healthy: healthReport.healthyAgents,
      unhealthy: healthReport.unhealthyAgents,
      paused: healthReport.pausedAgents
    });

    return healthReport;
  }

  // Helper methods for the new lifecycle functions

  getAgentsByStatus() {
    const statusCounts = {};
    for (const agent of this.activeAgents.values()) {
      const status = agent.status || 'active';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
    return statusCounts;
  }

  getAgentsByType() {
    const typeCounts = {};
    for (const agent of this.activeAgents.values()) {
      const type = agent.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    return typeCounts;
  }

  async checkAgentHealth(agent) {
    const health = {
      healthy: true,
      issues: []
    };

    // Check if agent is responsive
    const timeSinceLastActivity = Date.now() - (agent.lastActivity || agent.createdAt || 0);
    if (timeSinceLastActivity > 300000) { // 5 minutes
      health.healthy = false;
      health.issues.push('unresponsive');
    }

    // Check error rate
    const metrics = this.performanceMonitor.getAgentMetrics(agent.id);
    if (metrics && metrics.errorRate > 0.1) { // 10% error rate threshold
      health.healthy = false;
      health.issues.push('high_error_rate');
    }

    // Check memory usage (if available)
    if (agent.memoryUsage && agent.memoryUsage > 1000000000) { // 1GB threshold
      health.healthy = false;
      health.issues.push('high_memory_usage');
    }

    return health;
  }

  /**
   * Performance optimization utilities
   */
  
  async executeWithConcurrencyLimit(operation, operationType, ...args) {
    const limit = this.concurrencyLimits[operationType] || 1;
    const currentOps = this.operationQueue.get(operationType) || [];
    
    if (currentOps.length >= limit) {
      // Wait for an operation to complete
      await Promise.race(currentOps);
    }
    
    const startTime = Date.now();
    const operationPromise = operation.apply(this, args);
    
    // Track the operation
    currentOps.push(operationPromise);
    this.operationQueue.set(operationType, currentOps);
    this.performanceMetrics.concurrentOperations++;
    
    try {
      const result = await operationPromise;
      
      // Update performance metrics
      const duration = Date.now() - startTime;
      this.updatePerformanceMetrics(duration);
      
      return result;
    } finally {
      // Remove from queue
      const ops = this.operationQueue.get(operationType) || [];
      const index = ops.indexOf(operationPromise);
      if (index > -1) ops.splice(index, 1);
      this.performanceMetrics.concurrentOperations--;
    }
  }
  
  async executeWithTimeout(operation, timeout = 30000) {
    return Promise.race([
      operation,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      )
    ]);
  }
  
  updatePerformanceMetrics(duration) {
    const now = Date.now();
    const timeSinceStart = now - this.systemStartTime;
    
    // Calculate operations per second (moving average)
    this.performanceMetrics.operationsPerSecond = 
      (this.performanceMetrics.operationsPerSecond * 0.9) + 
      (1000 / Math.max(duration, 1)) * 0.1;
    
    // Calculate average response time (moving average)
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * 0.9) + 
      (duration * 0.1);
  }
  
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      uptime: Date.now() - this.systemStartTime,
      activeAgents: this.activeAgents.size,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }
}

module.exports = {
  AgentLifecycleManager,
  AgentPerformanceMonitor,
  KnowledgeTransferSystem
};