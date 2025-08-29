/**
 * BUMBA Claude Command Bridge
 * Connects /bumba: slash commands in Claude to actual implementations
 */

const chalk = require('chalk');
const { logger } = require('./logging/bumba-logger');
const { commandHandler } = require('./command-handler');

class ClaudeCommandBridge {
  constructor() {
    this.commandHandler = commandHandler;
    this.commandPrefix = '/bumba:';
    this.activeCommands = new Map();
    this.commandHistory = [];
    this.maxHistorySize = 100;
    
    logger.info('🏁 Claude Command Bridge initialized');
  }

  /**
   * Process a command string from Claude
   * @param {string} commandString - Full command string like "/bumba:implement user auth"
   * @returns {Object} Command execution result
   */
  async processCommand(commandString) {
    try {
      // Validate command format
      if (!commandString.startsWith(this.commandPrefix)) {
        return {
          success: false,
          error: 'Invalid command format. Commands must start with /bumba:',
          suggestion: `Try: ${this.commandPrefix}menu for available commands`
        };
      }

      // Parse command and arguments
      const { command, args } = this.parseCommand(commandString);
      
      // Log command for history
      this.addToHistory(commandString);
      
      // Create execution context
      const context = {
        source: 'claude',
        timestamp: new Date().toISOString(),
        originalCommand: command,
        fullCommand: commandString,
        sessionId: this.generateSessionId()
      };

      logger.info(`🟢 Processing Claude command: ${command} with args:`, args);

      // Check if command exists
      if (!this.commandHandler.hasCommand(command)) {
        return this.handleUnknownCommand(command, args);
      }

      // Mark command as active
      const commandId = this.generateCommandId();
      this.activeCommands.set(commandId, {
        command,
        args,
        startTime: Date.now(),
        status: 'executing'
      });

      // Execute command
      const result = await this.commandHandler.execute(command, args, context);

      // Mark command as complete
      this.activeCommands.delete(commandId);

      // Format and return result
      return this.formatResult(command, result);

    } catch (error) {
      logger.error('Command execution failed:', error);
      return {
        success: false,
        error: error.message,
        stack: process.env.DEBUG ? error.stack : undefined,
        recovery: this.getSuggestedRecovery(error)
      };
    }
  }

  /**
   * Parse command string into command and arguments
   */
  parseCommand(commandString) {
    // Remove prefix
    const withoutPrefix = commandString.slice(this.commandPrefix.length);
    
    // Split by space, handling quoted arguments
    const parts = this.parseArguments(withoutPrefix);
    
    // First part is the command
    const command = parts[0] || '';
    
    // Rest are arguments
    const args = parts.slice(1);
    
    // Handle special command formats
    const normalizedCommand = this.normalizeCommand(command);
    
    return { command: normalizedCommand, args };
  }

  /**
   * Parse arguments handling quotes and special characters
   */
  parseArguments(str) {
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      args.push(current);
    }
    
    return args;
  }

  /**
   * Normalize command names for consistency
   */
  normalizeCommand(command) {
    // Handle aliases
    const aliases = {
      'impl': 'implement',
      'analyze': 'analyze',
      'analyse': 'analyze',
      'conscious': 'conscious-analyze',
      'lite': 'lite',
      'exec': 'execute',
      'orchestrate': 'orchestrate'
    };
    
    // Check for exact alias match
    if (aliases[command]) {
      return aliases[command];
    }
    
    // Handle hyphenated commands
    if (command.includes('-')) {
      return command;
    }
    
    // Handle compound commands (e.g., "implement agents" -> "implement-agents")
    if (command === 'implement' || command === 'research' || command === 'analyze') {
      // These commands might have sub-types that should be hyphenated
      return command;
    }
    
    return command;
  }

  /**
   * Handle unknown commands with suggestions
   */
  async handleUnknownCommand(command, args) {
    const availableCommands = this.commandHandler.getRegisteredCommands();
    
    // Find similar commands
    const suggestions = this.findSimilarCommands(command, availableCommands);
    
    return {
      success: false,
      error: `Unknown command: ${command}`,
      availableCommands: availableCommands.slice(0, 10),
      suggestions,
      help: `Use ${this.commandPrefix}menu to see all available commands`,
      recovery: {
        action: 'show-menu',
        message: 'Would you like to see the command menu?'
      }
    };
  }

  /**
   * Find commands similar to the input
   */
  findSimilarCommands(input, commands) {
    return commands
      .map(cmd => ({
        command: cmd,
        similarity: this.calculateSimilarity(input, cmd)
      }))
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.command);
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Format command result for Claude display
   */
  formatResult(command, result) {
    // Ensure result is an object
    if (!result || typeof result !== 'object') {
      result = { output: result };
    }

    // Add metadata
    const formatted = {
      success: result.success !== false,
      command,
      timestamp: new Date().toISOString(),
      ...result
    };

    // Add execution stats if available
    if (result.executionTime) {
      formatted.performance = {
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed
      };
    }

    // Add next steps if available
    if (result.nextSteps) {
      formatted.suggestions = result.nextSteps;
    }

    return formatted;
  }

  /**
   * Get suggested recovery actions for errors
   */
  getSuggestedRecovery(error) {
    const errorPatterns = {
      'permission': 'Check file permissions and try again',
      'not found': 'Verify the resource exists and the path is correct',
      'timeout': 'The operation took too long. Try with smaller scope',
      'memory': 'Operation requires too much memory. Try lite mode',
      'connection': 'Check network connection and service availability'
    };

    const errorStr = error.message.toLowerCase();
    
    for (const [pattern, suggestion] of Object.entries(errorPatterns)) {
      if (errorStr.includes(pattern)) {
        return {
          suggestion,
          alternativeCommand: this.getAlternativeCommand(error)
        };
      }
    }

    return {
      suggestion: 'Try running the command with different parameters',
      alternativeCommand: `${this.commandPrefix}help ${error.command || ''}`
    };
  }

  /**
   * Get alternative command based on error
   */
  getAlternativeCommand(error) {
    if (error.message.includes('memory')) {
      return `${this.commandPrefix}lite`;
    }
    if (error.message.includes('permission')) {
      return `${this.commandPrefix}status`;
    }
    return `${this.commandPrefix}help`;
  }

  /**
   * Add command to history
   */
  addToHistory(commandString) {
    this.commandHistory.push({
      command: commandString,
      timestamp: new Date().toISOString()
    });

    // Trim history if too large
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get command history
   */
  getHistory(limit = 10) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = [];
    logger.info('Command history cleared');
  }

  /**
   * Get active commands
   */
  getActiveCommands() {
    return Array.from(this.activeCommands.entries()).map(([id, cmd]) => ({
      id,
      ...cmd,
      duration: Date.now() - cmd.startTime
    }));
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique command ID
   */
  generateCommandId() {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get bridge status
   */
  getStatus() {
    return {
      operational: true,
      activeCommands: this.activeCommands.size,
      historySize: this.commandHistory.length,
      registeredCommands: this.commandHandler.getRegisteredCommands().length,
      lastCommand: this.commandHistory[this.commandHistory.length - 1] || null
    };
  }
}

// Create singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ClaudeCommandBridge();
  }
  return instance;
}

// Export for use in Claude integration
module.exports = {
  ClaudeCommandBridge,
  getInstance,
  
  // Direct command processing function for Claude
  processClaudeCommand: async (commandString) => {
    const bridge = getInstance();
    return await bridge.processCommand(commandString);
  }
};