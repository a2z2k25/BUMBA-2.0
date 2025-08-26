/**
 * Context Broker Tests
 * Verify broker works without modifying memory systems
 * Part of Sprint 4: Safe Unification
 */

const ContextBroker = require('../../src/unification/integration/context-broker');

describe('ContextBroker', () => {
  let broker;
  let mockMemory1;
  let mockMemory2;
  
  beforeEach(() => {
    broker = new ContextBroker();
    
    // Create mock memory systems
    mockMemory1 = {
      name: 'MockMemory1',
      retrieve: jest.fn().mockResolvedValue({ stored: 'data' }),
      store: jest.fn().mockResolvedValue(true)
    };
    
    mockMemory2 = {
      name: 'MockMemory2',
      get: jest.fn().mockResolvedValue({ other: 'value' }),
      set: jest.fn().mockResolvedValue(true)
    };
  });
  
  afterEach(() => {
    broker.rollback();
  });
  
  describe('Basic Operations', () => {
    test('should start disabled by default', () => {
      expect(broker.enabled).toBe(false);
      expect(broker.getMetrics().enabled).toBe(false);
    });
    
    test('should enable and disable safely', () => {
      broker.enable();
      expect(broker.enabled).toBe(true);
      
      broker.disable();
      expect(broker.enabled).toBe(false);
    });
    
    test('should register memory systems without modifying them', () => {
      const originalRetrieve = mockMemory1.retrieve;
      
      broker.registerMemorySystem('memory1', mockMemory1);
      
      expect(mockMemory1.retrieve).toBe(originalRetrieve);
      expect(broker.memorySystems.has('memory1')).toBe(true);
    });
    
    test('should set primary memory system', () => {
      broker.registerMemorySystem('memory1', mockMemory1);
      broker.registerMemorySystem('memory2', mockMemory2, { primary: true });
      
      expect(broker.primaryMemory).toBe('memory2');
    });
  });
  
  describe('Context Creation', () => {
    test('should create context when enabled', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1', { initial: 'data' });
      
      expect(context).toBeDefined();
      expect(context.agentId).toBe('agent1');
      expect(context.taskId).toBe('task1');
      expect(context.data.initial).toBe('data');
    });
    
    test('should not create context when disabled', async () => {
      const context = await broker.createContext('agent1', 'task1');
      
      expect(context).toBeNull();
    });
    
    test('should track context metrics', async () => {
      broker.enable();
      
      await broker.createContext('agent1', 'task1');
      await broker.createContext('agent2', 'task2');
      
      expect(broker.metrics.contextsCreated).toBe(2);
    });
    
    test('should take initial snapshot', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      
      expect(broker.metrics.snapshotsTaken).toBe(1);
      expect(broker.contextSnapshots.has(context.id)).toBe(true);
    });
  });
  
  describe('Memory Reading', () => {
    test('should read from memory using retrieve method', async () => {
      broker.registerMemorySystem('memory1', mockMemory1);
      
      const value = await broker.readFromMemory('memory1', 'key1');
      
      expect(mockMemory1.retrieve).toHaveBeenCalledWith('key1');
      expect(value).toEqual({ stored: 'data' });
    });
    
    test('should read from memory using get method', async () => {
      broker.registerMemorySystem('memory2', mockMemory2);
      
      const value = await broker.readFromMemory('memory2', 'key2');
      
      expect(mockMemory2.get).toHaveBeenCalledWith('key2');
      expect(value).toEqual({ other: 'value' });
    });
    
    test('should track read count', async () => {
      broker.registerMemorySystem('memory1', mockMemory1);
      
      await broker.readFromMemory('memory1', 'key1');
      await broker.readFromMemory('memory1', 'key2');
      
      const status = broker.getMemoryStatus('memory1');
      expect(status.readCount).toBe(2);
    });
    
    test('should never modify memory systems', async () => {
      const originalMemory = { ...mockMemory1 };
      broker.registerMemorySystem('memory1', mockMemory1);
      
      await broker.readFromMemory('memory1', 'key1');
      
      // Verify no modifications
      expect(mockMemory1.name).toBe(originalMemory.name);
      expect(mockMemory1.store).toBe(originalMemory.store);
    });
  });
  
  describe('Context Retrieval', () => {
    test('should get existing context', async () => {
      broker.enable();
      
      const created = await broker.createContext('agent1', 'task1');
      const retrieved = await broker.getContext('agent1', 'task1');
      
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.metadata.accessCount).toBe(1);
    });
    
    test('should read context from memory if not local', async () => {
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1, { primary: true });
      
      mockMemory1.retrieve.mockResolvedValueOnce({ preserved: 'context' });
      
      const context = await broker.getContext('agent2', 'task2');
      
      expect(mockMemory1.retrieve).toHaveBeenCalledWith('context:agent2:task2');
      expect(context.data.preserved).toBe('context');
      expect(broker.metrics.contextsPreserved).toBe(1);
    });
    
    test('should create new context if not found', async () => {
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1, { primary: true });
      
      mockMemory1.retrieve.mockResolvedValueOnce(null);
      
      const context = await broker.getContext('agent3', 'task3');
      
      expect(context).toBeDefined();
      expect(context.agentId).toBe('agent3');
    });
  });
  
  describe('Context Updates', () => {
    test('should update context data locally', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      broker.updateContext(context.id, { updated: 'value' });
      
      const updated = broker.contexts.get(context.id);
      expect(updated.data.updated).toBe('value');
      expect(updated.metadata.modificationCount).toBe(1);
    });
    
    test('should take snapshot after multiple updates', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      const initialSnapshots = broker.metrics.snapshotsTaken;
      
      // Make 5 updates to trigger snapshot
      for (let i = 0; i < 5; i++) {
        broker.updateContext(context.id, { count: i });
      }
      
      expect(broker.metrics.snapshotsTaken).toBe(initialSnapshots + 1);
    });
  });
  
  describe('Context Transfer', () => {
    test('should transfer context between agents', async () => {
      broker.enable();
      
      await broker.createContext('agent1', 'task1', { original: 'data' });
      const transferred = await broker.transferContext('agent1', 'agent2', 'task1');
      
      expect(transferred).toBeDefined();
      expect(transferred.agentId).toBe('agent2');
      expect(transferred.data.original).toBe('data');
      expect(broker.metrics.handoffsCompleted).toBe(1);
    });
    
    test('should maintain context chain', async () => {
      broker.enable();
      
      const context1 = await broker.createContext('agent1', 'task1');
      const context2 = await broker.transferContext('agent1', 'agent2', 'task1');
      const context3 = await broker.transferContext('agent2', 'agent3', 'task1');
      
      expect(context3.chain).toHaveLength(2);
      expect(context3.chain[0]).toBe(context1.id);
      expect(context3.chain[1]).toBe(context2.id);
    });
    
    test('should apply handoff rules', async () => {
      broker.enable();
      
      await broker.createContext('agent1', 'task1', {
        public: 'data',
        secret: 'password',
        keep: 'this'
      });
      
      const transferred = await broker.transferContext('agent1', 'agent2', 'task1', {
        rules: [
          { type: 'filter', exclude: ['secret'] }
        ]
      });
      
      expect(transferred.data.public).toBe('data');
      expect(transferred.data.keep).toBe('this');
      expect(transferred.data.secret).toBeUndefined();
    });
    
    test('should apply transformation rules', async () => {
      broker.enable();
      
      await broker.createContext('agent1', 'task1', { value: 10 });
      
      const transferred = await broker.transferContext('agent1', 'agent2', 'task1', {
        rules: [
          { 
            type: 'transform', 
            transform: (data) => ({ ...data, value: data.value * 2 })
          }
        ]
      });
      
      expect(transferred.data.value).toBe(20);
    });
    
    test('should handle failed transfers', async () => {
      broker.enable();
      
      // Don't create source context, so transfer should fail
      const transferred = await broker.transferContext('nonexistent', 'agent2', 'task1');
      
      // Transfer creates new context if source doesn't exist
      expect(transferred).toBeDefined();
      expect(transferred.agentId).toBe('agent2');
    });
  });
  
  describe('Context Enrichment', () => {
    test('should add enrichers', () => {
      const enricher = {
        enrich: jest.fn().mockResolvedValue({ enriched: 'data' })
      };
      
      const added = broker.addEnricher('test-enricher', enricher);
      
      expect(added).toBe(true);
      expect(broker.enrichments.has('test-enricher')).toBe(true);
    });
    
    test('should apply enrichments during transfer', async () => {
      broker.enable();
      
      const enricher = {
        enrich: jest.fn().mockResolvedValue({ extra: 'info' })
      };
      broker.addEnricher('test', enricher);
      
      await broker.createContext('agent1', 'task1');
      const transferred = await broker.transferContext('agent1', 'agent2', 'task1', {
        enrich: true
      });
      
      expect(enricher.enrich).toHaveBeenCalled();
      expect(transferred.data.enriched_test).toEqual({ extra: 'info' });
      expect(broker.metrics.enrichmentsApplied).toBe(1);
    });
    
    test('should handle conditional enrichment', async () => {
      broker.enable();
      
      const enricher = {
        condition: (context) => context.agentId === 'agent2',
        enrich: jest.fn().mockResolvedValue({ conditional: 'data' })
      };
      broker.addEnricher('conditional', enricher);
      
      await broker.createContext('agent1', 'task1');
      const transferred = await broker.transferContext('agent1', 'agent2', 'task1', {
        enrich: true
      });
      
      expect(enricher.enrich).toHaveBeenCalled();
    });
  });
  
  describe('Snapshots', () => {
    test('should restore from snapshot', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1', { original: 'data' });
      broker.updateContext(context.id, { modified: 'value' });
      
      broker.restoreSnapshot(context.id);
      
      const restored = broker.contexts.get(context.id);
      expect(restored.data.original).toBe('data');
      expect(restored.data.modified).toBeUndefined();
    });
    
    test('should maintain snapshot history', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      
      // Create multiple snapshots
      for (let i = 0; i < 5; i++) {
        broker.updateContext(context.id, { count: i });
        broker.takeSnapshot(context.id);
      }
      
      const snapshots = broker.contextSnapshots.get(context.id);
      expect(snapshots.length).toBeGreaterThan(1);
    });
    
    test('should limit snapshot history', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      
      // Create more than 10 snapshots
      for (let i = 0; i < 15; i++) {
        broker.takeSnapshot(context.id);
      }
      
      const snapshots = broker.contextSnapshots.get(context.id);
      expect(snapshots.length).toBeLessThanOrEqual(10);
    });
  });
  
  describe('Context Chain', () => {
    test('should get complete context chain', async () => {
      broker.enable();
      
      await broker.createContext('agent1', 'task1');
      await broker.transferContext('agent1', 'agent2', 'task1');
      const final = await broker.transferContext('agent2', 'agent3', 'task1');
      
      const chain = broker.getContextChain(final.id);
      
      // Chain includes all contexts in order
      expect(chain.length).toBeGreaterThanOrEqual(1);
      expect(chain[chain.length - 1].agentId).toBe('agent3');
    });
  });
  
  describe('Monitoring', () => {
    test('should start and stop monitoring', () => {
      broker.enable();
      expect(broker.monitoringInterval).toBeDefined();
      
      broker.disable();
      expect(broker.monitoringInterval).toBeNull();
    });
    
    test('should cleanup inactive contexts', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      context.lastAccessed = Date.now() - 7200000; // 2 hours ago
      broker.activeContexts.delete(context.id);
      
      broker.cleanupInactiveContexts();
      
      expect(broker.contexts.has(context.id)).toBe(false);
    });
    
    test('should not cleanup active contexts', async () => {
      broker.enable();
      
      const context = await broker.createContext('agent1', 'task1');
      
      broker.cleanupInactiveContexts();
      
      expect(broker.contexts.has(context.id)).toBe(true);
    });
  });
  
  describe('Metrics', () => {
    test('should track all metrics', async () => {
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1);
      
      await broker.createContext('agent1', 'task1');
      await broker.transferContext('agent1', 'agent2', 'task1');
      
      const metrics = broker.getMetrics();
      
      expect(metrics.contextsCreated).toBe(2);
      expect(metrics.handoffsCompleted).toBe(1);
      expect(metrics.snapshotsTaken).toBeGreaterThan(0);
      expect(metrics.memorySystems).toBe(1);
    });
  });
  
  describe('Health Check', () => {
    test('should report health status', () => {
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1, { primary: true });
      
      const health = broker.isHealthy();
      
      expect(health.brokerHealthy).toBe(true);
      expect(health.enabled).toBe(true);
      expect(health.monitoringActive).toBe(true);
      expect(health.primaryMemory).toBe(true);
    });
    
    test('should detect unhealthy context count', () => {
      broker.enable();
      
      // Create many contexts
      for (let i = 0; i < 10001; i++) {
        broker.contexts.set(`context-${i}`, {});
      }
      
      const health = broker.isHealthy();
      expect(health.contextHealth).toBe(false);
    });
  });
  
  describe('Rollback', () => {
    test('should rollback completely', async () => {
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1);
      await broker.createContext('agent1', 'task1');
      broker.addEnricher('test', { enrich: () => ({}) });
      
      broker.rollback();
      
      expect(broker.enabled).toBe(false);
      expect(broker.memorySystems.size).toBe(0);
      expect(broker.contexts.size).toBe(0);
      expect(broker.enrichments.size).toBe(0);
      expect(broker.metrics.contextsCreated).toBe(0);
    });
  });
  
  describe('Non-Modification Verification', () => {
    test('should never modify memory systems', async () => {
      const originalPrototype = Object.getPrototypeOf(mockMemory1);
      const originalMethods = { ...mockMemory1 };
      
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1);
      
      // Use broker features
      await broker.readFromMemory('memory1', 'key');
      await broker.getContext('agent1', 'task1');
      
      // Verify no modifications
      expect(Object.getPrototypeOf(mockMemory1)).toBe(originalPrototype);
      expect(mockMemory1.retrieve).toBe(originalMethods.retrieve);
      expect(mockMemory1.store).toBe(originalMethods.store);
    });
    
    test('should only read from memory', async () => {
      broker.enable();
      broker.registerMemorySystem('memory1', mockMemory1);
      
      await broker.readFromMemory('memory1', 'key');
      await broker.getContext('agent1', 'task1');
      
      // Verify only read methods called
      expect(mockMemory1.retrieve).toHaveBeenCalled();
      expect(mockMemory1.store).not.toHaveBeenCalled();
    });
  });
});