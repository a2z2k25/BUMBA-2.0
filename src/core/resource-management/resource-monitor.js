/**
 * BUMBA Resource Monitoring and Alerting System
 * Real-time monitoring with intelligent alerting
 */

const { EventEmitter } = require('events');
const os = require('os');
const v8 = require('v8');
const { logger } = require('../logging/bumba-logger');

class ResourceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enabled: options.enabled !== false,
      interval: options.interval || 5000, // 5 seconds
      retention: options.retention || 3600000, // 1 hour of history
      alerting: {
        enabled: options.alerting !== false,
        channels: options.alertChannels || ['console', 'event'],
        cooldown: options.alertCooldown || 300000, // 5 minutes
        escalation: options.escalation !== false
      },
      thresholds: {
        memory: {
          warning: options.memoryWarning || 70,
          critical: options.memoryCritical || 85
        },
        cpu: {
          warning: options.cpuWarning || 70,
          critical: options.cpuCritical || 90
        },
        disk: {
          warning: options.diskWarning || 80,
          critical: options.diskCritical || 90
        },
        connections: {
          warning: options.connectionsWarning || 80,
          critical: options.connectionsCritical || 95
        }
      },
      ...options
    };
    
    // Monitoring data
    this.metrics = {
      memory: [],
      cpu: [],
      disk: [],
      network: [],
      cache: [],
      connections: [],
      custom: new Map()
    };
    
    // Alert management
    this.alerts = {
      active: new Map(),
      history: [],
      cooldowns: new Map(),
      escalations: new Map()
    };
    
    // Resource tracking
    this.resources = {
      baseline: null,
      current: null,
      peak: null,
      trends: new Map()
    };
    
    // Performance metrics
    this.performance = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      availability: 100
    };
    
    // Initialize monitoring
    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Start monitoring
   */
  start() {
    // Establish baseline
    this.establishBaseline();
    
    // Start collection
    this.collectionInterval = setInterval(() => {
      this.collect();
    }, this.config.interval);
    
    // Start analysis
    this.analysisInterval = setInterval(() => {
      this.analyze();
    }, this.config.interval * 6); // Every 30 seconds
    
    // Start cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
    
    logger.info('Resource monitoring started');
  }

  /**
   * Establish resource baseline
   */
  establishBaseline() {
    const samples = [];
    
    // Collect 10 samples
    const collectSample = () => {
      samples.push(this.collectMetrics());
      
      if (samples.length < 10) {
        setTimeout(collectSample, 1000);
      } else {
        // Calculate baseline
        this.resources.baseline = this.calculateBaseline(samples);
        this.emit('baseline-established', this.resources.baseline);
      }
    };
    
    collectSample();
  }

  /**
   * Calculate baseline from samples
   */
  calculateBaseline(samples) {
    const baseline = {
      memory: { avg: 0, std: 0 },
      cpu: { avg: 0, std: 0 },
      disk: { avg: 0, std: 0 }
    };
    
    // Calculate averages
    for (const sample of samples) {
      baseline.memory.avg += sample.memory.percentage;
      baseline.cpu.avg += sample.cpu.percentage;
      baseline.disk.avg += sample.disk.percentage;
    }
    
    baseline.memory.avg /= samples.length;
    baseline.cpu.avg /= samples.length;
    baseline.disk.avg /= samples.length;
    
    // Calculate standard deviation
    for (const sample of samples) {
      baseline.memory.std += Math.pow(sample.memory.percentage - baseline.memory.avg, 2);
      baseline.cpu.std += Math.pow(sample.cpu.percentage - baseline.cpu.avg, 2);
      baseline.disk.std += Math.pow(sample.disk.percentage - baseline.disk.avg, 2);
    }
    
    baseline.memory.std = Math.sqrt(baseline.memory.std / samples.length);
    baseline.cpu.std = Math.sqrt(baseline.cpu.std / samples.length);
    baseline.disk.std = Math.sqrt(baseline.disk.std / samples.length);
    
    return baseline;
  }

  /**
   * Collect resource metrics
   */
  collect() {
    const metrics = this.collectMetrics();
    
    // Store metrics
    this.storeMetrics(metrics);
    
    // Update current state
    this.resources.current = metrics;
    
    // Update peak values
    this.updatePeakValues(metrics);
    
    // Check thresholds
    this.checkThresholds(metrics);
    
    // Emit metrics
    this.emit('metrics', metrics);
    
    return metrics;
  }

  /**
   * Collect current metrics
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // Memory metrics
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // CPU metrics
    const cpus = os.cpus();
    let cpuUsage = 0;
    cpus.forEach(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      cpuUsage += ((total - idle) / total) * 100;
    });
    cpuUsage /= cpus.length;
    
    // Heap statistics
    const heapStats = v8.getHeapStatistics();
    const heapSpaces = v8.getHeapSpaceStatistics();
    
    // Process metrics
    const processUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // Custom metrics from other components
    const cacheMetrics = this.getCacheMetrics();
    const connectionMetrics = this.getConnectionMetrics();
    
    return {
      timestamp,
      memory: {
        system: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          percentage: (usedMem / totalMem) * 100
        },
        process: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        heap: {
          total: heapStats.total_heap_size,
          used: heapStats.used_heap_size,
          limit: heapStats.heap_size_limit,
          percentage: (heapStats.used_heap_size / heapStats.heap_size_limit) * 100
        },
        spaces: heapSpaces.map(space => ({
          name: space.space_name,
          size: space.space_size,
          used: space.space_used_size,
          available: space.space_available_size
        }))
      },
      cpu: {
        percentage: cpuUsage,
        cores: cpus.length,
        process: {
          user: processUsage.user,
          system: processUsage.system
        },
        loadAvg: os.loadavg()
      },
      disk: {
        percentage: this.getDiskUsage()
      },
      network: {
        connections: connectionMetrics.active,
        bandwidth: this.getNetworkBandwidth()
      },
      cache: cacheMetrics,
      uptime,
      pid: process.pid
    };
  }

  /**
   * Get disk usage (simplified)
   */
  getDiskUsage() {
    // This would require platform-specific implementation
    // Returning mock data for now
    return Math.random() * 50 + 30; // 30-80%
  }

  /**
   * Get network bandwidth
   */
  getNetworkBandwidth() {
    // Mock implementation
    return {
      in: Math.random() * 100, // MB/s
      out: Math.random() * 50  // MB/s
    };
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    try {
      const cacheSystem = require('./smart-cache-invalidation');
      const stats = cacheSystem.getStats();
      
      return {
        entries: stats.entries,
        memory: stats.memory,
        hitRate: stats.invalidations.total > 0 
          ? (stats.entries / (stats.entries + stats.invalidations.total)) * 100
          : 100
      };
    } catch (error) {
      return {
        entries: 0,
        memory: 0,
        hitRate: 0
      };
    }
  }

  /**
   * Get connection metrics
   */
  getConnectionMetrics() {
    // Mock implementation
    return {
      active: Math.floor(Math.random() * 50),
      idle: Math.floor(Math.random() * 20),
      total: 70
    };
  }

  /**
   * Store metrics
   */
  storeMetrics(metrics) {
    // Store in appropriate arrays
    this.metrics.memory.push({
      timestamp: metrics.timestamp,
      value: metrics.memory.heap.percentage
    });
    
    this.metrics.cpu.push({
      timestamp: metrics.timestamp,
      value: metrics.cpu.percentage
    });
    
    this.metrics.disk.push({
      timestamp: metrics.timestamp,
      value: metrics.disk.percentage
    });
    
    // Store cache metrics
    if (metrics.cache) {
      this.metrics.cache.push({
        timestamp: metrics.timestamp,
        ...metrics.cache
      });
    }
    
    // Update trends
    this.updateTrends(metrics);
  }

  /**
   * Update resource trends
   */
  updateTrends(metrics) {
    const updateTrend = (name, value) => {
      const trend = this.resources.trends.get(name) || {
        values: [],
        direction: 'stable',
        rate: 0
      };
      
      trend.values.push(value);
      
      // Keep last 20 values
      if (trend.values.length > 20) {
        trend.values.shift();
      }
      
      // Calculate trend
      if (trend.values.length >= 3) {
        const recent = trend.values.slice(-3);
        const older = trend.values.slice(-6, -3);
        
        if (older.length === 3) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          
          trend.rate = recentAvg - olderAvg;
          
          if (trend.rate > 5) {
            trend.direction = 'increasing';
          } else if (trend.rate < -5) {
            trend.direction = 'decreasing';
          } else {
            trend.direction = 'stable';
          }
        }
      }
      
      this.resources.trends.set(name, trend);
    };
    
    updateTrend('memory', metrics.memory.heap.percentage);
    updateTrend('cpu', metrics.cpu.percentage);
    updateTrend('disk', metrics.disk.percentage);
  }

  /**
   * Update peak values
   */
  updatePeakValues(metrics) {
    if (!this.resources.peak) {
      this.resources.peak = {
        memory: metrics.memory.heap.percentage,
        cpu: metrics.cpu.percentage,
        disk: metrics.disk.percentage,
        timestamp: metrics.timestamp
      };
      return;
    }
    
    if (metrics.memory.heap.percentage > this.resources.peak.memory) {
      this.resources.peak.memory = metrics.memory.heap.percentage;
      this.resources.peak.timestamp = metrics.timestamp;
    }
    
    if (metrics.cpu.percentage > this.resources.peak.cpu) {
      this.resources.peak.cpu = metrics.cpu.percentage;
      this.resources.peak.timestamp = metrics.timestamp;
    }
    
    if (metrics.disk.percentage > this.resources.peak.disk) {
      this.resources.peak.disk = metrics.disk.percentage;
      this.resources.peak.timestamp = metrics.timestamp;
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  checkThresholds(metrics) {
    // Memory thresholds
    this.checkThreshold(
      'memory',
      metrics.memory.heap.percentage,
      this.config.thresholds.memory,
      metrics
    );
    
    // CPU thresholds
    this.checkThreshold(
      'cpu',
      metrics.cpu.percentage,
      this.config.thresholds.cpu,
      metrics
    );
    
    // Disk thresholds
    this.checkThreshold(
      'disk',
      metrics.disk.percentage,
      this.config.thresholds.disk,
      metrics
    );
    
    // Connection thresholds
    const connectionUsage = (metrics.network.connections / 100) * 100; // Assuming 100 max
    this.checkThreshold(
      'connections',
      connectionUsage,
      this.config.thresholds.connections,
      metrics
    );
  }

  /**
   * Check a specific threshold
   */
  checkThreshold(resource, value, thresholds, metrics) {
    const alertKey = `${resource}_threshold`;
    
    if (value >= thresholds.critical) {
      this.triggerAlert(alertKey, 'critical', {
        resource,
        value,
        threshold: thresholds.critical,
        metrics
      });
    } else if (value >= thresholds.warning) {
      this.triggerAlert(alertKey, 'warning', {
        resource,
        value,
        threshold: thresholds.warning,
        metrics
      });
    } else {
      // Clear alert if value is back to normal
      this.clearAlert(alertKey);
    }
  }

  /**
   * Trigger an alert
   */
  triggerAlert(key, severity, data) {
    // Check cooldown
    if (this.isInCooldown(key)) {
      return;
    }
    
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      key,
      severity,
      timestamp: Date.now(),
      data,
      acknowledged: false
    };
    
    // Check if alert already exists
    const existing = this.alerts.active.get(key);
    
    if (existing && existing.severity === severity) {
      // Update existing alert
      existing.count = (existing.count || 1) + 1;
      existing.lastOccurrence = Date.now();
    } else {
      // New alert or severity changed
      this.alerts.active.set(key, {
        ...alert,
        count: 1,
        firstOccurrence: Date.now(),
        lastOccurrence: Date.now()
      });
      
      // Send alert
      this.sendAlert(alert);
      
      // Check for escalation
      if (this.config.alerting.escalation) {
        this.checkEscalation(key, severity);
      }
      
      // Record in history
      this.alerts.history.push(alert);
      
      // Set cooldown
      this.setCooldown(key);
    }
  }

  /**
   * Send alert through configured channels
   */
  sendAlert(alert) {
    for (const channel of this.config.alerting.channels) {
      switch (channel) {
        case 'console':
          this.sendConsoleAlert(alert);
          break;
          
        case 'event':
          this.emit('alert', alert);
          break;
          
        case 'webhook':
          this.sendWebhookAlert(alert);
          break;
          
        case 'email':
          this.sendEmailAlert(alert);
          break;
      }
    }
  }

  /**
   * Send console alert
   */
  sendConsoleAlert(alert) {
    const severityColors = {
      critical: '\x1b[31m', // Red
      warning: '\x1b[33m',  // Yellow
      info: '\x1b[36m'      // Cyan
    };
    
    const color = severityColors[alert.severity] || '\x1b[37m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[ALERT] ${alert.severity.toUpperCase()}: ${alert.key}${reset}`);
    
    if (alert.data) {
      console.log(`  Resource: ${alert.data.resource}`);
      console.log(`  Value: ${alert.data.value?.toFixed(2)}%`);
      console.log(`  Threshold: ${alert.data.threshold}%`);
    }
  }

  /**
   * Send webhook alert (mock)
   */
  sendWebhookAlert(alert) {
    // Would send to configured webhook URL
    logger.info(`Webhook alert: ${alert.key} - ${alert.severity}`);
  }

  /**
   * Send email alert (mock)
   */
  sendEmailAlert(alert) {
    // Would send email through configured service
    logger.info(`Email alert: ${alert.key} - ${alert.severity}`);
  }

  /**
   * Clear an alert
   */
  clearAlert(key) {
    const alert = this.alerts.active.get(key);
    
    if (alert) {
      this.alerts.active.delete(key);
      
      this.emit('alert-cleared', {
        key,
        duration: Date.now() - alert.firstOccurrence
      });
    }
  }

  /**
   * Check if alert is in cooldown
   */
  isInCooldown(key) {
    const cooldown = this.alerts.cooldowns.get(key);
    
    if (cooldown && Date.now() < cooldown) {
      return true;
    }
    
    return false;
  }

  /**
   * Set cooldown for alert
   */
  setCooldown(key) {
    this.alerts.cooldowns.set(key, Date.now() + this.config.alerting.cooldown);
  }

  /**
   * Check for alert escalation
   */
  checkEscalation(key, severity) {
    const escalation = this.alerts.escalations.get(key) || {
      level: 0,
      lastEscalation: 0
    };
    
    const timeSinceLastEscalation = Date.now() - escalation.lastEscalation;
    
    if (severity === 'critical' && timeSinceLastEscalation > 600000) { // 10 minutes
      escalation.level++;
      escalation.lastEscalation = Date.now();
      
      this.alerts.escalations.set(key, escalation);
      
      this.emit('alert-escalated', {
        key,
        level: escalation.level,
        severity
      });
      
      // Take escalation action
      this.handleEscalation(key, escalation.level);
    }
  }

  /**
   * Handle alert escalation
   */
  handleEscalation(key, level) {
    logger.warn(`Alert escalated: ${key} - Level ${level}`);
    
    // Level 1: Log and notify
    // Level 2: Attempt auto-remediation
    // Level 3: Emergency response
    
    if (level >= 2) {
      this.emit('emergency', {
        key,
        level,
        action: 'auto-remediation'
      });
    }
  }

  /**
   * Analyze metrics
   */
  analyze() {
    const analysis = {
      timestamp: Date.now(),
      health: this.calculateHealthScore(),
      trends: Object.fromEntries(this.resources.trends),
      anomalies: this.detectAnomalies(),
      predictions: this.generatePredictions(),
      recommendations: this.generateRecommendations()
    };
    
    this.emit('analysis', analysis);
    
    return analysis;
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore() {
    if (!this.resources.current) return 100;
    
    let score = 100;
    
    // Deduct for resource usage
    score -= Math.max(0, this.resources.current.memory.heap.percentage - 50) * 0.5;
    score -= Math.max(0, this.resources.current.cpu.percentage - 50) * 0.3;
    score -= Math.max(0, this.resources.current.disk.percentage - 70) * 0.2;
    
    // Deduct for active alerts
    score -= this.alerts.active.size * 5;
    
    // Deduct for negative trends
    for (const [name, trend] of this.resources.trends) {
      if (trend.direction === 'increasing' && trend.rate > 10) {
        score -= 5;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect anomalies
   */
  detectAnomalies() {
    const anomalies = [];
    
    if (!this.resources.baseline || !this.resources.current) {
      return anomalies;
    }
    
    // Memory anomaly
    const memoryDev = Math.abs(
      this.resources.current.memory.heap.percentage - this.resources.baseline.memory.avg
    );
    
    if (memoryDev > this.resources.baseline.memory.std * 3) {
      anomalies.push({
        type: 'memory',
        severity: 'high',
        deviation: memoryDev
      });
    }
    
    // CPU anomaly
    const cpuDev = Math.abs(
      this.resources.current.cpu.percentage - this.resources.baseline.cpu.avg
    );
    
    if (cpuDev > this.resources.baseline.cpu.std * 3) {
      anomalies.push({
        type: 'cpu',
        severity: 'medium',
        deviation: cpuDev
      });
    }
    
    return anomalies;
  }

  /**
   * Generate predictions
   */
  generatePredictions() {
    const predictions = [];
    
    // Predict resource exhaustion
    for (const [name, trend] of this.resources.trends) {
      if (trend.direction === 'increasing' && trend.rate > 5) {
        const current = this.resources.current?.[name]?.percentage || 0;
        const timeToExhaustion = (100 - current) / trend.rate * this.config.interval;
        
        predictions.push({
          resource: name,
          event: 'exhaustion',
          timeframe: timeToExhaustion,
          confidence: Math.min(0.9, trend.values.length / 20)
        });
      }
    }
    
    return predictions;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (!this.resources.current) return recommendations;
    
    // Memory recommendations
    if (this.resources.current.memory.heap.percentage > 70) {
      recommendations.push({
        resource: 'memory',
        action: 'increase heap size',
        priority: 'high',
        impact: 'performance'
      });
    }
    
    // Cache recommendations
    const cacheHitRate = this.metrics.cache[this.metrics.cache.length - 1]?.hitRate || 0;
    if (cacheHitRate < 50) {
      recommendations.push({
        resource: 'cache',
        action: 'optimize cache strategy',
        priority: 'medium',
        impact: 'performance'
      });
    }
    
    return recommendations;
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const cutoff = Date.now() - this.config.retention;
    
    // Clean metrics
    for (const key of Object.keys(this.metrics)) {
      if (Array.isArray(this.metrics[key])) {
        this.metrics[key] = this.metrics[key].filter(m => 
          m.timestamp > cutoff
        );
      }
    }
    
    // Clean alert history
    this.alerts.history = this.alerts.history.filter(a => 
      a.timestamp > cutoff
    );
    
    // Clean expired cooldowns
    for (const [key, time] of this.alerts.cooldowns) {
      if (Date.now() > time) {
        this.alerts.cooldowns.delete(key);
      }
    }
  }

  /**
   * Get dashboard data
   */
  getDashboard() {
    return {
      health: this.calculateHealthScore(),
      current: this.resources.current,
      baseline: this.resources.baseline,
      peak: this.resources.peak,
      trends: Object.fromEntries(this.resources.trends),
      alerts: {
        active: Array.from(this.alerts.active.values()),
        count: this.alerts.active.size
      },
      metrics: {
        memory: this.metrics.memory.slice(-20),
        cpu: this.metrics.cpu.slice(-20),
        disk: this.metrics.disk.slice(-20),
        cache: this.metrics.cache.slice(-20)
      }
    };
  }

  /**
   * Register custom metric
   */
  registerMetric(name, collector) {
    this.metrics.custom.set(name, {
      collector,
      values: []
    });
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.removeAllListeners();
  }
}

// Export singleton
module.exports = new ResourceMonitor();