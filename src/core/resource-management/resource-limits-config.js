/**
 * BUMBA Configurable Resource Limits System
 * Dynamic resource limit configuration and enforcement
 */

const { EventEmitter } = require('events');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class ResourceLimitsConfig extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Default configuration
    this.defaultConfig = {
      memory: {
        heap: {
          min: 128,           // MB
          max: 1024,          // MB
          target: 512,        // MB
          warningThreshold: 0.8,
          criticalThreshold: 0.9
        },
        system: {
          maxPercent: 50,     // Max % of system memory
          reserveMB: 512      // Reserve for OS
        },
        gc: {
          triggerThreshold: 0.7,
          forceThreshold: 0.85,
          interval: 60000     // 1 minute
        }
      },
      cache: {
        maxEntries: 10000,
        maxMemoryMB: 100,
        maxEntrySize: 5,      // MB
        ttl: {
          min: 60000,         // 1 minute
          default: 3600000,   // 1 hour
          max: 86400000       // 24 hours
        },
        evictionPolicy: 'hybrid',
        compression: {
          enabled: true,
          threshold: 1024,    // Compress if > 1KB
          algorithm: 'gzip'
        }
      },
      connections: {
        maxConcurrent: 100,
        maxPerHost: 10,
        timeout: 30000,       // 30 seconds
        keepAlive: true,
        poolSize: {
          min: 5,
          max: 50,
          target: 20
        }
      },
      requests: {
        maxPerMinute: 1000,
        maxPerSecond: 50,
        maxPayloadSize: 10,   // MB
        timeout: 60000,       // 1 minute
        retries: {
          max: 3,
          backoff: 'exponential',
          initialDelay: 1000
        }
      },
      workers: {
        maxWorkers: os.cpus().length,
        maxTasksPerWorker: 100,
        taskTimeout: 300000, // 5 minutes
        recycleAfter: 1000,  // Recycle worker after N tasks
        memoryLimit: 512     // MB per worker
      },
      files: {
        maxOpenFiles: 1000,
        maxFileSize: 100,     // MB
        tempDir: os.tmpdir(),
        cleanupInterval: 3600000 // 1 hour
      },
      queues: {
        maxSize: 10000,
        maxMemoryMB: 50,
        processingRate: 100,  // Items per second
        priorities: ['critical', 'high', 'normal', 'low']
      }
    };
    
    // Merge with provided options
    this.config = this.mergeDeep(this.defaultConfig, options);
    
    // Runtime limits (can be adjusted dynamically)
    this.runtimeLimits = JSON.parse(JSON.stringify(this.config));
    
    // Enforcement tracking
    this.enforcement = {
      violations: new Map(),
      adjustments: [],
      overrides: new Map()
    };
    
    // Auto-scaling settings
    this.autoScaling = {
      enabled: options.autoScaling !== false,
      mode: options.scalingMode || 'adaptive', // adaptive, conservative, aggressive
      history: [],
      lastAdjustment: null
    };
    
    // Load config from file if provided
    if (options.configFile) {
      this.loadFromFile(options.configFile);
    }
    
    // Start monitoring and enforcement
    this.startEnforcement();
  }

  /**
   * Deep merge configuration objects
   */
  mergeDeep(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (key in target) {
          output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      } else {
        output[key] = source[key];
      }
    }
    
    return output;
  }

  /**
   * Load configuration from file
   */
  loadFromFile(filePath) {
    try {
      const configData = fs.readFileSync(filePath, 'utf8');
      const fileConfig = JSON.parse(configData);
      
      this.config = this.mergeDeep(this.config, fileConfig);
      this.runtimeLimits = JSON.parse(JSON.stringify(this.config));
      
      logger.info(`Loaded resource limits from ${filePath}`);
      this.emit('config-loaded', { source: filePath });
      
      return true;
    } catch (error) {
      logger.error(`Failed to load config from ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Save configuration to file
   */
  saveToFile(filePath) {
    try {
      const configData = JSON.stringify(this.runtimeLimits, null, 2);
      fs.writeFileSync(filePath, configData, 'utf8');
      
      logger.info(`Saved resource limits to ${filePath}`);
      this.emit('config-saved', { destination: filePath });
      
      return true;
    } catch (error) {
      logger.error(`Failed to save config to ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Get limit for a specific resource
   */
  getLimit(resourcePath) {
    const parts = resourcePath.split('.');
    let current = this.runtimeLimits;
    
    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    // Check for overrides
    const override = this.enforcement.overrides.get(resourcePath);
    if (override) {
      return override.value;
    }
    
    return current;
  }

  /**
   * Set limit for a specific resource
   */
  setLimit(resourcePath, value, options = {}) {
    const parts = resourcePath.split('.');
    let current = this.runtimeLimits;
    
    // Navigate to the parent
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    // Validate the new value
    const validation = this.validateLimit(resourcePath, value);
    if (!validation.valid) {
      throw new Error(`Invalid limit for ${resourcePath}: ${validation.reason}`);
    }
    
    // Store old value
    const oldValue = current[parts[parts.length - 1]];
    
    // Set new value
    current[parts[parts.length - 1]] = value;
    
    // Record adjustment
    this.enforcement.adjustments.push({
      timestamp: Date.now(),
      path: resourcePath,
      oldValue,
      newValue: value,
      reason: options.reason || 'manual',
      temporary: options.temporary || false
    });
    
    // If temporary, set up expiration
    if (options.temporary && options.duration) {
      setTimeout(() => {
        this.setLimit(resourcePath, oldValue, { reason: 'expiration' });
      }, options.duration);
    }
    
    // Emit event
    this.emit('limit-changed', {
      path: resourcePath,
      oldValue,
      newValue: value,
      options
    });
    
    // Apply the limit immediately
    this.applyLimit(resourcePath, value);
    
    return true;
  }

  /**
   * Override a limit temporarily
   */
  override(resourcePath, value, duration = 3600000) {
    this.enforcement.overrides.set(resourcePath, {
      value,
      expires: Date.now() + duration,
      original: this.getLimit(resourcePath)
    });
    
    // Set up expiration
    setTimeout(() => {
      this.removeOverride(resourcePath);
    }, duration);
    
    this.emit('override-set', {
      path: resourcePath,
      value,
      duration
    });
    
    return true;
  }

  /**
   * Remove an override
   */
  removeOverride(resourcePath) {
    const override = this.enforcement.overrides.get(resourcePath);
    
    if (override) {
      this.enforcement.overrides.delete(resourcePath);
      
      this.emit('override-removed', {
        path: resourcePath,
        original: override.original
      });
    }
  }

  /**
   * Validate a limit value
   */
  validateLimit(resourcePath, value) {
    const validators = {
      'memory.heap.max': (v) => {
        const systemMemory = os.totalmem() / (1024 * 1024); // MB
        if (v > systemMemory * 0.8) {
          return { valid: false, reason: 'Exceeds 80% of system memory' };
        }
        if (v < this.runtimeLimits.memory.heap.min) {
          return { valid: false, reason: 'Below minimum heap size' };
        }
        return { valid: true };
      },
      'cache.maxEntries': (v) => {
        if (v < 100) {
          return { valid: false, reason: 'Cache too small to be effective' };
        }
        if (v > 1000000) {
          return { valid: false, reason: 'Cache too large, may cause performance issues' };
        }
        return { valid: true };
      },
      'connections.maxConcurrent': (v) => {
        if (v < 1) {
          return { valid: false, reason: 'Must allow at least 1 connection' };
        }
        if (v > 10000) {
          return { valid: false, reason: 'Too many connections may exhaust resources' };
        }
        return { valid: true };
      }
    };
    
    // Use specific validator if available
    if (validators[resourcePath]) {
      return validators[resourcePath](value);
    }
    
    // Generic validation
    if (typeof value === 'number' && value < 0) {
      return { valid: false, reason: 'Value cannot be negative' };
    }
    
    return { valid: true };
  }

  /**
   * Apply a limit immediately
   */
  applyLimit(resourcePath, value) {
    const applications = {
      'memory.heap.max': (v) => {
        // Attempt to set V8 heap limit
        if (global.v8) {
          try {
            // This is platform-specific and may not work everywhere
            const v8 = require('v8');
            v8.setFlagsFromString(`--max_old_space_size=${v}`);
            logger.info(`Applied heap limit: ${v}MB`);
          } catch (error) {
            logger.warn(`Could not apply heap limit: ${error.message}`);
          }
        }
      },
      'workers.maxWorkers': (v) => {
        // Notify worker manager to adjust pool
        this.emit('adjust-workers', { max: v });
      },
      'cache.maxEntries': (v) => {
        // Notify cache system to evict if needed
        this.emit('adjust-cache', { maxEntries: v });
      }
    };
    
    // Apply if handler exists
    if (applications[resourcePath]) {
      applications[resourcePath](value);
    }
  }

  /**
   * Check if a resource usage is within limits
   */
  checkLimit(resourcePath, currentValue) {
    const limit = this.getLimit(resourcePath);
    
    if (limit === undefined) {
      return { withinLimit: true };
    }
    
    let withinLimit = true;
    let reason = null;
    
    if (typeof limit === 'number') {
      withinLimit = currentValue <= limit;
      if (!withinLimit) {
        reason = `Current value ${currentValue} exceeds limit ${limit}`;
      }
    } else if (typeof limit === 'object' && limit.max !== undefined) {
      withinLimit = currentValue <= limit.max;
      if (!withinLimit) {
        reason = `Current value ${currentValue} exceeds max limit ${limit.max}`;
      }
    }
    
    // Record violation if exceeded
    if (!withinLimit) {
      this.recordViolation(resourcePath, currentValue, limit);
    }
    
    return {
      withinLimit,
      limit,
      current: currentValue,
      reason,
      utilization: (currentValue / (limit.max || limit)) * 100
    };
  }

  /**
   * Record a limit violation
   */
  recordViolation(resourcePath, value, limit) {
    const violations = this.enforcement.violations.get(resourcePath) || [];
    
    violations.push({
      timestamp: Date.now(),
      value,
      limit,
      severity: this.calculateViolationSeverity(value, limit)
    });
    
    // Keep only recent violations
    if (violations.length > 100) {
      violations.shift();
    }
    
    this.enforcement.violations.set(resourcePath, violations);
    
    this.emit('violation', {
      path: resourcePath,
      value,
      limit,
      count: violations.length
    });
    
    // Auto-scale if enabled
    if (this.autoScaling.enabled) {
      this.considerAutoScaling(resourcePath, value, limit);
    }
  }

  /**
   * Calculate violation severity
   */
  calculateViolationSeverity(value, limit) {
    const maxLimit = typeof limit === 'object' ? limit.max : limit;
    const ratio = value / maxLimit;
    
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  /**
   * Consider auto-scaling based on violations
   */
  considerAutoScaling(resourcePath, value, limit) {
    const violations = this.enforcement.violations.get(resourcePath) || [];
    
    // Need multiple violations to trigger scaling
    if (violations.length < 3) return;
    
    // Check if recent violations
    const recentViolations = violations.filter(v => 
      Date.now() - v.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentViolations.length < 3) return;
    
    // Calculate scaling factor based on mode
    let scalingFactor;
    switch (this.autoScaling.mode) {
      case 'aggressive':
        scalingFactor = 2.0;
        break;
      case 'conservative':
        scalingFactor = 1.2;
        break;
      case 'adaptive':
      default:
        scalingFactor = Math.min(2.0, value / (limit.max || limit));
        break;
    }
    
    // Apply scaling
    const newLimit = Math.ceil((limit.max || limit) * scalingFactor);
    
    try {
      this.setLimit(resourcePath, newLimit, {
        reason: 'auto-scaling',
        temporary: true,
        duration: 3600000 // 1 hour
      });
      
      this.autoScaling.history.push({
        timestamp: Date.now(),
        path: resourcePath,
        oldLimit: limit,
        newLimit,
        factor: scalingFactor
      });
      
      this.autoScaling.lastAdjustment = Date.now();
      
      logger.info(`Auto-scaled ${resourcePath} from ${limit} to ${newLimit}`);
    } catch (error) {
      logger.error(`Auto-scaling failed for ${resourcePath}:`, error.message);
    }
  }

  /**
   * Get recommended limits based on system resources
   */
  getRecommendedLimits() {
    const systemMemory = os.totalmem() / (1024 * 1024); // MB
    const cpuCount = os.cpus().length;
    
    return {
      memory: {
        heap: {
          max: Math.min(4096, Math.floor(systemMemory * 0.5)),
          target: Math.min(2048, Math.floor(systemMemory * 0.25))
        }
      },
      workers: {
        maxWorkers: cpuCount,
        memoryLimit: Math.floor(systemMemory / cpuCount / 2)
      },
      connections: {
        maxConcurrent: cpuCount * 25,
        poolSize: {
          max: cpuCount * 10
        }
      },
      cache: {
        maxMemoryMB: Math.min(500, Math.floor(systemMemory * 0.1))
      }
    };
  }

  /**
   * Apply recommended limits
   */
  applyRecommendedLimits() {
    const recommended = this.getRecommendedLimits();
    
    const applied = [];
    
    // Apply each recommended limit
    const applyRecursive = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && !Array.isArray(value)) {
          applyRecursive(value, fullPath);
        } else {
          try {
            this.setLimit(fullPath, value, { reason: 'recommended' });
            applied.push({ path: fullPath, value });
          } catch (error) {
            // Skip if cannot apply
          }
        }
      }
    };
    
    applyRecursive(recommended);
    
    this.emit('recommended-applied', { limits: applied });
    
    return applied;
  }

  /**
   * Start enforcement monitoring
   */
  startEnforcement() {
    // Monitor memory
    this.memoryMonitor = setInterval(() => {
      this.enforceMemoryLimits();
    }, 10000); // Every 10 seconds
    
    // Clean up expired overrides
    this.overrideCleanup = setInterval(() => {
      this.cleanupExpiredOverrides();
    }, 60000); // Every minute
    
    // Auto-scaling cooldown
    this.scalingCooldown = setInterval(() => {
      this.checkScalingCooldown();
    }, 300000); // Every 5 minutes
  }

  /**
   * Enforce memory limits
   */
  enforceMemoryLimits() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / (1024 * 1024);
    
    const heapLimit = this.getLimit('memory.heap.max');
    const warningThreshold = this.getLimit('memory.heap.warningThreshold');
    const criticalThreshold = this.getLimit('memory.heap.criticalThreshold');
    
    const usage = heapUsedMB / heapLimit;
    
    if (usage > criticalThreshold) {
      this.emit('memory-critical', {
        used: heapUsedMB,
        limit: heapLimit,
        usage: usage * 100
      });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } else if (usage > warningThreshold) {
      this.emit('memory-warning', {
        used: heapUsedMB,
        limit: heapLimit,
        usage: usage * 100
      });
    }
  }

  /**
   * Clean up expired overrides
   */
  cleanupExpiredOverrides() {
    const now = Date.now();
    const expired = [];
    
    for (const [path, override] of this.enforcement.overrides) {
      if (now > override.expires) {
        expired.push(path);
      }
    }
    
    for (const path of expired) {
      this.removeOverride(path);
    }
  }

  /**
   * Check scaling cooldown
   */
  checkScalingCooldown() {
    if (!this.autoScaling.lastAdjustment) return;
    
    const timeSinceAdjustment = Date.now() - this.autoScaling.lastAdjustment;
    
    // Reset violations after cooldown period
    if (timeSinceAdjustment > 600000) { // 10 minutes
      this.enforcement.violations.clear();
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return JSON.parse(JSON.stringify(this.runtimeLimits));
  }

  /**
   * Get enforcement statistics
   */
  getStats() {
    const stats = {
      violations: {},
      adjustments: this.enforcement.adjustments.length,
      overrides: this.enforcement.overrides.size,
      autoScaling: {
        enabled: this.autoScaling.enabled,
        mode: this.autoScaling.mode,
        history: this.autoScaling.history.length,
        lastAdjustment: this.autoScaling.lastAdjustment
      }
    };
    
    // Count violations by resource
    for (const [path, violations] of this.enforcement.violations) {
      stats.violations[path] = violations.length;
    }
    
    return stats;
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.runtimeLimits = JSON.parse(JSON.stringify(this.defaultConfig));
    this.enforcement.violations.clear();
    this.enforcement.overrides.clear();
    this.enforcement.adjustments = [];
    this.autoScaling.history = [];
    
    this.emit('reset');
    
    return true;
  }

  /**
   * Stop enforcement
   */
  stop() {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
    
    if (this.overrideCleanup) {
      clearInterval(this.overrideCleanup);
    }
    
    if (this.scalingCooldown) {
      clearInterval(this.scalingCooldown);
    }
    
    this.removeAllListeners();
  }
}

// Export singleton
let instance = null;

module.exports = {
  ResourceLimitsConfig,
  
  getInstance(options) {
    if (!instance) {
      instance = new ResourceLimitsConfig(options);
    }
    return instance;
  },
  
  // Convenience methods
  getLimit: (path) => {
    if (!instance) {
      instance = new ResourceLimitsConfig();
    }
    return instance.getLimit(path);
  },
  
  setLimit: (path, value, options) => {
    if (!instance) {
      instance = new ResourceLimitsConfig();
    }
    return instance.setLimit(path, value, options);
  },
  
  checkLimit: (path, value) => {
    if (!instance) {
      instance = new ResourceLimitsConfig();
    }
    return instance.checkLimit(path, value);
  }
};