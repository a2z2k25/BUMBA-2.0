/**
 * BUMBA Plugin Architecture
 * Modular extension system for third-party integrations
 */

const EventEmitter = require('events');
const path = require('path');
const { logger } = require('../logging/bumba-logger');
const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
const { secureRequire } = require('../security/secure-executor');

class BumbaPluginArchitecture extends EventEmitter {
  constructor() {
    super();
    this.plugins = new Map();
    this.hooks = new Map();
    this.sandboxes = new Map();
    this.dependencies = new Map();
    this.lifecycles = new Map();
    this.apiVersions = new Map();
    this.consciousnessLayer = new ConsciousnessLayer();
    
    this.initializeHooks();
  }

  initializeHooks() {
    // Core lifecycle hooks
    const coreHooks = [
      'beforeAgentSpawn',
      'afterAgentSpawn',
      'beforeDecision',
      'afterDecision',
      'beforeTaskExecution',
      'afterTaskExecution',
      'onMemoryStore',
      'onMemoryRetrieve',
      'onCollaborationStart',
      'onCollaborationEnd',
      'onError',
      'onMetricsUpdate'
    ];

    coreHooks.forEach(hook => {
      this.hooks.set(hook, new Set());
    });
  }

  /**
   * Register a new plugin
   */
  async registerPlugin(pluginConfig) {
    const pluginId = pluginConfig.id || this.generatePluginId(pluginConfig.name);
    
    // Validate plugin configuration
    await this.validatePlugin(pluginConfig);
    
    // Check consciousness alignment
    await this.consciousnessLayer.validateIntent({
      description: `plugin registration: ${pluginConfig.name}`,
      purpose: pluginConfig.purpose,
      capabilities: pluginConfig.capabilities
    });

    // Create plugin instance
    const plugin = {
      id: pluginId,
      name: pluginConfig.name,
      version: pluginConfig.version,
      author: pluginConfig.author,
      description: pluginConfig.description,
      purpose: pluginConfig.purpose,
      capabilities: pluginConfig.capabilities || [],
      permissions: pluginConfig.permissions || {},
      dependencies: pluginConfig.dependencies || [],
      apiVersion: pluginConfig.apiVersion || '1.0',
      hooks: pluginConfig.hooks || {},
      exports: {},
      state: 'registered',
      sandbox: null,
      metrics: {
        activations: 0,
        errors: 0,
        lastActivated: null,
        totalExecutionTime: 0
      }
    };

    // Validate dependencies
    await this.validateDependencies(plugin);
    
    // Create secure sandbox
    plugin.sandbox = await this.createPluginSandbox(plugin);
    
    // Store plugin
    this.plugins.set(pluginId, plugin);
    this.lifecycles.set(pluginId, new PluginLifecycle(plugin));
    
    logger.info(`🟢 Plugin registered: ${plugin.name} v${plugin.version}`);
    
    this.emit('plugin_registered', { pluginId, plugin });
    
    return pluginId;
  }

  /**
   * Load and activate a plugin
   */
  async loadPlugin(pluginId, pluginPath) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.state !== 'registered') {
      throw new Error(`Plugin ${pluginId} is already loaded`);
    }

    try {
      // Load plugin code in sandbox
      const pluginCode = await this.loadPluginCode(pluginPath);
      
      // Initialize plugin in sandbox
      const pluginExports = await plugin.sandbox.execute(pluginCode, {
        bumbaAPI: this.createPluginAPI(plugin),
        logger: this.createPluginLogger(plugin),
        config: plugin.config || {}
      });

      // Validate exports
      await this.validatePluginExports(pluginExports, plugin);
      
      plugin.exports = pluginExports;
      plugin.state = 'loaded';
      
      // Register plugin hooks
      await this.registerPluginHooks(plugin);
      
      logger.info(`🟢 Plugin loaded: ${plugin.name}`);
      
      this.emit('plugin_loaded', { pluginId, plugin });
      
    } catch (error) {
      plugin.state = 'error';
      plugin.metrics.errors++;
      logger.error(`Failed to load plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Activate a loaded plugin
   */
  async activatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.state !== 'loaded') {
      throw new Error(`Plugin ${pluginId} must be loaded before activation`);
    }

    const lifecycle = this.lifecycles.get(pluginId);
    
    try {
      // Run activation lifecycle
      await lifecycle.activate();
      
      // Call plugin's onActivate if available
      if (plugin.exports.onActivate) {
        await plugin.sandbox.execute(async () => {
          await plugin.exports.onActivate();
        });
      }

      plugin.state = 'active';
      plugin.metrics.activations++;
      plugin.metrics.lastActivated = Date.now();
      
      logger.info(`🟢 Plugin activated: ${plugin.name}`);
      
      this.emit('plugin_activated', { pluginId, plugin });
      
    } catch (error) {
      plugin.state = 'error';
      plugin.metrics.errors++;
      logger.error(`Failed to activate plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate an active plugin
   */
  async deactivatePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.state !== 'active') {
      return;
    }

    const lifecycle = this.lifecycles.get(pluginId);
    
    try {
      // Call plugin's onDeactivate if available
      if (plugin.exports.onDeactivate) {
        await plugin.sandbox.execute(async () => {
          await plugin.exports.onDeactivate();
        });
      }

      // Run deactivation lifecycle
      await lifecycle.deactivate();
      
      // Unregister hooks
      await this.unregisterPluginHooks(plugin);
      
      plugin.state = 'loaded';
      
      logger.info(`🟢 Plugin deactivated: ${plugin.name}`);
      
      this.emit('plugin_deactivated', { pluginId, plugin });
      
    } catch (error) {
      plugin.metrics.errors++;
      logger.error(`Failed to deactivate plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin completely
   */
  async unloadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Deactivate if active
    if (plugin.state === 'active') {
      await this.deactivatePlugin(pluginId);
    }

    try {
      // Cleanup sandbox
      await plugin.sandbox.cleanup();
      
      // Remove from registries
      this.plugins.delete(pluginId);
      this.lifecycles.delete(pluginId);
      this.sandboxes.delete(pluginId);
      
      logger.info(`🟢 Plugin unloaded: ${plugin.name}`);
      
      this.emit('plugin_unloaded', { pluginId, plugin });
      
    } catch (error) {
      logger.error(`Failed to unload plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Execute a hook with all registered plugins
   */
  async executeHook(hookName, context = {}) {
    const hookHandlers = this.hooks.get(hookName);
    if (!hookHandlers || hookHandlers.size === 0) {
      return { results: [], errors: [] };
    }

    const results = [];
    const errors = [];

    // Execute handlers in parallel with timeout
    const promises = Array.from(hookHandlers).map(async ({ pluginId, handler }) => {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || plugin.state !== 'active') {
        return null;
      }

      try {
        const startTime = Date.now();
        
        // Execute in plugin sandbox with timeout
        const result = await Promise.race([
          plugin.sandbox.execute(async () => {
            return await handler(context);
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Hook execution timeout')), 5000)
          )
        ]);

        const executionTime = Date.now() - startTime;
        plugin.metrics.totalExecutionTime += executionTime;

        results.push({
          pluginId,
          pluginName: plugin.name,
          result,
          executionTime
        });

        return result;

      } catch (error) {
        plugin.metrics.errors++;
        errors.push({
          pluginId,
          pluginName: plugin.name,
          error: error.message
        });
        
        logger.error(`Plugin ${plugin.name} hook ${hookName} error:`, error);
        
        // Emit error event
        this.emit('plugin_error', {
          pluginId,
          hookName,
          error
        });

        return null;
      }
    });

    await Promise.allSettled(promises);

    return { results, errors };
  }

  /**
   * Create secure sandbox for plugin execution
   */
  async createPluginSandbox(plugin) {
    const sandbox = new PluginSandbox({
      pluginId: plugin.id,
      permissions: plugin.permissions,
      resourceLimits: {
        memory: plugin.permissions.maxMemory || 50 * 1024 * 1024, // 50MB default
        cpu: plugin.permissions.maxCpu || 0.5, // 50% CPU default
        timeout: plugin.permissions.timeout || 30000 // 30s default
      }
    });

    await sandbox.initialize();
    
    this.sandboxes.set(plugin.id, sandbox);
    
    return sandbox;
  }

  /**
   * Create API interface for plugins
   */
  createPluginAPI(plugin) {
    const api = {
      version: plugin.apiVersion,
      
      // Agent management
      agents: {
        spawn: this.createSandboxedFunction(plugin, 'spawnAgent'),
        list: this.createSandboxedFunction(plugin, 'listAgents'),
        communicate: this.createSandboxedFunction(plugin, 'communicateWithAgent')
      },
      
      // Memory access
      memory: {
        store: this.createSandboxedFunction(plugin, 'storeMemory'),
        retrieve: this.createSandboxedFunction(plugin, 'retrieveMemory'),
        search: this.createSandboxedFunction(plugin, 'searchMemory')
      },
      
      // Collaboration
      collaboration: {
        createSession: this.createSandboxedFunction(plugin, 'createCollaborationSession'),
        joinSession: this.createSandboxedFunction(plugin, 'joinCollaborationSession'),
        sendMessage: this.createSandboxedFunction(plugin, 'sendCollaborationMessage')
      },
      
      // Events
      events: {
        emit: this.createSandboxedFunction(plugin, 'emitEvent'),
        on: this.createSandboxedFunction(plugin, 'addEventListener'),
        off: this.createSandboxedFunction(plugin, 'removeEventListener')
      },
      
      // Utilities
      utils: {
        generateId: () => this.generateId(),
        hash: (data) => this.hashData(data),
        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
      }
    };

    // Add version-specific features
    if (plugin.apiVersion >= '2.0') {
      api.advanced = {
        consciousness: {
          validateIntent: this.createSandboxedFunction(plugin, 'validateIntent'),
          getMetrics: this.createSandboxedFunction(plugin, 'getConsciousnessMetrics')
        }
      };
    }

    return api;
  }

  /**
   * Create sandboxed function with permission checking
   */
  createSandboxedFunction(plugin, functionName) {
    return async (...args) => {
      // Check if plugin has permission
      if (!this.hasPermission(plugin, functionName)) {
        throw new Error(`Plugin ${plugin.name} lacks permission for ${functionName}`);
      }

      // Execute with monitoring
      const startTime = Date.now();
      
      try {
        const result = await this[functionName](plugin, ...args);
        
        // Track metrics
        const executionTime = Date.now() - startTime;
        this.trackAPIUsage(plugin.id, functionName, executionTime);
        
        return result;
        
      } catch (error) {
        plugin.metrics.errors++;
        throw error;
      }
    };
  }

  /**
   * Register plugin hooks
   */
  async registerPluginHooks(plugin) {
    for (const [hookName, handler] of Object.entries(plugin.hooks)) {
      if (!this.hooks.has(hookName)) {
        logger.warn(`Unknown hook ${hookName} for plugin ${plugin.name}`);
        continue;
      }

      this.hooks.get(hookName).add({
        pluginId: plugin.id,
        handler
      });

      logger.debug(`Registered hook ${hookName} for plugin ${plugin.name}`);
    }
  }

  /**
   * Unregister plugin hooks
   */
  async unregisterPluginHooks(plugin) {
    for (const hookName of Object.keys(plugin.hooks)) {
      const hookHandlers = this.hooks.get(hookName);
      if (hookHandlers) {
        // Remove handlers for this plugin
        const toRemove = Array.from(hookHandlers).filter(h => h.pluginId === plugin.id);
        toRemove.forEach(handler => hookHandlers.delete(handler));
      }
    }
  }

  /**
   * Plugin validation
   */
  async validatePlugin(pluginConfig) {
    const required = ['name', 'version', 'author', 'description'];
    
    for (const field of required) {
      if (!pluginConfig[field]) {
        throw new Error(`Plugin missing required field: ${field}`);
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(pluginConfig.version)) {
      throw new Error('Invalid plugin version format. Use semver (e.g., 1.0.0)');
    }

    // Validate capabilities
    if (pluginConfig.capabilities) {
      const validCapabilities = [
        'agent_management',
        'memory_access',
        'collaboration',
        'file_system',
        'network',
        'ui_extension'
      ];
      
      for (const capability of pluginConfig.capabilities) {
        if (!validCapabilities.includes(capability)) {
          throw new Error(`Invalid capability: ${capability}`);
        }
      }
    }

    // Validate permissions
    if (pluginConfig.permissions) {
      await this.validatePermissions(pluginConfig.permissions);
    }
  }

  /**
   * Validate plugin permissions
   */
  async validatePermissions(permissions) {
    const validPermissions = {
      agent_spawn: 'boolean',
      agent_communicate: 'boolean',
      memory_read: 'boolean',
      memory_write: 'boolean',
      file_read: 'boolean',
      file_write: 'boolean',
      network_access: 'boolean',
      maxMemory: 'number',
      maxCpu: 'number',
      timeout: 'number'
    };

    for (const [key, value] of Object.entries(permissions)) {
      if (!(key in validPermissions)) {
        throw new Error(`Invalid permission: ${key}`);
      }
      
      const expectedType = validPermissions[key];
      if (typeof value !== expectedType) {
        throw new Error(`Permission ${key} must be ${expectedType}`);
      }
    }
  }

  /**
   * Validate plugin dependencies
   */
  async validateDependencies(plugin) {
    for (const dep of plugin.dependencies) {
      const [depName, depVersion] = dep.split('@');
      
      // Check if dependency is loaded
      const depPlugin = Array.from(this.plugins.values()).find(p => 
        p.name === depName && this.satisfiesVersion(p.version, depVersion)
      );

      if (!depPlugin) {
        throw new Error(`Missing dependency: ${dep}`);
      }

      // Track dependency
      if (!this.dependencies.has(plugin.id)) {
        this.dependencies.set(plugin.id, new Set());
      }
      this.dependencies.get(plugin.id).add(depPlugin.id);
    }
  }

  /**
   * Load plugin code securely
   */
  async loadPluginCode(pluginPath) {
    // Validate path
    const resolvedPath = path.resolve(pluginPath);
    
    // Security check
    if (!this.isPathAllowed(resolvedPath)) {
      throw new Error('Plugin path not allowed');
    }

    // Load and validate code
    const code = await secureRequire(resolvedPath);
    
    return code;
  }

  /**
   * Validate plugin exports
   */
  async validatePluginExports(exports, plugin) {
    // Check for required exports
    if (typeof exports !== 'object' || exports === null) {
      throw new Error('Plugin must export an object');
    }

    // Validate hook handlers
    for (const hookName of Object.keys(plugin.hooks)) {
      const handler = exports.hooks?.[hookName];
      if (handler && typeof handler !== 'function') {
        throw new Error(`Hook handler ${hookName} must be a function`);
      }
    }

    // Validate lifecycle methods
    const lifecycleMethods = ['onActivate', 'onDeactivate', 'onError'];
    for (const method of lifecycleMethods) {
      if (exports[method] && typeof exports[method] !== 'function') {
        throw new Error(`${method} must be a function`);
      }
    }
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(plugin, operation) {
    const permissionMap = {
      spawnAgent: 'agent_spawn',
      communicateWithAgent: 'agent_communicate',
      storeMemory: 'memory_write',
      retrieveMemory: 'memory_read',
      searchMemory: 'memory_read'
    };

    const permission = permissionMap[operation];
    if (!permission) {return true;} // No permission required

    return plugin.permissions[permission] === true;
  }

  /**
   * Track API usage metrics
   */
  trackAPIUsage(pluginId, functionName, executionTime) {
    // Implementation would track detailed metrics
    logger.debug(`Plugin ${pluginId} called ${functionName} (${executionTime}ms)`);
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins() {
    return Array.from(this.plugins.values()).filter(p => p.state === 'active');
  }

  /**
   * Get plugin metrics
   */
  getPluginMetrics(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {return null;}

    return {
      ...plugin.metrics,
      state: plugin.state,
      uptime: plugin.state === 'active' 
        ? Date.now() - plugin.metrics.lastActivated 
        : 0,
      averageExecutionTime: plugin.metrics.totalExecutionTime / 
        (plugin.metrics.activations || 1)
    };
  }

  // Utility methods
  generatePluginId(name) {
    return `plugin-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  hashData(data) {
    // Simple hash implementation
    return require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  satisfiesVersion(version, requirement) {
    // Simple version check - would use semver in production
    return version === requirement || requirement === '*';
  }

  isPathAllowed(pluginPath) {
    // Security check for allowed paths
    const allowedPaths = [
      path.resolve('./plugins'),
      path.resolve('./node_modules/@bumba-plugins')
    ];
    
    return allowedPaths.some(allowed => pluginPath.startsWith(allowed));
  }
}

/**
 * Plugin Lifecycle Manager
 */
class PluginLifecycle {
  constructor(plugin) {
    this.plugin = plugin;
    this.states = ['registered', 'loaded', 'active', 'error'];
    this.currentState = 'registered';
    this.stateHistory = [];
  }

  async activate() {
    this.transitionTo('active');
    
    // Perform activation tasks
    await this.runActivationTasks();
  }

  async deactivate() {
    // Perform deactivation tasks
    await this.runDeactivationTasks();
    
    this.transitionTo('loaded');
  }

  transitionTo(newState) {
    if (!this.states.includes(newState)) {
      throw new Error(`Invalid state: ${newState}`);
    }

    this.stateHistory.push({
      from: this.currentState,
      to: newState,
      timestamp: Date.now()
    });

    this.currentState = newState;
  }

  async runActivationTasks() {
    // Initialize plugin resources
    // Set up monitoring
    // Register with services
  }

  async runDeactivationTasks() {
    // Cleanup resources
    // Unregister from services
    // Save state if needed
  }
}

/**
 * Plugin Sandbox for secure execution
 */
class PluginSandbox {
  constructor(config) {
    this.pluginId = config.pluginId;
    this.permissions = config.permissions;
    this.resourceLimits = config.resourceLimits;
    this.context = null;
  }

  async initialize() {
    // Create isolated context
    this.context = {
      global: {},
      console: this.createSafeConsole(),
      setTimeout: this.createSafeTimer('setTimeout'),
      setInterval: this.createSafeTimer('setInterval'),
      Promise: Promise,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Date: Date,
      Math: Math,
      JSON: JSON
    };
  }

  async execute(code, additionalContext = {}) {
    // Merge contexts
    const executionContext = {
      ...this.context,
      ...additionalContext
    };

    // Execute with resource limits
    try {
      if (typeof code === 'function') {
        return await code.call(executionContext);
      } else {
        // Create function from code string
        const fn = new Function(...Object.keys(executionContext), code);
        return await fn.call(null, ...Object.values(executionContext));
      }
    } catch (error) {
      logger.error(`Sandbox execution error for plugin ${this.pluginId}:`, error);
      throw error;
    }
  }

  createSafeConsole() {
    return {
      log: (...args) => logger.info(`[Plugin ${this.pluginId}]`, ...args),
      error: (...args) => logger.error(`[Plugin ${this.pluginId}]`, ...args),
      warn: (...args) => logger.warn(`[Plugin ${this.pluginId}]`, ...args),
      debug: (...args) => logger.debug(`[Plugin ${this.pluginId}]`, ...args)
    };
  }

  createSafeTimer(type) {
    const timers = new Set();
    
    return (fn, delay, ...args) => {
      if (delay > this.resourceLimits.timeout) {
        throw new Error(`Timer delay exceeds limit: ${delay}ms`);
      }

      const timer = global[type](() => {
        timers.delete(timer);
        fn(...args);
      }, delay);

      timers.add(timer);
      
      return timer;
    };
  }

  async cleanup() {
    // Cleanup resources
    this.context = null;
  }
}

module.exports = { BumbaPluginArchitecture, PluginLifecycle, PluginSandbox };