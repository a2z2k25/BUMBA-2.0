/**
 * BUMBA API Key Validation Framework
 * Secure validation and management of API keys without making actual connections
 */

const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');

class ApiKeyValidator {
  constructor() {
    this.validationRules = new Map();
    this.keyStorage = new Map();
    this.validationCache = new Map();
    this.securityPolicies = {
      maskKeys: true,
      encryptStorage: true,
      rotationReminders: true,
      expiryTracking: true
    };
    
    this.initializeValidationRules();
  }

  /**
   * Initialize validation rules for different API key formats
   */
  initializeValidationRules() {
    // Notion API Key
    this.validationRules.set('notion', {
      pattern: /^secret_[A-Za-z0-9]{43}$/,
      prefix: 'secret_',
      length: 50,
      charset: 'alphanumeric',
      example: 'secret_' + 'x'.repeat(43),
      description: 'Notion API keys start with "secret_" followed by 43 characters'
    });
    
    // GitHub Token
    this.validationRules.set('github', {
      patterns: [
        { type: 'classic', pattern: /^ghp_[A-Za-z0-9]{36}$/, prefix: 'ghp_' },
        { type: 'fine-grained', pattern: /^github_pat_[A-Za-z0-9_]{82}$/, prefix: 'github_pat_' },
        { type: 'oauth', pattern: /^gho_[A-Za-z0-9]{36}$/, prefix: 'gho_' },
        { type: 'app', pattern: /^ghs_[A-Za-z0-9]{36}$/, prefix: 'ghs_' }
      ],
      description: 'GitHub tokens can be classic (ghp_), fine-grained (github_pat_), OAuth (gho_), or app (ghs_)'
    });
    
    // OpenAI API Key
    this.validationRules.set('openai', {
      pattern: /^sk-[A-Za-z0-9]{48}$/,
      prefix: 'sk-',
      length: 51,
      charset: 'alphanumeric',
      example: 'sk-' + 'x'.repeat(48),
      description: 'OpenAI API keys start with "sk-" followed by 48 characters'
    });
    
    // Anthropic API Key
    this.validationRules.set('anthropic', {
      pattern: /^sk-ant-api[0-9]{2}-[A-Za-z0-9\-_]{80,}$/,
      prefix: 'sk-ant-api',
      minLength: 95,
      charset: 'alphanumeric-dash-underscore',
      example: 'sk-ant-api03-' + 'x'.repeat(80),
      description: 'Anthropic API keys start with "sk-ant-api" followed by version and characters'
    });
    
    // PostgreSQL Connection String
    this.validationRules.set('postgres', {
      pattern: /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+/,
      type: 'connection-string',
      components: ['protocol', 'username', 'password', 'host', 'port', 'database'],
      example: 'postgresql://user:password@localhost:5432/dbname',
      description: 'PostgreSQL connection string format'
    });
    
    // MongoDB Connection String
    this.validationRules.set('mongodb', {
      pattern: /^mongodb(\+srv)?:\/\/[^:]+:[^@]+@.+/,
      type: 'connection-string',
      components: ['protocol', 'username', 'password', 'host'],
      example: 'mongodb://user:password@localhost:27017/dbname',
      description: 'MongoDB connection string format'
    });
    
    // Redis Connection String
    this.validationRules.set('redis', {
      patterns: [
        { type: 'simple', pattern: /^redis:\/\/[^:]+:\d+$/ },
        { type: 'auth', pattern: /^redis:\/\/:[^@]+@[^:]+:\d+$/ },
        { type: 'full', pattern: /^redis:\/\/[^:]+:[^@]+@[^:]+:\d+$/ }
      ],
      example: 'redis://localhost:6379 or redis://:password@localhost:6379',
      description: 'Redis connection string format'
    });
    
    // Docker Registry Credentials
    this.validationRules.set('docker', {
      type: 'credentials',
      fields: {
        registry: { pattern: /^[a-z0-9\-\.]+$/, required: false },
        username: { pattern: /^[a-zA-Z0-9\-_]+$/, required: true },
        password: { minLength: 8, required: true }
      },
      description: 'Docker registry credentials'
    });
    
    // Figma Access Token
    this.validationRules.set('figma', {
      pattern: /^[A-Za-z0-9\-_]{40,}$/,
      minLength: 40,
      charset: 'alphanumeric-dash-underscore',
      example: 'figd_' + 'x'.repeat(40),
      description: 'Figma personal access tokens'
    });
    
    // Pinecone API Key
    this.validationRules.set('pinecone', {
      pattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      type: 'uuid',
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      description: 'Pinecone API keys are UUID format'
    });
    
    // Generic API Key
    this.validationRules.set('generic', {
      minLength: 20,
      maxLength: 200,
      charset: 'printable',
      description: 'Generic API key validation'
    });
  }

  /**
   * Validate an API key
   */
  validateApiKey(service, key, options = {}) {
    if (!key || typeof key !== 'string') {
      return {
        valid: false,
        error: 'API key is required and must be a string',
        service
      };
    }
    
    // Check cache
    const cacheKey = `${service}:${this.hashKey(key)}`;
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.result;
      }
    }
    
    const rules = this.validationRules.get(service) || this.validationRules.get('generic');
    const result = this.applyValidationRules(key, rules, service);
    
    // Add security checks
    if (result.valid && !options.skipSecurityChecks) {
      const securityCheck = this.performSecurityChecks(key, service);
      if (!securityCheck.passed) {
        result.valid = false;
        result.securityIssues = securityCheck.issues;
      }
    }
    
    // Cache result
    this.validationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    // Log validation attempt (without exposing the key)
    logger.info(`API key validation for ${service}: ${result.valid ? '🏁' : '🔴'}`);
    
    return result;
  }

  /**
   * Apply validation rules to a key
   */
  applyValidationRules(key, rules, service) {
    const result = {
      valid: true,
      service,
      checks: []
    };
    
    // Handle multiple pattern types
    if (rules.patterns && Array.isArray(rules.patterns)) {
      let matched = false;
      for (const patternRule of rules.patterns) {
        if (patternRule.pattern.test(key)) {
          matched = true;
          result.type = patternRule.type;
          result.checks.push({
            name: 'pattern',
            passed: true,
            message: `Matches ${patternRule.type} format`
          });
          break;
        }
      }
      
      if (!matched) {
        result.valid = false;
        result.error = `Key does not match any valid ${service} format`;
        result.checks.push({
          name: 'pattern',
          passed: false,
          message: 'No pattern match'
        });
      }
    }
    
    // Single pattern validation
    else if (rules.pattern) {
      if (!rules.pattern.test(key)) {
        result.valid = false;
        result.error = `Invalid ${service} API key format`;
        result.checks.push({
          name: 'pattern',
          passed: false,
          message: 'Pattern mismatch'
        });
      } else {
        result.checks.push({
          name: 'pattern',
          passed: true,
          message: 'Pattern matched'
        });
      }
    }
    
    // Length validation
    if (rules.length && key.length !== rules.length) {
      result.valid = false;
      result.error = `${service} key should be ${rules.length} characters`;
      result.checks.push({
        name: 'length',
        passed: false,
        message: `Expected ${rules.length}, got ${key.length}`
      });
    } else if (rules.minLength && key.length < rules.minLength) {
      result.valid = false;
      result.error = `${service} key should be at least ${rules.minLength} characters`;
      result.checks.push({
        name: 'minLength',
        passed: false,
        message: `Expected >= ${rules.minLength}, got ${key.length}`
      });
    } else if (rules.maxLength && key.length > rules.maxLength) {
      result.valid = false;
      result.error = `${service} key should be at most ${rules.maxLength} characters`;
      result.checks.push({
        name: 'maxLength',
        passed: false,
        message: `Expected <= ${rules.maxLength}, got ${key.length}`
      });
    }
    
    // Prefix validation
    if (rules.prefix && !key.startsWith(rules.prefix)) {
      result.valid = false;
      result.error = `${service} key should start with "${rules.prefix}"`;
      result.checks.push({
        name: 'prefix',
        passed: false,
        message: `Missing prefix "${rules.prefix}"`
      });
    }
    
    // Connection string validation
    if (rules.type === 'connection-string') {
      const connectionCheck = this.validateConnectionString(key, rules);
      if (!connectionCheck.valid) {
        result.valid = false;
        result.error = connectionCheck.error;
      }
      result.checks.push(...connectionCheck.checks);
    }
    
    // Credentials validation
    if (rules.type === 'credentials') {
      const credCheck = this.validateCredentials(key, rules);
      if (!credCheck.valid) {
        result.valid = false;
        result.error = credCheck.error;
      }
      result.checks.push(...credCheck.checks);
    }
    
    // Add format hint if validation failed
    if (!result.valid && rules.example) {
      result.hint = `Expected format: ${rules.example}`;
    }
    
    if (!result.valid && rules.description) {
      result.description = rules.description;
    }
    
    return result;
  }

  /**
   * Validate connection string format
   */
  validateConnectionString(connectionString, rules) {
    const result = {
      valid: true,
      checks: []
    };
    
    try {
      const url = new URL(connectionString);
      
      // Check protocol
      if (rules.protocol && !connectionString.startsWith(rules.protocol)) {
        result.valid = false;
        result.error = `Invalid protocol`;
        result.checks.push({
          name: 'protocol',
          passed: false,
          message: `Expected ${rules.protocol}`
        });
      }
      
      // Check for required components
      if (rules.components) {
        if (rules.components.includes('username') && !url.username) {
          result.valid = false;
          result.error = 'Missing username';
        }
        if (rules.components.includes('password') && !url.password) {
          result.valid = false;
          result.error = 'Missing password';
        }
        if (rules.components.includes('host') && !url.hostname) {
          result.valid = false;
          result.error = 'Missing host';
        }
        if (rules.components.includes('port') && !url.port) {
          result.valid = false;
          result.error = 'Missing port';
        }
      }
      
      result.checks.push({
        name: 'url-format',
        passed: result.valid,
        message: result.valid ? 'Valid URL format' : 'Invalid URL components'
      });
      
    } catch (error) {
      result.valid = false;
      result.error = 'Invalid connection string format';
      result.checks.push({
        name: 'url-parse',
        passed: false,
        message: 'Failed to parse as URL'
      });
    }
    
    return result;
  }

  /**
   * Validate credentials format
   */
  validateCredentials(credentials, rules) {
    const result = {
      valid: true,
      checks: []
    };
    
    // Parse if string
    let creds = credentials;
    if (typeof credentials === 'string') {
      try {
        creds = JSON.parse(credentials);
      } catch {
        result.valid = false;
        result.error = 'Invalid credentials format';
        return result;
      }
    }
    
    // Check required fields
    for (const [field, fieldRules] of Object.entries(rules.fields)) {
      if (fieldRules.required && !creds[field]) {
        result.valid = false;
        result.error = `Missing required field: ${field}`;
        result.checks.push({
          name: field,
          passed: false,
          message: 'Required field missing'
        });
      } else if (creds[field]) {
        // Validate field format
        if (fieldRules.pattern && !fieldRules.pattern.test(creds[field])) {
          result.valid = false;
          result.error = `Invalid ${field} format`;
          result.checks.push({
            name: field,
            passed: false,
            message: 'Format mismatch'
          });
        } else if (fieldRules.minLength && creds[field].length < fieldRules.minLength) {
          result.valid = false;
          result.error = `${field} too short`;
          result.checks.push({
            name: field,
            passed: false,
            message: `Minimum length ${fieldRules.minLength}`
          });
        } else {
          result.checks.push({
            name: field,
            passed: true,
            message: 'Valid'
          });
        }
      }
    }
    
    return result;
  }

  /**
   * Perform security checks on API key
   */
  performSecurityChecks(key, service) {
    const issues = [];
    
    // Check for common weak patterns
    if (key.includes('test') || key.includes('demo') || key.includes('example')) {
      issues.push('Key contains test/demo/example - may not be production key');
    }
    
    // Check for all same character
    if (/^(.)\1+$/.test(key)) {
      issues.push('Key contains repeated characters - likely invalid');
    }
    
    // Check for sequential characters
    if (/012345|123456|abcdef|qwerty/i.test(key)) {
      issues.push('Key contains sequential characters - possibly weak');
    }
    
    // Check for exposed in common locations
    if (this.checkIfExposedInCode(key)) {
      issues.push('Key may be exposed in code - security risk');
    }
    
    // Check entropy (simplified)
    const entropy = this.calculateEntropy(key);
    if (entropy < 3.0) {
      issues.push('Key has low entropy - possibly weak');
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Check if key is exposed in code (simplified check)
   */
  checkIfExposedInCode(key) {
    // Check common file patterns where keys shouldn't be
    const riskyFiles = [
      path.join(process.cwd(), 'README.md'),
      path.join(process.cwd(), 'package.json'),
      path.join(process.cwd(), '.git/config')
    ];
    
    for (const file of riskyFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(key)) {
            return true;
          }
        } catch {
          // Ignore read errors
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate entropy of a string
   */
  calculateEntropy(str) {
    const freq = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = str.length;
    
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  /**
   * Hash a key for caching (secure)
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Mask an API key for display
   */
  maskApiKey(key, service) {
    if (!key || !this.securityPolicies.maskKeys) return key;
    
    const rules = this.validationRules.get(service);
    
    // Keep prefix if exists
    if (rules && rules.prefix) {
      const prefixLen = rules.prefix.length;
      return rules.prefix + '*'.repeat(Math.min(key.length - prefixLen, 20)) + key.slice(-4);
    }
    
    // For connection strings, mask password
    if (key.includes('://') && key.includes('@')) {
      return key.replace(/(:\/\/[^:]*:)[^@]+(@)/, '$1****$2');
    }
    
    // Default masking - show first 4 and last 4
    if (key.length > 12) {
      return key.slice(0, 4) + '*'.repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
    }
    
    return '*'.repeat(key.length);
  }

  /**
   * Store an API key securely
   */
  storeApiKey(service, key, metadata = {}) {
    const validation = this.validateApiKey(service, key);
    
    if (!validation.valid) {
      throw new Error(`Invalid ${service} API key: ${validation.error}`);
    }
    
    const stored = {
      service,
      hashedKey: this.hashKey(key),
      masked: this.maskApiKey(key, service),
      storedAt: Date.now(),
      metadata,
      validation
    };
    
    // Encrypt if policy enabled (simplified - in production use proper encryption)
    if (this.securityPolicies.encryptStorage) {
      stored.encrypted = this.simpleEncrypt(key);
    } else {
      stored.key = key; // Not recommended
    }
    
    this.keyStorage.set(service, stored);
    
    logger.info(`API key stored for ${service}: ${stored.masked}`);
    
    // Set rotation reminder if enabled
    if (this.securityPolicies.rotationReminders) {
      this.setRotationReminder(service, metadata.rotationDays || 90);
    }
    
    return {
      success: true,
      service,
      masked: stored.masked
    };
  }

  /**
   * Simple encryption (for demonstration - use proper encryption in production)
   */
  simpleEncrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('bumba-secret-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      data: encrypted
    };
  }

  /**
   * Simple decryption
   */
  simpleDecrypt(encrypted) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('bumba-secret-key', 'salt', 32);
    const iv = Buffer.from(encrypted.iv, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Set rotation reminder
   */
  setRotationReminder(service, days) {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + days);
    
    logger.info(`API key rotation reminder set for ${service}: ${reminderDate.toISOString()}`);
  }

  /**
   * Validate all stored keys
   */
  validateAllKeys() {
    const results = {
      valid: [],
      invalid: [],
      expiring: [],
      total: this.keyStorage.size
    };
    
    for (const [service, stored] of this.keyStorage) {
      // Re-validate
      let key;
      if (stored.encrypted) {
        key = this.simpleDecrypt(stored.encrypted);
      } else if (stored.key) {
        key = stored.key;
      } else {
        results.invalid.push({
          service,
          error: 'No key data available'
        });
        continue;
      }
      
      const validation = this.validateApiKey(service, key);
      
      if (validation.valid) {
        results.valid.push(service);
        
        // Check expiry
        const age = Date.now() - stored.storedAt;
        const rotationDays = stored.metadata.rotationDays || 90;
        if (age > rotationDays * 24 * 60 * 60 * 1000) {
          results.expiring.push({
            service,
            age: Math.floor(age / (24 * 60 * 60 * 1000)),
            recommendedRotation: rotationDays
          });
        }
      } else {
        results.invalid.push({
          service,
          error: validation.error
        });
      }
    }
    
    return results;
  }

  /**
   * Get validation rules for a service
   */
  getValidationRules(service) {
    return this.validationRules.get(service) || this.validationRules.get('generic');
  }

  /**
   * Get all supported services
   */
  getSupportedServices() {
    return Array.from(this.validationRules.keys()).filter(k => k !== 'generic');
  }

  /**
   * Generate example key for a service
   */
  generateExampleKey(service) {
    const rules = this.validationRules.get(service);
    
    if (!rules) {
      return 'No example available';
    }
    
    if (rules.example) {
      return rules.example;
    }
    
    if (rules.prefix && rules.length) {
      const remainingLength = rules.length - rules.prefix.length;
      return rules.prefix + 'x'.repeat(remainingLength);
    }
    
    return 'See documentation for format';
  }

  /**
   * Export validation report
   */
  exportValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      services: {},
      summary: {
        total: this.keyStorage.size,
        valid: 0,
        invalid: 0
      }
    };
    
    for (const [service, stored] of this.keyStorage) {
      report.services[service] = {
        status: stored.validation.valid ? 'valid' : 'invalid',
        masked: stored.masked,
        age: Math.floor((Date.now() - stored.storedAt) / (24 * 60 * 60 * 1000)) + ' days',
        lastValidated: new Date(stored.storedAt).toISOString()
      };
      
      if (stored.validation.valid) {
        report.summary.valid++;
      } else {
        report.summary.invalid++;
      }
    }
    
    return report;
  }
}

// Export singleton instance
module.exports = new ApiKeyValidator();