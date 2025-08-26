/**
 * BUMBA Alert Dashboard
 * Comprehensive monitoring and management interface for the alerting system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const chalk = require('chalk');

class AlertDashboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      refreshInterval: config.refreshInterval || 5000,
      maxHistorySize: config.maxHistorySize || 100,
      autoRefresh: config.autoRefresh !== false,
      ...config
    };
    
    // Component references
    this.alertManager = null;
    this.notificationSystem = null;
    this.thresholdMonitor = null;
    this.rulesEngine = null;
    this.integratedSystem = null;
    
    // Dashboard data
    this.data = {
      alerts: [],
      notifications: [],
      thresholds: [],
      rules: [],
      metrics: {},
      health: {}
    };
    
    // History tracking
    this.history = {
      alerts: [],
      notifications: [],
      events: []
    };
    
    // Refresh state
    this.refreshInterval = null;
    this.lastRefresh = null;
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize dashboard
   */
  async initialize() {
    try {
      // Connect to components
      await this.connectComponents();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial data fetch
      await this.refresh();
      
      // Start auto-refresh if enabled
      if (this.config.autoRefresh) {
        this.startAutoRefresh();
      }
      
      logger.info('📊 Alert Dashboard initialized');
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Alert Dashboard:', error);
      throw error;
    }
  }
  
  /**
   * Connect to alerting components
   */
  async connectComponents() {
    try {
      // Alert Manager
      const { alertManager } = require('./alert-manager');
      this.alertManager = alertManager;
      
      // Notification System
      const { getInstance: getNotificationSystem } = require('./notification-system');
      this.notificationSystem = getNotificationSystem();
      
      // Threshold Monitor
      const { getInstance: getThresholdMonitor } = require('./threshold-monitor');
      this.thresholdMonitor = getThresholdMonitor();
      
      // Rules Engine
      const { getInstance: getRulesEngine } = require('./alert-rules-engine');
      this.rulesEngine = getRulesEngine();
      
      // Integrated System
      const { getInstance: getIntegratedSystem } = require('./integrated-alerting-system');
      this.integratedSystem = getIntegratedSystem();
      
    } catch (error) {
      logger.warn('Some components not available:', error.message);
    }
  }
  
  /**
   * Setup event listeners for real-time updates
   */
  setupEventListeners() {
    // Alert events
    if (this.alertManager) {
      this.alertManager.on('alert-created', (alert) => {
        this.addToHistory('alert', alert);
        this.emit('update:alert', alert);
      });
      
      this.alertManager.on('alert-acknowledged', (alert) => {
        this.addToHistory('event', {
          type: 'alert_acknowledged',
          alert: alert.id,
          by: alert.acknowledgedBy
        });
      });
    }
    
    // Notification events
    if (this.notificationSystem) {
      this.notificationSystem.on('notification:sent', (notification) => {
        this.addToHistory('notification', notification);
        this.emit('update:notification', notification);
      });
    }
    
    // Threshold events
    if (this.thresholdMonitor) {
      this.thresholdMonitor.on('threshold:exceeded', (data) => {
        this.addToHistory('event', {
          type: 'threshold_exceeded',
          threshold: data.threshold.name,
          value: data.currentValue
        });
      });
    }
    
    // Rule events
    if (this.rulesEngine) {
      this.rulesEngine.on('rule:triggered', (data) => {
        this.addToHistory('event', {
          type: 'rule_triggered',
          rule: data.rule.name,
          alert: data.alert.id
        });
      });
    }
  }
  
  /**
   * Refresh dashboard data
   */
  async refresh() {
    try {
      const data = {};
      
      // Get alert data
      if (this.alertManager) {
        data.alerts = {
          summary: this.alertManager.getSummary(),
          recent: this.alertManager.getAlerts({ 
            since: Date.now() - 3600000 // Last hour
          }).slice(-10),
          unacknowledged: this.alertManager.getAlerts({ 
            acknowledged: false 
          })
        };
      }
      
      // Get notification data
      if (this.notificationSystem) {
        data.notifications = {
          stats: this.notificationSystem.getStats(),
          history: this.notificationSystem.getHistory({ 
            since: Date.now() - 3600000 
          }).slice(-10)
        };
      }
      
      // Get threshold data
      if (this.thresholdMonitor) {
        data.thresholds = {
          stats: this.thresholdMonitor.getStats(),
          statuses: this.thresholdMonitor.getAllThresholdStatuses()
        };
      }
      
      // Get rules data
      if (this.rulesEngine) {
        data.rules = {
          stats: this.rulesEngine.getStats(),
          rules: this.rulesEngine.getAllRuleStats()
        };
      }
      
      // Get integrated system status
      if (this.integratedSystem && this.integratedSystem.initialized) {
        data.integrated = this.integratedSystem.getStatus();
      }
      
      // Get system metrics
      data.metrics = this.getSystemMetrics();
      
      // Update dashboard data
      this.data = data;
      this.lastRefresh = new Date().toISOString();
      
      this.emit('refreshed', this.data);
      
      return this.data;
      
    } catch (error) {
      logger.error('Failed to refresh dashboard:', error);
      throw error;
    }
  }
  
  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
      },
      uptime: this.formatUptime(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Display dashboard in console
   */
  display() {
    console.clear();
    console.log(chalk.bold.cyan('═'.repeat(80)));
    console.log(chalk.bold.cyan('                     BUMBA ALERT DASHBOARD'));
    console.log(chalk.bold.cyan('═'.repeat(80)));
    console.log(chalk.gray(`Last refresh: ${this.lastRefresh || 'Never'}`));
    console.log();
    
    // Alert Summary
    if (this.data.alerts) {
      this.displayAlertSummary();
    }
    
    // Active Thresholds
    if (this.data.thresholds) {
      this.displayThresholds();
    }
    
    // Notification Statistics
    if (this.data.notifications) {
      this.displayNotificationStats();
    }
    
    // Active Rules
    if (this.data.rules) {
      this.displayRules();
    }
    
    // Recent Activity
    this.displayRecentActivity();
    
    // System Metrics
    this.displaySystemMetrics();
    
    console.log(chalk.bold.cyan('═'.repeat(80)));
  }
  
  /**
   * Display alert summary
   */
  displayAlertSummary() {
    const summary = this.data.alerts.summary;
    
    console.log(chalk.bold.yellow('📢 ALERT SUMMARY'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const alertTable = new Table({
      head: ['Metric', 'Value'],
      colWidths: [20, 20],
      style: { head: ['cyan'] }
    });
    
    alertTable.push(
      ['Total Alerts', summary.total],
      ['Last Hour', summary.lastHour],
      ['Last 24 Hours', summary.last24Hours],
      ['Unacknowledged', chalk.red(summary.unacknowledged)]
    );
    
    // Add severity breakdown
    if (summary.bySeverity) {
      Object.entries(summary.bySeverity).forEach(([severity, count]) => {
        const color = this.getSeverityColor(severity);
        alertTable.push([`  ${severity}`, color(count)]);
      });
    }
    
    console.log(alertTable.toString());
    console.log();
  }
  
  /**
   * Display threshold statuses
   */
  displayThresholds() {
    const thresholds = this.data.thresholds.statuses;
    
    console.log(chalk.bold.yellow('📊 ACTIVE THRESHOLDS'));
    console.log(chalk.gray('─'.repeat(40)));
    
    if (thresholds.length === 0) {
      console.log(chalk.gray('No thresholds configured'));
    } else {
      const thresholdTable = new Table({
        head: ['Name', 'Metric', 'Current', 'Threshold', 'Status'],
        colWidths: [20, 25, 12, 12, 10],
        style: { head: ['cyan'] }
      });
      
      thresholds.forEach(threshold => {
        const statusColor = threshold.triggered ? chalk.red : chalk.green;
        const status = threshold.triggered ? 'TRIGGERED' : 'OK';
        
        thresholdTable.push([
          threshold.name,
          threshold.metric,
          threshold.currentValue || 'N/A',
          threshold.thresholdValue,
          statusColor(status)
        ]);
      });
      
      console.log(thresholdTable.toString());
    }
    console.log();
  }
  
  /**
   * Display notification statistics
   */
  displayNotificationStats() {
    const stats = this.data.notifications.stats;
    
    console.log(chalk.bold.yellow('📨 NOTIFICATION STATISTICS'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const notifTable = new Table({
      head: ['Channel', 'Enabled', 'Sent'],
      colWidths: [15, 10, 10],
      style: { head: ['cyan'] }
    });
    
    if (stats.channels) {
      stats.channels.forEach(channel => {
        const enabledColor = channel.enabled ? chalk.green : chalk.gray;
        notifTable.push([
          channel.name,
          enabledColor(channel.enabled ? 'Yes' : 'No'),
          channel.sent
        ]);
      });
    }
    
    notifTable.push(
      [chalk.bold('Total'), '', chalk.bold(stats.sent)],
      ['Failed', '', chalk.red(stats.failed)],
      ['Queued', '', chalk.yellow(stats.queueLength)]
    );
    
    console.log(notifTable.toString());
    console.log();
  }
  
  /**
   * Display active rules
   */
  displayRules() {
    const rules = this.data.rules.rules;
    const stats = this.data.rules.stats;
    
    console.log(chalk.bold.yellow('🟢️ ALERT RULES'));
    console.log(chalk.gray('─'.repeat(40)));
    
    console.log(`Rules: ${stats.rulesEnabled}/${stats.rulesConfigured} enabled`);
    console.log(`Evaluations: ${stats.rulesEvaluated} | Triggered: ${stats.rulesTriggered}`);
    console.log(`Actions: ${stats.actionsExecuted} | Errors: ${chalk.red(stats.errors)}`);
    
    if (rules && rules.length > 0) {
      console.log('\nTop Triggered Rules:');
      const topRules = rules
        .filter(r => r.triggerCount > 0)
        .sort((a, b) => b.triggerCount - a.triggerCount)
        .slice(0, 5);
      
      topRules.forEach(rule => {
        const status = rule.enabled ? chalk.green('●') : chalk.gray('○');
        console.log(`  ${status} ${rule.name}: ${rule.triggerCount} triggers`);
      });
    }
    console.log();
  }
  
  /**
   * Display recent activity
   */
  displayRecentActivity() {
    console.log(chalk.bold.yellow('🕐 RECENT ACTIVITY'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const recentEvents = this.history.events.slice(-5);
    
    if (recentEvents.length === 0) {
      console.log(chalk.gray('No recent activity'));
    } else {
      recentEvents.forEach(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        const icon = this.getEventIcon(event.type);
        console.log(`${chalk.gray(time)} ${icon} ${event.type}: ${JSON.stringify(event.data || {})}`);
      });
    }
    console.log();
  }
  
  /**
   * Display system metrics
   */
  displaySystemMetrics() {
    const metrics = this.data.metrics;
    
    console.log(chalk.bold.yellow('💻 SYSTEM METRICS'));
    console.log(chalk.gray('─'.repeat(40)));
    
    if (metrics) {
      console.log(`Memory: ${metrics.memory.heapUsed} / ${metrics.memory.heapTotal} (RSS: ${metrics.memory.rss})`);
      console.log(`Uptime: ${metrics.uptime}`);
    }
  }
  
  /**
   * Get severity color
   */
  getSeverityColor(severity) {
    const colors = {
      critical: chalk.red,
      high: chalk.yellow,
      medium: chalk.blue,
      low: chalk.cyan,
      info: chalk.gray
    };
    return colors[severity] || chalk.white;
  }
  
  /**
   * Get event icon
   */
  getEventIcon(type) {
    const icons = {
      alert_created: '🔴',
      alert_acknowledged: '🏁',
      threshold_exceeded: '🟠️',
      rule_triggered: '🟢️',
      notification_sent: '📨'
    };
    return icons[type] || '•';
  }
  
  /**
   * Format uptime
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
  
  /**
   * Add to history
   */
  addToHistory(type, data) {
    const entry = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (type === 'alert') {
      this.history.alerts.push(entry);
      if (this.history.alerts.length > this.config.maxHistorySize) {
        this.history.alerts.shift();
      }
    } else if (type === 'notification') {
      this.history.notifications.push(entry);
      if (this.history.notifications.length > this.config.maxHistorySize) {
        this.history.notifications.shift();
      }
    } else {
      this.history.events.push(entry);
      if (this.history.events.length > this.config.maxHistorySize) {
        this.history.events.shift();
      }
    }
  }
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (this.refreshInterval) {
      return;
    }
    
    this.refreshInterval = setInterval(async () => {
      await this.refresh();
      if (this.config.displayOnRefresh) {
        this.display();
      }
    }, this.config.refreshInterval);
    
    logger.info('📊 Dashboard auto-refresh started');
  }
  
  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    logger.info('📊 Dashboard auto-refresh stopped');
  }
  
  /**
   * Get dashboard summary
   */
  getSummary() {
    return {
      alerts: this.data.alerts?.summary || {},
      notifications: {
        sent: this.data.notifications?.stats?.sent || 0,
        failed: this.data.notifications?.stats?.failed || 0
      },
      thresholds: {
        total: this.data.thresholds?.statuses?.length || 0,
        triggered: this.data.thresholds?.statuses?.filter(t => t.triggered).length || 0
      },
      rules: {
        enabled: this.data.rules?.stats?.rulesEnabled || 0,
        triggered: this.data.rules?.stats?.rulesTriggered || 0
      },
      lastRefresh: this.lastRefresh
    };
  }
  
  /**
   * Export dashboard data
   */
  exportData(format = 'json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      data: this.data,
      history: this.history,
      summary: this.getSummary()
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      // Simplified CSV export
      const csv = [];
      csv.push('Metric,Value');
      csv.push(`Total Alerts,${this.data.alerts?.summary?.total || 0}`);
      csv.push(`Unacknowledged,${this.data.alerts?.summary?.unacknowledged || 0}`);
      csv.push(`Notifications Sent,${this.data.notifications?.stats?.sent || 0}`);
      csv.push(`Thresholds Triggered,${this.data.thresholds?.statuses?.filter(t => t.triggered).length || 0}`);
      csv.push(`Rules Triggered,${this.data.rules?.stats?.rulesTriggered || 0}`);
      return csv.join('\n');
    }
    
    return exportData;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  AlertDashboard,
  getInstance: (config) => {
    if (!instance) {
      instance = new AlertDashboard(config);
    }
    return instance;
  },
  
  // Quick display method
  show: async () => {
    const dashboard = module.exports.getInstance();
    await dashboard.refresh();
    dashboard.display();
    return dashboard;
  }
};