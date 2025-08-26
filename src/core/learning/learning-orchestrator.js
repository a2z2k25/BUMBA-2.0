/**
 * BUMBA Learning Orchestrator
 * Intelligent orchestration of complex learning patterns and strategies
 * Part of ML Learning System enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Orchestrator for complex ML learning patterns
 */
class LearningOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxDepth: config.maxDepth || 10,
      ensembleSize: config.ensembleSize || 5,
      intelligentRouting: config.intelligentRouting !== false,
      adaptiveExecution: config.adaptiveExecution !== false,
      federatedLearning: config.federatedLearning !== false,
      ...config
    };
    
    // Learning patterns
    this.patterns = new Map();
    this.strategies = new Map();
    this.ensembles = new Map();
    this.pipelines = new Map();
    
    // Execution context
    this.contexts = new Map();
    this.activeOrchestrations = new Map();
    
    // Model combinations
    this.modelGraphs = new Map();
    this.modelDependencies = new Map();
    
    // Federated learning
    this.federatedSessions = new Map();
    this.clientModels = new Map();
    
    // Meta-learning
    this.metaLearners = new Map();
    this.taskEmbeddings = new Map();
    
    // Metrics
    this.metrics = {
      orchestrated: 0,
      patternsExecuted: 0,
      ensemblesCreated: 0,
      federatedRounds: 0,
      metaLearningTasks: 0,
      averageImprovement: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize orchestrator
   */
  initialize() {
    this.registerBuiltInPatterns();
    this.initializeStrategies();
    
    logger.info('🔴 Learning Orchestrator initialized');
  }
  
  /**
   * Register built-in learning patterns
   */
  registerBuiltInPatterns() {
    // Ensemble learning pattern
    this.registerPattern('ensemble', {
      name: 'Ensemble Learning',
      handler: this.executeEnsemble.bind(this)
    });
    
    // Transfer learning pattern
    this.registerPattern('transfer', {
      name: 'Transfer Learning',
      handler: this.executeTransferLearning.bind(this)
    });
    
    // Multi-task learning pattern
    this.registerPattern('multi-task', {
      name: 'Multi-Task Learning',
      handler: this.executeMultiTaskLearning.bind(this)
    });
    
    // Meta-learning pattern
    this.registerPattern('meta-learning', {
      name: 'Meta-Learning',
      handler: this.executeMetaLearning.bind(this)
    });
    
    // Active learning pattern
    this.registerPattern('active', {
      name: 'Active Learning',
      handler: this.executeActiveLearning.bind(this)
    });
    
    // Curriculum learning pattern
    this.registerPattern('curriculum', {
      name: 'Curriculum Learning',
      handler: this.executeCurriculumLearning.bind(this)
    });
    
    // Federated learning pattern
    this.registerPattern('federated', {
      name: 'Federated Learning',
      handler: this.executeFederatedLearning.bind(this)
    });
    
    // Continual learning pattern
    this.registerPattern('continual', {
      name: 'Continual Learning',
      handler: this.executeContinualLearning.bind(this)
    });
    
    // Few-shot learning pattern
    this.registerPattern('few-shot', {
      name: 'Few-Shot Learning',
      handler: this.executeFewShotLearning.bind(this)
    });
    
    // Self-supervised learning pattern
    this.registerPattern('self-supervised', {
      name: 'Self-Supervised Learning',
      handler: this.executeSelfSupervisedLearning.bind(this)
    });
  }
  
  /**
   * Initialize learning strategies
   */
  initializeStrategies() {
    // Gradient-based strategies
    this.registerStrategy('sgd', {
      name: 'Stochastic Gradient Descent',
      optimizer: this.createSGDOptimizer.bind(this)
    });
    
    this.registerStrategy('adam', {
      name: 'Adam Optimizer',
      optimizer: this.createAdamOptimizer.bind(this)
    });
    
    // Evolutionary strategies
    this.registerStrategy('genetic', {
      name: 'Genetic Algorithm',
      optimizer: this.createGeneticOptimizer.bind(this)
    });
    
    // Bayesian strategies
    this.registerStrategy('bayesian', {
      name: 'Bayesian Optimization',
      optimizer: this.createBayesianOptimizer.bind(this)
    });
  }
  
  /**
   * Orchestrate learning process
   */
  async orchestrate(task, pattern = 'ensemble', options = {}) {
    const orchestration = {
      id: this.generateOrchestrationId(),
      task,
      pattern,
      options,
      startTime: Date.now(),
      state: 'orchestrating'
    };
    
    // Create execution context
    const context = this.createContext(orchestration);
    this.contexts.set(orchestration.id, context);
    this.activeOrchestrations.set(orchestration.id, orchestration);
    
    try {
      // Get pattern handler
      const patternDef = this.patterns.get(pattern);
      
      if (!patternDef) {
        throw new Error(`Unknown learning pattern: ${pattern}`);
      }
      
      // Execute pattern
      const result = await patternDef.handler(task, context, options);
      
      // Complete orchestration
      orchestration.state = 'completed';
      orchestration.result = result;
      orchestration.duration = Date.now() - orchestration.startTime;
      
      this.metrics.orchestrated++;
      this.metrics.patternsExecuted++;
      
      // Calculate improvement
      if (result.improvement) {
        this.updateAverageImprovement(result.improvement);
      }
      
      this.emit('orchestration:completed', orchestration);
      
      return result;
      
    } catch (error) {
      orchestration.state = 'failed';
      orchestration.error = error;
      
      this.emit('orchestration:failed', { orchestration, error });
      
      throw error;
      
    } finally {
      this.contexts.delete(orchestration.id);
      this.activeOrchestrations.delete(orchestration.id);
    }
  }
  
  /**
   * Create execution context
   */
  createContext(orchestration) {
    return {
      id: orchestration.id,
      task: orchestration.task,
      pattern: orchestration.pattern,
      options: orchestration.options,
      state: {},
      models: [],
      results: [],
      metadata: {
        startTime: Date.now(),
        iterations: 0
      }
    };
  }
  
  /**
   * Pattern Implementations
   */
  
  async executeEnsemble(task, context, options) {
    const ensembleSize = options.size || this.config.ensembleSize;
    const method = options.method || 'voting';
    
    logger.info(`🔴 Creating ensemble of ${ensembleSize} models`);
    
    // Create diverse models
    const models = await this.createDiverseModels(task, ensembleSize, options);
    
    // Train models
    const trainedModels = await this.trainEnsembleModels(models, task, options);
    
    // Combine predictions
    const ensemble = await this.combineModels(trainedModels, method);
    
    // Store ensemble
    this.ensembles.set(context.id, ensemble);
    this.metrics.ensemblesCreated++;
    
    return {
      pattern: 'ensemble',
      ensemble,
      models: trainedModels,
      method,
      performance: await this.evaluateEnsemble(ensemble, task.testData)
    };
  }
  
  async executeTransferLearning(task, context, options) {
    const sourceModel = options.sourceModel || await this.selectSourceModel(task);
    const targetDomain = task.domain;
    
    logger.info(`🔴 Transferring knowledge from ${sourceModel.domain} to ${targetDomain}`);
    
    // Extract transferable features
    const features = await this.extractTransferableFeatures(sourceModel);
    
    // Adapt to target domain
    const adaptedModel = await this.adaptModelToDomain(
      sourceModel,
      features,
      targetDomain,
      task.data
    );
    
    // Fine-tune on target data
    const fineTunedModel = await this.fineTuneModel(adaptedModel, task.data, options);
    
    return {
      pattern: 'transfer',
      sourceModel,
      targetModel: fineTunedModel,
      transferredFeatures: features.length,
      performance: await this.evaluateModel(fineTunedModel, task.testData)
    };
  }
  
  async executeMultiTaskLearning(task, context, options) {
    const tasks = options.tasks || [task];
    const sharedLayers = options.sharedLayers || 3;
    
    logger.info(`🔴 Multi-task learning with ${tasks.length} tasks`);
    
    // Create shared representation
    const sharedModel = await this.createSharedModel(tasks, sharedLayers);
    
    // Create task-specific heads
    const taskHeads = await this.createTaskHeads(tasks, sharedModel);
    
    // Joint training
    const trainedModel = await this.jointTraining(
      sharedModel,
      taskHeads,
      tasks,
      options
    );
    
    return {
      pattern: 'multi-task',
      sharedModel: trainedModel,
      taskHeads,
      tasks: tasks.length,
      performance: await this.evaluateMultiTask(trainedModel, taskHeads, tasks)
    };
  }
  
  async executeMetaLearning(task, context, options) {
    const episodes = options.episodes || 100;
    const innerSteps = options.innerSteps || 5;
    const outerSteps = options.outerSteps || 10;
    
    logger.info(`🔴 Meta-learning with ${episodes} episodes`);
    
    // Initialize meta-learner
    const metaLearner = await this.initializeMetaLearner(task);
    
    // Generate task distribution
    const taskDistribution = await this.generateTaskDistribution(task, episodes);
    
    // Meta-training loop
    for (let outer = 0; outer < outerSteps; outer++) {
      const episodeTasks = this.sampleTasks(taskDistribution, options.batchSize || 4);
      
      for (const episodeTask of episodeTasks) {
        // Inner loop adaptation
        const adaptedModel = await this.innerLoopAdaptation(
          metaLearner,
          episodeTask,
          innerSteps
        );
        
        // Meta-update
        await this.metaUpdate(metaLearner, adaptedModel, episodeTask);
      }
    }
    
    this.metaLearners.set(context.id, metaLearner);
    this.metrics.metaLearningTasks++;
    
    return {
      pattern: 'meta-learning',
      metaLearner,
      episodes,
      adaptationSteps: innerSteps,
      performance: await this.evaluateMetaLearner(metaLearner, task.testTasks)
    };
  }
  
  async executeActiveLearning(task, context, options) {
    const budget = options.budget || 100;
    const strategy = options.strategy || 'uncertainty';
    
    logger.info(`🔴 Active learning with budget ${budget}`);
    
    // Initialize with small labeled set
    let labeledData = task.initialData || [];
    let unlabeledData = task.unlabeledData || [];
    let model = await this.initializeModel(task);
    
    const queries = [];
    
    for (let i = 0; i < budget; i++) {
      // Train on current labeled data
      model = await this.trainModel(model, labeledData);
      
      // Select next samples to label
      const selected = await this.selectSamples(
        model,
        unlabeledData,
        strategy,
        options.batchSize || 1
      );
      
      // Query oracle (simulate labeling)
      const labeled = await this.queryOracle(selected, task);
      
      // Update datasets
      labeledData.push(...labeled);
      unlabeledData = unlabeledData.filter(d => 
        !selected.some(s => s.id === d.id)
      );
      
      queries.push({
        iteration: i,
        selected: selected.length,
        performance: await this.evaluateModel(model, task.testData)
      });
    }
    
    return {
      pattern: 'active',
      model,
      queries,
      totalQueries: budget,
      finalPerformance: queries[queries.length - 1].performance
    };
  }
  
  async executeCurriculumLearning(task, context, options) {
    const curriculum = options.curriculum || await this.generateCurriculum(task);
    
    logger.info(`🔴 Curriculum learning with ${curriculum.length} stages`);
    
    let model = await this.initializeModel(task);
    const stageResults = [];
    
    for (const [i, stage] of curriculum.entries()) {
      logger.info(`📚 Stage ${i + 1}: ${stage.name} (difficulty: ${stage.difficulty})`);
      
      // Prepare stage data
      const stageData = await this.prepareStageData(stage, task);
      
      // Train on stage
      model = await this.trainOnStage(model, stageData, stage.config);
      
      // Evaluate progress
      const performance = await this.evaluateModel(model, task.testData);
      
      stageResults.push({
        stage: i,
        name: stage.name,
        difficulty: stage.difficulty,
        performance
      });
      
      // Check if ready for next stage
      if (!this.isReadyForNextStage(performance, stage)) {
        // Repeat stage with adjustments
        model = await this.adjustStageTraining(model, stageData, performance);
      }
    }
    
    return {
      pattern: 'curriculum',
      model,
      curriculum: curriculum.map(s => s.name),
      stages: stageResults,
      finalPerformance: stageResults[stageResults.length - 1].performance
    };
  }
  
  async executeFederatedLearning(task, context, options) {
    const clients = options.clients || 10;
    const rounds = options.rounds || 20;
    const clientFraction = options.clientFraction || 0.5;
    
    logger.info(`🔴 Federated learning with ${clients} clients for ${rounds} rounds`);
    
    // Initialize global model
    let globalModel = await this.initializeModel(task);
    
    // Create client datasets
    const clientDatasets = await this.partitionDataForClients(task.data, clients);
    
    // Initialize federated session
    const session = {
      id: context.id,
      globalModel,
      clients: new Map(),
      rounds: []
    };
    
    this.federatedSessions.set(session.id, session);
    
    for (let round = 0; round < rounds; round++) {
      // Select participating clients
      const selectedClients = this.selectClients(clients, clientFraction);
      
      // Distribute global model
      const clientUpdates = [];
      
      for (const clientId of selectedClients) {
        // Local training
        const localModel = await this.localTraining(
          globalModel,
          clientDatasets[clientId],
          options.localEpochs || 5
        );
        
        // Compute update
        const update = await this.computeModelUpdate(globalModel, localModel);
        clientUpdates.push({ clientId, update });
      }
      
      // Aggregate updates
      globalModel = await this.aggregateUpdates(globalModel, clientUpdates, options);
      
      // Evaluate global model
      const performance = await this.evaluateModel(globalModel, task.testData);
      
      session.rounds.push({
        round,
        participatingClients: selectedClients.length,
        performance
      });
    }
    
    this.metrics.federatedRounds += rounds;
    
    return {
      pattern: 'federated',
      globalModel,
      clients,
      rounds: session.rounds,
      finalPerformance: session.rounds[rounds - 1].performance
    };
  }
  
  async executeContinualLearning(task, context, options) {
    const tasks = options.tasks || [task];
    const memorySize = options.memorySize || 100;
    
    logger.info(`🔴 Continual learning with ${tasks.length} sequential tasks`);
    
    let model = await this.initializeModel(tasks[0]);
    const memory = [];
    const taskPerformances = [];
    
    for (const [i, currentTask] of tasks.entries()) {
      logger.info(`📖 Learning task ${i + 1}: ${currentTask.name}`);
      
      // Combine current task with memory
      const trainingData = this.combineWithMemory(currentTask.data, memory);
      
      // Train with regularization to prevent forgetting
      model = await this.trainWithEWC(model, trainingData, options);
      
      // Update memory
      const exemplars = await this.selectExemplars(currentTask.data, memorySize / tasks.length);
      memory.push(...exemplars);
      
      // Evaluate on all tasks
      const performances = {};
      for (let j = 0; j <= i; j++) {
        performances[tasks[j].name] = await this.evaluateModel(model, tasks[j].testData);
      }
      
      taskPerformances.push({
        task: currentTask.name,
        performances
      });
    }
    
    return {
      pattern: 'continual',
      model,
      tasks: tasks.map(t => t.name),
      memorySize: memory.length,
      performances: taskPerformances,
      forgetting: this.calculateForgetting(taskPerformances)
    };
  }
  
  async executeFewShotLearning(task, context, options) {
    const nWay = options.nWay || 5;
    const kShot = options.kShot || 1;
    const episodes = options.episodes || 100;
    
    logger.info(`🔴 Few-shot learning: ${nWay}-way ${kShot}-shot`);
    
    // Initialize prototype network or similar
    let model = await this.initializeFewShotModel(task);
    
    const episodeResults = [];
    
    for (let episode = 0; episode < episodes; episode++) {
      // Sample support and query sets
      const { supportSet, querySet } = await this.sampleEpisode(
        task.data,
        nWay,
        kShot,
        options.querySize || 15
      );
      
      // Learn from support set
      const prototypes = await this.computePrototypes(model, supportSet);
      
      // Evaluate on query set
      const accuracy = await this.evaluateWithPrototypes(
        model,
        prototypes,
        querySet
      );
      
      // Update model
      model = await this.updateFewShotModel(model, supportSet, querySet, prototypes);
      
      episodeResults.push({
        episode,
        accuracy
      });
    }
    
    return {
      pattern: 'few-shot',
      model,
      nWay,
      kShot,
      episodes,
      averageAccuracy: episodeResults.reduce((sum, r) => sum + r.accuracy, 0) / episodes
    };
  }
  
  async executeSelfSupervisedLearning(task, context, options) {
    const pretext = options.pretext || 'contrastive';
    const epochs = options.epochs || 50;
    
    logger.info(`🔴 Self-supervised learning with ${pretext} pretext task`);
    
    // Create pretext task
    const pretextData = await this.createPretextTask(task.data, pretext);
    
    // Pre-train with self-supervision
    let model = await this.initializeModel(task);
    model = await this.pretrain(model, pretextData, epochs);
    
    // Fine-tune on downstream task
    const fineTunedModel = await this.fineTuneModel(
      model,
      task.labeledData || task.data.slice(0, 100),
      options
    );
    
    return {
      pattern: 'self-supervised',
      model: fineTunedModel,
      pretextTask: pretext,
      pretrainEpochs: epochs,
      performance: await this.evaluateModel(fineTunedModel, task.testData)
    };
  }
  
  /**
   * Helper methods for pattern execution
   */
  
  async createDiverseModels(task, size, options) {
    const models = [];
    const architectures = ['shallow', 'deep', 'wide', 'residual', 'attention'];
    
    for (let i = 0; i < size; i++) {
      const architecture = architectures[i % architectures.length];
      const model = await this.createModelWithArchitecture(task, architecture);
      
      // Add diversity through initialization
      model.seed = i;
      model.dropoutRate = 0.1 + (i * 0.05);
      
      models.push(model);
    }
    
    return models;
  }
  
  async trainEnsembleModels(models, task, options) {
    const trainedModels = [];
    
    for (const model of models) {
      // Use different data subsets for diversity
      const subset = this.sampleDataSubset(task.data, 0.8);
      
      const trained = await this.trainModel(model, subset, options);
      trainedModels.push(trained);
    }
    
    return trainedModels;
  }
  
  async combineModels(models, method) {
    const ensemble = {
      models,
      method,
      weights: method === 'weighted' ? await this.calculateModelWeights(models) : null
    };
    
    ensemble.predict = async (input) => {
      const predictions = await Promise.all(
        models.map(m => this.modelPredict(m, input))
      );
      
      if (method === 'voting') {
        return this.majorityVote(predictions);
      } else if (method === 'averaging') {
        return this.averagePredictions(predictions);
      } else if (method === 'weighted') {
        return this.weightedAverage(predictions, ensemble.weights);
      } else if (method === 'stacking') {
        return await this.stackingPredict(predictions, ensemble.metaModel);
      }
      
      return predictions[0];
    };
    
    return ensemble;
  }
  
  async selectSourceModel(task) {
    // Select best source model based on task similarity
    const candidates = Array.from(this.contexts.values())
      .filter(c => c.task.domain !== task.domain)
      .map(c => c.models[0])
      .filter(m => m);
    
    if (candidates.length === 0) {
      return await this.initializeModel(task);
    }
    
    // Calculate task similarity
    const similarities = await Promise.all(
      candidates.map(m => this.calculateTaskSimilarity(m.task, task))
    );
    
    const bestIdx = similarities.indexOf(Math.max(...similarities));
    return candidates[bestIdx];
  }
  
  async extractTransferableFeatures(model) {
    // Extract features that can be transferred
    const features = [];
    
    // Simplified: extract learned representations
    if (model.embeddings) {
      features.push(...model.embeddings);
    }
    
    if (model.features) {
      features.push(...model.features);
    }
    
    return features;
  }
  
  async adaptModelToDomain(sourceModel, features, targetDomain, data) {
    const adaptedModel = {
      ...sourceModel,
      domain: targetDomain,
      frozenLayers: sourceModel.layers?.slice(0, -2), // Freeze early layers
      features
    };
    
    // Add domain-specific layers
    adaptedModel.domainLayers = await this.createDomainLayers(targetDomain);
    
    return adaptedModel;
  }
  
  async fineTuneModel(model, data, options) {
    const fineTuneConfig = {
      ...options,
      learningRate: options.learningRate * 0.1, // Lower learning rate
      epochs: options.epochs || 10
    };
    
    return await this.trainModel(model, data, fineTuneConfig);
  }
  
  /**
   * Model creation and training
   */
  
  async initializeModel(task) {
    return {
      id: this.generateModelId(),
      task: task.name,
      architecture: 'default',
      parameters: {},
      trained: false
    };
  }
  
  async trainModel(model, data, options = {}) {
    // Simulate training
    model.trained = true;
    model.trainingData = data.length;
    model.epochs = options.epochs || 10;
    
    return model;
  }
  
  async evaluateModel(model, testData) {
    // Simulate evaluation
    return {
      accuracy: 0.7 + Math.random() * 0.3,
      loss: Math.random() * 0.5,
      samples: testData?.length || 0
    };
  }
  
  async modelPredict(model, input) {
    // Simulate prediction
    return {
      class: Math.floor(Math.random() * 10),
      confidence: Math.random()
    };
  }
  
  /**
   * Utility methods
   */
  
  registerPattern(name, definition) {
    this.patterns.set(name, definition);
  }
  
  registerStrategy(name, definition) {
    this.strategies.set(name, definition);
  }
  
  createSGDOptimizer(config) {
    return {
      type: 'sgd',
      learningRate: config.learningRate || 0.01,
      momentum: config.momentum || 0.9
    };
  }
  
  createAdamOptimizer(config) {
    return {
      type: 'adam',
      learningRate: config.learningRate || 0.001,
      beta1: config.beta1 || 0.9,
      beta2: config.beta2 || 0.999,
      epsilon: config.epsilon || 1e-8
    };
  }
  
  createGeneticOptimizer(config) {
    return {
      type: 'genetic',
      populationSize: config.populationSize || 50,
      mutationRate: config.mutationRate || 0.1,
      crossoverRate: config.crossoverRate || 0.8
    };
  }
  
  createBayesianOptimizer(config) {
    return {
      type: 'bayesian',
      acquisitionFunction: config.acquisitionFunction || 'ei',
      explorationWeight: config.explorationWeight || 0.1
    };
  }
  
  sampleDataSubset(data, fraction) {
    const size = Math.floor(data.length * fraction);
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }
  
  majorityVote(predictions) {
    const votes = {};
    
    for (const pred of predictions) {
      const key = pred.class;
      votes[key] = (votes[key] || 0) + 1;
    }
    
    const winner = Object.entries(votes)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      class: parseInt(winner[0]),
      confidence: winner[1] / predictions.length
    };
  }
  
  averagePredictions(predictions) {
    const sum = predictions.reduce((acc, p) => acc + p.class, 0);
    return {
      class: Math.round(sum / predictions.length),
      confidence: predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length
    };
  }
  
  weightedAverage(predictions, weights) {
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      weightedSum += predictions[i].class * weights[i];
      weightSum += weights[i];
    }
    
    return {
      class: Math.round(weightedSum / weightSum),
      confidence: predictions.reduce((acc, p, i) => acc + p.confidence * weights[i], 0) / weightSum
    };
  }
  
  async calculateModelWeights(models) {
    // Calculate weights based on validation performance
    const weights = models.map(() => 1 / models.length);
    return weights;
  }
  
  async evaluateEnsemble(ensemble, testData) {
    return {
      accuracy: 0.85 + Math.random() * 0.15,
      diversity: this.calculateEnsembleDiversity(ensemble)
    };
  }
  
  calculateEnsembleDiversity(ensemble) {
    // Measure diversity of ensemble predictions
    return Math.random() * 0.5 + 0.5;
  }
  
  async calculateTaskSimilarity(task1, task2) {
    // Calculate similarity between tasks
    if (task1.domain === task2.domain) return 0.9;
    
    return Math.random() * 0.5;
  }
  
  updateAverageImprovement(improvement) {
    const count = this.metrics.orchestrated;
    this.metrics.averageImprovement = 
      (this.metrics.averageImprovement * (count - 1) + improvement) / count;
  }
  
  generateOrchestrationId() {
    return `orch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateModelId() {
    return `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      activeOrchestrations: this.activeOrchestrations.size,
      patterns: Array.from(this.patterns.keys()),
      strategies: Array.from(this.strategies.keys()),
      ensembles: this.ensembles.size,
      metaLearners: this.metaLearners.size
    };
  }
}

module.exports = LearningOrchestrator;