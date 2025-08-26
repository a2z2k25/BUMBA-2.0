/**
 * BUMBA Workflow Engine
 * Central workflow automation and orchestration system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getConfig } = require('../config/bumba-config');
const UnifiedSpecialistBase = require('../specialists/unified-specialist-base');

// Enhanced workflow components
const WorkflowScheduler = require('./workflow-scheduler');
const WorkflowOrchestrator = require('./workflow-orchestrator');
const WorkflowOptimizer = require('./workflow-optimizer');
const WorkflowAnalytics = require('./workflow-analytics');

class WorkflowEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 10,
      maxRetries: config.maxRetries || 3,
      defaultTimeout: config.defaultTimeout || 3600000, // 1 hour
      enableParallelization: config.enableParallelization !== false,
      autoRecover: config.autoRecover !== false,
      enhancedMode: config.enhancedMode !== false,
      schedulingEnabled: config.schedulingEnabled !== false,
      orchestrationEnabled: config.orchestrationEnabled !== false,
      optimizationEnabled: config.optimizationEnabled !== false,
      analyticsEnabled: config.analyticsEnabled !== false,
      ...config
    };
    
    // Workflow storage
    this.workflows = new Map();
    this.templates = new Map();
    this.activeWorkflows = new Map();
    this.completedWorkflows = new Map();
    
    // Execution state
    this.executionQueue = [];
    this.runningWorkflows = new Set();
    this.pausedWorkflows = new Set();
    
    // Step definitions
    this.stepDefinitions = new Map();
    this.customSteps = new Map();
    
    // Conditions and triggers
    this.conditions = new Map();
    this.triggers = new Map();
    this.schedules = new Map();
    
    // Specialist pool
    this.specialists = new Map();
    this.specialistPool = [];
    
    // Metrics
    this.metrics = {
      workflowsCreated: 0,
      workflowsExecuted: 0,
      workflowsCompleted: 0,
      workflowsFailed: 0,
      averageExecutionTime: 0,
      parallelizationEfficiency: 0,
      stepExecutions: 0,
      stepFailures: 0
    };
    
    // Enhanced components
    this.scheduler = null;
    this.orchestrator = null;
    this.optimizer = null;
    this.analytics = null;
    
    this.initialize();
  }
  
  /**
   * Initialize workflow engine
   */
  async initialize() {
    try {
      // Register default step definitions
      this.registerDefaultSteps();
      
      // Register default conditions
      this.registerDefaultConditions();
      
      // Register default templates
      await this.loadDefaultTemplates();
      
      // Initialize enhanced components if enabled
      if (this.config.enhancedMode) {
        await this.initializeEnhancedComponents();
      }
      
      // Start execution loop
      this.startExecutionLoop();
      
      logger.info('🔄 Workflow Engine initialized' + 
        (this.config.enhancedMode ? ' (Enhanced Mode)' : ''));
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Workflow Engine:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Create a new workflow
   */
  async createWorkflow(definition) {
    try {
      const workflow = {
        id: definition.id || this.generateWorkflowId(),
        name: definition.name || 'Unnamed Workflow',
        description: definition.description,
        version: definition.version || '1.0.0',
        
        // Workflow structure
        steps: this.validateSteps(definition.steps || []),
        transitions: definition.transitions || [],
        
        // Configuration
        config: {
          parallel: definition.parallel || false,
          timeout: definition.timeout || this.config.defaultTimeout,
          retries: definition.retries || this.config.maxRetries,
          errorHandling: definition.errorHandling || 'stop',
          ...definition.config
        },
        
        // State
        state: {
          status: 'created',
          currentStep: null,
          completedSteps: [],
          variables: {},
          results: {},
          errors: []
        },
        
        // Metadata
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          author: definition.author || 'system',
          tags: definition.tags || []
        },
        
        // Triggers and conditions
        triggers: definition.triggers || [],
        conditions: definition.conditions || {},
        
        // Specialist assignments
        specialists: definition.specialists || {}
      };
      
      // Validate workflow
      this.validateWorkflow(workflow);
      
      // Store workflow
      this.workflows.set(workflow.id, workflow);
      
      // Register triggers if any
      if (workflow.triggers.length > 0) {
        await this.registerTriggers(workflow);
      }
      
      this.metrics.workflowsCreated++;
      
      this.emit('workflow:created', workflow);
      logger.info(`📋 Created workflow: ${workflow.name}`);
      
      return workflow;
      
    } catch (error) {
      logger.error('Failed to create workflow:', error);
      throw error;
    }
  }
  
  /**
   * Initialize enhanced components
   */
  async initializeEnhancedComponents() {
    // Initialize scheduler
    if (this.config.schedulingEnabled) {
      this.scheduler = new WorkflowScheduler({
        maxConcurrent: this.config.maxConcurrentWorkflows,
        schedulingAlgorithm: this.config.schedulingAlgorithm || 'weighted-fair'
      });
      
      // Connect scheduler events
      this.scheduler.on('workflow:executing', (scheduled) => {
        this.emit('workflow:scheduled:executing', scheduled);
      });
      
      this.scheduler.on('workflow:completed', (scheduled) => {
        this.emit('workflow:scheduled:completed', scheduled);
      });
    }
    
    // Initialize orchestrator
    if (this.config.orchestrationEnabled) {
      this.orchestrator = new WorkflowOrchestrator({
        intelligentRouting: true,
        adaptiveExecution: true
      });
      
      // Connect orchestrator events
      this.orchestrator.on('orchestration:completed', (result) => {
        this.emit('orchestration:completed', result);
      });
    }
    
    // Initialize optimizer
    if (this.config.optimizationEnabled) {
      this.optimizer = new WorkflowOptimizer({
        learningRate: 0.1,
        explorationRate: 0.2
      });
      
      // Connect optimizer events
      this.optimizer.on('optimization:complete', (optimization) => {
        this.emit('workflow:optimized', optimization);
      });
    }
    
    // Initialize analytics
    if (this.config.analyticsEnabled) {
      this.analytics = new WorkflowAnalytics({
        trackingEnabled: true,
        metricsRetention: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Connect analytics events
      this.analytics.on('anomaly:detected', (data) => {
        this.emit('analytics:anomaly', data);
      });
      
      this.analytics.on('alert:critical', (alert) => {
        this.emit('analytics:alert', alert);
      });
    }
    
    logger.info('🟢 Enhanced workflow components initialized');
  }
  
  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, input = {}, options = {}) {
    try {
      let workflow = this.workflows.get(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
      
      // Optimize workflow if optimizer is available
      if (this.optimizer && this.config.optimizationEnabled) {
        workflow = await this.optimizer.optimizeWorkflow(workflow, { input, ...options });
      }
      
      // Use scheduler if available
      if (this.scheduler && this.config.schedulingEnabled) {
        const scheduled = await this.scheduler.scheduleWorkflow(workflow, {
          priority: options.priority || 2,
          deadline: options.deadline,
          resources: options.resources
        });
        
        return { scheduled: true, scheduleId: scheduled.id };
      }
      
      // Check concurrent limit (fallback to original logic)
      if (this.runningWorkflows.size >= this.config.maxConcurrentWorkflows) {
        // Queue the workflow
        this.executionQueue.push({ workflowId, input, options });
        logger.info(`Workflow ${workflowId} queued`);
        return { queued: true, position: this.executionQueue.length };
      }
      
      // Create execution instance
      const execution = {
        id: this.generateExecutionId(),
        workflowId,
        workflow: { ...workflow },
        input,
        options,
        startTime: Date.now(),
        state: {
          status: 'running',
          currentStep: 0,
          completedSteps: [],
          variables: { ...input },
          results: {},
          errors: []
        }
      };
      
      // Store active execution
      this.activeWorkflows.set(execution.id, execution);
      this.runningWorkflows.add(execution.id);
      
      // Start analytics tracking if available
      if (this.analytics && this.config.analyticsEnabled) {
        this.analytics.trackWorkflowStart(workflow, execution);
      }
      
      // Execute workflow
      const result = await this.runWorkflow(execution);
      
      // Complete execution
      this.completeExecution(execution, result);
      
      // Track completion in analytics
      if (this.analytics && this.config.analyticsEnabled) {
        this.analytics.trackWorkflowComplete(execution, result);
      }
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to execute workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run workflow execution
   */
  async runWorkflow(execution) {
    const { workflow, state } = execution;
    
    try {
      this.emit('workflow:started', execution);
      
      // Use orchestrator for complex patterns if available
      if (this.orchestrator && workflow.pattern && this.config.orchestrationEnabled) {
        const result = await this.orchestrator.orchestrate(
          workflow, 
          workflow.pattern, 
          { context: state }
        );
        
        state.results = result.results || result;
      } else {
        // Execute steps (original logic)
        if (workflow.config.parallel) {
          await this.executeParallelSteps(execution);
        } else {
          await this.executeSequentialSteps(execution);
        }
      }
      
      // Check final state
      if (state.errors.length > 0 && workflow.config.errorHandling === 'stop') {
        throw new Error(`Workflow failed with ${state.errors.length} errors`);
      }
      
      state.status = 'completed';
      
      return {
        success: true,
        workflowId: workflow.id,
        executionId: execution.id,
        results: state.results,
        variables: state.variables,
        duration: Date.now() - execution.startTime
      };
      
    } catch (error) {
      state.status = 'failed';
      state.errors.push({
        step: state.currentStep,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Attempt recovery if configured
      if (this.config.autoRecover) {
        return await this.recoverWorkflow(execution, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Execute steps sequentially
   */
  async executeSequentialSteps(execution) {
    const { workflow, state } = execution;
    
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      state.currentStep = i;
      
      // Check conditions
      if (!await this.checkStepConditions(step, state)) {
        logger.info(`Skipping step ${step.name}: conditions not met`);
        continue;
      }
      
      // Execute step
      try {
        const result = await this.executeStep(step, state, execution);
        
        // Store result
        state.results[step.id || step.name] = result;
        state.completedSteps.push(step.id || step.name);
        
        // Update variables if step returns them
        if (result.variables) {
          Object.assign(state.variables, result.variables);
        }
        
        // Check for workflow control
        if (result.action === 'stop') {
          break;
        } else if (result.action === 'goto') {
          i = this.findStepIndex(workflow, result.target) - 1;
        }
        
      } catch (error) {
        await this.handleStepError(step, error, execution);
        
        if (workflow.config.errorHandling === 'stop') {
          throw error;
        }
      }
    }
  }
  
  /**
   * Execute steps in parallel
   */
  async executeParallelSteps(execution) {
    const { workflow, state } = execution;
    
    // Group steps by dependencies
    const stepGroups = this.groupStepsByDependencies(workflow.steps);
    
    for (const group of stepGroups) {
      const promises = group.map(async (step) => {
        // Check conditions
        if (!await this.checkStepConditions(step, state)) {
          return { skipped: true, step: step.name };
        }
        
        try {
          const result = await this.executeStep(step, state, execution);
          
          // Store result
          state.results[step.id || step.name] = result;
          state.completedSteps.push(step.id || step.name);
          
          return result;
          
        } catch (error) {
          await this.handleStepError(step, error, execution);
          
          if (workflow.config.errorHandling === 'stop') {
            throw error;
          }
          
          return { error: error.message, step: step.name };
        }
      });
      
      // Wait for group to complete
      const results = await Promise.all(promises);
      
      // Update variables from results
      results.forEach(result => {
        if (result.variables) {
          Object.assign(state.variables, result.variables);
        }
      });
    }
  }
  
  /**
   * Execute a single step
   */
  async executeStep(step, state, execution) {
    const startTime = Date.now();
    
    try {
      this.emit('step:started', { step, execution });
      
      // Track step in analytics
      if (this.analytics && this.config.analyticsEnabled) {
        this.analytics.trackStepStart(execution.id, step);
      }
      
      // Get step definition
      const definition = this.stepDefinitions.get(step.type) || 
                        this.customSteps.get(step.type);
      
      if (!definition) {
        throw new Error(`Unknown step type: ${step.type}`);
      }
      
      // Prepare step context
      const context = {
        variables: state.variables,
        results: state.results,
        workflow: execution.workflow,
        step
      };
      
      // Execute step handler
      const result = await definition.handler(step, context);
      
      this.metrics.stepExecutions++;
      
      this.emit('step:completed', {
        step,
        execution,
        result,
        duration: Date.now() - startTime
      });
      
      // Track step completion in analytics
      if (this.analytics && this.config.analyticsEnabled) {
        this.analytics.trackStepComplete(execution.id, step, result);
      }
      
      return result;
      
    } catch (error) {
      this.metrics.stepFailures++;
      
      this.emit('step:failed', {
        step,
        execution,
        error,
        duration: Date.now() - startTime
      });
      
      // Track error in analytics
      if (this.analytics && this.config.analyticsEnabled) {
        this.analytics.trackError(execution.id, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Register default step definitions
   */
  registerDefaultSteps() {
    // Task step
    this.registerStep('task', {
      name: 'Task',
      description: 'Execute a task',
      handler: async (step, context) => {
        const specialist = await this.getSpecialist(step.specialist);
        
        if (!specialist) {
          throw new Error(`Specialist not found: ${step.specialist}`);
        }
        
        return await specialist.processTask({
          ...step.task,
          variables: context.variables
        });
      }
    });
    
    // Condition step
    this.registerStep('condition', {
      name: 'Condition',
      description: 'Conditional branching',
      handler: async (step, context) => {
        const condition = this.conditions.get(step.condition) ||
                         this.evaluateCondition;
        
        const result = await condition(step.expression, context);
        
        return {
          success: true,
          condition: result,
          action: result ? step.ifTrue : step.ifFalse
        };
      }
    });
    
    // Loop step
    this.registerStep('loop', {
      name: 'Loop',
      description: 'Loop over items',
      handler: async (step, context) => {
        const items = this.resolveValue(step.items, context);
        const results = [];
        
        for (const item of items) {
          context.variables[step.itemVar || 'item'] = item;
          
          // Execute loop body
          for (const bodyStep of step.body) {
            const result = await this.executeStep(bodyStep, context.variables, {
              workflow: context.workflow
            });
            results.push(result);
          }
        }
        
        return { success: true, results };
      }
    });
    
    // Parallel step
    this.registerStep('parallel', {
      name: 'Parallel',
      description: 'Execute steps in parallel',
      handler: async (step, context) => {
        const promises = step.steps.map(s => 
          this.executeStep(s, context.variables, { workflow: context.workflow })
        );
        
        const results = await Promise.all(promises);
        
        return { success: true, results };
      }
    });
    
    // Wait step
    this.registerStep('wait', {
      name: 'Wait',
      description: 'Wait for duration or condition',
      handler: async (step, context) => {
        if (step.duration) {
          await new Promise(resolve => setTimeout(resolve, step.duration));
        } else if (step.until) {
          while (!await this.evaluateCondition(step.until, context)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        return { success: true };
      }
    });
    
    // Transform step
    this.registerStep('transform', {
      name: 'Transform',
      description: 'Transform data',
      handler: async (step, context) => {
        const input = this.resolveValue(step.input, context);
        const transformed = await this.applyTransformation(
          input,
          step.transformation
        );
        
        return {
          success: true,
          result: transformed,
          variables: { [step.output || 'result']: transformed }
        };
      }
    });
    
    // API call step
    this.registerStep('api', {
      name: 'API Call',
      description: 'Make an API request',
      handler: async (step, context) => {
        const url = this.resolveValue(step.url, context);
        const options = {
          method: step.method || 'GET',
          headers: this.resolveValue(step.headers || {}, context),
          body: step.body ? JSON.stringify(
            this.resolveValue(step.body, context)
          ) : undefined
        };
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        return {
          success: response.ok,
          status: response.status,
          data,
          variables: { [step.output || 'apiResult']: data }
        };
      }
    });
  }
  
  /**
   * Register a custom step type
   */
  registerStep(type, definition) {
    this.stepDefinitions.set(type, {
      type,
      ...definition
    });
    
    logger.info(`📝 Registered step type: ${type}`);
  }
  
  /**
   * Register default conditions
   */
  registerDefaultConditions() {
    // Equals condition
    this.registerCondition('equals', (a, b) => a === b);
    
    // Not equals condition
    this.registerCondition('notEquals', (a, b) => a !== b);
    
    // Greater than condition
    this.registerCondition('greaterThan', (a, b) => a > b);
    
    // Less than condition
    this.registerCondition('lessThan', (a, b) => a < b);
    
    // Contains condition
    this.registerCondition('contains', (arr, item) => 
      Array.isArray(arr) ? arr.includes(item) : false
    );
    
    // Exists condition
    this.registerCondition('exists', (value) => 
      value !== undefined && value !== null
    );
    
    // Custom expression condition
    this.registerCondition('expression', (expr, context) => {
      try {
        // Use safe expression evaluator instead of new Function
        const safeEvaluator = require('./safe-expression-evaluator');
        return safeEvaluator.evaluate(expr, context);
      } catch (error) {
        return false;
      }
    });
  }
  
  /**
   * Register a condition
   */
  registerCondition(name, evaluator) {
    this.conditions.set(name, evaluator);
  }
  
  /**
   * Check step conditions
   */
  async checkStepConditions(step, state) {
    if (!step.conditions) return true;
    
    for (const condition of step.conditions) {
      const evaluator = this.conditions.get(condition.type);
      
      if (!evaluator) {
        logger.warn(`Unknown condition type: ${condition.type}`);
        continue;
      }
      
      const result = await evaluator(
        this.resolveValue(condition.left, { variables: state.variables }),
        this.resolveValue(condition.right, { variables: state.variables })
      );
      
      if (!result) return false;
    }
    
    return true;
  }
  
  /**
   * Evaluate a condition
   */
  async evaluateCondition(expression, context) {
    if (typeof expression === 'boolean') return expression;
    
    if (typeof expression === 'string') {
      // Try to resolve as variable
      const value = this.resolveValue(expression, context);
      return !!value;
    }
    
    if (expression.type) {
      const evaluator = this.conditions.get(expression.type);
      if (evaluator) {
        return await evaluator(
          this.resolveValue(expression.left, context),
          this.resolveValue(expression.right, context)
        );
      }
    }
    
    return false;
  }
  
  /**
   * Resolve a value (variable reference or literal)
   */
  resolveValue(value, context) {
    if (typeof value === 'string' && value.startsWith('$')) {
      // Variable reference
      const path = value.substring(1).split('.');
      let resolved = context.variables;
      
      for (const part of path) {
        resolved = resolved?.[part];
      }
      
      return resolved;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Recursively resolve object properties
      const resolved = {};
      
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveValue(val, context);
      }
      
      return resolved;
    }
    
    return value;
  }
  
  /**
   * Group steps by dependencies
   */
  groupStepsByDependencies(steps) {
    const groups = [];
    const completed = new Set();
    
    while (completed.size < steps.length) {
      const group = [];
      
      for (const step of steps) {
        if (completed.has(step.id || step.name)) continue;
        
        // Check if dependencies are satisfied
        const deps = step.dependencies || [];
        if (deps.every(dep => completed.has(dep))) {
          group.push(step);
        }
      }
      
      if (group.length === 0) {
        // Circular dependency or invalid configuration
        throw new Error('Invalid step dependencies');
      }
      
      group.forEach(step => completed.add(step.id || step.name));
      groups.push(group);
    }
    
    return groups;
  }
  
  /**
   * Handle step error
   */
  async handleStepError(step, error, execution) {
    execution.state.errors.push({
      step: step.id || step.name,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Check for error handler
    if (step.onError) {
      try {
        await this.executeStep(step.onError, execution.state, execution);
      } catch (handlerError) {
        logger.error('Error handler failed:', handlerError);
      }
    }
    
    // Check for retry
    if (step.retries && (!step.retryCount || step.retryCount < step.retries)) {
      step.retryCount = (step.retryCount || 0) + 1;
      logger.info(`Retrying step ${step.name} (${step.retryCount}/${step.retries})`);
      
      // Wait before retry
      await new Promise(resolve => 
        setTimeout(resolve, step.retryDelay || 1000)
      );
      
      return await this.executeStep(step, execution.state, execution);
    }
  }
  
  /**
   * Complete workflow execution
   */
  completeExecution(execution, result) {
    const duration = Date.now() - execution.startTime;
    
    // Update metrics
    this.metrics.workflowsExecuted++;
    
    if (result.success) {
      this.metrics.workflowsCompleted++;
    } else {
      this.metrics.workflowsFailed++;
    }
    
    // Update average execution time
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.workflowsExecuted - 1) + duration) /
      this.metrics.workflowsExecuted;
    
    // Clean up
    this.activeWorkflows.delete(execution.id);
    this.runningWorkflows.delete(execution.id);
    
    // Store completed
    this.completedWorkflows.set(execution.id, {
      ...execution,
      result,
      duration,
      completedAt: new Date().toISOString()
    });
    
    // Process queue
    this.processQueue();
    
    this.emit('workflow:completed', { execution, result, duration });
  }
  
  /**
   * Process execution queue
   */
  async processQueue() {
    if (this.executionQueue.length === 0) return;
    if (this.runningWorkflows.size >= this.config.maxConcurrentWorkflows) return;
    
    const { workflowId, input, options } = this.executionQueue.shift();
    await this.executeWorkflow(workflowId, input, options);
  }
  
  /**
   * Start execution loop
   */
  startExecutionLoop() {
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }
  
  /**
   * Helper methods
   */
  
  generateWorkflowId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateExecutionId() {
    return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  validateSteps(steps) {
    return steps.map(step => ({
      id: step.id || `step_${Math.random().toString(36).substring(2, 9)}`,
      name: step.name || 'Unnamed Step',
      type: step.type || 'task',
      ...step
    }));
  }
  
  validateWorkflow(workflow) {
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }
    
    // Validate step types
    for (const step of workflow.steps) {
      if (!this.stepDefinitions.has(step.type) && 
          !this.customSteps.has(step.type)) {
        throw new Error(`Unknown step type: ${step.type}`);
      }
    }
    
    return true;
  }
  
  findStepIndex(workflow, stepId) {
    return workflow.steps.findIndex(s => 
      s.id === stepId || s.name === stepId
    );
  }
  
  async applyTransformation(data, transformation) {
    // Simple transformation implementation
    if (typeof transformation === 'function') {
      return transformation(data);
    }
    
    if (typeof transformation === 'string') {
      // Use safe expression evaluator instead of new Function
      const safeEvaluator = require('./safe-expression-evaluator');
      return safeEvaluator.transform(data, transformation);
    }
    
    return data;
  }
  
  async loadDefaultTemplates() {
    // Load built-in workflow templates
    const templates = [
      {
        id: 'simple-task',
        name: 'Simple Task',
        description: 'Execute a single task',
        steps: [
          {
            type: 'task',
            name: 'Execute Task',
            specialist: 'auto'
          }
        ]
      },
      {
        id: 'sequential-tasks',
        name: 'Sequential Tasks',
        description: 'Execute tasks in sequence',
        steps: [
          { type: 'task', name: 'Task 1' },
          { type: 'task', name: 'Task 2' },
          { type: 'task', name: 'Task 3' }
        ]
      },
      {
        id: 'parallel-tasks',
        name: 'Parallel Tasks',
        description: 'Execute tasks in parallel',
        config: { parallel: true },
        steps: [
          { type: 'task', name: 'Task A' },
          { type: 'task', name: 'Task B' },
          { type: 'task', name: 'Task C' }
        ]
      }
    ];
    
    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }
  
  async getSpecialist(type) {
    // Get or create specialist
    if (!this.specialists.has(type)) {
      // Create new specialist
      const specialist = new UnifiedSpecialistBase({
        type,
        name: `${type} Specialist`
      });
      
      await specialist.initialize();
      this.specialists.set(type, specialist);
    }
    
    return this.specialists.get(type);
  }
  
  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }
  
  /**
   * List all workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values());
  }
  
  /**
   * Schedule a recurring workflow
   */
  scheduleRecurringWorkflow(workflowId, pattern, options = {}) {
    if (!this.scheduler) {
      throw new Error('Scheduler not initialized. Enable scheduling in config.');
    }
    
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    return this.scheduler.scheduleRecurring(workflow, pattern, options);
  }
  
  /**
   * Schedule workflow with cron expression
   */
  scheduleCronWorkflow(workflowId, cronExpression, options = {}) {
    if (!this.scheduler) {
      throw new Error('Scheduler not initialized. Enable scheduling in config.');
    }
    
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    return this.scheduler.scheduleCron(workflow, cronExpression, options);
  }
  
  /**
   * Create workflow from template with optimization
   */
  async createOptimizedWorkflow(templateId, customization = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const workflow = await this.createWorkflow({
      ...template,
      ...customization,
      name: customization.name || `${template.name} (Optimized)`
    });
    
    if (this.optimizer) {
      const optimized = await this.optimizer.optimizeWorkflow(workflow);
      this.workflows.set(workflow.id, optimized);
      return optimized;
    }
    
    return workflow;
  }
  
  /**
   * Execute workflow with orchestration pattern
   */
  async executeWithPattern(workflowId, pattern, input = {}, options = {}) {
    if (!this.orchestrator) {
      throw new Error('Orchestrator not initialized. Enable orchestration in config.');
    }
    
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    return await this.orchestrator.orchestrate(workflow, pattern, {
      input,
      ...options
    });
  }
  
  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(workflowId, timeRange) {
    if (!this.analytics) {
      throw new Error('Analytics not initialized. Enable analytics in config.');
    }
    
    const metrics = this.analytics.getMetrics();
    const workflowMetrics = metrics.workflows[workflowId];
    
    if (!workflowMetrics) {
      return null;
    }
    
    return {
      workflowId,
      metrics: workflowMetrics,
      insights: this.analytics.getInsights(),
      report: this.analytics.generateReport(timeRange)
    };
  }
  
  /**
   * Get system-wide analytics
   */
  getSystemAnalytics() {
    const baseMetrics = this.getMetrics();
    
    if (!this.analytics) {
      return baseMetrics;
    }
    
    return {
      ...baseMetrics,
      analytics: this.analytics.getMetrics(),
      insights: this.analytics.getInsights(),
      alerts: this.analytics.getAlerts(true)
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    const baseMetrics = {
      ...this.metrics,
      activeWorkflows: this.activeWorkflows.size,
      queuedWorkflows: this.executionQueue.length,
      runningWorkflows: this.runningWorkflows.size,
      specialists: this.specialists.size,
      templates: this.templates.size
    };
    
    // Add enhanced metrics if components are available
    if (this.scheduler) {
      baseMetrics.scheduler = this.scheduler.getMetrics();
    }
    
    if (this.orchestrator) {
      baseMetrics.orchestrator = this.orchestrator.getMetrics();
    }
    
    if (this.optimizer) {
      baseMetrics.optimizer = this.optimizer.getMetrics();
    }
    
    if (this.analytics) {
      baseMetrics.analytics = this.analytics.getMetrics();
    }
    
    return baseMetrics;
  }
  
  /**
   * Destroy the engine
   */
  destroy() {
    this.removeAllListeners();
    
    // Clean up specialists
    for (const specialist of this.specialists.values()) {
      specialist.destroy();
    }
    
    // Clean up enhanced components
    if (this.scheduler) {
      this.scheduler.stopScheduler();
    }
    
    if (this.analytics) {
      this.analytics.destroy();
    }
    
    this.workflows.clear();
    this.activeWorkflows.clear();
    this.completedWorkflows.clear();
    
    logger.info('💥 Workflow Engine destroyed');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  WorkflowEngine,
  getInstance: (config) => {
    if (!instance) {
      instance = new WorkflowEngine(config);
    }
    return instance;
  }
};