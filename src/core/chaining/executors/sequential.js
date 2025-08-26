/**
 * BUMBA Sequential Executor
 * Executes commands in sequence, passing context between them
 * Part of the command chaining system
 */

const { EventEmitter } = require('events');
const { logger } = require('../../logging/bumba-logger');

class SequentialExecutor extends EventEmitter {
  constructor(commandHandler) {
    super();
    this.commandHandler = commandHandler;
  }
  
  /**
   * Execute a sequential node
   */
  async execute(node, context = {}) {
    if (node.type !== 'sequential') {
      throw new Error(`Expected sequential node, got ${node.type}`);
    }
    
    const results = [];
    const executionContext = { ...context };
    
    logger.info(`🟢 Executing ${node.nodes.length} commands sequentially`);
    
    for (let i = 0; i < node.nodes.length; i++) {
      const childNode = node.nodes[i];
      const stepNumber = i + 1;
      
      try {
        // Emit progress
        this.emit('step-start', {
          step: stepNumber,
          total: node.nodes.length,
          node: childNode,
          context: executionContext
        });
        
        // Execute based on node type
        const result = await this.executeNode(childNode, executionContext);
        
        // Store result
        results.push({
          step: stepNumber,
          node: childNode,
          result,
          success: true
        });
        
        // Pass result to next command in context
        executionContext.previousResult = result;
        executionContext.previousCommand = this.getNodeCommand(childNode);
        
        // Update chain context with any returned data
        if (result && typeof result === 'object') {
          if (result.context) {
            Object.assign(executionContext, result.context);
          }
          if (result.data) {
            executionContext.chainData = result.data;
          }
        }
        
        // Emit progress
        this.emit('step-complete', {
          step: stepNumber,
          total: node.nodes.length,
          node: childNode,
          result,
          context: executionContext
        });
        
        logger.debug(`Step ${stepNumber}/${node.nodes.length} complete`);
        
      } catch (error) {
        // Handle step failure
        logger.error(`Step ${stepNumber} failed:`, error);
        
        results.push({
          step: stepNumber,
          node: childNode,
          error: error.message,
          success: false
        });
        
        // Emit error
        this.emit('step-error', {
          step: stepNumber,
          total: node.nodes.length,
          node: childNode,
          error,
          context: executionContext
        });
        
        // Decide whether to continue or abort
        if (context.continueOnError) {
          logger.warn(`Continuing despite error at step ${stepNumber}`);
          executionContext.previousError = error;
        } else {
          // Abort chain execution
          throw new Error(`Chain aborted at step ${stepNumber}: ${error.message}`);
        }
      }
      
      // Add delay between commands if configured
      if (context.stepDelay && i < node.nodes.length - 1) {
        await this.delay(context.stepDelay);
      }
    }
    
    return {
      type: 'sequential',
      success: results.every(r => r.success),
      results,
      context: executionContext,
      summary: {
        total: node.nodes.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
  
  /**
   * Execute a single node
   */
  async executeNode(node, context) {
    switch (node.type) {
      case 'command':
        return await this.executeCommand(node, context);
        
      case 'sequential':
        // Nested sequential - delegate to self
        return await this.execute(node, context);
        
      case 'parallel':
        // Need parallel executor
        if (this.parallelExecutor) {
          return await this.parallelExecutor.execute(node, context);
        }
        throw new Error('Parallel executor not available');
        
      case 'conditional':
        return await this.executeConditional(node, context);
        
      case 'pipe':
        return await this.executePipe(node, context);
        
      case 'background':
        return await this.executeBackground(node, context);
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
  
  /**
   * Execute a command node
   */
  async executeCommand(node, context) {
    const { name, args } = node;
    
    logger.debug(`Executing command: ${name} ${args.join(' ')}`);
    
    // Check if command handler exists
    if (!this.commandHandler) {
      throw new Error('No command handler available');
    }
    
    // Prepare command input
    const commandInput = {
      command: name,
      args,
      context: {
        ...context,
        isChained: true
      }
    };
    
    // Execute command
    try {
      const result = await this.commandHandler.execute(commandInput);
      
      return {
        command: name,
        args,
        output: result,
        timestamp: Date.now()
      };
      
    } catch (error) {
      logger.error(`Command ${name} failed:`, error);
      throw error;
    }
  }
  
  /**
   * Execute conditional node
   */
  async executeConditional(node, context) {
    // Execute condition
    const conditionResult = await this.executeNode(node.condition, context);
    
    // Evaluate condition
    const isTrue = this.evaluateCondition(conditionResult);
    
    logger.debug(`Conditional evaluated to: ${isTrue}`);
    
    // Execute appropriate branch
    if (isTrue) {
      return await this.executeNode(node.trueBranch, context);
    } else {
      return await this.executeNode(node.falseBranch, context);
    }
  }
  
  /**
   * Execute pipe node
   */
  async executePipe(node, context) {
    // Execute source command
    const sourceResult = await this.executeNode(node.from, context);
    
    // Create pipe context with source output
    const pipeContext = {
      ...context,
      pipeInput: sourceResult,
      previousResult: sourceResult
    };
    
    // Execute destination with piped data
    return await this.executeNode(node.to, pipeContext);
  }
  
  /**
   * Execute background node
   */
  async executeBackground(node, context) {
    // Start background task (don't await)
    const backgroundPromise = this.executeNode(node.background, {
      ...context,
      isBackground: true
    });
    
    // Store background promise in context
    if (!context.backgroundTasks) {
      context.backgroundTasks = [];
    }
    context.backgroundTasks.push(backgroundPromise);
    
    // Execute foreground task
    const foregroundResult = await this.executeNode(node.foreground, context);
    
    // Return foreground result (background continues)
    return {
      foreground: foregroundResult,
      backgroundStarted: true
    };
  }
  
  /**
   * Evaluate condition result
   */
  evaluateCondition(result) {
    // Check for explicit success/failure
    if (result && typeof result === 'object') {
      if ('success' in result) return result.success;
      if ('error' in result) return false;
      if ('output' in result) {
        // Check command output
        const output = result.output;
        if (typeof output === 'boolean') return output;
        if (typeof output === 'string') {
          // Check for success indicators
          return output.includes('success') || 
                 output.includes('complete') ||
                 output.includes('passed');
        }
      }
    }
    
    // Default to truthy evaluation
    return !!result;
  }
  
  /**
   * Get command name from node
   */
  getNodeCommand(node) {
    if (node.type === 'command') {
      return node.name;
    }
    return node.type;
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Set parallel executor (for nested parallel nodes)
   */
  setParallelExecutor(executor) {
    this.parallelExecutor = executor;
  }
}

module.exports = SequentialExecutor;