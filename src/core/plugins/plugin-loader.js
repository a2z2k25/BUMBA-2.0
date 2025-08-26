/**
 * BUMBA Plugin Loader
 * Handles secure plugin loading and initialization
 */

const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../logging/bumba-logger');

class PluginLoader {
  constructor(architecture) {
    this.architecture = architecture;
    this.loadedModules = new Map();
    this.configCache = new Map();
  }

  /**
   * Load plugin configuration
   */
  async loadPluginConfig(pluginPath) {
    // Check cache first
    if (this.configCache.has(pluginPath)) {
      return this.configCache.get(pluginPath);
    }

    try {
      // Look for package.json first
      const packageJsonPath = path.join(pluginPath, 'package.json');
      const packageJson = await this.loadJsonFile(packageJsonPath);
      
      // Look for bumba.json or plugin.json
      const bumbaConfigPath = path.join(pluginPath, 'bumba.json');
      const pluginConfigPath = path.join(pluginPath, 'plugin.json');
      
      let bumbaConfig = {};
      try {
        bumbaConfig = await this.loadJsonFile(bumbaConfigPath);
      } catch (error) {
        try {
          bumbaConfig = await this.loadJsonFile(pluginConfigPath);
        } catch (error) {
          // No specific plugin config found
        }
      }

      // Merge configurations
      const config = {
        name: bumbaConfig.name || packageJson.name,
        version: bumbaConfig.version || packageJson.version,
        author: bumbaConfig.author || packageJson.author,
        description: bumbaConfig.description || packageJson.description,
        main: bumbaConfig.main || packageJson.main || 'index.js',
        ...bumbaConfig,
        dependencies: bumbaConfig.dependencies || [],
        path: pluginPath
      };

      // Validate required fields
      if (!config.name || !config.version) {
        throw new Error('Plugin must have name and version');
      }

      // Cache the config
      this.configCache.set(pluginPath, config);
      
      return config;
      
    } catch (error) {
      logger.error(`Failed to load plugin config from ${pluginPath}:`, error);
      throw error;
    }
  }

  /**
   * Load JSON file safely
   */
  async loadJsonFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Validate plugin structure
   */
  async validatePluginStructure(pluginPath) {
    const required = ['package.json'];
    const errors = [];

    for (const file of required) {
      try {
        await fs.access(path.join(pluginPath, file));
      } catch (error) {
        errors.push(`Missing required file: ${file}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Invalid plugin structure: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.configCache.clear();
    this.loadedModules.clear();
  }
}

/**
 * Plugin Registry
 * Manages plugin metadata and persistence
 */
class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.dbPath = './data/plugin-registry.json';
    this.isDirty = false;
  }

  async initialize() {
    await this.loadRegistry();
    
    // Auto-save periodically
    setInterval(() => {
      if (this.isDirty) {
        this.saveRegistry().catch(err => 
          logger.error('Failed to save plugin registry:', err)
        );
      }
    }, 30000); // Every 30 seconds
  }

  async addPlugin(pluginInfo) {
    this.plugins.set(pluginInfo.id, {
      ...pluginInfo,
      addedAt: Date.now()
    });
    
    this.isDirty = true;
    await this.saveRegistry();
  }

  async updatePlugin(pluginId, updates) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    this.plugins.set(pluginId, {
      ...plugin,
      ...updates,
      updatedAt: Date.now()
    });
    
    this.isDirty = true;
  }

  async removePlugin(pluginId) {
    const result = this.plugins.delete(pluginId);
    if (result) {
      this.isDirty = true;
      await this.saveRegistry();
    }
    return result;
  }

  async getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  async getPluginByPath(pluginPath) {
    for (const [id, plugin] of this.plugins) {
      if (plugin.path === pluginPath) {
        return plugin;
      }
    }
    return null;
  }

  async listPlugins(filter = {}) {
    let plugins = Array.from(this.plugins.values());
    
    // Apply filters
    if (filter.state) {
      plugins = plugins.filter(p => p.state === filter.state);
    }
    
    if (filter.autoLoad !== undefined) {
      plugins = plugins.filter(p => p.autoLoad === filter.autoLoad);
    }
    
    if (filter.author) {
      plugins = plugins.filter(p => p.author === filter.author);
    }
    
    if (filter.capability) {
      plugins = plugins.filter(p => 
        p.capabilities && p.capabilities.includes(filter.capability)
      );
    }
    
    return plugins;
  }

  async loadRegistry() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      const registry = JSON.parse(data);
      
      // Convert to Map
      this.plugins.clear();
      for (const [id, plugin] of Object.entries(registry.plugins || {})) {
        this.plugins.set(id, plugin);
      }
      
      logger.info(`Loaded ${this.plugins.size} plugins from registry`);
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Registry doesn't exist yet
        logger.info('Creating new plugin registry');
        await this.saveRegistry();
      } else {
        logger.error('Failed to load plugin registry:', error);
        throw error;
      }
    }
  }

  async saveRegistry() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Convert Map to object for JSON
      const registry = {
        version: '1.0',
        updatedAt: Date.now(),
        plugins: Object.fromEntries(this.plugins)
      };
      
      // Write atomically
      const tempPath = `${this.dbPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(registry, null, 2));
      await fs.rename(tempPath, this.dbPath);
      
      this.isDirty = false;
      
    } catch (error) {
      logger.error('Failed to save plugin registry:', error);
      throw error;
    }
  }
}

/**
 * Plugin Marketplace
 * Interface to BUMBA plugin marketplace
 */
class PluginMarketplace {
  constructor() {
    this.baseUrl = process.env.BUMBA_MARKETPLACE_URL || 'https://plugins.bumba.ai';
    this.cache = new Map();
    this.isEnabled = false;
  }

  async initialize(enabled = true) {
    this.isEnabled = enabled;
    
    if (this.isEnabled) {
      logger.info('🟢 Plugin marketplace enabled');
      // Could perform marketplace health check here
    }
  }

  async search(query, options = {}) {
    if (!this.isEnabled) {
      throw new Error('Marketplace is disabled');
    }

    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 min cache
        return cached.results;
      }
    }

    try {
      // In production, this would make an API call
      // For now, return mock data
      const results = this.getMockSearchResults(query, options);
      
      // Cache results
      this.cache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      
      return results;
      
    } catch (error) {
      logger.error('Marketplace search failed:', error);
      throw error;
    }
  }

  async getPluginDetails(pluginName) {
    if (!this.isEnabled) {
      throw new Error('Marketplace is disabled');
    }

    // In production, this would fetch from API
    return {
      name: pluginName,
      version: '1.0.0',
      author: 'BUMBA Community',
      description: 'A sample plugin',
      downloads: 1000,
      rating: 4.5,
      verified: true
    };
  }

  async downloadPlugin(pluginName) {
    if (!this.isEnabled) {
      throw new Error('Marketplace is disabled');
    }

    logger.info(`Downloading plugin ${pluginName} from marketplace...`);
    
    // In production, this would download the plugin
    // For now, throw not implemented
    throw new Error('Marketplace download not implemented');
  }

  async checkUpdate(pluginName, currentVersion) {
    if (!this.isEnabled) {
      return null;
    }

    // In production, check for updates via API
    // Mock implementation
    return {
      hasUpdate: false,
      version: currentVersion,
      changelog: ''
    };
  }

  getMockSearchResults(query, options) {
    // Mock search results for development
    return [
      {
        name: 'bumba-git-integration',
        version: '1.2.0',
        author: 'BUMBA Team',
        description: 'Git integration for BUMBA agents',
        downloads: 5000,
        rating: 4.8,
        verified: true,
        capabilities: ['file_system', 'agent_management']
      },
      {
        name: 'bumba-slack-connector',
        version: '2.0.1',
        author: 'Community',
        description: 'Connect BUMBA to Slack workspaces',
        downloads: 3000,
        rating: 4.5,
        verified: false,
        capabilities: ['network', 'agent_communicate']
      }
    ].filter(p => 
      p.name.includes(query.toLowerCase()) || 
      p.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = { PluginLoader, PluginRegistry, PluginMarketplace };