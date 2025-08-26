/**
 * Metrics Collector
 * Comprehensive metrics collection and aggregation
 * Sprint 37-40 - Monitoring & Observability
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('../state/global-state-manager');
const { ComponentTimers } = require('../timers/timer-registry');

class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      flushInterval: options.flushInterval || 10000, // 10 seconds
      aggregationInterval: options.aggregationInterval || 60000, // 1 minute
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      maxMetricsPerType: options.maxMetricsPerType || 10000,
      enableHistograms: options.enableHistograms !== false,
      enablePercentiles: options.enablePercentiles !== false
    };
    
    // Metric types
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.meters = new Map();
    this.timers = new Map();
    
    // Aggregated metrics
    this.aggregated = new Map();
    this.timeSeries = new Map();
    
    // Component timers
    this.componentTimers = new ComponentTimers('metrics-collector');
    
    // Statistics
    this.stats = {
      metricsCollected: 0,
      metricsAggregated: 0,
      metricsFlushed: 0
    };
    
    // Start collection
    this.startCollection();
    
    // Register with state manager
    stateManager.register('metrics', {
      stats: this.stats,
      current: {}
    });
  }
  
  /**
   * Start metric collection
   */
  startCollection() {
    // Flush interval
    this.componentTimers.setInterval('flush', () => {
      this.flush();
    }, this.options.flushInterval);
    
    // Aggregation interval
    this.componentTimers.setInterval('aggregate', () => {
      this.aggregate();
    }, this.options.aggregationInterval);
    
    // Cleanup old data
    this.componentTimers.setInterval('cleanup', () => {
      this.cleanup();
    }, this.options.retentionPeriod / 10);
  }
  
  /**
   * Increment counter
   */
  increment(name, value = 1, tags = {}) {
    const key = this.getKey(name, tags);
    
    if (!this.counters.has(key)) {
      this.counters.set(key, {
        name,
        tags,
        value: 0,
        timestamps: []
      });
    }
    
    const counter = this.counters.get(key);
    counter.value += value;
    counter.timestamps.push(Date.now());
    
    this.stats.metricsCollected++;
    this.emit('metric:counter', { name, value, tags });
  }
  
  /**
   * Decrement counter
   */
  decrement(name, value = 1, tags = {}) {
    this.increment(name, -value, tags);
  }
  
  /**
   * Set gauge value
   */
  gauge(name, value, tags = {}) {
    const key = this.getKey(name, tags);
    
    if (!this.gauges.has(key)) {
      this.gauges.set(key, {
        name,
        tags,
        values: [],
        timestamps: []
      });
    }
    
    const gauge = this.gauges.get(key);
    const now = Date.now();
    
    gauge.values.push(value);
    gauge.timestamps.push(now);
    gauge.current = value;
    
    // Limit history
    if (gauge.values.length > this.options.maxMetricsPerType) {
      gauge.values.shift();
      gauge.timestamps.shift();
    }
    
    this.stats.metricsCollected++;
    this.emit('metric:gauge', { name, value, tags });
  }
  
  /**
   * Record histogram value
   */
  histogram(name, value, tags = {}) {
    const key = this.getKey(name, tags);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        name,
        tags,
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity
      });
    }
    
    const hist = this.histograms.get(key);
    
    hist.values.push(value);
    hist.count++;
    hist.sum += value;
    hist.min = Math.min(hist.min, value);
    hist.max = Math.max(hist.max, value);
    
    // Limit size
    if (hist.values.length > this.options.maxMetricsPerType) {
      const removed = hist.values.shift();
      hist.sum -= removed;
    }
    
    this.stats.metricsCollected++;
    this.emit('metric:histogram', { name, value, tags });
  }
  
  /**
   * Mark meter event
   */
  mark(name, count = 1, tags = {}) {
    const key = this.getKey(name, tags);
    
    if (!this.meters.has(key)) {
      this.meters.set(key, {
        name,
        tags,
        count: 0,
        startTime: Date.now(),
        marks: []
      });
    }
    
    const meter = this.meters.get(key);
    meter.count += count;
    meter.marks.push({
      count,
      timestamp: Date.now()
    });
    
    // Calculate rates
    const elapsed = Date.now() - meter.startTime;
    meter.meanRate = meter.count / (elapsed / 1000);
    
    // Calculate recent rates
    const recentWindow = 60000; // 1 minute
    const recentMarks = meter.marks.filter(m => 
      m.timestamp > Date.now() - recentWindow
    );
    
    meter.oneMinuteRate = recentMarks.reduce((sum, m) => sum + m.count, 0) / 60;
    
    this.stats.metricsCollected++;
    this.emit('metric:meter', { name, count, tags });
  }
  
  /**
   * Start timer
   */
  startTimer(name, tags = {}) {
    const key = this.getKey(name, tags);
    const startTime = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.recordTimer(name, duration, tags);
        return duration;
      }
    };
  }
  
  /**
   * Record timer duration
   */
  recordTimer(name, duration, tags = {}) {
    const key = this.getKey(name, tags);
    
    if (!this.timers.has(key)) {
      this.timers.set(key, {
        name,
        tags,
        durations: [],
        count: 0,
        totalTime: 0
      });
    }
    
    const timer = this.timers.get(key);
    
    timer.durations.push(duration);
    timer.count++;
    timer.totalTime += duration;
    
    // Limit size
    if (timer.durations.length > this.options.maxMetricsPerType) {
      const removed = timer.durations.shift();
      timer.totalTime -= removed;
    }
    
    this.stats.metricsCollected++;
    this.emit('metric:timer', { name, duration, tags });
    
    // Also record as histogram for percentiles
    if (this.options.enableHistograms) {
      this.histogram(`${name}.duration`, duration, tags);
    }
  }
  
  /**
   * Calculate percentiles
   */
  calculatePercentiles(values, percentiles = [50, 75, 90, 95, 99]) {
    if (values.length === 0) return {};
    
    const sorted = [...values].sort((a, b) => a - b);
    const result = {};
    
    for (const p of percentiles) {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      result[`p${p}`] = sorted[Math.max(0, index)];
    }
    
    return result;
  }
  
  /**
   * Aggregate metrics
   */
  aggregate() {
    const now = Date.now();
    
    // Aggregate counters
    for (const [key, counter] of this.counters) {
      const aggregated = {
        type: 'counter',
        name: counter.name,
        tags: counter.tags,
        value: counter.value,
        rate: counter.value / ((now - counter.timestamps[0]) / 1000),
        timestamp: now
      };
      
      this.storeAggregated(key, aggregated);
    }
    
    // Aggregate gauges
    for (const [key, gauge] of this.gauges) {
      if (gauge.values.length === 0) continue;
      
      const aggregated = {
        type: 'gauge',
        name: gauge.name,
        tags: gauge.tags,
        current: gauge.current,
        average: gauge.values.reduce((sum, v) => sum + v, 0) / gauge.values.length,
        min: Math.min(...gauge.values),
        max: Math.max(...gauge.values),
        timestamp: now
      };
      
      this.storeAggregated(key, aggregated);
    }
    
    // Aggregate histograms
    for (const [key, hist] of this.histograms) {
      if (hist.values.length === 0) continue;
      
      const aggregated = {
        type: 'histogram',
        name: hist.name,
        tags: hist.tags,
        count: hist.count,
        sum: hist.sum,
        average: hist.sum / hist.count,
        min: hist.min,
        max: hist.max,
        timestamp: now
      };
      
      if (this.options.enablePercentiles) {
        aggregated.percentiles = this.calculatePercentiles(hist.values);
      }
      
      this.storeAggregated(key, aggregated);
    }
    
    // Aggregate meters
    for (const [key, meter] of this.meters) {
      const aggregated = {
        type: 'meter',
        name: meter.name,
        tags: meter.tags,
        count: meter.count,
        meanRate: meter.meanRate,
        oneMinuteRate: meter.oneMinuteRate,
        timestamp: now
      };
      
      this.storeAggregated(key, aggregated);
    }
    
    // Aggregate timers
    for (const [key, timer] of this.timers) {
      if (timer.durations.length === 0) continue;
      
      const aggregated = {
        type: 'timer',
        name: timer.name,
        tags: timer.tags,
        count: timer.count,
        totalTime: timer.totalTime,
        averageTime: timer.totalTime / timer.count,
        minTime: Math.min(...timer.durations),
        maxTime: Math.max(...timer.durations),
        timestamp: now
      };
      
      if (this.options.enablePercentiles) {
        aggregated.percentiles = this.calculatePercentiles(timer.durations);
      }
      
      this.storeAggregated(key, aggregated);
    }
    
    this.stats.metricsAggregated++;
    this.emit('metrics:aggregated', { count: this.aggregated.size });
  }
  
  /**
   * Store aggregated metric
   */
  storeAggregated(key, metric) {
    // Store in aggregated map
    this.aggregated.set(key, metric);
    
    // Store in time series
    if (!this.timeSeries.has(key)) {
      this.timeSeries.set(key, []);
    }
    
    const series = this.timeSeries.get(key);
    series.push(metric);
    
    // Limit time series length
    const maxPoints = 1440; // 24 hours of minute data
    if (series.length > maxPoints) {
      series.shift();
    }
  }
  
  /**
   * Flush metrics
   */
  flush() {
    const metrics = this.getSnapshot();
    
    this.emit('metrics:flush', metrics);
    this.stats.metricsFlushed++;
    
    // Clear raw data after flush
    this.clearRawData();
  }
  
  /**
   * Get metrics snapshot
   */
  getSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      counters: {},
      gauges: {},
      histograms: {},
      meters: {},
      timers: {}
    };
    
    // Include aggregated metrics
    for (const [key, metric] of this.aggregated) {
      const category = `${metric.type}s`;
      snapshot[category][key] = metric;
    }
    
    return snapshot;
  }
  
  /**
   * Get time series data
   */
  getTimeSeries(name, tags = {}, duration = 3600000) {
    const key = this.getKey(name, tags);
    const series = this.timeSeries.get(key);
    
    if (!series) return [];
    
    const cutoff = Date.now() - duration;
    return series.filter(point => point.timestamp > cutoff);
  }
  
  /**
   * Clear raw data
   */
  clearRawData() {
    // Clear counter timestamps
    for (const counter of this.counters.values()) {
      counter.timestamps = [];
    }
    
    // Clear old gauge values
    for (const gauge of this.gauges.values()) {
      gauge.values = gauge.values.slice(-100);
      gauge.timestamps = gauge.timestamps.slice(-100);
    }
    
    // Clear histogram values
    for (const hist of this.histograms.values()) {
      hist.values = [];
    }
    
    // Clear old meter marks
    for (const meter of this.meters.values()) {
      const cutoff = Date.now() - 300000; // Keep 5 minutes
      meter.marks = meter.marks.filter(m => m.timestamp > cutoff);
    }
    
    // Clear timer durations
    for (const timer of this.timers.values()) {
      timer.durations = [];
    }
  }
  
  /**
   * Clean up old data
   */
  cleanup() {
    const cutoff = Date.now() - this.options.retentionPeriod;
    
    // Clean time series
    for (const [key, series] of this.timeSeries) {
      const filtered = series.filter(point => point.timestamp > cutoff);
      
      if (filtered.length === 0) {
        this.timeSeries.delete(key);
      } else {
        this.timeSeries.set(key, filtered);
      }
    }
  }
  
  /**
   * Generate key from name and tags
   */
  getKey(name, tags) {
    if (Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }
  
  /**
   * Get metrics report
   */
  getReport() {
    const snapshot = this.getSnapshot();
    
    return {
      summary: {
        counters: Object.keys(snapshot.counters).length,
        gauges: Object.keys(snapshot.gauges).length,
        histograms: Object.keys(snapshot.histograms).length,
        meters: Object.keys(snapshot.meters).length,
        timers: Object.keys(snapshot.timers).length,
        total: this.stats.metricsCollected
      },
      topMetrics: {
        counters: this.getTopMetrics(snapshot.counters, 'value'),
        gauges: this.getTopMetrics(snapshot.gauges, 'current'),
        timers: this.getTopMetrics(snapshot.timers, 'averageTime')
      },
      stats: this.stats
    };
  }
  
  /**
   * Get top metrics by value
   */
  getTopMetrics(metrics, field, limit = 5) {
    return Object.entries(metrics)
      .sort(([, a], [, b]) => (b[field] || 0) - (a[field] || 0))
      .slice(0, limit)
      .map(([key, metric]) => ({
        name: metric.name,
        value: metric[field],
        tags: metric.tags
      }));
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.meters.clear();
    this.timers.clear();
    this.aggregated.clear();
    this.timeSeries.clear();
    
    this.stats = {
      metricsCollected: 0,
      metricsAggregated: 0,
      metricsFlushed: 0
    };
  }
  
  /**
   * Stop collection
   */
  stop() {
    this.componentTimers.clearAll();
    this.removeAllListeners();
  }
}

// Singleton instance
let instance = null;

function getMetricsCollector(options) {
  if (!instance) {
    instance = new MetricsCollector(options);
  }
  return instance;
}

module.exports = {
  MetricsCollector,
  getMetricsCollector,
  metrics: getMetricsCollector(),
  
  // Helper functions
  increment: (name, value, tags) => getMetricsCollector().increment(name, value, tags),
  gauge: (name, value, tags) => getMetricsCollector().gauge(name, value, tags),
  histogram: (name, value, tags) => getMetricsCollector().histogram(name, value, tags),
  mark: (name, count, tags) => getMetricsCollector().mark(name, count, tags),
  timer: (name, tags) => getMetricsCollector().startTimer(name, tags)
};