/**
 * BUMBA Agent Lifecycle State Machine
 * Manages the complete lifecycle of dynamically spawned agents
 * States: idle → spawning → active → validating → deprecating → deprecated
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');

/**
 * Agent Lifecycle States
 */
const AgentState = {
  IDLE: 'idle', // Agent doesn't exist yet
  SPAWNING: 'spawning', // Agent is being created
  ACTIVE: 'active', // Agent is working on tasks
  VALIDATING: 'validating', // Manager is validating work
  DEPRECATING: 'deprecating', // Agent is being shut down
  DEPRECATED: 'deprecated' // Agent has been removed
};

/**
 * State Transition Events
 */
const StateEvent = {
  SPAWN: 'spawn',
  ACTIVATE: 'activate',
  VALIDATE: 'validate',
  DEPRECATE: 'deprecate',
  COMPLETE: 'complete',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

/**
 * Agent Lifecycle State Machine
 */
class AgentLifecycleStateMachine extends EventEmitter {
  constructor(agentId, config = {}) {
    super();
    
    this.agentId = agentId;
    this.currentState = AgentState.IDLE;
    this.previousState = null;
    this.stateHistory = [];
    this.metadata = {};
    
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
    
    // Configuration
    this.config = {
      maxIdleTime: config.maxIdleTime || 300000, // 5 minutes
      maxActiveTime: config.maxActiveTime || 1800000, // 30 minutes
      maxValidationTime: config.maxValidationTime || 60000, // 1 minute
      autoDeprecate: config.autoDeprecate !== false,
      storeHistory: config.storeHistory !== false,
      ...config
    };
    
    // Timers
    this.timers = {
      idle: null,
      active: null,
      validation: null
    };
    
    // Statistics
    this.stats = {
      createdAt: Date.now(),
      lastStateChange: Date.now(),
      totalTransitions: 0,
      timeInStates: {},
      errors: []
    };
    
    // Initialize time tracking for each state
    Object.values(AgentState).forEach(state => {
      this.stats.timeInStates[state] = 0;
    });
    
    // State transition rules
    this.transitions = this.defineTransitions();
    
    // Register lifecycle hooks
    this.registerLifecycleHooks();
    
    // Start tracking
    this.startTracking();
  }
  
  /**
   * Register lifecycle hooks
   */
  registerLifecycleHooks() {
    // Register beforeStateTransition hook
    this.hooks.register('lifecycle:beforeTransition', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 100,
      description: 'Execute before state transition',
      schema: {
        agentId: 'string',
        currentState: 'string',
        event: 'string',
        targetState: 'string',
        context: 'object'
      }
    });
    
    // Register validateStateTransition hook
    this.hooks.register('lifecycle:validateTransition', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 100,
      description: 'Validate state transition',
      schema: {
        agentId: 'string',
        transition: 'object',
        valid: 'boolean',
        errors: 'array'
      }
    });
    
    // Register modifyStateTransition hook
    this.hooks.register('lifecycle:modifyTransition', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 75,
      description: 'Modify state transition',
      schema: {
        agentId: 'string',
        transition: 'object',
        modifications: 'object'
      }
    });
    
    // Register afterStateTransition hook
    this.hooks.register('lifecycle:afterTransition', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute after state transition',
      schema: {
        agentId: 'string',
        previousState: 'string',
        currentState: 'string',
        duration: 'number'
      }
    });
    
    // Register onStateError hook
    this.hooks.register('lifecycle:onError', async (ctx) => ({ success: true }), {
      category: 'error',
      priority: 100,
      description: 'Handle state transition error',
      schema: {
        agentId: 'string',
        error: 'object',
        state: 'string',
        recovery: 'object'
      }
    });
    
    logger.info(`🏁 Lifecycle hooks registered for agent ${this.agentId}`);
  }
  
  /**
   * Define valid state transitions
   */
  defineTransitions() {
    return {
      [AgentState.IDLE]: {
        [StateEvent.SPAWN]: AgentState.SPAWNING
      },
      [AgentState.SPAWNING]: {
        [StateEvent.ACTIVATE]: AgentState.ACTIVE,
        [StateEvent.ERROR]: AgentState.IDLE,
        [StateEvent.TIMEOUT]: AgentState.IDLE
      },
      [AgentState.ACTIVE]: {
        [StateEvent.VALIDATE]: AgentState.VALIDATING,
        [StateEvent.DEPRECATE]: AgentState.DEPRECATING,
        [StateEvent.ERROR]: AgentState.DEPRECATING,
        [StateEvent.TIMEOUT]: AgentState.DEPRECATING
      },
      [AgentState.VALIDATING]: {
        [StateEvent.ACTIVATE]: AgentState.ACTIVE, // More work needed
        [StateEvent.DEPRECATE]: AgentState.DEPRECATING, // Work complete
        [StateEvent.ERROR]: AgentState.ACTIVE, // Validation failed
        [StateEvent.TIMEOUT]: AgentState.DEPRECATING
      },
      [AgentState.DEPRECATING]: {
        [StateEvent.COMPLETE]: AgentState.DEPRECATED,
        [StateEvent.ERROR]: AgentState.DEPRECATED, // Force deprecation
        [StateEvent.TIMEOUT]: AgentState.DEPRECATED
      },
      [AgentState.DEPRECATED]: {
        // Terminal state - no transitions
      }
    };
  }
  
  /**
   * Transition to a new state
   */
  async transition(event, data = {}) {
    const fromState = this.currentState;
    const validTransitions = this.transitions[fromState];
    
    if (!validTransitions) {
      throw new Error(`No transitions defined from state: ${fromState}`);
    }
    
    const toState = validTransitions[event];
    
    if (!toState) {
      throw new Error(`Invalid transition: ${event} from ${fromState}`);
    }
    
    // Execute beforeTransition hook
    const beforeContext = await this.hooks.execute('lifecycle:beforeTransition', {
      agentId: this.agentId,
      currentState: fromState,
      event,
      targetState: toState,
      context: data
    });
    
    // Check if hook prevents transition
    if (beforeContext.preventDefault) {
      logger.warn(`🔴 Transition prevented by hook: ${fromState} → ${toState} for ${this.agentId}`);
      return false;
    }
    
    // Execute validation hook
    const validationContext = await this.hooks.execute('lifecycle:validateTransition', {
      agentId: this.agentId,
      transition: { from: fromState, to: toState, event },
      valid: true,
      errors: []
    });
    
    if (!validationContext.valid) {
      throw new Error(`Transition validation failed: ${validationContext.errors.join(', ')}`);
    }
    
    // Execute modification hook
    const modifyContext = await this.hooks.execute('lifecycle:modifyTransition', {
      agentId: this.agentId,
      transition: { from: fromState, to: toState, event, data },
      modifications: {}
    });
    
    // Apply modifications
    if (modifyContext.modifications) {
      Object.assign(data, modifyContext.modifications);
    }
    
    // Check if transition is allowed
    if (!this.canTransition(fromState, toState, data)) {
      logger.warn(`🔴 Transition blocked: ${fromState} → ${toState} for ${this.agentId}`);
      return false;
    }
    
    // Update state timing
    this.updateStateTime(fromState);
    
    // Store previous state
    this.previousState = fromState;
    
    // Update current state
    this.currentState = toState;
    this.stats.lastStateChange = Date.now();
    this.stats.totalTransitions++;
    
    // Store in history
    if (this.config.storeHistory) {
      this.stateHistory.push({
        from: fromState,
        to: toState,
        event,
        timestamp: Date.now(),
        data
      });
    }
    
    // Clear relevant timers
    this.clearTimers(fromState);
    
    // Set new timers
    this.setTimers(toState);
    
    // Log transition
    logger.info(`🟢 Agent ${this.agentId}: ${fromState} → ${toState} (${event})`);
    
    // Emit state change event
    this.emit('stateChange', {
      agentId: this.agentId,
      from: fromState,
      to: toState,
      event,
      data
    });
    
    // Emit specific state events
    this.emit(`enter:${toState}`, {
      agentId: this.agentId,
      previousState: fromState,
      data
    });
    
    // Handle state-specific logic
    await this.handleStateEntry(toState, data);
    
    return true;
  }
  
  /**
   * Check if transition is allowed
   */
  canTransition(from, to, data) {
    // Add custom validation logic here
    // For example, check resource availability before spawning
    
    if (to === AgentState.SPAWNING) {
      // Check if resources are available
      if (data.resourceCheck === false) {
        return false;
      }
    }
    
    if (to === AgentState.DEPRECATED) {
      // Ensure cleanup is possible
      if (data.forceDeprecate !== true && this.hasActiveTasks()) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Handle state entry logic
   */
  async handleStateEntry(state, data) {
    switch (state) {
      case AgentState.SPAWNING:
        this.metadata.spawnStartTime = Date.now();
        this.metadata.spawnData = data;
        break;
        
      case AgentState.ACTIVE:
        this.metadata.activationTime = Date.now();
        this.metadata.taskCount = 0;
        break;
        
      case AgentState.VALIDATING:
        this.metadata.validationStartTime = Date.now();
        this.metadata.validationData = data;
        break;
        
      case AgentState.DEPRECATING:
        this.metadata.deprecationStartTime = Date.now();
        this.metadata.deprecationReason = data.reason || 'normal';
        break;
        
      case AgentState.DEPRECATED:
        this.metadata.deprecatedAt = Date.now();
        this.cleanup();
        break;
    }
  }
  
  /**
   * Set timers for automatic transitions
   */
  setTimers(state) {
    switch (state) {
      case AgentState.IDLE:
        if (this.config.autoDeprecate) {
          this.timers.idle = setTimeout(() => {
            this.transition(StateEvent.TIMEOUT, { reason: 'idle_timeout' });
          }, this.config.maxIdleTime);
        }
        break;
        
      case AgentState.ACTIVE:
        if (this.config.maxActiveTime) {
          this.timers.active = setTimeout(() => {
            this.transition(StateEvent.TIMEOUT, { reason: 'active_timeout' });
          }, this.config.maxActiveTime);
        }
        break;
        
      case AgentState.VALIDATING:
        this.timers.validation = setTimeout(() => {
          this.transition(StateEvent.TIMEOUT, { reason: 'validation_timeout' });
        }, this.config.maxValidationTime);
        break;
    }
  }
  
  /**
   * Clear timers when leaving a state
   */
  clearTimers(state) {
    switch (state) {
      case AgentState.IDLE:
        if (this.timers.idle) {
          clearTimeout(this.timers.idle);
          this.timers.idle = null;
        }
        break;
        
      case AgentState.ACTIVE:
        if (this.timers.active) {
          clearTimeout(this.timers.active);
          this.timers.active = null;
        }
        break;
        
      case AgentState.VALIDATING:
        if (this.timers.validation) {
          clearTimeout(this.timers.validation);
          this.timers.validation = null;
        }
        break;
    }
  }
  
  /**
   * Update time spent in state
   */
  updateStateTime(state) {
    const timeInState = Date.now() - this.stats.lastStateChange;
    this.stats.timeInStates[state] += timeInState;
  }
  
  /**
   * Check if agent has active tasks
   */
  hasActiveTasks() {
    return this.metadata.taskCount && this.metadata.taskCount > 0;
  }
  
  /**
   * Start tracking agent lifecycle
   */
  startTracking() {
    // Set initial idle timer if auto-deprecate is enabled
    if (this.config.autoDeprecate && this.currentState === AgentState.IDLE) {
      this.setTimers(AgentState.IDLE);
    }
    
    // Emit lifecycle started event
    this.emit('lifecycle:started', {
      agentId: this.agentId,
      config: this.config
    });
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Clear all timers
    Object.keys(this.timers).forEach(timer => {
      if (this.timers[timer]) {
        clearTimeout(this.timers[timer]);
        this.timers[timer] = null;
      }
    });
    
    // Update final state time
    this.updateStateTime(this.currentState);
    
    // Emit cleanup event
    this.emit('lifecycle:ended', {
      agentId: this.agentId,
      stats: this.getStatistics()
    });
    
    // Remove all listeners
    this.removeAllListeners();
  }
  
  /**
   * Force deprecation
   */
  async forceDeprecate(reason = 'forced') {
    logger.warn(`🟡 Force deprecating agent ${this.agentId}`);
    
    // Try normal deprecation first
    try {
      await this.transition(StateEvent.DEPRECATE, { 
        reason, 
        forceDeprecate: true 
      });
    } catch (error) {
      // If that fails, go directly to deprecated
      this.currentState = AgentState.DEPRECATED;
      this.cleanup();
    }
  }
  
  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }
  
  /**
   * Check if in specific state
   */
  isInState(state) {
    return this.currentState === state;
  }
  
  /**
   * Check if agent is available for work
   */
  isAvailable() {
    return this.currentState === AgentState.ACTIVE;
  }
  
  /**
   * Check if agent is terminated
   */
  isTerminated() {
    return this.currentState === AgentState.DEPRECATED;
  }
  
  /**
   * Get lifecycle statistics
   */
  getStatistics() {
    const totalTime = Date.now() - this.stats.createdAt;
    const statistics = {
      ...this.stats,
      currentState: this.currentState,
      totalLifetime: totalTime,
      statePercentages: {}
    };
    
    // Calculate percentage time in each state
    Object.entries(this.stats.timeInStates).forEach(([state, time]) => {
      statistics.statePercentages[state] = totalTime > 0 
        ? ((time / totalTime) * 100).toFixed(2) + '%'
        : '0%';
    });
    
    return statistics;
  }
  
  /**
   * Get state history
   */
  getHistory() {
    return this.stateHistory;
  }
  
  /**
   * Get metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }
  
  /**
   * Update metadata
   */
  updateMetadata(updates) {
    this.metadata = { ...this.metadata, ...updates };
  }
  
  /**
   * Record error
   */
  recordError(error) {
    this.stats.errors.push({
      timestamp: Date.now(),
      state: this.currentState,
      error: error.message || error,
      stack: error.stack
    });
  }
}

/**
 * Lifecycle Manager for multiple agents
 */
class AgentLifecycleManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.agents = new Map();
    this.config = {
      maxAgents: config.maxAgents || 50,
      enableMetrics: config.enableMetrics !== false,
      ...config
    };
    
    this.metrics = {
      totalSpawned: 0,
      totalDeprecated: 0,
      activeAgents: 0,
      stateDistribution: {}
    };
    
    // Initialize state distribution
    Object.values(AgentState).forEach(state => {
      this.metrics.stateDistribution[state] = 0;
    });
  }
  
  /**
   * Create a new agent lifecycle
   */
  createAgent(agentId, config = {}) {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }
    
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum agent limit (${this.config.maxAgents}) reached`);
    }
    
    const stateMachine = new AgentLifecycleStateMachine(agentId, config);
    
    // Subscribe to state changes
    stateMachine.on('stateChange', (data) => {
      this.handleStateChange(data);
    });
    
    stateMachine.on('lifecycle:ended', (data) => {
      this.handleLifecycleEnd(data);
    });
    
    this.agents.set(agentId, stateMachine);
    this.metrics.totalSpawned++;
    
    logger.info(`🏁 Created lifecycle for agent ${agentId}`);
    
    return stateMachine;
  }
  
  /**
   * Get agent lifecycle
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }
  
  /**
   * Remove agent
   */
  removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.cleanup();
      this.agents.delete(agentId);
      this.metrics.totalDeprecated++;
      logger.info(`🟢️ Removed agent ${agentId} from lifecycle manager`);
    }
  }
  
  /**
   * Handle state changes
   */
  handleStateChange(data) {
    if (this.config.enableMetrics) {
      this.updateMetrics();
    }
    
    this.emit('agent:stateChange', data);
  }
  
  /**
   * Handle lifecycle end
   */
  handleLifecycleEnd(data) {
    this.removeAgent(data.agentId);
    this.emit('agent:deprecated', data);
  }
  
  /**
   * Update metrics
   */
  updateMetrics() {
    // Reset state distribution
    Object.keys(this.metrics.stateDistribution).forEach(state => {
      this.metrics.stateDistribution[state] = 0;
    });
    
    // Count agents in each state
    let activeCount = 0;
    this.agents.forEach(agent => {
      const state = agent.getState();
      this.metrics.stateDistribution[state]++;
      
      if (state === AgentState.ACTIVE) {
        activeCount++;
      }
    });
    
    this.metrics.activeAgents = activeCount;
  }
  
  /**
   * Get all agents in specific state
   */
  getAgentsInState(state) {
    const agents = [];
    this.agents.forEach((agent, id) => {
      if (agent.getState() === state) {
        agents.push({
          id,
          agent,
          stats: agent.getStatistics()
        });
      }
    });
    return agents;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    this.updateMetrics();
    return {
      ...this.metrics,
      totalAgents: this.agents.size,
      utilization: this.config.maxAgents > 0 
        ? (this.agents.size / this.config.maxAgents * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  /**
   * Force deprecate all agents
   */
  async deprecateAll(reason = 'shutdown') {
    logger.warn(`🟡 Deprecating all ${this.agents.size} agents`);
    
    const promises = [];
    this.agents.forEach(agent => {
      promises.push(agent.forceDeprecate(reason));
    });
    
    await Promise.all(promises);
  }
  
  /**
   * Get summary
   */
  getSummary() {
    const summary = {
      totalAgents: this.agents.size,
      metrics: this.getMetrics(),
      agents: []
    };
    
    this.agents.forEach((agent, id) => {
      summary.agents.push({
        id,
        state: agent.getState(),
        stats: agent.getStatistics()
      });
    });
    
    return summary;
  }
}

// Export
module.exports = {
  AgentState,
  StateEvent,
  AgentLifecycleStateMachine,
  AgentLifecycleManager
};