/**
 * BUMBA Health Monitor
 * Tracks system health, component status, and uptime
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class HealthMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      checkInterval: config.checkInterval || 60000, // 1 minute
      metricsFile: config.metricsFile || path.join(process.cwd(), '.bumba-health.json'),
      alertThreshold: config.alertThreshold || 0.7, // 70% health threshold
      ...config
    };
    
    // Health metrics
    this.metrics = {
      overall: 1.0,
      components: {},
      uptime: 0,
      lastCheck: null,
      alerts: []
    };
    
    // Component registry
    this.components = new Map();
    
    // Start time
    this.startTime = Date.now();
    
    // Initialize monitoring
    this.initialize();
  }
  
  /**
   * Initialize health monitoring
   */
  async initialize() {
    // Load previous metrics
    await this.loadMetrics();
    
    // Register core components
    this.registerCoreComponents();
    
    // Start health checks
    this.startHealthChecks();
    
    logger.info('🟢 Health Monitor initialized');
  }
  
  /**
   * Register core framework components
   */
  registerCoreComponents() {
    this.registerComponent('specialists', {
      check: () => this.checkSpecialists(),
      critical: true
    });
    
    this.registerComponent('departments', {
      check: () => this.checkDepartments(),
      critical: true
    });
    
    this.registerComponent('hooks', {
      check: () => this.checkHookSystem(),
      critical: false
    });
    
    this.registerComponent('memory', {
      check: () => this.checkMemoryUsage(),
      critical: false
    });
    
    this.registerComponent('api', {
      check: () => this.checkAPIConnections(),
      critical: false
    });
  }
  
  /**
   * Register a component for monitoring
   */
  registerComponent(name, config) {
    this.components.set(name, {
      name,
      ...config,
      status: 'unknown',
      health: 1.0,
      lastCheck: null
    });
  }
  
  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);
    
    // Initial check
    this.performHealthCheck();
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const results = {};
    let totalHealth = 0;
    let criticalHealth = 0;
    let criticalCount = 0;
    
    // Check each component
    for (const [name, component] of this.components) {
      try {
        const health = await component.check();
        
        results[name] = {
          health,
          status: health >= 0.8 ? 'healthy' : health >= 0.5 ? 'degraded' : 'unhealthy',
          lastCheck: new Date().toISOString()
        };
        
        totalHealth += health;
        
        if (component.critical) {
          criticalHealth += health;
          criticalCount++;
        }
        
        // Update component status
        component.health = health;
        component.status = results[name].status;
        component.lastCheck = results[name].lastCheck;
        
      } catch (error) {
        results[name] = {
          health: 0,
          status: 'error',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
        
        if (component.critical) {
          criticalCount++;
        }
      }
    }
    
    // Calculate overall health
    const overallHealth = criticalCount > 0 
      ? criticalHealth / criticalCount 
      : totalHealth / this.components.size;
    
    // Update metrics
    this.metrics = {
      overall: overallHealth,
      components: results,
      uptime: Date.now() - this.startTime,
      lastCheck: new Date().toISOString(),
      alerts: this.generateAlerts(results, overallHealth)
    };
    
    // Emit health update
    this.emit('health:update', this.metrics);
    
    // Check for alerts
    if (overallHealth < this.config.alertThreshold) {
      this.emit('health:alert', {
        level: 'warning',
        message: `System health below threshold: ${Math.round(overallHealth * 100)}%`,
        components: Object.entries(results)
          .filter(([_, r]) => r.health < 0.5)
          .map(([name]) => name)
      });
    }
    
    // Persist metrics
    await this.saveMetrics();
    
    return this.metrics;
  }
  
  /**
   * Check specialists health
   */
  async checkSpecialists() {
    const fs = require('fs');
    const specialistPath = path.join(__dirname, '../../specialists');
    
    try {
      // Count specialist files
      let count = 0;
      const countFiles = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            countFiles(fullPath);
          } else if (item.endsWith('.js')) {
            count++;
          }
        }
      };
      
      countFiles(specialistPath);
      
      // Health based on specialist count (expecting 82)
      return count >= 82 ? 1.0 : count >= 70 ? 0.8 : count >= 50 ? 0.6 : count >= 30 ? 0.4 : 0.2;
      
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Check department managers health
   */
  async checkDepartments() {
    try {
      const departments = [
        '../departments/product-strategist-manager.js',
        '../departments/design-engineer-manager.js',
        '../departments/backend-engineer-manager.js'
      ];
      
      let working = 0;
      for (const dept of departments) {
        try {
          require(dept);
          working++;
        } catch (error) {
          // Department not working
        }
      }
      
      return working / departments.length;
      
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Check hook system health
   */
  async checkHookSystem() {
    try {
      const hooks = require('../unified-hook-system');
      
      if (hooks.getInstance && hooks.getHookSystem) {
        const instance = hooks.getInstance();
        if (instance.register && instance.execute) {
          return 1.0;
        }
      }
      
      return 0.5;
      
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    const used = process.memoryUsage();
    const heapUsedMB = used.heapUsed / 1024 / 1024;
    const heapTotalMB = used.heapTotal / 1024 / 1024;
    
    const usage = heapUsedMB / heapTotalMB;
    
    // Health inversely proportional to memory usage
    if (usage < 0.5) return 1.0;
    if (usage < 0.7) return 0.8;
    if (usage < 0.85) return 0.6;
    if (usage < 0.95) return 0.4;
    return 0.2;
  }
  
  /**
   * Check API connections
   */
  async checkAPIConnections() {
    // Check for API keys in environment
    const apis = {
      gemini: process.env.GOOGLE_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      notion: process.env.NOTION_API_KEY
    };
    
    const connected = Object.values(apis).filter(key => key && key.length > 0).length;
    const total = Object.keys(apis).length;
    
    return connected / total;
  }
  
  /**
   * Generate alerts based on health status
   */
  generateAlerts(results, overallHealth) {
    const alerts = [];
    
    // Overall health alert
    if (overallHealth < 0.5) {
      alerts.push({
        level: 'critical',
        message: 'System health critical',
        value: overallHealth
      });
    } else if (overallHealth < this.config.alertThreshold) {
      alerts.push({
        level: 'warning',
        message: 'System health degraded',
        value: overallHealth
      });
    }
    
    // Component alerts
    for (const [name, result] of Object.entries(results)) {
      if (result.health < 0.3) {
        alerts.push({
          level: 'critical',
          component: name,
          message: `${name} health critical`,
          value: result.health
        });
      } else if (result.health < 0.6) {
        alerts.push({
          level: 'warning',
          component: name,
          message: `${name} health degraded`,
          value: result.health
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * Load metrics from file
   */
  async loadMetrics() {
    try {
      const data = await fs.readFile(this.config.metricsFile, 'utf-8');
      const saved = JSON.parse(data);
      
      // Only load if from today
      const savedDate = new Date(saved.lastCheck).toDateString();
      const today = new Date().toDateString();
      
      if (savedDate === today) {
        this.metrics = saved;
      }
    } catch (error) {
      // No previous metrics or error reading
    }
  }
  
  /**
   * Save metrics to file
   */
  async saveMetrics() {
    try {
      await fs.writeFile(
        this.config.metricsFile,
        JSON.stringify(this.metrics, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save health metrics:', error);
    }
  }
  
  /**
   * Get current health status
   */
  getStatus() {
    return {
      overall: Math.round(this.metrics.overall * 100) + '%',
      uptime: this.formatUptime(this.metrics.uptime),
      components: Object.entries(this.metrics.components).map(([name, data]) => ({
        name,
        health: Math.round(data.health * 100) + '%',
        status: data.status
      })),
      alerts: this.metrics.alerts.length,
      lastCheck: this.metrics.lastCheck
    };
  }
  
  /**
   * Format uptime for display
   */
  formatUptime(ms) {
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
   * Stop health monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    logger.info('🟢 Health Monitor stopped');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  HealthMonitor,
  getInstance: (config) => {
    if (!instance) {
      instance = new HealthMonitor(config);
    }
    return instance;
  },
  
  // Convenience method for quick health check
  checkHealth: async () => {
    const monitor = module.exports.getInstance();
    return await monitor.performHealthCheck();
  }
};