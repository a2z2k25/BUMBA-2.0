/**
 * BUMBA Real-Time Dashboard Updater
 * Manages real-time data streaming and updates for the dashboard
 */

const { EventEmitter } = require('events');
const os = require('os');
const { performance } = require('perf_hooks');

class RealTimeUpdater extends EventEmitter {
  constructor(coordinationDashboard) {
    super();
    
    this.dashboard = coordinationDashboard;
    this.updateInterval = 1000; // Default 1 second
    this.updateTimer = null;
    this.isRunning = false;
    
    // Data buffers for smoothing
    this.dataBuffers = {
      cpu: [],
      memory: [],
      network: [],
      disk: [],
      agentActivity: [],
      lockActivity: [],
      conflictRate: []
    };
    
    this.bufferSize = 10; // Keep last 10 samples for smoothing
    
    // Performance metrics
    this.metrics = {
      updateCount: 0,
      totalUpdateTime: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0
    };
    
    // Historical data storage
    this.history = {
      timestamps: [],
      cpu: [],
      memory: [],
      agentCount: [],
      lockCount: [],
      conflictCount: [],
      maxHistorySize: 3600 // 1 hour at 1 second intervals
    };
    
    // Alert thresholds
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      conflicts: { warning: 5, critical: 10 },
      lockWait: { warning: 3, critical: 5 },
      responseTime: { warning: 1000, critical: 5000 }
    };
    
    // Alert state
    this.alerts = new Map();
  }
  
  /**
   * Start real-time updates
   */
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.updateTimer = setInterval(() => {
      this.performUpdate();
    }, this.updateInterval);
    
    this.emit('started');
  }
  
  /**
   * Stop real-time updates
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.emit('stopped');
  }
  
  /**
   * Perform a single update cycle
   */
  async performUpdate() {
    const startTime = performance.now();
    
    try {
      // Collect all data
      const data = await this.collectData();
      
      // Process and analyze
      const processed = this.processData(data);
      
      // Check for alerts
      this.checkAlerts(processed);
      
      // Update history
      this.updateHistory(processed);
      
      // Emit update event
      this.emit('update', processed);
      
      // Update metrics
      const updateTime = performance.now() - startTime;
      this.updateMetrics(updateTime);
      
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  /**
   * Collect all dashboard data
   */
  async collectData() {
    const [dashboardStatus, systemMetrics] = await Promise.all([
      this.dashboard.getStatus(),
      this.getSystemMetrics()
    ]);
    
    return {
      dashboard: dashboardStatus,
      system: systemMetrics,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const loadAvg = os.loadavg();
    
    // Calculate CPU usage
    const cpuUsage = this.calculateCPUUsage(cpus);
    
    // Calculate memory usage
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    // Network and disk would require additional modules in production
    const networkUsage = this.simulateNetworkUsage();
    const diskUsage = this.simulateDiskUsage();
    
    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: loadAvg
      },
      memory: {
        usage: memoryUsage,
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory
      },
      network: {
        usage: networkUsage,
        bytesIn: Math.floor(Math.random() * 1000000),
        bytesOut: Math.floor(Math.random() * 1000000)
      },
      disk: {
        usage: diskUsage,
        read: Math.floor(Math.random() * 100000),
        write: Math.floor(Math.random() * 100000)
      },
      uptime: os.uptime()
    };
  }
  
  /**
   * Calculate CPU usage percentage
   */
  calculateCPUUsage(cpus) {
    // Simplified CPU calculation
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.floor(idle * 100 / total);
    
    return Math.min(100, Math.max(0, usage));
  }
  
  /**
   * Simulate network usage (in production, use real metrics)
   */
  simulateNetworkUsage() {
    // Add some realistic variation
    const base = 30;
    const variation = Math.sin(Date.now() / 10000) * 20;
    const random = Math.random() * 10;
    return Math.max(0, Math.min(100, base + variation + random));
  }
  
  /**
   * Simulate disk usage (in production, use real metrics)
   */
  simulateDiskUsage() {
    const base = 20;
    const variation = Math.cos(Date.now() / 15000) * 10;
    const random = Math.random() * 5;
    return Math.max(0, Math.min(100, base + variation + random));
  }
  
  /**
   * Process and smooth data
   */
  processData(data) {
    // Add to buffers for smoothing
    this.addToBuffer('cpu', data.system.cpu.usage);
    this.addToBuffer('memory', data.system.memory.usage);
    this.addToBuffer('network', data.system.network.usage);
    this.addToBuffer('disk', data.system.disk.usage);
    
    // Calculate smoothed values
    const smoothed = {
      cpu: this.getSmoothedValue('cpu'),
      memory: this.getSmoothedValue('memory'),
      network: this.getSmoothedValue('network'),
      disk: this.getSmoothedValue('disk')
    };
    
    // Calculate rates
    const rates = this.calculateRates(data);
    
    return {
      ...data,
      smoothed,
      rates,
      alerts: Array.from(this.alerts.values())
    };
  }
  
  /**
   * Add value to buffer for smoothing
   */
  addToBuffer(bufferName, value) {
    const buffer = this.dataBuffers[bufferName];
    buffer.push(value);
    
    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }
  }
  
  /**
   * Get smoothed value from buffer
   */
  getSmoothedValue(bufferName) {
    const buffer = this.dataBuffers[bufferName];
    if (buffer.length === 0) {return 0;}
    
    const sum = buffer.reduce((a, b) => a + b, 0);
    return Math.round(sum / buffer.length);
  }
  
  /**
   * Calculate rates of change
   */
  calculateRates(data) {
    const rates = {};
    
    // Agent activity rate
    if (this.lastData) {
      const agentDiff = data.dashboard.agents.active - this.lastData.dashboard.agents.active;
      rates.agentActivity = agentDiff;
      
      const lockDiff = data.dashboard.locks.activeLocks - this.lastData.dashboard.locks.activeLocks;
      rates.lockActivity = lockDiff;
      
      const conflictDiff = data.dashboard.conflicts.totalConflicts - this.lastData.dashboard.conflicts.totalConflicts;
      rates.conflictRate = conflictDiff;
    } else {
      rates.agentActivity = 0;
      rates.lockActivity = 0;
      rates.conflictRate = 0;
    }
    
    this.lastData = data;
    return rates;
  }
  
  /**
   * Check for alert conditions
   */
  checkAlerts(data) {
    // CPU alert
    this.checkThreshold('cpu', data.smoothed.cpu, 'CPU usage');
    
    // Memory alert
    this.checkThreshold('memory', data.smoothed.memory, 'Memory usage');
    
    // Conflict rate alert
    const conflictRate = parseFloat(data.dashboard.conflicts.conflictRate || '0');
    this.checkThreshold('conflicts', conflictRate, 'Conflict rate');
    
    // Lock wait alert
    const waitingAgents = data.dashboard.locks.waitingAgents || 0;
    this.checkThreshold('lockWait', waitingAgents, 'Agents waiting for locks');
    
    // Clean up resolved alerts
    this.cleanupAlerts(data);
  }
  
  /**
   * Check threshold for a metric
   */
  checkThreshold(metricName, value, description) {
    const threshold = this.thresholds[metricName];
    if (!threshold) {return;}
    
    const alertKey = `threshold_${metricName}`;
    
    if (value >= threshold.critical) {
      this.alerts.set(alertKey, {
        level: 'critical',
        metric: metricName,
        message: `CRITICAL: ${description} is ${value}% (threshold: ${threshold.critical}%)`,
        value,
        threshold: threshold.critical,
        timestamp: Date.now()
      });
      this.emit('alert', this.alerts.get(alertKey));
    } else if (value >= threshold.warning) {
      this.alerts.set(alertKey, {
        level: 'warning',
        metric: metricName,
        message: `WARNING: ${description} is ${value}% (threshold: ${threshold.warning}%)`,
        value,
        threshold: threshold.warning,
        timestamp: Date.now()
      });
      this.emit('alert', this.alerts.get(alertKey));
    } else {
      // Clear alert if it exists and value is below warning
      if (this.alerts.has(alertKey)) {
        this.alerts.delete(alertKey);
        this.emit('alert-cleared', { metric: metricName });
      }
    }
  }
  
  /**
   * Clean up resolved alerts
   */
  cleanupAlerts(data) {
    const now = Date.now();
    const alertTimeout = 60000; // 1 minute
    
    for (const [key, alert] of this.alerts.entries()) {
      if (now - alert.timestamp > alertTimeout) {
        this.alerts.delete(key);
        this.emit('alert-expired', alert);
      }
    }
  }
  
  /**
   * Update historical data
   */
  updateHistory(data) {
    const history = this.history;
    
    // Add new data point
    history.timestamps.push(data.timestamp);
    history.cpu.push(data.smoothed.cpu);
    history.memory.push(data.smoothed.memory);
    history.agentCount.push(data.dashboard.agents.active);
    history.lockCount.push(data.dashboard.locks.activeLocks);
    history.conflictCount.push(data.dashboard.conflicts.totalConflicts);
    
    // Trim to max size
    if (history.timestamps.length > history.maxHistorySize) {
      history.timestamps.shift();
      history.cpu.shift();
      history.memory.shift();
      history.agentCount.shift();
      history.lockCount.shift();
      history.conflictCount.shift();
    }
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics(updateTime) {
    this.metrics.updateCount++;
    this.metrics.totalUpdateTime += updateTime;
    this.metrics.averageUpdateTime = this.metrics.totalUpdateTime / this.metrics.updateCount;
    this.metrics.lastUpdateTime = updateTime;
  }
  
  /**
   * Get current alerts
   */
  getAlerts() {
    return Array.from(this.alerts.values());
  }
  
  /**
   * Get historical data
   */
  getHistory(duration = 3600) {
    const history = this.history;
    const now = Date.now();
    const cutoff = now - (duration * 1000);
    
    // Find the index of the first timestamp after cutoff
    let startIndex = 0;
    for (let i = 0; i < history.timestamps.length; i++) {
      if (history.timestamps[i] >= cutoff) {
        startIndex = i;
        break;
      }
    }
    
    return {
      timestamps: history.timestamps.slice(startIndex),
      cpu: history.cpu.slice(startIndex),
      memory: history.memory.slice(startIndex),
      agentCount: history.agentCount.slice(startIndex),
      lockCount: history.lockCount.slice(startIndex),
      conflictCount: history.conflictCount.slice(startIndex)
    };
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isRunning: this.isRunning,
      updateInterval: this.updateInterval,
      bufferSize: this.bufferSize,
      historySize: this.history.timestamps.length,
      alertCount: this.alerts.size
    };
  }
  
  /**
   * Set update interval
   */
  setUpdateInterval(interval) {
    this.updateInterval = Math.max(100, interval); // Minimum 100ms
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Set alert threshold
   */
  setThreshold(metric, level, value) {
    if (!this.thresholds[metric]) {
      this.thresholds[metric] = {};
    }
    this.thresholds[metric][level] = value;
  }
  
  /**
   * Clear all alerts
   */
  clearAlerts() {
    this.alerts.clear();
    this.emit('alerts-cleared');
  }
  
  /**
   * Reset history
   */
  resetHistory() {
    this.history.timestamps = [];
    this.history.cpu = [];
    this.history.memory = [];
    this.history.agentCount = [];
    this.history.lockCount = [];
    this.history.conflictCount = [];
    this.emit('history-reset');
  }
}

module.exports = RealTimeUpdater;