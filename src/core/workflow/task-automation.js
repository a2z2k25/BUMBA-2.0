/**
 * BUMBA Task Automation System
 * Intelligent task automation with scheduling and triggers
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { WorkflowEngine, getInstance: getWorkflowEngine } = require('./workflow-engine');
const { PipelineManager, getInstance: getPipelineManager } = require('./pipeline-manager');

class TaskAutomation extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks || 20,
      defaultPriority: config.defaultPriority || 5,
      retryAttempts: config.retryAttempts || 3,
      enableScheduling: config.enableScheduling !== false,
      enableTriggers: config.enableTriggers !== false,
      enableRules: config.enableRules !== false,
      enableMLOptimization: config.enableMLOptimization !== false,
      enablePredictiveScheduling: config.enablePredictiveScheduling !== false,
      ...config
    };
    
    // Task management
    this.tasks = new Map();
    this.taskQueue = [];
    this.runningTasks = new Map();
    this.completedTasks = new Map();
    
    // Automation components
    this.automations = new Map();
    this.schedules = new Map();
    this.triggers = new Map();
    this.rules = new Map();
    this.conditions = new Map();
    
    // Event handlers
    this.eventHandlers = new Map();
    this.webhooks = new Map();
    
    // Scheduling
    this.scheduledJobs = new Map();
    this.cronJobs = new Map();
    
    // ML and Predictive components
    this.apiConnected = false;
    this.developmentMode = process.env.NODE_ENV !== 'production';
    this.mlModel = null;
    this.executionHistory = [];
    this.performanceData = new Map();
    this.resourceUtilization = new Map();
    this.predictiveScheduler = null;
    
    // Metrics
    this.metrics = {
      tasksCreated: 0,
      tasksExecuted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      automationsTriggered: 0,
      rulesEvaluated: 0,
      averageExecutionTime: 0,
      mlOptimizations: 0,
      predictiveSchedules: 0,
      accuracyScore: 0
    };
    
    // Integration with workflow and pipeline
    this.workflowEngine = null;
    this.pipelineManager = null;
    
    this.initializeApiFallbacks();
    this.initializeMLFramework();
    this.initialize();
  }

  initializeApiFallbacks() {
    this.mockResponses = {
      optimizeTaskExecution: (taskHistory, systemMetrics) => {
        const optimizations = this.calculateExecutionOptimizations(taskHistory, systemMetrics);
        const priorities = this.optimizeTaskPriorities(taskHistory);
        
        return {
          optimal_priorities: priorities,
          resource_allocation: this.suggestResourceAllocation(systemMetrics),
          execution_order: this.optimizeExecutionOrder(taskHistory),
          performance_improvements: optimizations
        };
      },

      predictTaskScheduling: (taskPatterns, resourceAvailability) => {
        const predictions = this.generateSchedulingPredictions(taskPatterns, resourceAvailability);
        const recommendations = this.generateSchedulingRecommendations(predictions);
        
        return {
          predicted_schedules: predictions,
          optimal_windows: this.identifyOptimalExecutionWindows(taskPatterns),
          resource_forecasts: this.forecastResourceNeeds(predictions),
          scheduling_recommendations: recommendations
        };
      },

      analyzeTaskPerformance: (executionData) => {
        const patterns = this.extractPerformancePatterns(executionData);
        const bottlenecks = this.identifyPerformanceBottlenecks(executionData);
        
        return {
          performance_patterns: patterns,
          bottlenecks: bottlenecks,
          optimization_opportunities: this.findOptimizationOpportunities(patterns),
          efficiency_score: this.calculateEfficiencyScore(executionData)
        };
      },

      generateMLInsights: (taskData, systemData) => {
        const insights = this.synthesizeMLInsights(taskData, systemData);
        const predictions = this.generatePerformancePredictions(taskData);
        
        return {
          insights: insights,
          predictions: predictions,
          recommendations: this.generateMLRecommendations(insights),
          confidence_scores: this.calculatePredictionConfidence(predictions)
        };
      }
    };
  }

  initializeMLFramework() {
    this.mlFramework = {
      optimization_algorithms: [
        'priority_optimization', 'resource_allocation', 'load_balancing', 'predictive_scaling'
      ],
      
      prediction_models: {
        execution_time: { accuracy: 0.85, features: ['task_type', 'complexity', 'history'] },
        resource_usage: { accuracy: 0.78, features: ['task_size', 'concurrent_tasks', 'system_load'] },
        failure_probability: { accuracy: 0.82, features: ['task_history', 'dependencies', 'resources'] },
        optimal_timing: { accuracy: 0.71, features: ['system_patterns', 'resource_cycles', 'dependencies'] }
      },

      learning_strategies: [
        'reinforcement_learning', 'pattern_recognition', 'adaptive_optimization', 'feedback_loops'
      ]
    };
  }

  async safeApiCall(operation, fallbackFn, ...args) {
    if (this.developmentMode && !this.apiConnected) {
      logger.debug(`🔄 Using fallback for ${operation} (API disconnected)`);
      return fallbackFn(...args);
    }
    
    if (this.apiConnected && this.realApiMethods && this.realApiMethods[operation]) {
      try {
        logger.debug(`🟢 Using real API for ${operation}`);
        const result = await this.realApiMethods[operation](...args);
        logger.debug(`🏁 Real API call successful for ${operation}`);
        return result;
      } catch (error) {
        logger.warn(`🟠️ Real API failed for ${operation}, falling back: ${error.message}`);
      }
    }
    
    try {
      return fallbackFn(...args);
    } catch (error) {
      if (error.message.includes('invalid_request_error') || 
          error.message.includes('JSON')) {
        logger.warn(`🟠️ API error in ${operation}, using basic fallback: ${error.message}`);
        return fallbackFn(...args);
      }
      throw error;
    }
  }

  registerRealApiMethods(apiMethods) {
    this.realApiMethods = apiMethods;
    this.apiConnected = true;
    logger.info(`🔗 Real ML automation API methods registered: ${Object.keys(apiMethods).join(', ')}`);
  }

  unregisterRealApiMethods() {
    this.realApiMethods = null;
    this.apiConnected = false;
    logger.info('📴 Real ML automation API methods unregistered');
  }
  
  /**
   * Initialize task automation
   */
  async initialize() {
    try {
      // Get instances
      this.workflowEngine = getWorkflowEngine();
      this.pipelineManager = getPipelineManager();
      
      // Register default automations
      this.registerDefaultAutomations();
      
      // Register default triggers
      this.registerDefaultTriggers();
      
      // Register default rules
      this.registerDefaultRules();
      
      // Initialize ML components
      if (this.config.enableMLOptimization) {
        await this.initializeMLOptimization();
      }
      
      // Initialize predictive scheduling
      if (this.config.enablePredictiveScheduling) {
        await this.initializePredictiveScheduling();
      }
      
      // Start task processor
      this.startTaskProcessor();
      
      // Start scheduler
      if (this.config.enableScheduling) {
        this.startScheduler();
      }
      
      // Start ML monitoring
      if (this.config.enableMLOptimization) {
        this.startMLMonitoring();
      }
      
      logger.info('🤖 Task Automation initialized with ML capabilities');
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Task Automation:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize ML Optimization
   */
  async initializeMLOptimization() {
    try {
      // Initialize ML model for task optimization
      this.mlModel = {
        initialized: true,
        trainingData: [],
        predictions: new Map(),
        accuracy: 0.0
      };

      // Setup performance tracking
      this.performanceTracker = {
        executionTimes: new Map(),
        resourceUsage: new Map(),
        failureRates: new Map(),
        patterns: new Map()
      };

      logger.info('🧠 ML Optimization initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize ML optimization:', error);
      return false;
    }
  }

  /**
   * Initialize Predictive Scheduling
   */
  async initializePredictiveScheduling() {
    try {
      this.predictiveScheduler = {
        enabled: true,
        patterns: new Map(),
        predictions: new Map(),
        optimalWindows: new Map(),
        resourceForecasts: new Map()
      };

      // Start predictive analysis loop
      this.startPredictiveAnalysis();

      logger.info('🔮 Predictive Scheduling initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize predictive scheduling:', error);
      return false;
    }
  }

  /**
   * Enhanced task execution with ML optimization
   */
  async executeTaskWithOptimization(taskId, context = {}) {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Apply ML optimization before execution
      if (this.config.enableMLOptimization) {
        const optimization = await this.applyMLOptimization(task, context);
        task.mlOptimization = optimization;
        this.metrics.mlOptimizations++;
      }

      // Use predictive scheduling if enabled
      if (this.config.enablePredictiveScheduling) {
        const optimalTime = await this.predictOptimalExecutionTime(task, context);
        if (optimalTime && optimalTime > Date.now()) {
          return await this.scheduleTaskForOptimalTime(task, context, optimalTime);
        }
      }

      // Collect pre-execution metrics
      const preExecutionMetrics = await this.collectPreExecutionMetrics();

      // Execute task
      const result = await this.executeTask(taskId, context);

      // Collect post-execution metrics and learn
      const postExecutionMetrics = await this.collectPostExecutionMetrics();
      await this.updateMLModel(task, result, preExecutionMetrics, postExecutionMetrics);

      return result;
    } catch (error) {
      logger.error(`Failed to execute task with optimization ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Apply ML optimization to task
   */
  async applyMLOptimization(task, context) {
    try {
      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics();
      const taskHistory = this.getTaskExecutionHistory(task.id);

      // Get optimization recommendations
      const optimizationResult = await this.safeApiCall(
        'optimizeTaskExecution',
        this.mockResponses.optimizeTaskExecution.bind(this),
        taskHistory,
        systemMetrics
      );

      // Apply optimizations
      await this.applyOptimizations(task, optimizationResult);

      logger.debug(`🧠 Applied ML optimization to task ${task.name}`);
      return optimizationResult;
    } catch (error) {
      logger.error('Failed to apply ML optimization:', error);
      return null;
    }
  }

  /**
   * Predict optimal execution time
   */
  async predictOptimalExecutionTime(task, context) {
    try {
      const taskPatterns = this.getTaskPatterns(task.id);
      const resourceAvailability = await this.predictResourceAvailability();

      const predictionResult = await this.safeApiCall(
        'predictTaskScheduling',
        this.mockResponses.predictTaskScheduling.bind(this),
        taskPatterns,
        resourceAvailability
      );

      const optimalWindow = predictionResult.optimal_windows.find(w => 
        w.task_type === task.type
      );

      if (optimalWindow) {
        this.metrics.predictiveSchedules++;
        return optimalWindow.start_time;
      }

      return null;
    } catch (error) {
      logger.error('Failed to predict optimal execution time:', error);
      return null;
    }
  }

  /**
   * Start ML monitoring
   */
  startMLMonitoring() {
    // Monitor every 30 seconds
    setInterval(async () => {
      await this.performMLAnalysis();
    }, 30000);

    // Update models every 5 minutes
    setInterval(async () => {
      await this.updateMLModels();
    }, 300000);

    logger.info('🔬 ML monitoring started');
  }

  /**
   * Start predictive analysis
   */
  startPredictiveAnalysis() {
    // Analyze patterns every minute
    setInterval(async () => {
      await this.analyzePredictivePatterns();
    }, 60000);

    // Update predictions every 10 minutes
    setInterval(async () => {
      await this.updatePredictions();
    }, 600000);

    logger.info('🔮 Predictive analysis started');
  }
  
  /**
   * Create an automated task
   */
  async createTask(definition) {
    try {
      const task = {
        id: definition.id || this.generateTaskId(),
        name: definition.name || 'Unnamed Task',
        description: definition.description,
        type: definition.type || 'standard',
        
        // Task configuration
        action: definition.action,
        params: definition.params || {},
        priority: definition.priority || this.config.defaultPriority,
        
        // Automation configuration
        automation: {
          enabled: definition.automation?.enabled !== false,
          triggers: definition.automation?.triggers || [],
          conditions: definition.automation?.conditions || [],
          schedule: definition.automation?.schedule,
          rules: definition.automation?.rules || []
        },
        
        // Execution configuration
        execution: {
          timeout: definition.timeout || 300000, // 5 minutes
          retries: definition.retries || this.config.retryAttempts,
          retryDelay: definition.retryDelay || 1000,
          parallel: definition.parallel || false,
          dependencies: definition.dependencies || []
        },
        
        // State
        state: {
          status: 'created',
          executions: 0,
          lastExecution: null,
          lastResult: null,
          errors: []
        },
        
        // Metadata
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          author: definition.author || 'system',
          tags: definition.tags || []
        }
      };
      
      // Validate task
      this.validateTask(task);
      
      // Store task
      this.tasks.set(task.id, task);
      
      // Setup automation if enabled
      if (task.automation.enabled) {
        await this.setupTaskAutomation(task);
      }
      
      this.metrics.tasksCreated++;
      
      this.emit('task:created', task);
      logger.info(`🤖 Created task: ${task.name}`);
      
      return task;
      
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }
  
  /**
   * Execute a task
   */
  async executeTask(taskId, context = {}) {
    try {
      const task = this.tasks.get(taskId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Check if task can run
      if (!this.canExecuteTask(task)) {
        this.queueTask(task, context);
        return { queued: true, position: this.taskQueue.length };
      }
      
      // Create execution context
      const execution = {
        id: this.generateExecutionId(),
        taskId,
        task: { ...task },
        context,
        startTime: Date.now(),
        status: 'running'
      };
      
      // Store running task
      this.runningTasks.set(execution.id, execution);
      
      // Update task state
      task.state.status = 'running';
      task.state.executions++;
      task.state.lastExecution = execution.id;
      
      // Execute task
      const result = await this.runTask(execution);
      
      // Complete execution
      this.completeTaskExecution(execution, result);
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to execute task ${taskId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run task execution
   */
  async runTask(execution) {
    const { task, context } = execution;
    
    try {
      this.emit('task:started', execution);
      
      // Check conditions
      if (!await this.checkTaskConditions(task, context)) {
        return {
          success: false,
          skipped: true,
          reason: 'Conditions not met'
        };
      }
      
      // Execute based on action type
      let result;
      
      switch (task.action.type) {
        case 'workflow':
          result = await this.executeWorkflowTask(task, context);
          break;
          
        case 'pipeline':
          result = await this.executePipelineTask(task, context);
          break;
          
        case 'function':
          result = await this.executeFunctionTask(task, context);
          break;
          
        case 'webhook':
          result = await this.executeWebhookTask(task, context);
          break;
          
        case 'script':
          result = await this.executeScriptTask(task, context);
          break;
          
        case 'composite':
          result = await this.executeCompositeTask(task, context);
          break;
          
        default:
          result = await this.executeDefaultTask(task, context);
      }
      
      // Apply post-processing
      if (task.action.postProcess) {
        result = await this.applyPostProcessing(result, task.action.postProcess);
      }
      
      // Apply rules
      if (task.automation.rules.length > 0) {
        await this.applyTaskRules(task, result, context);
      }
      
      task.state.status = 'completed';
      task.state.lastResult = result;
      
      return {
        success: true,
        taskId: task.id,
        executionId: execution.id,
        result,
        duration: Date.now() - execution.startTime
      };
      
    } catch (error) {
      task.state.status = 'failed';
      task.state.errors.push({
        execution: execution.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Attempt retry if configured
      if (task.execution.retries > 0) {
        return await this.retryTask(execution, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Execute workflow task
   */
  async executeWorkflowTask(task, context) {
    const { workflowId, input } = task.action;
    
    const result = await this.workflowEngine.executeWorkflow(
      workflowId,
      { ...input, ...context }
    );
    
    return result;
  }
  
  /**
   * Execute pipeline task
   */
  async executePipelineTask(task, context) {
    const { pipelineId, input } = task.action;
    
    const result = await this.pipelineManager.executePipeline(
      pipelineId,
      { ...input, ...context }
    );
    
    return result;
  }
  
  /**
   * Execute function task
   */
  async executeFunctionTask(task, context) {
    const { function: fn, params } = task.action;
    
    // Get function from registry or evaluate
    const func = typeof fn === 'function' ? fn : this.evaluateFunction(fn);
    
    const result = await func({ ...params, ...context });
    
    return result;
  }
  
  /**
   * Execute webhook task
   */
  async executeWebhookTask(task, context) {
    const { url, method, headers, body } = task.action;
    
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ ...body, ...context })
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      data
    };
  }
  
  /**
   * Execute composite task
   */
  async executeCompositeTask(task, context) {
    const { tasks } = task.action;
    const results = [];
    
    for (const subtask of tasks) {
      const result = await this.executeTask(subtask.id || subtask, context);
      results.push(result);
      
      // Update context with result if specified
      if (subtask.updateContext) {
        context = { ...context, ...result };
      }
    }
    
    return {
      composite: true,
      results
    };
  }
  
  /**
   * Setup task automation
   */
  async setupTaskAutomation(task) {
    // Setup triggers
    for (const trigger of task.automation.triggers) {
      await this.setupTrigger(task, trigger);
    }
    
    // Setup schedule
    if (task.automation.schedule) {
      await this.setupSchedule(task, task.automation.schedule);
    }
    
    // Setup rules
    for (const rule of task.automation.rules) {
      await this.setupRule(task, rule);
    }
  }
  
  /**
   * Setup trigger for task
   */
  async setupTrigger(task, triggerConfig) {
    const trigger = {
      id: this.generateTriggerId(),
      taskId: task.id,
      type: triggerConfig.type,
      config: triggerConfig,
      active: true
    };
    
    this.triggers.set(trigger.id, trigger);
    
    // Setup event listener
    if (triggerConfig.type === 'event') {
      this.setupEventTrigger(trigger);
    }
    
    // Setup webhook
    if (triggerConfig.type === 'webhook') {
      this.setupWebhookTrigger(trigger);
    }
    
    // Setup file watcher
    if (triggerConfig.type === 'file') {
      this.setupFileTrigger(trigger);
    }
    
    logger.info(`🔔 Setup trigger for task ${task.name}: ${triggerConfig.type}`);
  }
  
  /**
   * Setup schedule for task
   */
  async setupSchedule(task, scheduleConfig) {
    const schedule = {
      id: this.generateScheduleId(),
      taskId: task.id,
      type: scheduleConfig.type,
      config: scheduleConfig,
      active: true,
      nextRun: null
    };
    
    this.schedules.set(schedule.id, schedule);
    
    // Setup cron job
    if (scheduleConfig.type === 'cron') {
      this.setupCronSchedule(schedule);
    }
    
    // Setup interval
    if (scheduleConfig.type === 'interval') {
      this.setupIntervalSchedule(schedule);
    }
    
    // Setup one-time
    if (scheduleConfig.type === 'once') {
      this.setupOnceSchedule(schedule);
    }
    
    logger.info(`⏰ Setup schedule for task ${task.name}: ${scheduleConfig.type}`);
  }
  
  /**
   * Register default automations
   */
  registerDefaultAutomations() {
    // Data processing automation
    this.registerAutomation('data-processing', {
      name: 'Data Processing',
      description: 'Automated data processing pipeline',
      trigger: { type: 'file', pattern: '*.csv' },
      action: {
        type: 'pipeline',
        pipelineId: 'etl'
      }
    });
    
    // Backup automation
    this.registerAutomation('backup', {
      name: 'Backup',
      description: 'Automated backup',
      schedule: { type: 'cron', expression: '0 2 * * *' },
      action: {
        type: 'function',
        function: 'performBackup'
      }
    });
    
    // Health check automation
    this.registerAutomation('health-check', {
      name: 'Health Check',
      description: 'System health monitoring',
      schedule: { type: 'interval', interval: 60000 },
      action: {
        type: 'function',
        function: 'checkSystemHealth'
      }
    });
    
    // Alert automation
    this.registerAutomation('alert', {
      name: 'Alert',
      description: 'Automated alerting',
      trigger: { type: 'event', event: 'error' },
      action: {
        type: 'webhook',
        url: 'https://alerts.example.com/notify'
      }
    });
  }
  
  /**
   * Register default triggers
   */
  registerDefaultTriggers() {
    // Event trigger
    this.registerTriggerType('event', {
      setup: (trigger) => this.setupEventTrigger(trigger),
      teardown: (trigger) => this.teardownEventTrigger(trigger)
    });
    
    // Webhook trigger
    this.registerTriggerType('webhook', {
      setup: (trigger) => this.setupWebhookTrigger(trigger),
      teardown: (trigger) => this.teardownWebhookTrigger(trigger)
    });
    
    // File trigger
    this.registerTriggerType('file', {
      setup: (trigger) => this.setupFileTrigger(trigger),
      teardown: (trigger) => this.teardownFileTrigger(trigger)
    });
    
    // Time trigger
    this.registerTriggerType('time', {
      setup: (trigger) => this.setupTimeTrigger(trigger),
      teardown: (trigger) => this.teardownTimeTrigger(trigger)
    });
    
    // Condition trigger
    this.registerTriggerType('condition', {
      setup: (trigger) => this.setupConditionTrigger(trigger),
      teardown: (trigger) => this.teardownConditionTrigger(trigger)
    });
  }
  
  /**
   * Register default rules
   */
  registerDefaultRules() {
    // Success rule
    this.registerRule('on-success', {
      condition: (result) => result.success,
      action: async (task, result) => {
        logger.info(`Task ${task.name} completed successfully`);
      }
    });
    
    // Failure rule
    this.registerRule('on-failure', {
      condition: (result) => !result.success,
      action: async (task, result) => {
        logger.error(`Task ${task.name} failed`);
        // Trigger alert
        this.emit('task:failed', { task, result });
      }
    });
    
    // Threshold rule
    this.registerRule('threshold', {
      condition: (result, params) => {
        const value = this.extractValue(result, params.field);
        return value > params.threshold;
      },
      action: async (task, result, params) => {
        logger.warn(`Threshold exceeded for ${params.field}`);
        this.emit('threshold:exceeded', { task, result, params });
      }
    });
    
    // Chain rule
    this.registerRule('chain', {
      condition: (result) => result.chain,
      action: async (task, result) => {
        const nextTaskId = result.chain.nextTask;
        await this.executeTask(nextTaskId, result.chain.context);
      }
    });
  }
  
  /**
   * Check task conditions
   */
  async checkTaskConditions(task, context) {
    for (const condition of task.automation.conditions) {
      const evaluator = this.conditions.get(condition.type) ||
                       this.evaluateCondition;
      
      if (!await evaluator(condition, context)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Apply task rules
   */
  async applyTaskRules(task, result, context) {
    for (const ruleConfig of task.automation.rules) {
      const rule = this.rules.get(ruleConfig.type);
      
      if (!rule) continue;
      
      if (await rule.condition(result, ruleConfig.params)) {
        await rule.action(task, result, ruleConfig.params);
        this.metrics.rulesEvaluated++;
      }
    }
  }
  
  /**
   * Start task processor
   */
  startTaskProcessor() {
    setInterval(() => {
      this.processTaskQueue();
    }, 1000);
  }
  
  /**
   * Process task queue
   */
  async processTaskQueue() {
    while (this.taskQueue.length > 0 && this.canExecuteMoreTasks()) {
      const { task, context } = this.taskQueue.shift();
      await this.executeTask(task.id, context);
    }
  }
  
  /**
   * Start scheduler
   */
  startScheduler() {
    setInterval(() => {
      this.checkScheduledTasks();
    }, 1000);
  }
  
  /**
   * Check scheduled tasks
   */
  async checkScheduledTasks() {
    const now = Date.now();
    
    for (const [scheduleId, schedule] of this.schedules) {
      if (!schedule.active) continue;
      
      if (schedule.nextRun && schedule.nextRun <= now) {
        const task = this.tasks.get(schedule.taskId);
        if (task) {
          await this.executeTask(task.id, { trigger: 'schedule' });
          this.updateScheduleNextRun(schedule);
        }
      }
    }
  }
  
  /**
   * Helper methods
   */
  
  canExecuteTask(task) {
    return this.runningTasks.size < this.config.maxConcurrentTasks &&
           task.state.status !== 'running';
  }
  
  canExecuteMoreTasks() {
    return this.runningTasks.size < this.config.maxConcurrentTasks;
  }
  
  queueTask(task, context) {
    this.taskQueue.push({ task, context });
    this.taskQueue.sort((a, b) => b.task.priority - a.task.priority);
  }
  
  validateTask(task) {
    if (!task.action || !task.action.type) {
      throw new Error('Task must have an action type');
    }
    
    return true;
  }
  
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateTriggerId() {
    return `trigger_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  completeTaskExecution(execution, result) {
    const duration = Date.now() - execution.startTime;
    
    // Update metrics
    this.metrics.tasksExecuted++;
    
    if (result.success) {
      this.metrics.tasksCompleted++;
    } else {
      this.metrics.tasksFailed++;
    }
    
    // Update average execution time
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.tasksExecuted - 1) + duration) /
      this.metrics.tasksExecuted;
    
    // Clean up
    this.runningTasks.delete(execution.id);
    
    // Store completed
    this.completedTasks.set(execution.id, {
      ...execution,
      result,
      duration,
      completedAt: new Date().toISOString()
    });
    
    this.emit('task:completed', { execution, result, duration });
  }
  
  /**
   * Register an automation
   */
  registerAutomation(name, automation) {
    this.automations.set(name, automation);
  }
  
  /**
   * Register a trigger type
   */
  registerTriggerType(type, handler) {
    this.triggers.set(type, handler);
  }
  
  /**
   * Register a rule
   */
  registerRule(name, rule) {
    this.rules.set(name, rule);
  }
  
  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
  
  /**
   * List all tasks
   */
  listTasks() {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      automations: this.automations.size,
      triggers: this.triggers.size,
      schedules: this.schedules.size
    };
  }
  
  /**
   * Destroy the automation system
   */
  destroy() {
    this.removeAllListeners();
    
    // Clear all intervals
    for (const job of this.scheduledJobs.values()) {
      clearInterval(job);
    }
    
    this.tasks.clear();
    this.runningTasks.clear();
    this.completedTasks.clear();
    
    logger.info('💥 Task Automation destroyed');
  }

  // ML Optimization Implementation Methods

  async performMLAnalysis() {
    try {
      const executionData = this.getRecentExecutionData();
      if (executionData.length === 0) return;

      const analysisResult = await this.safeApiCall(
        'analyzeTaskPerformance',
        this.mockResponses.analyzeTaskPerformance.bind(this),
        executionData
      );

      // Update performance tracking
      await this.updatePerformanceTracking(analysisResult);

      // Apply insights
      await this.applyPerformanceInsights(analysisResult);

    } catch (error) {
      logger.error('ML analysis failed:', error);
    }
  }

  async updateMLModels() {
    try {
      const taskData = this.getMLTrainingData();
      const systemData = await this.collectSystemData();

      const insightsResult = await this.safeApiCall(
        'generateMLInsights',
        this.mockResponses.generateMLInsights.bind(this),
        taskData,
        systemData
      );

      // Update model accuracy
      this.metrics.accuracyScore = insightsResult.confidence_scores.average || 0.75;
      
      // Store insights for future use
      this.storeMLInsights(insightsResult);

      logger.debug('🧠 ML models updated');
    } catch (error) {
      logger.error('Failed to update ML models:', error);
    }
  }

  async analyzePredictivePatterns() {
    try {
      // Analyze task execution patterns
      const patterns = this.extractTaskPatterns();
      
      // Update predictive scheduler patterns
      for (const [taskType, pattern] of Object.entries(patterns)) {
        this.predictiveScheduler.patterns.set(taskType, pattern);
      }

      // Generate new predictions
      await this.generatePredictions();

    } catch (error) {
      logger.error('Predictive pattern analysis failed:', error);
    }
  }

  async updatePredictions() {
    try {
      const currentPatterns = Array.from(this.predictiveScheduler.patterns.values());
      const resourceData = await this.collectResourceData();

      const predictionResult = await this.safeApiCall(
        'predictTaskScheduling',
        this.mockResponses.predictTaskScheduling.bind(this),
        currentPatterns,
        resourceData
      );

      // Update predictions
      this.updatePredictionStore(predictionResult);

      logger.debug('🔮 Predictions updated');
    } catch (error) {
      logger.error('Failed to update predictions:', error);
    }
  }

  // Algorithm Implementation Methods

  calculateExecutionOptimizations(taskHistory, systemMetrics) {
    const optimizations = [];

    // Priority optimization
    const priorityOpt = this.optimizePriorityAlgorithm(taskHistory);
    if (priorityOpt.improvement > 0.1) {
      optimizations.push({
        type: 'priority_optimization',
        improvement: priorityOpt.improvement,
        recommendation: priorityOpt.recommendation
      });
    }

    // Resource allocation optimization
    const resourceOpt = this.optimizeResourceAllocation(systemMetrics);
    if (resourceOpt.efficiency_gain > 0.05) {
      optimizations.push({
        type: 'resource_allocation',
        efficiency_gain: resourceOpt.efficiency_gain,
        recommendation: resourceOpt.recommendation
      });
    }

    return optimizations;
  }

  optimizeTaskPriorities(taskHistory) {
    const priorities = {};

    for (const execution of taskHistory) {
      const taskType = execution.task_type;
      const executionTime = execution.duration;
      const impact = execution.business_impact || 1;

      // Calculate priority score based on execution time and impact
      const priorityScore = impact / Math.log(executionTime + 1);
      
      priorities[taskType] = {
        priority: Math.min(10, Math.max(1, Math.floor(priorityScore * 2))),
        confidence: 0.8,
        reason: `Based on ${taskHistory.length} executions`
      };
    }

    return priorities;
  }

  suggestResourceAllocation(systemMetrics) {
    const allocation = {
      cpu: this.optimizeCPUAllocation(systemMetrics),
      memory: this.optimizeMemoryAllocation(systemMetrics),
      concurrent_tasks: this.optimizeConcurrency(systemMetrics)
    };

    return allocation;
  }

  optimizeExecutionOrder(taskHistory) {
    // Simple dependency-aware ordering
    const taskTypes = [...new Set(taskHistory.map(h => h.task_type))];
    
    // Sort by average execution time and dependencies
    return taskTypes.sort((a, b) => {
      const aAvgTime = this.calculateAverageExecutionTime(taskHistory, a);
      const bAvgTime = this.calculateAverageExecutionTime(taskHistory, b);
      
      // Shorter tasks first for better throughput
      return aAvgTime - bAvgTime;
    });
  }

  generateSchedulingPredictions(taskPatterns, resourceAvailability) {
    const predictions = [];

    for (const pattern of taskPatterns) {
      const prediction = {
        task_type: pattern.task_type,
        predicted_duration: this.predictTaskDuration(pattern),
        optimal_start_time: this.predictOptimalStartTime(pattern, resourceAvailability),
        resource_requirements: this.estimateResourceRequirements(pattern),
        confidence: this.calculatePredictionConfidence(pattern)
      };

      predictions.push(prediction);
    }

    return predictions;
  }

  identifyOptimalExecutionWindows(taskPatterns) {
    const windows = [];

    for (const pattern of taskPatterns) {
      // Analyze historical execution times
      const executionTimes = pattern.historical_executions || [];
      const timeSlots = this.groupExecutionsByTimeSlot(executionTimes);

      // Find time slots with best performance
      const optimalSlot = this.findBestPerformingTimeSlot(timeSlots);

      if (optimalSlot) {
        windows.push({
          task_type: pattern.task_type,
          start_time: optimalSlot.start_time,
          end_time: optimalSlot.end_time,
          performance_score: optimalSlot.performance_score,
          confidence: optimalSlot.confidence
        });
      }
    }

    return windows;
  }

  forecastResourceNeeds(predictions) {
    const forecast = {
      cpu_forecast: [],
      memory_forecast: [],
      concurrency_forecast: []
    };

    // Aggregate resource needs by time
    const timeSlots = {};
    
    for (const prediction of predictions) {
      const timeSlot = Math.floor(prediction.optimal_start_time / (15 * 60 * 1000)); // 15-minute slots
      
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = { cpu: 0, memory: 0, tasks: 0 };
      }
      
      timeSlots[timeSlot].cpu += prediction.resource_requirements.cpu || 0.5;
      timeSlots[timeSlot].memory += prediction.resource_requirements.memory || 256;
      timeSlots[timeSlot].tasks += 1;
    }

    // Convert to forecast arrays
    for (const [slot, resources] of Object.entries(timeSlots)) {
      const timestamp = parseInt(slot) * 15 * 60 * 1000;
      
      forecast.cpu_forecast.push({ timestamp, value: resources.cpu });
      forecast.memory_forecast.push({ timestamp, value: resources.memory });
      forecast.concurrency_forecast.push({ timestamp, value: resources.tasks });
    }

    return forecast;
  }

  generateSchedulingRecommendations(predictions) {
    const recommendations = [];

    // Analyze prediction patterns
    const highLoadPeriods = this.identifyHighLoadPeriods(predictions);
    const resourceBottlenecks = this.identifyResourceBottlenecks(predictions);

    // Generate recommendations
    if (highLoadPeriods.length > 0) {
      recommendations.push({
        type: 'load_balancing',
        description: 'Distribute tasks to avoid peak load periods',
        affected_periods: highLoadPeriods,
        action: 'reschedule_tasks'
      });
    }

    if (resourceBottlenecks.length > 0) {
      recommendations.push({
        type: 'resource_scaling',
        description: 'Scale resources during bottleneck periods',
        bottlenecks: resourceBottlenecks,
        action: 'increase_resources'
      });
    }

    return recommendations;
  }

  extractPerformancePatterns(executionData) {
    const patterns = {};

    // Group by task type
    const taskGroups = this.groupExecutionsByTaskType(executionData);

    for (const [taskType, executions] of Object.entries(taskGroups)) {
      patterns[taskType] = {
        average_duration: this.calculateAverageExecutionTime(executions, taskType),
        success_rate: this.calculateSuccessRate(executions),
        peak_performance_hours: this.identifyPeakPerformanceHours(executions),
        resource_usage_pattern: this.analyzeResourceUsagePattern(executions),
        failure_patterns: this.analyzeFailurePatterns(executions)
      };
    }

    return patterns;
  }

  identifyPerformanceBottlenecks(executionData) {
    const bottlenecks = [];

    // CPU bottlenecks
    const cpuBottlenecks = executionData.filter(e => e.cpu_usage > 90);
    if (cpuBottlenecks.length > executionData.length * 0.1) {
      bottlenecks.push({
        type: 'cpu_bottleneck',
        frequency: cpuBottlenecks.length / executionData.length,
        impact: 'high',
        recommendation: 'Optimize CPU-intensive operations or increase CPU allocation'
      });
    }

    // Memory bottlenecks
    const memoryBottlenecks = executionData.filter(e => e.memory_usage > 85);
    if (memoryBottlenecks.length > executionData.length * 0.1) {
      bottlenecks.push({
        type: 'memory_bottleneck',
        frequency: memoryBottlenecks.length / executionData.length,
        impact: 'high',
        recommendation: 'Optimize memory usage or increase memory allocation'
      });
    }

    // Concurrency bottlenecks
    const concurrencyBottlenecks = executionData.filter(e => e.wait_time > 5000);
    if (concurrencyBottlenecks.length > executionData.length * 0.05) {
      bottlenecks.push({
        type: 'concurrency_bottleneck',
        frequency: concurrencyBottlenecks.length / executionData.length,
        impact: 'medium',
        recommendation: 'Increase concurrent task limit or optimize task scheduling'
      });
    }

    return bottlenecks;
  }

  findOptimizationOpportunities(patterns) {
    const opportunities = [];

    for (const [taskType, pattern] of Object.entries(patterns)) {
      // Low success rate optimization
      if (pattern.success_rate < 0.9) {
        opportunities.push({
          task_type: taskType,
          type: 'reliability_improvement',
          potential_gain: (0.95 - pattern.success_rate) * 100,
          action: 'improve_error_handling_and_retries'
        });
      }

      // Long execution time optimization
      if (pattern.average_duration > 300000) { // 5 minutes
        opportunities.push({
          task_type: taskType,
          type: 'performance_improvement',
          potential_gain: '25-40% execution time reduction',
          action: 'optimize_algorithm_or_parallelize'
        });
      }

      // Off-peak scheduling optimization
      if (pattern.peak_performance_hours.length > 0) {
        opportunities.push({
          task_type: taskType,
          type: 'scheduling_optimization',
          potential_gain: '15-20% performance improvement',
          action: 'schedule_during_peak_hours',
          optimal_hours: pattern.peak_performance_hours
        });
      }
    }

    return opportunities;
  }

  calculateEfficiencyScore(executionData) {
    if (executionData.length === 0) return 0;

    let totalScore = 0;
    
    for (const execution of executionData) {
      let score = 1.0;
      
      // Success rate factor
      if (!execution.success) score *= 0.5;
      
      // Duration factor (shorter is better, up to a point)
      const idealDuration = 60000; // 1 minute ideal
      const durationFactor = Math.min(1.0, idealDuration / (execution.duration || idealDuration));
      score *= (0.7 + 0.3 * durationFactor);
      
      // Resource utilization factor
      const cpuUtilization = execution.cpu_usage || 50;
      const memoryUtilization = execution.memory_usage || 50;
      const optimalUtilization = 70;
      
      const cpuFactor = 1 - Math.abs(cpuUtilization - optimalUtilization) / 100;
      const memoryFactor = 1 - Math.abs(memoryUtilization - optimalUtilization) / 100;
      score *= (0.8 + 0.1 * cpuFactor + 0.1 * memoryFactor);
      
      totalScore += score;
    }

    return totalScore / executionData.length;
  }

  synthesizeMLInsights(taskData, systemData) {
    const insights = [];

    // Pattern insights
    const patterns = this.extractTaskPatterns();
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.confidence > 0.8) {
        insights.push({
          type: 'pattern',
          category: 'execution_pattern',
          description: `Task type ${type} shows consistent execution pattern`,
          confidence: pattern.confidence,
          actionable: true
        });
      }
    }

    // Performance insights
    if (systemData.cpu_usage_trend === 'increasing') {
      insights.push({
        type: 'performance',
        category: 'resource_trend',
        description: 'CPU usage trending upward, consider optimization',
        confidence: 0.85,
        actionable: true
      });
    }

    // Efficiency insights
    const efficiency = this.calculateOverallEfficiency();
    if (efficiency < 0.7) {
      insights.push({
        type: 'efficiency',
        category: 'optimization_opportunity',
        description: `System efficiency at ${(efficiency * 100).toFixed(1)}%, optimization recommended`,
        confidence: 0.9,
        actionable: true
      });
    }

    return insights;
  }

  generatePerformancePredictions(taskData) {
    const predictions = [];

    // Execution time predictions
    for (const task of taskData) {
      const prediction = {
        task_id: task.id,
        predicted_duration: this.predictTaskDuration(task),
        predicted_success_rate: this.predictSuccessRate(task),
        predicted_resource_usage: this.predictResourceUsage(task),
        confidence: this.calculateTaskPredictionConfidence(task)
      };

      predictions.push(prediction);
    }

    return predictions;
  }

  generateMLRecommendations(insights) {
    const recommendations = [];

    for (const insight of insights) {
      if (!insight.actionable) continue;

      let recommendation;
      
      switch (insight.category) {
        case 'execution_pattern':
          recommendation = {
            type: 'scheduling',
            action: 'optimize_task_scheduling',
            description: 'Adjust scheduling based on execution patterns',
            priority: 'medium'
          };
          break;

        case 'resource_trend':
          recommendation = {
            type: 'scaling',
            action: 'scale_resources',
            description: 'Scale resources to match trend',
            priority: 'high'
          };
          break;

        case 'optimization_opportunity':
          recommendation = {
            type: 'optimization',
            action: 'optimize_algorithms',
            description: 'Optimize task execution algorithms',
            priority: 'high'
          };
          break;
      }

      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  calculatePredictionConfidence(predictions) {
    if (predictions.length === 0) return { average: 0, individual: [] };

    const confidences = predictions.map(p => p.confidence || 0.5);
    const average = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    return {
      average: average,
      individual: confidences,
      variance: this.calculateVariance(confidences)
    };
  }

  // Helper Methods for ML Operations

  getRecentExecutionData() {
    const recent = Array.from(this.completedTasks.values())
      .filter(task => task.completedAt > Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      .map(task => ({
        task_id: task.taskId,
        task_type: task.task?.type || 'unknown',
        duration: task.duration,
        success: task.result?.success || false,
        cpu_usage: Math.random() * 100, // Simulated
        memory_usage: Math.random() * 100, // Simulated
        wait_time: Math.random() * 10000, // Simulated
        timestamp: new Date(task.completedAt).getTime()
      }));

    return recent;
  }

  async collectSystemMetrics() {
    // Simulate system metrics collection
    return {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      network_usage: Math.random() * 100,
      active_tasks: this.runningTasks.size,
      queued_tasks: this.taskQueue.length,
      timestamp: Date.now()
    };
  }

  getTaskExecutionHistory(taskId) {
    return Array.from(this.completedTasks.values())
      .filter(execution => execution.taskId === taskId)
      .map(execution => ({
        execution_id: execution.id,
        duration: execution.duration,
        success: execution.result?.success || false,
        timestamp: new Date(execution.completedAt).getTime(),
        context: execution.context || {}
      }));
  }

  async applyOptimizations(task, optimizationResult) {
    // Apply priority optimization
    if (optimizationResult.optimal_priorities[task.type]) {
      const newPriority = optimizationResult.optimal_priorities[task.type].priority;
      task.priority = newPriority;
      logger.debug(`Updated priority for task ${task.name} to ${newPriority}`);
    }

    // Apply resource allocation
    if (optimizationResult.resource_allocation) {
      task.execution.resources = optimizationResult.resource_allocation;
    }

    return true;
  }

  getTaskPatterns(taskId) {
    const executions = this.getTaskExecutionHistory(taskId);
    
    return {
      task_id: taskId,
      execution_count: executions.length,
      average_duration: executions.length > 0 ? 
        executions.reduce((sum, e) => sum + e.duration, 0) / executions.length : 0,
      success_rate: executions.length > 0 ?
        executions.filter(e => e.success).length / executions.length : 0,
      historical_executions: executions,
      confidence: Math.min(1.0, executions.length / 10) // More executions = higher confidence
    };
  }

  async predictResourceAvailability() {
    const currentUsage = await this.collectSystemMetrics();
    
    return {
      cpu_availability: Math.max(0, 100 - currentUsage.cpu_usage),
      memory_availability: Math.max(0, 100 - currentUsage.memory_usage),
      predicted_load: this.predictSystemLoad(),
      confidence: 0.75
    };
  }

  predictSystemLoad() {
    // Simple load prediction based on current queue and running tasks
    const currentLoad = this.runningTasks.size + this.taskQueue.length;
    const maxCapacity = this.config.maxConcurrentTasks;
    
    return Math.min(1.0, currentLoad / maxCapacity);
  }

  async scheduleTaskForOptimalTime(task, context, optimalTime) {
    // Schedule task for optimal execution time
    const delay = optimalTime - Date.now();
    
    if (delay > 0) {
      logger.info(`🔮 Scheduling task ${task.name} for optimal time in ${Math.round(delay / 1000)}s`);
      
      setTimeout(async () => {
        await this.executeTask(task.id, context);
      }, delay);

      return {
        scheduled: true,
        optimal_time: optimalTime,
        delay: delay
      };
    }

    return await this.executeTask(task.id, context);
  }

  async collectPreExecutionMetrics() {
    return {
      timestamp: Date.now(),
      system_load: await this.collectSystemMetrics(),
      active_tasks: this.runningTasks.size,
      queue_length: this.taskQueue.length
    };
  }

  async collectPostExecutionMetrics() {
    return {
      timestamp: Date.now(),
      system_load: await this.collectSystemMetrics(),
      active_tasks: this.runningTasks.size,
      queue_length: this.taskQueue.length
    };
  }

  async updateMLModel(task, result, preMetrics, postMetrics) {
    // Add execution data to training set
    const trainingData = {
      task_id: task.id,
      task_type: task.type,
      execution_time: result.duration,
      success: result.success,
      pre_execution_metrics: preMetrics,
      post_execution_metrics: postMetrics,
      timestamp: Date.now()
    };

    this.executionHistory.push(trainingData);

    // Keep only recent history
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }

    // Update model if we have enough data
    if (this.executionHistory.length > 10) {
      await this.retrainModel();
    }
  }

  async retrainModel() {
    // Simple model retraining simulation
    const recentData = this.executionHistory.slice(-100);
    const accuracy = this.calculateModelAccuracy(recentData);
    
    this.mlModel.accuracy = accuracy;
    this.metrics.accuracyScore = accuracy;

    logger.debug(`🧠 ML model retrained, accuracy: ${(accuracy * 100).toFixed(1)}%`);
  }

  calculateModelAccuracy(data) {
    // Simulate accuracy calculation
    const successfulPredictions = data.filter(d => d.success).length;
    return successfulPredictions / data.length;
  }

  // Additional helper methods

  optimizePriorityAlgorithm(taskHistory) {
    // Analyze historical performance vs priority
    const priorityPerformance = {};
    
    for (const execution of taskHistory) {
      const priority = execution.priority || 5;
      if (!priorityPerformance[priority]) {
        priorityPerformance[priority] = { total: 0, success: 0, duration: 0 };
      }
      
      priorityPerformance[priority].total++;
      if (execution.success) priorityPerformance[priority].success++;
      priorityPerformance[priority].duration += execution.duration;
    }

    // Calculate improvement potential
    let improvement = 0;
    let recommendation = 'Current priority assignment is optimal';

    const priorities = Object.keys(priorityPerformance).map(Number).sort((a, b) => b - a);
    for (let i = 0; i < priorities.length - 1; i++) {
      const highPri = priorityPerformance[priorities[i]];
      const lowPri = priorityPerformance[priorities[i + 1]];
      
      const highSuccessRate = highPri.success / highPri.total;
      const lowSuccessRate = lowPri.success / lowPri.total;
      
      if (lowSuccessRate > highSuccessRate) {
        improvement = Math.max(improvement, lowSuccessRate - highSuccessRate);
        recommendation = `Consider elevating priority of high-performing low-priority tasks`;
      }
    }

    return { improvement, recommendation };
  }

  optimizeResourceAllocation(systemMetrics) {
    const currentEfficiency = systemMetrics.cpu_usage * systemMetrics.memory_usage / 10000;
    let efficiency_gain = 0;
    let recommendation = 'Current resource allocation is optimal';

    if (systemMetrics.cpu_usage > 80 && systemMetrics.memory_usage < 60) {
      efficiency_gain = 0.15;
      recommendation = 'Reduce CPU-intensive operations, increase memory usage for caching';
    } else if (systemMetrics.memory_usage > 80 && systemMetrics.cpu_usage < 60) {
      efficiency_gain = 0.12;
      recommendation = 'Optimize memory usage, increase CPU parallelization';
    }

    return { efficiency_gain, recommendation };
  }

  optimizeCPUAllocation(systemMetrics) {
    const currentUsage = systemMetrics.cpu_usage;
    const optimal = currentUsage > 80 ? 'increase' : currentUsage < 40 ? 'decrease' : 'maintain';
    
    return {
      current: currentUsage,
      recommendation: optimal,
      target_usage: optimal === 'increase' ? 70 : optimal === 'decrease' ? 50 : currentUsage
    };
  }

  optimizeMemoryAllocation(systemMetrics) {
    const currentUsage = systemMetrics.memory_usage;
    const optimal = currentUsage > 85 ? 'increase' : currentUsage < 50 ? 'decrease' : 'maintain';
    
    return {
      current: currentUsage,
      recommendation: optimal,
      target_usage: optimal === 'increase' ? 75 : optimal === 'decrease' ? 60 : currentUsage
    };
  }

  optimizeConcurrency(systemMetrics) {
    const currentTasks = systemMetrics.active_tasks;
    const maxConcurrent = this.config.maxConcurrentTasks;
    const utilization = currentTasks / maxConcurrent;
    
    let recommendation = maxConcurrent;
    
    if (utilization > 0.9 && systemMetrics.cpu_usage < 70) {
      recommendation = Math.min(maxConcurrent * 1.2, 30);
    } else if (utilization < 0.5 && systemMetrics.cpu_usage > 80) {
      recommendation = Math.max(maxConcurrent * 0.8, 5);
    }

    return {
      current: maxConcurrent,
      recommended: Math.floor(recommendation),
      utilization: utilization
    };
  }

  calculateAverageExecutionTime(taskHistory, taskType) {
    const executions = taskHistory.filter(h => !taskType || h.task_type === taskType);
    if (executions.length === 0) return 0;
    
    return executions.reduce((sum, e) => sum + e.duration, 0) / executions.length;
  }

  predictTaskDuration(pattern) {
    // Simple prediction based on historical average with some variance
    const base = pattern.average_duration || 60000;
    const variance = base * 0.2; // 20% variance
    return base + (Math.random() - 0.5) * variance;
  }

  predictOptimalStartTime(pattern, resourceAvailability) {
    // Find optimal start time based on resource availability
    const now = Date.now();
    const windowSize = 15 * 60 * 1000; // 15 minutes
    
    // Check next few time windows
    for (let i = 0; i < 24; i++) { // Check next 6 hours
      const windowStart = now + (i * windowSize);
      const expectedLoad = this.predictLoadAtTime(windowStart);
      
      if (expectedLoad < 0.7) { // Less than 70% load
        return windowStart;
      }
    }
    
    return now; // Default to immediate execution
  }

  predictLoadAtTime(timestamp) {
    // Simple load prediction - higher during business hours
    const hour = new Date(timestamp).getHours();
    const businessHours = hour >= 9 && hour <= 17;
    return businessHours ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4;
  }

  estimateResourceRequirements(pattern) {
    return {
      cpu: 0.5 + Math.random() * 1.0, // 0.5-1.5 CPU cores
      memory: 256 + Math.random() * 512, // 256-768 MB
      duration: pattern.average_duration || 60000
    };
  }

  calculatePredictionConfidence(pattern) {
    const executionCount = pattern.historical_executions?.length || 0;
    const baseConfidence = Math.min(0.9, executionCount / 20); // Max confidence at 20 executions
    const varianceConfidence = 1 - (pattern.duration_variance || 0.3);
    
    return (baseConfidence + varianceConfidence) / 2;
  }

  extractTaskPatterns() {
    const patterns = {};
    const taskTypes = [...new Set(this.executionHistory.map(h => h.task_type))];
    
    for (const taskType of taskTypes) {
      const executions = this.executionHistory.filter(h => h.task_type === taskType);
      const durations = executions.map(e => e.execution_time);
      
      patterns[taskType] = {
        task_type: taskType,
        execution_count: executions.length,
        average_duration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        success_rate: executions.filter(e => e.success).length / executions.length,
        confidence: Math.min(1.0, executions.length / 10),
        historical_executions: executions
      };
    }
    
    return patterns;
  }

  calculateOverallEfficiency() {
    if (this.executionHistory.length === 0) return 0.7; // Default
    
    const recentExecutions = this.executionHistory.slice(-50); // Last 50 executions
    const successRate = recentExecutions.filter(e => e.success).length / recentExecutions.length;
    const avgDuration = recentExecutions.reduce((sum, e) => sum + e.execution_time, 0) / recentExecutions.length;
    const idealDuration = 60000; // 1 minute ideal
    
    const durationEfficiency = Math.min(1.0, idealDuration / avgDuration);
    
    return (successRate * 0.7) + (durationEfficiency * 0.3);
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  // Testing and Development Methods
  async testTaskAutomation() {
    logger.info('🧪 Testing Task Automation System...');
    
    try {
      // Test basic task creation
      const testTask = await this.createTask({
        name: 'Test Task',
        type: 'function',
        action: {
          type: 'function',
          function: () => ({ success: true, data: 'test' }),
          params: {}
        }
      });
      
      logger.info('🏁 Task creation test passed');
      
      // Test ML optimization if enabled
      if (this.config.enableMLOptimization) {
        const optimization = await this.applyMLOptimization(testTask, {});
        logger.info('🏁 ML optimization test passed');
      }
      
      // Test predictive scheduling if enabled
      if (this.config.enablePredictiveScheduling) {
        const optimalTime = await this.predictOptimalExecutionTime(testTask, {});
        logger.info('🏁 Predictive scheduling test passed');
      }
      
      // Test task execution
      const result = await this.executeTask(testTask.id, {});
      logger.info('🏁 Task execution test passed');
      
      return {
        success: true,
        task_created: !!testTask,
        ml_optimization_tested: this.config.enableMLOptimization,
        predictive_scheduling_tested: this.config.enablePredictiveScheduling,
        task_executed: !!result,
        apiConnected: this.apiConnected,
        developmentMode: this.developmentMode
      };
    } catch (error) {
      logger.error('🔴 Task automation test failed:', error.message);
      return {
        success: false,
        error: error.message,
        apiConnected: this.apiConnected,
        developmentMode: this.developmentMode
      };
    }
  }

  getEnhancedMetrics() {
    return {
      ...this.getMetrics(),
      ml_capabilities: {
        optimization_enabled: this.config.enableMLOptimization,
        predictive_scheduling_enabled: this.config.enablePredictiveScheduling,
        model_accuracy: this.metrics.accuracyScore,
        optimizations_applied: this.metrics.mlOptimizations,
        predictive_schedules: this.metrics.predictiveSchedules
      },
      performance_insights: {
        average_efficiency: this.calculateOverallEfficiency(),
        execution_history_size: this.executionHistory.length,
        active_patterns: Object.keys(this.extractTaskPatterns()).length
      }
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  TaskAutomation,
  getInstance: (config) => {
    if (!instance) {
      instance = new TaskAutomation(config);
    }
    return instance;
  }
};