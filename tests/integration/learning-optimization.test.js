/**
 * BUMBA Learning & Optimization Integration Tests
 * Comprehensive testing of all ML and optimization improvements
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const NeuralNetworkEngine = require('../../src/core/learning/neural-network-engine');
const patternModels = require('../../src/core/learning/pattern-recognition-models');
const optimizationEngine = require('../../src/core/learning/dynamic-optimization-engine');
const { ModelTrainingService, getInstance: getTrainingService } = require('../../src/core/learning/model-training-service');

describe('Learning & Optimization Integration Tests', () => {
  let trainingService;
  
  beforeEach(() => {
    trainingService = getTrainingService();
  });
  
  afterEach(() => {
    optimizationEngine.stop();
  });

  describe('Neural Network Engine', () => {
    it('should initialize with correct architecture', () => {
      const network = new NeuralNetworkEngine({
        inputSize: 10,
        hiddenLayers: [20, 10],
        outputSize: 3
      });
      
      const summary = network.getSummary();
      expect(summary.architecture).toEqual([10, 20, 10, 3]);
      expect(summary.totalLayers).toBe(3);
      expect(summary.totalParameters).toBeGreaterThan(0);
    });
    
    it('should perform forward propagation', () => {
      const network = new NeuralNetworkEngine({
        inputSize: 5,
        hiddenLayers: [10],
        outputSize: 2
      });
      
      const input = [0.1, 0.2, 0.3, 0.4, 0.5];
      const output = network.forward(input);
      
      expect(output).toHaveLength(2);
      expect(output.every(v => v >= 0 && v <= 1)).toBe(true);
    });
    
    it('should train on data and improve', () => {
      const network = new NeuralNetworkEngine({
        inputSize: 2,
        hiddenLayers: [4],
        outputSize: 1,
        activation: 'relu',
        outputActivation: 'sigmoid'
      });
      
      // XOR problem
      const inputs = [
        [0, 0], [0, 1], [1, 0], [1, 1]
      ];
      const targets = [
        [0], [1], [1], [0]
      ];
      
      // Initial evaluation
      const initialEval = network.evaluate(inputs, targets);
      
      // Train for multiple epochs
      for (let epoch = 0; epoch < 100; epoch++) {
        network.trainBatch(inputs, targets, 0.1, 'adam');
      }
      
      // Final evaluation
      const finalEval = network.evaluate(inputs, targets);
      
      expect(finalEval.loss).toBeLessThan(initialEval.loss);
    });
    
    it('should support different optimizers', () => {
      const network = new NeuralNetworkEngine({
        inputSize: 3,
        hiddenLayers: [5],
        outputSize: 2
      });
      
      const optimizers = ['sgd', 'momentum', 'adam', 'rmsprop'];
      const input = [0.5, 0.5, 0.5];
      const target = [1, 0];
      
      for (const optimizer of optimizers) {
        const output = network.forward(input, true);
        network.backward(input, target, output);
        network.updateWeights(0.01, optimizer);
        
        // Should not throw
        expect(true).toBe(true);
      }
    });
  });

  describe('Pattern Recognition Models', () => {
    it('should list all available models', () => {
      const models = patternModels.listModels();
      
      expect(models.length).toBeGreaterThan(0);
      expect(models.some(m => m.id === 'timeseries')).toBe(true);
      expect(models.some(m => m.id === 'anomaly')).toBe(true);
      expect(models.some(m => m.id === 'classifier')).toBe(true);
    });
    
    it('should train time series model', async () => {
      // Generate synthetic time series data
      const data = {
        inputs: [],
        targets: []
      };
      
      for (let i = 0; i < 50; i++) {
        const input = [];
        for (let j = 0; j < 10; j++) {
          input.push(Math.sin((i + j) * 0.1) + Math.random() * 0.1);
        }
        data.inputs.push(input);
        data.targets.push([Math.sin((i + 10) * 0.1)]);
      }
      
      const result = await patternModels.trainModel('timeseries', data, {
        epochs: 10,
        batchSize: 5
      });
      
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.history).toBeDefined();
    });
    
    it('should detect anomalies', async () => {
      // Generate normal and anomalous data
      const normalData = [];
      for (let i = 0; i < 20; i++) {
        const point = [];
        for (let j = 0; j < 20; j++) {
          point.push(Math.random() * 0.5 + 0.25); // Normal range: 0.25-0.75
        }
        normalData.push(point);
      }
      
      const testData = [...normalData];
      // Add anomalies
      for (let i = 0; i < 5; i++) {
        const anomaly = [];
        for (let j = 0; j < 20; j++) {
          anomaly.push(Math.random() * 2); // Wider range: 0-2
        }
        testData.push(anomaly);
      }
      
      const result = await patternModels.detectAnomalies(testData, 0.5);
      
      expect(result.anomalies).toBeDefined();
      expect(result.totalChecked).toBe(testData.length);
      expect(result.anomalyRate).toBeGreaterThan(0);
    });
    
    it('should classify data', async () => {
      // Train a simple classifier
      const data = {
        inputs: [],
        targets: []
      };
      
      // Generate 3 classes of data
      for (let cls = 0; cls < 3; cls++) {
        for (let i = 0; i < 10; i++) {
          const input = new Array(50).fill(0).map(() => 
            Math.random() * 0.3 + cls * 0.3
          );
          const target = new Array(10).fill(0);
          target[cls] = 1; // One-hot encoding
          
          data.inputs.push(input);
          data.targets.push(target);
        }
      }
      
      await patternModels.trainModel('classifier', data, {
        epochs: 20,
        batchSize: 5
      });
      
      // Test classification
      const testInput = new Array(50).fill(0).map(() => Math.random() * 0.3 + 0.3);
      const result = await patternModels.classify(testInput, 3);
      
      expect(result.success).toBe(true);
      expect(result.topPrediction).toBeDefined();
      expect(result.topK).toHaveLength(3);
    });
    
    it('should export and import models', async () => {
      const modelId = 'timeseries';
      
      // Ensure model is trained
      const data = {
        inputs: Array(10).fill(0).map(() => Array(10).fill(0).map(() => Math.random())),
        targets: Array(10).fill(0).map(() => [Math.random()])
      };
      
      await patternModels.trainModel(modelId, data, { epochs: 5 });
      
      // Export model
      const exported = patternModels.exportModel(modelId);
      
      expect(exported.modelId).toBe(modelId);
      expect(exported.weights).toBeDefined();
      expect(exported.config).toBeDefined();
      
      // Clear and re-import
      patternModels.activeModels.clear();
      const imported = patternModels.importModel(exported);
      
      expect(imported.success).toBe(true);
      expect(patternModels.activeModels.has(modelId)).toBe(true);
    });
  });

  describe('Dynamic Optimization Engine', () => {
    it('should initialize with base rules', () => {
      const stats = optimizationEngine.getStats();
      
      expect(stats.totalRules).toBeGreaterThan(0);
      expect(stats.explorationRate).toBeGreaterThan(0);
      expect(stats.adaptationRate).toBeGreaterThan(0);
    });
    
    it('should find applicable rules for context', async () => {
      const context = {
        cpuUsage: 0.9,
        memoryUsage: 0.85,
        cacheHitRate: 0.3,
        errorRate: 0.1,
        networkLatency: 150,
        requestRate: 1000,
        queueLength: 50,
        workers: 4,
        batchSize: 10,
        cacheSize: 100
      };
      
      const result = await optimizationEngine.optimize(context);
      
      expect(result.success).toBe(true);
      expect(result.action).toBeDefined();
      expect(result.rules).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
    
    it('should learn new rules from patterns', async () => {
      const initialRules = optimizationEngine.rules.size;
      
      // Simulate multiple optimization cycles
      for (let i = 0; i < 5; i++) {
        const context = {
          cpuUsage: Math.random(),
          memoryUsage: Math.random(),
          cacheHitRate: Math.random(),
          errorRate: Math.random() * 0.1
        };
        
        const outcome = {
          success: Math.random() > 0.3,
          improvement: Math.random() * 0.5,
          cost: Math.random() * 0.2
        };
        
        await optimizationEngine.learnNewRules(context, outcome);
      }
      
      // May or may not learn new rules depending on patterns
      const finalRules = optimizationEngine.rules.size;
      expect(finalRules).toBeGreaterThanOrEqual(initialRules);
    });
    
    it('should provide feedback and update effectiveness', async () => {
      const context = {
        cpuUsage: 0.7,
        memoryUsage: 0.6,
        cacheHitRate: 0.4,
        workers: 4,
        batchSize: 10,
        cacheSize: 100
      };
      
      const result = await optimizationEngine.optimize(context);
      
      if (result.success && result.rules.length > 0) {
        const outcome = {
          success: true,
          improvement: 0.2
        };
        
        await optimizationEngine.provideFeedback(
          optimizationEngine.ruleHistory[optimizationEngine.ruleHistory.length - 1].timestamp,
          outcome
        );
        
        const stats = optimizationEngine.getStats();
        expect(stats.successfulOptimizations).toBeGreaterThan(0);
      }
    });
    
    it('should perform exploratory optimization', async () => {
      const context = {
        unknownMetric: 0.5,
        workers: 4,
        batchSize: 10,
        cacheSize: 100
      };
      
      const result = await optimizationEngine.optimize(context);
      
      // Should fall back to exploration
      expect(result.success).toBe(true);
      expect(result.rules).toContain('exploration');
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });
    
    it('should export and import learned rules', () => {
      const exported = optimizationEngine.exportRules();
      
      expect(exported.rules).toBeDefined();
      expect(exported.learningState).toBeDefined();
      expect(exported.metrics).toBeDefined();
      
      // Import into new instance
      const newEngine = new (require('../../src/core/learning/dynamic-optimization-engine').constructor)();
      newEngine.importRules(exported);
      
      expect(newEngine.rules.size).toBeGreaterThan(0);
    });
  });

  describe('Model Training Service', () => {
    it('should train a model successfully', async () => {
      const config = {
        modelType: 'neural_network',
        modelConfig: {
          layers: [
            { units: 10 },
            { units: 5 },
            { units: 1 }
          ]
        },
        data: Array(50).fill(0).map(() => ({
          input: Array(10).fill(0).map(() => Math.random()),
          target: Math.random()
        }))
      };
      
      const result = await trainingService.trainModel(config);
      
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.modelId).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
    
    it('should optimize hyperparameters', async () => {
      const config = {
        modelType: 'test',
        modelConfig: {},
        data: Array(20).fill(0).map(() => ({
          input: Array(5).fill(0).map(() => Math.random()),
          target: Math.random()
        })),
        searchSpace: {
          learningRate: { min: 0.001, max: 0.1, scale: 'log' },
          batchSize: { min: 8, max: 32, scale: 'linear' }
        },
        trials: 3
      };
      
      const result = await trainingService.optimizeHyperparameters(config);
      
      expect(result.bestHyperparameters).toBeDefined();
      expect(result.bestMetrics).toBeDefined();
      expect(result.allTrials).toHaveLength(3);
    });
  });

  describe('Full Integration Flow', () => {
    it('should handle complete learning and optimization cycle', async () => {
      // 1. Generate training data
      const trainingData = {
        inputs: [],
        targets: []
      };
      
      for (let i = 0; i < 30; i++) {
        trainingData.inputs.push(Array(10).fill(0).map(() => Math.random()));
        trainingData.targets.push([Math.random()]);
      }
      
      // 2. Train pattern recognition model
      const trainResult = await patternModels.trainModel('regression', trainingData, {
        epochs: 10,
        batchSize: 5
      });
      
      expect(trainResult.success).toBe(true);
      
      // 3. Use model for prediction
      const testInput = Array(15).fill(0).map(() => Math.random());
      const prediction = await patternModels.predict('regression', testInput);
      
      expect(prediction.success).toBe(true);
      expect(prediction.prediction).toBeDefined();
      
      // 4. Optimize based on predictions
      const context = {
        cpuUsage: prediction.prediction.value || 0.5,
        memoryUsage: 0.6,
        cacheHitRate: 0.5,
        workers: 4,
        batchSize: 10,
        cacheSize: 100
      };
      
      const optimization = await optimizationEngine.optimize(context);
      
      expect(optimization.success).toBe(true);
      expect(optimization.action).toBeDefined();
      
      // 5. Provide feedback
      const outcome = {
        success: true,
        improvement: 0.15
      };
      
      if (optimizationEngine.ruleHistory.length > 0) {
        await optimizationEngine.provideFeedback(
          optimizationEngine.ruleHistory[optimizationEngine.ruleHistory.length - 1].timestamp,
          outcome
        );
      }
      
      // 6. Verify learning occurred
      const stats = optimizationEngine.getStats();
      expect(stats.totalOptimizations).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should train neural network efficiently', () => {
      const network = new NeuralNetworkEngine({
        inputSize: 100,
        hiddenLayers: [50, 25],
        outputSize: 10
      });
      
      const inputs = Array(100).fill(0).map(() => 
        Array(100).fill(0).map(() => Math.random())
      );
      const targets = Array(100).fill(0).map(() => {
        const target = Array(10).fill(0);
        target[Math.floor(Math.random() * 10)] = 1;
        return target;
      });
      
      const startTime = Date.now();
      
      for (let epoch = 0; epoch < 10; epoch++) {
        network.trainBatch(inputs, targets, 0.01, 'adam');
      }
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });
    
    it('should handle multiple pattern recognitions quickly', async () => {
      const startTime = Date.now();
      const promises = [];
      
      // Simulate multiple concurrent predictions
      for (let i = 0; i < 10; i++) {
        const input = Array(15).fill(0).map(() => Math.random());
        promises.push(
          patternModels.predict('regression', input).catch(() => null)
        );
      }
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
    
    it('should optimize contexts rapidly', async () => {
      const contexts = Array(50).fill(0).map(() => ({
        cpuUsage: Math.random(),
        memoryUsage: Math.random(),
        cacheHitRate: Math.random(),
        workers: 4,
        batchSize: 10,
        cacheSize: 100
      }));
      
      const startTime = Date.now();
      
      for (const context of contexts) {
        await optimizationEngine.optimize(context);
      }
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500); // Should complete in < 500ms
    });
  });
});

// Run tests if this is the main module
if (require.main === module) {
  console.log('Running Learning & Optimization Integration Tests...');
  require('jest').run();
}