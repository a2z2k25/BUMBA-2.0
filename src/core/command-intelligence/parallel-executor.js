/**
 * BUMBA Parallel Executor
 * Enables parallel execution of department tasks
 */

const { logger } = require('../logging/bumba-logger');
const { getDepartmentManager } = require('./department-constants');

class ParallelExecutor {
  constructor() {
    this.maxConcurrency = 5; // Max parallel tasks
    this.activeExecutions = new Map();
    this.executionQueue = [];
  }

  /**
   * Execute tasks in parallel across departments
   */
  async executeParallel(tasks, command, args, context) {
    logger.info(`⚡ Executing ${tasks.length} tasks in parallel`);
    
    const executionId = `exec_${Date.now()}`;
    const startTime = Date.now();
    
    // Group tasks by dependency level
    const taskGroups = this.groupTasksByDependencies(tasks);
    const results = new Map();
    
    // Execute each group in sequence, but tasks within group in parallel
    for (const group of taskGroups) {
      logger.info(`🔄 Processing dependency group with ${group.length} tasks`);
      
      const groupPromises = group.map(async (task) => {
        return await this.executeTask(task, command, args, {
          ...context,
          executionId,
          results // Pass existing results for context
        });
      });
      
      // Wait for all tasks in group to complete
      const groupResults = await Promise.allSettled(groupPromises);
      
      // Process results
      groupResults.forEach((result, index) => {
        const task = group[index];
        
        if (result.status === 'fulfilled') {
          results.set(task.department, {
            success: true,
            ...result.value
          });
        } else {
          results.set(task.department, {
            success: false,
            error: result.reason.message || result.reason
          });
        }
      });
    }
    
    const duration = Date.now() - startTime;
    
    return {
      executionId,
      duration,
      results: Array.from(results.entries()),
      summary: this.createExecutionSummary(results, duration)
    };
  }

  /**
   * Execute single task
   */
  async executeTask(task, command, args, context) {
    const taskId = `task_${task.department}_${Date.now()}`;
    
    // Track active execution
    this.activeExecutions.set(taskId, {
      department: task.department,
      startTime: Date.now(),
      status: 'running'
    });
    
    try {
      // Apply concurrency limiting
      await this.waitForCapacity();
      
      logger.info(`🚀 Starting parallel task for ${task.department}`);
      
      // Get department manager
      const manager = await getDepartmentManager(task.department);
      
      // Execute with timeout
      const result = await this.executeWithTimeout(
        manager.execute(command, args, {
          ...context,
          parallel: true,
          taskId
        }),
        30000 // 30 second timeout per task
      );
      
      // Update tracking
      const execution = this.activeExecutions.get(taskId);
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      
      logger.info(`✅ Completed parallel task for ${task.department} in ${execution.duration}ms`);
      
      return result;
      
    } catch (error) {
      logger.error(`❌ Failed parallel task for ${task.department}:`, error);
      
      // Update tracking
      const execution = this.activeExecutions.get(taskId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.endTime = Date.now();
      }
      
      throw error;
      
    } finally {
      // Clean up
      setTimeout(() => {
        this.activeExecutions.delete(taskId);
      }, 5000);
    }
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Task timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Wait for execution capacity
   */
  async waitForCapacity() {
    while (this.getActiveCount() >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get count of active executions
   */
  getActiveCount() {
    let count = 0;
    this.activeExecutions.forEach(exec => {
      if (exec.status === 'running') count++;
    });
    return count;
  }

  /**
   * Group tasks by dependency levels
   */
  groupTasksByDependencies(tasks) {
    const groups = [];
    const processed = new Set();
    
    // Find tasks with no dependencies (can run immediately)
    const noDeps = tasks.filter(task => 
      !task.dependsOn || task.dependsOn.length === 0
    );
    
    if (noDeps.length > 0) {
      groups.push(noDeps);
      noDeps.forEach(task => processed.add(task.department));
    }
    
    // Process remaining tasks by dependency levels
    let remaining = tasks.filter(task => !processed.has(task.department));
    
    while (remaining.length > 0) {
      const currentGroup = [];
      
      for (const task of remaining) {
        // Check if all dependencies are processed
        const depsReady = !task.dependsOn || 
          task.dependsOn.every(dep => processed.has(dep));
        
        if (depsReady) {
          currentGroup.push(task);
        }
      }
      
      if (currentGroup.length === 0) {
        // No progress possible - circular dependency or missing dep
        logger.warn('⚠️ Circular or missing dependencies detected');
        groups.push(remaining); // Add remaining as final group
        break;
      }
      
      groups.push(currentGroup);
      currentGroup.forEach(task => processed.add(task.department));
      remaining = remaining.filter(task => !processed.has(task.department));
    }
    
    return groups;
  }

  /**
   * Create execution summary
   */
  createExecutionSummary(results, duration) {
    const summary = {
      totalTasks: results.size,
      successful: 0,
      failed: 0,
      duration: `${(duration / 1000).toFixed(2)}s`,
      parallelEfficiency: 0,
      departments: {}
    };
    
    results.forEach((result, department) => {
      if (result.success) {
        summary.successful++;
      } else {
        summary.failed++;
      }
      
      summary.departments[department] = {
        status: result.success ? 'success' : 'failed',
        message: result.message || result.error
      };
    });
    
    // Calculate parallel efficiency
    // Perfect parallel would be duration / task count
    const perfectParallelTime = duration / results.size;
    const actualAverageTime = duration / Math.max(1, this.maxConcurrency);
    summary.parallelEfficiency = Math.min(100, 
      Math.round((perfectParallelTime / actualAverageTime) * 100)
    );
    
    return summary;
  }

  /**
   * Cancel all active executions
   */
  cancelAll() {
    logger.warn('🛑 Cancelling all active parallel executions');
    
    this.activeExecutions.forEach((exec, taskId) => {
      if (exec.status === 'running') {
        exec.status = 'cancelled';
        exec.endTime = Date.now();
      }
    });
    
    this.executionQueue = [];
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    const metrics = {
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      averageDuration: 0
    };
    
    let totalDuration = 0;
    let completedCount = 0;
    
    this.activeExecutions.forEach(exec => {
      metrics[exec.status]++;
      
      if (exec.status === 'completed' && exec.duration) {
        totalDuration += exec.duration;
        completedCount++;
      }
    });
    
    if (completedCount > 0) {
      metrics.averageDuration = Math.round(totalDuration / completedCount);
    }
    
    metrics.queueLength = this.executionQueue.length;
    metrics.capacity = this.maxConcurrency - this.getActiveCount();
    
    return metrics;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ParallelExecutor,
  getInstance: () => {
    if (!instance) {
      instance = new ParallelExecutor();
    }
    return instance;
  }
};