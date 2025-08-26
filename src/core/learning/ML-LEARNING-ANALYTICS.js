/**
 * BUMBA ML Learning Analytics
 * Advanced analytics and performance tracking for ML systems
 * Part of ML Learning System enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Analytics system for ML learning performance
 */
class MLLearningAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      trackingInterval: config.trackingInterval || 1000,
      aggregationWindow: config.aggregationWindow || 60000,
      alertThresholds: config.alertThresholds || {},
      anomalyDetection: config.anomalyDetection !== false,
      predictiveAnalytics: config.predictiveAnalytics !== false,
      realtimeTracking: config.realtimeTracking !== false,
      ...config
    };
    
    // Metrics storage
    this.metrics = {
      models: new Map(),
      training: new Map(),
      inference: new Map(),
      optimization: new Map(),
      resources: new Map()
    };
    
    // Performance tracking
    this.performanceData = {
      accuracy: [],
      loss: [],
      throughput: [],
      latency: [],
      resourceUtilization: []
    };
    
    // Anomaly detection
    this.anomalyDetector = {
      thresholds: new Map(),
      history: [],
      patterns: []
    };
    
    // Predictive analytics
    this.predictions = {
      convergence: new Map(),
      performance: new Map(),
      resources: new Map()
    };
    
    // Real-time monitoring
    this.realtime = {
      activeModels: new Map(),
      activeTraining: new Map(),
      alerts: []
    };
    
    // Reports
    this.reports = new Map();
    this.dashboards = new Map();
    
    // Statistics
    this.statistics = {
      totalModels: 0,
      totalTrainingRuns: 0,
      totalInferences: 0,
      averageAccuracy: 0,
      averageLoss: 0,
      totalTrainingTime: 0,
      totalInferenceTime: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize analytics system
   */
  initialize() {
    this.startTracking();
    this.initializeAnomalyDetection();
    this.setupAlertSystem();
    
    logger.info('📊 ML Learning Analytics initialized');
  }
  
  /**
   * Track model metrics
   */
  trackModel(modelId, metrics) {
    const timestamp = Date.now();
    
    if (!this.metrics.models.has(modelId)) {
      this.metrics.models.set(modelId, {
        id: modelId,
        created: timestamp,
        history: [],
        aggregates: {}
      });
    }
    
    const modelMetrics = this.metrics.models.get(modelId);
    
    // Add to history
    modelMetrics.history.push({
      timestamp,
      ...metrics
    });
    
    // Update aggregates
    this.updateAggregates(modelMetrics, metrics);
    
    // Check for anomalies
    if (this.config.anomalyDetection) {
      this.detectAnomalies(modelId, metrics);
    }
    
    // Update predictions
    if (this.config.predictiveAnalytics) {
      this.updatePredictions(modelId, metrics);
    }
    
    // Real-time tracking
    if (this.config.realtimeTracking) {
      this.updateRealtime(modelId, metrics);
    }
    
    this.statistics.totalModels = this.metrics.models.size;
    
    this.emit('model:tracked', { modelId, metrics, timestamp });
  }
  
  /**
   * Track training metrics
   */
  trackTraining(trainingId, metrics) {
    const timestamp = Date.now();
    
    if (!this.metrics.training.has(trainingId)) {
      this.metrics.training.set(trainingId, {
        id: trainingId,
        started: timestamp,
        epochs: [],
        batches: [],
        losses: [],
        accuracies: []
      });
      
      this.statistics.totalTrainingRuns++;
    }
    
    const trainingMetrics = this.metrics.training.get(trainingId);
    
    // Track epoch metrics
    if (metrics.epoch !== undefined) {
      trainingMetrics.epochs.push({
        epoch: metrics.epoch,
        loss: metrics.loss,
        accuracy: metrics.accuracy,
        timestamp
      });
      
      trainingMetrics.losses.push(metrics.loss);
      trainingMetrics.accuracies.push(metrics.accuracy);
    }
    
    // Track batch metrics
    if (metrics.batch !== undefined) {
      trainingMetrics.batches.push({
        batch: metrics.batch,
        loss: metrics.batchLoss,
        timestamp
      });
    }
    
    // Update performance data
    if (metrics.loss !== undefined) {
      this.performanceData.loss.push({
        value: metrics.loss,
        timestamp,
        trainingId
      });
    }
    
    if (metrics.accuracy !== undefined) {
      this.performanceData.accuracy.push({
        value: metrics.accuracy,
        timestamp,
        trainingId
      });
    }
    
    // Check convergence
    if (this.config.predictiveAnalytics) {
      this.predictConvergence(trainingId, trainingMetrics);
    }
    
    // Update statistics
    this.updateStatistics();
    
    this.emit('training:tracked', { trainingId, metrics, timestamp });
  }
  
  /**
   * Track inference metrics
   */
  trackInference(modelId, metrics) {
    const timestamp = Date.now();
    
    if (!this.metrics.inference.has(modelId)) {
      this.metrics.inference.set(modelId, {
        modelId,
        totalInferences: 0,
        latencies: [],
        throughput: []
      });
    }
    
    const inferenceMetrics = this.metrics.inference.get(modelId);
    
    // Update counters
    inferenceMetrics.totalInferences++;
    this.statistics.totalInferences++;
    
    // Track latency
    if (metrics.latency !== undefined) {
      inferenceMetrics.latencies.push(metrics.latency);
      
      this.performanceData.latency.push({
        value: metrics.latency,
        timestamp,
        modelId
      });
    }
    
    // Track throughput
    if (metrics.throughput !== undefined) {
      inferenceMetrics.throughput.push(metrics.throughput);
      
      this.performanceData.throughput.push({
        value: metrics.throughput,
        timestamp,
        modelId
      });
    }
    
    // Calculate rolling averages
    const recentLatencies = inferenceMetrics.latencies.slice(-100);
    inferenceMetrics.averageLatency = 
      recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
    
    // Check SLA violations
    this.checkSLA(modelId, metrics);
    
    this.emit('inference:tracked', { modelId, metrics, timestamp });
  }
  
  /**
   * Track optimization metrics
   */
  trackOptimization(optimizationId, metrics) {
    const timestamp = Date.now();
    
    if (!this.metrics.optimization.has(optimizationId)) {
      this.metrics.optimization.set(optimizationId, {
        id: optimizationId,
        started: timestamp,
        iterations: [],
        improvements: []
      });
    }
    
    const optimizationMetrics = this.metrics.optimization.get(optimizationId);
    
    // Track iteration
    optimizationMetrics.iterations.push({
      iteration: metrics.iteration,
      objective: metrics.objective,
      parameters: metrics.parameters,
      timestamp
    });
    
    // Track improvements
    if (metrics.improvement !== undefined) {
      optimizationMetrics.improvements.push({
        improvement: metrics.improvement,
        iteration: metrics.iteration,
        timestamp
      });
    }
    
    // Predict optimization completion
    if (this.config.predictiveAnalytics) {
      this.predictOptimizationCompletion(optimizationId, optimizationMetrics);
    }
    
    this.emit('optimization:tracked', { optimizationId, metrics, timestamp });
  }
  
  /**
   * Track resource utilization
   */
  trackResources(metrics) {
    const timestamp = Date.now();
    
    this.performanceData.resourceUtilization.push({
      cpu: metrics.cpu,
      memory: metrics.memory,
      gpu: metrics.gpu,
      timestamp
    });
    
    // Check resource alerts
    if (metrics.cpu > (this.config.alertThresholds.cpu || 80)) {
      this.raiseAlert('HIGH_CPU', `CPU usage: ${metrics.cpu}%`);
    }
    
    if (metrics.memory > (this.config.alertThresholds.memory || 80)) {
      this.raiseAlert('HIGH_MEMORY', `Memory usage: ${metrics.memory}%`);
    }
    
    if (metrics.gpu > (this.config.alertThresholds.gpu || 90)) {
      this.raiseAlert('HIGH_GPU', `GPU usage: ${metrics.gpu}%`);
    }
    
    this.emit('resources:tracked', { metrics, timestamp });
  }
  
  /**
   * Anomaly Detection
   */
  
  detectAnomalies(modelId, metrics) {
    const threshold = this.getAnomalyThreshold(modelId);
    const anomalies = [];
    
    // Check accuracy anomalies
    if (metrics.accuracy !== undefined) {
      const expectedAccuracy = this.getExpectedAccuracy(modelId);
      const deviation = Math.abs(metrics.accuracy - expectedAccuracy);
      
      if (deviation > threshold.accuracy) {
        anomalies.push({
          type: 'accuracy',
          expected: expectedAccuracy,
          actual: metrics.accuracy,
          deviation
        });
      }
    }
    
    // Check loss anomalies
    if (metrics.loss !== undefined) {
      const expectedLoss = this.getExpectedLoss(modelId);
      const deviation = Math.abs(metrics.loss - expectedLoss);
      
      if (deviation > threshold.loss) {
        anomalies.push({
          type: 'loss',
          expected: expectedLoss,
          actual: metrics.loss,
          deviation
        });
      }
    }
    
    // Check latency anomalies
    if (metrics.latency !== undefined) {
      const expectedLatency = this.getExpectedLatency(modelId);
      const deviation = Math.abs(metrics.latency - expectedLatency);
      
      if (deviation > threshold.latency) {
        anomalies.push({
          type: 'latency',
          expected: expectedLatency,
          actual: metrics.latency,
          deviation
        });
      }
    }
    
    if (anomalies.length > 0) {
      this.anomalyDetector.history.push({
        modelId,
        anomalies,
        timestamp: Date.now()
      });
      
      this.emit('anomaly:detected', { modelId, anomalies });
      
      // Raise alerts for critical anomalies
      anomalies.forEach(anomaly => {
        if (anomaly.deviation > threshold[anomaly.type] * 2) {
          this.raiseAlert('CRITICAL_ANOMALY', 
            `${anomaly.type} anomaly detected for model ${modelId}`);
        }
      });
    }
  }
  
  /**
   * Predictive Analytics
   */
  
  predictConvergence(trainingId, metrics) {
    if (metrics.losses.length < 5) return;
    
    // Simple linear regression for convergence prediction
    const recentLosses = metrics.losses.slice(-10);
    const trend = this.calculateTrend(recentLosses);
    
    if (Math.abs(trend) < 0.001) {
      // Model is converging
      const prediction = {
        converged: true,
        epochsToConvergence: 0,
        confidence: 0.9
      };
      
      this.predictions.convergence.set(trainingId, prediction);
      
      this.emit('convergence:predicted', { trainingId, prediction });
    } else {
      // Estimate epochs to convergence
      const currentLoss = recentLosses[recentLosses.length - 1];
      const targetLoss = this.config.convergenceThreshold || 0.01;
      const epochsToConvergence = Math.max(0, 
        Math.floor((targetLoss - currentLoss) / trend));
      
      const prediction = {
        converged: false,
        epochsToConvergence,
        confidence: Math.min(0.9, 0.5 + (10 / recentLosses.length))
      };
      
      this.predictions.convergence.set(trainingId, prediction);
      
      this.emit('convergence:predicted', { trainingId, prediction });
    }
  }
  
  predictPerformance(modelId, horizon = 10) {
    const modelMetrics = this.metrics.models.get(modelId);
    
    if (!modelMetrics || modelMetrics.history.length < 10) {
      return null;
    }
    
    // Simple moving average prediction
    const recentMetrics = modelMetrics.history.slice(-20);
    const accuracies = recentMetrics.map(m => m.accuracy).filter(a => a !== undefined);
    
    if (accuracies.length === 0) return null;
    
    const trend = this.calculateTrend(accuracies);
    const lastAccuracy = accuracies[accuracies.length - 1];
    
    const predictions = [];
    for (let i = 1; i <= horizon; i++) {
      predictions.push({
        step: i,
        accuracy: Math.min(1, Math.max(0, lastAccuracy + (trend * i))),
        confidence: Math.max(0.3, 0.9 - (i * 0.05))
      });
    }
    
    this.predictions.performance.set(modelId, predictions);
    
    return predictions;
  }
  
  predictOptimizationCompletion(optimizationId, metrics) {
    if (metrics.improvements.length < 3) return;
    
    // Check if improvements are plateauing
    const recentImprovements = metrics.improvements.slice(-5);
    const averageImprovement = recentImprovements.reduce((a, b) => 
      a + b.improvement, 0) / recentImprovements.length;
    
    if (averageImprovement < 0.001) {
      // Optimization is likely complete
      return {
        complete: true,
        iterationsRemaining: 0,
        confidence: 0.8
      };
    }
    
    // Estimate iterations remaining
    const improvementRate = this.calculateTrend(
      recentImprovements.map(i => i.improvement)
    );
    
    const iterationsRemaining = Math.max(0,
      Math.floor(0.001 / Math.abs(improvementRate)));
    
    return {
      complete: false,
      iterationsRemaining,
      confidence: 0.6
    };
  }
  
  /**
   * Reporting and Dashboards
   */
  
  generateReport(type = 'summary', options = {}) {
    const report = {
      id: this.generateReportId(),
      type,
      generated: Date.now(),
      period: options.period || 'last_hour',
      data: {}
    };
    
    switch (type) {
      case 'summary':
        report.data = this.generateSummaryReport(options);
        break;
      
      case 'performance':
        report.data = this.generatePerformanceReport(options);
        break;
      
      case 'training':
        report.data = this.generateTrainingReport(options);
        break;
      
      case 'inference':
        report.data = this.generateInferenceReport(options);
        break;
      
      case 'optimization':
        report.data = this.generateOptimizationReport(options);
        break;
      
      case 'anomaly':
        report.data = this.generateAnomalyReport(options);
        break;
      
      default:
        report.data = this.generateSummaryReport(options);
    }
    
    this.reports.set(report.id, report);
    
    return report;
  }
  
  generateSummaryReport(options) {
    const timeRange = this.getTimeRange(options.period);
    
    return {
      statistics: { ...this.statistics },
      activeModels: this.realtime.activeModels.size,
      activeTraining: this.realtime.activeTraining.size,
      recentAlerts: this.realtime.alerts.slice(-10),
      performance: {
        averageAccuracy: this.calculateAverageAccuracy(timeRange),
        averageLoss: this.calculateAverageLoss(timeRange),
        averageLatency: this.calculateAverageLatency(timeRange),
        throughput: this.calculateThroughput(timeRange)
      },
      resourceUtilization: this.calculateResourceUtilization(timeRange),
      topModels: this.getTopPerformingModels(5),
      recentAnomalies: this.anomalyDetector.history.slice(-5)
    };
  }
  
  generatePerformanceReport(options) {
    const timeRange = this.getTimeRange(options.period);
    
    return {
      accuracy: {
        current: this.getCurrentAccuracy(),
        trend: this.getAccuracyTrend(timeRange),
        distribution: this.getAccuracyDistribution(timeRange)
      },
      loss: {
        current: this.getCurrentLoss(),
        trend: this.getLossTrend(timeRange),
        distribution: this.getLossDistribution(timeRange)
      },
      latency: {
        p50: this.getPercentileLatency(50, timeRange),
        p95: this.getPercentileLatency(95, timeRange),
        p99: this.getPercentileLatency(99, timeRange),
        trend: this.getLatencyTrend(timeRange)
      },
      throughput: {
        current: this.getCurrentThroughput(),
        peak: this.getPeakThroughput(timeRange),
        average: this.calculateThroughput(timeRange)
      }
    };
  }
  
  createDashboard(name, config = {}) {
    const dashboard = {
      id: this.generateDashboardId(),
      name,
      created: Date.now(),
      config,
      widgets: [],
      refreshInterval: config.refreshInterval || 5000
    };
    
    // Add default widgets
    dashboard.widgets.push(
      this.createWidget('accuracy_chart', {
        type: 'line',
        metric: 'accuracy',
        timeRange: 'last_hour'
      }),
      this.createWidget('loss_chart', {
        type: 'line',
        metric: 'loss',
        timeRange: 'last_hour'
      }),
      this.createWidget('resource_gauge', {
        type: 'gauge',
        metrics: ['cpu', 'memory', 'gpu']
      }),
      this.createWidget('alert_list', {
        type: 'list',
        source: 'alerts',
        limit: 10
      })
    );
    
    this.dashboards.set(dashboard.id, dashboard);
    
    return dashboard;
  }
  
  /**
   * Alert System
   */
  
  setupAlertSystem() {
    // Default alert thresholds
    this.alertThresholds = {
      accuracy_drop: 0.1,
      loss_increase: 0.5,
      latency_spike: 2.0,
      cpu: 80,
      memory: 80,
      gpu: 90,
      ...this.config.alertThresholds
    };
    
    // Alert severity levels
    this.alertSeverity = {
      INFO: 0,
      WARNING: 1,
      ERROR: 2,
      CRITICAL: 3
    };
  }
  
  raiseAlert(type, message, severity = 'WARNING') {
    const alert = {
      id: this.generateAlertId(),
      type,
      message,
      severity,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.realtime.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.realtime.alerts.length > 100) {
      this.realtime.alerts = this.realtime.alerts.slice(-100);
    }
    
    this.emit('alert:raised', alert);
    
    // Log critical alerts
    if (severity === 'CRITICAL') {
      logger.error(`🔴 CRITICAL ALERT: ${type} - ${message}`);
    } else if (severity === 'ERROR') {
      logger.error(`🔴 ERROR ALERT: ${type} - ${message}`);
    } else if (severity === 'WARNING') {
      logger.warn(`🟠️ WARNING: ${type} - ${message}`);
    }
    
    return alert;
  }
  
  checkSLA(modelId, metrics) {
    const sla = this.config.sla || {};
    
    // Check latency SLA
    if (sla.maxLatency && metrics.latency > sla.maxLatency) {
      this.raiseAlert('SLA_VIOLATION', 
        `Model ${modelId} latency ${metrics.latency}ms exceeds SLA ${sla.maxLatency}ms`,
        'ERROR');
    }
    
    // Check accuracy SLA
    if (sla.minAccuracy && metrics.accuracy < sla.minAccuracy) {
      this.raiseAlert('SLA_VIOLATION',
        `Model ${modelId} accuracy ${metrics.accuracy} below SLA ${sla.minAccuracy}`,
        'ERROR');
    }
  }
  
  /**
   * Helper Methods
   */
  
  updateAggregates(modelMetrics, metrics) {
    const aggregates = modelMetrics.aggregates;
    
    // Update min/max/avg
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value !== 'number') continue;
      
      if (!aggregates[key]) {
        aggregates[key] = {
          min: value,
          max: value,
          sum: value,
          count: 1,
          avg: value
        };
      } else {
        aggregates[key].min = Math.min(aggregates[key].min, value);
        aggregates[key].max = Math.max(aggregates[key].max, value);
        aggregates[key].sum += value;
        aggregates[key].count++;
        aggregates[key].avg = aggregates[key].sum / aggregates[key].count;
      }
    }
  }
  
  updateStatistics() {
    // Calculate average accuracy
    let totalAccuracy = 0;
    let accuracyCount = 0;
    
    for (const training of this.metrics.training.values()) {
      if (training.accuracies.length > 0) {
        const lastAccuracy = training.accuracies[training.accuracies.length - 1];
        totalAccuracy += lastAccuracy;
        accuracyCount++;
      }
    }
    
    this.statistics.averageAccuracy = accuracyCount > 0 ? 
      totalAccuracy / accuracyCount : 0;
    
    // Calculate average loss
    let totalLoss = 0;
    let lossCount = 0;
    
    for (const training of this.metrics.training.values()) {
      if (training.losses.length > 0) {
        const lastLoss = training.losses[training.losses.length - 1];
        totalLoss += lastLoss;
        lossCount++;
      }
    }
    
    this.statistics.averageLoss = lossCount > 0 ?
      totalLoss / lossCount : 0;
  }
  
  updateRealtime(modelId, metrics) {
    this.realtime.activeModels.set(modelId, {
      modelId,
      lastUpdate: Date.now(),
      metrics
    });
    
    // Remove inactive models
    for (const [id, model] of this.realtime.activeModels.entries()) {
      if (Date.now() - model.lastUpdate > 60000) {
        this.realtime.activeModels.delete(id);
      }
    }
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope;
  }
  
  getAnomalyThreshold(modelId) {
    if (this.anomalyDetector.thresholds.has(modelId)) {
      return this.anomalyDetector.thresholds.get(modelId);
    }
    
    // Default thresholds
    const defaults = {
      accuracy: 0.1,
      loss: 0.5,
      latency: 50
    };
    
    this.anomalyDetector.thresholds.set(modelId, defaults);
    return defaults;
  }
  
  getExpectedAccuracy(modelId) {
    const modelMetrics = this.metrics.models.get(modelId);
    
    if (!modelMetrics || !modelMetrics.aggregates.accuracy) {
      return 0.5;
    }
    
    return modelMetrics.aggregates.accuracy.avg;
  }
  
  getExpectedLoss(modelId) {
    const modelMetrics = this.metrics.models.get(modelId);
    
    if (!modelMetrics || !modelMetrics.aggregates.loss) {
      return 1.0;
    }
    
    return modelMetrics.aggregates.loss.avg;
  }
  
  getExpectedLatency(modelId) {
    const inferenceMetrics = this.metrics.inference.get(modelId);
    
    if (!inferenceMetrics || !inferenceMetrics.averageLatency) {
      return 100;
    }
    
    return inferenceMetrics.averageLatency;
  }
  
  getTimeRange(period) {
    const now = Date.now();
    
    switch (period) {
      case 'last_minute':
        return { start: now - 60000, end: now };
      case 'last_hour':
        return { start: now - 3600000, end: now };
      case 'last_day':
        return { start: now - 86400000, end: now };
      case 'last_week':
        return { start: now - 604800000, end: now };
      default:
        return { start: now - 3600000, end: now };
    }
  }
  
  calculateAverageAccuracy(timeRange) {
    const relevantData = this.performanceData.accuracy.filter(d => 
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (relevantData.length === 0) return 0;
    
    return relevantData.reduce((sum, d) => sum + d.value, 0) / relevantData.length;
  }
  
  calculateAverageLoss(timeRange) {
    const relevantData = this.performanceData.loss.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (relevantData.length === 0) return 0;
    
    return relevantData.reduce((sum, d) => sum + d.value, 0) / relevantData.length;
  }
  
  calculateAverageLatency(timeRange) {
    const relevantData = this.performanceData.latency.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (relevantData.length === 0) return 0;
    
    return relevantData.reduce((sum, d) => sum + d.value, 0) / relevantData.length;
  }
  
  calculateThroughput(timeRange) {
    const relevantData = this.performanceData.throughput.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (relevantData.length === 0) return 0;
    
    return relevantData.reduce((sum, d) => sum + d.value, 0) / relevantData.length;
  }
  
  calculateResourceUtilization(timeRange) {
    const relevantData = this.performanceData.resourceUtilization.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (relevantData.length === 0) {
      return { cpu: 0, memory: 0, gpu: 0 };
    }
    
    return {
      cpu: relevantData.reduce((sum, d) => sum + d.cpu, 0) / relevantData.length,
      memory: relevantData.reduce((sum, d) => sum + d.memory, 0) / relevantData.length,
      gpu: relevantData.reduce((sum, d) => sum + d.gpu, 0) / relevantData.length
    };
  }
  
  getTopPerformingModels(limit = 5) {
    const models = Array.from(this.metrics.models.values())
      .filter(m => m.aggregates.accuracy)
      .sort((a, b) => b.aggregates.accuracy.avg - a.aggregates.accuracy.avg)
      .slice(0, limit);
    
    return models.map(m => ({
      id: m.id,
      accuracy: m.aggregates.accuracy.avg,
      loss: m.aggregates.loss?.avg || 0,
      inferences: this.metrics.inference.get(m.id)?.totalInferences || 0
    }));
  }
  
  getCurrentAccuracy() {
    if (this.performanceData.accuracy.length === 0) return 0;
    
    return this.performanceData.accuracy[this.performanceData.accuracy.length - 1].value;
  }
  
  getCurrentLoss() {
    if (this.performanceData.loss.length === 0) return 0;
    
    return this.performanceData.loss[this.performanceData.loss.length - 1].value;
  }
  
  getCurrentThroughput() {
    if (this.performanceData.throughput.length === 0) return 0;
    
    return this.performanceData.throughput[this.performanceData.throughput.length - 1].value;
  }
  
  getPercentileLatency(percentile, timeRange) {
    const relevantData = this.performanceData.latency
      .filter(d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end)
      .map(d => d.value)
      .sort((a, b) => a - b);
    
    if (relevantData.length === 0) return 0;
    
    const index = Math.floor((percentile / 100) * relevantData.length);
    return relevantData[Math.min(index, relevantData.length - 1)];
  }
  
  /**
   * Control Methods
   */
  
  startTracking() {
    this.trackingInterval = setInterval(() => {
      // Aggregate metrics
      this.aggregateMetrics();
      
      // Clean old data
      this.cleanOldData();
      
      // Update dashboards
      this.updateDashboards();
      
    }, this.config.trackingInterval);
    
    logger.info('📊 Analytics tracking started');
  }
  
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    logger.info('📊 Analytics tracking stopped');
  }
  
  aggregateMetrics() {
    // Aggregate recent metrics for efficiency
    const now = Date.now();
    const window = this.config.aggregationWindow;
    
    // Aggregate performance data
    for (const key of Object.keys(this.performanceData)) {
      const data = this.performanceData[key];
      
      if (data.length > 1000) {
        // Keep recent data and aggregate old data
        const recent = data.filter(d => now - d.timestamp < window);
        const old = data.filter(d => now - d.timestamp >= window);
        
        if (old.length > 0) {
          // Create aggregated entry
          const aggregated = {
            value: old.reduce((sum, d) => sum + d.value, 0) / old.length,
            timestamp: old[0].timestamp,
            aggregated: true,
            count: old.length
          };
          
          this.performanceData[key] = [aggregated, ...recent];
        }
      }
    }
  }
  
  cleanOldData() {
    const retentionPeriod = this.config.retentionPeriod || 86400000; // 24 hours
    const now = Date.now();
    
    // Clean old performance data
    for (const key of Object.keys(this.performanceData)) {
      this.performanceData[key] = this.performanceData[key].filter(d =>
        now - d.timestamp < retentionPeriod
      );
    }
    
    // Clean old alerts
    this.realtime.alerts = this.realtime.alerts.filter(a =>
      now - a.timestamp < retentionPeriod
    );
    
    // Clean old anomaly history
    this.anomalyDetector.history = this.anomalyDetector.history.filter(a =>
      now - a.timestamp < retentionPeriod
    );
  }
  
  updateDashboards() {
    for (const dashboard of this.dashboards.values()) {
      // Update widget data
      for (const widget of dashboard.widgets) {
        widget.data = this.getWidgetData(widget);
      }
      
      this.emit('dashboard:updated', dashboard);
    }
  }
  
  createWidget(name, config) {
    return {
      id: this.generateWidgetId(),
      name,
      config,
      data: null
    };
  }
  
  getWidgetData(widget) {
    const { type, metric, metrics, timeRange, source, limit } = widget.config;
    
    switch (type) {
      case 'line':
        return this.getLineChartData(metric, timeRange);
      
      case 'gauge':
        return this.getGaugeData(metrics);
      
      case 'list':
        return this.getListData(source, limit);
      
      default:
        return null;
    }
  }
  
  getLineChartData(metric, timeRange) {
    const range = this.getTimeRange(timeRange);
    
    return this.performanceData[metric]?.filter(d =>
      d.timestamp >= range.start && d.timestamp <= range.end
    ) || [];
  }
  
  getGaugeData(metrics) {
    const latest = this.performanceData.resourceUtilization[
      this.performanceData.resourceUtilization.length - 1
    ];
    
    if (!latest) return {};
    
    const data = {};
    for (const metric of metrics) {
      data[metric] = latest[metric] || 0;
    }
    
    return data;
  }
  
  getListData(source, limit) {
    switch (source) {
      case 'alerts':
        return this.realtime.alerts.slice(-limit);
      
      case 'anomalies':
        return this.anomalyDetector.history.slice(-limit);
      
      default:
        return [];
    }
  }
  
  initializeAnomalyDetection() {
    // Initialize with common patterns
    this.anomalyDetector.patterns = [
      {
        name: 'sudden_drop',
        detect: (current, previous) => 
          previous > 0 && (previous - current) / previous > 0.3
      },
      {
        name: 'sudden_spike',
        detect: (current, previous) =>
          previous > 0 && (current - previous) / previous > 0.5
      },
      {
        name: 'oscillation',
        detect: (values) => {
          if (values.length < 4) return false;
          const changes = [];
          for (let i = 1; i < values.length; i++) {
            changes.push(Math.sign(values[i] - values[i - 1]));
          }
          return changes.filter((c, i) => i > 0 && c !== changes[i - 1]).length > 2;
        }
      }
    ];
  }
  
  /**
   * Utility Methods
   */
  
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateDashboardId() {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateWidgetId() {
    return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  getAccuracyTrend(timeRange) {
    const data = this.performanceData.accuracy.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (data.length < 2) return 'stable';
    
    const trend = this.calculateTrend(data.map(d => d.value));
    
    if (trend > 0.01) return 'improving';
    if (trend < -0.01) return 'declining';
    return 'stable';
  }
  
  getLossTrend(timeRange) {
    const data = this.performanceData.loss.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (data.length < 2) return 'stable';
    
    const trend = this.calculateTrend(data.map(d => d.value));
    
    if (trend < -0.01) return 'improving';
    if (trend > 0.01) return 'declining';
    return 'stable';
  }
  
  getLatencyTrend(timeRange) {
    const data = this.performanceData.latency.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (data.length < 2) return 'stable';
    
    const trend = this.calculateTrend(data.map(d => d.value));
    
    if (trend < -1) return 'improving';
    if (trend > 1) return 'declining';
    return 'stable';
  }
  
  getAccuracyDistribution(timeRange) {
    const data = this.performanceData.accuracy
      .filter(d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end)
      .map(d => d.value);
    
    if (data.length === 0) return {};
    
    // Calculate distribution buckets
    const buckets = {
      '0-0.5': 0,
      '0.5-0.7': 0,
      '0.7-0.9': 0,
      '0.9-1.0': 0
    };
    
    for (const value of data) {
      if (value < 0.5) buckets['0-0.5']++;
      else if (value < 0.7) buckets['0.5-0.7']++;
      else if (value < 0.9) buckets['0.7-0.9']++;
      else buckets['0.9-1.0']++;
    }
    
    return buckets;
  }
  
  getLossDistribution(timeRange) {
    const data = this.performanceData.loss
      .filter(d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end)
      .map(d => d.value);
    
    if (data.length === 0) return {};
    
    // Calculate distribution buckets
    const buckets = {
      '0-0.1': 0,
      '0.1-0.5': 0,
      '0.5-1.0': 0,
      '>1.0': 0
    };
    
    for (const value of data) {
      if (value < 0.1) buckets['0-0.1']++;
      else if (value < 0.5) buckets['0.1-0.5']++;
      else if (value < 1.0) buckets['0.5-1.0']++;
      else buckets['>1.0']++;
    }
    
    return buckets;
  }
  
  getPeakThroughput(timeRange) {
    const data = this.performanceData.throughput.filter(d =>
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );
    
    if (data.length === 0) return 0;
    
    return Math.max(...data.map(d => d.value));
  }
  
  generateTrainingReport(options) {
    const timeRange = this.getTimeRange(options.period);
    const trainings = Array.from(this.metrics.training.values());
    
    return {
      totalTrainings: trainings.length,
      activeTrainings: this.realtime.activeTraining.size,
      completedTrainings: trainings.filter(t => t.completed).length,
      averageEpochs: this.calculateAverageEpochs(trainings),
      averageTrainingTime: this.calculateAverageTrainingTime(trainings),
      convergenceRate: this.calculateConvergenceRate(trainings),
      topPerformingTrainings: this.getTopTrainings(trainings, 5)
    };
  }
  
  generateInferenceReport(options) {
    const timeRange = this.getTimeRange(options.period);
    const inferences = Array.from(this.metrics.inference.values());
    
    return {
      totalInferences: this.statistics.totalInferences,
      modelsServing: inferences.length,
      averageLatency: this.calculateAverageLatency(timeRange),
      latencyPercentiles: {
        p50: this.getPercentileLatency(50, timeRange),
        p95: this.getPercentileLatency(95, timeRange),
        p99: this.getPercentileLatency(99, timeRange)
      },
      throughput: this.calculateThroughput(timeRange),
      errorRate: this.calculateErrorRate(timeRange)
    };
  }
  
  generateOptimizationReport(options) {
    const optimizations = Array.from(this.metrics.optimization.values());
    
    return {
      totalOptimizations: optimizations.length,
      activeOptimizations: optimizations.filter(o => !o.completed).length,
      averageImprovement: this.calculateAverageImprovement(optimizations),
      bestOptimizations: this.getBestOptimizations(optimizations, 5),
      optimizationTechniques: this.getOptimizationTechniques(optimizations)
    };
  }
  
  generateAnomalyReport(options) {
    const timeRange = this.getTimeRange(options.period);
    const anomalies = this.anomalyDetector.history.filter(a =>
      a.timestamp >= timeRange.start && a.timestamp <= timeRange.end
    );
    
    return {
      totalAnomalies: anomalies.length,
      anomaliesByType: this.groupAnomaliesByType(anomalies),
      anomaliesByModel: this.groupAnomaliesByModel(anomalies),
      criticalAnomalies: anomalies.filter(a => 
        a.anomalies.some(an => an.deviation > 0.5)
      ),
      anomalyTrend: this.getAnomalyTrend(timeRange)
    };
  }
  
  calculateAverageEpochs(trainings) {
    const epochs = trainings.map(t => t.epochs.length).filter(e => e > 0);
    return epochs.length > 0 ? 
      epochs.reduce((a, b) => a + b, 0) / epochs.length : 0;
  }
  
  calculateAverageTrainingTime(trainings) {
    const times = trainings
      .filter(t => t.endTime)
      .map(t => t.endTime - t.started);
    
    return times.length > 0 ?
      times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  calculateConvergenceRate(trainings) {
    const converged = trainings.filter(t => {
      if (t.losses.length < 5) return false;
      const recentLosses = t.losses.slice(-5);
      const trend = this.calculateTrend(recentLosses);
      return Math.abs(trend) < 0.001;
    });
    
    return trainings.length > 0 ?
      converged.length / trainings.length : 0;
  }
  
  getTopTrainings(trainings, limit) {
    return trainings
      .filter(t => t.accuracies.length > 0)
      .sort((a, b) => {
        const aAcc = a.accuracies[a.accuracies.length - 1];
        const bAcc = b.accuracies[b.accuracies.length - 1];
        return bAcc - aAcc;
      })
      .slice(0, limit)
      .map(t => ({
        id: t.id,
        accuracy: t.accuracies[t.accuracies.length - 1],
        loss: t.losses[t.losses.length - 1],
        epochs: t.epochs.length
      }));
  }
  
  calculateErrorRate(timeRange) {
    // This would need actual error tracking
    return 0;
  }
  
  calculateAverageImprovement(optimizations) {
    const improvements = optimizations
      .filter(o => o.improvements.length > 0)
      .map(o => {
        const total = o.improvements.reduce((sum, i) => sum + i.improvement, 0);
        return total / o.improvements.length;
      });
    
    return improvements.length > 0 ?
      improvements.reduce((a, b) => a + b, 0) / improvements.length : 0;
  }
  
  getBestOptimizations(optimizations, limit) {
    return optimizations
      .filter(o => o.improvements.length > 0)
      .sort((a, b) => {
        const aImp = a.improvements.reduce((sum, i) => sum + i.improvement, 0);
        const bImp = b.improvements.reduce((sum, i) => sum + i.improvement, 0);
        return bImp - aImp;
      })
      .slice(0, limit)
      .map(o => ({
        id: o.id,
        totalImprovement: o.improvements.reduce((sum, i) => sum + i.improvement, 0),
        iterations: o.iterations.length
      }));
  }
  
  getOptimizationTechniques(optimizations) {
    const techniques = {};
    
    for (const opt of optimizations) {
      for (const iteration of opt.iterations) {
        if (iteration.parameters?.technique) {
          techniques[iteration.parameters.technique] = 
            (techniques[iteration.parameters.technique] || 0) + 1;
        }
      }
    }
    
    return techniques;
  }
  
  groupAnomaliesByType(anomalies) {
    const byType = {};
    
    for (const anomaly of anomalies) {
      for (const a of anomaly.anomalies) {
        byType[a.type] = (byType[a.type] || 0) + 1;
      }
    }
    
    return byType;
  }
  
  groupAnomaliesByModel(anomalies) {
    const byModel = {};
    
    for (const anomaly of anomalies) {
      byModel[anomaly.modelId] = (byModel[anomaly.modelId] || 0) + 1;
    }
    
    return byModel;
  }
  
  getAnomalyTrend(timeRange) {
    const bucketSize = (timeRange.end - timeRange.start) / 10;
    const buckets = [];
    
    for (let i = 0; i < 10; i++) {
      const start = timeRange.start + (i * bucketSize);
      const end = start + bucketSize;
      
      const count = this.anomalyDetector.history.filter(a =>
        a.timestamp >= start && a.timestamp < end
      ).length;
      
      buckets.push({ time: start, count });
    }
    
    return buckets;
  }
  
  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      ...this.statistics,
      activeModels: this.realtime.activeModels.size,
      activeTraining: this.realtime.activeTraining.size,
      recentAlerts: this.realtime.alerts.length,
      recentAnomalies: this.anomalyDetector.history.length,
      totalReports: this.reports.size,
      totalDashboards: this.dashboards.size
    };
  }
}

module.exports = MLLearningAnalytics;