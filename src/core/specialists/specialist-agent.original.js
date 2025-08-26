/**
 * BUMBA Specialist Agent Base Class
 * Base class for all specialist agents in the system
 */

const { EventEmitter } = require('events');

class SpecialistAgent extends EventEmitter {
  constructor(type, department, context = {}) {
    super();
    
    this.id = `${type}-${Date.now()}`;
    this.type = type;
    this.department = department;
    this.context = context;
    
    // Agent state
    this.status = 'idle';
    this.currentTask = null;
    this.taskHistory = [];
    
    // Manager reference
    this.manager = null;
    
    // Capabilities
    this.expertise = {};
    this.capabilities = [];
  }
  
  async initialize() {
    this.status = 'ready';
    this.emit('initialized', { specialist: this.id });
    return this;
  }
  
  async processTask(task, context) {
    // Override in subclasses
    return {
      type: 'task_processed',
      specialist: this.type,
      task: task.description || task,
      completed_at: new Date().toISOString()
    };
  }
  
  async executeTask(task) {
    this.status = 'working';
    this.currentTask = task;
    
    try {
      const result = await this.processTask(task, this.context);
      
      this.taskHistory.push({
        task,
        result,
        timestamp: Date.now()
      });
      
      this.status = 'idle';
      this.currentTask = null;
      
      return result;
    } catch (error) {
      this.status = 'error';
      this.emit('error', { specialist: this.id, error });
      throw error;
    }
  }
  
  async reportToManager(result) {
    if (this.manager) {
      console.log(`Specialist ${this.type} reporting to manager`);
      if (this.manager.receiveSpecialistReport) {
        await this.manager.receiveSpecialistReport(this, result);
      }
    }
  }
  
  async requestManagerGuidance(issue) {
    if (this.manager) {
      console.log(`Specialist ${this.type} requesting guidance on: ${issue}`);
      if (this.manager.provideGuidance) {
        return await this.manager.provideGuidance(this, issue);
      }
    }
    return null;
  }
  
  getMetrics() {
    return {
      id: this.id,
      type: this.type,
      department: this.department,
      status: this.status,
      tasksCompleted: this.taskHistory.length,
      currentTask: this.currentTask
    };
  }
}

module.exports = { SpecialistAgent };