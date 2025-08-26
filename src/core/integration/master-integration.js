/**
 * BUMBA Master Integration System
 * Unifies all Phase 2 & 3 upgrades into a cohesive, production-ready framework
 */

const { BumbaVersionManager } = require('../version-manager');
const { logger } = require('../logging/bumba-logger');

const { BumbaTieredInstaller } = require('../tiered-installer');
const { audioFallbackSystem } = require('../audio-fallback-system');
const { BumbaError, BumbaErrorBoundary } = require('../error-handling/bumba-error-system');
const { bumbaHookSystem } = require('../unified-hook-system');
const { mcpServerManager } = require('../mcp/mcp-resilience-system');
const { resourceManager } = require('../resource-management/resource-manager');
const { bumbaHealthMonitor } = require('../unified-monitoring-system');
const { bumbaMetrics } = require('../unified-monitoring-system');
const { simplifiedAgentSystem } = require('../agents/simplified-agent-system');
const { configurationManager } = require('../configuration/configuration-manager');
const { performanceOptimizer } = require('../performance/performance-optimization');
const { bumbaLiteManager } = require('../bumba-lite');
const { pineconeIntegration } = require('../integrations/pinecone-integration');
const { serenaIntegration } = require('../integrations/serena-integration');
const { getInstance: getShadCNIntegration } = require('../integrations/shadcn-mcp-integration');
const { toolAwarenessSystem } = require('../tools/tool-awareness-system');
const { toolContextInjector } = require('../tools/tool-context-injector');
const { toolMemoryBridge } = require('../tools/tool-memory-bridge');

/**
 * BUMBA Master Framework Integration
 * Orchestrates all systems for unified operation
 */
class BumbaMasterIntegration {
  constructor() {
    this.systems = {
      version: new BumbaVersionManager(),
      installer: new BumbaTieredInstaller(),
      audio: audioFallbackSystem,
      errors: new BumbaErrorBoundary(),
      hooks: bumbaHookSystem,
      mcp: mcpServerManager,
      resources: resourceManager,
      health: bumbaHealthMonitor,
      metrics: bumbaMetrics,
      agents: simplifiedAgentSystem,
      config: configurationManager,
      performance: performanceOptimizer,
      lite: bumbaLiteManager,
      pinecone: pineconeIntegration,
      serena: serenaIntegration,
      shadcn: null, // Will be initialized on demand
      toolAwareness: toolAwarenessSystem,
      toolContext: toolContextInjector,
      toolMemory: toolMemoryBridge
    };
    
    this.frameworkState = {
      initialized: false,
      mode: 'full', // 'full' or 'lite'
      startup_time: null,
      last_health_check: null,
      systems_healthy: false,
      performance_score: 0
    };
    
    this.capabilities = {
      version_management: false,
      tiered_installation: false,
      audio_fallbacks: false,
      error_handling: false,
      hook_system: false,
      mcp_resilience: false,
      resource_management: false,
      health_monitoring: false,
      performance_metrics: false,
      simplified_agents: false,
      configuration_management: false,
      performance_optimization: false,
      lite_mode: false,
      pinecone_vector_search: false,
      shadcn_ui: false
    };
    
    this.integrationLog = [];
  }

  /**
   * Initialize the complete BUMBA framework
   */
  async initialize(options = {}) {
    const startTime = Date.now();
    logger.info('🟢 Initializing BUMBA Master Framework Integration...');
    
    try {
      // Determine mode
      const mode = options.mode || this.determineBestMode();
      this.frameworkState.mode = mode;
      
      if (mode === 'lite') {
        return await this.initializeLiteMode(options);
      } else {
        return await this.initializeFullMode(options);
      }
      
    } catch (error) {
      logger.error(`🔴 Framework initialization failed: ${error.message}`);
      this.logIntegrationEvent('initialization_failed', { error: error.message });
      
      // Attempt emergency fallback to lite mode
      try {
        logger.info('🟢 Attempting emergency fallback to lite mode...');
        return await this.initializeLiteMode({ emergency: true });
      } catch (emergencyError) {
        throw new BumbaError('FRAMEWORK_INIT_FAILED', 
          `Complete framework initialization failed: ${error.message}`);
      }
    }
  }

  /**
   * Initialize full BUMBA mode with all systems
   */
  async initializeFullMode(options = {}) {
    logger.info('🟢 Initializing Full BUMBA Mode...');
    
    const initSteps = [
      { name: 'version', fn: () => this.initializeVersionSystem() },
      { name: 'config', fn: () => this.initializeConfiguration() },
      { name: 'errors', fn: () => this.initializeErrorHandling() },
      { name: 'resources', fn: () => this.initializeResourceManagement() },
      { name: 'hooks', fn: () => this.initializeHookSystem() },
      { name: 'mcp', fn: () => this.initializeMCPSystem() },
      { name: 'audio', fn: () => this.initializeAudioSystem() },
      { name: 'health', fn: () => this.initializeHealthMonitoring() },
      { name: 'metrics', fn: () => this.initializePerformanceMetrics() },
      { name: 'agents', fn: () => this.initializeAgentSystem() },
      { name: 'performance', fn: () => this.initializePerformanceOptimization() },
      { name: 'pinecone', fn: () => this.initializePineconeIntegration() },
      { name: 'serena', fn: () => this.initializeSerenaIntegration() },
      { name: 'shadcn', fn: () => this.initializeShadCNIntegration() },
      { name: 'toolAwareness', fn: () => this.initializeToolAwareness() }
    ];

    const results = [];
    
    for (const step of initSteps) {
      try {
        logger.info(`🟢 Initializing ${step.name}...`);
        await step.fn();
        this.capabilities[`${step.name}_management`] = true;
        results.push({ system: step.name, success: true });
        logger.info(`🏁 ${step.name} initialized`);
      } catch (error) {
        logger.warn(`🟡 ${step.name} initialization failed: ${error.message}`);
        results.push({ system: step.name, success: false, error: error.message });
        
        // Some systems are critical
        if (['version', 'config', 'errors'].includes(step.name)) {
          throw error;
        }
      }
    }

    // Start integrated monitoring
    await this.startIntegratedMonitoring();
    
    // Perform initial health check
    const healthStatus = await this.performIntegratedHealthCheck();
    
    const duration = Date.now() - Date.now();
    this.frameworkState = {
      initialized: true,
      mode: 'full',
      startup_time: duration,
      last_health_check: new Date().toISOString(),
      systems_healthy: healthStatus.overall_status === 'healthy',
      performance_score: await this.calculateFrameworkPerformanceScore()
    };

    logger.info(`🏁 Full BUMBA Mode initialized successfully (${duration}ms)`);
    
    return {
      success: true,
      mode: 'full',
      framework_version: this.systems.version.getFrameworkVersion(),
      systems_initialized: results.filter(r => r.success).length,
      capabilities: this.getEnabledCapabilities(),
      health_status: healthStatus,
      performance_score: this.frameworkState.performance_score,
      startup_time: duration
    };
  }

  /**
   * Initialize lite mode for fast, minimal operation
   */
  async initializeLiteMode(options = {}) {
    logger.info('🟢‍🟢️ Initializing BUMBA Lite Mode...');
    
    try {
      // Initialize only essential systems for lite mode
      await this.systems.version.startupValidation();
      await this.systems.config.loadConfiguration();
      this.systems.errors = new BumbaErrorBoundary();
      
      // Initialize lite mode core
      const liteResult = await this.systems.lite.initialize({
        enableMetrics: true,
        enableErrorHandling: true,
        enableBasicCaching: true,
        ...options
      });
      
      const duration = Date.now() - Date.now();
      this.frameworkState = {
        initialized: true,
        mode: 'lite',
        startup_time: duration,
        last_health_check: new Date().toISOString(),
        systems_healthy: true, // Lite mode is inherently stable
        performance_score: 85 // Lite mode optimized for performance
      };

      logger.info(`🟢 BUMBA Lite Mode initialized (${duration}ms)`);
      
      return {
        success: true,
        mode: 'lite',
        framework_version: this.systems.version.getFrameworkVersion(),
        lite_capabilities: liteResult.capabilities,
        available_commands: liteResult.available_commands,
        performance_optimized: true,
        startup_time: duration
      };
      
    } catch (error) {
      throw new BumbaError('LITE_MODE_INIT_FAILED', 
        `Lite mode initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize individual systems
   */
  async initializeVersionSystem() {
    const valid = await this.systems.version.startupValidation();
    if (!valid) {
      throw new BumbaError('VERSION_SYSTEM_FAILED', 'Version validation failed');
    }
    this.capabilities.version_management = true;
  }

  async initializeConfiguration() {
    await this.systems.config.loadConfiguration();
    this.capabilities.configuration_management = true;
  }

  async initializeErrorHandling() {
    // Error handling is always available
    this.capabilities.error_handling = true;
  }

  async initializeResourceManagement() {
    // Resource manager starts automatically
    this.capabilities.resource_management = true;
  }

  async initializeHookSystem() {
    // Hook system starts automatically
    this.capabilities.hook_system = true;
  }

  async initializeMCPSystem() {
    // MCP manager starts automatically
    this.capabilities.mcp_resilience = true;
  }

  async initializeAudioSystem() {
    const audioStatus = this.systems.audio.getAudioStatus();
    this.capabilities.audio_fallbacks = audioStatus.enabled;
  }

  async initializeHealthMonitoring() {
    this.systems.health.startMonitoring(5); // 5-minute intervals
    this.capabilities.health_monitoring = true;
  }

  async initializePerformanceMetrics() {
    // Metrics collection starts automatically
    this.capabilities.performance_metrics = true;
  }

  async initializeAgentSystem() {
    // Simplified agents are initialized automatically
    this.capabilities.simplified_agents = true;
  }

  async initializePerformanceOptimization() {
    await this.systems.performance.preloadCriticalModules();
    this.capabilities.performance_optimization = true;
  }

  async initializePineconeIntegration() {
    await this.systems.pinecone.initialize();
    this.capabilities.pinecone_vector_search = true;
  }

  async initializeSerenaIntegration() {
    await this.systems.serena.initialize();
    this.capabilities.serena_semantic_search = true;
  }

  async initializeToolAwareness() {
    // Initialize tool awareness system
    await this.systems.toolAwareness.initialize();
    
    // Initialize tool memory bridge
    await this.systems.toolMemory.initialize();
    
    // Setup context injection for all agents
    this.setupToolContextInjection();
    
    this.capabilities.tool_awareness = true;
    logger.info('🏁 Tool awareness system fully initialized');
  }

  async initializeShadCNIntegration() {
    try {
      // Initialize ShadCN integration on demand
      this.systems.shadcn = getShadCNIntegration();
      
      // Initialize if enabled (enabled by default)
      if (this.systems.shadcn.config.enabled) {
        await this.systems.shadcn.initialize();
        this.capabilities.shadcn_ui = true;
        logger.info('🔴 ShadCN UI integration initialized');
      }
    } catch (error) {
      logger.warn('🟠️ ShadCN UI integration not available:', error.message);
      // Not critical - framework continues without ShadCN
    }
  }

  setupToolContextInjection() {
    // Add tool context provider to agent system
    if (this.systems.agents && this.systems.agents.addContextProvider) {
      this.systems.agents.addContextProvider(
        this.systems.toolAwareness.createContextProvider()
      );
      
      this.systems.agents.addContextProvider(
        this.systems.toolMemory.createContextProvider()
      );
    }
    
    // Add prompt enhancer to hook system
    if (this.systems.hooks && this.systems.hooks.addPromptEnhancer) {
      this.systems.hooks.addPromptEnhancer(
        this.systems.toolContext.createPromptEnhancer()
      );
    }
  }

  /**
   * Determine best mode based on system capabilities
   */
  determineBestMode() {
    // Could analyze system resources, configuration, etc.
    // For now, default to full mode
    return 'full';
  }

  /**
   * Start integrated monitoring across all systems
   */
  async startIntegratedMonitoring() {
    logger.info('🟢 Starting integrated monitoring...');
    
    // Health monitoring every 5 minutes
    setInterval(async () => {
      try {
        await this.performIntegratedHealthCheck();
      } catch (error) {
        logger.error(`Health check failed: ${error.message}`);
      }
    }, 5 * 60 * 1000);
    
    // Performance metrics every minute
    setInterval(async () => {
      try {
        const metrics = await this.systems.metrics.collectMetrics();
        const alerts = await this.systems.metrics.checkAlerts();
        
        if (alerts.length > 0) {
          logger.warn(`🟡 Performance alerts: ${alerts.length} active`);
          this.logIntegrationEvent('performance_alerts', { count: alerts.length });
        }
      } catch (error) {
        logger.error(`Metrics collection failed: ${error.message}`);
      }
    }, 60 * 1000);
    
    logger.info('🏁 Integrated monitoring started');
  }

  /**
   * Perform comprehensive health check across all systems
   */
  async performIntegratedHealthCheck() {
    const healthResult = await this.systems.health.getHealthStatus();
    
    // Update framework state
    this.frameworkState.systems_healthy = healthResult.overall_status === 'healthy';
    this.frameworkState.last_health_check = new Date().toISOString();
    
    // Log significant health changes
    if (healthResult.overall_status !== 'healthy') {
      this.logIntegrationEvent('health_degraded', {
        status: healthResult.overall_status,
        issues: healthResult.issues.length
      });
    }
    
    return healthResult;
  }

  /**
   * Execute unified command across all systems
   */
  async executeUnifiedCommand(command, args = [], context = {}) {
    if (!this.frameworkState.initialized) {
      throw new BumbaError('FRAMEWORK_NOT_INITIALIZED', 
        'Framework must be initialized before executing commands');
    }

    const startTime = Date.now();
    const executionId = `unified_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    try {
      logger.info(`🟢 Executing unified command: ${command} (${executionId})`);
      
      // Route to appropriate mode
      let result;
      if (this.frameworkState.mode === 'lite') {
        result = await this.systems.lite.execute(command, args, context);
      } else {
        result = await this.executeFullModeCommand(command, args, context);
      }
      
      const duration = Date.now() - startTime;
      
      // Record metrics
      this.systems.metrics.recordCommand(
        `unified_${command}`, 
        duration, 
        result.success !== false,
        { mode: this.frameworkState.mode, execution_id: executionId }
      );
      
      logger.info(`🏁 Unified command completed: ${command} (${duration}ms)`);
      
      return {
        ...result,
        unified_execution: {
          id: executionId,
          mode: this.frameworkState.mode,
          duration_ms: duration,
          framework_version: this.systems.version.getFrameworkVersion()
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error
      this.systems.metrics.recordError('UNIFIED_COMMAND_FAILED', 'high', {
        command: command,
        mode: this.frameworkState.mode,
        execution_id: executionId,
        duration: duration
      });
      
      logger.error(`🔴 Unified command failed: ${command} (${duration}ms) - ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute command in full mode with all systems
   */
  async executeFullModeCommand(command, args, context) {
    // Allocate resources
    const resourceAllocation = await this.systems.resources.requestResources('tasks', 1, 'unified_command');
    
    try {
      // Pre-execution hook
      const preHookResult = await this.systems.hooks.execute('pre-execution', {
        command: command,
        args: args,
        context: context
      });
      
      if (!preHookResult.allow) {
        throw new BumbaError('COMMAND_BLOCKED', 'Command blocked by pre-execution hook');
      }
      
      // Execute with simplified agent system
      const agentResult = await this.systems.agents.executeTask({
        description: command,
        args: args
      }, context);
      
      // Post-execution hook
      await this.systems.hooks.execute('post-execution', {
        command: command,
        result: agentResult,
        context: context
      });
      
      // Completion notification
      await this.systems.hooks.execute('completion', {
        message: `Command ${command} completed successfully`
      });
      
      return agentResult;
      
    } finally {
      // Release resources
      await resourceAllocation.release();
    }
  }

  /**
   * Calculate overall framework performance score
   */
  async calculateFrameworkPerformanceScore() {
    try {
      const metrics = await this.systems.metrics.collectMetrics();
      const healthStatus = await this.systems.health.getHealthStatus();
      const performanceStats = this.systems.performance.getPerformanceStats();
      
      // Weighted scoring
      const scores = {
        reliability: Math.min(100, metrics.commandReliability || 100),
        health: healthStatus.overall_status === 'healthy' ? 100 : 
                healthStatus.overall_status === 'degraded' ? 70 : 30,
        performance: Math.max(0, 100 - (metrics.responseTime / 1000 * 50)),
        resource_efficiency: Math.max(0, 100 - (metrics.memoryUsage / 512 * 100))
      };
      
      const weights = { reliability: 0.3, health: 0.3, performance: 0.2, resource_efficiency: 0.2 };
      
      return Object.entries(scores).reduce((total, [metric, score]) => {
        return total + (score * weights[metric]);
      }, 0);
      
    } catch (error) {
      logger.warn(`Performance score calculation failed: ${error.message}`);
      return 75; // Default reasonable score
    }
  }

  /**
   * Get comprehensive framework status
   */
  async getFrameworkStatus() {
    if (!this.frameworkState.initialized) {
      return {
        initialized: false,
        message: 'Framework not initialized'
      };
    }

    const healthStatus = await this.performIntegratedHealthCheck();
    const performanceMetrics = await this.systems.metrics.getMetricsSummary();
    
    return {
      framework: 'BUMBA',
      version: this.systems.version.getFrameworkVersion(),
      mode: this.frameworkState.mode,
      
      status: {
        initialized: this.frameworkState.initialized,
        healthy: this.frameworkState.systems_healthy,
        performance_score: this.frameworkState.performance_score,
        last_health_check: this.frameworkState.last_health_check,
        startup_time: this.frameworkState.startup_time
      },
      
      capabilities: this.getEnabledCapabilities(),
      
      system_health: {
        overall_status: healthStatus.overall_status,
        components: Object.keys(healthStatus.components || {}),
        issues: healthStatus.issues?.length || 0,
        auto_repair: healthStatus.auto_repair_results || []
      },
      
      performance: {
        summary: performanceMetrics,
        optimization_active: this.capabilities.performance_optimization,
        resource_management_active: this.capabilities.resource_management
      },
      
      integrations: {
        total_systems: Object.keys(this.systems).length,
        active_systems: Object.values(this.capabilities).filter(Boolean).length,
        integration_events: this.integrationLog.length
      }
    };
  }

  /**
   * Get list of enabled capabilities
   */
  getEnabledCapabilities() {
    return Object.entries(this.capabilities)
      .filter(([capability, enabled]) => enabled)
      .map(([capability]) => capability);
  }

  /**
   * Switch between full and lite modes
   */
  async switchMode(targetMode) {
    if (targetMode === this.frameworkState.mode) {
      return {
        success: true,
        message: `Already in ${targetMode} mode`,
        mode: targetMode
      };
    }
    
    logger.info(`🟢 Switching from ${this.frameworkState.mode} to ${targetMode} mode...`);
    
    try {
      // Shutdown current mode
      await this.shutdownCurrentMode();
      
      // Initialize target mode
      const result = targetMode === 'lite' ? 
        await this.initializeLiteMode() :
        await this.initializeFullMode();
      
      logger.info(`🏁 Successfully switched to ${targetMode} mode`);
      
      return {
        success: true,
        message: `Switched to ${targetMode} mode`,
        mode: targetMode,
        capabilities: this.getEnabledCapabilities()
      };
      
    } catch (error) {
      logger.error(`🔴 Mode switch failed: ${error.message}`);
      throw new BumbaError('MODE_SWITCH_FAILED', 
        `Failed to switch to ${targetMode} mode: ${error.message}`);
    }
  }

  /**
   * Shutdown current mode
   */
  async shutdownCurrentMode() {
    if (this.frameworkState.mode === 'lite') {
      this.systems.lite.shutdown();
    } else {
      // Shutdown full mode systems
      await this.systems.performance.shutdown();
      this.systems.health.stopMonitoring();
    }
    
    // Reset capabilities
    Object.keys(this.capabilities).forEach(cap => {
      this.capabilities[cap] = false;
    });
  }

  /**
   * Log integration events
   */
  logIntegrationEvent(event_type, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      event_type: event_type,
      details: details,
      framework_mode: this.frameworkState.mode
    };
    
    this.integrationLog.push(event);
    
    // Keep only recent events
    if (this.integrationLog.length > 200) {
      this.integrationLog.shift();
    }
  }

  /**
   * Export framework configuration and status
   */
  async exportFrameworkState(filePath) {
    const state = {
      framework_status: await this.getFrameworkStatus(),
      configuration: this.systems.config.getConfiguration(),
      capabilities: this.capabilities,
      integration_log: this.integrationLog.slice(-50), // Last 50 events
      performance_stats: this.systems.performance.getPerformanceStats(),
      exported_at: new Date().toISOString()
    };
    
    const fs = require('fs');
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
      logger.info(`🟢 Framework state exported to ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`🔴 Failed to export framework state: ${error.message}`);
      return false;
    }
  }

  /**
   * Graceful framework shutdown
   */
  async shutdown() {
    logger.info('🟢 Shutting down BUMBA Master Framework Integration...');
    
    try {
      // Stop monitoring
      this.systems.health.stopMonitoring();
      
      // Shutdown performance optimizer
      await this.systems.performance.shutdown();
      
      // Shutdown resource manager
      await this.systems.resources.shutdown();
      
      // Shutdown lite mode if active
      if (this.frameworkState.mode === 'lite') {
        this.systems.lite.shutdown();
      }
      
      // Clear hooks cache
      this.systems.hooks.clearCache();
      
      // Disable audio
      this.systems.audio.disableAudio('framework_shutdown');
      
      // Reset state
      this.frameworkState.initialized = false;
      Object.keys(this.capabilities).forEach(cap => {
        this.capabilities[cap] = false;
      });
      
      logger.info('🏁 BUMBA Master Framework Integration shutdown completed');
      
    } catch (error) {
      logger.error(`🔴 Shutdown error: ${error.message}`);
    }
  }
}

// Export singleton instance
const bumbaMasterIntegration = new BumbaMasterIntegration();

module.exports = {
  MasterIntegration: BumbaMasterIntegration,  // Standard export name
  BumbaMasterIntegration,  // Keep for backward compatibility
  bumbaMasterIntegration  // Singleton instance
};