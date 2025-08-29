/**
 * BUMBA System Orchestrator
 * Central orchestration layer that coordinates all components
 */

const { logger } = require('./logging/bumba-logger');

// Core Intelligence Components
const { getInstance: getRouter } = require('./command-intelligence/command-router');
const { getInstance: getSelector } = require('./command-intelligence/specialist-selector');
const { getInstance: getGenerator } = require('./command-intelligence/intelligent-output-generator');
const { getInstance: getCollaborator } = require('./command-intelligence/multi-agent-collaborator');
const { getInstance: getChainExecutor } = require('./command-intelligence/command-chain-executor');

// Performance Components
const { getInstance: getCacheManager } = require('./command-intelligence/cache-manager');
const { getInstance: getPerformanceMonitor } = require('./command-intelligence/performance-monitor');
const { getInstance: getResourceOptimizer } = require('./command-intelligence/resource-optimizer');
const { getInstance: getQueryOptimizer } = require('./command-intelligence/query-optimizer');
const { getInstance: getMemoryManager } = require('./command-intelligence/memory-manager');
const { getInstance: getLoadBalancer } = require('./command-intelligence/load-balancer');

// Error Handling
const { getInstance: getErrorManager } = require('./error-handling/unified-error-manager');

// Department Managers
const ProductManager = require('./department-managers/product-manager');
const DesignManager = require('./department-managers/design-manager');
const BackendManager = require('./department-managers/backend-manager');

class SystemOrchestrator {
  constructor() {
    this.initialized = false;
    this.components = {};
    this.departmentManagers = {};
    this.systemState = 'idle';
    this.activeCommands = new Map();
  }

  /**
   * Initialize the entire BUMBA system
   */
  async initialize() {
    if (this.initialized) {
      logger.info('System already initialized');
      return;
    }

    logger.info('🚀 Initializing BUMBA System Orchestrator...');
    
    try {
      // Initialize core components
      await this.initializeCoreComponents();
      
      // Initialize department managers
      await this.initializeDepartments();
      
      // Initialize performance systems
      await this.initializePerformanceSystems();
      
      // Setup error handling
      await this.setupErrorHandling();
      
      // Warm up caches
      await this.warmupSystem();
      
      this.initialized = true;
      this.systemState = 'ready';
      
      logger.info('✅ BUMBA System fully initialized and ready');
      
      // Display startup metrics
      this.displayStartupMetrics();
      
    } catch (error) {
      logger.error('Failed to initialize system:', error);
      throw error;
    }
  }

  /**
   * Initialize core intelligent components
   */
  async initializeCoreComponents() {
    logger.info('Initializing core components...');
    
    this.components.router = getRouter();
    this.components.selector = getSelector();
    this.components.generator = getGenerator();
    this.components.collaborator = getCollaborator();
    this.components.chainExecutor = getChainExecutor();
    
    // Connect components
    this.components.router.setSelector(this.components.selector);
    this.components.router.setGenerator(this.components.generator);
    this.components.router.setCollaborator(this.components.collaborator);
    
    logger.info('✓ Core components initialized');
  }

  /**
   * Initialize department managers
   */
  async initializeDepartments() {
    logger.info('Initializing department managers...');
    
    this.departmentManagers.product = new ProductManager();
    this.departmentManagers.design = new DesignManager();
    this.departmentManagers.backend = new BackendManager();
    
    // Initialize each department
    for (const [name, manager] of Object.entries(this.departmentManagers)) {
      await manager.initialize();
      manager.setOutputGenerator(this.components.generator);
      manager.setSpecialistSelector(this.components.selector);
      logger.info(`✓ ${name} department initialized`);
    }
  }

  /**
   * Initialize performance optimization systems
   */
  async initializePerformanceSystems() {
    logger.info('Initializing performance systems...');
    
    this.components.cache = getCacheManager();
    this.components.monitor = getPerformanceMonitor();
    this.components.optimizer = getResourceOptimizer();
    this.components.queryOptimizer = getQueryOptimizer();
    this.components.memory = getMemoryManager();
    this.components.loadBalancer = getLoadBalancer();
    
    // Create memory pools for frequently used objects
    this.components.memory.createObjectPool('CommandContext', 
      () => ({ command: null, args: [], context: {} }),
      (obj) => { obj.command = null; obj.args = []; obj.context = {}; }
    );
    
    this.components.memory.createObjectPool('AnalysisResult',
      () => ({ success: false, data: null, specialists: [] }),
      (obj) => { obj.success = false; obj.data = null; obj.specialists = []; }
    );
    
    logger.info('✓ Performance systems initialized');
  }

  /**
   * Setup comprehensive error handling
   */
  async setupErrorHandling() {
    logger.info('Setting up error handling...');
    
    this.components.errorManager = getErrorManager();
    
    // Setup global error handlers
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error);
      await this.handleSystemError(error, 'uncaughtException');
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection:', reason);
      await this.handleSystemError(reason, 'unhandledRejection');
    });
    
    // Memory emergency handler
    process.on('memoryEmergency', async () => {
      logger.warn('Memory emergency triggered');
      await this.handleMemoryEmergency();
    });
    
    logger.info('✓ Error handling configured');
  }

  /**
   * Warm up system caches and pre-initialize common resources
   */
  async warmupSystem() {
    logger.info('Warming up system...');
    
    // Pre-cache common command mappings
    const commonCommands = ['prd', 'api', 'design', 'implement', 'analyze'];
    for (const cmd of commonCommands) {
      const key = this.components.cache.generateKey(cmd, [], {});
      this.components.cache.set(key, { warmed: true }, 600000); // 10 minutes
    }
    
    // Pre-activate commonly used specialists
    const commonSpecialists = ['product-manager', 'api-specialist', 'ui-designer'];
    for (const specialist of commonSpecialists) {
      await this.components.selector.preloadSpecialist(specialist);
    }
    
    logger.info('✓ System warmed up');
  }

  /**
   * Execute a command through the orchestrated system
   */
  async executeCommand(command, args = [], context = {}) {
    const commandId = this.generateCommandId();
    
    try {
      // Check system state
      if (this.systemState !== 'ready') {
        throw new Error(`System not ready: ${this.systemState}`);
      }
      
      // Start performance monitoring
      this.components.monitor.startCommand(commandId, command, args, context);
      
      // Optimize resources before execution
      const optimization = await this.components.optimizer.optimizeForCommand(command, args, context);
      const optimizedContext = { ...context, ...optimization.context };
      
      // Track active command
      this.activeCommands.set(commandId, {
        command,
        args,
        context: optimizedContext,
        startTime: Date.now()
      });
      
      // Check for command chains
      if (this.isCommandChain(command)) {
        return await this.executeCommandChain(commandId, command, args, optimizedContext);
      }
      
      // Route through intelligent system
      const result = await this.components.router.route(command, args, optimizedContext);
      
      // End monitoring
      this.components.monitor.endCommand(commandId, result);
      
      // Clean up
      this.activeCommands.delete(commandId);
      
      return result;
      
    } catch (error) {
      // Handle error
      const recovery = await this.components.errorManager.handleError(error, {
        commandId,
        command,
        args,
        context
      });
      
      // Clean up
      this.activeCommands.delete(commandId);
      this.components.monitor.endCommand(commandId, { success: false, error });
      
      if (recovery.retry && recovery.attempts < 3) {
        logger.info('Retrying command with recovery suggestions...');
        return this.executeCommand(command, args, { ...context, ...recovery.suggestions });
      }
      
      throw recovery.error || error;
    }
  }

  /**
   * Execute a command chain
   */
  async executeCommandChain(commandId, chain, args, context) {
    logger.info(`Executing command chain: ${chain}`);
    
    const result = await this.components.chainExecutor.executeChain(chain, args, context);
    
    // Track chain execution
    this.components.monitor.endCommand(commandId, result);
    
    return result;
  }

  /**
   * Check if input is a command chain
   */
  isCommandChain(command) {
    return typeof command === 'string' && 
           (command.includes('&&') || command.includes('||') || 
            command.includes('|') || command.includes('->'));
  }

  /**
   * Handle system-level errors
   */
  async handleSystemError(error, type) {
    logger.error(`System error [${type}]:`, error);
    
    // Try to recover
    const recovery = await this.components.errorManager.handleError(error, {
      type,
      system: true
    });
    
    // If critical, initiate graceful shutdown
    if (recovery.classification.severity === 'critical') {
      await this.gracefulShutdown('Critical system error');
    }
  }

  /**
   * Handle memory emergency
   */
  async handleMemoryEmergency() {
    logger.warn('Handling memory emergency...');
    
    // Pause new commands
    this.systemState = 'memory-emergency';
    
    // Clear all caches
    this.components.cache.clear();
    
    // Force garbage collection
    if (global.gc) {
      global.gc(true);
    }
    
    // Resume after cleanup
    setTimeout(() => {
      this.systemState = 'ready';
      logger.info('System recovered from memory emergency');
    }, 5000);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      state: this.systemState,
      initialized: this.initialized,
      activeCommands: this.activeCommands.size,
      components: {
        cache: this.components.cache.getStats(),
        performance: this.components.monitor.getStats(),
        resources: this.components.optimizer.getStats(),
        memory: this.components.memory.getStats(),
        loadBalancer: this.components.loadBalancer.getStats(),
        errors: this.components.errorManager.getErrorStats()
      },
      departments: Object.keys(this.departmentManagers)
    };
  }

  /**
   * Display startup metrics
   */
  displayStartupMetrics() {
    const status = this.getStatus();
    
    logger.info('📊 System Startup Metrics:');
    logger.info(`  State: ${status.state}`);
    logger.info(`  Memory: ${status.components.memory.current.percent}`);
    logger.info(`  Cache: ${status.components.cache.items} items`);
    logger.info(`  Departments: ${status.departments.join(', ')}`);
  }

  /**
   * Generate unique command ID
   */
  generateCommandId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(reason = 'User requested') {
    logger.info(`Initiating graceful shutdown: ${reason}`);
    
    this.systemState = 'shutting-down';
    
    // Wait for active commands to complete
    const timeout = setTimeout(() => {
      logger.warn('Shutdown timeout - forcing exit');
      process.exit(1);
    }, 10000);
    
    // Stop accepting new commands
    while (this.activeCommands.size > 0) {
      logger.info(`Waiting for ${this.activeCommands.size} commands to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    clearTimeout(timeout);
    
    // Stop monitoring
    this.components.monitor.stopMonitoring();
    this.components.memory.stop();
    this.components.loadBalancer.stop();
    
    // Clear caches
    this.components.cache.clear();
    
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  }

  /**
   * Reset system
   */
  async reset() {
    logger.info('Resetting system...');
    
    // Clear all caches
    this.components.cache.clear();
    
    // Reset monitors
    this.components.monitor.reset();
    this.components.optimizer.reset();
    
    // Clear active commands
    this.activeCommands.clear();
    
    // Re-initialize
    await this.warmupSystem();
    
    logger.info('✅ System reset complete');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SystemOrchestrator,
  getInstance: () => {
    if (!instance) {
      instance = new SystemOrchestrator();
    }
    return instance;
  }
};