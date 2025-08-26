/**
 * BUMBA Orchestration Hook System
 * Mandatory hook-driven updates for Product-Strategist Manager
 * @module orchestration-hooks
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class OrchestrationHookSystem extends EventEmitter {
  constructor() {
    super();
    
    // Hook registry
    this.hooks = new Map();
    
    // Product-Strategist Manager reference
    this.productStrategist = null;
    
    // Statistics
    this.stats = {
      totalHooks: 0,
      mandatoryUpdates: 0,
      failedUpdates: 0
    };
    
    // Define mandatory hooks
    this.defineMandatoryHooks();
    
    logger.info('🪝 Orchestration Hook System initialized');
  }
  
  /**
   * Register a hook
   */
  register(name, config) {
    this.hooks.set(name, config);
    this.stats.totalHooks++;
    return this;
  }
  
  /**
   * Execute a hook
   */
  async execute(name, data) {
    const hook = this.hooks.get(name);
    if (hook && hook.handler) {
      try {
        await hook.handler(data);
        if (hook.mandatory) {
          this.stats.mandatoryUpdates++;
        }
      } catch (error) {
        this.stats.failedUpdates++;
        logger.error(`Hook execution failed for ${name}: ${error.message}`);
      }
    }
    return data;
  }
  
  /**
   * Define all mandatory hooks for orchestration
   */
  defineMandatoryHooks() {
    // Sprint lifecycle hooks
    this.register('sprint:created', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.onSprintCreated(data);
        await this.productStrategist?.updateNotionSprint(data);
      }
    });
    
    this.register('sprint:started', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.onSprintStarted(data);
        await this.productStrategist?.updateNotionProgress(data);
      }
    });
    
    this.register('sprint:completed', {
      mandatory: true, handler: async (data) => {
        logger.info(`🏁 MANDATORY: Sprint ${data.sprintId} completed - updating Notion`);
        await this.productStrategist?.onSprintCompleted(data);
        await this.productStrategist?.updateNotionSprintCompletion(data);
        await this.productStrategist?.checkDependentTasks(data.sprintId);
        await this.productStrategist?.reallocateIfNeeded();
        this.stats.mandatoryUpdates++;
      }
    });
    
    this.register('sprint:failed', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.onSprintFailed(data);
        await this.productStrategist?.updateNotionSprintFailure(data);
        await this.productStrategist?.planRecovery(data);
      }
    });
    
    // Task management hooks
    this.register('task:claimed', {
      mandatory: true, handler: async (data) => {
        logger.info(`🟢 MANDATORY: Task ${data.taskId} claimed by ${data.agentId}`);
        await this.productStrategist?.validateAllocation(data);
        await this.productStrategist?.updateNotionTaskAllocation(data);
        await this.productStrategist?.checkDependencyCompliance(data.taskId);
        this.stats.mandatoryUpdates++;
      }
    });
    
    this.register('task:blocked', {
      mandatory: true, handler: async (data) => {
        logger.warn(`🔴 MANDATORY: Task ${data.taskId} blocked - analyzing`);
        await this.productStrategist?.analyzeBlocker(data);
        await this.productStrategist?.updateNotionBlocker(data);
        await this.productStrategist?.reallocateResources();
        await this.productStrategist?.updateTimeline();
      }
    });
    
    // Milestone hooks
    this.register('milestone:reached', {
      mandatory: true, handler: async (data) => {
        logger.info(`🟢 MANDATORY: Milestone reached - ${data.milestone}`);
        await this.productStrategist?.onMilestoneReached(data);
        await this.productStrategist?.updateNotionMilestone(data);
        await this.productStrategist?.generateProgressReport();
        await this.productStrategist?.planNextPhase();
        this.stats.mandatoryUpdates++;
      }
    });
    
    // Dependency hooks
    this.register('dependency:resolved', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.onDependencyResolved(data);
        await this.productStrategist?.updateNotionDependencies(data);
        await this.productStrategist?.unlockDependentTasks(data);
      }
    });
    
    this.register('dependency:violation', {
      mandatory: true, critical: true, handler: async (data) => {
        logger.error('🔴 CRITICAL: Dependency violation detected!');
        await this.productStrategist?.handleDependencyViolation(data);
        await this.productStrategist?.stopAffectedTasks(data);
        await this.productStrategist?.updateNotionViolation(data);
        await this.productStrategist?.notifyHumanOperator(data);
      }
    });
    
    // Agent coordination hooks
    this.register('agent:available', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.onAgentAvailable(data);
        await this.productStrategist?.allocateWaitingTasks(data.agentId);
      }
    });
    
    this.register('agent:overloaded', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.handleAgentOverload(data);
        await this.productStrategist?.redistributeTasks(data);
      }
    });
    
    // Project lifecycle hooks
    this.register('project:started', {
      mandatory: true, handler: async (data) => {
        logger.info('🟢 MANDATORY: Project started - initializing Notion workspace');
        await this.productStrategist?.initializeProjectWorkspace(data);
        await this.productStrategist?.setupProjectDashboard(data);
        await this.productStrategist?.allocateInitialTasks();
      }
    });
    
    this.register('project:completed', {
      mandatory: true, handler: async (data) => {
        logger.info('🏁 MANDATORY: Project completed - finalizing');
        await this.productStrategist?.finalizeProject(data);
        await this.productStrategist?.generateFinalReport(data);
        await this.productStrategist?.archiveProjectData(data);
      }
    });
    
    // Knowledge management hooks
    this.register('knowledge:created', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.reviewKnowledge(data);
        await this.productStrategist?.categorizeKnowledge(data);
        await this.productStrategist?.updateNotionKnowledge(data);
      }
    });
    
    this.register('knowledge:shared', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.trackKnowledgeSharing(data);
        await this.productStrategist?.updateAgentContext(data);
      }
    });
    
    // Quality assurance hooks
    this.register('quality:check:required', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.scheduleQualityCheck(data);
        await this.productStrategist?.assignReviewer(data);
      }
    });
    
    this.register('quality:check:completed', {
      mandatory: true, handler: async (data) => {
        await this.productStrategist?.processQualityResults(data);
        await this.productStrategist?.updateNotionQuality(data);
        await this.productStrategist?.determineNextSteps(data);
      }
    });
    
    // Periodic update hooks (non-blocking with safe checks)
    this.register('interval:1min', {
      mandatory: false, handler: async () => {
        if (this.productStrategist?.checkProjectHealth) {
          await this.productStrategist.checkProjectHealth();
        }
        if (this.productStrategist?.detectBottlenecks) {
          await this.productStrategist.detectBottlenecks();
        }
      }
    });
    
    this.register('interval:5min', {
      mandatory: false, handler: async () => {
        if (this.productStrategist?.syncNotionDashboard) {
          await this.productStrategist.syncNotionDashboard();
        }
        if (this.productStrategist?.updateDependencyGraph) {
          await this.productStrategist.updateDependencyGraph();
        }
        if (this.productStrategist?.calculateProjectMetrics) {
          await this.productStrategist.calculateProjectMetrics();
        }
      }
    });
    
    this.register('interval:10min', {
      mandatory: false, handler: async () => {
        logger.info('⏰ 10-minute sync initiated');
        if (this.productStrategist?.comprehensiveNotionSync) {
          await this.productStrategist.comprehensiveNotionSync();
        }
        if (this.productStrategist?.generateProgressSnapshot) {
          await this.productStrategist.generateProgressSnapshot();
        }
        if (this.productStrategist?.optimizeResourceAllocation) {
          await this.productStrategist.optimizeResourceAllocation();
        }
        this.stats.mandatoryUpdates++;
      }
    });
    
    // Error recovery hooks
    this.register('error:critical', {
      mandatory: false, critical: true, handler: async (data) => {
        logger.error(`🔴 CRITICAL ERROR: ${data.error}`);
        if (this.productStrategist) {
          await this.productStrategist.handleCriticalError?.(data);
          await this.productStrategist.initiateRecoveryProtocol?.(data);
          await this.productStrategist.notifyAllAgents?.(data);
          await this.productStrategist.updateNotionError?.(data);
        }
      }
    });
    
    this.register('recovery:initiated', {
      mandatory: false, handler: async (data) => {
        if (this.productStrategist) {
          await this.productStrategist.coordinateRecovery?.(data);
          await this.productStrategist.reallocateAffectedTasks?.(data);
        }
      }
    });
  }
  
  /**
   * Connect Product-Strategist Manager
   */
  /**
   * Connect Design-Engineer Manager
   */
  connectDesignEngineer(manager) {
    this.designEngineer = manager;
    logger.info('🏁 Design-Engineer Manager connected to hook system');
  }
  
  /**
   * Connect Backend-Engineer Manager
   */
  connectBackendEngineer(manager) {
    this.backendEngineer = manager;
    logger.info('🏁 Backend-Engineer Manager connected to hook system');
  }
  
  /**
   * Connect Product-Strategist Manager (Supreme Orchestrator)
   */
  connectProductStrategist(manager) {
    this.productStrategist = manager;
    logger.info('🏁 Product-Strategist Manager connected to hook system');
    
    // Verify manager has required methods
    const requiredMethods = [
      'updateNotionProgress',
      'checkDependentTasks',
      'validateAllocation',
      'analyzeBlocker',
      'handleDependencyViolation'
    ];
    
    for (const method of requiredMethods) {
      if (!manager[method]) {
        logger.warn(`🟡 Product-Strategist missing method: ${method}`);
      }
    }
  }
  
  /**
   * Register a hook
   */
  registerHook(event, config) {
    this.hooks.set(event, {
      event,
      mandatory: config.mandatory || false,
      critical: config.critical || false,
      handler: config.handler,
      failureCount: 0
    });
    
    this.stats.totalHooks++;
  }
  
  /**
   * Trigger a hook (MANDATORY execution)
   */
  async trigger(event, data = {}) {
    const hook = this.hooks.get(event);
    
    if (!hook) {
      logger.warn(`Hook not found: ${event}`);
      return false;
    }
    
    if (!this.productStrategist && hook.mandatory) {
      logger.error(`🔴 MANDATORY hook ${event} cannot execute - Product-Strategist not connected`);
      this.stats.failedUpdates++;
      throw new Error(`Mandatory hook ${event} failed - Product-Strategist required`);
    }
    
    try {
      // Add timestamp to data
      data.timestamp = new Date().toISOString();
      data.hookEvent = event;
      
      // Execute handler
      await hook.handler(data);
      
      // Emit event for other listeners
      this.emit(event, data);
      
      return true;
      
    } catch (error) {
      logger.error(`Hook ${event} failed:`, error);
      hook.failureCount++;
      
      if (hook.critical) {
        // Critical hooks must not fail
        throw new Error(`CRITICAL HOOK FAILURE: ${event} - ${error.message}`);
      }
      
      if (hook.mandatory) {
        // Retry mandatory hooks
        await this.retryMandatoryHook(event, data, hook);
      }
      
      this.stats.failedUpdates++;
      return false;
    }
  }
  
  /**
   * Retry mandatory hook
   */
  async retryMandatoryHook(event, data, hook, attempt = 1) {
    const maxRetries = 3;
    
    if (attempt > maxRetries) {
      logger.error(`🔴 Mandatory hook ${event} failed after ${maxRetries} attempts`);
      throw new Error(`Mandatory hook ${event} failed permanently`);
    }
    
    logger.warn(`🟢 Retrying mandatory hook ${event} (attempt ${attempt}/${maxRetries})`);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    
    try {
      await hook.handler(data);
      logger.info(`🏁 Mandatory hook ${event} succeeded on retry ${attempt}`);
    } catch (error) {
      await this.retryMandatoryHook(event, data, hook, attempt + 1);
    }
  }
  
  /**
   * Start periodic hooks
   */
  startPeriodicHooks() {
    // 1-minute interval
    setInterval(() => {
      this.trigger('interval:1min');
    }, 60000);
    
    // 5-minute interval
    setInterval(() => {
      this.trigger('interval:5min');
    }, 300000);
    
    // 10-minute interval
    setInterval(() => {
      this.trigger('interval:10min');
    }, 600000);
    
    logger.info('⏰ Periodic hooks started');
  }
  
  /**
   * Stop periodic hooks
   */
  stopPeriodicHooks() {
    // Clear all intervals
    clearInterval(this.oneMinInterval);
    clearInterval(this.fiveMinInterval);
    clearInterval(this.tenMinInterval);
    
    logger.info('⏰ Periodic hooks stopped');
  }
  
  /**
   * Get hook statistics
   */
  getStats() {
    return {
      ...this.stats,
      connectedManager: !!this.productStrategist,
      mandatoryHooks: Array.from(this.hooks.values())
        .filter(h => h.mandatory).length,
      criticalHooks: Array.from(this.hooks.values())
        .filter(h => h.critical).length
    };
  }
  
  /**
   * Validate hook system health
   */
  validateHealth() {
    const issues = [];
    
    if (!this.productStrategist) {
      issues.push('Product-Strategist Manager not connected');
    }
    
    // Check for failed hooks
    for (const [event, hook] of this.hooks) {
      if (hook.failureCount > 5) {
        issues.push(`Hook ${event} has failed ${hook.failureCount} times`);
      }
    }
    
    // Check mandatory update rate
    const updateRate = this.stats.mandatoryUpdates / (Date.now() / 60000); // per minute
    if (updateRate < 0.1) {
      issues.push('Low mandatory update rate');
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  OrchestrationHookSystem,
  getInstance: () => {
    if (!instance) {
      instance = new OrchestrationHookSystem();
    }
    return instance;
  }
};