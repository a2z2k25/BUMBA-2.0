/**
 * BUMBA Simplified Agent System
 * Lightweight agent management for the framework
 */

const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

class SimplifiedAgentSystem extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.activeAgents = 0;
    this.maxAgents = 10;
  }

  /**
   * Create a new agent
   */
  async createAgent(type, config = {}) {
    if (this.activeAgents >= this.maxAgents) {
      throw new Error(`Agent limit reached (${this.maxAgents})`);
    }

    const agentId = `agent_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const agent = {
      id: agentId,
      type,
      config,
      status: 'active',
      created: Date.now(),
      execute: async (task) => {
        logger.info(`Agent ${agentId} executing task: ${task.description || 'unnamed'}`);
        // Simulate agent work
        return {
          success: true,
          agentId,
          result: `Completed by ${type} agent`,
          timestamp: Date.now()
        };
      },
      destroy: () => {
        this.destroyAgent(agentId);
      }
    };

    this.agents.set(agentId, agent);
    this.activeAgents++;
    
    this.emit('agent:created', { agentId, type });
    logger.info(`🏁 Created ${type} agent: ${agentId}`);
    
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents of a specific type
   */
  getAgentsByType(type) {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  /**
   * Destroy an agent
   */
  destroyAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {return false;}

    agent.status = 'destroyed';
    this.agents.delete(agentId);
    this.activeAgents--;
    
    this.emit('agent:destroyed', { agentId, type: agent.type });
    logger.info(`🟢️ Destroyed agent: ${agentId}`);
    
    return true;
  }

  /**
   * Execute task with best available agent
   */
  async executeWithBestAgent(task, preferredType = null) {
    let agent = null;

    if (preferredType) {
      const typeAgents = this.getAgentsByType(preferredType);
      agent = typeAgents.find(a => a.status === 'active');
    }

    if (!agent) {
      // Find any available agent
      agent = Array.from(this.agents.values()).find(a => a.status === 'active');
    }

    if (!agent) {
      // Create new agent if none available
      agent = await this.createAgent(preferredType || 'general');
    }

    return agent.execute(task);
  }

  /**
   * Get system statistics
   */
  getStats() {
    const typeCount = {};
    for (const agent of this.agents.values()) {
      typeCount[agent.type] = (typeCount[agent.type] || 0) + 1;
    }

    return {
      totalAgents: this.agents.size,
      activeAgents: this.activeAgents,
      maxAgents: this.maxAgents,
      agentsByType: typeCount
    };
  }

  /**
   * Cleanup inactive agents
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [agentId, agent] of this.agents) {
      if (now - agent.created > maxAge) {
        this.destroyAgent(agentId);
      }
    }
  }
}

// Export singleton instance
const simplifiedAgentSystem = new SimplifiedAgentSystem();

module.exports = {
  SimplifiedAgentSystem,
  simplifiedAgentSystem
};