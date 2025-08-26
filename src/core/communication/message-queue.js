/**
 * Advanced Message Queue System
 * Provides reliable, scalable message queuing with priority handling and persistence
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Priority levels for message queuing
 */
const MessagePriority = {
  CRITICAL: 1,
  HIGH: 2, 
  NORMAL: 3,
  LOW: 4,
  BACKGROUND: 5
};

/**
 * Message states for tracking lifecycle
 */
const MessageState = {
  QUEUED: 'queued',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  DEAD: 'dead'
};

/**
 * Core Message Queue implementation with advanced features
 */
class MessageQueue extends EventEmitter {
  constructor(name, config = {}) {
    super();
    this.setMaxListeners(1000); // Support high concurrency
    
    this.name = name;
    this.config = {
      maxSize: config.maxSize || 10000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enablePersistence: config.enablePersistence || false,
      batchSize: config.batchSize || 100,
      processingTimeout: config.processingTimeout || 30000,
      deadLetterQueueEnabled: config.deadLetterQueueEnabled || true,
      ...config
    };
    
    // Queue storage with priority handling
    this.queues = new Map([
      [MessagePriority.CRITICAL, []],
      [MessagePriority.HIGH, []],
      [MessagePriority.NORMAL, []],
      [MessagePriority.LOW, []],
      [MessagePriority.BACKGROUND, []]
    ]);
    
    // Message tracking
    this.messages = new Map(); // messageId -> message details
    this.processingMessages = new Map(); // messageId -> processing info
    this.deadLetterQueue = [];
    
    // Queue statistics
    this.stats = {
      totalEnqueued: 0,
      totalDequeued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      currentSize: 0,
      averageProcessingTime: 0,
      throughputPerSecond: 0,
      lastThroughputCalculation: Date.now()
    };
    
    // Performance monitoring
    this.performanceWindow = [];
    this.isProcessing = false;
    this.processingInterval = null;
    
    // Initialize persistence if enabled
    if (this.config.enablePersistence) {
      this.persistenceManager = new QueuePersistenceManager(this.name);
    }
    
    this.startPerformanceMonitoring();
    
    logger.info(`📬 Message queue '${this.name}' initialized`, {
      maxSize: this.config.maxSize,
      enablePersistence: this.config.enablePersistence
    });
  }

  /**
   * Enqueue a message with priority and metadata
   */
  async enqueue(payload, options = {}) {
    const message = {
      id: this.generateMessageId(),
      payload,
      priority: options.priority || MessagePriority.NORMAL,
      timestamp: Date.now(),
      retryCount: 0,
      state: MessageState.QUEUED,
      metadata: {
        source: options.source || 'unknown',
        correlationId: options.correlationId,
        expiresAt: options.ttl ? Date.now() + options.ttl : null,
        tags: options.tags || [],
        ...options.metadata
      },
      attempts: []
    };

    // Check queue capacity
    if (this.getTotalSize() >= this.config.maxSize) {
      const error = new Error(`Queue '${this.name}' is at capacity (${this.config.maxSize})`);
      this.emit('queue:full', { queue: this.name, message });
      throw error;
    }

    // Check message expiration
    if (message.metadata.expiresAt && Date.now() > message.metadata.expiresAt) {
      logger.warn(`🗑️ Message expired before enqueuing: ${message.id}`);
      return null;
    }

    // Add to appropriate priority queue
    const priorityQueue = this.queues.get(message.priority);
    if (!priorityQueue) {
      throw new Error(`Invalid priority: ${message.priority}`);
    }

    priorityQueue.push(message);
    this.messages.set(message.id, message);
    
    // Update statistics
    this.stats.totalEnqueued++;
    this.stats.currentSize++;
    
    // Persist if enabled
    if (this.config.enablePersistence) {
      await this.persistMessage(message);
    }
    
    // Emit events
    this.emit('message:enqueued', { message, queueSize: this.getTotalSize() });
    this.emit('queue:updated', this.getQueueStats());
    
    logger.debug(`📥 Message enqueued: ${message.id} (priority: ${message.priority})`);
    
    return message.id;
  }

  /**
   * Dequeue next highest priority message
   */
  async dequeue() {
    // Check each priority level in order
    for (const [priority, queue] of this.queues.entries()) {
      if (queue.length > 0) {
        const message = queue.shift();
        
        // Check if message has expired
        if (message.metadata.expiresAt && Date.now() > message.metadata.expiresAt) {
          logger.debug(`🗑️ Skipping expired message: ${message.id}`);
          this.messages.delete(message.id);
          this.stats.currentSize--;
          continue; // Try next message
        }
        
        // Update message state
        message.state = MessageState.PROCESSING;
        message.processingStarted = Date.now();
        
        // Track processing
        this.processingMessages.set(message.id, {
          startTime: Date.now(),
          timeout: setTimeout(() => {
            this.handleProcessingTimeout(message.id);
          }, this.config.processingTimeout)
        });
        
        // Update statistics
        this.stats.totalDequeued++;
        this.stats.currentSize--;
        
        // Emit event
        this.emit('message:dequeued', { message, remainingSize: this.getTotalSize() });
        
        logger.debug(`📤 Message dequeued: ${message.id} (priority: ${message.priority})`);
        
        return message;
      }
    }
    
    return null; // No messages available
  }

  /**
   * Peek at next message without removing it
   */
  peek() {
    for (const [priority, queue] of this.queues.entries()) {
      if (queue.length > 0) {
        return { ...queue[0] }; // Return copy
      }
    }
    return null;
  }

  /**
   * Mark message as successfully processed
   */
  async ackMessage(messageId, result = null) {
    const message = this.messages.get(messageId);
    const processing = this.processingMessages.get(messageId);
    
    if (!message || !processing) {
      logger.warn(`🟠️ Cannot ack unknown message: ${messageId}`);
      return false;
    }
    
    // Clear processing timeout
    clearTimeout(processing.timeout);
    this.processingMessages.delete(messageId);
    
    // Update message
    message.state = MessageState.COMPLETED;
    message.completedAt = Date.now();
    message.processingTime = Date.now() - message.processingStarted;
    message.result = result;
    
    // Update statistics
    this.stats.totalProcessed++;
    this.updateAverageProcessingTime(message.processingTime);
    this.recordPerformanceMetric(message.processingTime);
    
    // Remove from persistence if enabled
    if (this.config.enablePersistence) {
      await this.removePersistedMessage(messageId);
    }
    
    // Clean up
    this.messages.delete(messageId);
    
    // Emit events
    this.emit('message:completed', { messageId, processingTime: message.processingTime, result });
    this.emit('queue:updated', this.getQueueStats());
    
    logger.debug(`🏁 Message acknowledged: ${messageId} (${message.processingTime}ms)`);
    
    return true;
  }

  /**
   * Mark message as failed and handle retry logic
   */
  async nackMessage(messageId, error, shouldRetry = true) {
    const message = this.messages.get(messageId);
    const processing = this.processingMessages.get(messageId);
    
    if (!message || !processing) {
      logger.warn(`🟠️ Cannot nack unknown message: ${messageId}`);
      return false;
    }
    
    // Clear processing timeout
    clearTimeout(processing.timeout);
    this.processingMessages.delete(messageId);
    
    // Record attempt
    message.attempts.push({
      startTime: message.processingStarted,
      endTime: Date.now(),
      error: error.message,
      duration: Date.now() - message.processingStarted
    });
    
    message.retryCount++;
    message.lastError = error.message;
    
    // Determine if we should retry
    const canRetry = shouldRetry && message.retryCount < this.config.maxRetries;
    
    if (canRetry) {
      // Retry: re-queue with delay
      message.state = MessageState.QUEUED;
      
      setTimeout(async () => {
        try {
          await this.requeueMessage(message);
          logger.debug(`🔄 Message requeued for retry: ${messageId} (attempt ${message.retryCount})`);
        } catch (requeueError) {
          logger.error(`Failed to requeue message ${messageId}:`, requeueError);
          await this.moveToDeadLetterQueue(message, requeueError);
        }
      }, this.calculateRetryDelay(message.retryCount));
      
    } else {
      // Move to dead letter queue
      await this.moveToDeadLetterQueue(message, error);
    }
    
    // Update statistics
    this.stats.totalFailed++;
    
    // Emit events
    this.emit('message:failed', { 
      messageId, 
      error: error.message, 
      retryCount: message.retryCount,
      willRetry: canRetry
    });
    
    logger.warn(`🔴 Message failed: ${messageId} (retry ${message.retryCount}/${this.config.maxRetries})`);
    
    return true;
  }

  /**
   * Get dead letter queue messages with filtering options
   */
  getDeadLetterMessages(options = {}) {
    const { limit = 100, offset = 0, errorType = null, since = null } = options;
    
    let filtered = [...this.deadLetterQueue];
    
    // Filter by error type
    if (errorType) {
      filtered = filtered.filter(msg => 
        msg.deadLetterReason && msg.deadLetterReason.includes(errorType)
      );
    }
    
    // Filter by time
    if (since) {
      filtered = filtered.filter(msg => msg.deadLetterAt >= since);
    }
    
    // Sort by most recent
    filtered.sort((a, b) => b.deadLetterAt - a.deadLetterAt);
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    
    return {
      messages: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    };
  }

  /**
   * Reprocess dead letter queue message
   */
  async reprocessDeadLetter(messageId, options = {}) {
    const deadLetterIndex = this.deadLetterQueue.findIndex(msg => msg.id === messageId);
    
    if (deadLetterIndex === -1) {
      throw new Error(`Dead letter message not found: ${messageId}`);
    }
    
    const message = this.deadLetterQueue[deadLetterIndex];
    
    // Reset message for reprocessing
    message.state = MessageState.QUEUED;
    message.retryCount = options.resetRetryCount ? 0 : message.retryCount;
    message.deadLetterReason = null;
    message.deadLetterAt = null;
    
    // Remove from dead letter queue
    this.deadLetterQueue.splice(deadLetterIndex, 1);
    
    // Re-enqueue
    await this.requeueMessage(message);
    
    this.emit('message:reprocessed', { messageId, fromDeadLetter: true });
    logger.info(`🟢️ Dead letter message reprocessed: ${messageId}`);
    
    return true;
  }

  /**
   * Bulk reprocess dead letter messages by criteria
   */
  async bulkReprocessDeadLetters(criteria = {}) {
    const { errorType = null, olderThan = null, limit = 10 } = criteria;
    
    let toReprocess = this.deadLetterQueue.filter(msg => {
      if (errorType && !msg.deadLetterReason.includes(errorType)) return false;
      if (olderThan && msg.deadLetterAt > olderThan) return false;
      return true;
    });
    
    // Limit the number to reprocess
    toReprocess = toReprocess.slice(0, limit);
    
    const results = {
      total: toReprocess.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const message of toReprocess) {
      try {
        await this.reprocessDeadLetter(message.id);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ messageId: message.id, error: error.message });
      }
    }
    
    this.emit('dead_letter:bulk_reprocessed', results);
    logger.info(`🟢️ Bulk reprocessed ${results.successful}/${results.total} dead letter messages`);
    
    return results;
  }

  /**
   * Clean up old dead letter messages
   */
  async cleanupDeadLetterQueue(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const cutoffTime = Date.now() - maxAge;
    const initialCount = this.deadLetterQueue.length;
    
    this.deadLetterQueue = this.deadLetterQueue.filter(msg => 
      msg.deadLetterAt > cutoffTime
    );
    
    const removedCount = initialCount - this.deadLetterQueue.length;
    
    if (removedCount > 0) {
      this.emit('dead_letter:cleaned', { removedCount, remaining: this.deadLetterQueue.length });
      logger.info(`🧹 Cleaned up ${removedCount} old dead letter messages`);
    }
    
    return removedCount;
  }

  /**
   * Process messages in batches
   */
  async dequeueBatch(batchSize = null) {
    const size = batchSize || this.config.batchSize;
    const batch = [];
    
    for (let i = 0; i < size; i++) {
      const message = await this.dequeue();
      if (!message) break;
      batch.push(message);
    }
    
    if (batch.length > 0) {
      this.emit('batch:dequeued', { batch, size: batch.length });
      logger.debug(`📦 Batch dequeued: ${batch.length} messages`);
    }
    
    return batch;
  }

  /**
   * Enqueue multiple messages as a batch with transaction support
   */
  async enqueueBatch(messages, options = {}) {
    const { transactional = true, priority = MessagePriority.NORMAL } = options;
    const results = [];
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Validate batch size
    const maxBatchSize = this.config.maxBatchSize || 1000;
    if (messages.length > maxBatchSize) {
      throw new Error(`Batch size ${messages.length} exceeds maximum ${maxBatchSize}`);
    }
    
    // Check capacity for entire batch
    if (this.getTotalSize() + messages.length > this.config.maxSize) {
      throw new Error(`Batch would exceed queue capacity (${this.getTotalSize() + messages.length}/${this.config.maxSize})`);
    }
    
    try {
      for (let i = 0; i < messages.length; i++) {
        const messageData = messages[i];
        const messageOptions = {
          priority: messageData.priority || priority,
          source: `batch:${batchId}`,
          batchId,
          batchIndex: i,
          ...messageData.options
        };
        
        const messageId = await this.enqueue(messageData.payload, messageOptions);
        results.push({ index: i, messageId, success: true });
      }
      
      this.emit('batch:enqueued', { 
        batchId, 
        size: messages.length, 
        successful: results.length 
      });
      
      logger.info(`📦 Batch enqueued: ${batchId} (${results.length} messages)`);
      
      return {
        batchId,
        total: messages.length,
        successful: results.length,
        failed: 0,
        results
      };
      
    } catch (error) {
      if (transactional) {
        // Rollback: remove any messages that were successfully enqueued
        for (const result of results) {
          if (result.success && result.messageId) {
            await this.removeMessage(result.messageId);
          }
        }
        
        logger.error(`📦 Batch rollback: ${batchId} - ${error.message}`);
        throw new Error(`Batch enqueue failed and rolled back: ${error.message}`);
      }
      
      logger.error(`📦 Partial batch failure: ${batchId} - ${error.message}`);
      return {
        batchId,
        total: messages.length,
        successful: results.length,
        failed: messages.length - results.length,
        results,
        error: error.message
      };
    }
  }

  /**
   * Acknowledge multiple messages as a batch
   */
  async ackBatch(messageIds, results = null) {
    const batchResults = {
      total: messageIds.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < messageIds.length; i++) {
      const messageId = messageIds[i];
      const result = results ? results[i] : null;
      
      try {
        await this.ackMessage(messageId, result);
        batchResults.successful++;
      } catch (error) {
        batchResults.failed++;
        batchResults.errors.push({ messageId, error: error.message });
      }
    }
    
    this.emit('batch:acknowledged', batchResults);
    logger.debug(`📦 Batch acknowledged: ${batchResults.successful}/${batchResults.total} messages`);
    
    return batchResults;
  }

  /**
   * Reject multiple messages as a batch
   */
  async nackBatch(messageIds, errors = null, shouldRetry = true) {
    const batchResults = {
      total: messageIds.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < messageIds.length; i++) {
      const messageId = messageIds[i];
      const error = errors ? errors[i] : new Error('Batch processing failed');
      
      try {
        await this.nackMessage(messageId, error, shouldRetry);
        batchResults.successful++;
      } catch (nackError) {
        batchResults.failed++;
        batchResults.errors.push({ messageId, error: nackError.message });
      }
    }
    
    this.emit('batch:rejected', batchResults);
    logger.debug(`📦 Batch rejected: ${batchResults.successful}/${batchResults.total} messages`);
    
    return batchResults;
  }

  /**
   * Smart batching based on queue conditions
   */
  async smartDequeueBatch(options = {}) {
    const {
      maxBatchSize = this.config.batchSize,
      maxWaitTime = 1000,
      minBatchSize = 1,
      priorityMix = true
    } = options;
    
    const batch = [];
    const startTime = Date.now();
    
    while (batch.length < maxBatchSize) {
      const message = await this.dequeue();
      if (!message) {
        // No more messages available
        if (batch.length >= minBatchSize) break;
        
        // Wait for more messages if under minimum
        if (Date.now() - startTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 10));
          continue;
        } else {
          break; // Timeout reached
        }
      }
      
      batch.push(message);
      
      // For priority mixing, occasionally check other priority levels
      if (priorityMix && batch.length % 3 === 0) {
        // Continue to get diverse priority messages
      }
    }
    
    if (batch.length > 0) {
      this.emit('batch:smart_dequeued', { 
        batch, 
        size: batch.length,
        waitTime: Date.now() - startTime,
        efficiency: batch.length / maxBatchSize
      });
      
      logger.debug(`🧠 Smart batch dequeued: ${batch.length} messages (${Date.now() - startTime}ms)`);
    }
    
    return batch;
  }

  /**
   * Get queue statistics and health
   */
  getQueueStats() {
    const priorityBreakdown = {};
    let totalSize = 0;
    
    for (const [priority, queue] of this.queues.entries()) {
      const priorityName = Object.keys(MessagePriority)[Object.values(MessagePriority).indexOf(priority)];
      priorityBreakdown[priorityName] = queue.length;
      totalSize += queue.length;
    }
    
    return {
      name: this.name,
      totalSize,
      priorityBreakdown,
      processingCount: this.processingMessages.size,
      deadLetterCount: this.deadLetterQueue.length,
      stats: { ...this.stats },
      health: this.calculateQueueHealth()
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const now = Date.now();
    const windowSize = 60000; // 1 minute window
    const recentMetrics = this.performanceWindow.filter(m => now - m.timestamp < windowSize);
    
    return {
      throughputPerSecond: this.stats.throughputPerSecond,
      averageProcessingTime: this.stats.averageProcessingTime,
      recentMetrics: recentMetrics.length,
      queueUtilization: (this.getTotalSize() / this.config.maxSize) * 100,
      processingUtilization: (this.processingMessages.size / this.config.batchSize) * 100,
      errorRate: this.stats.totalFailed / Math.max(this.stats.totalProcessed + this.stats.totalFailed, 1) * 100
    };
  }

  /**
   * Clear all messages from queue
   */
  async clear() {
    // Clear all priority queues
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
    
    // Clear processing messages
    for (const processing of this.processingMessages.values()) {
      clearTimeout(processing.timeout);
    }
    this.processingMessages.clear();
    
    // Clear tracking
    this.messages.clear();
    this.deadLetterQueue.length = 0;
    
    // Reset statistics
    this.stats.currentSize = 0;
    
    // Clear persistence
    if (this.config.enablePersistence) {
      await this.clearPersistedMessages();
    }
    
    this.emit('queue:cleared', { queue: this.name });
    logger.info(`🧹 Queue cleared: ${this.name}`);
  }

  /**
   * Gracefully shutdown queue
   */
  async shutdown() {
    logger.info(`🔄 Shutting down queue: ${this.name}`);
    
    // Stop performance monitoring
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Clear all timeouts
    for (const processing of this.processingMessages.values()) {
      clearTimeout(processing.timeout);
    }
    
    // Persist remaining messages if enabled
    if (this.config.enablePersistence) {
      await this.persistAllMessages();
    }
    
    this.emit('queue:shutdown', { queue: this.name });
    logger.info(`🏁 Queue shutdown complete: ${this.name}`);
  }

  // Private helper methods

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTotalSize() {
    return Array.from(this.queues.values()).reduce((total, queue) => total + queue.length, 0);
  }

  calculateRetryDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  async requeueMessage(message) {
    const priorityQueue = this.queues.get(message.priority);
    priorityQueue.push(message);
    this.stats.currentSize++;
    
    if (this.config.enablePersistence) {
      await this.persistMessage(message);
    }
  }

  async moveToDeadLetterQueue(message, error) {
    if (!this.config.deadLetterQueueEnabled) {
      this.messages.delete(message.id);
      return;
    }
    
    message.state = MessageState.DEAD;
    message.deadLetterReason = error.message;
    message.deadLetterAt = Date.now();
    
    this.deadLetterQueue.push(message);
    
    // Remove from main tracking
    this.messages.delete(message.id);
    
    this.emit('message:dead_letter', { message, reason: error.message });
    logger.error(`💀 Message moved to dead letter queue: ${message.id} - ${error.message}`);
  }

  handleProcessingTimeout(messageId) {
    const message = this.messages.get(messageId);
    if (message) {
      const timeoutError = new Error(`Processing timeout after ${this.config.processingTimeout}ms`);
      this.nackMessage(messageId, timeoutError, true);
    }
  }

  updateAverageProcessingTime(processingTime) {
    const totalProcessed = this.stats.totalProcessed;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (totalProcessed - 1) + processingTime) / totalProcessed;
  }

  recordPerformanceMetric(processingTime) {
    this.performanceWindow.push({
      timestamp: Date.now(),
      processingTime
    });
    
    // Keep only last 1000 metrics
    if (this.performanceWindow.length > 1000) {
      this.performanceWindow.shift();
    }
  }

  startPerformanceMonitoring() {
    this.processingInterval = setInterval(() => {
      this.calculateThroughput();
    }, 5000); // Update every 5 seconds
  }

  calculateThroughput() {
    const now = Date.now();
    const timeSinceLastCalculation = now - this.stats.lastThroughputCalculation;
    const newlyProcessed = this.stats.totalProcessed - (this.lastProcessedCount || 0);
    
    this.stats.throughputPerSecond = (newlyProcessed / timeSinceLastCalculation) * 1000;
    this.stats.lastThroughputCalculation = now;
    this.lastProcessedCount = this.stats.totalProcessed;
  }

  calculateQueueHealth() {
    const utilization = (this.getTotalSize() / this.config.maxSize) * 100;
    const errorRate = this.getPerformanceMetrics().errorRate;
    const processingBacklog = this.processingMessages.size;
    const deadLetterRate = (this.deadLetterQueue.length / Math.max(this.stats.totalEnqueued, 1)) * 100;
    const avgProcessingTime = this.stats.averageProcessingTime;
    
    const healthScore = this.calculateHealthScore();
    
    const issues = [];
    let status = 'healthy';
    
    // Critical issues
    if (utilization > 95) {
      issues.push('Queue near capacity');
      status = 'critical';
    }
    if (errorRate > 25) {
      issues.push('High error rate');
      status = 'critical';
    }
    if (deadLetterRate > 5) {
      issues.push('High dead letter rate');
      status = 'critical';
    }
    
    // Warning issues
    if (utilization > 80 && status !== 'critical') {
      issues.push('High utilization');
      status = 'warning';
    }
    if (errorRate > 10 && status !== 'critical') {
      issues.push('Elevated error rate');
      status = 'warning';
    }
    if (processingBacklog > this.config.batchSize * 3 && status !== 'critical') {
      issues.push('Processing backlog');
      status = 'warning';
    }
    if (avgProcessingTime > this.config.processingTimeout * 0.8 && status !== 'critical') {
      issues.push('Slow processing');
      status = 'warning';
    }
    
    return {
      status,
      score: healthScore,
      issues,
      metrics: {
        utilization,
        errorRate,
        processingBacklog,
        deadLetterRate,
        avgProcessingTime
      }
    };
  }

  /**
   * Calculate comprehensive health score (0-100)
   */
  calculateHealthScore() {
    const metrics = this.getPerformanceMetrics();
    const utilization = metrics.queueUtilization;
    const errorRate = metrics.errorRate;
    const processingUtilization = metrics.processingUtilization;
    const deadLetterRate = (this.deadLetterQueue.length / Math.max(this.stats.totalEnqueued, 1)) * 100;
    
    // Weight factors for different metrics
    const weights = {
      utilization: 0.25,
      errorRate: 0.30,
      processingUtilization: 0.20,
      deadLetterRate: 0.25
    };
    
    // Calculate sub-scores (higher is better)
    const utilizationScore = Math.max(0, 100 - utilization * 1.2); // Penalize high utilization
    const errorScore = Math.max(0, 100 - errorRate * 4); // Heavily penalize errors
    const processingScore = Math.max(0, 100 - processingUtilization * 1.5);
    const deadLetterScore = Math.max(0, 100 - deadLetterRate * 10); // Heavily penalize dead letters
    
    const healthScore = Math.round(
      utilizationScore * weights.utilization +
      errorScore * weights.errorRate +
      processingScore * weights.processingUtilization +
      deadLetterScore * weights.deadLetterRate
    );
    
    return Math.max(0, Math.min(100, healthScore));
  }

  /**
   * Start health monitoring with configurable intervals and thresholds
   */
  startHealthMonitoring(options = {}) {
    const {
      interval = 30000, // 30 seconds
      alertThresholds = {
        critical: 30,
        warning: 60,
        utilizationCritical: 95,
        errorRateCritical: 25,
        deadLetterRateCritical: 5
      }
    } = options;
    
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    
    this.healthMonitorInterval = setInterval(() => {
      const health = this.calculateQueueHealth();
      
      // Check for alerts
      this.checkHealthAlerts(health, alertThresholds);
      
      // Emit health status
      this.emit('health:status', {
        queueName: this.name,
        timestamp: Date.now(),
        ...health
      });
      
      // Auto-adjust if enabled
      if (this.config.enableAutoAdjustment) {
        if (health.score < 70) {
          this.adjustQueueCapacity();
        }
        
        if (health.score < 50) {
          this.autoTuneParameters();
        }
      }
      
    }, interval);
    
    logger.info(`💓 Health monitoring started: ${this.name} (interval: ${interval}ms)`);
  }

  /**
   * Check health metrics against thresholds and emit alerts
   */
  checkHealthAlerts(health, thresholds) {
    const alerts = [];
    
    // Critical alerts
    if (health.score <= thresholds.critical) {
      alerts.push({
        level: 'critical',
        message: `Queue health critical: ${health.score}%`,
        issues: health.issues
      });
    }
    
    if (health.metrics.utilization >= thresholds.utilizationCritical) {
      alerts.push({
        level: 'critical',
        message: `Queue utilization critical: ${health.metrics.utilization.toFixed(1)}%`,
        metric: 'utilization',
        value: health.metrics.utilization
      });
    }
    
    if (health.metrics.errorRate >= thresholds.errorRateCritical) {
      alerts.push({
        level: 'critical',
        message: `Error rate critical: ${health.metrics.errorRate.toFixed(1)}%`,
        metric: 'errorRate',
        value: health.metrics.errorRate
      });
    }
    
    if (health.metrics.deadLetterRate >= thresholds.deadLetterRateCritical) {
      alerts.push({
        level: 'critical',
        message: `Dead letter rate critical: ${health.metrics.deadLetterRate.toFixed(1)}%`,
        metric: 'deadLetterRate',
        value: health.metrics.deadLetterRate
      });
    }
    
    // Warning alerts
    if (health.score <= thresholds.warning && health.score > thresholds.critical) {
      alerts.push({
        level: 'warning',
        message: `Queue health warning: ${health.score}%`,
        issues: health.issues
      });
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      this.emit('health:alert', {
        queueName: this.name,
        timestamp: Date.now(),
        ...alert
      });
      
      logger.warn(`🔴 Health Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
    });
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
      logger.info(`💓 Health monitoring stopped: ${this.name}`);
    }
  }

  /**
   * Get detailed health report
   */
  getHealthReport() {
    const health = this.calculateQueueHealth();
    const metrics = this.getPerformanceMetrics();
    const queueStats = this.getQueueStats();
    
    return {
      timestamp: Date.now(),
      queueName: this.name,
      health,
      performance: metrics,
      statistics: queueStats,
      configuration: {
        maxSize: this.config.maxSize,
        batchSize: this.config.batchSize,
        maxRetries: this.config.maxRetries,
        processingTimeout: this.config.processingTimeout,
        deadLetterQueueEnabled: this.config.deadLetterQueueEnabled
      },
      recommendations: this.generateHealthRecommendations(health, metrics)
    };
  }

  /**
   * Generate health recommendations based on current metrics
   */
  generateHealthRecommendations(health, metrics) {
    const recommendations = [];
    
    if (health.metrics.utilization > 80) {
      recommendations.push({
        category: 'capacity',
        priority: 'high',
        message: 'Consider increasing queue capacity or adding more consumers',
        action: 'scale_up'
      });
    }
    
    if (health.metrics.errorRate > 10) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        message: 'High error rate detected. Review message processing logic',
        action: 'investigate_errors'
      });
    }
    
    if (health.metrics.deadLetterRate > 2) {
      recommendations.push({
        category: 'reliability',
        priority: 'medium',
        message: 'Review dead letter queue messages for patterns',
        action: 'analyze_dead_letters'
      });
    }
    
    if (metrics.averageProcessingTime > this.config.processingTimeout * 0.5) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        message: 'Processing time is high. Consider optimizing consumer logic',
        action: 'optimize_processing'
      });
    }
    
    if (this.getTotalSize() < this.config.maxSize * 0.1 && metrics.throughputPerSecond < 1) {
      recommendations.push({
        category: 'efficiency',
        priority: 'low',
        message: 'Queue is underutilized. Consider reducing capacity',
        action: 'scale_down'
      });
    }
    
    return recommendations;
  }

  // Persistence methods (mock implementation)
  async persistMessage(message) {
    // In production, this would write to database/file system
    logger.debug(`💾 Persisting message: ${message.id}`);
  }

  async removePersistedMessage(messageId) {
    logger.debug(`🗑️ Removing persisted message: ${messageId}`);
  }

  async persistAllMessages() {
    logger.debug(`💾 Persisting all messages for queue: ${this.name}`);
  }

  async clearPersistedMessages() {
    logger.debug(`🧹 Clearing persisted messages for queue: ${this.name}`);
  }

  /**
   * Remove a specific message from queue (for rollback operations)
   */
  async removeMessage(messageId) {
    const message = this.messages.get(messageId);
    if (!message) {
      return false;
    }
    
    // Remove from appropriate priority queue
    const priorityQueue = this.queues.get(message.priority);
    if (priorityQueue) {
      const index = priorityQueue.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        priorityQueue.splice(index, 1);
        this.stats.currentSize--;
      }
    }
    
    // Remove from tracking
    this.messages.delete(messageId);
    
    // Clear processing if active
    const processing = this.processingMessages.get(messageId);
    if (processing) {
      clearTimeout(processing.timeout);
      this.processingMessages.delete(messageId);
    }
    
    // Remove from persistence if enabled
    if (this.config.enablePersistence) {
      await this.removePersistedMessage(messageId);
    }
    
    logger.debug(`🗑️ Message removed: ${messageId}`);
    return true;
  }

  /**
   * Dynamic queue scaling and auto-adjustment
   */
  async adjustQueueCapacity() {
    const currentLoad = this.getTotalSize() / this.config.maxSize;
    const processingLoad = this.processingMessages.size / this.config.batchSize;
    const errorRate = this.getPerformanceMetrics().errorRate;
    
    let newMaxSize = this.config.maxSize;
    let newBatchSize = this.config.batchSize;
    
    // Scale up conditions
    if (currentLoad > 0.8 && this.stats.throughputPerSecond > 50) {
      newMaxSize = Math.min(this.config.maxSize * 1.5, 50000); // Cap at 50k
      this.emit('queue:scaling_up', { 
        oldSize: this.config.maxSize, 
        newSize: newMaxSize,
        reason: 'High load and throughput'
      });
    }
    
    // Scale down conditions
    if (currentLoad < 0.3 && this.stats.throughputPerSecond < 10) {
      newMaxSize = Math.max(this.config.maxSize * 0.7, 1000); // Min 1k
      this.emit('queue:scaling_down', { 
        oldSize: this.config.maxSize, 
        newSize: newMaxSize,
        reason: 'Low utilization'
      });
    }
    
    // Adjust batch size based on processing efficiency
    if (processingLoad > 0.9) {
      newBatchSize = Math.min(this.config.batchSize * 1.2, 500);
    } else if (processingLoad < 0.3) {
      newBatchSize = Math.max(this.config.batchSize * 0.8, 10);
    }
    
    // Apply changes if significant
    if (Math.abs(newMaxSize - this.config.maxSize) > this.config.maxSize * 0.1) {
      this.config.maxSize = Math.round(newMaxSize);
      logger.info(`📏 Queue capacity adjusted: ${this.config.maxSize}`);
    }
    
    if (Math.abs(newBatchSize - this.config.batchSize) > 5) {
      this.config.batchSize = Math.round(newBatchSize);
      logger.info(`📦 Batch size adjusted: ${this.config.batchSize}`);
    }
    
    return {
      maxSize: this.config.maxSize,
      batchSize: this.config.batchSize,
      currentLoad,
      processingLoad,
      errorRate
    };
  }

  /**
   * Auto-tune queue parameters based on historical performance
   */
  async autoTuneParameters() {
    const metrics = this.getPerformanceMetrics();
    const recentWindow = this.performanceWindow.slice(-100); // Last 100 operations
    
    if (recentWindow.length < 50) {
      return; // Not enough data
    }
    
    const avgProcessingTime = recentWindow.reduce((sum, m) => sum + m.processingTime, 0) / recentWindow.length;
    const p95ProcessingTime = recentWindow.sort((a, b) => a.processingTime - b.processingTime)[Math.floor(recentWindow.length * 0.95)].processingTime;
    
    // Adjust timeout based on p95 processing time
    const newTimeout = Math.min(p95ProcessingTime * 2, 120000); // Max 2 minutes
    if (Math.abs(newTimeout - this.config.processingTimeout) > 5000) {
      this.config.processingTimeout = newTimeout;
      logger.info(`⏱️ Processing timeout auto-tuned: ${newTimeout}ms`);
    }
    
    // Adjust retry delay based on success patterns
    if (metrics.errorRate < 5) {
      // Low error rate, can be more aggressive
      this.config.retryDelay = Math.max(this.config.retryDelay * 0.9, 500);
    } else if (metrics.errorRate > 15) {
      // High error rate, be more conservative
      this.config.retryDelay = Math.min(this.config.retryDelay * 1.1, 5000);
    }
    
    this.emit('queue:auto_tuned', {
      processingTimeout: this.config.processingTimeout,
      retryDelay: this.config.retryDelay,
      avgProcessingTime,
      p95ProcessingTime,
      errorRate: metrics.errorRate
    });
    
    return {
      processingTimeout: this.config.processingTimeout,
      retryDelay: this.config.retryDelay,
      tuningData: {
        avgProcessingTime,
        p95ProcessingTime,
        errorRate: metrics.errorRate
      }
    };
  }
}

/**
 * Queue Persistence Manager (placeholder implementation)
 */
class QueuePersistenceManager {
  constructor(queueName) {
    this.queueName = queueName;
    logger.debug(`💾 Queue persistence manager initialized: ${queueName}`);
  }
}

module.exports = {
  MessageQueue,
  MessagePriority,
  MessageState,
  QueuePersistenceManager
};