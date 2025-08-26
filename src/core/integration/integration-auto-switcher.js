/**
 * BUMBA Integration Auto-Switcher
 * Automatically switches between mock and live providers based on availability
 * Provides transparent API that works regardless of integration state
 */

const { logger } = require('../logging/bumba-logger');
const activationManager = require('./integration-activation-manager');

class IntegrationAutoSwitcher {
  constructor() {
    this.providers = new Map();
    this.fallbackChains = new Map();
    this.activeProviders = new Map();
    
    // Track provider switches
    this.switchHistory = [];
    
    // Initialize providers
    this.initialize();
  }
  
  /**
   * Initialize auto-switching system
   */
  async initialize() {
    logger.info('🔄 Initializing Integration Auto-Switcher');
    
    // Register all providers
    await this.registerProviders();
    
    // Set up fallback chains
    this.setupFallbackChains();
    
    // Listen for integration changes
    activationManager.on('integrations:changed', (status) => {
      this.handleIntegrationChange(status);
    });
    
    // Perform initial provider selection
    await this.selectOptimalProviders();
  }
  
  /**
   * Register all available providers
   */
  async registerProviders() {
    // Notion providers
    this.registerProvider('notion', {
      live: async () => {
        try {
          const { Client } = require('@notionhq/client');
          return new Client({ auth: process.env.NOTION_API_KEY });
        } catch (error) {
          return null;
        }
      },
      mock: async () => {
        const { Client } = require('./mocks/notion-mock-provider');
        return new Client();
      },
      wrapper: this.createNotionWrapper.bind(this)
    });
    
    // OpenAI providers
    this.registerProvider('openai', {
      live: async () => {
        try {
          const OpenAI = require('openai');
          return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        } catch (error) {
          return null;
        }
      },
      mock: async () => {
        const { MockOpenAI } = require('./mocks/openai-mock-provider');
        return new MockOpenAI();
      },
      wrapper: this.createOpenAIWrapper.bind(this)
    });
    
    // Anthropic providers
    this.registerProvider('anthropic', {
      live: async () => {
        try {
          const Anthropic = require('@anthropic-ai/sdk');
          return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        } catch (error) {
          return null;
        }
      },
      mock: async () => {
        const { MockAnthropic } = require('./mocks/anthropic-mock-provider');
        return new MockAnthropic();
      },
      wrapper: this.createAnthropicWrapper.bind(this)
    });
    
    // GitHub providers
    this.registerProvider('github', {
      live: async () => {
        try {
          const { Octokit } = require('@octokit/rest');
          return new Octokit({ auth: process.env.GITHUB_TOKEN });
        } catch (error) {
          return null;
        }
      },
      mock: async () => {
        const { MockGitHub } = require('./mocks/github-mock-provider');
        return new MockGitHub();
      },
      wrapper: this.createGitHubWrapper.bind(this)
    });
    
    // MCP providers
    this.registerProvider('mcp', {
      live: async () => {
        try {
          const { MCPClient } = require('@modelcontextprotocol/sdk');
          return new MCPClient({ serverPath: process.env.MCP_SERVER_PATH });
        } catch (error) {
          return null;
        }
      },
      mock: async () => {
        const { MockMCP } = require('./mocks/mcp-mock-provider');
        return new MockMCP();
      },
      wrapper: this.createMCPWrapper.bind(this)
    });
  }
  
  /**
   * Register a provider
   */
  registerProvider(name, config) {
    this.providers.set(name, config);
    logger.debug(`📝 Registered provider: ${name}`);
  }
  
  /**
   * Set up fallback chains
   */
  setupFallbackChains() {
    // Define fallback order for each integration
    this.fallbackChains.set('notion', ['live', 'mock']);
    this.fallbackChains.set('openai', ['live', 'mock']);
    this.fallbackChains.set('anthropic', ['live', 'mock']);
    this.fallbackChains.set('github', ['live', 'mock']);
    this.fallbackChains.set('mcp', ['live', 'mock']);
  }
  
  /**
   * Select optimal providers based on availability
   */
  async selectOptimalProviders() {
    const status = activationManager.getStatus();
    
    for (const [name, config] of this.providers) {
      const integrationStatus = status.integrations[name];
      
      if (integrationStatus && integrationStatus.available) {
        // Try live provider first
        const liveProvider = await config.live();
        if (liveProvider) {
          this.activeProviders.set(name, {
            type: 'live',
            provider: liveProvider,
            wrapper: config.wrapper(liveProvider, 'live')
          });
          logger.info(`🏁 Using live provider for ${name}`);
          continue;
        }
      }
      
      // Fall back to mock
      const mockProvider = await config.mock();
      this.activeProviders.set(name, {
        type: 'mock',
        provider: mockProvider,
        wrapper: config.wrapper(mockProvider, 'mock')
      });
      logger.info(`🔴 Using mock provider for ${name}`);
    }
  }
  
  /**
   * Handle integration change event
   */
  async handleIntegrationChange(status) {
    logger.info('🔄 Integration status changed, re-evaluating providers');
    
    for (const [name, integrationStatus] of Object.entries(status.integrations)) {
      const current = this.activeProviders.get(name);
      
      if (!current) continue;
      
      // Check if we should switch providers
      if (integrationStatus.status === 'live' && current.type === 'mock') {
        // Try to switch to live
        await this.switchProvider(name, 'live');
      } else if (integrationStatus.status === 'mock' && current.type === 'live') {
        // Fall back to mock
        await this.switchProvider(name, 'mock');
      }
    }
  }
  
  /**
   * Switch provider for an integration
   */
  async switchProvider(name, targetType) {
    const config = this.providers.get(name);
    if (!config) return false;
    
    const current = this.activeProviders.get(name);
    
    logger.info(`🔄 Switching ${name} from ${current?.type || 'none'} to ${targetType}`);
    
    try {
      let newProvider;
      
      if (targetType === 'live') {
        newProvider = await config.live();
      } else {
        newProvider = await config.mock();
      }
      
      if (!newProvider) {
        throw new Error(`Failed to create ${targetType} provider for ${name}`);
      }
      
      // Create wrapper
      const wrapper = config.wrapper(newProvider, targetType);
      
      // Store switch history
      this.switchHistory.push({
        integration: name,
        from: current?.type || 'none',
        to: targetType,
        timestamp: Date.now(),
        success: true
      });
      
      // Update active provider
      this.activeProviders.set(name, {
        type: targetType,
        provider: newProvider,
        wrapper
      });
      
      logger.info(`🏁 Successfully switched ${name} to ${targetType}`);
      return true;
      
    } catch (error) {
      logger.error(`🔴 Failed to switch ${name} to ${targetType}: ${error.message}`);
      
      this.switchHistory.push({
        integration: name,
        from: current?.type || 'none',
        to: targetType,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Create Notion wrapper
   */
  createNotionWrapper(provider, type) {
    return {
      type,
      provider,
      
      // Wrapped methods with automatic fallback
      databases: {
        create: this.wrapMethod(provider.databases.create, 'notion', 'databases.create'),
        retrieve: this.wrapMethod(provider.databases.retrieve, 'notion', 'databases.retrieve'),
        update: this.wrapMethod(provider.databases.update, 'notion', 'databases.update'),
        query: this.wrapMethod(provider.databases.query, 'notion', 'databases.query')
      },
      
      pages: {
        create: this.wrapMethod(provider.pages.create, 'notion', 'pages.create'),
        retrieve: this.wrapMethod(provider.pages.retrieve, 'notion', 'pages.retrieve'),
        update: this.wrapMethod(provider.pages.update, 'notion', 'pages.update')
      },
      
      blocks: {
        children: {
          append: this.wrapMethod(provider.blocks.children.append, 'notion', 'blocks.children.append'),
          list: this.wrapMethod(provider.blocks.children.list, 'notion', 'blocks.children.list')
        },
        retrieve: this.wrapMethod(provider.blocks.retrieve, 'notion', 'blocks.retrieve'),
        update: this.wrapMethod(provider.blocks.update, 'notion', 'blocks.update'),
        delete: this.wrapMethod(provider.blocks.delete, 'notion', 'blocks.delete')
      },
      
      // Add mock indicator if in mock mode
      isMock: () => type === 'mock',
      
      // Get provider type
      getType: () => type
    };
  }
  
  /**
   * Create OpenAI wrapper
   */
  createOpenAIWrapper(provider, type) {
    return {
      type,
      provider,
      
      chat: {
        completions: {
          create: this.wrapMethod(
            provider.chat?.completions?.create || provider.createCompletion,
            'openai',
            'chat.completions.create'
          )
        }
      },
      
      embeddings: {
        create: this.wrapMethod(
          provider.embeddings?.create || provider.createEmbedding,
          'openai',
          'embeddings.create'
        )
      },
      
      isMock: () => type === 'mock',
      getType: () => type
    };
  }
  
  /**
   * Create Anthropic wrapper
   */
  createAnthropicWrapper(provider, type) {
    return {
      type,
      provider,
      
      messages: {
        create: this.wrapMethod(
          provider.messages?.create || provider.createMessage,
          'anthropic',
          'messages.create'
        )
      },
      
      isMock: () => type === 'mock',
      getType: () => type
    };
  }
  
  /**
   * Create GitHub wrapper
   */
  createGitHubWrapper(provider, type) {
    return {
      type,
      provider,
      
      repos: {
        get: this.wrapMethod(provider.repos?.get, 'github', 'repos.get'),
        listCommits: this.wrapMethod(provider.repos?.listCommits, 'github', 'repos.listCommits'),
        createOrUpdateFileContents: this.wrapMethod(
          provider.repos?.createOrUpdateFileContents,
          'github',
          'repos.createOrUpdateFileContents'
        )
      },
      
      pulls: {
        create: this.wrapMethod(provider.pulls?.create, 'github', 'pulls.create'),
        list: this.wrapMethod(provider.pulls?.list, 'github', 'pulls.list'),
        get: this.wrapMethod(provider.pulls?.get, 'github', 'pulls.get')
      },
      
      issues: {
        create: this.wrapMethod(provider.issues?.create, 'github', 'issues.create'),
        list: this.wrapMethod(provider.issues?.list, 'github', 'issues.list'),
        get: this.wrapMethod(provider.issues?.get, 'github', 'issues.get')
      },
      
      isMock: () => type === 'mock',
      getType: () => type
    };
  }
  
  /**
   * Create MCP wrapper
   */
  createMCPWrapper(provider, type) {
    return {
      type,
      provider,
      
      memory: {
        store: this.wrapMethod(provider.memory?.store, 'mcp', 'memory.store'),
        retrieve: this.wrapMethod(provider.memory?.retrieve, 'mcp', 'memory.retrieve'),
        search: this.wrapMethod(provider.memory?.search, 'mcp', 'memory.search')
      },
      
      tools: {
        list: this.wrapMethod(provider.tools?.list, 'mcp', 'tools.list'),
        execute: this.wrapMethod(provider.tools?.execute, 'mcp', 'tools.execute')
      },
      
      isMock: () => type === 'mock',
      getType: () => type
    };
  }
  
  /**
   * Wrap a method with error handling and fallback
   */
  wrapMethod(method, integration, methodName) {
    if (!method) {
      return async (...args) => {
        logger.warn(`🟠️ Method ${methodName} not available for ${integration}`);
        throw new Error(`Method ${methodName} not available`);
      };
    }
    
    return async (...args) => {
      const active = this.activeProviders.get(integration);
      
      try {
        // Try primary provider
        const result = await method.apply(active.provider, args);
        return result;
        
      } catch (error) {
        logger.error(`🔴 Error in ${integration}.${methodName}: ${error.message}`);
        
        // Check if we should try fallback
        if (active.type === 'live') {
          logger.info(`🔄 Attempting fallback to mock for ${integration}`);
          
          // Try to switch to mock
          const switched = await this.switchProvider(integration, 'mock');
          
          if (switched) {
            // Retry with mock provider
            const newActive = this.activeProviders.get(integration);
            const fallbackMethod = this.getMethodFromPath(newActive.provider, methodName);
            
            if (fallbackMethod) {
              return await fallbackMethod.apply(newActive.provider, args);
            }
          }
        }
        
        // Re-throw if no fallback available
        throw error;
      }
    };
  }
  
  /**
   * Get method from path string
   */
  getMethodFromPath(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * Get provider for an integration
   */
  getProvider(name) {
    const active = this.activeProviders.get(name);
    return active ? active.wrapper : null;
  }
  
  /**
   * Get all providers
   */
  getAllProviders() {
    const providers = {};
    
    for (const [name, active] of this.activeProviders) {
      providers[name] = active.wrapper;
    }
    
    return providers;
  }
  
  /**
   * Get provider status
   */
  getStatus() {
    const status = {
      providers: {},
      switches: this.switchHistory.slice(-10), // Last 10 switches
      summary: {
        total: this.providers.size,
        live: 0,
        mock: 0
      }
    };
    
    for (const [name, active] of this.activeProviders) {
      status.providers[name] = {
        type: active.type,
        available: true
      };
      
      if (active.type === 'live') {
        status.summary.live++;
      } else {
        status.summary.mock++;
      }
    }
    
    return status;
  }
  
  /**
   * Force a specific provider type
   */
  async forceProvider(name, type) {
    logger.info(`🔧 Forcing ${name} to use ${type} provider`);
    return await this.switchProvider(name, type);
  }
}

// Export singleton instance
module.exports = new IntegrationAutoSwitcher();