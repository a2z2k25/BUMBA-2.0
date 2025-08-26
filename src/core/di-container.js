/**
 * BUMBA Dependency Injection Container
 *
 * Provides centralized dependency management and injection
 * to prevent circular dependencies and ensure consistent initialization.
 */

const { logger } = require('./logging/bumba-logger');

class DIContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.initialized = new Set();
  }

  /**
   * Register a service factory
   */
  registerFactory(name, factory, options = {}) {
    this.factories.set(name, {
      factory,
      singleton: options.singleton !== false,
      dependencies: options.dependencies || []
    });
  }

  /**
   * Register a service instance
   */
  registerInstance(name, instance) {
    this.services.set(name, instance);
    this.initialized.add(name);
  }

  /**
   * Get a service instance
   */
  get(name) {
    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Create instance from factory
    if (this.factories.has(name)) {
      return this.createInstance(name);
    }

    throw new Error(`Service '${name}' not found in DI container`);
  }

  /**
   * Create instance from factory
   */
  createInstance(name) {
    const config = this.factories.get(name);

    // Prevent circular dependencies
    if (this.initialized.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`);
    }

    this.initialized.add(name);

    try {
      // Resolve dependencies
      const dependencies = {};
      for (const dep of config.dependencies) {
        dependencies[dep] = this.get(dep);
      }

      // Create instance
      const instance = config.factory(dependencies);

      // Store if singleton
      if (config.singleton) {
        this.services.set(name, instance);
      }

      return instance;
    } catch (error) {
      this.initialized.delete(name);
      throw error;
    }
  }

  /**
   * Check if service is registered
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Initialize all registered services
   */
  async initializeAll() {
    const serviceNames = [...this.factories.keys()];

    for (const name of serviceNames) {
      try {
        this.get(name);
        logger.debug(`Initialized service: ${name}`);
      } catch (error) {
        logger.error(`Failed to initialize service ${name}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    const status = {};

    for (const [name, instance] of this.services) {
      try {
        if (instance && typeof instance.getStats === 'function') {
          status[name] = { healthy: true, stats: instance.getStats() };
        } else {
          status[name] = { healthy: true, message: 'No health check available' };
        }
      } catch (error) {
        status[name] = { healthy: false, error: error.message };
      }
    }

    return status;
  }

  /**
   * Reset container (for testing)
   */
  reset() {
    this.services.clear();
    this.factories.clear();
    this.initialized.clear();
  }
}

// Global container instance
const container = new DIContainer();

// Register core services
container.registerFactory('logger', () => require('./logging/bumba-logger').logger);

// Register coordination systems
container.registerFactory('fileLocking', () =>
  require('./coordination/file-locking-system').getInstance()
);

container.registerFactory('territoryManager', () =>
  require('./coordination/territory-manager').getInstance()
);

container.registerFactory('safeFileOps', () =>
  require('./coordination/safe-file-operations').getInstance()
);

container.registerFactory('agentIdentity', () =>
  require('./coordination/agent-identity').getInstance()
);

container.registerFactory('coordinationDashboard', () =>
  require('./coordination/coordination-dashboard').getInstance()
);

// Register routing systems
container.registerFactory('unifiedRouter', () => {
  const { BumbaIntelligentRouter } = require('./unified-routing-system');
  return new BumbaIntelligentRouter();
});

container.registerFactory('simpleRouter', () =>
  require('./simple-router')
);

module.exports = {
  container,
  DIContainer
};
