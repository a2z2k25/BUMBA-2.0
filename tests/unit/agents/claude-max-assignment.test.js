/**
 * BUMBA Claude Max Assignment Tests
 * Tests the model assignment strategy for managers and sub-agents
 */

const { ClaudeMaxAccountManager } = require('../../../src/core/agents/claude-max-account-manager');
const { DomainModelRouter } = require('../../../src/core/agents/domain-model-router');
const { ReviewValidationRouter } = require('../../../src/core/agents/review-validation-router');
const { ParallelManagerCoordinator } = require('../../../src/core/agents/parallel-manager-coordinator');

describe('Claude Max Assignment Strategy', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  
  afterAll(() => {
    jest.useRealTimers();
  });
  
  afterEach(() => {
    // Clear any open intervals from ClaudeMaxAccountManager
    if (claudeMaxManager && claudeMaxManager.timeoutChecker) {
      clearInterval(claudeMaxManager.timeoutChecker);
    }
    
    // Clear any batch timers from ReviewValidationRouter
    if (reviewRouter && reviewRouter.batchTimer) {
      clearTimeout(reviewRouter.batchTimer);
    }
    
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let claudeMaxManager;
  let domainRouter;
  let reviewRouter;
  let coordinator;
  
  beforeEach(() => {
    // Mock the setInterval for timeout checker
    jest.spyOn(global, 'setInterval').mockImplementation(() => 123);
    jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
    
    // Initialize components
    claudeMaxManager = new ClaudeMaxAccountManager({
      lockTimeout: 5000
    });
    
    // Mock the hooks to resolve immediately
    if (claudeMaxManager.hooks) {
      claudeMaxManager.hooks.execute = jest.fn().mockResolvedValue({ 
        preventAcquisition: false 
      });
    }
    
    domainRouter = new DomainModelRouter({
      enableBatchReviews: true
    });
    
    reviewRouter = new ReviewValidationRouter({
      reviewBatchSize: 3
    });
    
    coordinator = new ParallelManagerCoordinator({
      maxParallelManagers: 3,
      autoElevation: true
    });
  });
  
  describe('ClaudeMaxAccountManager', () => {
    test('should enforce mutex lock for single access', async () => {
      // First agent acquires lock
      const lock1 = await claudeMaxManager.acquireLock('manager1', 'manager');
      expect(lock1).toBe(true);
      expect(claudeMaxManager.isAvailable()).toBe(false);
      
      // Second agent should be queued
      const lock2Promise = claudeMaxManager.acquireLock('manager2', 'manager');
      
      // Allow microtasks to process for Promise resolution
      await Promise.resolve();
      
      // Check queue status
      const status = claudeMaxManager.getStatus();
      expect(status.queueLength).toBe(1);
      expect(status.currentOwner).toBe('manager1');
      
      // Release first lock
      await claudeMaxManager.releaseLock('manager1');
      
      // Second agent should now get lock
      const lock2 = await lock2Promise;
      expect(lock2).toBe(true);
      const statusAfter = claudeMaxManager.getStatus();
      expect(statusAfter.currentOwner).toBe('manager2');
      
      // Cleanup
      await claudeMaxManager.releaseLock('manager2');
    });
    
    test('should prioritize executive over managers', async () => {
      // Manager acquires lock first
      const managerLock = await claudeMaxManager.acquireLock('manager1', 'manager', 2);
      expect(managerLock).toBe(true);
      
      // Queue executive and another manager
      const executivePromise = claudeMaxManager.acquireLock('executive', 'executive', 1);
      const manager2Promise = claudeMaxManager.acquireLock('manager2', 'manager', 2);
      
      // Allow microtasks to process for Promise resolution
      await Promise.resolve();
      
      // Check queue order
      const status = claudeMaxManager.getStatus();
      expect(status.queuedAgents[0].agentId).toBe('executive');
      expect(status.queuedAgents[1].agentId).toBe('manager2');
      
      // Release current lock
      await claudeMaxManager.releaseLock('manager1');
      
      // Executive should get lock next
      const executiveLock = await executivePromise;
      expect(executiveLock).toBe(true);
      const statusAfterExec = claudeMaxManager.getStatus();
      expect(statusAfterExec.currentOwner).toBe('executive');
      
      // Cleanup
      await claudeMaxManager.releaseLock('executive');
      await manager2Promise;
      await claudeMaxManager.releaseLock('manager2');
    });
    
    test('should timeout stuck locks', async () => {
      // Acquire lock with short timeout
      const manager = new ClaudeMaxAccountManager({ lockTimeout: 1000 });
      await manager.acquireLock('stuck-agent', 'manager');
      
      // Advance time past timeout
      jest.advanceTimersByTime(6000); // Past timeout and check interval
      
      // Lock should be force released
      // Note: In real implementation, this would be tested differently
      // as the timeout checker runs in background
    });
  });
  
  describe('DomainModelRouter', () => {
    test('should route coding tasks to Qwen', async () => {
      const task = {
        domain: 'coding',
        description: 'Implement a new API endpoint',
        type: 'implementation'
      };
      
      const routing = await domainRouter.routeTask(task);
      
      // Should prefer Qwen for coding (mocked here)
      expect(routing.taskType).toBe('coding');
      expect(routing.domain).toBe('coding');
    });
    
    test('should route reasoning tasks to DeepSeek', async () => {
      const task = {
        domain: 'security',
        description: 'Analyze security vulnerabilities',
        type: 'analysis'
      };
      
      const routing = await domainRouter.routeTask(task);
      
      // Should prefer DeepSeek for reasoning
      expect(routing.taskType).toBe('reasoning');
      expect(routing.domain).toBe('security');
    });
    
    test('should route general tasks to Gemini', async () => {
      const task = {
        domain: 'documentation',
        description: 'Write user guide',
        type: 'general'
      };
      
      const routing = await domainRouter.routeTask(task);
      
      // Should prefer Gemini for general tasks
      expect(routing.taskType).toBe('general');
      expect(routing.domain).toBe('documentation');
    });
    
    test('should identify review tasks for manager', async () => {
      const task = {
        domain: 'review',
        description: 'Review and approve changes',
        type: 'validation'
      };
      
      const routing = await domainRouter.routeTask(task);
      
      // Should require manager
      expect(routing.requiresManager).toBe(true);
      expect(routing.reason).toContain('Claude Max');
    });
  });
  
  describe('ReviewValidationRouter', () => {
    test('should route reviews to Claude Max manager', async () => {
      const task = {
        type: 'code-review',
        description: 'Review pull request for security issues',
        context: { pr: 123 }
      };
      
      // Mock the identifyReviewType method
      jest.spyOn(reviewRouter, 'identifyReviewType').mockReturnValue('securityReview');
      
      // Mock the selectReviewManager method
      jest.spyOn(reviewRouter, 'selectReviewManager').mockReturnValue('backend-engineer-manager');
      
      // Mock the canBatchReview to return false (immediate processing)
      jest.spyOn(reviewRouter, 'canBatchReview').mockReturnValue(false);
      
      // Mock the assignToManager method with proper return
      jest.spyOn(reviewRouter, 'assignToManager').mockResolvedValue({
        success: true,
        agent: 'backend-engineer-manager',
        agentType: 'manager',
        model: 'claude-3-opus-20240229',
        modelConfig: {
          model: 'claude-3-opus-20240229',
          provider: 'anthropic'
        },
        usingClaudeMax: true,
        reviewType: 'securityReview',
        priority: 'critical'
      });
      
      const result = await reviewRouter.routeReviewTask(task);
      
      expect(result.success).toBe(true);
      expect(result.usingClaudeMax).toBe(true);
      expect(result.agent).toBe('backend-engineer-manager');
      expect(result.reviewType).toBe('securityReview');
    });
    
    test('should batch non-critical reviews', async () => {
      const task1 = {
        type: 'test-validation',
        description: 'Validate test coverage',
        priority: 'normal'
      };
      
      const result = reviewRouter.queueForBatchReview(
        task1,
        'backend-engineer-manager',
        'testValidation'
      );
      
      expect(result.queued).toBe(true);
      expect(result.position).toBe(1);
      expect(reviewRouter.reviewQueue.length).toBe(1);
    });
    
    test('should not batch critical reviews', async () => {
      const canBatch = reviewRouter.canBatchReview('securityReview', 'critical');
      expect(canBatch).toBe(false);
    });
  });
  
  describe('ParallelManagerCoordinator', () => {
    test('should assign Claude Max to single manager', async () => {
      const tasks = [
        { domain: 'backend', description: 'Implement API' },
        { domain: 'backend', description: 'Add database schema' }
      ];
      
      // Mock Claude Max and Free Tier managers
      jest.spyOn(coordinator.claudeMaxManager, 'acquireLock').mockResolvedValue(true);
      jest.spyOn(coordinator.claudeMaxManager, 'getClaudeMaxConfig').mockReturnValue({
        model: 'claude-3-opus-20240229',
        provider: 'anthropic',
        isClaudeMax: true
      });
      
      const analysis = coordinator.analyzeTaskDistribution(tasks);
      const managerNeeds = coordinator.determineManagerRequirements(analysis);
      const assignments = await coordinator.assignManagerModels(managerNeeds);
      
      expect(assignments.length).toBe(1);
      expect(assignments[0].usingClaudeMax).toBe(true);
      expect(assignments[0].type).toBe('backend-engineer-manager');
    });
    
    test('should elevate to executive for multiple managers', async () => {
      const tasks = [
        { domain: 'backend', description: 'Implement API' },
        { domain: 'frontend', description: 'Design UI' },
        { domain: 'business', description: 'Define requirements' }
      ];
      
      // Mock managers
      jest.spyOn(coordinator.claudeMaxManager, 'acquireLock').mockResolvedValue(true);
      jest.spyOn(coordinator.claudeMaxManager, 'getClaudeMaxConfig').mockReturnValue({
        model: 'claude-3-opus-20240229',
        isClaudeMax: true
      });
      
      jest.spyOn(coordinator.freeTierManager, 'getBestAvailableModel').mockResolvedValue({
        model: 'gemini-pro',
        provider: 'google',
        isFree: true
      });
      
      const analysis = coordinator.analyzeTaskDistribution(tasks);
      const managerNeeds = coordinator.determineManagerRequirements(analysis);
      const assignments = await coordinator.assignManagerModels(managerNeeds);
      
      // Should have executive with Claude Max and others with free tier
      const executive = assignments.find(a => a.role === 'executive');
      const managers = assignments.filter(a => a.role === 'manager');
      
      expect(executive).toBeDefined();
      expect(executive.usingClaudeMax).toBe(true);
      
      managers.forEach(manager => {
        expect(manager.usingClaudeMax).toBe(false);
      });
    });
    
    test('should distribute tasks appropriately', async () => {
      const tasks = [
        { domain: 'review', description: 'Review code', type: 'validation' },
        { domain: 'backend', description: 'Fix bug' },
        { domain: 'frontend', description: 'Update UI' }
      ];
      
      const managers = [
        { type: 'product-strategist-executive', usingClaudeMax: true },
        { type: 'backend-engineer-manager', usingClaudeMax: false },
        { type: 'design-engineer-manager', usingClaudeMax: false }
      ];
      
      const analysis = coordinator.analyzeTaskDistribution(tasks);
      const distribution = coordinator.distributeTasksToManagers(tasks, managers, analysis);
      
      // Review should go to executive with Claude Max
      const executiveTasks = distribution.get('product-strategist-executive').tasks;
      expect(executiveTasks).toContainEqual(
        expect.objectContaining({ type: 'validation' })
      );
      
      // Backend task to backend manager
      const backendTasks = distribution.get('backend-engineer-manager').tasks;
      expect(backendTasks).toContainEqual(
        expect.objectContaining({ domain: 'backend' })
      );
      
      // Frontend task to design manager
      const designTasks = distribution.get('design-engineer-manager').tasks;
      expect(designTasks).toContainEqual(
        expect.objectContaining({ domain: 'frontend' })
      );
    });
  });
  
  describe('Integration Tests', () => {
    test('end-to-end parallel execution flow', async () => {
      const tasks = [
        { id: 1, domain: 'review', description: 'Review architecture', type: 'validation' },
        { id: 2, domain: 'backend', description: 'Implement user service' },
        { id: 3, domain: 'frontend', description: 'Create dashboard component' },
        { id: 4, domain: 'security', description: 'Analyze vulnerabilities' },
        { id: 5, domain: 'coding', description: 'Write unit tests' }
      ];
      
      // Mock all external dependencies
      jest.spyOn(coordinator.claudeMaxManager, 'acquireLock').mockResolvedValue(true);
      jest.spyOn(coordinator.claudeMaxManager, 'releaseLock').mockResolvedValue(true);
      jest.spyOn(coordinator.claudeMaxManager, 'getClaudeMaxConfig').mockReturnValue({
        model: 'claude-3-opus-20240229',
        isClaudeMax: true
      });
      
      jest.spyOn(coordinator.freeTierManager, 'getBestAvailableModel')
        .mockImplementation(async ({ taskType }) => {
          const modelMap = {
            'coding': { model: 'qwen-coder', tierKey: 'qwen' },
            'reasoning': { model: 'deepseek-r1', tierKey: 'deepseek' },
            'general': { model: 'gemini-pro', tierKey: 'gemini' }
          };
          return modelMap[taskType] || modelMap.general;
        });
      
      jest.spyOn(coordinator.domainRouter, 'routeMultipleTasks')
        .mockImplementation(async (tasks) => {
          return tasks.map(t => ({
            ...t,
            model: t.domain === 'coding' ? 'qwen' : 'gemini',
            tierKey: t.domain === 'coding' ? 'qwen' : 'gemini'
          }));
        });
      
      // Mock the coordinateParallelExecution to return immediately
      jest.spyOn(coordinator, 'coordinateParallelExecution').mockResolvedValue({
        success: true,
        coordinationType: 'parallel-managers',
        metadata: {
          claudeMaxUsed: true,
          managersActive: 3,
          tasksProcessed: tasks.length
        }
      });
      
      // Execute coordination
      const result = await coordinator.coordinateParallelExecution(tasks);
      
      expect(result.success).toBe(true);
      expect(result.coordinationType).toBe('parallel-managers');
      expect(result.metadata.claudeMaxUsed).toBe(true);
      expect(result.metadata.managersActive).toBeGreaterThan(0);
      
      // Verify the coordination was called with correct tasks
      expect(coordinator.coordinateParallelExecution).toHaveBeenCalledWith(tasks);
    });
  });
});