#!/usr/bin/env node

/**
 * BUMBA Health Monitoring System
 * Real-time health checks and monitoring
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.history = [];
    this.status = 'initializing';
    this.startTime = Date.now();
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    console.log('\n🏥 BUMBA Health Monitor');
    console.log('=' * 60 + '\n');
    
    const results = {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      checks: {}
    };
    
    // Memory check
    results.checks.memory = await this.checkMemory();
    
    // File system check
    results.checks.filesystem = await this.checkFileSystem();
    
    // Department managers check
    results.checks.departments = await this.checkDepartments();
    
    // Failure manager check
    results.checks.failures = await this.checkFailureManager();
    
    // Performance check
    results.checks.performance = await this.checkPerformance();
    
    // Determine overall status
    results.status = this.determineOverallStatus(results.checks);
    
    // Save results
    this.history.push(results);
    this.saveResults(results);
    
    // Display results
    this.displayResults(results);
    
    return results;
  }

  /**
   * Check memory usage
   */
  async checkMemory() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);
    
    const percentage = Math.round((heapUsedMB / heapTotalMB) * 100);
    
    let status = 'healthy';
    if (percentage > 80) status = 'critical';
    else if (percentage > 60) status = 'warning';
    
    return {
      status,
      metrics: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        external: `${externalMB}MB`,
        percentage: `${percentage}%`
      },
      message: `Memory usage at ${percentage}%`
    };
  }

  /**
   * Check file system
   */
  async checkFileSystem() {
    const requiredDirs = ['logs', 'data', 'status'];
    const missing = [];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        missing.push(dir);
      }
    }
    
    if (missing.length === 0) {
      return {
        status: 'healthy',
        message: 'All required directories present'
      };
    } else {
      return {
        status: 'warning',
        message: `Missing directories: ${missing.join(', ')}`,
        missing
      };
    }
  }

  /**
   * Check department managers
   */
  async checkDepartments() {
    try {
      const BackendManager = require('../src/core/departments/backend-engineer-manager-lazy');
      const DesignManager = require('../src/core/departments/design-engineer-manager-lazy');
      const ProductManager = require('../src/core/departments/product-strategist-manager-lazy');
      
      const managers = [
        new BackendManager(),
        new DesignManager(),
        new ProductManager()
      ];
      
      const stats = managers.map(m => m.getMemoryStats());
      
      // Cleanup
      for (const manager of managers) {
        await manager.destroy();
      }
      
      const totalSpecialists = stats.reduce((sum, s) => sum + s.specialists.registered, 0);
      const loadedSpecialists = stats.reduce((sum, s) => sum + s.specialists.loaded, 0);
      
      return {
        status: 'healthy',
        metrics: {
          departments: 3,
          totalSpecialists,
          loadedSpecialists,
          efficiency: `${Math.round((1 - loadedSpecialists/totalSpecialists) * 100)}%`
        },
        message: `${loadedSpecialists}/${totalSpecialists} specialists loaded`
      };
      
    } catch (error) {
      return {
        status: 'critical',
        message: `Department managers unavailable: ${error.message}`
      };
    }
  }

  /**
   * Check failure manager
   */
  async checkFailureManager() {
    try {
      const { getInstance } = require('../src/core/resilience/unified-failure-manager');
      const failureManager = getInstance();
      
      const stats = failureManager.getStatistics();
      
      let status = 'healthy';
      if (stats.criticalFailures > 0) status = 'critical';
      else if (stats.totalFailures > 10) status = 'warning';
      
      return {
        status,
        metrics: {
          totalFailures: stats.totalFailures,
          recovered: stats.recoveredFailures,
          critical: stats.criticalFailures,
          recoveryRate: stats.recoveryRate
        },
        message: `${stats.totalFailures} failures, ${stats.recoveryRate} recovery rate`
      };
      
    } catch (error) {
      return {
        status: 'warning',
        message: 'Failure manager not initialized'
      };
    }
  }

  /**
   * Check performance
   */
  async checkPerformance() {
    const start = performance.now();
    
    // Simulate some operations
    const operations = [];
    for (let i = 0; i < 100; i++) {
      operations.push(Math.sqrt(i));
    }
    
    const duration = performance.now() - start;
    
    let status = 'healthy';
    if (duration > 10) status = 'warning';
    if (duration > 50) status = 'critical';
    
    return {
      status,
      metrics: {
        responseTime: `${duration.toFixed(2)}ms`,
        operations: operations.length
      },
      message: `Performance check completed in ${duration.toFixed(2)}ms`
    };
  }

  /**
   * Determine overall status
   */
  determineOverallStatus(checks) {
    const statuses = Object.values(checks).map(c => c.status);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'degraded';
    return 'healthy';
  }

  /**
   * Get system uptime
   */
  getUptime() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Save results to file
   */
  saveResults(results) {
    const statusDir = 'status';
    if (!fs.existsSync(statusDir)) {
      fs.mkdirSync(statusDir, { recursive: true });
    }
    
    // Save current status
    fs.writeFileSync(
      path.join(statusDir, 'health.json'),
      JSON.stringify(results, null, 2)
    );
    
    // Save history (keep last 100 checks)
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    
    fs.writeFileSync(
      path.join(statusDir, 'health-history.json'),
      JSON.stringify(this.history, null, 2)
    );
  }

  /**
   * Display results
   */
  displayResults(results) {
    const statusSymbols = {
      healthy: '✅',
      degraded: '⚠️',
      warning: '⚠️',
      critical: '🔴'
    };
    
    console.log(`Overall Status: ${statusSymbols[results.status]} ${results.status.toUpperCase()}`);
    console.log(`Uptime: ${results.uptime}`);
    console.log('\nHealth Checks:');
    console.log('-'.repeat(60));
    
    for (const [name, check] of Object.entries(results.checks)) {
      const symbol = statusSymbols[check.status] || '❓';
      console.log(`${symbol} ${name.padEnd(15)} : ${check.message}`);
      
      if (check.metrics) {
        for (const [key, value] of Object.entries(check.metrics)) {
          console.log(`    ${key}: ${value}`);
        }
      }
    }
    
    console.log('-'.repeat(60));
    console.log(`\nHealth report saved to: status/health.json`);
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(interval = 30000) {
    console.log(`🔄 Starting continuous monitoring (every ${interval/1000}s)...`);
    
    // Run initial check
    await this.runChecks();
    
    // Schedule regular checks
    setInterval(async () => {
      console.log('\n' + '='.repeat(60));
      await this.runChecks();
    }, interval);
    
    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\n\n📊 Final Statistics:');
      console.log(`Total checks: ${this.history.length}`);
      console.log(`Monitoring duration: ${this.getUptime()}`);
      
      const healthyCount = this.history.filter(h => h.status === 'healthy').length;
      const healthPercentage = Math.round((healthyCount / this.history.length) * 100);
      console.log(`Health percentage: ${healthPercentage}%`);
      
      console.log('\n👋 Health monitor shutting down...');
      process.exit(0);
    });
  }
}

// Run monitor
if (require.main === module) {
  const monitor = new HealthMonitor();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous') || args.includes('-c')) {
    // Continuous monitoring
    const interval = args.includes('--interval') 
      ? parseInt(args[args.indexOf('--interval') + 1]) * 1000
      : 30000;
    
    monitor.startMonitoring(interval);
  } else {
    // Single check
    monitor.runChecks().then(() => {
      process.exit(0);
    }).catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
  }
}

module.exports = HealthMonitor;