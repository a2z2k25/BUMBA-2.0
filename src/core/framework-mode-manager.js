/**
 * BUMBA CLI Mode Manager
 * Handles switching between different framework modes
 */

const { logger } = require('./logging/bumba-logger');
const { EventEmitter } = require('events');

class FrameworkModeManager extends EventEmitter {
  constructor() {
    super();
    
    this.currentMode = 'standard';
    this.availableModes = {
      'standard': {
        name: 'Standard Mode',
        description: 'Full-featured production framework',
        memoryUsage: 'High (~50MB)',
        features: 'All features enabled',
        loader: () => require('./bumba-framework-2')
      },
      'lite': {
        name: 'Lite Mode',
        description: 'Lightweight framework for resource-constrained environments',
        memoryUsage: 'Low (~10MB)',
        features: 'Core features only',
        loader: () => require('./bumba-lite')
      },
      'executive': {
        name: 'Executive Mode',
        description: 'CEO-level strategic command and control',
        memoryUsage: 'Medium (~30MB)',
        features: 'Strategic planning and department coordination',
        loader: () => require('./executive-mode')
      },
      'interactive': {
        name: 'Interactive Mode',
        description: 'Menu-driven interactive interface',
        memoryUsage: 'Low (~15MB)',
        features: 'User-friendly command selection',
        loader: () => require('./interactive-mode')
      },
      'development': {
        name: 'Development Mode',
        description: 'Enhanced debugging and development features',
        memoryUsage: 'High (~60MB)',
        features: 'Debug logging, hot reload, test utilities',
        loader: () => {
          process.env.NODE_ENV = 'development';
          return require('./bumba-framework-2');
        }
      },
      'production': {
        name: 'Production Mode',
        description: 'Optimized for production deployment',
        memoryUsage: 'Medium (~40MB)',
        features: 'Performance optimized, minimal logging',
        loader: () => {
          process.env.NODE_ENV = 'production';
          return require('./bumba-framework-2');
        }
      }
    };
    
    this.activeFramework = null;
    this.modeHistory = [];
    this.transitionState = null;
  }
  
  /**
   * Initialize the mode manager
   */
  async initialize() {
    logger.info('🔄 Framework Mode Manager initialized');
    
    // Load default mode
    await this.switchMode('standard');
    
    // Setup mode monitoring
    this.setupModeMonitoring();
    
    this.emit('initialized');
  }
  
  /**
   * Switch to a different framework mode
   */
  async switchMode(modeName, options = {}) {
    if (!this.availableModes[modeName]) {
      throw new Error(`Unknown mode: ${modeName}. Available modes: ${Object.keys(this.availableModes).join(', ')}`);
    }
    
    if (this.currentMode === modeName && !options.force) {
      logger.info(`Already in ${modeName} mode`);
      return this.activeFramework;
    }
    
    logger.info(`🔄 Switching from ${this.currentMode} to ${modeName} mode...`);
    
    // Start transition
    this.transitionState = {
      from: this.currentMode,
      to: modeName,
      startTime: Date.now(),
      options
    };
    
    this.emit('mode:switching', this.transitionState);
    
    try {
      // Save current state if needed
      if (this.activeFramework && options.preserveState) {
        await this.saveState();
      }
      
      // Cleanup current mode
      if (this.activeFramework) {
        await this.cleanupCurrentMode();
      }
      
      // Load new mode
      const modeConfig = this.availableModes[modeName];
      const FrameworkClass = modeConfig.loader();
      
      // Initialize new framework instance
      if (typeof FrameworkClass === 'function') {
        this.activeFramework = new FrameworkClass();
      } else if (FrameworkClass.getInstance) {
        this.activeFramework = FrameworkClass.getInstance();
      } else {
        this.activeFramework = FrameworkClass;
      }
      
      // Initialize if needed
      if (this.activeFramework.initialize && !this.activeFramework.initialized) {
        await this.activeFramework.initialize();
      }
      
      // Restore state if needed
      if (options.preserveState && this.savedState) {
        await this.restoreState();
      }
      
      // Update current mode
      this.previousMode = this.currentMode;
      this.currentMode = modeName;
      
      // Add to history
      this.modeHistory.push({
        mode: modeName,
        timestamp: new Date().toISOString(),
        transitionTime: Date.now() - this.transitionState.startTime
      });
      
      // Emit success event
      this.emit('mode:switched', {
        from: this.previousMode,
        to: this.currentMode,
        framework: this.activeFramework
      });
      
      logger.info(`🏁 Successfully switched to ${modeName} mode`);
      this.displayModeInfo();
      
      return this.activeFramework;
      
    } catch (error) {
      logger.error(`Failed to switch to ${modeName} mode:`, error);
      
      // Try to restore previous mode
      if (this.previousMode && this.previousMode !== modeName) {
        logger.info(`Attempting to restore ${this.previousMode} mode...`);
        await this.switchMode(this.previousMode, { force: true });
      }
      
      throw error;
    } finally {
      this.transitionState = null;
    }
  }
  
  /**
   * Cleanup current mode before switching
   */
  async cleanupCurrentMode() {
    logger.debug(`Cleaning up ${this.currentMode} mode...`);
    
    if (this.activeFramework) {
      // Call cleanup methods if available
      if (typeof this.activeFramework.cleanup === 'function') {
        await this.activeFramework.cleanup();
      }
      
      if (typeof this.activeFramework.shutdown === 'function') {
        await this.activeFramework.shutdown();
      }
      
      if (typeof this.activeFramework.deactivate === 'function') {
        await this.activeFramework.deactivate();
      }
    }
    
    // Clear references
    this.activeFramework = null;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  /**
   * Save current state
   */
  async saveState() {
    this.savedState = {
      mode: this.currentMode,
      timestamp: new Date().toISOString(),
      data: {}
    };
    
    if (this.activeFramework) {
      // Save framework-specific state
      if (typeof this.activeFramework.getState === 'function') {
        this.savedState.data = await this.activeFramework.getState();
      }
      
      // Save any running tasks
      if (typeof this.activeFramework.getRunningTasks === 'function') {
        this.savedState.tasks = await this.activeFramework.getRunningTasks();
      }
    }
    
    logger.debug('State saved for mode transition');
  }
  
  /**
   * Restore saved state
   */
  async restoreState() {
    if (!this.savedState) {
      return;
    }
    
    logger.debug('Restoring saved state...');
    
    if (this.activeFramework) {
      // Restore framework-specific state
      if (typeof this.activeFramework.setState === 'function' && this.savedState.data) {
        await this.activeFramework.setState(this.savedState.data);
      }
      
      // Restore tasks
      if (typeof this.activeFramework.restoreTasks === 'function' && this.savedState.tasks) {
        await this.activeFramework.restoreTasks(this.savedState.tasks);
      }
    }
    
    this.savedState = null;
  }
  
  /**
   * Setup mode monitoring
   */
  setupModeMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      // Auto-switch to lite mode if memory is high
      if (heapUsedMB > 100 && this.currentMode !== 'lite') {
        logger.warn(`High memory usage detected (${heapUsedMB}MB). Consider switching to lite mode.`);
        this.emit('mode:suggestion', {
          reason: 'high_memory',
          currentMode: this.currentMode,
          suggestedMode: 'lite',
          memoryUsage: heapUsedMB
        });
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Display current mode information
   */
  displayModeInfo() {
    const mode = this.availableModes[this.currentMode];
    
    console.log('\n' + '═'.repeat(60));
    console.log(`🟡 CURRENT MODE: ${mode.name}`);
    console.log('═'.repeat(60));
    console.log(`Description: ${mode.description}`);
    console.log(`Memory Usage: ${mode.memoryUsage}`);
    console.log(`Features: ${mode.features}`);
    console.log('═'.repeat(60) + '\n');
  }
  
  /**
   * Get current mode information
   */
  getCurrentMode() {
    return {
      name: this.currentMode,
      config: this.availableModes[this.currentMode],
      framework: this.activeFramework,
      isTransitioning: !!this.transitionState
    };
  }
  
  /**
   * Get available modes
   */
  getAvailableModes() {
    return Object.entries(this.availableModes).map(([key, config]) => ({
      key,
      ...config,
      isCurrent: key === this.currentMode
    }));
  }
  
  /**
   * Get mode history
   */
  getModeHistory() {
    return [...this.modeHistory];
  }
  
  /**
   * Quick mode switches
   */
  async toLiteMode() {
    return this.switchMode('lite');
  }
  
  async toStandardMode() {
    return this.switchMode('standard');
  }
  
  async toExecutiveMode() {
    return this.switchMode('executive');
  }
  
  async toInteractiveMode() {
    return this.switchMode('interactive');
  }
  
  async toDevelopmentMode() {
    return this.switchMode('development');
  }
  
  async toProductionMode() {
    return this.switchMode('production');
  }
  
  /**
   * Auto-select best mode based on environment
   */
  async autoSelectMode() {
    let selectedMode = 'standard';
    
    // Check environment variables
    if (process.env.BUMBA_MODE) {
      selectedMode = process.env.BUMBA_MODE;
    } else if (process.env.NODE_ENV === 'production') {
      selectedMode = 'production';
    } else if (process.env.NODE_ENV === 'development') {
      selectedMode = 'development';
    } else {
      // Check system resources
      const memUsage = process.memoryUsage();
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      if (heapTotalMB < 50) {
        selectedMode = 'lite';
      } else if (process.stdin.isTTY) {
        selectedMode = 'interactive';
      }
    }
    
    logger.info(`Auto-selected mode: ${selectedMode}`);
    return this.switchMode(selectedMode);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  FrameworkModeManager,
  getInstance: () => {
    if (!instance) {
      instance = new FrameworkModeManager();
    }
    return instance;
  },
  
  // Quick access methods
  switchMode: async (mode, options) => {
    const manager = module.exports.getInstance();
    return manager.switchMode(mode, options);
  },
  
  getCurrentMode: () => {
    const manager = module.exports.getInstance();
    return manager.getCurrentMode();
  },
  
  getAvailableModes: () => {
    const manager = module.exports.getInstance();
    return manager.getAvailableModes();
  }
};