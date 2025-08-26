/**
 * BUMBA Security Audit Logger
 * Comprehensive audit trail for security events and compliance
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class AuditLogger extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.auditDir = options.auditDir || path.join(process.env.HOME || process.cwd(), '.bumba', 'audit');
    this.rotationSize = options.rotationSize || 10 * 1024 * 1024; // 10MB default
    this.retentionDays = options.retentionDays || 90; // 90 days default
    this.encryptLogs = options.encryptLogs || false;
    this.encryptionKey = options.encryptionKey || null;
    
    this.currentLogFile = null;
    this.logStream = null;
    this.stats = {
      eventsLogged: 0,
      securityEvents: 0,
      commandExecutions: 0,
      authenticationEvents: 0,
      errors: 0
    };
    
    this.initializeAuditLog();
  }

  async initializeAuditLog() {
    try {
      // Create audit directory
      await fs.mkdir(this.auditDir, { recursive: true });
      
      // Set up log rotation
      this.scheduleLogRotation();
      
      // Clean up old logs
      this.scheduleLogCleanup();
      
      // Set current log file
      this.currentLogFile = this.getLogFileName();
      
      this.emit('initialized', { auditDir: this.auditDir });
    } catch (error) {
      console.error('Failed to initialize audit logger:', error);
      this.emit('error', error);
    }
  }

  /**
   * Log a security event
   */
  async log(event) {
    const entry = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: event.type || 'UNKNOWN',
      severity: event.severity || 'INFO',
      user: event.user || 'system',
      ip: event.ip || this.getLocalIP(),
      sessionId: event.sessionId || null,
      resource: event.resource || null,
      action: event.action || null,
      result: event.result || 'UNKNOWN',
      reason: event.reason || null,
      metadata: event.metadata || {},
      stackTrace: event.error ? this.sanitizeStackTrace(event.error.stack) : null
    };

    // Add integrity hash
    entry.hash = this.calculateHash(entry);

    try {
      // Write to log file
      const logLine = JSON.stringify(entry) + '\n';
      const logData = this.encryptLogs ? await this.encryptData(logLine) : logLine;
      
      await fs.appendFile(
        path.join(this.auditDir, this.currentLogFile),
        logData
      );

      // Update stats
      this.stats.eventsLogged++;
      this.updateEventStats(entry.type);

      // Emit event for real-time monitoring
      this.emit('event-logged', entry);

      // Check for critical events
      if (entry.severity === 'CRITICAL') {
        this.emit('critical-event', entry);
      }

      return entry.id;
    } catch (error) {
      this.stats.errors++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Log security-specific events
   */
  async logSecurityEvent(type, details) {
    return this.log({
      type: `SECURITY_${type}`,
      severity: this.getSecurityEventSeverity(type),
      ...details
    });
  }

  /**
   * Log command execution
   */
  async logCommandExecution(command, args, user, result) {
    return this.log({
      type: 'COMMAND_EXECUTION',
      user,
      resource: command,
      action: 'execute',
      result: result.success ? 'SUCCESS' : 'FAILURE',
      metadata: { 
        args: this.sanitizeArgs(args), 
        duration: result.duration,
        error: result.error ? result.error.message : null
      },
      severity: result.success ? 'INFO' : 'WARNING'
    });
  }

  /**
   * Log authentication events
   */
  async logAuthentication(type, user, success, metadata = {}) {
    return this.log({
      type: `AUTH_${type}`,
      user,
      action: type.toLowerCase(),
      result: success ? 'SUCCESS' : 'FAILURE',
      severity: success ? 'INFO' : 'WARNING',
      metadata
    });
  }

  /**
   * Log permission checks
   */
  async logPermissionCheck(user, resource, action, allowed) {
    return this.log({
      type: 'PERMISSION_CHECK',
      user,
      resource,
      action,
      result: allowed ? 'ALLOWED' : 'DENIED',
      severity: allowed ? 'INFO' : 'WARNING'
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(user, dataType, action, details = {}) {
    return this.log({
      type: 'DATA_ACCESS',
      user,
      resource: dataType,
      action,
      result: 'SUCCESS',
      severity: 'INFO',
      metadata: details
    });
  }

  /**
   * Log configuration changes
   */
  async logConfigChange(user, setting, oldValue, newValue) {
    return this.log({
      type: 'CONFIG_CHANGE',
      user,
      resource: setting,
      action: 'modify',
      result: 'SUCCESS',
      severity: 'WARNING',
      metadata: {
        oldValue: this.sanitizeValue(oldValue),
        newValue: this.sanitizeValue(newValue)
      }
    });
  }

  /**
   * Search audit logs
   */
  async search(criteria) {
    const results = [];
    const files = await this.getLogFiles();
    
    for (const file of files) {
      const content = await fs.readFile(path.join(this.auditDir, file), 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (this.matchesCriteria(entry, criteria)) {
            results.push(entry);
          }
        } catch (error) {
          // Skip malformed entries
          continue;
        }
      }
    }
    
    return results;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    const events = await this.search({
      startDate,
      endDate
    });
    
    const report = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalEvents: events.length,
        securityEvents: events.filter(e => e.type.startsWith('SECURITY_')).length,
        authenticationEvents: events.filter(e => e.type.startsWith('AUTH_')).length,
        failedAuthentications: events.filter(e => e.type.startsWith('AUTH_') && e.result === 'FAILURE').length,
        permissionDenials: events.filter(e => e.type === 'PERMISSION_CHECK' && e.result === 'DENIED').length,
        configChanges: events.filter(e => e.type === 'CONFIG_CHANGE').length,
        criticalEvents: events.filter(e => e.severity === 'CRITICAL').length
      },
      userActivity: this.aggregateUserActivity(events),
      topDeniedResources: this.getTopDeniedResources(events),
      securityIncidents: events.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH'),
      integrityCheck: await this.verifyLogIntegrity(events)
    };
    
    return report;
  }

  /**
   * Helper methods
   */
  
  generateEventId() {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  getLogFileName() {
    const date = new Date();
    return `audit-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
  }

  calculateHash(entry) {
    const content = JSON.stringify({
      timestamp: entry.timestamp,
      type: entry.type,
      user: entry.user,
      action: entry.action,
      result: entry.result
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  sanitizeArgs(args) {
    // Remove sensitive information from arguments
    const sanitized = { ...args };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  sanitizeValue(value) {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...[truncated]';
    }
    return value;
  }

  sanitizeStackTrace(stack) {
    if (!stack) {return null;}
    // Remove absolute paths
    return stack.replace(/\/[^\s]+\//g, '.../');
  }

  getSecurityEventSeverity(type) {
    const severityMap = {
      'INTRUSION_ATTEMPT': 'CRITICAL',
      'UNAUTHORIZED_ACCESS': 'CRITICAL',
      'PRIVILEGE_ESCALATION': 'CRITICAL',
      'DATA_BREACH': 'CRITICAL',
      'BRUTE_FORCE': 'HIGH',
      'SUSPICIOUS_ACTIVITY': 'HIGH',
      'POLICY_VIOLATION': 'MEDIUM',
      'FAILED_LOGIN': 'LOW'
    };
    return severityMap[type] || 'INFO';
  }

  getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  updateEventStats(type) {
    if (type.startsWith('SECURITY_')) {
      this.stats.securityEvents++;
    } else if (type === 'COMMAND_EXECUTION') {
      this.stats.commandExecutions++;
    } else if (type.startsWith('AUTH_')) {
      this.stats.authenticationEvents++;
    }
  }

  matchesCriteria(entry, criteria) {
    if (criteria.type && entry.type !== criteria.type) {return false;}
    if (criteria.user && entry.user !== criteria.user) {return false;}
    if (criteria.severity && entry.severity !== criteria.severity) {return false;}
    if (criteria.startDate && new Date(entry.timestamp) < new Date(criteria.startDate)) {return false;}
    if (criteria.endDate && new Date(entry.timestamp) > new Date(criteria.endDate)) {return false;}
    return true;
  }

  async getLogFiles() {
    const files = await fs.readdir(this.auditDir);
    return files.filter(f => f.endsWith('.log')).sort();
  }

  aggregateUserActivity(events) {
    const activity = {};
    for (const event of events) {
      if (!activity[event.user]) {
        activity[event.user] = {
          totalEvents: 0,
          successfulActions: 0,
          failedActions: 0,
          types: {}
        };
      }
      
      activity[event.user].totalEvents++;
      if (event.result === 'SUCCESS' || event.result === 'ALLOWED') {
        activity[event.user].successfulActions++;
      } else {
        activity[event.user].failedActions++;
      }
      
      activity[event.user].types[event.type] = (activity[event.user].types[event.type] || 0) + 1;
    }
    return activity;
  }

  getTopDeniedResources(events) {
    const denials = {};
    const deniedEvents = events.filter(e => 
      e.type === 'PERMISSION_CHECK' && e.result === 'DENIED'
    );
    
    for (const event of deniedEvents) {
      const key = `${event.resource}:${event.action}`;
      denials[key] = (denials[key] || 0) + 1;
    }
    
    return Object.entries(denials)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));
  }

  async verifyLogIntegrity(events) {
    let valid = 0;
    let invalid = 0;
    
    for (const event of events) {
      const expectedHash = this.calculateHash(event);
      if (event.hash === expectedHash) {
        valid++;
      } else {
        invalid++;
      }
    }
    
    return {
      totalEvents: events.length,
      validEvents: valid,
      invalidEvents: invalid,
      integrityScore: (valid / events.length) * 100
    };
  }

  scheduleLogRotation() {
    // Check every hour
    setInterval(async () => {
      try {
        const currentFile = path.join(this.auditDir, this.currentLogFile);
        const stats = await fs.stat(currentFile).catch(() => null);
        
        if (stats && stats.size > this.rotationSize) {
          this.currentLogFile = this.getLogFileName();
          this.emit('log-rotated', { newFile: this.currentLogFile });
        }
      } catch (error) {
        this.emit('error', error);
      }
    }, 3600000); // 1 hour
  }

  scheduleLogCleanup() {
    // Clean up daily
    setInterval(async () => {
      try {
        const files = await this.getLogFiles();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        
        for (const file of files) {
          const filePath = path.join(this.auditDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            this.emit('log-cleaned', { file, reason: 'retention-policy' });
          }
        }
      } catch (error) {
        this.emit('error', error);
      }
    }, 86400000); // 24 hours
  }

  async encryptData(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not provided');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  async decryptData(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not provided');
    }
    
    const parts = data.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Log a general event
   */
  async logEvent(type, details = {}) {
    return this.log({
      type,
      severity: details.severity || 'INFO',
      ...details
    });
  }

  /**
   * Log a security-specific event
   */
  async logSecurityEvent(eventType, details = {}) {
    this.stats.securityEvents++;
    return this.log({
      type: `SECURITY_${eventType.toUpperCase()}`,
      severity: details.severity || 'WARNING',
      category: 'security',
      ...details
    });
  }

  /**
   * Log an access attempt
   */
  async logAccessAttempt(user, resource, action, result, details = {}) {
    this.stats.authenticationEvents++;
    return this.log({
      type: 'ACCESS_ATTEMPT',
      severity: result === 'denied' ? 'WARNING' : 'INFO',
      user,
      resource,
      action,
      result,
      ...details
    });
  }

  /**
   * Log a data change event
   */
  async logDataChange(entity, operation, oldValue, newValue, user, details = {}) {
    return this.log({
      type: 'DATA_CHANGE',
      severity: 'INFO',
      entity,
      operation,
      changes: {
        before: this.sanitizeData(oldValue),
        after: this.sanitizeData(newValue)
      },
      user,
      ...details
    });
  }

  /**
   * Query logs with filters
   */
  async queryLogs(filters = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate = new Date(),
      type = null,
      severity = null,
      user = null,
      limit = 100
    } = filters;

    const results = [];
    const files = await fs.readdir(this.auditDir);
    
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(this.auditDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          
          if (entryDate < startDate || entryDate > endDate) continue;
          if (type && entry.type !== type) continue;
          if (severity && entry.severity !== severity) continue;
          if (user && entry.user !== user) continue;
          
          results.push(entry);
          
          if (results.length >= limit) {
            return results;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    return results;
  }

  /**
   * Export logs in various formats
   */
  async exportLogs(format = 'json', options = {}) {
    const logs = await this.queryLogs(options.filters || {});
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv':
        const headers = ['timestamp', 'type', 'severity', 'user', 'resource', 'action', 'result'];
        const rows = logs.map(log => 
          headers.map(h => log[h] || '').join(',')
        );
        return [headers.join(','), ...rows].join('\n');
      
      case 'html':
        return this.generateHTMLReport(logs);
      
      default:
        return logs;
    }
  }

  /**
   * Rotate logs when they exceed size limit
   */
  async rotateLogs() {
    try {
      const currentPath = path.join(this.auditDir, this.currentLogFile);
      const stats = await fs.stat(currentPath).catch(() => null);
      
      if (stats && stats.size > this.rotationSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = `audit-${timestamp}.log`;
        const rotatedPath = path.join(this.auditDir, rotatedFile);
        
        await fs.rename(currentPath, rotatedPath);
        this.currentLogFile = this.getLogFileName();
        
        this.emit('log-rotated', {
          oldFile: rotatedFile,
          newFile: this.currentLogFile,
          size: stats.size
        });
        
        await this.cleanupOldLogs();
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Sanitize sensitive data
   */
  sanitizeData(data) {
    if (!data) return null;
    
    const sanitized = JSON.stringify(data);
    return sanitized
      .replace(/password["\s]*:["\s]*"[^"]+"/gi, 'password:"[REDACTED]"')
      .replace(/token["\s]*:["\s]*"[^"]+"/gi, 'token:"[REDACTED]"')
      .replace(/api[_-]?key["\s]*:["\s]*"[^"]+"/gi, 'api_key:"[REDACTED]"');
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(logs) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Security Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .severity-CRITICAL { background-color: #f44336; color: white; }
    .severity-WARNING { background-color: #ff9800; }
    .severity-INFO { background-color: #2196F3; color: white; }
  </style>
</head>
<body>
  <h1>Security Audit Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>Total Events: ${logs.length}</p>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Type</th>
        <th>Severity</th>
        <th>User</th>
        <th>Resource</th>
        <th>Action</th>
        <th>Result</th>
      </tr>
    </thead>
    <tbody>
      ${logs.map(log => `
        <tr class="severity-${log.severity}">
          <td>${log.timestamp}</td>
          <td>${log.type}</td>
          <td>${log.severity}</td>
          <td>${log.user}</td>
          <td>${log.resource || 'N/A'}</td>
          <td>${log.action || 'N/A'}</td>
          <td>${log.result || 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  AuditLogger,
  SecurityAuditLogger: AuditLogger,
  
  // Get singleton instance
  getInstance(options) {
    if (!instance) {
      instance = new SecurityAuditLogger(options);
    }
    return instance;
  }
};