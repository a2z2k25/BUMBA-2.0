/**
 * Metrics Dashboard for Intelligent Pooling
 * Comprehensive monitoring and analytics for the pooling system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class MetricsDashboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Collection intervals
      metricsInterval: config.metricsInterval || 5000,        // 5 seconds
      aggregationInterval: config.aggregationInterval || 60000, // 1 minute
      reportInterval: config.reportInterval || 300000,        // 5 minutes
      
      // History settings
      maxHistorySize: config.maxHistorySize || 1000,
      maxAggregatedSize: config.maxAggregatedSize || 100,
      
      // Alert thresholds
      alerts: {
        coldStartRate: config.alerts?.coldStartRate || 0.5,    // 50%
        hitRate: config.alerts?.hitRate || 0.5,                // 50% minimum
        memoryUsage: config.alerts?.memoryUsage || 0.9,        // 90%
        responseTime: config.alerts?.responseTime || 100,      // ms
        errorRate: config.alerts?.errorRate || 0.1,            // 10%
        predictionAccuracy: config.alerts?.predictionAccuracy || 0.3 // 30% minimum
      },
      
      // Export settings
      exportFormat: config.exportFormat || 'json',
      exportPath: config.exportPath || './metrics',
      
      // Features
      enableAlerts: config.enableAlerts !== false,
      enableAggregation: config.enableAggregation !== false,
      enableExport: config.enableExport !== false,
      enableRealtime: config.enableRealtime !== false
    };
    
    // Core metrics
    this.metrics = {
      // Pool metrics
      pool: {
        size: 0,
        warmCount: 0,
        coldCount: 0,
        activeCount: 0,
        utilizationRate: 0,
        turnoverRate: 0
      },
      
      // Performance metrics
      performance: {
        hitRate: 0,
        missRate: 0,
        coldStartRate: 0,
        avgWarmTime: 0,
        avgColdTime: 0,
        avgResponseTime: 0,
        throughput: 0
      },
      
      // Prediction metrics
      predictions: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        totalPredictions: 0,
        correctPredictions: 0
      },
      
      // Context metrics
      context: {
        phaseAccuracy: 0,
        departmentAccuracy: 0,
        contextChanges: 0,
        avgConfidence: 0
      },
      
      // Memory metrics
      memory: {
        usage: 0,
        limit: 0,
        pressure: 'normal',
        evictions: 0,
        gcCount: 0,
        avgMemoryPerSpecialist: 0
      },
      
      // Adaptive metrics
      adaptive: {
        adjustments: 0,
        scaleUps: 0,
        scaleDowns: 0,
        currentLoadPattern: 'normal',
        avgPoolSize: 0
      },
      
      // Error metrics
      errors: {
        total: 0,
        rate: 0,
        byType: {},
        lastError: null
      },
      
      // Usage patterns
      usage: {
        topSpecialists: [],
        byDepartment: {},
        byPhase: {},
        byTimeOfDay: {},
        totalRequests: 0
      }
    };
    
    // Time series data
    this.timeSeries = {
      hitRate: [],
      poolSize: [],
      memoryUsage: [],
      responseTime: [],
      predictions: [],
      errors: []
    };
    
    // Aggregated metrics
    this.aggregated = {
      hourly: [],
      daily: [],
      weekly: []
    };
    
    // Alerts
    this.activeAlerts = new Map();
    this.alertHistory = [];
    
    // Collection state
    this.collectionStarted = false;
    this.lastCollection = 0;
    this.collectionCount = 0;
    
    // Component references (set externally)
    this.components = {
      poolManager: null,
      adaptiveManager: null,
      memoryManager: null,
      stateManager: null,
      cacheManager: null
    };
    
    logger.info('📊 Metrics dashboard initialized');
  }
  
  /**
   * Connect to pooling components
   */
  connectComponents(components) {
    this.components = { ...this.components, ...components };
    
    // Subscribe to events
    this.subscribeToEvents();
    
    logger.debug('Connected to pooling components');
  }
  
  /**
   * Subscribe to component events
   */
  subscribeToEvents() {
    const { poolManager, adaptiveManager, memoryManager, stateManager } = this.components;
    
    if (poolManager) {
      poolManager.on('pool:hit', () => this.recordHit());
      poolManager.on('pool:miss', (data) => this.recordMiss(data));
      poolManager.on('pool:updated', (data) => this.recordPoolUpdate(data));
      poolManager.on('specialist:warmed', (data) => this.recordWarming(data));
      poolManager.on('specialist:cooled', (data) => this.recordCooling(data));
    }
    
    if (adaptiveManager) {
      adaptiveManager.on('scaling:complete', (data) => this.recordScaling(data));
      adaptiveManager.on('load:pattern-changed', (data) => this.recordLoadChange(data));
    }
    
    if (memoryManager) {
      memoryManager.on('memory:pressure-changed', (data) => this.recordMemoryPressure(data));
      memoryManager.on('memory:eviction', (data) => this.recordEviction(data));
      memoryManager.on('memory:gc', (data) => this.recordGC(data));
    }
    
    if (stateManager) {
      stateManager.on('state:changed', (data) => this.recordStateChange(data));
      stateManager.on('state:error', (data) => this.recordError(data));
    }
  }
  
  /**
   * Collect current metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // Collect from components
    const poolStatus = this.components.poolManager?.getStatus() || {};
    const adaptiveStatus = this.components.adaptiveManager?.getStatus() || {};
    const memoryStatus = this.components.memoryManager?.getStatus() || {};
    const stateStatus = this.components.stateManager?.getPoolStatus() || {};
    const cacheStatus = this.components.cacheManager?.getStatus() || {};
    
    // Update pool metrics
    this.metrics.pool = {
      size: poolStatus.totalCount || 0,
      warmCount: poolStatus.warmCount || 0,
      coldCount: stateStatus.cold || 0,
      activeCount: stateStatus.active || 0,
      utilizationRate: this.calculateUtilization(poolStatus),
      turnoverRate: this.calculateTurnover()
    };
    
    // Update performance metrics
    this.metrics.performance = {
      hitRate: this.calculateHitRate(),
      missRate: 1 - this.calculateHitRate(),
      coldStartRate: poolStatus.coldStarts / (poolStatus.coldStarts + poolStatus.hits) || 0,
      avgWarmTime: adaptiveStatus.performance?.avgWarmStartTime || 0,
      avgColdTime: adaptiveStatus.performance?.avgColdStartTime || 0,
      avgResponseTime: this.calculateAvgResponseTime(),
      throughput: this.calculateThroughput()
    };
    
    // Update memory metrics
    this.metrics.memory = {
      usage: parseFloat(memoryStatus.usage?.current) || 0,
      limit: parseFloat(memoryStatus.usage?.limit) || 100,
      pressure: memoryStatus.pressure || 'normal',
      evictions: poolStatus.evictions || 0,
      gcCount: memoryStatus.gcStats?.count || 0,
      avgMemoryPerSpecialist: this.calculateAvgMemory()
    };
    
    // Update adaptive metrics
    this.metrics.adaptive = {
      adjustments: adaptiveStatus.adjustmentCount || 0,
      scaleUps: this.countScaleUps(),
      scaleDowns: this.countScaleDowns(),
      currentLoadPattern: adaptiveStatus.loadPattern || 'normal',
      avgPoolSize: this.calculateAvgPoolSize()
    };
    
    // Update prediction accuracy
    this.updatePredictionMetrics();
    
    // Update usage patterns
    this.updateUsagePatterns();
    
    // Add to time series
    this.addToTimeSeries(timestamp);
    
    // Check alerts
    if (this.config.enableAlerts) {
      this.checkAlerts();
    }
    
    // Aggregate if needed
    if (this.config.enableAggregation) {
      this.aggregateMetrics();
    }
    
    this.lastCollection = timestamp;
    this.collectionCount++;
    
    this.emit('metrics:collected', this.metrics);
  }
  
  /**
   * Calculate utilization rate
   */
  calculateUtilization(poolStatus) {
    const warm = poolStatus.warmCount || 0;
    const total = poolStatus.totalCount || 0;
    return total > 0 ? warm / total : 0;
  }
  
  /**
   * Calculate turnover rate
   */
  calculateTurnover() {
    // Calculate based on warming/cooling events in last period
    const period = 60000; // 1 minute
    const now = Date.now();
    const recentEvents = this.timeSeries.poolSize
      .filter(entry => entry.timestamp > now - period);
    
    if (recentEvents.length < 2) return 0;
    
    let changes = 0;
    for (let i = 1; i < recentEvents.length; i++) {
      if (recentEvents[i].value !== recentEvents[i-1].value) {
        changes++;
      }
    }
    
    return changes / recentEvents.length;
  }
  
  /**
   * Calculate hit rate
   */
  calculateHitRate() {
    const cacheStatus = this.components.cacheManager?.getStatus() || {};
    const hits = cacheStatus.hits || 0;
    const misses = cacheStatus.misses || 0;
    const total = hits + misses;
    
    return total > 0 ? hits / total : 0;
  }
  
  /**
   * Calculate average response time
   */
  calculateAvgResponseTime() {
    const recent = this.timeSeries.responseTime.slice(-20);
    if (recent.length === 0) return 0;
    
    const sum = recent.reduce((acc, entry) => acc + entry.value, 0);
    return sum / recent.length;
  }
  
  /**
   * Calculate throughput
   */
  calculateThroughput() {
    const period = 60000; // 1 minute
    const now = Date.now();
    const recentRequests = this.timeSeries.hitRate
      .filter(entry => entry.timestamp > now - period);
    
    return recentRequests.length; // requests per minute
  }
  
  /**
   * Calculate average memory per specialist
   */
  calculateAvgMemory() {
    const memoryUsage = this.metrics.memory.usage;
    const specialists = this.metrics.pool.warmCount + this.metrics.pool.activeCount;
    
    return specialists > 0 ? memoryUsage / specialists : 0;
  }
  
  /**
   * Calculate average pool size
   */
  calculateAvgPoolSize() {
    const recent = this.timeSeries.poolSize.slice(-20);
    if (recent.length === 0) return 0;
    
    const sum = recent.reduce((acc, entry) => acc + entry.value, 0);
    return sum / recent.length;
  }
  
  /**
   * Count scale ups
   */
  countScaleUps() {
    let count = 0;
    const history = this.timeSeries.poolSize;
    
    for (let i = 1; i < history.length; i++) {
      if (history[i].value > history[i-1].value) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Count scale downs
   */
  countScaleDowns() {
    let count = 0;
    const history = this.timeSeries.poolSize;
    
    for (let i = 1; i < history.length; i++) {
      if (history[i].value < history[i-1].value) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Update prediction metrics
   */
  updatePredictionMetrics() {
    const poolStatus = this.components.poolManager?.getStatus() || {};
    
    // Calculate prediction accuracy
    const correct = poolStatus.correctPredictions || 0;
    const total = poolStatus.predictions || 0;
    
    this.metrics.predictions = {
      accuracy: total > 0 ? correct / total : 0,
      precision: this.calculatePrecision(),
      recall: this.calculateRecall(),
      f1Score: this.calculateF1Score(),
      totalPredictions: total,
      correctPredictions: correct
    };
  }
  
  /**
   * Calculate precision
   */
  calculatePrecision() {
    // Precision = true positives / (true positives + false positives)
    const tp = this.metrics.predictions.correctPredictions;
    const fp = this.metrics.predictions.totalPredictions - tp;
    
    return (tp + fp) > 0 ? tp / (tp + fp) : 0;
  }
  
  /**
   * Calculate recall
   */
  calculateRecall() {
    // Recall = true positives / (true positives + false negatives)
    // For pooling: false negatives = cold starts that could have been predicted
    const tp = this.metrics.predictions.correctPredictions;
    const fn = this.metrics.performance.coldStartRate * this.metrics.usage.totalRequests;
    
    return (tp + fn) > 0 ? tp / (tp + fn) : 0;
  }
  
  /**
   * Calculate F1 score
   */
  calculateF1Score() {
    const precision = this.metrics.predictions.precision;
    const recall = this.metrics.predictions.recall;
    
    return (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;
  }
  
  /**
   * Update usage patterns
   */
  updateUsagePatterns() {
    // This would aggregate from usage tracker
    // For now, using mock data structure
    this.metrics.usage = {
      topSpecialists: this.getTopSpecialists(),
      byDepartment: this.getUsageByDepartment(),
      byPhase: this.getUsageByPhase(),
      byTimeOfDay: this.getUsageByTimeOfDay(),
      totalRequests: this.collectionCount * 10 // Mock calculation
    };
  }
  
  /**
   * Get top specialists (mock)
   */
  getTopSpecialists() {
    return [
      { type: 'backend-engineer', count: 150, percentage: 25 },
      { type: 'frontend-developer', count: 120, percentage: 20 },
      { type: 'database-specialist', count: 90, percentage: 15 }
    ];
  }
  
  /**
   * Get usage by department (mock)
   */
  getUsageByDepartment() {
    return {
      BACKEND: 40,
      FRONTEND: 30,
      DATA: 15,
      INFRASTRUCTURE: 10,
      STRATEGIC: 5
    };
  }
  
  /**
   * Get usage by phase (mock)
   */
  getUsageByPhase() {
    return {
      DEVELOPMENT: 50,
      TESTING: 20,
      DEPLOYMENT: 15,
      PLANNING: 10,
      MAINTENANCE: 5
    };
  }
  
  /**
   * Get usage by time of day (mock)
   */
  getUsageByTimeOfDay() {
    return {
      '00-06': 5,
      '06-09': 10,
      '09-12': 30,
      '12-15': 35,
      '15-18': 15,
      '18-24': 5
    };
  }
  
  /**
   * Add to time series
   */
  addToTimeSeries(timestamp) {
    // Add current metrics to time series
    this.addTimeSeriesEntry('hitRate', this.metrics.performance.hitRate, timestamp);
    this.addTimeSeriesEntry('poolSize', this.metrics.pool.warmCount, timestamp);
    this.addTimeSeriesEntry('memoryUsage', this.metrics.memory.usage, timestamp);
    this.addTimeSeriesEntry('responseTime', this.metrics.performance.avgResponseTime, timestamp);
    this.addTimeSeriesEntry('predictions', this.metrics.predictions.accuracy, timestamp);
    this.addTimeSeriesEntry('errors', this.metrics.errors.rate, timestamp);
  }
  
  /**
   * Add time series entry
   */
  addTimeSeriesEntry(series, value, timestamp) {
    if (!this.timeSeries[series]) {
      this.timeSeries[series] = [];
    }
    
    this.timeSeries[series].push({ value, timestamp });
    
    // Trim to max size
    if (this.timeSeries[series].length > this.config.maxHistorySize) {
      this.timeSeries[series].shift();
    }
  }
  
  /**
   * Check and trigger alerts
   */
  checkAlerts() {
    const alerts = [];
    
    // Check cold start rate
    if (this.metrics.performance.coldStartRate > this.config.alerts.coldStartRate) {
      alerts.push({
        type: 'HIGH_COLD_START_RATE',
        severity: 'warning',
        value: this.metrics.performance.coldStartRate,
        threshold: this.config.alerts.coldStartRate
      });
    }
    
    // Check hit rate
    if (this.metrics.performance.hitRate < this.config.alerts.hitRate) {
      alerts.push({
        type: 'LOW_HIT_RATE',
        severity: 'warning',
        value: this.metrics.performance.hitRate,
        threshold: this.config.alerts.hitRate
      });
    }
    
    // Check memory usage
    const memoryRatio = this.metrics.memory.usage / this.metrics.memory.limit;
    if (memoryRatio > this.config.alerts.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'critical',
        value: memoryRatio,
        threshold: this.config.alerts.memoryUsage
      });
    }
    
    // Check response time
    if (this.metrics.performance.avgResponseTime > this.config.alerts.responseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE_TIME',
        severity: 'warning',
        value: this.metrics.performance.avgResponseTime,
        threshold: this.config.alerts.responseTime
      });
    }
    
    // Check error rate
    if (this.metrics.errors.rate > this.config.alerts.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'critical',
        value: this.metrics.errors.rate,
        threshold: this.config.alerts.errorRate
      });
    }
    
    // Check prediction accuracy
    if (this.metrics.predictions.accuracy < this.config.alerts.predictionAccuracy) {
      alerts.push({
        type: 'LOW_PREDICTION_ACCURACY',
        severity: 'info',
        value: this.metrics.predictions.accuracy,
        threshold: this.config.alerts.predictionAccuracy
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      this.triggerAlert(alert);
    }
  }
  
  /**
   * Trigger alert
   */
  triggerAlert(alert) {
    const key = alert.type;
    
    // Check if already active
    if (this.activeAlerts.has(key)) {
      const existing = this.activeAlerts.get(key);
      existing.count++;
      existing.lastTriggered = Date.now();
    } else {
      // New alert
      alert.firstTriggered = Date.now();
      alert.lastTriggered = Date.now();
      alert.count = 1;
      
      this.activeAlerts.set(key, alert);
      
      logger.warn(`🟠️ Alert triggered: ${alert.type} (${alert.value.toFixed(2)} > ${alert.threshold})`);
      
      this.emit('alert:triggered', alert);
    }
    
    // Add to history
    this.alertHistory.push({
      ...alert,
      timestamp: Date.now()
    });
    
    // Trim history
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }
  }
  
  /**
   * Clear alert
   */
  clearAlert(type) {
    if (this.activeAlerts.has(type)) {
      const alert = this.activeAlerts.get(type);
      this.activeAlerts.delete(type);
      
      logger.info(`🏁 Alert cleared: ${type}`);
      
      this.emit('alert:cleared', {
        type,
        duration: Date.now() - alert.firstTriggered
      });
    }
  }
  
  /**
   * Aggregate metrics
   */
  aggregateMetrics() {
    const now = Date.now();
    const hour = Math.floor(now / 3600000);
    
    // Check if new hour
    const lastHourly = this.aggregated.hourly[this.aggregated.hourly.length - 1];
    if (!lastHourly || lastHourly.hour !== hour) {
      const hourlyMetrics = this.createAggregatedMetrics('hourly');
      this.aggregated.hourly.push({
        hour,
        timestamp: now,
        metrics: hourlyMetrics
      });
      
      // Trim old data
      if (this.aggregated.hourly.length > this.config.maxAggregatedSize) {
        this.aggregated.hourly.shift();
      }
    }
  }
  
  /**
   * Create aggregated metrics
   */
  createAggregatedMetrics(period) {
    return {
      avgHitRate: this.metrics.performance.hitRate,
      avgPoolSize: this.metrics.pool.warmCount,
      avgMemoryUsage: this.metrics.memory.usage,
      avgResponseTime: this.metrics.performance.avgResponseTime,
      totalRequests: this.metrics.usage.totalRequests,
      totalErrors: this.metrics.errors.total,
      predictionAccuracy: this.metrics.predictions.accuracy
    };
  }
  
  /**
   * Record events
   */
  recordHit() {
    // Update hit counter
  }
  
  recordMiss(data) {
    // Update miss counter and cold start tracking
  }
  
  recordPoolUpdate(data) {
    // Track pool size changes
  }
  
  recordWarming(data) {
    // Track warming events
  }
  
  recordCooling(data) {
    // Track cooling events
  }
  
  recordScaling(data) {
    // Track scaling events
  }
  
  recordLoadChange(data) {
    // Track load pattern changes
  }
  
  recordMemoryPressure(data) {
    // Track memory pressure changes
  }
  
  recordEviction(data) {
    // Track evictions
  }
  
  recordGC(data) {
    // Track garbage collection
  }
  
  recordStateChange(data) {
    // Track state transitions
  }
  
  recordError(data) {
    this.metrics.errors.total++;
    this.metrics.errors.lastError = data;
    
    // Update error rate
    const period = 60000; // 1 minute
    const recentErrors = this.alertHistory
      .filter(a => a.timestamp > Date.now() - period && a.type.includes('ERROR'));
    
    this.metrics.errors.rate = recentErrors.length / (period / 1000);
  }
  
  /**
   * Start metrics collection
   */
  startCollection() {
    if (this.collectionStarted) {
      logger.warn('Metrics collection already started');
      return;
    }
    
    // Start collection interval
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);
    
    // Start aggregation interval
    if (this.config.enableAggregation) {
      this.aggregationInterval = setInterval(() => {
        this.aggregateMetrics();
      }, this.config.aggregationInterval);
    }
    
    // Start report interval
    this.reportInterval = setInterval(() => {
      this.generateReport();
    }, this.config.reportInterval);
    
    this.collectionStarted = true;
    
    logger.info('📊 Metrics collection started');
  }
  
  /**
   * Stop metrics collection
   */
  stopCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    this.collectionStarted = false;
    
    logger.info('Metrics collection stopped');
  }
  
  /**
   * Generate metrics report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      summary: this.getSummary(),
      metrics: this.metrics,
      alerts: Array.from(this.activeAlerts.values()),
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations()
    };
    
    this.emit('report:generated', report);
    
    // Export if enabled
    if (this.config.enableExport) {
      this.exportReport(report);
    }
    
    return report;
  }
  
  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      poolEfficiency: `${(this.metrics.performance.hitRate * 100).toFixed(1)}%`,
      memoryUsage: `${this.metrics.memory.usage}/${this.metrics.memory.limit}MB`,
      avgResponseTime: `${this.metrics.performance.avgResponseTime.toFixed(2)}ms`,
      predictionAccuracy: `${(this.metrics.predictions.accuracy * 100).toFixed(1)}%`,
      activeAlerts: this.activeAlerts.size,
      uptime: this.formatUptime()
    };
  }
  
  /**
   * Analyze trends
   */
  analyzeTrends() {
    return {
      hitRate: this.analyzeTrend('hitRate'),
      poolSize: this.analyzeTrend('poolSize'),
      memoryUsage: this.analyzeTrend('memoryUsage'),
      responseTime: this.analyzeTrend('responseTime')
    };
  }
  
  /**
   * Analyze trend for metric
   */
  analyzeTrend(metric) {
    const series = this.timeSeries[metric];
    if (!series || series.length < 10) return 'insufficient_data';
    
    const recent = series.slice(-10);
    const older = series.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, e) => sum + e.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check hit rate
    if (this.metrics.performance.hitRate < 0.6) {
      recommendations.push({
        type: 'performance',
        message: 'Consider increasing pool size or improving prediction accuracy',
        priority: 'high'
      });
    }
    
    // Check memory
    if (this.metrics.memory.pressure === 'critical') {
      recommendations.push({
        type: 'memory',
        message: 'Memory pressure critical - consider reducing pool size or optimizing specialist memory',
        priority: 'critical'
      });
    }
    
    // Check predictions
    if (this.metrics.predictions.accuracy < 0.4) {
      recommendations.push({
        type: 'prediction',
        message: 'Low prediction accuracy - consider retraining or adjusting prediction parameters',
        priority: 'medium'
      });
    }
    
    // Check errors
    if (this.metrics.errors.rate > 0.05) {
      recommendations.push({
        type: 'stability',
        message: 'High error rate detected - investigate recent errors',
        priority: 'high'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Export report
   */
  exportReport(report) {
    // Would export to file/database
    logger.debug(`Report exported: ${this.config.exportPath}`);
  }
  
  /**
   * Record specialist addition
   */
  recordAddition(specialist) {
    this.metrics.usage.totalRequests++;
    this.collectMetrics();
    logger.debug(`Recorded addition of specialist: ${specialist.id}`);
  }
  
  /**
   * Record specialist release
   */
  recordRelease(specialist) {
    this.collectMetrics();
    logger.debug(`Recorded release of specialist: ${specialist.id}`);
  }
  
  /**
   * Record optimization
   */
  recordOptimization(optimization) {
    this.collectMetrics();
    logger.debug(`Recorded optimization:`, optimization);
  }
  
  /**
   * Format uptime
   */
  formatUptime() {
    const uptime = this.collectionCount * this.config.metricsInterval;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
  
  /**
   * Get dashboard data
   */
  getDashboard() {
    return {
      summary: this.getSummary(),
      metrics: this.metrics,
      timeSeries: this.getRecentTimeSeries(),
      alerts: Array.from(this.activeAlerts.values()),
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations()
    };
  }
  
  /**
   * Get recent time series data
   */
  getRecentTimeSeries() {
    const recent = {};
    
    for (const [key, series] of Object.entries(this.timeSeries)) {
      recent[key] = series.slice(-50); // Last 50 points
    }
    
    return recent;
  }
  
  /**
   * Reset metrics
   */
  reset() {
    // Reset all metrics to initial state
    this.metrics = this.constructor.call(this).metrics;
    this.timeSeries = {};
    this.aggregated = { hourly: [], daily: [], weekly: [] };
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.collectionCount = 0;
    
    logger.info('Metrics dashboard reset');
  }
  
  /**
   * Get dashboard snapshot
   */
  getSnapshot() {
    return {
      metrics: this.metrics,
      summary: this.getSummary(),
      activeAlerts: this.activeAlerts.size,
      collectionCount: this.collectionCount
    };
  }
  
  /**
   * Update metrics
   */
  updateMetrics(data) {
    // Update metrics from external data
    if (data.poolSize !== undefined) {
      this.metrics.pool.size = data.poolSize;
    }
    if (data.activeCount !== undefined) {
      this.metrics.pool.activeCount = data.activeCount;
    }
    if (data.warmCount !== undefined) {
      this.metrics.pool.warmCount = data.warmCount;
    }
    if (data.hibernatingCount !== undefined) {
      // Add hibernating count to pool metrics
      this.metrics.pool.hibernatingCount = data.hibernatingCount;
    }
    if (data.cacheHitRate !== undefined) {
      this.metrics.performance.hitRate = data.cacheHitRate;
    }
    if (data.memoryUsage !== undefined) {
      this.metrics.memory.usage = data.memoryUsage;
    }
  }
  
  /**
   * Shutdown dashboard
   */
  shutdown() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }
    this.reset();
    logger.info('Metrics dashboard shut down');
  }
}

module.exports = { MetricsDashboard };