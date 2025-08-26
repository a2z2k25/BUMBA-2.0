/**
 * BUMBA Pipeline Orchestrator
 * Complex workflow orchestration and pipeline composition
 * Part of Pipeline Manager enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Orchestrator for complex pipeline workflows
 */
class PipelineOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxDepth: config.maxDepth || 10,
      maxBranches: config.maxBranches || 20,
      enableConditional: config.enableConditional !== false,
      enableLoops: config.enableLoops !== false,
      enableParallel: config.enableParallel !== false,
      enableDistributed: config.enableDistributed || false,
      ...config
    };
    
    // Orchestration patterns
    this.patterns = new Map();
    this.compositions = new Map();
    this.workflows = new Map();
    
    // Flow control
    this.conditionalHandlers = new Map();
    this.loopHandlers = new Map();
    this.branchHandlers = new Map();
    
    // Data flow
    this.dataTransformers = new Map();
    this.dataAggregators = new Map();
    this.dataSplitters = new Map();
    this.dataMergers = new Map();
    
    // Distributed orchestration
    this.distributedNodes = new Map();
    this.partitionStrategies = new Map();
    this.coordinators = new Map();
    
    // State management
    this.orchestrationState = new Map();
    this.checkpoints = new Map();
    this.rollbackPoints = new Map();
    
    // Error handling
    this.errorHandlers = new Map();
    this.compensationHandlers = new Map();
    this.circuitBreakers = new Map();
    
    // Metrics
    this.metrics = {
      orchestrationsCreated: 0,
      orchestrationsExecuted: 0,
      patternsApplied: 0,
      branchesExecuted: 0,
      loopsExecuted: 0,
      parallelExecutions: 0,
      distributedExecutions: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize orchestrator
   */
  initialize() {
    this.registerDefaultPatterns();
    this.setupFlowControlHandlers();
    this.initializeDistributedSupport();
    
    logger.info('🔴 Pipeline Orchestrator initialized');
  }
  
  /**
   * Create orchestrated workflow
   */
  async createOrchestration(definition) {
    const orchestration = {
      id: this.generateOrchestrationId(),
      name: definition.name || 'Unnamed Orchestration',
      type: definition.type || 'custom',
      pattern: definition.pattern,
      
      // Structure
      pipelines: definition.pipelines || [],
      connections: definition.connections || [],
      branches: definition.branches || [],
      loops: definition.loops || [],
      
      // Data flow
      dataFlow: {
        strategy: definition.dataFlow || 'pipeline',
        transformers: definition.transformers || [],
        aggregators: definition.aggregators || [],
        splitters: definition.splitters || [],
        mergers: definition.mergers || []
      },
      
      // Control flow
      controlFlow: {
        conditionals: definition.conditionals || [],
        errorHandling: definition.errorHandling || 'fail-fast',
        compensation: definition.compensation || [],
        checkpoints: definition.checkpoints || []
      },
      
      // Execution config
      config: {
        parallel: definition.parallel || false,
        distributed: definition.distributed || false,
        maxConcurrency: definition.maxConcurrency || 5,
        timeout: definition.timeout || 3600000,
        retries: definition.retries || 3,
        ...definition.config
      },
      
      // State
      state: {
        status: 'created',
        currentPhase: null,
        completedPhases: [],
        dataContext: {},
        errors: []
      }
    };
    
    // Apply pattern if specified
    if (orchestration.pattern) {
      await this.applyPattern(orchestration);
    }
    
    // Validate orchestration
    this.validateOrchestration(orchestration);
    
    // Store orchestration
    this.workflows.set(orchestration.id, orchestration);
    
    this.metrics.orchestrationsCreated++;
    
    this.emit('orchestration:created', orchestration);
    
    return orchestration;
  }
  
  /**
   * Execute orchestrated workflow
   */
  async executeOrchestration(orchestrationId, input, context = {}) {
    const orchestration = this.workflows.get(orchestrationId);
    
    if (!orchestration) {
      throw new Error(`Orchestration not found: ${orchestrationId}`);
    }
    
    const execution = {
      id: this.generateExecutionId(),
      orchestrationId,
      orchestration: { ...orchestration },
      input,
      context,
      startTime: Date.now(),
      state: {
        phase: 'initializing',
        dataContext: { input },
        results: {},
        errors: [],
        checkpoints: []
      }
    };
    
    try {
      // Initialize state
      this.orchestrationState.set(execution.id, execution.state);
      
      // Execute based on pattern
      let result;
      
      if (orchestration.config.distributed) {
        result = await this.executeDistributed(execution);
      } else if (orchestration.config.parallel) {
        result = await this.executeParallel(execution);
      } else {
        result = await this.executeSequential(execution);
      }
      
      execution.state.phase = 'completed';
      execution.endTime = Date.now();
      
      this.metrics.orchestrationsExecuted++;
      
      this.emit('orchestration:completed', { execution, result });
      
      return result;
      
    } catch (error) {
      execution.state.phase = 'failed';
      execution.state.errors.push(error);
      
      // Handle error
      await this.handleOrchestrationError(execution, error);
      
      this.emit('orchestration:failed', { execution, error });
      
      throw error;
      
    } finally {
      // Cleanup
      this.orchestrationState.delete(execution.id);
    }
  }
  
  /**
   * Execute sequential orchestration
   */
  async executeSequential(execution) {
    const { orchestration, state } = execution;
    const results = [];
    
    for (let i = 0; i < orchestration.pipelines.length; i++) {
      const pipeline = orchestration.pipelines[i];
      state.phase = `pipeline_${i}`;
      
      try {
        // Check conditionals
        if (!await this.evaluateConditionals(pipeline, state)) {
          continue;
        }
        
        // Create checkpoint if needed
        if (orchestration.controlFlow.checkpoints.includes(i)) {
          await this.createCheckpoint(execution, i);
        }
        
        // Get input data
        const inputData = await this.resolveInputData(pipeline, state, orchestration.dataFlow);
        
        // Execute pipeline
        const result = await this.executePipeline(pipeline, inputData, execution);
        
        // Transform output if needed
        const outputData = await this.transformOutputData(result, pipeline, orchestration.dataFlow);
        
        // Store result
        state.dataContext[pipeline.id || `pipeline_${i}`] = outputData;
        results.push(outputData);
        
        // Check for branching
        const branch = await this.checkBranching(pipeline, outputData, orchestration);
        if (branch) {
          const branchResult = await this.executeBranch(branch, state, execution);
          results.push(branchResult);
        }
        
        // Check for loops
        if (await this.checkLoopCondition(pipeline, state, orchestration)) {
          i--; // Repeat current pipeline
          this.metrics.loopsExecuted++;
        }
        
      } catch (error) {
        await this.handlePipelineError(pipeline, error, execution);
        
        if (orchestration.controlFlow.errorHandling === 'fail-fast') {
          throw error;
        }
      }
    }
    
    return this.aggregateResults(results, orchestration.dataFlow);
  }
  
  /**
   * Execute parallel orchestration
   */
  async executeParallel(execution) {
    const { orchestration, state } = execution;
    
    // Group pipelines by dependencies
    const groups = this.groupByDependencies(orchestration.pipelines, orchestration.connections);
    
    const results = [];
    
    for (const group of groups) {
      state.phase = `parallel_group_${groups.indexOf(group)}`;
      
      const promises = group.map(async (pipeline) => {
        try {
          // Check conditionals
          if (!await this.evaluateConditionals(pipeline, state)) {
            return null;
          }
          
          // Get input data
          const inputData = await this.resolveInputData(pipeline, state, orchestration.dataFlow);
          
          // Execute pipeline
          const result = await this.executePipeline(pipeline, inputData, execution);
          
          // Transform output
          const outputData = await this.transformOutputData(result, pipeline, orchestration.dataFlow);
          
          // Store result
          state.dataContext[pipeline.id] = outputData;
          
          return outputData;
          
        } catch (error) {
          await this.handlePipelineError(pipeline, error, execution);
          
          if (orchestration.controlFlow.errorHandling === 'fail-fast') {
            throw error;
          }
          
          return null;
        }
      });
      
      const groupResults = await Promise.all(promises);
      results.push(...groupResults.filter(r => r !== null));
      
      this.metrics.parallelExecutions++;
    }
    
    return this.aggregateResults(results, orchestration.dataFlow);
  }
  
  /**
   * Execute distributed orchestration
   */
  async executeDistributed(execution) {
    const { orchestration, state } = execution;
    
    if (!this.config.enableDistributed) {
      throw new Error('Distributed execution not enabled');
    }
    
    state.phase = 'distributed';
    
    // Partition data
    const partitions = await this.partitionData(
      state.dataContext.input,
      orchestration.config.partitionStrategy
    );
    
    // Assign to nodes
    const assignments = await this.assignToNodes(partitions, orchestration);
    
    // Execute on nodes
    const promises = assignments.map(async ({ node, partition, pipeline }) => {
      try {
        const result = await this.executeOnNode(node, pipeline, partition, execution);
        
        return {
          node: node.id,
          result
        };
        
      } catch (error) {
        logger.error(`Execution failed on node ${node.id}:`, error);
        
        if (orchestration.controlFlow.errorHandling === 'fail-fast') {
          throw error;
        }
        
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    
    // Merge results
    const mergedResults = await this.mergeDistributedResults(
      results.filter(r => r !== null),
      orchestration.dataFlow
    );
    
    this.metrics.distributedExecutions++;
    
    return mergedResults;
  }
  
  /**
   * Execute branch
   */
  async executeBranch(branch, state, execution) {
    const { orchestration } = execution;
    
    state.phase = `branch_${branch.id}`;
    
    const branchExecution = {
      ...execution,
      orchestration: {
        ...orchestration,
        pipelines: branch.pipelines
      }
    };
    
    const result = await this.executeSequential(branchExecution);
    
    this.metrics.branchesExecuted++;
    
    return result;
  }
  
  /**
   * Register orchestration patterns
   */
  registerDefaultPatterns() {
    // Map-Reduce pattern
    this.registerPattern('map-reduce', {
      name: 'Map-Reduce',
      description: 'Distributed map-reduce processing',
      apply: (orchestration) => {
        orchestration.config.distributed = true;
        orchestration.dataFlow.strategy = 'map-reduce';
        orchestration.dataFlow.splitters.push('partition');
        orchestration.dataFlow.mergers.push('reduce');
      }
    });
    
    // Scatter-Gather pattern
    this.registerPattern('scatter-gather', {
      name: 'Scatter-Gather',
      description: 'Scatter work and gather results',
      apply: (orchestration) => {
        orchestration.config.parallel = true;
        orchestration.dataFlow.strategy = 'scatter-gather';
        orchestration.dataFlow.splitters.push('scatter');
        orchestration.dataFlow.aggregators.push('gather');
      }
    });
    
    // Pipeline pattern
    this.registerPattern('pipeline', {
      name: 'Pipeline',
      description: 'Sequential pipeline processing',
      apply: (orchestration) => {
        orchestration.config.parallel = false;
        orchestration.dataFlow.strategy = 'pipeline';
      }
    });
    
    // Fork-Join pattern
    this.registerPattern('fork-join', {
      name: 'Fork-Join',
      description: 'Fork execution and join results',
      apply: (orchestration) => {
        orchestration.config.parallel = true;
        orchestration.dataFlow.strategy = 'fork-join';
        orchestration.dataFlow.splitters.push('fork');
        orchestration.dataFlow.mergers.push('join');
      }
    });
    
    // Saga pattern
    this.registerPattern('saga', {
      name: 'Saga',
      description: 'Long-running transaction with compensation',
      apply: (orchestration) => {
        orchestration.controlFlow.errorHandling = 'compensate';
        orchestration.controlFlow.checkpoints = [0, 2, 4]; // Default checkpoints
      }
    });
    
    // Circuit Breaker pattern
    this.registerPattern('circuit-breaker', {
      name: 'Circuit Breaker',
      description: 'Fail fast with circuit breaker',
      apply: (orchestration) => {
        orchestration.controlFlow.errorHandling = 'circuit-breaker';
        orchestration.config.circuitBreaker = {
          threshold: 5,
          timeout: 60000,
          halfOpenRequests: 3
        };
      }
    });
  }
  
  /**
   * Setup flow control handlers
   */
  setupFlowControlHandlers() {
    // Conditional handlers
    this.conditionalHandlers.set('if', async (condition, state) => {
      return this.evaluateExpression(condition, state);
    });
    
    this.conditionalHandlers.set('switch', async (cases, state) => {
      for (const c of cases) {
        if (await this.evaluateExpression(c.condition, state)) {
          return c;
        }
      }
      return null;
    });
    
    // Loop handlers
    this.loopHandlers.set('while', async (condition, state) => {
      return this.evaluateExpression(condition, state);
    });
    
    this.loopHandlers.set('for', async (config, state) => {
      if (!state.loopCounter) state.loopCounter = {};
      
      const counter = state.loopCounter[config.id] || 0;
      state.loopCounter[config.id] = counter + 1;
      
      return counter < config.iterations;
    });
    
    this.loopHandlers.set('foreach', async (config, state) => {
      const items = state.dataContext[config.itemsField];
      
      if (!state.foreachIndex) state.foreachIndex = {};
      
      const index = state.foreachIndex[config.id] || 0;
      
      if (index < items.length) {
        state.dataContext[config.itemField] = items[index];
        state.foreachIndex[config.id] = index + 1;
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Initialize distributed support
   */
  initializeDistributedSupport() {
    if (!this.config.enableDistributed) {
      return;
    }
    
    // Register partition strategies
    this.partitionStrategies.set('hash', (data, partitions) => {
      // Hash-based partitioning
      return this.hashPartition(data, partitions);
    });
    
    this.partitionStrategies.set('range', (data, partitions) => {
      // Range-based partitioning
      return this.rangePartition(data, partitions);
    });
    
    this.partitionStrategies.set('round-robin', (data, partitions) => {
      // Round-robin partitioning
      return this.roundRobinPartition(data, partitions);
    });
    
    // Initialize coordinator
    this.coordinators.set('default', {
      assignWork: this.assignWorkToNodes.bind(this),
      collectResults: this.collectNodeResults.bind(this),
      handleFailure: this.handleNodeFailure.bind(this)
    });
  }
  
  /**
   * Helper methods
   */
  
  registerPattern(name, pattern) {
    this.patterns.set(name, pattern);
    logger.info(`📝 Registered orchestration pattern: ${name}`);
  }
  
  async applyPattern(orchestration) {
    const pattern = this.patterns.get(orchestration.pattern);
    
    if (pattern && pattern.apply) {
      pattern.apply(orchestration);
      this.metrics.patternsApplied++;
    }
  }
  
  validateOrchestration(orchestration) {
    // Check for circular dependencies
    if (this.hasCircularDependencies(orchestration)) {
      throw new Error('Circular dependencies detected in orchestration');
    }
    
    // Check depth limit
    if (this.calculateDepth(orchestration) > this.config.maxDepth) {
      throw new Error(`Orchestration depth exceeds limit: ${this.config.maxDepth}`);
    }
    
    // Check branch limit
    if (orchestration.branches.length > this.config.maxBranches) {
      throw new Error(`Branch count exceeds limit: ${this.config.maxBranches}`);
    }
    
    return true;
  }
  
  hasCircularDependencies(orchestration) {
    // Simple cycle detection
    const visited = new Set();
    const stack = new Set();
    
    const hasCycle = (nodeId) => {
      if (stack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      stack.add(nodeId);
      
      const connections = orchestration.connections.filter(c => c.from === nodeId);
      
      for (const conn of connections) {
        if (hasCycle(conn.to)) return true;
      }
      
      stack.delete(nodeId);
      return false;
    };
    
    for (const pipeline of orchestration.pipelines) {
      if (hasCycle(pipeline.id)) return true;
    }
    
    return false;
  }
  
  calculateDepth(orchestration, current = null, depth = 0) {
    if (depth > this.config.maxDepth) return depth;
    
    let maxDepth = depth;
    
    const nodes = current ? 
      orchestration.connections.filter(c => c.from === current).map(c => c.to) :
      orchestration.pipelines.filter(p => 
        !orchestration.connections.some(c => c.to === p.id)
      ).map(p => p.id);
    
    for (const node of nodes) {
      const nodeDepth = this.calculateDepth(orchestration, node, depth + 1);
      maxDepth = Math.max(maxDepth, nodeDepth);
    }
    
    return maxDepth;
  }
  
  groupByDependencies(pipelines, connections) {
    const groups = [];
    const completed = new Set();
    
    while (completed.size < pipelines.length) {
      const group = [];
      
      for (const pipeline of pipelines) {
        if (completed.has(pipeline.id)) continue;
        
        const deps = connections
          .filter(c => c.to === pipeline.id)
          .map(c => c.from);
        
        if (deps.every(d => completed.has(d))) {
          group.push(pipeline);
        }
      }
      
      if (group.length === 0) {
        // Add remaining pipelines (may have circular deps)
        for (const pipeline of pipelines) {
          if (!completed.has(pipeline.id)) {
            group.push(pipeline);
          }
        }
      }
      
      group.forEach(p => completed.add(p.id));
      groups.push(group);
    }
    
    return groups;
  }
  
  async evaluateConditionals(pipeline, state) {
    if (!pipeline.conditionals || pipeline.conditionals.length === 0) {
      return true;
    }
    
    for (const conditional of pipeline.conditionals) {
      const handler = this.conditionalHandlers.get(conditional.type);
      
      if (handler) {
        const result = await handler(conditional.condition, state);
        
        if (!result) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  async createCheckpoint(execution, index) {
    const checkpoint = {
      id: this.generateCheckpointId(),
      executionId: execution.id,
      index: index,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(execution.state))
    };
    
    this.checkpoints.set(checkpoint.id, checkpoint);
    
    execution.state.checkpoints.push(checkpoint.id);
    
    this.emit('checkpoint:created', checkpoint);
  }
  
  async resolveInputData(pipeline, state, dataFlow) {
    if (pipeline.inputMapping) {
      // Map from state context
      const mapped = {};
      
      for (const [key, path] of Object.entries(pipeline.inputMapping)) {
        mapped[key] = this.getValueByPath(state.dataContext, path);
      }
      
      return mapped;
    }
    
    if (dataFlow.strategy === 'pipeline') {
      // Use previous output as input
      const keys = Object.keys(state.dataContext);
      const lastKey = keys[keys.length - 1];
      return state.dataContext[lastKey] || state.dataContext.input;
    }
    
    return state.dataContext.input;
  }
  
  async executePipeline(pipeline, input, execution) {
    // Simulate pipeline execution
    logger.info(`🔧 Executing pipeline: ${pipeline.id || pipeline.name}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          pipelineId: pipeline.id,
          input: input,
          output: { processed: true, data: input },
          timestamp: Date.now()
        });
      }, Math.random() * 1000);
    });
  }
  
  async transformOutputData(result, pipeline, dataFlow) {
    let output = result.output || result;
    
    // Apply pipeline transformers
    if (pipeline.outputTransformers) {
      for (const transformer of pipeline.outputTransformers) {
        const handler = this.dataTransformers.get(transformer.type);
        
        if (handler) {
          output = await handler(output, transformer.config);
        }
      }
    }
    
    // Apply global transformers
    for (const transformer of dataFlow.transformers) {
      const handler = this.dataTransformers.get(transformer);
      
      if (handler) {
        output = await handler(output);
      }
    }
    
    return output;
  }
  
  async checkBranching(pipeline, output, orchestration) {
    if (!pipeline.branches) return null;
    
    for (const branch of pipeline.branches) {
      if (await this.evaluateExpression(branch.condition, { output })) {
        return orchestration.branches.find(b => b.id === branch.branchId);
      }
    }
    
    return null;
  }
  
  async checkLoopCondition(pipeline, state, orchestration) {
    if (!pipeline.loop) return false;
    
    const loop = orchestration.loops.find(l => l.id === pipeline.loop.loopId);
    
    if (!loop) return false;
    
    const handler = this.loopHandlers.get(loop.type);
    
    if (handler) {
      return await handler(loop, state);
    }
    
    return false;
  }
  
  async handlePipelineError(pipeline, error, execution) {
    const { orchestration } = execution;
    
    // Check for compensation
    if (orchestration.controlFlow.errorHandling === 'compensate') {
      await this.executeCompensation(pipeline, execution);
    }
    
    // Check for circuit breaker
    if (orchestration.controlFlow.errorHandling === 'circuit-breaker') {
      await this.handleCircuitBreaker(pipeline, error, execution);
    }
    
    // Store error
    execution.state.errors.push({
      pipeline: pipeline.id,
      error: error.message,
      timestamp: Date.now()
    });
  }
  
  async handleOrchestrationError(execution, error) {
    const { orchestration } = execution;
    
    // Check for rollback
    if (orchestration.controlFlow.errorHandling === 'rollback') {
      await this.rollbackToCheckpoint(execution);
    }
    
    this.emit('orchestration:error', { execution, error });
  }
  
  async executeCompensation(pipeline, execution) {
    const { orchestration } = execution;
    
    const compensation = orchestration.controlFlow.compensation.find(
      c => c.pipelineId === pipeline.id
    );
    
    if (compensation) {
      logger.info(`🔄 Executing compensation for pipeline: ${pipeline.id}`);
      
      await this.executePipeline(
        compensation.compensationPipeline,
        execution.state.dataContext,
        execution
      );
    }
  }
  
  async handleCircuitBreaker(pipeline, error, execution) {
    const breakerId = `${execution.orchestrationId}_${pipeline.id}`;
    
    let breaker = this.circuitBreakers.get(breakerId);
    
    if (!breaker) {
      breaker = {
        failures: 0,
        state: 'closed',
        lastFailure: null
      };
      
      this.circuitBreakers.set(breakerId, breaker);
    }
    
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    const config = execution.orchestration.config.circuitBreaker;
    
    if (breaker.failures >= config.threshold) {
      breaker.state = 'open';
      
      setTimeout(() => {
        breaker.state = 'half-open';
        breaker.failures = 0;
      }, config.timeout);
      
      throw new Error(`Circuit breaker open for pipeline: ${pipeline.id}`);
    }
  }
  
  async rollbackToCheckpoint(execution) {
    if (execution.state.checkpoints.length === 0) {
      return;
    }
    
    const checkpointId = execution.state.checkpoints[execution.state.checkpoints.length - 1];
    const checkpoint = this.checkpoints.get(checkpointId);
    
    if (checkpoint) {
      logger.info(`🔄 Rolling back to checkpoint: ${checkpointId}`);
      
      execution.state = checkpoint.state;
      
      this.rollbackPoints.set(execution.id, checkpoint);
    }
  }
  
  aggregateResults(results, dataFlow) {
    if (dataFlow.aggregators.length === 0) {
      return results;
    }
    
    let aggregated = results;
    
    for (const aggregatorName of dataFlow.aggregators) {
      const aggregator = this.dataAggregators.get(aggregatorName);
      
      if (aggregator) {
        aggregated = aggregator(aggregated);
      }
    }
    
    return aggregated;
  }
  
  async partitionData(data, strategy = 'hash') {
    const partitioner = this.partitionStrategies.get(strategy);
    
    if (!partitioner) {
      throw new Error(`Unknown partition strategy: ${strategy}`);
    }
    
    const nodeCount = this.distributedNodes.size || 1;
    
    return partitioner(data, nodeCount);
  }
  
  async assignToNodes(partitions, orchestration) {
    const nodes = Array.from(this.distributedNodes.values());
    const assignments = [];
    
    for (let i = 0; i < partitions.length; i++) {
      const node = nodes[i % nodes.length];
      const pipeline = orchestration.pipelines[i % orchestration.pipelines.length];
      
      assignments.push({
        node,
        partition: partitions[i],
        pipeline
      });
    }
    
    return assignments;
  }
  
  async executeOnNode(node, pipeline, data, execution) {
    // Simulate distributed execution
    logger.info(`🟢 Executing on node ${node.id}: ${pipeline.id}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          nodeId: node.id,
          pipelineId: pipeline.id,
          result: { processed: true, data }
        });
      }, Math.random() * 2000);
    });
  }
  
  async mergeDistributedResults(results, dataFlow) {
    const merged = {};
    
    // Group by node
    for (const { node, result } of results) {
      if (!merged[node]) {
        merged[node] = [];
      }
      
      merged[node].push(result);
    }
    
    // Apply mergers
    let finalResult = Object.values(merged);
    
    for (const mergerName of dataFlow.mergers) {
      const merger = this.dataMergers.get(mergerName);
      
      if (merger) {
        finalResult = merger(finalResult);
      }
    }
    
    return finalResult;
  }
  
  evaluateExpression(expression, context) {
    if (typeof expression === 'function') {
      return expression(context);
    }
    
    if (typeof expression === 'boolean') {
      return expression;
    }
    
    // Simple expression evaluation
    if (expression.field && expression.operator && expression.value !== undefined) {
      const fieldValue = this.getValueByPath(context, expression.field);
      
      switch (expression.operator) {
        case '==': return fieldValue == expression.value;
        case '!=': return fieldValue != expression.value;
        case '>': return fieldValue > expression.value;
        case '<': return fieldValue < expression.value;
        case '>=': return fieldValue >= expression.value;
        case '<=': return fieldValue <= expression.value;
        default: return false;
      }
    }
    
    return false;
  }
  
  getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return undefined;
      }
      
      current = current[part];
    }
    
    return current;
  }
  
  // Partitioning strategies
  hashPartition(data, partitions) {
    const result = Array(partitions).fill(null).map(() => []);
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const partition = index % partitions;
        result[partition].push(item);
      });
    }
    
    return result;
  }
  
  rangePartition(data, partitions) {
    const result = [];
    
    if (Array.isArray(data)) {
      const size = Math.ceil(data.length / partitions);
      
      for (let i = 0; i < partitions; i++) {
        result.push(data.slice(i * size, (i + 1) * size));
      }
    }
    
    return result;
  }
  
  roundRobinPartition(data, partitions) {
    return this.hashPartition(data, partitions);
  }
  
  assignWorkToNodes(work, nodes) {
    // Default work assignment
    const assignments = [];
    
    for (let i = 0; i < work.length; i++) {
      assignments.push({
        node: nodes[i % nodes.length],
        work: work[i]
      });
    }
    
    return assignments;
  }
  
  collectNodeResults(nodes) {
    // Default result collection
    return Promise.all(nodes.map(n => n.getResult()));
  }
  
  handleNodeFailure(node, error) {
    logger.error(`Node ${node.id} failed:`, error);
    
    // Default failure handling
    this.emit('node:failed', { node, error });
  }
  
  /**
   * Generate IDs
   */
  generateOrchestrationId() {
    return `orch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateCheckpointId() {
    return `chkpt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      patterns: this.patterns.size,
      workflows: this.workflows.size,
      activeStates: this.orchestrationState.size,
      checkpoints: this.checkpoints.size,
      circuitBreakers: this.circuitBreakers.size
    };
  }
}

module.exports = PipelineOrchestrator;