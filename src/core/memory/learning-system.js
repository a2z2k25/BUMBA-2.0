/**
 * BUMBA Learning System
 * Enables true learning from experiences and pattern recognition
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

class LearningSystem extends EventEmitter {
  constructor(memoryLayer) {
    super();
    this.memory = memoryLayer;
    
    // Learning components
    this.patternRecognizer = new PatternRecognizer();
    this.knowledgeConsolidator = new KnowledgeConsolidator();
    this.feedbackProcessor = new FeedbackProcessor();
    this.performanceTracker = new PerformanceTracker();
    
    // Memory types
    this.workingMemory = new Map();
    this.episodicMemory = new Map();
    this.semanticMemory = new Map();
    this.proceduralMemory = new Map();
    
    // Track intervals for cleanup
    this.intervals = new Set();
    
    // Learning parameters
    this.config = {
      consolidationInterval: 3600000, // 1 hour
      patternThreshold: 3, // Min occurrences to form pattern
      decayFactor: 0.95, // Memory decay per period
      relevanceThreshold: 0.3, // Min relevance to keep
      maxWorkingMemorySize: 100,
      maxEpisodicMemorySize: 1000
    };
    
    this.initialize();
  }

  async initialize() {
    // Load existing knowledge
    await this.loadSemanticMemory();
    await this.loadProceduralMemory();
    
    // Start consolidation process
    this.startConsolidation();
    
    // Set up learning triggers
    this.setupLearningTriggers();
    
    logger.info('🟢 Learning System initialized');
  }

  /**
   * Record an experience for learning
   */
  async recordExperience(experience) {
    const experienceEntry = {
      id: this.generateExperienceId(),
      timestamp: Date.now(),
      type: experience.type,
      context: experience.context,
      action: experience.action,
      outcome: experience.outcome,
      success: experience.success,
      duration: experience.duration,
      metadata: experience.metadata || {},
      relevance: 1.0, // Initial relevance
      accessCount: 1
    };

    // Add to working memory
    this.workingMemory.set(experienceEntry.id, experienceEntry);
    
    // Extract immediate patterns
    const patterns = await this.patternRecognizer.analyze(experienceEntry);
    if (patterns.length > 0) {
      await this.processPatterns(patterns);
    }
    
    // Update performance metrics
    await this.performanceTracker.update(experienceEntry);
    
    // Process for procedural learning
    if (experience.type === 'task_completion') {
      await this.learnProcedure(experienceEntry);
    }
    
    // Trigger consolidation if working memory is full
    if (this.workingMemory.size > this.config.maxWorkingMemorySize) {
      await this.consolidateWorkingMemory();
    }
    
    return experienceEntry.id;
  }

  /**
   * Learn from feedback
   */
  async learnFromFeedback(feedback) {
    const processed = await this.feedbackProcessor.process(feedback);
    
    // Update relevant memories
    if (processed.experienceId) {
      await this.updateExperienceOutcome(processed.experienceId, processed);
    }
    
    // Adjust patterns based on feedback
    if (processed.patternAdjustments) {
      await this.adjustPatterns(processed.patternAdjustments);
    }
    
    // Update procedural knowledge
    if (processed.procedureUpdate) {
      await this.updateProcedure(processed.procedureUpdate);
    }
    
    this.emit('feedback-learned', processed);
  }

  /**
   * Retrieve learned knowledge
   */
  async retrieveKnowledge(query) {
    const results = {
      immediate: [],
      episodic: [],
      semantic: [],
      procedural: [],
      patterns: []
    };

    // Search working memory (most recent)
    for (const [id, memory] of this.workingMemory) {
      if (this.matchesQuery(memory, query)) {
        results.immediate.push(this.enhanceWithRelevance(memory));
      }
    }
    
    // Search episodic memory (specific experiences)
    const episodicResults = await this.searchEpisodicMemory(query);
    results.episodic = episodicResults;
    
    // Search semantic memory (general knowledge)
    const semanticResults = await this.searchSemanticMemory(query);
    results.semantic = semanticResults;
    
    // Search procedural memory (how-to knowledge)
    const proceduralResults = await this.searchProceduralMemory(query);
    results.procedural = proceduralResults;
    
    // Get relevant patterns
    const patterns = await this.patternRecognizer.getRelevantPatterns(query);
    results.patterns = patterns;
    
    // Update access counts and relevance
    await this.updateAccessMetrics(results);
    
    return this.rankResults(results, query);
  }

  /**
   * Consolidate working memory to long-term storage
   */
  async consolidateWorkingMemory() {
    const consolidationBatch = [];
    
    // Process each working memory item
    for (const [id, memory] of this.workingMemory) {
      // Apply decay
      memory.relevance *= this.config.decayFactor;
      
      // Check if should be consolidated
      if (memory.relevance > this.config.relevanceThreshold) {
        consolidationBatch.push(memory);
      }
    }
    
    // Consolidate similar experiences
    const consolidated = await this.knowledgeConsolidator.consolidate(consolidationBatch);
    
    // Move to appropriate memory stores
    for (const item of consolidated) {
      if (item.type === 'episodic') {
        await this.storeEpisodicMemory(item);
      } else if (item.type === 'semantic') {
        await this.storeSemanticMemory(item);
      }
    }
    
    // Clear old working memory
    const preserved = Math.floor(this.config.maxWorkingMemorySize * 0.2);
    const sorted = Array.from(this.workingMemory.values())
      .sort((a, b) => b.relevance - a.relevance);
    
    this.workingMemory.clear();
    
    // Keep most relevant items
    for (let i = 0; i < preserved && i < sorted.length; i++) {
      this.workingMemory.set(sorted[i].id, sorted[i]);
    }
    
    logger.info(`🟢 Consolidated ${consolidationBatch.length} memories`);
  }

  /**
   * Learn a procedure from successful task completion
   */
  async learnProcedure(experience) {
    const procedure = {
      id: `proc_${experience.action.type}_${Date.now()}`,
      name: experience.action.type,
      steps: this.extractSteps(experience),
      conditions: this.extractConditions(experience),
      outcomes: {
        expected: experience.outcome,
        variations: []
      },
      confidence: experience.success ? 0.8 : 0.3,
      usage_count: 0,
      success_rate: experience.success ? 1.0 : 0.0
    };

    // Check if similar procedure exists
    const existing = await this.findSimilarProcedure(procedure);
    
    if (existing) {
      // Update existing procedure
      await this.mergeProcedures(existing, procedure);
    } else {
      // Store new procedure
      this.proceduralMemory.set(procedure.id, procedure);
      await this.memory.store(`procedural/${procedure.id}`, procedure, {
        persistent: true,
        encrypted: false
      });
    }
  }

  /**
   * Pattern processing
   */
  async processPatterns(patterns) {
    for (const pattern of patterns) {
      const patternId = this.generatePatternId(pattern);
      
      // Check if pattern exists
      const existing = await this.memory.retrieve(`pattern/${patternId}`);
      
      if (existing) {
        // Strengthen existing pattern
        existing.data.occurrences += 1;
        existing.data.confidence = Math.min(0.99, existing.data.confidence * 1.1);
        existing.data.lastSeen = Date.now();
        
        await this.memory.store(`pattern/${patternId}`, existing.data, {
          persistent: true
        });
      } else if (pattern.occurrences >= this.config.patternThreshold) {
        // Create new pattern
        await this.memory.store(`pattern/${patternId}`, {
          id: patternId,
          pattern: pattern,
          confidence: 0.5,
          occurrences: pattern.occurrences,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          applications: []
        }, {
          persistent: true
        });
      }
    }
  }

  /**
   * Performance tracking
   */
  async getPerformanceInsights(timeframe = 'week') {
    const metrics = await this.performanceTracker.getMetrics(timeframe);
    
    return {
      success_rate: metrics.successRate,
      average_duration: metrics.avgDuration,
      improvement_trend: metrics.trend,
      common_failures: metrics.failures,
      best_practices: await this.extractBestPractices(metrics),
      recommendations: await this.generateRecommendations(metrics)
    };
  }

  /**
   * Extract best practices from successful experiences
   */
  async extractBestPractices(metrics) {
    const practices = [];
    
    // Find consistently successful patterns
    for (const [action, stats] of Object.entries(metrics.actionStats)) {
      if (stats.successRate > 0.9 && stats.count > 5) {
        const pattern = await this.findSuccessPattern(action);
        if (pattern) {
          practices.push({
            action: action,
            pattern: pattern,
            success_rate: stats.successRate,
            confidence: Math.min(0.95, stats.successRate * stats.count / 10)
          });
        }
      }
    }
    
    return practices.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate learning-based recommendations
   */
  async generateRecommendations(metrics) {
    const recommendations = [];
    
    // Recommend based on failure patterns
    for (const failure of metrics.failures) {
      const solution = await this.findSolutionPattern(failure);
      if (solution) {
        recommendations.push({
          issue: failure.type,
          recommendation: solution.approach,
          confidence: solution.confidence,
          based_on: solution.successful_cases
        });
      }
    }
    
    // Recommend optimizations
    const optimizations = await this.findOptimizationOpportunities(metrics);
    recommendations.push(...optimizations);
    
    return recommendations;
  }

  /**
   * Memory search utilities
   */
  async searchEpisodicMemory(query) {
    const results = [];
    
    for (const [id, memory] of this.episodicMemory) {
      const relevance = this.calculateRelevance(memory, query);
      if (relevance > this.config.relevanceThreshold) {
        results.push({
          ...memory,
          relevance: relevance,
          memory_type: 'episodic'
        });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  async searchSemanticMemory(query) {
    const results = [];
    
    // Search through semantic concepts
    for (const [concept, knowledge] of this.semanticMemory) {
      const relevance = this.calculateSemanticRelevance(knowledge, query);
      if (relevance > this.config.relevanceThreshold) {
        results.push({
          concept: concept,
          knowledge: knowledge,
          relevance: relevance,
          memory_type: 'semantic'
        });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  async searchProceduralMemory(query) {
    const results = [];
    
    for (const [id, procedure] of this.proceduralMemory) {
      if (this.procedureMatchesQuery(procedure, query)) {
        results.push({
          ...procedure,
          relevance: this.calculateProcedureRelevance(procedure, query),
          memory_type: 'procedural'
        });
      }
    }
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Utility methods
   */
  generateExperienceId() {
    return `exp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generatePatternId(pattern) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(pattern.key_elements));
    return hash.digest('hex').substring(0, 16);
  }

  calculateRelevance(memory, query) {
    let relevance = memory.relevance || 0.5;
    
    // Recency boost
    const age = Date.now() - memory.timestamp;
    const recencyFactor = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // Week decay
    relevance *= (0.5 + 0.5 * recencyFactor);
    
    // Access frequency boost
    if (memory.accessCount > 1) {
      relevance *= Math.log(memory.accessCount) / Math.log(10);
    }
    
    // Query match boost
    const matchScore = this.calculateMatchScore(memory, query);
    relevance *= matchScore;
    
    return Math.min(1.0, relevance);
  }

  startConsolidation() {
    const consolidationInterval = setInterval(() => {
      this.consolidateWorkingMemory();
    }, this.config.consolidationInterval);
    this.intervals.add(consolidationInterval);
  }
  
  /**
   * Clean up resources and stop all intervals
   */
  async cleanup() {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    logger.info('🟢 Learning system cleaned up');
  }
}

/**
 * Pattern Recognition Engine
 */
class PatternRecognizer {
  constructor() {
    this.patterns = new Map();
    this.sequenceBuffer = [];
    this.maxSequenceLength = 10;
  }

  async analyze(experience) {
    this.sequenceBuffer.push(experience);
    if (this.sequenceBuffer.length > this.maxSequenceLength) {
      this.sequenceBuffer.shift();
    }
    
    const patterns = [];
    
    // Look for sequence patterns
    const sequencePatterns = this.findSequencePatterns();
    patterns.push(...sequencePatterns);
    
    // Look for context patterns
    const contextPatterns = this.findContextPatterns(experience);
    patterns.push(...contextPatterns);
    
    // Look for outcome patterns
    const outcomePatterns = this.findOutcomePatterns(experience);
    patterns.push(...outcomePatterns);
    
    return patterns;
  }

  findSequencePatterns() {
    const patterns = [];
    
    // Look for repeated sequences
    for (let len = 2; len <= Math.min(5, this.sequenceBuffer.length); len++) {
      for (let i = 0; i <= this.sequenceBuffer.length - len; i++) {
        const sequence = this.sequenceBuffer.slice(i, i + len);
        const sequenceKey = this.getSequenceKey(sequence);
        
        if (this.patterns.has(sequenceKey)) {
          const pattern = this.patterns.get(sequenceKey);
          pattern.occurrences += 1;
          pattern.lastSeen = Date.now();
          patterns.push(pattern);
        } else {
          const pattern = {
            type: 'sequence',
            key_elements: sequence.map(e => ({
              action: e.action.type
            })),
            occurrences: 1,
            firstSeen: Date.now(),
            lastSeen: Date.now()
          };
          this.patterns.set(sequenceKey, pattern);
        }
      }
    }
    
    return patterns;
  }

  findContextPatterns(experience) {
    // Extract context features
    const contextFeatures = this.extractContextFeatures(experience.context);
    const patterns = [];
    
    for (const feature of contextFeatures) {
      const patternKey = `context_${feature.type}_${feature.value}`;
      
      if (this.patterns.has(patternKey)) {
        const pattern = this.patterns.get(patternKey);
        pattern.occurrences += 1;
        
        // Track outcomes for this context
        if (!pattern.outcomes) {pattern.outcomes = {};}
        const outcomeKey = experience.success ? 'success' : 'failure';
        pattern.outcomes[outcomeKey] = (pattern.outcomes[outcomeKey] || 0) + 1;
        
        patterns.push(pattern);
      } else {
        const pattern = {
          type: 'context',
          key_elements: { feature },
          occurrences: 1,
          outcomes: { [experience.success ? 'success' : 'failure']: 1 }
        };
        this.patterns.set(patternKey, pattern);
      }
    }
    
    return patterns;
  }

  findOutcomePatterns(experience) {
    const patterns = [];
    
    // Pattern: action -> outcome
    const actionOutcomeKey = `${experience.action.type}_${experience.outcome.type}`;
    
    if (this.patterns.has(actionOutcomeKey)) {
      const pattern = this.patterns.get(actionOutcomeKey);
      pattern.occurrences += 1;
      pattern.confidence = pattern.occurrences / (pattern.occurrences + pattern.failures || 0);
      patterns.push(pattern);
    } else {
      this.patterns.set(actionOutcomeKey, {
        type: 'action_outcome',
        action: experience.action.type,
        outcome: experience.outcome.type,
        occurrences: 1,
        failures: 0,
        confidence: 1.0
      });
    }
    
    return patterns;
  }

  getSequenceKey(sequence) {
    return sequence.map(e => `${e.type}:${e.action.type}`).join('-');
  }

  extractContextFeatures(context) {
    const features = [];
    
    // Extract various context features
    if (context.time_of_day) {
      features.push({ type: 'time', value: this.getTimeCategory(context.time_of_day) });
    }
    
    if (context.workload) {
      features.push({ type: 'workload', value: context.workload });
    }
    
    if (context.user_state) {
      features.push({ type: 'user_state', value: context.user_state });
    }
    
    return features;
  }

  getTimeCategory(time) {
    const hour = new Date(time).getHours();
    if (hour < 6) {return 'night';}
    if (hour < 12) {return 'morning';}
    if (hour < 18) {return 'afternoon';}
    return 'evening';
  }

  async getRelevantPatterns(query) {
    const relevant = [];
    
    for (const [key, pattern] of this.patterns) {
      if (this.patternMatchesQuery(pattern, query)) {
        relevant.push({
          ...pattern,
          relevance: this.calculatePatternRelevance(pattern, query)
        });
      }
    }
    
    return relevant.sort((a, b) => b.relevance - a.relevance);
  }

  patternMatchesQuery(pattern, query) {
    // Simple matching logic - can be enhanced
    if (query.type && pattern.type !== query.type) {return false;}
    if (query.action && pattern.action !== query.action) {return false;}
    return true;
  }

  calculatePatternRelevance(pattern, query) {
    let relevance = pattern.confidence || 0.5;
    
    // Boost by occurrence count
    relevance *= Math.log(pattern.occurrences + 1) / Math.log(10);
    
    // Recency boost
    const age = Date.now() - pattern.lastSeen;
    relevance *= Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // Month decay
    
    return Math.min(1.0, relevance);
  }
}

/**
 * Knowledge Consolidation Engine
 */
class KnowledgeConsolidator {
  async consolidate(memories) {
    const consolidated = [];
    
    // Group similar memories
    const groups = this.groupSimilarMemories(memories);
    
    for (const group of groups) {
      if (group.length === 1) {
        // Single memory - check if it should become episodic
        const memory = group[0];
        if (memory.relevance > 0.7 || memory.accessCount > 3) {
          consolidated.push({
            ...memory,
            type: 'episodic'
          });
        }
      } else {
        // Multiple similar memories - create semantic knowledge
        const semantic = await this.createSemanticKnowledge(group);
        consolidated.push(semantic);
        
        // Keep significant individual episodes
        const significantEpisodes = group.filter(m => 
          m.relevance > 0.8 || m.accessCount > 5
        );
        consolidated.push(...significantEpisodes.map(m => ({
          ...m,
          type: 'episodic'
        })));
      }
    }
    
    return consolidated;
  }

  groupSimilarMemories(memories) {
    const groups = [];
    const used = new Set();
    
    for (let i = 0; i < memories.length; i++) {
      if (used.has(i)) {continue;}
      
      const group = [memories[i]];
      used.add(i);
      
      for (let j = i + 1; j < memories.length; j++) {
        if (used.has(j)) {continue;}
        
        if (this.areSimilar(memories[i], memories[j])) {
          group.push(memories[j]);
          used.add(j);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  areSimilar(memory1, memory2) {
    // Check action similarity
    if (memory1.action?.type === memory2.action?.type) {
      return true;
    }
    
    // Check context similarity
    const contextSimilarity = this.calculateContextSimilarity(
      memory1.context,
      memory2.context
    );
    
    return contextSimilarity > 0.7;
  }

  calculateContextSimilarity(context1, context2) {
    if (!context1 || !context2) {return 0;}
    
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    let matches = 0;
    for (const key of allKeys) {
      if (context1[key] === context2[key]) {
        matches++;
      }
    }
    
    return matches / allKeys.size;
  }

  async createSemanticKnowledge(group) {
    // Extract common elements
    const commonAction = this.findCommonElement(group.map(m => m.action?.type));
    const commonOutcome = this.findCommonElement(group.map(m => m.outcome?.type));
    const avgDuration = group.reduce((sum, m) => sum + (m.duration || 0), 0) / group.length;
    const successRate = group.filter(m => m.success).length / group.length;
    
    return {
      type: 'semantic',
      concept: commonAction || 'general_experience',
      knowledge: {
        typical_duration: avgDuration,
        success_rate: successRate,
        common_outcome: commonOutcome,
        variations: this.extractVariations(group),
        confidence: Math.min(0.95, successRate * group.length / 10)
      },
      derived_from: group.length,
      created: Date.now()
    };
  }

  findCommonElement(elements) {
    const counts = {};
    for (const element of elements) {
      if (element) {
        counts[element] = (counts[element] || 0) + 1;
      }
    }
    
    let maxCount = 0;
    let commonElement = null;
    
    for (const [element, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        commonElement = element;
      }
    }
    
    return commonElement;
  }

  extractVariations(group) {
    const variations = [];
    
    for (const memory of group) {
      const variation = {
        context: memory.context,
        outcome: memory.outcome,
        success: memory.success
      };
      
      // Check if this variation already exists
      const exists = variations.some(v => 
        JSON.stringify(v) === JSON.stringify(variation)
      );
      
      if (!exists) {
        variations.push(variation);
      }
    }
    
    return variations;
  }
}

/**
 * Feedback Processing Engine
 */
class FeedbackProcessor {
  async process(feedback) {
    const processed = {
      type: feedback.type,
      sentiment: this.analyzeSentiment(feedback),
      experienceId: feedback.experienceId,
      timestamp: Date.now()
    };

    // Process different feedback types
    switch (feedback.type) {
      case 'correction':
        processed.patternAdjustments = await this.processCorrection(feedback);
        break;
      case 'rating':
        processed.qualityAdjustment = this.processRating(feedback);
        break;
      case 'suggestion':
        processed.procedureUpdate = await this.processSuggestion(feedback);
        break;
    }
    
    return processed;
  }

  analyzeSentiment(feedback) {
    // Simple sentiment analysis
    const positive = ['good', 'great', 'excellent', 'perfect', 'works'];
    const negative = ['bad', 'wrong', 'failed', 'error', 'broken'];
    
    const text = feedback.text?.toLowerCase() || '';
    
    const positiveCount = positive.filter(word => text.includes(word)).length;
    const negativeCount = negative.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) {return 'positive';}
    if (negativeCount > positiveCount) {return 'negative';}
    return 'neutral';
  }

  async processCorrection(feedback) {
    return {
      action: 'reduce_confidence',
      patterns: feedback.relatedPatterns || [],
      adjustment: -0.2
    };
  }

  processRating(feedback) {
    const rating = feedback.rating || 3;
    return {
      quality_multiplier: rating / 5,
      confidence_adjustment: (rating - 3) * 0.1
    };
  }

  async processSuggestion(feedback) {
    return {
      type: 'procedure_enhancement',
      suggestion: feedback.suggestion,
      current_procedure: feedback.currentProcedure,
      confidence: 0.6 // Suggestions start with moderate confidence
    };
  }
}

/**
 * Performance Tracking Engine
 */
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.timeframes = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000
    };
  }

  async update(experience) {
    const now = Date.now();
    const action = experience.action?.type || 'unknown';
    
    // Initialize metrics for this action if needed
    if (!this.metrics.has(action)) {
      this.metrics.set(action, {
        total: 0,
        successful: 0,
        totalDuration: 0,
        history: []
      });
    }
    
    const actionMetrics = this.metrics.get(action);
    
    // Update metrics
    actionMetrics.total += 1;
    if (experience.success) {
      actionMetrics.successful += 1;
    }
    actionMetrics.totalDuration += experience.duration || 0;
    
    // Add to history
    actionMetrics.history.push({
      timestamp: now,
      success: experience.success,
      duration: experience.duration
    });
    
    // Clean old history
    const cutoff = now - this.timeframes.month;
    actionMetrics.history = actionMetrics.history.filter(h => h.timestamp > cutoff);
  }

  async getMetrics(timeframe = 'week') {
    const cutoff = Date.now() - this.timeframes[timeframe];
    const aggregated = {
      total: 0,
      successful: 0,
      totalDuration: 0,
      actionStats: {},
      failures: [],
      trend: null
    };

    for (const [action, metrics] of this.metrics) {
      const recentHistory = metrics.history.filter(h => h.timestamp > cutoff);
      
      if (recentHistory.length > 0) {
        const actionTotal = recentHistory.length;
        const actionSuccessful = recentHistory.filter(h => h.success).length;
        const actionDuration = recentHistory.reduce((sum, h) => sum + (h.duration || 0), 0);
        
        aggregated.total += actionTotal;
        aggregated.successful += actionSuccessful;
        aggregated.totalDuration += actionDuration;
        
        aggregated.actionStats[action] = {
          count: actionTotal,
          successRate: actionSuccessful / actionTotal,
          avgDuration: actionDuration / actionTotal
        };
        
        // Track failures
        const failures = recentHistory.filter(h => !h.success);
        if (failures.length > 0) {
          aggregated.failures.push({
            type: action,
            count: failures.length,
            rate: failures.length / actionTotal
          });
        }
      }
    }

    // Calculate overall metrics
    aggregated.successRate = aggregated.total > 0 ? 
      aggregated.successful / aggregated.total : 0;
    aggregated.avgDuration = aggregated.total > 0 ? 
      aggregated.totalDuration / aggregated.total : 0;
    
    // Calculate trend
    aggregated.trend = await this.calculateTrend(timeframe);
    
    // Sort failures by frequency
    aggregated.failures.sort((a, b) => b.count - a.count);
    
    return aggregated;
  }

  async calculateTrend(timeframe) {
    const periods = 4;
    const periodLength = this.timeframes[timeframe] / periods;
    const now = Date.now();
    
    const periodMetrics = [];
    
    for (let i = 0; i < periods; i++) {
      const periodStart = now - (i + 1) * periodLength;
      const periodEnd = now - i * periodLength;
      
      let total = 0;
      let successful = 0;
      
      for (const [, metrics] of this.metrics) {
        const periodHistory = metrics.history.filter(h => 
          h.timestamp >= periodStart && h.timestamp < periodEnd
        );
        
        total += periodHistory.length;
        successful += periodHistory.filter(h => h.success).length;
      }
      
      periodMetrics.push({
        period: i,
        successRate: total > 0 ? successful / total : 0
      });
    }
    
    // Calculate trend direction
    if (periodMetrics.length < 2) {return 'insufficient_data';}
    
    const recent = periodMetrics[0].successRate;
    const older = periodMetrics[periodMetrics.length - 1].successRate;
    
    if (recent > older + 0.05) {return 'improving';}
    if (recent < older - 0.05) {return 'declining';}
    return 'stable';
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  LearningSystem,
  
  getInstance(memoryLayer) {
    if (!instance) {
      instance = new LearningSystem(memoryLayer);
    }
    return instance;
  },
  
  // Convenience methods
  learn: async (experience) => {
    return getInstance().recordExperience(experience);
  },
  
  retrieve: async (query) => {
    return getInstance().retrieveKnowledge(query);
  },
  
  feedback: async (feedback) => {
    return getInstance().learnFromFeedback(feedback);
  }
};