/**
 * BUMBA Resource Optimizer
 * Optimizes resource usage across the system
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getCacheManager } = require('./cache-manager');
const { getInstance: getPerformanceMonitor } = require('./performance-monitor');

class ResourceOptimizer {
  constructor() {
    this.cacheManager = getCacheManager();
    this.performanceMonitor = getPerformanceMonitor();
    
    this.resourceLimits = {
      maxConcurrentCommands: 5,
      maxSpecialistsPerCommand: 5,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      maxExecutionTime: 60000 // 60 seconds
    };
    
    this.currentResources = {
      activeCommands: 0,
      activeSpecialists: 0,
      memoryUsage: 0,
      cacheSize: 0
    };
    
    this.optimizationStrategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize optimization strategies
   */
  initializeStrategies() {
    // Memory optimization strategies
    this.optimizationStrategies.set('memory', {
      light: () => this.reduceCacheSize(0.5),
      moderate: () => this.reduceCacheSize(0.3),
      aggressive: () => this.clearAllCaches()
    });
    
    // Performance optimization strategies
    this.optimizationStrategies.set('performance', {
      light: () => this.limitConcurrency(3),
      moderate: () => this.limitConcurrency(2),
      aggressive: () => this.limitConcurrency(1)
    });
    
    // Specialist optimization strategies
    this.optimizationStrategies.set('specialists', {
      light: () => this.limitSpecialists(3),
      moderate: () => this.limitSpecialists(2),
      aggressive: () => this.limitSpecialists(1)
    });
  }

  /**
   * Optimize resources before command execution
   */
  async optimizeForCommand(command, args, context) {
    const optimization = {
      applied: [],
      context: { ...context }
    };
    
    // Check current resource usage
    const resourceStatus = this.checkResourceStatus();
    
    // Apply optimizations based on resource pressure
    if (resourceStatus.memoryPressure > 0.8) {
      logger.warn('⚠️ High memory pressure detected');
      optimization.applied.push('memory_optimization');
      await this.optimizeMemory(resourceStatus.memoryPressure);
      optimization.context.limitSpecialists = 2;
      optimization.context.skipCache = false;
    }
    
    if (resourceStatus.cpuPressure > 0.8) {
      logger.warn('⚠️ High CPU pressure detected');
      optimization.applied.push('cpu_optimization');
      await this.optimizeCPU();
      optimization.context.mode = 'eco';
    }
    
    if (this.currentResources.activeCommands >= this.resourceLimits.maxConcurrentCommands) {
      logger.warn('⚠️ Max concurrent commands reached');
      optimization.applied.push('concurrency_limit');
      await this.waitForResourceAvailability();
    }
    
    // Predict resource needs
    const predictedNeeds = this.predictResourceNeeds(command, args);
    
    // Pre-optimize if needed
    if (predictedNeeds.memory > this.getAvailableMemory()) {
      optimization.applied.push('preemptive_memory_clear');
      await this.freeMemory(predictedNeeds.memory);
    }
    
    if (predictedNeeds.time > this.resourceLimits.maxExecutionTime) {
      optimization.context.timeout = this.resourceLimits.maxExecutionTime;
      optimization.applied.push('timeout_limit');
    }
    
    return optimization;
  }

  /**
   * Check current resource status
   */
  checkResourceStatus() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.currentResources.memoryUsage = memUsage.heapUsed;
    
    return {
      memoryPressure: memUsage.heapUsed / memUsage.heapTotal,
      cpuPressure: this.calculateCPUPressure(cpuUsage),
      cacheSize: this.cacheManager.getStats().size,
      activeCommands: this.currentResources.activeCommands,
      activeSpecialists: this.currentResources.activeSpecialists
    };
  }

  /**
   * Calculate CPU pressure
   */
  calculateCPUPressure(cpuUsage) {
    // Simple heuristic - can be improved
    const totalTime = cpuUsage.user + cpuUsage.system;
    const pressure = Math.min(totalTime / 1000000000, 1); // Normalize to 0-1
    return pressure;
  }

  /**
   * Predict resource needs for command
   */
  predictResourceNeeds(command, args) {
    // Get historical data from performance monitor
    const stats = this.performanceMonitor.metrics.commands.get(command);
    
    if (stats) {
      return {
        memory: stats.memoryUsage / stats.count,
        time: stats.averageTime,
        specialists: this.predictSpecialistCount(command)
      };
    }
    
    // Default predictions based on command type
    const defaults = {
      'implement': { memory: 50 * 1024 * 1024, time: 30000, specialists: 5 },
      'analyze': { memory: 30 * 1024 * 1024, time: 20000, specialists: 3 },
      'prd': { memory: 20 * 1024 * 1024, time: 15000, specialists: 3 },
      'design': { memory: 25 * 1024 * 1024, time: 15000, specialists: 3 },
      'api': { memory: 15 * 1024 * 1024, time: 10000, specialists: 2 }
    };
    
    return defaults[command] || { memory: 10 * 1024 * 1024, time: 10000, specialists: 2 };
  }

  /**
   * Predict specialist count
   */
  predictSpecialistCount(command) {
    const specialistCounts = {
      'implement': 5,
      'analyze': 3,
      'prd': 3,
      'requirements': 2,
      'design': 3,
      'api': 2,
      'database': 2
    };
    
    return specialistCounts[command] || 2;
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory(pressure) {
    const strategy = pressure > 0.9 ? 'aggressive' : 
                    pressure > 0.8 ? 'moderate' : 'light';
    
    const optimizer = this.optimizationStrategies.get('memory')[strategy];
    if (optimizer) {
      await optimizer();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('🧹 Forced garbage collection');
      }
    }
  }

  /**
   * Optimize CPU usage
   */
  async optimizeCPU() {
    // Reduce concurrent operations
    await this.limitConcurrency(2);
    
    // Add delays between operations
    this.addProcessingDelays = true;
  }

  /**
   * Free memory
   */
  async freeMemory(requiredBytes) {
    logger.info(`🧹 Freeing ${this.formatMemory(requiredBytes)} of memory`);
    
    // Clear caches progressively
    const cacheStats = this.cacheManager.getStats();
    const cacheBytes = parseInt(cacheStats.size);
    
    if (cacheBytes > requiredBytes / 2) {
      this.cacheManager.clear();
      logger.info('🧹 Cleared cache to free memory');
    }
    
    // Request garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Wait for resource availability
   */
  async waitForResourceAvailability() {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 100;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (this.currentResources.activeCommands < this.resourceLimits.maxConcurrentCommands) {
        return true;
      }
      
      await this.sleep(checkInterval);
    }
    
    throw new Error('Resource availability timeout');
  }

  /**
   * Reduce cache size
   */
  reduceCacheSize(factor) {
    const stats = this.cacheManager.getStats();
    const targetSize = stats.items * factor;
    
    // Evict oldest entries
    let evicted = 0;
    while (this.cacheManager.memoryCache.size > targetSize && evicted < 100) {
      this.cacheManager.evictLRU();
      evicted++;
    }
    
    logger.info(`🧹 Reduced cache by ${(1 - factor) * 100}% (${evicted} items)`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.cacheManager.clear();
    logger.info('🧹 Cleared all caches');
  }

  /**
   * Limit concurrency
   */
  limitConcurrency(maxConcurrent) {
    this.resourceLimits.maxConcurrentCommands = maxConcurrent;
    logger.info(`🔧 Limited concurrency to ${maxConcurrent}`);
  }

  /**
   * Limit specialists
   */
  limitSpecialists(maxSpecialists) {
    this.resourceLimits.maxSpecialistsPerCommand = maxSpecialists;
    logger.info(`🔧 Limited specialists to ${maxSpecialists} per command`);
  }

  /**
   * Track command start
   */
  commandStarted(commandId) {
    this.currentResources.activeCommands++;
    logger.debug(`📈 Active commands: ${this.currentResources.activeCommands}`);
  }

  /**
   * Track command end
   */
  commandEnded(commandId) {
    this.currentResources.activeCommands = Math.max(0, this.currentResources.activeCommands - 1);
    logger.debug(`📉 Active commands: ${this.currentResources.activeCommands}`);
  }

  /**
   * Track specialist activation
   */
  specialistActivated(specialistId) {
    this.currentResources.activeSpecialists++;
  }

  /**
   * Track specialist deactivation
   */
  specialistDeactivated(specialistId) {
    this.currentResources.activeSpecialists = Math.max(0, this.currentResources.activeSpecialists - 1);
  }

  /**
   * Get available memory
   */
  getAvailableMemory() {
    const memUsage = process.memoryUsage();
    return memUsage.heapTotal - memUsage.heapUsed;
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const status = this.checkResourceStatus();
    
    if (status.memoryPressure > 0.7) {
      recommendations.push({
        type: 'memory',
        severity: status.memoryPressure > 0.9 ? 'critical' : 'warning',
        action: 'Consider using eco mode or clearing cache'
      });
    }
    
    if (status.activeCommands > 3) {
      recommendations.push({
        type: 'concurrency',
        severity: 'info',
        action: 'High concurrency - monitor for performance issues'
      });
    }
    
    if (status.cacheSize > 50 * 1024 * 1024) {
      recommendations.push({
        type: 'cache',
        severity: 'info',
        action: 'Large cache size - consider periodic cleanup'
      });
    }
    
    return recommendations;
  }

  /**
   * Get resource statistics
   */
  getStats() {
    const status = this.checkResourceStatus();
    
    return {
      memory: {
        used: this.formatMemory(this.currentResources.memoryUsage),
        available: this.formatMemory(this.getAvailableMemory()),
        pressure: `${(status.memoryPressure * 100).toFixed(1)}%`
      },
      cpu: {
        pressure: `${(status.cpuPressure * 100).toFixed(1)}%`
      },
      commands: {
        active: this.currentResources.activeCommands,
        limit: this.resourceLimits.maxConcurrentCommands
      },
      specialists: {
        active: this.currentResources.activeSpecialists,
        limitPerCommand: this.resourceLimits.maxSpecialistsPerCommand
      },
      cache: {
        size: this.cacheManager.getStats().size,
        limit: this.formatMemory(this.resourceLimits.maxCacheSize)
      }
    };
  }

  /**
   * Format memory
   */
  formatMemory(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset optimizer
   */
  reset() {
    this.currentResources = {
      activeCommands: 0,
      activeSpecialists: 0,
      memoryUsage: 0,
      cacheSize: 0
    };
    
    logger.info('🔧 Resource optimizer reset');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ResourceOptimizer,
  getInstance: () => {
    if (!instance) {
      instance = new ResourceOptimizer();
    }
    return instance;
  }
};