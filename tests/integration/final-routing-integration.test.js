/**
 * Final Routing Integration Test
 * Comprehensive test of the complete routing system
 */

const { CommandRouterIntegration } = require('../../src/core/command-router-integration');
const { RoutingExecutionBridge } = require('../../src/core/execution/routing-execution-bridge');
const { SpecialistSpawner } = require('../../src/core/spawning/specialist-spawner');
const { RoutingLearningSystem } = require('../../src/core/routing/routing-learning-system');
const { RoutingFeedbackSystem } = require('../../src/core/routing/routing-feedback-system');
const { RoutingPerformanceOptimizer } = require('../../src/core/routing/routing-performance-optimizer');
const { RoutingErrorHandler } = require('../../src/core/routing/routing-error-handler');

describe('Final Routing System Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let router;
  let executionBridge;
  let specialistSpawner;
  let learningSystem;
  let feedbackSystem;
  let performanceOptimizer;
  let errorHandler;
  
  beforeEach(() => {
    // Initialize all components
    router = new CommandRouterIntegration();
    executionBridge = new RoutingExecutionBridge();
    specialistSpawner = new SpecialistSpawner();
    learningSystem = new RoutingLearningSystem({ persistenceEnabled: false });
    feedbackSystem = new RoutingFeedbackSystem();
    performanceOptimizer = new RoutingPerformanceOptimizer();
    errorHandler = new RoutingErrorHandler();
  });
  
  describe('Complete Routing Flow', () => {
    test('should route simple command end-to-end', async () => {
      // Route command
      const routingPlan = await router.routeCommand('analyze', ['code quality'], {});
      
      expect(routingPlan).toBeDefined();
      expect(routingPlan.execution.agents.length).toBeGreaterThan(0);
      expect(routingPlan.routing.confidence).toBeGreaterThan(0);
      
      // Verify model assignments
      const managers = routingPlan.execution.agents.filter(a => a.role === 'manager');
      const specialists = routingPlan.execution.agents.filter(a => a.role === 'specialist');
      
      // Manager should have Claude Max
      if (managers.length > 0) {
        expect(managers[0].usingClaudeMax).toBe(true);
      }
      
      // Specialists should have free tier
      for (const specialist of specialists) {
        expect(specialist.usingClaudeMax).toBe(false);
        expect(['deepseek', 'qwen', 'gemini']).toContain(specialist.model);
      }
    });
    
    test('should handle complex multi-domain command', async () => {
      const routingPlan = await router.routeCommand(
        'implement',
        ['e-commerce platform with React frontend, Node.js backend, and PostgreSQL database'],
        {}
      );
      
      // Should identify multiple departments
      expect(routingPlan.analysis.departments.length).toBeGreaterThan(1);
      
      // Should have multiple agents
      expect(routingPlan.execution.agents.length).toBeGreaterThan(2);
      
      // Should require coordination
      if (routingPlan.execution.agents.filter(a => a.role === 'manager').length > 1) {
        expect(routingPlan.execution.requiresCoordination).toBe(true);
      }
      
      // Verify Claude Max exclusivity
      const usingClaudeMax = routingPlan.execution.agents.filter(a => a.usingClaudeMax);
      expect(usingClaudeMax.length).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Learning System Integration', () => {
    test('should learn from successful routing', async () => {
      // Initial routing
      const routingPlan = await router.routeCommand('implement', ['authentication'], {});
      
      // Simulate successful execution
      const result = {
        success: true,
        executionTime: 1000,
        metrics: { agentsUsed: routingPlan.execution.agents.length }
      };
      
      // Record learning
      await learningSystem.learnFromRouting(
        'implement',
        ['authentication'],
        routingPlan,
        result
      );
      
      // Check if learned
      const learned = learningSystem.getLearnedRouting('implement', ['authentication']);
      expect(learned.found).toBe(true);
      expect(learned.routing.agents).toHaveLength(routingPlan.execution.agents.length);
    });
    
    test('should use learned routing for repeated commands', async () => {
      // Learn from first execution
      const firstPlan = await router.routeCommand('build', ['API'], {});
      await learningSystem.learnFromRouting('build', ['API'], firstPlan, { success: true });
      
      // Second execution should check learning
      const learned = learningSystem.getLearnedRouting('build', ['API']);
      expect(learned.found).toBe(true);
      expect(learned.source).toBe('learned-exact');
    });
  });
  
  describe('Feedback System Integration', () => {
    test('should record and process feedback', async () => {
      const feedback = {
        success: true,
        executionTime: 2000,
        agents: [
          { name: 'backend-engineer-manager' },
          { name: 'database-specialist' }
        ],
        models: ['claude-max', 'qwen'],
        confidence: 0.8,
        taskType: 'backend'
      };
      
      await feedbackSystem.recordExecutionFeedback('exec-123', feedback);
      
      // Check agent performance was updated
      const managerPerf = feedbackSystem.getAgentPerformance('backend-engineer-manager');
      expect(managerPerf).toBeDefined();
      expect(managerPerf.totalExecutions).toBe(1);
      
      // Check model quality was updated
      const qwenQuality = feedbackSystem.getModelQuality('qwen');
      expect(qwenQuality).toBeDefined();
      expect(qwenQuality.totalTasks).toBe(1);
    });
    
    test('should generate improvement suggestions', async () => {
      // Record some failures
      for (let i = 0; i < 3; i++) {
        await feedbackSystem.recordExecutionFeedback(`exec-fail-${i}`, {
          success: false,
          executionTime: 35000, // Slow
          agents: [{ name: 'slow-agent' }],
          confidence: 0.4 // Low confidence
        });
      }
      
      const summary = feedbackSystem.getFeedbackSummary();
      expect(summary.metrics.negativeFeedback).toBe(3);
      expect(summary.recommendations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Optimization', () => {
    test('should cache routing decisions', async () => {
      const command = 'analyze';
      const args = ['performance'];
      
      // First call - should miss cache
      const routing1 = await performanceOptimizer.optimizeRouting(
        command,
        args,
        async () => router.routeCommand(command, args, {})
      );
      
      expect(performanceOptimizer.metrics.cacheMisses).toBe(1);
      
      // Second call - should hit cache
      const routing2 = await performanceOptimizer.optimizeRouting(
        command,
        args,
        async () => router.routeCommand(command, args, {})
      );
      
      expect(performanceOptimizer.metrics.cacheHits).toBe(1);
      expect(routing2).toEqual(routing1);
    });
    
    test('should apply routing optimizations', async () => {
      const routing = {
        execution: {
          agents: [
            { name: 'agent1', role: 'specialist', model: 'deepseek' },
            { name: 'agent1', role: 'specialist', model: 'deepseek' }, // Duplicate
            { name: 'agent2', role: 'specialist', model: 'qwen' }
          ]
        },
        priority: 'normal'
      };
      
      const optimized = performanceOptimizer.applyOptimizations(routing);
      
      // Should remove duplicates
      expect(optimized.execution.agents).toHaveLength(2);
      expect(performanceOptimizer.metrics.optimizationsApplied).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should recover from timeout error', async () => {
      const timeoutError = new Error('Request timeout');
      const context = {
        command: 'test',
        args: ['timeout'],
        routingPlan: null
      };
      
      const recovered = await errorHandler.handleRoutingError(timeoutError, context);
      
      expect(recovered).toBeDefined();
      expect(recovered.routing.source).toBe('timeout-recovery');
      expect(recovered.execution.agents[0].model).toBe('gemini'); // Fast model
    });
    
    test('should handle Claude Max unavailable', async () => {
      const error = new Error('Claude Max account unavailable');
      const context = {
        command: 'implement',
        args: ['feature'],
        routingPlan: {
          execution: {
            agents: [
              { name: 'manager', usingClaudeMax: true, model: 'claude-max' },
              { name: 'specialist', usingClaudeMax: false, model: 'qwen' }
            ]
          }
        }
      };
      
      const recovered = await errorHandler.handleRoutingError(error, context);
      
      // Should switch manager to free tier
      const manager = recovered.execution.agents.find(a => a.name === 'manager');
      expect(manager.usingClaudeMax).toBe(false);
      expect(['deepseek', 'qwen', 'gemini']).toContain(manager.model);
    });
    
    test('should validate routing results', async () => {
      const invalidRouting = {
        execution: {
          agents: []  // No agents
        },
        routing: {
          confidence: 0.05  // Too low
        }
      };
      
      expect(() => {
        errorHandler.validateRouting(invalidRouting);
      }).toThrow('Invalid routing');
    });
  });
  
  describe('Specialist Spawning', () => {
    test('should spawn specialists with correct models', async () => {
      const routingPlan = {
        execution: {
          agents: [
            { name: 'security-specialist', role: 'specialist', model: 'deepseek' },
            { name: 'database-specialist', role: 'specialist', model: 'qwen' },
            { name: 'ui-designer', role: 'specialist', model: 'gemini' }
          ]
        }
      };
      
      const specialists = await specialistSpawner.spawnSpecialistsForPlan(routingPlan);
      
      expect(specialists).toHaveLength(3);
      expect(specialistSpawner.activeSpecialists.size).toBe(3);
      
      // Verify model assignments match task types
      const metrics = specialistSpawner.getMetrics();
      expect(metrics.modelAssignments['deepseek']).toBeGreaterThan(0);
      expect(metrics.modelAssignments['qwen']).toBeGreaterThan(0);
      expect(metrics.modelAssignments['gemini']).toBeGreaterThan(0);
    });
  });
  
  describe('End-to-End Scenarios', () => {
    test('should handle product launch scenario', async () => {
      // Complex product launch command
      const routingPlan = await router.routeCommand(
        'plan',
        ['product launch with development, testing, deployment, and marketing'],
        {}
      );
      
      // Should identify as complex/executive level
      expect(routingPlan.analysis.complexity).toBeGreaterThan(0.6);
      
      // Should have executive or high-level coordination
      const hasExecutive = routingPlan.execution.agents.some(
        a => a.role === 'executive' || a.name.includes('executive')
      );
      expect(hasExecutive).toBe(true);
      
      // Record successful execution
      await learningSystem.learnFromRouting(
        'plan',
        ['product launch'],
        routingPlan,
        { success: true }
      );
      
      // Should be able to recall for similar commands
      const learned = learningSystem.getLearnedRouting('plan', ['product launch']);
      expect(learned.found).toBe(true);
    });
    
    test('should handle migration scenario with error recovery', async () => {
      // Simulate error during migration planning
      const error = new Error('Specialist unavailable');
      const context = {
        command: 'migrate',
        args: ['legacy system to microservices'],
        routingPlan: null
      };
      
      // Should recover with fallback
      const recovered = await errorHandler.handleRoutingError(error, context);
      expect(recovered).toBeDefined();
      expect(recovered.execution.agents.length).toBeGreaterThan(0);
      
      // Should track error
      const errorSummary = errorHandler.getErrorSummary();
      expect(errorSummary.metrics.totalErrors).toBeGreaterThan(0);
    });
  });
  
  describe('System Metrics', () => {
    test('should aggregate all system metrics', async () => {
      // Perform some operations
      await router.routeCommand('test', ['metrics'], {});
      
      // Get all metrics
      const routingStats = router.getRoutingStats();
      const feedbackSummary = feedbackSystem.getFeedbackSummary();
      const performanceMetrics = performanceOptimizer.getMetrics();
      const errorSummary = errorHandler.getErrorSummary();
      const spawnerMetrics = specialistSpawner.getMetrics();
      
      // Verify metrics are being collected
      expect(routingStats).toBeDefined();
      expect(feedbackSummary.metrics).toBeDefined();
      expect(performanceMetrics.totalRoutings).toBeGreaterThanOrEqual(0);
      expect(errorSummary.metrics).toBeDefined();
      expect(spawnerMetrics.totalSpawned).toBeGreaterThanOrEqual(0);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=final-routing-integration\\.test\\.js']);
}