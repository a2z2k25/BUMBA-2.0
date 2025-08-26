/**
 * Intelligent Pooling System
 * Main integration point for all intelligent pooling components
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UsageTracker } = require('./usage-tracker');
const { ContextAnalyzer } = require('./context-analyzer');
const { IntelligentPoolManager } = require('./intelligent-pool-manager');
const { AdaptivePoolManager } = require('./adaptive-pool-manager');
const { PredictiveWarmer } = require('./predictive-warmer');
const { TimePatternAnalyzer } = require('./time-pattern-analyzer');
const { PhaseMapper } = require('./phase-mapper');
const { MemoryManager } = require('./memory-manager');
const { SmartCache } = require('./smart-cache');
const { PoolStateManager } = require('./pool-state-manager');
const { DepartmentDetector } = require('./department-detector');
const { LifecycleIntegration } = require('./lifecycle-integration');
const { MetricsDashboard } = require('./metrics-dashboard');
const { PoolingConfig } = require('./pooling-config');

/**
 * Main Intelligent Pooling System
 */
class IntelligentPoolingSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Initialize configuration
    this.config = new PoolingConfig(config);
    
    // Core components
    this.pool = new Map(); // specialist-id -> specialist
    this.usageTracker = new UsageTracker();
    this.contextAnalyzer = new ContextAnalyzer();
    this.poolManager = new IntelligentPoolManager(this.config);
    this.adaptiveManager = new AdaptivePoolManager(this.config);
    this.warmer = new PredictiveWarmer();
    this.patternAnalyzer = new TimePatternAnalyzer();
    this.phaseMapper = new PhaseMapper();
    this.memoryManager = new MemoryManager();
    this.cache = new SmartCache(this.config);
    this.stateManager = new PoolStateManager();
    this.departmentDetector = new DepartmentDetector();
    this.lifecycleIntegration = new LifecycleIntegration();
    this.dashboard = new MetricsDashboard();
    
    // State
    this.initialized = false;
    this.activeSpecialists = new Set();
    this.warmSpecialists = new Set();
    this.hibernatingSpecialists = new Set();
    
    // Statistics
    this.statistics = {
      poolHits: 0,
      poolMisses: 0,
      getRequests: 0,
      releaseRequests: 0,
      optimizations: 0,
      resizes: 0
    };
    
    // Initialize system
    this.initialize();
  }
  
  /**
   * Initialize the pooling system
   */
  initialize() {
    // Set up component connections
    this.poolManager.on('pool:resized', (event) => {
      this.handlePoolResize(event);
    });
    
    this.warmer.on('warmup:needed', (specialists) => {
      this.warmUpSpecialists(specialists);
    });
    
    this.adaptiveManager.on('adapt:needed', (params) => {
      this.adaptPool(params);
    });
    
    // Start monitoring
    this.startMonitoring();
    
    this.initialized = true;
    logger.info('🟢 Intelligent Pooling System initialized');
  }
  
  /**
   * Add specialist to pool
   */
  async addSpecialist(specialist) {
    if (!specialist.id) {
      throw new Error('Specialist must have an id');
    }
    
    // Track addition
    this.usageTracker.trackUsage(specialist.id, specialist.department || 'GENERAL');
    
    // Detect department if not provided
    if (!specialist.department) {
      specialist.department = this.departmentDetector.detectDepartment(specialist);
    }
    
    // Analyze context
    const context = this.contextAnalyzer.analyzeContext({
      specialist,
      currentLoad: this.pool.size,
      projectPhase: this.phaseMapper.getCurrentPhase()
    });
    
    // Determine initial state
    const initialState = this.determineInitialState(specialist, context);
    specialist.state = initialState;
    
    // Add to pool
    this.pool.set(specialist.id, specialist);
    
    // Update state tracking
    if (initialState === 'active') {
      this.activeSpecialists.add(specialist.id);
    } else if (initialState === 'warm') {
      this.warmSpecialists.add(specialist.id);
    } else if (initialState === 'hibernating') {
      this.hibernatingSpecialists.add(specialist.id);
    }
    
    // Cache if applicable
    this.cache.set(specialist.id, specialist);
    
    // Update metrics
    this.dashboard.recordAddition(specialist);
    
    this.emit('specialist:added', specialist);
    
    return specialist;
  }
  
  /**
   * Get specialist from pool
   */
  async getSpecialist(id) {
    this.statistics.getRequests++;
    
    // Check cache first
    const cached = this.cache.get(id);
    if (cached) {
      this.statistics.poolHits++;
      this.usageTracker.trackUsage(id);
      return cached;
    }
    
    // Get from pool
    const specialist = this.pool.get(id);
    if (!specialist) {
      this.statistics.poolMisses++;
      return null;
    }
    
    this.statistics.poolHits++;
    
    // Track usage
    this.usageTracker.trackUsage(id);
    
    // Update state if needed
    if (specialist.state === 'hibernating') {
      await this.activateSpecialist(id);
    } else if (specialist.state === 'warm') {
      specialist.state = 'active';
      this.warmSpecialists.delete(id);
      this.activeSpecialists.add(id);
    }
    
    // Update cache
    this.cache.set(id, specialist);
    
    return specialist;
  }
  
  /**
   * Release specialist back to pool
   */
  async releaseSpecialist(id) {
    this.statistics.releaseRequests++;
    
    const specialist = this.pool.get(id);
    if (!specialist) {
      return false;
    }
    
    // Determine new state based on usage
    const usage = this.usageTracker.getScore(id);
    const shouldStayWarm = usage > this.config.warmThreshold;
    
    if (shouldStayWarm) {
      specialist.state = 'warm';
      this.activeSpecialists.delete(id);
      this.warmSpecialists.add(id);
    } else {
      specialist.state = 'cold';
      this.activeSpecialists.delete(id);
      this.warmSpecialists.delete(id);
    }
    
    // Update metrics
    this.dashboard.recordRelease(specialist);
    
    this.emit('specialist:released', specialist);
    
    return true;
  }
  
  /**
   * Activate hibernating specialist
   */
  async activateSpecialist(id) {
    const specialist = this.pool.get(id);
    if (!specialist) return false;
    
    if (specialist.state === 'hibernating') {
      // Simulate activation time
      await this.delay(100);
      
      specialist.state = 'active';
      this.hibernatingSpecialists.delete(id);
      this.activeSpecialists.add(id);
      
      this.emit('specialist:activated', specialist);
    }
    
    return true;
  }
  
  /**
   * Optimize pool based on usage patterns
   */
  async optimizePool() {
    this.statistics.optimizations++;
    
    // Get usage scores
    const scores = this.usageTracker.getScores();
    
    // Analyze patterns
    const patterns = this.patternAnalyzer.analyzePatterns(scores);
    
    // Get recommendations
    const recommendations = this.poolManager.getPoolingRecommendations({
      scores,
      patterns,
      currentSize: this.pool.size,
      memoryUsage: this.memoryManager.getCurrentUsage()
    });
    
    // Apply recommendations
    for (const rec of recommendations) {
      if (rec.action === 'warm') {
        await this.warmUpSpecialist(rec.specialist);
      } else if (rec.action === 'hibernate') {
        await this.hibernateSpecialist(rec.specialist);
      } else if (rec.action === 'remove') {
        this.removeSpecialist(rec.specialist);
      }
    }
    
    // Update dashboard
    this.dashboard.recordOptimization({
      recommendations: recommendations.length,
      poolSize: this.pool.size,
      activeCount: this.activeSpecialists.size,
      warmCount: this.warmSpecialists.size
    });
    
    this.emit('pool:optimized', recommendations);
    
    return recommendations;
  }
  
  /**
   * Warm up specialist
   */
  async warmUpSpecialist(id) {
    const specialist = this.pool.get(id);
    if (!specialist) return false;
    
    if (specialist.state === 'cold' || specialist.state === 'hibernating') {
      specialist.state = 'warm';
      this.hibernatingSpecialists.delete(id);
      this.warmSpecialists.add(id);
      
      this.emit('specialist:warmed', specialist);
    }
    
    return true;
  }
  
  /**
   * Warm up multiple specialists
   */
  async warmUpSpecialists(ids) {
    const promises = ids.map(id => this.warmUpSpecialist(id));
    return await Promise.all(promises);
  }
  
  /**
   * Hibernate specialist
   */
  async hibernateSpecialist(id) {
    const specialist = this.pool.get(id);
    if (!specialist) return false;
    
    specialist.state = 'hibernating';
    this.activeSpecialists.delete(id);
    this.warmSpecialists.delete(id);
    this.hibernatingSpecialists.add(id);
    
    // Clear from cache
    this.cache.delete(id);
    
    this.emit('specialist:hibernated', specialist);
    
    return true;
  }
  
  /**
   * Remove specialist from pool
   */
  removeSpecialist(id) {
    const specialist = this.pool.get(id);
    if (!specialist) return false;
    
    this.pool.delete(id);
    this.activeSpecialists.delete(id);
    this.warmSpecialists.delete(id);
    this.hibernatingSpecialists.delete(id);
    this.cache.delete(id);
    
    this.emit('specialist:removed', specialist);
    
    return true;
  }
  
  /**
   * Get active specialists
   */
  getActiveSpecialists() {
    return Array.from(this.activeSpecialists).map(id => this.pool.get(id)).filter(Boolean);
  }
  
  /**
   * Get warm specialists
   */
  getWarmSpecialists() {
    return Array.from(this.warmSpecialists).map(id => this.pool.get(id)).filter(Boolean);
  }
  
  /**
   * Determine initial state for specialist
   */
  determineInitialState(specialist, context) {
    // High priority specialists start active
    if (context.priority > 0.8) {
      return 'active';
    }
    
    // Frequently used types start warm
    const usage = this.usageTracker.getDepartmentUsage(specialist.department);
    if (usage > this.config.warmThreshold) {
      return 'warm';
    }
    
    // Default to cold
    return 'cold';
  }
  
  /**
   * Handle pool resize
   */
  handlePoolResize(event) {
    this.statistics.resizes++;
    logger.info(`Pool resized: ${event.oldSize} -> ${event.newSize}`);
  }
  
  /**
   * Adapt pool based on parameters
   */
  async adaptPool(params) {
    const adapted = await this.adaptiveManager.adaptPool({
      currentPool: Array.from(this.pool.values()),
      ...params
    });
    
    if (adapted.changes > 0) {
      this.emit('pool:adapted', adapted);
    }
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      // Update metrics
      this.dashboard.updateMetrics({
        poolSize: this.pool.size,
        activeCount: this.activeSpecialists.size,
        warmCount: this.warmSpecialists.size,
        hibernatingCount: this.hibernatingSpecialists.size,
        cacheHitRate: this.statistics.poolHits / (this.statistics.getRequests || 1),
        memoryUsage: this.memoryManager.getCurrentUsage()
      });
      
      // Check if optimization needed
      if (this.shouldOptimize()) {
        this.optimizePool();
      }
    }, this.config.monitoringInterval || 30000);
  }
  
  /**
   * Check if optimization is needed
   */
  shouldOptimize() {
    const memoryPressure = this.memoryManager.isUnderPressure();
    const poolEfficiency = this.statistics.poolHits / (this.statistics.getRequests || 1);
    
    return memoryPressure || poolEfficiency < 0.7 || this.pool.size > this.config.maxPoolSize;
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalCount: this.pool.size,
      activeCount: this.activeSpecialists.size,
      warmCount: this.warmSpecialists.size,
      hibernatingCount: this.hibernatingSpecialists.size,
      statistics: this.statistics,
      cacheStats: this.cache.getStatus(),
      memoryUsage: this.memoryManager.getCurrentUsage(),
      dashboard: this.dashboard.getSnapshot()
    };
  }
  
  /**
   * Utility delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Shutdown system
   */
  async shutdown() {
    logger.info('Shutting down Intelligent Pooling System...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Clear pool
    this.pool.clear();
    this.activeSpecialists.clear();
    this.warmSpecialists.clear();
    this.hibernatingSpecialists.clear();
    
    // Clear cache
    this.cache.clear();
    
    // Shutdown components
    this.usageTracker.reset();
    this.dashboard.shutdown();
    
    this.removeAllListeners();
    
    logger.info('Intelligent Pooling System shutdown complete');
  }
}

module.exports = { IntelligentPoolingSystem };