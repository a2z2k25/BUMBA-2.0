/**
 * BUMBA Validation Metrics Data Source
 * Connects validation system metrics to unified dashboard
 * 
 * Sprint 9: Connect Validation Manager
 */

const { DataSourceInterface, MetricCollection, MetricTypes } = require('../dashboard-interfaces');
const { logger } = require('../../logging/bumba-logger');

/**
 * Validation Metrics data source implementation
 */
class ValidationMetricsSource extends DataSourceInterface {
  constructor(validationMetrics) {
    super('validation-metrics', 'quality');
    this.metrics = validationMetrics;
  }
  
  /**
   * Connect to the data source
   */
  async connect() {
    try {
      if (!this.metrics) {
        throw new Error('Validation metrics not provided');
      }
      
      this.connected = true;
      this.lastUpdate = Date.now();
      
      logger.debug('Validation metrics data source connected');
      return true;
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to connect validation metrics source:', error);
      throw error;
    }
  }
  
  /**
   * Collect current metrics from validation system
   */
  async collect() {
    try {
      if (!this.connected) {
        await this.connect();
      }
      
      // Get comprehensive metrics snapshot
      const snapshot = this.metrics.getSnapshot();
      
      // Calculate approval rate
      const approvalRate = snapshot.global.totalValidations > 0
        ? (snapshot.global.totalApproved / snapshot.global.totalValidations) * 100
        : 100;
      
      // Calculate average validation time
      const avgValidationTime = snapshot.global.totalValidations > 0
        ? snapshot.global.totalTimeMs / snapshot.global.totalValidations
        : 0;
      
      // Get top issues
      const topIssues = this.getTopIssues(snapshot);
      
      // Calculate health score
      const healthScore = this.calculateHealthScore(snapshot, approvalRate);
      
      // Get manager performance
      const managerPerformance = this.getManagerPerformance(snapshot);
      
      this.lastUpdate = Date.now();
      
      return {
        global: snapshot.global,
        approvalRate,
        avgValidationTime,
        topIssues,
        healthScore,
        managerPerformance,
        revisionSuccess: snapshot.revisionSuccess,
        alerts: snapshot.alerts || []
      };
    } catch (error) {
      this.errorCount++;
      logger.error('Failed to collect validation metrics:', error);
      throw error;
    }
  }
  
  /**
   * Transform data to standard metric format
   */
  transform(data) {
    const collection = new MetricCollection('validation');
    
    // Core validation metrics
    collection.add('totalValidations', data.global.totalValidations, MetricTypes.COUNTER, {
      unit: 'validations',
      description: 'Total validations performed',
      severity: 'info'
    });
    
    collection.add('approved', data.global.totalApproved, MetricTypes.COUNTER, {
      unit: 'validations',
      description: 'Approved validations',
      severity: 'info'
    });
    
    collection.add('rejected', data.global.totalRejected, MetricTypes.COUNTER, {
      unit: 'validations',
      description: 'Rejected validations',
      severity: data.global.totalRejected > data.global.totalApproved ? 'warning' : 'info'
    });
    
    collection.add('revisions', data.global.totalRevisions, MetricTypes.COUNTER, {
      unit: 'revisions',
      description: 'Total revision requests',
      severity: 'info'
    });
    
    // Performance metrics
    collection.add('approvalRate', Math.round(data.approvalRate), MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Validation approval rate',
      severity: data.approvalRate < 70 ? 'warning' : 'info'
    });
    
    collection.add('avgValidationTime', Math.round(data.avgValidationTime), MetricTypes.GAUGE, {
      unit: 'ms',
      description: 'Average validation time',
      severity: data.avgValidationTime > 500 ? 'warning' : 'info'
    });
    
    // Health score
    collection.add('healthScore', data.healthScore, MetricTypes.PERCENTAGE, {
      unit: '%',
      description: 'Validation system health',
      severity: data.healthScore < 70 ? 'critical' : data.healthScore < 85 ? 'warning' : 'info'
    });
    
    // Revision success metrics
    collection.add('firstAttemptSuccess', data.revisionSuccess.firstAttempt, MetricTypes.COUNTER, {
      unit: 'revisions',
      description: 'First attempt successes',
      severity: 'info'
    });
    
    collection.add('failedRevisions', data.revisionSuccess.failed, MetricTypes.COUNTER, {
      unit: 'revisions',
      description: 'Failed after 3 attempts',
      severity: data.revisionSuccess.failed > 5 ? 'warning' : 'info'
    });
    
    // Top issues
    collection.add('topIssues', data.topIssues, MetricTypes.LIST, {
      description: 'Most common validation issues',
      severity: 'info'
    });
    
    // Manager performance
    collection.add('managerPerformance', data.managerPerformance, MetricTypes.MAP, {
      description: 'Performance by manager',
      severity: 'info'
    });
    
    // Alert count
    const alertCount = data.alerts.length;
    collection.add('alertCount', alertCount, MetricTypes.GAUGE, {
      unit: 'alerts',
      description: 'Active validation alerts',
      severity: alertCount > 3 ? 'warning' : 'info'
    });
    
    // System health status
    const isHealthy = data.approvalRate > 70 && 
                     data.avgValidationTime < 1000 && 
                     data.healthScore > 70;
    
    collection.add('systemHealthy', isHealthy, MetricTypes.STATUS, {
      description: 'Validation system health',
      severity: isHealthy ? 'info' : 'warning'
    });
    
    return collection;
  }
  
  /**
   * Get top validation issues
   */
  getTopIssues(snapshot) {
    const issues = [];
    
    if (snapshot.issuePatterns) {
      const sortedIssues = Array.from(snapshot.issuePatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      sortedIssues.forEach(([issue, count]) => {
        issues.push({
          issue,
          count,
          percentage: Math.round((count / snapshot.global.totalValidations) * 100)
        });
      });
    }
    
    return issues;
  }
  
  /**
   * Calculate health score for validation system
   */
  calculateHealthScore(snapshot, approvalRate) {
    let score = 100;
    
    // Deduct for low approval rate
    if (approvalRate < 80) score -= 20;
    else if (approvalRate < 90) score -= 10;
    
    // Deduct for high rejection rate
    const rejectionRate = 100 - approvalRate;
    if (rejectionRate > 30) score -= 20;
    else if (rejectionRate > 20) score -= 10;
    
    // Deduct for too many revisions
    const avgRevisions = snapshot.global.totalValidations > 0
      ? snapshot.global.totalRevisions / snapshot.global.totalValidations
      : 0;
    if (avgRevisions > 2) score -= 15;
    else if (avgRevisions > 1.5) score -= 10;
    
    // Deduct for failed revisions
    if (snapshot.revisionSuccess.failed > 10) score -= 15;
    else if (snapshot.revisionSuccess.failed > 5) score -= 10;
    
    // Deduct for slow validation
    const avgTime = snapshot.global.totalValidations > 0
      ? snapshot.global.totalTimeMs / snapshot.global.totalValidations
      : 0;
    if (avgTime > 1000) score -= 10;
    else if (avgTime > 500) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Get manager performance summary
   */
  getManagerPerformance(snapshot) {
    const performance = {};
    
    if (snapshot.managers) {
      snapshot.managers.forEach((metrics, managerId) => {
        performance[managerId] = {
          validations: metrics.validations,
          approvalRate: Math.round(metrics.approvalRate * 100),
          avgTime: Math.round(metrics.averageTime)
        };
      });
    }
    
    return performance;
  }
}

module.exports = ValidationMetricsSource;