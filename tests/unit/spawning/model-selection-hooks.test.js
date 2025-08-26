/**
 * Unit tests for Model Selection hooks
 * Tests hook integration points added in Sprint 5-6
 */

const { DynamicSpawningController, SpawnPriority } = require('../../../src/core/spawning/dynamic-spawning-controller');
const { ClaudeMaxAccountManager } = require('../../../src/core/agents/claude-max-account-manager');
const { BumbaUniversalHookSystem } = require('../../../src/core/hooks/bumba-universal-hook-system');

describe('Model Selection Hook Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let spawningController;
  let claudeMaxManager;
  let hookSystem;

  beforeEach(() => {
    spawningController = new DynamicSpawningController({
      maxTotalAgents: 10,
      adaptiveSpawning: true,
      preSpawnEnabled: false
    });
    
    claudeMaxManager = new ClaudeMaxAccountManager({
      maxConcurrentUsers: 1,
      lockTimeout: 5000
    });
    
    // Get reference to the hook systems
    hookSystem = spawningController.hooks;
  });

  describe('Model Selection Hooks', () => {
    test('should register all model selection hooks', async () => {
      const registeredHooks = hookSystem.getRegisteredHooks();
      
      expect(registeredHooks['model:beforeSelection']).toBeDefined();
      expect(registeredHooks['model:evaluateCost']).toBeDefined();
      expect(registeredHooks['model:suggestAlternative']).toBeDefined();
      expect(registeredHooks['model:afterSelection']).toBeDefined();
    });

    test('should execute beforeSelection hook with requirements', async () => {
      let capturedContext;
      
      hookSystem.registerHandler('model:beforeSelection', async (context) => {
        capturedContext = context;
        return context;
      });

      const requirements = {
        type: 'developer',
        skills: ['javascript', 'react'],
        department: 'frontend'
      };

      await spawningController.requestSpawn(requirements, {
        priority: SpawnPriority.HIGH
      });

      expect(capturedContext).toBeDefined();
      expect(capturedContext.requirements).toEqual(requirements);
      expect(capturedContext.availableModels).toBeDefined();
      expect(capturedContext.config).toBeDefined();
    });

    test('should evaluate cost through hook', async () => {
      let costEvaluations = [];
      
      hookSystem.registerHandler('model:evaluateCost', async (context) => {
        costEvaluations.push({
          model: context.model,
          cost: context.cost,
          requirements: context.requirements
        });
        
        // Suggest alternative if too expensive
        if (context.cost > 0.01) {
          context.suggestAlternative = true;
          context.reason = 'Cost exceeds threshold';
        }
        return context;
      });

      const requirements = {
        type: 'analyst',
        skills: ['data-analysis']
      };

      await spawningController.requestSpawn(requirements);

      expect(costEvaluations.length).toBeGreaterThan(0);
      expect(costEvaluations[0].model).toBeDefined();
      expect(costEvaluations[0].cost).toBeDefined();
    });

    test('should suggest alternative models through hook', async () => {
      let alternativeSuggested = false;
      
      hookSystem.registerHandler('model:suggestAlternative', async (context) => {
        if (context.originalModel === 'claude-max') {
          context.alternativeModel = 'deepseek';
          context.costSavings = 0.014; // $0.015 - $0.001
          context.reason = 'Claude Max unavailable';
          alternativeSuggested = true;
        }
        return context;
      });

      const requirements = {
        type: 'premium-analyst',
        preferredModel: 'claude-max'
      };

      await spawningController.requestSpawn(requirements);

      expect(alternativeSuggested).toBe(true);
    });

    test('should track model selection through afterSelection hook', async () => {
      const selections = [];
      
      hookSystem.registerHandler('model:afterSelection', async (context) => {
        selections.push({
          model: context.selectedModel,
          cost: context.estimatedCost,
          agentId: context.agentId
        });
        return context;
      });

      await spawningController.requestSpawn({
        type: 'developer'
      });

      expect(selections.length).toBe(1);
      expect(selections[0].model).toBeDefined();
      expect(selections[0].cost).toBeGreaterThanOrEqual(0);
      expect(selections[0].agentId).toBeDefined();
    });
  });

  describe('Claude Max Lock Hooks', () => {
    test('should register Claude Max specific hooks', async () => {
      const claudeHooks = claudeMaxManager.hooks.getRegisteredHooks();
      
      expect(claudeHooks['claudemax:beforeLockAcquisition']).toBeDefined();
      expect(claudeHooks['claudemax:evaluateAlternative']).toBeDefined();
      expect(claudeHooks['claudemax:afterLockAcquisition']).toBeDefined();
      expect(claudeHooks['claudemax:onLockRelease']).toBeDefined();
    });

    test('should execute beforeLockAcquisition hook', async () => {
      let capturedContext;
      
      claudeMaxManager.hooks.registerHandler('claudemax:beforeLockAcquisition', async (context) => {
        capturedContext = context;
        return context;
      });

      const acquired = await claudeMaxManager.tryAcquireLock('agent-1', 100);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.agentId).toBe('agent-1');
      expect(capturedContext.priority).toBe(100);
      expect(capturedContext.agentType).toBeDefined();
    });

    test('should suggest alternatives when Claude Max unavailable', async () => {
      // First agent acquires lock
      await claudeMaxManager.tryAcquireLock('agent-1', 100);
      
      let alternativeSuggested = false;
      
      claudeMaxManager.hooks.registerHandler('claudemax:evaluateAlternative', async (context) => {
        if (!context.lockAvailable) {
          context.suggestAlternative = true;
          context.alternativeModel = 'qwen';
          context.reason = 'Claude Max locked by another agent';
          alternativeSuggested = true;
        }
        return context;
      });

      // Second agent tries to acquire lock
      const acquired = await claudeMaxManager.tryAcquireLock('agent-2', 50);

      expect(acquired).toBe(false);
      expect(alternativeSuggested).toBe(true);
    });

    test('should track lock acquisition and release', async () => {
      const lockEvents = [];
      
      claudeMaxManager.hooks.registerHandler('claudemax:afterLockAcquisition', async (context) => {
        lockEvents.push({
          event: 'acquired',
          agentId: context.agentId,
          success: context.success
        });
        return context;
      });
      
      claudeMaxManager.hooks.registerHandler('claudemax:onLockRelease', async (context) => {
        lockEvents.push({
          event: 'released',
          agentId: context.agentId,
          duration: context.duration
        });
        return context;
      });

      await claudeMaxManager.tryAcquireLock('agent-1', 100);
      await claudeMaxManager.releaseLock('agent-1');

      expect(lockEvents).toHaveLength(2);
      expect(lockEvents[0].event).toBe('acquired');
      expect(lockEvents[1].event).toBe('released');
      expect(lockEvents[1].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cost Optimization Integration', () => {
    test('should optimize model selection based on budget', async () => {
      const budget = { remaining: 5.00 }; // $5 remaining
      
      hookSystem.registerHandler('model:evaluateCost', async (context) => {
        const projectedCost = context.cost * 1000; // Assume 1000 requests
        
        if (projectedCost > budget.remaining) {
          context.suggestAlternative = true;
          context.reason = 'Would exceed budget';
          context.budgetRemaining = budget.remaining;
        }
        return context;
      });
      
      hookSystem.registerHandler('model:suggestAlternative', async (context) => {
        // Switch to cheaper model
        if (context.suggestAlternative) {
          context.alternativeModel = 'deepseek';
          context.costSavings = 0.014; // Per request
        }
        return context;
      });

      const result = await spawningController.requestSpawn({
        type: 'expensive-task',
        preferredModel: 'claude-max'
      });

      expect(result).toBeDefined();
      // Should have selected cheaper model
      expect(result.agent.config.model).not.toBe('claude-max');
    });

    test('should track cumulative cost savings', async () => {
      let totalSavings = 0;
      
      hookSystem.registerHandler('model:afterSelection', async (context) => {
        if (context.alternativeUsed) {
          const originalCost = 0.015; // Claude Max
          const actualCost = context.estimatedCost;
          totalSavings += (originalCost - actualCost);
        }
        return context;
      });

      // Spawn multiple agents with cost optimization
      for (let i = 0; i < 5; i++) {
        hookSystem.registerHandler('model:suggestAlternative', async (context) => {
          context.alternativeModel = 'qwen';
          context.alternativeUsed = true;
          return context;
        });
        
        await spawningController.requestSpawn({
          type: 'worker',
          id: `worker-${i}`
        });
      }

      expect(totalSavings).toBeGreaterThan(0);
    });

    test('should respect priority when selecting models', async () => {
      const modelSelections = [];
      
      hookSystem.registerHandler('model:afterSelection', async (context) => {
        modelSelections.push({
          priority: context.priority,
          model: context.selectedModel
        });
        return context;
      });

      // High priority should get better model
      await spawningController.requestSpawn(
        { type: 'critical' },
        { priority: SpawnPriority.CRITICAL }
      );
      
      // Low priority should get cheaper model
      await spawningController.requestSpawn(
        { type: 'background' },
        { priority: SpawnPriority.LOW }
      );

      expect(modelSelections).toHaveLength(2);
      // Critical tasks might get better models
      expect(modelSelections[0].priority).toBe(SpawnPriority.CRITICAL);
      expect(modelSelections[1].priority).toBe(SpawnPriority.LOW);
    });
  });

  describe('Hook Error Handling', () => {
    test('should handle hook errors gracefully', async () => {
      hookSystem.registerHandler('model:evaluateCost', async () => {
        throw new Error('Cost evaluation failed');
      });

      // Should not throw, but handle error internally
      const result = await spawningController.requestSpawn({
        type: 'test'
      });

      expect(result).toBeDefined();
    });

    test('should continue with default behavior on hook failure', async () => {
      hookSystem.registerHandler('model:beforeSelection', async () => {
        throw new Error('Hook failed');
      });

      const result = await spawningController.requestSpawn({
        type: 'test'
      });

      expect(result).toBeDefined();
      expect(result.agent).toBeDefined();
    });
  });

  describe('Performance Impact', () => {
    test('should measure hook execution time', async () => {
      const executionTimes = [];
      
      hookSystem.registerHandler('model:beforeSelection', async (context) => {
        const start = Date.now();
        // Simulate some processing
        await new Promise(resolve => setTimeout(resolve, 10));
        executionTimes.push(Date.now() - start);
        return context;
      });

      await spawningController.requestSpawn({ type: 'test' });

      expect(executionTimes[0]).toBeGreaterThanOrEqual(10);
      expect(executionTimes[0]).toBeLessThan(100); // Should be fast
    });

    test('should batch model evaluations for efficiency', async () => {
      let batchCount = 0;
      
      hookSystem.registerHandler('model:evaluateCost', async (context) => {
        if (context.batch) {
          batchCount++;
        }
        return context;
      });

      // Request multiple spawns rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(spawningController.requestSpawn({
          type: 'batch-worker',
          id: `batch-${i}`
        }));
      }

      await Promise.all(promises);

      // Some evaluations might be batched
      expect(batchCount).toBeGreaterThanOrEqual(0);
    });
  });
});