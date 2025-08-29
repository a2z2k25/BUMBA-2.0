/**
 * BUMBA Health Check System
 * Monitors and reports system health status
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { performanceMetrics } = require('./performance-metrics');

class HealthCheckSystem extends EventEmitter {
  constructor() {
    super();
    this.checks = new Map();
    this.status = 'initializing';
    this.lastCheck = null;
    this.checkInterval = null;
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000,   // 5 seconds per check
      retries: 3
    };
  }

  // Register a health check
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      check: checkFunction,
      status: 'pending',
      lastResult: null,
      lastCheck: null,
      options: {
        critical: options.critical || false,
        timeout: options.timeout || this.config.timeout,
        retries: options.retries || this.config.retries
      }
    });

    logger.debug(`Health check registered: ${name}`);
  }

  // Run a single health check
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check ${name} not found`);
    }

    const timer = performanceMetrics.startTimer(`health:${name}`);
    
    try {
      // Run with timeout
      const result = await Promise.race([
        check.check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), check.options.timeout)
        )
      ]);

      check.status = 'healthy';
      check.lastResult = result;
      check.lastCheck = Date.now();

      timer();
      
      this.emit('check-passed', { name, result });
      return { name, status: 'healthy', result };

    } catch (error) {
      check.status = 'unhealthy';
      check.lastResult = error.message;
      check.lastCheck = Date.now();

      timer();

      this.emit('check-failed', { name, error: error.message });
      
      if (check.options.critical) {
        this.status = 'unhealthy';
        logger.error(`Critical health check failed: ${name}`, error);
      } else {
        logger.warn(`Health check failed: ${name}`, error.message);
      }

      return { name, status: 'unhealthy', error: error.message };
    }
  }

  // Run all health checks
  async runAllChecks() {
    const results = {
      status: 'healthy',
      checks: {},
      timestamp: Date.now()
    };

    for (const [name, check] of this.checks) {
      const result = await this.runCheck(name);
      results.checks[name] = result;
      
      if (result.status === 'unhealthy' && check.options.critical) {
        results.status = 'unhealthy';
      }
    }

    this.status = results.status;
    this.lastCheck = results.timestamp;
    
    this.emit('health-check-complete', results);
    return results;
  }

  // Start periodic health checks
  startPeriodicChecks(interval = this.config.interval) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        logger.error('Error running periodic health checks:', error);
      }
    }, interval);

    logger.info(`Started periodic health checks every ${interval}ms`);
  }

  // Stop periodic health checks
  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped periodic health checks');
    }
  }

  // Get current health status
  getStatus() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      checks: Array.from(this.checks.entries()).map(([name, check]) => ({
        name,
        status: check.status,
        lastCheck: check.lastCheck,
        critical: check.options.critical
      }))
    };
  }

  // Check if system is healthy
  isHealthy() {
    return this.status === 'healthy';
  }

  // Clean up resources
  cleanup() {
    this.stopPeriodicChecks();
    this.removeAllListeners();
    this.checks.clear();
  }

  // Methods expected by tests
  getHealth() {
    return this.getStatus();
  }

  runHealthChecks() {
    return this.runAllChecks();
  }

  getHealthSummary() {
    const checks = Array.from(this.checks.entries());
    const healthy = checks.filter(([_, check]) => check.status === 'healthy').length;
    const unhealthy = checks.filter(([_, check]) => check.status === 'unhealthy').length;
    const total = checks.length;
    
    return {
      total,
      healthy,
      unhealthy,
      percentage: total > 0 ? (healthy / total) * 100 : 0
    };
  }

  async createHealthReport() {
    const os = require('os');
    const results = await this.runAllChecks();
    
    return {
      report: {
        title: 'BUMBA CLI Health Report',
        generated: new Date().toISOString(),
        system: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem()
        },
        health: results,
        summary: this.getHealthSummary()
      }
    };
  }

  getHealthEndpoint() {
    return async (req, res) => {
      const health = this.getStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    };
  }

  getLivenessEndpoint() {
    return (req, res) => {
      res.status(200).json({
        status: 'alive',
        timestamp: Date.now()
      });
    };
  }

  getReadinessEndpoint() {
    return async (req, res) => {
      const health = this.getStatus();
      const ready = health.status === 'healthy';
      res.status(200).json({
        ready,
        timestamp: Date.now()
      });
    };
  }

  stopHealthMonitoring() {
    this.stopPeriodicChecks();
    this.monitorInterval = null;
  }

  // Register default checks
  registerDefaultChecks() {
    // Memory check
    this.registerCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > 500) {
        throw new Error(`High memory usage: ${heapUsedMB.toFixed(2)}MB`);
      }
      
      return { heapUsedMB: heapUsedMB.toFixed(2) };
    });

    // CPU check
    this.registerCheck('cpu', async () => {
      const cpuUsage = process.cpuUsage();
      const totalCPU = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      return { cpuSeconds: totalCPU.toFixed(2) };
    });

    // Event loop check
    this.registerCheck('eventLoop', async () => {
      return new Promise((resolve) => {
        const start = Date.now();
        setImmediate(() => {
          const delay = Date.now() - start;
          if (delay > 100) {
            throw new Error(`Event loop blocked: ${delay}ms delay`);
          }
          resolve({ delay });
        });
      });
    });

    // File system check
    this.registerCheck('filesystem', async () => {
      const fs = require('fs').promises;
      const testFile = '.health-check-test';
      
      try {
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        return { writable: true };
      } catch (error) {
        throw new Error('Filesystem not writable');
      }
    });
  }
}

// Singleton instance
let instance;

function getInstance() {
  if (!instance) {
    instance = new HealthCheckSystem();
    instance.registerDefaultChecks();
  }
  return instance;
}

module.exports = {
  HealthCheck: HealthCheckSystem,  // Standard export name
  HealthCheckSystem,  // Keep original
  getInstance,
  healthCheck: getInstance()  // Singleton instance
};