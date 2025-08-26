/**
 * Memory Adapter
 * Provides unified access to memory systems without modifying them
 * Part of Sprint 2: Safe Unification
 */

const { EventEmitter } = require('events');
const { logger } = require('../../core/logging/bumba-logger');

class MemoryAdapter extends EventEmitter {
  constructor(memorySystem) {
    super();
    
    // Wrap existing memory system WITHOUT modifying it
    this.wrapped = memorySystem;
    this.adapterVersion = '1.0.0';
    this.enabled = false; // Start disabled for safety
    
    // Unified memory interface (doesn't affect original)
    this.unifiedCache = new Map();
    this.accessLog = [];
    this.contextChain = new Map();
    
    // Metrics for monitoring
    this.metrics = {
      reads: 0,
      writes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      contextHandoffs: 0
    };
    
    logger.info('🧠 MemoryAdapter created (disabled by default)');
  }
  
  /**
   * Enable adapter
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.attachListeners();
    logger.info('🏁 MemoryAdapter enabled');
    this.emit('adapter:enabled');
  }
  
  /**
   * Disable adapter
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.removeAllListeners();
    logger.info('🔌 MemoryAdapter disabled');
    this.emit('adapter:disabled');
  }
  
  /**
   * Attach listeners to wrapped memory system
   */
  attachListeners() {
    if (this.wrapped.on && typeof this.wrapped.on === 'function') {
      this.wrapped.on('memory:stored', (data) => {
        if (this.enabled) {
          this.handleMemoryStored(data);
        }
      });
      
      this.wrapped.on('memory:retrieved', (data) => {
        if (this.enabled) {
          this.handleMemoryRetrieved(data);
        }
      });
    }
  }
  
  /**
   * Store memory with unified tracking
   */
  async store(key, value, options = {}) {
    // Always use original method
    let result;
    if (this.wrapped.store) {
      result = await this.wrapped.store(key, value, options);
    } else if (this.wrapped.set) {
      result = await this.wrapped.set(key, value);
    }
    
    // Add unified tracking if enabled
    if (this.enabled) {
      this.metrics.writes++;
      
      // Cache for unified access
      this.unifiedCache.set(key, {
        value,
        timestamp: Date.now(),
        options
      });
      
      // Log access
      this.accessLog.push({
        type: 'write',
        key,
        timestamp: Date.now()
      });
      
      this.emit('unified:memory:stored', { key, value, options });
    }
    
    return result;
  }
  
  /**
   * Retrieve memory with unified tracking
   */
  async retrieve(key, options = {}) {
    // Check unified cache first if enabled
    if (this.enabled && this.unifiedCache.has(key)) {
      this.metrics.cacheHits++;
      const cached = this.unifiedCache.get(key);
      
      // Verify cache is still valid (5 minute TTL)
      if (Date.now() - cached.timestamp < 300000) {
        this.emit('unified:cache:hit', { key });
        return cached.value;
      }
    }
    
    // Use original method
    let result;
    if (this.wrapped.retrieve) {
      result = await this.wrapped.retrieve(key, options);
    } else if (this.wrapped.get) {
      result = await this.wrapped.get(key);
    }
    
    // Track if enabled
    if (this.enabled) {
      this.metrics.reads++;
      if (!this.unifiedCache.has(key)) {
        this.metrics.cacheMisses++;
      }
      
      // Update cache
      if (result !== undefined) {
        this.unifiedCache.set(key, {
          value: result,
          timestamp: Date.now(),
          options
        });
      }
      
      // Log access
      this.accessLog.push({
        type: 'read',
        key,
        timestamp: Date.now()
      });
      
      this.emit('unified:memory:retrieved', { key, value: result });
    }
    
    return result;
  }
  
  /**
   * Create scoped memory context (for agent handoffs)
   */
  async createScopedContext(agentId, taskId) {
    const contextId = `${agentId}:${taskId}`;
    
    // Use original scoping if available
    if (this.wrapped.createScope) {
      const scope = await this.wrapped.createScope(agentId, taskId);
      
      if (this.enabled) {
        // Track context chain
        this.contextChain.set(contextId, {
          agentId,
          taskId,
          created: Date.now(),
          scope
        });
      }
      
      return scope;
    }
    
    // Fallback: create adapter-level scope
    if (this.enabled) {
      const scope = {
        id: contextId,
        agentId,
        taskId,
        memory: new Map(),
        store: (key, value) => {
          scope.memory.set(key, value);
          return this.store(`${contextId}:${key}`, value);
        },
        retrieve: (key) => {
          if (scope.memory.has(key)) {
            return scope.memory.get(key);
          }
          return this.retrieve(`${contextId}:${key}`);
        }
      };
      
      this.contextChain.set(contextId, {
        agentId,
        taskId,
        created: Date.now(),
        scope
      });
      
      return scope;
    }
    
    return null;
  }
  
  /**
   * Transfer context between agents (unified handoff)
   */
  async transferContext(fromAgentId, toAgentId, taskId) {
    if (!this.enabled) {
      logger.warn('MemoryAdapter disabled - cannot transfer context');
      return null;
    }
    
    const fromContext = `${fromAgentId}:${taskId}`;
    const toContext = `${toAgentId}:${taskId}`;
    
    // Get existing context
    const existing = this.contextChain.get(fromContext);
    if (!existing) {
      logger.warn(`No context found for ${fromContext}`);
      return null;
    }
    
    // Create new context for target agent
    const newContext = await this.createScopedContext(toAgentId, taskId);
    
    // Transfer memory
    if (existing.scope && existing.scope.memory) {
      for (const [key, value] of existing.scope.memory) {
        await newContext.store(key, value);
      }
    }
    
    // Track handoff
    this.metrics.contextHandoffs++;
    this.emit('unified:context:transferred', {
      from: fromAgentId,
      to: toAgentId,
      taskId,
      timestamp: Date.now()
    });
    
    return newContext;
  }
  
  /**
   * Get memory access patterns (for optimization)
   */
  getAccessPatterns() {
    if (!this.enabled) {
      return { enabled: false };
    }
    
    const patterns = {
      totalAccesses: this.accessLog.length,
      recentAccesses: this.accessLog.slice(-100),
      hotKeys: this.analyzeHotKeys(),
      accessFrequency: this.calculateAccessFrequency()
    };
    
    return patterns;
  }
  
  /**
   * Analyze hot keys (frequently accessed)
   */
  analyzeHotKeys() {
    const keyCount = new Map();
    
    this.accessLog.forEach(entry => {
      const count = keyCount.get(entry.key) || 0;
      keyCount.set(entry.key, count + 1);
    });
    
    // Sort by frequency
    const sorted = Array.from(keyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return sorted;
  }
  
  /**
   * Calculate access frequency
   */
  calculateAccessFrequency() {
    if (this.accessLog.length === 0) return 0;
    
    const timeRange = Date.now() - this.accessLog[0].timestamp;
    return this.accessLog.length / (timeRange / 1000 / 60); // accesses per minute
  }
  
  /**
   * Get unified metrics
   */
  getMetrics() {
    return {
      enabled: this.enabled,
      ...this.metrics,
      cacheSize: this.unifiedCache.size,
      contextChains: this.contextChain.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    };
  }
  
  /**
   * Clear unified cache (doesn't affect wrapped memory)
   */
  clearCache() {
    this.unifiedCache.clear();
    logger.info('🧹 MemoryAdapter cache cleared');
  }
  
  /**
   * Rollback adapter
   */
  rollback() {
    this.disable();
    this.clearCache();
    this.accessLog = [];
    this.contextChain.clear();
    this.metrics = {
      reads: 0,
      writes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      contextHandoffs: 0
    };
    
    logger.info('↩️ MemoryAdapter rolled back');
  }
  
  /**
   * Handle memory stored event
   */
  handleMemoryStored(data) {
    // Update unified cache
    if (data.key) {
      this.unifiedCache.set(data.key, {
        value: data.value,
        timestamp: Date.now(),
        options: data.options || {}
      });
    }
  }
  
  /**
   * Handle memory retrieved event
   */
  handleMemoryRetrieved(data) {
    // Log for pattern analysis
    this.accessLog.push({
      type: 'read',
      key: data.key,
      timestamp: Date.now()
    });
  }
  
  /**
   * Health check
   */
  isHealthy() {
    return {
      adapterHealthy: true,
      enabled: this.enabled,
      wrappedHealthy: this.wrapped !== null,
      cacheHealth: this.unifiedCache.size < 10000 // Prevent memory leak
    };
  }
}

module.exports = MemoryAdapter;