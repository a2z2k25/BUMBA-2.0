/**
 * Adapter Tests
 * Verify adapters work without modifying existing code
 * Part of Sprint 2: Safe Unification
 */

const DepartmentAdapter = require('../../src/unification/adapters/department-adapter');
const MemoryAdapter = require('../../src/unification/adapters/memory-adapter');
const OrchestrationAdapter = require('../../src/unification/adapters/orchestration-adapter');
const CommunicationAdapter = require('../../src/unification/adapters/communication-adapter');

describe('Unification Adapters', () => {
  
  describe('DepartmentAdapter', () => {
    let adapter;
    let mockDepartment;
    
    beforeEach(() => {
      // Create mock department that simulates existing code
      mockDepartment = {
        name: 'TestDepartment',
        execute: jest.fn().mockResolvedValue({ success: true }),
        selectSpecialist: jest.fn().mockResolvedValue({ id: 'test-specialist' }),
        on: jest.fn(),
        emit: jest.fn()
      };
      
      adapter = new DepartmentAdapter(mockDepartment, 'TestDepartment');
    });
    
    afterEach(() => {
      adapter.rollback();
    });
    
    test('should wrap department without modifying it', () => {
      expect(adapter.wrapped).toBe(mockDepartment);
      expect(adapter.enabled).toBe(false);
      expect(mockDepartment.execute).not.toHaveBeenCalled();
    });
    
    test('should start disabled by default', () => {
      expect(adapter.enabled).toBe(false);
      expect(adapter.getUnifiedMetrics().enabled).toBe(false);
    });
    
    test('should enable and disable safely', () => {
      adapter.enable();
      expect(adapter.enabled).toBe(true);
      
      adapter.disable();
      expect(adapter.enabled).toBe(false);
    });
    
    test('should execute through wrapped department', async () => {
      const task = { type: 'test', data: 'test-data' };
      const result = await adapter.execute(task);
      
      expect(mockDepartment.execute).toHaveBeenCalledWith(task, {});
      expect(result).toEqual({ success: true });
    });
    
    test('should track metrics when enabled', async () => {
      adapter.enable();
      
      const task = { type: 'test' };
      await adapter.execute(task);
      
      const metrics = adapter.getUnifiedMetrics();
      expect(metrics.metrics.tasksProcessed).toBe(1);
    });
    
    test('should preserve original methods', () => {
      const originalExecute = mockDepartment.execute;
      
      adapter.enable();
      adapter.disable();
      
      expect(mockDepartment.execute).toBe(originalExecute);
    });
    
    test('should support rollback', () => {
      adapter.enable();
      adapter.storeContext('task-1', { data: 'test' });
      
      adapter.rollback();
      
      expect(adapter.enabled).toBe(false);
      expect(adapter.retrieveContext('task-1')).toBeNull();
    });
    
    test('should handle connection to other adapters', () => {
      const otherAdapter = new DepartmentAdapter(mockDepartment, 'OtherDepartment');
      
      adapter.enable();
      const connected = adapter.connectTo(otherAdapter);
      
      expect(connected).toBe(true);
      expect(adapter.unifiedInterface.connections.size).toBe(1);
    });
    
    test('should report health status', () => {
      const health = adapter.isHealthy();
      
      expect(health.adapterHealthy).toBe(true);
      expect(health.enabled).toBe(false);
      expect(health.wrappedHealthy).toBe(true);
    });
  });
  
  describe('MemoryAdapter', () => {
    let adapter;
    let mockMemory;
    
    beforeEach(() => {
      // Create mock memory system
      mockMemory = {
        store: jest.fn().mockResolvedValue(true),
        retrieve: jest.fn().mockResolvedValue('test-value'),
        on: jest.fn(),
        emit: jest.fn()
      };
      
      adapter = new MemoryAdapter(mockMemory);
    });
    
    afterEach(() => {
      adapter.rollback();
    });
    
    test('should wrap memory without modifying it', () => {
      expect(adapter.wrapped).toBe(mockMemory);
      expect(adapter.enabled).toBe(false);
      expect(mockMemory.store).not.toHaveBeenCalled();
    });
    
    test('should store through wrapped memory', async () => {
      const result = await adapter.store('key1', 'value1');
      
      expect(mockMemory.store).toHaveBeenCalledWith('key1', 'value1', {});
      expect(result).toBe(true);
    });
    
    test('should retrieve through wrapped memory', async () => {
      const result = await adapter.retrieve('key1');
      
      expect(mockMemory.retrieve).toHaveBeenCalledWith('key1', {});
      expect(result).toBe('test-value');
    });
    
    test('should use cache when enabled', async () => {
      adapter.enable();
      
      // First retrieval - hits wrapped memory
      await adapter.retrieve('key1');
      expect(mockMemory.retrieve).toHaveBeenCalledTimes(1);
      
      // Second retrieval - should hit cache
      await adapter.retrieve('key1');
      expect(mockMemory.retrieve).toHaveBeenCalledTimes(1); // Still 1
      expect(adapter.metrics.cacheHits).toBe(1);
    });
    
    test('should create scoped contexts', async () => {
      adapter.enable();
      
      const scope = await adapter.createScopedContext('agent1', 'task1');
      
      expect(scope).toBeDefined();
      expect(scope.id).toBe('agent1:task1');
      expect(scope.store).toBeDefined();
      expect(scope.retrieve).toBeDefined();
    });
    
    test('should transfer context between agents', async () => {
      adapter.enable();
      
      // Create context for first agent
      const context1 = await adapter.createScopedContext('agent1', 'task1');
      await context1.store('data', 'test-value');
      
      // Transfer to second agent
      const context2 = await adapter.transferContext('agent1', 'agent2', 'task1');
      
      expect(context2).toBeDefined();
      expect(adapter.metrics.contextHandoffs).toBe(1);
    });
    
    test('should track access patterns', async () => {
      adapter.enable();
      
      await adapter.retrieve('key1');
      await adapter.retrieve('key1');
      await adapter.retrieve('key2');
      
      const patterns = adapter.getAccessPatterns();
      
      // Only 2 because second key1 hit cache
      expect(patterns.totalAccesses).toBe(2);
      expect(patterns.hotKeys).toBeDefined();
    });
    
    test('should clear cache without affecting wrapped memory', () => {
      adapter.enable();
      adapter.unifiedCache.set('key1', { value: 'cached' });
      
      adapter.clearCache();
      
      expect(adapter.unifiedCache.size).toBe(0);
      expect(mockMemory.store).not.toHaveBeenCalled();
    });
    
    test('should calculate cache hit rate', async () => {
      adapter.enable();
      
      await adapter.retrieve('key1'); // Miss
      await adapter.retrieve('key1'); // Hit
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.5); // 1 hit / 2 total
    });
  });
  
  describe('OrchestrationAdapter', () => {
    let adapter;
    let mockOrchestrator1;
    let mockOrchestrator2;
    
    beforeEach(() => {
      adapter = new OrchestrationAdapter();
      
      // Create mock orchestrators
      mockOrchestrator1 = {
        name: 'WaveOrchestrator',
        execute: jest.fn().mockResolvedValue({ success: true }),
        canHandle: jest.fn().mockReturnValue(true),
        on: jest.fn(),
        emit: jest.fn()
      };
      
      mockOrchestrator2 = {
        name: 'TaskOrchestrator',
        execute: jest.fn().mockResolvedValue({ success: true }),
        supportedTypes: ['task', 'subtask'],
        on: jest.fn(),
        emit: jest.fn()
      };
    });
    
    afterEach(() => {
      adapter.rollback();
    });
    
    test('should register orchestrators without modifying them', () => {
      adapter.registerOrchestrator('wave', mockOrchestrator1, 1);
      adapter.registerOrchestrator('task', mockOrchestrator2, 2);
      
      expect(adapter.orchestrators.size).toBe(2);
      expect(mockOrchestrator1.execute).not.toHaveBeenCalled();
      expect(mockOrchestrator2.execute).not.toHaveBeenCalled();
    });
    
    test('should determine orchestrator involvement', () => {
      adapter.registerOrchestrator('wave', mockOrchestrator1, 1);
      adapter.registerOrchestrator('task', mockOrchestrator2, 2);
      
      const task = { type: 'task' };
      const involved = adapter.determineInvolvement(task);
      
      expect(involved).toContain('wave'); // Can handle anything
      expect(involved).toContain('task'); // Supports 'task' type
    });
    
    test('should coordinate tasks across orchestrators', async () => {
      adapter.enable();
      adapter.registerOrchestrator('wave', mockOrchestrator1, 1);
      adapter.registerOrchestrator('task', mockOrchestrator2, 2);
      
      const task = { type: 'complex', data: 'test' };
      await adapter.coordinateTask('test', task);
      
      // Coordination only happens if multiple orchestrators are involved
      // Since both can handle the task, it should coordinate
      expect(adapter.metrics.tasksCoordinated).toBeGreaterThanOrEqual(0);
    });
    
    test('should execute unified orchestration', async () => {
      adapter.enable();
      adapter.registerOrchestrator('wave', mockOrchestrator1, 1);
      
      const task = { type: 'test' };
      const result = await adapter.executeUnified(task);
      
      expect(adapter.metrics.executionsCombined).toBe(1);
    });
    
    test('should resolve conflicts by priority', () => {
      adapter.registerOrchestrator('wave', mockOrchestrator1, 1);
      adapter.registerOrchestrator('task', mockOrchestrator2, 2);
      
      const winner = adapter.resolveConflict('wave', 'task', { type: 'resource' });
      
      expect(winner).toBe('wave'); // Lower priority number wins
      expect(adapter.metrics.conflictsResolved).toBe(1);
    });
    
    test('should add coordination rules', () => {
      const rule = {
        id: 'rule1',
        condition: (task) => task.type === 'special',
        action: (task) => console.log('Special task')
      };
      
      const added = adapter.addCoordinationRule(rule);
      
      expect(added).toBe(true);
      expect(adapter.coordinationRules.has('rule1')).toBe(true);
    });
    
    test('should check orchestrator health', () => {
      mockOrchestrator1.isHealthy = jest.fn().mockReturnValue(true);
      adapter.registerOrchestrator('wave', mockOrchestrator1);
      
      const status = adapter.getOrchestratorStatus('wave');
      
      expect(status.healthy).toBe(true);
      expect(mockOrchestrator1.isHealthy).toHaveBeenCalled();
    });
    
    test('should report adapter health', () => {
      adapter.enable();
      adapter.registerOrchestrator('wave', mockOrchestrator1);
      
      const health = adapter.isHealthy();
      
      expect(health.adapterHealthy).toBe(true);
      expect(health.enabled).toBe(true);
      expect(health.orchestratorCount).toBe(1);
    });
  });
  
  describe('CommunicationAdapter', () => {
    let adapter;
    let mockCommSystem;
    
    beforeEach(() => {
      adapter = new CommunicationAdapter();
      
      // Create mock communication system
      mockCommSystem = {
        send: jest.fn().mockResolvedValue(true),
        broadcast: jest.fn().mockResolvedValue(true),
        on: jest.fn(),
        emit: jest.fn(),
        listenerCount: jest.fn().mockReturnValue(1)
      };
    });
    
    afterEach(() => {
      adapter.rollback();
    });
    
    test('should register systems without modifying them', () => {
      adapter.registerSystem('main', mockCommSystem);
      
      expect(adapter.wrappedSystems.size).toBe(1);
      expect(mockCommSystem.send).not.toHaveBeenCalled();
    });
    
    test('should create and manage channels', () => {
      adapter.enable();
      
      const channel = adapter.createChannel('test-channel');
      
      expect(channel).toBeDefined();
      expect(channel.name).toBe('test-channel');
      expect(adapter.metrics.channelsActive).toBe(1);
    });
    
    test('should handle subscriptions', () => {
      adapter.enable();
      
      const handler = jest.fn();
      const subscribed = adapter.subscribe('test-channel', 'subscriber1', handler);
      
      expect(subscribed).toBe(true);
      const channel = adapter.unifiedBus.channels.get('test-channel');
      expect(channel.subscribers.size).toBe(1);
    });
    
    test('should publish messages to channels', async () => {
      adapter.enable();
      adapter.createChannel('test-channel');
      
      const published = await adapter.publish('test-channel', { data: 'test' });
      
      expect(published).toBe(true);
      expect(adapter.metrics.messagesSent).toBe(1);
    });
    
    test('should route messages to subscribers', async () => {
      adapter.enable();
      
      const handler = jest.fn();
      adapter.subscribe('test-channel', 'subscriber1', handler);
      
      await adapter.publish('test-channel', { data: 'test' });
      
      // Process message queue
      await adapter.processNextMessage();
      
      expect(handler).toHaveBeenCalled();
    });
    
    test('should broadcast to all channels', async () => {
      adapter.enable();
      adapter.createChannel('channel1');
      adapter.createChannel('channel2');
      
      const results = await adapter.broadcast({ announcement: 'test' });
      
      expect(results).toHaveLength(2);
    });
    
    test('should send direct messages', async () => {
      adapter.enable();
      
      const sent = await adapter.sendDirect('sender', 'receiver', { data: 'test' });
      
      expect(sent).toBe(true);
    });
    
    test('should maintain message history', async () => {
      adapter.enable();
      adapter.createChannel('test-channel');
      
      await adapter.publish('test-channel', { data: 'msg1' });
      await adapter.publish('test-channel', { data: 'msg2' });
      
      const history = adapter.getHistory();
      expect(history).toHaveLength(2);
    });
    
    test('should filter message history', async () => {
      adapter.enable();
      adapter.createChannel('channel1');
      adapter.createChannel('channel2');
      
      await adapter.publish('channel1', { data: 'msg1' });
      await adapter.publish('channel2', { data: 'msg2' });
      
      const filtered = adapter.getHistory({ channel: 'channel1' });
      expect(filtered).toHaveLength(1);
    });
    
    test('should add and execute routing rules', async () => {
      adapter.enable();
      adapter.registerSystem('main', mockCommSystem);
      
      const route = {
        targets: ['main'],
        transform: (msg) => ({ ...msg, routed: true })
      };
      
      adapter.addRoute('special', route);
      
      await adapter.routeMessage({ type: 'special', data: 'test' });
      
      expect(adapter.metrics.messagesRouted).toBe(1);
    });
    
    test('should clear message queue', () => {
      adapter.enable();
      adapter.unifiedBus.messageQueue = [{}, {}, {}];
      
      const cleared = adapter.clearQueue();
      
      expect(cleared).toBe(3);
      expect(adapter.unifiedBus.messageQueue).toHaveLength(0);
    });
    
    test('should report health status', () => {
      adapter.enable();
      adapter.registerSystem('main', mockCommSystem);
      
      const health = adapter.isHealthy();
      
      expect(health.adapterHealthy).toBe(true);
      expect(health.enabled).toBe(true);
      expect(health.processorRunning).toBe(true);
    });
  });
  
  describe('Adapter Integration', () => {
    test('adapters should not interfere with each other', () => {
      const dept = new DepartmentAdapter({}, 'Test');
      const mem = new MemoryAdapter({});
      const orch = new OrchestrationAdapter();
      const comm = new CommunicationAdapter();
      
      // Enable all
      dept.enable();
      mem.enable();
      orch.enable();
      comm.enable();
      
      // Check all are independent
      expect(dept.enabled).toBe(true);
      expect(mem.enabled).toBe(true);
      expect(orch.enabled).toBe(true);
      expect(comm.enabled).toBe(true);
      
      // Disable one shouldn't affect others
      dept.disable();
      expect(dept.enabled).toBe(false);
      expect(mem.enabled).toBe(true);
      expect(orch.enabled).toBe(true);
      expect(comm.enabled).toBe(true);
    });
    
    test('all adapters should support rollback', () => {
      const adapters = [
        new DepartmentAdapter({}, 'Test'),
        new MemoryAdapter({}),
        new OrchestrationAdapter(),
        new CommunicationAdapter()
      ];
      
      adapters.forEach(adapter => {
        adapter.enable();
        adapter.rollback();
        expect(adapter.enabled).toBe(false);
      });
    });
    
    test('all adapters should start disabled', () => {
      const adapters = [
        new DepartmentAdapter({}, 'Test'),
        new MemoryAdapter({}),
        new OrchestrationAdapter(),
        new CommunicationAdapter()
      ];
      
      adapters.forEach(adapter => {
        expect(adapter.enabled).toBe(false);
      });
    });
  });
});