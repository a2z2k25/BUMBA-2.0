/**
 * BUMBA Knowledge Transfer Tracker
 * Measures and tracks knowledge transfer effectiveness in rotations
 * Part of Department Rotation Sessions enhancement to 90%
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Knowledge transfer measurement and tracking system
 */
class KnowledgeTransferTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      minConfidence: config.minConfidence || 0.7,
      retentionPeriod: config.retentionPeriod || 90, // days
      assessmentFrequency: config.assessmentFrequency || 7, // days
      transferEfficiencyTarget: config.transferEfficiencyTarget || 0.8,
      ...config
    };
    
    // Knowledge tracking
    this.knowledgeBase = new Map();
    this.transferEvents = [];
    this.assessments = new Map();
    this.retentionCurves = new Map();
    
    // Metrics
    this.metrics = {
      totalTransfers: 0,
      successfulTransfers: 0,
      averageRetention: 0,
      transferVelocity: 0,
      knowledgeGaps: new Map()
    };
    
    // Knowledge taxonomy
    this.taxonomy = this.initializeTaxonomy();
    
    this.initialize();
  }
  
  /**
   * Initialize tracker
   */
  initialize() {
    this.startRetentionTracking();
    logger.info('📚 Knowledge Transfer Tracker initialized');
  }
  
  /**
   * Initialize knowledge taxonomy
   */
  initializeTaxonomy() {
    return {
      technical: {
        categories: ['architecture', 'coding', 'debugging', 'optimization', 'security'],
        levels: ['awareness', 'understanding', 'application', 'analysis', 'synthesis']
      },
      experience: {
        categories: ['user-research', 'design-principles', 'accessibility', 'usability', 'aesthetics'],
        levels: ['awareness', 'understanding', 'application', 'analysis', 'synthesis']
      },
      strategic: {
        categories: ['market-analysis', 'business-model', 'roi', 'stakeholder', 'planning'],
        levels: ['awareness', 'understanding', 'application', 'analysis', 'synthesis']
      }
    };
  }
  
  /**
   * Track knowledge transfer event
   */
  async trackTransfer(transfer) {
    const event = {
      id: this.generateTransferId(),
      timestamp: Date.now(),
      from: transfer.from,
      to: transfer.to,
      knowledge: transfer.knowledge,
      context: transfer.context,
      method: transfer.method,
      duration: transfer.duration,
      confidence: 0,
      effectiveness: 0
    };
    
    // Classify knowledge
    event.classification = this.classifyKnowledge(event.knowledge);
    
    // Assess initial understanding
    event.initialAssessment = await this.assessUnderstanding(event.to, event.knowledge);
    
    // Calculate transfer confidence
    event.confidence = this.calculateTransferConfidence(event);
    
    // Store event
    this.transferEvents.push(event);
    this.metrics.totalTransfers++;
    
    // Update knowledge base
    this.updateKnowledgeBase(event);
    
    // Schedule follow-up assessment
    this.scheduleAssessment(event);
    
    // Emit event
    this.emit('transfer-tracked', event);
    
    return event;
  }
  
  /**
   * Classify knowledge using taxonomy
   */
  classifyKnowledge(knowledge) {
    const classification = {
      domain: null,
      category: null,
      level: 'awareness',
      complexity: 0,
      prerequisites: []
    };
    
    // Determine domain
    for (const [domain, taxonomy] of Object.entries(this.taxonomy)) {
      for (const category of taxonomy.categories) {
        if (this.matchesCategory(knowledge, category)) {
          classification.domain = domain;
          classification.category = category;
          break;
        }
      }
      if (classification.domain) break;
    }
    
    // Determine complexity
    classification.complexity = this.calculateComplexity(knowledge);
    
    // Identify prerequisites
    classification.prerequisites = this.identifyPrerequisites(knowledge);
    
    return classification;
  }
  
  /**
   * Match knowledge to category
   */
  matchesCategory(knowledge, category) {
    const keywords = {
      'architecture': ['design', 'structure', 'pattern', 'system'],
      'coding': ['code', 'programming', 'implementation', 'syntax'],
      'debugging': ['debug', 'error', 'fix', 'troubleshoot'],
      'optimization': ['optimize', 'performance', 'efficiency', 'speed'],
      'security': ['security', 'authentication', 'encryption', 'vulnerability'],
      'user-research': ['user', 'research', 'interview', 'feedback'],
      'design-principles': ['design', 'principle', 'layout', 'visual'],
      'accessibility': ['accessible', 'a11y', 'screen-reader', 'wcag'],
      'usability': ['usable', 'intuitive', 'user-friendly', 'ux'],
      'aesthetics': ['aesthetic', 'beautiful', 'visual', 'style'],
      'market-analysis': ['market', 'competitor', 'analysis', 'trend'],
      'business-model': ['business', 'model', 'revenue', 'monetization'],
      'roi': ['roi', 'return', 'investment', 'value'],
      'stakeholder': ['stakeholder', 'communication', 'expectation'],
      'planning': ['plan', 'strategy', 'roadmap', 'timeline']
    };
    
    const categoryKeywords = keywords[category] || [];
    const knowledgeStr = JSON.stringify(knowledge).toLowerCase();
    
    return categoryKeywords.some(keyword => knowledgeStr.includes(keyword));
  }
  
  /**
   * Calculate knowledge complexity
   */
  calculateComplexity(knowledge) {
    let complexity = 0;
    
    // Check for technical depth
    if (knowledge.technical_depth) {
      complexity += knowledge.technical_depth * 0.3;
    }
    
    // Check for interdependencies
    if (knowledge.dependencies) {
      complexity += Math.min(knowledge.dependencies.length * 0.1, 0.3);
    }
    
    // Check for abstraction level
    if (knowledge.abstraction) {
      complexity += knowledge.abstraction * 0.2;
    }
    
    // Check for required experience
    if (knowledge.required_experience) {
      complexity += Math.min(knowledge.required_experience / 5, 0.2);
    }
    
    return Math.min(complexity, 1.0);
  }
  
  /**
   * Identify prerequisites
   */
  identifyPrerequisites(knowledge) {
    const prerequisites = [];
    
    if (knowledge.prerequisites) {
      return knowledge.prerequisites;
    }
    
    // Infer prerequisites based on complexity
    if (knowledge.classification) {
      const { domain, category, level } = knowledge.classification;
      
      // Add domain basics as prerequisite
      if (level !== 'awareness') {
        prerequisites.push(`${domain}-basics`);
      }
      
      // Add category fundamentals
      if (level === 'application' || level === 'analysis') {
        prerequisites.push(`${category}-fundamentals`);
      }
    }
    
    return prerequisites;
  }
  
  /**
   * Assess understanding level
   */
  async assessUnderstanding(participant, knowledge) {
    const assessment = {
      participant,
      knowledge,
      timestamp: Date.now(),
      scores: {}
    };
    
    // Self-assessment
    assessment.scores.self = this.simulateSelfAssessment(participant, knowledge);
    
    // Peer assessment
    assessment.scores.peer = this.simulatePeerAssessment(participant, knowledge);
    
    // Practical assessment
    assessment.scores.practical = this.simulatePracticalAssessment(participant, knowledge);
    
    // Calculate overall score
    assessment.overall = (
      assessment.scores.self * 0.2 +
      assessment.scores.peer * 0.3 +
      assessment.scores.practical * 0.5
    );
    
    // Determine understanding level
    assessment.level = this.determineLevel(assessment.overall);
    
    // Store assessment
    if (!this.assessments.has(participant)) {
      this.assessments.set(participant, []);
    }
    this.assessments.get(participant).push(assessment);
    
    return assessment;
  }
  
  /**
   * Simulate self-assessment
   */
  simulateSelfAssessment(participant, knowledge) {
    // Simulated self-assessment score
    return 0.6 + Math.random() * 0.3;
  }
  
  /**
   * Simulate peer assessment
   */
  simulatePeerAssessment(participant, knowledge) {
    // Simulated peer assessment score
    return 0.5 + Math.random() * 0.4;
  }
  
  /**
   * Simulate practical assessment
   */
  simulatePracticalAssessment(participant, knowledge) {
    // Simulated practical assessment score
    return 0.4 + Math.random() * 0.5;
  }
  
  /**
   * Determine understanding level
   */
  determineLevel(score) {
    if (score >= 0.9) return 'synthesis';
    if (score >= 0.75) return 'analysis';
    if (score >= 0.6) return 'application';
    if (score >= 0.4) return 'understanding';
    return 'awareness';
  }
  
  /**
   * Calculate transfer confidence
   */
  calculateTransferConfidence(event) {
    let confidence = 0.5; // Base confidence
    
    // Method effectiveness
    const methodScores = {
      'hands-on': 0.9,
      'demonstration': 0.8,
      'documentation': 0.6,
      'discussion': 0.7,
      'observation': 0.5
    };
    confidence *= methodScores[event.method] || 0.5;
    
    // Duration factor
    const optimalDuration = 60; // minutes
    const durationFactor = Math.min(event.duration / optimalDuration, 1.0);
    confidence *= (0.5 + durationFactor * 0.5);
    
    // Context relevance
    if (event.context?.relevant) {
      confidence *= 1.2;
    }
    
    // Initial assessment factor
    if (event.initialAssessment?.overall > 0.7) {
      confidence *= 1.1;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Update knowledge base
   */
  updateKnowledgeBase(event) {
    const key = `${event.classification.domain}:${event.classification.category}`;
    
    if (!this.knowledgeBase.has(key)) {
      this.knowledgeBase.set(key, {
        transfers: [],
        experts: new Set(),
        learners: new Set(),
        averageEffectiveness: 0
      });
    }
    
    const entry = this.knowledgeBase.get(key);
    entry.transfers.push(event.id);
    entry.experts.add(event.from);
    entry.learners.add(event.to);
    
    // Update average effectiveness
    const totalEffectiveness = entry.transfers.length * entry.averageEffectiveness + event.confidence;
    entry.averageEffectiveness = totalEffectiveness / (entry.transfers.length + 1);
  }
  
  /**
   * Schedule follow-up assessment
   */
  scheduleAssessment(event) {
    setTimeout(async () => {
      const followUp = await this.assessRetention(event);
      this.updateRetentionCurve(event, followUp);
    }, this.config.assessmentFrequency * 24 * 60 * 60 * 1000);
  }
  
  /**
   * Assess knowledge retention
   */
  async assessRetention(originalEvent) {
    const assessment = await this.assessUnderstanding(
      originalEvent.to,
      originalEvent.knowledge
    );
    
    const retention = {
      originalTransfer: originalEvent.id,
      timestamp: Date.now(),
      daysSinceTransfer: Math.floor((Date.now() - originalEvent.timestamp) / (24 * 60 * 60 * 1000)),
      retentionScore: assessment.overall,
      originalScore: originalEvent.initialAssessment.overall,
      retentionRate: assessment.overall / originalEvent.initialAssessment.overall
    };
    
    return retention;
  }
  
  /**
   * Update retention curve
   */
  updateRetentionCurve(event, retention) {
    const participant = event.to;
    
    if (!this.retentionCurves.has(participant)) {
      this.retentionCurves.set(participant, {
        dataPoints: [],
        averageRetention: 0,
        forgettingRate: 0
      });
    }
    
    const curve = this.retentionCurves.get(participant);
    curve.dataPoints.push(retention);
    
    // Calculate forgetting curve parameters
    curve.forgettingRate = this.calculateForgettingRate(curve.dataPoints);
    curve.averageRetention = this.calculateAverageRetention(curve.dataPoints);
    
    // Update global metrics
    this.updateGlobalMetrics();
  }
  
  /**
   * Calculate forgetting rate
   */
  calculateForgettingRate(dataPoints) {
    if (dataPoints.length < 2) return 0;
    
    // Simple linear regression on retention over time
    const x = dataPoints.map(d => d.daysSinceTransfer);
    const y = dataPoints.map(d => d.retentionRate);
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return Math.abs(slope); // Positive forgetting rate
  }
  
  /**
   * Calculate average retention
   */
  calculateAverageRetention(dataPoints) {
    if (dataPoints.length === 0) return 0;
    
    const sum = dataPoints.reduce((acc, d) => acc + d.retentionRate, 0);
    return sum / dataPoints.length;
  }
  
  /**
   * Measure transfer effectiveness
   */
  async measureEffectiveness(rotationId) {
    const transfers = this.transferEvents.filter(e => e.context?.rotationId === rotationId);
    
    if (transfers.length === 0) {
      return { effectiveness: 0, details: 'No transfers recorded' };
    }
    
    const metrics = {
      transferCount: transfers.length,
      averageConfidence: 0,
      successRate: 0,
      retentionRate: 0,
      applicationRate: 0
    };
    
    // Calculate average confidence
    metrics.averageConfidence = transfers.reduce((sum, t) => sum + t.confidence, 0) / transfers.length;
    
    // Calculate success rate
    const successful = transfers.filter(t => t.confidence >= this.config.minConfidence);
    metrics.successRate = successful.length / transfers.length;
    
    // Calculate retention rate
    metrics.retentionRate = await this.calculateRotationRetention(transfers);
    
    // Calculate application rate
    metrics.applicationRate = await this.calculateApplicationRate(transfers);
    
    // Overall effectiveness
    const effectiveness = (
      metrics.averageConfidence * 0.25 +
      metrics.successRate * 0.25 +
      metrics.retentionRate * 0.25 +
      metrics.applicationRate * 0.25
    );
    
    return {
      effectiveness,
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };
  }
  
  /**
   * Calculate rotation retention rate
   */
  async calculateRotationRetention(transfers) {
    let totalRetention = 0;
    let count = 0;
    
    for (const transfer of transfers) {
      const participant = transfer.to;
      const curve = this.retentionCurves.get(participant);
      
      if (curve && curve.averageRetention > 0) {
        totalRetention += curve.averageRetention;
        count++;
      }
    }
    
    return count > 0 ? totalRetention / count : 0.5;
  }
  
  /**
   * Calculate application rate
   */
  async calculateApplicationRate(transfers) {
    let applicationCount = 0;
    
    for (const transfer of transfers) {
      const assessments = this.assessments.get(transfer.to) || [];
      const relevant = assessments.filter(a => 
        a.knowledge === transfer.knowledge &&
        a.level === 'application' || a.level === 'analysis' || a.level === 'synthesis'
      );
      
      if (relevant.length > 0) {
        applicationCount++;
      }
    }
    
    return transfers.length > 0 ? applicationCount / transfers.length : 0;
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.averageConfidence < 0.7) {
      recommendations.push('Consider using more hands-on training methods');
    }
    
    if (metrics.successRate < 0.6) {
      recommendations.push('Increase rotation duration or reduce complexity');
    }
    
    if (metrics.retentionRate < 0.5) {
      recommendations.push('Implement spaced repetition and follow-up sessions');
    }
    
    if (metrics.applicationRate < 0.4) {
      recommendations.push('Provide more practical application opportunities');
    }
    
    return recommendations;
  }
  
  /**
   * Identify knowledge gaps
   */
  identifyGaps() {
    const gaps = new Map();
    
    for (const [domain, taxonomy] of Object.entries(this.taxonomy)) {
      for (const category of taxonomy.categories) {
        const key = `${domain}:${category}`;
        const entry = this.knowledgeBase.get(key);
        
        if (!entry || entry.transfers.length < 3) {
          gaps.set(key, {
            domain,
            category,
            severity: entry ? 'low' : 'high',
            transferCount: entry?.transfers.length || 0
          });
        }
      }
    }
    
    this.metrics.knowledgeGaps = gaps;
    return gaps;
  }
  
  /**
   * Get transfer analytics
   */
  getAnalytics() {
    this.updateGlobalMetrics();
    
    return {
      metrics: this.metrics,
      topTransfers: this.getTopTransfers(),
      expertNetwork: this.getExpertNetwork(),
      learningPaths: this.getLearningPaths(),
      retentionAnalysis: this.getRetentionAnalysis(),
      gaps: this.identifyGaps()
    };
  }
  
  /**
   * Get top transfers by effectiveness
   */
  getTopTransfers() {
    return this.transferEvents
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        knowledge: t.knowledge,
        confidence: t.confidence,
        from: t.from,
        to: t.to
      }));
  }
  
  /**
   * Get expert network
   */
  getExpertNetwork() {
    const network = new Map();
    
    for (const [key, entry] of this.knowledgeBase) {
      network.set(key, {
        experts: Array.from(entry.experts),
        learners: Array.from(entry.learners),
        transferCount: entry.transfers.length,
        effectiveness: entry.averageEffectiveness
      });
    }
    
    return network;
  }
  
  /**
   * Get learning paths
   */
  getLearningPaths() {
    const paths = [];
    
    // Analyze transfer sequences
    const sequences = this.analyzeTransferSequences();
    
    for (const sequence of sequences) {
      if (sequence.length >= 3) {
        paths.push({
          path: sequence.map(t => t.classification),
          effectiveness: this.calculatePathEffectiveness(sequence),
          participants: sequence.length
        });
      }
    }
    
    return paths;
  }
  
  /**
   * Analyze transfer sequences
   */
  analyzeTransferSequences() {
    const sequences = [];
    const participantTransfers = new Map();
    
    // Group transfers by participant
    for (const transfer of this.transferEvents) {
      if (!participantTransfers.has(transfer.to)) {
        participantTransfers.set(transfer.to, []);
      }
      participantTransfers.get(transfer.to).push(transfer);
    }
    
    // Sort by timestamp and create sequences
    for (const transfers of participantTransfers.values()) {
      transfers.sort((a, b) => a.timestamp - b.timestamp);
      sequences.push(transfers);
    }
    
    return sequences;
  }
  
  /**
   * Calculate path effectiveness
   */
  calculatePathEffectiveness(sequence) {
    const confidences = sequence.map(t => t.confidence);
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
  
  /**
   * Get retention analysis
   */
  getRetentionAnalysis() {
    const analysis = {
      averageRetention: 0,
      averageForgettingRate: 0,
      retentionByDomain: {},
      criticalKnowledge: []
    };
    
    let totalRetention = 0;
    let totalForgetting = 0;
    let count = 0;
    
    for (const curve of this.retentionCurves.values()) {
      totalRetention += curve.averageRetention;
      totalForgetting += curve.forgettingRate;
      count++;
    }
    
    if (count > 0) {
      analysis.averageRetention = totalRetention / count;
      analysis.averageForgettingRate = totalForgetting / count;
    }
    
    // Identify critical knowledge (high forgetting rate)
    for (const transfer of this.transferEvents) {
      const participant = transfer.to;
      const curve = this.retentionCurves.get(participant);
      
      if (curve && curve.forgettingRate > 0.1) {
        analysis.criticalKnowledge.push({
          knowledge: transfer.knowledge,
          forgettingRate: curve.forgettingRate
        });
      }
    }
    
    return analysis;
  }
  
  /**
   * Update global metrics
   */
  updateGlobalMetrics() {
    // Calculate success rate
    const successful = this.transferEvents.filter(t => t.confidence >= this.config.minConfidence);
    this.metrics.successfulTransfers = successful.length;
    
    // Calculate average retention
    let totalRetention = 0;
    let count = 0;
    
    for (const curve of this.retentionCurves.values()) {
      if (curve.averageRetention > 0) {
        totalRetention += curve.averageRetention;
        count++;
      }
    }
    
    this.metrics.averageRetention = count > 0 ? totalRetention / count : 0;
    
    // Calculate transfer velocity (transfers per day)
    if (this.transferEvents.length > 0) {
      const firstTransfer = this.transferEvents[0].timestamp;
      const daysPassed = (Date.now() - firstTransfer) / (24 * 60 * 60 * 1000);
      this.metrics.transferVelocity = this.transferEvents.length / Math.max(daysPassed, 1);
    }
  }
  
  /**
   * Start retention tracking
   */
  startRetentionTracking() {
    // Periodic retention assessment
    setInterval(() => {
      this.performRetentionAssessments();
    }, this.config.assessmentFrequency * 24 * 60 * 60 * 1000);
  }
  
  /**
   * Perform retention assessments
   */
  async performRetentionAssessments() {
    for (const transfer of this.transferEvents) {
      const daysSince = (Date.now() - transfer.timestamp) / (24 * 60 * 60 * 1000);
      
      if (daysSince >= this.config.assessmentFrequency) {
        const retention = await this.assessRetention(transfer);
        this.updateRetentionCurve(transfer, retention);
      }
    }
  }
  
  /**
   * Generate transfer ID
   */
  generateTransferId() {
    return `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = KnowledgeTransferTracker;