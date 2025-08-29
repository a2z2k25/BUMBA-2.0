/**
 * BUMBA Claude Integration
 * Main entry point for making all /bumba: commands work in Claude
 */

const chalk = require('chalk');
const { logger } = require('./logging/bumba-logger');
const { processClaudeCommand } = require('./claude-command-bridge');
const { commandHandler } = require('./command-handler');

class BumbaClaudeIntegration {
  constructor() {
    this.initialized = false;
    this.commandPrefix = '/bumba:';
    this.activeSession = null;
    this.config = this.loadConfig();
    
    // Initialize on creation
    this.initialize();
  }

  /**
   * Initialize the Claude integration
   */
  async initialize() {
    try {
      logger.info('🏁 Initializing BUMBA Claude Integration...');
      
      // Verify command handler is ready
      const registeredCommands = commandHandler.getRegisteredCommands();
      logger.info(`✅ ${registeredCommands.length} commands registered`);
      
      // Set up orchestration if available
      if (commandHandler.connectToOrchestration) {
        commandHandler.connectToOrchestration();
      }
      
      // Create session
      this.activeSession = {
        id: this.generateSessionId(),
        startTime: Date.now(),
        environment: 'claude',
        commands: []
      };
      
      this.initialized = true;
      logger.info('🟢 BUMBA Claude Integration ready!');
      
      return {
        success: true,
        commandCount: registeredCommands.length,
        session: this.activeSession.id
      };
      
    } catch (error) {
      logger.error('Failed to initialize Claude integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Main command processing function
   * This is what Claude calls when a /bumba: command is detected
   */
  async processCommand(commandString) {
    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate command format
    if (!this.isValidCommand(commandString)) {
      return this.handleInvalidCommand(commandString);
    }

    // Track command in session
    this.trackCommand(commandString);

    try {
      // Process through the bridge
      const result = await processClaudeCommand(commandString);
      
      // Enhance result with session info
      result.session = this.activeSession.id;
      result.commandNumber = this.activeSession.commands.length;
      
      // Format for Claude display
      return this.formatForClaude(result);
      
    } catch (error) {
      logger.error('Command processing error:', error);
      return this.handleError(error, commandString);
    }
  }

  /**
   * Validate command format
   */
  isValidCommand(commandString) {
    if (typeof commandString !== 'string') return false;
    if (!commandString.startsWith(this.commandPrefix)) return false;
    if (commandString.length < this.commandPrefix.length + 1) return false;
    return true;
  }

  /**
   * Handle invalid commands
   */
  handleInvalidCommand(commandString) {
    const suggestions = [];
    
    // Check if it's close to a valid format
    if (commandString.startsWith('/')) {
      suggestions.push(`Did you mean: ${this.commandPrefix}${commandString.slice(1)}?`);
    } else if (commandString.startsWith('bumba:')) {
      suggestions.push(`Did you mean: /${commandString}?`);
    } else {
      suggestions.push(`Commands must start with ${this.commandPrefix}`);
      suggestions.push(`Example: ${this.commandPrefix}implement user auth`);
    }

    return {
      success: false,
      error: 'Invalid command format',
      suggestions,
      help: `Type ${this.commandPrefix}menu to see all available commands`
    };
  }

  /**
   * Track command in session
   */
  trackCommand(commandString) {
    if (this.activeSession) {
      this.activeSession.commands.push({
        command: commandString,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Format result for optimal Claude display
   */
  formatForClaude(result) {
    // Create formatted output
    const output = {
      ...result,
      display: this.createDisplayOutput(result)
    };

    // Add quick actions if applicable
    if (result.success) {
      output.quickActions = this.getQuickActions(result);
    }

    // Add performance metrics
    if (this.activeSession) {
      output.metrics = {
        sessionDuration: Date.now() - this.activeSession.startTime,
        commandsExecuted: this.activeSession.commands.length
      };
    }

    return output;
  }

  /**
   * Create formatted display output
   */
  createDisplayOutput(result) {
    let display = '';
    
    // Success/Error indicator
    if (result.success) {
      display += '✅ Command executed successfully\n\n';
    } else {
      display += '❌ Command failed\n\n';
      if (result.error) {
        display += `Error: ${result.error}\n\n`;
      }
    }

    // Main content
    if (result.message) {
      display += `${result.message}\n\n`;
    }

    // Files created/modified
    if (result.files && result.files.length > 0) {
      display += '📁 Files:\n';
      result.files.forEach(file => {
        display += `  • ${file}\n`;
      });
      display += '\n';
    }

    // Next steps
    if (result.nextSteps && result.nextSteps.length > 0) {
      display += '📋 Next Steps:\n';
      result.nextSteps.forEach((step, i) => {
        display += `  ${i + 1}. ${step}\n`;
      });
      display += '\n';
    }

    // Suggestions
    if (result.suggestions && result.suggestions.length > 0) {
      display += '💡 Suggestions:\n';
      result.suggestions.forEach(suggestion => {
        display += `  • ${suggestion}\n`;
      });
    }

    return display;
  }

  /**
   * Get quick actions based on result
   */
  getQuickActions(result) {
    const actions = [];
    
    // Based on command type, suggest follow-up commands
    if (result.type === 'product') {
      actions.push(`${this.commandPrefix}implement-design`);
      actions.push(`${this.commandPrefix}implement-technical`);
    } else if (result.type === 'design') {
      actions.push(`${this.commandPrefix}implement-technical`);
      actions.push(`${this.commandPrefix}test`);
    } else if (result.type === 'backend') {
      actions.push(`${this.commandPrefix}test`);
      actions.push(`${this.commandPrefix}deploy`);
    }

    // Always include help and menu
    actions.push(`${this.commandPrefix}help`);
    actions.push(`${this.commandPrefix}menu`);

    return actions;
  }

  /**
   * Handle errors gracefully
   */
  handleError(error, commandString) {
    const errorResponse = {
      success: false,
      error: error.message,
      command: commandString,
      timestamp: new Date().toISOString()
    };

    // Add recovery suggestions
    if (error.message.includes('not found')) {
      errorResponse.recovery = 'Check command spelling and try again';
      errorResponse.suggestion = `${this.commandPrefix}menu`;
    } else if (error.message.includes('permission')) {
      errorResponse.recovery = 'Check file permissions';
      errorResponse.suggestion = `${this.commandPrefix}status`;
    } else {
      errorResponse.recovery = 'Try a simpler command or check syntax';
      errorResponse.suggestion = `${this.commandPrefix}help`;
    }

    return errorResponse;
  }

  /**
   * Load configuration
   */
  loadConfig() {
    try {
      const configPath = require('path').join(process.cwd(), 'bumba.config.js');
      if (require('fs').existsSync(configPath)) {
        return require(configPath);
      }
    } catch (error) {
      logger.warn('Could not load config, using defaults');
    }
    
    return {
      claude: {
        enabled: true,
        autoComplete: true,
        suggestions: true
      }
    };
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `bumba-claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      session: this.activeSession ? {
        id: this.activeSession.id,
        duration: Date.now() - this.activeSession.startTime,
        commandCount: this.activeSession.commands.length
      } : null,
      commands: {
        registered: commandHandler.getRegisteredCommands().length,
        available: commandHandler.getRegisteredCommands()
      },
      config: this.config
    };
  }

  /**
   * Reset session
   */
  resetSession() {
    this.activeSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      environment: 'claude',
      commands: []
    };
    logger.info('Session reset');
  }
}

// Create singleton instance
let instance = null;

/**
 * Get or create the integration instance
 */
function getInstance() {
  if (!instance) {
    instance = new BumbaClaudeIntegration();
  }
  return instance;
}

/**
 * Main export - This is what Claude calls
 */
async function bumbaCommand(commandString) {
  const integration = getInstance();
  return await integration.processCommand(commandString);
}

// Export everything needed
module.exports = {
  BumbaClaudeIntegration,
  getInstance,
  bumbaCommand,
  
  // Direct access for testing
  processCommand: async (cmd) => {
    const integration = getInstance();
    return await integration.processCommand(cmd);
  },
  
  // Status check
  getStatus: () => {
    const integration = getInstance();
    return integration.getStatus();
  },
  
  // Session management
  resetSession: () => {
    const integration = getInstance();
    return integration.resetSession();
  }
};