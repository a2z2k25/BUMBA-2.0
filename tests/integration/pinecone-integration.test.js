/**
 * BUMBA Pinecone Integration Tests
 */

const { PineconeIntegration } = require('../../src/core/integrations/pinecone-integration');
const { mcpServerManager } = require('../../src/core/mcp/mcp-resilience-system');

describe('Pinecone Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let pineconeIntegration;

  beforeEach(() => {
    pineconeIntegration = new PineconeIntegration();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with available server', async () => {
      const mockServer = {
        fallbackType: null,
        execute: jest.fn().mockResolvedValue({ success: true })
      };
      
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockServer);
      
      const result = await pineconeIntegration.initialize();
      
      expect(result).toBe(true);
      expect(pineconeIntegration.initialized).toBe(true);
      expect(mcpServerManager.getServer).toHaveBeenCalledWith('pinecone');
    });

    it('should handle fallback when server unavailable', async () => {
      const mockFallbackServer = {
        fallbackType: 'local-vector-search',
        execute: jest.fn().mockResolvedValue({ 
          success: false, 
          fallback_type: 'local-vector-search' 
        })
      };
      
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockFallbackServer);
      
      const result = await pineconeIntegration.initialize();
      
      expect(result).toBe(true);
      expect(pineconeIntegration.initialized).toBe(true);
      expect(pineconeIntegration.server.fallbackType).toBe('local-vector-search');
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      const mockServer = {
        fallbackType: null,
        execute: jest.fn().mockResolvedValue({ 
          success: true, 
          data: [] 
        })
      };
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockServer);
      await pineconeIntegration.initialize();
    });

    it('should search documentation', async () => {
      const query = 'vector database';
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: [
          { title: 'Vector Databases Guide', relevance: 0.95 },
          { title: 'Pinecone Overview', relevance: 0.89 }
        ]
      });
      
      const results = await pineconeIntegration.searchDocs(query);
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'search-docs', 
        { query }
      );
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Vector Databases Guide');
    });

    it('should list indexes', async () => {
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: [
          { name: 'products', dimension: 1536 },
          { name: 'documents', dimension: 768 }
        ]
      });
      
      const indexes = await pineconeIntegration.listIndexes();
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'list-indexes', 
        {}
      );
      expect(indexes).toHaveLength(2);
      expect(indexes[0].name).toBe('products');
    });

    it('should search records with options', async () => {
      const indexName = 'test-index';
      const query = [0.1, 0.2, 0.3];
      const options = {
        topK: 5,
        namespace: 'test-namespace',
        filter: { category: 'electronics' }
      };
      
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: [
          { id: '1', score: 0.95, metadata: { title: 'Product 1' } },
          { id: '2', score: 0.89, metadata: { title: 'Product 2' } }
        ]
      });
      
      const results = await pineconeIntegration.searchRecords(indexName, query, options);
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'search-records',
        {
          index_name: indexName,
          query: query,
          top_k: 5,
          include_metadata: true,
          include_values: false,
          namespace: 'test-namespace',
          filter: { category: 'electronics' }
        }
      );
      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(0.95);
    });
  });

  describe('Index Management', () => {
    beforeEach(async () => {
      const mockServer = {
        fallbackType: null,
        execute: jest.fn()
      };
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockServer);
      await pineconeIntegration.initialize();
    });

    it('should create index for model', async () => {
      const indexName = 'embeddings-index';
      const model = 'text-embedding-ada-002';
      
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: { name: indexName, status: 'created' }
      });
      
      const result = await pineconeIntegration.createIndexForModel(
        indexName, 
        model, 
        'cosine', 
        1536
      );
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'create-index-for-model',
        {
          index_name: indexName,
          model: model,
          metric: 'cosine',
          dimension: 1536
        }
      );
      expect(result.name).toBe(indexName);
    });

    it('should upsert records', async () => {
      const indexName = 'test-index';
      const records = [
        { id: '1', values: [0.1, 0.2], metadata: { title: 'Doc 1' } },
        { id: '2', values: [0.3, 0.4], metadata: { title: 'Doc 2' } }
      ];
      
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: { upserted_count: 2 }
      });
      
      const result = await pineconeIntegration.upsertRecords(indexName, records);
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'upsert-records',
        {
          index_name: indexName,
          records: records
        }
      );
      expect(result.upserted_count).toBe(2);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback search when server unavailable', async () => {
      const mockFallbackServer = {
        fallbackType: 'local-vector-search',
        execute: jest.fn().mockRejectedValue(new Error('Server unavailable'))
      };
      
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockFallbackServer);
      await pineconeIntegration.initialize();
      
      const results = await pineconeIntegration.searchRecords('test-index', 'query');
      
      expect(results).toHaveProperty('fallback', true);
      expect(results).toHaveProperty('message');
      expect(results.message).toContain('local search');
    });

    it('should handle cascading search fallback', async () => {
      const mockFallbackServer = {
        fallbackType: 'local-vector-search',
        execute: jest.fn().mockRejectedValue(new Error('Not supported'))
      };
      
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockFallbackServer);
      await pineconeIntegration.initialize();
      
      const results = await pineconeIntegration.cascadingSearch(
        ['index1', 'index2'], 
        'test query'
      );
      
      expect(results).toHaveProperty('fallback', true);
    });
  });

  describe('Codebase Integration', () => {
    beforeEach(async () => {
      const mockServer = {
        fallbackType: null,
        execute: jest.fn().mockResolvedValue({ success: true })
      };
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockServer);
      await pineconeIntegration.initialize();
    });

    it('should create codebase index', async () => {
      const projectName = 'My Project';
      
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: { name: 'my-project-codebase', status: 'created' }
      });
      
      const indexName = await pineconeIntegration.createCodebaseIndex(projectName);
      
      expect(indexName).toBe('my-project-codebase');
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'create-index-for-model',
        expect.objectContaining({
          index_name: 'my-project-codebase',
          model: 'text-embedding-ada-002',
          metric: 'cosine',
          dimension: 1536
        })
      );
    });

    it('should index code files', async () => {
      const indexName = 'codebase-index';
      const files = [
        {
          path: '/src/index.js',
          embedding: [0.1, 0.2, 0.3],
          language: 'javascript',
          size: 1024,
          lastModified: '2024-01-01',
          summary: 'Main entry point'
        }
      ];
      
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: { upserted_count: 1 }
      });
      
      await pineconeIntegration.indexCodeFiles(indexName, files);
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'upsert-records',
        expect.objectContaining({
          index_name: indexName,
          records: expect.arrayContaining([
            expect.objectContaining({
              id: 'file-0',
              values: files[0].embedding,
              metadata: expect.objectContaining({
                path: files[0].path,
                language: 'javascript'
              })
            })
          ])
        })
      );
    });

    it('should search codebase with filters', async () => {
      const indexName = 'codebase-index';
      const query = 'authentication logic';
      const options = {
        language: 'javascript',
        path: '/src/auth',
        limit: 5
      };
      
      pineconeIntegration.server.execute = jest.fn().mockResolvedValue({
        data: [
          { 
            id: 'file-1', 
            score: 0.92, 
            metadata: { 
              path: '/src/auth/login.js',
              language: 'javascript' 
            } 
          }
        ]
      });
      
      const results = await pineconeIntegration.searchCodebase(indexName, query, options);
      
      expect(pineconeIntegration.server.execute).toHaveBeenCalledWith(
        'search-records',
        expect.objectContaining({
          index_name: indexName,
          query: query,
          top_k: 5,
          filter: {
            language: { $eq: 'javascript' },
            path: { $contains: '/src/auth' }
          }
        })
      );
      expect(results).toHaveLength(1);
      expect(results[0].metadata.path).toContain('/src/auth');
    });
  });

  describe('Status and Health', () => {
    it('should report status correctly', async () => {
      const mockServer = {
        fallbackType: null,
        execute: jest.fn()
      };
      
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockServer);
      await pineconeIntegration.initialize();
      
      const status = pineconeIntegration.getStatus();
      
      expect(status).toEqual({
        initialized: true,
        serverAvailable: true,
        usingFallback: false,
        capabilities: expect.arrayContaining([
          'search-docs',
          'list-indexes',
          'create-index-for-model',
          'upsert-records',
          'search-records'
        ])
      });
    });

    it('should report fallback status', async () => {
      const mockFallbackServer = {
        fallbackType: 'local-vector-search',
        execute: jest.fn()
      };
      
      jest.spyOn(mcpServerManager, 'getServer').mockResolvedValue(mockFallbackServer);
      await pineconeIntegration.initialize();
      
      const status = pineconeIntegration.getStatus();
      
      expect(status.serverAvailable).toBe(false);
      expect(status.usingFallback).toBe(true);
    });
  });
});