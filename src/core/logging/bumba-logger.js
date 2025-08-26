/**
 * BUMBA Professional Logging System
 * Structured logging with levels, context, and production readiness
 * With minimal, tasteful theming
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const util = require('util');

// Try to load theme, fallback if not available
let theme;
try {
  theme = require('../themes/bumba-theme-minimal');
} catch (e) {
  // Fallback to no theming if file doesn't exist yet
  theme = null;
}

class BumbaLogger {
  constructor(options = {}) {
    this.name = options.name || 'BUMBA';
    
    // Log levels - define before using in parseLevel
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.level = this.parseLevel(options.level || process.env.BUMBA_LOG_LEVEL || 'info');
    this.outputs = options.outputs || ['console'];
    this.format = options.format || 'json';
    this.colorize = options.colorize !== false && process.stdout.isTTY;
    this.timestamp = options.timestamp !== false;
    
    // Level colors for console output
    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[32m', // Green
      debug: '\x1b[36m', // Cyan
      trace: '\x1b[35m', // Magenta
      reset: '\x1b[0m'
    };
    
    // Level emojis - minimal set only
    this.emojis = {
      error: '🔴',
      warn: '🟠',
      info: '🏁',
      debug: '🟢',
      trace: '🟡'
    };
    
    // File output configuration
    this.fileOptions = {
      dir: options.logDir || path.join(os.homedir(), '.claude', 'logs'),
      maxSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 5,
      filename: options.filename || 'bumba.log'
    };
    
    // Performance tracking
    this.metrics = {
      logCount: 0,
      errorCount: 0,
      warnCount: 0
    };
    
    // Initialize file logging if needed
    if (this.outputs.includes('file')) {
      this.initializeFileLogging();
    }
  }

  /**
   * Parse log level string to number
   */
  parseLevel(level) {
    if (typeof level === 'number') {return level;}
    return this.levels[level.toLowerCase()] || this.levels.info;
  }

  /**
   * Initialize file logging
   */
  async initializeFileLogging() {
    try {
      await fs.mkdir(this.fileOptions.dir, { recursive: true });
      this.fileStream = true; // Flag that file logging is ready
    } catch (error) {
      console.error('Failed to initialize file logging:', error);
      this.fileStream = false;
    }
  }

  /**
   * Core logging method
   */
  log(level, message, context = {}) {
    // Check if we should log this level
    if (this.levels[level] > this.level) {return;}
    
    // Update metrics
    this.metrics.logCount++;
    if (level === 'error') {this.metrics.errorCount++;}
    if (level === 'warn') {this.metrics.warnCount++;}
    
    // Create log entry
    const logEntry = this.createLogEntry(level, message, context);
    
    // Output to configured destinations
    for (const output of this.outputs) {
      this.outputLog(output, logEntry);
    }
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, context) {
    const entry = {
      level,
      message: this.formatMessage(message),
      name: this.name,
      pid: process.pid,
      hostname: os.hostname()
    };
    
    if (this.timestamp) {
      entry.timestamp = new Date().toISOString();
    }
    
    // Add context if provided
    if (Object.keys(context).length > 0) {
      entry.context = this.sanitizeContext(context);
    }
    
    // Add stack trace for errors
    if (context.error || context.stack) {
      entry.stack = context.error?.stack || context.stack;
    }
    
    return entry;
  }

  /**
   * Format message (handle various input types)
   */
  formatMessage(message) {
    if (typeof message === 'string') {return message;}
    if (message instanceof Error) {return message.message;}
    return util.inspect(message, { depth: 3, colors: false });
  }

  /**
   * Output log to destination
   */
  outputLog(output, logEntry) {
    switch (output) {
      case 'console':
        this.outputToConsole(logEntry);
        break;
      case 'file':
        this.outputToFile(logEntry);
        break;
      case 'json':
        this.outputAsJson(logEntry);
        break;
    }
  }

  /**
   * Output to console with formatting
   */
  outputToConsole(logEntry) {
    if (this.format === 'json' && !this.colorize) {
      console.log(JSON.stringify(logEntry));
      return;
    }
    
    // Use theme if available
    if (theme && this.colorize) {
      const { level, message, timestamp, context, stack } = logEntry;
      
      // Map log levels to theme status methods
      const statusMap = {
        error: 'error',
        warn: 'warning',
        info: 'complete',
        debug: 'success',
        trace: 'progress'
      };
      
      let output = '';
      
      if (timestamp) {
        output += theme.text.dim(`[${new Date(timestamp).toLocaleTimeString()}] `);
      }
      
      // Use themed status formatting
      if (theme.status[statusMap[level]]) {
        output += theme.status[statusMap[level]](message);
      } else {
        output += `${this.emojis[level]} ${message}`;
      }
      
      if (context && Object.keys(context).length > 0) {
        output += '\n  ' + theme.text.dim('Context: ') + 
                  util.inspect(context, { depth: 2, colors: true });
      }
      
      if (stack) {
        output += '\n  ' + theme.text.dim('Stack: ') + theme.text.secondary(stack);
      }
      
      console.log(output);
    } else {
      // Fallback to original formatting
      const { level, message, timestamp, context, stack } = logEntry;
      const emoji = this.emojis[level];
      const color = this.colorize ? this.colors[level] : '';
      const reset = this.colorize ? this.colors.reset : '';
      
      let output = '';
      
      if (timestamp) {
        output += `[${new Date(timestamp).toLocaleTimeString()}] `;
      }
      
      output += `${emoji} ${color}${level.toUpperCase()}${reset}: ${message}`;
      
      if (context && Object.keys(context).length > 0) {
        output += '\n  Context: ' + util.inspect(context, { depth: 2, colors: this.colorize });
      }
      
      if (stack) {
        output += '\n  Stack: ' + stack;
      }
      
      console.log(output);
    }
  }

  /**
   * Output to file
   */
  async outputToFile(logEntry) {
    if (!this.fileStream) {return;}
    
    try {
      const filename = path.join(this.fileOptions.dir, this.fileOptions.filename);
      const line = JSON.stringify(logEntry) + '\n';
      
      // Check file size and rotate if needed
      await this.rotateLogIfNeeded(filename);
      
      // Append to file
      await fs.appendFile(filename, line);
    } catch (error) {
      // Silent fail to avoid recursion
      if (this.metrics.logCount % 100 === 0) {
        console.error('File logging error:', error.message);
      }
    }
  }

  /**
   * Output as JSON to stdout
   */
  outputAsJson(logEntry) {
    process.stdout.write(JSON.stringify(logEntry) + '\n');
  }

  /**
   * Rotate log file if it exceeds max size
   */
  async rotateLogIfNeeded(filename) {
    try {
      const stats = await fs.stat(filename);
      
      if (stats.size > this.fileOptions.maxSize) {
        // Rotate files
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const rotatedName = filename.replace('.log', `-${timestamp}.log`);
        
        await fs.rename(filename, rotatedName);
        
        // Clean up old files
        await this.cleanupOldLogs();
      }
    } catch (error) {
      // File doesn't exist yet, that's fine
    }
  }

  /**
   * Clean up old log files
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.fileOptions.dir);
      const logFiles = files
        .filter(f => f.startsWith(path.basename(this.fileOptions.filename).replace('.log', '')))
        .sort()
        .reverse();
      
      // Remove old files beyond maxFiles limit
      for (let i = this.fileOptions.maxFiles; i < logFiles.length; i++) {
        await fs.unlink(path.join(this.fileOptions.dir, logFiles[i]));
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  sanitizeContext(context) {
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'apiKey', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Convenience methods
  error(message, context) {
    this.log('error', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  info(message, context) {
    this.log('info', message, context);
  }

  debug(message, context) {
    this.log('debug', message, context);
  }

  trace(message, context) {
    this.log('trace', message, context);
  }

  /**
   * Create child logger with additional context
   */
  child(options = {}) {
    return new BumbaLogger({
      ...this.options,
      name: options.name || `${this.name}:${options.module || 'child'}`,
      level: options.level || this.level
    });
  }

  /**
   * Get logging metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Update log level at runtime
   */
  setLevel(level) {
    this.level = this.parseLevel(level);
  }

  /**
   * Flush any pending logs (for graceful shutdown)
   */
  async flush() {
    // In a real implementation, this would flush any buffered logs
    return Promise.resolve();
  }
}

// Create default logger instance
const defaultLogger = new BumbaLogger({
  name: 'BUMBA',
  level: process.env.BUMBA_LOG_LEVEL || 'info',
  outputs: process.env.BUMBA_LOG_FILE ? ['console', 'file'] : ['console'],
  colorize: process.env.BUMBA_NO_COLOR !== 'true'
});

// Export both class and convenience methods
module.exports = {
  BumbaLogger,
  logger: defaultLogger,
  
  // Convenience methods using default logger
  error: (message, context) => defaultLogger.error(message, context),
  warn: (message, context) => defaultLogger.warn(message, context),
  info: (message, context) => defaultLogger.info(message, context),
  debug: (message, context) => defaultLogger.debug(message, context),
  trace: (message, context) => defaultLogger.trace(message, context),
  
  // Create a new logger instance
  createLogger: (options) => new BumbaLogger(options),
  
  // Update default logger level
  setLevel: (level) => defaultLogger.setLevel(level),
  
  // Get metrics
  getMetrics: () => defaultLogger.getMetrics()
};