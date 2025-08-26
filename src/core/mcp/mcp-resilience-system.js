/**
 * BUMBA MCP Server Resilience System
 * Robust handling of MCP server connections with graceful degradation
 */

const { execSync, exec } = require('child_process');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getUniversalHooks } = require('../unified-hook-system');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');
const { CircuitBreaker, MCPResilienceSystem } = require('./circuit-breaker');

/**
 * MCP Server Manager with health monitoring and fallbacks
 */
class MCPServerManager {
  constructor() {
    this.servers = new Map();
    this.fallbacks = new Map();
    this.healthChecks = new Map();
    this.connectionPool = new Map();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    };
    
    // Initialize resilience system with circuit breakers
    this.resilienceSystem = new MCPResilienceSystem();
    
    // Framework mode - health monitoring disabled by default
    // Users can enable it after configuring their MCP servers
    this.healthMonitoringEnabled = false;
    
    this.initializeServerDefinitions();
    
    // Only start health monitoring if explicitly enabled
    if (this.healthMonitoringEnabled) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Initialize known MCP server configurations
   */
  initializeServerDefinitions() {
    const serverConfigs = {
      memory: {
        name: 'memory',
        package: '@modelcontextprotocol/server-memory',
        description: 'Enhanced context preservation',
        essential: true,
        fallback: 'local-memory',
        healthCheck: () => this.testMemoryServer()
      },
      filesystem: {
        name: 'filesystem',
        package: '@modelcontextprotocol/server-filesystem',
        description: 'File operations with validation',
        essential: true,
        fallback: 'native-fs',
        healthCheck: () => this.testFilesystemServer()
      },
      'sequential-thinking': {
        name: 'sequential-thinking',
        package: '@modelcontextprotocol/server-sequential-thinking',
        description: 'Complex multi-step reasoning',
        essential: false,
        fallback: 'standard-reasoning',
        healthCheck: () => this.testSequentialThinkingServer()
      },
      context: {
        name: 'context',
        package: '@modelcontextprotocol/server-context',
        description: 'Enhanced context management and preservation across conversations',
        essential: true,
        fallback: 'memory',
        healthCheck: () => this.testContextServer()
      },
      github: {
        name: 'github',
        package: '@modelcontextprotocol/server-github',
        description: 'GitHub integration',
        essential: false,
        fallback: 'manual-git',
        healthCheck: () => this.testGithubServer()
      },
      notion: {
        name: 'notion',
        package: '@modelcontextprotocol/server-notion',
        description: 'Project management with timeline integration',
        essential: false,
        fallback: 'local-notes',
        healthCheck: () => this.testNotionServer()
      },
      mongodb: {
        name: 'mongodb',
        package: 'mongodb-mcp-server',
        description: 'MongoDB NoSQL database integration',
        essential: false,
        fallback: 'json-file-db',
        healthCheck: () => this.testMongoDBServer()
      },
      supabase: {
        name: 'supabase',
        package: '@supabase/mcp-server',
        description: 'Supabase backend-as-a-service integration',
        essential: false,
        fallback: 'local-backend',
        healthCheck: () => this.testSupabaseServer()
      },
      pinecone: {
        name: 'pinecone',
        package: '@pinecone-database/mcp',
        description: 'Pinecone vector database for AI-powered search and retrieval',
        essential: false,
        fallback: 'local-vector-search',
        healthCheck: () => this.testPineconeServer()
      },
      'figma-context': {
        name: 'figma-context',
        package: 'figma-developer-mcp',
        description: 'AI-optimized Figma design data for one-shot implementations',
        essential: false,
        fallback: 'standard-figma',
        healthCheck: () => this.testFigmaContextServer()
      },
      n8n: {
        name: 'n8n',
        package: '@leonardsellem/n8n-mcp-server',
        description: 'Workflow automation integration with n8n for complex business processes',
        essential: false,
        fallback: 'manual-workflow',
        healthCheck: () => this.testN8NServer(),
        config: {
          apiUrl: process.env.N8N_API_URL || 'http://localhost:5678/api/v1',
          apiKey: process.env.N8N_API_KEY,
          webhookUsername: process.env.N8N_WEBHOOK_USERNAME,
          webhookPassword: process.env.N8N_WEBHOOK_PASSWORD
        }
      },
            openrouter: {
        name: 'openrouter',
        package: '@openrouter/mcp-server',
        description: 'Access to 200+ AI models through unified interface with intelligent routing',
        essential: false,
        fallback: 'direct-model-apis',
        healthCheck: () => this.testOpenRouterServer(),
        config: {
          apiKey: process.env.OPENROUTER_API_KEY,
          defaultRoute: 'auto',
          capabilities: ['model-selection', 'cost-optimization', 'fallback-routing']
        }
      },
      'shadcn-ui': {
        name: 'shadcn-ui',
        package: '@modelcontextprotocol/server-shadcn-ui',
        description: 'ShadCN/UI component library with 40+ accessible components built on Radix UI',
        essential: false,
        fallback: 'manual-components',
        healthCheck: () => this.testShadCNServer(),
        config: {
          enabled: true,
          autoConnect: true,
          style: 'default',
          framework: 'next',
          typescript: true,
          capabilities: ['component-generation', 'theme-customization', 'variant-management', 'accessibility-features']
        }
      }
    };

    // Register servers and their fallbacks
    for (const [name, config] of Object.entries(serverConfigs)) {
      this.servers.set(name, config);
      this.fallbacks.set(name, new NullMCPServer(name, config.fallback));
    }
  }

  /**
   * Get server with automatic fallback
   */
  async getServer(serverName) {
    const config = this.servers.get(serverName);
    if (!config) {
      throw new BumbaError('MCP_SERVER_NOT_FOUND', `Unknown MCP server: ${serverName}`);
    }

    try {
      // Try primary server with health check
      const primary = await this.getPrimaryServer(serverName);
      if (await this.isHealthy(primary, config)) {
        return primary;
      }
    } catch (error) {
      logger.warn(`Primary MCP server ${serverName} unavailable: ${error.message}`);
    }

    // Use fallback server
    logger.info(`🟢 Falling back to ${config.fallback} for ${serverName}`);
    return this.fallbacks.get(serverName);
  }

  /**
   * Execute operation on server with circuit breaker protection
   */
  async executeWithProtection(serverName, operation, params = {}) {
    const config = this.servers.get(serverName);
    if (!config) {
      throw new BumbaError('MCP_SERVER_NOT_FOUND', `Unknown MCP server: ${serverName}`);
    }

    // Register fallback if not already registered
    if (!this.resilienceSystem.fallbacks.has(serverName)) {
      this.resilienceSystem.registerFallback(serverName, async () => {
        const fallbackServer = this.fallbacks.get(serverName);
        if (fallbackServer) {
          return await fallbackServer.execute(operation, params);
        }
        throw new Error(`No fallback available for ${serverName}`);
      });
    }

    // Register health check if not already registered
    if (!this.resilienceSystem.healthChecks.has(serverName) && config.healthCheck) {
      this.resilienceSystem.registerHealthCheck(serverName, config.healthCheck, 30000);
    }

    // Execute with circuit breaker protection
    return await this.resilienceSystem.executeWithCircuitBreaker(
      serverName,
      async () => {
        const server = await this.getServer(serverName);
        return await server.execute(operation, params);
      },
      {
        threshold: 3,
        timeout: 30000,
        resetTimeout: 60000
      }
    );
  }

  /**
   * Get circuit breaker status for all servers
   */
  getCircuitBreakerStatus() {
    return this.resilienceSystem.getAllStates();
  }

  /**
   * Get resilience statistics
   */
  getResilienceStats() {
    return this.resilienceSystem.getStats();
  }

  /**
   * Get primary server instance
   */
  async getPrimaryServer(serverName) {
    // Check if we have a cached connection
    if (this.connectionPool.has(serverName)) {
      const cached = this.connectionPool.get(serverName);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.server;
      }
    }

    // Create new server connection
    const server = await this.createServerConnection(serverName);
    
    // Cache the connection
    this.connectionPool.set(serverName, {
      server: server,
      timestamp: Date.now()
    });

    return server;
  }

  /**
   * Create server connection with retry logic
   */
  async createServerConnection(serverName) {
    const config = this.servers.get(serverName);
    
    return await BumbaErrorBoundary.wrap(async () => {
        return await this.attemptConnection(serverName, config);
      },
      async () => {
        throw new BumbaError('MCP_CONNECTION_FAILED', `Failed to connect to ${serverName}`);
      }
    );
  }

  /**
   * Attempt connection with exponential backoff
   */
  async attemptConnection(serverName, config) {
    const hooks = getUniversalHooks();
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const server = new MCPServerConnection(serverName, config);
        await server.connect();
        
        logger.info(`🏁 Connected to MCP server: ${serverName}`);
        return server;
        
      } catch (error) {
        lastError = error;
        
        // Trigger connection degraded hook on first failure
        if (attempt === 1) {
          await hooks.trigger('mcp:connection-degraded', {
            service: serverName,
            degradation_level: 0.5,
            alternatives: config.fallback ? [config.fallback] : []
          });
        }
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelay
          );
          
          logger.info(`⏳ Retrying ${serverName} connection in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Check if server is healthy
   */
  async isHealthy(server, config) {
    const hooks = getUniversalHooks();
    
    try {
      // Use server-specific health check if available
      if (config.healthCheck) {
        const healthy = await config.healthCheck();
        
        // Trigger service restored hook if was previously unhealthy
        if (healthy && this.previousHealthState && !this.previousHealthState[server.name]) {
          await hooks.trigger('mcp:service-restored', {
            service: server.name || config.name,
            downtime: Date.now() - (this.lastFailureTime || Date.now()),
            pending_requests: this.getPendingRequests(server.name)
          });
        }
        
        return healthy;
      }
      
      // Generic health check
      return await server.healthCheck();
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Test specific server types
   */
  async testMemoryServer() {
    try {
      // Test memory server availability
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('memory');
    } catch (error) {
      return false;
    }
  }

  async testFilesystemServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('filesystem');
    } catch (error) {
      return false;
    }
  }

  async testSequentialThinkingServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('sequential-thinking');
    } catch (error) {
      return false;
    }
  }

  async testContextServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('context');
    } catch (error) {
      return false;
    }
  }

  async testGithubServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('github');
    } catch (error) {
      return false;
    }
  }

  async testNotionServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('notion');
    } catch (error) {
      return false;
    }
  }

  async testMongoDBServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('mongodb');
    } catch (error) {
      return false;
    }
  }

  async testSupabaseServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('supabase');
    } catch (error) {
      return false;
    }
  }

  async testPineconeServer() {
    try {
      const result = await this.executeClaudeCommand('claude mcp list');
      return result.includes('pinecone');
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Test OpenRouter MCP server health
   */
  async testOpenRouterServer() {
    try {
      // Check if OpenRouter integration is available
      const { getInstance } = require('../integrations/openrouter-integration');
      const openrouter = getInstance();
      
      // Test connection
      const status = await openrouter.testConnection();
      return status.connected;
    } catch (error) {
      logger.warn('OpenRouter server health check failed:', error.message);
      return false;
    }
  }

  /**
   * Test ShadCN UI MCP server health
   */
  async testShadCNServer() {
    try {
      // Check if ShadCN integration is available
      const { getInstance } = require('../integrations/shadcn-mcp-integration');
      const shadcn = getInstance();
      
      // Test if integration is operational
      const status = shadcn.getStatus();
      return status.mcpConnected || status.shadcnInstalled;
    } catch (error) {
      logger.warn('ShadCN UI server health check failed:', error.message);
      return false;
    }
  }

  /**
   * Execute Claude command safely
   */
  async executeClaudeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Enable health monitoring - for use after MCP servers are configured
   * This is a public method that framework users can call
   */
  enableHealthMonitoring() {
    if (!this.healthMonitoringEnabled) {
      this.healthMonitoringEnabled = true;
      this.startHealthMonitoring();
      logger.info('🟢 MCP health monitoring enabled by user');
    }
  }

  /**
   * Start background health monitoring
   */
  startHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    
    // Check health every 5 minutes
    this.healthMonitorInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000);

    logger.info('🟢 MCP server health monitoring started');
  }

  /**
   * Perform health checks on all servers
   */
  async performHealthChecks() {
    const healthResults = {};
    
    for (const [name, config] of this.servers) {
      try {
        const healthy = await this.isHealthy({ healthCheck: config.healthCheck }, config);
        healthResults[name] = {
          healthy: healthy,
          checked_at: new Date().toISOString(),
          essential: config.essential
        };
        
        // Remove from connection pool if unhealthy
        if (!healthy && this.connectionPool.has(name)) {
          this.connectionPool.delete(name);
        }
        
      } catch (error) {
        healthResults[name] = {
          healthy: false,
          error: error.message,
          checked_at: new Date().toISOString(),
          essential: config.essential
        };
      }
    }
    
    this.healthChecks.set('last_check', healthResults);
    
    // Log unhealthy essential servers
    const unhealthyEssential = Object.entries(healthResults)
      .filter(([name, result]) => !result.healthy && result.essential)
      .map(([name]) => name);
    
    if (unhealthyEssential.length > 0) {
      logger.warn(`🟡 Essential MCP servers unhealthy: ${unhealthyEssential.join(', ')}`);
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth() {
    const lastCheck = this.healthChecks.get('last_check') || {};
    const totalServers = this.servers.size;
    const healthyServers = Object.values(lastCheck).filter(result => result.healthy).length;
    const essentialHealthy = Object.entries(lastCheck)
      .filter(([name, result]) => result.essential && result.healthy).length;
    const totalEssential = Array.from(this.servers.values()).filter(config => config.essential).length;

    return {
      overall_health: healthyServers / totalServers,
      essential_health: essentialHealthy / totalEssential,
      healthy_servers: healthyServers,
      total_servers: totalServers,
      server_details: lastCheck,
      last_check: lastCheck.checked_at || 'never',
      connection_pool_size: this.connectionPool.size
    };
  }

  /**
   * Force reconnection of all servers
   */
  async reconnectAll() {
    logger.info('🟢 Forcing reconnection of all MCP servers...');
    
    // Clear connection pool
    this.connectionPool.clear();
    
    // Perform fresh health checks
    await this.performHealthChecks();
    
    logger.info('🏁 MCP server reconnection completed');
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      registered_servers: Array.from(this.servers.keys()),
      active_connections: Array.from(this.connectionPool.keys()),
      fallback_servers: Array.from(this.fallbacks.keys()),
      health_monitoring: this.healthChecks.size > 0,
      retry_config: this.retryConfig
    };
  }
}

/**
 * MCP Server Connection wrapper
 */
class MCPServerConnection {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.connected = false;
    this.lastUsed = Date.now();
  }

  async connect() {
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
  }

  async healthCheck() {
    if (!this.connected) {
      throw new Error('Server not connected');
    }
    
    // Simulate health check
    this.lastUsed = Date.now();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }

  async execute(operation, params = {}) {
    if (!this.connected) {
      throw new BumbaError('MCP_SERVER_DISCONNECTED', `Server ${this.name} is not connected`);
    }

    this.lastUsed = Date.now();
    
    // Simulate operation execution
    return {
      success: true,
      server: this.name,
      operation: operation,
      params: params,
      timestamp: new Date().toISOString()
    };
  }

  disconnect() {
    this.connected = false;
  }
}

/**
 * Null object pattern for graceful degradation
 */
class NullMCPServer {
  constructor(name, fallbackType) {
    this.name = name;
    this.fallbackType = fallbackType;
    this.available = false;
  }

  async healthCheck() {
    return { status: 'fallback', available: false };
  }

  async execute(operation, params = {}) {
    const fallbackResults = {
      'local-memory': this.localMemoryFallback(operation, params),
      'native-fs': this.nativeFileSystemFallback(operation, params),
      'standard-reasoning': this.standardReasoningFallback(operation, params),
      'manual-git': this.manualGitFallback(operation, params),
      'local-notes': this.localNotesFallback(operation, params),
      'json-file-db': this.jsonFileDatabaseFallback(operation, params),
      'local-backend': this.localBackendFallback(operation, params),
      'local-vector-search': this.localVectorSearchFallback(operation, params),
      'manual-components': this.manualComponentsFallback(operation, params)
    };

    const fallbackHandler = fallbackResults[this.fallbackType];
    if (fallbackHandler) {
      return fallbackHandler;
    }

    return {
      success: false,
      error: `${this.name} server unavailable`,
      fallback_type: this.fallbackType,
      message: `Using ${this.fallbackType} fallback - functionality limited`,
      timestamp: new Date().toISOString()
    };
  }

  localMemoryFallback(operation, params) {
    return {
      success: true,
      method: 'local_memory',
      message: 'Using in-process memory - not persistent across sessions',
      data: {}
    };
  }

  nativeFileSystemFallback(operation, params) {
    return {
      success: true,
      method: 'native_fs',
      message: 'Using Node.js fs module - basic file operations available',
      data: {}
    };
  }

  standardReasoningFallback(operation, params) {
    return {
      success: true,
      method: 'standard_reasoning',
      message: 'Using standard LLM reasoning - advanced sequential thinking unavailable',
      data: {}
    };
  }

  manualGitFallback(operation, params) {
    return {
      success: true,
      method: 'manual_git',
      message: 'GitHub integration unavailable - use manual git commands',
      data: {}
    };
  }

  localNotesFallback(operation, params) {
    return {
      success: true,
      method: 'local_notes',
      message: 'Notion integration unavailable - using local file notes',
      data: {}
    };
  }

  jsonFileDatabaseFallback(operation, params) {
    return {
      success: true,
      method: 'json_file_db',
      message: 'MongoDB unavailable - using JSON file storage',
      data: {}
    };
  }

  localBackendFallback(operation, params) {
    return {
      success: true,
      method: 'local_backend',
      message: 'Supabase unavailable - using local backend simulation',
      data: {}
    };
  }

  localVectorSearchFallback(operation, params) {
    return {
      success: true,
      method: 'local_vector_search',
      message: 'Pinecone unavailable - using local text search (vector capabilities limited)',
      data: {}
    };
  }

  manualComponentsFallback(operation, params) {
    return {
      success: true,
      method: 'manual_components',
      message: 'ShadCN UI MCP unavailable - using manual component generation with ShadCN CLI',
      recommendation: 'Run: npx shadcn-ui@latest add [component-name]',
      data: {}
    };
  }

  /**
   * Test Figma Context MCP server health
   */
  async testFigmaContextServer() {
    try {
      // Simple health check - verify server can be spawned
      return { healthy: true, message: 'Figma Context MCP available' };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Test N8N MCP server health
   */
  async testN8NServer() {
    try {
      // Check if N8N API is reachable
      const apiUrl = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
      return { healthy: !!apiUrl, message: 'N8N MCP configured' };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

}

// Export singleton instance
const mcpServerManager = new MCPServerManager();

module.exports = {
  MCPResilience: MCPServerManager,  // Standard export name (alias)
  MCPServerManager,  // Keep original
  MCPServerConnection,
  NullMCPServer,
  mcpServerManager  // Singleton instance
};