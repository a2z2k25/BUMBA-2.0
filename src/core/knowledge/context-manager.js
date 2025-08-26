/**
 * BUMBA Context Management System
 * Advanced context tracking, preservation, and restoration
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getConfig } = require('../config/bumba-config');
const { KnowledgeBase, getInstance: getKnowledgeBase } = require('./knowledge-base');
const fs = require('fs').promises;
const path = require('path');

class ContextManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxContextSize: config.maxContextSize || 10000, // tokens
      maxContextAge: config.maxContextAge || 3600000, // 1 hour
      compressionThreshold: config.compressionThreshold || 5000,
      persistContext: config.persistContext !== false,
      contextPath: config.contextPath || path.join(process.cwd(), '.bumba', 'context'),
      ...this.loadConfigFromEnvironment()
    };
    
    // Active contexts
    this.activeContexts = new Map();
    
    // Context history
    this.contextHistory = [];
    this.maxHistorySize = 100;
    
    // Context templates
    this.templates = new Map();
    
    // Context relationships
    this.contextGraph = new Map();
    
    // Performance metrics
    this.metrics = {
      contextsCreated: 0,
      contextsRestored: 0,
      contextsSaved: 0,
      compressions: 0,
      averageContextSize: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Knowledge base integration
    this.knowledgeBase = null;
    
    this.initialize();
  }
  
  /**
   * Load configuration from environment
   */
  loadConfigFromEnvironment() {
    const config = {};
    
    if (process.env.BUMBA_MAX_CONTEXT_SIZE) {
      config.maxContextSize = parseInt(process.env.BUMBA_MAX_CONTEXT_SIZE);
    }
    
    if (process.env.BUMBA_CONTEXT_PATH) {
      config.contextPath = process.env.BUMBA_CONTEXT_PATH;
    }
    
    if (process.env.BUMBA_PERSIST_CONTEXT) {
      config.persistContext = process.env.BUMBA_PERSIST_CONTEXT === 'true';
    }
    
    return config;
  }
  
  /**
   * Initialize context manager
   */
  async initialize() {
    try {
      // Create context directory
      if (this.config.persistContext) {
        await fs.mkdir(this.config.contextPath, { recursive: true });
      }
      
      // Initialize knowledge base connection
      this.knowledgeBase = getKnowledgeBase();
      
      // Load saved contexts
      await this.loadSavedContexts();
      
      // Setup context cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldContexts();
      }, 60000); // Every minute
      
      logger.info('🧠 Context Manager initialized');
      this.emit('initialized', { contextsLoaded: this.activeContexts.size });
      
    } catch (error) {
      logger.error('Failed to initialize Context Manager:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Create a new context
   */
  async createContext(options = {}) {
    try {
      const contextId = options.id || this.generateContextId();
      
      const context = {
        id: contextId,
        type: options.type || 'general',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        expires: options.expires || new Date(Date.now() + this.config.maxContextAge).toISOString(),
        
        // Core context data
        data: options.data || {},
        metadata: options.metadata || {},
        
        // Context state
        state: {
          active: true,
          compressed: false,
          size: 0,
          version: 1
        },
        
        // Relationships
        parent: options.parent || null,
        children: [],
        related: options.related || [],
        
        // Content sections
        sections: {
          goal: options.goal || '',
          constraints: options.constraints || [],
          assumptions: options.assumptions || [],
          decisions: options.decisions || [],
          questions: options.questions || [],
          discoveries: options.discoveries || []
        },
        
        // Knowledge references
        knowledge: {
          entries: [],
          patterns: [],
          references: []
        },
        
        // Agent/Task association
        agent: options.agent || null,
        task: options.task || null,
        session: options.session || null
      };
      
      // Calculate initial size
      context.state.size = this.calculateContextSize(context);
      
      // Compress if needed
      if (context.state.size > this.config.compressionThreshold) {
        context = await this.compressContext(context);
      }
      
      // Store context
      this.activeContexts.set(contextId, context);
      
      // Add to history
      this.addToHistory(context);
      
      // Update parent-child relationships
      if (context.parent) {
        const parentContext = this.activeContexts.get(context.parent);
        if (parentContext) {
          parentContext.children.push(contextId);
        }
      }
      
      // Save to knowledge base
      await this.saveToKnowledgeBase(context);
      
      // Persist if enabled
      if (this.config.persistContext) {
        await this.persistContext(context);
      }
      
      // Update metrics
      this.metrics.contextsCreated++;
      this.updateAverageSize();
      
      // Emit event
      this.emit('context:created', context);
      
      logger.info(`🧠 Created context: ${contextId}`);
      return context;
      
    } catch (error) {
      logger.error('Failed to create context:', error);
      throw error;
    }
  }
  
  /**
   * Get a context by ID
   */
  getContext(contextId) {
    const context = this.activeContexts.get(contextId);
    
    if (context) {
      this.metrics.cacheHits++;
      context.accessed = new Date().toISOString();
      return context;
    }
    
    this.metrics.cacheMisses++;
    return null;
  }
  
  /**
   * Update a context
   */
  async updateContext(contextId, updates) {
    try {
      const context = this.activeContexts.get(contextId);
      
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }
      
      // Merge updates
      const updatedContext = this.mergeContextUpdates(context, updates);
      
      // Update metadata
      updatedContext.updated = new Date().toISOString();
      updatedContext.state.version++;
      
      // Recalculate size
      updatedContext.state.size = this.calculateContextSize(updatedContext);
      
      // Compress if needed
      if (updatedContext.state.size > this.config.compressionThreshold && !updatedContext.state.compressed) {
        await this.compressContext(updatedContext);
      }
      
      // Store updated context
      this.activeContexts.set(contextId, updatedContext);
      
      // Update knowledge base
      await this.updateInKnowledgeBase(updatedContext);
      
      // Persist if enabled
      if (this.config.persistContext) {
        await this.persistContext(updatedContext);
      }
      
      // Emit event
      this.emit('context:updated', { old: context, new: updatedContext });
      
      logger.info(`📝 Updated context: ${contextId}`);
      return updatedContext;
      
    } catch (error) {
      logger.error(`Failed to update context ${contextId}:`, error);
      throw error;
    }
  }
  
  /**
   * Merge context with another context
   */
  async mergeContexts(contextId1, contextId2, options = {}) {
    try {
      const context1 = this.activeContexts.get(contextId1);
      const context2 = this.activeContexts.get(contextId2);
      
      if (!context1 || !context2) {
        throw new Error('One or both contexts not found');
      }
      
      // Create merged context
      const mergedContext = await this.createContext({
        type: 'merged',
        parent: options.preferParent ? contextId1 : null,
        related: [contextId1, contextId2],
        
        data: {
          ...context1.data,
          ...context2.data,
          ...(options.data || {})
        },
        
        metadata: {
          mergedFrom: [contextId1, contextId2],
          mergedAt: new Date().toISOString(),
          mergeStrategy: options.strategy || 'combine'
        },
        
        goal: options.goal || `${context1.sections.goal} + ${context2.sections.goal}`,
        
        constraints: [
          ...context1.sections.constraints,
          ...context2.sections.constraints
        ],
        
        assumptions: [
          ...context1.sections.assumptions,
          ...context2.sections.assumptions
        ],
        
        decisions: [
          ...context1.sections.decisions,
          ...context2.sections.decisions
        ],
        
        questions: [
          ...context1.sections.questions,
          ...context2.sections.questions
        ],
        
        discoveries: [
          ...context1.sections.discoveries,
          ...context2.sections.discoveries
        ]
      });
      
      // Update relationships
      context1.related.push(mergedContext.id);
      context2.related.push(mergedContext.id);
      
      logger.info(`🔀 Merged contexts ${contextId1} and ${contextId2} into ${mergedContext.id}`);
      return mergedContext;
      
    } catch (error) {
      logger.error('Failed to merge contexts:', error);
      throw error;
    }
  }
  
  /**
   * Fork a context (create a child)
   */
  async forkContext(parentId, changes = {}) {
    try {
      const parentContext = this.activeContexts.get(parentId);
      
      if (!parentContext) {
        throw new Error(`Parent context not found: ${parentId}`);
      }
      
      // Create forked context
      const forkedContext = await this.createContext({
        ...parentContext,
        id: undefined, // Generate new ID
        parent: parentId,
        data: {
          ...parentContext.data,
          ...changes.data
        },
        metadata: {
          ...parentContext.metadata,
          forkedFrom: parentId,
          forkedAt: new Date().toISOString()
        }
      });
      
      logger.info(`🟢 Forked context ${parentId} into ${forkedContext.id}`);
      return forkedContext;
      
    } catch (error) {
      logger.error('Failed to fork context:', error);
      throw error;
    }
  }
  
  /**
   * Compress a context to save space
   */
  async compressContext(context) {
    try {
      // Create compressed version
      const compressed = {
        ...context,
        state: {
          ...context.state,
          compressed: true,
          originalSize: context.state.size
        },
        compressedData: {
          sections: this.compressSections(context.sections),
          data: this.compressData(context.data)
        }
      };
      
      // Remove uncompressed data
      delete compressed.sections;
      delete compressed.data;
      
      // Calculate new size
      compressed.state.size = this.calculateContextSize(compressed);
      
      this.metrics.compressions++;
      
      logger.info(`🗜️ Compressed context ${context.id}: ${context.state.size} -> ${compressed.state.size}`);
      return compressed;
      
    } catch (error) {
      logger.error('Failed to compress context:', error);
      return context;
    }
  }
  
  /**
   * Decompress a context
   */
  async decompressContext(context) {
    if (!context.state.compressed) {
      return context;
    }
    
    try {
      const decompressed = {
        ...context,
        state: {
          ...context.state,
          compressed: false,
          size: context.state.originalSize
        },
        sections: this.decompressSections(context.compressedData.sections),
        data: this.decompressData(context.compressedData.data)
      };
      
      delete decompressed.compressedData;
      
      return decompressed;
      
    } catch (error) {
      logger.error('Failed to decompress context:', error);
      return context;
    }
  }
  
  /**
   * Save context to knowledge base
   */
  async saveToKnowledgeBase(context) {
    if (!this.knowledgeBase) return;
    
    try {
      await this.knowledgeBase.add({
        id: `context_${context.id}`,
        title: `Context: ${context.type}`,
        content: JSON.stringify(context),
        category: 'context',
        type: 'context',
        tags: ['context', context.type, context.agent].filter(Boolean),
        author: context.agent || 'system',
        metadata: {
          contextId: context.id,
          contextType: context.type,
          size: context.state.size
        }
      });
      
    } catch (error) {
      logger.error('Failed to save context to knowledge base:', error);
    }
  }
  
  /**
   * Update context in knowledge base
   */
  async updateInKnowledgeBase(context) {
    if (!this.knowledgeBase) return;
    
    try {
      await this.knowledgeBase.update(`context_${context.id}`, {
        content: JSON.stringify(context),
        updated: new Date().toISOString(),
        metadata: {
          contextId: context.id,
          contextType: context.type,
          size: context.state.size,
          version: context.state.version
        }
      });
      
    } catch (error) {
      // If update fails, try to add
      await this.saveToKnowledgeBase(context);
    }
  }
  
  /**
   * Persist context to disk
   */
  async persistContext(context) {
    try {
      const filename = `${context.id}.json`;
      const filepath = path.join(this.config.contextPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(context, null, 2));
      
      this.metrics.contextsSaved++;
      
    } catch (error) {
      logger.error(`Failed to persist context ${context.id}:`, error);
    }
  }
  
  /**
   * Load saved contexts from disk
   */
  async loadSavedContexts() {
    if (!this.config.persistContext) return;
    
    try {
      const files = await fs.readdir(this.config.contextPath);
      const contextFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of contextFiles) {
        try {
          const filepath = path.join(this.config.contextPath, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const context = JSON.parse(content);
          
          // Check if context is still valid
          if (new Date(context.expires) > new Date()) {
            this.activeContexts.set(context.id, context);
            this.metrics.contextsRestored++;
          }
          
        } catch (error) {
          logger.warn(`Failed to load context file ${file}:`, error);
        }
      }
      
      logger.info(`🔄 Restored ${this.metrics.contextsRestored} contexts from disk`);
      
    } catch (error) {
      logger.warn('Failed to load saved contexts:', error);
    }
  }
  
  /**
   * Clean up old contexts
   */
  cleanupOldContexts() {
    const now = new Date();
    const toDelete = [];
    
    this.activeContexts.forEach((context, id) => {
      if (new Date(context.expires) < now) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => {
      this.activeContexts.delete(id);
      this.emit('context:expired', { id });
    });
    
    if (toDelete.length > 0) {
      logger.info(`🧹 Cleaned up ${toDelete.length} expired contexts`);
    }
  }
  
  /**
   * Add context to history
   */
  addToHistory(context) {
    this.contextHistory.unshift({
      id: context.id,
      type: context.type,
      created: context.created,
      agent: context.agent
    });
    
    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory.pop();
    }
  }
  
  /**
   * Get context history
   */
  getHistory(limit = 10) {
    return this.contextHistory.slice(0, limit);
  }
  
  /**
   * Generate unique context ID
   */
  generateContextId() {
    return `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Calculate context size (approximate tokens)
   */
  calculateContextSize(context) {
    const json = JSON.stringify(context);
    return Math.ceil(json.length / 4); // Rough token estimate
  }
  
  /**
   * Merge context updates
   */
  mergeContextUpdates(context, updates) {
    const merged = { ...context };
    
    // Merge data
    if (updates.data) {
      merged.data = { ...context.data, ...updates.data };
    }
    
    // Merge metadata
    if (updates.metadata) {
      merged.metadata = { ...context.metadata, ...updates.metadata };
    }
    
    // Merge sections
    if (updates.sections) {
      Object.keys(updates.sections).forEach(key => {
        if (Array.isArray(merged.sections[key])) {
          merged.sections[key].push(...(updates.sections[key] || []));
        } else {
          merged.sections[key] = updates.sections[key];
        }
      });
    }
    
    // Update relationships
    if (updates.related) {
      merged.related = [...new Set([...merged.related, ...updates.related])];
    }
    
    return merged;
  }
  
  /**
   * Compress sections (simple implementation)
   */
  compressSections(sections) {
    // In a real implementation, this would use actual compression
    return JSON.stringify(sections);
  }
  
  /**
   * Decompress sections
   */
  decompressSections(compressed) {
    return JSON.parse(compressed);
  }
  
  /**
   * Compress data
   */
  compressData(data) {
    return JSON.stringify(data);
  }
  
  /**
   * Decompress data
   */
  decompressData(compressed) {
    return JSON.parse(compressed);
  }
  
  /**
   * Update average context size metric
   */
  updateAverageSize() {
    const sizes = Array.from(this.activeContexts.values()).map(c => c.state.size);
    this.metrics.averageContextSize = sizes.length > 0
      ? Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length)
      : 0;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeContexts: this.activeContexts.size,
      historySize: this.contextHistory.length
    };
  }
  
  /**
   * Destroy the context manager
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.removeAllListeners();
    this.activeContexts.clear();
    this.contextHistory = [];
    
    logger.info('💥 Context Manager destroyed');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ContextManager,
  getInstance: (config) => {
    if (!instance) {
      instance = new ContextManager(config);
    }
    return instance;
  }
};