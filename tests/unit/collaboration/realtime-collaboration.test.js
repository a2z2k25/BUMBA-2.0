/**
 * BUMBA Real-Time Collaboration Tests
 * Verifies real-time event system and collaboration monitoring
 */

const RealtimeEventEmitter = require('../../../src/core/collaboration/realtime-event-emitter');
const CollaborationMonitor = require('../../../src/core/collaboration/collaboration-monitor');
const { RealtimeCoordinationManager } = require('../../../src/core/collaboration/realtime-coordination-hooks');

describe('Real-Time Collaboration System', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  
  describe('RealtimeEventEmitter', () => {
    let emitter;
    
    beforeEach(() => {
      emitter = new RealtimeEventEmitter();
    });
    
    test('should register agents', async () => {
      const result = emitter.registerAgent('agent-1', { department: 'backend' });
      expect(result).toBe(true);
      expect(emitter.agents.has('agent-1')).toBe(true);
    });
    
    test('should broadcast status updates', async () => {
      emitter.registerAgent('agent-1', { department: 'backend' });
      
      let receivedUpdate = null;
      emitter.on('status:update', (data) => {
        receivedUpdate = data;
      });
      
      emitter.broadcastStatus('agent-1', 'active', { task: 'coding' });
      
      expect(receivedUpdate).toBeTruthy();
      expect(receivedUpdate.status).toBe('active');
      expect(receivedUpdate.metadata.task).toBe('coding');
    });
    
    test('should manage channels', async () => {
      emitter.registerAgent('agent-1', { department: 'backend' });
      emitter.registerAgent('agent-2', { department: 'design' });
      
      emitter.subscribeToChannel('agent-1', 'collab-123');
      emitter.subscribeToChannel('agent-2', 'collab-123');
      
      expect(emitter.channels.get('collab-123').size).toBe(2);
    });
    
    test('should send messages to channels', async () => {
      emitter.registerAgent('agent-1', { department: 'backend' });
      emitter.subscribeToChannel('agent-1', 'test-channel');
      
      let receivedMessage = null;
      emitter.on('channel:test-channel:agent-1', (data) => {
        receivedMessage = data;
      });
      
      emitter.sendToChannel('test-channel', { type: 'test', data: 'hello' });
      
      expect(receivedMessage).toBeTruthy();
      expect(receivedMessage.message.type).toBe('test');
    });
    
    test('should cleanup inactive agents', async () => {
      emitter.registerAgent('agent-1', { department: 'backend' });
      const agent = emitter.agents.get('agent-1');
      agent.lastActivity = Date.now() - 400000; // Make it inactive
      
      const cleaned = emitter.cleanupInactive(300000);
      
      expect(cleaned).toBe(1);
      expect(emitter.agents.has('agent-1')).toBe(false);
    });
  });
  
  describe('CollaborationMonitor', () => {
    let monitor;
    
    beforeEach(() => {
      monitor = new CollaborationMonitor();
    });
    
    test('should start collaboration', async () => {
      const collab = monitor.startCollaboration('test-123', {
        type: 'parallel',
        departments: ['backend', 'design'],
        tasks: ['task1', 'task2']
      });
      
      expect(collab.id).toBe('test-123');
      expect(collab.agents.size).toBe(2);
      expect(monitor.metrics.activeCollaborations).toBe(1);
    });
    
    test('should update agent status', async () => {
      monitor.startCollaboration('test-123', {
        departments: ['backend']
      });
      
      const result = monitor.updateAgentStatus(
        'test-123',
        'backend-test-123',
        'coding'
      );
      
      expect(result).toBe(true);
    });
    
    test('should track task completion', async () => {
      monitor.startCollaboration('test-123', {
        departments: ['backend'],
        tasks: ['task1', 'task2']
      });
      
      monitor.reportTaskComplete('test-123', 'backend-test-123', 'task1');
      
      const collab = monitor.collaborations.get('test-123');
      expect(collab.progress).toBe(50);
      expect(collab.completedTasks.length).toBe(1);
    });
    
    test('should complete collaboration when all tasks done', async () => {
      monitor.startCollaboration('test-123', {
        departments: ['backend'],
        tasks: ['task1']
      });
      
      monitor.reportTaskComplete('test-123', 'backend-test-123', 'task1');
      
      const collab = monitor.collaborations.get('test-123');
      expect(collab.status).toBe('completed');
      expect(monitor.metrics.completedCollaborations).toBe(1);
    });
    
    test('should get active collaborations', async () => {
      monitor.startCollaboration('test-1', {
        departments: ['backend']
      });
      monitor.startCollaboration('test-2', {
        departments: ['design']
      });
      
      const active = monitor.getActiveCollaborations();
      expect(active.length).toBe(2);
    });
  });
  
  describe('RealtimeCoordinationManager', () => {
    let manager;
    
    beforeEach(() => {
      manager = RealtimeCoordinationManager.getInstance();
    });
    
    test('should be singleton', async () => {
      const manager2 = RealtimeCoordinationManager.getInstance();
      expect(manager).toBe(manager2);
    });
    
    test('should register hooks', async () => {
      const mockHookSystem = {
        handlers: {},
        registerHandler: function(name, handler) {
          if (!this.handlers[name]) {
            this.handlers[name] = [];
          }
          this.handlers[name].push(handler);
        }
      };
      
      manager.registerHooks(mockHookSystem);
      
      expect(mockHookSystem.handlers['department:beforeCoordination']).toBeDefined();
      expect(mockHookSystem.handlers['department:afterCoordination']).toBeDefined();
      expect(mockHookSystem.handlers['team:afterComposition']).toBeDefined();
    });
    
    test('should get realtime status', async () => {
      const status = manager.getRealtimeStatus();
      
      expect(status.activeCollaborations).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.emitterStatus).toBeDefined();
    });
  });
});

// Performance test
describe('Real-Time Performance', () => {
  test('should handle high-frequency updates', async () => {
    const emitter = new RealtimeEventEmitter();
    const startTime = Date.now();
    
    // Register 10 agents
    for (let i = 0; i < 10; i++) {
      emitter.registerAgent(`agent-${i}`, { department: 'test' });
    }
    
    // Send 1000 status updates
    for (let i = 0; i < 1000; i++) {
      emitter.broadcastStatus(
        `agent-${i % 10}`,
        'active',
        { iteration: i }
      );
    }
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });
});