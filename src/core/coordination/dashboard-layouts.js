/**
 * BUMBA Dashboard Layouts
 * Multiple dashboard layouts for different monitoring needs
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');

class DashboardLayouts {
  constructor(grid, screen) {
    this.grid = grid;
    this.screen = screen;
    this.currentLayout = 'default';
    this.widgets = {};
    
    // Define available layouts
    this.layouts = {
      default: this.createDefaultLayout.bind(this),
      agents: this.createAgentsLayout.bind(this),
      locks: this.createLocksLayout.bind(this),
      territories: this.createTerritoriesLayout.bind(this),
      performance: this.createPerformanceLayout.bind(this),
      conflicts: this.createConflictsLayout.bind(this),
      compact: this.createCompactLayout.bind(this)
    };
  }
  
  /**
   * Switch to a different layout
   */
  switchLayout(layoutName) {
    if (!this.layouts[layoutName]) {
      throw new Error(`Unknown layout: ${layoutName}`);
    }
    
    // Clear current widgets
    this.clearWidgets();
    
    // Create new layout
    this.currentLayout = layoutName;
    this.widgets = this.layouts[layoutName]();
    
    return this.widgets;
  }
  
  /**
   * Clear all widgets
   */
  clearWidgets() {
    Object.values(this.widgets).forEach(widget => {
      if (widget && widget.destroy) {
        widget.destroy();
      }
    });
    this.widgets = {};
  }
  
  /**
   * Default balanced layout
   */
  createDefaultLayout() {
    const widgets = {};
    
    // Header
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 🟡 BUMBA COORDINATION DASHBOARD - DEFAULT VIEW ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true
      }
    });
    
    // Four main quadrants
    widgets.agentStatus = this.grid.set(1, 0, 5, 6, contrib.table, {
      label: ' 👥 Agent Status ',
      columnSpacing: 3,
      columnWidth: [20, 10, 10],
      interactive: true,
      keys: true,
      vi: true
    });
    
    widgets.lockStatus = this.grid.set(1, 6, 5, 6, blessed.list, {
      label: ' 🔒 Active Locks ',
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        selected: { bg: 'blue' }
      },
      interactive: true,
      keys: true,
      vi: true
    });
    
    widgets.territoryMap = this.grid.set(6, 0, 5, 6, blessed.box, {
      label: ' 🗺️  Territory Map ',
      border: { type: 'line' },
      scrollable: true,
      alwaysScroll: true
    });
    
    widgets.conflictLog = this.grid.set(6, 6, 5, 6, contrib.log, {
      label: ' 🟠️  Conflicts & Alerts ',
      border: { type: 'line' },
      bufferLength: 100
    });
    
    // Status bar
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: {
        fg: 'white',
        bg: 'black'
      }
    });
    
    return widgets;
  }
  
  /**
   * Agents-focused layout
   */
  createAgentsLayout() {
    const widgets = {};
    
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 👥 AGENT MONITORING VIEW ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'green',
        bold: true
      }
    });
    
    // Large agent table
    widgets.agentTable = this.grid.set(1, 0, 6, 8, contrib.table, {
      label: ' Active Agents ',
      columnSpacing: 2,
      columnWidth: [10, 15, 15, 10, 10],
      interactive: true,
      keys: true,
      vi: true
    });
    
    // Agent details
    widgets.agentDetails = this.grid.set(1, 8, 6, 4, blessed.box, {
      label: ' Agent Details ',
      border: { type: 'line' },
      scrollable: true
    });
    
    // Department breakdown
    widgets.departmentBar = this.grid.set(7, 0, 4, 6, contrib.bar, {
      label: ' Department Distribution ',
      barWidth: 8,
      barSpacing: 4,
      maxHeight: 10
    });
    
    // Agent activity log
    widgets.activityLog = this.grid.set(7, 6, 4, 6, contrib.log, {
      label: ' Agent Activity ',
      bufferLength: 50
    });
    
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: { fg: 'white', bg: 'black' }
    });
    
    return widgets;
  }
  
  /**
   * Locks-focused layout
   */
  createLocksLayout() {
    const widgets = {};
    
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 🔒 LOCK MONITORING VIEW ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'magenta',
        bold: true
      }
    });
    
    // Active locks list
    widgets.activeLocks = this.grid.set(1, 0, 7, 6, blessed.list, {
      label: ' Active Locks ',
      border: { type: 'line' },
      style: {
        selected: { bg: 'blue' }
      },
      interactive: true,
      keys: true,
      vi: true
    });
    
    // Lock details
    widgets.lockDetails = this.grid.set(1, 6, 7, 6, blessed.box, {
      label: ' Lock Details ',
      border: { type: 'line' },
      scrollable: true
    });
    
    // Lock statistics
    widgets.lockStats = this.grid.set(8, 0, 3, 4, blessed.box, {
      label: ' Statistics ',
      border: { type: 'line' }
    });
    
    // Conflict history
    widgets.conflictHistory = this.grid.set(8, 4, 3, 4, contrib.line, {
      label: ' Conflict Trend ',
      showLegend: false,
      wholeNumbersOnly: true
    });
    
    // Wait queue
    widgets.waitQueue = this.grid.set(8, 8, 3, 4, blessed.list, {
      label: ' Wait Queue ',
      border: { type: 'line' }
    });
    
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: { fg: 'white', bg: 'black' }
    });
    
    return widgets;
  }
  
  /**
   * Territories-focused layout
   */
  createTerritoriesLayout() {
    const widgets = {};
    
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 🗺️  TERRITORY MANAGEMENT VIEW ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'yellow',
        bold: true
      }
    });
    
    // Territory map (large)
    widgets.territoryMap = this.grid.set(1, 0, 7, 8, blessed.box, {
      label: ' Territory Map ',
      border: { type: 'line' },
      scrollable: true
    });
    
    // Territory list
    widgets.territoryList = this.grid.set(1, 8, 7, 4, blessed.list, {
      label: ' Territories ',
      border: { type: 'line' },
      interactive: true,
      keys: true
    });
    
    // File ownership breakdown
    widgets.fileOwnership = this.grid.set(8, 0, 3, 6, contrib.table, {
      label: ' File Ownership ',
      columnSpacing: 2,
      columnWidth: [20, 15, 10]
    });
    
    // Territory conflicts
    widgets.territoryConflicts = this.grid.set(8, 6, 3, 6, contrib.log, {
      label: ' Territory Conflicts ',
      bufferLength: 30
    });
    
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: { fg: 'white', bg: 'black' }
    });
    
    return widgets;
  }
  
  /**
   * Performance-focused layout
   */
  createPerformanceLayout() {
    const widgets = {};
    
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 📊 PERFORMANCE MONITORING VIEW ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'red',
        bold: true
      }
    });
    
    // CPU gauge
    widgets.cpuGauge = this.grid.set(1, 0, 3, 3, contrib.gauge, {
      label: ' CPU Usage ',
      percent: 0
    });
    
    // Memory gauge
    widgets.memGauge = this.grid.set(1, 3, 3, 3, contrib.gauge, {
      label: ' Memory Usage ',
      percent: 0
    });
    
    // Disk gauge
    widgets.diskGauge = this.grid.set(1, 6, 3, 3, contrib.gauge, {
      label: ' Disk Usage ',
      percent: 0
    });
    
    // Network gauge
    widgets.netGauge = this.grid.set(1, 9, 3, 3, contrib.gauge, {
      label: ' Network Usage ',
      percent: 0
    });
    
    // Performance chart (large)
    widgets.perfChart = this.grid.set(4, 0, 5, 12, contrib.line, {
      label: ' Performance History ',
      showLegend: true,
      legend: { width: 15 }
    });
    
    // Performance metrics
    widgets.perfMetrics = this.grid.set(9, 0, 2, 6, blessed.box, {
      label: ' Metrics ',
      border: { type: 'line' }
    });
    
    // Performance alerts
    widgets.perfAlerts = this.grid.set(9, 6, 2, 6, contrib.log, {
      label: ' Performance Alerts ',
      bufferLength: 20
    });
    
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: { fg: 'white', bg: 'black' }
    });
    
    return widgets;
  }
  
  /**
   * Conflicts-focused layout
   */
  createConflictsLayout() {
    const widgets = {};
    
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 🟠️  CONFLICT RESOLUTION VIEW ',
      align: 'center',
      style: {
        fg: 'black',
        bg: 'yellow',
        bold: true
      }
    });
    
    // Active conflicts (large)
    widgets.activeConflicts = this.grid.set(1, 0, 6, 8, blessed.list, {
      label: ' Active Conflicts ',
      border: { type: 'line' },
      style: {
        border: { fg: 'red' },
        selected: { bg: 'red' }
      },
      interactive: true,
      keys: true
    });
    
    // Conflict details
    widgets.conflictDetails = this.grid.set(1, 8, 6, 4, blessed.box, {
      label: ' Conflict Details ',
      border: { type: 'line' },
      scrollable: true
    });
    
    // Resolution options
    widgets.resolutionOptions = this.grid.set(7, 0, 4, 6, blessed.list, {
      label: ' Resolution Options ',
      border: { type: 'line' },
      interactive: true
    });
    
    // Conflict history
    widgets.conflictHistory = this.grid.set(7, 6, 4, 6, contrib.log, {
      label: ' Conflict History ',
      bufferLength: 50
    });
    
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: { fg: 'white', bg: 'black' }
    });
    
    return widgets;
  }
  
  /**
   * Compact layout for small terminals
   */
  createCompactLayout() {
    const widgets = {};
    
    // Minimal header
    widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' BUMBA DASHBOARD (COMPACT) ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'blue'
      }
    });
    
    // Combined status
    widgets.status = this.grid.set(1, 0, 4, 12, blessed.box, {
      label: ' System Status ',
      border: { type: 'line' },
      scrollable: true
    });
    
    // Combined metrics
    widgets.metrics = this.grid.set(5, 0, 3, 12, blessed.box, {
      label: ' Metrics ',
      border: { type: 'line' }
    });
    
    // Alerts only
    widgets.alerts = this.grid.set(8, 0, 3, 12, contrib.log, {
      label: ' Alerts ',
      bufferLength: 20
    });
    
    widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      style: { fg: 'white', bg: 'black' }
    });
    
    return widgets;
  }
  
  /**
   * Get current layout name
   */
  getCurrentLayout() {
    return this.currentLayout;
  }
  
  /**
   * Get available layout names
   */
  getAvailableLayouts() {
    return Object.keys(this.layouts);
  }
  
  /**
   * Get current widgets
   */
  getWidgets() {
    return this.widgets;
  }
}

module.exports = DashboardLayouts;