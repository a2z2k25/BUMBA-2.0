/**
 * BUMBA Behavior Predictor
 * Predicts user actions and preferences using sequence learning
 * Part of Human Learning Module Enhancement - Sprint 2
 * 
 * FRAMEWORK DESIGN:
 * - LSTM/RNN for sequence prediction when available
 * - Markov chains and statistical models as fallback
 * - Real-time prediction updates
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

// Check for ML library availability
let tf = null;
try {
  tf = require('@tensorflow/tfjs-node');
  logger.info('🔮 TensorFlow.js connected for behavior prediction');
} catch (error) {
  logger.info('📊 Using statistical behavior prediction');
}

/**
 * Behavior Predictor for anticipating user actions
 */
class BehaviorPredictor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      sequenceLength: config.sequenceLength || 10,
      predictionHorizon: config.predictionHorizon || 3,
      minConfidence: config.minConfidence || 0.6,
      learningRate: config.learningRate || 0.001,
      updateInterval: config.updateInterval || 1000,
      maxHistorySize: config.maxHistorySize || 1000,
      ...config
    };
    
    // Prediction models
    this.models = {
      action: null,      // Action sequence predictor
      preference: null,  // Preference evolution predictor
      timing: null,      // Timing pattern predictor
      context: null      // Context transition predictor
    };
    
    // Behavior history
    this.behaviorHistory = [];
    this.sequenceBuffer = [];
    this.predictions = new Map();
    
    // Statistical models (fallback)
    this.markovChain = new Map();
    this.transitionMatrix = {};
    this.frequencyTable = new Map();
    
    // Metrics
    this.metrics = {
      predictions: 0,
      accuracy: 0,
      confidence: 0,
      hitRate: 0
    };
    
    this.mode = tf ? 'lstm' : 'statistical';
    this.initialize();
  }
  
  /**
   * Initialize behavior predictor
   */
  async initialize() {
    try {
      if (this.mode === 'lstm') {
        await this.createLSTMModels();
      } else {
        await this.createStatisticalModels();
      }
      
      // Start prediction loop
      this.startPredictionLoop();
      
      logger.info(`🟡 Behavior Predictor initialized (${this.mode} mode)`);
      
      this.emit('initialized', {
        mode: this.mode,
        models: Object.keys(this.models)
      });
      
    } catch (error) {
      logger.error('Failed to initialize Behavior Predictor:', error);
    }
  }
  
  /**
   * Create LSTM models for sequence prediction
   */
  async createLSTMModels() {
    if (!tf) {
      return this.createStatisticalModels();
    }
    
    // Action sequence predictor
    this.models.action = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: [this.config.sequenceLength, 64]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 10,
          activation: 'softmax'
        })
      ]
    });
    
    this.models.action.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    // Preference evolution predictor
    this.models.preference = tf.sequential({
      layers: [
        tf.layers.gru({
          units: 64,
          returnSequences: false,
          inputShape: [this.config.sequenceLength, 32]
        }),
        tf.layers.dense({
          units: 32,
          activation: 'tanh'
        }),
        tf.layers.dense({
          units: 16,
          activation: 'sigmoid'
        })
      ]
    });
    
    this.models.preference.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'meanSquaredError'
    });
    
    logger.info('LSTM models created for behavior prediction');
  }
  
  /**
   * Create statistical models (fallback)
   */
  async createStatisticalModels() {
    // Initialize Markov chain
    this.markovChain = new Map();
    
    // Initialize transition matrix
    this.transitionMatrix = {};
    
    // Initialize frequency table
    this.frequencyTable = new Map();
    
    // Create simple predictive models
    this.models.action = {
      predict: (sequence) => this.predictWithMarkov(sequence, 'action')
    };
    
    this.models.preference = {
      predict: (sequence) => this.predictWithStatistics(sequence, 'preference')
    };
    
    this.models.timing = {
      predict: (sequence) => this.predictTiming(sequence)
    };
    
    this.models.context = {
      predict: (sequence) => this.predictContextTransition(sequence)
    };
    
    logger.info('Statistical models created for behavior prediction');
  }
  
  /**
   * Predict next user behavior
   */
  async predictBehavior(currentContext, history = null) {
    const startTime = Date.now();
    
    try {
      // Use provided history or internal buffer
      const sequence = history || this.getRecentSequence();
      
      // Prepare sequence data
      const sequenceData = this.prepareSequenceData(sequence, currentContext);
      
      // Generate predictions for each aspect
      const predictions = {
        nextAction: await this.predictNextAction(sequenceData),
        preferences: await this.predictPreferenceEvolution(sequenceData),
        timing: await this.predictNextTiming(sequenceData),
        context: await this.predictContextChange(sequenceData),
        confidence: 0,
        metadata: {
          mode: this.mode,
          sequenceLength: sequence.length,
          processingTime: 0
        }
      };
      
      // Calculate overall confidence
      predictions.confidence = this.calculateOverallConfidence(predictions);
      
      // Store prediction for validation
      this.storePrediction(predictions);
      
      // Update metrics
      predictions.metadata.processingTime = Date.now() - startTime;
      this.updateMetrics(predictions);
      
      this.emit('behavior-predicted', predictions);
      
      logger.info(`🔮 Behavior predicted: ${predictions.nextAction.type} (${(predictions.confidence * 100).toFixed(1)}% confidence)`);
      
      return predictions;
      
    } catch (error) {
      logger.error('Failed to predict behavior:', error);
      return this.getDefaultPrediction();
    }
  }
  
  /**
   * Predict next action
   */
  async predictNextAction(sequenceData) {
    if (this.mode === 'lstm' && tf) {
      return this.predictActionWithLSTM(sequenceData);
    } else {
      return this.predictActionWithMarkov(sequenceData);
    }
  }
  
  /**
   * Predict action with LSTM
   */
  async predictActionWithLSTM(sequenceData) {
    return tf.tidy(() => {
      const input = tf.tensor3d([sequenceData.actionFeatures], 
        [1, this.config.sequenceLength, 64]);
      
      const prediction = this.models.action.predict(input);
      const probabilities = prediction.dataSync();
      
      // Get top predictions
      const actions = this.getActionTypes();
      const predictions = actions.map((action, i) => ({
        type: action,
        probability: probabilities[i] || 0
      })).sort((a, b) => b.probability - a.probability);
      
      return {
        type: predictions[0].type,
        probability: predictions[0].probability,
        alternatives: predictions.slice(1, 4)
      };
    });
  }
  
  /**
   * Predict action with Markov chain
   */
  predictActionWithMarkov(sequenceData) {
    const lastAction = sequenceData.lastAction || 'unknown';
    const transitions = this.markovChain.get(lastAction) || new Map();
    
    // Calculate probabilities
    let total = 0;
    const probabilities = [];
    
    for (const [nextAction, count] of transitions) {
      total += count;
      probabilities.push({ type: nextAction, count });
    }
    
    // Normalize to probabilities
    if (total > 0) {
      probabilities.forEach(p => {
        p.probability = p.count / total;
        delete p.count;
      });
    } else {
      // No data, use uniform distribution
      const actions = this.getActionTypes();
      actions.forEach(action => {
        probabilities.push({ type: action, probability: 1 / actions.length });
      });
    }
    
    // Sort by probability
    probabilities.sort((a, b) => b.probability - a.probability);
    
    return {
      type: probabilities[0]?.type || 'unknown',
      probability: probabilities[0]?.probability || 0,
      alternatives: probabilities.slice(1, 4)
    };
  }
  
  /**
   * Predict preference evolution
   */
  async predictPreferenceEvolution(sequenceData) {
    const preferences = {
      codeStyle: { current: 0.5, predicted: 0.5, trend: 'stable' },
      verbosity: { current: 0.5, predicted: 0.5, trend: 'stable' },
      complexity: { current: 0.5, predicted: 0.5, trend: 'stable' },
      assistance: { current: 0.5, predicted: 0.5, trend: 'stable' }
    };
    
    if (this.mode === 'lstm' && tf && this.models.preference) {
      // LSTM prediction
      const input = tf.tensor3d([sequenceData.preferenceFeatures],
        [1, this.config.sequenceLength, 32]);
      
      const prediction = this.models.preference.predict(input);
      const values = await prediction.data();
      
      // Map predictions to preferences
      const keys = Object.keys(preferences);
      values.slice(0, keys.length).forEach((value, i) => {
        const key = keys[i];
        preferences[key].predicted = value;
        preferences[key].trend = this.calculateTrend(
          preferences[key].current,
          preferences[key].predicted
        );
      });
      
      input.dispose();
      prediction.dispose();
    } else {
      // Statistical prediction
      this.predictPreferencesStatistically(sequenceData, preferences);
    }
    
    return preferences;
  }
  
  /**
   * Predict preferences statistically
   */
  predictPreferencesStatistically(sequenceData, preferences) {
    // Analyze historical preferences
    const history = this.behaviorHistory.slice(-20);
    
    if (history.length > 0) {
      // Calculate moving averages
      const recentPrefs = history.slice(-5);
      const olderPrefs = history.slice(-10, -5);
      
      Object.keys(preferences).forEach(key => {
        const recent = this.averagePreference(recentPrefs, key);
        const older = this.averagePreference(olderPrefs, key);
        
        preferences[key].current = recent;
        preferences[key].predicted = recent + (recent - older) * 0.3; // Momentum
        preferences[key].predicted = Math.max(0, Math.min(1, preferences[key].predicted));
        preferences[key].trend = this.calculateTrend(recent, preferences[key].predicted);
      });
    }
  }
  
  /**
   * Predict next timing
   */
  async predictNextTiming(sequenceData) {
    const timing = {
      expectedActionTime: Date.now() + 5000, // Default 5 seconds
      confidence: 0.5,
      pattern: 'regular',
      pace: 'normal'
    };
    
    // Analyze timing patterns
    const recentTimings = this.behaviorHistory
      .slice(-10)
      .map(b => b.timestamp);
    
    if (recentTimings.length >= 2) {
      // Calculate intervals
      const intervals = [];
      for (let i = 1; i < recentTimings.length; i++) {
        intervals.push(recentTimings[i] - recentTimings[i - 1]);
      }
      
      // Average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // Predict next action time
      timing.expectedActionTime = Date.now() + avgInterval;
      
      // Analyze pattern
      const variance = this.calculateVariance(intervals);
      if (variance < avgInterval * 0.2) {
        timing.pattern = 'regular';
        timing.confidence = 0.8;
      } else if (variance < avgInterval * 0.5) {
        timing.pattern = 'variable';
        timing.confidence = 0.6;
      } else {
        timing.pattern = 'irregular';
        timing.confidence = 0.4;
      }
      
      // Determine pace
      if (avgInterval < 2000) timing.pace = 'fast';
      else if (avgInterval < 5000) timing.pace = 'normal';
      else if (avgInterval < 10000) timing.pace = 'slow';
      else timing.pace = 'very slow';
    }
    
    return timing;
  }
  
  /**
   * Predict context change
   */
  async predictContextChange(sequenceData) {
    const contextPrediction = {
      likelyTransition: null,
      probability: 0,
      triggers: [],
      recommendations: []
    };
    
    // Analyze context transitions
    const currentContext = sequenceData.currentContext || {};
    const contextHistory = this.behaviorHistory
      .slice(-5)
      .map(b => b.context)
      .filter(Boolean);
    
    if (contextHistory.length > 0) {
      // Identify patterns
      const transitions = this.identifyContextTransitions(contextHistory);
      
      if (transitions.length > 0) {
        // Most likely transition
        const likely = transitions[0];
        contextPrediction.likelyTransition = likely.to;
        contextPrediction.probability = likely.probability;
        
        // Identify triggers
        contextPrediction.triggers = this.identifyTransitionTriggers(
          currentContext,
          likely.to
        );
        
        // Generate recommendations
        contextPrediction.recommendations = this.generateContextRecommendations(
          likely.to
        );
      }
    }
    
    return contextPrediction;
  }
  
  /**
   * Update behavior history
   */
  updateHistory(behavior) {
    const entry = {
      timestamp: Date.now(),
      action: behavior.action || behavior.type,
      context: behavior.context,
      preferences: behavior.preferences,
      outcome: behavior.outcome,
      feedback: behavior.feedback
    };
    
    this.behaviorHistory.push(entry);
    
    // Maintain history size
    if (this.behaviorHistory.length > this.config.maxHistorySize) {
      this.behaviorHistory.shift();
    }
    
    // Update sequence buffer
    this.updateSequenceBuffer(entry);
    
    // Update Markov chain
    this.updateMarkovChain(entry);
    
    // Update frequency table
    this.updateFrequencyTable(entry);
    
    this.emit('history-updated', entry);
  }
  
  /**
   * Update sequence buffer
   */
  updateSequenceBuffer(entry) {
    this.sequenceBuffer.push(entry);
    
    if (this.sequenceBuffer.length > this.config.sequenceLength) {
      this.sequenceBuffer.shift();
    }
  }
  
  /**
   * Update Markov chain
   */
  updateMarkovChain(entry) {
    if (this.sequenceBuffer.length >= 2) {
      const prev = this.sequenceBuffer[this.sequenceBuffer.length - 2];
      const current = entry;
      
      const prevAction = prev.action || 'unknown';
      const currentAction = current.action || 'unknown';
      
      if (!this.markovChain.has(prevAction)) {
        this.markovChain.set(prevAction, new Map());
      }
      
      const transitions = this.markovChain.get(prevAction);
      const count = transitions.get(currentAction) || 0;
      transitions.set(currentAction, count + 1);
    }
  }
  
  /**
   * Update frequency table
   */
  updateFrequencyTable(entry) {
    const action = entry.action || 'unknown';
    const count = this.frequencyTable.get(action) || 0;
    this.frequencyTable.set(action, count + 1);
  }
  
  /**
   * Train models with new data
   */
  async train(trainingData) {
    if (this.mode === 'lstm' && tf) {
      return this.trainLSTM(trainingData);
    } else {
      return this.trainStatistical(trainingData);
    }
  }
  
  /**
   * Train LSTM models
   */
  async trainLSTM(trainingData) {
    try {
      // Prepare training sequences
      const { sequences, labels } = this.prepareTrainingData(trainingData);
      
      // Train action predictor
      if (this.models.action) {
        const actionHistory = await this.models.action.fit(
          sequences.actions,
          labels.actions,
          {
            epochs: 10,
            batchSize: 32,
            validationSplit: 0.2,
            verbose: 0
          }
        );
        
        this.metrics.accuracy = actionHistory.history.acc?.slice(-1)[0] || 0;
      }
      
      logger.info(`Training complete: ${(this.metrics.accuracy * 100).toFixed(1)}% accuracy`);
      
    } catch (error) {
      logger.error('Training failed:', error);
    }
  }
  
  /**
   * Train statistical models
   */
  async trainStatistical(trainingData) {
    // Update Markov chain with training data
    for (let i = 1; i < trainingData.length; i++) {
      const prev = trainingData[i - 1];
      const current = trainingData[i];
      
      this.updateMarkovChain({
        action: prev.action
      });
      
      this.updateMarkovChain({
        action: current.action
      });
    }
    
    logger.info('Statistical models updated with training data');
  }
  
  /**
   * Start prediction loop
   */
  startPredictionLoop() {
    setInterval(async () => {
      if (this.sequenceBuffer.length >= this.config.sequenceLength) {
        // Generate automatic predictions
        const predictions = await this.predictBehavior({});
        
        // Validate previous predictions
        this.validatePredictions();
      }
    }, this.config.updateInterval);
  }
  
  /**
   * Validate predictions against actual behavior
   */
  validatePredictions() {
    const recentBehavior = this.behaviorHistory.slice(-1)[0];
    if (!recentBehavior) return;
    
    for (const [id, prediction] of this.predictions) {
      if (Date.now() - prediction.timestamp > 10000) {
        // Old prediction, check accuracy
        if (prediction.nextAction?.type === recentBehavior.action) {
          this.metrics.hitRate = (this.metrics.hitRate * 0.9) + 0.1;
        } else {
          this.metrics.hitRate = this.metrics.hitRate * 0.9;
        }
        
        this.predictions.delete(id);
      }
    }
  }
  
  // Helper methods
  
  getRecentSequence() {
    return this.sequenceBuffer.slice(-this.config.sequenceLength);
  }
  
  prepareSequenceData(sequence, currentContext) {
    return {
      actionFeatures: this.extractActionFeatures(sequence),
      preferenceFeatures: this.extractPreferenceFeatures(sequence),
      contextFeatures: this.extractContextFeatures(sequence),
      lastAction: sequence.slice(-1)[0]?.action,
      currentContext
    };
  }
  
  extractActionFeatures(sequence) {
    // Create feature matrix for actions
    const features = [];
    
    for (const entry of sequence) {
      const actionVector = new Array(64).fill(0);
      
      // Encode action type
      const actionIndex = this.getActionTypes().indexOf(entry.action || 'unknown');
      if (actionIndex >= 0) {
        actionVector[actionIndex] = 1;
      }
      
      // Add temporal features
      const hour = new Date(entry.timestamp).getHours();
      actionVector[10] = hour / 24;
      
      // Add context features
      if (entry.context) {
        actionVector[20] = entry.context.complexity || 0;
        actionVector[21] = entry.context.urgency || 0;
      }
      
      features.push(actionVector);
    }
    
    // Pad or truncate to sequence length
    while (features.length < this.config.sequenceLength) {
      features.unshift(new Array(64).fill(0));
    }
    
    return features.slice(-this.config.sequenceLength);
  }
  
  extractPreferenceFeatures(sequence) {
    const features = [];
    
    for (const entry of sequence) {
      const prefVector = new Array(32).fill(0);
      
      if (entry.preferences) {
        Object.values(entry.preferences).forEach((value, i) => {
          if (i < 32) {
            prefVector[i] = typeof value === 'number' ? value : 0;
          }
        });
      }
      
      features.push(prefVector);
    }
    
    while (features.length < this.config.sequenceLength) {
      features.unshift(new Array(32).fill(0));
    }
    
    return features.slice(-this.config.sequenceLength);
  }
  
  extractContextFeatures(sequence) {
    return sequence.map(entry => ({
      timestamp: entry.timestamp,
      context: entry.context || {}
    }));
  }
  
  getActionTypes() {
    return [
      'create', 'modify', 'delete', 'search',
      'navigate', 'analyze', 'test', 'debug',
      'document', 'optimize'
    ];
  }
  
  calculateOverallConfidence(predictions) {
    const confidences = [
      predictions.nextAction?.probability || 0,
      predictions.timing?.confidence || 0,
      predictions.context?.probability || 0
    ];
    
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
  
  calculateTrend(current, predicted) {
    const diff = predicted - current;
    if (Math.abs(diff) < 0.05) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }
  
  averagePreference(history, key) {
    const values = history
      .map(h => h.preferences?.[key])
      .filter(v => typeof v === 'number');
    
    if (values.length === 0) return 0.5;
    
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
  
  identifyContextTransitions(contextHistory) {
    const transitions = new Map();
    
    for (let i = 1; i < contextHistory.length; i++) {
      const from = JSON.stringify(contextHistory[i - 1]);
      const to = JSON.stringify(contextHistory[i]);
      const key = `${from}->${to}`;
      
      transitions.set(key, (transitions.get(key) || 0) + 1);
    }
    
    // Convert to probabilities
    const total = Array.from(transitions.values()).reduce((a, b) => a + b, 0);
    
    return Array.from(transitions.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('->');
        return {
          from: JSON.parse(from),
          to: JSON.parse(to),
          probability: count / total
        };
      })
      .sort((a, b) => b.probability - a.probability);
  }
  
  identifyTransitionTriggers(currentContext, nextContext) {
    const triggers = [];
    
    // Time-based triggers
    const currentTime = new Date();
    if (currentTime.getHours() >= 17) {
      triggers.push('end-of-day');
    }
    
    // Context-based triggers
    if (currentContext.errorRate > 0.3) {
      triggers.push('high-errors');
    }
    
    if (currentContext.taskCompleted) {
      triggers.push('task-completion');
    }
    
    return triggers;
  }
  
  generateContextRecommendations(nextContext) {
    const recommendations = [];
    
    if (nextContext?.type === 'debugging') {
      recommendations.push('Prepare debugging tools');
      recommendations.push('Enable verbose logging');
    } else if (nextContext?.type === 'optimization') {
      recommendations.push('Run performance profiler');
      recommendations.push('Prepare benchmarks');
    }
    
    return recommendations;
  }
  
  storePrediction(prediction) {
    const id = `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.predictions.set(id, {
      ...prediction,
      timestamp: Date.now(),
      id
    });
    
    // Clean old predictions
    for (const [id, pred] of this.predictions) {
      if (Date.now() - pred.timestamp > 60000) {
        this.predictions.delete(id);
      }
    }
  }
  
  updateMetrics(prediction) {
    this.metrics.predictions++;
    this.metrics.confidence = 
      (this.metrics.confidence * (this.metrics.predictions - 1) + 
       prediction.confidence) / this.metrics.predictions;
  }
  
  prepareTrainingData(data) {
    // Prepare sequences and labels for training
    const sequences = {
      actions: [],
      preferences: []
    };
    
    const labels = {
      actions: [],
      preferences: []
    };
    
    // Create training sequences
    for (let i = this.config.sequenceLength; i < data.length; i++) {
      const sequence = data.slice(i - this.config.sequenceLength, i);
      const nextItem = data[i];
      
      sequences.actions.push(this.extractActionFeatures(sequence));
      labels.actions.push(this.encodeAction(nextItem.action));
      
      sequences.preferences.push(this.extractPreferenceFeatures(sequence));
      labels.preferences.push(this.encodePreferences(nextItem.preferences));
    }
    
    if (tf) {
      return {
        sequences: {
          actions: tf.tensor3d(sequences.actions),
          preferences: tf.tensor3d(sequences.preferences)
        },
        labels: {
          actions: tf.tensor2d(labels.actions),
          preferences: tf.tensor2d(labels.preferences)
        }
      };
    }
    
    return { sequences, labels };
  }
  
  encodeAction(action) {
    const encoded = new Array(10).fill(0);
    const index = this.getActionTypes().indexOf(action);
    if (index >= 0) {
      encoded[index] = 1;
    }
    return encoded;
  }
  
  encodePreferences(preferences) {
    const encoded = new Array(16).fill(0);
    if (preferences) {
      Object.values(preferences).forEach((value, i) => {
        if (i < 16 && typeof value === 'number') {
          encoded[i] = value;
        }
      });
    }
    return encoded;
  }
  
  getDefaultPrediction() {
    return {
      nextAction: {
        type: 'unknown',
        probability: 0,
        alternatives: []
      },
      preferences: {},
      timing: {
        expectedActionTime: Date.now() + 5000,
        confidence: 0,
        pattern: 'unknown'
      },
      context: {
        likelyTransition: null,
        probability: 0
      },
      confidence: 0,
      metadata: {
        mode: this.mode,
        error: true
      }
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      historySize: this.behaviorHistory.length,
      markovChainSize: this.markovChain.size,
      predictionCount: this.predictions.size,
      mode: this.mode
    };
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    this.behaviorHistory = [];
    this.sequenceBuffer = [];
    this.predictions.clear();
    logger.info('Behavior history cleared');
  }
}

module.exports = BehaviorPredictor;