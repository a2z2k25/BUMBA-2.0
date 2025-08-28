/**
 * BUMBA Hybrid Mode
 * Combined bridge and enhancement capabilities
 */

const BaseMode = require('./base-mode');
const BridgeMode = require('./bridge-mode');
const EnhancementMode = require('./enhancement-mode');

class HybridMode extends BaseMode {
  constructor(options) {
    super(options);
    
    // Initialize both modes
    this.bridgeMode = new BridgeMode(options);
    this.enhancementMode = new EnhancementMode({
      ...options,
      environment: { ...options.environment, simulated: true }
    });
    
    // Combine commands from both modes
    this.commands = [
      ...new Set([
        ...this.bridgeMode.commands,
        ...this.enhancementMode.commands
      ])
    ];
  }

  /**
   * Initialize hybrid mode
   */
  async initialize() {
    await super.initialize();
    await this.bridgeMode.initialize();
    await this.enhancementMode.initialize();
    
    this.displayActivation();
  }

  /**
   * Display activation message
   */
  displayActivation() {
    console.log('🏁 BUMBA Hybrid Mode Activated');
    console.log('━'.repeat(60));
    console.log();
    console.log('🟢 Bridge Mode: Task preparation enabled');
    console.log('🟡 Enhancement Mode: Limited AI features');
    console.log();
    console.log('This mode combines terminal and simulated Claude features');
    console.log('For full AI capabilities, run in Claude Code');
  }

  /**
   * Check if command is available
   * @param {string} command Command name
   * @returns {boolean}
   */
  canExecute(command) {
    return this.commands.includes(command);
  }

  /**
   * Execute hybrid mode command
   * @param {string} command Command name
   * @param {Array} args Command arguments
   * @returns {Promise}
   */
  async execute(command, ...args) {
    // Route to appropriate mode
    if (this.bridgeMode.canExecute(command)) {
      return await this.bridgeMode.execute(command, ...args);
    } else if (this.enhancementMode.canExecute(command)) {
      return await this.enhancementMode.execute(command, ...args);
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Prepare and immediately execute a task
   * @param {string} description Task description
   * @returns {Promise<Object>} Combined result
   */
  async prepareAndExecute(description) {
    console.log('🏁 Hybrid Execution: Prepare & Execute');
    console.log('━'.repeat(60));
    console.log();
    
    // Prepare task using bridge mode
    const { task } = await this.bridgeMode.prepareImplementation(description);
    
    console.log();
    console.log('🟢 Attempting local execution...');
    console.log();
    
    // Try to execute with limited enhancement mode
    const result = await this.enhancementMode.executeTask(task.id);
    
    return { task, result };
  }

  /**
   * Show hybrid mode status
   */
  showStatus() {
    console.log('🏁 BUMBA Hybrid Mode Status');
    console.log('━'.repeat(60));
    console.log();
    console.log('Mode: HYBRID (VSCode/Terminal)');
    console.log('Purpose: Combined bridge and enhancement capabilities');
    console.log();
    console.log('Available Commands:');
    this.commands.forEach(cmd => {
      const source = this.getCommandSource(cmd);
      console.log(`  • bumba ${cmd} (${source})`);
    });
    console.log();
    console.log('Capabilities:');
    console.log('  🟢 Task Preparation (Bridge)');
    console.log('  🟢 Context Analysis (Bridge)');
    console.log('  🟡 Limited AI Features (Enhancement)');
    console.log('  🔴 Full Vision (requires Claude)');
    console.log('  🔴 Multi-Agent (requires Claude)');
    
    return {
      mode: 'hybrid',
      commands: this.commands,
      bridgeCapabilities: this.bridgeMode.environment.capabilities,
      enhancementCapabilities: this.enhancementMode.capabilities
    };
  }

  /**
   * Get command source mode
   * @param {string} command Command name
   * @returns {string} Source mode
   */
  getCommandSource(command) {
    if (this.bridgeMode.commands.includes(command) && 
        this.enhancementMode.commands.includes(command)) {
      return 'Both';
    } else if (this.bridgeMode.commands.includes(command)) {
      return 'Bridge';
    } else if (this.enhancementMode.commands.includes(command)) {
      return 'Enhancement';
    }
    return 'Unknown';
  }

  /**
   * Get mode information
   * @returns {Object}
   */
  getInfo() {
    return {
      name: 'Hybrid Mode',
      type: 'Combined Bridge + Enhancement',
      initialized: this.initialized,
      environment: this.environment.mode,
      purpose: 'Unified interface for both preparation and limited execution',
      commands: this.commands,
      modes: {
        bridge: this.bridgeMode.getInfo(),
        enhancement: this.enhancementMode.getInfo()
      }
    };
  }

  /**
   * Clean up both modes
   */
  async cleanup() {
    await this.bridgeMode.cleanup();
    await this.enhancementMode.cleanup();
    await super.cleanup();
  }
}

module.exports = HybridMode;