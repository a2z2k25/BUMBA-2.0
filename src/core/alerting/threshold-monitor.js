/**
 * BUMBA Threshold Monitor
 * Monitors metrics and triggers alerts when thresholds are exceeded
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { alertManager } = require('./alert-manager');

class ThresholdMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      checkInterval: config.checkInterval || 10000, // 10 seconds default
      historySize: config.historySize || 100,
      defaultWindow: config.defaultWindow || 60000, // 1 minute
      ...config
    };
    
    // Registered thresholds
    this.thresholds = new Map();
    
    // Metrics storage
    this.metrics = new Map();
    
    // Alert history to prevent spam
    this.alertHistory = new Map();
    
    // Monitoring state
    this.monitoring = false;
    this.checkInterval = null;
    
    // Statistics
    this.stats = {
      checksPerformed: 0,
      thresholdsTriggered: 0,
      alertsSent: 0,
      metricsTracked: 0
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize threshold monitor
   */
  initialize() {
    // Register default system thresholds
    this.registerDefaultThresholds();
    
    logger.info('📊 Threshold Monitor initialized');
    this.emit('initialized');
  }
  
  /**
   * Register default system thresholds
   */
  registerDefaultThresholds() {
    // Memory usage threshold
    this.addThreshold({
      name: 'memory_usage',
      metric: 'system.memory.heapUsed',
      condition: 'greater_than',
      value: 500 * 1024 * 1024, // 500MB
      severity: 'high',
      message: 'Memory usage exceeds 500MB',
      window: 30000 // 30 seconds
    });
    
    // Error rate threshold
    this.addThreshold({
      name: 'error_rate',
      metric: 'app.errors.count',
      condition: 'rate_greater_than',
      value: 10, // 10 errors per minute
      severity: 'critical',
      message: 'Error rate exceeds 10 per minute',
      window: 60000
    });
    
    // Response time threshold
    this.addThreshold({
      name: 'response_time',
      metric: 'app.response.time',
      condition: 'average_greater_than',
      value: 1000, // 1 second
      severity: 'medium',
      message: 'Average response time exceeds 1 second',
      window: 60000
    });
    
    // CPU usage threshold
    this.addThreshold({
      name: 'cpu_usage',
      metric: 'system.cpu.usage',
      condition: 'greater_than',
      value: 80, // 80%
      severity: 'high',
      message: 'CPU usage exceeds 80%',
      window: 30000
    });
  }
  
  /**
   * Add a threshold
   */
  addThreshold(threshold) {
    // Validate threshold
    this.validateThreshold(threshold);
    
    // Store threshold
    this.thresholds.set(threshold.name, {
      ...threshold,
      enabled: threshold.enabled !== false,
      triggered: false,
      lastTriggered: null,
      triggerCount: 0
    });
    
    logger.debug(`Added threshold: ${threshold.name}`);
    this.emit('threshold:added', threshold);
    
    return threshold.name;
  }
  
  /**
   * Update a threshold
   */
  updateThreshold(name, updates) {
    const threshold = this.thresholds.get(name);
    
    if (!threshold) {
      throw new Error(`Threshold ${name} not found`);
    }
    
    // Update threshold
    Object.assign(threshold, updates);
    
    // Reset trigger state if value changed
    if (updates.value !== undefined || updates.condition !== undefined) {
      threshold.triggered = false;
    }
    
    logger.debug(`Updated threshold: ${name}`);
    this.emit('threshold:updated', threshold);
  }
  
  /**
   * Remove a threshold
   */
  removeThreshold(name) {
    const removed = this.thresholds.delete(name);
    
    if (removed) {
      logger.debug(`Removed threshold: ${name}`);
      this.emit('threshold:removed', name);
    }
    
    return removed;
  }
  
  /**
   * Enable/disable threshold
   */
  setThresholdEnabled(name, enabled) {
    const threshold = this.thresholds.get(name);
    
    if (!threshold) {
      throw new Error(`Threshold ${name} not found`);
    }
    
    threshold.enabled = enabled;
    
    if (!enabled) {
      threshold.triggered = false;
    }
    
    logger.debug(`Threshold ${name} ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Record a metric value
   */
  recordMetric(name, value, timestamp = Date.now()) {
    // Get or create metric storage
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricData = this.metrics.get(name);
    
    // Add new value
    metricData.push({ value, timestamp });
    
    // Trim old values (keep history size)
    if (metricData.length > this.config.historySize) {
      metricData.shift();
    }
    
    this.stats.metricsTracked++;
    
    // Check thresholds for this metric
    this.checkMetricThresholds(name);
    
    this.emit('metric:recorded', { name, value, timestamp });
  }
  
  /**
   * Batch record metrics
   */
  recordMetrics(metrics) {
    const timestamp = Date.now();
    
    for (const [name, value] of Object.entries(metrics)) {
      this.recordMetric(name, value, timestamp);
    }
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.monitoring) {
      return;
    }
    
    this.monitoring = true;
    
    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.performChecks();
    }, this.config.checkInterval);
    
    // Initial check
    this.performChecks();
    
    logger.info('📊 Threshold monitoring started');
    this.emit('monitoring:started');
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }
    
    this.monitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    logger.info('📊 Threshold monitoring stopped');
    this.emit('monitoring:stopped');
  }
  
  /**
   * Perform threshold checks
   */
  async performChecks() {
    this.stats.checksPerformed++;
    
    // Collect system metrics
    await this.collectSystemMetrics();
    
    // Check all enabled thresholds
    for (const [name, threshold] of this.thresholds) {
      if (!threshold.enabled) continue;
      
      try {
        await this.checkThreshold(threshold);
      } catch (error) {
        logger.error(`Error checking threshold ${name}:`, error);
      }
    }
    
    this.emit('checks:completed', {
      checked: this.thresholds.size,
      triggered: Array.from(this.thresholds.values()).filter(t => t.triggered).length
    });
  }
  
  /**
   * Check a specific threshold
   */
  async checkThreshold(threshold) {
    const metricData = this.metrics.get(threshold.metric);
    
    if (!metricData || metricData.length === 0) {
      return; // No data for this metric
    }
    
    // Get relevant data within window
    const now = Date.now();
    const window = threshold.window || this.config.defaultWindow;
    const relevantData = metricData.filter(d => d.timestamp > now - window);
    
    if (relevantData.length === 0) {
      return; // No recent data
    }
    
    // Evaluate condition
    const triggered = this.evaluateCondition(threshold, relevantData);
    
    // Handle state change
    if (triggered && !threshold.triggered) {
      // Threshold just exceeded
      this.handleThresholdExceeded(threshold, relevantData);
    } else if (!triggered && threshold.triggered) {
      // Threshold recovered
      this.handleThresholdRecovered(threshold);
    }
  }
  
  /**
   * Check thresholds for a specific metric
   */
  checkMetricThresholds(metricName) {
    for (const threshold of this.thresholds.values()) {
      if (threshold.metric === metricName && threshold.enabled) {
        this.checkThreshold(threshold);
      }
    }
  }
  
  /**
   * Evaluate threshold condition
   */
  evaluateCondition(threshold, data) {
    const values = data.map(d => d.value);
    
    switch (threshold.condition) {
      case 'greater_than':
        return values[values.length - 1] > threshold.value;
        
      case 'less_than':
        return values[values.length - 1] < threshold.value;
        
      case 'equals':
        return values[values.length - 1] === threshold.value;
        
      case 'not_equals':
        return values[values.length - 1] !== threshold.value;
        
      case 'average_greater_than':
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return avg > threshold.value;
        
      case 'average_less_than':
        const avgLess = values.reduce((a, b) => a + b, 0) / values.length;
        return avgLess < threshold.value;
        
      case 'sum_greater_than':
        const sum = values.reduce((a, b) => a + b, 0);
        return sum > threshold.value;
        
      case 'rate_greater_than':
        // Calculate rate per minute
        const timeSpan = (data[data.length - 1].timestamp - data[0].timestamp) / 60000;
        const rate = values.length / Math.max(timeSpan, 1);
        return rate > threshold.value;
        
      case 'rate_less_than':
        const timeSpanLess = (data[data.length - 1].timestamp - data[0].timestamp) / 60000;
        const rateLess = values.length / Math.max(timeSpanLess, 1);
        return rateLess < threshold.value;
        
      case 'percentage_greater_than':
        const percentage = (values[values.length - 1] / threshold.total) * 100;
        return percentage > threshold.value;
        
      case 'custom':
        if (threshold.evaluator && typeof threshold.evaluator === 'function') {
          return threshold.evaluator(values, data);
        }
        return false;
        
      default:
        logger.warn(`Unknown threshold condition: ${threshold.condition}`);
        return false;
    }
  }
  
  /**
   * Handle threshold exceeded
   */
  handleThresholdExceeded(threshold, data) {
    threshold.triggered = true;
    threshold.lastTriggered = new Date().toISOString();
    threshold.triggerCount++;
    
    this.stats.thresholdsTriggered++;
    
    // Check if we should send alert (rate limiting)
    if (this.shouldSendAlert(threshold)) {
      const values = data.map(d => d.value);
      const currentValue = values[values.length - 1];
      
      // Create alert
      const alert = alertManager.alert(
        `threshold_${threshold.name}`,
        threshold.message || `Threshold ${threshold.name} exceeded`,
        {
          threshold: threshold.name,
          metric: threshold.metric,
          condition: threshold.condition,
          thresholdValue: threshold.value,
          currentValue,
          averageValue: values.reduce((a, b) => a + b, 0) / values.length,
          dataPoints: data.length
        },
        threshold.severity || 'medium'
      );
      
      if (alert) {
        this.stats.alertsSent++;
        
        // Record alert sent
        this.alertHistory.set(threshold.name, {
          timestamp: Date.now(),
          alertId: alert.id
        });
      }
    }
    
    // Emit event
    this.emit('threshold:exceeded', {
      threshold,
      data,
      currentValue: data[data.length - 1].value
    });
    
    logger.warn(`🟠️ Threshold exceeded: ${threshold.name}`);
  }
  
  /**
   * Handle threshold recovered
   */
  handleThresholdRecovered(threshold) {
    threshold.triggered = false;
    
    // Create recovery alert
    alertManager.alert(
      `threshold_${threshold.name}_recovered`,
      `Threshold ${threshold.name} recovered`,
      {
        threshold: threshold.name,
        metric: threshold.metric,
        previouslyTriggered: threshold.lastTriggered
      },
      'info'
    );
    
    // Clear alert history for this threshold
    this.alertHistory.delete(threshold.name);
    
    // Emit event
    this.emit('threshold:recovered', threshold);
    
    logger.info(`🏁 Threshold recovered: ${threshold.name}`);
  }
  
  /**
   * Check if we should send alert (rate limiting)
   */
  shouldSendAlert(threshold) {
    const history = this.alertHistory.get(threshold.name);
    
    if (!history) {
      return true; // No previous alert
    }
    
    // Rate limit: Don't send same alert within 5 minutes
    const timeSinceLastAlert = Date.now() - history.timestamp;
    return timeSinceLastAlert > 300000; // 5 minutes
  }
  
  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.recordMetric('system.memory.heapUsed', memUsage.heapUsed);
      this.recordMetric('system.memory.heapTotal', memUsage.heapTotal);
      this.recordMetric('system.memory.rss', memUsage.rss);
      this.recordMetric('system.memory.external', memUsage.external);
      
      // CPU metrics (if available)
      if (process.cpuUsage) {
        const cpuUsage = process.cpuUsage();
        const totalCpu = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        this.recordMetric('system.cpu.usage', totalCpu);
      }
      
      // Process metrics
      this.recordMetric('system.process.uptime', process.uptime());
      
      // Event loop lag (approximation)
      const start = Date.now();
      setImmediate(() => {
        const lag = Date.now() - start;
        this.recordMetric('system.eventLoop.lag', lag);
      });
      
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }
  
  /**
   * Validate threshold configuration
   */
  validateThreshold(threshold) {
    if (!threshold.name) {
      throw new Error('Threshold must have a name');
    }
    
    if (!threshold.metric) {
      throw new Error('Threshold must specify a metric');
    }
    
    if (!threshold.condition) {
      throw new Error('Threshold must have a condition');
    }
    
    if (threshold.value === undefined) {
      throw new Error('Threshold must have a value');
    }
    
    const validConditions = [
      'greater_than', 'less_than', 'equals', 'not_equals',
      'average_greater_than', 'average_less_than',
      'sum_greater_than', 'rate_greater_than', 'rate_less_than',
      'percentage_greater_than', 'custom'
    ];
    
    if (!validConditions.includes(threshold.condition)) {
      throw new Error(`Invalid condition: ${threshold.condition}`);
    }
  }
  
  /**
   * Get threshold status
   */
  getThresholdStatus(name) {
    const threshold = this.thresholds.get(name);
    
    if (!threshold) {
      return null;
    }
    
    const metricData = this.metrics.get(threshold.metric);
    const currentValue = metricData && metricData.length > 0 
      ? metricData[metricData.length - 1].value 
      : null;
    
    return {
      name: threshold.name,
      metric: threshold.metric,
      condition: threshold.condition,
      thresholdValue: threshold.value,
      currentValue,
      triggered: threshold.triggered,
      enabled: threshold.enabled,
      lastTriggered: threshold.lastTriggered,
      triggerCount: threshold.triggerCount
    };
  }
  
  /**
   * Get all threshold statuses
   */
  getAllThresholdStatuses() {
    const statuses = [];
    
    for (const name of this.thresholds.keys()) {
      const status = this.getThresholdStatus(name);
      if (status) {
        statuses.push(status);
      }
    }
    
    return statuses;
  }
  
  /**
   * Get metric history
   */
  getMetricHistory(name, window) {
    const data = this.metrics.get(name);
    
    if (!data) {
      return [];
    }
    
    if (window) {
      const cutoff = Date.now() - window;
      return data.filter(d => d.timestamp > cutoff);
    }
    
    return [...data];
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      thresholdsConfigured: this.thresholds.size,
      thresholdsEnabled: Array.from(this.thresholds.values()).filter(t => t.enabled).length,
      thresholdsTriggered: Array.from(this.thresholds.values()).filter(t => t.triggered).length,
      metricsTracked: this.metrics.size,
      monitoring: this.monitoring
    };
  }
  
  /**
   * Clear metric history
   */
  clearMetricHistory(name) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      checksPerformed: 0,
      thresholdsTriggered: 0,
      alertsSent: 0,
      metricsTracked: 0
    };
  }
  
  /**
   * Export threshold configuration
   */
  exportThresholds() {
    const thresholds = [];
    
    for (const threshold of this.thresholds.values()) {
      thresholds.push({
        name: threshold.name,
        metric: threshold.metric,
        condition: threshold.condition,
        value: threshold.value,
        severity: threshold.severity,
        message: threshold.message,
        window: threshold.window,
        enabled: threshold.enabled
      });
    }
    
    return thresholds;
  }
  
  /**
   * Import threshold configuration
   */
  importThresholds(thresholds) {
    for (const threshold of thresholds) {
      try {
        this.addThreshold(threshold);
      } catch (error) {
        logger.error(`Failed to import threshold ${threshold.name}:`, error);
      }
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ThresholdMonitor,
  getInstance: (config) => {
    if (!instance) {
      instance = new ThresholdMonitor(config);
    }
    return instance;
  }
};