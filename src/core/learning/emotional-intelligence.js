/**
 * BUMBA Emotional Intelligence Module
 * Emotion recognition and empathetic response generation
 * Part of Human Learning Module Enhancement - Sprint 3
 * 
 * FRAMEWORK DESIGN:
 * - Emotion detection from text patterns
 * - Mood tracking over time
 * - Empathetic response adaptation
 * - Works without external sentiment APIs
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Emotional Intelligence for understanding and responding to user emotions
 */
class EmotionalIntelligence extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      sensitivityLevel: config.sensitivityLevel || 0.7,
      moodWindow: config.moodWindow || 300000, // 5 minutes
      empathyLevel: config.empathyLevel || 0.8,
      responseAdaptation: config.responseAdaptation !== false,
      emotionalMemory: config.emotionalMemory || 50,
      ...config
    };
    
    // Primary emotions
    this.primaryEmotions = {
      joy: { valence: 1, arousal: 0.5, dominance: 0.7 },
      trust: { valence: 0.7, arousal: 0.3, dominance: 0.5 },
      fear: { valence: -0.8, arousal: 0.8, dominance: -0.6 },
      surprise: { valence: 0, arousal: 0.9, dominance: 0 },
      sadness: { valence: -0.7, arousal: -0.4, dominance: -0.5 },
      disgust: { valence: -0.9, arousal: 0.2, dominance: 0.3 },
      anger: { valence: -0.8, arousal: 0.9, dominance: 0.7 },
      anticipation: { valence: 0.3, arousal: 0.6, dominance: 0.4 }
    };
    
    // Complex emotions (combinations)
    this.complexEmotions = {
      frustration: ['anger', 'sadness'],
      excitement: ['joy', 'anticipation'],
      anxiety: ['fear', 'anticipation'],
      contentment: ['joy', 'trust'],
      disappointment: ['sadness', 'surprise'],
      pride: ['joy', 'trust'],
      shame: ['sadness', 'disgust'],
      curiosity: ['surprise', 'anticipation']
    };
    
    // Emotional lexicon
    this.emotionalLexicon = this.buildEmotionalLexicon();
    
    // User emotional states
    this.userStates = new Map();
    
    // Mood patterns
    this.moodPatterns = new Map();
    
    // Empathy strategies
    this.empathyStrategies = {
      mirror: this.mirrorStrategy.bind(this),
      complement: this.complementStrategy.bind(this),
      soothe: this.sootheStrategy.bind(this),
      energize: this.energizeStrategy.bind(this),
      validate: this.validateStrategy.bind(this)
    };
    
    // Emotional memory
    this.emotionalMemory = [];
    
    // Metrics
    this.metrics = {
      emotionsDetected: 0,
      moodShifts: 0,
      empathyResponses: 0,
      accuracyRate: 0,
      resonanceScore: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize emotional intelligence
   */
  async initialize() {
    try {
      // Start mood tracking loop
      this.startMoodTracking();
      
      logger.info('💚 Emotional Intelligence initialized');
      
      this.emit('initialized', {
        emotions: Object.keys(this.primaryEmotions),
        strategies: Object.keys(this.empathyStrategies),
        sensitivity: this.config.sensitivityLevel
      });
      
    } catch (error) {
      logger.error('Failed to initialize Emotional Intelligence:', error);
    }
  }
  
  /**
   * Build emotional lexicon
   */
  buildEmotionalLexicon() {
    return {
      // Joy indicators
      joy: ['happy', 'glad', 'joyful', 'pleased', 'delighted', 'cheerful', 
             'excited', 'wonderful', 'great', 'awesome', 'fantastic', 'love',
             '', '', '', '🏁', '🔴️', '👍', 'yay', 'woohoo'],
      
      // Sadness indicators
      sadness: ['sad', 'unhappy', 'depressed', 'down', 'blue', 'miserable',
                'sorry', 'disappointed', 'unfortunate', 'terrible', 'awful',
                '', '', '', '💔', 'sigh'],
      
      // Anger indicators
      anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated',
              'pissed', 'rage', 'hate', 'stupid', 'idiotic', 'dammit',
              '', '', '🤬', '💢', 'ugh', 'argh'],
      
      // Fear indicators
      fear: ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried',
             'nervous', 'concerned', 'panic', 'dread', 'horrified',
             '', '', '', '🫣'],
      
      // Surprise indicators
      surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'unexpected',
                 'suddenly', 'wow', 'omg', 'whoa', 'incredible', 'unbelievable',
                 '', '', '🤯', '‼️', '⁉️'],
      
      // Disgust indicators
      disgust: ['disgusting', 'gross', 'nasty', 'revolting', 'repulsive', 'yuck',
                'ew', 'horrible', 'awful', 'terrible', 'hate',
                '🤢', '🤮', '', '👎'],
      
      // Trust indicators
      trust: ['trust', 'believe', 'confident', 'sure', 'reliable', 'depend',
              'faith', 'loyal', 'honest', 'sincere', 'genuine',
              '🤝', '💯', '🏁', '👌'],
      
      // Anticipation indicators
      anticipation: ['hope', 'expect', 'await', 'looking forward', 'excited',
                     'eager', 'anticipate', 'ready', 'prepared', 'planning',
                     '🤞', '', '⏰', '📅']
    };
  }
  
  /**
   * Detect emotions from text
   */
  async detectEmotion(text, context = {}) {
    try {
      const textLower = text.toLowerCase();
      
      // Score each emotion
      const emotionScores = {};
      let totalScore = 0;
      
      for (const [emotion, keywords] of Object.entries(this.emotionalLexicon)) {
        let score = 0;
        
        for (const keyword of keywords) {
          if (textLower.includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
        
        // Apply context modifiers
        score = this.applyContextModifiers(score, emotion, context);
        
        emotionScores[emotion] = score;
        totalScore += score;
      }
      
      // Normalize scores
      if (totalScore > 0) {
        for (const emotion in emotionScores) {
          emotionScores[emotion] /= totalScore;
        }
      }
      
      // Detect primary emotion
      const primaryEmotion = this.detectPrimaryEmotion(emotionScores);
      
      // Detect complex emotions
      const complexEmotions = this.detectComplexEmotions(emotionScores);
      
      // Calculate emotional state
      const emotionalState = this.calculateEmotionalState(emotionScores);
      
      // Create emotion profile
      const emotionProfile = {
        primary: primaryEmotion,
        complex: complexEmotions,
        scores: emotionScores,
        state: emotionalState,
        intensity: this.calculateIntensity(text),
        confidence: this.calculateConfidence(emotionScores),
        timestamp: Date.now()
      };
      
      // Update user state if userId provided
      if (context.userId) {
        this.updateUserState(context.userId, emotionProfile);
      }
      
      // Track in memory
      this.addToEmotionalMemory(emotionProfile);
      
      this.metrics.emotionsDetected++;
      
      this.emit('emotion-detected', emotionProfile);
      
      return emotionProfile;
      
    } catch (error) {
      logger.error('Emotion detection failed:', error);
      return this.neutralEmotion();
    }
  }
  
  /**
   * Generate empathetic response
   */
  async generateEmpathetic(emotionProfile, content, context = {}) {
    try {
      // Select empathy strategy based on emotion
      const strategy = this.selectEmpathyStrategy(emotionProfile);
      
      // Apply strategy
      const empathetic = await this.empathyStrategies[strategy](
        emotionProfile,
        content,
        context
      );
      
      // Track response
      this.metrics.empathyResponses++;
      
      this.emit('empathetic-response', {
        emotion: emotionProfile.primary,
        strategy,
        adjustments: empathetic.adjustments
      });
      
      return empathetic;
      
    } catch (error) {
      logger.error('Empathetic generation failed:', error);
      return { content, adjustments: {} };
    }
  }
  
  /**
   * Track user mood over time
   */
  async trackMood(userId, emotion) {
    if (!this.moodPatterns.has(userId)) {
      this.moodPatterns.set(userId, {
        history: [],
        baseline: { valence: 0, arousal: 0, dominance: 0 },
        current: { valence: 0, arousal: 0, dominance: 0 },
        trend: 'stable'
      });
    }
    
    const moodPattern = this.moodPatterns.get(userId);
    
    // Add to history
    moodPattern.history.push({
      emotion,
      timestamp: Date.now()
    });
    
    // Remove old entries
    const cutoff = Date.now() - this.config.moodWindow;
    moodPattern.history = moodPattern.history.filter(h => h.timestamp > cutoff);
    
    // Calculate current mood
    moodPattern.current = this.calculateMood(moodPattern.history);
    
    // Detect trend
    moodPattern.trend = this.detectMoodTrend(moodPattern);
    
    // Check for mood shift
    if (this.detectMoodShift(moodPattern)) {
      this.metrics.moodShifts++;
      this.emit('mood-shift', {
        userId,
        from: moodPattern.baseline,
        to: moodPattern.current,
        trend: moodPattern.trend
      });
    }
    
    return moodPattern;
  }
  
  /**
   * Get emotional insights
   */
  getInsights(userId = null) {
    if (userId && this.userStates.has(userId)) {
      const userState = this.userStates.get(userId);
      const moodPattern = this.moodPatterns.get(userId);
      
      return {
        currentEmotion: userState.current,
        emotionalHistory: userState.history.slice(-10),
        mood: moodPattern ? moodPattern.current : null,
        trend: moodPattern ? moodPattern.trend : 'unknown',
        recommendations: this.generateEmotionalRecommendations(userState)
      };
    }
    
    // General insights
    return {
      recentEmotions: this.emotionalMemory.slice(-10),
      emotionDistribution: this.getEmotionDistribution(),
      averageIntensity: this.getAverageIntensity(),
      resonanceScore: this.metrics.resonanceScore
    };
  }
  
  // Empathy strategies
  
  /**
   * Mirror strategy - reflect the emotion
   */
  async mirrorStrategy(emotionProfile, content, context) {
    const adjustments = {
      tone: emotionProfile.primary,
      intensity: emotionProfile.intensity * 0.7, // Slightly less intense
      empathy: 'mirroring'
    };
    
    // Add emotional acknowledgment
    adjustments.acknowledgment = this.getAcknowledgment(emotionProfile.primary);
    
    return { content, adjustments };
  }
  
  /**
   * Complement strategy - provide complementary emotion
   */
  async complementStrategy(emotionProfile, content, context) {
    const complement = this.getComplementaryEmotion(emotionProfile.primary);
    
    const adjustments = {
      tone: complement,
      intensity: 0.6,
      empathy: 'complementing'
    };
    
    return { content, adjustments };
  }
  
  /**
   * Soothe strategy - calm negative emotions
   */
  async sootheStrategy(emotionProfile, content, context) {
    const adjustments = {
      tone: 'calm',
      intensity: 0.3,
      empathy: 'soothing',
      pace: 'slow',
      warmth: 0.8
    };
    
    // Add reassurance
    adjustments.reassurance = this.getReassurance(emotionProfile.primary);
    
    return { content, adjustments };
  }
  
  /**
   * Energize strategy - boost positive emotions
   */
  async energizeStrategy(emotionProfile, content, context) {
    const adjustments = {
      tone: 'energetic',
      intensity: 0.8,
      empathy: 'energizing',
      pace: 'dynamic',
      enthusiasm: 0.9
    };
    
    // Add encouragement
    adjustments.encouragement = this.getEncouragement(emotionProfile.primary);
    
    return { content, adjustments };
  }
  
  /**
   * Validate strategy - acknowledge and validate emotions
   */
  async validateStrategy(emotionProfile, content, context) {
    const adjustments = {
      tone: 'understanding',
      intensity: emotionProfile.intensity * 0.5,
      empathy: 'validating',
      validation: this.getValidation(emotionProfile.primary)
    };
    
    return { content, adjustments };
  }
  
  // Helper methods
  
  applyContextModifiers(score, emotion, context) {
    // Time of day affects emotions
    if (context.timeOfDay) {
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        // Late night/early morning - emotions more intense
        score *= 1.2;
      }
    }
    
    // Task frustration enhances negative emotions
    if (context.taskFrustration && ['anger', 'sadness', 'fear'].includes(emotion)) {
      score *= 1.3;
    }
    
    // Success enhances positive emotions
    if (context.taskSuccess && ['joy', 'trust', 'anticipation'].includes(emotion)) {
      score *= 1.3;
    }
    
    return score;
  }
  
  detectPrimaryEmotion(scores) {
    let maxScore = 0;
    let primaryEmotion = 'neutral';
    
    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion;
      }
    }
    
    return maxScore > this.config.sensitivityLevel * 0.1 ? primaryEmotion : 'neutral';
  }
  
  detectComplexEmotions(scores) {
    const detected = [];
    
    for (const [complex, components] of Object.entries(this.complexEmotions)) {
      let totalScore = 0;
      
      for (const component of components) {
        totalScore += scores[component] || 0;
      }
      
      if (totalScore / components.length > 0.3) {
        detected.push(complex);
      }
    }
    
    return detected;
  }
  
  calculateEmotionalState(scores) {
    let valence = 0, arousal = 0, dominance = 0;
    let totalWeight = 0;
    
    for (const [emotion, score] of Object.entries(scores)) {
      if (this.primaryEmotions[emotion] && score > 0) {
        const emotionVAD = this.primaryEmotions[emotion];
        valence += emotionVAD.valence * score;
        arousal += emotionVAD.arousal * score;
        dominance += emotionVAD.dominance * score;
        totalWeight += score;
      }
    }
    
    if (totalWeight > 0) {
      valence /= totalWeight;
      arousal /= totalWeight;
      dominance /= totalWeight;
    }
    
    return { valence, arousal, dominance };
  }
  
  calculateIntensity(text) {
    let intensity = 0.5;
    
    // Exclamation marks increase intensity
    const exclamations = (text.match(/!/g) || []).length;
    intensity += exclamations * 0.1;
    
    // All caps increases intensity
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    intensity += capsRatio * 0.3;
    
    // Repeated characters increase intensity
    const repetitions = (text.match(/(.)\1{2,}/g) || []).length;
    intensity += repetitions * 0.05;
    
    return Math.min(1, intensity);
  }
  
  calculateConfidence(scores) {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    
    // Higher max score = higher confidence
    const maxScore = Math.max(...values);
    
    // Lower variance = higher confidence
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.min(1, maxScore * (1 - variance));
  }
  
  updateUserState(userId, emotionProfile) {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        history: [],
        current: null,
        baseline: null
      });
    }
    
    const userState = this.userStates.get(userId);
    
    userState.current = emotionProfile;
    userState.history.push(emotionProfile);
    
    // Keep last N emotions
    if (userState.history.length > this.config.emotionalMemory) {
      userState.history.shift();
    }
    
    // Update baseline
    if (userState.history.length >= 5) {
      userState.baseline = this.calculateBaseline(userState.history);
    }
    
    // Track mood
    this.trackMood(userId, emotionProfile);
  }
  
  calculateBaseline(history) {
    const baseline = {
      valence: 0,
      arousal: 0,
      dominance: 0
    };
    
    for (const emotion of history) {
      baseline.valence += emotion.state.valence;
      baseline.arousal += emotion.state.arousal;
      baseline.dominance += emotion.state.dominance;
    }
    
    baseline.valence /= history.length;
    baseline.arousal /= history.length;
    baseline.dominance /= history.length;
    
    return baseline;
  }
  
  calculateMood(history) {
    if (history.length === 0) {
      return { valence: 0, arousal: 0, dominance: 0 };
    }
    
    let valence = 0, arousal = 0, dominance = 0;
    let totalWeight = 0;
    
    const now = Date.now();
    
    for (const entry of history) {
      // Recent emotions have more weight
      const age = now - entry.timestamp;
      const weight = Math.exp(-age / this.config.moodWindow);
      
      valence += entry.emotion.state.valence * weight;
      arousal += entry.emotion.state.arousal * weight;
      dominance += entry.emotion.state.dominance * weight;
      totalWeight += weight;
    }
    
    if (totalWeight > 0) {
      valence /= totalWeight;
      arousal /= totalWeight;
      dominance /= totalWeight;
    }
    
    return { valence, arousal, dominance };
  }
  
  detectMoodTrend(moodPattern) {
    if (moodPattern.history.length < 3) {
      return 'stable';
    }
    
    const recent = moodPattern.history.slice(-3);
    let trend = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].emotion.state.valence;
      const curr = recent[i].emotion.state.valence;
      trend += curr - prev;
    }
    
    if (trend > 0.2) return 'improving';
    if (trend < -0.2) return 'declining';
    return 'stable';
  }
  
  detectMoodShift(moodPattern) {
    if (!moodPattern.baseline) return false;
    
    const distance = Math.sqrt(
      Math.pow(moodPattern.current.valence - moodPattern.baseline.valence, 2) +
      Math.pow(moodPattern.current.arousal - moodPattern.baseline.arousal, 2) +
      Math.pow(moodPattern.current.dominance - moodPattern.baseline.dominance, 2)
    );
    
    return distance > 0.5;
  }
  
  selectEmpathyStrategy(emotionProfile) {
    const { primary, state } = emotionProfile;
    
    // Negative valence + high arousal = soothe
    if (state.valence < -0.3 && state.arousal > 0.5) {
      return 'soothe';
    }
    
    // Positive valence + low arousal = energize
    if (state.valence > 0.3 && state.arousal < 0.3) {
      return 'energize';
    }
    
    // Strong emotion = validate
    if (emotionProfile.intensity > 0.7) {
      return 'validate';
    }
    
    // Moderate emotion = mirror
    if (emotionProfile.intensity > 0.4) {
      return 'mirror';
    }
    
    // Default = complement
    return 'complement';
  }
  
  getComplementaryEmotion(emotion) {
    const complements = {
      joy: 'trust',
      sadness: 'joy',
      anger: 'trust',
      fear: 'trust',
      surprise: 'anticipation',
      disgust: 'trust',
      trust: 'joy',
      anticipation: 'joy'
    };
    
    return complements[emotion] || 'trust';
  }
  
  getAcknowledgment(emotion) {
    const acknowledgments = {
      joy: "I can sense your happiness!",
      sadness: "I understand this is difficult.",
      anger: "I hear your frustration.",
      fear: "I understand your concern.",
      surprise: "That is unexpected!",
      disgust: "I see why that's unpleasant.",
      trust: "I appreciate your confidence.",
      anticipation: "Your excitement is palpable!"
    };
    
    return acknowledgments[emotion] || "I understand.";
  }
  
  getReassurance(emotion) {
    const reassurances = {
      sadness: "Things will get better.",
      anger: "Let's work through this together.",
      fear: "You're safe, and I'm here to help.",
      disgust: "We can find a better solution."
    };
    
    return reassurances[emotion] || "Everything will be okay.";
  }
  
  getEncouragement(emotion) {
    const encouragements = {
      joy: "Keep up the great energy!",
      anticipation: "This is going to be amazing!",
      trust: "Your confidence is well-placed!"
    };
    
    return encouragements[emotion] || "You're doing great!";
  }
  
  getValidation(emotion) {
    const validations = {
      sadness: "It's okay to feel this way.",
      anger: "Your feelings are valid.",
      fear: "It's natural to feel concerned.",
      joy: "Your happiness is wonderful!",
      disgust: "Your reaction is understandable."
    };
    
    return validations[emotion] || "Your feelings are valid.";
  }
  
  addToEmotionalMemory(emotionProfile) {
    this.emotionalMemory.push(emotionProfile);
    
    if (this.emotionalMemory.length > 100) {
      this.emotionalMemory.shift();
    }
  }
  
  generateEmotionalRecommendations(userState) {
    const recommendations = [];
    
    if (userState.current) {
      const { state } = userState.current;
      
      if (state.valence < -0.5) {
        recommendations.push("Consider offering more support and encouragement");
      }
      
      if (state.arousal > 0.8) {
        recommendations.push("Help calm and focus the interaction");
      }
      
      if (state.dominance < -0.5) {
        recommendations.push("Empower with more control and options");
      }
    }
    
    return recommendations;
  }
  
  getEmotionDistribution() {
    const distribution = {};
    
    for (const emotion of this.emotionalMemory) {
      distribution[emotion.primary] = (distribution[emotion.primary] || 0) + 1;
    }
    
    return distribution;
  }
  
  getAverageIntensity() {
    if (this.emotionalMemory.length === 0) return 0;
    
    const total = this.emotionalMemory.reduce((sum, e) => sum + e.intensity, 0);
    return total / this.emotionalMemory.length;
  }
  
  neutralEmotion() {
    return {
      primary: 'neutral',
      complex: [],
      scores: {},
      state: { valence: 0, arousal: 0, dominance: 0 },
      intensity: 0,
      confidence: 0,
      timestamp: Date.now()
    };
  }
  
  /**
   * Start mood tracking loop
   */
  startMoodTracking() {
    setInterval(() => {
      // Update resonance score based on recent interactions
      if (this.emotionalMemory.length >= 10) {
        const recent = this.emotionalMemory.slice(-10);
        const avgConfidence = recent.reduce((sum, e) => sum + e.confidence, 0) / recent.length;
        this.metrics.resonanceScore = avgConfidence;
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      emotionalMemorySize: this.emotionalMemory.length,
      activeUsers: this.userStates.size,
      moodPatterns: this.moodPatterns.size,
      emotionDistribution: this.getEmotionDistribution()
    };
  }
}

module.exports = EmotionalIntelligence;