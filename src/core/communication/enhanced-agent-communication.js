/**
 * BUMBA Enhanced Agent Communication System
 * Implements message ordering, priority channels, and retry logic
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class EnhancedAgentCommunication extends EventEmitter {
  constructor() {
    super();
    
    // Message queue with ordering
    this.messageQueue = new Map(); // agentId -> messages[]
    this.sequenceNumbers = new Map(); // agentId -> lastSeq
    
    // Priority channels
    this.channels = {
      emergency: [],
      high: [],
      normal: [],
      low: []
    };
    
    // Retry configuration
    this.retryConfig = {
      maxAttempts: 3,
      backoffBase: 1000,
      backoffMultiplier: 2,
      timeout: 30000
    };
    
    // Communication statistics
    this.stats = {
      sent: 0,
      received: 0,
      failed: 0,
      retried: 0,
      outOfOrder: 0
    };
    
    // Active conversations
    this.conversations = new Map();
    
    // Start message processor
    this.startProcessor();
  }
  
  /**
   * Send message with ordering and retry
   */
  async sendMessage(from, to, message, options = {}) {
    const priority = options.priority || 'normal';
    const conversationId = options.conversationId || this.generateConversationId();
    
    // Generate sequence number
    const fromSeq = (this.sequenceNumbers.get(from) || 0) + 1;
    this.sequenceNumbers.set(from, fromSeq);
    
    const envelope = {
      id: this.generateMessageId(),
      from: from,
      to: to,
      message: message,
      priority: priority,
      sequence: fromSeq,
      conversationId: conversationId,
      timestamp: Date.now(),
      attempts: 0,
      status: 'pending'
    };
    
    // Add to appropriate channel
    this.channels[priority].push(envelope);
    
    // Emit for immediate processing if emergency
    if (priority === 'emergency') {
      this.emit('emergency:message', envelope);
    }
    
    // Attempt delivery with retry
    return await this.deliverWithRetry(envelope);
  }
  
  /**
   * Deliver message with retry logic
   */
  async deliverWithRetry(envelope) {
    const maxAttempts = this.retryConfig.maxAttempts;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        envelope.attempts = attempt;
        
        // Simulate delivery (would be actual agent communication)
        const delivered = await this.attemptDelivery(envelope);
        
        if (delivered) {
          envelope.status = 'delivered';
          this.stats.sent++;
          
          // Store for ordering verification
          this.storeMessage(envelope);
          
          return {
            success: true,
            messageId: envelope.id,
            attempts: attempt
          };
        }
        
      } catch (error) {
        logger.warn(`Delivery attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = this.retryConfig.backoffBase * 
                       Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
          
          await this.delay(delay);
          this.stats.retried++;
        } else {
          // Max attempts reached
          envelope.status = 'failed';
          this.stats.failed++;
          
          // Add to dead letter queue
          this.handleFailedMessage(envelope);
          
          return {
            success: false,
            messageId: envelope.id,
            error: 'Max delivery attempts reached'
          };
        }
      }
    }
  }
  
  /**
   * Attempt message delivery
   */
  async attemptDelivery(envelope) {
    // Check if recipient is available
    const recipientAvailable = await this.checkRecipientAvailability(envelope.to);
    
    if (!recipientAvailable) {
      throw new Error(`Recipient ${envelope.to} not available`);
    }
    
    // Queue message for recipient
    if (!this.messageQueue.has(envelope.to)) {
      this.messageQueue.set(envelope.to, []);
    }
    
    const queue = this.messageQueue.get(envelope.to);
    queue.push(envelope);
    
    // Sort by sequence number for ordering
    queue.sort((a, b) => a.sequence - b.sequence);
    
    // Emit for recipient processing
    this.emit(`message:${envelope.to}`, envelope);
    
    return true;
  }
  
  /**
   * Receive and process message with ordering
   */
  async receiveMessage(agentId) {
    const queue = this.messageQueue.get(agentId) || [];
    
    if (queue.length === 0) {
      return null;
    }
    
    // Get next message in sequence
    const message = queue.shift();
    
    // Check sequence ordering
    const lastSeq = this.getLastProcessedSequence(agentId, message.from);
    
    if (message.sequence !== lastSeq + 1) {
      // Out of order message
      this.stats.outOfOrder++;
      
      logger.warn(`Out of order message: expected ${lastSeq + 1}, got ${message.sequence}`);
      
      // Re-queue for later processing
      queue.unshift(message);
      queue.sort((a, b) => a.sequence - b.sequence);
      
      // Wait for missing messages
      return await this.waitForSequence(agentId, message.from, lastSeq + 1);
    }
    
    // Update last processed sequence
    this.setLastProcessedSequence(agentId, message.from, message.sequence);
    
    this.stats.received++;
    
    return message;
  }
  
  /**
   * Broadcast to multiple agents
   */
  async broadcast(from, message, options = {}) {
    const recipients = options.recipients || this.getAllAgents();
    const priority = options.priority || 'normal';
    
    const results = await Promise.allSettled(
      recipients.map(to => this.sendMessage(from, to, message, { priority }))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
    
    return {
      sent: successful.length,
      failed: failed.length,
      recipients: recipients.length,
      results: results
    };
  }
  
  /**
   * Create conversation channel
   */
  createConversation(participants, options = {}) {
    const conversationId = this.generateConversationId();
    
    const conversation = {
      id: conversationId,
      participants: participants,
      created: Date.now(),
      messages: [],
      priority: options.priority || 'normal',
      topic: options.topic || 'general'
    };
    
    this.conversations.set(conversationId, conversation);
    
    // Notify participants
    participants.forEach(agent => {
      this.emit(`conversation:created:${agent}`, conversation);
    });
    
    return conversationId;
  }
  
  /**
   * Send message in conversation
   */
  async sendConversationMessage(conversationId, from, message) {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    // Send to all participants except sender
    const recipients = conversation.participants.filter(p => p !== from);
    
    const results = await Promise.allSettled(
      recipients.map(to => 
        this.sendMessage(from, to, message, {
          conversationId: conversationId,
          priority: conversation.priority
        })
      )
    );
    
    // Store in conversation history
    conversation.messages.push({
      from: from,
      message: message,
      timestamp: Date.now()
    });
    
    return results;
  }
  
  /**
   * Priority message processor
   */
  startProcessor() {
    setInterval(() => {
      this.processPriorityQueues();
    }, 100); // Process every 100ms
  }
  
  processPriorityQueues() {
    // Process in priority order
    const priorities = ['emergency', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.channels[priority];
      
      while (queue.length > 0) {
        const message = queue.shift();
        
        if (message.status === 'pending') {
          // Process message asynchronously
          this.deliverWithRetry(message).catch(error => {
            logger.error('Message processing failed:', error);
          });
        }
        
        // Break after processing one emergency message to check for new emergencies
        if (priority === 'emergency') {
          break;
        }
      }
    }
  }
  
  // === Utility Methods ===
  
  checkRecipientAvailability(agentId) {
    // Would check actual agent status
    return Promise.resolve(true);
  }
  
  getAllAgents() {
    // Would return all registered agents
    return Array.from(this.messageQueue.keys());
  }
  
  storeMessage(envelope) {
    // Store for history and ordering
    if (!this.messageHistory) {
      this.messageHistory = [];
    }
    this.messageHistory.push(envelope);
  }
  
  getLastProcessedSequence(agentId, fromAgent) {
    const key = `${agentId}:${fromAgent}`;
    return this.lastProcessed?.get(key) || 0;
  }
  
  setLastProcessedSequence(agentId, fromAgent, sequence) {
    if (!this.lastProcessed) {
      this.lastProcessed = new Map();
    }
    const key = `${agentId}:${fromAgent}`;
    this.lastProcessed.set(key, sequence);
  }
  
  async waitForSequence(agentId, fromAgent, expectedSeq) {
    // Wait for missing message with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for sequence ${expectedSeq}`));
      }, this.retryConfig.timeout);
      
      const checkInterval = setInterval(() => {
        const queue = this.messageQueue.get(agentId) || [];
        const found = queue.find(m => m.from === fromAgent && m.sequence === expectedSeq);
        
        if (found) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(found);
        }
      }, 100);
    });
  }
  
  handleFailedMessage(envelope) {
    // Add to dead letter queue
    if (!this.deadLetterQueue) {
      this.deadLetterQueue = [];
    }
    this.deadLetterQueue.push(envelope);
    
    // Emit failure event
    this.emit('message:failed', envelope);
  }
  
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateConversationId() {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get communication statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      queueSizes: {
        emergency: this.channels.emergency.length,
        high: this.channels.high.length,
        normal: this.channels.normal.length,
        low: this.channels.low.length
      },
      conversations: this.conversations.size,
      deadLetterQueue: this.deadLetterQueue?.length || 0
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  EnhancedAgentCommunication,
  getInstance: () => {
    if (!instance) {
      instance = new EnhancedAgentCommunication();
    }
    return instance;
  }
};