/**
 * BUMBA Universal Hook System
 * Provides 45+ hook points for framework extensibility
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { performanceMetrics } = require('../monitoring/performance-metrics');

class BumbaHookSystem extends EventEmitter {
  constructor() {
    super();
    this.hooks = new Map();
    this.handlers = new Map();
    this.middleware = [];
    this.executionCount = new Map();
    
    // Hook categories
    this.categories = {
      lifecycle: ['agent:spawn', 'agent:deprecate', 'agent:state-change'],
      team: ['team:compose', 'team:validate', 'team:optimize'],
      model: ['model:select', 'model:evaluate-cost', 'model:fallback'],
      command: ['command:pre-execute', 'command:execute', 'command:post-execute'],
      integration: ['integration:connect', 'integration:disconnect', 'integration:error'],
      performance: ['performance:threshold', 'performance:optimize', 'performance:report'],
      security: ['security:validate', 'security:audit', 'security:breach'],
      error: ['error:catch', 'error:recover', 'error:report'],
      department: ['department:coordinate', 'department:handoff', 'department:conflict'],
      knowledge: ['knowledge:transfer', 'knowledge:persist', 'knowledge:retrieve']
    };

    // Register all hook points
    this.registerHookPoints();
    
    logger.info(`🪝 Hook System initialized with ${this.getHookCount()} hook points`);
  }

  // Register all predefined hook points
  registerHookPoints() {
    Object.values(this.categories).flat().forEach(hookName => {
      this.registerHook(hookName);
    });

    // Additional dynamic hooks
    const dynamicHooks = [
      'framework:init',
      'framework:ready',
      'framework:shutdown',
      'api:request',
      'api:response',
      'api:error',
      'cache:hit',
      'cache:miss',
      'cache:update',
      'test:start',
      'test:pass',
      'test:fail',
      'documentation:generate',
      'documentation:update',
      'budget:check',
      'budget:exceed',
      'resource:allocate',
      'resource:release',
      'workflow:start',
      'workflow:complete'
    ];

    dynamicHooks.forEach(hookName => {
      this.registerHook(hookName);
    });
  }

  // Register a new hook point
  registerHook(name, options = {}) {
    if (this.hooks.has(name)) {
      return false;
    }

    this.hooks.set(name, {
      name,
      handlers: [],
      options,
      created: Date.now(),
      executionCount: 0
    });

    this.executionCount.set(name, 0);
    return true;
  }

  // Register a handler for a hook
  registerHandler(hookName, handler, options = {}) {
    if (!this.hooks.has(hookName)) {
      logger.warn(`Hook ${hookName} does not exist. Creating it.`);
      this.registerHook(hookName);
    }

    const hook = this.hooks.get(hookName);
    const handlerInfo = {
      handler,
      priority: options.priority || 50,
      name: options.name || 'anonymous',
      async: options.async !== false
    };

    hook.handlers.push(handlerInfo);
    hook.handlers.sort((a, b) => b.priority - a.priority);

    logger.debug(`Handler '${handlerInfo.name}' registered for hook '${hookName}'`);
    return true;
  }

  // Execute a hook
  async executeHook(hookName, context = {}, options = {}) {
    const timer = performanceMetrics.startTimer(`hook:${hookName}`);

    if (!this.hooks.has(hookName)) {
      logger.warn(`Hook ${hookName} does not exist`);
      timer();
      return context;
    }

    const hook = this.hooks.get(hookName);
    hook.executionCount++;
    this.executionCount.set(hookName, hook.executionCount);

    // Add metadata to context
    context._hook = {
      name: hookName,
      executionCount: hook.executionCount,
      timestamp: Date.now()
    };

    // Execute global middleware
    for (const middleware of this.middleware) {
      context = await middleware(hookName, context);
    }

    // Execute hook handlers
    for (const handlerInfo of hook.handlers) {
      try {
        if (handlerInfo.async) {
          context = await handlerInfo.handler(context, hookName);
        } else {
          context = handlerInfo.handler(context, hookName);
        }

        // Allow handlers to stop propagation
        if (context._stopPropagation) {
          break;
        }
      } catch (error) {
        logger.error(`Error in hook handler '${handlerInfo.name}' for '${hookName}':`, error);
        
        if (options.throwOnError) {
          throw error;
        }

        // Store error in context
        context._errors = context._errors || [];
        context._errors.push({
          handler: handlerInfo.name,
          error: error.message
        });
      }
    }

    // Emit event for monitoring
    this.emit('hook-executed', {
      name: hookName,
      context,
      duration: timer(),
      handlerCount: hook.handlers.length
    });

    performanceMetrics.incrementCounter(`hooks.${hookName}.executions`);

    return context;
  }

  // Add global middleware
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  // Remove a handler
  removeHandler(hookName, handlerName) {
    if (!this.hooks.has(hookName)) {
      return false;
    }

    const hook = this.hooks.get(hookName);
    const initialLength = hook.handlers.length;
    
    hook.handlers = hook.handlers.filter(h => h.name !== handlerName);
    
    return hook.handlers.length < initialLength;
  }

  // Clear all handlers for a hook
  clearHandlers(hookName) {
    if (!this.hooks.has(hookName)) {
      return false;
    }

    const hook = this.hooks.get(hookName);
    hook.handlers = [];
    
    return true;
  }

  // Get hook information
  getHookInfo(hookName) {
    const hook = this.hooks.get(hookName);
    if (!hook) {
      return null;
    }

    return {
      name: hook.name,
      handlerCount: hook.handlers.length,
      handlers: hook.handlers.map(h => ({
        name: h.name,
        priority: h.priority,
        async: h.async
      })),
      executionCount: hook.executionCount,
      created: hook.created
    };
  }

  // Get all hooks
  getAllHooks() {
    const hooks = {};
    
    for (const [category, hookNames] of Object.entries(this.categories)) {
      hooks[category] = hookNames.map(name => this.getHookInfo(name));
    }

    // Add uncategorized hooks
    const categorizedHooks = new Set(Object.values(this.categories).flat());
    const uncategorized = [];
    
    for (const hookName of this.hooks.keys()) {
      if (!categorizedHooks.has(hookName)) {
        uncategorized.push(this.getHookInfo(hookName));
      }
    }

    if (uncategorized.length > 0) {
      hooks.uncategorized = uncategorized;
    }

    return hooks;
  }

  // Get hook count
  getHookCount() {
    return this.hooks.size;
  }

  // Get handler count
  getHandlerCount() {
    let count = 0;
    for (const hook of this.hooks.values()) {
      count += hook.handlers.length;
    }
    return count;
  }

  // Get execution statistics
  getStatistics() {
    const stats = {
      totalHooks: this.hooks.size,
      totalHandlers: this.getHandlerCount(),
      totalExecutions: 0,
      hooks: {}
    };

    for (const [name, count] of this.executionCount.entries()) {
      stats.totalExecutions += count;
      stats.hooks[name] = count;
    }

    return stats;
  }

  // Reset statistics
  resetStatistics() {
    for (const hookName of this.executionCount.keys()) {
      this.executionCount.set(hookName, 0);
    }
    
    for (const hook of this.hooks.values()) {
      hook.executionCount = 0;
    }
  }

  // Create a scoped hook executor
  createScoped(scope) {
    return {
      execute: (hookName, context = {}) => {
        context.scope = scope;
        return this.executeHook(hookName, context);
      },
      register: (hookName, handler, options = {}) => {
        options.name = `${scope}:${options.name || 'handler'}`;
        return this.registerHandler(hookName, handler, options);
      }
    };
  }
}

// Singleton instance
let instance;

function getInstance() {
  if (!instance) {
    instance = new BumbaHookSystem();
  }
  return instance;
}

module.exports = {
  BumbaHookSystem,
  getInstance,
  hookSystem: getInstance()
};