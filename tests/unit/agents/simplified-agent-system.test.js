/**
 * Tests for BUMBA Simplified Agent System
 */

jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

const { SimplifiedAgentSystem } = require('../../../src/core/agents/simplified-agent-system');

describe('SimplifiedAgentSystem', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let agentSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    agentSystem = new SimplifiedAgentSystem();
  });

  describe('Agent Creation', () => {
    test('should create a new agent', async () => {
      const agent = await agentSystem.createAgent('test', { priority: 'high' });
      
      expect(agent).toBeDefined();
      expect(agent.id).toMatch(/^agent_test_/);
      expect(agent.type).toBe('test');
      expect(agent.status).toBe('active');
      expect(agent.config.priority).toBe('high');
    });

    test('should increment active agent count', async () => {
      expect(agentSystem.activeAgents).toBe(0);
      
      await agentSystem.createAgent('worker');
      
      expect(agentSystem.activeAgents).toBe(1);
    });

    test('should enforce agent limit', async () => {
      // Create max agents
      for (let i = 0; i < agentSystem.maxAgents; i++) {
        await agentSystem.createAgent(`agent${i}`);
      }
      
      // Try to create one more
      await expect(agentSystem.createAgent('overflow'))
        .rejects.toThrow('Agent limit reached (10)');
    });

    test('should emit agent created event', async () => {
      const listener = jest.fn();
      agentSystem.on('agent:created', listener);
      
      const agent = await agentSystem.createAgent('worker');
      
      expect(listener).toHaveBeenCalledWith({
        agentId: agent.id,
        type: 'worker'
      });
    });
  });

  describe('Agent Execution', () => {
    test('should execute task with agent', async () => {
      const agent = await agentSystem.createAgent('executor');
      const task = { description: 'test task' };
      
      const result = await agent.execute(task);
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBe(agent.id);
      expect(result.result).toBe('Completed by executor agent');
    });
  });

  describe('Agent Management', () => {
    test('should get agent by ID', async () => {
      const created = await agentSystem.createAgent('finder');
      
      const found = agentSystem.getAgent(created.id);
      
      expect(found).toBe(created);
    });

    test('should return undefined for non-existent agent', async () => {
      const agent = agentSystem.getAgent('non-existent');
      
      expect(agent).toBeUndefined();
    });

    test('should get agents by type', async () => {
      await agentSystem.createAgent('worker');
      await agentSystem.createAgent('worker');
      await agentSystem.createAgent('analyzer');
      
      const workers = agentSystem.getAgentsByType('worker');
      
      expect(workers).toHaveLength(2);
      expect(workers.every(a => a.type === 'worker')).toBe(true);
    });

    test('should destroy agent', async () => {
      const agent = await agentSystem.createAgent('temporary');
      
      const destroyed = agentSystem.destroyAgent(agent.id);
      
      expect(destroyed).toBe(true);
      expect(agentSystem.activeAgents).toBe(0);
      expect(agentSystem.getAgent(agent.id)).toBeUndefined();
    });

    test('should return false when destroying non-existent agent', async () => {
      const destroyed = agentSystem.destroyAgent('non-existent');
      
      expect(destroyed).toBe(false);
    });

    test('should emit agent destroyed event', async () => {
      const listener = jest.fn();
      agentSystem.on('agent:destroyed', listener);
      
      const agent = await agentSystem.createAgent('temporary');
      agentSystem.destroyAgent(agent.id);
      
      expect(listener).toHaveBeenCalledWith({
        agentId: agent.id,
        type: 'temporary'
      });
    });

    test('should support agent self-destruction', async () => {
      const agent = await agentSystem.createAgent('self-destruct');
      
      agent.destroy();
      
      expect(agentSystem.getAgent(agent.id)).toBeUndefined();
    });
  });

  describe('Task Execution with Best Agent', () => {
    test('should execute with preferred agent type', async () => {
      const worker = await agentSystem.createAgent('worker');
      const analyzer = await agentSystem.createAgent('analyzer');
      
      const task = { description: 'work task' };
      const result = await agentSystem.executeWithBestAgent(task, 'worker');
      
      expect(result.agentId).toBe(worker.id);
    });

    test('should find any available agent if preferred not found', async () => {
      const analyzer = await agentSystem.createAgent('analyzer');
      
      const task = { description: 'work task' };
      const result = await agentSystem.executeWithBestAgent(task, 'worker');
      
      expect(result.agentId).toBe(analyzer.id);
    });

    test('should create new agent if none available', async () => {
      const task = { description: 'new task' };
      const result = await agentSystem.executeWithBestAgent(task, 'worker');
      
      expect(result.success).toBe(true);
      expect(agentSystem.activeAgents).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('should provide system statistics', async () => {
      await agentSystem.createAgent('worker');
      await agentSystem.createAgent('worker');
      await agentSystem.createAgent('analyzer');
      
      const stats = agentSystem.getStats();
      
      expect(stats.totalAgents).toBe(3);
      expect(stats.activeAgents).toBe(3);
      expect(stats.maxAgents).toBe(10);
      expect(stats.agentsByType.worker).toBe(2);
      expect(stats.agentsByType.analyzer).toBe(1);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup old agents', async () => {
      const agent = await agentSystem.createAgent('old');
      
      // Mock the agent as old
      agent.created = Date.now() - 35 * 60 * 1000; // 35 minutes ago
      
      agentSystem.cleanup();
      
      expect(agentSystem.getAgent(agent.id)).toBeUndefined();
    });

    test('should keep recent agents during cleanup', async () => {
      const agent = await agentSystem.createAgent('recent');
      
      agentSystem.cleanup();
      
      expect(agentSystem.getAgent(agent.id)).toBeDefined();
    });
  });
});