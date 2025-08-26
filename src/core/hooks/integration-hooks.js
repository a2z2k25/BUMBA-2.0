/**
 * BUMBA Integration Hooks
 * Provides hooks for external service integrations
 */

const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

class IntegrationHooks extends EventEmitter {
  constructor() {
    super();
    this.hooks = new Map();
    this.integrations = new Map();
    this.metrics = {
      connectionsEstablished: 0,
      syncOperations: 0,
      bridgeOperations: 0,
      validationChecks: 0,
      errors: 0
    };
  }

  /**
   * Initialize integration hooks
   */
  async initialize() {
    logger.info('🔌 Initializing Integration Hooks...');
    
    // Register core integration hooks
    this.registerCoreHooks();
    
    // Connect to existing integrations
    await this.connectExistingIntegrations();
    
    logger.info('🏁 Integration Hooks initialized');
    return true;
  }

  /**
   * Register core integration hooks
   */
  registerCoreHooks() {
    // Connection hook
    this.registerHook('integration:connect', {
      before: async (context) => {
        logger.info(`🔌 Connecting to ${context.service}...`);
        context.connectionStartTime = Date.now();
        
        // Validate credentials
        if (!context.credentials) {
          throw new Error(`Missing credentials for ${context.service}`);
        }
        
        // Check if already connected
        if (this.integrations.has(context.service)) {
          context.alreadyConnected = true;
          logger.info(`🏁 ${context.service} already connected`);
        }
        
        return context;
      },
      after: async (context, result) => {
        if (!context.alreadyConnected) {
          this.integrations.set(context.service, {
            connected: true,
            connectionTime: Date.now(),
            instance: result
          });
          
          this.metrics.connectionsEstablished++;
          
          const duration = Date.now() - context.connectionStartTime;
          logger.info(`🏁 Connected to ${context.service} in ${duration}ms`);
          
          this.emit('integration:connected', {
            service: context.service,
            duration
          });
        }
        
        return result;
      },
      onError: async (context, error) => {
        this.metrics.errors++;
        logger.error(`🔴 Failed to connect to ${context.service}: ${error.message}`);
        
        this.emit('integration:error', {
          service: context.service,
          error: error.message,
          phase: 'connect'
        });
        
        throw error;
      }
    });

    // Synchronization hook
    this.registerHook('integration:sync', {
      before: async (context) => {
        logger.info(`🔄 Syncing with ${context.service}...`);
        context.syncStartTime = Date.now();
        
        // Check connection
        if (!this.integrations.has(context.service)) {
          throw new Error(`${context.service} not connected`);
        }
        
        // Prepare sync data
        context.dataToSync = await this.prepareSyncData(context);
        context.lastSyncTime = this.getLastSyncTime(context.service);
        
        return context;
      },
      after: async (context, result) => {
        this.metrics.syncOperations++;
        
        const duration = Date.now() - context.syncStartTime;
        const itemsSynced = result.itemsSynced || 0;
        
        // Update last sync time
        this.updateLastSyncTime(context.service, Date.now());
        
        logger.info(`🏁 Synced ${itemsSynced} items with ${context.service} in ${duration}ms`);
        
        this.emit('integration:synced', {
          service: context.service,
          itemsSynced,
          duration
        });
        
        return result;
      },
      onError: async (context, error) => {
        this.metrics.errors++;
        logger.error(`🔴 Sync failed for ${context.service}: ${error.message}`);
        
        // Attempt recovery
        if (context.retryCount < 3) {
          logger.info(`🔄 Retrying sync for ${context.service}...`);
          context.retryCount = (context.retryCount || 0) + 1;
          return await this.executeHook('integration:sync', context);
        }
        
        throw error;
      }
    });

    // Bridge hook for connecting different systems
    this.registerHook('integration:bridge', {
      before: async (context) => {
        logger.info(`🟢 Bridging ${context.source} to ${context.target}...`);
        context.bridgeStartTime = Date.now();
        
        // Validate both services are connected
        if (!this.integrations.has(context.source)) {
          throw new Error(`Source service ${context.source} not connected`);
        }
        if (!this.integrations.has(context.target)) {
          throw new Error(`Target service ${context.target} not connected`);
        }
        
        // Prepare data transformation
        context.transformer = this.getDataTransformer(context.source, context.target);
        
        return context;
      },
      after: async (context, result) => {
        this.metrics.bridgeOperations++;
        
        const duration = Date.now() - context.bridgeStartTime;
        const itemsBridged = result.itemsBridged || 0;
        
        logger.info(`🏁 Bridged ${itemsBridged} items from ${context.source} to ${context.target} in ${duration}ms`);
        
        this.emit('integration:bridged', {
          source: context.source,
          target: context.target,
          itemsBridged,
          duration
        });
        
        return result;
      }
    });

    // Validation hook
    this.registerHook('integration:validate', {
      before: async (context) => {
        logger.info(`🔍 Validating integration ${context.service}...`);
        context.validationStartTime = Date.now();
        
        // Check if service is registered
        if (!this.integrations.has(context.service)) {
          context.validationResult = {
            valid: false,
            reason: 'Service not connected'
          };
          return context;
        }
        
        return context;
      },
      after: async (context, result) => {
        this.metrics.validationChecks++;
        
        const duration = Date.now() - context.validationStartTime;
        const isValid = result.valid !== false;
        
        if (isValid) {
          logger.info(`🏁 Integration ${context.service} validated in ${duration}ms`);
        } else {
          logger.warn(`🟠️ Integration ${context.service} validation failed: ${result.reason}`);
        }
        
        this.emit('integration:validated', {
          service: context.service,
          valid: isValid,
          duration
        });
        
        return result;
      }
    });

    // Disconnect hook
    this.registerHook('integration:disconnect', {
      before: async (context) => {
        logger.info(`🔌 Disconnecting from ${context.service}...`);
        
        if (!this.integrations.has(context.service)) {
          logger.warn(`🟠️ ${context.service} not connected`);
          context.wasConnected = false;
        } else {
          context.wasConnected = true;
        }
        
        return context;
      },
      after: async (context, result) => {
        if (context.wasConnected) {
          this.integrations.delete(context.service);
          logger.info(`🏁 Disconnected from ${context.service}`);
          
          this.emit('integration:disconnected', {
            service: context.service
          });
        }
        
        return result;
      }
    });

    logger.info('📝 Registered 5 core integration hooks');
  }

  /**
   * Connect to existing integrations
   */
  async connectExistingIntegrations() {
    const integrationsToConnect = [
      'notion',
      'figma',
      'slack',
      'discord',
      'github',
      'openrouter'
    ];
    
    for (const service of integrationsToConnect) {
      try {
        // Check if integration module exists
        const integrationPath = `../integrations/${service}-integration`;
        const integrationExists = await this.checkIntegrationExists(integrationPath);
        
        if (integrationExists) {
          // Mark as available (actual connection happens on demand)
          this.integrations.set(service, {
            connected: false,
            available: true,
            path: integrationPath
          });
          logger.info(`📦 ${service} integration available`);
        }
      } catch (error) {
        // Integration not available, skip
      }
    }
  }

  /**
   * Check if integration exists
   */
  async checkIntegrationExists(path) {
    try {
      require.resolve(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register a hook
   */
  registerHook(name, config) {
    this.hooks.set(name, config);
    return this;
  }

  /**
   * Execute a hook
   */
  async executeHook(name, context = {}) {
    const hook = this.hooks.get(name);
    if (!hook) {
      logger.warn(`Hook ${name} not found`);
      return context;
    }
    
    try {
      // Execute before hook
      if (hook.before) {
        context = await hook.before(context);
      }
      
      // Execute main operation (if provided)
      let result = context;
      if (context.operation) {
        result = await context.operation();
      }
      
      // Execute after hook
      if (hook.after) {
        result = await hook.after(context, result);
      }
      
      return result;
    } catch (error) {
      // Execute error hook
      if (hook.onError) {
        return await hook.onError(context, error);
      }
      throw error;
    }
  }

  /**
   * Prepare data for synchronization
   */
  async prepareSyncData(context) {
    // Implementation would prepare data based on service type
    return {
      timestamp: Date.now(),
      data: context.data || [],
      metadata: context.metadata || {}
    };
  }

  /**
   * Get last sync time for a service
   */
  getLastSyncTime(service) {
    const integration = this.integrations.get(service);
    return integration?.lastSyncTime || null;
  }

  /**
   * Update last sync time for a service
   */
  updateLastSyncTime(service, time) {
    const integration = this.integrations.get(service);
    if (integration) {
      integration.lastSyncTime = time;
    }
  }

  /**
   * Get data transformer for bridging services
   */
  getDataTransformer(source, target) {
    // Return appropriate transformer based on source and target
    return {
      transform: (data) => {
        // Default passthrough transformer
        return data;
      }
    };
  }

  /**
   * Get integration status
   */
  getStatus() {
    const status = {
      initialized: true,
      hooks: Array.from(this.hooks.keys()),
      integrations: {},
      metrics: this.metrics
    };
    
    this.integrations.forEach((integration, service) => {
      status.integrations[service] = {
        connected: integration.connected,
        available: integration.available || false,
        lastSync: integration.lastSyncTime || null
      };
    });
    
    return status;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalHooks: this.hooks.size,
      connectedIntegrations: Array.from(this.integrations.entries())
        .filter(([_, i]) => i.connected).length,
      availableIntegrations: this.integrations.size
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  IntegrationHooks,
  getInstance: () => {
    if (!instance) {
      instance = new IntegrationHooks();
    }
    return instance;
  }
};