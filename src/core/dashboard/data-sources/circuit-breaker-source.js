/**
 * BUMBA Circuit Breaker Data Source
 * Connects circuit breaker metrics to unified dashboard
 * 
 * Sprint 7: Connect Circuit Breakers
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Circuit Breaker data source implementation
 */
class CircuitBreakerSource extends DataSourceInterface {
  constructor(circuitBreakerRegistry) {
    super('circuit-breakers', 'resilience');
    this.registry = circuitBreakerRegistry;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.registry) {
        throw new Error('Circuit breaker registry not provided');
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug('Circuit breaker data source connected');
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to connect circuit breaker source:', error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from circuit breaker registry
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Get health summary with all circuit statuses
      const healthSummary = this.registry.getHealthSummary();
      
      // Calculate cascade risk
      const cascadeRisk = this.calculateCascadeRisk(healthSummary);
      
      // Get circuit details
      const circuitDetails = this.getCircuitDetails(healthSummary.circuits);
      
      // Calculate overall resilience score
      const resilienceScore = this.calculateResilienceScore(healthSummary);
      
      this.lastUpdate = Date.now();
      
      return {
        summary: healthSummary,
        cascadeRisk,
        circuitDetails,
        resilienceScore
      };
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to collect circuit breaker metrics:', error);
      throw error;
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection('circuitBreakers');
    
    // Core circuit metrics
    collection.add('total', data.summary.total, MetricTypes.GAUGE, {
      unit: 'circuits',
      description: 'Total circuit breakers',
      severity: 'info'
    });
    
    collection.add('healthy', data.summary.healthy, MetricTypes.GAUGE, {
      unit: 'circuits',
      description: 'Healthy circuits (closed)',
      severity: 'info'
    });
    
    collection.add('open', data.summary.open, MetricTypes.GAUGE, {
      unit: 'circuits',
      description: 'Open circuits (failing)',
      severity: data.summary.open > 2 ? 'critical' : data.summary.open > 0 ? 'warning' : 'info'
    });
    
    collection.add('halfOpen', data.summary.halfOpen, MetricTypes.GAUGE, {
      unit: 'circuits',
      description: 'Half-open circuits (testing)',
      severity: 'info'
    });
    
    // Health percentage
    const healthPercentage = data.summary.total > 0 
      ? Math.round((data.summary.healthy / data.summary.total) * 100)
      : 100;
    
    collection.add('healthPercentage', healthPercentage, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Circuit health percentage',
      severity: healthPercentage < 70 ? 'critical' : healthPercentage < 85 ? 'warning' : 'info'
    });
    
    // Cascade risk
    collection.add('cascadeRisk', data.cascadeRisk, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Risk of cascading failure',
      severity: data.cascadeRisk > 50 ? 'critical' : data.cascadeRisk > 25 ? 'warning' : 'info'
    });
    
    // Resilience score
    collection.add('resilienceScore', data.resilienceScore, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Overall system resilience',
      severity: data.resilienceScore < 60 ? 'critical' : data.resilienceScore < 80 ? 'warning' : 'info'
    });
    
    // Circuit details
    const criticalCircuits = data.circuitDetails.filter(c => c.state === 'OPEN');
    collection.add('criticalCircuits', criticalCircuits, MetricTypes.LIST, {
      description: 'Circuits currently open',
      severity: criticalCircuits.length > 0 ? 'warning' : 'info'
    });
    
    // Total rejected requests across all circuits
    const totalRejected = data.circuitDetails.reduce((sum, c) => sum + c.rejectedRequests, 0);
    collection.add('rejectedRequests', totalRejected, MetricTypes.COUNTER, {
      unit: 'requests',
      description: 'Total rejected requests',
      severity: totalRejected > 100 ? 'warning' : 'info'
    });
    
    // Average error rate
    const avgErrorRate = this.calculateAverageErrorRate(data.circuitDetails);
    collection.add('avgErrorRate', avgErrorRate, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Average error rate across circuits',
      severity: avgErrorRate > 30 ? 'warning' : 'info'
    });
    
    // Circuit states distribution
    const stateDistribution = {
      CLOSED: data.summary.healthy,
      OPEN: data.summary.open,
      HALF_OPEN: data.summary.halfOpen
    };
    collection.add('stateDistribution', stateDistribution, MetricTypes.MAP, {
      description: 'Circuit states distribution',
      severity: 'info'
    });
    
    // Health status
    const isHealthy = data.summary.open === 0 && data.cascadeRisk < 25 && data.resilienceScore > 70;
    collection.add('systemHealthy', isHealthy, MetricTypes.STATUS, {
      description: 'Circuit breaker system health',
      severity: isHealthy ? 'info' : 'warning'
    });
    
    return collection;
  }
  
  /**
   * Calculate cascade risk based on open circuits
   */
  calculateCascadeRisk(summary) {
    if (summary.total === 0) return 0;
    
    const openRatio = summary.open / summary.total;
    let risk = 0;
    
    // Base risk from open circuits
    risk += openRatio * 40;
    
    // Additional risk if multiple circuits are open
    if (summary.open > 1) risk += 20;
    if (summary.open > 3) risk += 30;
    if (summary.open > 5) risk += 10;
    
    return Math.min(100, Math.round(risk));
  }
  
  /**
   * Get detailed circuit information
   */
  getCircuitDetails(circuits) {
    return Object.entries(circuits).map(([name, status]) => ({
      name,
      state: status.state,
      errorRate: parseFloat(status.stats.errorRate) || 0,
      totalRequests: status.stats.totalRequests,
      rejectedRequests: status.stats.rejectedRequests,
      failures: status.stats.failures,
      uptime: status.stats.uptime
    }));
  }
  
  /**
   * Calculate overall resilience score
   */
  calculateResilienceScore(summary) {
    let score = 100;
    
    // Deduct for open circuits
    score -= summary.open * 15;
    
    // Deduct for half-open circuits (less severe)
    score -= summary.halfOpen * 5;
    
    // Bonus for high healthy ratio
    if (summary.total > 0) {
      const healthyRatio = summary.healthy / summary.total;
      if (healthyRatio > 0.9) score += 10;
      else if (healthyRatio < 0.7) score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate average error rate across all circuits
   */
  calculateAverageErrorRate(circuitDetails) {
    if (circuitDetails.length === 0) return 0;
    
    const totalErrorRate = circuitDetails.reduce((sum, c) => sum + c.errorRate, 0);
    return Math.round(totalErrorRate / circuitDetails.length);
  }
}

module.exports = CircuitBreakerSource;