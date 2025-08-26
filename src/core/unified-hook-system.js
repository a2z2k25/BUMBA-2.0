/**
 * BUMBA Unified Hook System
 * Consolidated hook management and execution
 * Generated: 2024-12-19
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

/**
 * Core Hook Manager
 * Handles all hook registration and execution
 */
class UnifiedHookSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.hooks = new Map();
    this.middleware = [];
    this.config = config;
    this.executionLog = [];
    this.maxLogSize = config.maxLogSize || 1000;
    
    // Hook categories
    this.categories = {
      agent: new Set(),
      notion: new Set(),
      operability: new Set(),
      statusLine: new Set(),
      system: new Set(),
      learning: new Set(),
      integration: new Set()
    };
    
    this.initialize();
  }
  
  initialize() {
    // Register core system hooks
    this.registerSystemHooks();
    
    // Register integration hooks
    this.registerIntegrationHooks();
    
    // Register learning hooks enhancements
    this.registerLearningHookEnhancements();
    
    // Load user-defined hooks if configured
    if (this.config.hooksPath) {
      this.loadUserHooks(this.config.hooksPath);
    }
  }
  
  /**
   * Register a hook
   */
  register(name, handler, options = {}) {
    const { category = 'system', priority = 0, async = true } = options;
    
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    
    const hook = {
      name,
      handler,
      category,
      priority,
      async,
      registered: Date.now()
    };
    
    this.hooks.get(name).push(hook);
    
    // Sort by priority
    this.hooks.get(name).sort((a, b) => b.priority - a.priority);
    
    // Track category
    if (this.categories[category]) {
      this.categories[category].add(name);
    }
    
    this.emit('hook:registered', { name, category });
    
    return this;
  }
  
  /**
   * Execute a hook
   */
  async execute(name, context = {}, options = {}) {
    const { timeout = 5000, parallel = false } = options;
    
    if (!this.hooks.has(name)) {
      return { results: [], errors: [] };
    }
    
    const hooks = this.hooks.get(name);
    const results = [];
    const errors = [];
    
    const execution = {
      name,
      context,
      started: Date.now(),
      hooks: hooks.length
    };
    
    try {
      if (parallel) {
        // Execute hooks in parallel
        const promises = hooks.map(hook => 
          this.execute(hook, context, timeout)
        );
        
        const outcomes = await Promise.allSettled(promises);
        
        outcomes.forEach(outcome => {
          if (outcome.status === 'fulfilled') {
            results.push(outcome.value);
          } else {
            errors.push(outcome.reason);
          }
        });
      } else {
        // Execute hooks sequentially
        for (const hook of hooks) {
          try {
            const result = await this.execute(hook, context, timeout);
            results.push(result);
            
            // Allow hooks to modify context
            if (result && result.modifiedContext) {
              Object.assign(context, result.modifiedContext);
            }
          } catch (error) {
            errors.push(error);
            
            // Stop on critical errors
            if (error.critical) {
              break;
            }
          }
        }
      }
    } finally {
      execution.completed = Date.now();
      execution.duration = execution.completed - execution.started;
      execution.results = results.length;
      execution.errors = errors.length;
      
      this.logExecution(execution);
      this.emit('hook:executed', execution);
    }
    
    return { results, errors, execution };
  }
  
  /**
   * Execute a single hook with timeout
   */
  async executeHook(hook, context, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Hook ${hook.name} timed out after ${timeout}ms`));
      }, timeout);
      
      const handleResult = (result) => {
        clearTimeout(timer);
        resolve(result);
      };
      
      const handleError = (error) => {
        clearTimeout(timer);
        reject(error);
      };
      
      try {
        if (hook.async) {
          hook.handler(context)
            .then(handleResult)
            .catch(handleError);
        } else {
          const result = hook.handler(context);
          handleResult(result);
        }
      } catch (error) {
        handleError(error);
      }
    });
  }
  
  /**
   * Register system hooks
   */
  registerSystemHooks() {
    // Pre-execution hooks
    this.register('before:command', async (context) => {
      // Validate command
      if (!context.command) {
        throw new Error('No command specified');
      }
      return { valid: true };
    }, { category: 'system', priority: 100 });
    
    // Post-execution hooks
    this.register('after:command', async (context) => {
      // Log command execution
      this.logCommand(context);
      return { logged: true };
    }, { category: 'system', priority: 0 });
    
    // Error hooks
    this.register('on:error', async (context) => {
      // Handle errors
      console.error('[Hook Error]', context.error);
      return { handled: true };
    }, { category: 'system', priority: 50 });
    
    // Task completion audio celebrations
    this.register('task:complete', async (context) => {
      // Play audio for major task completions
      if (context.major || context.milestone) {
        try {
          const { audioFallbackSystem } = require('./audio-fallback-system');
          await audioFallbackSystem.playAchievementAudio('TASK_COMPLETE', {
            task: context.task || 'unknown',
            type: context.type || 'general',
            duration: context.duration,
            success: context.success !== false
          });
        } catch (audioError) {
          // Silent fail - don't disrupt task flow
        }
      }
      return { audio_triggered: true };
    }, { category: 'system', priority: 5 });
    
    // Agent collaboration success audio
    this.register('collaboration:success', async (context) => {
      try {
        const { audioFallbackSystem } = require('./audio-fallback-system');
        await audioFallbackSystem.playAchievementAudio('COLLABORATION_SUCCESS', {
          agents: context.agents || [],
          type: context.collaboration_type || 'general',
          result: context.result || 'success'
        });
      } catch (audioError) {
        // Silent fail
      }
      return { audio_triggered: true };
    }, { category: 'system', priority: 5 });
  }

  /**
   * Register integration hooks
   */
  registerIntegrationHooks() {
    // Integration connection hooks
    this.register('integration:connect', async (context) => {
      return context;
    }, { category: 'integration', priority: 10 });
    
    this.register('integration:sync', async (context) => {
      return context;
    }, { category: 'integration', priority: 10 });
    
    this.register('integration:bridge', async (context) => {
      return context;
    }, { category: 'integration', priority: 10 });
    
    this.register('integration:validate', async (context) => {
      return context;
    }, { category: 'integration', priority: 10 });
    
    // Load actual integration hooks if available
    try {
      const { getInstance } = require('./hooks/integration-hooks');
      const integrationHooks = getInstance();
      integrationHooks.initialize();
      
      // Bridge integration hooks to unified system
      integrationHooks.on('integration:connected', (data) => {
        this.emit('integration:connected', data);
      });
      
      integrationHooks.on('integration:synced', (data) => {
        this.emit('integration:synced', data);
      });
    } catch (error) {
      // Integration hooks not available
    }
  }

  /**
   * Register learning hook enhancements
   */
  registerLearningHookEnhancements() {
    // Learning capture hooks
    this.register('learning:capture', async (context) => {
      context.captureTime = Date.now();
      return context;
    }, { category: 'learning', priority: 10 });
    
    this.register('learning:optimize', async (context) => {
      context.optimizationTime = Date.now();
      return context;
    }, { category: 'learning', priority: 10 });
    
    this.register('learning:feedback', async (context) => {
      context.feedbackTime = Date.now();
      return context;
    }, { category: 'learning', priority: 10 });
    
    this.register('learning:improve', async (context) => {
      context.improvementTime = Date.now();
      return context;
    }, { category: 'learning', priority: 10 });
  }
  
  /**
   * Agent-specific hooks
   */
  registerAgentHooks() {
    this.register('agent:spawn', async (context) => {
      const { agent, task } = context;
      console.log(`[Agent] Spawning ${agent} for ${task}`);
      return { spawned: true };
    }, { category: 'agent' });
    
    this.register('agent:complete', async (context) => {
      const { agent, result } = context;
      console.log(`[Agent] ${agent} completed`);
      return { completed: true };
    }, { category: 'agent' });
  }
  
  /**
   * Notion integration hooks
   */
  registerNotionHooks() {
    this.register('notion:sync', async (context) => {
      const { data, workspace } = context;
      console.log(`[Notion] Syncing to ${workspace}`);
      return { synced: true };
    }, { category: 'notion' });
    
    this.register('notion:dashboard:update', async (context) => {
      const { metrics } = context;
      console.log('[Notion] Dashboard updated');
      return { updated: true };
    }, { category: 'notion' });
  }
  
  /**
   * Operability hooks
   */
  registerOperabilityHooks() {
    this.register('health:check', async (context) => {
      const health = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        hooks: this.hooks.size
      };
      return { health };
    }, { category: 'operability' });
    
    this.register('metrics:collect', async (context) => {
      const metrics = {
        executions: this.executionLog.length,
        categories: Object.keys(this.categories).map(cat => ({
          name: cat,
          hooks: this.categories[cat].size
        }))
      };
      return { metrics };
    }, { category: 'operability' });
  }
  
  /**
   * Status line hooks
   */
  registerStatusLineHooks() {
    this.register('status:update', async (context) => {
      const { message, type = 'info' } = context;
      // Update status line
      return { displayed: true };
    }, { category: 'statusLine' });
    
    this.register('progress:update', async (context) => {
      const { current, total, message } = context;
      // Update progress
      return { progress: (current / total) * 100 };
    }, { category: 'statusLine' });
  }
  
  /**
   * Load user-defined hooks
   */
  loadUserHooks(hooksPath) {
    if (fs.existsSync(hooksPath)) {
      try {
        const userHooks = require(hooksPath);
        
        if (userHooks.register) {
          userHooks.register(this);
        }
        
        console.log(`[Hooks] Loaded user hooks from ${hooksPath}`);
      } catch (error) {
        console.error('[Hooks] Failed to load user hooks:', error);
      }
    }
  }
  
  /**
   * Add middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }
  
  /**
   * Remove hooks
   */
  remove(name, handler = null) {
    if (!this.hooks.has(name)) {
      return false;
    }
    
    if (handler) {
      const hooks = this.hooks.get(name);
      const index = hooks.findIndex(h => h.handler === handler);
      
      if (index !== -1) {
        hooks.splice(index, 1);
        
        if (hooks.length === 0) {
          this.hooks.delete(name);
        }
        
        return true;
      }
    } else {
      this.hooks.delete(name);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear all hooks
   */
  clear(category = null) {
    if (category) {
      const hookNames = this.categories[category];
      
      if (hookNames) {
        hookNames.forEach(name => this.hooks.delete(name));
        this.categories[category].clear();
      }
    } else {
      this.hooks.clear();
      Object.values(this.categories).forEach(cat => cat.clear());
    }
  }
  
  /**
   * Log execution
   */
  logExecution(execution) {
    this.executionLog.push(execution);
    
    // Trim log if too large
    if (this.executionLog.length > this.maxLogSize) {
      this.executionLog = this.executionLog.slice(-this.maxLogSize);
    }
  }
  
  /**
   * Log command
   */
  logCommand(context) {
    const { command, args, result } = context;
    
    const logEntry = {
      command,
      args,
      timestamp: Date.now(),
      success: !context.error
    };
    
    if (this.config.verbose) {
      console.log('[Command]', logEntry);
    }
  }
  
  /**
   * Get hook statistics
   */
  getStats() {
    const stats = {
      totalHooks: this.hooks.size,
      categories: {},
      executions: this.executionLog.length,
      recentExecutions: this.executionLog.slice(-10)
    };
    
    Object.entries(this.categories).forEach(([cat, hooks]) => {
      stats.categories[cat] = hooks.size;
    });
    
    return stats;
  }
  
  /**
   * Connect dashboard for automatic updates
   */
  connectDashboard(dashboard, manager) {
    this.connectedDashboard = dashboard;
    this.dashboardManager = manager;
    
    // Register dashboard-specific hooks
    this.register('dashboard:update', async (context) => {
      if (this.connectedDashboard && this.connectedDashboard.update) {
        await this.connectedDashboard.update(context);
      }
      return { updated: true };
    }, { category: 'dashboard' });
    
    logger.info('🏁 Dashboard connected to hook system');
    return true;
  }
  
  /**
   * Trigger a hook (alias for execute for compatibility)
   */
  async triggerHook(name, context = {}) {
    return await this.execute(name, context);
  }
  
  /**
   * Export hook configuration
   */
  export() {
    const config = {
      hooks: [],
      categories: {}
    };
    
    this.hooks.forEach((hookList, name) => {
      hookList.forEach(hook => {
        config.hooks.push({
          name,
          category: hook.category,
          priority: hook.priority,
          async: hook.async
        });
      });
    });
    
    Object.entries(this.categories).forEach(([cat, hooks]) => {
      config.categories[cat] = Array.from(hooks);
    });
    
    return config;
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create hook system instance
 */
function getHookSystem(config = {}) {
  if (!instance) {
    instance = new UnifiedHookSystem(config);
  }
  return instance;
}

/**
 * Hook decorator for methods
 */
function hookable(hookName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const hookSystem = getHookSystem();
      
      // Execute before hook
      await hookSystem.execute(`before:${hookName}`, {
        target: this,
        method: propertyKey,
        args
      });
      
      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Execute after hook
        await hookSystem.execute(`after:${hookName}`, {
          target: this,
          method: propertyKey,
          args,
          result
        });
        
        return result;
      } catch (error) {
        // Execute error hook
        await hookSystem.execute(`error:${hookName}`, {
          target: this,
          method: propertyKey,
          args,
          error
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Export everything
module.exports = {
  UnifiedHookSystem,
  getHookSystem,
  hookable,
  
  // Factory function
  createHookSystem: (config) => new UnifiedHookSystem(config),
  
  // Compatibility alias for getInstance pattern
  getInstance: () => getHookSystem()
};