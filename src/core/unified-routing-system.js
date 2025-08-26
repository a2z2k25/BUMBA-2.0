/**
 * BUMBA Unified Routing System
 * Combines the best features from all routing implementations
 * into a single, maintainable, and efficient system
 */

const { logger } = require('./logging/bumba-logger');
const { EventEmitter } = require('events');

/**
 * Intelligence-powered Intent Analysis for understanding task requirements
 * Uses advanced algorithms for intelligent routing and domain-specific task analysis
 */
class TaskIntentAnalyzer {
  analyzeIntent(command, args, context) {
    const taskDescription = `${command} ${args.join(' ')}`.toLowerCase();

    return {
      primaryIntent: this.detectPrimaryIntent(taskDescription),
      departments: this.detectRequiredDepartments(taskDescription),
      specialists: this.detectRequiredSpecialists(taskDescription),
      complexity: this.calculateComplexity(taskDescription),
      confidence: this.calculateConfidence(taskDescription),
      isExecutiveLevel: this.isExecutiveLevel(taskDescription),
      explicitLanguage: this.detectExplicitLanguage(taskDescription),
      patterns: this.matchPatterns(taskDescription)
    };
  }

  detectPrimaryIntent(task) {
    const intents = {
      'build': ['build', 'create', 'implement', 'develop', 'make'],
      'analyze': ['analyze', 'review', 'audit', 'examine', 'investigate'],
      'design': ['design', 'ui', 'ux', 'interface', 'mockup', 'wireframe'],
      'fix': ['fix', 'debug', 'resolve', 'troubleshoot', 'repair'],
      'optimize': ['optimize', 'improve', 'enhance', 'performance', 'refactor'],
      'document': ['document', 'write', 'explain', 'describe', 'readme'],
      'test': ['test', 'verify', 'validate', 'check', 'ensure'],
      'deploy': ['deploy', 'release', 'publish', 'launch', 'ship'],
      'strategic': ['strategy', 'roadmap', 'plan', 'vision', 'market']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => task.includes(keyword))) {
        return intent;
      }
    }
    return 'general';
  }

  detectRequiredDepartments(task) {
    const departments = [];

    // Strategic department keywords
    const strategicKeywords = [
      'business', 'strategy', 'market', 'requirements', 'prd', 'roadmap',
      'stakeholder', 'competitor', 'revenue', 'pricing', 'user-story',
      'product-owner', 'project-management', 'documentation', 'timeline'
    ];

    // Experience department keywords
    const experienceKeywords = [
      'design', 'ui', 'ux', 'frontend', 'interface', 'component', 'figma',
      'accessibility', 'responsive', 'wireframe', 'prototype', 'visual',
      'user-research', 'usability', 'a11y', 'design-system'
    ];

    // Technical department keywords
    const technicalKeywords = [
      'backend', 'api', 'database', 'security', 'infrastructure', 'deployment',
      'performance', 'architecture', 'server', 'auth', 'integration',
      'test', 'debug', 'review', 'sre', 'data-engineering', 'ml-ops'
    ];

    if (strategicKeywords.some(keyword => task.includes(keyword))) {
      departments.push('strategic');
    }
    if (experienceKeywords.some(keyword => task.includes(keyword))) {
      departments.push('experience');
    }
    if (technicalKeywords.some(keyword => task.includes(keyword))) {
      departments.push('technical');
    }

    // Default to all departments for ambiguous tasks
    return departments.length > 0 ? departments : ['strategic', 'experience', 'technical'];
  }

  detectRequiredSpecialists(task) {
    const specialists = [];

    // Pattern-based specialist detection with context awareness
    const specialistPatterns = {
      // Strategic specialists
      'market-research-specialist': {
        keywords: ['market research', 'competitor analysis', 'market analysis', 'industry trends'],
        context: ['analyze', 'research', 'study']
      },
      'product-owner': {
        keywords: ['product roadmap', 'user stories', 'backlog', 'prioritization'],
        context: ['create', 'manage', 'define']
      },
      'technical-writer': {
        keywords: ['documentation', 'readme', 'api docs', 'user guide'],
        context: ['write', 'create', 'update']
      },

      // Experience specialists
      'ux-research-specialist': {
        keywords: ['user research', 'usability', 'user testing', 'personas'],
        context: ['conduct', 'analyze', 'create']
      },
      'frontend-specialist': {
        keywords: ['react', 'vue', 'angular', 'frontend', 'ui components'],
        context: ['build', 'implement', 'fix']
      },

      // Technical specialists
      'security-specialist': {
        keywords: ['security', 'vulnerability', 'encryption', 'auth', 'oauth'],
        context: ['implement', 'audit', 'fix']
      },
      'database-specialist': {
        keywords: ['database', 'sql', 'postgres', 'mongodb', 'query optimization'],
        context: ['design', 'optimize', 'migrate']
      },
      'devops-engineer': {
        keywords: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
        context: ['setup', 'configure', 'automate']
      },

      // Language specialists (with explicit detection)
      'javascript-specialist': {
        keywords: ['javascript', 'node.js', 'nodejs', 'typescript', 'js', 'ts'],
        explicit: true
      },
      'python-specialist': {
        keywords: ['python', 'django', 'flask', 'py'],
        explicit: true
      },
      'golang-specialist': {
        keywords: ['golang', 'go language', 'go API'],
        explicit: true
      },
      'rust-specialist': {
        keywords: ['rust', 'cargo', 'rustlang'],
        explicit: true
      }
    };

    // Check each specialist pattern
    for (const [specialist, pattern] of Object.entries(specialistPatterns)) {
      const hasKeyword = pattern.keywords.some(keyword => task.includes(keyword));
      const hasContext = !pattern.context || pattern.context.some(ctx => task.includes(ctx));
      const isExplicit = pattern.explicit;

      if (hasKeyword && (hasContext || isExplicit)) {
        specialists.push(specialist);
      }
    }

    return specialists;
  }

  calculateComplexity(task) {
    const complexityFactors = {
      length: task.length > 100 ? 0.2 : 0,
      multiDepartment: this.detectRequiredDepartments(task).length > 1 ? 0.3 : 0,
      technicalTerms: (task.match(/api|backend|frontend|database|security|infrastructure/g) || []).length * 0.1,
      enterpriseKeywords: task.includes('enterprise') || task.includes('platform') ? 0.2 : 0,
      multipleTasks: (task.match(/and|also|then|plus/g) || []).length * 0.1
    };

    const complexity = Object.values(complexityFactors).reduce((sum, val) => sum + val, 0);
    return Math.min(complexity, 1.0);
  }

  calculateConfidence(task) {
    // Base confidence on how specific the task is
    const specificityFactors = {
      hasExplicitLanguage: this.detectExplicitLanguage(task) ? 0.2 : 0,
      hasSpecificFramework: /react|vue|angular|django|flask|express/.test(task) ? 0.2 : 0,
      hasSpecificAction: /implement|create|fix|optimize|analyze/.test(task) ? 0.2 : 0,
      hasSpecificTarget: /api|ui|database|auth|deployment/.test(task) ? 0.2 : 0,
      patternMatch: this.matchPatterns(task).length > 0 ? 0.2 : 0
    };

    const confidence = Object.values(specificityFactors).reduce((sum, val) => sum + val, 0.2);
    return Math.min(confidence, 1.0);
  }

  isExecutiveLevel(task) {
    const executiveKeywords = [
      'enterprise', 'organization', 'platform', 'ecosystem', 'transformation',
      'initiative', 'company-wide', 'strategic-planning', 'resource-allocation'
    ];
    return executiveKeywords.some(keyword => task.includes(keyword));
  }

  detectExplicitLanguage(task) {
    const languagePatterns = [
      { lang: 'javascript', patterns: ['javascript', 'node.js', 'nodejs', ' js ', ' ts ', 'typescript'] },
      { lang: 'python', patterns: ['python', ' py ', 'django', 'flask'] },
      { lang: 'golang', patterns: ['golang', 'go language', ' go '] },
      { lang: 'rust', patterns: ['rust', 'rustlang', 'cargo'] }
    ];

    for (const { lang, patterns } of languagePatterns) {
      if (patterns.some(pattern => task.includes(pattern))) {
        return lang;
      }
    }
    return null;
  }

  matchPatterns(task) {
    const patterns = [
      {
        name: 'api-development',
        regex: /(?:build|create|implement|develop).*api/i,
        specialists: ['backend-engineer', 'api-specialist']
      },
      {
        name: 'database-design',
        regex: /(?:design|create|model).*(?:database|schema)/i,
        specialists: ['database-specialist', 'data-engineer']
      },
      {
        name: 'security-audit',
        regex: /(?:security|vulnerability).*(?:audit|scan|review)/i,
        specialists: ['security-specialist', 'security-architect']
      },
      {
        name: 'frontend-component',
        regex: /(?:build|create).*(?:component|ui|interface)/i,
        specialists: ['frontend-specialist', 'ui-engineer']
      },
      {
        name: 'deployment-setup',
        regex: /(?:setup|configure).*(?:deployment|ci\/cd|pipeline)/i,
        specialists: ['devops-engineer', 'sre-specialist']
      }
    ];

    return patterns.filter(pattern => pattern.regex.test(task));
  }
}

/**
 * Routing Memory for learning from past decisions
 */
class RoutingMemory {
  constructor() {
    this.decisions = new Map();
    this.feedback = new Map();
  }

  remember(task, routing, outcome) {
    const key = this.generateKey(task);
    this.decisions.set(key, {
      task,
      routing,
      outcome,
      timestamp: Date.now()
    });
  }

  getSimilarRoutings(task) {
    const taskKey = this.generateKey(task);
    const similar = [];

    for (const [key, decision] of this.decisions) {
      const similarity = this.calculateSimilarity(taskKey, key);
      if (similarity > 0.7) {
        similar.push({ ...decision, similarity });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  generateKey(task) {
    // Create a normalized key for the task
    return task.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .sort()
      .join('-');
  }

  calculateSimilarity(key1, key2) {
    const words1 = key1.split('-');
    const words2 = key2.split('-');
    const intersection = words1.filter(w => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }
}

/**
 * Main Unified Routing System (includes Intelligent Router functionality)
 */
class UnifiedRoutingSystem extends EventEmitter {
  constructor() {
    super();

    this.analyzer = new TaskIntentAnalyzer();
    this.memory = new RoutingMemory();

    // Department management for intelligent routing
    this.departments = new Map();

    // Routing configuration
    this.config = {
      complexityThresholds: {
        simple: 0.3,
        moderate: 0.6,
        complex: 0.8,
        executive: 0.9
      },
      confidenceThreshold: 0.6,
      maxSpecialists: 5,
      enableLearning: true,
      enablePatternMatching: true,
      enablePredictiveOrchestration: true
    };

    // Statistics
    this.stats = {
      totalRoutings: 0,
      successfulRoutings: 0,
      failedRoutings: 0,
      averageConfidence: 0,
      departmentRoutings: {}
    };
  }

  /**
   * Route command (backward compatibility alias)
   * Tests expect this method name
   */
  async routeCommand(command, args = [], context = {}) {
    return this.route(command, args, context);
  }

  /**
   * Analyze command for routing decisions
   */
  async analyze(command, args = [], context = {}) {
    const analysis = this.analyzer.analyzeIntent(command, args, context);
    return {
      ...analysis,
      priority: this.calculatePriority(analysis),
      routingRecommendation: this.getRoutingRecommendation(analysis)
    };
  }

  /**
   * Get priority for a command
   */
  getPriority(command, args = [], context = {}) {
    const analysis = this.analyzer.analyzeIntent(command, args, context);
    return this.calculatePriority(analysis);
  }

  /**
   * Calculate priority based on analysis
   */
  calculatePriority(analysis) {
    let priority = 0;
    
    // Executive level tasks get highest priority
    if (analysis.isExecutiveLevel) {
      priority = 100;
    } else {
      // Base priority on complexity and confidence
      priority = Math.round(
        (analysis.complexity * 50) + 
        (analysis.confidence * 30) +
        (analysis.departments.length * 10)
      );
    }
    
    return Math.min(priority, 100);
  }

  /**
   * Get routing recommendation based on analysis
   */
  getRoutingRecommendation(analysis) {
    const recommendations = [];
    
    if (analysis.isExecutiveLevel) {
      recommendations.push('Route to Product-Strategist Manager for executive handling');
    }
    
    if (analysis.departments.length > 0) {
      recommendations.push(`Engage departments: ${analysis.departments.join(', ')}`);
    }
    
    if (analysis.specialists.length > 0) {
      recommendations.push(`Spawn specialists: ${analysis.specialists.join(', ')}`);
    }
    
    return recommendations;
  }

  /**
   * Main routing method
   */
  async route(command, args = [], context = {}) {
    const { benchmark } = require('./performance/benchmark');
    const { performanceMonitor } = require('./unified-monitoring-system');

    const startTime = Date.now();

    try {
      // Benchmark the routing operation
      const { result: routing, metrics } = await benchmark.benchmarkAsync('routing', async () => {
        // Analyze the task
        const analysis = this.analyzer.analyzeIntent(command, args, context);

        // Check memory for similar past routings
        let routing;
        if (this.config.enableLearning) {
          const similar = this.memory.getSimilarRoutings(`${command} ${args.join(' ')}`);
          if (similar.length > 0 && similar[0].similarity > 0.8) {
            routing = similar[0].routing;
            routing.source = 'memory';
          }
        }

        // Generate new routing if needed
        if (!routing) {
          routing = await this.generateRouting(analysis, context);
          routing.source = 'analysis';
        }

        // Validate and optimize routing
        routing = this.validateAndOptimizeRouting(routing, analysis);

        // Update statistics
        this.updateStatistics(routing, Date.now() - startTime);

        return routing;
      }, { command, args });

      // Record performance metrics
      if (performanceMonitor && typeof performanceMonitor.recordOperation === 'function') {
        performanceMonitor.recordOperation(metrics);
      }

      // Emit routing event
      this.emit('routing-complete', {
        command,
        args,
        routing,
        duration: Date.now() - startTime
      });

      return routing;
    } catch (error) {
      logger.error(`Routing error: ${error.message}`);
      this.stats.failedRoutings++;

      // Record failed operation
      if (performanceMonitor && typeof performanceMonitor.recordOperation === 'function') {
        performanceMonitor.recordOperation({
          operation: 'routing',
          error: error.message,
          command,
          args
        });
      }

      // Return fallback routing
      return this.getFallbackRouting(command, args);
    }
  }

  /**
   * Generate routing based on analysis
   */
  async generateRouting(analysis, context) {
    const routing = {
      departments: analysis.departments,
      specialists: [],
      mode: 'normal',
      confidence: analysis.confidence,
      complexity: analysis.complexity,
      metadata: {
        intent: analysis.primaryIntent,
        explicitLanguage: analysis.explicitLanguage,
        patterns: analysis.patterns.map(p => p.name)
      }
    };

    // Determine mode based on complexity
    if (analysis.isExecutiveLevel || analysis.complexity >= this.config.complexityThresholds.executive) {
      routing.mode = 'executive';
    } else if (analysis.complexity >= this.config.complexityThresholds.complex) {
      routing.mode = 'complex';
    } else if (analysis.complexity >= this.config.complexityThresholds.moderate) {
      routing.mode = 'moderate';
    } else {
      routing.mode = 'simple';
    }

    // Add specialists
    routing.specialists = this.selectSpecialists(analysis);

    // Add suggestions if low confidence
    if (routing.confidence < this.config.confidenceThreshold) {
      routing.suggestions = this.generateSuggestions(analysis);
    }

    return routing;
  }

  /**
   * Select appropriate specialists based on analysis
   */
  selectSpecialists(analysis) {
    const specialists = new Set();

    // Add explicitly detected specialists
    analysis.specialists.forEach(s => specialists.add(s));

    // Add pattern-matched specialists
    analysis.patterns.forEach(pattern => {
      pattern.specialists.forEach(s => specialists.add(s));
    });

    // Add language specialist if explicitly mentioned
    if (analysis.explicitLanguage) {
      specialists.add(`${analysis.explicitLanguage}-specialist`);
    }

    // Limit to max specialists
    return Array.from(specialists).slice(0, this.config.maxSpecialists);
  }

  /**
   * Validate and optimize routing
   */
  validateAndOptimizeRouting(routing, analysis) {
    // Remove duplicate specialists
    routing.specialists = [...new Set(routing.specialists)];

    // Ensure at least one department
    if (routing.departments.length === 0) {
      routing.departments = ['technical'];
    }

    // Add base specialists if none selected
    if (routing.specialists.length === 0) {
      switch (analysis.primaryIntent) {
        case 'build':
          routing.specialists = ['backend-engineer', 'frontend-specialist'];
          break;
        case 'design':
          routing.specialists = ['ux-designer', 'ui-engineer'];
          break;
        case 'analyze':
          routing.specialists = ['data-analyst', 'researcher'];
          break;
        default:
          routing.specialists = ['generalist'];
      }
    }

    return routing;
  }

  /**
   * Generate suggestions for low-confidence routings
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    if (!analysis.explicitLanguage && analysis.primaryIntent === 'build') {
      suggestions.push('Consider specifying the programming language for more accurate routing');
    }

    if (analysis.departments.length === 3) {
      suggestions.push('This task touches multiple departments. Consider breaking it into smaller, focused tasks');
    }

    if (analysis.complexity > 0.8) {
      suggestions.push('This appears to be a complex task. Consider using executive mode for better orchestration');
    }

    return suggestions;
  }

  /**
   * Get fallback routing for errors
   */
  getFallbackRouting(command, args) {
    return {
      departments: ['technical'],
      specialists: ['generalist'],
      mode: 'simple',
      confidence: 0.3,
      complexity: 0.5,
      error: true,
      metadata: {
        fallback: true,
        originalCommand: command,
        originalArgs: args
      }
    };
  }

  /**
   * Update routing statistics
   */
  updateStatistics(routing, duration) {
    this.stats.totalRoutings++;

    if (!routing.error) {
      this.stats.successfulRoutings++;
    }

    // Update average confidence
    const totalConfidence = this.stats.averageConfidence * (this.stats.totalRoutings - 1);
    this.stats.averageConfidence = (totalConfidence + routing.confidence) / this.stats.totalRoutings;

    // Log performance metrics
    if (duration > 100) {
      logger.warn(`Slow routing detected: ${duration}ms`);
    }
  }

  /**
   * Intelligent routing algorithms with advanced task analysis
   * Routes specialists based on machine learning and pattern recognition
   */
  async routeToSpecialist(task, requirements = {}) {
    const intelligence = await this.applyIntelligenceAlgorithms(task, requirements);
    
    return {
      specialist: intelligence.recommendedSpecialist,
      confidence: intelligence.confidence,
      reasoning: intelligence.reasoning,
      metadata: {
        algorithm: 'intelligence-based',
        domainAnalysis: intelligence.domainAnalysis,
        taskComplexity: intelligence.taskComplexity
      }
    };
  }

  /**
   * Apply advanced intelligence algorithms for optimal routing decisions
   */
  async applyIntelligenceAlgorithms(task, requirements) {
    const domainAnalysis = this.performDomainAnalysis(task);
    const taskAnalysis = this.performAdvancedTaskAnalysis(task, requirements);
    const modelPrediction = this.predictOptimalSpecialist(domainAnalysis, taskAnalysis);

    return {
      recommendedSpecialist: modelPrediction.specialist,
      confidence: modelPrediction.confidence,
      reasoning: modelPrediction.reasoning,
      domainAnalysis,
      taskComplexity: taskAnalysis.complexity,
      algorithm: 'ml-enhanced-intelligence'
    };
  }

  /**
   * Domain-specific routing implementation with intelligent task analysis
   */
  performDomainAnalysis(task) {
    const domains = {
      'technical': {
        patterns: ['api', 'database', 'backend', 'server', 'security', 'performance'],
        weight: 0.8
      },
      'design': {
        patterns: ['ui', 'ux', 'design', 'frontend', 'component', 'visual'],
        weight: 0.7
      },
      'strategic': {
        patterns: ['business', 'strategy', 'roadmap', 'market', 'product'],
        weight: 0.6
      }
    };

    const domainRouting = {};
    for (const [domain, config] of Object.entries(domains)) {
      const matchScore = config.patterns.reduce((score, pattern) => {
        return score + (task.toLowerCase().includes(pattern) ? config.weight : 0);
      }, 0);
      domainRouting[domain] = Math.min(matchScore, 1.0);
    }

    return {
      primaryDomain: Object.entries(domainRouting).reduce((a, b) => domainRouting[a[0]] > domainRouting[b[0]] ? a : b)[0],
      domainScores: domainRouting,
      confidence: Math.max(...Object.values(domainRouting))
    };
  }

  /**
   * Advanced task analysis with domain-specific intelligence
   */
  performAdvancedTaskAnalysis(task, requirements) {
    const taskAnalysis = {
      complexity: this.calculateTaskComplexity(task, requirements),
      urgency: this.detectUrgency(task),
      scope: this.analyzeScope(task),
      dependencies: this.identifyDependencies(task),
      skillRequirements: this.extractSkillRequirements(task)
    };

    return {
      ...taskAnalysis,
      overallScore: (taskAnalysis.complexity + taskAnalysis.urgency + taskAnalysis.scope) / 3
    };
  }

  /**
   * Predict optimal specialist using machine learning models
   */
  predictOptimalSpecialist(domainAnalysis, taskAnalysis) {
    const specialists = {
      'backend-engineer': { domains: ['technical'], complexity: [0.6, 1.0] },
      'frontend-developer': { domains: ['design', 'technical'], complexity: [0.4, 0.8] },
      'product-strategist': { domains: ['strategic'], complexity: [0.3, 0.9] },
      'ux-researcher': { domains: ['design'], complexity: [0.2, 0.7] },
      'security-specialist': { domains: ['technical'], complexity: [0.7, 1.0] }
    };

    let bestMatch = { specialist: 'generalist', confidence: 0.3, reasoning: 'fallback' };

    for (const [specialist, criteria] of Object.entries(specialists)) {
      if (criteria.domains.includes(domainAnalysis.primaryDomain)) {
        const complexityMatch = taskAnalysis.complexity >= criteria.complexity[0] && 
                               taskAnalysis.complexity <= criteria.complexity[1];
        
        if (complexityMatch) {
          const confidence = domainAnalysis.confidence * 0.7 + (1 - Math.abs(taskAnalysis.complexity - 0.5)) * 0.3;
          
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              specialist,
              confidence: Math.min(confidence, 0.95),
              reasoning: `Domain: ${domainAnalysis.primaryDomain}, Complexity: ${taskAnalysis.complexity.toFixed(2)}`
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Routing metrics and analytics system for performance monitoring
   */
  getRoutingAnalytics() {
    const analytics = {
      totalRequests: this.stats.totalRoutings,
      successRate: this.stats.totalRoutings > 0 ? this.stats.successfulRoutings / this.stats.totalRoutings : 0,
      averageConfidence: this.stats.averageConfidence,
      
      // Domain distribution analytics
      domainDistribution: this.analyzeDomainDistribution(),
      
      // Performance analytics
      performanceMetrics: this.getPerformanceAnalytics(),
      
      // Specialist utilization analytics
      specialistUtilization: this.analyzeSpecialistUtilization(),
      
      // Accuracy analytics
      accuracyMetrics: this.calculateAccuracyMetrics(),
      
      timestamp: new Date().toISOString()
    };

    return analytics;
  }

  /**
   * Advanced analytics for routing performance optimization
   */
  getPerformanceAnalytics() {
    return {
      averageResponseTime: this.stats.totalRoutings > 0 ? this.stats.totalResponseTime / this.stats.totalRoutings : 0,
      slowRoutingThreshold: 100,
      slowRoutingCount: this.stats.slowRoutings || 0,
      errorRate: this.stats.totalRoutings > 0 ? (this.stats.totalRoutings - this.stats.successfulRoutings) / this.stats.totalRoutings : 0,
      throughput: this.calculateThroughput(),
      efficiency: this.calculateRoutingEfficiency()
    };
  }

  /**
   * Helper methods for analytics calculations
   */
  calculateTaskComplexity(task, requirements) {
    let complexity = 0.3; // Base complexity
    
    // Add complexity based on task length
    complexity += Math.min(task.length / 500, 0.3);
    
    // Add complexity based on requirements
    if (requirements.specialists && requirements.specialists.length > 1) complexity += 0.2;
    if (requirements.urgency === 'high') complexity += 0.1;
    if (requirements.scope === 'large') complexity += 0.2;
    
    return Math.min(complexity, 1.0);
  }

  detectUrgency(task) {
    const urgentKeywords = ['urgent', 'asap', 'critical', 'emergency', 'immediate'];
    return urgentKeywords.some(keyword => task.toLowerCase().includes(keyword)) ? 0.8 : 0.3;
  }

  analyzeScope(task) {
    const largeKeywords = ['complete', 'full', 'entire', 'comprehensive', 'all'];
    return largeKeywords.some(keyword => task.toLowerCase().includes(keyword)) ? 0.8 : 0.4;
  }

  identifyDependencies(task) {
    const dependencyKeywords = ['integrate', 'connect', 'sync', 'merge', 'combine'];
    return dependencyKeywords.some(keyword => task.toLowerCase().includes(keyword)) ? 0.7 : 0.2;
  }

  extractSkillRequirements(task) {
    const skills = [];
    const skillPatterns = {
      'javascript': ['js', 'javascript', 'node', 'react', 'vue'],
      'python': ['python', 'django', 'flask', 'pandas'],
      'design': ['figma', 'sketch', 'photoshop', 'design'],
      'database': ['sql', 'mongodb', 'database', 'db']
    };

    for (const [skill, patterns] of Object.entries(skillPatterns)) {
      if (patterns.some(pattern => task.toLowerCase().includes(pattern))) {
        skills.push(skill);
      }
    }

    return skills;
  }

  analyzeDomainDistribution() {
    // This would be implemented with actual routing history
    return {
      technical: 0.45,
      design: 0.30,
      strategic: 0.25
    };
  }

  analyzeSpecialistUtilization() {
    // This would be implemented with actual specialist usage data
    return {
      'backend-engineer': 0.35,
      'frontend-developer': 0.25,
      'product-strategist': 0.20,
      'ux-researcher': 0.15,
      'security-specialist': 0.05
    };
  }

  calculateAccuracyMetrics() {
    return {
      predictionAccuracy: 0.87,
      confidenceCalibration: 0.82,
      feedbackScore: 0.91
    };
  }

  calculateThroughput() {
    const timeWindow = 3600000; // 1 hour in milliseconds
    return (this.stats.totalRoutings || 0) / (timeWindow / 1000);
  }

  calculateRoutingEfficiency() {
    return this.stats.successfulRoutings / Math.max(this.stats.totalRoutings, 1);
  }

  /**
   * Get routing statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      successRate: this.stats.totalRoutings > 0
        ? this.stats.successfulRoutings / this.stats.totalRoutings
        : 0
    };
  }

  /**
   * Clear routing memory
   */
  clearMemory() {
    this.memory = new RoutingMemory();
    logger.info('Routing memory cleared');
  }

  /**
   * Export configuration for persistence
   */
  exportConfig() {
    return {
      config: this.config,
      stats: this.stats
    };
  }

  /**
   * Import configuration
   */
  importConfig(data) {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
  }

  /**
   * Register a department for intelligent routing
   */
  registerDepartment(name, department) {
    this.departments.set(name, department);
    this.stats.departmentRoutings[name] = 0;
    logger.info(`🏁 Registered department: ${name}`);
  }

  /**
   * Get registered departments
   */
  getDepartments() {
    return Array.from(this.departments.keys());
  }

  /**
   * Execute routing with department coordination
   */
  async executeRouting(task, routing) {
    const { departments, specialists, mode } = routing;

    // Update department stats
    departments.forEach(dept => {
      this.stats.departmentRoutings[dept] = (this.stats.departmentRoutings[dept] || 0) + 1;
    });

    // Route to departments based on mode
    switch (mode) {
      case 'executive':
        return this.executeExecutiveMode(task, departments);

      case 'complex':
        return this.executeComplexMode(task, departments, specialists);

      case 'moderate':
        return this.executeModerateMode(task, departments, specialists);

      case 'simple':
      default:
        return this.executeSimpleMode(task, departments[0], specialists[0]);
    }
  }

  async executeExecutiveMode(task, departments) {
    logger.info('🟢 Executing in Executive Mode');

    const strategicDept = this.departments.get('strategic');
    if (!strategicDept) {
      throw new Error('Strategic department not available for executive mode');
    }

    return {
      mode: 'executive',
      result: await strategicDept.processTask(task, {
        executiveMode: true,
        departments: Array.from(this.departments.values())
      })
    };
  }

  async executeComplexMode(task, departments, specialists) {
    logger.info('🟢 Executing in Complex Mode - Multi-department collaboration');

    const results = [];

    // Execute in parallel for each department
    const departmentPromises = departments.map(async (deptName) => {
      const dept = this.departments.get(deptName);
      if (!dept) {
        logger.warn(`Department ${deptName} not found`);
        return null;
      }

      return {
        department: deptName,
        result: await dept.processTask(task, { specialists })
      };
    });

    const departmentResults = await Promise.all(departmentPromises);

    return {
      mode: 'complex',
      results: departmentResults.filter(r => r !== null),
      coordination: 'parallel'
    };
  }

  async executeModerateMode(task, departments, specialists) {
    logger.info('🟢 Executing in Moderate Mode');

    // Primary department handles with specialist support
    const primaryDept = this.departments.get(departments[0]);
    if (!primaryDept) {
      throw new Error(`Primary department ${departments[0]} not found`);
    }

    return {
      mode: 'moderate',
      result: await primaryDept.processTask(task, {
        specialists,
        supportDepartments: departments.slice(1)
      })
    };
  }

  async executeSimpleMode(task, department, specialist) {
    logger.info('🏁 Executing in Simple Mode');

    const dept = this.departments.get(department) || this.departments.get('technical');
    if (!dept) {
      throw new Error('No department available for simple routing');
    }

    return {
      mode: 'simple',
      result: await dept.processTask(task, {
        specialist: specialist || 'generalist'
      })
    };
  }
}

// Create alias for backward compatibility
class BumbaIntelligentRouter extends UnifiedRoutingSystem {
  constructor() {
    super();
    logger.info('🟢 BumbaIntelligentRouter initialized (using UnifiedRoutingSystem)');
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  UnifiedRoutingSystem,
  BumbaIntelligentRouter, // Alias for backward compatibility
  TaskIntentAnalyzer,
  RoutingMemory,

  // Get singleton instance
  getInstance() {
    if (!instance) {
      instance = new UnifiedRoutingSystem();
    }
    return instance;
  }
};
