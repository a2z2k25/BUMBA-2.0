/**
 * Intelligent Agent System Initializer for BUMBA Framework
 * Integrates Intelligent Pooling, TTL Routing, Selection Matrix, and Lifecycle Management
 */

const { logger } = require('../logging/bumba-logger');
const { IntelligentPoolingSystem } = require('../pooling/intelligent-pooling-system');
const { TTLRouter } = require('../routing/ttl-router');
const { SelectionMatrixIntegration } = require('../selection/selection-matrix-system');
const { EnhancedLifecycleSystem } = require('../lifecycle/lifecycle-system');

class IntelligentAgentInitializer {
  constructor(bumbaFramework) {
    this.bumba = bumbaFramework;
    this.initialized = false;
    
    // System references
    this.poolingSystem = null;
    this.ttlRouter = null;
    this.selectionMatrix = null;
    this.lifecycleSystem = null;
    
    logger.info('🤖 Intelligent Agent Initializer created');
  }
  
  /**
   * Initialize all intelligent systems
   */
  async initialize(config = {}) {
    try {
      logger.info('🟢 Initializing Intelligent Agent Systems...');
      
      // 1. Initialize Enhanced Lifecycle System
      this.lifecycleSystem = new EnhancedLifecycleSystem({
        enableRecovery: config.enableRecovery !== false,
        enableOptimization: config.enableOptimization !== false,
        enableAnalytics: config.enableAnalytics !== false,
        enableOrchestration: config.enableOrchestration !== false,
        enableValidation: config.enableValidation !== false,
        ...config.lifecycle
      });
      
      // 2. Initialize Intelligent Pooling System
      this.poolingSystem = new IntelligentPoolingSystem({
        minPoolSize: config.minPoolSize || 5,
        maxPoolSize: config.maxPoolSize || 20,
        targetPoolSize: config.targetPoolSize || 10,
        warmThreshold: config.warmThreshold || 0.7,
        enableLearning: config.enableLearning !== false,
        ...config.pooling
      });
      
      // 3. Initialize TTL Router
      this.ttlRouter = new TTLRouter({
        enableOptimization: config.enableOptimization !== false,
        enableMonitoring: config.enableMonitoring !== false,
        enableMetrics: config.enableMetrics !== false,
        routingInterval: config.routingInterval || 1000,
        ...config.routing
      });
      
      // 4. Initialize Selection Matrix
      this.selectionMatrix = new SelectionMatrixIntegration({
        matrix: {
          enablePersistence: config.enablePersistence || false,
          ...config.matrix
        },
        scoring: {
          enableCache: config.enableCache !== false,
          ...config.scoring
        }
      });
      
      // 5. Connect systems together
      await this.connectSystems();
      
      // 6. Register with BUMBA framework
      await this.registerWithBumba();
      
      this.initialized = true;
      logger.info('🏁 Intelligent Agent Systems initialized successfully');
      
      return {
        pooling: this.poolingSystem,
        routing: this.ttlRouter,
        selection: this.selectionMatrix,
        lifecycle: this.lifecycleSystem
      };
      
    } catch (error) {
      logger.error('Failed to initialize Intelligent Agent Systems:', error);
      throw error;
    }
  }
  
  /**
   * Connect systems together for seamless integration
   */
  async connectSystems() {
    logger.info('🔗 Connecting intelligent systems...');
    
    // Connect pooling to lifecycle
    this.poolingSystem.on('specialist:added', (specialist) => {
      this.lifecycleSystem.createStateMachine(specialist.id, {
        hooks: {
          onEnterActive: async () => {
            await this.poolingSystem.getSpecialist(specialist.id);
          },
          onExitActive: async () => {
            await this.poolingSystem.releaseSpecialist(specialist.id);
          }
        }
      });
    });
    
    // Connect routing to selection matrix
    this.ttlRouter.on('task:routed', async (event) => {
      const { task, tier } = event;
      
      // Get eligible specialists from pool
      const activeSpecs = this.poolingSystem.getActiveSpecialists();
      const warmSpecs = this.poolingSystem.getWarmSpecialists();
      const eligibleSpecs = [...activeSpecs, ...warmSpecs];
      
      if (eligibleSpecs.length > 0) {
        // Use selection matrix to find best specialist
        const selection = await this.selectionMatrix.select(
          { type: task, ttl: tier },
          eligibleSpecs,
          { tier, urgency: tier === 'ULTRA_FAST' ? 1.0 : 0.5 }
        );
        
        if (selection && selection.decision.specialist) {
          // Update routing decision
          event.specialist = selection.decision.specialist;
        }
      }
    });
    
    // Connect lifecycle to pooling for state changes
    this.lifecycleSystem.on('specialist:state:changed', async (event) => {
      const { id, from, to } = event;
      
      if (to === 'warm') {
        await this.poolingSystem.warmUpSpecialist(id);
      } else if (to === 'hibernating') {
        await this.poolingSystem.hibernateSpecialist(id);
      } else if (to === 'terminated') {
        this.poolingSystem.removeSpecialist(id);
      }
    });
    
    // Connect selection matrix feedback to pooling usage tracker
    this.selectionMatrix.on('selection:completed', (result) => {
      if (result.selected) {
        this.poolingSystem.usageTracker.trackUsage(
          result.selected,
          result.department,
          { phase: result.context.projectPhase }
        );
      }
    });
    
    logger.info('🏁 Systems connected successfully');
  }
  
  /**
   * Register with BUMBA framework
   */
  async registerWithBumba() {
    if (!this.bumba) {
      logger.warn('No BUMBA framework instance provided, skipping registration');
      return;
    }
    
    logger.info('📝 Registering with BUMBA framework...');
    
    // Register command handlers
    if (this.bumba.commandHandler) {
      this.registerCommands();
    }
    
    // Register hooks
    if (this.bumba.hookSystem) {
      this.registerHooks();
    }
    
    // Register with executive mode if available
    if (this.bumba.executiveMode) {
      this.bumba.executiveMode.registerSystem('intelligent_agents', {
        pooling: this.poolingSystem,
        routing: this.ttlRouter,
        selection: this.selectionMatrix,
        lifecycle: this.lifecycleSystem,
        getStatus: () => this.getSystemStatus(),
        optimize: () => this.optimizeSystems()
      });
    }
    
    // Store reference in BUMBA
    this.bumba.intelligentAgents = {
      pooling: this.poolingSystem,
      routing: this.ttlRouter,
      selection: this.selectionMatrix,
      lifecycle: this.lifecycleSystem
    };
    
    logger.info('🏁 Registered with BUMBA framework');
  }
  
  /**
   * Register command handlers
   */
  registerCommands() {
    const commands = {
      'pool:status': () => this.poolingSystem.getStatus(),
      'pool:optimize': () => this.poolingSystem.optimizePool(),
      'routing:stats': () => this.ttlRouter.getStatistics(),
      'lifecycle:status': () => this.lifecycleSystem.getStatus(),
      'agents:status': () => this.getSystemStatus()
    };
    
    for (const [cmd, handler] of Object.entries(commands)) {
      this.bumba.commandHandler.registerCommand(cmd, handler);
    }
  }
  
  /**
   * Register hooks
   */
  registerHooks() {
    // Pre-task hook: select best specialist
    this.bumba.hookSystem.register('pre:task:assign', async (task) => {
      const tier = this.ttlRouter.getTierForTTL(task.ttl || 30000);
      const specialists = this.poolingSystem.getActiveSpecialists();
      
      if (specialists.length > 0) {
        const selection = await this.selectionMatrix.select(
          task,
          specialists,
          { tier }
        );
        
        if (selection && selection.decision.specialist) {
          task.assignedSpecialist = selection.decision.specialist;
        }
      }
      
      return task;
    });
    
    // Post-task hook: record completion
    this.bumba.hookSystem.register('post:task:complete', async (result) => {
      this.ttlRouter.recordTaskCompletion({
        task: result.taskId,
        tier: result.tier || 'STANDARD',
        specialist: result.specialist,
        actualDuration: result.duration,
        success: result.success
      });
      
      return result;
    });
  }
  
  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    const status = {
      initialized: this.initialized,
      systems: {
        pooling: this.poolingSystem ? this.poolingSystem.getStatus() : null,
        routing: this.ttlRouter ? this.ttlRouter.getStatistics() : null,
        selection: this.selectionMatrix ? this.selectionMatrix.getStatus() : null,
        lifecycle: this.lifecycleSystem ? this.lifecycleSystem.getStatus() : null
      },
      performance: this.calculatePerformanceMetrics()
    };
    
    return status;
  }
  
  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    if (!this.initialized) return null;
    
    const poolingStatus = this.poolingSystem.getStatus();
    const routingStats = this.ttlRouter.getStatistics();
    const lifecycleStatus = this.lifecycleSystem.getStatus();
    
    return {
      poolEfficiency: poolingStatus.statistics.poolHits / 
                     (poolingStatus.statistics.getRequests || 1),
      routingSuccessRate: routingStats.successRate,
      activeSpecialists: poolingStatus.activeCount,
      totalSpecialists: poolingStatus.totalCount,
      averageTaskDuration: routingStats.averageDuration,
      lifecycleTransitions: lifecycleStatus.statistics.totalTransitions
    };
  }
  
  /**
   * Optimize all systems
   */
  async optimizeSystems() {
    logger.info('🟢️ Optimizing intelligent agent systems...');
    
    const optimizations = [];
    
    // Optimize pooling
    const poolOptimization = await this.poolingSystem.optimizePool();
    optimizations.push({
      system: 'pooling',
      recommendations: poolOptimization.length
    });
    
    // Optimize lifecycle states
    const lifecycleStatus = this.lifecycleSystem.getStatus();
    for (const [state, count] of Object.entries(lifecycleStatus.states)) {
      if (state === 'hibernating' && count > 10) {
        // Wake up some hibernating specialists
        const machines = Array.from(this.lifecycleSystem.stateMachines.values())
          .filter(m => m.getState() === 'hibernating')
          .slice(0, 5);
        
        for (const machine of machines) {
          await this.lifecycleSystem.transitionSpecialist(
            machine.id,
            'cold',
            'optimization:wake'
          );
        }
      }
    }
    
    logger.info('🏁 Optimization complete:', optimizations);
    
    return optimizations;
  }
  
  /**
   * Spawn specialist using intelligent systems
   */
  async spawnSpecialist(requirements) {
    // Determine TTL tier
    const tier = this.ttlRouter.getTierForTTL(requirements.ttl || 30000);
    
    // Get available specialists
    const specialists = this.poolingSystem.getActiveSpecialists();
    
    // Use selection matrix to find best match
    const selection = await this.selectionMatrix.select(
      requirements,
      specialists,
      { tier, urgency: requirements.urgency || 0.5 }
    );
    
    if (selection && selection.decision.specialist) {
      const specialistId = selection.decision.specialist;
      
      // Transition to active state
      await this.lifecycleSystem.transitionSpecialist(
        specialistId,
        'active',
        'spawn:selected'
      );
      
      return this.poolingSystem.pool.get(specialistId);
    }
    
    // No suitable specialist found, create new one
    const newSpecialist = {
      id: `specialist-${Date.now()}`,
      type: requirements.type || 'general',
      department: requirements.department || 'GENERAL',
      skills: requirements.skills || [],
      performance: 0.8
    };
    
    await this.poolingSystem.addSpecialist(newSpecialist);
    
    return newSpecialist;
  }
  
  /**
   * Shutdown all systems
   */
  async shutdown() {
    logger.info('🔴 Shutting down Intelligent Agent Systems...');
    
    const shutdownPromises = [];
    
    if (this.poolingSystem) {
      shutdownPromises.push(this.poolingSystem.shutdown());
    }
    
    if (this.ttlRouter) {
      shutdownPromises.push(this.ttlRouter.shutdown());
    }
    
    if (this.selectionMatrix) {
      shutdownPromises.push(this.selectionMatrix.shutdown());
    }
    
    if (this.lifecycleSystem) {
      shutdownPromises.push(this.lifecycleSystem.shutdown());
    }
    
    await Promise.all(shutdownPromises);
    
    this.initialized = false;
    
    logger.info('🏁 Intelligent Agent Systems shut down successfully');
  }
}

module.exports = { IntelligentAgentInitializer };