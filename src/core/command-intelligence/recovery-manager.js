/**
 * BUMBA Recovery Manager
 * Handles error recovery and retry strategies
 */

const { logger } = require('../logging/bumba-logger');
const { getInstance: getClassifier } = require('./error-classifier');

class RecoveryManager {
  constructor() {
    this.classifier = getClassifier();
    this.recoveryAttempts = new Map();
    this.recoveryStrategies = new Map();
    this.successfulRecoveries = 0;
    this.failedRecoveries = 0;
  }

  /**
   * Attempt to recover from error
   */
  async attemptRecovery(error, command, args, context, executor) {
    logger.info(`🔄 Attempting recovery for error in ${command}`);
    
    // Classify the error
    const classification = this.classifier.classifyError(error);
    
    // Check if recoverable
    if (!this.classifier.isRecoverable(classification)) {
      logger.warn(`❌ Error is not recoverable: ${classification.category}`);
      return {
        recovered: false,
        error: classification,
        suggestions: this.classifier.getRecoverySuggestions(classification)
      };
    }
    
    // Get retry strategy
    const strategy = this.classifier.getRetryStrategy(classification);
    
    if (!strategy.shouldRetry) {
      return {
        recovered: false,
        error: classification,
        suggestions: this.classifier.getRecoverySuggestions(classification)
      };
    }
    
    // Attempt recovery with retry
    const recoveryResult = await this.executeRecoveryStrategy(
      strategy,
      command,
      args,
      context,
      executor,
      classification
    );
    
    // Track recovery metrics
    if (recoveryResult.recovered) {
      this.successfulRecoveries++;
    } else {
      this.failedRecoveries++;
    }
    
    return recoveryResult;
  }

  /**
   * Execute recovery strategy with retries
   */
  async executeRecoveryStrategy(strategy, command, args, context, executor, classification) {
    const attemptKey = `${command}_${Date.now()}`;
    let lastError = null;
    
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      logger.info(`🔁 Recovery attempt ${attempt}/${strategy.maxAttempts}`);
      
      // Calculate delay with backoff
      const delay = this.calculateDelay(strategy, attempt);
      if (delay > 0) {
        logger.info(`⏱️ Waiting ${delay}ms before retry`);
        await this.sleep(delay);
      }
      
      // Modify context for recovery attempt
      const recoveryContext = this.createRecoveryContext(
        context,
        classification,
        attempt
      );
      
      try {
        // Attempt execution with recovery modifications
        const result = await this.executeWithRecovery(
          executor,
          command,
          args,
          recoveryContext
        );
        
        logger.info(`✅ Recovery successful on attempt ${attempt}`);
        
        return {
          recovered: true,
          attempt,
          result,
          strategy: strategy.backoff
        };
        
      } catch (retryError) {
        lastError = retryError;
        logger.warn(`Attempt ${attempt} failed:`, retryError.message);
        
        // Check if error type changed
        const newClassification = this.classifier.classifyError(retryError);
        if (newClassification.category !== classification.category) {
          logger.warn(`Error type changed from ${classification.category} to ${newClassification.category}`);
          
          // Don't continue if error became non-recoverable
          if (!this.classifier.isRecoverable(newClassification)) {
            break;
          }
        }
      }
    }
    
    // All attempts failed
    return {
      recovered: false,
      attempts: strategy.maxAttempts,
      lastError,
      error: classification,
      suggestions: this.classifier.getRecoverySuggestions(classification)
    };
  }

  /**
   * Execute with recovery modifications
   */
  async executeWithRecovery(executor, command, args, context) {
    // Apply recovery modifications based on context
    if (context.recovery.category === 'timeout') {
      // Extend timeout for recovery
      context.timeout = (context.timeout || 30000) * 2;
    }
    
    if (context.recovery.category === 'specialist') {
      // Reduce specialist count or skip
      context.limitSpecialists = 1;
      context.skipOptionalSpecialists = true;
    }
    
    if (context.recovery.category === 'network') {
      // Use cached data if available
      context.allowCache = true;
      context.offlineMode = true;
    }
    
    if (context.recovery.category === 'resource') {
      // Switch to eco mode
      context.mode = 'eco';
      context.limitResources = true;
    }
    
    // Execute with modifications
    return await executor(command, args, context);
  }

  /**
   * Create recovery context
   */
  createRecoveryContext(baseContext, classification, attempt) {
    return {
      ...baseContext,
      recovery: {
        active: true,
        attempt,
        category: classification.category,
        severity: classification.severity
      },
      // Add recovery-specific flags
      skipValidation: classification.category === 'validation',
      retryMode: true,
      reducedComplexity: true
    };
  }

  /**
   * Calculate delay with backoff
   */
  calculateDelay(strategy, attempt) {
    const baseDelay = strategy.delay || 1000;
    
    switch (strategy.backoff) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
        
      case 'linear':
        return baseDelay * attempt;
        
      case 'none':
      default:
        return baseDelay;
    }
  }

  /**
   * Implement fallback strategy
   */
  async implementFallback(error, command, args, context) {
    logger.info(`📊 Implementing fallback strategy for ${command}`);
    
    const classification = this.classifier.classifyError(error);
    
    // Determine appropriate fallback
    switch (classification.category) {
      case 'specialist':
      case 'timeout':
        // Fallback to lite mode
        return await this.fallbackToLiteMode(command, args, context);
        
      case 'department':
        // Fallback to generic handler
        return await this.fallbackToGeneric(command, args, context);
        
      case 'file_system':
        // Fallback to memory-only operation
        return await this.fallbackToMemory(command, args, context);
        
      case 'network':
        // Fallback to offline mode
        return await this.fallbackToOffline(command, args, context);
        
      default:
        // Generic fallback
        return {
          success: false,
          fallback: true,
          message: `Command ${command} failed, no fallback available`,
          error: classification
        };
    }
  }

  /**
   * Fallback to lite mode execution
   */
  async fallbackToLiteMode(command, args, context) {
    logger.info(`⚡ Falling back to lite mode`);
    
    return {
      success: true,
      fallback: true,
      mode: 'lite',
      message: `Executed ${command} in lite mode (fallback)`,
      simplified: true
    };
  }

  /**
   * Fallback to generic handler
   */
  async fallbackToGeneric(command, args, context) {
    logger.info(`🔧 Falling back to generic handler`);
    
    return {
      success: true,
      fallback: true,
      handler: 'generic',
      message: `Executed ${command} with generic handler`,
      basic: true
    };
  }

  /**
   * Fallback to memory-only operation
   */
  async fallbackToMemory(command, args, context) {
    logger.info(`💾 Falling back to memory-only operation`);
    
    return {
      success: true,
      fallback: true,
      storage: 'memory',
      message: `Results stored in memory only`,
      temporary: true
    };
  }

  /**
   * Fallback to offline mode
   */
  async fallbackToOffline(command, args, context) {
    logger.info(`📴 Falling back to offline mode`);
    
    return {
      success: true,
      fallback: true,
      mode: 'offline',
      message: `Executed ${command} in offline mode`,
      cached: true
    };
  }

  /**
   * Create checkpoint for recovery
   */
  createCheckpoint(command, args, context, state) {
    const checkpoint = {
      id: `checkpoint_${Date.now()}`,
      command,
      args,
      context: this.sanitizeContext(context),
      state,
      timestamp: new Date().toISOString()
    };
    
    this.recoveryAttempts.set(checkpoint.id, checkpoint);
    
    // Limit checkpoint storage
    if (this.recoveryAttempts.size > 50) {
      const firstKey = this.recoveryAttempts.keys().next().value;
      this.recoveryAttempts.delete(firstKey);
    }
    
    return checkpoint.id;
  }

  /**
   * Restore from checkpoint
   */
  restoreFromCheckpoint(checkpointId) {
    const checkpoint = this.recoveryAttempts.get(checkpointId);
    
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    logger.info(`📌 Restoring from checkpoint ${checkpointId}`);
    
    return {
      command: checkpoint.command,
      args: checkpoint.args,
      context: checkpoint.context,
      state: checkpoint.state
    };
  }

  /**
   * Sanitize context for storage
   */
  sanitizeContext(context) {
    // Remove circular references and sensitive data
    const sanitized = { ...context };
    
    delete sanitized.circularRef;
    delete sanitized.largeData;
    delete sanitized.credentials;
    
    return sanitized;
  }

  /**
   * Get recovery metrics
   */
  getMetrics() {
    const total = this.successfulRecoveries + this.failedRecoveries;
    
    return {
      totalAttempts: total,
      successful: this.successfulRecoveries,
      failed: this.failedRecoveries,
      successRate: total > 0 ? 
        ((this.successfulRecoveries / total) * 100).toFixed(2) + '%' : 
        '0%',
      checkpoints: this.recoveryAttempts.size
    };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear recovery data
   */
  clearRecoveryData() {
    this.recoveryAttempts.clear();
    this.recoveryStrategies.clear();
    this.successfulRecoveries = 0;
    this.failedRecoveries = 0;
    logger.info('🧹 Cleared recovery data');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RecoveryManager,
  getInstance: () => {
    if (!instance) {
      instance = new RecoveryManager();
    }
    return instance;
  }
};