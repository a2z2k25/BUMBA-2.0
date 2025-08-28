/**
 * BUMBA Mode Manager
 * Manages Bridge, Enhancement, and Hybrid modes
 */

const EnvironmentDetector = require('./environment-detector');
const BridgeMode = require('./modes/bridge-mode');
const EnhancementMode = require('./modes/enhancement-mode');
const HybridMode = require('./modes/hybrid-mode');

class ModeManager {
  constructor(options = {}) {
    this.environment = EnvironmentDetector.detect();
    this.options = options;
    this.mode = null;
    this.initialized = false;
    
    this.initializeMode();
  }

  /**
   * Initialize the appropriate mode based on environment
   */
  initializeMode() {
    const modeType = this.environment.mode;
    
    switch(modeType) {
      case 'claude':
        this.mode = new EnhancementMode({
          environment: this.environment,
          ...this.options
        });
        break;
        
      case 'terminal':
        this.mode = new BridgeMode({
          environment: this.environment,
          ...this.options
        });
        break;
        
      case 'vscode':
        // VSCode can run in hybrid mode
        this.mode = new HybridMode({
          environment: this.environment,
          ...this.options
        });
        break;
        
      default:
        // Default to bridge mode for safety
        this.mode = new BridgeMode({
          environment: this.environment,
          ...this.options
        });
    }
    
    this.initialized = true;
    this.mode.initialize();
  }

  /**
   * Get current mode instance
   * @returns {Object} Current mode
   */
  getCurrentMode() {
    if (!this.initialized) {
      throw new Error('ModeManager not initialized');
    }
    return this.mode;
  }

  /**
   * Get mode type
   * @returns {string} Mode type identifier
   */
  getModeType() {
    return this.environment.mode;
  }

  /**
   * Get capabilities of current mode
   * @returns {Object} Capability flags
   */
  getCapabilities() {
    return this.environment.capabilities;
  }

  /**
   * Check if a specific capability is available
   * @param {string} capability Capability name
   * @returns {boolean}
   */
  hasCapability(capability) {
    return !!this.environment.capabilities[capability];
  }

  /**
   * Execute a command in current mode
   * @param {string} command Command to execute
   * @param {Array} args Command arguments
   * @returns {Promise} Execution result
   */
  async execute(command, ...args) {
    if (!this.initialized) {
      throw new Error('ModeManager not initialized');
    }
    
    if (!this.mode.canExecute(command)) {
      throw new Error(`Command "${command}" not available in ${this.environment.mode} mode`);
    }
    
    return await this.mode.execute(command, ...args);
  }

  /**
   * Prepare a task for cross-mode execution
   * @param {Object} task Task object
   * @returns {Promise} Prepared task with ID
   */
  async prepareTask(task) {
    if (this.hasCapability('taskPreparation')) {
      return await this.mode.prepareTask(task);
    }
    throw new Error('Task preparation not available in current mode');
  }

  /**
   * Execute a prepared task
   * @param {string} taskId Task identifier
   * @returns {Promise} Execution result
   */
  async executeTask(taskId) {
    if (this.hasCapability('ai')) {
      return await this.mode.executeTask(taskId);
    }
    throw new Error('Task execution requires Claude environment');
  }

  /**
   * Switch to a different mode (if possible)
   * @param {string} targetMode Target mode name
   * @returns {boolean} Success status
   */
  switchMode(targetMode) {
    // Mode switching is limited by environment
    // This is mainly for hybrid mode transitions
    if (this.environment.mode === 'vscode') {
      // VSCode can switch between bridge and enhancement simulation
      if (targetMode === 'bridge') {
        this.mode = new BridgeMode({
          environment: this.environment,
          ...this.options
        });
        this.mode.initialize();
        return true;
      } else if (targetMode === 'enhancement') {
        // Simulate enhancement mode in VSCode
        console.log('🏁 Note: Enhancement mode features limited outside Claude');
        this.mode = new EnhancementMode({
          environment: { ...this.environment, simulated: true },
          ...this.options
        });
        this.mode.initialize();
        return true;
      }
    }
    
    console.log(`🟡 Cannot switch to ${targetMode} mode in ${this.environment.mode} environment`);
    return false;
  }

  /**
   * Get mode status and information
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      mode: this.environment.mode,
      initialized: this.initialized,
      capabilities: this.environment.capabilities,
      context: this.environment.context,
      platform: this.environment.platform,
      modeInfo: this.mode ? this.mode.getInfo() : null
    };
  }

  /**
   * Display mode status to console
   */
  displayStatus() {
    const status = this.getStatus();
    
    console.log('🏁 BUMBA Mode Status');
    console.log('━'.repeat(60));
    console.log();
    console.log(`Mode: ${status.mode.toUpperCase()}`);
    console.log(`Session: ${status.context.sessionId}`);
    console.log();
    
    console.log('Capabilities:');
    Object.entries(status.capabilities).forEach(([key, value]) => {
      const icon = value ? '🟢' : '🔴';
      console.log(`  ${icon} ${key}: ${value ? 'Enabled' : 'Disabled'}`);
    });
    
    if (status.modeInfo) {
      console.log();
      console.log('Mode Information:');
      console.log(status.modeInfo);
    }
  }

  /**
   * Clean up and prepare for shutdown
   */
  async cleanup() {
    if (this.mode && this.mode.cleanup) {
      await this.mode.cleanup();
    }
  }
}

module.exports = ModeManager;