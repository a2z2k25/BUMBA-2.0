/**
 * Validation Framework for Chameleon Managers
 * Multi-level validation system with progressive depth
 */

const { logger } = require('../logging/bumba-logger');

class ValidationFramework {
  constructor(config = {}) {
    this.config = {
      defaultDepth: config.defaultDepth || 'L2',
      timeoutMs: config.timeoutMs || 10000,
      enableMetrics: config.enableMetrics !== false
    };
    
    // Initialize validation levels
    this.validators = {
      L1: new SyntaxValidator(),
      L2: new LogicValidator(),
      L3: new ArchitectureValidator()
    };
    
    // Metrics tracking
    this.metrics = {
      totalValidations: 0,
      validationsByLevel: { L1: 0, L2: 0, L3: 0 },
      errorsFound: 0,
      warningsFound: 0,
      avgConfidence: 0
    };
  }
  
  /**
   * Main validation entry point
   */
  async validate(work, expertise, options = {}) {
    const startTime = Date.now();
    const depth = options.depth || this.config.defaultDepth;
    
    try {
      logger.info(`🔍 Starting ${depth} validation for ${options.specialist || 'work'}`);
      
      // Select appropriate validator
      const validator = this.validators[depth];
      if (!validator) {
        throw new Error(`Invalid validation depth: ${depth}`);
      }
      
      // Perform validation with timeout
      const validationPromise = validator.validate(work, expertise, options);
      const timeoutPromise = this.createTimeout(this.config.timeoutMs);
      
      const result = await Promise.race([validationPromise, timeoutPromise]);
      
      if (result.timeout) {
        logger.warn(`⏱️ Validation timeout after ${this.config.timeoutMs}ms`);
        return this.createTimeoutResult();
      }
      
      // Enhance result with metadata
      const enhancedResult = this.enhanceResult(result, {
        depth,
        duration: Date.now() - startTime,
        expertise: expertise.type,
        manager: options.manager
      });
      
      // Update metrics
      this.updateMetrics(enhancedResult, depth);
      
      // Log summary
      this.logValidationSummary(enhancedResult);
      
      return enhancedResult;
      
    } catch (error) {
      logger.error(`❌ Validation error:`, error);
      return this.createErrorResult(error);
    }
  }
  
  /**
   * Enhance validation result with metadata
   */
  enhanceResult(result, metadata) {
    return {
      ...result,
      metadata,
      summary: {
        passed: result.passed,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0,
        suggestionCount: result.suggestions?.length || 0,
        confidence: result.confidence || 0
      },
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Update metrics
   */
  updateMetrics(result, depth) {
    if (!this.config.enableMetrics) return;
    
    this.metrics.totalValidations++;
    this.metrics.validationsByLevel[depth]++;
    this.metrics.errorsFound += result.summary.errorCount;
    this.metrics.warningsFound += result.summary.warningCount;
    
    // Update rolling average confidence
    const count = this.metrics.totalValidations;
    this.metrics.avgConfidence = 
      (this.metrics.avgConfidence * (count - 1) + result.confidence) / count;
  }
  
  /**
   * Log validation summary
   */
  logValidationSummary(result) {
    const { passed, errorCount, warningCount } = result.summary;
    
    if (passed) {
      logger.info(`✅ Validation passed (${result.metadata.depth}) in ${result.metadata.duration}ms`);
    } else {
      logger.warn(`⚠️ Validation failed: ${errorCount} errors, ${warningCount} warnings`);
    }
  }
  
  /**
   * Create timeout promise
   */
  createTimeout(ms) {
    return new Promise(resolve => {
      setTimeout(() => resolve({ timeout: true }), ms);
    });
  }
  
  /**
   * Create timeout result
   */
  createTimeoutResult() {
    return {
      passed: false,
      errors: ['Validation timeout - unable to complete analysis'],
      warnings: ['Consider using a lower validation depth for faster results'],
      suggestions: [],
      confidence: 0.1,
      timeout: true
    };
  }
  
  /**
   * Create error result
   */
  createErrorResult(error) {
    return {
      passed: false,
      errors: [`Validation system error: ${error.message}`],
      warnings: [],
      suggestions: ['Please retry validation or contact support'],
      confidence: 0,
      systemError: true
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * Level 1: Syntax Validator
 * Fast, basic validation focusing on syntax and structure
 */
class SyntaxValidator {
  async validate(work, expertise, options) {
    logger.debug('🔤 Running L1 syntax validation');
    
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    try {
      // Check basic syntax based on work type
      if (work.code) {
        const syntaxIssues = await this.checkSyntax(work.code, expertise);
        errors.push(...syntaxIssues.errors);
        warnings.push(...syntaxIssues.warnings);
      }
      
      // Check structure
      if (work.structure) {
        const structureIssues = this.checkStructure(work.structure, expertise);
        errors.push(...structureIssues.errors);
        warnings.push(...structureIssues.warnings);
      }
      
      // Check naming conventions
      if (expertise.namingConventions) {
        const namingIssues = this.checkNaming(work, expertise.namingConventions);
        warnings.push(...namingIssues);
      }
      
      // Basic type checking if applicable
      if (expertise.capabilities?.includes('type-checking')) {
        const typeIssues = this.checkTypes(work, expertise);
        errors.push(...typeIssues.errors);
        warnings.push(...typeIssues.warnings);
      }
      
      return {
        passed: errors.length === 0,
        errors,
        warnings,
        suggestions,
        confidence: 0.7, // L1 has moderate confidence
        level: 'L1'
      };
      
    } catch (error) {
      logger.error('L1 validation error:', error);
      return {
        passed: false,
        errors: [`Syntax validation failed: ${error.message}`],
        warnings,
        suggestions,
        confidence: 0.3
      };
    }
  }
  
  checkSyntax(code, expertise) {
    const errors = [];
    const warnings = [];
    
    // Domain-specific syntax checks
    if (expertise.domain === 'Python') {
      // Check for Python-specific syntax issues
      if (code.includes('def ') && code.includes('=[]')) {
        errors.push('Mutable default argument detected - use None and initialize in function');
      }
      if (code.match(/except\s*:/)) {
        warnings.push('Bare except clause - specify exception type');
      }
    } else if (expertise.domain === 'JavaScript') {
      // Check for JavaScript issues
      if (code.includes('var ')) {
        warnings.push('Use of var - prefer const or let');
      }
      if (code.includes('==') && !code.includes('===')) {
        warnings.push('Use of == instead of === - may cause type coercion issues');
      }
    }
    
    return { errors, warnings };
  }
  
  checkStructure(structure, expertise) {
    const errors = [];
    const warnings = [];
    
    // Check for structural issues
    if (!structure.entryPoint) {
      errors.push('Missing entry point definition');
    }
    
    if (structure.dependencies?.circular) {
      errors.push('Circular dependencies detected');
    }
    
    return { errors, warnings };
  }
  
  checkNaming(work, conventions) {
    const warnings = [];
    
    // Check naming conventions
    if (work.identifiers) {
      work.identifiers.forEach(id => {
        if (conventions.camelCase && !this.isCamelCase(id)) {
          warnings.push(`Identifier '${id}' does not follow camelCase convention`);
        }
        if (conventions.snakeCase && !this.isSnakeCase(id)) {
          warnings.push(`Identifier '${id}' does not follow snake_case convention`);
        }
      });
    }
    
    return warnings;
  }
  
  checkTypes(work, expertise) {
    const errors = [];
    const warnings = [];
    
    // Basic type checking
    if (work.types) {
      work.types.forEach(type => {
        if (type.expected !== type.actual) {
          errors.push(`Type mismatch: expected ${type.expected}, got ${type.actual}`);
        }
      });
    }
    
    return { errors, warnings };
  }
  
  isCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }
  
  isSnakeCase(str) {
    return /^[a-z][a-z0-9_]*$/.test(str);
  }
}

/**
 * Level 2: Logic Validator
 * Medium depth validation focusing on logic and patterns
 */
class LogicValidator {
  async validate(work, expertise, options) {
    logger.debug('🧩 Running L2 logic validation');
    
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    try {
      // First run L1 validation
      const syntaxValidator = new SyntaxValidator();
      const syntaxResult = await syntaxValidator.validate(work, expertise, options);
      errors.push(...syntaxResult.errors);
      warnings.push(...syntaxResult.warnings);
      
      // Check business logic
      const logicIssues = await this.checkBusinessLogic(work, expertise);
      errors.push(...logicIssues.errors);
      warnings.push(...logicIssues.warnings);
      suggestions.push(...logicIssues.suggestions);
      
      // Check patterns and anti-patterns
      const patternIssues = this.checkPatterns(work, expertise);
      errors.push(...patternIssues.errors);
      warnings.push(...patternIssues.warnings);
      suggestions.push(...patternIssues.suggestions);
      
      // Check error handling
      const errorHandling = this.checkErrorHandling(work, expertise);
      errors.push(...errorHandling.errors);
      warnings.push(...errorHandling.warnings);
      
      // Check for common issues specific to domain
      if (expertise.commonIssues) {
        const commonIssues = this.checkCommonIssues(work, expertise.commonIssues);
        warnings.push(...commonIssues);
      }
      
      return {
        passed: errors.length === 0,
        errors,
        warnings,
        suggestions,
        confidence: 0.8, // L2 has good confidence
        level: 'L2'
      };
      
    } catch (error) {
      logger.error('L2 validation error:', error);
      return {
        passed: false,
        errors: [`Logic validation failed: ${error.message}`],
        warnings,
        suggestions,
        confidence: 0.4
      };
    }
  }
  
  async checkBusinessLogic(work, expertise) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    // Check for logical errors
    if (work.logic) {
      // Check for infinite loops
      if (work.logic.loops) {
        work.logic.loops.forEach(loop => {
          if (!loop.terminationCondition) {
            errors.push(`Potential infinite loop detected: ${loop.description}`);
          }
        });
      }
      
      // Check for race conditions
      if (work.logic.async && expertise.validationFocus?.includes('async-safety')) {
        if (work.logic.sharedState && !work.logic.synchronization) {
          errors.push('Potential race condition: shared state without synchronization');
        }
      }
      
      // Check for null/undefined handling
      if (work.logic.nullChecks === false) {
        warnings.push('Missing null/undefined checks in critical paths');
      }
    }
    
    return { errors, warnings, suggestions };
  }
  
  checkPatterns(work, expertise) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    // Check for anti-patterns
    if (expertise.domain === 'React') {
      if (work.patterns?.includes('direct-state-mutation')) {
        errors.push('Direct state mutation detected - use setState or hooks');
      }
      if (work.patterns?.includes('missing-keys')) {
        errors.push('Missing key props in list rendering');
      }
    }
    
    // Check for recommended patterns
    if (expertise.bestPractices) {
      expertise.bestPractices.forEach(practice => {
        if (work.missingPractices?.includes(practice)) {
          suggestions.push(`Consider implementing: ${practice}`);
        }
      });
    }
    
    return { errors, warnings, suggestions };
  }
  
  checkErrorHandling(work, expertise) {
    const errors = [];
    const warnings = [];
    
    if (work.errorHandling) {
      // Check for unhandled errors
      if (work.errorHandling.unhandled?.length > 0) {
        errors.push(`Unhandled errors: ${work.errorHandling.unhandled.join(', ')}`);
      }
      
      // Check for generic error handling
      if (work.errorHandling.generic) {
        warnings.push('Generic error handling detected - be more specific');
      }
      
      // Check for error logging
      if (!work.errorHandling.logging) {
        warnings.push('Missing error logging');
      }
    }
    
    return { errors, warnings };
  }
  
  checkCommonIssues(work, commonIssues) {
    const warnings = [];
    
    commonIssues.forEach(issue => {
      if (work.detectedIssues?.includes(issue)) {
        warnings.push(`Common issue detected: ${issue}`);
      }
    });
    
    return warnings;
  }
}

/**
 * Level 3: Architecture Validator
 * Deep validation focusing on architecture and best practices
 */
class ArchitectureValidator {
  async validate(work, expertise, options) {
    logger.debug('🏗️ Running L3 architecture validation');
    
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    try {
      // Run L2 validation first
      const logicValidator = new LogicValidator();
      const logicResult = await logicValidator.validate(work, expertise, options);
      errors.push(...logicResult.errors);
      warnings.push(...logicResult.warnings);
      suggestions.push(...logicResult.suggestions);
      
      // Check architecture patterns
      const archIssues = await this.checkArchitecture(work, expertise);
      errors.push(...archIssues.errors);
      warnings.push(...archIssues.warnings);
      suggestions.push(...archIssues.suggestions);
      
      // Check scalability
      const scaleIssues = this.checkScalability(work, expertise);
      warnings.push(...scaleIssues.warnings);
      suggestions.push(...scaleIssues.suggestions);
      
      // Check security architecture
      const securityIssues = this.checkSecurity(work, expertise);
      errors.push(...securityIssues.errors);
      warnings.push(...securityIssues.warnings);
      
      // Check performance implications
      const perfIssues = this.checkPerformance(work, expertise);
      warnings.push(...perfIssues.warnings);
      suggestions.push(...perfIssues.suggestions);
      
      // Check maintainability
      const maintainability = this.checkMaintainability(work, expertise);
      warnings.push(...maintainability.warnings);
      suggestions.push(...maintainability.suggestions);
      
      return {
        passed: errors.length === 0,
        errors,
        warnings,
        suggestions,
        confidence: 0.9, // L3 has high confidence
        level: 'L3'
      };
      
    } catch (error) {
      logger.error('L3 validation error:', error);
      return {
        passed: false,
        errors: [`Architecture validation failed: ${error.message}`],
        warnings,
        suggestions,
        confidence: 0.5
      };
    }
  }
  
  async checkArchitecture(work, expertise) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    // Check for architectural violations
    if (work.architecture) {
      // Check coupling
      if (work.architecture.coupling === 'high') {
        warnings.push('High coupling detected - consider dependency injection');
        suggestions.push('Refactor to reduce coupling between components');
      }
      
      // Check cohesion
      if (work.architecture.cohesion === 'low') {
        warnings.push('Low cohesion detected - consider splitting responsibilities');
      }
      
      // Check for proper layering
      if (work.architecture.layerViolations) {
        errors.push('Architecture layer violations detected');
      }
      
      // Check for SOLID principles
      if (expertise.capabilities?.includes('SOLID-principles')) {
        if (work.architecture.solidViolations) {
          work.architecture.solidViolations.forEach(violation => {
            warnings.push(`SOLID principle violation: ${violation}`);
          });
        }
      }
    }
    
    return { errors, warnings, suggestions };
  }
  
  checkScalability(work, expertise) {
    const warnings = [];
    const suggestions = [];
    
    if (work.scalability) {
      // Check for scalability issues
      if (work.scalability.bottlenecks) {
        work.scalability.bottlenecks.forEach(bottleneck => {
          warnings.push(`Scalability bottleneck: ${bottleneck}`);
        });
      }
      
      // Check for horizontal scaling capability
      if (!work.scalability.horizontalScaling) {
        suggestions.push('Consider designing for horizontal scaling');
      }
      
      // Check for caching strategy
      if (!work.scalability.caching) {
        suggestions.push('Implement caching strategy for better performance');
      }
    }
    
    return { warnings, suggestions };
  }
  
  checkSecurity(work, expertise) {
    const errors = [];
    const warnings = [];
    
    if (work.security) {
      // Check for security vulnerabilities
      if (work.security.vulnerabilities) {
        work.security.vulnerabilities.forEach(vuln => {
          errors.push(`Security vulnerability: ${vuln}`);
        });
      }
      
      // Check authentication
      if (!work.security.authentication) {
        warnings.push('Missing authentication mechanism');
      }
      
      // Check authorization
      if (!work.security.authorization) {
        warnings.push('Missing authorization checks');
      }
      
      // Check data encryption
      if (work.security.sensitiveData && !work.security.encryption) {
        errors.push('Sensitive data not encrypted');
      }
    }
    
    return { errors, warnings };
  }
  
  checkPerformance(work, expertise) {
    const warnings = [];
    const suggestions = [];
    
    if (work.performance) {
      // Check for performance issues
      if (work.performance.issues) {
        work.performance.issues.forEach(issue => {
          warnings.push(`Performance issue: ${issue}`);
        });
      }
      
      // Check for optimization opportunities
      if (work.performance.optimizations) {
        work.performance.optimizations.forEach(opt => {
          suggestions.push(`Performance optimization: ${opt}`);
        });
      }
      
      // Check for N+1 queries
      if (work.performance.nPlusOneQueries) {
        warnings.push('N+1 query problem detected');
        suggestions.push('Use eager loading or batch queries');
      }
    }
    
    return { warnings, suggestions };
  }
  
  checkMaintainability(work, expertise) {
    const warnings = [];
    const suggestions = [];
    
    // Check code complexity
    if (work.complexity) {
      if (work.complexity.cyclomatic > 10) {
        warnings.push(`High cyclomatic complexity: ${work.complexity.cyclomatic}`);
        suggestions.push('Consider breaking down complex functions');
      }
      
      if (work.complexity.cognitive > 15) {
        warnings.push(`High cognitive complexity: ${work.complexity.cognitive}`);
        suggestions.push('Simplify logic for better readability');
      }
    }
    
    // Check documentation
    if (!work.documentation || work.documentation.coverage < 0.5) {
      warnings.push('Insufficient documentation');
      suggestions.push('Add documentation for public APIs');
    }
    
    // Check test coverage
    if (work.testing && work.testing.coverage < 0.7) {
      warnings.push(`Low test coverage: ${(work.testing.coverage * 100).toFixed(1)}%`);
      suggestions.push('Increase test coverage to at least 70%');
    }
    
    return { warnings, suggestions };
  }
}

module.exports = ValidationFramework;