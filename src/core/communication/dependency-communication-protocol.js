/**
 * Dependency Communication Protocol for BUMBA CLI
 * Enables sophisticated inter-agent communication for dependency management
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Message Types for Dependency Communication
 */
const MessageType = {
  // Dependency notifications
  DEPENDENCY_READY: 'dependency:ready',
  DEPENDENCY_BLOCKED: 'dependency:blocked',
  DEPENDENCY_COMPLETED: 'dependency:completed',
  DEPENDENCY_FAILED: 'dependency:failed',
  
  // Resource management
  RESOURCE_REQUEST: 'resource:request',
  RESOURCE_GRANT: 'resource:grant',
  RESOURCE_RELEASE: 'resource:release',
  RESOURCE_CONFLICT: 'resource:conflict',
  
  // Knowledge sharing
  KNOWLEDGE_PUBLISH: 'knowledge:publish',
  KNOWLEDGE_REQUEST: 'knowledge:request',
  KNOWLEDGE_TRANSFER: 'knowledge:transfer',
  
  // Coordination
  TASK_CLAIM: 'task:claim',
  TASK_HANDOFF: 'task:handoff',
  TASK_NEGOTIATION: 'task:negotiation',
  
  // Status updates
  STATUS_UPDATE: 'status:update',
  PROGRESS_REPORT: 'progress:report',
  BLOCKAGE_REPORT: 'blockage:report'
};

/**
 * Communication Channel for agents
 */
class CommunicationChannel extends EventEmitter {
  constructor(agentId, protocol) {
    super();
    this.agentId = agentId;
    this.protocol = protocol;
    this.subscriptions = new Set();
    this.messageQueue = [];
    this.acknowledgments = new Map();
  }
  
  /**
   * Send message to specific agent or broadcast
   */
  send(targetAgentId, messageType, payload) {
    const message = {
      id: this.generateMessageId(),
      from: this.agentId,
      to: targetAgentId,
      type: messageType,
      payload,
      timestamp: Date.now()
    };
    
    return this.protocol.routeMessage(message);
  }
  
  /**
   * Broadcast message to all agents
   */
  broadcast(messageType, payload) {
    return this.send('*', messageType, payload);
  }
  
  /**
   * Subscribe to specific message types
   */
  subscribe(messageType, handler) {
    this.on(messageType, handler);
    this.subscriptions.add(messageType);
    this.protocol.registerSubscription(this.agentId, messageType);
  }
  
  /**
   * Request acknowledgment for critical messages
   */
  async sendWithAck(targetAgentId, messageType, payload, timeout = 5000) {
    const messageId = this.generateMessageId();
    
    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this.acknowledgments.delete(messageId);
        reject(new Error(`Message ${messageId} not acknowledged within ${timeout}ms`));
      }, timeout);
      
      // Store acknowledgment handler
      this.acknowledgments.set(messageId, { resolve, reject, timer });
      
      // Send message
      const message = {
        id: messageId,
        from: this.agentId,
        to: targetAgentId,
        type: messageType,
        payload,
        requiresAck: true,
        timestamp: Date.now()
      };
      
      this.protocol.routeMessage(message);
    });
  }
  
  /**
   * Handle incoming message
   */
  handleMessage(message) {
    // Check if it's an acknowledgment
    if (message.type === 'ACK' && this.acknowledgments.has(message.ackFor)) {
      const ack = this.acknowledgments.get(message.ackFor);
      clearTimeout(ack.timer);
      ack.resolve(message);
      this.acknowledgments.delete(message.ackFor);
      return;
    }
    
    // Emit message to local handlers
    this.emit(message.type, message);
    
    // Send acknowledgment if required
    if (message.requiresAck) {
      this.send(message.from, 'ACK', {
        ackFor: message.id,
        received: Date.now()
      });
    }
  }
  
  generateMessageId() {
    return `${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Main Dependency Communication Protocol
 */
class DependencyCommunicationProtocol extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enableLogging: options.enableLogging !== false,
      messageRetention: options.messageRetention || 1000,
      broadcastDelay: options.broadcastDelay || 10,
      conflictResolution: options.conflictResolution || 'priority',
      ...options
    };
    
    // Core data structures
    this.channels = new Map(); // agentId -> CommunicationChannel
    this.subscriptions = new Map(); // messageType -> Set<agentId>
    this.messageHistory = []; // Recent messages for debugging
    this.resourceNegotiations = new Map(); // resourceId -> negotiation state
    this.knowledgeRegistry = new Map(); // dataType -> { provider, consumers }
    
    // Metrics
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      broadcastsSent: 0,
      conflicts: 0,
      negotiations: 0
    };
    
    logger.info('🟢 Dependency Communication Protocol initialized');
  }
  
  /**
   * Register an agent and create communication channel
   */
  registerAgent(agentId, metadata = {}) {
    if (this.channels.has(agentId)) {
      logger.warn(`Agent ${agentId} already registered`);
      return this.channels.get(agentId);
    }
    
    const channel = new CommunicationChannel(agentId, this);
    this.channels.set(agentId, channel);
    
    // Store agent metadata
    channel.metadata = metadata;
    
    logger.info(`🟢 Agent ${agentId} registered with communication protocol`);
    
    this.emit('agent:registered', { agentId, metadata });
    
    return channel;
  }
  
  /**
   * Unregister an agent
   */
  unregisterAgent(agentId) {
    const channel = this.channels.get(agentId);
    if (!channel) {return;}
    
    // Clean up subscriptions
    for (const [messageType, subscribers] of this.subscriptions) {
      subscribers.delete(agentId);
    }
    
    // Remove channel
    this.channels.delete(agentId);
    
    logger.info(`Agent ${agentId} unregistered from communication protocol`);
    
    this.emit('agent:unregistered', { agentId });
  }
  
  /**
   * Route message to appropriate agent(s)
   */
  routeMessage(message) {
    // Log message
    if (this.config.enableLogging) {
      this.logMessage(message);
    }
    
    // Update metrics
    this.metrics.messagesSent++;
    
    // Handle broadcast
    if (message.to === '*') {
      return this.broadcastMessage(message);
    }
    
    // Handle targeted message
    const targetChannel = this.channels.get(message.to);
    if (!targetChannel) {
      logger.warn(`Target agent ${message.to} not found`);
      return false;
    }
    
    // Deliver message
    setTimeout(() => {
      targetChannel.handleMessage(message);
      this.metrics.messagesReceived++;
    }, 0);
    
    return true;
  }
  
  /**
   * Broadcast message to all subscribed agents
   */
  broadcastMessage(message) {
    const subscribers = this.subscriptions.get(message.type) || new Set();
    
    // Don't send to originator
    subscribers.delete(message.from);
    
    if (subscribers.size === 0) {
      logger.debug(`No subscribers for message type ${message.type}`);
      return false;
    }
    
    // Broadcast with slight delay to prevent flooding
    setTimeout(() => {
      for (const agentId of subscribers) {
        const channel = this.channels.get(agentId);
        if (channel) {
          channel.handleMessage(message);
          this.metrics.messagesReceived++;
        }
      }
    }, this.config.broadcastDelay);
    
    this.metrics.broadcastsSent++;
    
    return true;
  }
  
  /**
   * Register subscription for message type
   */
  registerSubscription(agentId, messageType) {
    if (!this.subscriptions.has(messageType)) {
      this.subscriptions.set(messageType, new Set());
    }
    this.subscriptions.get(messageType).add(agentId);
    
    logger.debug(`Agent ${agentId} subscribed to ${messageType}`);
  }
  
  /**
   * Coordinate task handoff between agents
   */
  async coordinateHandoff(fromAgent, toAgent, task, context = {}) {
    const fromChannel = this.channels.get(fromAgent);
    const toChannel = this.channels.get(toAgent);
    
    if (!fromChannel || !toChannel) {
      throw new Error('Invalid agents for handoff');
    }
    
    // Initiate handoff
    const handoffId = this.generateHandoffId();
    
    // Notify receiving agent
    const accepted = await fromChannel.sendWithAck(
      toAgent,
      MessageType.TASK_HANDOFF,
      {
        handoffId,
        task,
        context,
        fromAgent
      }
    );
    
    if (accepted) {
      // Broadcast handoff completion
      fromChannel.broadcast(MessageType.STATUS_UPDATE, {
        handoffId,
        status: 'completed',
        task: task.id,
        from: fromAgent,
        to: toAgent
      });
      
      logger.info(`🟢 Task ${task.id} handed off from ${fromAgent} to ${toAgent}`);
    }
    
    return accepted;
  }
  
  /**
   * Negotiate resource access between agents
   */
  async negotiateResource(requestingAgent, resource, priority = 5) {
    const channel = this.channels.get(requestingAgent);
    if (!channel) {
      throw new Error(`Agent ${requestingAgent} not registered`);
    }
    
    // Check if resource is already under negotiation
    if (this.resourceNegotiations.has(resource)) {
      const negotiation = this.resourceNegotiations.get(resource);
      
      // Add to queue
      negotiation.queue.push({
        agent: requestingAgent,
        priority,
        timestamp: Date.now()
      });
      
      // Sort by priority
      negotiation.queue.sort((a, b) => b.priority - a.priority);
      
      logger.info(`Agent ${requestingAgent} queued for resource ${resource}`);
      
      return { status: 'queued', position: negotiation.queue.length };
    }
    
    // Start new negotiation
    const negotiation = {
      resource,
      owner: null,
      queue: [{
        agent: requestingAgent,
        priority,
        timestamp: Date.now()
      }],
      startedAt: Date.now()
    };
    
    this.resourceNegotiations.set(resource, negotiation);
    
    // Broadcast resource request
    channel.broadcast(MessageType.RESOURCE_REQUEST, {
      resource,
      agent: requestingAgent,
      priority
    });
    
    // Wait for responses
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if anyone else claimed it
        const currentNegotiation = this.resourceNegotiations.get(resource);
        
        if (currentNegotiation.queue[0].agent === requestingAgent) {
          // Grant resource
          currentNegotiation.owner = requestingAgent;
          
          channel.broadcast(MessageType.RESOURCE_GRANT, {
            resource,
            agent: requestingAgent
          });
          
          resolve({ status: 'granted', resource });
        } else {
          resolve({ 
            status: 'queued', 
            position: currentNegotiation.queue.findIndex(q => q.agent === requestingAgent) + 1
          });
        }
      }, 100); // Brief delay for other agents to respond
    });
  }
  
  /**
   * Release resource and notify next in queue
   */
  releaseResource(agent, resource) {
    const negotiation = this.resourceNegotiations.get(resource);
    if (!negotiation || negotiation.owner !== agent) {
      logger.warn(`Agent ${agent} cannot release resource ${resource}`);
      return false;
    }
    
    const channel = this.channels.get(agent);
    if (!channel) {return false;}
    
    // Remove current owner
    negotiation.queue = negotiation.queue.filter(q => q.agent !== agent);
    
    // Grant to next in queue
    if (negotiation.queue.length > 0) {
      const next = negotiation.queue[0];
      negotiation.owner = next.agent;
      
      const nextChannel = this.channels.get(next.agent);
      if (nextChannel) {
        nextChannel.handleMessage({
          type: MessageType.RESOURCE_GRANT,
          payload: { resource }
        });
      }
      
      logger.info(`🟢 Resource ${resource} transferred from ${agent} to ${next.agent}`);
    } else {
      // No more agents waiting, remove negotiation
      this.resourceNegotiations.delete(resource);
      logger.info(`Resource ${resource} released by ${agent}`);
    }
    
    // Broadcast release
    channel.broadcast(MessageType.RESOURCE_RELEASE, {
      resource,
      agent
    });
    
    return true;
  }
  
  /**
   * Share knowledge between agents
   */
  publishKnowledge(producerAgent, dataType, data) {
    const channel = this.channels.get(producerAgent);
    if (!channel) {
      throw new Error(`Agent ${producerAgent} not registered`);
    }
    
    // Store in knowledge registry
    this.knowledgeRegistry.set(dataType, {
      provider: producerAgent,
      data,
      timestamp: Date.now()
    });
    
    // Broadcast knowledge availability
    channel.broadcast(MessageType.KNOWLEDGE_PUBLISH, {
      dataType,
      provider: producerAgent,
      size: JSON.stringify(data).length
    });
    
    logger.info(`🟢 Knowledge ${dataType} published by ${producerAgent}`);
    
    return true;
  }
  
  /**
   * Request knowledge from provider
   */
  async requestKnowledge(consumerAgent, dataType) {
    const channel = this.channels.get(consumerAgent);
    if (!channel) {
      throw new Error(`Agent ${consumerAgent} not registered`);
    }
    
    const knowledge = this.knowledgeRegistry.get(dataType);
    if (!knowledge) {
      // Broadcast request
      channel.broadcast(MessageType.KNOWLEDGE_REQUEST, {
        dataType,
        requester: consumerAgent
      });
      
      // Wait for response
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 5000);
        
        channel.once(MessageType.KNOWLEDGE_TRANSFER, (message) => {
          if (message.payload.dataType === dataType) {
            clearTimeout(timeout);
            resolve(message.payload.data);
          }
        });
      });
    }
    
    // Direct transfer
    const providerChannel = this.channels.get(knowledge.provider);
    if (providerChannel) {
      await providerChannel.send(
        consumerAgent,
        MessageType.KNOWLEDGE_TRANSFER,
        {
          dataType,
          data: knowledge.data
        }
      );
    }
    
    return knowledge.data;
  }
  
  /**
   * Report blockage to managers
   */
  reportBlockage(agent, blockage) {
    const channel = this.channels.get(agent);
    if (!channel) {return;}
    
    // Find manager agents
    const managers = Array.from(this.channels.entries())
      .filter(([id, ch]) => ch.metadata?.role === 'manager')
      .map(([id]) => id);
    
    // Report to managers
    for (const managerId of managers) {
      channel.send(managerId, MessageType.BLOCKAGE_REPORT, {
        agent,
        blockage,
        timestamp: Date.now()
      });
    }
    
    logger.warn(`🟡 Blockage reported by ${agent}: ${JSON.stringify(blockage)}`);
    
    this.emit('blockage:reported', { agent, blockage });
  }
  
  /**
   * Log message for debugging
   */
  logMessage(message) {
    this.messageHistory.push(message);
    
    // Keep only recent messages
    if (this.messageHistory.length > this.config.messageRetention) {
      this.messageHistory.shift();
    }
  }
  
  /**
   * Get communication metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeAgents: this.channels.size,
      subscriptions: Array.from(this.subscriptions.entries()).map(([type, subs]) => ({
        type,
        subscribers: subs.size
      })),
      activeNegotiations: this.resourceNegotiations.size,
      knowledgeTypes: this.knowledgeRegistry.size
    };
  }
  
  /**
   * Generate handoff ID
   */
  generateHandoffId() {
    return `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get communication status
   */
  getStatus() {
    return {
      agents: Array.from(this.channels.keys()),
      activeNegotiations: Array.from(this.resourceNegotiations.entries()).map(([resource, neg]) => ({
        resource,
        owner: neg.owner,
        queueLength: neg.queue.length
      })),
      knowledgeAvailable: Array.from(this.knowledgeRegistry.keys()),
      metrics: this.getMetrics()
    };
  }
}

module.exports = {
  DependencyCommunicationProtocol,
  CommunicationChannel,
  MessageType
};