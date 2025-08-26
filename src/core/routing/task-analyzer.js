/**
 * Task Analysis Engine for TTL-Based Routing
 * Analyzes tasks to determine complexity, urgency, and estimated duration
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Task Type Definitions
 */
const TASK_TYPES = {
  QUERY: {
    name: 'Query',
    baseComplexity: 0.1,
    baseDuration: 1000,      // 1 second
    characteristics: ['read', 'fetch', 'get', 'retrieve', 'search', 'find', 'lookup'],
    specialistTypes: ['database-specialist', 'search-engineer']
  },
  COMPUTATION: {
    name: 'Computation',
    baseComplexity: 0.5,
    baseDuration: 5000,      // 5 seconds
    characteristics: ['calculate', 'compute', 'process', 'analyze', 'transform', 'aggregate'],
    specialistTypes: ['backend-engineer', 'data-scientist']
  },
  GENERATION: {
    name: 'Generation',
    baseComplexity: 0.7,
    baseDuration: 10000,     // 10 seconds
    characteristics: ['generate', 'create', 'build', 'construct', 'synthesize', 'produce'],
    specialistTypes: ['content-generator', 'ai-specialist']
  },
  INTEGRATION: {
    name: 'Integration',
    baseComplexity: 0.6,
    baseDuration: 8000,      // 8 seconds
    characteristics: ['integrate', 'connect', 'sync', 'merge', 'combine', 'orchestrate'],
    specialistTypes: ['integration-engineer', 'api-specialist']
  },
  VALIDATION: {
    name: 'Validation',
    baseComplexity: 0.3,
    baseDuration: 3000,      // 3 seconds
    characteristics: ['validate', 'verify', 'check', 'test', 'audit', 'review'],
    specialistTypes: ['qa-engineer', 'security-specialist']
  },
  OPTIMIZATION: {
    name: 'Optimization',
    baseComplexity: 0.8,
    baseDuration: 15000,     // 15 seconds
    characteristics: ['optimize', 'improve', 'enhance', 'refactor', 'tune', 'streamline'],
    specialistTypes: ['performance-engineer', 'optimization-specialist']
  },
  DEPLOYMENT: {
    name: 'Deployment',
    baseComplexity: 0.6,
    baseDuration: 20000,     // 20 seconds
    characteristics: ['deploy', 'release', 'publish', 'launch', 'rollout', 'distribute'],
    specialistTypes: ['devops-engineer', 'release-manager']
  },
  MAINTENANCE: {
    name: 'Maintenance',
    baseComplexity: 0.4,
    baseDuration: 7000,      // 7 seconds
    characteristics: ['update', 'patch', 'fix', 'maintain', 'repair', 'troubleshoot'],
    specialistTypes: ['maintenance-engineer', 'support-specialist']
  }
};

/**
 * Urgency Levels
 */
const URGENCY_LEVELS = {
  CRITICAL: {
    level: 5,
    multiplier: 0.3,        // 30% of normal time
    description: 'System down, immediate response required',
    indicators: ['urgent', 'critical', 'emergency', 'down', 'broken', 'immediate']
  },
  HIGH: {
    level: 4,
    multiplier: 0.5,        // 50% of normal time
    description: 'High priority, quick response needed',
    indicators: ['high', 'important', 'asap', 'quickly', 'fast']
  },
  NORMAL: {
    level: 3,
    multiplier: 1.0,        // Normal time
    description: 'Standard processing',
    indicators: ['normal', 'standard', 'regular']
  },
  LOW: {
    level: 2,
    multiplier: 1.5,        // 150% of normal time
    description: 'Can be delayed if needed',
    indicators: ['low', 'whenever', 'optional', 'nice-to-have']
  },
  BATCH: {
    level: 1,
    multiplier: 2.0,        // 200% of normal time
    description: 'Batch processing acceptable',
    indicators: ['batch', 'bulk', 'scheduled', 'background']
  }
};

/**
 * Complexity Factors
 */
const COMPLEXITY_FACTORS = {
  SIZE: {
    small: { threshold: 100, multiplier: 0.8 },
    medium: { threshold: 1000, multiplier: 1.0 },
    large: { threshold: 10000, multiplier: 1.5 },
    huge: { threshold: 100000, multiplier: 2.0 }
  },
  DEPENDENCIES: {
    none: { count: 0, multiplier: 0.8 },
    few: { count: 3, multiplier: 1.0 },
    several: { count: 7, multiplier: 1.3 },
    many: { count: 15, multiplier: 1.6 }
  },
  OPERATIONS: {
    simple: { types: 1, multiplier: 0.7 },
    moderate: { types: 3, multiplier: 1.0 },
    complex: { types: 5, multiplier: 1.4 },
    advanced: { types: 10, multiplier: 1.8 }
  }
};

/**
 * Task Analysis Result
 */
class TaskAnalysis {
  constructor(taskId, analysis) {
    this.taskId = taskId;
    this.timestamp = Date.now();
    this.type = analysis.type;
    this.complexity = analysis.complexity;
    this.urgency = analysis.urgency;
    this.estimatedDuration = analysis.estimatedDuration;
    this.confidence = analysis.confidence;
    this.factors = analysis.factors;
    this.recommendedSpecialists = analysis.recommendedSpecialists;
    this.metadata = analysis.metadata || {};
  }
  
  getTTL() {
    // TTL is estimated duration adjusted by urgency
    return Math.floor(this.estimatedDuration * this.urgency.multiplier);
  }
  
  getPriority() {
    // Priority combines urgency and complexity
    return this.urgency.level + Math.floor(this.complexity * 5);
  }
  
  getSummary() {
    return {
      taskId: this.taskId,
      type: this.type.name,
      complexity: `${(this.complexity * 100).toFixed(1)}%`,
      urgency: this.urgency.level,
      duration: `${this.estimatedDuration}ms`,
      ttl: `${this.getTTL()}ms`,
      priority: this.getPriority(),
      confidence: `${(this.confidence * 100).toFixed(1)}%`
    };
  }
}

/**
 * Main Task Analyzer
 */
class TaskAnalyzer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      // Analysis settings
      enableMachineLearning: config.enableMachineLearning || false,
      enablePatternRecognition: config.enablePatternRecognition !== false,
      enableHistoricalAnalysis: config.enableHistoricalAnalysis !== false,
      
      // Thresholds
      complexityThreshold: config.complexityThreshold || 0.7,
      confidenceThreshold: config.confidenceThreshold || 0.5,
      
      // Duration estimation
      baselineMultiplier: config.baselineMultiplier || 1.0,
      safetyMargin: config.safetyMargin || 1.2,         // 20% safety margin
      
      // Learning
      learningRate: config.learningRate || 0.1,
      historySize: config.historySize || 1000,
      
      // Caching
      enableCache: config.enableCache !== false,
      cacheSize: config.cacheSize || 100,
      cacheTTL: config.cacheTTL || 60000                 // 1 minute
    };
    
    // Analysis state
    this.analysisHistory = [];
    this.patternLibrary = new Map();
    this.durationModel = new Map();
    this.analysisCache = new Map();
    
    // Statistics
    this.statistics = {
      totalAnalyzed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgComplexity: 0,
      avgDuration: 0,
      avgConfidence: 0,
      typeDistribution: {},
      urgencyDistribution: {}
    };
    
    // Initialize patterns
    this.initializePatterns();
    
    logger.info('🔍 Task Analyzer initialized');
  }
  
  /**
   * Initialize pattern library
   */
  initializePatterns() {
    // Common task patterns
    this.patternLibrary.set('crud_operation', {
      pattern: /^(create|read|update|delete)/i,
      complexity: 0.3,
      duration: 2000,
      type: 'QUERY'
    });
    
    this.patternLibrary.set('data_processing', {
      pattern: /process|transform|convert|parse/i,
      complexity: 0.5,
      duration: 5000,
      type: 'COMPUTATION'
    });
    
    this.patternLibrary.set('api_call', {
      pattern: /api|endpoint|request|webhook/i,
      complexity: 0.4,
      duration: 3000,
      type: 'INTEGRATION'
    });
    
    this.patternLibrary.set('file_operation', {
      pattern: /file|upload|download|save|load/i,
      complexity: 0.4,
      duration: 4000,
      type: 'COMPUTATION'
    });
    
    this.patternLibrary.set('batch_job', {
      pattern: /batch|bulk|mass|queue/i,
      complexity: 0.7,
      duration: 30000,
      type: 'COMPUTATION'
    });
    
    logger.debug(`Initialized ${this.patternLibrary.size} task patterns`);
  }
  
  /**
   * Analyze a task
   */
  async analyzeTask(task) {
    const startTime = Date.now();
    const taskId = task.id || `task-${Date.now()}`;
    
    try {
      // Check cache first
      if (this.config.enableCache) {
        const cached = this.getCachedAnalysis(task);
        if (cached) {
          this.statistics.cacheHits++;
          return cached;
        }
        this.statistics.cacheMisses++;
      }
      
      // Perform analysis
      const analysis = {
        type: this.detectTaskType(task),
        complexity: this.calculateComplexity(task),
        urgency: this.detectUrgency(task),
        estimatedDuration: 0,
        confidence: 0,
        factors: {},
        recommendedSpecialists: []
      };
      
      // Calculate estimated duration
      analysis.estimatedDuration = this.estimateDuration(task, analysis);
      
      // Determine recommended specialists
      analysis.recommendedSpecialists = this.recommendSpecialists(task, analysis);
      
      // Calculate confidence
      analysis.confidence = this.calculateConfidence(analysis);
      
      // Extract factors
      analysis.factors = this.extractFactors(task, analysis);
      
      // Create result
      const result = new TaskAnalysis(taskId, analysis);
      
      // Record analysis
      this.recordAnalysis(result);
      
      // Cache result
      if (this.config.enableCache) {
        this.cacheAnalysis(task, result);
      }
      
      // Update statistics
      this.updateStatistics(result);
      
      // Emit analysis event
      this.emit('task:analyzed', {
        taskId,
        duration: Date.now() - startTime,
        summary: result.getSummary()
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Task analysis failed for ${taskId}:`, error);
      
      // Return default analysis
      return new TaskAnalysis(taskId, {
        type: TASK_TYPES.COMPUTATION,
        complexity: 0.5,
        urgency: URGENCY_LEVELS.NORMAL,
        estimatedDuration: 5000,
        confidence: 0.3,
        factors: { error: error.message },
        recommendedSpecialists: ['general-specialist']
      });
    }
  }
  
  /**
   * Detect task type
   */
  detectTaskType(task) {
    const description = this.getTaskDescription(task);
    
    // Check against task type characteristics
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [typeName, typeConfig] of Object.entries(TASK_TYPES)) {
      let score = 0;
      
      for (const characteristic of typeConfig.characteristics) {
        if (description.includes(characteristic)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = typeConfig;
      }
    }
    
    // Check patterns if no strong match
    if (!bestMatch || bestScore < 2) {
      for (const [patternName, pattern] of this.patternLibrary) {
        if (pattern.pattern.test(description)) {
          bestMatch = TASK_TYPES[pattern.type] || TASK_TYPES.COMPUTATION;
          break;
        }
      }
    }
    
    return bestMatch || TASK_TYPES.COMPUTATION;
  }
  
  /**
   * Calculate task complexity
   */
  calculateComplexity(task) {
    let complexity = 0.5; // Base complexity
    
    // Size factor
    const size = this.getTaskSize(task);
    const sizeFactor = this.getSizeFactor(size);
    complexity *= sizeFactor.multiplier;
    
    // Dependencies factor
    const dependencies = this.getTaskDependencies(task);
    const depFactor = this.getDependencyFactor(dependencies.length);
    complexity *= depFactor.multiplier;
    
    // Operations factor
    const operations = this.getTaskOperations(task);
    const opsFactor = this.getOperationsFactor(operations);
    complexity *= opsFactor.multiplier;
    
    // Pattern adjustment
    if (this.config.enablePatternRecognition) {
      const patternComplexity = this.getPatternComplexity(task);
      if (patternComplexity > 0) {
        complexity = (complexity + patternComplexity) / 2;
      }
    }
    
    // Historical adjustment
    if (this.config.enableHistoricalAnalysis) {
      const historicalComplexity = this.getHistoricalComplexity(task);
      if (historicalComplexity > 0) {
        complexity = complexity * 0.7 + historicalComplexity * 0.3;
      }
    }
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, complexity));
  }
  
  /**
   * Detect task urgency
   */
  detectUrgency(task) {
    const description = this.getTaskDescription(task);
    const metadata = task.metadata || {};
    
    // Check metadata first
    if (metadata.urgency) {
      const urgencyLevel = URGENCY_LEVELS[metadata.urgency.toUpperCase()];
      if (urgencyLevel) return urgencyLevel;
    }
    
    // Check for urgency indicators
    for (const [levelName, levelConfig] of Object.entries(URGENCY_LEVELS)) {
      for (const indicator of levelConfig.indicators) {
        if (description.includes(indicator)) {
          return levelConfig;
        }
      }
    }
    
    // Check deadline
    if (task.deadline) {
      const timeUntilDeadline = task.deadline - Date.now();
      
      if (timeUntilDeadline < 60000) return URGENCY_LEVELS.CRITICAL;      // < 1 minute
      if (timeUntilDeadline < 300000) return URGENCY_LEVELS.HIGH;         // < 5 minutes
      if (timeUntilDeadline < 3600000) return URGENCY_LEVELS.NORMAL;      // < 1 hour
      if (timeUntilDeadline < 86400000) return URGENCY_LEVELS.LOW;        // < 1 day
    }
    
    // Default to normal
    return URGENCY_LEVELS.NORMAL;
  }
  
  /**
   * Estimate task duration
   */
  estimateDuration(task, analysis) {
    let duration = analysis.type.baseDuration;
    
    // Adjust for complexity
    duration *= (1 + analysis.complexity);
    
    // Adjust for size
    const size = this.getTaskSize(task);
    if (size > 10000) duration *= 2;
    else if (size > 1000) duration *= 1.5;
    else if (size > 100) duration *= 1.2;
    
    // Apply urgency multiplier
    duration *= analysis.urgency.multiplier;
    
    // Historical adjustment
    if (this.config.enableHistoricalAnalysis) {
      const historicalDuration = this.getHistoricalDuration(task, analysis.type);
      if (historicalDuration > 0) {
        duration = duration * 0.6 + historicalDuration * 0.4;
      }
    }
    
    // Apply safety margin
    duration *= this.config.safetyMargin;
    
    // Apply baseline multiplier
    duration *= this.config.baselineMultiplier;
    
    return Math.floor(duration);
  }
  
  /**
   * Recommend specialists for task
   */
  recommendSpecialists(task, analysis) {
    const specialists = new Set();
    
    // Add type-specific specialists
    if (analysis.type.specialistTypes) {
      analysis.type.specialistTypes.forEach(s => specialists.add(s));
    }
    
    // Add complexity-based specialists
    if (analysis.complexity > 0.7) {
      specialists.add('senior-engineer');
      specialists.add('architect');
    } else if (analysis.complexity < 0.3) {
      specialists.add('junior-engineer');
    }
    
    // Add urgency-based specialists
    if (analysis.urgency.level >= 4) {
      specialists.add('emergency-responder');
      specialists.add('senior-engineer');
    }
    
    // Add task-specific specialists
    const description = this.getTaskDescription(task);
    
    if (description.includes('security')) specialists.add('security-specialist');
    if (description.includes('performance')) specialists.add('performance-engineer');
    if (description.includes('database')) specialists.add('database-specialist');
    if (description.includes('ui') || description.includes('frontend')) specialists.add('frontend-developer');
    if (description.includes('api') || description.includes('backend')) specialists.add('backend-engineer');
    
    return Array.from(specialists);
  }
  
  /**
   * Calculate analysis confidence
   */
  calculateConfidence(analysis) {
    let confidence = 0.5; // Base confidence
    
    // Type detection confidence
    if (analysis.type !== TASK_TYPES.COMPUTATION) {
      confidence += 0.1; // Non-default type means better detection
    }
    
    // Complexity confidence
    if (analysis.complexity > 0.2 && analysis.complexity < 0.8) {
      confidence += 0.1; // Mid-range complexity is more reliable
    }
    
    // Urgency confidence
    if (analysis.urgency !== URGENCY_LEVELS.NORMAL) {
      confidence += 0.1; // Explicit urgency detection
    }
    
    // Specialist confidence
    if (analysis.recommendedSpecialists.length > 2) {
      confidence += 0.1; // Multiple specialist matches
    }
    
    // Historical confidence
    const historicalMatches = this.getHistoricalMatches(analysis);
    if (historicalMatches > 5) {
      confidence += 0.1;
    }
    
    return Math.min(1, confidence);
  }
  
  /**
   * Extract analysis factors
   */
  extractFactors(task, analysis) {
    return {
      size: this.getTaskSize(task),
      dependencies: this.getTaskDependencies(task).length,
      operations: this.getTaskOperations(task).length,
      patterns: this.getMatchedPatterns(task),
      historical: this.getHistoricalMatches(analysis)
    };
  }
  
  /**
   * Get task description
   */
  getTaskDescription(task) {
    const parts = [];
    
    if (task.name) parts.push(task.name);
    if (task.description) parts.push(task.description);
    if (task.type) parts.push(task.type);
    if (task.action) parts.push(task.action);
    if (task.command) parts.push(task.command);
    
    return parts.join(' ').toLowerCase();
  }
  
  /**
   * Get task size
   */
  getTaskSize(task) {
    if (task.size) return task.size;
    
    // Estimate from data
    if (task.data) {
      if (typeof task.data === 'string') return task.data.length;
      if (Array.isArray(task.data)) return task.data.length;
      if (typeof task.data === 'object') return Object.keys(task.data).length;
    }
    
    return 1; // Default small size
  }
  
  /**
   * Get task dependencies
   */
  getTaskDependencies(task) {
    if (task.dependencies) return task.dependencies;
    if (task.requires) return task.requires;
    
    // Extract from description
    const description = this.getTaskDescription(task);
    const dependencies = [];
    
    if (description.includes('after')) dependencies.push('sequential');
    if (description.includes('wait')) dependencies.push('blocking');
    if (description.includes('depend')) dependencies.push('dependency');
    
    return dependencies;
  }
  
  /**
   * Get task operations
   */
  getTaskOperations(task) {
    if (task.operations) return task.operations;
    if (task.steps) return task.steps;
    
    // Extract from description
    const description = this.getTaskDescription(task);
    const operations = [];
    
    const operationKeywords = [
      'read', 'write', 'update', 'delete',
      'calculate', 'transform', 'validate',
      'send', 'receive', 'process'
    ];
    
    for (const keyword of operationKeywords) {
      if (description.includes(keyword)) {
        operations.push(keyword);
      }
    }
    
    return operations;
  }
  
  /**
   * Get size factor
   */
  getSizeFactor(size) {
    for (const [sizeName, sizeConfig] of Object.entries(COMPLEXITY_FACTORS.SIZE)) {
      if (size <= sizeConfig.threshold) {
        return sizeConfig;
      }
    }
    return COMPLEXITY_FACTORS.SIZE.huge;
  }
  
  /**
   * Get dependency factor
   */
  getDependencyFactor(count) {
    for (const [depName, depConfig] of Object.entries(COMPLEXITY_FACTORS.DEPENDENCIES)) {
      if (count <= depConfig.count) {
        return depConfig;
      }
    }
    return COMPLEXITY_FACTORS.DEPENDENCIES.many;
  }
  
  /**
   * Get operations factor
   */
  getOperationsFactor(operations) {
    const count = operations.length;
    
    for (const [opsName, opsConfig] of Object.entries(COMPLEXITY_FACTORS.OPERATIONS)) {
      if (count <= opsConfig.types) {
        return opsConfig;
      }
    }
    return COMPLEXITY_FACTORS.OPERATIONS.advanced;
  }
  
  /**
   * Get pattern complexity
   */
  getPatternComplexity(task) {
    const description = this.getTaskDescription(task);
    
    for (const [patternName, pattern] of this.patternLibrary) {
      if (pattern.pattern.test(description)) {
        return pattern.complexity;
      }
    }
    
    return 0;
  }
  
  /**
   * Get matched patterns
   */
  getMatchedPatterns(task) {
    const description = this.getTaskDescription(task);
    const matched = [];
    
    for (const [patternName, pattern] of this.patternLibrary) {
      if (pattern.pattern.test(description)) {
        matched.push(patternName);
      }
    }
    
    return matched;
  }
  
  /**
   * Get historical complexity
   */
  getHistoricalComplexity(task) {
    // Find similar tasks in history
    const similar = this.findSimilarTasks(task);
    
    if (similar.length === 0) return 0;
    
    const avgComplexity = similar.reduce((sum, t) => sum + t.complexity, 0) / similar.length;
    return avgComplexity;
  }
  
  /**
   * Get historical duration
   */
  getHistoricalDuration(task, type) {
    // Check duration model
    const key = `${type.name}`;
    const model = this.durationModel.get(key);
    
    if (model && model.samples > 5) {
      return model.avgDuration;
    }
    
    return 0;
  }
  
  /**
   * Get historical matches
   */
  getHistoricalMatches(analysis) {
    let matches = 0;
    
    for (const historical of this.analysisHistory) {
      if (historical.type === analysis.type) matches++;
      if (Math.abs(historical.complexity - analysis.complexity) < 0.1) matches++;
    }
    
    return matches;
  }
  
  /**
   * Find similar tasks in history
   */
  findSimilarTasks(task) {
    const description = this.getTaskDescription(task);
    const similar = [];
    
    for (const historical of this.analysisHistory) {
      // Simple similarity check (could be improved with better algorithms)
      const similarity = this.calculateSimilarity(description, historical.description || '');
      
      if (similarity > 0.5) {
        similar.push(historical);
      }
    }
    
    return similar;
  }
  
  /**
   * Calculate text similarity (simple implementation)
   */
  calculateSimilarity(text1, text2) {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Get cached analysis
   */
  getCachedAnalysis(task) {
    const key = this.getCacheKey(task);
    const cached = this.analysisCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.analysis;
    }
    
    return null;
  }
  
  /**
   * Cache analysis result
   */
  cacheAnalysis(task, analysis) {
    const key = this.getCacheKey(task);
    
    this.analysisCache.set(key, {
      analysis,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.analysisCache.size > this.config.cacheSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
  }
  
  /**
   * Get cache key for task
   */
  getCacheKey(task) {
    const parts = [
      task.type || '',
      task.name || '',
      task.size || '',
      task.urgency || ''
    ];
    
    return parts.join(':');
  }
  
  /**
   * Record analysis for learning
   */
  recordAnalysis(analysis) {
    this.analysisHistory.push({
      timestamp: analysis.timestamp,
      type: analysis.type.name,
      complexity: analysis.complexity,
      urgency: analysis.urgency.level,
      duration: analysis.estimatedDuration,
      confidence: analysis.confidence
    });
    
    // Trim history
    if (this.analysisHistory.length > this.config.historySize) {
      this.analysisHistory.shift();
    }
    
    // Update duration model
    this.updateDurationModel(analysis);
  }
  
  /**
   * Update duration model
   */
  updateDurationModel(analysis) {
    const key = analysis.type.name;
    
    if (!this.durationModel.has(key)) {
      this.durationModel.set(key, {
        samples: 0,
        totalDuration: 0,
        avgDuration: 0
      });
    }
    
    const model = this.durationModel.get(key);
    model.samples++;
    model.totalDuration += analysis.estimatedDuration;
    model.avgDuration = model.totalDuration / model.samples;
  }
  
  /**
   * Update statistics
   */
  updateStatistics(analysis) {
    this.statistics.totalAnalyzed++;
    
    // Update averages
    this.statistics.avgComplexity = 
      (this.statistics.avgComplexity * (this.statistics.totalAnalyzed - 1) + analysis.complexity) / 
      this.statistics.totalAnalyzed;
    
    this.statistics.avgDuration = 
      (this.statistics.avgDuration * (this.statistics.totalAnalyzed - 1) + analysis.estimatedDuration) / 
      this.statistics.totalAnalyzed;
    
    this.statistics.avgConfidence = 
      (this.statistics.avgConfidence * (this.statistics.totalAnalyzed - 1) + analysis.confidence) / 
      this.statistics.totalAnalyzed;
    
    // Update distributions
    const typeName = analysis.type.name;
    this.statistics.typeDistribution[typeName] = 
      (this.statistics.typeDistribution[typeName] || 0) + 1;
    
    const urgencyLevel = analysis.urgency.level;
    this.statistics.urgencyDistribution[urgencyLevel] = 
      (this.statistics.urgencyDistribution[urgencyLevel] || 0) + 1;
  }
  
  /**
   * Get analyzer status
   */
  getStatus() {
    return {
      statistics: this.statistics,
      cacheSize: this.analysisCache.size,
      historySize: this.analysisHistory.length,
      patterns: this.patternLibrary.size,
      durationModels: this.durationModel.size,
      config: {
        enableML: this.config.enableMachineLearning,
        enablePatterns: this.config.enablePatternRecognition,
        enableHistory: this.config.enableHistoricalAnalysis
      }
    };
  }
  
  /**
   * Reset analyzer
   */
  reset() {
    this.analysisHistory = [];
    this.analysisCache.clear();
    this.durationModel.clear();
    
    // Reset statistics
    this.statistics = {
      totalAnalyzed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgComplexity: 0,
      avgDuration: 0,
      avgConfidence: 0,
      typeDistribution: {},
      urgencyDistribution: {}
    };
    
    logger.info('Task Analyzer reset');
  }
}

module.exports = {
  TaskAnalyzer,
  TaskAnalysis,
  TASK_TYPES,
  URGENCY_LEVELS,
  COMPLEXITY_FACTORS
};