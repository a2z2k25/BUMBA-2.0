/**
 * BUMBA Error Classifier
 * Classifies and categorizes errors for intelligent handling
 */

const { logger } = require('../logging/bumba-logger');

class ErrorClassifier {
  constructor() {
    this.errorCategories = {
      'user_input': {
        severity: 'low',
        recoverable: true,
        patterns: [
          /invalid.*argument/i,
          /missing.*parameter/i,
          /unknown.*command/i,
          /invalid.*option/i
        ]
      },
      'file_system': {
        severity: 'medium',
        recoverable: true,
        patterns: [
          /ENOENT/,
          /EACCES/,
          /EISDIR/,
          /file.*not.*found/i,
          /permission.*denied/i,
          /directory.*exists/i
        ]
      },
      'network': {
        severity: 'medium',
        recoverable: true,
        patterns: [
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ENOTFOUND/,
          /network.*error/i,
          /connection.*failed/i,
          /timeout/i
        ]
      },
      'dependency': {
        severity: 'high',
        recoverable: false,
        patterns: [
          /cannot.*find.*module/i,
          /module.*not.*found/i,
          /dependency.*missing/i,
          /require.*failed/i
        ]
      },
      'specialist': {
        severity: 'medium',
        recoverable: true,
        patterns: [
          /specialist.*failed/i,
          /specialist.*not.*available/i,
          /analysis.*failed/i,
          /specialist.*timeout/i
        ]
      },
      'department': {
        severity: 'high',
        recoverable: false,
        patterns: [
          /department.*not.*found/i,
          /manager.*failed/i,
          /department.*error/i,
          /manager.*not.*available/i
        ]
      },
      'execution': {
        severity: 'high',
        recoverable: false,
        patterns: [
          /execution.*failed/i,
          /command.*failed/i,
          /process.*failed/i,
          /runtime.*error/i
        ]
      },
      'resource': {
        severity: 'critical',
        recoverable: false,
        patterns: [
          /out.*of.*memory/i,
          /heap.*out.*of.*memory/i,
          /ENOMEM/,
          /resource.*exhausted/i,
          /quota.*exceeded/i
        ]
      },
      'timeout': {
        severity: 'medium',
        recoverable: true,
        patterns: [
          /timeout/i,
          /execution.*timeout/i,
          /task.*timeout/i,
          /operation.*timed.*out/i
        ]
      },
      'validation': {
        severity: 'low',
        recoverable: true,
        patterns: [
          /validation.*failed/i,
          /invalid.*format/i,
          /schema.*validation/i,
          /type.*error/i
        ]
      }
    };
    
    this.errorHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Classify an error
   */
  classifyError(error) {
    const errorInfo = this.extractErrorInfo(error);
    
    // Try to match error to category
    let category = 'unknown';
    let confidence = 0;
    
    for (const [cat, config] of Object.entries(this.errorCategories)) {
      const matchScore = this.matchError(errorInfo, config.patterns);
      if (matchScore > confidence) {
        category = cat;
        confidence = matchScore;
      }
    }
    
    const classification = {
      category,
      confidence,
      severity: this.errorCategories[category]?.severity || 'unknown',
      recoverable: this.errorCategories[category]?.recoverable ?? false,
      message: errorInfo.message,
      code: errorInfo.code,
      stack: errorInfo.stack,
      timestamp: new Date().toISOString()
    };
    
    // Add to history
    this.addToHistory(classification);
    
    logger.info(`🏷️ Classified error as: ${category} (confidence: ${confidence.toFixed(2)})`);
    
    return classification;
  }

  /**
   * Extract error information
   */
  extractErrorInfo(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.code,
        stack: error.stack,
        name: error.name
      };
    }
    
    if (typeof error === 'string') {
      return {
        message: error,
        code: null,
        stack: null,
        name: 'StringError'
      };
    }
    
    return {
      message: JSON.stringify(error),
      code: error?.code,
      stack: error?.stack,
      name: error?.name || 'UnknownError'
    };
  }

  /**
   * Match error against patterns
   */
  matchError(errorInfo, patterns) {
    let score = 0;
    const messageToCheck = `${errorInfo.message} ${errorInfo.code || ''}`.toLowerCase();
    
    for (const pattern of patterns) {
      if (pattern.test(messageToCheck)) {
        score += 1;
      }
    }
    
    return score / patterns.length;
  }

  /**
   * Get recovery suggestions for error
   */
  getRecoverySuggestions(classification) {
    const suggestions = [];
    
    switch (classification.category) {
      case 'user_input':
        suggestions.push('Check command syntax and arguments');
        suggestions.push('Use "bumba help <command>" for usage information');
        suggestions.push('Verify all required parameters are provided');
        break;
        
      case 'file_system':
        suggestions.push('Check if file/directory exists');
        suggestions.push('Verify file permissions');
        suggestions.push('Ensure path is correct');
        if (classification.message.includes('EACCES')) {
          suggestions.push('Try running with appropriate permissions');
        }
        break;
        
      case 'network':
        suggestions.push('Check network connection');
        suggestions.push('Verify service is available');
        suggestions.push('Retry after a few seconds');
        suggestions.push('Check firewall settings');
        break;
        
      case 'dependency':
        suggestions.push('Run "npm install" to install dependencies');
        suggestions.push('Check package.json for missing modules');
        suggestions.push('Verify node_modules directory');
        break;
        
      case 'specialist':
        suggestions.push('Try running in lite mode for faster execution');
        suggestions.push('Reduce number of specialists with eco mode');
        suggestions.push('Check specialist availability');
        break;
        
      case 'timeout':
        suggestions.push('Try with simpler arguments');
        suggestions.push('Use lite mode for faster execution');
        suggestions.push('Increase timeout in configuration');
        suggestions.push('Break task into smaller parts');
        break;
        
      case 'resource':
        suggestions.push('Free up system memory');
        suggestions.push('Close unnecessary applications');
        suggestions.push('Use eco mode for resource-conscious execution');
        suggestions.push('Consider splitting large operations');
        break;
        
      case 'validation':
        suggestions.push('Check input format');
        suggestions.push('Verify data types');
        suggestions.push('Review validation requirements');
        break;
        
      default:
        suggestions.push('Check error message for details');
        suggestions.push('Review command documentation');
        suggestions.push('Try simpler command variation');
    }
    
    return suggestions;
  }

  /**
   * Determine if error is recoverable
   */
  isRecoverable(classification) {
    // Check category recoverability
    if (classification.recoverable) {
      return true;
    }
    
    // Check specific conditions
    if (classification.severity === 'low') {
      return true;
    }
    
    // Timeout errors are often recoverable
    if (classification.category === 'timeout') {
      return true;
    }
    
    // Network errors might be transient
    if (classification.category === 'network') {
      return true;
    }
    
    return false;
  }

  /**
   * Get retry strategy for error
   */
  getRetryStrategy(classification) {
    const strategy = {
      shouldRetry: false,
      maxAttempts: 0,
      delay: 0,
      backoff: 'none'
    };
    
    if (!this.isRecoverable(classification)) {
      return strategy;
    }
    
    switch (classification.category) {
      case 'network':
      case 'timeout':
        strategy.shouldRetry = true;
        strategy.maxAttempts = 3;
        strategy.delay = 2000; // 2 seconds
        strategy.backoff = 'exponential';
        break;
        
      case 'file_system':
        if (classification.message.includes('EBUSY')) {
          strategy.shouldRetry = true;
          strategy.maxAttempts = 2;
          strategy.delay = 1000;
          strategy.backoff = 'linear';
        }
        break;
        
      case 'specialist':
        strategy.shouldRetry = true;
        strategy.maxAttempts = 2;
        strategy.delay = 500;
        strategy.backoff = 'none';
        break;
        
      case 'user_input':
      case 'validation':
        // Don't retry user input errors
        break;
    }
    
    return strategy;
  }

  /**
   * Add error to history
   */
  addToHistory(classification) {
    this.errorHistory.push({
      ...classification,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    // Limit history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error patterns and trends
   */
  getErrorTrends() {
    const trends = {
      totalErrors: this.errorHistory.length,
      byCategory: {},
      bySeverity: {},
      recentErrors: [],
      mostCommon: null
    };
    
    // Count by category and severity
    const categoryCounts = {};
    const severityCounts = {};
    
    for (const error of this.errorHistory) {
      categoryCounts[error.category] = (categoryCounts[error.category] || 0) + 1;
      severityCounts[error.severity] = (severityCounts[error.severity] || 0) + 1;
    }
    
    trends.byCategory = categoryCounts;
    trends.bySeverity = severityCounts;
    
    // Find most common error
    let maxCount = 0;
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        trends.mostCommon = category;
      }
    }
    
    // Get recent errors
    trends.recentErrors = this.errorHistory.slice(-5).map(e => ({
      category: e.category,
      severity: e.severity,
      timestamp: e.timestamp
    }));
    
    return trends;
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
    logger.info('🧹 Cleared error history');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ErrorClassifier,
  getInstance: () => {
    if (!instance) {
      instance = new ErrorClassifier();
    }
    return instance;
  }
};