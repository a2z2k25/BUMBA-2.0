/**
 * Lifecycle Integration for Intelligent Pooling
 * Bridges the intelligent pooling system with AgentLifecycleManager
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { IntelligentPoolManager } = require('./intelligent-pool-manager');
const { PoolStateManager } = require('./pool-state-manager');
const AdaptivePoolManager = require('./adaptive-pool-manager');

class LifecycleIntegration extends EventEmitter {
  constructor(lifecycleManager, config = {}) {
    super();
    
    // Reference to existing lifecycle manager
    this.lifecycleManager = lifecycleManager;
    
    // Configuration
    this.config = {
      enabled: config.enabled !== false,
      replaceDefaultPooling: config.replaceDefaultPooling !== false,
      urgentBypass: config.urgentBypass !== false,
      urgentThreshold: config.urgentThreshold || 50, // ms
      
      // Pool configuration
      minPoolSize: config.minPoolSize || 3,
      maxPoolSize: config.maxPoolSize || 20,
      targetPoolSize: config.targetPoolSize || 12,
      memoryLimit: config.memoryLimit || 100, // MB
      
      // Feature flags
      enableUsageTracking: config.enableUsageTracking !== false,
      enableContextDetection: config.enableContextDetection !== false,
      enablePrediction: config.enablePrediction !== false,
      enableTimePatterns: config.enableTimePatterns !== false,
      enableAdaptiveScaling: config.enableAdaptiveScaling !== false,
      
      // Integration options
      preserveExistingBehavior: config.preserveExistingBehavior || false,
      migrationMode: config.migrationMode || false,
      dualMode: config.dualMode || false
    };
    
    // Initialize intelligent pooling components
    this.intelligentPool = null;
    this.poolStateManager = null;
    this.adaptiveManager = null;
    
    // Integration state
    this.integrationActive = false;
    this.migrationInProgress = false;
    this.originalMethods = {};
    
    // Statistics
    this.statistics = {
      totalRequests: 0,
      pooledRequests: 0,
      bypassedRequests: 0,
      fallbackRequests: 0,
      migrationProgress: 0
    };
    
    // Initialize if enabled
    if (this.config.enabled) {
      this.initialize();
    }
    
    logger.info('🔗 Lifecycle integration initialized');
  }
  
  /**
   * Initialize the integration
   */
  async initialize() {
    try {
      // Create intelligent pool manager
      this.intelligentPool = new IntelligentPoolManager({
        minPoolSize: this.config.minPoolSize,
        maxPoolSize: this.config.maxPoolSize,
        targetPoolSize: this.config.targetPoolSize,
        memoryLimit: this.config.memoryLimit,
        
        enableUsageTracking: this.config.enableUsageTracking,
        enableContextDetection: this.config.enableContextDetection,
        enablePrediction: this.config.enablePrediction,
        enableTimePatterns: this.config.enableTimePatterns
      });
      
      // Create pool state manager
      this.poolStateManager = new PoolStateManager({
        maxWarmPool: this.config.maxPoolSize,
        maxColdPool: this.config.maxPoolSize * 2
      });
      
      // Create adaptive manager if enabled
      if (this.config.enableAdaptiveScaling) {
        this.adaptiveManager = new AdaptivePoolManager({
          minPoolSize: this.config.minPoolSize,
          maxPoolSize: this.config.maxPoolSize,
          targetPoolSize: this.config.targetPoolSize,
          memoryLimit: this.config.memoryLimit
        });
        
        // Connect adaptive manager to pool
        this.connectAdaptiveManager();
      }
      
      // Hook into lifecycle manager if requested
      if (this.config.replaceDefaultPooling) {
        this.hookIntoLifecycle();
      }
      
      // Start migration if in migration mode
      if (this.config.migrationMode) {
        this.startMigration();
      }
      
      this.integrationActive = true;
      
      logger.info('🏁 Intelligent pooling integration initialized');
      this.emit('integration:initialized');
      
    } catch (error) {
      logger.error('Failed to initialize pooling integration:', error);
      this.emit('integration:error', error);
      throw error;
    }
  }
  
  /**
   * Hook into lifecycle manager methods
   */
  hookIntoLifecycle() {
    // Store original methods
    this.originalMethods = {
      spawnSpecialist: this.lifecycleManager.spawnSpecialist?.bind(this.lifecycleManager),
      dissolveSpecialist: this.lifecycleManager.dissolveSpecialist?.bind(this.lifecycleManager),
      getSpecialist: this.lifecycleManager.getSpecialist?.bind(this.lifecycleManager)
    };
    
    // Override spawn method
    this.lifecycleManager.spawnSpecialist = async (type, config = {}) => {
      return this.spawnWithPooling(type, config);
    };
    
    // Override get method if exists
    if (this.lifecycleManager.getSpecialist) {
      this.lifecycleManager.getSpecialist = async (type, context = {}) => {
        return this.getWithPooling(type, context);
      };
    }
    
    // Override dissolve method
    this.lifecycleManager.dissolveSpecialist = async (id) => {
      return this.dissolveWithPooling(id);
    };
    
    logger.info('🔗 Hooked into lifecycle manager methods');
  }
  
  /**
   * Spawn specialist with intelligent pooling
   */
  async spawnWithPooling(type, config = {}) {
    this.statistics.totalRequests++;
    
    // Check urgency bypass
    if (this.config.urgentBypass && config.urgent) {
      logger.debug(`Bypassing pool for urgent ${type}`);
      this.statistics.bypassedRequests++;
      
      if (this.originalMethods.spawnSpecialist) {
        return this.originalMethods.spawnSpecialist(type, config);
      }
      
      // Fallback to direct spawn
      return this.directSpawn(type, config);
    }
    
    try {
      // Get from intelligent pool
      const context = this.extractContext(config);
      const specialist = await this.intelligentPool.getSpecialist(type, context);
      
      if (specialist) {
        this.statistics.pooledRequests++;
        
        // Track in lifecycle manager if needed
        if (this.lifecycleManager.activeAgents) {
          this.lifecycleManager.activeAgents.set(specialist.id, {
            type,
            specialist,
            pooled: true,
            createdAt: Date.now()
          });
        }
        
        this.emit('specialist:spawned', { type, pooled: true });
        return specialist;
      }
      
    } catch (error) {
      logger.error(`Pool spawn failed for ${type}:`, error);
      this.statistics.fallbackRequests++;
      
      // Fallback to original method
      if (this.config.preserveExistingBehavior && this.originalMethods.spawnSpecialist) {
        return this.originalMethods.spawnSpecialist(type, config);
      }
      
      throw error;
    }
  }
  
  /**
   * Get specialist with intelligent pooling
   */
  async getWithPooling(type, context = {}) {
    this.statistics.totalRequests++;
    
    // Track request timing
    const startTime = Date.now();
    
    try {
      // Enhance context with additional signals
      const enhancedContext = {
        ...context,
        ...this.extractEnvironmentContext()
      };
      
      // Get from pool
      const specialist = await this.intelligentPool.getSpecialist(type, enhancedContext);
      
      const duration = Date.now() - startTime;
      
      // Track performance for adaptive scaling
      if (this.adaptiveManager) {
        if (specialist) {
          this.adaptiveManager.trackActivation(type, duration);
        } else {
          this.adaptiveManager.trackColdStart(type, duration);
        }
      }
      
      // Update pool state
      if (this.poolStateManager && specialist) {
        await this.poolStateManager.activateSpecialist(type);
      }
      
      return specialist;
      
    } catch (error) {
      logger.error(`Get specialist failed for ${type}:`, error);
      
      // Fallback if configured
      if (this.originalMethods.getSpecialist) {
        return this.originalMethods.getSpecialist(type, context);
      }
      
      throw error;
    }
  }
  
  /**
   * Dissolve specialist with pool awareness
   */
  async dissolveWithPooling(id) {
    try {
      // Find specialist in lifecycle manager
      const agent = this.lifecycleManager.activeAgents?.get(id);
      
      if (agent && agent.pooled) {
        // Return to pool instead of dissolving
        const type = agent.type;
        
        if (this.poolStateManager) {
          await this.poolStateManager.deactivateSpecialist(type);
        }
        
        this.lifecycleManager.activeAgents.delete(id);
        
        logger.debug(`Returned ${type} to pool instead of dissolving`);
        this.emit('specialist:returned', { type, id });
        
        return true;
      }
      
      // Use original dissolve for non-pooled
      if (this.originalMethods.dissolveSpecialist) {
        return this.originalMethods.dissolveSpecialist(id);
      }
      
      return false;
      
    } catch (error) {
      logger.error(`Dissolve failed for ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Direct spawn without pooling (bypass)
   */
  async directSpawn(type, config) {
    // Create a minimal specialist instance
    const specialist = {
      id: `${type}-${Date.now()}-direct`,
      type,
      state: 'active',
      pooled: false,
      config,
      createdAt: Date.now()
    };
    
    logger.debug(`Direct spawn (bypass): ${type}`);
    return specialist;
  }
  
  /**
   * Extract context from config
   */
  extractContext(config) {
    return {
      task: config.task || config.description || '',
      urgency: config.urgent ? 'high' : 'normal',
      department: config.department,
      phase: config.phase,
      recentTasks: config.recentTasks || [],
      files: config.files || [],
      commands: config.commands || []
    };
  }
  
  /**
   * Extract environment context
   */
  extractEnvironmentContext() {
    const now = new Date();
    
    return {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      timestamp: now.getTime()
    };
  }
  
  /**
   * Connect adaptive manager to pool events
   */
  connectAdaptiveManager() {
    if (!this.adaptiveManager || !this.intelligentPool) return;
    
    // Connect pool events to adaptive manager
    this.intelligentPool.on('pool:hit', (data) => {
      // Track successful warm hits
      this.adaptiveManager.updateUtilization(
        this.intelligentPool.warmPool.size,
        this.config.maxPoolSize
      );
    });
    
    this.intelligentPool.on('pool:miss', (data) => {
      // Track cold starts
      this.adaptiveManager.trackColdStart(data.type, data.duration);
    });
    
    // Connect adaptive decisions to pool
    this.adaptiveManager.on('scaling:complete', (data) => {
      this.intelligentPool.config.maxPoolSize = data.to;
      logger.info(`Pool size adjusted: ${data.from} → ${data.to}`);
    });
    
    logger.debug('Connected adaptive manager to pool');
  }
  
  /**
   * Start migration from old to new pooling
   */
  async startMigration() {
    if (this.migrationInProgress) {
      logger.warn('Migration already in progress');
      return;
    }
    
    this.migrationInProgress = true;
    logger.info('🔄 Starting pooling migration...');
    
    // Phase 1: Dual mode (10% traffic)
    this.config.dualMode = true;
    this.migrationPhase = 1;
    this.trafficPercentage = 10;
    
    // Gradually increase traffic over time
    this.migrationInterval = setInterval(() => {
      this.increaseMigrationTraffic();
    }, 60000); // Every minute
    
    this.emit('migration:started');
  }
  
  /**
   * Increase migration traffic percentage
   */
  increaseMigrationTraffic() {
    if (this.trafficPercentage >= 100) {
      this.completeMigration();
      return;
    }
    
    // Increase by 10% each step
    this.trafficPercentage = Math.min(this.trafficPercentage + 10, 100);
    this.statistics.migrationProgress = this.trafficPercentage;
    
    logger.info(`Migration progress: ${this.trafficPercentage}%`);
    
    // Check metrics and rollback if needed
    if (this.shouldRollback()) {
      this.rollbackMigration();
    }
  }
  
  /**
   * Check if should rollback migration
   */
  shouldRollback() {
    // Check error rates, performance, etc.
    const errorRate = this.statistics.fallbackRequests / this.statistics.totalRequests;
    
    if (errorRate > 0.1) { // 10% error rate
      logger.warn('High error rate detected during migration');
      return true;
    }
    
    return false;
  }
  
  /**
   * Complete migration
   */
  completeMigration() {
    clearInterval(this.migrationInterval);
    this.migrationInProgress = false;
    this.config.dualMode = false;
    this.config.replaceDefaultPooling = true;
    
    logger.info('🏁 Migration to intelligent pooling complete');
    this.emit('migration:complete');
  }
  
  /**
   * Rollback migration
   */
  rollbackMigration() {
    clearInterval(this.migrationInterval);
    this.migrationInProgress = false;
    this.config.dualMode = false;
    this.config.enabled = false;
    
    // Restore original methods
    if (this.originalMethods.spawnSpecialist) {
      this.lifecycleManager.spawnSpecialist = this.originalMethods.spawnSpecialist;
    }
    if (this.originalMethods.getSpecialist) {
      this.lifecycleManager.getSpecialist = this.originalMethods.getSpecialist;
    }
    if (this.originalMethods.dissolveSpecialist) {
      this.lifecycleManager.dissolveSpecialist = this.originalMethods.dissolveSpecialist;
    }
    
    logger.warn('🟠️ Migration rolled back');
    this.emit('migration:rollback');
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    const poolStatus = this.intelligentPool?.getStatus() || {};
    const stateStatus = this.poolStateManager?.getPoolStatus() || {};
    const adaptiveStatus = this.adaptiveManager?.getStatus() || {};
    
    return {
      enabled: this.config.enabled,
      active: this.integrationActive,
      migrationInProgress: this.migrationInProgress,
      migrationProgress: `${this.statistics.migrationProgress}%`,
      
      statistics: {
        ...this.statistics,
        hitRate: this.statistics.pooledRequests > 0
          ? `${(this.statistics.pooledRequests / this.statistics.totalRequests * 100).toFixed(1)}%`
          : '0%',
        bypassRate: this.statistics.bypassedRequests > 0
          ? `${(this.statistics.bypassedRequests / this.statistics.totalRequests * 100).toFixed(1)}%`
          : '0%'
      },
      
      pool: poolStatus,
      state: stateStatus,
      adaptive: adaptiveStatus,
      
      config: {
        poolSize: `${this.config.minPoolSize}-${this.config.maxPoolSize}`,
        memoryLimit: `${this.config.memoryLimit}MB`,
        features: {
          usageTracking: this.config.enableUsageTracking,
          contextDetection: this.config.enableContextDetection,
          prediction: this.config.enablePrediction,
          timePatterns: this.config.enableTimePatterns,
          adaptiveScaling: this.config.enableAdaptiveScaling
        }
      }
    };
  }
  
  /**
   * Enable/disable integration
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    
    if (enabled && !this.integrationActive) {
      this.initialize();
    } else if (!enabled && this.integrationActive) {
      this.shutdown();
    }
  }
  
  /**
   * Shutdown integration
   */
  async shutdown() {
    logger.info('Shutting down pooling integration...');
    
    // Stop migration if in progress
    if (this.migrationInProgress) {
      this.rollbackMigration();
    }
    
    // Restore original methods
    if (this.config.replaceDefaultPooling) {
      if (this.originalMethods.spawnSpecialist) {
        this.lifecycleManager.spawnSpecialist = this.originalMethods.spawnSpecialist;
      }
      if (this.originalMethods.getSpecialist) {
        this.lifecycleManager.getSpecialist = this.originalMethods.getSpecialist;
      }
      if (this.originalMethods.dissolveSpecialist) {
        this.lifecycleManager.dissolveSpecialist = this.originalMethods.dissolveSpecialist;
      }
    }
    
    // Shutdown components
    if (this.intelligentPool) {
      await this.intelligentPool.shutdown();
    }
    if (this.poolStateManager) {
      await this.poolStateManager.shutdown();
    }
    if (this.adaptiveManager) {
      this.adaptiveManager.stopMonitoring();
    }
    
    this.integrationActive = false;
    
    logger.info('Pooling integration shutdown complete');
    this.emit('integration:shutdown');
  }
}

module.exports = { LifecycleIntegration };