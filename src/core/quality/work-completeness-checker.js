/**
 * BUMBA Work Completeness Checker
 * Ensures all aspects of work items are complete before delivery
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class WorkCompletenessChecker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.checklistTemplates = new Map();
    this.completenessResults = new Map();
    this.gapAnalysis = new Map();
    
    this.config = {
      strictMode: options.strictMode || false,
      requiredCoverage: options.requiredCoverage || 80,
      autoGenerateChecklist: options.autoGenerateChecklist !== false,
      includeOptional: options.includeOptional || false,
      thresholds: {
        requirements: options.requirementsThreshold || 100,
        implementation: options.implementationThreshold || 100,
        tests: options.testsThreshold || 90,
        documentation: options.documentationThreshold || 80,
        review: options.reviewThreshold || 100
      }
    };
    
    this.stats = {
      totalChecks: 0,
      complete: 0,
      incomplete: 0,
      gaps: 0,
      criticalGaps: 0
    };
    
    this.initializeChecklists();
  }

  initializeChecklists() {
    // Default checklist templates
    this.checklistTemplates.set('feature', {
      name: 'Feature Development',
      required: [
        { id: 'req_spec', name: 'Requirements Specification', category: 'requirements' },
        { id: 'design_doc', name: 'Design Documentation', category: 'documentation' },
        { id: 'implementation', name: 'Code Implementation', category: 'implementation' },
        { id: 'unit_tests', name: 'Unit Tests', category: 'tests' },
        { id: 'integration_tests', name: 'Integration Tests', category: 'tests' },
        { id: 'code_review', name: 'Code Review', category: 'review' },
        { id: 'documentation', name: 'User Documentation', category: 'documentation' }
      ],
      optional: [
        { id: 'performance_tests', name: 'Performance Tests', category: 'tests' },
        { id: 'security_review', name: 'Security Review', category: 'review' },
        { id: 'api_docs', name: 'API Documentation', category: 'documentation' }
      ]
    });
    
    this.checklistTemplates.set('bugfix', {
      name: 'Bug Fix',
      required: [
        { id: 'bug_report', name: 'Bug Report/Issue', category: 'requirements' },
        { id: 'root_cause', name: 'Root Cause Analysis', category: 'documentation' },
        { id: 'fix_implementation', name: 'Fix Implementation', category: 'implementation' },
        { id: 'regression_tests', name: 'Regression Tests', category: 'tests' },
        { id: 'code_review', name: 'Code Review', category: 'review' }
      ],
      optional: [
        { id: 'related_fixes', name: 'Related Issue Fixes', category: 'implementation' },
        { id: 'prevention_measures', name: 'Prevention Measures', category: 'documentation' }
      ]
    });
    
    this.checklistTemplates.set('refactoring', {
      name: 'Code Refactoring',
      required: [
        { id: 'refactor_plan', name: 'Refactoring Plan', category: 'requirements' },
        { id: 'impact_analysis', name: 'Impact Analysis', category: 'documentation' },
        { id: 'refactor_implementation', name: 'Refactored Code', category: 'implementation' },
        { id: 'test_coverage', name: 'Test Coverage Maintained', category: 'tests' },
        { id: 'performance_validation', name: 'Performance Validation', category: 'tests' },
        { id: 'code_review', name: 'Code Review', category: 'review' }
      ],
      optional: [
        { id: 'architecture_review', name: 'Architecture Review', category: 'review' },
        { id: 'migration_guide', name: 'Migration Guide', category: 'documentation' }
      ]
    });
  }

  /**
   * Check completeness of a work item
   */
  async checkCompleteness(workItem, options = {}) {
    this.stats.totalChecks++;
    
    const checkId = this.generateCheckId();
    const workType = options.type || workItem.type || 'feature';
    const checklist = this.generateChecklist(workType, options);
    
    const results = {
      id: checkId,
      timestamp: Date.now(),
      workItem: workItem.id || workItem.name || 'unknown',
      type: workType,
      complete: true,
      completionPercentage: 0,
      checklist: checklist,
      completed: [],
      missing: [],
      gaps: [],
      critical: []
    };
    
    try {
      // Check each item in the checklist
      for (const item of checklist.required) {
        const isComplete = await this.checkItem(workItem, item);
        if (isComplete) {
          results.completed.push(item);
        } else {
          results.missing.push(item);
          results.complete = false;
          
          if (this.isCritical(item)) {
            results.critical.push(item);
          }
        }
      }
      
      // Check optional items if configured
      if (this.config.includeOptional && checklist.optional) {
        for (const item of checklist.optional) {
          const isComplete = await this.checkItem(workItem, item);
          if (isComplete) {
            results.completed.push(item);
          }
        }
      }
      
      // Verify specific aspects
      const reqComplete = await this.verifyRequirements(workItem);
      const testComplete = await this.verifyTests(workItem);
      const docComplete = await this.verifyDocumentation(workItem);
      
      // Calculate completion percentage
      const totalItems = checklist.required.length + 
        (this.config.includeOptional ? (checklist.optional?.length || 0) : 0);
      results.completionPercentage = (results.completed.length / totalItems) * 100;
      
      // Identify gaps
      const gaps = await this.identifyGaps(workItem, results);
      results.gaps = gaps;
      
      // Calculate progress
      const progress = await this.calculateProgress(workItem, results);
      results.progress = progress;
      
      // Store results
      this.completenessResults.set(checkId, results);
      
      // Update stats
      if (results.complete) {
        this.stats.complete++;
      } else {
        this.stats.incomplete++;
        this.stats.gaps += results.gaps.length;
        this.stats.criticalGaps += results.critical.length;
      }
      
      // Emit events
      this.emit('completeness-checked', results);
      if (!results.complete) {
        this.emit('incomplete-work', results);
        
        if (results.critical.length > 0) {
          this.emit('critical-gaps', results);
        }
      }
      
      return results;
    } catch (error) {
      results.error = error.message;
      this.stats.incomplete++;
      this.emit('check-error', { checkId, error });
      return results;
    }
  }

  /**
   * Verify requirements are complete
   */
  async verifyRequirements(workItem) {
    const requirements = workItem.requirements || {};
    
    const checks = {
      hasSpecification: !!requirements.specification,
      hasAcceptanceCriteria: !!requirements.acceptanceCriteria,
      hasScope: !!requirements.scope,
      hasStakeholderApproval: requirements.approved === true,
      hasTestability: requirements.testable !== false
    };
    
    const completeness = Object.values(checks).filter(v => v).length / Object.keys(checks).length * 100;
    
    return {
      complete: completeness >= this.config.thresholds.requirements,
      completeness,
      checks,
      missing: Object.entries(checks)
        .filter(([_, value]) => !value)
        .map(([key]) => key)
    };
  }

  /**
   * Verify tests are complete
   */
  async verifyTests(workItem) {
    const tests = workItem.tests || {};
    
    const checks = {
      hasUnitTests: tests.unit > 0,
      hasIntegrationTests: tests.integration > 0,
      hasTestCoverage: tests.coverage >= this.config.requiredCoverage,
      allTestsPassing: tests.passing === tests.total,
      hasTestDocumentation: !!tests.documentation
    };
    
    // Check for test files
    if (workItem.path) {
      const testPath = path.join(workItem.path, 'tests');
      try {
        const testFiles = await fs.readdir(testPath);
        checks.hasTestFiles = testFiles.length > 0;
      } catch {
        checks.hasTestFiles = false;
      }
    }
    
    const completeness = Object.values(checks).filter(v => v).length / Object.keys(checks).length * 100;
    
    return {
      complete: completeness >= this.config.thresholds.tests,
      completeness,
      checks,
      coverage: tests.coverage || 0,
      missing: Object.entries(checks)
        .filter(([_, value]) => !value)
        .map(([key]) => key)
    };
  }

  /**
   * Verify documentation is complete
   */
  async verifyDocumentation(workItem) {
    const docs = workItem.documentation || {};
    
    const checks = {
      hasReadme: !!docs.readme,
      hasApiDocs: !!docs.api,
      hasUserGuide: !!docs.userGuide,
      hasComments: docs.codeComments === true,
      hasExamples: !!docs.examples,
      hasChangelog: !!docs.changelog
    };
    
    // Check for documentation files
    if (workItem.path) {
      try {
        const readmePath = path.join(workItem.path, 'README.md');
        await fs.access(readmePath);
        checks.hasReadmeFile = true;
      } catch {
        checks.hasReadmeFile = false;
      }
    }
    
    const completeness = Object.values(checks).filter(v => v).length / Object.keys(checks).length * 100;
    
    return {
      complete: completeness >= this.config.thresholds.documentation,
      completeness,
      checks,
      missing: Object.entries(checks)
        .filter(([_, value]) => !value)
        .map(([key]) => key)
    };
  }

  /**
   * Calculate progress percentage
   */
  async calculateProgress(workItem, checkResults = null) {
    const results = checkResults || await this.checkCompleteness(workItem);
    
    const progress = {
      overall: results.completionPercentage,
      byCategory: {},
      timeline: {
        startDate: workItem.startDate || null,
        targetDate: workItem.targetDate || null,
        currentDate: new Date(),
        daysElapsed: 0,
        daysRemaining: 0
      },
      velocity: {},
      projection: {}
    };
    
    // Calculate progress by category
    const categories = ['requirements', 'implementation', 'tests', 'documentation', 'review'];
    for (const category of categories) {
      const categoryItems = results.checklist.required.filter(item => item.category === category);
      const completedItems = results.completed.filter(item => item.category === category);
      progress.byCategory[category] = categoryItems.length > 0 
        ? (completedItems.length / categoryItems.length) * 100 
        : 0;
    }
    
    // Calculate timeline progress
    if (workItem.startDate) {
      const start = new Date(workItem.startDate);
      const now = new Date();
      progress.timeline.daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      
      if (workItem.targetDate) {
        const target = new Date(workItem.targetDate);
        progress.timeline.daysRemaining = Math.floor((target - now) / (1000 * 60 * 60 * 24));
        progress.timeline.timeProgress = (progress.timeline.daysElapsed / 
          (progress.timeline.daysElapsed + progress.timeline.daysRemaining)) * 100;
      }
    }
    
    // Calculate velocity
    if (progress.timeline.daysElapsed > 0) {
      progress.velocity.itemsPerDay = results.completed.length / progress.timeline.daysElapsed;
      progress.velocity.percentPerDay = results.completionPercentage / progress.timeline.daysElapsed;
      
      // Project completion
      if (results.missing.length > 0 && progress.velocity.itemsPerDay > 0) {
        progress.projection.daysToComplete = Math.ceil(results.missing.length / progress.velocity.itemsPerDay);
        progress.projection.estimatedCompletionDate = new Date(
          Date.now() + progress.projection.daysToComplete * 24 * 60 * 60 * 1000
        );
      }
    }
    
    return progress;
  }

  /**
   * Identify gaps in work completeness
   */
  async identifyGaps(workItem, checkResults = null) {
    const results = checkResults || await this.checkCompleteness(workItem);
    const gaps = [];
    
    // Analyze missing items
    for (const missing of results.missing) {
      const gap = {
        id: missing.id,
        name: missing.name,
        category: missing.category,
        severity: this.calculateGapSeverity(missing),
        impact: this.assessImpact(missing),
        remediation: this.suggestRemediation(missing),
        effort: this.estimateEffort(missing)
      };
      
      gaps.push(gap);
    }
    
    // Check for quality gaps
    if (workItem.tests?.coverage < this.config.requiredCoverage) {
      gaps.push({
        id: 'test_coverage_gap',
        name: 'Insufficient Test Coverage',
        category: 'tests',
        severity: 'high',
        impact: 'Risk of undetected bugs',
        remediation: 'Increase test coverage to meet threshold',
        effort: 'medium'
      });
    }
    
    // Check for process gaps
    if (!workItem.review?.approved) {
      gaps.push({
        id: 'review_gap',
        name: 'Pending Code Review',
        category: 'review',
        severity: 'critical',
        impact: 'Quality not verified',
        remediation: 'Complete code review process',
        effort: 'low'
      });
    }
    
    // Store gap analysis
    this.gapAnalysis.set(workItem.id || 'current', gaps);
    
    return gaps;
  }

  /**
   * Generate a checklist for work type
   */
  generateChecklist(workType, options = {}) {
    const template = this.checklistTemplates.get(workType) || this.checklistTemplates.get('feature');
    
    const checklist = {
      name: template.name,
      type: workType,
      required: [...template.required],
      optional: template.optional ? [...template.optional] : []
    };
    
    // Add custom items if provided
    if (options.customItems) {
      for (const item of options.customItems) {
        if (item.required) {
          checklist.required.push(item);
        } else {
          checklist.optional.push(item);
        }
      }
    }
    
    // Filter based on options
    if (options.categories) {
      checklist.required = checklist.required.filter(item => 
        options.categories.includes(item.category)
      );
      checklist.optional = checklist.optional.filter(item => 
        options.categories.includes(item.category)
      );
    }
    
    return checklist;
  }

  // Helper methods
  
  async checkItem(workItem, checklistItem) {
    // Check if the item exists in the work item
    switch (checklistItem.category) {
      case 'requirements':
        return workItem.requirements?.[checklistItem.id] !== undefined;
      
      case 'implementation':
        return workItem.implementation?.[checklistItem.id] !== undefined ||
               workItem.code !== undefined;
      
      case 'tests':
        return workItem.tests?.[checklistItem.id] !== undefined ||
               (checklistItem.id === 'unit_tests' && workItem.tests?.unit > 0) ||
               (checklistItem.id === 'integration_tests' && workItem.tests?.integration > 0);
      
      case 'documentation':
        return workItem.documentation?.[checklistItem.id] !== undefined;
      
      case 'review':
        return workItem.review?.[checklistItem.id] !== undefined ||
               (checklistItem.id === 'code_review' && workItem.review?.approved);
      
      default:
        return false;
    }
  }
  
  isCritical(checklistItem) {
    const criticalItems = ['implementation', 'code_review', 'unit_tests'];
    return criticalItems.includes(checklistItem.id);
  }
  
  calculateGapSeverity(missingItem) {
    if (this.isCritical(missingItem)) {
      return 'critical';
    }
    
    if (missingItem.category === 'tests' || missingItem.category === 'review') {
      return 'high';
    }
    
    if (missingItem.category === 'documentation') {
      return 'medium';
    }
    
    return 'low';
  }
  
  assessImpact(missingItem) {
    const impacts = {
      'req_spec': 'Unclear requirements may lead to incorrect implementation',
      'implementation': 'Core functionality missing',
      'unit_tests': 'Code quality and reliability not verified',
      'code_review': 'Potential quality and security issues',
      'documentation': 'Difficult maintenance and onboarding'
    };
    
    return impacts[missingItem.id] || 'May affect work quality';
  }
  
  suggestRemediation(missingItem) {
    const remediations = {
      'req_spec': 'Document detailed requirements and acceptance criteria',
      'implementation': 'Complete code implementation according to requirements',
      'unit_tests': 'Write comprehensive unit tests with good coverage',
      'code_review': 'Submit for code review and address feedback',
      'documentation': 'Create user and technical documentation'
    };
    
    return remediations[missingItem.id] || `Complete ${missingItem.name}`;
  }
  
  estimateEffort(missingItem) {
    const efforts = {
      'req_spec': 'medium',
      'implementation': 'high',
      'unit_tests': 'medium',
      'integration_tests': 'high',
      'code_review': 'low',
      'documentation': 'medium'
    };
    
    return efforts[missingItem.id] || 'medium';
  }
  
  generateCheckId() {
    return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { WorkCompletenessChecker };