/**
 * BUMBA Reference System
 * API documentation, code references, and specification management
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getConfig } = require('../config/bumba-config');
const { KnowledgeBase, getInstance: getKnowledgeBase } = require('./knowledge-base');
const fs = require('fs').promises;
const path = require('path');

class ReferenceSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      referencePath: config.referencePath || path.join(process.cwd(), '.bumba', 'references'),
      autoIndex: config.autoIndex !== false,
      indexInterval: config.indexInterval || 300000, // 5 minutes
      maxReferenceSize: config.maxReferenceSize || 1000000, // 1MB
      supportedFormats: config.supportedFormats || ['md', 'json', 'yaml', 'js', 'ts'],
      ...this.loadConfigFromEnvironment()
    };
    
    // Reference storage
    this.references = new Map();
    this.apis = new Map();
    this.specifications = new Map();
    this.codeReferences = new Map();
    
    // Reference index for searching
    this.index = {
      byType: new Map(),
      byModule: new Map(),
      byTag: new Map(),
      byVersion: new Map(),
      fullText: new Map()
    };
    
    // Templates for generating references
    this.templates = {
      api: this.getApiTemplate(),
      specification: this.getSpecificationTemplate(),
      code: this.getCodeTemplate(),
      guide: this.getGuideTemplate()
    };
    
    // Metrics
    this.metrics = {
      referencesCreated: 0,
      referencesIndexed: 0,
      searchesPerformed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Search cache
    this.searchCache = new Map();
    this.maxCacheSize = 50;
    
    // Knowledge base integration
    this.knowledgeBase = null;
    
    this.initialize();
  }
  
  /**
   * Load configuration from environment
   */
  loadConfigFromEnvironment() {
    const config = {};
    
    if (process.env.BUMBA_REFERENCE_PATH) {
      config.referencePath = process.env.BUMBA_REFERENCE_PATH;
    }
    
    if (process.env.BUMBA_AUTO_INDEX) {
      config.autoIndex = process.env.BUMBA_AUTO_INDEX === 'true';
    }
    
    return config;
  }
  
  /**
   * Initialize reference system
   */
  async initialize() {
    try {
      // Create reference directory
      await fs.mkdir(this.config.referencePath, { recursive: true });
      
      // Initialize knowledge base connection
      this.knowledgeBase = getKnowledgeBase();
      
      // Load existing references
      await this.loadReferences();
      
      // Start auto-indexing if enabled
      if (this.config.autoIndex) {
        this.startAutoIndexing();
      }
      
      logger.info('📚 Reference System initialized');
      this.emit('initialized', { referencesLoaded: this.references.size });
      
    } catch (error) {
      logger.error('Failed to initialize Reference System:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Create an API reference
   */
  async createApiReference(options) {
    try {
      const reference = {
        id: options.id || this.generateReferenceId('api'),
        type: 'api',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: options.version || '1.0.0',
        
        // API details
        name: options.name,
        description: options.description,
        baseUrl: options.baseUrl,
        
        // Endpoints
        endpoints: options.endpoints || [],
        
        // Authentication
        authentication: options.authentication || {
          type: 'none',
          details: {}
        },
        
        // Request/Response schemas
        schemas: options.schemas || {},
        
        // Examples
        examples: options.examples || [],
        
        // Metadata
        metadata: {
          module: options.module,
          tags: options.tags || [],
          deprecated: options.deprecated || false,
          experimental: options.experimental || false
        }
      };
      
      // Process endpoints
      reference.endpoints = this.processEndpoints(reference.endpoints);
      
      // Store reference
      this.apis.set(reference.id, reference);
      this.references.set(reference.id, reference);
      
      // Index the reference
      await this.indexReference(reference);
      
      // Save to knowledge base
      await this.saveToKnowledgeBase(reference);
      
      // Persist to disk
      await this.persistReference(reference);
      
      // Update metrics
      this.metrics.referencesCreated++;
      
      // Emit event
      this.emit('reference:created', reference);
      
      logger.info(`📝 Created API reference: ${reference.name}`);
      return reference;
      
    } catch (error) {
      logger.error('Failed to create API reference:', error);
      throw error;
    }
  }
  
  /**
   * Create a specification reference
   */
  async createSpecification(options) {
    try {
      const specification = {
        id: options.id || this.generateReferenceId('spec'),
        type: 'specification',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: options.version || '1.0.0',
        
        // Specification details
        name: options.name,
        description: options.description,
        category: options.category || 'general',
        
        // Sections
        sections: options.sections || [],
        
        // Requirements
        requirements: options.requirements || [],
        
        // Constraints
        constraints: options.constraints || [],
        
        // Acceptance criteria
        acceptanceCriteria: options.acceptanceCriteria || [],
        
        // Related specifications
        related: options.related || [],
        
        // Metadata
        metadata: {
          status: options.status || 'draft',
          author: options.author,
          reviewers: options.reviewers || [],
          tags: options.tags || [],
          priority: options.priority || 'medium'
        }
      };
      
      // Store specification
      this.specifications.set(specification.id, specification);
      this.references.set(specification.id, specification);
      
      // Index the specification
      await this.indexReference(specification);
      
      // Save to knowledge base
      await this.saveToKnowledgeBase(specification);
      
      // Persist to disk
      await this.persistReference(specification);
      
      // Update metrics
      this.metrics.referencesCreated++;
      
      // Emit event
      this.emit('specification:created', specification);
      
      logger.info(`📋 Created specification: ${specification.name}`);
      return specification;
      
    } catch (error) {
      logger.error('Failed to create specification:', error);
      throw error;
    }
  }
  
  /**
   * Create a code reference
   */
  async createCodeReference(options) {
    try {
      const codeRef = {
        id: options.id || this.generateReferenceId('code'),
        type: 'code',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        
        // Code details
        name: options.name,
        description: options.description,
        language: options.language || 'javascript',
        
        // File information
        file: options.file,
        line: options.line,
        column: options.column,
        
        // Code content
        code: options.code,
        context: options.context || {},
        
        // Documentation
        documentation: options.documentation || '',
        examples: options.examples || [],
        
        // Related code
        imports: options.imports || [],
        exports: options.exports || [],
        dependencies: options.dependencies || [],
        
        // Metadata
        metadata: {
          module: options.module,
          package: options.package,
          tags: options.tags || [],
          complexity: options.complexity || 'medium',
          tested: options.tested || false
        }
      };
      
      // Store code reference
      this.codeReferences.set(codeRef.id, codeRef);
      this.references.set(codeRef.id, codeRef);
      
      // Index the reference
      await this.indexReference(codeRef);
      
      // Save to knowledge base
      await this.saveToKnowledgeBase(codeRef);
      
      // Persist to disk
      await this.persistReference(codeRef);
      
      // Update metrics
      this.metrics.referencesCreated++;
      
      // Emit event
      this.emit('code:referenced', codeRef);
      
      logger.info(`💻 Created code reference: ${codeRef.name}`);
      return codeRef;
      
    } catch (error) {
      logger.error('Failed to create code reference:', error);
      throw error;
    }
  }
  
  /**
   * Generate documentation from references
   */
  async generateDocumentation(options = {}) {
    try {
      const docs = {
        title: options.title || 'BUMBA CLI Reference',
        version: options.version || '1.0.0',
        generated: new Date().toISOString(),
        sections: []
      };
      
      // API Documentation
      if (options.includeApis !== false) {
        const apiDocs = this.generateApiDocumentation();
        docs.sections.push({
          title: 'API Reference',
          content: apiDocs
        });
      }
      
      // Specifications
      if (options.includeSpecifications !== false) {
        const specDocs = this.generateSpecificationDocumentation();
        docs.sections.push({
          title: 'Specifications',
          content: specDocs
        });
      }
      
      // Code References
      if (options.includeCode !== false) {
        const codeDocs = this.generateCodeDocumentation();
        docs.sections.push({
          title: 'Code Reference',
          content: codeDocs
        });
      }
      
      // Generate output
      const output = this.formatDocumentation(docs, options.format || 'markdown');
      
      // Save if path provided
      if (options.outputPath) {
        await fs.writeFile(options.outputPath, output);
        logger.info(`📄 Documentation saved to: ${options.outputPath}`);
      }
      
      return output;
      
    } catch (error) {
      logger.error('Failed to generate documentation:', error);
      throw error;
    }
  }
  
  /**
   * Search references
   */
  search(query, options = {}) {
    try {
      // Check cache
      const cacheKey = JSON.stringify({ query, options });
      if (this.searchCache.has(cacheKey)) {
        this.metrics.cacheHits++;
        return this.searchCache.get(cacheKey);
      }
      
      let results = [];
      
      // Search by type
      if (options.type) {
        const typeRefs = this.index.byType.get(options.type);
        if (typeRefs) {
          results = Array.from(typeRefs).map(id => this.references.get(id));
        }
      } else {
        results = Array.from(this.references.values());
      }
      
      // Filter by module
      if (options.module) {
        results = results.filter(ref => 
          ref.metadata && ref.metadata.module === options.module
        );
      }
      
      // Filter by tags
      if (options.tags && Array.isArray(options.tags)) {
        results = results.filter(ref => {
          const refTags = (ref.metadata && ref.metadata.tags) || [];
          return options.tags.some(tag => refTags.includes(tag));
        });
      }
      
      // Full-text search
      if (query) {
        const searchTerm = query.toLowerCase();
        results = results.filter(ref => {
          const searchableText = [
            ref.name,
            ref.description,
            ref.documentation,
            JSON.stringify(ref.metadata)
          ].join(' ').toLowerCase();
          
          return searchableText.includes(searchTerm);
        });
      }
      
      // Sort by relevance or date
      if (options.sortBy === 'relevance' && query) {
        results.sort((a, b) => {
          const aRelevance = this.calculateRelevance(a, query);
          const bRelevance = this.calculateRelevance(b, query);
          return bRelevance - aRelevance;
        });
      } else {
        results.sort((a, b) => 
          new Date(b.updated) - new Date(a.updated)
        );
      }
      
      // Limit results
      if (options.limit) {
        results = results.slice(0, options.limit);
      }
      
      // Cache results
      if (this.searchCache.size >= this.maxCacheSize) {
        const firstKey = this.searchCache.keys().next().value;
        this.searchCache.delete(firstKey);
      }
      this.searchCache.set(cacheKey, results);
      
      this.metrics.searchesPerformed++;
      this.metrics.cacheMisses++;
      
      return results;
      
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }
  
  /**
   * Get reference by ID
   */
  getReference(id) {
    return this.references.get(id);
  }
  
  /**
   * Update a reference
   */
  async updateReference(id, updates) {
    try {
      const reference = this.references.get(id);
      
      if (!reference) {
        throw new Error(`Reference not found: ${id}`);
      }
      
      // Merge updates
      const updatedRef = {
        ...reference,
        ...updates,
        id: reference.id,
        type: reference.type,
        created: reference.created,
        updated: new Date().toISOString()
      };
      
      // Update storage
      this.references.set(id, updatedRef);
      
      // Update type-specific storage
      switch (reference.type) {
        case 'api':
          this.apis.set(id, updatedRef);
          break;
        case 'specification':
          this.specifications.set(id, updatedRef);
          break;
        case 'code':
          this.codeReferences.set(id, updatedRef);
          break;
      }
      
      // Re-index
      await this.indexReference(updatedRef);
      
      // Update in knowledge base
      await this.updateInKnowledgeBase(updatedRef);
      
      // Persist to disk
      await this.persistReference(updatedRef);
      
      // Clear cache
      this.searchCache.clear();
      
      // Emit event
      this.emit('reference:updated', { old: reference, new: updatedRef });
      
      logger.info(`📝 Updated reference: ${id}`);
      return updatedRef;
      
    } catch (error) {
      logger.error(`Failed to update reference ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Process API endpoints
   */
  processEndpoints(endpoints) {
    return endpoints.map(endpoint => ({
      method: endpoint.method || 'GET',
      path: endpoint.path,
      description: endpoint.description,
      parameters: endpoint.parameters || [],
      requestBody: endpoint.requestBody || null,
      responses: endpoint.responses || {},
      examples: endpoint.examples || [],
      authentication: endpoint.authentication || false,
      deprecated: endpoint.deprecated || false
    }));
  }
  
  /**
   * Index a reference for searching
   */
  async indexReference(reference) {
    // Index by type
    if (!this.index.byType.has(reference.type)) {
      this.index.byType.set(reference.type, new Set());
    }
    this.index.byType.get(reference.type).add(reference.id);
    
    // Index by module
    if (reference.metadata && reference.metadata.module) {
      if (!this.index.byModule.has(reference.metadata.module)) {
        this.index.byModule.set(reference.metadata.module, new Set());
      }
      this.index.byModule.get(reference.metadata.module).add(reference.id);
    }
    
    // Index by tags
    if (reference.metadata && reference.metadata.tags) {
      reference.metadata.tags.forEach(tag => {
        if (!this.index.byTag.has(tag)) {
          this.index.byTag.set(tag, new Set());
        }
        this.index.byTag.get(tag).add(reference.id);
      });
    }
    
    // Index by version
    if (reference.version) {
      if (!this.index.byVersion.has(reference.version)) {
        this.index.byVersion.set(reference.version, new Set());
      }
      this.index.byVersion.get(reference.version).add(reference.id);
    }
    
    this.metrics.referencesIndexed++;
  }
  
  /**
   * Generate API documentation
   */
  generateApiDocumentation() {
    const apis = Array.from(this.apis.values());
    let doc = '## API References\n\n';
    
    apis.forEach(api => {
      doc += `### ${api.name}\n\n`;
      doc += `${api.description}\n\n`;
      doc += `**Base URL:** ${api.baseUrl || 'N/A'}\n`;
      doc += `**Version:** ${api.version}\n\n`;
      
      if (api.endpoints && api.endpoints.length > 0) {
        doc += '#### Endpoints\n\n';
        api.endpoints.forEach(endpoint => {
          doc += `##### ${endpoint.method} ${endpoint.path}\n`;
          doc += `${endpoint.description || 'No description'}\n\n`;
        });
      }
      
      doc += '\n---\n\n';
    });
    
    return doc;
  }
  
  /**
   * Generate specification documentation
   */
  generateSpecificationDocumentation() {
    const specs = Array.from(this.specifications.values());
    let doc = '## Specifications\n\n';
    
    specs.forEach(spec => {
      doc += `### ${spec.name}\n\n`;
      doc += `${spec.description}\n\n`;
      doc += `**Status:** ${spec.metadata.status}\n`;
      doc += `**Version:** ${spec.version}\n\n`;
      
      if (spec.requirements && spec.requirements.length > 0) {
        doc += '#### Requirements\n\n';
        spec.requirements.forEach((req, i) => {
          doc += `${i + 1}. ${req}\n`;
        });
        doc += '\n';
      }
      
      doc += '\n---\n\n';
    });
    
    return doc;
  }
  
  /**
   * Generate code documentation
   */
  generateCodeDocumentation() {
    const codeRefs = Array.from(this.codeReferences.values());
    let doc = '## Code References\n\n';
    
    const byModule = {};
    codeRefs.forEach(ref => {
      const module = (ref.metadata && ref.metadata.module) || 'general';
      if (!byModule[module]) {
        byModule[module] = [];
      }
      byModule[module].push(ref);
    });
    
    Object.keys(byModule).forEach(module => {
      doc += `### Module: ${module}\n\n`;
      
      byModule[module].forEach(ref => {
        doc += `#### ${ref.name}\n\n`;
        doc += `${ref.description || 'No description'}\n\n`;
        
        if (ref.file) {
          doc += `**File:** ${ref.file}`;
          if (ref.line) doc += `:${ref.line}`;
          doc += '\n\n';
        }
        
        if (ref.code) {
          doc += '```' + ref.language + '\n';
          doc += ref.code + '\n';
          doc += '```\n\n';
        }
      });
    });
    
    return doc;
  }
  
  /**
   * Format documentation output
   */
  formatDocumentation(docs, format) {
    if (format === 'json') {
      return JSON.stringify(docs, null, 2);
    }
    
    // Default to markdown
    let output = `# ${docs.title}\n\n`;
    output += `Version: ${docs.version}\n`;
    output += `Generated: ${docs.generated}\n\n`;
    
    docs.sections.forEach(section => {
      output += section.content;
    });
    
    return output;
  }
  
  /**
   * Calculate relevance score
   */
  calculateRelevance(reference, query) {
    const searchTerm = query.toLowerCase();
    let score = 0;
    
    // Name match (highest weight)
    if (reference.name && reference.name.toLowerCase().includes(searchTerm)) {
      score += 10;
    }
    
    // Description match
    if (reference.description && reference.description.toLowerCase().includes(searchTerm)) {
      score += 5;
    }
    
    // Tag match
    if (reference.metadata && reference.metadata.tags) {
      reference.metadata.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTerm)) {
          score += 3;
        }
      });
    }
    
    return score;
  }
  
  /**
   * Save reference to knowledge base
   */
  async saveToKnowledgeBase(reference) {
    if (!this.knowledgeBase) return;
    
    try {
      await this.knowledgeBase.add({
        id: `ref_${reference.id}`,
        title: reference.name,
        content: JSON.stringify(reference),
        category: 'reference',
        type: reference.type,
        tags: (reference.metadata && reference.metadata.tags) || [],
        author: 'system',
        metadata: {
          referenceId: reference.id,
          referenceType: reference.type
        }
      });
      
    } catch (error) {
      logger.error('Failed to save reference to knowledge base:', error);
    }
  }
  
  /**
   * Update reference in knowledge base
   */
  async updateInKnowledgeBase(reference) {
    if (!this.knowledgeBase) return;
    
    try {
      await this.knowledgeBase.update(`ref_${reference.id}`, {
        title: reference.name,
        content: JSON.stringify(reference),
        updated: new Date().toISOString()
      });
      
    } catch (error) {
      // Try to add if update fails
      await this.saveToKnowledgeBase(reference);
    }
  }
  
  /**
   * Persist reference to disk
   */
  async persistReference(reference) {
    try {
      const filename = `${reference.id}.json`;
      const filepath = path.join(this.config.referencePath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(reference, null, 2));
      
    } catch (error) {
      logger.error(`Failed to persist reference ${reference.id}:`, error);
    }
  }
  
  /**
   * Load references from disk
   */
  async loadReferences() {
    try {
      const files = await fs.readdir(this.config.referencePath);
      const refFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of refFiles) {
        try {
          const filepath = path.join(this.config.referencePath, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const reference = JSON.parse(content);
          
          // Store reference
          this.references.set(reference.id, reference);
          
          // Store in type-specific collection
          switch (reference.type) {
            case 'api':
              this.apis.set(reference.id, reference);
              break;
            case 'specification':
              this.specifications.set(reference.id, reference);
              break;
            case 'code':
              this.codeReferences.set(reference.id, reference);
              break;
          }
          
          // Index reference
          await this.indexReference(reference);
          
        } catch (error) {
          logger.warn(`Failed to load reference file ${file}:`, error);
        }
      }
      
      logger.info(`📚 Loaded ${this.references.size} references from disk`);
      
    } catch (error) {
      logger.warn('Failed to load references:', error);
    }
  }
  
  /**
   * Start auto-indexing
   */
  startAutoIndexing() {
    this.indexInterval = setInterval(() => {
      this.reindex();
    }, this.config.indexInterval);
    
    logger.info('🔄 Auto-indexing started');
  }
  
  /**
   * Reindex all references
   */
  async reindex() {
    // Clear indexes
    Object.values(this.index).forEach(index => index.clear());
    
    // Reindex all references
    for (const reference of this.references.values()) {
      await this.indexReference(reference);
    }
    
    logger.info('🏁 References reindexed');
  }
  
  /**
   * Generate reference ID
   */
  generateReferenceId(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get API template
   */
  getApiTemplate() {
    return {
      name: '',
      description: '',
      baseUrl: '',
      version: '1.0.0',
      endpoints: [],
      authentication: { type: 'none' },
      schemas: {},
      examples: []
    };
  }
  
  /**
   * Get specification template
   */
  getSpecificationTemplate() {
    return {
      name: '',
      description: '',
      category: 'general',
      version: '1.0.0',
      sections: [],
      requirements: [],
      constraints: [],
      acceptanceCriteria: [],
      related: []
    };
  }
  
  /**
   * Get code template
   */
  getCodeTemplate() {
    return {
      name: '',
      description: '',
      language: 'javascript',
      file: '',
      code: '',
      documentation: '',
      examples: []
    };
  }
  
  /**
   * Get guide template
   */
  getGuideTemplate() {
    return {
      title: '',
      description: '',
      sections: [],
      examples: [],
      references: []
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalReferences: this.references.size,
      apis: this.apis.size,
      specifications: this.specifications.size,
      codeReferences: this.codeReferences.size,
      cacheSize: this.searchCache.size
    };
  }
  
  /**
   * Destroy the reference system
   */
  destroy() {
    if (this.indexInterval) {
      clearInterval(this.indexInterval);
    }
    
    this.removeAllListeners();
    this.references.clear();
    this.apis.clear();
    this.specifications.clear();
    this.codeReferences.clear();
    this.searchCache.clear();
    
    Object.values(this.index).forEach(index => index.clear());
    
    logger.info('💥 Reference System destroyed');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ReferenceSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new ReferenceSystem(config);
    }
    return instance;
  }
};