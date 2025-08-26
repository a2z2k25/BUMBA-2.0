/**
 * Enhanced Lifecycle State Machine
 * Comprehensive state management for specialist lifecycle
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Lifecycle States
 */
const LIFECYCLE_STATES = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  COLD: 'cold',
  WARMING: 'warming',
  WARM: 'warm',
  ACTIVE: 'active',
  COOLING: 'cooling',
  HIBERNATING: 'hibernating',
  TERMINATING: 'terminating',
  TERMINATED: 'terminated',
  ERROR: 'error',
  RECOVERING: 'recovering'
};

/**
 * State Transition Rules
 */
const STATE_TRANSITIONS = {
  [LIFECYCLE_STATES.UNINITIALIZED]: [
    LIFECYCLE_STATES.INITIALIZING,
    LIFECYCLE_STATES.ERROR
  ],
  [LIFECYCLE_STATES.INITIALIZING]: [
    LIFECYCLE_STATES.COLD,
    LIFECYCLE_STATES.ERROR,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.COLD]: [
    LIFECYCLE_STATES.WARMING,
    LIFECYCLE_STATES.HIBERNATING,
    LIFECYCLE_STATES.TERMINATING,
    LIFECYCLE_STATES.ERROR
  ],
  [LIFECYCLE_STATES.WARMING]: [
    LIFECYCLE_STATES.WARM,
    LIFECYCLE_STATES.COLD,
    LIFECYCLE_STATES.ERROR,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.WARM]: [
    LIFECYCLE_STATES.ACTIVE,
    LIFECYCLE_STATES.COOLING,
    LIFECYCLE_STATES.ERROR,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.ACTIVE]: [
    LIFECYCLE_STATES.WARM,
    LIFECYCLE_STATES.COOLING,
    LIFECYCLE_STATES.ERROR,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.COOLING]: [
    LIFECYCLE_STATES.COLD,
    LIFECYCLE_STATES.WARM,
    LIFECYCLE_STATES.HIBERNATING,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.HIBERNATING]: [
    LIFECYCLE_STATES.COLD,
    LIFECYCLE_STATES.WARMING,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.TERMINATING]: [
    LIFECYCLE_STATES.TERMINATED,
    LIFECYCLE_STATES.ERROR
  ],
  [LIFECYCLE_STATES.TERMINATED]: [],
  [LIFECYCLE_STATES.ERROR]: [
    LIFECYCLE_STATES.RECOVERING,
    LIFECYCLE_STATES.TERMINATING
  ],
  [LIFECYCLE_STATES.RECOVERING]: [
    LIFECYCLE_STATES.COLD,
    LIFECYCLE_STATES.ERROR,
    LIFECYCLE_STATES.TERMINATING
  ]
};

/**
 * State Metadata
 */
class StateMetadata {
  constructor(state) {
    this.state = state;
    this.enteredAt = Date.now();
    this.exitedAt = null;
    this.duration = 0;
    this.transitionCount = 0;
    this.metadata = {};
    this.errors = [];
  }
  
  exit() {
    this.exitedAt = Date.now();
    this.duration = this.exitedAt - this.enteredAt;
  }
  
  addError(error) {
    this.errors.push({
      error: error.message || error,
      timestamp: Date.now()
    });
  }
  
  setMetadata(key, value) {
    this.metadata[key] = value;
  }
  
  getMetadata(key) {
    return this.metadata[key];
  }
}

/**
 * State Transition
 */
class StateTransition {
  constructor(from, to, reason) {
    this.id = `transition-${Date.now()}-${Math.random()}`;
    this.from = from;
    this.to = to;
    this.reason = reason;
    this.timestamp = Date.now();
    this.duration = 0;
    this.success = false;
    this.error = null;
  }
  
  complete(success = true, error = null) {
    this.duration = Date.now() - this.timestamp;
    this.success = success;
    this.error = error;
  }
}

/**
 * Lifecycle State Machine
 */
class LifecycleStateMachine extends EventEmitter {
  constructor(id, config = {}) {
    super();
    
    this.id = id;
    this.currentState = LIFECYCLE_STATES.UNINITIALIZED;
    this.previousState = null;
    this.stateHistory = [];
    this.transitionHistory = [];
    this.currentTransition = null;
    
    // Configuration
    this.config = {
      maxHistorySize: config.maxHistorySize || 100,
      enableAutoTransitions: config.enableAutoTransitions !== false,
      transitionTimeout: config.transitionTimeout || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      hooks: config.hooks || {}
    };
    
    // State metadata
    this.stateMetadata = new Map();
    this.currentStateMetadata = new StateMetadata(this.currentState);
    
    // Retry tracking
    this.retryCount = 0;
    this.lastError = null;
    
    // Statistics
    this.statistics = {
      totalTransitions: 0,
      successfulTransitions: 0,
      failedTransitions: 0,
      stateTimings: {},
      errorCount: 0,
      recoveryCount: 0
    };
    
    // Initialize state timings
    for (const state of Object.values(LIFECYCLE_STATES)) {
      this.statistics.stateTimings[state] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      };
    }
    
    logger.info(`🔄 Lifecycle State Machine initialized for ${id}`);
  }
  
  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }
  
  /**
   * Check if transition is allowed
   */
  canTransition(toState) {
    const allowedTransitions = STATE_TRANSITIONS[this.currentState] || [];
    return allowedTransitions.includes(toState);
  }
  
  /**
   * Transition to new state
   */
  async transition(toState, reason = 'manual', metadata = {}) {
    // Check if transition is valid
    if (!this.canTransition(toState)) {
      const error = new Error(
        `Invalid transition from ${this.currentState} to ${toState}`
      );
      logger.error(`[${this.id}] ${error.message}`);
      this.emit('transition:invalid', {
        from: this.currentState,
        to: toState,
        reason,
        error: error.message
      });
      throw error;
    }
    
    // Check if already transitioning
    if (this.currentTransition) {
      const error = new Error('Transition already in progress');
      logger.warn(`[${this.id}] ${error.message}`);
      throw error;
    }
    
    // Create transition
    const transition = new StateTransition(this.currentState, toState, reason);
    this.currentTransition = transition;
    
    try {
      // Emit pre-transition event
      this.emit('transition:start', {
        id: transition.id,
        from: transition.from,
        to: transition.to,
        reason: transition.reason
      });
      
      // Execute pre-transition hook
      if (this.config.hooks.beforeTransition) {
        await this.config.hooks.beforeTransition(this.currentState, toState, metadata);
      }
      
      // Execute exit actions for current state
      await this.executeExitActions(this.currentState, metadata);
      
      // Update state
      this.previousState = this.currentState;
      this.currentState = toState;
      
      // Update metadata
      this.currentStateMetadata.exit();
      this.updateStateTimings(this.previousState, this.currentStateMetadata.duration);
      this.stateHistory.push(this.currentStateMetadata);
      
      // Trim history
      if (this.stateHistory.length > this.config.maxHistorySize) {
        this.stateHistory.shift();
      }
      
      // Create new state metadata
      this.currentStateMetadata = new StateMetadata(toState);
      Object.assign(this.currentStateMetadata.metadata, metadata);
      
      // Execute entry actions for new state
      await this.executeEntryActions(toState, metadata);
      
      // Execute post-transition hook
      if (this.config.hooks.afterTransition) {
        await this.config.hooks.afterTransition(this.previousState, this.currentState, metadata);
      }
      
      // Complete transition
      transition.complete(true);
      this.transitionHistory.push(transition);
      this.statistics.totalTransitions++;
      this.statistics.successfulTransitions++;
      
      // Reset retry count on successful transition
      this.retryCount = 0;
      this.lastError = null;
      
      // Emit post-transition event
      this.emit('transition:complete', {
        id: transition.id,
        from: transition.from,
        to: transition.to,
        duration: transition.duration,
        success: true
      });
      
      // Check for auto-transitions
      if (this.config.enableAutoTransitions) {
        this.checkAutoTransitions();
      }
      
      logger.info(`[${this.id}] Transitioned from ${transition.from} to ${transition.to} (${transition.duration}ms)`);
      
      return transition;
      
    } catch (error) {
      // Handle transition failure
      transition.complete(false, error);
      this.transitionHistory.push(transition);
      this.statistics.failedTransitions++;
      this.lastError = error;
      
      logger.error(`[${this.id}] Transition failed:`, error);
      
      // Emit failure event
      this.emit('transition:failed', {
        id: transition.id,
        from: transition.from,
        to: transition.to,
        error: error.message
      });
      
      // Attempt recovery
      await this.handleTransitionFailure(toState, reason, metadata, error);
      
      throw error;
      
    } finally {
      this.currentTransition = null;
    }
  }
  
  /**
   * Execute exit actions for a state
   */
  async executeExitActions(state, metadata) {
    switch (state) {
      case LIFECYCLE_STATES.ACTIVE:
        // Finish active tasks
        await this.finishActiveTasks(metadata);
        break;
        
      case LIFECYCLE_STATES.WARM:
        // Save warm state
        await this.saveWarmState(metadata);
        break;
        
      case LIFECYCLE_STATES.ERROR:
        // Clean up error state
        await this.cleanupErrorState(metadata);
        break;
    }
    
    // Execute custom exit action
    if (this.config.hooks[`onExit${this.capitalize(state)}`]) {
      await this.config.hooks[`onExit${this.capitalize(state)}`](metadata);
    }
  }
  
  /**
   * Execute entry actions for a state
   */
  async executeEntryActions(state, metadata) {
    switch (state) {
      case LIFECYCLE_STATES.INITIALIZING:
        // Start initialization
        await this.startInitialization(metadata);
        break;
        
      case LIFECYCLE_STATES.WARMING:
        // Start warming process
        await this.startWarming(metadata);
        break;
        
      case LIFECYCLE_STATES.ACTIVE:
        // Activate resources
        await this.activateResources(metadata);
        break;
        
      case LIFECYCLE_STATES.COOLING:
        // Start cooling process
        await this.startCooling(metadata);
        break;
        
      case LIFECYCLE_STATES.HIBERNATING:
        // Enter hibernation
        await this.enterHibernation(metadata);
        break;
        
      case LIFECYCLE_STATES.ERROR:
        // Handle error state
        await this.handleErrorState(metadata);
        break;
        
      case LIFECYCLE_STATES.RECOVERING:
        // Start recovery
        await this.startRecovery(metadata);
        break;
    }
    
    // Execute custom entry action
    if (this.config.hooks[`onEnter${this.capitalize(state)}`]) {
      await this.config.hooks[`onEnter${this.capitalize(state)}`](metadata);
    }
  }
  
  /**
   * Handle transition failure
   */
  async handleTransitionFailure(toState, reason, metadata, error) {
    this.retryCount++;
    
    // Check if we should retry
    if (this.retryCount <= this.config.maxRetries) {
      logger.info(`[${this.id}] Retrying transition (attempt ${this.retryCount}/${this.config.maxRetries})`);
      
      // Wait before retry
      await this.delay(1000 * this.retryCount);
      
      try {
        // Retry transition
        await this.transition(toState, `${reason} (retry ${this.retryCount})`, metadata);
      } catch (retryError) {
        logger.error(`[${this.id}] Retry failed:`, retryError);
      }
    } else {
      // Max retries exceeded, transition to error state
      logger.error(`[${this.id}] Max retries exceeded, transitioning to ERROR state`);
      
      if (this.currentState !== LIFECYCLE_STATES.ERROR) {
        try {
          await this.transition(LIFECYCLE_STATES.ERROR, 'max_retries_exceeded', {
            originalTarget: toState,
            error: error.message
          });
        } catch (errorTransitionError) {
          logger.error(`[${this.id}] Failed to transition to ERROR state:`, errorTransitionError);
        }
      }
    }
  }
  
  /**
   * Check for automatic transitions
   */
  checkAutoTransitions() {
    // Implement auto-transition logic based on current state
    switch (this.currentState) {
      case LIFECYCLE_STATES.INITIALIZING:
        // Auto-transition to COLD after initialization
        setTimeout(() => {
          if (this.currentState === LIFECYCLE_STATES.INITIALIZING) {
            this.transition(LIFECYCLE_STATES.COLD, 'auto:initialization_complete')
              .catch(error => logger.error(`[${this.id}] Auto-transition failed:`, error));
          }
        }, 5000);
        break;
        
      case LIFECYCLE_STATES.WARMING:
        // Auto-transition to WARM after warming
        setTimeout(() => {
          if (this.currentState === LIFECYCLE_STATES.WARMING) {
            this.transition(LIFECYCLE_STATES.WARM, 'auto:warming_complete')
              .catch(error => logger.error(`[${this.id}] Auto-transition failed:`, error));
          }
        }, 3000);
        break;
        
      case LIFECYCLE_STATES.COOLING:
        // Auto-transition to COLD after cooling
        setTimeout(() => {
          if (this.currentState === LIFECYCLE_STATES.COOLING) {
            this.transition(LIFECYCLE_STATES.COLD, 'auto:cooling_complete')
              .catch(error => logger.error(`[${this.id}] Auto-transition failed:`, error));
          }
        }, 10000);
        break;
    }
  }
  
  /**
   * State-specific actions
   */
  async startInitialization(metadata) {
    logger.debug(`[${this.id}] Starting initialization`);
    this.currentStateMetadata.setMetadata('initStartTime', Date.now());
  }
  
  async startWarming(metadata) {
    logger.debug(`[${this.id}] Starting warming process`);
    this.currentStateMetadata.setMetadata('warmingStartTime', Date.now());
  }
  
  async activateResources(metadata) {
    logger.debug(`[${this.id}] Activating resources`);
    this.currentStateMetadata.setMetadata('activationTime', Date.now());
  }
  
  async finishActiveTasks(metadata) {
    logger.debug(`[${this.id}] Finishing active tasks`);
    this.currentStateMetadata.setMetadata('tasksFinished', true);
  }
  
  async startCooling(metadata) {
    logger.debug(`[${this.id}] Starting cooling process`);
    this.currentStateMetadata.setMetadata('coolingStartTime', Date.now());
  }
  
  async saveWarmState(metadata) {
    logger.debug(`[${this.id}] Saving warm state`);
    this.currentStateMetadata.setMetadata('stateSaved', true);
  }
  
  async enterHibernation(metadata) {
    logger.debug(`[${this.id}] Entering hibernation`);
    this.currentStateMetadata.setMetadata('hibernationTime', Date.now());
  }
  
  async handleErrorState(metadata) {
    logger.debug(`[${this.id}] Handling error state`);
    this.statistics.errorCount++;
    this.currentStateMetadata.addError(this.lastError || 'Unknown error');
  }
  
  async cleanupErrorState(metadata) {
    logger.debug(`[${this.id}] Cleaning up error state`);
    this.currentStateMetadata.setMetadata('errorCleaned', true);
  }
  
  async startRecovery(metadata) {
    logger.debug(`[${this.id}] Starting recovery`);
    this.statistics.recoveryCount++;
    this.currentStateMetadata.setMetadata('recoveryStartTime', Date.now());
  }
  
  /**
   * Force state (use with caution)
   */
  forceState(state, reason = 'forced') {
    logger.warn(`[${this.id}] Forcing state to ${state}`);
    
    this.previousState = this.currentState;
    this.currentState = state;
    
    // Update metadata
    this.currentStateMetadata.exit();
    this.stateHistory.push(this.currentStateMetadata);
    this.currentStateMetadata = new StateMetadata(state);
    
    this.emit('state:forced', {
      from: this.previousState,
      to: state,
      reason
    });
  }
  
  /**
   * Update state timings
   */
  updateStateTimings(state, duration) {
    const timing = this.statistics.stateTimings[state];
    if (timing) {
      timing.count++;
      timing.totalTime += duration;
      timing.avgTime = timing.totalTime / timing.count;
      timing.minTime = Math.min(timing.minTime, duration);
      timing.maxTime = Math.max(timing.maxTime, duration);
    }
  }
  
  /**
   * Get state statistics
   */
  getStatistics() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      uptime: Date.now() - (this.stateHistory[0]?.enteredAt || Date.now()),
      statistics: this.statistics,
      currentStateDuration: Date.now() - this.currentStateMetadata.enteredAt,
      retryCount: this.retryCount,
      lastError: this.lastError?.message
    };
  }
  
  /**
   * Get state history
   */
  getHistory() {
    return {
      states: this.stateHistory.map(meta => ({
        state: meta.state,
        enteredAt: meta.enteredAt,
        exitedAt: meta.exitedAt,
        duration: meta.duration,
        errors: meta.errors
      })),
      transitions: this.transitionHistory.map(trans => ({
        from: trans.from,
        to: trans.to,
        reason: trans.reason,
        timestamp: trans.timestamp,
        duration: trans.duration,
        success: trans.success,
        error: trans.error?.message
      }))
    };
  }
  
  /**
   * Reset state machine
   */
  reset() {
    logger.info(`[${this.id}] Resetting state machine`);
    
    this.currentState = LIFECYCLE_STATES.UNINITIALIZED;
    this.previousState = null;
    this.stateHistory = [];
    this.transitionHistory = [];
    this.currentTransition = null;
    this.retryCount = 0;
    this.lastError = null;
    
    this.currentStateMetadata = new StateMetadata(this.currentState);
    
    this.emit('machine:reset');
  }
  
  /**
   * Utility functions
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Shutdown state machine
   */
  async shutdown() {
    logger.info(`[${this.id}] Shutting down state machine`);
    
    try {
      if (this.currentState !== LIFECYCLE_STATES.TERMINATED) {
        await this.transition(LIFECYCLE_STATES.TERMINATING, 'shutdown');
        await this.transition(LIFECYCLE_STATES.TERMINATED, 'shutdown_complete');
      }
    } catch (error) {
      logger.error(`[${this.id}] Error during shutdown:`, error);
      this.forceState(LIFECYCLE_STATES.TERMINATED, 'shutdown_forced');
    }
    
    this.removeAllListeners();
  }
}

module.exports = {
  LifecycleStateMachine,
  LIFECYCLE_STATES,
  STATE_TRANSITIONS,
  StateMetadata,
  StateTransition
};