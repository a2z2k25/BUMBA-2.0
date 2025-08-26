/**
 * BUMBA Chain Executor
 * Main executor that orchestrates sequential and parallel executors
 * Handles the complete chain execution lifecycle
 */

const { EventEmitter } = require('events');
const SequentialExecutor = require('./executors/sequential');
const ParallelExecutor = require('./executors/parallel');
const { logger } = require('../logging/bumba-logger');

class ChainExecutor extends EventEmitter {
  constructor(commandHandler, options = {}) {
    super();
    
    this.commandHandler = commandHandler;
    this.options = {
      maxDepth: options.maxDepth || 10,
      timeout: options.timeout || 600000, // 10 minutes
      continueOnError: options.continueOnError || false,
      ...options
    };
    
    // Create executors
    this.sequentialExecutor = new SequentialExecutor(commandHandler);
    this.parallelExecutor = new ParallelExecutor(commandHandler, {
      maxConcurrent: options.maxConcurrent || 5,
      timeout: options.nodeTimeout || 300000 // 5 minutes per node
    });
    
    // Cross-reference executors
    this.sequentialExecutor.setParallelExecutor(this.parallelExecutor);
    this.parallelExecutor.setSequentialExecutor(this.sequentialExecutor);
    
    // Forward events
    this.setupEventForwarding();
    
    // Execution state
    this.currentDepth = 0;
  }
  
  /**
   * Setup event forwarding from sub-executors
   */
  setupEventForwarding() {
    // Forward sequential events
    this.sequentialExecutor.on('step-start', (data) => {
      this.emit('node-start', { ...data, executor: 'sequential' });
    });
    
    this.sequentialExecutor.on('step-complete', (data) => {
      this.emit('node-complete', { ...data, executor: 'sequential' });
    });
    
    this.sequentialExecutor.on('step-error', (data) => {
      this.emit('node-error', { ...data, executor: 'sequential' });
    });
    
    // Forward parallel events
    this.parallelExecutor.on('parallel-start', (data) => {
      this.emit('parallel-start', data);
    });
    
    this.parallelExecutor.on('parallel-complete', (data) => {
      this.emit('parallel-complete', data);
    });
    
    this.parallelExecutor.on('node-start', (data) => {
      this.emit('node-start', { ...data, executor: 'parallel' });
    });
    
    this.parallelExecutor.on('node-complete', (data) => {
      this.emit('node-complete', { ...data, executor: 'parallel' });
    });
    
    this.parallelExecutor.on('node-error', (data) => {
      this.emit('node-error', { ...data, executor: 'parallel' });
    });
  }
  
  /**
   * Execute a chain root node
   */
  async execute(rootNode, context = {}) {
    // Check depth limit
    if (this.currentDepth >= this.options.maxDepth) {
      throw new Error(`Maximum chain depth (${this.options.maxDepth}) exceeded`);
    }
    
    this.currentDepth++;
    const startTime = Date.now();
    
    try {
      // Emit chain start
      this.emit('chain-start', {
        node: rootNode,
        context,
        depth: this.currentDepth
      });
      
      // Execute with timeout
      const result = await this.executeWithTimeout(rootNode, context);
      
      // Emit chain complete
      this.emit('chain-complete', {
        node: rootNode,
        result,
        duration: Date.now() - startTime,
        depth: this.currentDepth
      });
      
      return result;
      
    } catch (error) {
      // Emit chain error
      this.emit('chain-error', {
        node: rootNode,
        error,
        duration: Date.now() - startTime,
        depth: this.currentDepth
      });
      
      throw error;
      
    } finally {
      this.currentDepth--;
    }
  }
  
  /**
   * Execute with timeout
   */
  async executeWithTimeout(node, context) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Chain execution timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
    
    const executionPromise = this.executeNode(node, context);
    
    return await Promise.race([executionPromise, timeoutPromise]);
  }
  
  /**
   * Execute a single node
   */
  async executeNode(node, context) {
    // Add chain context
    const chainContext = {
      ...context,
      continueOnError: this.options.continueOnError,
      stepDelay: this.options.stepDelay,
      depth: this.currentDepth
    };
    
    switch (node.type) {
      case 'command':
        return await this.executeCommand(node, chainContext);
        
      case 'sequential':
        return await this.sequentialExecutor.execute(node, chainContext);
        
      case 'parallel':
        return await this.parallelExecutor.execute(node, chainContext);
        
      case 'conditional':
        return await this.executeConditional(node, chainContext);
        
      case 'pipe':
        return await this.executePipe(node, chainContext);
        
      case 'background':
        return await this.executeBackground(node, chainContext);
        
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
    
    if (!this.commandHandler) {
      throw new Error('No command handler available');
    }
    
    const commandInput = {
      command: name,
      args,
      context: {
        ...context,
        isChained: true
      }
    };
    
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
    if (result && typeof result === 'object') {
      if ('success' in result) return result.success;
      if ('error' in result) return false;
      if ('output' in result) {
        const output = result.output;
        if (typeof output === 'boolean') return output;
        if (typeof output === 'string') {
          return output.includes('success') || 
                 output.includes('complete') ||
                 output.includes('passed');
        }
      }
    }
    
    return !!result;
  }
  
  /**
   * Get executor statistics
   */
  getStats() {
    return {
      currentDepth: this.currentDepth,
      maxDepth: this.options.maxDepth,
      timeout: this.options.timeout,
      sequential: this.sequentialExecutor.getStats ? 
        this.sequentialExecutor.getStats() : {},
      parallel: this.parallelExecutor.getStats()
    };
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.removeAllListeners();
    this.sequentialExecutor.removeAllListeners();
    this.parallelExecutor.removeAllListeners();
  }
}

module.exports = ChainExecutor;