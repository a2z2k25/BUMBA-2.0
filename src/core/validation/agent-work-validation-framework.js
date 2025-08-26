/**
 * BUMBA Agent Work Validation Framework
 * Enables managers to validate agent work before deprecation
 * Ensures quality and completeness of deliverables
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { ClaudeMaxAccountManager } = require('../agents/claude-max-account-manager');

/**
 * Validation Status
 */
const ValidationStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PASSED: 'passed',
  FAILED: 'failed',
  PARTIAL: 'partial',
  NEEDS_REVISION: 'needs_revision'
};

/**
 * Validation Criteria
 */
const ValidationCriteria = {
  COMPLETENESS: 'completeness',
  CORRECTNESS: 'correctness',
  QUALITY: 'quality',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  DOCUMENTATION: 'documentation',
  TESTING: 'testing'
};

/**
 * Work Validation Framework
 */
class AgentWorkValidationFramework extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      autoValidation: config.autoValidation !== false,
      managerValidation: config.managerValidation !== false,
      validationTimeout: config.validationTimeout || 60000, // 1 minute
      maxRetries: config.maxRetries || 3,
      criteriaWeights: config.criteriaWeights || {
        [ValidationCriteria.COMPLETENESS]: 0.3,
        [ValidationCriteria.CORRECTNESS]: 0.3,
        [ValidationCriteria.QUALITY]: 0.2,
        [ValidationCriteria.PERFORMANCE]: 0.1,
        [ValidationCriteria.SECURITY]: 0.05,
        [ValidationCriteria.DOCUMENTATION]: 0.025,
        [ValidationCriteria.TESTING]: 0.025
      },
      passingThreshold: config.passingThreshold || 0.8,
      ...config
    };
    
    // Validation tracking
    this.validations = new Map();
    this.validationHistory = [];
    this.validationQueue = [];
    
    // Manager access (create new instance if singleton not available)
    try {
      this.claudeMaxManager = ClaudeMaxAccountManager.getInstance ? 
        ClaudeMaxAccountManager.getInstance() : 
        new ClaudeMaxAccountManager();
    } catch (error) {
      this.claudeMaxManager = new ClaudeMaxAccountManager();
    }
    
    // Validation rules
    this.validationRules = new Map();
    this.initializeDefaultRules();
    
    // Statistics
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      partialValidations: 0,
      averageValidationTime: 0,
      averageScore: 0,
      criteriaBreakdown: {}
    };
    
    // Initialize criteria stats
    Object.values(ValidationCriteria).forEach(criteria => {
      this.stats.criteriaBreakdown[criteria] = {
        totalChecks: 0,
        totalScore: 0,
        averageScore: 0
      };
    });
  }
  
  /**
   * Initialize default validation rules
   */
  initializeDefaultRules() {
    // Completeness rules
    this.addValidationRule(ValidationCriteria.COMPLETENESS, {
      name: 'task_completion', check: (work) => {
        return work.tasksCompleted === work.totalTasks;
      },
      weight: 0.5,
      message: 'All tasks must be completed'
    });
    
    this.addValidationRule(ValidationCriteria.COMPLETENESS, {
      name: 'required_outputs', check: (work) => {
        if (!work.requiredOutputs) {return true;}
        return work.requiredOutputs.every(output => 
          work.outputs && work.outputs.includes(output)
        );
      },
      weight: 0.5,
      message: 'All required outputs must be present'
    });
    
    // Correctness rules
    this.addValidationRule(ValidationCriteria.CORRECTNESS, {
      name: 'no_errors', check: (work) => {
        return !work.errors || work.errors.length === 0;
      },
      weight: 0.6,
      message: 'Work should have no errors'
    });
    
    this.addValidationRule(ValidationCriteria.CORRECTNESS, {
      name: 'tests_passing', check: (work) => {
        if (!work.tests) {return true;}
        return work.tests.failed === 0;
      },
      weight: 0.4,
      message: 'All tests should pass'
    });
    
    // Quality rules
    this.addValidationRule(ValidationCriteria.QUALITY, {
      name: 'code_quality', check: (work) => {
        if (!work.codeQuality) {return true;}
        return work.codeQuality.score >= 0.7;
      },
      weight: 0.5,
      message: 'Code quality score should be >= 70%'
    });
    
    this.addValidationRule(ValidationCriteria.QUALITY, {
      name: 'no_lint_errors', check: (work) => {
        if (!work.linting) {return true;}
        return work.linting.errors === 0;
      },
      weight: 0.5,
      message: 'No linting errors allowed'
    });
    
    // Performance rules
    this.addValidationRule(ValidationCriteria.PERFORMANCE, {
      name: 'execution_time', check: (work) => {
        if (!work.performance) {return true;}
        return work.performance.executionTime < work.performance.maxAllowedTime;
      },
      weight: 1.0,
      message: 'Execution time within limits'
    });
    
    // Security rules
    this.addValidationRule(ValidationCriteria.SECURITY, {
      name: 'no_vulnerabilities', check: (work) => {
        if (!work.security) {return true;}
        return work.security.vulnerabilities === 0;
      },
      weight: 1.0,
      message: 'No security vulnerabilities'
    });
    
    // Documentation rules
    this.addValidationRule(ValidationCriteria.DOCUMENTATION, {
      name: 'has_documentation', check: (work) => {
        return work.documentation && work.documentation.length > 0;
      },
      weight: 1.0,
      message: 'Documentation must be provided'
    });
    
    // Testing rules
    this.addValidationRule(ValidationCriteria.TESTING, {
      name: 'test_coverage', check: (work) => {
        if (!work.testCoverage) {return true;}
        return work.testCoverage >= 0.6;
      },
      weight: 1.0,
      message: 'Test coverage should be >= 60%'
    });
  }
  
  /**
   * Add validation rule
   */
  addValidationRule(criteria, rule) {
    if (!this.validationRules.has(criteria)) {
      this.validationRules.set(criteria, []);
    }
    
    this.validationRules.get(criteria).push(rule);
  }
  
  /**
   * Validate agent work
   */
  async validateWork(agentId, work, options = {}) {
    const validationId = this.generateValidationId();
    const startTime = Date.now();
    
    // Normalize context handling for consistency
    const context = {
      ...options,
      agentId,
      validationId,
      startTime,
      user: options.user || 'system',
      testMode: options.testMode || false,
      ...options.context
    };
    
    logger.info(`🟢 Starting validation ${validationId} for agent ${agentId}`);
    
    const validation = {
      id: validationId,
      agentId,
      work,
      status: ValidationStatus.IN_PROGRESS,
      startTime,
      options,
      context,
      scores: {},
      details: [],
      attempts: 0
    };
    
    this.validations.set(validationId, validation);
    
    try {
      // Perform automatic validation if enabled
      let autoValidationResult = null;
      if (this.config.autoValidation) {
        autoValidationResult = await this.performAutoValidation(validation);
      }
      
      // Perform manager validation if enabled and needed
      let managerValidationResult = null;
      if (this.config.managerValidation && this.needsManagerValidation(autoValidationResult)) {
        managerValidationResult = await this.performManagerValidation(validation);
      }
      
      // Combine results
      const finalResult = this.combineValidationResults(
        autoValidationResult,
        managerValidationResult
      );
      
      // Update validation record
      validation.status = finalResult.status;
      validation.score = finalResult.score;
      validation.scores = finalResult.scores;
      validation.details = finalResult.details;
      validation.endTime = Date.now();
      validation.duration = validation.endTime - startTime;
      
      // Update statistics
      this.updateStatistics(validation);
      
      // Store in history
      this.validationHistory.push({
        ...validation,
        timestamp: Date.now()
      });
      
      // Emit validation complete event
      this.emit('validation:complete', {
        validationId,
        agentId,
        result: finalResult
      });
      
      logger.info(`🏁 Validation ${validationId} complete: ${finalResult.status} (score: ${(finalResult.score * 100).toFixed(1)}%)`);
      
      return finalResult;
      
    } catch (error) {
      logger.error(`🔴 Validation ${validationId} failed: ${error.message}`);
      
      validation.status = ValidationStatus.FAILED;
      validation.error = error.message;
      validation.endTime = Date.now();
      
      throw error;
    }
  }
  
  /**
   * Perform automatic validation
   */
  async performAutoValidation(validation) {
    logger.info(`🟢 Performing automatic validation for ${validation.agentId}`);
    
    const result = {
      type: 'automatic',
      status: ValidationStatus.PENDING,
      score: 0,
      scores: {},
      details: []
    };
    
    // Check each criteria
    for (const [criteria, weight] of Object.entries(this.config.criteriaWeights)) {
      const criteriaResult = await this.validateCriteria(criteria, validation.work);
      
      result.scores[criteria] = criteriaResult.score;
      result.details.push(...criteriaResult.details);
      
      // Weight the score
      result.score += criteriaResult.score * weight;
    }
    
    // Determine status based on score
    if (result.score >= this.config.passingThreshold) {
      result.status = ValidationStatus.PASSED;
    } else if (result.score >= this.config.passingThreshold * 0.7) {
      result.status = ValidationStatus.PARTIAL;
    } else {
      result.status = ValidationStatus.FAILED;
    }
    
    return result;
  }
  
  /**
   * Validate specific criteria
   */
  async validateCriteria(criteria, work) {
    const rules = this.validationRules.get(criteria) || [];
    const result = {
      criteria,
      score: 0,
      details: []
    };
    
    if (rules.length === 0) {
      result.score = 1.0; // No rules = pass
      return result;
    }
    
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const rule of rules) {
      try {
        const passed = await rule.check(work);
        const ruleScore = passed ? 1.0 : 0.0;
        
        weightedScore += ruleScore * rule.weight;
        totalWeight += rule.weight;
        
        result.details.push({
          rule: rule.name,
          passed,
          message: rule.message,
          score: ruleScore
        });
      } catch (error) {
        logger.warn(`Rule ${rule.name} failed: ${error.message}`);
        result.details.push({
          rule: rule.name,
          passed: false,
          message: `Rule error: ${error.message}`,
          score: 0
        });
      }
    }
    
    result.score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    return result;
  }
  
  /**
   * Perform manager validation
   */
  async performManagerValidation(validation) {
    logger.info(`🟢 Requesting manager validation for ${validation.agentId}`);
    
    // Request Claude Max for manager validation
    const hasLock = await this.claudeMaxManager.acquireLock(
      `validation-${validation.id}`,
      'manager',
      2 // High priority
    );
    
    if (!hasLock) {
      logger.warn('🟡 Could not acquire Claude Max for manager validation');
      return null;
    }
    
    try {
      const result = {
        type: 'manager',
        status: ValidationStatus.PENDING,
        score: 0,
        scores: {},
        details: [],
        managerFeedback: ''
      };
      
      // Simulate manager review (in reality, this would call Claude Max API)
      const managerReview = await this.simulateManagerReview(validation);
      
      result.status = managerReview.approved ? 
        ValidationStatus.PASSED : 
        ValidationStatus.NEEDS_REVISION;
      
      result.score = managerReview.score;
      result.scores = managerReview.scores;
      result.details = managerReview.details;
      result.managerFeedback = managerReview.feedback;
      
      return result;
      
    } finally {
      // Release Claude Max lock
      await this.claudeMaxManager.releaseLock(`validation-${validation.id}`);
    }
  }
  
  /**
   * Simulate manager review (placeholder for actual Claude Max integration)
   */
  async simulateManagerReview(validation) {
    // In a real implementation, this would:
    // 1. Send work details to Claude Max
    // 2. Get intelligent review and scoring
    // 3. Return structured feedback
    
    return {
      approved: Math.random() > 0.2, // 80% approval rate
      score: 0.75 + Math.random() * 0.25, // 75-100% score
      scores: {
        [ValidationCriteria.COMPLETENESS]: 0.9,
        [ValidationCriteria.CORRECTNESS]: 0.85,
        [ValidationCriteria.QUALITY]: 0.8
      },
      details: [
        {
          aspect: 'overall',
          feedback: 'Work meets requirements with minor improvements needed',
          score: 0.85
        }
      ],
      feedback: 'Manager review complete. Work is acceptable for deprecation.'
    };
  }
  
  /**
   * Check if manager validation is needed
   */
  needsManagerValidation(autoResult) {
    if (!autoResult) {return true;}
    
    // Always validate if failed
    if (autoResult.status === ValidationStatus.FAILED) {return true;}
    
    // Validate partial results
    if (autoResult.status === ValidationStatus.PARTIAL) {return true;}
    
    // Validate if score is borderline
    if (autoResult.score < this.config.passingThreshold * 1.1) {return true;}
    
    // Random sampling for quality assurance
    if (Math.random() < 0.1) {return true;} // 10% random validation
    
    return false;
  }
  
  /**
   * Combine validation results
   */
  combineValidationResults(autoResult, managerResult) {
    // If only auto validation
    if (!managerResult) {
      return autoResult || {
        status: ValidationStatus.FAILED,
        score: 0,
        scores: {},
        details: []
      };
    }
    
    // If only manager validation
    if (!autoResult) {
      return managerResult;
    }
    
    // Combine both with manager having higher weight
    const combined = {
      type: 'combined',
      status: managerResult.status, // Manager decision is final
      score: (autoResult.score * 0.3 + managerResult.score * 0.7), // 70% manager weight
      scores: {},
      details: [...autoResult.details, ...managerResult.details]
    };
    
    // Combine criteria scores
    for (const criteria of Object.values(ValidationCriteria)) {
      const autoScore = autoResult.scores[criteria] || 0;
      const managerScore = managerResult.scores[criteria] || autoScore;
      combined.scores[criteria] = (autoScore * 0.3 + managerScore * 0.7);
    }
    
    return combined;
  }
  
  /**
   * Request revision
   */
  async requestRevision(validationId, feedback) {
    const validation = this.validations.get(validationId);
    
    if (!validation) {
      throw new Error(`Validation ${validationId} not found`);
    }
    
    validation.status = ValidationStatus.NEEDS_REVISION;
    validation.revisionRequested = Date.now();
    validation.revisionFeedback = feedback;
    
    this.emit('revision:requested', {
      validationId,
      agentId: validation.agentId,
      feedback
    });
    
    logger.info(`🟢 Revision requested for validation ${validationId}`);
    
    return validation;
  }
  
  /**
   * Retry validation
   */
  async retryValidation(validationId) {
    const validation = this.validations.get(validationId);
    
    if (!validation) {
      throw new Error(`Validation ${validationId} not found`);
    }
    
    if (validation.attempts >= this.config.maxRetries) {
      throw new Error(`Max retries (${this.config.maxRetries}) exceeded`);
    }
    
    validation.attempts++;
    validation.status = ValidationStatus.IN_PROGRESS;
    
    logger.info(`🟢 Retrying validation ${validationId} (attempt ${validation.attempts})`);
    
    return this.validateWork(validation.agentId, validation.work, validation.options);
  }
  
  /**
   * Update statistics
   */
  updateStatistics(validation) {
    this.stats.totalValidations++;
    
    // Update status counts
    switch (validation.status) {
      case ValidationStatus.PASSED:
        this.stats.passedValidations++;
        break;
      case ValidationStatus.FAILED:
        this.stats.failedValidations++;
        break;
      case ValidationStatus.PARTIAL:
        this.stats.partialValidations++;
        break;
    }
    
    // Update average validation time
    const totalTime = this.stats.averageValidationTime * (this.stats.totalValidations - 1);
    this.stats.averageValidationTime = (totalTime + validation.duration) / this.stats.totalValidations;
    
    // Update average score
    const totalScore = this.stats.averageScore * (this.stats.totalValidations - 1);
    this.stats.averageScore = (totalScore + (validation.score || 0)) / this.stats.totalValidations;
    
    // Update criteria breakdown
    if (validation.scores) {
      for (const [criteria, score] of Object.entries(validation.scores)) {
        const criteriaStats = this.stats.criteriaBreakdown[criteria];
        if (criteriaStats) {
          criteriaStats.totalChecks++;
          criteriaStats.totalScore += score;
          criteriaStats.averageScore = criteriaStats.totalScore / criteriaStats.totalChecks;
        }
      }
    }
  }
  
  /**
   * Generate validation ID
   */
  generateValidationId() {
    return `val-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get validation status
   */
  getValidation(validationId) {
    return this.validations.get(validationId);
  }
  
  /**
   * Get validations for agent
   */
  getAgentValidations(agentId) {
    const validations = [];
    
    for (const [id, validation] of this.validations) {
      if (validation.agentId === agentId) {
        validations.push({ id, ...validation });
      }
    }
    
    return validations;
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      successRate: this.stats.totalValidations > 0 ?
        (this.stats.passedValidations / this.stats.totalValidations * 100).toFixed(1) + '%' :
        '0%',
      activeValidations: Array.from(this.validations.values())
        .filter(v => v.status === ValidationStatus.IN_PROGRESS).length
    };
  }
  
  /**
   * Get validation history
   */
  getHistory(limit = 100) {
    return this.validationHistory.slice(-limit);
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    const size = this.validationHistory.length;
    this.validationHistory = [];
    logger.info(`🟢️ Cleared validation history (${size} entries)`);
  }
}

// Export
module.exports = {
  AgentWorkValidationFramework,
  ValidationStatus,
  ValidationCriteria
};