/**
 * BUMBA Performance Monitor
 * Tracks execution times, resource usage, and system performance
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      sampleInterval: config.sampleInterval || 5000, // 5 seconds
      metricsFile: config.metricsFile || path.join(process.cwd(), '.bumba-performance.json'),
      maxHistory: config.maxHistory || 100, // Keep last 100 samples
      alertThresholds: {
        cpu: config.cpuThreshold || 80, // 80% CPU
        memory: config.memoryThreshold || 512, // 512MB
        responseTime: config.responseTimeThreshold || 1000, // 1 second
        ...config.alertThresholds
      },
      ...config
    };
    
    // Performance metrics
    this.metrics = {
      cpu: [],
      memory: [],
      responseTime: [],
      throughput: [],
      errors: [],
      apiCalls: 0,
      totalExecutions: 0,
      averageExecutionTime: 0
    };
    
    // Operation tracking
    this.operations = new Map();
    this.apiCallLog = [];
    
    // Start monitoring
    this.startTime = Date.now();
    this.initialize();
  }
  
  /**
   * Initialize performance monitoring
   */
  async initialize() {
    // Load previous metrics
    await this.loadMetrics();
    
    // Start performance sampling
    this.startSampling();
    
    // Register process metrics
    this.registerProcessMetrics();
    
    logger.info('📊 Performance Monitor initialized');
  }
  
  /**
   * Start performance sampling
   */
  startSampling() {
    this.sampleInterval = setInterval(async () => {
      await this.collectSample();
    }, this.config.sampleInterval);
    
    // Initial sample
    this.collectSample();
  }
  
  /**
   * Collect performance sample
   */
  async collectSample() {
    const sample = {
      timestamp: Date.now(),
      cpu: this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      eventLoop: this.getEventLoopLag(),
      activeOperations: this.operations.size
    };
    
    // Add to metrics history
    this.addSample('cpu', sample.cpu);
    this.addSample('memory', sample.memory);
    
    // Check for alerts
    this.checkAlerts(sample);
    
    // Emit sample
    this.emit('performance:sample', sample);
    
    // Save metrics periodically
    if (this.metrics.cpu.length % 20 === 0) {
      await this.saveMetrics();
    }
    
    return sample;
  }
  
  /**
   * Add sample to metrics history
   */
  addSample(metric, value) {
    if (!this.metrics[metric]) {
      this.metrics[metric] = [];
    }
    
    this.metrics[metric].push({
      value,
      timestamp: Date.now()
    });
    
    // Trim history to max size
    if (this.metrics[metric].length > this.config.maxHistory) {
      this.metrics[metric].shift();
    }
  }
  
  /**
   * Get CPU usage percentage
   */
  getCPUUsage() {
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const elapsedTime = Date.now() - this.startTime;
    
    // Calculate percentage (rough estimate)
    return Math.min(100, (totalUsage / 1000 / elapsedTime) * 100);
  }
  
  /**
   * Get memory usage in MB
   */
  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    return Math.round(memUsage.heapUsed / 1024 / 1024);
  }
  
  /**
   * Get event loop lag (simulated)
   */
  getEventLoopLag() {
    const start = Date.now();
    setImmediate(() => {
      const lag = Date.now() - start;
      this.lastEventLoopLag = lag;
    });
    return this.lastEventLoopLag || 0;
  }
  
  /**
   * Start tracking an operation
   */
  startOperation(id, metadata = {}) {
    this.operations.set(id, {
      id,
      startTime: Date.now(),
      metadata
    });
    
    return id;
  }
  
  /**
   * End tracking an operation
   */
  endOperation(id, result = {}) {
    const operation = this.operations.get(id);
    
    if (!operation) {
      return null;
    }
    
    const duration = Date.now() - operation.startTime;
    
    this.operations.delete(id);
    
    // Track execution time
    this.addSample('responseTime', duration);
    
    // Update average
    this.metrics.totalExecutions++;
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + duration) 
      / this.metrics.totalExecutions;
    
    // Log if slow
    if (duration > this.config.alertThresholds.responseTime) {
      logger.warn(`Slow operation: ${id} took ${duration}ms`);
      this.emit('performance:slow', {
        id,
        duration,
        metadata: operation.metadata
      });
    }
    
    return {
      id,
      duration,
      ...result
    };
  }
  
  /**
   * Track API call
   */
  trackAPICall(provider, model, tokens = 0, cost = 0) {
    const call = {
      provider,
      model,
      tokens,
      cost,
      timestamp: Date.now()
    };
    
    this.apiCallLog.push(call);
    this.metrics.apiCalls++;
    
    // Trim log to last 100 calls
    if (this.apiCallLog.length > 100) {
      this.apiCallLog.shift();
    }
    
    this.emit('api:call', call);
    
    return call;
  }
  
  /**
   * Track error
   */
  trackError(error, context = {}) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };
    
    if (!this.metrics.errors) {
      this.metrics.errors = [];
    }
    
    this.metrics.errors.push(errorEntry);
    
    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }
    
    this.emit('performance:error', errorEntry);
  }
  
  /**
   * Check for performance alerts
   */
  checkAlerts(sample) {
    const alerts = [];
    
    // CPU alert
    if (sample.cpu > this.config.alertThresholds.cpu) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `High CPU usage: ${Math.round(sample.cpu)}%`,
        value: sample.cpu
      });
    }
    
    // Memory alert
    if (sample.memory > this.config.alertThresholds.memory) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `High memory usage: ${sample.memory}MB`,
        value: sample.memory
      });
    }
    
    // Event loop lag alert
    if (sample.eventLoop > 100) {
      alerts.push({
        type: 'eventLoop',
        level: 'warning',
        message: `Event loop lag: ${sample.eventLoop}ms`,
        value: sample.eventLoop
      });
    }
    
    if (alerts.length > 0) {
      this.emit('performance:alert', alerts);
    }
    
    return alerts;
  }
  
  /**
   * Register process metrics
   */
  registerProcessMetrics() {
    // Track uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.trackError(error, { type: 'uncaughtException' });
    });
    
    // Track unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.trackError(new Error(String(reason)), { type: 'unhandledRejection' });
    });
    
    // Track warnings
    process.on('warning', (warning) => {
      logger.warn('Process warning:', warning);
    });
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    const stats = {
      uptime: Date.now() - this.startTime,
      totalExecutions: this.metrics.totalExecutions,
      averageExecutionTime: Math.round(this.metrics.averageExecutionTime),
      apiCalls: this.metrics.apiCalls,
      errors: this.metrics.errors ? this.metrics.errors.length : 0,
      activeOperations: this.operations.size
    };
    
    // Calculate averages
    if (this.metrics.cpu.length > 0) {
      const cpuValues = this.metrics.cpu.map(s => s.value);
      stats.averageCPU = Math.round(
        cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length
      );
    }
    
    if (this.metrics.memory.length > 0) {
      const memValues = this.metrics.memory.map(s => s.value);
      stats.averageMemory = Math.round(
        memValues.reduce((a, b) => a + b, 0) / memValues.length
      );
    }
    
    if (this.metrics.responseTime && this.metrics.responseTime.length > 0) {
      const rtValues = this.metrics.responseTime.map(s => s.value);
      stats.averageResponseTime = Math.round(
        rtValues.reduce((a, b) => a + b, 0) / rtValues.length
      );
    }
    
    return stats;
  }
  
  /**
   * Get performance report
   */
  getReport() {
    const stats = this.getStats();
    
    return {
      summary: {
        status: this.getHealthStatus(stats),
        uptime: this.formatUptime(stats.uptime),
        executions: stats.totalExecutions,
        apiCalls: stats.apiCalls,
        errors: stats.errors
      },
      performance: {
        cpu: `${stats.averageCPU || 0}%`,
        memory: `${stats.averageMemory || 0}MB`,
        responseTime: `${stats.averageResponseTime || 0}ms`
      },
      current: {
        activeOperations: stats.activeOperations,
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage()
      }
    };
  }
  
  /**
   * Get health status based on stats
   */
  getHealthStatus(stats) {
    if (stats.errors > 10) return 'unhealthy';
    if (stats.averageCPU > 80) return 'degraded';
    if (stats.averageMemory > 512) return 'degraded';
    if (stats.averageResponseTime > 1000) return 'degraded';
    return 'healthy';
  }
  
  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  /**
   * Load metrics from file
   */
  async loadMetrics() {
    try {
      const data = await fs.readFile(this.config.metricsFile, 'utf-8');
      const saved = JSON.parse(data);
      
      // Only load recent metrics
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      
      for (const [key, samples] of Object.entries(saved)) {
        if (Array.isArray(samples)) {
          this.metrics[key] = samples.filter(s => s.timestamp > cutoff);
        } else {
          this.metrics[key] = samples;
        }
      }
    } catch (error) {
      // No previous metrics or error reading
    }
  }
  
  /**
   * Save metrics to file
   */
  async saveMetrics() {
    try {
      await fs.writeFile(
        this.config.metricsFile,
        JSON.stringify(this.metrics, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save performance metrics:', error);
    }
  }
  
  /**
   * Stop performance monitoring
   */
  stop() {
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
    
    // Save final metrics
    this.saveMetrics();
    
    logger.info('📊 Performance Monitor stopped');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  PerformanceMonitor,
  getInstance: (config) => {
    if (!instance) {
      instance = new PerformanceMonitor(config);
    }
    return instance;
  },
  
  // Convenience methods
  startOperation: (id, metadata) => {
    const monitor = module.exports.getInstance();
    return monitor.startOperation(id, metadata);
  },
  
  endOperation: (id, result) => {
    const monitor = module.exports.getInstance();
    return monitor.endOperation(id, result);
  },
  
  trackAPICall: (provider, model, tokens, cost) => {
    const monitor = module.exports.getInstance();
    return monitor.trackAPICall(provider, model, tokens, cost);
  },
  
  getStats: () => {
    const monitor = module.exports.getInstance();
    return monitor.getStats();
  }
};