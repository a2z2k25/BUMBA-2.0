/**
 * Event Audit & Compliance System - Advanced auditing and compliance features for event persistence
 * Provides tamper-evident logging, compliance reporting, and regulatory audit capabilities
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

/**
 * Compliance standards supported
 */
const ComplianceStandard = {
  SOX: 'sox',
  GDPR: 'gdpr',
  HIPAA: 'hipaa',
  SOC2: 'soc2',
  ISO27001: 'iso27001',
  CUSTOM: 'custom'
};

/**
 * Audit event types
 */
const AuditEventType = {
  EVENT_STORED: 'event_stored',
  EVENT_ACCESSED: 'event_accessed',
  EVENT_REPLAYED: 'event_replayed',
  EVENT_DELETED: 'event_deleted',
  RETENTION_APPLIED: 'retention_applied',
  BACKUP_CREATED: 'backup_created',
  RESTORE_PERFORMED: 'restore_performed',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SYSTEM_CHANGE: 'system_change',
  COMPLIANCE_VIOLATION: 'compliance_violation'
};

/**
 * Event Audit Manager - Core compliance and auditing engine
 */
class EventAuditManager {
  constructor(config = {}) {
    this.config = {
      enableTamperEvidence: true,
      enableDigitalSignatures: true,
      complianceStandards: [ComplianceStandard.SOC2],
      auditLogRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      enableRealTimeMonitoring: true,
      enableComplianceReporting: true,
      hashAlgorithm: 'sha256',
      encryptionAlgorithm: 'aes-256-gcm',
      auditStorageBackend: 'file',
      auditDirectory: './data/audit',
      ...config
    };
    
    // Core state
    this.auditChain = [];
    this.hashChain = [];
    this.digitalSignatures = new Map();
    this.complianceRules = new Map();
    this.violationAlerts = [];
    
    // Metrics
    this.auditMetrics = {
      totalAuditEvents: 0,
      complianceViolations: 0,
      tamperAttempts: 0,
      accessEvents: 0,
      lastAuditHash: null,
      chainIntegrity: true
    };
    
    // Initialize compliance rules
    this.initializeComplianceRules();
    
    logger.info('🔍 Event Audit Manager initialized', {
      complianceStandards: this.config.complianceStandards,
      tamperEvidence: this.config.enableTamperEvidence,
      digitalSignatures: this.config.enableDigitalSignatures
    });
  }

  /**
   * Initialize compliance rules for different standards
   */
  initializeComplianceRules() {
    // SOX Compliance Rules
    this.complianceRules.set(ComplianceStandard.SOX, {
      requiredRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      requireDigitalSignatures: true,
      requireTamperEvidence: true,
      requiredAuditEvents: [
        AuditEventType.EVENT_STORED,
        AuditEventType.EVENT_ACCESSED,
        AuditEventType.EVENT_DELETED,
        AuditEventType.SYSTEM_CHANGE
      ],
      accessControls: {
        requireAuthentication: true,
        requireAuthorization: true,
        logAllAccess: true
      }
    });
    
    // GDPR Compliance Rules
    this.complianceRules.set(ComplianceStandard.GDPR, {
      requiredRetention: null, // Based on purpose limitation
      dataMinimization: true,
      rightToErasure: true,
      rightToAccess: true,
      consentTracking: true,
      breachNotification: 72 * 60 * 60 * 1000, // 72 hours
      requiredAuditEvents: [
        AuditEventType.EVENT_STORED,
        AuditEventType.EVENT_ACCESSED,
        AuditEventType.EVENT_DELETED,
        'consent_granted',
        'consent_withdrawn',
        'data_erasure_request'
      ]
    });
    
    // SOC 2 Compliance Rules
    this.complianceRules.set(ComplianceStandard.SOC2, {
      requiredRetention: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year minimum
      requireEncryption: true,
      requireAccessLogging: true,
      requireIntegrityMonitoring: true,
      requiredAuditEvents: [
        AuditEventType.EVENT_STORED,
        AuditEventType.EVENT_ACCESSED,
        AuditEventType.UNAUTHORIZED_ACCESS,
        AuditEventType.SYSTEM_CHANGE
      ],
      securityControls: {
        multiFactor: false, // Not required but recommended
        encryption: true,
        accessReview: true
      }
    });
  }

  /**
   * Record audit event with tamper evidence
   */
  async recordAuditEvent(eventType, details, metadata = {}) {
    const auditEvent = {
      id: this.generateAuditId(),
      type: eventType,
      timestamp: Date.now(),
      details,
      metadata: {
        source: 'event-audit-manager',
        userId: metadata.userId || 'system',
        sessionId: metadata.sessionId || null,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        ...metadata
      },
      compliance: {
        standards: [...this.config.complianceStandards],
        retentionRequired: this.calculateRetentionRequirement(eventType),
        sensitivityLevel: this.calculateSensitivityLevel(details),
        regulatoryFlags: this.identifyRegulatoryFlags(eventType, details)
      }
    };
    
    // Add tamper evidence
    if (this.config.enableTamperEvidence) {
      auditEvent.integrity = await this.addTamperEvidence(auditEvent);
    }
    
    // Add digital signature
    if (this.config.enableDigitalSignatures) {
      auditEvent.signature = await this.addDigitalSignature(auditEvent);
    }
    
    // Check compliance violations
    const violations = await this.checkComplianceViolations(auditEvent);
    if (violations.length > 0) {
      auditEvent.compliance.violations = violations;
      await this.handleComplianceViolations(violations, auditEvent);
    }
    
    // Store in audit chain
    this.auditChain.push(auditEvent);
    this.auditMetrics.totalAuditEvents++;
    
    // Verify chain integrity
    if (this.config.enableTamperEvidence) {
      await this.verifyChainIntegrity();
    }
    
    // Real-time monitoring
    if (this.config.enableRealTimeMonitoring) {
      await this.performRealTimeAnalysis(auditEvent);
    }
    
    logger.debug(`🔍 Audit event recorded: ${eventType} (${auditEvent.id})`);
    
    return auditEvent;
  }

  /**
   * Add tamper evidence to audit event
   */
  async addTamperEvidence(auditEvent) {
    const eventData = {
      id: auditEvent.id,
      type: auditEvent.type,
      timestamp: auditEvent.timestamp,
      details: auditEvent.details,
      metadata: auditEvent.metadata
    };
    
    // Calculate hash of current event
    const eventHash = this.calculateHash(JSON.stringify(eventData));
    
    // Chain with previous hash
    const previousHash = this.hashChain.length > 0 ? 
      this.hashChain[this.hashChain.length - 1] : 
      '0000000000000000000000000000000000000000000000000000000000000000';
    
    const chainedData = previousHash + eventHash;
    const chainedHash = this.calculateHash(chainedData);
    
    this.hashChain.push(chainedHash);
    this.auditMetrics.lastAuditHash = chainedHash;
    
    return {
      eventHash,
      previousHash,
      chainedHash,
      algorithm: this.config.hashAlgorithm,
      timestamp: Date.now()
    };
  }

  /**
   * Add digital signature to audit event
   */
  async addDigitalSignature(auditEvent) {
    // Simplified digital signature (in production, use proper PKI)
    const dataToSign = JSON.stringify({
      id: auditEvent.id,
      type: auditEvent.type,
      timestamp: auditEvent.timestamp,
      hash: auditEvent.integrity?.chainedHash
    });
    
    const signature = this.calculateHash(dataToSign + 'AUDIT_SIGNING_KEY');
    
    this.digitalSignatures.set(auditEvent.id, {
      signature,
      algorithm: 'HMAC-SHA256',
      keyId: 'audit-key-001',
      timestamp: Date.now()
    });
    
    return {
      signature,
      algorithm: 'HMAC-SHA256',
      keyId: 'audit-key-001',
      timestamp: Date.now()
    };
  }

  /**
   * Check for compliance violations
   */
  async checkComplianceViolations(auditEvent) {
    const violations = [];
    
    for (const standard of this.config.complianceStandards) {
      const rules = this.complianceRules.get(standard);
      if (!rules) continue;
      
      // Check required audit events
      if (rules.requiredAuditEvents && 
          !rules.requiredAuditEvents.includes(auditEvent.type) &&
          this.isSignificantEvent(auditEvent)) {
        violations.push({
          standard,
          type: 'missing_required_audit',
          severity: 'high',
          description: `Event type ${auditEvent.type} should be audited for ${standard}`
        });
      }
      
      // Check access controls
      if (rules.accessControls?.requireAuthentication && !auditEvent.metadata.userId) {
        violations.push({
          standard,
          type: 'missing_authentication',
          severity: 'critical',
          description: 'Authentication required but not provided'
        });
      }
      
      // Check encryption requirements
      if (rules.requireEncryption && !auditEvent.metadata.encrypted) {
        violations.push({
          standard,
          type: 'missing_encryption',
          severity: 'high',
          description: 'Encryption required but not applied'
        });
      }
      
      // Check retention requirements
      if (rules.requiredRetention && 
          auditEvent.compliance.retentionRequired < rules.requiredRetention) {
        violations.push({
          standard,
          type: 'insufficient_retention',
          severity: 'medium',
          description: `Retention period does not meet ${standard} requirements`
        });
      }
    }
    
    return violations;
  }

  /**
   * Handle compliance violations
   */
  async handleComplianceViolations(violations, auditEvent) {
    for (const violation of violations) {
      this.violationAlerts.push({
        id: this.generateViolationId(),
        timestamp: Date.now(),
        auditEventId: auditEvent.id,
        violation,
        status: 'open',
        notified: false
      });
      
      this.auditMetrics.complianceViolations++;
      
      // Send alerts for critical violations
      if (violation.severity === 'critical') {
        await this.sendComplianceAlert(violation, auditEvent);
      }
      
      logger.warn(`🔴 Compliance violation: ${violation.type} (${violation.standard})`);
    }
  }

  /**
   * Verify integrity of audit chain
   */
  async verifyChainIntegrity() {
    if (this.auditChain.length === 0) {
      return { valid: true, errors: [] };
    }
    
    const errors = [];
    
    for (let i = 0; i < this.auditChain.length; i++) {
      const event = this.auditChain[i];
      
      if (!event.integrity) {
        errors.push(`Event ${event.id} missing integrity data`);
        continue;
      }
      
      // Verify event hash
      const eventData = {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        details: event.details,
        metadata: event.metadata
      };
      
      const calculatedHash = this.calculateHash(JSON.stringify(eventData));
      
      if (calculatedHash !== event.integrity.eventHash) {
        errors.push(`Event ${event.id} hash mismatch - possible tampering`);
        this.auditMetrics.tamperAttempts++;
      }
      
      // Verify chain linkage
      if (i > 0) {
        const previousHash = this.auditChain[i - 1].integrity.chainedHash;
        if (event.integrity.previousHash !== previousHash) {
          errors.push(`Event ${event.id} chain linkage broken`);
        }
      }
    }
    
    const isValid = errors.length === 0;
    this.auditMetrics.chainIntegrity = isValid;
    
    if (!isValid) {
      logger.error(`🔴 Audit chain integrity compromised: ${errors.length} errors`);
      await this.recordAuditEvent(AuditEventType.COMPLIANCE_VIOLATION, {
        type: 'chain_integrity_failure',
        errors
      });
    }
    
    return { valid: isValid, errors };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(standard, startDate, endDate) {
    const rules = this.complianceRules.get(standard);
    if (!rules) {
      throw new Error(`Unsupported compliance standard: ${standard}`);
    }
    
    const filteredEvents = this.auditChain.filter(event => 
      event.timestamp >= startDate && 
      event.timestamp <= endDate &&
      event.compliance.standards.includes(standard)
    );
    
    const report = {
      standard,
      generatedAt: Date.now(),
      period: { startDate, endDate },
      summary: {
        totalAuditEvents: filteredEvents.length,
        complianceViolations: 0,
        criticalViolations: 0,
        integrityStatus: this.auditMetrics.chainIntegrity ? 'VERIFIED' : 'COMPROMISED'
      },
      eventBreakdown: {},
      violations: [],
      recommendations: [],
      attestation: null
    };
    
    // Analyze events
    const eventTypes = {};
    for (const event of filteredEvents) {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
      
      if (event.compliance.violations) {
        report.summary.complianceViolations += event.compliance.violations.length;
        report.summary.criticalViolations += event.compliance.violations.filter(v => v.severity === 'critical').length;
        report.violations.push(...event.compliance.violations);
      }
    }
    
    report.eventBreakdown = eventTypes;
    
    // Check coverage requirements
    for (const requiredEvent of rules.requiredAuditEvents) {
      if (!eventTypes[requiredEvent]) {
        report.violations.push({
          type: 'missing_required_audit',
          severity: 'high',
          description: `Required audit event type '${requiredEvent}' not found in period`
        });
      }
    }
    
    // Generate recommendations
    report.recommendations = this.generateComplianceRecommendations(standard, report);
    
    // Add attestation
    report.attestation = await this.generateAttestation(report);
    
    logger.info(`📋 Compliance report generated: ${standard} (${filteredEvents.length} events)`);
    
    return report;
  }

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations(standard, report) {
    const recommendations = [];
    
    if (report.summary.complianceViolations > 0) {
      recommendations.push({
        priority: 'high',
        category: 'violations',
        description: `Address ${report.summary.complianceViolations} compliance violations`,
        actions: [
          'Review violation details',
          'Implement corrective measures',
          'Update compliance procedures'
        ]
      });
    }
    
    if (report.summary.integrityStatus === 'COMPROMISED') {
      recommendations.push({
        priority: 'critical',
        category: 'integrity',
        description: 'Audit chain integrity compromised - immediate investigation required',
        actions: [
          'Isolate affected systems',
          'Conduct forensic analysis',
          'Rebuild audit chain if necessary'
        ]
      });
    }
    
    // Check for missing audit events
    const missingEvents = report.violations.filter(v => v.type === 'missing_required_audit');
    if (missingEvents.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'coverage',
        description: 'Improve audit event coverage',
        actions: [
          'Enable missing audit event types',
          'Review audit configuration',
          'Update audit policies'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Generate digital attestation for compliance report
   */
  async generateAttestation(report) {
    const attestationData = {
      reportHash: this.calculateHash(JSON.stringify(report.summary)),
      generatedBy: 'event-audit-manager',
      timestamp: Date.now(),
      chainIntegrity: this.auditMetrics.chainIntegrity,
      lastVerification: Date.now()
    };
    
    const signature = this.calculateHash(JSON.stringify(attestationData) + 'ATTESTATION_KEY');
    
    return {
      ...attestationData,
      signature,
      algorithm: 'HMAC-SHA256'
    };
  }

  /**
   * Perform real-time compliance analysis
   */
  async performRealTimeAnalysis(auditEvent) {
    // Check for suspicious patterns
    if (this.detectSuspiciousActivity(auditEvent)) {
      await this.recordAuditEvent(AuditEventType.UNAUTHORIZED_ACCESS, {
        suspiciousEvent: auditEvent.id,
        reason: 'Pattern analysis detected potential unauthorized access'
      });
    }
    
    // Check for breach notification requirements (GDPR)
    if (this.config.complianceStandards.includes(ComplianceStandard.GDPR)) {
      if (this.isDataBreach(auditEvent)) {
        await this.triggerBreachNotification(auditEvent);
      }
    }
    
    this.auditMetrics.accessEvents++;
  }

  /**
   * Detect suspicious activity patterns
   */
  detectSuspiciousActivity(auditEvent) {
    // Simplified pattern detection
    const recentEvents = this.auditChain.slice(-10);
    const failedAccess = recentEvents.filter(e => 
      e.type === AuditEventType.UNAUTHORIZED_ACCESS &&
      e.metadata.userId === auditEvent.metadata.userId
    ).length;
    
    return failedAccess > 3; // More than 3 failed access attempts
  }

  /**
   * Check if event constitutes a data breach
   */
  isDataBreach(auditEvent) {
    return auditEvent.type === AuditEventType.UNAUTHORIZED_ACCESS &&
           auditEvent.details.dataAccessed &&
           auditEvent.compliance.sensitivityLevel === 'high';
  }

  /**
   * Helper methods
   */
  calculateHash(data) {
    return crypto.createHash(this.config.hashAlgorithm).update(data).digest('hex');
  }

  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateViolationId() {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateRetentionRequirement(eventType) {
    let maxRetention = 0;
    
    for (const standard of this.config.complianceStandards) {
      const rules = this.complianceRules.get(standard);
      if (rules?.requiredRetention) {
        maxRetention = Math.max(maxRetention, rules.requiredRetention);
      }
    }
    
    return maxRetention || this.config.auditLogRetention;
  }

  calculateSensitivityLevel(details) {
    // Simplified sensitivity calculation
    if (details.personalData || details.financialData) {
      return 'high';
    } else if (details.internalData) {
      return 'medium';
    }
    return 'low';
  }

  identifyRegulatoryFlags(eventType, details) {
    const flags = [];
    
    if (details.personalData) {
      flags.push('personal_data');
    }
    
    if (details.financialData) {
      flags.push('financial_data');
    }
    
    if (eventType === AuditEventType.UNAUTHORIZED_ACCESS) {
      flags.push('security_incident');
    }
    
    return flags;
  }

  isSignificantEvent(auditEvent) {
    const significantTypes = [
      AuditEventType.EVENT_STORED,
      AuditEventType.EVENT_DELETED,
      AuditEventType.UNAUTHORIZED_ACCESS,
      AuditEventType.SYSTEM_CHANGE
    ];
    
    return significantTypes.includes(auditEvent.type);
  }

  async sendComplianceAlert(violation, auditEvent) {
    // Placeholder for alert sending (email, SIEM, etc.)
    logger.warn(`🔴 CRITICAL COMPLIANCE ALERT: ${violation.description}`);
  }

  async triggerBreachNotification(auditEvent) {
    // Placeholder for GDPR breach notification
    logger.error(`🔴 DATA BREACH DETECTED: ${auditEvent.id}`);
  }

  /**
   * Get audit statistics and health
   */
  getAuditStats() {
    return {
      timestamp: Date.now(),
      metrics: { ...this.auditMetrics },
      chainLength: this.auditChain.length,
      hashChainLength: this.hashChain.length,
      activeViolations: this.violationAlerts.filter(v => v.status === 'open').length,
      complianceStandards: this.config.complianceStandards,
      integrityStatus: this.auditMetrics.chainIntegrity ? 'VERIFIED' : 'COMPROMISED'
    };
  }

  /**
   * Export audit log for external analysis
   */
  async exportAuditLog(format = 'json', filters = {}) {
    let events = [...this.auditChain];
    
    // Apply filters
    if (filters.startDate) {
      events = events.filter(e => e.timestamp >= filters.startDate);
    }
    
    if (filters.endDate) {
      events = events.filter(e => e.timestamp <= filters.endDate);
    }
    
    if (filters.eventTypes) {
      events = events.filter(e => filters.eventTypes.includes(e.type));
    }
    
    const exportData = {
      exportedAt: Date.now(),
      format,
      totalEvents: events.length,
      integrityVerified: this.auditMetrics.chainIntegrity,
      events
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        return this.convertToCSV(events);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  convertToCSV(events) {
    const headers = ['id', 'type', 'timestamp', 'userId', 'details', 'violations'];
    const rows = events.map(event => [
      event.id,
      event.type,
      new Date(event.timestamp).toISOString(),
      event.metadata.userId || '',
      JSON.stringify(event.details),
      event.compliance.violations ? event.compliance.violations.length : 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = {
  EventAuditManager,
  ComplianceStandard,
  AuditEventType
};