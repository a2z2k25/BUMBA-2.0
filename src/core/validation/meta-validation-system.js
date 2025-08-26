/**
 * Meta-Validation System
 * Validates the validation layer itself to ensure quality standards
 * Prevents rubber-stamping and ensures validation integrity
 */

const { logger } = require('../logging/bumba-logger');
const { getValidationMetrics } = require('./validation-metrics');

class MetaValidationSystem {
  constructor() {
    this.metrics = getValidationMetrics();
    
    // Meta-validation thresholds
    this.thresholds = {
      minValidationTime: 100,        // Minimum time for proper validation (ms)
      maxValidationTime: 30000,      // Maximum reasonable validation time
      minChecksPerformed: 5,         // Minimum number of checks
      maxApprovalRate: 0.95,         // Suspiciously high approval rate
      minApprovalRate: 0.3,          // Suspiciously low approval rate
      minFeedbackLength: 20,         // Minimum feedback detail
      requiredCheckTypes: [          // Must include these checks
        'syntax',
        'security',
        'business_logic'
      ]
    };
    
    // Track validation patterns
    this.validationPatterns = {
      consecutiveApprovals: 0,
      consecutiveRejections: 0,
      averageValidationTime: 0,
      totalValidations: 0,
      suspiciousPatterns: []
    };
    
    // Audit log
    this.auditLog = [];
  }

  /**
   * Validate the validation process itself
   */
  async validateValidation(validationResult, validationContext) {
    const metaChecks = {
      timeReasonable: false,
      checksComplete: false,
      feedbackAdequate: false,
      patternNormal: false,
      biasDetected: false,
      qualityScore: 0
    };
    
    const issues = [];
    
    // 1. Check validation time
    const validationTime = validationContext.validationTime || 0;
    if (validationTime < this.thresholds.minValidationTime) {
      issues.push({
        type: 'too_fast',
        severity: 'high',
        message: `Validation completed too quickly (${validationTime}ms) - may not be thorough`,
        recommendation: 'Ensure comprehensive review is performed'
      });
    } else if (validationTime > this.thresholds.maxValidationTime) {
      issues.push({
        type: 'too_slow',
        severity: 'medium',
        message: `Validation took excessive time (${validationTime}ms)`,
        recommendation: 'Check for performance issues'
      });
    } else {
      metaChecks.timeReasonable = true;
    }
    
    // 2. Check number and types of checks performed
    const checksPerformed = Object.keys(validationResult.checks || {});
    if (checksPerformed.length < this.thresholds.minChecksPerformed) {
      issues.push({
        type: 'insufficient_checks',
        severity: 'high',
        message: `Only ${checksPerformed.length} checks performed (minimum: ${this.thresholds.minChecksPerformed})`,
        recommendation: 'Perform more comprehensive validation'
      });
    }
    
    // Verify required checks
    const missingRequiredChecks = this.thresholds.requiredCheckTypes.filter(
      required => !checksPerformed.includes(required)
    );
    
    if (missingRequiredChecks.length > 0) {
      issues.push({
        type: 'missing_required_checks',
        severity: 'critical',
        message: `Missing required checks: ${missingRequiredChecks.join(', ')}`,
        recommendation: 'Must include all required validation checks'
      });
    } else {
      metaChecks.checksComplete = true;
    }
    
    // 3. Check feedback quality
    const feedback = validationResult.feedback || [];
    const totalFeedbackLength = feedback.reduce((sum, f) => sum + (f.message || '').length, 0);
    
    if (!validationResult.approved && totalFeedbackLength < this.thresholds.minFeedbackLength) {
      issues.push({
        type: 'insufficient_feedback',
        severity: 'high',
        message: 'Rejection without adequate feedback',
        recommendation: 'Provide detailed, actionable feedback for rejections'
      });
    } else if (feedback.length > 0) {
      metaChecks.feedbackAdequate = true;
    }
    
    // 4. Check for suspicious patterns
    const suspiciousPattern = this.detectSuspiciousPatterns(validationResult, validationContext);
    if (suspiciousPattern) {
      issues.push({
        type: 'suspicious_pattern',
        severity: 'medium',
        message: suspiciousPattern.message,
        recommendation: suspiciousPattern.recommendation
      });
    } else {
      metaChecks.patternNormal = true;
    }
    
    // 5. Check for bias
    const biasCheck = this.detectValidationBias(validationResult, validationContext);
    if (biasCheck.biasDetected) {
      issues.push({
        type: 'potential_bias',
        severity: 'medium',
        message: biasCheck.message,
        recommendation: 'Ensure objective validation criteria'
      });
      metaChecks.biasDetected = true;
    }
    
    // 6. Calculate quality score
    metaChecks.qualityScore = this.calculateValidationQuality(
      validationResult,
      validationContext,
      metaChecks
    );
    
    // 7. Record in audit log
    this.recordAudit(validationResult, validationContext, metaChecks, issues);
    
    // 8. Update patterns
    this.updatePatterns(validationResult, validationContext);
    
    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      qualityScore: metaChecks.qualityScore,
      metaChecks,
      issues,
      recommendation: this.generateRecommendation(metaChecks, issues)
    };
  }

  /**
   * Detect suspicious validation patterns
   */
  detectSuspiciousPatterns(result, context) {
    // Check for rubber-stamping (too many consecutive approvals)
    if (result.approved) {
      this.validationPatterns.consecutiveApprovals++;
      this.validationPatterns.consecutiveRejections = 0;
      
      if (this.validationPatterns.consecutiveApprovals > 10) {
        return {
          message: `${this.validationPatterns.consecutiveApprovals} consecutive approvals - possible rubber-stamping`,
          recommendation: 'Review validation criteria and ensure thorough checking'
        };
      }
    } else {
      this.validationPatterns.consecutiveRejections++;
      this.validationPatterns.consecutiveApprovals = 0;
      
      if (this.validationPatterns.consecutiveRejections > 5) {
        return {
          message: `${this.validationPatterns.consecutiveRejections} consecutive rejections - possible over-strictness`,
          recommendation: 'Review if validation criteria are too strict'
        };
      }
    }
    
    // Check for always passing specific check types
    const allChecksPassed = Object.values(result.checks || {}).every(check => check.passed);
    if (allChecksPassed && Object.keys(result.checks || {}).length > 5) {
      return {
        message: 'All checks passed - unusually perfect result',
        recommendation: 'Verify validation logic is working correctly'
      };
    }
    
    // Check for validation time patterns
    const avgTime = this.validationPatterns.averageValidationTime;
    const currentTime = context.validationTime || 0;
    
    if (avgTime > 0 && Math.abs(currentTime - avgTime) < 50) {
      // Validation times are suspiciously consistent
      this.validationPatterns.suspiciousPatterns.push('consistent_timing');
      if (this.validationPatterns.suspiciousPatterns.filter(p => p === 'consistent_timing').length > 5) {
        return {
          message: 'Validation times are suspiciously consistent',
          recommendation: 'Ensure validation is actually being performed'
        };
      }
    }
    
    return null;
  }

  /**
   * Detect potential bias in validation
   */
  detectValidationBias(result, context) {
    const biasIndicators = [];
    
    // Check for specialist bias
    if (context.specialistId) {
      const specialistMetrics = this.metrics.specialists.get(context.specialistId);
      if (specialistMetrics) {
        // Check if this specialist is always approved/rejected
        if (specialistMetrics.approvalRate > 0.95) {
          biasIndicators.push('always_approved');
        } else if (specialistMetrics.approvalRate < 0.05) {
          biasIndicators.push('always_rejected');
        }
      }
    }
    
    // Check for manager bias
    if (context.managerId) {
      const managerMetrics = this.metrics.managers.get(context.managerId);
      if (managerMetrics) {
        // Check if manager has unusual approval patterns
        if (managerMetrics.approvalRate > this.thresholds.maxApprovalRate) {
          biasIndicators.push('manager_over_approves');
        } else if (managerMetrics.approvalRate < this.thresholds.minApprovalRate) {
          biasIndicators.push('manager_over_rejects');
        }
      }
    }
    
    // Check for time-based bias (rushing at end of day, etc.)
    const hour = new Date().getHours();
    if ((hour < 6 || hour > 22) && result.approved) {
      biasIndicators.push('off_hours_approval');
    }
    
    return {
      biasDetected: biasIndicators.length > 0,
      indicators: biasIndicators,
      message: biasIndicators.length > 0 
        ? `Potential bias detected: ${biasIndicators.join(', ')}`
        : 'No bias detected'
    };
  }

  /**
   * Calculate validation quality score
   */
  calculateValidationQuality(result, context, metaChecks) {
    let score = 100;
    
    // Deduct for issues
    if (!metaChecks.timeReasonable) score -= 15;
    if (!metaChecks.checksComplete) score -= 25;
    if (!metaChecks.feedbackAdequate) score -= 20;
    if (!metaChecks.patternNormal) score -= 10;
    if (metaChecks.biasDetected) score -= 15;
    
    // Bonus for thoroughness
    const numChecks = Object.keys(result.checks || {}).length;
    if (numChecks > 8) score += 5;
    if (numChecks > 10) score += 5;
    
    // Bonus for detailed feedback
    const feedbackLength = (result.feedback || []).reduce((sum, f) => sum + (f.message || '').length, 0);
    if (feedbackLength > 200) score += 5;
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Record validation in audit log
   */
  recordAudit(result, context, metaChecks, issues) {
    const auditEntry = {
      timestamp: Date.now(),
      validationId: result.id || `val-${Date.now()}`,
      managerId: context.managerId,
      specialistId: context.specialistId,
      command: context.command,
      approved: result.approved,
      qualityScore: metaChecks.qualityScore,
      issues: issues.map(i => ({ type: i.type, severity: i.severity })),
      metaChecks: { ...metaChecks },
      validationTime: context.validationTime
    };
    
    this.auditLog.push(auditEntry);
    
    // Keep audit log size manageable
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500); // Keep last 500 entries
    }
    
    // Log warnings for critical issues
    if (issues.some(i => i.severity === 'critical')) {
      logger.warn('🟠️ Critical meta-validation issue detected:', auditEntry);
    }
  }

  /**
   * Update validation patterns
   */
  updatePatterns(result, context) {
    this.validationPatterns.totalValidations++;
    
    // Update average validation time
    const currentTime = context.validationTime || 0;
    const prevAvg = this.validationPatterns.averageValidationTime;
    this.validationPatterns.averageValidationTime = 
      (prevAvg * (this.validationPatterns.totalValidations - 1) + currentTime) / 
      this.validationPatterns.totalValidations;
  }

  /**
   * Generate recommendation based on meta-validation
   */
  generateRecommendation(metaChecks, issues) {
    if (metaChecks.qualityScore >= 90) {
      return 'Excellent validation quality - continue current practices';
    } else if (metaChecks.qualityScore >= 70) {
      return 'Good validation quality - minor improvements recommended';
    } else if (metaChecks.qualityScore >= 50) {
      return 'Acceptable validation quality - review flagged issues';
    } else {
      return 'Poor validation quality - immediate review required';
    }
  }

  /**
   * Get validation quality report
   */
  getQualityReport() {
    const recentAudits = this.auditLog.slice(-100);
    const avgQuality = recentAudits.reduce((sum, a) => sum + a.qualityScore, 0) / recentAudits.length || 0;
    
    const issueFrequency = {};
    recentAudits.forEach(audit => {
      audit.issues.forEach(issue => {
        issueFrequency[issue.type] = (issueFrequency[issue.type] || 0) + 1;
      });
    });
    
    return {
      averageQualityScore: avgQuality.toFixed(1),
      totalValidationsAudited: this.validationPatterns.totalValidations,
      averageValidationTime: this.validationPatterns.averageValidationTime.toFixed(0) + 'ms',
      currentPatterns: {
        consecutiveApprovals: this.validationPatterns.consecutiveApprovals,
        consecutiveRejections: this.validationPatterns.consecutiveRejections
      },
      commonIssues: Object.entries(issueFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      recommendation: this.getOverallRecommendation(avgQuality)
    };
  }

  /**
   * Get overall recommendation
   */
  getOverallRecommendation(avgQuality) {
    if (avgQuality >= 85) {
      return '🏁 Validation system performing well';
    } else if (avgQuality >= 70) {
      return '🟠️ Validation system needs minor adjustments';
    } else {
      return '🔴 Validation system requires immediate attention';
    }
  }

  /**
   * Reset patterns (for testing or new period)
   */
  resetPatterns() {
    this.validationPatterns = {
      consecutiveApprovals: 0,
      consecutiveRejections: 0,
      averageValidationTime: 0,
      totalValidations: 0,
      suspiciousPatterns: []
    };
    logger.info('📊 Meta-validation patterns reset');
  }
}

// Singleton instance
let metaValidationInstance = null;

/**
 * Get meta-validation singleton
 */
function getMetaValidation() {
  if (!metaValidationInstance) {
    metaValidationInstance = new MetaValidationSystem();
  }
  return metaValidationInstance;
}

module.exports = {
  MetaValidationSystem,
  getMetaValidation
};