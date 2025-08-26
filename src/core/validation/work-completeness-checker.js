/**
 * BUMBA Work Completeness Checker
 * Ensures all work is complete before agent deprecation
 * Tracks deliverables, dependencies, and acceptance criteria
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Completeness Status
 */
const CompletenessStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PARTIALLY_COMPLETE: 'partially_complete',
  COMPLETE: 'complete',
  BLOCKED: 'blocked',
  FAILED: 'failed'
};

/**
 * Work Item Types
 */
const WorkItemType = {
  TASK: 'task',
  DELIVERABLE: 'deliverable',
  DEPENDENCY: 'dependency',
  TEST: 'test',
  DOCUMENTATION: 'documentation',
  REVIEW: 'review'
};

/**
 * Work Completeness Checker
 */
class WorkCompletenessChecker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      strictMode: config.strictMode !== false,
      allowPartialCompletion: config.allowPartialCompletion || false,
      checkDependencies: config.checkDependencies !== false,
      checkTests: config.checkTests !== false,
      checkDocumentation: config.checkDocumentation !== false,
      completenessThreshold: config.completenessThreshold || 0.95,
      timeout: config.timeout || 300000, // 5 minutes
      ...config
    };
    
    // Work tracking
    this.workItems = new Map();
    this.agentWork = new Map();
    this.completenessReports = new Map();
    
    // Acceptance criteria
    this.acceptanceCriteria = new Map();
    
    // Statistics
    this.stats = {
      totalChecks: 0,
      completeWork: 0,
      incompleteWork: 0,
      blockedWork: 0,
      averageCompleteness: 0,
      averageCheckTime: 0
    };
  }
  
  /**
   * Register work for agent
   */
  registerWork(agentId, workDefinition) {
    const workId = this.generateWorkId();
    
    const work = {
      id: workId,
      agentId,
      definition: workDefinition,
      items: [],
      dependencies: [],
      status: CompletenessStatus.NOT_STARTED,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Parse work definition
    this.parseWorkDefinition(work, workDefinition);
    
    // Store work
    this.workItems.set(workId, work);
    
    // Track by agent
    if (!this.agentWork.has(agentId)) {
      this.agentWork.set(agentId, new Set());
    }
    this.agentWork.get(agentId).add(workId);
    
    logger.info(`🟢 Registered work ${workId} for agent ${agentId}`);
    
    return workId;
  }
  
  /**
   * Parse work definition
   */
  parseWorkDefinition(work, definition) {
    // Extract tasks
    if (definition.tasks) {
      definition.tasks.forEach(task => {
        work.items.push({
          id: this.generateItemId(),
          type: WorkItemType.TASK,
          name: task.name || task,
          description: task.description,
          required: task.required !== false,
          status: CompletenessStatus.NOT_STARTED,
          progress: 0,
          acceptanceCriteria: task.acceptanceCriteria || []
        });
      });
    }
    
    // Extract deliverables
    if (definition.deliverables) {
      definition.deliverables.forEach(deliverable => {
        work.items.push({
          id: this.generateItemId(),
          type: WorkItemType.DELIVERABLE,
          name: deliverable.name || deliverable,
          description: deliverable.description,
          required: deliverable.required !== false,
          status: CompletenessStatus.NOT_STARTED,
          progress: 0,
          acceptanceCriteria: deliverable.acceptanceCriteria || []
        });
      });
    }
    
    // Extract dependencies
    if (definition.dependencies) {
      definition.dependencies.forEach(dep => {
        work.dependencies.push({
          id: this.generateItemId(),
          name: dep.name || dep,
          type: dep.type || 'external',
          status: CompletenessStatus.NOT_STARTED,
          required: dep.required !== false
        });
      });
    }
    
    // Add test requirements
    if (this.config.checkTests && definition.tests) {
      definition.tests.forEach(test => {
        work.items.push({
          id: this.generateItemId(),
          type: WorkItemType.TEST,
          name: test.name || test,
          description: test.description,
          required: test.required !== false,
          status: CompletenessStatus.NOT_STARTED,
          progress: 0,
          passingCriteria: test.passingCriteria || { coverage: 0.8 }
        });
      });
    }
    
    // Add documentation requirements
    if (this.config.checkDocumentation && definition.documentation) {
      definition.documentation.forEach(doc => {
        work.items.push({
          id: this.generateItemId(),
          type: WorkItemType.DOCUMENTATION,
          name: doc.name || doc,
          description: doc.description,
          required: doc.required !== false,
          status: CompletenessStatus.NOT_STARTED,
          progress: 0
        });
      });
    }
  }
  
  /**
   * Update work item status
   */
  updateWorkItem(workId, itemId, update) {
    const work = this.workItems.get(workId);
    
    if (!work) {
      throw new Error(`Work ${workId} not found`);
    }
    
    const item = work.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new Error(`Work item ${itemId} not found`);
    }
    
    // Update item
    Object.assign(item, update);
    item.updatedAt = Date.now();
    
    // Recalculate work progress
    this.updateWorkProgress(work);
    
    // Emit update event
    this.emit('workItem:updated', {
      workId,
      itemId,
      item,
      workProgress: work.progress
    });
    
    return item;
  }
  
  /**
   * Update work progress
   */
  updateWorkProgress(work) {
    if (work.items.length === 0) {
      work.progress = 0;
      work.status = CompletenessStatus.NOT_STARTED;
      return;
    }
    
    let totalWeight = 0;
    let completedWeight = 0;
    let hasBlockedItems = false;
    let hasFailedItems = false;
    
    work.items.forEach(item => {
      const weight = item.required ? 2 : 1;
      totalWeight += weight;
      
      if (item.status === CompletenessStatus.COMPLETE) {
        completedWeight += weight;
      } else if (item.status === CompletenessStatus.PARTIALLY_COMPLETE) {
        completedWeight += weight * (item.progress || 0.5);
      } else if (item.status === CompletenessStatus.BLOCKED) {
        hasBlockedItems = true;
      } else if (item.status === CompletenessStatus.FAILED) {
        hasFailedItems = true;
      }
    });
    
    work.progress = totalWeight > 0 ? completedWeight / totalWeight : 0;
    
    // Update status
    if (hasFailedItems) {
      work.status = CompletenessStatus.FAILED;
    } else if (hasBlockedItems) {
      work.status = CompletenessStatus.BLOCKED;
    } else if (work.progress >= 1.0) {
      work.status = CompletenessStatus.COMPLETE;
    } else if (work.progress > 0) {
      work.status = work.progress >= 0.5 ? 
        CompletenessStatus.PARTIALLY_COMPLETE : 
        CompletenessStatus.IN_PROGRESS;
    } else {
      work.status = CompletenessStatus.NOT_STARTED;
    }
    
    work.updatedAt = Date.now();
  }
  
  /**
   * Check work completeness
   */
  async checkCompleteness(workId) {
    const startTime = Date.now();
    const work = this.workItems.get(workId);
    
    if (!work) {
      throw new Error(`Work ${workId} not found`);
    }
    
    logger.info(`🟢 Checking completeness for work ${workId}`);
    
    const report = {
      workId,
      agentId: work.agentId,
      timestamp: Date.now(),
      overall: {
        status: CompletenessStatus.NOT_STARTED,
        progress: 0,
        isComplete: false,
        canDeprecate: false
      },
      items: [],
      dependencies: [],
      issues: [],
      recommendations: []
    };
    
    try {
      // Check dependencies first
      if (this.config.checkDependencies && work.dependencies.length > 0) {
        report.dependencies = await this.checkDependencies(work);
        
        const blockedDeps = report.dependencies.filter(d => 
          d.required && d.status !== CompletenessStatus.COMPLETE
        );
        
        if (blockedDeps.length > 0) {
          report.overall.status = CompletenessStatus.BLOCKED;
          report.issues.push(`${blockedDeps.length} required dependencies not met`);
        }
      }
      
      // Check each work item
      for (const item of work.items) {
        const itemReport = await this.checkWorkItem(item);
        report.items.push(itemReport);
        
        if (item.required && itemReport.status !== CompletenessStatus.COMPLETE) {
          report.issues.push(`Required item "${item.name}" is not complete`);
        }
      }
      
      // Check acceptance criteria
      const criteriaResults = await this.checkAcceptanceCriteria(work);
      report.acceptanceCriteria = criteriaResults;
      
      // Calculate overall completeness
      report.overall = this.calculateOverallCompleteness(work, report);
      
      // Generate recommendations
      report.recommendations = this.generateRecommendations(work, report);
      
      // Store report
      this.completenessReports.set(workId, report);
      
      // Update statistics
      this.updateStatistics(report, Date.now() - startTime);
      
      // Emit check complete event
      this.emit('completeness:checked', {
        workId,
        report,
        duration: Date.now() - startTime
      });
      
      logger.info(`🏁 Completeness check complete for ${workId}: ${(report.overall.progress * 100).toFixed(1)}%`);
      
      return report;
      
    } catch (error) {
      logger.error(`🔴 Completeness check failed for ${workId}: ${error.message}`);
      
      report.overall.status = CompletenessStatus.FAILED;
      report.issues.push(`Check failed: ${error.message}`);
      
      throw error;
    }
  }
  
  /**
   * Check dependencies
   */
  async checkDependencies(work) {
    const results = [];
    
    for (const dep of work.dependencies) {
      const result = {
        ...dep,
        met: false,
        details: ''
      };
      
      // Check dependency based on type
      switch (dep.type) {
        case 'work':
          // Check if another work item is complete
          const depWork = this.workItems.get(dep.workId);
          if (depWork && depWork.status === CompletenessStatus.COMPLETE) {
            result.met = true;
            result.status = CompletenessStatus.COMPLETE;
          }
          break;
          
        case 'external':
          // Check external dependency (would integrate with actual systems)
          result.met = true; // Assume met for now
          result.status = CompletenessStatus.COMPLETE;
          break;
          
        default:
          result.met = true;
          result.status = CompletenessStatus.COMPLETE;
      }
      
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Check individual work item
   */
  async checkWorkItem(item) {
    const report = {
      id: item.id,
      name: item.name,
      type: item.type,
      status: item.status,
      progress: item.progress,
      required: item.required,
      issues: []
    };
    
    // Type-specific checks
    switch (item.type) {
      case WorkItemType.TASK:
        report.complete = item.status === CompletenessStatus.COMPLETE;
        if (!report.complete && item.required) {
          report.issues.push('Required task not complete');
        }
        break;
        
      case WorkItemType.TEST:
        report.testResults = await this.checkTestItem(item);
        report.complete = report.testResults.passing;
        if (!report.complete && item.required) {
          report.issues.push(`Tests failing: ${report.testResults.failed} failures`);
        }
        break;
        
      case WorkItemType.DOCUMENTATION:
        report.docCheck = await this.checkDocumentationItem(item);
        report.complete = report.docCheck.exists && report.docCheck.complete;
        if (!report.complete && item.required) {
          report.issues.push('Required documentation missing or incomplete');
        }
        break;
        
      case WorkItemType.DELIVERABLE:
        report.complete = item.status === CompletenessStatus.COMPLETE;
        if (!report.complete && item.required) {
          report.issues.push('Required deliverable not complete');
        }
        break;
    }
    
    return report;
  }
  
  /**
   * Check test item
   */
  async checkTestItem(item) {
    // Simulate test checking (would integrate with actual test runners)
    return {
      passing: item.status === CompletenessStatus.COMPLETE,
      coverage: item.progress,
      failed: 0,
      passed: item.status === CompletenessStatus.COMPLETE ? 10 : 0,
      skipped: 0
    };
  }
  
  /**
   * Check documentation item
   */
  async checkDocumentationItem(item) {
    // Simulate documentation checking
    return {
      exists: item.status !== CompletenessStatus.NOT_STARTED,
      complete: item.status === CompletenessStatus.COMPLETE,
      sections: [],
      missingRequired: []
    };
  }
  
  /**
   * Check acceptance criteria
   */
  async checkAcceptanceCriteria(work) {
    const criteria = this.acceptanceCriteria.get(work.id) || [];
    const results = [];
    
    for (const criterion of criteria) {
      const result = {
        id: criterion.id,
        description: criterion.description,
        met: false,
        details: ''
      };
      
      // Check criterion (would have actual implementation)
      if (criterion.type === 'automatic') {
        result.met = await this.evaluateCriterion(criterion, work);
      } else {
        // Manual criteria would be checked during validation
        result.met = criterion.verified || false;
      }
      
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Evaluate acceptance criterion
   */
  async evaluateCriterion(criterion, work) {
    // Simple evaluation based on work progress
    if (criterion.threshold) {
      return work.progress >= criterion.threshold;
    }
    
    return work.status === CompletenessStatus.COMPLETE;
  }
  
  /**
   * Calculate overall completeness
   */
  calculateOverallCompleteness(work, report) {
    const overall = {
      status: work.status,
      progress: work.progress,
      isComplete: false,
      canDeprecate: false,
      score: 0
    };
    
    // Check if blocked by dependencies
    if (report.dependencies) {
      const blockedDeps = report.dependencies.filter(d => 
        d.required && !d.met
      );
      if (blockedDeps.length > 0) {
        overall.status = CompletenessStatus.BLOCKED;
        overall.canDeprecate = false;
        return overall;
      }
    }
    
    // Calculate weighted score
    let totalWeight = 0;
    let completedWeight = 0;
    
    report.items.forEach(item => {
      const weight = item.required ? 3 : 1;
      totalWeight += weight;
      
      if (item.complete || item.status === CompletenessStatus.COMPLETE) {
        completedWeight += weight;
      } else if (item.status === CompletenessStatus.PARTIALLY_COMPLETE) {
        completedWeight += weight * (item.progress || 0.5);
      }
    });
    
    overall.score = totalWeight > 0 ? completedWeight / totalWeight : 0;
    overall.progress = overall.score;
    
    // Determine if complete
    if (this.config.strictMode) {
      overall.isComplete = overall.score >= 1.0;
    } else {
      overall.isComplete = overall.score >= this.config.completenessThreshold;
    }
    
    // Determine if can deprecate
    if (overall.isComplete) {
      overall.canDeprecate = true;
      overall.status = CompletenessStatus.COMPLETE;
    } else if (this.config.allowPartialCompletion && overall.score >= 0.8) {
      overall.canDeprecate = true;
      overall.status = CompletenessStatus.PARTIALLY_COMPLETE;
    } else {
      overall.canDeprecate = false;
      overall.status = overall.score > 0.5 ? 
        CompletenessStatus.PARTIALLY_COMPLETE : 
        CompletenessStatus.IN_PROGRESS;
    }
    
    return overall;
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations(work, report) {
    const recommendations = [];
    
    // Check for blocked items
    if (report.overall.status === CompletenessStatus.BLOCKED) {
      recommendations.push({
        priority: 'high',
        action: 'resolve_dependencies',
        message: 'Resolve blocked dependencies before proceeding'
      });
    }
    
    // Check for required incomplete items
    const incompleteRequired = report.items.filter(i => 
      i.required && !i.complete
    );
    
    if (incompleteRequired.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'complete_required',
        message: `Complete ${incompleteRequired.length} required items`,
        items: incompleteRequired.map(i => i.name)
      });
    }
    
    // Check for low test coverage
    const testItems = report.items.filter(i => i.type === WorkItemType.TEST);
    const avgTestProgress = testItems.reduce((sum, t) => sum + (t.progress || 0), 0) / 
                            (testItems.length || 1);
    
    if (avgTestProgress < 0.8) {
      recommendations.push({
        priority: 'medium',
        action: 'improve_testing',
        message: `Increase test coverage to at least 80% (current: ${(avgTestProgress * 100).toFixed(1)}%)`
      });
    }
    
    // Check for missing documentation
    const docItems = report.items.filter(i => i.type === WorkItemType.DOCUMENTATION);
    const missingDocs = docItems.filter(i => !i.complete);
    
    if (missingDocs.length > 0) {
      recommendations.push({
        priority: 'low',
        action: 'complete_documentation',
        message: `Complete ${missingDocs.length} documentation items`,
        items: missingDocs.map(i => i.name)
      });
    }
    
    return recommendations;
  }
  
  /**
   * Check agent completeness
   */
  async checkAgentCompleteness(agentId) {
    const workIds = this.agentWork.get(agentId);
    
    if (!workIds || workIds.size === 0) {
      return {
        agentId,
        hasWork: false,
        canDeprecate: true,
        overall: {
          progress: 1.0,
          isComplete: true
        }
      };
    }
    
    const reports = [];
    let totalProgress = 0;
    let allComplete = true;
    let canDeprecate = true;
    
    for (const workId of workIds) {
      const report = await this.checkCompleteness(workId);
      reports.push(report);
      
      totalProgress += report.overall.progress;
      
      if (!report.overall.isComplete) {
        allComplete = false;
      }
      
      if (!report.overall.canDeprecate) {
        canDeprecate = false;
      }
    }
    
    return {
      agentId,
      hasWork: true,
      workCount: workIds.size,
      reports,
      overall: {
        progress: totalProgress / workIds.size,
        isComplete: allComplete
      },
      canDeprecate
    };
  }
  
  /**
   * Set acceptance criteria
   */
  setAcceptanceCriteria(workId, criteria) {
    this.acceptanceCriteria.set(workId, criteria.map(c => ({
      id: this.generateItemId(),
      ...c
    })));
  }
  
  /**
   * Update statistics
   */
  updateStatistics(report, duration) {
    this.stats.totalChecks++;
    
    if (report.overall.isComplete) {
      this.stats.completeWork++;
    } else if (report.overall.status === CompletenessStatus.BLOCKED) {
      this.stats.blockedWork++;
    } else {
      this.stats.incompleteWork++;
    }
    
    // Update average completeness
    const totalCompleteness = this.stats.averageCompleteness * (this.stats.totalChecks - 1);
    this.stats.averageCompleteness = (totalCompleteness + report.overall.progress) / this.stats.totalChecks;
    
    // Update average check time
    const totalTime = this.stats.averageCheckTime * (this.stats.totalChecks - 1);
    this.stats.averageCheckTime = (totalTime + duration) / this.stats.totalChecks;
  }
  
  /**
   * Generate IDs
   */
  generateWorkId() {
    return `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateItemId() {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      completionRate: this.stats.totalChecks > 0 ?
        (this.stats.completeWork / this.stats.totalChecks * 100).toFixed(1) + '%' :
        '0%'
    };
  }
}

// Export
module.exports = {
  WorkCompletenessChecker,
  CompletenessStatus,
  WorkItemType
};