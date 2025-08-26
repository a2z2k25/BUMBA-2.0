/**
 * BUMBA Context Metrics System
 * Tracks token usage and context preservation across all specialists
 * Inspired by CCPM's context preservation approach
 * 
 * This is a NON-INVASIVE addition that only tracks metrics
 * Does not change any existing behavior
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * TokenCounter class for estimating token usage
 */
class TokenCounter {
  constructor() {
    // Rough estimation: 1 token ≈ 4 characters (OpenAI/Claude approximation)
    this.CHARS_PER_TOKEN = 4;
  }

  /**
   * Estimate token count for any data type
   * @param {*} data - Data to estimate tokens for
   * @returns {number} Estimated token count
   */
  estimate(data) {
    if (!data) return 0;
    
    let text;
    if (typeof data === 'string') {
      text = data;
    } else if (typeof data === 'object') {
      try {
        text = JSON.stringify(data, null, 2);
      } catch (error) {
        // Handle circular references
        text = '[Complex Object]';
      }
    } else {
      text = String(data);
    }
    
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }
  
  /**
   * Calculate reduction ratio
   * @param {number} input - Input token count
   * @param {number} output - Output token count
   * @returns {number} Reduction ratio (0-1)
   */
  calculateReduction(input, output) {
    if (input === 0) return 0;
    return Math.max(0, 1 - (output / input));
  }
}

/**
 * ContextMetrics class for tracking metrics across specialists
 */
class ContextMetrics extends EventEmitter {
  constructor() {
    super();
    
    this.tokenCounter = new TokenCounter();
    
    // Global metrics storage
    this.globalMetrics = {
      totalTokensProcessed: 0,
      totalTokensReturned: 0,
      totalReductionRatio: 0,
      specialistMetrics: new Map(),
      sessionStarted: new Date().toISOString()
    };
    
    // Session metrics
    this.sessionMetrics = {
      callCount: 0,
      averageReduction: 0,
      bestReduction: { specialist: null, ratio: 0 },
      worstReduction: { specialist: null, ratio: 1 }
    };
    
    logger.info('📊 Context Metrics System initialized');
  }
  
  /**
   * Track execution metrics for a specialist
   * @param {string} specialistId - ID of the specialist
   * @param {*} input - Input data
   * @param {*} output - Output data
   * @returns {object} Metrics for this execution
   */
  trackExecution(specialistId, input, output) {
    const inputTokens = this.tokenCounter.estimate(input);
    const outputTokens = this.tokenCounter.estimate(output);
    const reduction = this.tokenCounter.calculateReduction(inputTokens, outputTokens);
    
    // Update global metrics
    this.globalMetrics.totalTokensProcessed += inputTokens;
    this.globalMetrics.totalTokensReturned += outputTokens;
    
    // Update or create specialist metrics
    if (!this.globalMetrics.specialistMetrics.has(specialistId)) {
      this.globalMetrics.specialistMetrics.set(specialistId, {
        executions: 0,
        totalInput: 0,
        totalOutput: 0,
        averageReduction: 0,
        history: []
      });
    }
    
    const specialistMetric = this.globalMetrics.specialistMetrics.get(specialistId);
    specialistMetric.executions++;
    specialistMetric.totalInput += inputTokens;
    specialistMetric.totalOutput += outputTokens;
    specialistMetric.averageReduction = this.tokenCounter.calculateReduction(
      specialistMetric.totalInput,
      specialistMetric.totalOutput
    );
    
    // Add to history (keep last 100)
    const historyEntry = {
      timestamp: new Date().toISOString(),
      inputTokens,
      outputTokens,
      reduction
    };
    
    specialistMetric.history.push(historyEntry);
    if (specialistMetric.history.length > 100) {
      specialistMetric.history.shift();
    }
    
    // Update session metrics
    this.sessionMetrics.callCount++;
    this.updateSessionMetrics(specialistId, reduction);
    
    // Emit event for real-time updates
    const metrics = {
      specialistId,
      inputTokens,
      outputTokens,
      reduction,
      timestamp: historyEntry.timestamp
    };
    
    this.emit('execution-tracked', metrics);
    
    // Log if significant reduction
    if (reduction > 0.8) {
      logger.info(`🎯 High context reduction: ${specialistId} achieved ${Math.round(reduction * 100)}% reduction`);
    }
    
    return metrics;
  }
  
  /**
   * Update session metrics
   */
  updateSessionMetrics(specialistId, reduction) {
    // Update best reduction
    if (reduction > this.sessionMetrics.bestReduction.ratio) {
      this.sessionMetrics.bestReduction = {
        specialist: specialistId,
        ratio: reduction
      };
    }
    
    // Update worst reduction (excluding zero)
    if (reduction > 0 && reduction < this.sessionMetrics.worstReduction.ratio) {
      this.sessionMetrics.worstReduction = {
        specialist: specialistId,
        ratio: reduction
      };
    }
    
    // Calculate average
    const allReductions = [];
    for (const [_, metrics] of this.globalMetrics.specialistMetrics) {
      if (metrics.averageReduction > 0) {
        allReductions.push(metrics.averageReduction);
      }
    }
    
    if (allReductions.length > 0) {
      this.sessionMetrics.averageReduction = 
        allReductions.reduce((a, b) => a + b, 0) / allReductions.length;
    }
  }
  
  /**
   * Get metrics for a specific specialist
   */
  getSpecialistMetrics(specialistId) {
    return this.globalMetrics.specialistMetrics.get(specialistId) || null;
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      global: this.globalMetrics,
      session: this.sessionMetrics,
      specialists: Array.from(this.globalMetrics.specialistMetrics.entries()).map(
        ([id, metrics]) => ({ id, ...metrics })
      )
    };
  }
  
  /**
   * Get summary for dashboard
   */
  getDashboardSummary() {
    const totalReduction = this.tokenCounter.calculateReduction(
      this.globalMetrics.totalTokensProcessed,
      this.globalMetrics.totalTokensReturned
    );
    
    return {
      totalTokensSaved: this.globalMetrics.totalTokensProcessed - this.globalMetrics.totalTokensReturned,
      totalReductionPercent: Math.round(totalReduction * 100),
      averageReductionPercent: Math.round(this.sessionMetrics.averageReduction * 100),
      specialistsTracked: this.globalMetrics.specialistMetrics.size,
      totalExecutions: this.sessionMetrics.callCount,
      bestPerformer: this.sessionMetrics.bestReduction.specialist,
      bestReduction: Math.round(this.sessionMetrics.bestReduction.ratio * 100)
    };
  }
  
  /**
   * Reset session metrics
   */
  resetSession() {
    this.sessionMetrics = {
      callCount: 0,
      averageReduction: 0,
      bestReduction: { specialist: null, ratio: 0 },
      worstReduction: { specialist: null, ratio: 1 }
    };
    
    logger.info('📊 Session metrics reset');
  }
  
  /**
   * Clear all metrics
   */
  clearAll() {
    this.globalMetrics.specialistMetrics.clear();
    this.globalMetrics.totalTokensProcessed = 0;
    this.globalMetrics.totalTokensReturned = 0;
    this.resetSession();
    
    logger.info('📊 All metrics cleared');
  }
}

// Singleton instance
let instance = null;

/**
 * Get singleton instance of ContextMetrics
 */
function getInstance() {
  if (!instance) {
    instance = new ContextMetrics();
  }
  return instance;
}

// Export singleton instance and classes
module.exports = {
  getInstance,
  ContextMetrics,
  TokenCounter
};