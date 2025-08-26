/**
 * BUMBA Agent Deprecation Manager
 * Handles graceful deprecation of agents after work validation
 * Ensures knowledge transfer and resource cleanup
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');
const { StateEvent } = require('../agents/agent-lifecycle-state-machine');

/**
 * Deprecation Reasons
 */
const DeprecationReason = {
  WORK_COMPLETE: 'work_complete',
  VALIDATION_PASSED: 'validation_passed',
  IDLE_TIMEOUT: 'idle_timeout',
  RESOURCE_LIMIT: 'resource_limit',
  ERROR_THRESHOLD: 'error_threshold',
  MANUAL: 'manual',
  SHUTDOWN: 'shutdown'
};

/**
 * Deprecation Strategies
 */
const DeprecationStrategy = {
  IMMEDIATE: 'immediate', // Deprecate right away
  GRACEFUL: 'graceful', // Wait for current tasks
  AFTER_VALIDATION: 'after_validation', // Wait for manager validation
  SCHEDULED: 'scheduled' // Deprecate at scheduled time
};

/**
 * Agent Deprecation Manager
 */
class AgentDeprecationManager extends EventEmitter {
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
      gracefulTimeout: config.gracefulTimeout || 60000, // 1 minute
      validationTimeout: config.validationTimeout || 30000, // 30 seconds
      knowledgeTransfer: config.knowledgeTransfer !== false,
      resourceCleanup: config.resourceCleanup !== false,
      batchDeprecation: config.batchDeprecation !== false,
      maxBatchSize: config.maxBatchSize || 10,
      ...config
    };
    
    // Deprecation tracking
    this.pendingDeprecations = new Map();
    this.deprecationHistory = [];
    this.activeDeprecations = new Map();
    
    // Knowledge store for transfer
    this.knowledgeStore = new Map();
    
    // Statistics
    this.stats = {
      totalDeprecated: 0,
      gracefulDeprecations: 0,
      immediateDeprecations: 0,
      failedDeprecations: 0,
      averageDeprecationTime: 0,
      knowledgeTransfers: 0
    };
    
    // Start batch processor if enabled
    if (this.config.batchDeprecation) {
      this.startBatchProcessor();
    }
    
    // Register deprecation hooks
    this.registerDeprecationHooks();
  }
  
  /**
   * Register deprecation hooks
   */
  registerDeprecationHooks() {
    // Register beforeDeprecation hook
    this.hooks.register('deprecation:before', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 100,
      description: 'Execute before agent deprecation',
      schema: {
        agentId: 'string',
        reason: 'string',
        strategy: 'string',
        metadata: 'object'
      }
    });
    
    // Register overrideDeprecationStrategy hook
    this.hooks.register('deprecation:overrideStrategy', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 75,
      description: 'Override deprecation strategy',
      schema: {
        agentId: 'string',
        originalStrategy: 'string',
        suggestedStrategy: 'string',
        reason: 'string'
      }
    });
    
    // Register preventDeprecation hook
    this.hooks.register('deprecation:prevent', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 100,
      description: 'Prevent agent deprecation',
      schema: {
        agentId: 'string',
        reason: 'string',
        conditions: 'array'
      }
    });
    
    // Register customCleanup hook
    this.hooks.register('deprecation:customCleanup', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Perform custom cleanup during deprecation',
      schema: {
        agentId: 'string',
        resources: 'object',
        cleanupActions: 'array'
      }
    });
    
    // Register afterDeprecation hook
    this.hooks.register('deprecation:after', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute after agent deprecation',
      schema: {
        agentId: 'string',
        success: 'boolean',
        duration: 'number',
        knowledgeTransferred: 'boolean'
      }
    });
    
    logger.info('🏁 Deprecation hooks registered');
  }
  
  /**
   * Schedule agent deprecation
   */
  async scheduleDeprecation(agentId, lifecycle, options = {}) {
    // Execute beforeDeprecation hook
    const beforeContext = await this.hooks.execute('deprecation:before', {
      agentId,
      reason: options.reason || DeprecationReason.WORK_COMPLETE,
      strategy: options.strategy || DeprecationStrategy.GRACEFUL,
      metadata: options.metadata || {}
    });
    
    // Check if hook prevents deprecation
    const preventContext = await this.hooks.execute('deprecation:prevent', {
      agentId,
      reason: 'Hook evaluation',
      conditions: []
    });
    
    if (preventContext.prevent) {
      logger.warn(`🔴 Deprecation prevented for ${agentId}: ${preventContext.reason}`);
      return { success: false, reason: preventContext.reason };
    }
    
    // Check for strategy override
    const strategyContext = await this.hooks.execute('deprecation:overrideStrategy', {
      agentId,
      originalStrategy: options.strategy || DeprecationStrategy.GRACEFUL,
      suggestedStrategy: null,
      reason: ''
    });
    
    const deprecationPlan = {
      agentId,
      lifecycle,
      reason: beforeContext.reason || options.reason || DeprecationReason.WORK_COMPLETE,
      strategy: strategyContext.suggestedStrategy || options.strategy || DeprecationStrategy.GRACEFUL,
      scheduledTime: options.scheduledTime || Date.now(),
      metadata: options.metadata || {},
      priority: options.priority || 5,
      timestamp: Date.now()
    };
    
    logger.info(`🟢 Scheduling deprecation for ${agentId}: ${deprecationPlan.reason}`);
    
    // Store pending deprecation
    this.pendingDeprecations.set(agentId, deprecationPlan);
    
    // Execute based on strategy
    switch (deprecationPlan.strategy) {
      case DeprecationStrategy.IMMEDIATE:
        return this.executeImmediateDeprecation(deprecationPlan);
        
      case DeprecationStrategy.GRACEFUL:
        return this.executeGracefulDeprecation(deprecationPlan);
        
      case DeprecationStrategy.AFTER_VALIDATION:
        return this.executeAfterValidation(deprecationPlan);
        
      case DeprecationStrategy.SCHEDULED:
        return this.scheduleDelayedDeprecation(deprecationPlan);
        
      default:
        return this.executeGracefulDeprecation(deprecationPlan);
    }
  }
  
  /**
   * Execute immediate deprecation
   */
  async executeImmediateDeprecation(plan) {
    const startTime = Date.now();
    
    try {
      logger.info(`🟢 Immediate deprecation of ${plan.agentId}`);
      
      // Mark as active deprecation
      this.activeDeprecations.set(plan.agentId, {
        plan,
        startTime,
        status: 'processing'
      });
      
      // Skip knowledge transfer for immediate
      
      // Cleanup resources
      if (this.config.resourceCleanup) {
        await this.cleanupResources(plan.agentId);
      }
      
      // Transition to deprecating state
      await plan.lifecycle.transition(StateEvent.DEPRECATE, {
        reason: plan.reason,
        immediate: true
      });
      
      // Complete deprecation
      await this.completeDeprecation(plan.agentId, startTime);
      
      this.stats.immediateDeprecations++;
      
      return { success: true, duration: Date.now() - startTime };
      
    } catch (error) {
      logger.error(`🔴 Immediate deprecation failed for ${plan.agentId}: ${error.message}`);
      this.stats.failedDeprecations++;
      
      // Force deprecation on error
      await this.forceDeprecation(plan.agentId, plan.lifecycle);
      
      throw error;
    }
  }
  
  /**
   * Execute graceful deprecation
   */
  async executeGracefulDeprecation(plan) {
    const startTime = Date.now();
    
    try {
      logger.info(`🟢️ Graceful deprecation of ${plan.agentId}`);
      
      // Mark as active deprecation
      this.activeDeprecations.set(plan.agentId, {
        plan,
        startTime,
        status: 'waiting'
      });
      
      // Wait for current tasks to complete
      const tasksCompleted = await this.waitForTaskCompletion(
        plan.agentId, 
        plan.lifecycle,
        this.config.gracefulTimeout
      );
      
      if (!tasksCompleted) {
        logger.warn(`🟡 Tasks didn't complete in time for ${plan.agentId}, forcing deprecation`);
      }
      
      // Transfer knowledge if enabled
      if (this.config.knowledgeTransfer) {
        await this.transferKnowledge(plan);
      }
      
      // Cleanup resources
      if (this.config.resourceCleanup) {
        await this.cleanupResources(plan.agentId);
      }
      
      // Transition to deprecating state
      await plan.lifecycle.transition(StateEvent.DEPRECATE, {
        reason: plan.reason,
        graceful: true
      });
      
      // Complete deprecation
      await this.completeDeprecation(plan.agentId, startTime);
      
      this.stats.gracefulDeprecations++;
      
      return { success: true, duration: Date.now() - startTime };
      
    } catch (error) {
      logger.error(`🔴 Graceful deprecation failed for ${plan.agentId}: ${error.message}`);
      this.stats.failedDeprecations++;
      
      // Force deprecation on error
      await this.forceDeprecation(plan.agentId, plan.lifecycle);
      
      throw error;
    }
  }
  
  /**
   * Execute deprecation after validation
   */
  async executeAfterValidation(plan) {
    const startTime = Date.now();
    
    try {
      logger.info(`🏁 Deprecation after validation for ${plan.agentId}`);
      
      // Mark as active deprecation
      this.activeDeprecations.set(plan.agentId, {
        plan,
        startTime,
        status: 'validating'
      });
      
      // Wait for validation to complete
      const validationResult = await this.waitForValidation(
        plan.agentId,
        plan.lifecycle,
        this.config.validationTimeout
      );
      
      if (!validationResult.validated) {
        logger.warn(`🟡 Validation incomplete for ${plan.agentId}`);
        
        // Update reason
        plan.reason = DeprecationReason.IDLE_TIMEOUT;
      }
      
      // Transfer knowledge including validation results
      if (this.config.knowledgeTransfer) {
        plan.metadata.validationResult = validationResult;
        await this.transferKnowledge(plan);
      }
      
      // Cleanup resources
      if (this.config.resourceCleanup) {
        await this.cleanupResources(plan.agentId);
      }
      
      // Transition to deprecating state
      await plan.lifecycle.transition(StateEvent.DEPRECATE, {
        reason: plan.reason,
        afterValidation: true,
        validationResult
      });
      
      // Complete deprecation
      await this.completeDeprecation(plan.agentId, startTime);
      
      return { success: true, duration: Date.now() - startTime };
      
    } catch (error) {
      logger.error(`🔴 After-validation deprecation failed for ${plan.agentId}: ${error.message}`);
      this.stats.failedDeprecations++;
      
      // Force deprecation on error
      await this.forceDeprecation(plan.agentId, plan.lifecycle);
      
      throw error;
    }
  }
  
  /**
   * Schedule delayed deprecation
   */
  async scheduleDelayedDeprecation(plan) {
    const delay = Math.max(0, plan.scheduledTime - Date.now());
    
    logger.info(`⏰ Scheduling deprecation of ${plan.agentId} in ${delay}ms`);
    
    setTimeout(async () => {
      await this.executeGracefulDeprecation(plan);
    }, delay);
    
    return { scheduled: true, delay };
  }
  
  /**
   * Wait for task completion
   */
  async waitForTaskCompletion(agentId, lifecycle, timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const metadata = lifecycle.getMetadata();
      
      // Check if agent has active tasks
      if (!metadata.taskCount || metadata.taskCount === 0) {
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }
  
  /**
   * Wait for validation
   */
  async waitForValidation(agentId, lifecycle, timeout) {
    const startTime = Date.now();
    
    // Transition to validating state
    try {
      await lifecycle.transition(StateEvent.VALIDATE, {
        awaitingValidation: true
      });
    } catch (error) {
      // Already in validation or can't transition
    }
    
    while (Date.now() - startTime < timeout) {
      const state = lifecycle.getState();
      const metadata = lifecycle.getMetadata();
      
      // Check if validation completed
      if (metadata.validationComplete) {
        return {
          validated: true,
          result: metadata.validationResult,
          duration: Date.now() - startTime
        };
      }
      
      // Check if state changed (validation might have failed)
      if (state !== 'validating') {
        return {
          validated: false,
          reason: 'state_changed',
          duration: Date.now() - startTime
        };
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return {
      validated: false,
      reason: 'timeout',
      duration: timeout
    };
  }
  
  /**
   * Transfer knowledge from deprecated agent
   */
  async transferKnowledge(plan) {
    const { agentId, lifecycle, metadata } = plan;
    
    logger.info(`🟢 Transferring knowledge from ${agentId}`);
    
    const knowledge = {
      agentId,
      timestamp: Date.now(),
      reason: plan.reason,
      statistics: lifecycle.getStatistics(),
      history: lifecycle.getHistory(),
      metadata: lifecycle.getMetadata(),
      customData: metadata
    };
    
    // Store knowledge
    this.knowledgeStore.set(agentId, knowledge);
    
    // Emit knowledge transfer event
    this.emit('knowledge:transferred', {
      agentId,
      knowledge,
      size: JSON.stringify(knowledge).length
    });
    
    this.stats.knowledgeTransfers++;
    
    return knowledge;
  }
  
  /**
   * Cleanup resources
   */
  async cleanupResources(agentId) {
    logger.info(`🟢 Cleaning up resources for ${agentId}`);
    
    // Release any held locks
    // This would integrate with ClaudeMaxAccountManager
    
    // Clear any cached data
    
    // Close any open connections
    
    // Emit cleanup event
    this.emit('resources:cleaned', { agentId });
    
    return true;
  }
  
  /**
   * Complete deprecation
   */
  async completeDeprecation(agentId, startTime) {
    const activeDep = this.activeDeprecations.get(agentId);
    
    if (activeDep) {
      activeDep.status = 'completed';
      activeDep.completedAt = Date.now();
      activeDep.duration = Date.now() - startTime;
    }
    
    // Move to history
    if (this.pendingDeprecations.has(agentId)) {
      const plan = this.pendingDeprecations.get(agentId);
      this.deprecationHistory.push({
        ...plan,
        completedAt: Date.now(),
        duration: Date.now() - startTime
      });
      
      this.pendingDeprecations.delete(agentId);
    }
    
    // Remove from active
    this.activeDeprecations.delete(agentId);
    
    // Update statistics
    this.stats.totalDeprecated++;
    this.updateAverageDeprecationTime(Date.now() - startTime);
    
    // Emit completion event
    this.emit('deprecation:complete', {
      agentId,
      duration: Date.now() - startTime
    });
    
    logger.info(`🏁 Deprecation complete for ${agentId} (${Date.now() - startTime}ms)`);
  }
  
  /**
   * Force deprecation
   */
  async forceDeprecation(agentId, lifecycle) {
    logger.warn(`🟡 Force deprecating ${agentId}`);
    
    try {
      await lifecycle.forceDeprecate('forced');
    } catch (error) {
      logger.error(`🔴 Force deprecation failed: ${error.message}`);
    }
    
    // Clean up tracking
    this.pendingDeprecations.delete(agentId);
    this.activeDeprecations.delete(agentId);
  }
  
  /**
   * Batch deprecation processor
   */
  startBatchProcessor() {
    setInterval(async () => {
      const batch = this.getBatchForDeprecation();
      
      if (batch.length > 0) {
        logger.info(`🟢 Processing batch deprecation of ${batch.length} agents`);
        
        const promises = batch.map(plan => 
          this.executeGracefulDeprecation(plan)
        );
        
        await Promise.allSettled(promises);
      }
    }, 5000); // Process every 5 seconds
  }
  
  /**
   * Get batch for deprecation
   */
  getBatchForDeprecation() {
    const batch = [];
    const now = Date.now();
    
    for (const [agentId, plan] of this.pendingDeprecations) {
      // Skip if already being deprecated
      if (this.activeDeprecations.has(agentId)) {continue;}
      
      // Check if scheduled time has passed
      if (plan.strategy === DeprecationStrategy.SCHEDULED && 
          plan.scheduledTime > now) {
        continue;
      }
      
      // Add to batch
      batch.push(plan);
      
      // Limit batch size
      if (batch.length >= this.config.maxBatchSize) {break;}
    }
    
    return batch;
  }
  
  /**
   * Update average deprecation time
   */
  updateAverageDeprecationTime(duration) {
    const total = this.stats.totalDeprecated;
    const current = this.stats.averageDeprecationTime;
    
    this.stats.averageDeprecationTime = 
      (current * (total - 1) + duration) / total;
  }
  
  /**
   * Cancel deprecation
   */
  cancelDeprecation(agentId) {
    if (this.pendingDeprecations.has(agentId)) {
      this.pendingDeprecations.delete(agentId);
      logger.info(`🔴 Cancelled deprecation for ${agentId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Get deprecation status
   */
  getDeprecationStatus(agentId) {
    if (this.activeDeprecations.has(agentId)) {
      return this.activeDeprecations.get(agentId);
    }
    
    if (this.pendingDeprecations.has(agentId)) {
      return {
        status: 'pending',
        plan: this.pendingDeprecations.get(agentId)
      };
    }
    
    // Check history
    const historical = this.deprecationHistory.find(h => h.agentId === agentId);
    if (historical) {
      return {
        status: 'completed',
        history: historical
      };
    }
    
    return null;
  }
  
  /**
   * Get knowledge for agent
   */
  getKnowledge(agentId) {
    return this.knowledgeStore.get(agentId);
  }
  
  /**
   * Get all knowledge
   */
  getAllKnowledge() {
    return Array.from(this.knowledgeStore.entries()).map(([id, knowledge]) => ({
      agentId: id,
      ...knowledge
    }));
  }
  
  /**
   * Clear knowledge store
   */
  clearKnowledge() {
    const size = this.knowledgeStore.size;
    this.knowledgeStore.clear();
    logger.info(`🟢️ Cleared knowledge store (${size} entries)`);
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      pendingDeprecations: this.pendingDeprecations.size,
      activeDeprecations: this.activeDeprecations.size,
      knowledgeStoreSize: this.knowledgeStore.size,
      historySize: this.deprecationHistory.length
    };
  }
  
  /**
   * Get deprecation history
   */
  getHistory(limit = 100) {
    return this.deprecationHistory.slice(-limit);
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    const size = this.deprecationHistory.length;
    this.deprecationHistory = [];
    logger.info(`🟢️ Cleared deprecation history (${size} entries)`);
  }
}

// Export
module.exports = {
  AgentDeprecationManager,
  DeprecationReason,
  DeprecationStrategy
};