/**
 * BUMBA Dynamic Agent Lifecycle Orchestrator
 * Main orchestrator that integrates all lifecycle management components
 * Provides unified interface for agent spawning, management, and deprecation
 */

const { EventEmitter } = require('events');
const { logger } = require('./logging/bumba-logger');
const { UnifiedHookSystem } = require('./unified-hook-system');

// Import all components
const { AgentLifecycleStateMachine, AgentLifecycleManager, AgentState, StateEvent } = require('./agents/agent-lifecycle-state-machine');
const { DynamicSpawningController, SpawnPriority } = require('./spawning/dynamic-spawning-controller');
const { AgentDeprecationManager, DeprecationReason, DeprecationStrategy } = require('./deprecation/agent-deprecation-manager');
const { AgentWorkValidationFramework, ValidationStatus, ValidationCriteria } = require('./validation/agent-work-validation-framework');
const { WorkCompletenessChecker, CompletenessStatus, WorkItemType } = require('./validation/work-completeness-checker');
const { KnowledgeTransferProtocol, KnowledgeType, TransferMethod } = require('./knowledge/knowledge-transfer-protocol');
const { APIConnectionManager, APIProvider, RequestPriority } = require('./api/api-connection-manager');
const { ResourceUsageMonitor, ResourceType, AlertLevel } = require('./unified-monitoring-system');
const { AgentPoolOptimizer, OptimizationStrategy, ScalingAction } = require('./optimization/agent-pool-optimizer');
const { TaskDecompositionEngine, TaskType, ComplexityLevel, DecompositionStrategy } = require('./planning/task-decomposition-engine');
const { AdaptiveTeamComposition, TeamStructure, TeamRole, CompositionStrategy } = require('./teams/adaptive-team-composition');

/**
 * Dynamic Agent Lifecycle Orchestrator
 */
class DynamicAgentLifecycleOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize global hook system
    this.hooks = new UnifiedHookSystem();
    
    // Add compatibility layer for different hook APIs
    if (!this.hooks.executeHooks && this.hooks.trigger) {
      this.hooks.executeHooks = this.hooks.trigger.bind(this.hooks);
    }
    if (!this.hooks.getRegisteredHooks && this.hooks.hookRegistry) {
      this.hooks.getRegisteredHooks = () => {
        const hooks = {};
        this.hooks.hookRegistry.forEach((config, name) => {
          hooks[name] = config;
        });
        return hooks;
      };
    }
    
    this.config = {
      maxAgents: config.maxAgents || 50,
      maxTeams: config.maxTeams || 10,
      autoScaling: config.autoScaling !== false,
      autoOptimization: config.autoOptimization !== false,
      knowledgeTransfer: config.knowledgeTransfer !== false,
      costBudget: config.costBudget || 100, // $100 daily budget
      performanceTargets: config.performanceTargets || {
        responseTime: 2000,
        successRate: 0.95,
        utilizationTarget: 0.7
      },
      ...config
    };
    
    // Initialize all components
    this.initializeComponents();
    
    // Orchestration state
    this.orchestrationState = {
      running: false,
      activeAgents: new Map(),
      activeTeams: new Map(),
      activeTasks: new Map(),
      pendingTasks: [],
      completedTasks: []
    };
    
    // Statistics
    this.stats = {
      tasksProcessed: 0,
      tasksSucceeded: 0,
      tasksFailed: 0,
      totalCost: 0,
      totalSavings: 0,
      averageResponseTime: 0,
      systemUptime: 0,
      startTime: Date.now()
    };
    
    // Start orchestration
    this.start();
  }
  
  /**
   * Initialize all components
   */
  initializeComponents() {
    logger.info('🟢 Initializing Dynamic Agent Lifecycle Orchestrator');
    
    // Core lifecycle management
    this.lifecycleManager = new AgentLifecycleManager({
      maxAgents: this.config.maxAgents
    });
    
    // Spawning controller
    this.spawningController = new DynamicSpawningController({
      maxTotalAgents: this.config.maxAgents,
      preSpawnEnabled: true,
      adaptiveSpawning: true
    });
    
    // Deprecation manager
    this.deprecationManager = new AgentDeprecationManager({
      knowledgeTransfer: this.config.knowledgeTransfer,
      batchDeprecation: true
    });
    
    // Validation framework
    this.validationFramework = new AgentWorkValidationFramework({
      autoValidation: true,
      managerValidation: true
    });
    
    // Completeness checker
    this.completenessChecker = new WorkCompletenessChecker({
      strictMode: false,
      allowPartialCompletion: true
    });
    
    // Knowledge transfer protocol
    this.knowledgeProtocol = new KnowledgeTransferProtocol({
      persistenceEnabled: true,
      compressionEnabled: true
    });
    
    // API connection manager
    this.apiManager = new APIConnectionManager({
      batchingEnabled: true,
      cachingEnabled: true,
      rateLimitingEnabled: true
    });
    
    // Resource monitor
    this.resourceMonitor = new ResourceUsageMonitor({
      alertingEnabled: true,
      budgets: {
        daily: this.config.costBudget,
        hourly: this.config.costBudget / 24
      }
    });
    
    // Pool optimizer
    this.poolOptimizer = new AgentPoolOptimizer({
      strategy: OptimizationStrategy.BALANCED,
      autoScaling: this.config.autoScaling,
      predictiveScaling: true
    });
    
    // Task decomposition engine
    this.taskDecomposer = new TaskDecompositionEngine({
      strategy: DecompositionStrategy.HYBRID,
      autoDecompose: true
    });
    
    // Team composition
    this.teamComposer = new AdaptiveTeamComposition({
      strategy: CompositionStrategy.BALANCED,
      maxTeamSize: 10,
      adaptiveRecomposition: true
    });
    
    // Wire up event handlers
    this.setupEventHandlers();
    
    // Register orchestrator hooks
    this.registerOrchestratorHooks();
    
    // Connect component hooks to orchestrator
    this.connectComponentHooks();
    
    logger.info('🏁 All components initialized successfully');
  }
  
  /**
   * Register orchestrator-level hooks
   */
  registerOrchestratorHooks() {
    // Register task processing hooks
    this.hooks.register('orchestrator:beforeTaskProcessing', async (ctx) => ({ success: true }), {
      category: 'command',
      priority: 50,
      description: 'Execute before task processing',
      schema: {
        task: 'object',
        orchestratorState: 'object'
      }
    });
    
    this.hooks.register('orchestrator:afterTaskProcessing', async (ctx) => ({ success: true }), {
      category: 'command',
      priority: 50,
      description: 'Execute after task processing',
      schema: {
        task: 'object',
        result: 'object',
        success: 'boolean'
      }
    });
    
    // Register cost control hooks
    this.hooks.register('orchestrator:budgetCheck', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 100,
      description: 'Check budget before operations',
      schema: {
        operation: 'string',
        estimatedCost: 'number',
        remainingBudget: 'number'
      }
    });
    
    // Register system health hooks
    this.hooks.register('orchestrator:healthCheck', async (ctx) => ({ success: true }), {
      category: 'performance',
      priority: 75,
      description: 'Check system health',
      schema: {
        health: 'object',
        alerts: 'array'
      }
    });
    
    logger.info('🏁 Orchestrator hooks registered');
  }
  
  /**
   * Connect component hooks to orchestrator
   */
  connectComponentHooks() {
    // Share hook system with all components
    this.lifecycleManager.hooks = this.hooks;
    this.spawningController.hooks = this.hooks;
    this.deprecationManager.hooks = this.hooks;
    this.validationFramework.hooks = this.hooks;
    this.knowledgeProtocol.hooks = this.hooks;
    this.apiManager.hooks = this.hooks;
    this.teamComposer.hooks = this.hooks;
    
    // Register global hook handlers for cross-component coordination
    this.registerGlobalHookHandlers();
    
    logger.info('🏁 Component hooks connected to orchestrator');
  }
  
  /**
   * Register global hook handlers
   */
  registerGlobalHookHandlers() {
    // Example: Cost optimization hook handler
    this.hooks.registerHandler('model:evaluateCost', async (context) => {
      const budget = this.resourceMonitor.getResourceSummary().budget;
      if (context.cost > budget.remaining.hourly * 0.1) {
        context.suggestAlternative = true;
        context.reason = 'Cost exceeds 10% of hourly budget';
      }
      return context;
    });
    
    // Example: Team validation hook handler
    this.hooks.registerHandler('team:validateComposition', async (context) => {
      if (context.composition.members.length < 2) {
        context.errors.push('Team must have at least 2 members');
      }
      return context;
    });
    
    // Example: Deprecation prevention hook handler
    this.hooks.registerHandler('deprecation:prevent', async (context) => {
      const agent = this.orchestrationState.activeAgents.get(context.agentId);
      if (agent && agent.hasActiveWork) {
        context.prevent = true;
        context.reason = 'Agent has active work';
      }
      return context;
    });
    
    logger.info('🏁 Global hook handlers registered');
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Lifecycle events
    this.lifecycleManager.on('agent:stateChange', (data) => {
      this.handleAgentStateChange(data);
    });
    
    this.lifecycleManager.on('agent:deprecated', (data) => {
      this.handleAgentDeprecated(data);
    });
    
    // Spawning events
    this.spawningController.on('agent:spawned', (data) => {
      this.handleAgentSpawned(data);
    });
    
    // Validation events
    this.validationFramework.on('validation:complete', (data) => {
      this.handleValidationComplete(data);
    });
    
    // Resource alerts
    this.resourceMonitor.on('alert:created', (alert) => {
      this.handleResourceAlert(alert);
    });
    
    this.resourceMonitor.on('budget:exceeded', (data) => {
      this.handleBudgetExceeded(data);
    });
    
    // Optimization events
    this.poolOptimizer.on('optimization:complete', (data) => {
      this.handleOptimizationComplete(data);
    });
    
    // Team events
    this.teamComposer.on('team:composed', (data) => {
      this.handleTeamComposed(data);
    });
  }
  
  /**
   * Start orchestration
   */
  start() {
    if (this.orchestrationState.running) {
      logger.warn('🟡 Orchestrator already running');
      return;
    }
    
    logger.info('🟢 Starting Dynamic Agent Lifecycle Orchestrator');
    
    this.orchestrationState.running = true;
    this.stats.startTime = Date.now();
    
    // Start monitoring loops
    this.startMonitoringLoop();
    this.startOptimizationLoop();
    this.startTaskProcessingLoop();
    
    // Emit start event
    this.emit('orchestrator:started', {
      timestamp: Date.now(),
      config: this.config
    });
  }
  
  /**
   * Process task request
   */
  async processTask(task) {
    const taskId = this.generateTaskId();
    
    logger.info(`🟢 Processing task ${taskId}: ${task.name || task.description}`);
    
    const taskRecord = {
      id: taskId,
      task,
      status: 'pending',
      startTime: Date.now(),
      attempts: 0
    };
    
    this.orchestrationState.activeTasks.set(taskId, taskRecord);
    
    try {
      // Step 1: Decompose task if complex
      const decomposition = await this.decomposeTask(task);
      taskRecord.decomposition = decomposition;
      
      // Step 2: Compose team for task
      const team = await this.composeTeam(task, decomposition);
      taskRecord.team = team;
      
      // Step 3: Spawn required agents
      const agents = await this.spawnAgents(team, decomposition);
      taskRecord.agents = agents;
      
      // Step 4: Register work for completeness tracking
      const workId = await this.registerWork(taskId, decomposition);
      taskRecord.workId = workId;
      
      // Step 5: Execute task
      const result = await this.executeTask(taskRecord);
      taskRecord.result = result;
      
      // Step 6: Validate work
      const validation = await this.validateWork(taskRecord);
      taskRecord.validation = validation;
      
      // Step 7: Transfer knowledge
      if (this.config.knowledgeTransfer) {
        await this.transferKnowledge(taskRecord);
      }
      
      // Step 8: Deprecate agents
      await this.deprecateAgents(taskRecord);
      
      // Mark as complete
      taskRecord.status = 'completed';
      taskRecord.endTime = Date.now();
      taskRecord.duration = taskRecord.endTime - taskRecord.startTime;
      
      // Update statistics
      this.updateStatistics(taskRecord, true);
      
      // Move to completed
      this.orchestrationState.completedTasks.push(taskRecord);
      this.orchestrationState.activeTasks.delete(taskId);
      
      logger.info(`🏁 Task ${taskId} completed successfully in ${taskRecord.duration}ms`);
      
      // Emit completion event
      this.emit('task:completed', taskRecord);
      
      return {
        success: true,
        taskId,
        result: result,
        duration: taskRecord.duration
      };
      
    } catch (error) {
      logger.error(`🔴 Task ${taskId} failed: ${error.message}`);
      
      taskRecord.status = 'failed';
      taskRecord.error = error.message;
      
      // Update statistics
      this.updateStatistics(taskRecord, false);
      
      // Cleanup agents if spawned
      if (taskRecord.agents) {
        await this.cleanupFailedTask(taskRecord);
      }
      
      // Emit failure event
      this.emit('task:failed', taskRecord);
      
      throw error;
    }
  }
  
  /**
   * Decompose task
   */
  async decomposeTask(task) {
    if (task.complexity <= ComplexityLevel.SIMPLE) {
      return { subtasks: [task] };
    }
    
    return await this.taskDecomposer.decomposeTask(task);
  }
  
  /**
   * Compose team
   */
  async composeTeam(task, decomposition) {
    const availableAgents = Array.from(this.orchestrationState.activeAgents.values());
    
    return await this.teamComposer.composeTeam(task, availableAgents);
  }
  
  /**
   * Spawn agents
   */
  async spawnAgents(team, decomposition) {
    const agents = [];
    
    for (const member of team.members) {
      // Check if agent already exists
      let agent = this.orchestrationState.activeAgents.get(member.agentId);
      
      if (!agent) {
        // Spawn new agent
        const spawnResult = await this.spawningController.requestSpawn({
          type: member.role,
          skills: member.skills,
          department: team.structure
        }, {
          priority: SpawnPriority.HIGH
        });
        
        agent = spawnResult.agent;
        this.orchestrationState.activeAgents.set(spawnResult.id, agent);
      }
      
      agents.push(agent);
    }
    
    return agents;
  }
  
  /**
   * Register work
   */
  async registerWork(taskId, decomposition) {
    return this.completenessChecker.registerWork(`agent-${taskId}`, {
      tasks: decomposition.subtasks.map(t => ({
        name: t.name || t.description,
        required: true
      })),
      deliverables: [],
      dependencies: decomposition.dependencies || []
    });
  }
  
  /**
   * Execute task
   */
  async executeTask(taskRecord) {
    const { task, decomposition, agents } = taskRecord;
    
    logger.info(`🟢 Executing task ${taskRecord.id}`);
    
    // Track resource usage
    this.resourceMonitor.trackUsage(ResourceType.API_CALLS, agents.length, {
      taskId: taskRecord.id
    });
    
    // Simulate task execution (would call actual agent APIs)
    const results = await Promise.all(decomposition.subtasks.map(async (subtask, index) => {
        const agent = agents[index % agents.length];
        
        // Make API call through connection manager
        const response = await this.apiManager.request(
          agent.config?.model || APIProvider.GEMINI,
          {
            task: subtask,
            context: task.context
          },
          {
            priority: RequestPriority.NORMAL,
            batchable: true
          }
        );
        
        // Update work item
        this.completenessChecker.updateWorkItem(
          taskRecord.workId,
          `item-${index}`,
          {
            status: CompletenessStatus.COMPLETE,
            progress: 1.0
          }
        );
        
        return response;
      })
    );
    
    // Track cost
    const estimatedCost = agents.length * 0.01; // $0.01 per agent call
    this.resourceMonitor.trackCost(estimatedCost, {
      taskId: taskRecord.id
    });
    
    return {
      subtaskResults: results,
      summary: 'Task executed successfully',
      cost: estimatedCost
    };
  }
  
  /**
   * Validate work
   */
  async validateWork(taskRecord) {
    const { workId, result } = taskRecord;
    
    // Check completeness
    const completeness = await this.completenessChecker.checkCompleteness(workId);
    
    if (!completeness.overall.canDeprecate) {
      throw new Error('Work not complete enough for deprecation');
    }
    
    // Validate quality
    const validation = await this.validationFramework.validateWork(
      `agent-${taskRecord.id}`,
      {
        tasksCompleted: completeness.overall.progress === 1 ? 
          taskRecord.decomposition.subtasks.length : 0,
        totalTasks: taskRecord.decomposition.subtasks.length,
        outputs: result.subtaskResults,
        errors: []
      }
    );
    
    if (validation.status === ValidationStatus.FAILED) {
      throw new Error('Work validation failed');
    }
    
    return validation;
  }
  
  /**
   * Transfer knowledge
   */
  async transferKnowledge(taskRecord) {
    const { agents, result } = taskRecord;
    
    // Store task knowledge
    await this.knowledgeProtocol.storeKnowledge(`task-${taskRecord.id}`, {
      type: KnowledgeType.SOLUTION,
      content: {
        task: taskRecord.task,
        decomposition: taskRecord.decomposition,
        result: result,
        validation: taskRecord.validation
      },
      confidence: taskRecord.validation?.score || 0.8
    });
    
    // Transfer between agents if multiple
    if (agents.length > 1) {
      for (let i = 0; i < agents.length - 1; i++) {
        await this.knowledgeProtocol.transferKnowledge(
          agents[i].id,
          agents[i + 1].id,
          {
            method: TransferMethod.DIRECT
          }
        );
      }
    }
  }
  
  /**
   * Deprecate agents
   */
  async deprecateAgents(taskRecord) {
    const { agents, validation } = taskRecord;
    
    for (const agent of agents) {
      const lifecycle = this.lifecycleManager.getAgent(agent.id);
      
      if (lifecycle) {
        await this.deprecationManager.scheduleDeprecation(
          agent.id,
          lifecycle,
          {
            reason: DeprecationReason.WORK_COMPLETE,
            strategy: validation.status === ValidationStatus.PASSED ?
              DeprecationStrategy.AFTER_VALIDATION :
              DeprecationStrategy.GRACEFUL
          }
        );
      }
    }
  }
  
  /**
   * Cleanup failed task
   */
  async cleanupFailedTask(taskRecord) {
    const { agents } = taskRecord;
    
    for (const agent of agents) {
      const lifecycle = this.lifecycleManager.getAgent(agent.id);
      
      if (lifecycle) {
        await lifecycle.forceDeprecate('task_failed');
      }
    }
  }
  
  /**
   * Handle events
   */
  handleAgentStateChange(data) {
    logger.info(`Agent ${data.agentId} state: ${data.from} → ${data.to}`);
  }
  
  handleAgentDeprecated(data) {
    this.orchestrationState.activeAgents.delete(data.agentId);
    logger.info(`Agent ${data.agentId} deprecated`);
  }
  
  handleAgentSpawned(data) {
    logger.info(`Agent ${data.agentId} spawned`);
  }
  
  handleValidationComplete(data) {
    logger.info(`Validation complete: ${data.result.status}`);
  }
  
  handleResourceAlert(alert) {
    logger.warn(`Resource alert: ${alert.message}`);
    
    if (alert.level === AlertLevel.CRITICAL) {
      this.handleCriticalAlert(alert);
    }
  }
  
  handleBudgetExceeded(data) {
    logger.error('🟢 Budget exceeded! Initiating cost controls');
    
    // Stop spawning new agents
    this.spawningController.config.maxTotalAgents = 
      this.orchestrationState.activeAgents.size;
    
    // Trigger optimization
    this.triggerEmergencyOptimization();
  }
  
  handleOptimizationComplete(data) {
    logger.info(`Optimization complete: ${data.actions.length} actions taken`);
  }
  
  handleTeamComposed(data) {
    this.orchestrationState.activeTeams.set(data.id, data);
    logger.info(`Team ${data.id} composed with ${data.members.length} members`);
  }
  
  handleCriticalAlert(alert) {
    // Take emergency measures
    this.triggerEmergencyOptimization();
  }
  
  /**
   * Trigger emergency optimization
   */
  async triggerEmergencyOptimization() {
    logger.warn('🔴 Triggering emergency optimization');
    
    const agents = Array.from(this.orchestrationState.activeAgents.values());
    const tasks = Array.from(this.orchestrationState.activeTasks.values());
    
    await this.poolOptimizer.optimizePool(agents, tasks, {
      maxBudget: this.config.costBudget,
      strategy: OptimizationStrategy.COST_MINIMIZATION
    });
  }
  
  /**
   * Monitoring loop
   */
  startMonitoringLoop() {
    setInterval(() => {
      // Update system uptime
      this.stats.systemUptime = Date.now() - this.stats.startTime;
      
      // Check system health
      const health = this.getSystemHealth();
      
      if (health.score < 0.5) {
        logger.warn(`🟡 System health low: ${(health.score * 100).toFixed(1)}%`);
      }
      
      // Emit monitoring update
      this.emit('monitoring:update', {
        health,
        stats: this.stats,
        resources: this.resourceMonitor.getResourceSummary()
      });
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Optimization loop
   */
  startOptimizationLoop() {
    if (!this.config.autoOptimization) {return;}
    
    setInterval(async () => {
      const agents = Array.from(this.orchestrationState.activeAgents.values());
      const tasks = Array.from(this.orchestrationState.activeTasks.values());
      
      if (agents.length > 0) {
        await this.poolOptimizer.optimizePool(agents, tasks);
      }
    }, 60000); // Every minute
  }
  
  /**
   * Task processing loop
   */
  startTaskProcessingLoop() {
    setInterval(() => {
      // Process pending tasks
      while (this.orchestrationState.pendingTasks.length > 0 && 
             this.canProcessMoreTasks()) {
        const task = this.orchestrationState.pendingTasks.shift();
        this.processTask(task).catch(error => {
          logger.error(`Failed to process task: ${error.message}`);
        });
      }
    }, 1000); // Every second
  }
  
  /**
   * Check if can process more tasks
   */
  canProcessMoreTasks() {
    // Check resource limits
    const resourceSummary = this.resourceMonitor.getResourceSummary();
    
    if (resourceSummary.budget.remaining.hourly < 1) {
      return false; // Budget exhausted
    }
    
    if (this.orchestrationState.activeAgents.size >= this.config.maxAgents) {
      return false; // Agent limit reached
    }
    
    if (this.orchestrationState.activeTeams.size >= this.config.maxTeams) {
      return false; // Team limit reached
    }
    
    return true;
  }
  
  /**
   * Get system health
   */
  getSystemHealth() {
    const health = {
      score: 1.0,
      components: {}
    };
    
    // Check agent utilization
    const agentCount = this.orchestrationState.activeAgents.size;
    const agentUtilization = agentCount / this.config.maxAgents;
    health.components.agents = agentUtilization < 0.9 ? 1.0 : 0.5;
    
    // Check budget
    const resourceSummary = this.resourceMonitor.getResourceSummary();
    const budgetRemaining = resourceSummary.budget.remaining.daily / this.config.costBudget;
    health.components.budget = budgetRemaining;
    
    // Check success rate
    const successRate = this.stats.tasksProcessed > 0 ?
      this.stats.tasksSucceeded / this.stats.tasksProcessed : 1.0;
    health.components.successRate = successRate;
    
    // Check response time
    const responseTimeHealth = this.stats.averageResponseTime > 0 ?
      Math.min(1.0, this.config.performanceTargets.responseTime / this.stats.averageResponseTime) :
      1.0;
    health.components.responseTime = responseTimeHealth;
    
    // Calculate overall score
    const scores = Object.values(health.components);
    health.score = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    return health;
  }
  
  /**
   * Update statistics
   */
  updateStatistics(taskRecord, success) {
    this.stats.tasksProcessed++;
    
    if (success) {
      this.stats.tasksSucceeded++;
    } else {
      this.stats.tasksFailed++;
    }
    
    // Update cost
    if (taskRecord.result?.cost) {
      this.stats.totalCost += taskRecord.result.cost;
    }
    
    // Update response time
    if (taskRecord.duration) {
      const totalTime = this.stats.averageResponseTime * (this.stats.tasksProcessed - 1);
      this.stats.averageResponseTime = (totalTime + taskRecord.duration) / this.stats.tasksProcessed;
    }
  }
  
  /**
   * Queue task for processing
   */
  queueTask(task) {
    this.orchestrationState.pendingTasks.push(task);
    logger.info(`🟢 Task queued (${this.orchestrationState.pendingTasks.length} pending)`);
  }
  
  /**
   * Generate task ID
   */
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      running: this.orchestrationState.running,
      health: this.getSystemHealth(),
      agents: {
        active: this.orchestrationState.activeAgents.size,
        max: this.config.maxAgents,
        utilization: this.orchestrationState.activeAgents.size / this.config.maxAgents
      },
      teams: {
        active: this.orchestrationState.activeTeams.size,
        max: this.config.maxTeams
      },
      tasks: {
        active: this.orchestrationState.activeTasks.size,
        pending: this.orchestrationState.pendingTasks.length,
        completed: this.orchestrationState.completedTasks.length
      },
      resources: this.resourceMonitor.getResourceSummary(),
      statistics: this.stats
    };
  }
  
  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    logger.info('🔴 Shutting down Dynamic Agent Lifecycle Orchestrator');
    
    this.orchestrationState.running = false;
    
    // Deprecate all active agents
    await this.deprecationManager.deprecateAll('shutdown');
    
    // Dissolve all teams
    for (const [teamId] of this.orchestrationState.activeTeams) {
      this.teamComposer.dissolveTeam(teamId);
    }
    
    // Shutdown all components
    await this.apiManager.shutdown();
    this.resourceMonitor.shutdown();
    
    logger.info('🏁 Orchestrator shutdown complete');
    
    // Emit shutdown event
    this.emit('orchestrator:shutdown', {
      timestamp: Date.now(),
      stats: this.stats
    });
  }
}

// Export
module.exports = {
  DynamicAgentLifecycleOrchestrator
};