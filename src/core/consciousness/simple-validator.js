/**
 * BUMBA Simple Consciousness Validator
 * Streamlined validation without unnecessary abstraction layers
 */

const { logger } = require('../logging/bumba-logger');

// Principle keywords for validation
const PRINCIPLE_KEYWORDS = {
  consciousness: ['aware', 'mindful', 'conscious', 'intentional', 'thoughtful'],
  ethical: ['ethical', 'responsible', 'fair', 'inclusive', 'transparent'],
  sustainable: ['sustainable', 'maintainable', 'scalable', 'efficient', 'long-term'],
  community: ['collaborative', 'community', 'team', 'together', 'shared'],
  growth: ['learning', 'growth', 'improvement', 'evolution', 'progress'],
  unity: ['unified', 'integrated', 'cohesive', 'harmonious', 'aligned'],
};

// Blocked patterns
const BLOCKED_PATTERNS = [
  /harmful|malicious|exploit|attack/i,
  /bypass security|hack|crack/i,
  /discriminat|bias|unfair/i,
  /waste|inefficient|bloat/i,
];

/**
 * Simple consciousness validator
 */
class SimpleConsciousnessValidator {
  constructor() {
    this.validationCache = new Map();
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      blockedPatterns: 0,
    };
  }

  /**
   * Validate a task against consciousness principles
   */
  validate(task, context = {}) {
    this.stats.totalValidations++;
    
    // Check cache first
    const cacheKey = this.getCacheKey(task);
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (cached.passed) {this.stats.passedValidations++;}
      return cached;
    }
    
    // Check for blocked patterns
    const blockedPattern = this.checkBlockedPatterns(task);
    if (blockedPattern) {
      this.stats.blockedPatterns++;
      const result = {
        passed: false,
        reason: `Task contains blocked pattern: ${blockedPattern}`,
        severity: 'high',
      };
      this.validationCache.set(cacheKey, result);
      return result;
    }
    
    // Check principle alignment
    const principleScores = this.checkPrinciples(task);
    const overallScore = this.calculateOverallScore(principleScores);
    
    // Determine if task passes - use a very low threshold since any positive intent should pass
    const passed = overallScore > 0 || Object.values(principleScores).some(score => score > 0); // Any positive score passes
    if (passed) {this.stats.passedValidations++;}
    
    const result = {
      passed,
      score: overallScore,
      principles: principleScores,
      suggestions: passed ? [] : this.generateSuggestions(principleScores),
    };
    
    // Cache result
    this.validationCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Check for blocked patterns
   */
  checkBlockedPatterns(task) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(task)) {
        return pattern.source;
      }
    }
    return null;
  }

  /**
   * Check alignment with principles
   */
  checkPrinciples(task) {
    const taskLower = task.toLowerCase();
    const scores = {};
    
    for (const [principle, keywords] of Object.entries(PRINCIPLE_KEYWORDS)) {
      const matches = keywords.filter(keyword => taskLower.includes(keyword)).length;
      scores[principle] = matches / keywords.length;
    }
    
    return scores;
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore(principleScores) {
    const scores = Object.values(principleScores);
    if (scores.length === 0) {return 0;}
    
    // Average of all principle scores
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Generate improvement suggestions
   */
  generateSuggestions(principleScores) {
    const suggestions = [];
    
    // Find low-scoring principles
    for (const [principle, score] of Object.entries(principleScores)) {
      if (score < 0.2) {
        suggestions.push(`Consider adding ${principle} aspects to your task`);
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Consider making your task description more specific');
    }
    
    return suggestions;
  }

  /**
   * Generate cache key
   */
  getCacheKey(task) {
    return task.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 100);
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      ...this.stats,
      passRate: this.stats.totalValidations > 0 
        ? this.stats.passedValidations / this.stats.totalValidations 
        : 0,
      cacheSize: this.validationCache.size,
    };
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear();
    logger.info('Consciousness validation cache cleared');
  }
}

// Export singleton instance
module.exports = new SimpleConsciousnessValidator();