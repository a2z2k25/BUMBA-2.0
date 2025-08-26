/**
 * Unified Bus Tests
 * Verify bus works without modifying existing systems
 * Part of Sprint 3: Safe Unification
 */

const UnifiedBus = require('../../src/unification/integration/unified-bus');
const { EventEmitter } = require('events');

describe('UnifiedBus', () => {
  let bus;
  let mockSystem1;
  let mockSystem2;
  
  beforeEach(() => {
    bus = new UnifiedBus();
    
    // Create mock systems that simulate existing framework components
    mockSystem1 = new EventEmitter();
    mockSystem1.name = 'MockSystem1';
    
    mockSystem2 = new EventEmitter();
    mockSystem2.name = 'MockSystem2';
  });
  
  afterEach(() => {
    bus.rollback();
  });
  
  describe('Basic Operations', () => {
    test('should start disabled by default', () => {
      expect(bus.enabled).toBe(false);
      expect(bus.getMetrics().enabled).toBe(false);
    });
    
    test('should enable and disable safely', () => {
      bus.enable();
      expect(bus.enabled).toBe(true);
      
      bus.disable();
      expect(bus.enabled).toBe(false);
    });
    
    test('should connect to existing systems without modifying them', () => {
      const originalEmit = mockSystem1.emit;
      const originalOn = mockSystem1.on;
      
      bus.connectToExisting('system1', mockSystem1, ['event1', 'event2']);
      
      // Verify system wasn't modified
      expect(mockSystem1.emit).toBe(originalEmit);
      expect(mockSystem1.on).toBe(originalOn);
      expect(bus.connectedSystems.has('system1')).toBe(true);
    });
    
    test('should track connected systems', () => {
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      bus.connectToExisting('system2', mockSystem2, ['event2']);
      
      expect(bus.metrics.systemsConnected).toBe(2);
      expect(bus.connectedSystems.size).toBe(2);
    });
  });
  
  describe('Event Listening', () => {
    test('should not attach listeners when disabled', () => {
      const onSpy = jest.spyOn(mockSystem1, 'on');
      
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      expect(onSpy).not.toHaveBeenCalled();
    });
    
    test('should attach listeners when enabled', () => {
      const onSpy = jest.spyOn(mockSystem1, 'on');
      
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1', 'event2']);
      
      expect(onSpy).toHaveBeenCalledTimes(2);
      expect(onSpy).toHaveBeenCalledWith('event1', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('event2', expect.any(Function));
    });
    
    test('should receive events from connected systems', (done) => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['test-event']);
      
      bus.on('unified:event', (event) => {
        expect(event.source).toBe('system1');
        expect(event.event).toBe('test-event');
        expect(event.data).toEqual({ test: 'data' });
        done();
      });
      
      // Emit from original system
      mockSystem1.emit('test-event', { test: 'data' });
    });
    
    test('should track event metrics', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      mockSystem1.emit('event1', {});
      mockSystem1.emit('event1', {});
      
      expect(bus.metrics.eventsReceived).toBe(2);
    });
    
    test('should detach listeners when disabled', () => {
      const removeListenerSpy = jest.spyOn(mockSystem1, 'removeListener');
      
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      bus.disable();
      
      expect(removeListenerSpy).toHaveBeenCalled();
    });
  });
  
  describe('Event Mapping', () => {
    test('should add event mappings between systems', () => {
      bus.addEventMapping('system1', 'event1', 'system2', 'event2');
      
      expect(bus.eventMappings.has('system1:event1')).toBe(true);
    });
    
    test('should execute event mappings', (done) => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['source-event']);
      bus.connectToExisting('system2', mockSystem2, []);
      
      // Add mapping
      bus.addEventMapping('system1', 'source-event', 'system2', 'target-event');
      
      // Listen on target system
      mockSystem2.on('target-event', (data) => {
        expect(data).toEqual({ original: 'data' });
        done();
      });
      
      // Emit from source system
      mockSystem1.emit('source-event', { original: 'data' });
    });
    
    test('should transform data in mappings', (done) => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['source']);
      bus.connectToExisting('system2', mockSystem2, []);
      
      // Add mapping with transform
      bus.addEventMapping('system1', 'source', 'system2', 'target', (data) => {
        return { ...data, transformed: true };
      });
      
      // Listen on target
      mockSystem2.on('target', (data) => {
        expect(data.original).toBe('value');
        expect(data.transformed).toBe(true);
        done();
      });
      
      // Emit from source
      mockSystem1.emit('source', { original: 'value' });
    });
  });
  
  describe('Pattern Detection', () => {
    test('should detect event patterns', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['pattern-event']);
      
      // Emit pattern multiple times
      mockSystem1.emit('pattern-event', {});
      mockSystem1.emit('pattern-event', {});
      mockSystem1.emit('pattern-event', {});
      
      const patterns = bus.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].count).toBe(3);
    });
    
    test('should track pattern intervals', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['timed-event']);
      
      // Emit events with known timing
      const now = Date.now();
      bus.handleSystemEvent('system1', 'timed-event', { time: now });
      bus.handleSystemEvent('system1', 'timed-event', { time: now + 100 });
      bus.handleSystemEvent('system1', 'timed-event', { time: now + 200 });
      
      const patterns = bus.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].count).toBe(3);
    });
  });
  
  describe('Event History', () => {
    test('should maintain event history', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      mockSystem1.emit('event1', { data: 1 });
      mockSystem1.emit('event1', { data: 2 });
      
      const history = bus.getHistory();
      expect(history.length).toBe(2);
    });
    
    test('should filter history by source', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      bus.connectToExisting('system2', mockSystem2, ['event2']);
      
      mockSystem1.emit('event1', {});
      mockSystem2.emit('event2', {});
      
      const filtered = bus.getHistory({ source: 'system1' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].source).toBe('system1');
    });
    
    test('should filter history by time', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      const beforeTime = Date.now();
      mockSystem1.emit('event1', {});
      
      const history = bus.getHistory({ since: beforeTime - 1000 });
      expect(history.length).toBe(1);
      
      const emptyHistory = bus.getHistory({ since: Date.now() + 1000 });
      expect(emptyHistory.length).toBe(0);
    });
    
    test('should limit history size', () => {
      bus.maxHistorySize = 5;
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      // Emit more than max
      for (let i = 0; i < 10; i++) {
        mockSystem1.emit('event1', { index: i });
      }
      
      const history = bus.getHistory();
      expect(history.length).toBe(5);
      expect(history[0].data.index).toBe(5); // Oldest should be index 5
    });
  });
  
  describe('Queue Processing', () => {
    test('should process events in queue', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      mockSystem1.emit('event1', {});
      mockSystem1.emit('event1', {});
      
      // Process queue
      bus.processQueue();
      
      expect(bus.metrics.eventsProcessed).toBeGreaterThan(0);
    });
    
    test('should limit queue size', () => {
      bus.maxQueueSize = 5;
      bus.enable();
      
      // Add more than max
      for (let i = 0; i < 10; i++) {
        bus.messageQueue.push({ id: i });
      }
      
      bus.processQueue();
      
      expect(bus.messageQueue.length).toBeLessThanOrEqual(5);
    });
    
    test('should clear queue on demand', () => {
      bus.enable();
      bus.messageQueue = [{}, {}, {}];
      
      const cleared = bus.clearQueue();
      
      expect(cleared).toBe(3);
      expect(bus.messageQueue.length).toBe(0);
    });
  });
  
  describe('Unified Event Subscription', () => {
    test('should allow subscription to unified events', (done) => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['test']);
      
      bus.onUnified('unified:system1:test', (event) => {
        expect(event.source).toBe('system1');
        expect(event.event).toBe('test');
        done();
      });
      
      mockSystem1.emit('test', {});
      // Process the queue to trigger the event
      bus.processQueue();
    });
    
    test('should emit specific unified patterns', (done) => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['specific']);
      
      bus.on('unified:system1:specific', (event) => {
        expect(event.data.value).toBe('test');
        done();
      });
      
      mockSystem1.emit('specific', { value: 'test' });
      // Process the queue to trigger the event
      bus.processQueue();
    });
  });
  
  describe('System Status', () => {
    test('should report system status', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['e1', 'e2']);
      
      mockSystem1.emit('e1', {});
      mockSystem1.emit('e2', {});
      
      const status = bus.getSystemStatus('system1');
      
      expect(status.id).toBe('system1');
      expect(status.eventCount).toBe(2);
      expect(status.eventsMonitored).toBe(2);
    });
    
    test('should report overall metrics', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      mockSystem1.emit('event1', {});
      
      const metrics = bus.getMetrics();
      
      expect(metrics.enabled).toBe(true);
      expect(metrics.systemsConnected).toBe(1);
      expect(metrics.eventsReceived).toBe(1);
    });
  });
  
  describe('Health Check', () => {
    test('should report health status', () => {
      bus.enable();
      
      const health = bus.isHealthy();
      
      expect(health.busHealthy).toBe(true);
      expect(health.enabled).toBe(true);
      expect(health.processingActive).toBe(true);
      expect(health.queueHealth).toBe(true);
    });
    
    test('should detect unhealthy queue', () => {
      bus.maxQueueSize = 5;
      bus.messageQueue = [{}, {}, {}, {}, {}, {}]; // Over limit
      
      const health = bus.isHealthy();
      
      expect(health.queueHealth).toBe(false);
    });
  });
  
  describe('Rollback', () => {
    test('should rollback completely', () => {
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      bus.addEventMapping('system1', 'event1', 'system2', 'event2');
      
      mockSystem1.emit('event1', {});
      
      bus.rollback();
      
      expect(bus.enabled).toBe(false);
      expect(bus.connectedSystems.size).toBe(0);
      expect(bus.eventMappings.size).toBe(0);
      expect(bus.messageQueue.length).toBe(0);
      expect(bus.metrics.eventsReceived).toBe(0);
    });
    
    test('should stop processing on rollback', () => {
      bus.enable();
      expect(bus.processingInterval).not.toBeNull();
      
      bus.rollback();
      expect(bus.processingInterval).toBeNull();
    });
  });
  
  describe('Non-Modification Verification', () => {
    test('should never modify connected systems', () => {
      const originalSystem = { ...mockSystem1 };
      const originalPrototype = Object.getPrototypeOf(mockSystem1);
      
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['event1']);
      
      // Emit events
      mockSystem1.emit('event1', {});
      
      // Process
      bus.processQueue();
      
      // Disable
      bus.disable();
      
      // Verify no modifications
      expect(Object.getPrototypeOf(mockSystem1)).toBe(originalPrototype);
      expect(mockSystem1.name).toBe(originalSystem.name);
    });
    
    test('should preserve original event emission', (done) => {
      let originalReceived = false;
      let unifiedReceived = false;
      
      // Original listener
      mockSystem1.on('test', () => {
        originalReceived = true;
        if (unifiedReceived) done();
      });
      
      bus.enable();
      bus.connectToExisting('system1', mockSystem1, ['test']);
      
      // Unified listener
      bus.on('unified:event', () => {
        unifiedReceived = true;
        if (originalReceived) done();
      });
      
      // Both should receive
      mockSystem1.emit('test', {});
    });
  });
});