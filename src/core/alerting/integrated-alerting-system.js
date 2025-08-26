/**
 * BUMBA Integrated Alerting System
 * Unifies Alert Manager, Notification System, and Threshold Monitor
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { alertManager } = require('./alert-manager');
const { getInstance: getNotificationSystem } = require('./notification-system');
const { getInstance: getThresholdMonitor } = require('./threshold-monitor');

class IntegratedAlertingSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      autoStart: config.autoStart !== false,
      notificationChannels: config.notificationChannels || {},
      thresholdConfig: config.thresholdConfig || {},
      alertToNotification: config.alertToNotification !== false,
      healthIntegration: config.healthIntegration !== false,
      ...config
    };
    
    // Component instances
    this.alertManager = alertManager;
    this.notificationSystem = null;
    this.thresholdMonitor = null;
    this.healthMonitor = null;
    
    // Integration state
    this.initialized = false;
    this.connections = new Map();
    
    // Statistics
    this.stats = {
      alertsProcessed: 0,
      notificationsSent: 0,
      thresholdsTriggered: 0,
      integrationErrors: 0
    };
    
    // Initialize if auto-start
    if (this.config.autoStart) {
      this.initialize();
    }
  }
  
  /**
   * Initialize integrated alerting system
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize Notification System
      this.notificationSystem = getNotificationSystem({
        channels: this.config.notificationChannels,
        ...this.config.notificationConfig
      });
      
      // Initialize Threshold Monitor
      this.thresholdMonitor = getThresholdMonitor(this.config.thresholdConfig);
      
      // Setup integrations
      await this.setupAlertToNotification();
      await this.setupThresholdToAlert();
      await this.setupHealthIntegration();
      
      // Setup custom integrations
      await this.setupCustomIntegrations();
      
      // Start monitoring
      if (this.config.autoStart) {
        this.thresholdMonitor.startMonitoring();
      }
      
      this.initialized = true;
      
      logger.info('🔄 Integrated Alerting System initialized');
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Integrated Alerting System:', error);
      this.emit('initialization:error', error);
      throw error;
    }
  }
  
  /**
   * Setup Alert Manager to Notification System integration
   */
  async setupAlertToNotification() {
    if (!this.config.alertToNotification) {
      return;
    }
    
    // Listen for new alerts
    this.alertManager.on('alert-created', async (alert) => {
      try {
        // Map alert severity to notification channels
        const channels = this.getNotificationChannels(alert.severity);
        
        // Send notification
        const notification = await this.notificationSystem.send({
          title: `Alert: ${alert.type}`,
          message: alert.message,
          severity: alert.severity,
          channels,
          data: {
            alertId: alert.id,
            ...alert.data
          },
          template: this.getAlertTemplate(alert.severity)
        });
        
        this.stats.notificationsSent++;
        
        // Track connection
        this.connections.set(`alert_${alert.id}`, {
          type: 'alert-to-notification',
          alertId: alert.id,
          notificationId: notification.id,
          timestamp: new Date().toISOString()
        });
        
        this.emit('alert:notified', { alert, notification });
        
      } catch (error) {
        this.stats.integrationErrors++;
        logger.error('Failed to send notification for alert:', error);
        this.emit('integration:error', { type: 'alert-to-notification', error });
      }
    });
    
    // Listen for acknowledgments
    this.alertManager.on('alert-acknowledged', async (alert) => {
      try {
        // Send acknowledgment notification
        await this.notificationSystem.send({
          title: 'Alert Acknowledged',
          message: `Alert "${alert.type}" acknowledged by ${alert.acknowledgedBy}`,
          severity: 'info',
          channels: ['webhook'],
          data: {
            alertId: alert.id,
            acknowledgedBy: alert.acknowledgedBy,
            acknowledgedAt: alert.acknowledgedAt
          }
        });
        
      } catch (error) {
        logger.debug('Failed to send acknowledgment notification:', error);
      }
    });
    
    logger.info('🏁 Alert to Notification integration established');
  }
  
  /**
   * Setup Threshold Monitor to Alert Manager integration
   */
  async setupThresholdToAlert() {
    // Threshold exceeded creates alert (already handled in threshold-monitor.js)
    // But we add additional processing here
    
    this.thresholdMonitor.on('threshold:exceeded', (data) => {
      this.stats.thresholdsTriggered++;
      
      // Track threshold alert
      this.connections.set(`threshold_${data.threshold.name}_${Date.now()}`, {
        type: 'threshold-to-alert',
        threshold: data.threshold.name,
        value: data.currentValue,
        timestamp: new Date().toISOString()
      });
      
      this.emit('threshold:alerted', data);
    });
    
    // Threshold recovery
    this.thresholdMonitor.on('threshold:recovered', async (threshold) => {
      try {
        // Send recovery notification
        await this.notificationSystem.send({
          title: 'Threshold Recovered',
          message: `Threshold "${threshold.name}" has returned to normal`,
          severity: 'info',
          channels: ['webhook', 'email'],
          data: {
            threshold: threshold.name,
            metric: threshold.metric,
            recoveredAt: new Date().toISOString()
          }
        });
        
      } catch (error) {
        logger.debug('Failed to send recovery notification:', error);
      }
    });
    
    logger.info('🏁 Threshold to Alert integration established');
  }
  
  /**
   * Setup Health Monitor integration
   */
  async setupHealthIntegration() {
    if (!this.config.healthIntegration) {
      return;
    }
    
    try {
      // Try to get Health Monitor instance
      const { getInstance } = require('../monitoring/health-monitor');
      this.healthMonitor = getInstance();
      
      // Listen for health alerts
      this.healthMonitor.on('health:alert', async (healthAlert) => {
        try {
          // Create system alert
          const alert = this.alertManager.alert(
            'system_health',
            healthAlert.message,
            {
              level: healthAlert.level,
              components: healthAlert.components
            },
            healthAlert.level === 'critical' ? 'critical' : 'high'
          );
          
          // Send notification for critical health issues
          if (healthAlert.level === 'critical') {
            await this.notificationSystem.send({
              title: 'System Health Critical',
              message: healthAlert.message,
              severity: 'critical',
              channels: ['email', 'webhook'],
              data: healthAlert
            });
          }
          
        } catch (error) {
          logger.error('Failed to process health alert:', error);
        }
      });
      
      // Monitor health metrics
      this.healthMonitor.on('health:update', (metrics) => {
        // Record health metrics for threshold monitoring
        this.thresholdMonitor.recordMetric('system.health.overall', metrics.overall * 100);
        
        for (const [component, data] of Object.entries(metrics.components)) {
          this.thresholdMonitor.recordMetric(
            `system.health.${component}`,
            data.health * 100
          );
        }
      });
      
      // Add health thresholds
      this.thresholdMonitor.addThreshold({
        name: 'system_health_critical',
        metric: 'system.health.overall',
        condition: 'less_than',
        value: 50, // Below 50% health
        severity: 'critical',
        message: 'System health is critically low',
        window: 60000
      });
      
      logger.info('🏁 Health Monitor integration established');
      
    } catch (error) {
      logger.warn('Health Monitor not available for integration');
    }
  }
  
  /**
   * Setup custom integrations
   */
  async setupCustomIntegrations() {
    // Setup performance monitoring integration
    this.setupPerformanceMonitoring();
    
    // Setup error tracking integration
    this.setupErrorTracking();
    
    // Setup API monitoring
    this.setupAPIMonitoring();
  }
  
  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Add performance thresholds
    this.thresholdMonitor.addThreshold({
      name: 'high_memory_usage',
      metric: 'system.memory.heapUsed',
      condition: 'greater_than',
      value: 1024 * 1024 * 1024, // 1GB
      severity: 'critical',
      message: 'Memory usage exceeds 1GB - potential memory leak',
      window: 60000
    });
    
    this.thresholdMonitor.addThreshold({
      name: 'event_loop_lag',
      metric: 'system.eventLoop.lag',
      condition: 'average_greater_than',
      value: 100, // 100ms average lag
      severity: 'high',
      message: 'Event loop lag detected - performance degradation',
      window: 30000
    });
  }
  
  /**
   * Setup error tracking
   */
  setupErrorTracking() {
    let errorCount = 0;
    let lastErrorReset = Date.now();
    
    // Track uncaught exceptions
    process.on('uncaughtException', (error) => {
      errorCount++;
      
      // Record error metric
      this.thresholdMonitor.recordMetric('app.errors.count', errorCount);
      
      // Create critical alert
      this.alertManager.alert(
        'uncaught_exception',
        `Uncaught exception: ${error.message}`,
        {
          stack: error.stack,
          errorCount
        },
        'critical'
      );
    });
    
    // Track unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      errorCount++;
      
      // Record error metric
      this.thresholdMonitor.recordMetric('app.errors.count', errorCount);
      
      // Create high severity alert
      this.alertManager.alert(
        'unhandled_rejection',
        `Unhandled promise rejection: ${reason}`,
        {
          reason,
          errorCount
        },
        'high'
      );
    });
    
    // Reset error count periodically
    setInterval(() => {
      if (Date.now() - lastErrorReset > 60000) { // Every minute
        errorCount = 0;
        lastErrorReset = Date.now();
      }
    }, 10000);
  }
  
  /**
   * Setup API monitoring
   */
  setupAPIMonitoring() {
    // Add API response time threshold
    this.thresholdMonitor.addThreshold({
      name: 'api_response_slow',
      metric: 'api.response.time',
      condition: 'average_greater_than',
      value: 2000, // 2 seconds
      severity: 'medium',
      message: 'API response times are slow',
      window: 120000 // 2 minutes
    });
    
    // Add API error rate threshold
    this.thresholdMonitor.addThreshold({
      name: 'api_error_rate',
      metric: 'api.errors.rate',
      condition: 'rate_greater_than',
      value: 5, // 5 errors per minute
      severity: 'high',
      message: 'High API error rate detected',
      window: 60000
    });
  }
  
  /**
   * Get notification channels based on severity
   */
  getNotificationChannels(severity) {
    const channelMap = {
      critical: ['email', 'sms', 'webhook'],
      high: ['email', 'webhook'],
      medium: ['webhook'],
      low: ['webhook'],
      info: ['webhook']
    };
    
    return channelMap[severity] || ['webhook'];
  }
  
  /**
   * Get alert template based on severity
   */
  getAlertTemplate(severity) {
    const templates = {
      critical: 'error',
      high: 'alert',
      medium: 'warning',
      low: 'info',
      info: 'info'
    };
    
    return templates[severity];
  }
  
  /**
   * Create custom alert with full integration
   */
  async createAlert(type, message, data = {}, severity = 'medium', options = {}) {
    try {
      // Create alert
      const alert = this.alertManager.alert(type, message, data, severity);
      
      if (!alert) {
        return null; // Duplicate alert
      }
      
      this.stats.alertsProcessed++;
      
      // Send notification if specified
      if (options.notify !== false) {
        const channels = options.channels || this.getNotificationChannels(severity);
        
        const notification = await this.notificationSystem.send({
          title: options.title || `Alert: ${type}`,
          message,
          severity,
          channels,
          data: {
            alertId: alert.id,
            ...data
          },
          template: options.template || this.getAlertTemplate(severity)
        });
        
        return { alert, notification };
      }
      
      return { alert };
      
    } catch (error) {
      this.stats.integrationErrors++;
      logger.error('Failed to create integrated alert:', error);
      throw error;
    }
  }
  
  /**
   * Record metric and check thresholds
   */
  recordMetric(name, value) {
    this.thresholdMonitor.recordMetric(name, value);
  }
  
  /**
   * Configure notification channel
   */
  configureNotificationChannel(channel, config) {
    this.notificationSystem.configureChannel(channel, config);
  }
  
  /**
   * Add custom threshold
   */
  addThreshold(threshold) {
    return this.thresholdMonitor.addThreshold(threshold);
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      components: {
        alertManager: {
          alerts: this.alertManager.getSummary()
        },
        notificationSystem: {
          stats: this.notificationSystem.getStats()
        },
        thresholdMonitor: {
          stats: this.thresholdMonitor.getStats(),
          thresholds: this.thresholdMonitor.getAllThresholdStatuses()
        }
      },
      integrations: {
        alertToNotification: this.config.alertToNotification,
        healthIntegration: this.config.healthIntegration,
        connections: this.connections.size
      },
      statistics: this.stats
    };
  }
  
  /**
   * Get detailed statistics
   */
  getDetailedStats() {
    return {
      alerts: this.alertManager.getSummary(),
      notifications: this.notificationSystem.getStats(),
      thresholds: this.thresholdMonitor.getStats(),
      integration: this.stats,
      connections: Array.from(this.connections.values()).slice(-100) // Last 100 connections
    };
  }
  
  /**
   * Test integration
   */
  async testIntegration() {
    const results = {
      components: {},
      integrations: {},
      overall: true
    };
    
    try {
      // Test Alert Manager
      const testAlert = this.alertManager.alert(
        'test',
        'Integration test alert',
        { test: true },
        'low'
      );
      results.components.alertManager = !!testAlert;
      
      // Test Notification System
      const testNotification = await this.notificationSystem.send({
        title: 'Test Notification',
        message: 'Integration test',
        severity: 'info',
        channels: ['webhook']
      });
      results.components.notificationSystem = !!testNotification;
      
      // Test Threshold Monitor
      this.thresholdMonitor.recordMetric('test.metric', 100);
      results.components.thresholdMonitor = true;
      
      // Test integrations
      results.integrations.alertToNotification = this.config.alertToNotification;
      results.integrations.healthIntegration = !!this.healthMonitor;
      
      // Overall result
      results.overall = Object.values(results.components).every(v => v === true);
      
    } catch (error) {
      results.error = error.message;
      results.overall = false;
    }
    
    return results;
  }
  
  /**
   * Shutdown integrated system
   */
  async shutdown() {
    try {
      // Stop threshold monitoring
      this.thresholdMonitor.stopMonitoring();
      
      // Clear notification queue
      this.notificationSystem.clearQueue();
      
      // Clear connections
      this.connections.clear();
      
      this.initialized = false;
      
      logger.info('🔄 Integrated Alerting System shutdown');
      this.emit('shutdown');
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  IntegratedAlertingSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new IntegratedAlertingSystem(config);
    }
    return instance;
  },
  
  // Convenience methods
  alert: async (type, message, data, severity, options) => {
    const system = module.exports.getInstance();
    if (!system.initialized) {
      await system.initialize();
    }
    return system.createAlert(type, message, data, severity, options);
  },
  
  recordMetric: (name, value) => {
    const system = module.exports.getInstance();
    if (!system.initialized) {
      system.initialize();
    }
    return system.recordMetric(name, value);
  }
};