# BUMBA Knowledge Systems Guide

## Overview

The BUMBA Knowledge Systems provide a comprehensive framework for managing knowledge, context, and references across the entire framework. These systems work together to create an intelligent knowledge management ecosystem that learns, adapts, and improves over time.

## Architecture

The Knowledge Systems consist of four main components:

1. **Knowledge Base** - Central repository for all framework knowledge
2. **Context Manager** - Advanced context tracking, preservation, and restoration
3. **Reference System** - API documentation, code references, and specification management
4. **Knowledge Transfer System** - Manages knowledge flow between models, sessions, and agents

## Features

### Knowledge Base
- **CRUD Operations**: Create, Read, Update, Delete knowledge entries
- **Advanced Querying**: Search by category, tags, type, author, date range, and full-text
- **Relationship Management**: Track relationships between knowledge entries
- **Automatic Indexing**: Fast retrieval with multiple index types
- **Persistence**: Automatic saving to disk with compression support
- **Statistics Tracking**: Monitor usage patterns and performance

### Context Manager
- **Context Creation**: Create rich contexts with metadata, relationships, and sections
- **Context Merging**: Combine multiple contexts intelligently
- **Context Forking**: Create child contexts from parents
- **Compression**: Automatic compression for large contexts
- **Persistence**: Save and restore contexts across sessions
- **History Tracking**: Maintain context history for debugging

### Reference System
- **API References**: Document APIs with endpoints, schemas, and examples
- **Specifications**: Manage project specifications and requirements
- **Code References**: Track code snippets with documentation
- **Documentation Generation**: Auto-generate documentation in multiple formats
- **Search Capabilities**: Find references quickly with advanced search
- **Auto-Indexing**: Keep references organized and accessible

### Knowledge Transfer System
- **Model Integration**: Transfer knowledge between different AI models
- **Pattern Recognition**: Identify and store successful patterns
- **Correction Tracking**: Learn from mistakes and corrections
- **Decision History**: Maintain history of all decisions made
- **Compression**: Compress old knowledge to save space
- **Relationship Analysis**: Understand connections between knowledge pieces

## Quick Start

### Installation

```javascript
const { initializeKnowledgeSystems } = require('bumba/knowledge');

// Initialize all systems
const systems = await initializeKnowledgeSystems({
  knowledgeBase: {
    basePath: './.bumba/knowledge-base',
    autoSave: true
  },
  contextManager: {
    persistContext: true,
    maxContextSize: 10000
  },
  referenceSystem: {
    autoIndex: true
  },
  knowledgeTransfer: {
    knowledgeDir: './.bumba/knowledge'
  }
});
```

### Basic Usage

#### Knowledge Base

```javascript
const { knowledgeBase } = require('bumba/knowledge');

// Add knowledge
const entry = await knowledgeBase.add({
  title: 'Authentication Best Practices',
  content: 'Always use secure token storage...',
  category: 'security',
  tags: ['auth', 'security', 'best-practices']
});

// Query knowledge
const results = knowledgeBase.query({
  category: 'security',
  tags: ['auth'],
  limit: 10
});

// Get related entries
const related = knowledgeBase.getRelated(entry.id, depth = 2);
```

#### Context Manager

```javascript
const { contextManager } = require('bumba/knowledge');

// Create context
const context = await contextManager.createContext({
  type: 'development',
  goal: 'Implement user authentication',
  constraints: ['Must use JWT', 'Support OAuth2'],
  assumptions: ['Users have email addresses'],
  data: {
    framework: 'Express',
    database: 'PostgreSQL'
  }
});

// Update context
await contextManager.updateContext(context.id, {
  data: { progress: 50 },
  sections: {
    decisions: ['Use Passport.js for OAuth']
  }
});

// Merge contexts
const merged = await contextManager.mergeContexts(context1.id, context2.id);

// Fork context
const forked = await contextManager.forkContext(context.id, {
  data: { variant: 'mobile' }
});
```

#### Reference System

```javascript
const { referenceSystem } = require('bumba/knowledge');

// Create API reference
const apiRef = await referenceSystem.createApiReference({
  name: 'User API',
  description: 'User management endpoints',
  baseUrl: '/api/users',
  endpoints: [
    {
      method: 'GET',
      path: '/:id',
      description: 'Get user by ID',
      parameters: [
        { name: 'id', type: 'string', required: true }
      ]
    }
  ]
});

// Create specification
const spec = await referenceSystem.createSpecification({
  name: 'Authentication Flow',
  description: 'OAuth2 authentication implementation',
  requirements: [
    'Support Google OAuth',
    'Support GitHub OAuth',
    'Implement refresh tokens'
  ],
  acceptanceCriteria: [
    'Users can login with Google',
    'Tokens expire after 1 hour'
  ]
});

// Generate documentation
const docs = await referenceSystem.generateDocumentation({
  title: 'API Documentation',
  format: 'markdown',
  outputPath: './docs/api.md'
});

// Search references
const refs = referenceSystem.search('authentication', {
  type: 'api',
  limit: 5
});
```

#### Knowledge Transfer

```javascript
const { knowledgeTransfer } = require('bumba/knowledge');

// Transfer knowledge to supervisor
const knowledgePackage = await knowledgeTransfer.transferToSupervisor(
  ancillaryResults,
  task
);

// Receive knowledge from supervisor
const knowledge = await knowledgeTransfer.transferFromSupervisor(
  claudeReview,
  originalTask,
  ancillaryResults
);

// Get metrics
const metrics = knowledgeTransfer.getMetrics();
console.log(`Transfers completed: ${metrics.transfersCompleted}`);
console.log(`Knowledge reused: ${metrics.knowledgeReused}`);
```

## Configuration

### Environment Variables

Configure the Knowledge Systems using environment variables:

```bash
# Knowledge Base
export BUMBA_KNOWLEDGE_BASE_PATH="/path/to/knowledge"
export BUMBA_KNOWLEDGE_MAX_ENTRIES="10000"
export BUMBA_KNOWLEDGE_AUTO_SAVE="true"

# Context Manager
export BUMBA_MAX_CONTEXT_SIZE="10000"
export BUMBA_CONTEXT_PATH="/path/to/contexts"
export BUMBA_PERSIST_CONTEXT="true"

# Reference System
export BUMBA_REFERENCE_PATH="/path/to/references"
export BUMBA_AUTO_INDEX="true"

# Knowledge Transfer
export BUMBA_KNOWLEDGE_DIR="/path/to/knowledge"
export BUMBA_KNOWLEDGE_MAX_AGE="2592000000"  # 30 days in ms
export BUMBA_KNOWLEDGE_COMPRESSION="1000"
```

### Configuration Files

You can also configure through `bumba.config.js`:

```javascript
module.exports = {
  knowledge: {
    knowledgeBase: {
      basePath: './.bumba/knowledge-base',
      maxEntries: 10000,
      autoSave: true,
      compression: true
    },
    contextManager: {
      maxContextSize: 10000,
      persistContext: true,
      maxContextAge: 3600000
    },
    referenceSystem: {
      autoIndex: true,
      indexInterval: 300000,
      supportedFormats: ['md', 'json', 'yaml']
    },
    knowledgeTransfer: {
      maxKnowledgeAge: 2592000000,
      compressionThreshold: 1000
    }
  }
};
```

## Advanced Features

### Knowledge Relationships

Create complex knowledge graphs:

```javascript
// Create related entries
const entry1 = await knowledgeBase.add({
  title: 'Authentication',
  relatedTo: []
});

const entry2 = await knowledgeBase.add({
  title: 'JWT Implementation',
  relatedTo: [entry1.id]
});

const entry3 = await knowledgeBase.add({
  title: 'OAuth2 Integration',
  relatedTo: [entry1.id, entry2.id]
});

// Traverse relationships
const graph = knowledgeBase.getRelated(entry1.id, depth = 3);
```

### Context Compression

Automatically compress large contexts:

```javascript
const context = await contextManager.createContext({
  type: 'large-dataset',
  data: largeDataObject, // Will be compressed if > threshold
  metadata: { compressed: true }
});

// Decompress when needed
const decompressed = await contextManager.decompressContext(context);
```

### Reference Templates

Use templates for consistent documentation:

```javascript
const template = referenceSystem.templates.api;
const apiRef = await referenceSystem.createApiReference({
  ...template,
  name: 'My API',
  endpoints: [...]
});
```

### Knowledge Persistence

All systems support automatic persistence:

```javascript
// Save all knowledge to disk
await knowledgeBase.saveAll();

// Load from disk on startup
await knowledgeBase.loadFromDisk();

// Auto-save is enabled by default
const kb = new KnowledgeBase({ autoSave: true });
```

## Integration

### With BUMBA Agents

Knowledge Systems integrate seamlessly with BUMBA agents:

```javascript
// Agent stores context
const context = await contextManager.createContext({
  agent: 'backend-engineer',
  task: taskId,
  data: agentWorkingMemory
});

// Agent queries knowledge
const relevantKnowledge = knowledgeBase.query({
  tags: ['backend', 'api'],
  category: 'implementation'
});

// Agent uses references
const apiDocs = referenceSystem.search('user management', {
  type: 'api'
});
```

### With MCP Servers

Integrate with Model Context Protocol servers:

```javascript
// Store MCP responses
await knowledgeBase.add({
  title: 'MCP Response',
  content: mcpResponse,
  category: 'mcp',
  metadata: { server: 'notion', timestamp: Date.now() }
});

// Create context for MCP session
const mcpContext = await contextManager.createContext({
  type: 'mcp-session',
  data: { server: 'notion', config: mcpConfig }
});
```

## Performance Optimization

### Indexing

The systems use multiple indexes for fast retrieval:

- **By ID**: Direct lookup
- **By Category**: Grouped access
- **By Tags**: Multi-tag filtering
- **By Type**: Type-specific queries
- **By Author**: Attribution tracking
- **By Date**: Time-based queries
- **Full-Text**: Content search

### Caching

Query results are cached automatically:

```javascript
// First query hits the database
const results1 = knowledgeBase.query({ category: 'api' }); // Cache miss

// Second identical query uses cache
const results2 = knowledgeBase.query({ category: 'api' }); // Cache hit

// Cache is cleared on updates
await knowledgeBase.add({ category: 'api', title: 'New' }); // Clears cache
```

### Compression

Large data is compressed automatically:

- Contexts > 5000 tokens are compressed
- Old knowledge is compressed after 30 days
- Compression reduces storage by ~70%

## Troubleshooting

### Common Issues

#### Issue: "Knowledge base not initialized"
**Solution**: Ensure you call `initializeKnowledgeSystems()` before using any system

#### Issue: "Context too large"
**Solution**: Increase `maxContextSize` or enable compression

#### Issue: "Reference not found"
**Solution**: Check if auto-indexing is enabled and wait for index update

#### Issue: "Knowledge transfer failed"
**Solution**: Check network connectivity and retry with exponential backoff

### Debug Mode

Enable debug logging:

```javascript
process.env.BUMBA_DEBUG = 'true';
process.env.BUMBA_LOG_LEVEL = 'debug';
```

## Metrics and Monitoring

Track system performance:

```javascript
// Knowledge Base metrics
const kbStats = knowledgeBase.getStats();
console.log(`Total entries: ${kbStats.totalEntries}`);
console.log(`Cache hit rate: ${kbStats.cacheHits / (kbStats.cacheHits + kbStats.cacheMisses)}`);

// Context Manager metrics
const cmMetrics = contextManager.getMetrics();
console.log(`Active contexts: ${cmMetrics.activeContexts}`);
console.log(`Average size: ${cmMetrics.averageContextSize}`);

// Reference System metrics
const rsMetrics = referenceSystem.getMetrics();
console.log(`Total references: ${rsMetrics.totalReferences}`);
console.log(`Searches performed: ${rsMetrics.searchesPerformed}`);

// Knowledge Transfer metrics
const ktMetrics = knowledgeTransfer.getMetrics();
console.log(`Knowledge reuse rate: ${ktMetrics.knowledgeReused}`);
```

## Best Practices

1. **Regular Cleanup**: Run compression and cleanup regularly
2. **Consistent Tagging**: Use standardized tags for better searchability
3. **Relationship Mapping**: Define relationships between related knowledge
4. **Context Preservation**: Save important contexts for future reference
5. **Documentation Generation**: Auto-generate docs from references
6. **Performance Monitoring**: Track metrics and optimize based on usage
7. **Error Handling**: Always wrap operations in try-catch blocks
8. **Backup Strategy**: Regularly backup knowledge directories

## API Reference

For detailed API documentation, see:
- [Knowledge Base API](./api/knowledge-base.md)
- [Context Manager API](./api/context-manager.md)
- [Reference System API](./api/reference-system.md)
- [Knowledge Transfer API](./api/knowledge-transfer.md)

## Contributing

To contribute to the Knowledge Systems:

1. Add tests for new features
2. Update documentation
3. Follow existing patterns
4. Ensure backward compatibility

## License

Part of the BUMBA CLI. See main LICENSE file.