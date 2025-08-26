/**
 * BUMBA Persistent Memory Manager
 * Advanced persistence with versioning, merging, and long-term storage
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class PersistentMemoryManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      basePath: config.basePath || path.join(process.env.HOME, '.claude', 'bumba', 'memory'),
      maxVersions: config.maxVersions || 10,
      consolidationThreshold: config.consolidationThreshold || 1000,
      compressionThreshold: config.compressionThreshold || 10240, // 10KB
      snapshotInterval: config.snapshotInterval || 3600000, // 1 hour
      mergeStrategy: config.mergeStrategy || 'semantic',
      ttlDays: config.ttlDays || 90 // 3 months default
    };

    // Memory hierarchies
    this.hierarchies = {
      immediate: new MemoryHierarchy('immediate', { ttl: 86400000 }), // 1 day
      working: new MemoryHierarchy('working', { ttl: 604800000 }), // 1 week
      episodic: new MemoryHierarchy('episodic', { ttl: 2592000000 }), // 30 days
      semantic: new MemoryHierarchy('semantic', { ttl: null }), // No expiry
      procedural: new MemoryHierarchy('procedural', { ttl: null }) // No expiry
    };

    // Version control
    this.versions = new Map();
    this.currentVersion = null;
    this.versionTree = new VersionTree();
    
    // Conflict resolution
    this.conflictResolver = new ConflictResolver(this.config.mergeStrategy);
    
    // Track intervals for cleanup
    this.intervals = new Set();
    
    // Memory indices
    this.indices = {
      temporal: new TemporalIndex(),
      semantic: new SemanticIndex(),
      relational: new RelationalIndex()
    };

    this.initialize();
  }

  async initialize() {
    // Ensure directory structure
    await this.ensureDirectoryStructure();
    
    // Load existing memories
    await this.loadMemories();
    
    // Start snapshot timer
    this.startSnapshotTimer();
    
    // Start consolidation monitor
    this.startConsolidationMonitor();
    
    logger.info('🟢 Persistent Memory Manager initialized');
  }

  /**
   * Store memory with versioning
   */
  async store(key, data, options = {}) {
    const memory = {
      key,
      data,
      timestamp: Date.now(),
      version: await this.generateVersion(),
      hierarchy: options.hierarchy || 'working',
      metadata: {
        tags: options.tags || [],
        relations: options.relations || [],
        importance: options.importance || 0.5,
        ttl: options.ttl || this.getTTL(options.hierarchy || 'working'),
        compressed: false,
        encrypted: options.encrypted || false
      }
    };

    // Compress if needed
    if (this.shouldCompress(memory)) {
      memory.data = await this.compress(memory.data);
      memory.metadata.compressed = true;
    }

    // Get hierarchy
    const hierarchy = this.hierarchies[memory.hierarchy];
    if (!hierarchy) {
      throw new Error(`Unknown hierarchy: ${memory.hierarchy}`);
    }

    // Check for existing memory
    const existing = await hierarchy.get(key);
    
    if (existing) {
      // Create new version
      memory.previousVersion = existing.version;
      await this.createVersion(memory, existing);
    }

    // Store in hierarchy
    await hierarchy.set(key, memory);
    
    // Update indices
    await this.updateIndices(memory);
    
    // Persist to disk
    await this.persistMemory(memory);
    
    this.emit('memory-stored', { key, hierarchy: memory.hierarchy, version: memory.version });
    
    return memory.version;
  }

  /**
   * Retrieve memory with version support
   */
  async retrieve(key, options = {}) {
    const version = options.version;
    const hierarchy = options.hierarchy;
    
    // If specific version requested
    if (version) {
      return await this.retrieveVersion(key, version);
    }
    
    // Search hierarchies
    const searchOrder = hierarchy ? [hierarchy] : ['immediate', 'working', 'episodic', 'semantic', 'procedural'];
    
    for (const h of searchOrder) {
      const memory = await this.hierarchies[h].get(key);
      if (memory) {
        // Decompress if needed
        if (memory.metadata.compressed) {
          memory.data = await this.decompress(memory.data);
        }
        
        // Update access time
        memory.lastAccessed = Date.now();
        await this.hierarchies[h].updateAccess(key);
        
        return memory;
      }
    }
    
    return null;
  }

  /**
   * Merge concurrent edits
   */
  async merge(key, localVersion, remoteVersion) {
    const localMemory = await this.retrieveVersion(key, localVersion);
    const remoteMemory = await this.retrieveVersion(key, remoteVersion);
    
    if (!localMemory || !remoteMemory) {
      throw new Error('Cannot merge: missing versions');
    }
    
    // Find common ancestor
    const ancestor = await this.findCommonAncestor(localVersion, remoteVersion);
    const ancestorMemory = ancestor ? await this.retrieveVersion(key, ancestor) : null;
    
    // Perform three-way merge
    const merged = await this.conflictResolver.merge(
      ancestorMemory?.data || {},
      localMemory.data,
      remoteMemory.data
    );
    
    // Create merged version
    const mergedMemory = {
      key,
      data: merged.data,
      conflicts: merged.conflicts,
      timestamp: Date.now(),
      version: await this.generateVersion(),
      hierarchy: localMemory.hierarchy,
      metadata: this.mergeMetadata(localMemory.metadata, remoteMemory.metadata),
      parents: [localVersion, remoteVersion]
    };
    
    // Store merged version
    await this.store(key, mergedMemory.data, {
      hierarchy: mergedMemory.hierarchy,
      ...mergedMemory.metadata
    });
    
    return {
      version: mergedMemory.version,
      conflicts: merged.conflicts,
      resolved: merged.conflicts.length === 0
    };
  }

  /**
   * Consolidate memories
   */
  async consolidate() {
    logger.info('🟢 Starting memory consolidation');
    
    const consolidated = {
      promoted: 0,
      archived: 0,
      expired: 0,
      compressed: 0
    };
    
    // Process each hierarchy
    for (const [name, hierarchy] of Object.entries(this.hierarchies)) {
      const memories = await hierarchy.getAll();
      
      for (const memory of memories) {
        // Check expiry
        if (this.isExpired(memory)) {
          await this.archive(memory);
          await hierarchy.delete(memory.key);
          consolidated.expired++;
          continue;
        }
        
        // Check for promotion
        const promotion = await this.checkPromotion(memory);
        if (promotion) {
          await this.promoteMemory(memory, promotion);
          consolidated.promoted++;
        }
        
        // Compress old uncompressed memories
        if (!memory.metadata.compressed && this.shouldCompress(memory)) {
          memory.data = await this.compress(memory.data);
          memory.metadata.compressed = true;
          await hierarchy.update(memory.key, memory);
          consolidated.compressed++;
        }
      }
    }
    
    // Consolidate similar memories in semantic hierarchy
    const semanticConsolidation = await this.consolidateSemanticMemories();
    consolidated.semanticMerged = semanticConsolidation.merged;
    
    logger.info('🟢 Consolidation complete:', consolidated);
    
    return consolidated;
  }

  /**
   * Check if memory should be promoted
   */
  async checkPromotion(memory) {
    const age = Date.now() - memory.timestamp;
    const accessCount = memory.accessCount || 0;
    const importance = memory.metadata.importance;
    
    // Immediate -> Working
    if (memory.hierarchy === 'immediate' && age > 3600000) { // 1 hour
      if (accessCount > 2 || importance > 0.7) {
        return 'working';
      }
    }
    
    // Working -> Episodic
    if (memory.hierarchy === 'working' && age > 86400000) { // 1 day
      if (accessCount > 5 || importance > 0.8) {
        return 'episodic';
      }
    }
    
    // Episodic -> Semantic (requires consolidation)
    if (memory.hierarchy === 'episodic' && age > 604800000) { // 1 week
      const similar = await this.findSimilarMemories(memory);
      if (similar.length >= 3) {
        return 'semantic';
      }
    }
    
    return null;
  }

  /**
   * Promote memory to higher hierarchy
   */
  async promoteMemory(memory, targetHierarchy) {
    const sourceHierarchy = this.hierarchies[memory.hierarchy];
    const targetHier = this.hierarchies[targetHierarchy];
    
    // Remove from source
    await sourceHierarchy.delete(memory.key);
    
    // Update hierarchy
    memory.hierarchy = targetHierarchy;
    memory.promotedAt = Date.now();
    
    // Store in target
    await targetHier.set(memory.key, memory);
    
    // Update indices
    await this.updateIndices(memory);
    
    this.emit('memory-promoted', {
      key: memory.key,
      from: sourceHierarchy.name,
      to: targetHierarchy
    });
  }

  /**
   * Consolidate semantic memories
   */
  async consolidateSemanticMemories() {
    const semantic = this.hierarchies.semantic;
    const memories = await semantic.getAll();
    
    // Group similar memories
    const groups = await this.groupSimilarMemories(memories);
    let merged = 0;
    
    for (const group of groups) {
      if (group.length < 2) {continue;}
      
      // Create consolidated memory
      const consolidated = await this.createConsolidatedMemory(group);
      
      // Store consolidated version
      await semantic.set(consolidated.key, consolidated);
      
      // Archive individual memories
      for (const memory of group) {
        if (memory.key !== consolidated.key) {
          await semantic.delete(memory.key);
          await this.archive(memory);
          merged++;
        }
      }
    }
    
    return { merged };
  }

  /**
   * Create consolidated memory from group
   */
  async createConsolidatedMemory(group) {
    // Extract common patterns
    const commonData = this.extractCommonData(group);
    const variations = this.extractVariations(group);
    
    return {
      key: `consolidated_${crypto.randomBytes(8).toString('hex')}`,
      data: {
        type: 'consolidated',
        common: commonData,
        variations: variations,
        source_count: group.length,
        confidence: this.calculateGroupConfidence(group)
      },
      timestamp: Date.now(),
      version: await this.generateVersion(),
      hierarchy: 'semantic',
      metadata: {
        tags: this.mergeTags(group),
        importance: Math.max(...group.map(m => m.metadata.importance)),
        consolidated: true,
        sources: group.map(m => m.key)
      }
    };
  }

  /**
   * Find similar memories using indices
   */
  async findSimilarMemories(memory) {
    const candidates = new Set();
    
    // Semantic similarity
    const semanticSimilar = await this.indices.semantic.findSimilar(memory, 0.8);
    semanticSimilar.forEach(m => candidates.add(m));
    
    // Temporal proximity
    const temporalNear = await this.indices.temporal.findNearby(memory.timestamp, 3600000); // 1 hour
    temporalNear.forEach(m => candidates.add(m));
    
    // Relational connections
    const related = await this.indices.relational.findRelated(memory.key);
    related.forEach(m => candidates.add(m));
    
    return Array.from(candidates);
  }

  /**
   * Version management
   */
  async generateVersion() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `v${timestamp}-${random}`;
  }

  async createVersion(newMemory, oldMemory) {
    const version = {
      id: newMemory.version,
      parent: oldMemory.version,
      timestamp: newMemory.timestamp,
      changes: this.diffMemories(oldMemory, newMemory),
      author: process.env.USER || 'system'
    };
    
    this.versions.set(version.id, version);
    this.versionTree.addVersion(version);
    
    // Prune old versions
    await this.pruneVersions(newMemory.key);
  }

  async pruneVersions(key) {
    const versions = this.versionTree.getVersionsForKey(key);
    
    if (versions.length > this.config.maxVersions) {
      // Keep important versions
      const toKeep = this.selectVersionsToKeep(versions);
      const toRemove = versions.filter(v => !toKeep.includes(v));
      
      for (const version of toRemove) {
        await this.removeVersion(version);
      }
    }
  }

  /**
   * Persistence operations
   */
  async persistMemory(memory) {
    const filepath = this.getMemoryPath(memory);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    
    const persistData = {
      ...memory,
      persisted_at: Date.now()
    };
    
    await fs.writeFile(filepath, JSON.stringify(persistData, null, 2));
  }

  async loadMemories() {
    try {
      // Load each hierarchy
      for (const [name, hierarchy] of Object.entries(this.hierarchies)) {
        const hierarchyPath = path.join(this.config.basePath, name);
        
        try {
          const files = await fs.readdir(hierarchyPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filepath = path.join(hierarchyPath, file);
              const data = await fs.readFile(filepath, 'utf8');
              const memory = JSON.parse(data);
              
              await hierarchy.set(memory.key, memory);
              await this.updateIndices(memory);
            }
          }
        } catch (error) {
          // Directory might not exist yet
          if (error.code !== 'ENOENT') {
            logger.error(`Failed to load ${name} hierarchy:`, error);
          }
        }
      }
      
      // Load version tree
      await this.loadVersionTree();
      
    } catch (error) {
      logger.error('Failed to load memories:', error);
    }
  }

  /**
   * Utility methods
   */
  getMemoryPath(memory) {
    const safeKey = memory.key.replace(/[^a-z0-9]/gi, '_');
    return path.join(
      this.config.basePath,
      memory.hierarchy,
      `${safeKey}_${memory.version}.json`
    );
  }

  getTTL(hierarchy) {
    const ttls = {
      immediate: 86400000, // 1 day
      working: 604800000, // 1 week
      episodic: 2592000000, // 30 days
      semantic: null,
      procedural: null
    };
    return ttls[hierarchy];
  }

  isExpired(memory) {
    if (!memory.metadata.ttl) {return false;}
    return Date.now() > memory.timestamp + memory.metadata.ttl;
  }

  shouldCompress(memory) {
    const size = JSON.stringify(memory.data).length;
    return size > this.config.compressionThreshold;
  }

  async ensureDirectoryStructure() {
    const dirs = [
      this.config.basePath,
      ...Object.keys(this.hierarchies).map(h => path.join(this.config.basePath, h)),
      path.join(this.config.basePath, 'archive'),
      path.join(this.config.basePath, 'versions')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  startSnapshotTimer() {
    const snapshotInterval = setInterval(async () => {
      await this.createSnapshot();
    }, this.config.snapshotInterval);
    this.intervals.add(snapshotInterval);
  }

  startConsolidationMonitor() {
    const consolidationInterval = setInterval(async () => {
      const totalMemories = await this.getTotalMemoryCount();
      if (totalMemories > this.config.consolidationThreshold) {
        await this.consolidate();
      }
    }, 300000); // Check every 5 minutes
    this.intervals.add(consolidationInterval);
  }

  async getTotalMemoryCount() {
    let count = 0;
    for (const hierarchy of Object.values(this.hierarchies)) {
      count += await hierarchy.count();
    }
    return count;
  }
  
  /**
   * Clean up resources and stop all intervals
   */
  async cleanup() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    logger.info('🟢 Persistent memory manager cleaned up');
  }
}

/**
 * Memory Hierarchy Implementation
 */
class MemoryHierarchy {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.memories = new Map();
    this.accessCounts = new Map();
  }

  async set(key, memory) {
    this.memories.set(key, memory);
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
  }

  async get(key) {
    const memory = this.memories.get(key);
    if (memory) {
      this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
      memory.accessCount = this.accessCounts.get(key);
    }
    return memory;
  }

  async delete(key) {
    this.memories.delete(key);
    this.accessCounts.delete(key);
  }

  async update(key, memory) {
    if (this.memories.has(key)) {
      this.memories.set(key, memory);
    }
  }

  async updateAccess(key) {
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
  }

  async getAll() {
    return Array.from(this.memories.values());
  }

  async count() {
    return this.memories.size;
  }
}

/**
 * Version Tree for tracking memory versions
 */
class VersionTree {
  constructor() {
    this.nodes = new Map();
    this.keyVersions = new Map();
  }

  addVersion(version) {
    this.nodes.set(version.id, version);
    
    // Track versions by key
    const key = version.key || 'unknown';
    if (!this.keyVersions.has(key)) {
      this.keyVersions.set(key, []);
    }
    this.keyVersions.get(key).push(version.id);
  }

  getVersionsForKey(key) {
    return this.keyVersions.get(key) || [];
  }

  findCommonAncestor(version1, version2) {
    const ancestors1 = this.getAncestors(version1);
    const ancestors2 = this.getAncestors(version2);
    
    // Find first common ancestor
    for (const ancestor of ancestors1) {
      if (ancestors2.includes(ancestor)) {
        return ancestor;
      }
    }
    
    return null;
  }

  getAncestors(versionId) {
    const ancestors = [];
    let current = versionId;
    
    while (current) {
      ancestors.push(current);
      const node = this.nodes.get(current);
      current = node?.parent;
    }
    
    return ancestors;
  }
}

/**
 * Conflict Resolution for merging
 */
class ConflictResolver {
  constructor(strategy = 'semantic') {
    this.strategy = strategy;
  }

  async merge(ancestor, local, remote) {
    const conflicts = [];
    const merged = {};
    
    switch (this.strategy) {
      case 'semantic':
        return this.semanticMerge(ancestor, local, remote);
      case 'last-write-wins':
        return { data: remote, conflicts: [] };
      case 'manual':
        return this.manualMerge(ancestor, local, remote);
      default:
        return this.threewayMerge(ancestor, local, remote);
    }
  }

  semanticMerge(ancestor, local, remote) {
    const merged = {};
    const conflicts = [];
    
    // Get all keys
    const allKeys = new Set([
      ...Object.keys(ancestor || {}),
      ...Object.keys(local),
      ...Object.keys(remote)
    ]);
    
    for (const key of allKeys) {
      const ancestorVal = ancestor?.[key];
      const localVal = local[key];
      const remoteVal = remote[key];
      
      // No conflict cases
      if (localVal === remoteVal) {
        merged[key] = localVal;
      } else if (localVal === ancestorVal) {
        merged[key] = remoteVal;
      } else if (remoteVal === ancestorVal) {
        merged[key] = localVal;
      } else {
        // Conflict - try to merge semantically
        const semanticMergeResult = this.attemptSemanticMerge(key, localVal, remoteVal);
        
        if (semanticMergeResult.success) {
          merged[key] = semanticMergeResult.value;
        } else {
          conflicts.push({
            key,
            local: localVal,
            remote: remoteVal,
            ancestor: ancestorVal
          });
          // Default to local
          merged[key] = localVal;
        }
      }
    }
    
    return { data: merged, conflicts };
  }

  attemptSemanticMerge(key, localVal, remoteVal) {
    // Arrays - merge unique values
    if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
      const merged = [...new Set([...localVal, ...remoteVal])];
      return { success: true, value: merged };
    }
    
    // Numbers - average if close
    if (typeof localVal === 'number' && typeof remoteVal === 'number') {
      const diff = Math.abs(localVal - remoteVal);
      const avg = (localVal + remoteVal) / 2;
      
      if (diff / avg < 0.1) { // Within 10%
        return { success: true, value: avg };
      }
    }
    
    // Objects - recursive merge
    if (typeof localVal === 'object' && typeof remoteVal === 'object') {
      const subMerge = this.semanticMerge({}, localVal, remoteVal);
      if (subMerge.conflicts.length === 0) {
        return { success: true, value: subMerge.data };
      }
    }
    
    return { success: false };
  }
}

/**
 * Memory Indices for efficient searching
 */
class TemporalIndex {
  constructor() {
    this.timeline = [];
  }

  add(memory) {
    this.timeline.push({
      timestamp: memory.timestamp,
      key: memory.key,
      hierarchy: memory.hierarchy
    });
    this.timeline.sort((a, b) => a.timestamp - b.timestamp);
  }

  findNearby(timestamp, windowMs) {
    const start = timestamp - windowMs;
    const end = timestamp + windowMs;
    
    return this.timeline.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );
  }

  findInRange(start, end) {
    return this.timeline.filter(entry =>
      entry.timestamp >= start && entry.timestamp <= end
    );
  }
}

class SemanticIndex {
  constructor() {
    this.vectors = new Map();
  }

  add(memory) {
    // Simple semantic indexing - in production would use embeddings
    const vector = this.createVector(memory);
    this.vectors.set(memory.key, {
      vector,
      memory: memory.key
    });
  }

  async findSimilar(memory, threshold = 0.8) {
    const targetVector = this.createVector(memory);
    const similar = [];
    
    for (const [key, entry] of this.vectors) {
      if (key === memory.key) {continue;}
      
      const similarity = this.cosineSimilarity(targetVector, entry.vector);
      if (similarity >= threshold) {
        similar.push({
          key: entry.memory,
          similarity
        });
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  createVector(memory) {
    // Simplified vector creation - extract features
    const text = JSON.stringify(memory.data).toLowerCase();
    const features = {};
    
    // Word frequency
    const words = text.match(/\w+/g) || [];
    for (const word of words) {
      features[word] = (features[word] || 0) + 1;
    }
    
    return features;
  }

  cosineSimilarity(vec1, vec2) {
    const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const key of keys) {
      const val1 = vec1[key] || 0;
      const val2 = vec2[key] || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }
    
    if (norm1 === 0 || norm2 === 0) {return 0;}
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

class RelationalIndex {
  constructor() {
    this.relations = new Map();
  }

  add(memory) {
    const key = memory.key;
    
    if (!this.relations.has(key)) {
      this.relations.set(key, new Set());
    }
    
    // Add relations from metadata
    if (memory.metadata.relations) {
      for (const relation of memory.metadata.relations) {
        this.relations.get(key).add(relation);
        
        // Bidirectional relation
        if (!this.relations.has(relation)) {
          this.relations.set(relation, new Set());
        }
        this.relations.get(relation).add(key);
      }
    }
  }

  findRelated(key, depth = 1) {
    const visited = new Set([key]);
    const related = [];
    
    let currentLevel = [key];
    
    for (let d = 0; d < depth; d++) {
      const nextLevel = [];
      
      for (const current of currentLevel) {
        const directRelations = this.relations.get(current) || new Set();
        
        for (const relation of directRelations) {
          if (!visited.has(relation)) {
            visited.add(relation);
            related.push({
              key: relation,
              distance: d + 1
            });
            nextLevel.push(relation);
          }
        }
      }
      
      currentLevel = nextLevel;
    }
    
    return related;
  }
}

// Export singleton
let instance = null;

module.exports = {
  PersistentMemoryManager,
  
  getInstance(config) {
    if (!instance) {
      instance = new PersistentMemoryManager(config);
    }
    return instance;
  }
};