/**
 * Validation Metrics System
 * Tracks and analyzes validation performance across all managers
 * Provides insights for improving specialist quality
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ValidationMetrics extends EventEmitter {
  constructor() {
    super();
    
    // Overall metrics
    this.global = {
      totalValidations: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalRevisions: 0,
      totalTimeMs: 0,
      startTime: Date.now()
    };
    
    // Per-manager metrics
    this.managers = new Map();
    
    // Per-specialist metrics
    this.specialists = new Map();
    
    // Per-check-type metrics
    this.checkTypes = new Map();
    
    // Issue patterns
    this.issuePatterns = new Map();
    
    // Revision success tracking
    this.revisionSuccess = {
      firstAttempt: 0,
      secondAttempt: 0,
      thirdAttempt: 0,
      failed: 0
    };
    
    // Time-based metrics
    this.hourlyMetrics = new Array(24).fill(null).map(() => ({
      validations: 0,
      approved: 0,
      rejected: 0
    }));
    
    // Performance thresholds
    this.thresholds = {
      acceptableApprovalRate: 0.8,      // 80% approval rate
      acceptableRevisionCycles: 1.5,    // Average 1.5 revisions
      acceptableValidationTime: 500,    // 500ms validation time
      criticalRejectionRate: 0.5        // 50% rejection is critical
    };
  }

  /**
   * Record a validation event
   */
  recordValidation(result, managerId, specialistId) {
    const hour = new Date().getHours();
    
    // Update global metrics
    this.global.totalValidations++;
    this.global.totalTimeMs += result.validationTime || 0;
    
    if (result.approved) {
      this.global.totalApproved++;
      this.hourlyMetrics[hour].approved++;
    } else {
      this.global.totalRejected++;
      this.hourlyMetrics[hour].rejected++;
    }
    
    this.hourlyMetrics[hour].validations++;
    
    // Update manager metrics
    this.updateManagerMetrics(managerId, result);
    
    // Update specialist metrics
    this.updateSpecialistMetrics(specialistId, result);
    
    // Update check type metrics
    this.updateCheckTypeMetrics(result.checks);
    
    // Track issue patterns
    this.trackIssuePatterns(result.issues);
    
    // Check for alerts
    this.checkAlertConditions(managerId, specialistId);
    
    // Emit event
    this.emit('validation-recorded', {
      result,
      managerId,
      specialistId,
      metrics: this.getSnapshot()
    });
  }

  /**
   * Record a revision event
   */
  recordRevision(revisionRequest, success, attemptNumber) {
    this.global.totalRevisions++;
    
    if (success) {
      switch(attemptNumber) {
        case 1:
          this.revisionSuccess.firstAttempt++;
          break;
        case 2:
          this.revisionSuccess.secondAttempt++;
          break;
        case 3:
          this.revisionSuccess.thirdAttempt++;
          break;
      }
    } else if (attemptNumber >= 3) {
      this.revisionSuccess.failed++;
    }
    
    this.emit('revision-recorded', {
      request: revisionRequest,
      success,
      attemptNumber
    });
  }

  /**
   * Update manager-specific metrics
   */
  updateManagerMetrics(managerId, result) {
    if (!this.managers.has(managerId)) {
      this.managers.set(managerId, {
        validations: 0,
        approved: 0,
        rejected: 0,
        totalTime: 0,
        averageTime: 0,
        approvalRate: 0,
        commonIssues: new Map()
      });
    }
    
    const metrics = this.managers.get(managerId);
    metrics.validations++;
    metrics.totalTime += result.validationTime || 0;
    
    if (result.approved) {
      metrics.approved++;
    } else {
      metrics.rejected++;
      
      // Track common issues for this manager
      result.issues.forEach(issue => {
        const count = metrics.commonIssues.get(issue.type) || 0;
        metrics.commonIssues.set(issue.type, count + 1);
      });
    }
    
    // Calculate rates
    metrics.approvalRate = metrics.approved / metrics.validations;
    metrics.averageTime = metrics.totalTime / metrics.validations;
  }

  /**
   * Update specialist-specific metrics
   */
  updateSpecialistMetrics(specialistId, result) {
    if (!specialistId) return;
    
    if (!this.specialists.has(specialistId)) {
      this.specialists.set(specialistId, {
        submissions: 0,
        approved: 0,
        rejected: 0,
        revisions: 0,
        approvalRate: 0,
        trustScore: 1.0, // Start with neutral trust
        recentHistory: [] // Last 10 results
      });
    }
    
    const metrics = this.specialists.get(specialistId);
    metrics.submissions++;
    
    if (result.approved) {
      metrics.approved++;
      metrics.trustScore = Math.min(1.5, metrics.trustScore + 0.05); // Increase trust
    } else {
      metrics.rejected++;
      metrics.trustScore = Math.max(0.5, metrics.trustScore - 0.1); // Decrease trust
    }
    
    // Update recent history
    metrics.recentHistory.push(result.approved);
    if (metrics.recentHistory.length > 10) {
      metrics.recentHistory.shift();
    }
    
    // Calculate approval rate
    metrics.approvalRate = metrics.approved / metrics.submissions;
    
    // Check if specialist needs training
    if (metrics.approvalRate < 0.6 && metrics.submissions > 5) {
      this.emit('specialist-needs-training', {
        specialistId,
        approvalRate: metrics.approvalRate,
        commonIssues: this.getSpecialistCommonIssues(specialistId)
      });
    }
  }

  /**
   * Update check type metrics
   */
  updateCheckTypeMetrics(checks) {
    Object.entries(checks).forEach(([type, result]) => {
      if (!this.checkTypes.has(type)) {
        this.checkTypes.set(type, {
          total: 0,
          passed: 0,
          failed: 0,
          failureRate: 0
        });
      }
      
      const metrics = this.checkTypes.get(type);
      metrics.total++;
      
      if (result.passed) {
        metrics.passed++;
      } else {
        metrics.failed++;
      }
      
      metrics.failureRate = metrics.failed / metrics.total;
    });
  }

  /**
   * Track issue patterns
   */
  trackIssuePatterns(issues) {
    issues.forEach(issue => {
      const key = `${issue.type}:${issue.severity}`;
      const count = this.issuePatterns.get(key) || 0;
      this.issuePatterns.set(key, count + 1);
    });
  }

  /**
   * Check for alert conditions
   */
  checkAlertConditions(managerId, specialistId) {
    // Check global approval rate
    const globalApprovalRate = this.global.totalApproved / this.global.totalValidations;
    if (globalApprovalRate < this.thresholds.criticalRejectionRate) {
      this.emit('alert', {
        type: 'critical',
        message: `Global approval rate critically low: ${(globalApprovalRate * 100).toFixed(1)}%`
      });
    }
    
    // Check manager performance
    if (managerId && this.managers.has(managerId)) {
      const managerMetrics = this.managers.get(managerId);
      if (managerMetrics.approvalRate < this.thresholds.acceptableApprovalRate &&
          managerMetrics.validations > 10) {
        this.emit('alert', {
          type: 'warning',
          message: `Manager ${managerId} has low approval rate: ${(managerMetrics.approvalRate * 100).toFixed(1)}%`
        });
      }
    }
    
    // Check specialist performance
    if (specialistId && this.specialists.has(specialistId)) {
      const specialistMetrics = this.specialists.get(specialistId);
      if (specialistMetrics.trustScore < 0.7 && specialistMetrics.submissions > 5) {
        this.emit('alert', {
          type: 'warning',
          message: `Specialist ${specialistId} has low trust score: ${specialistMetrics.trustScore.toFixed(2)}`
        });
      }
    }
  }

  /**
   * Get specialist's common issues
   */
  getSpecialistCommonIssues(specialistId) {
    const issues = new Map();
    
    // Aggregate issues from all managers for this specialist
    this.managers.forEach(managerMetrics => {
      managerMetrics.commonIssues.forEach((count, type) => {
        const current = issues.get(type) || 0;
        issues.set(type, current + count);
      });
    });
    
    // Sort by frequency
    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Get metrics snapshot
   */
  getSnapshot() {
    const avgValidationTime = this.global.totalTimeMs / this.global.totalValidations || 0;
    const approvalRate = this.global.totalApproved / this.global.totalValidations || 0;
    const avgRevisionCycles = this.global.totalRevisions / this.global.totalRejected || 0;
    
    return {
      global: {
        ...this.global,
        approvalRate: (approvalRate * 100).toFixed(1) + '%',
        averageValidationTime: avgValidationTime.toFixed(0) + 'ms',
        averageRevisionCycles: avgRevisionCycles.toFixed(1),
        uptime: Date.now() - this.global.startTime
      },
      topIssues: this.getTopIssues(5),
      worstPerformingSpecialists: this.getWorstSpecialists(5),
      bestPerformingSpecialists: this.getBestSpecialists(5),
      checkTypeFailureRates: this.getCheckTypeFailureRates(),
      hourlyTrend: this.getHourlyTrend(),
      revisionSuccess: this.revisionSuccess,
      health: this.getHealthScore()
    };
  }

  /**
   * Get top issues
   */
  getTopIssues(limit = 5) {
    return Array.from(this.issuePatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pattern, count]) => {
        const [type, severity] = pattern.split(':');
        return { type, severity, count };
      });
  }

  /**
   * Get worst performing specialists
   */
  getWorstSpecialists(limit = 5) {
    return Array.from(this.specialists.entries())
      .filter(([_, metrics]) => metrics.submissions > 3)
      .sort((a, b) => a[1].approvalRate - b[1].approvalRate)
      .slice(0, limit)
      .map(([id, metrics]) => ({
        id,
        approvalRate: (metrics.approvalRate * 100).toFixed(1) + '%',
        trustScore: metrics.trustScore.toFixed(2),
        submissions: metrics.submissions
      }));
  }

  /**
   * Get best performing specialists
   */
  getBestSpecialists(limit = 5) {
    return Array.from(this.specialists.entries())
      .filter(([_, metrics]) => metrics.submissions > 3)
      .sort((a, b) => b[1].approvalRate - a[1].approvalRate)
      .slice(0, limit)
      .map(([id, metrics]) => ({
        id,
        approvalRate: (metrics.approvalRate * 100).toFixed(1) + '%',
        trustScore: metrics.trustScore.toFixed(2),
        submissions: metrics.submissions
      }));
  }

  /**
   * Get check type failure rates
   */
  getCheckTypeFailureRates() {
    const rates = {};
    this.checkTypes.forEach((metrics, type) => {
      rates[type] = (metrics.failureRate * 100).toFixed(1) + '%';
    });
    return rates;
  }

  /**
   * Get hourly trend
   */
  getHourlyTrend() {
    const currentHour = new Date().getHours();
    const last6Hours = [];
    
    for (let i = 5; i >= 0; i--) {
      const hour = (currentHour - i + 24) % 24;
      const metrics = this.hourlyMetrics[hour];
      last6Hours.push({
        hour: `${hour}:00`,
        validations: metrics.validations,
        approvalRate: metrics.validations > 0 
          ? (metrics.approved / metrics.validations * 100).toFixed(1) + '%'
          : 'N/A'
      });
    }
    
    return last6Hours;
  }

  /**
   * Calculate overall health score
   */
  getHealthScore() {
    let score = 100;
    
    const approvalRate = this.global.totalApproved / this.global.totalValidations || 0;
    const avgRevisionCycles = this.global.totalRevisions / this.global.totalRejected || 0;
    const avgValidationTime = this.global.totalTimeMs / this.global.totalValidations || 0;
    
    // Deduct points for poor metrics
    if (approvalRate < this.thresholds.acceptableApprovalRate) {
      score -= 20;
    }
    if (avgRevisionCycles > this.thresholds.acceptableRevisionCycles) {
      score -= 15;
    }
    if (avgValidationTime > this.thresholds.acceptableValidationTime) {
      score -= 10;
    }
    if (this.revisionSuccess.failed > this.revisionSuccess.firstAttempt) {
      score -= 15;
    }
    
    return {
      score: Math.max(0, score),
      status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
      factors: {
        approvalRate: approvalRate >= this.thresholds.acceptableApprovalRate ? '🏁' : '🔴',
        revisionCycles: avgRevisionCycles <= this.thresholds.acceptableRevisionCycles ? '🏁' : '🔴',
        validationTime: avgValidationTime <= this.thresholds.acceptableValidationTime ? '🏁' : '🔴',
        revisionSuccess: this.revisionSuccess.failed <= this.revisionSuccess.firstAttempt ? '🏁' : '🔴'
      }
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.global = {
      totalValidations: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalRevisions: 0,
      totalTimeMs: 0,
      startTime: Date.now()
    };
    
    this.managers.clear();
    this.specialists.clear();
    this.checkTypes.clear();
    this.issuePatterns.clear();
    
    this.revisionSuccess = {
      firstAttempt: 0,
      secondAttempt: 0,
      thirdAttempt: 0,
      failed: 0
    };
    
    this.hourlyMetrics = new Array(24).fill(null).map(() => ({
      validations: 0,
      approved: 0,
      rejected: 0
    }));
    
    logger.info('📊 Validation metrics reset');
  }
}

// Singleton instance
let metricsInstance = null;

/**
 * Get metrics singleton
 */
function getValidationMetrics() {
  if (!metricsInstance) {
    metricsInstance = new ValidationMetrics();
  }
  return metricsInstance;
}

module.exports = {
  ValidationMetrics,
  getValidationMetrics
};