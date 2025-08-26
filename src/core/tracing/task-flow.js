/**
 * BUMBA Task Flow Tracing
 * Traces data flow through all components for debugging
 * 
 * SOLVES: Data flows through so many layers that debugging is impossible
 * RESULT: Can trace any task through the entire system
 */

const crypto = require('crypto');
const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');

/**
 * Task Flow Tracer
 */
class TaskFlow {
  constructor(taskName, metadata = {}) {
    this.taskId = this.generateTaskId();
    this.taskName = taskName;
    this.metadata = metadata;
    this.startTime = Date.now();
    this.trace = [];
    this.data = {};
    this.errors = [];
    this.warnings = [];
    this.metrics = {
      totalDuration: 0,
      stepCount: 0,
      errorCount: 0,
      dataTransferred: 0
    };
  }
  
  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * Add a step to the trace
   */
  addStep(component, action, details = {}) {
    const step = {
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      component,
      action,
      input: this.summarize(details.input),
      output: this.summarize(details.output),
      duration: details.duration || 0,
      status: details.status || 'success',
      error: details.error || null,
      metadata: details.metadata || {}
    };
    
    this.trace.push(step);
    this.metrics.stepCount++;
    
    if (step.status === 'error') {
      this.metrics.errorCount++;
      this.errors.push({
        component,
        action,
        error: step.error,
        timestamp: step.timestamp
      });
    }
    
    // Log significant steps
    if (details.significant) {
      logger.debug(`[${this.taskId}] ${component} -> ${action}`, {
        duration: step.duration,
        status: step.status
      });
    }
    
    return step;
  }
  
  /**
   * Start timing a step
   */
  startStep(component, action) {
    const stepKey = `${component}:${action}`;
    this.data[`_timing_${stepKey}`] = Date.now();
    
    return {
      end: (details = {}) => {
        const startTime = this.data[`_timing_${stepKey}`];
        const duration = Date.now() - startTime;
        delete this.data[`_timing_${stepKey}`];
        
        return this.addStep(component, action, {
          ...details,
          duration
        });
      }
    };
  }
  
  /**
   * Add data to the flow
   */
  setData(key, value) {
    this.data[key] = value;
    this.metrics.dataTransferred += JSON.stringify(value).length;
  }
  
  /**
   * Get data from the flow
   */
  getData(key) {
    return this.data[key];
  }
  
  /**
   * Add an error
   */
  addError(component, error, context = {}) {
    this.addStep(component, 'error', {
      status: 'error',
      error: error.message || error,
      metadata: context
    });
  }
  
  /**
   * Add a warning
   */
  addWarning(component, warning, context = {}) {
    this.warnings.push({
      component,
      warning,
      context,
      timestamp: Date.now()
    });
  }
  
  /**
   * Summarize data for tracing
   */
  summarize(data) {
    if (!data) return null;
    
    if (typeof data === 'string') {
      return data.length > 100 ? data.substring(0, 100) + '...' : data;
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return {
        type: Array.isArray(data) ? 'array' : 'object',
        size: Array.isArray(data) ? data.length : keys.length,
        preview: keys.slice(0, 3).join(', ') + (keys.length > 3 ? '...' : '')
      };
    }
    
    return data;
  }
  
  /**
   * Generate flow visualization
   */
  visualize(format = 'text') {
    if (format === 'text') {
      return this.visualizeText();
    } else if (format === 'mermaid') {
      return this.visualizeMermaid();
    } else if (format === 'json') {
      return this.toJSON();
    }
  }
  
  /**
   * Text visualization
   */
  visualizeText() {
    let output = '';
    
    output += chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════╗\n`);
    output += chalk.cyan.bold(`║  Task Flow: ${this.taskName.padEnd(40)}║\n`);
    output += chalk.cyan.bold(`║  ID: ${this.taskId.padEnd(48)}║\n`);
    output += chalk.cyan.bold(`╚══════════════════════════════════════════════════════╝\n\n`);
    
    this.trace.forEach((step, index) => {
      const prefix = step.status === 'error' ? chalk.red('✗') : chalk.green('✓');
      const duration = chalk.gray(`${step.duration}ms`);
      
      output += `${prefix} ${chalk.yellow(step.component)} → ${chalk.blue(step.action)} ${duration}\n`;
      
      if (step.input) {
        output += chalk.gray(`   Input: ${JSON.stringify(step.input)}\n`);
      }
      
      if (step.output) {
        output += chalk.gray(`   Output: ${JSON.stringify(step.output)}\n`);
      }
      
      if (step.error) {
        output += chalk.red(`   Error: ${step.error}\n`);
      }
      
      if (index < this.trace.length - 1) {
        output += chalk.gray(`   ↓\n`);
      }
    });
    
    // Summary
    output += chalk.cyan('\n═══ Summary ═══\n');
    output += `Total Duration: ${Date.now() - this.startTime}ms\n`;
    output += `Steps: ${this.metrics.stepCount}\n`;
    output += `Errors: ${this.metrics.errorCount}\n`;
    output += `Warnings: ${this.warnings.length}\n`;
    
    return output;
  }
  
  /**
   * Mermaid diagram visualization
   */
  visualizeMermaid() {
    let diagram = 'graph TD\n';
    diagram += `    Start[${this.taskName}]\n`;
    
    let prevNode = 'Start';
    this.trace.forEach((step, index) => {
      const nodeId = `Step${index}`;
      const label = `${step.component}::${step.action}`;
      const shape = step.status === 'error' ? `${nodeId}[["${label}"]]` : `${nodeId}["${label}"]`;
      
      diagram += `    ${shape}\n`;
      diagram += `    ${prevNode} --> ${nodeId}\n`;
      
      if (step.duration > 1000) {
        diagram += `    ${nodeId} -.- Duration${index}[${step.duration}ms]\n`;
      }
      
      prevNode = nodeId;
    });
    
    diagram += `    ${prevNode} --> End[Complete]\n`;
    
    return diagram;
  }
  
  /**
   * Get flow statistics
   */
  getStats() {
    const totalDuration = Date.now() - this.startTime;
    const avgStepDuration = this.metrics.stepCount > 0 ? 
      Math.round(totalDuration / this.metrics.stepCount) : 0;
    
    return {
      taskId: this.taskId,
      taskName: this.taskName,
      totalDuration,
      stepCount: this.metrics.stepCount,
      errorCount: this.metrics.errorCount,
      warningCount: this.warnings.length,
      avgStepDuration,
      dataTransferred: this.metrics.dataTransferred,
      successRate: this.metrics.stepCount > 0 ? 
        ((this.metrics.stepCount - this.metrics.errorCount) / this.metrics.stepCount * 100).toFixed(2) + '%' : 
        '0%'
    };
  }
  
  /**
   * Export to JSON
   */
  toJSON() {
    return {
      taskId: this.taskId,
      taskName: this.taskName,
      metadata: this.metadata,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      trace: this.trace,
      errors: this.errors,
      warnings: this.warnings,
      metrics: this.getStats()
    };
  }
  
  /**
   * Find bottlenecks
   */
  findBottlenecks(threshold = 1000) {
    return this.trace
      .filter(step => step.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .map(step => ({
        component: step.component,
        action: step.action,
        duration: step.duration,
        percentage: ((step.duration / (Date.now() - this.startTime)) * 100).toFixed(2) + '%'
      }));
  }
  
  /**
   * Get error chain
   */
  getErrorChain() {
    const errorSteps = this.trace.filter(step => step.status === 'error');
    if (errorSteps.length === 0) return null;
    
    return errorSteps.map(step => ({
      component: step.component,
      action: step.action,
      error: step.error,
      timestamp: step.timestamp,
      context: this.getContextForStep(step)
    }));
  }
  
  /**
   * Get context for a step
   */
  getContextForStep(targetStep) {
    const index = this.trace.indexOf(targetStep);
    return {
      previous: index > 0 ? this.trace[index - 1] : null,
      next: index < this.trace.length - 1 ? this.trace[index + 1] : null,
      data: { ...this.data }
    };
  }
}

/**
 * Global Task Flow Registry
 */
class TaskFlowRegistry {
  constructor() {
    this.flows = new Map();
    this.activeFlows = new Map();
    this.completedFlows = [];
    this.maxCompleted = 100;
  }
  
  /**
   * Create a new task flow
   */
  createFlow(taskName, metadata = {}) {
    const flow = new TaskFlow(taskName, metadata);
    this.flows.set(flow.taskId, flow);
    this.activeFlows.set(flow.taskId, flow);
    
    logger.debug(`Task flow created: ${flow.taskId}`, { taskName });
    
    return flow;
  }
  
  /**
   * Get a flow by ID
   */
  getFlow(taskId) {
    return this.flows.get(taskId);
  }
  
  /**
   * Complete a flow
   */
  completeFlow(taskId) {
    const flow = this.activeFlows.get(taskId);
    if (flow) {
      this.activeFlows.delete(taskId);
      this.completedFlows.push(flow);
      
      // Limit completed flows
      if (this.completedFlows.length > this.maxCompleted) {
        const removed = this.completedFlows.shift();
        this.flows.delete(removed.taskId);
      }
      
      logger.debug(`Task flow completed: ${taskId}`, flow.getStats());
    }
  }
  
  /**
   * Get active flows
   */
  getActiveFlows() {
    return Array.from(this.activeFlows.values());
  }
  
  /**
   * Get flow statistics
   */
  getStatistics() {
    const active = this.getActiveFlows();
    const completed = this.completedFlows;
    
    return {
      activeCount: active.length,
      completedCount: completed.length,
      totalCount: this.flows.size,
      activeFlows: active.map(f => ({
        taskId: f.taskId,
        taskName: f.taskName,
        duration: Date.now() - f.startTime,
        stepCount: f.metrics.stepCount
      })),
      recentCompleted: completed.slice(-10).map(f => f.getStats())
    };
  }
  
  /**
   * Clear completed flows
   */
  clearCompleted() {
    this.completedFlows.forEach(flow => {
      this.flows.delete(flow.taskId);
    });
    this.completedFlows = [];
  }
}

// Singleton registry
let registryInstance = null;

function getTaskFlowRegistry() {
  if (!registryInstance) {
    registryInstance = new TaskFlowRegistry();
  }
  return registryInstance;
}

/**
 * Decorator to add tracing to a function
 */
function traced(component, action) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const flow = this.taskFlow || getTaskFlowRegistry().createFlow(`${component}.${action}`);
      const step = flow.startStep(component, action);
      
      try {
        const result = await originalMethod.apply(this, args);
        step.end({
          status: 'success',
          output: result
        });
        return result;
      } catch (error) {
        step.end({
          status: 'error',
          error: error.message
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}

module.exports = {
  TaskFlow,
  TaskFlowRegistry,
  getTaskFlowRegistry,
  traced
};