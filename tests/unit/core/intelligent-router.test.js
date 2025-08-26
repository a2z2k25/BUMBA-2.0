/**
 * Tests for BUMBA Intelligent Router (UnifiedRoutingSystem wrapper)
 */

// Mock dependencies
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock department managers
const mockProcessTask = jest.fn();
const mockDepartment = {
  processTask: mockProcessTask,
  getStatus: jest.fn(() => ({ status: 'active' }))
};

// Import after mocks
const { BumbaIntelligentRouter } = require('../../../src/core/deprecated/intelligent-router');
const { UnifiedRoutingSystem } = require('../../../src/core/unified-routing-system');

describe('BumbaIntelligentRouter', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let router;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock implementations
    mockProcessTask.mockResolvedValue({
      success: true,
      result: 'Task completed'
    });
    
    router = new BumbaIntelligentRouter();
    
    // Register mock departments
    router.registerDepartment('strategic', mockDepartment);
    router.registerDepartment('technical', mockDepartment);
    router.registerDepartment('experience', mockDepartment);
  });

  describe('Initialization', () => {
    test('should extend UnifiedRoutingSystem', async () => {
      expect(router instanceof UnifiedRoutingSystem).toBe(true);
    });

    test('should have department management capabilities', async () => {
      expect(router.departments).toBeDefined();
      expect(router.registerDepartment).toBeDefined();
      expect(router.getDepartments).toBeDefined();
    });

    test('should initialize with proper logging', async () => {
      const { logger } = require('../../../src/core/logging/bumba-logger');
      const newRouter = new BumbaIntelligentRouter();
      expect(logger.info).toHaveBeenCalledWith('🟢 BumbaIntelligentRouter initialized (using UnifiedRoutingSystem)');
    });
  });

  describe('Department Management', () => {
    test('should register departments', async () => {
      expect(router.getDepartments()).toEqual(['strategic', 'technical', 'experience']);
    });

    test('should track department statistics', async () => {
      expect(router.stats.departmentRoutings).toEqual({
        strategic: 0,
        technical: 0,
        experience: 0
      });
    });
  });

  describe('Routing', () => {
    test('should route to appropriate department', async () => {
      const result = await router.route('implement', ['api'], {});
      
      expect(result).toBeDefined();
      expect(result.departments).toBeDefined();
      expect(result.mode).toBeDefined();
    });

    test('should analyze intent correctly', async () => {
      const result = await router.route('design', ['ui'], {});
      
      expect(result.departments).toContain('experience');
    });

    test('should detect executive mode for complex tasks', async () => {
      const result = await router.route('strategy', ['company roadmap'], {});
      
      expect(result.departments).toContain('strategic');
    });
  });

  describe('Task Execution', () => {
    test('should execute simple mode tasks', async () => {
      const task = {
        command: 'test',
        args: ['unit'],
        description: 'test unit'
      };
      
      const routing = {
        departments: ['technical'],
        specialists: ['tester'],
        mode: 'simple'
      };
      
      const result = await router.executeRouting(task, routing);
      
      expect(result.mode).toBe('simple');
      expect(mockProcessTask).toHaveBeenCalled();
    });

    test('should execute complex mode with multiple departments', async () => {
      const task = {
        command: 'build',
        args: ['platform'],
        description: 'build platform'
      };
      
      const routing = {
        departments: ['technical', 'experience'],
        specialists: ['backend', 'frontend'],
        mode: 'complex'
      };
      
      const result = await router.executeRouting(task, routing);
      
      expect(result.mode).toBe('complex');
      expect(result.results).toHaveLength(2);
    });

    test('should execute executive mode', async () => {
      const task = {
        command: 'strategy',
        args: ['roadmap'],
        description: 'strategy roadmap'
      };
      
      const routing = {
        departments: ['strategic'],
        specialists: [],
        mode: 'executive'
      };
      
      const result = await router.executeRouting(task, routing);
      
      expect(result.mode).toBe('executive');
      expect(mockProcessTask).toHaveBeenCalledWith(
        task,
        expect.objectContaining({ executiveMode: true })
      );
    });

    test('should handle missing departments gracefully', async () => {
      const task = {
        command: 'test',
        args: [],
        description: 'test'
      };
      
      const routing = {
        departments: ['nonexistent'],
        specialists: [],
        mode: 'simple'
      };
      
      await expect(router.executeRouting(task, routing))
        .rejects.toThrow('No department available');
    });
  });

  describe('Statistics', () => {
    test('should track routing statistics', async () => {
      await router.route('test', [], {});
      
      const stats = router.getStatistics();
      expect(stats.totalRoutings).toBeGreaterThan(0);
    });

    test('should include department statistics', async () => {
      const stats = router.getStatistics();
      
      expect(stats.departmentCount).toBe(3);
      expect(stats.departmentStats).toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should export configuration', async () => {
      const config = router.exportConfig();
      expect(config).toBeDefined();
      expect(JSON.parse(config)).toHaveProperty('complexityThresholds');
    });

    test('should import configuration', async () => {
      const newConfig = {
        complexityThresholds: {
          simple: 0.2,
          moderate: 0.5,
          complex: 0.7,
          executive: 0.85
        }
      };
      
      router.importConfig(JSON.stringify(newConfig));
      const config = JSON.parse(router.exportConfig());
      
      expect(config.complexityThresholds.simple).toBe(0.2);
    });
  });

  describe('Memory Management', () => {
    test('should clear routing memory', async () => {
      router.clearMemory();
      
      const stats = router.getStatistics();
      expect(stats.memorySize).toBe(0);
    });
  });
});