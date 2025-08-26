/**
 * BUMBA Hook System Test Suite
 * Comprehensive tests for all hook categories
 */

const { UnifiedHookSystem } = require('../src/core/unified-hook-system');
const { IntegrationHooks } = require('../src/core/hooks/integration-hooks');
const { LearningHooks } = require('../src/core/integration/learning-hooks');

describe('BUMBA Hook System', () => {
  let hookSystem;

  beforeEach(() => {
    hookSystem = new UnifiedHookSystem();
  });

  describe('Core Hook Functionality', () => {
    test('should register and execute hooks', async () => {
      let executed = false;
      
      hookSystem.register('test:hook', async (context) => {
        executed = true;
        return { ...context, executed: true };
      });

      const result = await hookSystem.execute('test:hook', { test: true });
      
      expect(executed).toBe(true);
      expect(result.results).toBeDefined();
    });

    test('should handle hook priorities', async () => {
      const order = [];
      
      hookSystem.register('priority:test', async () => {
        order.push('low');
      }, { priority: 0 });
      
      hookSystem.register('priority:test', async () => {
        order.push('high');
      }, { priority: 100 });
      
      hookSystem.register('priority:test', async () => {
        order.push('medium');
      }, { priority: 50 });
      
      await hookSystem.execute('priority:test', {});
      
      expect(order).toEqual(['high', 'medium', 'low']);
    });

    test('should handle hook errors gracefully', async () => {
      hookSystem.register('error:hook', async () => {
        throw new Error('Test error');
      });
      
      const result = await hookSystem.execute('error:hook', {});
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Test error');
    });
  });

  describe('Learning Hooks', () => {
    let learningHooks;

    beforeEach(() => {
      learningHooks = new LearningHooks();
    });

    test('should create learning capture hook', () => {
      const hook = learningHooks.createHook('learning:capture', {
        before: async (context) => {
          context.captured = true;
          return context;
        }
      });
      
      expect(hook).toBeDefined();
      expect(hook.name).toBe('learning:capture');
      expect(learningHooks.hooks.has('learning:capture')).toBe(true);
    });

    test('should capture system state', () => {
      const state = learningHooks.captureSystemState();
      
      expect(state).toBeDefined();
      expect(state.timestamp).toBeDefined();
      expect(state.memoryUsage).toBeDefined();
      expect(state.cpuUsage).toBeDefined();
    });

    test('should extract patterns from context', () => {
      const patterns = learningHooks.extractPatterns(
        { type: 'test' },
        { success: true }
      );
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe('success_pattern');
    });

    test('should store experiences', async () => {
      const experience = {
        timestamp: Date.now(),
        duration: 100,
        result: { success: true }
      };
      
      await learningHooks.storeExperience(experience);
      
      expect(learningHooks.experiences).toHaveLength(1);
      expect(learningHooks.experiences[0]).toEqual(experience);
    });

    test('should calculate success rate', () => {
      learningHooks.experiences = [
        { result: { success: true } },
        { result: { success: false } },
        { result: { success: true } }
      ];
      
      const rate = learningHooks.calculateSuccessRate();
      expect(rate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Integration Hooks', () => {
    let integrationHooks;

    beforeEach(async () => {
      integrationHooks = new IntegrationHooks();
      await integrationHooks.initialize();
    });

    test('should register core integration hooks', () => {
      expect(integrationHooks.hooks.has('integration:connect')).toBe(true);
      expect(integrationHooks.hooks.has('integration:sync')).toBe(true);
      expect(integrationHooks.hooks.has('integration:bridge')).toBe(true);
      expect(integrationHooks.hooks.has('integration:validate')).toBe(true);
    });

    test('should execute connect hook', async () => {
      const context = {
        service: 'test-service',
        credentials: { key: 'test' },
        operation: async () => ({ connected: true })
      };
      
      const result = await integrationHooks.executeHook('integration:connect', context);
      
      expect(result.connected).toBe(true);
      expect(integrationHooks.integrations.has('test-service')).toBe(true);
      expect(integrationHooks.metrics.connectionsEstablished).toBe(1);
    });

    test('should handle sync operations', async () => {
      // First connect
      integrationHooks.integrations.set('test-service', {
        connected: true
      });
      
      const context = {
        service: 'test-service',
        data: [1, 2, 3],
        operation: async () => ({ itemsSynced: 3 })
      };
      
      const result = await integrationHooks.executeHook('integration:sync', context);
      
      expect(result.itemsSynced).toBe(3);
      expect(integrationHooks.metrics.syncOperations).toBe(1);
    });

    test('should validate integration', async () => {
      integrationHooks.integrations.set('test-service', {
        connected: true
      });
      
      const context = {
        service: 'test-service',
        operation: async () => ({ valid: true })
      };
      
      const result = await integrationHooks.executeHook('integration:validate', context);
      
      expect(result.valid).toBe(true);
      expect(integrationHooks.metrics.validationChecks).toBe(1);
    });

    test('should get integration status', () => {
      integrationHooks.integrations.set('test-service', {
        connected: true,
        lastSyncTime: Date.now()
      });
      
      const status = integrationHooks.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.hooks).toContain('integration:connect');
      expect(status.integrations['test-service']).toBeDefined();
      expect(status.integrations['test-service'].connected).toBe(true);
    });
  });

  describe('Lifecycle Hooks', () => {
    test('should have lifecycle hooks registered', () => {
      const hooks = Array.from(hookSystem.hooks.keys());
      
      // Check for system hooks
      expect(hooks).toContain('before:command');
      expect(hooks).toContain('after:command');
      expect(hooks).toContain('on:error');
    });

    test('should have learning hooks registered', () => {
      const hooks = Array.from(hookSystem.hooks.keys());
      
      // Check for learning hooks
      expect(hooks).toContain('learning:capture');
      expect(hooks).toContain('learning:optimize');
      expect(hooks).toContain('learning:feedback');
      expect(hooks).toContain('learning:improve');
    });

    test('should have integration hooks registered', () => {
      const hooks = Array.from(hookSystem.hooks.keys());
      
      // Check for integration hooks
      expect(hooks).toContain('integration:connect');
      expect(hooks).toContain('integration:sync');
      expect(hooks).toContain('integration:bridge');
      expect(hooks).toContain('integration:validate');
    });
  });

  describe('Hook Categories', () => {
    test('should categorize hooks correctly', () => {
      hookSystem.register('test:system', async () => {}, { category: 'system' });
      hookSystem.register('test:agent', async () => {}, { category: 'agent' });
      hookSystem.register('test:learning', async () => {}, { category: 'learning' });
      hookSystem.register('test:integration', async () => {}, { category: 'integration' });
      
      expect(hookSystem.categories.system.has('test:system')).toBe(true);
      expect(hookSystem.categories.agent.has('test:agent')).toBe(true);
      expect(hookSystem.categories.learning.has('test:learning')).toBe(true);
      expect(hookSystem.categories.integration.has('test:integration')).toBe(true);
    });
  });

  describe('Hook Execution Chain', () => {
    test('should execute hooks in sequence', async () => {
      const execution = [];
      
      hookSystem.register('chain:test', async (context) => {
        execution.push('first');
        context.first = true;
        return context;
      });
      
      hookSystem.register('chain:test', async (context) => {
        execution.push('second');
        context.second = true;
        return context;
      });
      
      hookSystem.register('chain:test', async (context) => {
        execution.push('third');
        context.third = true;
        return context;
      });
      
      const result = await hookSystem.execute('chain:test', {});
      
      expect(execution).toEqual(['first', 'second', 'third']);
    });

    test('should execute hooks in parallel when specified', async () => {
      const startTimes = [];
      
      hookSystem.register('parallel:test', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      hookSystem.register('parallel:test', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      await hookSystem.execute('parallel:test', {}, { parallel: true });
      
      // Check that start times are very close (within 5ms)
      if (startTimes.length === 2) {
        const diff = Math.abs(startTimes[0] - startTimes[1]);
        expect(diff).toBeLessThan(5);
      }
    });
  });

  describe('Hook Metrics', () => {
    test('should track execution metrics', async () => {
      hookSystem.register('metrics:test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { result: 'success' };
      });
      
      await hookSystem.execute('metrics:test', {});
      
      const log = hookSystem.executionLog[0];
      expect(log).toBeDefined();
      expect(log.name).toBe('metrics:test');
      expect(log.duration).toBeGreaterThan(0);
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=hook-system.test.js']);
}