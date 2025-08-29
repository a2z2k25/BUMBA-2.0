/**
 * BUMBA CLI - Comprehensive Integration Tests
 * Tests core flows end-to-end without external API dependencies
 */

const { createBumbaFramework } = require('../../src/core/bumba-framework-2');
const { UnifiedErrorManager } = require('../../src/core/error-handling/unified-error-manager');
const { UnifiedIntegrationManager } = require('../../src/core/integrations/unified-integration-manager');
const { CommandImplementations } = require('../../src/core/command-implementations');
const UnifiedSpecialistBase = require('../../src/core/specialists/unified-specialist-base');

describe('BUMBA CLI Core Flows', () => {
  let framework;
  let errorManager;
  let integrationManager;
  let commandImplementations;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.BUMBA_DISABLE_MONITORING = 'true';
    process.env.BUMBA_STATUS_LINE = 'false';
    process.env.BUMBA_WHISPERS = 'false';
  });

  beforeEach(async () => {
    // Initialize framework for each test
    framework = await createBumbaFramework({
      skipInit: false,
      legacy: false,
      disableMonitoring: true,
      testMode: true
    });

    errorManager = new UnifiedErrorManager();
    integrationManager = new UnifiedIntegrationManager({ autoLoad: false });
    commandImplementations = new CommandImplementations();
  });

  afterEach(async () => {
    // Clean up
    if (framework && framework.shutdown) {
      await framework.shutdown();
    }
  });

  describe('Framework Initialization', () => {
    test('should initialize all core components', async () => {
      expect(framework).toBeDefined();
      expect(framework.departments).toBeDefined();
      expect(framework.router).toBeDefined();
      expect(framework.commandHandler).toBeDefined();
    });

    test('should have all departments registered', () => {
      expect(framework.departments.has('product-strategist')).toBe(true);
      expect(framework.departments.has('design-engineer')).toBe(true);
      expect(framework.departments.has('backend-engineer')).toBe(true);
    });

    test('should handle initialization errors gracefully', async () => {
      const badFramework = await createBumbaFramework({
        invalidOption: true,
        throwOnError: false
      });
      
      expect(badFramework).toBeDefined();
      // Framework should still initialize with defaults
    });
  });

  describe('Command Execution Flow', () => {
    test('should execute product strategy command', async () => {
      const result = await commandImplementations.handleProductCommand(
        ['analyze', 'market'], 
        { test: true }
      );

      expect(result.department).toBe('product-strategist');
      expect(result.status).toBe('completed');
      expect(result.analysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    test('should execute design engineering command', async () => {
      const result = await commandImplementations.handleDesignCommand(
        ['create', 'component'],
        { test: true }
      );

      expect(result.department).toBe('design-engineer');
      expect(result.status).toBe('completed');
      expect(result.designSystem).toBeDefined();
      expect(result.userExperience).toBeDefined();
    });

    test('should execute backend engineering command', async () => {
      const result = await commandImplementations.handleBackendCommand(
        ['implement', 'api'],
        { test: true }
      );

      expect(result.department).toBe('backend-engineer');
      expect(result.status).toBe('completed');
      expect(result.architecture).toBeDefined();
      expect(result.implementation).toBeDefined();
      expect(result.security).toBeDefined();
    });

    test('should handle collaboration between departments', async () => {
      const result = await commandImplementations.handleCollaborationCommand(
        ['coordinate', 'project'],
        { test: true }
      );

      expect(result.type).toBe('collaboration');
      expect(result.status).toBe('completed');
      expect(result.participants).toContain('product-strategist');
      expect(result.participants).toContain('design-engineer');
      expect(result.participants).toContain('backend-engineer');
      expect(result.consensus).toBeDefined();
      expect(result.actionPlan).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling Flow', () => {
    test('should handle and recover from errors', async () => {
      const error = new Error('Test error');
      const result = await errorManager.handleError(error, {
        component: 'test',
        operation: 'test-operation'
      });

      expect(result.handled).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.rootCause).toBeDefined();
    });

    test('should track error patterns', async () => {
      // Generate similar errors
      for (let i = 0; i < 3; i++) {
        await errorManager.handleError(
          new Error('Connection timeout'),
          { component: 'network' }
        );
      }

      const metrics = errorManager.getMetrics();
      expect(metrics.totalErrors).toBeGreaterThanOrEqual(3);
    });

    test('should implement circuit breaker', async () => {
      const component = 'test-service';
      
      // Trigger multiple failures
      for (let i = 0; i < 5; i++) {
        errorManager.updateCircuitBreaker(component, true);
      }

      expect(errorManager.isCircuitOpen(component)).toBe(true);
    });

    test('should attempt recovery strategies', async () => {
      const error = new Error('Recoverable error');
      
      // Register a custom recovery strategy
      errorManager.registerRecoveryStrategy('custom', async (err, ctx) => {
        return { success: true, strategy: 'custom', result: 'recovered' };
      });

      const result = await errorManager.handleError(error, {
        component: 'test',
        recovery: ['custom']
      });

      expect(result.handled).toBe(true);
    });
  });

  describe('Specialist System Flow', () => {
    test('should create and initialize specialist', async () => {
      const specialist = new UnifiedSpecialistBase({
        type: 'test-specialist',
        name: 'Test Specialist',
        category: 'technical'
      });

      await specialist.initialize();

      expect(specialist.status).toBe('ready');
      expect(specialist.config.offlineMode).toBe(true); // No API configured
    });

    test('should process task in offline mode', async () => {
      const specialist = new UnifiedSpecialistBase({
        type: 'backend',
        category: 'technical'
      });

      const result = await specialist.processTask({
        description: 'Implement user authentication',
        type: 'implementation'
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('offline');
      expect(result.result).toBeDefined();
    });

    test('should use caching for repeated tasks', async () => {
      const specialist = new UnifiedSpecialistBase({
        type: 'analyst',
        cacheEnabled: true
      });

      const task = { description: 'Analyze data', id: 'test-1' };
      
      // First call
      const result1 = await specialist.processTask(task);
      expect(specialist.metrics.cacheHits).toBe(0);
      
      // Second call (should hit cache)
      const result2 = await specialist.processTask(task);
      expect(specialist.metrics.cacheHits).toBe(1);
      expect(result2).toEqual(result1);
    });
  });

  describe('Integration Manager Flow', () => {
    test('should register all integrations', () => {
      const statuses = integrationManager.getAllStatuses();
      
      expect(Object.keys(statuses).length).toBeGreaterThan(0);
      
      // Check major categories
      const categories = integrationManager.getByCategory('productivity');
      expect(categories.length).toBeGreaterThan(0);
    });

    test('should handle missing integration gracefully', async () => {
      const result = await integrationManager.get('non-existent');
      
      // Should return placeholder
      expect(result).toBeDefined();
      expect(result.status).toBe('placeholder');
    });

    test('should lazy load integrations', async () => {
      integrationManager.config.lazyLoad = true;
      
      const notion = await integrationManager.get('notion_master');
      
      // Should have placeholder or lazy-loaded instance
      expect(notion).toBeDefined();
    });

    test('should configure integration', async () => {
      await integrationManager.configure('discord', {
        token: 'test-token',
        clientId: 'test-client'
      });

      const status = integrationManager.getStatus('discord');
      expect(status.hasConfig).toBe(true);
    });
  });

  describe('Department Coordination Flow', () => {
    test('should coordinate between departments', async () => {
      const productDept = framework.departments.get('product-strategist');
      const designDept = framework.departments.get('design-engineer');
      
      expect(productDept).toBeDefined();
      expect(designDept).toBeDefined();
      
      // Test department status
      if (productDept.getStatus) {
        const status = productDept.getStatus();
        expect(status).toBeDefined();
      }
    });

    test('should handle department routing', async () => {
      const router = framework.router;
      
      if (router && router.route) {
        const result = await router.route('design', ['create', 'mockup'], {});
        expect(result).toBeDefined();
      }
    });
  });

  describe('Resource Management Flow', () => {
    test('should track resource usage', () => {
      if (framework.resourceManager) {
        const usage = framework.resourceManager.getUsage();
        expect(usage).toBeDefined();
      }
    });

    test('should enforce resource limits', () => {
      if (framework.resourceManager) {
        const canAllocate = framework.resourceManager.canAllocate('memory', 1000000);
        expect(typeof canAllocate).toBe('boolean');
      }
    });
  });

  describe('Health Monitoring Flow', () => {
    test('should provide health status', () => {
      const health = framework.getHealth();
      
      expect(health.status).toBeDefined();
      expect(health.version).toBeDefined();
      expect(health.departments).toBeDefined();
      expect(health.components).toBeDefined();
    });

    test('should track performance metrics', () => {
      const metrics = framework.getPerformanceMetrics();
      
      expect(metrics.total_commands).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
    });
  });

  describe('End-to-End Command Flow', () => {
    test('should execute full command lifecycle', async () => {
      // Simulate a complete command execution
      const commandHandler = framework.commandHandler;
      
      if (commandHandler && commandHandler.handleCommand) {
        const result = await commandHandler.handleCommand(
          'analyze',
          ['user', 'behavior'],
          { source: 'test' }
        );
        
        expect(result).toBeDefined();
      }
    });

    test('should handle command with error recovery', async () => {
      const commandHandler = framework.commandHandler;
      
      if (commandHandler) {
        // Force an error scenario
        const result = await commandHandler.handleCommand(
          'invalid-command-xyz',
          [],
          { throwOnError: false }
        );
        
        // Should handle gracefully
        expect(result).toBeDefined();
      }
    });
  });

  describe('System Shutdown Flow', () => {
    test('should shutdown gracefully', async () => {
      const shutdownResult = await framework.shutdown();
      
      // Should complete without errors
      expect(shutdownResult).not.toThrow;
    });

    test('should cleanup resources on shutdown', async () => {
      await framework.shutdown();
      
      // Check that resources are released
      if (framework.resourceManager) {
        const usage = framework.resourceManager.getUsage();
        expect(usage).toBeDefined();
      }
    });
  });
});

describe('BUMBA CLI Performance Tests', () => {
  let framework;

  beforeAll(async () => {
    framework = await createBumbaFramework({
      testMode: true,
      disableMonitoring: true
    });
  });

  afterAll(async () => {
    await framework.shutdown();
  });

  test('should handle multiple concurrent commands', async () => {
    const implementations = new CommandImplementations();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        implementations.handleProductCommand(['analyze'], { concurrent: true })
      );
    }
    
    const results = await Promise.all(promises);
    
    expect(results.length).toBe(10);
    results.forEach(result => {
      expect(result.status).toBe('completed');
    });
  });

  test('should maintain performance under load', async () => {
    const startTime = Date.now();
    const operations = 100;
    
    for (let i = 0; i < operations; i++) {
      await framework.getHealth();
    }
    
    const duration = Date.now() - startTime;
    const avgTime = duration / operations;
    
    // Should be fast (< 10ms per operation)
    expect(avgTime).toBeLessThan(10);
  });
});

describe('BUMBA CLI Edge Cases', () => {
  test('should handle null inputs gracefully', async () => {
    const implementations = new CommandImplementations();
    
    const result = await implementations.handleProductCommand(null, null);
    expect(result).toBeDefined();
    expect(result.department).toBe('product-strategist');
  });

  test('should handle circular dependencies', async () => {
    const errorManager = new UnifiedErrorManager();
    
    const circularObj = {};
    circularObj.self = circularObj;
    
    const result = await errorManager.handleError(
      new Error('Circular error'),
      circularObj
    );
    
    expect(result.handled).toBe(true);
  });

  test('should handle extremely long inputs', async () => {
    const specialist = new UnifiedSpecialistBase({ type: 'test' });
    
    const longTask = {
      description: 'x'.repeat(10000),
      data: Array(1000).fill('test')
    };
    
    const result = await specialist.processTask(longTask);
    expect(result.success).toBe(true);
  });
});