/**
 * BUMBA Lite Mode - Sprint 3: Mini Department Coordination
 * 
 * Lightweight coordination between specialists without full overhead
 * Target: <2KB additional memory, <10ms coordination time
 */

/**
 * Lightweight Department for Lite Mode
 * Groups related specialists with minimal overhead
 */
class LiteDepartment {
  constructor(name, specialists = []) {
    this.name = name;
    this.specialists = specialists;
    this.messageQueue = [];
    this.sharedContext = new Map();
  }

  addSpecialist(specialist) {
    this.specialists.push(specialist);
    specialist.department = this.name;
  }

  async delegate(task) {
    // Find best specialist for task
    const specialist = this.selectSpecialist(task);
    if (!specialist) {
      throw new Error(`No specialist available for task: ${task.type}`);
    }
    
    // Execute with department context
    const result = await specialist.execute(task, this.sharedContext);
    
    // Share results with department
    this.updateContext(task, result);
    
    return result;
  }

  selectSpecialist(task) {
    // Simple capability matching
    for (const specialist of this.specialists) {
      if (specialist.hasCapability(task.type || task.capability)) {
        return specialist;
      }
    }
    
    // Fallback to first available
    return this.specialists[0];
  }

  updateContext(task, result) {
    // Store recent results for context sharing
    const key = `${task.type}_${Date.now()}`;
    this.sharedContext.set(key, { task, result });
    
    // Limit context size (max 5 entries)
    if (this.sharedContext.size > 5) {
      const firstKey = this.sharedContext.keys().next().value;
      this.sharedContext.delete(firstKey);
    }
  }

  broadcast(message) {
    // Simple message broadcasting to all specialists
    this.specialists.forEach(specialist => {
      specialist.receiveMessage(message);
    });
  }

  getMetrics() {
    return {
      specialists: this.specialists.length,
      contextSize: this.sharedContext.size,
      queueLength: this.messageQueue.length
    };
  }
}

/**
 * Lightweight Coordinator for Lite Mode
 * Manages departments and cross-department tasks
 */
class LiteCoordinator {
  constructor() {
    this.departments = new Map();
    this.taskQueue = [];
    this.executionOrder = [];
    this.metrics = { coordinated: 0, avgTime: 0 };
  }

  /**
   * Initialize departments with specialists
   */
  initializeDepartments(specialists) {
    // Group specialists into logical departments
    const design = new LiteDepartment('design');
    const engineering = new LiteDepartment('engineering');
    const strategy = new LiteDepartment('strategy');
    
    specialists.forEach(specialist => {
      if (specialist.type === 'designer' || specialist.type === 'frontend') {
        design.addSpecialist(specialist);
      } else if (specialist.type === 'engineer' || specialist.type === 'tester') {
        engineering.addSpecialist(specialist);
      } else if (specialist.type === 'strategist') {
        strategy.addSpecialist(specialist);
      }
    });
    
    this.departments.set('design', design);
    this.departments.set('engineering', engineering);
    this.departments.set('strategy', strategy);
  }

  /**
   * Coordinate task across departments
   */
  async coordinate(task) {
    const start = Date.now();
    this.metrics.coordinated++;
    
    try {
      // Analyze task complexity
      const plan = this.planExecution(task);
      
      // Execute plan steps
      const results = [];
      for (const step of plan) {
        const result = await this.executeStep(step, results);
        results.push(result);
      }
      
      // Update metrics
      const duration = Date.now() - start;
      this.metrics.avgTime = (this.metrics.avgTime * (this.metrics.coordinated - 1) + duration) / this.metrics.coordinated;
      
      return this.aggregateResults(results);
      
    } catch (error) {
      throw new Error(`Coordination failed: ${error.message}`);
    }
  }

  /**
   * Plan execution across departments
   */
  planExecution(task) {
    const plan = [];
    const taskType = task.type || this.inferTaskType(task.prompt);
    
    switch (taskType) {
      case 'fullstack':
        plan.push(
          { department: 'strategy', type: 'requirements' },
          { department: 'design', type: 'ui' },
          { department: 'engineering', type: 'api' },
          { department: 'engineering', type: 'integration' }
        );
        break;
        
      case 'feature':
        plan.push(
          { department: 'strategy', type: 'plan' },
          { department: 'design', type: 'component' },
          { department: 'engineering', type: 'logic' }
        );
        break;
        
      case 'bugfix':
        plan.push(
          { department: 'engineering', type: 'debug' },
          { department: 'engineering', type: 'fix' },
          { department: 'engineering', type: 'test' }
        );
        break;
        
      default:
        // Simple single department execution
        const dept = this.selectDepartment(taskType);
        plan.push({ department: dept, type: taskType });
    }
    
    return plan;
  }

  /**
   * Execute a single step in the plan
   */
  async executeStep(step, previousResults) {
    const department = this.departments.get(step.department);
    if (!department) {
      throw new Error(`Department not found: ${step.department}`);
    }
    
    // Prepare task with context from previous steps
    const task = {
      type: step.type,
      context: previousResults.length > 0 ? previousResults[previousResults.length - 1] : {},
      prompt: step.prompt || `Execute ${step.type}`
    };
    
    // Delegate to department
    return await department.delegate(task);
  }

  /**
   * Aggregate results from multiple departments
   */
  aggregateResults(results) {
    const aggregated = {
      success: results.every(r => r.success),
      departments: results.length,
      outputs: results.map(r => r.output),
      combined: {}
    };
    
    // Merge all outputs
    results.forEach((result, index) => {
      if (result.files) {
        aggregated.combined.files = { ...aggregated.combined.files, ...result.files };
      }
      if (result.components) {
        aggregated.combined.components = [...(aggregated.combined.components || []), ...result.components];
      }
      if (result.plan) {
        aggregated.combined.plan = result.plan;
      }
    });
    
    return aggregated;
  }

  /**
   * Simple task type inference
   */
  inferTaskType(prompt) {
    const lower = (prompt || '').toLowerCase();
    
    if (lower.includes('app') || lower.includes('full')) return 'fullstack';
    if (lower.includes('feature') || lower.includes('add')) return 'feature';
    if (lower.includes('fix') || lower.includes('bug')) return 'bugfix';
    if (lower.includes('design') || lower.includes('ui')) return 'ui';
    if (lower.includes('api') || lower.includes('backend')) return 'api';
    if (lower.includes('test')) return 'test';
    
    return 'general';
  }

  /**
   * Select appropriate department for task type
   */
  selectDepartment(taskType) {
    const mapping = {
      'ui': 'design',
      'component': 'design',
      'api': 'engineering',
      'backend': 'engineering',
      'test': 'engineering',
      'plan': 'strategy',
      'requirements': 'strategy'
    };
    
    return mapping[taskType] || 'engineering';
  }

  /**
   * Cross-department communication
   */
  async crossDepartmentMessage(from, to, message) {
    const fromDept = this.departments.get(from);
    const toDept = this.departments.get(to);
    
    if (!fromDept || !toDept) {
      throw new Error('Invalid department names');
    }
    
    // Simple message passing
    toDept.broadcast({
      from: from,
      message: message,
      timestamp: Date.now()
    });
  }

  /**
   * Get coordination metrics
   */
  getMetrics() {
    const departmentMetrics = {};
    this.departments.forEach((dept, name) => {
      departmentMetrics[name] = dept.getMetrics();
    });
    
    return {
      coordinator: this.metrics,
      departments: departmentMetrics,
      totalSpecialists: Array.from(this.departments.values())
        .reduce((sum, dept) => sum + dept.specialists.length, 0)
    };
  }
}

/**
 * Enhanced LiteSpecialist with messaging capability
 */
class CoordinatedLiteSpecialist {
  constructor(specialist) {
    // Store original specialist
    this.specialist = specialist;
    this.type = specialist.type;
    this.capabilities = specialist.capabilities;
    this.messages = [];
    this.department = null;
  }

  // Delegate core methods to wrapped specialist
  hasCapability(capability) {
    return this.specialist.hasCapability(capability);
  }

  async execute(task, context) {
    return await this.specialist.execute(task, context);
  }

  getMemoryUsage() {
    return this.specialist.getMemoryUsage();
  }

  receiveMessage(message) {
    this.messages.push(message);
    // Keep only last 5 messages
    if (this.messages.length > 5) {
      this.messages.shift();
    }
  }

  async executeWithCoordination(task, sharedContext) {
    // Check for relevant messages
    const relevantMessages = this.messages.filter(m => 
      m.timestamp > Date.now() - 60000 // Last minute
    );
    
    // Enhanced execution with context
    const enhancedTask = {
      ...task,
      messages: relevantMessages,
      sharedContext: sharedContext
    };
    
    return await this.execute(enhancedTask);
  }
}

/**
 * Integration with main Lite Mode
 */
class LiteModeWithCoordination {
  constructor(specialists) {
    this.coordinator = new LiteCoordinator();
    
    // Wrap specialists with coordination capability
    const coordinated = specialists.map(s => new CoordinatedLiteSpecialist(s));
    
    // Initialize departments
    this.coordinator.initializeDepartments(coordinated);
  }

  async execute(task) {
    // Use coordinator for complex tasks
    if (this.isComplexTask(task)) {
      return await this.coordinator.coordinate(task);
    }
    
    // Simple task - direct execution
    const department = this.coordinator.selectDepartment(task.type);
    const dept = this.coordinator.departments.get(department);
    return await dept.delegate(task);
  }

  isComplexTask(task) {
    const complexTypes = ['fullstack', 'feature', 'platform', 'system'];
    const taskType = task.type || this.coordinator.inferTaskType(task.prompt);
    return complexTypes.includes(taskType);
  }

  getMetrics() {
    return this.coordinator.getMetrics();
  }
}

// Export classes
module.exports = {
  LiteDepartment,
  LiteCoordinator,
  CoordinatedLiteSpecialist,
  LiteModeWithCoordination
};