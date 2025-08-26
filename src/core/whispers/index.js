/**
 * BUMBA Agent Whispers
 * Main integration point for ambient agent status display
 * Connects all whisper components and integrates with framework
 */

const { EventEmitter } = require('events');
const StatusAggregator = require('./status-aggregator');
const WhisperRenderer = require('./whisper-renderer');
const { getOptimalConfig } = require('./terminal-detector');
const { logger } = require('../logging/bumba-logger');

class AgentWhispers extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Get optimal configuration for this terminal
    const optimalConfig = getOptimalConfig();
    
    // Merge with user options
    this.config = {
      ...optimalConfig,
      ...options,
      enabled: options.enabled !== undefined ? options.enabled : optimalConfig.enabled
    };
    
    // Components
    this.aggregator = null;
    this.renderer = null;
    
    // State
    this.isRunning = false;
    
    // Initialize if enabled
    if (this.config.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialize whisper components
   */
  initialize() {
    try {
      // Create status aggregator
      this.aggregator = new StatusAggregator({
        updateInterval: this.config.updateInterval,
        format: this.config.format,
        maxAgents: this.config.maxAgents || 10
      });
      
      // Create renderer
      this.renderer = new WhisperRenderer({
        location: this.config.location,
        format: this.config.format,
        colorMode: this.config.colorMode
      });
      
      // Connect aggregator to renderer
      this.aggregator.on('status-update', (statusData) => {
        if (this.isRunning) {
          this.renderer.render(statusData);
        }
      });
      
      // Clean up on exit
      process.on('exit', () => this.stop());
      process.on('SIGINT', () => {
        this.stop();
        process.exit();
      });
      
      logger.debug('Agent Whispers initialized', this.config);
      
    } catch (error) {
      logger.warn('Failed to initialize Agent Whispers:', error.message);
      this.config.enabled = false;
    }
  }
  
  /**
   * Connect to collaboration system
   */
  connect(collaborationSystem) {
    if (!this.config.enabled || !this.aggregator) {
      return;
    }
    
    this.aggregator.connect(collaborationSystem);
    logger.info('🟡 Agent Whispers connected to collaboration system');
  }
  
  /**
   * Start whispers
   */
  start() {
    if (!this.config.enabled || this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    if (this.aggregator) {
      this.aggregator.startUpdates();
    }
    
    this.emit('started');
    logger.debug('Agent Whispers started');
  }
  
  /**
   * Stop whispers
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.aggregator) {
      this.aggregator.stopUpdates();
    }
    
    if (this.renderer) {
      this.renderer.clear();
      this.renderer.cleanup();
    }
    
    this.emit('stopped');
    logger.debug('Agent Whispers stopped');
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if needed
    if (this.config.enabled && !this.aggregator) {
      this.initialize();
    } else if (!this.config.enabled && this.aggregator) {
      this.stop();
    }
    
    // Update renderer config
    if (this.renderer) {
      this.renderer.options = { ...this.renderer.options, ...newConfig };
    }
  }
  
  /**
   * Toggle whispers on/off
   */
  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
    
    return this.isRunning;
  }
  
  /**
   * Get current status
   */
  getStatus() {
    if (!this.aggregator) {
      return null;
    }
    
    return {
      enabled: this.config.enabled,
      running: this.isRunning,
      location: this.config.location,
      summary: this.aggregator.getSummary()
    };
  }
  
  /**
   * Manual status update (for testing)
   */
  updateStatus(agentId, status) {
    if (!this.aggregator) {
      return;
    }
    
    this.aggregator.handleAgentProgress({
      agentId,
      progress: status.progress,
      message: status.message
    });
  }
}

// Singleton instance
let whispers = null;

/**
 * Get or create whispers instance
 */
function getWhispers(options) {
  if (!whispers) {
    whispers = new AgentWhispers(options);
  }
  return whispers;
}

/**
 * Integration helper for easy framework integration
 */
function integrateWhispers(framework, options = {}) {
  const whisperInstance = getWhispers(options);
  
  // Connect to collaboration system if available
  if (framework.collaboration) {
    whisperInstance.connect(framework.collaboration);
  }
  
  // Auto-start if enabled
  if (whisperInstance.config.enabled) {
    whisperInstance.start();
  }
  
  // Add to framework
  framework.whispers = whisperInstance;
  
  // Add commands
  if (framework.commandHandler) {
    // Add whisper commands
    framework.commandHandler.register('/bumba:whispers', (args) => {
      const action = args[0];
      
      switch (action) {
        case 'on':
          whisperInstance.updateConfig({ enabled: true });
          whisperInstance.start();
          return '🟢 Agent Whispers enabled';
          
        case 'off':
          whisperInstance.stop();
          whisperInstance.updateConfig({ enabled: false });
          return '🔴 Agent Whispers disabled';
          
        case 'toggle':
          const isOn = whisperInstance.toggle();
          return isOn ? '🟢 Whispers on' : '🔴 Whispers off';
          
        case 'status':
          const status = whisperInstance.getStatus();
          return `Whispers: ${status.running ? 'Running' : 'Stopped'}\n` +
                 `Location: ${status.location}\n` +
                 `Agents: ${status.summary.total} total, ${status.summary.active} active`;
          
        default:
          return 'Usage: /bumba:whispers [on|off|toggle|status]';
      }
    });
  }
  
  return whisperInstance;
}

module.exports = {
  AgentWhispers,
  getWhispers,
  integrateWhispers
};