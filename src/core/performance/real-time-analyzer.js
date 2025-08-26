/**
 * BUMBA Real-Time Performance Analyzer
 * Analyzes performance metrics in real-time and provides actionable insights
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { performance, PerformanceObserver } = require('perf_hooks');

class RealTimePerformanceAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enabled: options.enabled !== false,
      analysisInterval: options.analysisInterval || 1000, // 1 second
      windowSize: options.windowSize || 60000, // 1 minute window
      alertThresholds: {
        cpuUsage: options.cpuThreshold || 80,
        memoryUsage: options.memoryThreshold || 85,
        responseTime: options.responseThreshold || 1000,
        errorRate: options.errorThreshold || 5,
        eventLoopLag: options.lagThreshold || 100
      },
      insights: {
        enabled: options.insightsEnabled !== false,
        minDataPoints: options.minDataPoints || 10,
        confidence: options.confidenceLevel || 0.95
      },
      recommendations: {
        enabled: options.recommendationsEnabled !== false,
        actionable: options.actionableOnly !== false
      },
      ...options
    };
    
    // Analysis windows
    this.windows = {
      current: new Map(),
      previous: new Map(),
      baseline: new Map()
    };
    
    // Real-time metrics
    this.realTimeMetrics = {
      cpu: [],
      memory: [],
      responseTime: [],
      throughput: [],
      errorRate: [],
      eventLoopLag: []
    };
    
    // Performance issues detected
    this.issues = new Map();
    this.insights = new Map();
    this.recommendations = [];
    
    // Bottleneck detection
    this.bottlenecks = {
      cpu: null,
      memory: null,
      io: null,
      network: null
    };
    
    // Trend analysis
    this.trends = new Map();
    this.predictions = new Map();
    
    // Analysis state
    this.analysisState = {
      isAnalyzing: false,
      lastAnalysis: null,
      analysisCount: 0,
      issuesDetected: 0,
      recommendationsMade: 0
    };
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize analyzer
   */
  initialize() {
    // Set up performance observer
    this.setupPerformanceObserver();
    
    // Start analysis loop
    this.startAnalysis();
    
    // Initialize baseline metrics
    this.establishBaseline();
    
    logger.info('Real-time performance analyzer initialized');
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if (!PerformanceObserver) return;
    
    // Observe performance entries
    const obs = new PerformanceObserver((items) => {
      for (const entry of items.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });
    
    try {
      obs.observe({ 
        entryTypes: ['measure', 'mark', 'navigation', 'resource', 'function'] 
      });
    } catch (error) {
      // Some entry types might not be available
      obs.observe({ entryTypes: ['measure', 'mark'] });
    }
    
    this.performanceObserver = obs;
  }

  /**
   * Process performance entry
   */
  processPerformanceEntry(entry) {
    // Store in current window
    const key = `${entry.entryType}:${entry.name}`;
    
    if (!this.windows.current.has(key)) {
      this.windows.current.set(key, []);
    }
    
    this.windows.current.get(key).push({
      timestamp: Date.now(),
      duration: entry.duration,
      startTime: entry.startTime,
      detail: entry.detail || {}
    });
    
    // Analyze if it's a measure
    if (entry.entryType === 'measure') {
      this.analyzeMeasure(entry);
    }
  }

  /**
   * Analyze performance measure
   */
  analyzeMeasure(entry) {
    // Check for slow operations
    if (entry.duration > this.config.alertThresholds.responseTime) {
      this.detectIssue('slow_operation', {
        name: entry.name,
        duration: entry.duration,
        threshold: this.config.alertThresholds.responseTime
      });
    }
    
    // Update response time metrics
    this.realTimeMetrics.responseTime.push({
      timestamp: Date.now(),
      value: entry.duration,
      operation: entry.name
    });
    
    // Keep window size
    if (this.realTimeMetrics.responseTime.length > 1000) {
      this.realTimeMetrics.responseTime.shift();
    }
  }

  /**
   * Start analysis loop
   */
  startAnalysis() {
    this.analysisInterval = setInterval(() => {
      this.performAnalysis();
    }, this.config.analysisInterval);
  }

  /**
   * Perform real-time analysis
   */
  async performAnalysis() {
    if (this.analysisState.isAnalyzing) return;
    
    this.analysisState.isAnalyzing = true;
    const startTime = performance.now();
    
    try {
      // Collect current metrics
      const metrics = await this.collectMetrics();
      
      // Analyze metrics
      this.analyzeMetrics(metrics);
      
      // Detect bottlenecks
      this.detectBottlenecks(metrics);
      
      // Analyze trends
      this.analyzeTrends(metrics);
      
      // Generate insights
      if (this.config.insights.enabled) {
        this.generateInsights(metrics);
      }
      
      // Generate recommendations
      if (this.config.recommendations.enabled) {
        this.generateRecommendations();
      }
      
      // Check for anomalies
      this.detectAnomalies(metrics);
      
      // Predict future issues
      this.predictIssues(metrics);
      
      // Update state
      this.analysisState.lastAnalysis = Date.now();
      this.analysisState.analysisCount++;
      
      // Emit analysis complete
      const duration = performance.now() - startTime;
      this.emit('analysis:complete', {
        metrics,
        issues: Array.from(this.issues.values()),
        insights: Array.from(this.insights.values()),
        recommendations: this.recommendations,
        duration
      });
      
    } catch (error) {
      logger.error('Performance analysis failed:', error);
    } finally {
      this.analysisState.isAnalyzing = false;
    }
  }

  /**
   * Collect current metrics
   */
  async collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      system: await this.collectSystemMetrics(),
      process: this.collectProcessMetrics(),
      application: this.collectApplicationMetrics(),
      custom: this.collectCustomMetrics()
    };
    
    // Update real-time metrics
    this.updateRealTimeMetrics(metrics);
    
    return metrics;
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    const os = require('os');
    const cpus = os.cpus();
    
    // Calculate CPU usage
    const cpuUsage = this.calculateCPUUsage(cpus);
    
    // Memory metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;
    
    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: os.loadavg()
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: memUsage
      },
      uptime: os.uptime()
    };
  }

  /**
   * Collect process metrics
   */
  collectProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: cpuUsage,
      uptime: process.uptime(),
      pid: process.pid
    };
  }

  /**
   * Collect application metrics
   */
  collectApplicationMetrics() {
    const framework = global.bumbaFramework;
    
    if (!framework) {
      return {};
    }
    
    return {
      requests: framework.metrics?.totalRequests || 0,
      errors: framework.metrics?.totalErrors || 0,
      activeAgents: framework.agentManager?.activeAgents?.size || 0,
      queuedCommands: framework.commandQueue?.length || 0
    };
  }

  /**
   * Collect custom metrics
   */
  collectCustomMetrics() {
    // Collect event loop lag
    const lag = this.measureEventLoopLag();
    
    return {
      eventLoopLag: lag,
      gcStats: this.getGCStats(),
      performanceMarks: this.getPerformanceMarks()
    };
  }

  /**
   * Update real-time metrics
   */
  updateRealTimeMetrics(metrics) {
    const now = Date.now();
    
    // CPU
    this.realTimeMetrics.cpu.push({
      timestamp: now,
      value: metrics.system.cpu.usage
    });
    
    // Memory
    this.realTimeMetrics.memory.push({
      timestamp: now,
      value: metrics.system.memory.percentage
    });
    
    // Event loop lag
    this.realTimeMetrics.eventLoopLag.push({
      timestamp: now,
      value: metrics.custom.eventLoopLag
    });
    
    // Maintain window size
    const cutoff = now - this.config.windowSize;
    for (const key in this.realTimeMetrics) {
      this.realTimeMetrics[key] = this.realTimeMetrics[key].filter(
        m => m.timestamp > cutoff
      );
    }
  }

  /**
   * Analyze metrics
   */
  analyzeMetrics(metrics) {
    // Check CPU usage
    if (metrics.system.cpu.usage > this.config.alertThresholds.cpuUsage) {
      this.detectIssue('high_cpu', {
        current: metrics.system.cpu.usage,
        threshold: this.config.alertThresholds.cpuUsage,
        severity: this.calculateSeverity(
          metrics.system.cpu.usage,
          this.config.alertThresholds.cpuUsage
        )
      });
    }
    
    // Check memory usage
    if (metrics.system.memory.percentage > this.config.alertThresholds.memoryUsage) {
      this.detectIssue('high_memory', {
        current: metrics.system.memory.percentage,
        threshold: this.config.alertThresholds.memoryUsage,
        severity: this.calculateSeverity(
          metrics.system.memory.percentage,
          this.config.alertThresholds.memoryUsage
        )
      });
    }
    
    // Check event loop lag
    if (metrics.custom.eventLoopLag > this.config.alertThresholds.eventLoopLag) {
      this.detectIssue('event_loop_blocked', {
        lag: metrics.custom.eventLoopLag,
        threshold: this.config.alertThresholds.eventLoopLag,
        severity: 'high'
      });
    }
    
    // Check error rate
    if (metrics.application.errors) {
      const errorRate = this.calculateErrorRate();
      if (errorRate > this.config.alertThresholds.errorRate) {
        this.detectIssue('high_error_rate', {
          rate: errorRate,
          threshold: this.config.alertThresholds.errorRate,
          severity: 'medium'
        });
      }
    }
  }

  /**
   * Detect bottlenecks
   */
  detectBottlenecks(metrics) {
    // CPU bottleneck
    if (metrics.system.cpu.usage > 90) {
      this.bottlenecks.cpu = {
        detected: true,
        severity: 'high',
        value: metrics.system.cpu.usage,
        recommendation: 'Consider scaling horizontally or optimizing CPU-intensive operations'
      };
    } else if (metrics.system.cpu.usage > 70) {
      this.bottlenecks.cpu = {
        detected: true,
        severity: 'medium',
        value: metrics.system.cpu.usage,
        recommendation: 'Monitor CPU usage closely, consider optimization'
      };
    } else {
      this.bottlenecks.cpu = null;
    }
    
    // Memory bottleneck
    const heapUsed = metrics.process.memory.heapUsed;
    const heapTotal = metrics.process.memory.heapTotal;
    const heapUsage = (heapUsed / heapTotal) * 100;
    
    if (heapUsage > 90) {
      this.bottlenecks.memory = {
        detected: true,
        severity: 'high',
        value: heapUsage,
        recommendation: 'Memory leak possible, check for unreleased resources'
      };
    } else if (heapUsage > 75) {
      this.bottlenecks.memory = {
        detected: true,
        severity: 'medium',
        value: heapUsage,
        recommendation: 'Consider increasing heap size or optimizing memory usage'
      };
    } else {
      this.bottlenecks.memory = null;
    }
    
    // I/O bottleneck (based on event loop lag)
    if (metrics.custom.eventLoopLag > 200) {
      this.bottlenecks.io = {
        detected: true,
        severity: 'high',
        value: metrics.custom.eventLoopLag,
        recommendation: 'Event loop blocked, check for synchronous I/O operations'
      };
    } else if (metrics.custom.eventLoopLag > 100) {
      this.bottlenecks.io = {
        detected: true,
        severity: 'medium',
        value: metrics.custom.eventLoopLag,
        recommendation: 'Event loop showing signs of blocking'
      };
    } else {
      this.bottlenecks.io = null;
    }
    
    // Emit bottleneck detection
    const activeBottlenecks = Object.entries(this.bottlenecks)
      .filter(([_, bottleneck]) => bottleneck?.detected)
      .map(([type, bottleneck]) => ({ type, ...bottleneck }));
    
    if (activeBottlenecks.length > 0) {
      this.emit('bottlenecks:detected', activeBottlenecks);
    }
  }

  /**
   * Analyze trends
   */
  analyzeTrends(metrics) {
    // Analyze CPU trend
    this.analyzeTrend('cpu', this.realTimeMetrics.cpu);
    
    // Analyze memory trend
    this.analyzeTrend('memory', this.realTimeMetrics.memory);
    
    // Analyze response time trend
    this.analyzeTrend('responseTime', this.realTimeMetrics.responseTime);
    
    // Analyze event loop lag trend
    this.analyzeTrend('eventLoopLag', this.realTimeMetrics.eventLoopLag);
  }

  /**
   * Analyze specific trend
   */
  analyzeTrend(name, data) {
    if (data.length < this.config.insights.minDataPoints) return;
    
    // Calculate trend direction
    const values = data.map(d => d.value);
    const trend = this.calculateTrend(values);
    
    // Store trend
    this.trends.set(name, {
      direction: trend.direction,
      slope: trend.slope,
      confidence: trend.confidence,
      prediction: trend.prediction,
      timestamp: Date.now()
    });
    
    // Check for concerning trends
    if (trend.direction === 'increasing' && trend.confidence > 0.8) {
      if (name === 'cpu' || name === 'memory' || name === 'eventLoopLag') {
        this.generateInsight(`${name}_trend`, {
          metric: name,
          trend: 'increasing',
          slope: trend.slope,
          prediction: `${name} expected to reach critical levels in ${trend.timeToThreshold} minutes`,
          severity: trend.timeToThreshold < 10 ? 'high' : 'medium'
        });
      }
    }
  }

  /**
   * Calculate trend
   */
  calculateTrend(values) {
    const n = values.length;
    if (n < 2) {
      return { direction: 'stable', slope: 0, confidence: 0 };
    }
    
    // Simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    
    for (let i = 0; i < n; i++) {
      const yPred = slope * i + intercept;
      ssTotal += Math.pow(values[i] - yMean, 2);
      ssResidual += Math.pow(values[i] - yPred, 2);
    }
    
    const rSquared = 1 - (ssResidual / ssTotal);
    
    // Determine direction
    let direction = 'stable';
    if (Math.abs(slope) > 0.1) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }
    
    // Predict when threshold will be reached (if increasing)
    let timeToThreshold = Infinity;
    if (direction === 'increasing') {
      const threshold = this.getThresholdForMetric(values[0]);
      if (threshold) {
        const currentValue = values[n - 1];
        const stepsToThreshold = (threshold - currentValue) / slope;
        timeToThreshold = stepsToThreshold * (this.config.analysisInterval / 60000); // in minutes
      }
    }
    
    return {
      direction,
      slope,
      confidence: rSquared,
      prediction: slope * n + intercept,
      timeToThreshold
    };
  }

  /**
   * Get threshold for metric
   */
  getThresholdForMetric(metricName) {
    const thresholds = {
      cpu: this.config.alertThresholds.cpuUsage,
      memory: this.config.alertThresholds.memoryUsage,
      eventLoopLag: this.config.alertThresholds.eventLoopLag,
      responseTime: this.config.alertThresholds.responseTime
    };
    
    return thresholds[metricName] || null;
  }

  /**
   * Generate insights
   */
  generateInsights(metrics) {
    // Memory leak detection
    const memoryTrend = this.trends.get('memory');
    if (memoryTrend && memoryTrend.direction === 'increasing' && memoryTrend.confidence > 0.7) {
      this.generateInsight('potential_memory_leak', {
        confidence: memoryTrend.confidence,
        growthRate: memoryTrend.slope,
        currentUsage: metrics.system.memory.percentage,
        recommendation: 'Review recent code changes for unreleased resources'
      });
    }
    
    // Performance degradation
    const responseTrend = this.trends.get('responseTime');
    if (responseTrend && responseTrend.direction === 'increasing') {
      this.generateInsight('performance_degradation', {
        metric: 'response_time',
        trend: responseTrend,
        recommendation: 'Investigate recent changes that may have impacted performance'
      });
    }
    
    // Resource correlation
    this.findResourceCorrelations();
  }

  /**
   * Generate specific insight
   */
  generateInsight(type, data) {
    const insight = {
      type,
      timestamp: Date.now(),
      data,
      id: `${type}_${Date.now()}`
    };
    
    this.insights.set(insight.id, insight);
    this.emit('insight:generated', insight);
    
    // Keep only recent insights
    const cutoff = Date.now() - 3600000; // 1 hour
    for (const [id, ins] of this.insights) {
      if (ins.timestamp < cutoff) {
        this.insights.delete(id);
      }
    }
  }

  /**
   * Find resource correlations
   */
  findResourceCorrelations() {
    // Check if CPU and memory usage are correlated
    if (this.realTimeMetrics.cpu.length >= 20 && this.realTimeMetrics.memory.length >= 20) {
      const cpuValues = this.realTimeMetrics.cpu.slice(-20).map(m => m.value);
      const memValues = this.realTimeMetrics.memory.slice(-20).map(m => m.value);
      
      const correlation = this.calculateCorrelation(cpuValues, memValues);
      
      if (Math.abs(correlation) > 0.7) {
        this.generateInsight('resource_correlation', {
          resources: ['cpu', 'memory'],
          correlation,
          interpretation: correlation > 0 
            ? 'CPU and memory usage are positively correlated'
            : 'CPU and memory usage are negatively correlated'
        });
      }
    }
  }

  /**
   * Calculate correlation
   */
  calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    this.recommendations = [];
    
    // Check bottlenecks
    for (const [type, bottleneck] of Object.entries(this.bottlenecks)) {
      if (bottleneck?.detected) {
        this.recommendations.push({
          type: `${type}_bottleneck`,
          severity: bottleneck.severity,
          recommendation: bottleneck.recommendation,
          actionable: true
        });
      }
    }
    
    // Check issues
    for (const issue of this.issues.values()) {
      const recommendation = this.getRecommendationForIssue(issue);
      if (recommendation) {
        this.recommendations.push(recommendation);
      }
    }
    
    // Check insights
    for (const insight of this.insights.values()) {
      if (insight.data.recommendation) {
        this.recommendations.push({
          type: insight.type,
          severity: insight.data.severity || 'medium',
          recommendation: insight.data.recommendation,
          actionable: true
        });
      }
    }
    
    // Sort by severity
    this.recommendations.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
    
    // Emit recommendations
    if (this.recommendations.length > 0) {
      this.emit('recommendations:generated', this.recommendations);
      this.analysisState.recommendationsMade += this.recommendations.length;
    }
  }

  /**
   * Get recommendation for issue
   */
  getRecommendationForIssue(issue) {
    const recommendations = {
      high_cpu: {
        recommendation: 'Consider optimizing CPU-intensive operations or scaling horizontally',
        actionable: true
      },
      high_memory: {
        recommendation: 'Review memory allocations and check for memory leaks',
        actionable: true
      },
      event_loop_blocked: {
        recommendation: 'Identify and optimize blocking operations, consider using worker threads',
        actionable: true
      },
      high_error_rate: {
        recommendation: 'Review error logs and recent deployments for issues',
        actionable: true
      },
      slow_operation: {
        recommendation: `Optimize operation: ${issue.data.name}`,
        actionable: true
      }
    };
    
    const rec = recommendations[issue.type];
    if (rec) {
      return {
        type: issue.type,
        severity: issue.severity || 'medium',
        ...rec
      };
    }
    
    return null;
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(metrics) {
    // Check each metric against baseline
    for (const [key, value] of Object.entries(this.flattenMetrics(metrics))) {
      if (typeof value !== 'number') continue;
      
      const baseline = this.windows.baseline.get(key);
      if (!baseline) continue;
      
      // Calculate z-score
      const mean = baseline.mean || value;
      const stdDev = baseline.stdDev || 1;
      const zScore = Math.abs((value - mean) / stdDev);
      
      // Detect anomaly
      if (zScore > 3) {
        this.emit('anomaly:detected', {
          metric: key,
          value,
          expected: mean,
          zScore,
          severity: zScore > 5 ? 'high' : 'medium'
        });
      }
    }
  }

  /**
   * Predict future issues
   */
  predictIssues(metrics) {
    // Use trends to predict issues
    for (const [name, trend] of this.trends) {
      if (trend.direction === 'increasing' && trend.confidence > 0.7) {
        const threshold = this.getThresholdForMetric(name);
        if (threshold && trend.timeToThreshold < 30) {
          this.predictions.set(name, {
            metric: name,
            prediction: `${name} will exceed threshold in ${Math.round(trend.timeToThreshold)} minutes`,
            confidence: trend.confidence,
            preventiveAction: this.getPreventiveAction(name)
          });
        }
      }
    }
    
    // Emit predictions
    if (this.predictions.size > 0) {
      this.emit('predictions:made', Array.from(this.predictions.values()));
    }
  }

  /**
   * Get preventive action
   */
  getPreventiveAction(metric) {
    const actions = {
      cpu: 'Scale resources or optimize CPU-intensive operations',
      memory: 'Increase memory allocation or fix memory leaks',
      eventLoopLag: 'Optimize blocking operations or use worker threads',
      responseTime: 'Cache frequently accessed data or optimize slow queries'
    };
    
    return actions[metric] || 'Monitor closely and prepare for mitigation';
  }

  /**
   * Detect issue
   */
  detectIssue(type, data) {
    const issue = {
      type,
      data,
      timestamp: Date.now(),
      id: `${type}_${Date.now()}`
    };
    
    this.issues.set(issue.id, issue);
    this.analysisState.issuesDetected++;
    
    this.emit('issue:detected', issue);
    
    // Keep only recent issues
    const cutoff = Date.now() - 3600000; // 1 hour
    for (const [id, iss] of this.issues) {
      if (iss.timestamp < cutoff) {
        this.issues.delete(id);
      }
    }
  }

  /**
   * Calculate severity
   */
  calculateSeverity(value, threshold) {
    const ratio = value / threshold;
    
    if (ratio > 1.5) return 'critical';
    if (ratio > 1.2) return 'high';
    if (ratio > 1.0) return 'medium';
    return 'low';
  }

  /**
   * Calculate CPU usage
   */
  calculateCPUUsage(cpus) {
    if (!this.lastCPUs) {
      this.lastCPUs = cpus;
      return 0;
    }
    
    let totalDiff = 0;
    let idleDiff = 0;
    
    for (let i = 0; i < cpus.length; i++) {
      const cpu = cpus[i];
      const lastCpu = this.lastCPUs[i];
      
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const lastTotal = Object.values(lastCpu.times).reduce((a, b) => a + b, 0);
      
      totalDiff += total - lastTotal;
      idleDiff += cpu.times.idle - lastCpu.times.idle;
    }
    
    this.lastCPUs = cpus;
    
    const usage = 100 - (100 * idleDiff / totalDiff);
    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const framework = global.bumbaFramework;
    if (!framework) return 0;
    
    const total = framework.metrics?.totalRequests || 1;
    const errors = framework.metrics?.totalErrors || 0;
    
    return (errors / total) * 100;
  }

  /**
   * Measure event loop lag
   */
  measureEventLoopLag() {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      this.lastEventLoopLag = lag;
    });
    
    return this.lastEventLoopLag || 0;
  }

  /**
   * Get GC stats
   */
  getGCStats() {
    // Would need v8 module or performance hooks for actual GC stats
    return {
      collections: 0,
      pauseTime: 0
    };
  }

  /**
   * Get performance marks
   */
  getPerformanceMarks() {
    const marks = [];
    
    for (const [name, entries] of this.windows.current) {
      if (name.startsWith('mark:')) {
        marks.push({
          name: name.substring(5),
          count: entries.length,
          lastTimestamp: entries[entries.length - 1]?.timestamp
        });
      }
    }
    
    return marks;
  }

  /**
   * Establish baseline metrics
   */
  async establishBaseline() {
    // Collect metrics for baseline
    const samples = [];
    
    for (let i = 0; i < 10; i++) {
      const metrics = await this.collectMetrics();
      samples.push(metrics);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Calculate baseline statistics
    const flattened = samples.map(s => this.flattenMetrics(s));
    const baseline = new Map();
    
    // Get all keys
    const allKeys = new Set();
    flattened.forEach(f => Object.keys(f).forEach(k => allKeys.add(k)));
    
    // Calculate stats for each key
    for (const key of allKeys) {
      const values = flattened.map(f => f[key]).filter(v => typeof v === 'number');
      
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        baseline.set(key, { mean, stdDev, min: Math.min(...values), max: Math.max(...values) });
      }
    }
    
    this.windows.baseline = baseline;
  }

  /**
   * Flatten metrics object
   */
  flattenMetrics(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenMetrics(value, fullKey));
      } else if (typeof value === 'number') {
        flattened[fullKey] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Get analysis summary
   */
  getAnalysisSummary() {
    return {
      state: this.analysisState,
      issues: Array.from(this.issues.values()),
      insights: Array.from(this.insights.values()),
      recommendations: this.recommendations,
      bottlenecks: Object.entries(this.bottlenecks)
        .filter(([_, b]) => b?.detected)
        .map(([type, b]) => ({ type, ...b })),
      trends: Object.fromEntries(this.trends),
      predictions: Array.from(this.predictions.values())
    };
  }

  /**
   * Stop analyzer
   */
  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    logger.info('Performance analyzer stopped');
  }
}

// Export singleton instance
module.exports = new RealTimePerformanceAnalyzer({ enabled: true });