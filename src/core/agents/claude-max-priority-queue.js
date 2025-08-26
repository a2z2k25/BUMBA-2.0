/**
 * Claude Max Priority Queue System
 * Manages access to Claude Max with priority levels and preemption
 * Ensures manager validations get highest priority
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Priority Levels (higher number = higher priority)
 */
const PriorityLevel = {
  VALIDATION: 5,      // Manager validation (HIGHEST)
  EXECUTIVE: 4,       // Executive mode operations
  SECURITY: 3,        // Security-critical operations
  MANAGER: 2,         // Normal manager operations
  SPECIALIST: 1,      // Specialist operations
  BACKGROUND: 0       // Background tasks (LOWEST)
};

/**
 * Queue Entry
 */
class QueueEntry {
  constructor(data) {
    this.id = data.id;
    this.requesterId = data.requesterId;
    this.requesterType = data.requesterType;
    this.priority = data.priority;
    this.timestamp = Date.now();
    this.callback = data.callback;
    this.timeout = data.timeout || 30000;
    this.preemptible = data.preemptible !== false;
    this.metadata = data.metadata || {};
  }

  /**
   * Check if entry has timed out
   */
  isTimedOut() {
    return (Date.now() - this.timestamp) > this.timeout;
  }

  /**
   * Get wait time in ms
   */
  getWaitTime() {
    return Date.now() - this.timestamp;
  }
}

/**
 * Claude Max Priority Queue
 */
class ClaudeMaxPriorityQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.currentHolder = null;
    this.isAvailable = true;
    this.metrics = {
      totalRequests: 0,
      grantedRequests: 0,
      preemptions: 0,
      timeouts: 0,
      averageWaitTime: 0,
      priorityBreakdown: {}
    };
    
    // Initialize priority breakdown
    Object.values(PriorityLevel).forEach(level => {
      this.metrics.priorityBreakdown[level] = 0;
    });
    
    // Start timeout checker
    this.startTimeoutChecker();
  }

  /**
   * Request Claude Max access
   */
  async requestAccess(requesterId, requesterType, priority, metadata = {}) {
    return new Promise((resolve, reject) => {
      const entry = new QueueEntry({
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requesterId,
        requesterType,
        priority,
        callback: resolve,
        metadata
      });
      
      this.metrics.totalRequests++;
      this.metrics.priorityBreakdown[priority] = (this.metrics.priorityBreakdown[priority] || 0) + 1;
      
      logger.info(`🔐 Claude Max requested by ${requesterId} (priority: ${priority})`);
      
      // Check for immediate grant
      if (this.isAvailable) {
        this.grantAccess(entry);
        return;
      }
      
      // Check for preemption possibility
      if (this.canPreempt(entry)) {
        this.preemptCurrentHolder(entry);
        return;
      }
      
      // Add to queue
      this.addToQueue(entry);
      this.emit('request-queued', entry);
    });
  }

  /**
   * Check if new entry can preempt current holder
   */
  canPreempt(entry) {
    if (!this.currentHolder) return false;
    if (!this.currentHolder.preemptible) return false;
    
    // Validation (priority 5) can preempt anything
    if (entry.priority === PriorityLevel.VALIDATION) {
      return true;
    }
    
    // Higher priority can preempt lower priority
    return entry.priority > this.currentHolder.priority;
  }

  /**
   * Preempt current holder
   */
  async preemptCurrentHolder(newEntry) {
    logger.warn(`🟢 Preempting ${this.currentHolder.requesterId} for ${newEntry.requesterId}`);
    
    this.metrics.preemptions++;
    
    // Notify current holder of preemption
    this.emit('access-preempted', this.currentHolder);
    
    // Add current holder back to queue (at front of their priority level)
    this.addToQueue(this.currentHolder, true);
    
    // Grant access to new entry
    this.grantAccess(newEntry);
  }

  /**
   * Add entry to queue
   */
  addToQueue(entry, frontOfPriority = false) {
    // Find insertion point based on priority
    let insertIndex = this.queue.length;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (entry.priority > this.queue[i].priority) {
        insertIndex = i;
        break;
      } else if (entry.priority === this.queue[i].priority && frontOfPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, entry);
    logger.info(`📋 Added to queue at position ${insertIndex + 1}/${this.queue.length}`);
  }

  /**
   * Grant access to requester
   */
  grantAccess(entry) {
    this.currentHolder = entry;
    this.isAvailable = false;
    
    const waitTime = entry.getWaitTime();
    this.updateAverageWaitTime(waitTime);
    
    this.metrics.grantedRequests++;
    
    logger.info(`🏁 Claude Max granted to ${entry.requesterId} (waited ${waitTime}ms)`);
    
    // Resolve the promise
    entry.callback({
      granted: true,
      lockId: entry.id,
      priority: entry.priority,
      waitTime
    });
    
    this.emit('access-granted', entry);
  }

  /**
   * Release Claude Max access
   */
  releaseAccess(lockId) {
    if (!this.currentHolder || this.currentHolder.id !== lockId) {
      logger.warn(`🟠️ Invalid lock release attempt: ${lockId}`);
      return false;
    }
    
    logger.info(`🔓 Claude Max released by ${this.currentHolder.requesterId}`);
    
    this.currentHolder = null;
    this.isAvailable = true;
    
    // Process next in queue
    this.processQueue();
    
    return true;
  }

  /**
   * Process queue and grant access to next requester
   */
  processQueue() {
    if (this.queue.length === 0) {
      logger.info('📭 Queue empty, Claude Max available');
      return;
    }
    
    if (!this.isAvailable) {
      return;
    }
    
    // Get highest priority entry
    const nextEntry = this.queue.shift();
    
    // Check if it has timed out
    if (nextEntry.isTimedOut()) {
      logger.warn(`⏱️ Request from ${nextEntry.requesterId} timed out`);
      this.metrics.timeouts++;
      nextEntry.callback({
        granted: false,
        reason: 'timeout',
        waitTime: nextEntry.getWaitTime()
      });
      this.processQueue(); // Try next in queue
      return;
    }
    
    this.grantAccess(nextEntry);
  }

  /**
   * Start timeout checker
   */
  startTimeoutChecker() {
    setInterval(() => {
      // Remove timed out entries from queue
      const beforeLength = this.queue.length;
      this.queue = this.queue.filter(entry => {
        if (entry.isTimedOut()) {
          logger.warn(`⏱️ Removing timed out request from ${entry.requesterId}`);
          this.metrics.timeouts++;
          entry.callback({
            granted: false,
            reason: 'timeout',
            waitTime: entry.getWaitTime()
          });
          return false;
        }
        return true;
      });
      
      if (beforeLength !== this.queue.length) {
        logger.info(`🧹 Cleaned ${beforeLength - this.queue.length} timed out entries`);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Update average wait time metric
   */
  updateAverageWaitTime(waitTime) {
    const totalWaitTime = this.metrics.averageWaitTime * (this.metrics.grantedRequests - 1);
    this.metrics.averageWaitTime = (totalWaitTime + waitTime) / this.metrics.grantedRequests;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable,
      currentHolder: this.currentHolder ? {
        id: this.currentHolder.requesterId,
        type: this.currentHolder.requesterType,
        priority: this.currentHolder.priority,
        holdTime: this.currentHolder.getWaitTime()
      } : null,
      queueLength: this.queue.length,
      queue: this.queue.map(entry => ({
        id: entry.requesterId,
        type: entry.requesterType,
        priority: entry.priority,
        waitTime: entry.getWaitTime()
      }))
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0
        ? (this.metrics.grantedRequests / this.metrics.totalRequests * 100).toFixed(1) + '%'
        : 'N/A',
      preemptionRate: this.metrics.grantedRequests > 0
        ? (this.metrics.preemptions / this.metrics.grantedRequests * 100).toFixed(1) + '%'
        : 'N/A',
      timeoutRate: this.metrics.totalRequests > 0
        ? (this.metrics.timeouts / this.metrics.totalRequests * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Emergency release all locks
   */
  emergencyReleaseAll() {
    logger.warn('🔴 Emergency release of all Claude Max locks');
    
    this.currentHolder = null;
    this.isAvailable = true;
    
    // Notify all queued requests
    this.queue.forEach(entry => {
      entry.callback({
        granted: false,
        reason: 'emergency_release',
        waitTime: entry.getWaitTime()
      });
    });
    
    this.queue = [];
    this.emit('emergency-release');
  }
}

// Singleton instance
let queueInstance = null;

/**
 * Get queue singleton
 */
function getPriorityQueue() {
  if (!queueInstance) {
    queueInstance = new ClaudeMaxPriorityQueue();
  }
  return queueInstance;
}

module.exports = {
  ClaudeMaxPriorityQueue,
  getPriorityQueue,
  PriorityLevel,
  QueueEntry
};