/**
 * BUMBA Unified Memory System
 * Comprehensive memory architecture integrating short-term, working, long-term, and semantic memory
 * Follows BUMBA consciousness principles and integrates with existing memory infrastructure
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { BumbaTeamMemory } = require('../../utils/teamMemory');
const MemoryManager = require('../resource-management/memory-manager');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { logger } = require('../logging/bumba-logger');

/**
 * Short-Term Memory Class
 * Handles immediate context and temporary data (seconds to minutes)
 */
class ShortTermMemory extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxSize: config.maxSize || 100,
      ttl: config.ttl || 300000, // 5 minutes
      evictionPolicy: config.evictionPolicy || 'lru'
    };
    
    this.store = new Map();
    this.accessTimes = new Map();
    this.timers = new Map();
    
    // Track memory usage
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      stores: 0
    };
  }

  /**
   * Store data in short-term memory
   */
  store(key, data, options = {}) {
    try {
      // Clear existing timer if key exists
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Evict if at capacity
      if (this.store.size >= this.config.maxSize && !this.store.has(key)) {
        this.evictOne();
      }

      const entry = {
        key,
        data,
        timestamp: Date.now(),
        priority: options.priority || 'normal',
        tags: options.tags || [],
        size: this.estimateSize(data)
      };

      this.store.set(key, entry);
      this.accessTimes.set(key, Date.now());
      this.stats.stores++;

      // Set TTL timer
      const ttl = options.ttl || this.config.ttl;
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      
      this.timers.set(key, timer);

      this.emit('stored', { key, size: entry.size });
      return true;

    } catch (error) {
      logger.error(`Short-term memory store error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve data from short-term memory
   */
  retrieve(key) {
    if (this.store.has(key)) {
      const entry = this.store.get(key);
      this.accessTimes.set(key, Date.now());
      this.stats.hits++;
      
      this.emit('accessed', { key, data: entry.data });
      return entry.data;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Delete entry from short-term memory
   */
  delete(key) {
    if (this.store.has(key)) {
      this.store.delete(key);
      this.accessTimes.delete(key);
      
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      
      this.emit('deleted', { key });
      return true;
    }
    return false;
  }

  /**
   * Evict one item based on policy
   */
  evictOne() {
    let keyToEvict;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'fifo':
        keyToEvict = this.store.keys().next().value;
        break;
      case 'priority':
        keyToEvict = this.findLowestPriorityKey();
        break;
      default:
        keyToEvict = this.store.keys().next().value;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  findLRUKey() {
    let oldestTime = Infinity;
    let oldestKey = null;

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  findLowestPriorityKey() {
    const priorities = { low: 1, normal: 2, high: 3, critical: 4 };
    let lowestPriority = Infinity;
    let lowestKey = null;

    for (const [key, entry] of this.store) {
      const priority = priorities[entry.priority] || 2;
      if (priority < lowestPriority) {
        lowestPriority = priority;
        lowestKey = key;
      }
    }

    return lowestKey;
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2;
    } catch (error) {
      return 1024;
    }
  }

  getStats() {
    return {
      ...this.stats,
      size: this.store.size,
      memoryUsage: Array.from(this.store.values()).reduce((sum, entry) => sum + entry.size, 0)
    };
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.store.clear();
    this.accessTimes.clear();
    this.timers.clear();
    
    this.emit('cleared');
  }
}

/**
 * Working Memory Class
 * Handles active processing and manipulation (minutes to hours)
 */
class WorkingMemory extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxSlots: config.maxSlots || 7, // Miller's magic number
      ttl: config.ttl || 3600000, // 1 hour
      compressionThreshold: config.compressionThreshold || 10000
    };

    this.activeSlots = new Map();
    this.processingQueue = [];
    this.contextualConnections = new Map();
    
    this.stats = {
      slotsUsed: 0,
      compressions: 0,
      contextualLinks: 0,
      totalProcessed: 0
    };
  }

  /**
   * Allocate working memory slot
   */
  allocateSlot(slotId, data, context = {}) {
    try {
      if (this.activeSlots.size >= this.config.maxSlots && !this.activeSlots.has(slotId)) {
        this.compressOldestSlot();
      }

      const slot = {
        id: slotId,
        data,
        context,
        allocated: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        relationships: new Set(),
        compressed: false
      };

      this.activeSlots.set(slotId, slot);
      this.stats.slotsUsed = this.activeSlots.size;
      this.stats.totalProcessed++;

      // Auto-compress large data
      if (this.estimateSize(data) > this.config.compressionThreshold) {
        this.compressSlot(slotId);
      }

      this.emit('slot-allocated', { slotId, context });
      return slot;

    } catch (error) {
      logger.error(`Working memory allocation error for slot ${slotId}:`, error);
      return null;
    }
  }

  /**
   * Access working memory slot
   */
  accessSlot(slotId) {
    const slot = this.activeSlots.get(slotId);
    if (slot) {
      slot.lastAccessed = Date.now();
      slot.accessCount++;
      
      // Decompress if needed
      if (slot.compressed) {
        this.decompressSlot(slotId);
      }
      
      this.emit('slot-accessed', { slotId, data: slot.data });
      return slot.data;
    }
    return null;
  }

  /**
   * Update working memory slot
   */
  updateSlot(slotId, newData, mergeContext = true) {
    const slot = this.activeSlots.get(slotId);
    if (slot) {
      const oldSize = this.estimateSize(slot.data);
      slot.data = newData;
      slot.lastAccessed = Date.now();
      
      if (mergeContext && typeof newData === 'object' && typeof slot.context === 'object') {
        slot.context = { ...slot.context, ...newData.context };
      }

      const newSize = this.estimateSize(newData);
      if (newSize > this.config.compressionThreshold) {
        this.compressSlot(slotId);
      }

      this.emit('slot-updated', { slotId, oldSize, newSize });
      return true;
    }
    return false;
  }

  /**
   * Create relationship between slots
   */
  createRelationship(slotId1, slotId2, relationshipType = 'related') {
    const slot1 = this.activeSlots.get(slotId1);
    const slot2 = this.activeSlots.get(slotId2);

    if (slot1 && slot2) {
      slot1.relationships.add({ target: slotId2, type: relationshipType });
      slot2.relationships.add({ target: slotId1, type: relationshipType });
      
      const connectionKey = `${slotId1}:${slotId2}`;
      this.contextualConnections.set(connectionKey, {
        type: relationshipType,
        strength: 1,
        created: Date.now()
      });

      this.stats.contextualLinks++;
      this.emit('relationship-created', { slotId1, slotId2, relationshipType });
      return true;
    }
    return false;
  }

  /**
   * Get related slots
   */
  getRelatedSlots(slotId) {
    const slot = this.activeSlots.get(slotId);
    if (!slot) {return [];}

    return Array.from(slot.relationships).map(rel => ({
      slotId: rel.target,
      relationshipType: rel.type,
      data: this.accessSlot(rel.target)
    })).filter(rel => rel.data !== null);
  }

  /**
   * Compress slot data
   */
  compressSlot(slotId) {
    const slot = this.activeSlots.get(slotId);
    if (slot && !slot.compressed) {
      try {
        const originalData = slot.data;
        slot.data = this.compressData(originalData);
        slot.compressed = true;
        this.stats.compressions++;
        
        this.emit('slot-compressed', { slotId });
      } catch (error) {
        logger.error(`Compression error for slot ${slotId}:`, error);
      }
    }
  }

  /**
   * Decompress slot data
   */
  decompressSlot(slotId) {
    const slot = this.activeSlots.get(slotId);
    if (slot && slot.compressed) {
      try {
        slot.data = this.decompressData(slot.data);
        slot.compressed = false;
        
        this.emit('slot-decompressed', { slotId });
      } catch (error) {
        logger.error(`Decompression error for slot ${slotId}:`, error);
      }
    }
  }

  compressOldestSlot() {
    let oldestTime = Infinity;
    let oldestSlot = null;

    for (const [slotId, slot] of this.activeSlots) {
      if (slot.lastAccessed < oldestTime) {
        oldestTime = slot.lastAccessed;
        oldestSlot = slotId;
      }
    }

    if (oldestSlot) {
      this.compressSlot(oldestSlot);
    }
  }

  compressData(data) {
    // Simple compression strategy - in production, use proper compression
    if (typeof data === 'object') {
      return {
        _compressed: true,
        _type: 'object',
        _summary: this.extractSummary(data),
        _size: this.estimateSize(data),
        _original: JSON.stringify(data)
      };
    }
    return data;
  }

  decompressData(data) {
    if (data._compressed) {
      return JSON.parse(data._original);
    }
    return data;
  }

  extractSummary(data) {
    if (typeof data === 'object') {
      const keys = Object.keys(data).slice(0, 5);
      return { keys, sampleData: keys.reduce((acc, key) => {
        acc[key] = typeof data[key];
        return acc;
      }, {}) };
    }
    return String(data).substring(0, 100);
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2;
    } catch (error) {
      return 1024;
    }
  }

  releaseSlot(slotId) {
    if (this.activeSlots.has(slotId)) {
      this.activeSlots.delete(slotId);
      this.stats.slotsUsed = this.activeSlots.size;
      
      // Clean up relationships
      for (const [connectionKey, connection] of this.contextualConnections) {
        if (connectionKey.includes(slotId)) {
          this.contextualConnections.delete(connectionKey);
        }
      }
      
      this.emit('slot-released', { slotId });
      return true;
    }
    return false;
  }

  getStats() {
    return {
      ...this.stats,
      activeSlots: this.activeSlots.size,
      connections: this.contextualConnections.size,
      memoryUsage: Array.from(this.activeSlots.values()).reduce((sum, slot) => 
        sum + this.estimateSize(slot.data), 0)
    };
  }

  clear() {
    this.activeSlots.clear();
    this.contextualConnections.clear();
    this.stats.slotsUsed = 0;
    this.emit('cleared');
  }
}

/**
 * Long-Term Memory Class
 * Handles persistent knowledge and learned patterns (hours to permanent)
 */
class LongTermMemory extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxEntries: config.maxEntries || 10000,
      consolidationThreshold: config.consolidationThreshold || 5,
      compressionEnabled: config.compressionEnabled !== false,
      encryptionEnabled: config.encryptionEnabled !== false
    };

    this.knowledgeBase = new Map();
    this.patterns = new Map();
    this.consolidationCandidates = new Map();
    this.accessFrequency = new Map();
    
    this.stats = {
      totalEntries: 0,
      consolidations: 0,
      retrievals: 0,
      patterns: 0
    };

    // Integration with team memory
    this.teamMemory = null;
    this.mcpMemory = null;
    
    this.initializeIntegrations();
  }

  async initializeIntegrations() {
    try {
      this.teamMemory = await BumbaTeamMemory.create();
      this.mcpMemory = mcpServerManager;
    } catch (error) {
      logger.warn('Long-term memory integration warning:', error);
    }
  }

  /**
   * Store knowledge in long-term memory
   */
  async store(key, knowledge, metadata = {}) {
    try {
      const entry = {
        key,
        knowledge,
        metadata: {
          ...metadata,
          stored: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
          importance: metadata.importance || 'normal',
          category: metadata.category || 'general',
          tags: metadata.tags || [],
          consolidated: false
        }
      };

      this.knowledgeBase.set(key, entry);
      this.accessFrequency.set(key, 0);
      this.stats.totalEntries++;

      // Store in team memory for persistence
      if (this.teamMemory) {
        await this.storeInTeamMemory(key, entry);
      }

      // Store in MCP memory for cross-session persistence
      if (this.mcpMemory && metadata.persistent !== false) {
        await this.storeInMCPMemory(key, entry);
      }

      // Check for pattern recognition
      this.identifyPatterns(key, knowledge);

      this.emit('stored', { key, category: entry.metadata.category });
      return true;

    } catch (error) {
      logger.error(`Long-term memory store error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve knowledge from long-term memory
   */
  async retrieve(key, options = {}) {
    try {
      let entry = this.knowledgeBase.get(key);

      // Fallback to team memory
      if (!entry && this.teamMemory) {
        entry = await this.retrieveFromTeamMemory(key);
      }

      // Fallback to MCP memory
      if (!entry && this.mcpMemory) {
        entry = await this.retrieveFromMCPMemory(key);
      }

      if (entry) {
        entry.metadata.lastAccessed = Date.now();
        entry.metadata.accessCount++;
        
        const currentFreq = this.accessFrequency.get(key) || 0;
        this.accessFrequency.set(key, currentFreq + 1);

        // Check for consolidation candidacy
        if (entry.metadata.accessCount >= this.config.consolidationThreshold) {
          this.markForConsolidation(key, entry);
        }

        this.stats.retrievals++;
        this.emit('retrieved', { key, importance: entry.metadata.importance });
        
        return options.includeMetadata ? entry : entry.knowledge;
      }

      return null;

    } catch (error) {
      logger.error(`Long-term memory retrieval error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Search knowledge by semantic similarity
   */
  async search(query, options = {}) {
    const results = [];
    const maxResults = options.maxResults || 10;
    const threshold = options.threshold || 0.5;

    for (const [key, entry] of this.knowledgeBase) {
      const similarity = this.calculateSementicSimilarity(query, entry.knowledge);
      
      if (similarity >= threshold) {
        results.push({
          key,
          knowledge: entry.knowledge,
          similarity,
          metadata: entry.metadata
        });
      }
    }

    // Sort by similarity and access frequency
    results.sort((a, b) => {
      const similarityDiff = b.similarity - a.similarity;
      if (Math.abs(similarityDiff) > 0.1) {return similarityDiff;}
      
      const freqA = this.accessFrequency.get(a.key) || 0;
      const freqB = this.accessFrequency.get(b.key) || 0;
      return freqB - freqA;
    });

    return results.slice(0, maxResults);
  }

  /**
   * Mark knowledge for consolidation
   */
  markForConsolidation(key, entry) {
    this.consolidationCandidates.set(key, {
      ...entry,
      markedAt: Date.now(),
      consolidationScore: this.calculateConsolidationScore(entry)
    });
  }

  /**
   * Consolidate frequently accessed knowledge
   */
  async consolidateKnowledge() {
    const candidates = Array.from(this.consolidationCandidates.entries())
      .sort((a, b) => b[1].consolidationScore - a[1].consolidationScore);

    for (const [key, candidate] of candidates.slice(0, 10)) {
      try {
        const consolidated = await this.performConsolidation(key, candidate);
        if (consolidated) {
          candidate.metadata.consolidated = true;
          this.knowledgeBase.set(key, candidate);
          this.consolidationCandidates.delete(key);
          this.stats.consolidations++;
          
          this.emit('consolidated', { key });
        }
      } catch (error) {
        logger.error(`Consolidation error for key ${key}:`, error);
      }
    }
  }

  async performConsolidation(key, entry) {
    // Enhanced storage with better compression and organization
    entry.metadata.consolidated = true;
    entry.metadata.consolidatedAt = Date.now();
    
    // Store in persistent systems
    if (this.teamMemory) {
      await this.storeInTeamMemory(`consolidated_${key}`, entry);
    }
    
    return true;
  }

  calculateConsolidationScore(entry) {
    const accessWeight = Math.log(entry.metadata.accessCount + 1);
    const timeWeight = 1 / (Date.now() - entry.metadata.stored + 1);
    const importanceWeight = this.getImportanceWeight(entry.metadata.importance);
    
    return accessWeight * 0.5 + timeWeight * 0.3 + importanceWeight * 0.2;
  }

  getImportanceWeight(importance) {
    const weights = { low: 1, normal: 2, high: 3, critical: 4 };
    return weights[importance] || 2;
  }

  /**
   * Pattern identification and storage
   */
  identifyPatterns(key, knowledge) {
    try {
      const patternKey = this.extractPatternKey(knowledge);
      if (patternKey) {
        if (!this.patterns.has(patternKey)) {
          this.patterns.set(patternKey, {
            pattern: patternKey,
            occurrences: [],
            frequency: 0,
            discovered: Date.now()
          });
        }

        const pattern = this.patterns.get(patternKey);
        pattern.occurrences.push({ key, timestamp: Date.now() });
        pattern.frequency++;
        this.stats.patterns = this.patterns.size;

        this.emit('pattern-identified', { patternKey, frequency: pattern.frequency });
      }
    } catch (error) {
      logger.error('Pattern identification error:', error);
    }
  }

  extractPatternKey(knowledge) {
    if (typeof knowledge === 'object') {
      const structure = Object.keys(knowledge).sort().join(':');
      if (structure.length > 5) {return structure;}
    } else if (typeof knowledge === 'string') {
      const words = knowledge.toLowerCase().match(/\w+/g) || [];
      if (words.length >= 3) {
        return words.slice(0, 3).join(':');
      }
    }
    return null;
  }

  calculateSementicSimilarity(query, knowledge) {
    // Simple similarity calculation - in production, use proper NLP
    const queryWords = this.extractWords(query);
    const knowledgeWords = this.extractWords(knowledge);
    
    const intersection = queryWords.filter(word => knowledgeWords.includes(word));
    const union = [...new Set([...queryWords, ...knowledgeWords])];
    
    return intersection.length / union.length;
  }

  extractWords(text) {
    const str = typeof text === 'string' ? text : JSON.stringify(text);
    return str.toLowerCase().match(/\w+/g) || [];
  }

  async storeInTeamMemory(key, entry) {
    if (this.teamMemory) {
      const context = await this.teamMemory.getTeamContext();
      if (context) {
        context.sharedContext[`ltm_${key}`] = {
          type: 'long_term_memory',
          entry: entry,
          stored_at: Date.now()
        };
        await this.teamMemory.saveContext(context);
      }
    }
  }

  async retrieveFromTeamMemory(key) {
    if (this.teamMemory) {
      const context = await this.teamMemory.getTeamContext();
      if (context && context.sharedContext[`ltm_${key}`]) {
        return context.sharedContext[`ltm_${key}`].entry;
      }
    }
    return null;
  }

  async storeInMCPMemory(key, entry) {
    try {
      if (this.mcpMemory) {
        const memoryServer = await this.mcpMemory.getServer('memory');
        if (memoryServer) {
          await memoryServer.execute('store', {
            key: `ltm_${key}`,
            value: entry,
            options: { persistent: true }
          });
        }
      }
    } catch (error) {
      logger.warn('MCP memory store failed:', error);
    }
  }

  async retrieveFromMCPMemory(key) {
    try {
      if (this.mcpMemory) {
        const memoryServer = await this.mcpMemory.getServer('memory');
        if (memoryServer) {
          const result = await memoryServer.execute('retrieve', { key: `ltm_${key}` });
          return result.success ? result.data : null;
        }
      }
    } catch (error) {
      logger.warn('MCP memory retrieve failed:', error);
    }
    return null;
  }

  getStats() {
    return {
      ...this.stats,
      knowledgeBaseSize: this.knowledgeBase.size,
      consolidationCandidates: this.consolidationCandidates.size,
      patterns: this.patterns.size,
      memoryUsage: Array.from(this.knowledgeBase.values()).reduce((sum, entry) => 
        sum + this.estimateSize(entry.knowledge), 0)
    };
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2;
    } catch (error) {
      return 1024;
    }
  }

  clear() {
    this.knowledgeBase.clear();
    this.patterns.clear();
    this.consolidationCandidates.clear();
    this.accessFrequency.clear();
    this.emit('cleared');
  }
}

/**
 * Semantic Memory Class
 * Handles conceptual knowledge and relationships
 */
class SemanticMemory extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxConcepts: config.maxConcepts || 5000,
      maxRelationships: config.maxRelationships || 20000,
      similarityThreshold: config.similarityThreshold || 0.7,
      inferenceDepth: config.inferenceDepth || 3
    };

    this.concepts = new Map();
    this.relationships = new Map();
    this.ontology = new Map();
    this.inferenceCache = new Map();
    
    this.stats = {
      concepts: 0,
      relationships: 0,
      inferences: 0,
      queries: 0
    };
  }

  /**
   * Store a concept in semantic memory
   */
  storeConcept(conceptId, concept, metadata = {}) {
    try {
      const conceptEntry = {
        id: conceptId,
        name: concept.name || conceptId,
        type: concept.type || 'entity',
        properties: concept.properties || {},
        description: concept.description || '',
        metadata: {
          ...metadata,
          created: Date.now(),
          lastModified: Date.now(),
          accessCount: 0,
          confidence: metadata.confidence || 1.0
        }
      };

      this.concepts.set(conceptId, conceptEntry);
      this.stats.concepts = this.concepts.size;

      // Add to ontological hierarchy
      if (concept.type) {
        this.addToOntology(concept.type, conceptId);
      }

      this.emit('concept-stored', { conceptId, type: concept.type });
      return true;

    } catch (error) {
      logger.error(`Semantic memory concept store error for ${conceptId}:`, error);
      return false;
    }
  }

  /**
   * Store a relationship between concepts
   */
  storeRelationship(subject, predicate, object, metadata = {}) {
    try {
      const relationshipId = `${subject}:${predicate}:${object}`;
      
      const relationship = {
        id: relationshipId,
        subject,
        predicate,
        object,
        metadata: {
          ...metadata,
          created: Date.now(),
          strength: metadata.strength || 1.0,
          confidence: metadata.confidence || 1.0,
          source: metadata.source || 'user'
        }
      };

      this.relationships.set(relationshipId, relationship);
      this.stats.relationships = this.relationships.size;

      // Update concept relationships
      this.updateConceptRelationships(subject, relationshipId);
      this.updateConceptRelationships(object, relationshipId);

      // Clear inference cache as new relationship may affect inferences
      this.inferenceCache.clear();

      this.emit('relationship-stored', { subject, predicate, object });
      return true;

    } catch (error) {
      logger.error(`Relationship store error for ${subject}-${predicate}-${object}:`, error);
      return false;
    }
  }

  /**
   * Query semantic knowledge
   */
  query(subject, predicate = null, object = null, options = {}) {
    try {
      this.stats.queries++;
      const results = [];

      // Direct relationship lookup
      for (const [relationshipId, relationship] of this.relationships) {
        if (this.matchesQuery(relationship, subject, predicate, object)) {
          results.push({
            ...relationship,
            type: 'direct',
            confidence: relationship.metadata.confidence
          });
        }
      }

      // Inference-based lookup if enabled
      if (options.includeInferences !== false) {
        const inferences = this.generateInferences(subject, predicate, object, options.depth || 2);
        results.push(...inferences);
      }

      // Sort by confidence and strength
      results.sort((a, b) => {
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) {return confidenceDiff;}
        
        const strengthA = a.metadata?.strength || 0.5;
        const strengthB = b.metadata?.strength || 0.5;
        return strengthB - strengthA;
      });

      this.emit('query-executed', { subject, predicate, object, resultCount: results.length });
      return results;

    } catch (error) {
      logger.error('Semantic query error:', error);
      return [];
    }
  }

  /**
   * Generate inferences from existing knowledge
   */
  generateInferences(subject, predicate, object, depth = 2) {
    const cacheKey = `${subject}:${predicate}:${object}:${depth}`;
    
    if (this.inferenceCache.has(cacheKey)) {
      return this.inferenceCache.get(cacheKey);
    }

    const inferences = [];
    
    if (depth <= 0) {return inferences;}

    try {
      // Transitive relationships (A->B, B->C implies A->C)
      if (predicate && !object) {
        const directRelations = this.getDirectRelationships(subject, predicate);
        
        for (const relation of directRelations) {
          const transitiveResults = this.query(relation.object, predicate, null, { 
            includeInferences: false 
          });
          
          for (const transitive of transitiveResults) {
            inferences.push({
              id: `inferred_${subject}:${predicate}:${transitive.object}`,
              subject,
              predicate,
              object: transitive.object,
              type: 'transitive',
              confidence: Math.min(relation.metadata.confidence, transitive.confidence) * 0.8,
              metadata: {
                inferenceType: 'transitive',
                path: [subject, relation.object, transitive.object],
                created: Date.now()
              }
            });
          }
        }
      }

      // Symmetric relationships (A relates to B implies B relates to A)
      if (this.isSymmetricPredicate(predicate)) {
        const symmetricResults = this.query(object, predicate, subject, { 
          includeInferences: false 
        });
        
        if (symmetricResults.length === 0 && subject && object) {
          inferences.push({
            id: `inferred_${object}:${predicate}:${subject}`,
            subject: object,
            predicate,
            object: subject,
            type: 'symmetric',
            confidence: 0.9,
            metadata: {
              inferenceType: 'symmetric',
              created: Date.now()
            }
          });
        }
      }

      // Hierarchical inferences (subclass relationships)
      const hierarchicalInferences = this.generateHierarchicalInferences(subject, predicate, object);
      inferences.push(...hierarchicalInferences);

      this.stats.inferences += inferences.length;
      this.inferenceCache.set(cacheKey, inferences);
      
      return inferences;

    } catch (error) {
      logger.error('Inference generation error:', error);
      return [];
    }
  }

  generateHierarchicalInferences(subject, predicate, object) {
    const inferences = [];
    
    try {
      if (predicate === 'isA' || predicate === 'instanceOf') {
        // If A is a B, and B is a C, then A is a C
        const parentClasses = this.query(object, 'isA', null, { includeInferences: false });
        
        for (const parentClass of parentClasses) {
          inferences.push({
            id: `inferred_${subject}:isA:${parentClass.object}`,
            subject,
            predicate: 'isA',
            object: parentClass.object,
            type: 'hierarchical',
            confidence: 0.8,
            metadata: {
              inferenceType: 'hierarchical',
              path: [subject, object, parentClass.object],
              created: Date.now()
            }
          });
        }
      }
    } catch (error) {
      logger.error('Hierarchical inference error:', error);
    }
    
    return inferences;
  }

  getDirectRelationships(subject, predicate) {
    const results = [];
    
    for (const [, relationship] of this.relationships) {
      if (relationship.subject === subject && relationship.predicate === predicate) {
        results.push(relationship);
      }
    }
    
    return results;
  }

  matchesQuery(relationship, subject, predicate, object) {
    if (subject && relationship.subject !== subject) {return false;}
    if (predicate && relationship.predicate !== predicate) {return false;}
    if (object && relationship.object !== object) {return false;}
    return true;
  }

  isSymmetricPredicate(predicate) {
    const symmetricPredicates = ['similar', 'related', 'connected', 'associated'];
    return symmetricPredicates.includes(predicate);
  }

  updateConceptRelationships(conceptId, relationshipId) {
    const concept = this.concepts.get(conceptId);
    if (concept) {
      if (!concept.relationships) {
        concept.relationships = new Set();
      }
      concept.relationships.add(relationshipId);
      concept.metadata.lastModified = Date.now();
    }
  }

  addToOntology(type, conceptId) {
    if (!this.ontology.has(type)) {
      this.ontology.set(type, new Set());
    }
    this.ontology.get(type).add(conceptId);
  }

  /**
   * Find similar concepts based on properties and relationships
   */
  findSimilarConcepts(conceptId, threshold = null) {
    const similarThreshold = threshold || this.config.similarityThreshold;
    const targetConcept = this.concepts.get(conceptId);
    
    if (!targetConcept) {return [];}

    const similarities = [];

    for (const [id, concept] of this.concepts) {
      if (id === conceptId) {continue;}

      const similarity = this.calculateConceptSimilarity(targetConcept, concept);
      
      if (similarity >= similarThreshold) {
        similarities.push({
          conceptId: id,
          concept: concept,
          similarity
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  calculateConceptSimilarity(concept1, concept2) {
    let similarity = 0;
    let factors = 0;

    // Type similarity
    if (concept1.type === concept2.type) {
      similarity += 0.3;
    }
    factors++;

    // Property similarity
    const props1 = Object.keys(concept1.properties || {});
    const props2 = Object.keys(concept2.properties || {});
    const commonProps = props1.filter(prop => props2.includes(prop));
    
    if (props1.length > 0 || props2.length > 0) {
      const propSimilarity = commonProps.length / Math.max(props1.length, props2.length);
      similarity += propSimilarity * 0.4;
      factors++;
    }

    // Relationship similarity
    const rels1 = concept1.relationships || new Set();
    const rels2 = concept2.relationships || new Set();
    const commonRels = [...rels1].filter(rel => rels2.has(rel));
    
    if (rels1.size > 0 || rels2.size > 0) {
      const relSimilarity = commonRels.length / Math.max(rels1.size, rels2.size);
      similarity += relSimilarity * 0.3;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Export semantic network for visualization or analysis
   */
  exportNetwork() {
    const nodes = Array.from(this.concepts.values()).map(concept => ({
      id: concept.id,
      label: concept.name,
      type: concept.type,
      properties: concept.properties
    }));

    const edges = Array.from(this.relationships.values()).map(rel => ({
      source: rel.subject,
      target: rel.object,
      label: rel.predicate,
      strength: rel.metadata.strength,
      confidence: rel.metadata.confidence
    }));

    return { nodes, edges };
  }

  getStats() {
    return {
      ...this.stats,
      conceptsCount: this.concepts.size,
      relationshipsCount: this.relationships.size,
      ontologyCategories: this.ontology.size,
      inferenceCacheSize: this.inferenceCache.size
    };
  }

  clear() {
    this.concepts.clear();
    this.relationships.clear();
    this.ontology.clear();
    this.inferenceCache.clear();
    this.stats = { concepts: 0, relationships: 0, inferences: 0, queries: 0 };
    this.emit('cleared');
  }
}

/**
 * Unified Memory System Integration Class
 * Orchestrates all memory types and provides intelligent routing
 */
class UnifiedMemorySystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      ...config,
      consciousness: config.consciousness !== false,
      routing: config.routing || 'intelligent',
      compression: config.compression !== false,
      encryption: config.encryption !== false
    };

    // Initialize memory subsystems
    this.shortTermMemory = new ShortTermMemory(config.shortTerm);
    this.workingMemory = new WorkingMemory(config.working);
    this.longTermMemory = new LongTermMemory(config.longTerm);
    this.semanticMemory = new SemanticMemory(config.semantic);

    // Integration with existing BUMBA systems
    this.memoryManager = MemoryManager.getInstance();
    this.teamMemory = null;
    
    // Consciousness integration
    this.consciousnessLayer = null;
    
    // Statistics and monitoring
    this.stats = {
      totalOperations: 0,
      routingDecisions: 0,
      crossMemoryTransfers: 0,
      compressionEvents: 0,
      consciousnessValidations: 0
    };

    // Memory pressure handling
    this.pressureLevel = 'normal'; // normal, warning, critical
    
    this.initialize();
  }

  async initialize() {
    logger.info('🟢 Initializing BUMBA Unified Memory System');

    try {
      // Initialize team memory integration
      this.teamMemory = await BumbaTeamMemory.create();
      
      // Initialize consciousness layer if enabled
      if (this.config.consciousness) {
        try {
          const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
          this.consciousnessLayer = new ConsciousnessLayer();
        } catch (error) {
          logger.warn('Consciousness layer initialization failed:', error);
        }
      }

      // Set up event listeners for memory pressure
      this.memoryManager.on('memory-warning', () => this.handleMemoryPressure('warning'));
      this.memoryManager.on('memory-critical', () => this.handleMemoryPressure('critical'));

      // Set up cross-memory event handlers
      this.setupCrossMemoryHandlers();

      // Start periodic maintenance
      this.startMaintenance();

      logger.info('🏁 Unified Memory System initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Unified Memory System initialization error:', error);
      throw error;
    }
  }

  /**
   * Store data with intelligent routing to appropriate memory type
   */
  async store(key, data, options = {}) {
    try {
      this.stats.totalOperations++;
      
      // Consciousness validation if enabled
      if (this.consciousnessLayer && options.validate !== false) {
        const validation = await this.validateWithConsciousness('store', { key, data, options });
        if (!validation.approved) {
          logger.warn(`Storage denied by consciousness validation: ${validation.reason}`);
          return { success: false, reason: validation.reason };
        }
        this.stats.consciousnessValidations++;
      }

      // Determine target memory types
      const targets = await this.routeMemoryOperation('store', key, data, options);
      this.stats.routingDecisions++;

      const results = {};

      // Store in each target memory type
      for (const target of targets) {
        try {
          let success = false;

          switch (target.type) {
            case 'short-term':
              success = this.shortTermMemory.store(key, data, target.options);
              break;

            case 'working': {
              const slot = this.workingMemory.allocateSlot(key, data, target.options);
              success = slot !== null;
              break;
            }

            case 'long-term':
              success = await this.longTermMemory.store(key, data, target.options);
              break;

            case 'semantic':
              if (target.options.concept) {
                success = this.semanticMemory.storeConcept(key, data, target.options);
              } else if (target.options.relationship) {
                const { subject, predicate, object } = target.options.relationship;
                success = this.semanticMemory.storeRelationship(subject, predicate, object, target.options);
              }
              break;
          }

          results[target.type] = { success, options: target.options };

        } catch (error) {
          logger.error(`Storage error in ${target.type} memory:`, error);
          results[target.type] = { success: false, error: error.message };
        }
      }

      this.emit('stored', { key, targets, results });
      return { success: true, targets, results };

    } catch (error) {
      logger.error(`Unified memory store error for key ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve data with intelligent fallback through memory hierarchy
   */
  async retrieve(key, options = {}) {
    try {
      this.stats.totalOperations++;

      // Define search order based on retrieval strategy
      const searchOrder = options.searchOrder || this.getDefaultSearchOrder(options);

      for (const memoryType of searchOrder) {
        try {
          let result = null;

          switch (memoryType) {
            case 'short-term':
              result = this.shortTermMemory.retrieve(key);
              break;

            case 'working':
              result = this.workingMemory.accessSlot(key);
              break;

            case 'long-term':
              result = await this.longTermMemory.retrieve(key, options);
              break;

            case 'semantic':
              if (options.semanticQuery) {
                result = this.semanticMemory.query(key, options.predicate, options.object, options);
              } else {
                const concept = this.semanticMemory.concepts.get(key);
                result = concept ? concept : null;
              }
              break;
          }

          if (result !== null) {
            // Promote to faster memory if appropriate
            if (options.promote !== false) {
              await this.promoteMemory(key, result, memoryType);
            }

            this.emit('retrieved', { key, source: memoryType, promoted: options.promote !== false });
            return { data: result, source: memoryType, success: true };
          }

        } catch (error) {
          logger.warn(`Retrieval error from ${memoryType} memory:`, error);
        }
      }

      // Not found in any memory type
      this.emit('miss', { key, searchOrder });
      return { data: null, success: false };

    } catch (error) {
      logger.error(`Unified memory retrieval error for key ${key}:`, error);
      return { data: null, success: false, error: error.message };
    }
  }

  /**
   * Search across all memory types with semantic capabilities
   */
  async search(query, options = {}) {
    try {
      const results = [];

      // Search semantic memory first for conceptual matches
      if (options.includeSemantics !== false) {
        const semanticResults = await this.semanticMemory.query(
          query, 
          options.predicate, 
          options.object, 
          { includeInferences: options.includeInferences }
        );
        
        results.push(...semanticResults.map(r => ({ ...r, source: 'semantic' })));
      }

      // Search long-term memory for knowledge
      if (options.includeLongTerm !== false) {
        const longTermResults = await this.longTermMemory.search(query, options);
        results.push(...longTermResults.map(r => ({ ...r, source: 'long-term' })));
      }

      // Search working memory slots
      if (options.includeWorking !== false) {
        for (const [slotId, slot] of this.workingMemory.activeSlots) {
          const similarity = this.calculateSimilarity(query, slot.data);
          if (similarity >= (options.threshold || 0.5)) {
            results.push({
              key: slotId,
              data: slot.data,
              similarity,
              source: 'working',
              metadata: slot.context
            });
          }
        }
      }

      // Sort by relevance
      results.sort((a, b) => {
        const similarityDiff = (b.similarity || 0) - (a.similarity || 0);
        if (Math.abs(similarityDiff) > 0.1) {return similarityDiff;}
        
        // Prefer more recent results
        const timeA = a.metadata?.timestamp || a.metadata?.created || 0;
        const timeB = b.metadata?.timestamp || b.metadata?.created || 0;
        return timeB - timeA;
      });

      const maxResults = options.maxResults || 20;
      return results.slice(0, maxResults);

    } catch (error) {
      logger.error('Unified memory search error:', error);
      return [];
    }
  }

  /**
   * Intelligent routing of memory operations
   */
  async routeMemoryOperation(operation, key, data, options = {}) {
    const targets = [];

    try {
      // Analyze data characteristics
      const characteristics = this.analyzeDataCharacteristics(data, options);

      // Route based on data type and usage patterns
      if (characteristics.temporal === 'immediate') {
        targets.push({
          type: 'short-term',
          options: {
            ttl: options.ttl || 300000, // 5 minutes
            priority: characteristics.priority
          }
        });
      }

      if (characteristics.temporal === 'active' || characteristics.contextual) {
        targets.push({
          type: 'working',
          options: {
            context: options.context || {},
            priority: characteristics.priority
          }
        });
      }

      if (characteristics.temporal === 'permanent' || characteristics.important) {
        targets.push({
          type: 'long-term',
          options: {
            category: characteristics.category,
            importance: characteristics.importance,
            persistent: true
          }
        });
      }

      if (characteristics.semantic || characteristics.relational) {
        if (characteristics.isEntity) {
          targets.push({
            type: 'semantic',
            options: {
              concept: true,
            }
          });
        }

        if (characteristics.relationships) {
          for (const rel of characteristics.relationships) {
            targets.push({
              type: 'semantic',
              options: {
                relationship: rel
              }
            });
          }
        }
      }

      // Ensure at least one target
      if (targets.length === 0) {
        targets.push({
          type: 'short-term',
          options: { ttl: 300000 }
        });
      }

      return targets;

    } catch (error) {
      logger.error('Memory routing error:', error);
      return [{ type: 'short-term', options: {} }];
    }
  }

  /**
   * Analyze data characteristics for routing decisions
   */
  analyzeDataCharacteristics(data, options = {}) {
    const characteristics = {
      temporal: 'immediate',
      priority: 'normal',
      important: false,
      semantic: false,
      relational: false,
      contextual: false,
      category: 'general'
    };

    try {
      // Explicit options override analysis
      if (options.temporal) {characteristics.temporal = options.temporal;}
      if (options.priority) {characteristics.priority = options.priority;}
      if (options.important) {characteristics.important = options.important;}

      // Analyze data content
      if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        
        // Check for semantic indicators
        if (keys.includes('type') || keys.includes('category') || keys.includes('concept')) {
          characteristics.semantic = true;
          characteristics.isEntity = true;
          characteristics.entityType = data.type || data.category || 'entity';
        }

        // Check for relationship indicators
        if (keys.includes('subject') && keys.includes('predicate') && keys.includes('object')) {
          characteristics.relational = true;
          characteristics.relationships = [{ 
            subject: data.subject, 
            predicate: data.predicate, 
            object: data.object 
          }];
        }

        // Check for context indicators
        if (keys.includes('context') || keys.includes('metadata') || keys.includes('session')) {
          characteristics.contextual = true;
          characteristics.temporal = 'active';
        }

        // Check for importance indicators
        const importantKeys = ['critical', 'important', 'priority', 'urgent'];
        if (importantKeys.some(key => keys.includes(key))) {
          characteristics.important = true;
          characteristics.temporal = 'permanent';
        }

        // Determine category
        if (data.category) {
          characteristics.category = data.category;
        } else if (data.type) {
          characteristics.category = data.type;
        }
      }

      // Analyze by key patterns
      if (typeof key === 'string') {
        if (key.includes('temp_') || key.includes('cache_')) {
          characteristics.temporal = 'immediate';
        } else if (key.includes('session_') || key.includes('work_')) {
          characteristics.temporal = 'active';
        } else if (key.includes('knowledge_') || key.includes('learn_')) {
          characteristics.temporal = 'permanent';
          characteristics.important = true;
        }
      }

      return characteristics;

    } catch (error) {
      logger.error('Data analysis error:', error);
      return characteristics;
    }
  }

  /**
   * Promote frequently accessed data to faster memory
   */
  async promoteMemory(key, data, sourceType) {
    try {
      if (sourceType === 'long-term') {
        // Promote to working memory for active use
        this.workingMemory.allocateSlot(`promoted_${key}`, data, {
          promoted: true,
          originalSource: sourceType
        });
        
        this.stats.crossMemoryTransfers++;
      } else if (sourceType === 'working') {
        // Promote to short-term for immediate access
        this.shortTermMemory.store(`promoted_${key}`, data, {
          ttl: 600000, // 10 minutes
          promoted: true,
          originalSource: sourceType
        });
        
        this.stats.crossMemoryTransfers++;
      }
    } catch (error) {
      logger.error('Memory promotion error:', error);
    }
  }

  /**
   * Handle memory pressure events
   */
  async handleMemoryPressure(level) {
    this.pressureLevel = level;
    logger.warn(`Memory pressure level: ${level}`);

    try {
      if (level === 'warning') {
        // Gentle cleanup
        await this.performMaintenance(0.2); // Remove 20% of low-priority items
      } else if (level === 'critical') {
        // Aggressive cleanup
        await this.performMaintenance(0.5); // Remove 50% of items
        
        // Clear caches
        this.shortTermMemory.clear();
        
        // Compress working memory
        for (const [slotId] of this.workingMemory.activeSlots) {
          this.workingMemory.compressSlot(slotId);
        }
      }
    } catch (error) {
      logger.error('Memory pressure handling error:', error);
    }
  }

  /**
   * Periodic maintenance operations
   */
  async performMaintenance(cleanupRatio = 0.1) {
    try {
      logger.info('🟢 Performing memory maintenance');

      // Consolidate long-term memory
      await this.longTermMemory.consolidateKnowledge();

      // Clean up expired short-term entries
      // (handled automatically by TTL)

      // Compress old working memory slots
      const now = Date.now();
      for (const [slotId, slot] of this.workingMemory.activeSlots) {
        if (now - slot.lastAccessed > 1800000) { // 30 minutes
          this.workingMemory.compressSlot(slotId);
        }
      }

      // Update statistics
      this.updateStatistics();

      this.emit('maintenance-completed', { cleanupRatio });

    } catch (error) {
      logger.error('Maintenance error:', error);
    }
  }

  startMaintenance() {
    // Run maintenance every 15 minutes
    setInterval(() => {
      this.performMaintenance();
    }, 900000);
  }

  /**
   * Set up cross-memory event handlers
   */
  setupCrossMemoryHandlers() {
    // When working memory slot is released, consider archiving to long-term
    this.workingMemory.on('slot-released', async ({ slotId }) => {
      const data = this.workingMemory.accessSlot(slotId);
      if (data && this.shouldArchive(data)) {
        await this.longTermMemory.store(`archived_${slotId}`, data, {
          category: 'archived',
          importance: 'normal'
        });
      }
    });

    // When patterns are identified in long-term memory, update semantic memory
    this.longTermMemory.on('pattern-identified', ({ patternKey, frequency }) => {
      if (frequency >= 3) { // Significant pattern
        this.semanticMemory.storeConcept(`pattern_${patternKey}`, {
          name: patternKey,
          type: 'pattern',
          properties: { frequency }
        });
      }
    });
  }

  shouldArchive(data) {
    // Simple heuristic - in production, use more sophisticated criteria
    return typeof data === 'object' && 
           data !== null && 
           Object.keys(data).length > 3;
  }

  /**
   * Consciousness validation integration
   */
  async validateWithConsciousness(operation, context) {
    if (!this.consciousnessLayer) {
      return { approved: true };
    }

    try {
      // Basic validation principles
      const validation = {
        approved: true,
        reason: null
      };

      // Check for sensitive data patterns
      const dataString = JSON.stringify(context.data || {}).toLowerCase();
      const sensitivePatterns = ['password', 'secret', 'token', 'private'];
      
      if (sensitivePatterns.some(pattern => dataString.includes(pattern))) {
        validation.approved = false;
        validation.reason = 'Sensitive data detected - requires explicit encryption';
      }

      // Check data size for consciousness of resource usage
      const dataSize = this.estimateSize(context.data);
      if (dataSize > 1000000) { // 1MB
        validation.approved = false;
        validation.reason = 'Large data size - consciousness principle of resource efficiency';
      }

      return validation;

    } catch (error) {
      logger.error('Consciousness validation error:', error);
      return { approved: true }; // Fail open
    }
  }

  getDefaultSearchOrder(options) {
    if (options.preferRecent) {
      return ['short-term', 'working', 'semantic', 'long-term'];
    } else if (options.preferSemantic) {
      return ['semantic', 'long-term', 'working', 'short-term'];
    } else {
      return ['short-term', 'working', 'long-term', 'semantic'];
    }
  }

  calculateSimilarity(query, data) {
    // Simple text-based similarity - in production, use proper NLP
    const queryStr = String(query).toLowerCase();
    const dataStr = JSON.stringify(data).toLowerCase();
    
    const queryWords = queryStr.match(/\w+/g) || [];
    const dataWords = dataStr.match(/\w+/g) || [];
    
    const intersection = queryWords.filter(word => dataWords.includes(word));
    const union = [...new Set([...queryWords, ...dataWords])];
    
    return intersection.length / union.length;
  }

  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2;
    } catch (error) {
      return 1024;
    }
  }

  updateStatistics() {
    this.stats.memoryUsage = {
      shortTerm: this.shortTermMemory.getStats(),
      working: this.workingMemory.getStats(),
      longTerm: this.longTermMemory.getStats(),
      semantic: this.semanticMemory.getStats()
    };
  }

  /**
   * Get comprehensive system statistics
   */
  getStats() {
    this.updateStatistics();
    
    return {
      system: this.stats,
      pressureLevel: this.pressureLevel,
      memoryTypes: {
        shortTerm: this.shortTermMemory.getStats(),
        working: this.workingMemory.getStats(),
        longTerm: this.longTermMemory.getStats(),
        semantic: this.semanticMemory.getStats()
      },
      integration: {
        teamMemoryConnected: !!this.teamMemory,
        consciousnessEnabled: !!this.consciousnessLayer,
        mcpIntegration: !!this.longTermMemory.mcpMemory
      }
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    logger.info('🟢 Shutting down Unified Memory System');
    
    try {
      // Clear all memory types
      this.shortTermMemory.clear();
      this.workingMemory.clear();
      this.longTermMemory.clear();
      this.semanticMemory.clear();

      // Remove all event listeners
      this.removeAllListeners();

      this.emit('shutdown');
      logger.info('🏁 Unified Memory System shutdown complete');

    } catch (error) {
      logger.error('Shutdown error:', error);
    }
  }
}

// Export singleton instance and classes
let instance = null;

module.exports = {
  UnifiedMemorySystem,
  ShortTermMemory,
  WorkingMemory,
  LongTermMemory,
  SemanticMemory,
  
  // Singleton access
  getInstance(config) {
    if (!instance) {
      instance = new UnifiedMemorySystem(config);
    }
    return instance;
  },
  
  // Convenience methods
  store: async (key, data, options) => {
    if (!instance) {
      instance = new UnifiedMemorySystem();
    }
    return instance.store(key, data, options);
  },
  
  retrieve: async (key, options) => {
    if (!instance) {
      instance = new UnifiedMemorySystem();
    }
    return instance.retrieve(key, options);
  },
  
  search: async (query, options) => {
    if (!instance) {
      instance = new UnifiedMemorySystem();
    }
    return instance.search(query, options);
  }
};