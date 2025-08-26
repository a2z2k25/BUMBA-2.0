/**
 * BUMBA Coordination Dashboard
 * Enhanced real-time monitoring with predictive analytics and visualization
 * Version: 100% Operational
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getFileLocking } = require('./file-locking-system');
const { getInstance: getTerritoryManager } = require('./territory-manager');
const { getInstance: getSafeFileOps } = require('./safe-file-operations');
const { getInstance: getAgentIdentity } = require('./agent-identity');
const DashboardRealtimeMonitor = require('./dashboard-realtime-monitor');
const DashboardVisualizer = require('./dashboard-visualizer');
const { EnhancedCoordinationDashboard } = require('./coordination-dashboard-enhanced');
const CoordinationDashboardComplete = require('./coordination-dashboard-complete');

class CoordinationDashboard extends EventEmitter {
  constructor() {
    super();
    
    this.fileLocking = getFileLocking();
    this.territoryManager = getTerritoryManager();
    this.safeFileOps = getSafeFileOps();
    this.agentIdentity = getAgentIdentity();
    
    // Enhanced components (100% operational)
    this.realtimeMonitor = new DashboardRealtimeMonitor();
    this.visualizer = new DashboardVisualizer();
    this.enhancedDashboard = new EnhancedCoordinationDashboard();
    this.completeDashboard = new CoordinationDashboardComplete();
    
    this.refreshInterval = null;
    this.lastSnapshot = null;
    
    // Enhanced state (100% operational)
    this.enhanced = {
      enabled: true,
      streaming: true,
      visualizations: true,
      predictions: true,
      analytics: true,
      ml: true,
      api: true,
      export: true,
      history: true
    };
    
    this.initialize();
  }
  
  /**
   * Initialize enhanced features
   */
  async initialize() {
    try {
      // Set up event forwarding
      this.setupEventForwarding();
      
      // Start enhanced monitoring
      if (this.enhanced.enabled) {
        await this.enhancedDashboard.initialize();
        
        // Initialize complete dashboard with all features
        await this.completeDashboard.initialize();
        
        // Start API server if enabled
        if (this.enhanced.api) {
          await this.completeDashboard.startAPIServer();
        }
        
        // Enable ML predictions if configured
        if (this.enhanced.ml) {
          this.completeDashboard.enableMLPredictions();
        }
      }
      
      logger.info('📊 Coordination Dashboard initialized (100% operational)');
      
      this.emit('initialized', {
        enhanced: this.enhanced.enabled,
        features: [
          'realtime', 'visualization', 'predictions', 'analytics',
          'ml', 'api', 'export', 'history', 'alerts', 'patterns'
        ]
      });
      
    } catch (error) {
      logger.error('Failed to initialize enhanced dashboard:', error);
      // Graceful fallback
      this.enhanced.ml = false;
      this.enhanced.api = false;
    }
  }
  
  /**
   * Get current coordination status
   */
  async getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      agents: this.getAgentStatus(),
      locks: this.getLockStatus(),
      territories: this.getTerritoryStatus(),
      conflicts: this.getConflictStatus(),
      performance: this.getPerformanceMetrics()
    };
    
    this.lastSnapshot = status;
    return status;
  }
  
  /**
   * Get agent status
   */
  getAgentStatus() {
    const agents = this.agentIdentity.getActiveAgents();
    const stats = this.agentIdentity.getStats();
    
    return {
      total: stats.totalAgents,
      active: stats.activeAgents,
      inactive: stats.inactiveAgents,
      byDepartment: stats.byDepartment,
      byType: stats.byType,
      activeList: agents.map(a => ({
        id: a.id,
        type: a.type,
        name: a.name,
        department: a.department,
        status: a.status
      }))
    };
  }
  
  /**
   * Get lock status
   */
  getLockStatus() {
    const locks = this.fileLocking.getActiveLocks();
    const stats = this.fileLocking.getStats();
    
    return {
      activeLocks: locks.length,
      totalAcquired: stats.locksAcquired,
      totalReleased: stats.locksReleased,
      conflicts: stats.conflicts,
      timeouts: stats.timeouts,
      waitingAgents: stats.waitingAgents,
      locks: locks.map(l => ({
        file: l.filepath,
        agent: l.agentId,
        acquired: l.acquired,
        expiresIn: `${Math.round(l.expiresIn / 1000)}s`
      }))
    };
  }
  
  /**
   * Get territory status
   */
  getTerritoryStatus() {
    const territoryMap = this.territoryManager.getTerritoryMap();
    
    return {
      totalTerritories: territoryMap.statistics.totalTerritories,
      totalFiles: territoryMap.statistics.totalFiles,
      exclusiveFiles: territoryMap.statistics.exclusiveFiles,
      sharedFiles: territoryMap.statistics.sharedFiles,
      territories: territoryMap.territories,
      fileOwnership: territoryMap.fileOwnership
    };
  }
  
  /**
   * Get conflict status
   */
  getConflictStatus() {
    const lockStats = this.fileLocking.getStats();
    
    return {
      totalConflicts: lockStats.conflicts,
      currentConflicts: lockStats.waitingAgents,
      conflictRate: lockStats.locksAcquired > 0 
        ? (lockStats.conflicts / lockStats.locksAcquired * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const stats = this.safeFileOps.getStats();
    const lockStats = this.fileLocking.getStats();
    
    return {
      fileOperations: {
        activeLocks: stats.activeLocks.currentLocks,
        activeTransactions: stats.activeTransactions
      },
      efficiency: {
        parallelAgents: this.agentIdentity.getActiveAgents().length,
        utilizationRate: this.calculateUtilization(),
        averageLockTime: this.calculateAverageLockTime()
      }
    };
  }
  
  /**
   * Calculate utilization rate
   */
  calculateUtilization() {
    const activeAgents = this.agentIdentity.getActiveAgents().length;
    const activeLocks = this.fileLocking.getActiveLocks().length;
    
    if (activeAgents === 0) {return '0%';}
    
    const utilization = (activeLocks / activeAgents) * 100;
    return Math.min(100, utilization).toFixed(1) + '%';
  }
  
  /**
   * Calculate average lock time
   */
  calculateAverageLockTime() {
    const locks = this.fileLocking.getActiveLocks();
    
    if (locks.length === 0) {return '0ms';}
    
    const now = Date.now();
    const totalTime = locks.reduce((sum, lock) => {
      return sum + (now - new Date(lock.acquired).getTime());
    }, 0);
    
    const avg = totalTime / locks.length;
    
    if (avg < 1000) {return `${Math.round(avg)}ms`;}
    return `${(avg / 1000).toFixed(1)}s`;
  }
  
  /**
   * Display dashboard in console
   */
  async display() {
    const status = await this.getStatus();
    
    console.log('\n' + '='.repeat(60));
    console.log('🟢️  BUMBA COORDINATION DASHBOARD');
    console.log('='.repeat(60));
    
    // Agents Section
    console.log('\n🟢 AGENTS');
    console.log(`  Active: ${status.agents.active}/${status.agents.total}`);
    console.log('  By Department:');
    for (const [dept, count] of Object.entries(status.agents.byDepartment)) {
      console.log(`    ${dept}: ${count}`);
    }
    
    // Locks Section
    console.log('\n🟢 FILE LOCKS');
    console.log(`  Active Locks: ${status.locks.activeLocks}`);
    console.log(`  Total Operations: ${status.locks.totalAcquired}`);
    console.log(`  Conflicts: ${status.locks.conflicts}`);
    console.log(`  Waiting: ${status.locks.waitingAgents}`);
    
    if (status.locks.locks.length > 0) {
      console.log('  Current Locks:');
      status.locks.locks.slice(0, 5).forEach(lock => {
        console.log(`    • ${lock.file} (${lock.agent}) - expires in ${lock.expiresIn}`);
      });
    }
    
    // Territories Section
    console.log('\n🟢️  TERRITORIES');
    console.log(`  Active: ${status.territories.totalTerritories}`);
    console.log(`  Files Owned: ${status.territories.totalFiles}`);
    console.log(`  Exclusive: ${status.territories.exclusiveFiles}`);
    console.log(`  Shared: ${status.territories.sharedFiles}`);
    
    if (status.territories.territories.length > 0) {
      console.log('  Active Territories:');
      status.territories.territories.slice(0, 5).forEach(t => {
        console.log(`    • ${t.agent}: ${t.files} files (${t.type})`);
      });
    }
    
    // Conflicts Section
    console.log('\n🟡  CONFLICTS');
    console.log(`  Total: ${status.conflicts.totalConflicts}`);
    console.log(`  Current: ${status.conflicts.currentConflicts}`);
    console.log(`  Rate: ${status.conflicts.conflictRate}`);
    
    // Performance Section
    console.log('\n🟢 PERFORMANCE');
    console.log(`  Parallel Agents: ${status.performance.efficiency.parallelAgents}`);
    console.log(`  Utilization: ${status.performance.efficiency.utilizationRate}`);
    console.log(`  Avg Lock Time: ${status.performance.efficiency.averageLockTime}`);
    
    console.log('\n' + '='.repeat(60));
    console.log(`Last Updated: ${status.timestamp}`);
    console.log('='.repeat(60) + '\n');
  }
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh(intervalMs = 5000) {
    this.stopAutoRefresh(); // Clear any existing interval
    
    this.refreshInterval = setInterval(async () => {
      await this.display();
    }, intervalMs);
    
    logger.info(`🟢 Dashboard auto-refresh started (every ${intervalMs}ms)`);
  }
  
  /**
   * Refresh dashboard data
   */
  async refresh() {
    const status = await this.getStatus();
    this.lastSnapshot = status;
    logger.debug('🔄 Coordination Dashboard refreshed');
    return status;
  }
  
  /**
   * Get dashboard data
   */
  getData() {
    if (!this.lastSnapshot) {
      // Return current status if no snapshot exists
      return this.getStatus();
    }
    return this.lastSnapshot;
  }
  
  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      logger.info('🟢 Dashboard auto-refresh stopped');
    }
  }
  
  /**
   * Get safety report
   */
  async getSafetyReport() {
    const status = await this.getStatus();
    
    const report = {
      safe: true,
      issues: [],
      recommendations: []
    };
    
    // Check for conflicts
    if (status.conflicts.currentConflicts > 0) {
      report.safe = false;
      report.issues.push(`${status.conflicts.currentConflicts} agents waiting due to conflicts`);
      report.recommendations.push('Consider redistributing work to avoid conflicts');
    }
    
    // Check conflict rate
    const conflictRate = parseFloat(status.conflicts.conflictRate);
    if (conflictRate > 10) {
      report.safe = false;
      report.issues.push(`High conflict rate: ${status.conflicts.conflictRate}`);
      report.recommendations.push('Review territory allocation strategy');
    }
    
    // Check for lock timeouts
    if (status.locks.timeouts > 0) {
      report.issues.push(`${status.locks.timeouts} lock timeouts occurred`);
      report.recommendations.push('Increase lock timeout or optimize operations');
    }
    
    // Check utilization
    const utilization = parseFloat(status.performance.efficiency.utilizationRate);
    if (utilization < 50 && status.agents.active > 1) {
      report.recommendations.push('Low utilization - agents may be underutilized');
    }
    
    return report;
  }
  
  /**
   * Setup event forwarding between components
   */
  setupEventForwarding() {
    // Forward real-time events
    this.realtimeMonitor.on('update', (data) => {
      this.emit('realtime-update', data);
    });
    
    // Forward enhanced dashboard events
    this.enhancedDashboard.on('alert', (alert) => {
      this.emit('alert', alert);
      this.realtimeMonitor.trackEvent('alert', alert);
    });
    
    this.enhancedDashboard.on('update', (status) => {
      this.lastSnapshot = status;
      this.emit('enhanced-update', status);
    });
  }
  
  /**
   * Get enhanced status with predictions and analytics
   */
  async getEnhancedStatus() {
    if (!this.enhanced.enabled) {
      return await this.getStatus();
    }
    
    const baseStatus = await this.getStatus();
    const enhancedStatus = await this.enhancedDashboard.getEnhancedStatus();
    
    // Merge statuses
    const merged = {
      ...baseStatus,
      ...enhancedStatus,
      visualizations: this.enhanced.visualizations ? 
        await this.getVisualizations() : null
    };
    
    // Track in real-time monitor
    this.realtimeMonitor.trackMetric('status_update', 1, { type: 'enhanced' });
    
    return merged;
  }
  
  /**
   * Get visualizations
   */
  async getVisualizations() {
    const status = this.lastSnapshot || await this.getStatus();
    
    return {
      agentNetwork: this.visualizer.visualizeAgentNetwork(
        status.agents.activeList || [],
        []
      ),
      timeline: this.visualizer.visualizeTimeline(
        this.realtimeMonitor.buffers.events.slice(-50),
        60000
      ),
      metrics: this.visualizer.createBarChart(
        {
          'Agents': status.agents.active,
          'Locks': status.locks.activeLocks,
          'Conflicts': status.conflicts.totalConflicts,
          'Territories': status.territories.totalTerritories
        },
        'COORDINATION METRICS'
      ),
      health: this.visualizer.createGauge(
        this.enhancedDashboard.getSystemHealth().score,
        0,
        100,
        'SYSTEM HEALTH'
      ),
      summary: this.visualizer.createDashboardSummary(status)
    };
  }
  
  /**
   * Display enhanced dashboard
   */
  async displayEnhanced() {
    const status = await this.getEnhancedStatus();
    
    // Clear console
    console.clear();
    
    // Display visualizations
    if (status.visualizations) {
      console.log(status.visualizations.summary);
      
      if (status.visualizations.metrics) {
        console.log('\n' + status.visualizations.metrics);
      }
      
      if (status.visualizations.health) {
        console.log('\n' + status.visualizations.health);
      }
    }
    
    // Display predictions
    if (status.predictions) {
      console.log('\n📮 PREDICTIONS');
      console.log(`  Next Conflict: ${status.predictions.nextConflict.probability.toFixed(2)} probability`);
      console.log(`  Bottlenecks: ${status.predictions.bottlenecks.length} detected`);
      console.log(`  Utilization Forecast: ${(status.predictions.utilization.forecast * 100).toFixed(1)}%`);
    }
    
    // Display real-time metrics
    if (status.realtime) {
      console.log('\n🟢 REAL-TIME');
      console.log(`  Agent Activity: ${status.realtime.agentActivity.rate.toFixed(2)}/s`);
      console.log(`  Lock Velocity: ${status.realtime.lockVelocity.velocity.toFixed(2)}/s`);
      console.log(`  Throughput: ${status.realtime.throughput.perSecond.toFixed(2)} ops/s`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Last Updated: ${status.timestamp}`);
  }
  
  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(channel, callback) {
    return this.realtimeMonitor.subscribe(channel, callback);
  }
  
  /**
   * Track custom event
   */
  trackEvent(type, data) {
    return this.realtimeMonitor.trackEvent(type, data);
  }
  
  /**
   * Track custom metric
   */
  trackMetric(name, value, tags = {}) {
    return this.realtimeMonitor.trackMetric(name, value, tags);
  }
  
  /**
   * Get time series data
   */
  getTimeSeries(metric, duration = 3600000) {
    return this.realtimeMonitor.getTimeSeries(metric, duration);
  }
  
  /**
   * Create custom visualization
   */
  createVisualization(type, data, options = {}) {
    switch (type) {
      case 'bar':
        return this.visualizer.createBarChart(data, options.title);
      case 'line':
        return this.visualizer.createLineGraph(data, options.title);
      case 'heatmap':
        return this.visualizer.createHeatMap(
          data.matrix,
          data.rowLabels,
          data.colLabels,
          options.title
        );
      case 'gauge':
        return this.visualizer.createGauge(
          data.value,
          data.min,
          data.max,
          options.title
        );
      case 'sparkline':
        return this.visualizer.createSparkline(data, options.width);
      default:
        return null;
    }
  }
  
  /**
   * Get analytics insights
   */
  async getAnalytics() {
    if (!this.enhanced.analytics) {
      return { available: false };
    }
    
    const analytics = await this.enhancedDashboard.getAnalytics();
    
    return {
      available: true,
      patterns: analytics.patterns,
      anomalies: analytics.anomalies,
      insights: analytics.insights,
      correlations: analytics.correlations
    };
  }
  
  /**
   * Get predictive recommendations
   */
  async getRecommendations() {
    if (!this.enhanced.predictions) {
      return [];
    }
    
    return await this.enhancedDashboard.getRecommendations();
  }
  
  /**
   * Enable/disable enhanced features
   */
  setEnhancedMode(enabled) {
    this.enhanced.enabled = enabled;
    
    if (enabled) {
      this.enhancedDashboard.startMonitoring();
    } else {
      this.enhancedDashboard.stopMonitoring();
    }
    
    logger.info(`Enhanced mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get dashboard metrics
   */
  getDashboardMetrics() {
    return {
      base: {
        snapshots: this.lastSnapshot ? 1 : 0,
        refreshRate: this.refreshInterval ? 'active' : 'inactive'
      },
      realtime: this.realtimeMonitor.getMetrics(),
      enhanced: this.enhancedDashboard.getMetrics(),
      features: {
        streaming: this.enhanced.streaming,
        visualizations: this.enhanced.visualizations,
        predictions: this.enhanced.predictions,
        analytics: this.enhanced.analytics
      }
    };
  }
  
  /**
   * Export dashboard data
   */
  async exportData(format = 'json') {
    const data = {
      timestamp: Date.now(),
      status: await this.getEnhancedStatus(),
      analytics: await this.getAnalytics(),
      timeSeries: {
        concurrency: this.getTimeSeries('concurrency', 3600000),
        throughput: this.getTimeSeries('throughput', 3600000),
        latency: this.getTimeSeries('latency', 3600000),
        errorRate: this.getTimeSeries('errorRate', 3600000)
      },
      metrics: this.getDashboardMetrics()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    // Could add other formats like CSV, etc.
    return data;
  }
  
  /**
   * Get ML predictions from complete dashboard
   */
  async getMLPredictions() {
    if (!this.enhanced.ml || !this.completeDashboard) {
      return null;
    }
    
    return await this.completeDashboard.getMLPredictions();
  }
  
  /**
   * Get historical data from complete dashboard
   */
  async getHistoricalData(range = '1h') {
    if (!this.completeDashboard) {
      return null;
    }
    
    return await this.completeDashboard.getHistoricalData(range);
  }
  
  /**
   * Export dashboard data in various formats
   */
  async exportDashboard(format = 'json') {
    if (!this.completeDashboard) {
      return this.export(format);
    }
    
    return await this.completeDashboard.exportData(format);
  }
  
  /**
   * Get pattern analysis from ML engine
   */
  async getPatternAnalysis() {
    if (!this.completeDashboard) {
      return null;
    }
    
    return await this.completeDashboard.analyzePatterns();
  }
  
  /**
   * Get advanced visualizations
   */
  async getAdvancedVisualizations() {
    if (!this.completeDashboard) {
      return await this.getVisualizations();
    }
    
    return await this.completeDashboard.generateVisualizations();
  }
  
  /**
   * Access the web dashboard URL
   */
  getWebDashboardURL() {
    if (!this.enhanced.api || !this.completeDashboard) {
      return null;
    }
    
    return this.completeDashboard.getAPIEndpoint();
  }
  
  /**
   * Get real-time stream
   */
  getRealTimeStream() {
    if (!this.completeDashboard) {
      return null;
    }
    
    return this.completeDashboard.getStreamingEndpoint();
  }
  
  /**
   * Set alert thresholds
   */
  setAlertThresholds(thresholds) {
    if (this.completeDashboard) {
      this.completeDashboard.setAlertThresholds(thresholds);
    }
  }
  
  /**
   * Get comprehensive metrics
   */
  async getComprehensiveMetrics() {
    const baseMetrics = this.getDashboardMetrics();
    
    if (!this.completeDashboard) {
      return baseMetrics;
    }
    
    const advancedMetrics = await this.completeDashboard.getMetrics();
    
    return {
      ...baseMetrics,
      ...advancedMetrics,
      ml: await this.getMLPredictions(),
      patterns: await this.getPatternAnalysis()
    };
  }
  
  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stopAutoRefresh();
    this.enhancedDashboard.stopMonitoring();
    this.realtimeMonitor.cleanup();
    
    if (this.completeDashboard) {
      await this.completeDashboard.cleanup();
    }
    
    logger.info('📊 Coordination Dashboard cleaned up (100% operational)');
  }
}

// Singleton
let instance = null;

module.exports = {
  CoordinationDashboard,
  getInstance: () => {
    if (!instance) {
      instance = new CoordinationDashboard();
    }
    return instance;
  }
};