/**
 * BUMBA Unified Integration Manager
 * Consolidates 40+ integration files into a single, manageable system
 * API-agnostic design with plug-and-play capability for future adopters
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedErrorManager } = require('../error-handling/unified-error-manager');
const path = require('path');
const fs = require('fs').promises;

/**
 * Integration categories and their configurations
 */
const INTEGRATION_REGISTRY = {
  // Productivity & Collaboration
  notion: {
    category: 'productivity',
    priority: 1,
    files: [
      'notion-master-integration',
      'notion-workflow-integration',
      'notion-dashboard-builder-intelligence',
      'notion-dry-run-system',
      'notion-best-practices',
      'notion-content-generator',
      'notion-timeline-department-structure',
      'notion-workstream-templates',
      'notion-department-visibility-widgets',
      'notion-manager-certification-workflows',
      'notion-subpage-repository-structure',
      'notion-cross-reference-intelligence',
      'notion-realtime-progress-indicators',
      'notion-capabilities-awareness',
      'notion-project-dashboard'
    ],
    config: {
      apiKey: process.env.NOTION_API_KEY,
      baseUrl: 'https://api.notion.com/v1',
      version: '2022-06-28'
    }
  },
  
  // Communication
  discord: {
    category: 'communication',
    priority: 2,
    files: [
      'discord-integration',
      'discord-scheduler',
      'discord-orchestrator',
      'discord-optimizer',
      'discord-analytics'
    ],
    config: {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      guildId: process.env.DISCORD_GUILD_ID
    }
  },
  
  // Databases
  databases: {
    category: 'storage',
    priority: 1,
    files: [
      'database-integration',
      'postgres-integration',
      'mongodb-integration',
      'redis-integration'
    ],
    config: {
      postgres: {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        database: process.env.PG_DATABASE,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD
      },
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database: process.env.MONGODB_DATABASE
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    }
  },
  
  // DevOps & Infrastructure
  devops: {
    category: 'infrastructure',
    priority: 2,
    files: [
      'docker-integration',
      'kubernetes-integration',
      'kubernetes-scheduler',
      'kubernetes-orchestrator',
      'kubernetes-optimizer',
      'kubernetes-analytics',
      'devops-mcp-integration'
    ],
    config: {
      docker: {
        socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
      },
      kubernetes: {
        configPath: process.env.KUBECONFIG || '~/.kube/config',
        namespace: process.env.K8S_NAMESPACE || 'default'
      }
    }
  },
  
  // AI & ML
  ai: {
    category: 'artificial-intelligence',
    priority: 1,
    files: [
      'openrouter-integration',
      'openrouter-mcp-integration',
      'serena-integration',
      'kimi-k2-integration',
      'pinecone-integration'
    ],
    config: {
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1'
      },
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENV
      },
      serena: {
        apiKey: process.env.SERENA_API_KEY
      },
      kimi: {
        apiKey: process.env.KIMI_API_KEY
      }
    }
  },
  
  // Development Tools
  development: {
    category: 'development',
    priority: 2,
    files: [
      'github-mcp-integration',
      'context-mcp-integration',
      'shadcn-mcp-integration',
      'figma-integration'
    ],
    config: {
      github: {
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO
      },
      figma: {
        token: process.env.FIGMA_TOKEN
      }
    }
  }
};

/**
 * Unified Integration Manager Class
 */
class UnifiedIntegrationManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      autoLoad: config.autoLoad !== false,
      lazyLoad: config.lazyLoad !== false,
      validateOnLoad: config.validateOnLoad !== false,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    // Integration state
    this.integrations = new Map();
    this.loadedIntegrations = new Map();
    this.failedIntegrations = new Set();
    this.pendingIntegrations = new Set();
    
    // Metrics
    this.metrics = {
      totalIntegrations: 0,
      loadedIntegrations: 0,
      failedIntegrations: 0,
      apiCalls: 0,
      errors: 0,
      lastError: null
    };
    
    // Error management
    this.errorManager = new UnifiedErrorManager();
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the integration manager
   */
  async initialize() {
    logger.info('🟢 Initializing Unified Integration Manager');
    
    // Register all integrations
    this.registerIntegrations();
    
    // Auto-load if configured
    if (this.config.autoLoad) {
      await this.loadAllIntegrations();
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    this.emit('initialized', {
      totalIntegrations: this.integrations.size,
      categories: Object.keys(INTEGRATION_REGISTRY)
    });
  }
  
  /**
   * Register all integrations from registry
   */
  registerIntegrations() {
    for (const [key, config] of Object.entries(INTEGRATION_REGISTRY)) {
      this.registerCategory(key, config);
    }
    
    this.metrics.totalIntegrations = this.integrations.size;
    logger.info(`📦 Registered ${this.integrations.size} integrations across ${Object.keys(INTEGRATION_REGISTRY).length} categories`);
  }
  
  /**
   * Register a category of integrations
   */
  registerCategory(categoryName, categoryConfig) {
    const { files, config, category, priority } = categoryConfig;
    
    for (const fileName of files) {
      const integrationKey = fileName.replace('-integration', '').replace(/-/g, '_');
      
      this.integrations.set(integrationKey, {
        key: integrationKey,
        fileName,
        filePath: path.join(__dirname, `${fileName}.js`),
        category,
        categoryName,
        priority,
        config: config[integrationKey] || config,
        status: 'registered',
        instance: null,
        lastAttempt: null,
        attempts: 0
      });
    }
  }
  
  /**
   * Load all integrations
   */
  async loadAllIntegrations() {
    logger.info('📦 Loading all integrations...');
    
    const priorityGroups = this.groupByPriority();
    
    // Load by priority
    for (const [priority, integrations] of priorityGroups) {
      await this.loadIntegrationGroup(integrations);
    }
    
    logger.info(`🏁 Loaded ${this.loadedIntegrations.size}/${this.integrations.size} integrations`);
    
    if (this.failedIntegrations.size > 0) {
      logger.warn(`🟠️ Failed to load ${this.failedIntegrations.size} integrations: ${Array.from(this.failedIntegrations).join(', ')}`);
    }
  }
  
  /**
   * Group integrations by priority
   */
  groupByPriority() {
    const groups = new Map();
    
    for (const [key, integration] of this.integrations) {
      const priority = integration.priority || 99;
      
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      
      groups.get(priority).push(key);
    }
    
    // Sort by priority (lower number = higher priority)
    return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
  }
  
  /**
   * Load a group of integrations
   */
  async loadIntegrationGroup(integrationKeys) {
    const promises = integrationKeys.map(key => this.loadIntegration(key));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Failed to load ${integrationKeys[index]}: ${result.reason}`);
      }
    });
  }
  
  /**
   * Load a specific integration
   */
  async loadIntegration(key) {
    const integration = this.integrations.get(key);
    
    if (!integration) {
      throw new Error(`Integration '${key}' not found`);
    }
    
    // Check if already loaded
    if (this.loadedIntegrations.has(key)) {
      return this.loadedIntegrations.get(key);
    }
    
    // Check if loading in progress
    if (this.pendingIntegrations.has(key)) {
      return this.waitForIntegration(key);
    }
    
    this.pendingIntegrations.add(key);
    
    try {
      // Check if file exists
      const fileExists = await this.checkFileExists(integration.filePath);
      
      if (!fileExists) {
        // Create placeholder for missing integration
        integration.instance = this.createPlaceholder(integration);
        integration.status = 'placeholder';
      } else {
        // Lazy load the integration
        if (this.config.lazyLoad) {
          integration.loader = () => require(integration.filePath);
          integration.status = 'lazy';
        } else {
          // Load immediately
          const IntegrationClass = require(integration.filePath);
          integration.instance = await this.instantiateIntegration(IntegrationClass, integration);
          integration.status = 'loaded';
        }
      }
      
      this.loadedIntegrations.set(key, integration);
      this.metrics.loadedIntegrations++;
      
      this.emit('integration:loaded', { key, integration });
      
      return integration;
      
    } catch (error) {
      await this.handleLoadError(key, integration, error);
      throw error;
      
    } finally {
      this.pendingIntegrations.delete(key);
    }
  }
  
  /**
   * Check if integration file exists
   */
  async checkFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Create placeholder for missing integration
   */
  createPlaceholder(integration) {
    return {
      name: integration.key,
      category: integration.category,
      status: 'placeholder',
      
      // Placeholder methods
      initialize: async () => {
        logger.info(`📦 ${integration.key} is a placeholder - awaiting implementation`);
        return { status: 'placeholder', ready: false };
      },
      
      execute: async (method, ...args) => {
        return {
          status: 'placeholder',
          message: `${integration.key}.${method} awaiting implementation`,
          wouldExecute: { method, args }
        };
      },
      
      configure: (config) => {
        integration.config = { ...integration.config, ...config };
        logger.info(`📦 ${integration.key} configuration updated (placeholder)`);
      },
      
      isReady: () => false,
      
      getInfo: () => ({
        name: integration.key,
        status: 'placeholder',
        category: integration.category,
        message: 'Integration file not found - using placeholder'
      })
    };
  }
  
  /**
   * Instantiate an integration
   */
  async instantiateIntegration(IntegrationClass, integration) {
    // Handle different export styles
    const Class = IntegrationClass.default || IntegrationClass;
    
    // Check if it's a class or factory function
    if (typeof Class === 'function') {
      // Check if it's a constructor
      if (Class.prototype && Class.prototype.constructor) {
        return new Class(integration.config);
      } else {
        // Factory function
        return await Class(integration.config);
      }
    } else if (typeof Class === 'object') {
      // Already an instance or module
      return Class;
    }
    
    throw new Error(`Invalid integration export for ${integration.key}`);
  }
  
  /**
   * Wait for an integration to finish loading
   */
  async waitForIntegration(key, timeout = 10000) {
    const startTime = Date.now();
    
    while (this.pendingIntegrations.has(key)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for integration '${key}'`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return this.loadedIntegrations.get(key);
  }
  
  /**
   * Handle integration load error
   */
  async handleLoadError(key, integration, error) {
    integration.status = 'failed';
    integration.lastAttempt = Date.now();
    integration.attempts++;
    integration.lastError = error;
    
    this.failedIntegrations.add(key);
    this.metrics.failedIntegrations++;
    this.metrics.errors++;
    this.metrics.lastError = error;
    
    // Try to recover
    const recovered = await this.errorManager.handleError(error, {
      component: `integration:${key}`,
      integration
    });
    
    if (recovered.recovered) {
      this.failedIntegrations.delete(key);
      integration.status = 'recovered';
    }
    
    this.emit('integration:failed', { key, error, recovered });
  }
  
  /**
   * Get an integration instance
   */
  async get(key) {
    // Normalize key
    const normalizedKey = key.replace(/-/g, '_').replace('_integration', '');
    
    // Check if loaded
    if (this.loadedIntegrations.has(normalizedKey)) {
      const integration = this.loadedIntegrations.get(normalizedKey);
      
      // Handle lazy loading
      if (integration.status === 'lazy' && integration.loader) {
        const IntegrationClass = integration.loader();
        integration.instance = await this.instantiateIntegration(IntegrationClass, integration);
        integration.status = 'loaded';
        delete integration.loader;
      }
      
      return integration.instance;
    }
    
    // Try to load
    const integration = await this.loadIntegration(normalizedKey);
    return integration.instance;
  }
  
  /**
   * Execute a method on an integration
   */
  async execute(key, method, ...args) {
    try {
      const instance = await this.get(key);
      
      if (!instance) {
        throw new Error(`Integration '${key}' not available`);
      }
      
      // Check if method exists
      if (typeof instance[method] !== 'function') {
        // Try execute method for placeholder
        if (typeof instance.execute === 'function') {
          return await instance.execute(method, ...args);
        }
        
        throw new Error(`Method '${method}' not found on integration '${key}'`);
      }
      
      // Execute method
      const result = await instance[method](...args);
      
      this.metrics.apiCalls++;
      
      return result;
      
    } catch (error) {
      this.metrics.errors++;
      
      const handled = await this.errorManager.handleError(error, {
        component: `integration:${key}`,
        method,
        args
      });
      
      if (handled.recovered) {
        return handled.recovery.result;
      }
      
      throw handled.error;
    }
  }
  
  /**
   * Configure an integration
   */
  async configure(key, config) {
    const integration = this.integrations.get(key);
    
    if (!integration) {
      throw new Error(`Integration '${key}' not found`);
    }
    
    // Update config
    integration.config = { ...integration.config, ...config };
    
    // If instance exists, reconfigure it
    if (integration.instance && typeof integration.instance.configure === 'function') {
      await integration.instance.configure(config);
    }
    
    this.emit('integration:configured', { key, config });
    
    return integration;
  }
  
  /**
   * Reload an integration
   */
  async reload(key) {
    // Remove from loaded
    this.loadedIntegrations.delete(key);
    this.failedIntegrations.delete(key);
    
    // Reset integration state
    const integration = this.integrations.get(key);
    if (integration) {
      integration.status = 'registered';
      integration.instance = null;
      integration.attempts = 0;
    }
    
    // Reload
    return await this.loadIntegration(key);
  }
  
  /**
   * Get integration status
   */
  getStatus(key) {
    const integration = this.integrations.get(key);
    
    if (!integration) {
      return { status: 'not_found' };
    }
    
    return {
      key: integration.key,
      status: integration.status,
      category: integration.category,
      attempts: integration.attempts,
      lastAttempt: integration.lastAttempt,
      hasConfig: !!integration.config,
      isReady: integration.status === 'loaded' || integration.status === 'lazy'
    };
  }
  
  /**
   * Get all integration statuses
   */
  getAllStatuses() {
    const statuses = {};
    
    for (const [key, integration] of this.integrations) {
      statuses[key] = this.getStatus(key);
    }
    
    return statuses;
  }
  
  /**
   * Get integrations by category
   */
  getByCategory(category) {
    const results = [];
    
    for (const [key, integration] of this.integrations) {
      if (integration.category === category || integration.categoryName === category) {
        results.push({
          key,
          integration,
          instance: this.loadedIntegrations.get(key)?.instance
        });
      }
    }
    
    return results;
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      const unhealthy = [];
      
      for (const [key, integration] of this.loadedIntegrations) {
        if (integration.instance && typeof integration.instance.healthCheck === 'function') {
          try {
            const health = await integration.instance.healthCheck();
            
            if (!health || health.status === 'unhealthy') {
              unhealthy.push({ key, health });
            }
          } catch (error) {
            unhealthy.push({ key, error });
          }
        }
      }
      
      if (unhealthy.length > 0) {
        this.emit('integrations:unhealthy', unhealthy);
        
        // Try to recover
        for (const { key } of unhealthy) {
          logger.warn(`🔧 Attempting to recover unhealthy integration: ${key}`);
          await this.reload(key);
        }
      }
      
    }, 60000); // Check every minute
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      categories: Object.keys(INTEGRATION_REGISTRY).length,
      loadedPercentage: (this.metrics.loadedIntegrations / this.metrics.totalIntegrations * 100).toFixed(2),
      healthyIntegrations: this.metrics.loadedIntegrations - this.metrics.failedIntegrations
    };
  }
  
  /**
   * Shutdown gracefully
   */
  async shutdown() {
    logger.info('🔌 Shutting down integration manager...');
    
    for (const [key, integration] of this.loadedIntegrations) {
      if (integration.instance && typeof integration.instance.shutdown === 'function') {
        try {
          await integration.instance.shutdown();
        } catch (error) {
          logger.error(`Error shutting down ${key}:`, error);
        }
      }
    }
    
    this.emit('shutdown');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create singleton instance
 */
function getInstance(config) {
  if (!instance) {
    instance = new UnifiedIntegrationManager(config);
  }
  return instance;
}

/**
 * Integration helper functions
 */
const IntegrationHelpers = {
  /**
   * Quick access to specific integrations
   */
  notion: async () => getInstance().get('notion_master'),
  discord: async () => getInstance().get('discord'),
  github: async () => getInstance().get('github_mcp'),
  postgres: async () => getInstance().get('postgres'),
  mongodb: async () => getInstance().get('mongodb'),
  redis: async () => getInstance().get('redis'),
  docker: async () => getInstance().get('docker'),
  kubernetes: async () => getInstance().get('kubernetes'),
  figma: async () => getInstance().get('figma'),
  
  /**
   * Execute on specific integration
   */
  execute: async (integration, method, ...args) => {
    return getInstance().execute(integration, method, ...args);
  },
  
  /**
   * Configure specific integration
   */
  configure: async (integration, config) => {
    return getInstance().configure(integration, config);
  }
};

module.exports = {
  UnifiedIntegrationManager,
  getInstance,
  IntegrationHelpers,
  INTEGRATION_REGISTRY
};