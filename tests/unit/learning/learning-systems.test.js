/**
 * Unit Tests for BUMBA Learning Systems
 */

const { 
  OptimizationEngine,
  OptimizationStrategy 
} = require('../../../src/core/learning/optimization-engine');

const {
  MLLearningSystem,
  ModelType,
  LearningStrategy
} = require('../../../src/core/learning/ml-learning-system');

const {
  HumanLearningModule,
  LearningStyle,
  KnowledgeLevel
} = require('../../../src/core/learning/human-learning-module');

const {
  DataCollectionService
} = require('../../../src/core/learning/data-collection-service');

const {
  ModelTrainingService
} = require('../../../src/core/learning/model-training-service');

const {
  AdaptiveTransferService
} = require('../../../src/core/learning/adaptive-transfer-service');

describe('Learning Systems Tests', () => {
  
  describe('OptimizationEngine', () => {
    let engine;
    
    beforeEach(() => {
      engine = new OptimizationEngine();
    });
    
    test('should initialize correctly', () => {
      expect(engine).toBeDefined();
      expect(engine.learningDomains).toBeDefined();
      expect(Object.keys(engine.learningDomains)).toHaveLength(5);
    });
    
    test('should have optimize method', () => {
      expect(typeof engine.optimize).toBe('function');
    });
    
    test('should optimize with valid data', async () => {
      const data = {
        type: 'test',
        metrics: { performance: 0.8 }
      };
      
      const result = await engine.optimize(data);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.learningResult).toBeDefined();
    });
    
    test('should use correct optimization strategy', () => {
      expect(OptimizationStrategy.PERFORMANCE).toBe('performance');
      expect(OptimizationStrategy.ADAPTIVE).toBe('adaptive');
    });
    
    test('should learn from execution', async () => {
      const executionData = {
        id: 'test-123',
        type: 'task',
        duration: 1000,
        quality_score: 0.85
      };
      
      const result = await engine.learnFromExecution(executionData);
      
      expect(result).toBeDefined();
      expect(result.execution_id).toBe('test-123');
      expect(result.learning_insights).toBeDefined();
      expect(result.optimization_recommendations).toBeDefined();
    });
  });
  
  describe('MLLearningSystem', () => {
    let mlSystem;
    
    beforeEach(() => {
      mlSystem = new MLLearningSystem();
    });
    
    test('should initialize correctly', () => {
      expect(mlSystem).toBeDefined();
      expect(mlSystem.models).toBeInstanceOf(Map);
      expect(mlSystem.trainingData).toBeInstanceOf(Map);
    });
    
    test('should have train method', () => {
      expect(typeof mlSystem.train).toBe('function');
    });
    
    test('should learn from interaction', async () => {
      const interaction = {
        agentId: 'agent-1',
        taskType: 'classification',
        input: { data: 'test' },
        actions: ['action1'],
        output: { result: 'success' },
        feedback: { score: 0.9 },
        performance: { score: 0.85 }
      };
      
      await mlSystem.learnFromInteraction(interaction);
      
      const insights = await mlSystem.getLearningInsights('agent-1');
      expect(insights).toBeDefined();
    });
    
    test('should predict optimal actions', async () => {
      const context = {
        agentId: 'agent-1',
        taskType: 'prediction',
        currentState: { value: 10 },
        availableActions: ['action1', 'action2', 'action3']
      };
      
      const result = await mlSystem.predictOptimalActions(context);
      
      expect(result).toBeDefined();
      expect(result.actions).toBeInstanceOf(Array);
      expect(result.confidence).toBeDefined();
      expect(result.reasoning).toBeDefined();
    });
    
    test('should detect anomalies', async () => {
      const behavior = {
        metrics: { speed: 100, accuracy: 0.1 }
      };
      
      const result = await mlSystem.detectAnomalies('agent-1', behavior);
      
      expect(result).toBeDefined();
      expect(result.isAnomaly).toBeDefined();
      expect(result.score).toBeDefined();
    });
    
    test('should use correct model types', () => {
      expect(ModelType.CLASSIFICATION).toBe('classification');
      expect(ModelType.REINFORCEMENT).toBe('reinforcement');
      expect(LearningStrategy.SUPERVISED).toBe('supervised');
      expect(LearningStrategy.TRANSFER).toBe('transfer');
    });
  });
  
  describe('HumanLearningModule', () => {
    let humanModule;
    
    beforeEach(() => {
      humanModule = new HumanLearningModule();
    });
    
    test('should initialize correctly', () => {
      expect(humanModule).toBeDefined();
      expect(humanModule.userProfiles).toBeInstanceOf(Map);
      expect(humanModule.preferenceCategories).toBeDefined();
    });
    
    test('should have learn method', () => {
      expect(typeof humanModule.learn).toBe('function');
    });
    
    test('should capture preferences', async () => {
      const feedback = {
        content: 'I prefer concise code comments',
        explicit: true
      };
      
      const context = {
        sessionId: 'session-1',
        projectPath: '/test',
        agentId: 'agent-1'
      };
      
      const result = await humanModule.capturePreferences(feedback, context);
      
      expect(result).toBeDefined();
      if (result) {
        expect(result.category).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      }
    });
    
    test('should personalize responses', async () => {
      const profile = {
        userId: 'user-1',
        preferences: {}
      };
      
      const result = await humanModule.personalizeResponses(profile);
      
      expect(result).toBeDefined();
      expect(result.style).toBeDefined();
      expect(result.preferences).toBeDefined();
      expect(result.adaptations).toBeInstanceOf(Array);
    });
    
    test('should process feedback', async () => {
      const feedback = {
        type: 'positive',
        content: 'Great job, this is exactly what I needed'
      };
      
      const result = await humanModule.processFeedback(feedback);
      
      expect(result).toBeDefined();
      if (result) {
        expect(result.sentiment).toBeDefined();
        expect(result.type).toBe('positive');
      }
    });
    
    test('should use correct learning styles', () => {
      expect(LearningStyle.VISUAL).toBe('visual');
      expect(LearningStyle.KINESTHETIC).toBe('kinesthetic');
      expect(KnowledgeLevel.BEGINNER).toBe('beginner');
      expect(KnowledgeLevel.EXPERT).toBe('expert');
    });
  });
  
  describe('DataCollectionService', () => {
    let dataService;
    
    beforeEach(() => {
      dataService = new DataCollectionService();
    });
    
    test('should initialize correctly', () => {
      expect(dataService).toBeDefined();
      expect(dataService.dataBuffers).toBeDefined();
      expect(dataService.stats).toBeDefined();
    });
    
    test('should collect interaction data', async () => {
      const data = {
        agentId: 'agent-1',
        taskType: 'test',
        input: 'test input',
        output: 'test output'
      };
      
      const result = await dataService.collectInteraction(data);
      
      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBeDefined();
        expect(result.timestamp).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });
    
    test('should collect patterns', async () => {
      const pattern = {
        type: 'sequential',
        occurrences: 15,
        successRate: 0.9
      };
      
      const result = await dataService.collectPattern(pattern);
      
      expect(result).toBeDefined();
      if (result) {
        expect(result.confidence).toBeGreaterThan(0);
      }
    });
    
    test('should query data', async () => {
      // Add some test data
      await dataService.collectInteraction({
        agentId: 'agent-1',
        taskType: 'test',
        input: 'test',
        output: 'result'
      });
      
      const results = await dataService.queryData({
        type: 'interactions',
        limit: 10
      });
      
      expect(results).toBeInstanceOf(Array);
    });
    
    test('should aggregate data', async () => {
      const aggregation = {
        type: 'interactions',
        groupBy: 'agentId',
        metrics: ['count'],
        timeRange: { start: Date.now() - 3600000, end: Date.now() }
      };
      
      const results = await dataService.aggregateData(aggregation);
      
      expect(results).toBeDefined();
      expect(typeof results).toBe('object');
    });
    
    test('should export for training', async () => {
      const exportData = await dataService.exportForTraining({
        types: ['interactions', 'patterns'],
        format: 'json'
      });
      
      expect(exportData).toBeDefined();
      if (exportData) {
        expect(exportData.version).toBeDefined();
        expect(exportData.data).toBeDefined();
      }
    });
  });
  
  describe('ModelTrainingService', () => {
    let trainingService;
    
    beforeEach(() => {
      trainingService = new ModelTrainingService();
    });
    
    test('should initialize correctly', () => {
      expect(trainingService).toBeDefined();
      expect(trainingService.models).toBeInstanceOf(Map);
      expect(trainingService.optimizers).toBeDefined();
    });
    
    test('should train model', async () => {
      const config = {
        data: Array(100).fill({ input: 1, target: 0 }),
        modelType: 'neural_network',
        modelConfig: {
          layers: [
            { units: 10 },
            { units: 5 }
          ]
        }
      };
      
      const result = await trainingService.trainModel(config);
      
      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(result.success).toBeDefined();
    });
    
    test('should optimize hyperparameters', async () => {
      const config = {
        data: Array(50).fill({ input: 1, target: 0 }),
        modelType: 'test',
        trials: 3
      };
      
      const result = await trainingService.optimizeHyperparameters(config);
      
      expect(result).toBeDefined();
      if (result.bestHyperparameters) {
        expect(result.bestHyperparameters.learningRate).toBeDefined();
        expect(result.allTrials).toBeInstanceOf(Array);
      }
    });
    
    test('should create ensemble', async () => {
      // Create some test models first
      const modelIds = ['model-1', 'model-2'];
      
      const result = await trainingService.createEnsemble(modelIds, {
        votingStrategy: 'weighted_average'
      });
      
      expect(result).toBeDefined();
    });
    
    test('should compress model', async () => {
      const result = await trainingService.compressModel('test-model', {
        method: 'pruning',
        ratio: 0.5
      });
      
      expect(result).toBeDefined();
    });
  });
  
  describe('AdaptiveTransferService', () => {
    let adaptiveService;
    
    beforeEach(() => {
      adaptiveService = new AdaptiveTransferService();
    });
    
    test('should initialize correctly', () => {
      expect(adaptiveService).toBeDefined();
      expect(adaptiveService.adaptations).toBeInstanceOf(Map);
      expect(adaptiveService.knowledgeGraph).toBeDefined();
    });
    
    test('should adapt behavior', async () => {
      const context = {
        recentPerformance: 0.3,
        isNewEnvironment: true,
        errorRate: 0.15
      };
      
      const result = await adaptiveService.adaptBehavior('agent-1', context);
      
      expect(result).toBeDefined();
      expect(result.adapted).toBeDefined();
    });
    
    test('should transfer knowledge', async () => {
      const result = await adaptiveService.transferKnowledge(
        'agent-1',
        'agent-2',
        { includePatterns: true }
      );
      
      expect(result).toBeDefined();
      expect(result.transferred).toBeDefined();
    });
    
    test('should perform meta-learning', async () => {
      const history = [
        { strategy: 'gradient_descent', success: 0.9 },
        { strategy: 'random_search', success: 0.3 }
      ];
      
      const result = await adaptiveService.metaLearn('agent-1', history);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      if (result.metaKnowledge) {
        expect(result.metaKnowledge.bestLearningRate).toBeDefined();
      }
    });
    
    test('should setup curriculum learning', async () => {
      const tasks = [
        { id: 'task-1', difficulty: 1 },
        { id: 'task-2', difficulty: 3 },
        { id: 'task-3', difficulty: 5 }
      ];
      
      const result = await adaptiveService.curriculumLearning('agent-1', tasks);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      if (result.schedule) {
        expect(result.schedule.tasks).toBeInstanceOf(Array);
      }
    });
    
    test('should perform few-shot learning', async () => {
      const examples = [
        { input: 1, output: 2 },
        { input: 2, output: 4 },
        { input: 3, output: 6 }
      ];
      
      const targetTask = { type: 'multiplication' };
      
      const result = await adaptiveService.fewShotLearning(
        'agent-1',
        examples,
        targetTask
      );
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
    
    test('should update reinforcement learning', async () => {
      const result = await adaptiveService.reinforcementUpdate(
        'agent-1',
        { position: 1 },
        'move_right',
        0.5,
        { position: 2 }
      );
      
      expect(result).toBeDefined();
      expect(result.updated).toBeDefined();
      if (result.newQValue !== undefined) {
        expect(typeof result.newQValue).toBe('number');
      }
    });
    
    test('should support multi-task learning', async () => {
      const tasks = [
        { id: 'task-1', outputSize: 10 },
        { id: 'task-2', outputSize: 5 }
      ];
      
      const result = await adaptiveService.multiTaskLearning('agent-1', tasks);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
  
  describe('Integration Tests', () => {
    test('should integrate data collection with training', async () => {
      const dataService = new DataCollectionService();
      const trainingService = new ModelTrainingService();
      
      // Collect data
      for (let i = 0; i < 10; i++) {
        await dataService.collectInteraction({
          agentId: 'agent-1',
          taskType: 'test',
          input: i,
          output: i * 2
        });
      }
      
      // Export for training
      const trainingData = await dataService.exportForTraining();
      
      expect(trainingData).toBeDefined();
      
      // Train model with collected data
      if (trainingData && trainingData.data.interactions) {
        const result = await trainingService.trainModel({
          data: trainingData.data.interactions,
          modelType: 'test',
          modelConfig: {}
        });
        
        expect(result).toBeDefined();
      }
    });
    
    test('should integrate ML system with adaptive service', async () => {
      const mlSystem = new MLLearningSystem();
      const adaptiveService = new AdaptiveTransferService();
      
      // Learn from interactions
      await mlSystem.learnFromInteraction({
        agentId: 'agent-1',
        taskType: 'test',
        input: 'test',
        actions: ['action1'],
        output: 'result',
        feedback: { score: 0.9 },
        performance: { score: 0.85 }
      });
      
      // Get insights
      const insights = await mlSystem.getLearningInsights('agent-1');
      
      // Adapt based on insights
      if (insights) {
        const result = await adaptiveService.adaptBehavior('agent-1', {
          recentPerformance: insights.performance?.average || 0.5,
          isNewEnvironment: false,
          errorRate: 0.05
        });
        
        expect(result).toBeDefined();
      }
    });
    
    test('should integrate human learning with personalization', async () => {
      const humanModule = new HumanLearningModule();
      
      // Capture preferences
      await humanModule.capturePreferences(
        { content: 'I prefer detailed explanations' },
        { sessionId: 's1', projectPath: '/test', agentId: 'a1' }
      );
      
      // Learn from feedback
      const learnResult = await humanModule.learn(
        { content: 'Good, but be more concise' },
        { sessionId: 's1' }
      );
      
      expect(learnResult).toBeDefined();
      
      // Get personalized response
      const personalization = await humanModule.personalizeResponses();
      
      expect(personalization).toBeDefined();
      expect(personalization.communicationStyle).toBeDefined();
    });
  });
  
  describe('Performance Tests', () => {
    test('should handle large data volumes', async () => {
      const dataService = new DataCollectionService();
      
      const startTime = Date.now();
      
      // Collect 1000 data points
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(dataService.collectInteraction({
          agentId: `agent-${i % 10}`,
          taskType: 'performance-test',
          input: i,
          output: i * 2
        }));
      }
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete in 5 seconds
      
      const stats = dataService.getStatistics();
      expect(stats.totalCollected).toBeGreaterThanOrEqual(1000);
    });
    
    test('should handle concurrent training jobs', async () => {
      const trainingService = new ModelTrainingService();
      
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        jobs.push(trainingService.trainModel({
          data: Array(50).fill({ input: 1, target: 0 }),
          modelType: `test-${i}`,
          modelConfig: {}
        }));
      }
      
      const results = await Promise.all(jobs);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.jobId).toBeDefined();
      });
    });
  });
});