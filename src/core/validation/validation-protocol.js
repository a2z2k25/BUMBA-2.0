/**
 * BUMBA Validation Protocol
 * Defines the standard interface for all validation operations
 * Ensures consistent validation across all departments
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Validation Result Structure
 */
class ValidationResult {
  constructor(data = {}) {
    this.id = `val-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date().toISOString();
    this.approved = data.approved || false;
    this.requiresRevision = data.requiresRevision || false;
    this.validatorId = data.validatorId || null;
    this.validatorModel = data.validatorModel || null;
    this.command = data.command || null;
    this.specialistId = data.specialistId || null;
    
    // Validation checks performed
    this.checks = data.checks || {};
    
    // Issues found
    this.issues = data.issues || [];
    
    // Feedback for revision
    this.feedback = data.feedback || [];
    
    // Metrics
    this.validationTime = data.validationTime || 0;
    this.revisionCount = data.revisionCount || 0;
    
    // Confidence score (0-1)
    this.confidence = data.confidence || 0;
  }

  /**
   * Check if validation passed
   */
  isPassed() {
    return this.approved && !this.requiresRevision;
  }

  /**
   * Get severity of issues
   */
  getSeverity() {
    if (this.issues.length === 0) return 'none';
    
    const severities = this.issues.map(i => i.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Add feedback item
   */
  addFeedback(type, message, severity = 'medium', details = {}) {
    this.feedback.push({
      type,
      message,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      approved: this.approved,
      requiresRevision: this.requiresRevision,
      validatorId: this.validatorId,
      validatorModel: this.validatorModel,
      command: this.command,
      specialistId: this.specialistId,
      checks: this.checks,
      issues: this.issues,
      feedback: this.feedback,
      validationTime: this.validationTime,
      revisionCount: this.revisionCount,
      confidence: this.confidence,
      severity: this.getSeverity()
    };
  }
}

/**
 * Revision Request Structure
 */
class RevisionRequest {
  constructor(data = {}) {
    this.id = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date().toISOString();
    this.validationId = data.validationId || null;
    this.specialistId = data.specialistId || null;
    this.managerId = data.managerId || null;
    this.originalWork = data.originalWork || null;
    this.feedback = data.feedback || [];
    this.attemptNumber = data.attemptNumber || 1;
    this.maxAttempts = data.maxAttempts || 3;
    this.priority = data.priority || 'normal';
    this.deadline = data.deadline || null;
  }

  /**
   * Check if more attempts allowed
   */
  canRetry() {
    return this.attemptNumber < this.maxAttempts;
  }

  /**
   * Increment attempt counter
   */
  incrementAttempt() {
    this.attemptNumber++;
    return this.attemptNumber;
  }

  /**
   * Add manager comment
   */
  addManagerComment(comment) {
    this.feedback.push({
      type: 'manager_comment',
      message: comment,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Base Validation Protocol
 * All validators must implement this interface
 */
class ValidationProtocol extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxRevisions: config.maxRevisions || 3,
      validationTimeout: config.validationTimeout || 30000, // 30 seconds
      requireClaudeMax: config.requireClaudeMax !== false, // Default true
      cacheValidations: config.cacheValidations !== false, // Default true
      strictMode: config.strictMode || false // Strict validation mode
    };
    
    this.validationCache = new Map();
    this.validationHistory = [];
    this.metrics = {
      totalValidations: 0,
      approved: 0,
      rejected: 0,
      revisions: 0,
      averageValidationTime: 0,
      averageRevisionCycles: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Main validation method - must be implemented by subclasses
   */
  async validate(work, context = {}) {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Request revision from specialist
   */
  async requestRevision(specialist, validationResult, originalWork) {
    const request = new RevisionRequest({
      validationId: validationResult.id,
      specialistId: specialist.id || specialist.name,
      managerId: this.managerId,
      originalWork,
      feedback: validationResult.feedback,
      attemptNumber: (validationResult.revisionCount || 0) + 1,
      maxAttempts: this.config.maxRevisions
    });
    
    this.emit('revision-requested', request);
    this.metrics.revisions++;
    
    return request;
  }

  /**
   * Check validation cache
   */
  checkCache(workHash) {
    if (!this.config.cacheValidations) return null;
    
    const cached = this.validationCache.get(workHash);
    if (cached) {
      this.metrics.cacheHits++;
      logger.info('📋 Using cached validation result');
      return cached;
    }
    
    this.metrics.cacheMisses++;
    return null;
  }

  /**
   * Store validation in cache
   */
  cacheValidation(workHash, result) {
    if (!this.config.cacheValidations) return;
    
    this.validationCache.set(workHash, result);
    
    // Limit cache size
    if (this.validationCache.size > 100) {
      const firstKey = this.validationCache.keys().next().value;
      this.validationCache.delete(firstKey);
    }
  }

  /**
   * Update metrics
   */
  updateMetrics(validationTime, approved) {
    this.metrics.totalValidations++;
    
    if (approved) {
      this.metrics.approved++;
    } else {
      this.metrics.rejected++;
    }
    
    // Update average validation time
    const totalTime = this.metrics.averageValidationTime * (this.metrics.totalValidations - 1);
    this.metrics.averageValidationTime = (totalTime + validationTime) / this.metrics.totalValidations;
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      approvalRate: this.metrics.totalValidations > 0 
        ? (this.metrics.approved / this.metrics.totalValidations * 100).toFixed(1) + '%'
        : 'N/A',
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(1) + '%'
        : 'N/A',
      averageRevisionCycles: this.metrics.revisions > 0
        ? (this.metrics.revisions / this.metrics.rejected).toFixed(1)
        : '0'
    };
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
    logger.info('🗑️ Validation cache cleared');
  }

  /**
   * Get validation history
   */
  getHistory(limit = 10) {
    return this.validationHistory.slice(-limit);
  }

  /**
   * Store validation in history
   */
  addToHistory(result) {
    this.validationHistory.push(result);
    
    // Limit history size
    if (this.validationHistory.length > 1000) {
      this.validationHistory.shift();
    }
  }
}

/**
 * Validation Severity Levels
 */
const ValidationSeverity = {
  CRITICAL: 'critical', // Must fix immediately
  HIGH: 'high',         // Should fix before approval
  MEDIUM: 'medium',     // Should fix but may approve with conditions
  LOW: 'low',           // Nice to fix but optional
  INFO: 'info'          // Informational only
};

/**
 * Validation Check Types
 */
const ValidationCheckType = {
  SYNTAX: 'syntax',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  BEST_PRACTICES: 'bestPractices',
  REQUIREMENTS: 'requirements',
  TESTING: 'testing',
  DOCUMENTATION: 'documentation',
  ACCESSIBILITY: 'accessibility',
  BUSINESS_LOGIC: 'businessLogic',
  USER_EXPERIENCE: 'userExperience'
};

/**
 * Validation Status
 */
const ValidationStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  SKIPPED: 'skipped'
};

module.exports = {
  ValidationProtocol,
  ValidationResult,
  RevisionRequest,
  ValidationSeverity,
  ValidationCheckType,
  ValidationStatus
};