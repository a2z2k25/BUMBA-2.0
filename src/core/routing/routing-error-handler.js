/**
 * Routing Error Handler
 * Comprehensive error handling for the routing system
 */

const { logger } = require('../logging/bumba-logger');
const { BumbaError } = require('../error-handling/bumba-error-system');

class RoutingErrorHandler {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableFallback: config.enableFallback !== false,
      enableRecovery: config.enableRecovery !== false,
      ...config
    };
    
    // Error tracking
    this.errorHistory = [];
    this.errorPatterns = new Map();
    this.recoveryStrategies = new Map();
    
    // Initialize recovery strategies
    this.initializeRecoveryStrategies();
    
    // Error metrics
    this.metrics = {
      totalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      errorTypes: {}
    };
  }
  
  /**
   * Handle routing error with recovery
   */
  async handleRoutingError(error, context) {
    logger.error(`🔴 Routing error: ${error.message}`, context);
    
    this.metrics.totalErrors++;
    const errorType = this.classifyError(error);
    this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
    
    // Record error
    this.recordError(error, errorType, context);
    
    // Attempt recovery
    if (this.config.enableRecovery) {
      const recovered = await this.attemptRecovery(error, errorType, context);
      if (recovered) {
        this.metrics.recoveredErrors++;
        return recovered;
      }
      this.metrics.failedRecoveries++;
    }
    
    // Use fallback if available
    if (this.config.enableFallback) {
      return this.getFallbackRouting(context);
    }
    
    // Re-throw if no recovery possible
    throw new BumbaError(
      `Routing failed: ${error.message}`,
      'ROUTING_ERROR',
      { originalError: error, context }
    );
  }
  
  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) {return 'timeout';}
    if (message.includes('not found')) {return 'not_found';}
    if (message.includes('invalid')) {return 'invalid_input';}
    if (message.includes('claude max')) {return 'claude_max_unavailable';}
    if (message.includes('model')) {return 'model_error';}
    if (message.includes('specialist')) {return 'specialist_error';}
    if (message.includes('memory')) {return 'memory_error';}
    if (message.includes('network')) {return 'network_error';}
    
    return 'unknown';
  }
  
  /**
   * Initialize recovery strategies
   */
  initializeRecoveryStrategies() {
    // Timeout recovery
    this.recoveryStrategies.set('timeout', async (error, context) => {
      logger.info('🟢 Attempting timeout recovery with simplified routing');
      return {
        command: context.command,
        args: context.args,
        execution: {
          agents: [{
            name: 'backend-engineer-manager',
            role: 'manager',
            model: 'gemini', // Use fast model
            usingClaudeMax: false
          }],
          parallel: false,
          requiresCoordination: false
        },
        routing: {
          source: 'timeout-recovery',
          confidence: 0.3
        }
      };
    });
    
    // Claude Max unavailable recovery
    this.recoveryStrategies.set('claude_max_unavailable', async (error, context) => {
      logger.info('🟢 Claude Max unavailable, using free tier for all agents');
      
      if (context.routingPlan) {
        const recovered = { ...context.routingPlan };
        
        // Switch all agents to free tier
        for (const agent of recovered.execution.agents) {
          if (agent.usingClaudeMax) {
            agent.usingClaudeMax = false;
            agent.model = this.selectFreeModel(agent);
          }
        }
        
        return recovered;
      }
      
      return null;
    });
    
    // Specialist error recovery
    this.recoveryStrategies.set('specialist_error', async (error, context) => {
      logger.info('🟢 Specialist error, using manager only');
      
      return {
        command: context.command,
        args: context.args,
        execution: {
          agents: [{
            name: 'backend-engineer-manager',
            role: 'manager',
            model: 'claude-max',
            usingClaudeMax: true
          }],
          parallel: false,
          requiresCoordination: false
        },
        routing: {
          source: 'specialist-recovery',
          confidence: 0.5
        }
      };
    });
    
    // Model error recovery
    this.recoveryStrategies.set('model_error', async (error, context) => {
      logger.info('🟢 Model error, switching to alternative models');
      
      if (context.routingPlan) {
        const recovered = { ...context.routingPlan };
        
        // Switch to alternative models
        for (const agent of recovered.execution.agents) {
          if (agent.model === 'deepseek') {
            agent.model = 'gemini';
          } else if (agent.model === 'qwen') {
            agent.model = 'gemini';
          }
        }
        
        return recovered;
      }
      
      return null;
    });
  }
  
  /**
   * Attempt error recovery
   */
  async attemptRecovery(error, errorType, context) {
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (!strategy) {
      logger.warn(`No recovery strategy for error type: ${errorType}`);
      return null;
    }
    
    try {
      logger.info(`🟢 Attempting recovery for ${errorType} error`);
      const recovered = await strategy(error, context);
      
      if (recovered) {
        logger.info(`🏁 Recovery successful for ${errorType} error`);
        return recovered;
      }
    } catch (recoveryError) {
      logger.error(`Recovery failed: ${recoveryError.message}`);
    }
    
    return null;
  }
  
  /**
   * Get fallback routing
   */
  getFallbackRouting(context) {
    logger.info('🟢 Using fallback routing');
    
    return {
      command: context.command || 'unknown',
      args: context.args || [],
      execution: {
        agents: [{
          name: 'backend-engineer-manager',
          role: 'manager',
          model: 'claude-max',
          usingClaudeMax: true
        }],
        parallel: false,
        requiresCoordination: false
      },
      routing: {
        source: 'fallback',
        confidence: 0.2,
        error: true
      }
    };
  }
  
  /**
   * Select free model for agent
   */
  selectFreeModel(agent) {
    if (agent.name.includes('database') || agent.name.includes('backend')) {
      return 'qwen';
    }
    if (agent.name.includes('security') || agent.name.includes('research')) {
      return 'deepseek';
    }
    return 'gemini';
  }
  
  /**
   * Record error for pattern analysis
   */
  recordError(error, errorType, context) {
    const errorRecord = {
      timestamp: Date.now(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      context: {
        command: context.command,
        args: context.args
      }
    };
    
    this.errorHistory.push(errorRecord);
    
    // Limit history size
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }
    
    // Track error patterns
    const pattern = `${errorType}:${context.command}`;
    const count = (this.errorPatterns.get(pattern) || 0) + 1;
    this.errorPatterns.set(pattern, count);
    
    // Alert on repeated errors
    if (count > 3) {
      logger.warn(`🟡 Repeated error pattern detected: ${pattern} (${count} times)`);
    }
  }
  
  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff(fn, context, retryCount = 0) {
    try {
      return await fn();
    } catch (error) {
      if (retryCount >= this.config.maxRetries) {
        throw error;
      }
      
      const delay = this.config.retryDelay * Math.pow(2, retryCount);
      logger.info(`🟢 Retrying after ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryWithBackoff(fn, context, retryCount + 1);
    }
  }
  
  /**
   * Validate routing result
   */
  validateRouting(routing) {
    const errors = [];
    
    if (!routing) {
      errors.push('Routing result is null');
    }
    
    if (!routing.execution?.agents || routing.execution.agents.length === 0) {
      errors.push('No agents assigned');
    }
    
    if (routing.execution?.agents) {
      for (const agent of routing.execution.agents) {
        if (!agent.name) {
          errors.push('Agent missing name');
        }
        if (!agent.model && !agent.usingClaudeMax) {
          errors.push(`Agent ${agent.name} missing model assignment`);
        }
      }
    }
    
    if (routing.routing?.confidence < 0.1) {
      errors.push('Routing confidence too low');
    }
    
    if (errors.length > 0) {
      throw new BumbaError(
        `Invalid routing: ${errors.join(', ')}`,
        'INVALID_ROUTING',
        { routing, errors }
      );
    }
    
    return true;
  }
  
  /**
   * Get error summary
   */
  getErrorSummary() {
    const recentErrors = this.errorHistory.slice(-10);
    const topPatterns = Array.from(this.errorPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
    
    return {
      metrics: this.metrics,
      recoveryRate: this.metrics.totalErrors > 0
        ? `${(this.metrics.recoveredErrors / this.metrics.totalErrors * 100).toFixed(1)}%`
        : '0%',
      recentErrors,
      topErrorPatterns: topPatterns,
      recommendations: this.generateErrorRecommendations()
    };
  }
  
  /**
   * Generate error recommendations
   */
  generateErrorRecommendations() {
    const recommendations = [];
    
    // Check for high timeout rate
    const timeoutRate = (this.metrics.errorTypes.timeout || 0) / this.metrics.totalErrors;
    if (timeoutRate > 0.3) {
      recommendations.push({
        type: 'timeout',
        message: 'High timeout rate detected. Consider increasing timeout limits or using faster models.',
        severity: 'high'
      });
    }
    
    // Check for Claude Max issues
    if (this.metrics.errorTypes.claude_max_unavailable > 5) {
      recommendations.push({
        type: 'claude_max',
        message: 'Frequent Claude Max unavailability. Consider implementing better queueing or fallback strategies.',
        severity: 'medium'
      });
    }
    
    // Check recovery effectiveness
    if (this.metrics.failedRecoveries > this.metrics.recoveredErrors) {
      recommendations.push({
        type: 'recovery',
        message: 'Recovery strategies are failing. Review and update recovery logic.',
        severity: 'high'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
    this.errorPatterns.clear();
    this.metrics = {
      totalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      errorTypes: {}
    };
    
    logger.info('🟢️ Error history cleared');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RoutingErrorHandler,
  getInstance: (config) => {
    if (!instance) {
      instance = new RoutingErrorHandler(config);
    }
    return instance;
  }
};