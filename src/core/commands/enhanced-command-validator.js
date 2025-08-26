/**
 * BUMBA Enhanced Command Validator
 * Strict multi-layer validation for command security and integrity
 */

const { logger } = require('../logging/bumba-logger');
const path = require('path');
const fs = require('fs');

class EnhancedCommandValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode !== false,
      allowUnregistered: options.allowUnregistered || false,
      maxCommandLength: options.maxCommandLength || 100,
      maxArgLength: options.maxArgLength || 500,
      maxArgs: options.maxArgs || 10,
      ...options
    };
    
    // Validation rules
    this.rules = {
      // Command name patterns
      commandPattern: /^[a-zA-Z][a-zA-Z0-9-]*$/,
      
      // Argument patterns
      safeArgPattern: /^[a-zA-Z0-9\s\-_./,@#]*$/,
      
      // Dangerous patterns to block
      dangerousPatterns: [
        /\$\{.*\}/,           // Template injection
        /\$\(.*\)/,           // Command substitution
        /`.*`/,               // Backtick execution
        /\|\|/,               // OR operator
        /&&/,                 // AND operator
        /;/,                  // Command separator
        /\*/,                 // Wildcard (when not expected)
        /\.\.\/\.\.\//,      // Path traversal
        /<script>/i,          // Script injection
        /javascript:/i,       // JS protocol
        /on\w+=/i,           // Event handlers
      ],
      
      // SQL injection patterns
      sqlPatterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE)\b)/i,
        /(--)|(\/\*)/,       // SQL comments
        /(';)|(";)/,         // Quote termination
      ],
      
      // Path validation
      pathPattern: /^[a-zA-Z0-9\-_./]+$/,
      absolutePathPattern: /^\/[a-zA-Z0-9\-_./]*$/,
      
      // Reserved words that shouldn't be in commands
      reservedWords: [
        'eval', 'exec', 'system', 'require', 'import',
        'process', 'child_process', 'fs', 'shell', 'cmd'
      ]
    };
    
    // Registered commands cache
    this.registeredCommands = new Map();
    this.loadRegisteredCommands();
    
    // Validation statistics
    this.stats = {
      totalValidations: 0,
      passed: 0,
      failed: 0,
      blocked: []
    };
  }

  /**
   * Load registered commands from configuration
   */
  loadRegisteredCommands() {
    try {
      const configPath = path.join(__dirname, '../../../bumba.config.js');
      const config = require(configPath);
      
      // Extract all command names
      const extractCommands = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            if (value.template || value.description) {
              // This is a command definition
              this.registeredCommands.set(key, {
                ...value,
                fullName: prefix + key
              });
            } else {
              // Nested category
              extractCommands(value, prefix);
            }
          }
        }
      };
      
      if (config.commands) {
        for (const category of Object.values(config.commands)) {
          if (typeof category === 'object' && !Array.isArray(category)) {
            extractCommands(category);
          }
        }
      }
      
      logger.debug(`Loaded ${this.registeredCommands.size} registered commands`);
    } catch (error) {
      logger.warn('Could not load registered commands:', error.message);
    }
  }

  /**
   * Perform comprehensive command validation
   */
  async validateCommand(command, args = [], context = {}) {
    this.stats.totalValidations++;
    
    const validationResult = {
      valid: false,
      command: command,
      args: args,
      errors: [],
      warnings: [],
      sanitized: null
    };
    
    try {
      // Layer 1: Basic validation
      this.validateBasic(command, args, validationResult);
      
      // Layer 2: Security validation
      this.validateSecurity(command, args, validationResult);
      
      // Layer 3: Command registration
      this.validateRegistration(command, validationResult);
      
      // Layer 4: Argument validation
      this.validateArguments(command, args, validationResult);
      
      // Layer 5: Context validation
      this.validateContext(command, args, context, validationResult);
      
      // Layer 6: Permission validation
      await this.validatePermissions(command, args, context, validationResult);
      
      // Determine final validity
      if (validationResult.errors.length === 0) {
        validationResult.valid = true;
        validationResult.sanitized = {
          command: this.sanitizeCommand(command),
          args: this.sanitizeArguments(args)
        };
        this.stats.passed++;
      } else {
        this.stats.failed++;
        this.stats.blocked.push({
          command,
          reason: validationResult.errors[0],
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      logger.error('Validation error:', error);
      validationResult.errors.push(`Validation error: ${error.message}`);
      validationResult.valid = false;
    }
    
    return validationResult;
  }

  /**
   * Layer 1: Basic validation
   */
  validateBasic(command, args, result) {
    // Check command length
    if (!command || command.length === 0) {
      result.errors.push('Command is required');
      return;
    }
    
    if (command.length > this.options.maxCommandLength) {
      result.errors.push(`Command exceeds maximum length of ${this.options.maxCommandLength}`);
      return;
    }
    
    // Check command format
    if (!this.rules.commandPattern.test(command)) {
      result.errors.push('Invalid command format. Use only letters, numbers, and hyphens');
      return;
    }
    
    // Check args count
    if (args.length > this.options.maxArgs) {
      result.errors.push(`Too many arguments. Maximum allowed: ${this.options.maxArgs}`);
      return;
    }
    
    // Check individual arg length
    for (const arg of args) {
      if (typeof arg === 'string' && arg.length > this.options.maxArgLength) {
        result.errors.push(`Argument exceeds maximum length of ${this.options.maxArgLength}`);
        return;
      }
    }
  }

  /**
   * Layer 2: Security validation
   */
  validateSecurity(command, args, result) {
    // Check command for dangerous patterns
    for (const pattern of this.rules.dangerousPatterns) {
      if (pattern.test(command)) {
        result.errors.push(`Command contains dangerous pattern: ${pattern}`);
        return;
      }
    }
    
    // Check args for dangerous patterns
    for (const arg of args) {
      if (typeof arg === 'string') {
        // Check for dangerous patterns
        for (const pattern of this.rules.dangerousPatterns) {
          if (pattern.test(arg)) {
            result.errors.push(`Argument contains dangerous pattern: ${pattern}`);
            return;
          }
        }
        
        // Check for SQL injection
        for (const pattern of this.rules.sqlPatterns) {
          if (pattern.test(arg)) {
            result.warnings.push('Potential SQL injection pattern detected');
            if (this.options.strictMode) {
              result.errors.push('SQL-like patterns not allowed in strict mode');
              return;
            }
          }
        }
      }
    }
    
    // Check for reserved words
    const lowerCommand = command.toLowerCase();
    for (const reserved of this.rules.reservedWords) {
      if (lowerCommand.includes(reserved)) {
        result.errors.push(`Command contains reserved word: ${reserved}`);
        return;
      }
    }
  }

  /**
   * Layer 3: Command registration validation
   */
  validateRegistration(command, result) {
    if (!this.options.allowUnregistered && !this.registeredCommands.has(command)) {
      // Check if it might be a typo
      const suggestions = this.findSimilarCommands(command);
      if (suggestions.length > 0) {
        result.warnings.push(`Command not found. Did you mean: ${suggestions.join(', ')}?`);
      }
      
      result.errors.push(`Command '${command}' is not registered`);
      return;
    }
    
    // If registered, validate against configuration
    if (this.registeredCommands.has(command)) {
      const config = this.registeredCommands.get(command);
      
      // Check if command is deprecated
      if (config.deprecated) {
        result.warnings.push(`Command '${command}' is deprecated. Use '${config.replacement}' instead`);
      }
      
      // Check if command is disabled
      if (config.disabled) {
        result.errors.push(`Command '${command}' is currently disabled`);
        return;
      }
    }
  }

  /**
   * Layer 4: Argument validation
   */
  validateArguments(command, args, result) {
    // Get command configuration
    const config = this.registeredCommands.get(command);
    if (!config) return;
    
    // Validate required arguments
    if (config.requiredArgs) {
      if (args.length < config.requiredArgs) {
        result.errors.push(`Command requires at least ${config.requiredArgs} arguments`);
        return;
      }
    }
    
    // Validate argument types
    if (config.argTypes) {
      for (let i = 0; i < args.length && i < config.argTypes.length; i++) {
        const expectedType = config.argTypes[i];
        const arg = args[i];
        
        if (!this.validateArgType(arg, expectedType)) {
          result.errors.push(`Argument ${i + 1} must be of type ${expectedType}`);
          return;
        }
      }
    }
    
    // Validate argument patterns
    if (config.argPatterns) {
      for (let i = 0; i < args.length && i < config.argPatterns.length; i++) {
        const pattern = new RegExp(config.argPatterns[i]);
        const arg = args[i];
        
        if (typeof arg === 'string' && !pattern.test(arg)) {
          result.errors.push(`Argument ${i + 1} does not match required pattern`);
          return;
        }
      }
    }
  }

  /**
   * Layer 5: Context validation
   */
  validateContext(command, args, context, result) {
    // Check environment requirements
    const config = this.registeredCommands.get(command);
    if (!config) return;
    
    // Check required environment variables
    if (config.requiredEnv) {
      for (const envVar of config.requiredEnv) {
        if (!process.env[envVar]) {
          result.errors.push(`Required environment variable not set: ${envVar}`);
          return;
        }
      }
    }
    
    // Check required MCP servers
    if (config.mcpServers) {
      // This would check if MCP servers are available
      // For now, just warn
      result.warnings.push(`Command requires MCP servers: ${config.mcpServers.join(', ')}`);
    }
    
    // Check user context
    if (context.user) {
      // Validate user has necessary attributes
      if (config.requiresAuth && !context.user.authenticated) {
        result.errors.push('Command requires authentication');
        return;
      }
    }
  }

  /**
   * Layer 6: Permission validation
   */
  async validatePermissions(command, args, context, result) {
    // Check if command requires special permissions
    const config = this.registeredCommands.get(command);
    if (!config) return;
    
    // Check permission level
    if (config.permissionLevel) {
      const userLevel = context.user?.permissionLevel || 0;
      if (userLevel < config.permissionLevel) {
        result.errors.push(`Insufficient permissions. Required level: ${config.permissionLevel}`);
        return;
      }
    }
    
    // Check role-based permissions
    if (config.requiredRoles) {
      const userRoles = context.user?.roles || [];
      const hasRole = config.requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        result.errors.push(`Command requires one of these roles: ${config.requiredRoles.join(', ')}`);
        return;
      }
    }
    
    // Rate limiting check (delegated to rate limiter)
    if (context.rateLimiter) {
      const allowed = await context.rateLimiter.checkLimit(command, context.user);
      if (!allowed) {
        result.errors.push('Rate limit exceeded for this command');
        return;
      }
    }
  }

  /**
   * Validate argument type
   */
  validateArgType(arg, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof arg === 'string';
      case 'number':
        return typeof arg === 'number' || !isNaN(Number(arg));
      case 'boolean':
        return typeof arg === 'boolean' || arg === 'true' || arg === 'false';
      case 'path':
        return typeof arg === 'string' && this.rules.pathPattern.test(arg);
      case 'url':
        try {
          new URL(arg);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Find similar commands for suggestions
   */
  findSimilarCommands(command) {
    const suggestions = [];
    const maxDistance = 3;
    
    for (const registered of this.registeredCommands.keys()) {
      const distance = this.levenshteinDistance(command, registered);
      if (distance <= maxDistance) {
        suggestions.push(registered);
      }
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * Calculate Levenshtein distance between strings
   */
  levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * Sanitize command
   */
  sanitizeCommand(command) {
    return command.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Sanitize arguments
   */
  sanitizeArguments(args) {
    return args.map(arg => {
      if (typeof arg === 'string') {
        // Remove dangerous characters but preserve useful ones
        return arg.replace(/[<>'"`;]/g, '').trim();
      }
      return arg;
    });
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalValidations > 0 
        ? (this.stats.passed / this.stats.totalValidations * 100).toFixed(2) + '%'
        : '0%',
      recentBlocked: this.stats.blocked.slice(-10)
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalValidations: 0,
      passed: 0,
      failed: 0,
      blocked: []
    };
  }
}

module.exports = EnhancedCommandValidator;