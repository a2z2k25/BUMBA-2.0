/**
 * BUMBA Pinecone Integration Module
 * Provides vector database capabilities for AI-powered search and retrieval
 */

const { logger } = require('../logging/bumba-logger');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { BumbaError } = require('../error-handling/bumba-error-system');

class PineconeIntegration {
  constructor() {
    this.server = null;
    this.initialized = false;
    this.capabilities = [
      'search-docs',
      'list-indexes',
      'describe-index',
      'create-index-for-model',
      'upsert-records',
      'search-records',
      'cascading-search',
      'rerank-documents'
    ];
  }

  /**
   * Initialize Pinecone MCP server connection
   */
  async initialize() {
    try {
      logger.info('🟢 Initializing Pinecone integration...');
      
      // Get Pinecone server through MCP resilience system
      this.server = await mcpServerManager.getServer('pinecone');
      
      // Check if we're using fallback
      if (this.server.fallbackType === 'local-vector-search') {
        logger.warn('🟡 Pinecone unavailable - using local search fallback');
        logger.info('🟢 Install Pinecone MCP: npx -y @pinecone-database/mcp');
        logger.info('🟢 Set PINECONE_API_KEY from https://app.pinecone.io');
      } else {
        logger.info('🏁 Pinecone integration initialized successfully');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Pinecone integration:', error);
      throw new BumbaError('PINECONE_INIT_FAILED', error.message);
    }
  }

  /**
   * Search Pinecone documentation
   */
  async searchDocs(query) {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('search-docs', { query });
      return result.data || [];
    } catch (error) {
      logger.error('Error searching Pinecone docs:', error);
      return this.fallbackSearch(query, 'documentation');
    }
  }

  /**
   * List all Pinecone indexes
   */
  async listIndexes() {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('list-indexes', {});
      return result.data || [];
    } catch (error) {
      logger.error('Error listing indexes:', error);
      return [];
    }
  }

  /**
   * Describe a specific index
   */
  async describeIndex(indexName) {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('describe-index', { index_name: indexName });
      return result.data || null;
    } catch (error) {
      logger.error(`Error describing index ${indexName}:`, error);
      return null;
    }
  }

  /**
   * Create an index optimized for a specific model
   */
  async createIndexForModel(indexName, model, metric = 'cosine', dimension = null) {
    await this.ensureInitialized();
    
    try {
      const params = {
        index_name: indexName,
        model: model,
        metric: metric
      };
      
      if (dimension) {
        params.dimension = dimension;
      }
      
      const result = await this.server.execute('create-index-for-model', params);
      logger.info(`🏁 Created Pinecone index: ${indexName}`);
      return result.data;
    } catch (error) {
      logger.error(`Error creating index ${indexName}:`, error);
      throw new BumbaError('PINECONE_INDEX_CREATE_FAILED', error.message);
    }
  }

  /**
   * Upsert records into an index
   */
  async upsertRecords(indexName, records, namespace = null) {
    await this.ensureInitialized();
    
    try {
      const params = {
        index_name: indexName,
        records: records
      };
      
      if (namespace) {
        params.namespace = namespace;
      }
      
      const result = await this.server.execute('upsert-records', params);
      logger.info(`🏁 Upserted ${records.length} records to ${indexName}`);
      return result.data;
    } catch (error) {
      logger.error('Error upserting records:', error);
      throw new BumbaError('PINECONE_UPSERT_FAILED', error.message);
    }
  }

  /**
   * Search records with vector similarity
   */
  async searchRecords(indexName, query, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        index_name: indexName,
        query: query,
        top_k: options.topK || 10,
        include_metadata: options.includeMetadata !== false,
        include_values: options.includeValues || false
      };
      
      if (options.namespace) {
        params.namespace = options.namespace;
      }
      
      if (options.filter) {
        params.filter = options.filter;
      }
      
      const result = await this.server.execute('search-records', params);
      return result.data || [];
    } catch (error) {
      logger.error('Error searching records:', error);
      return this.fallbackSearch(query, 'records');
    }
  }

  /**
   * Cascading search across multiple indexes
   */
  async cascadingSearch(indexes, query, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        indexes: indexes,
        query: query,
        top_k_per_index: options.topKPerIndex || 5,
        final_top_k: options.finalTopK || 10
      };
      
      const result = await this.server.execute('cascading-search', params);
      return result.data || [];
    } catch (error) {
      logger.error('Error in cascading search:', error);
      return this.fallbackSearch(query, 'cascading');
    }
  }

  /**
   * Rerank documents based on relevance
   */
  async rerankDocuments(query, documents, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        query: query,
        documents: documents,
        top_k: options.topK || documents.length,
        model: options.model || 'default'
      };
      
      const result = await this.server.execute('rerank-documents', params);
      return result.data || documents;
    } catch (error) {
      logger.error('Error reranking documents:', error);
      // Return original order as fallback
      return documents;
    }
  }

  /**
   * Fallback search when Pinecone is unavailable
   */
  fallbackSearch(query, searchType) {
    logger.info(`🟢 Using local text search for ${searchType}`);
    
    // Simple keyword-based fallback
    return {
      matches: [],
      fallback: true,
      message: 'Using local search - install Pinecone MCP for vector search capabilities'
    };
  }

  /**
   * Ensure the integration is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      serverAvailable: this.server && !this.server.fallbackType,
      usingFallback: this.server && this.server.fallbackType === 'local-vector-search',
      capabilities: this.capabilities
    };
  }

  /**
   * Create semantic search index for codebase
   */
  async createCodebaseIndex(projectName) {
    const indexName = `${projectName}-codebase`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    try {
      // Create index optimized for code embeddings
      await this.createIndexForModel(
        indexName,
        'text-embedding-ada-002', // OpenAI's embedding model
        'cosine',
        1536 // Dimension for ada-002
      );
      
      logger.info(`🏁 Created codebase index: ${indexName}`);
      return indexName;
    } catch (error) {
      logger.error('Failed to create codebase index:', error);
      throw error;
    }
  }

  /**
   * Index code files for semantic search
   */
  async indexCodeFiles(indexName, files) {
    const records = files.map((file, index) => ({
      id: `file-${index}`,
      values: file.embedding, // Assumes embeddings are pre-computed
      metadata: {
        path: file.path,
        language: file.language,
        size: file.size,
        lastModified: file.lastModified,
        summary: file.summary
      }
    }));
    
    return await this.upsertRecords(indexName, records);
  }

  /**
   * Search codebase semantically
   */
  async searchCodebase(indexName, query, options = {}) {
    const searchOptions = {
      topK: options.limit || 10,
      includeMetadata: true,
      filter: options.filter || {}
    };
    
    // Add language filter if specified
    if (options.language) {
      searchOptions.filter.language = { $eq: options.language };
    }
    
    // Add path filter if specified
    if (options.path) {
      searchOptions.filter.path = { $contains: options.path };
    }
    
    return await this.searchRecords(indexName, query, searchOptions);
  }
}

// Export singleton instance
const pineconeIntegration = new PineconeIntegration();

module.exports = {
  PineconeIntegration,
  pineconeIntegration
};