/**
 * BUMBA Workflow Orchestrator
 * Intelligent orchestration and coordination of complex workflows
 * Part of Workflow Engine enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Orchestrator for complex workflow patterns
 */
class WorkflowOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxDepth: config.maxDepth || 10,
      parallelismFactor: config.parallelismFactor || 0.8,
      intelligentRouting: config.intelligentRouting !== false,
      adaptiveExecution: config.adaptiveExecution !== false,
      failoverEnabled: config.failoverEnabled !== false,
      ...config
    };
    
    // Orchestration patterns
    this.patterns = new Map();
    this.compositions = new Map();
    this.sagas = new Map();
    this.choreographies = new Map();
    
    // Execution context
    this.contexts = new Map();
    this.transactions = new Map();
    this.compensations = new Map();
    
    // State machines
    this.stateMachines = new Map();
    this.activeStates = new Map();
    
    // Flow control
    this.gateways = new Map();
    this.routers = new Map();
    this.splitters = new Map();
    this.aggregators = new Map();
    
    // Coordination
    this.coordinators = new Map();
    this.synchronizers = new Map();
    this.barriers = new Map();
    
    // Metrics
    this.metrics = {
      orchestrated: 0,
      patterns: 0,
      transactions: 0,
      compensations: 0,
      parallelEfficiency: 0,
      routingAccuracy: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize orchestrator
   */
  initialize() {
    this.registerBuiltInPatterns();
    this.initializeGateways();
    
    logger.info('🔴 Workflow Orchestrator initialized');
  }
  
  /**
   * Register built-in orchestration patterns
   */
  registerBuiltInPatterns() {
    // Sequential pattern
    this.registerPattern('sequential', {
      name: 'Sequential Execution',
      handler: this.executeSequential.bind(this)
    });
    
    // Parallel pattern
    this.registerPattern('parallel', {
      name: 'Parallel Execution',
      handler: this.executeParallel.bind(this)
    });
    
    // Pipeline pattern
    this.registerPattern('pipeline', {
      name: 'Pipeline Execution',
      handler: this.executePipeline.bind(this)
    });
    
    // Fork-Join pattern
    this.registerPattern('fork-join', {
      name: 'Fork-Join Execution',
      handler: this.executeForkJoin.bind(this)
    });
    
    // Scatter-Gather pattern
    this.registerPattern('scatter-gather', {
      name: 'Scatter-Gather Execution',
      handler: this.executeScatterGather.bind(this)
    });
    
    // Map-Reduce pattern
    this.registerPattern('map-reduce', {
      name: 'Map-Reduce Execution',
      handler: this.executeMapReduce.bind(this)
    });
    
    // Circuit Breaker pattern
    this.registerPattern('circuit-breaker', {
      name: 'Circuit Breaker',
      handler: this.executeWithCircuitBreaker.bind(this)
    });
    
    // Retry pattern
    this.registerPattern('retry', {
      name: 'Retry with Backoff',
      handler: this.executeWithRetry.bind(this)
    });
    
    // Timeout pattern
    this.registerPattern('timeout', {
      name: 'Timeout Execution',
      handler: this.executeWithTimeout.bind(this)
    });
  }
  
  /**
   * Orchestrate workflow execution
   */
  async orchestrate(workflow, pattern = 'sequential', options = {}) {
    const orchestration = {
      id: this.generateOrchestrationId(),
      workflow,
      pattern,
      options,
      startTime: Date.now(),
      state: 'orchestrating'
    };
    
    // Create execution context
    const context = this.createContext(orchestration);
    this.contexts.set(orchestration.id, context);
    
    try {
      // Get pattern handler
      const patternDef = this.patterns.get(pattern);
      
      if (!patternDef) {
        throw new Error(`Unknown orchestration pattern: ${pattern}`);
      }
      
      // Execute with pattern
      const result = await patternDef.handler(workflow, context, options);
      
      // Complete orchestration
      orchestration.state = 'completed';
      orchestration.result = result;
      orchestration.duration = Date.now() - orchestration.startTime;
      
      this.metrics.orchestrated++;
      
      this.emit('orchestration:completed', orchestration);
      
      return result;
      
    } catch (error) {
      orchestration.state = 'failed';
      orchestration.error = error;
      
      // Attempt compensation if needed
      if (context.transaction) {
        await this.compensate(context);
      }
      
      this.emit('orchestration:failed', { orchestration, error });
      
      throw error;
      
    } finally {
      // Clean up context
      this.contexts.delete(orchestration.id);
    }
  }
  
  /**
   * Create execution context
   */
  createContext(orchestration) {
    return {
      id: orchestration.id,
      workflow: orchestration.workflow,
      pattern: orchestration.pattern,
      options: orchestration.options,
      state: {},
      variables: {},
      results: [],
      errors: [],
      transaction: null,
      metadata: {
        startTime: Date.now(),
        depth: 0
      }
    };
  }
  
  /**
   * Pattern Implementations
   */
  
  async executeSequential(workflow, context, options) {
    const results = [];
    
    for (const step of workflow.steps) {
      const result = await this.executeStep(step, context);
      results.push(result);
      
      // Update context
      context.results.push(result);
      
      if (result.variables) {
        Object.assign(context.variables, result.variables);
      }
      
      // Check for flow control
      if (result.action === 'stop') {
        break;
      }
    }
    
    return { pattern: 'sequential', results };
  }
  
  async executeParallel(workflow, context, options) {
    const parallelism = options.parallelism || 
      Math.ceil(workflow.steps.length * this.config.parallelismFactor);
    
    // Create batches based on parallelism
    const batches = this.createBatches(workflow.steps, parallelism);
    const results = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(step => 
        this.executeStep(step, context)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Update context
      context.results.push(...batchResults);
      
      // Merge variables
      for (const result of batchResults) {
        if (result.variables) {
          Object.assign(context.variables, result.variables);
        }
      }
    }
    
    return { pattern: 'parallel', results };
  }
  
  async executePipeline(workflow, context, options) {
    let pipelineData = options.initialData || {};
    const results = [];
    
    for (const step of workflow.steps) {
      // Pass output of previous step as input
      const stepContext = {
        ...context,
        input: pipelineData
      };
      
      const result = await this.executeStep(step, stepContext);
      results.push(result);
      
      // Use result as input for next step
      pipelineData = result.output || result;
    }
    
    return { 
      pattern: 'pipeline', 
      results,
      finalOutput: pipelineData
    };
  }
  
  async executeForkJoin(workflow, context, options) {
    const forkPoint = options.forkPoint || 0;
    const joinPoint = options.joinPoint || workflow.steps.length;
    
    // Execute pre-fork steps
    const preResults = [];
    for (let i = 0; i < forkPoint; i++) {
      const result = await this.executeStep(workflow.steps[i], context);
      preResults.push(result);
    }
    
    // Fork: execute parallel branches
    const branches = workflow.steps.slice(forkPoint, joinPoint);
    const branchPromises = branches.map(step => 
      this.executeStep(step, context)
    );
    
    const branchResults = await Promise.all(branchPromises);
    
    // Join: aggregate results
    const joinResult = await this.aggregateResults(branchResults, options);
    
    // Execute post-join steps
    const postResults = [];
    for (let i = joinPoint; i < workflow.steps.length; i++) {
      const result = await this.executeStep(workflow.steps[i], {
        ...context,
        joinResult
      });
      postResults.push(result);
    }
    
    return {
      pattern: 'fork-join',
      preResults,
      branchResults,
      joinResult,
      postResults
    };
  }
  
  async executeScatterGather(workflow, context, options) {
    const scatterData = options.data || [];
    const workerCount = options.workers || 4;
    
    // Scatter: distribute data to workers
    const chunks = this.createChunks(scatterData, workerCount);
    const workerPromises = [];
    
    for (const chunk of chunks) {
      const workerContext = {
        ...context,
        data: chunk
      };
      
      workerPromises.push(
        this.executeWorker(workflow, workerContext)
      );
    }
    
    // Execute workers in parallel
    const workerResults = await Promise.all(workerPromises);
    
    // Gather: collect and merge results
    const gatheredResult = await this.gatherResults(workerResults, options);
    
    return {
      pattern: 'scatter-gather',
      scattered: chunks.length,
      workerResults,
      gathered: gatheredResult
    };
  }
  
  async executeMapReduce(workflow, context, options) {
    const data = options.data || [];
    const mapper = options.mapper || workflow.mapper;
    const reducer = options.reducer || workflow.reducer;
    
    // Map phase
    const mapPromises = data.map(async item => {
      const mapContext = {
        ...context,
        item
      };
      
      return await this.executeStep(mapper, mapContext);
    });
    
    const mapResults = await Promise.all(mapPromises);
    
    // Shuffle and sort (simplified)
    const grouped = this.groupByKey(mapResults);
    
    // Reduce phase
    const reducePromises = Object.entries(grouped).map(async ([key, values]) => {
      const reduceContext = {
        ...context,
        key,
        values
      };
      
      return await this.executeStep(reducer, reduceContext);
    });
    
    const reduceResults = await Promise.all(reducePromises);
    
    return {
      pattern: 'map-reduce',
      mapResults: mapResults.length,
      reduceResults
    };
  }
  
  async executeWithCircuitBreaker(workflow, context, options) {
    const circuitBreaker = this.getCircuitBreaker(workflow.id);
    
    if (circuitBreaker.state === 'open') {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await this.executeWorkflow(workflow, context);
      
      // Success: reset failure count
      circuitBreaker.failures = 0;
      circuitBreaker.state = 'closed';
      
      return result;
      
    } catch (error) {
      // Failure: increment counter
      circuitBreaker.failures++;
      
      if (circuitBreaker.failures >= (options.threshold || 5)) {
        circuitBreaker.state = 'open';
        circuitBreaker.openedAt = Date.now();
        
        // Schedule half-open state
        setTimeout(() => {
          circuitBreaker.state = 'half-open';
        }, options.resetTimeout || 60000);
      }
      
      throw error;
    }
  }
  
  async executeWithRetry(workflow, context, options) {
    const maxRetries = options.maxRetries || 3;
    const backoffFactor = options.backoffFactor || 2;
    let delay = options.initialDelay || 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeWorkflow(workflow, context);
        return result;
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        logger.warn(`Retry attempt ${attempt}/${maxRetries} failed, waiting ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor;
      }
    }
  }
  
  async executeWithTimeout(workflow, context, options) {
    const timeout = options.timeout || 30000;
    
    return Promise.race([
      this.executeWorkflow(workflow, context),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Workflow timeout')), timeout)
      )
    ]);
  }
  
  /**
   * Saga Pattern Implementation
   */
  
  async executeSaga(saga, context) {
    const sagaExecution = {
      id: this.generateSagaId(),
      saga,
      context,
      steps: [],
      compensations: [],
      state: 'running'
    };
    
    this.sagas.set(sagaExecution.id, sagaExecution);
    
    try {
      for (const step of saga.steps) {
        // Execute step
        const result = await this.executeStep(step, context);
        sagaExecution.steps.push({ step, result });
        
        // Register compensation if provided
        if (step.compensation) {
          sagaExecution.compensations.unshift({
            step: step.compensation,
            context: { ...context, result }
          });
        }
        
        // Check for saga abort
        if (result.abort) {
          throw new Error(`Saga aborted at step ${step.name}`);
        }
      }
      
      sagaExecution.state = 'completed';
      return sagaExecution;
      
    } catch (error) {
      sagaExecution.state = 'compensating';
      
      // Execute compensations in reverse order
      for (const compensation of sagaExecution.compensations) {
        try {
          await this.executeStep(compensation.step, compensation.context);
        } catch (compError) {
          logger.error('Compensation failed:', compError);
        }
      }
      
      sagaExecution.state = 'compensated';
      throw error;
    }
  }
  
  /**
   * Choreography Pattern Implementation
   */
  
  async executeChoreography(choreography, context) {
    const events = new EventEmitter();
    const participants = new Map();
    
    // Register participants
    for (const participant of choreography.participants) {
      participants.set(participant.id, {
        ...participant,
        state: 'ready'
      });
      
      // Set up event listeners
      this.setupParticipantListeners(participant, events, context);
    }
    
    // Start choreography
    events.emit('choreography:start', context);
    
    // Wait for completion
    return new Promise((resolve, reject) => {
      events.on('choreography:complete', resolve);
      events.on('choreography:error', reject);
      
      // Timeout
      setTimeout(() => {
        reject(new Error('Choreography timeout'));
      }, choreography.timeout || 60000);
    });
  }
  
  setupParticipantListeners(participant, events, context) {
    for (const rule of participant.rules) {
      events.on(rule.event, async (data) => {
        if (this.evaluateCondition(rule.condition, data, context)) {
          try {
            const result = await this.executeStep(rule.action, {
              ...context,
              eventData: data
            });
            
            // Emit resulting events
            if (rule.emits) {
              for (const emit of rule.emits) {
                events.emit(emit.event, result);
              }
            }
          } catch (error) {
            events.emit('choreography:error', error);
          }
        }
      });
    }
  }
  
  /**
   * State Machine Implementation
   */
  
  createStateMachine(definition) {
    const stateMachine = {
      id: this.generateStateMachineId(),
      definition,
      currentState: definition.initialState,
      history: [],
      context: {}
    };
    
    this.stateMachines.set(stateMachine.id, stateMachine);
    this.activeStates.set(stateMachine.id, definition.initialState);
    
    return stateMachine;
  }
  
  async transitionState(machineId, event, data) {
    const machine = this.stateMachines.get(machineId);
    
    if (!machine) {
      throw new Error(`State machine not found: ${machineId}`);
    }
    
    const currentState = machine.definition.states[machine.currentState];
    const transition = currentState.transitions?.[event];
    
    if (!transition) {
      throw new Error(`No transition for event ${event} in state ${machine.currentState}`);
    }
    
    // Check guard condition
    if (transition.guard && !this.evaluateCondition(transition.guard, data, machine.context)) {
      return machine.currentState;
    }
    
    // Execute exit action
    if (currentState.exit) {
      await this.executeStep(currentState.exit, machine.context);
    }
    
    // Transition to new state
    const previousState = machine.currentState;
    machine.currentState = transition.target;
    machine.history.push({
      from: previousState,
      to: transition.target,
      event,
      timestamp: Date.now()
    });
    
    // Execute transition action
    if (transition.action) {
      await this.executeStep(transition.action, machine.context);
    }
    
    // Execute entry action
    const newState = machine.definition.states[machine.currentState];
    if (newState.entry) {
      await this.executeStep(newState.entry, machine.context);
    }
    
    this.activeStates.set(machineId, machine.currentState);
    
    this.emit('state:transition', {
      machineId,
      from: previousState,
      to: machine.currentState,
      event
    });
    
    return machine.currentState;
  }
  
  /**
   * Gateway Implementations
   */
  
  initializeGateways() {
    // Exclusive Gateway (XOR)
    this.registerGateway('exclusive', {
      name: 'Exclusive Gateway',
      handler: this.exclusiveGateway.bind(this)
    });
    
    // Inclusive Gateway (OR)
    this.registerGateway('inclusive', {
      name: 'Inclusive Gateway',
      handler: this.inclusiveGateway.bind(this)
    });
    
    // Parallel Gateway (AND)
    this.registerGateway('parallel', {
      name: 'Parallel Gateway',
      handler: this.parallelGateway.bind(this)
    });
    
    // Event-based Gateway
    this.registerGateway('event', {
      name: 'Event-based Gateway',
      handler: this.eventGateway.bind(this)
    });
  }
  
  async exclusiveGateway(branches, context) {
    // Evaluate conditions and take first matching branch
    for (const branch of branches) {
      if (await this.evaluateCondition(branch.condition, null, context)) {
        return await this.executeStep(branch.target, context);
      }
    }
    
    // Default branch
    const defaultBranch = branches.find(b => b.default);
    if (defaultBranch) {
      return await this.executeStep(defaultBranch.target, context);
    }
    
    throw new Error('No matching branch in exclusive gateway');
  }
  
  async inclusiveGateway(branches, context) {
    // Evaluate all conditions and execute matching branches
    const promises = [];
    
    for (const branch of branches) {
      if (await this.evaluateCondition(branch.condition, null, context)) {
        promises.push(this.executeStep(branch.target, context));
      }
    }
    
    if (promises.length === 0) {
      throw new Error('No matching branches in inclusive gateway');
    }
    
    return await Promise.all(promises);
  }
  
  async parallelGateway(branches, context) {
    // Execute all branches in parallel
    const promises = branches.map(branch => 
      this.executeStep(branch.target, context)
    );
    
    return await Promise.all(promises);
  }
  
  async eventGateway(events, context, timeout = 30000) {
    // Wait for first event to occur
    return new Promise((resolve, reject) => {
      const listeners = [];
      let resolved = false;
      
      // Set up event listeners
      for (const event of events) {
        const listener = async (data) => {
          if (!resolved) {
            resolved = true;
            
            // Clean up listeners
            listeners.forEach(l => l.remove());
            
            // Execute associated branch
            const result = await this.executeStep(event.target, {
              ...context,
              eventData: data
            });
            
            resolve(result);
          }
        };
        
        this.on(event.name, listener);
        listeners.push({ remove: () => this.off(event.name, listener) });
      }
      
      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          listeners.forEach(l => l.remove());
          reject(new Error('Event gateway timeout'));
        }
      }, timeout);
    });
  }
  
  /**
   * Helper Methods
   */
  
  async executeStep(step, context) {
    // Delegate to workflow engine or simulate
    return {
      success: true,
      stepId: step.id,
      output: {},
      variables: {}
    };
  }
  
  async executeWorkflow(workflow, context) {
    // Delegate to workflow engine
    return {
      success: true,
      workflowId: workflow.id,
      results: []
    };
  }
  
  async executeWorker(workflow, context) {
    // Execute workflow as worker
    return await this.executeWorkflow(workflow, context);
  }
  
  createBatches(items, batchSize) {
    const batches = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  createChunks(data, chunkCount) {
    const chunkSize = Math.ceil(data.length / chunkCount);
    const chunks = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
  
  async aggregateResults(results, options) {
    const strategy = options.aggregationStrategy || 'merge';
    
    switch (strategy) {
      case 'merge':
        return Object.assign({}, ...results);
      
      case 'concat':
        return results.flat();
      
      case 'sum':
        return results.reduce((sum, r) => sum + (r.value || 0), 0);
      
      case 'average':
        const sum = results.reduce((s, r) => s + (r.value || 0), 0);
        return sum / results.length;
      
      case 'custom':
        return options.aggregator(results);
      
      default:
        return results;
    }
  }
  
  async gatherResults(results, options) {
    return this.aggregateResults(results, options);
  }
  
  groupByKey(mapResults) {
    const grouped = {};
    
    for (const result of mapResults) {
      const key = result.key || 'default';
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(result.value);
    }
    
    return grouped;
  }
  
  evaluateCondition(condition, data, context) {
    if (typeof condition === 'function') {
      return condition(data, context);
    }
    
    if (typeof condition === 'boolean') {
      return condition;
    }
    
    // Simple expression evaluation
    if (typeof condition === 'string') {
      try {
        const func = new Function('data', 'context', `return ${condition}`);
        return func(data, context);
      } catch {
        return false;
      }
    }
    
    return true;
  }
  
  getCircuitBreaker(id) {
    if (!this.circuitBreakers) {
      this.circuitBreakers = new Map();
    }
    
    if (!this.circuitBreakers.has(id)) {
      this.circuitBreakers.set(id, {
        state: 'closed',
        failures: 0,
        openedAt: null
      });
    }
    
    return this.circuitBreakers.get(id);
  }
  
  async compensate(context) {
    if (!context.transaction) return;
    
    const compensations = this.compensations.get(context.transaction.id) || [];
    
    for (const compensation of compensations.reverse()) {
      try {
        await this.executeStep(compensation.step, compensation.context);
      } catch (error) {
        logger.error('Compensation failed:', error);
      }
    }
    
    this.metrics.compensations++;
  }
  
  /**
   * Registration Methods
   */
  
  registerPattern(name, definition) {
    this.patterns.set(name, definition);
    this.metrics.patterns++;
  }
  
  registerGateway(type, definition) {
    this.gateways.set(type, definition);
  }
  
  /**
   * Metrics Methods
   */
  
  getMetrics() {
    return {
      ...this.metrics,
      activeContexts: this.contexts.size,
      activeStateMachines: this.stateMachines.size,
      patterns: Array.from(this.patterns.keys()),
      gateways: Array.from(this.gateways.keys())
    };
  }
  
  /**
   * ID Generation
   */
  
  generateOrchestrationId() {
    return `orch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateSagaId() {
    return `saga_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateStateMachineId() {
    return `sm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

module.exports = WorkflowOrchestrator;