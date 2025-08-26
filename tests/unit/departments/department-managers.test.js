/**
 * Unit tests for BUMBA Department Managers
 */

describe('Department Managers', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('ProductStrategistManager', () => {
    test('should initialize with correct capabilities', async () => {
      const ProductStrategistManager = require('../../../src/core/departments/product-strategist-manager');
      const manager = new ProductStrategistManager();
      
      expect(manager.name).toBe('Product-Strategist Department');
      expect(manager.canBeCEO).toBe(true);
      expect(manager.capabilities).toBeDefined();
    });

    test('should have CEO activation capability', async () => {
      const ProductStrategistManager = require('../../../src/core/departments/product-strategist-manager');
      const manager = new ProductStrategistManager();
      
      expect(typeof manager.activateExecutiveMode).toBe('function');
      expect(typeof manager.deactivateExecutiveMode).toBe('function');
    });
  });

  describe('DesignEngineerManager', () => {
    test('should initialize with correct capabilities', async () => {
      const DesignEngineerManager = require('../../../src/core/departments/design-engineer-manager');
      const manager = new DesignEngineerManager();
      
      expect(manager.name).toBe('Design-Engineer Department');
      expect(manager.capabilities).toBeDefined();
      expect(manager.capabilities['ui-design']).toBeDefined();
    });
  });

  describe('BackendEngineerManager', () => {
    test('should initialize with correct capabilities', async () => {
      const BackendEngineerManager = require('../../../src/core/departments/backend-engineer-manager');
      const manager = new BackendEngineerManager();
      
      expect(manager.name).toBe('Backend-Engineer Department');
      expect(manager.capabilities).toBeDefined();
      expect(manager.capabilities['api-development']).toBeDefined();
    });
  });

  describe('Specialist Spawning', () => {
    test('should spawn specialists on demand', async () => {
      const BackendEngineerManager = require('../../../src/core/departments/backend-engineer-manager');
      const manager = new BackendEngineerManager();
      
      manager.lifecycleManager = {
        spawnSpecialist: jest.fn().mockResolvedValue({
          id: 'test-specialist',
          type: 'security-specialist'
        })
      };
      
      const specialist = await manager.spawnSpecialist('security-specialist', {});
      expect(specialist).toBeDefined();
      expect(specialist.type).toBe('security-specialist');
    });
  });
});
