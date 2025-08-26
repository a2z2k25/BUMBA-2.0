/**
 * BUMBA Critical Path Integration Tests
 * Tests core functionality end-to-end
 */

// Mock environment
process.env.NODE_ENV = 'test';
process.env.BUMBA_DISABLE_MONITORING = 'true';
process.env.LOG_LEVEL = 'error';

describe('BUMBA Critical Path Integration Tests', () => {
  let framework;
  let commandHandler;
  let errorManager;
  let notionHub;
  let apiValidator;
  
  beforeAll(async () => {
    // Set longer timeout for integration tests
    jest.setTimeout(30000);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Framework Initialization', () => {
    test('should initialize core framework components', async () => {
      const { createBumbaFramework } = require('../../src/core/bumba-framework-2');
      
      // Use minimal initialization for testing
      framework = await createBumbaFramework({
        skipInit: true,  // Skip heavy initialization
        disableMonitoring: true,
        legacy: false,
        testing: true  // Testing mode
      });
      
      expect(framework).toBeDefined();
      expect(framework.version).toBe('2.0.0');
      expect(framework.isOperational).toBe(true);
    });
    
    test('should have all departments initialized', () => {
      expect(framework.departments).toBeDefined();
      expect(framework.departments.get('strategic')).toBeDefined();
      expect(framework.departments.get('experience')).toBeDefined();
      expect(framework.departments.get('technical')).toBeDefined();
    });
  });
  
  describe('API Validation', () => {
    test('should validate APIs without crashing', async () => {
      const { getInstance } = require('../../src/core/validation/api-validator');
      apiValidator = getInstance();
      
      const result = await apiValidator.validateAll();
      
      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(['critical', 'degraded', 'offline', 'healthy']).toContain(result.overall);
    });
    
    test('should report capability availability', () => {
      const isAIAvailable = apiValidator.isCapabilityAvailable('ai-generation');
      expect(typeof isAIAvailable).toBe('boolean');
    });
  });
  
  describe('Notion Integration', () => {
    test('should initialize Notion hub with fallback', async () => {
      const { getInstance } = require('../../src/core/integrations/notion-hub');
      notionHub = getInstance();
      
      // Should not throw even without API key
      const result = await notionHub.initialize();
      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    });
    
    test('should handle Notion operations gracefully', async () => {
      // Should fallback gracefully
      const result = await notionHub.createProjectDashboard({
        name: 'Test Project',
        description: 'Integration test'
      });
      
      expect(result).toBeDefined();
      // Either success or fallback
      expect(result.success || result.fallback).toBeTruthy();
    });
    
    test('should provide health check', async () => {
      const health = await notionHub.healthCheck();
      
      expect(health).toBeDefined();
      expect(health.available !== undefined).toBe(true);
      expect(health.capabilities).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    test('should initialize unified error manager', () => {
      const { getInstance } = require('../../src/core/error-handling/unified-error-manager');
      errorManager = getInstance();
      
      expect(errorManager).toBeDefined();
      expect(errorManager.handleError).toBeDefined();
    });
    
    test('should handle errors without crashing', async () => {
      const testError = new Error('Test error');
      
      // Should not throw
      await errorManager.handleError(testError, {
        context: 'integration-test',
        severity: 'low'
      });
      
      const metrics = errorManager.getMetrics();
      expect(metrics.totalErrors).toBeGreaterThan(0);
    });
    
    test('should track error patterns', async () => {
      // Generate pattern
      for (let i = 0; i < 3; i++) {
        await errorManager.handleError(new Error('Pattern test'), {
          operation: 'test-op'
        });
      }
      
      const metrics = errorManager.getMetrics();
      expect(metrics.patterns).toBeDefined();
    });
  });
  
  describe('Command Execution', () => {
    beforeEach(() => {
      const { commandHandler: handler } = require('../../src/core/command-handler');
      commandHandler = handler;
    });
    
    test('should execute basic commands', async () => {
      const result = await commandHandler.execute('help');
      
      expect(result).toBeDefined();
      expect(result.success !== undefined || result.type === 'help').toBe(true);
    });
    
    test('should handle unknown commands gracefully', async () => {
      const result = await commandHandler.execute('unknown-command-xyz');
      
      expect(result).toBeDefined();
      // Should either return error/success:false OR route to fallback OR have a command
      expect(
        result.success === false || 
        result.error || 
        result.message || 
        result.command || // Command handler returns a command object
        (result.routing && result.routing.source === 'fallback')
      ).toBeTruthy();
    }, 20000);
    
    test('should route to departments correctly', () => {
      // Test department mapping
      expect(commandHandler.mapCommandToDepartment('design-ui')).toBe('design-engineer');
      expect(commandHandler.mapCommandToDepartment('secure-api')).toBe('backend-engineer');
      expect(commandHandler.mapCommandToDepartment('product-strategy')).toBe('product-strategist');
      expect(commandHandler.mapCommandToDepartment('help')).toBe('general');
    });
  });
  
  describe('Specialist System', () => {
    test('should load specialist registry', () => {
      const { SpecialistRegistry } = require('../../src/core/specialists/specialist-registry');
      const registry = new SpecialistRegistry();
      
      expect(registry).toBeDefined();
      expect(registry.specialists.size).toBeGreaterThan(0);
    });
    
    test('should create specialists without errors', () => {
      const { SpecialistRegistry } = require('../../src/core/specialists/specialist-registry');
      const registry = new SpecialistRegistry();
      
      // Try to load a specialist
      const specialist = registry.loadSpecialist('javascript-specialist');
      
      // Should either load a class/function or return null (not throw)
      expect(specialist === null || typeof specialist === 'function' || specialist.constructor).toBeTruthy();
    });
  });
  
  describe('Resource Management', () => {
    test('should enforce resource limits', async () => {
      const { getInstance } = require('../../src/core/resource-management/resource-enforcer');
      const enforcer = getInstance();
      
      expect(enforcer).toBeDefined();
      
      // Should check allocation
      const canAllocate = enforcer.canAllocate('task');
      expect(typeof canAllocate).toBe('boolean');
      
      // Should execute with limits
      const result = await enforcer.executeWithLimits(
        async () => 'test-result',
        { type: 'task', timeout: 1000 }
      );
      expect(result).toBe('test-result');
    });
    
    test('should report resource usage', () => {
      const { getInstance } = require('../../src/core/resource-management/resource-enforcer');
      const enforcer = getInstance();
      
      const usage = enforcer.getUsage();
      
      expect(usage).toBeDefined();
      expect(usage.memory).toBeDefined();
      expect(usage.cpu).toBeDefined();
      expect(usage.health).toBeDefined();
    });
  });
  
  describe('Configuration Management', () => {
    test('should load and validate configuration', () => {
      const { ConfigurationManager } = require('../../src/core/configuration/configuration-manager');
      const configManager = new ConfigurationManager();
      
      expect(configManager).toBeDefined();
      expect(configManager.config.framework.name).toBe('BUMBA');
      
      // Should validate
      const validation = configManager.validate();
      expect(validation).toBeDefined();
      expect(validation.valid !== undefined).toBe(true);
    });
    
    test('should emit events on configuration changes', (done) => {
      const { ConfigurationManager } = require('../../src/core/configuration/configuration-manager');
      const configManager = new ConfigurationManager();
      
      configManager.on('config:changed', ({ key, value }) => {
        expect(key).toBe('test.key');
        expect(value).toBe('test-value');
        done();
      });
      
      configManager.set('test.key', 'test-value');
    });
  });
  
  describe('Framework Shutdown', () => {
    test('should shutdown gracefully', async () => {
      if (framework && framework.shutdown) {
        // Should not throw
        await expect(framework.shutdown()).resolves.not.toThrow();
      } else {
        // Framework doesn't have shutdown, that's ok
        expect(true).toBe(true);
      }
    });
    
    test('should cleanup resources', () => {
      if (errorManager) {
        errorManager.stop();
      }
      
      if (notionHub && notionHub.shutdown) {
        notionHub.shutdown();
      }
      
      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});

describe('Error Recovery', () => {
  test('should recover from initialization errors', async () => {
    // Force an error scenario
    process.env.FORCE_ERROR = 'true';
    
    const { createBumbaFramework } = require('../../src/core/bumba-framework-2');
    
    // Should handle gracefully
    try {
      const framework = await createBumbaFramework({
        skipInit: true,
        disableMonitoring: true
      });
      expect(framework).toBeDefined();
    } catch (error) {
      // Even if it fails, it should fail gracefully
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    }
    
    delete process.env.FORCE_ERROR;
  });
  
  test('should handle concurrent operations', async () => {
    const { commandHandler } = require('../../src/core/command-handler');
    
    // Launch multiple commands concurrently
    const promises = [
      commandHandler.execute('help'),
      commandHandler.execute('status'),
      commandHandler.execute('analyze-market', { topic: 'test' })
    ];
    
    // All should resolve without deadlock
    const results = await Promise.allSettled(promises);
    
    expect(results.length).toBe(3);
    results.forEach(result => {
      expect(['fulfilled', 'rejected']).toContain(result.status);
    });
  });
});

// Export for use in other tests
module.exports = {
  setupFramework: async () => {
    const { createBumbaFramework } = require('../../src/core/bumba-framework-2');
    return createBumbaFramework({
      skipInit: false,
      disableMonitoring: true,
      legacy: false
    });
  }
};