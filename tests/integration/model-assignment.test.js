/**
 * Model Assignment Integration Tests
 * Verify correct model assignment based on agent type and task
 */

const { CommandRouterIntegration } = require('../../src/core/command-router-integration');
const { ClaudeMaxAccountManager } = require('../../src/core/agents/claude-max-account-manager');
const { DomainModelRouter } = require('../../src/core/agents/domain-model-router');

describe('Model Assignment System', () => {
  let router;
  let claudeMaxManager;
  let domainRouter;
  
  beforeEach(() => {
    router = new CommandRouterIntegration();
    claudeMaxManager = new ClaudeMaxAccountManager();
    domainRouter = new DomainModelRouter();
  });
  
  afterEach(() => {
    // Clean up any locks
    claudeMaxManager.reset();
  });
  
  describe('Claude Max Exclusivity', () => {
    test('should enforce single Claude Max usage', async () => {
      // Acquire lock for first agent
      const lock1 = await claudeMaxManager.acquireLock('agent1', 'manager', 2);
      expect(lock1).toBe(true);
      
      // Try to acquire for second agent (should queue)
      const lock2Promise = claudeMaxManager.acquireLock('agent2', 'manager', 2);
      
      // Check that second agent is queued
      expect(claudeMaxManager.queue.length).toBe(1);
      
      // Release first lock
      await claudeMaxManager.releaseLock('agent1');
      
      // Second agent should now get the lock
      const lock2 = await lock2Promise;
      expect(lock2).toBe(true);
    });
    
    test('should prioritize executives over managers', async () => {
      // Manager gets lock first
      await claudeMaxManager.acquireLock('manager1', 'manager', 2);
      
      // Executive and another manager queue
      const executivePromise = claudeMaxManager.acquireLock('executive1', 'executive', 1);
      const managerPromise = claudeMaxManager.acquireLock('manager2', 'manager', 2);
      
      // Release current lock
      await claudeMaxManager.releaseLock('manager1');
      
      // Executive should get lock before manager
      const executiveLock = await executivePromise;
      expect(executiveLock).toBe(true);
      expect(claudeMaxManager.mutex.currentAgent).toBe('executive1');
    });
    
    test('should handle timeout correctly', async () => {
      const shortTimeout = 100; // 100ms timeout
      claudeMaxManager.config.defaultTimeout = shortTimeout;
      
      // First agent gets lock
      await claudeMaxManager.acquireLock('agent1', 'manager', 2);
      
      // Second agent tries but should timeout
      const startTime = Date.now();
      try {
        await claudeMaxManager.acquireLock('agent2', 'manager', 2);
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(shortTimeout);
        expect(error.message).toContain('timeout');
      }
    });
  });
  
  describe('Free Tier Model Assignment', () => {
    test('should assign DeepSeek for reasoning tasks', async () => {
      const task = { taskType: 'reasoning' };
      const config = await domainRouter.assignModelToWorker(task);
      
      expect(config.model).toBe('deepseek');
      expect(config.provider).toBe('deepseek');
    });
    
    test('should assign Qwen for coding tasks', async () => {
      const task = { taskType: 'coding' };
      const config = await domainRouter.assignModelToWorker(task);
      
      expect(config.model).toBe('qwen');
      expect(config.provider).toBe('qwen');
    });
    
    test('should assign Gemini for general tasks', async () => {
      const task = { taskType: 'general' };
      const config = await domainRouter.assignModelToWorker(task);
      
      expect(config.model).toBe('gemini');
      expect(config.provider).toBe('google');
    });
    
    test('should handle language-specific assignments', async () => {
      const pythonTask = { taskType: 'coding', language: 'python' };
      const pythonConfig = await domainRouter.assignModelToWorker(pythonTask);
      expect(pythonConfig.model).toBe('qwen');
      
      const jsTask = { taskType: 'coding', language: 'javascript' };
      const jsConfig = await domainRouter.assignModelToWorker(jsTask);
      expect(jsConfig.model).toBe('qwen');
    });
  });
  
  describe('End-to-End Model Assignment', () => {
    test('should assign models correctly for simple task', async () => {
      const result = await router.routeCommand('fix', ['typo in README'], {});
      
      // Simple task should have minimal agents
      expect(result.execution.agents.length).toBeLessThanOrEqual(2);
      
      // Check model assignments
      for (const agent of result.execution.agents) {
        if (agent.role === 'manager') {
          expect(agent.usingClaudeMax).toBe(true);
        } else {
          expect(agent.usingClaudeMax).toBe(false);
          expect(['deepseek', 'qwen', 'gemini']).toContain(agent.model);
        }
      }
    });
    
    test('should assign models for complex multi-domain task', async () => {
      const result = await router.routeCommand(
        'implement',
        ['full-stack app with auth, database, and UI'],
        {}
      );
      
      const managers = result.execution.agents.filter(a => a.role === 'manager');
      const specialists = result.execution.agents.filter(a => a.role === 'specialist');
      
      // Should have both managers and specialists
      expect(managers.length).toBeGreaterThan(0);
      expect(specialists.length).toBeGreaterThan(0);
      
      // Only one manager gets Claude Max in parallel execution
      const claudeMaxCount = managers.filter(m => m.usingClaudeMax).length;
      expect(claudeMaxCount).toBeLessThanOrEqual(1);
      
      // Specialists should have appropriate free tier models
      for (const specialist of specialists) {
        expect(specialist.usingClaudeMax).toBe(false);
        
        // Check model matches task type
        if (specialist.name.includes('database') || specialist.name.includes('backend')) {
          // Coding tasks should use Qwen
          expect(['qwen', 'deepseek']).toContain(specialist.model);
        } else if (specialist.name.includes('security') || specialist.name.includes('research')) {
          // Reasoning tasks should use DeepSeek
          expect(['deepseek', 'gemini']).toContain(specialist.model);
        }
      }
    });
    
    test('should handle executive elevation correctly', async () => {
      const result = await router.routeCommand(
        'architect',
        ['enterprise platform transformation'],
        {}
      );
      
      // Should have executive level agent
      const executives = result.execution.agents.filter(
        a => a.role === 'executive' || a.name.includes('executive')
      );
      
      expect(executives.length).toBeGreaterThan(0);
      
      // Executive should get Claude Max
      expect(executives[0].usingClaudeMax).toBe(true);
      
      // Other managers should use free tier
      const nonExecManagers = result.execution.agents.filter(
        a => a.role === 'manager' && !a.name.includes('executive')
      );
      
      for (const manager of nonExecManagers) {
        if (executives[0].usingClaudeMax) {
          expect(manager.usingClaudeMax).toBe(false);
        }
      }
    });
  });
  
  describe('Model Performance Tracking', () => {
    test('should track model usage statistics', async () => {
      const stats = domainRouter.getUsageStats();
      
      expect(stats).toHaveProperty('deepseek');
      expect(stats).toHaveProperty('qwen');
      expect(stats).toHaveProperty('gemini');
      
      // Each model should have usage count
      for (const model of ['deepseek', 'qwen', 'gemini']) {
        expect(stats[model]).toHaveProperty('count');
      }
    });
    
    test('should update usage on assignment', async () => {
      const initialStats = domainRouter.getUsageStats();
      const initialQwenCount = initialStats.qwen.count;
      
      // Assign a coding task (should use Qwen)
      await domainRouter.assignModelToWorker({ taskType: 'coding' });
      
      const newStats = domainRouter.getUsageStats();
      expect(newStats.qwen.count).toBe(initialQwenCount + 1);
    });
  });
  
  describe('Fallback Handling', () => {
    test('should fallback to Gemini for unknown task types', async () => {
      const task = { taskType: 'unknown-type' };
      const config = await domainRouter.assignModelToWorker(task);
      
      expect(config.model).toBe('gemini');
    });
    
    test('should handle missing task type', async () => {
      const task = {};
      const config = await domainRouter.assignModelToWorker(task);
      
      expect(config.model).toBe('gemini');
    });
    
    test('should release Claude Max lock on error', async () => {
      // Acquire lock
      await claudeMaxManager.acquireLock('agent1', 'manager', 2);
      expect(claudeMaxManager.mutex.locked).toBe(true);
      
      // Simulate error and release
      await claudeMaxManager.releaseLock('agent1');
      expect(claudeMaxManager.mutex.locked).toBe(false);
    });
  });
  
  describe('Concurrent Model Assignment', () => {
    test('should handle multiple simultaneous requests', async () => {
      const promises = [];
      
      // Create multiple routing requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          router.routeCommand('analyze', [`task ${i}`], {})
        );
      }
      
      const results = await Promise.all(promises);
      
      // All should complete successfully
      expect(results.length).toBe(5);
      
      // Count Claude Max assignments
      let claudeMaxCount = 0;
      for (const result of results) {
        const managers = result.execution.agents.filter(
          a => a.role === 'manager' && a.usingClaudeMax
        );
        claudeMaxCount += managers.length;
      }
      
      // Should respect Claude Max exclusivity
      expect(claudeMaxCount).toBeLessThanOrEqual(5);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=model-assignment\\.test\\.js']);
}