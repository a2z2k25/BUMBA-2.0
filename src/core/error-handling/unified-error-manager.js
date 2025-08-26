/**
 * BUMBA Unified Error Management System
 * Consolidates all error handling functionality into a single, cohesive system
 * 
 * Features:
 * - Global error boundary with async support
 * - Circuit breaker with intelligent thresholds
 * - Pattern recognition and root cause analysis
 * - Self-healing and automatic recovery
 * - Enhanced error messages and tracking
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { UnifiedHookSystem } = require('../unified-hook-system');

class UnifiedErrorManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Circuit breaker settings
      circuitBreaker: {
        threshold: config.circuitBreakerThreshold || 5,
        timeout: config.circuitBreakerTimeout || 60000,
        resetTime: config.circuitBreakerResetTime || 30000,
        ...config.circuitBreaker
      },
      // Recovery settings
      recovery: {
        maxRetries: config.recoveryMaxRetries || 3,
        retryDelay: config.recoveryRetryDelay || 1000,
        backoffMultiplier: config.recoveryBackoffMultiplier || 2,
        ...config.recovery
      },
      // Pattern recognition settings
      patterns: {
        windowSize: config.patternWindowSize || 100,
        similarityThreshold: config.patternSimilarityThreshold || 0.8,
        ...config.patterns
      },
      // Self-healing settings
      selfHealing: {
        enabled: config.selfHealingEnabled !== false,
        strategies: config.selfHealingStrategies || ['restart', 'reset', 'fallback'],
        ...config.selfHealing
      },
      ...config
    };
    
    // Initialize subsystems
    this.hooks = new UnifiedHookSystem();
    this.errorHistory = [];
    this.errorPatterns = new Map();
    this.circuitBreakers = new Map();
    this.recoveryStrategies = new Map();
    this.rootCauseCache = new Map();
    
    // Error tracking metrics
    this.metrics = {
      totalErrors: 0,
      recoveredErrors: 0,
      criticalErrors: 0,
      errorsByType: new Map(),
      errorsByComponent: new Map(),
      lastError: null,
      uptime: Date.now()
    };
    
    // Initialize default strategies
    this.initializeDefaultStrategies();
    
    // Set up global error handlers
    this.setupGlobalHandlers();
    
    // Start monitoring
    this.startMonitoring();
  }
  
  /**
   * Initialize default recovery strategies
   */
  initializeDefaultStrategies() {
    // Restart strategy
    this.recoveryStrategies.set('restart', async (error, context) => {
      logger.info('🔄 Attempting restart recovery strategy');
      
      if (context.component && context.component.restart) {
        await context.component.restart();
        return { success: true, strategy: 'restart' };
      }
      
      return { success: false, reason: 'Component does not support restart' };
    });
    
    // Reset strategy
    this.recoveryStrategies.set('reset', async (error, context) => {
      logger.info('🔄 Attempting reset recovery strategy');
      
      if (context.component && context.component.reset) {
        await context.component.reset();
        return { success: true, strategy: 'reset' };
      }
      
      // Clear caches and state
      if (context.clearCache) {
        await context.clearCache();
      }
      
      return { success: true, strategy: 'reset' };
    });
    
    // Fallback strategy
    this.recoveryStrategies.set('fallback', async (error, context) => {
      logger.info('🔄 Attempting fallback recovery strategy');
      
      if (context.fallback) {
        const result = await context.fallback();
        return { success: true, strategy: 'fallback', result };
      }
      
      return { success: false, reason: 'No fallback available' };
    });
    
    // Retry strategy
    this.recoveryStrategies.set('retry', async (error, context) => {
      logger.info('🔄 Attempting retry recovery strategy');
      
      const { maxRetries, retryDelay, backoffMultiplier } = this.config.recovery;
      let lastError = error;
      
      for (let i = 0; i < maxRetries; i++) {
        const delay = retryDelay * Math.pow(backoffMultiplier, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          if (context.operation) {
            const result = await context.operation();
            return { success: true, strategy: 'retry', attempts: i + 1, result };
          }
        } catch (e) {
          lastError = e;
          logger.warn(`Retry attempt ${i + 1} failed: ${e.message}`);
        }
      }
      
      return { success: false, reason: 'Max retries exceeded', lastError };
    });
  }
  
  /**
   * Set up global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleCriticalError(error, 'uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleCriticalError(reason, 'unhandledRejection', { promise });
    });
    
    // Handle warnings
    process.on('warning', (warning) => {
      this.handleWarning(warning);
    });
  }
  
  /**
   * Main error handling method
   */
  async handleError(error, context = {}) {
    try {
      // Track error
      this.trackError(error, context);
      
      // Check circuit breaker
      if (this.isCircuitOpen(context.component)) {
        logger.warn(`🟢 Circuit breaker open for ${context.component}`);
        throw new Error(`Service unavailable: ${context.component}`);
      }
      
      // Analyze error pattern
      const pattern = this.analyzeErrorPattern(error);
      
      // Get root cause
      const rootCause = await this.analyzeRootCause(error, context);
      
      // Enhance error message
      const enhancedError = this.enhanceError(error, { pattern, rootCause, context });
      
      // Execute pre-recovery hooks
      await this.hooks.execute('error:beforeRecovery', {
        error: enhancedError,
        context,
        pattern,
        rootCause
      });
      
      // Attempt recovery
      let recoveryResult = null;
      if (this.config.selfHealing.enabled) {
        recoveryResult = await this.attemptRecovery(enhancedError, context);
      }
      
      // Execute post-recovery hooks
      await this.hooks.execute('error:afterRecovery', {
        error: enhancedError,
        context,
        recoveryResult
      });
      
      // Update circuit breaker
      this.updateCircuitBreaker(context.component, !recoveryResult?.success || null);
      
      // Emit events
      this.emit('error:handled', {
        error: enhancedError,
        context,
        recovered: recoveryResult?.success || null
      });
      
      // Return result
      return {
        handled: true,
        recovered: recoveryResult?.success || false,
        error: enhancedError,
        recovery: recoveryResult,
        pattern,
        rootCause
      };
      
    } catch (handlingError) {
      logger.error('Error in error handler:', handlingError);
      return {
        handled: false,
        error: error,
        handlingError
      };
    }
  }
  
  /**
   * Handle critical errors
   */
  handleCriticalError(error, type, context = {}) {
    this.metrics.criticalErrors++;
    
    logger.error(`🔴 CRITICAL ERROR (${type}):`, error);
    
    // Attempt emergency recovery
    this.emergencyRecovery(error, context);
    
    // Emit critical error event
    this.emit('error:critical', {
      error,
      type,
      context,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle warnings
   */
  handleWarning(warning) {
    logger.warn('🟠️ Warning:', warning);
    
    this.emit('warning', {
      warning,
      timestamp: Date.now()
    });
  }
  
  /**
   * Track error for metrics and patterns
   */
  trackError(error, context) {
    const errorInfo = {
      error,
      context,
      timestamp: Date.now(),
      stack: error.stack,
      message: error.message,
      type: error.name || 'Error'
    };
    
    // Add to history
    this.errorHistory.push(errorInfo);
    if (this.errorHistory.length > this.config.patterns.windowSize) {
      this.errorHistory.shift();
    }
    
    // Update metrics
    this.metrics.totalErrors++;
    this.metrics.lastError = errorInfo;
    
    // Track by type
    const typeCount = this.metrics.errorsByType.get(errorInfo.type) || 0;
    this.metrics.errorsByType.set(errorInfo.type, typeCount + 1);
    
    // Track by component
    if (context.component) {
      const componentCount = this.metrics.errorsByComponent.get(context.component) || 0;
      this.metrics.errorsByComponent.set(context.component, componentCount + 1);
    }
  }
  
  /**
   * Analyze error pattern
   */
  analyzeErrorPattern(error) {
    const errorSignature = this.getErrorSignature(error);
    
    // Check for known patterns
    for (const [patternName, pattern] of this.errorPatterns) {
      if (this.matchesPattern(errorSignature, pattern)) {
        return {
          matched: true,
          name: patternName,
          pattern,
          confidence: pattern.confidence || 1.0
        };
      }
    }
    
    // Check for recurring errors
    const similarErrors = this.errorHistory.filter(e => 
      this.calculateSimilarity(e.error, error) > this.config.patterns.similarityThreshold
    );
    
    if (similarErrors.length > 2) {
      const newPattern = {
        signature: errorSignature,
        occurrences: similarErrors.length,
        firstSeen: similarErrors[0].timestamp,
        lastSeen: Date.now()
      };
      
      this.errorPatterns.set(`auto_${Date.now()}`, newPattern);
      
      return {
        matched: true,
        name: 'recurring',
        pattern: newPattern,
        confidence: 0.8
      };
    }
    
    return { matched: false };
  }
  
  /**
   * Analyze root cause
   */
  async analyzeRootCause(error, context) {
    const cacheKey = `${error.message}_${context.component || 'unknown'}`;
    
    // Check cache
    if (this.rootCauseCache.has(cacheKey)) {
      return this.rootCauseCache.get(cacheKey);
    }
    
    const analysis = {
      primaryCause: null,
      contributingFactors: [],
      recommendations: []
    };
    
    // Analyze stack trace
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const relevantLine = stackLines.find(line => 
        line.includes('src/') && !line.includes('node_modules')
      );
      
      if (relevantLine) {
        analysis.primaryCause = `Error originated from: ${relevantLine.trim()}`;
      }
    }
    
    // Check for common causes
    if (error.message.includes('ECONNREFUSED')) {
      analysis.primaryCause = 'Connection refused - service may be down';
      analysis.recommendations.push('Check if the service is running');
      analysis.recommendations.push('Verify network connectivity');
    } else if (error.message.includes('ETIMEDOUT')) {
      analysis.primaryCause = 'Operation timed out';
      analysis.recommendations.push('Increase timeout settings');
      analysis.recommendations.push('Check service performance');
    } else if (error.message.includes('ENOMEM')) {
      analysis.primaryCause = 'Out of memory';
      analysis.recommendations.push('Increase memory allocation');
      analysis.recommendations.push('Check for memory leaks');
    }
    
    // Check context for additional factors
    if (context.component) {
      analysis.contributingFactors.push(`Component: ${context.component}`);
    }
    
    if (context.operation) {
      analysis.contributingFactors.push(`Operation: ${context.operation}`);
    }
    
    // Cache the analysis
    this.rootCauseCache.set(cacheKey, analysis);
    
    // Clear old cache entries
    if (this.rootCauseCache.size > 100) {
      const firstKey = this.rootCauseCache.keys().next().value;
      this.rootCauseCache.delete(firstKey);
    }
    
    return analysis;
  }
  
  /**
   * Enhance error with additional information
   */
  enhanceError(error, metadata) {
    const enhanced = Object.create(error);
    
    enhanced.originalMessage = error.message;
    enhanced.enhancedMessage = this.createEnhancedMessage(error, metadata);
    enhanced.metadata = metadata;
    enhanced.timestamp = Date.now();
    enhanced.suggestions = this.generateSuggestions(error, metadata);
    
    // Override toString
    enhanced.toString = function() {
      return `${this.name}: ${this.enhancedMessage}\n` +
             `Root Cause: ${this.metadata.rootCause?.primaryCause || 'Unknown'}\n` +
             `Suggestions: ${this.suggestions.join(', ')}`;
    };
    
    return enhanced;
  }
  
  /**
   * Create enhanced error message
   */
  createEnhancedMessage(error, metadata) {
    let message = error.message;
    
    if (metadata.pattern?.matched || null) {
      message += ` [Pattern: ${metadata.pattern.name}]`;
    }
    
    if (metadata.rootCause?.primaryCause || null) {
      message += ` [Cause: ${metadata.rootCause.primaryCause}]`;
    }
    
    if (metadata.context?.component || null) {
      message += ` [Component: ${metadata.context.component}]`;
    }
    
    return message;
  }
  
  /**
   * Generate suggestions for error resolution
   */
  generateSuggestions(error, metadata) {
    const suggestions = [];
    
    // Add root cause recommendations
    if (metadata.rootCause?.recommendations || null) {
      suggestions.push(...metadata.rootCause.recommendations);
    }
    
    // Add pattern-based suggestions
    if (metadata.pattern?.pattern || null?.suggestions) {
      suggestions.push(...metadata.pattern.pattern.suggestions);
    }
    
    // Add generic suggestions based on error type
    if (error.name === 'TypeError') {
      suggestions.push('Check variable types and null values');
    } else if (error.name === 'ReferenceError') {
      suggestions.push('Verify all variables are defined');
    } else if (error.name === 'SyntaxError') {
      suggestions.push('Check for syntax errors in the code');
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
  
  /**
   * Attempt recovery using configured strategies
   */
  async attemptRecovery(error, context) {
    const strategies = this.config.selfHealing.strategies;
    
    for (const strategyName of strategies) {
      const strategy = this.recoveryStrategies.get(strategyName);
      
      if (!strategy) {
        logger.warn(`Recovery strategy '${strategyName}' not found`);
        continue;
      }
      
      try {
        logger.info(`🔧 Attempting recovery with strategy: ${strategyName}`);
        const result = await strategy(error, context);
        
        if (result.success) {
          this.metrics.recoveredErrors++;
          logger.info(`🏁 Recovery successful with strategy: ${strategyName}`);
          return result;
        }
        
      } catch (strategyError) {
        logger.error(`Recovery strategy '${strategyName}' failed:`, strategyError);
      }
    }
    
    return { success: false, reason: 'All recovery strategies failed' };
  }
  
  /**
   * Emergency recovery for critical errors
   */
  async emergencyRecovery(error, context) {
    logger.info('🔴 Initiating emergency recovery');
    
    try {
      // Save state for debugging
      const emergencyDump = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        metrics: this.metrics,
        timestamp: Date.now()
      };
      
      // Try to save to file
      const fs = require('fs').promises;
      await fs.writeFile(
        `emergency_dump_${Date.now()}.json`,
        JSON.stringify(emergencyDump, null, 2)
      );
      
      // Execute emergency hooks
      await this.hooks.execute('error:emergency', emergencyDump);
      
      // Attempt graceful shutdown if too many critical errors
      if (this.metrics.criticalErrors > 10) {
        logger.error('Too many critical errors, initiating graceful shutdown');
        this.emit('shutdown:required', { reason: 'critical_errors_exceeded' });
      }
      
    } catch (emergencyError) {
      logger.error('Emergency recovery failed:', emergencyError);
    }
  }
  
  /**
   * Circuit breaker management
   */
  isCircuitOpen(component) {
    if (!component) return false;
    
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return false;
    
    if (breaker.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - breaker.openedAt > this.config.circuitBreaker.resetTime) {
        breaker.state = 'half-open';
        breaker.failures = 0;
      } else {
        return true;
      }
    }
    
    return false;
  }
  
  updateCircuitBreaker(component, failed) {
    if (!component) return;
    
    let breaker = this.circuitBreakers.get(component);
    
    if (!breaker) {
      breaker = {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastFailure: null,
        openedAt: null
      };
      this.circuitBreakers.set(component, breaker);
    }
    
    if (failed) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= this.config.circuitBreaker.threshold) {
        breaker.state = 'open';
        breaker.openedAt = Date.now();
        logger.warn(`🟢 Circuit breaker opened for ${component}`);
        this.emit('circuitBreaker:open', { component, breaker });
      }
    } else {
      breaker.successes++;
      
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.failures = 0;
        logger.info(`🟢 Circuit breaker closed for ${component}`);
        this.emit('circuitBreaker:closed', { component, breaker });
      }
    }
  }
  
  /**
   * Calculate similarity between errors
   */
  calculateSimilarity(error1, error2) {
    if (error1.message === error2.message) return 1.0;
    
    // Simple similarity based on message similarity
    const msg1 = error1.message.toLowerCase();
    const msg2 = error2.message.toLowerCase();
    
    const words1 = msg1.split(/\s+/);
    const words2 = msg2.split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = (commonWords.length * 2) / (words1.length + words2.length);
    
    return similarity;
  }
  
  /**
   * Get error signature for pattern matching
   */
  getErrorSignature(error) {
    return {
      type: error.name,
      message: error.message.replace(/[0-9]/g, 'N'), // Normalize numbers
      stack: error.stack ? error.stack.split('\n')[0] : null
    };
  }
  
  /**
   * Check if error matches pattern
   */
  matchesPattern(signature, pattern) {
    if (pattern.signature.type !== signature.type) return false;
    
    if (pattern.signature.message) {
      const pattern1 = pattern.signature.message.toLowerCase();
      const pattern2 = signature.message.toLowerCase();
      
      if (!pattern2.includes(pattern1) && !pattern1.includes(pattern2)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Start monitoring for error patterns
   */
  startMonitoring() {
    // Monitor error frequency
    setInterval(() => {
      const recentErrors = this.errorHistory.filter(e => 
        Date.now() - e.timestamp < 60000 // Last minute
      );
      
      if (recentErrors.length > 10) {
        this.emit('error:highFrequency', {
          count: recentErrors.length,
          errors: recentErrors
        });
      }
      
      // Clean old root cause cache
      if (this.rootCauseCache.size > 200) {
        const entriesToDelete = this.rootCauseCache.size - 100;
        const keys = Array.from(this.rootCauseCache.keys());
        for (let i = 0; i < entriesToDelete; i++) {
          this.rootCauseCache.delete(keys[i]);
        }
      }
      
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Register custom recovery strategy
   */
  registerRecoveryStrategy(name, handler) {
    this.recoveryStrategies.set(name, handler);
    logger.info(`Registered recovery strategy: ${name}`);
  }
  
  /**
   * Register error pattern
   */
  registerErrorPattern(name, pattern) {
    this.errorPatterns.set(name, pattern);
    logger.info(`Registered error pattern: ${name}`);
  }
  
  /**
   * Get error metrics
   */
  getMetrics() {
    // Calculate patterns from error history
    const patterns = {};
    this.errorHistory.forEach(error => {
      const key = error.operation || error.context || 'unknown';
      patterns[key] = (patterns[key] || 0) + 1;
    });
    
    return {
      ...this.metrics,
      totalErrors: this.errorHistory.length,
      patterns: Object.keys(patterns).length > 0 ? patterns : undefined,
      uptime: Date.now() - this.metrics.uptime,
      errorRate: this.metrics.totalErrors / ((Date.now() - this.metrics.uptime) / 1000),
      recoveryRate: this.metrics.totalErrors > 0 
        ? this.metrics.recoveredErrors / this.metrics.totalErrors 
        : 0,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([component, breaker]) => ({
        component,
        ...breaker
      }))
    };
  }
  
  /**
   * Stop the error manager (cleanup)
   */
  stop() {
    // Clear any intervals or timers
    if (this.metricsInterval && typeof this.metricsInterval !== "undefined") {
      clearInterval(this.metricsInterval);
    }
    
    // Trim error history to prevent memory leaks
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-100);
    }
    
    logger.info('Error manager stopped');
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalErrors: 0,
      recoveredErrors: 0,
      criticalErrors: 0,
      errorsByType: new Map(),
      errorsByComponent: new Map(),
      lastError: null,
      uptime: Date.now()
    };
    
    this.errorHistory = [];
    this.circuitBreakers.clear();
    
    logger.info('Error metrics reset');
  }
  
  /**
   * Create async error boundary
   */
  createAsyncBoundary(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const result = await this.handleError(error, context);
        
        if (result.recovered) {
          return result.recovery.result;
        }
        
        throw result.error;
      }
    };
  }
  
  /**
   * Wrap function with error handling
   */
  wrap(fn, context = {}) {
    if (typeof fn === 'function') {
      if (fn.constructor.name === 'AsyncFunction') {
        return this.createAsyncBoundary(fn, context);
      } else {
        return (...args) => {
          try {
            return fn(...args);
          } catch (error) {
            this.handleError(error, context);
            throw error;
          }
        };
      }
    }
    
    return fn;
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create singleton instance
 */
function getInstance(config) {
  if (!instance) {
    instance = new UnifiedErrorManager(config);
  }
  return instance;
}

module.exports = {
  UnifiedErrorManager,
  getInstance,
  
  // Export for convenience
  handleError: (error, context) => getInstance().handleError(error, context),
  wrap: (fn, context) => getInstance().wrap(fn, context),
  getMetrics: () => getInstance().getMetrics()
};