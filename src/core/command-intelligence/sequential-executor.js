/**
 * BUMBA Sequential Executor
 * Executes commands in sequence with context passing
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getCommandRouter } = require('./command-router');

class SequentialExecutor {
  constructor() {
    this.router = getCommandRouter();
    this.executionHistory = [];
    this.contextChain = new Map();
  }

  /**
   * Execute commands sequentially
   */
  async executeSequence(chain, initialContext = {}) {
    logger.info(`📝 Executing ${chain.commands.length} commands sequentially`);
    
    const executionId = `seq_${Date.now()}`;
    const results = [];
    let currentContext = { ...initialContext, executionId };
    let previousResult = null;
    
    // Get execution order
    const executionOrder = chain.executionOrder || 
      this.getExecutionOrder(chain);
    
    for (const index of executionOrder) {
      const command = chain.commands[index];
      
      try {
        logger.info(`▶️ Executing command ${index + 1}/${chain.commands.length}: ${command.command}`);
        
        // Build command context
        const commandContext = await this.buildCommandContext(
          command,
          previousResult,
          currentContext,
          chain
        );
        
        // Execute command
        const result = await this.executeCommand(
          command,
          commandContext
        );
        
        // Store result
        results.push({
          index,
          command: command.command,
          args: command.args,
          success: result.success,
          result
        });
        
        // Update context for next command
        currentContext = this.updateContext(currentContext, result);
        previousResult = result;
        
        // Check if we should continue based on operation
        if (!this.shouldContinue(command, result, chain)) {
          logger.info(`⏹️ Stopping chain execution at command ${index}`);
          break;
        }
        
      } catch (error) {
        logger.error(`❌ Command ${index} failed:`, error);
        
        results.push({
          index,
          command: command.command,
          args: command.args,
          success: false,
          error: error.message
        });
        
        // Check if we should continue after error
        if (!this.shouldContinueAfterError(command, chain)) {
          break;
        }
        
        previousResult = { success: false, error: error.message };
      }
    }
    
    // Save execution history
    this.saveExecutionHistory(executionId, chain, results);
    
    return {
      executionId,
      totalCommands: chain.commands.length,
      executedCommands: results.length,
      results,
      finalContext: currentContext,
      success: results.every(r => r.success)
    };
  }

  /**
   * Build context for command execution
   */
  async buildCommandContext(command, previousResult, baseContext, chain) {
    const context = { ...baseContext };
    
    // Add previous result if piping
    if (command.pipeFrom !== undefined && previousResult) {
      context.pipedInput = previousResult.result || previousResult;
      
      // Transform args if piping
      if (!command.args || command.args.length === 0) {
        // Use piped input as args if no args provided
        if (typeof context.pipedInput === 'string') {
          command.args = [context.pipedInput];
        } else if (context.pipedInput.file) {
          command.args = [context.pipedInput.file];
        }
      }
    }
    
    // Add dependency results
    if (command.dependencies && command.dependencies.length > 0) {
      context.dependencies = {};
      
      for (const depIndex of command.dependencies) {
        const depCommand = chain.commands[depIndex];
        if (this.contextChain.has(depIndex)) {
          context.dependencies[depCommand.command] = 
            this.contextChain.get(depIndex);
        }
      }
    }
    
    // Add chain metadata
    context.chainExecution = true;
    context.commandIndex = command.index;
    context.totalCommands = chain.commands.length;
    
    return context;
  }

  /**
   * Execute single command
   */
  async executeCommand(command, context) {
    // Initialize router if needed
    if (!this.router.initialized) {
      await this.router.initialize();
    }
    
    // Route command through intelligent system
    const result = await this.router.route(
      command.command,
      command.args,
      context
    );
    
    // Store in context chain
    this.contextChain.set(command.index, result);
    
    return result;
  }

  /**
   * Update context with command result
   */
  updateContext(context, result) {
    const newContext = { ...context };
    
    // Add result data to context
    if (result.success) {
      // Extract useful data from result
      if (result.file) {
        newContext.lastFile = result.file;
      }
      
      if (result.analysis) {
        newContext.lastAnalysis = result.analysis;
      }
      
      if (result.department) {
        newContext.lastDepartment = result.department;
      }
      
      // Accumulate insights
      if (!newContext.insights) {
        newContext.insights = [];
      }
      
      if (result.result && result.result.insights) {
        newContext.insights.push(...result.result.insights);
      }
    }
    
    // Update execution state
    newContext.lastCommandSuccess = result.success;
    newContext.lastCommandResult = result;
    
    return newContext;
  }

  /**
   * Determine if chain should continue
   */
  shouldContinue(command, result, chain) {
    // Check sequential operator (&&)
    if (command.requiresSuccess !== undefined) {
      return result.success;
    }
    
    // Check fallback operator (||)
    if (command.requiresFailure !== undefined) {
      return !result.success;
    }
    
    // Default: continue
    return true;
  }

  /**
   * Determine if chain should continue after error
   */
  shouldContinueAfterError(command, chain) {
    // If next command has fallback operator, continue
    const nextIndex = command.index + 1;
    if (nextIndex < chain.commands.length) {
      const nextCommand = chain.commands[nextIndex];
      if (nextCommand.requiresFailure !== undefined) {
        return true;
      }
    }
    
    // Otherwise stop on error
    return false;
  }

  /**
   * Get execution order for chain
   */
  getExecutionOrder(chain) {
    const order = [];
    const executed = new Set();
    
    // Helper to check if dependencies are met
    const canExecute = (command) => {
      if (!command.dependencies || command.dependencies.length === 0) {
        return true;
      }
      
      return command.dependencies.every(dep => executed.has(dep));
    };
    
    // Process commands in dependency order
    while (order.length < chain.commands.length) {
      let progress = false;
      
      for (let i = 0; i < chain.commands.length; i++) {
        if (!executed.has(i) && canExecute(chain.commands[i])) {
          order.push(i);
          executed.add(i);
          progress = true;
        }
      }
      
      if (!progress) {
        // Add remaining commands (might have issues)
        for (let i = 0; i < chain.commands.length; i++) {
          if (!executed.has(i)) {
            order.push(i);
            executed.add(i);
          }
        }
        break;
      }
    }
    
    return order;
  }

  /**
   * Save execution history
   */
  saveExecutionHistory(executionId, chain, results) {
    const history = {
      executionId,
      timestamp: new Date().toISOString(),
      chain: {
        commands: chain.commands.map(c => `${c.command} ${c.args.join(' ')}`),
        operations: chain.operations
      },
      results: results.map(r => ({
        command: r.command,
        success: r.success,
        error: r.error
      })),
      success: results.every(r => r.success)
    };
    
    this.executionHistory.push(history);
    
    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get execution history
   */
  getHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear context chain
   */
  clearContextChain() {
    this.contextChain.clear();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SequentialExecutor,
  getInstance: () => {
    if (!instance) {
      instance = new SequentialExecutor();
    }
    return instance;
  }
};