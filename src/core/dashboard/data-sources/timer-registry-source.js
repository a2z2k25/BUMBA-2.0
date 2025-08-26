/**
 * BUMBA Timer Registry Data Source
 * Connects timer registry metrics to unified dashboard
 * 
 * Sprint 4: Connect First Data Source
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Timer Registry data source implementation
 */
class TimerRegistrySource extends DataSourceInterface {
  constructor(timerRegistry) {
    super('timer-registry', 'system');
    this.registry = timerRegistry;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.registry) {
        throw new Error('Timer registry not provided');
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug('Timer registry data source connected');
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to connect timer registry source:', error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from timer registry
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Get current stats from timer registry
      const stats = this.registry.getStats();
      const activeTimers = this.registry.getActiveTimers();
      
      // Calculate leak risk score (0-100)
      const leakRisk = this.calculateLeakRisk(stats);
      
      // Get timer distribution by component
      const distribution = this.getTimerDistribution(activeTimers);
      
      this.lastUpdate = Date.now();
      
      return {
        stats,
        leakRisk,
        distribution,
        activeTimers: activeTimers.length,
        details: activeTimers
      };
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to collect timer metrics:', error);
      throw error;
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection('timers');
    
    // Core timer metrics
    collection.add('active', data.stats.active, MetricTypes.GAUGE, {
      unit: 'timers',
      description: 'Currently active timers',
      severity: data.stats.active > 100 ? 'warning' : 'info'
    });
    
    collection.add('registered', data.stats.registered, MetricTypes.COUNTER, {
      unit: 'timers',
      description: 'Total timers registered',
      severity: 'info'
    });
    
    collection.add('cleaned', data.stats.cleaned, MetricTypes.COUNTER, {
      unit: 'timers',
      description: 'Total timers cleaned',
      severity: 'info'
    });
    
    collection.add('leakRisk', data.leakRisk, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Timer leak risk score',
      severity: data.leakRisk > 75 ? 'critical' : data.leakRisk > 50 ? 'warning' : 'info'
    });
    
    collection.add('autoCleanedDuplicates', data.stats.autoCleanedDuplicates, MetricTypes.COUNTER, {
      unit: 'timers',
      description: 'Duplicate timers auto-cleaned',
      severity: 'info'
    });
    
    // Timer efficiency metric
    const cleanupRatio = data.stats.registered > 0 
      ? Math.round((data.stats.cleaned / data.stats.registered) * 100)
      : 100;
    
    collection.add('cleanupRatio', cleanupRatio, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Timer cleanup efficiency',
      severity: cleanupRatio < 80 ? 'warning' : 'info'
    });
    
    // Distribution metrics
    collection.add('distribution', data.distribution, MetricTypes.MAP, {
      description: 'Timer distribution by component',
      severity: 'info'
    });
    
    // Health status
    const isHealthy = data.stats.active < 100 && data.leakRisk < 50;
    collection.add('healthy', isHealthy, MetricTypes.STATUS, {
      description: 'Timer system health',
      severity: isHealthy ? 'info' : 'warning'
    });
    
    return collection;
  }
  
  /**
   * Calculate timer leak risk score
   */
  calculateLeakRisk(stats) {
    // Risk factors:
    // 1. Active timers growing unchecked
    // 2. Low cleanup ratio
    // 3. High duplicate count
    
    let risk = 0;
    
    // Factor 1: Active timer count (0-40 points)
    if (stats.active > 200) risk += 40;
    else if (stats.active > 100) risk += 30;
    else if (stats.active > 50) risk += 20;
    else if (stats.active > 25) risk += 10;
    
    // Factor 2: Cleanup ratio (0-40 points)
    if (stats.registered > 0) {
      const cleanupRatio = stats.cleaned / stats.registered;
      if (cleanupRatio < 0.5) risk += 40;
      else if (cleanupRatio < 0.7) risk += 30;
      else if (cleanupRatio < 0.8) risk += 20;
      else if (cleanupRatio < 0.9) risk += 10;
    }
    
    // Factor 3: Duplicate timers (0-20 points)
    if (stats.autoCleanedDuplicates > 50) risk += 20;
    else if (stats.autoCleanedDuplicates > 25) risk += 15;
    else if (stats.autoCleanedDuplicates > 10) risk += 10;
    else if (stats.autoCleanedDuplicates > 5) risk += 5;
    
    return Math.min(100, risk);
  }
  
  /**
   * Get timer distribution by component
   */
  getTimerDistribution(activeTimers) {
    const distribution = {};
    
    activeTimers.forEach(timer => {
      const component = timer.component || 'unknown';
      distribution[component] = (distribution[component] || 0) + 1;
    });
    
    return distribution;
  }
}

module.exports = TimerRegistrySource;