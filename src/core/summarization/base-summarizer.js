/**
 * Base Summarizer for Context Preservation
 * Phase 1 - Sprints 11-15
 * Provides intelligent summarization to achieve 80%+ context reduction
 */

const { logger } = require('../logging/bumba-logger');

/**
 * Base Summarizer Interface
 */
class BaseSummarizer {
  constructor(config = {}) {
    this.maxTokens = config.maxTokens || 500;
    this.priorityKeywords = config.priorityKeywords || [
      'error', 'fail', 'critical', 'warning', 'bug',
      'security', 'vulnerability', 'crash', 'leak', 'exception'
    ];
    this.preserveKeys = config.preserveKeys || [
      'error', 'errors', 'message', 'stack', 
      'critical', 'warnings', 'results', 'summary'
    ];
  }
  
  /**
   * Main summarization method - override in subclasses
   */
  summarize(data) {
    throw new Error('Summarize method must be implemented by subclass');
  }
  
  /**
   * Detect priority content
   */
  isPriority(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return this.priorityKeywords.some(keyword => lower.includes(keyword));
  }
  
  /**
   * Calculate token budget
   */
  getTokenBudget(used = 0) {
    return Math.max(0, this.maxTokens - used);
  }
}

/**
 * Text Summarizer
 */
class TextSummarizer extends BaseSummarizer {
  summarize(text) {
    if (!text || typeof text !== 'string') return text;
    
    const lines = text.split('\n');
    const maxLines = Math.floor(this.maxTokens / 10); // Rough estimate
    
    if (lines.length <= maxLines) return text;
    
    // Separate priority and normal lines
    const priorityLines = [];
    const normalLines = [];
    
    for (const line of lines) {
      if (this.isPriority(line)) {
        priorityLines.push(line);
      } else if (line.trim()) {
        normalLines.push(line);
      }
    }
    
    // Build summary
    const summary = [];
    
    // Add all priority lines (up to half budget)
    const priorityBudget = Math.floor(maxLines / 2);
    summary.push(...priorityLines.slice(0, priorityBudget));
    
    // Fill remaining with normal lines
    const remainingBudget = maxLines - summary.length;
    summary.push(...normalLines.slice(0, remainingBudget));
    
    // Add truncation indicator
    if (lines.length > summary.length) {
      summary.push(`\n... (${lines.length - summary.length} lines omitted for context preservation)`);
    }
    
    return summary.join('\n');
  }
}

/**
 * Array Summarizer
 */
class ArraySummarizer extends BaseSummarizer {
  summarize(array) {
    if (!Array.isArray(array)) return array;
    
    const maxItems = Math.floor(this.maxTokens / 50); // Estimate per item
    
    if (array.length <= maxItems) return array;
    
    // Categorize items
    const critical = [];
    const warnings = [];
    const normal = [];
    
    for (const item of array) {
      const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
      
      if (this.isPriority(itemStr)) {
        if (itemStr.includes('critical') || itemStr.includes('error')) {
          critical.push(item);
        } else {
          warnings.push(item);
        }
      } else {
        normal.push(item);
      }
    }
    
    // Build summary array
    const summary = [];
    const criticalBudget = Math.floor(maxItems * 0.5);
    const warningBudget = Math.floor(maxItems * 0.3);
    const normalBudget = Math.floor(maxItems * 0.2);
    
    summary.push(...critical.slice(0, criticalBudget));
    summary.push(...warnings.slice(0, warningBudget));
    summary.push(...normal.slice(0, normalBudget));
    
    // Add summary metadata
    if (array.length > summary.length) {
      summary.push({
        _summary: true,
        _total: array.length,
        _shown: summary.length,
        _omitted: array.length - summary.length,
        _critical: critical.length,
        _warnings: warnings.length
      });
    }
    
    return summary;
  }
}

/**
 * Object Summarizer
 */
class ObjectSummarizer extends BaseSummarizer {
  summarize(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    
    // Start with preserved keys
    const summary = {};
    let tokensUsed = 0;
    
    // Always include these keys if present
    for (const key of this.preserveKeys) {
      if (obj[key] !== undefined) {
        summary[key] = obj[key];
        tokensUsed += this.estimateTokens(obj[key]);
      }
    }
    
    // Add other important keys within budget
    const budget = this.getTokenBudget(tokensUsed);
    const entries = Object.entries(obj).filter(([k]) => !this.preserveKeys.includes(k));
    
    // Sort by priority
    entries.sort(([keyA, valA], [keyB, valB]) => {
      const priorityA = this.isPriority(keyA) || this.isPriority(JSON.stringify(valA));
      const priorityB = this.isPriority(keyB) || this.isPriority(JSON.stringify(valB));
      
      if (priorityA && !priorityB) return -1;
      if (!priorityA && priorityB) return 1;
      return 0;
    });
    
    // Add entries within budget
    for (const [key, value] of entries) {
      const valueTokens = this.estimateTokens(value);
      
      if (tokensUsed + valueTokens <= this.maxTokens) {
        summary[key] = value;
        tokensUsed += valueTokens;
      } else if (Array.isArray(value) && value.length > 3) {
        // Truncate arrays
        summary[key] = [...value.slice(0, 3), `... (${value.length - 3} more)`];
        break;
      } else if (typeof value === 'string' && value.length > 200) {
        // Truncate long strings
        summary[key] = value.substring(0, 197) + '...';
        break;
      }
    }
    
    // Add metadata
    if (Object.keys(obj).length > Object.keys(summary).length) {
      summary._contextReduction = {
        original: Object.keys(obj).length,
        preserved: Object.keys(summary).length,
        omitted: Object.keys(obj).length - Object.keys(summary).length
      };
    }
    
    return summary;
  }
  
  estimateTokens(data) {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Summarizer Factory
 */
class SummarizerFactory {
  static create(data, config = {}) {
    if (typeof data === 'string') {
      return new TextSummarizer(config);
    } else if (Array.isArray(data)) {
      return new ArraySummarizer(config);
    } else if (typeof data === 'object') {
      return new ObjectSummarizer(config);
    }
    
    // No summarization needed for primitives
    return null;
  }
  
  static summarize(data, config = {}) {
    const summarizer = SummarizerFactory.create(data, config);
    return summarizer ? summarizer.summarize(data) : data;
  }
}

module.exports = {
  BaseSummarizer,
  TextSummarizer,
  ArraySummarizer,
  ObjectSummarizer,
  SummarizerFactory
};