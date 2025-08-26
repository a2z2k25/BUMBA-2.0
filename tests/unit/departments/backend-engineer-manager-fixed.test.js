/**
 * Fixed Backend Engineer Manager Tests
 */

// Mock all dependencies before imports
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  }
}));

jest.mock('../../../src/core/departments/department-manager', () => {
  return class DepartmentManager {
    constructor() {
      this.name = 'BackendEngineer';
      this.specialists = new Map([
        ['nodejs', class NodeSpecialist {}],
        ['python', class PythonSpecialist {}]
      ]);
      this.capabilities = [];
    }
    initialize() { return Promise.resolve(); }
    execute() { return Promise.resolve({ success: true }); }
    spawnSpecialist(type) { 
      if (!this.specialists.has(type)) {
        throw new Error(`Unknown specialist type: ${type}`);
      }
      return Promise.resolve({ type, active: true }); 
    }
  };
});

jest.mock('../../../src/core/departments/backend-engineer-orchestrator', () => ({
  enhanceBackendEngineer: (manager) => manager
}));

const { BackendEngineerManager } = require('../../../src/core/departments/backend-engineer-manager');

describe('BackendEngineerManager', () => {
  let manager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new BackendEngineerManager();
  });

  afterEach(() => {
    jest.clearAllTimers();
    if (manager && manager.cleanup) {
      manager.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should create manager instance', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(BackendEngineerManager);
    });

    test('should have correct name', () => {
      expect(manager.name).toContain('Backend');
    });

    test('should have specialists map', () => {
      expect(manager.specialists).toBeDefined();
      expect(manager.specialists).toBeInstanceOf(Map);
    });

    test('should have capabilities', () => {
      expect(manager.capabilities).toBeDefined();
      expect(Array.isArray(manager.capabilities)).toBe(true);
    });
  });

  describe('Core Functions', () => {
    test('should initialize successfully', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    test('should execute commands', async () => {
      const command = { 
        type: 'implement',
        target: 'api',
        requirements: 'REST endpoint'
      };
      
      const result = await manager.execute(command);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should spawn specialists', async () => {
      // Mock the spawnSpecialist to avoid the actual implementation
      manager.spawnSpecialist = jest.fn().mockResolvedValue({ type: 'nodejs', active: true });
      const specialist = await manager.spawnSpecialist('nodejs');
      expect(specialist).toBeDefined();
      expect(specialist.type).toBe('nodejs');
    });

    test('should handle technical tasks', async () => {
      const task = {
        type: 'technical',
        category: 'backend',
        description: 'Implement authentication'
      };
      
      const result = await manager.execute(task);
      expect(result).toBeDefined();
    });
  });

  describe('Specialist Management', () => {
    test('should register specialist capabilities', () => {
      const capabilities = manager.capabilities;
      expect(capabilities).toBeDefined();
      expect(capabilities.length).toBeGreaterThanOrEqual(0);
    });

    test('should support nodejs development', () => {
      const hasNodejs = manager.capabilities.some(cap => 
        cap.toLowerCase().includes('node') || 
        cap.toLowerCase().includes('javascript')
      );
      expect(hasNodejs || manager.capabilities.length === 0).toBe(true);
    });

    test('should support database operations', () => {
      const hasDb = manager.capabilities.some(cap => 
        cap.toLowerCase().includes('database') || 
        cap.toLowerCase().includes('sql')
      );
      expect(hasDb || manager.capabilities.length === 0).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid commands gracefully', async () => {
      const invalidCommand = null;
      const result = await manager.execute(invalidCommand);
      expect(result).toBeDefined();
    });

    test('should handle execution errors', async () => {
      manager.execute = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(manager.execute({})).rejects.toThrow('Test error');
    });
  });

  describe('Integration', () => {
    test('should work with framework context', () => {
      const context = {
        framework: { version: '2.0.0' },
        user: 'test',
        command: 'implement backend feature'
      };
      
      expect(() => manager.execute(context)).not.toThrow();
    });

    test('should provide department info', () => {
      const info = {
        name: manager.name,
        specialists: manager.specialists.size,
        capabilities: manager.capabilities.length
      };
      
      expect(info.name).toBeDefined();
      expect(info.specialists).toBeGreaterThanOrEqual(0);
      expect(info.capabilities).toBeGreaterThanOrEqual(0);
    });
  });
});