/**
 * BUMBA Work Validation Framework
 * Comprehensive validation system for ensuring work quality and completeness
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class WorkValidationFramework extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.validationRules = new Map();
    this.validationResults = new Map();
    this.progressTracking = new Map();
    
    this.config = {
      strictMode: options.strictMode || false,
      autoFix: options.autoFix || false,
      reportFormat: options.reportFormat || 'json',
      thresholds: {
        coverage: options.coverageThreshold || 80,
        quality: options.qualityThreshold || 85,
        documentation: options.docThreshold || 70,
        tests: options.testThreshold || 90
      }
    };
    
    this.stats = {
      totalValidations: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      autoFixed: 0
    };
    
    this.initializeValidationRules();
  }

  initializeValidationRules() {
    // Default validation rules
    this.validationRules.set('code_quality', {
      name: 'Code Quality',
      validators: [
        { name: 'no_console', check: (code) => !code.includes('console.log') },
        { name: 'no_debugger', check: (code) => !code.includes('debugger') },
        { name: 'no_todo', check: (code) => !code.includes('TODO') || !this.config.strictMode },
        { name: 'has_comments', check: (code) => code.includes('/**') || code.includes('//') }
      ]
    });
    
    this.validationRules.set('requirements', {
      name: 'Requirements Coverage',
      validators: [
        { name: 'has_spec', check: (req) => req.specification !== undefined },
        { name: 'has_acceptance', check: (req) => req.acceptanceCriteria !== undefined },
        { name: 'has_priority', check: (req) => req.priority !== undefined },
        { name: 'is_testable', check: (req) => req.testable !== false }
      ]
    });
    
    this.validationRules.set('documentation', {
      name: 'Documentation Standards',
      validators: [
        { name: 'has_readme', check: async (path) => await this.fileExists(path, 'README.md') },
        { name: 'has_jsdoc', check: (code) => code.includes('/**') },
        { name: 'has_examples', check: (doc) => doc.includes('Example') || doc.includes('Usage') },
        { name: 'has_api_docs', check: (doc) => doc.includes('API') || doc.includes('Methods') }
      ]
    });
  }

  /**
   * Validate work against all configured rules
   */
  async validateWork(workItem, options = {}) {
    this.stats.totalValidations++;
    
    const validationId = this.generateValidationId();
    const results = {
      id: validationId,
      timestamp: Date.now(),
      workItem: workItem.id || workItem.name || 'unknown',
      passed: true,
      score: 100,
      violations: [],
      warnings: [],
      suggestions: []
    };
    
    try {
      // Validate requirements
      const reqResults = await this.validateRequirements(workItem.requirements || {});
      if (!reqResults.passed) {
        results.passed = false;
        results.violations.push(...reqResults.violations);
      }
      
      // Validate implementation
      const implResults = await this.validateImplementation(workItem.implementation || workItem.code || '');
      if (!implResults.passed) {
        results.passed = false;
        results.violations.push(...implResults.violations);
      }
      
      // Validate documentation
      const docResults = await this.validateDocumentation(workItem.documentation || workItem.docs || '');
      if (!docResults.passed) {
        results.warnings.push(...docResults.violations);
      }
      
      // Validate tests
      const testResults = await this.validateTests(workItem.tests || {});
      if (!testResults.passed) {
        results.passed = false;
        results.violations.push(...testResults.violations);
      }
      
      // Calculate overall score
      results.score = this.calculateScore([reqResults, implResults, docResults, testResults]);
      
      // Apply auto-fixes if enabled
      if (this.config.autoFix && results.violations.length > 0) {
        const fixed = await this.applyAutoFixes(workItem, results.violations);
        if (fixed.length > 0) {
          results.autoFixed = fixed;
          this.stats.autoFixed += fixed.length;
        }
      }
      
      // Store results
      this.validationResults.set(validationId, results);
      
      // Update stats
      if (results.passed) {
        this.stats.passed++;
      } else {
        this.stats.failed++;
      }
      this.stats.warnings += results.warnings.length;
      
      // Emit events
      this.emit('validation-complete', results);
      if (!results.passed) {
        this.emit('validation-failed', results);
      }
      
      return results;
    } catch (error) {
      results.passed = false;
      results.error = error.message;
      this.stats.failed++;
      this.emit('validation-error', { validationId, error });
      return results;
    }
  }

  /**
   * Validate requirements coverage
   */
  async validateRequirements(requirements) {
    const results = {
      passed: true,
      score: 100,
      violations: [],
      coverage: {}
    };
    
    const rules = this.validationRules.get('requirements');
    if (!rules) return results;
    
    let passed = 0;
    let total = rules.validators.length;
    
    for (const validator of rules.validators) {
      try {
        const isValid = await validator.check(requirements);
        if (isValid) {
          passed++;
          results.coverage[validator.name] = true;
        } else {
          results.violations.push({
            rule: validator.name,
            message: `Requirement validation failed: ${validator.name}`,
            severity: 'error'
          });
          results.coverage[validator.name] = false;
        }
      } catch (error) {
        results.violations.push({
          rule: validator.name,
          message: `Validation error: ${error.message}`,
          severity: 'error'
        });
      }
    }
    
    results.score = (passed / total) * 100;
    results.passed = results.score >= this.config.thresholds.coverage;
    
    return results;
  }

  /**
   * Validate implementation quality
   */
  async validateImplementation(code) {
    const results = {
      passed: true,
      score: 100,
      violations: [],
      metrics: {}
    };
    
    if (!code || code.length === 0) {
      results.passed = false;
      results.score = 0;
      results.violations.push({
        rule: 'no_implementation',
        message: 'No implementation code found',
        severity: 'error'
      });
      return results;
    }
    
    const rules = this.validationRules.get('code_quality');
    if (!rules) return results;
    
    let passed = 0;
    let total = rules.validators.length;
    
    for (const validator of rules.validators) {
      try {
        const isValid = await validator.check(code);
        if (isValid) {
          passed++;
          results.metrics[validator.name] = 'passed';
        } else {
          results.violations.push({
            rule: validator.name,
            message: `Code quality issue: ${validator.name}`,
            severity: this.config.strictMode ? 'error' : 'warning',
            fixable: this.isFixable(validator.name)
          });
          results.metrics[validator.name] = 'failed';
        }
      } catch (error) {
        results.violations.push({
          rule: validator.name,
          message: `Validation error: ${error.message}`,
          severity: 'error'
        });
      }
    }
    
    // Additional metrics
    results.metrics.lines = code.split('\n').length;
    results.metrics.complexity = this.calculateComplexity(code);
    results.metrics.maintainability = this.calculateMaintainability(code);
    
    results.score = (passed / total) * 100;
    results.passed = results.score >= this.config.thresholds.quality;
    
    return results;
  }

  /**
   * Validate documentation completeness
   */
  async validateDocumentation(documentation) {
    const results = {
      passed: true,
      score: 100,
      violations: [],
      completeness: {}
    };
    
    const rules = this.validationRules.get('documentation');
    if (!rules) return results;
    
    let passed = 0;
    let total = rules.validators.length;
    
    for (const validator of rules.validators) {
      try {
        const isValid = await validator.check(documentation);
        if (isValid) {
          passed++;
          results.completeness[validator.name] = true;
        } else {
          results.violations.push({
            rule: validator.name,
            message: `Documentation missing: ${validator.name}`,
            severity: 'warning',
            suggestion: this.getDocumentationSuggestion(validator.name)
          });
          results.completeness[validator.name] = false;
        }
      } catch (error) {
        results.violations.push({
          rule: validator.name,
          message: `Validation error: ${error.message}`,
          severity: 'warning'
        });
      }
    }
    
    results.score = (passed / total) * 100;
    results.passed = results.score >= this.config.thresholds.documentation;
    
    return results;
  }

  /**
   * Validate test coverage and quality
   */
  async validateTests(tests) {
    const results = {
      passed: true,
      score: 100,
      violations: [],
      coverage: {},
      metrics: {}
    };
    
    // Check test existence
    if (!tests || Object.keys(tests).length === 0) {
      results.passed = false;
      results.score = 0;
      results.violations.push({
        rule: 'no_tests',
        message: 'No tests found',
        severity: 'error'
      });
      return results;
    }
    
    // Validate test coverage
    const coverage = tests.coverage || 0;
    if (coverage < this.config.thresholds.tests) {
      results.violations.push({
        rule: 'insufficient_coverage',
        message: `Test coverage ${coverage}% is below threshold ${this.config.thresholds.tests}%`,
        severity: 'error'
      });
      results.passed = false;
    }
    
    // Check test types
    const testTypes = ['unit', 'integration', 'e2e'];
    for (const type of testTypes) {
      results.coverage[type] = tests[type] !== undefined && tests[type] > 0;
      if (!results.coverage[type] && this.config.strictMode) {
        results.violations.push({
          rule: `missing_${type}_tests`,
          message: `No ${type} tests found`,
          severity: 'warning'
        });
      }
    }
    
    // Calculate metrics
    results.metrics.totalTests = tests.total || 0;
    results.metrics.passedTests = tests.passed || 0;
    results.metrics.failedTests = tests.failed || 0;
    results.metrics.coverage = coverage;
    results.metrics.passRate = results.metrics.totalTests > 0 
      ? (results.metrics.passedTests / results.metrics.totalTests) * 100 
      : 0;
    
    results.score = coverage;
    
    return results;
  }

  /**
   * Generate validation report
   */
  async generateReport(validationId, format = null) {
    const results = this.validationResults.get(validationId);
    if (!results) {
      throw new Error(`Validation results not found for ID: ${validationId}`);
    }
    
    const reportFormat = format || this.config.reportFormat;
    
    switch (reportFormat.toLowerCase()) {
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'html':
        return this.generateHTMLReport(results);
      
      case 'markdown':
        return this.generateMarkdownReport(results);
      
      case 'summary':
        return this.generateSummaryReport(results);
      
      default:
        return results;
    }
  }

  /**
   * Track validation progress
   */
  trackProgress(workflowId, stage, status = 'in_progress') {
    if (!this.progressTracking.has(workflowId)) {
      this.progressTracking.set(workflowId, {
        id: workflowId,
        startTime: Date.now(),
        stages: {}
      });
    }
    
    const workflow = this.progressTracking.get(workflowId);
    workflow.stages[stage] = {
      status,
      timestamp: Date.now()
    };
    
    if (status === 'completed') {
      const allStages = Object.values(workflow.stages);
      const completedStages = allStages.filter(s => s.status === 'completed').length;
      workflow.progress = (completedStages / allStages.length) * 100;
      
      if (workflow.progress === 100) {
        workflow.endTime = Date.now();
        workflow.duration = workflow.endTime - workflow.startTime;
        this.emit('workflow-complete', workflow);
      }
    }
    
    this.emit('progress-update', { workflowId, stage, status });
    
    return workflow;
  }

  // Helper methods
  
  async fileExists(basePath, filename) {
    try {
      await fs.access(path.join(basePath, filename));
      return true;
    } catch {
      return false;
    }
  }
  
  calculateScore(results) {
    const scores = results.map(r => r.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  
  calculateComplexity(code) {
    // Simplified cyclomatic complexity calculation
    const conditions = (code.match(/if|else|for|while|switch|case|\?/g) || []).length;
    return Math.min(10, conditions + 1);
  }
  
  calculateMaintainability(code) {
    // Simplified maintainability index
    const lines = code.split('\n').length;
    const complexity = this.calculateComplexity(code);
    const comments = (code.match(/\/\*|\*\/|\/\//g) || []).length;
    
    return Math.max(0, Math.min(100, 171 - 5.2 * Math.log(lines) - 0.23 * complexity + 16.2 * Math.log(comments + 1)));
  }
  
  isFixable(rule) {
    const fixableRules = ['no_console', 'no_debugger', 'no_todo'];
    return fixableRules.includes(rule);
  }
  
  async applyAutoFixes(workItem, violations) {
    const fixed = [];
    
    for (const violation of violations) {
      if (violation.fixable && this.config.autoFix) {
        // Apply fixes based on rule
        switch (violation.rule) {
          case 'no_console':
            workItem.code = workItem.code?.replace(/console\.log\([^)]*\);?/g, '');
            fixed.push('Removed console.log statements');
            break;
          case 'no_debugger':
            workItem.code = workItem.code?.replace(/debugger;?/g, '');
            fixed.push('Removed debugger statements');
            break;
          case 'no_todo':
            workItem.code = workItem.code?.replace(/\/\/\s*TODO:?[^\n]*/g, '');
            fixed.push('Removed TODO comments');
            break;
        }
      }
    }
    
    return fixed;
  }
  
  getDocumentationSuggestion(rule) {
    const suggestions = {
      'has_readme': 'Create a README.md file with project overview and usage instructions',
      'has_jsdoc': 'Add JSDoc comments to functions and classes',
      'has_examples': 'Include usage examples in documentation',
      'has_api_docs': 'Document all public APIs and methods'
    };
    
    return suggestions[rule] || 'Improve documentation coverage';
  }
  
  generateValidationId() {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateHTMLReport(results) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Validation Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #4CAF50; color: white; padding: 10px; }
    .passed { color: green; }
    .failed { color: red; }
    .warning { color: orange; }
    .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Work Validation Report</h1>
    <p>ID: ${results.id} | Date: ${new Date(results.timestamp).toISOString()}</p>
  </div>
  
  <h2 class="${results.passed ? 'passed' : 'failed'}">
    Status: ${results.passed ? 'PASSED' : 'FAILED'} (Score: ${results.score.toFixed(1)}%)
  </h2>
  
  <div class="metrics">
    <div class="metric">Violations: ${results.violations.length}</div>
    <div class="metric">Warnings: ${results.warnings.length}</div>
    <div class="metric">Auto-fixed: ${results.autoFixed?.length || 0}</div>
  </div>
  
  ${results.violations.length > 0 ? `
    <h3>Violations</h3>
    <ul>
      ${results.violations.map(v => `<li class="failed">${v.message}</li>`).join('')}
    </ul>
  ` : ''}
  
  ${results.warnings.length > 0 ? `
    <h3>Warnings</h3>
    <ul>
      ${results.warnings.map(w => `<li class="warning">${w.message}</li>`).join('')}
    </ul>
  ` : ''}
</body>
</html>`;
  }
  
  generateMarkdownReport(results) {
    return `# Work Validation Report

**ID**: ${results.id}  
**Date**: ${new Date(results.timestamp).toISOString()}  
**Work Item**: ${results.workItem}

## Status
**Result**: ${results.passed ? '🏁 PASSED' : '🔴 FAILED'}  
**Score**: ${results.score.toFixed(1)}%

## Summary
- Violations: ${results.violations.length}
- Warnings: ${results.warnings.length}
- Auto-fixed: ${results.autoFixed?.length || 0}

${results.violations.length > 0 ? `
## Violations
${results.violations.map(v => `- 🔴 ${v.message}`).join('\n')}
` : ''}

${results.warnings.length > 0 ? `
## Warnings
${results.warnings.map(w => `- 🟠️ ${w.message}`).join('\n')}
` : ''}

${results.suggestions?.length > 0 ? `
## Suggestions
${results.suggestions.map(s => `- 💡 ${s}`).join('\n')}
` : ''}`;
  }
  
  generateSummaryReport(results) {
    return {
      id: results.id,
      passed: results.passed,
      score: results.score,
      violations: results.violations.length,
      warnings: results.warnings.length,
      timestamp: results.timestamp
    };
  }
}

module.exports = { WorkValidationFramework };