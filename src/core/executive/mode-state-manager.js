/**
 * BUMBA Mode State Manager
 * Manages transitions between operational modes
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Operational modes
 */
const MODES = {
  NORMAL: 'NORMAL',
  CRISIS: 'CRISIS',
  EXECUTIVE: 'EXECUTIVE',
  RECOVERY: 'RECOVERY',
  MAINTENANCE: 'MAINTENANCE'
};

/**
 * Valid state transitions
 */
const TRANSITIONS = {
  NORMAL: ['CRISIS', 'MAINTENANCE'],
  CRISIS: ['EXECUTIVE', 'RECOVERY', 'NORMAL'],
  EXECUTIVE: ['RECOVERY', 'CRISIS'],
  RECOVERY: ['NORMAL', 'CRISIS'],
  MAINTENANCE: ['NORMAL']
};

class ModeStateManager extends EventEmitter {
  constructor() {
    super();
    
    // Current state
    this.currentMode = MODES.NORMAL;
    this.previousMode = null;
    this.modeHistory = [];
    
    // Transition tracking
    this.transitionInProgress = false;
    this.lastTransition = null;
    
    // Mode metadata
    this.modeMetadata = {
      [MODES.NORMAL]: {
        enteredAt: Date.now(),
        exitedAt: null,
        duration: 0,
        triggerReason: 'initialization'
      }
    };
    
    // Transition callbacks
    this.transitionHandlers = new Map();
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize state manager
   */
  initialize() {
    logger.info('🔄 Mode State Manager initialized');
    logger.info(`   Current mode: ${this.currentMode}`);
    
    // Register default handlers
    this.registerDefaultHandlers();
  }
  
  /**
   * Register default transition handlers
   */
  registerDefaultHandlers() {
    // Normal → Crisis
    this.registerTransition(MODES.NORMAL, MODES.CRISIS, async (context) => {
      logger.warn('🟠️ Entering CRISIS mode');
      return { success: true, message: 'Crisis mode activated' };
    });
    
    // Crisis → Executive
    this.registerTransition(MODES.CRISIS, MODES.EXECUTIVE, async (context) => {
      logger.info('👔 Entering EXECUTIVE mode');
      return { success: true, message: 'Executive control established' };
    });
    
    // Executive → Recovery
    this.registerTransition(MODES.EXECUTIVE, MODES.RECOVERY, async (context) => {
      logger.info('🔧 Entering RECOVERY mode');
      return { success: true, message: 'Recovery procedures initiated' };
    });
    
    // Recovery → Normal
    this.registerTransition(MODES.RECOVERY, MODES.NORMAL, async (context) => {
      logger.info('🏁 Returning to NORMAL mode');
      return { success: true, message: 'Normal operations restored' };
    });
  }
  
  /**
   * Get current mode
   */
  getCurrentMode() {
    return this.currentMode;
  }
  
  /**
   * Check if transition is valid
   */
  isValidTransition(fromMode, toMode) {
    const validTransitions = TRANSITIONS[fromMode] || [];
    return validTransitions.includes(toMode);
  }
  
  /**
   * Register transition handler
   */
  registerTransition(fromMode, toMode, handler) {
    const key = `${fromMode}->${toMode}`;
    this.transitionHandlers.set(key, handler);
    logger.info(`   Registered handler: ${key}`);
  }
  
  /**
   * Transition to new mode
   */
  async transitionTo(newMode, context = {}) {
    // Validate mode
    if (!MODES[newMode]) {
      throw new Error(`Invalid mode: ${newMode}`);
    }
    
    // Check if already in target mode
    if (this.currentMode === newMode) {
      logger.info(`Already in ${newMode} mode`);
      return { success: true, alreadyInMode: true };
    }
    
    // Check if transition in progress
    if (this.transitionInProgress) {
      logger.warn('Transition already in progress');
      return { success: false, error: 'Transition in progress' };
    }
    
    // Validate transition
    if (!this.isValidTransition(this.currentMode, newMode)) {
      logger.error(`Invalid transition: ${this.currentMode} → ${newMode}`);
      return { 
        success: false, 
        error: `Cannot transition from ${this.currentMode} to ${newMode}` 
      };
    }
    
    try {
      this.transitionInProgress = true;
      const fromMode = this.currentMode;
      
      logger.info(`🔄 Transitioning: ${fromMode} → ${newMode}`);
      
      // Emit pre-transition event
      this.emit('transition:start', {
        from: fromMode,
        to: newMode,
        context
      });
      
      // Execute transition handler if exists
      const handlerKey = `${fromMode}->${newMode}`;
      const handler = this.transitionHandlers.get(handlerKey);
      
      let handlerResult = { success: true };
      if (handler) {
        handlerResult = await handler(context);
        if (!handlerResult.success) {
          throw new Error(handlerResult.error || 'Transition handler failed');
        }
      }
      
      // Update mode metadata
      if (this.modeMetadata[fromMode]) {
        this.modeMetadata[fromMode].exitedAt = Date.now();
        this.modeMetadata[fromMode].duration = 
          this.modeMetadata[fromMode].exitedAt - this.modeMetadata[fromMode].enteredAt;
      }
      
      // Create metadata for new mode
      this.modeMetadata[newMode] = {
        enteredAt: Date.now(),
        exitedAt: null,
        duration: 0,
        triggerReason: context.reason || 'manual',
        previousMode: fromMode
      };
      
      // Update state
      this.previousMode = this.currentMode;
      this.currentMode = newMode;
      
      // Track transition
      this.lastTransition = {
        from: fromMode,
        to: newMode,
        timestamp: Date.now(),
        context,
        result: handlerResult
      };
      
      // Add to history
      this.modeHistory.push(this.lastTransition);
      
      // Keep history limited
      if (this.modeHistory.length > 100) {
        this.modeHistory.shift();
      }
      
      // Emit post-transition event
      this.emit('transition:complete', {
        from: fromMode,
        to: newMode,
        context,
        result: handlerResult
      });
      
      logger.info(`🏁 Transition complete: Now in ${newMode} mode`);
      
      return {
        success: true,
        from: fromMode,
        to: newMode,
        metadata: this.modeMetadata[newMode],
        result: handlerResult
      };
      
    } catch (error) {
      logger.error(`Transition failed: ${error.message}`);
      
      // Emit failure event
      this.emit('transition:failed', {
        from: this.currentMode,
        to: newMode,
        error: error.message,
        context
      });
      
      return {
        success: false,
        error: error.message
      };
      
    } finally {
      this.transitionInProgress = false;
    }
  }
  
  /**
   * Force mode (emergency use only)
   */
  forceMode(mode, reason = 'emergency') {
    logger.warn(`🟠️ FORCING mode change to ${mode}`);
    
    const fromMode = this.currentMode;
    this.previousMode = fromMode;
    this.currentMode = mode;
    
    // Update metadata
    this.modeMetadata[mode] = {
      enteredAt: Date.now(),
      exitedAt: null,
      duration: 0,
      triggerReason: reason,
      forced: true
    };
    
    // Track forced transition
    this.lastTransition = {
      from: fromMode,
      to: mode,
      timestamp: Date.now(),
      forced: true,
      reason
    };
    
    this.modeHistory.push(this.lastTransition);
    
    // Emit forced transition event
    this.emit('transition:forced', {
      from: fromMode,
      to: mode,
      reason
    });
    
    return {
      success: true,
      forced: true,
      from: fromMode,
      to: mode
    };
  }
  
  /**
   * Get mode statistics
   */
  getModeStatistics() {
    const stats = {};
    
    for (const [mode, metadata] of Object.entries(this.modeMetadata)) {
      stats[mode] = {
        totalTime: metadata.duration || 
          (metadata.enteredAt && !metadata.exitedAt ? 
            Date.now() - metadata.enteredAt : 0),
        lastEntered: metadata.enteredAt,
        lastExited: metadata.exitedAt,
        triggerReason: metadata.triggerReason
      };
    }
    
    return stats;
  }
  
  /**
   * Get transition history
   */
  getTransitionHistory(limit = 10) {
    return this.modeHistory.slice(-limit);
  }
  
  /**
   * Get current status
   */
  getStatus() {
    const currentMetadata = this.modeMetadata[this.currentMode];
    const timeInMode = currentMetadata ? 
      Date.now() - currentMetadata.enteredAt : 0;
    
    return {
      currentMode: this.currentMode,
      previousMode: this.previousMode,
      transitionInProgress: this.transitionInProgress,
      timeInCurrentMode: timeInMode,
      lastTransition: this.lastTransition,
      statistics: this.getModeStatistics(),
      recentHistory: this.getTransitionHistory(5)
    };
  }
  
  /**
   * Reset to normal mode
   */
  async reset() {
    logger.info('🔄 Resetting to NORMAL mode');
    
    if (this.currentMode === MODES.NORMAL) {
      return { success: true, alreadyNormal: true };
    }
    
    // Force transition to normal
    return this.forceMode(MODES.NORMAL, 'reset');
  }
}

// Export modes and manager
module.exports = {
  ModeStateManager,
  MODES,
  TRANSITIONS
};