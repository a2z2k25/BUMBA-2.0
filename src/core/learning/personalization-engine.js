/**
 * BUMBA Personalization Engine
 * Deep user personalization with multi-dimensional profiling
 * Part of Human Learning Module Enhancement - Sprint 3
 * 
 * FRAMEWORK DESIGN:
 * - Multi-dimensional user profiling
 * - Preference evolution tracking
 * - Context-aware personalization
 * - Works without external dependencies
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Personalization Engine for deep user customization
 */
class PersonalizationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dimensions: config.dimensions || 10,
      evolutionRate: config.evolutionRate || 0.05,
      contextWeight: config.contextWeight || 0.3,
      historyDepth: config.historyDepth || 100,
      minConfidence: config.minConfidence || 0.6,
      adaptationSpeed: config.adaptationSpeed || 0.1,
      ...config
    };
    
    // User profiles with multi-dimensional representation
    this.profiles = new Map();
    this.activeProfile = null;
    
    // Personalization dimensions
    this.dimensions = {
      technical: { min: 0, max: 1, current: 0.5 },      // Technical expertise level
      verbose: { min: 0, max: 1, current: 0.5 },        // Communication verbosity
      formal: { min: 0, max: 1, current: 0.5 },         // Formality level
      creative: { min: 0, max: 1, current: 0.5 },       // Creativity preference
      risktaking: { min: 0, max: 1, current: 0.5 },     // Risk tolerance
      speed: { min: 0, max: 1, current: 0.5 },          // Pace preference
      detail: { min: 0, max: 1, current: 0.5 },         // Detail orientation
      visual: { min: 0, max: 1, current: 0.5 },         // Visual learning preference
      collaborative: { min: 0, max: 1, current: 0.5 },  // Collaboration preference
      autonomous: { min: 0, max: 1, current: 0.5 }      // Autonomy preference
    };
    
    // Preference clusters
    this.clusters = new Map();
    
    // Context mappings
    this.contextMappings = new Map();
    
    // Evolution tracking
    this.evolutionHistory = [];
    
    // Personalization strategies
    this.strategies = {
      conservative: this.conservativeStrategy.bind(this),
      aggressive: this.aggressiveStrategy.bind(this),
      balanced: this.balancedStrategy.bind(this),
      contextual: this.contextualStrategy.bind(this)
    };
    
    // Active strategy
    this.activeStrategy = 'balanced';
    
    // Metrics
    this.metrics = {
      profilesCreated: 0,
      personalizations: 0,
      evolutionSteps: 0,
      accuracy: 0,
      satisfaction: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize personalization engine
   */
  async initialize() {
    try {
      // Initialize default clusters
      this.initializeClusters();
      
      // Start evolution loop
      this.startEvolutionLoop();
      
      logger.info('👤 Personalization Engine initialized');
      
      this.emit('initialized', {
        dimensions: Object.keys(this.dimensions),
        strategies: Object.keys(this.strategies),
        activeStrategy: this.activeStrategy
      });
      
    } catch (error) {
      logger.error('Failed to initialize Personalization Engine:', error);
    }
  }
  
  /**
   * Initialize preference clusters
   */
  initializeClusters() {
    // Developer cluster
    this.clusters.set('developer', {
      technical: 0.8,
      verbose: 0.3,
      formal: 0.3,
      creative: 0.6,
      risktaking: 0.4,
      speed: 0.7,
      detail: 0.8,
      visual: 0.4,
      collaborative: 0.5,
      autonomous: 0.7
    });
    
    // Designer cluster
    this.clusters.set('designer', {
      technical: 0.4,
      verbose: 0.5,
      formal: 0.4,
      creative: 0.9,
      risktaking: 0.6,
      speed: 0.6,
      detail: 0.7,
      visual: 0.9,
      collaborative: 0.7,
      autonomous: 0.5
    });
    
    // Manager cluster
    this.clusters.set('manager', {
      technical: 0.5,
      verbose: 0.7,
      formal: 0.7,
      creative: 0.5,
      risktaking: 0.3,
      speed: 0.5,
      detail: 0.6,
      visual: 0.6,
      collaborative: 0.8,
      autonomous: 0.4
    });
    
    // Learner cluster
    this.clusters.set('learner', {
      technical: 0.3,
      verbose: 0.8,
      formal: 0.5,
      creative: 0.5,
      risktaking: 0.3,
      speed: 0.3,
      detail: 0.8,
      visual: 0.7,
      collaborative: 0.6,
      autonomous: 0.3
    });
  }
  
  /**
   * Create or get user profile
   */
  async createProfile(userId, initialData = {}) {
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId);
    }
    
    const profile = {
      id: userId,
      created: Date.now(),
      lastUpdated: Date.now(),
      dimensions: { ...this.dimensions },
      cluster: this.detectCluster(initialData),
      context: {},
      history: [],
      preferences: initialData.preferences || {},
      metadata: {
        interactions: 0,
        satisfaction: 0.5,
        consistency: 1.0
      }
    };
    
    // Apply cluster defaults if detected
    if (profile.cluster) {
      this.applyClusterDefaults(profile);
    }
    
    this.profiles.set(userId, profile);
    this.metrics.profilesCreated++;
    
    this.emit('profile-created', profile);
    
    return profile;
  }
  
  /**
   * Personalize response based on profile
   */
  async personalize(userId, content, context = {}) {
    try {
      // Get or create profile
      const profile = await this.getProfile(userId);
      
      // Update profile from context
      this.updateFromContext(profile, context);
      
      // Apply personalization strategy
      const strategy = this.strategies[this.activeStrategy];
      const personalized = await strategy(profile, content, context);
      
      // Track personalization
      this.trackPersonalization(profile, personalized);
      
      // Update metrics
      this.metrics.personalizations++;
      
      this.emit('content-personalized', {
        userId,
        strategy: this.activeStrategy,
        dimensions: this.extractActiveDimensions(profile),
        confidence: personalized.confidence
      });
      
      return personalized;
      
    } catch (error) {
      logger.error('Personalization failed:', error);
      return this.defaultPersonalization(content);
    }
  }
  
  /**
   * Update profile based on feedback
   */
  async updateProfile(userId, feedback) {
    const profile = await this.getProfile(userId);
    
    // Calculate dimension adjustments
    const adjustments = this.calculateAdjustments(feedback);
    
    // Apply adjustments with evolution rate
    for (const [dimension, adjustment] of Object.entries(adjustments)) {
      if (profile.dimensions[dimension]) {
        const current = profile.dimensions[dimension].current;
        const newValue = current + (adjustment * this.config.evolutionRate);
        
        // Clamp to valid range
        profile.dimensions[dimension].current = Math.max(0, Math.min(1, newValue));
      }
    }
    
    // Update metadata
    profile.lastUpdated = Date.now();
    profile.metadata.interactions++;
    
    // Update satisfaction
    if (feedback.satisfaction !== undefined) {
      profile.metadata.satisfaction = 
        profile.metadata.satisfaction * 0.9 + feedback.satisfaction * 0.1;
    }
    
    // Add to history
    profile.history.push({
      timestamp: Date.now(),
      feedback,
      adjustments,
      dimensions: { ...profile.dimensions }
    });
    
    // Maintain history size
    if (profile.history.length > this.config.historyDepth) {
      profile.history.shift();
    }
    
    // Check for cluster migration
    const newCluster = this.detectClusterFromDimensions(profile.dimensions);
    if (newCluster !== profile.cluster) {
      profile.cluster = newCluster;
      this.emit('cluster-migration', { userId, from: profile.cluster, to: newCluster });
    }
    
    // Track evolution
    this.trackEvolution(profile);
    
    this.emit('profile-updated', profile);
    
    return profile;
  }
  
  /**
   * Get personalization insights
   */
  getInsights(userId) {
    const profile = this.profiles.get(userId);
    
    if (!profile) {
      return null;
    }
    
    return {
      cluster: profile.cluster,
      dimensions: this.extractActiveDimensions(profile),
      evolution: this.analyzeEvolution(profile),
      consistency: this.calculateConsistency(profile),
      recommendations: this.generateRecommendations(profile)
    };
  }
  
  /**
   * Conservative personalization strategy
   */
  async conservativeStrategy(profile, content, context) {
    // Minimal changes, high confidence required
    const personalized = {
      content,
      adjustments: {},
      confidence: 0.9
    };
    
    // Only apply high-confidence personalizations
    for (const [dim, config] of Object.entries(profile.dimensions)) {
      if (Math.abs(config.current - 0.5) > 0.3) {
        personalized.adjustments[dim] = config.current;
      }
    }
    
    return this.applyAdjustments(personalized);
  }
  
  /**
   * Aggressive personalization strategy
   */
  async aggressiveStrategy(profile, content, context) {
    // Maximum personalization
    const personalized = {
      content,
      adjustments: {},
      confidence: 0.7
    };
    
    // Apply all dimension personalizations
    for (const [dim, config] of Object.entries(profile.dimensions)) {
      personalized.adjustments[dim] = config.current;
    }
    
    return this.applyAdjustments(personalized);
  }
  
  /**
   * Balanced personalization strategy
   */
  async balancedStrategy(profile, content, context) {
    // Balanced approach
    const personalized = {
      content,
      adjustments: {},
      confidence: 0.8
    };
    
    // Apply moderate personalizations
    for (const [dim, config] of Object.entries(profile.dimensions)) {
      if (Math.abs(config.current - 0.5) > 0.2) {
        // Apply with dampening
        const adjustment = 0.5 + (config.current - 0.5) * 0.7;
        personalized.adjustments[dim] = adjustment;
      }
    }
    
    return this.applyAdjustments(personalized);
  }
  
  /**
   * Contextual personalization strategy
   */
  async contextualStrategy(profile, content, context) {
    // Context-aware personalization
    const personalized = {
      content,
      adjustments: {},
      confidence: 0.85
    };
    
    // Weight dimensions by context relevance
    const contextWeights = this.calculateContextWeights(context);
    
    for (const [dim, config] of Object.entries(profile.dimensions)) {
      const weight = contextWeights[dim] || 0.5;
      if (weight > 0.3) {
        personalized.adjustments[dim] = 
          0.5 + (config.current - 0.5) * weight;
      }
    }
    
    return this.applyAdjustments(personalized);
  }
  
  /**
   * Apply adjustments to content
   */
  applyAdjustments(personalized) {
    const { content, adjustments } = personalized;
    
    // Apply verbosity adjustment
    if (adjustments.verbose !== undefined) {
      personalized.verbosity = adjustments.verbose > 0.5 ? 'detailed' : 'concise';
    }
    
    // Apply formality adjustment
    if (adjustments.formal !== undefined) {
      personalized.formality = adjustments.formal > 0.5 ? 'formal' : 'casual';
    }
    
    // Apply technical level
    if (adjustments.technical !== undefined) {
      personalized.technicalLevel = 
        adjustments.technical > 0.7 ? 'expert' :
        adjustments.technical > 0.4 ? 'intermediate' : 'beginner';
    }
    
    // Apply detail level
    if (adjustments.detail !== undefined) {
      personalized.detailLevel = adjustments.detail > 0.5 ? 'comprehensive' : 'overview';
    }
    
    // Apply speed preference
    if (adjustments.speed !== undefined) {
      personalized.pace = adjustments.speed > 0.5 ? 'fast' : 'measured';
    }
    
    return personalized;
  }
  
  // Helper methods
  
  async getProfile(userId) {
    if (!this.profiles.has(userId)) {
      return this.createProfile(userId);
    }
    return this.profiles.get(userId);
  }
  
  detectCluster(data) {
    // Simple cluster detection based on initial data
    if (data.role) {
      const roleMap = {
        developer: 'developer',
        designer: 'designer',
        manager: 'manager',
        student: 'learner'
      };
      return roleMap[data.role.toLowerCase()] || null;
    }
    return null;
  }
  
  applyClusterDefaults(profile) {
    const clusterDefaults = this.clusters.get(profile.cluster);
    if (clusterDefaults) {
      for (const [dim, value] of Object.entries(clusterDefaults)) {
        if (profile.dimensions[dim]) {
          profile.dimensions[dim].current = value;
        }
      }
    }
  }
  
  updateFromContext(profile, context) {
    // Update profile dimensions based on context
    if (context.timeOfDay) {
      const hour = new Date().getHours();
      // Adjust speed based on time
      if (hour < 9 || hour > 21) {
        profile.dimensions.speed.current *= 0.8; // Slower during off-hours
      }
    }
    
    if (context.taskComplexity) {
      // Adjust detail based on complexity
      profile.dimensions.detail.current = 
        0.5 + (context.taskComplexity - 0.5) * 0.5;
    }
    
    profile.context = context;
  }
  
  calculateAdjustments(feedback) {
    const adjustments = {};
    
    // Map feedback to dimension adjustments
    if (feedback.tooVerbose) {
      adjustments.verbose = -0.2;
    } else if (feedback.tooTerse) {
      adjustments.verbose = 0.2;
    }
    
    if (feedback.tooTechnical) {
      adjustments.technical = -0.2;
    } else if (feedback.tooSimple) {
      adjustments.technical = 0.2;
    }
    
    if (feedback.tooFast) {
      adjustments.speed = -0.2;
    } else if (feedback.tooSlow) {
      adjustments.speed = 0.2;
    }
    
    if (feedback.needMoreDetail) {
      adjustments.detail = 0.2;
    } else if (feedback.tooDetailed) {
      adjustments.detail = -0.2;
    }
    
    return adjustments;
  }
  
  extractActiveDimensions(profile) {
    const active = {};
    
    for (const [dim, config] of Object.entries(profile.dimensions)) {
      if (Math.abs(config.current - 0.5) > 0.15) {
        active[dim] = config.current;
      }
    }
    
    return active;
  }
  
  detectClusterFromDimensions(dimensions) {
    let bestCluster = null;
    let bestDistance = Infinity;
    
    for (const [cluster, template] of this.clusters) {
      let distance = 0;
      
      for (const [dim, value] of Object.entries(template)) {
        if (dimensions[dim]) {
          distance += Math.pow(dimensions[dim].current - value, 2);
        }
      }
      
      distance = Math.sqrt(distance);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestCluster = cluster;
      }
    }
    
    return bestCluster;
  }
  
  calculateContextWeights(context) {
    const weights = {};
    
    // High complexity tasks need more technical and detail
    if (context.complexity > 0.7) {
      weights.technical = 0.8;
      weights.detail = 0.8;
    }
    
    // Urgent tasks need more speed, less detail
    if (context.urgency > 0.7) {
      weights.speed = 0.9;
      weights.detail = 0.3;
    }
    
    // Collaborative tasks
    if (context.teamSize > 1) {
      weights.collaborative = 0.8;
      weights.formal = 0.6;
    }
    
    return weights;
  }
  
  trackPersonalization(profile, personalized) {
    // Track what personalizations were applied
    const tracking = {
      timestamp: Date.now(),
      adjustments: personalized.adjustments,
      confidence: personalized.confidence
    };
    
    if (!profile.personalizations) {
      profile.personalizations = [];
    }
    
    profile.personalizations.push(tracking);
    
    // Keep last 50
    if (profile.personalizations.length > 50) {
      profile.personalizations.shift();
    }
  }
  
  trackEvolution(profile) {
    this.evolutionHistory.push({
      userId: profile.id,
      timestamp: Date.now(),
      dimensions: { ...profile.dimensions },
      cluster: profile.cluster
    });
    
    // Keep last 1000 evolution steps
    if (this.evolutionHistory.length > 1000) {
      this.evolutionHistory.shift();
    }
    
    this.metrics.evolutionSteps++;
  }
  
  analyzeEvolution(profile) {
    if (profile.history.length < 10) {
      return { trend: 'insufficient data' };
    }
    
    const recent = profile.history.slice(-10);
    const older = profile.history.slice(-20, -10);
    
    const trends = {};
    
    for (const dim of Object.keys(this.dimensions)) {
      const recentAvg = recent.reduce((sum, h) => 
        sum + (h.dimensions[dim]?.current || 0.5), 0) / recent.length;
      
      const olderAvg = older.length > 0 ?
        older.reduce((sum, h) => 
          sum + (h.dimensions[dim]?.current || 0.5), 0) / older.length : 0.5;
      
      const change = recentAvg - olderAvg;
      
      if (Math.abs(change) > 0.05) {
        trends[dim] = change > 0 ? 'increasing' : 'decreasing';
      }
    }
    
    return {
      trends,
      stability: Object.keys(trends).length < 3 ? 'stable' : 'evolving'
    };
  }
  
  calculateConsistency(profile) {
    if (profile.history.length < 5) {
      return 1.0;
    }
    
    const recent = profile.history.slice(-5);
    let variance = 0;
    
    for (const dim of Object.keys(this.dimensions)) {
      const values = recent.map(h => h.dimensions[dim]?.current || 0.5);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      variance += Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
    }
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - variance / Object.keys(this.dimensions).length);
  }
  
  generateRecommendations(profile) {
    const recommendations = [];
    
    // Check for extreme dimensions
    for (const [dim, config] of Object.entries(profile.dimensions)) {
      if (config.current > 0.85) {
        recommendations.push(`Very high ${dim} preference detected`);
      } else if (config.current < 0.15) {
        recommendations.push(`Very low ${dim} preference detected`);
      }
    }
    
    // Check consistency
    const consistency = this.calculateConsistency(profile);
    if (consistency < 0.5) {
      recommendations.push('Profile showing high variability - consider stabilization');
    }
    
    // Check satisfaction
    if (profile.metadata.satisfaction < 0.4) {
      recommendations.push('Low satisfaction - consider adjusting personalization strategy');
    }
    
    return recommendations;
  }
  
  defaultPersonalization(content) {
    return {
      content,
      adjustments: {},
      verbosity: 'balanced',
      formality: 'neutral',
      technicalLevel: 'intermediate',
      detailLevel: 'moderate',
      pace: 'normal',
      confidence: 0.5
    };
  }
  
  /**
   * Start evolution loop
   */
  startEvolutionLoop() {
    setInterval(() => {
      // Gradual drift toward defaults for inactive profiles
      for (const profile of this.profiles.values()) {
        const timeSinceUpdate = Date.now() - profile.lastUpdated;
        
        // If inactive for > 1 hour, drift toward center
        if (timeSinceUpdate > 3600000) {
          for (const config of Object.values(profile.dimensions)) {
            const drift = (0.5 - config.current) * 0.01;
            config.current += drift;
          }
        }
      }
    }, 60000); // Every minute
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      profileCount: this.profiles.size,
      clusterDistribution: this.getClusterDistribution(),
      averageSatisfaction: this.getAverageSatisfaction(),
      activeStrategy: this.activeStrategy
    };
  }
  
  getClusterDistribution() {
    const distribution = {};
    
    for (const profile of this.profiles.values()) {
      distribution[profile.cluster] = (distribution[profile.cluster] || 0) + 1;
    }
    
    return distribution;
  }
  
  getAverageSatisfaction() {
    if (this.profiles.size === 0) return 0;
    
    let total = 0;
    for (const profile of this.profiles.values()) {
      total += profile.metadata.satisfaction;
    }
    
    return total / this.profiles.size;
  }
}

module.exports = PersonalizationEngine;