/**
 * Scoring Engine for Selection Matrix
 * Comprehensive scoring system for multi-factor evaluation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Score Component
 */
class ScoreComponent {
  constructor(name, value, weight = 1.0) {
    this.name = name;
    this.value = value;
    this.weight = weight;
    this.normalizedValue = value;
    this.weightedValue = value * weight;
    this.metadata = {};
  }
  
  normalize(min = 0, max = 1) {
    // Normalize value to [0, 1] range
    if (max === min) {
      this.normalizedValue = 0.5;
    } else {
      this.normalizedValue = Math.max(0, Math.min(1, (this.value - min) / (max - min)));
    }
    this.weightedValue = this.normalizedValue * this.weight;
    return this.normalizedValue;
  }
  
  applyTransform(transform) {
    switch (transform) {
      case 'linear':
        // No transformation
        break;
      case 'logarithmic':
        this.normalizedValue = Math.log(1 + this.normalizedValue) / Math.log(2);
        break;
      case 'exponential':
        this.normalizedValue = Math.pow(this.normalizedValue, 2);
        break;
      case 'sigmoid':
        this.normalizedValue = 1 / (1 + Math.exp(-10 * (this.normalizedValue - 0.5)));
        break;
      case 'sqrt':
        this.normalizedValue = Math.sqrt(this.normalizedValue);
        break;
    }
    this.weightedValue = this.normalizedValue * this.weight;
  }
}

/**
 * Composite Score
 */
class CompositeScore {
  constructor(name) {
    this.name = name;
    this.components = new Map();
    this.totalScore = 0;
    this.normalizedScore = 0;
    this.confidence = 0;
    this.timestamp = Date.now();
    this.metadata = {};
  }
  
  addComponent(component) {
    this.components.set(component.name, component);
    this.recalculate();
  }
  
  recalculate() {
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (const component of this.components.values()) {
      totalWeight += component.weight;
      weightedSum += component.weightedValue;
    }
    
    if (totalWeight > 0) {
      this.totalScore = weightedSum;
      this.normalizedScore = weightedSum / totalWeight;
    } else {
      this.totalScore = 0;
      this.normalizedScore = 0;
    }
    
    // Calculate confidence based on number of components
    this.confidence = Math.min(1, this.components.size / 10);
  }
  
  getBreakdown() {
    const breakdown = {
      total: this.totalScore,
      normalized: this.normalizedScore,
      confidence: this.confidence,
      components: {}
    };
    
    for (const [name, component] of this.components) {
      breakdown.components[name] = {
        value: component.value,
        normalized: component.normalizedValue,
        weight: component.weight,
        weighted: component.weightedValue
      };
    }
    
    return breakdown;
  }
}

/**
 * Scoring Formula
 */
class ScoringFormula {
  constructor(name, formula) {
    this.name = name;
    this.formula = formula; // Function that takes inputs and returns score
    this.parameters = {};
    this.cache = new Map();
    this.cacheSize = 100;
  }
  
  setParameter(name, value) {
    this.parameters[name] = value;
  }
  
  calculate(inputs) {
    // Check cache
    const cacheKey = JSON.stringify(inputs);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.score;
    }
    
    // Calculate score
    const score = this.formula(inputs, this.parameters);
    
    // Cache result
    this.cache.set(cacheKey, {
      score,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return score;
  }
}

/**
 * Scoring Rules Engine
 */
class ScoringRulesEngine {
  constructor() {
    this.rules = new Map();
    this.activeRules = new Set();
  }
  
  addRule(name, condition, adjustment) {
    this.rules.set(name, {
      name,
      condition, // Function that returns true/false
      adjustment, // Function that modifies score
      active: true,
      appliedCount: 0
    });
    this.activeRules.add(name);
  }
  
  removeRule(name) {
    this.rules.delete(name);
    this.activeRules.delete(name);
  }
  
  toggleRule(name, active) {
    const rule = this.rules.get(name);
    if (rule) {
      rule.active = active;
      if (active) {
        this.activeRules.add(name);
      } else {
        this.activeRules.delete(name);
      }
    }
  }
  
  applyRules(score, context) {
    let adjustedScore = score;
    const appliedRules = [];
    
    for (const name of this.activeRules) {
      const rule = this.rules.get(name);
      if (rule && rule.condition(context)) {
        adjustedScore = rule.adjustment(adjustedScore, context);
        rule.appliedCount++;
        appliedRules.push(name);
      }
    }
    
    return {
      original: score,
      adjusted: adjustedScore,
      appliedRules
    };
  }
}

/**
 * Main Scoring Engine
 */
class ScoringEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Scoring settings
      defaultWeights: config.defaultWeights || {},
      normalizationMethod: config.normalizationMethod || 'minmax',
      transformFunction: config.transformFunction || 'linear',
      
      // Aggregation settings
      aggregationMethod: config.aggregationMethod || 'weighted_average',
      minComponents: config.minComponents || 3,
      maxComponents: config.maxComponents || 20,
      
      // Confidence settings
      confidenceThreshold: config.confidenceThreshold || 0.5,
      confidenceDecay: config.confidenceDecay || 0.95,
      
      // Cache settings
      enableCache: config.enableCache !== false,
      cacheSize: config.cacheSize || 1000,
      cacheTTL: config.cacheTTL || 60000 // 1 minute
    };
    
    // Scoring components
    this.formulas = new Map();
    this.rulesEngine = new ScoringRulesEngine();
    this.scoreCache = new Map();
    
    // Score history
    this.scoreHistory = [];
    this.maxHistorySize = 1000;
    
    // Statistics
    this.statistics = {
      totalScores: 0,
      averageScore: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rulesApplied: 0,
      formulasEvaluated: 0
    };
    
    // Initialize default formulas and rules
    this.initializeDefaults();
    
    logger.info('🟡 Scoring Engine initialized');
  }
  
  /**
   * Initialize default formulas and rules
   */
  initializeDefaults() {
    // Default scoring formulas
    this.registerFormula('task_complexity', (inputs) => {
      const { complexity, urgency, priority } = inputs;
      return (complexity * 0.4 + urgency * 0.3 + priority * 0.3);
    });
    
    this.registerFormula('specialist_fitness', (inputs) => {
      const { skills, experience, availability, performance } = inputs;
      return (skills * 0.3 + experience * 0.2 + availability * 0.25 + performance * 0.25);
    });
    
    this.registerFormula('context_adjustment', (inputs) => {
      const { systemLoad, timeOfDay, projectPhase } = inputs;
      const loadFactor = 1 - systemLoad;
      const timeFactor = this.getTimeFactor(timeOfDay);
      const phaseFactor = this.getPhaseFactor(projectPhase);
      return (loadFactor * 0.4 + timeFactor * 0.2 + phaseFactor * 0.4);
    });
    
    // Default scoring rules
    this.rulesEngine.addRule(
      'high_priority_boost',
      (context) => context.priority > 0.8,
      (score) => score * 1.2
    );
    
    this.rulesEngine.addRule(
      'low_confidence_penalty',
      (context) => context.confidence < 0.3,
      (score) => score * 0.8
    );
    
    this.rulesEngine.addRule(
      'deadline_urgency',
      (context) => context.deadline && context.deadline < 3600000,
      (score) => score * 1.5
    );
    
    this.rulesEngine.addRule(
      'overload_protection',
      (context) => context.systemLoad > 0.9,
      (score) => score * 0.5
    );
    
    logger.debug('Default formulas and rules initialized');
  }
  
  /**
   * Register scoring formula
   */
  registerFormula(name, formula) {
    const scoringFormula = new ScoringFormula(name, formula);
    this.formulas.set(name, scoringFormula);
    return scoringFormula;
  }
  
  /**
   * Calculate score
   */
  calculateScore(inputs, options = {}) {
    const startTime = Date.now();
    this.statistics.totalScores++;
    
    // Check cache
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey(inputs, options);
      const cached = this.scoreCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        this.statistics.cacheHits++;
        return cached.score;
      }
      
      this.statistics.cacheMisses++;
    }
    
    // Create composite score
    const compositeScore = new CompositeScore(options.name || 'score');
    
    // Calculate components
    const components = this.calculateComponents(inputs, options);
    
    // Add components to composite score
    for (const component of components) {
      compositeScore.addComponent(component);
    }
    
    // Apply rules
    const rulesResult = this.rulesEngine.applyRules(
      compositeScore.normalizedScore,
      { ...inputs, ...options }
    );
    
    if (rulesResult.appliedRules.length > 0) {
      this.statistics.rulesApplied += rulesResult.appliedRules.length;
      compositeScore.normalizedScore = rulesResult.adjusted;
    }
    
    // Create final score result
    const result = {
      score: compositeScore.normalizedScore,
      confidence: compositeScore.confidence,
      breakdown: compositeScore.getBreakdown(),
      appliedRules: rulesResult.appliedRules,
      inputs: inputs,  // Add inputs to result
      timestamp: Date.now(),
      duration: Date.now() - startTime
    };
    
    // Cache result
    if (this.config.enableCache) {
      this.cacheScore(inputs, options, result);
    }
    
    // Record in history
    this.recordScore(result);
    
    // Update statistics
    this.updateStatistics(result);
    
    // Emit event
    this.emit('score:calculated', result);
    
    return result;
  }
  
  /**
   * Calculate score components
   */
  calculateComponents(inputs, options) {
    const components = [];
    const weights = { ...this.config.defaultWeights, ...options.weights };
    
    // Task complexity component
    if (inputs.task) {
      const taskScore = this.evaluateTask(inputs.task);
      const component = new ScoreComponent('task', taskScore, weights.task || 1.0);
      component.normalize(0, 1);
      component.applyTransform(this.config.transformFunction);
      components.push(component);
    }
    
    // Specialist fitness component
    if (inputs.specialist) {
      const specialistScore = this.evaluateSpecialist(inputs.specialist);
      const component = new ScoreComponent('specialist', specialistScore, weights.specialist || 1.0);
      component.normalize(0, 1);
      component.applyTransform(this.config.transformFunction);
      components.push(component);
    }
    
    // Context component
    if (inputs.context) {
      const contextScore = this.evaluateContext(inputs.context);
      const component = new ScoreComponent('context', contextScore, weights.context || 0.8);
      component.normalize(0, 1);
      component.applyTransform(this.config.transformFunction);
      components.push(component);
    }
    
    // Quality component
    if (inputs.quality) {
      const qualityScore = this.evaluateQuality(inputs.quality);
      const component = new ScoreComponent('quality', qualityScore, weights.quality || 0.9);
      component.normalize(0, 1);
      component.applyTransform(this.config.transformFunction);
      components.push(component);
    }
    
    // Custom components from formulas
    for (const [name, formula] of this.formulas) {
      if (options.useFormulas && options.useFormulas.includes(name)) {
        try {
          const score = formula.calculate(inputs);
          const component = new ScoreComponent(name, score, weights[name] || 0.5);
          component.normalize(0, 1);
          components.push(component);
          this.statistics.formulasEvaluated++;
        } catch (error) {
          logger.error(`Formula ${name} failed:`, error);
        }
      }
    }
    
    return components;
  }
  
  /**
   * Evaluate task
   */
  evaluateTask(task) {
    let score = 0.5; // Base score
    
    // Complexity factor
    if (task.complexity !== undefined) {
      score += task.complexity * 0.2;
    }
    
    // Priority factor
    if (task.priority !== undefined) {
      score += task.priority * 0.15;
    }
    
    // Urgency factor
    if (task.urgency !== undefined) {
      score += task.urgency * 0.15;
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Evaluate specialist
   */
  evaluateSpecialist(specialist) {
    let score = 0.5; // Base score
    
    // Skills match
    if (specialist.skillsMatch !== undefined) {
      score += specialist.skillsMatch * 0.2;
    }
    
    // Experience level
    if (specialist.experience !== undefined) {
      score += specialist.experience * 0.15;
    }
    
    // Availability
    if (specialist.availability !== undefined) {
      score += specialist.availability * 0.1;
    }
    
    // Performance history
    if (specialist.performance !== undefined) {
      score += specialist.performance * 0.05;
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Evaluate context
   */
  evaluateContext(context) {
    let score = 0.5; // Base score
    
    // System load (inverse relationship)
    if (context.systemLoad !== undefined) {
      score += (1 - context.systemLoad) * 0.2;
    }
    
    // Resource budget
    if (context.resourceBudget !== undefined) {
      score += context.resourceBudget * 0.15;
    }
    
    // Project phase appropriateness
    if (context.projectPhase !== undefined) {
      score += this.getPhaseFactor(context.projectPhase) * 0.15;
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Evaluate quality requirements
   */
  evaluateQuality(quality) {
    let score = 0.5; // Base score
    
    // Accuracy requirement
    if (quality.accuracy !== undefined) {
      score += quality.accuracy * 0.15;
    }
    
    // Speed requirement
    if (quality.speed !== undefined) {
      score += quality.speed * 0.1;
    }
    
    // Reliability requirement
    if (quality.reliability !== undefined) {
      score += quality.reliability * 0.15;
    }
    
    // Cost efficiency
    if (quality.costEfficiency !== undefined) {
      score += quality.costEfficiency * 0.1;
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Get time factor
   */
  getTimeFactor(timeOfDay) {
    if (typeof timeOfDay === 'number') {
      // Assume hours (0-23)
      if (timeOfDay >= 9 && timeOfDay <= 17) {
        return 1.0; // Peak hours
      } else if (timeOfDay >= 6 && timeOfDay <= 22) {
        return 0.8; // Normal hours
      } else {
        return 0.5; // Off hours
      }
    }
    return 0.7; // Default
  }
  
  /**
   * Get project phase factor
   */
  getPhaseFactor(phase) {
    const phaseFactors = {
      'planning': 0.6,
      'development': 1.0,
      'testing': 0.8,
      'deployment': 0.9,
      'maintenance': 0.7
    };
    
    return phaseFactors[phase] || 0.7;
  }
  
  /**
   * Get cache key
   */
  getCacheKey(inputs, options) {
    return JSON.stringify({ inputs, options });
  }
  
  /**
   * Cache score
   */
  cacheScore(inputs, options, score) {
    const key = this.getCacheKey(inputs, options);
    
    this.scoreCache.set(key, {
      score,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.scoreCache.size > this.config.cacheSize) {
      const firstKey = this.scoreCache.keys().next().value;
      this.scoreCache.delete(firstKey);
    }
  }
  
  /**
   * Record score in history
   */
  recordScore(score) {
    this.scoreHistory.push({
      ...score,
      recordedAt: Date.now()
    });
    
    // Limit history size
    if (this.scoreHistory.length > this.maxHistorySize) {
      this.scoreHistory.shift();
    }
  }
  
  /**
   * Update statistics
   */
  updateStatistics(score) {
    const total = this.statistics.totalScores;
    this.statistics.averageScore = 
      (this.statistics.averageScore * (total - 1) + score.score) / total;
  }
  
  /**
   * Get scoring report
   */
  getScoringReport() {
    return {
      statistics: this.statistics,
      formulas: Array.from(this.formulas.keys()),
      activeRules: Array.from(this.rulesEngine.activeRules),
      recentScores: this.scoreHistory.slice(-10),
      cacheInfo: {
        size: this.scoreCache.size,
        hitRate: this.statistics.cacheHits / 
                 (this.statistics.cacheHits + this.statistics.cacheMisses) || 0
      }
    };
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.scoreCache.clear();
    logger.info('Score cache cleared');
  }
  
  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalScores: 0,
      averageScore: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rulesApplied: 0,
      formulasEvaluated: 0
    };
    
    this.scoreHistory = [];
    
    logger.info('Scoring statistics reset');
  }
  
  /**
   * Shutdown
   */
  shutdown() {
    logger.info('Shutting down Scoring Engine...');
    
    this.clearCache();
    this.removeAllListeners();
    
    logger.info('Scoring Engine shutdown complete');
  }
}

module.exports = {
  ScoringEngine,
  ScoreComponent,
  CompositeScore,
  ScoringFormula,
  ScoringRulesEngine
};