/**
 * BUMBA Learning Analytics Module
 * Advanced analytics for learning insights
 * Part of Human Learning Module Enhancement - Sprint 4
 * 
 * FRAMEWORK DESIGN:
 * - Analytics without external BI tools
 * - Real-time learning metrics
 * - Performance tracking and optimization
 * - Works without external analytics libraries
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

/**
 * Learning Analytics for comprehensive insights
 */
class LearningAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      metricsWindow: config.metricsWindow || 3600000, // 1 hour
      aggregationInterval: config.aggregationInterval || 60000, // 1 minute
      retentionPeriod: config.retentionPeriod || 30, // Days
      dashboardEnabled: config.dashboardEnabled !== false,
      realtimeAnalytics: config.realtimeAnalytics !== false,
      persistencePath: config.persistencePath || path.join(process.env.HOME, '.claude', 'learning-analytics'),
      ...config
    };
    
    // Core metrics
    this.metrics = {
      learning: {
        patternsLearned: 0,
        adaptationsMade: 0,
        predictionAccuracy: 0,
        learningRate: 0,
        knowledgeRetention: 0
      },
      performance: {
        responseTime: [],
        throughput: 0,
        errorRate: 0,
        successRate: 0,
        efficiency: 0
      },
      user: {
        totalUsers: 0,
        activeUsers: 0,
        engagementScore: 0,
        satisfactionScore: 0,
        retentionRate: 0
      },
      system: {
        uptime: 0,
        resourceUsage: 0,
        modelVersion: 1,
        lastUpdate: Date.now()
      }
    };
    
    // Time series data
    this.timeSeries = {
      learning: [],
      performance: [],
      user: [],
      events: []
    };
    
    // Analytics dimensions
    this.dimensions = {
      temporal: this.analyzeTemporalPatterns.bind(this),
      behavioral: this.analyzeBehavioralPatterns.bind(this),
      performance: this.analyzePerformancePatterns.bind(this),
      predictive: this.analyzePredictivePatterns.bind(this),
      comparative: this.analyzeComparativePatterns.bind(this)
    };
    
    // KPI tracking
    this.kpis = new Map();
    this.initializeKPIs();
    
    // Cohort analysis
    this.cohorts = new Map();
    
    // A/B testing
    this.experiments = new Map();
    
    // Custom metrics
    this.customMetrics = new Map();
    
    // Analytics cache
    this.analyticsCache = new Map();
    
    // Alert thresholds
    this.alertThresholds = {
      errorRate: 0.1,
      responseTime: 1000,
      learningRate: -0.1,
      engagementDrop: 0.3
    };
    
    this.initialize();
  }
  
  /**
   * Initialize learning analytics
   */
  async initialize() {
    try {
      // Create analytics directory
      await fs.mkdir(this.config.persistencePath, { recursive: true });
      
      // Load historical data
      await this.loadHistoricalData();
      
      // Start metric collection
      this.startMetricCollection();
      
      // Start aggregation
      this.startAggregation();
      
      // Initialize dashboard if enabled
      if (this.config.dashboardEnabled) {
        this.initializeDashboard();
      }
      
      logger.info('📊 Learning Analytics initialized');
      
      this.emit('initialized', {
        dimensions: Object.keys(this.dimensions),
        kpis: this.kpis.size,
        realtime: this.config.realtimeAnalytics
      });
      
    } catch (error) {
      logger.error('Failed to initialize Learning Analytics:', error);
    }
  }
  
  /**
   * Track learning event
   */
  async trackEvent(eventType, eventData = {}) {
    try {
      const event = {
        type: eventType,
        data: eventData,
        timestamp: Date.now(),
        sessionId: eventData.sessionId || 'default',
        userId: eventData.userId || 'anonymous'
      };
      
      // Add to time series
      this.timeSeries.events.push(event);
      
      // Update relevant metrics
      await this.updateMetrics(eventType, eventData);
      
      // Real-time processing if enabled
      if (this.config.realtimeAnalytics) {
        await this.processRealtime(event);
      }
      
      // Check alerts
      await this.checkAlerts(event);
      
      // Update KPIs
      await this.updateKPIs(event);
      
      this.emit('event-tracked', {
        type: eventType,
        timestamp: event.timestamp
      });
      
      return {
        tracked: true,
        eventId: `${eventType}_${event.timestamp}`
      };
      
    } catch (error) {
      logger.error('Failed to track event:', error);
      return { tracked: false, error: error.message };
    }
  }
  
  /**
   * Get analytics dashboard
   */
  async getDashboard(timeRange = 'hour') {
    try {
      const cacheKey = `dashboard_${timeRange}`;
      
      // Check cache
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
          return cached.data;
        }
      }
      
      // Generate dashboard data
      const dashboard = {
        summary: await this.getSummaryMetrics(timeRange),
        trends: await this.getTrends(timeRange),
        kpis: await this.getKPIStatus(),
        insights: await this.getInsights(timeRange),
        recommendations: await this.getRecommendations(),
        alerts: await this.getActiveAlerts()
      };
      
      // Cache result
      this.analyticsCache.set(cacheKey, {
        data: dashboard,
        timestamp: Date.now()
      });
      
      return dashboard;
      
    } catch (error) {
      logger.error('Failed to generate dashboard:', error);
      return {};
    }
  }
  
  /**
   * Analyze learning patterns
   */
  async analyzeLearning(userId = null) {
    try {
      const analysis = {
        patterns: await this.dimensions.temporal(userId),
        behaviors: await this.dimensions.behavioral(userId),
        performance: await this.dimensions.performance(userId),
        predictions: await this.dimensions.predictive(userId),
        comparisons: await this.dimensions.comparative(userId)
      };
      
      // Generate insights
      analysis.insights = this.generateLearningInsights(analysis);
      
      // Calculate scores
      analysis.scores = {
        overall: this.calculateOverallScore(analysis),
        efficiency: this.calculateEfficiencyScore(analysis),
        effectiveness: this.calculateEffectivenessScore(analysis),
        engagement: this.calculateEngagementScore(analysis)
      };
      
      return analysis;
      
    } catch (error) {
      logger.error('Failed to analyze learning:', error);
      return {};
    }
  }
  
  /**
   * Get performance report
   */
  async getPerformanceReport(period = 'day') {
    try {
      const report = {
        period,
        metrics: {
          avgResponseTime: this.calculateAverage(this.metrics.performance.responseTime),
          throughput: this.metrics.performance.throughput,
          errorRate: this.metrics.performance.errorRate,
          successRate: this.metrics.performance.successRate,
          efficiency: this.metrics.performance.efficiency
        },
        trends: this.calculateTrends(period),
        bottlenecks: await this.identifyBottlenecks(),
        optimizations: await this.suggestOptimizations()
      };
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      return {};
    }
  }
  
  /**
   * Run A/B test
   */
  async runExperiment(experimentName, variants, metrics) {
    try {
      const experiment = {
        name: experimentName,
        variants,
        metrics,
        startTime: Date.now(),
        results: new Map(),
        status: 'running'
      };
      
      this.experiments.set(experimentName, experiment);
      
      // Initialize variant tracking
      for (const variant of variants) {
        experiment.results.set(variant, {
          exposures: 0,
          conversions: 0,
          metrics: {}
        });
      }
      
      this.emit('experiment-started', {
        name: experimentName,
        variants: variants.length
      });
      
      return {
        started: true,
        experimentId: experimentName,
        variants
      };
      
    } catch (error) {
      logger.error('Failed to start experiment:', error);
      return { started: false, error: error.message };
    }
  }
  
  /**
   * Track custom metric
   */
  async trackCustomMetric(name, value, tags = {}) {
    try {
      if (!this.customMetrics.has(name)) {
        this.customMetrics.set(name, {
          values: [],
          tags: {},
          aggregates: {}
        });
      }
      
      const metric = this.customMetrics.get(name);
      
      // Add value with timestamp
      metric.values.push({
        value,
        timestamp: Date.now(),
        tags
      });
      
      // Update aggregates
      metric.aggregates = {
        count: metric.values.length,
        sum: metric.values.reduce((s, v) => s + v.value, 0),
        avg: metric.values.reduce((s, v) => s + v.value, 0) / metric.values.length,
        min: Math.min(...metric.values.map(v => v.value)),
        max: Math.max(...metric.values.map(v => v.value))
      };
      
      // Keep last 1000 values
      if (metric.values.length > 1000) {
        metric.values.shift();
      }
      
      return {
        tracked: true,
        metric: name,
        aggregates: metric.aggregates
      };
      
    } catch (error) {
      logger.error('Failed to track custom metric:', error);
      return { tracked: false, error: error.message };
    }
  }
  
  // Analytics dimensions
  
  async analyzeTemporalPatterns(userId) {
    const patterns = {
      hourly: {},
      daily: {},
      weekly: {},
      trends: []
    };
    
    // Analyze events by time
    const events = userId ? 
      this.timeSeries.events.filter(e => e.userId === userId) :
      this.timeSeries.events;
    
    for (const event of events) {
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      
      patterns.hourly[hour] = (patterns.hourly[hour] || 0) + 1;
      patterns.daily[day] = (patterns.daily[day] || 0) + 1;
    }
    
    // Identify trends
    patterns.trends = this.identifyTrends(events);
    
    return patterns;
  }
  
  async analyzeBehavioralPatterns(userId) {
    const patterns = {
      sequences: [],
      frequencies: {},
      clusters: []
    };
    
    const events = userId ?
      this.timeSeries.events.filter(e => e.userId === userId) :
      this.timeSeries.events;
    
    // Find common sequences
    for (let i = 0; i < events.length - 2; i++) {
      const sequence = [
        events[i].type,
        events[i + 1].type,
        events[i + 2].type
      ];
      
      patterns.sequences.push({
        sequence,
        timestamp: events[i].timestamp
      });
    }
    
    // Calculate frequencies
    for (const event of events) {
      patterns.frequencies[event.type] = (patterns.frequencies[event.type] || 0) + 1;
    }
    
    // Simple clustering by event type
    const clusters = {};
    for (const event of events) {
      if (!clusters[event.type]) {
        clusters[event.type] = [];
      }
      clusters[event.type].push(event);
    }
    patterns.clusters = Object.entries(clusters).map(([type, events]) => ({
      type,
      size: events.length,
      avgInterval: this.calculateAverageInterval(events)
    }));
    
    return patterns;
  }
  
  async analyzePerformancePatterns(userId) {
    const patterns = {
      responseTime: {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      throughput: {
        current: 0,
        peak: 0,
        average: 0
      },
      errors: {
        rate: 0,
        types: {}
      }
    };
    
    // Calculate response time percentiles
    if (this.metrics.performance.responseTime.length > 0) {
      const sorted = [...this.metrics.performance.responseTime].sort((a, b) => a - b);
      patterns.responseTime.avg = this.calculateAverage(sorted);
      patterns.responseTime.p50 = sorted[Math.floor(sorted.length * 0.5)];
      patterns.responseTime.p95 = sorted[Math.floor(sorted.length * 0.95)];
      patterns.responseTime.p99 = sorted[Math.floor(sorted.length * 0.99)];
    }
    
    // Throughput patterns
    patterns.throughput.current = this.metrics.performance.throughput;
    patterns.throughput.average = this.calculateAverageThroughput();
    
    // Error patterns
    patterns.errors.rate = this.metrics.performance.errorRate;
    
    return patterns;
  }
  
  async analyzePredictivePatterns(userId) {
    const patterns = {
      nextAction: null,
      likelihood: 0,
      alternatives: [],
      confidence: 0
    };
    
    const events = userId ?
      this.timeSeries.events.filter(e => e.userId === userId) :
      this.timeSeries.events;
    
    if (events.length > 0) {
      // Simple prediction based on frequency
      const lastEvent = events[events.length - 1];
      const nextEvents = {};
      
      for (let i = 0; i < events.length - 1; i++) {
        if (events[i].type === lastEvent.type) {
          const next = events[i + 1].type;
          nextEvents[next] = (nextEvents[next] || 0) + 1;
        }
      }
      
      // Find most likely next event
      let maxCount = 0;
      for (const [event, count] of Object.entries(nextEvents)) {
        if (count > maxCount) {
          patterns.nextAction = event;
          maxCount = count;
        }
      }
      
      // Calculate likelihood
      const total = Object.values(nextEvents).reduce((a, b) => a + b, 0);
      patterns.likelihood = total > 0 ? maxCount / total : 0;
      patterns.confidence = Math.min(1, total / 10); // Confidence based on sample size
      
      // Get alternatives
      patterns.alternatives = Object.entries(nextEvents)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([event, count]) => ({
          action: event,
          probability: count / total
        }));
    }
    
    return patterns;
  }
  
  async analyzeComparativePatterns(userId) {
    const patterns = {
      vsAverage: {},
      percentile: 0,
      strengths: [],
      improvements: []
    };
    
    if (userId) {
      // Compare user metrics to average
      const userEvents = this.timeSeries.events.filter(e => e.userId === userId);
      const allEvents = this.timeSeries.events;
      
      const userFreq = userEvents.length;
      const avgFreq = allEvents.length / (this.metrics.user.totalUsers || 1);
      
      patterns.vsAverage = {
        activity: userFreq / avgFreq,
        engagement: this.calculateUserEngagement(userId) / this.metrics.user.engagementScore
      };
      
      // Calculate percentile
      patterns.percentile = this.calculateUserPercentile(userId);
      
      // Identify strengths and improvements
      if (patterns.vsAverage.activity > 1.2) {
        patterns.strengths.push('High activity level');
      } else if (patterns.vsAverage.activity < 0.8) {
        patterns.improvements.push('Increase activity');
      }
      
      if (patterns.vsAverage.engagement > 1.2) {
        patterns.strengths.push('Strong engagement');
      } else if (patterns.vsAverage.engagement < 0.8) {
        patterns.improvements.push('Improve engagement');
      }
    }
    
    return patterns;
  }
  
  // Helper methods
  
  initializeKPIs() {
    // Core KPIs
    this.kpis.set('learningVelocity', {
      target: 10,
      current: 0,
      unit: 'patterns/hour'
    });
    
    this.kpis.set('predictionAccuracy', {
      target: 0.8,
      current: 0,
      unit: 'ratio'
    });
    
    this.kpis.set('userSatisfaction', {
      target: 0.85,
      current: 0,
      unit: 'score'
    });
    
    this.kpis.set('systemEfficiency', {
      target: 0.9,
      current: 0,
      unit: 'ratio'
    });
  }
  
  async updateMetrics(eventType, eventData) {
    // Update learning metrics
    if (eventType === 'pattern_learned') {
      this.metrics.learning.patternsLearned++;
    } else if (eventType === 'adaptation_made') {
      this.metrics.learning.adaptationsMade++;
    } else if (eventType === 'prediction') {
      if (eventData.correct) {
        this.metrics.learning.predictionAccuracy = 
          (this.metrics.learning.predictionAccuracy * 0.9 + 1 * 0.1);
      } else {
        this.metrics.learning.predictionAccuracy = 
          (this.metrics.learning.predictionAccuracy * 0.9 + 0 * 0.1);
      }
    }
    
    // Update performance metrics
    if (eventData.responseTime) {
      this.metrics.performance.responseTime.push(eventData.responseTime);
      if (this.metrics.performance.responseTime.length > 100) {
        this.metrics.performance.responseTime.shift();
      }
    }
    
    if (eventData.error) {
      this.metrics.performance.errorRate = 
        (this.metrics.performance.errorRate * 0.95 + 1 * 0.05);
    } else if (eventData.success) {
      this.metrics.performance.successRate = 
        (this.metrics.performance.successRate * 0.95 + 1 * 0.05);
    }
    
    // Update user metrics
    if (eventData.userId && !eventData.userId.includes('anonymous')) {
      this.metrics.user.activeUsers = new Set(
        this.timeSeries.events
          .filter(e => Date.now() - e.timestamp < 3600000)
          .map(e => e.userId)
      ).size;
    }
  }
  
  async processRealtime(event) {
    // Real-time processing logic
    this.emit('realtime-event', {
      type: event.type,
      timestamp: event.timestamp,
      metrics: this.getCurrentMetrics()
    });
  }
  
  async checkAlerts(event) {
    const alerts = [];
    
    // Check error rate
    if (this.metrics.performance.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate_high',
        severity: 'warning',
        value: this.metrics.performance.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }
    
    // Check response time
    const avgResponseTime = this.calculateAverage(this.metrics.performance.responseTime);
    if (avgResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time_high',
        severity: 'warning',
        value: avgResponseTime,
        threshold: this.alertThresholds.responseTime
      });
    }
    
    if (alerts.length > 0) {
      this.emit('alerts', alerts);
    }
    
    return alerts;
  }
  
  async updateKPIs(event) {
    // Update learning velocity
    const recentPatterns = this.timeSeries.events
      .filter(e => e.type === 'pattern_learned' && Date.now() - e.timestamp < 3600000)
      .length;
    
    this.kpis.get('learningVelocity').current = recentPatterns;
    
    // Update prediction accuracy
    this.kpis.get('predictionAccuracy').current = this.metrics.learning.predictionAccuracy;
    
    // Update system efficiency
    this.kpis.get('systemEfficiency').current = this.metrics.performance.efficiency;
  }
  
  async getSummaryMetrics(timeRange) {
    const now = Date.now();
    const ranges = {
      hour: 3600000,
      day: 86400000,
      week: 604800000
    };
    
    const range = ranges[timeRange] || ranges.hour;
    const events = this.timeSeries.events.filter(e => now - e.timestamp < range);
    
    return {
      totalEvents: events.length,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      avgResponseTime: this.calculateAverage(this.metrics.performance.responseTime),
      errorRate: this.metrics.performance.errorRate,
      learningRate: this.metrics.learning.learningRate
    };
  }
  
  async getTrends(timeRange) {
    // Simple trend calculation
    const trends = {
      learning: 'stable',
      performance: 'stable',
      engagement: 'stable'
    };
    
    // Calculate trends based on recent vs historical data
    const recent = this.timeSeries.events.filter(e => 
      Date.now() - e.timestamp < 3600000
    ).length;
    
    const historical = this.timeSeries.events.filter(e => 
      Date.now() - e.timestamp > 3600000 && Date.now() - e.timestamp < 7200000
    ).length;
    
    if (recent > historical * 1.1) trends.learning = 'increasing';
    else if (recent < historical * 0.9) trends.learning = 'decreasing';
    
    return trends;
  }
  
  async getKPIStatus() {
    const status = {};
    
    for (const [name, kpi] of this.kpis) {
      const achievement = kpi.current / kpi.target;
      status[name] = {
        ...kpi,
        achievement,
        status: achievement >= 1 ? 'met' : achievement >= 0.8 ? 'approaching' : 'below'
      };
    }
    
    return status;
  }
  
  async getInsights(timeRange) {
    const insights = [];
    
    // Generate insights based on metrics
    if (this.metrics.learning.predictionAccuracy > 0.8) {
      insights.push({
        type: 'positive',
        message: 'Prediction accuracy is excellent',
        metric: 'predictionAccuracy',
        value: this.metrics.learning.predictionAccuracy
      });
    }
    
    if (this.metrics.performance.errorRate > 0.1) {
      insights.push({
        type: 'warning',
        message: 'Error rate is above threshold',
        metric: 'errorRate',
        value: this.metrics.performance.errorRate
      });
    }
    
    return insights;
  }
  
  async getRecommendations() {
    const recommendations = [];
    
    // Generate recommendations based on analysis
    if (this.metrics.performance.errorRate > 0.05) {
      recommendations.push({
        priority: 'high',
        action: 'Investigate error patterns',
        impact: 'Reduce error rate by 50%'
      });
    }
    
    if (this.metrics.user.engagementScore < 0.7) {
      recommendations.push({
        priority: 'medium',
        action: 'Improve user engagement features',
        impact: 'Increase engagement by 20%'
      });
    }
    
    return recommendations;
  }
  
  async getActiveAlerts() {
    return await this.checkAlerts({});
  }
  
  generateLearningInsights(analysis) {
    const insights = [];
    
    if (analysis.patterns?.trends?.length > 0) {
      insights.push(`Identified ${analysis.patterns.trends.length} learning trends`);
    }
    
    if (analysis.performance?.responseTime?.p95 > 1000) {
      insights.push('Response time needs optimization');
    }
    
    return insights;
  }
  
  calculateOverallScore(analysis) {
    let score = 0.5;
    
    if (analysis.performance?.responseTime?.avg < 500) score += 0.1;
    if (analysis.patterns?.trends?.length > 5) score += 0.1;
    if (analysis.predictions?.confidence > 0.7) score += 0.1;
    
    return Math.min(1, score);
  }
  
  calculateEfficiencyScore(analysis) {
    return this.metrics.performance.efficiency || 0.5;
  }
  
  calculateEffectivenessScore(analysis) {
    return this.metrics.learning.predictionAccuracy || 0.5;
  }
  
  calculateEngagementScore(analysis) {
    return this.metrics.user.engagementScore || 0.5;
  }
  
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  calculateAverageThroughput() {
    const hourAgo = Date.now() - 3600000;
    const recentEvents = this.timeSeries.events.filter(e => e.timestamp > hourAgo);
    return recentEvents.length / 3600; // Events per second
  }
  
  identifyTrends(events) {
    const trends = [];
    
    if (events.length < 10) return trends;
    
    // Simple trend detection
    const recent = events.slice(-10);
    const older = events.slice(-20, -10);
    
    const recentTypes = {};
    const olderTypes = {};
    
    for (const event of recent) {
      recentTypes[event.type] = (recentTypes[event.type] || 0) + 1;
    }
    
    for (const event of older) {
      olderTypes[event.type] = (olderTypes[event.type] || 0) + 1;
    }
    
    for (const type in recentTypes) {
      const growth = (recentTypes[type] - (olderTypes[type] || 0)) / Math.max(olderTypes[type] || 1, 1);
      if (Math.abs(growth) > 0.5) {
        trends.push({
          type,
          direction: growth > 0 ? 'increasing' : 'decreasing',
          magnitude: Math.abs(growth)
        });
      }
    }
    
    return trends;
  }
  
  calculateAverageInterval(events) {
    if (events.length < 2) return 0;
    
    let totalInterval = 0;
    for (let i = 1; i < events.length; i++) {
      totalInterval += events[i].timestamp - events[i - 1].timestamp;
    }
    
    return totalInterval / (events.length - 1);
  }
  
  calculateUserEngagement(userId) {
    const userEvents = this.timeSeries.events.filter(e => e.userId === userId);
    const recent = userEvents.filter(e => Date.now() - e.timestamp < 3600000);
    
    return recent.length / Math.max(userEvents.length, 1);
  }
  
  calculateUserPercentile(userId) {
    // Simple percentile calculation
    const userEvents = this.timeSeries.events.filter(e => e.userId === userId).length;
    const allUsers = [...new Set(this.timeSeries.events.map(e => e.userId))];
    
    let rank = 0;
    for (const user of allUsers) {
      const count = this.timeSeries.events.filter(e => e.userId === user).length;
      if (count < userEvents) rank++;
    }
    
    return (rank / allUsers.length) * 100;
  }
  
  calculateTrends(period) {
    // Placeholder for trend calculation
    return {
      learning: 'stable',
      performance: 'improving',
      engagement: 'stable'
    };
  }
  
  async identifyBottlenecks() {
    const bottlenecks = [];
    
    if (this.metrics.performance.responseTime.length > 0) {
      const p95 = this.metrics.performance.responseTime
        .sort((a, b) => a - b)[Math.floor(this.metrics.performance.responseTime.length * 0.95)];
      
      if (p95 > 1000) {
        bottlenecks.push({
          type: 'response_time',
          severity: 'high',
          value: p95,
          recommendation: 'Optimize slow operations'
        });
      }
    }
    
    return bottlenecks;
  }
  
  async suggestOptimizations() {
    const optimizations = [];
    
    if (this.metrics.performance.errorRate > 0.05) {
      optimizations.push({
        area: 'error_handling',
        suggestion: 'Implement better error recovery',
        expectedImprovement: '50% error reduction'
      });
    }
    
    if (this.calculateAverage(this.metrics.performance.responseTime) > 500) {
      optimizations.push({
        area: 'performance',
        suggestion: 'Cache frequently accessed data',
        expectedImprovement: '30% faster responses'
      });
    }
    
    return optimizations;
  }
  
  getCurrentMetrics() {
    return {
      learning: this.metrics.learning,
      performance: {
        ...this.metrics.performance,
        avgResponseTime: this.calculateAverage(this.metrics.performance.responseTime)
      },
      user: this.metrics.user
    };
  }
  
  initializeDashboard() {
    // Dashboard initialization (text-based since no external libraries)
    logger.info('📈 Analytics dashboard ready');
  }
  
  async loadHistoricalData() {
    try {
      const dataFile = path.join(this.config.persistencePath, 'analytics-history.json');
      
      if (await this.fileExists(dataFile)) {
        const data = await fs.readFile(dataFile, 'utf8');
        const history = JSON.parse(data);
        
        // Restore metrics
        if (history.metrics) {
          this.metrics = { ...this.metrics, ...history.metrics };
        }
        
        // Restore recent time series
        if (history.timeSeries) {
          const cutoff = Date.now() - this.config.retentionPeriod * 24 * 3600000;
          this.timeSeries.events = history.timeSeries.events
            .filter(e => e.timestamp > cutoff);
        }
        
        logger.info(`Loaded ${this.timeSeries.events.length} historical events`);
      }
      
    } catch (error) {
      logger.error('Failed to load historical data:', error);
    }
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Start metric collection
   */
  startMetricCollection() {
    setInterval(() => {
      // Update system metrics
      this.metrics.system.uptime = Date.now() - this.metrics.system.lastUpdate;
      
      // Calculate throughput
      const recentEvents = this.timeSeries.events
        .filter(e => Date.now() - e.timestamp < 60000);
      this.metrics.performance.throughput = recentEvents.length / 60;
      
      // Update efficiency
      this.metrics.performance.efficiency = 
        this.metrics.performance.successRate * (1 - this.metrics.performance.errorRate);
      
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Start aggregation
   */
  startAggregation() {
    setInterval(async () => {
      // Clean old events
      const cutoff = Date.now() - this.config.retentionPeriod * 24 * 3600000;
      this.timeSeries.events = this.timeSeries.events.filter(e => e.timestamp > cutoff);
      
      // Save snapshot
      await this.saveSnapshot();
      
      // Clear old cache
      for (const [key, cached] of this.analyticsCache) {
        if (Date.now() - cached.timestamp > 300000) { // 5 minutes
          this.analyticsCache.delete(key);
        }
      }
      
    }, this.config.aggregationInterval);
  }
  
  async saveSnapshot() {
    try {
      const snapshot = {
        metrics: this.metrics,
        timeSeries: {
          events: this.timeSeries.events.slice(-1000) // Keep last 1000 events
        },
        timestamp: Date.now()
      };
      
      const snapshotFile = path.join(this.config.persistencePath, 'analytics-history.json');
      await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2));
      
    } catch (error) {
      logger.error('Failed to save analytics snapshot:', error);
    }
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      eventCount: this.timeSeries.events.length,
      kpiCount: this.kpis.size,
      experimentCount: this.experiments.size,
      customMetricCount: this.customMetrics.size,
      cacheSize: this.analyticsCache.size
    };
  }
}

module.exports = LearningAnalytics;