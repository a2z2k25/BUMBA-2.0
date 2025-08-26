/**
 * BUMBA Comprehensive Audit Logger
 * Complete audit trail with compliance, forensics, and analytics support
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ComprehensiveAuditLogger extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      auditDir: options.auditDir || path.join(process.env.HOME || process.cwd(), '.bumba', 'audit'),
      rotationSize: options.rotationSize || 10 * 1024 * 1024, // 10MB
      retentionDays: options.retentionDays || 90,
      encryptLogs: options.encryptLogs || false,
      compressionEnabled: options.compressionEnabled !== false,
      realTimeAlerts: options.realTimeAlerts !== false,
      complianceMode: options.complianceMode || 'standard', // standard, strict, forensic
      ...options
    };
    
    // Audit categories
    this.categories = {
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization',
      DATA_ACCESS: 'data_access',
      DATA_MODIFICATION: 'data_modification',
      CONFIGURATION: 'configuration',
      SECURITY: 'security',
      COMMAND: 'command',
      API: 'api',
      SYSTEM: 'system',
      ERROR: 'error',
      COMPLIANCE: 'compliance',
      FORENSIC: 'forensic'
    };
    
    // Severity levels
    this.severity = {
      CRITICAL: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      INFO: 1
    };
    
    // Storage
    this.logBuffer = [];
    this.currentLogFile = null;
    this.logIndex = new Map(); // Fast search index
    this.alertRules = new Map(); // Real-time alert rules
    
    // Compliance tracking
    this.complianceRequirements = new Map();
    this.complianceViolations = [];
    
    // Metrics
    this.metrics = {
      totalEvents: 0,
      eventsByCategory: {},
      eventsBySeverity: {},
      alertsTriggered: 0,
      complianceViolations: 0,
      storageUsed: 0
    };
    
    this.initialize();
  }

  /**
   * Initialize audit logger
   */
  async initialize() {
    try {
      // Create audit directory structure
      await this.createDirectoryStructure();
      
      // Initialize event categories metrics
      for (const category of Object.values(this.categories)) {
        this.metrics.eventsByCategory[category] = 0;
      }
      
      // Initialize severity metrics
      for (const level of Object.keys(this.severity)) {
        this.metrics.eventsBySeverity[level] = 0;
      }
      
      // Load compliance requirements
      this.loadComplianceRequirements();
      
      // Set up log rotation
      this.scheduleLogRotation();
      
      // Set up retention cleanup
      this.scheduleRetentionCleanup();
      
      // Start buffer flush timer
      this.startBufferFlush();
      
      this.emit('initialized', { auditDir: this.config.auditDir });
      logger.info('Comprehensive audit logger initialized');
      
    } catch (error) {
      logger.error('Failed to initialize audit logger:', error);
      throw error;
    }
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure() {
    const dirs = [
      this.config.auditDir,
      path.join(this.config.auditDir, 'active'),
      path.join(this.config.auditDir, 'archived'),
      path.join(this.config.auditDir, 'alerts'),
      path.join(this.config.auditDir, 'compliance'),
      path.join(this.config.auditDir, 'forensic')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Log an audit event
   */
  async log(event) {
    try {
      // Create comprehensive audit entry
      const auditEntry = this.createAuditEntry(event);
      
      // Validate against compliance requirements
      this.validateCompliance(auditEntry);
      
      // Check alert rules
      this.checkAlertRules(auditEntry);
      
      // Add to buffer
      this.logBuffer.push(auditEntry);
      
      // Update metrics
      this.updateMetrics(auditEntry);
      
      // Index for search
      this.indexEntry(auditEntry);
      
      // Immediate flush for critical events
      if (auditEntry.severity >= this.severity.HIGH) {
        await this.flushBuffer();
      }
      
      // Emit event
      this.emit('event:logged', auditEntry);
      
      return auditEntry.id;
      
    } catch (error) {
      logger.error('Failed to log audit event:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive audit entry
   */
  createAuditEntry(event) {
    const entry = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      timestampMillis: Date.now(),
      
      // Event classification
      category: event.category || this.categories.SYSTEM,
      severity: event.severity || this.severity.INFO,
      type: event.type || 'general',
      action: event.action || 'unknown',
      
      // Actor information
      actor: {
        id: event.actor?.id || 'system',
        type: event.actor?.type || 'system',
        username: event.actor?.username,
        email: event.actor?.email,
        ip: event.actor?.ip,
        userAgent: event.actor?.userAgent,
        sessionId: event.actor?.sessionId
      },
      
      // Target information
      target: {
        type: event.target?.type,
        id: event.target?.id,
        name: event.target?.name,
        path: event.target?.path,
        before: event.target?.before,
        after: event.target?.after
      },
      
      // Context
      context: {
        applicationVersion: process.env.npm_package_version,
        environment: process.env.NODE_ENV || 'development',
        hostname: require('os').hostname(),
        processId: process.pid,
        ...event.context
      },
      
      // Result
      result: {
        success: event.result?.success !== false,
        code: event.result?.code,
        message: event.result?.message,
        error: event.result?.error
      },
      
      // Additional data
      metadata: event.metadata || {},
      tags: event.tags || [],
      
      // Compliance
      compliance: {
        frameworks: event.compliance?.frameworks || [],
        requirements: event.compliance?.requirements || [],
        verified: false
      },
      
      // Security
      security: {
        threatLevel: event.security?.threatLevel || 'none',
        indicators: event.security?.indicators || [],
        mitigations: event.security?.mitigations || []
      }
    };
    
    // Add hash for integrity
    entry.hash = this.generateHash(entry);
    
    // Sign if in forensic mode
    if (this.config.complianceMode === 'forensic') {
      entry.signature = this.signEntry(entry);
    }
    
    return entry;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate hash for integrity
   */
  generateHash(entry) {
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      category: entry.category,
      action: entry.action,
      actor: entry.actor,
      target: entry.target
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Sign entry for forensic purposes
   */
  signEntry(entry) {
    // In production, use proper digital signatures
    const sign = crypto.createSign('SHA256');
    sign.update(entry.hash);
    
    // This is a placeholder - use actual private key in production
    const privateKey = this.getPrivateKey();
    if (privateKey) {
      return sign.sign(privateKey, 'hex');
    }
    
    return null;
  }

  /**
   * Get private key for signing (placeholder)
   */
  getPrivateKey() {
    // In production, load from secure storage
    return null;
  }

  /**
   * Validate compliance requirements
   */
  validateCompliance(entry) {
    if (this.config.complianceMode === 'strict' || this.config.complianceMode === 'forensic') {
      const violations = [];
      
      // Check required fields
      const requiredFields = this.complianceRequirements.get('required_fields') || [];
      for (const field of requiredFields) {
        if (!this.getNestedValue(entry, field)) {
          violations.push(`Missing required field: ${field}`);
        }
      }
      
      // Check data retention
      if (entry.category === this.categories.DATA_ACCESS) {
        const retentionPolicy = this.complianceRequirements.get('data_retention');
        if (retentionPolicy && !entry.compliance.requirements.includes(retentionPolicy)) {
          violations.push(`Data retention policy not specified`);
        }
      }
      
      // Check PII handling
      if (this.containsPII(entry)) {
        if (!entry.compliance.requirements.includes('pii_handling')) {
          violations.push('PII handling requirements not met');
        }
      }
      
      if (violations.length > 0) {
        entry.compliance.violations = violations;
        entry.compliance.verified = false;
        this.metrics.complianceViolations++;
        
        this.emit('compliance:violation', {
          entry,
          violations
        });
      } else {
        entry.compliance.verified = true;
      }
    }
  }

  /**
   * Check if entry contains PII
   */
  containsPII(entry) {
    const piiPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Names
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ // Phone
    ];
    
    const content = JSON.stringify(entry);
    return piiPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check alert rules
   */
  checkAlertRules(entry) {
    for (const [ruleName, rule] of this.alertRules) {
      if (this.matchesRule(entry, rule)) {
        this.triggerAlert(ruleName, entry, rule);
      }
    }
  }

  /**
   * Check if entry matches alert rule
   */
  matchesRule(entry, rule) {
    // Check category
    if (rule.category && entry.category !== rule.category) {
      return false;
    }
    
    // Check severity
    if (rule.minSeverity && entry.severity < rule.minSeverity) {
      return false;
    }
    
    // Check patterns
    if (rule.patterns) {
      const content = JSON.stringify(entry);
      return rule.patterns.some(pattern => new RegExp(pattern).test(content));
    }
    
    // Check conditions
    if (rule.condition && typeof rule.condition === 'function') {
      return rule.condition(entry);
    }
    
    return true;
  }

  /**
   * Trigger alert
   */
  async triggerAlert(ruleName, entry, rule) {
    const alert = {
      id: `alert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      rule: ruleName,
      severity: rule.severity || entry.severity,
      entry: entry.id,
      message: rule.message || `Alert triggered by rule: ${ruleName}`,
      actions: rule.actions || []
    };
    
    // Save alert
    const alertFile = path.join(
      this.config.auditDir,
      'alerts',
      `${alert.id}.json`
    );
    
    await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
    
    // Execute actions
    for (const action of alert.actions) {
      await this.executeAlertAction(action, alert, entry);
    }
    
    this.metrics.alertsTriggered++;
    
    this.emit('alert:triggered', alert);
    logger.warn(`Security alert triggered: ${ruleName}`);
  }

  /**
   * Execute alert action
   */
  async executeAlertAction(action, alert, entry) {
    switch (action.type) {
      case 'email':
        // Send email notification (implement with actual email service)
        logger.info(`Would send email alert to ${action.recipient}`);
        break;
        
      case 'webhook':
        // Call webhook (implement with actual HTTP client)
        logger.info(`Would call webhook: ${action.url}`);
        break;
        
      case 'block':
        // Block the actor (integrate with security system)
        this.emit('security:block', {
          actor: entry.actor,
          reason: alert.message
        });
        break;
        
      case 'log':
        logger.error(`SECURITY ALERT: ${alert.message}`, entry);
        break;
        
      default:
        logger.warn(`Unknown alert action type: ${action.type}`);
    }
  }

  /**
   * Index entry for fast search
   */
  indexEntry(entry) {
    // Index by ID
    this.logIndex.set(entry.id, entry);
    
    // Index by actor
    const actorKey = `actor:${entry.actor.id}`;
    if (!this.logIndex.has(actorKey)) {
      this.logIndex.set(actorKey, []);
    }
    this.logIndex.get(actorKey).push(entry.id);
    
    // Index by category
    const categoryKey = `category:${entry.category}`;
    if (!this.logIndex.has(categoryKey)) {
      this.logIndex.set(categoryKey, []);
    }
    this.logIndex.get(categoryKey).push(entry.id);
    
    // Index by date
    const dateKey = `date:${entry.timestamp.split('T')[0]}`;
    if (!this.logIndex.has(dateKey)) {
      this.logIndex.set(dateKey, []);
    }
    this.logIndex.get(dateKey).push(entry.id);
  }

  /**
   * Update metrics
   */
  updateMetrics(entry) {
    this.metrics.totalEvents++;
    
    // By category
    if (this.metrics.eventsByCategory[entry.category] !== undefined) {
      this.metrics.eventsByCategory[entry.category]++;
    }
    
    // By severity
    const severityName = Object.keys(this.severity).find(
      key => this.severity[key] === entry.severity
    );
    if (severityName && this.metrics.eventsBySeverity[severityName] !== undefined) {
      this.metrics.eventsBySeverity[severityName]++;
    }
  }

  /**
   * Flush buffer to disk
   */
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;
    
    try {
      // Get current log file
      const logFile = await this.getCurrentLogFile();
      
      // Prepare entries
      let content = this.logBuffer
        .map(entry => JSON.stringify(entry))
        .join('\n') + '\n';
      
      // Encrypt if enabled
      if (this.config.encryptLogs) {
        content = await this.encryptContent(content);
      }
      
      // Append to file
      await fs.appendFile(logFile, content);
      
      // Update storage metrics
      const stats = await fs.stat(logFile);
      this.metrics.storageUsed = stats.size;
      
      // Clear buffer
      const flushedCount = this.logBuffer.length;
      this.logBuffer = [];
      
      logger.debug(`Flushed ${flushedCount} audit entries to ${logFile}`);
      
    } catch (error) {
      logger.error('Failed to flush audit buffer:', error);
      // Keep buffer for retry
    }
  }

  /**
   * Get current log file
   */
  async getCurrentLogFile() {
    const date = new Date().toISOString().split('T')[0];
    const filename = `audit_${date}_${process.pid}.log`;
    
    this.currentLogFile = path.join(
      this.config.auditDir,
      'active',
      filename
    );
    
    return this.currentLogFile;
  }

  /**
   * Encrypt content
   */
  async encryptContent(content) {
    // Simple encryption - use proper encryption in production
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('audit-encryption-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted
    }) + '\n';
  }

  /**
   * Search audit logs
   */
  async search(criteria = {}) {
    const results = [];
    
    // Search in index first
    if (criteria.id) {
      const entry = this.logIndex.get(criteria.id);
      if (entry) results.push(entry);
    }
    
    if (criteria.actor) {
      const entryIds = this.logIndex.get(`actor:${criteria.actor}`) || [];
      for (const id of entryIds) {
        const entry = this.logIndex.get(id);
        if (entry) results.push(entry);
      }
    }
    
    if (criteria.category) {
      const entryIds = this.logIndex.get(`category:${criteria.category}`) || [];
      for (const id of entryIds) {
        const entry = this.logIndex.get(id);
        if (entry) results.push(entry);
      }
    }
    
    // Apply additional filters
    let filtered = results;
    
    if (criteria.startDate) {
      const start = new Date(criteria.startDate).getTime();
      filtered = filtered.filter(e => e.timestampMillis >= start);
    }
    
    if (criteria.endDate) {
      const end = new Date(criteria.endDate).getTime();
      filtered = filtered.filter(e => e.timestampMillis <= end);
    }
    
    if (criteria.severity) {
      filtered = filtered.filter(e => e.severity >= criteria.severity);
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestampMillis - a.timestampMillis);
    
    // Apply limit
    if (criteria.limit) {
      filtered = filtered.slice(0, criteria.limit);
    }
    
    return filtered;
  }

  /**
   * Generate audit report
   */
  async generateReport(options = {}) {
    const report = {
      generated: new Date().toISOString(),
      period: {
        start: options.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: options.endDate || new Date().toISOString()
      },
      metrics: { ...this.metrics },
      summary: {},
      topActors: [],
      criticalEvents: [],
      complianceStatus: {}
    };
    
    // Search for events in period
    const events = await this.search({
      startDate: report.period.start,
      endDate: report.period.end
    });
    
    // Analyze events
    const actorCounts = new Map();
    const criticalEvents = [];
    
    for (const event of events) {
      // Count by actor
      const actorId = event.actor.id;
      actorCounts.set(actorId, (actorCounts.get(actorId) || 0) + 1);
      
      // Collect critical events
      if (event.severity >= this.severity.HIGH) {
        criticalEvents.push({
          id: event.id,
          timestamp: event.timestamp,
          category: event.category,
          action: event.action,
          actor: event.actor.id
        });
      }
    }
    
    // Top actors
    report.topActors = Array.from(actorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actor, count]) => ({ actor, eventCount: count }));
    
    // Critical events
    report.criticalEvents = criticalEvents.slice(0, 20);
    
    // Compliance status
    report.complianceStatus = {
      mode: this.config.complianceMode,
      violations: this.metrics.complianceViolations,
      verified: events.filter(e => e.compliance?.verified).length,
      unverified: events.filter(e => !e.compliance?.verified).length
    };
    
    return report;
  }

  /**
   * Export audit logs
   */
  async export(format = 'json', options = {}) {
    const events = await this.search(options);
    
    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);
        
      case 'csv':
        return this.exportAsCSV(events);
        
      case 'syslog':
        return this.exportAsSyslog(events);
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export as CSV
   */
  exportAsCSV(events) {
    const headers = [
      'ID', 'Timestamp', 'Category', 'Severity', 'Action',
      'Actor', 'Target', 'Success', 'Message'
    ];
    
    const rows = events.map(e => [
      e.id,
      e.timestamp,
      e.category,
      e.severity,
      e.action,
      e.actor.id,
      e.target?.id || '',
      e.result.success,
      e.result.message || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Export as syslog format
   */
  exportAsSyslog(events) {
    return events.map(e => {
      const facility = 16; // Local0
      const severity = 8 - Math.min(e.severity, 7); // Map to syslog severity
      const priority = facility * 8 + severity;
      
      return `<${priority}>${e.timestamp} ${e.context.hostname} bumba[${e.context.processId}]: ` +
             `category=${e.category} action=${e.action} actor=${e.actor.id} result=${e.result.success}`;
    }).join('\n');
  }

  /**
   * Load compliance requirements
   */
  loadComplianceRequirements() {
    // Define compliance requirements based on mode
    if (this.config.complianceMode === 'strict') {
      this.complianceRequirements.set('required_fields', [
        'id', 'timestamp', 'category', 'actor.id', 'action'
      ]);
      this.complianceRequirements.set('data_retention', 'gdpr_compliant');
    }
    
    if (this.config.complianceMode === 'forensic') {
      this.complianceRequirements.set('required_fields', [
        'id', 'timestamp', 'category', 'actor', 'target', 'hash', 'signature'
      ]);
      this.complianceRequirements.set('integrity_check', true);
      this.complianceRequirements.set('tamper_evident', true);
    }
  }

  /**
   * Add alert rule
   */
  addAlertRule(name, rule) {
    this.alertRules.set(name, rule);
    logger.info(`Alert rule added: ${name}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(name) {
    if (this.alertRules.delete(name)) {
      logger.info(`Alert rule removed: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Schedule log rotation
   */
  scheduleLogRotation() {
    // Check every hour
    this.rotationTimer = setInterval(async () => {
      await this.rotateLogsIfNeeded();
    }, 60 * 60 * 1000);
  }

  /**
   * Rotate logs if needed
   */
  async rotateLogsIfNeeded() {
    const activeDir = path.join(this.config.auditDir, 'active');
    const files = await fs.readdir(activeDir);
    
    for (const file of files) {
      const filePath = path.join(activeDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.size > this.config.rotationSize) {
        await this.rotateLog(filePath);
      }
    }
  }

  /**
   * Rotate a log file
   */
  async rotateLog(filePath) {
    const filename = path.basename(filePath);
    const archivePath = path.join(
      this.config.auditDir,
      'archived',
      `${filename}.${Date.now()}`
    );
    
    // Compress if enabled
    if (this.config.compressionEnabled) {
      // Implement compression (using zlib in production)
      await fs.rename(filePath, archivePath + '.gz');
    } else {
      await fs.rename(filePath, archivePath);
    }
    
    logger.info(`Rotated audit log: ${filename}`);
  }

  /**
   * Schedule retention cleanup
   */
  scheduleRetentionCleanup() {
    // Check daily
    this.retentionTimer = setInterval(async () => {
      await this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs() {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    const archiveDir = path.join(this.config.auditDir, 'archived');
    
    const files = await fs.readdir(archiveDir);
    
    for (const file of files) {
      const filePath = path.join(archiveDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        await fs.unlink(filePath);
        logger.info(`Deleted old audit log: ${file}`);
      }
    }
  }

  /**
   * Start buffer flush timer
   */
  startBufferFlush() {
    // Flush every 5 seconds or when buffer is full
    this.flushTimer = setInterval(async () => {
      if (this.logBuffer.length > 0) {
        await this.flushBuffer();
      }
    }, 5000);
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      bufferSize: this.logBuffer.length,
      indexSize: this.logIndex.size,
      alertRules: this.alertRules.size,
      complianceMode: this.config.complianceMode
    };
  }

  /**
   * Stop the audit logger
   */
  async stop() {
    // Flush remaining buffer
    await this.flushBuffer();
    
    // Clear timers
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    if (this.retentionTimer) clearInterval(this.retentionTimer);
    
    logger.info('Audit logger stopped');
  }
}

// Export singleton instance
module.exports = new ComprehensiveAuditLogger();