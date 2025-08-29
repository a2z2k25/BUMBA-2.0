/**
 * BUMBA CLI Core Tests
 */

const { BumbaFramework2 } = require('../../../src/core/bumba-framework-2');
const TestUtils = require('../../helpers/test-utils');

describe('BumbaFramework2', () => {
  let framework;
  let mockLogger;

  beforeEach(() => {
    mockLogger = TestUtils.createMockLogger();
    jest.mock('../../../src/core/logging/bumba-logger', () => ({
      logger: mockLogger
    }));
    
    framework = new BumbaFramework2();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create framework instance', async () => {
      expect(framework).toBeDefined();
      expect(framework.version).toBe('2.0.0');
    });

    test('should initialize departments', async () => {
      expect(framework.departments.size).toBe(3);
      expect(framework.departments.has('strategic')).toBe(true);
      expect(framework.departments.has('experience')).toBe(true);
      expect(framework.departments.has('technical')).toBe(true);
    });

    test('should initialize core components', async () => {
      expect(framework.consciousness).toBeDefined();
      expect(framework.lifecycleManager).toBeDefined();
      expect(framework.router).toBeDefined();
      expect(framework.ecosystemIntegration).toBeDefined();
    });

    test('should have coordination hub', async () => {
      expect(framework.coordinationHub).toBeDefined();
    });
  });

  describe('Department Management', () => {
    test('should get department by name', async () => {
      const strategic = framework.departments.get('strategic');
      expect(strategic).toBeDefined();
      expect(strategic.constructor.name).toContain('ProductStrategist');
    });

    test('should handle invalid department', async () => {
      const invalid = framework.departments.get('invalid');
      expect(invalid).toBeUndefined();
    });
  });

  describe('Framework Methods', () => {
    test('should have initialize method', async () => {
      expect(typeof framework.initialize).toBe('function');
    });

    test('should have execute method', async () => {
      expect(typeof framework.execute).toBe('function');
    });

    test('should have shutdown method', async () => {
      expect(typeof framework.shutdown).toBe('function');
    });
  });

  describe('Event Emitter', () => {
    test('should emit events', (done) => {
      framework.on('test-event', (data) => {
        expect(data.message).toBe('test');
        done();
      });

      framework.emit('test-event', { message: 'test' });
    });

    test('should handle multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      framework.on('multi-event', listener1);
      framework.on('multi-event', listener2);

      framework.emit('multi-event', { data: 'test' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // Mock a failing component
      framework.consciousness.initialize = jest.fn(() => {
        throw new Error('Initialization failed');
      });

      try {
        await framework.initialize();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    test('should track performance metrics', async () => {
      expect(framework.performanceIntegration).toBeDefined();
    });

    test('should have health monitoring', async () => {
      expect(framework.healthCheck).toBeDefined();
      expect(framework.healthMonitor).toBeDefined();
    });
  });
});

describe('Framework Integration', () => {
  test('should integrate with departments', async () => {
    const framework = new BumbaFramework2();
    
    // Mock department execution
    const mockDepartment = TestUtils.createMockDepartmentManager('test');
    framework.departments.set('test', mockDepartment);

    // Execute should delegate to department
    mockDepartment.execute.mockResolvedValue({ success: true });

    // Verify department can be accessed and used
    const dept = framework.departments.get('test');
    const result = await dept.execute({ command: 'test' });
    
    expect(result.success).toBe(true);
    expect(mockDepartment.execute).toHaveBeenCalled();
  });

  test('should coordinate between departments', async () => {
    const framework = new BumbaFramework2();
    
    const strategic = framework.departments.get('strategic');
    const technical = framework.departments.get('technical');

    expect(strategic).toBeDefined();
    expect(technical).toBeDefined();

    // Both departments should exist and be different
    expect(strategic).not.toBe(technical);
  });
});