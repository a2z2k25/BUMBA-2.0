/**
 * BUMBA Comprehensive Metrics Collector
 * Captures all performance data points across the framework
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const os = require('os');
const v8 = require('v8');
const { performance, PerformanceObserver } = require('perf_hooks');
const cluster = require('cluster');

class ComprehensiveMetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enabled: options.enabled !== false,
      collectionInterval: options.collectionInterval || 5000, // 5 seconds
      aggregationWindow: options.aggregationWindow || 60000, // 1 minute
      historySize: options.historySize || 1000,
      enableProfiling: options.enableProfiling || false,
      enableTracing: options.enableTracing || false,
      customCollectors: options.customCollectors || [],
      ...options
    };
    
    // Metric categories
    this.categories = {
      SYSTEM: 'system',
      PROCESS: 'process',
      APPLICATION: 'application',
      FRAMEWORK: 'framework',
      AGENTS: 'agents',
      COMMANDS: 'commands',
      INTEGRATIONS: 'integrations',
      SECURITY: 'security',
      NETWORK: 'network',
      DATABASE: 'database',
      CACHE: 'cache',
      CUSTOM: 'custom'
    };
    
    // Storage
    this.metrics = new Map();
    this.timeSeries = new Map();
    this.aggregations = new Map();
    this.correlations = new Map();
    
    // Collectors
    this.collectors = new Map();
    this.performanceMarks = new Map();
    this.performanceMeasures = new Map();
    
    // Statistics
    this.stats = {
      collectionsCompleted: 0,
      metricsCollected: 0,
      errorsEncountered: 0,
      lastCollectionTime: null,
      averageCollectionDuration: 0
    };
    
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize metrics collector
   */
  initialize() {
    // Register built-in collectors
    this.registerBuiltInCollectors();
    
    // Register custom collectors
    this.registerCustomCollectors();
    
    // Set up performance observer
    this.setupPerformanceObserver();
    
    // Start collection
    this.startCollection();
    
    // Set up event listeners
    this.setupEventListeners();
    
    logger.info('Comprehensive metrics collector initialized');
  }

  /**
   * Register built-in collectors
   */
  registerBuiltInCollectors() {
    // System metrics
    this.registerCollector('system', async () => {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      const memTotal = os.totalmem();
      const memFree = os.freemem();
      
      return {
        cpu: {
          count: cpus.length,
          model: cpus[0]?.model,
          speed: cpus[0]?.speed,
          usage: this.calculateCPUUsage(cpus),
          loadAverage: {
            '1min': loadAvg[0],
            '5min': loadAvg[1],
            '15min': loadAvg[2]
          }
        },
        memory: {
          total: memTotal,
          free: memFree,
          used: memTotal - memFree,
          percentage: ((memTotal - memFree) / memTotal * 100).toFixed(2)
        },
        network: os.networkInterfaces(),
        platform: {
          type: os.platform(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: os.uptime()
        }
      };
    });
    
    // Process metrics
    this.registerCollector('process', async () => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const resourceUsage = process.resourceUsage ? process.resourceUsage() : {};
      
      return {
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          percent: this.calculateProcessCPUPercent(cpuUsage)
        },
        resources: {
          ...resourceUsage,
          handles: process._getActiveHandles?.()?.length || 0,
          requests: process._getActiveRequests?.()?.length || 0
        },
        info: {
          pid: process.pid,
          ppid: process.ppid,
          version: process.version,
          uptime: process.uptime(),
          execPath: process.execPath,
          argv: process.argv.slice(2) // Exclude node and script path
        }
      };
    });
    
    // V8 metrics
    this.registerCollector('v8', async () => {
      const heapStats = v8.getHeapStatistics();
      const heapSpaces = v8.getHeapSpaceStatistics();
      const heapCodeStats = v8.getHeapCodeStatistics ? v8.getHeapCodeStatistics() : {};
      
      return {
        heap: {
          totalHeapSize: heapStats.total_heap_size,
          totalHeapSizeExecutable: heapStats.total_heap_size_executable,
          totalPhysicalSize: heapStats.total_physical_size,
          totalAvailableSize: heapStats.total_available_size,
          usedHeapSize: heapStats.used_heap_size,
          heapSizeLimit: heapStats.heap_size_limit,
          mallocedMemory: heapStats.malloced_memory,
          peakMallocedMemory: heapStats.peak_malloced_memory,
          doesZapGarbage: heapStats.does_zap_garbage,
          numberOfNativeContexts: heapStats.number_of_native_contexts,
          numberOfDetachedContexts: heapStats.number_of_detached_contexts
        },
        spaces: heapSpaces.map(space => ({
          name: space.space_name,
          size: space.space_size,
          used: space.space_used_size,
          available: space.space_available_size,
          physical: space.physical_space_size
        })),
        code: heapCodeStats
      };
    });
    
    // Event loop metrics
    this.registerCollector('eventLoop', async () => {
      const lag = this.measureEventLoopLag();
      
      return {
        lag,
        phase: this.getCurrentPhase(),
        activeHandles: process._getActiveHandles?.()?.length || 0,
        activeRequests: process._getActiveRequests?.()?.length || 0,
        pendingTimers: this.countPendingTimers()
      };
    });
    
    // Framework metrics
    this.registerCollector('framework', async () => {
      const framework = global.bumbaFramework;
      
      if (!framework) {
        return null;
      }
      
      return {
        status: framework.status || 'unknown',
        mode: framework.mode || 'standard',
        agents: {
          active: framework.agentManager?.activeAgents?.size || 0,
          pending: framework.agentManager?.pendingAgents?.size || 0,
          completed: framework.agentManager?.completedAgents?.size || 0,
          failed: framework.agentManager?.failedAgents?.size || 0
        },
        commands: {
          executed: framework.commandHandler?.executedCommands || 0,
          queued: framework.commandHandler?.queuedCommands || 0,
          failed: framework.commandHandler?.failedCommands || 0
        },
        integrations: {
          active: framework.integrationManager?.activeIntegrations?.size || 0,
          configured: framework.integrationManager?.configuredIntegrations?.size || 0,
          failed: framework.integrationManager?.failedIntegrations?.size || 0
        },
        performance: {
          startupTime: framework.startupTime || 0,
          lastCommandTime: framework.lastCommandTime || 0,
          averageResponseTime: framework.averageResponseTime || 0
        }
      };
    });
    
    // Garbage collection metrics
    if (global.gc) {
      this.registerCollector('gc', async () => {
        return {
          available: true,
          lastRun: this.lastGCTime || null,
          count: this.gcCount || 0,
          duration: this.gcDuration || 0,
          type: this.lastGCType || null
        };
      });
      
      // Track GC events
      this.trackGarbageCollection();
    }
    
    // Cluster metrics
    if (cluster.isWorker || cluster.isMaster) {
      this.registerCollector('cluster', async () => {
        if (cluster.isMaster) {
          return {
            role: 'master',
            workers: Object.keys(cluster.workers || {}).length,
            workerIds: Object.keys(cluster.workers || {})
          };
        } else {
          return {
            role: 'worker',
            id: cluster.worker?.id,
            state: cluster.worker?.state
          };
        }
      });
    }
  }

  /**
   * Register custom collectors
   */
  registerCustomCollectors() {
    for (const collector of this.config.customCollectors) {
      if (collector.name && typeof collector.collect === 'function') {
        this.registerCollector(collector.name, collector.collect);
      }
    }
  }

  /**
   * Register a metric collector
   */
  registerCollector(name, collectFn) {
    this.collectors.set(name, {
      name,
      collect: collectFn,
      enabled: true,
      lastCollection: null,
      errors: 0
    });
    
    logger.debug(`Registered metrics collector: ${name}`);
  }

  /**
   * Start collection
   */
  startCollection() {
    // Initial collection
    this.collect();
    
    // Set up interval
    this.collectionInterval = setInterval(() => {
      this.collect();
    }, this.config.collectionInterval);
  }

  /**
   * Collect metrics from all collectors
   */
  async collect() {
    const startTime = performance.now();
    const timestamp = Date.now();
    const collected = {};
    
    for (const [name, collector] of this.collectors) {
      if (!collector.enabled) continue;
      
      try {
        const metrics = await collector.collect();
        if (metrics !== null && metrics !== undefined) {
          collected[name] = metrics;
          collector.lastCollection = timestamp;
        }
      } catch (error) {
        collector.errors++;
        this.stats.errorsEncountered++;
        logger.error(`Collector ${name} failed:`, error);
        
        // Disable after multiple failures
        if (collector.errors > 5) {
          collector.enabled = false;
          logger.warn(`Disabled collector ${name} after multiple failures`);
        }
      }
    }
    
    // Store collected metrics
    this.storeMetrics(timestamp, collected);
    
    // Update time series
    this.updateTimeSeries(timestamp, collected);
    
    // Perform aggregations
    this.performAggregations(timestamp, collected);
    
    // Detect anomalies
    this.detectAnomalies(collected);
    
    // Find correlations
    this.findCorrelations(collected);
    
    // Update stats
    const duration = performance.now() - startTime;
    this.updateCollectionStats(duration);
    
    // Emit event
    this.emit('metrics:collected', {
      timestamp,
      metrics: collected,
      duration
    });
    
    return collected;
  }

  /**
   * Store metrics
   */
  storeMetrics(timestamp, metrics) {
    // Store with timestamp
    this.metrics.set(timestamp, metrics);
    
    // Cleanup old metrics
    const cutoff = timestamp - this.config.aggregationWindow * 10; // Keep 10 windows
    for (const [ts] of this.metrics) {
      if (ts < cutoff) {
        this.metrics.delete(ts);
      }
    }
    
    this.stats.metricsCollected++;
  }

  /**
   * Update time series data
   */
  updateTimeSeries(timestamp, metrics) {
    for (const [category, categoryMetrics] of Object.entries(metrics)) {
      if (!this.timeSeries.has(category)) {
        this.timeSeries.set(category, new Map());
      }
      
      const series = this.timeSeries.get(category);
      
      // Flatten nested metrics
      const flattened = this.flattenMetrics(categoryMetrics);
      
      for (const [key, value] of Object.entries(flattened)) {
        if (!series.has(key)) {
          series.set(key, []);
        }
        
        const data = series.get(key);
        data.push({ timestamp, value });
        
        // Keep only recent data
        if (data.length > this.config.historySize) {
          data.shift();
        }
      }
    }
  }

  /**
   * Flatten nested metrics
   */
  flattenMetrics(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenMetrics(value, fullKey));
      } else if (typeof value === 'number') {
        flattened[fullKey] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Perform aggregations
   */
  performAggregations(timestamp, metrics) {
    const window = Math.floor(timestamp / this.config.aggregationWindow);
    
    if (!this.aggregations.has(window)) {
      this.aggregations.set(window, {
        timestamp: window * this.config.aggregationWindow,
        count: 0,
        sum: {},
        min: {},
        max: {},
        avg: {}
      });
    }
    
    const agg = this.aggregations.get(window);
    agg.count++;
    
    // Aggregate all numeric metrics
    const flattened = this.flattenMetrics(metrics);
    
    for (const [key, value] of Object.entries(flattened)) {
      if (typeof value !== 'number') continue;
      
      // Sum
      agg.sum[key] = (agg.sum[key] || 0) + value;
      
      // Min
      agg.min[key] = Math.min(agg.min[key] ?? value, value);
      
      // Max
      agg.max[key] = Math.max(agg.max[key] ?? value, value);
      
      // Average (calculated on demand)
      agg.avg[key] = agg.sum[key] / agg.count;
    }
    
    // Cleanup old aggregations
    const cutoffWindow = window - 10;
    for (const [w] of this.aggregations) {
      if (w < cutoffWindow) {
        this.aggregations.delete(w);
      }
    }
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(metrics) {
    const flattened = this.flattenMetrics(metrics);
    
    for (const [key, value] of Object.entries(flattened)) {
      if (typeof value !== 'number') continue;
      
      // Get historical data
      const history = this.getTimeSeriesData(key, 100);
      if (history.length < 10) continue; // Need enough data
      
      // Calculate statistics
      const stats = this.calculateStatistics(history.map(h => h.value));
      
      // Check for anomalies
      const zscore = Math.abs((value - stats.mean) / (stats.stdDev || 1));
      
      if (zscore > 3) {
        this.emit('anomaly:detected', {
          metric: key,
          value,
          expected: stats.mean,
          zscore,
          severity: zscore > 5 ? 'high' : 'medium'
        });
      }
    }
  }

  /**
   * Find correlations between metrics
   */
  findCorrelations(metrics) {
    const flattened = this.flattenMetrics(metrics);
    const keys = Object.keys(flattened).filter(k => typeof flattened[k] === 'number');
    
    // Check pairs of metrics for correlation
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const key1 = keys[i];
        const key2 = keys[j];
        
        // Get historical data
        const history1 = this.getTimeSeriesData(key1, 50);
        const history2 = this.getTimeSeriesData(key2, 50);
        
        if (history1.length < 20 || history2.length < 20) continue;
        
        // Calculate correlation
        const correlation = this.calculateCorrelation(
          history1.map(h => h.value),
          history2.map(h => h.value)
        );
        
        // Store significant correlations
        if (Math.abs(correlation) > 0.7) {
          const correlationKey = `${key1}:${key2}`;
          this.correlations.set(correlationKey, {
            metrics: [key1, key2],
            correlation,
            lastUpdated: Date.now()
          });
        }
      }
    }
  }

  /**
   * Calculate CPU usage
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Calculate process CPU percentage
   */
  calculateProcessCPUPercent(cpuUsage) {
    if (!this.lastCPUUsage) {
      this.lastCPUUsage = cpuUsage;
      this.lastCPUTime = Date.now();
      return 0;
    }
    
    const timeDiff = Date.now() - this.lastCPUTime;
    const userDiff = cpuUsage.user - this.lastCPUUsage.user;
    const systemDiff = cpuUsage.system - this.lastCPUUsage.system;
    
    this.lastCPUUsage = cpuUsage;
    this.lastCPUTime = Date.now();
    
    const percent = ((userDiff + systemDiff) / 1000 / timeDiff) * 100;
    return Math.max(0, Math.min(100, percent));
  }

  /**
   * Measure event loop lag
   */
  measureEventLoopLag() {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      this.lastEventLoopLag = lag;
    });
    
    return this.lastEventLoopLag || 0;
  }

  /**
   * Get current event loop phase
   */
  getCurrentPhase() {
    // This is a simplified representation
    return 'poll'; // In reality, would need deeper integration
  }

  /**
   * Count pending timers
   */
  countPendingTimers() {
    // This would need access to internal timer list
    return 0; // Placeholder
  }

  /**
   * Track garbage collection
   */
  trackGarbageCollection() {
    if (!global.gc) return;
    
    this.gcCount = 0;
    this.gcDuration = 0;
    
    // Would need to use performance hooks for actual GC tracking
    // This is a placeholder for the concept
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    if (!PerformanceObserver) return;
    
    const obs = new PerformanceObserver((items) => {
      for (const entry of items.getEntries()) {
        // Store performance entries
        if (entry.entryType === 'mark') {
          this.performanceMarks.set(entry.name, entry);
        } else if (entry.entryType === 'measure') {
          this.performanceMeasures.set(entry.name, entry);
        }
        
        this.emit('performance:entry', entry);
      }
    });
    
    obs.observe({ entryTypes: ['mark', 'measure'] });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for framework events if available
    if (global.bumbaFramework) {
      const framework = global.bumbaFramework;
      
      framework.on?.('command:executed', () => {
        this.incrementCounter('commands.executed');
      });
      
      framework.on?.('agent:spawned', () => {
        this.incrementCounter('agents.spawned');
      });
      
      framework.on?.('error', () => {
        this.incrementCounter('errors.total');
      });
    }
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name, value = 1) {
    const current = this.getMetric(name) || 0;
    this.setMetric(name, current + value);
  }

  /**
   * Set a metric value
   */
  setMetric(name, value) {
    // Store in current metrics
    const timestamp = Date.now();
    const metrics = this.metrics.get(timestamp) || {};
    
    // Navigate nested structure
    const parts = name.split('.');
    let current = metrics;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    this.metrics.set(timestamp, metrics);
  }

  /**
   * Get a metric value
   */
  getMetric(name) {
    const latestMetrics = Array.from(this.metrics.values()).pop();
    if (!latestMetrics) return null;
    
    // Navigate nested structure
    const parts = name.split('.');
    let current = latestMetrics;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
    
    return current;
  }

  /**
   * Get time series data
   */
  getTimeSeriesData(metricPath, limit = 100) {
    // Parse category and key
    const parts = metricPath.split('.');
    const category = parts[0];
    const key = parts.slice(1).join('.');
    
    const series = this.timeSeries.get(category);
    if (!series) return [];
    
    const data = series.get(key || metricPath);
    if (!data) return [];
    
    return data.slice(-limit);
  }

  /**
   * Calculate statistics
   */
  calculateStatistics(values) {
    const n = values.length;
    if (n === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
    
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
      median: this.calculateMedian(values),
      p95: this.calculatePercentile(values, 0.95),
      p99: this.calculatePercentile(values, 0.99)
    };
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(percentile * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Calculate correlation coefficient
   */
  calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Update collection statistics
   */
  updateCollectionStats(duration) {
    this.stats.collectionsCompleted++;
    this.stats.lastCollectionTime = Date.now();
    
    // Update average duration
    const prev = this.stats.averageCollectionDuration;
    const count = this.stats.collectionsCompleted;
    this.stats.averageCollectionDuration = (prev * (count - 1) + duration) / count;
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot() {
    const latest = Array.from(this.metrics.values()).pop();
    
    return {
      timestamp: Date.now(),
      metrics: latest || {},
      stats: this.stats,
      aggregations: this.getLatestAggregations(),
      anomalies: this.getRecentAnomalies(),
      correlations: Array.from(this.correlations.values())
    };
  }

  /**
   * Get latest aggregations
   */
  getLatestAggregations() {
    const latest = Array.from(this.aggregations.values()).pop();
    return latest || null;
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies() {
    // This would be tracked if we stored anomalies
    return [];
  }

  /**
   * Export metrics
   */
  export(format = 'json', options = {}) {
    const snapshot = this.getSnapshot();
    
    switch (format) {
      case 'json':
        return JSON.stringify(snapshot, null, 2);
        
      case 'prometheus':
        return this.exportPrometheus(snapshot);
        
      case 'csv':
        return this.exportCSV(snapshot);
        
      default:
        return snapshot;
    }
  }

  /**
   * Export in Prometheus format
   */
  exportPrometheus(snapshot) {
    const lines = [];
    const flattened = this.flattenMetrics(snapshot.metrics);
    
    for (const [key, value] of Object.entries(flattened)) {
      if (typeof value === 'number') {
        const metricName = key.replace(/[^a-zA-Z0-9_]/g, '_');
        lines.push(`bumba_${metricName} ${value}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Export as CSV
   */
  exportCSV(snapshot) {
    const rows = [];
    const flattened = this.flattenMetrics(snapshot.metrics);
    
    rows.push('metric,value,timestamp');
    
    for (const [key, value] of Object.entries(flattened)) {
      if (typeof value === 'number') {
        rows.push(`${key},${value},${snapshot.timestamp}`);
      }
    }
    
    return rows.join('\n');
  }

  /**
   * Stop collection
   */
  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    logger.info('Metrics collector stopped');
  }
}

// Export singleton instance
module.exports = new ComprehensiveMetricsCollector({ enabled: true });