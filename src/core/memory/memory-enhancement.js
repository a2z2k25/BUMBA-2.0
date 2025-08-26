/**
 * BUMBA Memory Enhancement Layer
 * Optional enhancement that adds memory capabilities WITHOUT disrupting core validation
 * Can be enabled/disabled via configuration
 */

const { logger } = require('../logging/bumba-logger');

class MemoryEnhancement {
  constructor(enabled = false) {
    this.enabled = enabled;
    this.memory = null;
    
    if (this.enabled) {
      try {
        const { getBumbaMemory } = require('./bumba-memory-system');
        this.memory = getBumbaMemory();
        logger.info('💾 Memory enhancement enabled');
      } catch (error) {
        logger.warn('Memory system not available, continuing without it');
        this.enabled = false;
      }
    }
  }

  /**
   * Optional memory consultation - doesn't block if unavailable
   */
  async consultMemory(command, specialist) {
    if (!this.enabled || !this.memory) {
      return null; // Gracefully return null if not enabled
    }
    
    try {
      const similar = await this.memory.querySimilarValidations(command, specialist);
      
      if (similar.length > 0) {
        // Provide suggestions but don't enforce them
        return {
          hasSimilar: true,
          count: similar.length,
          suggestions: this.extractSuggestions(similar),
          confidence: this.calculateConfidence(similar)
        };
      }
    } catch (error) {
      logger.debug('Memory consultation failed, continuing without it:', error.message);
    }
    
    return null;
  }

  /**
   * Optional recording - fails silently if unavailable
   */
  async recordToMemory(validation, metaValidation) {
    if (!this.enabled || !this.memory) {
      return; // Silent return if not enabled
    }
    
    try {
      await this.memory.recordValidation(validation, metaValidation);
      logger.debug('📝 Recorded to memory');
    } catch (error) {
      logger.debug('Memory recording failed, continuing:', error.message);
    }
  }

  /**
   * Get specialist recommendation - optional enhancement
   */
  async getSpecialistHint(taskType) {
    if (!this.enabled || !this.memory) {
      return null;
    }
    
    try {
      const recommendations = await this.memory.getSpecialistRecommendation(taskType);
      if (recommendations.length > 0) {
        return {
          recommended: recommendations[0].specialist_id,
          confidence: recommendations[0].success_rate,
          isHint: true // Just a hint, not enforced
        };
      }
    } catch (error) {
      logger.debug('Could not get specialist hint:', error.message);
    }
    
    return null;
  }

  /**
   * Extract non-invasive suggestions from memory
   */
  extractSuggestions(validations) {
    const suggestions = [];
    
    // Only provide gentle hints, not requirements
    const commonIssues = {};
    validations.forEach(val => {
      try {
        const issues = JSON.parse(val.issues || '[]');
        issues.forEach(issue => {
          commonIssues[issue.type] = (commonIssues[issue.type] || 0) + 1;
        });
      } catch (e) {
        // Skip invalid entries
      }
    });
    
    // Only suggest if pattern is very clear (>70% occurrence)
    const threshold = validations.length * 0.7;
    Object.entries(commonIssues).forEach(([issue, count]) => {
      if (count >= threshold) {
        suggestions.push(`Consider checking for ${issue} issues (common in similar work)`);
      }
    });
    
    return suggestions;
  }

  /**
   * Calculate confidence in memory suggestions
   */
  calculateConfidence(validations) {
    if (validations.length < 3) return 0.3; // Low confidence with few samples
    if (validations.length < 10) return 0.6; // Medium confidence
    return 0.8; // High confidence with many samples
  }

  /**
   * Check if memory enhancement is available
   */
  isAvailable() {
    return this.enabled && this.memory !== null;
  }

  /**
   * Get memory statistics if available
   */
  async getStats() {
    if (!this.enabled || !this.memory) {
      return { available: false };
    }
    
    try {
      return {
        available: true,
        ...this.memory.getStatistics()
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

// Singleton instance with opt-in
let memoryEnhancement = null;

/**
 * Get memory enhancement (disabled by default)
 */
function getMemoryEnhancement(enable = false) {
  if (!memoryEnhancement) {
    memoryEnhancement = new MemoryEnhancement(enable);
  }
  return memoryEnhancement;
}

module.exports = {
  MemoryEnhancement,
  getMemoryEnhancement
};