/**
 * BUMBA Plugin Manager
 * High-level plugin management and orchestration
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../logging/bumba-logger');
const { BumbaPluginArchitecture } = require('./plugin-architecture');
const { PluginRegistry } = require('./plugin-registry');
const { PluginLoader } = require('./plugin-loader');
const { PluginMarketplace } = require('./plugin-marketplace');

class BumbaPluginManager extends EventEmitter {
  constructor() {
    super();
    this.architecture = new BumbaPluginArchitecture();
    this.registry = new PluginRegistry();
    this.loader = new PluginLoader(this.architecture);
    this.marketplace = new PluginMarketplace();
    this.config = {
      autoLoad: true,
      pluginsDir: './plugins',
      marketplaceEnabled: true,
      updateCheckInterval: 86400000 // 24 hours
    };
    this.isInitialized = false;
  }

  async initialize(config = {}) {
    if (this.isInitialized) {
      return;
    }

    this.config = { ...this.config, ...config };
    
    logger.info('🟢 Initializing BUMBA Plugin Manager...');
    
    // Initialize components
    await this.registry.initialize();
    await this.marketplace.initialize(this.config.marketplaceEnabled);
    
    // Set up event forwarding
    this.setupEventForwarding();
    
    // Auto-load plugins if enabled
    if (this.config.autoLoad) {
      await this.autoLoadPlugins();
    }
    
    // Start update checker
    if (this.config.marketplaceEnabled) {
      this.startUpdateChecker();
    }
    
    this.isInitialized = true;
    
    logger.info('🟢 Plugin Manager initialized');
    
    this.emit('initialized');
  }

  /**
   * Install a plugin from various sources
   */
  async installPlugin(source, options = {}) {
    logger.info(`🟢 Installing plugin from: ${source}`);
    
    let pluginPath;
    let pluginConfig;
    
    try {
      // Determine source type
      if (source.startsWith('http')) {
        // Download from URL
        pluginPath = await this.downloadPlugin(source);
      } else if (source.startsWith('bumba:')) {
        // Install from marketplace
        const pluginName = source.replace('bumba:', '');
        pluginPath = await this.marketplace.downloadPlugin(pluginName);
      } else if (source.startsWith('/') || source.startsWith('./')) {
        // Local path
        pluginPath = path.resolve(source);
      } else {
        // NPM package
        pluginPath = await this.installFromNpm(source);
      }

      // Load plugin configuration
      pluginConfig = await this.loader.loadPluginConfig(pluginPath);
      
      // Validate plugin
      await this.validatePluginSafety(pluginConfig, pluginPath);
      
      // Register plugin
      const pluginId = await this.architecture.registerPlugin(pluginConfig);
      
      // Store in registry
      await this.registry.addPlugin({
        id: pluginId,
        name: pluginConfig.name,
        version: pluginConfig.version,
        path: pluginPath,
        source,
        installedAt: Date.now(),
        autoLoad: options.autoLoad !== false
      });
      
      // Load plugin if requested
      if (options.load !== false) {
        await this.loadPlugin(pluginId);
      }
      
      // Activate plugin if requested
      if (options.activate === true) {
        await this.activatePlugin(pluginId);
      }
      
      logger.info(`🟢 Plugin installed: ${pluginConfig.name} v${pluginConfig.version}`);
      
      this.emit('plugin_installed', {
        pluginId,
        plugin: pluginConfig,
        source
      });
      
      return pluginId;
      
    } catch (error) {
      logger.error('Failed to install plugin:', error);
      
      // Cleanup on failure
      if (pluginPath && options.cleanup !== false) {
        await this.cleanupFailedInstall(pluginPath);
      }
      
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId, options = {}) {
    const pluginInfo = await this.registry.getPlugin(pluginId);
    if (!pluginInfo) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    logger.info(`🟢 Uninstalling plugin: ${pluginInfo.name}`);
    
    try {
      // Deactivate if active
      const plugin = this.architecture.getPlugin(pluginId);
      if (plugin && plugin.state === 'active') {
        await this.deactivatePlugin(pluginId);
      }
      
      // Unload plugin
      if (plugin) {
        await this.architecture.unloadPlugin(pluginId);
      }
      
      // Remove from registry
      await this.registry.removePlugin(pluginId);
      
      // Remove files if requested
      if (options.removeFiles !== false && pluginInfo.path) {
        await this.removePluginFiles(pluginInfo.path);
      }
      
      logger.info(`🟢 Plugin uninstalled: ${pluginInfo.name}`);
      
      this.emit('plugin_uninstalled', {
        pluginId,
        pluginInfo
      });
      
    } catch (error) {
      logger.error('Failed to uninstall plugin:', error);
      throw error;
    }
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginId) {
    const pluginInfo = await this.registry.getPlugin(pluginId);
    if (!pluginInfo) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    await this.architecture.loadPlugin(pluginId, pluginInfo.path);
    
    // Update registry
    await this.registry.updatePlugin(pluginId, {
      loadedAt: Date.now(),
      state: 'loaded'
    });
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId) {
    await this.architecture.activatePlugin(pluginId);
    
    // Update registry
    await this.registry.updatePlugin(pluginId, {
      activatedAt: Date.now(),
      state: 'active'
    });
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId) {
    await this.architecture.deactivatePlugin(pluginId);
    
    // Update registry
    await this.registry.updatePlugin(pluginId, {
      deactivatedAt: Date.now(),
      state: 'loaded'
    });
  }

  /**
   * Update a plugin
   */
  async updatePlugin(pluginId, options = {}) {
    const pluginInfo = await this.registry.getPlugin(pluginId);
    if (!pluginInfo) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    logger.info(`🟢 Updating plugin: ${pluginInfo.name}`);
    
    try {
      // Check for updates
      const updateInfo = await this.checkForUpdate(pluginInfo);
      if (!updateInfo || !updateInfo.hasUpdate) {
        logger.info('Plugin is already up to date');
        return false;
      }

      // Backup current version
      if (options.backup !== false) {
        await this.backupPlugin(pluginInfo);
      }

      // Deactivate current version
      const plugin = this.architecture.getPlugin(pluginId);
      const wasActive = plugin && plugin.state === 'active';
      if (wasActive) {
        await this.deactivatePlugin(pluginId);
      }

      // Unload current version
      if (plugin) {
        await this.architecture.unloadPlugin(pluginId);
      }

      // Install new version
      const newPluginId = await this.installPlugin(updateInfo.source, {
        load: true,
        activate: wasActive
      });

      // Remove old version from registry
      await this.registry.removePlugin(pluginId);

      logger.info(`🟢 Plugin updated: ${pluginInfo.name} v${updateInfo.version}`);
      
      this.emit('plugin_updated', {
        oldPluginId: pluginId,
        newPluginId,
        oldVersion: pluginInfo.version,
        newVersion: updateInfo.version
      });

      return true;

    } catch (error) {
      logger.error('Failed to update plugin:', error);
      
      // Restore from backup if available
      if (options.backup !== false) {
        await this.restorePlugin(pluginInfo);
      }
      
      throw error;
    }
  }

  /**
   * Enable a plugin (load and activate)
   */
  async enablePlugin(pluginId) {
    const plugin = this.architecture.getPlugin(pluginId);
    
    if (!plugin) {
      // Plugin not loaded, load it first
      await this.loadPlugin(pluginId);
    }
    
    if (plugin?.state !== 'active') {
      await this.activatePlugin(pluginId);
    }
    
    // Update autoLoad setting
    await this.registry.updatePlugin(pluginId, {
      autoLoad: true
    });
  }

  /**
   * Disable a plugin (deactivate but keep loaded)
   */
  async disablePlugin(pluginId) {
    const plugin = this.architecture.getPlugin(pluginId);
    
    if (plugin?.state === 'active') {
      await this.deactivatePlugin(pluginId);
    }
    
    // Update autoLoad setting
    await this.registry.updatePlugin(pluginId, {
      autoLoad: false
    });
  }

  /**
   * Get plugin information
   */
  async getPluginInfo(pluginId) {
    const registryInfo = await this.registry.getPlugin(pluginId);
    const plugin = this.architecture.getPlugin(pluginId);
    const metrics = plugin ? this.architecture.getPluginMetrics(pluginId) : null;
    
    return {
      ...registryInfo,
      ...plugin,
      metrics
    };
  }

  /**
   * List all plugins
   */
  async listPlugins(filter = {}) {
    const plugins = await this.registry.listPlugins(filter);
    
    // Enhance with runtime information
    return Promise.all(plugins.map(async p => {
      const plugin = this.architecture.getPlugin(p.id);
      return {
        ...p,
        state: plugin?.state || 'unloaded',
        metrics: plugin ? this.architecture.getPluginMetrics(p.id) : null
      };
    }));
  }

  /**
   * Search marketplace for plugins
   */
  async searchMarketplace(query, options = {}) {
    if (!this.config.marketplaceEnabled) {
      throw new Error('Marketplace is disabled');
    }

    return await this.marketplace.search(query, options);
  }

  /**
   * Execute plugin hook
   */
  async executeHook(hookName, context = {}) {
    return await this.architecture.execute(hookName, context);
  }

  /**
   * Auto-load plugins from directory
   */
  async autoLoadPlugins() {
    logger.info('🟢 Auto-loading plugins...');
    
    try {
      // Get plugins marked for auto-load
      const plugins = await this.registry.listPlugins({ autoLoad: true });
      
      for (const pluginInfo of plugins) {
        try {
          // Load plugin
          if (!this.architecture.getPlugin(pluginInfo.id)) {
            await this.loadPlugin(pluginInfo.id);
          }
          
          // Activate if configured
          if (pluginInfo.autoActivate) {
            await this.activatePlugin(pluginInfo.id);
          }
          
        } catch (error) {
          logger.error(`Failed to auto-load plugin ${pluginInfo.name}:`, error);
        }
      }
      
      // Scan plugins directory for new plugins
      await this.scanPluginsDirectory();
      
    } catch (error) {
      logger.error('Failed to auto-load plugins:', error);
    }
  }

  /**
   * Scan plugins directory for new plugins
   */
  async scanPluginsDirectory() {
    try {
      const files = await fs.readdir(this.config.pluginsDir);
      
      for (const file of files) {
        const pluginPath = path.join(this.config.pluginsDir, file);
        const stat = await fs.stat(pluginPath);
        
        if (stat.isDirectory()) {
          // Check if already registered
          const existing = await this.registry.getPluginByPath(pluginPath);
          if (!existing) {
            try {
              // Try to load plugin config
              const config = await this.loader.loadPluginConfig(pluginPath);
              if (config) {
                logger.info(`Found new plugin: ${config.name}`);
                await this.installPlugin(pluginPath, { load: false });
              }
            } catch (error) {
              logger.debug(`${file} is not a valid plugin directory`);
            }
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Failed to scan plugins directory:', error);
      }
    }
  }

  /**
   * Validate plugin safety
   */
  async validatePluginSafety(pluginConfig, pluginPath) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /require\s*\(\s*['"]\s*child_process/,
      /\.exec\s*\(/,
      /\.spawn\s*\(/
    ];

    const pluginCode = await fs.readFile(
      path.join(pluginPath, pluginConfig.main || 'index.js'), 
      'utf-8'
    );

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(pluginCode)) {
        logger.warn(`Plugin ${pluginConfig.name} contains suspicious code patterns`);
        
        // Could throw error or require explicit approval
        if (this.config.strictSafety) {
          throw new Error('Plugin contains potentially unsafe code');
        }
      }
    }

    // Verify plugin signature if available
    if (pluginConfig.signature) {
      const isValid = await this.verifyPluginSignature(
        pluginConfig, 
        pluginPath
      );
      
      if (!isValid) {
        throw new Error('Plugin signature verification failed');
      }
    }
  }

  /**
   * Check for plugin updates
   */
  async checkForUpdate(pluginInfo) {
    if (pluginInfo.source.startsWith('bumba:')) {
      // Check marketplace for updates
      const pluginName = pluginInfo.source.replace('bumba:', '');
      return await this.marketplace.checkUpdate(pluginName, pluginInfo.version);
    }
    
    // For other sources, implement update checking logic
    return null;
  }

  /**
   * Start automatic update checker
   */
  startUpdateChecker() {
    setInterval(async () => {
      try {
        const plugins = await this.registry.listPlugins();
        
        for (const plugin of plugins) {
          const updateInfo = await this.checkForUpdate(plugin);
          if (updateInfo?.hasUpdate) {
            this.emit('update_available', {
              pluginId: plugin.id,
              pluginName: plugin.name,
              currentVersion: plugin.version,
              newVersion: updateInfo.version
            });
          }
        }
      } catch (error) {
        logger.error('Update check failed:', error);
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * Set up event forwarding from architecture
   */
  setupEventForwarding() {
    const events = [
      'plugin_registered',
      'plugin_loaded', 
      'plugin_activated',
      'plugin_deactivated',
      'plugin_unloaded',
      'plugin_error'
    ];

    events.forEach(event => {
      this.architecture.on(event, (...args) => {
        this.emit(event, ...args);
      });
    });
  }

  // Helper methods
  async downloadPlugin(url) {
    // Implementation for downloading plugin from URL
    throw new Error('URL download not implemented');
  }

  async installFromNpm(packageName) {
    // Implementation for installing from NPM
    throw new Error('NPM installation not implemented');
  }

  async backupPlugin(pluginInfo) {
    // Implementation for backing up plugin
    const backupPath = `${pluginInfo.path}.backup-${Date.now()}`;
    // Copy plugin files to backup location
  }

  async restorePlugin(pluginInfo) {
    // Implementation for restoring plugin from backup
  }

  async removePluginFiles(pluginPath) {
    // Implementation for removing plugin files
    try {
      await fs.rmdir(pluginPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to remove plugin files:', error);
    }
  }

  async cleanupFailedInstall(pluginPath) {
    // Implementation for cleaning up failed installation
    await this.removePluginFiles(pluginPath);
  }

  async verifyPluginSignature(pluginConfig, pluginPath) {
    // Implementation for signature verification
    return true; // Placeholder
  }
}

module.exports = { BumbaPluginManager };