/**
 * Decision Validator
 * Validates decisions against policies, constraints, and best practices
 */

const { logger } = require('../logging/bumba-logger');

class DecisionValidator {
  constructor(config = {}) {
    this.config = {
      enablePolicyValidation: true,
      enableConstraintChecking: true,
      enableComplianceValidation: true,
      strictMode: false,
      ...config
    };
    
    this.policies = new Map();
    this.constraints = new Map();
    this.validationRules = new Map();
    
    this.initializeDefaultPolicies();
    
    logger.info('🏁 Decision Validator initialized');
  }

  initializeDefaultPolicies() {
    // Budget policy
    this.policies.set('budget', {
      name: 'Budget Constraint',
      validate: (decision) => {
        if (!decision.budget) return { valid: true };
        return {
          valid: decision.budget <= 1000000,
          reason: 'Budget exceeds maximum allowed'
        };
      }
    });
    
    // Risk policy
    this.policies.set('risk', {
      name: 'Risk Tolerance',
      validate: (decision) => {
        if (!decision.riskLevel) return { valid: true };
        return {
          valid: decision.riskLevel <= 0.7,
          reason: 'Risk level exceeds tolerance'
        };
      }
    });
    
    // Compliance policy
    this.policies.set('compliance', {
      name: 'Regulatory Compliance',
      validate: (decision) => {
        return {
          valid: decision.compliant !== false,
          reason: 'Decision violates compliance requirements'
        };
      }
    });
  }

  async validate(decision) {
    const results = {
      valid: true,
      violations: [],
      warnings: [],
      score: 100
    };
    
    // Validate against policies
    if (this.config.enablePolicyValidation) {
      const policyResults = await this.validatePolicies(decision);
      results.violations.push(...policyResults.violations);
      results.warnings.push(...policyResults.warnings);
      results.score -= policyResults.violations.length * 20;
    }
    
    // Check constraints
    if (this.config.enableConstraintChecking) {
      const constraintResults = await this.checkConstraints(decision);
      results.violations.push(...constraintResults.violations);
      results.score -= constraintResults.violations.length * 15;
    }
    
    // Validate compliance
    if (this.config.enableComplianceValidation) {
      const complianceResults = await this.validateCompliance(decision);
      results.violations.push(...complianceResults.violations);
      results.score -= complianceResults.violations.length * 25;
    }
    
    // Determine overall validity
    results.valid = results.violations.length === 0 || 
                   (!this.config.strictMode && results.score >= 50);
    
    return results;
  }

  async validatePolicies(decision) {
    const results = { violations: [], warnings: [] };
    
    for (const [policyId, policy] of this.policies) {
      const validation = policy.validate(decision);
      if (!validation.valid) {
        if (policy.severity === 'warning') {
          results.warnings.push({
            policy: policy.name,
            reason: validation.reason
          });
        } else {
          results.violations.push({
            policy: policy.name,
            reason: validation.reason
          });
        }
      }
    }
    
    return results;
  }

  async checkConstraints(decision) {
    const results = { violations: [] };
    
    // Check timeline constraints
    if (decision.timeline) {
      if (decision.timeline.end < Date.now()) {
        results.violations.push({
          constraint: 'Timeline',
          reason: 'End date is in the past'
        });
      }
    }
    
    // Check resource constraints
    if (decision.resources) {
      if (decision.resources.required > decision.resources.available) {
        results.violations.push({
          constraint: 'Resources',
          reason: 'Insufficient resources available'
        });
      }
    }
    
    return results;
  }

  async validateCompliance(decision) {
    const results = { violations: [] };
    
    // Check for required approvals
    if (decision.requiresApproval && !decision.approved) {
      results.violations.push({
        compliance: 'Approval',
        reason: 'Required approval not obtained'
      });
    }
    
    // Check for audit requirements
    if (decision.requiresAudit && !decision.auditTrail) {
      results.violations.push({
        compliance: 'Audit',
        reason: 'Audit trail not established'
      });
    }
    
    return results;
  }

  addPolicy(id, policy) {
    this.policies.set(id, policy);
    logger.info(`Policy added: ${id}`);
  }

  addConstraint(id, constraint) {
    this.constraints.set(id, constraint);
    logger.info(`Constraint added: ${id}`);
  }

  getStats() {
    return {
      policies: this.policies.size,
      constraints: this.constraints.size,
      rules: this.validationRules.size
    };
  }
}

module.exports = DecisionValidator;