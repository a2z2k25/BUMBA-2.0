/**
 * BUMBA Mode Manager
 * Manages execution modes and their impact on command processing
 */

const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');

class ModeManager {
  constructor() {
    this.currentMode = 'full'; // Default mode
    this.modeFile = '.bumba-mode';
    this.availableModes = {
      'full': {
        name: 'Full Mode',
        description: 'All features enabled, full specialist analysis',
        specialists: true,
        collaboration: true,
        intelligence: true,
        performance: 'standard',
        timeout: 60000
      },
      'lite': {
        name: 'Lite Mode',
        description: 'Fast execution, minimal analysis',
        specialists: false,
        collaboration: false,
        intelligence: false,
        performance: 'fast',
        timeout: 10000
      },
      'turbo': {
        name: 'Turbo Mode',
        description: 'Maximum parallel processing',
        specialists: true,
        collaboration: true,
        intelligence: true,
        performance: 'parallel',
        timeout: 30000
      },
      'eco': {
        name: 'Eco Mode',
        description: 'Resource-conscious execution',
        specialists: true,
        collaboration: false,
        intelligence: true,
        performance: 'optimized',
        timeout: 45000
      },
      'dice': {
        name: 'DICE Mode',
        description: 'Distributed intelligent command execution',
        specialists: true,
        collaboration: true,
        intelligence: true,
        performance: 'distributed',
        timeout: 90000
      },
      'executive': {
        name: 'Executive Mode',
        description: 'High-level strategic planning',
        specialists: true,
        collaboration: true,
        intelligence: true,
        performance: 'strategic',
        timeout: 120000
      }
    };
  }

  /**
   * Read current mode from file
   */
  async readMode() {
    try {
      const modePath = path.join(process.cwd(), this.modeFile);
      const content = await fs.readFile(modePath, 'utf8');
      const mode = content.trim().toLowerCase();
      
      if (this.availableModes[mode]) {
        this.currentMode = mode;
        logger.info(`📖 Read mode from file: ${mode}`);
      } else {
        logger.warn(`⚠️ Unknown mode in file: ${mode}, using default: ${this.currentMode}`);
      }
    } catch (error) {
      // File doesn't exist or can't be read
      logger.info(`ℹ️ No mode file found, using default: ${this.currentMode}`);
    }
    
    return this.currentMode;
  }

  /**
   * Write mode to file
   */
  async writeMode(mode) {
    if (!this.availableModes[mode]) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    
    try {
      const modePath = path.join(process.cwd(), this.modeFile);
      await fs.writeFile(modePath, mode, 'utf8');
      this.currentMode = mode;
      logger.info(`💾 Saved mode to file: ${mode}`);
      return true;
    } catch (error) {
      logger.error(`Failed to write mode file:`, error);
      return false;
    }
  }

  /**
   * Get current mode configuration
   */
  getCurrentModeConfig() {
    return this.availableModes[this.currentMode];
  }

  /**
   * Set mode (in memory only)
   */
  setMode(mode) {
    if (!this.availableModes[mode]) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    
    const previousMode = this.currentMode;
    this.currentMode = mode;
    
    logger.info(`🔄 Switched mode: ${previousMode} → ${mode}`);
    
    return {
      previousMode,
      currentMode: mode,
      config: this.availableModes[mode]
    };
  }

  /**
   * Apply mode to command execution
   */
  applyModeToExecution(command, args, context) {
    const modeConfig = this.getCurrentModeConfig();
    
    // Create mode-adjusted context
    const adjustedContext = {
      ...context,
      mode: this.currentMode,
      modeConfig: {
        useSpecialists: modeConfig.specialists,
        useCollaboration: modeConfig.collaboration,
        useIntelligence: modeConfig.intelligence,
        performance: modeConfig.performance,
        timeout: modeConfig.timeout
      }
    };
    
    // Adjust based on specific mode
    switch (this.currentMode) {
      case 'lite':
        adjustedContext.skipSpecialists = true;
        adjustedContext.skipCollaboration = true;
        adjustedContext.useTemplates = true;
        break;
        
      case 'turbo':
        adjustedContext.forceParallel = true;
        adjustedContext.maxConcurrency = 10;
        break;
        
      case 'eco':
        adjustedContext.limitSpecialists = 2;
        adjustedContext.skipNonEssential = true;
        break;
        
      case 'dice':
        adjustedContext.distributed = true;
        adjustedContext.useRemoteAgents = true;
        break;
        
      case 'executive':
        adjustedContext.strategic = true;
        adjustedContext.includeRoadmap = true;
        adjustedContext.includeMetrics = true;
        break;
    }
    
    return adjustedContext;
  }

  /**
   * Check if feature is enabled in current mode
   */
  isFeatureEnabled(feature) {
    const config = this.getCurrentModeConfig();
    
    switch (feature) {
      case 'specialists':
        return config.specialists;
      case 'collaboration':
        return config.collaboration;
      case 'intelligence':
        return config.intelligence;
      case 'parallel':
        return config.performance === 'parallel' || config.performance === 'distributed';
      default:
        return true;
    }
  }

  /**
   * Get recommended mode for command
   */
  getRecommendedMode(command, args) {
    // Complex commands benefit from full mode
    if (['implement', 'orchestrate', 'analyze'].includes(command)) {
      return 'full';
    }
    
    // Quick queries can use lite mode
    if (['status', 'help', 'list'].includes(command)) {
      return 'lite';
    }
    
    // Parallel operations benefit from turbo
    if (args.includes('parallel') || args.includes('concurrent')) {
      return 'turbo';
    }
    
    // Strategic commands need executive mode
    if (['strategy', 'roadmap', 'executive'].includes(command)) {
      return 'executive';
    }
    
    // Default to eco for balanced performance
    return 'eco';
  }

  /**
   * Get mode statistics
   */
  getModeStats() {
    const config = this.getCurrentModeConfig();
    
    return {
      currentMode: this.currentMode,
      modeName: config.name,
      features: {
        specialists: config.specialists ? 'enabled' : 'disabled',
        collaboration: config.collaboration ? 'enabled' : 'disabled',
        intelligence: config.intelligence ? 'enabled' : 'disabled'
      },
      performance: config.performance,
      timeout: `${config.timeout / 1000}s`
    };
  }

  /**
   * List all available modes
   */
  listModes() {
    return Object.entries(this.availableModes).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      current: key === this.currentMode
    }));
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ModeManager,
  getInstance: () => {
    if (!instance) {
      instance = new ModeManager();
    }
    return instance;
  }
};