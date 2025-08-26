/**
 * BUMBA Failure-Aware Command System
 */

const { getInstance: getFailureManager } = require('../resilience/unified-failure-manager');
const { createSafeAsync } = require('../resilience/failure-wrapper');
const { logger } = require('../logging/bumba-logger');

class FailureAwareCommandExecutor {
  constructor() {
    this.failureManager = getFailureManager();
    this.commandStats = {
      executed: 0,
      failed: 0,
      recovered: 0
    };
  }
  
  /**
   * Execute command with failure handling
   */
  async execute(command, args, context = {}) {
    this.commandStats.executed++;
    
    try {
      // Create safe wrapper for command
      const safeCommand = createSafeAsync(command, {
        component: 'command',
        operation: command.name || 'unknown',
        ...context
      });
      
      // Execute with failure handling
      const result = await safeCommand(args);
      
      return {
        success: true,
        result
      };
      
    } catch (error) {
      this.commandStats.failed++;
      
      // Attempt recovery
      const recovery = await this.failureManager.handleFailure(error, {
        component: 'command',
        operation: command.name,
        metadata: { args }
      });
      
      if (recovery.recovered) {
        this.commandStats.recovered++;
        
        // Retry command
        const result = await command(args);
        return {
          success: true,
          result,
          recovered: true
        };
      }
      
      return {
        success: false,
        error: error.message,
        failureId: recovery.failureId
      };
    }
  }
  
  /**
   * Get command execution statistics
   */
  getStats() {
    return {
      ...this.commandStats,
      failureRate: this.commandStats.executed > 0
        ? ((this.commandStats.failed / this.commandStats.executed) * 100).toFixed(2) + '%'
        : '0%',
      recoveryRate: this.commandStats.failed > 0
        ? ((this.commandStats.recovered / this.commandStats.failed) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = FailureAwareCommandExecutor;