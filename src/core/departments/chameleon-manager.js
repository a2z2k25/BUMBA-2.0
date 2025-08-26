/**
 * BUMBA Chameleon Manager
 * Revolutionary AI Management Through Dynamic Expertise Absorption
 * 
 * Managers that shapeshift their expertise to match whatever they're reviewing,
 * achieving something impossible with human organizations - true polymorphic expertise.
 */

const ModelAwareDepartmentManager = require('./model-aware-department-manager');
const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

// Mix in EventEmitter to ModelAwareDepartmentManager
class ChameleonManagerBase extends ModelAwareDepartmentManager {
  constructor(config) {
    super(config);
    EventEmitter.call(this);
  }
}
Object.assign(ChameleonManagerBase.prototype, EventEmitter.prototype);

class ChameleonManager extends ChameleonManagerBase {
  constructor(config) {
    super(config);
    
    // Core Chameleon systems
    this.currentExpertise = null;
    this.expertiseCache = new Map();
    this.validationEngine = null; // Will be initialized
    this.absorptionEngine = null; // Will be initialized
    
    // Performance tracking
    this.metrics = {
      validations: 0,
      expertiseSwitches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgValidationTime: 0,
      avgAbsorptionTime: 0,
      errorsDetected: 0,
      falsePositives: 0
    };
    
    // Configuration
    this.config = {
      ...config,
      cacheExpiry: config.cacheExpiry || 3600000, // 1 hour default
      validationDepth: config.validationDepth || 'L2', // Default to logic validation
      maxCacheSize: config.maxCacheSize || 50, // Max expertise profiles in cache
      enableMetrics: config.enableMetrics !== false,
      temperature: 0.3 // Lower temperature for validation consistency
    };
    
    // Initialize subsystems
    this.initializeChameleonSystems();
    
    logger.info(`🦎 ${this.name || 'Chameleon'} Manager initialized with polymorphic expertise capability`);
  }
  
  /**
   * Initialize Chameleon subsystems
   */
  initializeChameleonSystems() {
    // Import and initialize subsystems
    const ExpertiseAbsorptionEngine = require('../chameleon/expertise-absorption-engine');
    const ValidationFramework = require('../chameleon/validation-framework');
    const ExpertiseCache = require('../chameleon/expertise-cache');
    
    this.absorptionEngine = new ExpertiseAbsorptionEngine({
      manager: this,
      temperature: this.config.temperature
    });
    
    this.validationEngine = new ValidationFramework({
      defaultDepth: this.config.validationDepth
    });
    
    // Enhanced cache with TTL and size limits
    this.expertiseCache = new ExpertiseCache({
      maxSize: this.config.maxCacheSize,
      ttl: this.config.cacheExpiry
    });
    
    logger.info(`🔧 Chameleon subsystems initialized for ${this.name}`);
  }
  
  /**
   * Core Chameleon ability: Assume expertise of any specialist
   */
  async assumeExpertise(specialistType, context = {}) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = this.expertiseCache.get(specialistType);
      if (cached && !context.forceRefresh) {
        this.metrics.cacheHits++;
        logger.debug(`📚 Using cached expertise for ${specialistType}`);
        this.currentExpertise = cached;
        return cached;
      }
      
      this.metrics.cacheMisses++;
      logger.info(`🦎 ${this.name} absorbing ${specialistType} expertise...`);
      
      // Load expertise through absorption engine
      const expertise = await this.absorptionEngine.load(specialistType, {
        ...context,
        managerType: this.type,
        currentWorkload: this.specialists ? this.specialists.size : 0
      });
      
      // Cache the expertise
      this.expertiseCache.set(specialistType, expertise);
      
      // Update current expertise
      this.currentExpertise = expertise;
      this.metrics.expertiseSwitches++;
      
      // Track absorption time
      const absorptionTime = Date.now() - startTime;
      this.updateMetric('avgAbsorptionTime', absorptionTime);
      
      logger.info(`✅ ${this.name} successfully absorbed ${specialistType} expertise in ${absorptionTime}ms`);
      
      // Emit event for monitoring
      this.emit('expertise:absorbed', {
        manager: this.name,
        specialist: specialistType,
        absorptionTime,
        cacheStatus: 'miss'
      });
      
      return expertise;
      
    } catch (error) {
      logger.error(`❌ Failed to absorb ${specialistType} expertise:`, error);
      
      // Fallback to basic validation if absorption fails
      return this.getFallbackExpertise(specialistType);
    }
  }
  
  /**
   * Validate work using current expertise
   */
  async validateWork(work, specialist) {
    const startTime = Date.now();
    
    try {
      // Ensure we have the right expertise
      if (!this.currentExpertise || this.currentExpertise.type !== specialist.type) {
        await this.assumeExpertise(specialist.type, {
          workContext: work
        });
      }
      
      logger.info(`🔍 ${this.name} validating ${specialist.name}'s work with ${this.currentExpertise.type} expertise`);
      
      // Determine validation depth based on work criticality
      const depth = this.determineValidationDepth(work);
      
      // Perform validation
      const validationResult = await this.validationEngine.validate(
        work,
        this.currentExpertise,
        {
          depth,
          specialist: specialist.name,
          manager: this.name
        }
      );
      
      // Track metrics
      this.metrics.validations++;
      if (validationResult.errors && validationResult.errors.length > 0) {
        this.metrics.errorsDetected += validationResult.errors.length;
      }
      
      const validationTime = Date.now() - startTime;
      this.updateMetric('avgValidationTime', validationTime);
      
      // Log results
      if (validationResult.passed) {
        logger.info(`✅ Validation passed for ${specialist.name}'s work`);
      } else {
        logger.warn(`⚠️ Validation found issues in ${specialist.name}'s work:`, validationResult.errors);
      }
      
      // Emit validation event
      this.emit('validation:complete', {
        manager: this.name,
        specialist: specialist.name,
        result: validationResult,
        validationTime,
        depth
      });
      
      return validationResult;
      
    } catch (error) {
      logger.error(`❌ Validation failed for ${specialist.name}:`, error);
      
      // Return safe failure
      return {
        passed: false,
        errors: [`Validation system error: ${error.message}`],
        warnings: ['Validation could not be completed, proceeding with caution'],
        confidence: 0.1
      };
    }
  }
  
  /**
   * Determine validation depth based on work characteristics
   */
  determineValidationDepth(work) {
    // Critical work always gets deep validation
    if (work.critical || work.type === 'security' || work.type === 'payment') {
      return 'L3';
    }
    
    // Complex work gets logic validation
    if (work.complexity === 'high' || work.dependencies?.length > 3) {
      return 'L2';
    }
    
    // Simple work gets syntax validation
    if (work.complexity === 'low' || work.type === 'documentation') {
      return 'L1';
    }
    
    // Default to configured depth
    return this.config.validationDepth;
  }
  
  /**
   * Get fallback expertise when absorption fails
   */
  getFallbackExpertise(specialistType) {
    return {
      type: specialistType,
      level: 'basic',
      capabilities: ['syntax_check', 'basic_patterns'],
      confidence: 0.5,
      fallback: true
    };
  }
  
  /**
   * Override parent's validateSpecialistWork to use Chameleon validation
   */
  async validateSpecialistWork(specialist, work) {
    // This is the integration point with existing BUMBA system
    return await this.validateWork(work, specialist);
  }
  
  /**
   * Update rolling metrics
   */
  updateMetric(metric, value) {
    if (metric.startsWith('avg')) {
      // Calculate rolling average
      const count = this.metrics.validations || 1;
      this.metrics[metric] = (this.metrics[metric] * (count - 1) + value) / count;
    } else {
      this.metrics[metric] = value;
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheEfficiency: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      errorDetectionRate: this.metrics.errorsDetected / this.metrics.validations || 0,
      expertiseProfiles: this.expertiseCache.size
    };
  }
  
  /**
   * Clear expertise cache
   */
  clearExpertiseCache() {
    this.expertiseCache.clear();
    this.currentExpertise = null;
    logger.info(`🧹 Expertise cache cleared for ${this.name}`);
  }
  
  /**
   * Get current expertise info
   */
  getCurrentExpertise() {
    if (!this.currentExpertise) {
      return { status: 'none', message: 'No expertise currently loaded' };
    }
    
    return {
      type: this.currentExpertise.type,
      level: this.currentExpertise.level,
      capabilities: this.currentExpertise.capabilities,
      confidence: this.currentExpertise.confidence,
      cached: this.expertiseCache.has(this.currentExpertise.type)
    };
  }
  
  /**
   * Preload expertise for expected specialists
   */
  async preloadExpertise(specialistTypes) {
    logger.info(`📚 Preloading expertise for ${specialistTypes.length} specialist types`);
    
    const results = await Promise.allSettled(
      specialistTypes.map(type => this.assumeExpertise(type))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    logger.info(`✅ Preloaded ${successful}/${specialistTypes.length} expertise profiles`);
    
    return successful;
  }
  
  /**
   * Handle expertise refresh on timer
   */
  startExpertiseRefresh(interval = 3600000) {
    this.refreshInterval = setInterval(async () => {
      logger.info(`🔄 Refreshing expertise cache for ${this.name}`);
      
      // Get all cached types
      const cachedTypes = Array.from(this.expertiseCache.keys());
      
      // Refresh each one
      for (const type of cachedTypes) {
        await this.assumeExpertise(type, { forceRefresh: true });
      }
      
    }, interval);
  }
  
  /**
   * Stop expertise refresh
   */
  stopExpertiseRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    this.stopExpertiseRefresh();
    this.clearExpertiseCache();
    if (super.shutdown) {
      await super.shutdown();
    }
    logger.info(`🦎 ${this.name || 'Chameleon'} Manager shutdown complete`);
  }
}

module.exports = ChameleonManager;