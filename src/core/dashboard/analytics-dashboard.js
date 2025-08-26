/**
 * BUMBA Analytics Dashboard
 * Performance metrics, trend analysis, and system analytics
 */

const DashboardBase = require('./dashboard-base');
const { logger } = require('../logging/bumba-logger');
const path = require('path');
const fs = require('fs');

class AnalyticsDashboard extends DashboardBase {
  constructor(config = {}) {
    super({
      name: 'Analytics Dashboard',
      refreshInterval: 10000,
      ...config
    });
    
    // Metrics storage
    this.metrics = {
      performance: [],
      operations: [],
      errors: [],
      agents: [],
      integrations: []
    };
    
    // Time windows for analysis
    this.timeWindows = {
      realtime: 60000,      // 1 minute
      short: 300000,        // 5 minutes
      medium: 1800000,      // 30 minutes
      long: 3600000         // 1 hour
    };
    
    // Aggregated stats
    this.aggregatedStats = {};
    
    // Trend analysis
    this.trends = {};
  }
  
  /**
   * Initialize analytics dashboard
   */
  async initialize() {
    try {
      // Load historical data if available
      await this.loadHistoricalData();
      
      // Setup metric collectors
      this.setupMetricCollectors();
      
      // Call parent initialize
      await super.initialize();
      
      return true;
    } catch (error) {
      logger.error('Analytics Dashboard initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup metric collectors
   */
  setupMetricCollectors() {
    // Collect system metrics
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
    
    // Collect operation metrics
    this.setupOperationTracking();
    
    // Collect agent metrics
    this.setupAgentTracking();
  }
  
  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metric = {
      timestamp: Date.now(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        heapPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    };
    
    this.addMetric('performance', metric);
  }
  
  /**
   * Setup operation tracking
   */
  setupOperationTracking() {
    // Track file operations
    try {
      const safeFileOps = require('../coordination/safe-file-operations');
      if (safeFileOps.getInstance) {
        const ops = safeFileOps.getInstance();
        
        ops.on('operation:complete', (data) => {
          this.addMetric('operations', {
            timestamp: Date.now(),
            type: 'file',
            operation: data.operation,
            duration: data.duration,
            success: true
          });
        });
        
        ops.on('operation:error', (data) => {
          this.addMetric('errors', {
            timestamp: Date.now(),
            type: 'file',
            operation: data.operation,
            error: data.error
          });
        });
      }
    } catch (error) {
      logger.debug('File operations tracking not available');
    }
  }
  
  /**
   * Setup agent tracking
   */
  setupAgentTracking() {
    try {
      const agentIdentity = require('../coordination/agent-identity');
      if (agentIdentity.getInstance) {
        const identity = agentIdentity.getInstance();
        
        // Periodically collect agent stats
        setInterval(() => {
          const stats = identity.getStats();
          this.addMetric('agents', {
            timestamp: Date.now(),
            active: stats.activeAgents,
            total: stats.totalAgents,
            byDepartment: stats.byDepartment,
            byType: stats.byType
          });
        }, 10000);
      }
    } catch (error) {
      logger.debug('Agent tracking not available');
    }
  }
  
  /**
   * Add metric to storage
   */
  addMetric(type, metric) {
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }
    
    this.metrics[type].push(metric);
    
    // Trim old metrics (keep last hour)
    const cutoff = Date.now() - this.timeWindows.long;
    this.metrics[type] = this.metrics[type].filter(m => m.timestamp > cutoff);
  }
  
  /**
   * Fetch dashboard data
   */
  async fetchData() {
    // Calculate current stats
    const currentStats = this.calculateCurrentStats();
    
    // Calculate aggregated stats
    this.aggregatedStats = this.calculateAggregatedStats();
    
    // Calculate trends
    this.trends = this.calculateTrends();
    
    // Get top operations
    const topOperations = this.getTopOperations();
    
    // Get error analysis
    const errorAnalysis = this.analyzeErrors();
    
    return {
      current: currentStats,
      aggregated: this.aggregatedStats,
      trends: this.trends,
      topOperations,
      errorAnalysis,
      charts: this.generateCharts(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Calculate current stats
   */
  calculateCurrentStats() {
    const latest = {
      performance: this.metrics.performance[this.metrics.performance.length - 1],
      agents: this.metrics.agents[this.metrics.agents.length - 1],
      operations: this.getRecentMetrics('operations', 60000).length,
      errors: this.getRecentMetrics('errors', 60000).length
    };
    
    return {
      memory: latest.performance ? 
        `${Math.round(latest.performance.memory.heapUsed / 1024 / 1024)}MB` : 'N/A',
      memoryPercent: latest.performance ? 
        Math.round(latest.performance.memory.heapPercent) : 0,
      activeAgents: latest.agents ? latest.agents.active : 0,
      operationsPerMinute: latest.operations,
      errorsPerMinute: latest.errors,
      uptime: latest.performance ? 
        this.formatDuration(latest.performance.uptime * 1000) : 'N/A'
    };
  }
  
  /**
   * Calculate aggregated stats
   */
  calculateAggregatedStats() {
    const windows = {};
    
    Object.entries(this.timeWindows).forEach(([name, duration]) => {
      windows[name] = this.aggregateForWindow(duration);
    });
    
    return windows;
  }
  
  /**
   * Aggregate metrics for a time window
   */
  aggregateForWindow(duration) {
    const operations = this.getRecentMetrics('operations', duration);
    const errors = this.getRecentMetrics('errors', duration);
    const performance = this.getRecentMetrics('performance', duration);
    
    return {
      totalOperations: operations.length,
      successfulOperations: operations.filter(o => o.success).length,
      failedOperations: operations.filter(o => !o.success).length,
      totalErrors: errors.length,
      avgMemory: performance.length > 0 ?
        Math.round(performance.reduce((sum, p) => sum + p.memory.heapUsed, 0) / performance.length / 1024 / 1024) : 0,
      operationsPerSecond: operations.length / (duration / 1000)
    };
  }
  
  /**
   * Get recent metrics
   */
  getRecentMetrics(type, duration) {
    const cutoff = Date.now() - duration;
    return this.metrics[type].filter(m => m.timestamp > cutoff);
  }
  
  /**
   * Calculate trends
   */
  calculateTrends() {
    const trends = {};
    
    // Memory trend
    const memoryData = this.metrics.performance.map(p => p.memory.heapUsed);
    trends.memory = this.calculateTrend(memoryData);
    
    // Operations trend
    const opsPerMinute = this.calculateOperationsPerMinute();
    trends.operations = this.calculateTrend(opsPerMinute);
    
    // Error trend
    const errorsPerMinute = this.calculateErrorsPerMinute();
    trends.errors = this.calculateTrend(errorsPerMinute);
    
    return trends;
  }
  
  /**
   * Calculate trend from data points
   */
  calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-10);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate operations per minute
   */
  calculateOperationsPerMinute() {
    const buckets = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const start = now - ((i + 1) * 60000);
      const end = now - (i * 60000);
      const count = this.metrics.operations.filter(o => 
        o.timestamp >= start && o.timestamp < end
      ).length;
      buckets.push(count);
    }
    
    return buckets.reverse();
  }
  
  /**
   * Calculate errors per minute
   */
  calculateErrorsPerMinute() {
    const buckets = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const start = now - ((i + 1) * 60000);
      const end = now - (i * 60000);
      const count = this.metrics.errors.filter(e => 
        e.timestamp >= start && e.timestamp < end
      ).length;
      buckets.push(count);
    }
    
    return buckets.reverse();
  }
  
  /**
   * Get top operations
   */
  getTopOperations() {
    const operations = this.getRecentMetrics('operations', this.timeWindows.medium);
    const opCounts = {};
    
    operations.forEach(op => {
      const key = `${op.type}:${op.operation}`;
      opCounts[key] = (opCounts[key] || 0) + 1;
    });
    
    return Object.entries(opCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([op, count]) => ({ operation: op, count }));
  }
  
  /**
   * Analyze errors
   */
  analyzeErrors() {
    const errors = this.getRecentMetrics('errors', this.timeWindows.medium);
    const errorTypes = {};
    
    errors.forEach(error => {
      const type = error.type || 'unknown';
      if (!errorTypes[type]) {
        errorTypes[type] = { count: 0, recent: [] };
      }
      errorTypes[type].count++;
      errorTypes[type].recent.push(error);
    });
    
    return {
      total: errors.length,
      byType: errorTypes,
      rate: errors.length / (this.timeWindows.medium / 60000) // per minute
    };
  }
  
  /**
   * Generate charts
   */
  generateCharts() {
    const charts = {};
    
    // Memory usage sparkline
    const memoryData = this.metrics.performance
      .slice(-20)
      .map(p => p.memory.heapUsed / 1024 / 1024);
    charts.memory = this.createSparkline(memoryData, 30);
    
    // Operations bar chart
    const opsData = this.calculateOperationsPerMinute().slice(-5);
    charts.operations = this.createMiniBarChart(opsData);
    
    // Agent activity
    const agentData = this.metrics.agents
      .slice(-10)
      .map(a => a.active);
    charts.agents = this.createSparkline(agentData, 20);
    
    return charts;
  }
  
  /**
   * Create mini bar chart
   */
  createMiniBarChart(data) {
    const max = Math.max(...data, 1);
    const height = 5;
    const lines = [];
    
    for (let h = height; h > 0; h--) {
      const line = data.map(value => {
        const barHeight = Math.round((value / max) * height);
        return barHeight >= h ? '█' : ' ';
      }).join(' ');
      lines.push(line);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Display dashboard content
   */
  displayContent() {
    // Current Metrics
    this.displayCurrentMetrics();
    
    // Performance Trends
    this.displayTrends();
    
    // Top Operations
    this.displayTopOperations();
    
    // Error Analysis
    this.displayErrorAnalysis();
    
    // Aggregated Stats
    this.displayAggregatedStats();
    
    // Charts
    this.displayCharts();
  }
  
  /**
   * Display current metrics
   */
  displayCurrentMetrics() {
    console.log(this.colors.header('📊 CURRENT METRICS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const current = this.data.current;
    
    const memColor = current.memoryPercent > 80 ? this.colors.error :
                     current.memoryPercent > 60 ? this.colors.warning :
                     this.colors.success;
    
    console.log(`Memory Usage: ${memColor(current.memory)} (${current.memoryPercent}%)`);
    console.log(`Active Agents: ${this.colors.info(current.activeAgents)}`);
    console.log(`Operations/min: ${this.colors.highlight(current.operationsPerMinute)}`);
    console.log(`Errors/min: ${current.errorsPerMinute > 0 ? 
      this.colors.error(current.errorsPerMinute) : 
      this.colors.success('0')}`);
    console.log(`Uptime: ${this.colors.muted(current.uptime)}`);
    console.log();
  }
  
  /**
   * Display trends
   */
  displayTrends() {
    console.log(this.colors.header('📈 TRENDS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const trends = this.data.trends;
    
    Object.entries(trends).forEach(([metric, trend]) => {
      const icon = trend === 'increasing' ? '↑' :
                   trend === 'decreasing' ? '↓' : '→';
      const color = trend === 'increasing' ? 
        (metric === 'errors' ? this.colors.error : this.colors.success) :
        trend === 'decreasing' ?
        (metric === 'errors' ? this.colors.success : this.colors.warning) :
        this.colors.info;
      
      console.log(`${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${color(icon + ' ' + trend)}`);
    });
    console.log();
  }
  
  /**
   * Display top operations
   */
  displayTopOperations() {
    console.log(this.colors.header('🟡 TOP OPERATIONS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    if (this.data.topOperations.length === 0) {
      console.log(this.colors.muted('No operations recorded'));
    } else {
      this.data.topOperations.forEach((op, i) => {
        console.log(`${i + 1}. ${op.operation}: ${this.colors.highlight(op.count)} times`);
      });
    }
    console.log();
  }
  
  /**
   * Display error analysis
   */
  displayErrorAnalysis() {
    console.log(this.colors.header('🟠️ ERROR ANALYSIS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const errors = this.data.errorAnalysis;
    
    if (errors.total === 0) {
      console.log(this.colors.success('No errors in the last 30 minutes'));
    } else {
      console.log(`Total Errors: ${this.colors.error(errors.total)}`);
      console.log(`Error Rate: ${this.colors.warning(errors.rate.toFixed(2))} per minute`);
      
      if (Object.keys(errors.byType).length > 0) {
        console.log('By Type:');
        Object.entries(errors.byType).forEach(([type, data]) => {
          console.log(`  ${type}: ${this.colors.error(data.count)}`);
        });
      }
    }
    console.log();
  }
  
  /**
   * Display aggregated stats
   */
  displayAggregatedStats() {
    console.log(this.colors.header('📊 AGGREGATED STATISTICS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const windows = ['realtime', 'short', 'medium'];
    const labels = {
      realtime: '1 min',
      short: '5 min',
      medium: '30 min'
    };
    
    const headers = ['Window', 'Ops', 'Success', 'Errors', 'Avg Mem'];
    const rows = [];
    
    windows.forEach(window => {
      const stats = this.data.aggregated[window];
      rows.push([
        labels[window],
        stats.totalOperations,
        `${Math.round((stats.successfulOperations / Math.max(stats.totalOperations, 1)) * 100)}%`,
        stats.totalErrors,
        `${stats.avgMemory}MB`
      ]);
    });
    
    console.log(this.createTable(headers, rows));
    console.log();
  }
  
  /**
   * Display charts
   */
  displayCharts() {
    console.log(this.colors.header('📉 PERFORMANCE CHARTS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const charts = this.data.charts;
    
    console.log('Memory Usage (last 20 samples):');
    console.log(this.colors.info(charts.memory));
    console.log();
    
    console.log('Operations (last 5 minutes):');
    console.log(this.colors.success(charts.operations));
    console.log();
    
    console.log('Agent Activity:');
    console.log(this.colors.highlight(charts.agents));
    console.log();
  }
  
  /**
   * Load historical data
   */
  async loadHistoricalData() {
    // In production, load from database or file
    // For now, initialize empty
    logger.debug('Loading historical analytics data');
  }
  
  /**
   * Get summary for external use
   */
  getSummary() {
    return {
      current: this.data?.current || {},
      trends: this.data?.trends || {},
      errors: this.data?.errorAnalysis?.total || 0,
      topOperations: this.data?.topOperations?.slice(0, 3) || [],
      lastRefresh: this.lastRefresh
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  AnalyticsDashboard,
  getInstance: (config) => {
    if (!instance) {
      instance = new AnalyticsDashboard(config);
    }
    return instance;
  },
  
  // Quick display method
  show: async () => {
    const dashboard = module.exports.getInstance();
    if (!dashboard.initialized) {
      await dashboard.initialize();
    }
    await dashboard.refresh();
    dashboard.display();
    return dashboard;
  }
};