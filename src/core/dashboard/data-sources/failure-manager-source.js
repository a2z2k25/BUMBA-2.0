/**
 * BUMBA Failure Manager Data Source
 * Connects failure tracking metrics to unified dashboard
 * 
 * Sprint 6: Connect Failure Manager
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Failure Manager data source implementation
 */
class FailureManagerSource extends DataSourceInterface {
  constructor(failureManager) {
    super('failure-manager', 'system');
    this.manager = failureManager;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.manager) {
        throw new Error('Failure manager not provided');
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug('Failure manager data source connected');
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to connect failure manager source:', error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from failure manager
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Get failure statistics
      const stats = this.manager.getStatistics();
      
      // Get recent failures (last 10)
      const recentFailures = this.manager.failures.slice(-10).map(f => ({
        component: f.component,
        category: f.category,
        severity: f.severity.name,
        message: f.message,
        timestamp: f.timestamp
      }));
      
      // Calculate failure rate (failures per minute)
      const failureRate = this.calculateFailureRate();
      
      // Get pattern detection status
      const patterns = Array.from(this.manager.failurePatterns.entries())
        .map(([key, value]) => ({
          pattern: key,
          count: value.length,
          components: [...new Set(value.map(f => f.component))]
        }));
      
      this.lastUpdate = Date.now();
      
      return {
        stats,
        recentFailures,
        failureRate,
        patterns,
        componentHealthScore: this.calculateHealthScore(stats)
      };
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to collect failure metrics:', error);
      throw error;
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection('failures');
    
    // Core failure metrics
    collection.add('total', data.stats.total, MetricTypes.COUNTER, {
      unit: 'failures',
      description: 'Total failures recorded',
      severity: data.stats.total > 100 ? 'warning' : 'info'
    });
    
    collection.add('active', data.stats.active, MetricTypes.GAUGE, {
      unit: 'failures',
      description: 'Currently active failures',
      severity: data.stats.active > 10 ? 'critical' : data.stats.active > 5 ? 'warning' : 'info'
    });
    
    collection.add('patterns', data.stats.patterns, MetricTypes.GAUGE, {
      unit: 'patterns',
      description: 'Detected failure patterns',
      severity: data.stats.patterns > 5 ? 'warning' : 'info'
    });
    
    // Failure rate
    collection.add('failureRate', data.failureRate, MetricTypes.RATE, {
      unit: 'min',
      description: 'Failures per minute',
      severity: data.failureRate > 5 ? 'critical' : data.failureRate > 2 ? 'warning' : 'info'
    });
    
    // Component health score
    collection.add('healthScore', data.componentHealthScore, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Overall component health',
      severity: data.componentHealthScore < 70 ? 'critical' : data.componentHealthScore < 85 ? 'warning' : 'info'
    });
    
    // Degraded components
    collection.add('degradedComponents', data.stats.degradedComponents.length, MetricTypes.GAUGE, {
      unit: 'components',
      description: 'Components in degraded state',
      severity: data.stats.degradedComponents.length > 3 ? 'warning' : 'info'
    });
    
    collection.add('stoppedComponents', data.stats.stoppedComponents.length, MetricTypes.GAUGE, {
      unit: 'components',
      description: 'Components stopped due to failures',
      severity: data.stats.stoppedComponents.length > 0 ? 'critical' : 'info'
    });
    
    // Severity distribution
    collection.add('severityDistribution', data.stats.bySeverity, MetricTypes.MAP, {
      description: 'Failures by severity',
      severity: 'info'
    });
    
    // Category distribution  
    collection.add('categoryDistribution', data.stats.byCategory, MetricTypes.MAP, {
      description: 'Failures by category',
      severity: 'info'
    });
    
    // Recent failures list
    collection.add('recentFailures', data.recentFailures, MetricTypes.LIST, {
      description: 'Recent failure events',
      severity: 'info'
    });
    
    // Health status
    const isHealthy = data.stats.active < 5 && 
                     data.stats.stoppedComponents.length === 0 && 
                     data.componentHealthScore > 80;
    
    collection.add('healthy', isHealthy, MetricTypes.STATUS, {
      description: 'Failure system health',
      severity: isHealthy ? 'info' : 'warning'
    });
    
    return collection;
  }
  
  /**
   * Calculate failure rate per minute
   */
  calculateFailureRate() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentFailures = this.manager.failures.filter(
      f => f.timestamp > oneMinuteAgo
    );
    
    return recentFailures.length;
  }
  
  /**
   * Calculate overall health score
   */
  calculateHealthScore(stats) {
    let score = 100;
    
    // Deduct for active failures
    score -= Math.min(30, stats.active * 3);
    
    // Deduct for degraded components
    score -= Math.min(20, stats.degradedComponents.length * 5);
    
    // Deduct for stopped components
    score -= Math.min(40, stats.stoppedComponents.length * 20);
    
    // Deduct for patterns (recurring issues)
    score -= Math.min(10, stats.patterns * 2);
    
    return Math.max(0, score);
  }
}

module.exports = FailureManagerSource;