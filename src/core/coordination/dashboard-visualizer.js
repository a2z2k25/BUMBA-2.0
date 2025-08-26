/**
 * BUMBA Dashboard Visualizer
 * Text-based visualization for coordination metrics
 * Part of Coordination Dashboard enhancement to 90%
 */

const { logger } = require('../logging/bumba-logger');

/**
 * Dashboard visualizer for terminal-based charts and graphs
 */
class DashboardVisualizer {
  constructor(config = {}) {
    this.config = {
      width: config.width || 80,
      height: config.height || 24,
      colors: config.colors !== false,
      unicode: config.unicode !== false,
      ...config
    };
    
    // Unicode characters for drawing
    this.chars = this.config.unicode ? {
      horizontal: '─',
      vertical: '│',
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      cross: '┼',
      tee: '├',
      bar: '█',
      halfBar: '▌',
      dot: '•',
      arrow: '→'
    } : {
      horizontal: '-',
      vertical: '|',
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+',
      cross: '+',
      tee: '+',
      bar: '#',
      halfBar: '=',
      dot: '*',
      arrow: '>'
    };
    
    // Color codes
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m'
    };
  }
  
  /**
   * Create agent network visualization
   */
  visualizeAgentNetwork(agents, connections) {
    const lines = [];
    const width = Math.min(this.config.width, 60);
    const height = Math.min(this.config.height, 20);
    
    lines.push(this.createHeader('AGENT NETWORK', width));
    
    // Create grid
    const grid = Array(height).fill(null).map(() => Array(width).fill(' '));
    
    // Position agents in grid
    const positions = this.calculateAgentPositions(agents, width, height);
    
    // Draw connections
    for (const conn of connections) {
      const from = positions.get(conn.from);
      const to = positions.get(conn.to);
      
      if (from && to) {
        this.drawConnection(grid, from, to, conn.type);
      }
    }
    
    // Draw agents
    for (const [agent, pos] of positions) {
      const symbol = this.getAgentSymbol(agent);
      const color = this.getAgentColor(agent);
      
      if (pos.y < height && pos.x < width) {
        grid[pos.y][pos.x] = this.colorize(symbol, color);
      }
    }
    
    // Convert grid to lines
    for (const row of grid) {
      lines.push(row.join(''));
    }
    
    lines.push(this.createFooter(width));
    
    return lines.join('\n');
  }
  
  /**
   * Create timeline visualization
   */
  visualizeTimeline(events, duration = 60000) {
    const lines = [];
    const width = this.config.width;
    const height = Math.min(10, this.config.height);
    
    lines.push(this.createHeader('EVENT TIMELINE', width));
    
    const now = Date.now();
    const startTime = now - duration;
    
    // Group events by type
    const grouped = this.groupEventsByType(events);
    
    let y = 0;
    for (const [type, typeEvents] of Object.entries(grouped)) {
      if (y >= height - 2) break;
      
      // Type label
      const label = type.substring(0, 10).padEnd(10);
      
      // Create timeline bar
      const bar = this.createTimelineBar(typeEvents, startTime, now, width - 12);
      
      lines.push(`${label} ${bar}`);
      y++;
    }
    
    // Time axis
    lines.push(this.createTimeAxis(startTime, now, width));
    lines.push(this.createFooter(width));
    
    return lines.join('\n');
  }
  
  /**
   * Create bar chart
   */
  createBarChart(data, title = 'METRICS') {
    const lines = [];
    const width = this.config.width;
    const maxLabelWidth = Math.max(...Object.keys(data).map(k => k.length));
    const barWidth = width - maxLabelWidth - 4;
    
    lines.push(this.createHeader(title, width));
    
    // Find max value for scaling
    const maxValue = Math.max(...Object.values(data));
    
    for (const [label, value] of Object.entries(data)) {
      const normalizedValue = maxValue > 0 ? value / maxValue : 0;
      const barLength = Math.floor(normalizedValue * barWidth);
      
      const bar = this.chars.bar.repeat(barLength);
      const paddedLabel = label.padEnd(maxLabelWidth);
      const color = this.getValueColor(normalizedValue);
      
      lines.push(`${paddedLabel} ${this.colorize(bar, color)} ${value}`);
    }
    
    lines.push(this.createFooter(width));
    
    return lines.join('\n');
  }
  
  /**
   * Create line graph
   */
  createLineGraph(series, title = 'TREND') {
    const lines = [];
    const width = this.config.width;
    const height = Math.min(15, this.config.height);
    
    lines.push(this.createHeader(title, width));
    
    if (series.length === 0) {
      lines.push('No data available');
      lines.push(this.createFooter(width));
      return lines.join('\n');
    }
    
    // Normalize values
    const values = series.map(p => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    // Create graph grid
    const graphHeight = height - 4;
    const graphWidth = width - 10;
    const grid = Array(graphHeight).fill(null).map(() => Array(graphWidth).fill(' '));
    
    // Draw axes
    for (let y = 0; y < graphHeight; y++) {
      grid[y][0] = this.chars.vertical;
    }
    for (let x = 0; x < graphWidth; x++) {
      grid[graphHeight - 1][x] = this.chars.horizontal;
    }
    
    // Plot points
    const step = Math.max(1, Math.floor(series.length / graphWidth));
    for (let i = 0; i < series.length; i += step) {
      const x = Math.floor((i / series.length) * (graphWidth - 1));
      const normalizedValue = (series[i].value - minValue) / range;
      const y = graphHeight - 1 - Math.floor(normalizedValue * (graphHeight - 1));
      
      if (x < graphWidth && y >= 0 && y < graphHeight) {
        grid[y][x] = this.chars.dot;
        
        // Connect points
        if (i > 0) {
          const prevIndex = Math.max(0, i - step);
          const prevX = Math.floor((prevIndex / series.length) * (graphWidth - 1));
          const prevValue = (series[prevIndex].value - minValue) / range;
          const prevY = graphHeight - 1 - Math.floor(prevValue * (graphHeight - 1));
          
          this.drawLine(grid, prevX, prevY, x, y);
        }
      }
    }
    
    // Add Y-axis labels
    const yLabels = [];
    yLabels.push(maxValue.toFixed(1).padStart(8));
    yLabels.push(((maxValue + minValue) / 2).toFixed(1).padStart(8));
    yLabels.push(minValue.toFixed(1).padStart(8));
    
    // Convert grid to lines with labels
    lines.push(`${yLabels[0]} ${this.chars.topLeft}${grid[0].join('')}`);
    
    for (let y = 1; y < graphHeight - 1; y++) {
      const label = y === Math.floor(graphHeight / 2) ? yLabels[1] : '        ';
      lines.push(`${label} ${this.chars.vertical}${grid[y].join('')}`);
    }
    
    lines.push(`${yLabels[2]} ${this.chars.bottomLeft}${grid[graphHeight - 1].join('')}`);
    
    // Add time labels
    const timeLabels = this.createTimeLabels(series, graphWidth);
    lines.push(`         ${timeLabels}`);
    
    lines.push(this.createFooter(width));
    
    return lines.join('\n');
  }
  
  /**
   * Create heat map
   */
  createHeatMap(matrix, rowLabels, colLabels, title = 'HEAT MAP') {
    const lines = [];
    const width = this.config.width;
    
    lines.push(this.createHeader(title, width));
    
    if (!matrix || matrix.length === 0) {
      lines.push('No data available');
      lines.push(this.createFooter(width));
      return lines.join('\n');
    }
    
    const maxLabelWidth = Math.max(...rowLabels.map(l => l.length));
    const cellWidth = 3;
    
    // Column headers
    const headerLine = ' '.repeat(maxLabelWidth + 2) + 
      colLabels.map(l => l.substring(0, cellWidth).padEnd(cellWidth)).join(' ');
    lines.push(headerLine);
    
    // Find min/max for color scaling
    const allValues = matrix.flat();
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue || 1;
    
    // Draw matrix
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      const label = rowLabels[i].padEnd(maxLabelWidth);
      
      const cells = row.map(value => {
        const normalized = (value - minValue) / range;
        const intensity = this.getHeatIntensity(normalized);
        const color = this.getHeatColor(normalized);
        return this.colorize(intensity.padEnd(cellWidth), color);
      }).join(' ');
      
      lines.push(`${label}  ${cells}`);
    }
    
    // Legend
    lines.push('');
    lines.push(`Min: ${minValue.toFixed(2)}  Max: ${maxValue.toFixed(2)}`);
    
    lines.push(this.createFooter(width));
    
    return lines.join('\n');
  }
  
  /**
   * Create gauge
   */
  createGauge(value, min = 0, max = 100, title = 'GAUGE') {
    const lines = [];
    const width = Math.min(40, this.config.width);
    
    lines.push(this.createHeader(title, width));
    
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const percentage = Math.round(normalized * 100);
    
    // Create arc
    const arcWidth = width - 4;
    const filled = Math.floor(normalized * arcWidth);
    
    const gauge = 
      this.colorize(this.chars.bar.repeat(filled), this.getValueColor(normalized)) +
      this.chars.horizontal.repeat(arcWidth - filled);
    
    lines.push(`[${gauge}]`);
    lines.push(`${' '.repeat(Math.floor((width - 10) / 2))}${percentage}%`);
    
    // Value label
    lines.push(`Value: ${value.toFixed(2)} / ${max.toFixed(2)}`);
    
    lines.push(this.createFooter(width));
    
    return lines.join('\n');
  }
  
  /**
   * Create sparkline
   */
  createSparkline(values, width = 20) {
    if (values.length === 0) return '';
    
    const chars = this.config.unicode ? 
      ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] :
      ['_', '.', '-', '=', '+', '*', '#', '@'];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Sample if too many values
    const step = Math.max(1, Math.floor(values.length / width));
    const sampled = [];
    for (let i = 0; i < values.length; i += step) {
      sampled.push(values[i]);
    }
    
    // Convert to sparkline
    return sampled.map(v => {
      const normalized = (v - min) / range;
      const index = Math.floor(normalized * (chars.length - 1));
      return chars[index];
    }).join('');
  }
  
  // Helper methods
  
  createHeader(title, width) {
    const titleText = ` ${title} `;
    const padding = Math.max(0, width - titleText.length - 2);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    
    return this.chars.topLeft + 
           this.chars.horizontal.repeat(leftPad) +
           titleText +
           this.chars.horizontal.repeat(rightPad) +
           this.chars.topRight;
  }
  
  createFooter(width) {
    return this.chars.bottomLeft + 
           this.chars.horizontal.repeat(width - 2) +
           this.chars.bottomRight;
  }
  
  calculateAgentPositions(agents, width, height) {
    const positions = new Map();
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const radius = Math.min(width, height) / 3;
    
    agents.forEach((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));
      
      positions.set(agent.id, { x, y });
    });
    
    return positions;
  }
  
  drawConnection(grid, from, to, type) {
    // Simple line drawing
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    
    let x = from.x;
    let y = from.y;
    
    while (x !== to.x || y !== to.y) {
      if (x !== to.x) x += dx;
      if (y !== to.y) y += dy;
      
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        if (grid[y][x] === ' ') {
          grid[y][x] = type === 'conflict' ? 'X' : '.';
        }
      }
    }
  }
  
  drawLine(grid, x1, y1, x2, y2) {
    // Bresenham's line algorithm
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      if (x1 >= 0 && x1 < grid[0].length && y1 >= 0 && y1 < grid.length) {
        if (grid[y1][x1] === ' ') {
          grid[y1][x1] = '.';
        }
      }
      
      if (x1 === x2 && y1 === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }
  }
  
  getAgentSymbol(agent) {
    const symbols = {
      backend: 'B',
      frontend: 'F',
      design: 'D',
      product: 'P',
      default: 'A'
    };
    
    return symbols[agent.type] || symbols.default;
  }
  
  getAgentColor(agent) {
    const colors = {
      active: 'green',
      idle: 'yellow',
      blocked: 'red',
      default: 'white'
    };
    
    return colors[agent.status] || colors.default;
  }
  
  groupEventsByType(events) {
    return events.reduce((grouped, event) => {
      const type = event.type || 'unknown';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(event);
      return grouped;
    }, {});
  }
  
  createTimelineBar(events, startTime, endTime, width) {
    const duration = endTime - startTime;
    const bar = Array(width).fill(' ');
    
    for (const event of events) {
      const relativeTime = event.timestamp - startTime;
      const position = Math.floor((relativeTime / duration) * width);
      
      if (position >= 0 && position < width) {
        bar[position] = this.chars.dot;
      }
    }
    
    return bar.join('');
  }
  
  createTimeAxis(startTime, endTime, width) {
    const startLabel = new Date(startTime).toLocaleTimeString();
    const endLabel = new Date(endTime).toLocaleTimeString();
    const padding = width - startLabel.length - endLabel.length;
    
    return startLabel + ' '.repeat(Math.max(0, padding)) + endLabel;
  }
  
  createTimeLabels(series, width) {
    if (series.length === 0) return '';
    
    const first = new Date(series[0].timestamp).toLocaleTimeString();
    const last = new Date(series[series.length - 1].timestamp).toLocaleTimeString();
    const padding = width - first.length - last.length;
    
    return first + ' '.repeat(Math.max(0, padding)) + last;
  }
  
  getValueColor(normalized) {
    if (normalized < 0.3) return 'green';
    if (normalized < 0.7) return 'yellow';
    return 'red';
  }
  
  getHeatColor(normalized) {
    if (normalized < 0.2) return 'blue';
    if (normalized < 0.4) return 'cyan';
    if (normalized < 0.6) return 'green';
    if (normalized < 0.8) return 'yellow';
    return 'red';
  }
  
  getHeatIntensity(normalized) {
    const intensities = this.config.unicode ?
      [' ', '░', '▒', '▓', '█'] :
      [' ', '.', '+', '#', '@'];
    
    const index = Math.floor(normalized * (intensities.length - 1));
    return intensities[index];
  }
  
  colorize(text, color) {
    if (!this.config.colors) return text;
    
    const colorCode = this.colors[color] || '';
    return colorCode + text + this.colors.reset;
  }
  
  /**
   * Create dashboard summary
   */
  createDashboardSummary(status) {
    const sections = [];
    
    // Header
    sections.push(this.createHeader('COORDINATION DASHBOARD', this.config.width));
    
    // Key metrics
    const metrics = {
      'Active Agents': status.agents?.active || 0,
      'Active Locks': status.locks?.activeLocks || 0,
      'Conflicts': status.conflicts?.totalConflicts || 0,
      'Utilization': `${(status.performance?.efficiency?.utilizationRate * 100 || 0).toFixed(1)}%`,
      'Health Score': `${status.health?.score || 0}%`
    };
    
    sections.push(this.createBarChart(metrics, 'KEY METRICS'));
    
    // Alerts
    if (status.alerts && status.alerts.length > 0) {
      sections.push('\nACTIVE ALERTS:');
      for (const alert of status.alerts.slice(0, 5)) {
        const severity = this.getSeveritySymbol(alert.severity);
        sections.push(`  ${severity} ${alert.type}: ${alert.message || alert.value}`);
      }
    }
    
    // Recommendations
    if (status.recommendations && status.recommendations.length > 0) {
      sections.push('\nRECOMMENDATIONS:');
      for (const rec of status.recommendations.slice(0, 3)) {
        sections.push(`  ${this.chars.arrow} ${rec}`);
      }
    }
    
    sections.push(this.createFooter(this.config.width));
    
    return sections.join('\n');
  }
  
  getSeveritySymbol(severity) {
    const symbols = {
      critical: this.colorize('🟠️', 'red'),
      warning: this.colorize('🟢', 'yellow'),
      info: this.colorize('ℹ️', 'blue'),
      success: this.colorize('🏁', 'green')
    };
    
    return symbols[severity] || symbols.info;
  }
}

module.exports = DashboardVisualizer;