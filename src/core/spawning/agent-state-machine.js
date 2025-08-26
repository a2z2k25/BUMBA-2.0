/**
 * BUMBA Agent State Machine
 * Manages agent lifecycle states with proper transitions and validation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class AgentStateMachine extends EventEmitter {
  constructor(initialState = 'idle', options = {}) {
    super();
    
    this.currentState = initialState;
    this.previousState = null;
    this.stateHistory = [];
    this.transitions = new Map();
    this.states = new Set();
    
    this.config = {
      maxHistoryLength: options.maxHistoryLength || 100,
      validateTransitions: options.validateTransitions !== false,
      allowInvalidTransitions: options.allowInvalidTransitions || false,
      enableLogging: options.enableLogging !== false,
      enableEvents: options.enableEvents !== false
    };
    
    this.metadata = {
      createdAt: Date.now(),
      transitionCount: 0,
      lastTransition: null,
      errors: []
    };
    
    // Initialize default states and transitions
    this.initializeDefaultStates();
    this.initializeDefaultTransitions();
    
    // Record initial state
    this.recordStateChange(null, this.currentState, 'initialization');
  }

  /**
   * Initialize default agent lifecycle states
   */
  initializeDefaultStates() {
    const defaultStates = [
      'idle',      // Agent is created but not active
      'spawning',  // Agent is being spawned
      'active',    // Agent is running and available
      'busy',      // Agent is processing a task
      'paused',    // Agent is temporarily paused
      'terminating', // Agent is being terminated
      'terminated',  // Agent has been terminated
      'error',     // Agent is in error state
      'maintenance', // Agent is under maintenance
      'updating'   // Agent is being updated
    ];
    
    defaultStates.forEach(state => this.addState(state));
  }

  /**
   * Initialize default state transitions
   */
  initializeDefaultTransitions() {
    const transitions = [
      // From idle
      ['idle', 'spawning'],
      ['idle', 'terminated'],
      ['idle', 'error'],
      
      // From spawning
      ['spawning', 'active'],
      ['spawning', 'error'],
      ['spawning', 'terminated'],
      
      // From active
      ['active', 'busy'],
      ['active', 'paused'],
      ['active', 'terminating'],
      ['active', 'maintenance'],
      ['active', 'updating'],
      ['active', 'error'],
      
      // From busy
      ['busy', 'active'],
      ['busy', 'paused'],
      ['busy', 'terminating'],
      ['busy', 'error'],
      
      // From paused
      ['paused', 'active'],
      ['paused', 'terminating'],
      ['paused', 'error'],
      
      // From maintenance
      ['maintenance', 'active'],
      ['maintenance', 'terminating'],
      ['maintenance', 'error'],
      
      // From updating
      ['updating', 'active'],
      ['updating', 'error'],
      ['updating', 'terminating'],
      
      // From terminating
      ['terminating', 'terminated'],
      ['terminating', 'error'],
      
      // From error
      ['error', 'idle'],
      ['error', 'active'],
      ['error', 'terminating'],
      ['error', 'terminated']
    ];
    
    transitions.forEach(([from, to]) => this.addTransition(from, to));
  }

  /**
   * Transition to a new state
   */
  async transition(newState, context = {}) {
    try {
      // Validate transition
      if (this.config.validateTransitions && !this.canTransition(newState)) {
        const error = new Error(`Invalid transition from '${this.currentState}' to '${newState}'`);
        this.metadata.errors.push({
          timestamp: Date.now(),
          error: error.message,
          from: this.currentState,
          to: newState,
          context
        });
        
        if (!this.config.allowInvalidTransitions) {
          throw error;
        }
        
        if (this.config.enableLogging) {
          logger.warn(`Invalid transition allowed: ${this.currentState} -> ${newState}`, { context });
        }
      }
      
      // Execute pre-transition hooks
      if (this.config.enableEvents) {
        this.emit('before-transition', {
          from: this.currentState,
          to: newState,
          context,
          timestamp: Date.now()
        });
      }
      
      // Perform transition
      const oldState = this.currentState;
      this.previousState = oldState;
      this.currentState = newState;
      
      // Update metadata
      this.metadata.transitionCount++;
      this.metadata.lastTransition = {
        from: oldState,
        to: newState,
        timestamp: Date.now(),
        context
      };
      
      // Record state change
      this.recordStateChange(oldState, newState, context);
      
      // Log transition
      if (this.config.enableLogging) {
        logger.info(`Agent state transition: ${oldState} -> ${newState}`, { context });
      }
      
      // Execute post-transition hooks
      if (this.config.enableEvents) {
        this.emit('after-transition', {
          from: oldState,
          to: newState,
          context,
          timestamp: Date.now()
        });
        
        this.emit('state-changed', {
          state: newState,
          previousState: oldState,
          context,
          timestamp: Date.now()
        });
      }
      
      return true;
    } catch (error) {
      if (this.config.enableLogging) {
        logger.error(`State transition failed: ${this.currentState} -> ${newState}`, { error: error.message, context });
      }
      
      if (this.config.enableEvents) {
        this.emit('transition-error', {
          from: this.currentState,
          to: newState,
          error: error.message,
          context,
          timestamp: Date.now()
        });
      }
      
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      current: this.currentState,
      previous: this.previousState,
      metadata: {
        ...this.metadata,
        uptime: Date.now() - this.metadata.createdAt,
        historyLength: this.stateHistory.length
      }
    };
  }

  /**
   * Check if transition to new state is valid
   */
  canTransition(newState) {
    // Always allow transition to error state
    if (newState === 'error') {
      return true;
    }
    
    // Check if target state exists
    if (!this.states.has(newState)) {
      return false;
    }
    
    // Check if transition is defined
    const transitionKey = `${this.currentState}->${newState}`;
    return this.transitions.has(transitionKey);
  }

  /**
   * Add a new state to the state machine
   */
  addState(stateName, metadata = {}) {
    if (typeof stateName !== 'string' || stateName.trim() === '') {
      throw new Error('State name must be a non-empty string');
    }
    
    this.states.add(stateName);
    
    if (this.config.enableLogging) {
      logger.debug(`Added state: ${stateName}`, metadata);
    }
    
    if (this.config.enableEvents) {
      this.emit('state-added', { state: stateName, metadata, timestamp: Date.now() });
    }
    
    return this;
  }

  /**
   * Add a transition between states
   */
  addTransition(fromState, toState, validator = null) {
    if (!this.states.has(fromState)) {
      throw new Error(`Source state '${fromState}' does not exist`);
    }
    
    if (!this.states.has(toState)) {
      throw new Error(`Target state '${toState}' does not exist`);
    }
    
    const transitionKey = `${fromState}->${toState}`;
    const transition = {
      from: fromState,
      to: toState,
      validator: validator,
      createdAt: Date.now()
    };
    
    this.transitions.set(transitionKey, transition);
    
    if (this.config.enableLogging) {
      logger.debug(`Added transition: ${transitionKey}`);
    }
    
    if (this.config.enableEvents) {
      this.emit('transition-added', { transition, timestamp: Date.now() });
    }
    
    return this;
  }

  /**
   * Reset state machine to initial state
   */
  async reset(initialState = 'idle', clearHistory = false) {
    const oldState = this.currentState;
    
    this.currentState = initialState;
    this.previousState = null;
    
    if (clearHistory) {
      this.stateHistory = [];
    }
    
    this.metadata.transitionCount = 0;
    this.metadata.lastTransition = null;
    
    // Record reset
    this.recordStateChange(oldState, initialState, { reset: true, clearHistory });
    
    if (this.config.enableLogging) {
      logger.info(`State machine reset: ${oldState} -> ${initialState}`, { clearHistory });
    }
    
    if (this.config.enableEvents) {
      this.emit('reset', {
        from: oldState,
        to: initialState,
        clearHistory,
        timestamp: Date.now()
      });
    }
    
    return this;
  }

  /**
   * Get state transition history
   */
  getHistory(limit = null) {
    const history = limit ? this.stateHistory.slice(-limit) : [...this.stateHistory];
    
    return {
      history,
      totalTransitions: this.metadata.transitionCount,
      averageStateTime: this.calculateAverageStateTime(),
      currentStateDuration: this.getCurrentStateDuration(),
      stateDistribution: this.calculateStateDistribution()
    };
  }

  /**
   * Get all possible transitions from current state
   */
  getAvailableTransitions() {
    const available = [];
    
    for (const [key, transition] of this.transitions) {
      if (transition.from === this.currentState) {
        available.push({
          to: transition.to,
          key,
          validator: transition.validator !== null
        });
      }
    }
    
    return available;
  }

  /**
   * Get all states in the state machine
   */
  getAllStates() {
    return {
      states: Array.from(this.states),
      current: this.currentState,
      previous: this.previousState,
      totalStates: this.states.size
    };
  }

  /**
   * Get all transitions in the state machine
   */
  getAllTransitions() {
    const transitions = [];
    
    for (const [key, transition] of this.transitions) {
      transitions.push({
        key,
        from: transition.from,
        to: transition.to,
        hasValidator: transition.validator !== null,
        createdAt: transition.createdAt
      });
    }
    
    return transitions;
  }

  /**
   * Validate state machine configuration
   */
  validate() {
    const issues = [];
    
    // Check for unreachable states
    const reachableStates = new Set([this.currentState]);
    const queue = [this.currentState];
    
    while (queue.length > 0) {
      const state = queue.shift();
      
      for (const [key, transition] of this.transitions) {
        if (transition.from === state && !reachableStates.has(transition.to)) {
          reachableStates.add(transition.to);
          queue.push(transition.to);
        }
      }
    }
    
    for (const state of this.states) {
      if (!reachableStates.has(state)) {
        issues.push(`Unreachable state: ${state}`);
      }
    }
    
    // Check for states without outgoing transitions
    for (const state of this.states) {
      const hasOutgoing = Array.from(this.transitions.values())
        .some(t => t.from === state);
      
      if (!hasOutgoing && state !== 'terminated') {
        issues.push(`State without outgoing transitions: ${state}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      stats: {
        states: this.states.size,
        transitions: this.transitions.size,
        reachableStates: reachableStates.size
      }
    };
  }

  // Helper methods
  
  recordStateChange(fromState, toState, context) {
    const record = {
      from: fromState,
      to: toState,
      timestamp: Date.now(),
      context: context || {}
    };
    
    this.stateHistory.push(record);
    
    // Trim history if it exceeds max length
    if (this.stateHistory.length > this.config.maxHistoryLength) {
      this.stateHistory = this.stateHistory.slice(-this.config.maxHistoryLength);
    }
  }
  
  calculateAverageStateTime() {
    if (this.stateHistory.length < 2) return 0;
    
    let totalTime = 0;
    for (let i = 1; i < this.stateHistory.length; i++) {
      totalTime += this.stateHistory[i].timestamp - this.stateHistory[i - 1].timestamp;
    }
    
    return totalTime / (this.stateHistory.length - 1);
  }
  
  getCurrentStateDuration() {
    if (this.stateHistory.length === 0) return 0;
    
    const lastTransition = this.stateHistory[this.stateHistory.length - 1];
    return Date.now() - lastTransition.timestamp;
  }
  
  calculateStateDistribution() {
    const distribution = {};
    
    for (const record of this.stateHistory) {
      const state = record.to;
      distribution[state] = (distribution[state] || 0) + 1;
    }
    
    return distribution;
  }
}

module.exports = { AgentStateMachine };