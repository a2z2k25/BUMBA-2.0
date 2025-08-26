/**
 * BUMBA Predictive Performance Monitor
 * Uses ML-inspired techniques to predict future performance issues
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class PredictivePerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enabled: options.enabled !== false,
      predictionWindow: options.predictionWindow || 300000, // 5 minutes ahead
      updateInterval: options.updateInterval || 10000, // Update every 10 seconds
      minDataPoints: options.minDataPoints || 30,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      ...options
    };
    
    // Historical data storage
    this.historicalData = {
      cpu: [],
      memory: [],
      responseTime: [],
      throughput: [],
      errorRate: [],
      eventLoopLag: []
    };
    
    // Prediction models (simplified ML models)
    this.models = {
      timeSeries: new TimeSeriesModel(),
      pattern: new PatternRecognitionModel(),
      anomaly: new AnomalyDetectionModel(),
      correlation: new CorrelationModel()
    };
    
    // Predictions
    this.predictions = new Map();
    this.alerts = new Map();
    this.patterns = new Map();
    
    // Model performance tracking
    this.modelPerformance = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      predictions: 0,
      correct: 0,
      falsePositives: 0,
      falseNegatives: 0
    };
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize predictive monitor
   */
  initialize() {
    // Start data collection
    this.startDataCollection();
    
    // Start prediction cycle
    this.startPredictionCycle();
    
    // Train initial models
    this.trainModels();
    
    logger.info('Predictive performance monitor initialized');
  }

  /**
   * Start data collection
   */
  startDataCollection() {
    this.collectionInterval = setInterval(() => {
      this.collectData();
    }, 5000); // Collect every 5 seconds
  }

  /**
   * Collect performance data
   */
  async collectData() {
    const timestamp = Date.now();
    
    // Collect system metrics
    const metrics = await this.collectMetrics();
    
    // Store in historical data
    for (const [key, value] of Object.entries(metrics)) {
      if (this.historicalData[key]) {
        this.historicalData[key].push({
          timestamp,
          value
        });
        
        // Maintain window size
        const cutoff = timestamp - 3600000; // Keep 1 hour of data
        this.historicalData[key] = this.historicalData[key].filter(
          d => d.timestamp > cutoff
        );
      }
    }
    
    // Update models with new data
    this.updateModels(metrics);
  }

  /**
   * Collect current metrics
   */
  async collectMetrics() {
    const os = require('os');
    const framework = global.bumbaFramework;
    
    // CPU usage
    const cpus = os.cpus();
    const cpuUsage = this.calculateCPUUsage(cpus);
    
    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    // Process metrics
    const processMetrics = process.memoryUsage();
    const heapUsage = (processMetrics.heapUsed / processMetrics.heapTotal) * 100;
    
    // Application metrics
    const responseTime = framework?.metrics?.avgResponseTime || 0;
    const throughput = framework?.metrics?.requestsPerSecond || 0;
    const errorRate = framework?.metrics?.errorRate || 0;
    
    // Event loop lag
    const eventLoopLag = await this.measureEventLoopLag();
    
    return {
      cpu: cpuUsage,
      memory: memUsage,
      heap: heapUsage,
      responseTime,
      throughput,
      errorRate,
      eventLoopLag
    };
  }

  /**
   * Start prediction cycle
   */
  startPredictionCycle() {
    this.predictionInterval = setInterval(() => {
      this.makePredictions();
    }, this.config.updateInterval);
  }

  /**
   * Make predictions
   */
  async makePredictions() {
    // Check if we have enough data
    const hasEnoughData = Object.values(this.historicalData).every(
      data => data.length >= this.config.minDataPoints
    );
    
    if (!hasEnoughData) {
      return;
    }
    
    // Make predictions for each metric
    const predictions = {};
    
    for (const [metric, data] of Object.entries(this.historicalData)) {
      if (data.length >= this.config.minDataPoints) {
        predictions[metric] = await this.predictMetric(metric, data);
      }
    }
    
    // Store predictions
    const timestamp = Date.now();
    this.predictions.set(timestamp, predictions);
    
    // Analyze predictions for issues
    this.analyzePredictions(predictions);
    
    // Emit predictions
    this.emit('predictions:made', predictions);
    
    // Cleanup old predictions
    const cutoff = timestamp - 3600000; // Keep 1 hour
    for (const [ts] of this.predictions) {
      if (ts < cutoff) {
        this.predictions.delete(ts);
      }
    }
  }

  /**
   * Predict metric value
   */
  async predictMetric(metricName, data) {
    const values = data.map(d => d.value);
    
    // Use multiple models for ensemble prediction
    const predictions = [];
    
    // Time series prediction
    const tsPrediction = this.models.timeSeries.predict(values, this.config.predictionWindow);
    predictions.push(tsPrediction);
    
    // Pattern-based prediction
    const patternPrediction = this.models.pattern.predict(metricName, data);
    if (patternPrediction) {
      predictions.push(patternPrediction);
    }
    
    // Anomaly detection
    const anomalyScore = this.models.anomaly.detectAnomaly(values);
    
    // Correlation-based adjustment
    const correlationAdjustment = this.models.correlation.getAdjustment(metricName, data);
    
    // Ensemble prediction (weighted average)
    let finalPrediction = this.ensemblePrediction(predictions);
    
    // Apply correlation adjustment
    if (correlationAdjustment) {
      finalPrediction.value *= (1 + correlationAdjustment);
    }
    
    return {
      value: finalPrediction.value,
      confidence: finalPrediction.confidence,
      trend: finalPrediction.trend,
      anomalyScore,
      timeHorizon: this.config.predictionWindow
    };
  }

  /**
   * Ensemble prediction
   */
  ensemblePrediction(predictions) {
    if (predictions.length === 0) {
      return { value: 0, confidence: 0, trend: 'stable' };
    }
    
    // Weight predictions by confidence
    let totalWeight = 0;
    let weightedSum = 0;
    let trends = [];
    
    for (const pred of predictions) {
      const weight = pred.confidence || 0.5;
      weightedSum += pred.value * weight;
      totalWeight += weight;
      trends.push(pred.trend);
    }
    
    // Determine dominant trend
    const trendCounts = {};
    for (const trend of trends) {
      trendCounts[trend] = (trendCounts[trend] || 0) + 1;
    }
    const dominantTrend = Object.entries(trendCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'stable';
    
    return {
      value: totalWeight > 0 ? weightedSum / totalWeight : 0,
      confidence: totalWeight / predictions.length,
      trend: dominantTrend
    };
  }

  /**
   * Analyze predictions for issues
   */
  analyzePredictions(predictions) {
    const alerts = [];
    
    // Check CPU prediction
    if (predictions.cpu) {
      if (predictions.cpu.value > 80 && predictions.cpu.confidence > this.config.confidenceThreshold) {
        alerts.push({
          type: 'cpu_overload_predicted',
          severity: predictions.cpu.value > 90 ? 'critical' : 'high',
          prediction: predictions.cpu,
          message: `CPU usage predicted to reach ${predictions.cpu.value.toFixed(1)}% in ${this.config.predictionWindow / 60000} minutes`,
          recommendation: 'Consider scaling resources or optimizing CPU-intensive operations'
        });
      }
    }
    
    // Check memory prediction
    if (predictions.memory) {
      if (predictions.memory.value > 85 && predictions.memory.confidence > this.config.confidenceThreshold) {
        alerts.push({
          type: 'memory_exhaustion_predicted',
          severity: predictions.memory.value > 95 ? 'critical' : 'high',
          prediction: predictions.memory,
          message: `Memory usage predicted to reach ${predictions.memory.value.toFixed(1)}% in ${this.config.predictionWindow / 60000} minutes`,
          recommendation: 'Review memory allocations and check for potential leaks'
        });
      }
      
      // Check for memory leak pattern
      if (predictions.memory.trend === 'increasing' && predictions.memory.confidence > 0.8) {
        const leakProbability = this.detectMemoryLeakPattern();
        if (leakProbability > 0.7) {
          alerts.push({
            type: 'memory_leak_detected',
            severity: 'high',
            probability: leakProbability,
            message: 'Potential memory leak detected based on growth pattern',
            recommendation: 'Investigate unreleased resources and review recent code changes'
          });
        }
      }
    }
    
    // Check response time prediction
    if (predictions.responseTime) {
      if (predictions.responseTime.value > 1000 && predictions.responseTime.confidence > this.config.confidenceThreshold) {
        alerts.push({
          type: 'performance_degradation_predicted',
          severity: 'medium',
          prediction: predictions.responseTime,
          message: `Response time predicted to reach ${predictions.responseTime.value.toFixed(0)}ms`,
          recommendation: 'Optimize slow operations or implement caching'
        });
      }
    }
    
    // Check event loop lag
    if (predictions.eventLoopLag) {
      if (predictions.eventLoopLag.value > 100 && predictions.eventLoopLag.confidence > this.config.confidenceThreshold) {
        alerts.push({
          type: 'event_loop_blocking_predicted',
          severity: 'high',
          prediction: predictions.eventLoopLag,
          message: `Event loop lag predicted to reach ${predictions.eventLoopLag.value.toFixed(0)}ms`,
          recommendation: 'Identify and optimize blocking operations'
        });
      }
    }
    
    // Check for cascade failures
    const cascadeRisk = this.assessCascadeRisk(predictions);
    if (cascadeRisk.probability > 0.6) {
      alerts.push({
        type: 'cascade_failure_risk',
        severity: 'critical',
        risk: cascadeRisk,
        message: 'Multiple metrics show concerning trends, cascade failure possible',
        recommendation: 'Immediate intervention recommended to prevent system-wide failure'
      });
    }
    
    // Store and emit alerts
    if (alerts.length > 0) {
      const timestamp = Date.now();
      this.alerts.set(timestamp, alerts);
      this.emit('alerts:generated', alerts);
      
      // Log critical alerts
      for (const alert of alerts) {
        if (alert.severity === 'critical') {
          logger.error(`CRITICAL PREDICTION: ${alert.message}`);
        }
      }
    }
  }

  /**
   * Detect memory leak pattern
   */
  detectMemoryLeakPattern() {
    const memData = this.historicalData.memory;
    if (memData.length < 50) return 0;
    
    // Check for consistent growth
    const values = memData.slice(-50).map(d => d.value);
    let increasingCount = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        increasingCount++;
      }
    }
    
    const increasingRatio = increasingCount / (values.length - 1);
    
    // Check growth rate
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const growthRate = (lastValue - firstValue) / firstValue;
    
    // Calculate leak probability
    let probability = 0;
    
    if (increasingRatio > 0.8) probability += 0.4;
    if (growthRate > 0.1) probability += 0.3;
    if (this.models.timeSeries.getTrend(values) === 'increasing') probability += 0.3;
    
    return Math.min(1, probability);
  }

  /**
   * Assess cascade failure risk
   */
  assessCascadeRisk(predictions) {
    let riskFactors = 0;
    let criticalMetrics = [];
    
    // Check each prediction
    for (const [metric, prediction] of Object.entries(predictions)) {
      if (prediction.trend === 'increasing') {
        const threshold = this.getThresholdForMetric(metric);
        if (threshold && prediction.value > threshold * 0.8) {
          riskFactors++;
          criticalMetrics.push(metric);
        }
      }
    }
    
    // Check correlations
    const correlations = this.models.correlation.getStrongCorrelations();
    const correlatedCritical = correlations.filter(c => 
      criticalMetrics.includes(c.metric1) || criticalMetrics.includes(c.metric2)
    );
    
    // Calculate risk probability
    let probability = 0;
    
    if (riskFactors >= 3) probability += 0.4;
    if (correlatedCritical.length >= 2) probability += 0.3;
    if (criticalMetrics.includes('cpu') && criticalMetrics.includes('memory')) probability += 0.3;
    
    return {
      probability: Math.min(1, probability),
      affectedMetrics: criticalMetrics,
      correlations: correlatedCritical
    };
  }

  /**
   * Get threshold for metric
   */
  getThresholdForMetric(metric) {
    const thresholds = {
      cpu: 80,
      memory: 85,
      heap: 90,
      responseTime: 1000,
      errorRate: 5,
      eventLoopLag: 100
    };
    
    return thresholds[metric];
  }

  /**
   * Train models
   */
  async trainModels() {
    // Train each model with historical data
    for (const [metric, data] of Object.entries(this.historicalData)) {
      if (data.length >= this.config.minDataPoints) {
        this.models.timeSeries.train(metric, data);
        this.models.pattern.train(metric, data);
        this.models.anomaly.train(metric, data);
      }
    }
    
    // Train correlation model
    this.models.correlation.train(this.historicalData);
    
    logger.info('Predictive models trained');
  }

  /**
   * Update models with new data
   */
  updateModels(metrics) {
    // Online learning - update models incrementally
    for (const [metric, value] of Object.entries(metrics)) {
      this.models.timeSeries.update(metric, value);
      this.models.anomaly.update(metric, value);
    }
    
    // Update correlation model periodically
    if (Math.random() < 0.1) { // 10% chance
      this.models.correlation.update(this.historicalData);
    }
  }

  /**
   * Calculate CPU usage
   */
  calculateCPUUsage(cpus) {
    // Simplified CPU calculation
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const usage = 100 - ~~(100 * totalIdle / totalTick);
    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Measure event loop lag
   */
  async measureEventLoopLag() {
    return new Promise(resolve => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000;
        resolve(lag);
      });
    });
  }

  /**
   * Evaluate prediction accuracy
   */
  evaluatePrediction(predictedValue, actualValue, threshold = 0.1) {
    const error = Math.abs(predictedValue - actualValue) / actualValue;
    return error <= threshold;
  }

  /**
   * Update model performance
   */
  updateModelPerformance(prediction, actual) {
    this.modelPerformance.predictions++;
    
    if (this.evaluatePrediction(prediction.value, actual)) {
      this.modelPerformance.correct++;
    }
    
    // Update accuracy
    this.modelPerformance.accuracy = 
      this.modelPerformance.correct / this.modelPerformance.predictions;
  }

  /**
   * Get prediction summary
   */
  getPredictionSummary() {
    const latest = Array.from(this.predictions.values()).pop();
    const latestAlerts = Array.from(this.alerts.values()).pop();
    
    return {
      currentPredictions: latest || {},
      alerts: latestAlerts || [],
      modelPerformance: this.modelPerformance,
      confidence: this.calculateOverallConfidence()
    };
  }

  /**
   * Calculate overall confidence
   */
  calculateOverallConfidence() {
    const latest = Array.from(this.predictions.values()).pop();
    if (!latest) return 0;
    
    const confidences = Object.values(latest)
      .map(p => p.confidence || 0)
      .filter(c => c > 0);
    
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  /**
   * Stop predictive monitor
   */
  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
    }
    
    logger.info('Predictive monitor stopped');
  }
}

/**
 * Time Series Model
 */
class TimeSeriesModel {
  constructor() {
    this.models = new Map();
  }
  
  train(metric, data) {
    // Simple exponential smoothing
    this.models.set(metric, {
      alpha: 0.3, // Smoothing factor
      lastValue: data[data.length - 1]?.value || 0
    });
  }
  
  update(metric, value) {
    const model = this.models.get(metric);
    if (model) {
      model.lastValue = model.alpha * value + (1 - model.alpha) * model.lastValue;
    }
  }
  
  predict(values, horizon) {
    if (values.length < 2) {
      return { value: values[0] || 0, confidence: 0.1, trend: 'unknown' };
    }
    
    // Calculate trend
    const trend = this.getTrend(values);
    
    // Simple linear projection
    const n = values.length;
    const recentValues = values.slice(-10);
    const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Calculate rate of change
    const firstHalf = values.slice(0, Math.floor(n / 2));
    const secondHalf = values.slice(Math.floor(n / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const rateOfChange = (avgSecond - avgFirst) / (n / 2);
    
    // Project forward
    const stepsAhead = horizon / (5000); // Assuming 5 second intervals
    const predictedValue = avgRecent + (rateOfChange * stepsAhead);
    
    // Calculate confidence based on variance
    const variance = this.calculateVariance(recentValues);
    const confidence = Math.max(0.1, Math.min(0.9, 1 - (variance / avgRecent)));
    
    return {
      value: Math.max(0, predictedValue),
      confidence,
      trend
    };
  }
  
  getTrend(values) {
    if (values.length < 3) return 'unknown';
    
    const n = Math.min(10, values.length);
    const recent = values.slice(-n);
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i - 1]) increasing++;
      else if (recent[i] < recent[i - 1]) decreasing++;
    }
    
    if (increasing > n * 0.6) return 'increasing';
    if (decreasing > n * 0.6) return 'decreasing';
    return 'stable';
  }
  
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

/**
 * Pattern Recognition Model
 */
class PatternRecognitionModel {
  constructor() {
    this.patterns = new Map();
  }
  
  train(metric, data) {
    // Identify repeating patterns
    const patterns = this.findPatterns(data);
    this.patterns.set(metric, patterns);
  }
  
  findPatterns(data) {
    const patterns = [];
    
    // Look for daily patterns (if enough data)
    if (data.length > 288) { // 24 hours at 5 min intervals
      const dayPattern = this.extractDayPattern(data);
      if (dayPattern) patterns.push(dayPattern);
    }
    
    // Look for hourly patterns
    if (data.length > 12) {
      const hourPattern = this.extractHourPattern(data);
      if (hourPattern) patterns.push(hourPattern);
    }
    
    return patterns;
  }
  
  extractDayPattern(data) {
    // Simplified day pattern extraction
    const dayLength = 288; // 5 min intervals in 24 hours
    const days = Math.floor(data.length / dayLength);
    
    if (days < 2) return null;
    
    // Compare days for similarity
    const patterns = [];
    for (let d = 0; d < days - 1; d++) {
      const day1 = data.slice(d * dayLength, (d + 1) * dayLength);
      const day2 = data.slice((d + 1) * dayLength, (d + 2) * dayLength);
      
      const similarity = this.calculateSimilarity(
        day1.map(d => d.value),
        day2.map(d => d.value)
      );
      
      if (similarity > 0.7) {
        patterns.push({
          type: 'daily',
          period: dayLength,
          confidence: similarity
        });
      }
    }
    
    return patterns.length > 0 ? patterns[0] : null;
  }
  
  extractHourPattern(data) {
    // Simplified hour pattern extraction
    const hourLength = 12; // 5 min intervals in 1 hour
    const hours = Math.floor(data.length / hourLength);
    
    if (hours < 3) return null;
    
    // Check for repeating hourly pattern
    const lastHour = data.slice(-hourLength).map(d => d.value);
    const prevHour = data.slice(-2 * hourLength, -hourLength).map(d => d.value);
    
    const similarity = this.calculateSimilarity(lastHour, prevHour);
    
    if (similarity > 0.6) {
      return {
        type: 'hourly',
        period: hourLength,
        confidence: similarity
      };
    }
    
    return null;
  }
  
  calculateSimilarity(arr1, arr2) {
    if (arr1.length !== arr2.length) return 0;
    
    const n = arr1.length;
    let sumDiff = 0;
    let sumTotal = 0;
    
    for (let i = 0; i < n; i++) {
      sumDiff += Math.abs(arr1[i] - arr2[i]);
      sumTotal += Math.abs(arr1[i]) + Math.abs(arr2[i]);
    }
    
    if (sumTotal === 0) return 1;
    
    return 1 - (sumDiff / sumTotal);
  }
  
  predict(metric, data) {
    const patterns = this.patterns.get(metric);
    if (!patterns || patterns.length === 0) return null;
    
    const pattern = patterns[0];
    const currentPosition = data.length % pattern.period;
    const historicalValue = data[data.length - pattern.period]?.value;
    
    if (historicalValue !== undefined) {
      return {
        value: historicalValue,
        confidence: pattern.confidence * 0.8,
        trend: 'pattern-based'
      };
    }
    
    return null;
  }
}

/**
 * Anomaly Detection Model
 */
class AnomalyDetectionModel {
  constructor() {
    this.baselines = new Map();
  }
  
  train(metric, data) {
    const values = data.map(d => d.value);
    
    // Calculate baseline statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    this.baselines.set(metric, {
      mean,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values)
    });
  }
  
  update(metric, value) {
    const baseline = this.baselines.get(metric);
    if (!baseline) return;
    
    // Update with exponential moving average
    const alpha = 0.1;
    baseline.mean = alpha * value + (1 - alpha) * baseline.mean;
  }
  
  detectAnomaly(values) {
    if (values.length === 0) return 0;
    
    const lastValue = values[values.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-score
    const zScore = Math.abs((lastValue - mean) / (stdDev || 1));
    
    // Convert to anomaly score (0-1)
    return Math.min(1, zScore / 4);
  }
}

/**
 * Correlation Model
 */
class CorrelationModel {
  constructor() {
    this.correlations = new Map();
  }
  
  train(historicalData) {
    // Find correlations between metrics
    const metrics = Object.keys(historicalData);
    
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metric1 = metrics[i];
        const metric2 = metrics[j];
        
        const correlation = this.calculateCorrelation(
          historicalData[metric1],
          historicalData[metric2]
        );
        
        if (Math.abs(correlation) > 0.5) {
          const key = `${metric1}:${metric2}`;
          this.correlations.set(key, {
            metric1,
            metric2,
            correlation
          });
        }
      }
    }
  }
  
  update(historicalData) {
    // Retrain with new data
    this.train(historicalData);
  }
  
  calculateCorrelation(data1, data2) {
    // Align timestamps
    const aligned = this.alignData(data1, data2);
    if (aligned.length < 10) return 0;
    
    const values1 = aligned.map(d => d.value1);
    const values2 = aligned.map(d => d.value2);
    
    // Pearson correlation
    const n = values1.length;
    const mean1 = values1.reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(denom1 * denom2);
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  alignData(data1, data2) {
    const aligned = [];
    const map2 = new Map(data2.map(d => [d.timestamp, d.value]));
    
    for (const d1 of data1) {
      const value2 = map2.get(d1.timestamp);
      if (value2 !== undefined) {
        aligned.push({
          timestamp: d1.timestamp,
          value1: d1.value,
          value2
        });
      }
    }
    
    return aligned;
  }
  
  getAdjustment(metric, data) {
    // Find correlated metrics and calculate adjustment
    let totalAdjustment = 0;
    let count = 0;
    
    for (const [key, corr] of this.correlations) {
      if (corr.metric1 === metric || corr.metric2 === metric) {
        // Simplified adjustment based on correlation strength
        totalAdjustment += corr.correlation * 0.1;
        count++;
      }
    }
    
    return count > 0 ? totalAdjustment / count : 0;
  }
  
  getStrongCorrelations() {
    return Array.from(this.correlations.values())
      .filter(c => Math.abs(c.correlation) > 0.7);
  }
}

// Export singleton instance
module.exports = new PredictivePerformanceMonitor({ enabled: true });