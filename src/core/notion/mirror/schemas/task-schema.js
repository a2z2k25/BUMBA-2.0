/**
 * Task Schema and Data Models for Notion Mirror
 * 
 * Defines the structure and relationships of tasks, sprints, and epics
 * with full dependency tracking and metadata support.
 */

class TaskSchema {
  constructor() {
    this.taskCounter = 0;
    this.sprintCounter = 0;
    this.epicCounter = 0;
  }

  /**
   * Create a new Epic (high-level feature or goal)
   */
  createEpic(data) {
    return {
      id: `epic-${++this.epicCounter}`,
      type: 'epic',
      title: data.title,
      description: data.description || '',
      status: 'planning', // planning | active | complete | cancelled
      priority: data.priority || 'P2',
      
      // Timeline
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      estimatedDuration: data.estimatedDuration || null,
      
      // Hierarchy
      sprints: [],
      tasks: [],
      
      // Metrics
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      progress: 0,
      
      // Metadata
      owner: data.owner || 'Product-Strategist',
      stakeholders: data.stakeholders || [],
      labels: data.labels || [],
      
      // Tracking
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      
      // Risk and Dependencies
      risks: [],
      externalDependencies: []
    };
  }

  /**
   * Create a new Sprint (time-boxed work period)
   */
  createSprint(data) {
    return {
      id: `sprint-${++this.sprintCounter}`,
      type: 'sprint',
      name: data.name || `Sprint ${this.sprintCounter}`,
      goal: data.goal || '',
      
      // Timeline
      startDate: data.startDate,
      endDate: data.endDate,
      duration: this.calculateDuration(data.startDate, data.endDate),
      
      // Hierarchy
      epicId: data.epicId || null,
      tasks: [],
      
      // Capacity Planning
      plannedStoryPoints: data.plannedStoryPoints || 0,
      completedStoryPoints: 0,
      velocity: 0,
      
      // Team Allocation
      teamCapacity: {
        'Backend-Engineer': data.backendCapacity || 40,
        'Frontend-Engineer': data.frontendCapacity || 40,
        'Design-Engineer': data.designCapacity || 20,
        'QA-Engineer': data.qaCapacity || 30
      },
      
      // Status Tracking
      status: 'planned', // planned | active | review | complete
      health: 'green', // green | yellow | red
      
      // Metrics
      burndownData: [],
      dailyProgress: [],
      blockers: [],
      
      // Metadata
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
  }

  /**
   * Create a new Task (atomic unit of work)
   */
  createTask(data) {
    const taskId = `task-${++this.taskCounter}`;
    
    return {
      // Identity
      id: taskId,
      type: 'task',
      title: data.title,
      description: data.description || '',
      
      // Status Management
      status: data.status || 'backlog',
      previousStatus: null,
      statusHistory: [{
        status: 'backlog',
        timestamp: new Date().toISOString(),
        updatedBy: 'system'
      }],
      
      // Assignment
      department: data.department || this.inferDepartment(data.title, data.description),
      assignee: data.assignee || null,
      assigneeHistory: [],
      
      // Priority & Estimation
      priority: data.priority || 'P2',
      storyPoints: data.storyPoints || 3,
      estimatedHours: data.estimatedHours || (data.storyPoints * 4),
      actualHours: 0,
      
      // Progress Tracking
      progress: 0,
      progressHistory: [],
      confidence: 'medium', // high | medium | low
      
      // Hierarchy
      epicId: data.epicId || null,
      sprintId: data.sprintId || null,
      parentTaskId: data.parentTaskId || null,
      subtasks: [],
      
      // Dependencies
      dependencies: {
        blockedBy: data.blockedBy || [], // Task IDs that must complete first
        blocks: [], // Task IDs waiting on this task
        external: data.externalDependencies || [] // External system dependencies
      },
      
      // Timeline
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      dueDate: data.dueDate || null,
      
      // Quality & Testing
      acceptanceCriteria: data.acceptanceCriteria || [],
      testCoverage: 0,
      testResults: null,
      codeReviewStatus: 'pending', // pending | in-progress | approved | rejected
      
      // Artifacts & Documentation
      relatedDocuments: [],
      codeChanges: [],
      pullRequests: [],
      commits: [],
      
      // Activity & Comments
      activity: [],
      comments: [],
      
      // Metadata
      labels: data.labels || [],
      customFields: data.customFields || {},
      
      // Validation
      isValid: true,
      validationErrors: []
    };
  }

  /**
   * Create task relationships and dependencies
   */
  createDependency(fromTaskId, toTaskId, type = 'blocks') {
    return {
      id: `dep-${fromTaskId}-${toTaskId}`,
      from: fromTaskId,
      to: toTaskId,
      type: type, // blocks | requires | related
      strength: 'hard', // hard | soft | optional
      created: new Date().toISOString(),
      validated: false,
      description: ''
    };
  }

  /**
   * Create a task activity log entry
   */
  createActivity(taskId, activity) {
    return {
      id: `activity-${Date.now()}`,
      taskId: taskId,
      type: activity.type, // status_change | comment | assignment | progress_update
      actor: activity.actor,
      timestamp: new Date().toISOString(),
      details: activity.details,
      oldValue: activity.oldValue || null,
      newValue: activity.newValue || null,
      automated: activity.automated || false
    };
  }

  /**
   * Infer department from task content
   */
  inferDepartment(title, description) {
    const content = `${title} ${description}`.toLowerCase();
    
    const patterns = {
      'Backend-Engineer': ['api', 'backend', 'database', 'server', 'endpoint', 'authentication'],
      'Frontend-Engineer': ['ui', 'frontend', 'component', 'react', 'interface', 'css'],
      'Design-Engineer': ['design', 'ux', 'mockup', 'figma', 'prototype', 'wireframe'],
      'QA-Engineer': ['test', 'qa', 'quality', 'bug', 'validation', 'coverage'],
      'DevOps-Engineer': ['deploy', 'ci/cd', 'infrastructure', 'docker', 'kubernetes', 'aws']
    };
    
    for (const [dept, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return dept;
      }
    }
    
    return 'Product-Strategist'; // Default
  }

  /**
   * Calculate sprint duration in days
   */
  calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Validate task data
   */
  validateTask(task) {
    const errors = [];
    
    if (!task.title || task.title.length === 0) {
      errors.push('Task title is required');
    }
    
    if (task.title && task.title.length > 100) {
      errors.push('Task title must be less than 100 characters');
    }
    
    if (task.description && task.description.length > 2000) {
      errors.push('Task description must be less than 2000 characters');
    }
    
    if (task.storyPoints && (task.storyPoints < 1 || task.storyPoints > 21)) {
      errors.push('Story points must be between 1 and 21');
    }
    
    if (task.progress && (task.progress < 0 || task.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
    }
    
    // Check for circular dependencies
    if (task.dependencies?.blockedBy?.includes(task.id)) {
      errors.push('Task cannot depend on itself');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Calculate task metrics
   */
  calculateTaskMetrics(task) {
    return {
      // Time metrics
      cycleTime: task.completedAt && task.startedAt ? 
        (new Date(task.completedAt) - new Date(task.startedAt)) / (1000 * 60 * 60) : null,
      leadTime: task.completedAt && task.createdAt ?
        (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60) : null,
      
      // Efficiency metrics
      estimateAccuracy: task.actualHours && task.estimatedHours ?
        (task.estimatedHours / task.actualHours) * 100 : null,
      
      // Dependency metrics
      blockingScore: task.dependencies.blocks.length,
      dependencyDepth: this.calculateDependencyDepth(task),
      
      // Risk score
      riskScore: this.calculateRiskScore(task)
    };
  }

  /**
   * Calculate dependency depth (longest chain)
   */
  calculateDependencyDepth(task, visited = new Set()) {
    if (visited.has(task.id)) return 0;
    visited.add(task.id);
    
    if (!task.dependencies.blockedBy || task.dependencies.blockedBy.length === 0) {
      return 0;
    }
    
    // In real implementation, would look up actual task objects
    return 1 + Math.max(...task.dependencies.blockedBy.map(() => 0));
  }

  /**
   * Calculate risk score for a task
   */
  calculateRiskScore(task) {
    let score = 0;
    
    // Priority risk
    const priorityScores = { 'P0': 4, 'P1': 3, 'P2': 2, 'P3': 1 };
    score += priorityScores[task.priority] || 0;
    
    // Dependency risk
    score += task.dependencies.blockedBy.length * 0.5;
    score += task.dependencies.blocks.length * 0.3;
    
    // Time risk
    if (task.dueDate) {
      const daysUntilDue = (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 1) score += 3;
      else if (daysUntilDue < 3) score += 2;
      else if (daysUntilDue < 7) score += 1;
    }
    
    // Progress risk
    if (task.status === 'blocked') score += 3;
    if (task.progress < 50 && task.status === 'in_progress') score += 1;
    
    return Math.min(10, score); // Cap at 10
  }
}

module.exports = TaskSchema;