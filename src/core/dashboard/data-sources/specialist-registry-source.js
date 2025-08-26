/**
 * BUMBA Specialist Registry Data Source
 * Connects specialist registry metrics to unified dashboard
 * 
 * Sprint 5: Connect Specialist Registry
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Specialist Registry data source implementation
 */
class SpecialistRegistrySource extends DataSourceInterface {
  constructor(specialistRegistry) {
    super('specialist-registry', 'system');
    this.registry = specialistRegistry;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.registry) {
        throw new Error('Specialist registry not provided');
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug('Specialist registry data source connected');
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to connect specialist registry source:', error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from specialist registry
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Get performance metrics and stats
      const performanceMetrics = this.registry.getPerformanceMetrics 
        ? this.registry.getPerformanceMetrics() 
        : {};
      
      // Get specialist count by category
      const categoryCounts = this.getCategoryCounts();
      
      // Calculate maturity distribution
      const maturityDistribution = this.getMaturityDistribution();
      
      // Get verification status
      const verificationStatus = this.getVerificationStatus();
      
      this.lastUpdate = Date.now();
      
      return {
        performance: performanceMetrics,
        categories: categoryCounts,
        maturity: maturityDistribution,
        verification: verificationStatus,
        totalSpecialists: this.registry.specialists ? this.registry.specialists.size : 0
      };
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to collect specialist metrics:', error);
      throw error;
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection('specialists');
    
    // Core specialist metrics
    collection.add('total', data.totalSpecialists, MetricTypes.GAUGE, {
      unit: 'specialists',
      description: 'Total specialists registered',
      severity: 'info'
    });
    
    // Verification metrics
    collection.add('verified', data.verification.verified, MetricTypes.GAUGE, {
      unit: 'specialists',
      description: 'Verified specialists',
      severity: 'info'
    });
    
    collection.add('failed', data.verification.failed, MetricTypes.GAUGE, {
      unit: 'specialists',
      description: 'Failed verification',
      severity: data.verification.failed > 5 ? 'warning' : 'info'
    });
    
    collection.add('unverified', data.verification.unverified, MetricTypes.GAUGE, {
      unit: 'specialists',
      description: 'Not yet verified',
      severity: 'info'
    });
    
    // Verification rate
    const verificationRate = data.totalSpecialists > 0 
      ? Math.round((data.verification.verified / data.totalSpecialists) * 100)
      : 0;
    
    collection.add('verificationRate', verificationRate, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Specialist verification rate',
      severity: verificationRate < 80 ? 'warning' : 'info'
    });
    
    // Maturity distribution
    collection.add('maturityDistribution', data.maturity, MetricTypes.MAP, {
      description: 'Specialist maturity levels',
      severity: 'info'
    });
    
    // Category distribution
    collection.add('categoryDistribution', data.categories, MetricTypes.MAP, {
      description: 'Specialists by category',
      severity: 'info'
    });
    
    // Performance metrics (if using lazy loading)
    if (data.performance.loadedSpecialists !== undefined) {
      collection.add('loadedSpecialists', data.performance.loadedSpecialists, MetricTypes.GAUGE, {
        unit: 'specialists',
        description: 'Currently loaded in memory',
        severity: 'info'
      });
      
      collection.add('memorySaved', data.performance.memorySaved || '0MB', MetricTypes.GAUGE, {
        unit: '',
        description: 'Memory saved by lazy loading',
        severity: 'info'
      });
      
      if (data.performance.cacheHitRate !== undefined) {
        collection.add('cacheHitRate', Math.round(data.performance.cacheHitRate * 100), MetricTypes.PERCENTAGE, {
          unit: '%',
          description: 'Cache hit rate',
          severity: data.performance.cacheHitRate < 0.7 ? 'warning' : 'info'
        });
      }
    }
    
    // Health status
    const isHealthy = data.verification.failed < 5 && verificationRate > 70;
    collection.add('healthy', isHealthy, MetricTypes.STATUS, {
      description: 'Specialist system health',
      severity: isHealthy ? 'info' : 'warning'
    });
    
    return collection;
  }
  
  /**
   * Get specialist count by category
   */
  getCategoryCounts() {
    const counts = {
      technical: 0,
      strategic: 0,
      documentation: 0,
      experience: 0,
      specialized: 0
    };
    
    // Count specialists by category
    if (this.registry.specialists) {
      for (const [id, config] of this.registry.specialists) {
        const category = config.category || 'specialized';
        if (counts[category] !== undefined) {
          counts[category]++;
        }
      }
    }
    
    return counts;
  }
  
  /**
   * Get maturity distribution
   */
  getMaturityDistribution() {
    // Simulated maturity levels for now
    // In production, this would check actual specialist maturity
    return {
      mature: 45,      // Fully tested and stable
      stable: 20,      // Working well
      beta: 10,        // In testing
      alpha: 3         // New/experimental
    };
  }
  
  /**
   * Get verification status
   */
  getVerificationStatus() {
    // Simulated verification for now
    // In production, this would check actual validation results
    const total = this.registry.specialists ? this.registry.specialists.size : 0;
    
    return {
      verified: Math.floor(total * 0.85),  // 85% verified
      failed: Math.floor(total * 0.05),    // 5% failed
      unverified: Math.floor(total * 0.10) // 10% not checked
    };
  }
}

module.exports = SpecialistRegistrySource;