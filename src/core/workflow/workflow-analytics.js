/**
 * BUMBA Workflow Analytics
 * Comprehensive analytics and performance tracking for workflows
 * Part of Workflow Engine enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Analytics system for workflow performance and insights
 */
class WorkflowAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      metricsRetention: config.metricsRetention || 7 * 24 * 60 * 60 * 1000, // 7 days
      aggregationInterval: config.aggregationInterval || 60000, // 1 minute
      alertThresholds: config.alertThresholds || {},
      trackingEnabled: config.trackingEnabled !== false,
      ...config
    };
    
    // Metrics storage
    this.metrics = {
      workflows: new Map(),
      steps: new Map(),
      resources: new Map(),
      errors: new Map()
    };
    
    // Time series data
    this.timeSeries = {
      throughput: [],
      latency: [],
      successRate: [],
      resourceUsage: []
    };
    
    // Aggregated statistics
    this.statistics = {
      total: {
        workflows: 0,
        steps: 0,
        successes: 0,
        failures: 0
      },
      average: {
        duration: 0,
        steps: 0,
        resources: {}
      },
      percentiles: {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0
      }
    };
    
    // Real-time tracking
    this.realtime = {
      activeWorkflows: new Map(),
      recentEvents: [],
      alerts: []
    };
    
    // Analytics insights
    this.insights = {
      trends: new Map(),
      anomalies: [],
      recommendations: [],
      predictions: new Map()
    };
    
    // Performance indicators
    this.kpis = {
      sla: {
        target: 0.99,
        current: 1.0,
        violations: 0
      },
      efficiency: {
        target: 0.8,
        current: 0,
        trend: 'stable'
      },
      reliability: {
        mtbf: 0, // Mean Time Between Failures
        mttr: 0, // Mean Time To Recovery
        availability: 1.0
      }
    };
    
    this.initialize();
  }
  
  /**
   * Initialize analytics
   */
  initialize() {
    this.startAggregation();
    this.startCleanup();
    
    logger.info('📊 Workflow Analytics initialized');
  }
  
  /**
   * Track workflow execution
   */
  trackWorkflowStart(workflow, execution) {
    if (!this.config.trackingEnabled) return;
    
    const tracking = {
      workflowId: workflow.id,
      executionId: execution.id,
      name: workflow.name,
      startTime: Date.now(),
      steps: [],
      resources: {},
      status: 'running'
    };
    
    this.realtime.activeWorkflows.set(execution.id, tracking);
    
    // Add to recent events
    this.addRecentEvent({
      type: 'workflow:start',
      workflowId: workflow.id,
      executionId: execution.id,
      timestamp: tracking.startTime
    });
    
    this.emit('tracking:workflow:start', tracking);
  }
  
  trackWorkflowComplete(execution, result) {
    if (!this.config.trackingEnabled) return;
    
    const tracking = this.realtime.activeWorkflows.get(execution.id);
    
    if (!tracking) return;
    
    tracking.endTime = Date.now();
    tracking.duration = tracking.endTime - tracking.startTime;
    tracking.status = result.success ? 'completed' : 'failed';
    tracking.result = result;
    
    // Move to metrics
    this.recordWorkflowMetrics(tracking);
    
    // Remove from active
    this.realtime.activeWorkflows.delete(execution.id);
    
    // Add to recent events
    this.addRecentEvent({
      type: 'workflow:complete',
      executionId: execution.id,
      duration: tracking.duration,
      status: tracking.status,
      timestamp: tracking.endTime
    });
    
    // Update statistics
    this.updateStatistics(tracking);
    
    // Check for anomalies
    this.detectAnomalies(tracking);
    
    // Update KPIs
    this.updateKPIs(tracking);
    
    this.emit('tracking:workflow:complete', tracking);
  }
  
  trackStepStart(executionId, step) {
    if (!this.config.trackingEnabled) return;
    
    const tracking = this.realtime.activeWorkflows.get(executionId);
    
    if (!tracking) return;
    
    const stepTracking = {
      stepId: step.id,
      name: step.name,
      type: step.type,
      startTime: Date.now(),
      status: 'running'
    };
    
    tracking.steps.push(stepTracking);
    
    this.emit('tracking:step:start', { executionId, step: stepTracking });
  }
  
  trackStepComplete(executionId, step, result) {
    if (!this.config.trackingEnabled) return;
    
    const tracking = this.realtime.activeWorkflows.get(executionId);
    
    if (!tracking) return;
    
    const stepTracking = tracking.steps.find(s => s.stepId === step.id);
    
    if (!stepTracking) return;
    
    stepTracking.endTime = Date.now();
    stepTracking.duration = stepTracking.endTime - stepTracking.startTime;
    stepTracking.status = result.success ? 'completed' : 'failed';
    stepTracking.result = result;
    
    // Record step metrics
    this.recordStepMetrics(stepTracking);
    
    this.emit('tracking:step:complete', { executionId, step: stepTracking });
  }
  
  trackResourceUsage(executionId, resources) {
    if (!this.config.trackingEnabled) return;
    
    const tracking = this.realtime.activeWorkflows.get(executionId);
    
    if (!tracking) return;
    
    // Aggregate resource usage
    for (const [resource, amount] of Object.entries(resources)) {
      tracking.resources[resource] = (tracking.resources[resource] || 0) + amount;
    }
    
    // Record resource metrics
    this.recordResourceMetrics(resources);
  }
  
  trackError(executionId, error) {
    if (!this.config.trackingEnabled) return;
    
    const errorRecord = {
      executionId,
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      type: error.constructor.name
    };
    
    // Add to error metrics
    if (!this.metrics.errors.has(error.message)) {
      this.metrics.errors.set(error.message, {
        count: 0,
        firstSeen: errorRecord.timestamp,
        lastSeen: errorRecord.timestamp,
        executions: []
      });
    }
    
    const errorMetric = this.metrics.errors.get(error.message);
    errorMetric.count++;
    errorMetric.lastSeen = errorRecord.timestamp;
    errorMetric.executions.push(executionId);
    
    // Add to recent events
    this.addRecentEvent({
      type: 'workflow:error',
      executionId,
      error: error.message,
      timestamp: errorRecord.timestamp
    });
    
    // Check if alert needed
    this.checkErrorAlert(error.message, errorMetric);
    
    this.emit('tracking:error', errorRecord);
  }
  
  /**
   * Record metrics
   */
  
  recordWorkflowMetrics(tracking) {
    const workflowId = tracking.workflowId;
    
    if (!this.metrics.workflows.has(workflowId)) {
      this.metrics.workflows.set(workflowId, {
        executions: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        durations: []
      });
    }
    
    const metric = this.metrics.workflows.get(workflowId);
    
    metric.executions++;
    
    if (tracking.status === 'completed') {
      metric.successes++;
    } else {
      metric.failures++;
    }
    
    metric.totalDuration += tracking.duration;
    metric.minDuration = Math.min(metric.minDuration, tracking.duration);
    metric.maxDuration = Math.max(metric.maxDuration, tracking.duration);
    metric.durations.push(tracking.duration);
    
    // Maintain duration history size
    if (metric.durations.length > 1000) {
      metric.durations.shift();
    }
    
    // Add to time series
    this.addToTimeSeries('throughput', {
      timestamp: tracking.endTime,
      value: 1
    });
    
    this.addToTimeSeries('latency', {
      timestamp: tracking.endTime,
      value: tracking.duration
    });
    
    this.addToTimeSeries('successRate', {
      timestamp: tracking.endTime,
      value: tracking.status === 'completed' ? 1 : 0
    });
  }
  
  recordStepMetrics(stepTracking) {
    const stepKey = `${stepTracking.type}:${stepTracking.name}`;
    
    if (!this.metrics.steps.has(stepKey)) {
      this.metrics.steps.set(stepKey, {
        executions: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        avgDuration: 0,
        distribution: new Map()
      });
    }
    
    const metric = this.metrics.steps.get(stepKey);
    
    metric.executions++;
    
    if (stepTracking.status === 'completed') {
      metric.successes++;
    } else {
      metric.failures++;
    }
    
    metric.totalDuration += stepTracking.duration;
    metric.avgDuration = metric.totalDuration / metric.executions;
    
    // Update distribution
    const bucket = Math.floor(stepTracking.duration / 100) * 100;
    metric.distribution.set(bucket, (metric.distribution.get(bucket) || 0) + 1);
  }
  
  recordResourceMetrics(resources) {
    const timestamp = Date.now();
    
    for (const [resource, amount] of Object.entries(resources)) {
      if (!this.metrics.resources.has(resource)) {
        this.metrics.resources.set(resource, {
          total: 0,
          peak: 0,
          samples: []
        });
      }
      
      const metric = this.metrics.resources.get(resource);
      
      metric.total += amount;
      metric.peak = Math.max(metric.peak, amount);
      metric.samples.push({ timestamp, value: amount });
      
      // Maintain sample size
      if (metric.samples.length > 1000) {
        metric.samples.shift();
      }
    }
    
    // Add to time series
    this.addToTimeSeries('resourceUsage', {
      timestamp,
      value: resources
    });
  }
  
  /**
   * Statistics and Aggregation
   */
  
  updateStatistics(tracking) {
    // Update totals
    this.statistics.total.workflows++;
    this.statistics.total.steps += tracking.steps.length;
    
    if (tracking.status === 'completed') {
      this.statistics.total.successes++;
    } else {
      this.statistics.total.failures++;
    }
    
    // Update averages
    const totalWorkflows = this.statistics.total.workflows;
    
    this.statistics.average.duration = 
      (this.statistics.average.duration * (totalWorkflows - 1) + tracking.duration) / 
      totalWorkflows;
    
    this.statistics.average.steps = 
      (this.statistics.average.steps * (totalWorkflows - 1) + tracking.steps.length) / 
      totalWorkflows;
    
    // Update resource averages
    for (const [resource, amount] of Object.entries(tracking.resources)) {
      const current = this.statistics.average.resources[resource] || 0;
      this.statistics.average.resources[resource] = 
        (current * (totalWorkflows - 1) + amount) / totalWorkflows;
    }
    
    // Update percentiles periodically
    if (totalWorkflows % 100 === 0) {
      this.updatePercentiles();
    }
  }
  
  updatePercentiles() {
    const allDurations = [];
    
    for (const metric of this.metrics.workflows.values()) {
      allDurations.push(...metric.durations);
    }
    
    if (allDurations.length === 0) return;
    
    allDurations.sort((a, b) => a - b);
    
    this.statistics.percentiles.p50 = this.getPercentile(allDurations, 50);
    this.statistics.percentiles.p90 = this.getPercentile(allDurations, 90);
    this.statistics.percentiles.p95 = this.getPercentile(allDurations, 95);
    this.statistics.percentiles.p99 = this.getPercentile(allDurations, 99);
  }
  
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
  
  /**
   * Anomaly Detection
   */
  
  detectAnomalies(tracking) {
    const anomalies = [];
    
    // Check duration anomaly
    const workflowMetric = this.metrics.workflows.get(tracking.workflowId);
    
    if (workflowMetric && workflowMetric.executions > 10) {
      const avgDuration = workflowMetric.totalDuration / workflowMetric.executions;
      const stdDev = this.calculateStdDev(workflowMetric.durations);
      
      if (tracking.duration > avgDuration + 3 * stdDev) {
        anomalies.push({
          type: 'duration',
          severity: 'high',
          message: `Workflow duration ${tracking.duration}ms is 3+ std deviations above average ${avgDuration}ms`,
          value: tracking.duration,
          expected: avgDuration
        });
      }
    }
    
    // Check resource anomaly
    for (const [resource, amount] of Object.entries(tracking.resources)) {
      const resourceMetric = this.metrics.resources.get(resource);
      
      if (resourceMetric && amount > resourceMetric.peak * 0.9) {
        anomalies.push({
          type: 'resource',
          severity: 'medium',
          message: `High ${resource} usage: ${amount} (near peak ${resourceMetric.peak})`,
          resource,
          value: amount,
          peak: resourceMetric.peak
        });
      }
    }
    
    // Check failure pattern
    if (tracking.status === 'failed') {
      const recentFailures = this.countRecentFailures(tracking.workflowId, 3600000); // 1 hour
      
      if (recentFailures > 5) {
        anomalies.push({
          type: 'failure_pattern',
          severity: 'high',
          message: `High failure rate: ${recentFailures} failures in last hour`,
          workflowId: tracking.workflowId,
          failures: recentFailures
        });
      }
    }
    
    // Store anomalies
    if (anomalies.length > 0) {
      this.insights.anomalies.push({
        timestamp: Date.now(),
        executionId: tracking.executionId,
        anomalies
      });
      
      // Maintain anomaly history size
      if (this.insights.anomalies.length > 100) {
        this.insights.anomalies.shift();
      }
      
      // Emit anomaly event
      this.emit('anomaly:detected', { tracking, anomalies });
      
      // Create alerts
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high') {
          this.createAlert({
            type: 'anomaly',
            severity: anomaly.severity,
            message: anomaly.message,
            data: anomaly
          });
        }
      }
    }
  }
  
  calculateStdDev(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  countRecentFailures(workflowId, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    
    return this.realtime.recentEvents.filter(event => 
      event.type === 'workflow:complete' &&
      event.workflowId === workflowId &&
      event.status === 'failed' &&
      event.timestamp > cutoff
    ).length;
  }
  
  /**
   * KPI Management
   */
  
  updateKPIs(tracking) {
    // Update SLA
    if (tracking.status === 'failed') {
      this.kpis.sla.violations++;
    }
    
    const totalExecutions = this.statistics.total.workflows;
    this.kpis.sla.current = 1 - (this.kpis.sla.violations / totalExecutions);
    
    // Update efficiency
    const avgDuration = this.statistics.average.duration;
    const optimalDuration = tracking.steps.length * 100; // 100ms per step ideal
    
    this.kpis.efficiency.current = optimalDuration / Math.max(avgDuration, 1);
    
    // Determine trend
    const recentEfficiency = this.calculateRecentEfficiency();
    
    if (recentEfficiency > this.kpis.efficiency.current * 1.1) {
      this.kpis.efficiency.trend = 'improving';
    } else if (recentEfficiency < this.kpis.efficiency.current * 0.9) {
      this.kpis.efficiency.trend = 'declining';
    } else {
      this.kpis.efficiency.trend = 'stable';
    }
    
    // Update reliability
    this.updateReliability();
  }
  
  updateReliability() {
    const failures = [];
    const recoveries = [];
    
    // Analyze recent events for failure/recovery patterns
    for (let i = 0; i < this.realtime.recentEvents.length - 1; i++) {
      const event = this.realtime.recentEvents[i];
      const nextEvent = this.realtime.recentEvents[i + 1];
      
      if (event.status === 'failed' && nextEvent.status === 'completed') {
        failures.push(event.timestamp);
        recoveries.push(nextEvent.timestamp - event.timestamp);
      }
    }
    
    // Calculate MTBF (Mean Time Between Failures)
    if (failures.length > 1) {
      const intervals = [];
      
      for (let i = 1; i < failures.length; i++) {
        intervals.push(failures[i] - failures[i - 1]);
      }
      
      this.kpis.reliability.mtbf = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
    
    // Calculate MTTR (Mean Time To Recovery)
    if (recoveries.length > 0) {
      this.kpis.reliability.mttr = recoveries.reduce((a, b) => a + b, 0) / recoveries.length;
    }
    
    // Calculate availability
    const totalTime = Date.now() - (this.realtime.recentEvents[0]?.timestamp || Date.now());
    const downtime = recoveries.reduce((a, b) => a + b, 0);
    
    this.kpis.reliability.availability = totalTime > 0 ? 
      (totalTime - downtime) / totalTime : 1.0;
  }
  
  calculateRecentEfficiency() {
    const recentWindow = 3600000; // 1 hour
    const cutoff = Date.now() - recentWindow;
    
    const recentDurations = [];
    
    for (const event of this.realtime.recentEvents) {
      if (event.type === 'workflow:complete' && 
          event.timestamp > cutoff && 
          event.duration) {
        recentDurations.push(event.duration);
      }
    }
    
    if (recentDurations.length === 0) {
      return this.kpis.efficiency.current;
    }
    
    const avgRecent = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
    const optimalDuration = this.statistics.average.steps * 100;
    
    return optimalDuration / Math.max(avgRecent, 1);
  }
  
  /**
   * Insights and Predictions
   */
  
  generateInsights() {
    const insights = [];
    
    // Trend analysis
    for (const [workflowId, metric] of this.metrics.workflows) {
      const trend = this.analyzeTrend(metric.durations);
      
      if (trend.direction !== 'stable') {
        insights.push({
          type: 'trend',
          workflowId,
          direction: trend.direction,
          magnitude: trend.magnitude,
          message: `Workflow ${workflowId} duration is ${trend.direction} by ${trend.magnitude}%`
        });
        
        this.insights.trends.set(workflowId, trend);
      }
    }
    
    // Bottleneck identification
    const bottlenecks = this.identifyBottlenecks();
    
    for (const bottleneck of bottlenecks) {
      insights.push({
        type: 'bottleneck',
        ...bottleneck
      });
    }
    
    // Resource optimization opportunities
    const resourceOpts = this.identifyResourceOptimizations();
    
    for (const opt of resourceOpts) {
      insights.push({
        type: 'optimization',
        ...opt
      });
    }
    
    // Store insights
    this.insights.recommendations = insights;
    
    return insights;
  }
  
  analyzeTrend(values) {
    if (values.length < 10) {
      return { direction: 'stable', magnitude: 0 };
    }
    
    // Simple linear regression on recent values
    const recentValues = values.slice(-20);
    const n = recentValues.length;
    
    const x = Array.from({ length: n }, (_, i) => i);
    const y = recentValues;
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const magnitude = Math.abs(slope / yMean) * 100;
    
    return {
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
      magnitude: Math.round(magnitude)
    };
  }
  
  identifyBottlenecks() {
    const bottlenecks = [];
    
    // Find slowest steps
    const stepDurations = [];
    
    for (const [stepKey, metric] of this.metrics.steps) {
      stepDurations.push({
        step: stepKey,
        avgDuration: metric.avgDuration,
        executions: metric.executions
      });
    }
    
    stepDurations.sort((a, b) => b.avgDuration - a.avgDuration);
    
    // Top 5 slowest steps
    for (const step of stepDurations.slice(0, 5)) {
      if (step.avgDuration > 1000) { // > 1 second
        bottlenecks.push({
          step: step.step,
          avgDuration: step.avgDuration,
          executions: step.executions,
          message: `Step ${step.step} takes ${step.avgDuration}ms on average`
        });
      }
    }
    
    return bottlenecks;
  }
  
  identifyResourceOptimizations() {
    const optimizations = [];
    
    for (const [resource, metric] of this.metrics.resources) {
      const avgUsage = metric.total / metric.samples.length;
      
      if (avgUsage < metric.peak * 0.3) {
        optimizations.push({
          resource,
          avgUsage,
          peak: metric.peak,
          message: `${resource} is underutilized (avg: ${avgUsage}, peak: ${metric.peak})`
        });
      }
    }
    
    return optimizations;
  }
  
  predictNextExecution(workflowId) {
    const metric = this.metrics.workflows.get(workflowId);
    
    if (!metric || metric.executions < 5) {
      return null;
    }
    
    const trend = this.insights.trends.get(workflowId) || { direction: 'stable', magnitude: 0 };
    const avgDuration = metric.totalDuration / metric.executions;
    
    // Simple prediction based on trend
    let predictedDuration = avgDuration;
    
    if (trend.direction === 'increasing') {
      predictedDuration *= 1 + (trend.magnitude / 100);
    } else if (trend.direction === 'decreasing') {
      predictedDuration *= 1 - (trend.magnitude / 100);
    }
    
    const prediction = {
      workflowId,
      predictedDuration,
      confidence: Math.min(0.9, metric.executions / 100),
      basedOn: metric.executions,
      trend
    };
    
    this.insights.predictions.set(workflowId, prediction);
    
    return prediction;
  }
  
  /**
   * Alerts and Notifications
   */
  
  createAlert(alert) {
    alert.id = this.generateAlertId();
    alert.timestamp = Date.now();
    alert.acknowledged = false;
    
    this.realtime.alerts.push(alert);
    
    // Maintain alert history size
    if (this.realtime.alerts.length > 100) {
      this.realtime.alerts.shift();
    }
    
    this.emit('alert:created', alert);
    
    // Check if threshold breached
    if (this.config.alertThresholds[alert.type]) {
      const threshold = this.config.alertThresholds[alert.type];
      
      if (alert.severity === 'critical' || 
          (alert.data && alert.data.value > threshold)) {
        this.emit('alert:critical', alert);
      }
    }
  }
  
  checkErrorAlert(errorMessage, errorMetric) {
    // Alert if error rate is high
    if (errorMetric.count > 10) {
      const timeSinceFirst = Date.now() - errorMetric.firstSeen;
      const errorRate = errorMetric.count / (timeSinceFirst / 1000); // errors per second
      
      if (errorRate > 0.1) { // More than 0.1 errors per second
        this.createAlert({
          type: 'error_rate',
          severity: 'high',
          message: `High error rate for: ${errorMessage}`,
          data: {
            errorMessage,
            count: errorMetric.count,
            rate: errorRate
          }
        });
      }
    }
  }
  
  acknowledgeAlert(alertId) {
    const alert = this.realtime.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      
      this.emit('alert:acknowledged', alert);
    }
  }
  
  /**
   * Reporting
   */
  
  generateReport(timeRange = 86400000) { // Default 24 hours
    const cutoff = Date.now() - timeRange;
    
    const report = {
      timeRange: {
        start: cutoff,
        end: Date.now(),
        duration: timeRange
      },
      summary: this.generateSummary(cutoff),
      workflows: this.generateWorkflowReport(cutoff),
      steps: this.generateStepReport(cutoff),
      resources: this.generateResourceReport(cutoff),
      errors: this.generateErrorReport(cutoff),
      kpis: this.kpis,
      insights: this.generateInsights(),
      alerts: this.realtime.alerts.filter(a => a.timestamp > cutoff)
    };
    
    return report;
  }
  
  generateSummary(cutoff) {
    const recentEvents = this.realtime.recentEvents.filter(e => e.timestamp > cutoff);
    
    const summary = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
      totalDuration: 0
    };
    
    for (const event of recentEvents) {
      if (event.type === 'workflow:complete') {
        summary.totalExecutions++;
        
        if (event.status === 'completed') {
          summary.successfulExecutions++;
        } else {
          summary.failedExecutions++;
        }
        
        if (event.duration) {
          summary.totalDuration += event.duration;
        }
      }
    }
    
    if (summary.totalExecutions > 0) {
      summary.avgDuration = summary.totalDuration / summary.totalExecutions;
      summary.successRate = summary.successfulExecutions / summary.totalExecutions;
    }
    
    return summary;
  }
  
  generateWorkflowReport(cutoff) {
    const report = [];
    
    for (const [workflowId, metric] of this.metrics.workflows) {
      report.push({
        workflowId,
        executions: metric.executions,
        successRate: metric.successes / metric.executions,
        avgDuration: metric.totalDuration / metric.executions,
        minDuration: metric.minDuration,
        maxDuration: metric.maxDuration,
        trend: this.insights.trends.get(workflowId)
      });
    }
    
    return report;
  }
  
  generateStepReport(cutoff) {
    const report = [];
    
    for (const [stepKey, metric] of this.metrics.steps) {
      report.push({
        step: stepKey,
        executions: metric.executions,
        successRate: metric.successes / metric.executions,
        avgDuration: metric.avgDuration,
        distribution: Object.fromEntries(metric.distribution)
      });
    }
    
    return report.sort((a, b) => b.avgDuration - a.avgDuration);
  }
  
  generateResourceReport(cutoff) {
    const report = {};
    
    for (const [resource, metric] of this.metrics.resources) {
      const recentSamples = metric.samples.filter(s => s.timestamp > cutoff);
      
      report[resource] = {
        avgUsage: recentSamples.reduce((sum, s) => sum + s.value, 0) / recentSamples.length,
        peak: metric.peak,
        samples: recentSamples.length
      };
    }
    
    return report;
  }
  
  generateErrorReport(cutoff) {
    const report = [];
    
    for (const [errorMessage, metric] of this.metrics.errors) {
      if (metric.lastSeen > cutoff) {
        report.push({
          error: errorMessage,
          count: metric.count,
          firstSeen: metric.firstSeen,
          lastSeen: metric.lastSeen,
          affectedExecutions: metric.executions.length
        });
      }
    }
    
    return report.sort((a, b) => b.count - a.count);
  }
  
  /**
   * Data Management
   */
  
  addRecentEvent(event) {
    this.realtime.recentEvents.push(event);
    
    // Maintain event history size
    if (this.realtime.recentEvents.length > 1000) {
      this.realtime.recentEvents.shift();
    }
  }
  
  addToTimeSeries(series, dataPoint) {
    if (!this.timeSeries[series]) {
      this.timeSeries[series] = [];
    }
    
    this.timeSeries[series].push(dataPoint);
    
    // Maintain time series size
    if (this.timeSeries[series].length > 10000) {
      this.timeSeries[series].shift();
    }
  }
  
  startAggregation() {
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }
  
  aggregateMetrics() {
    // Aggregate time series data
    for (const series in this.timeSeries) {
      const data = this.timeSeries[series];
      
      if (data.length > 100) {
        // Downsample older data
        const downsampled = [];
        const bucketSize = Math.floor(data.length / 100);
        
        for (let i = 0; i < data.length; i += bucketSize) {
          const bucket = data.slice(i, i + bucketSize);
          
          if (bucket.length > 0) {
            const avgValue = bucket.reduce((sum, d) => sum + (d.value || 0), 0) / bucket.length;
            downsampled.push({
              timestamp: bucket[0].timestamp,
              value: avgValue
            });
          }
        }
        
        this.timeSeries[series] = downsampled;
      }
    }
  }
  
  startCleanup() {
    // Periodic cleanup of old data
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
  }
  
  cleanupOldData() {
    const cutoff = Date.now() - this.config.metricsRetention;
    
    // Clean up time series
    for (const series in this.timeSeries) {
      this.timeSeries[series] = this.timeSeries[series].filter(d => 
        d.timestamp > cutoff
      );
    }
    
    // Clean up recent events
    this.realtime.recentEvents = this.realtime.recentEvents.filter(e => 
      e.timestamp > cutoff
    );
    
    // Clean up old alerts
    this.realtime.alerts = this.realtime.alerts.filter(a => 
      a.timestamp > cutoff || !a.acknowledged
    );
  }
  
  /**
   * Query Methods
   */
  
  getMetrics() {
    return {
      workflows: Object.fromEntries(this.metrics.workflows),
      steps: Object.fromEntries(this.metrics.steps),
      resources: Object.fromEntries(this.metrics.resources),
      errors: Object.fromEntries(this.metrics.errors),
      statistics: this.statistics,
      kpis: this.kpis
    };
  }
  
  getTimeSeries(series, timeRange) {
    const data = this.timeSeries[series] || [];
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      return data.filter(d => d.timestamp > cutoff);
    }
    
    return data;
  }
  
  getActiveWorkflows() {
    return Array.from(this.realtime.activeWorkflows.values());
  }
  
  getAlerts(unacknowledgedOnly = false) {
    if (unacknowledgedOnly) {
      return this.realtime.alerts.filter(a => !a.acknowledged);
    }
    
    return this.realtime.alerts;
  }
  
  getInsights() {
    return {
      trends: Object.fromEntries(this.insights.trends),
      anomalies: this.insights.anomalies,
      recommendations: this.insights.recommendations,
      predictions: Object.fromEntries(this.insights.predictions)
    };
  }
  
  /**
   * Utility Methods
   */
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  destroy() {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.removeAllListeners();
  }
}

module.exports = WorkflowAnalytics;