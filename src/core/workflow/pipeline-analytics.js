/**
 * BUMBA Pipeline Analytics  
 * Comprehensive monitoring and insights for pipeline execution
 * Part of Pipeline Manager enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Analytics for pipeline operations
 */
class PipelineAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      trackingInterval: config.trackingInterval || 60000, // 1 minute
      retentionPeriod: config.retentionPeriod || 7 * 24 * 3600000, // 7 days
      aggregationLevels: config.aggregationLevels || ['minute', 'hour', 'day'],
      alertingEnabled: config.alertingEnabled !== false,
      predictiveAnalytics: config.predictiveAnalytics || false,
      realtimeMonitoring: config.realtimeMonitoring !== false,
      ...config
    };
    
    // Metrics storage
    this.pipelineMetrics = new Map();
    this.stageMetrics = new Map();
    this.executionMetrics = new Map();
    this.resourceMetrics = new Map();
    
    // Performance tracking
    this.performanceHistory = new Map();
    this.throughputHistory = new Map();
    this.latencyHistory = new Map();
    this.errorHistory = new Map();
    
    // Aggregated metrics
    this.aggregatedMetrics = new Map();
    this.trendsAnalysis = new Map();
    this.comparativeAnalysis = new Map();
    
    // Real-time monitoring
    this.realtimeMetrics = new Map();
    this.activeMonitors = new Map();
    this.streamingMetrics = new Map();
    
    // Predictive analytics
    this.predictions = new Map();
    this.anomalies = new Map();
    this.forecasts = new Map();
    
    // Alerts and notifications
    this.alerts = new Map();
    this.alertRules = new Map();
    this.notifications = new Map();
    
    // Reports and dashboards
    this.reports = new Map();
    this.dashboards = new Map();
    this.visualizations = new Map();
    
    // Metrics
    this.metrics = {
      totalPipelines: 0,
      totalExecutions: 0,
      totalStagesExecuted: 0,
      averageThroughput: 0,
      averageLatency: 0,
      errorRate: 0,
      successRate: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize analytics
   */
  initialize() {
    this.startTrackingLoop();
    this.setupDefaultAlertRules();
    
    if (this.config.realtimeMonitoring) {
      this.startRealtimeMonitoring();
    }
    
    if (this.config.predictiveAnalytics) {
      this.initializePredictiveModels();
    }
    
    logger.info('📊 Pipeline Analytics initialized');
  }
  
  /**
   * Track pipeline execution
   */
  trackPipelineExecution(execution) {
    const timestamp = Date.now();
    
    const metrics = {
      id: execution.id,
      pipelineId: execution.pipelineId,
      timestamp,
      startTime: execution.startTime,
      endTime: execution.endTime || timestamp,
      duration: (execution.endTime || timestamp) - execution.startTime,
      status: execution.state?.status || 'unknown',
      stagesCompleted: execution.state?.completedStages?.length || 0,
      dataProcessed: execution.state?.dataFlow?.output?.length || 0,
      errors: execution.state?.errors || [],
      resources: {
        cpu: execution.cpuUsage || 0,
        memory: execution.memoryUsage || 0,
        io: execution.ioUsage || 0
      }
    };
    
    // Store metrics
    this.executionMetrics.set(execution.id, metrics);
    
    // Update pipeline metrics
    this.updatePipelineMetrics(execution.pipelineId, metrics);
    
    // Update stage metrics
    if (execution.state?.completedStages) {
      for (const stage of execution.state.completedStages) {
        this.updateStageMetrics(stage, metrics);
      }
    }
    
    // Update aggregated metrics
    this.updateAggregatedMetrics(metrics);
    
    // Check alerts
    if (this.config.alertingEnabled) {
      this.checkAlertConditions(metrics);
    }
    
    // Update real-time metrics
    if (this.config.realtimeMonitoring) {
      this.updateRealtimeMetrics(metrics);
    }
    
    this.emit('execution:tracked', metrics);
    
    return metrics;
  }
  
  /**
   * Track stage execution
   */
  trackStageExecution(stage, execution, result) {
    const timestamp = Date.now();
    
    const metrics = {
      stageId: stage.id || stage.name,
      pipelineId: execution.pipelineId,
      executionId: execution.id,
      timestamp,
      duration: result.duration || 0,
      status: result.error ? 'failed' : 'completed',
      dataProcessed: result.result?.length || 0,
      error: result.error
    };
    
    // Store stage metrics
    const stageKey = `${execution.pipelineId}_${stage.id || stage.name}`;
    
    if (!this.stageMetrics.has(stageKey)) {
      this.stageMetrics.set(stageKey, []);
    }
    
    const history = this.stageMetrics.get(stageKey);
    history.push(metrics);
    
    // Maintain retention period
    this.pruneOldData(history);
    
    this.emit('stage:tracked', metrics);
    
    return metrics;
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport(pipelineId, options = {}) {
    const report = {
      id: this.generateReportId(),
      pipelineId,
      timestamp: Date.now(),
      period: options.period || { start: Date.now() - 86400000, end: Date.now() },
      sections: {}
    };
    
    // Executive summary
    report.sections.summary = this.generateExecutiveSummary(pipelineId, report.period);
    
    // Performance metrics
    report.sections.performance = this.generatePerformanceMetrics(pipelineId, report.period);
    
    // Resource utilization
    report.sections.resources = this.generateResourceMetrics(pipelineId, report.period);
    
    // Error analysis
    report.sections.errors = this.generateErrorAnalysis(pipelineId, report.period);
    
    // Stage analysis
    report.sections.stages = this.generateStageAnalysis(pipelineId, report.period);
    
    // Trends
    report.sections.trends = this.generateTrendsAnalysis(pipelineId, report.period);
    
    // Recommendations
    report.sections.recommendations = this.generateRecommendations(report.sections);
    
    // Store report
    this.reports.set(report.id, report);
    
    this.emit('report:generated', report);
    
    return report;
  }
  
  /**
   * Create analytics dashboard
   */
  createDashboard(name, config) {
    const dashboard = {
      id: this.generateDashboardId(),
      name,
      widgets: config.widgets || [],
      layout: config.layout || 'grid',
      refreshInterval: config.refreshInterval || 60000,
      filters: config.filters || {},
      data: new Map(),
      state: 'active'
    };
    
    // Initialize widgets
    for (const widget of dashboard.widgets) {
      this.initializeWidget(dashboard, widget);
    }
    
    // Start data refresh
    dashboard.refreshTimer = setInterval(() => {
      this.refreshDashboard(dashboard);
    }, dashboard.refreshInterval);
    
    this.dashboards.set(dashboard.id, dashboard);
    
    this.emit('dashboard:created', dashboard);
    
    return dashboard;
  }
  
  /**
   * Perform predictive analysis
   */
  async performPredictiveAnalysis(pipelineId, horizon = 24 * 3600000) {
    if (!this.config.predictiveAnalytics) {
      return null;
    }
    
    const prediction = {
      id: this.generatePredictionId(),
      pipelineId,
      horizon,
      timestamp: Date.now(),
      predictions: {},
      confidence: 0
    };
    
    try {
      // Get historical data
      const history = this.getPipelineHistory(pipelineId);
      
      if (history.length < 10) {
        throw new Error('Insufficient historical data for prediction');
      }
      
      // Predict execution time
      prediction.predictions.executionTime = this.predictExecutionTime(history, horizon);
      
      // Predict throughput
      prediction.predictions.throughput = this.predictThroughput(history, horizon);
      
      // Predict error rate
      prediction.predictions.errorRate = this.predictErrorRate(history, horizon);
      
      // Predict resource usage
      prediction.predictions.resourceUsage = this.predictResourceUsage(history, horizon);
      
      // Calculate confidence
      prediction.confidence = this.calculatePredictionConfidence(history, prediction.predictions);
      
      // Store prediction
      this.predictions.set(prediction.id, prediction);
      
      this.emit('prediction:generated', prediction);
      
      return prediction;
      
    } catch (error) {
      logger.error('Predictive analysis failed:', error);
      return null;
    }
  }
  
  /**
   * Detect anomalies
   */
  detectAnomalies(pipelineId) {
    const history = this.getPipelineHistory(pipelineId);
    
    if (history.length < 20) {
      return [];
    }
    
    const anomalies = [];
    
    // Calculate baseline statistics
    const baseline = this.calculateBaseline(history);
    
    // Check recent executions for anomalies
    const recent = history.slice(-5);
    
    for (const execution of recent) {
      // Check execution time
      if (Math.abs(execution.duration - baseline.duration.mean) > baseline.duration.stdDev * 3) {
        anomalies.push({
          type: 'execution-time',
          executionId: execution.id,
          value: execution.duration,
          expected: baseline.duration.mean,
          deviation: Math.abs(execution.duration - baseline.duration.mean) / baseline.duration.stdDev
        });
      }
      
      // Check error rate
      if (execution.errors.length > baseline.errorRate * 3) {
        anomalies.push({
          type: 'error-rate',
          executionId: execution.id,
          value: execution.errors.length,
          expected: baseline.errorRate,
          severity: 'high'
        });
      }
      
      // Check resource usage
      if (execution.resources.cpu > baseline.cpu.mean + baseline.cpu.stdDev * 3) {
        anomalies.push({
          type: 'cpu-usage',
          executionId: execution.id,
          value: execution.resources.cpu,
          expected: baseline.cpu.mean,
          severity: 'medium'
        });
      }
    }
    
    // Store anomalies
    if (anomalies.length > 0) {
      const anomalyReport = {
        id: this.generateAnomalyId(),
        pipelineId,
        timestamp: Date.now(),
        anomalies,
        baseline
      };
      
      this.anomalies.set(anomalyReport.id, anomalyReport);
      
      // Create alert
      if (this.config.alertingEnabled) {
        this.createAlert('anomaly-detected', anomalyReport);
      }
      
      this.emit('anomaly:detected', anomalyReport);
    }
    
    return anomalies;
  }
  
  /**
   * Create alert
   */
  createAlert(type, data) {
    const alert = {
      id: this.generateAlertId(),
      type,
      timestamp: Date.now(),
      data,
      severity: this.determineAlertSeverity(type, data),
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.set(alert.id, alert);
    
    // Send notification
    this.sendNotification(alert);
    
    this.emit('alert:created', alert);
    
    return alert;
  }
  
  /**
   * Get pipeline statistics
   */
  getPipelineStatistics(pipelineId, period) {
    const history = this.getPipelineHistory(pipelineId, period);
    
    if (history.length === 0) {
      return null;
    }
    
    return {
      pipelineId,
      period,
      executions: history.length,
      successRate: this.calculateSuccessRate(history),
      errorRate: this.calculateErrorRate(history),
      averageDuration: this.calculateAverageDuration(history),
      throughput: this.calculateThroughput(history),
      percentiles: {
        p50: this.calculatePercentile(history, 'duration', 50),
        p95: this.calculatePercentile(history, 'duration', 95),
        p99: this.calculatePercentile(history, 'duration', 99)
      },
      resourceUsage: this.calculateAverageResourceUsage(history),
      topErrors: this.getTopErrors(history)
    };
  }
  
  /**
   * Compare pipelines
   */
  comparePipelines(pipelineIds, period) {
    const comparison = {
      id: this.generateComparisonId(),
      pipelines: pipelineIds,
      period,
      timestamp: Date.now(),
      metrics: {}
    };
    
    // Collect metrics for each pipeline
    for (const pipelineId of pipelineIds) {
      const stats = this.getPipelineStatistics(pipelineId, period);
      
      if (stats) {
        comparison.metrics[pipelineId] = stats;
      }
    }
    
    // Calculate comparative metrics
    comparison.analysis = this.analyzeComparison(comparison.metrics);
    
    // Store comparison
    this.comparativeAnalysis.set(comparison.id, comparison);
    
    this.emit('comparison:generated', comparison);
    
    return comparison;
  }
  
  /**
   * Helper methods
   */
  
  startTrackingLoop() {
    setInterval(() => {
      this.aggregateMetrics();
      this.cleanupOldData();
      
      if (this.config.predictiveAnalytics) {
        this.updatePredictions();
      }
    }, this.config.trackingInterval);
  }
  
  setupDefaultAlertRules() {
    // High error rate
    this.alertRules.set('high-error-rate', {
      condition: (metrics) => metrics.errorRate > 10,
      severity: 'high',
      message: 'Error rate exceeds 10%'
    });
    
    // Low throughput
    this.alertRules.set('low-throughput', {
      condition: (metrics) => metrics.throughput < 10,
      severity: 'medium',
      message: 'Throughput below 10 items/second'
    });
    
    // High latency
    this.alertRules.set('high-latency', {
      condition: (metrics) => metrics.latency > 5000,
      severity: 'medium',
      message: 'Latency exceeds 5 seconds'
    });
    
    // Resource exhaustion
    this.alertRules.set('resource-exhaustion', {
      condition: (metrics) => metrics.resources?.cpu > 90 || metrics.resources?.memory > 90,
      severity: 'high',
      message: 'Resource usage exceeds 90%'
    });
  }
  
  startRealtimeMonitoring() {
    // Initialize real-time monitoring
    logger.info('🔴 Real-time monitoring started');
  }
  
  initializePredictiveModels() {
    // Initialize predictive models
    logger.info('🤖 Predictive analytics initialized');
  }
  
  updatePipelineMetrics(pipelineId, metrics) {
    if (!this.pipelineMetrics.has(pipelineId)) {
      this.pipelineMetrics.set(pipelineId, []);
    }
    
    const history = this.pipelineMetrics.get(pipelineId);
    history.push(metrics);
    
    this.pruneOldData(history);
  }
  
  updateStageMetrics(stage, metrics) {
    this.metrics.totalStagesExecuted++;
  }
  
  updateAggregatedMetrics(metrics) {
    this.metrics.totalExecutions++;
    
    if (metrics.status === 'completed') {
      this.metrics.successRate = 
        (this.metrics.successRate * (this.metrics.totalExecutions - 1) + 1) / 
        this.metrics.totalExecutions;
    } else {
      this.metrics.successRate = 
        (this.metrics.successRate * (this.metrics.totalExecutions - 1)) / 
        this.metrics.totalExecutions;
    }
    
    this.metrics.errorRate = 100 - this.metrics.successRate * 100;
    
    // Update average latency
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalExecutions - 1) + metrics.duration) / 
      this.metrics.totalExecutions;
  }
  
  checkAlertConditions(metrics) {
    for (const [name, rule] of this.alertRules) {
      if (rule.condition(metrics)) {
        this.createAlert(name, {
          metrics,
          rule,
          message: rule.message
        });
      }
    }
  }
  
  updateRealtimeMetrics(metrics) {
    this.realtimeMetrics.set(metrics.pipelineId, {
      lastUpdate: Date.now(),
      metrics
    });
    
    this.emit('realtime:update', metrics);
  }
  
  pruneOldData(history) {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    while (history.length > 0 && history[0].timestamp < cutoff) {
      history.shift();
    }
  }
  
  getPipelineHistory(pipelineId, period) {
    const history = this.pipelineMetrics.get(pipelineId) || [];
    
    if (!period) {
      return history;
    }
    
    return history.filter(m => 
      m.timestamp >= period.start && m.timestamp <= period.end
    );
  }
  
  generateExecutiveSummary(pipelineId, period) {
    const history = this.getPipelineHistory(pipelineId, period);
    
    return {
      totalExecutions: history.length,
      successRate: this.calculateSuccessRate(history),
      averageDuration: this.calculateAverageDuration(history),
      totalDataProcessed: history.reduce((sum, m) => sum + m.dataProcessed, 0),
      totalErrors: history.reduce((sum, m) => sum + m.errors.length, 0)
    };
  }
  
  generatePerformanceMetrics(pipelineId, period) {
    const history = this.getPipelineHistory(pipelineId, period);
    
    return {
      throughput: this.calculateThroughput(history),
      latency: {
        average: this.calculateAverageDuration(history),
        min: Math.min(...history.map(m => m.duration)),
        max: Math.max(...history.map(m => m.duration)),
        p50: this.calculatePercentile(history, 'duration', 50),
        p95: this.calculatePercentile(history, 'duration', 95),
        p99: this.calculatePercentile(history, 'duration', 99)
      },
      concurrency: this.calculateAverageConcurrency(history)
    };
  }
  
  generateResourceMetrics(pipelineId, period) {
    const history = this.getPipelineHistory(pipelineId, period);
    
    return {
      cpu: {
        average: this.calculateAverage(history, m => m.resources.cpu),
        peak: Math.max(...history.map(m => m.resources.cpu)),
        utilization: this.calculateResourceUtilization(history, 'cpu')
      },
      memory: {
        average: this.calculateAverage(history, m => m.resources.memory),
        peak: Math.max(...history.map(m => m.resources.memory)),
        utilization: this.calculateResourceUtilization(history, 'memory')
      },
      io: {
        average: this.calculateAverage(history, m => m.resources.io),
        peak: Math.max(...history.map(m => m.resources.io)),
        operations: history.reduce((sum, m) => sum + m.resources.io, 0)
      }
    };
  }
  
  generateErrorAnalysis(pipelineId, period) {
    const history = this.getPipelineHistory(pipelineId, period);
    const errors = [];
    
    for (const execution of history) {
      for (const error of execution.errors) {
        errors.push({
          executionId: execution.id,
          timestamp: execution.timestamp,
          stage: error.stage,
          message: error.error
        });
      }
    }
    
    return {
      totalErrors: errors.length,
      errorRate: this.calculateErrorRate(history),
      topErrors: this.groupAndSortErrors(errors),
      errorTimeline: this.createErrorTimeline(errors)
    };
  }
  
  generateStageAnalysis(pipelineId, period) {
    const stages = new Map();
    
    // Collect stage metrics
    for (const [key, history] of this.stageMetrics) {
      if (key.startsWith(pipelineId)) {
        const stageName = key.replace(`${pipelineId}_`, '');
        const stageHistory = history.filter(m => 
          m.timestamp >= period.start && m.timestamp <= period.end
        );
        
        stages.set(stageName, {
          executions: stageHistory.length,
          averageDuration: this.calculateAverageDuration(stageHistory),
          errorRate: this.calculateErrorRate(stageHistory),
          dataProcessed: stageHistory.reduce((sum, m) => sum + m.dataProcessed, 0)
        });
      }
    }
    
    return {
      stages: Array.from(stages.entries()).map(([name, metrics]) => ({
        name,
        ...metrics
      })),
      slowestStages: this.identifySlowestStages(stages),
      errorProneStages: this.identifyErrorProneStages(stages)
    };
  }
  
  generateTrendsAnalysis(pipelineId, period) {
    const history = this.getPipelineHistory(pipelineId, period);
    
    // Group by time buckets
    const buckets = this.groupByTimeBuckets(history, 'hour');
    
    return {
      throughputTrend: this.calculateTrend(buckets, 'throughput'),
      latencyTrend: this.calculateTrend(buckets, 'latency'),
      errorRateTrend: this.calculateTrend(buckets, 'errorRate'),
      resourceTrend: this.calculateTrend(buckets, 'resources')
    };
  }
  
  generateRecommendations(sections) {
    const recommendations = [];
    
    // Performance recommendations
    if (sections.performance.latency.p95 > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider optimizing slow stages or enabling parallelization',
        impact: 'Could reduce P95 latency by up to 50%'
      });
    }
    
    // Resource recommendations
    if (sections.resources.cpu.utilization > 80) {
      recommendations.push({
        type: 'resources',
        priority: 'high',
        message: 'CPU utilization is high, consider scaling horizontally',
        impact: 'Improve throughput and reduce latency'
      });
    }
    
    // Error recommendations
    if (sections.errors.errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        message: 'High error rate detected, review error handling and retry logic',
        impact: 'Improve reliability and success rate'
      });
    }
    
    return recommendations;
  }
  
  initializeWidget(dashboard, widget) {
    widget.data = [];
    widget.lastUpdate = Date.now();
    
    // Set up data source
    switch (widget.type) {
      case 'metric':
        widget.dataSource = () => this.getMetricValue(widget.metric);
        break;
      case 'chart':
        widget.dataSource = () => this.getChartData(widget.metric, widget.period);
        break;
      case 'table':
        widget.dataSource = () => this.getTableData(widget.source);
        break;
      case 'gauge':
        widget.dataSource = () => this.getGaugeValue(widget.metric);
        break;
    }
  }
  
  refreshDashboard(dashboard) {
    for (const widget of dashboard.widgets) {
      if (widget.dataSource) {
        widget.data = widget.dataSource();
        widget.lastUpdate = Date.now();
      }
    }
    
    this.emit('dashboard:refreshed', dashboard);
  }
  
  predictExecutionTime(history, horizon) {
    // Simple linear regression prediction
    const times = history.map(h => h.duration);
    const trend = this.calculateLinearTrend(times);
    
    return {
      predicted: trend.intercept + trend.slope * (history.length + horizon / 3600000),
      confidence: Math.max(0, 1 - Math.abs(trend.error) / trend.intercept)
    };
  }
  
  predictThroughput(history, horizon) {
    const throughputs = history.map(h => h.dataProcessed / (h.duration / 1000));
    const trend = this.calculateLinearTrend(throughputs);
    
    return {
      predicted: Math.max(0, trend.intercept + trend.slope * (history.length + horizon / 3600000)),
      confidence: Math.max(0, 1 - Math.abs(trend.error) / trend.intercept)
    };
  }
  
  predictErrorRate(history, horizon) {
    const errorRates = history.map(h => h.errors.length > 0 ? 1 : 0);
    const rate = errorRates.reduce((sum, r) => sum + r, 0) / errorRates.length;
    
    return {
      predicted: rate * 100,
      confidence: 0.7 // Fixed confidence for simple average
    };
  }
  
  predictResourceUsage(history, horizon) {
    return {
      cpu: this.predictResource(history, 'cpu', horizon),
      memory: this.predictResource(history, 'memory', horizon),
      io: this.predictResource(history, 'io', horizon)
    };
  }
  
  predictResource(history, resource, horizon) {
    const values = history.map(h => h.resources[resource]);
    const trend = this.calculateLinearTrend(values);
    
    return {
      predicted: Math.min(100, Math.max(0, 
        trend.intercept + trend.slope * (history.length + horizon / 3600000)
      )),
      confidence: Math.max(0, 1 - Math.abs(trend.error) / trend.intercept)
    };
  }
  
  calculatePredictionConfidence(history, predictions) {
    // Average confidence across all predictions
    const confidences = [];
    
    if (predictions.executionTime) confidences.push(predictions.executionTime.confidence);
    if (predictions.throughput) confidences.push(predictions.throughput.confidence);
    if (predictions.errorRate) confidences.push(predictions.errorRate.confidence);
    
    if (predictions.resourceUsage) {
      confidences.push(predictions.resourceUsage.cpu.confidence);
      confidences.push(predictions.resourceUsage.memory.confidence);
    }
    
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }
  
  calculateBaseline(history) {
    return {
      duration: {
        mean: this.calculateAverage(history, h => h.duration),
        stdDev: this.calculateStandardDeviation(history, h => h.duration)
      },
      errorRate: history.filter(h => h.errors.length > 0).length / history.length,
      cpu: {
        mean: this.calculateAverage(history, h => h.resources.cpu),
        stdDev: this.calculateStandardDeviation(history, h => h.resources.cpu)
      },
      memory: {
        mean: this.calculateAverage(history, h => h.resources.memory),
        stdDev: this.calculateStandardDeviation(history, h => h.resources.memory)
      }
    };
  }
  
  determineAlertSeverity(type, data) {
    const rule = this.alertRules.get(type);
    
    if (rule) {
      return rule.severity;
    }
    
    // Default severity based on type
    if (type.includes('critical') || type.includes('failure')) {
      return 'critical';
    } else if (type.includes('error') || type.includes('anomaly')) {
      return 'high';
    } else if (type.includes('warning')) {
      return 'medium';
    }
    
    return 'low';
  }
  
  sendNotification(alert) {
    // Store notification
    this.notifications.set(alert.id, {
      alertId: alert.id,
      timestamp: Date.now(),
      sent: true
    });
    
    logger.warn(`🔔 Alert: ${alert.type} - ${alert.data.message || 'Check dashboard for details'}`);
  }
  
  calculateSuccessRate(history) {
    if (history.length === 0) return 0;
    
    const successful = history.filter(h => h.status === 'completed').length;
    return (successful / history.length) * 100;
  }
  
  calculateErrorRate(history) {
    if (history.length === 0) return 0;
    
    const errors = history.filter(h => h.errors && h.errors.length > 0).length;
    return (errors / history.length) * 100;
  }
  
  calculateAverageDuration(history) {
    if (history.length === 0) return 0;
    
    return this.calculateAverage(history, h => h.duration);
  }
  
  calculateThroughput(history) {
    if (history.length === 0) return 0;
    
    const totalData = history.reduce((sum, h) => sum + (h.dataProcessed || 0), 0);
    const totalTime = history.reduce((sum, h) => sum + (h.duration || 0), 0);
    
    return totalTime > 0 ? (totalData / (totalTime / 1000)) : 0;
  }
  
  calculatePercentile(history, field, percentile) {
    if (history.length === 0) return 0;
    
    const values = history.map(h => h[field] || 0).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    
    return values[index] || 0;
  }
  
  calculateAverageResourceUsage(history) {
    return {
      cpu: this.calculateAverage(history, h => h.resources?.cpu || 0),
      memory: this.calculateAverage(history, h => h.resources?.memory || 0),
      io: this.calculateAverage(history, h => h.resources?.io || 0)
    };
  }
  
  getTopErrors(history) {
    const errors = {};
    
    for (const execution of history) {
      for (const error of execution.errors || []) {
        const key = error.error || 'Unknown error';
        errors[key] = (errors[key] || 0) + 1;
      }
    }
    
    return Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }
  
  analyzeComparison(metrics) {
    const pipelineIds = Object.keys(metrics);
    
    if (pipelineIds.length < 2) {
      return null;
    }
    
    return {
      bestPerformer: this.findBestPerformer(metrics),
      worstPerformer: this.findWorstPerformer(metrics),
      recommendations: this.generateComparativeRecommendations(metrics)
    };
  }
  
  findBestPerformer(metrics) {
    let best = null;
    let bestScore = -Infinity;
    
    for (const [pipelineId, stats] of Object.entries(metrics)) {
      const score = stats.successRate - stats.averageDuration / 1000;
      
      if (score > bestScore) {
        bestScore = score;
        best = pipelineId;
      }
    }
    
    return best;
  }
  
  findWorstPerformer(metrics) {
    let worst = null;
    let worstScore = Infinity;
    
    for (const [pipelineId, stats] of Object.entries(metrics)) {
      const score = stats.successRate - stats.averageDuration / 1000;
      
      if (score < worstScore) {
        worstScore = score;
        worst = pipelineId;
      }
    }
    
    return worst;
  }
  
  generateComparativeRecommendations(metrics) {
    const recommendations = [];
    const best = this.findBestPerformer(metrics);
    const worst = this.findWorstPerformer(metrics);
    
    if (best && worst && best !== worst) {
      recommendations.push({
        type: 'optimization',
        message: `Consider applying optimizations from ${best} to ${worst}`,
        impact: 'Could improve performance significantly'
      });
    }
    
    return recommendations;
  }
  
  aggregateMetrics() {
    // Aggregate metrics at different levels
    for (const level of this.config.aggregationLevels) {
      this.aggregateAtLevel(level);
    }
  }
  
  aggregateAtLevel(level) {
    // Aggregate metrics at specified level (minute, hour, day)
    const bucketSize = this.getBucketSize(level);
    const now = Date.now();
    const bucketKey = Math.floor(now / bucketSize) * bucketSize;
    
    // Aggregate pipeline metrics
    for (const [pipelineId, history] of this.pipelineMetrics) {
      const bucket = history.filter(m => 
        m.timestamp >= bucketKey && m.timestamp < bucketKey + bucketSize
      );
      
      if (bucket.length > 0) {
        const aggregated = {
          level,
          bucket: bucketKey,
          pipelineId,
          executions: bucket.length,
          successRate: this.calculateSuccessRate(bucket),
          averageDuration: this.calculateAverageDuration(bucket),
          throughput: this.calculateThroughput(bucket)
        };
        
        const key = `${level}_${pipelineId}_${bucketKey}`;
        this.aggregatedMetrics.set(key, aggregated);
      }
    }
  }
  
  getBucketSize(level) {
    switch (level) {
      case 'minute': return 60000;
      case 'hour': return 3600000;
      case 'day': return 86400000;
      default: return 60000;
    }
  }
  
  cleanupOldData() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // Clean up execution metrics
    for (const [id, metrics] of this.executionMetrics) {
      if (metrics.timestamp < cutoff) {
        this.executionMetrics.delete(id);
      }
    }
    
    // Clean up aggregated metrics
    for (const [key, metrics] of this.aggregatedMetrics) {
      if (metrics.bucket < cutoff) {
        this.aggregatedMetrics.delete(key);
      }
    }
  }
  
  updatePredictions() {
    // Update predictions for active pipelines
    for (const [pipelineId] of this.pipelineMetrics) {
      this.performPredictiveAnalysis(pipelineId);
    }
  }
  
  calculateAverage(data, accessor = (d) => d) {
    if (data.length === 0) return 0;
    
    const sum = data.reduce((acc, item) => acc + accessor(item), 0);
    return sum / data.length;
  }
  
  calculateStandardDeviation(data, accessor = (d) => d) {
    if (data.length === 0) return 0;
    
    const mean = this.calculateAverage(data, accessor);
    const squaredDiffs = data.map(item => Math.pow(accessor(item) - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / data.length;
    
    return Math.sqrt(variance);
  }
  
  calculateLinearTrend(values) {
    if (values.length < 2) {
      return { slope: 0, intercept: values[0] || 0, error: 0 };
    }
    
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate error
    const predictions = values.map((_, i) => slope * i + intercept);
    const errors = values.map((v, i) => Math.abs(v - predictions[i]));
    const error = errors.reduce((sum, e) => sum + e, 0) / n;
    
    return { slope, intercept, error };
  }
  
  calculateAverageConcurrency(history) {
    // Calculate average number of concurrent executions
    if (history.length === 0) return 0;
    
    let overlaps = 0;
    
    for (let i = 0; i < history.length; i++) {
      for (let j = i + 1; j < history.length; j++) {
        const a = history[i];
        const b = history[j];
        
        if (a.startTime <= b.endTime && b.startTime <= a.endTime) {
          overlaps++;
        }
      }
    }
    
    return overlaps / history.length;
  }
  
  calculateResourceUtilization(history, resource) {
    if (history.length === 0) return 0;
    
    const totalTime = history.reduce((sum, h) => sum + h.duration, 0);
    const totalUsage = history.reduce((sum, h) => sum + h.resources[resource] * h.duration, 0);
    
    return totalTime > 0 ? (totalUsage / totalTime) : 0;
  }
  
  groupAndSortErrors(errors) {
    const grouped = {};
    
    for (const error of errors) {
      const key = error.message;
      
      if (!grouped[key]) {
        grouped[key] = {
          message: key,
          count: 0,
          stages: new Set()
        };
      }
      
      grouped[key].count++;
      if (error.stage) {
        grouped[key].stages.add(error.stage);
      }
    }
    
    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(g => ({
        ...g,
        stages: Array.from(g.stages)
      }));
  }
  
  createErrorTimeline(errors) {
    // Group errors by hour
    const timeline = {};
    
    for (const error of errors) {
      const hour = Math.floor(error.timestamp / 3600000) * 3600000;
      
      if (!timeline[hour]) {
        timeline[hour] = 0;
      }
      
      timeline[hour]++;
    }
    
    return Object.entries(timeline)
      .map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  identifySlowestStages(stages) {
    return Array.from(stages.entries())
      .sort((a, b) => b[1].averageDuration - a[1].averageDuration)
      .slice(0, 3)
      .map(([name, metrics]) => ({ name, duration: metrics.averageDuration }));
  }
  
  identifyErrorProneStages(stages) {
    return Array.from(stages.entries())
      .filter(([, metrics]) => metrics.errorRate > 0)
      .sort((a, b) => b[1].errorRate - a[1].errorRate)
      .slice(0, 3)
      .map(([name, metrics]) => ({ name, errorRate: metrics.errorRate }));
  }
  
  groupByTimeBuckets(history, bucketSize) {
    const buckets = {};
    const size = this.getBucketSize(bucketSize);
    
    for (const item of history) {
      const bucket = Math.floor(item.timestamp / size) * size;
      
      if (!buckets[bucket]) {
        buckets[bucket] = [];
      }
      
      buckets[bucket].push(item);
    }
    
    return buckets;
  }
  
  calculateTrend(buckets, metric) {
    const points = [];
    
    for (const [timestamp, items] of Object.entries(buckets)) {
      let value;
      
      switch (metric) {
        case 'throughput':
          value = this.calculateThroughput(items);
          break;
        case 'latency':
          value = this.calculateAverageDuration(items);
          break;
        case 'errorRate':
          value = this.calculateErrorRate(items);
          break;
        case 'resources':
          value = this.calculateAverageResourceUsage(items);
          break;
        default:
          value = 0;
      }
      
      points.push({ timestamp: parseInt(timestamp), value });
    }
    
    return points.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  getMetricValue(metric) {
    return this.metrics[metric] || 0;
  }
  
  getChartData(metric, period) {
    // Get chart data for metric
    const history = [];
    
    for (const [, metrics] of this.pipelineMetrics) {
      history.push(...metrics);
    }
    
    return this.groupByTimeBuckets(history, 'hour');
  }
  
  getTableData(source) {
    // Get table data for source
    switch (source) {
      case 'pipelines':
        return Array.from(this.pipelineMetrics.keys()).map(id => ({
          id,
          executions: this.pipelineMetrics.get(id).length
        }));
      case 'alerts':
        return Array.from(this.alerts.values()).slice(-10);
      default:
        return [];
    }
  }
  
  getGaugeValue(metric) {
    // Get gauge value for metric
    switch (metric) {
      case 'successRate':
        return this.metrics.successRate * 100;
      case 'errorRate':
        return this.metrics.errorRate;
      case 'throughput':
        return this.metrics.averageThroughput;
      default:
        return 0;
    }
  }
  
  /**
   * Generate IDs
   */
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateDashboardId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generatePredictionId() {
    return `pred_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateAnomalyId() {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateComparisonId() {
    return `compare_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      pipelinesTracked: this.pipelineMetrics.size,
      executionsTracked: this.executionMetrics.size,
      activeAlerts: this.alerts.size,
      dashboards: this.dashboards.size,
      reports: this.reports.size,
      predictions: this.predictions.size
    };
  }
}

module.exports = PipelineAnalytics;