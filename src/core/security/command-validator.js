/**
 * BUMBA Security Layer - Command Validation and Sanitization
 * Prevents command injection, validates inputs, and enforces permissions
 */

const path = require('path');
const { createHash } = require('crypto');

class CommandValidator {
  constructor() {
    // Whitelist of allowed system commands
    this.allowedCommands = new Set([
      'which',
      'ping',
      'npm',
      'node',
      'git',
      'afplay',
      'mpg123',
      'ffplay',
      'paplay',
      'qlty'
    ]);

    // Regex patterns for validation
    this.patterns = {
      alphanumeric: /^[a-zA-Z0-9_-]+$/,
      filePath: /^[a-zA-Z0-9_.\-/\\]+$/,
      command: /^[a-zA-Z0-9_-]+$/,
      npmPackage: /^(@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+$/,
      url: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/
    };

    // Command-specific validators
    this.commandValidators = {
      which: (args) => args.length === 1 && this.patterns.command.test(args[0]),
      ping: (args) => args.length >= 2 && args[0] === '-c' && /^\d+$/.test(args[1]),
      npm: (args) => this.validateNpmCommand(args),
      git: (args) => this.validateGitCommand(args),
      afplay: (args) => args.length === 1 && this.isValidPath(args[0]),
      mpg123: (args) => args.every(arg => arg.startsWith('-') || this.isValidPath(arg)),
      ffplay: (args) => args.every(arg => arg.startsWith('-') || this.isValidPath(arg)),
      paplay: (args) => args.length === 1 && this.isValidPath(args[0]),
      qlty: (args) => this.validateQltyCommand(args)
    };

    // Permission levels
    this.permissions = {
      read: ['which', 'ping', 'git status', 'git log', 'npm list'],
      write: ['git add', 'git commit', 'npm install'],
      execute: ['npm run', 'node', 'qlty']
    };
  }

  /**
   * Validates and sanitizes a command before execution
   * @param {string} command - The command to execute
   * @param {Array<string>} args - Command arguments
   * @param {Object} context - Execution context (user, permissions, etc.)
   * @returns {Promise<Object>} { valid: boolean, sanitized: { command, args }, error?: string }
   */
  async validateCommand(command, args = [], context = {}) {
    try {
      // 1. Check if command is in whitelist
      if (!this.allowedCommands.has(command)) {
        return {
          valid: false,
          error: `Command '${command}' is not allowed`
        };
      }

      // 2. Validate command format
      if (!this.patterns.command.test(command)) {
        return {
          valid: false,
          error: 'Invalid command format'
        };
      }

      // 3. Run command-specific validation
      const validator = this.commandValidators[command];
      if (validator && !validator(args)) {
        return {
          valid: false,
          error: `Invalid arguments for command '${command}'`
        };
      }

      // 4. Check permissions
      const hasPermission = await this.checkPermissions(command, args, context);
      if (!hasPermission) {
        return {
          valid: false,
          error: 'Insufficient permissions for this command'
        };
      }

      // 5. Sanitize arguments
      const sanitizedArgs = this.sanitizeArguments(args);

      return {
        valid: true,
        sanitized: {
          command,
          args: sanitizedArgs
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validates npm commands
   */
  validateNpmCommand(args) {
    if (args.length === 0) {return false;}
    
    const subCommand = args[0];
    const allowedNpmCommands = ['install', 'run', 'list', 'test', 'start'];
    
    if (!allowedNpmCommands.includes(subCommand)) {return false;}
    
    if (subCommand === 'install' && args.length > 1) {
      // Validate package names
      return args.slice(1).every(arg => 
        arg.startsWith('-') || this.patterns.npmPackage.test(arg)
      );
    }
    
    return true;
  }

  /**
   * Validates git commands
   */
  validateGitCommand(args) {
    if (args.length === 0) {return false;}
    
    const subCommand = args[0];
    const allowedGitCommands = ['status', 'log', 'add', 'commit', 'diff', 'branch'];
    
    if (!allowedGitCommands.includes(subCommand)) {return false;}
    
    if (subCommand === 'commit' && args.includes('-m')) {
      // Ensure commit message doesn't contain shell metacharacters
      const messageIndex = args.indexOf('-m') + 1;
      if (messageIndex < args.length) {
        const message = args[messageIndex];
        return !this.containsShellMetacharacters(message);
      }
    }
    
    return true;
  }

  /**
   * Validates qlty commands
   */
  validateQltyCommand(args) {
    const allowedQltyCommands = ['--version', 'check', 'fix', 'init'];
    return args.length === 0 || allowedQltyCommands.includes(args[0]);
  }

  /**
   * Checks if a path is valid and safe
   */
  isValidPath(filePath) {
    try {
      // Get absolute paths for comparison
      const absolute = path.resolve(filePath);
      const cwd = process.cwd();
      
      // Ensure the resolved path is within the current working directory
      if (!absolute.startsWith(cwd + path.sep)) {
        // Allow exact match for cwd
        if (absolute !== cwd) {
          return false;
        }
      }
      
      // Additional checks for common path traversal patterns
      const dangerousPatterns = [
        /\.\.[\/\\]/, // ../
        /%2e%2e[\/\\]/i, // URL encoded ../
        /\x2e\x2e[\/\\]/, // Hex encoded ../
        /\.\.%2f/i, // Mixed encoding
        /\.\.%5c/i, // Mixed encoding backslash
      ];
      
      if (dangerousPatterns.some(pattern => pattern.test(filePath))) {
        return false;
      }
      
      // Check against pattern
      return this.patterns.filePath.test(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks for shell metacharacters that could enable command injection
   */
  containsShellMetacharacters(str) {
    const dangerous = /[;&|`$<>\\\n\r]/;
    return dangerous.test(str);
  }

  /**
   * Sanitizes command arguments
   */
  sanitizeArguments(args) {
    return args.map(arg => {
      // Remove any null bytes
      let sanitized = arg.replace(/\0/g, '');
      
      // Escape quotes if present
      sanitized = sanitized.replace(/"/g, '\\"');
      
      // Remove newlines and carriage returns
      sanitized = sanitized.replace(/[\r\n]/g, '');
      
      return sanitized;
    });
  }

  /**
   * Checks if user has permission to execute command
   */
  async checkPermissions(command, args, context) {
    // Only skip permission check in test mode with explicit flag
    if (context.testMode && process.env.NODE_ENV === 'test') {
      logger.warn('🟡 Permission check skipped in test mode');
      return true;
    }
    
    // Import RBAC system
    const { getInstance: getRBACInstance } = require('./rbac-system');
    const rbac = getRBACInstance();
    
    // Get user from context
    const user = context.user || 'anonymous';
    
    // Determine action based on command
    const action = this.getActionFromCommand(command, args);
    
    // Check permission
    return await rbac.checkPermission(user, command, action);
  }

  /**
   * Maps command to permission action
   */
  getActionFromCommand(command, args) {
    // Map commands to actions
    const commandActionMap = {
      'which': 'read',
      'ping': 'read',
      'npm': args[0] === 'install' ? 'write' : 'read',
      'git': this.getGitAction(args),
      'afplay': 'execute',
      'mpg123': 'execute',
      'ffplay': 'execute',
      'paplay': 'execute',
      'qlty': 'execute',
      'node': 'execute'
    };
    
    return commandActionMap[command] || 'execute';
  }

  /**
   * Determines action for git commands
   */
  getGitAction(args) {
    if (args.length === 0) {return 'read';}
    
    const subCommand = args[0];
    const writeCommands = ['add', 'commit', 'push', 'merge', 'reset'];
    const executeCommands = ['clone', 'pull'];
    
    if (writeCommands.includes(subCommand)) {return 'write';}
    if (executeCommands.includes(subCommand)) {return 'execute';}
    
    return 'read';
  }

  /**
   * Validates a file path for read/write operations
   */
  validateFilePath(filePath, operation = 'read') {
    try {
      // Normalize path
      const normalized = path.normalize(filePath);
      
      // Check for directory traversal
      if (normalized.includes('..')) {
        return {
          valid: false,
          error: 'Directory traversal detected'
        };
      }
      
      // Check if path is absolute
      if (!path.isAbsolute(normalized)) {
        return {
          valid: false,
          error: 'Only absolute paths are allowed'
        };
      }
      
      // Check against allowed directories
      const allowedDirs = [
        process.env.HOME,
        '/tmp',
        process.cwd()
      ];
      
      const isInAllowedDir = allowedDirs.some(dir => 
        normalized.startsWith(path.normalize(dir))
      );
      
      if (!isInAllowedDir) {
        return {
          valid: false,
          error: 'Path is outside allowed directories'
        };
      }
      
      return {
        valid: true,
        sanitized: normalized
      };
    } catch (error) {
      return {
        valid: false,
        error: `Path validation error: ${error.message}`
      };
    }
  }

  /**
   * Creates a secure hash of sensitive data
   */
  hashSensitiveData(data) {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Synchronous version of validateCommand for backward compatibility
   * WARNING: This bypasses async permission checks
   * @param {string} command - The command to execute
   * @param {Array<string>} args - Command arguments
   * @param {Object} context - Execution context
   * @returns {Object} { valid: boolean, sanitized: { command, args }, error?: string }
   */
  validateCommandSync(command, args = [], context = {}) {
    // Synchronous validation is deprecated for security reasons
    throw new Error(
      'Synchronous command validation is no longer supported for security reasons. ' +
      'Please use the async validateCommand() method instead.'
    );
  }

  /**
   * Sanitizes input to prevent injection attacks
   */
  sanitizeInput(input, type = 'general') {
    if (typeof input !== 'string') {
      return String(input);
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Type-specific sanitization
    switch (type) {
      case 'sql':
        // Comprehensive SQL output escaping
        sanitized = sanitized
          .replace(/'/g, "''")           // Escape single quotes
          .replace(/"/g, '""')           // Escape double quotes  
          .replace(/\\/g, '\\\\')        // Escape backslashes
          .replace(/;/g, '\\;')          // Escape semicolons
          .replace(/--/g, '\\-\\-')      // Escape SQL comments
          .replace(/\/\*/g, '\\/\\*')    // Escape block comments
          .replace(/\*\//g, '\\*\\/')    // Escape block comment endings
          .replace(/\x00/g, '\\0')       // Escape null bytes
          .replace(/\n/g, '\\n')         // Escape newlines
          .replace(/\r/g, '\\r')         // Escape carriage returns
          .replace(/\x1a/g, '\\Z');      // Escape Ctrl+Z
        break;
      
      case 'html':
        // HTML entity encoding
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        break;
      
      case 'shell':
        // Remove shell metacharacters
        sanitized = sanitized.replace(/[;&|`$<>\\\n\r(){}[\]!*?~]/g, '');
        break;
      
      case 'path':
        // Sanitize file paths
        sanitized = sanitized.replace(/\.\./g, '');
        sanitized = path.normalize(sanitized);
        break;
      
      default:
        // General sanitization
        sanitized = sanitized.replace(/[\0\n\r\x1a]/g, '');
    }

    return sanitized;
  }

  /**
   * Checks for various injection attack patterns
   */
  checkInjection(input, type = 'all') {
    const injectionPatterns = {
      sql: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|ORDER BY|GROUP BY|HAVING)\b)/gi,
        /('|(--)|;|\/\*|\*\/|xp_|sp_|0x)/gi,
        /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO|DELETE.*FROM)/gi
      ],
      nosql: [
        /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin)/gi,
        /({.*}|\[.*\])/,
        /\$\{.*\}/
      ],
      xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]*onerror=/gi,
        /<svg[^>]*onload=/gi
      ],
      command: [
        /[;&|`$<>\\\n\r]/,
        /\$\(/,
        /`.*`/,
        /\|\|/,
        /&&/
      ],
      path: [
        /\.\.[\/\\]/,
        /%2e%2e[\/\\]/i,
        /\x2e\x2e[\/\\]/,
        /\.\.%2f/i,
        /\.\.%5c/i
      ]
    };

    const typesToCheck = type === 'all' ? Object.keys(injectionPatterns) : [type];
    const detectedInjections = [];

    for (const injectionType of typesToCheck) {
      const patterns = injectionPatterns[injectionType] || [];
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          detectedInjections.push({
            type: injectionType,
            pattern: pattern.toString(),
            matched: input.match(pattern)
          });
        }
      }
    }

    return {
      safe: detectedInjections.length === 0,
      injections: detectedInjections
    };
  }

  /**
   * Validates permissions for a specific operation
   */
  async validatePermissions(user, resource, action, context = {}) {
    try {
      const { getInstance: getRBACInstance } = require('./rbac-system');
      const rbac = getRBACInstance();

      // Check basic permission
      const hasPermission = await rbac.checkPermission(user, resource, action);
      
      if (!hasPermission) {
        return {
          valid: false,
          error: `User ${user} lacks ${action} permission for ${resource}`
        };
      }

      // Check additional context-based permissions
      if (context.requiresElevation && !context.elevated) {
        return {
          valid: false,
          error: 'This operation requires elevated privileges'
        };
      }

      if (context.requiresMFA && !context.mfaVerified) {
        return {
          valid: false,
          error: 'Multi-factor authentication required'
        };
      }

      return {
        valid: true,
        user,
        resource,
        action,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        valid: false,
        error: `Permission validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validates input against a schema
   */
  validateSchema(input, schema) {
    const errors = [];

    // Type validation
    if (schema.type && typeof input !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof input}`);
    }

    // Required fields for objects
    if (schema.type === 'object' && schema.required) {
      for (const field of schema.required) {
        if (!(field in input)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Properties validation for objects
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in input) {
          const propResult = this.validateSchema(input[key], propSchema);
          if (!propResult.valid) {
            errors.push(`Field ${key}: ${propResult.errors.join(', ')}`);
          }
        }
      }
    }

    // String patterns
    if (schema.type === 'string') {
      if (schema.pattern && !new RegExp(schema.pattern).test(input)) {
        errors.push(`String does not match pattern: ${schema.pattern}`);
      }
      if (schema.minLength && input.length < schema.minLength) {
        errors.push(`String length ${input.length} is less than minimum ${schema.minLength}`);
      }
      if (schema.maxLength && input.length > schema.maxLength) {
        errors.push(`String length ${input.length} exceeds maximum ${schema.maxLength}`);
      }
    }

    // Number ranges
    if (schema.type === 'number') {
      if (schema.minimum !== undefined && input < schema.minimum) {
        errors.push(`Value ${input} is less than minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && input > schema.maximum) {
        errors.push(`Value ${input} exceeds maximum ${schema.maximum}`);
      }
    }

    // Array validation
    if (schema.type === 'array') {
      if (schema.minItems && input.length < schema.minItems) {
        errors.push(`Array length ${input.length} is less than minimum ${schema.minItems}`);
      }
      if (schema.maxItems && input.length > schema.maxItems) {
        errors.push(`Array length ${input.length} exceeds maximum ${schema.maxItems}`);
      }
      if (schema.items) {
        input.forEach((item, index) => {
          const itemResult = this.validateSchema(item, schema.items);
          if (!itemResult.valid) {
            errors.push(`Item ${index}: ${itemResult.errors.join(', ')}`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Blocks dangerous commands based on patterns and blacklist
   */
  blockDangerousCommands(command, args = []) {
    // Dangerous command patterns
    const dangerousCommands = [
      'rm',
      'del',
      'format',
      'dd',
      'mkfs',
      'fdisk',
      'shutdown',
      'reboot',
      'kill',
      'killall',
      'curl',
      'wget',
      'nc',
      'netcat',
      'telnet',
      'ssh',
      'scp',
      'ftp',
      'sudo',
      'su',
      'chmod',
      'chown',
      'passwd'
    ];

    // Check if command is in dangerous list
    if (dangerousCommands.includes(command)) {
      return {
        blocked: true,
        reason: `Command '${command}' is classified as dangerous`,
        severity: 'high'
      };
    }

    // Check for dangerous argument patterns
    const dangerousArgPatterns = [
      { pattern: /^\/$/,  reason: 'Operating on root directory', severity: 'critical' },
      { pattern: /^\/etc/, reason: 'Modifying system configuration', severity: 'high' },
      { pattern: /^\/bin/, reason: 'Modifying system binaries', severity: 'critical' },
      { pattern: /^\/boot/, reason: 'Modifying boot configuration', severity: 'critical' },
      { pattern: /\*/, reason: 'Wildcard operations can be dangerous', severity: 'medium' },
      { pattern: />\/dev\/null/, reason: 'Suppressing output can hide malicious activity', severity: 'low' }
    ];

    for (const arg of args) {
      for (const { pattern, reason, severity } of dangerousArgPatterns) {
        if (pattern.test(arg)) {
          return {
            blocked: true,
            reason,
            severity,
            argument: arg
          };
        }
      }
    }

    // Check for command chaining attempts
    const fullCommand = `${command} ${args.join(' ')}`;
    if (/[;&|]/.test(fullCommand)) {
      return {
        blocked: true,
        reason: 'Command chaining detected',
        severity: 'high'
      };
    }

    return {
      blocked: false
    };
  }

  /**
   * Manages whitelist of allowed commands
   */
  whitelistCommands(action = 'get', commands = []) {
    switch (action) {
      case 'get':
        return Array.from(this.allowedCommands);
      
      case 'add':
        for (const cmd of commands) {
          if (this.patterns.command.test(cmd)) {
            this.allowedCommands.add(cmd);
          }
        }
        return Array.from(this.allowedCommands);
      
      case 'remove':
        for (const cmd of commands) {
          this.allowedCommands.delete(cmd);
        }
        return Array.from(this.allowedCommands);
      
      case 'set':
        this.allowedCommands = new Set(
          commands.filter(cmd => this.patterns.command.test(cmd))
        );
        return Array.from(this.allowedCommands);
      
      case 'clear':
        this.allowedCommands.clear();
        return [];
      
      case 'reset':
        // Reset to default whitelist
        this.allowedCommands = new Set([
          'which',
          'ping',
          'npm',
          'node',
          'git',
          'afplay',
          'mpg123',
          'ffplay',
          'paplay',
          'qlty'
        ]);
        return Array.from(this.allowedCommands);
      
      default:
        throw new Error(`Unknown whitelist action: ${action}`);
    }
  }
}

module.exports = { CommandValidator };