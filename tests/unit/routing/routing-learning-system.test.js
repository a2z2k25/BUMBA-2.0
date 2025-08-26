/**
 * Routing Learning System Tests
 * Tests the learning and memory capabilities for routing
 */

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { RoutingLearningSystem } = require('../../../src/core/routing/routing-learning-system');

describe('Routing Learning System', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let learningSystem;
  
  beforeEach(() => {
    learningSystem = new RoutingLearningSystem({
      persistenceEnabled: false // Disable persistence for tests
    });
  });
  
  describe('Pattern Generation', () => {
    test('should generate consistent patterns', async () => {
      const pattern1 = learningSystem.generatePattern('implement', ['user authentication']);
      const pattern2 = learningSystem.generatePattern('implement', ['user authentication']);
      
      expect(pattern1).toBe(pattern2);
      expect(pattern1).toContain('implement');
    });
    
    test('should normalize argument types', async () => {
      const pattern = learningSystem.generatePattern('build', ['api', 'database']);
      
      expect(pattern).toBe('build:[api],[database]');
    });
    
    test('should handle different argument types', async () => {
      const pattern = learningSystem.generatePattern('analyze', [123, true, 'text']);
      
      expect(pattern).toContain('[number]');
      expect(pattern).toContain('[boolean]');
      expect(pattern).toContain('[string]');
    });
  });
  
  describe('Learning from Routing', () => {
    test('should learn from successful routing', async () => {
      const routingPlan = {
        command: 'implement',
        args: ['authentication'],
        execution: {
          agents: [
            { name: 'backend-engineer-manager', model: 'claude-max' },
            { name: 'security-specialist', model: 'deepseek' }
          ]
        },
        routing: {
          confidence: 0.9,
          source: 'analysis'
        }
      };
      
      const result = {
        success: true,
        metrics: { executionTime: 1000 }
      };
      
      await learningSystem.learnFromRouting('implement', ['authentication'], routingPlan, result);
      
      // Check memory was stored
      const pattern = learningSystem.generatePattern('implement', ['authentication']);
      expect(learningSystem.routingMemory.has(pattern)).toBe(true);
      
      // Check statistics updated
      const stats = learningSystem.getStatistics();
      expect(stats.totalLearnings).toBe(1);
      expect(stats.successfulRoutings).toBe(1);
      expect(stats.failedRoutings).toBe(0);
    });
    
    test('should learn from failed routing', async () => {
      const routingPlan = {
        execution: {
          agents: [{ name: 'test-agent', model: 'gemini' }]
        },
        routing: {
          confidence: 0.5,
          source: 'fallback'
        }
      };
      
      const result = {
        success: false,
        error: 'timeout'
      };
      
      await learningSystem.learnFromRouting('test', ['fail'], routingPlan, result);
      
      const stats = learningSystem.getStatistics();
      expect(stats.failedRoutings).toBe(1);
    });
  });
  
  describe('Retrieving Learned Routing', () => {
    beforeEach(async () => {
      // Add some learned routings
      const successfulPlan = {
        execution: {
          agents: [
            { name: 'backend-engineer-manager', model: 'claude-max' },
            { name: 'database-specialist', model: 'qwen' }
          ]
        },
        routing: { confidence: 0.95, source: 'analysis' }
      };
      
      await learningSystem.learnFromRouting(
        'implement', 
        ['database'], 
        successfulPlan, 
        { success: true }
      );
    });
    
    test('should retrieve exact match', async () => {
      const learned = learningSystem.getLearnedRouting('implement', ['database']);
      
      expect(learned.found).toBe(true);
      expect(learned.source).toBe('learned-exact');
      expect(learned.routing.agents).toHaveLength(2);
    });
    
    test('should not retrieve with different command', async () => {
      const learned = learningSystem.getLearnedRouting('analyze', ['database']);
      
      expect(learned.found).toBe(false);
    });
    
    test('should find similar patterns', async () => {
      // Add another similar pattern
      const plan = {
        execution: {
          agents: [{ name: 'backend-engineer-manager', model: 'claude-max' }]
        },
        routing: { confidence: 0.9, source: 'analysis' }
      };
      
      learningSystem.learnFromRouting('build', ['api'], plan, { success: true });
      
      // Check similarity detection
      const similar = learningSystem.findSimilarPatterns('build:[api]');
      expect(similar.length).toBeGreaterThan(0);
    });
  });
  
  describe('Recommendations', () => {
    beforeEach(async () => {
      // Add learning history
      const plan1 = {
        execution: {
          agents: [
            { name: 'security-specialist', model: 'deepseek' },
            { name: 'backend-engineer-manager', model: 'claude-max' }
          ]
        },
        routing: { confidence: 0.9, source: 'analysis' }
      };
      
      // Add multiple successful routings
      for (let i = 0; i < 3; i++) {
        await learningSystem.learnFromRouting(
          'secure',
          ['api'],
          plan1,
          { success: true, metrics: { executionTime: 1000 } }
        );
      }
      
      // Add a failure
      await learningSystem.learnFromRouting(
        'secure',
        ['api'],
        plan1,
        { success: false, error: 'timeout' }
      );
    });
    
    test('should provide agent recommendations', async () => {
      const recs = learningSystem.getRecommendations('secure', ['api'], { confidence: 0.8 });
      
      const agentRec = recs.find(r => r.type === 'agents');
      expect(agentRec).toBeDefined();
      expect(agentRec.message).toContain('security-specialist');
    });
    
    test('should warn about failures', async () => {
      const recs = learningSystem.getRecommendations('secure', ['api'], { confidence: 0.8 });
      
      const warning = recs.find(r => r.type === 'warning');
      expect(warning).toBeDefined();
      expect(warning.message).toContain('failed');
    });
    
    test('should suggest for low confidence', async () => {
      const recs = learningSystem.getRecommendations('unknown', [], { confidence: 0.3 });
      
      const suggestion = recs.find(r => r.type === 'suggestion');
      expect(suggestion).toBeDefined();
      expect(suggestion.message).toContain('Low confidence');
    });
  });
  
  describe('Model Performance Tracking', () => {
    test('should track model performance', async () => {
      const plan = {
        execution: {
          agents: [
            { name: 'manager', model: 'claude-max' },
            { name: 'specialist', model: 'deepseek' }
          ]
        },
        routing: { confidence: 0.9, source: 'analysis' }
      };
      
      // Record success for claude-max and deepseek
      await learningSystem.learnFromRouting('test', [], plan, { success: true });
      
      // Record failure for gemini
      const plan2 = {
        execution: {
          agents: [{ name: 'agent', model: 'gemini' }]
        },
        routing: { confidence: 0.7, source: 'analysis' }
      };
      await learningSystem.learnFromRouting('test2', [], plan2, { success: false });
      
      const stats = learningSystem.getStatistics();
      
      expect(stats.modelPerformance['claude-max'].success).toBe(1);
      expect(stats.modelPerformance['claude-max'].total).toBe(1);
      expect(stats.modelPerformance['deepseek'].success).toBe(1);
      expect(stats.modelPerformance['gemini'].success).toBe(0);
      expect(stats.modelPerformance['gemini'].total).toBe(1);
    });
    
    test('should calculate model success rates', async () => {
      // Manually set performance data
      learningSystem.stats.modelPerformance = {
        'claude-max': { success: 9, total: 10 },
        'deepseek': { success: 8, total: 10 },
        'qwen': { success: 7, total: 10 },
        'gemini': { success: 5, total: 10 }
      };
      
      const stats = learningSystem.getStatistics();
      
      expect(stats.modelSuccessRates['claude-max']).toBe('90.0%');
      expect(stats.modelSuccessRates['deepseek']).toBe('80.0%');
      expect(stats.modelSuccessRates['qwen']).toBe('70.0%');
      expect(stats.modelSuccessRates['gemini']).toBe('50.0%');
    });
  });
  
  describe('Memory Management', () => {
    test('should limit memory per pattern', async () => {
      const plan = {
        execution: { agents: [] },
        routing: { confidence: 0.8, source: 'test' }
      };
      
      // Add more than 10 memories for same pattern
      for (let i = 0; i < 15; i++) {
        await learningSystem.learnFromRouting('test', ['same'], plan, { success: true });
      }
      
      const pattern = learningSystem.generatePattern('test', ['same']);
      const memories = learningSystem.routingMemory.get(pattern);
      
      // Should be limited to 10
      expect(memories.length).toBe(10);
    });
    
    test('should clear memory', async () => {
      // Add some data
      learningSystem.routingMemory.set('test', []);
      learningSystem.feedbackMemory.set('feedback', {});
      learningSystem.stats.totalLearnings = 5;
      
      // Clear
      learningSystem.clearMemory();
      
      expect(learningSystem.routingMemory.size).toBe(0);
      expect(learningSystem.feedbackMemory.size).toBe(0);
      expect(learningSystem.stats.totalLearnings).toBe(0);
    });
  });
  
  describe('Similarity Detection', () => {
    test('should detect similar commands', async () => {
      expect(learningSystem.areSimilarCommands('implement', 'build')).toBe(true);
      expect(learningSystem.areSimilarCommands('implement', 'create')).toBe(true);
      expect(learningSystem.areSimilarCommands('analyze', 'review')).toBe(true);
      expect(learningSystem.areSimilarCommands('implement', 'analyze')).toBe(false);
    });
    
    test('should calculate pattern similarity', async () => {
      const sim1 = learningSystem.calculateSimilarity(
        'implement:[api],[database]',
        'implement:[api],[database]'
      );
      expect(sim1).toBe(1);
      
      const sim2 = learningSystem.calculateSimilarity(
        'implement:[api]',
        'implement:[database]'
      );
      expect(sim2).toBeLessThan(1);
      expect(sim2).toBeGreaterThan(0);
      
      const sim3 = learningSystem.calculateSimilarity(
        'implement:[api]',
        'analyze:[database]'
      );
      expect(sim3).toBeLessThan(sim2);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=routing-learning-system\\.test\\.js']);
}