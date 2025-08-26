/**
 * BUMBA Auto-Starting Performance Dashboard
 * Automatically initializes and maintains performance monitoring
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const os = require('os');
const v8 = require('v8');
const chalk = require('chalk');

class AutoPerformanceDashboard extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      autoStart: options.autoStart !== false,
      refreshInterval: options.refreshInterval || 1000, // 1 second
      displayMode: options.displayMode || 'compact', // compact, detailed, minimal
      enableWebUI: options.enableWebUI || false,
      webPort: options.webPort || 3001,
      persistMetrics: options.persistMetrics !== false,
      alertsEnabled: options.alertsEnabled !== false,
      ...options
    };
    
    // Dashboard state
    this.isRunning = false;
    this.startTime = Date.now();
    this.refreshTimer = null;
    
    // Metrics collectors
    this.collectors = new Map();
    this.metrics = {
      system: {},
      process: {},
      application: {},
      custom: {}
    };
    
    // Performance thresholds for alerts
    this.thresholds = {
      cpu: 80,
      memory: 85,
      responseTime: 1000,
      errorRate: 5,
      throughput: 100
    };
    
    // Historical data for trends
    this.history = {
      cpu: [],
      memory: [],
      responseTime: [],
      throughput: [],
      errors: []
    };
    
    this.maxHistorySize = 60; // Keep last 60 data points
    
    // Initialize collectors
    this.initializeCollectors();
    
    // Auto-start if enabled
    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Initialize metric collectors
   */
  initializeCollectors() {
    // System metrics collector
    this.collectors.set('system', {
      interval: 1000,
      collect: () => this.collectSystemMetrics()
    });
    
    // Process metrics collector
    this.collectors.set('process', {
      interval: 500,
      collect: () => this.collectProcessMetrics()
    });
    
    // Application metrics collector
    this.collectors.set('application', {
      interval: 2000,
      collect: () => this.collectApplicationMetrics()
    });
    
    // V8 heap metrics collector
    this.collectors.set('v8', {
      interval: 5000,
      collect: () => this.collectV8Metrics()
    });
    
    // Network metrics collector
    this.collectors.set('network', {
      interval: 3000,
      collect: () => this.collectNetworkMetrics()
    });
  }

  /**
   * Start the dashboard
   */
  start() {
    if (this.isRunning) {
      logger.warn('Performance dashboard is already running');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Start all collectors
    for (const [name, collector] of this.collectors) {
      this.startCollector(name, collector);
    }
    
    // Start refresh timer for display
    if (this.config.displayMode !== 'none') {
      this.startRefreshTimer();
    }
    
    // Start web UI if enabled
    if (this.config.enableWebUI) {
      this.startWebUI();
    }
    
    // Set up graceful shutdown
    this.setupShutdownHandlers();
    
    this.emit('started');
    logger.info('🟢 Auto Performance Dashboard started');
  }

  /**
   * Start a metric collector
   */
  startCollector(name, collector) {
    const timer = setInterval(async () => {
      try {
        const metrics = await collector.collect();
        this.updateMetrics(name, metrics);
      } catch (error) {
        logger.error(`Collector ${name} failed:`, error);
      }
    }, collector.interval);
    
    collector.timer = timer;
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;
    
    const metrics = {
      cpu: {
        usage: cpuUsage.toFixed(2),
        cores: cpus.length,
        model: cpus[0].model,
        speed: cpus[0].speed
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: ((usedMemory / totalMemory) * 100).toFixed(2)
      },
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      platform: os.platform(),
      hostname: os.hostname()
    };
    
    // Update history
    this.updateHistory('cpu', cpuUsage);
    this.updateHistory('memory', (usedMemory / totalMemory) * 100);
    
    // Check thresholds
    this.checkThresholds('cpu', cpuUsage);
    this.checkThresholds('memory', (usedMemory / totalMemory) * 100);
    
    return metrics;
  }

  /**
   * Collect process metrics
   */
  collectProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
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
        system: cpuUsage.system
      },
      pid: process.pid,
      uptime: process.uptime(),
      versions: process.versions
    };
  }

  /**
   * Collect application metrics
   */
  collectApplicationMetrics() {
    // Get from global framework if available
    const framework = global.bumbaFramework;
    
    const metrics = {
      requests: {
        total: framework?.metrics?.totalRequests || 0,
        successful: framework?.metrics?.successfulRequests || 0,
        failed: framework?.metrics?.failedRequests || 0,
        pending: framework?.metrics?.pendingRequests || 0
      },
      agents: {
        active: framework?.agentManager?.activeAgents?.size || 0,
        spawned: framework?.metrics?.agentsSpawned || 0,
        failed: framework?.metrics?.agentsFailed || 0
      },
      commands: {
        executed: framework?.metrics?.commandsExecuted || 0,
        queued: framework?.commandQueue?.length || 0
      },
      tokens: {
        used: framework?.statusLine?.totalTokensUsed || 0,
        rate: framework?.metrics?.tokenRate || 0
      },
      responseTime: {
        average: framework?.metrics?.avgResponseTime || 0,
        p95: framework?.metrics?.p95ResponseTime || 0,
        p99: framework?.metrics?.p99ResponseTime || 0
      }
    };
    
    // Update history
    if (metrics.responseTime.average > 0) {
      this.updateHistory('responseTime', metrics.responseTime.average);
    }
    
    return metrics;
  }

  /**
   * Collect V8 heap metrics
   */
  collectV8Metrics() {
    const heapStats = v8.getHeapStatistics();
    const heapSpaces = v8.getHeapSpaceStatistics();
    
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
        doesZapGarbage: heapStats.does_zap_garbage
      },
      spaces: heapSpaces.map(space => ({
        name: space.space_name,
        size: space.space_size,
        used: space.space_used_size,
        available: space.space_available_size,
        physical: space.physical_space_size
      }))
    };
  }

  /**
   * Collect network metrics
   */
  collectNetworkMetrics() {
    // Simplified network metrics - in production, use actual network monitoring
    return {
      connections: {
        active: 0,
        idle: 0,
        total: 0
      },
      bandwidth: {
        incoming: 0,
        outgoing: 0
      },
      latency: {
        average: 0,
        min: 0,
        max: 0
      }
    };
  }

  /**
   * Update metrics
   */
  updateMetrics(category, metrics) {
    this.metrics[category] = {
      ...this.metrics[category],
      ...metrics,
      lastUpdated: Date.now()
    };
    
    this.emit('metrics:updated', { category, metrics });
  }

  /**
   * Update history
   */
  updateHistory(metric, value) {
    if (!this.history[metric]) {
      this.history[metric] = [];
    }
    
    this.history[metric].push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only recent history
    if (this.history[metric].length > this.maxHistorySize) {
      this.history[metric].shift();
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  checkThresholds(metric, value) {
    if (!this.config.alertsEnabled) return;
    
    const threshold = this.thresholds[metric];
    if (threshold && value > threshold) {
      this.triggerAlert(metric, value, threshold);
    }
  }

  /**
   * Trigger performance alert
   */
  triggerAlert(metric, value, threshold) {
    const alert = {
      metric,
      value,
      threshold,
      severity: this.getAlertSeverity(metric, value, threshold),
      timestamp: Date.now(),
      message: `${metric} exceeded threshold: ${value.toFixed(2)} > ${threshold}`
    };
    
    this.emit('alert', alert);
    
    // Log based on severity
    if (alert.severity === 'critical') {
      logger.error(`🔴 CRITICAL: ${alert.message}`);
    } else if (alert.severity === 'warning') {
      logger.warn(`🟠️ WARNING: ${alert.message}`);
    }
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(metric, value, threshold) {
    const ratio = value / threshold;
    
    if (ratio > 1.2) return 'critical';
    if (ratio > 1.0) return 'warning';
    return 'info';
  }

  /**
   * Start refresh timer for display
   */
  startRefreshTimer() {
    this.refreshTimer = setInterval(() => {
      this.render();
    }, this.config.refreshInterval);
  }

  /**
   * Render the dashboard
   */
  render() {
    if (!process.stdout.isTTY) return;
    
    switch (this.config.displayMode) {
      case 'detailed':
        this.renderDetailed();
        break;
      case 'compact':
        this.renderCompact();
        break;
      case 'minimal':
        this.renderMinimal();
        break;
    }
  }

  /**
   * Render detailed dashboard
   */
  renderDetailed() {
    console.clear();
    
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║         BUMBA Performance Dashboard (Auto-Started)          ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝\n'));
    
    // System metrics
    const system = this.metrics.system;
    if (system.cpu) {
      console.log(chalk.yellow.bold('📊 System Metrics:'));
      console.log(`  CPU Usage: ${this.getColoredValue(system.cpu.usage, 80, 90)}% (${system.cpu.cores} cores)`);
      console.log(`  Memory: ${this.getColoredValue(system.memory.percentage, 80, 90)}% (${this.formatBytes(system.memory.used)} / ${this.formatBytes(system.memory.total)})`);
      console.log(`  Load Average: ${system.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
      console.log('');
    }
    
    // Process metrics
    const process = this.metrics.process;
    if (process.memory) {
      console.log(chalk.green.bold('🔧 Process Metrics:'));
      console.log(`  Heap Used: ${this.formatBytes(process.memory.heapUsed)} / ${this.formatBytes(process.memory.heapTotal)}`);
      console.log(`  RSS: ${this.formatBytes(process.memory.rss)}`);
      console.log(`  Uptime: ${this.formatUptime(process.uptime)}`);
      console.log('');
    }
    
    // Application metrics
    const app = this.metrics.application;
    if (app.requests) {
      console.log(chalk.blue.bold('📱 Application Metrics:'));
      console.log(`  Requests: ${app.requests.total} (🏁 ${app.requests.successful} | 🔴 ${app.requests.failed})`);
      console.log(`  Active Agents: ${app.agents.active}`);
      console.log(`  Commands Executed: ${app.commands.executed}`);
      console.log(`  Token Usage: ${app.tokens.used}`);
      
      if (app.responseTime.average > 0) {
        console.log(`  Response Time: avg ${app.responseTime.average.toFixed(2)}ms | p95 ${app.responseTime.p95.toFixed(2)}ms | p99 ${app.responseTime.p99.toFixed(2)}ms`);
      }
      console.log('');
    }
    
    // Trends
    this.renderTrends();
    
    // Footer
    console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()} | Uptime: ${this.formatUptime((Date.now() - this.startTime) / 1000)}`));
  }

  /**
   * Render compact dashboard
   */
  renderCompact() {
    // Single line update
    const system = this.metrics.system;
    const app = this.metrics.application;
    
    const line = [
      `CPU: ${system.cpu?.usage || 0}%`,
      `MEM: ${system.memory?.percentage || 0}%`,
      `Agents: ${app.agents?.active || 0}`,
      `Reqs: ${app.requests?.total || 0}`,
      `Tokens: ${app.tokens?.used || 0}`
    ].join(' | ');
    
    process.stdout.write(`\r${chalk.cyan('[PERF]')} ${line}`);
  }

  /**
   * Render minimal dashboard
   */
  renderMinimal() {
    // Ultra-minimal - just critical metrics
    const cpu = this.metrics.system.cpu?.usage || 0;
    const mem = this.metrics.system.memory?.percentage || 0;
    
    const status = (cpu > 80 || mem > 80) ? chalk.red('🟠') : chalk.green('🏁');
    process.stdout.write(`\r${status} CPU:${cpu}% MEM:${mem}%`);
  }

  /**
   * Render trends
   */
  renderTrends() {
    console.log(chalk.magenta.bold('📈 Trends:'));
    
    for (const [metric, history] of Object.entries(this.history)) {
      if (history.length > 0) {
        const recent = history.slice(-10);
        const trend = this.calculateTrend(recent);
        const sparkline = this.generateSparkline(recent);
        
        console.log(`  ${metric}: ${sparkline} ${trend}`);
      }
    }
    console.log('');
  }

  /**
   * Calculate trend
   */
  calculateTrend(data) {
    if (data.length < 2) return '→';
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return chalk.red(`↑ ${change.toFixed(1)}%`);
    if (change < -5) return chalk.green(`↓ ${Math.abs(change).toFixed(1)}%`);
    return chalk.yellow('→ stable');
  }

  /**
   * Generate sparkline
   */
  generateSparkline(data) {
    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    return values.map(v => {
      const index = Math.floor(((v - min) / range) * (chars.length - 1));
      return chars[index];
    }).join('');
  }

  /**
   * Get colored value based on thresholds
   */
  getColoredValue(value, warning, critical) {
    const num = parseFloat(value);
    if (num >= critical) return chalk.red(value);
    if (num >= warning) return chalk.yellow(value);
    return chalk.green(value);
  }

  /**
   * Format bytes
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  }

  /**
   * Start web UI
   */
  startWebUI() {
    try {
      const express = require('express');
      const app = express();
      
      // API endpoints
      app.get('/api/metrics', (req, res) => {
        res.json(this.metrics);
      });
      
      app.get('/api/history', (req, res) => {
        res.json(this.history);
      });
      
      app.get('/api/status', (req, res) => {
        res.json({
          isRunning: this.isRunning,
          uptime: Date.now() - this.startTime,
          collectors: Array.from(this.collectors.keys()),
          config: this.config
        });
      });
      
      // Static dashboard page
      app.get('/', (req, res) => {
        res.send(this.getWebDashboardHTML());
      });
      
      app.listen(this.config.webPort, () => {
        logger.info(`📊 Web dashboard available at http://localhost:${this.config.webPort}`);
      });
      
      this.webApp = app;
      
    } catch (error) {
      logger.warn('Web UI requires express. Install with: npm install express');
    }
  }

  /**
   * Get web dashboard HTML
   */
  getWebDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>BUMBA Performance Dashboard</title>
  <style>
    body { font-family: monospace; background: #1e1e1e; color: #00ff00; padding: 20px; }
    h1 { color: #00ffff; }
    .metric { margin: 10px 0; padding: 10px; background: #2a2a2a; border-radius: 5px; }
    .value { color: #ffff00; font-weight: bold; }
    .chart { height: 100px; background: #333; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>BUMBA Performance Dashboard</h1>
  <div id="metrics"></div>
  <script>
    setInterval(() => {
      fetch('/api/metrics')
        .then(r => r.json())
        .then(data => {
          document.getElementById('metrics').innerHTML = 
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        });
    }, 1000);
  </script>
</body>
</html>`;
  }

  /**
   * Setup shutdown handlers
   */
  setupShutdownHandlers() {
    const shutdown = () => {
      this.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Stop the dashboard
   */
  stop() {
    this.isRunning = false;
    
    // Stop all collectors
    for (const collector of this.collectors.values()) {
      if (collector.timer) {
        clearInterval(collector.timer);
      }
    }
    
    // Stop refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Stop web server
    if (this.webApp) {
      // Web server cleanup
    }
    
    this.emit('stopped');
    logger.info('Performance dashboard stopped');
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get historical data
   */
  getHistory(metric) {
    return this.history[metric] || [];
  }

  /**
   * Add custom metric collector
   */
  addCollector(name, interval, collectFn) {
    this.collectors.set(name, {
      interval,
      collect: collectFn
    });
    
    if (this.isRunning) {
      this.startCollector(name, this.collectors.get(name));
    }
  }

  /**
   * Set threshold
   */
  setThreshold(metric, value) {
    this.thresholds[metric] = value;
  }

  /**
   * Export metrics
   */
  exportMetrics(format = 'json') {
    const data = {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      metrics: this.metrics,
      history: this.history
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.exportAsCSV(data);
      default:
        return data;
    }
  }

  /**
   * Export as CSV
   */
  exportAsCSV(data) {
    const rows = [];
    const timestamp = new Date(data.timestamp).toISOString();
    
    // Flatten metrics
    for (const [category, metrics] of Object.entries(data.metrics)) {
      for (const [key, value] of Object.entries(metrics)) {
        if (typeof value === 'object') {
          for (const [subkey, subvalue] of Object.entries(value)) {
            rows.push([timestamp, category, `${key}.${subkey}`, subvalue].join(','));
          }
        } else {
          rows.push([timestamp, category, key, value].join(','));
        }
      }
    }
    
    return 'timestamp,category,metric,value\n' + rows.join('\n');
  }
}

// Export singleton instance that auto-starts
const dashboard = new AutoPerformanceDashboard({ autoStart: true });

// Attach to global for framework access
if (global.bumbaFramework) {
  global.bumbaFramework.performanceDashboard = dashboard;
}

module.exports = dashboard;