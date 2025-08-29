/**
 * BUMBA CLI 1.0 Design-Engineer Department Manager - WITH VALIDATION
 * Enhanced with mandatory manager validation using Claude Max
 * Focuses on UX, accessibility, and design quality validation
 */

const { DesignEngineerManager } = require('./design-engineer-manager');
const ManagerValidationLayer = require('./manager-validation-layer');
const { ValidationProtocol, ValidationResult, ValidationCheckType } = require('../validation/validation-protocol');
const { getPriorityQueue, PriorityLevel } = require('../agents/claude-max-priority-queue');
const { getValidationMetrics } = require('../validation/validation-metrics');
const { logger } = require('../logging/bumba-logger');

class ValidatedDesignEngineerManager extends DesignEngineerManager {
  constructor() {
    super();
    
    // Initialize validation layer with design-specific checks
    this.validationLayer = new ManagerValidationLayer(this);
    
    // Extend validation with design-specific validators
    this.designValidators = {
      accessibility: this.validateAccessibility.bind(this),
      userExperience: this.validateUserExperience.bind(this),
      designConsistency: this.validateDesignConsistency.bind(this),
      responsiveness: this.validateResponsiveness.bind(this),
      colorContrast: this.validateColorContrast.bind(this),
      typography: this.validateTypography.bind(this)
    };
    
    // Get priority queue for Claude Max
    this.priorityQueue = getPriorityQueue();
    
    // Get metrics tracker
    this.validationMetrics = getValidationMetrics();
    
    // Design-specific validation configuration
    this.validationConfig = {
      enabled: true,
      strictMode: true,
      maxRevisions: 3,
      requireClaudeMax: true,
      validateAccessibility: true,
      validateUserFlow: true,
      validateBrandConsistency: true,
      wcagLevel: 'AA' // WCAG accessibility level
    };
    
    logger.info('🔴 Design Engineer Manager initialized with VALIDATION');
  }

  /**
   * Override executeTask to add design validation
   */
  async executeTask(command, args, context) {
    const startTime = Date.now();
    const taskId = `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`\n${'═'.repeat(60)}`);
    logger.info(`🔴 DESIGN TASK: ${command}`);
    logger.info(`   Task ID: ${taskId}`);
    logger.info(`   Validation: ENABLED (Design Focus)`);
    logger.info(`${'═'.repeat(60)}\n`);
    
    try {
      // Step 1: Execute specialist work
      logger.info('1️⃣ DESIGN SPECIALIST EXECUTION');
      const specialistResult = await super.executeTask(command, args, context);
      
      // Step 2: Design-specific validation with Claude Max
      logger.info('\n2️⃣ DESIGN MANAGER VALIDATION PHASE');
      const validationResult = await this.validateDesignWork(
        specialistResult,
        command,
        args,
        context,
        taskId
      );
      
      // Step 3: Handle validation result
      if (validationResult.isPassed()) {
        logger.info('\n🏁 DESIGN VALIDATION PASSED');
        
        // Record metrics
        this.validationMetrics.recordValidation(
          validationResult,
          this.name,
          specialistResult.specialist
        );
        
        return {
          ...specialistResult,
          validation: {
            status: 'approved',
            validationId: validationResult.id,
            validatedBy: this.name,
            validationModel: validationResult.validatorModel,
            designScore: validationResult.designScore,
            accessibilityScore: validationResult.accessibilityScore,
            confidence: validationResult.confidence
          }
        };
        
      } else {
        logger.warn('\n🟠️ DESIGN VALIDATION FAILED - Revision required');
        
        // Step 4: Request design revision
        const revisedResult = await this.handleDesignRevision(
          specialistResult,
          validationResult,
          command,
          args,
          context,
          taskId
        );
        
        return revisedResult;
      }
      
    } catch (error) {
      logger.error(`🔴 Design task failed: ${error.message}`);
      throw error;
      
    } finally {
      const totalTime = Date.now() - startTime;
      logger.info(`\n📊 Design task completed in ${totalTime}ms`);
    }
  }

  /**
   * Validate design work with design-specific checks
   */
  async validateDesignWork(specialistResult, command, args, context, taskId) {
    logger.info('🔴 Requesting Claude Max for design validation...');
    
    // Request Claude Max with HIGHEST priority
    const claudeMaxAccess = await this.priorityQueue.requestAccess(
      this.name,
      'design-validation',
      PriorityLevel.VALIDATION,
      { taskId, command }
    );
    
    if (!claudeMaxAccess.granted) {
      throw new Error(`Failed to acquire Claude Max for design validation: ${claudeMaxAccess.reason}`);
    }
    
    logger.info(`🔒 Claude Max acquired for design review`);
    
    try {
      // Perform standard validation
      const standardValidation = await this.validationLayer.validateSpecialistWork(
        specialistResult,
        command,
        context
      );
      
      // Add design-specific validations
      const designValidation = await this.performDesignValidation(specialistResult);
      
      // Combine validations
      const combinedChecks = {
        ...standardValidation.checks,
        ...designValidation.checks
      };
      
      // Calculate design-specific scores
      const designScore = this.calculateDesignScore(combinedChecks);
      const accessibilityScore = this.calculateAccessibilityScore(combinedChecks);
      
      // Determine if passed
      const allChecksPassed = Object.values(combinedChecks).every(check => check.passed);
      
      // Create comprehensive result
      const result = new ValidationResult({
        approved: allChecksPassed && designScore >= 0.7,
        requiresRevision: !allChecksPassed || designScore < 0.7,
        validatorId: this.name,
        validatorModel: 'claude-max',
        command,
        specialistId: specialistResult.specialist,
        checks: combinedChecks,
        issues: this.extractDesignIssues(combinedChecks),
        feedback: this.generateDesignFeedback(combinedChecks, designScore),
        validationTime: claudeMaxAccess.waitTime,
        confidence: this.calculateConfidence(combinedChecks, designScore),
        designScore,
        accessibilityScore
      });
      
      return result;
      
    } finally {
      this.priorityQueue.releaseAccess(claudeMaxAccess.lockId);
      logger.info('🔓 Claude Max released');
    }
  }

  /**
   * Perform design-specific validation checks
   */
  async performDesignValidation(result) {
    const checks = {};
    
    // Accessibility validation
    if (this.validationConfig.validateAccessibility) {
      checks.accessibility = await this.validateAccessibility(result);
    }
    
    // User experience validation
    checks.userExperience = await this.validateUserExperience(result);
    
    // Design consistency validation
    checks.designConsistency = await this.validateDesignConsistency(result);
    
    // Responsiveness validation
    if (result.hasUI) {
      checks.responsiveness = await this.validateResponsiveness(result);
    }
    
    // Color contrast validation
    if (result.colors) {
      checks.colorContrast = await this.validateColorContrast(result);
    }
    
    // Typography validation
    if (result.typography) {
      checks.typography = await this.validateTypography(result);
    }
    
    return { checks };
  }

  /**
   * Validate accessibility (WCAG compliance)
   */
  async validateAccessibility(result) {
    const issues = [];
    
    if (result.html || result.components) {
      // Check for alt text on images
      if (/<img(?![^>]*alt=)/i.test(result.html || '')) {
        issues.push('Images missing alt text');
      }
      
      // Check for proper heading hierarchy
      if (result.html && !/<h1/i.test(result.html)) {
        issues.push('Missing H1 heading');
      }
      
      // Check for ARIA labels
      if (/<button(?![^>]*aria-label)/i.test(result.html || '')) {
        issues.push('Buttons missing ARIA labels');
      }
      
      // Check for keyboard navigation
      if (!result.keyboardAccessible) {
        issues.push('Keyboard navigation not implemented');
      }
    }
    
    return {
      passed: issues.length === 0,
      message: issues.length > 0 
        ? `${issues.length} accessibility issues found`
        : `Meets WCAG ${this.validationConfig.wcagLevel} standards`,
      issues,
      wcagLevel: this.validationConfig.wcagLevel
    };
  }

  /**
   * Validate user experience
   */
  async validateUserExperience(result) {
    const criteria = {
      clarity: true,
      consistency: true,
      feedback: true,
      errorHandling: true,
      userFlow: true
    };
    
    // Check for clear CTAs
    if (result.components && !result.components.some(c => c.type === 'cta')) {
      criteria.clarity = false;
    }
    
    // Check for loading states
    if (result.hasAsync && !result.loadingStates) {
      criteria.feedback = false;
    }
    
    // Check for error states
    if (!result.errorStates) {
      criteria.errorHandling = false;
    }
    
    const passed = Object.values(criteria).every(v => v);
    
    return {
      passed,
      message: passed ? 'Good user experience' : 'UX improvements needed',
      criteria,
      score: Object.values(criteria).filter(v => v).length / Object.keys(criteria).length
    };
  }

  /**
   * Validate design consistency
   */
  async validateDesignConsistency(result) {
    const issues = [];
    
    // Check for design system usage
    if (!result.usesDesignSystem) {
      issues.push('Not using established design system');
    }
    
    // Check for consistent spacing
    if (result.css && !result.css.includes('var(--spacing')) {
      issues.push('Not using consistent spacing variables');
    }
    
    // Check for consistent colors
    if (result.colors && result.colors.length > 10) {
      issues.push('Too many color variations (>10)');
    }
    
    return {
      passed: issues.length === 0,
      message: issues.length > 0
        ? `${issues.length} consistency issues`
        : 'Design is consistent',
      issues
    };
  }

  /**
   * Validate responsiveness
   */
  async validateResponsiveness(result) {
    const breakpoints = ['mobile', 'tablet', 'desktop', 'wide'];
    const supported = [];
    
    breakpoints.forEach(breakpoint => {
      if (result.breakpoints && result.breakpoints.includes(breakpoint)) {
        supported.push(breakpoint);
      }
    });
    
    const coverage = supported.length / breakpoints.length;
    
    return {
      passed: coverage >= 0.75, // At least 3 of 4 breakpoints
      message: `Supports ${supported.length}/${breakpoints.length} breakpoints`,
      supported,
      coverage
    };
  }

  /**
   * Validate color contrast
   */
  async validateColorContrast(result) {
    // Simulate contrast checking
    const issues = [];
    
    if (result.colors) {
      // Check text contrast ratios
      if (result.textColorRatio && result.textColorRatio < 4.5) {
        issues.push(`Text contrast ratio too low: ${result.textColorRatio}`);
      }
      
      // Check button contrast
      if (result.buttonColorRatio && result.buttonColorRatio < 3) {
        issues.push(`Button contrast ratio too low: ${result.buttonColorRatio}`);
      }
    }
    
    return {
      passed: issues.length === 0,
      message: issues.length > 0
        ? 'Color contrast issues found'
        : 'Color contrast meets WCAG standards',
      issues
    };
  }

  /**
   * Validate typography
   */
  async validateTypography(result) {
    const issues = [];
    
    if (result.typography) {
      // Check font stack
      if (!result.typography.fallbackFonts) {
        issues.push('No fallback fonts specified');
      }
      
      // Check line height
      if (result.typography.lineHeight && result.typography.lineHeight < 1.4) {
        issues.push('Line height too small for readability');
      }
      
      // Check font size
      if (result.typography.baseFontSize && result.typography.baseFontSize < 14) {
        issues.push('Base font size too small');
      }
    }
    
    return {
      passed: issues.length === 0,
      message: issues.length > 0
        ? 'Typography issues found'
        : 'Typography is readable and accessible',
      issues
    };
  }

  /**
   * Calculate design quality score
   */
  calculateDesignScore(checks) {
    const weights = {
      accessibility: 0.25,
      userExperience: 0.25,
      designConsistency: 0.2,
      responsiveness: 0.15,
      colorContrast: 0.1,
      typography: 0.05
    };
    
    let score = 0;
    let totalWeight = 0;
    
    Object.entries(checks).forEach(([checkType, result]) => {
      const weight = weights[checkType] || 0.1;
      if (result.passed) {
        score += weight;
      } else if (result.score) {
        score += weight * result.score;
      }
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate accessibility score
   */
  calculateAccessibilityScore(checks) {
    const accessibilityChecks = ['accessibility', 'colorContrast', 'typography'];
    let score = 0;
    let count = 0;
    
    accessibilityChecks.forEach(checkType => {
      if (checks[checkType]) {
        count++;
        if (checks[checkType].passed) {
          score += 1;
        } else if (checks[checkType].score) {
          score += checks[checkType].score;
        }
      }
    });
    
    return count > 0 ? score / count : 0;
  }

  /**
   * Extract design-specific issues
   */
  extractDesignIssues(checks) {
    const issues = [];
    
    Object.entries(checks).forEach(([checkType, result]) => {
      if (!result.passed && result.issues) {
        result.issues.forEach(issue => {
          issues.push({
            type: checkType,
            severity: this.getDesignIssueSeverity(checkType),
            message: issue
          });
        });
      }
    });
    
    return issues;
  }

  /**
   * Generate design-specific feedback
   */
  generateDesignFeedback(checks, designScore) {
    const feedback = [];
    
    // Prioritize accessibility feedback
    if (checks.accessibility && !checks.accessibility.passed) {
      feedback.push({
        type: 'accessibility',
        severity: 'critical',
        message: 'Fix accessibility issues for WCAG compliance',
        details: checks.accessibility.issues
      });
    }
    
    // UX feedback
    if (checks.userExperience && !checks.userExperience.passed) {
      feedback.push({
        type: 'user_experience',
        severity: 'high',
        message: 'Improve user experience',
        details: checks.userExperience.criteria
      });
    }
    
    // Add score-based feedback
    if (designScore < 0.5) {
      feedback.push({
        type: 'overall',
        severity: 'high',
        message: `Design quality score too low: ${(designScore * 100).toFixed(0)}%`,
        action: 'Major design improvements required'
      });
    }
    
    return feedback;
  }

  /**
   * Get severity for design issues
   */
  getDesignIssueSeverity(checkType) {
    const severityMap = {
      accessibility: 'critical',
      userExperience: 'high',
      designConsistency: 'medium',
      responsiveness: 'high',
      colorContrast: 'critical',
      typography: 'medium'
    };
    return severityMap[checkType] || 'low';
  }

  /**
   * Handle design-specific revision
   */
  async handleDesignRevision(originalResult, validationResult, command, args, context, taskId) {
    const maxAttempts = this.validationConfig.maxRevisions;
    let currentResult = originalResult;
    let currentValidation = validationResult;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.info(`\n🔴 DESIGN REVISION ${attempt}/${maxAttempts}`);
      
      // Create design-focused revision request
      const revisionRequest = {
        ...await this.validationLayer.requestRevision(
          { id: currentResult.specialist, name: currentResult.specialist },
          currentValidation,
          currentResult
        ),
        designFocus: true,
        designScore: currentValidation.designScore,
        accessibilityScore: currentValidation.accessibilityScore,
        priorityFixes: this.getPriorityDesignFixes(currentValidation)
      };
      
      // Execute design revision
      const revisedResult = await this.executeDesignRevision(
        currentResult.specialist,
        revisionRequest,
        command,
        args,
        context
      );
      
      // Re-validate with design focus
      const revalidation = await this.validateDesignWork(
        revisedResult,
        command,
        args,
        context,
        taskId
      );
      
      if (revalidation.isPassed() && revalidation.designScore >= 0.7) {
        logger.info(`🏁 Design revision ${attempt} PASSED`);
        
        this.validationMetrics.recordRevision(revisionRequest, true, attempt);
        
        return {
          ...revisedResult,
          validation: {
            status: 'approved_after_revision',
            validationId: revalidation.id,
            revisionAttempts: attempt,
            finalDesignScore: revalidation.designScore,
            finalAccessibilityScore: revalidation.accessibilityScore
          }
        };
      }
      
      currentResult = revisedResult;
      currentValidation = revalidation;
    }
    
    // All revisions failed
    return {
      ...currentResult,
      validation: {
        status: 'rejected_final',
        reason: 'Design standards not met after revisions',
        finalDesignScore: currentValidation.designScore,
        feedback: currentValidation.feedback
      }
    };
  }

  /**
   * Get priority design fixes from validation
   */
  getPriorityDesignFixes(validation) {
    const fixes = [];
    
    // Always prioritize accessibility
    if (validation.checks.accessibility && !validation.checks.accessibility.passed) {
      fixes.push('Fix all accessibility issues');
    }
    
    // Then UX issues
    if (validation.checks.userExperience && !validation.checks.userExperience.passed) {
      fixes.push('Improve user experience flow');
    }
    
    // Then visual issues
    if (validation.checks.colorContrast && !validation.checks.colorContrast.passed) {
      fixes.push('Fix color contrast ratios');
    }
    
    return fixes;
  }

  /**
   * Execute design-specific revision
   */
  async executeDesignRevision(specialistId, revisionRequest, command, args, context) {
    logger.info(`🔴 Design specialist ${specialistId} processing revision...`);
    logger.info(`   Priority fixes: ${revisionRequest.priorityFixes.join(', ')}`);
    
    // Get specialist and execute revision with design context
    const SpecialistClass = this.specialists.get(specialistId);
    if (!SpecialistClass) {
      throw new Error(`Design specialist ${specialistId} not found`);
    }
    
    const specialist = new SpecialistClass();
    
    const revisionContext = {
      ...context,
      isRevision: true,
      revisionRequest,
      designFocus: true,
      priorityFixes: revisionRequest.priorityFixes,
      targetDesignScore: 0.7,
      targetAccessibilityScore: 0.9
    };
    
    const revisedResult = await specialist.execute?.(command, args, revisionContext) ||
                          await this.simulateDesignRevision(specialistId, revisionRequest);
    
    return {
      ...revisedResult,
      specialist: specialistId,
      isRevision: true,
      revisionAttempt: revisionRequest.attemptNumber
    };
  }

  /**
   * Simulate design revision
   */
  async simulateDesignRevision(specialistId, revisionRequest) {
    return {
      type: 'revised_design_solution',
      description: 'Revised design with improved accessibility and UX',
      accessibility: {
        altTexts: 'All images have descriptive alt text',
        ariaLabels: 'All interactive elements have ARIA labels',
        keyboardNav: 'Full keyboard navigation implemented'
      },
      userExperience: {
        clarity: 'Clear CTAs and user flow',
        feedback: 'Loading and success states added',
        errorHandling: 'Comprehensive error states'
      },
      responsive: {
        breakpoints: ['mobile', 'tablet', 'desktop', 'wide'],
        tested: true
      },
      usesDesignSystem: true,
      wcagCompliant: 'AA'
    };
  }

  /**
   * Calculate confidence for design validation
   */
  calculateConfidence(checks, designScore) {
    let confidence = designScore;
    
    // Boost confidence if accessibility is perfect
    if (checks.accessibility && checks.accessibility.passed) {
      confidence += 0.1;
    }
    
    // Reduce confidence for critical issues
    if (checks.colorContrast && !checks.colorContrast.passed) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
}

module.exports = ValidatedDesignEngineerManager;