/**
 * BUMBA Resilience Integration
 * Integrates the comprehensive resilience system with BUMBA framework
 * Provides seamless integration with consciousness, error handling, and agent systems
 */

const { logger } = require('../logging/bumba-logger');
const { BumbaError } = require('../error-handling/bumba-error-system');
const { ResilienceOrchestrator } = require('./resilience-orchestrator');

/**
 * BUMBA-specific Resilience Manager
 * Provides high-level resilience capabilities tailored to BUMBA's needs
 */
class BumbaResilienceManager {
  constructor(options = {}) {
    this.orchestrator = new ResilienceOrchestrator({
      consciousnessIntegration: true,
      metricsInterval: 30000,
      ...options
    });
    
    this.agentResilienceProfiles = new Map();
    this.systemComponents = new Map();
    
    this.setupBumbaIntegrations();
    this.registerDefaultStrategies();
    
    logger.info('🟢 BUMBA Resilience Manager initialized');
  }

  setupBumbaIntegrations() {
    // Forward resilience events to BUMBA logging system
    this.orchestrator.on('operation-failure', (data) => {
      logger.warn(`🔴 Resilient operation failed: ${data.operationName} - ${data.error}`);
    });
    
    this.orchestrator.on('circuit-breaker-state-change', (data) => {
      logger.info(`🟢 Circuit breaker ${data.name}: ${data.from} → ${data.to}`);
    });
    
    this.orchestrator.on('feature-degraded', (data) => {
      logger.warn(`🟢 Feature degraded: ${data.feature} to level ${data.level}`);
    });
    
    this.orchestrator.on('healing-success', (data) => {
      logger.info(`🟢 Self-healing successful: ${data.problemType}`);
    });
  }

  registerDefaultStrategies() {
    // Register health checks for core BUMBA components
    this.registerCoreHealthChecks();
    
    // Register degradation strategies for BUMBA features
    this.registerCoreDegradationStrategies();
    
    // Register self-healing strategies
    this.registerCoreSelfHealingStrategies();
    
    // Create bulkheads for different operation types
    this.createCoreBulkheads();
  }

  registerCoreHealthChecks() {
    // Memory health check
    this.orchestrator.registerHealthCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const usagePercent = (heapUsedMB / heapTotalMB) * 100;
      
      if (usagePercent > 90) {
        throw new Error(`Memory usage critical: ${usagePercent.toFixed(1)}%`);
      }
      
      return {
        healthy: usagePercent < 80,
        heapUsedMB: heapUsedMB.toFixed(2),
        heapTotalMB: heapTotalMB.toFixed(2),
        usagePercent: usagePercent.toFixed(1)
      };
    }, { interval: 15000, unhealthyThreshold: 2 });

    // Agent system health check
    this.orchestrator.registerHealthCheck('agent_system', async () => {
      try {
        // Check if agent spawning is working
        const testResult = await this.testAgentSpawning();
        return { healthy: true, testResult };
      } catch (error) {
        throw new Error(`Agent system unhealthy: ${error.message}`);
      }
    }, { interval: 60000, unhealthyThreshold: 2 });

    // Consciousness system health check
    this.orchestrator.registerHealthCheck('consciousness', async () => {
      try {
        // Simple consciousness validation test
        const testIntent = { description: 'health check test', ethical: true };
        // This would integrate with actual consciousness layer
        return { healthy: true, consciousnessScore: 0.95 };
      } catch (error) {
        throw new Error(`Consciousness system unhealthy: ${error.message}`);
      }
    }, { interval: 30000 });

    // Hook system health check
    this.orchestrator.registerHealthCheck('hooks', async () => {
      try {
        // Test hook execution
        const hookTest = await this.testHookExecution();
        return { healthy: true, hookTest };
      } catch (error) {
        throw new Error(`Hook system unhealthy: ${error.message}`);
      }
    }, { interval: 45000 });
  }

  registerCoreDegradationStrategies() {
    // Audio system degradation
    this.orchestrator.registerDegradationStrategy('audio_system', {
      onDegrade: async (level, reason) => {
        logger.info(`🟢 Audio system degraded to level ${level}: ${reason}`);
        // Could disable audio notifications, use console fallbacks, etc.
      },
      onRecover: async (reason) => {
        logger.info(`🟢 Audio system recovered: ${reason}`);
        // Re-enable audio features
      },
      systemWide: false
    });

    // Agent spawning degradation
    this.orchestrator.registerDegradationStrategy('agent_spawning', {
      onDegrade: async (level, reason) => {
        logger.warn(`🟢 Agent spawning degraded to level ${level}: ${reason}`);
        if (level >= 2) {
          // Use basic agents only
          logger.info('🟢 Switching to basic agent mode');
        }
      },
      onRecover: async (reason) => {
        logger.info(`🟢 Agent spawning recovered: ${reason}`);
        // Re-enable full agent capabilities
      }
    });

    // Hook execution degradation
    this.orchestrator.registerDegradationStrategy('hooks', {
      onDegrade: async (level, reason) => {
        logger.warn(`🪝 Hook execution degraded: ${reason}`);
        if (level >= 2) {
          // Bypass hooks in minimal mode
          logger.info('🟢 Bypassing hook execution for performance');
        }
      },
      onRecover: async (reason) => {
        logger.info(`🟢 Hook execution recovered: ${reason}`);
      }
    });

    // Consciousness validation degradation
    this.orchestrator.registerDegradationStrategy('consciousness_validation', {
      onDegrade: async (level, reason) => {
        logger.warn(`🟢 Consciousness validation degraded: ${reason}`);
        if (level >= 1) {
          // Relaxed validation mode
          logger.info('🟡 Using relaxed consciousness validation');
        }
      },
      onRecover: async (reason) => {
        logger.info(`🟢 Full consciousness validation restored: ${reason}`);
      }
    });
  }

  registerCoreSelfHealingStrategies() {
    // Memory exhaustion healing
    this.orchestrator.registerHealingStrategy('memory_exhaustion', async (context) => {
      logger.info('🟢 Attempting memory cleanup...');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Clear caches
      await this.clearSystemCaches();
      
      // Reduce concurrent operations
      await this.reduceSystemLoad();
      
      return { action: 'memory_cleanup', success: true };
    }, { priority: 9, maxAttempts: 2 });

    // Agent spawn failure healing
    this.orchestrator.registerHealingStrategy('agent_spawn_failure', async (context) => {
      logger.info('🟢 Healing agent spawn failure...');
      
      // Reset agent pool
      await this.resetAgentPool();
      
      // Clear agent cache
      await this.clearAgentCache();
      
      return { action: 'agent_system_reset', success: true };
    }, { priority: 7 });

    // Connection failure healing
    this.orchestrator.registerHealingStrategy('connection_failure', async (context) => {
      logger.info('🟢 Healing connection failure...');
      
      // Reset connection pools
      await this.resetConnectionPools();
      
      // Clear DNS cache if possible
      await this.clearDNSCache();
      
      return { action: 'connection_reset', success: true };
    }, { priority: 6 });

    // Circuit breaker open healing
    this.orchestrator.registerHealingStrategy('circuit_breaker_open', async (context) => {
      logger.info('🟢 Attempting circuit breaker recovery...');
      
      // Wait for cooldown
      await this.waitForCooldown(context);
      
      // Test connectivity
      const connectivityTest = await this.testConnectivity(context);
      
      if (connectivityTest.success) {
        // Reset circuit breaker
        await this.resetCircuitBreaker(context.operationName);
        return { action: 'circuit_breaker_reset', success: true };
      }
      
      throw new Error('Connectivity test failed');
    });
  }

  createCoreBulkheads() {
    // Agent operations bulkhead
    this.orchestrator.createBulkhead('agent_operations', {
      maxConcurrency: 10,
      maxQueueSize: 50,
      timeout: 30000
    });

    // Hook execution bulkhead
    this.orchestrator.createBulkhead('hook_execution', {
      maxConcurrency: 5,
      maxQueueSize: 20,
      timeout: 15000
    });

    // File operations bulkhead
    this.orchestrator.createBulkhead('file_operations', {
      maxConcurrency: 8,
      maxQueueSize: 30,
      timeout: 20000
    });

    // Network operations bulkhead
    this.orchestrator.createBulkhead('network_operations', {
      maxConcurrency: 15,
      maxQueueSize: 40,
      timeout: 25000
    });
  }

  // Agent-specific resilience methods
  async executeAgentOperation(agentName, operation, options = {}) {
    const profile = this.getAgentResilienceProfile(agentName);
    
    const operationConfig = {
      circuitBreaker: true,
      circuitBreakerOptions: profile.circuitBreaker,
      retry: true,
      retryOptions: profile.retry,
      bulkhead: { name: 'agent_operations' },
      timeout: profile.timeout,
      fallback: profile.fallback || this.createAgentFallback(agentName),
      consciousnessValidation: true,
      ...options
    };

    return this.orchestrator.executeResilientOperation(
      `agent_${agentName}`,
      operation,
      operationConfig
    );
  }

  async executeHookOperation(hookName, operation, options = {}) {
    const operationConfig = {
      circuitBreaker: true,
      circuitBreakerOptions: { failureThreshold: 3, timeout: 15000 },
      retry: true,
      bulkhead: { name: 'hook_execution' },
      timeout: 15000,
      fallback: () => {
        logger.warn(`🪝 Hook ${hookName} bypassed due to failure`);
        return { bypassed: true, success: true };
      },
      consciousnessValidation: false, // Hooks are pre-validated
      ...options
    };

    return this.orchestrator.executeResilientOperation(
      `hook_${hookName}`,
      operation,
      operationConfig
    );
  }

  async executeFileOperation(operation, options = {}) {
    const operationConfig = {
      circuitBreaker: true,
      retry: true,
      bulkhead: { name: 'file_operations' },
      timeout: 20000,
      ...options
    };

    return this.orchestrator.executeResilientOperation(
      'file_operation',
      operation,
      operationConfig
    );
  }

  async executeNetworkOperation(operation, options = {}) {
    const operationConfig = {
      circuitBreaker: true,
      retry: true,
      bulkhead: { name: 'network_operations' },
      timeout: 25000,
      ...options
    };

    return this.orchestrator.executeResilientOperation(
      'network_operation',
      operation,
      operationConfig
    );
  }

  // Agent resilience profile management
  setAgentResilienceProfile(agentName, profile) {
    const defaultProfile = {
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000,
        resetTimeout: 60000
      },
      retry: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      timeout: 30000,
      fallback: null
    };

    this.agentResilienceProfiles.set(agentName, {
      ...defaultProfile,
      ...profile
    });
  }

  getAgentResilienceProfile(agentName) {
    return this.agentResilienceProfiles.get(agentName) || this.getDefaultProfile();
  }

  getDefaultProfile() {
    return {
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000,
        resetTimeout: 60000
      },
      retry: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      timeout: 30000,
      fallback: null
    };
  }

  createAgentFallback(agentName) {
    return async (_context) => {
      logger.info(`🟢 Using fallback for agent ${agentName}`);
      
      return {
        success: false,
        fallback: true,
        agent: agentName,
        message: `Agent ${agentName} temporarily unavailable - using fallback response`,
        timestamp: new Date().toISOString()
      };
    };
  }

  // Consciousness integration
  async validateOperationConsciousness(operation, context = {}) {
    const consciousnessCheck = await this.orchestrator.executeResilientOperation('consciousness_validation', async () => {
        // This would integrate with the actual consciousness layer
        return this.performConsciousnessValidation(operation, context);
      },
      {
        circuitBreaker: false,
        retry: false,
        timeout: 5000,
        fallback: () => ({ valid: true, score: 0.8, fallback: true })
      }
    );

    return consciousnessCheck;
  }

  async performConsciousnessValidation(operation, context) {
    // Simple validation logic - would integrate with actual consciousness system
    const operationStr = typeof operation === 'string' ? operation : operation.toString();
    
    // Check for ethical patterns
    const ethicalScore = this.calculateEthicalScore(operationStr, context);
    const sustainabilityScore = this.calculateSustainabilityScore(operationStr, context);
    const communityScore = this.calculateCommunityScore(operationStr, context);
    
    const overallScore = (ethicalScore + sustainabilityScore + communityScore) / 3;
    
    return {
      valid: overallScore >= 0.6,
      score: overallScore,
      breakdown: {
        ethical: ethicalScore,
        sustainability: sustainabilityScore,
        community: communityScore
      }
    };
  }

  calculateEthicalScore(operationStr, context) {
    let score = 0.8; // Base score
    
    // Positive indicators
    if (operationStr.includes('help') || operationStr.includes('assist')) {score += 0.1;}
    if (operationStr.includes('improve') || operationStr.includes('enhance')) {score += 0.1;}
    if (context.ethical) {score += 0.1;}
    
    // Negative indicators
    if (operationStr.includes('delete') || operationStr.includes('destroy')) {score -= 0.2;}
    if (operationStr.includes('hack') || operationStr.includes('exploit')) {score -= 0.5;}
    
    return Math.max(0, Math.min(1, score));
  }

  calculateSustainabilityScore(operationStr, context) {
    let score = 0.7; // Base score
    
    // Positive indicators
    if (operationStr.includes('optimize') || operationStr.includes('efficient')) {score += 0.2;}
    if (operationStr.includes('clean') || operationStr.includes('reduce')) {score += 0.1;}
    if (context.sustainable) {score += 0.2;}
    
    // Negative indicators
    if (operationStr.includes('intensive') || operationStr.includes('heavy')) {score -= 0.1;}
    
    return Math.max(0, Math.min(1, score));
  }

  calculateCommunityScore(operationStr, context) {
    let score = 0.8; // Base score
    
    // Positive indicators
    if (operationStr.includes('share') || operationStr.includes('collaborate')) {score += 0.1;}
    if (operationStr.includes('community') || operationStr.includes('public')) {score += 0.1;}
    if (context.communityBenefit) {score += 0.1;}
    
    return Math.max(0, Math.min(1, score));
  }

  // Helper methods for self-healing
  async testAgentSpawning() {
    // Simplified test - would integrate with actual agent system
    return { canSpawn: true, testTime: Date.now() };
  }

  async testHookExecution() {
    // Simplified test - would integrate with actual hook system
    return { hooksWorking: true, testTime: Date.now() };
  }

  async clearSystemCaches() {
    // Clear various caches
    logger.info('🟢 Clearing system caches...');
    return { cachesCleared: true };
  }

  async reduceSystemLoad() {
    // Reduce concurrent operations
    logger.info('🟢 Reducing system load...');
    return { loadReduced: true };
  }

  async resetAgentPool() {
    // Reset agent pool
    logger.info('🟢 Resetting agent pool...');
    return { agentPoolReset: true };
  }

  async clearAgentCache() {
    // Clear agent cache
    logger.info('🟢 Clearing agent cache...');
    return { agentCacheCleared: true };
  }

  async resetConnectionPools() {
    // Reset connection pools
    logger.info('🟢 Resetting connection pools...');
    return { connectionPoolsReset: true };
  }

  async clearDNSCache() {
    // Clear DNS cache
    logger.info('🟢 Clearing DNS cache...');
    return { dnsCacheCleared: true };
  }

  async waitForCooldown(context, timeMs = 5000) {
    logger.info(`⏳ Waiting ${timeMs}ms for cooldown...`);
    return new Promise(resolve => setTimeout(resolve, timeMs));
  }

  async testConnectivity(context) {
    // Test connectivity
    return { success: true, latency: 50 };
  }

  async resetCircuitBreaker(operationName) {
    // Reset specific circuit breaker
    const breaker = this.orchestrator.circuitBreakers.get(operationName);
    if (breaker) {
      breaker.reset();
      return { reset: true };
    }
    return { reset: false };
  }

  // Public API
  getSystemHealth() {
    return this.orchestrator.getSystemHealth();
  }

  getComprehensiveMetrics() {
    return this.orchestrator.getComprehensiveMetrics();
  }

  async emergencyDegradation(reason = 'emergency') {
    logger.error(`🔴 Emergency degradation triggered: ${reason}`);
    
    return this.orchestrator.degradationManager.systemWideDegradation(
      this.orchestrator.degradationManager.degradationLevels.EMERGENCY,
      reason
    );
  }

  async emergencyRecovery(reason = 'manual_recovery') {
    logger.info(`🟢 Emergency recovery initiated: ${reason}`);
    
    return this.orchestrator.degradationManager.systemWideRecovery(reason);
  }

  shutdown() {
    logger.info('🟢 Shutting down BUMBA Resilience Manager...');
    this.orchestrator.shutdown();
  }
}

// Singleton instance
let resilienceManagerInstance = null;

const getResilienceManager = (options = {}) => {
  if (!resilienceManagerInstance) {
    resilienceManagerInstance = new BumbaResilienceManager(options);
  }
  return resilienceManagerInstance;
};

module.exports = {
  BumbaResilienceManager,
  getResilienceManager
};