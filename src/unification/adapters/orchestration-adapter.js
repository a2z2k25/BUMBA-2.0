/**
 * Orchestration Adapter
 * Coordinates multiple orchestrators without modifying them
 * Part of Sprint 2: Safe Unification
 */

const { EventEmitter } = require('events');
const { logger } = require('../../core/logging/bumba-logger');

class OrchestrationAdapter extends EventEmitter {
  constructor() {
    super();
    
    // Track existing orchestrators WITHOUT modifying them
    this.orchestrators = new Map();
    this.adapterVersion = '1.0.0';
    this.enabled = false; // Start disabled for safety
    
    // Unified orchestration interface (doesn't affect originals)
    this.unifiedQueue = [];
    this.executionOrder = [];
    this.coordinationRules = new Map();
    
    // Metrics for monitoring
    this.metrics = {
      tasksCoordinated: 0,
      orchestratorsConnected: 0,
      conflictsResolved: 0,
      executionsCombined: 0
    };
    
    logger.info('🔴 OrchestrationAdapter created (disabled by default)');
  }
  
  /**
   * Enable adapter
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    logger.info('🏁 OrchestrationAdapter enabled');
    this.emit('adapter:enabled');
  }
  
  /**
   * Disable adapter
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.removeAllListeners();
    logger.info('🔌 OrchestrationAdapter disabled');
    this.emit('adapter:disabled');
  }
  
  /**
   * Register an existing orchestrator WITHOUT modifying it
   */
  registerOrchestrator(name, orchestrator, priority = 10) {
    if (!orchestrator) {
      logger.warn(`Cannot register null orchestrator: ${name}`);
      return false;
    }
    
    // Store reference without modification
    this.orchestrators.set(name, {
      instance: orchestrator,
      priority,
      registered: Date.now(),
      callCount: 0
    });
    
    // Listen to events if orchestrator is EventEmitter
    if (this.enabled && orchestrator.on && typeof orchestrator.on === 'function') {
      this.attachOrchestratorListeners(name, orchestrator);
    }
    
    this.metrics.orchestratorsConnected++;
    logger.info(`🔗 Registered orchestrator: ${name} (priority: ${priority})`);
    
    return true;
  }
  
  /**
   * Attach listeners to orchestrator WITHOUT modifying it
   */
  attachOrchestratorListeners(name, orchestrator) {
    // Listen to common orchestrator events
    const events = ['task:created', 'task:complete', 'wave:start', 'wave:complete'];
    
    events.forEach(eventName => {
      orchestrator.on(eventName, (data) => {
        if (this.enabled) {
          this.handleOrchestratorEvent(name, eventName, data);
        }
      });
    });
  }
  
  /**
   * Handle events from wrapped orchestrators
   */
  handleOrchestratorEvent(orchestratorName, eventName, data) {
    // Track event for coordination
    this.emit('unified:orchestrator:event', {
      orchestrator: orchestratorName,
      event: eventName,
      data,
      timestamp: Date.now()
    });
    
    // Check for coordination opportunities
    if (eventName === 'task:created') {
      this.coordinateTask(orchestratorName, data);
    }
  }
  
  /**
   * Coordinate task across orchestrators
   */
  async coordinateTask(initiator, task) {
    if (!this.enabled) return task;
    
    // Check if other orchestrators should be involved
    const involvedOrchestrators = this.determineInvolvement(task);
    
    if (involvedOrchestrators.length > 1) {
      this.metrics.tasksCoordinated++;
      
      // Create coordination plan
      const plan = this.createCoordinationPlan(involvedOrchestrators, task);
      
      // Execute through each orchestrator in order
      for (const step of plan) {
        const orchestratorData = this.orchestrators.get(step.orchestrator);
        if (orchestratorData && orchestratorData.instance.execute) {
          await orchestratorData.instance.execute(step.subtask);
          orchestratorData.callCount++;
        }
      }
      
      this.emit('unified:task:coordinated', {
        initiator,
        task,
        orchestrators: involvedOrchestrators,
        plan
      });
    }
    
    return task;
  }
  
  /**
   * Determine which orchestrators should handle a task
   */
  determineInvolvement(task) {
    const involved = [];
    
    // Check each orchestrator's capabilities
    for (const [name, data] of this.orchestrators) {
      if (this.orchestratorCanHandle(data.instance, task)) {
        involved.push({
          name,
          priority: data.priority
        });
      }
    }
    
    // Sort by priority
    involved.sort((a, b) => a.priority - b.priority);
    
    return involved.map(o => o.name);
  }
  
  /**
   * Check if orchestrator can handle task
   */
  orchestratorCanHandle(orchestrator, task) {
    // Check for common capability methods
    if (orchestrator.canHandle && typeof orchestrator.canHandle === 'function') {
      return orchestrator.canHandle(task);
    }
    
    // Check for task type matching
    if (orchestrator.supportedTypes && Array.isArray(orchestrator.supportedTypes)) {
      return orchestrator.supportedTypes.includes(task.type);
    }
    
    // Default: assume it can handle if no specific checks
    return true;
  }
  
  /**
   * Create coordination plan for multiple orchestrators
   */
  createCoordinationPlan(orchestrators, task) {
    const plan = [];
    
    // Simple strategy: divide task among orchestrators
    orchestrators.forEach((name, index) => {
      plan.push({
        orchestrator: name,
        subtask: {
          ...task,
          phase: `phase_${index + 1}`,
          orchestratorIndex: index,
          totalOrchestrators: orchestrators.length
        }
      });
    });
    
    return plan;
  }
  
  /**
   * Execute unified orchestration (combines all orchestrators)
   */
  async executeUnified(task, options = {}) {
    if (!this.enabled) {
      logger.warn('OrchestrationAdapter disabled - using fallback');
      // Fallback to first available orchestrator
      const first = this.orchestrators.values().next().value;
      if (first && first.instance.execute) {
        return await first.instance.execute(task, options);
      }
      return null;
    }
    
    // Coordinate across all orchestrators
    const result = await this.coordinateTask('unified', task);
    
    this.metrics.executionsCombined++;
    
    return result;
  }
  
  /**
   * Resolve conflicts between orchestrators
   */
  resolveConflict(orchestrator1, orchestrator2, conflict) {
    this.metrics.conflictsResolved++;
    
    // Simple priority-based resolution
    const o1 = this.orchestrators.get(orchestrator1);
    const o2 = this.orchestrators.get(orchestrator2);
    
    if (!o1 || !o2) return null;
    
    // Lower priority number wins
    const winner = o1.priority < o2.priority ? orchestrator1 : orchestrator2;
    
    this.emit('unified:conflict:resolved', {
      orchestrators: [orchestrator1, orchestrator2],
      conflict,
      winner,
      timestamp: Date.now()
    });
    
    return winner;
  }
  
  /**
   * Get unified metrics
   */
  getMetrics() {
    return {
      enabled: this.enabled,
      ...this.metrics,
      orchestrators: Array.from(this.orchestrators.keys()),
      queueLength: this.unifiedQueue.length
    };
  }
  
  /**
   * Add coordination rule
   */
  addCoordinationRule(rule) {
    if (!rule.id || !rule.condition || !rule.action) {
      logger.warn('Invalid coordination rule');
      return false;
    }
    
    this.coordinationRules.set(rule.id, rule);
    logger.info(`📋 Added coordination rule: ${rule.id}`);
    return true;
  }
  
  /**
   * Get orchestrator status
   */
  getOrchestratorStatus(name) {
    const data = this.orchestrators.get(name);
    if (!data) return null;
    
    return {
      name,
      priority: data.priority,
      registered: data.registered,
      callCount: data.callCount,
      healthy: this.checkOrchestratorHealth(data.instance)
    };
  }
  
  /**
   * Check orchestrator health
   */
  checkOrchestratorHealth(orchestrator) {
    // Check for common health methods
    if (orchestrator.isHealthy && typeof orchestrator.isHealthy === 'function') {
      return orchestrator.isHealthy();
    }
    
    if (orchestrator.getStatus && typeof orchestrator.getStatus === 'function') {
      const status = orchestrator.getStatus();
      return status && status.healthy;
    }
    
    // Default: assume healthy if exists
    return orchestrator !== null && orchestrator !== undefined;
  }
  
  /**
   * Rollback adapter
   */
  rollback() {
    this.disable();
    this.orchestrators.clear();
    this.unifiedQueue = [];
    this.executionOrder = [];
    this.coordinationRules.clear();
    this.metrics = {
      tasksCoordinated: 0,
      orchestratorsConnected: 0,
      conflictsResolved: 0,
      executionsCombined: 0
    };
    
    logger.info('↩️ OrchestrationAdapter rolled back');
  }
  
  /**
   * Health check
   */
  isHealthy() {
    const orchestratorHealth = {};
    for (const [name, data] of this.orchestrators) {
      orchestratorHealth[name] = this.checkOrchestratorHealth(data.instance);
    }
    
    return {
      adapterHealthy: true,
      enabled: this.enabled,
      orchestratorCount: this.orchestrators.size,
      orchestratorHealth,
      queueHealth: this.unifiedQueue.length < 1000 // Prevent queue overflow
    };
  }
}

module.exports = OrchestrationAdapter;