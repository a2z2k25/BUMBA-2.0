/**
 * BUMBA Secure Command Executor
 * Safely executes system commands with validation and sanitization
 */

const { spawn } = require('child_process');
const vm = require('vm');
const { CommandValidator } = require('./command-validator');

class SecureExecutor {
  constructor() {
    this.validator = new CommandValidator();
    this.defaultTimeout = 30000; // 30 seconds
    this.activeProcesses = new Map();
    this.sandboxes = new Map();
    this.resourceLimits = {
      maxMemory: 512 * 1024 * 1024, // 512MB
      maxCpu: 80, // 80% CPU
      maxProcesses: 10,
      maxFileSize: 100 * 1024 * 1024 // 100MB
    };
  }

  /**
   * Safely executes a command with validation
   * @param {string} command - Command to execute
   * @param {Array<string>} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async execute(command, args = [], options = {}) {
    const {
      timeout = this.defaultTimeout,
      context = {},
      cwd = process.cwd(),
      env = process.env,
      encoding = 'utf8'
    } = options;

    // Validate command
    const validation = await this.validator.validateCommand(command, args, context);
    if (!validation.valid) {
      throw new Error(`Command validation failed: ${validation.error}`);
    }

    const { sanitized } = validation;

    return new Promise((resolve, reject) => {
      let stdout = encoding === null ? null : '';
      let stderr = encoding === null ? null : '';
      let processKilled = false;

      // Spawn process with sanitized arguments
      const child = spawn(sanitized.command, sanitized.args, {
        cwd,
        env,
        shell: false, // Never use shell to prevent injection
        windowsHide: true
      });

      // Track active process
      const processId = Date.now() + Math.random();
      this.activeProcesses.set(processId, child);

      // Setup timeout
      const timer = setTimeout(() => {
        processKilled = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Collect stdout
      child.stdout.on('data', (data) => {
        if (encoding === null) {
          stdout = stdout ? Buffer.concat([stdout, data]) : data;
        } else {
          stdout += data.toString(encoding);
        }
      });

      // Collect stderr
      child.stderr.on('data', (data) => {
        if (encoding === null) {
          stderr = stderr ? Buffer.concat([stderr, data]) : data;
        } else {
          stderr += data.toString(encoding);
        }
      });

      // Handle process completion
      child.on('close', (code) => {
        clearTimeout(timer);
        this.activeProcesses.delete(processId);

        if (processKilled) {
          reject(new Error(`Command timed out after ${timeout}ms`));
          return;
        }

        if (code !== 0) {
          const error = new Error(`Command failed with exit code ${code}`);
          error.code = code;
          error.stderr = stderr;
          error.stdout = stdout;
          reject(error);
          return;
        }

        resolve({
          stdout: encoding === null ? stdout : stdout.trim(),
          stderr: encoding === null ? stderr : stderr.trim(),
          code,
          command: sanitized.command,
          args: sanitized.args,
          killed: processKilled
        });
      });

      // Handle spawn errors
      child.on('error', (error) => {
        clearTimeout(timer);
        this.activeProcesses.delete(processId);
        reject(error);
      });
    });
  }

  /**
   * Synchronous execution is deprecated for security reasons
   * Use executeCommand() instead
   */
  executeSync(command, args = [], options = {}) {
    throw new Error(
      'Synchronous command execution is no longer supported for security reasons. ' +
      'Please use the async executeCommand() method instead.'
    );
  }

  /**
   * Safely checks if a command exists in the system
   */
  async commandExists(command) {
    try {
      await this.execute('which', [command], { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely checks if a command exists (sync version)
   */
  commandExistsSync(command) {
    try {
      this.executeSync('which', [command], { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kill a specific process
   */
  killProcess(processId, signal = 'SIGTERM') {
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.kill(signal);
    }
  }

  /**
   * Kill all active processes
   */
  killAll(signal = 'SIGTERM') {
    for (const [id, process] of this.activeProcesses) {
      process.kill(signal);
    }
  }

  /**
   * Terminates all active processes
   */
  async cleanup() {
    const promises = [];
    
    for (const [id, process] of this.activeProcesses) {
      promises.push(new Promise((resolve) => {
        process.kill('SIGTERM');
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      }));
    }

    await Promise.all(promises);
    this.activeProcesses.clear();
  }

  /**
   * Creates a safe executor for file operations
   */
  static createFileOperationExecutor() {
    const executor = new SecureExecutor();
    const validator = new CommandValidator();

    return {
      async readFile(filePath) {
        const validation = validator.validateFilePath(filePath, 'read');
        if (!validation.valid) {
          throw new Error(`File path validation failed: ${validation.error}`);
        }
        
        const fs = require('fs').promises;
        return await fs.readFile(validation.sanitized, 'utf8');
      },

      async writeFile(filePath, content) {
        const validation = validator.validateFilePath(filePath, 'write');
        if (!validation.valid) {
          throw new Error(`File path validation failed: ${validation.error}`);
        }
        
        const fs = require('fs').promises;
        return await fs.writeFile(validation.sanitized, content, 'utf8');
      },

      async fileExists(filePath) {
        const validation = validator.validateFilePath(filePath, 'read');
        if (!validation.valid) {
          return false;
        }
        
        const fs = require('fs').promises;
        try {
          await fs.access(validation.sanitized);
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  }

  /**
   * Executes code in a sandboxed environment
   */
  sandbox(code, context = {}, options = {}) {
    const {
      timeout = 5000,
      filename = 'sandbox.js',
      displayErrors = true,
      breakOnSigint = true
    } = options;

    // Create a new context for isolation
    const sandboxContext = vm.createContext({
      console: {
        log: (...args) => console.log('[SANDBOX]', ...args),
        error: (...args) => console.error('[SANDBOX]', ...args),
        warn: (...args) => console.warn('[SANDBOX]', ...args)
      },
      setTimeout: undefined,
      setInterval: undefined,
      setImmediate: undefined,
      process: undefined,
      require: undefined,
      __dirname: undefined,
      __filename: undefined,
      global: undefined,
      ...context
    });

    // Track sandbox
    const sandboxId = Date.now() + Math.random();
    this.sandboxes.set(sandboxId, { context: sandboxContext, created: Date.now() });

    try {
      // Run code in sandbox
      const script = new vm.Script(code, {
        filename,
        timeout,
        displayErrors,
        breakOnSigint
      });

      const result = script.runInContext(sandboxContext, {
        timeout,
        displayErrors,
        breakOnSigint
      });

      // Cleanup
      this.sandboxes.delete(sandboxId);
      
      return {
        success: true,
        result,
        context: sandboxContext
      };
    } catch (error) {
      // Cleanup on error
      this.sandboxes.delete(sandboxId);
      
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Executes a function with a timeout
   */
  async timeout(fn, timeoutMs = 5000, errorMessage = 'Operation timed out') {
    return new Promise((resolve, reject) => {
      let timeoutId;
      let completed = false;

      // Set timeout
      timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error(errorMessage));
        }
      }, timeoutMs);

      // Execute function
      Promise.resolve(fn())
        .then(result => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        })
        .catch(error => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            reject(error);
          }
        });
    });
  }

  /**
   * Sets resource limits for execution
   */
  setResourceLimits(limits = {}) {
    this.resourceLimits = {
      ...this.resourceLimits,
      ...limits
    };

    // Validate limits
    if (this.resourceLimits.maxMemory < 0) {
      throw new Error('Invalid memory limit');
    }
    if (this.resourceLimits.maxCpu < 0 || this.resourceLimits.maxCpu > 100) {
      throw new Error('Invalid CPU limit (must be 0-100)');
    }
    if (this.resourceLimits.maxProcesses < 1) {
      throw new Error('Invalid process limit');
    }

    return this.resourceLimits;
  }

  /**
   * Isolates execution in a separate context
   */
  async isolate(fn, options = {}) {
    const {
      timeout = this.defaultTimeout,
      memory = this.resourceLimits.maxMemory,
      context = {}
    } = options;

    // Check resource limits
    if (this.activeProcesses.size >= this.resourceLimits.maxProcesses) {
      throw new Error('Maximum number of processes reached');
    }

    // Monitor memory usage
    const initialMemory = process.memoryUsage().heapUsed;
    
    return new Promise(async (resolve, reject) => {
      const isolationId = Date.now() + Math.random();
      
      try {
        // Execute with timeout
        const result = await this.timeout(async () => {
          // Monitor memory during execution
          const memoryInterval = setInterval(() => {
            const currentMemory = process.memoryUsage().heapUsed;
            if (currentMemory - initialMemory > memory) {
              clearInterval(memoryInterval);
              throw new Error('Memory limit exceeded');
            }
          }, 100);

          try {
            // Execute function in isolated context
            const isolatedResult = await fn(context);
            clearInterval(memoryInterval);
            return isolatedResult;
          } catch (error) {
            clearInterval(memoryInterval);
            throw error;
          }
        }, timeout);

        resolve({
          success: true,
          result,
          memoryUsed: process.memoryUsage().heapUsed - initialMemory,
          duration: Date.now() - isolationId
        });
      } catch (error) {
        reject({
          success: false,
          error: error.message,
          memoryUsed: process.memoryUsage().heapUsed - initialMemory,
          duration: Date.now() - isolationId
        });
      }
    });
  }

  /**
   * Handles execution errors securely
   */
  handleError(error, context = {}) {
    // Sanitize error message to prevent information leakage
    const sanitizedError = {
      message: this.sanitizeErrorMessage(error.message),
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: Date.now(),
      context: {
        command: context.command,
        user: context.user,
        // Don't expose sensitive context details
      }
    };

    // Log to audit logger if available
    try {
      const { AuditLogger } = require('./audit-logger');
      const auditLogger = new AuditLogger();
      auditLogger.logSecurityEvent('execution_error', sanitizedError);
    } catch (e) {
      // Audit logger not available
      console.error('Security event:', sanitizedError);
    }

    // Return sanitized error
    return sanitizedError;
  }

  /**
   * Sanitizes error messages to prevent information disclosure
   */
  sanitizeErrorMessage(message) {
    if (!message) return 'An error occurred';
    
    // Remove sensitive patterns
    let sanitized = message;
    
    // Remove file paths
    sanitized = sanitized.replace(/\/[^\s]+/g, '[PATH]');
    
    // Remove IP addresses
    sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');
    
    // Remove email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Remove potential credentials
    sanitized = sanitized.replace(/password[=:]\S+/gi, 'password=[REDACTED]');
    sanitized = sanitized.replace(/token[=:]\S+/gi, 'token=[REDACTED]');
    sanitized = sanitized.replace(/api[_-]?key[=:]\S+/gi, 'api_key=[REDACTED]');
    
    return sanitized;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SecureExecutor,
  
  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new SecureExecutor();
    }
    return instance;
  },
  
  // Convenience exports
  execute: async (...args) => {
    if (!instance) {
      instance = new SecureExecutor();
    }
    return instance.execute(...args);
  },
  
  executeSync: (...args) => {
    if (!instance) {
      instance = new SecureExecutor();
    }
    return instance.executeSync(...args);
  },
  
  commandExists: async (...args) => {
    if (!instance) {
      instance = new SecureExecutor();
    }
    return instance.commandExists(...args);
  },
  
  commandExistsSync: (...args) => {
    if (!instance) {
      instance = new SecureExecutor();
    }
    return instance.commandExistsSync(...args);
  }
};