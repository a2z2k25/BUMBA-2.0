/**
 * BUMBA System Health Dashboard
 * Real-time monitoring and visualization of BUMBA's consciousness
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class SystemHealthDashboard extends EventEmitter {
  constructor(consciousness) {
    super();
    this.consciousness = consciousness;
    this.screen = null;
    this.grid = null;
    this.widgets = {};
    this.updateInterval = null;
    this.data = {
      memory: [],
      learning: [],
      collaboration: [],
      experiences: [],
      health: []
    };
  }

  /**
   * Initialize and display dashboard
   */
  async initialize() {
    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'BUMBA System Health Dashboard',
      fullUnicode: true
    });

    // Create grid
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });

    // Create widgets
    this.createWidgets();
    
    // Set up key handlers
    this.setupKeyHandlers();
    
    // Start data updates
    this.startDataUpdates();
    
    // Initial render
    this.screen.render();
    
    logger.info('🟢 System Health Dashboard initialized');
  }

  /**
   * Create dashboard widgets
   */
  createWidgets() {
    // Title
    this.widgets.title = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: '{center}🏁 BUMBA Consciousness Dashboard 🏁{/center}',
      tags: true,
      style: {
        fg: 'cyan',
        border: { fg: 'cyan' }
      }
    });

    // System Health Gauge
    this.widgets.healthGauge = this.grid.set(1, 0, 3, 3, contrib.gauge, {
      label: 'System Health',
      stroke: 'green',
      fill: 'white',
      percent: 0
    });

    // Learning Rate
    this.widgets.learningGauge = this.grid.set(1, 3, 3, 3, contrib.gauge, {
      label: 'Learning Rate',
      stroke: 'blue',
      fill: 'white',
      percent: 0
    });

    // Memory Usage
    this.widgets.memoryGauge = this.grid.set(1, 6, 3, 3, contrib.gauge, {
      label: 'Memory Usage',
      stroke: 'yellow',
      fill: 'white',
      percent: 0
    });

    // Consciousness Level
    this.widgets.consciousnessGauge = this.grid.set(1, 9, 3, 3, contrib.gauge, {
      label: 'Consciousness',
      stroke: 'magenta',
      fill: 'white',
      percent: 0
    });

    // Experience Timeline
    this.widgets.experienceLine = this.grid.set(4, 0, 3, 6, contrib.line, {
      style: {
        line: 'green',
        text: 'green',
        baseline: 'black'
      },
      label: 'Experience Flow',
      showLegend: true
    });

    // Learning Insights
    this.widgets.learningLog = this.grid.set(4, 6, 3, 6, contrib.log, {
      label: 'Learning Insights',
      tags: true,
      style: {
        fg: 'green',
        border: { fg: 'green' }
      }
    });

    // Active Collaborations
    this.widgets.collaborationTable = this.grid.set(7, 0, 3, 6, contrib.table, {
      label: 'Active Collaborations',
      columnSpacing: 2,
      columnWidth: [10, 20, 10, 10],
      style: {
        fg: 'yellow',
        border: { fg: 'yellow' }
      }
    });

    // System Metrics
    this.widgets.metricsBox = this.grid.set(7, 6, 3, 6, blessed.box, {
      label: 'System Metrics',
      content: '',
      tags: true,
      style: {
        fg: 'cyan',
        border: { fg: 'cyan' }
      }
    });

    // Pattern Recognition
    this.widgets.patternDonut = this.grid.set(10, 0, 2, 4, contrib.donut, {
      label: 'Pattern Types',
      radius: 8,
      arcWidth: 3,
      remainColor: 'black',
      yPadding: 2
    });

    // Memory Distribution
    this.widgets.memoryDonut = this.grid.set(10, 4, 2, 4, contrib.donut, {
      label: 'Memory Distribution',
      radius: 8,
      arcWidth: 3,
      remainColor: 'black',
      yPadding: 2
    });

    // Status Bar
    this.widgets.statusBar = this.grid.set(10, 8, 2, 4, blessed.box, {
      label: 'Status',
      content: '',
      tags: true,
      style: {
        fg: 'white',
        border: { fg: 'white' }
      }
    });
  }

  /**
   * Set up keyboard handlers
   */
  setupKeyHandlers() {
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.stop();
      process.exit(0);
    });

    this.screen.key(['r'], () => {
      this.refresh();
    });

    this.screen.key(['l'], () => {
      this.showLearningDetails();
    });

    this.screen.key(['m'], () => {
      this.showMemoryDetails();
    });

    this.screen.key(['h'], () => {
      this.showHelp();
    });
  }

  /**
   * Start data update loop
   */
  startDataUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateDashboard();
    }, 1000); // Update every second
    
    // Initial update
    this.updateDashboard();
  }

  /**
   * Update all dashboard widgets
   */
  async updateDashboard() {
    try {
      const state = this.consciousness.getState();
      
      // Update gauges
      this.updateGauges(state);
      
      // Update experience timeline
      this.updateExperienceTimeline(state);
      
      // Update learning insights
      this.updateLearningInsights(state);
      
      // Update collaboration table
      this.updateCollaborationTable(state);
      
      // Update metrics
      this.updateMetrics(state);
      
      // Update donuts
      this.updateDonuts(state);
      
      // Update status
      this.updateStatus(state);
      
      // Render
      this.screen.render();
    } catch (error) {
      logger.error('Dashboard update error:', error);
    }
  }

  /**
   * Update gauge widgets
   */
  updateGauges(state) {
    // Health gauge
    const healthPercent = this.calculateHealthPercent(state.state.health);
    this.widgets.healthGauge.setPercent(healthPercent);
    this.widgets.healthGauge.setLabel(`Health: ${state.state.health}`);
    
    // Learning rate
    const learningPercent = Math.round(state.state.learningRate * 100);
    this.widgets.learningGauge.setPercent(learningPercent);
    
    // Memory usage
    const memoryPercent = Math.round(state.state.memoryUtilization * 100);
    this.widgets.memoryGauge.setPercent(memoryPercent);
    this.setGaugeColor(this.widgets.memoryGauge, memoryPercent);
    
    // Consciousness level
    const consciousnessPercent = Math.round(state.state.consciousnessLevel * 100);
    this.widgets.consciousnessGauge.setPercent(consciousnessPercent);
  }

  /**
   * Update experience timeline
   */
  updateExperienceTimeline(state) {
    // Add new data point
    this.data.experiences.push({
      x: new Date().toLocaleTimeString(),
      y: state.metrics.experiences
    });
    
    // Keep last 60 points
    if (this.data.experiences.length > 60) {
      this.data.experiences.shift();
    }
    
    // Update chart
    this.widgets.experienceLine.setData([
      {
        title: 'Experiences',
        x: this.data.experiences.map(d => d.x),
        y: this.data.experiences.map(d => d.y),
        style: { line: 'green' }
      }
    ]);
  }

  /**
   * Update learning insights
   */
  async updateLearningInsights(state) {
    if (state.learning) {
      const insights = state.learning.recommendations || [];
      
      for (const insight of insights.slice(0, 5)) {
        const timestamp = new Date().toLocaleTimeString();
        const color = insight.confidence > 0.8 ? '{green-fg}' : '{yellow-fg}';
        this.widgets.learningLog.log(
          `${color}[${timestamp}] ${insight.recommendation}{/}`
        );
      }
    }
  }

  /**
   * Update collaboration table
   */
  updateCollaborationTable(state) {
    const headers = ['Session', 'Participants', 'Ops/s', 'Latency'];
    const data = [];
    
    if (state.collaboration && state.collaboration.activeSessions > 0) {
      // Mock collaboration data - in production would get real sessions
      data.push(['system', '3', '42', '15ms']);
    }
    
    this.widgets.collaborationTable.setData({
      headers: headers,
      data: data
    });
  }

  /**
   * Update system metrics
   */
  updateMetrics(state) {
    const uptime = this.formatUptime(state.uptime);
    const memoryMB = Math.round(state.memory.resource_manager_stats.heapUsedMB);
    
    const content = `
{cyan-fg}Uptime:{/} ${uptime}
{cyan-fg}Total Experiences:{/} ${state.metrics.experiences}
{cyan-fg}Learning Cycles:{/} ${state.metrics.learningCycles}
{cyan-fg}Memories Stored:{/} ${state.metrics.memories}
{cyan-fg}Improvements:{/} ${state.metrics.improvements}
{cyan-fg}Memory Used:{/} ${memoryMB}MB
{cyan-fg}Active Locks:{/} ${state.collaboration?.activeLocks || 0}
    `.trim();
    
    this.widgets.metricsBox.setContent(content);
  }

  /**
   * Update donut charts
   */
  updateDonuts(state) {
    // Pattern distribution
    const patternData = [
      { label: 'Sequence', percent: 30, color: 'green' },
      { label: 'Context', percent: 25, color: 'blue' },
      { label: 'Outcome', percent: 25, color: 'yellow' },
      { label: 'Other', percent: 20, color: 'magenta' }
    ];
    
    this.widgets.patternDonut.setData(patternData);
    
    // Memory distribution
    const memoryData = [
      { label: 'Working', percent: 40, color: 'green' },
      { label: 'Episodic', percent: 30, color: 'blue' },
      { label: 'Semantic', percent: 20, color: 'yellow' },
      { label: 'Procedural', percent: 10, color: 'magenta' }
    ];
    
    this.widgets.memoryDonut.setData(memoryData);
  }

  /**
   * Update status bar
   */
  updateStatus(state) {
    const time = new Date().toLocaleString();
    const health = state.state.health;
    const healthColor = this.getHealthColor(health);
    
    const content = `
{bold}${time}{/bold}
${healthColor}●{/} ${health.toUpperCase()}
{cyan-fg}[R]{/} Refresh {cyan-fg}[H]{/} Help {cyan-fg}[Q]{/} Quit
    `.trim();
    
    this.widgets.statusBar.setContent(content);
  }

  /**
   * Utility methods
   */
  calculateHealthPercent(health) {
    const healthMap = {
      'excellent': 100,
      'good': 75,
      'fair': 50,
      'poor': 25,
      'critical': 10,
      'awakened': 90,
      'sleeping': 0
    };
    return healthMap[health] || 50;
  }

  setGaugeColor(gauge, percent) {
    if (percent > 80) {
      gauge.setOptions({ stroke: 'red' });
    } else if (percent > 60) {
      gauge.setOptions({ stroke: 'yellow' });
    } else {
      gauge.setOptions({ stroke: 'green' });
    }
  }

  getHealthColor(health) {
    const colors = {
      'excellent': '{green-fg}',
      'good': '{green-fg}',
      'fair': '{yellow-fg}',
      'poor': '{red-fg}',
      'critical': '{red-fg}',
      'awakened': '{cyan-fg}',
      'sleeping': '{gray-fg}'
    };
    return colors[health] || '{white-fg}';
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {return `${days}d ${hours % 24}h`;}
    if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
    if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
    return `${seconds}s`;
  }

  /**
   * Show detailed views
   */
  showLearningDetails() {
    const modal = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      content: 'Learning details...',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
        }
      }
    });
    
    modal.key(['escape', 'q'], () => {
      modal.destroy();
      this.screen.render();
    });
    
    this.screen.render();
  }

  showHelp() {
    const helpText = `
{center}{bold}BUMBA System Health Dashboard{/bold}{/center}

{cyan-fg}Keyboard Shortcuts:{/}
  {green-fg}R{/} - Refresh display
  {green-fg}L{/} - Show learning details  
  {green-fg}M{/} - Show memory details
  {green-fg}H{/} - Show this help
  {green-fg}Q{/} - Quit dashboard

{cyan-fg}Status Indicators:{/}
  {green-fg}●{/} - Excellent/Good
  {yellow-fg}●{/} - Fair/Warning  
  {red-fg}●{/} - Poor/Critical
  {cyan-fg}●{/} - Special State

Press any key to close...
    `.trim();
    
    const modal = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '60%',
      height: '60%',
      content: helpText,
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
        }
      }
    });
    
    modal.key(['escape', 'q', 'h'], () => {
      modal.destroy();
      this.screen.render();
    });
    
    modal.focus();
    this.screen.render();
  }

  /**
   * Refresh dashboard
   */
  refresh() {
    this.updateDashboard();
  }

  /**
   * Stop dashboard
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.screen) {
      this.screen.destroy();
    }
    
    logger.info('🟢 Dashboard stopped');
  }
}

/**
 * Web-based dashboard alternative
 */
class WebDashboard extends EventEmitter {
  constructor(consciousness) {
    super();
    this.consciousness = consciousness;
    this.server = null;
    this.io = null;
    this.port = process.env.BUMBA_DASHBOARD_PORT || 3333;
  }

  async initialize() {
    const express = require('express');
    const http = require('http');
    const socketIO = require('socket.io');
    const path = require('path');
    
    const app = express();
    this.server = http.createServer(app);
    this.io = socketIO(this.server);
    
    // Serve static files
    app.use(express.static(path.join(__dirname, 'dashboard-web')));
    
    // API endpoints
    app.get('/api/health', (req, res) => {
      res.json(this.consciousness.getState());
    });
    
    app.get('/api/metrics', async (req, res) => {
      const metrics = await this.getDetailedMetrics();
      res.json(metrics);
    });
    
    // Socket.io for real-time updates
    this.io.on('connection', (socket) => {
      logger.info('Dashboard client connected');
      
      // Send initial state
      socket.emit('state', this.consciousness.getState());
      
      // Set up periodic updates
      const updateInterval = setInterval(() => {
        socket.emit('state', this.consciousness.getState());
      }, 1000);
      
      socket.on('disconnect', () => {
        clearInterval(updateInterval);
        logger.info('Dashboard client disconnected');
      });
    });
    
    // Start server
    this.server.listen(this.port, () => {
      logger.info(`🟢 Web dashboard available at http://localhost:${this.port}`);
    });
  }

  async getDetailedMetrics() {
    const state = this.consciousness.getState();
    const learning = await this.consciousness.systems.learning.getPerformanceInsights('hour');
    
    return {
      ...state,
      detailed_learning: learning,
      timestamp: Date.now()
    };
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = { 
  SystemHealthDashboard,
  WebDashboard
};