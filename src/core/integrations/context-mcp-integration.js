/**
 * BUMBA Claude Context MCP Integration
 * Advanced context management and preservation for AI conversations
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ContextMCPIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false,
      maxContextSize: config.maxContextSize || 200000, // tokens
      preservationStrategy: config.preservationStrategy || 'intelligent', // intelligent, full, summary
      
      // Storage configuration
      storage: {
        path: config.storagePath || path.join(process.env.HOME || '', '.bumba', 'context'),
        format: config.storageFormat || 'json', // json, markdown, hybrid
        encryption: config.encryption || false,
        compression: config.compression !== false
      },
      
      // Context windows
      windows: {
        conversation: config.conversationWindow || 50000,
        project: config.projectWindow || 100000,
        global: config.globalWindow || 50000
      },
      
      // Features
      features: {
        autoSave: config.autoSave !== false,
        autoRestore: config.autoRestore !== false,
        crossSession: config.crossSession !== false,
        multiProject: config.multiProject !== false,
        intelligentPruning: config.intelligentPruning !== false
      },
      
      // MCP server settings
      mcp: {
        package: '@modelcontextprotocol/server-context',
        command: config.mcpCommand || 'npx',
        args: config.mcpArgs || ['-y', '@modelcontextprotocol/server-context']
      }
    };
    
    this.contexts = new Map();
    this.activeContext = null;
    this.contextHistory = [];
    this.serverAvailable = false;
    
    this.metrics = {
      contextsCreated: 0,
      contextsRestored: 0,
      tokensSaved: 0,
      compressionRatio: 0,
      pruningEvents: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize Context MCP integration
   */
  async initialize() {
    try {
      // Check if Context MCP server is available
      this.serverAvailable = await this.checkServerAvailable();
      
      if (!this.serverAvailable) {
        logger.warn('🟡 Context MCP server not installed');
        this.showSetupGuide();
        return false;
      }
      
      // Create storage directory if needed
      if (!fs.existsSync(this.config.storage.path)) {
        fs.mkdirSync(this.config.storage.path, { recursive: true });
      }
      
      // Load existing contexts
      await this.loadExistingContexts();
      
      // Set up auto-save if enabled
      if (this.config.features.autoSave) {
        this.setupAutoSave();
      }
      
      logger.info('🧠 Context MCP integration initialized');
      logger.info(`📊 Max context: ${this.config.maxContextSize} tokens`);
      logger.info(`💾 Storage: ${this.config.storage.path}`);
      
      this.emit('initialized', {
        contextsLoaded: this.contexts.size,
        serverAvailable: this.serverAvailable
      });
      
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Context MCP:', error);
      return false;
    }
  }
  
  /**
   * Check if Context MCP server is available
   */
  async checkServerAvailable() {
    try {
      const result = execSync('claude mcp list 2>/dev/null', { encoding: 'utf8' });
      return result.includes('context');
    } catch {
      // Try to check if package is installed
      try {
        execSync('npm list @modelcontextprotocol/server-context 2>/dev/null', { encoding: 'utf8' });
        return true;
      } catch {
        return false;
      }
    }
  }
  
  /**
   * Create a new context
   */
  createContext(name, options = {}) {
    const context = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: options.type || 'conversation', // conversation, project, global
      createdAt: Date.now(),
      updatedAt: Date.now(),
      
      // Content storage
      content: {
        messages: [],
        files: new Set(),
        references: new Map(),
        metadata: options.metadata || {}
      },
      
      // Token tracking
      tokens: {
        current: 0,
        maximum: this.config.windows[options.type || 'conversation'],
        pruned: 0
      },
      
      // State management
      state: {
        active: true,
        compressed: false,
        encrypted: false
      },
      
      // Relationships
      relationships: {
        parent: options.parentId || null,
        children: new Set(),
        related: new Set()
      }
    };
    
    this.contexts.set(context.id, context);
    this.metrics.contextsCreated++;
    
    // Set as active if requested
    if (options.setActive) {
      this.activeContext = context.id;
    }
    
    this.emit('context-created', { id: context.id, name });
    
    return context.id;
  }
  
  /**
   * Add content to context
   */
  addToContext(contextId, content, options = {}) {
    const context = this.contexts.get(contextId || this.activeContext);
    
    if (!context) {
      throw new Error('Context not found');
    }
    
    // Determine content type
    if (options.type === 'message' || typeof content === 'string') {
      context.content.messages.push({
        role: options.role || 'user',
        content: content,
        timestamp: Date.now()
      });
    } else if (options.type === 'file') {
      context.content.files.add(content);
    } else if (options.type === 'reference') {
      context.content.references.set(options.key || Date.now(), content);
    }
    
    // Update token count
    context.tokens.current += this.estimateTokens(content);
    
    // Prune if necessary
    if (context.tokens.current > context.tokens.maximum) {
      this.pruneContext(contextId);
    }
    
    // Update timestamp
    context.updatedAt = Date.now();
    
    // Auto-save if enabled
    if (this.config.features.autoSave) {
      this.saveContext(contextId);
    }
    
    this.emit('context-updated', { id: contextId });
  }
  
  /**
   * Get context content
   */
  getContext(contextId) {
    const context = this.contexts.get(contextId || this.activeContext);
    
    if (!context) {
      return null;
    }
    
    // Return formatted context
    return {
      id: context.id,
      name: context.name,
      type: context.type,
      messages: context.content.messages,
      files: Array.from(context.content.files),
      references: Object.fromEntries(context.content.references),
      metadata: context.content.metadata,
      tokens: context.tokens,
      createdAt: context.createdAt,
      updatedAt: context.updatedAt
    };
  }
  
  /**
   * Search across contexts
   */
  searchContexts(query, options = {}) {
    const results = [];
    
    for (const [id, context] of this.contexts) {
      // Skip if type filter doesn't match
      if (options.type && context.type !== options.type) {
        continue;
      }
      
      // Search in messages
      const messageMatches = context.content.messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      
      // Search in references
      const referenceMatches = Array.from(context.content.references.entries()).filter(([key, value]) =>
        JSON.stringify(value).toLowerCase().includes(query.toLowerCase())
      );
      
      if (messageMatches.length > 0 || referenceMatches.length > 0) {
        results.push({
          contextId: id,
          contextName: context.name,
          messageMatches: messageMatches.length,
          referenceMatches: referenceMatches.length,
          relevance: this.calculateRelevance(query, context)
        });
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results;
  }
  
  /**
   * Merge contexts
   */
  mergeContexts(sourceIds, targetName, options = {}) {
    const mergedContext = this.createContext(targetName, {
      type: options.type || 'project',
      metadata: { merged: true, sources: sourceIds }
    });
    
    const target = this.contexts.get(mergedContext);
    
    // Merge content from all sources
    for (const sourceId of sourceIds) {
      const source = this.contexts.get(sourceId);
      
      if (!source) continue;
      
      // Merge messages
      target.content.messages.push(...source.content.messages);
      
      // Merge files
      source.content.files.forEach(file => target.content.files.add(file));
      
      // Merge references
      source.content.references.forEach((value, key) => {
        target.content.references.set(`${sourceId}_${key}`, value);
      });
      
      // Update relationships
      target.relationships.related.add(sourceId);
      source.relationships.children.add(mergedContext);
    }
    
    // Sort messages by timestamp
    target.content.messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Update token count
    target.tokens.current = this.calculateTotalTokens(target);
    
    // Prune if necessary
    if (target.tokens.current > target.tokens.maximum) {
      this.intelligentPrune(mergedContext);
    }
    
    this.emit('contexts-merged', { 
      sources: sourceIds, 
      target: mergedContext,
      totalTokens: target.tokens.current
    });
    
    return mergedContext;
  }
  
  /**
   * Prune context intelligently
   */
  pruneContext(contextId) {
    const context = this.contexts.get(contextId);
    
    if (!context) return;
    
    const strategy = this.config.preservationStrategy;
    
    if (strategy === 'intelligent') {
      this.intelligentPrune(contextId);
    } else if (strategy === 'summary') {
      this.summaryPrune(contextId);
    } else {
      this.simplePrune(contextId);
    }
    
    this.metrics.pruningEvents++;
    this.emit('context-pruned', { id: contextId, strategy });
  }
  
  /**
   * Intelligent pruning strategy
   */
  intelligentPrune(contextId) {
    const context = this.contexts.get(contextId);
    
    // Calculate importance scores for messages
    const scored = context.content.messages.map((msg, index) => ({
      ...msg,
      index,
      score: this.calculateImportance(msg, index, context.content.messages)
    }));
    
    // Sort by importance (keep most important)
    scored.sort((a, b) => b.score - a.score);
    
    // Keep top messages within token limit
    let totalTokens = 0;
    const kept = [];
    
    for (const msg of scored) {
      const tokens = this.estimateTokens(msg.content);
      if (totalTokens + tokens <= context.tokens.maximum * 0.8) {
        kept.push(msg);
        totalTokens += tokens;
      }
    }
    
    // Sort back by original order
    kept.sort((a, b) => a.index - b.index);
    
    // Update context
    const prunedTokens = context.tokens.current - totalTokens;
    context.content.messages = kept.map(({ index, score, ...msg }) => msg);
    context.tokens.current = totalTokens;
    context.tokens.pruned += prunedTokens;
  }
  
  /**
   * Calculate message importance
   */
  calculateImportance(message, index, allMessages) {
    let score = 0;
    
    // Recency (newer messages more important)
    const recencyScore = index / allMessages.length;
    score += recencyScore * 0.3;
    
    // Role importance
    if (message.role === 'system') score += 0.5;
    if (message.role === 'assistant') score += 0.3;
    
    // Content indicators
    if (message.content.includes('IMPORTANT')) score += 0.5;
    if (message.content.includes('TODO')) score += 0.4;
    if (message.content.includes('ERROR')) score += 0.4;
    if (message.content.includes('```')) score += 0.3; // Code blocks
    
    // Length (longer messages might be more detailed)
    const lengthScore = Math.min(message.content.length / 1000, 1) * 0.2;
    score += lengthScore;
    
    // References to files or URLs
    if (message.content.match(/\.(js|py|md|json|yaml)/)) score += 0.3;
    if (message.content.match(/https?:\/\//)) score += 0.2;
    
    return score;
  }
  
  /**
   * Save context to disk
   */
  async saveContext(contextId) {
    const context = this.contexts.get(contextId);
    
    if (!context) return;
    
    const filePath = path.join(
      this.config.storage.path,
      `${context.id}.${this.config.storage.format}`
    );
    
    try {
      let data = this.serializeContext(context);
      
      // Compress if enabled
      if (this.config.storage.compression) {
        data = this.compressData(data);
        context.state.compressed = true;
      }
      
      // Encrypt if enabled
      if (this.config.storage.encryption) {
        data = this.encryptData(data);
        context.state.encrypted = true;
      }
      
      fs.writeFileSync(filePath, data);
      
      this.metrics.tokensSaved += context.tokens.current;
      
      this.emit('context-saved', { id: contextId, path: filePath });
      
      return true;
    } catch (error) {
      logger.error(`Failed to save context ${contextId}:`, error);
      return false;
    }
  }
  
  /**
   * Load existing contexts
   */
  async loadExistingContexts() {
    if (!fs.existsSync(this.config.storage.path)) {
      return;
    }
    
    const files = fs.readdirSync(this.config.storage.path);
    
    for (const file of files) {
      if (!file.startsWith('ctx_')) continue;
      
      try {
        const filePath = path.join(this.config.storage.path, file);
        let data = fs.readFileSync(filePath, 'utf8');
        
        // Decrypt if needed
        if (file.includes('.encrypted')) {
          data = this.decryptData(data);
        }
        
        // Decompress if needed
        if (file.includes('.compressed')) {
          data = this.decompressData(data);
        }
        
        const context = this.deserializeContext(data);
        this.contexts.set(context.id, context);
        
        this.metrics.contextsRestored++;
      } catch (error) {
        logger.warn(`Failed to load context from ${file}:`, error.message);
      }
    }
    
    logger.info(`📚 Loaded ${this.metrics.contextsRestored} existing contexts`);
  }
  
  /**
   * Serialize context for storage
   */
  serializeContext(context) {
    const serialized = {
      ...context,
      content: {
        ...context.content,
        files: Array.from(context.content.files),
        references: Array.from(context.content.references.entries())
      },
      relationships: {
        ...context.relationships,
        children: Array.from(context.relationships.children),
        related: Array.from(context.relationships.related)
      }
    };
    
    if (this.config.storage.format === 'json') {
      return JSON.stringify(serialized, null, 2);
    } else if (this.config.storage.format === 'markdown') {
      return this.toMarkdown(serialized);
    }
    
    return JSON.stringify(serialized);
  }
  
  /**
   * Deserialize context from storage
   */
  deserializeContext(data) {
    let parsed;
    
    if (this.config.storage.format === 'json') {
      parsed = JSON.parse(data);
    } else if (this.config.storage.format === 'markdown') {
      parsed = this.fromMarkdown(data);
    } else {
      parsed = JSON.parse(data);
    }
    
    // Restore Sets and Maps
    parsed.content.files = new Set(parsed.content.files);
    parsed.content.references = new Map(parsed.content.references);
    parsed.relationships.children = new Set(parsed.relationships.children);
    parsed.relationships.related = new Set(parsed.relationships.related);
    
    return parsed;
  }
  
  /**
   * Convert context to Markdown
   */
  toMarkdown(context) {
    let md = `# Context: ${context.name}\n\n`;
    md += `- **ID:** ${context.id}\n`;
    md += `- **Type:** ${context.type}\n`;
    md += `- **Created:** ${new Date(context.createdAt).toISOString()}\n`;
    md += `- **Tokens:** ${context.tokens.current}/${context.tokens.maximum}\n\n`;
    
    md += `## Messages\n\n`;
    context.content.messages.forEach(msg => {
      md += `### ${msg.role} (${new Date(msg.timestamp).toISOString()})\n`;
      md += `${msg.content}\n\n`;
    });
    
    if (context.content.files.length > 0) {
      md += `## Files\n\n`;
      context.content.files.forEach(file => {
        md += `- ${file}\n`;
      });
    }
    
    return md;
  }
  
  /**
   * Parse context from Markdown
   */
  fromMarkdown(data) {
    // Simple parser - in production would need more robust parsing
    const lines = data.split('\n');
    const context = {
      content: { messages: [], files: [], references: [] },
      relationships: { children: [], related: [] },
      tokens: {}
    };
    
    // Parse header
    for (const line of lines) {
      if (line.includes('**ID:**')) {
        context.id = line.split('**ID:**')[1].trim();
      } else if (line.includes('**Type:**')) {
        context.type = line.split('**Type:**')[1].trim();
      }
    }
    
    return context;
  }
  
  /**
   * Estimate token count
   */
  estimateTokens(content) {
    // Rough estimation: 1 token per 4 characters
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Calculate total tokens
   */
  calculateTotalTokens(context) {
    let total = 0;
    
    // Messages
    context.content.messages.forEach(msg => {
      total += this.estimateTokens(msg.content);
    });
    
    // Files (just names)
    context.content.files.forEach(file => {
      total += this.estimateTokens(file);
    });
    
    // References
    context.content.references.forEach(ref => {
      total += this.estimateTokens(ref);
    });
    
    return total;
  }
  
  /**
   * Calculate relevance score
   */
  calculateRelevance(query, context) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Check message content
    context.content.messages.forEach(msg => {
      const matches = (msg.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
      score += matches * 2;
    });
    
    // Check recency
    const ageHours = (Date.now() - context.updatedAt) / (1000 * 60 * 60);
    score += Math.max(0, 100 - ageHours);
    
    // Check context type priority
    if (context.type === 'project') score += 10;
    if (context.type === 'global') score += 5;
    
    return score;
  }
  
  /**
   * Simple data compression (mock)
   */
  compressData(data) {
    // In production, use zlib or similar
    return Buffer.from(data).toString('base64');
  }
  
  /**
   * Simple data decompression (mock)
   */
  decompressData(data) {
    return Buffer.from(data, 'base64').toString('utf8');
  }
  
  /**
   * Simple encryption (mock)
   */
  encryptData(data) {
    // In production, use crypto module
    return Buffer.from(data).reverse().toString('base64');
  }
  
  /**
   * Simple decryption (mock)
   */
  decryptData(data) {
    return Buffer.from(data, 'base64').reverse().toString('utf8');
  }
  
  /**
   * Setup auto-save
   */
  setupAutoSave() {
    setInterval(() => {
      // Save active context
      if (this.activeContext) {
        this.saveContext(this.activeContext);
      }
      
      // Save recently updated contexts
      for (const [id, context] of this.contexts) {
        const ageMinutes = (Date.now() - context.updatedAt) / (1000 * 60);
        if (ageMinutes < 5) {
          this.saveContext(id);
        }
      }
    }, 60000); // Every minute
  }
  
  /**
   * Export context for sharing
   */
  exportContext(contextId, format = 'json') {
    const context = this.getContext(contextId);
    
    if (!context) {
      throw new Error('Context not found');
    }
    
    if (format === 'json') {
      return JSON.stringify(context, null, 2);
    } else if (format === 'markdown') {
      return this.toMarkdown(context);
    } else if (format === 'claude') {
      // Format optimized for Claude
      return this.formatForClaude(context);
    }
    
    return context;
  }
  
  /**
   * Format context for Claude
   */
  formatForClaude(context) {
    let formatted = `<context id="${context.id}" name="${context.name}" type="${context.type}">\n`;
    
    context.messages.forEach(msg => {
      formatted += `<message role="${msg.role}" timestamp="${msg.timestamp}">\n`;
      formatted += msg.content;
      formatted += `\n</message>\n`;
    });
    
    if (context.files.length > 0) {
      formatted += `<files>\n`;
      context.files.forEach(file => {
        formatted += `  <file>${file}</file>\n`;
      });
      formatted += `</files>\n`;
    }
    
    formatted += `</context>`;
    
    return formatted;
  }
  
  /**
   * Show setup guide
   */
  showSetupGuide() {
    console.log(`
🧠 Claude Context MCP Server Setup Guide
========================================

1. Install the Context MCP Server:
   npm install -g @modelcontextprotocol/server-context
   
   Or use npx:
   npx @modelcontextprotocol/server-context

2. Configure Claude Desktop:
   Add to ~/Library/Application Support/Claude/claude_desktop_config.json:
   
   {
     "mcpServers": {
       "context": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-context"]
       }
     }
   }

3. Restart Claude Desktop

4. Verify installation:
   In Claude, the context server should be available
   
5. Configure in BUMBA:
   Add to .env:
   CONTEXT_MCP_ENABLED=true
   CONTEXT_MAX_SIZE=200000
   CONTEXT_STORAGE_PATH=~/.bumba/context
   
6. Use the integration:
   const context = new ContextMCPIntegration();
   await context.initialize();
   
   // Create context
   const ctxId = context.createContext('my-project');
   
   // Add content
   context.addToContext(ctxId, 'Important information', { 
     type: 'message',
     role: 'system' 
   });
   
   // Search across contexts
   const results = context.searchContexts('important');
   
   // Export for sharing
   const exported = context.exportContext(ctxId, 'claude');

Benefits:
- Preserves context across Claude conversations
- Intelligent pruning keeps important information
- Cross-session and multi-project support
- Searchable context history
- Compression and encryption options
    `);
  }
  
  /**
   * Get status
   */
  getStatus() {
    return {
      serverAvailable: this.serverAvailable,
      contextsLoaded: this.contexts.size,
      activeContext: this.activeContext,
      storage: {
        path: this.config.storage.path,
        format: this.config.storage.format,
        compression: this.config.storage.compression,
        encryption: this.config.storage.encryption
      },
      features: this.config.features,
      metrics: this.metrics
    };
  }
  
  /**
   * Clean up old contexts
   */
  cleanupOldContexts(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const removed = [];
    
    for (const [id, context] of this.contexts) {
      if (context.updatedAt < cutoff && !context.state.active) {
        this.contexts.delete(id);
        removed.push(id);
        
        // Delete file if exists
        const filePath = path.join(
          this.config.storage.path,
          `${id}.${this.config.storage.format}`
        );
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    logger.info(`🧹 Cleaned up ${removed.length} old contexts`);
    
    return removed;
  }
}

// Singleton instance
let contextMCPIntegration = null;

module.exports = {
  ContextMCPIntegration,
  
  // Get singleton instance
  getInstance(config) {
    if (!contextMCPIntegration) {
      contextMCPIntegration = new ContextMCPIntegration(config);
    }
    return contextMCPIntegration;
  }
};