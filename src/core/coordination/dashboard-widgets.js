/**
 * BUMBA Dashboard Widgets
 * Reusable widget components for the coordination dashboard
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');

class DashboardWidgets {
  constructor(screen) {
    this.screen = screen;
    this.theme = {
      primary: 'cyan',
      success: 'green', 
      warning: 'yellow',
      error: 'red',
      info: 'blue'
    };
  }
  
  /**
   * Create a status summary widget
   */
  createStatusSummary(options = {}) {
    const widget = blessed.box({
      ...options,
      border: { type: 'line' },
      style: {
        border: { fg: this.theme.primary },
        ...options.style
      },
      tags: true,
      scrollable: true
    });
    
    widget.updateStatus = (data) => {
      const content = this.formatStatusSummary(data);
      widget.setContent(content);
    };
    
    return widget;
  }
  
  /**
   * Create an agent monitor widget
   */
  createAgentMonitor(options = {}) {
    const widget = contrib.table({
      ...options,
      columnSpacing: 3,
      columnWidth: options.columnWidth || [15, 10, 10, 15],
      interactive: true,
      keys: true,
      vi: true,
      style: {
        border: { fg: this.theme.primary },
        header: { fg: 'cyan', bold: true },
        cell: { fg: 'white' },
        ...options.style
      }
    });
    
    widget.updateAgents = (agents) => {
      const tableData = {
        headers: ['Agent ID', 'Type', 'Status', 'Department'],
        data: agents.activeList ? agents.activeList.map(agent => [
          agent.id.substring(0, 15),
          agent.type,
          this.getStatusIndicator(agent.status),
          agent.department
        ]) : []
      };
      widget.setData(tableData);
    };
    
    return widget;
  }
  
  /**
   * Create a lock monitor widget
   */
  createLockMonitor(options = {}) {
    const widget = blessed.list({
      ...options,
      border: { type: 'line' },
      style: {
        border: { fg: this.theme.primary },
        selected: { bg: 'blue', fg: 'white' },
        ...options.style
      },
      interactive: true,
      keys: true,
      vi: true,
      mouse: true
    });
    
    widget.updateLocks = (locks) => {
      const items = [];
      
      if (locks.locks && locks.locks.length > 0) {
        locks.locks.forEach(lock => {
          const fileName = lock.file.split('/').pop();
          items.push(`🔒 ${fileName} [${lock.agent}] - ${lock.expiresIn}`);
        });
      } else {
        items.push('{gray-fg}No active locks{/}');
      }
      
      widget.setItems(items);
    };
    
    return widget;
  }
  
  /**
   * Create a conflict alert widget
   */
  createConflictAlert(options = {}) {
    const widget = contrib.log({
      ...options,
      border: { type: 'line' },
      style: {
        border: { fg: this.theme.warning },
        ...options.style
      },
      bufferLength: options.bufferLength || 50,
      tags: true
    });
    
    widget.addAlert = (alert) => {
      const timestamp = new Date().toLocaleTimeString();
      const icon = this.getAlertIcon(alert.level);
      const color = this.getAlertColor(alert.level);
      widget.log(`{${color}-fg}[${timestamp}] ${icon} ${alert.message}{/}`);
    };
    
    return widget;
  }
  
  /**
   * Create a performance gauge cluster
   */
  createPerformanceGauges(grid, row, col, options = {}) {
    const gauges = {};
    
    // CPU Gauge
    gauges.cpu = grid.set(row, col, 1.5, 3, contrib.gauge, {
      label: ' CPU ',
      percent: 0,
      stroke: 'green',
      fill: 'white',
      ...options.cpu
    });
    
    // Memory Gauge  
    gauges.memory = grid.set(row, col + 3, 1.5, 3, contrib.gauge, {
      label: ' Memory ',
      percent: 0,
      stroke: 'yellow',
      fill: 'white',
      ...options.memory
    });
    
    // Disk Gauge
    gauges.disk = grid.set(row + 1.5, col, 1.5, 3, contrib.gauge, {
      label: ' Disk ',
      percent: 0,
      stroke: 'magenta',
      fill: 'white',
      ...options.disk
    });
    
    // Network Gauge
    gauges.network = grid.set(row + 1.5, col + 3, 1.5, 3, contrib.gauge, {
      label: ' Network ',
      percent: 0,
      stroke: 'cyan',
      fill: 'white',
      ...options.network
    });
    
    gauges.updateAll = (data) => {
      if (data.cpu !== undefined) {gauges.cpu.setPercent(data.cpu);}
      if (data.memory !== undefined) {gauges.memory.setPercent(data.memory);}
      if (data.disk !== undefined) {gauges.disk.setPercent(data.disk);}
      if (data.network !== undefined) {gauges.network.setPercent(data.network);}
    };
    
    return gauges;
  }
  
  /**
   * Create a department breakdown bar chart
   */
  createDepartmentChart(options = {}) {
    const widget = contrib.bar({
      ...options,
      barWidth: options.barWidth || 8,
      barSpacing: options.barSpacing || 4,
      maxHeight: options.maxHeight || 10,
      style: {
        bar: { bg: 'cyan', fg: 'white' },
        ...options.style
      }
    });
    
    widget.updateDepartments = (departments) => {
      const data = {
        titles: [],
        data: []
      };
      
      if (departments.byDepartment) {
        for (const [dept, count] of Object.entries(departments.byDepartment)) {
          data.titles.push(dept.substring(0, 8));
          data.data.push(count);
        }
      }
      
      widget.setData(data);
    };
    
    return widget;
  }
  
  /**
   * Create a performance history chart
   */
  createPerformanceChart(options = {}) {
    const widget = contrib.line({
      ...options,
      showLegend: options.showLegend !== false,
      legend: { width: 20 },
      wholeNumbersOnly: false,
      style: {
        line: 'cyan',
        text: 'white',
        baseline: 'white',
        ...options.style
      }
    });
    
    widget.historyData = {
      x: [],
      cpu: [],
      memory: [],
      maxPoints: options.maxPoints || 60
    };
    
    widget.updateHistory = (data) => {
      const history = widget.historyData;
      const time = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        minute: '2-digit',
        second: '2-digit'
      });
      
      history.x.push(time);
      history.cpu.push(data.cpu || 0);
      history.memory.push(data.memory || 0);
      
      // Limit data points
      if (history.x.length > history.maxPoints) {
        history.x.shift();
        history.cpu.shift();
        history.memory.shift();
      }
      
      widget.setData([
        {
          title: 'CPU %',
          x: history.x,
          y: history.cpu,
          style: { line: 'cyan' }
        },
        {
          title: 'Memory %',
          x: history.x,
          y: history.memory,
          style: { line: 'yellow' }
        }
      ]);
    };
    
    return widget;
  }
  
  /**
   * Create a territory visualization widget
   */
  createTerritoryMap(options = {}) {
    const widget = blessed.box({
      ...options,
      border: { type: 'line' },
      style: {
        border: { fg: this.theme.primary },
        ...options.style
      },
      tags: true,
      scrollable: true,
      alwaysScroll: true
    });
    
    widget.updateTerritories = (territories) => {
      const content = this.formatTerritoryMap(territories);
      widget.setContent(content);
    };
    
    return widget;
  }
  
  /**
   * Create a sparkline widget for quick metrics
   */
  createSparkline(options = {}) {
    const widget = contrib.sparkline({
      ...options,
      style: {
        fg: 'blue',
        titleFg: 'white',
        ...options.style
      }
    });
    
    widget.dataBuffer = [];
    widget.maxBuffer = options.maxBuffer || 20;
    
    widget.addDataPoint = (value) => {
      widget.dataBuffer.push(value);
      if (widget.dataBuffer.length > widget.maxBuffer) {
        widget.dataBuffer.shift();
      }
      widget.setData([widget.label || 'Metric'], [widget.dataBuffer]);
    };
    
    return widget;
  }
  
  /**
   * Create a quick stats widget
   */
  createQuickStats(options = {}) {
    const widget = blessed.box({
      ...options,
      border: { type: 'line' },
      style: {
        border: { fg: this.theme.info },
        ...options.style
      },
      tags: true
    });
    
    widget.updateStats = (stats) => {
      const content = this.formatQuickStats(stats);
      widget.setContent(content);
    };
    
    return widget;
  }
  
  /**
   * Format status summary content
   */
  formatStatusSummary(data) {
    let content = '';
    
    content += `{cyan-fg}═══ SYSTEM STATUS ═══{/}\n\n`;
    
    // Agents
    content += `{white-fg}👥 Agents:{/} {green-fg}${data.agents.active}{/}/${data.agents.total}\n`;
    
    // Locks
    content += `{white-fg}🔒 Locks:{/} {yellow-fg}${data.locks.activeLocks}{/} active\n`;
    
    // Conflicts
    const conflictColor = data.conflicts.totalConflicts > 5 ? 'red' : 'green';
    content += `{white-fg}🟠️  Conflicts:{/} {${conflictColor}-fg}${data.conflicts.totalConflicts}{/}\n`;
    
    // Territories
    content += `{white-fg}🗺️  Territories:{/} {blue-fg}${data.territories.totalTerritories}{/}\n`;
    
    content += `\n{cyan-fg}═══════════════════{/}\n`;
    
    return content;
  }
  
  /**
   * Format territory map content
   */
  formatTerritoryMap(territories) {
    let content = '';
    
    content += `{cyan-fg}Territory Overview{/}\n`;
    content += `{white-fg}${'─'.repeat(40)}{/}\n\n`;
    
    content += `Total: {green-fg}${territories.totalTerritories}{/} | `;
    content += `Files: {yellow-fg}${territories.totalFiles}{/}\n`;
    content += `Exclusive: {red-fg}${territories.exclusiveFiles}{/} | `;
    content += `Shared: {blue-fg}${territories.sharedFiles}{/}\n\n`;
    
    if (territories.territories && territories.territories.length > 0) {
      content += `{cyan-fg}Active Territories:{/}\n`;
      
      territories.territories.forEach(territory => {
        const icon = territory.type === 'exclusive' ? '🔒' : '🔓';
        const color = territory.type === 'exclusive' ? 'red' : 'green';
        
        content += `\n${icon} {white-fg}${territory.agent}{/}\n`;
        content += `   Type: {${color}-fg}${territory.type}{/}\n`;
        content += `   Files: {yellow-fg}${territory.files}{/}\n`;
      });
    } else {
      content += `{gray-fg}No active territories{/}\n`;
    }
    
    return content;
  }
  
  /**
   * Format quick stats content
   */
  formatQuickStats(stats) {
    let content = '';
    
    content += `{cyan-fg}Quick Stats{/}\n`;
    content += `{white-fg}${'─'.repeat(20)}{/}\n\n`;
    
    for (const [key, value] of Object.entries(stats)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      content += `{white-fg}${label}:{/} {green-fg}${value}{/}\n`;
    }
    
    return content;
  }
  
  /**
   * Get status indicator
   */
  getStatusIndicator(status) {
    const indicators = {
      active: '{green-fg}● ACTIVE{/}',
      busy: '{yellow-fg}● BUSY{/}',
      idle: '{blue-fg}● IDLE{/}',
      error: '{red-fg}● ERROR{/}',
      stopped: '{gray-fg}● STOPPED{/}'
    };
    return indicators[status] || '{gray-fg}● UNKNOWN{/}';
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
   * Get alert color
   */
  getAlertColor(level) {
    const colors = {
      critical: 'red',
      warning: 'yellow',
      info: 'blue',
      success: 'green'
    };
    return colors[level] || 'white';
  }
}

module.exports = DashboardWidgets;