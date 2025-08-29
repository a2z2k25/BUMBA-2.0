/**
 * BUMBA CLI Core Tests
 */

describe('BUMBA CLI Core', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let BumbaFramework;
  let framework;

  beforeEach(() => {
    // Clear module cache
    jest.resetModules();
    
    // Mock dependencies
    jest.mock('../../../src/core/logging/bumba-logger', () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      }
    }));

    jest.mock('../../../src/core/command-handler', () => {
      return jest.fn().mockImplementation(() => ({
        registerDepartment: jest.fn(),
        orchestrationEnabled: false,
        handlers: new Map()
      }));
    });

    jest.mock('../../../src/core/unified-routing-system', () => ({
      UnifiedRoutingSystem: jest.fn().mockImplementation(() => ({
        initializeRouting: jest.fn(),
        route: jest.fn().mockResolvedValue({ success: true })
      }))
    }));

    BumbaFramework = require('../../../src/core/bumba-framework-2');
  });

  describe('initialization', () => {
    test('should create framework instance', async () => {
      framework = new BumbaFramework();
      expect(framework).toBeDefined();
      expect(framework.version).toBe('2.0.0');
    });

    test('should initialize async components', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      expect(framework.initialized).toBe(true);
    });

    test('should register departments', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      
      expect(framework.departments).toBeDefined();
      expect(framework.departments.size).toBeGreaterThan(0);
    });
  });

  describe('command routing', () => {
    test('should route commands to appropriate department', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      
      const result = await framework.handleCommand('implement', 'test feature');
      expect(result).toBeDefined();
    });

    test('should handle invalid commands gracefully', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      
      const result = await framework.handleCommand('invalid-command', 'test');
      expect(result).toBeDefined();
    });
  });

  describe('specialist management', () => {
    test('should have specialist registry', async () => {
      framework = new BumbaFramework();
      expect(framework.specialistRegistry).toBeDefined();
    });

    test('should count specialists correctly', async () => {
      framework = new BumbaFramework();
      const count = framework.getSpecialistCount();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(50); // Sanity check
    });
  });

  describe('health monitoring', () => {
    test('should provide health status', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      
      const health = await framework.getHealthStatus();
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
    });

    test('should track performance metrics', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      
      const metrics = await framework.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('should handle initialization errors', async () => {
      // Force an error
      jest.spyOn(console, 'error').mockImplementation();
      
      framework = new BumbaFramework();
      framework.initializeFrameworkConnections = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(framework.initialize()).rejects.toThrow();
    });

    test('should provide error recovery', async () => {
      framework = new BumbaFramework();
      await framework.initialize();
      
      const recovery = framework.getErrorRecoveryStatus();
      expect(recovery).toBeDefined();
    });
  });
});