/**
 * BUMBA Community Learning Module
 * Learn from collective user interactions without external servers
 * Part of Human Learning Module Enhancement - Sprint 4
 * 
 * FRAMEWORK DESIGN:
 * - Local federated learning simulation
 * - Pattern aggregation across users
 * - Collaborative intelligence
 * - Works without external federation servers
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../logging/bumba-logger');

/**
 * Community Learning for collective intelligence
 */
class CommunityLearning extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      aggregationThreshold: config.aggregationThreshold || 10, // Min users for pattern
      learningRate: config.learningRate || 0.1,
      consensusThreshold: config.consensusThreshold || 0.7,
      patternSharing: config.patternSharing !== false,
      modelMergeInterval: config.modelMergeInterval || 3600000, // 1 hour
      localModelPath: config.localModelPath || path.join(process.env.HOME, '.claude', 'community-models'),
      maxContributors: config.maxContributors || 100,
      ...config
    };
    
    // Community knowledge base
    this.communityKnowledge = {
      patterns: new Map(),
      behaviors: new Map(),
      preferences: new Map(),
      solutions: new Map(),
      errors: new Map()
    };
    
    // Local models (simulating federated nodes)
    this.localModels = new Map();
    
    // Global model (aggregated knowledge)
    this.globalModel = {
      patterns: {},
      weights: {},
      consensus: {},
      version: 1,
      lastUpdate: Date.now()
    };
    
    // Contribution tracking
    this.contributions = new Map();
    
    // Pattern detection
    this.patternDetectors = {
      workflow: this.detectWorkflowPatterns.bind(this),
      error: this.detectErrorPatterns.bind(this),
      success: this.detectSuccessPatterns.bind(this),
      preference: this.detectPreferencePatterns.bind(this),
      collaboration: this.detectCollaborationPatterns.bind(this)
    };
    
    // Knowledge domains
    this.domains = {
      technical: { weight: 1.0, patterns: [] },
      creative: { weight: 1.0, patterns: [] },
      analytical: { weight: 1.0, patterns: [] },
      collaborative: { weight: 1.0, patterns: [] },
      educational: { weight: 1.0, patterns: [] }
    };
    
    // Federated learning simulation
    this.federatedQueue = [];
    this.mergeHistory = [];
    
    // Metrics
    this.metrics = {
      patternsLearned: 0,
      contributionsReceived: 0,
      modelsAggregated: 0,
      consensusReached: 0,
      knowledgeShared: 0,
      improvementRate: 0
    };
    
    this.initialize();
  }
  
  /**
   * Initialize community learning
   */
  async initialize() {
    try {
      // Create local model directory
      await fs.mkdir(this.config.localModelPath, { recursive: true });
      
      // Load existing community knowledge
      await this.loadCommunityKnowledge();
      
      // Start aggregation loop
      this.startAggregationLoop();
      
      // Start pattern detection
      this.startPatternDetection();
      
      logger.info('🟢 Community Learning initialized');
      
      this.emit('initialized', {
        domains: Object.keys(this.domains),
        detectors: Object.keys(this.patternDetectors),
        contributors: this.contributions.size
      });
      
    } catch (error) {
      logger.error('Failed to initialize Community Learning:', error);
    }
  }
  
  /**
   * Contribute learning from user interaction
   */
  async contribute(userId, interaction, outcome) {
    try {
      // Create local model for user if needed
      if (!this.localModels.has(userId)) {
        this.localModels.set(userId, this.createLocalModel(userId));
      }
      
      const localModel = this.localModels.get(userId);
      
      // Update local model
      this.updateLocalModel(localModel, interaction, outcome);
      
      // Extract patterns
      const patterns = await this.extractPatterns(interaction, outcome);
      
      // Add to federated queue
      this.federatedQueue.push({
        userId,
        patterns,
        timestamp: Date.now(),
        outcome,
        confidence: this.calculateConfidence(outcome)
      });
      
      // Track contribution
      this.trackContribution(userId, patterns);
      
      // Check for immediate consensus
      const consensus = await this.checkConsensus(patterns);
      
      if (consensus) {
        await this.updateGlobalModel(patterns, consensus);
      }
      
      this.metrics.contributionsReceived++;
      
      this.emit('contribution-received', {
        userId,
        patterns: patterns.length,
        consensus: consensus !== null
      });
      
      return {
        accepted: true,
        patterns: patterns.length,
        consensus,
        localModel: localModel.version
      };
      
    } catch (error) {
      logger.error('Failed to process contribution:', error);
      return { accepted: false, error: error.message };
    }
  }
  
  /**
   * Learn from community patterns
   */
  async learnFromCommunity(context) {
    try {
      // Get relevant patterns
      const relevantPatterns = await this.getRelevantPatterns(context);
      
      // Aggregate community knowledge
      const aggregated = this.aggregateKnowledge(relevantPatterns);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(aggregated, context);
      
      // Apply domain weights
      const weighted = this.applyDomainWeights(recommendations, context);
      
      // Track learning
      this.metrics.knowledgeShared++;
      
      return {
        patterns: relevantPatterns,
        recommendations: weighted,
        confidence: this.calculateCommunityConfidence(relevantPatterns),
        contributors: this.getContributorCount(relevantPatterns)
      };
      
    } catch (error) {
      logger.error('Failed to learn from community:', error);
      return { patterns: [], recommendations: [], confidence: 0 };
    }
  }
  
  /**
   * Share pattern with community
   */
  async sharePattern(pattern, metadata = {}) {
    try {
      const patternId = this.generatePatternId(pattern);
      
      // Validate pattern
      if (!this.validatePattern(pattern)) {
        return { shared: false, reason: 'Invalid pattern structure' };
      }
      
      // Check if pattern exists
      let communityPattern = this.communityKnowledge.patterns.get(patternId);
      
      if (!communityPattern) {
        communityPattern = {
          id: patternId,
          pattern,
          metadata,
          occurrences: 0,
          confidence: 0,
          contributors: new Set(),
          domains: [],
          created: Date.now()
        };
        
        this.communityKnowledge.patterns.set(patternId, communityPattern);
      }
      
      // Update pattern
      communityPattern.occurrences++;
      communityPattern.confidence = this.updateConfidence(communityPattern);
      
      if (metadata.userId) {
        communityPattern.contributors.add(metadata.userId);
      }
      
      // Classify into domains
      communityPattern.domains = this.classifyDomains(pattern);
      
      this.metrics.patternsLearned++;
      
      this.emit('pattern-shared', {
        patternId,
        occurrences: communityPattern.occurrences,
        contributors: communityPattern.contributors.size
      });
      
      return {
        shared: true,
        patternId,
        occurrences: communityPattern.occurrences,
        confidence: communityPattern.confidence
      };
      
    } catch (error) {
      logger.error('Failed to share pattern:', error);
      return { shared: false, error: error.message };
    }
  }
  
  /**
   * Get community insights
   */
  async getInsights(domain = null) {
    try {
      const insights = {
        topPatterns: await this.getTopPatterns(domain),
        commonWorkflows: await this.getCommonWorkflows(),
        errorPatterns: await this.getErrorPatterns(),
        successFactors: await this.getSuccessFactors(),
        collaborationStyles: await this.getCollaborationStyles(),
        improvementTrends: this.getImprovementTrends()
      };
      
      if (domain && this.domains[domain]) {
        insights.domainSpecific = {
          patterns: this.domains[domain].patterns,
          weight: this.domains[domain].weight,
          contributors: this.getDomainContributors(domain)
        };
      }
      
      return insights;
      
    } catch (error) {
      logger.error('Failed to get community insights:', error);
      return {};
    }
  }
  
  // Pattern detection methods
  
  async detectWorkflowPatterns(interactions) {
    const patterns = [];
    
    // Sequence analysis
    for (let i = 0; i < interactions.length - 2; i++) {
      const sequence = interactions.slice(i, i + 3);
      const pattern = {
        type: 'workflow',
        sequence: sequence.map(i => i.action),
        frequency: 1,
        avgDuration: sequence.reduce((sum, i) => sum + (i.duration || 0), 0) / 3
      };
      
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  async detectErrorPatterns(interactions) {
    const patterns = [];
    
    const errors = interactions.filter(i => i.error);
    
    for (const error of errors) {
      const pattern = {
        type: 'error',
        errorType: error.errorType || 'unknown',
        context: error.context,
        frequency: 1,
        resolution: error.resolution
      };
      
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  async detectSuccessPatterns(interactions) {
    const patterns = [];
    
    const successes = interactions.filter(i => i.success);
    
    for (const success of successes) {
      const pattern = {
        type: 'success',
        action: success.action,
        factors: success.factors || [],
        duration: success.duration,
        efficiency: success.efficiency || 1.0
      };
      
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  async detectPreferencePatterns(interactions) {
    const patterns = [];
    
    // Analyze choices and preferences
    const preferences = {};
    
    for (const interaction of interactions) {
      if (interaction.choice) {
        const key = `${interaction.context}_${interaction.choice}`;
        preferences[key] = (preferences[key] || 0) + 1;
      }
    }
    
    for (const [key, count] of Object.entries(preferences)) {
      if (count > 1) {
        const [context, choice] = key.split('_');
        patterns.push({
          type: 'preference',
          context,
          choice,
          frequency: count
        });
      }
    }
    
    return patterns;
  }
  
  async detectCollaborationPatterns(interactions) {
    const patterns = [];
    
    const collaborations = interactions.filter(i => i.collaborative);
    
    for (const collab of collaborations) {
      const pattern = {
        type: 'collaboration',
        style: collab.style || 'cooperative',
        participants: collab.participants || 1,
        effectiveness: collab.effectiveness || 1.0
      };
      
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  // Helper methods
  
  createLocalModel(userId) {
    return {
      userId,
      version: 1,
      patterns: [],
      weights: {},
      history: [],
      created: Date.now(),
      lastUpdate: Date.now()
    };
  }
  
  updateLocalModel(model, interaction, outcome) {
    // Add to history
    model.history.push({
      interaction,
      outcome,
      timestamp: Date.now()
    });
    
    // Keep last 100 interactions
    if (model.history.length > 100) {
      model.history.shift();
    }
    
    // Update weights based on outcome
    const success = outcome.success || false;
    const weight = success ? 1.1 : 0.9;
    
    if (interaction.action) {
      model.weights[interaction.action] = (model.weights[interaction.action] || 1.0) * weight;
    }
    
    model.lastUpdate = Date.now();
    model.version++;
  }
  
  async extractPatterns(interaction, outcome) {
    const patterns = [];
    
    // Run all pattern detectors
    for (const [name, detector] of Object.entries(this.patternDetectors)) {
      const detected = await detector([interaction]);
      patterns.push(...detected);
    }
    
    return patterns;
  }
  
  calculateConfidence(outcome) {
    let confidence = 0.5;
    
    if (outcome.success) confidence += 0.2;
    if (outcome.efficiency > 0.8) confidence += 0.1;
    if (outcome.userSatisfaction > 0.8) confidence += 0.1;
    if (outcome.errorRate < 0.1) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }
  
  trackContribution(userId, patterns) {
    if (!this.contributions.has(userId)) {
      this.contributions.set(userId, {
        count: 0,
        patterns: [],
        quality: 1.0,
        lastContribution: Date.now()
      });
    }
    
    const contribution = this.contributions.get(userId);
    contribution.count++;
    contribution.patterns.push(...patterns.map(p => p.type));
    contribution.lastContribution = Date.now();
    
    // Update quality based on pattern acceptance
    const acceptanceRate = patterns.filter(p => p.accepted).length / patterns.length;
    contribution.quality = contribution.quality * 0.9 + acceptanceRate * 0.1;
  }
  
  async checkConsensus(patterns) {
    const consensus = {};
    
    for (const pattern of patterns) {
      const patternId = this.generatePatternId(pattern);
      const communityPattern = this.communityKnowledge.patterns.get(patternId);
      
      if (communityPattern && communityPattern.contributors.size >= this.config.aggregationThreshold) {
        const confidence = communityPattern.confidence;
        
        if (confidence >= this.config.consensusThreshold) {
          consensus[patternId] = {
            pattern,
            confidence,
            contributors: communityPattern.contributors.size
          };
          
          this.metrics.consensusReached++;
        }
      }
    }
    
    return Object.keys(consensus).length > 0 ? consensus : null;
  }
  
  async updateGlobalModel(patterns, consensus) {
    // Update global model with consensus patterns
    for (const [patternId, data] of Object.entries(consensus)) {
      this.globalModel.patterns[patternId] = data.pattern;
      this.globalModel.consensus[patternId] = data.confidence;
    }
    
    // Update weights
    this.updateGlobalWeights(patterns);
    
    this.globalModel.version++;
    this.globalModel.lastUpdate = Date.now();
    
    // Track merge
    this.mergeHistory.push({
      timestamp: Date.now(),
      patterns: Object.keys(consensus).length,
      version: this.globalModel.version
    });
    
    this.metrics.modelsAggregated++;
    
    // Persist global model
    await this.saveGlobalModel();
  }
  
  updateGlobalWeights(patterns) {
    for (const pattern of patterns) {
      const key = `${pattern.type}_${pattern.action || 'default'}`;
      
      if (!this.globalModel.weights[key]) {
        this.globalModel.weights[key] = 1.0;
      }
      
      // Adaptive learning rate
      const learningRate = this.config.learningRate / Math.sqrt(this.globalModel.version);
      
      // Update weight based on pattern success
      const success = pattern.outcome?.success ? 1 : 0;
      this.globalModel.weights[key] += learningRate * (success - 0.5);
      
      // Normalize weights
      this.globalModel.weights[key] = Math.max(0.1, Math.min(2.0, this.globalModel.weights[key]));
    }
  }
  
  async getRelevantPatterns(context) {
    const relevant = [];
    
    for (const [patternId, pattern] of this.communityKnowledge.patterns) {
      // Check relevance based on context
      const relevance = this.calculateRelevance(pattern, context);
      
      if (relevance > 0.5) {
        relevant.push({
          ...pattern,
          relevance
        });
      }
    }
    
    // Sort by relevance and confidence
    relevant.sort((a, b) => (b.relevance * b.confidence) - (a.relevance * a.confidence));
    
    return relevant.slice(0, 20); // Top 20 patterns
  }
  
  calculateRelevance(pattern, context) {
    let relevance = 0;
    
    // Domain match
    if (context.domain && pattern.domains.includes(context.domain)) {
      relevance += 0.3;
    }
    
    // Context similarity
    if (pattern.metadata?.context) {
      const similarity = this.calculateContextSimilarity(pattern.metadata.context, context);
      relevance += similarity * 0.4;
    }
    
    // Recency
    const age = Date.now() - pattern.created;
    const recencyScore = Math.exp(-age / (7 * 24 * 3600000)); // Decay over 7 days
    relevance += recencyScore * 0.3;
    
    return relevance;
  }
  
  calculateContextSimilarity(context1, context2) {
    // Simple similarity based on matching keys
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    
    const commonKeys = keys1.filter(k => keys2.includes(k));
    
    if (commonKeys.length === 0) return 0;
    
    let matches = 0;
    for (const key of commonKeys) {
      if (context1[key] === context2[key]) {
        matches++;
      }
    }
    
    return matches / Math.max(keys1.length, keys2.length);
  }
  
  aggregateKnowledge(patterns) {
    const aggregated = {
      actions: {},
      preferences: {},
      workflows: [],
      solutions: []
    };
    
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'workflow':
          aggregated.workflows.push(pattern);
          break;
        case 'preference':
          aggregated.preferences[pattern.context] = pattern.choice;
          break;
        case 'success':
          aggregated.actions[pattern.action] = pattern;
          break;
        case 'error':
          aggregated.solutions.push({
            error: pattern.errorType,
            solution: pattern.resolution
          });
          break;
      }
    }
    
    return aggregated;
  }
  
  generateRecommendations(aggregated, context) {
    const recommendations = [];
    
    // Workflow recommendations
    for (const workflow of aggregated.workflows) {
      if (workflow.relevance > 0.7) {
        recommendations.push({
          type: 'workflow',
          suggestion: `Consider workflow: ${workflow.sequence.join(' → ')}`,
          confidence: workflow.confidence
        });
      }
    }
    
    // Action recommendations
    for (const [action, data] of Object.entries(aggregated.actions)) {
      if (data.efficiency > 0.8) {
        recommendations.push({
          type: 'action',
          suggestion: `Action "${action}" has high success rate`,
          confidence: data.confidence
        });
      }
    }
    
    // Solution recommendations
    for (const solution of aggregated.solutions) {
      if (solution.solution) {
        recommendations.push({
          type: 'solution',
          suggestion: `For ${solution.error}: ${solution.solution}`,
          confidence: 0.8
        });
      }
    }
    
    return recommendations;
  }
  
  applyDomainWeights(recommendations, context) {
    if (!context.domain || !this.domains[context.domain]) {
      return recommendations;
    }
    
    const domainWeight = this.domains[context.domain].weight;
    
    return recommendations.map(rec => ({
      ...rec,
      confidence: rec.confidence * domainWeight
    }));
  }
  
  calculateCommunityConfidence(patterns) {
    if (patterns.length === 0) return 0;
    
    const totalConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0);
    const avgConfidence = totalConfidence / patterns.length;
    
    // Factor in number of contributors
    const contributorFactor = Math.min(1, this.contributions.size / 10);
    
    return avgConfidence * contributorFactor;
  }
  
  getContributorCount(patterns) {
    const contributors = new Set();
    
    for (const pattern of patterns) {
      if (pattern.contributors) {
        pattern.contributors.forEach(c => contributors.add(c));
      }
    }
    
    return contributors.size;
  }
  
  generatePatternId(pattern) {
    const str = JSON.stringify({
      type: pattern.type,
      action: pattern.action,
      context: pattern.context
    });
    
    return crypto.createHash('md5').update(str).digest('hex');
  }
  
  validatePattern(pattern) {
    return pattern.type && (pattern.action || pattern.sequence || pattern.errorType);
  }
  
  updateConfidence(pattern) {
    const base = pattern.occurrences / this.config.aggregationThreshold;
    const contributorBoost = Math.min(1, pattern.contributors.size / 5);
    
    return Math.min(1, base * 0.7 + contributorBoost * 0.3);
  }
  
  classifyDomains(pattern) {
    const domains = [];
    
    // Simple classification based on pattern content
    if (pattern.technical || pattern.code) domains.push('technical');
    if (pattern.creative || pattern.design) domains.push('creative');
    if (pattern.analytical || pattern.data) domains.push('analytical');
    if (pattern.collaborative || pattern.team) domains.push('collaborative');
    if (pattern.educational || pattern.learning) domains.push('educational');
    
    return domains.length > 0 ? domains : ['general'];
  }
  
  async getTopPatterns(domain = null) {
    const patterns = Array.from(this.communityKnowledge.patterns.values());
    
    let filtered = patterns;
    if (domain) {
      filtered = patterns.filter(p => p.domains.includes(domain));
    }
    
    filtered.sort((a, b) => (b.confidence * b.occurrences) - (a.confidence * a.occurrences));
    
    return filtered.slice(0, 10);
  }
  
  async getCommonWorkflows() {
    const workflows = Array.from(this.communityKnowledge.patterns.values())
      .filter(p => p.type === 'workflow');
    
    return workflows.slice(0, 5);
  }
  
  async getErrorPatterns() {
    const errors = Array.from(this.communityKnowledge.patterns.values())
      .filter(p => p.type === 'error');
    
    return errors.slice(0, 5);
  }
  
  async getSuccessFactors() {
    const successes = Array.from(this.communityKnowledge.patterns.values())
      .filter(p => p.type === 'success');
    
    return successes.slice(0, 5);
  }
  
  async getCollaborationStyles() {
    const collaborations = Array.from(this.communityKnowledge.patterns.values())
      .filter(p => p.type === 'collaboration');
    
    return collaborations.slice(0, 5);
  }
  
  getImprovementTrends() {
    if (this.mergeHistory.length < 2) return 'insufficient-data';
    
    const recent = this.mergeHistory.slice(-5);
    const patternGrowth = recent[recent.length - 1].patterns - recent[0].patterns;
    
    if (patternGrowth > 10) return 'rapid-growth';
    if (patternGrowth > 0) return 'steady-growth';
    return 'stable';
  }
  
  getDomainContributors(domain) {
    const contributors = new Set();
    
    for (const pattern of this.communityKnowledge.patterns.values()) {
      if (pattern.domains.includes(domain)) {
        pattern.contributors.forEach(c => contributors.add(c));
      }
    }
    
    return contributors.size;
  }
  
  // Persistence methods
  
  async loadCommunityKnowledge() {
    try {
      const knowledgeFile = path.join(this.config.localModelPath, 'community-knowledge.json');
      
      if (await this.fileExists(knowledgeFile)) {
        const data = await fs.readFile(knowledgeFile, 'utf8');
        const knowledge = JSON.parse(data);
        
        // Restore patterns
        for (const [id, pattern] of Object.entries(knowledge.patterns)) {
          pattern.contributors = new Set(pattern.contributors);
          this.communityKnowledge.patterns.set(id, pattern);
        }
        
        logger.info(`Loaded ${this.communityKnowledge.patterns.size} community patterns`);
      }
      
    } catch (error) {
      logger.error('Failed to load community knowledge:', error);
    }
  }
  
  async saveGlobalModel() {
    try {
      const modelFile = path.join(this.config.localModelPath, 'global-model.json');
      await fs.writeFile(modelFile, JSON.stringify(this.globalModel, null, 2));
      
    } catch (error) {
      logger.error('Failed to save global model:', error);
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
   * Start aggregation loop
   */
  startAggregationLoop() {
    setInterval(async () => {
      if (this.federatedQueue.length >= this.config.aggregationThreshold) {
        // Simulate federated averaging
        const batch = this.federatedQueue.splice(0, this.config.aggregationThreshold);
        
        // Aggregate patterns
        const aggregatedPatterns = [];
        for (const item of batch) {
          aggregatedPatterns.push(...item.patterns);
        }
        
        // Check consensus
        const consensus = await this.checkConsensus(aggregatedPatterns);
        
        if (consensus) {
          await this.updateGlobalModel(aggregatedPatterns, consensus);
        }
      }
      
    }, this.config.modelMergeInterval);
  }
  
  /**
   * Start pattern detection
   */
  startPatternDetection() {
    setInterval(() => {
      // Calculate improvement rate
      if (this.mergeHistory.length >= 2) {
        const recent = this.mergeHistory.slice(-2);
        const improvement = recent[1].patterns - recent[0].patterns;
        this.metrics.improvementRate = improvement / recent[0].patterns;
      }
      
    }, 60000); // Every minute
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      communityPatterns: this.communityKnowledge.patterns.size,
      localModels: this.localModels.size,
      contributors: this.contributions.size,
      queueSize: this.federatedQueue.length,
      globalVersion: this.globalModel.version
    };
  }
}

module.exports = CommunityLearning;