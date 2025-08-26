/**
 * BUMBA Coordination Dashboard UI
 * Real-time blessed-based terminal dashboard
 * Sprint 1: Core Dashboard Implementation
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { EventEmitter } = require('events');

class CoordinationDashboardUI extends EventEmitter {
  constructor(coordinationDashboard) {
    super();
    
    this.dashboard = coordinationDashboard;
    this.screen = null;
    this.grid = null;
    this.widgets = {};
    this.refreshInterval = null;
    this.updateRate = 1000; // 1 second default
    
    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = Date.now();
    
    // Color scheme
    this.colors = {
      primary: 'cyan',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      text: 'white',
      border: 'cyan'
    };
  }
  
  /**
   * Initialize the dashboard UI
   */
  async initialize() {
    this.createScreen();
    this.createLayout();
    this.createWidgets();
    this.setupEventHandlers();
    this.startDataUpdates();
    
    // Initial render
    await this.updateAllWidgets();
    this.screen.render();
    
    this.emit('initialized');
    return this;
  }
  
  /**
   * Create the blessed screen
   */
  createScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'BUMBA Coordination Dashboard',
      fullUnicode: true,
      dockBorders: true,
      autoPadding: true,
      warnings: true
    });
    
    // Set screen properties
    this.screen.key(['C-c'], () => {
      this.cleanup();
      process.exit(0);
    });
  }
  
  /**
   * Create the grid layout
   */
  createLayout() {
    // Create a 12x12 grid for flexible layout
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });
  }
  
  /**
   * Create all dashboard widgets
   */
  createWidgets() {
    // Header (12x1)
    this.widgets.header = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 🟡 BUMBA COORDINATION DASHBOARD ',
      align: 'center',
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true
      }
    });
    
    // Agent Status Widget (4x3)
    this.widgets.agentStatus = this.grid.set(1, 0, 3, 4, contrib.table, {
      label: ' 👥 Agent Status ',
      columnSpacing: 3,
      columnWidth: [15, 8, 8],
      interactive: true,
      keys: true,
      vi: true,
      style: {
        border: { fg: this.colors.border },
        header: { fg: 'cyan', bold: true },
        cell: { fg: 'white' }
      }
    });
    
    // Lock Status Widget (4x3)
    this.widgets.lockStatus = this.grid.set(1, 4, 3, 4, blessed.box, {
      label: ' 🔒 Lock Status ',
      border: { type: 'line' },
      style: {
        border: { fg: this.colors.border }
      },
      scrollable: true,
      alwaysScroll: true,
      vi: true,
      keys: true
    });
    
    // Performance Gauges (4x3)
    this.widgets.cpuGauge = this.grid.set(1, 8, 1.5, 2, contrib.gauge, {
      label: ' CPU ',
      percent: 0,
      stroke: 'green',
      fill: 'white'
    });
    
    this.widgets.memGauge = this.grid.set(1, 10, 1.5, 2, contrib.gauge, {
      label: ' Memory ',
      percent: 0,
      stroke: 'yellow',
      fill: 'white'
    });
    
    this.widgets.diskGauge = this.grid.set(2.5, 8, 1.5, 2, contrib.gauge, {
      label: ' Disk ',
      percent: 0,
      stroke: 'magenta',
      fill: 'white'
    });
    
    this.widgets.netGauge = this.grid.set(2.5, 10, 1.5, 2, contrib.gauge, {
      label: ' Network ',
      percent: 0,
      stroke: 'cyan',
      fill: 'white'
    });
    
    // Territory Map (6x4)
    this.widgets.territoryMap = this.grid.set(4, 0, 4, 6, blessed.box, {
      label: ' 🗺️  Territory Map ',
      border: { type: 'line' },
      style: {
        border: { fg: this.colors.border }
      },
      scrollable: true,
      alwaysScroll: true,
      vi: true,
      keys: true
    });
    
    // Conflict Monitor (6x4)
    this.widgets.conflictMonitor = this.grid.set(4, 6, 4, 6, contrib.log, {
      label: ' 🟠️  Conflicts & Alerts ',
      border: { type: 'line' },
      style: {
        border: { fg: this.colors.warning }
      },
      bufferLength: 50
    });
    
    // Performance Chart (12x3)
    this.widgets.performanceChart = this.grid.set(8, 0, 3, 12, contrib.line, {
      label: ' 📈 Performance Metrics ',
      showLegend: true,
      legend: { width: 20 },
      wholeNumbersOnly: false,
      style: {
        line: 'cyan',
        text: 'white',
        baseline: 'white',
        border: { fg: this.colors.border }
      }
    });
    
    // Status Bar (12x1)
    this.widgets.statusBar = this.grid.set(11, 0, 1, 12, blessed.box, {
      content: '',
      style: {
        fg: 'white',
        bg: 'black'
      }
    });
    
    // Initialize performance data
    this.performanceData = {
      title: 'System Performance',
      x: [],
      y: [],
      maxDataPoints: 60 // 1 minute of data at 1 second intervals
    };
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Navigation keys
    this.screen.key(['tab'], () => {
      this.focusNext();
    });
    
    this.screen.key(['S-tab'], () => {
      this.focusPrevious();
    });
    
    // Function keys for views
    this.screen.key(['f1'], () => {
      this.showHelp();
    });
    
    this.screen.key(['f2'], () => {
      this.toggleView('agents');
    });
    
    this.screen.key(['f3'], () => {
      this.toggleView('locks');
    });
    
    this.screen.key(['f4'], () => {
      this.toggleView('territories');
    });
    
    this.screen.key(['f5'], () => {
      this.refresh();
    });
    
    // Quick actions
    this.screen.key(['r'], () => {
      this.refresh();
    });
    
    this.screen.key(['q', 'escape'], () => {
      this.cleanup();
      process.exit(0);
    });
    
    this.screen.key(['p'], () => {
      this.togglePause();
    });
    
    // Handle resize
    this.screen.on('resize', () => {
      this.handleResize();
    });
  }
  
  /**
   * Start automatic data updates
   */
  startDataUpdates() {
    this.refreshInterval = setInterval(async () => {
      await this.updateAllWidgets();
      this.screen.render();
    }, this.updateRate);
  }
  
  /**
   * Update all widgets with latest data
   */
  async updateAllWidgets() {
    try {
      const status = await this.dashboard.getStatus();
      
      // Update agent status table
      this.updateAgentStatus(status.agents);
      
      // Update lock status
      this.updateLockStatus(status.locks);
      
      // Update territory map
      this.updateTerritoryMap(status.territories);
      
      // Update conflict monitor
      this.updateConflictMonitor(status.conflicts);
      
      // Update performance gauges
      this.updatePerformanceGauges(status.performance);
      
      // Update performance chart
      this.updatePerformanceChart(status.performance);
      
      // Update status bar
      this.updateStatusBar(status);
      
      this.renderCount++;
      
    } catch (error) {
      this.widgets.conflictMonitor.log(`ERROR: ${error.message}`);
    }
  }
  
  /**
   * Update agent status table
   */
  updateAgentStatus(agentData) {
    const tableData = {
      headers: ['Department', 'Active', 'Status'],
      data: []
    };
    
    // Add department summary
    if (agentData.byDepartment) {
      for (const [dept, count] of Object.entries(agentData.byDepartment)) {
        const status = count > 0 ? 'ACTIVE' : 'IDLE';
        const color = count > 0 ? 'green' : 'gray';
        tableData.data.push([dept, count.toString(), status]);
      }
    }
    
    // Add total row
    tableData.data.push([
      'TOTAL',
      `${agentData.active}/${agentData.total}`,
      agentData.active > 0 ? 'OPERATIONAL' : 'STOPPED'
    ]);
    
    this.widgets.agentStatus.setData(tableData);
  }
  
  /**
   * Update lock status display
   */
  updateLockStatus(lockData) {
    let content = '';
    
    // Summary
    content += `{cyan-fg}Active Locks:{/} ${lockData.activeLocks}\n`;
    content += `{green-fg}Released:{/} ${lockData.totalReleased}\n`;
    content += `{yellow-fg}Conflicts:{/} ${lockData.conflicts}\n`;
    content += `{red-fg}Timeouts:{/} ${lockData.timeouts}\n`;
    content += `{blue-fg}Waiting:{/} ${lockData.waitingAgents}\n\n`;
    
    // Current locks
    if (lockData.locks && lockData.locks.length > 0) {
      content += '{cyan-fg}Current Locks:{/}\n';
      content += '─'.repeat(30) + '\n';
      
      lockData.locks.forEach(lock => {
        const fileName = lock.file.split('/').pop();
        content += `📄 {white-fg}${fileName}{/}\n`;
        content += `   Agent: {cyan-fg}${lock.agent}{/}\n`;
        content += `   Expires: {yellow-fg}${lock.expiresIn}{/}\n\n`;
      });
    } else {
      content += '{gray-fg}No active locks{/}';
    }
    
    this.widgets.lockStatus.setContent(content);
  }
  
  /**
   * Update territory map
   */
  updateTerritoryMap(territoryData) {
    let content = '';
    
    // Summary stats
    content += `{cyan-fg}Territories:{/} ${territoryData.totalTerritories}\n`;
    content += `{green-fg}Total Files:{/} ${territoryData.totalFiles}\n`;
    content += `{yellow-fg}Exclusive:{/} ${territoryData.exclusiveFiles}\n`;
    content += `{blue-fg}Shared:{/} ${territoryData.sharedFiles}\n\n`;
    
    // Territory visualization
    if (territoryData.territories && territoryData.territories.length > 0) {
      content += '{cyan-fg}Active Territories:{/}\n';
      content += '─'.repeat(40) + '\n';
      
      territoryData.territories.forEach(territory => {
        const icon = territory.type === 'exclusive' ? '🔒' : '🔓';
        content += `${icon} {white-fg}${territory.agent}{/}\n`;
        content += `   Files: {cyan-fg}${territory.files}{/} | Type: {yellow-fg}${territory.type}{/}\n`;
      });
    }
    
    this.widgets.territoryMap.setContent(content);
  }
  
  /**
   * Update conflict monitor
   */
  updateConflictMonitor(conflictData) {
    // Add alerts for high conflict rate
    const conflictRate = parseFloat(conflictData.conflictRate);
    
    if (conflictRate > 10) {
      this.widgets.conflictMonitor.log(`🟠️  HIGH CONFLICT RATE: ${conflictData.conflictRate}`);
    }
    
    if (conflictData.currentConflicts > 0) {
      this.widgets.conflictMonitor.log(`🔴 ${conflictData.currentConflicts} agents waiting due to conflicts`);
    }
    
    // Add periodic status
    if (this.renderCount % 10 === 0) {
      this.widgets.conflictMonitor.log(`🏁 System operational - Conflicts: ${conflictData.totalConflicts}`);
    }
  }
  
  /**
   * Update performance gauges
   */
  updatePerformanceGauges(perfData) {
    // Simulate system metrics (in production, get real metrics)
    const cpuUsage = Math.floor(Math.random() * 30 + 20); // 20-50%
    const memUsage = Math.floor(Math.random() * 40 + 30); // 30-70%
    const diskUsage = Math.floor(Math.random() * 20 + 10); // 10-30%
    const netUsage = Math.floor(Math.random() * 50 + 10); // 10-60%
    
    // Update gauges
    this.widgets.cpuGauge.setPercent(cpuUsage);
    this.widgets.memGauge.setPercent(memUsage);
    this.widgets.diskGauge.setPercent(diskUsage);
    this.widgets.netGauge.setPercent(netUsage);
    
    // Store for chart
    this.lastMetrics = { cpuUsage, memUsage, diskUsage, netUsage };
  }
  
  /**
   * Update performance chart
   */
  updatePerformanceChart(perfData) {
    // Add timestamp
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { 
      hour12: false,
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Update data arrays
    this.performanceData.x.push(timeLabel);
    this.performanceData.y.push(this.lastMetrics ? this.lastMetrics.cpuUsage : 0);
    
    // Limit data points
    if (this.performanceData.x.length > this.performanceData.maxDataPoints) {
      this.performanceData.x.shift();
      this.performanceData.y.shift();
    }
    
    // Update chart
    this.widgets.performanceChart.setData([
      {
        title: 'CPU %',
        x: this.performanceData.x,
        y: this.performanceData.y,
        style: { line: 'cyan' }
      }
    ]);
  }
  
  /**
   * Update status bar
   */
  updateStatusBar(status) {
    const now = new Date().toLocaleString();
    const uptime = this.formatUptime(Date.now() - this.lastRenderTime);
    
    const statusText = ` [F1] Help | [F5] Refresh | [P] Pause | [Q] Quit | ` +
                      `Agents: ${status.agents.active}/${status.agents.total} | ` +
                      `Locks: ${status.locks.activeLocks} | ` +
                      `Conflicts: ${status.conflicts.totalConflicts} | ` +
                      `Last Update: ${now} `;
    
    this.widgets.statusBar.setContent(statusText);
  }
  
  /**
   * Show help screen
   */
  showHelp() {
    const helpBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        bg: 'black'
      },
      label: ' Help ',
      content: this.getHelpContent(),
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true
    });
    
    helpBox.key(['escape', 'q'], () => {
      helpBox.destroy();
      this.screen.render();
    });
    
    helpBox.focus();
    this.screen.render();
  }
  
  /**
   * Get help content
   */
  getHelpContent() {
    return `
  BUMBA COORDINATION DASHBOARD - HELP
  ====================================
  
  KEYBOARD SHORTCUTS:
  -------------------
  F1          - Show this help
  F2          - Focus agents view
  F3          - Focus locks view
  F4          - Focus territories view
  F5 / R      - Refresh dashboard
  Tab         - Next widget
  Shift+Tab   - Previous widget
  P           - Pause/resume updates
  Q / Escape  - Quit dashboard
  
  NAVIGATION:
  -----------
  Arrow Keys  - Navigate within widgets
  Page Up/Dn  - Scroll in widgets
  Home/End    - Jump to start/end
  
  VIEWS:
  ------
  The dashboard displays real-time information about:
  • Agent Status - Active agents by department
  • Lock Status - File locks and conflicts
  • Territory Map - Resource territories
  • Conflicts - Active conflicts and alerts
  • Performance - System resource usage
  
  INDICATORS:
  -----------
  🟢 Green  - Normal operation
  🟡 Yellow - Warning condition
  🔴 Red    - Error or critical issue
  
  Press Escape or Q to close this help.
    `;
  }
  
  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      this.widgets.conflictMonitor.log('⏸️  Dashboard paused');
    } else {
      this.startDataUpdates();
      this.widgets.conflictMonitor.log('▶️  Dashboard resumed');
    }
    this.screen.render();
  }
  
  /**
   * Manual refresh
   */
  async refresh() {
    this.widgets.conflictMonitor.log('🔄 Manual refresh triggered');
    await this.updateAllWidgets();
    this.screen.render();
  }
  
  /**
   * Focus next widget
   */
  focusNext() {
    // Implement widget focus navigation
    this.screen.focusNext();
  }
  
  /**
   * Focus previous widget
   */
  focusPrevious() {
    // Implement widget focus navigation
    this.screen.focusPrevious();
  }
  
  /**
   * Toggle view
   */
  toggleView(viewName) {
    this.widgets.conflictMonitor.log(`Switching to ${viewName} view`);
    // Implementation for view switching in Sprint 2
    this.screen.render();
  }
  
  /**
   * Handle terminal resize
   */
  handleResize() {
    // Blessed handles most resize automatically
    this.screen.render();
  }
  
  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
  
  /**
   * Cleanup and shutdown
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    if (this.screen) {
      this.screen.destroy();
    }
    
    this.emit('cleanup');
  }
}

module.exports = CoordinationDashboardUI;