/**
 * BUMBA Framework - Sprint Decomposition System
 * Breaks down large tasks into 10-minute executable sprints to prevent context rot
 * @module src/core/planning/sprint-decomposition-system
 * @version 2.0.0
 */

const { logger } = require('../logging/bumba-logger');
const BumbaError = require('../error-handling/bumba-error-system');
const { EventEmitter } = require('events');

/**
 * Sprint Decomposition System
 * Implements the 10-minute sprint methodology for all manager agents
 */
class SprintDecompositionSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxSprintDuration: config.maxSprintDuration || 10, // minutes
      minSprintDuration: config.minSprintDuration || 3, // minutes
      maxSprintsPerProject: config.maxSprintsPerProject || 50,
      enableParallelSprints: config.enableParallelSprints !== false,
      requireSprintPlanning: config.requireSprintPlanning !== false,
      ...config
    };
    
    // Sprint tracking
    this.activeSprints = new Map();
    this.completedSprints = new Map();
    this.sprintQueue = [];
    
    // Sprint templates for consistent planning
    this.sprintTemplates = this.initializeSprintTemplates();
    
    logger.info('🟢 Sprint Decomposition System initialized');
  }
  
  /**
   * Initialize sprint templates for different task types
   */
  initializeSprintTemplates() {
    return {
      analysis: {
        duration: 5,
        type: 'analysis',
        outputs: ['requirements', 'constraints', 'approach'],
        template: 'Analyze {target} and identify key {aspects}'
      },
      planning: {
        duration: 8,
        type: 'planning',
        outputs: ['project_plan', 'sprint_breakdown', 'resource_allocation'],
        template: 'Create detailed plan for {objective}'
      },
      implementation: {
        duration: 10,
        type: 'implementation',
        outputs: ['code', 'tests', 'documentation'],
        template: 'Implement {feature} with {specifications}'
      },
      review: {
        duration: 5,
        type: 'review',
        outputs: ['feedback', 'approval_status', 'improvements'],
        template: 'Review {deliverable} for {criteria}'
      },
      testing: {
        duration: 7,
        type: 'testing',
        outputs: ['test_results', 'coverage_report', 'issues'],
        template: 'Test {component} with {test_suite}'
      },
      documentation: {
        duration: 6,
        type: 'documentation',
        outputs: ['docs', 'examples', 'api_reference'],
        template: 'Document {subject} with {detail_level}'
      }
    };
  }
  
  /**
   * Decompose a large task into 10-minute sprints
   * @param {Object} task - The task to decompose
   * @param {Object} context - Task context and constraints
   * @returns {Object} Sprint plan with breakdown
   */
  async decomposeIntoSprints(task, context = {}) {
    logger.info(`🟢 Decomposing task into 10-minute sprints: ${task.title || task.description}`);
    
    try {
      // Step 1: Analyze task complexity
      const complexity = await this.analyzeTaskComplexity(task);
      
      // Step 2: Identify task components
      const components = this.identifyTaskComponents(task, complexity);
      
      // Step 3: Create sprint breakdown
      const sprints = this.createSprintBreakdown(components, context);
      
      // Step 4: Optimize sprint sequence
      const optimizedSprints = this.optimizeSprintSequence(sprints);
      
      // Step 5: Assign sprint dependencies
      const sprintPlan = this.assignSprintDependencies(optimizedSprints);
      
      // Step 6: Validate sprint plan
      const validation = await this.validateSprintPlan(sprintPlan);
      
      if (!validation.valid) {
        throw new BumbaError('SPRINT_PLAN_INVALID', 'Sprint plan validation failed', validation.errors);
      }
      
      const result = {
        projectId: `project-${Date.now()}`,
        task: {
          title: task.title || task.description,
          complexity: complexity,
          estimatedTotalTime: sprintPlan.totalDuration
        },
        sprintPlan: sprintPlan,
        metadata: {
          createdAt: new Date().toISOString(),
          totalSprints: sprintPlan.sprints.length,
          parallelizable: sprintPlan.parallelGroups.length > 0,
          estimatedCompletion: this.calculateCompletionTime(sprintPlan)
        }
      };
      
      this.emit('sprint-plan-created', result);
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to decompose task: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze task complexity to determine sprint count
   */
  async analyzeTaskComplexity(task) {
    const factors = {
      scope: 1,
      technical: 1,
      dependencies: 1,
      uncertainty: 1
    };
    
    // Analyze scope
    const description = task.description || task.title || '';
    const wordCount = description.split(' ').length;
    factors.scope = Math.min(wordCount / 20, 3); // Normalize to 1-3
    
    // Analyze technical complexity
    const technicalKeywords = ['architecture', 'integration', 'security', 'performance', 'scale'];
    const technicalMatches = technicalKeywords.filter(kw => 
      description.toLowerCase().includes(kw)
    ).length;
    factors.technical = 1 + (technicalMatches * 0.5);
    
    // Analyze dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      factors.dependencies = 1 + (task.dependencies.length * 0.3);
    }
    
    // Calculate overall complexity
    const complexity = Object.values(factors).reduce((a, b) => a * b, 1);
    
    return {
      score: complexity,
      level: complexity < 2 ? 'simple' : complexity < 5 ? 'moderate' : 'complex',
      factors: factors,
      estimatedSprints: Math.ceil(complexity * 2)
    };
  }
  
  /**
   * Identify task components that can be sprint-ized
   */
  identifyTaskComponents(task, complexity) {
    const components = [];
    
    // Standard component phases
    const phases = [
      { name: 'understanding', type: 'analysis', priority: 1 },
      { name: 'planning', type: 'planning', priority: 2 },
      { name: 'implementation', type: 'implementation', priority: 3 },
      { name: 'testing', type: 'testing', priority: 4 },
      { name: 'review', type: 'review', priority: 5 }
    ];
    
    // Add components based on task description
    phases.forEach(phase => {
      if (this.shouldIncludePhase(task, phase)) {
        components.push({
          ...phase,
          description: `${phase.name} phase for ${task.title || 'task'}`,
          estimatedDuration: this.estimatePhaseDuration(phase, complexity)
        });
      }
    });
    
    // Break down large components into smaller ones
    const refinedComponents = [];
    components.forEach(component => {
      if (component.estimatedDuration > this.config.maxSprintDuration) {
        const subComponents = this.breakDownComponent(component);
        refinedComponents.push(...subComponents);
      } else {
        refinedComponents.push(component);
      }
    });
    
    return refinedComponents;
  }
  
  /**
   * Create sprint breakdown from components
   */
  createSprintBreakdown(components, context) {
    const sprints = [];
    let sprintId = 1;
    
    components.forEach(component => {
      const template = this.sprintTemplates[component.type] || this.sprintTemplates.implementation;
      
      const sprint = {
        id: `sprint-${sprintId++}`,
        title: `Sprint ${sprintId - 1}: ${component.name}`,
        description: component.description,
        type: component.type,
        duration: Math.min(component.estimatedDuration, this.config.maxSprintDuration),
        priority: component.priority,
        deliverables: template.outputs,
        acceptanceCriteria: this.generateAcceptanceCriteria(component),
        assignedTo: null, // Will be assigned by manager
        status: 'planned',
        dependencies: [],
        parallelizable: this.isParallelizable(component)
      };
      
      sprints.push(sprint);
    });
    
    return sprints;
  }
  
  /**
   * Optimize sprint sequence for efficiency
   */
  optimizeSprintSequence(sprints) {
    // Sort by priority first
    sprints.sort((a, b) => a.priority - b.priority);
    
    // Identify parallel opportunities
    const parallelGroups = [];
    const processed = new Set();
    
    sprints.forEach(sprint => {
      if (processed.has(sprint.id)) {return;}
      
      if (sprint.parallelizable) {
        const group = [sprint];
        processed.add(sprint.id);
        
        // Find other sprints that can run in parallel
        sprints.forEach(otherSprint => {
          if (!processed.has(otherSprint.id) && 
              otherSprint.parallelizable && 
              otherSprint.priority === sprint.priority) {
            group.push(otherSprint);
            processed.add(otherSprint.id);
          }
        });
        
        if (group.length > 1) {
          parallelGroups.push(group);
        }
      }
    });
    
    // Reorder sprints with parallel groups
    const optimized = [];
    sprints.forEach(sprint => {
      if (!processed.has(sprint.id) || parallelGroups.flat().includes(sprint)) {
        optimized.push(sprint);
      }
    });
    
    return {
      sprints: optimized,
      parallelGroups: parallelGroups
    };
  }
  
  /**
   * Assign dependencies between sprints
   */
  assignSprintDependencies(sprintData) {
    const { sprints, parallelGroups } = sprintData;
    
    // Assign sequential dependencies
    for (let i = 1; i < sprints.length; i++) {
      const currentSprint = sprints[i];
      const previousSprint = sprints[i - 1];
      
      // Don't create dependency if sprints are in same parallel group
      const inSameGroup = parallelGroups.some(group => 
        group.includes(currentSprint) && group.includes(previousSprint)
      );
      
      if (!inSameGroup && currentSprint.priority > previousSprint.priority) {
        currentSprint.dependencies.push(previousSprint.id);
      }
    }
    
    // Calculate total duration
    const totalDuration = this.calculateTotalDuration(sprints, parallelGroups);
    
    return {
      sprints: sprints,
      parallelGroups: parallelGroups,
      totalDuration: totalDuration,
      criticalPath: this.findCriticalPath(sprints)
    };
  }
  
  /**
   * Validate sprint plan
   */
  async validateSprintPlan(sprintPlan) {
    const errors = [];
    const warnings = [];
    
    // Check total sprint count
    if (sprintPlan.sprints.length > this.config.maxSprintsPerProject) {
      errors.push(`Too many sprints: ${sprintPlan.sprints.length} > ${this.config.maxSprintsPerProject}`);
    }
    
    // Check individual sprint durations
    sprintPlan.sprints.forEach(sprint => {
      if (sprint.duration > this.config.maxSprintDuration) {
        errors.push(`Sprint ${sprint.id} exceeds max duration: ${sprint.duration} minutes`);
      }
      if (sprint.duration < this.config.minSprintDuration) {
        warnings.push(`Sprint ${sprint.id} is very short: ${sprint.duration} minutes`);
      }
    });
    
    // Check for circular dependencies
    const hasCycles = this.detectCycles(sprintPlan.sprints);
    if (hasCycles) {
      errors.push('Circular dependencies detected in sprint plan');
    }
    
    // Check deliverables
    sprintPlan.sprints.forEach(sprint => {
      if (!sprint.deliverables || sprint.deliverables.length === 0) {
        warnings.push(`Sprint ${sprint.id} has no defined deliverables`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
  
  /**
   * Execute a sprint
   */
  async executeSprint(sprintId, agent) {
    const sprint = this.activeSprints.get(sprintId) || 
                  this.sprintQueue.find(s => s.id === sprintId);
    
    if (!sprint) {
      throw new BumbaError('SPRINT_NOT_FOUND', `Sprint ${sprintId} not found`);
    }
    
    logger.info(`🟢 Executing ${sprint.duration}-minute sprint: ${sprint.title}`);
    
    // Track sprint start
    sprint.startTime = Date.now();
    sprint.status = 'in_progress';
    sprint.assignedTo = agent.id;
    this.activeSprints.set(sprintId, sprint);
    
    this.emit('sprint-started', {
      sprintId: sprintId,
      agent: agent.id,
      estimatedCompletion: new Date(Date.now() + sprint.duration * 60000)
    });
    
    // Sprint execution placeholder (actual work done by agent)
    const result = {
      sprintId: sprintId,
      status: 'completed',
      duration: sprint.duration,
      deliverables: sprint.deliverables,
      completedBy: agent.id,
      completedAt: new Date().toISOString()
    };
    
    // Move to completed
    this.completedSprints.set(sprintId, { ...sprint, ...result });
    this.activeSprints.delete(sprintId);
    
    this.emit('sprint-completed', result);
    
    return result;
  }
  
  /**
   * Helper: Should include phase in sprint plan
   */
  shouldIncludePhase(task, phase) {
    const description = (task.description || task.title || '').toLowerCase();
    
    const phaseKeywords = {
      analysis: ['analyze', 'understand', 'investigate', 'research'],
      planning: ['plan', 'design', 'architect', 'structure'],
      implementation: ['implement', 'build', 'create', 'develop', 'code'],
      testing: ['test', 'validate', 'verify', 'check'],
      review: ['review', 'approve', 'evaluate', 'assess']
    };
    
    const keywords = phaseKeywords[phase.type] || [];
    return keywords.some(kw => description.includes(kw)) || 
           phase.priority <= 3; // Always include core phases
  }
  
  /**
   * Helper: Estimate phase duration
   */
  estimatePhaseDuration(phase, complexity) {
    const baseTemplate = this.sprintTemplates[phase.type];
    const baseDuration = baseTemplate ? baseTemplate.duration : 8;
    
    // Adjust based on complexity
    const complexityMultiplier = complexity.level === 'simple' ? 0.7 :
                                 complexity.level === 'moderate' ? 1.0 : 1.5;
    
    return Math.round(baseDuration * complexityMultiplier);
  }
  
  /**
   * Helper: Break down large component
   */
  breakDownComponent(component) {
    const subComponents = [];
    const subCount = Math.ceil(component.estimatedDuration / this.config.maxSprintDuration);
    
    for (let i = 0; i < subCount; i++) {
      subComponents.push({
        ...component,
        name: `${component.name} (Part ${i + 1}/${subCount})`,
        estimatedDuration: Math.min(
          this.config.maxSprintDuration,
          component.estimatedDuration - (i * this.config.maxSprintDuration)
        )
      });
    }
    
    return subComponents;
  }
  
  /**
   * Helper: Generate acceptance criteria
   */
  generateAcceptanceCriteria(component) {
    const criteria = [];
    
    switch (component.type) {
      case 'analysis':
        criteria.push('Clear problem statement defined');
        criteria.push('All constraints identified');
        criteria.push('Solution approach documented');
        break;
      case 'planning':
        criteria.push('Detailed plan created');
        criteria.push('Resources allocated');
        criteria.push('Timeline established');
        break;
      case 'implementation':
        criteria.push('Code implemented and functional');
        criteria.push('Follows coding standards');
        criteria.push('Basic tests included');
        break;
      case 'testing':
        criteria.push('All tests passing');
        criteria.push('Coverage meets requirements');
        criteria.push('Edge cases handled');
        break;
      case 'review':
        criteria.push('Code reviewed for quality');
        criteria.push('Feedback incorporated');
        criteria.push('Approval obtained');
        break;
      default:
        criteria.push('Sprint objectives met');
        criteria.push('Deliverables completed');
    }
    
    return criteria;
  }
  
  /**
   * Helper: Check if component is parallelizable
   */
  isParallelizable(component) {
    const parallelTypes = ['testing', 'documentation', 'analysis'];
    return parallelTypes.includes(component.type) && 
           component.priority > 2;
  }
  
  /**
   * Helper: Calculate total duration
   */
  calculateTotalDuration(sprints, parallelGroups) {
    let totalDuration = 0;
    const processedIds = new Set();
    
    // Add sequential sprint durations
    sprints.forEach(sprint => {
      if (!processedIds.has(sprint.id)) {
        // Check if sprint is in a parallel group
        const inGroup = parallelGroups.find(group => 
          group.some(s => s.id === sprint.id)
        );
        
        if (inGroup) {
          // Only count the longest sprint in the group once
          const maxDuration = Math.max(...inGroup.map(s => s.duration));
          totalDuration += maxDuration;
          inGroup.forEach(s => processedIds.add(s.id));
        } else {
          totalDuration += sprint.duration;
          processedIds.add(sprint.id);
        }
      }
    });
    
    return totalDuration;
  }
  
  /**
   * Helper: Find critical path
   */
  findCriticalPath(sprints) {
    // Simple critical path: longest sequence of dependent sprints
    const path = [];
    const sprintMap = new Map(sprints.map(s => [s.id, s]));
    
    // Find sprints with no dependencies (start points)
    const startSprints = sprints.filter(s => s.dependencies.length === 0);
    
    startSprints.forEach(start => {
      const currentPath = [start.id];
      let current = start;
      
      // Follow dependencies
      while (true) {
        const nextSprint = sprints.find(s => 
          s.dependencies.includes(current.id)
        );
        
        if (!nextSprint) {break;}
        
        currentPath.push(nextSprint.id);
        current = nextSprint;
      }
      
      if (currentPath.length > path.length) {
        path.splice(0, path.length, ...currentPath);
      }
    });
    
    return path;
  }
  
  /**
   * Helper: Detect cycles in dependencies
   */
  detectCycles(sprints) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (sprintId) => {
      visited.add(sprintId);
      recursionStack.add(sprintId);
      
      const sprint = sprints.find(s => s.id === sprintId);
      if (!sprint) {return false;}
      
      for (const depId of sprint.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {return true;}
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
      
      recursionStack.delete(sprintId);
      return false;
    };
    
    for (const sprint of sprints) {
      if (!visited.has(sprint.id)) {
        if (hasCycle(sprint.id)) {return true;}
      }
    }
    
    return false;
  }
  
  /**
   * Helper: Calculate completion time
   */
  calculateCompletionTime(sprintPlan) {
    const now = Date.now();
    const totalMinutes = sprintPlan.totalDuration;
    return new Date(now + totalMinutes * 60000).toISOString();
  }
  
  /**
   * Get sprint status report
   */
  getSprintStatus() {
    return {
      active: Array.from(this.activeSprints.values()),
      completed: Array.from(this.completedSprints.values()),
      queued: this.sprintQueue,
      statistics: {
        totalActive: this.activeSprints.size,
        totalCompleted: this.completedSprints.size,
        totalQueued: this.sprintQueue.length,
        averageCompletionTime: this.calculateAverageCompletionTime()
      }
    };
  }
  
  /**
   * Helper: Calculate average completion time
   */
  calculateAverageCompletionTime() {
    const completed = Array.from(this.completedSprints.values());
    if (completed.length === 0) {return 0;}
    
    const totalDuration = completed.reduce((sum, sprint) => 
      sum + sprint.duration, 0
    );
    
    return totalDuration / completed.length;
  }
}

module.exports = SprintDecompositionSystem;