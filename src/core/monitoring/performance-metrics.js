/**
 * BUMBA Performance Metrics Module
 * Tracks and reports performance metrics across the framework
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class PerformanceMetrics extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.timers = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    
    // Performance thresholds
    this.thresholds = {
      startupTime: 2000, // 2 seconds
      commandExecutionTime: 5000, // 5 seconds
      agentSpawnTime: 1000, // 1 second
      memoryUsage: 500 * 1024 * 1024, // 500MB
      cpuUsage: 80 // 80%
    };

    // Start collecting metrics
    this.startCollection();
  }

  // Start a timer
  startTimer(name) {
    this.timers.set(name, Date.now());
    return () => this.endTimer(name);
  }

  // End a timer and record duration
  endTimer(name) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer ${name} was not started`);
      return null;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    
    this.recordMetric(name, duration, 'timer');
    this.emit('timer', { name, duration });
    
    return duration;
  }

  // Increment a counter
  incrementCounter(name, value = 1) {
    const current = this.counters.get(name) || 0;
    const newValue = current + value;
    this.counters.set(name, newValue);
    
    this.recordMetric(name, newValue, 'counter');
    this.emit('counter', { name, value: newValue });
    
    return newValue;
  }

  // Set a gauge value
  setGauge(name, value) {
    this.gauges.set(name, value);
    this.recordMetric(name, value, 'gauge');
    this.emit('gauge', { name, value });
    return value;
  }

  // Record a value in a histogram
  recordHistogram(name, value) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    
    const histogram = this.histograms.get(name);
    histogram.push(value);
    
    // Keep only last 1000 values
    if (histogram.length > 1000) {
      histogram.shift();
    }
    
    this.recordMetric(name, value, 'histogram');
    this.emit('histogram', { name, value });
    
    return this.calculateHistogramStats(name);
  }

  // Calculate histogram statistics
  calculateHistogramStats(name) {
    const values = this.histograms.get(name) || [];
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  // Record a metric
  recordMetric(name, value, type) {
    const metric = {
      name,
      value,
      type,
      timestamp: Date.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricHistory = this.metrics.get(name);
    metricHistory.push(metric);
    
    // Keep only last 100 entries
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    // Check thresholds
    this.checkThresholds(name, value, type);
  }

  // Check if metric exceeds thresholds
  checkThresholds(name, value, type) {
    const threshold = this.thresholds[name];
    if (threshold && value > threshold) {
      const warning = {
        name,
        value,
        threshold,
        type,
        exceeded: true
      };
      
      logger.warn(`Performance threshold exceeded: ${name} (${value} > ${threshold})`);
      this.emit('threshold-exceeded', warning);
    }
  }

  // Start collecting system metrics
  startCollection() {
    // Collect memory usage every 10 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.setGauge('memory.heapUsed', memUsage.heapUsed);
      this.setGauge('memory.heapTotal', memUsage.heapTotal);
      this.setGauge('memory.rss', memUsage.rss);
      this.setGauge('memory.external', memUsage.external);
    }, 10000);

    // Collect CPU usage every 5 seconds
    let lastCpuUsage = process.cpuUsage();
    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(lastCpuUsage);
      const totalUsage = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to seconds
      this.setGauge('cpu.usage', totalUsage);
      lastCpuUsage = process.cpuUsage();
    }, 5000);

    // Track uptime
    setInterval(() => {
      this.setGauge('process.uptime', process.uptime());
    }, 60000);
  }

  // Get all metrics
  getAllMetrics() {
    return {
      timers: Object.fromEntries(this.timers),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          this.calculateHistogramStats(name)
        ])
      ),
      metrics: Object.fromEntries(this.metrics)
    };
  }

  // Get specific metric
  getMetric(name) {
    return {
      current: this.gauges.get(name) || this.counters.get(name),
      history: this.metrics.get(name) || [],
      histogram: this.calculateHistogramStats(name)
    };
  }

  // Reset all metrics
  reset() {
    this.metrics.clear();
    this.timers.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    logger.info('Performance metrics reset');
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getAllMetrics();
    const report = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: {
        heapUsed: metrics.gauges['memory.heapUsed'],
        heapTotal: metrics.gauges['memory.heapTotal'],
        rss: metrics.gauges['memory.rss']
      },
      cpu: {
        usage: metrics.gauges['cpu.usage']
      },
      counters: metrics.counters,
      timers: metrics.timers,
      histograms: metrics.histograms
    };

    return report;
  }

  /**
   * Collect metrics from various sources
   */
  async collect(sources = []) {
    const collectedMetrics = {};
    
    // Collect from provided sources
    for (const source of sources) {
      if (typeof source === 'function') {
        const sourceMetrics = await source();
        Object.assign(collectedMetrics, sourceMetrics);
      } else if (typeof source === 'object') {
        Object.assign(collectedMetrics, source);
      }
    }
    
    // Record collected metrics
    for (const [name, value] of Object.entries(collectedMetrics)) {
      if (typeof value === 'number') {
        this.setGauge(name, value);
      }
    }
    
    return collectedMetrics;
  }

  /**
   * Record a metric value
   */
  record(name, value, type = 'gauge') {
    switch (type) {
      case 'counter':
        return this.incrementCounter(name, value);
      case 'gauge':
        return this.setGauge(name, value);
      case 'histogram':
        return this.recordHistogram(name, value);
      case 'timer':
        if (typeof value === 'number') {
          this.recordMetric(name, value, 'timer');
          return value;
        }
        break;
    }
    
    // Default to gauge
    return this.setGauge(name, value);
  }

  /**
   * Aggregate metrics over time
   */
  aggregate(metricName, aggregationType = 'avg', timeWindow = 60000) {
    const history = this.metrics.get(metricName) || [];
    const cutoff = Date.now() - timeWindow;
    const relevantMetrics = history.filter(m => m.timestamp >= cutoff);
    
    if (relevantMetrics.length === 0) {
      return null;
    }
    
    const values = relevantMetrics.map(m => m.value);
    
    switch (aggregationType) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
      case 'average':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'rate':
        // Calculate rate per second
        const duration = (relevantMetrics[relevantMetrics.length - 1].timestamp - relevantMetrics[0].timestamp) / 1000;
        return duration > 0 ? values.length / duration : 0;
      default:
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  /**
   * Get metrics (alias for getAllMetrics)
   */
  getMetrics(filter = null) {
    const allMetrics = this.getAllMetrics();
    
    if (!filter) {
      return allMetrics;
    }
    
    // Apply filter if provided
    const filtered = {};
    for (const [category, metrics] of Object.entries(allMetrics)) {
      filtered[category] = {};
      for (const [name, value] of Object.entries(metrics)) {
        if (typeof filter === 'function' && filter(name, value)) {
          filtered[category][name] = value;
        } else if (typeof filter === 'string' && name.includes(filter)) {
          filtered[category][name] = value;
        } else if (filter instanceof RegExp && filter.test(name)) {
          filtered[category][name] = value;
        }
      }
    }
    
    return filtered;
  }

  /**
   * Export metrics in various formats
   */
  export(format = 'json', options = {}) {
    const metrics = this.getAllMetrics();
    const report = this.generateReport();
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(report, null, options.pretty ? 2 : 0);
      
      case 'csv':
        // Export as CSV
        const rows = [];
        rows.push('Category,Name,Value,Timestamp');
        
        for (const [category, categoryMetrics] of Object.entries(metrics)) {
          if (typeof categoryMetrics === 'object') {
            for (const [name, value] of Object.entries(categoryMetrics)) {
              const val = typeof value === 'object' ? JSON.stringify(value) : value;
              rows.push(`${category},${name},${val},${Date.now()}`);
            }
          }
        }
        
        return rows.join('\n');
      
      case 'prometheus':
        // Export in Prometheus format
        const lines = [];
        
        // Counters
        for (const [name, value] of Object.entries(metrics.counters)) {
          const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_');
          lines.push(`# TYPE ${metricName} counter`);
          lines.push(`${metricName} ${value}`);
        }
        
        // Gauges
        for (const [name, value] of Object.entries(metrics.gauges)) {
          const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_');
          lines.push(`# TYPE ${metricName} gauge`);
          lines.push(`${metricName} ${value}`);
        }
        
        // Histograms
        for (const [name, stats] of Object.entries(metrics.histograms)) {
          if (stats) {
            const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_');
            lines.push(`# TYPE ${metricName} summary`);
            lines.push(`${metricName}_count ${stats.count}`);
            lines.push(`${metricName}_sum ${stats.count * stats.mean}`);
            lines.push(`${metricName}{quantile="0.5"} ${stats.median}`);
            lines.push(`${metricName}{quantile="0.95"} ${stats.p95}`);
            lines.push(`${metricName}{quantile="0.99"} ${stats.p99}`);
          }
        }
        
        return lines.join('\n');
      
      case 'html':
        // Export as HTML table
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Performance Metrics Report</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #4CAF50; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Performance Metrics Report</h1>
            <p>Generated: ${new Date(report.timestamp).toISOString()}</p>
            <p>Uptime: ${report.uptime.toFixed(2)} seconds</p>
            
            <h2>Memory</h2>
            <table>
              <tr><th>Metric</th><th>Value (MB)</th></tr>
              <tr><td>Heap Used</td><td>${(report.memory.heapUsed / 1024 / 1024).toFixed(2)}</td></tr>
              <tr><td>Heap Total</td><td>${(report.memory.heapTotal / 1024 / 1024).toFixed(2)}</td></tr>
              <tr><td>RSS</td><td>${(report.memory.rss / 1024 / 1024).toFixed(2)}</td></tr>
            </table>
            
            <h2>Counters</h2>
            <table>
              <tr><th>Name</th><th>Value</th></tr>
              ${Object.entries(report.counters).map(([name, value]) => 
                `<tr><td>${name}</td><td>${value}</td></tr>`
              ).join('')}
            </table>
          </body>
          </html>
        `;
        return html;
      
      default:
        return JSON.stringify(report);
    }
  }

  /**
   * Create histogram for tracking distributions
   */
  histogram(name, value = null) {
    if (value !== null) {
      return this.recordHistogram(name, value);
    }
    
    // Return histogram stats if no value provided
    return this.calculateHistogramStats(name);
  }
}

// Singleton instance
let instance;

function getInstance() {
  if (!instance) {
    instance = new PerformanceMetrics();
  }
  return instance;
}

module.exports = {
  PerformanceMetrics,
  getInstance,
  performanceMetrics: getInstance()
};