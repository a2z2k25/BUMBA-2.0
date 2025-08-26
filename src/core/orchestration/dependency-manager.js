/**
 * BUMBA Dependency Management System
 * Manages task dependencies, prevents violations, and optimizes execution order
 * @module dependency-manager
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class DependencyManager extends EventEmitter {
  constructor() {
    super();
    
    // Core data structures
    this.dependencyGraph = new Map(); // task -> { depends_on: [], enables: [] }
    this.taskStatus = new Map(); // task -> status
    this.executionQueue = [];
    this.blockedTasks = new Map(); // task -> blocking_tasks[]
    this.criticalPath = [];
    
    // Configuration
    this.config = {
      maxDepth: 10, // Maximum dependency chain depth
      cycleDetection: true,
      autoUnblock: true,
      priorityWeighting: true
    };
    
    logger.info('🟢 Dependency Manager initialized');
  }
  
  /**
   * Add a task with its dependencies
   */
  addTask(taskId, dependencies = [], metadata = {}) {
    if (this.dependencyGraph.has(taskId)) {
      logger.warn(`Task ${taskId} already exists in dependency graph`);
      return false;
    }
    
    // Check for circular dependencies before adding
    if (this.wouldCreateCycle(taskId, dependencies)) {
      throw new Error(`Adding task ${taskId} would create circular dependency`);
    }
    
    // Add to graph
    this.dependencyGraph.set(taskId, {
      depends_on: dependencies,
      enables: [],
      metadata: metadata,
      depth: this.calculateDepth(dependencies)
    });
    
    // Update reverse dependencies (enables)
    dependencies.forEach(depId => {
      const dep = this.dependencyGraph.get(depId);
      if (dep) {
        dep.enables.push(taskId);
      }
    });
    
    // Set initial status
    const status = dependencies.length === 0 ? 'ready' : 'blocked';
    this.taskStatus.set(taskId, status);
    
    // Update blocked tasks tracking
    if (status === 'blocked') {
      this.blockedTasks.set(taskId, [...dependencies]);
    }
    
    // Recalculate critical path
    this.updateCriticalPath();
    
    this.emit('task:added', { taskId, dependencies, status });
    
    return true;
  }
  
  /**
   * Check if adding a task would create a cycle
   */
  wouldCreateCycle(taskId, dependencies) {
    // Temporary add to check
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (currentId, deps) => {
      visited.add(currentId);
      recursionStack.add(currentId);
      
      for (const depId of deps) {
        if (depId === taskId) {
          return true; // Direct cycle
        }
        
        if (!visited.has(depId)) {
          const depNode = this.dependencyGraph.get(depId);
          if (depNode && hasCycle(depId, depNode.depends_on)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
      
      recursionStack.delete(currentId);
      return false;
    };
    
    return hasCycle(taskId, dependencies);
  }
  
  /**
   * Calculate depth of a task in the dependency tree
   */
  calculateDepth(dependencies) {
    if (dependencies.length === 0) {return 0;}
    
    let maxDepth = 0;
    for (const depId of dependencies) {
      const dep = this.dependencyGraph.get(depId);
      if (dep) {
        maxDepth = Math.max(maxDepth, (dep.depth || 0) + 1);
      }
    }
    
    if (maxDepth > this.config.maxDepth) {
      logger.warn(`Task depth ${maxDepth} exceeds maximum ${this.config.maxDepth}`);
    }
    
    return maxDepth;
  }
  
  /**
   * Check if a task can be executed (all dependencies met)
   */
  canExecute(taskId) {
    const task = this.dependencyGraph.get(taskId);
    if (!task) {return false;}
    
    // Check all dependencies are completed
    for (const depId of task.depends_on) {
      const depStatus = this.taskStatus.get(depId);
      if (depStatus !== 'completed') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Mark a task as completed and update dependent tasks
   */
  markCompleted(taskId) {
    const currentStatus = this.taskStatus.get(taskId);
    if (currentStatus === 'completed') {
      logger.warn(`Task ${taskId} already marked as completed`);
      return;
    }
    
    // Update status
    this.taskStatus.set(taskId, 'completed');
    
    // Get task info
    const task = this.dependencyGraph.get(taskId);
    if (!task) {return;}
    
    // Check and unblock dependent tasks
    const unblockedTasks = [];
    for (const enabledId of task.enables) {
      // Remove this task from the blocked list
      if (this.blockedTasks.has(enabledId)) {
        const blockers = this.blockedTasks.get(enabledId);
        const index = blockers.indexOf(taskId);
        if (index > -1) {
          blockers.splice(index, 1);
          
          // If no more blockers, mark as ready
          if (blockers.length === 0) {
            this.taskStatus.set(enabledId, 'ready');
            this.blockedTasks.delete(enabledId);
            unblockedTasks.push(enabledId);
          }
        }
      }
    }
    
    // Update critical path
    this.updateCriticalPath();
    
    // Emit events
    this.emit('task:completed', { taskId });
    
    if (unblockedTasks.length > 0) {
      this.emit('tasks:unblocked', { tasks: unblockedTasks });
      
      // Auto-add to execution queue if configured
      if (this.config.autoUnblock) {
        unblockedTasks.forEach(id => this.addToQueue(id));
      }
    }
    
    return unblockedTasks;
  }
  
  /**
   * Get all tasks that are ready to execute
   */
  getReadyTasks() {
    const ready = [];
    
    for (const [taskId, status] of this.taskStatus) {
      if (status === 'ready' && this.canExecute(taskId)) {
        ready.push(taskId);
      }
    }
    
    // Sort by priority if configured
    if (this.config.priorityWeighting) {
      ready.sort((a, b) => {
        const taskA = this.dependencyGraph.get(a);
        const taskB = this.dependencyGraph.get(b);
        
        // Prioritize tasks on critical path
        const aCritical = this.criticalPath.includes(a);
        const bCritical = this.criticalPath.includes(b);
        if (aCritical && !bCritical) {return -1;}
        if (!aCritical && bCritical) {return 1;}
        
        // Then by depth (shallower first)
        return (taskA.depth || 0) - (taskB.depth || 0);
      });
    }
    
    return ready;
  }
  
  /**
   * Get parallel execution groups
   */
  getParallelGroups() {
    const groups = [];
    const processed = new Set();
    
    // Group tasks by depth
    const depthGroups = new Map();
    for (const [taskId, task] of this.dependencyGraph) {
      const depth = task.depth || 0;
      if (!depthGroups.has(depth)) {
        depthGroups.set(depth, []);
      }
      depthGroups.get(depth).push(taskId);
    }
    
    // Sort depths and create execution groups
    const depths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
    
    for (const depth of depths) {
      const tasksAtDepth = depthGroups.get(depth);
      const readyAtDepth = tasksAtDepth.filter(id => {
        const status = this.taskStatus.get(id);
        return status === 'ready' || status === 'completed';
      });
      
      if (readyAtDepth.length > 0) {
        groups.push({
          depth,
          tasks: readyAtDepth,
          parallel: true,
          estimatedDuration: this.estimateGroupDuration(readyAtDepth)
        });
      }
    }
    
    return groups;
  }
  
  /**
   * Calculate critical path (longest dependency chain)
   */
  updateCriticalPath() {
    const paths = [];
    const visited = new Set();
    
    // Find all root tasks (no dependencies)
    const roots = [];
    for (const [taskId, task] of this.dependencyGraph) {
      if (task.depends_on.length === 0) {
        roots.push(taskId);
      }
    }
    
    // DFS to find all paths
    const findPaths = (taskId, currentPath = []) => {
      currentPath.push(taskId);
      visited.add(taskId);
      
      const task = this.dependencyGraph.get(taskId);
      if (task.enables.length === 0) {
        // Leaf node - save path
        paths.push([...currentPath]);
      } else {
        // Continue down the tree
        for (const enabledId of task.enables) {
          if (!visited.has(enabledId)) {
            findPaths(enabledId, currentPath);
          }
        }
      }
      
      currentPath.pop();
      visited.delete(taskId);
    };
    
    // Find all paths from roots
    roots.forEach(root => findPaths(root));
    
    // Find longest path
    let longestPath = [];
    let maxLength = 0;
    
    for (const path of paths) {
      const length = this.calculatePathDuration(path);
      if (length > maxLength) {
        maxLength = length;
        longestPath = path;
      }
    }
    
    this.criticalPath = longestPath;
    
    return {
      path: longestPath,
      duration: maxLength
    };
  }
  
  /**
   * Calculate total duration of a path
   */
  calculatePathDuration(path) {
    let totalDuration = 0;
    
    for (const taskId of path) {
      const task = this.dependencyGraph.get(taskId);
      if (task && task.metadata) {
        totalDuration += task.metadata.estimatedDuration || 10;
      }
    }
    
    return totalDuration;
  }
  
  /**
   * Estimate duration for a group of parallel tasks
   */
  estimateGroupDuration(taskIds) {
    let maxDuration = 0;
    
    for (const taskId of taskIds) {
      const task = this.dependencyGraph.get(taskId);
      if (task && task.metadata) {
        maxDuration = Math.max(maxDuration, task.metadata.estimatedDuration || 10);
      }
    }
    
    return maxDuration;
  }
  
  /**
   * Add task to execution queue
   */
  addToQueue(taskId, priority = 5) {
    if (!this.canExecute(taskId)) {
      logger.warn(`Cannot queue task ${taskId} - dependencies not met`);
      return false;
    }
    
    // Add with priority
    this.executionQueue.push({ taskId, priority });
    
    // Sort by priority
    this.executionQueue.sort((a, b) => a.priority - b.priority);
    
    this.emit('task:queued', { taskId, priority });
    
    return true;
  }
  
  /**
   * Get next task from queue
   */
  getNextTask() {
    while (this.executionQueue.length > 0) {
      const { taskId } = this.executionQueue.shift();
      
      // Double-check it's still ready
      if (this.canExecute(taskId)) {
        return taskId;
      }
    }
    
    return null;
  }
  
  /**
   * Validate entire dependency graph
   */
  validate() {
    const errors = [];
    const warnings = [];
    
    // Check for cycles
    if (this.hasCycles()) {
      errors.push('Circular dependencies detected');
    }
    
    // Check for orphaned tasks
    for (const [taskId, task] of this.dependencyGraph) {
      if (task.depends_on.length === 0 && task.enables.length === 0) {
        warnings.push(`Task ${taskId} is orphaned (no dependencies or dependents)`);
      }
    }
    
    // Check for missing dependencies
    for (const [taskId, task] of this.dependencyGraph) {
      for (const depId of task.depends_on) {
        if (!this.dependencyGraph.has(depId)) {
          errors.push(`Task ${taskId} depends on non-existent task ${depId}`);
        }
      }
    }
    
    // Check depth violations
    for (const [taskId, task] of this.dependencyGraph) {
      if (task.depth > this.config.maxDepth) {
        warnings.push(`Task ${taskId} exceeds maximum depth (${task.depth} > ${this.config.maxDepth})`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Check for cycles in the graph
   */
  hasCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    
    const detectCycle = (taskId) => {
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const task = this.dependencyGraph.get(taskId);
      if (task) {
        for (const depId of task.enables) {
          if (!visited.has(depId)) {
            if (detectCycle(depId)) {return true;}
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const [taskId] of this.dependencyGraph) {
      if (!visited.has(taskId)) {
        if (detectCycle(taskId)) {return true;}
      }
    }
    
    return false;
  }
  
  /**
   * Get dependency statistics
   */
  getStats() {
    const totalTasks = this.dependencyGraph.size;
    const readyTasks = this.getReadyTasks().length;
    const blockedTasks = this.blockedTasks.size;
    const completedTasks = Array.from(this.taskStatus.values())
      .filter(status => status === 'completed').length;
    
    return {
      totalTasks,
      readyTasks,
      blockedTasks,
      completedTasks,
      criticalPathLength: this.criticalPath.length,
      maxDepth: Math.max(...Array.from(this.dependencyGraph.values()).map(t => t.depth || 0)),
      parallelGroups: this.getParallelGroups().length
    };
  }
  
  /**
   * Export dependency graph for visualization
   */
  exportGraph() {
    const nodes = [];
    const edges = [];
    
    for (const [taskId, task] of this.dependencyGraph) {
      nodes.push({
        id: taskId,
        status: this.taskStatus.get(taskId),
        depth: task.depth,
        isCriticalPath: this.criticalPath.includes(taskId),
        metadata: task.metadata
      });
      
      for (const depId of task.depends_on) {
        edges.push({
          from: depId,
          to: taskId,
          type: 'dependency'
        });
      }
    }
    
    return { nodes, edges };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  DependencyManager,
  getInstance: () => {
    if (!instance) {
      instance = new DependencyManager();
    }
    return instance;
  }
};