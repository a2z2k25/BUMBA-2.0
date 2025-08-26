/**
 * Single Specialist Pool - Sprint 1 Foundation
 * A complete lifecycle implementation for ONE specialist
 * Isolated from existing systems to prevent breaking changes
 */

const { EventEmitter } = require('events');

/**
 * Specialist States
 */
const SpecialistState = {
  COLD: 'cold',           // Not in memory, needs full initialization
  WARMING: 'warming',     // Loading into memory
  WARM: 'warm',          // Ready in memory, not active
  ACTIVE: 'active',      // Currently processing tasks
  COOLING: 'cooling',    // Releasing resources
  ERROR: 'error'         // Error state
};

/**
 * State Transition Rules
 */
const STATE_TRANSITIONS = {
  [SpecialistState.COLD]: [SpecialistState.WARMING],
  [SpecialistState.WARMING]: [SpecialistState.WARM, SpecialistState.ERROR],
  [SpecialistState.WARM]: [SpecialistState.ACTIVE, SpecialistState.COOLING],
  [SpecialistState.ACTIVE]: [SpecialistState.WARM, SpecialistState.COOLING, SpecialistState.ERROR],
  [SpecialistState.COOLING]: [SpecialistState.COLD, SpecialistState.WARMING],
  [SpecialistState.ERROR]: [SpecialistState.COLD]
};

/**
 * Memory Usage by State (in MB)
 */
const MEMORY_BY_STATE = {
  [SpecialistState.COLD]: 0.1,      // Minimal metadata only
  [SpecialistState.WARMING]: 2.5,   // Loading resources
  [SpecialistState.WARM]: 5.0,      // Full context loaded
  [SpecialistState.ACTIVE]: 7.5,    // Working memory + context
  [SpecialistState.COOLING]: 2.5,   // Releasing resources
  [SpecialistState.ERROR]: 0.5      // Error info retained
};

/**
 * Response Times by State (in ms)
 */
const RESPONSE_TIME = {
  COLD_START: 1000,    // Time to warm up from cold
  WARM_START: 50,      // Time to activate from warm
  TASK_EXECUTION: 100  // Time to execute a task
};

/**
 * Single Specialist Pool
 */
class SingleSpecialistPool extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      specialistType: config.specialistType || 'backend-engineer',
      department: config.department || 'BACKEND',
      autoWarmThreshold: config.autoWarmThreshold || 3, // Auto-warm after 3 uses
      cooldownTime: config.cooldownTime || 30000,       // 30 seconds idle before cooling
      maxMemory: config.maxMemory || 10,                 // Max 10MB per specialist
      verbose: config.verbose !== false
    };
    
    // Specialist info
    this.specialist = {
      id: `specialist-${Date.now()}`,
      type: this.config.specialistType,
      department: this.config.department,
      state: SpecialistState.COLD,
      context: null,
      capabilities: null
    };
    
    // State tracking
    this.stateHistory = [];
    this.transitionCount = 0;
    
    // Performance metrics
    this.metrics = {
      memoryUsage: MEMORY_BY_STATE[SpecialistState.COLD],
      lastStateChange: Date.now(),
      totalWarmTime: 0,
      totalActiveTime: 0,
      taskCount: 0,
      usageScore: 0,
      lastUsed: null,
      coldStarts: 0,
      warmStarts: 0
    };
    
    // Timers
    this.cooldownTimer = null;
    
    // Usage tracking
    this.usageHistory = [];
    
    this.log(`🟢 SingleSpecialistPool initialized for ${this.config.specialistType}`);
  }
  
  /**
   * Get current state
   */
  getState() {
    return this.specialist.state;
  }
  
  /**
   * Check if transition is valid
   */
  canTransition(toState) {
    const allowedTransitions = STATE_TRANSITIONS[this.specialist.state] || [];
    return allowedTransitions.includes(toState);
  }
  
  /**
   * Transition to new state
   */
  async transitionTo(newState, reason = '') {
    const oldState = this.specialist.state;
    
    // Check if transition is valid
    if (!this.canTransition(newState)) {
      const error = `Invalid transition: ${oldState} → ${newState}`;
      this.log(`🔴 ${error}`);
      throw new Error(error);
    }
    
    // Record state change
    const stateChange = {
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      reason
    };
    
    this.stateHistory.push(stateChange);
    this.transitionCount++;
    
    // Update state
    this.specialist.state = newState;
    
    // Update memory usage
    this.metrics.memoryUsage = MEMORY_BY_STATE[newState];
    this.metrics.lastStateChange = Date.now();
    
    // Execute state-specific logic
    await this.executeStateLogic(newState, oldState);
    
    // Emit event
    this.emit('stateChanged', {
      specialist: this.specialist.id,
      from: oldState,
      to: newState,
      memory: this.metrics.memoryUsage,
      reason
    });
    
    this.log(`🏁 State transition: ${oldState} → ${newState} (${reason})`);
    this.log(`  Memory: ${this.metrics.memoryUsage}MB`);
    
    return stateChange;
  }
  
  /**
   * Execute state-specific logic
   */
  async executeStateLogic(state, previousState) {
    switch (state) {
      case SpecialistState.WARMING:
        await this.warmUp();
        // Auto-transition to WARM after warming up
        if (this.specialist.state === SpecialistState.WARMING) {
          await this.transitionTo(SpecialistState.WARM, 'warm-up complete');
        }
        break;
        
      case SpecialistState.WARM:
        this.startCooldownTimer();
        break;
        
      case SpecialistState.ACTIVE:
        this.cancelCooldownTimer();
        this.metrics.lastUsed = Date.now();
        break;
        
      case SpecialistState.COOLING:
        await this.coolDown();
        break;
        
      case SpecialistState.COLD:
        this.releaseResources();
        break;
    }
  }
  
  /**
   * Warm up specialist (COLD → WARMING → WARM)
   */
  async warmUp() {
    const startTime = Date.now();
    
    // Simulate loading context and capabilities
    await this.delay(RESPONSE_TIME.COLD_START);
    
    // Load context
    this.specialist.context = {
      knowledge: `${this.config.specialistType} knowledge base`,
      tools: ['analyzer', 'generator', 'validator'],
      memory: new Array(1000).fill('context-data'), // Simulate memory usage
      loadedAt: Date.now()
    };
    
    // Load capabilities
    this.specialist.capabilities = {
      tasks: ['analysis', 'implementation', 'review'],
      maxConcurrent: 3,
      performance: { speed: 0.8, quality: 0.9 }
    };
    
    const warmTime = Date.now() - startTime;
    this.metrics.totalWarmTime += warmTime;
    
    // Don't auto-transition here, let executeStateLogic handle it
  }
  
  /**
   * Cool down specialist (WARM/ACTIVE → COOLING → COLD)
   */
  async coolDown() {
    // Simulate releasing resources
    await this.delay(500);
    
    // Clear some context but keep metadata
    if (this.specialist.context) {
      delete this.specialist.context.memory;
      this.specialist.context.unloadedAt = Date.now();
    }
    
    // Auto-transition to COLD
    await this.transitionTo(SpecialistState.COLD, 'cooldown complete');
  }
  
  /**
   * Release all resources
   */
  releaseResources() {
    this.specialist.context = null;
    this.specialist.capabilities = null;
    this.cancelCooldownTimer();
  }
  
  /**
   * Start cooldown timer
   */
  startCooldownTimer() {
    this.cancelCooldownTimer();
    
    this.cooldownTimer = setTimeout(async () => {
      if (this.specialist.state === SpecialistState.WARM) {
        await this.transitionTo(SpecialistState.COOLING, 'idle timeout');
      }
    }, this.config.cooldownTime);
  }
  
  /**
   * Cancel cooldown timer
   */
  cancelCooldownTimer() {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
  
  /**
   * Execute a task
   */
  async executeTask(task) {
    const startTime = Date.now();
    let responseTime = 0;
    
    // Ensure specialist is ready
    if (this.specialist.state === SpecialistState.COLD) {
      // Cold start
      this.metrics.coldStarts++;
      await this.transitionTo(SpecialistState.WARMING, 'task requested');
      responseTime += RESPONSE_TIME.COLD_START;
    }
    
    if (this.specialist.state === SpecialistState.WARM) {
      // Warm start
      this.metrics.warmStarts++;
      await this.transitionTo(SpecialistState.ACTIVE, 'executing task');
      responseTime += RESPONSE_TIME.WARM_START;
    }
    
    // Execute task
    await this.delay(RESPONSE_TIME.TASK_EXECUTION);
    responseTime += RESPONSE_TIME.TASK_EXECUTION;
    
    // Update metrics
    this.metrics.taskCount++;
    this.metrics.usageScore = Math.min(1.0, this.metrics.taskCount / 10);
    this.metrics.totalActiveTime += responseTime;
    
    // Record usage
    this.usageHistory.push({
      timestamp: Date.now(),
      task: task.id || 'unknown',
      responseTime,
      state: this.specialist.state,
      memory: this.metrics.memoryUsage
    });
    
    // Return to WARM state
    if (this.specialist.state === SpecialistState.ACTIVE) {
      await this.transitionTo(SpecialistState.WARM, 'task complete');
    }
    
    const result = {
      success: true,
      specialist: this.specialist.id,
      task: task.id || 'unknown',
      responseTime,
      startState: responseTime > 500 ? 'cold' : 'warm',
      memory: this.metrics.memoryUsage
    };
    
    this.log(`🏁 Task executed in ${responseTime}ms (${result.startState} start)`);
    
    return result;
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.stateHistory[0]?.timestamp || 0;
    
    return {
      specialist: {
        id: this.specialist.id,
        type: this.specialist.type,
        state: this.specialist.state
      },
      memory: {
        current: this.metrics.memoryUsage,
        peak: Math.max(...Object.values(MEMORY_BY_STATE)),
        average: this.calculateAverageMemory()
      },
      performance: {
        taskCount: this.metrics.taskCount,
        coldStarts: this.metrics.coldStarts,
        warmStarts: this.metrics.warmStarts,
        avgResponseTime: this.metrics.taskCount > 0 
          ? this.metrics.totalActiveTime / this.metrics.taskCount 
          : 0,
        usageScore: this.metrics.usageScore
      },
      lifecycle: {
        currentState: this.specialist.state,
        transitions: this.transitionCount,
        uptime: uptime,
        idleTime: this.specialist.state === SpecialistState.WARM 
          ? now - this.metrics.lastUsed 
          : 0
      },
      efficiency: {
        warmHitRate: this.metrics.taskCount > 0
          ? this.metrics.warmStarts / this.metrics.taskCount
          : 0,
        memoryEfficiency: this.calculateMemoryEfficiency(),
        stateDistribution: this.calculateStateDistribution()
      }
    };
  }
  
  /**
   * Calculate average memory usage
   */
  calculateAverageMemory() {
    // Calculate based on time spent in each state
    const stateDistribution = this.calculateStateDistribution();
    let weightedMemory = 0;
    
    for (const [state, percentage] of Object.entries(stateDistribution)) {
      const stateMemory = MEMORY_BY_STATE[state] || 0;
      weightedMemory += (stateMemory * percentage / 100);
    }
    
    return weightedMemory;
  }
  
  /**
   * Calculate memory efficiency (vs always-warm)
   */
  calculateMemoryEfficiency() {
    const alwaysWarmMemory = MEMORY_BY_STATE[SpecialistState.WARM];
    const ourAvgMemory = this.calculateAverageMemory();
    
    if (alwaysWarmMemory === 0) return 0;
    
    const saved = alwaysWarmMemory - ourAvgMemory;
    return (saved / alwaysWarmMemory) * 100; // Percentage saved
  }
  
  /**
   * Calculate time spent in each state
   */
  calculateStateDistribution() {
    const distribution = {};
    let lastTimestamp = this.stateHistory[0]?.timestamp || Date.now();
    let lastState = SpecialistState.COLD;
    
    for (const change of this.stateHistory) {
      const duration = change.timestamp - lastTimestamp;
      distribution[lastState] = (distribution[lastState] || 0) + duration;
      lastTimestamp = change.timestamp;
      lastState = change.to;
    }
    
    // Add current state duration
    const currentDuration = Date.now() - lastTimestamp;
    distribution[this.specialist.state] = 
      (distribution[this.specialist.state] || 0) + currentDuration;
    
    // Convert to percentages
    const total = Object.values(distribution).reduce((sum, d) => sum + d, 0);
    const percentages = {};
    
    for (const [state, duration] of Object.entries(distribution)) {
      percentages[state] = total > 0 ? (duration / total) * 100 : 0;
    }
    
    return percentages;
  }
  
  /**
   * Utility: delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Logging helper
   */
  log(message) {
    if (this.config.verbose) {
      console.log(`[SingleSpecialistPool] ${message}`);
    }
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.cancelCooldownTimer();
    this.releaseResources();
    this.removeAllListeners();
    this.log('🔴 SingleSpecialistPool destroyed');
  }
}

module.exports = { SingleSpecialistPool, SpecialistState, MEMORY_BY_STATE, RESPONSE_TIME };