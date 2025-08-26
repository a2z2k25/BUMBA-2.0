/**
 * Routing Monitor & Analytics
 * Comprehensive monitoring and analytics for TTL-based routing system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Metrics Collector
 */
class MetricsCollector {
  constructor(name, window = 60000) {
    this.name = name;
    this.window = window; // Time window in ms
    this.dataPoints = [];
    this.aggregates = {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0
    };
  }
  
  record(value, metadata = {}) {
    const point = {
      value,
      timestamp: Date.now(),
      metadata
    };
    
    this.dataPoints.push(point);
    this.cleanup();
    this.updateAggregates();
  }
  
  cleanup() {
    const cutoff = Date.now() - this.window;
    this.dataPoints = this.dataPoints.filter(p => p.timestamp > cutoff);
  }
  
  updateAggregates() {
    if (this.dataPoints.length === 0) {
      this.resetAggregates();
      return;
    }
    
    const values = this.dataPoints.map(p => p.value).sort((a, b) => a - b);
    
    this.aggregates.count = values.length;
    this.aggregates.sum = values.reduce((sum, v) => sum + v, 0);
    this.aggregates.min = values[0];
    this.aggregates.max = values[values.length - 1];
    this.aggregates.avg = this.aggregates.sum / this.aggregates.count;
    
    // Calculate percentiles
    this.aggregates.p50 = this.getPercentile(values, 50);
    this.aggregates.p75 = this.getPercentile(values, 75);
    this.aggregates.p90 = this.getPercentile(values, 90);
    this.aggregates.p95 = this.getPercentile(values, 95);
    this.aggregates.p99 = this.getPercentile(values, 99);
  }
  
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
  
  resetAggregates() {
    this.aggregates = {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0
    };
  }
  
  getMetrics() {
    this.cleanup();
    this.updateAggregates();
    return {
      name: this.name,
      window: this.window,
      dataPoints: this.dataPoints.length,
      aggregates: { ...this.aggregates }
    };
  }
}

/**
 * Alert Manager
 */
class AlertManager {
  constructor() {
    this.alerts = new Map();
    this.thresholds = new Map();
    this.cooldowns = new Map();
  }
  
  setThreshold(metric, condition, value, severity = 'warning') {
    this.thresholds.set(metric, {
      condition, // 'gt', 'lt', 'eq', 'gte', 'lte'
      value,
      severity,
      lastTriggered: 0
    });
  }
  
  checkThreshold(metric, currentValue) {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return null;
    
    // Check cooldown
    const cooldown = this.cooldowns.get(metric) || 0;
    if (Date.now() - threshold.lastTriggered < cooldown) {
      return null;
    }
    
    // Check condition
    let triggered = false;
    switch (threshold.condition) {
      case 'gt':
        triggered = currentValue > threshold.value;
        break;
      case 'lt':
        triggered = currentValue < threshold.value;
        break;
      case 'eq':
        triggered = currentValue === threshold.value;
        break;
      case 'gte':
        triggered = currentValue >= threshold.value;
        break;
      case 'lte':
        triggered = currentValue <= threshold.value;
        break;
    }
    
    if (triggered) {
      threshold.lastTriggered = Date.now();
      
      const alert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        metric,
        currentValue,
        threshold: threshold.value,
        condition: threshold.condition,
        severity: threshold.severity,
        timestamp: Date.now(),
        message: `${metric} ${threshold.condition} ${threshold.value} (current: ${currentValue})`
      };
      
      this.alerts.set(alert.id, alert);
      return alert;
    }
    
    return null;
  }
  
  setCooldown(metric, duration) {
    this.cooldowns.set(metric, duration);
  }
  
  getActiveAlerts() {
    return Array.from(this.alerts.values())
      .filter(a => Date.now() - a.timestamp < 300000) // 5 minutes
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  clearAlert(id) {
    return this.alerts.delete(id);
  }
  
  clearAllAlerts() {
    this.alerts.clear();
  }
}

/**
 * Dashboard Data Provider
 */
class DashboardProvider {
  constructor() {
    this.widgets = new Map();
    this.refreshInterval = 5000; // 5 seconds
    this.lastUpdate = Date.now();
  }
  
  registerWidget(name, dataProvider) {
    this.widgets.set(name, {
      name,
      dataProvider,
      data: null,
      lastRefresh: 0
    });
  }
  
  async refreshWidget(name) {
    const widget = this.widgets.get(name);
    if (!widget) return null;
    
    try {
      widget.data = await widget.dataProvider();
      widget.lastRefresh = Date.now();
      return widget.data;
    } catch (error) {
      logger.error(`Failed to refresh widget ${name}:`, error);
      return null;
    }
  }
  
  async refreshAll() {
    const promises = [];
    
    for (const name of this.widgets.keys()) {
      promises.push(this.refreshWidget(name));
    }
    
    await Promise.all(promises);
    this.lastUpdate = Date.now();
  }
  
  getDashboardData() {
    const data = {
      timestamp: this.lastUpdate,
      widgets: {}
    };
    
    for (const [name, widget] of this.widgets) {
      data.widgets[name] = {
        data: widget.data,
        lastRefresh: widget.lastRefresh
      };
    }
    
    return data;
  }
}

/**
 * Main Routing Monitor
 */
class RoutingMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Monitoring settings
      enableMetrics: config.enableMetrics !== false,
      enableAlerts: config.enableAlerts !== false,
      enableDashboard: config.enableDashboard !== false,
      
      // Collection intervals
      metricsInterval: config.metricsInterval || 1000,          // 1 second
      alertCheckInterval: config.alertCheckInterval || 5000,     // 5 seconds
      dashboardRefreshInterval: config.dashboardRefreshInterval || 10000, // 10 seconds
      
      // Retention settings
      metricsRetention: config.metricsRetention || 3600000,     // 1 hour
      eventRetention: config.eventRetention || 86400000,        // 24 hours
      
      // Alert settings
      alertCooldown: config.alertCooldown || 60000,             // 1 minute
      maxAlerts: config.maxAlerts || 100
    };
    
    // Metrics collectors
    this.metrics = {
      // Task metrics
      taskDuration: new MetricsCollector('task-duration', this.config.metricsRetention),
      taskSuccess: new MetricsCollector('task-success', this.config.metricsRetention),
      taskQueue: new MetricsCollector('task-queue', this.config.metricsRetention),
      
      // Routing metrics
      routingTime: new MetricsCollector('routing-time', this.config.metricsRetention),
      routingSuccess: new MetricsCollector('routing-success', this.config.metricsRetention),
      ttlCompliance: new MetricsCollector('ttl-compliance', this.config.metricsRetention),
      
      // Specialist metrics
      specialistLoad: new MetricsCollector('specialist-load', this.config.metricsRetention),
      specialistUtilization: new MetricsCollector('specialist-utilization', this.config.metricsRetention),
      poolSize: new MetricsCollector('pool-size', this.config.metricsRetention),
      
      // Performance metrics
      cacheHitRate: new MetricsCollector('cache-hit-rate', this.config.metricsRetention),
      optimizationTime: new MetricsCollector('optimization-time', this.config.metricsRetention),
      predictionAccuracy: new MetricsCollector('prediction-accuracy', this.config.metricsRetention)
    };
    
    // Alert manager
    this.alertManager = new AlertManager();
    
    // Dashboard provider
    this.dashboardProvider = new DashboardProvider();
    
    // Event history
    this.eventHistory = [];
    
    // Statistics
    this.statistics = {
      startTime: Date.now(),
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalRoutes: 0,
      successfulRoutes: 0,
      ttlViolations: 0,
      alertsTriggered: 0,
      eventsProcessed: 0
    };
    
    // Initialize monitoring
    this.initialize();
    
    logger.info('📊 Routing Monitor initialized');
  }
  
  /**
   * Initialize monitoring components
   */
  initialize() {
    // Set up default alert thresholds
    this.setupDefaultAlerts();
    
    // Register dashboard widgets
    this.registerDashboardWidgets();
    
    // Start monitoring processes
    this.startMonitoring();
  }
  
  /**
   * Set up default alert thresholds
   */
  setupDefaultAlerts() {
    if (!this.config.enableAlerts) return;
    
    // Task performance alerts
    this.alertManager.setThreshold('task-success-rate', 'lt', 0.8, 'warning');
    this.alertManager.setThreshold('task-success-rate', 'lt', 0.5, 'critical');
    this.alertManager.setThreshold('avg-task-duration', 'gt', 10000, 'warning');
    
    // TTL compliance alerts
    this.alertManager.setThreshold('ttl-compliance', 'lt', 0.9, 'warning');
    this.alertManager.setThreshold('ttl-violations', 'gt', 10, 'critical');
    
    // Resource utilization alerts
    this.alertManager.setThreshold('specialist-load', 'gt', 0.8, 'warning');
    this.alertManager.setThreshold('specialist-load', 'gt', 0.95, 'critical');
    this.alertManager.setThreshold('queue-size', 'gt', 100, 'warning');
    
    // Set cooldowns
    this.alertManager.setCooldown('task-success-rate', this.config.alertCooldown);
    this.alertManager.setCooldown('specialist-load', this.config.alertCooldown);
    this.alertManager.setCooldown('ttl-compliance', this.config.alertCooldown);
    
    logger.debug('Default alert thresholds configured');
  }
  
  /**
   * Register dashboard widgets
   */
  registerDashboardWidgets() {
    if (!this.config.enableDashboard) return;
    
    // Overview widget
    this.dashboardProvider.registerWidget('overview', () => ({
      uptime: Date.now() - this.statistics.startTime,
      totalTasks: this.statistics.totalTasks,
      completedTasks: this.statistics.completedTasks,
      failedTasks: this.statistics.failedTasks,
      successRate: this.statistics.totalTasks > 0 
        ? this.statistics.completedTasks / this.statistics.totalTasks 
        : 0
    }));
    
    // Performance widget
    this.dashboardProvider.registerWidget('performance', () => {
      const taskMetrics = this.metrics.taskDuration.getMetrics();
      const routingMetrics = this.metrics.routingTime.getMetrics();
      
      return {
        avgTaskDuration: taskMetrics.aggregates.avg,
        p95TaskDuration: taskMetrics.aggregates.p95,
        avgRoutingTime: routingMetrics.aggregates.avg,
        cacheHitRate: this.metrics.cacheHitRate.aggregates.avg
      };
    });
    
    // TTL Compliance widget
    this.dashboardProvider.registerWidget('ttl-compliance', () => ({
      complianceRate: this.metrics.ttlCompliance.aggregates.avg,
      violations: this.statistics.ttlViolations,
      recentViolations: this.eventHistory
        .filter(e => e.type === 'ttl-violation' && Date.now() - e.timestamp < 300000)
        .length
    }));
    
    // Resource utilization widget
    this.dashboardProvider.registerWidget('resources', () => ({
      avgSpecialistLoad: this.metrics.specialistLoad.aggregates.avg,
      peakSpecialistLoad: this.metrics.specialistLoad.aggregates.max,
      poolSize: this.metrics.poolSize.aggregates.avg,
      utilization: this.metrics.specialistUtilization.aggregates.avg
    }));
    
    // Alerts widget
    this.dashboardProvider.registerWidget('alerts', () => ({
      activeAlerts: this.alertManager.getActiveAlerts(),
      totalTriggered: this.statistics.alertsTriggered,
      recentAlerts: this.alertManager.getActiveAlerts().slice(0, 5)
    }));
    
    logger.debug('Dashboard widgets registered');
  }
  
  /**
   * Record task event
   */
  recordTaskEvent(event) {
    if (!this.config.enableMetrics) return;
    
    switch (event.type) {
      case 'task:started':
        this.statistics.totalTasks++;
        break;
      
      case 'task:completed':
        this.statistics.completedTasks++;
        this.metrics.taskDuration.record(event.duration, { taskId: event.taskId });
        this.metrics.taskSuccess.record(1, { taskId: event.taskId });
        break;
      
      case 'task:failed':
        this.statistics.failedTasks++;
        this.metrics.taskSuccess.record(0, { taskId: event.taskId });
        break;
      
      case 'task:queued':
        this.metrics.taskQueue.record(event.queueSize);
        break;
    }
    
    this.addEvent(event);
  }
  
  /**
   * Record routing event
   */
  recordRoutingEvent(event) {
    if (!this.config.enableMetrics) return;
    
    switch (event.type) {
      case 'route:created':
        this.statistics.totalRoutes++;
        this.metrics.routingTime.record(event.duration);
        break;
      
      case 'route:success':
        this.statistics.successfulRoutes++;
        this.metrics.routingSuccess.record(1);
        break;
      
      case 'route:failed':
        this.metrics.routingSuccess.record(0);
        break;
      
      case 'ttl:violated':
        this.statistics.ttlViolations++;
        this.metrics.ttlCompliance.record(0, { taskId: event.taskId });
        break;
      
      case 'ttl:met':
        this.metrics.ttlCompliance.record(1, { taskId: event.taskId });
        break;
    }
    
    this.addEvent(event);
  }
  
  /**
   * Record specialist event
   */
  recordSpecialistEvent(event) {
    if (!this.config.enableMetrics) return;
    
    switch (event.type) {
      case 'specialist:load':
        this.metrics.specialistLoad.record(event.load, { specialistId: event.specialistId });
        break;
      
      case 'specialist:utilization':
        this.metrics.specialistUtilization.record(event.utilization);
        break;
      
      case 'pool:size':
        this.metrics.poolSize.record(event.size);
        break;
    }
    
    this.addEvent(event);
  }
  
  /**
   * Record performance event
   */
  recordPerformanceEvent(event) {
    if (!this.config.enableMetrics) return;
    
    switch (event.type) {
      case 'cache:hit':
        this.metrics.cacheHitRate.record(1);
        break;
      
      case 'cache:miss':
        this.metrics.cacheHitRate.record(0);
        break;
      
      case 'optimization:time':
        this.metrics.optimizationTime.record(event.duration);
        break;
      
      case 'prediction:accuracy':
        this.metrics.predictionAccuracy.record(event.accuracy);
        break;
    }
    
    this.addEvent(event);
  }
  
  /**
   * Add event to history
   */
  addEvent(event) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };
    
    this.eventHistory.push(enrichedEvent);
    this.statistics.eventsProcessed++;
    
    // Trim history
    const cutoff = Date.now() - this.config.eventRetention;
    this.eventHistory = this.eventHistory.filter(e => e.timestamp > cutoff);
    
    // Emit for real-time monitoring
    this.emit('event', enrichedEvent);
  }
  
  /**
   * Check alerts
   */
  checkAlerts() {
    if (!this.config.enableAlerts) return;
    
    const checks = [
      {
        metric: 'task-success-rate',
        value: this.statistics.totalTasks > 0 
          ? this.statistics.completedTasks / this.statistics.totalTasks 
          : 1
      },
      {
        metric: 'avg-task-duration',
        value: this.metrics.taskDuration.aggregates.avg
      },
      {
        metric: 'ttl-compliance',
        value: this.metrics.ttlCompliance.aggregates.avg
      },
      {
        metric: 'specialist-load',
        value: this.metrics.specialistLoad.aggregates.avg
      },
      {
        metric: 'queue-size',
        value: this.metrics.taskQueue.aggregates.avg
      }
    ];
    
    for (const check of checks) {
      const alert = this.alertManager.checkThreshold(check.metric, check.value);
      
      if (alert) {
        this.statistics.alertsTriggered++;
        logger.warn(`Alert triggered: ${alert.message}`);
        
        this.emit('alert', alert);
      }
    }
  }
  
  /**
   * Start monitoring processes
   */
  startMonitoring() {
    // Metrics collection interval
    if (this.config.enableMetrics) {
      this.metricsInterval = setInterval(() => {
        this.collectMetrics();
      }, this.config.metricsInterval);
    }
    
    // Alert checking interval
    if (this.config.enableAlerts) {
      this.alertInterval = setInterval(() => {
        this.checkAlerts();
      }, this.config.alertCheckInterval);
    }
    
    // Dashboard refresh interval
    if (this.config.enableDashboard) {
      this.dashboardInterval = setInterval(async () => {
        await this.dashboardProvider.refreshAll();
      }, this.config.dashboardRefreshInterval);
    }
    
    logger.debug('Monitoring processes started');
  }
  
  /**
   * Stop monitoring processes
   */
  stopMonitoring() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
    }
    
    logger.debug('Monitoring processes stopped');
  }
  
  /**
   * Collect metrics (placeholder for actual integration)
   */
  collectMetrics() {
    // This would integrate with the actual routing system
    // For now, just maintain existing metrics
  }
  
  /**
   * Get monitor status
   */
  getStatus() {
    return {
      uptime: Date.now() - this.statistics.startTime,
      statistics: this.statistics,
      metrics: {
        taskDuration: this.metrics.taskDuration.getMetrics(),
        taskSuccess: this.metrics.taskSuccess.getMetrics(),
        routingTime: this.metrics.routingTime.getMetrics(),
        ttlCompliance: this.metrics.ttlCompliance.getMetrics(),
        specialistLoad: this.metrics.specialistLoad.getMetrics()
      },
      alerts: {
        active: this.alertManager.getActiveAlerts().length,
        total: this.statistics.alertsTriggered
      },
      events: {
        total: this.statistics.eventsProcessed,
        recent: this.eventHistory.length
      }
    };
  }
  
  /**
   * Get dashboard data
   */
  async getDashboard() {
    if (!this.config.enableDashboard) {
      return { error: 'Dashboard not enabled' };
    }
    
    await this.dashboardProvider.refreshAll();
    return this.dashboardProvider.getDashboardData();
  }
  
  /**
   * Get detailed metrics report
   */
  getMetricsReport() {
    const report = {
      timestamp: Date.now(),
      uptime: Date.now() - this.statistics.startTime,
      summary: {
        tasks: {
          total: this.statistics.totalTasks,
          completed: this.statistics.completedTasks,
          failed: this.statistics.failedTasks,
          successRate: this.statistics.totalTasks > 0 
            ? this.statistics.completedTasks / this.statistics.totalTasks 
            : 0
        },
        routing: {
          total: this.statistics.totalRoutes,
          successful: this.statistics.successfulRoutes,
          ttlViolations: this.statistics.ttlViolations
        }
      },
      metrics: {}
    };
    
    // Add all metrics
    for (const [name, collector] of Object.entries(this.metrics)) {
      report.metrics[name] = collector.getMetrics();
    }
    
    return report;
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      startTime: Date.now(),
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalRoutes: 0,
      successfulRoutes: 0,
      ttlViolations: 0,
      alertsTriggered: 0,
      eventsProcessed: 0
    };
    
    // Reset metrics
    for (const collector of Object.values(this.metrics)) {
      collector.dataPoints = [];
      collector.resetAggregates();
    }
    
    // Clear alerts
    this.alertManager.clearAllAlerts();
    
    logger.info('Statistics reset');
  }
  
  /**
   * Export monitoring data
   */
  exportData() {
    return {
      timestamp: Date.now(),
      statistics: this.statistics,
      metrics: this.getMetricsReport(),
      alerts: this.alertManager.getActiveAlerts(),
      eventHistory: this.eventHistory.slice(-1000) // Last 1000 events
    };
  }
  
  /**
   * Shutdown monitor
   */
  shutdown() {
    logger.info('Shutting down Routing Monitor...');
    
    this.stopMonitoring();
    this.removeAllListeners();
    
    logger.info('Routing Monitor shutdown complete');
  }
}

module.exports = {
  RoutingMonitor,
  MetricsCollector,
  AlertManager,
  DashboardProvider
};