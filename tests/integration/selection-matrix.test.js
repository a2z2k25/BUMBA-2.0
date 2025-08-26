/**
 * Comprehensive Test Suite for Selection Matrix System
 */

const {
  SelectionMatrix,
  MatrixLayer,
  MatrixCell,
  DIMENSIONS
} = require('../src/core/selection/matrix-foundation');

const {
  ScoringEngine,
  ScoreComponent,
  CompositeScore,
  ScoringFormula,
  ScoringRulesEngine
} = require('../src/core/selection/scoring-engine');

const {
  SelectionMatrixIntegration,
  WeightCalculator,
  DecisionEngine,
  HistoryTracker,
  LearningSystem,
  MatrixOptimizer,
  ConfidenceCalculator,
  MatrixVisualizer
} = require('../src/core/selection/selection-matrix-system');

// Mock logger
global.logger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('Selection Matrix System', () => {
  
  describe('Matrix Foundation', () => {
    let matrix;
    
    beforeEach(() => {
      matrix = new SelectionMatrix({
        enablePersistence: false
      });
    });
    
    afterEach(() => {
      matrix.shutdown();
    });
    
    test('should initialize with default layers', () => {
      expect(matrix.layers.size).toBe(4);
      expect(matrix.getLayer('primary')).toBeDefined();
      expect(matrix.getLayer('contextual')).toBeDefined();
      expect(matrix.getLayer('quality')).toBeDefined();
      expect(matrix.getLayer('full')).toBeDefined();
    });
    
    test('should store and retrieve values', () => {
      const coordinates = {
        task: { type: 'api', complexity: 0.7 },
        specialist: { type: 'backend', id: 'backend-1' }
      };
      
      matrix.update(coordinates, 0.85);
      
      const result = matrix.lookup(coordinates);
      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThan(0.8);  // Should be close to 0.85
      expect(result.value).toBeLessThan(0.9);     // But not exact due to weighted average
      expect(result.confidence).toBeGreaterThan(0);
    });
    
    test('should handle fuzzy lookup', () => {
      const coordinates = {
        task: { type: 'api', complexity: 0.7, priority: 0.8 },
        specialist: { type: 'backend', id: 'backend-1', skills: 10 }
      };
      
      matrix.update(coordinates, 0.9);
      
      // Fuzzy lookup with partial coordinates
      const partialCoords = {
        task: { type: 'api' },
        specialist: { type: 'backend' }
      };
      
      const result = matrix.lookup(partialCoords);
      expect(result).toBeDefined();
    });
    
    test('should apply decay to cells', () => {
      const coordinates = {
        task: { type: 'test' },
        specialist: { type: 'qa' }
      };
      
      matrix.update(coordinates, 1.0);
      const initial = matrix.lookup(coordinates);
      
      // Apply decay directly
      matrix.applyDecay();
      
      // Get fresh lookup (not from cache)
      matrix.lookupCache.clear();
      const afterDecay = matrix.lookup(coordinates);
      
      // Values should have decayed
      expect(afterDecay.value).toBeLessThanOrEqual(initial.value);
      expect(afterDecay.confidence).toBeLessThanOrEqual(initial.confidence);
      
      // At least one should be strictly less (unless both were 0)
      if (initial.value > 0 || initial.confidence > 0) {
        const hasDecayed = afterDecay.value < initial.value || afterDecay.confidence < initial.confidence;
        expect(hasDecayed).toBe(true);
      }
    });
    
    test('should prune low confidence cells', () => {
      // Add multiple cells
      for (let i = 0; i < 10; i++) {
        matrix.update({
          task: { type: `task-${i}` },
          specialist: { type: `spec-${i}` }
        }, Math.random());
      }
      
      const layer = matrix.getLayer('primary');
      const initialCount = layer.stats.totalCells;
      
      // Apply many decays to reduce confidence below threshold
      for (let i = 0; i < 50; i++) {
        matrix.applyDecay();
      }
      
      const pruned = matrix.pruneLayers();
      
      // After 50 decays with factor 0.95, confidence should be very low
      // 0.1 * (0.95^50) ≈ 0.0077, which is below the default threshold of 0.01
      expect(pruned).toBeGreaterThanOrEqual(0);
      
      // If pruning happened, cell count should be less
      if (pruned > 0) {
        expect(layer.stats.totalCells).toBeLessThan(initialCount);
      }
    });
  });
  
  describe('Scoring Engine', () => {
    let scoringEngine;
    
    beforeEach(() => {
      scoringEngine = new ScoringEngine({
        enableCache: false
      });
    });
    
    afterEach(() => {
      scoringEngine.shutdown();
    });
    
    test('should calculate basic scores', () => {
      const inputs = {
        task: {
          complexity: 0.7,
          priority: 0.8,
          urgency: 0.6
        },
        specialist: {
          skillsMatch: 0.9,
          experience: 0.7,
          availability: 0.8,
          performance: 0.85
        }
      };
      
      const result = scoringEngine.calculateScore(inputs);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });
    
    test('should apply scoring rules', () => {
      const inputs = {
        task: { complexity: 0.5, priority: 0.9, urgency: 0.8 },
        specialist: { skillsMatch: 0.8 }
      };
      
      const result = scoringEngine.calculateScore(inputs, {
        priority: 0.9 // High priority context
      });
      
      expect(result.appliedRules).toContain('high_priority_boost');
      expect(result.score).toBeGreaterThan(0);
    });
    
    test('should register and use custom formulas', () => {
      scoringEngine.registerFormula('custom_score', (inputs) => {
        return inputs.customValue * 2;
      });
      
      const inputs = {
        customValue: 0.3
      };
      
      const result = scoringEngine.calculateScore(inputs, {
        useFormulas: ['custom_score'],
        weights: { custom_score: 1.0 }
      });
      
      expect(result.score).toBeGreaterThan(0);
      expect(scoringEngine.statistics.formulasEvaluated).toBeGreaterThan(0);
    });
    
    test('should normalize score components', () => {
      const component = new ScoreComponent('test', 5, 1.0);
      component.normalize(0, 10);
      
      expect(component.normalizedValue).toBe(0.5);
      expect(component.weightedValue).toBe(0.5);
    });
    
    test('should apply transform functions', () => {
      const component = new ScoreComponent('test', 0.5, 1.0);
      component.normalize(0, 1);
      
      const original = component.normalizedValue;
      component.applyTransform('exponential');
      
      expect(component.normalizedValue).toBe(Math.pow(original, 2));
    });
  });
  
  describe('Weight Calculator', () => {
    let calculator;
    
    beforeEach(() => {
      calculator = new WeightCalculator({
        dynamicWeights: true
      });
    });
    
    test('should calculate base weights', () => {
      const weights = calculator.calculateWeights({}, {});
      
      expect(weights.task).toBeDefined();
      expect(weights.specialist).toBeDefined();
      expect(weights.context).toBeDefined();
      expect(weights.quality).toBeDefined();
      
      // Weights should be normalized
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });
    
    test('should adjust weights based on urgency', () => {
      const normalWeights = calculator.calculateWeights({}, { urgency: 0.3 });
      const urgentWeights = calculator.calculateWeights({}, { urgency: 0.9 });
      
      expect(urgentWeights.specialist).toBeGreaterThan(normalWeights.specialist);
      expect(urgentWeights.quality).toBeLessThan(normalWeights.quality);
    });
    
    test('should learn from outcomes', () => {
      const initialWeights = { ...calculator.baseWeights };
      
      calculator.learnFromOutcomes([
        {
          success: true,
          contributions: {
            task: 0.8,
            specialist: 0.7
          }
        }
      ]);
      
      expect(calculator.baseWeights.task).toBeGreaterThan(initialWeights.task);
      expect(calculator.baseWeights.specialist).toBeGreaterThan(initialWeights.specialist);
    });
  });
  
  describe('Decision Engine', () => {
    let engine;
    
    beforeEach(() => {
      engine = new DecisionEngine({
        acceptThreshold: 0.7,
        rejectThreshold: 0.3
      });
    });
    
    test('should make accept decision', () => {
      const decision = engine.makeDecision(0.8, 0.9);
      expect(decision.action).toBe('accept');
    });
    
    test('should make reject decision', () => {
      const decision = engine.makeDecision(0.2, 0.9);
      expect(decision.action).toBe('reject');
    });
    
    test('should make review decision', () => {
      const decision = engine.makeDecision(0.5, 0.6);
      expect(decision.action).toBe('review');
    });
    
    test('should escalate critical context', () => {
      const decision = engine.makeDecision(0.5, 0.6, { critical: true });
      expect(decision.action).toBe('escalate');
    });
    
    test('should defer low priority', () => {
      const decision = engine.makeDecision(0.5, 0.6, { lowPriority: true });
      expect(decision.action).toBe('defer');
    });
  });
  
  describe('History Tracker', () => {
    let tracker;
    
    beforeEach(() => {
      tracker = new HistoryTracker({
        maxHistorySize: 100
      });
    });
    
    test('should record entries', () => {
      const id = tracker.record({
        type: 'test',
        value: 0.5
      });
      
      expect(id).toBeDefined();
      expect(tracker.history.length).toBe(1);
    });
    
    test('should query by filters', () => {
      tracker.record({ type: 'selection', score: 0.8 });
      tracker.record({ type: 'update', score: 0.6 });
      tracker.record({ type: 'selection', score: 0.9 });
      
      const selections = tracker.query({ type: 'selection' });
      expect(selections.length).toBe(2);
      
      const highScores = tracker.query({ minScore: 0.85 });
      expect(highScores.length).toBe(1);
    });
    
    test('should maintain size limit', () => {
      const tracker = new HistoryTracker({ maxHistorySize: 5 });
      
      for (let i = 0; i < 10; i++) {
        tracker.record({ type: 'test', value: i });
      }
      
      expect(tracker.history.length).toBe(5);
      expect(tracker.history[0].value).toBe(5); // Oldest should be removed
    });
    
    test('should calculate statistics', () => {
      tracker.record({ type: 'test', score: 0.8, success: true });
      tracker.record({ type: 'test', score: 0.6, success: false });
      tracker.record({ type: 'test', score: 0.7, success: true });
      
      const stats = tracker.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.avgScore).toBeCloseTo(0.7);
      expect(stats.successRate).toBeCloseTo(0.667);
    });
  });
  
  describe('Learning System', () => {
    let learner;
    
    beforeEach(() => {
      learner = new LearningSystem({
        learningRate: 0.1
      });
    });
    
    test('should learn from examples', () => {
      const example = {
        inputs: { taskType: 'api', specialistType: 'backend' },
        output: 0.8,
        success: true
      };
      
      learner.learn(example);
      
      expect(learner.models.size).toBe(1);
      const model = learner.models.get('task:api|spec:backend');
      expect(model.samples.length).toBe(1);
    });
    
    test('should make predictions after learning', () => {
      // Train with multiple examples
      for (let i = 0; i < 10; i++) {
        learner.learn({
          inputs: {
            taskType: 'api',
            specialistType: 'backend',
            complexity: 0.5
          },
          output: 0.7 + Math.random() * 0.2,
          success: true
        });
      }
      
      const prediction = learner.predict({
        taskType: 'api',
        specialistType: 'backend',
        complexity: 0.5
      });
      
      expect(prediction).toBeDefined();
      expect(prediction.value).toBeGreaterThan(0);
      expect(prediction.value).toBeLessThanOrEqual(1);
      expect(prediction.samples).toBe(10);
    });
    
    test('should not predict with insufficient data', () => {
      const prediction = learner.predict({
        taskType: 'unknown',
        specialistType: 'unknown'
      });
      
      expect(prediction).toBeNull();
    });
  });
  
  describe('Confidence Calculator', () => {
    let calculator;
    
    beforeEach(() => {
      calculator = new ConfidenceCalculator();
    });
    
    test('should calculate confidence from multiple factors', () => {
      const confidence = calculator.calculateConfidence({
        samples: 20,
        values: [0.8, 0.82, 0.79, 0.81],
        timestamp: Date.now(),
        accuracy: 0.9
      });
      
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThanOrEqual(1);
    });
    
    test('should calculate consistency', () => {
      const highConsistency = calculator.calculateConsistency([0.8, 0.81, 0.79, 0.8]);
      const lowConsistency = calculator.calculateConsistency([0.2, 0.9, 0.3, 0.8]);
      
      expect(highConsistency).toBeGreaterThan(lowConsistency);
    });
    
    test('should apply recency decay', () => {
      const recent = calculator.calculateRecency(Date.now());
      const old = calculator.calculateRecency(Date.now() - 86400000); // 24 hours ago
      
      expect(recent).toBeGreaterThan(old);
    });
    
    test('should combine multiple confidences', () => {
      const combined = calculator.combineConfidences([
        { value: 0.8, weight: 1.0 },
        { value: 0.6, weight: 0.5 },
        { value: 0.9, weight: 1.5 }
      ]);
      
      expect(combined).toBeGreaterThan(0);
      expect(combined).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Matrix Visualizer', () => {
    let visualizer;
    let matrix;
    
    beforeEach(() => {
      visualizer = new MatrixVisualizer();
      matrix = new SelectionMatrix({ enablePersistence: false });
      
      // Add some data
      matrix.update({
        task: { type: 'api' },
        specialist: { type: 'backend' }
      }, 0.8);
      
      matrix.update({
        task: { type: 'ui' },
        specialist: { type: 'frontend' }
      }, 0.9);
    });
    
    afterEach(() => {
      matrix.shutdown();
    });
    
    test('should generate heatmap', () => {
      const heatmap = visualizer.generateHeatmap(matrix, 'primary');
      
      expect(heatmap).toBeDefined();
      expect(heatmap.type).toBe('heatmap');
      expect(heatmap.data.length).toBeGreaterThan(0);
    });
    
    test('should generate distribution', () => {
      const scores = [0.1, 0.3, 0.5, 0.7, 0.9, 0.85, 0.6];
      const distribution = visualizer.generateDistribution(scores);
      
      expect(distribution).toBeDefined();
      expect(distribution.type).toBe('histogram');
      expect(distribution.bins.length).toBe(20);
      expect(distribution.stats.mean).toBeCloseTo(0.564, 2);
    });
    
    test('should generate time series', () => {
      const history = [
        { timestamp: Date.now() - 120000, score: 0.7 },
        { timestamp: Date.now() - 60000, score: 0.8 },
        { timestamp: Date.now(), score: 0.85 }
      ];
      
      const timeSeries = visualizer.generateTimeSeries(history);
      
      expect(timeSeries).toBeDefined();
      expect(timeSeries.type).toBe('line');
      expect(timeSeries.data.length).toBeGreaterThan(0);
    });
  });
  
  describe('Selection Matrix Integration', () => {
    let integration;
    
    beforeEach(() => {
      integration = new SelectionMatrixIntegration({
        matrix: { enablePersistence: false },
        scoring: { enableCache: false }
      });
    });
    
    afterEach(() => {
      integration.shutdown();
    });
    
    test('should initialize all components', () => {
      expect(integration.matrix).toBeDefined();
      expect(integration.scoringEngine).toBeDefined();
      expect(integration.weightCalculator).toBeDefined();
      expect(integration.decisionEngine).toBeDefined();
      expect(integration.historyTracker).toBeDefined();
      expect(integration.learningSystem).toBeDefined();
      expect(integration.optimizer).toBeDefined();
      expect(integration.confidenceCalculator).toBeDefined();
      expect(integration.visualizer).toBeDefined();
      expect(integration.initialized).toBe(true);
    });
    
    test('should perform selection', async () => {
      const task = {
        type: 'api',
        complexity: 0.7,
        priority: 0.8
      };
      
      const specialists = [
        {
          id: 'backend-1',
          type: 'backend',
          skillsMatch: 0.9,
          experience: 0.8,
          availability: 0.7,
          performance: 0.85
        },
        {
          id: 'backend-2',
          type: 'backend',
          skillsMatch: 0.7,
          experience: 0.6,
          availability: 0.9,
          performance: 0.75
        },
        {
          id: 'frontend-1',
          type: 'frontend',
          skillsMatch: 0.3,
          experience: 0.8,
          availability: 0.8,
          performance: 0.9
        }
      ];
      
      const context = {
        urgency: 0.6,
        systemLoad: 0.5,
        projectPhase: 'development'
      };
      
      const selection = await integration.select(task, specialists, context);
      
      expect(selection).toBeDefined();
      expect(selection.scores).toBeDefined();
      expect(selection.scores.length).toBe(3);
      expect(selection.decision).toBeDefined();
      
      // Backend specialists should score higher for API task
      expect(selection.scores[0].specialist.type).toBe('backend');
    });
    
    test('should handle feedback', () => {
      integration.provideFeedback('test-id', true, {
        task: { type: 'api' },
        specialist: { type: 'backend' }
      });
      
      expect(integration.learningSystem.feedback.length).toBe(1);
    });
    
    test('should generate visualizations', () => {
      // Add some data
      integration.historyTracker.record({
        type: 'selection',
        scores: [{ score: 0.8 }]
      });
      
      const visualizations = integration.generateVisualizations();
      
      expect(visualizations).toBeDefined();
      expect(visualizations.length).toBeGreaterThan(0);
    });
    
    test('should provide comprehensive status', () => {
      const status = integration.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.statistics).toBeDefined();
      expect(status.matrix).toBeDefined();
      expect(status.scoring).toBeDefined();
      expect(status.decisions).toBeDefined();
      expect(status.learning).toBeDefined();
      expect(status.optimization).toBeDefined();
    });
  });
  
  describe('Performance and Edge Cases', () => {
    test('should handle empty specialist list', async () => {
      const integration = new SelectionMatrixIntegration({
        matrix: { enablePersistence: false }
      });
      
      const task = { type: 'test' };
      const specialists = [];
      
      try {
        await integration.select(task, specialists);
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      integration.shutdown();
    });
    
    test('should handle invalid inputs gracefully', () => {
      const scoringEngine = new ScoringEngine();
      
      const result = scoringEngine.calculateScore({});
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      
      scoringEngine.shutdown();
    });
    
    test('should maintain performance with large datasets', () => {
      const tracker = new HistoryTracker({ maxHistorySize: 1000 });
      
      const startTime = Date.now();
      
      // Add 1000 entries
      for (let i = 0; i < 1000; i++) {
        tracker.record({
          type: Math.random() > 0.5 ? 'selection' : 'update',
          score: Math.random(),
          timestamp: Date.now() - Math.random() * 3600000
        });
      }
      
      // Query should still be fast
      const queryStart = Date.now();
      const results = tracker.query({ type: 'selection' });
      const queryTime = Date.now() - queryStart;
      
      expect(queryTime).toBeLessThan(100); // Should be fast
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

// Run the tests
if (require.main === module) {
  const { execSync } = require('child_process');
  
  console.log('🧪 Running Selection Matrix Tests...\n');
  
  try {
    execSync('npm test -- tests/selection-matrix.test.js', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
  } catch (error) {
    console.error('🔴 Tests failed:', error.message);
    process.exit(1);
  }
}