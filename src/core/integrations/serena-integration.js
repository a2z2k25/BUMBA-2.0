/**
 * BUMBA Serena Integration Module
 * Provides semantic code retrieval and editing capabilities through Serena MCP
 */

const { logger } = require('../logging/bumba-logger');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { BumbaError } = require('../error-handling/bumba-error-system');

class SerenaIntegration {
  constructor(config = {}) {
    this.server = null;
    this.initialized = false;
    this.config = {
      enabled: config.enabled !== false,
      apiKey: config.apiKey || process.env.SERENA_API_KEY,
      apiUrl: config.apiUrl || process.env.SERENA_API_URL,
      workspace: config.workspace || process.cwd(),
      indexPath: config.indexPath || '.serena-index',
      cacheEnabled: config.cacheEnabled !== false
    };
    this.capabilities = [
      'semantic-search',
      'find-references',
      'find-definitions',
      'find-implementations',
      'code-edit',
      'shell-execute',
      'workspace-symbols',
      'document-symbols'
    ];
  }

  /**
   * Initialize Serena MCP server connection
   */
  async initialize() {
    try {
      logger.info('🟢 Initializing Serena integration...');
      
      // Get Serena server through MCP resilience system
      this.server = await mcpServerManager.getServer('serena');
      
      // Check if we're using fallback
      if (this.server.fallbackType === 'basic-code-search') {
        logger.warn('🟡 Serena unavailable - using basic search fallback');
        logger.info('🟢 Install Serena MCP: uvx serena');
        logger.info('🟢 Provides semantic code analysis and editing');
      } else {
        logger.info('🏁 Serena integration initialized successfully');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('🔴 Failed to initialize Serena integration:', error);
      throw new BumbaError('SERENA_INIT_FAILED', error.message);
    }
  }

  /**
   * Perform semantic code search
   */
  async semanticSearch(query, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        query: query,
        workspace: options.workspace || process.cwd(),
        language: options.language,
        limit: options.limit || 20
      };
      
      const result = await this.server.execute('semantic-search', params);
      return result.data || [];
    } catch (error) {
      logger.error('Error in semantic search:', error);
      return this.fallbackSearch(query, 'semantic');
    }
  }

  /**
   * Find all references to a symbol
   */
  async findReferences(symbol, filePath, position) {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('find-references', {
        symbol: symbol,
        file: filePath,
        line: position.line,
        column: position.column
      });
      return result.data || [];
    } catch (error) {
      logger.error('Error finding references:', error);
      return [];
    }
  }

  /**
   * Find symbol definitions
   */
  async findDefinitions(symbol, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        symbol: symbol,
        workspace: options.workspace || process.cwd(),
        includeExternal: options.includeExternal || false
      };
      
      const result = await this.server.execute('find-definitions', params);
      return result.data || [];
    } catch (error) {
      logger.error('Error finding definitions:', error);
      return [];
    }
  }

  /**
   * Find implementations of an interface/abstract class
   */
  async findImplementations(interfaceName, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        interface: interfaceName,
        workspace: options.workspace || process.cwd(),
        language: options.language
      };
      
      const result = await this.server.execute('find-implementations', params);
      return result.data || [];
    } catch (error) {
      logger.error('Error finding implementations:', error);
      return [];
    }
  }

  /**
   * Edit code with semantic awareness
   */
  async editCode(filePath, edits) {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('code-edit', {
        file: filePath,
        edits: edits
      });
      
      logger.info(`🏁 Applied ${edits.length} edits to ${filePath}`);
      return result.data;
    } catch (error) {
      logger.error('Error editing code:', error);
      throw new BumbaError('SERENA_EDIT_FAILED', error.message);
    }
  }

  /**
   * Execute shell commands
   */
  async executeShell(command, options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        command: command,
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 30000
      };
      
      const result = await this.server.execute('shell-execute', params);
      return result.data;
    } catch (error) {
      logger.error('Error executing shell command:', error);
      throw new BumbaError('SERENA_SHELL_FAILED', error.message);
    }
  }

  /**
   * Get all symbols in workspace
   */
  async getWorkspaceSymbols(query = '', options = {}) {
    await this.ensureInitialized();
    
    try {
      const params = {
        query: query,
        workspace: options.workspace || process.cwd(),
        kinds: options.kinds || ['class', 'function', 'interface', 'method']
      };
      
      const result = await this.server.execute('workspace-symbols', params);
      return result.data || [];
    } catch (error) {
      logger.error('Error getting workspace symbols:', error);
      return [];
    }
  }

  /**
   * Get symbols in a specific document
   */
  async getDocumentSymbols(filePath) {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('document-symbols', {
        file: filePath
      });
      return result.data || [];
    } catch (error) {
      logger.error('Error getting document symbols:', error);
      return [];
    }
  }

  /**
   * Refactor code (rename symbol)
   */
  async renameSymbol(oldName, newName, filePath, position) {
    await this.ensureInitialized();
    
    try {
      const result = await this.server.execute('rename-symbol', {
        oldName: oldName,
        newName: newName,
        file: filePath,
        line: position.line,
        column: position.column
      });
      
      logger.info(`🏁 Renamed ${oldName} to ${newName} across ${result.data.filesModified} files`);
      return result.data;
    } catch (error) {
      logger.error('Error renaming symbol:', error);
      throw new BumbaError('SERENA_RENAME_FAILED', error.message);
    }
  }

  /**
   * Fallback search when Serena is unavailable
   */
  fallbackSearch(query, searchType) {
    logger.info(`🟢 Using basic text search for ${searchType}`);
    
    return {
      matches: [],
      fallback: true,
      message: 'Using basic search - install Serena MCP for semantic code analysis'
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
      usingFallback: this.server && this.server.fallbackType === 'basic-code-search',
      capabilities: this.capabilities
    };
  }

  /**
   * Analyze code quality and suggest improvements
   */
  async analyzeCodeQuality(filePath, options = {}) {
    await this.ensureInitialized();
    
    try {
      const symbols = await this.getDocumentSymbols(filePath);
      const analysis = {
        file: filePath,
        issues: [],
        suggestions: []
      };
      
      // Analyze function complexity
      const functions = symbols.filter(s => s.kind === 'function' || s.kind === 'method');
      for (const func of functions) {
        if (func.complexity && func.complexity > 10) {
          analysis.issues.push({
            type: 'complexity',
            symbol: func.name,
            message: `Function ${func.name} has high complexity (${func.complexity})`
          });
        }
      }
      
      return analysis;
    } catch (error) {
      logger.error('Error analyzing code quality:', error);
      return { file: filePath, issues: [], suggestions: [] };
    }
  }

  /**
   * Get code navigation data for a file
   */
  async getNavigationData(filePath) {
    await this.ensureInitialized();
    
    try {
      const [symbols, references] = await Promise.all([
        this.getDocumentSymbols(filePath),
        this.findReferences('*', filePath, { line: 0, column: 0 })
      ]);
      
      return {
        symbols: symbols,
        references: references,
        file: filePath
      };
    } catch (error) {
      logger.error('Error getting navigation data:', error);
      return { symbols: [], references: [], file: filePath };
    }
  }
}

// Export singleton instance
const serenaIntegration = new SerenaIntegration();

module.exports = {
  SerenaIntegration,
  serenaIntegration
};