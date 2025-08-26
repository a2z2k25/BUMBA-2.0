/**
 * Adaptive Pool Manager for Intelligent Pooling
 * Dynamically adjusts pool size based on metrics and system state
 */

const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

class AdaptivePoolManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Pool size configuration
    this.config = {
      minPoolSize: config.minPoolSize || 3,
      maxPoolSize: config.maxPoolSize || 20,
      targetPoolSize: config.targetPoolSize || 12,
      
      // Thresholds
      coldStartThreshold: config.coldStartThreshold || 100, // ms
      utilizationTarget: config.utilizationTarget || 0.7,    // 70%
      memoryLimit: config.memoryLimit || 100,                // MB
      memoryPerSpecialist: config.memoryPerSpecialist || 5,  // MB
      
      // Adjustment parameters
      scaleUpThreshold: config.scaleUpThreshold || 0.8,      // 80% utilization
      scaleDownThreshold: config.scaleDownThreshold || 0.3,  // 30% utilization
      scaleUpFactor: config.scaleUpFactor || 1.5,
      scaleDownFactor: config.scaleDownFactor || 0.75,
      
      // Timing
      adjustmentInterval: config.adjustmentInterval || 30000, // 30 seconds
      metricsWindow: config.metricsWindow || 300000,         // 5 minutes
      cooldownPeriod: config.cooldownPeriod || 60000,        // 1 minute
      
      // Modes
      aggressiveMode: config.aggressiveMode || false,
      learningMode: config.learningMode || true
    };
    
    // Current state
    this.currentPoolSize = this.config.targetPoolSize;
    this.targetSize = this.config.targetPoolSize;
    this.lastAdjustment = 0;
    this.adjustmentHistory = [];
    
    // Metrics tracking
    this.metrics = {
      coldStarts: [],
      activations: [],
      utilization: [],
      memoryUsage: [],
      responseTime: [],
      concurrency: []
    };
    
    // Performance tracking
    this.performance = {
      avgColdStartTime: 0,
      avgWarmStartTime: 0,
      hitRate: 0,
      utilizationRate: 0,
      memoryPressure: 0,
      adjustmentCount: 0
    };
    
    // Load patterns
    this.loadPatterns = {
      current: 'normal',
      history: [],
      predictions: []
    };
    
    // Auto-scaling state
    this.autoScalingEnabled = true;
    this.scalingInProgress = false;
    
    // Start monitoring
    this.startMonitoring();
    
    logger.info(`Adaptive pool manager initialized (${this.config.minPoolSize}-${this.config.maxPoolSize} agents)`);
  }
  
  /**
   * Track cold start event
   */
  trackColdStart(specialistType, duration) {
    const now = Date.now();
    
    this.metrics.coldStarts.push({
      type: specialistType,
      duration,
      timestamp: now
    });
    
    // Update rolling average
    this.updateColdStartMetrics();
    
    // Check if adjustment needed
    if (duration > this.config.coldStartThreshold) {
      this.signalHighColdStart();
    }
    
    // Trim old metrics
    this.trimMetrics();
  }
  
  /**
   * Track activation from pool
   */
  trackActivation(specialistType, duration) {
    const now = Date.now();
    
    this.metrics.activations.push({
      type: specialistType,
      duration,
      timestamp: now,
      poolSize: this.currentPoolSize
    });
    
    // Update warm start metrics
    this.updateWarmStartMetrics();
    
    // Trim old metrics
    this.trimMetrics();
  }
  
  /**
   * Update utilization metrics
   */
  updateUtilization(activeCount, totalCount) {
    const utilization = totalCount > 0 ? activeCount / totalCount : 0;
    
    this.metrics.utilization.push({
      active: activeCount,
      total: totalCount,
      rate: utilization,
      timestamp: Date.now()
    });
    
    this.performance.utilizationRate = utilization;
    
    // Trim old metrics
    this.trimMetrics();
  }
  
  /**
   * Update memory usage
   */
  updateMemoryUsage(usageMB) {
    this.metrics.memoryUsage.push({
      usage: usageMB,
      timestamp: Date.now(),
      pressure: usageMB / this.config.memoryLimit
    });
    
    this.performance.memoryPressure = usageMB / this.config.memoryLimit;
    
    // Trim old metrics
    this.trimMetrics();
  }
  
  /**
   * Calculate optimal pool size
   */
  calculateOptimalSize() {
    const now = Date.now();
    const windowStart = now - this.config.metricsWindow;
    
    // Get recent metrics
    const recentColdStarts = this.metrics.coldStarts
      .filter(m => m.timestamp > windowStart);
    const recentActivations = this.metrics.activations
      .filter(m => m.timestamp > windowStart);
    const recentUtilization = this.metrics.utilization
      .filter(m => m.timestamp > windowStart);
    
    // Calculate factors
    const factors = {
      coldStartFactor: this.calculateColdStartFactor(recentColdStarts),
      utilizationFactor: this.calculateUtilizationFactor(recentUtilization),
      concurrencyFactor: this.calculateConcurrencyFactor(recentActivations),
      memoryFactor: this.calculateMemoryFactor(),
      loadFactor: this.calculateLoadFactor()
    };
    
    // Weight factors based on mode
    const weights = this.getFactorWeights();
    
    // Calculate weighted score
    let score = 0;
    for (const [factor, value] of Object.entries(factors)) {
      score += value * (weights[factor] || 0.2);
    }
    
    // Convert score to pool size
    const baseSize = this.config.targetPoolSize;
    let optimalSize = Math.round(baseSize * score);
    
    // Apply constraints
    optimalSize = Math.max(this.config.minPoolSize, optimalSize);
    optimalSize = Math.min(this.config.maxPoolSize, optimalSize);
    
    logger.debug(`Calculated optimal pool size: ${optimalSize} (score: ${score.toFixed(2)})`);
    logger.debug(`Factors: ${JSON.stringify(factors)}`);
    
    return {
      size: optimalSize,
      score,
      factors,
      confidence: this.calculateConfidence(factors)
    };
  }
  
  /**
   * Calculate cold start factor
   */
  calculateColdStartFactor(coldStarts) {
    if (coldStarts.length === 0) return 1.0;
    
    // Count slow cold starts
    const slowStarts = coldStarts.filter(cs => 
      cs.duration > this.config.coldStartThreshold
    ).length;
    
    const rate = slowStarts / coldStarts.length;
    
    // More cold starts = need larger pool
    if (rate > 0.5) return 1.5;  // Many slow starts
    if (rate > 0.3) return 1.3;  // Some slow starts
    if (rate > 0.1) return 1.1;  // Few slow starts
    return 1.0;  // Acceptable
  }
  
  /**
   * Calculate utilization factor
   */
  calculateUtilizationFactor(utilization) {
    if (utilization.length === 0) return 1.0;
    
    // Average utilization
    const avgUtil = utilization.reduce((sum, u) => sum + u.rate, 0) / utilization.length;
    
    // High utilization = need larger pool
    if (avgUtil > this.config.scaleUpThreshold) return 1.4;
    if (avgUtil > this.config.utilizationTarget) return 1.2;
    if (avgUtil < this.config.scaleDownThreshold) return 0.7;
    if (avgUtil < this.config.utilizationTarget * 0.5) return 0.5;
    return 1.0;
  }
  
  /**
   * Calculate concurrency factor
   */
  calculateConcurrencyFactor(activations) {
    if (activations.length === 0) return 1.0;
    
    // Group by time windows (1 second)
    const windows = new Map();
    
    for (const activation of activations) {
      const window = Math.floor(activation.timestamp / 1000);
      const count = windows.get(window) || 0;
      windows.set(window, count + 1);
    }
    
    // Find max concurrency
    const maxConcurrency = Math.max(...windows.values());
    const avgConcurrency = Array.from(windows.values())
      .reduce((sum, c) => sum + c, 0) / windows.size;
    
    // High concurrency = need larger pool
    if (maxConcurrency > this.currentPoolSize * 0.8) return 1.5;
    if (avgConcurrency > this.currentPoolSize * 0.6) return 1.3;
    if (avgConcurrency < this.currentPoolSize * 0.2) return 0.7;
    return 1.0;
  }
  
  /**
   * Calculate memory factor
   */
  calculateMemoryFactor() {
    if (this.performance.memoryPressure > 0.9) return 0.5;  // Critical memory
    if (this.performance.memoryPressure > 0.8) return 0.7;  // High memory
    if (this.performance.memoryPressure > 0.6) return 0.9;  // Moderate memory
    return 1.0;  // Plenty of memory
  }
  
  /**
   * Calculate load factor
   */
  calculateLoadFactor() {
    const pattern = this.loadPatterns.current;
    
    const loadFactors = {
      'burst': 1.8,      // Sudden high load
      'growing': 1.5,    // Increasing load
      'peak': 1.3,       // High sustained load
      'normal': 1.0,     // Standard load
      'declining': 0.8,  // Decreasing load
      'idle': 0.5        // Very low load
    };
    
    return loadFactors[pattern] || 1.0;
  }
  
  /**
   * Get factor weights based on mode
   */
  getFactorWeights() {
    if (this.config.aggressiveMode) {
      return {
        coldStartFactor: 0.35,
        utilizationFactor: 0.25,
        concurrencyFactor: 0.25,
        memoryFactor: 0.05,
        loadFactor: 0.10
      };
    }
    
    return {
      coldStartFactor: 0.25,
      utilizationFactor: 0.30,
      concurrencyFactor: 0.20,
      memoryFactor: 0.15,
      loadFactor: 0.10
    };
  }
  
  /**
   * Calculate confidence in the recommendation
   */
  calculateConfidence(factors) {
    // Check factor agreement
    const values = Object.values(factors);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    
    // Low variance = high confidence
    if (variance < 0.1) return 0.9;
    if (variance < 0.2) return 0.7;
    if (variance < 0.4) return 0.5;
    return 0.3;
  }
  
  /**
   * Adjust pool size
   */
  async adjustPoolSize(forceAdjust = false) {
    // Check if adjustment is allowed
    if (!this.canAdjust() && !forceAdjust) {
      logger.debug('Pool adjustment skipped (cooldown or disabled)');
      return null;
    }
    
    // Calculate optimal size
    const optimal = this.calculateOptimalSize();
    
    // Check if adjustment needed
    const sizeDiff = Math.abs(optimal.size - this.currentPoolSize);
    const needsAdjustment = sizeDiff >= 2 || optimal.confidence > 0.8;
    
    if (!needsAdjustment && !forceAdjust) {
      logger.debug(`No adjustment needed (current: ${this.currentPoolSize}, optimal: ${optimal.size})`);
      return null;
    }
    
    // Perform adjustment
    const oldSize = this.currentPoolSize;
    const newSize = optimal.size;
    
    this.scalingInProgress = true;
    
    try {
      // Emit scaling event
      this.emit('scaling:start', {
        from: oldSize,
        to: newSize,
        reason: optimal.factors
      });
      
      // Update size
      this.currentPoolSize = newSize;
      this.targetSize = newSize;
      this.lastAdjustment = Date.now();
      
      // Record adjustment
      this.adjustmentHistory.push({
        timestamp: Date.now(),
        from: oldSize,
        to: newSize,
        factors: optimal.factors,
        confidence: optimal.confidence
      });
      
      // Keep history limited
      if (this.adjustmentHistory.length > 100) {
        this.adjustmentHistory.shift();
      }
      
      this.performance.adjustmentCount++;
      
      // Emit completion event
      this.emit('scaling:complete', {
        from: oldSize,
        to: newSize,
        success: true
      });
      
      logger.info(`Pool adjusted: ${oldSize} → ${newSize} agents (confidence: ${optimal.confidence.toFixed(2)})`);
      
      return {
        oldSize,
        newSize,
        factors: optimal.factors,
        confidence: optimal.confidence
      };
      
    } catch (error) {
      logger.error('Pool adjustment failed:', error);
      
      this.emit('scaling:failed', {
        from: oldSize,
        to: newSize,
        error: error.message
      });
      
      return null;
    } finally {
      this.scalingInProgress = false;
    }
  }
  
  /**
   * Check if adjustment is allowed
   */
  canAdjust() {
    if (!this.autoScalingEnabled) return false;
    if (this.scalingInProgress) return false;
    
    // Check cooldown
    const timeSinceLastAdjustment = Date.now() - this.lastAdjustment;
    if (timeSinceLastAdjustment < this.config.cooldownPeriod) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Signal high cold start rate
   */
  signalHighColdStart() {
    this.emit('performance:cold-start-high');
    
    // Consider immediate scaling if critical
    const recentColdStarts = this.metrics.coldStarts
      .filter(m => m.timestamp > Date.now() - 60000); // Last minute
    
    if (recentColdStarts.length > 5) {
      logger.warn('High cold start rate detected, considering immediate scaling');
      this.adjustPoolSize(true);
    }
  }
  
  /**
   * Detect load pattern
   */
  detectLoadPattern() {
    const now = Date.now();
    const window = 60000; // 1 minute windows
    
    // Get activation counts for recent windows
    const windows = [];
    for (let i = 5; i >= 0; i--) {
      const windowStart = now - (i + 1) * window;
      const windowEnd = now - i * window;
      
      const count = this.metrics.activations.filter(a => 
        a.timestamp >= windowStart && a.timestamp < windowEnd
      ).length;
      
      windows.push(count);
    }
    
    // Detect pattern
    const pattern = this.analyzeLoadTrend(windows);
    
    if (pattern !== this.loadPatterns.current) {
      this.loadPatterns.history.push({
        pattern: this.loadPatterns.current,
        timestamp: now
      });
      
      this.loadPatterns.current = pattern;
      
      this.emit('load:pattern-changed', {
        from: this.loadPatterns.history[this.loadPatterns.history.length - 1]?.pattern,
        to: pattern
      });
      
      logger.info(`Load pattern changed to: ${pattern}`);
    }
    
    return pattern;
  }
  
  /**
   * Analyze load trend
   */
  analyzeLoadTrend(windows) {
    if (windows.length < 2) return 'normal';
    
    // Calculate trend
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < windows.length; i++) {
      if (windows[i] > windows[i - 1] * 1.2) increasing++;
      if (windows[i] < windows[i - 1] * 0.8) decreasing++;
    }
    
    // Detect burst (sudden spike)
    const lastTwo = windows.slice(-2);
    if (lastTwo[1] > lastTwo[0] * 3) return 'burst';
    
    // Detect trends
    if (increasing >= 3) return 'growing';
    if (decreasing >= 3) return 'declining';
    
    // Check absolute levels
    const avg = windows.reduce((sum, w) => sum + w, 0) / windows.length;
    const recent = windows.slice(-2).reduce((sum, w) => sum + w, 0) / 2;
    
    if (recent > avg * 1.5) return 'peak';
    if (recent < avg * 0.3) return 'idle';
    
    return 'normal';
  }
  
  /**
   * Update cold start metrics
   */
  updateColdStartMetrics() {
    const recent = this.metrics.coldStarts
      .filter(m => m.timestamp > Date.now() - this.config.metricsWindow);
    
    if (recent.length > 0) {
      const avgDuration = recent.reduce((sum, cs) => sum + cs.duration, 0) / recent.length;
      this.performance.avgColdStartTime = avgDuration;
    }
  }
  
  /**
   * Update warm start metrics
   */
  updateWarmStartMetrics() {
    const recent = this.metrics.activations
      .filter(m => m.timestamp > Date.now() - this.config.metricsWindow);
    
    if (recent.length > 0) {
      const avgDuration = recent.reduce((sum, a) => sum + a.duration, 0) / recent.length;
      this.performance.avgWarmStartTime = avgDuration;
    }
    
    // Calculate hit rate
    const coldStarts = this.metrics.coldStarts
      .filter(m => m.timestamp > Date.now() - this.config.metricsWindow).length;
    const warmStarts = recent.length;
    const total = coldStarts + warmStarts;
    
    if (total > 0) {
      this.performance.hitRate = warmStarts / total;
    }
  }
  
  /**
   * Trim old metrics
   */
  trimMetrics() {
    const cutoff = Date.now() - this.config.metricsWindow * 2; // Keep 2x window
    
    for (const key in this.metrics) {
      if (Array.isArray(this.metrics[key])) {
        this.metrics[key] = this.metrics[key].filter(m => m.timestamp > cutoff);
      }
    }
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    // Periodic adjustment
    this.adjustmentInterval = setInterval(() => {
      this.adjustPoolSize();
      this.detectLoadPattern();
    }, this.config.adjustmentInterval);
    
    logger.debug('Adaptive monitoring started');
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.adjustmentInterval) {
      clearInterval(this.adjustmentInterval);
      this.adjustmentInterval = null;
    }
    
    logger.debug('Adaptive monitoring stopped');
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      currentSize: this.currentPoolSize,
      targetSize: this.targetSize,
      limits: {
        min: this.config.minPoolSize,
        max: this.config.maxPoolSize
      },
      performance: {
        ...this.performance,
        hitRate: `${(this.performance.hitRate * 100).toFixed(1)}%`,
        utilizationRate: `${(this.performance.utilizationRate * 100).toFixed(1)}%`,
        memoryPressure: `${(this.performance.memoryPressure * 100).toFixed(1)}%`
      },
      loadPattern: this.loadPatterns.current,
      autoScaling: this.autoScalingEnabled,
      lastAdjustment: this.lastAdjustment,
      adjustmentCount: this.performance.adjustmentCount
    };
  }
  
  /**
   * Enable/disable auto-scaling
   */
  setAutoScaling(enabled) {
    this.autoScalingEnabled = enabled;
    logger.info(`Auto-scaling ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Export state
   */
  export() {
    return {
      currentPoolSize: this.currentPoolSize,
      targetSize: this.targetSize,
      adjustmentHistory: this.adjustmentHistory.slice(-20),
      performance: this.performance,
      loadPatterns: this.loadPatterns
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.currentPoolSize) this.currentPoolSize = state.currentPoolSize;
    if (state.targetSize) this.targetSize = state.targetSize;
    if (state.adjustmentHistory) this.adjustmentHistory = state.adjustmentHistory;
    if (state.performance) this.performance = { ...this.performance, ...state.performance };
    if (state.loadPatterns) this.loadPatterns = { ...this.loadPatterns, ...state.loadPatterns };
    
    logger.debug('Adaptive pool manager state imported');
  }
}

module.exports = { AdaptivePoolManager };