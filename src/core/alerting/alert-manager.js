/**
 * BUMBA Alert Management System
 * Manages alerts from various sources and provides notification mechanisms
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AlertManager extends EventEmitter {
  constructor() {
    super();
    this.alerts = [];
    this.channels = new Map();
    this.config = {
      maxAlerts: 500,
      alertRetention: 86400000, // 24 hours
      deduplicationWindow: 300000, // 5 minutes
      channels: {
        console: true,
        file: true,
        system: true,
      },
      severity: {
        critical: { color: 'red', priority: 1 },
        high: { color: 'orange', priority: 2 },
        medium: { color: 'yellow', priority: 3 },
        low: { color: 'blue', priority: 4 },
        info: { color: 'gray', priority: 5 },
      },
    };
    
    this.initializeChannels();
  }

  /**
   * Initialize alert channels
   */
  initializeChannels() {
    // Console channel
    if (this.config.channels.console) {
      this.channels.set('console', new ConsoleAlertChannel());
    }
    
    // File channel
    if (this.config.channels.file) {
      this.channels.set('file', new FileAlertChannel());
    }
    
    // System notification channel
    if (this.config.channels.system) {
      this.channels.set('system', new SystemAlertChannel());
    }
  }

  /**
   * Create and send an alert
   */
  alert(type, message, data = {}, severity = 'medium') {
    const alert = {
      id: this.generateAlertId(),
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      data,
      acknowledged: false,
    };
    
    // Check for duplicate alerts
    if (this.isDuplicate(alert)) {
      return null;
    }
    
    // Add to alerts array
    this.alerts.push(alert);
    
    // Send to channels
    this.sendToChannels(alert);
    
    // Emit alert event
    this.emit('alert-created', alert);
    
    // Cleanup old alerts
    this.cleanupOldAlerts();
    
    // Trim alerts if needed
    if (this.alerts.length > this.config.maxAlerts) {
      this.alerts = this.alerts.slice(-this.config.maxAlerts);
    }
    
    return alert;
  }

  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if alert is duplicate
   */
  isDuplicate(alert) {
    const cutoff = Date.now() - this.config.deduplicationWindow;
    
    return this.alerts.some(existing => 
      existing.type === alert.type &&
      existing.message === alert.message &&
      new Date(existing.timestamp).getTime() > cutoff
    );
  }

  /**
   * Send alert to all configured channels
   */
  sendToChannels(alert) {
    for (const [name, channel] of this.channels) {
      try {
        channel.send(alert);
      } catch (error) {
        logger.error(`Failed to send alert to ${name} channel:`, error);
      }
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledge(alertId, acknowledgedBy = 'system') {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = acknowledgedBy;
      this.emit('alert-acknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Get alerts by filter
   */
  getAlerts(filter = {}) {
    let filtered = [...this.alerts];
    
    if (filter.severity) {
      filtered = filtered.filter(a => a.severity === filter.severity);
    }
    
    if (filter.type) {
      filtered = filtered.filter(a => a.type === filter.type);
    }
    
    if (filter.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filter.acknowledged);
    }
    
    if (filter.since) {
      filtered = filtered.filter(a => 
        new Date(a.timestamp).getTime() > filter.since
      );
    }
    
    return filtered;
  }

  /**
   * Get alert summary
   */
  getSummary() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;
    
    const recentAlerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > hourAgo
    );
    
    const dailyAlerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > dayAgo
    );
    
    const bySeverity = {};
    const byType = {};
    
    dailyAlerts.forEach(alert => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });
    
    return {
      total: this.alerts.length,
      lastHour: recentAlerts.length,
      last24Hours: dailyAlerts.length,
      unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
      bySeverity,
      byType,
    };
  }

  /**
   * Clean up old alerts
   */
  cleanupOldAlerts() {
    const cutoff = Date.now() - this.config.alertRetention;
    this.alerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > cutoff
    );
  }

  /**
   * Clear all alerts
   */
  clear() {
    this.alerts = [];
    this.emit('alerts-cleared');
  }
}

/**
 * Console Alert Channel
 */
class ConsoleAlertChannel {
  send(alert) {
    const chalk = require('chalk');
    const colors = {
      critical: chalk.red,
      high: chalk.yellow,
      medium: chalk.blue,
      low: chalk.gray,
      info: chalk.dim,
    };
    
    const color = colors[alert.severity] || chalk.white;
    
    console.log(
      color.bold(`\n🔴 ALERT [${alert.severity.toUpperCase()}]: ${alert.type}`),
      color(`\n   ${alert.message}`),
      alert.data ? color.dim(`\n   Data: ${JSON.stringify(alert.data, null, 2)}`) : '',
      color.dim(`\n   Time: ${alert.timestamp}\n`)
    );
  }
}

/**
 * File Alert Channel
 */
class FileAlertChannel {
  constructor() {
    this.logDir = path.join(os.homedir(), '.bumba', 'alerts');
    this.ensureLogDir();
  }
  
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  send(alert) {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `alerts-${date}.log`);
    
    const logEntry = JSON.stringify({
      ...alert,
      humanTime: new Date(alert.timestamp).toLocaleString(),
    }) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  }
}

/**
 * System Alert Channel (Native notifications)
 */
class SystemAlertChannel {
  send(alert) {
    // Only send critical and high severity alerts to system
    if (!['critical', 'high'].includes(alert.severity)) {
      return;
    }
    
    const title = `BUMBA Alert: ${alert.type}`;
    const message = alert.message;
    
    try {
      if (process.platform === 'darwin') {
        // macOS notification
        require('child_process').execSync(
          `osascript -e 'display notification "${message}" with title "${title}"'`
        );
      } else if (process.platform === 'linux') {
        // Linux notification (requires notify-send)
        require('child_process').execSync(
          `notify-send "${title}" "${message}"`
        );
      } else if (process.platform === 'win32') {
        // Windows notification (requires PowerShell)
        const script = `
          Add-Type -AssemblyName System.Windows.Forms
          $notification = New-Object System.Windows.Forms.NotifyIcon
          $notification.Icon = [System.Drawing.SystemIcons]::Warning
          $notification.BalloonTipTitle = "${title}"
          $notification.BalloonTipText = "${message}"
          $notification.Visible = $true
          $notification.ShowBalloonTip(5000)
        `;
        require('child_process').execSync(`powershell -Command "${script}"`);
      }
    } catch (error) {
      // System notifications are optional, don't fail if they don't work
      logger.debug('Failed to send system notification:', error.message);
    }
  }
}

// Singleton instance
const alertManager = new AlertManager();

module.exports = {
  AlertManager,
  alertManager,
};