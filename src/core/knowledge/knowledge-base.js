/**
 * BUMBA Knowledge Base System
 * Central repository for all framework knowledge
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getConfig } = require('../config/bumba-config');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class KnowledgeBase extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      basePath: config.basePath || path.join(process.cwd(), '.bumba', 'knowledge-base'),
      maxEntries: config.maxEntries || 10000,
      indexUpdateInterval: config.indexUpdateInterval || 60000, // 1 minute
      autoSave: config.autoSave !== false,
      compression: config.compression !== false,
      ...this.loadConfigFromEnvironment()
    };
    
    // Knowledge storage
    this.entries = new Map();
    this.categories = new Map();
    this.tags = new Map();
    this.relationships = new Map();
    
    // Indexing for fast retrieval
    this.index = {
      byId: new Map(),
      byCategory: new Map(),
      byTag: new Map(),
      byType: new Map(),
      byAuthor: new Map(),
      byDate: new Map(),
      fullText: new Map()
    };
    
    // Statistics
    this.stats = {
      totalEntries: 0,
      categoriesCount: 0,
      tagsCount: 0,
      queriesExecuted: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdated: null
    };
    
    // Query cache for performance
    this.queryCache = new Map();
    this.maxCacheSize = 100;
    
    this.initialize();
  }
  
  /**
   * Load configuration from environment variables
   */
  loadConfigFromEnvironment() {
    const config = {};
    
    if (process.env.BUMBA_KNOWLEDGE_BASE_PATH) {
      config.basePath = process.env.BUMBA_KNOWLEDGE_BASE_PATH;
    }
    
    if (process.env.BUMBA_KNOWLEDGE_MAX_ENTRIES) {
      config.maxEntries = parseInt(process.env.BUMBA_KNOWLEDGE_MAX_ENTRIES);
    }
    
    if (process.env.BUMBA_KNOWLEDGE_AUTO_SAVE) {
      config.autoSave = process.env.BUMBA_KNOWLEDGE_AUTO_SAVE === 'true';
    }
    
    return config;
  }
  
  /**
   * Initialize the knowledge base
   */
  async initialize() {
    try {
      // Create base directory
      await fs.mkdir(this.config.basePath, { recursive: true });
      
      // Load existing knowledge
      await this.loadFromDisk();
      
      // Start index update interval
      if (this.config.indexUpdateInterval > 0) {
        this.indexInterval = setInterval(() => {
          this.rebuildIndex();
        }, this.config.indexUpdateInterval);
      }
      
      logger.info('🟡 Knowledge Base initialized');
      this.emit('initialized', { entriesLoaded: this.entries.size });
      
    } catch (error) {
      logger.error('Failed to initialize Knowledge Base:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Add a knowledge entry
   */
  async add(entry) {
    try {
      // Validate entry
      this.validateEntry(entry);
      
      // Generate ID if not provided
      if (!entry.id) {
        entry.id = this.generateId(entry);
      }
      
      // Add metadata
      entry.created = entry.created || new Date().toISOString();
      entry.updated = new Date().toISOString();
      entry.version = (entry.version || 0) + 1;
      
      // Store entry
      this.entries.set(entry.id, entry);
      
      // Update categories
      if (entry.category) {
        if (!this.categories.has(entry.category)) {
          this.categories.set(entry.category, new Set());
        }
        this.categories.get(entry.category).add(entry.id);
      }
      
      // Update tags
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          if (!this.tags.has(tag)) {
            this.tags.set(tag, new Set());
          }
          this.tags.get(tag).add(entry.id);
        });
      }
      
      // Update relationships
      if (entry.relatedTo && Array.isArray(entry.relatedTo)) {
        this.relationships.set(entry.id, new Set(entry.relatedTo));
      }
      
      // Update index
      this.indexEntry(entry);
      
      // Update stats
      this.stats.totalEntries = this.entries.size;
      this.stats.categoriesCount = this.categories.size;
      this.stats.tagsCount = this.tags.size;
      this.stats.lastUpdated = new Date().toISOString();
      
      // Clear query cache
      this.queryCache.clear();
      
      // Auto-save if enabled
      if (this.config.autoSave) {
        await this.saveEntry(entry);
      }
      
      // Emit event
      this.emit('entry:added', entry);
      
      logger.info(`📚 Added knowledge entry: ${entry.id}`);
      return entry;
      
    } catch (error) {
      logger.error('Failed to add knowledge entry:', error);
      throw error;
    }
  }
  
  /**
   * Get a knowledge entry by ID
   */
  get(id) {
    const entry = this.entries.get(id);
    
    if (entry) {
      this.stats.cacheHits++;
      this.emit('entry:accessed', { id, found: true });
    } else {
      this.stats.cacheMisses++;
      this.emit('entry:accessed', { id, found: false });
    }
    
    return entry;
  }
  
  /**
   * Update a knowledge entry
   */
  async update(id, updates) {
    try {
      const entry = this.entries.get(id);
      
      if (!entry) {
        throw new Error(`Knowledge entry not found: ${id}`);
      }
      
      // Merge updates
      const updatedEntry = {
        ...entry,
        ...updates,
        id: entry.id, // Preserve ID
        created: entry.created, // Preserve creation date
        updated: new Date().toISOString(),
        version: entry.version + 1
      };
      
      // Validate updated entry
      this.validateEntry(updatedEntry);
      
      // Update storage
      this.entries.set(id, updatedEntry);
      
      // Update indexes
      this.removeFromIndex(entry);
      this.indexEntry(updatedEntry);
      
      // Clear query cache
      this.queryCache.clear();
      
      // Auto-save if enabled
      if (this.config.autoSave) {
        await this.saveEntry(updatedEntry);
      }
      
      // Emit event
      this.emit('entry:updated', { old: entry, new: updatedEntry });
      
      logger.info(`📝 Updated knowledge entry: ${id}`);
      return updatedEntry;
      
    } catch (error) {
      logger.error(`Failed to update knowledge entry ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a knowledge entry
   */
  async delete(id) {
    try {
      const entry = this.entries.get(id);
      
      if (!entry) {
        return false;
      }
      
      // Remove from storage
      this.entries.delete(id);
      
      // Remove from categories
      if (entry.category && this.categories.has(entry.category)) {
        this.categories.get(entry.category).delete(id);
      }
      
      // Remove from tags
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          if (this.tags.has(tag)) {
            this.tags.get(tag).delete(id);
          }
        });
      }
      
      // Remove from relationships
      this.relationships.delete(id);
      
      // Remove from index
      this.removeFromIndex(entry);
      
      // Update stats
      this.stats.totalEntries = this.entries.size;
      
      // Clear query cache
      this.queryCache.clear();
      
      // Remove from disk if auto-save enabled
      if (this.config.autoSave) {
        await this.deleteFromDisk(id);
      }
      
      // Emit event
      this.emit('entry:deleted', entry);
      
      logger.info(`🗑️ Deleted knowledge entry: ${id}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to delete knowledge entry ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Query the knowledge base
   */
  query(options = {}) {
    try {
      // Check cache first
      const cacheKey = JSON.stringify(options);
      if (this.queryCache.has(cacheKey)) {
        this.stats.cacheHits++;
        return this.queryCache.get(cacheKey);
      }
      
      let results = Array.from(this.entries.values());
      
      // Filter by category
      if (options.category) {
        const categoryEntries = this.categories.get(options.category);
        if (categoryEntries) {
          results = results.filter(e => categoryEntries.has(e.id));
        } else {
          results = [];
        }
      }
      
      // Filter by tags
      if (options.tags && Array.isArray(options.tags)) {
        results = results.filter(entry => {
          return options.tags.some(tag => entry.tags && entry.tags.includes(tag));
        });
      }
      
      // Filter by type
      if (options.type) {
        results = results.filter(e => e.type === options.type);
      }
      
      // Filter by author
      if (options.author) {
        results = results.filter(e => e.author === options.author);
      }
      
      // Filter by date range
      if (options.startDate || options.endDate) {
        results = results.filter(entry => {
          const entryDate = new Date(entry.created);
          if (options.startDate && entryDate < new Date(options.startDate)) {
            return false;
          }
          if (options.endDate && entryDate > new Date(options.endDate)) {
            return false;
          }
          return true;
        });
      }
      
      // Full-text search
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        results = results.filter(entry => {
          const searchableText = [
            entry.title,
            entry.content,
            entry.description,
            ...(entry.tags || [])
          ].join(' ').toLowerCase();
          
          return searchableText.includes(searchTerm);
        });
      }
      
      // Sort results
      if (options.sortBy) {
        results.sort((a, b) => {
          const aVal = a[options.sortBy];
          const bVal = b[options.sortBy];
          
          if (options.sortOrder === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }
      
      // Limit results
      if (options.limit) {
        results = results.slice(0, options.limit);
      }
      
      // Cache the results
      if (this.queryCache.size >= this.maxCacheSize) {
        const firstKey = this.queryCache.keys().next().value;
        this.queryCache.delete(firstKey);
      }
      this.queryCache.set(cacheKey, results);
      
      this.stats.queriesExecuted++;
      this.stats.cacheMisses++;
      
      return results;
      
    } catch (error) {
      logger.error('Query failed:', error);
      throw error;
    }
  }
  
  /**
   * Get related entries
   */
  getRelated(id, depth = 1) {
    const entry = this.entries.get(id);
    if (!entry) {
      return [];
    }
    
    const related = new Set();
    const visited = new Set([id]);
    
    const explore = (entryId, currentDepth) => {
      if (currentDepth > depth) return;
      
      const relations = this.relationships.get(entryId);
      if (!relations) return;
      
      relations.forEach(relatedId => {
        if (!visited.has(relatedId)) {
          visited.add(relatedId);
          const relatedEntry = this.entries.get(relatedId);
          if (relatedEntry) {
            related.add(relatedEntry);
            explore(relatedId, currentDepth + 1);
          }
        }
      });
    };
    
    explore(id, 1);
    
    return Array.from(related);
  }
  
  /**
   * Validate entry structure
   */
  validateEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Entry must be an object');
    }
    
    if (!entry.title && !entry.content) {
      throw new Error('Entry must have title or content');
    }
    
    if (entry.tags && !Array.isArray(entry.tags)) {
      throw new Error('Tags must be an array');
    }
    
    if (entry.relatedTo && !Array.isArray(entry.relatedTo)) {
      throw new Error('RelatedTo must be an array');
    }
    
    return true;
  }
  
  /**
   * Generate unique ID for entry
   */
  generateId(entry) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({
      title: entry.title,
      category: entry.category,
      timestamp: Date.now(),
      random: Math.random()
    }));
    return `kb_${hash.digest('hex').substring(0, 12)}`;
  }
  
  /**
   * Index an entry for fast retrieval
   */
  indexEntry(entry) {
    // Index by ID
    this.index.byId.set(entry.id, entry);
    
    // Index by category
    if (entry.category) {
      if (!this.index.byCategory.has(entry.category)) {
        this.index.byCategory.set(entry.category, new Set());
      }
      this.index.byCategory.get(entry.category).add(entry.id);
    }
    
    // Index by tags
    if (entry.tags) {
      entry.tags.forEach(tag => {
        if (!this.index.byTag.has(tag)) {
          this.index.byTag.set(tag, new Set());
        }
        this.index.byTag.get(tag).add(entry.id);
      });
    }
    
    // Index by type
    if (entry.type) {
      if (!this.index.byType.has(entry.type)) {
        this.index.byType.set(entry.type, new Set());
      }
      this.index.byType.get(entry.type).add(entry.id);
    }
    
    // Index by author
    if (entry.author) {
      if (!this.index.byAuthor.has(entry.author)) {
        this.index.byAuthor.set(entry.author, new Set());
      }
      this.index.byAuthor.get(entry.author).add(entry.id);
    }
    
    // Index by date
    if (entry.created) {
      const dateKey = entry.created.split('T')[0];
      if (!this.index.byDate.has(dateKey)) {
        this.index.byDate.set(dateKey, new Set());
      }
      this.index.byDate.get(dateKey).add(entry.id);
    }
  }
  
  /**
   * Remove entry from index
   */
  removeFromIndex(entry) {
    // Remove from all indexes
    this.index.byId.delete(entry.id);
    
    if (entry.category && this.index.byCategory.has(entry.category)) {
      this.index.byCategory.get(entry.category).delete(entry.id);
    }
    
    if (entry.tags) {
      entry.tags.forEach(tag => {
        if (this.index.byTag.has(tag)) {
          this.index.byTag.get(tag).delete(entry.id);
        }
      });
    }
    
    if (entry.type && this.index.byType.has(entry.type)) {
      this.index.byType.get(entry.type).delete(entry.id);
    }
    
    if (entry.author && this.index.byAuthor.has(entry.author)) {
      this.index.byAuthor.get(entry.author).delete(entry.id);
    }
    
    if (entry.created) {
      const dateKey = entry.created.split('T')[0];
      if (this.index.byDate.has(dateKey)) {
        this.index.byDate.get(dateKey).delete(entry.id);
      }
    }
  }
  
  /**
   * Rebuild all indexes
   */
  rebuildIndex() {
    logger.info('🔄 Rebuilding knowledge base index...');
    
    // Clear existing indexes
    Object.values(this.index).forEach(index => index.clear());
    
    // Rebuild from entries
    this.entries.forEach(entry => {
      this.indexEntry(entry);
    });
    
    logger.info('🏁 Index rebuilt successfully');
  }
  
  /**
   * Save entry to disk
   */
  async saveEntry(entry) {
    try {
      const filename = `${entry.id}.json`;
      const filepath = path.join(this.config.basePath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(entry, null, 2));
      
    } catch (error) {
      logger.error(`Failed to save entry ${entry.id}:`, error);
    }
  }
  
  /**
   * Delete entry from disk
   */
  async deleteFromDisk(id) {
    try {
      const filename = `${id}.json`;
      const filepath = path.join(this.config.basePath, filename);
      
      await fs.unlink(filepath);
      
    } catch (error) {
      logger.error(`Failed to delete entry file ${id}:`, error);
    }
  }
  
  /**
   * Load knowledge from disk
   */
  async loadFromDisk() {
    try {
      const files = await fs.readdir(this.config.basePath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filepath = path.join(this.config.basePath, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const entry = JSON.parse(content);
          
          // Add to knowledge base without saving
          const originalAutoSave = this.config.autoSave;
          this.config.autoSave = false;
          await this.add(entry);
          this.config.autoSave = originalAutoSave;
          
        } catch (error) {
          logger.warn(`Failed to load knowledge file ${file}:`, error);
        }
      }
      
      logger.info(`📚 Loaded ${this.entries.size} knowledge entries from disk`);
      
    } catch (error) {
      logger.warn('Failed to load knowledge from disk:', error);
    }
  }
  
  /**
   * Save all entries to disk
   */
  async saveAll() {
    try {
      let saved = 0;
      
      for (const entry of this.entries.values()) {
        await this.saveEntry(entry);
        saved++;
      }
      
      logger.info(`💾 Saved ${saved} knowledge entries to disk`);
      return saved;
      
    } catch (error) {
      logger.error('Failed to save all entries:', error);
      throw error;
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      queryCache: {
        size: this.queryCache.size,
        maxSize: this.maxCacheSize
      },
      index: {
        byId: this.index.byId.size,
        byCategory: this.index.byCategory.size,
        byTag: this.index.byTag.size,
        byType: this.index.byType.size,
        byAuthor: this.index.byAuthor.size,
        byDate: this.index.byDate.size
      }
    };
  }
  
  /**
   * Clear all knowledge
   */
  async clear() {
    this.entries.clear();
    this.categories.clear();
    this.tags.clear();
    this.relationships.clear();
    this.queryCache.clear();
    
    Object.values(this.index).forEach(index => index.clear());
    
    this.stats.totalEntries = 0;
    this.stats.categoriesCount = 0;
    this.stats.tagsCount = 0;
    
    logger.info('🧹 Knowledge base cleared');
    this.emit('cleared');
  }
  
  /**
   * Destroy the knowledge base
   */
  destroy() {
    if (this.indexInterval) {
      clearInterval(this.indexInterval);
    }
    
    this.removeAllListeners();
    this.clear();
    
    logger.info('💥 Knowledge base destroyed');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  KnowledgeBase,
  getInstance: (config) => {
    if (!instance) {
      instance = new KnowledgeBase(config);
    }
    return instance;
  }
};