/**
 * End-to-End Integration Tests for BUMBA Framework
 */

const { createBumbaFramework } = require('../../src/core/bumba-framework-2');

describe('BUMBA Framework E2E Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let framework;

  beforeAll(async () => {
    // Create framework with minimal initialization
    framework = await createBumbaFramework({ 
      skipInit: true 
    });
  });

  afterAll(async () => {
    if (framework && framework.shutdown) {
      await framework.shutdown();
    }
  });

  describe('Command Execution Flow', () => {
    test('should execute implement command end-to-end', async () => {
      const result = await framework.processCommand('implement', ['test feature'], {
        test: true
      });
      
      expect(result).toBeDefined();
      expect(result.command).toBe('implement');
      expect(result.status).toBeDefined();
    });

    test('should execute analyze command end-to-end', async () => {
      const result = await framework.processCommand('analyze', ['security'], {
        test: true
      });
      
      expect(result).toBeDefined();
      expect(result.command).toBe('analyze');
      expect(result.status).toBeDefined();
    });
  });

  describe('Multi-Agent Coordination', () => {
    test('should coordinate multiple departments', async () => {
      const result = await framework.processCommand('implement', 
        ['full-stack application with frontend and backend'], 
        { test: true }
      );
      
      expect(result).toBeDefined();
      expect(result.command).toBe('implement');
    });

    test('should handle executive mode activation', async () => {
      const strategicDept = framework.departments.get('strategic');
      expect(strategicDept.canBeCEO).toBe(true);
      
      // Test executive mode capability exists
      expect(typeof framework.activateExecutiveMode).toBe('function');
    });
  });

  describe('Hook System Integration', () => {
    test('should have hook points available', async () => {
      // Check that hook systems are initialized
      expect(framework.orchestrationEnabled).toBeDefined();
      expect(framework.collaborationEnhanced).toBeDefined();
    });
  });

  describe('Framework Status', () => {
    test('should return complete framework status', async () => {
      const status = await framework.getFrameworkStatus();
      
      expect(status.framework).toBe('BUMBA');
      expect(status.version).toBe('2.0.0');
      expect(status.departments).toBeDefined();
      expect(Object.keys(status.departments).length).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid commands gracefully', async () => {
      const result = await framework.processCommand('invalid-command', [], {});
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });

    test('should handle missing arguments', async () => {
      const result = await framework.processCommand('implement', [], {});
      
      expect(result).toBeDefined();
      expect(result.command).toBe('implement');
    });
  });

  describe('Performance', () => {
    test('should execute commands within acceptable time', async () => {
      const startTime = Date.now();
      
      await framework.processCommand('status', [], {});
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
