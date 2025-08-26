# Pinecone MCP Integration

## Overview

The Pinecone MCP integration provides vector database capabilities to the BUMBA framework, enabling AI-powered search, semantic retrieval, and RAG (Retrieval Augmented Generation) workflows.

## Installation

### 1. Install Pinecone MCP Server

```bash
npx -y @pinecone-database/mcp
```

### 2. Configure Environment

Set your Pinecone API key:

```bash
export PINECONE_API_KEY="your-api-key-here"
```

Get your API key from: https://app.pinecone.io

### 3. Add to Claude Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": ["-y", "@pinecone-database/mcp"],
      "env": {
        "PINECONE_API_KEY": "<your pinecone api key>"
      }
    }
  }
}
```

## Available Tools

### Search Operations

- **search-docs**: Search Pinecone documentation
- **search-records**: Vector similarity search with metadata filtering
- **cascading-search**: Search across multiple indexes
- **rerank-documents**: Rerank document collections for relevance

### Index Management

- **list-indexes**: List all Pinecone indexes
- **describe-index**: Get index configuration details
- **create-index-for-model**: Create index optimized for specific embedding models
- **upsert-records**: Insert or update records in an index

## Usage Examples

### Basic Vector Search

```javascript
const { pineconeIntegration } = require('./core/integrations/pinecone-integration');

// Initialize integration
await pineconeIntegration.initialize();

// Search for similar documents
const results = await pineconeIntegration.searchRecords(
  'knowledge-base',
  [0.1, 0.2, 0.3, ...], // Query embedding
  {
    topK: 10,
    namespace: 'production',
    filter: { category: 'technical' }
  }
);
```

### Codebase Semantic Search

```javascript
// Create an index for your codebase
const indexName = await pineconeIntegration.createCodebaseIndex('my-project');

// Index code files with embeddings
await pineconeIntegration.indexCodeFiles(indexName, [
  {
    path: '/src/auth/login.js',
    embedding: [...], // Pre-computed embedding
    language: 'javascript',
    size: 2048,
    lastModified: '2024-01-15',
    summary: 'User authentication logic'
  }
]);

// Search codebase semantically
const codeResults = await pineconeIntegration.searchCodebase(
  indexName,
  'authentication flow',
  {
    language: 'javascript',
    path: '/src/auth',
    limit: 5
  }
);
```

### Document Reranking

```javascript
// Get initial results from multiple sources
const documents = [
  { id: '1', content: 'Document about AI', score: 0.8 },
  { id: '2', content: 'Machine learning guide', score: 0.75 },
  { id: '3', content: 'Vector databases explained', score: 0.9 }
];

// Rerank for better relevance
const reranked = await pineconeIntegration.rerankDocuments(
  'What is a vector database?',
  documents,
  { topK: 2 }
);
```

## Integration with BUMBA Framework

### Automatic Fallback

When Pinecone MCP server is unavailable, BUMBA automatically falls back to local text search:

```javascript
// This works even without Pinecone MCP installed
const results = await pineconeIntegration.searchRecords('index', 'query');

if (results.fallback) {
  console.log('Using local search fallback');
}
```

### Health Monitoring

The framework monitors Pinecone server health:

```javascript
const { mcpServerManager } = require('./core/mcp/mcp-resilience-system');

// Check Pinecone server status
const health = mcpServerManager.getSystemHealth();
console.log('Pinecone status:', health.server_details.pinecone);
```

### Performance Optimization

- **Connection pooling**: Reuses server connections
- **Automatic retries**: Exponential backoff for failed requests
- **Batch operations**: Efficient bulk indexing and searching
- **Metadata filtering**: Reduces search space for better performance

## Best Practices

### 1. Index Design

- Choose appropriate embedding models (e.g., `text-embedding-ada-002`)
- Use meaningful namespaces for data organization
- Set proper dimensions based on your embedding model
- Use metadata for efficient filtering

### 2. Query Optimization

- Pre-filter with metadata when possible
- Use appropriate `topK` values (10-20 for most use cases)
- Leverage cascading search for multi-index queries
- Implement caching for frequent queries

### 3. Data Management

- Batch upsert operations for efficiency
- Use unique, meaningful IDs for records
- Include relevant metadata for filtering
- Regularly clean up unused indexes

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   export PINECONE_API_KEY="your-api-key"
   ```

2. **Index Already Exists**
   - Check existing indexes with `listIndexes()`
   - Use unique names or delete old indexes

3. **Dimension Mismatch**
   - Ensure embedding dimensions match index configuration
   - Common dimensions: 1536 (OpenAI), 768 (BERT)

4. **Rate Limiting**
   - Implement exponential backoff
   - Use batch operations
   - Consider upgrading Pinecone plan

### Debug Mode

Enable debug logging:

```javascript
const { logger } = require('./core/logging/bumba-logger');
logger.setLevel('debug');
```

## Advanced Features

### Multi-Index Search

```javascript
// Search across multiple indexes simultaneously
const results = await pineconeIntegration.cascadingSearch(
  ['products', 'documentation', 'support'],
  'user authentication issue',
  {
    topKPerIndex: 5,
    finalTopK: 10
  }
);
```

### Custom Embeddings

```javascript
// Use custom embedding function
async function customEmbedding(text) {
  // Your embedding logic here
  return embeddings;
}

// Index with custom embeddings
const embedding = await customEmbedding('code snippet');
await pineconeIntegration.upsertRecords('custom-index', [{
  id: 'custom-1',
  values: embedding,
  metadata: { source: 'custom' }
}]);
```

## Resources

- [Pinecone Documentation](https://docs.pinecone.io)
- [MCP Protocol Spec](https://modelcontextprotocol.org)
- [BUMBA Framework Docs](../README.md)
- [Vector Database Best Practices](https://www.pinecone.io/learn/)

## Support

For issues or questions:
- BUMBA Framework: [GitHub Issues](https://github.com/your-org/bumba/issues)
- Pinecone MCP: [GitHub Issues](https://github.com/pinecone-io/pinecone-mcp/issues)
- Pinecone Support: support@pinecone.io