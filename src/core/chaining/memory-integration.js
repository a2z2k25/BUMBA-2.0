/**
 * BUMBA Chain Memory Integration
 * Stores chains and templates in memory for recall and learning
 * Integrates with memory MCP when available
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getMCPConnectionManager } = require('../mcp/mcp-connection-manager');

class ChainMemory extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxChains: options.maxChains || 1000,
      maxTemplates: options.maxTemplates || 100,
      persistenceEnabled: options.persistenceEnabled !== undefined ? 
        options.persistenceEnabled : true,
      ...options
    };
    
    // Memory stores
    this.chains = new Map();
    this.templates = new Map();
    this.patterns = new Map();
    this.failures = new Map();
    
    // MCP memory integration (if available)
    this.memoryMCP = null;
    
    // Statistics
    this.stats = {
      chainsSaved: 0,
      chainsRecalled: 0,
      templatesSaved: 0,
      templatesRecalled: 0,
      patternsDetected: 0
    };
  }
  
  /**
   * Connect to memory MCP with robust retry logic
   */
  async connectMCP(mcpClient) {
    try {
      // Use MCP connection manager for robust connection
      const connectionManager = getMCPConnectionManager();
      
      // Connect with retry logic and validation
      const connection = await connectionManager.connect('memory', mcpClient, {
        maxRetries: 3,
        retryDelay: 1000,
        validateOnConnect: true,
        healthCheckInterval: 60000, // Check every minute
        metadata: {
          purpose: 'chain-memory',
          component: 'ChainMemory'
        }
      });
      
      if (connection) {
        this.memoryMCP = connection;
        logger.info('🟢 Chain Memory connected to MCP with retry protection');
        
        // Load existing chains from MCP
        await this.loadFromMCP();
        
        // Listen for connection events
        connectionManager.on('disconnected', (serverName) => {
          if (serverName === 'memory') {
            logger.warn('Memory MCP disconnected, will attempt reconnection');
            this.emit('mcp:disconnected');
          }
        });
        
        connectionManager.on('connected', (serverName) => {
          if (serverName === 'memory' && this.memoryMCP) {
            logger.info('Memory MCP reconnected successfully');
            this.emit('mcp:reconnected');
            // Reload data after reconnection
            this.loadFromMCP().catch(err => 
              logger.error('Failed to reload from MCP after reconnection:', err)
            );
          }
        });
      }
    } catch (error) {
      logger.warn('Could not connect to memory MCP after retries:', error.message);
      // Continue without MCP - use local memory only
      this.memoryMCP = null;
    }
  }
  
  /**
   * Save a chain execution to memory
   */
  async saveChain(chain, result, metadata = {}) {
    const id = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const entry = {
      id,
      chain,
      result,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        success: result && !result.error,
        duration: result?.duration,
        commandCount: this.countCommands(chain)
      }
    };
    
    // Store locally
    this.chains.set(id, entry);
    this.stats.chainsSaved++;
    
    // Detect patterns
    this.detectPatterns(chain);
    
    // Save to MCP if available
    if (this.memoryMCP) {
      await this.saveMCPEntry('chain', entry);
    }
    
    // Emit event
    this.emit('chain-saved', entry);
    
    // Cleanup if over limit
    if (this.chains.size > this.options.maxChains) {
      this.pruneChains();
    }
    
    return id;
  }
  
  /**
   * Save a template to memory
   */
  async saveTemplate(key, template, metadata = {}) {
    const entry = {
      key,
      template,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        useCount: 0,
        successRate: 100
      }
    };
    
    // Store locally
    this.templates.set(key, entry);
    this.stats.templatesSaved++;
    
    // Save to MCP if available
    if (this.memoryMCP) {
      await this.saveMCPEntry('template', entry);
    }
    
    // Emit event
    this.emit('template-saved', entry);
    
    return key;
  }
  
  /**
   * Recall chains matching a query
   */
  async recallChains(query, limit = 10) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search local memory
    for (const [id, entry] of this.chains.entries()) {
      if (this.matchesQuery(entry, lowerQuery)) {
        results.push(entry);
      }
      
      if (results.length >= limit) {
        break;
      }
    }
    
    // Search MCP if available and need more results
    if (this.memoryMCP && results.length < limit) {
      const mcpResults = await this.searchMCP('chain', query, limit - results.length);
      results.push(...mcpResults);
    }
    
    this.stats.chainsRecalled += results.length;
    
    return results;
  }
  
  /**
   * Recall templates matching a query
   */
  async recallTemplates(query, limit = 10) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search local memory
    for (const [key, entry] of this.templates.entries()) {
      if (this.matchesTemplateQuery(entry, lowerQuery)) {
        results.push(entry);
      }
      
      if (results.length >= limit) {
        break;
      }
    }
    
    // Search MCP if available
    if (this.memoryMCP && results.length < limit) {
      const mcpResults = await this.searchMCP('template', query, limit - results.length);
      results.push(...mcpResults);
    }
    
    this.stats.templatesRecalled += results.length;
    
    return results;
  }
  
  /**
   * Get similar chains to a given chain
   */
  getSimilarChains(chain, limit = 5) {
    const chainCommands = this.extractCommands(chain);
    const similarities = [];
    
    for (const [id, entry] of this.chains.entries()) {
      const entryCommands = this.extractCommands(entry.chain);
      const similarity = this.calculateSimilarity(chainCommands, entryCommands);
      
      if (similarity > 0.3) { // 30% similarity threshold
        similarities.push({
          ...entry,
          similarity
        });
      }
    }
    
    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, limit);
  }
  
  /**
   * Learn from execution (update patterns and success rates)
   */
  async learnFromExecution(chain, result) {
    // Update pattern success rates
    const commands = this.extractCommands(chain);
    
    for (let i = 0; i < commands.length - 1; i++) {
      const pattern = `${commands[i]} >> ${commands[i + 1]}`;
      const patternData = this.patterns.get(pattern) || {
        count: 0,
        successes: 0,
        failures: 0
      };
      
      patternData.count++;
      
      if (result && !result.error) {
        patternData.successes++;
      } else {
        patternData.failures++;
      }
      
      this.patterns.set(pattern, patternData);
    }
    
    // Track failures for learning
    if (result && result.error) {
      const failureKey = this.getFailureKey(chain);
      const failureData = this.failures.get(failureKey) || {
        count: 0,
        lastError: null,
        solutions: []
      };
      
      failureData.count++;
      failureData.lastError = result.error;
      
      this.failures.set(failureKey, failureData);
    }
  }
  
  /**
   * Suggest chains based on context
   */
  suggestChains(context = {}, limit = 5) {
    const suggestions = [];
    
    // Based on recent failures
    if (context.hasError) {
      const errorChains = this.getErrorRecoveryChains();
      suggestions.push(...errorChains);
    }
    
    // Based on time of day
    const hour = new Date().getHours();
    const timeBasedChains = this.getTimeBasedChains(hour);
    suggestions.push(...timeBasedChains);
    
    // Based on frequently used patterns
    const frequentPatterns = this.getFrequentPatterns();
    suggestions.push(...frequentPatterns);
    
    // Remove duplicates and limit
    const unique = Array.from(new Set(suggestions.map(s => s.chain)))
      .map(chain => suggestions.find(s => s.chain === chain));
    
    return unique.slice(0, limit);
  }
  
  /**
   * Extract commands from chain string
   */
  extractCommands(chain) {
    const commandPattern = /\/bumba:[a-z\-]+/gi;
    return chain.match(commandPattern) || [];
  }
  
  /**
   * Count commands in chain
   */
  countCommands(chain) {
    return this.extractCommands(chain).length;
  }
  
  /**
   * Calculate similarity between command sets
   */
  calculateSimilarity(commands1, commands2) {
    const set1 = new Set(commands1);
    const set2 = new Set(commands2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) return 0;
    
    return intersection.size / union.size;
  }
  
  /**
   * Detect patterns in chain
   */
  detectPatterns(chain) {
    const commands = this.extractCommands(chain);
    
    // Detect sequential patterns (2-3 commands)
    for (let len = 2; len <= 3 && len <= commands.length; len++) {
      for (let i = 0; i <= commands.length - len; i++) {
        const pattern = commands.slice(i, i + len).join(' >> ');
        const count = (this.patterns.get(pattern)?.count || 0) + 1;
        
        this.patterns.set(pattern, {
          pattern,
          count,
          lastSeen: Date.now()
        });
      }
    }
    
    this.stats.patternsDetected = this.patterns.size;
  }
  
  /**
   * Check if entry matches query
   */
  matchesQuery(entry, query) {
    // Check chain content
    if (entry.chain.toLowerCase().includes(query)) {
      return true;
    }
    
    // Check metadata
    if (entry.metadata) {
      const metaStr = JSON.stringify(entry.metadata).toLowerCase();
      if (metaStr.includes(query)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if template matches query
   */
  matchesTemplateQuery(entry, query) {
    if (entry.key.toLowerCase().includes(query)) {
      return true;
    }
    
    if (entry.template) {
      const templateStr = JSON.stringify(entry.template).toLowerCase();
      if (templateStr.includes(query)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get failure key for chain
   */
  getFailureKey(chain) {
    const commands = this.extractCommands(chain);
    return commands.join('-');
  }
  
  /**
   * Get error recovery chains
   */
  getErrorRecoveryChains() {
    const chains = [];
    
    // Common error recovery patterns
    chains.push({
      chain: '/bumba:diagnose >> /bumba:fix >> /bumba:test',
      reason: 'Error recovery workflow',
      confidence: 0.8
    });
    
    chains.push({
      chain: '/bumba:rollback >> /bumba:test',
      reason: 'Quick rollback',
      confidence: 0.7
    });
    
    return chains;
  }
  
  /**
   * Get time-based chain suggestions
   */
  getTimeBasedChains(hour) {
    const chains = [];
    
    if (hour >= 6 && hour < 10) {
      chains.push({
        chain: '/bumba:status >> /bumba:sync',
        reason: 'Morning routine',
        confidence: 0.6
      });
    }
    
    if (hour >= 17 && hour < 19) {
      chains.push({
        chain: '/bumba:test >> /bumba:commit',
        reason: 'End of day wrap-up',
        confidence: 0.5
      });
    }
    
    return chains;
  }
  
  /**
   * Get frequent patterns as suggestions
   */
  getFrequentPatterns() {
    const patterns = Array.from(this.patterns.entries())
      .filter(([_, data]) => data.count > 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([pattern, data]) => ({
        chain: pattern,
        reason: `Used ${data.count} times`,
        confidence: Math.min(data.count / 10, 1)
      }));
    
    return patterns;
  }
  
  /**
   * Prune old chains
   */
  pruneChains() {
    const chains = Array.from(this.chains.entries())
      .sort((a, b) => b[1].metadata.timestamp - a[1].metadata.timestamp);
    
    // Keep most recent chains
    const toKeep = chains.slice(0, Math.floor(this.options.maxChains * 0.8));
    
    this.chains.clear();
    for (const [id, entry] of toKeep) {
      this.chains.set(id, entry);
    }
  }
  
  /**
   * Save entry to MCP
   */
  async saveMCPEntry(type, entry) {
    if (!this.memoryMCP) return;
    
    try {
      await this.memoryMCP.callTool('store', {
        key: `bumba-chain-${type}-${entry.id || entry.key}`,
        value: JSON.stringify(entry),
        metadata: {
          type: `chain-${type}`,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      logger.debug('Could not save to MCP:', error.message);
    }
  }
  
  /**
   * Search MCP for entries
   */
  async searchMCP(type, query, limit) {
    if (!this.memoryMCP) return [];
    
    try {
      const results = await this.memoryMCP.callTool('search', {
        query: `bumba-chain-${type} ${query}`,
        limit
      });
      
      return results.map(r => JSON.parse(r.value));
    } catch (error) {
      logger.debug('Could not search MCP:', error.message);
      return [];
    }
  }
  
  /**
   * Load existing chains from MCP
   */
  async loadFromMCP() {
    if (!this.memoryMCP) return;
    
    try {
      const chains = await this.searchMCP('chain', '', 100);
      for (const chain of chains) {
        this.chains.set(chain.id, chain);
      }
      
      const templates = await this.searchMCP('template', '', 50);
      for (const template of templates) {
        this.templates.set(template.key, template);
      }
      
      logger.info(`Loaded ${chains.length} chains and ${templates.length} templates from MCP`);
    } catch (error) {
      logger.debug('Could not load from MCP:', error.message);
    }
  }
  
  /**
   * Get memory statistics
   */
  getStats() {
    return {
      ...this.stats,
      chainsInMemory: this.chains.size,
      templatesInMemory: this.templates.size,
      patternsDetected: this.patterns.size,
      failuresTracked: this.failures.size
    };
  }
  
  /**
   * Clear all memory
   */
  clear() {
    this.chains.clear();
    this.templates.clear();
    this.patterns.clear();
    this.failures.clear();
    
    this.stats = {
      chainsSaved: 0,
      chainsRecalled: 0,
      templatesSaved: 0,
      templatesRecalled: 0,
      patternsDetected: 0
    };
  }
}

// Singleton instance
let memory = null;

/**
 * Get or create memory instance
 */
function getChainMemory(options) {
  if (!memory) {
    memory = new ChainMemory(options);
  }
  return memory;
}

module.exports = {
  ChainMemory,
  getChainMemory
};