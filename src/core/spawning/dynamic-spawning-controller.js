/**
 * BUMBA Dynamic Spawning Controller
 * Intelligently spawns agents on-demand based on task requirements
 * Manages agent lifecycle from creation to deprecation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');
const { 
  AgentLifecycleStateMachine, 
  AgentLifecycleManager,
  AgentState,
  StateEvent 
} = require('../agents/agent-lifecycle-state-machine');
const { SpecialistSpawner } = require('./specialist-spawner');
const { ClaudeMaxAccountManager } = require('../agents/claude-max-account-manager');
const { DomainModelRouter } = require('../agents/domain-model-router');

/**
 * Spawn Request Priority
 */
const SpawnPriority = {
  CRITICAL: 1, // Immediate spawn required
  HIGH: 2, // Spawn ASAP
  NORMAL: 3, // Standard priority
  LOW: 4, // Can wait
  BACKGROUND: 5 // Spawn when resources available
};

/**
 * Dynamic Spawning Controller
 */
class DynamicSpawningController extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize hook system
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
      maxConcurrentSpawns: config.maxConcurrentSpawns || 5,
      maxTotalAgents: config.maxTotalAgents || 50,
      spawnTimeout: config.spawnTimeout || 30000, // 30 seconds
      reuseThreshold: config.reuseThreshold || 0.8, // 80% task similarity
      preSpawnEnabled: config.preSpawnEnabled !== false,
      adaptiveSpawning: config.adaptiveSpawning !== false,
      ...config
    };
    
    // Core components
    this.lifecycleManager = new AgentLifecycleManager({
      maxAgents: this.config.maxTotalAgents
    });
    
    this.specialistSpawner = new SpecialistSpawner();
    const { getInstance } = require('../agents/claude-max-account-manager');
    this.claudeMaxManager = getInstance();
    this.domainRouter = new DomainModelRouter();
    
    // Spawn management
    this.spawnQueue = [];
    this.activeSpawns = new Map();
    this.agentPool = new Map();
    this.agentMetadata = new Map();
    
    // Performance optimization framework
    this.concurrentOperations = new Map();
    this.resourcePool = new Map();
    this.operationMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      peakConcurrency: 0,
      currentConcurrency: 0
    };
    
    // Connection and resource pooling
    this.poolConfig = {
      maxConnections: config.maxConnections || 50,
      maxResourcesPerType: config.maxResourcesPerType || 20,
      poolTimeout: config.poolTimeout || 30000,
      cleanupInterval: config.cleanupInterval || 60000
    };

    // Auto-scaling and demand prediction system
    this.demandPredictor = new DemandPredictor();
    this.elasticScaler = new ElasticResourceScaler();
    this.scalingConfig = {
      enablePredictiveScaling: true,
      scaleUpThreshold: 0.8, // 80% utilization
      scaleDownThreshold: 0.3, // 30% utilization
      minInstances: 2,
      maxInstances: config.maxInstances || 100,
      predictionWindowMinutes: 30,
      scalingCooldownMs: 120000, // 2 minutes
      demandSamplingInterval: 10000 // 10 seconds
    };
    
    // Initialize resource pools
    this.initializeResourcePools();
    
    // Statistics
    this.stats = {
      totalSpawned: 0,
      totalReused: 0,
      totalDeprecated: 0,
      spawnFailures: 0,
      averageSpawnTime: 0,
      queueLength: 0,
      poolUtilization: 0
    };
    
    // Patterns for pre-spawning
    this.taskPatterns = new Map();
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize resource pools for optimized performance
   */
  initializeResourcePools() {
    // Connection pool for external services
    this.connectionPool = new Map();
    
    // Resource allocation tracking
    this.allocatedResources = new Map();
    
    // Agent template cache for faster spawning
    this.templateCache = new Map();
    
    // Performance metrics aggregator
    this.metricsAggregator = {
      latencyWindow: [],
      throughputCounter: 0,
      errorRate: 0,
      lastReset: Date.now()
    };
    
    // Cleanup timer for expired resources
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredResources();
    }, this.poolConfig.cleanupInterval);
    
    logger.info('🟢 Resource pools initialized', {
      maxConnections: this.poolConfig.maxConnections,
      maxResourcesPerType: this.poolConfig.maxResourcesPerType,
      cleanupInterval: this.poolConfig.cleanupInterval
    });
  }

  /**
   * Initialize the controller
   */
  initialize() {
    // Subscribe to lifecycle events
    this.lifecycleManager.on('agent:stateChange', (data) => {
      this.handleAgentStateChange(data);
    });
    
    this.lifecycleManager.on('agent:deprecated', (data) => {
      this.handleAgentDeprecated(data);
    });
    
    // Start spawn processor
    this.startSpawnProcessor();
    
    // Register model selection hooks
    this.registerModelHooks();
    
    logger.info('🏁 Dynamic Spawning Controller initialized');
  }
  
  /**
   * Register model selection hooks
   */
  registerModelHooks() {
    // Register beforeModelSelection hook
    this.hooks.register('model:beforeSelection', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute before model selection',
      schema: {
        requirements: 'object',
        taskType: 'string',
        context: 'object'
      }
    });
    
    // Register evaluateModelCost hook
    this.hooks.register('model:evaluateCost', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 75,
      description: 'Evaluate model cost before selection',
      schema: {
        model: 'string',
        requirements: 'object',
        cost: 'number',
        budget: 'object'
      }
    });
    
    // Register suggestAlternativeModel hook
    this.hooks.register('model:suggestAlternative', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 75,
      description: 'Suggest alternative model if needed',
      schema: {
        originalModel: 'string',
        reason: 'string',
        alternatives: 'array'
      }
    });
    
    // Register afterModelSelection hook
    this.hooks.register('model:afterSelection', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute after model selection',
      schema: {
        selectedModel: 'string',
        requirements: 'object',
        config: 'object'
      }
    });
    
    // Register spawn hooks
    this.hooks.register('spawn:beforeAgent', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute before agent spawn',
      schema: {
        request: 'object',
        config: 'object'
      }
    });
    
    this.hooks.register('spawn:afterAgent', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute after agent spawn',
      schema: {
        agent: 'object',
        success: 'boolean'
      }
    });
    
    logger.info('🏁 Model selection hooks registered');
  }
  
  /**
   * Request agent spawn
   */
  async requestSpawn(taskRequirements, options = {}) {
    const spawnRequest = {
      id: this.generateRequestId(),
      requirements: taskRequirements,
      priority: options.priority || SpawnPriority.NORMAL,
      timestamp: Date.now(),
      options
    };
    
    logger.info(`🟢 Spawn request ${spawnRequest.id}: ${taskRequirements.type || 'general'}`);
    
    // Check if we can reuse an existing agent
    const existingAgent = this.findReusableAgent(taskRequirements);
    if (existingAgent) {
      logger.info(`🟢️ Reusing existing agent ${existingAgent.id} for task`);
      this.stats.totalReused++;
      return existingAgent;
    }
    
    // Check spawn capacity
    if (!this.canSpawn()) {
      logger.warn('🟡 Spawn capacity reached, queueing request');
      return this.queueSpawnRequest(spawnRequest);
    }
    
    // Spawn immediately if high priority
    if (spawnRequest.priority <= SpawnPriority.HIGH) {
      return this.spawnAgent(spawnRequest);
    }
    
    // Otherwise queue for processing
    return this.queueSpawnRequest(spawnRequest);
  }
  
  /**
   * Spawn an agent
   */
  async spawnAgent(request) {
    const agentId = `agent-${request.id}`;
    const startTime = Date.now();
    
    try {
      // Create lifecycle state machine
      const lifecycle = this.lifecycleManager.createAgent(agentId, {
        maxActiveTime: request.options.maxActiveTime || 1800000,
        autoDeprecate: request.options.autoDeprecate !== false
      });
      
      // Transition to spawning state
      await lifecycle.transition(StateEvent.SPAWN, {
        request,
        resourceCheck: true
      });
      
      // Mark as active spawn
      this.activeSpawns.set(agentId, {
        request,
        startTime,
        lifecycle
      });
      
      // Determine agent configuration
      const agentConfig = await this.determineAgentConfiguration(request.requirements);
      
      // Create the actual agent
      const agent = await this.createAgent(agentId, agentConfig);
      
      // Store in pool
      this.agentPool.set(agentId, agent);
      
      // Store metadata
      this.agentMetadata.set(agentId, {
        config: agentConfig,
        requirements: request.requirements,
        spawnTime: Date.now() - startTime,
        taskCount: 0,
        lastUsed: Date.now()
      });
      
      // Transition to active state
      await lifecycle.transition(StateEvent.ACTIVATE, {
        agent,
        config: agentConfig
      });
      
      // Remove from active spawns
      this.activeSpawns.delete(agentId);
      
      // Update statistics
      this.stats.totalSpawned++;
      this.updateAverageSpawnTime(Date.now() - startTime);
      
      // Learn from this spawn
      if (this.config.adaptiveSpawning) {
        this.learnSpawnPattern(request.requirements, agentConfig);
      }
      
      logger.info(`🏁 Agent ${agentId} spawned in ${Date.now() - startTime}ms`);
      
      // Emit spawn event
      this.emit('agent:spawned', {
        agentId,
        agent,
        config: agentConfig,
        spawnTime: Date.now() - startTime
      });
      
      return {
        id: agentId,
        agent,
        lifecycle,
        config: agentConfig
      };
      
    } catch (error) {
      logger.error(`🔴 Failed to spawn agent ${agentId}: ${error.message}`);
      
      // Clean up
      this.activeSpawns.delete(agentId);
      this.stats.spawnFailures++;
      
      // Transition to idle/deprecated
      const lifecycle = this.lifecycleManager.getAgent(agentId);
      if (lifecycle) {
        await lifecycle.transition(StateEvent.ERROR, { error: error.message });
      }
      
      throw error;
    }
  }
  
  /**
   * Determine agent configuration based on requirements
   */
  async determineAgentConfiguration(requirements) {
    const config = {
      type: requirements.type || 'generalist',
      role: requirements.role || 'specialist',
      department: requirements.department || 'technical',
      capabilities: [],
      model: null,
      resources: {}
    };
    
    // Determine if this needs Claude Max
    const needsClaudeMax = 
      config.role === 'manager' || 
      config.role === 'executive' ||
      requirements.needsClaudeMax === true;
    
    if (needsClaudeMax) {
      // Request Claude Max access
      const hasLock = await this.claudeMaxManager.acquireLock(
        `${config.type}-${Date.now()}`,
        config.role,
        requirements.priority || 10
      );
      
      if (hasLock) {
        config.model = 'claude-max';
        config.modelConfig = this.claudeMaxManager.getClaudeMaxConfig();
      } else {
        // Fall back to free tier if Claude Max unavailable
        config.model = await this.assignFreeTierModel(requirements);
      }
    } else {
      // Assign appropriate free tier model
      config.model = await this.assignFreeTierModel(requirements);
    }
    
    // Determine capabilities based on type
    config.capabilities = this.determineCapabilities(requirements);
    
    // Allocate resources
    config.resources = this.allocateResources(requirements);
    
    return config;
  }
  
  /**
   * Assign free tier model based on task type
   */
  async assignFreeTierModel(requirements) {
    const taskType = this.determineTaskType(requirements);
    
    // Execute beforeModelSelection hook
    const beforeHookContext = await this.hooks.execute('model:beforeSelection', {
      requirements,
      taskType,
      context: { freeTier: true }
    });
    
    // Allow hook to modify requirements or taskType
    if (beforeHookContext.taskType) {
      taskType = beforeHookContext.taskType;
    }
    
    const modelConfig = await this.domainRouter.assignModelToWorker({ taskType });
    
    // Execute evaluateCost hook
    const costContext = await this.hooks.execute('model:evaluateCost', {
      model: modelConfig.model,
      requirements,
      cost: modelConfig.cost || 0.001,
      budget: { remaining: 100 }
    });
    
    // Check if alternative model suggested
    if (costContext.suggestAlternative) {
      const alternativeContext = await this.hooks.execute('model:suggestAlternative', {
        originalModel: modelConfig.model,
        reason: costContext.reason || 'Cost optimization',
        alternatives: ['qwen', 'deepseek', 'gemini']
      });
      
      if (alternativeContext.selectedAlternative) {
        modelConfig.model = alternativeContext.selectedAlternative;
      }
    }
    
    // Execute afterModelSelection hook
    await this.hooks.execute('model:afterSelection', {
      selectedModel: modelConfig.model,
      requirements,
      config: modelConfig
    });
    
    return modelConfig.model;
  }
  
  /**
   * Determine task type from requirements
   */
  determineTaskType(requirements) {
    if (requirements.taskType) {return requirements.taskType;}
    
    const type = requirements.type?.toLowerCase() || '';
    
    if (type.includes('reason') || type.includes('analyze') || type.includes('research')) {
      return 'reasoning';
    }
    if (type.includes('code') || type.includes('implement') || type.includes('develop')) {
      return 'coding';
    }
    
    return 'general';
  }
  
  /**
   * Determine agent capabilities
   */
  determineCapabilities(requirements) {
    const capabilities = [];
    
    // Map requirement types to capabilities
    const capabilityMap = {
      'security-specialist': ['security-audit', 'vulnerability-scan', 'auth-implementation'],
      'database-specialist': ['schema-design', 'query-optimization', 'migration'],
      'frontend-specialist': ['ui-development', 'component-creation', 'styling'],
      'backend-engineer': ['api-development', 'service-creation', 'integration'],
      'devops-engineer': ['deployment', 'ci-cd', 'infrastructure'],
      'ux-designer': ['wireframing', 'prototyping', 'user-research']
    };
    
    const type = requirements.type || 'generalist';
    capabilities.push(...(capabilityMap[type] || ['general-task']));
    
    // Add explicit capabilities
    if (requirements.capabilities) {
      capabilities.push(...requirements.capabilities);
    }
    
    return [...new Set(capabilities)];
  }
  
  /**
   * Allocate resources for agent
   */
  allocateResources(requirements) {
    return {
      memory: requirements.memory || '512MB',
      cpu: requirements.cpu || '0.5',
      timeout: requirements.timeout || 300000, // 5 minutes
      maxTasks: requirements.maxTasks || 10
    };
  }
  
  /**
   * Create the actual agent instance
   */
  async createAgent(agentId, config) {
    // Get specialist implementation
    const specialist = this.specialistSpawner.spawnSpecialist(
      config.type,
      {
        model: config.model,
        modelConfig: config.modelConfig,
        capabilities: config.capabilities
      }
    );
    
    // Wrap with lifecycle management
    const agent = {
      id: agentId,
      specialist,
      config,
      execute: async (_task) => {
        const metadata = this.agentMetadata.get(agentId);
        if (metadata) {
          metadata.taskCount++;
          metadata.lastUsed = Date.now();
        }
        
        return specialist.execute(task);
      },
      validate: async (result) => {
        return specialist.validate ? specialist.validate(result) : true;
      }
    };
    
    return agent;
  }
  
  /**
   * Find reusable agent for task
   */
  findReusableAgent(requirements) {
    for (const [agentId, agent] of this.agentPool) {
      const lifecycle = this.lifecycleManager.getAgent(agentId);
      const metadata = this.agentMetadata.get(agentId);
      
      if (!lifecycle || !metadata) {continue;}
      
      // Check if agent is available
      if (!lifecycle.isAvailable()) {continue;}
      
      // Check if agent matches requirements
      const similarity = this.calculateSimilarity(requirements, metadata.requirements);
      
      if (similarity >= this.config.reuseThreshold) {
        logger.info(`Found reusable agent ${agentId} with ${(similarity * 100).toFixed(1)}% similarity`);
        return {
          id: agentId,
          agent,
          lifecycle,
          config: metadata.config
        };
      }
    }
    
    return null;
  }
  
  /**
   * Calculate similarity between requirements
   */
  calculateSimilarity(req1, req2) {
    if (!req1 || !req2) {return 0;}
    
    let score = 0;
    let factors = 0;
    
    // Type match
    if (req1.type === req2.type) {
      score += 0.4;
    }
    factors += 0.4;
    
    // Department match
    if (req1.department === req2.department) {
      score += 0.2;
    }
    factors += 0.2;
    
    // Role match
    if (req1.role === req2.role) {
      score += 0.2;
    }
    factors += 0.2;
    
    // Capability overlap
    if (req1.capabilities && req2.capabilities) {
      const cap1 = new Set(req1.capabilities);
      const cap2 = new Set(req2.capabilities);
      const intersection = [...cap1].filter(c => cap2.has(c));
      const union = new Set([...cap1, ...cap2]);
      
      if (union.size > 0) {
        score += (intersection.length / union.size) * 0.2;
      }
    }
    factors += 0.2;
    
    return factors > 0 ? score / factors : 0;
  }
  
  /**
   * Check if we can spawn new agents
   */
  canSpawn() {
    const totalAgents = this.agentPool.size;
    const activeSpawns = this.activeSpawns.size;
    
    return totalAgents < this.config.maxTotalAgents &&
           activeSpawns < this.config.maxConcurrentSpawns;
  }
  
  /**
   * Queue spawn request
   */
  async queueSpawnRequest(request) {
    return new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
      
      // Insert based on priority
      const insertIndex = this.spawnQueue.findIndex(r => r.priority > request.priority);
      
      if (insertIndex === -1) {
        this.spawnQueue.push(request);
      } else {
        this.spawnQueue.splice(insertIndex, 0, request);
      }
      
      this.stats.queueLength = this.spawnQueue.length;
      
      logger.info(`🟢 Queued spawn request ${request.id} (position: ${insertIndex === -1 ? this.spawnQueue.length : insertIndex + 1})`);
    });
  }
  
  /**
   * Process spawn queue
   */
  async processSpawnQueue() {
    while (this.spawnQueue.length > 0 && this.canSpawn()) {
      const request = this.spawnQueue.shift();
      this.stats.queueLength = this.spawnQueue.length;
      
      try {
        const result = await this.spawnAgent(request);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
  }
  
  /**
   * Start spawn processor
   */
  startSpawnProcessor() {
    setInterval(() => {
      this.processSpawnQueue();
      this.updatePoolUtilization();
      
      // Pre-spawn agents if enabled
      if (this.config.preSpawnEnabled) {
        this.preSpawnAgents();
      }
    }, 1000); // Process every second
  }
  
  /**
   * Pre-spawn agents based on patterns
   */
  async preSpawnAgents() {
    // Analyze recent patterns
    const predictions = this.predictUpcomingNeeds();
    
    for (const prediction of predictions) {
      if (prediction.confidence > 0.7 && this.canSpawn()) {
        logger.info(`🟢 Pre-spawning ${prediction.type} agent (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`);
        
        this.requestSpawn(prediction.requirements, {
          priority: SpawnPriority.BACKGROUND,
          preSpawn: true
        });
      }
    }
  }
  
  /**
   * Predict upcoming agent needs
   */
  predictUpcomingNeeds() {
    const predictions = [];
    
    // Analyze task patterns
    this.taskPatterns.forEach((pattern, type) => {
      if (pattern.frequency > 2 && pattern.lastSeen < 300000) { // Seen >2 times in last 5 min
        predictions.push({
          type,
          confidence: Math.min(pattern.frequency / 10, 0.9),
          requirements: pattern.lastRequirements
        });
      }
    });
    
    return predictions;
  }
  
  /**
   * Learn spawn pattern
   */
  learnSpawnPattern(requirements, config) {
    const type = requirements.type || 'general';
    
    if (!this.taskPatterns.has(type)) {
      this.taskPatterns.set(type, {
        frequency: 0,
        lastSeen: 0,
        lastRequirements: null
      });
    }
    
    const pattern = this.taskPatterns.get(type);
    pattern.frequency++;
    pattern.lastSeen = Date.now();
    pattern.lastRequirements = requirements;
  }
  
  /**
   * Handle agent state change
   */
  handleAgentStateChange(data) {
    const { agentId, from, to } = data;
    
    // Update pool utilization
    this.updatePoolUtilization();
    
    // Check if agent became available
    if (to === AgentState.ACTIVE && this.spawnQueue.length > 0) {
      this.processSpawnQueue();
    }
    
    // Emit state change
    this.emit('agent:stateChanged', data);
  }
  
  /**
   * Handle agent deprecated
   */
  handleAgentDeprecated(data) {
    const { agentId } = data;
    
    // Remove from pool
    this.agentPool.delete(agentId);
    this.agentMetadata.delete(agentId);
    
    // Update stats
    this.stats.totalDeprecated++;
    
    // Process queue if we have capacity now
    if (this.spawnQueue.length > 0) {
      this.processSpawnQueue();
    }
    
    logger.info(`🟢️ Agent ${agentId} deprecated and removed from pool`);
  }
  
  /**
   * Update average spawn time
   */
  updateAverageSpawnTime(spawnTime) {
    const totalSpawns = this.stats.totalSpawned;
    const currentAverage = this.stats.averageSpawnTime;
    
    this.stats.averageSpawnTime = 
      (currentAverage * (totalSpawns - 1) + spawnTime) / totalSpawns;
  }
  
  /**
   * Update pool utilization
   */
  updatePoolUtilization() {
    const totalAgents = this.agentPool.size;
    const activeAgents = this.lifecycleManager.getAgentsInState(AgentState.ACTIVE).length;
    
    this.stats.poolUtilization = totalAgents > 0 
      ? (activeAgents / totalAgents) * 100 
      : 0;
  }
  
  /**
   * Generate request ID
   */
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get controller statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      activeAgents: this.agentPool.size,
      activeSpawns: this.activeSpawns.size,
      lifecycleMetrics: this.lifecycleManager.getMetrics(),
      taskPatterns: Array.from(this.taskPatterns.entries()).map(([type, pattern]) => ({
        type,
        ...pattern
      }))
    };
  }
  
  /**
   * Get agent details
   */
  getAgentDetails(agentId) {
    return {
      agent: this.agentPool.get(agentId),
      lifecycle: this.lifecycleManager.getAgent(agentId),
      metadata: this.agentMetadata.get(agentId)
    };
  }
  
  /**
   * Deprecate specific agent
   */
  async deprecateAgent(agentId, reason = 'manual') {
    const lifecycle = this.lifecycleManager.getAgent(agentId);
    
    if (lifecycle) {
      await lifecycle.transition(StateEvent.DEPRECATE, { reason });
      logger.info(`🟢 Initiated deprecation of agent ${agentId}`);
    }
  }
  
  /**
   * Auto-scale agent pool based on demand
   */
  async autoScale() {
    const currentLoad = this.getCurrentLoad();
    const recommendedAgents = this.calculateRecommendedAgentCount();
    const currentAgents = this.agentPool.size;
    
    logger.info(`🔄 Auto-scaling: Current=${currentAgents}, Recommended=${recommendedAgents}, Load=${currentLoad}%`);
    
    if (recommendedAgents > currentAgents) {
      // Scale up
      const needed = recommendedAgents - currentAgents;
      const scaleUpTasks = [];
      
      for (let i = 0; i < needed; i++) {
        const agentType = this.selectOptimalAgentType();
        scaleUpTasks.push(this.spawnAgent({
          type: agentType,
          department: 'auto-scaling',
          priority: 'high',
          reason: 'auto-scale-up'
        }));
      }
      
      const results = await Promise.allSettled(scaleUpTasks);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      logger.info(`📈 Scaled up: +${successful} agents`);
      return { action: 'scale-up', added: successful, failed: needed - successful };
      
    } else if (recommendedAgents < currentAgents && currentLoad < 50) {
      // Scale down (only if load is low)
      const excess = currentAgents - recommendedAgents;
      const candidates = this.selectAgentsForScaleDown(excess);
      
      let removed = 0;
      for (const agentId of candidates) {
        try {
          await this.deprecateAgent(agentId, 'auto-scale-down');
          removed++;
        } catch (error) {
          logger.warn(`Failed to scale down agent ${agentId}:`, error.message);
        }
      }
      
      logger.info(`📉 Scaled down: -${removed} agents`);
      return { action: 'scale-down', removed, attempted: excess };
    }
    
    return { action: 'no-change', reason: 'optimal-size' };
  }

  /**
   * Balance load across available agents
   */
  async balanceLoad() {
    const agents = Array.from(this.agentPool.values());
    const loadDistribution = this.calculateLoadDistribution(agents);
    
    // Find overloaded and underutilized agents
    const overloaded = loadDistribution.filter(a => a.load > 80);
    const underutilized = loadDistribution.filter(a => a.load < 30 && a.capacity > 0);
    
    if (overloaded.length === 0) {
      return { balanced: true, reason: 'no-overloaded-agents' };
    }
    
    const rebalanceActions = [];
    
    for (const overloadedAgent of overloaded) {
      // Find suitable targets for load redistribution
      const targets = underutilized
        .filter(a => a.type === overloadedAgent.type || a.capabilities.includes(overloadedAgent.primaryCapability))
        .sort((a, b) => a.load - b.load)
        .slice(0, 3); // Max 3 targets per overloaded agent
        
      if (targets.length > 0) {
        const tasksToMove = this.selectTasksForRebalancing(overloadedAgent, targets.length);
        
        for (let i = 0; i < tasksToMove.length && i < targets.length; i++) {
          const task = tasksToMove[i];
          const target = targets[i];
          
          try {
            await this.relocateTask(task, overloadedAgent.id, target.id);
            rebalanceActions.push({
              from: overloadedAgent.id,
              to: target.id,
              task: task.id,
              success: true
            });
          } catch (error) {
            rebalanceActions.push({
              from: overloadedAgent.id,
              to: target.id,
              task: task.id,
              success: false,
              error: error.message
            });
          }
        }
      }
    }
    
    const successful = rebalanceActions.filter(a => a.success).length;
    logger.info(`🟡️ Load balancing: ${successful}/${rebalanceActions.length} tasks redistributed`);
    
    return {
      balanced: successful > 0,
      actions: rebalanceActions,
      overloadedAgents: overloaded.length,
      rebalancedTasks: successful
    };
  }

  /**
   * Predict future demand based on patterns
   */
  predictDemand(timeHorizon = 3600000) { // 1 hour default
    const now = Date.now();
    const historicalData = this.getHistoricalDemand(timeHorizon * 2); // 2x horizon for pattern analysis
    
    const prediction = {
      timestamp: now,
      horizon: timeHorizon,
      patterns: this.analyzePatterns(historicalData),
      forecast: {}
    };
    
    // Analyze hourly patterns
    const hourlyDemand = this.aggregateByHour(historicalData);
    const currentHour = new Date(now).getHours();
    const trendMultiplier = this.calculateTrendMultiplier(historicalData);
    
    // Predict demand by task type
    for (const [taskType, pattern] of this.taskPatterns) {
      const baselineForHour = hourlyDemand[currentHour]?.[taskType] || 0;
      const seasonalAdjustment = this.getSeasonalAdjustment(taskType, currentHour);
      const trendAdjustment = pattern.growth * trendMultiplier;
      
      prediction.forecast[taskType] = {
        baseline: baselineForHour,
        seasonal: seasonalAdjustment,
        trend: trendAdjustment,
        predicted: Math.max(0, baselineForHour + seasonalAdjustment + trendAdjustment),
        confidence: this.calculateConfidence(pattern, historicalData.length)
      };
    }
    
    // Overall system prediction
    const totalPredicted = Object.values(prediction.forecast)
      .reduce((sum, p) => sum + p.predicted, 0);
    
    prediction.overall = {
      currentLoad: this.getCurrentLoad(),
      predictedLoad: totalPredicted,
      recommendedAgents: Math.ceil(totalPredicted / this.avgTasksPerAgent),
      scaleAction: this.determineScaleAction(totalPredicted)
    };
    
    logger.info(`🔮 Demand prediction: ${totalPredicted} tasks predicted for next ${timeHorizon/60000}min`);
    
    return prediction;
  }

  /**
   * Optimize resource allocation
   */
  async optimizeAllocation() {
    const agents = Array.from(this.agentPool.values());
    const tasks = this.getPendingTasks();
    
    // Calculate optimal allocation using simplified assignment algorithm
    const optimization = {
      timestamp: Date.now(),
      totalTasks: tasks.length,
      totalAgents: agents.length,
      allocations: [],
      efficiency: 0
    };
    
    // Sort tasks by priority and complexity
    const sortedTasks = tasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      }
      return (b.complexity || 1) - (a.complexity || 1);
    });
    
    // Sort agents by capability and current load
    const sortedAgents = agents.sort((a, b) => {
      const loadDiff = (a.currentLoad || 0) - (b.currentLoad || 0);
      if (Math.abs(loadDiff) > 10) return loadDiff;
      return (b.capabilities?.length || 0) - (a.capabilities?.length || 0);
    });
    
    // Allocate tasks to agents
    for (const task of sortedTasks) {
      const bestAgent = this.findBestAgentForTask(task, sortedAgents);
      
      if (bestAgent) {
        optimization.allocations.push({
          taskId: task.id,
          agentId: bestAgent.id,
          score: this.calculateAllocationScore(task, bestAgent),
          reason: this.explainAllocation(task, bestAgent)
        });
        
        // Update agent load for next allocation
        bestAgent.currentLoad = (bestAgent.currentLoad || 0) + (task.complexity || 1);
      }
    }
    
    // Calculate efficiency score
    optimization.efficiency = this.calculateAllocationEfficiency(optimization.allocations);
    
    logger.info(`🟡 Allocation optimized: ${optimization.allocations.length} tasks, ${optimization.efficiency}% efficiency`);
    
    return optimization;
  }

  /**
   * Handle failover when agents become unavailable
   */
  async handleFailover(failedAgentId, reason = 'unknown') {
    const failedAgent = this.agentPool.get(failedAgentId);
    if (!failedAgent) {
      logger.warn(`Failover requested for unknown agent: ${failedAgentId}`);
      return { success: false, reason: 'agent-not-found' };
    }
    
    logger.warn(`🔴 Handling failover for agent ${failedAgentId}: ${reason}`);
    
    const failover = {
      timestamp: Date.now(),
      failedAgent: failedAgentId,
      reason,
      recoveredTasks: 0,
      spawnedReplacements: 0,
      actions: []
    };
    
    try {
      // Get tasks assigned to failed agent
      const affectedTasks = this.getTasksByAgent(failedAgentId);
      
      // Find replacement agents
      const replacementCandidates = this.findReplacementAgents(failedAgent);
      
      // Redistribute tasks
      for (const task of affectedTasks) {
        const replacement = this.selectBestReplacement(task, replacementCandidates);
        
        if (replacement) {
          try {
            await this.relocateTask(task, failedAgentId, replacement.id);
            failover.recoveredTasks++;
            failover.actions.push({
              action: 'task-relocated',
              taskId: task.id,
              from: failedAgentId,
              to: replacement.id,
              success: true
            });
          } catch (error) {
            failover.actions.push({
              action: 'task-relocation-failed',
              taskId: task.id,
              error: error.message,
              success: false
            });
          }
        } else {
          // No suitable replacement found, spawn new agent
          try {
            const newAgent = await this.spawnAgent({
              type: failedAgent.type,
              department: failedAgent.department,
              capabilities: failedAgent.capabilities,
              priority: 'high',
              reason: 'failover-replacement'
            });
            
            await this.relocateTask(task, failedAgentId, newAgent.id);
            failover.spawnedReplacements++;
            failover.recoveredTasks++;
            failover.actions.push({
              action: 'replacement-spawned',
              taskId: task.id,
              newAgent: newAgent.id,
              success: true
            });
          } catch (error) {
            failover.actions.push({
              action: 'replacement-spawn-failed',
              taskId: task.id,
              error: error.message,
              success: false
            });
          }
        }
      }
      
      // Mark failed agent as unavailable
      await this.deprecateAgent(failedAgentId, `failover-${reason}`);
      
      // Update monitoring
      this.recordFailoverEvent(failover);
      
      logger.info(`🏁 Failover complete: ${failover.recoveredTasks}/${affectedTasks.length} tasks recovered`);
      
      return {
        success: true,
        ...failover
      };
      
    } catch (error) {
      logger.error(`Failover handling failed for ${failedAgentId}:`, error);
      return {
        success: false,
        error: error.message,
        ...failover
      };
    }
  }

  /**
   * Route requests to optimal agents
   */
  async routeRequest(request) {
    const routingDecision = {
      timestamp: Date.now(),
      requestId: request.id || 'unknown',
      type: request.type,
      success: false,
      agent: null,
      score: 0,
      alternatives: [],
      reason: ''
    };
    
    try {
      // Find all capable agents
      const capableAgents = this.findCapableAgents(request);
      
      if (capableAgents.length === 0) {
        // No agents available, check if we can spawn one
        if (this.canSpawnForRequest(request)) {
          const newAgent = await this.spawnAgent({
            type: this.selectOptimalAgentType(request),
            department: request.department || 'general',
            priority: request.priority || 'normal',
            reason: 'on-demand-routing'
          });
          
          routingDecision.agent = newAgent.id;
          routingDecision.success = true;
          routingDecision.reason = 'spawned-new-agent';
          routingDecision.score = 100;
        } else {
          routingDecision.reason = 'no-capable-agents-and-cannot-spawn';
          return routingDecision;
        }
      } else {
        // Score and rank available agents
        const scoredAgents = capableAgents.map(agent => ({
          ...agent,
          routingScore: this.calculateRoutingScore(agent, request)
        })).sort((a, b) => b.routingScore - a.routingScore);
        
        const bestAgent = scoredAgents[0];
        routingDecision.agent = bestAgent.id;
        routingDecision.success = true;
        routingDecision.score = bestAgent.routingScore;
        routingDecision.reason = 'best-available-agent';
        routingDecision.alternatives = scoredAgents.slice(1, 4).map(a => ({
          id: a.id,
          score: a.routingScore
        }));
      }
      
      // Log routing decision
      logger.info(`🟡 Request routed: ${request.type} -> Agent ${routingDecision.agent} (score: ${routingDecision.score})`);
      
      return routingDecision;
      
    } catch (error) {
      routingDecision.reason = `routing-error: ${error.message}`;
      logger.error(`Failed to route request ${request.id}:`, error);
      return routingDecision;
    }
  }

  /**
   * Monitor performance across the agent pool
   */
  async monitorPerformance() {
    const monitoring = {
      timestamp: Date.now(),
      overall: {},
      agents: [],
      alerts: [],
      recommendations: []
    };
    
    // Overall system metrics
    const totalAgents = this.agentPool.size;
    const activeAgents = Array.from(this.agentPool.values()).filter(a => a.status === 'active').length;
    const totalTasks = this.getTotalActiveTasks();
    const averageLoad = this.getCurrentLoad();
    
    monitoring.overall = {
      totalAgents,
      activeAgents,
      totalTasks,
      averageLoad,
      utilization: totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0,
      throughput: this.calculateThroughput(),
      errorRate: this.calculateSystemErrorRate(),
      averageResponseTime: this.calculateAverageResponseTime()
    };
    
    // Per-agent performance
    for (const [agentId, agent] of this.agentPool) {
      const agentMetrics = {
        id: agentId,
        type: agent.type,
        status: agent.status,
        uptime: Date.now() - (agent.spawnedAt || 0),
        tasksCompleted: agent.tasksCompleted || 0,
        tasksActive: agent.activeTasks?.length || 0,
        errorCount: agent.errorCount || 0,
        averageTaskTime: agent.averageTaskTime || 0,
        load: agent.currentLoad || 0,
        memoryUsage: agent.memoryUsage || 0,
        cpuUsage: agent.cpuUsage || 0,
        lastActivity: agent.lastActivity || 0
      };
      
      // Calculate performance score
      agentMetrics.performanceScore = this.calculateAgentPerformanceScore(agentMetrics);
      
      // Check for alerts
      if (agentMetrics.errorCount > 5) {
        monitoring.alerts.push({
          type: 'high-error-rate',
          agent: agentId,
          value: agentMetrics.errorCount,
          threshold: 5
        });
      }
      
      if (agentMetrics.load > 90) {
        monitoring.alerts.push({
          type: 'high-load',
          agent: agentId,
          value: agentMetrics.load,
          threshold: 90
        });
      }
      
      if (Date.now() - agentMetrics.lastActivity > 600000) { // 10 minutes
        monitoring.alerts.push({
          type: 'inactive-agent',
          agent: agentId,
          value: Date.now() - agentMetrics.lastActivity,
          threshold: 600000
        });
      }
      
      monitoring.agents.push(agentMetrics);
    }
    
    // Generate recommendations
    if (monitoring.overall.averageLoad > 80) {
      monitoring.recommendations.push({
        type: 'scale-up',
        reason: 'High system load detected',
        action: 'Consider adding more agents'
      });
    }
    
    if (monitoring.overall.utilization < 30) {
      monitoring.recommendations.push({
        type: 'scale-down',
        reason: 'Low utilization detected',
        action: 'Consider reducing agent count'
      });
    }
    
    if (monitoring.overall.errorRate > 5) {
      monitoring.recommendations.push({
        type: 'investigate-errors',
        reason: 'High error rate detected',
        action: 'Review agent logs and configuration'
      });
    }
    
    logger.info(`📊 Performance monitoring: ${totalAgents} agents, ${averageLoad}% load, ${monitoring.alerts.length} alerts`);
    
    return monitoring;
  }

  // Helper methods for the new functionality

  getCurrentLoad() {
    const agents = Array.from(this.agentPool.values());
    if (agents.length === 0) return 0;
    
    const totalLoad = agents.reduce((sum, agent) => sum + (agent.currentLoad || 0), 0);
    const maxLoad = agents.length * 100; // Assuming 100% max load per agent
    return Math.round((totalLoad / maxLoad) * 100);
  }

  calculateRecommendedAgentCount() {
    const currentTasks = this.getTotalActiveTasks();
    const predictedTasks = this.predictDemand(1800000).overall.predictedLoad; // 30 min horizon
    const maxTasks = Math.max(currentTasks, predictedTasks);
    return Math.ceil(maxTasks / this.avgTasksPerAgent) || 1;
  }

  selectOptimalAgentType(request = null) {
    if (request && request.type) {
      const mapping = this.getTaskTypeToAgentMapping();
      return mapping[request.type] || 'general-purpose';
    }
    return 'general-purpose';
  }

  getTotalActiveTasks() {
    return Array.from(this.agentPool.values())
      .reduce((sum, agent) => sum + (agent.activeTasks?.length || 0), 0);
  }

  /**
   * Execute operation with concurrency control and resource pooling
   */
  async executeWithConcurrencyControl(operation, operationType, ...args) {
    const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // Check concurrency limits
      const currentOps = this.concurrentOperations.get(operationType) || 0;
      const limit = this.poolConfig.maxResourcesPerType;
      
      if (currentOps >= limit) {
        throw new Error(`Concurrency limit reached for ${operationType}: ${currentOps}/${limit}`);
      }
      
      // Track operation
      this.concurrentOperations.set(operationType, currentOps + 1);
      this.operationMetrics.currentConcurrency++;
      this.operationMetrics.totalOperations++;
      
      // Update peak concurrency
      if (this.operationMetrics.currentConcurrency > this.operationMetrics.peakConcurrency) {
        this.operationMetrics.peakConcurrency = this.operationMetrics.currentConcurrency;
      }
      
      // Get or create resource from pool
      const resource = await this.getPooledResource(operationType);
      
      // Execute operation with timeout
      const result = await Promise.race([
        operation.call(this, resource, ...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.poolConfig.poolTimeout)
        )
      ]);
      
      // Return resource to pool
      await this.returnResourceToPool(resource, operationType);
      
      // Update metrics
      const duration = Date.now() - startTime;
      this.updateOperationMetrics(duration, true);
      
      logger.debug(`🏁 Operation ${operationId} completed in ${duration}ms`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateOperationMetrics(duration, false);
      
      logger.error(`🔴 Operation ${operationId} failed after ${duration}ms:`, error.message);
      throw error;
    } finally {
      // Cleanup operation tracking
      const currentOps = this.concurrentOperations.get(operationType) || 1;
      this.concurrentOperations.set(operationType, Math.max(0, currentOps - 1));
      this.operationMetrics.currentConcurrency = Math.max(0, this.operationMetrics.currentConcurrency - 1);
    }
  }

  /**
   * Get or create resource from pool
   */
  async getPooledResource(resourceType) {
    const poolKey = `pool_${resourceType}`;
    let pool = this.resourcePool.get(poolKey);
    
    if (!pool) {
      pool = {
        available: [],
        inUse: new Set(),
        created: 0,
        maxSize: this.poolConfig.maxResourcesPerType
      };
      this.resourcePool.set(poolKey, pool);
    }
    
    // Try to get available resource
    if (pool.available.length > 0) {
      const resource = pool.available.pop();
      pool.inUse.add(resource.id);
      return resource;
    }
    
    // Create new resource if under limit
    if (pool.created < pool.maxSize) {
      const resource = await this.createResource(resourceType);
      pool.inUse.add(resource.id);
      pool.created++;
      return resource;
    }
    
    // Wait for available resource
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Resource pool timeout for ${resourceType}`));
      }, this.poolConfig.poolTimeout);
      
      const checkAvailable = () => {
        if (pool.available.length > 0) {
          clearTimeout(timeout);
          const resource = pool.available.pop();
          pool.inUse.add(resource.id);
          resolve(resource);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      
      checkAvailable();
    });
  }

  /**
   * Return resource to pool
   */
  async returnResourceToPool(resource, resourceType) {
    const poolKey = `pool_${resourceType}`;
    const pool = this.resourcePool.get(poolKey);
    
    if (pool && pool.inUse.has(resource.id)) {
      pool.inUse.delete(resource.id);
      
      // Reset resource state
      resource.lastUsed = Date.now();
      resource.useCount = (resource.useCount || 0) + 1;
      
      // Return to available pool
      pool.available.push(resource);
      
      logger.debug(`🔄 Resource returned to pool: ${resource.id}`);
    }
  }

  /**
   * Create new resource
   */
  async createResource(resourceType) {
    const resource = {
      id: `${resourceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: resourceType,
      created: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
      status: 'available'
    };
    
    // Resource-specific initialization
    switch (resourceType) {
      case 'connection':
        resource.connection = await this.createConnection();
        break;
      case 'agent_template':
        resource.template = await this.createAgentTemplate();
        break;
      case 'computation':
        resource.worker = await this.createComputationWorker();
        break;
      default:
        resource.generic = { initialized: true };
    }
    
    logger.debug(`🆕 Resource created: ${resource.id} (${resourceType})`);
    return resource;
  }

  /**
   * Cleanup expired resources
   */
  cleanupExpiredResources() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    let cleanedCount = 0;
    
    for (const [poolKey, pool] of this.resourcePool.entries()) {
      const expired = [];
      
      pool.available = pool.available.filter(resource => {
        if (now - resource.lastUsed > maxAge) {
          expired.push(resource);
          return false;
        }
        return true;
      });
      
      // Clean up expired resources
      expired.forEach(resource => {
        this.destroyResource(resource);
        pool.created--;
        cleanedCount++;
      });
    }
    
    if (cleanedCount > 0) {
      logger.debug(`🧹 Cleaned up ${cleanedCount} expired resources`);
    }
  }

  /**
   * Update operation metrics
   */
  updateOperationMetrics(duration, success) {
    if (success) {
      this.operationMetrics.successfulOperations++;
    } else {
      this.operationMetrics.failedOperations++;
    }
    
    // Update average latency (rolling window)
    const total = this.operationMetrics.successfulOperations + this.operationMetrics.failedOperations;
    this.operationMetrics.averageLatency = 
      (this.operationMetrics.averageLatency * (total - 1) + duration) / total;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      operations: { ...this.operationMetrics },
      resourcePools: Array.from(this.resourcePool.entries()).map(([key, pool]) => ({
        type: key,
        available: pool.available.length,
        inUse: pool.inUse.size,
        created: pool.created,
        maxSize: pool.maxSize,
        utilization: Math.round((pool.inUse.size / pool.maxSize) * 100)
      })),
      concurrentOperations: Array.from(this.concurrentOperations.entries()).map(([type, count]) => ({
        type,
        active: count,
        limit: this.poolConfig.maxResourcesPerType
      }))
    };
  }

  // Helper methods for resource creation
  async createConnection() {
    return { type: 'connection', active: true };
  }

  async createAgentTemplate() {
    return { type: 'template', cached: true };
  }

  async createComputationWorker() {
    return { type: 'worker', ready: true };
  }

  async destroyResource(resource) {
    // Resource-specific cleanup
    if (resource.connection) {
      resource.connection.active = false;
    }
    logger.debug(`💥 Resource destroyed: ${resource.id}`);
  }

  calculateThroughput() {
    // Tasks completed in the last hour
    const oneHourAgo = Date.now() - 3600000;
    return Array.from(this.agentPool.values())
      .reduce((sum, agent) => sum + (agent.tasksCompletedSince?.(oneHourAgo) || 0), 0);
  }

  calculateSystemErrorRate() {
    const agents = Array.from(this.agentPool.values());
    if (agents.length === 0) return 0;
    
    const totalErrors = agents.reduce((sum, agent) => sum + (agent.errorCount || 0), 0);
    const totalTasks = agents.reduce((sum, agent) => sum + (agent.tasksCompleted || 0), 0);
    return totalTasks > 0 ? (totalErrors / totalTasks) * 100 : 0;
  }

  calculateAverageResponseTime() {
    const agents = Array.from(this.agentPool.values()).filter(a => a.averageTaskTime);
    if (agents.length === 0) return 0;
    
    const totalTime = agents.reduce((sum, agent) => sum + agent.averageTaskTime, 0);
    return totalTime / agents.length;
  }

  /**
   * Shutdown controller
   */
  async shutdown() {
    logger.info('🔴 Shutting down Dynamic Spawning Controller');
    
    // Clear spawn queue
    this.spawnQueue.forEach(request => {
      request.reject(new Error('Controller shutdown'));
    });
    this.spawnQueue = [];
    
    // Deprecate all agents
    await this.lifecycleManager.deprecateAll('shutdown');
    
    // Clear pools
    this.agentPool.clear();
    this.agentMetadata.clear();
    this.activeSpawns.clear();
    
    logger.info('🏁 Dynamic Spawning Controller shutdown complete');
  }
}

/**
 * Machine Learning-based Demand Predictor
 */
class DemandPredictor {
  constructor() {
    this.historicalData = [];
    this.predictionModel = new SimpleLinearPredictor();
    this.patterns = new Map();
    this.seasonalityDetector = new SeasonalityDetector();
    this.anomalyDetector = new AnomalyDetector();
  }

  /**
   * Record demand data point
   */
  recordDemand(timestamp, metrics) {
    const dataPoint = {
      timestamp,
      activeAgents: metrics.activeAgents,
      queueLength: metrics.queueLength,
      avgResponseTime: metrics.avgResponseTime,
      requestRate: metrics.requestRate,
      cpuUtilization: metrics.cpuUtilization,
      memoryUtilization: metrics.memoryUtilization,
      hour: new Date(timestamp).getHours(),
      dayOfWeek: new Date(timestamp).getDay()
    };

    this.historicalData.push(dataPoint);
    
    // Keep only last 7 days of data
    const sevenDaysAgo = timestamp - (7 * 24 * 60 * 60 * 1000);
    this.historicalData = this.historicalData.filter(d => d.timestamp > sevenDaysAgo);
    
    // Update prediction model
    this.updatePredictionModel();
    
    // Detect patterns
    this.detectPatterns();
  }

  /**
   * Predict demand for future time window
   */
  predictDemand(futureTimestamp, windowMinutes = 30) {
    const predictions = [];
    const stepSize = 5 * 60 * 1000; // 5 minute steps
    const steps = Math.ceil((windowMinutes * 60 * 1000) / stepSize);

    for (let i = 0; i < steps; i++) {
      const targetTime = futureTimestamp + (i * stepSize);
      const prediction = this.predictSinglePoint(targetTime);
      predictions.push({
        timestamp: targetTime,
        ...prediction
      });
    }

    return {
      predictions,
      confidence: this.calculateConfidence(),
      trendsDetected: this.getDetectedTrends(),
      anomaliesExpected: this.predictAnomalies(futureTimestamp, windowMinutes)
    };
  }

  /**
   * Predict single time point
   */
  predictSinglePoint(timestamp) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Get historical averages for this time slot
    const historicalPattern = this.getHistoricalPattern(hour, dayOfWeek);
    
    // Apply trend analysis
    const trendAdjustment = this.calculateTrendAdjustment(timestamp);
    
    // Apply seasonality
    const seasonalAdjustment = this.seasonalityDetector.getSeasonalMultiplier(hour, dayOfWeek);
    
    // Base prediction from linear model
    const basePrediction = this.predictionModel.predict(timestamp);
    
    return {
      activeAgents: Math.max(1, Math.round(basePrediction.activeAgents * seasonalAdjustment * trendAdjustment)),
      queueLength: Math.max(0, Math.round(basePrediction.queueLength * seasonalAdjustment)),
      expectedLoad: historicalPattern.avgLoad * seasonalAdjustment * trendAdjustment,
      confidence: this.calculatePredictionConfidence(timestamp)
    };
  }

  /**
   * Update the prediction model with latest data
   */
  updatePredictionModel() {
    if (this.historicalData.length < 10) return; // Need minimum data points
    
    const recentData = this.historicalData.slice(-100); // Use last 100 points
    this.predictionModel.train(recentData);
  }

  /**
   * Detect demand patterns (daily, weekly)
   */
  detectPatterns() {
    if (this.historicalData.length < 24) return; // Need at least 24 hours of data

    // Daily patterns
    const hourlyPatterns = this.groupBy(this.historicalData, 'hour');
    for (const [hour, dataPoints] of hourlyPatterns.entries()) {
      const avgDemand = dataPoints.reduce((sum, d) => sum + d.activeAgents, 0) / dataPoints.length;
      this.patterns.set(`hour_${hour}`, {
        type: 'hourly',
        avgDemand,
        sampleSize: dataPoints.length,
        lastUpdated: Date.now()
      });
    }

    // Weekly patterns
    const weeklyPatterns = this.groupBy(this.historicalData, 'dayOfWeek');
    for (const [day, dataPoints] of weeklyPatterns.entries()) {
      const avgDemand = dataPoints.reduce((sum, d) => sum + d.activeAgents, 0) / dataPoints.length;
      this.patterns.set(`day_${day}`, {
        type: 'weekly',
        avgDemand,
        sampleSize: dataPoints.length,
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * Get historical pattern for specific time
   */
  getHistoricalPattern(hour, dayOfWeek) {
    const hourlyPattern = this.patterns.get(`hour_${hour}`);
    const weeklyPattern = this.patterns.get(`day_${dayOfWeek}`);
    
    return {
      avgLoad: (hourlyPattern?.avgDemand || 1) * (weeklyPattern?.avgDemand || 1) / Math.max(1, this.getOverallAverage()),
      hourlyMultiplier: hourlyPattern ? hourlyPattern.avgDemand / this.getOverallAverage() : 1,
      weeklyMultiplier: weeklyPattern ? weeklyPattern.avgDemand / this.getOverallAverage() : 1
    };
  }

  /**
   * Calculate trend adjustment
   */
  calculateTrendAdjustment(timestamp) {
    const recentData = this.historicalData.slice(-20); // Last 20 data points
    if (recentData.length < 10) return 1;

    const oldAvg = recentData.slice(0, 10).reduce((sum, d) => sum + d.activeAgents, 0) / 10;
    const newAvg = recentData.slice(-10).reduce((sum, d) => sum + d.activeAgents, 0) / 10;
    
    return newAvg / Math.max(oldAvg, 1);
  }

  /**
   * Calculate prediction confidence
   */
  calculatePredictionConfidence(timestamp) {
    const dataAge = Date.now() - timestamp;
    const dataQuality = Math.min(this.historicalData.length / 100, 1); // More data = higher confidence
    const timeDistance = Math.max(0, 1 - (dataAge / (24 * 60 * 60 * 1000))); // Closer predictions = higher confidence
    
    return Math.round((dataQuality * 0.6 + timeDistance * 0.4) * 100);
  }

  // Helper methods
  groupBy(array, key) {
    const groups = new Map();
    for (const item of array) {
      const groupKey = item[key];
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(item);
    }
    return groups;
  }

  getOverallAverage() {
    if (this.historicalData.length === 0) return 1;
    return this.historicalData.reduce((sum, d) => sum + d.activeAgents, 0) / this.historicalData.length;
  }

  calculateConfidence() {
    return Math.min(this.historicalData.length * 2, 95); // Simple confidence based on data amount
  }

  getDetectedTrends() {
    return Array.from(this.patterns.entries()).map(([key, pattern]) => ({
      pattern: key,
      type: pattern.type,
      strength: pattern.avgDemand,
      samples: pattern.sampleSize
    }));
  }

  predictAnomalies(timestamp, windowMinutes) {
    return []; // Simple implementation - no anomalies predicted
  }
}

/**
 * Simple Linear Predictor for demand forecasting
 */
class SimpleLinearPredictor {
  constructor() {
    this.weights = { activeAgents: 1, queueLength: 0.5 };
    this.bias = 0;
    this.trained = false;
  }

  train(data) {
    if (data.length < 5) return;

    // Simple moving average prediction
    const recent = data.slice(-5);
    this.weights.activeAgents = recent.reduce((sum, d) => sum + d.activeAgents, 0) / recent.length;
    this.weights.queueLength = recent.reduce((sum, d) => sum + d.queueLength, 0) / recent.length;
    this.trained = true;
  }

  predict(timestamp) {
    if (!this.trained) {
      return { activeAgents: 1, queueLength: 0 };
    }

    return {
      activeAgents: this.weights.activeAgents,
      queueLength: this.weights.queueLength
    };
  }
}

/**
 * Seasonality Detection for demand patterns
 */
class SeasonalityDetector {
  constructor() {
    this.seasonalMultipliers = new Map();
  }

  getSeasonalMultiplier(hour, dayOfWeek) {
    // Simple seasonality - business hours vs off-hours
    const isBusinessHours = hour >= 9 && hour <= 17;
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    if (isBusinessHours && isWeekday) return 1.5; // 50% higher demand
    if (isBusinessHours && !isWeekday) return 0.8; // 20% lower demand
    if (!isBusinessHours && isWeekday) return 0.6; // 40% lower demand
    return 0.4; // 60% lower demand (off-hours weekend)
  }
}

/**
 * Anomaly Detection for demand spikes
 */
class AnomalyDetector {
  constructor() {
    this.baseline = 1;
    this.threshold = 2.0; // 2x baseline is anomaly
  }

  detectAnomaly(currentDemand) {
    return currentDemand > (this.baseline * this.threshold);
  }

  updateBaseline(recentDemand) {
    this.baseline = recentDemand.reduce((sum, d) => sum + d, 0) / recentDemand.length;
  }
}

/**
 * Elastic Resource Scaler
 */
class ElasticResourceScaler {
  constructor() {
    this.scalingHistory = [];
    this.lastScaleAction = 0;
    this.currentInstances = 2;
    this.targetInstances = 2;
    this.scalingInProgress = false;
  }

  /**
   * Determine scaling action based on demand prediction
   */
  analyzeScalingNeed(currentMetrics, demandPrediction, config) {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastScaleAction < config.scalingCooldownMs) {
      return { action: 'wait', reason: 'cooldown_period' };
    }

    const currentUtilization = this.calculateUtilization(currentMetrics);
    const predictedPeak = this.findPredictedPeak(demandPrediction);
    
    // Scale up conditions
    if (currentUtilization > config.scaleUpThreshold || predictedPeak.utilization > config.scaleUpThreshold) {
      const recommendedInstances = this.calculateRequiredInstances(predictedPeak.demand, config);
      
      if (recommendedInstances > this.currentInstances && this.currentInstances < config.maxInstances) {
        return {
          action: 'scale_up',
          from: this.currentInstances,
          to: Math.min(recommendedInstances, config.maxInstances),
          reason: predictedPeak.utilization > config.scaleUpThreshold ? 'predicted_demand' : 'current_demand',
          urgency: currentUtilization > 0.9 ? 'high' : 'medium',
          confidence: demandPrediction.confidence
        };
      }
    }

    // Scale down conditions
    if (currentUtilization < config.scaleDownThreshold && predictedPeak.utilization < config.scaleDownThreshold) {
      const recommendedInstances = this.calculateRequiredInstances(predictedPeak.demand, config);
      
      if (recommendedInstances < this.currentInstances && this.currentInstances > config.minInstances) {
        return {
          action: 'scale_down',
          from: this.currentInstances,
          to: Math.max(recommendedInstances, config.minInstances),
          reason: 'low_demand',
          urgency: 'low',
          confidence: demandPrediction.confidence
        };
      }
    }

    return { action: 'maintain', reason: 'optimal_capacity' };
  }

  /**
   * Execute scaling action
   */
  async executeScaling(scalingDecision, agentPool) {
    if (this.scalingInProgress) {
      throw new Error('Scaling operation already in progress');
    }

    try {
      this.scalingInProgress = true;
      this.lastScaleAction = Date.now();

      const result = await this.performScaling(scalingDecision, agentPool);
      
      // Record scaling history
      this.scalingHistory.push({
        timestamp: Date.now(),
        action: scalingDecision.action,
        from: scalingDecision.from,
        to: scalingDecision.to,
        reason: scalingDecision.reason,
        success: result.success,
        duration: result.duration
      });

      // Keep last 100 scaling actions
      if (this.scalingHistory.length > 100) {
        this.scalingHistory.shift();
      }

      if (result.success) {
        this.currentInstances = scalingDecision.to;
        this.targetInstances = scalingDecision.to;
      }

      return result;
      
    } finally {
      this.scalingInProgress = false;
    }
  }

  /**
   * Calculate current system utilization
   */
  calculateUtilization(metrics) {
    const factors = [
      metrics.cpuUtilization || 0,
      metrics.memoryUtilization || 0,
      Math.min((metrics.queueLength || 0) / 10, 1), // Queue pressure
      Math.min((metrics.activeAgents || 0) / this.currentInstances, 1) // Agent utilization
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  /**
   * Find predicted demand peak
   */
  findPredictedPeak(demandPrediction) {
    const predictions = demandPrediction.predictions || [];
    
    if (predictions.length === 0) {
      return { demand: 1, utilization: 0 };
    }

    const peak = predictions.reduce((max, pred) => 
      pred.activeAgents > max.activeAgents ? pred : max
    );

    return {
      demand: peak.activeAgents,
      utilization: peak.activeAgents / this.currentInstances,
      timestamp: peak.timestamp
    };
  }

  /**
   * Calculate required instances for predicted demand
   */
  calculateRequiredInstances(predictedDemand, config) {
    // Add 20% buffer for safety
    const safetyBuffer = 1.2;
    const required = Math.ceil(predictedDemand * safetyBuffer);
    return Math.max(config.minInstances, Math.min(required, config.maxInstances));
  }

  /**
   * Perform actual scaling operation
   */
  async performScaling(decision, agentPool) {
    const startTime = Date.now();
    
    try {
      if (decision.action === 'scale_up') {
        const instancesToAdd = decision.to - decision.from;
        logger.info(`🟢 Scaling up: adding ${instancesToAdd} instances (${decision.from} -> ${decision.to})`);
        
        // Add instances (mock implementation)
        for (let i = 0; i < instancesToAdd; i++) {
          await this.addInstance(agentPool);
        }
        
      } else if (decision.action === 'scale_down') {
        const instancesToRemove = decision.from - decision.to;
        logger.info(`📉 Scaling down: removing ${instancesToRemove} instances (${decision.from} -> ${decision.to})`);
        
        // Remove instances (mock implementation)
        for (let i = 0; i < instancesToRemove; i++) {
          await this.removeInstance(agentPool);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`🏁 Scaling completed in ${duration}ms`);
      
      return { success: true, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`🔴 Scaling failed after ${duration}ms:`, error);
      return { success: false, duration, error: error.message };
    }
  }

  async addInstance(agentPool) {
    // Mock instance addition
    logger.debug('🟢 Adding new agent instance');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate time
  }

  async removeInstance(agentPool) {
    // Mock instance removal
    logger.debug('🔴 Removing agent instance');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate time
  }

  /**
   * Get scaling metrics and history
   */
  getScalingMetrics() {
    const recentActions = this.scalingHistory.slice(-10);
    
    return {
      currentInstances: this.currentInstances,
      targetInstances: this.targetInstances,
      scalingInProgress: this.scalingInProgress,
      recentActions,
      scalingEffectiveness: this.calculateScalingEffectiveness(),
      lastScaleAction: this.lastScaleAction,
      totalScalingActions: this.scalingHistory.length
    };
  }

  calculateScalingEffectiveness() {
    if (this.scalingHistory.length === 0) return 100;
    
    const successful = this.scalingHistory.filter(h => h.success).length;
    return Math.round((successful / this.scalingHistory.length) * 100);
  }
}

// Export
module.exports = {
  DynamicSpawningController,
  SpawnPriority,
  DemandPredictor,
  ElasticResourceScaler
};