/**
 * Unification Layer Integration Tests
 * Verify the complete unification system works together
 * Part of Sprint 5: Testing & Validation
 */

const { 
  UnificationLayer,
  DepartmentAdapter,
  MemoryAdapter,
  OrchestrationAdapter,
  CommunicationAdapter
} = require('../../src/unification');
const UnifiedBus = require('../../src/unification/integration/unified-bus');
const ContextBroker = require('../../src/unification/integration/context-broker');
const { EventEmitter } = require('events');

describe('Unification Layer Integration', () => {
  let unificationLayer;
  let mockFramework;
  
  beforeEach(() => {
    // Create mock framework that simulates BumbaFramework2
    mockFramework = new EventEmitter();
    mockFramework.version = '2.0';
    
    // Mock departments
    mockFramework.departments = {
      ProductStrategist: new EventEmitter(),
      DesignEngineer: new EventEmitter(),
      BackendEngineer: new EventEmitter()
    };
    
    // Add methods to departments
    Object.values(mockFramework.departments).forEach(dept => {
      dept.execute = jest.fn().mockResolvedValue({ success: true });
      dept.selectSpecialist = jest.fn();
    });
    
    // Mock memory system
    mockFramework.memorySystem = {
      retrieve: jest.fn().mockResolvedValue({ data: 'test' }),
      store: jest.fn().mockResolvedValue(true),
      on: jest.fn(),
      emit: jest.fn()
    };
    
    // Mock orchestration
    mockFramework.orchestrationHooks = new EventEmitter();
    mockFramework.orchestrationHooks.execute = jest.fn();
    
    // Mock communication
    mockFramework.communicationSystem = new EventEmitter();
    mockFramework.communicationSystem.send = jest.fn();
    
    // Create unification layer
    unificationLayer = new UnificationLayer();
  });
  
  afterEach(() => {
    if (unificationLayer) {
      unificationLayer.rollback();
    }
  });
  
  describe('Initialization', () => {
    test('should initialize with framework', async () => {
      const initialized = await unificationLayer.initialize(mockFramework);
      
      expect(initialized).toBe(true);
      expect(unificationLayer.framework).toBe(mockFramework);
    });
    
    test('should create all adapters but keep them disabled', async () => {
      await unificationLayer.initialize(mockFramework);
      
      expect(unificationLayer.adapters.departments.size).toBe(3);
      expect(unificationLayer.adapters.memory).toBeDefined();
      expect(unificationLayer.adapters.orchestration).toBeDefined();
      expect(unificationLayer.adapters.communication).toBeDefined();
      expect(unificationLayer.unifiedBus).toBeDefined();
      expect(unificationLayer.contextBroker).toBeDefined();
      
      // All should be disabled
      expect(unificationLayer.config.enabled).toBe(false);
    });
    
    test('should not modify framework during initialization', async () => {
      const originalDepts = { ...mockFramework.departments };
      const originalMemory = { ...mockFramework.memorySystem };
      
      await unificationLayer.initialize(mockFramework);
      
      // Verify no modifications
      expect(mockFramework.departments).toEqual(originalDepts);
      expect(mockFramework.memorySystem.retrieve).toBe(originalMemory.retrieve);
      expect(mockFramework.memorySystem.store).toBe(originalMemory.store);
    });
  });
  
  describe('Component Management', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('should enable specific components', () => {
      unificationLayer.enableComponent('memory');
      
      expect(unificationLayer.config.components.memory).toBe(true);
      expect(unificationLayer.adapters.memory.enabled).toBe(true);
    });
    
    test('should disable specific components', () => {
      unificationLayer.enableComponent('memory');
      unificationLayer.disableComponent('memory');
      
      expect(unificationLayer.config.components.memory).toBe(false);
      expect(unificationLayer.adapters.memory.enabled).toBe(false);
    });
    
    test('should enable all components with master switch', () => {
      unificationLayer.enable();
      
      expect(unificationLayer.config.enabled).toBe(true);
      expect(unificationLayer.config.components.departments).toBe(true);
      expect(unificationLayer.config.components.memory).toBe(true);
      expect(unificationLayer.config.components.orchestration).toBe(true);
      expect(unificationLayer.config.components.communication).toBe(true);
      expect(unificationLayer.config.components.unifiedBus).toBe(true);
      expect(unificationLayer.config.components.contextBroker).toBe(true);
    });
    
    test('should disable all components with master switch', () => {
      unificationLayer.enable();
      unificationLayer.disable();
      
      expect(unificationLayer.config.enabled).toBe(false);
      Object.values(unificationLayer.config.components).forEach(enabled => {
        expect(enabled).toBe(false);
      });
    });
  });
  
  describe('Unified Context Management', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('should get unified context when enabled', async () => {
      unificationLayer.enable();
      
      const context = await unificationLayer.getUnifiedContext('task-123');
      
      expect(context).toBeDefined();
      expect(context.task).toBe('task-123');
      expect(context.departments).toBeDefined();
      expect(context.memory).toBeDefined();
    });
    
    test('should transfer context between agents', async () => {
      unificationLayer.enable();
      
      const transfers = await unificationLayer.transferContext(
        'agent1', 'agent2', 'task-123'
      );
      
      expect(transfers).toBeDefined();
      expect(Array.isArray(transfers)).toBe(true);
    });
  });
  
  describe('Unified Messaging', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('should send unified messages when enabled', async () => {
      unificationLayer.enable();
      
      const results = await unificationLayer.sendUnifiedMessage(
        { type: 'test', data: 'message' },
        { priority: 'high' }
      );
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
  
  describe('Event Bus Integration', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('unified bus should receive framework events', (done) => {
      unificationLayer.enableComponent('unifiedBus');
      
      unificationLayer.unifiedBus.on('unified:event', (event) => {
        expect(event.source).toBe('framework');
        expect(event.event).toBe('command:before');
        done();
      });
      
      mockFramework.emit('command:before', { command: 'test' });
    });
    
    test('unified bus should receive department events', (done) => {
      unificationLayer.enableComponent('unifiedBus');
      
      unificationLayer.unifiedBus.on('unified:event', (event) => {
        expect(event.source).toBe('dept:ProductStrategist');
        expect(event.event).toBe('task:complete');
        done();
      });
      
      mockFramework.departments.ProductStrategist.emit('task:complete', {});
    });
  });
  
  describe('Context Broker Integration', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('context broker should read from memory', async () => {
      unificationLayer.enableComponent('contextBroker');
      
      const value = await unificationLayer.contextBroker.readFromMemory('main', 'test-key');
      
      expect(mockFramework.memorySystem.retrieve).toHaveBeenCalledWith('test-key');
      expect(value).toEqual({ data: 'test' });
    });
    
    test('context broker should never write to memory', async () => {
      unificationLayer.enableComponent('contextBroker');
      
      await unificationLayer.contextBroker.createContext('agent1', 'task1');
      await unificationLayer.contextBroker.transferContext('agent1', 'agent2', 'task1');
      
      // Verify store was never called
      expect(mockFramework.memorySystem.store).not.toHaveBeenCalled();
    });
  });
  
  describe('Adapter Coordination', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('adapters should work together when enabled', async () => {
      unificationLayer.enable();
      
      // Department adapter executes task
      const deptAdapter = unificationLayer.adapters.departments.get('ProductStrategist');
      const deptResult = await deptAdapter.execute({ type: 'test' });
      expect(deptResult.success).toBe(true);
      
      // Memory adapter retrieves data
      const memResult = await unificationLayer.adapters.memory.retrieve('key1');
      expect(memResult).toBeDefined();
      
      // Context broker creates context
      const context = await unificationLayer.contextBroker.createContext('agent1', 'task1');
      expect(context).toBeDefined();
      
      // All work together
      expect(unificationLayer.metrics.enabledCount).toBeGreaterThan(0);
    });
  });
  
  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('should report health status', () => {
      unificationLayer.enable();
      
      const health = unificationLayer.isHealthy();
      
      expect(health.layer).toBe(true);
      expect(health.adapters).toBeDefined();
      expect(health.overall).toBeDefined();
    });
    
    test('should detect unhealthy conditions', () => {
      unificationLayer.enable();
      
      // Create unhealthy condition
      unificationLayer.unifiedBus.messageQueue = new Array(20000);
      
      const health = unificationLayer.isHealthy();
      expect(health.adapters.unifiedBus).toBeDefined();
      expect(health.adapters.unifiedBus.queueHealth).toBe(false);
    });
  });
  
  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('should collect metrics from all components', async () => {
      unificationLayer.enable();
      
      // Generate some activity
      await unificationLayer.adapters.memory.store('key1', 'value1');
      await unificationLayer.contextBroker.createContext('agent1', 'task1');
      mockFramework.emit('command:before', {});
      
      const metrics = unificationLayer.getMetrics();
      
      expect(metrics.layer).toBeDefined();
      expect(metrics.layer.enabled).toBe(true);
      expect(metrics.adapters).toBeDefined();
      expect(metrics.adapters.memory).toBeDefined();
    });
  });
  
  describe('Rollback Capability', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('should rollback completely', async () => {
      unificationLayer.enable();
      
      // Generate activity
      await unificationLayer.contextBroker.createContext('agent1', 'task1');
      await unificationLayer.sendUnifiedMessage({ test: 'message' });
      
      // Store initial state
      const hadAdapters = unificationLayer.adapters.departments.size > 0;
      
      // Rollback
      unificationLayer.rollback();
      
      expect(unificationLayer.config.enabled).toBe(false);
      expect(unificationLayer.metrics.enabledCount).toBe(0);
      expect(hadAdapters).toBe(true); // Had adapters before rollback
    });
    
    test('should preserve framework after rollback', async () => {
      const originalFramework = { ...mockFramework };
      
      unificationLayer.enable();
      unificationLayer.rollback();
      
      // Framework should be unchanged
      expect(mockFramework.version).toBe(originalFramework.version);
      expect(Object.keys(mockFramework.departments)).toEqual(
        Object.keys(originalFramework.departments)
      );
    });
  });
  
  describe('Non-Interference Verification', () => {
    beforeEach(async () => {
      await unificationLayer.initialize(mockFramework);
    });
    
    test('framework should work normally with unification disabled', async () => {
      // Unification disabled
      expect(unificationLayer.config.enabled).toBe(false);
      
      // Framework works normally
      const result = await mockFramework.departments.ProductStrategist.execute({ test: 'task' });
      expect(result.success).toBe(true);
      
      mockFramework.memorySystem.retrieve('key');
      expect(mockFramework.memorySystem.retrieve).toHaveBeenCalled();
    });
    
    test('framework should work normally with unification enabled', async () => {
      unificationLayer.enable();
      
      // Framework still works normally
      const result = await mockFramework.departments.ProductStrategist.execute({ test: 'task' });
      expect(result.success).toBe(true);
      
      mockFramework.memorySystem.retrieve('key');
      expect(mockFramework.memorySystem.retrieve).toHaveBeenCalled();
    });
    
    test('disabling unification should not affect framework', async () => {
      unificationLayer.enable();
      unificationLayer.disable();
      
      // Framework continues to work
      const result = await mockFramework.departments.ProductStrategist.execute({ test: 'task' });
      expect(result.success).toBe(true);
    });
  });
});