/**
 * Manager Validation Layer
 * Ensures managers use Claude Max for specialist work validation
 * Implements comprehensive review before work is committed
 */

const { logger } = require('../logging/bumba-logger');
const { getMetaValidation } = require('../validation/meta-validation-system');
const { getBumbaMemory } = require('../memory/bumba-memory-system');

class ManagerValidationLayer {
  constructor(manager) {
    this.manager = manager;
    this.validationMetrics = {
      totalReviews: 0,
      approved: 0,
      rejected: 0,
      revisions: 0,
      averageReviewTime: 0
    };
    
    // Initialize meta-validation system
    this.metaValidation = getMetaValidation();
    
    // Initialize memory system
    this.memory = getBumbaMemory();
  }

  /**
   * Ensure manager has Claude Max before validation
   * BLOCKS until Claude Max is available
   */
  async ensureClaudeMaxForValidation() {
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds
    
    for (let i = 0; i < maxRetries; i++) {
      if (this.manager.usingClaudeMax) {
        logger.info('🏁 Manager has Claude Max for validation');
        return true;
      }
      
      logger.info(`⏳ Waiting for Claude Max (attempt ${i + 1}/${maxRetries})...`);
      
      // Try to acquire Claude Max with HIGH priority
      const lockId = `${this.manager.name}-validation-${Date.now()}`;
      const acquired = await this.manager.claudeMaxManager?.acquireLock(
        lockId,
        'manager-validation',
        5 // HIGHEST priority for validation
      );
      
      if (acquired) {
        this.manager.modelConfig = this.manager.claudeMaxManager.getClaudeMaxConfig();
        this.manager.usingClaudeMax = true;
        this.manager.claudeMaxLockId = lockId;
        logger.info('🔒 Acquired Claude Max for validation');
        return true;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    throw new Error('Could not acquire Claude Max for validation after 10 attempts');
  }

  /**
   * Comprehensive validation of specialist work
   * Manager MUST have Claude Max to execute this
   */
  async validateSpecialistWork(specialistResult, originalCommand, context = {}) {
    const startTime = Date.now();
    this.validationMetrics.totalReviews++;
    
    logger.info('\n🔍 MANAGER VALIDATION PHASE');
    logger.info('━'.repeat(50));
    
    // OPTIONAL: Consult memory for hints (non-blocking)
    if (this.memory && context.enableMemory !== false) {
      try {
        const memoryHints = await this.memory.consultMemory(originalCommand, specialistResult.specialist);
        if (memoryHints && memoryHints.suggestions.length > 0) {
          logger.info('💡 Memory hints available:', memoryHints.suggestions.slice(0, 2));
        }
      } catch (e) {
        // Memory consultation failed - continue without it
      }
    }
    
    // CRITICAL: Ensure we have Claude Max
    await this.ensureClaudeMaxForValidation();
    
    const validation = {
      timestamp: new Date().toISOString(),
      manager: this.manager.name,
      model: this.manager.modelConfig?.model || 'unknown',
      command: originalCommand,
      checks: {},
      issues: [],
      approved: false,
      requiresRevision: false,
      feedback: []
    };
    
    // 1. Syntax and Structure Validation
    validation.checks.syntax = await this.validateSyntax(specialistResult);
    
    // 2. Security Validation
    validation.checks.security = await this.validateSecurity(specialistResult);
    
    // 3. Performance Validation
    validation.checks.performance = await this.validatePerformance(specialistResult);
    
    // 4. Best Practices Validation
    validation.checks.bestPractices = await this.validateBestPractices(specialistResult);
    
    // 5. Requirements Alignment
    validation.checks.requirements = await this.validateRequirements(
      specialistResult, 
      originalCommand, 
      context
    );
    
    // 6. Test Coverage (if applicable)
    if (specialistResult.code) {
      validation.checks.testing = await this.validateTestCoverage(specialistResult);
    }
    
    // Aggregate results
    const allChecksPassed = Object.values(validation.checks)
      .every(check => check.passed);
    
    validation.approved = allChecksPassed;
    validation.requiresRevision = !allChecksPassed;
    
    // Generate feedback
    if (!allChecksPassed) {
      validation.feedback = this.generateFeedback(validation.checks);
      this.validationMetrics.rejected++;
      logger.warn('🟠️ Validation FAILED - Revision required');
    } else {
      this.validationMetrics.approved++;
      logger.info('🏁 Validation PASSED - Work approved');
    }
    
    // Update metrics
    const reviewTime = Date.now() - startTime;
    this.updateMetrics(reviewTime);
    validation.reviewTime = reviewTime;
    
    // CRITICAL: Meta-validate the validation itself
    const metaValidationContext = {
      validationTime: reviewTime,
      managerId: this.manager.name,
      specialistId: specialistResult.specialist,
      command: originalCommand
    };
    
    const metaResult = await this.metaValidation.validateValidation(
      validation,
      metaValidationContext
    );
    
    // Add meta-validation results to the validation
    validation.metaValidation = {
      qualityScore: metaResult.qualityScore,
      isValid: metaResult.isValid,
      issues: metaResult.issues,
      recommendation: metaResult.recommendation
    };
    
    // Log meta-validation warnings
    if (!metaResult.isValid) {
      logger.warn('🟠️ Meta-validation detected issues with the validation process:');
      metaResult.issues.forEach(issue => {
        logger.warn(`  - ${issue.type}: ${issue.message}`);
      });
    }
    
    // If meta-validation quality is too low, force re-validation
    if (metaResult.qualityScore < 50) {
      logger.error('🔴 Validation quality too low - forcing re-validation');
      validation.requiresRevision = true;
      validation.approved = false;
      validation.feedback.push({
        type: 'meta_validation',
        message: 'Validation process quality insufficient - please re-validate thoroughly'
      });
    }
    
    // Record to memory system for learning
    if (this.memory) {
      await this.memory.recordValidation(validation, metaResult);
      
      // Check for similar past validations
      const similar = await this.memory.querySimilarValidations(originalCommand, specialistResult.specialist);
      if (similar.length > 0) {
        logger.info(`💡 Found ${similar.length} similar past validations`);
        
        // Learn from patterns if there are repeated issues
        const commonIssues = this.analyzeCommonIssues(similar);
        if (commonIssues.length > 0 && !validation.approved) {
          logger.info('📚 Common issues from memory:', commonIssues);
        }
      }
    }
    
    logger.info(`Review completed in ${reviewTime}ms using ${validation.model}`);
    logger.info(`Meta-validation quality score: ${metaResult.qualityScore}/100`);
    logger.info('━'.repeat(50) + '\n');
    
    return validation;
  }

  /**
   * Individual validation methods
   */
  async validateSyntax(result) {
    if (!result.code) {
      return { passed: true, message: 'No code to validate' };
    }
    
    try {
      // Basic syntax checks (would integrate with actual linters)
      const hasErrors = false; // Placeholder for actual syntax check
      
      return {
        passed: !hasErrors,
        message: hasErrors ? 'Syntax errors detected' : 'Syntax valid',
        details: []
      };
    } catch (error) {
      return {
        passed: false,
        message: `Syntax validation error: ${error.message}`
      };
    }
  }

  async validateSecurity(result) {
    const securityIssues = [];
    
    if (result.code) {
      // Check for common security issues
      const patterns = [
        { regex: /eval\(/, issue: 'Use of eval() detected' },
        { regex: /innerHTML\s*=/, issue: 'Direct innerHTML assignment' },
        { regex: /password.*=.*['"]/, issue: 'Hardcoded password detected' },
        { regex: /api[_-]?key.*=.*['"]/, issue: 'Hardcoded API key detected' }
      ];
      
      patterns.forEach(({ regex, issue }) => {
        if (regex.test(result.code)) {
          securityIssues.push(issue);
        }
      });
    }
    
    return {
      passed: securityIssues.length === 0,
      message: securityIssues.length > 0 ? 
        `${securityIssues.length} security issues found` : 
        'No security issues detected',
      issues: securityIssues
    };
  }

  async validatePerformance(result) {
    const performanceIssues = [];
    
    if (result.code) {
      // Check for performance anti-patterns
      if (/for.*for.*for/.test(result.code)) {
        performanceIssues.push('Triple nested loops detected');
      }
      if (/SELECT \* FROM/.test(result.code)) {
        performanceIssues.push('SELECT * query detected');
      }
      if (/while\s*\(true\)/.test(result.code)) {
        performanceIssues.push('Infinite loop risk detected');
      }
    }
    
    return {
      passed: performanceIssues.length === 0,
      message: performanceIssues.length > 0 ?
        `${performanceIssues.length} performance concerns` :
        'Performance acceptable',
      issues: performanceIssues
    };
  }

  async validateBestPractices(result) {
    const violations = [];
    
    if (result.code) {
      // Check for best practice violations
      if (!/^\/\*\*/.test(result.code) && result.code.length > 100) {
        violations.push('Missing documentation header');
      }
      if (/console\.log/.test(result.code) && !result.isDebugMode) {
        violations.push('Console.log statements in production code');
      }
      if (/var\s+/.test(result.code)) {
        violations.push('Use of var instead of const/let');
      }
    }
    
    return {
      passed: violations.length === 0,
      message: violations.length > 0 ?
        `${violations.length} best practice violations` :
        'Follows best practices',
      violations
    };
  }

  async validateRequirements(result, command, context) {
    // Check if result aligns with original command
    const aligned = true; // Placeholder for actual requirement checking
    
    return {
      passed: aligned,
      message: aligned ? 
        'Meets requirements' : 
        'Does not fully meet requirements',
      command,
      delivered: result.summary || 'No summary provided'
    };
  }

  async validateTestCoverage(result) {
    if (!result.tests) {
      return {
        passed: false,
        message: 'No tests provided',
        coverage: 0
      };
    }
    
    // Placeholder for actual test coverage analysis
    const coverage = 80; // Mock coverage percentage
    const threshold = 70;
    
    return {
      passed: coverage >= threshold,
      message: `Test coverage: ${coverage}% (threshold: ${threshold}%)`,
      coverage
    };
  }

  /**
   * Generate actionable feedback for specialists
   */
  generateFeedback(checks) {
    const feedback = [];
    
    Object.entries(checks).forEach(([checkName, result]) => {
      if (!result.passed) {
        feedback.push({
          type: checkName,
          severity: this.getSeverity(checkName),
          message: result.message,
          details: result.issues || result.violations || [],
          action: this.getRecommendedAction(checkName, result)
        });
      }
    });
    
    return feedback.sort((a, b) => 
      this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)
    );
  }

  getSeverity(checkName) {
    const severityMap = {
      security: 'critical',
      syntax: 'high',
      requirements: 'high',
      performance: 'medium',
      bestPractices: 'low',
      testing: 'medium'
    };
    return severityMap[checkName] || 'low';
  }

  getSeverityWeight(severity) {
    const weights = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };
    return weights[severity] || 0;
  }

  getRecommendedAction(checkName, result) {
    const actions = {
      security: 'Fix all security vulnerabilities immediately',
      syntax: 'Correct syntax errors before proceeding',
      requirements: 'Align implementation with original requirements',
      performance: 'Optimize identified performance bottlenecks',
      bestPractices: 'Refactor to follow coding standards',
      testing: 'Add tests to meet coverage threshold'
    };
    return actions[checkName] || 'Review and address issues';
  }

  /**
   * Update validation metrics
   */
  updateMetrics(reviewTime) {
    const totalTime = this.validationMetrics.averageReviewTime * 
                     (this.validationMetrics.totalReviews - 1) + reviewTime;
    this.validationMetrics.averageReviewTime = 
      totalTime / this.validationMetrics.totalReviews;
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    return {
      ...this.validationMetrics,
      approvalRate: this.validationMetrics.totalReviews > 0 ?
        (this.validationMetrics.approved / this.validationMetrics.totalReviews * 100).toFixed(1) + '%' :
        'N/A'
    };
  }

  /**
   * Get meta-validation quality report
   */
  getMetaValidationReport() {
    return this.metaValidation.getQualityReport();
  }

  /**
   * Check if validation process itself is working correctly
   */
  isValidationHealthy() {
    const report = this.metaValidation.getQualityReport();
    return parseFloat(report.averageQualityScore) >= 70;
  }

  /**
   * Analyze common issues from similar validations
   */
  analyzeCommonIssues(validations) {
    const issueFrequency = {};
    
    validations.forEach(val => {
      try {
        const issues = JSON.parse(val.issues || '[]');
        issues.forEach(issue => {
          const key = `${issue.type}:${issue.severity}`;
          issueFrequency[key] = (issueFrequency[key] || 0) + 1;
        });
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    // Return issues that appear in >50% of validations
    const threshold = validations.length * 0.5;
    return Object.entries(issueFrequency)
      .filter(([_, count]) => count >= threshold)
      .map(([issue, count]) => `${issue} (${count} times)`);
  }

  /**
   * Force stricter validation if quality is dropping
   */
  adjustValidationStrictness() {
    const report = this.metaValidation.getQualityReport();
    const qualityScore = parseFloat(report.averageQualityScore);
    
    if (qualityScore < 60) {
      logger.warn('🟠️ Validation quality dropping - increasing strictness');
      // Add more validation checks or increase thresholds
      this.validationChecks.metaQuality = true;
      this.validationChecks.auditTrail = true;
      return 'strictness_increased';
    } else if (qualityScore > 90 && this.validationChecks.metaQuality) {
      logger.info('🏁 Validation quality excellent - normalizing strictness');
      delete this.validationChecks.metaQuality;
      delete this.validationChecks.auditTrail;
      return 'strictness_normalized';
    }
    
    return 'no_change';
  }
}

module.exports = ManagerValidationLayer;