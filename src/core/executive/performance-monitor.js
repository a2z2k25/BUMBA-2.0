/**
 * Executive Performance Monitor
 * Comprehensive performance monitoring and analytics for executive systems
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Performance metrics categories
 */
const MetricCategory = {
  DECISION: 'decision',
  STRATEGY: 'strategy',
  RESOURCE: 'resource',
  TEAM: 'team',
  INNOVATION: 'innovation',
  OPERATIONAL: 'operational'
};

/**
 * Performance thresholds
 */
const PerformanceThreshold = {
  EXCELLENT: 90,
  GOOD: 75,
  ACCEPTABLE: 60,
  POOR: 40,
  CRITICAL: 25
};

class ExecutivePerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      enableRealTimeMonitoring: true,
      enablePredictiveAnalytics: true,
      enableAnomalyDetection: true,
      metricsRetentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      alertThreshold: PerformanceThreshold.ACCEPTABLE,
      samplingInterval: 60000, // 1 minute
      ...config
    };
    
    // Performance data storage
    this.metrics = new Map();
    this.kpis = new Map();
    this.trends = new Map();
    this.anomalies = [];
    this.alerts = [];
    
    // Real-time tracking
    this.currentPerformance = {
      overall: 0,
      categories: {},
      timestamp: Date.now()
    };
    
    // Initialize KPIs
    this.initializeKPIs();
    
    // Start monitoring
    if (this.config.enableRealTimeMonitoring) {
      this.startMonitoring();
    }
    
    logger.info('📊 Executive Performance Monitor initialized');
  }

  /**
   * Initialize Key Performance Indicators
   */
  initializeKPIs() {
    // Decision KPIs
    this.kpis.set('decision_speed', {
      name: 'Decision Speed',
      category: MetricCategory.DECISION,
      target: 85,
      weight: 0.15,
      unit: 'score',
      description: 'Speed of decision making process'
    });
    
    this.kpis.set('decision_accuracy', {
      name: 'Decision Accuracy',
      category: MetricCategory.DECISION,
      target: 90,
      weight: 0.2,
      unit: 'percentage',
      description: 'Accuracy of decisions made'
    });
    
    // Strategy KPIs
    this.kpis.set('strategy_alignment', {
      name: 'Strategy Alignment',
      category: MetricCategory.STRATEGY,
      target: 80,
      weight: 0.15,
      unit: 'score',
      description: 'Alignment of strategies with goals'
    });
    
    this.kpis.set('strategy_execution', {
      name: 'Strategy Execution',
      category: MetricCategory.STRATEGY,
      target: 75,
      weight: 0.1,
      unit: 'percentage',
      description: 'Strategy execution rate'
    });
    
    // Resource KPIs
    this.kpis.set('resource_utilization', {
      name: 'Resource Utilization',
      category: MetricCategory.RESOURCE,
      target: 80,
      weight: 0.1,
      unit: 'percentage',
      description: 'Efficiency of resource usage'
    });
    
    // Team KPIs
    this.kpis.set('team_productivity', {
      name: 'Team Productivity',
      category: MetricCategory.TEAM,
      target: 85,
      weight: 0.1,
      unit: 'score',
      description: 'Team productivity level'
    });
    
    // Innovation KPIs
    this.kpis.set('innovation_index', {
      name: 'Innovation Index',
      category: MetricCategory.INNOVATION,
      target: 70,
      weight: 0.1,
      unit: 'score',
      description: 'Innovation and creativity metrics'
    });
    
    // Operational KPIs
    this.kpis.set('operational_efficiency', {
      name: 'Operational Efficiency',
      category: MetricCategory.OPERATIONAL,
      target: 85,
      weight: 0.1,
      unit: 'percentage',
      description: 'Overall operational efficiency'
    });
  }

  /**
   * Record performance metric
   */
  recordMetric(metricName, value, metadata = {}) {
    const timestamp = Date.now();
    
    // Store metric
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    const metricData = {
      value,
      timestamp,
      metadata
    };
    
    this.metrics.get(metricName).push(metricData);
    
    // Clean old metrics
    this.cleanOldMetrics(metricName);
    
    // Check for anomalies
    if (this.config.enableAnomalyDetection) {
      this.detectAnomaly(metricName, value);
    }
    
    // Update current performance
    this.updateCurrentPerformance(metricName, value);
    
    // Check alerts
    this.checkAlerts(metricName, value);
    
    // Emit event
    this.emit('metric:recorded', {
      metric: metricName,
      value,
      timestamp
    });
    
    return metricData;
  }

  /**
   * Track KPI
   */
  trackKPI(kpiId, value) {
    const kpi = this.kpis.get(kpiId);
    if (!kpi) {
      logger.warn(`Unknown KPI: ${kpiId}`);
      return;
    }
    
    // Record the metric
    this.recordMetric(kpiId, value, { kpi: true });
    
    // Calculate achievement
    const achievement = (value / kpi.target) * 100;
    
    // Update KPI status
    kpi.currentValue = value;
    kpi.achievement = achievement;
    kpi.status = this.getPerformanceStatus(achievement);
    kpi.lastUpdated = Date.now();
    
    // Emit KPI update
    this.emit('kpi:updated', {
      kpiId,
      kpi,
      achievement
    });
    
    return {
      kpiId,
      value,
      achievement,
      status: kpi.status
    };
  }

  /**
   * Calculate overall performance
   */
  calculateOverallPerformance() {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [kpiId, kpi] of this.kpis) {
      if (kpi.currentValue !== undefined) {
        const achievement = (kpi.currentValue / kpi.target) * 100;
        weightedSum += achievement * kpi.weight;
        totalWeight += kpi.weight;
      }
    }
    
    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    this.currentPerformance.overall = overall;
    this.currentPerformance.timestamp = Date.now();
    
    // Categorize performance
    for (const category of Object.values(MetricCategory)) {
      this.currentPerformance.categories[category] = this.calculateCategoryPerformance(category);
    }
    
    return overall;
  }

  /**
   * Calculate category performance
   */
  calculateCategoryPerformance(category) {
    const categoryKPIs = Array.from(this.kpis.values())
      .filter(kpi => kpi.category === category);
    
    if (categoryKPIs.length === 0) return 0;
    
    let sum = 0;
    let count = 0;
    
    for (const kpi of categoryKPIs) {
      if (kpi.currentValue !== undefined) {
        sum += (kpi.currentValue / kpi.target) * 100;
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }

  /**
   * Get performance status
   */
  getPerformanceStatus(score) {
    if (score >= PerformanceThreshold.EXCELLENT) return 'excellent';
    if (score >= PerformanceThreshold.GOOD) return 'good';
    if (score >= PerformanceThreshold.ACCEPTABLE) return 'acceptable';
    if (score >= PerformanceThreshold.POOR) return 'poor';
    return 'critical';
  }

  /**
   * Detect anomalies
   */
  detectAnomaly(metricName, value) {
    const history = this.metrics.get(metricName) || [];
    
    if (history.length < 10) return; // Need sufficient history
    
    // Calculate statistics
    const recentValues = history.slice(-20).map(m => m.value);
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length
    );
    
    // Check if value is anomalous (outside 3 standard deviations)
    if (Math.abs(value - mean) > 3 * stdDev) {
      const anomaly = {
        metric: metricName,
        value,
        expectedRange: [mean - 2 * stdDev, mean + 2 * stdDev],
        deviation: Math.abs(value - mean) / stdDev,
        timestamp: Date.now()
      };
      
      this.anomalies.push(anomaly);
      
      // Keep anomaly list manageable
      if (this.anomalies.length > 100) {
        this.anomalies = this.anomalies.slice(-100);
      }
      
      this.emit('anomaly:detected', anomaly);
      
      logger.warn(`Anomaly detected in ${metricName}: ${value} (expected: ${mean.toFixed(2)} ± ${(2 * stdDev).toFixed(2)})`);
    }
  }

  /**
   * Check and trigger alerts
   */
  checkAlerts(metricName, value) {
    const kpi = this.kpis.get(metricName);
    
    if (kpi) {
      const achievement = (value / kpi.target) * 100;
      
      if (achievement < this.config.alertThreshold) {
        const alert = {
          type: 'performance',
          severity: achievement < PerformanceThreshold.CRITICAL ? 'critical' : 
                   achievement < PerformanceThreshold.POOR ? 'high' : 'medium',
          metric: metricName,
          value,
          target: kpi.target,
          achievement,
          message: `${kpi.name} below threshold: ${achievement.toFixed(1)}%`,
          timestamp: Date.now()
        };
        
        this.alerts.push(alert);
        
        // Keep alerts list manageable
        if (this.alerts.length > 100) {
          this.alerts = this.alerts.slice(-100);
        }
        
        this.emit('alert:triggered', alert);
        
        logger.warn(`Performance alert: ${alert.message}`);
      }
    }
  }

  /**
   * Analyze trends
   */
  analyzeTrends(metricName, period = 7 * 24 * 60 * 60 * 1000) {
    const history = this.metrics.get(metricName) || [];
    const cutoff = Date.now() - period;
    const relevantData = history.filter(m => m.timestamp > cutoff);
    
    if (relevantData.length < 2) {
      return { trend: 'insufficient_data' };
    }
    
    // Calculate trend using linear regression
    const n = relevantData.length;
    const sumX = relevantData.reduce((sum, m, i) => sum + i, 0);
    const sumY = relevantData.reduce((sum, m) => sum + m.value, 0);
    const sumXY = relevantData.reduce((sum, m, i) => sum + i * m.value, 0);
    const sumX2 = relevantData.reduce((sum, m, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Determine trend direction
    let trend = 'stable';
    if (slope > 0.1) trend = 'improving';
    else if (slope < -0.1) trend = 'declining';
    
    // Calculate prediction
    const nextValue = slope * n + intercept;
    
    const analysis = {
      trend,
      slope,
      intercept,
      currentValue: relevantData[relevantData.length - 1].value,
      predictedValue: nextValue,
      confidence: this.calculateTrendConfidence(relevantData, slope, intercept),
      dataPoints: relevantData.length
    };
    
    // Store trend
    this.trends.set(metricName, analysis);
    
    return analysis;
  }

  /**
   * Calculate trend confidence
   */
  calculateTrendConfidence(data, slope, intercept) {
    // Calculate R-squared
    const meanY = data.reduce((sum, m) => sum + m.value, 0) / data.length;
    const totalSS = data.reduce((sum, m) => sum + Math.pow(m.value - meanY, 2), 0);
    const residualSS = data.reduce((sum, m, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(m.value - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSS / totalSS);
    return Math.max(0, Math.min(1, rSquared));
  }

  /**
   * Generate performance report
   */
  generateReport(period = 7 * 24 * 60 * 60 * 1000) {
    const report = {
      timestamp: Date.now(),
      period,
      overall: this.calculateOverallPerformance(),
      categories: {},
      kpis: {},
      trends: {},
      anomalies: [],
      alerts: [],
      recommendations: []
    };
    
    // Category performance
    for (const category of Object.values(MetricCategory)) {
      report.categories[category] = {
        score: this.currentPerformance.categories[category],
        status: this.getPerformanceStatus(this.currentPerformance.categories[category])
      };
    }
    
    // KPI details
    for (const [kpiId, kpi] of this.kpis) {
      report.kpis[kpiId] = {
        name: kpi.name,
        value: kpi.currentValue,
        target: kpi.target,
        achievement: kpi.achievement,
        status: kpi.status,
        trend: this.analyzeTrends(kpiId, period)
      };
    }
    
    // Recent anomalies
    const cutoff = Date.now() - period;
    report.anomalies = this.anomalies.filter(a => a.timestamp > cutoff);
    
    // Recent alerts
    report.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);
    
    return report;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(report) {
    const recommendations = [];
    
    // Check overall performance
    if (report.overall < PerformanceThreshold.ACCEPTABLE) {
      recommendations.push({
        priority: 'high',
        category: 'overall',
        action: 'Urgent attention required - overall performance below acceptable threshold',
        impact: 'critical'
      });
    }
    
    // Check KPIs
    for (const [kpiId, kpiData] of Object.entries(report.kpis)) {
      if (kpiData.status === 'poor' || kpiData.status === 'critical') {
        recommendations.push({
          priority: 'high',
          category: kpiId,
          action: `Improve ${kpiData.name} - currently at ${kpiData.achievement?.toFixed(1)}% of target`,
          impact: 'high'
        });
      }
      
      if (kpiData.trend?.trend === 'declining') {
        recommendations.push({
          priority: 'medium',
          category: kpiId,
          action: `Address declining trend in ${kpiData.name}`,
          impact: 'medium'
        });
      }
    }
    
    // Check anomalies
    if (report.anomalies.length > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'anomalies',
        action: 'Investigate frequent anomalies in performance metrics',
        impact: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      // Simulate metric collection (in production, would gather real metrics)
      this.collectMetrics();
      
      // Calculate performance
      this.calculateOverallPerformance();
      
      // Analyze trends
      for (const kpiId of this.kpis.keys()) {
        this.analyzeTrends(kpiId);
      }
      
      // Emit performance update
      this.emit('performance:updated', this.currentPerformance);
      
    }, this.config.samplingInterval);
  }

  /**
   * Collect metrics (simulation)
   */
  collectMetrics() {
    // Simulate collecting metrics
    for (const [kpiId, kpi] of this.kpis) {
      const variation = (Math.random() - 0.5) * 20;
      const value = Math.max(0, Math.min(100, kpi.target + variation));
      this.trackKPI(kpiId, value);
    }
  }

  /**
   * Update current performance
   */
  updateCurrentPerformance(metricName, value) {
    const kpi = this.kpis.get(metricName);
    if (kpi) {
      // Update category performance will be recalculated
      this.calculateOverallPerformance();
    }
  }

  /**
   * Clean old metrics
   */
  cleanOldMetrics(metricName) {
    const metrics = this.metrics.get(metricName);
    if (!metrics) return;
    
    const cutoff = Date.now() - this.config.metricsRetentionPeriod;
    const filtered = metrics.filter(m => m.timestamp > cutoff);
    
    this.metrics.set(metricName, filtered);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      overall: this.currentPerformance.overall,
      categories: this.currentPerformance.categories,
      kpis: this.kpis.size,
      metrics: this.metrics.size,
      anomalies: this.anomalies.length,
      alerts: this.alerts.length,
      trends: this.trends.size
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

module.exports = {
  ExecutivePerformanceMonitor,
  MetricCategory,
  PerformanceThreshold
};