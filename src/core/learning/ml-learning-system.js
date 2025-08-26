/**
 * BUMBA ML-based Learning System
 * Machine learning layer for adaptive agent intelligence
 */

const EventEmitter = require('events');
const { logger } = require('../logging/bumba-logger');
const { ConsciousnessLayer } = require('../consciousness/consciousness-layer');
const UnifiedMemorySystem = require('../memory/unified-memory-system');

class BumbaMLLearningSystem extends EventEmitter {
  constructor() {
    super();
    this.models = new Map();
    this.trainingData = new Map();
    this.learningProfiles = new Map();
    this.patternRecognizer = new PatternRecognitionEngine();
    this.adaptiveBehavior = new AdaptiveBehaviorSystem();
    this.reinforcementLearner = new ReinforcementLearningEngine();
    this.consciousnessLayer = new ConsciousnessLayer();
    this.memory = UnifiedMemorySystem.getInstance();
    
    this.config = {
      learningRate: 0.01,
      batchSize: 32,
      modelUpdateInterval: 3600000, // 1 hour
      patternThreshold: 0.75,
      adaptationSpeed: 0.1,
      explorationRate: 0.1
    };
  }

  async initialize(config = {}) {
    this.config = { ...this.config, ...config };
    
    logger.info('🟢 Initializing ML Learning System...');
    
    await this.patternRecognizer.initialize();
    await this.adaptiveBehavior.initialize();
    await this.reinforcementLearner.initialize();
    
    // Load existing models
    await this.loadModels();
    
    // Start continuous learning
    this.startContinuousLearning();
    
    logger.info('🟢 ML Learning System initialized');
  }

  /**
   * Learn from agent interactions
   */
  async learnFromInteraction(interaction) {
    const learningContext = {
      agentId: interaction.agentId,
      taskType: interaction.taskType,
      input: interaction.input,
      actions: interaction.actions,
      output: interaction.output,
      feedback: interaction.feedback,
      performance: interaction.performance,
      timestamp: Date.now()
    };

    // Validate with consciousness principles
    await this.consciousnessLayer.validateIntent({
      description: 'learning from interaction',
      context: learningContext
    });

    // Extract patterns
    const patterns = await this.patternRecognizer.extractPatterns(learningContext);
    
    // Update behavior models
    await this.adaptiveBehavior.updateFromInteraction(learningContext);
    
    // Reinforcement learning update
    if (learningContext.feedback) {
      await this.reinforcementLearner.updateFromFeedback(learningContext);
    }

    // Store in training data
    this.addTrainingData(learningContext);
    
    // Update agent profile
    await this.updateLearningProfile(interaction.agentId, {
      patterns,
      performance: interaction.performance
    });

    logger.debug(`🟢 Learned from interaction: ${interaction.taskType}`);
    
    this.emit('interaction_learned', {
      agentId: interaction.agentId,
      patterns: patterns.length,
      performance: interaction.performance
    });
  }

  /**
   * Predict optimal actions for a given context
   */
  async predictOptimalActions(context) {
    const { agentId, taskType, currentState, availableActions } = context;
    
    // Get agent's learning profile
    const profile = this.learningProfiles.get(agentId) || this.createDefaultProfile();
    
    // Pattern-based predictions
    const patternPredictions = await this.patternRecognizer.predictFromPatterns(
      taskType,
      currentState,
      profile.patterns
    );
    
    // Behavior model predictions
    const behaviorPredictions = await this.adaptiveBehavior.predictActions(
      agentId,
      taskType,
      currentState
    );
    
    // RL-based action selection
    const rlPredictions = await this.reinforcementLearner.selectActions(
      currentState,
      availableActions,
      profile
    );
    
    // Combine predictions with weighted voting
    const combinedPredictions = this.combinePredictions({
      pattern: patternPredictions,
      behavior: behaviorPredictions,
      reinforcement: rlPredictions
    });
    
    // Apply exploration vs exploitation
    const finalActions = this.applyExploration(
      combinedPredictions,
      availableActions
    );
    
    logger.debug(`🟢 Predicted ${finalActions.length} optimal actions`);
    
    return {
      actions: finalActions,
      confidence: this.calculateConfidence(combinedPredictions),
      reasoning: this.explainPredictions(combinedPredictions)
    };
  }

  /**
   * Adapt agent behavior based on performance
   */
  async adaptBehavior(agentId, performanceData) {
    const profile = this.learningProfiles.get(agentId);
    if (!profile) {
      logger.warn(`No learning profile for agent ${agentId}`);
      return;
    }

    // Analyze performance trends
    const trends = await this.analyzePerformanceTrends(profile, performanceData);
    
    // Identify areas for improvement
    const improvements = await this.identifyImprovements(trends);
    
    // Generate behavior adaptations
    const adaptations = await this.adaptiveBehavior.generateAdaptations(
      agentId,
      improvements
    );
    
    // Apply adaptations gradually
    for (const adaptation of adaptations) {
      await this.applyAdaptation(agentId, adaptation);
    }
    
    // Update profile
    profile.lastAdaptation = Date.now();
    profile.adaptationCount++;
    
    logger.info(`🟢 Adapted behavior for agent ${agentId}`);
    
    this.emit('behavior_adapted', {
      agentId,
      adaptations: adaptations.length,
      improvements: improvements.length
    });
  }

  /**
   * Train method (wrapper for trainModels)
   */
  async train(data) {
    if (data) {
      // If data is provided, add it to training data
      if (Array.isArray(data)) {
        data.forEach(d => this.addTrainingData(d));
      } else {
        this.addTrainingData(data);
      }
    }
    return this.trainModels();
  }

  /**
   * Train models with accumulated data
   */
  async trainModels() {
    logger.info('🟢 Starting model training...');
    
    const trainingStartTime = Date.now();
    
    try {
      // Train pattern recognition models
      const patternResults = await this.patternRecognizer.train(
        this.getTrainingData('patterns')
      );
      
      // Train behavior models
      const behaviorResults = await this.adaptiveBehavior.train(
        this.getTrainingData('behaviors')
      );
      
      // Train RL models
      const rlResults = await this.reinforcementLearner.train(
        this.getTrainingData('reinforcement')
      );
      
      const trainingTime = Date.now() - trainingStartTime;
      
      logger.info(`🟢 Model training completed in ${trainingTime}ms`);
      
      this.emit('models_trained', {
        patternResults,
        behaviorResults,
        rlResults,
        trainingTime
      });
      
      // Save updated models
      await this.saveModels();
      
    } catch (error) {
      logger.error('Model training failed:', error);
      this.emit('training_failed', { error });
    }
  }

  /**
   * Detect anomalies in agent behavior
   */
  async detectAnomalies(agentId, behavior) {
    const profile = this.learningProfiles.get(agentId);
    if (!profile) {
      return { isAnomaly: false };
    }

    // Pattern-based anomaly detection
    const patternAnomaly = await this.patternRecognizer.detectAnomaly(
      behavior,
      profile.patterns
    );
    
    // Statistical anomaly detection
    const statisticalAnomaly = this.detectStatisticalAnomaly(
      behavior,
      profile.statistics
    );
    
    // Combine detection results
    const anomalyScore = (patternAnomaly.score + statisticalAnomaly.score) / 2;
    const isAnomaly = anomalyScore > this.config.anomalyThreshold;
    
    if (isAnomaly) {
      logger.warn(`🟢 Anomaly detected for agent ${agentId}: ${anomalyScore}`);
      
      this.emit('anomaly_detected', {
        agentId,
        behavior,
        anomalyScore,
        details: {
          pattern: patternAnomaly,
          statistical: statisticalAnomaly
        }
      });
    }
    
    return {
      isAnomaly,
      score: anomalyScore,
      explanation: this.explainAnomaly(patternAnomaly, statisticalAnomaly)
    };
  }

  /**
   * Transfer learning between agents
   */
  async transferLearning(sourceAgentId, targetAgentId, options = {}) {
    const sourceProfile = this.learningProfiles.get(sourceAgentId);
    if (!sourceProfile) {
      throw new Error(`Source agent ${sourceAgentId} has no learning profile`);
    }

    logger.info(`🟢 Transferring learning from ${sourceAgentId} to ${targetAgentId}`);
    
    // Get or create target profile
    let targetProfile = this.learningProfiles.get(targetAgentId);
    if (!targetProfile) {
      targetProfile = this.createDefaultProfile();
      this.learningProfiles.set(targetAgentId, targetProfile);
    }

    // Transfer patterns
    if (options.transferPatterns !== false) {
      const transferredPatterns = await this.patternRecognizer.transferPatterns(
        sourceProfile.patterns,
        targetProfile.patterns,
        options.patternFilter
      );
      
      targetProfile.patterns = transferredPatterns;
    }

    // Transfer behavior models
    if (options.transferBehaviors !== false) {
      const transferredBehaviors = await this.adaptiveBehavior.transferModels(
        sourceAgentId,
        targetAgentId,
        options.behaviorFilter
      );
      
      targetProfile.behaviors = transferredBehaviors;
    }

    // Transfer RL knowledge
    if (options.transferRL !== false) {
      await this.reinforcementLearner.transferKnowledge(
        sourceProfile.rlModel,
        targetProfile.rlModel,
        options.rlTransferRate || 0.5
      );
    }

    // Mark transfer in profiles
    targetProfile.transferHistory.push({
      from: sourceAgentId,
      timestamp: Date.now(),
      options
    });

    logger.info('🟢 Learning transfer completed');
    
    this.emit('learning_transferred', {
      sourceAgentId,
      targetAgentId,
      options
    });
  }

  /**
   * Get learning insights for an agent
   */
  async getLearningInsights(agentId) {
    const profile = this.learningProfiles.get(agentId);
    if (!profile) {
      return null;
    }

    const insights = {
      profile: {
        createdAt: profile.createdAt,
        lastUpdated: profile.lastUpdated,
        interactionCount: profile.interactionCount,
        adaptationCount: profile.adaptationCount
      },
      patterns: await this.patternRecognizer.getInsights(profile.patterns),
      behavior: await this.adaptiveBehavior.getInsights(agentId),
      performance: this.analyzePerformanceMetrics(profile.performanceHistory),
      recommendations: await this.generateRecommendations(profile)
    };

    return insights;
  }

  /**
   * Continuous learning loop
   */
  startContinuousLearning() {
    // Model training interval
    setInterval(async () => {
      const trainingDataSize = this.getTotalTrainingDataSize();
      if (trainingDataSize > this.config.minTrainingSize) {
        await this.trainModels();
      }
    }, this.config.modelUpdateInterval);

    // Periodic performance analysis
    setInterval(async () => {
      for (const [agentId, profile] of this.learningProfiles) {
        if (this.shouldAdaptBehavior(profile)) {
          await this.adaptBehavior(agentId, profile.performanceHistory);
        }
      }
    }, this.config.adaptationInterval || 1800000); // 30 minutes
  }

  // Helper methods
  
  addTrainingData(data) {
    const key = `${data.agentId}-${data.taskType}`;
    if (!this.trainingData.has(key)) {
      this.trainingData.set(key, []);
    }
    
    const dataList = this.trainingData.get(key);
    dataList.push(data);
    
    // Keep only recent data
    if (dataList.length > this.config.maxTrainingDataSize) {
      dataList.shift();
    }
  }

  getTrainingData(type) {
    const data = [];
    
    for (const [key, values] of this.trainingData) {
      if (type === 'patterns') {
        data.push(...values.map(v => ({
          input: v.input,
          output: v.output,
          context: v
        })));
      } else if (type === 'behaviors') {
        data.push(...values.map(v => ({
          state: v.input,
          actions: v.actions,
          result: v.output
        })));
      } else if (type === 'reinforcement') {
        data.push(...values.filter(v => v.feedback).map(v => ({
          state: v.input,
          action: v.actions[0],
          reward: v.feedback.score,
          nextState: v.output
        })));
      }
    }
    
    return data;
  }

  async updateLearningProfile(agentId, updates) {
    let profile = this.learningProfiles.get(agentId);
    
    if (!profile) {
      profile = this.createDefaultProfile();
      this.learningProfiles.set(agentId, profile);
    }
    
    // Update profile
    if (updates.patterns) {
      profile.patterns.push(...updates.patterns);
    }
    
    if (updates.performance) {
      profile.performanceHistory.push({
        timestamp: Date.now(),
        ...updates.performance
      });
    }
    
    profile.lastUpdated = Date.now();
    profile.interactionCount++;
    
    // Store in memory
    await this.memory.store({
      type: 'learning_profile',
      agentId,
      profile
    });
  }

  createDefaultProfile() {
    return {
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      interactionCount: 0,
      adaptationCount: 0,
      patterns: [],
      behaviors: {},
      statistics: {
        mean: {},
        stdDev: {}
      },
      performanceHistory: [],
      transferHistory: [],
      rlModel: {}
    };
  }

  combinePredictions(predictions) {
    const weights = {
      pattern: 0.4,
      behavior: 0.4,
      reinforcement: 0.2
    };
    
    const combined = new Map();
    
    // Aggregate predictions
    for (const [source, weight] of Object.entries(weights)) {
      const sourcePredictions = predictions[source] || [];
      
      for (const pred of sourcePredictions) {
        const key = JSON.stringify(pred.action);
        
        if (!combined.has(key)) {
          combined.set(key, {
            action: pred.action,
            score: 0,
            sources: []
          });
        }
        
        const entry = combined.get(key);
        entry.score += pred.confidence * weight;
        entry.sources.push({ source, confidence: pred.confidence });
      }
    }
    
    // Sort by score
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score);
  }

  applyExploration(predictions, availableActions) {
    const explorationProb = this.config.explorationRate;
    
    if (Math.random() < explorationProb) {
      // Exploration: add random action
      const unexploredActions = availableActions.filter(action =>
        !predictions.some(p => JSON.stringify(p.action) === JSON.stringify(action))
      );
      
      if (unexploredActions.length > 0) {
        const randomAction = unexploredActions[
          Math.floor(Math.random() * unexploredActions.length)
        ];
        
        predictions.push({
          action: randomAction,
          score: explorationProb,
          sources: [{ source: 'exploration', confidence: 1.0 }]
        });
      }
    }
    
    return predictions;
  }

  calculateConfidence(predictions) {
    if (predictions.length === 0) {return 0;}
    
    // Calculate based on agreement between sources
    const topPrediction = predictions[0];
    const sourceAgreement = topPrediction.sources.length / 3; // 3 prediction sources
    
    return topPrediction.score * sourceAgreement;
  }

  explainPredictions(predictions) {
    return predictions.slice(0, 3).map(pred => ({
      action: pred.action,
      score: pred.score,
      reasoning: pred.sources.map(s => 
        `${s.source} (confidence: ${(s.confidence * 100).toFixed(1)}%)`
      ).join(', ')
    }));
  }

  async analyzePerformanceTrends(profile, performanceData) {
    const recentPerformance = profile.performanceHistory.slice(-100);
    
    return {
      trend: this.calculateTrend(recentPerformance),
      volatility: this.calculateVolatility(recentPerformance),
      patterns: await this.patternRecognizer.findPerformancePatterns(recentPerformance)
    };
  }

  calculateTrend(data) {
    if (data.length < 2) {return 'stable';}
    
    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + (d.score || 0), 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * (d.score || 0), 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.01) {return 'improving';}
    if (slope < -0.01) {return 'declining';}
    return 'stable';
  }

  calculateVolatility(data) {
    if (data.length < 2) {return 0;}
    
    const scores = data.map(d => d.score || 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  async identifyImprovements(trends) {
    const improvements = [];
    
    if (trends.trend === 'declining') {
      improvements.push({
        type: 'performance',
        priority: 'high',
        description: 'Performance declining - need behavior adjustment'
      });
    }
    
    if (trends.volatility > 0.3) {
      improvements.push({
        type: 'consistency',
        priority: 'medium',
        description: 'High volatility - need stability improvements'
      });
    }
    
    // Pattern-based improvements
    for (const pattern of trends.patterns) {
      if (pattern.type === 'recurring_failure') {
        improvements.push({
          type: 'pattern',
          priority: 'high',
          description: `Recurring failure pattern: ${pattern.description}`,
          pattern
        });
      }
    }
    
    return improvements;
  }

  async applyAdaptation(agentId, adaptation) {
    logger.debug(`Applying adaptation ${adaptation.type} to agent ${agentId}`);
    
    // Store adaptation in memory for persistence
    await this.memory.store({
      type: 'behavior_adaptation',
      agentId,
      adaptation,
      timestamp: Date.now()
    });
  }

  detectStatisticalAnomaly(behavior, statistics) {
    // Simple z-score based anomaly detection
    let totalZScore = 0;
    let count = 0;
    
    for (const [metric, value] of Object.entries(behavior.metrics || {})) {
      if (statistics.mean[metric] !== undefined) {
        const mean = statistics.mean[metric];
        const stdDev = statistics.stdDev[metric] || 1;
        const zScore = Math.abs((value - mean) / stdDev);
        
        totalZScore += zScore;
        count++;
      }
    }
    
    const avgZScore = count > 0 ? totalZScore / count : 0;
    
    return {
      score: Math.min(avgZScore / 3, 1), // Normalize to 0-1
      details: { avgZScore }
    };
  }

  explainAnomaly(patternAnomaly, statisticalAnomaly) {
    const explanations = [];
    
    if (patternAnomaly.score > 0.5) {
      explanations.push(`Unusual pattern detected: ${patternAnomaly.description}`);
    }
    
    if (statisticalAnomaly.score > 0.5) {
      explanations.push(`Statistical anomaly: ${statisticalAnomaly.details.avgZScore.toFixed(2)} standard deviations from normal`);
    }
    
    return explanations.join('; ');
  }

  analyzePerformanceMetrics(history) {
    if (history.length === 0) {
      return { summary: 'No performance data available' };
    }
    
    const recent = history.slice(-20);
    const scores = recent.map(h => h.score || 0);
    
    return {
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      trend: this.calculateTrend(recent),
      consistency: 1 - this.calculateVolatility(recent),
      recentScores: scores.slice(-5)
    };
  }

  async generateRecommendations(profile) {
    const recommendations = [];
    
    // Based on performance
    const performance = this.analyzePerformanceMetrics(profile.performanceHistory);
    
    if (performance.average < 0.6) {
      recommendations.push({
        type: 'training',
        priority: 'high',
        description: 'Consider additional training or behavior adjustments'
      });
    }
    
    if (performance.consistency < 0.7) {
      recommendations.push({
        type: 'stability',
        priority: 'medium',
        description: 'Focus on improving consistency'
      });
    }
    
    // Based on patterns
    if (profile.patterns.length < 10) {
      recommendations.push({
        type: 'experience',
        priority: 'low',
        description: 'More interactions needed to build comprehensive patterns'
      });
    }
    
    return recommendations;
  }

  shouldAdaptBehavior(profile) {
    // Adapt if performance is declining or highly variable
    const performance = this.analyzePerformanceMetrics(profile.performanceHistory);
    
    return performance.trend === 'declining' || 
           performance.consistency < 0.6 ||
           Date.now() - profile.lastAdaptation > 86400000; // 24 hours
  }

  getTotalTrainingDataSize() {
    let total = 0;
    for (const data of this.trainingData.values()) {
      total += data.length;
    }
    return total;
  }

  async loadModels() {
    try {
      // Load saved models from memory/storage
      const savedModels = await this.memory.retrieve({
        type: 'ml_models',
        limit: 10
      });
      
      for (const modelData of savedModels) {
        this.models.set(modelData.name, modelData.model);
      }
      
      logger.info(`🟢 Loaded ${savedModels.length} ML models`);
      
    } catch (error) {
      logger.warn('No saved models found, starting fresh');
    }
  }

  async saveModels() {
    for (const [name, model] of this.models) {
      await this.memory.store({
        type: 'ml_models',
        name,
        model,
        timestamp: Date.now()
      });
    }
  }
}

/**
 * Pattern Recognition Engine
 */
class PatternRecognitionEngine {
  constructor() {
    this.patterns = new Map();
    this.patternIndex = new Map();
  }

  async initialize() {
    logger.debug('Pattern recognition engine initialized');
  }

  async extractPatterns(context) {
    const patterns = [];
    
    // Sequential patterns
    const sequentialPatterns = this.findSequentialPatterns(context.actions);
    patterns.push(...sequentialPatterns);
    
    // Input-output patterns
    const ioPatterns = this.findIOPatterns(context.input, context.output);
    patterns.push(...ioPatterns);
    
    // Context patterns
    const contextPatterns = this.findContextPatterns(context);
    patterns.push(...contextPatterns);
    
    // Store patterns
    for (const pattern of patterns) {
      this.storePattern(pattern);
    }
    
    return patterns;
  }

  async predictFromPatterns(taskType, currentState, knownPatterns) {
    const predictions = [];
    
    for (const pattern of knownPatterns) {
      if (pattern.taskType === taskType) {
        const match = this.matchPattern(pattern, currentState);
        if (match.score > 0.7) {
          predictions.push({
            action: pattern.predictedAction,
            confidence: match.score,
            pattern: pattern.id
          });
        }
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  async detectAnomaly(behavior, knownPatterns) {
    let maxMatch = 0;
    let bestPattern = null;
    
    for (const pattern of knownPatterns) {
      const match = this.matchPattern(pattern, behavior);
      if (match.score > maxMatch) {
        maxMatch = match.score;
        bestPattern = pattern;
      }
    }
    
    const anomalyScore = 1 - maxMatch;
    
    return {
      score: anomalyScore,
      description: anomalyScore > 0.5 
        ? 'Behavior does not match known patterns' 
        : 'Behavior partially matches known patterns',
      closestPattern: bestPattern
    };
  }

  async transferPatterns(sourcePatterns, targetPatterns, filter) {
    const transferred = [...targetPatterns];
    
    for (const pattern of sourcePatterns) {
      if (!filter || filter(pattern)) {
        // Adapt pattern for target
        const adaptedPattern = {
          ...pattern,
          confidence: pattern.confidence * 0.8, // Reduce confidence for transfer
          source: 'transfer'
        };
        
        transferred.push(adaptedPattern);
      }
    }
    
    return transferred;
  }

  async train(trainingData) {
    const startTime = Date.now();
    let patternsLearned = 0;
    
    for (const data of trainingData) {
      const patterns = await this.extractPatterns(data.context);
      patternsLearned += patterns.length;
    }
    
    return {
      patternsLearned,
      trainingTime: Date.now() - startTime,
      totalPatterns: this.patterns.size
    };
  }

  async findPerformancePatterns(performanceHistory) {
    const patterns = [];
    
    // Look for recurring performance drops
    for (let i = 0; i < performanceHistory.length - 2; i++) {
      if (performanceHistory[i].score < 0.5 &&
          performanceHistory[i + 1].score < 0.5) {
        patterns.push({
          type: 'recurring_failure',
          description: 'Consecutive low performance scores',
          occurrences: [i, i + 1]
        });
      }
    }
    
    return patterns;
  }

  async getInsights(patterns) {
    return {
      totalPatterns: patterns.length,
      patternTypes: this.categorizePatterns(patterns),
      mostCommon: this.findMostCommonPatterns(patterns),
      complexity: this.calculatePatternComplexity(patterns)
    };
  }

  // Helper methods
  
  findSequentialPatterns(actions) {
    const patterns = [];
    
    // Look for repeated sequences
    for (let len = 2; len <= Math.min(actions.length, 5); len++) {
      for (let i = 0; i <= actions.length - len; i++) {
        const sequence = actions.slice(i, i + len);
        const sequenceStr = JSON.stringify(sequence);
        
        // Check if sequence repeats
        let count = 1;
        for (let j = i + len; j <= actions.length - len; j++) {
          const compareSeq = actions.slice(j, j + len);
          if (JSON.stringify(compareSeq) === sequenceStr) {
            count++;
          }
        }
        
        if (count >= 2) {
          patterns.push({
            type: 'sequential',
            sequence,
            count,
            confidence: count / (actions.length / len)
          });
        }
      }
    }
    
    return patterns;
  }

  findIOPatterns(input, output) {
    // Simple input-output mapping patterns
    return [{
      type: 'io_mapping',
      input: this.summarizeData(input),
      output: this.summarizeData(output),
      confidence: 0.8
    }];
  }

  findContextPatterns(context) {
    // Patterns based on context features
    return [{
      type: 'contextual',
      taskType: context.taskType,
      performance: context.performance,
      timestamp: context.timestamp,
      confidence: 0.7
    }];
  }

  storePattern(pattern) {
    const id = this.generatePatternId(pattern);
    pattern.id = id;
    
    this.patterns.set(id, pattern);
    
    // Index by type
    if (!this.patternIndex.has(pattern.type)) {
      this.patternIndex.set(pattern.type, new Set());
    }
    this.patternIndex.get(pattern.type).add(id);
  }

  matchPattern(pattern, state) {
    // Simple pattern matching logic
    let score = 0;
    let matches = 0;
    let total = 0;
    
    // Match based on pattern type
    if (pattern.type === 'sequential' && state.actions) {
      const stateStr = JSON.stringify(state.actions);
      const patternStr = JSON.stringify(pattern.sequence);
      if (stateStr.includes(patternStr)) {
        score = 1.0;
      }
    } else if (pattern.type === 'contextual') {
      if (pattern.taskType === state.taskType) {matches++;}
      total++;
      
      score = total > 0 ? matches / total : 0;
    }
    
    return { score, pattern: pattern.id };
  }

  summarizeData(data) {
    // Create a summary representation of data
    if (typeof data === 'string') {
      return { type: 'string', length: data.length };
    } else if (Array.isArray(data)) {
      return { type: 'array', length: data.length };
    } else if (typeof data === 'object') {
      return { type: 'object', keys: Object.keys(data).length };
    }
    return { type: typeof data };
  }

  generatePatternId(pattern) {
    return `pattern-${pattern.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  categorizePatterns(patterns) {
    const categories = {};
    
    for (const pattern of patterns) {
      if (!categories[pattern.type]) {
        categories[pattern.type] = 0;
      }
      categories[pattern.type]++;
    }
    
    return categories;
  }

  findMostCommonPatterns(patterns) {
    // Return top 5 most common patterns
    const frequency = new Map();
    
    for (const pattern of patterns) {
      const key = `${pattern.type}-${JSON.stringify(pattern.sequence || pattern.input)}`;
      frequency.set(key, (frequency.get(key) || 0) + 1);
    }
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ pattern: key, count }));
  }

  calculatePatternComplexity(patterns) {
    if (patterns.length === 0) {return 0;}
    
    let totalComplexity = 0;
    
    for (const pattern of patterns) {
      if (pattern.type === 'sequential') {
        totalComplexity += pattern.sequence.length;
      } else {
        totalComplexity += 1;
      }
    }
    
    return totalComplexity / patterns.length;
  }
}

/**
 * Adaptive Behavior System
 */
class AdaptiveBehaviorSystem {
  constructor() {
    this.behaviorModels = new Map();
    this.adaptations = new Map();
  }

  async initialize() {
    logger.debug('Adaptive behavior system initialized');
  }

  async updateFromInteraction(context) {
    const modelKey = `${context.agentId}-${context.taskType}`;
    
    let model = this.behaviorModels.get(modelKey);
    if (!model) {
      model = this.createBehaviorModel();
      this.behaviorModels.set(modelKey, model);
    }
    
    // Update model with new interaction
    model.interactions.push({
      state: context.input,
      actions: context.actions,
      outcome: context.output,
      performance: context.performance,
      timestamp: context.timestamp
    });
    
    // Keep only recent interactions
    if (model.interactions.length > 1000) {
      model.interactions = model.interactions.slice(-1000);
    }
    
    // Update statistics
    this.updateModelStatistics(model);
  }

  async predictActions(agentId, taskType, currentState) {
    const modelKey = `${agentId}-${taskType}`;
    const model = this.behaviorModels.get(modelKey);
    
    if (!model || model.interactions.length < 10) {
      return []; // Not enough data
    }
    
    // Find similar past states
    const similarStates = this.findSimilarStates(model, currentState);
    
    // Predict based on past successful actions
    const predictions = this.aggregateActionPredictions(similarStates);
    
    return predictions;
  }

  async generateAdaptations(agentId, improvements) {
    const adaptations = [];
    
    for (const improvement of improvements) {
      if (improvement.type === 'performance') {
        adaptations.push({
          type: 'parameter_adjustment',
          description: 'Adjust action selection parameters',
          adjustments: {
            explorationRate: 0.05, // Increase exploration
            confidenceThreshold: -0.1 // Lower threshold
          }
        });
      } else if (improvement.type === 'consistency') {
        adaptations.push({
          type: 'stabilization',
          description: 'Add action smoothing',
          adjustments: {
            actionSmoothing: 0.3,
            historyWeight: 0.7
          }
        });
      } else if (improvement.type === 'pattern') {
        adaptations.push({
          type: 'pattern_correction',
          description: `Address pattern: ${improvement.pattern.description}`,
          pattern: improvement.pattern,
          adjustments: {
            avoidActions: improvement.pattern.failureActions
          }
        });
      }
    }
    
    return adaptations;
  }

  async train(trainingData) {
    const startTime = Date.now();
    let modelsUpdated = 0;
    
    // Group by agent and task
    const grouped = this.groupTrainingData(trainingData);
    
    for (const [key, data] of grouped) {
      let model = this.behaviorModels.get(key);
      if (!model) {
        model = this.createBehaviorModel();
        this.behaviorModels.set(key, model);
      }
      
      // Train model
      await this.trainBehaviorModel(model, data);
      modelsUpdated++;
    }
    
    return {
      modelsUpdated,
      trainingTime: Date.now() - startTime,
      totalModels: this.behaviorModels.size
    };
  }

  async transferModels(sourceAgentId, targetAgentId, filter) {
    const transferred = {};
    
    for (const [key, model] of this.behaviorModels) {
      if (key.startsWith(sourceAgentId)) {
        const taskType = key.replace(`${sourceAgentId}-`, '');
        
        if (!filter || filter(taskType)) {
          const newKey = `${targetAgentId}-${taskType}`;
          
          // Create transferred model
          transferred[newKey] = {
            ...model,
            transferredFrom: sourceAgentId,
            transferConfidence: 0.7
          };
          
          this.behaviorModels.set(newKey, transferred[newKey]);
        }
      }
    }
    
    return transferred;
  }

  async getInsights(agentId) {
    const agentModels = [];
    
    for (const [key, model] of this.behaviorModels) {
      if (key.startsWith(agentId)) {
        agentModels.push({
          taskType: key.replace(`${agentId}-`, ''),
          interactionCount: model.interactions.length,
          performance: model.statistics.averagePerformance,
          lastUpdated: model.lastUpdated
        });
      }
    }
    
    return {
      modelCount: agentModels.length,
      models: agentModels,
      overallPerformance: this.calculateOverallPerformance(agentModels)
    };
  }

  // Helper methods
  
  createBehaviorModel() {
    return {
      interactions: [],
      statistics: {
        averagePerformance: 0,
        successRate: 0,
        actionFrequency: new Map()
      },
      lastUpdated: Date.now()
    };
  }

  updateModelStatistics(model) {
    const performances = model.interactions.map(i => i.performance?.score || 0);
    model.statistics.averagePerformance = 
      performances.reduce((a, b) => a + b, 0) / performances.length;
    
    const successes = performances.filter(p => p > 0.7).length;
    model.statistics.successRate = successes / performances.length;
    
    // Update action frequency
    model.statistics.actionFrequency.clear();
    for (const interaction of model.interactions) {
      for (const action of interaction.actions) {
        const key = JSON.stringify(action);
        model.statistics.actionFrequency.set(key,
          (model.statistics.actionFrequency.get(key) || 0) + 1
        );
      }
    }
    
    model.lastUpdated = Date.now();
  }

  findSimilarStates(model, currentState) {
    const similar = [];
    
    for (const interaction of model.interactions) {
      const similarity = this.calculateStateSimilarity(
        interaction.state, 
        currentState
      );
      
      if (similarity > 0.7) {
        similar.push({
          ...interaction,
          similarity
        });
      }
    }
    
    // Sort by similarity and performance
    return similar.sort((a, b) => 
      (b.similarity * b.performance.score) - (a.similarity * a.performance.score)
    );
  }

  calculateStateSimilarity(state1, state2) {
    // Simple similarity calculation
    const str1 = JSON.stringify(state1);
    const str2 = JSON.stringify(state2);
    
    if (str1 === str2) {return 1.0;}
    
    // Calculate based on common properties
    if (typeof state1 === 'object' && typeof state2 === 'object') {
      const keys1 = Object.keys(state1);
      const keys2 = Object.keys(state2);
      const commonKeys = keys1.filter(k => keys2.includes(k));
      
      return commonKeys.length / Math.max(keys1.length, keys2.length);
    }
    
    return 0;
  }

  aggregateActionPredictions(similarStates) {
    const actionScores = new Map();
    
    for (const state of similarStates.slice(0, 10)) { // Top 10 most similar
      for (const action of state.actions) {
        const key = JSON.stringify(action);
        
        if (!actionScores.has(key)) {
          actionScores.set(key, {
            action,
            score: 0,
            count: 0
          });
        }
        
        const entry = actionScores.get(key);
        entry.score += state.similarity * state.performance.score;
        entry.count++;
      }
    }
    
    // Convert to predictions
    return Array.from(actionScores.values())
      .map(entry => ({
        action: entry.action,
        confidence: entry.score / entry.count
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 predictions
  }

  groupTrainingData(trainingData) {
    const grouped = new Map();
    
    for (const data of trainingData) {
      const key = `${data.agentId}-${data.taskType}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key).push(data);
    }
    
    return grouped;
  }

  async trainBehaviorModel(model, trainingData) {
    // Add new training data to model
    for (const data of trainingData) {
      model.interactions.push({
        state: data.state,
        actions: data.actions,
        outcome: data.result,
        performance: { score: data.reward || 0.5 },
        timestamp: Date.now()
      });
    }
    
    // Update statistics
    this.updateModelStatistics(model);
  }

  calculateOverallPerformance(agentModels) {
    if (agentModels.length === 0) {return 0;}
    
    const totalPerformance = agentModels.reduce((sum, model) => sum + model.performance, 
      0
    );
    
    return totalPerformance / agentModels.length;
  }
}

/**
 * Reinforcement Learning Engine
 */
class ReinforcementLearningEngine {
  constructor() {
    this.qTables = new Map();
    this.experienceReplay = new Map();
    this.config = {
      alpha: 0.1, // Learning rate
      gamma: 0.9, // Discount factor
      epsilon: 0.1 // Exploration rate
    };
  }

  async initialize() {
    logger.debug('Reinforcement learning engine initialized');
  }

  async updateFromFeedback(context) {
    const { agentId, input: state, actions, feedback, output: nextState } = context;
    
    // Get Q-table for agent
    let qTable = this.qTables.get(agentId);
    if (!qTable) {
      qTable = new Map();
      this.qTables.set(agentId, qTable);
    }
    
    // Update Q-values
    for (const action of actions) {
      const reward = feedback.score || 0;
      const stateKey = this.getStateKey(state);
      const actionKey = this.getActionKey(action);
      const nextStateKey = this.getStateKey(nextState);
      
      // Get current Q-value
      const currentQ = this.getQValue(qTable, stateKey, actionKey);
      
      // Get max Q-value for next state
      const maxNextQ = this.getMaxQValue(qTable, nextStateKey);
      
      // Update Q-value using Q-learning formula
      const newQ = currentQ + this.config.alpha * 
        (reward + this.config.gamma * maxNextQ - currentQ);
      
      this.setQValue(qTable, stateKey, actionKey, newQ);
    }
    
    // Store in experience replay
    this.addExperience(agentId, {
      state,
      actions,
      reward: feedback.score,
      nextState,
      timestamp: Date.now()
    });
  }

  async selectActions(state, availableActions, profile) {
    const qTable = this.qTables.get(profile.agentId);
    if (!qTable) {
      return []; // No Q-table yet
    }
    
    const stateKey = this.getStateKey(state);
    const predictions = [];
    
    // Epsilon-greedy action selection
    if (Math.random() < this.config.epsilon) {
      // Exploration: random action
      const randomAction = availableActions[
        Math.floor(Math.random() * availableActions.length)
      ];
      
      predictions.push({
        action: randomAction,
        confidence: this.config.epsilon
      });
    } else {
      // Exploitation: best known action
      for (const action of availableActions) {
        const actionKey = this.getActionKey(action);
        const qValue = this.getQValue(qTable, stateKey, actionKey);
        
        if (qValue > 0) {
          predictions.push({
            action,
            confidence: this.normalizeQValue(qValue)
          });
        }
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  async transferKnowledge(sourceModel, targetModel, transferRate) {
    const sourceQTable = this.qTables.get(sourceModel.agentId);
    if (!sourceQTable) {return;}
    
    let targetQTable = this.qTables.get(targetModel.agentId);
    if (!targetQTable) {
      targetQTable = new Map();
      this.qTables.set(targetModel.agentId, targetQTable);
    }
    
    // Transfer Q-values with reduced weight
    for (const [stateAction, qValue] of sourceQTable) {
      const currentQ = targetQTable.get(stateAction) || 0;
      const transferredQ = currentQ * (1 - transferRate) + qValue * transferRate;
      targetQTable.set(stateAction, transferredQ);
    }
  }

  async train(trainingData) {
    const startTime = Date.now();
    let updates = 0;
    
    // Batch experience replay
    for (const data of trainingData) {
      await this.updateFromFeedback({
        agentId: data.agentId || 'default',
        input: data.state,
        actions: [data.action],
        feedback: { score: data.reward },
        output: data.nextState
      });
      
      updates++;
    }
    
    return {
      updates,
      trainingTime: Date.now() - startTime,
      qTableSizes: this.getQTableSizes()
    };
  }

  // Helper methods
  
  getStateKey(state) {
    // Create a simplified state representation
    if (typeof state === 'string') {
      return state.substring(0, 50);
    }
    return JSON.stringify(state).substring(0, 50);
  }

  getActionKey(action) {
    // Create a simplified action representation
    if (typeof action === 'string') {
      return action;
    }
    return JSON.stringify(action).substring(0, 30);
  }

  getQValue(qTable, stateKey, actionKey) {
    const key = `${stateKey}|${actionKey}`;
    return qTable.get(key) || 0;
  }

  setQValue(qTable, stateKey, actionKey, value) {
    const key = `${stateKey}|${actionKey}`;
    qTable.set(key, value);
  }

  getMaxQValue(qTable, stateKey) {
    let maxQ = 0;
    
    for (const [key, value] of qTable) {
      if (key.startsWith(stateKey + '|')) {
        maxQ = Math.max(maxQ, value);
      }
    }
    
    return maxQ;
  }

  normalizeQValue(qValue) {
    // Normalize Q-value to 0-1 range
    return Math.max(0, Math.min(1, qValue));
  }

  addExperience(agentId, experience) {
    if (!this.experienceReplay.has(agentId)) {
      this.experienceReplay.set(agentId, []);
    }
    
    const experiences = this.experienceReplay.get(agentId);
    experiences.push(experience);
    
    // Keep only recent experiences
    if (experiences.length > 10000) {
      experiences.shift();
    }
  }

  getQTableSizes() {
    const sizes = {};
    
    for (const [agentId, qTable] of this.qTables) {
      sizes[agentId] = qTable.size;
    }
    
    return sizes;
  }
}

// Model type enum
const ModelType = {
  CLASSIFICATION: 'classification',
  REGRESSION: 'regression',
  CLUSTERING: 'clustering',
  REINFORCEMENT: 'reinforcement',
  DEEP_LEARNING: 'deep_learning',
  ENSEMBLE: 'ensemble'
};

// Learning strategy enum
const LearningStrategy = {
  SUPERVISED: 'supervised',
  UNSUPERVISED: 'unsupervised',
  SEMI_SUPERVISED: 'semi_supervised',
  REINFORCEMENT: 'reinforcement',
  TRANSFER: 'transfer',
  ONLINE: 'online'
};

module.exports = { 
  MLLearningSystem: BumbaMLLearningSystem, // Add expected alias
  BumbaMLLearningSystem,
  PatternRecognitionEngine,
  AdaptiveBehaviorSystem,
  ReinforcementLearningEngine,
  ModelType,
  LearningStrategy
};