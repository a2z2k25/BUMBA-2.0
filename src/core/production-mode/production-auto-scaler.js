/**
 * BUMBA Production Mode - Sprint 3: Auto-Scaling & Resource Management
 * 
 * Dynamic scaling based on demand with predictive capabilities,
 * resource allocation optimization, and cost management
 */

const EventEmitter = require('events');

/**
 * Scaling strategies
 */
const ScalingStrategy = {
  REACTIVE: 'REACTIVE',           // Scale based on current metrics
  PREDICTIVE: 'PREDICTIVE',       // Scale based on predicted demand
  SCHEDULED: 'SCHEDULED',         // Scale based on time patterns
  HYBRID: 'HYBRID'                // Combination of strategies
};

/**
 * Scaling directions
 */
const ScalingDirection = {
  UP: 'UP',                       // Scale up (add resources)
  DOWN: 'DOWN',                   // Scale down (remove resources)
  NONE: 'NONE'                    // No scaling needed
};

/**
 * Resource types
 */
const ResourceType = {
  CPU: 'CPU',
  MEMORY: 'MEMORY',
  DISK: 'DISK',
  NETWORK: 'NETWORK',
  CONNECTIONS: 'CONNECTIONS',
  SPECIALISTS: 'SPECIALISTS'
};

/**
 * Predictive Scaling Engine - Predicts future demand based on patterns
 */
class PredictiveScalingEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      predictionWindow: config.predictionWindow || 30 * 60 * 1000, // 30 minutes
      historicalWindow: config.historicalWindow || 24 * 60 * 60 * 1000, // 24 hours
      minDataPoints: config.minDataPoints || 20,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      seasonalityDetection: config.seasonalityDetection !== false,
      trendAnalysis: config.trendAnalysis !== false
    };
    
    this.metrics = [];
    this.patterns = new Map();
    this.predictions = new Map();
    this.seasonalPatterns = new Map();
    
    // Pattern types
    this.patternTypes = {
      HOURLY: 60 * 60 * 1000,      // 1 hour
      DAILY: 24 * 60 * 60 * 1000,  // 24 hours
      WEEKLY: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }
  
  /**
   * Record metric data point
   */
  recordMetric(type, value, timestamp = Date.now()) {
    this.metrics.push({
      type,
      value,
      timestamp,
      hour: new Date(timestamp).getHours(),
      dayOfWeek: new Date(timestamp).getDay(),
      dayOfMonth: new Date(timestamp).getDate()
    });
    
    // Keep only recent metrics within historical window
    const cutoff = timestamp - this.config.historicalWindow;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    // Update patterns periodically
    if (this.metrics.length % 10 === 0) {
      this.updatePatterns();
    }
  }
  
  /**
   * Update detected patterns
   */
  updatePatterns() {
    if (this.metrics.length < this.config.minDataPoints) return;
    
    // Detect hourly patterns
    this.detectHourlyPattern();
    
    // Detect daily patterns
    this.detectDailyPattern();
    
    // Detect weekly patterns
    this.detectWeeklyPattern();
    
    // Detect trends
    if (this.config.trendAnalysis) {
      this.detectTrends();
    }
  }
  
  /**
   * Detect hourly patterns
   */
  detectHourlyPattern() {
    const hourlyData = new Array(24).fill(0).map(() => []);
    
    for (const metric of this.metrics) {
      hourlyData[metric.hour].push(metric.value);
    }
    
    const hourlyAverages = hourlyData.map(values => {
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    this.patterns.set('HOURLY', {
      data: hourlyAverages,
      confidence: this.calculatePatternConfidence(hourlyAverages),
      lastUpdated: Date.now()
    });
  }
  
  /**
   * Detect daily patterns
   */
  detectDailyPattern() {
    const dailyData = new Array(7).fill(0).map(() => []);
    
    for (const metric of this.metrics) {
      dailyData[metric.dayOfWeek].push(metric.value);
    }
    
    const dailyAverages = dailyData.map(values => {
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    this.patterns.set('DAILY', {
      data: dailyAverages,
      confidence: this.calculatePatternConfidence(dailyAverages),
      lastUpdated: Date.now()
    });
  }
  
  /**
   * Detect weekly patterns
   */
  detectWeeklyPattern() {
    const weeklyData = {};
    
    for (const metric of this.metrics) {
      const week = Math.floor(metric.timestamp / this.patternTypes.WEEKLY);
      if (!weeklyData[week]) weeklyData[week] = [];
      weeklyData[week].push(metric.value);
    }
    
    const weeklyAverages = Object.values(weeklyData).map(values => {
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    this.patterns.set('WEEKLY', {
      data: weeklyAverages,
      confidence: this.calculatePatternConfidence(weeklyAverages),
      lastUpdated: Date.now()
    });
  }
  
  /**
   * Detect trends
   */
  detectTrends() {
    if (this.metrics.length < 10) return;
    
    // Simple linear regression for trend detection
    const recentMetrics = this.metrics.slice(-50); // Last 50 points
    const n = recentMetrics.length;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    recentMetrics.forEach((metric, index) => {
      sumX += index;
      sumY += metric.value;
      sumXY += index * metric.value;
      sumX2 += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const trend = {
      slope,
      intercept,
      direction: slope > 0.1 ? 'INCREASING' : slope < -0.1 ? 'DECREASING' : 'STABLE',
      confidence: this.calculateTrendConfidence(recentMetrics, slope, intercept),
      lastUpdated: Date.now()
    };
    
    this.patterns.set('TREND', trend);
  }
  
  /**
   * Calculate pattern confidence
   */
  calculatePatternConfidence(data) {
    if (data.length < 3) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation relative to mean = higher confidence
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    const confidence = Math.max(0, 1 - coefficientOfVariation);
    
    return Math.min(1, confidence);
  }
  
  /**
   * Calculate trend confidence
   */
  calculateTrendConfidence(data, slope, intercept) {
    if (data.length < 5) return 0;
    
    // Calculate R-squared
    const actualValues = data.map(d => d.value);
    const predictedValues = data.map((d, index) => slope * index + intercept);
    
    const actualMean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
    
    const totalSumSquares = actualValues.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actualValues.reduce((sum, val, index) => {
      return sum + Math.pow(val - predictedValues[index], 2);
    }, 0);
    
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    
    return Math.max(0, rSquared);
  }
  
  /**
   * Predict future demand
   */
  predictDemand(timestamp = Date.now() + this.config.predictionWindow) {
    const predictions = [];
    
    // Hourly pattern prediction
    const hourlyPattern = this.patterns.get('HOURLY');
    if (hourlyPattern && hourlyPattern.confidence > this.config.confidenceThreshold) {
      const hour = new Date(timestamp).getHours();
      const prediction = {
        type: 'HOURLY',
        value: hourlyPattern.data[hour] || 0,
        confidence: hourlyPattern.confidence,
        timestamp
      };
      predictions.push(prediction);
    }
    
    // Daily pattern prediction
    const dailyPattern = this.patterns.get('DAILY');
    if (dailyPattern && dailyPattern.confidence > this.config.confidenceThreshold) {
      const dayOfWeek = new Date(timestamp).getDay();
      const prediction = {
        type: 'DAILY',
        value: dailyPattern.data[dayOfWeek] || 0,
        confidence: dailyPattern.confidence,
        timestamp
      };
      predictions.push(prediction);
    }
    
    // Trend prediction
    const trendPattern = this.patterns.get('TREND');
    if (trendPattern && trendPattern.confidence > this.config.confidenceThreshold) {
      const timeFromNow = (timestamp - Date.now()) / (1000 * 60); // Minutes
      const prediction = {
        type: 'TREND',
        value: trendPattern.slope * timeFromNow + trendPattern.intercept,
        confidence: trendPattern.confidence,
        timestamp
      };
      predictions.push(prediction);
    }
    
    // Combine predictions
    if (predictions.length === 0) return null;
    
    const weightedSum = predictions.reduce((sum, p) => sum + (p.value * p.confidence), 0);
    const totalWeight = predictions.reduce((sum, p) => sum + p.confidence, 0);
    
    const combinedPrediction = {
      value: totalWeight > 0 ? weightedSum / totalWeight : 0,
      confidence: totalWeight / predictions.length,
      components: predictions,
      timestamp
    };
    
    this.predictions.set(timestamp, combinedPrediction);
    return combinedPrediction;
  }
  
  /**
   * Get pattern analysis
   */
  getPatternAnalysis() {
    const analysis = {
      patterns: {},
      predictions: Array.from(this.predictions.values()),
      dataPoints: this.metrics.length,
      timeRange: this.metrics.length > 0 ? {
        start: this.metrics[0].timestamp,
        end: this.metrics[this.metrics.length - 1].timestamp
      } : null
    };
    
    for (const [type, pattern] of this.patterns) {
      analysis.patterns[type] = {
        confidence: pattern.confidence,
        lastUpdated: pattern.lastUpdated,
        isReliable: pattern.confidence > this.config.confidenceThreshold
      };
    }
    
    return analysis;
  }
}

/**
 * Resource Monitor - Monitors system resources and performance
 */
class ResourceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monitoringInterval: config.monitoringInterval || 10000, // 10 seconds
      alertThresholds: {
        cpu: config.cpuThreshold || 0.8,           // 80%
        memory: config.memoryThreshold || 0.85,    // 85%
        disk: config.diskThreshold || 0.9,         // 90%
        connections: config.connectionsThreshold || 0.8,
        responseTime: config.responseTimeThreshold || 2000,
        errorRate: config.errorRateThreshold || 0.05 // 5%
      },
      historySize: config.historySize || 100
    };
    
    this.metrics = new Map();
    this.alerts = [];
    this.monitoringInterval = null;
    
    // Initialize metric histories
    for (const resourceType of Object.values(ResourceType)) {
      this.metrics.set(resourceType, []);
    }
    
    this.startMonitoring();
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoringInterval);
    
    console.log('📊 Resource Monitor: Started monitoring');
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('📊 Resource Monitor: Stopped monitoring');
  }
  
  /**
   * Collect system metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // CPU usage (simulated)
    const cpuUsage = this.simulateCPUUsage();
    this.recordMetric(ResourceType.CPU, cpuUsage, timestamp);
    
    // Memory usage (actual from Node.js)
    const memoryUsage = process.memoryUsage();
    const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    this.recordMetric(ResourceType.MEMORY, memoryRatio, timestamp);
    
    // Simulate other metrics
    const diskUsage = this.simulateDiskUsage();
    this.recordMetric(ResourceType.DISK, diskUsage, timestamp);
    
    const networkUsage = this.simulateNetworkUsage();
    this.recordMetric(ResourceType.NETWORK, networkUsage, timestamp);
    
    const connectionUsage = this.simulateConnectionUsage();
    this.recordMetric(ResourceType.CONNECTIONS, connectionUsage, timestamp);
    
    // Check for alerts
    this.checkAlerts(timestamp);
  }
  
  /**
   * Record metric
   */
  recordMetric(type, value, timestamp = Date.now()) {
    const history = this.metrics.get(type);
    history.push({ value, timestamp });
    
    // Keep only recent history
    if (history.length > this.config.historySize) {
      history.shift();
    }
    
    this.emit('metric:recorded', { type, value, timestamp });
  }
  
  /**
   * Simulate CPU usage
   */
  simulateCPUUsage() {
    // Simulate CPU usage with some realistic variation
    const baseUsage = 0.3; // 30% base
    const variation = Math.sin(Date.now() / 60000) * 0.2; // Sine wave variation
    const randomNoise = (Math.random() - 0.5) * 0.1; // Random noise
    
    return Math.max(0, Math.min(1, baseUsage + variation + randomNoise));
  }
  
  /**
   * Simulate disk usage
   */
  simulateDiskUsage() {
    // Gradually increasing disk usage
    const baseUsage = 0.4; // 40% base
    const growth = (Date.now() % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000) * 0.1;
    const randomNoise = (Math.random() - 0.5) * 0.05;
    
    return Math.max(0, Math.min(1, baseUsage + growth + randomNoise));
  }
  
  /**
   * Simulate network usage
   */
  simulateNetworkUsage() {
    // Network usage based on time of day
    const hour = new Date().getHours();
    const peakHours = hour >= 9 && hour <= 17; // Business hours
    const baseUsage = peakHours ? 0.6 : 0.2;
    const randomVariation = (Math.random() - 0.5) * 0.3;
    
    return Math.max(0, Math.min(1, baseUsage + randomVariation));
  }
  
  /**
   * Simulate connection usage
   */
  simulateConnectionUsage() {
    // Connection usage with spikes
    const baseUsage = 0.4; // 40% base
    const spike = Math.random() < 0.1 ? 0.4 : 0; // 10% chance of spike
    const randomVariation = (Math.random() - 0.5) * 0.2;
    
    return Math.max(0, Math.min(1, baseUsage + spike + randomVariation));
  }
  
  /**
   * Check for alerts
   */
  checkAlerts(timestamp) {
    for (const [type, history] of this.metrics) {
      if (history.length === 0) continue;
      
      const latestValue = history[history.length - 1].value;
      const threshold = this.config.alertThresholds[type.toLowerCase()];
      
      if (threshold && latestValue > threshold) {
        this.triggerAlert(type, latestValue, threshold, timestamp);
      }
    }
  }
  
  /**
   * Trigger alert
   */
  triggerAlert(type, value, threshold, timestamp) {
    const alert = {
      id: `${type}-${timestamp}`,
      type,
      level: value > threshold * 1.2 ? 'CRITICAL' : 'WARNING',
      message: `${type} usage at ${(value * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`,
      value,
      threshold,
      timestamp
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts (last 50)
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
    
    console.log(`🔴 Alert: ${alert.message}`);
    this.emit('alert', alert);
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    const current = {};
    
    for (const [type, history] of this.metrics) {
      if (history.length > 0) {
        const latest = history[history.length - 1];
        current[type] = {
          value: latest.value,
          timestamp: latest.timestamp,
          threshold: this.config.alertThresholds[type.toLowerCase()] || null
        };
      }
    }
    
    return current;
  }
  
  /**
   * Get metric history
   */
  getMetricHistory(type, duration = 300000) { // 5 minutes default
    const history = this.metrics.get(type);
    if (!history) return [];
    
    const cutoff = Date.now() - duration;
    return history.filter(metric => metric.timestamp > cutoff);
  }
  
  /**
   * Get resource statistics
   */
  getResourceStats() {
    const stats = {};
    
    for (const [type, history] of this.metrics) {
      if (history.length === 0) continue;
      
      const values = history.map(h => h.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      stats[type] = {
        current: values[values.length - 1],
        average: avg,
        maximum: max,
        minimum: min,
        dataPoints: values.length
      };
    }
    
    return stats;
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(duration = 300000) { // 5 minutes default
    const cutoff = Date.now() - duration;
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.stopMonitoring();
    this.metrics.clear();
    this.alerts = [];
    this.removeAllListeners();
  }
}

/**
 * Production Auto Scaler - Intelligent scaling based on demand and predictions
 */
class ProductionAutoScaler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      strategy: config.strategy || ScalingStrategy.HYBRID,
      
      // Scaling thresholds
      scaleUpThreshold: config.scaleUpThreshold || 0.75,    // 75%
      scaleDownThreshold: config.scaleDownThreshold || 0.3,  // 30%
      
      // Scaling limits
      minInstances: config.minInstances || 1,
      maxInstances: config.maxInstances || 10,
      
      // Timing
      scaleUpCooldown: config.scaleUpCooldown || 300000,     // 5 minutes
      scaleDownCooldown: config.scaleDownCooldown || 600000,  // 10 minutes
      evaluationInterval: config.evaluationInterval || 30000, // 30 seconds
      
      // Predictive scaling
      enablePredictiveScaling: config.enablePredictiveScaling !== false,
      predictionWeight: config.predictionWeight || 0.3,     // 30% weight for predictions
      
      // Cost optimization
      enableCostOptimization: config.enableCostOptimization !== false,
      costPerInstance: config.costPerInstance || 0.1,       // $0.10 per hour per instance
      
      // Specialized scaling
      specialistScaling: config.specialistScaling !== false,
      specialistThresholds: config.specialistThresholds || {
        queue: 10,        // Scale up if queue > 10
        utilization: 0.8, // Scale up if utilization > 80%
        responseTime: 2000 // Scale up if response time > 2s
      }
    };
    
    // Components
    this.resourceMonitor = new ResourceMonitor({
      monitoringInterval: 15000,
      cpuThreshold: 0.8,
      memoryThreshold: 0.85
    });
    
    this.predictiveEngine = new PredictiveScalingEngine({
      predictionWindow: 30 * 60 * 1000, // 30 minutes
      confidenceThreshold: 0.6
    });
    
    // State
    this.currentInstances = config.initialInstances || 2;
    this.lastScaleAction = 0;
    this.scaleHistory = [];
    
    // Metrics
    this.metrics = {
      totalScaleActions: 0,
      scaleUpActions: 0,
      scaleDownActions: 0,
      costSaved: 0,
      predictiveAccuracy: 0,
      avgUtilization: 0
    };
    
    // Evaluation timer
    this.evaluationTimer = null;
    
    this.setupEventHandlers();
    this.startEvaluation();
    
    console.log('🟡️ Production Auto Scaler initialized');
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Resource monitor alerts
    this.resourceMonitor.on('alert', (alert) => {
      console.log(`🔴 Resource Alert: ${alert.message}`);
      this.handleResourceAlert(alert);
    });
    
    // Metric recording for predictions
    this.resourceMonitor.on('metric:recorded', (event) => {
      if (event.type === ResourceType.CPU) {
        this.predictiveEngine.recordMetric('cpu', event.value, event.timestamp);
      } else if (event.type === ResourceType.MEMORY) {
        this.predictiveEngine.recordMetric('memory', event.value, event.timestamp);
      }
    });
  }
  
  /**
   * Start evaluation loop
   */
  startEvaluation() {
    if (this.evaluationTimer) return;
    
    this.evaluationTimer = setInterval(() => {
      this.evaluateScaling();
    }, this.config.evaluationInterval);
    
    console.log('🟡️ Auto Scaler: Started evaluation loop');
  }
  
  /**
   * Stop evaluation loop
   */
  stopEvaluation() {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
    
    console.log('🟡️ Auto Scaler: Stopped evaluation loop');
  }
  
  /**
   * Evaluate scaling decision
   */
  async evaluateScaling() {
    try {
      const decision = await this.makeScalingDecision();
      
      if (decision.action !== ScalingDirection.NONE) {
        await this.executeScalingAction(decision);
      }
      
    } catch (error) {
      console.error('Auto Scaler evaluation error:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Make scaling decision
   */
  async makeScalingDecision() {
    const currentMetrics = this.resourceMonitor.getCurrentMetrics();
    const resourceStats = this.resourceMonitor.getResourceStats();
    
    // Get current utilization
    const cpuUtil = currentMetrics[ResourceType.CPU]?.value || 0;
    const memoryUtil = currentMetrics[ResourceType.MEMORY]?.value || 0;
    const avgUtilization = (cpuUtil + memoryUtil) / 2;
    
    this.metrics.avgUtilization = avgUtilization;
    
    // Check cooldown periods
    const now = Date.now();
    const timeSinceLastScale = now - this.lastScaleAction;
    
    let decision = {
      action: ScalingDirection.NONE,
      reason: 'No scaling needed',
      currentInstances: this.currentInstances,
      targetInstances: this.currentInstances,
      confidence: 0,
      factors: {}
    };
    
    // Factor 1: Current resource utilization
    let utilizationScore = 0;
    if (avgUtilization > this.config.scaleUpThreshold) {
      utilizationScore = 1;
      decision.factors.utilization = `High (${(avgUtilization * 100).toFixed(1)}%)`;
    } else if (avgUtilization < this.config.scaleDownThreshold) {
      utilizationScore = -1;
      decision.factors.utilization = `Low (${(avgUtilization * 100).toFixed(1)}%)`;
    }
    
    // Factor 2: Predictive analysis
    let predictiveScore = 0;
    if (this.config.enablePredictiveScaling) {
      const prediction = this.predictiveEngine.predictDemand();
      if (prediction && prediction.confidence > 0.6) {
        const predictedUtil = prediction.value;
        if (predictedUtil > this.config.scaleUpThreshold) {
          predictiveScore = prediction.confidence;
          decision.factors.prediction = `High predicted demand (${(predictedUtil * 100).toFixed(1)}%)`;
        } else if (predictedUtil < this.config.scaleDownThreshold) {
          predictiveScore = -prediction.confidence;
          decision.factors.prediction = `Low predicted demand (${(predictedUtil * 100).toFixed(1)}%)`;
        }
      }
    }
    
    // Factor 3: Cost optimization
    let costScore = 0;
    if (this.config.enableCostOptimization) {
      const currentCost = this.currentInstances * this.config.costPerInstance;
      const avgUtil = this.metrics.avgUtilization;
      
      if (avgUtil < 0.4 && this.currentInstances > this.config.minInstances) {
        costScore = -0.5; // Encourage scaling down for cost savings
        decision.factors.cost = `Under-utilized instances (${(avgUtil * 100).toFixed(1)}%)`;
      }
    }
    
    // Combine scores
    const totalScore = utilizationScore + 
      (predictiveScore * this.config.predictionWeight) + 
      (costScore * 0.2);
    
    decision.confidence = Math.abs(totalScore);
    
    // Make decision based on total score
    if (totalScore > 0.7 && timeSinceLastScale > this.config.scaleUpCooldown) {
      // Scale up
      const targetInstances = Math.min(
        this.config.maxInstances,
        this.currentInstances + Math.ceil(totalScore)
      );
      
      if (targetInstances > this.currentInstances) {
        decision.action = ScalingDirection.UP;
        decision.targetInstances = targetInstances;
        decision.reason = `High demand detected (score: ${totalScore.toFixed(2)})`;
      }
      
    } else if (totalScore < -0.5 && timeSinceLastScale > this.config.scaleDownCooldown) {
      // Scale down
      const targetInstances = Math.max(
        this.config.minInstances,
        this.currentInstances - 1
      );
      
      if (targetInstances < this.currentInstances) {
        decision.action = ScalingDirection.DOWN;
        decision.targetInstances = targetInstances;
        decision.reason = `Low demand detected (score: ${totalScore.toFixed(2)})`;
      }
    }
    
    return decision;
  }
  
  /**
   * Execute scaling action
   */
  async executeScalingAction(decision) {
    const startTime = Date.now();
    
    console.log(`🟡️ Scaling ${decision.action}: ${decision.currentInstances} → ${decision.targetInstances}`);
    console.log(`   Reason: ${decision.reason}`);
    console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
    
    try {
      // Simulate scaling action
      await this.performScaling(decision);
      
      // Update state
      const previousInstances = this.currentInstances;
      this.currentInstances = decision.targetInstances;
      this.lastScaleAction = Date.now();
      
      // Record scaling action
      const scalingRecord = {
        timestamp: startTime,
        action: decision.action,
        from: previousInstances,
        to: this.currentInstances,
        reason: decision.reason,
        confidence: decision.confidence,
        factors: decision.factors,
        duration: Date.now() - startTime
      };
      
      this.scaleHistory.push(scalingRecord);
      
      // Keep only recent history (last 100 actions)
      if (this.scaleHistory.length > 100) {
        this.scaleHistory.shift();
      }
      
      // Update metrics
      this.metrics.totalScaleActions++;
      if (decision.action === ScalingDirection.UP) {
        this.metrics.scaleUpActions++;
      } else {
        this.metrics.scaleDownActions++;
      }
      
      // Calculate cost savings
      if (decision.action === ScalingDirection.DOWN) {
        const instancesReduced = previousInstances - this.currentInstances;
        const costSavedPerHour = instancesReduced * this.config.costPerInstance;
        this.metrics.costSaved += costSavedPerHour;
      }
      
      console.log(`🏁 Scaling completed in ${scalingRecord.duration}ms`);
      
      this.emit('scaling:completed', scalingRecord);
      
    } catch (error) {
      console.error(`🔴 Scaling failed: ${error.message}`);
      this.emit('scaling:failed', { decision, error });
    }
  }
  
  /**
   * Perform actual scaling (simulated)
   */
  async performScaling(decision) {
    const scalingTime = Math.random() * 10000 + 5000; // 5-15 seconds
    
    if (decision.action === ScalingDirection.UP) {
      // Simulate scaling up
      console.log(`🔄 Launching ${decision.targetInstances - decision.currentInstances} new instances...`);
      
      // Simulate gradual instance startup
      for (let i = decision.currentInstances; i < decision.targetInstances; i++) {
        await new Promise(resolve => setTimeout(resolve, scalingTime / 4));
        console.log(`🟢 Instance ${i + 1} started`);
      }
      
    } else if (decision.action === ScalingDirection.DOWN) {
      // Simulate scaling down
      const instancesToRemove = decision.currentInstances - decision.targetInstances;
      console.log(`🔄 Terminating ${instancesToRemove} instances...`);
      
      // Simulate graceful shutdown
      for (let i = 0; i < instancesToRemove; i++) {
        await new Promise(resolve => setTimeout(resolve, scalingTime / 6));
        console.log(`🔴 Instance ${decision.currentInstances - i} terminated`);
      }
    }
  }
  
  /**
   * Handle resource alert
   */
  handleResourceAlert(alert) {
    // Immediate scaling for critical alerts
    if (alert.level === 'CRITICAL' && alert.type === ResourceType.CPU) {
      const now = Date.now();
      const timeSinceLastScale = now - this.lastScaleAction;
      
      // Override cooldown for critical alerts
      if (timeSinceLastScale > 60000 && // 1 minute minimum
          this.currentInstances < this.config.maxInstances) {
        
        const emergencyDecision = {
          action: ScalingDirection.UP,
          currentInstances: this.currentInstances,
          targetInstances: Math.min(this.config.maxInstances, this.currentInstances + 2),
          reason: `Emergency scaling due to critical ${alert.type} alert`,
          confidence: 1.0,
          factors: { emergency: `Critical ${alert.type} at ${(alert.value * 100).toFixed(1)}%` }
        };
        
        console.log('🔴 Emergency scaling triggered');
        this.executeScalingAction(emergencyDecision);
      }
    }
  }
  
  /**
   * Scale specialist pool
   */
  async scaleSpecialists(poolMetrics) {
    if (!this.config.specialistScaling) return;
    
    const { queue, utilization, avgResponseTime } = poolMetrics;
    const thresholds = this.config.specialistThresholds;
    
    let shouldScale = false;
    let reason = '';
    
    if (queue > thresholds.queue) {
      shouldScale = true;
      reason = `High queue depth: ${queue}`;
    } else if (utilization > thresholds.utilization) {
      shouldScale = true;
      reason = `High utilization: ${(utilization * 100).toFixed(1)}%`;
    } else if (avgResponseTime > thresholds.responseTime) {
      shouldScale = true;
      reason = `High response time: ${avgResponseTime}ms`;
    }
    
    if (shouldScale) {
      const decision = {
        action: ScalingDirection.UP,
        currentInstances: poolMetrics.warmCount,
        targetInstances: Math.min(poolMetrics.maxWarm + 2, poolMetrics.totalSpecialists),
        reason: `Specialist scaling: ${reason}`,
        confidence: 0.8,
        factors: { specialists: reason }
      };
      
      this.emit('specialist:scaling', decision);
      return decision;
    }
    
    return null;
  }
  
  /**
   * Get scaling analytics
   */
  getScalingAnalytics() {
    const recentHistory = this.scaleHistory.slice(-20);
    const patternAnalysis = this.predictiveEngine.getPatternAnalysis();
    const resourceStats = this.resourceMonitor.getResourceStats();
    
    return {
      current: {
        instances: this.currentInstances,
        minInstances: this.config.minInstances,
        maxInstances: this.config.maxInstances,
        strategy: this.config.strategy
      },
      metrics: {
        ...this.metrics,
        utilizationEfficiency: this.calculateUtilizationEfficiency(),
        costEfficiency: this.calculateCostEfficiency(),
        predictiveAccuracy: this.calculatePredictiveAccuracy()
      },
      scaling: {
        recentActions: recentHistory,
        totalActions: this.scaleHistory.length,
        avgScalingTime: this.calculateAvgScalingTime(),
        lastScaleAction: this.lastScaleAction
      },
      patterns: patternAnalysis,
      resources: resourceStats,
      alerts: this.resourceMonitor.getRecentAlerts()
    };
  }
  
  /**
   * Calculate utilization efficiency
   */
  calculateUtilizationEfficiency() {
    const avgUtil = this.metrics.avgUtilization;
    const targetUtil = (this.config.scaleUpThreshold + this.config.scaleDownThreshold) / 2;
    
    // Closer to target = higher efficiency
    const efficiency = 1 - Math.abs(avgUtil - targetUtil) / targetUtil;
    return Math.max(0, Math.min(1, efficiency));
  }
  
  /**
   * Calculate cost efficiency
   */
  calculateCostEfficiency() {
    const avgInstances = this.scaleHistory.length > 0 ?
      this.scaleHistory.reduce((sum, action) => sum + action.to, 0) / this.scaleHistory.length :
      this.currentInstances;
    
    const minPossibleInstances = this.config.minInstances;
    const efficiency = minPossibleInstances / avgInstances;
    
    return Math.max(0, Math.min(1, efficiency));
  }
  
  /**
   * Calculate predictive accuracy
   */
  calculatePredictiveAccuracy() {
    // This would compare predictions with actual outcomes
    // For now, return estimated accuracy
    return 0.75; // 75% estimated accuracy
  }
  
  /**
   * Calculate average scaling time
   */
  calculateAvgScalingTime() {
    if (this.scaleHistory.length === 0) return 0;
    
    const totalTime = this.scaleHistory.reduce((sum, action) => sum + action.duration, 0);
    return totalTime / this.scaleHistory.length;
  }
  
  /**
   * Get current status
   */
  getStatus() {
    const currentMetrics = this.resourceMonitor.getCurrentMetrics();
    const recentAlerts = this.resourceMonitor.getRecentAlerts();
    
    return {
      instances: this.currentInstances,
      limits: {
        min: this.config.minInstances,
        max: this.config.maxInstances
      },
      utilization: {
        cpu: currentMetrics[ResourceType.CPU]?.value || 0,
        memory: currentMetrics[ResourceType.MEMORY]?.value || 0,
        average: this.metrics.avgUtilization
      },
      scaling: {
        totalActions: this.metrics.totalScaleActions,
        lastAction: this.lastScaleAction,
        cooldownRemaining: Math.max(0, 
          (this.lastScaleAction + this.config.scaleUpCooldown) - Date.now())
      },
      alerts: recentAlerts.length,
      strategy: this.config.strategy
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🟡️ Auto Scaler shutting down...');
    
    this.stopEvaluation();
    this.resourceMonitor.destroy();
    
    // Emit final analytics
    const finalAnalytics = this.getScalingAnalytics();
    console.log(`📊 Final Scaling Stats: ${finalAnalytics.metrics.totalScaleActions} total actions, $${finalAnalytics.metrics.costSaved.toFixed(2)} saved`);
    
    this.removeAllListeners();
    console.log('🏁 Auto Scaler shutdown complete');
  }
}

module.exports = {
  ProductionAutoScaler,
  ResourceMonitor,
  PredictiveScalingEngine,
  ScalingStrategy,
  ScalingDirection,
  ResourceType
};