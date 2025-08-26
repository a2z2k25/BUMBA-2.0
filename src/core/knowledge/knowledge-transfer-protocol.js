/**
 * BUMBA Knowledge Transfer Protocol
 * Enables seamless knowledge transfer between agents and sessions
 * Preserves context, learnings, and decisions across agent lifecycles
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');
const fs = require('fs').promises;
const path = require('path');

/**
 * Knowledge Types
 */
const KnowledgeType = {
  CONTEXT: 'context',
  DECISION: 'decision',
  LEARNING: 'learning',
  PATTERN: 'pattern',
  ERROR: 'error',
  SOLUTION: 'solution',
  OPTIMIZATION: 'optimization',
  RELATIONSHIP: 'relationship'
};

/**
 * Transfer Methods
 */
const TransferMethod = {
  DIRECT: 'direct', // Direct agent-to-agent
  PERSISTENT: 'persistent', // Through persistent storage
  BROADCAST: 'broadcast', // To all agents
  SELECTIVE: 'selective', // To specific agents
  HIERARCHICAL: 'hierarchical' // Through management chain
};

/**
 * Knowledge Transfer Protocol
 */
class KnowledgeTransferProtocol extends EventEmitter {
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
    
    this.config = {
      persistenceEnabled: config.persistenceEnabled !== false,
      persistencePath: config.persistencePath || './knowledge',
      compressionEnabled: config.compressionEnabled !== false,
      encryptionEnabled: config.encryptionEnabled || false,
      maxKnowledgeAge: config.maxKnowledgeAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      maxKnowledgeSize: config.maxKnowledgeSize || 10 * 1024 * 1024, // 10MB
      deduplicationEnabled: config.deduplicationEnabled !== false,
      ...config
    };
    
    // Knowledge storage
    this.knowledgeBase = new Map();
    this.agentKnowledge = new Map();
    this.transferHistory = [];
    
    // Knowledge graph for relationships
    this.knowledgeGraph = {
      nodes: new Map(),
      edges: []
    };
    
    // Transfer channels
    this.transferChannels = new Map();
    
    // Statistics
    this.stats = {
      totalTransfers: 0,
      successfulTransfers: 0,
      failedTransfers: 0,
      totalKnowledgeItems: 0,
      totalKnowledgeSize: 0,
      compressionRatio: 0,
      deduplicationRatio: 0
    };
    
    // Initialize persistence
    if (this.config.persistenceEnabled) {
      this.initializePersistence();
    }
    
    // Register knowledge transfer hooks
    this.registerKnowledgeHooks();
  }
  
  /**
   * Register knowledge transfer hooks
   */
  registerKnowledgeHooks() {
    // Register beforeKnowledgeTransfer hook
    this.hooks.register('knowledge:beforeTransfer', async (ctx) => ({ success: true }), {
      category: 'learning',
      priority: 50,
      description: 'Execute before knowledge transfer',
      schema: {
        fromAgent: 'string',
        toAgent: 'string',
        knowledge: 'object',
        method: 'string'
      }
    });
    
    // Register filterKnowledge hook
    this.hooks.register('knowledge:filter', async (ctx) => ({ success: true }), {
      category: 'learning',
      priority: 75,
      description: 'Filter knowledge before transfer',
      schema: {
        knowledge: 'object',
        filters: 'array',
        agent: 'string'
      }
    });
    
    // Register transformKnowledge hook
    this.hooks.register('knowledge:transform', async (ctx) => ({ success: true }), {
      category: 'learning',
      priority: 75,
      description: 'Transform knowledge during transfer',
      schema: {
        knowledge: 'object',
        transformations: 'array',
        targetAgent: 'string'
      }
    });
    
    // Register validateTransfer hook
    this.hooks.register('knowledge:validateTransfer', async (ctx) => ({ success: true }), {
      category: 'learning',
      priority: 100,
      description: 'Validate knowledge transfer',
      schema: {
        fromAgent: 'string',
        toAgent: 'string',
        knowledge: 'object',
        valid: 'boolean',
        errors: 'array'
      }
    });
    
    // Register afterKnowledgeTransfer hook
    this.hooks.register('knowledge:afterTransfer', async (ctx) => ({ success: true }), {
      category: 'learning',
      priority: 50,
      description: 'Execute after knowledge transfer',
      schema: {
        fromAgent: 'string',
        toAgent: 'string',
        transferredItems: 'number',
        success: 'boolean'
      }
    });
    
    logger.info('🏁 Knowledge transfer hooks registered');
  }
  
  /**
   * Initialize persistence
   */
  async initializePersistence() {
    try {
      await fs.mkdir(this.config.persistencePath, { recursive: true });
      await this.loadPersistedKnowledge();
      logger.info('🏁 Knowledge persistence initialized');
    } catch (error) {
      logger.error(`🔴 Failed to initialize persistence: ${error.message}`);
    }
  }
  
  /**
   * Create knowledge item
   */
  createKnowledge(data) {
    const knowledge = {
      id: this.generateKnowledgeId(),
      type: data.type || KnowledgeType.CONTEXT,
      content: data.content,
      metadata: {
        source: data.source,
        timestamp: Date.now(),
        confidence: data.confidence || 1.0,
        relevance: data.relevance || 1.0,
        tags: data.tags || [],
        ...data.metadata
      },
      relationships: data.relationships || [],
      version: 1,
      hash: this.hashContent(data.content)
    };
    
    return knowledge;
  }
  
  /**
   * Store knowledge from agent
   */
  async storeKnowledge(agentId, knowledgeData) {
    const knowledge = this.createKnowledge({
      ...knowledgeData,
      source: agentId
    });
    
    logger.info(`🟢 Storing knowledge ${knowledge.id} from agent ${agentId}`);
    
    // Check for duplicates
    if (this.config.deduplicationEnabled) {
      const duplicate = this.findDuplicate(knowledge);
      if (duplicate) {
        logger.info(`🟢 Duplicate knowledge detected, updating existing: ${duplicate.id}`);
        this.updateKnowledge(duplicate.id, knowledge);
        return duplicate.id;
      }
    }
    
    // Check size limits
    const size = JSON.stringify(knowledge).length;
    if (size > this.config.maxKnowledgeSize) {
      throw new Error(`Knowledge exceeds size limit: ${size} > ${this.config.maxKnowledgeSize}`);
    }
    
    // Store in knowledge base
    this.knowledgeBase.set(knowledge.id, knowledge);
    
    // Track by agent
    if (!this.agentKnowledge.has(agentId)) {
      this.agentKnowledge.set(agentId, new Set());
    }
    this.agentKnowledge.get(agentId).add(knowledge.id);
    
    // Add to knowledge graph
    this.addToKnowledgeGraph(knowledge);
    
    // Persist if enabled
    if (this.config.persistenceEnabled) {
      await this.persistKnowledge(knowledge);
    }
    
    // Update statistics
    this.stats.totalKnowledgeItems++;
    this.stats.totalKnowledgeSize += size;
    
    // Emit storage event
    this.emit('knowledge:stored', {
      knowledgeId: knowledge.id,
      agentId,
      type: knowledge.type,
      size
    });
    
    return knowledge.id;
  }
  
  /**
   * Transfer knowledge between agents
   */
  async transferKnowledge(fromAgentId, toAgentId, options = {}) {
    // Execute beforeTransfer hook
    const beforeContext = await this.hooks.execute('knowledge:beforeTransfer', {
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      knowledge: null,
      method: options.method || TransferMethod.DIRECT
    });
    
    // Check if transfer should be prevented
    if (beforeContext.preventDefault) {
      logger.warn(`🔴 Knowledge transfer prevented: ${beforeContext.reason}`);
      return { success: false, reason: beforeContext.reason };
    }
    
    const transfer = {
      id: this.generateTransferId(),
      from: fromAgentId,
      to: toAgentId,
      method: options.method || TransferMethod.DIRECT,
      filter: options.filter || {},
      timestamp: Date.now(),
      items: []
    };
    
    logger.info(`🟢 Transferring knowledge from ${fromAgentId} to ${toAgentId}`);
    
    try {
      // Get source knowledge
      let sourceKnowledge = this.getAgentKnowledge(fromAgentId, transfer.filter);
      
      // Execute filter hook
      const filterContext = await this.hooks.execute('knowledge:filter', {
        knowledge: sourceKnowledge,
        filters: options.filters || [],
        agent: toAgentId
      });
      
      if (filterContext.knowledge) {
        sourceKnowledge = filterContext.knowledge;
      }
      
      // Execute transform hook
      const transformContext = await this.hooks.execute('knowledge:transform', {
        knowledge: sourceKnowledge,
        transformations: options.transformations || [],
        targetAgent: toAgentId
      });
      
      if (transformContext.knowledge) {
        sourceKnowledge = transformContext.knowledge;
      }
      
      // Execute validation hook
      const validationContext = await this.hooks.execute('knowledge:validateTransfer', {
        fromAgent: fromAgentId,
        toAgent: toAgentId,
        knowledge: sourceKnowledge,
        valid: true,
        errors: []
      });
      
      if (!validationContext.valid) {
        throw new Error(`Transfer validation failed: ${validationContext.errors.join(', ')}`);
      }
      
      if (sourceKnowledge.length === 0) {
        logger.warn(`🟡 No knowledge to transfer from ${fromAgentId}`);
        return transfer;
      }
      
      // Prepare knowledge for transfer
      const preparedKnowledge = await this.prepareForTransfer(sourceKnowledge, options);
      
      // Execute transfer based on method
      switch (transfer.method) {
        case TransferMethod.DIRECT:
          await this.directTransfer(preparedKnowledge, toAgentId);
          break;
          
        case TransferMethod.BROADCAST:
          await this.broadcastTransfer(preparedKnowledge, fromAgentId);
          break;
          
        case TransferMethod.SELECTIVE:
          await this.selectiveTransfer(preparedKnowledge, options.targets || [toAgentId]);
          break;
          
        case TransferMethod.HIERARCHICAL:
          await this.hierarchicalTransfer(preparedKnowledge, toAgentId);
          break;
          
        case TransferMethod.PERSISTENT:
          await this.persistentTransfer(preparedKnowledge, toAgentId);
          break;
      }
      
      // Record transfer
      transfer.items = preparedKnowledge.map(k => k.id);
      transfer.success = true;
      transfer.endTime = Date.now();
      transfer.duration = transfer.endTime - transfer.timestamp;
      
      this.transferHistory.push(transfer);
      this.stats.totalTransfers++;
      this.stats.successfulTransfers++;
      
      // Emit transfer event
      this.emit('knowledge:transferred', transfer);
      
      logger.info(`🏁 Knowledge transfer complete: ${transfer.items.length} items`);
      
      return transfer;
      
    } catch (error) {
      logger.error(`🔴 Knowledge transfer failed: ${error.message}`);
      
      transfer.success = false;
      transfer.error = error.message;
      
      this.transferHistory.push(transfer);
      this.stats.totalTransfers++;
      this.stats.failedTransfers++;
      
      throw error;
    }
  }
  
  /**
   * Get agent knowledge
   */
  getAgentKnowledge(agentId, filter = {}) {
    const knowledgeIds = this.agentKnowledge.get(agentId);
    
    if (!knowledgeIds) {
      return [];
    }
    
    const knowledge = [];
    
    for (const id of knowledgeIds) {
      const item = this.knowledgeBase.get(id);
      
      if (item && this.matchesFilter(item, filter)) {
        knowledge.push(item);
      }
    }
    
    return knowledge;
  }
  
  /**
   * Match knowledge against filter
   */
  matchesFilter(knowledge, filter) {
    // Type filter
    if (filter.type && knowledge.type !== filter.type) {
      return false;
    }
    
    // Age filter
    if (filter.maxAge) {
      const age = Date.now() - knowledge.metadata.timestamp;
      if (age > filter.maxAge) {
        return false;
      }
    }
    
    // Confidence filter
    if (filter.minConfidence && knowledge.metadata.confidence < filter.minConfidence) {
      return false;
    }
    
    // Tag filter
    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some(tag => 
        knowledge.metadata.tags.includes(tag)
      );
      if (!hasTag) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Prepare knowledge for transfer
   */
  async prepareForTransfer(knowledge, options) {
    let prepared = [...knowledge];
    
    // Sort by relevance and recency
    prepared.sort((a, b) => {
      const scoreA = a.metadata.relevance * (1 / (Date.now() - a.metadata.timestamp));
      const scoreB = b.metadata.relevance * (1 / (Date.now() - b.metadata.timestamp));
      return scoreB - scoreA;
    });
    
    // Limit if specified
    if (options.limit) {
      prepared = prepared.slice(0, options.limit);
    }
    
    // Compress if enabled
    if (this.config.compressionEnabled) {
      prepared = await this.compressKnowledge(prepared);
    }
    
    // Encrypt if enabled
    if (this.config.encryptionEnabled) {
      prepared = await this.encryptKnowledge(prepared);
    }
    
    return prepared;
  }
  
  /**
   * Direct transfer to specific agent
   */
  async directTransfer(knowledge, toAgentId) {
    // Associate knowledge with target agent
    if (!this.agentKnowledge.has(toAgentId)) {
      this.agentKnowledge.set(toAgentId, new Set());
    }
    
    const targetKnowledge = this.agentKnowledge.get(toAgentId);
    
    for (const item of knowledge) {
      targetKnowledge.add(item.id);
      
      // Create relationship
      this.createRelationship(item.id, toAgentId, 'transferred_to');
    }
  }
  
  /**
   * Broadcast transfer to all agents
   */
  async broadcastTransfer(knowledge, excludeAgentId) {
    const agents = Array.from(this.agentKnowledge.keys())
      .filter(id => id !== excludeAgentId);
    
    for (const agentId of agents) {
      await this.directTransfer(knowledge, agentId);
    }
  }
  
  /**
   * Selective transfer to specific agents
   */
  async selectiveTransfer(knowledge, targetAgents) {
    for (const agentId of targetAgents) {
      await this.directTransfer(knowledge, agentId);
    }
  }
  
  /**
   * Hierarchical transfer through management chain
   */
  async hierarchicalTransfer(knowledge, toAgentId) {
    // This would integrate with the actual agent hierarchy
    // For now, do direct transfer
    await this.directTransfer(knowledge, toAgentId);
  }
  
  /**
   * Persistent transfer through storage
   */
  async persistentTransfer(knowledge, toAgentId) {
    // Store in persistent location for later retrieval
    const transferFile = path.join(
      this.config.persistencePath,
      'transfers',
      `${toAgentId}-${Date.now()}.json`
    );
    
    await fs.mkdir(path.dirname(transferFile), { recursive: true });
    await fs.writeFile(transferFile, JSON.stringify(knowledge, null, 2));
    
    // Notify target agent
    this.emit('knowledge:available', {
      agentId: toAgentId,
      location: transferFile,
      items: knowledge.length
    });
  }
  
  /**
   * Compress knowledge
   */
  async compressKnowledge(knowledge) {
    // Simple compression by removing redundant data
    const compressed = knowledge.map(item => ({
      ...item,
      content: this.compressContent(item.content),
      metadata: this.compressMetadata(item.metadata)
    }));
    
    const originalSize = JSON.stringify(knowledge).length;
    const compressedSize = JSON.stringify(compressed).length;
    
    this.stats.compressionRatio = compressedSize / originalSize;
    
    return compressed;
  }
  
  /**
   * Compress content
   */
  compressContent(content) {
    if (typeof content === 'string' && content.length > 1000) {
      // Truncate long strings (in reality, would use proper compression)
      return {
        truncated: true,
        preview: content.substring(0, 500),
        hash: this.hashContent(content)
      };
    }
    return content;
  }
  
  /**
   * Compress metadata
   */
  compressMetadata(metadata) {
    // Remove low-value metadata
    const compressed = { ...metadata };
    
    // Remove empty arrays
    Object.keys(compressed).forEach(key => {
      if (Array.isArray(compressed[key]) && compressed[key].length === 0) {
        delete compressed[key];
      }
    });
    
    return compressed;
  }
  
  /**
   * Encrypt knowledge
   */
  async encryptKnowledge(knowledge) {
    // Placeholder for encryption (would use actual encryption library)
    return knowledge.map(item => ({
      ...item,
      encrypted: true,
      content: Buffer.from(JSON.stringify(item.content)).toString('base64')
    }));
  }
  
  /**
   * Add to knowledge graph
   */
  addToKnowledgeGraph(knowledge) {
    // Add node
    this.knowledgeGraph.nodes.set(knowledge.id, {
      id: knowledge.id,
      type: knowledge.type,
      metadata: knowledge.metadata
    });
    
    // Add edges for relationships
    if (knowledge.relationships) {
      knowledge.relationships.forEach(rel => {
        this.knowledgeGraph.edges.push({
          from: knowledge.id,
          to: rel.target,
          type: rel.type,
          weight: rel.weight || 1.0
        });
      });
    }
  }
  
  /**
   * Create relationship
   */
  createRelationship(knowledgeId, target, type) {
    this.knowledgeGraph.edges.push({
      from: knowledgeId,
      to: target,
      type,
      timestamp: Date.now()
    });
  }
  
  /**
   * Find duplicate knowledge
   */
  findDuplicate(knowledge) {
    for (const [id, existing] of this.knowledgeBase) {
      if (existing.hash === knowledge.hash) {
        return existing;
      }
    }
    return null;
  }
  
  /**
   * Update existing knowledge
   */
  updateKnowledge(id, updates) {
    const existing = this.knowledgeBase.get(id);
    
    if (!existing) {
      throw new Error(`Knowledge ${id} not found`);
    }
    
    // Merge updates
    const updated = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        lastUpdated: Date.now()
      },
      version: existing.version + 1
    };
    
    this.knowledgeBase.set(id, updated);
    
    return updated;
  }
  
  /**
   * Query knowledge
   */
  queryKnowledge(query) {
    const results = [];
    
    for (const [id, knowledge] of this.knowledgeBase) {
      if (this.matchesQuery(knowledge, query)) {
        results.push({
          ...knowledge,
          score: this.scoreKnowledge(knowledge, query)
        });
      }
    }
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }
  
  /**
   * Match knowledge against query
   */
  matchesQuery(knowledge, query) {
    // Simple text matching (would use more sophisticated search)
    const searchText = JSON.stringify(knowledge).toLowerCase();
    const queryText = query.toLowerCase();
    
    return searchText.includes(queryText);
  }
  
  /**
   * Score knowledge relevance
   */
  scoreKnowledge(knowledge, query) {
    let score = 0;
    
    // Recency score
    const age = Date.now() - knowledge.metadata.timestamp;
    const recencyScore = 1 / (1 + age / (24 * 60 * 60 * 1000)); // Decay over days
    score += recencyScore * 0.3;
    
    // Confidence score
    score += (knowledge.metadata.confidence || 0) * 0.3;
    
    // Relevance score
    score += (knowledge.metadata.relevance || 0) * 0.4;
    
    return score;
  }
  
  /**
   * Persist knowledge to disk
   */
  async persistKnowledge(knowledge) {
    const filename = path.join(
      this.config.persistencePath,
      `${knowledge.id}.json`
    );
    
    await fs.writeFile(filename, JSON.stringify(knowledge, null, 2));
  }
  
  /**
   * Load persisted knowledge
   */
  async loadPersistedKnowledge() {
    try {
      const files = await fs.readdir(this.config.persistencePath);
      
      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('transfer')) {
          const filepath = path.join(this.config.persistencePath, file);
          const content = await fs.readFile(filepath, 'utf8');
          const knowledge = JSON.parse(content);
          
          // Check age
          const age = Date.now() - knowledge.metadata.timestamp;
          if (age < this.config.maxKnowledgeAge) {
            this.knowledgeBase.set(knowledge.id, knowledge);
            this.addToKnowledgeGraph(knowledge);
          }
        }
      }
      
      logger.info(`🟢 Loaded ${this.knowledgeBase.size} persisted knowledge items`);
    } catch (error) {
      logger.error(`Failed to load persisted knowledge: ${error.message}`);
    }
  }
  
  /**
   * Clean old knowledge
   */
  async cleanOldKnowledge() {
    const now = Date.now();
    const toDelete = [];
    
    for (const [id, knowledge] of this.knowledgeBase) {
      const age = now - knowledge.metadata.timestamp;
      
      if (age > this.config.maxKnowledgeAge) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      this.knowledgeBase.delete(id);
      
      // Remove from agent associations
      for (const agentSet of this.agentKnowledge.values()) {
        agentSet.delete(id);
      }
      
      // Remove from graph
      this.knowledgeGraph.nodes.delete(id);
      
      // Remove file if persisted
      if (this.config.persistenceEnabled) {
        const filepath = path.join(this.config.persistencePath, `${id}.json`);
        try {
          await fs.unlink(filepath);
        } catch (error) {
          // File might not exist
        }
      }
    }
    
    logger.info(`🟢 Cleaned ${toDelete.length} old knowledge items`);
  }
  
  /**
   * Hash content for deduplication
   */
  hashContent(content) {
    // Simple hash (would use crypto.createHash in production)
    const str = JSON.stringify(content);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(36);
  }
  
  /**
   * Generate IDs
   */
  generateKnowledgeId() {
    return `know-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateTransferId() {
    return `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      knowledgeBaseSize: this.knowledgeBase.size,
      graphNodes: this.knowledgeGraph.nodes.size,
      graphEdges: this.knowledgeGraph.edges.length,
      averageKnowledgeSize: this.stats.totalKnowledgeItems > 0 ?
        (this.stats.totalKnowledgeSize / this.stats.totalKnowledgeItems / 1024).toFixed(2) + ' KB' :
        '0 KB'
    };
  }
}

// Export
module.exports = {
  KnowledgeTransferProtocol,
  KnowledgeType,
  TransferMethod
};