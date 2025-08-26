/**
 * BUMBA Status Dashboard
 * System health and component status monitoring
 */

const DashboardBase = require('./dashboard-base');
const { logger } = require('../logging/bumba-logger');
const os = require('os');
const path = require('path');

class StatusDashboard extends DashboardBase {
  constructor(config = {}) {
    super({
      name: 'Status Dashboard',
      refreshInterval: 3000,
      ...config
    });
    
    // Component references
    this.components = new Map();
    this.services = new Map();
    
    // Status tracking
    this.componentStatus = {};
    this.systemMetrics = {};
    this.alerts = [];
    this.healthScore = 100;
  }
  
  /**
   * Initialize status dashboard
   */
  async initialize() {
    try {
      // Discover and register components
      await this.discoverComponents();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      // Call parent initialize
      await super.initialize();
      
      return true;
    } catch (error) {
      logger.error('Status Dashboard initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Discover framework components
   */
  async discoverComponents() {
    // Core components to monitor
    const componentsToCheck = [
      { name: 'Alert Manager', path: '../alerting/alert-manager', key: 'alertManager' },
      { name: 'Health Monitor', path: '../monitoring/health-monitor', key: 'healthMonitor' },
      { name: 'Hook System', path: '../unified-hook-system', key: 'hookSystem' },
      { name: 'Executive Mode', path: '../executive-mode', key: 'executiveMode' },
      { name: 'Resource Manager', path: '../resource-management/resource-manager', key: 'resourceManager' },
      { name: 'Specialists', path: '../specialists', key: 'specialists' }
    ];
    
    for (const component of componentsToCheck) {
      try {
        const modulePath = path.join(__dirname, component.path);
        const Module = require(modulePath);
        
        // Register component
        this.components.set(component.key, {
          name: component.name,
          module: Module,
          status: 'operational',
          lastCheck: new Date().toISOString()
        });
        
        this.componentStatus[component.key] = 'operational';
        
      } catch (error) {
        // Component not available
        this.componentStatus[component.key] = 'unavailable';
        this.components.set(component.key, {
          name: component.name,
          status: 'unavailable',
          error: error.message
        });
      }
    }
    
    // Check departments
    this.checkDepartments();
    
    // Check integrations
    this.checkIntegrations();
  }
  
  /**
   * Check department status
   */
  checkDepartments() {
    const departments = [
      'product-strategist-manager',
      'design-engineer-manager',
      'backend-engineer-manager'
    ];
    
    this.componentStatus.departments = {};
    
    departments.forEach(dept => {
      try {
        require(`../departments/${dept}`);
        this.componentStatus.departments[dept] = 'operational';
      } catch (error) {
        this.componentStatus.departments[dept] = 'unavailable';
      }
    });
  }
  
  /**
   * Check integration status
   */
  checkIntegrations() {
    this.componentStatus.integrations = {
      notion: !!process.env.NOTION_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      gemini: !!process.env.GOOGLE_API_KEY,
      github: !!process.env.GITHUB_TOKEN
    };
  }
  
  /**
   * Setup health monitoring
   */
  setupHealthMonitoring() {
    // Try to connect to Health Monitor
    try {
      const { getInstance } = require('../monitoring/health-monitor');
      const healthMonitor = getInstance();
      
      if (healthMonitor) {
        healthMonitor.on('health:update', (metrics) => {
          this.healthScore = Math.round(metrics.overall * 100);
          this.componentStatus.health = metrics.components;
        });
        
        healthMonitor.on('health:alert', (alert) => {
          this.alerts.push({
            ...alert,
            timestamp: new Date().toISOString()
          });
          
          // Keep only last 10 alerts
          if (this.alerts.length > 10) {
            this.alerts = this.alerts.slice(-10);
          }
        });
      }
    } catch (error) {
      logger.debug('Health Monitor not available');
    }
  }
  
  /**
   * Fetch dashboard data
   */
  async fetchData() {
    // Collect system metrics
    this.systemMetrics = this.collectSystemMetrics();
    
    // Check component health
    await this.checkComponentHealth();
    
    // Calculate overall status
    const operationalCount = Object.values(this.componentStatus)
      .filter(status => status === 'operational' || status === true).length;
    const totalCount = Object.keys(this.componentStatus).length;
    
    const overallHealth = Math.round((operationalCount / totalCount) * 100);
    
    return {
      system: this.systemMetrics,
      components: this.componentStatus,
      health: {
        score: this.healthScore,
        operational: operationalCount,
        total: totalCount,
        percentage: overallHealth
      },
      alerts: this.alerts,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: this.calculateCPUPercent()
      },
      os: {
        hostname: os.hostname(),
        type: os.type(),
        release: os.release(),
        totalMem: os.totalmem(),
        freeMem: os.freemem(),
        loadAvg: os.loadavg()
      }
    };
  }
  
  /**
   * Calculate CPU percentage
   */
  calculateCPUPercent() {
    const cpus = os.cpus();
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
    const percent = 100 - ~~(100 * idle / total);
    
    return percent;
  }
  
  /**
   * Check component health
   */
  async checkComponentHealth() {
    for (const [key, component] of this.components) {
      try {
        // Simple health check - verify module is accessible
        if (component.module) {
          component.status = 'operational';
          component.lastCheck = new Date().toISOString();
        }
      } catch (error) {
        component.status = 'error';
        component.error = error.message;
      }
    }
  }
  
  /**
   * Display dashboard content
   */
  displayContent() {
    // System Overview
    this.displaySystemOverview();
    
    // Component Status
    this.displayComponentStatus();
    
    // Department Status
    this.displayDepartmentStatus();
    
    // Integration Status
    this.displayIntegrationStatus();
    
    // Recent Alerts
    this.displayRecentAlerts();
    
    // Performance Metrics
    this.displayPerformanceMetrics();
  }
  
  /**
   * Display system overview
   */
  displaySystemOverview() {
    console.log(this.colors.header('📊 SYSTEM OVERVIEW'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const health = this.data.health;
    const healthColor = health.score >= 80 ? this.colors.success : 
                       health.score >= 60 ? this.colors.warning : 
                       this.colors.error;
    
    console.log(`Health Score: ${healthColor(`${health.score}%`)}`);
    console.log(`Components: ${health.operational}/${health.total} operational (${health.percentage}%)`);
    console.log(`Platform: ${this.data.system.platform} | Node: ${this.data.system.nodeVersion}`);
    console.log(`Uptime: ${this.formatDuration(this.data.system.uptime * 1000)}`);
    console.log();
  }
  
  /**
   * Display component status
   */
  displayComponentStatus() {
    console.log(this.colors.header('🔧 COMPONENT STATUS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const headers = ['Component', 'Status', 'Health'];
    const rows = [];
    
    for (const [key, component] of this.components) {
      const statusIcon = component.status === 'operational' ? '🏁' : 
                        component.status === 'degraded' ? '🟠️' : '🔴';
      
      const statusText = component.status === 'operational' ? this.colors.success('Operational') :
                        component.status === 'degraded' ? this.colors.warning('Degraded') :
                        this.colors.error('Unavailable');
      
      rows.push([
        component.name,
        statusText,
        statusIcon
      ]);
    }
    
    console.log(this.createTable(headers, rows));
    console.log();
  }
  
  /**
   * Display department status
   */
  displayDepartmentStatus() {
    console.log(this.colors.header('👥 DEPARTMENT STATUS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    if (this.data.components.departments) {
      Object.entries(this.data.components.departments).forEach(([dept, status]) => {
        const icon = status === 'operational' ? '🏁' : '🔴';
        const name = dept.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const statusText = status === 'operational' ? 
          this.colors.success('Active') : this.colors.error('Inactive');
        
        console.log(`${icon} ${name}: ${statusText}`);
      });
    } else {
      console.log(this.colors.muted('No department data available'));
    }
    console.log();
  }
  
  /**
   * Display integration status
   */
  displayIntegrationStatus() {
    console.log(this.colors.header('🔗 INTEGRATION STATUS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    if (this.data.components.integrations) {
      Object.entries(this.data.components.integrations).forEach(([service, connected]) => {
        const icon = connected ? '🟢' : '🔴';
        const status = connected ? this.colors.success('Connected') : this.colors.muted('Not configured');
        const name = service.charAt(0).toUpperCase() + service.slice(1);
        
        console.log(`${icon} ${name}: ${status}`);
      });
    }
    console.log();
  }
  
  /**
   * Display recent alerts
   */
  displayRecentAlerts() {
    console.log(this.colors.header('🔴 RECENT ALERTS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    if (this.data.alerts && this.data.alerts.length > 0) {
      this.data.alerts.slice(-5).forEach(alert => {
        const levelColor = alert.level === 'critical' ? this.colors.error :
                          alert.level === 'warning' ? this.colors.warning :
                          this.colors.info;
        
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`${this.colors.muted(time)} ${levelColor(`[${alert.level.toUpperCase()}]`)} ${alert.message}`);
      });
    } else {
      console.log(this.colors.success('No recent alerts'));
    }
    console.log();
  }
  
  /**
   * Display performance metrics
   */
  displayPerformanceMetrics() {
    console.log(this.colors.header('🟢 PERFORMANCE METRICS'));
    console.log(this.colors.muted('─'.repeat(40)));
    
    const mem = this.data.system.memory;
    const cpu = this.data.system.cpu;
    
    // Memory usage bar chart
    const memUsagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);
    const memBar = this.createProgressBar(memUsagePercent, 30);
    
    console.log(`Memory: ${memBar} ${memUsagePercent}% (${mem.heapUsedMB}MB / ${mem.heapTotalMB}MB)`);
    console.log(`RSS: ${mem.rssMB}MB`);
    console.log(`CPU: ${cpu.percent}%`);
    
    // Load average
    if (this.data.system.os.loadAvg) {
      const load = this.data.system.os.loadAvg;
      console.log(`Load Average: ${load[0].toFixed(2)} ${load[1].toFixed(2)} ${load[2].toFixed(2)}`);
    }
    
    console.log();
  }
  
  /**
   * Create progress bar
   */
  createProgressBar(percent, width = 20) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    
    const color = percent >= 90 ? this.colors.error :
                 percent >= 70 ? this.colors.warning :
                 this.colors.success;
    
    return color('█'.repeat(filled)) + this.colors.muted('░'.repeat(empty));
  }
  
  /**
   * Get summary for external use
   */
  getSummary() {
    return {
      health: this.healthScore,
      components: {
        operational: Object.values(this.componentStatus).filter(s => s === 'operational').length,
        total: Object.keys(this.componentStatus).length
      },
      system: {
        uptime: this.systemMetrics.uptime,
        memory: this.systemMetrics.memory.heapUsedMB,
        cpu: this.systemMetrics.cpu.percent
      },
      alerts: this.alerts.length,
      lastRefresh: this.lastRefresh
    };
  }
  
  /**
   * Set component status (for external updates)
   */
  setComponentStatus(key, status, details = {}) {
    if (this.components.has(key)) {
      const component = this.components.get(key);
      component.status = status;
      component.lastUpdate = new Date().toISOString();
      Object.assign(component, details);
      
      this.componentStatus[key] = status;
      this.emit('component:updated', { key, status, details });
    }
  }
  
  /**
   * Add alert
   */
  addAlert(level, message, details = {}) {
    const alert = {
      level,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.alerts.push(alert);
    
    // Keep only last 20 alerts
    if (this.alerts.length > 20) {
      this.alerts = this.alerts.slice(-20);
    }
    
    this.emit('alert:added', alert);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  StatusDashboard,
  getInstance: (config) => {
    if (!instance) {
      instance = new StatusDashboard(config);
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