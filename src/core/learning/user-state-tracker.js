/**
 * BUMBA User State Tracker
 * Comprehensive tracking of user state across sessions
 * Part of Human Learning Module Enhancement - Sprint 3
 * 
 * FRAMEWORK DESIGN:
 * - Multi-dimensional state tracking
 * - Session continuity
 * - State persistence
 * - Works without external databases
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

/**
 * User State Tracker for comprehensive state management
 */
class UserStateTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      persistencePath: config.persistencePath || path.join(process.env.HOME, '.claude', 'user-states'),
      sessionTimeout: config.sessionTimeout || 1800000, // 30 minutes
      stateDepth: config.stateDepth || 20,
      checkpointInterval: config.checkpointInterval || 300000, // 5 minutes
      maxStatesPerUser: config.maxStatesPerUser || 100,
      ...config
    };
    
    // User states storage
    this.userStates = new Map();
    
    // Active sessions
    this.sessions = new Map();
    
    // State dimensions
    this.stateDimensions = {
      cognitive: {
        attention: 0.5,      // Focus level
        comprehension: 0.5,  // Understanding level
        retention: 0.5,      // Memory engagement
        processing: 0.5      // Cognitive load
      },
      emotional: {
        valence: 0,          // Positive/negative
        arousal: 0,          // Activation level
        dominance: 0,        // Control feeling
        satisfaction: 0.5    // Satisfaction level
      },
      behavioral: {
        engagement: 0.5,     // Interaction level
        productivity: 0.5,   // Task completion rate
        exploration: 0.5,    // Curiosity level
        consistency: 0.5     // Behavior stability
      },
      contextual: {
        taskComplexity: 0.5, // Current task difficulty
        timePressuare: 0.5,  // Urgency level
        collaboration: 0,    // Team interaction
        environment: 0.5     // Environmental factors
      },
      performance: {
        accuracy: 0.5,       // Error rate
        speed: 0.5,          // Response time
        quality: 0.5,        // Output quality
        efficiency: 0.5      // Resource usage
      }
    };
    
    // State transitions
    this.transitions = new Map();
    
    // Checkpoints
    this.checkpoints = new Map();
    
    // State patterns
    this.patterns = {
      flow: this.detectFlowState.bind(this),
      frustration: this.detectFrustrationState.bind(this),
      learning: this.detectLearningState.bind(this),
      fatigue: this.detectFatigueState.bind(this),
      exploration: this.detectExplorationState.bind(this)
    };
    
    // Metrics
    this.metrics = {
      statesTracked: 0,
      sessionsActive: 0,
      transitionsDetected: 0,
      patternsIdentified: 0,
      checkpointsSaved: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize state tracker
   */
  async initialize() {
    try {
      // Create persistence directory
      await fs.mkdir(this.config.persistencePath, { recursive: true });
      
      // Load persisted states
      await this.loadPersistedStates();
      
      // Start checkpoint loop
      this.startCheckpointLoop();
      
      // Start session cleanup
      this.startSessionCleanup();
      
      logger.info('📊 User State Tracker initialized');
      
      this.emit('initialized', {
        dimensions: Object.keys(this.stateDimensions),
        patterns: Object.keys(this.patterns),
        sessionsLoaded: this.sessions.size
      });
      
    } catch (error) {
      logger.error('Failed to initialize User State Tracker:', error);
    }
  }
  
  /**
   * Track user state
   */
  async trackState(userId, stateUpdate, context = {}) {
    try {
      // Get or create user state
      const userState = await this.getUserState(userId);
      
      // Update session
      this.updateSession(userId, context);
      
      // Apply state update
      const newState = this.applyStateUpdate(userState.current, stateUpdate);
      
      // Detect transitions
      const transition = this.detectTransition(userState.current, newState);
      
      // Update user state
      userState.previous = userState.current;
      userState.current = newState;
      userState.timestamp = Date.now();
      
      // Add to history
      userState.history.push({
        state: newState,
        timestamp: Date.now(),
        context,
        transition
      });
      
      // Maintain history size
      if (userState.history.length > this.config.stateDepth) {
        userState.history.shift();
      }
      
      // Detect patterns
      const patterns = this.detectPatterns(userState);
      
      // Track metrics
      this.metrics.statesTracked++;
      
      if (transition) {
        this.metrics.transitionsDetected++;
        this.emit('state-transition', {
          userId,
          transition,
          from: userState.previous,
          to: newState
        });
      }
      
      if (patterns.length > 0) {
        this.metrics.patternsIdentified += patterns.length;
        this.emit('patterns-detected', {
          userId,
          patterns,
          state: newState
        });
      }
      
      // Store updated state
      this.userStates.set(userId, userState);
      
      return {
        state: newState,
        transition,
        patterns,
        session: this.sessions.get(userId)
      };
      
    } catch (error) {
      logger.error('Failed to track state:', error);
      return null;
    }
  }
  
  /**
   * Get comprehensive user state
   */
  async getState(userId) {
    const userState = await this.getUserState(userId);
    const session = this.sessions.get(userId);
    
    return {
      current: userState.current,
      previous: userState.previous,
      history: userState.history.slice(-10),
      patterns: this.detectPatterns(userState),
      session: session ? {
        duration: Date.now() - session.startTime,
        interactions: session.interactions,
        active: session.active
      } : null,
      insights: this.generateStateInsights(userState),
      recommendations: this.generateRecommendations(userState)
    };
  }
  
  /**
   * Start new session
   */
  async startSession(userId, context = {}) {
    const session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      interactions: 0,
      context,
      active: true,
      states: []
    };
    
    this.sessions.set(userId, session);
    this.metrics.sessionsActive++;
    
    // Initialize user state if needed
    await this.getUserState(userId);
    
    this.emit('session-started', session);
    
    return session;
  }
  
  /**
   * End session
   */
  async endSession(userId) {
    const session = this.sessions.get(userId);
    
    if (session) {
      session.active = false;
      session.endTime = Date.now();
      session.duration = session.endTime - session.startTime;
      
      // Save session data
      await this.saveSession(session);
      
      // Create checkpoint
      await this.createCheckpoint(userId);
      
      this.sessions.delete(userId);
      this.metrics.sessionsActive--;
      
      this.emit('session-ended', session);
    }
    
    return session;
  }
  
  /**
   * Create state checkpoint
   */
  async createCheckpoint(userId) {
    const userState = this.userStates.get(userId);
    
    if (!userState) return null;
    
    const checkpoint = {
      id: `checkpoint-${Date.now()}`,
      userId,
      timestamp: Date.now(),
      state: userState.current,
      history: userState.history.slice(-5),
      session: this.sessions.get(userId)
    };
    
    // Store checkpoint
    if (!this.checkpoints.has(userId)) {
      this.checkpoints.set(userId, []);
    }
    
    const userCheckpoints = this.checkpoints.get(userId);
    userCheckpoints.push(checkpoint);
    
    // Keep last 10 checkpoints
    if (userCheckpoints.length > 10) {
      userCheckpoints.shift();
    }
    
    // Persist checkpoint
    await this.saveCheckpoint(userId, checkpoint);
    
    this.metrics.checkpointsSaved++;
    
    this.emit('checkpoint-created', checkpoint);
    
    return checkpoint;
  }
  
  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(userId, checkpointId = null) {
    const userCheckpoints = this.checkpoints.get(userId);
    
    if (!userCheckpoints || userCheckpoints.length === 0) {
      return null;
    }
    
    let checkpoint;
    
    if (checkpointId) {
      checkpoint = userCheckpoints.find(c => c.id === checkpointId);
    } else {
      // Use most recent checkpoint
      checkpoint = userCheckpoints[userCheckpoints.length - 1];
    }
    
    if (checkpoint) {
      const userState = await this.getUserState(userId);
      userState.current = checkpoint.state;
      userState.history = checkpoint.history;
      userState.timestamp = Date.now();
      
      this.emit('checkpoint-restored', checkpoint);
      
      return checkpoint;
    }
    
    return null;
  }
  
  // Pattern detection methods
  
  detectFlowState(userState) {
    const { cognitive, behavioral, performance } = userState.current;
    
    const flowScore = 
      cognitive.attention * 0.3 +
      cognitive.comprehension * 0.2 +
      behavioral.engagement * 0.3 +
      performance.efficiency * 0.2;
    
    return {
      detected: flowScore > 0.7,
      confidence: flowScore,
      type: 'flow',
      description: 'User in flow state - high focus and productivity'
    };
  }
  
  detectFrustrationState(userState) {
    const { emotional, behavioral, performance } = userState.current;
    
    const frustrationScore = 
      Math.max(0, -emotional.valence) * 0.3 +
      Math.max(0, emotional.arousal - 0.5) * 0.2 +
      Math.max(0, 0.5 - behavioral.engagement) * 0.2 +
      Math.max(0, 0.5 - performance.accuracy) * 0.3;
    
    return {
      detected: frustrationScore > 0.6,
      confidence: frustrationScore,
      type: 'frustration',
      description: 'User showing signs of frustration'
    };
  }
  
  detectLearningState(userState) {
    const { cognitive, behavioral } = userState.current;
    
    const learningScore = 
      cognitive.comprehension * 0.3 +
      cognitive.retention * 0.3 +
      behavioral.exploration * 0.2 +
      behavioral.engagement * 0.2;
    
    return {
      detected: learningScore > 0.65,
      confidence: learningScore,
      type: 'learning',
      description: 'User in active learning mode'
    };
  }
  
  detectFatigueState(userState) {
    const { cognitive, behavioral, performance } = userState.current;
    
    // Check session duration
    const session = this.sessions.get(userState.userId);
    const sessionDuration = session ? Date.now() - session.startTime : 0;
    const durationFactor = Math.min(1, sessionDuration / 7200000); // 2 hours
    
    const fatigueScore = 
      Math.max(0, 0.5 - cognitive.attention) * 0.25 +
      Math.max(0, 0.5 - behavioral.engagement) * 0.25 +
      Math.max(0, 0.5 - performance.speed) * 0.25 +
      durationFactor * 0.25;
    
    return {
      detected: fatigueScore > 0.6,
      confidence: fatigueScore,
      type: 'fatigue',
      description: 'User showing signs of fatigue'
    };
  }
  
  detectExplorationState(userState) {
    const { behavioral, cognitive } = userState.current;
    
    const explorationScore = 
      behavioral.exploration * 0.4 +
      cognitive.attention * 0.2 +
      behavioral.engagement * 0.2 +
      (1 - behavioral.consistency) * 0.2; // Variability indicates exploration
    
    return {
      detected: explorationScore > 0.65,
      confidence: explorationScore,
      type: 'exploration',
      description: 'User in exploration/discovery mode'
    };
  }
  
  // Helper methods
  
  async getUserState(userId) {
    if (!this.userStates.has(userId)) {
      const userState = {
        userId,
        current: this.getInitialState(),
        previous: null,
        history: [],
        created: Date.now(),
        lastUpdate: Date.now()
      };
      
      this.userStates.set(userId, userState);
    }
    
    return this.userStates.get(userId);
  }
  
  getInitialState() {
    // Deep copy of initial state dimensions
    return JSON.parse(JSON.stringify(this.stateDimensions));
  }
  
  updateSession(userId, context) {
    let session = this.sessions.get(userId);
    
    if (!session || !session.active) {
      session = this.startSession(userId, context);
    } else {
      session.lastActivity = Date.now();
      session.interactions++;
    }
    
    return session;
  }
  
  applyStateUpdate(currentState, update) {
    const newState = JSON.parse(JSON.stringify(currentState));
    
    // Apply updates to each dimension
    for (const [dimension, values] of Object.entries(update)) {
      if (newState[dimension]) {
        for (const [key, value] of Object.entries(values)) {
          if (newState[dimension][key] !== undefined) {
            // Smooth transition with momentum
            const current = newState[dimension][key];
            const momentum = 0.7;
            newState[dimension][key] = current * momentum + value * (1 - momentum);
            
            // Clamp to valid range
            newState[dimension][key] = Math.max(0, Math.min(1, newState[dimension][key]));
          }
        }
      }
    }
    
    return newState;
  }
  
  detectTransition(fromState, toState) {
    if (!fromState || !toState) return null;
    
    // Calculate state distance
    let totalChange = 0;
    let significantChanges = [];
    
    for (const dimension of Object.keys(this.stateDimensions)) {
      for (const key of Object.keys(this.stateDimensions[dimension])) {
        const change = Math.abs((toState[dimension]?.[key] || 0) - (fromState[dimension]?.[key] || 0));
        totalChange += change;
        
        if (change > 0.3) {
          significantChanges.push({
            dimension,
            key,
            from: fromState[dimension]?.[key],
            to: toState[dimension]?.[key],
            change
          });
        }
      }
    }
    
    if (significantChanges.length > 0) {
      return {
        type: this.classifyTransition(significantChanges),
        magnitude: totalChange,
        changes: significantChanges
      };
    }
    
    return null;
  }
  
  classifyTransition(changes) {
    // Analyze changes to classify transition type
    const dimensions = changes.map(c => c.dimension);
    
    if (dimensions.includes('emotional')) {
      const emotionalChange = changes.find(c => c.dimension === 'emotional');
      if (emotionalChange.to > emotionalChange.from) {
        return 'mood-improvement';
      } else {
        return 'mood-decline';
      }
    }
    
    if (dimensions.includes('cognitive')) {
      return 'cognitive-shift';
    }
    
    if (dimensions.includes('behavioral')) {
      return 'behavioral-change';
    }
    
    return 'general-transition';
  }
  
  detectPatterns(userState) {
    const detectedPatterns = [];
    
    for (const [name, detector] of Object.entries(this.patterns)) {
      const pattern = detector(userState);
      if (pattern.detected) {
        detectedPatterns.push(pattern);
      }
    }
    
    return detectedPatterns;
  }
  
  generateStateInsights(userState) {
    const insights = {
      dominant: this.getDominantDimension(userState.current),
      trend: this.analyzeTrend(userState.history),
      stability: this.calculateStability(userState.history),
      alerts: this.generateAlerts(userState)
    };
    
    return insights;
  }
  
  getDominantDimension(state) {
    let maxAverage = 0;
    let dominant = null;
    
    for (const [dimension, values] of Object.entries(state)) {
      const average = Object.values(values).reduce((a, b) => a + b, 0) / Object.values(values).length;
      
      if (average > maxAverage) {
        maxAverage = average;
        dominant = dimension;
      }
    }
    
    return { dimension: dominant, strength: maxAverage };
  }
  
  analyzeTrend(history) {
    if (history.length < 3) return 'insufficient-data';
    
    const recent = history.slice(-3);
    let improving = 0;
    let declining = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].state;
      const curr = recent[i].state;
      
      // Compare key metrics
      const prevScore = this.calculateOverallScore(prev);
      const currScore = this.calculateOverallScore(curr);
      
      if (currScore > prevScore) improving++;
      else if (currScore < prevScore) declining++;
    }
    
    if (improving > declining) return 'improving';
    if (declining > improving) return 'declining';
    return 'stable';
  }
  
  calculateOverallScore(state) {
    let score = 0;
    let count = 0;
    
    // Positive contributors
    score += state.cognitive?.attention || 0;
    score += state.cognitive?.comprehension || 0;
    score += state.emotional?.valence + 0.5 || 0.5; // Normalize from [-1,1] to [0,1]
    score += state.emotional?.satisfaction || 0;
    score += state.behavioral?.engagement || 0;
    score += state.behavioral?.productivity || 0;
    score += state.performance?.accuracy || 0;
    score += state.performance?.quality || 0;
    count += 8;
    
    return score / count;
  }
  
  calculateStability(history) {
    if (history.length < 5) return 1.0;
    
    const recent = history.slice(-5);
    const scores = recent.map(h => this.calculateOverallScore(h.state));
    
    // Calculate variance
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    
    // Lower variance = higher stability
    return Math.max(0, 1 - Math.sqrt(variance) * 2);
  }
  
  generateAlerts(userState) {
    const alerts = [];
    const { current } = userState;
    
    // Cognitive alerts
    if (current.cognitive?.attention < 0.3) {
      alerts.push({ type: 'low-attention', severity: 'medium' });
    }
    
    if (current.cognitive?.processing > 0.8) {
      alerts.push({ type: 'cognitive-overload', severity: 'high' });
    }
    
    // Emotional alerts
    if (current.emotional?.valence < -0.5) {
      alerts.push({ type: 'negative-emotion', severity: 'medium' });
    }
    
    if (current.emotional?.satisfaction < 0.3) {
      alerts.push({ type: 'low-satisfaction', severity: 'medium' });
    }
    
    // Behavioral alerts
    if (current.behavioral?.engagement < 0.2) {
      alerts.push({ type: 'disengagement', severity: 'high' });
    }
    
    // Performance alerts
    if (current.performance?.accuracy < 0.4) {
      alerts.push({ type: 'high-error-rate', severity: 'medium' });
    }
    
    return alerts;
  }
  
  generateRecommendations(userState) {
    const recommendations = [];
    const patterns = this.detectPatterns(userState);
    
    // Pattern-based recommendations
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'frustration':
          recommendations.push('Simplify current task or provide more guidance');
          recommendations.push('Consider taking a short break');
          break;
        case 'fatigue':
          recommendations.push('Suggest a break or session end');
          recommendations.push('Switch to lighter tasks');
          break;
        case 'flow':
          recommendations.push('Maintain current approach');
          recommendations.push('Avoid interruptions');
          break;
        case 'learning':
          recommendations.push('Provide additional learning resources');
          recommendations.push('Increase challenge gradually');
          break;
        case 'exploration':
          recommendations.push('Offer diverse options');
          recommendations.push('Encourage discovery');
          break;
      }
    }
    
    // State-based recommendations
    const { current } = userState;
    
    if (current.cognitive?.attention < 0.4) {
      recommendations.push('Break complex tasks into smaller steps');
    }
    
    if (current.emotional?.valence < -0.3) {
      recommendations.push('Provide encouragement and support');
    }
    
    if (current.behavioral?.exploration > 0.7) {
      recommendations.push('Introduce new features or capabilities');
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
  
  // Persistence methods
  
  async loadPersistedStates() {
    try {
      const statesFile = path.join(this.config.persistencePath, 'states.json');
      
      if (await this.fileExists(statesFile)) {
        const data = await fs.readFile(statesFile, 'utf8');
        const states = JSON.parse(data);
        
        for (const [userId, state] of Object.entries(states)) {
          this.userStates.set(userId, state);
        }
        
        logger.info(`Loaded ${this.userStates.size} user states`);
      }
    } catch (error) {
      logger.error('Failed to load persisted states:', error);
    }
  }
  
  async saveSession(session) {
    try {
      const sessionFile = path.join(
        this.config.persistencePath,
        `session-${session.userId}-${session.id}.json`
      );
      
      await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
      
    } catch (error) {
      logger.error('Failed to save session:', error);
    }
  }
  
  async saveCheckpoint(userId, checkpoint) {
    try {
      const checkpointFile = path.join(
        this.config.persistencePath,
        `checkpoint-${userId}-${checkpoint.id}.json`
      );
      
      await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2));
      
    } catch (error) {
      logger.error('Failed to save checkpoint:', error);
    }
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Start checkpoint loop
   */
  startCheckpointLoop() {
    setInterval(async () => {
      // Create checkpoints for active sessions
      for (const [userId, session] of this.sessions) {
        if (session.active) {
          await this.createCheckpoint(userId);
        }
      }
      
      // Persist current states
      await this.persistStates();
      
    }, this.config.checkpointInterval);
  }
  
  /**
   * Start session cleanup
   */
  startSessionCleanup() {
    setInterval(() => {
      const now = Date.now();
      
      for (const [userId, session] of this.sessions) {
        if (now - session.lastActivity > this.config.sessionTimeout) {
          // Session timeout
          this.endSession(userId);
          
          this.emit('session-timeout', {
            userId,
            sessionId: session.id,
            duration: now - session.startTime
          });
        }
      }
    }, 60000); // Check every minute
  }
  
  async persistStates() {
    try {
      const statesFile = path.join(this.config.persistencePath, 'states.json');
      const states = Object.fromEntries(this.userStates);
      
      await fs.writeFile(statesFile, JSON.stringify(states, null, 2));
      
    } catch (error) {
      logger.error('Failed to persist states:', error);
    }
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeUsers: this.userStates.size,
      activeSessions: this.sessions.size,
      checkpointsStored: Array.from(this.checkpoints.values())
        .reduce((sum, checkpoints) => sum + checkpoints.length, 0)
    };
  }
}

module.exports = UserStateTracker;