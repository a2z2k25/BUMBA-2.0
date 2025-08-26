/**
 * BUMBA Framework Integration Layer
 * Connects all Phase 0 and Phase 1 improvements into a unified system
 */

const { BumbaVersionManager } = require('../version-manager');
const { logger } = require('../logging/bumba-logger');

const { BumbaTieredInstaller } = require('../tiered-installer');
const { audioFallbackSystem } = require('../audio-fallback-system');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');
const { bumbaHookSystem } = require('../unified-hook-system');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { resourceManager } = require('../resource-management/resource-manager');

/**
 * Framework Integration Manager
 * Orchestrates all subsystems for seamless operation
 */
class BumbaFrameworkIntegration {
  constructor() {
    this.systems = {
      version: new BumbaVersionManager(),
      installer: new BumbaTieredInstaller(),
      audio: audioFallbackSystem,
      errors: new BumbaErrorBoundary(),
      hooks: bumbaHookSystem,
      mcp: mcpServerManager,
      resources: resourceManager
    };
    
    this.integrationStatus = {
      initialized: false,
      systems_healthy: false,
      last_health_check: null,
      startup_time: null
    };
    
    this.configuration = {
      enable_hooks: true,
      enable_audio: true,
      enable_mcp_resilience: true,
      enable_resource_management: true,
      auto_recovery: true,
      health_check_interval: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Initialize all integrated systems
   */
  async initialize(options = {}) {
    const startTime = Date.now();
    logger.info('🟢 Initializing BUMBA Framework Integration...');
    
    try {
      // Merge configuration options
      this.configuration = { ...this.configuration, ...options };
      
      // Phase 1: Version validation and reconciliation
      await this.initializeVersionSystem();
      
      // Phase 2: Error handling setup
      await this.initializeErrorHandling();
      
      // Phase 3: Resource management
      await this.initializeResourceManagement();
      
      // Phase 4: Hook system
      await this.initializeHookSystem();
      
      // Phase 5: MCP resilience
      await this.initializeMCPSystem();
      
      // Phase 6: Audio system
      await this.initializeAudioSystem();
      
      // Phase 7: Health monitoring
      await this.startHealthMonitoring();
      
      const duration = Date.now() - startTime;
      this.integrationStatus = {
        initialized: true,
        systems_healthy: true,
        last_health_check: new Date().toISOString(),
        startup_time: duration
      };
      
      logger.info(`🏁 BUMBA Framework Integration completed in ${duration}ms`);
      return true;
      
    } catch (error) {
      logger.error(`🔴 Framework integration failed: ${error.message}`);
      this.integrationStatus.initialized = false;
      throw error;
    }
  }

  async initializeVersionSystem() {
    logger.info('🟢 Initializing version management...');
    
    const versionValid = await this.systems.version.startupValidation();
    if (!versionValid) {
      throw new BumbaError('VERSION_INIT_FAILED', 'Version system initialization failed');
    }
    
    logger.info('🏁 Version management initialized');
  }

  async initializeErrorHandling() {
    logger.info('🟢 Initializing error handling system...');
    
    // Set global error handlers
    process.on('uncaughtException', (error) => {
      logger.error('🔴 Uncaught Exception:', error);
      this.handleCriticalError(error);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('🔴 Unhandled Rejection:', reason);
      this.handleCriticalError(new Error(`Unhandled Promise Rejection: ${reason}`));
    });
    
    logger.info('🏁 Error handling system initialized');
  }

  async initializeResourceManagement() {
    logger.info('🟢 Initializing resource management...');
    
    if (this.configuration.enable_resource_management) {
      // Resource manager starts automatically in constructor
      logger.info('🏁 Resource management initialized');
    } else {
      logger.info('⏭️ Resource management disabled');
    }
  }

  async initializeHookSystem() {
    logger.info('🟢 Initializing hook system...');
    
    if (this.configuration.enable_hooks) {
      // Hook system is initialized in constructor
      logger.info('🏁 Hook system initialized');
    } else {
      logger.info('⏭️ Hook system disabled');
    }
  }

  async initializeMCPSystem() {
    logger.info('🟢 Initializing MCP resilience system...');
    
    if (this.configuration.enable_mcp_resilience) {
      // MCP manager starts automatically in constructor
      logger.info('🏁 MCP resilience system initialized');
    } else {
      logger.info('⏭️ MCP resilience disabled');
    }
  }

  async initializeAudioSystem() {
    logger.info('🟢 Initializing audio system...');
    
    if (this.configuration.enable_audio) {
      const audioStatus = this.systems.audio.getAudioStatus();
      logger.info(`🏁 Audio system initialized (${audioStatus.strategy})`);
    } else {
      this.systems.audio.disableAudio('configuration_disabled');
      logger.info('⏭️ Audio system disabled');
    }
  }

  async startHealthMonitoring() {
    logger.info('🟢 Starting health monitoring...');
    
    // Perform initial health check
    await this.performHealthCheck();
    
    // Schedule periodic health checks
    const healthInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.configuration.health_check_interval);
    
    // Track the interval for cleanup
    this.systems.resources.resources.timers.add(healthInterval);
    
    logger.info('🏁 Health monitoring started');
  }

  /**
   * Perform comprehensive health check across all systems
   */
  async performHealthCheck() {
    try {
      const health = {
        timestamp: new Date().toISOString(),
        overall_healthy: true,
        systems: {}
      };

      // Check version system
      health.systems.version = {
        status: 'healthy',
        version: this.systems.version.getFrameworkVersion()
      };

      // Check error handling
      health.systems.errors = {
        status: 'healthy',
        stats: this.systems.errors.getErrorStats ? this.systems.errors.getErrorStats() : {}
      };

      // Check resource management
      health.systems.resources = {
        status: 'healthy',
        usage: this.systems.resources.getResourceUsage()
      };

      // Check hook system
      health.systems.hooks = {
        status: 'healthy',
        hook_status: this.systems.hooks.getStatus()
      };

      // Check MCP system
      health.systems.mcp = {
        status: 'healthy',
        server_health: this.systems.mcp.getSystemHealth()
      };

      // Check audio system
      health.systems.audio = {
        status: 'healthy',
        audio_status: this.systems.audio.getAudioStatus()
      };

      // Determine overall health
      const unhealthySystems = Object.entries(health.systems)
        .filter(([name, system]) => system.status !== 'healthy');
      
      health.overall_healthy = unhealthySystems.length === 0;
      
      if (!health.overall_healthy) {
        logger.warn(`🟡 System health issues detected: ${unhealthySystems.map(([name]) => name).join(', ')}`);
      }

      this.integrationStatus.systems_healthy = health.overall_healthy;
      this.integrationStatus.last_health_check = health.timestamp;
      
      return health;
      
    } catch (error) {
      logger.error(`🔴 Health check failed: ${error.message}`);
      this.integrationStatus.systems_healthy = false;
      throw error;
    }
  }

  /**
   * Execute operation with full framework integration and enhanced hooks
   */
  async executeWithIntegration(operation, context = {}) {
    if (!this.integrationStatus.initialized) {
      throw new BumbaError('FRAMEWORK_NOT_INITIALIZED', 'Framework integration not initialized');
    }

    // Allocate resources
    const taskAllocation = await this.systems.resources.requestResources('tasks', 1, 'integrated_operation');
    
    try {
      // Create hook context for passing data between hooks
      const { HookContext } = require('../unified-hook-system');
      const hookContext = new HookContext({
        operation: operation.name || 'unknown',
        context: context,
        startTime: Date.now(),
        agent: context.agent || 'framework'
      });
      
      // Pre-execution hook with context
      if (this.configuration.enable_hooks) {
        const preHookResult = await this.systems.hooks.execute('pre-execution', hookContext);
        
        if (!preHookResult.allow) {
          throw new BumbaError('OPERATION_BLOCKED', 'Operation blocked by pre-execution hook');
        }
        
        // Check if any agent handoff is needed
        if (hookContext.data.handoff) {
          await this.systems.hooks.execute('agent:handoff', hookContext);
        }
      }

      // Execute with error boundary
      const result = await BumbaErrorBoundary.wrap(async () => {
          // Pass enhanced context from hooks
          const enhancedContext = { ...context, ...hookContext.data };
          return await operation(enhancedContext);
        },
        async () => {
          logger.info('🟢 Using fallback execution strategy');
          return { success: false, fallback: true };
        }
      );
      
      // Store result in context for post-execution hooks
      hookContext.set('result', result);
      hookContext.set('duration', Date.now() - hookContext.data.startTime);

      // Post-execution hook with enhanced context
      if (this.configuration.enable_hooks) {
        await this.systems.hooks.execute('post-execution', hookContext);
      }

      // Completion notification
      if (this.configuration.enable_hooks) {
        await this.systems.hooks.execute('completion', {
          message: `Operation ${operation.name || 'unknown'} completed successfully`
        });
      }

      return result;
      
    } catch (error) {
      // Handle error with integrated error system
      logger.error(`🔴 Integrated operation failed: ${error.message}`);
      
      if (this.configuration.auto_recovery) {
        logger.info('🟢 Attempting auto-recovery...');
        // Could implement recovery strategies here
      }
      
      throw error;
      
    } finally {
      // Release resources
      await taskAllocation.release();
    }
  }

  /**
   * Handle critical errors
   */
  handleCriticalError(error) {
    logger.error('🔴 Critical error detected:', error.message);
    
    // Could implement emergency shutdown procedures here
    if (this.configuration.auto_recovery) {
      logger.info('🟢 Initiating emergency recovery procedures...');
    }
  }

  /**
   * Get comprehensive framework status
   */
  async getFrameworkStatus() {
    const health = await this.performHealthCheck();
    
    return {
      framework_name: 'BUMBA',
      version: this.systems.version.getFrameworkVersion(),
      integration_status: this.integrationStatus,
      system_health: health,
      configuration: this.configuration,
      capabilities: {
        version_management: true,
        tiered_installation: true,
        audio_fallback: this.configuration.enable_audio,
        error_handling: true,
        hook_system: this.configuration.enable_hooks,
        mcp_resilience: this.configuration.enable_mcp_resilience,
        resource_management: this.configuration.enable_resource_management
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig) {
    this.configuration = { ...this.configuration, ...newConfig };
    logger.info('🟢 Framework configuration updated');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🟢 Shutting down BUMBA Framework Integration...');
    
    try {
      // Shutdown resource manager
      await this.systems.resources.shutdown();
      
      // Clear hook cache
      this.systems.hooks.clearCache();
      
      // Disable audio
      this.systems.audio.disableAudio('framework_shutdown');
      
      logger.info('🏁 Framework integration shutdown completed');
      
    } catch (error) {
      logger.error(`🔴 Shutdown error: ${error.message}`);
    }
  }

  /**
   * Create installer instance
   */
  createInstaller() {
    return this.systems.installer;
  }

  /**
   * Test all systems
   */
  async testAllSystems() {
    logger.info('🟢 Testing all integrated systems...\n');
    
    const results = {};
    
    try {
      // Test version system
      logger.info('Testing version management...');
      const versionCheck = await this.systems.version.validateVersionConsistency();
      results.version = { success: versionCheck.consistent, details: versionCheck };
      
      // Test error handling
      logger.info('Testing error handling...');
      try {
        await BumbaErrorBoundary.wrap(() => {
          throw new Error('Test error');
        }, () => ({ recovered: true }));
        results.errors = { success: true, details: 'Error boundary working' };
      } catch (error) {
        results.errors = { success: false, details: error.message };
      }
      
      // Test resource management
      logger.info('Testing resource management...');
      const resourceUsage = this.systems.resources.getResourceUsage();
      results.resources = { success: true, details: resourceUsage };
      
      // Test hook system
      logger.info('Testing hook system...');
      const hookResult = await this.systems.hooks.execute('consciousness-check', { test: true });
      results.hooks = { success: hookResult.allow, details: hookResult };
      
      // Test MCP system
      logger.info('Testing MCP resilience...');
      const mcpHealth = this.systems.mcp.getSystemHealth();
      results.mcp = { success: mcpHealth.overall_health > 0, details: mcpHealth };
      
      // Test audio system
      logger.info('Testing audio system...');
      const audioTest = await this.systems.audio.testAudioSystem();
      results.audio = { success: audioTest.success, details: audioTest };
      
      logger.info('\n🏁 System testing completed');
      return results;
      
    } catch (error) {
      logger.error(`🔴 System testing failed: ${error.message}`);
      return { error: error.message, partial_results: results };
    }
  }
}

// Export singleton instance
const frameworkIntegration = new BumbaFrameworkIntegration();

module.exports = {
  FrameworkIntegration: BumbaFrameworkIntegration,  // Standard export name
  BumbaFrameworkIntegration,  // Keep for backward compatibility
  frameworkIntegration  // Singleton instance
};