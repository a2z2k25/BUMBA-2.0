/**
 * Pool State Manager for Intelligent Pooling
 * Manages warm/cold state transitions and specialist lifecycle
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Specialist states
const SpecialistState = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  COLD: 'cold',
  WARMING: 'warming',
  WARM: 'warm',
  ACTIVE: 'active',
  COOLING: 'cooling',
  TERMINATING: 'terminating',
  TERMINATED: 'terminated',
  ERROR: 'error'
};

// State transition rules
const StateTransitions = {
  [SpecialistState.UNINITIALIZED]: [SpecialistState.INITIALIZING],
  [SpecialistState.INITIALIZING]: [SpecialistState.COLD, SpecialistState.ERROR],
  [SpecialistState.COLD]: [SpecialistState.WARMING, SpecialistState.TERMINATING],
  [SpecialistState.WARMING]: [SpecialistState.WARM, SpecialistState.ERROR, SpecialistState.COOLING],
  [SpecialistState.WARM]: [SpecialistState.ACTIVE, SpecialistState.COOLING],
  [SpecialistState.ACTIVE]: [SpecialistState.WARM, SpecialistState.COOLING, SpecialistState.ERROR],
  [SpecialistState.COOLING]: [SpecialistState.COLD, SpecialistState.TERMINATING],
  [SpecialistState.TERMINATING]: [SpecialistState.TERMINATED],
  [SpecialistState.TERMINATED]: [],
  [SpecialistState.ERROR]: [SpecialistState.TERMINATING, SpecialistState.COLD]
};

class PoolStateManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      warmupTime: config.warmupTime || 50,           // ms to warm up
      cooldownTime: config.cooldownTime || 100,      // ms to cool down
      maxWarmPool: config.maxWarmPool || 20,
      maxColdPool: config.maxColdPool || 40,
      stateTimeout: config.stateTimeout || 5000,     // ms before state transition timeout
      retryAttempts: config.retryAttempts || 3,
      persistState: config.persistState !== false,
      checkpointInterval: config.checkpointInterval || 60000 // 1 minute
    };
    
    // State storage
    this.specialists = new Map(); // type -> specialist state
    this.warmPool = new Set();
    this.coldPool = new Set();
    this.activePool = new Set();
    
    // State transition tracking
    this.transitions = new Map(); // specialist -> transition history
    this.pendingTransitions = new Map(); // specialist -> pending transition
    
    // Lifecycle hooks
    this.lifecycleHooks = {
      beforeWarming: [],
      afterWarming: [],
      beforeCooling: [],
      afterCooling: [],
      beforeActivation: [],
      afterDeactivation: [],
      onError: []
    };
    
    // Statistics
    this.statistics = {
      totalSpecialists: 0,
      stateChanges: 0,
      errors: 0,
      timeouts: 0,
      successfulWarmups: 0,
      failedWarmups: 0
    };
    
    // Persistence
    this.lastCheckpoint = Date.now();
    this.stateSnapshots = [];
    
    // Start checkpoint timer if persistence enabled
    if (this.config.persistState) {
      this.startCheckpointing();
    }
    
    logger.info('Pool state manager initialized');
  }
  
  /**
   * Register a specialist
   */
  registerSpecialist(type, metadata = {}) {
    if (this.specialists.has(type)) {
      logger.warn(`Specialist ${type} already registered`);
      return this.specialists.get(type);
    }
    
    const specialist = {
      type,
      state: SpecialistState.UNINITIALIZED,
      metadata: {
        ...metadata,
        createdAt: Date.now(),
        lastStateChange: Date.now(),
        stateChangeCount: 0
      },
      instance: null,
      error: null
    };
    
    this.specialists.set(type, specialist);
    this.transitions.set(type, []);
    this.statistics.totalSpecialists++;
    
    // Initialize
    this.transitionState(type, SpecialistState.INITIALIZING);
    
    logger.debug(`Registered specialist: ${type}`);
    return specialist;
  }
  
  /**
   * Transition specialist state
   */
  async transitionState(type, newState, reason = '') {
    const specialist = this.specialists.get(type);
    
    if (!specialist) {
      logger.error(`Specialist ${type} not found`);
      return false;
    }
    
    const currentState = specialist.state;
    
    // Check if transition is valid
    if (!this.isValidTransition(currentState, newState)) {
      logger.warn(`Invalid transition: ${type} ${currentState} -> ${newState}`);
      return false;
    }
    
    // Check for pending transition
    if (this.pendingTransitions.has(type)) {
      logger.warn(`Transition already in progress for ${type}`);
      return false;
    }
    
    // Mark transition as pending
    this.pendingTransitions.set(type, {
      from: currentState,
      to: newState,
      startTime: Date.now()
    });
    
    try {
      // Execute pre-transition hooks
      await this.executeHooks(`before${this.capitalizeFirst(newState)}`, specialist);
      
      // Perform state-specific logic
      await this.performTransition(specialist, currentState, newState);
      
      // Update state
      specialist.state = newState;
      specialist.metadata.lastStateChange = Date.now();
      specialist.metadata.stateChangeCount++;
      
      // Update pools
      this.updatePools(type, currentState, newState);
      
      // Record transition
      this.recordTransition(type, currentState, newState, reason);
      
      // Execute post-transition hooks
      await this.executeHooks(`after${this.capitalizeFirst(newState)}`, specialist);
      
      // Emit event
      this.emit('state:changed', {
        specialist: type,
        from: currentState,
        to: newState,
        reason
      });
      
      this.statistics.stateChanges++;
      
      logger.debug(`State transition: ${type} ${currentState} -> ${newState} (${reason})`);
      return true;
      
    } catch (error) {
      logger.error(`State transition failed: ${type}`, error);
      
      specialist.error = error;
      specialist.state = SpecialistState.ERROR;
      this.statistics.errors++;
      
      // Execute error hooks
      await this.executeHooks('onError', specialist, error);
      
      this.emit('state:error', {
        specialist: type,
        from: currentState,
        to: newState,
        error: error.message
      });
      
      return false;
      
    } finally {
      this.pendingTransitions.delete(type);
    }
  }
  
  /**
   * Perform state transition logic
   */
  async performTransition(specialist, fromState, toState) {
    const type = specialist.type;
    
    switch (toState) {
      case SpecialistState.INITIALIZING:
        await this.initializeSpecialist(specialist);
        // Auto-transition to cold
        setTimeout(() => {
          this.transitionState(type, SpecialistState.COLD, 'initialization complete');
        }, 10);
        break;
        
      case SpecialistState.WARMING:
        await this.warmSpecialist(specialist);
        break;
        
      case SpecialistState.WARM:
        specialist.metadata.warmedAt = Date.now();
        this.statistics.successfulWarmups++;
        break;
        
      case SpecialistState.ACTIVE:
        specialist.metadata.activatedAt = Date.now();
        specialist.metadata.activationCount = (specialist.metadata.activationCount || 0) + 1;
        break;
        
      case SpecialistState.COOLING:
        await this.coolSpecialist(specialist);
        break;
        
      case SpecialistState.COLD:
        specialist.metadata.cooledAt = Date.now();
        if (specialist.instance) {
          // Clear instance reference but keep metadata
          specialist.instance = null;
        }
        break;
        
      case SpecialistState.TERMINATING:
        await this.terminateSpecialist(specialist);
        break;
        
      case SpecialistState.TERMINATED:
        this.specialists.delete(type);
        this.transitions.delete(type);
        break;
        
      case SpecialistState.ERROR:
        this.statistics.errors++;
        // Attempt recovery after delay
        setTimeout(() => {
          this.attemptRecovery(type);
        }, 5000);
        break;
    }
  }
  
  /**
   * Initialize specialist
   */
  async initializeSpecialist(specialist) {
    // Simulate initialization
    await this.delay(10);
    
    specialist.metadata.initialized = true;
    logger.debug(`Initialized specialist: ${specialist.type}`);
  }
  
  /**
   * Warm up specialist
   */
  async warmSpecialist(specialist) {
    const startTime = Date.now();
    
    try {
      // Simulate warming (in real implementation, would create instance)
      await this.delay(this.config.warmupTime);
      
      specialist.instance = {
        type: specialist.type,
        id: `${specialist.type}-${Date.now()}`,
        state: 'warm',
        memory: 5 // MB
      };
      
      const duration = Date.now() - startTime;
      specialist.metadata.lastWarmupDuration = duration;
      
      // Auto-transition to warm
      this.transitionState(specialist.type, SpecialistState.WARM, 'warmup complete');
      
    } catch (error) {
      this.statistics.failedWarmups++;
      throw error;
    }
  }
  
  /**
   * Cool down specialist
   */
  async coolSpecialist(specialist) {
    const startTime = Date.now();
    
    // Simulate cooling
    await this.delay(this.config.cooldownTime);
    
    const duration = Date.now() - startTime;
    specialist.metadata.lastCooldownDuration = duration;
    
    // Auto-transition to cold
    this.transitionState(specialist.type, SpecialistState.COLD, 'cooldown complete');
  }
  
  /**
   * Terminate specialist
   */
  async terminateSpecialist(specialist) {
    // Clean up resources
    if (specialist.instance) {
      specialist.instance = null;
    }
    
    // Small delay for cleanup
    await this.delay(10);
    
    // Auto-transition to terminated
    this.transitionState(specialist.type, SpecialistState.TERMINATED, 'termination complete');
  }
  
  /**
   * Update pool memberships
   */
  updatePools(type, fromState, toState) {
    // Remove from old pools
    this.warmPool.delete(type);
    this.coldPool.delete(type);
    this.activePool.delete(type);
    
    // Add to new pool
    switch (toState) {
      case SpecialistState.WARM:
        this.warmPool.add(type);
        break;
      case SpecialistState.COLD:
        this.coldPool.add(type);
        break;
      case SpecialistState.ACTIVE:
        this.activePool.add(type);
        this.warmPool.add(type); // Keep in warm pool too
        break;
    }
  }
  
  /**
   * Check if transition is valid
   */
  isValidTransition(fromState, toState) {
    const validTransitions = StateTransitions[fromState] || [];
    return validTransitions.includes(toState);
  }
  
  /**
   * Record state transition
   */
  recordTransition(type, fromState, toState, reason) {
    const history = this.transitions.get(type) || [];
    
    history.push({
      from: fromState,
      to: toState,
      reason,
      timestamp: Date.now()
    });
    
    // Keep only last 50 transitions
    if (history.length > 50) {
      history.shift();
    }
    
    this.transitions.set(type, history);
  }
  
  /**
   * Warm specialist on demand
   */
  async warmUpSpecialist(type) {
    const specialist = this.specialists.get(type);
    
    if (!specialist) {
      // Register if not exists
      this.registerSpecialist(type);
      await this.delay(20); // Wait for initialization
    }
    
    const currentState = this.specialists.get(type)?.state;
    
    if (currentState === SpecialistState.WARM || currentState === SpecialistState.ACTIVE) {
      logger.debug(`Specialist ${type} already warm`);
      return true;
    }
    
    if (currentState === SpecialistState.COLD) {
      return await this.transitionState(type, SpecialistState.WARMING, 'on-demand warmup');
    }
    
    logger.warn(`Cannot warm specialist ${type} from state ${currentState}`);
    return false;
  }
  
  /**
   * Cool down specialist
   */
  async coolDownSpecialist(type) {
    const specialist = this.specialists.get(type);
    
    if (!specialist) {
      logger.warn(`Specialist ${type} not found`);
      return false;
    }
    
    const currentState = specialist.state;
    
    if (currentState === SpecialistState.COLD) {
      logger.debug(`Specialist ${type} already cold`);
      return true;
    }
    
    if (currentState === SpecialistState.WARM || currentState === SpecialistState.ACTIVE) {
      return await this.transitionState(type, SpecialistState.COOLING, 'on-demand cooldown');
    }
    
    logger.warn(`Cannot cool specialist ${type} from state ${currentState}`);
    return false;
  }
  
  /**
   * Activate specialist for use
   */
  async activateSpecialist(type) {
    const specialist = this.specialists.get(type);
    
    if (!specialist) {
      logger.warn(`Specialist ${type} not found`);
      return null;
    }
    
    // Warm up if needed
    if (specialist.state === SpecialistState.COLD) {
      await this.warmUpSpecialist(type);
      await this.waitForState(type, SpecialistState.WARM, 5000);
    }
    
    if (specialist.state === SpecialistState.WARM) {
      await this.transitionState(type, SpecialistState.ACTIVE, 'activation requested');
      return specialist.instance;
    }
    
    logger.warn(`Cannot activate specialist ${type} from state ${specialist.state}`);
    return null;
  }
  
  /**
   * Deactivate specialist
   */
  async deactivateSpecialist(type) {
    const specialist = this.specialists.get(type);
    
    if (!specialist || specialist.state !== SpecialistState.ACTIVE) {
      return false;
    }
    
    return await this.transitionState(type, SpecialistState.WARM, 'deactivation requested');
  }
  
  /**
   * Wait for specific state
   */
  async waitForState(type, targetState, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const specialist = this.specialists.get(type);
      
      if (!specialist) return false;
      if (specialist.state === targetState) return true;
      if (specialist.state === SpecialistState.ERROR) return false;
      
      await this.delay(50);
    }
    
    this.statistics.timeouts++;
    logger.warn(`Timeout waiting for ${type} to reach ${targetState}`);
    return false;
  }
  
  /**
   * Attempt recovery from error state
   */
  async attemptRecovery(type) {
    const specialist = this.specialists.get(type);
    
    if (!specialist || specialist.state !== SpecialistState.ERROR) {
      return;
    }
    
    const attempts = specialist.metadata.recoveryAttempts || 0;
    
    if (attempts >= this.config.retryAttempts) {
      logger.error(`Max recovery attempts reached for ${type}, terminating`);
      await this.transitionState(type, SpecialistState.TERMINATING, 'max recovery attempts');
      return;
    }
    
    specialist.metadata.recoveryAttempts = attempts + 1;
    logger.info(`Attempting recovery for ${type} (attempt ${attempts + 1})`);
    
    // Try to go back to cold state
    specialist.error = null;
    await this.transitionState(type, SpecialistState.COLD, 'recovery attempt');
  }
  
  /**
   * Register lifecycle hook
   */
  registerHook(event, callback) {
    if (this.lifecycleHooks[event]) {
      this.lifecycleHooks[event].push(callback);
      logger.debug(`Registered hook for ${event}`);
    }
  }
  
  /**
   * Execute lifecycle hooks
   */
  async executeHooks(event, specialist, ...args) {
    const hooks = this.lifecycleHooks[event] || [];
    
    for (const hook of hooks) {
      try {
        await hook(specialist, ...args);
      } catch (error) {
        logger.error(`Hook execution failed for ${event}:`, error);
      }
    }
  }
  
  /**
   * Get pool status
   */
  getPoolStatus() {
    const specialists = Array.from(this.specialists.values());
    
    const stateCount = {};
    for (const state of Object.values(SpecialistState)) {
      stateCount[state] = specialists.filter(s => s.state === state).length;
    }
    
    return {
      total: specialists.length,
      warm: this.warmPool.size,
      cold: this.coldPool.size,
      active: this.activePool.size,
      states: stateCount,
      statistics: this.statistics,
      pools: {
        warm: Array.from(this.warmPool),
        cold: Array.from(this.coldPool),
        active: Array.from(this.activePool)
      }
    };
  }
  
  /**
   * Get specialist details
   */
  getSpecialistDetails(type) {
    const specialist = this.specialists.get(type);
    if (!specialist) return null;
    
    const transitions = this.transitions.get(type) || [];
    
    return {
      ...specialist,
      transitions: transitions.slice(-10), // Last 10 transitions
      pendingTransition: this.pendingTransitions.get(type)
    };
  }
  
  /**
   * Start checkpointing
   */
  startCheckpointing() {
    this.checkpointInterval = setInterval(() => {
      this.createCheckpoint();
    }, this.config.checkpointInterval);
    
    logger.debug('State checkpointing started');
  }
  
  /**
   * Create state checkpoint
   */
  createCheckpoint() {
    const checkpoint = {
      timestamp: Date.now(),
      specialists: Array.from(this.specialists.entries()).map(([type, spec]) => ({
        type,
        state: spec.state,
        metadata: spec.metadata
      })),
      pools: {
        warm: Array.from(this.warmPool),
        cold: Array.from(this.coldPool),
        active: Array.from(this.activePool)
      },
      statistics: { ...this.statistics }
    };
    
    this.stateSnapshots.push(checkpoint);
    
    // Keep only last 10 snapshots
    if (this.stateSnapshots.length > 10) {
      this.stateSnapshots.shift();
    }
    
    this.lastCheckpoint = Date.now();
    
    this.emit('checkpoint:created', checkpoint);
  }
  
  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(checkpoint) {
    logger.info('Restoring from checkpoint...');
    
    // Clear current state
    this.specialists.clear();
    this.warmPool.clear();
    this.coldPool.clear();
    this.activePool.clear();
    
    // Restore specialists
    for (const spec of checkpoint.specialists) {
      this.specialists.set(spec.type, {
        type: spec.type,
        state: spec.state,
        metadata: spec.metadata,
        instance: null,
        error: null
      });
    }
    
    // Restore pools
    checkpoint.pools.warm.forEach(type => this.warmPool.add(type));
    checkpoint.pools.cold.forEach(type => this.coldPool.add(type));
    checkpoint.pools.active.forEach(type => this.activePool.add(type));
    
    // Restore statistics
    this.statistics = { ...checkpoint.statistics };
    
    logger.info('Checkpoint restored successfully');
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down pool state manager...');
    
    // Stop checkpointing
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval);
    }
    
    // Cool down all warm specialists
    const warmSpecialists = Array.from(this.warmPool);
    for (const type of warmSpecialists) {
      await this.coolDownSpecialist(type);
    }
    
    // Create final checkpoint
    if (this.config.persistState) {
      this.createCheckpoint();
    }
    
    this.emit('shutdown');
    logger.info('Pool state manager shutdown complete');
  }
  
  /**
   * Utility: capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Utility: delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Export state
   */
  export() {
    return {
      specialists: Array.from(this.specialists.entries()),
      transitions: Array.from(this.transitions.entries()),
      pools: {
        warm: Array.from(this.warmPool),
        cold: Array.from(this.coldPool),
        active: Array.from(this.activePool)
      },
      statistics: this.statistics,
      lastCheckpoint: this.lastCheckpoint
    };
  }
  
  /**
   * Import state
   */
  import(state) {
    if (state.specialists) {
      this.specialists = new Map(state.specialists);
    }
    if (state.transitions) {
      this.transitions = new Map(state.transitions);
    }
    if (state.pools) {
      this.warmPool = new Set(state.pools.warm);
      this.coldPool = new Set(state.pools.cold);
      this.activePool = new Set(state.pools.active);
    }
    if (state.statistics) {
      this.statistics = { ...state.statistics };
    }
    
    logger.debug('Pool state imported');
  }
}

module.exports = { PoolStateManager, SpecialistState, StateTransitions };