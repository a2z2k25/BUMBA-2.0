/**
 * Context Broker
 * Manages context preservation and handoffs without modifying memory systems
 * Part of Sprint 4: Safe Unification
 * 
 * IMPORTANT: This broker READS from existing memory
 * It does NOT modify any existing memory systems
 */

const { EventEmitter } = require('events');
const { logger } = require('../../core/logging/bumba-logger');

class ContextBroker extends EventEmitter {
  constructor() {
    super();
    
    // Core properties
    this.enabled = false; // Start disabled for safety
    this.brokerVersion = '1.0.0';
    
    // Memory system references (no modifications)
    this.memorySystems = new Map();
    this.primaryMemory = null;
    
    // Context management
    this.contexts = new Map();
    this.contextChains = new Map();
    this.activeContexts = new Set();
    this.contextSnapshots = new Map();
    
    // Handoff tracking
    this.handoffs = [];
    this.handoffRules = new Map();
    this.pendingHandoffs = new Map();
    
    // Enhancement features (optional, non-invasive)
    this.enrichments = new Map();
    this.compressionEnabled = false;
    this.encryptionEnabled = false;
    
    // Metrics
    this.metrics = {
      contextsCreated: 0,
      contextsPreserved: 0,
      handoffsCompleted: 0,
      handoffsFailed: 0,
      enrichmentsApplied: 0,
      snapshotsTaken: 0
    };
    
    logger.info('🧠 ContextBroker created (disabled by default)');
  }
  
  /**
   * Enable the broker
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.startContextMonitoring();
    
    logger.info('🏁 ContextBroker enabled');
    this.emit('broker:enabled');
  }
  
  /**
   * Disable the broker
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.stopContextMonitoring();
    
    logger.info('🔌 ContextBroker disabled');
    this.emit('broker:disabled');
  }
  
  /**
   * Register memory system (read-only access)
   */
  registerMemorySystem(name, memorySystem, options = {}) {
    if (!memorySystem) {
      logger.warn(`Cannot register null memory system: ${name}`);
      return false;
    }
    
    // Store reference without modification
    this.memorySystems.set(name, {
      system: memorySystem,
      registered: Date.now(),
      readCount: 0,
      options
    });
    
    // Set as primary if specified
    if (options.primary || !this.primaryMemory) {
      this.primaryMemory = name;
    }
    
    logger.info(`🔗 Registered memory system: ${name}${options.primary ? ' (primary)' : ''}`);
    return true;
  }
  
  /**
   * Create context for agent/task
   */
  async createContext(agentId, taskId, initialData = {}) {
    if (!this.enabled) {
      logger.warn('ContextBroker disabled - cannot create context');
      return null;
    }
    
    const contextId = `${agentId}:${taskId}:${Date.now()}`;
    
    const context = {
      id: contextId,
      agentId,
      taskId,
      created: Date.now(),
      lastAccessed: Date.now(),
      data: { ...initialData },
      metadata: {
        accessCount: 0,
        modificationCount: 0,
        handoffCount: 0
      },
      chain: []
    };
    
    this.contexts.set(contextId, context);
    this.activeContexts.add(contextId);
    this.metrics.contextsCreated++;
    
    // Take initial snapshot
    this.takeSnapshot(contextId);
    
    logger.info(`📝 Created context: ${contextId}`);
    this.emit('context:created', context);
    
    return context;
  }
  
  /**
   * Read from memory system (non-invasive)
   */
  async readFromMemory(systemName, key) {
    const memSystem = this.memorySystems.get(systemName || this.primaryMemory);
    if (!memSystem) {
      logger.warn(`Memory system not found: ${systemName}`);
      return null;
    }
    
    try {
      let value = null;
      
      // Try different read methods based on system interface
      if (memSystem.system.retrieve) {
        value = await memSystem.system.retrieve(key);
      } else if (memSystem.system.get) {
        value = await memSystem.system.get(key);
      } else if (memSystem.system.read) {
        value = await memSystem.system.read(key);
      }
      
      memSystem.readCount++;
      return value;
    } catch (error) {
      logger.error(`Error reading from memory: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get or create context (read from memory if exists)
   */
  async getContext(agentId, taskId) {
    // Check local contexts first
    const existingContext = this.findContext(agentId, taskId);
    if (existingContext) {
      existingContext.lastAccessed = Date.now();
      existingContext.metadata.accessCount++;
      return existingContext;
    }
    
    // Try to read from memory systems
    if (this.enabled && this.primaryMemory) {
      const memoryKey = `context:${agentId}:${taskId}`;
      const memoryData = await this.readFromMemory(this.primaryMemory, memoryKey);
      
      if (memoryData) {
        // Create local context from memory data
        const context = await this.createContext(agentId, taskId, memoryData);
        this.metrics.contextsPreserved++;
        return context;
      }
    }
    
    // Create new if not found
    return await this.createContext(agentId, taskId);
  }
  
  /**
   * Find existing context
   */
  findContext(agentId, taskId) {
    for (const [id, context] of this.contexts) {
      if (context.agentId === agentId && context.taskId === taskId) {
        return context;
      }
    }
    return null;
  }
  
  /**
   * Update context data (local only, doesn't modify memory)
   */
  updateContext(contextId, updates) {
    const context = this.contexts.get(contextId);
    if (!context) {
      logger.warn(`Context not found: ${contextId}`);
      return false;
    }
    
    // Merge updates
    context.data = { ...context.data, ...updates };
    context.lastAccessed = Date.now();
    context.metadata.modificationCount++;
    
    // Take snapshot after significant changes
    if (context.metadata.modificationCount % 5 === 0) {
      this.takeSnapshot(contextId);
    }
    
    this.emit('context:updated', { contextId, updates });
    return true;
  }
  
  /**
   * Transfer context between agents
   */
  async transferContext(fromAgentId, toAgentId, taskId, options = {}) {
    if (!this.enabled) {
      logger.warn('ContextBroker disabled - cannot transfer context');
      return null;
    }
    
    // Get source context
    const sourceContext = await this.getContext(fromAgentId, taskId);
    if (!sourceContext) {
      logger.warn(`Source context not found: ${fromAgentId}:${taskId}`);
      this.metrics.handoffsFailed++;
      return null;
    }
    
    // Create destination context with source data
    const destContext = await this.createContext(toAgentId, taskId, sourceContext.data);
    
    // Link contexts in chain
    destContext.chain = [...sourceContext.chain, sourceContext.id];
    sourceContext.metadata.handoffCount++;
    
    // Apply handoff rules
    if (options.rules) {
      this.applyHandoffRules(destContext, options.rules);
    }
    
    // Apply enrichments if enabled
    if (options.enrich && this.enrichments.size > 0) {
      await this.enrichContext(destContext);
    }
    
    // Record handoff
    const handoff = {
      id: `handoff-${Date.now()}`,
      from: fromAgentId,
      to: toAgentId,
      taskId,
      timestamp: Date.now(),
      sourceContextId: sourceContext.id,
      destContextId: destContext.id,
      options
    };
    
    this.handoffs.push(handoff);
    this.metrics.handoffsCompleted++;
    
    logger.info(`🤝 Context transferred: ${fromAgentId} → ${toAgentId} (${taskId})`);
    this.emit('context:transferred', handoff);
    
    return destContext;
  }
  
  /**
   * Apply handoff rules (filtering, transformation)
   */
  applyHandoffRules(context, rules) {
    if (!rules || !Array.isArray(rules)) return;
    
    for (const rule of rules) {
      switch (rule.type) {
        case 'filter':
          // Remove specified keys
          if (rule.exclude) {
            for (const key of rule.exclude) {
              delete context.data[key];
            }
          }
          break;
          
        case 'transform':
          // Apply transformation function
          if (rule.transform && typeof rule.transform === 'function') {
            context.data = rule.transform(context.data);
          }
          break;
          
        case 'retain':
          // Keep only specified keys
          if (rule.include) {
            const filtered = {};
            for (const key of rule.include) {
              if (context.data[key] !== undefined) {
                filtered[key] = context.data[key];
              }
            }
            context.data = filtered;
          }
          break;
      }
    }
  }
  
  /**
   * Enrich context with additional data
   */
  async enrichContext(context) {
    for (const [name, enricher] of this.enrichments) {
      try {
        if (enricher.condition && !enricher.condition(context)) {
          continue;
        }
        
        const enrichment = await enricher.enrich(context);
        if (enrichment) {
          context.data[`enriched_${name}`] = enrichment;
          this.metrics.enrichmentsApplied++;
        }
      } catch (error) {
        logger.error(`Enrichment error (${name}): ${error.message}`);
      }
    }
  }
  
  /**
   * Add context enricher
   */
  addEnricher(name, enricher) {
    if (!enricher.enrich || typeof enricher.enrich !== 'function') {
      logger.warn(`Invalid enricher: ${name}`);
      return false;
    }
    
    this.enrichments.set(name, enricher);
    logger.info(`🔴 Added context enricher: ${name}`);
    return true;
  }
  
  /**
   * Take snapshot of context
   */
  takeSnapshot(contextId) {
    const context = this.contexts.get(contextId);
    if (!context) return;
    
    const snapshot = {
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(context.data)), // Deep clone
      metadata: { ...context.metadata }
    };
    
    if (!this.contextSnapshots.has(contextId)) {
      this.contextSnapshots.set(contextId, []);
    }
    
    const snapshots = this.contextSnapshots.get(contextId);
    snapshots.push(snapshot);
    
    // Keep only last 10 snapshots
    if (snapshots.length > 10) {
      snapshots.shift();
    }
    
    this.metrics.snapshotsTaken++;
  }
  
  /**
   * Restore context from snapshot
   */
  restoreSnapshot(contextId, snapshotIndex = -1) {
    const snapshots = this.contextSnapshots.get(contextId);
    if (!snapshots || snapshots.length === 0) {
      logger.warn(`No snapshots found for context: ${contextId}`);
      return false;
    }
    
    const context = this.contexts.get(contextId);
    if (!context) {
      logger.warn(`Context not found: ${contextId}`);
      return false;
    }
    
    // Get snapshot (default to most recent)
    const snapshot = snapshotIndex < 0 
      ? snapshots[snapshots.length - 1]
      : snapshots[snapshotIndex];
    
    if (!snapshot) {
      logger.warn(`Snapshot not found at index: ${snapshotIndex}`);
      return false;
    }
    
    // Restore data
    context.data = JSON.parse(JSON.stringify(snapshot.data));
    context.lastAccessed = Date.now();
    
    logger.info(`↩️ Restored context from snapshot: ${contextId}`);
    this.emit('context:restored', { contextId, snapshot });
    
    return true;
  }
  
  /**
   * Get context chain (history of handoffs)
   */
  getContextChain(contextId) {
    const context = this.contexts.get(contextId);
    if (!context) return [];
    
    const chain = [context];
    
    // Traverse chain backwards
    for (const parentId of context.chain) {
      const parent = this.contexts.get(parentId);
      if (parent) {
        chain.unshift(parent);
      }
    }
    
    return chain;
  }
  
  /**
   * Compress context data (optional feature)
   */
  compressContext(context) {
    if (!this.compressionEnabled) return context;
    
    // Simple compression: remove null/undefined values
    const compressed = {};
    for (const [key, value] of Object.entries(context.data)) {
      if (value !== null && value !== undefined) {
        compressed[key] = value;
      }
    }
    
    context.data = compressed;
    context.metadata.compressed = true;
    
    return context;
  }
  
  /**
   * Start monitoring contexts
   */
  startContextMonitoring() {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.cleanupInactiveContexts();
      this.checkPendingHandoffs();
    }, 30000); // Every 30 seconds
    
    logger.info('👁️ Context monitoring started');
  }
  
  /**
   * Stop monitoring contexts
   */
  stopContextMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('⏹️ Context monitoring stopped');
    }
  }
  
  /**
   * Cleanup inactive contexts
   */
  cleanupInactiveContexts() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [id, context] of this.contexts) {
      if (now - context.lastAccessed > maxAge && !this.activeContexts.has(id)) {
        this.contexts.delete(id);
        this.contextSnapshots.delete(id);
        logger.debug(`🧹 Cleaned up inactive context: ${id}`);
      }
    }
  }
  
  /**
   * Check pending handoffs
   */
  checkPendingHandoffs() {
    for (const [id, handoff] of this.pendingHandoffs) {
      if (Date.now() - handoff.created > 60000) { // 1 minute timeout
        this.pendingHandoffs.delete(id);
        this.metrics.handoffsFailed++;
        logger.warn(`⏱️ Handoff timeout: ${id}`);
      }
    }
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      enabled: this.enabled,
      ...this.metrics,
      activeContexts: this.activeContexts.size,
      totalContexts: this.contexts.size,
      memorySystems: this.memorySystems.size,
      enrichers: this.enrichments.size,
      snapshots: this.contextSnapshots.size
    };
  }
  
  /**
   * Get memory system status
   */
  getMemoryStatus(systemName) {
    const system = this.memorySystems.get(systemName);
    if (!system) return null;
    
    return {
      name: systemName,
      primary: systemName === this.primaryMemory,
      registered: system.registered,
      readCount: system.readCount,
      options: system.options
    };
  }
  
  /**
   * Clear all contexts
   */
  clearContexts() {
    const cleared = this.contexts.size;
    this.contexts.clear();
    this.activeContexts.clear();
    this.contextSnapshots.clear();
    this.handoffs = [];
    
    logger.info(`🧹 Cleared ${cleared} contexts`);
    return cleared;
  }
  
  /**
   * Rollback broker completely
   */
  rollback() {
    // Disable first
    this.disable();
    
    // Clear all data
    this.memorySystems.clear();
    this.contexts.clear();
    this.contextChains.clear();
    this.activeContexts.clear();
    this.contextSnapshots.clear();
    this.handoffs = [];
    this.handoffRules.clear();
    this.pendingHandoffs.clear();
    this.enrichments.clear();
    
    // Reset metrics
    this.metrics = {
      contextsCreated: 0,
      contextsPreserved: 0,
      handoffsCompleted: 0,
      handoffsFailed: 0,
      enrichmentsApplied: 0,
      snapshotsTaken: 0
    };
    
    logger.info('↩️ ContextBroker rolled back completely');
  }
  
  /**
   * Health check
   */
  isHealthy() {
    return {
      brokerHealthy: true,
      enabled: this.enabled,
      monitoringActive: this.monitoringInterval !== null,
      contextHealth: this.contexts.size < 10000, // Prevent memory leak
      memorySystems: this.memorySystems.size,
      primaryMemory: this.primaryMemory !== null
    };
  }
}

module.exports = ContextBroker;