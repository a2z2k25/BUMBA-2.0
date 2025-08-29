/**
 * BUMBA CLI Recovery System
 * Comprehensive error recovery and self-healing capabilities
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class FrameworkRecovery extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      autoRecover: options.autoRecover !== false,
      maxRecoveryAttempts: options.maxRecoveryAttempts || 3,
      recoveryDelay: options.recoveryDelay || 2000,
      healthCheckInterval: options.healthCheckInterval || 30000,
      criticalComponents: options.criticalComponents || [
        'router', 'consciousness', 'departments'
      ],
      ...options
    };
    
    // Recovery state
    this.recoveryAttempts = new Map();
    this.componentHealth = new Map();
    this.lastHealthCheck = null;
    this.isRecovering = false;
    
    // Recovery strategies
    this.strategies = new Map();
    this.registerDefaultStrategies();
    
    // Statistics
    this.stats = {
      errorsDetected: 0,
      recoveriesAttempted: 0,
      recoveriesSuccessful: 0,
      recoveriesFailed: 0,
      componentsRestored: 0
    };
  }

  /**
   * Register default recovery strategies
   */
  registerDefaultStrategies() {
    // Deferred initialization timeout recovery
    this.registerStrategy('deferred-init-timeout', async (error, context) => {
      logger.info('Recovering from deferred initialization timeout...');
      
      const { framework } = context;
      if (!framework) return false;
      
      // Force complete deferred initialization
      if (framework.deferredInitManager) {
        try {
          // Get current status
          const status = framework.deferredInitManager.getStatus();
          
          // Initialize failed components individually
          for (const [component, state] of Object.entries(status.components)) {
            if (state === 'failed' || state === 'pending') {
              try {
                await framework.deferredInitManager.initializeNow(component);
                logger.info(`🏁 Recovered component: ${component}`);
                this.stats.componentsRestored++;
              } catch (err) {
                logger.warn(`Could not recover component ${component}: ${err.message}`);
              }
            }
          }
          
          return true;
        } catch (err) {
          logger.error('Failed to recover deferred initialization:', err);
          return false;
        }
      }
      
      return false;
    });
    
    // Status line connection recovery
    this.registerStrategy('statusline-connection', async (error, context) => {
      logger.info('Recovering status line connection...');
      
      const { framework } = context;
      if (!framework) return false;
      
      try {
        // Get status line connector
        const { getInstance: getConnector } = require('../status/status-line-connector');
        const connector = getConnector();
        
        // Disconnect and reconnect
        connector.disconnect();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reconnect with framework's status line
        if (framework.statusLine) {
          await connector.connect(framework.statusLine, framework);
          logger.info('🏁 Status line reconnected');
          return true;
        }
        
        // Try to create new status line
        const { getStatusLine } = require('../status/status-line-manager');
        framework.statusLine = getStatusLine();
        await connector.connect(framework.statusLine, framework);
        
        logger.info('🏁 Status line recreated and connected');
        return true;
        
      } catch (err) {
        logger.error('Failed to recover status line:', err);
        return false;
      }
    });
    
    // Memory MCP connection recovery
    this.registerStrategy('memory-mcp-connection', async (error, context) => {
      logger.info('Recovering Memory MCP connection...');
      
      const { framework } = context;
      if (!framework || !framework.memoryMCP) return false;
      
      try {
        // Get MCP connection manager
        const { getInstance: getManager } = require('../mcp/mcp-connection-manager');
        const manager = getManager();
        
        // Check current status
        const status = manager.getStatus();
        if (status.connections.memory?.status === 'failed') {
          // Reset connection attempts
          manager.connectionAttempts.set('memory', 0);
          
          // Retry connection
          await manager.connect('memory', framework.memoryMCP, {
            maxRetries: 2,
            retryDelay: 1000
          });
          
          logger.info('🏁 Memory MCP reconnected');
          return true;
        }
        
        return false;
        
      } catch (err) {
        logger.error('Failed to recover Memory MCP:', err);
        return false;
      }
    });
    
    // Department manager recovery
    this.registerStrategy('department-failure', async (error, context) => {
      logger.info('Recovering department manager...');
      
      const { framework, departmentName } = context;
      if (!framework || !departmentName) return false;
      
      try {
        const dept = framework.departments.get(departmentName);
        if (!dept) return false;
        
        // Reset department state
        if (dept.reset) {
          await dept.reset();
        }
        
        // Reinitialize connections
        if (dept.safeFileOps && framework.coordination) {
          dept.safeFileOps = framework.coordination.safeFileOps;
          dept.territoryManager = framework.coordination.territoryManager;
          dept.fileLocking = framework.coordination.fileLocking;
        }
        
        logger.info(`🏁 Department ${departmentName} recovered`);
        return true;
        
      } catch (err) {
        logger.error(`Failed to recover department ${departmentName}:`, err);
        return false;
      }
    });
  }

  /**
   * Register a custom recovery strategy
   */
  registerStrategy(errorType, recoveryFunction) {
    this.strategies.set(errorType, recoveryFunction);
    logger.debug(`Registered recovery strategy for: ${errorType}`);
  }

  /**
   * Handle an error and attempt recovery
   */
  async handleError(error, context = {}) {
    this.stats.errorsDetected++;
    
    // Determine error type
    const errorType = this.classifyError(error);
    logger.info(`Detected error type: ${errorType}`);
    
    // Check if auto-recovery is enabled
    if (!this.options.autoRecover) {
      logger.warn('Auto-recovery disabled, skipping recovery attempt');
      this.emit('error:unrecovered', error, errorType);
      return false;
    }
    
    // Check recovery attempts
    const attempts = this.recoveryAttempts.get(errorType) || 0;
    if (attempts >= this.options.maxRecoveryAttempts) {
      logger.error(`Max recovery attempts reached for ${errorType}`);
      this.stats.recoveriesFailed++;
      this.emit('recovery:failed', errorType, error);
      return false;
    }
    
    // Attempt recovery
    this.isRecovering = true;
    this.recoveryAttempts.set(errorType, attempts + 1);
    this.stats.recoveriesAttempted++;
    
    try {
      // Get recovery strategy
      const strategy = this.strategies.get(errorType);
      if (!strategy) {
        logger.warn(`No recovery strategy for error type: ${errorType}`);
        return false;
      }
      
      // Execute recovery with delay
      if (attempts > 0) {
        const delay = this.options.recoveryDelay * Math.pow(2, attempts - 1);
        logger.info(`Waiting ${delay}ms before recovery attempt ${attempts + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Run recovery strategy
      const recovered = await strategy(error, context);
      
      if (recovered) {
        this.stats.recoveriesSuccessful++;
        this.recoveryAttempts.set(errorType, 0); // Reset on success
        logger.info(`🏁 Successfully recovered from ${errorType}`);
        this.emit('recovery:success', errorType);
        return true;
      } else {
        logger.warn(`Recovery strategy failed for ${errorType}`);
        return false;
      }
      
    } catch (recoveryError) {
      logger.error(`Recovery error for ${errorType}:`, recoveryError);
      this.stats.recoveriesFailed++;
      this.emit('recovery:error', errorType, recoveryError);
      return false;
      
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Classify error type for appropriate recovery strategy
   */
  classifyError(error) {
    const errorMessage = error.message || error.toString();
    
    // Check for specific error patterns
    if (errorMessage.includes('timeout') && errorMessage.includes('initialization')) {
      return 'deferred-init-timeout';
    }
    
    if (errorMessage.includes('status') && errorMessage.includes('line')) {
      return 'statusline-connection';
    }
    
    if (errorMessage.includes('Memory MCP') || errorMessage.includes('memory') && errorMessage.includes('MCP')) {
      return 'memory-mcp-connection';
    }
    
    if (errorMessage.includes('department') || errorMessage.includes('manager')) {
      return 'department-failure';
    }
    
    if (errorMessage.includes('MCP') && errorMessage.includes('not connected')) {
      return 'mcp-disconnection';
    }
    
    // Check if it's a registered error type (exact match)
    if (this.strategies.has(errorMessage)) {
      return errorMessage;
    }
    
    // Default classification
    return 'unknown-error';
  }

  /**
   * Perform health check on framework components
   */
  async performHealthCheck(framework) {
    const health = {
      timestamp: Date.now(),
      healthy: true,
      components: {}
    };
    
    // Check critical components
    for (const component of this.options.criticalComponents) {
      try {
        const isHealthy = await this.checkComponentHealth(framework, component);
        health.components[component] = isHealthy;
        if (!isHealthy) {
          health.healthy = false;
        }
      } catch (error) {
        health.components[component] = false;
        health.healthy = false;
      }
    }
    
    // Check deferred initialization
    if (framework.deferredInitManager) {
      const status = framework.deferredInitManager.getStatus();
      health.components['deferred-init'] = !status.isInitializing || status.elapsed < 10000;
    }
    
    // Check status line
    if (framework.statusLine) {
      const { getInstance: getConnector } = require('../status/status-line-connector');
      const connector = getConnector();
      health.components['status-line'] = connector.isHealthy();
    }
    
    // Check MCP connections
    const { getInstance: getManager } = require('../mcp/mcp-connection-manager');
    const manager = getManager();
    const mcpStatus = manager.getStatus();
    health.components['mcp-connections'] = Object.values(mcpStatus.connections)
      .filter(c => c.status === 'connected').length > 0;
    
    this.lastHealthCheck = health;
    this.emit('health:checked', health);
    
    // Trigger recovery if unhealthy
    if (!health.healthy && this.options.autoRecover) {
      for (const [component, isHealthy] of Object.entries(health.components)) {
        if (!isHealthy) {
          logger.warn(`Component unhealthy: ${component}`);
          await this.handleError(
            new Error(`Component ${component} is unhealthy`),
            { framework, component }
          );
        }
      }
    }
    
    return health;
  }

  /**
   * Check health of a specific component
   */
  async checkComponentHealth(framework, component) {
    switch (component) {
      case 'router':
        return framework.router !== null && framework.router !== undefined;
        
      case 'consciousness':
        return framework.consciousness !== null && framework.consciousness !== undefined;
        
      case 'departments':
        return framework.departments && framework.departments.size > 0;
        
      default:
        return true;
    }
  }

  /**
   * Start automatic health monitoring
   */
  startHealthMonitoring(framework) {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck(framework);
    }, this.options.healthCheckInterval);
    
    logger.info(`Started health monitoring (interval: ${this.options.healthCheckInterval}ms)`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Stopped health monitoring');
    }
  }

  /**
   * Get recovery status
   */
  getStatus() {
    return {
      isRecovering: this.isRecovering,
      lastHealthCheck: this.lastHealthCheck,
      recoveryAttempts: Object.fromEntries(this.recoveryAttempts),
      stats: this.stats,
      strategies: Array.from(this.strategies.keys())
    };
  }

  /**
   * Reset recovery system
   */
  reset() {
    this.recoveryAttempts.clear();
    this.componentHealth.clear();
    this.lastHealthCheck = null;
    this.isRecovering = false;
    this.stats = {
      errorsDetected: 0,
      recoveriesAttempted: 0,
      recoveriesSuccessful: 0,
      recoveriesFailed: 0,
      componentsRestored: 0
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  FrameworkRecovery,
  getInstance: (options) => {
    if (!instance) {
      instance = new FrameworkRecovery(options);
    }
    return instance;
  },
  resetInstance: () => {
    if (instance) {
      instance.stopHealthMonitoring();
      instance.reset();
    }
    instance = null;
  }
};