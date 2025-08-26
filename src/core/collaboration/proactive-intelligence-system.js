/**
 * BUMBA Proactive Intelligence System
 * Enables agents to proactively contribute expertise and catch issues early
 * 
 * This system allows agents to monitor ongoing work and inject expertise
 * at the perfect moment, preventing problems and improving solution quality.
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getContextStreaming } = require('./context-streaming-system');

class ProactiveIntelligenceSystem extends EventEmitter {
  constructor() {
    super();
    
    // Pattern recognition engine
    this.patternRecognizers = new Map();
    
    // Expertise triggers
    this.expertiseTriggers = new Map();
    
    // Active monitoring subscriptions
    this.monitoringSubscriptions = new Map();
    
    // Proactive contributions
    this.contributions = new Map();
    
    // Smart interruption timing
    this.interruptionManager = {
      cooldown: new Map(),
      priority: new Map(),
      history: []
    };
    
    // Context streaming integration
    this.contextStreaming = getContextStreaming();
    
    // Initialize default patterns
    this.initializeDefaultPatterns();
    
    // Metrics
    this.metrics = {
      patternsRecognized: 0,
      proactiveContributions: 0,
      preventedIssues: 0,
      expertiseOffered: 0,
      acceptanceRate: 0,
      qualityImprovement: 0
    };
    
    logger.info('🟢 Proactive Intelligence System initialized - Agents now think ahead');
  }
  
  /**
   * Initialize default pattern recognizers for common scenarios
   */
  initializeDefaultPatterns() {
    // Security patterns
    this.registerPatternRecognizer('security', {
      patterns: [
        /password|secret|key|token|auth|credential/i,
        /eval\(|exec\(|Function\(/,
        /innerHTML|dangerouslySetInnerHTML/,
        /sql.*where.*=.*\+|sql.*concat/i
      ],
      expertise: 'security',
      priority: 'high',
      message: 'Security concern detected - offering expertise'
    });
    
    // Performance patterns
    this.registerPatternRecognizer('performance', {
      patterns: [
        /for.*for.*for/, // Triple nested loops
        /map.*map.*map/, // Nested maps
        /await.*forEach/, // Async in forEach
        /document\.querySelector.*inside.*loop/i,
        /n\+1|N\+1/
      ],
      expertise: 'performance',
      priority: 'medium',
      message: 'Performance optimization opportunity detected'
    });
    
    // Architecture patterns
    this.registerPatternRecognizer('architecture', {
      patterns: [
        /global\.|window\./,
        /circular.*dependency|dependency.*cycle/i,
        /god.*class|massive.*class/i,
        /repeated.*code|duplicate.*logic/i,
        /tight.*coupling|tightly.*coupled/i
      ],
      expertise: 'architecture',
      priority: 'medium',
      message: 'Architecture improvement opportunity'
    });
    
    // UX patterns
    this.registerPatternRecognizer('ux', {
      patterns: [
        /loading|spinner|skeleton/i,
        /error.*message|user.*feedback/i,
        /accessibility|aria|screen.*reader/i,
        /responsive|mobile|breakpoint/i,
        /animation|transition|transform/i
      ],
      expertise: 'ux',
      priority: 'low',
      message: 'UX enhancement opportunity'
    });
    
    // Testing patterns
    this.registerPatternRecognizer('testing', {
      patterns: [
        /edge.*case|boundary.*condition/i,
        /mock|stub|spy/i,
        /test.*coverage|untested/i,
        /flaky.*test|intermittent.*failure/i,
        /integration.*test|e2e/i
      ],
      expertise: 'testing',
      priority: 'medium',
      message: 'Testing consideration detected'
    });
  }
  
  /**
   * Register a pattern recognizer
   */
  registerPatternRecognizer(name, config) {
    this.patternRecognizers.set(name, {
      name,
      patterns: config.patterns || [],
      expertise: config.expertise,
      priority: config.priority || 'low',
      message: config.message,
      handler: config.handler || null
    });
    
    logger.info(`🟢 Registered pattern recognizer: ${name}`);
  }
  
  /**
   * Register expertise trigger
   * Defines when an agent should offer specific expertise
   */
  registerExpertiseTrigger(agentId, trigger) {
    const triggers = this.expertiseTriggers.get(agentId) || [];
    triggers.push({
      id: `trigger-${Date.now()}`,
      agentId,
      ...trigger
    });
    
    this.expertiseTriggers.set(agentId, triggers);
    
    logger.info(`🟢 Agent ${agentId} registered expertise trigger`);
  }
  
  /**
   * Monitor context stream for opportunities to contribute
   */
  async monitorForOpportunities(agentId, expertise) {
    // Subscribe to context streaming
    const patterns = this.createPatternsForExpertise(expertise);
    
    const subscription = this.contextStreaming.subscribeToContext(agentId, patterns);
    this.monitoringSubscriptions.set(agentId, subscription);
    
    // Set up context listener
    this.contextStreaming.on('context:relevant', async (data) => {
      if (data.subscriberAgent === agentId) {
        await this.evaluateContributionOpportunity(agentId, data.context);
      }
    });
    
    logger.info(`🟢️ Agent ${agentId} monitoring for ${expertise.join(', ')} opportunities`);
  }
  
  /**
   * Evaluate if agent should contribute expertise
   */
  async evaluateContributionOpportunity(agentId, context) {
    // Check all pattern recognizers
    const matches = [];
    
    for (const [name, recognizer] of this.patternRecognizers) {
      if (this.contextMatchesPatterns(context, recognizer.patterns)) {
        matches.push({
          pattern: name,
          recognizer,
          confidence: this.calculateConfidence(context, recognizer)
        });
      }
    }
    
    if (matches.length === 0) {return;}
    
    // Sort by priority and confidence
    matches.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b.recognizer.priority) - 
                          this.getPriorityValue(a.recognizer.priority);
      if (priorityDiff !== 0) {return priorityDiff;}
      return b.confidence - a.confidence;
    });
    
    // Take highest priority match
    const topMatch = matches[0];
    
    // Check if we should interrupt
    if (await this.shouldInterrupt(agentId, topMatch, context)) {
      await this.offerExpertise(agentId, topMatch, context);
    }
  }
  
  /**
   * Determine if agent should interrupt with expertise
   */
  async shouldInterrupt(agentId, match, context) {
    // Check cooldown
    const lastInterruption = this.interruptionManager.cooldown.get(agentId);
    if (lastInterruption) {
      const timeSince = Date.now() - lastInterruption;
      const cooldownPeriod = this.getCooldownPeriod(match.recognizer.priority);
      
      if (timeSince < cooldownPeriod) {
        return false; // Still in cooldown
      }
    }
    
    // Check priority threshold
    const priorityValue = this.getPriorityValue(match.recognizer.priority);
    const contextPriority = this.getPriorityValue(context.priority || 'normal');
    
    // High priority patterns always interrupt
    if (priorityValue >= 3) {return true;}
    
    // Medium priority needs high confidence
    if (priorityValue === 2 && match.confidence > 0.7) {return true;}
    
    // Low priority needs very high confidence and low context priority
    if (priorityValue === 1 && match.confidence > 0.9 && contextPriority < 2) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Offer expertise proactively
   */
  async offerExpertise(agentId, match, context) {
    logger.info(`🟢 Agent ${agentId} offering ${match.pattern} expertise`);
    
    const contribution = {
      id: `contrib-${Date.now()}`,
      agentId,
      timestamp: new Date(),
      pattern: match.pattern,
      recognizer: match.recognizer,
      confidence: match.confidence,
      targetContext: context.id,
      targetAgent: context.agentId,
      status: 'offered'
    };
    
    // Generate expertise content
    contribution.expertise = await this.generateExpertise(
      match.pattern,
      match.recognizer,
      context
    );
    
    // Store contribution
    this.contributions.set(contribution.id, contribution);
    
    // Update cooldown
    this.interruptionManager.cooldown.set(agentId, Date.now());
    
    // Stream the expertise
    await this.contextStreaming.streamContext(agentId, {
      type: 'proactive_expertise',
      content: contribution.expertise.summary,
      insights: contribution.expertise.insights,
      recommendations: contribution.expertise.recommendations,
      warnings: contribution.expertise.warnings,
      priority: match.recognizer.priority,
      confidence: match.confidence,
      relatedContexts: [context.id]
    });
    
    // Emit event
    this.emit('expertise:offered', {
      contributionId: contribution.id,
      fromAgent: agentId,
      toAgent: context.agentId,
      pattern: match.pattern,
      priority: match.recognizer.priority
    });
    
    // Update metrics
    this.metrics.expertiseOffered++;
    this.metrics.proactiveContributions++;
    
    return contribution;
  }
  
  /**
   * Generate expertise content based on pattern
   */
  async generateExpertise(pattern, recognizer, context) {
    const expertise = {
      summary: recognizer.message,
      insights: [],
      recommendations: [],
      warnings: [],
      examples: [],
      resources: []
    };
    
    // Pattern-specific expertise generation
    switch (pattern) {
      case 'security':
        expertise.insights = [
          'Security vulnerability pattern detected',
          'Potential attack vector identified'
        ];
        expertise.recommendations = [
          'Use parameterized queries for SQL',
          'Implement input validation',
          'Use environment variables for secrets',
          'Enable security headers'
        ];
        expertise.warnings = [
          'This pattern could lead to injection attacks',
          'Sensitive data may be exposed'
        ];
        expertise.examples = [
          '// Safe approach:\nconst query = "SELECT * FROM users WHERE id = ?";',
          '// Use bcrypt for passwords:\nconst hashedPassword = await bcrypt.hash(password, 10);'
        ];
        break;
        
      case 'performance':
        expertise.insights = [
          'Performance bottleneck detected',
          'This pattern scales poorly with data growth'
        ];
        expertise.recommendations = [
          'Consider using memoization',
          'Implement pagination or virtualization',
          'Use database indexes',
          'Consider caching strategy'
        ];
        expertise.warnings = [
          'O(n²) or worse complexity detected',
          'This could cause UI freezing'
        ];
        expertise.examples = [
          '// Use Promise.all for parallel operations:\nconst results = await Promise.all(items.map(processItem));',
          '// Debounce expensive operations:\nconst debouncedSearch = debounce(search, 300);'
        ];
        break;
        
      case 'architecture':
        expertise.insights = [
          'Architectural anti-pattern detected',
          'This violates separation of concerns'
        ];
        expertise.recommendations = [
          'Apply SOLID principles',
          'Consider dependency injection',
          'Use event-driven architecture',
          'Implement proper layering'
        ];
        expertise.warnings = [
          'This creates tight coupling',
          'Future refactoring will be difficult'
        ];
        break;
        
      case 'ux':
        expertise.insights = [
          'User experience opportunity',
          'Accessibility consideration needed'
        ];
        expertise.recommendations = [
          'Add loading states',
          'Implement error boundaries',
          'Provide user feedback',
          'Ensure keyboard navigation'
        ];
        expertise.warnings = [
          'Users may be confused without feedback',
          'This may not be accessible'
        ];
        break;
        
      case 'testing':
        expertise.insights = [
          'Test coverage gap identified',
          'Edge case not handled'
        ];
        expertise.recommendations = [
          'Add unit tests for critical paths',
          'Include edge case testing',
          'Mock external dependencies',
          'Add integration tests'
        ];
        expertise.warnings = [
          'Untested code is likely to break',
          'This edge case could cause production issues'
        ];
        break;
    }
    
    return expertise;
  }
  
  /**
   * Process feedback on offered expertise
   */
  async processExpertiseFeedback(contributionId, feedback) {
    const contribution = this.contributions.get(contributionId);
    if (!contribution) {return;}
    
    contribution.feedback = feedback;
    contribution.status = feedback.accepted ? 'accepted' : 'declined';
    
    // Update metrics
    const totalOffered = this.metrics.expertiseOffered;
    const accepted = Array.from(this.contributions.values())
      .filter(c => c.status === 'accepted').length;
    
    this.metrics.acceptanceRate = accepted / Math.max(totalOffered, 1);
    
    if (feedback.accepted) {
      logger.info(`🏁 Expertise contribution ${contributionId} accepted`);
      
      // Track quality improvement
      if (feedback.qualityImpact) {
        this.metrics.qualityImprovement = 
          (this.metrics.qualityImprovement + feedback.qualityImpact) / 2;
      }
      
      // Track prevented issues
      if (feedback.preventedIssue) {
        this.metrics.preventedIssues++;
      }
    } else {
      logger.info(`🔴 Expertise contribution ${contributionId} declined`);
      
      // Learn from rejection to improve future contributions
      await this.learnFromRejection(contribution, feedback);
    }
  }
  
  /**
   * Learn from rejected contributions to improve
   */
  async learnFromRejection(contribution, feedback) {
    // Adjust confidence thresholds
    const pattern = contribution.pattern;
    const recognizer = this.patternRecognizers.get(pattern);
    
    if (recognizer && feedback.reason === 'not_relevant') {
      // Increase confidence threshold for this pattern
      recognizer.minConfidence = (recognizer.minConfidence || 0.5) + 0.1;
    }
    
    // Add to interruption history
    this.interruptionManager.history.push({
      contributionId: contribution.id,
      pattern: contribution.pattern,
      accepted: false,
      reason: feedback.reason,
      timestamp: new Date()
    });
    
    // If too many rejections, increase cooldown period
    const recentRejections = this.interruptionManager.history
      .filter(h => !h.accepted && Date.now() - h.timestamp < 3600000) // Last hour
      .length;
    
    if (recentRejections > 3) {
      logger.info('🟢 Adjusting interruption frequency due to rejections');
      // Double cooldown periods temporarily
      // This would be implemented in getCooldownPeriod
    }
  }
  
  /**
   * Create patterns for expertise monitoring
   */
  createPatternsForExpertise(expertise) {
    const patterns = [];
    
    for (const area of expertise) {
      switch (area) {
        case 'security':
          patterns.push({
            type: 'security',
            keywords: ['auth', 'password', 'token', 'sql', 'injection']
          });
          break;
        case 'performance':
          patterns.push({
            type: 'performance',
            keywords: ['slow', 'optimize', 'cache', 'bottleneck']
          });
          break;
        case 'design':
          patterns.push({
            type: 'design',
            keywords: ['ui', 'ux', 'component', 'style', 'layout']
          });
          break;
        case 'architecture':
          patterns.push({
            type: 'architecture',
            keywords: ['structure', 'pattern', 'dependency', 'module']
          });
          break;
      }
    }
    
    return patterns;
  }
  
  /**
   * Check if context matches patterns
   */
  contextMatchesPatterns(context, patterns) {
    const contextStr = JSON.stringify(context).toLowerCase();
    
    for (const pattern of patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(contextStr)) {return true;}
      } else if (typeof pattern === 'string') {
        if (contextStr.includes(pattern.toLowerCase())) {return true;}
      }
    }
    
    return false;
  }
  
  /**
   * Calculate confidence for pattern match
   */
  calculateConfidence(context, recognizer) {
    let confidence = 0.5; // Base confidence
    
    // Multiple pattern matches increase confidence
    const contextStr = JSON.stringify(context).toLowerCase();
    let matches = 0;
    
    for (const pattern of recognizer.patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(contextStr)) {matches++;}
      } else if (contextStr.includes(pattern)) {
        matches++;
      }
    }
    
    confidence += matches * 0.15;
    
    // Priority context increases confidence
    if (context.priority === 'high') {confidence += 0.2;}
    
    // Explicit expertise need increases confidence
    if (context.needsExpertise && 
        context.needsExpertise.includes(recognizer.expertise)) {
      confidence += 0.3;
    }
    
    return Math.min(1, confidence);
  }
  
  /**
   * Get priority value
   */
  getPriorityValue(priority) {
    const values = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      normal: 2
    };
    return values[priority] || 1;
  }
  
  /**
   * Get cooldown period based on priority
   */
  getCooldownPeriod(priority) {
    const periods = {
      critical: 1000, // 1 second
      high: 30000, // 30 seconds
      medium: 120000, // 2 minutes
      low: 300000 // 5 minutes
    };
    return periods[priority] || 300000;
  }
  
  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeMonitors: this.monitoringSubscriptions.size,
      patternRecognizers: this.patternRecognizers.size,
      contributionHistory: this.contributions.size,
      acceptanceRate: `${Math.round(this.metrics.acceptanceRate * 100)}%`,
      qualityImpact: `+${Math.round(this.metrics.qualityImprovement * 100)}%`
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ProactiveIntelligenceSystem,
  getInstance: () => {
    if (!instance) {
      instance = new ProactiveIntelligenceSystem();
    }
    return instance;
  }
};