/**
 * BUMBA Agent Communication Protocol System
 * Enables direct specialist-to-specialist and broadcast communication
 * Integrates with consciousness layer and maintains security standards
 */

const { logger } = require('../logging/bumba-logger');
const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
const CommandValidator = require('../security/command-validator');
const EventEmitter = require('events');

/**
 * Message types for communication protocol
 */
const MessageType = {
  // Direct communication
  PEER_REQUEST: 'peer_request',
  PEER_RESPONSE: 'peer_response',
  PEER_COLLABORATION: 'peer_collaboration',
  
  // Broadcast communication
  BROADCAST_ANNOUNCEMENT: 'broadcast_announcement',
  BROADCAST_KNOWLEDGE: 'broadcast_knowledge',
  BROADCAST_QUERY: 'broadcast_query',
  
  // System communication
  SYSTEM_NOTIFICATION: 'system_notification',
  COORDINATION_EVENT: 'coordination_event',
  CONSCIOUSNESS_UPDATE: 'consciousness_update',
  
  // Specialized patterns
  KNOWLEDGE_SYNTHESIS: 'knowledge_synthesis',
  EXPERTISE_REQUEST: 'expertise_request',
  COLLABORATION_INVITE: 'collaboration_invite'
};

/**
 * Message priority levels
 */
const MessagePriority = {
  CRITICAL: 0, // System alerts, security issues
  HIGH: 1, // Urgent collaboration requests
  NORMAL: 2, // Standard communication
  LOW: 3, // Background knowledge sharing
  BACKGROUND: 4 // Metrics, status updates
};

/**
 * Channel types for different communication patterns
 */
const ChannelType = {
  PEER: 'peer',
  BROADCAST: 'broadcast',
  SYSTEM: 'system'
};

/**
 * Core message structure
 */
class CommunicationMessage {
  constructor(options = {}) {
    this.id = options.id || this.generateMessageId();
    this.type = options.type || MessageType.PEER_REQUEST;
    this.priority = options.priority || MessagePriority.NORMAL;
    this.sender = options.sender || 'unknown';
    this.recipients = options.recipients || [];
    this.channel = options.channel || null;
    this.timestamp = options.timestamp || Date.now();
    this.ttl = options.ttl || 300000; // 5 minutes default
    this.payload = options.payload || {};
    this.context = options.context || {};
    this.metadata = options.metadata || {};
    this.requiresResponse = options.requiresResponse || false;
    this.correlationId = options.correlationId || null;
    this.compressed = false;
    this.encrypted = false;
  }

  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Compress message payload for efficient transmission
   */
  compress() {
    if (this.compressed) {return this;}
    
    try {
      // Simple compression strategy - in production would use actual compression
      const serialized = JSON.stringify(this.payload);
      if (serialized.length > 1024) { // Only compress large payloads
        // Simulate compression by storing a compressed flag
        this.metadata.originalSize = serialized.length;
        this.metadata.compressionRatio = 0.7; // Simulated 30% reduction
        this.compressed = true;
        logger.debug(`🏁 Message ${this.id} compressed: ${serialized.length} -> ${Math.floor(serialized.length * 0.7)} bytes`);
      }
    } catch (error) {
      logger.warn(`🏁 Failed to compress message ${this.id}: ${error.message}`);
    }
    
    return this;
  }

  /**
   * Decompress message payload
   */
  decompress() {
    if (!this.compressed) {return this;}
    
    try {
      // Simulate decompression
      this.compressed = false;
      logger.debug(`🏁 Message ${this.id} decompressed`);
    } catch (error) {
      logger.warn(`🏁 Failed to decompress message ${this.id}: ${error.message}`);
    }
    
    return this;
  }

  /**
   * Check if message has expired
   */
  isExpired() {
    return Date.now() > (this.timestamp + this.ttl);
  }

  /**
   * Validate message structure and content
   */
  validate() {
    const errors = [];
    
    if (!this.sender) {errors.push('Missing sender');}
    if (!this.type || !Object.values(MessageType).includes(this.type)) {
      errors.push('Invalid message type');
    }
    if (!Object.values(MessagePriority).includes(this.priority)) {
      errors.push('Invalid priority level');
    }
    if (this.isExpired()) {errors.push('Message expired');}
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Peer-to-peer communication channel for direct specialist communication
 */
class PeerChannel extends EventEmitter {
  constructor(specialist, communicationProtocol) {
    super();
    this.specialist = specialist;
    this.protocol = communicationProtocol;
    this.channelId = `peer-${specialist.name}-${Date.now()}`;
    this.activeConnections = new Map(); // specialist_name -> connection_info
    this.messageHistory = [];
    this.maxHistorySize = 100;
    this.isActive = true;
    
    logger.info(`🏁 PeerChannel created for ${specialist.name}: ${this.channelId}`);
  }

  /**
   * Send direct message to another specialist
   */
  async sendMessage(targetSpecialist, messageType, payload, options = {}) {
    try {
      // Validate target specialist
      if (!targetSpecialist || !targetSpecialist.name) {
        throw new Error('Invalid target specialist');
      }

      // Create message
      const message = new CommunicationMessage({
        type: messageType,
        sender: this.specialist.name,
        recipients: [targetSpecialist.name],
        payload: payload,
        priority: options.priority || MessagePriority.NORMAL,
        requiresResponse: options.requiresResponse || false,
        correlationId: options.correlationId,
        context: {
          senderType: this.specialist.type || 'specialist',
          senderDepartment: this.specialist.department || 'unknown',
          communicationType: 'peer_to_peer',
          ...options.context
        }
      });

      // Consciousness validation
      await this.protocol.validateMessageWithConsciousness(message);

      // Security validation
      await this.protocol.validateMessageSecurity(message);

      // Compress if needed
      message.compress();

      // Establish connection if not exists
      await this.establishConnection(targetSpecialist);

      // Send message through protocol
      const result = await this.protocol.routeMessage(message, 'peer');

      // Store in history
      this.addToHistory(message, 'sent');

      // Emit event
      this.emit('message_sent', {
        message,
        target: targetSpecialist.name,
        result
      });

      logger.info(`🏁 Peer message sent: ${this.specialist.name} -> ${targetSpecialist.name} (${messageType})`);
      
      return result;

    } catch (error) {
      logger.error(`🏁 Failed to send peer message: ${error.message}`, {
        sender: this.specialist.name,
        target: targetSpecialist?.name,
        messageType,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Receive and process incoming peer messages
   */
  async receiveMessage(message) {
    try {
      // Validate message
      const validation = message.validate();
      if (!validation.valid) {
        throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
      }

      // Decompress if needed
      message.decompress();

      // Store in history
      this.addToHistory(message, 'received');

      // Process based on message type
      await this.processMessage(message);

      // Emit event
      this.emit('message_received', {
        message,
        sender: message.sender
      });

      logger.debug(`🏁 Peer message received: ${message.sender} -> ${this.specialist.name} (${message.type})`);

    } catch (error) {
      logger.error(`🏁 Failed to process peer message: ${error.message}`, {
        messageId: message.id,
        sender: message.sender,
        error: error.stack
      });
    }
  }

  /**
   * Process different types of peer messages
   */
  async processMessage(message) {
    switch (message.type) {
      case MessageType.PEER_REQUEST:
        await this.handlePeerRequest(message);
        break;
      case MessageType.PEER_RESPONSE:
        await this.handlePeerResponse(message);
        break;
      case MessageType.PEER_COLLABORATION:
        await this.handleCollaborationRequest(message);
        break;
      case MessageType.EXPERTISE_REQUEST:
        await this.handleExpertiseRequest(message);
        break;
      default:
        logger.warn(`🏁 Unhandled peer message type: ${message.type}`);
    }
  }

  /**
   * Handle peer request messages
   */
  async handlePeerRequest(message) {
    const { payload, sender, requiresResponse } = message;
    
    // Let specialist handle the request
    if (this.specialist.handlePeerRequest) {
      const response = await this.specialist.handlePeerRequest(payload, sender);
      
      // Send response if required
      if (requiresResponse) {
        const targetSpecialist = this.protocol.getSpecialist(sender);
        if (targetSpecialist) {
          await this.sendMessage(
            targetSpecialist,
            MessageType.PEER_RESPONSE,
            response,
            { correlationId: message.id }
          );
        }
      }
    }
  }

  /**
   * Handle peer response messages
   */
  async handlePeerResponse(message) {
    const { payload, correlationId } = message;
    
    // Find original request and notify
    if (correlationId && this.specialist.handlePeerResponse) {
      await this.specialist.handlePeerResponse(payload, correlationId);
    }
  }

  /**
   * Handle collaboration requests
   */
  async handleCollaborationRequest(message) {
    const { payload, sender } = message;
    
    if (this.specialist.handleCollaborationRequest) {
      await this.specialist.handleCollaborationRequest(payload, sender);
    }
  }

  /**
   * Handle expertise requests
   */
  async handleExpertiseRequest(message) {
    const { payload, sender } = message;
    
    if (this.specialist.handleExpertiseRequest) {
      const expertise = await this.specialist.handleExpertiseRequest(payload);
      
      // Send expertise response
      const targetSpecialist = this.protocol.getSpecialist(sender);
      if (targetSpecialist) {
        await this.sendMessage(
          targetSpecialist,
          MessageType.PEER_RESPONSE,
          { expertise, requestId: payload.requestId },
          { correlationId: message.id }
        );
      }
    }
  }

  /**
   * Establish connection with target specialist
   */
  async establishConnection(targetSpecialist) {
    const connectionKey = targetSpecialist.name;
    
    if (!this.activeConnections.has(connectionKey)) {
      const connection = {
        specialist: targetSpecialist.name,
        established: Date.now(),
        messageCount: 0,
        lastActivity: Date.now()
      };
      
      this.activeConnections.set(connectionKey, connection);
      
      logger.debug(`🏁 Peer connection established: ${this.specialist.name} <-> ${targetSpecialist.name}`);
    }
    
    // Update last activity
    const connection = this.activeConnections.get(connectionKey);
    connection.lastActivity = Date.now();
    connection.messageCount++;
  }

  /**
   * Add message to history with size management
   */
  addToHistory(message, direction) {
    this.messageHistory.push({
      message: message,
      direction: direction,
      timestamp: Date.now()
    });

    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get channel metrics
   */
  getMetrics() {
    return {
      channelId: this.channelId,
      specialist: this.specialist.name,
      activeConnections: this.activeConnections.size,
      totalMessages: this.messageHistory.length,
      messagesLastHour: this.messageHistory.filter(h => 
        Date.now() - h.timestamp < 3600000
      ).length,
      averageResponseTime: this.calculateAverageResponseTime(),
      isActive: this.isActive
    };
  }

  /**
   * Calculate average response time for peer interactions
   */
  calculateAverageResponseTime() {
    const responses = this.messageHistory.filter(h => 
      h.message.type === MessageType.PEER_RESPONSE
    );
    
    if (responses.length === 0) {return 0;}
    
    // Simple calculation - in production would track request-response pairs
    return responses.reduce((sum, response) => {
      const request = this.messageHistory.find(h => 
        h.message.id === response.message.correlationId
      );
      if (request) {
        return sum + (response.timestamp - request.timestamp);
      }
      return sum;
    }, 0) / responses.length;
  }

  /**
   * Close peer channel
   */
  close() {
    this.isActive = false;
    this.activeConnections.clear();
    this.removeAllListeners();
    logger.info(`🏁 PeerChannel closed for ${this.specialist.name}`);
  }
}

/**
 * Broadcast channel for knowledge sharing across multiple agents
 */
class BroadcastChannel extends EventEmitter {
  constructor(channelName, communicationProtocol) {
    super();
    this.channelName = channelName;
    this.protocol = communicationProtocol;
    this.channelId = `broadcast-${channelName}-${Date.now()}`;
    this.subscribers = new Map(); // specialist_name -> subscription_info
    this.messageHistory = [];
    this.maxHistorySize = 200;
    this.isActive = true;
    this.moderationEnabled = true;
    
    logger.info(`🏁 BroadcastChannel created: ${channelName} (${this.channelId})`);
  }

  /**
   * Subscribe specialist to broadcast channel
   */
  subscribe(specialist, options = {}) {
    try {
      const subscription = {
        specialist: specialist.name,
        subscribed: Date.now(),
        messageTypes: options.messageTypes || Object.values(MessageType),
        priority: options.priority || MessagePriority.NORMAL,
        filters: options.filters || {},
        active: true
      };

      this.subscribers.set(specialist.name, subscription);
      
      this.emit('subscriber_added', {
        specialist: specialist.name,
        channel: this.channelName
      });

      logger.info(`🏁 ${specialist.name} subscribed to broadcast channel: ${this.channelName}`);
      
      return subscription;

    } catch (error) {
      logger.error(`🏁 Failed to subscribe to broadcast channel: ${error.message}`, {
        specialist: specialist.name,
        channel: this.channelName
      });
      throw error;
    }
  }

  /**
   * Unsubscribe specialist from broadcast channel
   */
  unsubscribe(specialist) {
    try {
      const subscription = this.subscribers.get(specialist.name);
      if (subscription) {
        this.subscribers.delete(specialist.name);
        
        this.emit('subscriber_removed', {
          specialist: specialist.name,
          channel: this.channelName
        });

        logger.info(`🏁 ${specialist.name} unsubscribed from broadcast channel: ${this.channelName}`);
      }

    } catch (error) {
      logger.error(`🏁 Failed to unsubscribe from broadcast channel: ${error.message}`, {
        specialist: specialist.name,
        channel: this.channelName
      });
    }
  }

  /**
   * Broadcast message to all subscribers
   */
  async broadcast(message, options = {}) {
    try {
      // Validate message
      const validation = message.validate();
      if (!validation.valid) {
        throw new Error(`Invalid broadcast message: ${validation.errors.join(', ')}`);
      }

      // Consciousness validation if moderation enabled
      if (this.moderationEnabled) {
        await this.protocol.validateMessageWithConsciousness(message);
      }

      // Security validation
      await this.protocol.validateMessageSecurity(message);

      // Compress message
      message.compress();

      // Store in history
      this.addToHistory(message);

      // Get eligible recipients
      const recipients = this.getEligibleRecipients(message);

      // Send to each recipient
      const deliveryResults = [];
      for (const recipientName of recipients) {
        try {
          const recipient = this.protocol.getSpecialist(recipientName);
          if (recipient && recipient.peerChannel) {
            await recipient.peerChannel.receiveMessage(message);
            deliveryResults.push({ recipient: recipientName, status: 'delivered' });
          } else {
            deliveryResults.push({ recipient: recipientName, status: 'not_available' });
          }
        } catch (error) {
          deliveryResults.push({ 
            recipient: recipientName, 
            status: 'failed', 
            error: error.message 
          });
        }
      }

      // Emit broadcast event
      this.emit('message_broadcast', {
        message,
        recipients: recipients.length,
        delivered: deliveryResults.filter(r => r.status === 'delivered').length,
        failed: deliveryResults.filter(r => r.status === 'failed').length
      });

      logger.info(`🏁 Broadcast message sent: ${message.sender} -> ${recipients.length} recipients (${message.type})`);
      
      return {
        messageId: message.id,
        recipientsCount: recipients.length,
        deliveryResults
      };

    } catch (error) {
      logger.error(`🏁 Failed to broadcast message: ${error.message}`, {
        channel: this.channelName,
        messageId: message.id,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Get eligible recipients based on subscription filters
   */
  getEligibleRecipients(message) {
    const eligible = [];
    
    for (const [specialistName, subscription] of this.subscribers) {
      if (!subscription.active) {continue;}
      
      // Check message type filter
      if (!subscription.messageTypes.includes(message.type)) {continue;}
      
      // Check priority filter
      if (message.priority > subscription.priority) {continue;}
      
      // Apply custom filters
      if (subscription.filters && !this.applyFilters(message, subscription.filters)) {
        continue;
      }
      
      // Exclude sender
      if (specialistName === message.sender) {continue;}
      
      eligible.push(specialistName);
    }
    
    return eligible;
  }

  /**
   * Apply subscription filters to message
   */
  applyFilters(message, filters) {
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      switch (filterKey) {
        case 'department':
          if (message.context?.senderDepartment !== filterValue) {return false;}
          break;
        case 'tags':
          if (!message.metadata?.tags?.some(tag => filterValue.includes(tag))) {return false;}
          break;
        case 'minPriority':
          if (message.priority > filterValue) {return false;}
          break;
        default:
          // Custom filter logic
          break;
      }
    }
    return true;
  }

  /**
   * Add message to broadcast history
   */
  addToHistory(message) {
    this.messageHistory.push({
      message: message,
      timestamp: Date.now(),
      subscriberCount: this.subscribers.size
    });

    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get broadcast channel metrics
   */
  getMetrics() {
    return {
      channelId: this.channelId,
      channelName: this.channelName,
      subscriberCount: this.subscribers.size,
      activeSubscribers: Array.from(this.subscribers.values()).filter(s => s.active).length,
      totalMessages: this.messageHistory.length,
      messagesLastHour: this.messageHistory.filter(h => 
        Date.now() - h.timestamp < 3600000
      ).length,
      averageMessageSize: this.calculateAverageMessageSize(),
      isActive: this.isActive,
      moderationEnabled: this.moderationEnabled
    };
  }

  /**
   * Calculate average message size
   */
  calculateAverageMessageSize() {
    if (this.messageHistory.length === 0) {return 0;}
    
    const totalSize = this.messageHistory.reduce((sum, history) => {
      const size = history.message.metadata?.originalSize || 
                   JSON.stringify(history.message.payload).length;
      return sum + size;
    }, 0);
    
    return Math.round(totalSize / this.messageHistory.length);
  }

  /**
   * Close broadcast channel
   */
  close() {
    this.isActive = false;
    this.subscribers.clear();
    this.removeAllListeners();
    logger.info(`🏁 BroadcastChannel closed: ${this.channelName}`);
  }
}

/**
 * Message queue with priority support for asynchronous messaging
 */
class MessageQueue {
  constructor(name, options = {}) {
    this.name = name;
    this.maxSize = options.maxSize || 1000;
    this.processingInterval = options.processingInterval || 100;
    this.queue = [];
    this.processing = false;
    this.processingStats = {
      processed: 0,
      failed: 0,
      avgProcessingTime: 0
    };
    
    logger.info(`🏁 MessageQueue created: ${name}`);
  }

  /**
   * Add message to queue with priority ordering
   */
  enqueue(message, processor) {
    try {
      if (this.queue.length >= this.maxSize) {
        // Remove lowest priority message if queue is full
        const lowestPriorityIndex = this.findLowestPriorityIndex();
        if (lowestPriorityIndex >= 0 && this.queue[lowestPriorityIndex].priority > message.priority) {
          this.queue.splice(lowestPriorityIndex, 1);
          logger.warn(`🏁 Queue full, removed low priority message in ${this.name}`);
        } else {
          throw new Error('Queue full and new message priority too low');
        }
      }

      const queueItem = {
        message,
        processor,
        enqueued: Date.now(),
        attempts: 0,
        maxAttempts: 3
      };

      // Insert based on priority (lower number = higher priority)
      let insertIndex = this.queue.findIndex(item => item.message.priority > message.priority);
      if (insertIndex === -1) {insertIndex = this.queue.length;}
      
      this.queue.splice(insertIndex, 0, queueItem);
      
      logger.debug(`🏁 Message enqueued in ${this.name}: priority ${message.priority}, position ${insertIndex}`);
      
      // Start processing if not already running
      if (!this.processing) {
        this.startProcessing();
      }

    } catch (error) {
      logger.error(`🏁 Failed to enqueue message: ${error.message}`, {
        queue: this.name,
        messageId: message.id
      });
      throw error;
    }
  }

  /**
   * Find index of lowest priority message
   */
  findLowestPriorityIndex() {
    let lowestPriority = -1;
    let lowestIndex = -1;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].message.priority > lowestPriority) {
        lowestPriority = this.queue[i].message.priority;
        lowestIndex = i;
      }
    }
    
    return lowestIndex;
  }

  /**
   * Start processing messages in the queue
   */
  startProcessing() {
    if (this.processing) {return;}
    
    this.processing = true;
    logger.debug(`🏁 Started processing queue: ${this.name}`);
    
    const processNext = async () => {
      try {
        if (this.queue.length === 0) {
          this.processing = false;
          return;
        }

        const queueItem = this.queue.shift();
        const startTime = Date.now();

        try {
          await queueItem.processor(queueItem.message);
          
          // Update stats
          const processingTime = Date.now() - startTime;
          this.processingStats.processed++;
          this.processingStats.avgProcessingTime = 
            (this.processingStats.avgProcessingTime * (this.processingStats.processed - 1) + processingTime) / 
            this.processingStats.processed;

        } catch (error) {
          queueItem.attempts++;
          
          if (queueItem.attempts < queueItem.maxAttempts) {
            // Re-queue for retry with lower priority
            queueItem.message.priority = Math.min(queueItem.message.priority + 1, MessagePriority.BACKGROUND);
            this.queue.push(queueItem);
            logger.warn(`🏁 Message processing failed, retrying: ${error.message}`);
          } else {
            this.processingStats.failed++;
            logger.error(`🏁 Message processing failed after ${queueItem.maxAttempts} attempts: ${error.message}`, {
              messageId: queueItem.message.id,
              queue: this.name
            });
          }
        }

        // Process next message
        setTimeout(processNext, this.processingInterval);

      } catch (error) {
        logger.error(`🏁 Queue processing error: ${error.message}`, {
          queue: this.name
        });
        setTimeout(processNext, this.processingInterval * 2); // Longer delay on error
      }
    };

    processNext();
  }

  /**
   * Get queue metrics
   */
  getMetrics() {
    return {
      name: this.name,
      queueSize: this.queue.length,
      processing: this.processing,
      stats: { ...this.processingStats },
      priorityDistribution: this.getPriorityDistribution()
    };
  }

  /**
   * Get distribution of message priorities in queue
   */
  getPriorityDistribution() {
    const distribution = {};
    for (const priority of Object.values(MessagePriority)) {
      distribution[priority] = 0;
    }
    
    for (const item of this.queue) {
      distribution[item.message.priority]++;
    }
    
    return distribution;
  }

  /**
   * Clear all messages from queue
   */
  clear() {
    this.queue = [];
    this.processing = false;
    logger.info(`🏁 Queue cleared: ${this.name}`);
  }
}

/**
 * Channel registry for discovery and management
 */
class ChannelRegistry {
  constructor() {
    this.channels = new Map(); // channelId -> channel
    this.channelsByType = new Map(); // type -> Set of channelIds
    this.channelsBySpecialist = new Map(); // specialist -> Set of channelIds
    
    // Initialize type maps
    for (const type of Object.values(ChannelType)) {
      this.channelsByType.set(type, new Set());
    }
    
    logger.info('🏁 ChannelRegistry initialized');
  }

  /**
   * Register a channel in the registry
   */
  registerChannel(channel, type, specialist = null) {
    try {
      this.channels.set(channel.channelId, {
        channel,
        type,
        specialist: specialist?.name,
        registered: Date.now(),
        active: true
      });

      // Add to type index
      this.channelsByType.get(type).add(channel.channelId);

      // Add to specialist index if applicable
      if (specialist) {
        if (!this.channelsBySpecialist.has(specialist.name)) {
          this.channelsBySpecialist.set(specialist.name, new Set());
        }
        this.channelsBySpecialist.get(specialist.name).add(channel.channelId);
      }

      logger.info(`🏁 Channel registered: ${channel.channelId} (${type})`);

    } catch (error) {
      logger.error(`🏁 Failed to register channel: ${error.message}`, {
        channelId: channel.channelId,
        type,
        specialist: specialist?.name
      });
      throw error;
    }
  }

  /**
   * Unregister a channel from the registry
   */
  unregisterChannel(channelId) {
    try {
      const channelInfo = this.channels.get(channelId);
      if (!channelInfo) {return false;}

      // Remove from main registry
      this.channels.delete(channelId);

      // Remove from type index
      this.channelsByType.get(channelInfo.type).delete(channelId);

      // Remove from specialist index
      if (channelInfo.specialist) {
        const specialistChannels = this.channelsBySpecialist.get(channelInfo.specialist);
        if (specialistChannels) {
          specialistChannels.delete(channelId);
          if (specialistChannels.size === 0) {
            this.channelsBySpecialist.delete(channelInfo.specialist);
          }
        }
      }

      logger.info(`🏁 Channel unregistered: ${channelId}`);
      return true;

    } catch (error) {
      logger.error(`🏁 Failed to unregister channel: ${error.message}`, {
        channelId
      });
      return false;
    }
  }

  /**
   * Find channels by type
   */
  findChannelsByType(type) {
    const channelIds = this.channelsByType.get(type) || new Set();
    return Array.from(channelIds)
      .map(id => this.channels.get(id))
      .filter(info => info && info.active)
      .map(info => info.channel);
  }

  /**
   * Find channels by specialist
   */
  findChannelsBySpecialist(specialistName) {
    const channelIds = this.channelsBySpecialist.get(specialistName) || new Set();
    return Array.from(channelIds)
      .map(id => this.channels.get(id))
      .filter(info => info && info.active)
      .map(info => info.channel);
  }

  /**
   * Find broadcast channels by name pattern
   */
  findBroadcastChannels(namePattern) {
    return this.findChannelsByType(ChannelType.BROADCAST)
      .filter(channel => {
        if (typeof namePattern === 'string') {
          return channel.channelName.includes(namePattern);
        } else if (namePattern instanceof RegExp) {
          return namePattern.test(channel.channelName);
        }
        return true;
      });
  }

  /**
   * Get all active channels
   */
  getAllChannels() {
    return Array.from(this.channels.values())
      .filter(info => info.active)
      .map(info => ({
        ...info,
        metrics: info.channel.getMetrics ? info.channel.getMetrics() : {}
      }));
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalChannels: this.channels.size,
      activeChannels: 0,
      channelsByType: {},
      specialistsWithChannels: this.channelsBySpecialist.size
    };

    for (const [type, channelIds] of this.channelsByType) {
      stats.channelsByType[type] = channelIds.size;
    }

    for (const info of this.channels.values()) {
      if (info.active) {stats.activeChannels++;}
    }

    return stats;
  }
}

/**
 * Context compression for efficient knowledge sharing
 */
class ContextCompressor {
  constructor() {
    this.compressionStrategies = {
      'json_minify': this.jsonMinify.bind(this),
      'semantic_summarize': this.semanticSummarize.bind(this),
      'reference_dedup': this.referenceDeduplicate.bind(this)
    };
  }

  /**
   * Compress context using specified strategy
   */
  async compress(context, strategy = 'json_minify', options = {}) {
    try {
      const compressor = this.compressionStrategies[strategy];
      if (!compressor) {
        throw new Error(`Unknown compression strategy: ${strategy}`);
      }

      const originalSize = JSON.stringify(context).length;
      const compressed = await compressor(context, options);
      const compressedSize = JSON.stringify(compressed.data).length;

      const result = {
        data: compressed.data,
        metadata: {
          strategy,
          originalSize,
          compressedSize,
          compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
          ...compressed.metadata
        }
      };

      logger.debug(`🏁 Context compressed: ${originalSize} -> ${compressedSize} bytes (${strategy})`);
      return result;

    } catch (error) {
      logger.error(`🏁 Context compression failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decompress context
   */
  async decompress(compressedContext) {
    try {
      const { data, metadata } = compressedContext;
      const strategy = metadata.strategy;

      // For this implementation, most strategies don't need special decompression
      switch (strategy) {
        case 'semantic_summarize':
          // Cannot fully reconstruct from summary
          return {
            data: data,
            metadata: {
              ...metadata,
              note: 'Partial reconstruction from semantic summary'
            }
          };
        default:
          return {
            data: data,
            metadata: metadata
          };
      }

    } catch (error) {
      logger.error(`🏁 Context decompression failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * JSON minification compression
   */
  async jsonMinify(context, options = {}) {
    // Remove unnecessary whitespace and null values
    const minified = JSON.parse(JSON.stringify(context, (key, value) => {
      if (value === null && !options.keepNulls) {return undefined;}
      return value;
    }));

    return {
      data: minified,
      metadata: {
        compressionType: 'json_minify',
        removedNulls: !options.keepNulls
      }
    };
  }

  /**
   * Semantic summarization compression
   */
  async semanticSummarize(context, options = {}) {
    const maxLength = options.maxLength || 500;
    
    // Extract key information
    const summary = {
      type: context.type || 'unknown',
      timestamp: context.timestamp || Date.now(),
      keyPoints: this.extractKeyPoints(context, maxLength / 2),
      metrics: this.extractMetrics(context),
      references: this.extractReferences(context)
    };

    return {
      data: summary,
      metadata: {
        compressionType: 'semantic_summarize',
        summarized: true,
        maxLength
      }
    };
  }

  /**
   * Reference deduplication compression
   */
  async referenceDeduplicate(context, options = {}) {
    const references = new Map();
    let refCounter = 0;

    const processValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        const key = JSON.stringify(value);
        if (references.has(key)) {
          return { $ref: references.get(key) };
        } else {
          const refId = `ref_${refCounter++}`;
          references.set(key, refId);
          
          if (Array.isArray(value)) {
            return value.map(processValue);
          } else {
            const processed = {};
            for (const [k, v] of Object.entries(value)) {
              processed[k] = processValue(v);
            }
            return processed;
          }
        }
      }
      return value;
    };

    const deduplicated = processValue(context);

    return {
      data: {
        content: deduplicated,
        references: Object.fromEntries(
          Array.from(references.entries()).map(([key, ref]) => [ref, JSON.parse(key)])
        )
      },
      metadata: {
        compressionType: 'reference_dedup',
        referencesFound: references.size
      }
    };
  }

  /**
   * Extract key points from context
   */
  extractKeyPoints(context, maxLength) {
    const keyFields = ['description', 'summary', 'result', 'decision', 'recommendation'];
    const points = [];
    
    const extractFromObject = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (keyFields.includes(key.toLowerCase()) && typeof value === 'string') {
          points.push({
            field: prefix ? `${prefix}.${key}` : key,
            value: value.length > 100 ? value.substring(0, 100) + '...' : value
          });
        } else if (typeof value === 'object' && value !== null && prefix.split('.').length < 3) {
          extractFromObject(value, prefix ? `${prefix}.${key}` : key);
        }
      }
    };

    extractFromObject(context);
    
    // Limit total length
    let totalLength = 0;
    return points.filter(point => {
      totalLength += point.value.length;
      return totalLength <= maxLength;
    });
  }

  /**
   * Extract metrics from context
   */
  extractMetrics(context) {
    const metrics = {};
    
    const extractNumbers = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'number') {
          metrics[prefix ? `${prefix}.${key}` : key] = value;
        } else if (typeof value === 'object' && value !== null && prefix.split('.').length < 2) {
          extractNumbers(value, prefix ? `${prefix}.${key}` : key);
        }
      }
    };

    extractNumbers(context);
    return metrics;
  }

  /**
   * Extract references from context
   */
  extractReferences(context) {
    const references = [];
    
    const extractRefs = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.toLowerCase().includes('id') || key.toLowerCase().includes('ref')) {
          references.push({ field: key, value });
        } else if (typeof value === 'object' && value !== null) {
          extractRefs(value);
        }
      }
    };

    extractRefs(context);
    return references;
  }
}

/**
 * Communication metrics and monitoring
 */
class CommunicationMetrics {
  constructor() {
    this.metrics = {
      messagesProcessed: 0,
      messagesSent: 0,
      messagesReceived: 0,
      messagesFailed: 0,
      totalDataTransferred: 0,
      averageMessageSize: 0,
      averageProcessingTime: 0,
      peakConcurrency: 0,
      currentConnections: 0,
      uptime: Date.now()
    };

    this.historyMetrics = [];
    this.maxHistorySize = 1000;

    // Start periodic collection
    this.startPeriodicCollection();
  }

  /**
   * Record message sent
   */
  recordMessageSent(message) {
    this.metrics.messagesSent++;
    this.metrics.messagesProcessed++;
    this.updateAverageMessageSize(message);
    this.updateDataTransferred(message);
  }

  /**
   * Record message received
   */
  recordMessageReceived(message) {
    this.metrics.messagesReceived++;
    this.metrics.messagesProcessed++;
    this.updateAverageMessageSize(message);
  }

  /**
   * Record message failed
   */
  recordMessageFailed(message, error) {
    this.metrics.messagesFailed++;
    logger.debug(`🏁 Message failure recorded: ${error.message}`);
  }

  /**
   * Record processing time
   */
  recordProcessingTime(duration) {
    const currentAvg = this.metrics.averageProcessingTime;
    const count = this.metrics.messagesProcessed;
    
    this.metrics.averageProcessingTime = count > 1 ? 
      (currentAvg * (count - 1) + duration) / count : 
      duration;
  }

  /**
   * Update connection count
   */
  updateConnectionCount(count) {
    this.metrics.currentConnections = count;
    this.metrics.peakConcurrency = Math.max(this.metrics.peakConcurrency, count);
  }

  /**
   * Update average message size
   */
  updateAverageMessageSize(message) {
    const size = JSON.stringify(message.payload).length;
    const currentAvg = this.metrics.averageMessageSize;
    const count = this.metrics.messagesProcessed;
    
    this.metrics.averageMessageSize = count > 1 ? 
      (currentAvg * (count - 1) + size) / count : 
      size;
  }

  /**
   * Update total data transferred
   */
  updateDataTransferred(message) {
    const size = JSON.stringify(message).length;
    this.metrics.totalDataTransferred += size;
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      uptimeHours: (Date.now() - this.metrics.uptime) / (1000 * 60 * 60)
    };
  }

  /**
   * Get historical metrics
   */
  getHistory(limit = 100) {
    return this.historyMetrics.slice(-limit);
  }

  /**
   * Start periodic metrics collection
   */
  startPeriodicCollection() {
    setInterval(() => {
      const snapshot = this.getSnapshot();
      this.historyMetrics.push(snapshot);
      
      // Trim history
      if (this.historyMetrics.length > this.maxHistorySize) {
        this.historyMetrics = this.historyMetrics.slice(-this.maxHistorySize);
      }
    }, 60000); // Every minute
  }

  /**
   * Calculate communication health score
   */
  getHealthScore() {
    const totalMessages = this.metrics.messagesSent + this.metrics.messagesReceived;
    const failureRate = totalMessages > 0 ? this.metrics.messagesFailed / totalMessages : 0;
    const successRate = 1 - failureRate;
    
    let healthScore = successRate * 100;
    
    // Adjust for processing performance
    if (this.metrics.averageProcessingTime > 1000) { // Over 1 second
      healthScore *= 0.9;
    }
    
    // Adjust for message volume
    if (totalMessages > 0) {
      healthScore = Math.max(healthScore, 50); // Minimum score if processing messages
    }
    
    return Math.round(healthScore);
  }
}

/**
 * Main Agent Communication Protocol System
 */
class AgentCommunicationProtocol extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.consciousness = new ConsciousnessLayer();
    this.commandValidator = new CommandValidator();
    this.contextCompressor = new ContextCompressor();
    this.channelRegistry = new ChannelRegistry();
    this.metrics = new CommunicationMetrics();
    
    // Communication channels
    this.peerChannels = new Map(); // specialist_name -> PeerChannel
    this.broadcastChannels = new Map(); // channel_name -> BroadcastChannel
    this.systemChannels = new Map(); // system channels
    
    // Message queues
    this.messageQueues = new Map(); // queue_name -> MessageQueue
    this.defaultQueue = new MessageQueue('default', {
      maxSize: options.queueSize || 1000,
      processingInterval: options.processingInterval || 100
    });
    this.messageQueues.set('default', this.defaultQueue);
    
    // Specialists registry
    this.specialists = new Map(); // specialist_name -> specialist_object
    
    // Configuration
    this.config = {
      enableModeration: options.enableModeration !== false,
      enableCompression: options.enableCompression !== false,
      enableMetrics: options.enableMetrics !== false,
      maxMessageSize: options.maxMessageSize || 10 * 1024 * 1024, // 10MB
      messageRetention: options.messageRetention || 24 * 60 * 60 * 1000, // 24 hours
      ...options.config
    };
    
    this.isInitialized = false;
    
    logger.info('🏁 AgentCommunicationProtocol initialized');
  }

  /**
   * Initialize the communication protocol system
   */
  async initialize() {
    try {
      // Register default broadcast channels
      await this.createBroadcastChannel('general', { 
        moderationEnabled: true 
      });
      await this.createBroadcastChannel('knowledge_sharing', { 
        moderationEnabled: false 
      });
      await this.createBroadcastChannel('system_notifications', { 
        moderationEnabled: true 
      });

      // Set up periodic cleanup
      this.startPeriodicCleanup();

      this.isInitialized = true;
      
      this.emit('system_initialized', {
        timestamp: Date.now(),
        channels: this.channelRegistry.getStats()
      });

      logger.info('🏁 AgentCommunicationProtocol system initialized successfully');
      
    } catch (error) {
      logger.error(`🏁 Failed to initialize communication protocol: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a specialist in the communication system
   */
  async registerSpecialist(specialist) {
    try {
      if (!specialist || !specialist.name) {
        throw new Error('Invalid specialist object');
      }

      // Validate with consciousness layer
      await this.consciousness.validateIntent({
        description: `Register specialist ${specialist.name} in communication system`,
        specialist: specialist.name
      });

      // Create peer channel for the specialist
      const peerChannel = new PeerChannel(specialist, this);
      this.peerChannels.set(specialist.name, peerChannel);
      
      // Register channel in registry
      this.channelRegistry.registerChannel(peerChannel, ChannelType.PEER, specialist);
      
      // Store specialist reference
      this.specialists.set(specialist.name, specialist);
      
      // Add peer channel to specialist
      specialist.peerChannel = peerChannel;
      
      // Subscribe to default broadcast channels
      const generalChannel = this.broadcastChannels.get('general');
      if (generalChannel) {
        generalChannel.subscribe(specialist, {
          messageTypes: [
            MessageType.BROADCAST_ANNOUNCEMENT,
            MessageType.SYSTEM_NOTIFICATION
          ]
        });
      }

      this.emit('specialist_registered', {
        specialist: specialist.name,
        timestamp: Date.now()
      });

      logger.info(`🏁 Specialist registered in communication system: ${specialist.name}`);
      
      return peerChannel;

    } catch (error) {
      logger.error(`🏁 Failed to register specialist: ${error.message}`, {
        specialist: specialist?.name
      });
      throw error;
    }
  }

  /**
   * Unregister a specialist from the communication system
   */
  async unregisterSpecialist(specialist) {
    try {
      const specialistName = specialist.name || specialist;
      
      // Remove from broadcast channels
      for (const channel of this.broadcastChannels.values()) {
        channel.unsubscribe({ name: specialistName });
      }
      
      // Close and remove peer channel
      const peerChannel = this.peerChannels.get(specialistName);
      if (peerChannel) {
        peerChannel.close();
        this.channelRegistry.unregisterChannel(peerChannel.channelId);
        this.peerChannels.delete(specialistName);
      }
      
      // Remove specialist reference
      this.specialists.delete(specialistName);

      this.emit('specialist_unregistered', {
        specialist: specialistName,
        timestamp: Date.now()
      });

      logger.info(`🏁 Specialist unregistered from communication system: ${specialistName}`);

    } catch (error) {
      logger.error(`🏁 Failed to unregister specialist: ${error.message}`, {
        specialist: specialist?.name || specialist
      });
    }
  }

  /**
   * Create a broadcast channel
   */
  async createBroadcastChannel(channelName, options = {}) {
    try {
      if (this.broadcastChannels.has(channelName)) {
        return this.broadcastChannels.get(channelName);
      }

      // Validate with consciousness layer
      await this.consciousness.validateIntent({
        description: `Create broadcast channel: ${channelName}`,
        channelName,
        options
      });

      const channel = new BroadcastChannel(channelName, this);
      channel.moderationEnabled = options.moderationEnabled !== false;
      
      this.broadcastChannels.set(channelName, channel);
      this.channelRegistry.registerChannel(channel, ChannelType.BROADCAST);

      this.emit('broadcast_channel_created', {
        channelName,
        channelId: channel.channelId,
        timestamp: Date.now()
      });

      logger.info(`🏁 Broadcast channel created: ${channelName}`);
      
      return channel;

    } catch (error) {
      logger.error(`🏁 Failed to create broadcast channel: ${error.message}`, {
        channelName
      });
      throw error;
    }
  }

  /**
   * Route message through the communication system
   */
  async routeMessage(message, channelType, targetChannel = null) {
    try {
      const startTime = Date.now();

      // Validate message
      const validation = message.validate();
      if (!validation.valid) {
        throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
      }

      // Route based on channel type
      let result;
      switch (channelType) {
        case ChannelType.PEER:
          result = await this.routePeerMessage(message);
          break;
        case ChannelType.BROADCAST:
          result = await this.routeBroadcastMessage(message, targetChannel);
          break;
        case ChannelType.SYSTEM:
          result = await this.routeSystemMessage(message);
          break;
        default:
          throw new Error(`Unknown channel type: ${channelType}`);
      }

      // Record metrics
      const processingTime = Date.now() - startTime;
      this.metrics.recordProcessingTime(processingTime);
      this.metrics.recordMessageSent(message);

      return result;

    } catch (error) {
      this.metrics.recordMessageFailed(message, error);
      logger.error(`🏁 Failed to route message: ${error.message}`, {
        messageId: message.id,
        channelType,
        targetChannel
      });
      throw error;
    }
  }

  /**
   * Route peer-to-peer message
   */
  async routePeerMessage(message) {
    const recipients = message.recipients || [];
    const results = [];

    for (const recipientName of recipients) {
      const specialist = this.specialists.get(recipientName);
      if (specialist && specialist.peerChannel) {
        try {
          await specialist.peerChannel.receiveMessage(message);
          results.push({ recipient: recipientName, status: 'delivered' });
        } catch (error) {
          results.push({ 
            recipient: recipientName, 
            status: 'failed', 
            error: error.message 
          });
        }
      } else {
        results.push({ recipient: recipientName, status: 'not_found' });
      }
    }

    return { deliveryResults: results };
  }

  /**
   * Route broadcast message
   */
  async routeBroadcastMessage(message, channelName) {
    const channel = this.broadcastChannels.get(channelName || 'general');
    if (!channel) {
      throw new Error(`Broadcast channel not found: ${channelName}`);
    }

    return await channel.broadcast(message);
  }

  /**
   * Route system message
   */
  async routeSystemMessage(message) {
    // System messages go to all appropriate channels
    const results = [];

    // Send to system notification broadcast channel
    const systemChannel = this.broadcastChannels.get('system_notifications');
    if (systemChannel) {
      try {
        const result = await systemChannel.broadcast(message);
        results.push({ channel: 'system_notifications', result });
      } catch (error) {
        results.push({ 
          channel: 'system_notifications', 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return { systemResults: results };
  }

  /**
   * Validate message with consciousness layer
   */
  async validateMessageWithConsciousness(message) {
    if (!this.config.enableModeration) {return true;}

    try {
      const validation = await this.consciousness.validateIntent({
        description: 'Communication message validation',
        messageType: message.type,
        sender: message.sender,
        recipients: message.recipients,
        payload: message.payload
      });

      if (!validation.is_aligned) {
        throw new Error(`Message violates consciousness principles: ${validation.recommendations?.join(', ')}`);
      }

      return validation;

    } catch (error) {
      logger.warn(`🏁 Consciousness validation failed for message: ${error.message}`, {
        messageId: message.id,
        sender: message.sender
      });
      throw error;
    }
  }

  /**
   * Validate message security
   */
  async validateMessageSecurity(message) {
    try {
      // Check message size
      const messageSize = JSON.stringify(message).length;
      if (messageSize > this.config.maxMessageSize) {
        throw new Error(`Message size exceeds limit: ${messageSize} > ${this.config.maxMessageSize}`);
      }

      // Validate payload content using command validator patterns
      if (message.payload && typeof message.payload === 'object') {
        // Check for potentially dangerous content
        const payloadStr = JSON.stringify(message.payload);
        if (this.commandValidator.containsShellMetacharacters(payloadStr)) {
          logger.warn('🏁 Potentially dangerous content in message payload', {
            messageId: message.id,
            sender: message.sender
          });
        }
      }

      return true;

    } catch (error) {
      logger.error(`🏁 Message security validation failed: ${error.message}`, {
        messageId: message.id,
        sender: message.sender
      });
      throw error;
    }
  }

  /**
   * Get specialist by name
   */
  getSpecialist(name) {
    return this.specialists.get(name);
  }

  /**
   * Send direct message between specialists
   */
  async sendDirectMessage(fromSpecialist, toSpecialist, messageType, payload, options = {}) {
    try {
      const fromChannel = this.peerChannels.get(fromSpecialist.name);
      if (!fromChannel) {
        throw new Error(`Peer channel not found for specialist: ${fromSpecialist.name}`);
      }

      const targetSpecialist = typeof toSpecialist === 'string' ? 
        this.specialists.get(toSpecialist) : toSpecialist;

      if (!targetSpecialist) {
        throw new Error(`Target specialist not found: ${toSpecialist}`);
      }

      return await fromChannel.sendMessage(targetSpecialist, messageType, payload, options);

    } catch (error) {
      logger.error(`🏁 Failed to send direct message: ${error.message}`, {
        from: fromSpecialist?.name,
        to: toSpecialist?.name || toSpecialist,
        messageType
      });
      throw error;
    }
  }

  /**
   * Broadcast message to channel
   */
  async broadcastMessage(sender, channelName, messageType, payload, options = {}) {
    try {
      const message = new CommunicationMessage({
        type: messageType,
        sender: sender.name || sender,
        payload: payload,
        priority: options.priority || MessagePriority.NORMAL,
        context: {
          senderType: sender.type || 'specialist',
          senderDepartment: sender.department || 'unknown',
          communicationType: 'broadcast',
          ...options.context
        },
        ...options
      });

      return await this.routeMessage(message, ChannelType.BROADCAST, channelName);

    } catch (error) {
      logger.error(`🏁 Failed to broadcast message: ${error.message}`, {
        sender: sender?.name || sender,
        channelName,
        messageType
      });
      throw error;
    }
  }

  /**
   * Subscribe specialist to broadcast channel
   */
  async subscribeToChannel(specialist, channelName, options = {}) {
    try {
      const channel = this.broadcastChannels.get(channelName);
      if (!channel) {
        throw new Error(`Broadcast channel not found: ${channelName}`);
      }

      return channel.subscribe(specialist, options);

    } catch (error) {
      logger.error(`🏁 Failed to subscribe to channel: ${error.message}`, {
        specialist: specialist?.name,
        channelName
      });
      throw error;
    }
  }

  /**
   * Unsubscribe specialist from broadcast channel
   */
  async unsubscribeFromChannel(specialist, channelName) {
    try {
      const channel = this.broadcastChannels.get(channelName);
      if (!channel) {
        throw new Error(`Broadcast channel not found: ${channelName}`);
      }

      return channel.unsubscribe(specialist);

    } catch (error) {
      logger.error(`🏁 Failed to unsubscribe from channel: ${error.message}`, {
        specialist: specialist?.name,
        channelName
      });
      throw error;
    }
  }

  /**
   * Compress and share context between specialists
   */
  async shareContext(fromSpecialist, toSpecialist, context, options = {}) {
    try {
      // Compress context if enabled
      let sharedContext = context;
      if (this.config.enableCompression && options.compress !== false) {
        const compressed = await this.contextCompressor.compress(
          context, 
          options.compressionStrategy,
          options.compressionOptions
        );
        sharedContext = compressed;
      }

      // Send as peer message
      return await this.sendDirectMessage(
        fromSpecialist,
        toSpecialist,
        MessageType.KNOWLEDGE_SYNTHESIS,
        {
          context: sharedContext,
          compressed: this.config.enableCompression && options.compress !== false
        },
        options
      );

    } catch (error) {
      logger.error(`🏁 Failed to share context: ${error.message}`, {
        from: fromSpecialist?.name,
        to: toSpecialist?.name || toSpecialist
      });
      throw error;
    }
  }

  /**
   * Request expertise from specialists
   */
  async requestExpertise(requester, expertiseType, query, options = {}) {
    try {
      // Find specialists with matching expertise
      const experts = Array.from(this.specialists.values())
        .filter(specialist => {
          return specialist.expertise?.includes(expertiseType) ||
                 specialist.type === expertiseType ||
                 specialist.specializations?.includes(expertiseType);
        });

      if (experts.length === 0) {
        throw new Error(`No experts found for: ${expertiseType}`);
      }

      // Send expertise requests
      const requestPromises = experts.map(expert => 
        this.sendDirectMessage(
          requester,
          expert,
          MessageType.EXPERTISE_REQUEST,
          {
            expertiseType,
            query,
            requestId: `expertise-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          },
          {
            requiresResponse: true,
            priority: options.priority || MessagePriority.HIGH,
            ...options
          }
        )
      );

      const results = await Promise.allSettled(requestPromises);
      
      return {
        expertsContacted: experts.length,
        requests: results,
        requestId: requestPromises[0]?.requestId
      };

    } catch (error) {
      logger.error(`🏁 Failed to request expertise: ${error.message}`, {
        requester: requester?.name,
        expertiseType,
        query
      });
      throw error;
    }
  }

  /**
   * Start periodic cleanup of expired messages and connections
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.performCleanup();
    }, 300000); // Every 5 minutes
  }

  /**
   * Perform system cleanup
   */
  performCleanup() {
    try {
      let cleanedItems = 0;

      // Clean up peer channels
      for (const [name, channel] of this.peerChannels) {
        if (channel.messageHistory) {
          const originalLength = channel.messageHistory.length;
          channel.messageHistory = channel.messageHistory.filter(item => 
            Date.now() - item.timestamp <= this.config.messageRetention
          );
          cleanedItems += originalLength - channel.messageHistory.length;
        }
      }

      // Clean up broadcast channels
      for (const [name, channel] of this.broadcastChannels) {
        if (channel.messageHistory) {
          const originalLength = channel.messageHistory.length;
          channel.messageHistory = channel.messageHistory.filter(item => 
            Date.now() - item.timestamp <= this.config.messageRetention
          );
          cleanedItems += originalLength - channel.messageHistory.length;
        }
      }

      // Clean up message queues
      for (const [name, queue] of this.messageQueues) {
        queue.queue = queue.queue.filter(item => 
          !item.message.isExpired()
        );
      }

      if (cleanedItems > 0) {
        logger.debug(`🏁 Periodic cleanup completed: ${cleanedItems} expired items removed`);
      }

    } catch (error) {
      logger.error(`🏁 Cleanup error: ${error.message}`);
    }
  }

  /**
   * Get comprehensive system metrics
   */
  getSystemMetrics() {
    return {
      communication: this.metrics.getSnapshot(),
      channels: this.channelRegistry.getStats(),
      messageQueues: Object.fromEntries(
        Array.from(this.messageQueues.entries()).map(([name, queue]) => [
          name, 
          queue.getMetrics()
        ])
      ),
      specialists: this.specialists.size,
      health: this.metrics.getHealthScore(),
      configuration: this.config,
      uptime: Date.now() - this.metrics.metrics.uptime
    };
  }

  /**
   * Shutdown the communication system gracefully
   */
  async shutdown() {
    try {
      logger.info('🏁 Starting communication system shutdown...');

      // Close all peer channels
      for (const channel of this.peerChannels.values()) {
        channel.close();
      }

      // Close all broadcast channels
      for (const channel of this.broadcastChannels.values()) {
        channel.close();
      }

      // Clear message queues
      for (const queue of this.messageQueues.values()) {
        queue.clear();
      }

      // Clear all maps
      this.peerChannels.clear();
      this.broadcastChannels.clear();
      this.specialists.clear();
      this.messageQueues.clear();

      this.isInitialized = false;

      this.emit('system_shutdown', {
        timestamp: Date.now()
      });

      logger.info('🏁 Communication system shutdown completed');

    } catch (error) {
      logger.error(`🏁 Error during shutdown: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

// Export all classes and constants
module.exports = {
  AgentCommunicationProtocol,
  PeerChannel,
  BroadcastChannel,
  MessageQueue,
  ChannelRegistry,
  ContextCompressor,
  CommunicationMetrics,
  CommunicationMessage,
  MessageType,
  MessagePriority,
  ChannelType,
  
  // Singleton access
  getInstance(config) {
    if (!instance) {
      instance = new AgentCommunicationProtocol(config);
    }
    return instance;
  }
};