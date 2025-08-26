/**
 * Context Preservation Mixin for BUMBA Specialists
 * 
 * Adds CCPM-inspired context preservation capabilities to existing specialists
 * WITHOUT breaking any existing functionality.
 * 
 * This is a MIXIN that can be applied selectively to specialists that need it.
 */

class ContextPreservationMixin {
  /**
   * Initialize context preservation metrics
   * Call this from specialist constructor AFTER super()
   */
  initializeContextPreservation(config = {}) {
    // Add context metrics without breaking existing metrics
    this.contextMetrics = {
      enabled: config.contextPreservation !== false,
      targetReduction: config.targetReduction || 0.5, // 50% default
      tokensProcessed: 0,
      tokensReturned: 0,
      reductionRatio: 0,
      summariesGenerated: 0,
      averageReduction: 0
    };
    
    // Add summarization config
    this.summarizationConfig = {
      maxOutputTokens: config.maxOutputTokens || 500,
      prioritizeCritical: config.prioritizeCritical !== false,
      includeRecommendations: config.includeRecommendations !== false,
      preserveActionItems: config.preserveActionItems !== false
    };
    
    // Track history for learning
    this.reductionHistory = [];
    this.maxHistorySize = 100;
  }
  
  /**
   * Estimate token count for any data
   * Non-breaking utility method
   */
  estimateTokens(data) {
    if (!data) return 0;
    
    const text = typeof data === 'string' 
      ? data 
      : JSON.stringify(data, null, 2);
    
    // Rough estimate: 1 token ≈ 4 characters
    // This matches OpenAI's approximation
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Wrap existing execute methods with context tracking
   * This is non-invasive - only tracks, doesn't modify behavior
   */
  async executeWithContextTracking(originalExecute, task) {
    if (!this.contextMetrics?.enabled) {
      // If not enabled, just run original
      return originalExecute.call(this, task);
    }
    
    const inputTokens = this.estimateTokens(task);
    this.contextMetrics.tokensProcessed += inputTokens;
    
    // Execute original method
    const result = await originalExecute.call(this, task);
    
    const outputTokens = this.estimateTokens(result);
    this.contextMetrics.tokensReturned += outputTokens;
    
    // Calculate reduction
    if (inputTokens > 0) {
      const reduction = 1 - (outputTokens / inputTokens);
      this.contextMetrics.reductionRatio = reduction;
      
      // Track history
      this.reductionHistory.push({
        timestamp: Date.now(),
        inputTokens,
        outputTokens,
        reduction
      });
      
      // Maintain history size
      if (this.reductionHistory.length > this.maxHistorySize) {
        this.reductionHistory.shift();
      }
      
      // Update average
      this.contextMetrics.averageReduction = 
        this.reductionHistory.reduce((sum, h) => sum + h.reduction, 0) / 
        this.reductionHistory.length;
    }
    
    // Emit metrics for dashboard
    if (this.emit) {
      this.emit('context-metrics', {
        specialist: this.id,
        inputTokens,
        outputTokens,
        reduction: this.contextMetrics.reductionRatio
      });
    }
    
    return result;
  }
  
  /**
   * Intelligent summarization for any verbose result
   * Can be called manually or automatically
   */
  async summarize(verboseData, options = {}) {
    const config = { ...this.summarizationConfig, ...options };
    
    // Handle different data types
    if (typeof verboseData === 'string') {
      return this.summarizeText(verboseData, config);
    } else if (Array.isArray(verboseData)) {
      return this.summarizeArray(verboseData, config);
    } else if (typeof verboseData === 'object') {
      return this.summarizeObject(verboseData, config);
    }
    
    return verboseData; // Return as-is if unknown type
  }
  
  /**
   * Summarize text data
   */
  summarizeText(text, config) {
    const lines = text.split('\n');
    const maxLines = Math.ceil(config.maxOutputTokens / 10); // Rough estimate
    
    if (lines.length <= maxLines) {
      return text;
    }
    
    // Prioritize lines with keywords
    const priorityKeywords = ['error', 'fail', 'critical', 'warning', 'success'];
    const priorityLines = [];
    const normalLines = [];
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (priorityKeywords.some(keyword => lower.includes(keyword))) {
        priorityLines.push(line);
      } else {
        normalLines.push(line);
      }
    }
    
    // Build summary
    const summary = [];
    
    // Add priority lines first
    for (const line of priorityLines.slice(0, maxLines / 2)) {
      summary.push(line);
    }
    
    // Fill with normal lines
    const remaining = maxLines - summary.length;
    for (const line of normalLines.slice(0, remaining)) {
      summary.push(line);
    }
    
    if (lines.length > summary.length) {
      summary.push(`... (${lines.length - summary.length} lines omitted)`);
    }
    
    this.contextMetrics.summariesGenerated++;
    return summary.join('\n');
  }
  
  /**
   * Summarize array data
   */
  summarizeArray(array, config) {
    if (array.length === 0) return array;
    
    const maxItems = Math.ceil(config.maxOutputTokens / 50); // Estimate tokens per item
    
    if (array.length <= maxItems) {
      return array;
    }
    
    // Prioritize items with critical indicators
    const critical = [];
    const warnings = [];
    const normal = [];
    
    for (const item of array) {
      const itemStr = JSON.stringify(item).toLowerCase();
      
      if (itemStr.includes('critical') || itemStr.includes('error')) {
        critical.push(item);
      } else if (itemStr.includes('warning')) {
        warnings.push(item);
      } else {
        normal.push(item);
      }
    }
    
    // Build summary array
    const summary = [
      ...critical.slice(0, maxItems / 3),
      ...warnings.slice(0, maxItems / 3),
      ...normal.slice(0, maxItems / 3)
    ];
    
    if (array.length > summary.length) {
      summary.push({
        _summary: true,
        totalItems: array.length,
        itemsShown: summary.length,
        itemsOmitted: array.length - summary.length
      });
    }
    
    this.contextMetrics.summariesGenerated++;
    return summary;
  }
  
  /**
   * Summarize object data
   */
  summarizeObject(obj, config) {
    const summary = {};
    
    // Always preserve these keys if present
    const priorityKeys = [
      'error', 'errors',
      'critical', 'failures', 
      'success', 'result',
      'summary', 'recommendations',
      'action', 'actions', 'actionItems'
    ];
    
    // Add priority keys first
    for (const key of priorityKeys) {
      if (obj[key] !== undefined) {
        summary[key] = obj[key];
      }
    }
    
    // Estimate remaining token budget
    const usedTokens = this.estimateTokens(summary);
    const remainingTokens = config.maxOutputTokens - usedTokens;
    
    if (remainingTokens > 100) {
      // Add other keys if space permits
      for (const [key, value] of Object.entries(obj)) {
        if (!priorityKeys.includes(key)) {
          const valueTokens = this.estimateTokens(value);
          
          if (valueTokens < remainingTokens / 2) {
            summary[key] = value;
          } else if (Array.isArray(value)) {
            summary[key] = value.slice(0, 3);
            if (value.length > 3) {
              summary[key].push(`... (${value.length - 3} more)`);
            }
          } else if (typeof value === 'string' && value.length > 200) {
            summary[key] = value.substring(0, 197) + '...';
          }
        }
      }
    }
    
    // Add metadata
    summary._contextReduction = {
      originalKeys: Object.keys(obj).length,
      summarizedKeys: Object.keys(summary).length - 1, // Exclude this metadata
      reduction: this.contextMetrics.reductionRatio
    };
    
    this.contextMetrics.summariesGenerated++;
    return summary;
  }
  
  /**
   * Get context preservation metrics for dashboard
   */
  getContextMetrics() {
    return {
      ...this.contextMetrics,
      historySize: this.reductionHistory.length,
      lastReduction: this.reductionHistory[this.reductionHistory.length - 1] || null
    };
  }
  
  /**
   * Check if summarization would help
   */
  shouldSummarize(data) {
    const tokens = this.estimateTokens(data);
    return tokens > this.summarizationConfig.maxOutputTokens;
  }
  
  /**
   * Apply context preservation to a result if needed
   */
  async applyContextPreservation(result) {
    if (!this.contextMetrics?.enabled) {
      return result;
    }
    
    if (this.shouldSummarize(result)) {
      return this.summarize(result);
    }
    
    return result;
  }
}

// Export as both CommonJS and ES6
module.exports = ContextPreservationMixin;
module.exports.ContextPreservationMixin = ContextPreservationMixin;