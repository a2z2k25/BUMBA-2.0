/**
 * BUMBA Claude Max Account Manager
 * Manages exclusive access to Claude Max account with mutex lock
 * Ensures only one agent can use Claude Max at any given time
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');

class ClaudeMaxAccountManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize hook system
    this.hooks = new UnifiedHookSystem();
    
    // Add compatibility layer for different hook APIs
    if (!this.hooks.executeHooks && this.hooks.trigger) {
      this.hooks.executeHooks = this.hooks.trigger.bind(this.hooks);
    }
    if (!this.hooks.getRegisteredHooks && this.hooks.hookRegistry) {
      this.hooks.getRegisteredHooks = () => {
        const hooks = {};
        this.hooks.hookRegistry.forEach((config, name) => {
          hooks[name] = config;
        });
        return hooks;
      };
    }
    
    // Claude Max account configuration
    this.claudeMaxConfig = {
      apiKey: process.env.CLAUDE_MAX_API_KEY || process.env.ANTHROPIC_API_KEY,
      model: process.env.CLAUDE_MAX_MODEL || 'claude-3-opus-20240229',
      endpoint: process.env.CLAUDE_MAX_ENDPOINT || 'https://api.anthropic.com/v1/messages',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.CLAUDE_MAX_TEMPERATURE || '0.7'),
      ...config
    };
    
    // Mutex lock state
    this.mutex = {
      locked: false,
      owner: null,
      acquiredAt: null,
      queue: [],
      timeout: config.lockTimeout || 60000, // 60 seconds default timeout
    };
    
    // Usage tracking
    this.usage = {
      totalRequests: 0,
      activeRequest: null,
      queueLength: 0,
      averageWaitTime: 0,
      lastUsed: null
    };
    
    // Priority levels for different agent types
    this.priorityLevels = {
      'executive': 1, // Highest priority
      'manager': 2, // Manager level
      'review-validation': 3, // Review/validation tasks
      'cross-domain': 4, // Cross-domain coordination
      'critical': 5, // Critical tasks
      'normal': 10 // Normal priority
    };
    
    // Initialize timeout checker
    this.startTimeoutChecker();
    
    // Register Claude Max hooks
    this.registerClaudeMaxHooks();
  }
  
  /**
   * Register Claude Max hooks
   */
  registerClaudeMaxHooks() {
    // Register pre-lock evaluation hook
    this.hooks.register('claudemax:beforeLockAcquisition', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 100,
      description: 'Evaluate if Claude Max is needed before acquiring lock',
      schema: {
        agentId: 'string',
        agentType: 'string',
        taskType: 'string',
      }
    });
    
    // Register alternative suggestion hook
    this.hooks.register('claudemax:suggestAlternative', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 75,
      description: 'Suggest alternative model when Claude Max unavailable',
      schema: {
        agentId: 'string',
        reason: 'string',
        alternatives: 'array',
        queuePosition: 'number'
      }
    });
    
    // Register lock granted hook
    this.hooks.register('claudemax:lockGranted', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute when Claude Max lock is granted',
      schema: {
        agentId: 'string',
        agentType: 'string',
        timestamp: 'number'
      }
    });
    
    // Register lock released hook
    this.hooks.register('claudemax:lockReleased', async (ctx) => ({ success: true }), {
      category: 'resource',
      priority: 50,
      description: 'Execute when Claude Max lock is released',
      schema: {
        agentId: 'string',
        duration: 'number',
        usage: 'object'
      }
    });
    
    logger.info('🏁 Claude Max hooks registered');
  }
  
  /**
   * Acquire exclusive lock for Claude Max account
   * @param {string} agentId - ID of the requesting agent
   * @param {string} agentType - Type of agent (executive, manager, etc.)
   * @param {number} priority - Priority level for queue ordering
   * @returns {Promise<boolean>} - True if lock acquired
   */
  async acquireLock(agentId, agentType = 'normal', priority = 10) {
    // Execute beforeLockAcquisition hook
    const evaluationContext = await this.hooks.execute('claudemax:beforeLockAcquisition', {
      agentId,
      agentType,
      taskType: agentType,
      priority
    });
    
    // Check if hook suggests not using Claude Max
    if (evaluationContext.preventAcquisition) {
      // Suggest alternative
      const alternativeContext = await this.hooks.execute('claudemax:suggestAlternative', {
        agentId,
        reason: evaluationContext.reason || 'Hook prevented acquisition',
        alternatives: ['deepseek', 'qwen', 'gemini'],
        queuePosition: this.mutex.queue.length
      });
      
      if (alternativeContext.useAlternative) {
        return false;
      }
    }
    
    return new Promise((resolve, reject) => {
      const request = {
        agentId,
        agentType,
        priority: this.priorityLevels[agentType] || priority,
        timestamp: Date.now(),
        resolve,
        reject,
        attempts: 0
      };
      
      // If not locked, acquire immediately
      if (!this.mutex.locked) {
        this.grantLock(request);
        resolve(true);
      } else {
        // Add to priority queue
        this.addToQueue(request);
        logger.info(`🟢 Agent ${agentId} queued for Claude Max access (position: ${this.mutex.queue.length})`);
      }
    });
  }
  
  /**
   * Grant lock to a request
   */
  grantLock(request) {
    this.mutex.locked = true;
    this.mutex.owner = request.agentId;
    this.mutex.acquiredAt = Date.now();
    
    this.usage.activeRequest = {
      agentId: request.agentId,
      agentType: request.agentType,
      startTime: Date.now()
    };
    
    logger.info(`🏁 Claude Max lock granted to ${request.agentId} (${request.agentType})`);
    
    this.emit('lock:acquired', {
      agentId: request.agentId,
      agentType: request.agentType,
      timestamp: Date.now()
    });
  }
  
  /**
   * Release the lock
   * @param {string} agentId - ID of the agent releasing the lock
   */
  async releaseLock(agentId) {
    if (this.mutex.owner !== agentId) {
      logger.warn(`🟡 Agent ${agentId} attempted to release lock owned by ${this.mutex.owner}`);
      return false;
    }
    
    // Calculate usage metrics
    const duration = Date.now() - this.mutex.acquiredAt;
    this.usage.totalRequests++;
    this.usage.lastUsed = Date.now();
    
    logger.info(`🟡 Claude Max lock released by ${agentId} (duration: ${duration}ms)`);
    
    // Clear current lock
    this.mutex.locked = false;
    this.mutex.owner = null;
    this.mutex.acquiredAt = null;
    this.usage.activeRequest = null;
    
    this.emit('lock:released', {
      agentId,
      duration,
      timestamp: Date.now()
    });
    
    // Process next in queue
    this.processQueue();
    
    return true;
  }
  
  /**
   * Add request to priority queue
   */
  addToQueue(request) {
    // Insert based on priority (lower number = higher priority)
    const insertIndex = this.mutex.queue.findIndex(r => r.priority > request.priority);
    
    if (insertIndex === -1) {
      this.mutex.queue.push(request);
    } else {
      this.mutex.queue.splice(insertIndex, 0, request);
    }
    
    this.usage.queueLength = this.mutex.queue.length;
    
    this.emit('queue:added', {
      agentId: request.agentId,
      position: insertIndex === -1 ? this.mutex.queue.length : insertIndex + 1,
      queueLength: this.mutex.queue.length
    });
  }
  
  /**
   * Process queue after lock release
   */
  processQueue() {
    if (this.mutex.queue.length === 0) {
      return;
    }
    
    const nextRequest = this.mutex.queue.shift();
    const waitTime = Date.now() - nextRequest.timestamp;
    
    // Update average wait time
    this.usage.averageWaitTime = this.usage.averageWaitTime === 0 
      ? waitTime 
      : (this.usage.averageWaitTime + waitTime) / 2;
    
    this.usage.queueLength = this.mutex.queue.length;
    
    logger.info(`🟢 Processing next in queue: ${nextRequest.agentId} (waited ${waitTime}ms)`);
    
    // Grant lock to next request
    this.grantLock(nextRequest);
    nextRequest.resolve(true);
  }
  
  /**
   * Force release a stuck lock (timeout protection)
   */
  forceRelease() {
    if (!this.mutex.locked) {
      return;
    }
    
    const duration = Date.now() - this.mutex.acquiredAt;
    logger.warn(`🟡 Force releasing Claude Max lock from ${this.mutex.owner} (held for ${duration}ms)`);
    
    this.mutex.locked = false;
    this.mutex.owner = null;
    this.mutex.acquiredAt = null;
    this.usage.activeRequest = null;
    
    this.emit('lock:forced', {
      previousOwner: this.mutex.owner,
      duration,
      timestamp: Date.now()
    });
    
    this.processQueue();
  }
  
  /**
   * Check for stuck locks periodically
   */
  startTimeoutChecker() {
    setInterval(() => {
      if (this.mutex.locked && this.mutex.acquiredAt) {
        const duration = Date.now() - this.mutex.acquiredAt;
        
        if (duration > this.mutex.timeout) {
          logger.error(`🔴 Lock timeout detected for ${this.mutex.owner}`);
          this.forceRelease();
        } else if (duration > this.mutex.timeout * 0.8) {
          // Warn at 80% of timeout
          logger.warn(`🟡 Lock held by ${this.mutex.owner} approaching timeout (${duration}ms)`);
        }
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Check if Claude Max is available
   */
  isAvailable() {
    return !this.mutex.locked;
  }
  
  /**
   * Get current lock status
   */
  getStatus() {
    return {
      available: !this.mutex.locked,
      currentOwner: this.mutex.owner,
      heldFor: this.mutex.acquiredAt ? Date.now() - this.mutex.acquiredAt : 0,
      queueLength: this.mutex.queue.length,
      queuedAgents: this.mutex.queue.map(r => ({
        agentId: r.agentId,
        agentType: r.agentType,
        priority: r.priority,
        waitingFor: Date.now() - r.timestamp
      })),
      usage: {
        totalRequests: this.usage.totalRequests,
        averageWaitTime: Math.round(this.usage.averageWaitTime),
        lastUsed: this.usage.lastUsed
      }
    };
  }
  
  /**
   * Get Claude Max configuration for agent use
   */
  getClaudeMaxConfig() {
    if (!this.claudeMaxConfig.apiKey) {
      throw new Error('Claude Max API key not configured');
    }
    
    return {
      provider: 'anthropic',
      model: this.claudeMaxConfig.model,
      apiKey: this.claudeMaxConfig.apiKey,
      endpoint: this.claudeMaxConfig.endpoint,
      maxTokens: this.claudeMaxConfig.maxTokens,
      temperature: this.claudeMaxConfig.temperature,
      isClaudeMax: true
    };
  }
  
  /**
   * Check if an agent type should use Claude Max
   */
  shouldUseClaudeMax(agentType, taskType) {
    // Managers always use Claude Max
    if (agentType === 'manager' || agentType === 'executive') {
      return true;
    }
    
    // Review/validation always uses Claude Max
    if (taskType === 'review' || taskType === 'validation') {
      return true;
    }
    
    // Cross-domain coordination uses Claude Max
    if (taskType === 'cross-domain' || taskType === 'coordination') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Wait for availability with timeout
   */
  async waitForAvailability(agentId, timeout = 30000) {
    const startTime = Date.now();
    
    while (!this.isAvailable()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for Claude Max availability (${agentId})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return true;
  }
  
  /**
   * Get queue position for an agent
   */
  getQueuePosition(agentId) {
    const index = this.mutex.queue.findIndex(r => r.agentId === agentId);
    return index === -1 ? null : index + 1;
  }
  
  /**
   * Cancel a queued request
   */
  cancelQueuedRequest(agentId) {
    const index = this.mutex.queue.findIndex(r => r.agentId === agentId);
    
    if (index === -1) {
      return false;
    }
    
    const request = this.mutex.queue.splice(index, 1)[0];
    request.reject(new Error('Request cancelled'));
    
    this.usage.queueLength = this.mutex.queue.length;
    
    logger.info(`🔴 Cancelled queued request for ${agentId}`);
    
    return true;
  }
  
  /**
   * Reset the manager (alias for emergencyReset)
   */
  reset() {
    this.emergencyReset();
  }
  
  /**
   * Emergency reset (use with caution)
   */
  emergencyReset() {
    logger.warn('🔴 Emergency reset of Claude Max Account Manager');
    
    // Reject all queued requests
    this.mutex.queue.forEach(request => {
      request.reject(new Error('Emergency reset'));
    });
    
    // Clear all state
    this.mutex = {
      locked: false,
      owner: null,
      acquiredAt: null,
      queue: [],
      timeout: this.mutex.timeout
    };
    
    this.usage = {
      totalRequests: 0,
      activeRequest: null,
      queueLength: 0,
      averageWaitTime: 0,
      lastUsed: null
    };
    
    this.emit('emergency:reset', { timestamp: Date.now() });
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ClaudeMaxAccountManager,
  getInstance: (config) => {
    if (!instance) {
      instance = new ClaudeMaxAccountManager(config);
    }
    return instance;
  }
};