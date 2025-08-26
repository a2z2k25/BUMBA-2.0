/**
 * BUMBA Dashboard Real-time Monitor
 * Live monitoring and streaming capabilities for coordination
 * Part of Coordination Dashboard enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Real-time monitoring system for coordination dashboard
 */
class DashboardRealtimeMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      bufferSize: config.bufferSize || 1000,
      streamInterval: config.streamInterval || 100, // 100ms
      aggregationWindow: config.aggregationWindow || 60000, // 1 minute
      metricsRetention: config.metricsRetention || 3600000, // 1 hour
      ...config
    };
    
    // Real-time buffers
    this.buffers = {
      events: [],
      metrics: [],
      operations: [],
      conflicts: []
    };
    
    // Streaming state
    this.streaming = {
      active: false,
      subscribers: new Map(),
      channels: new Set(['events', 'metrics', 'alerts', 'insights'])
    };
    
    // Aggregated metrics
    this.aggregated = {
      throughput: { current: 0, peak: 0, average: 0 },
      latency: { current: 0, min: Infinity, max: 0, average: 0 },
      concurrency: { current: 0, peak: 0, average: 0 },
      errorRate: { current: 0, total: 0 }
    };
    
    // Time series data
    this.timeSeries = {
      resolution: 1000, // 1 second
      data: new Map(),
      maxPoints: 3600 // 1 hour at 1 second resolution
    };
    
    // Performance tracking
    this.performance = {
      eventCount: 0,
      bytesProcessed: 0,
      startTime: Date.now()
    };
    
    this.initialize();
  }
  
  /**
   * Initialize real-time monitor
   */
  initialize() {
    // Start aggregation
    this.startAggregation();
    
    // Start time series collection
    this.startTimeSeries();
    
    logger.info('📡 Real-time monitor initialized');
  }
  
  /**
   * Track event in real-time
   */
  trackEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateEventId()
    };
    
    // Add to buffer
    this.buffers.events.push(event);
    this.maintainBufferSize('events');
    
    // Update metrics
    this.updateMetrics(event);
    
    // Stream to subscribers
    this.streamToSubscribers('events', event);
    
    // Update performance
    this.performance.eventCount++;
    this.performance.bytesProcessed += JSON.stringify(event).length;
    
    return event.id;
  }
  
  /**
   * Track metric in real-time
   */
  trackMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };
    
    // Add to buffer
    this.buffers.metrics.push(metric);
    this.maintainBufferSize('metrics');
    
    // Update aggregated metrics
    this.updateAggregated(name, value);
    
    // Add to time series
    this.addToTimeSeries(name, value);
    
    // Stream to subscribers
    this.streamToSubscribers('metrics', metric);
    
    return metric;
  }
  
  /**
   * Track operation
   */
  trackOperation(operation, duration, success = true) {
    const op = {
      operation,
      duration,
      success,
      timestamp: Date.now()
    };
    
    // Add to buffer
    this.buffers.operations.push(op);
    this.maintainBufferSize('operations');
    
    // Update latency metrics
    this.updateLatency(duration);
    
    // Update error rate if failed
    if (!success) {
      this.aggregated.errorRate.current++;
      this.aggregated.errorRate.total++;
    }
    
    return op;
  }
  
  /**
   * Track conflict
   */
  trackConflict(agents, resource, resolved = false) {
    const conflict = {
      agents,
      resource,
      resolved,
      timestamp: Date.now(),
      duration: resolved ? Date.now() - this.findConflictStart(agents, resource) : null
    };
    
    // Add to buffer
    this.buffers.conflicts.push(conflict);
    this.maintainBufferSize('conflicts');
    
    // Stream alert if not resolved
    if (!resolved) {
      this.streamToSubscribers('alerts', {
        type: 'conflict',
        severity: 'warning',
        data: conflict
      });
    }
    
    return conflict;
  }
  
  /**
   * Get real-time snapshot
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      buffers: {
        events: this.buffers.events.length,
        metrics: this.buffers.metrics.length,
        operations: this.buffers.operations.length,
        conflicts: this.buffers.conflicts.length
      },
      aggregated: this.aggregated,
      streaming: {
        active: this.streaming.active,
        subscribers: this.streaming.subscribers.size
      },
      performance: {
        ...this.performance,
        uptime: Date.now() - this.performance.startTime,
        eventsPerSecond: this.calculateEventsPerSecond()
      }
    };
  }
  
  /**
   * Get time series data
   */
  getTimeSeries(metric, duration = 3600000) {
    const series = this.timeSeries.data.get(metric);
    if (!series) return [];
    
    const cutoff = Date.now() - duration;
    return series.filter(point => point.timestamp > cutoff);
  }
  
  /**
   * Subscribe to stream
   */
  subscribe(channel, callback) {
    if (!this.streaming.channels.has(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    
    if (!this.streaming.subscribers.has(channel)) {
      this.streaming.subscribers.set(channel, new Set());
    }
    
    this.streaming.subscribers.get(channel).add(callback);
    
    // Start streaming if first subscriber
    if (!this.streaming.active) {
      this.startStreaming();
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.streaming.subscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        
        // Stop streaming if no subscribers
        if (this.getTotalSubscribers() === 0) {
          this.stopStreaming();
        }
      }
    };
  }
  
  /**
   * Get aggregated metrics for time window
   */
  getAggregatedMetrics(window = 60000) {
    const cutoff = Date.now() - window;
    
    // Filter recent operations
    const recentOps = this.buffers.operations.filter(op => op.timestamp > cutoff);
    const recentMetrics = this.buffers.metrics.filter(m => m.timestamp > cutoff);
    
    return {
      window,
      operations: {
        total: recentOps.length,
        successful: recentOps.filter(op => op.success).length,
        failed: recentOps.filter(op => !op.success).length,
        avgDuration: this.calculateAverage(recentOps.map(op => op.duration))
      },
      metrics: {
        count: recentMetrics.length,
        byName: this.groupByName(recentMetrics)
      },
      throughput: this.calculateThroughput(recentOps, window),
      errorRate: this.calculateErrorRate(recentOps)
    };
  }
  
  // Private methods
  
  maintainBufferSize(bufferName) {
    const buffer = this.buffers[bufferName];
    if (buffer.length > this.config.bufferSize) {
      // Remove oldest 10%
      const removeCount = Math.floor(this.config.bufferSize * 0.1);
      buffer.splice(0, removeCount);
    }
  }
  
  updateMetrics(event) {
    // Update concurrency
    if (event.type === 'agent_start') {
      this.aggregated.concurrency.current++;
      this.aggregated.concurrency.peak = Math.max(
        this.aggregated.concurrency.peak,
        this.aggregated.concurrency.current
      );
    } else if (event.type === 'agent_stop') {
      this.aggregated.concurrency.current = Math.max(0, this.aggregated.concurrency.current - 1);
    }
  }
  
  updateAggregated(name, value) {
    // Update specific aggregated metrics
    if (name === 'throughput') {
      this.aggregated.throughput.current = value;
      this.aggregated.throughput.peak = Math.max(this.aggregated.throughput.peak, value);
    }
  }
  
  updateLatency(duration) {
    this.aggregated.latency.current = duration;
    this.aggregated.latency.min = Math.min(this.aggregated.latency.min, duration);
    this.aggregated.latency.max = Math.max(this.aggregated.latency.max, duration);
    
    // Update average (simple moving average)
    const alpha = 0.1;
    this.aggregated.latency.average = 
      this.aggregated.latency.average * (1 - alpha) + duration * alpha;
  }
  
  addToTimeSeries(name, value) {
    if (!this.timeSeries.data.has(name)) {
      this.timeSeries.data.set(name, []);
    }
    
    const series = this.timeSeries.data.get(name);
    series.push({
      timestamp: Date.now(),
      value
    });
    
    // Maintain max points
    if (series.length > this.timeSeries.maxPoints) {
      series.shift();
    }
  }
  
  streamToSubscribers(channel, data) {
    if (!this.streaming.active) return;
    
    const subscribers = this.streaming.subscribers.get(channel);
    if (subscribers && subscribers.size > 0) {
      for (const callback of subscribers) {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Stream callback error on ${channel}:`, error);
        }
      }
    }
  }
  
  findConflictStart(agents, resource) {
    // Find when conflict started
    for (let i = this.buffers.conflicts.length - 1; i >= 0; i--) {
      const conflict = this.buffers.conflicts[i];
      if (conflict.agents.sort().join() === agents.sort().join() && 
          conflict.resource === resource && 
          !conflict.resolved) {
        return conflict.timestamp;
      }
    }
    return Date.now();
  }
  
  calculateEventsPerSecond() {
    const duration = (Date.now() - this.performance.startTime) / 1000;
    return duration > 0 ? this.performance.eventCount / duration : 0;
  }
  
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  calculateThroughput(operations, window) {
    const duration = window / 1000; // Convert to seconds
    return operations.length / duration;
  }
  
  calculateErrorRate(operations) {
    if (operations.length === 0) return 0;
    const failed = operations.filter(op => !op.success).length;
    return failed / operations.length;
  }
  
  groupByName(metrics) {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = {
          count: 0,
          values: [],
          average: 0
        };
      }
      
      acc[metric.name].count++;
      acc[metric.name].values.push(metric.value);
      acc[metric.name].average = this.calculateAverage(acc[metric.name].values);
      
      return acc;
    }, {});
  }
  
  getTotalSubscribers() {
    let total = 0;
    for (const subscribers of this.streaming.subscribers.values()) {
      total += subscribers.size;
    }
    return total;
  }
  
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Start streaming
   */
  startStreaming() {
    if (this.streaming.active) return;
    
    this.streaming.active = true;
    
    this.streamInterval = setInterval(() => {
      // Stream aggregated updates
      const snapshot = {
        timestamp: Date.now(),
        aggregated: this.aggregated,
        bufferSizes: {
          events: this.buffers.events.length,
          metrics: this.buffers.metrics.length
        }
      };
      
      this.streamToSubscribers('metrics', snapshot);
      
    }, this.config.streamInterval);
    
    logger.info('📡 Streaming started');
  }
  
  /**
   * Stop streaming
   */
  stopStreaming() {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
      this.streaming.active = false;
      logger.info('📡 Streaming stopped');
    }
  }
  
  /**
   * Start aggregation
   */
  startAggregation() {
    this.aggregationInterval = setInterval(() => {
      // Calculate averages
      const window = this.config.aggregationWindow;
      const cutoff = Date.now() - window;
      
      // Update concurrency average
      const concurrencyValues = this.buffers.events
        .filter(e => e.timestamp > cutoff && e.type.includes('agent'))
        .map(() => this.aggregated.concurrency.current);
      
      if (concurrencyValues.length > 0) {
        this.aggregated.concurrency.average = this.calculateAverage(concurrencyValues);
      }
      
      // Update throughput average
      const operations = this.buffers.operations.filter(op => op.timestamp > cutoff);
      this.aggregated.throughput.average = this.calculateThroughput(operations, window);
      
      // Reset current error rate
      this.aggregated.errorRate.current = 0;
      
    }, this.config.aggregationWindow);
  }
  
  /**
   * Start time series collection
   */
  startTimeSeries() {
    this.timeSeriesInterval = setInterval(() => {
      // Collect current metrics
      this.addToTimeSeries('concurrency', this.aggregated.concurrency.current);
      this.addToTimeSeries('throughput', this.aggregated.throughput.current);
      this.addToTimeSeries('latency', this.aggregated.latency.current);
      this.addToTimeSeries('errorRate', this.aggregated.errorRate.current);
      
    }, this.timeSeries.resolution);
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    this.stopStreaming();
    
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }
    
    if (this.timeSeriesInterval) {
      clearInterval(this.timeSeriesInterval);
      this.timeSeriesInterval = null;
    }
    
    // Clear buffers
    this.buffers.events = [];
    this.buffers.metrics = [];
    this.buffers.operations = [];
    this.buffers.conflicts = [];
    
    logger.info('📡 Real-time monitor cleaned up');
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      performance: this.performance,
      bufferSizes: {
        events: this.buffers.events.length,
        metrics: this.buffers.metrics.length,
        operations: this.buffers.operations.length,
        conflicts: this.buffers.conflicts.length
      },
      streaming: {
        active: this.streaming.active,
        subscribers: this.getTotalSubscribers()
      },
      timeSeries: {
        metrics: this.timeSeries.data.size,
        totalPoints: Array.from(this.timeSeries.data.values())
          .reduce((sum, series) => sum + series.length, 0)
      }
    };
  }
}

module.exports = DashboardRealtimeMonitor;