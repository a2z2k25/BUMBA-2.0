/**
 * BUMBA Dashboard Base Class
 * Shared functionality for all dashboard components
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class DashboardBase extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      name: config.name || 'Dashboard',
      refreshInterval: config.refreshInterval || 5000,
      autoRefresh: config.autoRefresh !== false,
      maxHistorySize: config.maxHistorySize || 100,
      enableExport: config.enableExport !== false,
      displayWidth: config.displayWidth || 80,
      ...config
    };
    
    // Dashboard state
    this.data = {};
    this.history = [];
    this.lastRefresh = null;
    this.refreshTimer = null;
    this.initialized = false;
    
    // Statistics
    this.stats = {
      refreshCount: 0,
      displayCount: 0,
      exportCount: 0,
      errors: 0
    };
    
    // Color scheme
    this.colors = {
      header: chalk.bold.cyan,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      info: chalk.blue,
      muted: chalk.gray,
      highlight: chalk.bold.white
    };
    
    // ASCII chart characters
    this.chartChars = {
      bar: '█',
      halfBar: '▌',
      dot: '•',
      line: '─',
      corner: '└',
      vertical: '│',
      cross: '┼'
    };
  }
  
  /**
   * Initialize dashboard (override in subclass)
   */
  async initialize() {
    try {
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial data fetch
      await this.refresh();
      
      // Start auto-refresh if enabled
      if (this.config.autoRefresh) {
        this.startAutoRefresh();
      }
      
      this.initialized = true;
      logger.info(`📊 ${this.config.name} initialized`);
      this.emit('initialized');
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ${this.config.name}:`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Setup event listeners (override in subclass)
   */
  setupEventListeners() {
    // Subclasses should implement specific listeners
  }
  
  /**
   * Refresh dashboard data (override in subclass)
   */
  async refresh() {
    try {
      this.stats.refreshCount++;
      
      // Subclasses should implement data fetching
      const newData = await this.fetchData();
      
      // Update data
      this.data = newData;
      this.lastRefresh = new Date().toISOString();
      
      // Add to history
      this.addToHistory({
        timestamp: this.lastRefresh,
        data: this.data
      });
      
      this.emit('refreshed', this.data);
      return this.data;
      
    } catch (error) {
      logger.error(`Failed to refresh ${this.config.name}:`, error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Fetch data (must be implemented by subclass)
   */
  async fetchData() {
    throw new Error('fetchData() must be implemented by subclass');
  }
  
  /**
   * Display dashboard
   */
  display() {
    try {
      this.stats.displayCount++;
      
      // Clear console if configured
      if (this.config.clearOnDisplay) {
        console.clear();
      }
      
      // Display header
      this.displayHeader();
      
      // Display content (implemented by subclass)
      this.displayContent();
      
      // Display footer
      this.displayFooter();
      
      this.emit('displayed');
      
    } catch (error) {
      logger.error(`Failed to display ${this.config.name}:`, error);
      this.stats.errors++;
    }
  }
  
  /**
   * Display header
   */
  displayHeader() {
    const width = this.config.displayWidth;
    console.log(this.colors.header('═'.repeat(width)));
    console.log(this.colors.header(this.centerText(this.config.name.toUpperCase(), width)));
    console.log(this.colors.header('═'.repeat(width)));
    
    if (this.lastRefresh) {
      console.log(this.colors.muted(`Last refresh: ${this.lastRefresh}`));
    }
    console.log();
  }
  
  /**
   * Display content (must be implemented by subclass)
   */
  displayContent() {
    throw new Error('displayContent() must be implemented by subclass');
  }
  
  /**
   * Display footer
   */
  displayFooter() {
    const width = this.config.displayWidth;
    console.log();
    console.log(this.colors.header('═'.repeat(width)));
    
    if (this.config.showStats) {
      console.log(this.colors.muted(
        `Refreshes: ${this.stats.refreshCount} | ` +
        `Displays: ${this.stats.displayCount} | ` +
        `Errors: ${this.stats.errors}`
      ));
    }
  }
  
  /**
   * Get current data
   */
  getData() {
    return {
      data: this.data,
      lastRefresh: this.lastRefresh,
      stats: this.stats
    };
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      name: this.config.name,
      initialized: this.initialized,
      lastRefresh: this.lastRefresh,
      autoRefresh: this.config.autoRefresh,
      dataKeys: Object.keys(this.data),
      historySize: this.history.length,
      stats: this.stats
    };
  }
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      return;
    }
    
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refresh();
        if (this.config.displayOnRefresh) {
          this.display();
        }
      } catch (error) {
        logger.error('Auto-refresh error:', error);
      }
    }, this.config.refreshInterval);
    
    logger.info(`📊 ${this.config.name} auto-refresh started`);
  }
  
  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.info(`📊 ${this.config.name} auto-refresh stopped`);
    }
  }
  
  /**
   * Add to history
   */
  addToHistory(entry) {
    this.history.push(entry);
    
    // Trim history
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }
  }
  
  /**
   * Get history
   */
  getHistory(limit) {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }
  
  /**
   * Export data
   */
  async exportData(format = 'json', filepath) {
    try {
      this.stats.exportCount++;
      
      const exportData = {
        dashboard: this.config.name,
        timestamp: new Date().toISOString(),
        data: this.data,
        history: this.history,
        stats: this.stats
      };
      
      let content;
      let extension;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          extension = 'json';
          break;
          
        case 'csv':
          content = this.convertToCSV(exportData);
          extension = 'csv';
          break;
          
        case 'markdown':
          content = this.convertToMarkdown(exportData);
          extension = 'md';
          break;
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Generate filepath if not provided
      if (!filepath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filepath = path.join(
          process.cwd(),
          `${this.config.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${extension}`
        );
      }
      
      // Write file
      await fs.writeFile(filepath, content);
      
      logger.info(`📄 Dashboard exported to: ${filepath}`);
      this.emit('exported', { format, filepath });
      
      return filepath;
      
    } catch (error) {
      logger.error('Export failed:', error);
      this.stats.errors++;
      throw error;
    }
  }
  
  /**
   * Convert to CSV (basic implementation)
   */
  convertToCSV(data) {
    const rows = [];
    rows.push('Timestamp,Key,Value');
    
    // Current data
    Object.entries(data.data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          rows.push(`"${data.timestamp}","${key}.${subKey}","${subValue}"`);
        });
      } else {
        rows.push(`"${data.timestamp}","${key}","${value}"`);
      }
    });
    
    return rows.join('\n');
  }
  
  /**
   * Convert to Markdown
   */
  convertToMarkdown(data) {
    const lines = [];
    
    lines.push(`# ${this.config.name} Report`);
    lines.push(`\nGenerated: ${data.timestamp}\n`);
    
    lines.push('## Current Data\n');
    lines.push('```json');
    lines.push(JSON.stringify(data.data, null, 2));
    lines.push('```\n');
    
    lines.push('## Statistics\n');
    Object.entries(data.stats).forEach(([key, value]) => {
      lines.push(`- **${key}**: ${value}`);
    });
    
    return lines.join('\n');
  }
  
  /**
   * Create simple bar chart
   */
  createBarChart(data, maxWidth = 40) {
    const chart = [];
    const maxValue = Math.max(...Object.values(data));
    
    Object.entries(data).forEach(([label, value]) => {
      const barLength = Math.round((value / maxValue) * maxWidth);
      const bar = this.chartChars.bar.repeat(barLength);
      const percentage = Math.round((value / maxValue) * 100);
      
      chart.push(
        `${label.padEnd(15)} ${this.colors.info(bar)} ${value} (${percentage}%)`
      );
    });
    
    return chart.join('\n');
  }
  
  /**
   * Create simple line chart (sparkline)
   */
  createSparkline(values, width = 40) {
    if (values.length === 0) return '';
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const scaled = values.map(v => Math.round(((v - min) / range) * 7));
    const chars = ' ▁▂▃▄▅▆▇█';
    
    return scaled.map(v => chars[v]).join('');
  }
  
  /**
   * Create table
   */
  createTable(headers, rows, columnWidths) {
    const table = [];
    
    // Calculate column widths if not provided
    if (!columnWidths) {
      columnWidths = headers.map((h, i) => {
        const headerLen = h.length;
        const maxRowLen = Math.max(...rows.map(r => String(r[i]).length));
        return Math.max(headerLen, maxRowLen) + 2;
      });
    }
    
    // Header
    const headerRow = headers.map((h, i) => 
      this.colors.header(h.padEnd(columnWidths[i]))
    ).join('│');
    
    table.push(headerRow);
    table.push('─'.repeat(headerRow.length - 10)); // Adjust for color codes
    
    // Rows
    rows.forEach(row => {
      const rowStr = row.map((cell, i) => 
        String(cell).padEnd(columnWidths[i])
      ).join('│');
      table.push(rowStr);
    });
    
    return table.join('\n');
  }
  
  /**
   * Center text
   */
  centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }
  
  /**
   * Format number
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return String(num);
  }
  
  /**
   * Format duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  /**
   * Shutdown dashboard
   */
  async shutdown() {
    try {
      // Stop auto-refresh
      this.stopAutoRefresh();
      
      // Clear data
      this.data = {};
      this.history = [];
      
      this.initialized = false;
      
      logger.info(`📊 ${this.config.name} shutdown`);
      this.emit('shutdown');
      
    } catch (error) {
      logger.error('Shutdown error:', error);
    }
  }
}

module.exports = DashboardBase;