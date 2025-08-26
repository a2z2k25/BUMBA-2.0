/**
 * BUMBA Configuration Manager
 * Manages framework configuration and settings
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ConfigurationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {};
    this.configPath = options.configPath || path.join(process.cwd(), '.bumba-config.json');
    const homeDir = os.homedir();
    const claudeDir = path.join(homeDir, '.claude');
    
    this.defaults = {
      framework: {
        name: 'BUMBA',
        version: '2.0'
      },
      paths: {
        home: claudeDir,
        logs: path.join(claudeDir, 'logs'),
        cache: path.join(claudeDir, 'cache'),
        config: path.join(claudeDir, 'config')
      },
      logging: {
        level: 'info',
        file: null
      },
      performance: {
        cacheEnabled: true,
        maxConcurrency: 4
      },
      security: {
        enabled: true,
        aiSpecificProtection: true
      }
    };
    
    // Merge with defaults
    this.config = { ...this.defaults, ...options.initialConfig };
  }

  /**
   * Load configuration from file
   */
  load(configPath = this.configPath) {
    try {
      if (fs.existsSync(configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this.config = this.mergeDeep(this.config, fileConfig);
        logger.info(`Configuration loaded from ${configPath}`);
      } else {
        logger.warn(`Configuration file not found: ${configPath}`);
      }
    } catch (error) {
      logger.error('Failed to load configuration:', error);
    }
    return this.config;
  }

  /**
   * Save configuration to file
   */
  save(configPath = this.configPath) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      logger.info(`Configuration saved to ${configPath}`);
      this.emit('config:saved', { path: configPath });
      return true;
    } catch (error) {
      logger.error('Failed to save configuration:', error);
      return false;
    }
  }
  
  /**
   * Alias for save method for test compatibility
   */
  saveConfiguration(configPath) {
    return this.save(configPath);
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = undefined) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value
   */
  set(key, value) {
    const keys = key.split('.');
    let config = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in config) || typeof config[k] !== 'object') {
        config[k] = {};
      }
      config = config[k];
    }
    
    config[keys[keys.length - 1]] = value;
    this.emit('config:changed', { key, value });
    return this;
  }

  /**
   * Check if configuration has key
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Delete configuration value
   */
  delete(key) {
    const keys = key.split('.');
    let config = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in config) || typeof config[k] !== 'object') {
        return false;
      }
      config = config[k];
    }
    
    delete config[keys[keys.length - 1]];
    return true;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.config = { ...this.defaults };
    this.emit('config:reset');
    return this;
  }
  
  /**
   * Merge configuration
   */
  mergeConfig(newConfig) {
    this.config = this.mergeDeep(this.config, newConfig);
    this.emit('config:merged', newConfig);
    return this;
  }
  
  /**
   * Export configuration as JSON string
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }
  
  /**
   * Import configuration from JSON string
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.config = this.mergeDeep(this.defaults, imported);
      return true;
    } catch (error) {
      logger.error('Failed to import configuration:', error);
      return false;
    }
  }
  
  /**
   * Deep merge utility (alias for mergeDeep)
   */
  deepMerge(target, source) {
    return this.mergeDeep(target, source);
  }

  /**
   * Merge configurations deeply
   */
  mergeDeep(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    // Check required fields
    if (!this.config.framework || !this.config.framework.name) {
      errors.push('Missing framework.name');
    }
    
    if (!this.config.framework || !this.config.framework.version) {
      errors.push('Missing framework version');
    }
    
    // Check paths
    if (!this.config.paths || !this.config.paths.home) {
      errors.push('Missing required path: home');
    }
    
    // Check performance limits
    if (this.config.performance) {
      if (this.config.performance.maxMemoryMB && this.config.performance.maxMemoryMB < 50) {
        errors.push('Invalid memory limit: must be at least 50MB');
      }
      if (this.config.performance.maxConcurrentAgents && this.config.performance.maxConcurrentAgents < 1) {
        errors.push('Invalid agent limit: must be at least 1');
      }
    }
    
    // Check types
    if (this.config.logging && typeof this.config.logging.level !== 'string') {
      errors.push('logging.level must be a string');
    }
    
    if (this.config.performance && typeof this.config.performance.maxConcurrency !== 'number') {
      errors.push('performance.maxConcurrency must be a number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Load from environment variables
   */
  loadFromEnv() {
    // Map environment variables to config
    const envMappings = {
      'BUMBA_LOG_LEVEL': 'logging.level',
      'BUMBA_CACHE_ENABLED': 'performance.cacheEnabled',
      'BUMBA_MAX_CONCURRENCY': 'performance.maxConcurrency',
      'BUMBA_SECURITY_ENABLED': 'security.enabled'
    };
    
    Object.entries(envMappings).forEach(([envVar, configKey]) => {
      if (process.env[envVar]) {
        let value = process.env[envVar];
        
        // Convert to appropriate type
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = Number(value);
        
        this.set(configKey, value);
      }
    });
    
    return this;
  }

  /**
   * Watch configuration file for changes
   */
  watch(callback) {
    if (!fs.existsSync(this.configPath)) {
      logger.warn('Cannot watch non-existent config file');
      return null;
    }
    
    return fs.watch(this.configPath, (eventType) => {
      if (eventType === 'change') {
        this.load();
        if (callback) callback(this.config);
      }
    });
  }
}

// Singleton instance
let instance;

function getInstance(options) {
  if (!instance) {
    instance = new ConfigurationManager(options);
  }
  return instance;
}

module.exports = {
  ConfigurationManager,
  getInstance,
  configManager: getInstance()
};