/**
 * Executive Mode Manager
 * Comprehensive management system for executive operational modes
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Mode priorities
 */
const ModePriority = {
  CRISIS: 100,
  STRATEGIC: 90,
  OPERATIONAL: 70,
  TACTICAL: 50,
  MAINTENANCE: 30
};

/**
 * Mode transitions
 */
const ModeTransition = {
  IMMEDIATE: 'immediate',
  GRACEFUL: 'graceful',
  SCHEDULED: 'scheduled',
  EMERGENCY: 'emergency'
};

class ExecutiveModeManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.config = {
      enableAutomaticModeSwitch: true,
      enableModeHistory: true,
      enableModeValidation: true,
      enableOverrideProtection: true,
      modeHistoryLimit: 100,
      transitionTimeout: 5000,
      ...config
    };
    
    // Mode management state
    this.currentMode = null;
    this.previousMode = null;
    this.modeHistory = [];
    this.modeStack = [];
    this.transitions = new Map();
    this.locks = new Map();
    
    // Mode configurations
    this.modes = new Map();
    this.modeHandlers = new Map();
    this.modeValidators = new Map();
    
    // Performance tracking
    this.metrics = {
      transitions: 0,
      failedTransitions: 0,
      automaticSwitches: 0,
      overrides: 0,
      avgTransitionTime: 0
    };
    
    this.initializeModes();
    
    logger.info('🟢️ Executive Mode Manager initialized');
  }

  /**
   * Initialize default modes
   */
  initializeModes() {
    // Strategic Mode
    this.registerMode('strategic', {
      priority: ModePriority.STRATEGIC,
      description: 'Long-term strategic planning and vision setting',
      capabilities: [
        'vision_planning',
        'strategic_decisions',
        'major_investments',
        'organizational_restructuring',
        'market_expansion'
      ],
      requirements: {
        authorityLevel: 5,
        approvalRequired: false,
        timeLimit: null
      },
      transitions: {
        allowed: ['operational', 'crisis'],
        forbidden: ['maintenance'],
        conditions: {}
      }
    });
    
    // Operational Mode
    this.registerMode('operational', {
      priority: ModePriority.OPERATIONAL,
      description: 'Day-to-day operational management',
      capabilities: [
        'daily_operations',
        'resource_allocation',
        'team_management',
        'process_optimization',
        'performance_monitoring'
      ],
      requirements: {
        authorityLevel: 4,
        approvalRequired: false,
        timeLimit: null
      },
      transitions: {
        allowed: ['strategic', 'tactical', 'crisis', 'maintenance'],
        forbidden: [],
        conditions: {}
      }
    });
    
    // Tactical Mode
    this.registerMode('tactical', {
      priority: ModePriority.TACTICAL,
      description: 'Short-term tactical execution',
      capabilities: [
        'tactical_planning',
        'quick_wins',
        'optimization',
        'problem_solving',
        'rapid_deployment'
      ],
      requirements: {
        authorityLevel: 3,
        approvalRequired: false,
        timeLimit: 3600000 // 1 hour
      },
      transitions: {
        allowed: ['operational', 'crisis'],
        forbidden: ['strategic'],
        conditions: {
          operational: { minDuration: 300000 } // 5 minutes
        }
      }
    });
    
    // Crisis Mode
    this.registerMode('crisis', {
      priority: ModePriority.CRISIS,
      description: 'Emergency crisis management',
      capabilities: [
        'emergency_response',
        'override_all',
        'rapid_decision',
        'resource_mobilization',
        'damage_control'
      ],
      requirements: {
        authorityLevel: 5,
        approvalRequired: false,
        timeLimit: 7200000 // 2 hours
      },
      transitions: {
        allowed: ['operational', 'strategic'],
        forbidden: [],
        conditions: {
          operational: { cooldown: 1800000 } // 30 minutes
        }
      }
    });
    
    // Maintenance Mode
    this.registerMode('maintenance', {
      priority: ModePriority.MAINTENANCE,
      description: 'System maintenance and monitoring',
      capabilities: [
        'monitoring',
        'reporting',
        'minor_adjustments',
        'data_collection',
        'system_checks'
      ],
      requirements: {
        authorityLevel: 1,
        approvalRequired: false,
        timeLimit: null
      },
      transitions: {
        allowed: ['operational'],
        forbidden: ['strategic', 'crisis'],
        conditions: {}
      }
    });
    
    // Set default mode
    this.currentMode = 'operational';
    this.addToHistory('operational', 'initialization');
  }

  /**
   * Register a new mode
   */
  registerMode(modeName, config) {
    this.modes.set(modeName, {
      name: modeName,
      ...config,
      registered: Date.now()
    });
    
    logger.debug(`Mode registered: ${modeName}`);
  }

  /**
   * Register mode handler
   */
  registerHandler(modeName, handler) {
    if (!this.modes.has(modeName)) {
      throw new Error(`Unknown mode: ${modeName}`);
    }
    
    this.modeHandlers.set(modeName, handler);
    logger.debug(`Handler registered for mode: ${modeName}`);
  }

  /**
   * Register mode validator
   */
  registerValidator(modeName, validator) {
    if (!this.modes.has(modeName)) {
      throw new Error(`Unknown mode: ${modeName}`);
    }
    
    this.modeValidators.set(modeName, validator);
    logger.debug(`Validator registered for mode: ${modeName}`);
  }

  /**
   * Switch to a different mode
   */
  async switchMode(targetMode, options = {}) {
    const {
      reason = '',
      transition = ModeTransition.GRACEFUL,
      force = false,
      metadata = {}
    } = options;
    
    const startTime = Date.now();
    
    try {
      // Validate target mode exists
      if (!this.modes.has(targetMode)) {
        throw new Error(`Unknown mode: ${targetMode}`);
      }
      
      // Check if already in target mode
      if (this.currentMode === targetMode && !force) {
        return {
          success: true,
          message: 'Already in target mode',
          mode: targetMode
        };
      }
      
      // Check for mode lock
      if (this.isModeLocked(this.currentMode) && !force) {
        throw new Error(`Current mode is locked: ${this.currentMode}`);
      }
      
      // Validate transition
      if (this.config.enableModeValidation && !force) {
        const validation = await this.validateTransition(this.currentMode, targetMode);
        if (!validation.valid) {
          throw new Error(`Invalid transition: ${validation.reason}`);
        }
      }
      
      // Execute pre-transition hooks
      await this.executePreTransitionHooks(this.currentMode, targetMode);
      
      // Perform transition
      const previousMode = this.currentMode;
      this.previousMode = previousMode;
      
      // Handle different transition types
      switch (transition) {
        case ModeTransition.IMMEDIATE:
          this.currentMode = targetMode;
          break;
          
        case ModeTransition.GRACEFUL:
          await this.gracefulTransition(targetMode);
          break;
          
        case ModeTransition.SCHEDULED:
          await this.scheduledTransition(targetMode, metadata.scheduledTime);
          break;
          
        case ModeTransition.EMERGENCY:
          this.currentMode = targetMode;
          this.clearModeStack();
          break;
      }
      
      // Add to history
      this.addToHistory(targetMode, reason);
      
      // Execute post-transition hooks
      await this.executePostTransitionHooks(previousMode, targetMode);
      
      // Update metrics
      const transitionTime = Date.now() - startTime;
      this.updateMetrics(true, transitionTime);
      
      // Emit event
      this.emit('mode:switched', {
        from: previousMode,
        to: targetMode,
        reason,
        transition,
        duration: transitionTime
      });
      
      logger.info(`🔄 Mode switched: ${previousMode} → ${targetMode} (${reason})`);
      
      return {
        success: true,
        from: previousMode,
        to: targetMode,
        duration: transitionTime
      };
      
    } catch (error) {
      this.updateMetrics(false);
      logger.error(`Mode switch failed: ${error.message}`);
      
      this.emit('mode:switch:failed', {
        from: this.currentMode,
        to: targetMode,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Validate mode transition
   */
  async validateTransition(fromMode, toMode) {
    const from = this.modes.get(fromMode);
    const to = this.modes.get(toMode);
    
    if (!from || !to) {
      return {
        valid: false,
        reason: 'Invalid mode(s)'
      };
    }
    
    // Check if transition is allowed
    if (from.transitions.forbidden.includes(toMode)) {
      return {
        valid: false,
        reason: `Transition forbidden: ${fromMode} → ${toMode}`
      };
    }
    
    if (from.transitions.allowed.length > 0 && 
        !from.transitions.allowed.includes(toMode)) {
      return {
        valid: false,
        reason: `Transition not allowed: ${fromMode} → ${toMode}`
      };
    }
    
    // Check transition conditions
    const conditions = from.transitions.conditions[toMode];
    if (conditions) {
      if (conditions.minDuration) {
        const duration = Date.now() - this.getModeStartTime();
        if (duration < conditions.minDuration) {
          return {
            valid: false,
            reason: `Minimum duration not met: ${duration}ms < ${conditions.minDuration}ms`
          };
        }
      }
      
      if (conditions.cooldown) {
        const lastTransition = this.getLastTransitionFrom(toMode);
        if (lastTransition && Date.now() - lastTransition < conditions.cooldown) {
          return {
            valid: false,
            reason: `Cooldown period not met`
          };
        }
      }
    }
    
    // Run custom validator if registered
    const validator = this.modeValidators.get(toMode);
    if (validator) {
      const customValidation = await validator(fromMode, toMode);
      if (!customValidation.valid) {
        return customValidation;
      }
    }
    
    return { valid: true };
  }

  /**
   * Graceful transition
   */
  async gracefulTransition(targetMode) {
    // Save current state
    const state = await this.captureState();
    
    // Notify handlers
    const handler = this.modeHandlers.get(this.currentMode);
    if (handler && handler.onExit) {
      await handler.onExit(state);
    }
    
    // Switch mode
    this.currentMode = targetMode;
    
    // Initialize new mode
    const newHandler = this.modeHandlers.get(targetMode);
    if (newHandler && newHandler.onEnter) {
      await newHandler.onEnter(state);
    }
  }

  /**
   * Scheduled transition
   */
  async scheduledTransition(targetMode, scheduledTime) {
    const delay = scheduledTime - Date.now();
    
    if (delay <= 0) {
      this.currentMode = targetMode;
      return;
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentMode = targetMode;
        resolve();
      }, delay);
    });
  }

  /**
   * Push mode to stack
   */
  pushMode(mode, options = {}) {
    this.modeStack.push({
      mode: this.currentMode,
      timestamp: Date.now(),
      metadata: options.metadata || {}
    });
    
    return this.switchMode(mode, {
      ...options,
      transition: ModeTransition.IMMEDIATE
    });
  }

  /**
   * Pop mode from stack
   */
  async popMode() {
    if (this.modeStack.length === 0) {
      throw new Error('Mode stack is empty');
    }
    
    const previous = this.modeStack.pop();
    
    return this.switchMode(previous.mode, {
      reason: 'stack_pop',
      transition: ModeTransition.IMMEDIATE
    });
  }

  /**
   * Clear mode stack
   */
  clearModeStack() {
    this.modeStack = [];
  }

  /**
   * Lock current mode
   */
  lockMode(duration = null) {
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.locks.set(this.currentMode, {
      id: lockId,
      timestamp: Date.now(),
      duration,
      mode: this.currentMode
    });
    
    if (duration) {
      setTimeout(() => {
        this.unlockMode(lockId);
      }, duration);
    }
    
    this.emit('mode:locked', {
      mode: this.currentMode,
      lockId,
      duration
    });
    
    return lockId;
  }

  /**
   * Unlock mode
   */
  unlockMode(lockId = null) {
    if (lockId) {
      for (const [mode, lock] of this.locks) {
        if (lock.id === lockId) {
          this.locks.delete(mode);
          this.emit('mode:unlocked', { mode, lockId });
          return true;
        }
      }
      return false;
    }
    
    // Unlock current mode
    if (this.locks.has(this.currentMode)) {
      const lock = this.locks.get(this.currentMode);
      this.locks.delete(this.currentMode);
      this.emit('mode:unlocked', { 
        mode: this.currentMode, 
        lockId: lock.id 
      });
      return true;
    }
    
    return false;
  }

  /**
   * Check if mode is locked
   */
  isModeLocked(mode) {
    return this.locks.has(mode);
  }

  /**
   * Execute pre-transition hooks
   */
  async executePreTransitionHooks(fromMode, toMode) {
    this.emit('mode:transition:start', { from: fromMode, to: toMode });
    
    const handler = this.modeHandlers.get(fromMode);
    if (handler && handler.beforeExit) {
      await handler.beforeExit(toMode);
    }
  }

  /**
   * Execute post-transition hooks
   */
  async executePostTransitionHooks(fromMode, toMode) {
    const handler = this.modeHandlers.get(toMode);
    if (handler && handler.afterEnter) {
      await handler.afterEnter(fromMode);
    }
    
    this.emit('mode:transition:complete', { from: fromMode, to: toMode });
  }

  /**
   * Add to history
   */
  addToHistory(mode, reason) {
    if (!this.config.enableModeHistory) {
      return;
    }
    
    this.modeHistory.push({
      mode,
      reason,
      timestamp: Date.now(),
      previous: this.previousMode
    });
    
    // Limit history size
    if (this.modeHistory.length > this.config.modeHistoryLimit) {
      this.modeHistory = this.modeHistory.slice(-this.config.modeHistoryLimit);
    }
  }

  /**
   * Get mode start time
   */
  getModeStartTime() {
    const lastEntry = this.modeHistory
      .filter(h => h.mode === this.currentMode)
      .pop();
    
    return lastEntry ? lastEntry.timestamp : Date.now();
  }

  /**
   * Get last transition from mode
   */
  getLastTransitionFrom(mode) {
    const lastEntry = this.modeHistory
      .filter(h => h.previous === mode)
      .pop();
    
    return lastEntry ? lastEntry.timestamp : null;
  }

  /**
   * Capture current state
   */
  async captureState() {
    return {
      mode: this.currentMode,
      previousMode: this.previousMode,
      timestamp: Date.now(),
      stack: [...this.modeStack],
      locks: Array.from(this.locks.entries()),
      metadata: {}
    };
  }

  /**
   * Update metrics
   */
  updateMetrics(success, transitionTime = 0) {
    this.metrics.transitions++;
    
    if (!success) {
      this.metrics.failedTransitions++;
    }
    
    if (transitionTime > 0) {
      const prevAvg = this.metrics.avgTransitionTime;
      const count = this.metrics.transitions - this.metrics.failedTransitions;
      this.metrics.avgTransitionTime = (prevAvg * (count - 1) + transitionTime) / count;
    }
  }

  /**
   * Automatically detect and switch modes
   */
  async autoDetectMode(context = {}) {
    if (!this.config.enableAutomaticModeSwitch) {
      return null;
    }
    
    // Check for crisis conditions
    if (context.crisis || context.emergency) {
      this.metrics.automaticSwitches++;
      return this.switchMode('crisis', {
        reason: 'auto_crisis_detection',
        transition: ModeTransition.EMERGENCY
      });
    }
    
    // Check for maintenance requirements
    if (context.maintenance || context.systemDown) {
      this.metrics.automaticSwitches++;
      return this.switchMode('maintenance', {
        reason: 'auto_maintenance_required',
        transition: ModeTransition.GRACEFUL
      });
    }
    
    // Check for strategic planning periods
    if (context.planningSession || context.quarterlyReview) {
      this.metrics.automaticSwitches++;
      return this.switchMode('strategic', {
        reason: 'auto_strategic_planning',
        transition: ModeTransition.SCHEDULED,
        metadata: { scheduledTime: context.scheduledTime }
      });
    }
    
    return null;
  }

  /**
   * Override current mode
   */
  async overrideMode(targetMode, authority = {}) {
    if (!this.config.enableOverrideProtection) {
      return this.switchMode(targetMode, {
        reason: 'override',
        force: true,
        transition: ModeTransition.IMMEDIATE
      });
    }
    
    // Validate override authority
    const targetConfig = this.modes.get(targetMode);
    if (!targetConfig) {
      throw new Error(`Unknown mode: ${targetMode}`);
    }
    
    if (authority.level < targetConfig.requirements.authorityLevel) {
      throw new Error(`Insufficient authority for override: ${authority.level} < ${targetConfig.requirements.authorityLevel}`);
    }
    
    this.metrics.overrides++;
    
    return this.switchMode(targetMode, {
      reason: `override_by_${authority.user || 'system'}`,
      force: true,
      transition: ModeTransition.IMMEDIATE,
      metadata: { authority }
    });
  }

  /**
   * Get current capabilities
   */
  getCurrentCapabilities() {
    const mode = this.modes.get(this.currentMode);
    return mode ? mode.capabilities : [];
  }

  /**
   * Check if capability is available
   */
  hasCapability(capability) {
    const capabilities = this.getCurrentCapabilities();
    return capabilities.includes(capability);
  }

  /**
   * Get mode history
   */
  getHistory(limit = 10) {
    return this.modeHistory.slice(-limit);
  }

  /**
   * Get mode statistics
   */
  getStatistics() {
    const stats = {
      currentMode: this.currentMode,
      previousMode: this.previousMode,
      totalModes: this.modes.size,
      historyLength: this.modeHistory.length,
      stackDepth: this.modeStack.length,
      activeLocks: this.locks.size,
      metrics: { ...this.metrics }
    };
    
    // Calculate mode usage
    const modeUsage = {};
    for (const entry of this.modeHistory) {
      modeUsage[entry.mode] = (modeUsage[entry.mode] || 0) + 1;
    }
    stats.modeUsage = modeUsage;
    
    return stats;
  }

  /**
   * Get current status
   */
  getStatus() {
    const mode = this.modes.get(this.currentMode);
    
    return {
      mode: this.currentMode,
      description: mode?.description,
      priority: mode?.priority,
      capabilities: mode?.capabilities || [],
      requirements: mode?.requirements || {},
      locked: this.isModeLocked(this.currentMode),
      stackDepth: this.modeStack.length,
      uptime: Date.now() - this.getModeStartTime()
    };
  }

  /**
   * Reset manager
   */
  reset() {
    this.currentMode = 'operational';
    this.previousMode = null;
    this.modeHistory = [];
    this.modeStack = [];
    this.locks.clear();
    this.transitions.clear();
    
    this.metrics = {
      transitions: 0,
      failedTransitions: 0,
      automaticSwitches: 0,
      overrides: 0,
      avgTransitionTime: 0
    };
    
    this.addToHistory('operational', 'reset');
    
    this.emit('manager:reset');
    
    logger.info('🔄 Executive Mode Manager reset');
  }
}

module.exports = {
  ExecutiveModeManager,
  ModePriority,
  ModeTransition
};