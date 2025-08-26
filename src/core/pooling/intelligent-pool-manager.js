/**
 * BUMBA Intelligent Pool Manager
 * Context-aware specialist pooling with usage tracking and predictive warming
 * Maintains 10-20 specialists based on actual usage, not fixed ratios
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Configuration for intelligent pooling
 */
const DEFAULT_CONFIG = {
  minPoolSize: 3,
  maxPoolSize: 20,
  targetPoolSize: 12,
  corePoolSize: 5,
  contextPoolSize: 10,
  predictivePoolSize: 3,
  
  updateInterval: 30000,        // 30 seconds
  decayTime: 300000,            // 5 minutes
  coldStartThreshold: 100,      // ms
  memoryLimit: 100,             // MB
  
  enableUsageTracking: true,
  enableContextDetection: true,
  enablePrediction: true,
  enableTimePatterns: true
};

/**
 * Main Intelligent Pool Manager
 */
class IntelligentPoolManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Core components (will be initialized)
    this.usageTracker = null;
    this.contextAnalyzer = null;
    this.predictiveWarmer = null;
    this.smartCache = null;
    
    // Pool state
    this.warmPool = new Set();
    this.specialists = new Map();
    this.poolStats = {
      hits: 0,
      misses: 0,
      coldStarts: 0,
      evictions: 0,
      predictions: 0,
      correctPredictions: 0
    };
    
    // Current context
    this.currentContext = {
      phase: null,
      department: null,
      urgency: 'normal',
      recentTasks: []
    };
    
    // Memory tracking
    this.memoryUsage = 0;
    this.lastUpdate = Date.now();
    
    // Initialize components
    this.initialize();
  }
  
  /**
   * Initialize all components
   */
  initialize() {
    // Import components
    const { UsageTracker } = require('./usage-tracker');
    const { ContextAnalyzer } = require('./context-analyzer');
    const { PredictiveWarmer } = require('./predictive-warmer');
    const { SmartCache } = require('./smart-cache');
    
    // Initialize trackers
    if (this.config.enableUsageTracking) {
      this.usageTracker = new UsageTracker();
    }
    
    if (this.config.enableContextDetection) {
      this.contextAnalyzer = new ContextAnalyzer();
    }
    
    if (this.config.enablePrediction) {
      this.predictiveWarmer = new PredictiveWarmer();
    }
    
    // Initialize cache
    this.smartCache = new SmartCache(this.config.maxPoolSize);
    
    // Start update cycle
    this.startUpdateCycle();
    
    logger.info('🧠 Intelligent Pool Manager initialized');
    logger.info(`  Config: ${this.config.minPoolSize}-${this.config.maxPoolSize} specialists`);
    logger.info(`  Memory limit: ${this.config.memoryLimit}MB`);
  }
  
  /**
   * Get a specialist (main entry point)
   */
  async getSpecialist(type, context = {}) {
    const startTime = Date.now();
    
    try {
      // Update context if provided
      if (context) {
        this.updateContext(context);
      }
      
      // Check cache first
      const cached = this.smartCache.get(type);
      if (cached) {
        this.poolStats.hits++;
        this.emit('pool:hit', { type, source: 'cache' });
        return cached;
      }
      
      // Check warm pool
      if (this.warmPool.has(type)) {
        this.poolStats.hits++;
        const specialist = await this.activateFromPool(type);
        this.emit('pool:hit', { type, source: 'warm' });
        return specialist;
      }
      
      // Cold start - track for future warming
      this.poolStats.misses++;
      this.poolStats.coldStarts++;
      
      if (this.usageTracker) {
        this.usageTracker.trackUsage(type, context);
      }
      
      const specialist = await this.coldStart(type);
      const duration = Date.now() - startTime;
      
      this.emit('pool:miss', { type, duration });
      
      // Warm this specialist if cold start was slow
      if (duration > this.config.coldStartThreshold) {
        this.considerWarming(type);
      }
      
      return specialist;
      
    } catch (error) {
      logger.error(`Failed to get specialist ${type}:`, error);
      throw error;
    }
  }
  
  /**
   * Update current context
   */
  updateContext(context) {
    Object.assign(this.currentContext, context);
    
    if (context.task) {
      this.currentContext.recentTasks.push(context.task);
      // Keep only last 10 tasks
      if (this.currentContext.recentTasks.length > 10) {
        this.currentContext.recentTasks.shift();
      }
    }
    
    this.emit('context:updated', this.currentContext);
  }
  
  /**
   * Activate specialist from warm pool
   */
  async activateFromPool(type) {
    const specialist = this.specialists.get(type);
    
    if (!specialist) {
      // Not actually in pool, cold start
      return this.coldStart(type);
    }
    
    // Move to cache for faster access
    this.smartCache.set(type, specialist);
    
    // Track activation
    if (this.usageTracker) {
      this.usageTracker.trackActivation(type);
    }
    
    return specialist;
  }
  
  /**
   * Cold start a specialist
   */
  async coldStart(type) {
    logger.debug(`Cold starting specialist: ${type}`);
    
    // In real implementation, this would spawn actual specialist
    // For now, create a mock specialist
    const specialist = {
      type,
      id: `${type}-${Date.now()}`,
      state: 'active',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      memoryUsage: 5 // MB
    };
    
    // Add to cache
    this.smartCache.set(type, specialist);
    
    // Consider adding to warm pool
    this.considerWarming(type);
    
    return specialist;
  }
  
  /**
   * Consider warming a specialist
   */
  considerWarming(type) {
    // Don't warm if at max capacity
    if (this.warmPool.size >= this.config.maxPoolSize) {
      return;
    }
    
    // Don't warm if memory pressure
    if (this.memoryUsage > this.config.memoryLimit * 0.8) {
      return;
    }
    
    // Add to warming queue
    this.scheduleWarming(type);
  }
  
  /**
   * Schedule specialist for warming
   */
  scheduleWarming(type) {
    // Will be implemented with actual warming logic
    setTimeout(() => {
      if (!this.warmPool.has(type)) {
        this.warmSpecialist(type);
      }
    }, 1000);
  }
  
  /**
   * Warm a specialist
   */
  async warmSpecialist(type) {
    if (this.warmPool.has(type)) {
      return; // Already warm
    }
    
    logger.debug(`Warming specialist: ${type}`);
    
    // Create specialist in warm state
    const specialist = {
      type,
      id: `${type}-${Date.now()}`,
      state: 'warm',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      memoryUsage: 5 // MB
    };
    
    this.specialists.set(type, specialist);
    this.warmPool.add(type);
    this.memoryUsage += specialist.memoryUsage;
    
    this.emit('specialist:warmed', { type });
  }
  
  /**
   * Cool down a specialist
   */
  async coolDownSpecialist(type) {
    if (!this.warmPool.has(type)) {
      return; // Not warm
    }
    
    logger.debug(`Cooling down specialist: ${type}`);
    
    const specialist = this.specialists.get(type);
    if (specialist) {
      this.memoryUsage -= specialist.memoryUsage;
      this.specialists.delete(type);
    }
    
    this.warmPool.delete(type);
    this.poolStats.evictions++;
    
    this.emit('specialist:cooled', { type });
  }
  
  /**
   * Start update cycle
   */
  startUpdateCycle() {
    setInterval(() => {
      this.updateWarmPool();
    }, this.config.updateInterval);
    
    // Initial update
    this.updateWarmPool();
  }
  
  /**
   * Update warm pool based on current context and usage
   */
  async updateWarmPool() {
    const startTime = Date.now();
    const candidates = new Set();
    
    // Get usage-based candidates
    if (this.usageTracker) {
      const topUsed = this.usageTracker.getTopSpecialists(this.config.corePoolSize);
      topUsed.forEach(s => candidates.add(s));
    }
    
    // Get context-based candidates
    if (this.contextAnalyzer && this.currentContext.phase) {
      const contextual = this.contextAnalyzer.getSpecialistsForPhase(this.currentContext.phase);
      contextual.slice(0, this.config.contextPoolSize).forEach(s => candidates.add(s));
    }
    
    // Get predicted candidates
    if (this.predictiveWarmer && this.currentContext.recentTasks.length > 0) {
      const lastTask = this.currentContext.recentTasks[this.currentContext.recentTasks.length - 1];
      const predicted = this.predictiveWarmer.predictNext(lastTask);
      predicted.slice(0, this.config.predictivePoolSize).forEach(s => candidates.add(s));
    }
    
    // Limit to max pool size
    const targetSpecialists = Array.from(candidates).slice(0, this.config.maxPoolSize);
    
    // Cool down specialists not in target
    for (const type of this.warmPool) {
      if (!targetSpecialists.includes(type)) {
        await this.coolDownSpecialist(type);
      }
    }
    
    // Warm up new specialists
    for (const type of targetSpecialists) {
      if (!this.warmPool.has(type)) {
        await this.warmSpecialist(type);
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.debug(`Pool updated in ${duration}ms: ${this.warmPool.size} warm specialists`);
    this.emit('pool:updated', {
      size: this.warmPool.size,
      specialists: Array.from(this.warmPool),
      duration
    });
  }
  
  /**
   * Get pool status
   */
  getStatus() {
    const hitRate = this.poolStats.hits + this.poolStats.misses > 0
      ? (this.poolStats.hits / (this.poolStats.hits + this.poolStats.misses) * 100).toFixed(1)
      : 0;
    
    const predictionAccuracy = this.poolStats.predictions > 0
      ? (this.poolStats.correctPredictions / this.poolStats.predictions * 100).toFixed(1)
      : 0;
    
    return {
      warmCount: this.warmPool.size,
      totalCount: 83, // Total specialists in system
      memoryMB: this.memoryUsage.toFixed(1),
      hitRate: `${hitRate}%`,
      coldStarts: this.poolStats.coldStarts,
      evictions: this.poolStats.evictions,
      predictionAccuracy: `${predictionAccuracy}%`,
      currentPhase: this.currentContext.phase,
      currentDepartment: this.currentContext.department,
      warmSpecialists: Array.from(this.warmPool),
      uptime: Date.now() - this.lastUpdate
    };
  }
  
  /**
   * Manual hint for better predictions
   */
  setContext(context) {
    this.updateContext(context);
    
    // Immediately update pool based on new context
    this.updateWarmPool();
  }
  
  /**
   * Shutdown pool manager
   */
  async shutdown() {
    logger.info('Shutting down Intelligent Pool Manager');
    
    // Cool down all specialists
    for (const type of this.warmPool) {
      await this.coolDownSpecialist(type);
    }
    
    // Clear cache
    if (this.smartCache) {
      this.smartCache.clear();
    }
    
    this.emit('shutdown');
  }
}

module.exports = { IntelligentPoolManager };