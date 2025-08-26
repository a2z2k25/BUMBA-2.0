/**
 * BUMBA Real-Time Event Emitter
 * WebSocket-based event system for live agent collaboration
 * Enables real-time status updates and coordination
 */

const EventEmitter = require('events');

class RealtimeEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.channels = new Map();
    this.messageQueue = [];
    this.isConnected = false;
  }

  /**
   * Register an agent for real-time updates
   */
  registerAgent(agentId, agentInfo) {
    this.agents.set(agentId, {
      ...agentInfo,
      status: 'idle',
      lastActivity: Date.now(),
      subscribedChannels: new Set()
    });
    
    this.emit('agent:registered', { agentId, agentInfo });
    return true;
  }

  /**
   * Broadcast status update to all agents
   */
  broadcastStatus(agentId, status, metadata = {}) {
    if (!this.agents.has(agentId)) {
      return false;
    }

    const message = {
      type: 'status',
      agentId,
      status,
      metadata,
      timestamp: Date.now()
    };

    // Update agent status
    const agent = this.agents.get(agentId);
    agent.status = status;
    agent.lastActivity = Date.now();

    // Emit to all listeners
    this.emit('status:update', message);
    
    // Queue for WebSocket broadcast when implemented
    this.messageQueue.push(message);
    
    return true;
  }

  /**
   * Subscribe agent to collaboration channel
   */
  subscribeToChannel(agentId, channelName) {
    if (!this.agents.has(agentId)) {
      return false;
    }

    // Create channel if doesn't exist
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new Set());
    }

    // Add agent to channel
    this.channels.get(channelName).add(agentId);
    this.agents.get(agentId).subscribedChannels.add(channelName);

    this.emit('channel:joined', { agentId, channelName });
    return true;
  }

  /**
   * Send message to specific channel
   */
  sendToChannel(channelName, message) {
    if (!this.channels.has(channelName)) {
      return false;
    }

    const channelMessage = {
      type: 'channel',
      channel: channelName,
      message,
      timestamp: Date.now()
    };

    // Notify all agents in channel
    const subscribers = this.channels.get(channelName);
    subscribers.forEach(agentId => {
      this.emit(`channel:${channelName}:${agentId}`, channelMessage);
    });

    this.messageQueue.push(channelMessage);
    return true;
  }

  /**
   * Get current collaboration status
   */
  getCollaborationStatus() {
    const activeAgents = Array.from(this.agents.entries())
      .filter(([_, agent]) => agent.status !== 'idle')
      .map(([id, agent]) => ({
        id,
        status: agent.status,
        lastActivity: agent.lastActivity
      }));

    const activeChannels = Array.from(this.channels.entries())
      .map(([name, subscribers]) => ({
        name,
        subscribers: subscribers.size
      }));

    return {
      activeAgents,
      activeChannels,
      queuedMessages: this.messageQueue.length
    };
  }

  /**
   * Clean up inactive agents
   */
  cleanupInactive(maxInactiveMs = 300000) {
    const now = Date.now();
    const inactive = [];

    this.agents.forEach((agent, agentId) => {
      if (now - agent.lastActivity > maxInactiveMs) {
        inactive.push(agentId);
      }
    });

    inactive.forEach(agentId => {
      this.unregisterAgent(agentId);
    });

    return inactive.length;
  }

  /**
   * Unregister agent and cleanup
   */
  unregisterAgent(agentId) {
    if (!this.agents.has(agentId)) {
      return false;
    }

    const agent = this.agents.get(agentId);
    
    // Remove from all channels
    agent.subscribedChannels.forEach(channel => {
      if (this.channels.has(channel)) {
        this.channels.get(channel).delete(agentId);
      }
    });

    // Delete agent
    this.agents.delete(agentId);
    this.emit('agent:unregistered', { agentId });
    
    return true;
  }
}

module.exports = RealtimeEventEmitter;