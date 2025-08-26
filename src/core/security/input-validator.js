/**
 * Input Validation System
 * Comprehensive validation for all user inputs
 * Sprint 11 - Security Fix
 */

const { logger } = require('../logging/bumba-logger');
const { errorTelemetry } = require('../error-boundaries/error-telemetry');
const { stateManager } = require('../state/global-state-manager');

class InputValidator {
  constructor() {
    // Validation rules
    this.rules = new Map();
    
    // Common patterns for detection
    this.dangerousPatterns = {
      sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|JOIN|ORDER BY|GROUP BY|HAVING)\b)/gi,
        /(\-\-|\/\*|\*\/|;|\||@@|@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|open|select|sys|sysobjects|syscolumns|table|update)/gi,
        /(\'|(\'|\'|\`)|(\-\-)|(\;)|(\|\|)|(\*)|(\+))/g,
        /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b)/gi
      ],
      xss: [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // Event handlers
        /<embed[^>]*>/gi,
        /<object[^>]*>/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
      ],
      commandInjection: [
        /(\||;|&|`|\$\(|\$\{|<|>|\\n|\\r)/g,
        /(rm|cat|ls|wget|curl|bash|sh|cmd|powershell|eval|exec)/gi,
        /\$\{.*\}/g, // Template injection
        /\$\(.*\)/g  // Command substitution
      ],
      pathTraversal: [
        /\.\.[\\\/]/g,
        /\.\.%2[fF]/g,
        /%2[eE]\./g,
        /\/{2,}/g
      ],
      ldapInjection: [
        /[()&|!=~*]/g,
        /\*/g
      ],
      noSQLInjection: [
        /\$where/gi,
        /\$ne/g,
        /\$gt/g,
        /\$lt/g,
        /\$gte/g,
        /\$lte/g,
        /\$in/g,
        /\$nin/g,
        /\$regex/g
      ]
    };
    
    // Type validators
    this.typeValidators = {
      string: (value, options = {}) => {
        if (typeof value !== 'string') return false;
        if (options.minLength && value.length < options.minLength) return false;
        if (options.maxLength && value.length > options.maxLength) return false;
        if (options.pattern && !options.pattern.test(value)) return false;
        if (options.enum && !options.enum.includes(value)) return false;
        return true;
      },
      
      number: (value, options = {}) => {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (options.min !== undefined && num < options.min) return false;
        if (options.max !== undefined && num > options.max) return false;
        if (options.integer && !Number.isInteger(num)) return false;
        return true;
      },
      
      boolean: (value) => {
        return typeof value === 'boolean' || 
               value === 'true' || 
               value === 'false';
      },
      
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && emailRegex.test(value);
      },
      
      url: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      
      uuid: (value) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof value === 'string' && uuidRegex.test(value);
      },
      
      date: (value) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      },
      
      json: (value) => {
        try {
          JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      },
      
      array: (value, options = {}) => {
        if (!Array.isArray(value)) return false;
        if (options.minItems && value.length < options.minItems) return false;
        if (options.maxItems && value.length > options.maxItems) return false;
        if (options.itemType) {
          return value.every(item => this.typeValidators[options.itemType](item));
        }
        return true;
      },
      
      object: (value, options = {}) => {
        if (typeof value !== 'object' || value === null) return false;
        if (options.required) {
          for (const field of options.required) {
            if (!(field in value)) return false;
          }
        }
        return true;
      }
    };
    
    // Sanitization functions
    this.sanitizers = {
      escapeHtml: (str) => {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '/': '&#x2F;'
        };
        return String(str).replace(/[&<>"'\/]/g, s => map[s]);
      },
      
      stripTags: (str) => {
        return String(str).replace(/<[^>]*>/g, '');
      },
      
      trim: (str) => {
        return String(str).trim();
      },
      
      lowercase: (str) => {
        return String(str).toLowerCase();
      },
      
      uppercase: (str) => {
        return String(str).toUpperCase();
      },
      
      alphanumeric: (str) => {
        return String(str).replace(/[^a-zA-Z0-9]/g, '');
      },
      
      numeric: (str) => {
        return String(str).replace(/[^0-9]/g, '');
      },
      
      removeSpecialChars: (str) => {
        return String(str).replace(/[^a-zA-Z0-9\s]/g, '');
      },
      
      normalizeWhitespace: (str) => {
        return String(str).replace(/\s+/g, ' ').trim();
      },
      
      truncate: (str, maxLength) => {
        const s = String(str);
        return s.length > maxLength ? s.substring(0, maxLength) : s;
      }
    };
    
    // Register state
    stateManager.register('inputValidation', {
      totalValidations: 0,
      blockedAttempts: 0,
      detectedAttacks: {}
    });
    
    // Initialize default rules
    this.initializeDefaultRules();
  }

  /**
   * Initialize default validation rules
   */
  initializeDefaultRules() {
    // API key validation
    this.addRule('apiKey', {
      type: 'string',
      pattern: /^[a-zA-Z0-9\-_]{20,}$/,
      maxLength: 256
    });
    
    // Username validation
    this.addRule('username', {
      type: 'string',
      pattern: /^[a-zA-Z0-9_\-]{3,20}$/,
      minLength: 3,
      maxLength: 20
    });
    
    // Password validation
    this.addRule('password', {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      custom: (value) => {
        // Check password strength
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*]/.test(value);
        return hasUpper && hasLower && hasNumber && hasSpecial;
      }
    });
    
    // File path validation
    this.addRule('filepath', {
      type: 'string',
      maxLength: 255,
      custom: (value) => {
        // No path traversal
        return !this.detectPathTraversal(value);
      }
    });
    
    // Command validation
    this.addRule('command', {
      type: 'string',
      maxLength: 1000,
      custom: (value) => {
        // No command injection
        return !this.detectCommandInjection(value);
      }
    });
  }

  /**
   * Add validation rule
   */
  addRule(name, rule) {
    this.rules.set(name, rule);
  }

  /**
   * Validate input against rules
   */
  validate(input, ruleName) {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      logger.warn(`Validation rule not found: ${ruleName}`);
      return { valid: false, error: 'Unknown validation rule' };
    }
    
    // Check type
    if (rule.type && !this.typeValidators[rule.type](input, rule)) {
      return { 
        valid: false, 
        error: `Invalid type: expected ${rule.type}` 
      };
    }
    
    // Check custom validation
    if (rule.custom && !rule.custom(input)) {
      return { 
        valid: false, 
        error: 'Custom validation failed' 
      };
    }
    
    // Check for dangerous patterns
    const attacks = this.detectAttacks(input);
    if (attacks.length > 0) {
      this.recordAttackAttempt(attacks, input);
      return { 
        valid: false, 
        error: `Potential security threat detected: ${attacks.join(', ')}`,
        attacks 
      };
    }
    
    // Update stats
    stateManager.set('inputValidation', 'totalValidations', 
      (stateManager.get('inputValidation', 'totalValidations') || 0) + 1
    );
    
    return { valid: true };
  }

  /**
   * Validate object with schema
   */
  validateObject(obj, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];
      
      // Check required
      if (rules.required && value === undefined) {
        errors.push({
          field,
          error: 'Field is required'
        });
        continue;
      }
      
      // Skip optional undefined fields
      if (value === undefined && !rules.required) {
        continue;
      }
      
      // Validate type
      if (rules.type && !this.typeValidators[rules.type](value, rules)) {
        errors.push({
          field,
          error: `Invalid type: expected ${rules.type}`
        });
        continue;
      }
      
      // Custom validation
      if (rules.validate) {
        const result = rules.validate(value);
        if (result !== true) {
          errors.push({
            field,
            error: typeof result === 'string' ? result : 'Validation failed'
          });
        }
      }
      
      // Check for attacks
      if (typeof value === 'string') {
        const attacks = this.detectAttacks(value);
        if (attacks.length > 0) {
          errors.push({
            field,
            error: `Security threat detected: ${attacks.join(', ')}`,
            attacks
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect potential attacks in input
   */
  detectAttacks(input) {
    if (typeof input !== 'string') return [];
    
    const detected = [];
    
    if (this.detectSQLInjection(input)) detected.push('SQL Injection');
    if (this.detectXSS(input)) detected.push('XSS');
    if (this.detectCommandInjection(input)) detected.push('Command Injection');
    if (this.detectPathTraversal(input)) detected.push('Path Traversal');
    if (this.detectLDAPInjection(input)) detected.push('LDAP Injection');
    if (this.detectNoSQLInjection(input)) detected.push('NoSQL Injection');
    
    return detected;
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(input) {
    return this.dangerousPatterns.sqlInjection.some(pattern => 
      pattern.test(input)
    );
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(input) {
    return this.dangerousPatterns.xss.some(pattern => 
      pattern.test(input)
    );
  }

  /**
   * Detect command injection attempts
   */
  detectCommandInjection(input) {
    return this.dangerousPatterns.commandInjection.some(pattern => 
      pattern.test(input)
    );
  }

  /**
   * Detect path traversal attempts
   */
  detectPathTraversal(input) {
    return this.dangerousPatterns.pathTraversal.some(pattern => 
      pattern.test(input)
    );
  }

  /**
   * Detect LDAP injection attempts
   */
  detectLDAPInjection(input) {
    const ldapChars = ['(', ')', '&', '|', '!', '=', '~', '*'];
    return ldapChars.some(char => input.includes(char));
  }

  /**
   * Detect NoSQL injection attempts
   */
  detectNoSQLInjection(input) {
    if (typeof input === 'string') {
      return this.dangerousPatterns.noSQLInjection.some(pattern => 
        pattern.test(input)
      );
    }
    
    // Check for object-based NoSQL injection
    if (typeof input === 'object' && input !== null) {
      const dangerous = ['$where', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin', '$regex'];
      return Object.keys(input).some(key => dangerous.includes(key));
    }
    
    return false;
  }

  /**
   * Sanitize input
   */
  sanitize(input, sanitizers = ['escapeHtml', 'trim']) {
    let sanitized = input;
    
    for (const sanitizer of sanitizers) {
      if (this.sanitizers[sanitizer]) {
        sanitized = this.sanitizers[sanitizer](sanitized);
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize object
   */
  sanitizeObject(obj, schema = {}) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const rules = schema[key] || {};
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value, rules.sanitizers || ['escapeHtml', 'trim']);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, rules.schema || {});
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Create safe SQL parameters
   */
  prepareSQLParams(params) {
    if (!params) return [];
    
    return params.map(param => {
      if (typeof param === 'string') {
        // Remove any SQL keywords and escape special characters
        return param
          .replace(/[';\\]/g, '') // Remove dangerous chars
          .replace(/\-\-/g, '') // Remove comments
          .substring(0, 1000); // Limit length
      }
      return param;
    });
  }

  /**
   * Record attack attempt
   */
  recordAttackAttempt(attacks, input) {
    const attempt = {
      timestamp: Date.now(),
      attacks,
      input: input.substring(0, 100), // Truncate for safety
      source: this.getSource()
    };
    
    // Update state
    stateManager.set('inputValidation', 'blockedAttempts',
      (stateManager.get('inputValidation', 'blockedAttempts') || 0) + 1
    );
    
    // Track attack types
    const detectedAttacks = stateManager.get('inputValidation', 'detectedAttacks') || {};
    attacks.forEach(attack => {
      detectedAttacks[attack] = (detectedAttacks[attack] || 0) + 1;
    });
    stateManager.set('inputValidation', 'detectedAttacks', detectedAttacks);
    
    // Record in telemetry
    errorTelemetry.recordError(new Error(`Security: ${attacks.join(', ')}`), {
      type: 'security_threat',
      severity: 'high',
      attacks,
      input: attempt.input
    });
    
    // Log warning
    logger.warn(`Security threat detected: ${attacks.join(', ')}`);
    
    return attempt;
  }

  /**
   * Get request source (for tracking)
   */
  getSource() {
    // In a real app, this would get IP, user agent, etc.
    return {
      timestamp: Date.now(),
      process: process.pid
    };
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [],
      allowedExtensions = []
    } = options;
    
    const errors = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds limit: ${maxSize} bytes`);
    }
    
    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`File type not allowed: ${file.mimetype}`);
    }
    
    // Check extension
    if (allowedExtensions.length > 0) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        errors.push(`File extension not allowed: ${ext}`);
      }
    }
    
    // Check for double extensions (e.g., file.php.jpg)
    const parts = file.originalname.split('.');
    if (parts.length > 2) {
      const suspiciousExts = ['php', 'exe', 'sh', 'bat', 'cmd', 'com', 'pif', 'scr'];
      if (parts.some(part => suspiciousExts.includes(part.toLowerCase()))) {
        errors.push('Suspicious file extension detected');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get validation stats
   */
  getStats() {
    return {
      totalValidations: stateManager.get('inputValidation', 'totalValidations') || 0,
      blockedAttempts: stateManager.get('inputValidation', 'blockedAttempts') || 0,
      detectedAttacks: stateManager.get('inputValidation', 'detectedAttacks') || {}
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    stateManager.set('inputValidation', 'totalValidations', 0);
    stateManager.set('inputValidation', 'blockedAttempts', 0);
    stateManager.set('inputValidation', 'detectedAttacks', {});
  }
}

// Singleton instance
let instance = null;

function getInputValidator() {
  if (!instance) {
    instance = new InputValidator();
  }
  return instance;
}

module.exports = {
  InputValidator,
  getInputValidator,
  validator: getInputValidator()
};