/**
 * BUMBA Dashboard Interfaces
 * Standard interfaces for all dashboard data sources
 * 
 * Day 5 Sprint 3: Define Interfaces
 */

/**
 * Base interface for all data sources
 */
class DataSourceInterface {
  constructor(name, type = 'generic') {
    this.name = name;
    this.type = type;
    this.connected = false;
    this.lastUpdate = null;
    this.errorCount = 0;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    throw new Error('connect() must be implemented by data source');
  }
  
  /**
   * Collect current metrics
   */
  async collect() {
    throw new Error('collect() must be implemented by data source');
  }
  
  /**
   * Transform data to standard format
   */
  transform(data) {
    throw new Error('transform() must be implemented by data source');
  }
  
  /**
   * Get source health status
   */
  getHealth() {
    return {
      name: this.name,
      connected: this.connected,
      lastUpdate: this.lastUpdate,
      errorCount: this.errorCount,
      status: this.errorCount > 5 ? 'unhealthy' : 'healthy'
    };
  }
}

/**
 * Standard metric types
 */
const MetricTypes = {
  COUNTER: 'counter',      // Incrementing value
  GAUGE: 'gauge',          // Current value
  HISTOGRAM: 'histogram',  // Distribution
  RATE: 'rate',           // Change over time
  PERCENTAGE: 'percentage', // 0-100 value
  STATUS: 'status',        // State indicator
  LIST: 'list',           // Array of items
  MAP: 'map'              // Key-value pairs
};

/**
 * Standard metric format
 */
class Metric {
  constructor(name, value, type = MetricTypes.GAUGE, metadata = {}) {
    this.name = name;
    this.value = value;
    this.type = type;
    this.timestamp = Date.now();
    this.metadata = {
      unit: metadata.unit || null,
      description: metadata.description || null,
      category: metadata.category || null,
      severity: metadata.severity || 'info',
      ...metadata
    };
  }
  
  /**
   * Format for display
   */
  format() {
    switch (this.type) {
      case MetricTypes.PERCENTAGE:
        return `${this.value}%`;
      case MetricTypes.RATE:
        return `${this.value}/${this.metadata.unit || 's'}`;
      case MetricTypes.STATUS:
        return this.value ? '✅' : '❌';
      default:
        return String(this.value);
    }
  }
  
  /**
   * Convert to chart data point
   */
  toChartPoint() {
    return {
      x: this.timestamp,
      y: this.value,
      label: this.name
    };
  }
}

/**
 * Metric collection interface
 */
class MetricCollection {
  constructor(category) {
    this.category = category;
    this.metrics = new Map();
    this.timestamp = Date.now();
  }
  
  /**
   * Add a metric
   */
  add(name, value, type = MetricTypes.GAUGE, metadata = {}) {
    const metric = new Metric(name, value, type, {
      ...metadata,
      category: this.category
    });
    this.metrics.set(name, metric);
    return metric;
  }
  
  /**
   * Add multiple metrics
   */
  addBatch(metrics) {
    Object.entries(metrics).forEach(([name, config]) => {
      if (typeof config === 'object' && config.value !== undefined) {
        this.add(name, config.value, config.type, config.metadata);
      } else {
        this.add(name, config);
      }
    });
  }
  
  /**
   * Get metric by name
   */
  get(name) {
    return this.metrics.get(name);
  }
  
  /**
   * Get all metrics
   */
  getAll() {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Convert to plain object
   */
  toObject() {
    const obj = {};
    this.metrics.forEach((metric, name) => {
      obj[name] = {
        value: metric.value,
        type: metric.type,
        formatted: metric.format(),
        metadata: metric.metadata
      };
    });
    return obj;
  }
  
  /**
   * Get metrics for charting
   */
  getChartData(metricNames = []) {
    const metrics = metricNames.length > 0 
      ? metricNames.map(name => this.metrics.get(name)).filter(Boolean)
      : this.getAll();
    
    return metrics.map(metric => metric.toChartPoint());
  }
}

/**
 * Data aggregation interface
 */
class DataAggregator {
  constructor() {
    this.sources = new Map();
    this.aggregated = {};
  }
  
  /**
   * Register a data source
   */
  register(name, source) {
    if (!(source instanceof DataSourceInterface)) {
      throw new Error('Source must implement DataSourceInterface');
    }
    this.sources.set(name, source);
  }
  
  /**
   * Collect from all sources
   */
  async collectAll() {
    const results = {};
    
    for (const [name, source] of this.sources) {
      try {
        const data = await source.collect();
        const transformed = source.transform(data);
        results[name] = transformed;
      } catch (error) {
        results[name] = {
          error: error.message,
          status: 'failed'
        };
      }
    }
    
    this.aggregated = results;
    return results;
  }
  
  /**
   * Merge all data into unified format
   */
  merge() {
    const unified = {
      timestamp: new Date().toISOString(),
      sources: {},
      metrics: {}
    };
    
    for (const [sourceName, data] of Object.entries(this.aggregated)) {
      if (data.error) {
        unified.sources[sourceName] = { status: 'error', error: data.error };
        continue;
      }
      
      unified.sources[sourceName] = { status: 'ok' };
      
      // Merge metrics
      if (data instanceof MetricCollection) {
        Object.assign(unified.metrics, data.toObject());
      } else if (typeof data === 'object') {
        Object.assign(unified.metrics, data);
      }
    }
    
    return unified;
  }
}

/**
 * Chart configuration interface
 */
class ChartConfig {
  constructor(type, title, options = {}) {
    this.type = type;
    this.title = title;
    this.options = {
      width: options.width || '100%',
      height: options.height || '200px',
      refreshInterval: options.refreshInterval || 5000,
      maxDataPoints: options.maxDataPoints || 50,
      ...options
    };
    this.dataSources = [];
  }
  
  /**
   * Add data source for chart
   */
  addDataSource(metricName, label, color) {
    this.dataSources.push({
      metric: metricName,
      label: label || metricName,
      color: color || '#FFD700'
    });
    return this;
  }
  
  /**
   * Generate chart HTML using component library
   */
  render(data) {
    // Will be implemented with component library
    return `<div class="chart-${this.type}">${this.title}</div>`;
  }
}

/**
 * Standard error handling
 */
class DashboardError extends Error {
  constructor(message, source, code = 'UNKNOWN') {
    super(message);
    this.name = 'DashboardError';
    this.source = source;
    this.code = code;
    this.timestamp = Date.now();
  }
}

/**
 * Health check interface
 */
class HealthCheckInterface {
  constructor() {
    this.checks = new Map();
  }
  
  /**
   * Register a health check
   */
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }
  
  /**
   * Run all health checks
   */
  async runAll() {
    const results = {};
    
    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = {
          healthy: false,
          error: error.message
        };
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      healthy: Object.values(results).every(r => r.healthy !== false),
      checks: results
    };
  }
}

module.exports = {
  DataSourceInterface,
  MetricTypes,
  Metric,
  MetricCollection,
  DataAggregator,
  ChartConfig,
  DashboardError,
  HealthCheckInterface
};