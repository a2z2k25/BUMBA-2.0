/**
 * Configuration System for Intelligent Pooling
 * Centralized configuration with validation, environment support, and A/B testing
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Pool sizing
  pool: {
    minSize: 3,
    maxSize: 20,
    targetSize: 12,
    warmupBatch: 3,
    cooldownBatch: 2
  },
  
  // Memory limits
  memory: {
    limit: 100,              // MB
    warningThreshold: 0.7,   // 70%
    criticalThreshold: 0.9,  // 90%
    perSpecialist: {
      default: 5,
      heavy: 10,
      light: 2
    },
    gcInterval: 60000,       // 1 minute
    gcThreshold: 0.8         // Trigger at 80%
  },
  
  // Performance tuning
  performance: {
    coldStartThreshold: 100,  // ms
    warmStartTarget: 10,      // ms
    responseTimeTarget: 50,   // ms
    hitRateTarget: 0.75,      // 75%
    utilizationTarget: 0.7    // 70%
  },
  
  // Prediction settings
  prediction: {
    enabled: true,
    minConfidence: 0.3,
    maxPredictions: 5,
    learningRate: 0.1,
    decayFactor: 0.95,
    historySize: 100
  },
  
  // Context detection
  context: {
    phaseDetection: true,
    departmentDetection: true,
    timePatterns: true,
    multiDepartment: true,
    confidenceThreshold: 0.5
  },
  
  // Adaptive scaling
  adaptive: {
    enabled: true,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.3,
    scaleUpFactor: 1.5,
    scaleDownFactor: 0.75,
    adjustmentInterval: 30000,  // 30 seconds
    cooldownPeriod: 60000,      // 1 minute
    aggressiveMode: false
  },
  
  // Cache settings
  cache: {
    maxSize: 15,
    ttl: 300000,               // 5 minutes
    refreshOnAccess: true,
    predictiveRetention: true,
    priorityEviction: true
  },
  
  // State management
  state: {
    persistEnabled: true,
    checkpointInterval: 60000,  // 1 minute
    maxCheckpoints: 10,
    stateTimeout: 5000,         // 5 seconds
    retryAttempts: 3
  },
  
  // Time patterns
  timePatterns: {
    enabled: true,
    businessHours: {
      start: 9,
      end: 18,
      timezone: 'UTC'
    },
    sprintDuration: 14,        // days
    seasonalAdjustment: true
  },
  
  // Monitoring
  monitoring: {
    metricsInterval: 5000,      // 5 seconds
    aggregationInterval: 60000, // 1 minute
    reportInterval: 300000,     // 5 minutes
    alertsEnabled: true,
    exportEnabled: false
  },
  
  // Integration
  integration: {
    lifecycleEnabled: true,
    urgentBypass: true,
    urgentThreshold: 50,       // ms
    migrationMode: false,
    dualMode: false,
    preserveExisting: false
  },
  
  // Features flags
  features: {
    usageTracking: true,
    contextDetection: true,
    patternLearning: true,
    timeAwareness: true,
    memoryManagement: true,
    adaptiveScaling: true,
    smartCaching: true,
    stateManagement: true,
    metricsCollection: true
  },
  
  // A/B testing
  abTesting: {
    enabled: false,
    experiments: [],
    trafficSplit: 0.5,
    controlGroup: 'default',
    testGroup: 'optimized'
  },
  
  // Logging
  logging: {
    level: 'info',
    enableDebug: false,
    enableTrace: false,
    logToFile: false,
    logPath: './logs/pooling'
  }
};

/**
 * Configuration profiles for different environments
 */
const PROFILES = {
  development: {
    pool: { minSize: 2, maxSize: 10, targetSize: 5 },
    memory: { limit: 50 },
    adaptive: { aggressiveMode: false },
    logging: { level: 'debug', enableDebug: true }
  },
  
  production: {
    pool: { minSize: 5, maxSize: 30, targetSize: 15 },
    memory: { limit: 200 },
    adaptive: { aggressiveMode: true },
    monitoring: { alertsEnabled: true, exportEnabled: true },
    logging: { level: 'warn', logToFile: true }
  },
  
  testing: {
    pool: { minSize: 1, maxSize: 5, targetSize: 2 },
    memory: { limit: 20 },
    state: { persistEnabled: false },
    monitoring: { alertsEnabled: false },
    logging: { level: 'error' }
  },
  
  highPerformance: {
    pool: { minSize: 10, maxSize: 50, targetSize: 25 },
    memory: { limit: 500, gcThreshold: 0.9 },
    performance: { coldStartThreshold: 50, warmStartTarget: 5 },
    adaptive: { aggressiveMode: true, adjustmentInterval: 15000 },
    cache: { maxSize: 30 }
  },
  
  lowResource: {
    pool: { minSize: 1, maxSize: 5, targetSize: 3 },
    memory: { limit: 30, warningThreshold: 0.6 },
    cache: { maxSize: 5 },
    features: { adaptiveScaling: false, metricsCollection: false }
  }
};

class PoolingConfig extends EventEmitter {
  constructor() {
    super();
    
    // Current configuration
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    
    // Profile
    this.profile = null;
    
    // Overrides
    this.overrides = {};
    
    // Validation rules
    this.validators = this.initializeValidators();
    
    // A/B test state
    this.abTestState = {
      active: false,
      group: null,
      config: null
    };
    
    // Configuration history
    this.history = [];
    this.maxHistorySize = 10;
    
    // Auto-tuning state
    this.autoTuning = {
      enabled: false,
      metrics: {},
      adjustments: []
    };
    
    logger.info('🟢️ Pooling configuration initialized');
  }
  
  /**
   * Initialize validators
   */
  initializeValidators() {
    return {
      pool: {
        minSize: (v) => v >= 1 && v <= 100,
        maxSize: (v) => v >= 1 && v <= 100,
        targetSize: (v) => v >= 1 && v <= 100
      },
      memory: {
        limit: (v) => v >= 10 && v <= 1000,
        warningThreshold: (v) => v > 0 && v < 1,
        criticalThreshold: (v) => v > 0 && v < 1
      },
      performance: {
        coldStartThreshold: (v) => v > 0 && v <= 1000,
        hitRateTarget: (v) => v >= 0 && v <= 1
      },
      adaptive: {
        scaleUpThreshold: (v) => v > 0 && v < 1,
        scaleDownThreshold: (v) => v > 0 && v < 1
      }
    };
  }
  
  /**
   * Load configuration from environment
   */
  loadFromEnvironment() {
    const env = process.env;
    const updates = {};
    
    // Pool configuration
    if (env.POOLING_MIN_SIZE) updates['pool.minSize'] = parseInt(env.POOLING_MIN_SIZE);
    if (env.POOLING_MAX_SIZE) updates['pool.maxSize'] = parseInt(env.POOLING_MAX_SIZE);
    if (env.POOLING_TARGET_SIZE) updates['pool.targetSize'] = parseInt(env.POOLING_TARGET_SIZE);
    
    // Memory configuration
    if (env.POOLING_MEMORY_LIMIT) updates['memory.limit'] = parseInt(env.POOLING_MEMORY_LIMIT);
    if (env.POOLING_MEMORY_WARNING) updates['memory.warningThreshold'] = parseFloat(env.POOLING_MEMORY_WARNING);
    
    // Features
    if (env.POOLING_ADAPTIVE_ENABLED) updates['adaptive.enabled'] = env.POOLING_ADAPTIVE_ENABLED === 'true';
    if (env.POOLING_PREDICTION_ENABLED) updates['prediction.enabled'] = env.POOLING_PREDICTION_ENABLED === 'true';
    
    // Profile
    if (env.POOLING_PROFILE) {
      this.loadProfile(env.POOLING_PROFILE);
    }
    
    // Apply updates
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value);
    }
    
    logger.info(`Loaded ${Object.keys(updates).length} settings from environment`);
  }
  
  /**
   * Load configuration from file
   */
  loadFromFile(filePath) {
    try {
      const configData = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(configData);
      
      this.merge(config);
      
      logger.info(`Configuration loaded from ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to load configuration from ${filePath}:`, error);
      return false;
    }
  }
  
  /**
   * Save configuration to file
   */
  saveToFile(filePath) {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(filePath, configData, 'utf8');
      
      logger.info(`Configuration saved to ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to save configuration to ${filePath}:`, error);
      return false;
    }
  }
  
  /**
   * Load a configuration profile
   */
  loadProfile(profileName) {
    if (!PROFILES[profileName]) {
      logger.error(`Unknown profile: ${profileName}`);
      return false;
    }
    
    this.profile = profileName;
    this.merge(PROFILES[profileName]);
    
    logger.info(`Loaded profile: ${profileName}`);
    this.emit('profile:loaded', profileName);
    
    return true;
  }
  
  /**
   * Get configuration value by path
   */
  get(path) {
    const parts = path.split('.');
    let value = this.config;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * Set configuration value by path
   */
  set(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let target = this.config;
    
    // Navigate to target object
    for (const part of parts) {
      if (!(part in target)) {
        target[part] = {};
      }
      target = target[part];
    }
    
    // Validate if validator exists
    const validator = this.getValidator(path);
    if (validator && !validator(value)) {
      logger.error(`Invalid value for ${path}: ${value}`);
      return false;
    }
    
    // Store old value
    const oldValue = target[lastPart];
    
    // Set new value
    target[lastPart] = value;
    
    // Record in history
    this.recordChange(path, oldValue, value);
    
    // Emit change event
    this.emit('config:changed', { path, oldValue, newValue: value });
    
    logger.debug(`Config updated: ${path} = ${value}`);
    return true;
  }
  
  /**
   * Get validator for path
   */
  getValidator(path) {
    const parts = path.split('.');
    let validators = this.validators;
    
    for (const part of parts) {
      if (validators && part in validators) {
        validators = validators[part];
      } else {
        return null;
      }
    }
    
    return typeof validators === 'function' ? validators : null;
  }
  
  /**
   * Merge configuration object
   */
  merge(config) {
    this.deepMerge(this.config, config);
    this.emit('config:merged', config);
  }
  
  /**
   * Deep merge helper
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  /**
   * Validate entire configuration
   */
  validate() {
    const errors = [];
    
    // Validate pool sizes
    if (this.config.pool.minSize > this.config.pool.maxSize) {
      errors.push('pool.minSize cannot be greater than pool.maxSize');
    }
    
    if (this.config.pool.targetSize < this.config.pool.minSize ||
        this.config.pool.targetSize > this.config.pool.maxSize) {
      errors.push('pool.targetSize must be between minSize and maxSize');
    }
    
    // Validate memory thresholds
    if (this.config.memory.warningThreshold >= this.config.memory.criticalThreshold) {
      errors.push('memory.warningThreshold must be less than criticalThreshold');
    }
    
    // Validate adaptive thresholds
    if (this.config.adaptive.scaleDownThreshold >= this.config.adaptive.scaleUpThreshold) {
      errors.push('adaptive.scaleDownThreshold must be less than scaleUpThreshold');
    }
    
    // Validate cache
    if (this.config.cache.maxSize < 1) {
      errors.push('cache.maxSize must be at least 1');
    }
    
    if (errors.length > 0) {
      logger.error('Configuration validation failed:', errors);
      return { valid: false, errors };
    }
    
    return { valid: true, errors: [] };
  }
  
  /**
   * Reset to defaults
   */
  reset() {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.profile = null;
    this.overrides = {};
    this.history = [];
    
    logger.info('Configuration reset to defaults');
    this.emit('config:reset');
  }
  
  /**
   * Record configuration change
   */
  recordChange(path, oldValue, newValue) {
    this.history.push({
      timestamp: Date.now(),
      path,
      oldValue,
      newValue
    });
    
    // Trim history
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }
  
  /**
   * Setup A/B test
   */
  setupABTest(experiment) {
    if (!this.config.abTesting.enabled) {
      logger.warn('A/B testing is disabled');
      return false;
    }
    
    const { name, control, test, split = 0.5 } = experiment;
    
    // Determine group
    const group = Math.random() < split ? 'control' : 'test';
    const config = group === 'control' ? control : test;
    
    // Store test state
    this.abTestState = {
      active: true,
      name,
      group,
      config: JSON.parse(JSON.stringify(this.config))
    };
    
    // Apply test configuration
    this.merge(config);
    
    logger.info(`A/B test started: ${name} (group: ${group})`);
    this.emit('abtest:started', { name, group });
    
    return true;
  }
  
  /**
   * End A/B test
   */
  endABTest(keepChanges = false) {
    if (!this.abTestState.active) {
      return false;
    }
    
    const { name, group } = this.abTestState;
    
    if (!keepChanges) {
      // Restore original config
      this.config = this.abTestState.config;
    }
    
    this.abTestState = {
      active: false,
      group: null,
      config: null
    };
    
    logger.info(`A/B test ended: ${name} (changes kept: ${keepChanges})`);
    this.emit('abtest:ended', { name, group, kept: keepChanges });
    
    return true;
  }
  
  /**
   * Enable auto-tuning
   */
  enableAutoTuning(metrics) {
    this.autoTuning.enabled = true;
    this.autoTuning.metrics = metrics;
    
    // Start tuning interval
    this.tuningInterval = setInterval(() => {
      this.performAutoTuning();
    }, 60000); // Every minute
    
    logger.info('Auto-tuning enabled');
  }
  
  /**
   * Perform auto-tuning
   */
  performAutoTuning() {
    if (!this.autoTuning.enabled || !this.autoTuning.metrics) {
      return;
    }
    
    const metrics = this.autoTuning.metrics;
    const adjustments = [];
    
    // Tune pool size based on hit rate
    if (metrics.hitRate < this.config.performance.hitRateTarget) {
      const newSize = Math.min(
        this.config.pool.targetSize + 2,
        this.config.pool.maxSize
      );
      
      if (newSize !== this.config.pool.targetSize) {
        this.set('pool.targetSize', newSize);
        adjustments.push(`Increased pool size to ${newSize}`);
      }
    }
    
    // Tune memory thresholds based on pressure
    if (metrics.memoryPressure === 'critical') {
      const newThreshold = Math.max(
        this.config.memory.criticalThreshold - 0.05,
        0.7
      );
      
      this.set('memory.criticalThreshold', newThreshold);
      adjustments.push(`Lowered critical threshold to ${newThreshold}`);
    }
    
    // Tune prediction confidence
    if (metrics.predictionAccuracy < 0.4) {
      const newConfidence = Math.max(
        this.config.prediction.minConfidence + 0.05,
        0.5
      );
      
      this.set('prediction.minConfidence', newConfidence);
      adjustments.push(`Increased min confidence to ${newConfidence}`);
    }
    
    if (adjustments.length > 0) {
      this.autoTuning.adjustments.push({
        timestamp: Date.now(),
        adjustments
      });
      
      logger.info(`Auto-tuning applied ${adjustments.length} adjustments`);
      this.emit('autotuning:adjusted', adjustments);
    }
  }
  
  /**
   * Disable auto-tuning
   */
  disableAutoTuning() {
    if (this.tuningInterval) {
      clearInterval(this.tuningInterval);
    }
    
    this.autoTuning.enabled = false;
    logger.info('Auto-tuning disabled');
  }
  
  /**
   * Get configuration summary
   */
  getSummary() {
    return {
      profile: this.profile || 'custom',
      pool: `${this.config.pool.minSize}-${this.config.pool.maxSize} (target: ${this.config.pool.targetSize})`,
      memory: `${this.config.memory.limit}MB`,
      features: Object.entries(this.config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature),
      abTest: this.abTestState.active ? this.abTestState.name : 'none',
      autoTuning: this.autoTuning.enabled
    };
  }
  
  /**
   * Export configuration
   */
  export() {
    return {
      config: JSON.parse(JSON.stringify(this.config)),
      profile: this.profile,
      overrides: this.overrides,
      history: this.history,
      abTestState: this.abTestState,
      autoTuning: this.autoTuning
    };
  }
  
  /**
   * Import configuration
   */
  import(data) {
    if (data.config) {
      this.config = data.config;
    }
    if (data.profile) {
      this.profile = data.profile;
    }
    if (data.overrides) {
      this.overrides = data.overrides;
    }
    if (data.history) {
      this.history = data.history;
    }
    
    logger.info('Configuration imported');
  }
}

// Singleton instance
let instance = null;

/**
 * Get configuration instance
 */
function getConfig() {
  if (!instance) {
    instance = new PoolingConfig();
    
    // Auto-load from environment
    instance.loadFromEnvironment();
    
    // Try to load from default file
    const defaultConfigPath = path.join(process.cwd(), 'pooling.config.json');
    if (fs.existsSync(defaultConfigPath)) {
      instance.loadFromFile(defaultConfigPath);
    }
  }
  
  return instance;
}

module.exports = {
  PoolingConfig,
  getConfig,
  DEFAULT_CONFIG,
  PROFILES
};