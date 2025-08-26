/**
 * BUMBA Parallel Executor
 * Executes commands in parallel, aggregating results
 * Maximizes the power of multi-agent collaboration
 */

const { EventEmitter } = require('events');
const { logger } = require('../../logging/bumba-logger');

class ParallelExecutor extends EventEmitter {
  constructor(commandHandler, options = {}) {
    super();
    this.commandHandler = commandHandler;
    this.options = {
      maxConcurrent: options.maxConcurrent || 5,
      timeout: options.timeout || 300000, // 5 minutes default
      ...options
    };
    
    // Reference to sequential executor for nested sequential nodes
    this.sequentialExecutor = null;
  }
  
  /**
   * Execute a parallel node
   */
  async execute(node, context = {}) {
    if (node.type !== 'parallel') {
      throw new Error(`Expected parallel node, got ${node.type}`);
    }
    
    const startTime = Date.now();
    const promises = [];
    const results = [];
    
    logger.info(`🟡 Executing ${node.nodes.length} commands in parallel`);
    
    // Emit start event
    this.emit('parallel-start', {
      count: node.nodes.length,
      nodes: node.nodes,
      context
    });
    
    // Create promises for each node
    for (let i = 0; i < node.nodes.length; i++) {
      const childNode = node.nodes[i];
      const nodeIndex = i;
      
      // Create independent context for each parallel branch
      const branchContext = {
        ...context,
        parallelBranch: nodeIndex,
        parallelTotal: node.nodes.length
      };
      
      // Create promise for this node
      const promise = this.executeNodeWithTracking(childNode, branchContext, nodeIndex);
      promises.push(promise);
      
      // Limit concurrent executions if configured
      if (promises.length >= this.options.maxConcurrent) {
        // Wait for at least one to complete before continuing
        const completed = await Promise.race(promises);
        results.push(completed);
        
        // Remove completed promise
        const index = promises.findIndex(p => p === completed);
        if (index > -1) {
          promises.splice(index, 1);
        }
      }
    }
    
    // Wait for all remaining promises
    try {
      const remainingResults = await Promise.allSettled(promises);
      
      // Process results
      remainingResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            nodeIndex: promises[index]?.nodeIndex || index,
            error: result.reason,
            success: false
          });
        }
      });
      
    } catch (error) {
      logger.error('Parallel execution error:', error);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Sort results by original index
    results.sort((a, b) => a.nodeIndex - b.nodeIndex);
    
    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Emit completion
    this.emit('parallel-complete', {
      count: node.nodes.length,
      successful,
      failed,
      duration,
      results
    });
    
    logger.info(`🏁 Parallel execution complete: ${successful}/${node.nodes.length} successful in ${duration}ms`);
    
    return {
      type: 'parallel',
      success: failed === 0,
      results,
      context,
      summary: {
        total: node.nodes.length,
        successful,
        failed,
        duration
      }
    };
  }
  
  /**
   * Execute node with progress tracking
   */
  async executeNodeWithTracking(node, context, index) {
    const startTime = Date.now();
    
    try {
      // Emit node start
      this.emit('node-start', {
        nodeIndex: index,
        node,
        context
      });
      
      // Execute node
      const result = await this.executeNode(node, context);
      
      const duration = Date.now() - startTime;
      
      // Emit node complete
      this.emit('node-complete', {
        nodeIndex: index,
        node,
        result,
        duration
      });
      
      return {
        nodeIndex: index,
        node,
        result,
        success: true,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Emit node error
      this.emit('node-error', {
        nodeIndex: index,
        node,
        error,
        duration
      });
      
      logger.error(`Parallel node ${index} failed:`, error);
      
      return {
        nodeIndex: index,
        node,
        error: error.message,
        success: false,
        duration
      };
    }
  }
  
  /**
   * Execute a single node
   */
  async executeNode(node, context) {
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Node execution timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
    
    const executionPromise = this.executeNodeInternal(node, context);
    
    // Race between execution and timeout
    return await Promise.race([executionPromise, timeoutPromise]);
  }
  
  /**
   * Internal node execution
   */
  async executeNodeInternal(node, context) {
    switch (node.type) {
      case 'command':
        return await this.executeCommand(node, context);
        
      case 'sequential':
        // Use sequential executor if available
        if (this.sequentialExecutor) {
          return await this.sequentialExecutor.execute(node, context);
        }
        throw new Error('Sequential executor not available');
        
      case 'parallel':
        // Nested parallel - recursive call
        return await this.execute(node, context);
        
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
    
    logger.debug(`[Parallel] Executing command: ${name} ${args.join(' ')}`);
    
    if (!this.commandHandler) {
      throw new Error('No command handler available');
    }
    
    const commandInput = {
      command: name,
      args,
      context: {
        ...context,
        isChained: true,
        isParallel: true
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
      logger.error(`[Parallel] Command ${name} failed:`, error);
      throw error;
    }
  }
  
  /**
   * Execute conditional node
   */
  async executeConditional(node, context) {
    // Execute condition
    const conditionResult = await this.executeNodeInternal(node.condition, context);
    
    // Evaluate condition
    const isTrue = this.evaluateCondition(conditionResult);
    
    // Execute appropriate branch
    if (isTrue) {
      return await this.executeNodeInternal(node.trueBranch, context);
    } else {
      return await this.executeNodeInternal(node.falseBranch, context);
    }
  }
  
  /**
   * Execute pipe node
   */
  async executePipe(node, context) {
    // In parallel context, pipes still execute sequentially
    const sourceResult = await this.executeNodeInternal(node.from, context);
    
    const pipeContext = {
      ...context,
      pipeInput: sourceResult,
      previousResult: sourceResult
    };
    
    return await this.executeNodeInternal(node.to, pipeContext);
  }
  
  /**
   * Execute background node
   */
  async executeBackground(node, context) {
    // Start background task
    const backgroundPromise = this.executeNodeInternal(node.background, {
      ...context,
      isBackground: true
    });
    
    // Don't track in parallel context - let it run truly in background
    
    // Execute foreground task
    const foregroundResult = await this.executeNodeInternal(node.foreground, context);
    
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
   * Set sequential executor (for nested sequential nodes)
   */
  setSequentialExecutor(executor) {
    this.sequentialExecutor = executor;
  }
  
  /**
   * Get parallel execution statistics
   */
  getStats() {
    return {
      maxConcurrent: this.options.maxConcurrent,
      timeout: this.options.timeout
    };
  }
}

module.exports = ParallelExecutor;