/**
 * BUMBA Unified Monitoring System
 * Consolidated monitoring, metrics, and health checking
 * Generated: 2024-12-19
 */

const EventEmitter = require('events');
const os = require('os');
const process = require('process');

/**
 * Main Monitoring System
 */
class UnifiedMonitoringSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      interval: config.interval || 30000, // 30 seconds
      healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
      metricsRetention: config.metricsRetention || 3600000, // 1 hour
      costTracking: config.costTracking !== false,
      resourceTracking: config.resourceTracking !== false,
      performanceTracking: config.performanceTracking !== false,
      ...config
    };
    
    this.metrics = {
      performance: [],
      resources: [],
      health: [],
      costs: [],
      custom: new Map()
    };
    
    this.status = {
      healthy: true,
      uptime: 0,
      startTime: Date.now(),
      lastCheck: null
    };
    
    this.thresholds = {
      cpu: config.cpuThreshold || 80,
      memory: config.memoryThreshold || 80,
      responseTime: config.responseTimeThreshold || 1000,
      errorRate: config.errorRateThreshold || 5
    };
    
    this.intervals = {};
    this.monitors = new Map();
    
    if (this.config.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialize monitoring
   */
  initialize() {
    // Start resource monitoring
    if (this.config.resourceTracking) {
      this.startResourceMonitoring();
    }
    
    // Start health checks
    if (this.config.healthCheckInterval > 0) {
      this.startHealthChecks();
    }
    
    // Start performance monitoring
    if (this.config.performanceTracking) {
      this.startPerformanceMonitoring();
    }
    
    // Start cost tracking
    if (this.config.costTracking) {
      this.initializeCostTracking();
    }
    
    this.emit('monitoring:initialized');
  }
  
  /**
   * Resource Monitoring
   */
  startResourceMonitoring() {
    this.intervals.resources = setInterval(() => {
      const resources = this.collectResourceMetrics();
      this.recordMetric('resources', resources);
      
      // Check thresholds
      if (resources.cpu > this.thresholds.cpu) {
        this.emit('alert:cpu', resources.cpu);
      }
      
      if (resources.memoryPercent > this.thresholds.memory) {
        this.emit('alert:memory', resources.memoryPercent);
      }
    }, this.config.interval);
  }
  
  collectResourceMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    
    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;
    
    return {
      timestamp: Date.now(),
      cpu: Math.round(cpuUsage),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      memoryPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      system: {
        totalMemory: totalMem,
        freeMemory: freeMem,
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      }
    };
  }
  
  /**
   * Health Checks
   */
  startHealthChecks() {
    this.intervals.health = setInterval(async () => {
      const health = await this.performHealthCheck();
      this.recordMetric('health', health);
      
      if (!health.healthy) {
        this.emit('health:unhealthy', health);
      }
      
      this.status.lastCheck = Date.now();
      this.status.healthy = health.healthy;
    }, this.config.healthCheckInterval);
  }
  
  async performHealthCheck() {
    const checks = {
      timestamp: Date.now(),
      healthy: true,
      checks: {}
    };
    
    // Memory check
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    checks.checks.memory = {
      status: memPercent < this.thresholds.memory ? 'healthy' : 'warning',
      value: Math.round(memPercent),
      threshold: this.thresholds.memory
    };
    
    // CPU check
    const cpuUsage = await this.getCPUUsage();
    checks.checks.cpu = {
      status: cpuUsage < this.thresholds.cpu ? 'healthy' : 'warning',
      value: Math.round(cpuUsage),
      threshold: this.thresholds.cpu
    };
    
    // Event loop check
    const eventLoopLag = await this.measureEventLoopLag();
    checks.checks.eventLoop = {
      status: eventLoopLag < 100 ? 'healthy' : 'warning',
      value: eventLoopLag,
      threshold: 100
    };
    
    // Custom health checks
    for (const [name, monitor] of this.monitors) {
      if (monitor.healthCheck) {
        try {
          checks.checks[name] = await monitor.healthCheck();
        } catch (error) {
          checks.checks[name] = {
            status: 'error',
            error: error.message
          };
        }
      }
    }
    
    // Determine overall health
    checks.healthy = Object.values(checks.checks).every(
      check => check.status === 'healthy'
    );
    
    return checks;
  }
  
  async getCPUUsage() {
    const startUsage = process.cpuUsage();
    
    return new Promise(resolve => {
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = (endUsage.user + endUsage.system) / 1000;
        resolve(totalUsage);
      }, 100);
    });
  }
  
  async measureEventLoopLag() {
    const start = Date.now();
    
    return new Promise(resolve => {
      setImmediate(() => {
        resolve(Date.now() - start);
      });
    });
  }
  
  /**
   * Performance Monitoring
   */
  startPerformanceMonitoring() {
    // Track garbage collection
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = (...args) => {
        const start = Date.now();
        originalGC.apply(global, args);
        const duration = Date.now() - start;
        
        this.recordMetric('performance', {
          type: 'gc',
          duration,
          timestamp: Date.now()
        });
      };
    }
    
    // Performance observer for operations
    this.performanceObserver = {
      marks: new Map(),
      measures: []
    };
  }
  
  /**
   * Mark performance start
   */
  markStart(label) {
    this.performanceObserver.marks.set(label, Date.now());
  }
  
  /**
   * Mark performance end and measure
   */
  markEnd(label, metadata = {}) {
    const start = this.performanceObserver.marks.get(label);
    
    if (!start) {
      return null;
    }
    
    const duration = Date.now() - start;
    
    const measure = {
      label,
      duration,
      timestamp: Date.now(),
      ...metadata
    };
    
    this.performanceObserver.measures.push(measure);
    this.performanceObserver.marks.delete(label);
    
    this.recordMetric('performance', measure);
    
    // Check threshold
    if (duration > this.thresholds.responseTime) {
      this.emit('performance:slow', measure);
    }
    
    return measure;
  }
  
  /**
   * Cost Tracking
   */
  initializeCostTracking() {
    this.costTracker = {
      models: new Map(),
      totals: {
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    };
    
    // Model pricing (example rates)
    this.pricing = {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };
  }
  
  /**
   * Track API usage costs
   */
  trackUsage(model, tokens, type = 'input') {
    if (!this.config.costTracking) return;
    
    const pricing = this.pricing[model];
    if (!pricing) return;
    
    const cost = (tokens / 1000) * pricing[type];
    
    const usage = {
      model,
      tokens,
      type,
      cost,
      timestamp: Date.now()
    };
    
    this.recordMetric('costs', usage);
    
    // Update totals
    if (!this.costTracker.models.has(model)) {
      this.costTracker.models.set(model, {
        totalTokens: 0,
        totalCost: 0
      });
    }
    
    const modelStats = this.costTracker.models.get(model);
    modelStats.totalTokens += tokens;
    modelStats.totalCost += cost;
    
    this.costTracker.totals.daily += cost;
    
    // Emit cost alert if threshold exceeded
    if (this.config.costAlertThreshold && 
        this.costTracker.totals.daily > this.config.costAlertThreshold) {
      this.emit('cost:alert', {
        daily: this.costTracker.totals.daily,
        threshold: this.config.costAlertThreshold
      });
    }
    
    return usage;
  }
  
  /**
   * Record a metric
   */
  recordMetric(type, data) {
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }
    
    this.metrics[type].push(data);
    
    // Cleanup old metrics
    const cutoff = Date.now() - this.config.metricsRetention;
    this.metrics[type] = this.metrics[type].filter(
      m => (m.timestamp || 0) > cutoff
    );
    
    this.emit(`metric:${type}`, data);
  }
  
  /**
   * Register a custom monitor
   */
  registerMonitor(name, monitor) {
    this.monitors.set(name, monitor);
    
    if (monitor.interval) {
      this.intervals[name] = setInterval(async () => {
        try {
          const data = await monitor.collect();
          this.recordMetric('custom', { name, ...data });
        } catch (error) {
          console.error(`[Monitor] ${name} error:`, error);
        }
      }, monitor.interval);
    }
  }
  
  /**
   * Get dashboard data
   */
  getDashboard() {
    const now = Date.now();
    const uptime = now - this.status.startTime;
    
    return {
      status: this.status,
      uptime: {
        milliseconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      resources: this.getLatestMetric('resources'),
      health: this.getLatestMetric('health'),
      performance: {
        recent: this.metrics.performance.slice(-10),
        averageResponseTime: this.calculateAverageResponseTime()
      },
      costs: this.config.costTracking ? {
        totals: this.costTracker.totals,
        byModel: Array.from(this.costTracker.models.entries()).map(
          ([model, stats]) => ({ model, ...stats })
        )
      } : null,
      alerts: this.getActiveAlerts()
    };
  }
  
  /**
   * Get latest metric
   */
  getLatestMetric(type) {
    const metrics = this.metrics[type];
    return metrics && metrics.length > 0 ? 
           metrics[metrics.length - 1] : null;
  }
  
  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const measures = this.performanceObserver?.measures || [];
    
    if (measures.length === 0) return 0;
    
    const total = measures.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / measures.length);
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const alerts = [];
    const latest = this.getLatestMetric('resources');
    
    if (latest) {
      if (latest.cpu > this.thresholds.cpu) {
        alerts.push({
          type: 'cpu',
          severity: 'warning',
          message: `CPU usage ${latest.cpu}% exceeds threshold ${this.thresholds.cpu}%`
        });
      }
      
      if (latest.memoryPercent > this.thresholds.memory) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `Memory usage ${latest.memoryPercent}% exceeds threshold ${this.thresholds.memory}%`
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Export metrics
   */
  exportMetrics(type = null) {
    if (type) {
      return this.metrics[type] || [];
    }
    
    return {
      ...this.metrics,
      custom: Array.from(this.metrics.custom.entries())
    };
  }
  
  /**
   * Clear metrics
   */
  clearMetrics(type = null) {
    if (type) {
      if (this.metrics[type]) {
        this.metrics[type] = [];
      }
    } else {
      Object.keys(this.metrics).forEach(key => {
        if (Array.isArray(this.metrics[key])) {
          this.metrics[key] = [];
        }
      });
      this.metrics.custom.clear();
    }
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    Object.values(this.intervals).forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals = {};
    this.emit('monitoring:stopped');
  }
  
  /**
   * Restart monitoring
   */
  restart() {
    this.stop();
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  // Additional methods for audit compatibility
  startMonitoring() {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.initialize();
    }
    
    this.emit('monitoring:started', {
      timestamp: new Date().toISOString(),
      config: this.config
    });
    
    return { status: 'started' };
  }

  stopMonitoring() {
    this.stop();
    this.config.enabled = false;
    
    this.emit('monitoring:stopped', {
      timestamp: new Date().toISOString()
    });
    
    return { status: 'stopped' };
  }

  getMetrics(type = null) {
    if (type && this.metrics[type]) {
      return this.metrics[type];
    }
    
    // Return all metrics with summary
    const now = Date.now();
    const uptime = now - this.status.startTime;
    
    return {
      uptime: uptime,
      status: this.status,
      performance: this.metrics.performance.slice(-100), // Last 100 entries
      resources: this.metrics.resources.slice(-100),
      health: this.metrics.health.slice(-100),
      costs: this.metrics.costs.slice(-100),
      custom: Array.from(this.metrics.custom.entries()),
      summary: this.getSummary()
    };
  }

  getHealthStatus() {
    const health = this.status.healthy;
    const lastCheck = this.status.lastCheck;
    const uptime = Date.now() - this.status.startTime;
    
    // Get latest resource metrics
    const latestResource = this.metrics.resources[this.metrics.resources.length - 1] || {};
    
    // Get error rate from performance metrics
    const recentPerformance = this.metrics.performance.slice(-10);
    const errorCount = recentPerformance.filter(p => p.error).length;
    const errorRate = recentPerformance.length > 0 
      ? (errorCount / recentPerformance.length) * 100 
      : 0;
    
    return {
      healthy: health,
      uptime: uptime,
      lastCheck: lastCheck,
      checks: {
        cpu: {
          value: latestResource.cpu || 0,
          threshold: this.thresholds.cpu,
          healthy: (latestResource.cpu || 0) < this.thresholds.cpu
        },
        memory: {
          value: latestResource.memoryPercent || 0,
          threshold: this.thresholds.memory,
          healthy: (latestResource.memoryPercent || 0) < this.thresholds.memory
        },
        errorRate: {
          value: errorRate,
          threshold: this.thresholds.errorRate,
          healthy: errorRate < this.thresholds.errorRate
        }
      },
      monitors: Array.from(this.monitors.keys())
    };
  }

  setAlerts(alerts = {}) {
    // Configure alert thresholds
    if (alerts.cpu !== undefined) {
      this.thresholds.cpu = alerts.cpu;
    }
    if (alerts.memory !== undefined) {
      this.thresholds.memory = alerts.memory;
    }
    if (alerts.responseTime !== undefined) {
      this.thresholds.responseTime = alerts.responseTime;
    }
    if (alerts.errorRate !== undefined) {
      this.thresholds.errorRate = alerts.errorRate;
    }
    
    // Set alert handlers
    if (alerts.onAlert && typeof alerts.onAlert === 'function') {
      this.removeAllListeners('alert');
      this.on('alert', alerts.onAlert);
    }
    
    if (alerts.onHealthChange && typeof alerts.onHealthChange === 'function') {
      this.removeAllListeners('health:changed');
      this.on('health:changed', alerts.onHealthChange);
    }
    
    this.emit('alerts:configured', {
      thresholds: this.thresholds,
      hasHandlers: {
        onAlert: this.listenerCount('alert') > 0,
        onHealthChange: this.listenerCount('health:changed') > 0
      }
    });
    
    return {
      configured: true,
      thresholds: this.thresholds
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create monitoring instance
 */
function getMonitoringSystem(config = {}) {
  if (!instance) {
    instance = new UnifiedMonitoringSystem(config);
  }
  return instance;
}

/**
 * Performance decorator
 */
function monitored(label = null) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const monitoring = getMonitoringSystem();
      const metricLabel = label || `${target.constructor.name}.${propertyKey}`;
      
      monitoring.markStart(metricLabel);
      
      try {
        const result = await originalMethod.apply(this, args);
        
        monitoring.markEnd(metricLabel, {
          success: true,
          args: args.length
        });
        
        return result;
      } catch (error) {
        monitoring.markEnd(metricLabel, {
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Export everything
module.exports = {
  UnifiedMonitoringSystem,
  getMonitoringSystem,
  monitored,
  
  // Factory function
  createMonitoringSystem: (config) => new UnifiedMonitoringSystem(config)
};