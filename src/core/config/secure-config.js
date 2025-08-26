/**
 * Secure Configuration Manager
 * Centralizes all environment variable access with security controls
 * Sprint 4 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');

class SecureConfigManager {
  constructor() {
    // Initialize configuration on first load
    this._config = null;
    this._sensitiveKeys = new Set();
    this._publicKeys = new Set();
    this._loaded = false;
    
    // Define sensitive keys that should never be logged
    this.defineSensitiveKeys([
      'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE',
      'CREDENTIAL', 'AUTH', 'CERT', 'KEY', 'SALT', 'HASH'
    ]);
    
    // Define public keys that are safe to log
    this.definePublicKeys([
      'NODE_ENV', 'PORT', 'HOST', 'LOG_LEVEL', 'DEBUG',
      'BUMBA_OFFLINE', 'BUMBA_FAST_START', 'SKIP_API_INIT'
    ]);
  }

  /**
   * Load configuration from environment
   * This should be called once at startup
   */
  load() {
    if (this._loaded) {
      return this._config;
    }

    this._config = {};
    
    // Load all environment variables
    for (const [key, value] of Object.entries(process.env)) {
      this._config[key] = value;
    }
    
    // Freeze config to prevent modifications
    Object.freeze(this._config);
    this._loaded = true;
    
    // Log safe configuration info
    this.logSafeConfig();
    
    return this._config;
  }

  /**
   * Get configuration value safely
   */
  get(key, defaultValue = undefined) {
    if (!this._loaded) {
      this.load();
    }
    
    const value = this._config[key];
    
    // Track access for security auditing (in debug mode only)
    if (process.env.LOG_LEVEL === 'DEBUG' && this.isSensitive(key)) {
      logger.debug(`Sensitive config accessed: ${key} (value hidden)`);
    }
    
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get multiple configuration values
   */
  getMultiple(keys, defaults = {}) {
    const result = {};
    
    for (const key of keys) {
      result[key] = this.get(key, defaults[key]);
    }
    
    return result;
  }

  /**
   * Check if a key exists
   */
  has(key) {
    if (!this._loaded) {
      this.load();
    }
    
    return key in this._config;
  }

  /**
   * Get all configuration (with sensitive values redacted)
   */
  getSafeConfig() {
    if (!this._loaded) {
      this.load();
    }
    
    const safe = {};
    
    for (const [key, value] of Object.entries(this._config)) {
      if (this.isSensitive(key)) {
        safe[key] = '[REDACTED]';
      } else {
        safe[key] = value;
      }
    }
    
    return safe;
  }

  /**
   * Check if a key contains sensitive data
   */
  isSensitive(key) {
    if (!key) return false;
    
    const upperKey = key.toUpperCase();
    
    // Check explicit sensitive keys
    if (this._sensitiveKeys.has(upperKey)) {
      return true;
    }
    
    // Check if key contains sensitive patterns
    for (const pattern of this._sensitiveKeys) {
      if (upperKey.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a key is safe to log
   */
  isPublic(key) {
    if (!key) return false;
    
    const upperKey = key.toUpperCase();
    return this._publicKeys.has(upperKey);
  }

  /**
   * Define sensitive keys
   */
  defineSensitiveKeys(keys) {
    for (const key of keys) {
      this._sensitiveKeys.add(key.toUpperCase());
    }
  }

  /**
   * Define public keys
   */
  definePublicKeys(keys) {
    for (const key of keys) {
      this._publicKeys.add(key.toUpperCase());
    }
  }

  /**
   * Log safe configuration info
   */
  logSafeConfig() {
    const safeItems = [];
    
    for (const key of this._publicKeys) {
      if (this.has(key)) {
        safeItems.push(`${key}=${this.get(key)}`);
      }
    }
    
    if (safeItems.length > 0 && process.env.LOG_LEVEL !== 'ERROR') {
      logger.info('Configuration loaded (safe values only):', safeItems.join(', '));
    }
  }

  /**
   * Validate required configuration
   */
  validateRequired(requiredKeys) {
    const missing = [];
    
    for (const key of requiredKeys) {
      if (!this.has(key)) {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Get configuration for specific service
   */
  getServiceConfig(service) {
    const configs = {
      // Database configuration
      database: {
        host: this.get('DB_HOST', 'localhost'),
        port: this.get('DB_PORT', 5432),
        database: this.get('DB_NAME', 'bumba'),
        user: this.get('DB_USER', 'bumba'),
        password: this.get('DB_PASSWORD'),
        ssl: this.get('DB_SSL', 'false') === 'true'
      },
      
      // Redis configuration
      redis: {
        host: this.get('REDIS_HOST', 'localhost'),
        port: this.get('REDIS_PORT', 6379),
        password: this.get('REDIS_PASSWORD'),
        db: this.get('REDIS_DB', 0)
      },
      
      // API Keys (centralized)
      apiKeys: {
        openai: this.get('OPENAI_API_KEY'),
        anthropic: this.get('ANTHROPIC_API_KEY'),
        groq: this.get('GROQ_API_KEY'),
        deepseek: this.get('DEEPSEEK_API_KEY'),
        qwen: this.get('QWEN_API_KEY'),
        gemini: this.get('GEMINI_API_KEY'),
        discord: this.get('DISCORD_TOKEN'),
        notion: this.get('NOTION_API_KEY'),
        figma: this.get('FIGMA_TOKEN'),
        github: this.get('GITHUB_TOKEN')
      },
      
      // Application settings
      app: {
        env: this.get('NODE_ENV', 'development'),
        port: parseInt(this.get('PORT', 3000)),
        host: this.get('HOST', '0.0.0.0'),
        logLevel: this.get('LOG_LEVEL', 'INFO'),
        debug: this.get('DEBUG', 'false') === 'true'
      },
      
      // BUMBA specific
      bumba: {
        offline: this.get('BUMBA_OFFLINE', 'false') === 'true',
        fastStart: this.get('BUMBA_FAST_START', 'false') === 'true',
        skipApiInit: this.get('SKIP_API_INIT', 'false') === 'true',
        maxPoolSize: parseInt(this.get('MAX_POOL_SIZE', 10)),
        memoryThreshold: parseInt(this.get('MEMORY_THRESHOLD', 100))
      },
      
      // MCP configuration
      mcp: {
        enabled: this.get('MCP_ENABLED', 'false') === 'true',
        servers: this.get('MCP_SERVERS', '').split(',').filter(Boolean),
        timeout: parseInt(this.get('MCP_TIMEOUT', 30000))
      }
    };
    
    return configs[service] || {};
  }

  /**
   * Check if running in specific environment
   */
  isEnvironment(env) {
    return this.get('NODE_ENV', 'development') === env;
  }

  /**
   * Quick helpers
   */
  isDevelopment() {
    return this.isEnvironment('development');
  }

  isProduction() {
    return this.isEnvironment('production');
  }

  isTesting() {
    return this.isEnvironment('test');
  }

  isDebug() {
    return this.get('DEBUG', 'false') === 'true' || 
           this.get('LOG_LEVEL') === 'DEBUG';
  }

  isOffline() {
    return this.get('BUMBA_OFFLINE', 'false') === 'true';
  }

  /**
   * Get safe API key (returns whether key exists, not the key itself)
   */
  hasApiKey(service) {
    const apiKeys = this.getServiceConfig('apiKeys');
    return !!apiKeys[service];
  }

  /**
   * Get API key with warning
   */
  getApiKey(service) {
    const apiKeys = this.getServiceConfig('apiKeys');
    const key = apiKeys[service];
    
    if (!key && !this.isOffline()) {
      logger.warn(`API key for ${service} not found. Service may not work.`);
    }
    
    return key;
  }

  /**
   * Export safe configuration for logging/debugging
   * NEVER use this for actual configuration access
   */
  toJSON() {
    return this.getSafeConfig();
  }

  /**
   * Prevent accidental logging of entire config object
   */
  toString() {
    return '[SecureConfigManager - use .get() to access values]';
  }

  /**
   * Prevent console.log from exposing sensitive data
   */
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toString();
  }
}

// Create singleton instance
const configManager = new SecureConfigManager();

// Helper functions for backward compatibility
const config = {
  get: (key, defaultValue) => configManager.get(key, defaultValue),
  has: (key) => configManager.has(key),
  getServiceConfig: (service) => configManager.getServiceConfig(service),
  isDevelopment: () => configManager.isDevelopment(),
  isProduction: () => configManager.isProduction(),
  isTesting: () => configManager.isTesting(),
  isDebug: () => configManager.isDebug(),
  isOffline: () => configManager.isOffline(),
  hasApiKey: (service) => configManager.hasApiKey(service),
  getApiKey: (service) => configManager.getApiKey(service)
};

// Export both the manager and helper functions
module.exports = {
  configManager,
  config,
  SecureConfigManager
};