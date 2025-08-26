/**
 * BUMBA Command Audit Logger
 * Comprehensive audit logging for command execution
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging/bumba-logger');
const crypto = require('crypto');

class CommandAuditLogger {
  constructor(options = {}) {
    this.options = {
      logFile: options.logFile || path.join(process.cwd(), '.bumba-audit.log'),
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      rotationCount: options.rotationCount || 5,
      logLevel: options.logLevel || 'info', // info, verbose, debug
      hashSensitive: options.hashSensitive !== false,
      includeEnv: options.includeEnv || false,
      includeSystemMetrics: options.includeSystemMetrics || false,
      bufferSize: options.bufferSize || 100,
      flushInterval: options.flushInterval || 5000, // 5 seconds
      ...options
    };
    
    // Audit log buffer
    this.buffer = [];
    
    // Statistics
    this.stats = {
      totalLogged: 0,
      byCommand: new Map(),
      byUser: new Map(),
      byResult: { success: 0, failure: 0, error: 0 },
      rotations: 0
    };
    
    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Start flush timer
    this.startFlushTimer();
  }

  /**
   * Log command execution
   */
  async logCommand(data) {
    const entry = this.createAuditEntry(data);
    
    // Add to buffer
    this.buffer.push(entry);
    
    // Update statistics
    this.updateStats(entry);
    
    // Check if should flush
    if (this.buffer.length >= this.options.bufferSize) {
      await this.flush();
    }
    
    // Log to console if verbose
    if (this.options.logLevel === 'verbose' || this.options.logLevel === 'debug') {
      logger.debug('Audit entry:', entry);
    }
    
    return entry.id;
  }

  /**
   * Create audit entry
   */
  createAuditEntry(data) {
    const entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      command: data.command,
      args: this.sanitizeArgs(data.args),
      user: this.getUserInfo(data.context),
      session: data.context?.sessionId || 'anonymous',
      result: data.result || 'pending',
      duration: data.duration || 0,
      error: data.error || null,
      metadata: {}
    };
    
    // Add validation results
    if (data.validation) {
      entry.validation = {
        passed: data.validation.valid,
        errors: data.validation.errors,
        warnings: data.validation.warnings
      };
    }
    
    // Add permission check results
    if (data.permission) {
      entry.permission = {
        allowed: data.permission.allowed,
        reason: data.permission.reason,
        level: data.permission.level
      };
    }
    
    // Add rate limit info
    if (data.rateLimit) {
      entry.rateLimit = {
        allowed: data.rateLimit.allowed,
        remaining: data.rateLimit.remaining,
        resetTime: data.rateLimit.resetTime
      };
    }
    
    // Add environment info if enabled
    if (this.options.includeEnv) {
      entry.environment = this.getEnvironmentInfo();
    }
    
    // Add system metrics if enabled
    if (this.options.includeSystemMetrics) {
      entry.system = this.getSystemMetrics();
    }
    
    // Add custom metadata
    if (data.metadata) {
      entry.metadata = { ...entry.metadata, ...data.metadata };
    }
    
    return entry;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Sanitize arguments for logging
   */
  sanitizeArgs(args) {
    if (!args) return [];
    
    return args.map(arg => {
      if (typeof arg === 'string') {
        // Check for sensitive patterns
        if (this.isSensitive(arg)) {
          return this.options.hashSensitive ? 
            this.hashSensitive(arg) : '[REDACTED]';
        }
        
        // Truncate long arguments
        if (arg.length > 200) {
          return arg.substring(0, 200) + '...';
        }
      }
      
      return arg;
    });
  }

  /**
   * Check if value is sensitive
   */
  isSensitive(value) {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /key/i,
      /secret/i,
      /auth/i,
      /credential/i,
      /api[-_]?key/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(value));
  }

  /**
   * Hash sensitive value
   */
  hashSensitive(value) {
    const hash = crypto.createHash('sha256');
    hash.update(value);
    return `SHA256:${hash.digest('hex').substring(0, 16)}`;
  }

  /**
   * Get user information
   */
  getUserInfo(context) {
    if (!context) return { id: 'anonymous', role: 'guest' };
    
    return {
      id: context.user?.id || context.user?.username || 'anonymous',
      role: context.user?.role || 'guest',
      ip: context.ip || null,
      userAgent: context.userAgent || null
    };
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    return {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      pid: process.pid
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    return {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      },
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Update statistics
   */
  updateStats(entry) {
    this.stats.totalLogged++;
    
    // By command
    const cmdCount = this.stats.byCommand.get(entry.command) || 0;
    this.stats.byCommand.set(entry.command, cmdCount + 1);
    
    // By user
    const userCount = this.stats.byUser.get(entry.user.id) || 0;
    this.stats.byUser.set(entry.user.id, userCount + 1);
    
    // By result
    if (entry.error) {
      this.stats.byResult.error++;
    } else if (entry.result === 'success') {
      this.stats.byResult.success++;
    } else if (entry.result === 'failure') {
      this.stats.byResult.failure++;
    }
  }

  /**
   * Flush buffer to file
   */
  async flush() {
    if (this.buffer.length === 0) return;
    
    try {
      // Check file size and rotate if needed
      await this.checkAndRotate();
      
      // Prepare entries
      const entries = this.buffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      // Append to file
      await fs.promises.appendFile(this.options.logFile, entries);
      
      // Clear buffer
      const flushedCount = this.buffer.length;
      this.buffer = [];
      
      logger.debug(`Flushed ${flushedCount} audit entries to ${this.options.logFile}`);
      
    } catch (error) {
      logger.error('Failed to flush audit log:', error);
      // Keep buffer for retry
    }
  }

  /**
   * Check file size and rotate if needed
   */
  async checkAndRotate() {
    try {
      const stats = await fs.promises.stat(this.options.logFile);
      
      if (stats.size >= this.options.maxFileSize) {
        await this.rotateLog();
      }
    } catch (error) {
      // File doesn't exist yet, that's okay
      if (error.code !== 'ENOENT') {
        logger.error('Error checking log file:', error);
      }
    }
  }

  /**
   * Rotate log files
   */
  async rotateLog() {
    logger.info('Rotating audit log file...');
    
    // Shift existing rotated files
    for (let i = this.options.rotationCount - 1; i > 0; i--) {
      const oldFile = `${this.options.logFile}.${i}`;
      const newFile = `${this.options.logFile}.${i + 1}`;
      
      try {
        await fs.promises.rename(oldFile, newFile);
      } catch (error) {
        // File might not exist
      }
    }
    
    // Rotate current file
    try {
      await fs.promises.rename(this.options.logFile, `${this.options.logFile}.1`);
      this.stats.rotations++;
      logger.info('Audit log rotated successfully');
    } catch (error) {
      logger.error('Failed to rotate audit log:', error);
    }
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    const dir = path.dirname(this.options.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Start flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.options.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Search audit log
   */
  async search(criteria = {}) {
    const results = [];
    
    try {
      // Read log file
      const content = await fs.promises.readFile(this.options.logFile, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          
          // Apply filters
          if (this.matchesCriteria(entry, criteria)) {
            results.push(entry);
          }
        } catch (error) {
          // Skip invalid JSON lines
        }
      }
      
      // Sort by timestamp descending
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply limit
      if (criteria.limit) {
        return results.slice(0, criteria.limit);
      }
      
    } catch (error) {
      logger.error('Failed to search audit log:', error);
    }
    
    return results;
  }

  /**
   * Check if entry matches search criteria
   */
  matchesCriteria(entry, criteria) {
    if (criteria.command && entry.command !== criteria.command) {
      return false;
    }
    
    if (criteria.user && entry.user.id !== criteria.user) {
      return false;
    }
    
    if (criteria.session && entry.session !== criteria.session) {
      return false;
    }
    
    if (criteria.result && entry.result !== criteria.result) {
      return false;
    }
    
    if (criteria.since) {
      const entryTime = new Date(entry.timestamp);
      const sinceTime = new Date(criteria.since);
      if (entryTime < sinceTime) {
        return false;
      }
    }
    
    if (criteria.until) {
      const entryTime = new Date(entry.timestamp);
      const untilTime = new Date(criteria.until);
      if (entryTime > untilTime) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get statistics
   */
  getStats() {
    const topCommands = Array.from(this.stats.byCommand.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cmd, count]) => ({ command: cmd, count }));
    
    const topUsers = Array.from(this.stats.byUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([user, count]) => ({ user, count }));
    
    return {
      totalLogged: this.stats.totalLogged,
      buffered: this.buffer.length,
      rotations: this.stats.rotations,
      byResult: this.stats.byResult,
      topCommands,
      topUsers
    };
  }

  /**
   * Generate report
   */
  async generateReport(options = {}) {
    const { since, until, format = 'json' } = options;
    
    // Search for entries
    const entries = await this.search({ since, until });
    
    // Calculate statistics
    const stats = {
      totalCommands: entries.length,
      uniqueUsers: new Set(entries.map(e => e.user.id)).size,
      uniqueCommands: new Set(entries.map(e => e.command)).size,
      successRate: entries.length > 0 ?
        (entries.filter(e => e.result === 'success').length / entries.length * 100).toFixed(2) + '%' : '0%',
      averageDuration: entries.length > 0 ?
        (entries.reduce((sum, e) => sum + (e.duration || 0), 0) / entries.length).toFixed(2) + 'ms' : '0ms'
    };
    
    // Group by command
    const byCommand = {};
    for (const entry of entries) {
      if (!byCommand[entry.command]) {
        byCommand[entry.command] = {
          count: 0,
          success: 0,
          failure: 0,
          error: 0,
          totalDuration: 0
        };
      }
      
      byCommand[entry.command].count++;
      if (entry.result === 'success') byCommand[entry.command].success++;
      if (entry.result === 'failure') byCommand[entry.command].failure++;
      if (entry.error) byCommand[entry.command].error++;
      byCommand[entry.command].totalDuration += entry.duration || 0;
    }
    
    // Calculate averages
    for (const cmd in byCommand) {
      const data = byCommand[cmd];
      data.averageDuration = data.count > 0 ?
        (data.totalDuration / data.count).toFixed(2) + 'ms' : '0ms';
      data.successRate = data.count > 0 ?
        (data.success / data.count * 100).toFixed(2) + '%' : '0%';
    }
    
    const report = {
      period: {
        since: since || entries[entries.length - 1]?.timestamp,
        until: until || entries[0]?.timestamp
      },
      stats,
      byCommand,
      recentErrors: entries.filter(e => e.error).slice(0, 10)
    };
    
    if (format === 'markdown') {
      return this.formatReportAsMarkdown(report);
    }
    
    return report;
  }

  /**
   * Format report as markdown
   */
  formatReportAsMarkdown(report) {
    let md = '# Command Audit Report\n\n';
    
    md += `## Period\n`;
    md += `- From: ${report.period.since}\n`;
    md += `- To: ${report.period.until}\n\n`;
    
    md += `## Summary\n`;
    md += `- Total Commands: ${report.stats.totalCommands}\n`;
    md += `- Unique Users: ${report.stats.uniqueUsers}\n`;
    md += `- Unique Commands: ${report.stats.uniqueCommands}\n`;
    md += `- Success Rate: ${report.stats.successRate}\n`;
    md += `- Average Duration: ${report.stats.averageDuration}\n\n`;
    
    md += `## Command Statistics\n\n`;
    md += '| Command | Count | Success Rate | Avg Duration |\n';
    md += '|---------|-------|--------------|---------------|\n';
    
    for (const [cmd, data] of Object.entries(report.byCommand)) {
      md += `| ${cmd} | ${data.count} | ${data.successRate} | ${data.averageDuration} |\n`;
    }
    
    if (report.recentErrors.length > 0) {
      md += `\n## Recent Errors\n\n`;
      for (const error of report.recentErrors) {
        md += `- **${error.command}** at ${error.timestamp}: ${error.error}\n`;
      }
    }
    
    return md;
  }

  /**
   * Cleanup and close
   */
  async close() {
    // Flush remaining entries
    await this.flush();
    
    // Stop timer
    this.stopFlushTimer();
    
    logger.info('Audit logger closed');
  }
}

module.exports = CommandAuditLogger;