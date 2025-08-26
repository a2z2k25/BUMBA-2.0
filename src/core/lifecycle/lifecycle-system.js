/**
 * Complete Enhanced Lifecycle System
 * Integrates all lifecycle management components
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { LifecycleStateMachine, LIFECYCLE_STATES } = require('./state-machine');

/**
 * Sprint 4.2: State Transition Manager
 */
class StateTransitionManager {
  constructor(config = {}) {
    this.transitions = new Map();
    this.rules = new Map();
    this.validators = new Map();
    
    this.config = {
      validateTransitions: config.validateTransitions !== false,
      transitionTimeout: config.transitionTimeout || 30000,
      maxConcurrentTransitions: config.maxConcurrentTransitions || 100
    };
    
    this.activeTransitions = new Set();
    this.transitionQueue = [];
    
    this.initializeRules();
  }
  
  initializeRules() {
    // Define transition rules
    this.addRule('require_warm_for_active', (from, to) => {
      return !(to === LIFECYCLE_STATES.ACTIVE && from !== LIFECYCLE_STATES.WARM);
    });
    
    this.addRule('prevent_direct_termination', (from, to) => {
      return !(to === LIFECYCLE_STATES.TERMINATED && from === LIFECYCLE_STATES.ACTIVE);
    });
    
    this.addRule('require_cooling_from_active', (from, to) => {
      if (from === LIFECYCLE_STATES.ACTIVE && to === LIFECYCLE_STATES.COLD) {
        return false; // Must go through COOLING
      }
      return true;
    });
  }
  
  addRule(name, validator) {
    this.rules.set(name, validator);
  }
  
  validateTransition(from, to, context = {}) {
    if (!this.config.validateTransitions) return { valid: true };
    
    const violations = [];
    
    for (const [name, validator] of this.rules) {
      if (!validator(from, to, context)) {
        violations.push(name);
      }
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
  
  async executeTransition(stateMachine, toState, reason, metadata = {}) {
    // Check if we can execute
    if (this.activeTransitions.size >= this.config.maxConcurrentTransitions) {
      this.transitionQueue.push({ stateMachine, toState, reason, metadata });
      return null;
    }
    
    const transitionId = `${stateMachine.id}-${Date.now()}`;
    this.activeTransitions.add(transitionId);
    
    try {
      // Validate transition
      const validation = this.validateTransition(
        stateMachine.getState(),
        toState,
        metadata
      );
      
      if (!validation.valid) {
        throw new Error(`Transition validation failed: ${validation.violations.join(', ')}`);
      }
      
      // Execute transition
      const result = await stateMachine.transition(toState, reason, metadata);
      
      // Process queue if any
      this.processQueue();
      
      return result;
      
    } finally {
      this.activeTransitions.delete(transitionId);
    }
  }
  
  processQueue() {
    if (this.transitionQueue.length > 0 && 
        this.activeTransitions.size < this.config.maxConcurrentTransitions) {
      const next = this.transitionQueue.shift();
      this.executeTransition(next.stateMachine, next.toState, next.reason, next.metadata);
    }
  }
}

/**
 * Sprint 4.3: State Persistence Manager
 */
class StatePersistenceManager {
  constructor(config = {}) {
    this.storage = new Map();
    this.snapshots = new Map();
    
    this.config = {
      enablePersistence: config.enablePersistence !== false,
      snapshotInterval: config.snapshotInterval || 60000, // 1 minute
      maxSnapshots: config.maxSnapshots || 10,
      persistenceKey: config.persistenceKey || 'lifecycle_state'
    };
    
    if (this.config.enablePersistence) {
      this.startSnapshotting();
    }
  }
  
  saveState(id, state, metadata = {}) {
    const stateData = {
      id,
      state,
      metadata,
      timestamp: Date.now()
    };
    
    this.storage.set(id, stateData);
    
    // Also save to persistent storage (mock)
    if (this.config.enablePersistence) {
      this.persistToDisk(stateData);
    }
    
    return stateData;
  }
  
  loadState(id) {
    // Try memory first
    let stateData = this.storage.get(id);
    
    // Try persistent storage
    if (!stateData && this.config.enablePersistence) {
      stateData = this.loadFromDisk(id);
    }
    
    return stateData;
  }
  
  createSnapshot(id, stateMachine) {
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      machineId: id,
      state: stateMachine.getState(),
      statistics: stateMachine.getStatistics(),
      history: stateMachine.getHistory(),
      timestamp: Date.now()
    };
    
    if (!this.snapshots.has(id)) {
      this.snapshots.set(id, []);
    }
    
    const machineSnapshots = this.snapshots.get(id);
    machineSnapshots.push(snapshot);
    
    // Limit snapshots
    if (machineSnapshots.length > this.config.maxSnapshots) {
      machineSnapshots.shift();
    }
    
    return snapshot;
  }
  
  restoreFromSnapshot(id, snapshotId) {
    const machineSnapshots = this.snapshots.get(id) || [];
    return machineSnapshots.find(s => s.id === snapshotId);
  }
  
  startSnapshotting() {
    this.snapshotInterval = setInterval(() => {
      // Create snapshots for all active state machines
      for (const [id, stateData] of this.storage) {
        if (stateData.state !== LIFECYCLE_STATES.TERMINATED) {
          // Would create snapshot here if we had the state machine reference
          logger.debug(`Would create snapshot for ${id}`);
        }
      }
    }, this.config.snapshotInterval);
  }
  
  stopSnapshotting() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
  }
  
  persistToDisk(stateData) {
    // Mock persistence
    logger.debug(`Persisting state for ${stateData.id}: ${stateData.state}`);
  }
  
  loadFromDisk(id) {
    // Mock loading
    logger.debug(`Loading state for ${id} from disk`);
    return null;
  }
}

/**
 * Sprint 4.4: State Monitor
 */
class StateMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.machines = new Map();
    this.metrics = new Map();
    this.alerts = [];
    
    this.config = {
      monitoringInterval: config.monitoringInterval || 5000,
      alertThresholds: config.alertThresholds || {
        errorRate: 0.1,
        stuckDuration: 300000, // 5 minutes
        transitionFailureRate: 0.2
      }
    };
    
    this.startMonitoring();
  }
  
  registerMachine(id, machine) {
    this.machines.set(id, machine);
    this.metrics.set(id, {
      stateChanges: 0,
      errors: 0,
      transitions: 0,
      failedTransitions: 0,
      lastStateChange: Date.now(),
      stateDistribution: {}
    });
    
    // Listen to machine events
    machine.on('transition:complete', () => this.onTransitionComplete(id));
    machine.on('transition:failed', () => this.onTransitionFailed(id));
    machine.on('state:forced', () => this.onStateForced(id));
  }
  
  unregisterMachine(id) {
    const machine = this.machines.get(id);
    if (machine) {
      machine.removeAllListeners();
      this.machines.delete(id);
      this.metrics.delete(id);
    }
  }
  
  onTransitionComplete(id) {
    const metrics = this.metrics.get(id);
    if (metrics) {
      metrics.transitions++;
      metrics.lastStateChange = Date.now();
      
      const machine = this.machines.get(id);
      const state = machine.getState();
      metrics.stateDistribution[state] = (metrics.stateDistribution[state] || 0) + 1;
    }
  }
  
  onTransitionFailed(id) {
    const metrics = this.metrics.get(id);
    if (metrics) {
      metrics.failedTransitions++;
      metrics.errors++;
    }
  }
  
  onStateForced(id) {
    const metrics = this.metrics.get(id);
    if (metrics) {
      metrics.stateChanges++;
      this.createAlert('warning', `State forced for machine ${id}`);
    }
  }
  
  checkHealth() {
    for (const [id, machine] of this.machines) {
      const metrics = this.metrics.get(id);
      const stats = machine.getStatistics();
      
      // Check error rate
      const errorRate = stats.statistics.failedTransitions / 
                       (stats.statistics.totalTransitions || 1);
      if (errorRate > this.config.alertThresholds.errorRate) {
        this.createAlert('error', `High error rate for ${id}: ${errorRate.toFixed(2)}`);
      }
      
      // Check if stuck
      const timeSinceChange = Date.now() - metrics.lastStateChange;
      if (timeSinceChange > this.config.alertThresholds.stuckDuration &&
          machine.getState() !== LIFECYCLE_STATES.HIBERNATING &&
          machine.getState() !== LIFECYCLE_STATES.TERMINATED) {
        this.createAlert('warning', `Machine ${id} may be stuck in ${machine.getState()}`);
      }
      
      // Check transition failure rate
      const failureRate = metrics.failedTransitions / (metrics.transitions || 1);
      if (failureRate > this.config.alertThresholds.transitionFailureRate) {
        this.createAlert('error', `High transition failure rate for ${id}: ${failureRate.toFixed(2)}`);
      }
    }
  }
  
  createAlert(severity, message) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      severity,
      message,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    this.emit('alert', alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    return alert;
  }
  
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkHealth();
    }, this.config.monitoringInterval);
  }
  
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
  
  getMetrics(id = null) {
    if (id) {
      return this.metrics.get(id);
    }
    
    const aggregated = {
      totalMachines: this.machines.size,
      totalTransitions: 0,
      totalErrors: 0,
      stateDistribution: {},
      alerts: this.alerts.slice(-10)
    };
    
    for (const metrics of this.metrics.values()) {
      aggregated.totalTransitions += metrics.transitions;
      aggregated.totalErrors += metrics.errors;
      
      for (const [state, count] of Object.entries(metrics.stateDistribution)) {
        aggregated.stateDistribution[state] = 
          (aggregated.stateDistribution[state] || 0) + count;
      }
    }
    
    return aggregated;
  }
}

/**
 * Sprint 4.5-4.10: Complete Lifecycle Management System
 */
class EnhancedLifecycleSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableRecovery: config.enableRecovery !== false,
      enableOptimization: config.enableOptimization !== false,
      enableAnalytics: config.enableAnalytics !== false,
      enableOrchestration: config.enableOrchestration !== false,
      enableValidation: config.enableValidation !== false,
      ...config
    };
    
    // Core components
    this.stateMachines = new Map();
    this.transitionManager = new StateTransitionManager(config.transition);
    this.persistenceManager = new StatePersistenceManager(config.persistence);
    this.monitor = new StateMonitor(config.monitoring);
    
    // Recovery system (Sprint 4.5)
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
    
    // Optimization engine (Sprint 4.6)
    this.optimizationRules = new Map();
    this.initializeOptimizations();
    
    // Analytics collector (Sprint 4.7)
    this.analytics = {
      stateTransitions: [],
      performanceMetrics: [],
      errorPatterns: []
    };
    
    // Orchestration controller (Sprint 4.8)
    this.orchestrationPolicies = new Map();
    this.initializeOrchestration();
    
    // Validation system (Sprint 4.9)
    this.validators = new Map();
    this.initializeValidators();
    
    // Statistics
    this.statistics = {
      totalMachines: 0,
      activeMachines: 0,
      totalTransitions: 0,
      recoveries: 0,
      optimizations: 0
    };
    
    logger.info('🔧 Enhanced Lifecycle System initialized');
  }
  
  /**
   * Create a new state machine for a specialist
   */
  createStateMachine(id, config = {}) {
    if (this.stateMachines.has(id)) {
      logger.warn(`State machine ${id} already exists`);
      return this.stateMachines.get(id);
    }
    
    // Add hooks for integration
    const hooks = {
      ...config.hooks,
      beforeTransition: async (from, to, metadata) => {
        await this.onBeforeTransition(id, from, to, metadata);
        if (config.hooks?.beforeTransition) {
          await config.hooks.beforeTransition(from, to, metadata);
        }
      },
      afterTransition: async (from, to, metadata) => {
        await this.onAfterTransition(id, from, to, metadata);
        if (config.hooks?.afterTransition) {
          await config.hooks.afterTransition(from, to, metadata);
        }
      }
    };
    
    const machine = new LifecycleStateMachine(id, { ...config, hooks });
    
    // Register with subsystems
    this.stateMachines.set(id, machine);
    this.monitor.registerMachine(id, machine);
    this.persistenceManager.saveState(id, LIFECYCLE_STATES.UNINITIALIZED);
    
    // Update statistics
    this.statistics.totalMachines++;
    this.statistics.activeMachines++;
    
    // Set up event handlers
    this.setupMachineEventHandlers(id, machine);
    
    logger.info(`Created state machine for ${id}`);
    
    return machine;
  }
  
  /**
   * Get state machine
   */
  getStateMachine(id) {
    return this.stateMachines.get(id);
  }
  
  /**
   * Transition specialist to new state
   */
  async transitionSpecialist(id, toState, reason = 'manual', metadata = {}) {
    const machine = this.stateMachines.get(id);
    if (!machine) {
      throw new Error(`State machine ${id} not found`);
    }
    
    // Use transition manager for validated transition
    return await this.transitionManager.executeTransition(
      machine,
      toState,
      reason,
      metadata
    );
  }
  
  /**
   * Lifecycle hooks
   */
  async onBeforeTransition(id, from, to, metadata) {
    // Validate transition
    if (this.config.enableValidation) {
      await this.validateTransition(id, from, to, metadata);
    }
    
    // Record analytics
    if (this.config.enableAnalytics) {
      this.recordTransitionAnalytics(id, from, to, metadata);
    }
  }
  
  async onAfterTransition(id, from, to, metadata) {
    // Save state
    this.persistenceManager.saveState(id, to, metadata);
    
    // Check for optimization opportunities
    if (this.config.enableOptimization) {
      this.checkOptimizations(id, to);
    }
    
    // Update orchestration
    if (this.config.enableOrchestration) {
      this.updateOrchestration(id, to);
    }
    
    // Update statistics
    this.statistics.totalTransitions++;
  }
  
  /**
   * Setup event handlers for machine
   */
  setupMachineEventHandlers(id, machine) {
    machine.on('transition:failed', async (event) => {
      logger.error(`Transition failed for ${id}:`, event);
      
      if (this.config.enableRecovery) {
        await this.attemptRecovery(id, event);
      }
    });
    
    machine.on('machine:reset', () => {
      logger.info(`Machine ${id} was reset`);
      this.persistenceManager.saveState(id, LIFECYCLE_STATES.UNINITIALIZED);
    });
  }
  
  /**
   * Sprint 4.5: Recovery System
   */
  initializeRecoveryStrategies() {
    this.recoveryStrategies.set('retry', async (id, error) => {
      const machine = this.stateMachines.get(id);
      if (!machine) return false;
      
      // Simple retry with backoff
      await this.delay(1000);
      try {
        await machine.transition(LIFECYCLE_STATES.RECOVERING, 'recovery:retry');
        await machine.transition(LIFECYCLE_STATES.COLD, 'recovery:complete');
        return true;
      } catch (e) {
        return false;
      }
    });
    
    this.recoveryStrategies.set('reset', async (id, error) => {
      const machine = this.stateMachines.get(id);
      if (!machine) return false;
      
      machine.reset();
      await machine.transition(LIFECYCLE_STATES.INITIALIZING, 'recovery:reset');
      return true;
    });
    
    this.recoveryStrategies.set('hibernate', async (id, error) => {
      const machine = this.stateMachines.get(id);
      if (!machine) return false;
      
      try {
        await machine.transition(LIFECYCLE_STATES.HIBERNATING, 'recovery:hibernate');
        return true;
      } catch (e) {
        return false;
      }
    });
  }
  
  async attemptRecovery(id, error) {
    this.statistics.recoveries++;
    
    // Try recovery strategies in order
    for (const [name, strategy] of this.recoveryStrategies) {
      logger.info(`Attempting recovery strategy '${name}' for ${id}`);
      
      const success = await strategy(id, error);
      if (success) {
        logger.info(`Recovery successful for ${id} using strategy '${name}'`);
        this.emit('recovery:success', { id, strategy: name });
        return true;
      }
    }
    
    logger.error(`All recovery strategies failed for ${id}`);
    this.emit('recovery:failed', { id, error });
    return false;
  }
  
  /**
   * Sprint 4.6: Optimization Engine
   */
  initializeOptimizations() {
    this.optimizationRules.set('auto_hibernate_idle', {
      condition: (state, metrics) => {
        return state === LIFECYCLE_STATES.COLD && 
               metrics.idleTime > 300000; // 5 minutes idle
      },
      action: async (id) => {
        await this.transitionSpecialist(id, LIFECYCLE_STATES.HIBERNATING, 'optimization:auto_hibernate');
      }
    });
    
    this.optimizationRules.set('auto_warm_popular', {
      condition: (state, metrics) => {
        return state === LIFECYCLE_STATES.COLD && 
               metrics.requestCount > 10;
      },
      action: async (id) => {
        await this.transitionSpecialist(id, LIFECYCLE_STATES.WARMING, 'optimization:auto_warm');
      }
    });
  }
  
  checkOptimizations(id, state) {
    const machine = this.stateMachines.get(id);
    if (!machine) return;
    
    const metrics = this.monitor.getMetrics(id) || {};
    
    for (const [name, rule] of this.optimizationRules) {
      if (rule.condition(state, metrics)) {
        logger.info(`Applying optimization '${name}' for ${id}`);
        this.statistics.optimizations++;
        
        rule.action(id).catch(error => {
          logger.error(`Optimization '${name}' failed for ${id}:`, error);
        });
      }
    }
  }
  
  /**
   * Sprint 4.7: Analytics
   */
  recordTransitionAnalytics(id, from, to, metadata) {
    const record = {
      id,
      from,
      to,
      metadata,
      timestamp: Date.now()
    };
    
    this.analytics.stateTransitions.push(record);
    
    // Keep only recent records
    if (this.analytics.stateTransitions.length > 1000) {
      this.analytics.stateTransitions.shift();
    }
  }
  
  getAnalytics() {
    const metrics = this.monitor.getMetrics();
    
    return {
      ...this.analytics,
      aggregated: metrics,
      statistics: this.statistics,
      machineStates: Array.from(this.stateMachines.entries()).map(([id, machine]) => ({
        id,
        state: machine.getState(),
        statistics: machine.getStatistics()
      }))
    };
  }
  
  /**
   * Sprint 4.8: Orchestration
   */
  initializeOrchestration() {
    this.orchestrationPolicies.set('load_balancing', {
      evaluate: () => {
        const states = Array.from(this.stateMachines.values())
          .map(m => m.getState());
        
        const activeCount = states.filter(s => s === LIFECYCLE_STATES.ACTIVE).length;
        const warmCount = states.filter(s => s === LIFECYCLE_STATES.WARM).length;
        
        return {
          shouldBalance: activeCount > 10 && warmCount < 5,
          activeCount,
          warmCount
        };
      },
      execute: async () => {
        // Move some active to warm
        for (const [id, machine] of this.stateMachines) {
          if (machine.getState() === LIFECYCLE_STATES.ACTIVE) {
            await this.transitionSpecialist(id, LIFECYCLE_STATES.COOLING, 'orchestration:load_balance');
            break;
          }
        }
      }
    });
  }
  
  updateOrchestration(id, state) {
    for (const [name, policy] of this.orchestrationPolicies) {
      const evaluation = policy.evaluate();
      
      if (evaluation.shouldBalance) {
        logger.info(`Executing orchestration policy '${name}'`);
        policy.execute().catch(error => {
          logger.error(`Orchestration policy '${name}' failed:`, error);
        });
      }
    }
  }
  
  /**
   * Sprint 4.9: Validation
   */
  initializeValidators() {
    this.validators.set('resource_availability', async (id, from, to) => {
      if (to === LIFECYCLE_STATES.ACTIVE) {
        // Check if resources are available
        const activeCount = Array.from(this.stateMachines.values())
          .filter(m => m.getState() === LIFECYCLE_STATES.ACTIVE).length;
        
        if (activeCount >= 20) {
          throw new Error('Maximum active specialists reached');
        }
      }
    });
    
    this.validators.set('state_requirements', async (id, from, to) => {
      if (to === LIFECYCLE_STATES.ACTIVE && from === LIFECYCLE_STATES.COLD) {
        throw new Error('Cannot transition directly from COLD to ACTIVE');
      }
    });
  }
  
  async validateTransition(id, from, to, metadata) {
    for (const [name, validator] of this.validators) {
      try {
        await validator(id, from, to, metadata);
      } catch (error) {
        logger.error(`Validation '${name}' failed for ${id}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Get system status
   */
  getStatus() {
    const states = {};
    for (const state of Object.values(LIFECYCLE_STATES)) {
      states[state] = 0;
    }
    
    for (const machine of this.stateMachines.values()) {
      states[machine.getState()]++;
    }
    
    return {
      statistics: this.statistics,
      states,
      monitor: this.monitor.getMetrics(),
      alerts: this.monitor.alerts.slice(-10),
      activeTransitions: this.transitionManager.activeTransitions.size,
      queuedTransitions: this.transitionManager.transitionQueue.length
    };
  }
  
  /**
   * Utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.min(ms, 100))); // Cap delay for testing
  }
  
  /**
   * Shutdown system
   */
  async shutdown() {
    logger.info('Shutting down Enhanced Lifecycle System...');
    
    // Stop monitoring
    this.monitor.stopMonitoring();
    this.persistenceManager.stopSnapshotting();
    
    // Shutdown all state machines
    const shutdownPromises = [];
    for (const [id, machine] of this.stateMachines) {
      shutdownPromises.push(machine.shutdown());
    }
    
    await Promise.all(shutdownPromises);
    
    this.removeAllListeners();
    
    logger.info('Enhanced Lifecycle System shutdown complete');
  }
}

module.exports = {
  EnhancedLifecycleSystem,
  StateTransitionManager,
  StatePersistenceManager,
  StateMonitor
};