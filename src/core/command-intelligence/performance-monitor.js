/**
 * BUMBA Performance Monitor
 * Tracks and optimizes system performance
 */

const { logger } = require('../logging/bumba-logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      commands: new Map(),
      departments: new Map(),
      specialists: new Map(),
      overall: {
        totalCommands: 0,
        totalTime: 0,
        averageTime: 0,
        peakMemory: 0,
        errors: 0
      }
    };
    
    this.activeTimers = new Map();
    this.memoryInterval = null;
    this.reportInterval = null;
    
    // Configuration
    this.config = {
      memoryCheckInterval: 5000, // Check memory every 5 seconds
      reportInterval: 300000, // Report every 5 minutes
      slowThreshold: 5000, // Commands over 5s are slow
      criticalThreshold: 30000 // Commands over 30s are critical
    };
    
    this.startMonitoring();
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    // Monitor memory usage
    this.memoryInterval = setInterval(() => {
      this.checkMemory();
    }, this.config.memoryCheckInterval);
    
    // Regular performance reports
    this.reportInterval = setInterval(() => {
      this.generateReport();
    }, this.config.reportInterval);
    
    logger.info('📊 Performance monitoring started');
  }

  /**
   * Start timing a command
   */
  startCommand(commandId, command, args, context = {}) {
    const timer = {
      id: commandId,
      command,
      args,
      context,
      startTime: Date.now(),
      startMemory: process.memoryUsage()
    };
    
    this.activeTimers.set(commandId, timer);
    
    return commandId;
  }

  /**
   * End timing a command
   */
  endCommand(commandId, result = {}) {
    const timer = this.activeTimers.get(commandId);
    
    if (!timer) {
      logger.warn(`No timer found for command: ${commandId}`);
      return;
    }
    
    const duration = Date.now() - timer.startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - timer.startMemory.heapUsed;
    
    // Record metrics
    this.recordCommandMetrics(timer.command, {
      duration,
      memoryDelta,
      success: result.success !== false,
      department: result.department,
      specialists: result.specialists || []
    });
    
    // Clean up
    this.activeTimers.delete(commandId);
    
    // Log if slow
    if (duration > this.config.slowThreshold) {
      logger.warn(`🐌 Slow command: ${timer.command} took ${(duration / 1000).toFixed(2)}s`);
    }
    
    return {
      command: timer.command,
      duration,
      memoryDelta: this.formatMemory(memoryDelta)
    };
  }

  /**
   * Record command metrics
   */
  recordCommandMetrics(command, metrics) {
    // Update command-specific metrics
    if (!this.metrics.commands.has(command)) {
      this.metrics.commands.set(command, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
        memoryUsage: 0
      });
    }
    
    const cmdMetrics = this.metrics.commands.get(command);
    cmdMetrics.count++;
    cmdMetrics.totalTime += metrics.duration;
    cmdMetrics.averageTime = cmdMetrics.totalTime / cmdMetrics.count;
    cmdMetrics.minTime = Math.min(cmdMetrics.minTime, metrics.duration);
    cmdMetrics.maxTime = Math.max(cmdMetrics.maxTime, metrics.duration);
    cmdMetrics.memoryUsage += metrics.memoryDelta;
    
    if (!metrics.success) {
      cmdMetrics.errors++;
    }
    
    // Update department metrics
    if (metrics.department) {
      this.recordDepartmentMetrics(metrics.department, metrics.duration);
    }
    
    // Update specialist metrics
    metrics.specialists.forEach(specialist => {
      this.recordSpecialistMetrics(specialist, metrics.duration);
    });
    
    // Update overall metrics
    this.metrics.overall.totalCommands++;
    this.metrics.overall.totalTime += metrics.duration;
    this.metrics.overall.averageTime = 
      this.metrics.overall.totalTime / this.metrics.overall.totalCommands;
    
    if (!metrics.success) {
      this.metrics.overall.errors++;
    }
  }

  /**
   * Record department metrics
   */
  recordDepartmentMetrics(department, duration) {
    if (!this.metrics.departments.has(department)) {
      this.metrics.departments.set(department, {
        count: 0,
        totalTime: 0,
        averageTime: 0
      });
    }
    
    const deptMetrics = this.metrics.departments.get(department);
    deptMetrics.count++;
    deptMetrics.totalTime += duration;
    deptMetrics.averageTime = deptMetrics.totalTime / deptMetrics.count;
  }

  /**
   * Record specialist metrics
   */
  recordSpecialistMetrics(specialist, duration) {
    if (!this.metrics.specialists.has(specialist)) {
      this.metrics.specialists.set(specialist, {
        count: 0,
        totalTime: 0,
        averageTime: 0
      });
    }
    
    const specMetrics = this.metrics.specialists.get(specialist);
    specMetrics.count++;
    specMetrics.totalTime += duration;
    specMetrics.averageTime = specMetrics.totalTime / specMetrics.count;
  }

  /**
   * Check memory usage
   */
  checkMemory() {
    const memory = process.memoryUsage();
    
    // Update peak memory
    this.metrics.overall.peakMemory = Math.max(
      this.metrics.overall.peakMemory,
      memory.heapUsed
    );
    
    // Warn if memory is high
    const heapPercent = (memory.heapUsed / memory.heapTotal) * 100;
    if (heapPercent > 90) {
      logger.warn(`⚠️ High memory usage: ${heapPercent.toFixed(1)}%`);
    }
  }

  /**
   * Get slowest commands
   */
  getSlowestCommands(limit = 5) {
    const commands = Array.from(this.metrics.commands.entries())
      .map(([cmd, metrics]) => ({
        command: cmd,
        averageTime: metrics.averageTime,
        maxTime: metrics.maxTime,
        count: metrics.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
    
    return commands;
  }

  /**
   * Get most frequent commands
   */
  getMostFrequentCommands(limit = 5) {
    const commands = Array.from(this.metrics.commands.entries())
      .map(([cmd, metrics]) => ({
        command: cmd,
        count: metrics.count,
        averageTime: metrics.averageTime
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return commands;
  }

  /**
   * Get performance bottlenecks
   */
  getBottlenecks() {
    const bottlenecks = [];
    
    // Check for slow commands
    for (const [cmd, metrics] of this.metrics.commands.entries()) {
      if (metrics.averageTime > this.config.slowThreshold) {
        bottlenecks.push({
          type: 'slow_command',
          command: cmd,
          averageTime: metrics.averageTime,
          severity: metrics.averageTime > this.config.criticalThreshold ? 'critical' : 'warning'
        });
      }
    }
    
    // Check for high error rates
    for (const [cmd, metrics] of this.metrics.commands.entries()) {
      const errorRate = metrics.errors / metrics.count;
      if (errorRate > 0.1) { // More than 10% errors
        bottlenecks.push({
          type: 'high_errors',
          command: cmd,
          errorRate: `${(errorRate * 100).toFixed(1)}%`,
          severity: errorRate > 0.5 ? 'critical' : 'warning'
        });
      }
    }
    
    // Check memory usage
    const currentMemory = process.memoryUsage();
    const heapPercent = (currentMemory.heapUsed / currentMemory.heapTotal) * 100;
    if (heapPercent > 80) {
      bottlenecks.push({
        type: 'memory_pressure',
        usage: `${heapPercent.toFixed(1)}%`,
        severity: heapPercent > 90 ? 'critical' : 'warning'
      });
    }
    
    return bottlenecks;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overall: {
        totalCommands: this.metrics.overall.totalCommands,
        averageTime: `${(this.metrics.overall.averageTime / 1000).toFixed(2)}s`,
        errorRate: this.metrics.overall.totalCommands > 0
          ? `${((this.metrics.overall.errors / this.metrics.overall.totalCommands) * 100).toFixed(1)}%`
          : '0%',
        peakMemory: this.formatMemory(this.metrics.overall.peakMemory)
      },
      slowestCommands: this.getSlowestCommands(),
      mostFrequent: this.getMostFrequentCommands(),
      bottlenecks: this.getBottlenecks(),
      departments: this.getDepartmentStats(),
      recommendations: this.getOptimizationRecommendations()
    };
    
    logger.info('📊 Performance Report:', report);
    
    return report;
  }

  /**
   * Get department statistics
   */
  getDepartmentStats() {
    const stats = {};
    
    for (const [dept, metrics] of this.metrics.departments.entries()) {
      stats[dept] = {
        requests: metrics.count,
        averageTime: `${(metrics.averageTime / 1000).toFixed(2)}s`
      };
    }
    
    return stats;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const bottlenecks = this.getBottlenecks();
    
    // Check for slow commands
    const slowCommands = bottlenecks.filter(b => b.type === 'slow_command');
    if (slowCommands.length > 0) {
      recommendations.push({
        issue: 'Slow commands detected',
        suggestion: 'Consider using lite mode or caching for these commands',
        commands: slowCommands.map(b => b.command)
      });
    }
    
    // Check for high error rates
    const errorCommands = bottlenecks.filter(b => b.type === 'high_errors');
    if (errorCommands.length > 0) {
      recommendations.push({
        issue: 'High error rates',
        suggestion: 'Review error handling and input validation',
        commands: errorCommands.map(b => b.command)
      });
    }
    
    // Check memory
    const memoryIssues = bottlenecks.filter(b => b.type === 'memory_pressure');
    if (memoryIssues.length > 0) {
      recommendations.push({
        issue: 'Memory pressure detected',
        suggestion: 'Consider eco mode or clearing cache',
        severity: memoryIssues[0].severity
      });
    }
    
    // General recommendations based on patterns
    if (this.metrics.overall.averageTime > 10000) {
      recommendations.push({
        issue: 'High average execution time',
        suggestion: 'Enable turbo mode for parallel processing'
      });
    }
    
    return recommendations;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.commands.clear();
    this.metrics.departments.clear();
    this.metrics.specialists.clear();
    this.metrics.overall = {
      totalCommands: 0,
      totalTime: 0,
      averageTime: 0,
      peakMemory: 0,
      errors: 0
    };
    
    logger.info('📊 Performance metrics reset');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    logger.info('📊 Performance monitoring stopped');
  }

  /**
   * Format memory size
   */
  formatMemory(bytes) {
    if (bytes < 0) return '0B';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      activeCommands: this.activeTimers.size,
      totalProcessed: this.metrics.overall.totalCommands,
      averageTime: `${(this.metrics.overall.averageTime / 1000).toFixed(2)}s`,
      errorRate: this.metrics.overall.totalCommands > 0
        ? `${((this.metrics.overall.errors / this.metrics.overall.totalCommands) * 100).toFixed(1)}%`
        : '0%',
      memoryUsage: this.formatMemory(process.memoryUsage().heapUsed),
      peakMemory: this.formatMemory(this.metrics.overall.peakMemory)
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  PerformanceMonitor,
  getInstance: () => {
    if (!instance) {
      instance = new PerformanceMonitor();
    }
    return instance;
  }
};