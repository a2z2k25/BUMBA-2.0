/**
 * BUMBA Log Controller
 * Centralized control over logging verbosity
 */

const winston = require('winston');

class LogController {
  constructor() {
    // Determine log level
    this.level = this.determineLogLevel();
    
    // Patterns to always suppress
    this.suppressPatterns = [
      /Integration Hooks/,
      /hooks registered/,
      /connected to.*manager/,
      /initialized.*router/,
      /detected - Enhanced/,
      /not found - Using/,
      /orchestration initialized/,
      /Task Orchestrator initialized/,
      /Starting advanced.*orchestration/,
      /enabled$/,
      /Free Tier Usage Status/,
      /GEMINI:/,
      /DEEPSEEK:/,
      /QWEN:/
    ];
    
    // Override console.log in production
    if (this.level !== 'DEBUG') {
      this.overrideConsole();
    }
  }
  
  /**
   * Determine appropriate log level
   */
  determineLogLevel() {
    // Priority order for log level determination
    if (process.env.LOG_LEVEL) {
      return process.env.LOG_LEVEL.toUpperCase();
    }
    
    if (process.env.BUMBA_OFFLINE === 'true') {
      return 'ERROR';
    }
    
    if (process.env.NODE_ENV === 'production') {
      return 'ERROR';
    }
    
    if (process.env.NODE_ENV === 'test') {
      return 'ERROR';
    }
    
    if (process.env.BUMBA_FAST_START === 'true') {
      return 'WARN';
    }
    
    // Default to INFO
    return 'INFO';
  }
  
  /**
   * Check if a message should be suppressed
   */
  shouldSuppress(message) {
    if (!message) return false;
    
    const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    return this.suppressPatterns.some(pattern => pattern.test(msgStr));
  }
  
  /**
   * Override console methods to reduce noise
   */
  overrideConsole() {
    const originalLog = console.log;
    const originalInfo = console.info;
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (!this.shouldSuppress(message)) {
        if (this.level === 'ERROR' && !message.includes('Error') && !message.includes('❌')) {
          return; // Suppress non-errors in ERROR mode
        }
        originalLog.apply(console, args);
      }
    };
    
    console.info = (...args) => {
      if (this.level !== 'ERROR' && this.level !== 'WARN') {
        const message = args.join(' ');
        if (!this.shouldSuppress(message)) {
          originalInfo.apply(console, args);
        }
      }
    };
    
    // Always allow errors and warnings
    // console.error and console.warn remain unchanged
  }
  
  /**
   * Create a controlled logger instance
   */
  createLogger(name = 'BUMBA') {
    const logLevel = this.level === 'DEBUG' ? 'debug' : 
                     this.level === 'INFO' ? 'info' :
                     this.level === 'WARN' ? 'warn' : 'error';
    
    const logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
          silent: this.level === 'SILENT'
        })
      ]
    });
    
    // Wrap logger methods to check suppression
    const originalInfo = logger.info.bind(logger);
    logger.info = (message, ...args) => {
      if (!this.shouldSuppress(message)) {
        originalInfo(message, ...args);
      }
    };
    
    return logger;
  }
  
  /**
   * Set log level dynamically
   */
  setLevel(level) {
    this.level = level.toUpperCase();
    process.env.LOG_LEVEL = this.level;
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return {
      level: this.level,
      suppressing: this.level !== 'DEBUG',
      patterns: this.suppressPatterns.length
    };
  }
}

// Initialize immediately
const controller = new LogController();

module.exports = {
  controller,
  setLogLevel: (level) => controller.setLevel(level),
  getLogConfig: () => controller.getConfig(),
  createLogger: (name) => controller.createLogger(name)
};