/**
 * BUMBA Enhanced Coordination Dashboard
 * Integrates the original dashboard with the new blessed UI
 */

const { EventEmitter } = require('events');
const { DashboardDataSource, getInstance: getDataSource } = require('./dashboard-data-source');
const CoordinationDashboardUI = require('./coordination-dashboard-ui');
const RealTimeUpdater = require('./real-time-updater');
const DashboardLayouts = require('./dashboard-layouts');
const DashboardWidgets = require('./dashboard-widgets');

class EnhancedCoordinationDashboard extends EventEmitter {
  constructor() {
    super();
    
    // Data source without circular dependency
    this.dataSource = null;
    
    // UI components
    this.ui = null;
    this.realTimeUpdater = null;
    this.layouts = null;
    this.widgets = null;
    
    // State
    this.isRunning = false;
    this.mode = 'terminal'; // 'terminal' or 'console'
    this.currentLayout = 'default';
  }
  
  /**
   * Initialize the enhanced dashboard
   */
  async initialize(options = {}) {
    // Initialize data source
    this.dataSource = getDataSource();
    
    if (options.mode === 'console') {
      // Fallback to console mode
      return this.initializeConsoleMode();
    }
    
    // Initialize blessed UI mode
    await this.initializeTerminalMode(options);
    
    return this;
  }
  
  /**
   * Initialize terminal UI mode
   */
  async initializeTerminalMode(options = {}) {
    try {
      // Create UI
      this.ui = new CoordinationDashboardUI(this.dataSource);
      
      // Create real-time updater
      this.realTimeUpdater = new RealTimeUpdater(this.dataSource);
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Initialize UI
      await this.ui.initialize();
      
      // Start real-time updates
      this.realTimeUpdater.start();
      
      this.mode = 'terminal';
      this.isRunning = true;
      
      console.log('Enhanced Coordination Dashboard initialized in terminal mode');
      
    } catch (error) {
      console.error('Failed to initialize terminal mode:', error);
      console.log('Falling back to console mode...');
      return this.initializeConsoleMode();
    }
  }
  
  /**
   * Initialize console mode (fallback)
   */
  initializeConsoleMode() {
    this.mode = 'console';
    this.isRunning = true;
    
    // Use original dashboard display
    this.dataSource.startAutoRefresh(5000);
    
    console.log('Coordination Dashboard initialized in console mode');
    return this;
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    if (!this.realTimeUpdater || !this.ui) {
      return;
    }
    
    // Handle real-time updates
    this.realTimeUpdater.on('update', (data) => {
      if (this.ui && this.ui.screen) {
        // UI will handle the update automatically
      }
    });
    
    // Handle alerts
    this.realTimeUpdater.on('alert', (alert) => {
      if (this.ui && this.ui.widgets.conflictMonitor) {
        this.ui.widgets.conflictMonitor.log(
          `${this.getAlertIcon(alert.level)} ${alert.message}`
        );
      }
    });
    
    // Handle errors
    this.realTimeUpdater.on('error', (error) => {
      console.error('Real-time updater error:', error);
    });
    
    // Handle UI cleanup
    if (this.ui) {
      this.ui.on('cleanup', () => {
        this.shutdown();
      });
    }
  }
  
  /**
   * Start the dashboard
   */
  async start() {
    if (this.isRunning) {
      console.log('Dashboard is already running');
      return;
    }
    
    if (this.mode === 'terminal' && this.ui) {
      await this.ui.initialize();
      this.realTimeUpdater.start();
    } else {
      this.dataSource.startAutoRefresh(5000);
    }
    
    this.isRunning = true;
  }
  
  /**
   * Stop the dashboard
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    if (this.mode === 'terminal') {
      if (this.realTimeUpdater) {
        this.realTimeUpdater.stop();
      }
      if (this.ui) {
        this.ui.cleanup();
      }
    } else {
      this.dataSource.stopAutoRefresh();
    }
    
    this.isRunning = false;
  }
  
  /**
   * Switch dashboard layout
   */
  switchLayout(layoutName) {
    if (this.mode !== 'terminal' || !this.ui) {
      console.log('Layout switching only available in terminal mode');
      return;
    }
    
    if (!this.layouts) {
      this.layouts = new DashboardLayouts(this.ui.grid, this.ui.screen);
    }
    
    try {
      const widgets = this.layouts.switchLayout(layoutName);
      this.ui.widgets = widgets;
      this.currentLayout = layoutName;
      this.ui.screen.render();
      
      console.log(`Switched to ${layoutName} layout`);
    } catch (error) {
      console.error(`Failed to switch layout: ${error.message}`);
    }
  }
  
  /**
   * Get dashboard status
   */
  async getStatus() {
    return await this.dataSource.getStatus();
  }
  
  /**
   * Get safety report
   */
  async getSafetyReport() {
    return await this.dataSource.getSafetyReport();
  }
  
  /**
   * Get real-time metrics
   */
  getMetrics() {
    if (this.realTimeUpdater) {
      return this.realTimeUpdater.getMetrics();
    }
    return null;
  }
  
  /**
   * Get historical data
   */
  getHistory(duration) {
    if (this.realTimeUpdater) {
      return this.realTimeUpdater.getHistory(duration);
    }
    return null;
  }
  
  /**
   * Get current alerts
   */
  getAlerts() {
    if (this.realTimeUpdater) {
      return this.realTimeUpdater.getAlerts();
    }
    return [];
  }
  
  /**
   * Set update interval
   */
  setUpdateInterval(interval) {
    if (this.realTimeUpdater) {
      this.realTimeUpdater.setUpdateInterval(interval);
    } else if (this.mode === 'console') {
      this.dataSource.stopAutoRefresh();
      this.dataSource.startAutoRefresh(interval);
    }
  }
  
  /**
   * Set alert threshold
   */
  setAlertThreshold(metric, level, value) {
    if (this.realTimeUpdater) {
      this.realTimeUpdater.setThreshold(metric, level, value);
    }
  }
  
  /**
   * Get alert icon
   */
  getAlertIcon(level) {
    const icons = {
      critical: '🔴',
      warning: '🟠️',
      info: 'ℹ️',
      success: '🏁'
    };
    return icons[level] || '•';
  }
  
  /**
   * Display in console (fallback)
   */
  async displayConsole() {
    await this.dataSource.display();
  }
  
  /**
   * Refresh dashboard
   */
  async refresh() {
    if (this.ui) {
      await this.ui.refresh();
    } else {
      await this.dataSource.refresh();
    }
  }
  
  /**
   * Shutdown dashboard
   */
  shutdown() {
    this.stop();
    
    if (this.ui) {
      this.ui.cleanup();
    }
    
    if (this.realTimeUpdater) {
      this.realTimeUpdater.stop();
    }
    
    console.log('Enhanced Coordination Dashboard shutdown complete');
  }
  
  /**
   * Get dashboard info
   */
  getInfo() {
    return {
      mode: this.mode,
      isRunning: this.isRunning,
      currentLayout: this.currentLayout,
      hasUI: !!this.ui,
      hasRealTimeUpdates: !!this.realTimeUpdater,
      updateInterval: this.realTimeUpdater ? this.realTimeUpdater.updateInterval : 5000,
      alertCount: this.realTimeUpdater ? this.realTimeUpdater.alerts.size : 0,
      historySize: this.realTimeUpdater ? this.realTimeUpdater.history.timestamps.length : 0
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  EnhancedCoordinationDashboard,
  getInstance: () => {
    if (!instance) {
      instance = new EnhancedCoordinationDashboard();
    }
    return instance;
  }
};