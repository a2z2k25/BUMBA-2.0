/**
 * BUMBA File Locking System
 * CRITICAL: Prevents file conflicts during parallel agent execution
 * 
 * This is the #1 missing piece for safe parallel collaboration
 */

const { logger } = require('../logging/bumba-logger');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileLockingSystem {
  constructor() {
    // In-memory locks (should be Redis in production)
    this.locks = new Map(); // filepath -> { agentId, token, timestamp, exclusive }
    this.waitQueues = new Map(); // filepath -> [waiting agents]
    this.lockTimeout = 30000; // 30 seconds default
    
    // Lock statistics
    this.stats = {
      locksAcquired: 0,
      locksReleased: 0,
      conflicts: 0,
      timeouts: 0
    };
    
    // Start cleanup interval
    this.startCleanup();
  }
  
  /**
   * Acquire a lock on a file
   * @param {string} filepath - File to lock
   * @param {string} agentId - Agent requesting lock
   * @param {object} options - Lock options
   * @returns {object} Lock token or null if failed
   */
  async acquireLock(filepath, agentId, options = {}) {
    const {
      exclusive = true,
      timeout = this.lockTimeout,
      wait = true,
      priority = 0
    } = options;
    
    const normalizedPath = path.normalize(filepath);
    
    // Check if file is already locked
    const existingLock = this.locks.get(normalizedPath);
    
    if (existingLock) {
      // Check if same agent (reentrant)
      if (existingLock.agentId === agentId) {
        logger.info(`🟢 Agent ${agentId} already holds lock for ${filepath}`);
        return existingLock.token;
      }
      
      // Check if lock expired
      if (Date.now() - existingLock.timestamp > existingLock.timeout) {
        logger.warn(`⏰ Lock expired for ${filepath}, releasing`);
        await this.releaseLock(normalizedPath, existingLock.token, true);
      } else {
        // Lock is held by another agent
        this.stats.conflicts++;
        logger.warn(`🔴 File ${filepath} locked by ${existingLock.agentId}`);
        
        if (wait) {
          return await this.waitForLock(normalizedPath, agentId, timeout, priority);
        }
        
        return null;
      }
    }
    
    // Acquire the lock
    const token = crypto.randomBytes(16).toString('hex');
    const lock = {
      agentId,
      token,
      timestamp: Date.now(),
      timeout,
      exclusive,
      filepath: normalizedPath
    };
    
    this.locks.set(normalizedPath, lock);
    this.stats.locksAcquired++;
    
    logger.info(`🏁 Lock acquired by ${agentId} for ${filepath}`);
    
    return token;
  }
  
  /**
   * Release a lock
   * @param {string} filepath - File to unlock
   * @param {string} token - Lock token
   * @param {boolean} force - Force release even if token doesn't match
   */
  async releaseLock(filepath, token, force = false) {
    const normalizedPath = path.normalize(filepath);
    const lock = this.locks.get(normalizedPath);
    
    if (!lock) {
      logger.warn(`🟡 No lock found for ${filepath}`);
      return false;
    }
    
    if (!force && lock.token !== token) {
      logger.error(`🔴 Invalid token for ${filepath}`);
      return false;
    }
    
    // Release the lock
    this.locks.delete(normalizedPath);
    this.stats.locksReleased++;
    
    logger.info(`🟡 Lock released by ${lock.agentId} for ${filepath}`);
    
    // Process wait queue
    await this.processWaitQueue(normalizedPath);
    
    return true;
  }
  
  /**
   * Wait for a lock to become available
   */
  async waitForLock(filepath, agentId, timeout, priority) {
    return new Promise((resolve) => {
      const waiter = {
        agentId,
        priority,
        resolve,
        timestamp: Date.now(),
        timeout
      };
      
      // Add to wait queue
      if (!this.waitQueues.has(filepath)) {
        this.waitQueues.set(filepath, []);
      }
      
      const queue = this.waitQueues.get(filepath);
      queue.push(waiter);
      
      // Sort by priority
      queue.sort((a, b) => b.priority - a.priority);
      
      logger.info(`⏳ Agent ${agentId} waiting for lock on ${filepath} (position ${queue.length})`);
      
      // Set timeout
      setTimeout(() => {
        const index = queue.indexOf(waiter);
        if (index !== -1) {
          queue.splice(index, 1);
          this.stats.timeouts++;
          logger.warn(`⏰ Wait timeout for ${agentId} on ${filepath}`);
          resolve(null);
        }
      }, timeout);
    });
  }
  
  /**
   * Process wait queue when lock is released
   */
  async processWaitQueue(filepath) {
    const queue = this.waitQueues.get(filepath);
    
    if (!queue || queue.length === 0) {
      return;
    }
    
    // Get next waiter
    const waiter = queue.shift();
    
    if (queue.length === 0) {
      this.waitQueues.delete(filepath);
    }
    
    // Give lock to next waiter
    const token = await this.acquireLock(filepath, waiter.agentId, {
      exclusive: true,
      timeout: waiter.timeout,
      wait: false
    });
    
    waiter.resolve(token);
  }
  
  /**
   * Check if a file is locked
   */
  isLocked(filepath) {
    const normalizedPath = path.normalize(filepath);
    const lock = this.locks.get(normalizedPath);
    
    if (!lock) {return false;}
    
    // Check if expired
    if (Date.now() - lock.timestamp > lock.timeout) {
      this.releaseLock(normalizedPath, lock.token, true);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get lock info
   */
  getLockInfo(filepath) {
    const normalizedPath = path.normalize(filepath);
    const lock = this.locks.get(normalizedPath);
    
    if (!lock) {return null;}
    
    return {
      agentId: lock.agentId,
      acquired: new Date(lock.timestamp),
      expiresIn: Math.max(0, lock.timeout - (Date.now() - lock.timestamp))
    };
  }
  
  /**
   * Get all active locks
   */
  getActiveLocks() {
    const active = [];
    
    for (const [filepath, lock] of this.locks) {
      active.push({
        filepath,
        agentId: lock.agentId,
        acquired: new Date(lock.timestamp),
        expiresIn: Math.max(0, lock.timeout - (Date.now() - lock.timestamp))
      });
    }
    
    return active;
  }
  
  /**
   * Execute operation with lock
   */
  async withLock(filepath, agentId, operation, options = {}) {
    const token = await this.acquireLock(filepath, agentId, options);
    
    if (!token) {
      throw new Error(`Failed to acquire lock for ${filepath}`);
    }
    
    try {
      return await operation();
    } finally {
      await this.releaseLock(filepath, token);
    }
  }
  
  /**
   * Cleanup expired locks
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      
      for (const [filepath, lock] of this.locks) {
        if (now - lock.timestamp > lock.timeout) {
          logger.warn(`🟢 Cleaning expired lock for ${filepath}`);
          this.releaseLock(filepath, lock.token, true);
        }
      }
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentLocks: this.locks.size,
      waitingAgents: Array.from(this.waitQueues.values())
        .reduce((sum, queue) => sum + queue.length, 0)
    };
  }
  
  /**
   * Clear all locks (emergency use only)
   */
  clearAllLocks() {
    logger.warn('🟡 Clearing all locks - emergency operation');
    
    const count = this.locks.size;
    this.locks.clear();
    this.waitQueues.clear();
    
    return count;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  FileLockingSystem,
  getInstance: () => {
    if (!instance) {
      instance = new FileLockingSystem();
    }
    return instance;
  }
};