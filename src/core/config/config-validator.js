/**
 * BUMBA Configuration Validator
 * Ensures all required environment variables and settings are properly configured
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ConfigValidator extends EventEmitter {
  constructor() {
    super();
    
    this.requiredVars = [
      'NODE_ENV',
      'BUMBA_HOME',
      'BUMBA_LOG_LEVEL',
      'BUMBA_MEMORY_LIMIT',
      'BUMBA_API_KEY'
    ];
    
    this.optionalVars = [
      'BUMBA_MCP_TIMEOUT',
      'BUMBA_CACHE_TTL',
      'BUMBA_DEBUG',
      'BUMBA_PORT',
      'BUMBA_HOST',
      'BUMBA_SSL_CERT',
      'BUMBA_SSL_KEY',
      'BUMBA_RATE_LIMIT',
      'BUMBA_MAX_CONNECTIONS',
      'BUMBA_AUDIT_LOG_PATH',
      'BUMBA_ENABLE_METRICS'
    ];
    
    this.validationRules = {
      NODE_ENV: {
        values: ['development', 'staging', 'production'],
        message: 'NODE_ENV must be one of: development, staging, production'
      },
      BUMBA_HOME: {
        validator: (value) => fs.existsSync(value),
        message: 'BUMBA_HOME must be a valid directory path'
      },
      BUMBA_LOG_LEVEL: {
        values: ['error', 'warn', 'info', 'debug', 'trace'],
        message: 'BUMBA_LOG_LEVEL must be one of: error, warn, info, debug, trace'
      },
      BUMBA_MEMORY_LIMIT: {
        validator: (value) => {
          const limit = parseInt(value);
          return !isNaN(limit) && limit >= 256;
        },
        message: 'BUMBA_MEMORY_LIMIT must be at least 256 (MB)'
      },
      BUMBA_API_KEY: {
        validator: (value) => value && value.length >= 32,
        message: 'BUMBA_API_KEY must be at least 32 characters'
      },
      BUMBA_PORT: {
        validator: (value) => {
          const port = parseInt(value);
          return !isNaN(port) && port > 0 && port < 65536;
        },
        message: 'BUMBA_PORT must be a valid port number (1-65535)'
      },
      BUMBA_RATE_LIMIT: {
        validator: (value) => {
          const limit = parseInt(value);
          return !isNaN(limit) && limit > 0;
        },
        message: 'BUMBA_RATE_LIMIT must be a positive number'
      }
    };
    
    this.securityRules = {
      BUMBA_API_KEY: {
        pattern: /^[a-zA-Z0-9_-]{32,}$/,
        message: 'API key contains invalid characters'
      },
      BUMBA_SSL_CERT: {
        validator: (value) => {
          if (!value) {return true;}
          return fs.existsSync(value) && value.endsWith('.pem');
        },
        message: 'SSL certificate file must exist and have .pem extension'
      },
      BUMBA_SSL_KEY: {
        validator: (value) => {
          if (!value) {return true;}
          return fs.existsSync(value) && value.endsWith('.pem');
        },
        message: 'SSL key file must exist and have .pem extension'
      }
    };
  }

  /**
   * Validate configuration
   */
  validate(env = process.env) {
    const errors = [];
    const warnings = [];
    const config = {};
    
    // Check required variables
    for (const varName of this.requiredVars) {
      const value = env[varName];
      
      if (!value) {
        errors.push({
          type: 'missing',
          variable: varName,
          message: `Missing required environment variable: ${varName}`
        });
        continue;
      }
      
      // Validate value
      const validation = this.validateValue(varName, value);
      if (!validation.valid) {
        errors.push({
          type: 'invalid',
          variable: varName,
          message: validation.message
        });
      } else {
        config[varName] = value;
      }
    }
    
    // Check optional variables
    for (const varName of this.optionalVars) {
      const value = env[varName];
      
      if (!value) {
        warnings.push({
          type: 'missing',
          variable: varName,
          message: `Optional variable not set: ${varName}`
        });
      } else {
        const validation = this.validateValue(varName, value);
        if (!validation.valid) {
          errors.push({
            type: 'invalid',
            variable: varName,
            message: validation.message
          });
        } else {
          config[varName] = value;
        }
      }
    }
    
    // Security checks
    const securityIssues = this.validateSecurity(config);
    errors.push(...securityIssues);
    
    // Cross-variable validation
    const crossValidation = this.validateCrossVariables(config);
    errors.push(...crossValidation.errors);
    warnings.push(...crossValidation.warnings);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config
    };
  }

  /**
   * Validate individual value
   */
  validateValue(varName, value) {
    const rule = this.validationRules[varName];
    if (!rule) {return { valid: true };}
    
    if (rule.values && !rule.values.includes(value)) {
      return {
        valid: false,
        message: rule.message
      };
    }
    
    if (rule.validator && !rule.validator(value)) {
      return {
        valid: false,
        message: rule.message
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate security settings
   */
  validateSecurity(config) {
    const errors = [];
    
    for (const [varName, rule] of Object.entries(this.securityRules)) {
      const value = config[varName];
      if (!value) {continue;}
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          type: 'security',
          variable: varName,
          message: rule.message
        });
      }
      
      if (rule.validator && !rule.validator(value)) {
        errors.push({
          type: 'security',
          variable: varName,
          message: rule.message
        });
      }
    }
    
    return errors;
  }

  /**
   * Cross-variable validation
   */
  validateCrossVariables(config) {
    const errors = [];
    const warnings = [];
    
    // SSL validation
    if (config.BUMBA_SSL_CERT && !config.BUMBA_SSL_KEY) {
      errors.push({
        type: 'dependency',
        message: 'BUMBA_SSL_CERT requires BUMBA_SSL_KEY to be set'
      });
    }
    
    if (config.BUMBA_SSL_KEY && !config.BUMBA_SSL_CERT) {
      errors.push({
        type: 'dependency',
        message: 'BUMBA_SSL_KEY requires BUMBA_SSL_CERT to be set'
      });
    }
    
    // Production specific checks
    if (config.NODE_ENV === 'production') {
      if (config.BUMBA_DEBUG === 'true') {
        warnings.push({
          type: 'production',
          message: 'Debug mode is enabled in production'
        });
      }
      
      if (config.BUMBA_LOG_LEVEL === 'debug' || config.BUMBA_LOG_LEVEL === 'trace') {
        warnings.push({
          type: 'production',
          message: 'Verbose logging is enabled in production'
        });
      }
      
      if (!config.BUMBA_SSL_CERT) {
        warnings.push({
          type: 'production',
          message: 'SSL is not configured for production'
        });
      }
    }
    
    // Memory vs system checks
    if (config.BUMBA_MEMORY_LIMIT) {
      const limit = parseInt(config.BUMBA_MEMORY_LIMIT);
      const totalMemory = require('os').totalmem() / 1024 / 1024; // MB
      
      if (limit > totalMemory * 0.8) {
        warnings.push({
          type: 'resource',
          message: `Memory limit (${limit}MB) is more than 80% of system memory (${Math.round(totalMemory)}MB)`
        });
      }
    }
    
    return { errors, warnings };
  }

  /**
   * Validate production configuration
   */
  validateProduction(env = process.env) {
    const result = this.validate(env);
    
    // Additional production checks
    if (env.NODE_ENV !== 'production') {
      result.errors.push({
        type: 'environment',
        message: 'NODE_ENV must be "production" for production deployment'
      });
    }
    
    if (!env.BUMBA_API_KEY || env.BUMBA_API_KEY.length < 32) {
      result.errors.push({
        type: 'security',
        variable: 'BUMBA_API_KEY',
        message: 'BUMBA_API_KEY must be at least 32 characters in production'
      });
    }
    
    // Check for default values
    const defaults = {
      BUMBA_API_KEY: ['changeme', 'default', 'test', 'demo'],
      BUMBA_ADMIN_PASSWORD: ['admin', 'password', '123456']
    };
    
    for (const [varName, defaultValues] of Object.entries(defaults)) {
      const value = env[varName];
      if (value && defaultValues.includes(value.toLowerCase())) {
        result.errors.push({
          type: 'security',
          variable: varName,
          message: `${varName} appears to be using a default value`
        });
      }
    }
    
    return result;
  }

  /**
   * Generate sample configuration
   */
  generateSample(environment = 'development') {
    const sample = {
      NODE_ENV: environment,
      BUMBA_HOME: path.join(process.env.HOME || '/home/user', '.bumba'),
      BUMBA_LOG_LEVEL: environment === 'production' ? 'info' : 'debug',
      BUMBA_MEMORY_LIMIT: '512',
      BUMBA_API_KEY: this.generateApiKey(),
      BUMBA_MCP_TIMEOUT: '60000',
      BUMBA_CACHE_TTL: '3600000',
      BUMBA_DEBUG: environment !== 'production' ? 'true' : 'false',
      BUMBA_PORT: '3000',
      BUMBA_HOST: '0.0.0.0',
      BUMBA_RATE_LIMIT: '100',
      BUMBA_MAX_CONNECTIONS: '1000',
      BUMBA_ENABLE_METRICS: 'true'
    };
    
    if (environment === 'production') {
      sample.BUMBA_SSL_CERT = '/path/to/cert.pem';
      sample.BUMBA_SSL_KEY = '/path/to/key.pem';
      sample.BUMBA_AUDIT_LOG_PATH = '/var/log/bumba/audit';
    }
    
    return sample;
  }

  /**
   * Generate API key
   */
  generateApiKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Write configuration to .env file
   */
  writeEnvFile(config, filePath = '.env') {
    const lines = [];
    
    lines.push('# BUMBA Configuration');
    lines.push(`# Generated at ${new Date().toISOString()}`);
    lines.push('');
    
    // Required variables
    lines.push('# Required Variables');
    for (const varName of this.requiredVars) {
      if (config[varName]) {
        lines.push(`${varName}=${config[varName]}`);
      }
    }
    
    lines.push('');
    lines.push('# Optional Variables');
    for (const varName of this.optionalVars) {
      if (config[varName]) {
        lines.push(`${varName}=${config[varName]}`);
      }
    }
    
    const content = lines.join('\n') + '\n';
    
    try {
      fs.writeFileSync(filePath, content, { mode: 0o600 }); // Secure file permissions
      return true;
    } catch (error) {
      this.emit('error', {
        type: 'file-write',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Load configuration from file
   */
  loadFromFile(filePath = '.env') {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const config = {};
      
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {continue;}
        
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
      
      return config;
    } catch (error) {
      this.emit('error', {
        type: 'file-read',
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get configuration report
   */
  getReport(env = process.env) {
    const validation = this.validate(env);
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV || 'unknown',
      valid: validation.valid,
      summary: {
        totalRequired: this.requiredVars.length,
        totalOptional: this.optionalVars.length,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      },
      errors: validation.errors,
      warnings: validation.warnings,
      configuration: Object.keys(validation.config).reduce((acc, key) => {
        acc[key] = key.includes('KEY') || key.includes('PASSWORD') 
          ? '[REDACTED]' 
          : validation.config[key];
        return acc;
      }, {})
    };
    
    return report;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ConfigValidator,
  
  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new ConfigValidator();
    }
    return instance;
  }
};