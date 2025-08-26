/**
 * Enhanced Dependency Management System for BUMBA Framework
 * Handles complex task interdependencies, resource conflicts, and parallel optimization
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Dependency Types
 */
const DependencyType = {
  HARD: 'hard', // Blocking - must complete first
  SOFT: 'soft', // Preferential - better if first
  RESOURCE: 'resource', // Resource lock required
  KNOWLEDGE: 'knowledge', // Information flow required
  TEMPORAL: 'temporal' // Time-based dependency
};

/**
 * Task Status
 */
const TaskStatus = {
  PENDING: 'pending',
  BLOCKED: 'blocked',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

class EnhancedDependencyManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      maxDepth: options.maxDepth || 10,
      cycleDetection: options.cycleDetection !== false,
      autoUnblock: options.autoUnblock !== false,
      priorityWeighting: options.priorityWeighting !== false,
      parallelizationStrategy: options.parallelizationStrategy || 'aggressive',
      conflictResolution: options.conflictResolution || 'priority',
      ...options
    };
    
    // Core data structures
    this.tasks = new Map(); // taskId -> TaskNode
    this.dependencies = new Map(); // taskId -> Dependency[]
    this.reverseDependencies = new Map(); // taskId -> taskId[] (who depends on me)
    this.resourceLocks = new Map(); // resourceId -> taskId
    this.knowledgeGraph = new Map(); // dataType -> { producer: taskId, consumers: taskId[] }
    
    // Execution tracking
    this.executionQueue = [];
    this.blockedTasks = new Set();
    this.runningTasks = new Set();
    this.completedTasks = new Set();
    
    // Analytics
    this.metrics = {
      totalTasks: 0,
      totalDependencies: 0,
      cyclesDetected: 0,
      conflictsResolved: 0,
      parallelizationRatio: 0
    };
    
    // Critical path analysis
    this.criticalPath = [];
    this.executionPlan = null;
    
    logger.info('🟢 Enhanced Dependency Manager initialized');
  }
  
  /**
   * Add a task with comprehensive dependency information
   */
  addTask(taskId, options = {}) {
    const {
      name = taskId,
      description = '',
      specialist = null,
      department = null,
      priority = 5,
      estimatedDuration = null,
      dependencies = [],
      produces = [],
      requires = [],
      resourceRequirements = [],
      metadata = {}
    } = options;
    
    // Check if task already exists
    if (this.tasks.has(taskId)) {
      logger.warn(`Task ${taskId} already exists`);
      return false;
    }
    
    // Create task node
    const taskNode = {
      id: taskId,
      name,
      description,
      specialist,
      department,
      priority,
      estimatedDuration,
      status: TaskStatus.PENDING,
      produces,
      requires,
      resourceRequirements,
      metadata,
      depth: 0,
      criticalityScore: 0,
      addedAt: Date.now()
    };
    
    // Add to tasks map
    this.tasks.set(taskId, taskNode);
    
    // Process dependencies
    const processedDeps = this.processDependencies(taskId, dependencies);
    this.dependencies.set(taskId, processedDeps);
    
    // Update reverse dependencies
    this.updateReverseDependencies(taskId, processedDeps);
    
    // Update knowledge graph
    this.updateKnowledgeGraph(taskId, produces, requires);
    
    // Calculate task depth and criticality
    this.calculateTaskMetrics(taskId);
    
    // Update task status based on dependencies
    this.updateTaskStatus(taskId);
    
    // Update metrics
    this.metrics.totalTasks++;
    this.metrics.totalDependencies += processedDeps.length;
    
    // Emit event
    this.emit('task:added', { task: taskNode, dependencies: processedDeps });
    
    // Recalculate execution plan if auto-planning is enabled
    if (this.config.autoPlanning) {
      this.calculateExecutionPlan();
    }
    
    return true;
  }
  
  /**
   * Process and validate dependencies
   */
  processDependencies(taskId, dependencies) {
    const processed = [];
    
    for (const dep of dependencies) {
      // Handle different dependency formats
      let dependency;
      
      if (typeof dep === 'string') {
        // Simple dependency
        dependency = {
          taskId: dep,
          type: DependencyType.HARD,
          weight: 1.0
        };
      } else {
        // Complex dependency object
        dependency = {
          taskId: dep.taskId || dep.id,
          type: dep.type || DependencyType.HARD,
          weight: dep.weight || 1.0,
          condition: dep.condition || null,
          metadata: dep.metadata || {}
        };
      }
      
      // Validate dependency
      if (this.config.cycleDetection && this.wouldCreateCycle(taskId, dependency.taskId)) {
        logger.error(`Circular dependency detected: ${taskId} -> ${dependency.taskId}`);
        this.metrics.cyclesDetected++;
        throw new Error(`Circular dependency: ${taskId} -> ${dependency.taskId}`);
      }
      
      processed.push(dependency);
    }
    
    return processed;
  }
  
  /**
   * Check for circular dependencies using DFS
   */
  wouldCreateCycle(fromTask, toTask, visited = new Set(), recursionStack = new Set()) {
    // If we're trying to depend on ourselves
    if (fromTask === toTask) {return true;}
    
    // Mark as visited and add to recursion stack
    visited.add(fromTask);
    recursionStack.add(fromTask);
    
    // Get dependencies of the toTask
    const toDeps = this.dependencies.get(toTask) || [];
    
    for (const dep of toDeps) {
      // If the dependency is in our recursion stack, we have a cycle
      if (recursionStack.has(dep.taskId)) {
        return true;
      }
      
      // If not visited, recurse
      if (!visited.has(dep.taskId)) {
        if (this.wouldCreateCycle(fromTask, dep.taskId, visited, recursionStack)) {
          return true;
        }
      }
    }
    
    // Remove from recursion stack before returning
    recursionStack.delete(fromTask);
    
    return false;
  }
  
  /**
   * Update reverse dependency mappings
   */
  updateReverseDependencies(taskId, dependencies) {
    for (const dep of dependencies) {
      if (!this.reverseDependencies.has(dep.taskId)) {
        this.reverseDependencies.set(dep.taskId, []);
      }
      this.reverseDependencies.get(dep.taskId).push(taskId);
    }
  }
  
  /**
   * Update knowledge graph for data dependencies
   */
  updateKnowledgeGraph(taskId, produces, requires) {
    // Register what this task produces
    for (const dataType of produces) {
      if (!this.knowledgeGraph.has(dataType)) {
        this.knowledgeGraph.set(dataType, {
          producer: null,
          consumers: []
        });
      }
      this.knowledgeGraph.get(dataType).producer = taskId;
    }
    
    // Register what this task requires
    for (const dataType of requires) {
      if (!this.knowledgeGraph.has(dataType)) {
        this.knowledgeGraph.set(dataType, {
          producer: null,
          consumers: []
        });
      }
      this.knowledgeGraph.get(dataType).consumers.push(taskId);
      
      // Create knowledge dependency if producer exists
      const knowledge = this.knowledgeGraph.get(dataType);
      if (knowledge.producer && knowledge.producer !== taskId) {
        this.addKnowledgeDependency(taskId, knowledge.producer, dataType);
      }
    }
  }
  
  /**
   * Add a knowledge dependency
   */
  addKnowledgeDependency(consumer, producer, dataType) {
    const deps = this.dependencies.get(consumer) || [];
    
    // Check if dependency already exists
    const exists = deps.some(d => 
      d.taskId === producer && 
      d.type === DependencyType.KNOWLEDGE
    );
    
    if (!exists) {
      deps.push({
        taskId: producer,
        type: DependencyType.KNOWLEDGE,
        weight: 0.8,
        metadata: { dataType }
      });
      this.dependencies.set(consumer, deps);
      
      // Update reverse dependencies
      if (!this.reverseDependencies.has(producer)) {
        this.reverseDependencies.set(producer, []);
      }
      this.reverseDependencies.get(producer).push(consumer);
      
      logger.info(`🟢 Knowledge dependency added: ${consumer} requires ${dataType} from ${producer}`);
    }
  }
  
  /**
   * Calculate task metrics (depth, criticality)
   */
  calculateTaskMetrics(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {return;}
    
    // Calculate depth (longest path from root)
    task.depth = this.calculateDepth(taskId);
    
    // Calculate criticality score
    task.criticalityScore = this.calculateCriticality(taskId);
  }
  
  /**
   * Calculate task depth using DFS
   */
  calculateDepth(taskId, visited = new Set()) {
    if (visited.has(taskId)) {return 0;}
    visited.add(taskId);
    
    const deps = this.dependencies.get(taskId) || [];
    if (deps.length === 0) {return 0;}
    
    let maxDepth = 0;
    for (const dep of deps) {
      if (dep.type === DependencyType.HARD) {
        const depthThroughDep = this.calculateDepth(dep.taskId, visited) + 1;
        maxDepth = Math.max(maxDepth, depthThroughDep);
      }
    }
    
    return maxDepth;
  }
  
  /**
   * Calculate task criticality (impact on overall completion)
   */
  calculateCriticality(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {return 0;}
    
    let score = 0;
    
    // Factor 1: Number of tasks depending on this
    const dependents = this.reverseDependencies.get(taskId) || [];
    score += dependents.length * 10;
    
    // Factor 2: Task priority
    score += task.priority;
    
    // Factor 3: Estimated duration
    if (task.estimatedDuration) {
      score += Math.log(task.estimatedDuration + 1) * 5;
    }
    
    // Factor 4: Depth in dependency graph
    score += (10 - task.depth) * 2;
    
    // Factor 5: Resource requirements
    score += task.resourceRequirements.length * 3;
    
    return score;
  }
  
  /**
   * Update task status based on dependencies
   */
  updateTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {return;}
    
    const deps = this.dependencies.get(taskId) || [];
    
    // Check if all hard dependencies are completed
    const allHardDepsCompleted = deps
      .filter(d => d.type === DependencyType.HARD)
      .every(d => {
        const depTask = this.tasks.get(d.taskId);
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });
    
    // Check resource availability
    const resourcesAvailable = task.resourceRequirements.every(resource => 
      !this.resourceLocks.has(resource) || this.resourceLocks.get(resource) === taskId
    );
    
    // Update status (allow re-evaluation of READY tasks for resource conflicts)
    if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.RUNNING) {
      if (allHardDepsCompleted && resourcesAvailable) {
        task.status = TaskStatus.READY;
        this.blockedTasks.delete(taskId);
        this.emit('task:ready', { taskId, task });
      } else {
        task.status = TaskStatus.BLOCKED;
        this.blockedTasks.add(taskId);
      }
    }
  }
  
  /**
   * Mark a task as completed and update dependent tasks
   */
  async markTaskCompleted(taskId, outputs = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // Update task status
    task.status = TaskStatus.COMPLETED;
    task.completedAt = Date.now();
    task.outputs = outputs;
    
    // Remove from running tasks
    this.runningTasks.delete(taskId);
    this.completedTasks.add(taskId);
    
    // Release resource locks
    for (const resource of task.resourceRequirements) {
      if (this.resourceLocks.get(resource) === taskId) {
        this.resourceLocks.delete(resource);
        this.emit('resource:released', { resource, taskId });
      }
    }
    
    // Update dependent tasks
    const dependents = this.reverseDependencies.get(taskId) || [];
    const unblockedTasks = [];
    
    for (const dependentId of dependents) {
      this.updateTaskStatus(dependentId);
      const dependentTask = this.tasks.get(dependentId);
      if (dependentTask && dependentTask.status === TaskStatus.READY) {
        unblockedTasks.push(dependentId);
      }
    }
    
    // Emit events
    this.emit('task:completed', { taskId, task, outputs });
    
    if (unblockedTasks.length > 0) {
      this.emit('tasks:unblocked', { tasks: unblockedTasks });
    }
    
    // Recalculate metrics
    this.updateMetrics();
    
    return unblockedTasks;
  }
  
  /**
   * Get ready tasks (all dependencies met)
   */
  getReadyTasks() {
    const ready = [];
    
    for (const [taskId, task] of this.tasks) {
      if (task.status === TaskStatus.READY) {
        ready.push({
          id: taskId,
          task,
          priority: task.priority,
          criticality: task.criticalityScore
        });
      }
    }
    
    // Sort by priority and criticality
    ready.sort((a, b) => {
      const scoreA = a.priority + a.criticality;
      const scoreB = b.priority + b.criticality;
      return scoreB - scoreA;
    });
    
    return ready.map(r => r.id);
  }
  
  /**
   * Calculate optimal execution plan
   */
  calculateExecutionPlan() {
    const plan = {
      stages: [],
      criticalPath: [],
      parallelizationOpportunities: [],
      estimatedDuration: 0,
      resourceConflicts: []
    };
    
    // Topological sort for execution order
    const sorted = this.topologicalSort();
    
    // Group into execution stages
    const stages = this.groupIntoStages(sorted);
    plan.stages = stages;
    
    // Calculate critical path
    plan.criticalPath = this.calculateCriticalPath();
    
    // Identify parallelization opportunities
    plan.parallelizationOpportunities = this.findParallelizationOpportunities();
    
    // Estimate total duration
    plan.estimatedDuration = this.estimateProjectDuration();
    
    // Identify resource conflicts
    plan.resourceConflicts = this.identifyResourceConflicts();
    
    this.executionPlan = plan;
    
    this.emit('plan:calculated', plan);
    
    return plan;
  }
  
  /**
   * Topological sort using Kahn's algorithm
   */
  topologicalSort() {
    const sorted = [];
    const inDegree = new Map();
    const queue = [];
    
    // Calculate in-degree for each task
    for (const [taskId] of this.tasks) {
      inDegree.set(taskId, 0);
    }
    
    // Count incoming edges (dependencies) for each task
    for (const [taskId, deps] of this.dependencies) {
      for (const dep of deps) {
        if (dep.type === DependencyType.HARD) {
          // This task depends on dep.taskId, so taskId has an incoming edge
          inDegree.set(taskId, (inDegree.get(taskId) || 0) + 1);
        }
      }
    }
    
    // Find tasks with no incoming edges (no dependencies)
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }
    
    // Process queue
    while (queue.length > 0) {
      const taskId = queue.shift();
      sorted.push(taskId);
      
      // Reduce in-degree for tasks that depend on this one
      const dependents = this.reverseDependencies.get(taskId) || [];
      for (const dependent of dependents) {
        // Only reduce for hard dependencies
        const deps = this.dependencies.get(dependent) || [];
        const isHardDep = deps.some(d => d.taskId === taskId && d.type === DependencyType.HARD);
        
        if (isHardDep) {
          const newDegree = inDegree.get(dependent) - 1;
          inDegree.set(dependent, newDegree);
          
          if (newDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }
    
    return sorted;
  }
  
  /**
   * Group tasks into parallel execution stages
   */
  groupIntoStages(sortedTasks) {
    const stages = [];
    const taskStage = new Map();
    
    for (const taskId of sortedTasks) {
      const deps = this.dependencies.get(taskId) || [];
      
      // Find the maximum stage of dependencies
      let maxDepStage = -1;
      for (const dep of deps) {
        if (dep.type === DependencyType.HARD) {
          const depStage = taskStage.get(dep.taskId) || 0;
          maxDepStage = Math.max(maxDepStage, depStage);
        }
      }
      
      // Assign to next stage
      const stage = maxDepStage + 1;
      taskStage.set(taskId, stage);
      
      // Add to stages array
      if (!stages[stage]) {
        stages[stage] = [];
      }
      stages[stage].push(taskId);
    }
    
    return stages;
  }
  
  /**
   * Calculate critical path (longest dependency chain)
   */
  calculateCriticalPath() {
    const memo = new Map();
    
    const getLongestPath = (taskId) => {
      if (memo.has(taskId)) {
        return memo.get(taskId);
      }
      
      const task = this.tasks.get(taskId);
      if (!task) {return { duration: 0, path: [] };}
      
      const deps = this.dependencies.get(taskId) || [];
      const hardDeps = deps.filter(d => d.type === DependencyType.HARD);
      
      if (hardDeps.length === 0) {
        const result = {
          duration: task.estimatedDuration || 1,
          path: [taskId]
        };
        memo.set(taskId, result);
        return result;
      }
      
      let longestSubPath = { duration: 0, path: [] };
      
      for (const dep of hardDeps) {
        const subPath = getLongestPath(dep.taskId);
        if (subPath.duration > longestSubPath.duration) {
          longestSubPath = subPath;
        }
      }
      
      const result = {
        duration: longestSubPath.duration + (task.estimatedDuration || 1),
        path: [...longestSubPath.path, taskId]
      };
      
      memo.set(taskId, result);
      return result;
    };
    
    // Find critical path from all tasks
    let criticalPath = { duration: 0, path: [] };
    
    for (const [taskId] of this.tasks) {
      const path = getLongestPath(taskId);
      if (path.duration > criticalPath.duration) {
        criticalPath = path;
      }
    }
    
    this.criticalPath = criticalPath.path;
    return criticalPath.path;
  }
  
  /**
   * Find opportunities for parallel execution
   */
  findParallelizationOpportunities() {
    const opportunities = [];
    
    // Group tasks by their dependencies
    const independentGroups = [];
    const visited = new Set();
    
    for (const [taskId] of this.tasks) {
      if (!visited.has(taskId)) {
        const group = this.findIndependentCluster(taskId, visited);
        if (group.length > 1) {
          independentGroups.push(group);
        }
      }
    }
    
    return independentGroups;
  }
  
  /**
   * Find cluster of tasks that can run independently
   */
  findIndependentCluster(startTask, visited) {
    const cluster = [];
    const queue = [startTask];
    
    while (queue.length > 0) {
      const taskId = queue.shift();
      if (visited.has(taskId)) {continue;}
      
      visited.add(taskId);
      cluster.push(taskId);
      
      // Add tasks with same dependencies
      for (const [otherId] of this.tasks) {
        if (!visited.has(otherId) && this.haveSameDependencies(taskId, otherId)) {
          queue.push(otherId);
        }
      }
    }
    
    return cluster;
  }
  
  /**
   * Check if two tasks have the same dependencies
   */
  haveSameDependencies(task1, task2) {
    const deps1 = this.dependencies.get(task1) || [];
    const deps2 = this.dependencies.get(task2) || [];
    
    if (deps1.length !== deps2.length) {return false;}
    
    const depSet1 = new Set(deps1.map(d => d.taskId));
    const depSet2 = new Set(deps2.map(d => d.taskId));
    
    for (const dep of depSet1) {
      if (!depSet2.has(dep)) {return false;}
    }
    
    return true;
  }
  
  /**
   * Estimate total project duration
   */
  estimateProjectDuration() {
    if (this.criticalPath.length === 0) {
      this.calculateCriticalPath();
    }
    
    let totalDuration = 0;
    for (const taskId of this.criticalPath) {
      const task = this.tasks.get(taskId);
      if (task) {
        totalDuration += task.estimatedDuration || 1;
      }
    }
    
    return totalDuration;
  }
  
  /**
   * Identify potential resource conflicts
   */
  identifyResourceConflicts() {
    const conflicts = [];
    const resourceUsage = new Map();
    
    // Build resource usage map
    for (const [taskId, task] of this.tasks) {
      for (const resource of task.resourceRequirements) {
        if (!resourceUsage.has(resource)) {
          resourceUsage.set(resource, []);
        }
        resourceUsage.get(resource).push(taskId);
      }
    }
    
    // Identify conflicts  
    for (const [resource, tasks] of resourceUsage) {
      if (tasks.length > 1) {
        // Check if any tasks can run in parallel (which would cause conflict)
        const parallelTasks = [];
        for (let i = 0; i < tasks.length; i++) {
          for (let j = i + 1; j < tasks.length; j++) {
            if (this.canRunInParallel(tasks[i], tasks[j])) {
              // These tasks could run in parallel but need same resource
              if (!parallelTasks.includes(tasks[i])) {parallelTasks.push(tasks[i]);}
              if (!parallelTasks.includes(tasks[j])) {parallelTasks.push(tasks[j]);}
            }
          }
        }
        
        if (parallelTasks.length > 0) {
          conflicts.push({
            resource,
            tasks: parallelTasks,
            type: 'resource_contention'
          });
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Check if two tasks can run in parallel
   */
  canRunInParallel(task1, task2) {
    // Check if one depends on the other
    const deps1 = this.dependencies.get(task1) || [];
    const deps2 = this.dependencies.get(task2) || [];
    
    // Direct dependency check
    if (deps1.some(d => d.taskId === task2) || deps2.some(d => d.taskId === task1)) {
      return false;
    }
    
    // Transitive dependency check (simplified)
    const ancestors1 = this.getAncestors(task1);
    const ancestors2 = this.getAncestors(task2);
    
    return !ancestors1.has(task2) && !ancestors2.has(task1);
  }
  
  /**
   * Get all ancestor tasks (tasks this depends on)
   */
  getAncestors(taskId, ancestors = new Set()) {
    const deps = this.dependencies.get(taskId) || [];
    
    for (const dep of deps) {
      if (!ancestors.has(dep.taskId)) {
        ancestors.add(dep.taskId);
        this.getAncestors(dep.taskId, ancestors);
      }
    }
    
    return ancestors;
  }
  
  /**
   * Update metrics
   */
  updateMetrics() {
    const total = this.tasks.size;
    const completed = this.completedTasks.size;
    const running = this.runningTasks.size;
    const blocked = this.blockedTasks.size;
    
    this.metrics.parallelizationRatio = total > 0 ? 
      (running + completed) / total : 0;
    
    this.emit('metrics:updated', this.metrics);
  }
  
  /**
   * Generate visualization data
   */
  generateVisualization() {
    return {
      nodes: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        label: task.name,
        status: task.status,
        department: task.department,
        specialist: task.specialist,
        criticality: task.criticalityScore,
        depth: task.depth
      })),
      edges: Array.from(this.dependencies.entries()).flatMap(([from, deps]) =>
        deps.map(dep => ({
          from,
          to: dep.taskId,
          type: dep.type,
          weight: dep.weight
        }))
      ),
      stages: this.executionPlan?.stages || [],
      criticalPath: this.criticalPath,
      metrics: this.metrics
    };
  }
  
  /**
   * Get comprehensive status report
   */
  getStatusReport() {
    const total = this.tasks.size;
    const completed = this.completedTasks.size;
    const running = this.runningTasks.size;
    const blocked = this.blockedTasks.size;
    const ready = Array.from(this.tasks.values())
      .filter(t => t.status === TaskStatus.READY).length;
    
    return {
      summary: {
        total,
        completed,
        running,
        ready,
        blocked,
        pending: total - completed - running - ready - blocked,
        progress: total > 0 ? (completed / total) * 100 : 0
      },
      criticalPath: {
        tasks: this.criticalPath,
        estimatedDuration: this.estimateProjectDuration()
      },
      blockedTasks: Array.from(this.blockedTasks).map(id => {
        const task = this.tasks.get(id);
        const deps = this.dependencies.get(id) || [];
        const blockingTasks = deps
          .filter(d => {
            const depTask = this.tasks.get(d.taskId);
            return depTask && depTask.status !== TaskStatus.COMPLETED;
          })
          .map(d => d.taskId);
        
        return {
          id,
          name: task.name,
          blockingTasks,
          blockingResources: task.resourceRequirements.filter(r => 
            this.resourceLocks.has(r) && this.resourceLocks.get(r) !== id
          )
        };
      }),
      resourceUtilization: Array.from(this.resourceLocks.entries()).map(([resource, taskId]) => ({
        resource,
        lockedBy: taskId,
        task: this.tasks.get(taskId)?.name
      })),
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
  }
  
  /**
   * Generate recommendations for optimization
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check for bottlenecks
    if (this.blockedTasks.size > this.runningTasks.size * 2) {
      recommendations.push({
        type: 'bottleneck',
        message: 'Many tasks are blocked. Consider reviewing dependencies.',
        severity: 'high'
      });
    }
    
    // Check for resource conflicts
    const conflicts = this.identifyResourceConflicts();
    if (conflicts.length > 0) {
      recommendations.push({
        type: 'resource_conflict',
        message: `${conflicts.length} resource conflicts detected`,
        conflicts,
        severity: 'medium'
      });
    }
    
    // Check parallelization opportunities
    const readyTasks = this.getReadyTasks();
    if (readyTasks.length > 3 && this.runningTasks.size < 2) {
      recommendations.push({
        type: 'underutilization',
        message: 'Multiple tasks ready but few running. Increase parallelization.',
        severity: 'low'
      });
    }
    
    return recommendations;
  }
}

module.exports = {
  EnhancedDependencyManager,
  DependencyType,
  TaskStatus
};