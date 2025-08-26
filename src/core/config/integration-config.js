/**
 * BUMBA Integration Configuration System
 * Centralized configuration management for all integrations
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class IntegrationConfig {
  constructor() {
    this.config = {
      // MCP Server Integrations
      mcp: {
        context: {
          enabled: process.env.CONTEXT_MCP_ENABLED === 'true',
          maxContextSize: parseInt(process.env.CONTEXT_MAX_SIZE || '200000'),
          storagePath: process.env.CONTEXT_STORAGE_PATH || '~/.bumba/context',
          preservationStrategy: process.env.CONTEXT_STRATEGY || 'intelligent',
          autoSave: process.env.CONTEXT_AUTO_SAVE !== 'false',
          crossSession: process.env.CONTEXT_CROSS_SESSION !== 'false'
        },
        notion: {
          enabled: process.env.NOTION_ENABLED === 'true',
          apiKey: process.env.NOTION_API_KEY,
          databaseId: process.env.NOTION_DATABASE_ID,
          modules: this.parseJsonEnv('NOTION_MODULES', [])
        },
        figma: {
          enabled: process.env.FIGMA_ENABLED === 'true',
          accessToken: process.env.FIGMA_ACCESS_TOKEN,
          devMode: process.env.FIGMA_DEV_MODE !== 'false'
        },
        github: {
          enabled: process.env.GITHUB_ENABLED === 'true',
          token: process.env.GITHUB_TOKEN,
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO
        }
      },
      
      // Database Integrations
      databases: {
        postgres: {
          enabled: process.env.POSTGRES_ENABLED === 'true',
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          database: process.env.POSTGRES_DB,
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          ssl: process.env.POSTGRES_SSL === 'true'
        },
        mongodb: {
          enabled: process.env.MONGODB_ENABLED === 'true',
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
          database: process.env.MONGODB_DATABASE,
          options: this.parseJsonEnv('MONGODB_OPTIONS', {})
        },
        redis: {
          enabled: process.env.REDIS_ENABLED === 'true',
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          database: parseInt(process.env.REDIS_DB || '0')
        }
      },
      
      // DevOps Integrations
      devops: {
        docker: {
          enabled: process.env.DOCKER_ENABLED === 'true',
          socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
          registry: process.env.DOCKER_REGISTRY,
          username: process.env.DOCKER_USERNAME,
          password: process.env.DOCKER_PASSWORD
        },
        kubernetes: {
          enabled: process.env.K8S_ENABLED === 'true',
          kubeconfig: process.env.KUBECONFIG,
          context: process.env.K8S_CONTEXT,
          namespace: process.env.K8S_NAMESPACE || 'default'
        }
      },
      
      // External Services
      services: {
        openrouter: {
          enabled: process.env.OPENROUTER_ENABLED === 'true',
          apiKey: process.env.OPENROUTER_API_KEY,
          defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'auto',
          maxCost: parseFloat(process.env.OPENROUTER_MAX_COST || '0.01')
        },
        pinecone: {
          enabled: process.env.PINECONE_ENABLED === 'true',
          apiKey: process.env.PINECONE_API_KEY,
          environment: process.env.PINECONE_ENVIRONMENT,
          indexName: process.env.PINECONE_INDEX_NAME
        },
        serena: {
          enabled: process.env.SERENA_ENABLED === 'true',
          apiKey: process.env.SERENA_API_KEY,
          apiUrl: process.env.SERENA_API_URL,
          workspace: process.env.SERENA_WORKSPACE || process.cwd()
        },
        kimiK2: {
          enabled: process.env.KIMI_ENABLED === 'true',
          apiKey: process.env.KIMI_API_KEY || process.env.OPENROUTER_API_KEY,
          apiUrl: process.env.KIMI_API_URL || 'https://api.kimi.ai/v1',
          defaultModel: process.env.KIMI_DEFAULT_MODEL || 'kimi-k2-chat'
        },
        discord: {
          enabled: process.env.DISCORD_ENABLED === 'true',
          token: process.env.DISCORD_BOT_TOKEN,
          clientId: process.env.DISCORD_CLIENT_ID,
          guildId: process.env.DISCORD_GUILD_ID
        }
      },
      
      // Global Settings
      global: {
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
        enableMetrics: process.env.ENABLE_METRICS !== 'false',
        enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
        cacheTTL: parseInt(process.env.CACHE_TTL || '3600'),
        maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
        timeout: parseInt(process.env.TIMEOUT || '30000')
      }
    };
    
    // Load custom config file if exists
    this.loadCustomConfig();
    
    // Validate configuration
    this.validateConfig();
  }
  
  /**
   * Parse JSON environment variable
   */
  parseJsonEnv(key, defaultValue = null) {
    const value = process.env[key];
    if (!value) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch {
      logger.warn(`Failed to parse JSON env var ${key}, using default`);
      return defaultValue;
    }
  }
  
  /**
   * Load custom configuration file
   */
  loadCustomConfig() {
    const configPaths = [
      path.join(process.cwd(), 'bumba.config.json'),
      path.join(process.cwd(), '.bumba', 'config.json'),
      path.join(process.env.HOME || '', '.bumba', 'config.json')
    ];
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          this.mergeConfig(customConfig);
          logger.info(`📋 Loaded custom config from ${configPath}`);
          break;
        } catch (error) {
          logger.error(`Failed to load config from ${configPath}:`, error);
        }
      }
    }
  }
  
  /**
   * Merge custom configuration
   */
  mergeConfig(customConfig) {
    const merge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };
    
    merge(this.config, customConfig);
  }
  
  /**
   * Validate configuration
   */
  validateConfig() {
    const warnings = [];
    const errors = [];
    
    // Check for missing required configs
    if (!this.config.global.environment) {
      errors.push('NODE_ENV not set');
    }
    
    // Check for production without credentials
    if (this.config.global.environment === 'production') {
      if (this.config.databases.postgres.enabled && !this.config.databases.postgres.password) {
        warnings.push('PostgreSQL enabled in production without password');
      }
      
      if (this.config.databases.mongodb.enabled && !this.config.databases.mongodb.uri.includes('@')) {
        warnings.push('MongoDB enabled in production without authentication');
      }
    }
    
    // Check for conflicting configurations
    if (this.config.services.kimiK2.enabled && !this.config.services.kimiK2.apiKey) {
      warnings.push('Kimi K2 enabled but no API key configured');
    }
    
    // Log warnings and errors
    warnings.forEach(w => logger.warn(`🟠️ Config warning: ${w}`));
    errors.forEach(e => logger.error(`🔴 Config error: ${e}`));
    
    if (errors.length > 0) {
      throw new Error('Configuration validation failed');
    }
  }
  
  /**
   * Get integration configuration
   */
  getIntegrationConfig(category, name) {
    if (category === 'mcp') {
      return this.config.mcp[name];
    } else if (category === 'database') {
      return this.config.databases[name];
    } else if (category === 'devops') {
      return this.config.devops[name];
    } else if (category === 'service') {
      return this.config.services[name];
    }
    
    return null;
  }
  
  /**
   * Check if integration is enabled
   */
  isEnabled(category, name) {
    const config = this.getIntegrationConfig(category, name);
    return config?.enabled || false;
  }
  
  /**
   * Get all enabled integrations
   */
  getEnabledIntegrations() {
    const enabled = {
      mcp: [],
      databases: [],
      devops: [],
      services: []
    };
    
    Object.keys(this.config.mcp).forEach(name => {
      if (this.config.mcp[name].enabled) enabled.mcp.push(name);
    });
    
    Object.keys(this.config.databases).forEach(name => {
      if (this.config.databases[name].enabled) enabled.databases.push(name);
    });
    
    Object.keys(this.config.devops).forEach(name => {
      if (this.config.devops[name].enabled) enabled.devops.push(name);
    });
    
    Object.keys(this.config.services).forEach(name => {
      if (this.config.services[name].enabled) enabled.services.push(name);
    });
    
    return enabled;
  }
  
  /**
   * Generate .env.example file
   */
  generateEnvExample() {
    const envExample = `# BUMBA Integration Configuration
# Generated on ${new Date().toISOString()}

# Global Settings
NODE_ENV=development
LOG_LEVEL=info
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
CACHE_TTL=3600
MAX_RETRIES=3
TIMEOUT=30000

# MCP Server Integrations
CONTEXT_MCP_ENABLED=false
CONTEXT_MAX_SIZE=200000
CONTEXT_STORAGE_PATH=~/.bumba/context
CONTEXT_STRATEGY=intelligent
CONTEXT_AUTO_SAVE=true
CONTEXT_CROSS_SESSION=true

NOTION_ENABLED=false
NOTION_API_KEY=
NOTION_DATABASE_ID=
NOTION_MODULES=[]

FIGMA_ENABLED=false
FIGMA_ACCESS_TOKEN=
FIGMA_DEV_MODE=true

GITHUB_ENABLED=false
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=

# Database Integrations
POSTGRES_ENABLED=false
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_SSL=false

MONGODB_ENABLED=false
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=
MONGODB_OPTIONS={}

REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# DevOps Integrations
DOCKER_ENABLED=false
DOCKER_SOCKET=/var/run/docker.sock
DOCKER_REGISTRY=
DOCKER_USERNAME=
DOCKER_PASSWORD=

K8S_ENABLED=false
KUBECONFIG=
K8S_CONTEXT=
K8S_NAMESPACE=default

# External Services
OPENROUTER_ENABLED=false
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=auto
OPENROUTER_MAX_COST=0.01

PINECONE_ENABLED=false
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=

SERENA_ENABLED=false
SERENA_API_KEY=
SERENA_API_URL=
SERENA_WORKSPACE=

KIMI_ENABLED=false
KIMI_API_KEY=
KIMI_API_URL=https://api.kimi.ai/v1
KIMI_DEFAULT_MODEL=kimi-k2-chat


DISCORD_ENABLED=false
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
`;
    
    return envExample;
  }
  
  /**
   * Save configuration
   */
  saveConfig(filePath = null) {
    const configPath = filePath || path.join(process.cwd(), 'bumba.config.json');
    
    try {
      fs.writeFileSync(
        configPath,
        JSON.stringify(this.config, null, 2)
      );
      logger.info(`💾 Configuration saved to ${configPath}`);
      return true;
    } catch (error) {
      logger.error('Failed to save configuration:', error);
      return false;
    }
  }
  
  /**
   * Get configuration summary
   */
  getSummary() {
    const enabled = this.getEnabledIntegrations();
    const totalEnabled = 
      enabled.mcp.length + 
      enabled.databases.length + 
      enabled.devops.length + 
      enabled.services.length;
    
    return {
      environment: this.config.global.environment,
      totalIntegrations: totalEnabled,
      enabled,
      hasCredentials: {
        notion: !!this.config.mcp.notion.apiKey,
        figma: !!this.config.mcp.figma.accessToken,
        openrouter: !!this.config.services.openrouter.apiKey
      }
    };
  }
}

// Singleton instance
let integrationConfig = null;

module.exports = {
  IntegrationConfig,
  
  // Get singleton instance
  getInstance() {
    if (!integrationConfig) {
      integrationConfig = new IntegrationConfig();
    }
    return integrationConfig;
  }
};