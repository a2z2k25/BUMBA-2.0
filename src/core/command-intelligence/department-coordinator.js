/**
 * BUMBA Department Coordinator
 * Coordinates work between multiple departments
 */

const { logger } = require('../logging/bumba-logger');
const { getDepartmentManager } = require('./department-constants');
const { getInstance: getDetector } = require('./collaboration-detector');

class DepartmentCoordinator {
  constructor() {
    this.detector = getDetector();
    this.activeTasks = new Map();
    this.completedTasks = new Map();
  }

  /**
   * Coordinate multiple departments for a command
   */
  async coordinateDepartments(command, args, context, departments) {
    logger.info(`🤝 Coordinating ${departments.length} departments for: ${command}`);
    
    const taskId = `task_${Date.now()}`;
    const coordinationPlan = this.createCoordinationPlan(command, args, departments);
    
    // Store active task
    this.activeTasks.set(taskId, {
      command,
      args,
      departments,
      plan: coordinationPlan,
      startTime: Date.now()
    });
    
    try {
      // Execute coordination plan
      const results = await this.executeCoordinationPlan(
        coordinationPlan,
        command,
        args,
        context
      );
      
      // Mark as completed
      this.completedTasks.set(taskId, {
        ...this.activeTasks.get(taskId),
        results,
        endTime: Date.now()
      });
      
      this.activeTasks.delete(taskId);
      
      return {
        success: true,
        taskId,
        departments,
        results,
        summary: this.createSummary(results)
      };
      
    } catch (error) {
      logger.error(`Coordination failed for task ${taskId}:`, error);
      
      return {
        success: false,
        taskId,
        error: error.message,
        departments
      };
    }
  }

  /**
   * Create coordination plan for departments
   */
  createCoordinationPlan(command, args, departments) {
    const plan = {
      phases: [],
      dependencies: new Map(),
      parallelTasks: [],
      sequentialTasks: []
    };
    
    // Determine execution order based on dependencies
    if (departments.includes('product')) {
      // Product goes first for requirements
      plan.phases.push({
        phase: 1,
        department: 'product',
        role: 'requirements',
        dependsOn: []
      });
    }
    
    if (departments.includes('design')) {
      // Design depends on product requirements
      plan.phases.push({
        phase: departments.includes('product') ? 2 : 1,
        department: 'design',
        role: 'ui-design',
        dependsOn: departments.includes('product') ? ['product'] : []
      });
    }
    
    if (departments.includes('backend')) {
      // Backend can work in parallel with design
      plan.phases.push({
        phase: departments.includes('product') ? 2 : 1,
        department: 'backend',
        role: 'api-architecture',
        dependsOn: departments.includes('product') ? ['product'] : []
      });
    }
    
    if (departments.includes('testing')) {
      // Testing depends on all implementation
      plan.phases.push({
        phase: 3,
        department: 'testing',
        role: 'validation',
        dependsOn: ['design', 'backend'].filter(d => departments.includes(d))
      });
    }
    
    // Identify parallel vs sequential tasks
    plan.phases.forEach(phase => {
      if (phase.dependsOn.length === 0) {
        plan.parallelTasks.push(phase);
      } else {
        plan.sequentialTasks.push(phase);
      }
    });
    
    return plan;
  }

  /**
   * Execute coordination plan
   */
  async executeCoordinationPlan(plan, command, args, context) {
    const results = new Map();
    
    // Execute parallel tasks first
    if (plan.parallelTasks.length > 0) {
      logger.info(`⚡ Executing ${plan.parallelTasks.length} parallel tasks`);
      
      const parallelPromises = plan.parallelTasks.map(async (task) => {
        const manager = await getDepartmentManager(task.department);
        const result = await manager.execute(command, args, {
          ...context,
          role: task.role,
          phase: task.phase
        });
        return { department: task.department, result };
      });
      
      const parallelResults = await Promise.all(parallelPromises);
      parallelResults.forEach(({ department, result }) => {
        results.set(department, result);
      });
    }
    
    // Execute sequential tasks
    for (const task of plan.sequentialTasks) {
      logger.info(`📝 Executing sequential task for ${task.department}`);
      
      // Wait for dependencies
      await this.waitForDependencies(task.dependsOn, results);
      
      // Get dependency results for context
      const dependencyContext = this.getDependencyContext(task.dependsOn, results);
      
      const manager = await getDepartmentManager(task.department);
      const result = await manager.execute(command, args, {
        ...context,
        ...dependencyContext,
        role: task.role,
        phase: task.phase
      });
      
      results.set(task.department, result);
    }
    
    return results;
  }

  /**
   * Wait for department dependencies
   */
  async waitForDependencies(dependencies, results) {
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const allComplete = dependencies.every(dep => results.has(dep));
      if (allComplete) return;
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for dependencies: ${dependencies.join(', ')}`);
  }

  /**
   * Get context from dependency results
   */
  getDependencyContext(dependencies, results) {
    const context = {
      dependencies: {}
    };
    
    dependencies.forEach(dep => {
      if (results.has(dep)) {
        context.dependencies[dep] = results.get(dep);
      }
    });
    
    return context;
  }

  /**
   * Create summary of coordination results
   */
  createSummary(results) {
    const summary = {
      totalDepartments: results.size,
      successful: 0,
      failed: 0,
      departments: []
    };
    
    results.forEach((result, department) => {
      if (result.success) {
        summary.successful++;
      } else {
        summary.failed++;
      }
      
      summary.departments.push({
        department,
        status: result.success ? 'success' : 'failed',
        message: result.message || result.error
      });
    });
    
    return summary;
  }

  /**
   * Get active task count
   */
  getActiveTaskCount() {
    return this.activeTasks.size;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    if (this.activeTasks.has(taskId)) {
      return { status: 'active', task: this.activeTasks.get(taskId) };
    }
    
    if (this.completedTasks.has(taskId)) {
      return { status: 'completed', task: this.completedTasks.get(taskId) };
    }
    
    return { status: 'not_found' };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  DepartmentCoordinator,
  getInstance: () => {
    if (!instance) {
      instance = new DepartmentCoordinator();
    }
    return instance;
  }
};