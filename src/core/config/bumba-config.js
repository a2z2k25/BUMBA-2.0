/**
 * BUMBA Central Configuration System
 * Single source of truth for all configuration values
 */

const path = require('path');
const { logger } = require('../logging/bumba-logger');

const os = require('os');

class BumbaConfig {
  constructor() {
    // Default configuration - no more hardcoded values!
    this.config = {
      // Framework settings
      framework: {
        name: 'BUMBA',
        version: '2.0.0',
        mode: process.env.NODE_ENV || 'production',
        debug: process.env.BUMBA_DEBUG === 'true'
      },
      
      // Timeouts (milliseconds)
      timeouts: {
        default: 30000,
        command: 60000,
        api: 10000,
        agent: 30000,
        network: 5000,
        file: 15000,
        audio: 3000
      },
      
      // Resource limits
      limits: {
        maxCacheSize: 1000,
        maxActiveAgents: 10,
        maxMemoryMB: 512,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxLogSize: 10 * 1024 * 1024,
        maxErrorLogEntries: 100,
        maxConcurrentOperations: 5
      },
      
      // Thresholds
      thresholds: {
        complexity: {
          low: 0.3,
          medium: 0.6,
          high: 0.8
        },
        performance: {
          responseTime: 2000,
          errorRate: 0.05,
          memoryUsage: 0.8
        },
        routing: {
          strategic: 0.7,
          experience: 0.6,
          technical: 0.8
        }
      },
      
      // Retry configuration
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']
      },
      
      // Paths
      paths: {
        installation: path.join(os.homedir(), '.claude'),
        logs: path.join(os.homedir(), '.claude', 'logs'),
        cache: path.join(os.homedir(), '.claude', 'cache'),
        temp: os.tmpdir(),
        audio: path.join(os.homedir(), '.claude', 'assets', 'audio')
      },
      
      // Security settings
      security: {
        enableAuth: true,
        enableValidation: true,
        enableSanitization: true,
        commandWhitelist: [
          'which', 'ping', 'npm', 'node', 'git',
          'afplay', 'mpg123', 'ffplay', 'paplay', 'qlty'
        ],
        allowedPaths: [
          os.homedir(),
          '/tmp',
          process.cwd()
        ]
      },
      
      // Feature flags
      features: {
        audioEnabled: process.env.BUMBA_DISABLE_AUDIO !== 'true',
        monitoringEnabled: process.env.BUMBA_DISABLE_MONITORING !== 'true',
        cachingEnabled: true,
        compressionEnabled: true,
        telemetryEnabled: false,
        experimentalFeatures: false
      },
      
      // Logging configuration
      logging: {
        level: process.env.BUMBA_LOG_LEVEL || 'info',
        format: 'json',
        outputs: ['console'],
        colorize: true,
        timestamp: true,
        maxFiles: 5
      },
      
      // Audio configuration
      audio: {
        enabled: true,
        volume: 0.8,
        fallbackEnabled: true,
        commands: {
          darwin: ['afplay', 'say'],
          linux: ['aplay', 'paplay', 'mpg123', 'espeak'],
          win32: ['powershell']
        }
      },
      
      // Cache configuration
      cache: {
        memory: {
          maxSize: 1000,
          ttl: 3600000, // 1 hour
          checkPeriod: 600000 // 10 minutes
        },
        file: {
          enabled: false,
          directory: path.join(os.homedir(), '.claude', 'cache'),
          maxSize: 100 * 1024 * 1024 // 100MB
        }
      },
      
      // Monitoring configuration
      monitoring: {
        enabled: true,
        interval: 30000, // 30 seconds
        metrics: {
          cpu: true,
          memory: true,
          diskSpace: true,
          responseTime: true,
          errorRate: true
        },
        alerts: {
          enabled: true,
          channels: ['console', 'log']
        }
      },
      
      // API configuration
      api: {
        baseUrl: process.env.BUMBA_API_URL || 'http://localhost:3000',
        timeout: 30000,
        retries: 3,
        headers: {
          'User-Agent': 'BUMBA-Framework/2.0.0'
        }
      }
    };
    
    // Load environment overrides
    this.loadEnvironmentOverrides();
    
    // Freeze config to prevent accidental mutations
    this.deepFreeze(this.config);
  }

  /**
   * Load configuration overrides from environment variables
   */
  loadEnvironmentOverrides() {
    const envMap = {
      'BUMBA_MAX_MEMORY': ['limits', 'maxMemoryMB', parseInt],
      'BUMBA_MAX_AGENTS': ['limits', 'maxActiveAgents', parseInt],
      'BUMBA_TIMEOUT': ['timeouts', 'default', parseInt],
      'BUMBA_LOG_LEVEL': ['logging', 'level'],
      'BUMBA_DEBUG': ['framework', 'debug', v => v === 'true'],
      'BUMBA_MODE': ['framework', 'mode'],
      'BUMBA_DISABLE_AUDIO': ['features', 'audioEnabled', v => v !== 'true'],
      'BUMBA_DISABLE_MONITORING': ['features', 'monitoringEnabled', v => v !== 'true'],
      'BUMBA_INSTALL_DIR': ['paths', 'installation'],
      'BUMBA_API_URL': ['api', 'baseUrl']
    };
    
    for (const [envVar, [path1, path2, transform]] of Object.entries(envMap)) {
      const value = process.env[envVar];
      if (value !== undefined) {
        const transformedValue = transform ? transform(value) : value;
        this.config[path1][path2] = transformedValue;
      }
    }
  }

  /**
   * Deep freeze an object to prevent mutations
   */
  deepFreeze(obj) {
    Object.freeze(obj);
    
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null
        && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
        && !Object.isFrozen(obj[prop])) {
        this.deepFreeze(obj[prop]);
      }
    });
    
    return obj;
  }

  /**
   * Get configuration value by path
   */
  get(path, defaultValue) {
    const parts = path.split('.');
    let value = this.config;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }
  
  /**
   * Explain a configuration option
   */
  explain(path) {
    const explanations = {
      'timeouts.default': 'Default timeout for operations (ms). Lower = faster failures, higher = more tolerance',
      'limits.maxActiveAgents': 'Maximum concurrent agents. Higher = more parallel work but more memory',
      'limits.maxMemoryMB': 'Memory limit in MB. Process warns when approaching limit',
      'thresholds.complexity': 'Complexity thresholds for task routing (0-1 scale)',
      'retry.maxAttempts': 'Maximum retry attempts for failed operations',
      'features.audioEnabled': 'Enable audio feedback for operations',
      'features.cachingEnabled': 'Enable caching for better performance',
      'logging.level': 'Logging verbosity: error, warn, info, debug',
      'cache.memory.ttl': 'How long to keep items in cache (ms)',
      'monitoring.interval': 'How often to collect metrics (ms)'
    };
    
    const value = this.get(path);
    const explanation = explanations[path] || 'No explanation available';
    
    return {
      path,
      value,
      explanation,
      type: typeof value
    };
  }

  /**
   * Get entire configuration section
   */
  getSection(section) {
    return this.config[section];
  }

  /**
   * Get all configuration
   */
  getAll() {
    // Return a deep copy to prevent mutations
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    // Validate required values
    if (!this.config.framework.name) {
      errors.push('framework.name is required');
    }
    
    // Validate numeric ranges
    if (this.config.limits.maxMemoryMB < 128) {
      errors.push('limits.maxMemoryMB must be at least 128');
    }
    
    if (this.config.timeouts.default < 1000) {
      errors.push('timeouts.default must be at least 1000ms');
    }
    
    // Validate thresholds
    const thresholds = this.config.thresholds.complexity;
    if (thresholds.low >= thresholds.medium || thresholds.medium >= thresholds.high) {
      errors.push('Invalid complexity thresholds: low < medium < high required');
    }
    
    // Validate paths exist
    const fs = require('fs');
    for (const [key, path] of Object.entries(this.config.paths)) {
      if (key !== 'temp' && !fs.existsSync(path)) {
        try {
          fs.mkdirSync(path, { recursive: true });
        } catch (error) {
          errors.push(`Path ${key} (${path}) does not exist and could not be created`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration for a specific module
   */
  getModuleConfig(moduleName) {
    const moduleConfigs = {
      'unified-routing-system': {
        timeouts: this.config.timeouts,
        thresholds: this.config.thresholds.routing
      },
      'memory-manager': {
        maxMemoryMB: this.config.limits.maxMemoryMB,
        maxCacheSize: this.config.limits.maxCacheSize
      },
      'logger': this.config.logging,
      'security': this.config.security,
      'audio': this.config.audio
    };
    
    return moduleConfigs[moduleName] || {};
  }

  /**
   * Export configuration as environment variables
   */
  toEnvVars() {
    return {
      BUMBA_MODE: this.config.framework.mode,
      BUMBA_DEBUG: this.config.framework.debug.toString(),
      BUMBA_MAX_MEMORY: this.config.limits.maxMemoryMB.toString(),
      BUMBA_LOG_LEVEL: this.config.logging.level,
      BUMBA_INSTALL_DIR: this.config.paths.installation
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  BumbaConfig,
  
  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new BumbaConfig();
      
      // Validate on first load
      const validation = instance.validate();
      if (!validation.valid) {
        logger.error('Configuration validation errors:', validation.errors);
      }
    }
    return instance;
  },
  
  // Convenience methods
  get: (path, defaultValue) => getInstance().get(path, defaultValue),
  getSection: (section) => getInstance().getSection(section),
  getAll: () => getInstance().getAll(),
  validate: () => getInstance().validate()
};