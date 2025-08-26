/**
 * BUMBA Resource Enforcer
 * Validates and enforces resource limits across the framework
 */

const { EventEmitter } = require('events');
const os = require('os');
const { logger } = require('../logging/bumba-logger');

class ResourceEnforcer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Load performance config
    const performanceConfig = require('../../../config/performance.config').load();
    
    this.limits = {
      memory: {
        max: config.maxMemory || performanceConfig.limits.memory.max,
        warning: config.memoryWarning || performanceConfig.limits.memory.warning,
        critical: config.memoryCritical || performanceConfig.limits.memory.max * 0.95
      },
      cpu: {
        max: config.maxCPU || performanceConfig.limits.cpu.max,
        warning: config.cpuWarning || performanceConfig.limits.cpu.warning
      },
      concurrent: {
        tasks: config.maxConcurrentTasks || performanceConfig.limits.concurrent.maxTasks,
        departments: config.maxDepartments || performanceConfig.limits.concurrent.maxDepartments,
        specialists: config.maxSpecialists || performanceConfig.limits.concurrent.maxSpecialists
      },
      timeout: {
        command: config.commandTimeout || performanceConfig.limits.timeout.command,
        task: config.taskTimeout || performanceConfig.limits.timeout.task,
        api: config.apiTimeout || performanceConfig.limits.timeout.api
      },
      ...config.limits
    };
    
    // Current usage tracking
    this.usage = {
      memory: {
        current: 0,
        peak: 0,
        violations: 0
      },
      cpu: {
        current: 0,
        peak: 0,
        violations: 0
      },
      concurrent: {
        tasks: 0,
        departments: 0,
        specialists: 0
      },
      activeTimeouts: new Map()
    };
    
    // Enforcement actions
    this.actions = {
      memoryPressure: false,
      cpuThrottling: false,
      taskQueueing: false,
      emergencyGC: false
    };
    
    // Start monitoring
    this.startEnforcement();
  }
  
  /**
   * Start resource enforcement
   */
  startEnforcement() {
    // Monitor memory every 5 seconds
    this.memoryMonitor = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);
    
    // Monitor CPU every 2 seconds
    this.cpuMonitor = setInterval(() => {
      this.checkCPUUsage();
    }, 2000);
    
    logger.info('🟡️ Resource enforcement activated');
  }
  
  /**
   * Check memory usage and enforce limits
   */
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.usage.memory.current = memUsage.heapUsed;
    this.usage.memory.peak = Math.max(this.usage.memory.peak, memUsage.heapUsed);
    
    // Check against limits
    if (memUsage.heapUsed > this.limits.memory.critical) {
      this.handleCriticalMemory();
    } else if (memUsage.heapUsed > this.limits.memory.max) {
      this.handleMemoryViolation();
    } else if (memUsage.heapUsed > this.limits.memory.warning) {
      this.handleMemoryWarning();
    } else if (this.actions.memoryPressure) {
      this.clearMemoryPressure();
    }
  }
  
  /**
   * Check CPU usage and enforce limits
   */
  checkCPUUsage() {
    const cpus = os.cpus();
    const loads = os.loadavg();
    
    // Calculate CPU percentage (rough estimate)
    const cpuCount = cpus.length;
    const load1min = loads[0];
    const cpuPercent = (load1min / cpuCount) * 100;
    
    this.usage.cpu.current = cpuPercent;
    this.usage.cpu.peak = Math.max(this.usage.cpu.peak, cpuPercent);
    
    // Check against limits
    if (cpuPercent > this.limits.cpu.max) {
      this.handleCPUViolation();
    } else if (cpuPercent > this.limits.cpu.warning) {
      this.handleCPUWarning();
    } else if (this.actions.cpuThrottling) {
      this.clearCPUThrottling();
    }
  }
  
  /**
   * Handle critical memory situation
   */
  handleCriticalMemory() {
    this.usage.memory.violations++;
    
    if (!this.actions.emergencyGC) {
      logger.error('🔴 CRITICAL: Memory usage exceeds critical threshold!');
      this.actions.emergencyGC = true;
      
      // Force garbage collection if available
      if (global.gc) {
        logger.info('🧹 Forcing emergency garbage collection...');
        global.gc();
      }
      
      // Emit critical event
      this.emit('resource:critical', {
        type: 'memory',
        usage: this.usage.memory.current,
        limit: this.limits.memory.critical
      });
      
      // Stop accepting new tasks
      this.actions.taskQueueing = true;
    }
  }
  
  /**
   * Handle memory limit violation
   */
  handleMemoryViolation() {
    this.usage.memory.violations++;
    
    if (!this.actions.memoryPressure) {
      logger.warn(`🟠️ Memory limit exceeded: ${this.formatBytes(this.usage.memory.current)} / ${this.formatBytes(this.limits.memory.max)}`);
      this.actions.memoryPressure = true;
      
      // Emit violation event
      this.emit('resource:violation', {
        type: 'memory',
        usage: this.usage.memory.current,
        limit: this.limits.memory.max
      });
      
      // Request memory optimization
      this.emit('optimize:memory');
    }
  }
  
  /**
   * Handle memory warning
   */
  handleMemoryWarning() {
    if (!this.memoryWarned) {
      logger.info(`📊 Memory usage warning: ${this.formatBytes(this.usage.memory.current)} / ${this.formatBytes(this.limits.memory.warning)}`);
      this.memoryWarned = true;
      
      this.emit('resource:warning', {
        type: 'memory',
        usage: this.usage.memory.current,
        limit: this.limits.memory.warning
      });
    }
  }
  
  /**
   * Clear memory pressure
   */
  clearMemoryPressure() {
    logger.info('🏁 Memory pressure cleared');
    this.actions.memoryPressure = false;
    this.actions.emergencyGC = false;
    this.actions.taskQueueing = false;
    this.memoryWarned = false;
    
    this.emit('resource:recovered', { type: 'memory' });
  }
  
  /**
   * Handle CPU violation
   */
  handleCPUViolation() {
    this.usage.cpu.violations++;
    
    if (!this.actions.cpuThrottling) {
      logger.warn(`🟠️ CPU limit exceeded: ${this.usage.cpu.current.toFixed(1)}% / ${this.limits.cpu.max}%`);
      this.actions.cpuThrottling = true;
      
      this.emit('resource:violation', {
        type: 'cpu',
        usage: this.usage.cpu.current,
        limit: this.limits.cpu.max
      });
      
      // Request CPU optimization
      this.emit('optimize:cpu');
    }
  }
  
  /**
   * Handle CPU warning
   */
  handleCPUWarning() {
    if (!this.cpuWarned) {
      logger.info(`📊 CPU usage warning: ${this.usage.cpu.current.toFixed(1)}% / ${this.limits.cpu.warning}%`);
      this.cpuWarned = true;
      
      this.emit('resource:warning', {
        type: 'cpu',
        usage: this.usage.cpu.current,
        limit: this.limits.cpu.warning
      });
    }
  }
  
  /**
   * Clear CPU throttling
   */
  clearCPUThrottling() {
    logger.info('🏁 CPU throttling cleared');
    this.actions.cpuThrottling = false;
    this.cpuWarned = false;
    
    this.emit('resource:recovered', { type: 'cpu' });
  }
  
  /**
   * Check if can allocate resources
   */
  canAllocate(type, amount = 1) {
    switch (type) {
      case 'memory':
        const projectedMemory = this.usage.memory.current + amount;
        return projectedMemory < this.limits.memory.max;
        
      case 'task':
        return !this.actions.taskQueueing && 
               this.usage.concurrent.tasks < this.limits.concurrent.tasks;
        
      case 'department':
        return this.usage.concurrent.departments < this.limits.concurrent.departments;
        
      case 'specialist':
        return this.usage.concurrent.specialists < this.limits.concurrent.specialists;
        
      default:
        return true;
    }
  }
  
  /**
   * Allocate resources
   */
  allocate(type, amount = 1, id = null) {
    if (!this.canAllocate(type, amount)) {
      throw new Error(`Cannot allocate ${type}: resource limit exceeded`);
    }
    
    switch (type) {
      case 'task':
        this.usage.concurrent.tasks += amount;
        break;
      case 'department':
        this.usage.concurrent.departments += amount;
        break;
      case 'specialist':
        this.usage.concurrent.specialists += amount;
        break;
    }
    
    if (id) {
      this.trackAllocation(type, id, amount);
    }
    
    return true;
  }
  
  /**
   * Release resources
   */
  release(type, amount = 1, id = null) {
    switch (type) {
      case 'task':
        this.usage.concurrent.tasks = Math.max(0, this.usage.concurrent.tasks - amount);
        break;
      case 'department':
        this.usage.concurrent.departments = Math.max(0, this.usage.concurrent.departments - amount);
        break;
      case 'specialist':
        this.usage.concurrent.specialists = Math.max(0, this.usage.concurrent.specialists - amount);
        break;
    }
    
    if (id) {
      this.untrackAllocation(type, id);
    }
  }
  
  /**
   * Track allocation
   */
  trackAllocation(type, id, amount) {
    const key = `${type}:${id}`;
    this.usage.activeTimeouts.set(key, {
      type,
      id,
      amount,
      timestamp: Date.now()
    });
  }
  
  /**
   * Untrack allocation
   */
  untrackAllocation(type, id) {
    const key = `${type}:${id}`;
    this.usage.activeTimeouts.delete(key);
  }
  
  /**
   * Enforce timeout
   */
  enforceTimeout(promise, timeout, type = 'operation') {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${type} timeout after ${timeout}ms`));
      }, timeout);
      
      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  
  /**
   * Execute with resource limits
   */
  async executeWithLimits(fn, options = {}) {
    const {
      type = 'task',
      timeout = this.limits.timeout.task,
      memory = null,
      id = `${type}_${Date.now()}`
    } = options;
    
    // Check allocation
    if (!this.canAllocate(type)) {
      throw new Error(`Resource limit exceeded for ${type}`);
    }
    
    // Allocate
    this.allocate(type, 1, id);
    
    try {
      // Execute with timeout
      const result = await this.enforceTimeout(
        Promise.resolve(fn()),
        timeout,
        type
      );
      
      return result;
      
    } finally {
      // Always release
      this.release(type, 1, id);
    }
  }
  
  /**
   * Get resource usage report
   */
  getUsage() {
    return {
      memory: {
        current: this.formatBytes(this.usage.memory.current),
        peak: this.formatBytes(this.usage.memory.peak),
        limit: this.formatBytes(this.limits.memory.max),
        percentage: ((this.usage.memory.current / this.limits.memory.max) * 100).toFixed(1),
        violations: this.usage.memory.violations
      },
      cpu: {
        current: `${this.usage.cpu.current.toFixed(1)}%`,
        peak: `${this.usage.cpu.peak.toFixed(1)}%`,
        limit: `${this.limits.cpu.max}%`,
        violations: this.usage.cpu.violations
      },
      concurrent: {
        tasks: `${this.usage.concurrent.tasks}/${this.limits.concurrent.tasks}`,
        departments: `${this.usage.concurrent.departments}/${this.limits.concurrent.departments}`,
        specialists: `${this.usage.concurrent.specialists}/${this.limits.concurrent.specialists}`
      },
      enforcement: this.actions,
      health: this.getHealthStatus()
    };
  }
  
  /**
   * Get health status
   */
  getHealthStatus() {
    if (this.actions.emergencyGC || this.actions.memoryPressure && this.actions.cpuThrottling) {
      return 'critical';
    }
    
    if (this.actions.memoryPressure || this.actions.cpuThrottling) {
      return 'degraded';
    }
    
    if (this.memoryWarned || this.cpuWarned) {
      return 'warning';
    }
    
    return 'healthy';
  }
  
  /**
   * Format bytes
   */
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  
  /**
   * Update limits
   */
  updateLimits(newLimits) {
    Object.assign(this.limits, newLimits);
    logger.info('📏 Resource limits updated');
  }
  
  /**
   * Stop enforcement
   */
  stop() {
    if (this.memoryMonitor && typeof this.memoryMonitor !== "undefined") {
      clearInterval(this.memoryMonitor);
    }
    
    if (this.cpuMonitor && typeof this.cpuMonitor !== "undefined") {
      clearInterval(this.cpuMonitor);
    }
    
    logger.info('🔴 Resource enforcement stopped');
  }
}

// Singleton instance
let instance = null;

function getInstance(config) {
  if (!instance) {
    instance = new ResourceEnforcer(config);
  }
  return instance;
}

module.exports = {
  ResourceEnforcer,
  getInstance,
  
  // Convenience methods
  canAllocate: (type, amount) => getInstance().canAllocate(type, amount),
  allocate: (type, amount, id) => getInstance().allocate(type, amount, id),
  release: (type, amount, id) => getInstance().release(type, amount, id),
  executeWithLimits: (fn, options) => getInstance().executeWithLimits(fn, options),
  getUsage: () => getInstance().getUsage()
};