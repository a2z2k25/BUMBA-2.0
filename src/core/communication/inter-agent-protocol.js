/**
 * Inter-agent Communication Protocol - Direct agent-to-agent messaging system
 * Provides secure, reliable communication between agents with discovery, routing, and encryption
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

/**
 * Message types for inter-agent communication
 */
const MessageType = {
  REQUEST: 'request',
  RESPONSE: 'response',
  NOTIFICATION: 'notification',
  HEARTBEAT: 'heartbeat',
  DISCOVERY: 'discovery',
  HANDSHAKE: 'handshake',
  ERROR: 'error'
};

/**
 * Agent communication states
 */
const AgentState = {
  INITIALIZING: 'initializing',
  AVAILABLE: 'available',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error'
};

/**
 * Message delivery guarantees
 */
const DeliveryGuarantee = {
  BEST_EFFORT: 'best_effort',
  AT_LEAST_ONCE: 'at_least_once',
  EXACTLY_ONCE: 'exactly_once'
};

/**
 * Inter-Agent Communication Protocol Manager
 */
class InterAgentProtocol extends EventEmitter {
  constructor(agentId, config = {}) {
    super();
    this.setMaxListeners(10000);
    
    this.agentId = agentId;
    this.config = {
      enableEncryption: true,
      enableAuthentication: true,
      discoveryInterval: 30000,
      heartbeatInterval: 10000,
      requestTimeout: 30000,
      maxRetries: 3,
      routingStrategy: 'direct',
      enableMessageQueueing: true,
      queueSize: 1000,
      compressionThreshold: 1024,
      ...config
    };
    
    // Agent registry and discovery
    this.agentRegistry = new Map(); // agentId -> AgentInfo
    this.routingTable = new Map(); // agentId -> routing info
    this.capabilities = new Map(); // agentId -> capabilities
    
    // Message handling
    this.pendingRequests = new Map(); // requestId -> { resolve, reject, timeout }
    this.messageQueue = [];
    this.deliveryTracking = new Map(); // messageId -> delivery info
    
    // Connection management
    this.connections = new Map(); // agentId -> connection info
    this.sessionKeys = new Map(); // agentId -> session key
    
    // State management
    this.state = AgentState.INITIALIZING;
    this.lastHeartbeat = Date.now();
    this.discoveryBeacon = null;
    this.heartbeatTimer = null;
    
    // Performance metrics
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      requestsProcessed: 0,
      failedDeliveries: 0,
      averageResponseTime: 0,
      discoveredAgents: 0,
      activeConnections: 0
    };
    
    // Initialize protocol
    this.initialize();
    
    logger.info(`🤝 Inter-Agent Protocol initialized for ${agentId}`, {
      encryption: this.config.enableEncryption,
      authentication: this.config.enableAuthentication,
      routingStrategy: this.config.routingStrategy
    });
  }

  /**
   * Initialize the protocol and start discovery
   */
  async initialize() {
    try {
      // Register self in the network
      await this.registerAgent();
      
      // Start discovery process
      this.startDiscovery();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Set state to available
      this.setState(AgentState.AVAILABLE);
      
      this.emit('protocol:initialized', { agentId: this.agentId });
      
    } catch (error) {
      logger.error(`🔴 Protocol initialization failed for ${this.agentId}:`, error);
      this.setState(AgentState.ERROR);
    }
  }

  /**
   * Register agent in the network
   */
  async registerAgent() {
    const agentInfo = {
      id: this.agentId,
      state: this.state,
      capabilities: this.getAgentCapabilities(),
      endpoint: this.getAgentEndpoint(),
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      version: '1.0.0',
      metadata: {
        framework: 'bumba',
        protocolVersion: '1.0.0'
      }
    };
    
    this.agentRegistry.set(this.agentId, agentInfo);
    
    // Broadcast registration to network
    await this.broadcastMessage({
      type: MessageType.DISCOVERY,
      action: 'register',
      agentInfo
    });
    
    logger.debug(`📝 Agent registered: ${this.agentId}`);
  }

  /**
   * Send direct message to another agent
   */
  async sendMessage(targetAgentId, payload, options = {}) {
    const {
      type = MessageType.NOTIFICATION,
      timeout = this.config.requestTimeout,
      deliveryGuarantee = DeliveryGuarantee.BEST_EFFORT,
      encrypted = this.config.enableEncryption,
      priority = 'normal'
    } = options;
    
    // Validate target agent
    const targetAgent = this.agentRegistry.get(targetAgentId);
    if (!targetAgent) {
      throw new Error(`Agent not found: ${targetAgentId}`);
    }
    
    // Create message
    const message = {
      id: this.generateMessageId(),
      type,
      sourceAgentId: this.agentId,
      targetAgentId,
      payload,
      timestamp: Date.now(),
      priority,
      deliveryGuarantee,
      metadata: {
        encrypted,
        compressed: JSON.stringify(payload).length > this.config.compressionThreshold,
        version: '1.0.0'
      }
    };
    
    // Encrypt if required
    if (encrypted) {
      message.payload = await this.encryptMessage(targetAgentId, message.payload);
      message.metadata.encrypted = true;
    }
    
    // Compress if required
    if (message.metadata.compressed) {
      message.payload = this.compressMessage(message.payload);
    }
    
    // Handle different message types
    if (type === MessageType.REQUEST) {
      return await this.sendRequest(message, timeout);
    } else {
      return await this.deliverMessage(message);
    }
  }

  /**
   * Send request and wait for response
   */
  async sendRequest(message, timeout) {
    return new Promise((resolve, reject) => {
      const requestId = message.id;
      
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${requestId}`));
      }, timeout);
      
      // Store request for response handling
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
        startTime: Date.now()
      });
      
      // Deliver the message
      this.deliverMessage(message).catch(error => {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutHandle);
        reject(error);
      });
    });
  }

  /**
   * Send response to a request
   */
  async sendResponse(originalMessage, responsePayload, success = true) {
    const responseMessage = {
      id: this.generateMessageId(),
      type: MessageType.RESPONSE,
      sourceAgentId: this.agentId,
      targetAgentId: originalMessage.sourceAgentId,
      requestId: originalMessage.id,
      payload: responsePayload,
      success,
      timestamp: Date.now(),
      metadata: {
        responseTime: Date.now() - originalMessage.timestamp
      }
    };
    
    // Encrypt if original was encrypted
    if (originalMessage.metadata?.encrypted) {
      responseMessage.payload = await this.encryptMessage(
        originalMessage.sourceAgentId, 
        responseMessage.payload
      );
      responseMessage.metadata.encrypted = true;
    }
    
    return await this.deliverMessage(responseMessage);
  }

  /**
   * Deliver message to target agent
   */
  async deliverMessage(message) {
    try {
      // Check if target agent is available
      const targetAgent = this.agentRegistry.get(message.targetAgentId);
      if (!targetAgent || targetAgent.state === AgentState.UNAVAILABLE) {
        throw new Error(`Target agent unavailable: ${message.targetAgentId}`);
      }
      
      // Track delivery
      if (message.deliveryGuarantee !== DeliveryGuarantee.BEST_EFFORT) {
        this.deliveryTracking.set(message.id, {
          message,
          attempts: 0,
          status: 'pending',
          createdAt: Date.now()
        });
      }
      
      // Route message
      const success = await this.routeMessage(message);
      
      if (success) {
        this.metrics.messagesSent++;
        this.emit('message:sent', { message, targetAgentId: message.targetAgentId });
        
        // Update delivery tracking
        if (this.deliveryTracking.has(message.id)) {
          this.deliveryTracking.get(message.id).status = 'delivered';
        }
        
        return { messageId: message.id, delivered: true };
      } else {
        throw new Error('Message delivery failed');
      }
      
    } catch (error) {
      this.metrics.failedDeliveries++;
      
      // Handle retry for guaranteed delivery
      if (message.deliveryGuarantee === DeliveryGuarantee.AT_LEAST_ONCE) {
        await this.scheduleRetry(message, error);
      }
      
      logger.warn(`📤 Message delivery failed: ${message.id} -> ${message.targetAgentId}`);
      throw error;
    }
  }

  /**
   * Route message to target agent
   */
  async routeMessage(message) {
    const targetAgentId = message.targetAgentId;
    
    // Check for direct connection
    const connection = this.connections.get(targetAgentId);
    if (connection && connection.status === 'active') {
      return await this.sendViaConnection(message, connection);
    }
    
    // Use routing strategy
    switch (this.config.routingStrategy) {
      case 'direct':
        return await this.sendDirectMessage(message);
      
      case 'relay':
        return await this.sendViaRelay(message);
      
      case 'broadcast':
        return await this.sendViaBroadcast(message);
      
      default:
        return await this.sendDirectMessage(message);
    }
  }

  /**
   * Send message directly to target agent
   */
  async sendDirectMessage(message) {
    try {
      // In a real implementation, this would use actual networking
      // For this simulation, we emit events that can be caught by other agents
      this.emit('network:message', message);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      
      return true;
    } catch (error) {
      logger.error(`Direct message send failed: ${message.id}`, error);
      return false;
    }
  }

  /**
   * Handle incoming message
   */
  async handleIncomingMessage(message) {
    try {
      // Validate message
      if (!this.validateMessage(message)) {
        throw new Error(`Invalid message: ${message.id}`);
      }
      
      // Decrypt if encrypted
      if (message.metadata?.encrypted) {
        message.payload = await this.decryptMessage(message.sourceAgentId, message.payload);
      }
      
      // Decompress if compressed
      if (message.metadata?.compressed) {
        message.payload = this.decompressMessage(message.payload);
      }
      
      this.metrics.messagesReceived++;
      
      // Handle different message types
      switch (message.type) {
        case MessageType.REQUEST:
          await this.handleRequest(message);
          break;
          
        case MessageType.RESPONSE:
          await this.handleResponse(message);
          break;
          
        case MessageType.NOTIFICATION:
          await this.handleNotification(message);
          break;
          
        case MessageType.DISCOVERY:
          await this.handleDiscovery(message);
          break;
          
        case MessageType.HEARTBEAT:
          await this.handleHeartbeat(message);
          break;
          
        case MessageType.HANDSHAKE:
          await this.handleHandshake(message);
          break;
          
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
      
      this.emit('message:received', { message, sourceAgentId: message.sourceAgentId });
      
    } catch (error) {
      logger.error(`Message handling failed: ${message.id}`, error);
      
      // Send error response if it was a request
      if (message.type === MessageType.REQUEST) {
        await this.sendResponse(message, { error: error.message }, false);
      }
    }
  }

  /**
   * Handle incoming request
   */
  async handleRequest(message) {
    this.metrics.requestsProcessed++;
    
    // Emit request event for application layer
    this.emit('request:received', {
      requestId: message.id,
      sourceAgentId: message.sourceAgentId,
      payload: message.payload,
      respond: async (responsePayload, success = true) => {
        await this.sendResponse(message, responsePayload, success);
      }
    });
  }

  /**
   * Handle incoming response
   */
  async handleResponse(message) {
    const requestInfo = this.pendingRequests.get(message.requestId);
    
    if (requestInfo) {
      clearTimeout(requestInfo.timeout);
      this.pendingRequests.delete(message.requestId);
      
      // Update response time metrics
      const responseTime = Date.now() - requestInfo.startTime;
      this.updateAverageResponseTime(responseTime);
      
      if (message.success) {
        requestInfo.resolve(message.payload);
      } else {
        requestInfo.reject(new Error(message.payload?.error || 'Request failed'));
      }
    }
  }

  /**
   * Handle discovery messages
   */
  async handleDiscovery(message) {
    const { action, agentInfo } = message.payload;
    
    switch (action) {
      case 'register':
        await this.handleAgentRegistration(agentInfo);
        break;
        
      case 'unregister':
        await this.handleAgentUnregistration(agentInfo.id);
        break;
        
      case 'query':
        await this.handleDiscoveryQuery(message);
        break;
        
      case 'response':
        await this.handleDiscoveryResponse(message.payload.agents);
        break;
    }
  }

  /**
   * Handle agent registration
   */
  async handleAgentRegistration(agentInfo) {
    const existingAgent = this.agentRegistry.get(agentInfo.id);
    
    if (!existingAgent || agentInfo.registeredAt > existingAgent.registeredAt) {
      this.agentRegistry.set(agentInfo.id, agentInfo);
      this.metrics.discoveredAgents = this.agentRegistry.size;
      
      // Establish connection if needed
      if (agentInfo.id !== this.agentId) {
        await this.establishConnection(agentInfo);
      }
      
      this.emit('agent:discovered', { agentInfo });
      logger.debug(`🔍 Agent discovered: ${agentInfo.id}`);
    }
  }

  /**
   * Establish connection with another agent
   */
  async establishConnection(agentInfo) {
    try {
      // Perform handshake
      const handshakePayload = {
        agentId: this.agentId,
        capabilities: this.getAgentCapabilities(),
        protocolVersion: '1.0.0',
        timestamp: Date.now()
      };
      
      const response = await this.sendMessage(agentInfo.id, handshakePayload, {
        type: MessageType.HANDSHAKE,
        timeout: 5000
      });
      
      // Create session key for encryption
      const sessionKey = this.generateSessionKey();
      this.sessionKeys.set(agentInfo.id, sessionKey);
      
      // Store connection info
      this.connections.set(agentInfo.id, {
        agentId: agentInfo.id,
        status: 'active',
        establishedAt: Date.now(),
        sessionKey,
        lastActivity: Date.now()
      });
      
      this.metrics.activeConnections = this.connections.size;
      
      this.emit('connection:established', { agentId: agentInfo.id });
      logger.debug(`🔗 Connection established: ${this.agentId} <-> ${agentInfo.id}`);
      
    } catch (error) {
      logger.error(`Connection establishment failed: ${agentInfo.id}`, error);
    }
  }

  /**
   * Start agent discovery process
   */
  startDiscovery() {
    this.discoveryBeacon = setInterval(async () => {
      try {
        // Broadcast discovery query
        await this.broadcastMessage({
          type: MessageType.DISCOVERY,
          action: 'query',
          agentId: this.agentId
        });
        
      } catch (error) {
        logger.error('Discovery broadcast failed:', error);
      }
    }, this.config.discoveryInterval);
    
    logger.debug(`🔍 Discovery started for ${this.agentId}`);
  }

  /**
   * Start heartbeat process
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        this.lastHeartbeat = Date.now();
        
        // Send heartbeat to all connected agents
        for (const agentId of this.connections.keys()) {
          await this.sendMessage(agentId, {
            timestamp: this.lastHeartbeat,
            state: this.state
          }, {
            type: MessageType.HEARTBEAT
          });
        }
        
      } catch (error) {
        logger.error('Heartbeat failed:', error);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Message encryption/decryption
   */
  async encryptMessage(targetAgentId, payload) {
    const sessionKey = this.sessionKeys.get(targetAgentId);
    if (!sessionKey) {
      throw new Error(`No session key for agent: ${targetAgentId}`);
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', sessionKey);
    
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: true,
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decryptMessage(sourceAgentId, encryptedPayload) {
    const sessionKey = this.sessionKeys.get(sourceAgentId);
    if (!sessionKey) {
      throw new Error(`No session key for agent: ${sourceAgentId}`);
    }
    
    const decipher = crypto.createDecipher('aes-256-gcm', sessionKey);
    decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedPayload.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Message compression
   */
  compressMessage(payload) {
    // Simplified compression (in production, use zlib)
    return { compressed: true, data: JSON.stringify(payload) };
  }

  decompressMessage(compressedPayload) {
    return JSON.parse(compressedPayload.data);
  }

  /**
   * Helper methods
   */
  generateMessageId() {
    return `msg_${this.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  getAgentCapabilities() {
    return {
      messageTypes: Object.values(MessageType),
      deliveryGuarantees: Object.values(DeliveryGuarantee),
      encryption: this.config.enableEncryption,
      compression: true,
      routing: [this.config.routingStrategy]
    };
  }

  getAgentEndpoint() {
    return `agent://${this.agentId}`;
  }

  validateMessage(message) {
    return message && 
           message.id && 
           message.type && 
           message.sourceAgentId && 
           message.targetAgentId &&
           message.timestamp;
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    this.emit('state:changed', { oldState, newState });
    logger.debug(`🔄 Agent state changed: ${this.agentId} ${oldState} -> ${newState}`);
  }

  updateAverageResponseTime(responseTime) {
    const processed = this.metrics.requestsProcessed;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (processed - 1) + responseTime) / processed;
  }

  async broadcastMessage(payload) {
    // Simplified broadcast to all known agents
    for (const agentId of this.agentRegistry.keys()) {
      if (agentId !== this.agentId) {
        try {
          await this.sendMessage(agentId, payload);
        } catch (error) {
          // Ignore individual failures in broadcast
        }
      }
    }
  }

  async scheduleRetry(message, error) {
    const tracking = this.deliveryTracking.get(message.id);
    if (!tracking) return;
    
    tracking.attempts++;
    
    if (tracking.attempts < this.config.maxRetries) {
      const delay = Math.pow(2, tracking.attempts) * 1000; // Exponential backoff
      
      setTimeout(async () => {
        try {
          await this.deliverMessage(message);
        } catch (retryError) {
          await this.scheduleRetry(message, retryError);
        }
      }, delay);
    } else {
      tracking.status = 'failed';
      this.emit('message:failed', { messageId: message.id, error: error.message });
    }
  }

  /**
   * Get protocol statistics
   */
  getProtocolStats() {
    return {
      agentId: this.agentId,
      state: this.state,
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      connections: {
        active: this.connections.size,
        total: this.agentRegistry.size
      },
      queues: {
        pending: this.pendingRequests.size,
        tracking: this.deliveryTracking.size
      },
      uptime: Date.now() - this.lastHeartbeat
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info(`🔄 Shutting down Inter-Agent Protocol for ${this.agentId}...`);
    
    // Stop discovery and heartbeat
    if (this.discoveryBeacon) {
      clearInterval(this.discoveryBeacon);
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Send unregistration message
    await this.broadcastMessage({
      type: MessageType.DISCOVERY,
      action: 'unregister',
      agentInfo: { id: this.agentId }
    });
    
    // Close all connections
    this.connections.clear();
    this.sessionKeys.clear();
    
    this.setState(AgentState.UNAVAILABLE);
    
    this.emit('protocol:shutdown', { agentId: this.agentId });
    logger.info(`🏁 Inter-Agent Protocol shutdown complete for ${this.agentId}`);
  }

  // Placeholder handler methods (to be implemented by subclasses)
  async handleNotification(message) {
    this.emit('notification:received', message);
  }

  async handleHeartbeat(message) {
    const agentInfo = this.agentRegistry.get(message.sourceAgentId);
    if (agentInfo) {
      agentInfo.lastSeen = Date.now();
      agentInfo.state = message.payload.state;
    }
  }

  async handleHandshake(message) {
    // Simple handshake response
    return { acknowledged: true, timestamp: Date.now() };
  }

  async handleDiscoveryQuery(message) {
    // Respond with known agents
    await this.sendMessage(message.sourceAgentId, {
      action: 'response',
      agents: Array.from(this.agentRegistry.values())
    }, {
      type: MessageType.DISCOVERY
    });
  }

  async handleDiscoveryResponse(agents) {
    for (const agentInfo of agents) {
      if (agentInfo.id !== this.agentId) {
        await this.handleAgentRegistration(agentInfo);
      }
    }
  }

  async handleAgentUnregistration(agentId) {
    this.agentRegistry.delete(agentId);
    this.connections.delete(agentId);
    this.sessionKeys.delete(agentId);
    
    this.metrics.discoveredAgents = this.agentRegistry.size;
    this.metrics.activeConnections = this.connections.size;
    
    this.emit('agent:disconnected', { agentId });
  }

  async sendViaConnection(message, connection) {
    // Use existing connection
    connection.lastActivity = Date.now();
    return await this.sendDirectMessage(message);
  }

  async sendViaRelay(message) {
    // Placeholder for relay routing
    return await this.sendDirectMessage(message);
  }

  async sendViaBroadcast(message) {
    // Placeholder for broadcast routing
    return await this.sendDirectMessage(message);
  }
}

module.exports = {
  InterAgentProtocol,
  MessageType,
  AgentState,
  DeliveryGuarantee
};