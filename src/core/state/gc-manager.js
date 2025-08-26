/**
 * Garbage Collection Manager
 * Safe wrapper for GC operations replacing direct global.gc calls
 * Sprint 7 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');
const { stateManager } = require('./global-state-manager');

class GCManager {
  constructor() {
    this.gcAvailable = typeof global.gc === 'function';
    this.gcRequests = 0;
    this.lastGC = 0;
    this.minInterval = 30000; // Minimum 30 seconds between GC
    this.gcThreshold = 100 * 1024 * 1024; // 100MB threshold
    
    // Register state namespace
    stateManager.register('gc', {
      enabled: this.gcAvailable,
      requests: 0,
      executions: 0,
      lastExecution: 0,
      memoryBeforeGC: 0,
      memoryAfterGC: 0
    });
    
    if (!this.gcAvailable) {
      logger.warn('GC not available. Run node with --expose-gc flag to enable');
    }
  }

  /**
   * Request garbage collection
   * Throttled and safe wrapper around global.gc
   */
  requestGC(options = {}) {
    const {
      force = false,
      reason = 'manual',
      full = true
    } = options;

    this.gcRequests++;
    stateManager.set('gc', 'requests', this.gcRequests);

    // Check if GC is available
    if (!this.gcAvailable) {
      logger.debug('GC requested but not available');
      return false;
    }

    // Check throttling
    const now = Date.now();
    const timeSinceLastGC = now - this.lastGC;
    
    if (!force && timeSinceLastGC < this.minInterval) {
      logger.debug(`GC throttled. Last GC was ${timeSinceLastGC}ms ago`);
      return false;
    }

    // Check memory threshold
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;
    
    if (!force && heapUsed < this.gcThreshold) {
      logger.debug(`GC skipped. Memory below threshold: ${(heapUsed / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }

    // Perform GC
    try {
      stateManager.set('gc', 'memoryBeforeGC', heapUsed);
      
      if (full) {
        global.gc(true); // Full GC
      } else {
        global.gc(); // Incremental GC
      }
      
      this.lastGC = now;
      
      // Measure impact
      const newMemUsage = process.memoryUsage();
      const freed = heapUsed - newMemUsage.heapUsed;
      
      stateManager.set('gc', 'memoryAfterGC', newMemUsage.heapUsed);
      stateManager.set('gc', 'lastExecution', now);
      
      const executions = stateManager.get('gc', 'executions') + 1;
      stateManager.set('gc', 'executions', executions);

      logger.debug(`GC executed (${reason}). Freed: ${(freed / 1024 / 1024).toFixed(2)}MB`);
      
      return true;
    } catch (error) {
      logger.error('GC execution failed:', error);
      return false;
    }
  }

  /**
   * Schedule periodic GC
   */
  schedulePeriodic(intervalMs = 300000) { // Default 5 minutes
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
    }

    this.periodicTimer = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (heapPercent > 80) {
        this.requestGC({
          reason: 'periodic-high-memory',
          force: false
        });
      }
    }, intervalMs);

    logger.info(`Periodic GC scheduled every ${intervalMs / 1000} seconds`);
  }

  /**
   * Stop periodic GC
   */
  stopPeriodic() {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
      logger.info('Periodic GC stopped');
    }
  }

  /**
   * Get GC statistics
   */
  getStats() {
    return {
      available: this.gcAvailable,
      ...stateManager.get('gc')
    };
  }

  /**
   * Emergency GC for critical situations
   */
  emergencyGC() {
    logger.warn('Emergency GC requested');
    
    // Force immediate full GC
    return this.requestGC({
      force: true,
      reason: 'emergency',
      full: true
    });
  }

  /**
   * Configure GC settings
   */
  configure(options = {}) {
    if (options.minInterval !== undefined) {
      this.minInterval = Math.max(1000, options.minInterval);
    }
    
    if (options.gcThreshold !== undefined) {
      this.gcThreshold = Math.max(10 * 1024 * 1024, options.gcThreshold);
    }

    logger.info('GC Manager configured', {
      minInterval: this.minInterval,
      gcThreshold: `${(this.gcThreshold / 1024 / 1024).toFixed(2)}MB`
    });
  }

  /**
   * Check if GC should run
   */
  shouldRunGC() {
    if (!this.gcAvailable) return false;
    
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;
    const heapPercent = (heapUsed / memUsage.heapTotal) * 100;
    
    // Run if over 80% heap or over threshold
    return heapPercent > 80 || heapUsed > this.gcThreshold;
  }

  /**
   * Clean up
   */
  cleanup() {
    this.stopPeriodic();
  }
}

// Singleton instance
let instance = null;

function getGCManager() {
  if (!instance) {
    instance = new GCManager();
    
    // Register cleanup
    process.on('exit', () => instance.cleanup());
  }
  
  return instance;
}

// Export convenience wrapper
const gcManager = getGCManager();

module.exports = {
  GCManager,
  getGCManager,
  gcManager,
  
  // Convenience methods
  requestGC: (options) => gcManager.requestGC(options),
  emergencyGC: () => gcManager.emergencyGC(),
  getGCStats: () => gcManager.getStats()
};