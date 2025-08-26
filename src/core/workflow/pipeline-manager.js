/**
 * BUMBA Pipeline Manager - Enhanced to 90% operational
 * Advanced pipeline orchestration for complex data processing workflows
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { WorkflowEngine, getInstance: getWorkflowEngine } = require('./workflow-engine');
const PipelineScheduler = require('./pipeline-scheduler');
const PipelineOrchestrator = require('./pipeline-orchestrator');
const PipelineOptimizer = require('./pipeline-optimizer');
const PipelineAnalytics = require('./pipeline-analytics');

class PipelineManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxConcurrentPipelines: config.maxConcurrentPipelines || 5,
      defaultTimeout: config.defaultTimeout || 600000, // 10 minutes
      bufferSize: config.bufferSize || 1000,
      retryAttempts: config.retryAttempts || 3,
      enableStreaming: config.enableStreaming !== false,
      enableCaching: config.enableCaching !== false,
      
      // Enhanced features
      enhancedMode: config.enhancedMode !== false,
      schedulingEnabled: config.schedulingEnabled !== false,
      orchestrationEnabled: config.orchestrationEnabled !== false,
      optimizationEnabled: config.optimizationEnabled !== false,
      analyticsEnabled: config.analyticsEnabled !== false,
      
      ...config
    };
    
    // Pipeline storage
    this.pipelines = new Map();
    this.activePipelines = new Map();
    this.pipelineTemplates = new Map();
    
    // Stage definitions
    this.stageDefinitions = new Map();
    this.transformers = new Map();
    this.validators = new Map();
    this.aggregators = new Map();
    
    // Data flow management
    this.dataStreams = new Map();
    this.buffers = new Map();
    this.cache = new Map();
    
    // Metrics
    this.metrics = {
      pipelinesCreated: 0,
      pipelinesExecuted: 0,
      pipelinesCompleted: 0,
      pipelinesFailed: 0,
      dataProcessed: 0,
      averageThroughput: 0,
      stagesExecuted: 0,
      transformsApplied: 0
    };
    
    // Workflow engine integration
    this.workflowEngine = null;
    
    // Initialize enhancement components if enabled
    if (this.config.enhancedMode) {
      this.initializeEnhancements();
    }
    
    this.initialize();
  }
  
  /**
   * Initialize enhancement components
   */
  initializeEnhancements() {
    // Initialize scheduler
    if (this.config.schedulingEnabled) {
      this.scheduler = new PipelineScheduler({
        maxConcurrentPipelines: this.config.maxConcurrentPipelines,
        schedulingInterval: this.config.schedulingInterval,
        resourceAware: this.config.resourceAware,
        timeSlicing: this.config.timeSlicing
      });
      
      this.setupSchedulerIntegration();
      logger.info('📅 Pipeline Scheduler enabled');
    }
    
    // Initialize orchestrator
    if (this.config.orchestrationEnabled) {
      this.orchestrator = new PipelineOrchestrator({
        maxDepth: this.config.maxDepth,
        enableConditional: this.config.enableConditional,
        enableLoops: this.config.enableLoops,
        enableParallel: this.config.enableParallel,
        enableDistributed: this.config.enableDistributed
      });
      
      this.setupOrchestratorIntegration();
      logger.info('🔴 Pipeline Orchestrator enabled');
    }
    
    // Initialize optimizer
    if (this.config.optimizationEnabled) {
      this.optimizer = new PipelineOptimizer({
        optimizationInterval: this.config.optimizationInterval,
        cacheEnabled: this.config.enableCaching,
        compressionEnabled: this.config.compressionEnabled,
        parallelizationEnabled: this.config.parallelizationEnabled,
        adaptiveOptimization: this.config.adaptiveOptimization
      });
      
      this.setupOptimizerIntegration();
      logger.info('🟢 Pipeline Optimizer enabled');
    }
    
    // Initialize analytics
    if (this.config.analyticsEnabled) {
      this.analytics = new PipelineAnalytics({
        trackingInterval: this.config.trackingInterval,
        alertingEnabled: this.config.alertingEnabled,
        predictiveAnalytics: this.config.predictiveAnalytics,
        realtimeMonitoring: this.config.realtimeMonitoring
      });
      
      this.setupAnalyticsIntegration();
      logger.info('📊 Pipeline Analytics enabled');
    }
  }
  
  /**
   * Setup scheduler integration
   */
  setupSchedulerIntegration() {
    this.scheduler.on('pipeline:completed', (scheduled) => {
      this.emit('scheduled:completed', scheduled);
      if (this.analytics) {
        this.analytics.trackPipelineExecution(scheduled);
      }
    });
    
    this.scheduler.on('pipeline:failed', ({ scheduled, error }) => {
      this.emit('scheduled:failed', { scheduled, error });
      if (this.analytics) {
        this.analytics.trackPipelineExecution({
          ...scheduled,
          state: { status: 'failed', errors: [error] }
        });
      }
    });
  }
  
  /**
   * Setup orchestrator integration
   */
  setupOrchestratorIntegration() {
    this.orchestrator.on('orchestration:completed', ({ execution, result }) => {
      this.emit('orchestration:completed', { execution, result });
    });
    
    this.orchestrator.on('orchestration:failed', ({ execution, error }) => {
      this.emit('orchestration:failed', { execution, error });
    });
  }
  
  /**
   * Setup optimizer integration
   */
  setupOptimizerIntegration() {
    this.optimizer.on('optimization:completed', (optimization) => {
      this.emit('optimization:completed', optimization);
      
      // Apply optimizations to pipeline
      const pipeline = this.pipelines.get(optimization.pipelineId);
      if (pipeline && optimization.optimizations) {
        for (const opt of optimization.optimizations) {
          if (opt.applied) {
            this.applyOptimizationToPipeline(pipeline, opt);
          }
        }
      }
    });
  }
  
  /**
   * Setup analytics integration
   */
  setupAnalyticsIntegration() {
    this.analytics.on('alert:created', (alert) => {
      this.emit('analytics:alert', alert);
    });
    
    this.analytics.on('anomaly:detected', (anomaly) => {
      this.emit('analytics:anomaly', anomaly);
    });
    
    this.analytics.on('report:generated', (report) => {
      this.emit('analytics:report', report);
    });
  }
  
  /**
   * Apply optimization to pipeline
   */
  applyOptimizationToPipeline(pipeline, optimization) {
    switch (optimization.type) {
      case 'caching':
        pipeline.config.enableCaching = true;
        break;
      case 'compression':
        pipeline.config.compressionEnabled = true;
        break;
      case 'parallelization':
        pipeline.config.parallel = true;
        break;
      case 'batching':
        pipeline.config.batching = true;
        break;
    }
  }
  
  /**
   * Initialize pipeline manager
   */
  async initialize() {
    try {
      // Get workflow engine instance
      this.workflowEngine = getWorkflowEngine();
      
      // Register default stages
      this.registerDefaultStages();
      
      // Register default transformers
      this.registerDefaultTransformers();
      
      // Register default validators
      this.registerDefaultValidators();
      
      // Load pipeline templates
      await this.loadPipelineTemplates();
      
      logger.info('🔧 Pipeline Manager initialized');
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Pipeline Manager:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Create a new pipeline
   */
  async createPipeline(definition) {
    try {
      const pipeline = {
        id: definition.id || this.generatePipelineId(),
        name: definition.name || 'Unnamed Pipeline',
        description: definition.description,
        version: definition.version || '1.0.0',
        
        // Pipeline structure
        stages: this.validateStages(definition.stages || []),
        connections: definition.connections || [],
        
        // Data configuration
        inputSchema: definition.inputSchema,
        outputSchema: definition.outputSchema,
        
        // Processing configuration
        config: {
          streaming: definition.streaming || false,
          parallel: definition.parallel || false,
          bufferSize: definition.bufferSize || this.config.bufferSize,
          timeout: definition.timeout || this.config.defaultTimeout,
          retries: definition.retries || this.config.retryAttempts,
          errorHandling: definition.errorHandling || 'stop',
          ...definition.config
        },
        
        // State
        state: {
          status: 'created',
          currentStage: null,
          completedStages: [],
          dataFlow: {},
          errors: [],
          metrics: {
            itemsProcessed: 0,
            startTime: null,
            endTime: null,
            throughput: 0
          }
        },
        
        // Metadata
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          author: definition.author || 'system',
          tags: definition.tags || []
        }
      };
      
      // Validate pipeline
      this.validatePipeline(pipeline);
      
      // Store pipeline
      this.pipelines.set(pipeline.id, pipeline);
      
      // Create workflow if needed
      if (definition.createWorkflow) {
        await this.createPipelineWorkflow(pipeline);
      }
      
      this.metrics.pipelinesCreated++;
      
      this.emit('pipeline:created', pipeline);
      logger.info(`🔧 Created pipeline: ${pipeline.name}`);
      
      return pipeline;
      
    } catch (error) {
      logger.error('Failed to create pipeline:', error);
      throw error;
    }
  }
  
  /**
   * Execute a pipeline
   */
  async executePipeline(pipelineId, input, options = {}) {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      
      if (!pipeline) {
        throw new Error(`Pipeline not found: ${pipelineId}`);
      }
      
      // Check concurrent limit
      if (this.activePipelines.size >= this.config.maxConcurrentPipelines) {
        throw new Error('Maximum concurrent pipelines reached');
      }
      
      // Create execution context
      const execution = {
        id: this.generateExecutionId(),
        pipelineId,
        pipeline: { ...pipeline },
        input,
        options,
        startTime: Date.now(),
        state: {
          status: 'running',
          currentStage: 0,
          completedStages: [],
          dataFlow: { input },
          results: {},
          errors: []
        }
      };
      
      // Store active execution
      this.activePipelines.set(execution.id, execution);
      
      // Execute pipeline
      const result = await this.runPipeline(execution);
      
      // Complete execution
      this.completePipelineExecution(execution, result);
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to execute pipeline ${pipelineId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run pipeline execution
   */
  async runPipeline(execution) {
    const { pipeline, state } = execution;
    
    try {
      this.emit('pipeline:started', execution);
      
      // Setup data stream if streaming enabled
      if (pipeline.config.streaming) {
        await this.setupDataStream(execution);
      }
      
      // Execute stages
      if (pipeline.config.parallel) {
        await this.executeParallelStages(execution);
      } else {
        await this.executeSequentialStages(execution);
      }
      
      // Validate output
      if (pipeline.outputSchema) {
        this.validateOutput(state.dataFlow.output, pipeline.outputSchema);
      }
      
      state.status = 'completed';
      
      return {
        success: true,
        pipelineId: pipeline.id,
        executionId: execution.id,
        output: state.dataFlow.output,
        metrics: this.calculateMetrics(execution),
        duration: Date.now() - execution.startTime
      };
      
    } catch (error) {
      state.status = 'failed';
      state.errors.push({
        stage: state.currentStage,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
  
  /**
   * Execute stages sequentially
   */
  async executeSequentialStages(execution) {
    const { pipeline, state } = execution;
    let data = state.dataFlow.input;
    
    for (let i = 0; i < pipeline.stages.length; i++) {
      const stage = pipeline.stages[i];
      state.currentStage = i;
      
      try {
        // Execute stage
        data = await this.executeStage(stage, data, execution);
        
        // Store intermediate result
        state.dataFlow[stage.id || stage.name] = data;
        state.completedStages.push(stage.id || stage.name);
        
        // Check for early termination
        if (this.shouldTerminate(data, stage)) {
          break;
        }
        
      } catch (error) {
        await this.handleStageError(stage, error, execution);
        
        if (pipeline.config.errorHandling === 'stop') {
          throw error;
        }
      }
    }
    
    state.dataFlow.output = data;
  }
  
  /**
   * Execute stages in parallel
   */
  async executeParallelStages(execution) {
    const { pipeline, state } = execution;
    
    // Group stages by dependencies
    const stageGroups = this.groupStagesByDependencies(pipeline.stages, pipeline.connections);
    
    let data = state.dataFlow.input;
    
    for (const group of stageGroups) {
      const promises = group.map(async (stage) => {
        try {
          const stageInput = this.resolveStageInput(stage, state.dataFlow, pipeline.connections);
          const result = await this.executeStage(stage, stageInput, execution);
          
          // Store result
          state.dataFlow[stage.id || stage.name] = result;
          state.completedStages.push(stage.id || stage.name);
          
          return result;
          
        } catch (error) {
          await this.handleStageError(stage, error, execution);
          
          if (pipeline.config.errorHandling === 'stop') {
            throw error;
          }
          
          return null;
        }
      });
      
      // Wait for group to complete
      const results = await Promise.all(promises);
      
      // Merge results for next group
      data = this.mergeResults(results, pipeline.config.mergeStrategy);
    }
    
    state.dataFlow.output = data;
  }
  
  /**
   * Execute a single stage
   */
  async executeStage(stage, input, execution) {
    const startTime = Date.now();
    
    try {
      this.emit('stage:started', { stage, execution });
      
      // Get stage definition
      const definition = this.stageDefinitions.get(stage.type);
      
      if (!definition) {
        throw new Error(`Unknown stage type: ${stage.type}`);
      }
      
      // Apply pre-processing
      if (stage.preProcess) {
        input = await this.applyTransform(input, stage.preProcess);
      }
      
      // Execute stage handler
      let result = await definition.handler(input, stage, execution);
      
      // Apply transformations
      if (stage.transform) {
        result = await this.applyTransform(result, stage.transform);
      }
      
      // Apply validation
      if (stage.validate) {
        await this.validateData(result, stage.validate);
      }
      
      // Apply post-processing
      if (stage.postProcess) {
        result = await this.applyTransform(result, stage.postProcess);
      }
      
      this.metrics.stagesExecuted++;
      
      this.emit('stage:completed', {
        stage,
        execution,
        result,
        duration: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      this.emit('stage:failed', {
        stage,
        execution,
        error,
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  /**
   * Register default stage types
   */
  registerDefaultStages() {
    // Transform stage
    this.registerStage('transform', {
      name: 'Transform',
      description: 'Transform data',
      handler: async (input, stage) => {
        const transformer = this.transformers.get(stage.transformer);
        
        if (transformer) {
          return await transformer(input);
        }
        
        // Default passthrough if no transformer
        return input;
      }
    });
    
    // Filter stage
    this.registerStage('filter', {
      name: 'Filter',
      description: 'Filter data',
      handler: async (input, stage) => {
        if (Array.isArray(input)) {
          return input.filter(item => this.evaluateCondition(item, stage.condition));
        }
        
        return this.evaluateCondition(input, stage.condition) ? input : null;
      }
    });
    
    // Map stage
    this.registerStage('map', {
      name: 'Map',
      description: 'Map over data',
      handler: async (input, stage) => {
        if (!Array.isArray(input)) {
          input = [input];
        }
        
        const mapper = this.createMapper(stage.mapSpec);
        return await Promise.all(input.map(mapper));
      }
    });
    
    // Reduce stage
    this.registerStage('reduce', {
      name: 'Reduce',
      description: 'Reduce data',
      handler: async (input, stage) => {
        if (!Array.isArray(input)) {
          return input;
        }
        
        const reducer = this.createReducer(stage.reduceSpec);
        return input.reduce(reducer, stage.initialValue);
      }
    });
    
    // Aggregate stage
    this.registerStage('aggregate', {
      name: 'Aggregate',
      description: 'Aggregate data',
      handler: async (input, stage) => {
        const aggregator = this.aggregators.get(stage.aggregator) ||
                          this.createAggregator(stage.aggregateSpec);
        
        return await aggregator(input);
      }
    });
    
    // Branch stage
    this.registerStage('branch', {
      name: 'Branch',
      description: 'Conditional branching',
      handler: async (input, stage) => {
        for (const branch of stage.branches) {
          if (this.evaluateCondition(input, branch.condition)) {
            return await this.executeBranch(branch, input);
          }
        }
        
        if (stage.default) {
          return await this.executeBranch(stage.default, input);
        }
        
        return input;
      }
    });
    
    // Parallel stage
    this.registerStage('parallel', {
      name: 'Parallel',
      description: 'Execute in parallel',
      handler: async (input, stage) => {
        const tasks = stage.tasks.map(task => 
          this.executeStage(task, input, { pipeline: stage.pipeline })
        );
        
        const results = await Promise.all(tasks);
        
        return this.mergeResults(results, stage.mergeStrategy);
      }
    });
    
    // Batch stage
    this.registerStage('batch', {
      name: 'Batch',
      description: 'Batch processing',
      handler: async (input, stage) => {
        if (!Array.isArray(input)) {
          input = [input];
        }
        
        const batchSize = stage.batchSize || 10;
        const batches = [];
        
        for (let i = 0; i < input.length; i += batchSize) {
          batches.push(input.slice(i, i + batchSize));
        }
        
        const results = [];
        for (const batch of batches) {
          const batchResult = await this.processBatch(batch, stage);
          results.push(...batchResult);
        }
        
        return results;
      }
    });
    
    // Cache stage
    this.registerStage('cache', {
      name: 'Cache',
      description: 'Cache results',
      handler: async (input, stage) => {
        const cacheKey = this.generateCacheKey(stage.key, input);
        
        // Check cache
        if (this.cache.has(cacheKey) && !stage.refresh) {
          return this.cache.get(cacheKey);
        }
        
        // Process and cache
        const result = stage.process ? 
          await this.executeStage(stage.process, input) : 
          input;
        
        this.cache.set(cacheKey, result);
        
        if (stage.ttl) {
          setTimeout(() => this.cache.delete(cacheKey), stage.ttl);
        }
        
        return result;
      }
    });
    
    // Specialist stage
    this.registerStage('specialist', {
      name: 'Specialist',
      description: 'Process with specialist',
      handler: async (input, stage) => {
        // Integrate with workflow engine
        const workflow = await this.workflowEngine.createWorkflow({
          name: `Pipeline Stage: ${stage.name}`,
          steps: [{
            type: 'task',
            specialist: stage.specialist,
            task: {
              type: stage.taskType || 'process',
              data: input,
              config: stage.config
            }
          }]
        });
        
        const result = await this.workflowEngine.executeWorkflow(workflow.id, { data: input });
        
        return result.results.step_0 || input;
      }
    });
  }
  
  /**
   * Register default transformers
   */
  registerDefaultTransformers() {
    // JSON transformer
    this.registerTransformer('json', {
      parse: (input) => JSON.parse(input),
      stringify: (input) => JSON.stringify(input)
    });
    
    // CSV transformer
    this.registerTransformer('csv', {
      parse: (input) => this.parseCSV(input),
      stringify: (input) => this.stringifyCSV(input)
    });
    
    // XML transformer
    this.registerTransformer('xml', {
      parse: (input) => this.parseXML(input),
      stringify: (input) => this.stringifyXML(input)
    });
    
    // Base64 transformer
    this.registerTransformer('base64', {
      encode: (input) => Buffer.from(input).toString('base64'),
      decode: (input) => Buffer.from(input, 'base64').toString()
    });
    
    // Compression transformer
    this.registerTransformer('compress', {
      compress: async (input) => this.compressData(input),
      decompress: async (input) => this.decompressData(input)
    });
  }
  
  /**
   * Register default validators
   */
  registerDefaultValidators() {
    // Schema validator
    this.registerValidator('schema', (data, schema) => {
      return this.validateSchema(data, schema);
    });
    
    // Type validator
    this.registerValidator('type', (data, type) => {
      return typeof data === type;
    });
    
    // Range validator
    this.registerValidator('range', (data, { min, max }) => {
      return data >= min && data <= max;
    });
    
    // Pattern validator
    this.registerValidator('pattern', (data, pattern) => {
      const regex = new RegExp(pattern);
      return regex.test(data);
    });
    
    // Required validator
    this.registerValidator('required', (data, fields) => {
      for (const field of fields) {
        if (!data[field]) return false;
      }
      return true;
    });
  }
  
  /**
   * Register a stage type
   */
  registerStage(type, definition) {
    this.stageDefinitions.set(type, {
      type,
      ...definition
    });
    
    logger.info(`📝 Registered stage type: ${type}`);
  }
  
  /**
   * Register a transformer
   */
  registerTransformer(name, transformer) {
    this.transformers.set(name, transformer);
  }
  
  /**
   * Register a validator
   */
  registerValidator(name, validator) {
    this.validators.set(name, validator);
  }
  
  /**
   * Register an aggregator
   */
  registerAggregator(name, aggregator) {
    this.aggregators.set(name, aggregator);
  }
  
  /**
   * Apply transformation to data
   */
  async applyTransform(data, transformSpec) {
    if (typeof transformSpec === 'string') {
      const transformer = this.transformers.get(transformSpec);
      if (transformer) {
        return await transformer(data);
      }
    }
    
    if (typeof transformSpec === 'function') {
      return await transformSpec(data);
    }
    
    if (transformSpec.type) {
      const transformer = this.transformers.get(transformSpec.type);
      if (transformer && transformer[transformSpec.method]) {
        return await transformer[transformSpec.method](data, transformSpec.options);
      }
    }
    
    return data;
  }
  
  /**
   * Validate data
   */
  async validateData(data, validationSpec) {
    if (typeof validationSpec === 'string') {
      const validator = this.validators.get(validationSpec);
      if (validator && !validator(data)) {
        throw new Error(`Validation failed: ${validationSpec}`);
      }
    }
    
    if (typeof validationSpec === 'function') {
      if (!await validationSpec(data)) {
        throw new Error('Validation failed');
      }
    }
    
    if (validationSpec.type) {
      const validator = this.validators.get(validationSpec.type);
      if (validator && !validator(data, validationSpec.params)) {
        throw new Error(`Validation failed: ${validationSpec.type}`);
      }
    }
  }
  
  /**
   * Create a pipeline workflow
   */
  async createPipelineWorkflow(pipeline) {
    const workflowSteps = pipeline.stages.map(stage => ({
      id: stage.id || stage.name,
      type: 'task',
      name: stage.name,
      specialist: 'auto',
      task: {
        type: 'pipeline_stage',
        stage: stage
      },
      dependencies: this.getStageDependencies(stage, pipeline.connections)
    }));
    
    const workflow = await this.workflowEngine.createWorkflow({
      name: `Pipeline Workflow: ${pipeline.name}`,
      description: pipeline.description,
      steps: workflowSteps,
      config: {
        parallel: pipeline.config.parallel,
        timeout: pipeline.config.timeout,
        retries: pipeline.config.retries
      }
    });
    
    pipeline.workflowId = workflow.id;
    
    return workflow;
  }
  
  /**
   * Helper methods
   */
  
  generatePipelineId() {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateCacheKey(keySpec, input) {
    if (typeof keySpec === 'function') {
      return keySpec(input);
    }
    
    return `${keySpec}_${JSON.stringify(input).substring(0, 100)}`;
  }
  
  validateStages(stages) {
    return stages.map(stage => ({
      id: stage.id || `stage_${Math.random().toString(36).substring(2, 9)}`,
      name: stage.name || 'Unnamed Stage',
      type: stage.type || 'transform',
      ...stage
    }));
  }
  
  validatePipeline(pipeline) {
    if (!pipeline.stages || pipeline.stages.length === 0) {
      throw new Error('Pipeline must have at least one stage');
    }
    
    // Validate stage types
    for (const stage of pipeline.stages) {
      if (!this.stageDefinitions.has(stage.type)) {
        throw new Error(`Unknown stage type: ${stage.type}`);
      }
    }
    
    return true;
  }
  
  groupStagesByDependencies(stages, connections) {
    const groups = [];
    const completed = new Set();
    
    while (completed.size < stages.length) {
      const group = [];
      
      for (const stage of stages) {
        if (completed.has(stage.id)) continue;
        
        const deps = this.getStageDependencies(stage, connections);
        if (deps.every(dep => completed.has(dep))) {
          group.push(stage);
        }
      }
      
      if (group.length === 0) {
        throw new Error('Circular dependencies in pipeline');
      }
      
      group.forEach(stage => completed.add(stage.id));
      groups.push(group);
    }
    
    return groups;
  }
  
  getStageDependencies(stage, connections) {
    const deps = [];
    
    for (const conn of connections) {
      if (conn.to === stage.id) {
        deps.push(conn.from);
      }
    }
    
    return deps;
  }
  
  resolveStageInput(stage, dataFlow, connections) {
    const inputs = [];
    
    for (const conn of connections) {
      if (conn.to === stage.id) {
        inputs.push(dataFlow[conn.from]);
      }
    }
    
    if (inputs.length === 0) {
      return dataFlow.input;
    }
    
    if (inputs.length === 1) {
      return inputs[0];
    }
    
    return inputs;
  }
  
  mergeResults(results, strategy = 'array') {
    switch (strategy) {
      case 'array':
        return results;
      
      case 'concat':
        return results.flat();
      
      case 'merge':
        return Object.assign({}, ...results);
      
      case 'first':
        return results[0];
      
      case 'last':
        return results[results.length - 1];
      
      default:
        return results;
    }
  }
  
  shouldTerminate(data, stage) {
    if (stage.terminateOn) {
      return this.evaluateCondition(data, stage.terminateOn);
    }
    
    return false;
  }
  
  evaluateCondition(data, condition) {
    if (typeof condition === 'function') {
      return condition(data);
    }
    
    if (typeof condition === 'boolean') {
      return condition;
    }
    
    // Simple condition evaluation
    if (condition.field && condition.operator && condition.value !== undefined) {
      const fieldValue = data[condition.field];
      
      switch (condition.operator) {
        case '==': return fieldValue == condition.value;
        case '!=': return fieldValue != condition.value;
        case '>': return fieldValue > condition.value;
        case '<': return fieldValue < condition.value;
        case '>=': return fieldValue >= condition.value;
        case '<=': return fieldValue <= condition.value;
        case 'in': return condition.value.includes(fieldValue);
        case 'not_in': return !condition.value.includes(fieldValue);
        default: return false;
      }
    }
    
    return false;
  }
  
  async handleStageError(stage, error, execution) {
    execution.state.errors.push({
      stage: stage.id || stage.name,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Check for error handler
    if (stage.onError) {
      try {
        return await this.executeStage(stage.onError, execution.state.dataFlow, execution);
      } catch (handlerError) {
        logger.error('Error handler failed:', handlerError);
      }
    }
    
    // Check for retry
    if (stage.retries && (!stage.retryCount || stage.retryCount < stage.retries)) {
      stage.retryCount = (stage.retryCount || 0) + 1;
      logger.info(`Retrying stage ${stage.name} (${stage.retryCount}/${stage.retries})`);
      
      await new Promise(resolve => 
        setTimeout(resolve, stage.retryDelay || 1000)
      );
      
      return await this.executeStage(stage, execution.state.dataFlow.input, execution);
    }
  }
  
  completePipelineExecution(execution, result) {
    const duration = Date.now() - execution.startTime;
    
    // Update metrics
    this.metrics.pipelinesExecuted++;
    
    if (result.success) {
      this.metrics.pipelinesCompleted++;
    } else {
      this.metrics.pipelinesFailed++;
    }
    
    // Update throughput
    const itemsProcessed = execution.state.dataFlow.output?.length || 1;
    this.metrics.dataProcessed += itemsProcessed;
    this.metrics.averageThroughput = this.metrics.dataProcessed / this.metrics.pipelinesExecuted;
    
    // Clean up
    this.activePipelines.delete(execution.id);
    
    this.emit('pipeline:completed', { execution, result, duration });
  }
  
  calculateMetrics(execution) {
    const duration = Date.now() - execution.startTime;
    const itemsProcessed = execution.state.dataFlow.output?.length || 1;
    
    return {
      duration,
      itemsProcessed,
      throughput: itemsProcessed / (duration / 1000),
      stagesCompleted: execution.state.completedStages.length,
      errors: execution.state.errors.length
    };
  }
  
  async loadPipelineTemplates() {
    // Load built-in templates
    const templates = [
      {
        id: 'etl',
        name: 'ETL Pipeline',
        description: 'Extract, Transform, Load',
        stages: [
          { type: 'transform', name: 'Extract', transformer: 'json' },
          { type: 'filter', name: 'Validate' },
          { type: 'transform', name: 'Transform' },
          { type: 'batch', name: 'Load', batchSize: 100 }
        ]
      },
      {
        id: 'stream-processing',
        name: 'Stream Processing',
        description: 'Real-time stream processing',
        config: { streaming: true },
        stages: [
          { type: 'filter', name: 'Filter' },
          { type: 'map', name: 'Transform' },
          { type: 'aggregate', name: 'Aggregate' }
        ]
      },
      {
        id: 'data-validation',
        name: 'Data Validation',
        description: 'Validate and clean data',
        stages: [
          { type: 'transform', name: 'Parse' },
          { type: 'filter', name: 'Validate', validate: 'schema' },
          { type: 'transform', name: 'Clean' },
          { type: 'cache', name: 'Cache Results' }
        ]
      }
    ];
    
    for (const template of templates) {
      this.pipelineTemplates.set(template.id, template);
    }
  }
  
  /**
   * Get pipeline by ID
   */
  getPipeline(pipelineId) {
    return this.pipelines.get(pipelineId);
  }
  
  /**
   * List all pipelines
   */
  listPipelines() {
    return Array.from(this.pipelines.values());
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activePipelines: this.activePipelines.size,
      registeredPipelines: this.pipelines.size,
      stageTypes: this.stageDefinitions.size,
      transformers: this.transformers.size,
      validators: this.validators.size
    };
  }
  
  /**
   * Destroy the manager
   */
  destroy() {
    this.removeAllListeners();
    this.pipelines.clear();
    this.activePipelines.clear();
    this.cache.clear();
    
    logger.info('💥 Pipeline Manager destroyed');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  PipelineManager,
  getInstance: (config) => {
    if (!instance) {
      instance = new PipelineManager(config);
    }
    return instance;
  }
};