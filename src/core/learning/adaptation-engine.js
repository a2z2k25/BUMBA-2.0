/**
 * BUMBA Adaptation Engine
 * Dynamic behavior adaptation based on learned patterns
 * Part of Human Learning Module Enhancement - Sprint 2
 * 
 * FRAMEWORK DESIGN:
 * - Reinforcement learning for adaptations
 * - A/B testing for improvements
 * - Contextual bandits for exploration
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Adaptation Engine for dynamic behavior modification
 */
class AdaptationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      explorationRate: config.explorationRate || 0.1,
      discountFactor: config.discountFactor || 0.95,
      learningRate: config.learningRate || 0.01,
      batchSize: config.batchSize || 32,
      memorySize: config.memorySize || 1000,
      updateFrequency: config.updateFrequency || 100,
      minExperiences: config.minExperiences || 50,
      ...config
    };
    
    // Adaptation strategies
    this.strategies = new Map();
    this.activeAdaptations = new Map();
    this.pendingAdaptations = [];
    
    // Reinforcement learning components
    this.qTable = new Map();
    this.replayMemory = [];
    this.episodeRewards = [];
    
    // A/B testing
    this.experiments = new Map();
    this.experimentResults = new Map();
    
    // Contextual bandits
    this.bandits = new Map();
    this.armStatistics = new Map();
    
    // Metrics
    this.metrics = {
      adaptationsApplied: 0,
      successRate: 0,
      averageReward: 0,
      explorationRatio: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize adaptation engine
   */
  async initialize() {
    try {
      // Initialize default strategies
      this.initializeStrategies();
      
      // Initialize bandits
      this.initializeBandits();
      
      // Start adaptation loop
      this.startAdaptationLoop();
      
      logger.info('🔄 Adaptation Engine initialized');
      
      this.emit('initialized', {
        strategies: this.strategies.size,
        bandits: this.bandits.size
      });
      
    } catch (error) {
      logger.error('Failed to initialize Adaptation Engine:', error);
    }
  }
  
  /**
   * Initialize adaptation strategies
   */
  initializeStrategies() {
    // Response style adaptations
    this.strategies.set('response-style', {
      options: ['concise', 'detailed', 'balanced'],
      weights: [0.33, 0.33, 0.34],
      rewards: [0, 0, 0]
    });
    
    // Code generation adaptations
    this.strategies.set('code-style', {
      options: ['functional', 'object-oriented', 'hybrid'],
      weights: [0.33, 0.33, 0.34],
      rewards: [0, 0, 0]
    });
    
    // Assistance level adaptations
    this.strategies.set('assistance-level', {
      options: ['minimal', 'moderate', 'comprehensive'],
      weights: [0.33, 0.33, 0.34],
      rewards: [0, 0, 0]
    });
    
    // Learning pace adaptations
    this.strategies.set('learning-pace', {
      options: ['slow', 'normal', 'fast'],
      weights: [0.33, 0.33, 0.34],
      rewards: [0, 0, 0]
    });
  }
  
  /**
   * Initialize contextual bandits
   */
  initializeBandits() {
    // Thompson Sampling bandit
    this.bandits.set('thompson', new ThompsonSampling());
    
    // UCB (Upper Confidence Bound) bandit
    this.bandits.set('ucb', new UCBBandit());
    
    // Epsilon-Greedy bandit
    this.bandits.set('epsilon-greedy', new EpsilonGreedy(this.config.explorationRate));
  }
  
  /**
   * Generate adaptation based on context
   */
  async generateAdaptation(context, predictions) {
    try {
      // Get current state
      const state = this.encodeState(context);
      
      // Select action using policy
      const action = await this.selectAction(state, predictions);
      
      // Create adaptation
      const adaptation = {
        id: `adapt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        state,
        action,
        context,
        predictions,
        confidence: this.calculateConfidence(state, action),
        type: this.determineAdaptationType(action),
        parameters: this.generateParameters(action, context),
        expectedReward: this.estimateReward(state, action)
      };
      
      // Store pending adaptation
      this.pendingAdaptations.push(adaptation);
      
      this.emit('adaptation-generated', adaptation);
      
      return adaptation;
      
    } catch (error) {
      logger.error('Failed to generate adaptation:', error);
      return null;
    }
  }
  
  /**
   * Apply adaptation
   */
  async applyAdaptation(adaptation) {
    try {
      // Execute adaptation
      const result = await this.executeAdaptation(adaptation);
      
      // Track active adaptation
      this.activeAdaptations.set(adaptation.id, {
        ...adaptation,
        appliedAt: Date.now(),
        result
      });
      
      // Remove from pending
      this.pendingAdaptations = this.pendingAdaptations.filter(
        a => a.id !== adaptation.id
      );
      
      // Update metrics
      this.metrics.adaptationsApplied++;
      
      this.emit('adaptation-applied', {
        adaptation,
        result
      });
      
      logger.info(`🏁 Applied adaptation: ${adaptation.type}`);
      
      return result;
      
    } catch (error) {
      logger.error('Failed to apply adaptation:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Execute adaptation
   */
  async executeAdaptation(adaptation) {
    const { type, parameters } = adaptation;
    
    switch (type) {
      case 'response-style':
        return this.adaptResponseStyle(parameters);
        
      case 'code-style':
        return this.adaptCodeStyle(parameters);
        
      case 'assistance-level':
        return this.adaptAssistanceLevel(parameters);
        
      case 'learning-pace':
        return this.adaptLearningPace(parameters);
        
      default:
        return this.adaptGeneric(parameters);
    }
  }
  
  /**
   * Provide feedback on adaptation
   */
  async provideFeedback(adaptationId, feedback) {
    const adaptation = this.activeAdaptations.get(adaptationId);
    
    if (!adaptation) {
      logger.warn(`Adaptation ${adaptationId} not found`);
      return;
    }
    
    // Calculate reward
    const reward = this.calculateReward(feedback);
    
    // Update Q-table
    this.updateQValue(adaptation.state, adaptation.action, reward);
    
    // Store experience
    this.storeExperience({
      state: adaptation.state,
      action: adaptation.action,
      reward,
      nextState: this.encodeState(feedback.context),
      done: feedback.done || false
    });
    
    // Update strategy weights
    this.updateStrategyWeights(adaptation.type, adaptation.action, reward);
    
    // Update bandit arms
    this.updateBanditArms(adaptation.action, reward);
    
    // Update metrics
    this.updateMetrics(reward);
    
    this.emit('feedback-processed', {
      adaptationId,
      reward,
      feedback
    });
  }
  
  /**
   * Select action using policy
   */
  async selectAction(state, predictions) {
    // Epsilon-greedy exploration
    if (Math.random() < this.config.explorationRate) {
      // Explore: random action
      return this.selectRandomAction();
    } else {
      // Exploit: best action based on Q-values or predictions
      return this.selectBestAction(state, predictions);
    }
  }
  
  /**
   * Select best action
   */
  selectBestAction(state, predictions) {
    const stateKey = this.getStateKey(state);
    const qValues = this.qTable.get(stateKey) || new Map();
    
    if (qValues.size === 0) {
      // No experience, use predictions
      return this.selectActionFromPredictions(predictions);
    }
    
    // Select action with highest Q-value
    let bestAction = null;
    let bestValue = -Infinity;
    
    for (const [action, value] of qValues) {
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }
    
    return bestAction || this.selectRandomAction();
  }
  
  /**
   * Select random action
   */
  selectRandomAction() {
    const strategies = Array.from(this.strategies.keys());
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const options = this.strategies.get(strategy).options;
    const option = options[Math.floor(Math.random() * options.length)];
    
    return {
      strategy,
      option
    };
  }
  
  /**
   * Select action from predictions
   */
  selectActionFromPredictions(predictions) {
    if (!predictions || !predictions.nextAction) {
      return this.selectRandomAction();
    }
    
    // Map prediction to action
    const actionMap = {
      'code_generation': { strategy: 'code-style', option: 'functional' },
      'debugging': { strategy: 'assistance-level', option: 'comprehensive' },
      'learning': { strategy: 'learning-pace', option: 'slow' },
      'optimization': { strategy: 'response-style', option: 'concise' }
    };
    
    return actionMap[predictions.nextAction.type] || this.selectRandomAction();
  }
  
  /**
   * Update Q-value
   */
  updateQValue(state, action, reward) {
    const stateKey = this.getStateKey(state);
    const actionKey = this.getActionKey(action);
    
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map());
    }
    
    const stateQValues = this.qTable.get(stateKey);
    const currentQ = stateQValues.get(actionKey) || 0;
    
    // Q-learning update rule
    const maxNextQ = this.getMaxQValue(state) || 0;
    const newQ = currentQ + this.config.learningRate * 
                 (reward + this.config.discountFactor * maxNextQ - currentQ);
    
    stateQValues.set(actionKey, newQ);
  }
  
  /**
   * Get maximum Q-value for a state
   */
  getMaxQValue(state) {
    const stateKey = this.getStateKey(state);
    const qValues = this.qTable.get(stateKey);
    
    if (!qValues || qValues.size === 0) {
      return 0;
    }
    
    return Math.max(...qValues.values());
  }
  
  /**
   * Store experience in replay memory
   */
  storeExperience(experience) {
    this.replayMemory.push(experience);
    
    // Maintain memory size
    if (this.replayMemory.length > this.config.memorySize) {
      this.replayMemory.shift();
    }
  }
  
  /**
   * Experience replay for learning
   */
  async experienceReplay() {
    if (this.replayMemory.length < this.config.minExperiences) {
      return;
    }
    
    // Sample batch from memory
    const batch = this.sampleBatch(this.config.batchSize);
    
    // Update Q-values for batch
    for (const experience of batch) {
      const { state, action, reward, nextState, done } = experience;
      
      let targetReward = reward;
      if (!done) {
        targetReward += this.config.discountFactor * this.getMaxQValue(nextState);
      }
      
      this.updateQValue(state, action, targetReward);
    }
  }
  
  /**
   * Sample batch from replay memory
   */
  sampleBatch(batchSize) {
    const batch = [];
    const indices = new Set();
    
    while (batch.length < batchSize && batch.length < this.replayMemory.length) {
      const index = Math.floor(Math.random() * this.replayMemory.length);
      
      if (!indices.has(index)) {
        indices.add(index);
        batch.push(this.replayMemory[index]);
      }
    }
    
    return batch;
  }
  
  /**
   * Run A/B test
   */
  async runABTest(name, variants, duration = 3600000) {
    const experiment = {
      id: `exp-${Date.now()}`,
      name,
      variants,
      startTime: Date.now(),
      duration,
      results: new Map()
    };
    
    // Initialize variant results
    variants.forEach(variant => {
      experiment.results.set(variant.id, {
        impressions: 0,
        conversions: 0,
        rewards: []
      });
    });
    
    this.experiments.set(experiment.id, experiment);
    
    // Schedule experiment end
    setTimeout(() => {
      this.concludeExperiment(experiment.id);
    }, duration);
    
    this.emit('experiment-started', experiment);
    
    return experiment.id;
  }
  
  /**
   * Track A/B test result
   */
  trackABResult(experimentId, variantId, result) {
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      return;
    }
    
    const variantResults = experiment.results.get(variantId);
    
    if (variantResults) {
      variantResults.impressions++;
      
      if (result.converted) {
        variantResults.conversions++;
      }
      
      if (result.reward !== undefined) {
        variantResults.rewards.push(result.reward);
      }
    }
  }
  
  /**
   * Conclude A/B test
   */
  concludeExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      return;
    }
    
    // Calculate statistics
    const results = {};
    let bestVariant = null;
    let bestConversionRate = 0;
    
    for (const [variantId, data] of experiment.results) {
      const conversionRate = data.impressions > 0 ? 
        data.conversions / data.impressions : 0;
      
      const avgReward = data.rewards.length > 0 ?
        data.rewards.reduce((a, b) => a + b, 0) / data.rewards.length : 0;
      
      results[variantId] = {
        conversionRate,
        avgReward,
        impressions: data.impressions
      };
      
      if (conversionRate > bestConversionRate) {
        bestConversionRate = conversionRate;
        bestVariant = variantId;
      }
    }
    
    // Store results
    this.experimentResults.set(experimentId, {
      ...experiment,
      results,
      winner: bestVariant,
      endTime: Date.now()
    });
    
    // Remove active experiment
    this.experiments.delete(experimentId);
    
    this.emit('experiment-concluded', {
      experimentId,
      results,
      winner: bestVariant
    });
    
    logger.info(`A/B test concluded: ${experiment.name}, winner: ${bestVariant}`);
  }
  
  /**
   * Update strategy weights based on rewards
   */
  updateStrategyWeights(strategyName, action, reward) {
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      return;
    }
    
    const optionIndex = strategy.options.indexOf(action.option);
    
    if (optionIndex >= 0) {
      // Update reward history
      strategy.rewards[optionIndex] = 
        strategy.rewards[optionIndex] * 0.9 + reward * 0.1;
      
      // Update weights using softmax
      const expRewards = strategy.rewards.map(r => Math.exp(r));
      const sumExp = expRewards.reduce((a, b) => a + b, 0);
      
      strategy.weights = expRewards.map(exp => exp / sumExp);
    }
  }
  
  /**
   * Update bandit arms
   */
  updateBanditArms(action, reward) {
    const armKey = this.getActionKey(action);
    
    // Update arm statistics
    const stats = this.armStatistics.get(armKey) || {
      pulls: 0,
      rewards: [],
      avgReward: 0
    };
    
    stats.pulls++;
    stats.rewards.push(reward);
    
    if (stats.rewards.length > 100) {
      stats.rewards.shift();
    }
    
    stats.avgReward = stats.rewards.reduce((a, b) => a + b, 0) / stats.rewards.length;
    
    this.armStatistics.set(armKey, stats);
    
    // Update bandits
    for (const bandit of this.bandits.values()) {
      bandit.update(armKey, reward);
    }
  }
  
  /**
   * Start adaptation loop
   */
  startAdaptationLoop() {
    setInterval(async () => {
      // Experience replay
      if (this.replayMemory.length >= this.config.minExperiences) {
        await this.experienceReplay();
      }
      
      // Clean old adaptations
      this.cleanOldAdaptations();
      
      // Update exploration rate
      this.updateExplorationRate();
      
    }, this.config.updateFrequency);
  }
  
  // Helper methods
  
  encodeState(context) {
    return {
      frustration: context.frustration || 0,
      engagement: context.engagement || 1,
      complexity: context.complexity || 0.5,
      timeOfDay: new Date().getHours() / 24,
      sessionDuration: context.sessionDuration || 0
    };
  }
  
  getStateKey(state) {
    return Object.values(state).map(v => Math.round(v * 10)).join('-');
  }
  
  getActionKey(action) {
    return `${action.strategy}:${action.option}`;
  }
  
  calculateConfidence(state, action) {
    const stateKey = this.getStateKey(state);
    const actionKey = this.getActionKey(action);
    const qValues = this.qTable.get(stateKey);
    
    if (!qValues || !qValues.has(actionKey)) {
      return 0.5; // Default confidence
    }
    
    const qValue = qValues.get(actionKey);
    const maxQ = this.getMaxQValue(state);
    
    return maxQ > 0 ? qValue / maxQ : 0.5;
  }
  
  determineAdaptationType(action) {
    return action.strategy;
  }
  
  generateParameters(action, context) {
    return {
      strategy: action.strategy,
      option: action.option,
      context,
      timestamp: Date.now()
    };
  }
  
  estimateReward(state, action) {
    const stateKey = this.getStateKey(state);
    const actionKey = this.getActionKey(action);
    const qValues = this.qTable.get(stateKey);
    
    if (qValues && qValues.has(actionKey)) {
      return qValues.get(actionKey);
    }
    
    // Use arm statistics if available
    const armStats = this.armStatistics.get(actionKey);
    if (armStats) {
      return armStats.avgReward;
    }
    
    return 0;
  }
  
  calculateReward(feedback) {
    let reward = 0;
    
    // Positive signals
    if (feedback.success) reward += 1;
    if (feedback.userSatisfied) reward += 2;
    if (feedback.taskCompleted) reward += 3;
    if (feedback.timeReduced) reward += 1;
    
    // Negative signals
    if (feedback.error) reward -= 2;
    if (feedback.userFrustrated) reward -= 3;
    if (feedback.abandoned) reward -= 5;
    
    // Normalize to [-1, 1]
    return Math.max(-1, Math.min(1, reward / 5));
  }
  
  updateMetrics(reward) {
    this.episodeRewards.push(reward);
    
    if (this.episodeRewards.length > 100) {
      this.episodeRewards.shift();
    }
    
    this.metrics.averageReward = 
      this.episodeRewards.reduce((a, b) => a + b, 0) / this.episodeRewards.length;
    
    this.metrics.successRate = 
      this.episodeRewards.filter(r => r > 0).length / this.episodeRewards.length;
    
    this.metrics.explorationRatio = this.config.explorationRate;
  }
  
  cleanOldAdaptations() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [id, adaptation] of this.activeAdaptations) {
      if (now - adaptation.appliedAt > maxAge) {
        this.activeAdaptations.delete(id);
      }
    }
  }
  
  updateExplorationRate() {
    // Decay exploration rate over time
    this.config.explorationRate *= 0.999;
    this.config.explorationRate = Math.max(0.01, this.config.explorationRate);
  }
  
  // Adaptation methods
  
  async adaptResponseStyle(parameters) {
    return {
      success: true,
      style: parameters.option,
      message: `Response style adapted to: ${parameters.option}`
    };
  }
  
  async adaptCodeStyle(parameters) {
    return {
      success: true,
      style: parameters.option,
      message: `Code style adapted to: ${parameters.option}`
    };
  }
  
  async adaptAssistanceLevel(parameters) {
    return {
      success: true,
      level: parameters.option,
      message: `Assistance level adapted to: ${parameters.option}`
    };
  }
  
  async adaptLearningPace(parameters) {
    return {
      success: true,
      pace: parameters.option,
      message: `Learning pace adapted to: ${parameters.option}`
    };
  }
  
  async adaptGeneric(parameters) {
    return {
      success: true,
      parameters,
      message: 'Generic adaptation applied'
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      qTableSize: this.qTable.size,
      replayMemorySize: this.replayMemory.length,
      activeAdaptations: this.activeAdaptations.size,
      pendingAdaptations: this.pendingAdaptations.length,
      experiments: this.experiments.size
    };
  }
}

/**
 * Thompson Sampling bandit
 */
class ThompsonSampling {
  constructor() {
    this.arms = new Map();
  }
  
  selectArm(arms) {
    let bestArm = null;
    let bestSample = -Infinity;
    
    for (const arm of arms) {
      const stats = this.arms.get(arm) || { alpha: 1, beta: 1 };
      const sample = this.betaSample(stats.alpha, stats.beta);
      
      if (sample > bestSample) {
        bestSample = sample;
        bestArm = arm;
      }
    }
    
    return bestArm;
  }
  
  update(arm, reward) {
    const stats = this.arms.get(arm) || { alpha: 1, beta: 1 };
    
    if (reward > 0) {
      stats.alpha += reward;
    } else {
      stats.beta += 1 - reward;
    }
    
    this.arms.set(arm, stats);
  }
  
  betaSample(alpha, beta) {
    // Simplified beta distribution sampling
    const x = Math.random();
    return Math.pow(x, 1 / alpha) / (Math.pow(x, 1 / alpha) + Math.pow(1 - x, 1 / beta));
  }
}

/**
 * UCB (Upper Confidence Bound) bandit
 */
class UCBBandit {
  constructor(c = 2) {
    this.c = c;
    this.arms = new Map();
    this.totalPulls = 0;
  }
  
  selectArm(arms) {
    let bestArm = null;
    let bestUCB = -Infinity;
    
    for (const arm of arms) {
      const stats = this.arms.get(arm) || { pulls: 0, avgReward: 0 };
      
      if (stats.pulls === 0) {
        return arm; // Explore unpulled arms first
      }
      
      const ucb = stats.avgReward + 
                  this.c * Math.sqrt(Math.log(this.totalPulls) / stats.pulls);
      
      if (ucb > bestUCB) {
        bestUCB = ucb;
        bestArm = arm;
      }
    }
    
    return bestArm;
  }
  
  update(arm, reward) {
    const stats = this.arms.get(arm) || { pulls: 0, avgReward: 0, totalReward: 0 };
    
    stats.pulls++;
    stats.totalReward += reward;
    stats.avgReward = stats.totalReward / stats.pulls;
    
    this.arms.set(arm, stats);
    this.totalPulls++;
  }
}

/**
 * Epsilon-Greedy bandit
 */
class EpsilonGreedy {
  constructor(epsilon = 0.1) {
    this.epsilon = epsilon;
    this.arms = new Map();
  }
  
  selectArm(arms) {
    if (Math.random() < this.epsilon) {
      // Explore: random arm
      return arms[Math.floor(Math.random() * arms.length)];
    } else {
      // Exploit: best arm
      let bestArm = null;
      let bestReward = -Infinity;
      
      for (const arm of arms) {
        const stats = this.arms.get(arm) || { avgReward: 0 };
        
        if (stats.avgReward > bestReward) {
          bestReward = stats.avgReward;
          bestArm = arm;
        }
      }
      
      return bestArm || arms[0];
    }
  }
  
  update(arm, reward) {
    const stats = this.arms.get(arm) || { pulls: 0, avgReward: 0, totalReward: 0 };
    
    stats.pulls++;
    stats.totalReward += reward;
    stats.avgReward = stats.totalReward / stats.pulls;
    
    this.arms.set(arm, stats);
  }
}

module.exports = AdaptationEngine;