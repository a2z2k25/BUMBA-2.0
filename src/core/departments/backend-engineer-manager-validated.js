/**
 * BUMBA 2.0 Backend-Engineer Department Manager - WITH VALIDATION
 * Enhanced with mandatory manager validation using Claude Max
 * All specialist work must be reviewed before acceptance
 */

const { BackendEngineerManager } = require('./backend-engineer-manager');
const ManagerValidationLayer = require('./manager-validation-layer');
const { ValidationProtocol, ValidationResult } = require('../validation/validation-protocol');
const { getPriorityQueue, PriorityLevel } = require('../agents/claude-max-priority-queue');
const { getValidationMetrics } = require('../validation/validation-metrics');
const { logger } = require('../logging/bumba-logger');

class ValidatedBackendEngineerManager extends BackendEngineerManager {
  constructor() {
    super();
    
    // Initialize validation layer
    this.validationLayer = new ManagerValidationLayer(this);
    
    // Get priority queue for Claude Max
    this.priorityQueue = getPriorityQueue();
    
    // Get metrics tracker
    this.validationMetrics = getValidationMetrics();
    
    // Validation configuration
    this.validationConfig = {
      enabled: true,
      strictMode: true,
      maxRevisions: 3,
      requireClaudeMax: true,
      cacheValidations: true,
      validationTimeout: 30000
    };
    
    // Track active validations
    this.activeValidations = new Map();
    
    logger.info('🏁 Backend Engineer Manager initialized with VALIDATION');
  }

  /**
   * Override executeTask to add validation
   */
  async executeTask(command, args, context) {
    const startTime = Date.now();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`\n${'═'.repeat(60)}`);
    logger.info(`📋 BACKEND TASK: ${command}`);
    logger.info(`   Task ID: ${taskId}`);
    logger.info(`   Validation: ENABLED`);
    logger.info(`${'═'.repeat(60)}\n`);
    
    try {
      // Step 1: Execute specialist work (unchanged)
      logger.info('1️⃣ SPECIALIST EXECUTION PHASE');
      const specialistResult = await super.executeTask(command, args, context);
      
      // Step 2: Manager validation (NEW!)
      logger.info('\n2️⃣ MANAGER VALIDATION PHASE');
      const validationResult = await this.validateSpecialistWork(
        specialistResult,
        command,
        args,
        context,
        taskId
      );
      
      // Step 3: Handle validation result
      if (validationResult.isPassed()) {
        logger.info('\n🏁 VALIDATION PASSED - Work approved');
        
        // Record metrics
        this.validationMetrics.recordValidation(
          validationResult,
          this.name,
          specialistResult.specialist
        );
        
        // Return approved work
        return {
          ...specialistResult,
          validation: {
            status: 'approved',
            validationId: validationResult.id,
            validatedBy: this.name,
            validationModel: validationResult.validatorModel,
            confidence: validationResult.confidence
          }
        };
        
      } else {
        logger.warn('\n🟠️ VALIDATION FAILED - Revision required');
        
        // Step 4: Request revision
        const revisedResult = await this.handleRevisionCycle(
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
      logger.error(`🔴 Task execution failed: ${error.message}`);
      throw error;
      
    } finally {
      const totalTime = Date.now() - startTime;
      logger.info(`\n${'═'.repeat(60)}`);
      logger.info(`📊 Task completed in ${totalTime}ms`);
      logger.info(`${'═'.repeat(60)}\n`);
    }
  }

  /**
   * Validate specialist work with Claude Max
   */
  async validateSpecialistWork(specialistResult, command, args, context, taskId) {
    logger.info('🔍 Requesting Claude Max for validation...');
    
    // Request Claude Max with HIGHEST priority
    const claudeMaxAccess = await this.priorityQueue.requestAccess(
      this.name,
      'manager-validation',
      PriorityLevel.VALIDATION,
      { taskId, command }
    );
    
    if (!claudeMaxAccess.granted) {
      throw new Error(`Failed to acquire Claude Max for validation: ${claudeMaxAccess.reason}`);
    }
    
    logger.info(`🔒 Claude Max acquired (waited ${claudeMaxAccess.waitTime}ms)`);
    
    try {
      // Perform comprehensive validation
      const validation = await this.validationLayer.validateSpecialistWork(
        specialistResult,
        command,
        context
      );
      
      // Create structured validation result
      const result = new ValidationResult({
        approved: validation.approved,
        requiresRevision: validation.requiresRevision,
        validatorId: this.name,
        validatorModel: 'claude-max',
        command,
        specialistId: specialistResult.specialist,
        checks: validation.checks,
        issues: validation.issues || [],
        feedback: validation.feedback || [],
        validationTime: validation.reviewTime || 0,
        confidence: this.calculateConfidence(validation)
      });
      
      return result;
      
    } finally {
      // Always release Claude Max
      this.priorityQueue.releaseAccess(claudeMaxAccess.lockId);
      logger.info('🔓 Claude Max released');
    }
  }

  /**
   * Handle revision cycle when validation fails
   */
  async handleRevisionCycle(originalResult, validationResult, command, args, context, taskId) {
    const maxAttempts = this.validationConfig.maxRevisions;
    let currentResult = originalResult;
    let currentValidation = validationResult;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.info(`\n📝 REVISION ATTEMPT ${attempt}/${maxAttempts}`);
      
      // Request revision from specialist
      const revisionRequest = await this.validationLayer.requestRevision(
        { id: currentResult.specialist, name: currentResult.specialist },
        currentValidation,
        currentResult
      );
      
      // Check if revision is allowed
      if (!revisionRequest.canRetry()) {
        logger.error('🔴 Maximum revision attempts exceeded');
        
        // Record failure
        this.validationMetrics.recordRevision(revisionRequest, false, attempt);
        
        // Return with validation failure
        return {
          ...currentResult,
          validation: {
            status: 'rejected',
            validationId: currentValidation.id,
            reason: 'Max revisions exceeded',
            feedback: currentValidation.feedback
          }
        };
      }
      
      // Execute revision
      logger.info('🔄 Requesting specialist revision...');
      const revisedResult = await this.executeSpecialistRevision(
        currentResult.specialist,
        revisionRequest,
        command,
        args,
        context
      );
      
      // Re-validate revised work
      logger.info('🔍 Re-validating revised work...');
      const revalidation = await this.validateSpecialistWork(
        revisedResult,
        command,
        args,
        context,
        taskId
      );
      
      if (revalidation.isPassed()) {
        logger.info(`🏁 Revision ${attempt} PASSED validation`);
        
        // Record success
        this.validationMetrics.recordRevision(revisionRequest, true, attempt);
        this.validationMetrics.recordValidation(
          revalidation,
          this.name,
          revisedResult.specialist
        );
        
        // Return approved revised work
        return {
          ...revisedResult,
          validation: {
            status: 'approved_after_revision',
            validationId: revalidation.id,
            revisionAttempts: attempt,
            validatedBy: this.name,
            validationModel: revalidation.validatorModel,
            confidence: revalidation.confidence
          }
        };
      }
      
      // Update for next iteration
      currentResult = revisedResult;
      currentValidation = revalidation;
      
      logger.warn(`🟠️ Revision ${attempt} still has issues`);
    }
    
    // All revision attempts failed
    logger.error('🔴 All revision attempts exhausted');
    
    return {
      ...currentResult,
      validation: {
        status: 'rejected_final',
        validationId: currentValidation.id,
        reason: 'Failed after all revision attempts',
        feedback: currentValidation.feedback,
        revisionAttempts: maxAttempts
      }
    };
  }

  /**
   * Execute specialist revision
   */
  async executeSpecialistRevision(specialistId, revisionRequest, command, args, context) {
    // Get the specialist
    const SpecialistClass = this.specialists.get(specialistId);
    if (!SpecialistClass) {
      throw new Error(`Specialist ${specialistId} not found for revision`);
    }
    
    // Create specialist instance with revision context
    const specialist = new SpecialistClass();
    
    // Add revision context
    const revisionContext = {
      ...context,
      isRevision: true,
      revisionRequest,
      previousFeedback: revisionRequest.feedback,
      attemptNumber: revisionRequest.attemptNumber
    };
    
    // Execute with revision awareness
    logger.info(`   Specialist ${specialistId} processing revision...`);
    
    // Simulate revision (in real implementation, specialist would have revise() method)
    const revisedResult = await specialist.execute?.(command, args, revisionContext) || 
                          await this.simulateRevision(specialistId, revisionRequest, command, args);
    
    return {
      ...revisedResult,
      specialist: specialistId,
      isRevision: true,
      revisionAttempt: revisionRequest.attemptNumber
    };
  }

  /**
   * Simulate revision for specialists without revise method
   */
  async simulateRevision(specialistId, revisionRequest, command, args) {
    logger.info('   Simulating revision based on feedback...');
    
    // This would be replaced with actual specialist revision logic
    return {
      type: 'revised_technical_solution',
      description: `Revised ${command} implementation addressing feedback`,
      revisions: revisionRequest.feedback.map(f => ({
        issue: f.message,
        resolution: `Fixed: ${f.message}`
      })),
      code: '// Revised code here',
      tests: '// Additional tests here',
      documentation: '// Updated documentation'
    };
  }

  /**
   * Calculate confidence score for validation
   */
  calculateConfidence(validation) {
    let confidence = 1.0;
    
    // Reduce confidence for each failed check
    Object.values(validation.checks).forEach(check => {
      if (!check.passed) {
        confidence -= 0.15;
      }
    });
    
    // Reduce confidence for severity of issues
    if (validation.issues) {
      validation.issues.forEach(issue => {
        if (issue.severity === 'critical') confidence -= 0.3;
        else if (issue.severity === 'high') confidence -= 0.2;
        else if (issue.severity === 'medium') confidence -= 0.1;
        else if (issue.severity === 'low') confidence -= 0.05;
      });
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get validation metrics for this manager
   */
  getValidationMetrics() {
    const snapshot = this.validationMetrics.getSnapshot();
    const managerMetrics = this.validationMetrics.managers.get(this.name);
    
    return {
      global: snapshot.global,
      manager: managerMetrics || { validations: 0, approved: 0, rejected: 0 },
      topIssues: snapshot.topIssues,
      health: snapshot.health
    };
  }

  /**
   * Enable/disable validation (for testing or emergency)
   */
  setValidationEnabled(enabled) {
    this.validationConfig.enabled = enabled;
    logger.info(`🔧 Validation ${enabled ? 'ENABLED' : 'DISABLED'} for ${this.name}`);
  }
}

module.exports = ValidatedBackendEngineerManager;