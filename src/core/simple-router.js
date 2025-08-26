/**
 * BUMBA Simple Router
 *
 * Lightweight routing for simple-framework.js deployments
 *
 * Purpose: Provides basic command routing without the overhead of
 * intelligent analysis, department coordination, or complex routing logic.
 *
 * Usage: Used exclusively by simple-command-handler.js and simple-framework.js
 * Alternative: For advanced routing, use unified-routing-system.js
 *
 * Features:
 * - 🏁 Basic command-to-handler mapping
 * - 🏁 Simple middleware support
 * - 🏁 Fallback handler support
 * - 🔴 No department routing
 * - 🔴 No intelligent analysis
 * - 🔴 No parallel coordination
 */

const { logger } = require('./logging/bumba-logger');

class SimpleRouter {
  constructor() {
    this.routes = new Map();
    this.fallbackHandler = null;
    this.middleware = [];

    // Register default routes
    this.registerDefaultRoutes();
  }

  /**
   * Register default command routes
   */
  registerDefaultRoutes() {
    // Core commands
    this.register('help', this.handleHelp.bind(this));
    this.register('status', this.handleStatus.bind(this));
    this.register('version', this.handleVersion.bind(this));

    // Bumba specific routes
    this.register('implement', this.handleImplement.bind(this));
    this.register('analyze', this.handleAnalyze.bind(this));
    this.register('test', this.handleTest.bind(this));
    this.register('validate', this.handleValidate.bind(this));
  }

  /**
   * Register a command handler
   */
  register(command, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${command} must be a function`);
    }
    this.routes.set(command.toLowerCase(), handler);
    logger.debug(`Registered route: ${command}`);
  }

  /**
   * Add middleware function
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middleware.push(middleware);
  }

  /**
   * Route a command to appropriate handler
   * This is the main method expected by tests
   */
  routeCommand(command, context = {}) {
    // Alias to route method for backward compatibility
    return this.route(command, context);
  }

  /**
   * Route command to handler
   */
  async route(command, context = {}) {
    try {
      const commandLower = command.toLowerCase();

      // Apply middleware
      for (const mw of this.middleware) {
        const result = await mw(command, context);
        if (result === false) {
          return { success: false, message: 'Blocked by middleware' };
        }
      }

      // Find handler
      let handler = this.routes.get(commandLower);

      // Try to find partial match if exact match not found
      if (!handler) {
        for (const [key, value] of this.routes) {
          if (commandLower.startsWith(key) || key.startsWith(commandLower)) {
            handler = value;
            break;
          }
        }
      }

      // Use fallback if no handler found
      if (!handler && this.fallbackHandler) {
        handler = this.fallbackHandler;
      }

      if (!handler) {
        return {
          success: false,
          error: `No handler found for command: ${command}`,
          availableCommands: Array.from(this.routes.keys())
        };
      }

      // Execute handler
      const result = await handler(command, context);

      return {
        success: true,
        command,
        result
      };

    } catch (error) {
      logger.error(`Routing error for command "${command}":`, error);
      return {
        success: false,
        error: error.message,
        command
      };
    }
  }

  /**
   * Set fallback handler for unmatched commands
   */
  setFallback(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Fallback handler must be a function');
    }
    this.fallbackHandler = handler;
  }

  /**
   * List all registered routes
   */
  listRoutes() {
    return Array.from(this.routes.keys());
  }

  /**
   * Clear all routes
   */
  clear() {
    this.routes.clear();
    this.middleware = [];
    this.fallbackHandler = null;
  }

  // Default handlers

  async handleHelp(command, context) {
    return {
      message: 'BUMBA Simple Router Help',
      availableCommands: this.listRoutes(),
      usage: 'Use router.route(command, context) to execute commands'
    };
  }

  async handleStatus(command, context) {
    return {
      status: 'operational',
      routesCount: this.routes.size,
      middlewareCount: this.middleware.length,
      hasFallback: !!this.fallbackHandler
    };
  }

  async handleVersion(command, context) {
    return {
      name: 'BUMBA Simple Router',
      version: '1.0.0',
      framework: 'BUMBA AI Development Platform'
    };
  }

  async handleImplement(command, context) {
    return {
      action: 'implement',
      message: 'Implementation request received',
      context
    };
  }

  async handleAnalyze(command, context) {
    return {
      action: 'analyze',
      message: 'Analysis request received',
      context
    };
  }

  async handleTest(command, context) {
    return {
      action: 'test',
      message: 'Test request received',
      context
    };
  }

  async handleValidate(command, context) {
    return {
      action: 'validate',
      message: 'Validation request received',
      context
    };
  }

  /**
   * Clear any cached data (for testing)
   */
  clearCache() {
    // This router doesn't use cache, but method provided for test compatibility
    logger.debug('Cache cleared (no-op for SimpleRouter)');
  }

  /**
   * Reset statistics (for testing)
   */
  resetStats() {
    // This router doesn't track stats, but method provided for test compatibility
    logger.debug('Stats reset (no-op for SimpleRouter)');
  }
}

// Export singleton instance
const instance = new SimpleRouter();

module.exports = instance;
module.exports.SimpleRouter = SimpleRouter;
