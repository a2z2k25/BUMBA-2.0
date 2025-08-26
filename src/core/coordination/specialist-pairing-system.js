/**
 * BUMBA 2.0 Specialist Pairing System
 * Strategic pairing of specialists for enhanced collaboration
 */

const { logger } = require('../logging/bumba-logger');

class SpecialistPairingSystem {
  constructor() {
    this.pairingPatterns = new Map();
    this.buddyRelationships = new Map();
    this.collaborationHistory = new Map();
    this.pairingEffectiveness = new Map();
    this.apiConnected = false;
    this.developmentMode = process.env.NODE_ENV !== 'production';
    
    this.initializePairingPatterns();
    this.initializeBuddySystem();
    this.initializeApiFallbacks();
  }

  initializeApiFallbacks() {
    // Mock responses for disconnected API scenarios
    this.mockResponses = {
      analyzeTaskRequirements: (task) => ({
        primary_skills: this.extractSkillsFromTask(task),
        secondary_skills: this.extractSecondarySkills(task),
        complexity: this.estimateComplexity(task),
        departments_involved: this.identifyDepartments(task)
      }),
      
      selectSpecialist: (type, availableSpecialists) => {
        return availableSpecialists.find(s => s.type === type) || 
               availableSpecialists.find(s => s.skills && s.skills.includes(type)) ||
               availableSpecialists[0];
      },
      
      scorePatternMatch: (pattern, taskAnalysis) => {
        // Intelligent scoring based on pattern keywords and task content
        const taskText = (taskAnalysis.description || '').toLowerCase();
        const patternKeywords = pattern.typical_tasks.join(' ').toLowerCase();
        
        let score = 0.5; // Base score
        
        // Check for keyword matches
        const keywords = patternKeywords.split(' ');
        const matches = keywords.filter(keyword => taskText.includes(keyword));
        score += (matches.length / keywords.length) * 0.3;
        
        // Department alignment bonus
        if (taskAnalysis.departments_involved && 
            taskAnalysis.departments_involved.some(dept => 
              pattern.department_bridge.includes(dept))) {
          score += 0.2;
        }
        
        return Math.min(1.0, score);
      }
    };
  }

  async safeApiCall(operation, fallbackFn, ...args) {
    // Priority 1: Use fallback if explicitly in development mode with no API
    if (this.developmentMode && !this.apiConnected) {
      logger.debug(`🔄 Using fallback for ${operation} (API disconnected)`);
      return fallbackFn(...args);
    }
    
    // Priority 2: Attempt real API call when connected
    if (this.apiConnected && this.realApiMethods && this.realApiMethods[operation]) {
      try {
        logger.debug(`🟢 Using real API for ${operation}`);
        const result = await this.realApiMethods[operation](...args);
        logger.debug(`🏁 Real API call successful for ${operation}`);
        return result;
      } catch (error) {
        logger.warn(`🟠️ Real API failed for ${operation}, falling back: ${error.message}`);
        // Fall through to fallback
      }
    }
    
    // Priority 3: Use intelligent fallback
    try {
      return fallbackFn(...args);
    } catch (error) {
      if (error.message.includes('invalid_request_error') || 
          error.message.includes('JSON')) {
        logger.warn(`🟠️ API error in ${operation}, using basic fallback: ${error.message}`);
        return fallbackFn(...args);
      }
      throw error;
    }
  }

  // Method to register real API implementations
  registerRealApiMethods(apiMethods) {
    this.realApiMethods = apiMethods;
    this.apiConnected = true;
    logger.info(`🔗 Real API methods registered: ${Object.keys(apiMethods).join(', ')}`);
  }

  // Method to unregister APIs (for testing or fallback scenarios)
  unregisterRealApiMethods() {
    this.realApiMethods = null;
    this.apiConnected = false;
    logger.info('📴 Real API methods unregistered');
  }

  extractSkillsFromTask(task) {
    const description = (task.description || '').toLowerCase();
    const skillMappings = {
      'security': ['security', 'auth', 'secure', 'vulnerability'],
      'performance': ['performance', 'optimization', 'speed', 'cache'],
      'ui': ['ui', 'interface', 'design', 'visual'],
      'api': ['api', 'endpoint', 'service', 'backend'],
      'database': ['database', 'query', 'data', 'sql'],
      'devops': ['deploy', 'infrastructure', 'ci/cd', 'docker']
    };
    
    const detectedSkills = [];
    for (const [skill, keywords] of Object.entries(skillMappings)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        detectedSkills.push(skill);
      }
    }
    
    return detectedSkills.length > 0 ? detectedSkills : ['technical'];
  }

  extractSecondarySkills(task) {
    const primary = this.extractSkillsFromTask(task);
    const allSkills = ['ui', 'performance', 'security', 'database', 'devops', 'research'];
    return allSkills.filter(skill => !primary.includes(skill)).slice(0, 2);
  }

  estimateComplexity(task) {
    const description = (task.description || '');
    const complexityIndicators = {
      high: ['complex', 'advanced', 'enterprise', 'scalable', 'distributed'],
      medium: ['integrate', 'optimize', 'enhance', 'improve'],
      low: ['simple', 'basic', 'quick', 'fix']
    };
    
    const text = description.toLowerCase();
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => text.includes(indicator))) {
        return level;
      }
    }
    
    return 'medium';
  }

  identifyDepartments(task) {
    const description = (task.description || '').toLowerCase();
    const departments = [];
    
    if (description.match(/ui|design|user|experience|interface/)) {
      departments.push('experience');
    }
    if (description.match(/api|backend|database|security|performance|infrastructure/)) {
      departments.push('technical');
    }
    if (description.match(/business|strategy|market|product|cost/)) {
      departments.push('strategic');
    }
    
    return departments.length > 0 ? departments : ['technical'];
  }

  initializePairingPatterns() {
    // Strategic pairings for enhanced outcomes
    this.pairingPatterns.set('secure_api_design', {
      primary: 'security',
      secondary: 'api-architecture',
      department_bridge: ['technical', 'technical'],
      synergy: 'Security-first API design with performance optimization',
      typical_tasks: ['API security audit', 'Secure endpoint design', 'Authentication system']
    });

    this.pairingPatterns.set('inclusive_design', {
      primary: 'ux-research',
      secondary: 'accessibility',
      department_bridge: ['experience', 'experience'],
      synergy: 'User research informed by accessibility principles',
      typical_tasks: ['Inclusive user testing', 'WCAG compliance', 'Universal design']
    });

    this.pairingPatterns.set('cost_optimized_infrastructure', {
      primary: 'business-model',
      secondary: 'performance-engineering',
      department_bridge: ['strategic', 'technical'],
      synergy: 'Business model constraints driving technical optimization',
      typical_tasks: ['Infrastructure cost analysis', 'Performance vs cost trade-offs']
    });

    this.pairingPatterns.set('market_aligned_product', {
      primary: 'market-research',
      secondary: 'product-strategy',
      department_bridge: ['strategic', 'strategic'],
      synergy: 'Market insights directly informing product direction',
      typical_tasks: ['Feature prioritization', 'Market fit analysis', 'Competitive positioning']
    });

    this.pairingPatterns.set('performance_ux', {
      primary: 'performance-optimization',
      secondary: 'ui-design',
      department_bridge: ['experience', 'experience'],
      synergy: 'Performance considerations in design decisions',
      typical_tasks: ['Performance-aware design', 'Loading state optimization', 'Progressive enhancement']
    });

    this.pairingPatterns.set('data_driven_design', {
      primary: 'database',
      secondary: 'ux-research',
      department_bridge: ['technical', 'experience'],
      synergy: 'Database optimization informed by user behavior',
      typical_tasks: ['Query optimization for UX', 'Data-driven personalization']
    });

    this.pairingPatterns.set('secure_infrastructure', {
      primary: 'security',
      secondary: 'devops',
      department_bridge: ['technical', 'technical'],
      synergy: 'Security integrated into deployment pipeline',
      typical_tasks: ['Secure CI/CD', 'Infrastructure hardening', 'Security automation']
    });

    this.pairingPatterns.set('accessible_frontend', {
      primary: 'accessibility',
      secondary: 'frontend-architecture',
      department_bridge: ['experience', 'experience'],
      synergy: 'Accessibility built into architecture decisions',
      typical_tasks: ['Component accessibility', 'ARIA implementation', 'Keyboard navigation']
    });
  }

  initializeBuddySystem() {
    // Cross-department buddy relationships for direct communication
    this.buddyRelationships.set('database_performance', {
      technical: 'database',
      experience: 'performance-optimization',
      communication_protocol: 'direct_line',
      typical_interactions: ['Query optimization affecting load times', 'Caching strategies']
    });

    this.buddyRelationships.set('business_infrastructure', {
      strategic: 'business-model',
      technical: 'infrastructure',
      communication_protocol: 'direct_line',
      typical_interactions: ['Cost implications of scaling', 'Infrastructure investment decisions']
    });

    this.buddyRelationships.set('design_security', {
      experience: 'ui-design',
      technical: 'security',
      communication_protocol: 'direct_line',
      typical_interactions: ['Security UX patterns', 'Authentication flow design']
    });

    this.buddyRelationships.set('product_architecture', {
      strategic: 'product-strategy',
      technical: 'api-architecture',
      communication_protocol: 'direct_line',
      typical_interactions: ['API design for product features', 'Technical feasibility']
    });

    this.buddyRelationships.set('research_engineering', {
      experience: 'ux-research',
      technical: 'performance-engineering',
      communication_protocol: 'direct_line',
      typical_interactions: ['Performance impact on user behavior', 'Technical constraints on UX']
    });
  }

  async pairSpecialists(task, availableSpecialists) {
    logger.info(`🏁 Finding optimal specialist pairing for task: ${task.description}`);

    // Analyze task to determine best pairing pattern
    const optimalPattern = await this.findOptimalPairingPattern(task);
    
    if (!optimalPattern) {
      return this.createAdHocPairing(task, availableSpecialists);
    }

    const pairing = {
      pattern: optimalPattern,
      primary: await this.selectSpecialist(optimalPattern.primary, availableSpecialists),
      secondary: await this.selectSpecialist(optimalPattern.secondary, availableSpecialists),
      synergy_score: await this.calculateSynergyScore(optimalPattern),
      collaboration_protocol: await this.defineCollaborationProtocol(optimalPattern)
    };

    // Record pairing for effectiveness tracking
    await this.recordPairing(pairing, task);

    return pairing;
  }

  async findOptimalPairingPattern(task) {
    const taskAnalysis = await this.safeApiCall(
      'analyzeTaskRequirements',
      this.mockResponses.analyzeTaskRequirements.bind(this),
      task
    );
    
    let bestPattern = null;
    let bestScore = 0;

    for (const [patternName, pattern] of this.pairingPatterns) {
      const score = await this.safeApiCall(
        'scorePatternMatch',
        this.mockResponses.scorePatternMatch.bind(this),
        pattern,
        taskAnalysis
      );
      if (score > bestScore) {
        bestScore = score;
        bestPattern = { name: patternName, ...pattern };
      }
    }

    return bestScore > 0.6 ? bestPattern : null; // Lowered threshold for development
  }

  async createAdHocPairing(task, availableSpecialists) {
    // Create dynamic pairing based on task requirements
    const taskAnalysis = await this.safeApiCall(
      'analyzeTaskRequirements',
      this.mockResponses.analyzeTaskRequirements.bind(this),
      task
    );
    
    return {
      pattern: 'ad_hoc',
      primary: await this.selectBestSpecialist(taskAnalysis.primary_skills, availableSpecialists),
      secondary: await this.selectComplementarySpecialist(taskAnalysis.secondary_skills, availableSpecialists),
      synergy_score: 0.7,
      collaboration_protocol: 'adaptive'
    };
  }

  async establishBuddyConnection(specialist1, specialist2) {
    logger.info(`🏁 Establishing buddy connection: ${specialist1.type} ↔ ${specialist2.type}`);

    const connection = {
      specialists: [specialist1.id, specialist2.id],
      departments: [specialist1.department, specialist2.department],
      established_at: Date.now(),
      communication_channel: await this.createDirectChannel(specialist1, specialist2),
      shared_context: new Map(),
      interaction_history: []
    };

    // Set up bidirectional references
    specialist1.buddy = specialist2;
    specialist2.buddy = specialist1;

    // Enable direct communication methods
    this.enableDirectCommunication(specialist1, specialist2, connection);

    return connection;
  }

  enableDirectCommunication(specialist1, specialist2, connection) {
    // Add direct communication methods to specialists
    specialist1.askBuddy = async (question) => {
      const response = await this.facilitateBuddyConversation(specialist1, specialist2, question);
      connection.interaction_history.push({
        from: specialist1.id,
        to: specialist2.id,
        type: 'question',
        content: question,
        response: response,
        timestamp: Date.now()
      });
      return response;
    };

    specialist2.askBuddy = async (question) => {
      const response = await this.facilitateBuddyConversation(specialist2, specialist1, question);
      connection.interaction_history.push({
        from: specialist2.id,
        to: specialist1.id,
        type: 'question',
        content: question,
        response: response,
        timestamp: Date.now()
      });
      return response;
    };
  }

  async facilitateBuddyConversation(from, to, question) {
    logger.info(`🏁 Buddy conversation: ${from.type} → ${to.type}`);
    
    try {
      // Simulate intelligent response based on specialist expertise
      const response = await to.processQuestion(question, from.context);
      
      // Update shared context
      const sharedContext = this.buddyRelationships.get(`${from.type}_${to.type}`) || 
                           this.buddyRelationships.get(`${to.type}_${from.type}`);
      
      if (sharedContext) {
        if (!sharedContext.shared_context) {
          sharedContext.shared_context = new Map();
        }
        sharedContext.shared_context.set(Date.now(), {
          question: question,
          response: response,
          impact: 'knowledge_shared'
        });
      }

      return response;
    } catch (error) {
      // Fallback response for development mode
      if (this.developmentMode) {
        logger.debug(`🔄 Using fallback response for buddy conversation`);
        return this.generateFallbackResponse(from, to, question);
      }
      throw error;
    }
  }

  generateFallbackResponse(from, to, question) {
    // Generate contextual response based on specialist types
    const responseTemplates = {
      'security': {
        'performance': 'From a security perspective, consider implementing rate limiting and input validation while optimizing.',
        'ui-design': 'Ensure secure authentication patterns are user-friendly and accessible.',
        'default': 'Security considerations should include input validation, authorization, and secure data handling.'
      },
      'performance': {
        'security': 'Performance optimizations should not compromise security - consider caching sensitive operations securely.',
        'ui-design': 'Focus on perceived performance through progressive loading and smooth animations.',
        'default': 'Consider caching, lazy loading, and efficient algorithms for optimal performance.'
      },
      'ui-design': {
        'security': 'Design clear security indicators and user-friendly authentication flows.',
        'performance': 'Optimize images, use efficient CSS, and consider perceived performance in design decisions.',
        'default': 'Focus on user experience, accessibility, and clear visual hierarchy.'
      }
    };

    const fromType = from.type || 'default';
    const toType = to.type || 'default';
    
    const template = responseTemplates[toType]?.[fromType] || 
                    responseTemplates[toType]?.default || 
                    `As a ${toType} specialist, I recommend consulting domain-specific best practices for your question: "${question}"`;
    
    return template;
  }

  async calculateSynergyScore(pattern) {
    // Calculate effectiveness of pairing based on historical data
    const historicalEffectiveness = this.pairingEffectiveness.get(pattern.name) || 0.8;
    const departmentAlignment = pattern.department_bridge[0] === pattern.department_bridge[1] ? 0.1 : 0;
    
    return Math.min(1.0, historicalEffectiveness + departmentAlignment);
  }

  async defineCollaborationProtocol(pattern) {
    return {
      communication_style: pattern.department_bridge[0] === pattern.department_bridge[1] ? 'informal' : 'structured',
      meeting_frequency: 'as_needed',
      decision_making: 'consensus',
      conflict_resolution: 'peer_discussion_first',
      knowledge_sharing: 'continuous'
    };
  }

  async recordPairing(pairing, task) {
    const record = {
      pairing: pairing,
      task: task,
      timestamp: Date.now(),
      effectiveness: null // To be updated after task completion
    };

    const historyKey = `${pairing.primary.type}_${pairing.secondary.type}`;
    if (!this.collaborationHistory.has(historyKey)) {
      this.collaborationHistory.set(historyKey, []);
    }
    
    this.collaborationHistory.get(historyKey).push(record);
  }

  async updatePairingEffectiveness(pairing, effectiveness) {
    const patternName = pairing.pattern.name || pairing.pattern;
    const current = this.pairingEffectiveness.get(patternName) || 0.8;
    
    // Weighted average with more weight on recent performance
    const updated = (current * 0.7) + (effectiveness * 0.3);
    this.pairingEffectiveness.set(patternName, updated);
    
    logger.info(`🏁 Updated pairing effectiveness for ${patternName}: ${updated.toFixed(2)}`);
  }

  getBuddyRecommendations(specialist) {
    const recommendations = [];
    
    for (const [relationshipName, relationship] of this.buddyRelationships) {
      if (relationship[specialist.department] === specialist.type) {
        recommendations.push({
          buddy_type: Object.entries(relationship).find(([dept, type]) => 
            dept !== specialist.department && dept !== 'communication_protocol' && dept !== 'typical_interactions'
          )?.[1],
          relationship: relationshipName,
          typical_interactions: relationship.typical_interactions
        });
      }
    }

    return recommendations;
  }

  getPairingHistory(specialist1Type, specialist2Type) {
    const key1 = `${specialist1Type}_${specialist2Type}`;
    const key2 = `${specialist2Type}_${specialist1Type}`;
    
    return [
      ...(this.collaborationHistory.get(key1) || []),
      ...(this.collaborationHistory.get(key2) || [])
    ].sort((a, b) => b.timestamp - a.timestamp);
  }

  async analyzeTaskRequirements(task) {
    // Simplified task analysis
    return {
      primary_skills: ['technical'],
      secondary_skills: ['design'],
      complexity: 'medium',
      departments_involved: ['technical', 'experience']
    };
  }

  async selectSpecialist(type, availableSpecialists) {
    return this.safeApiCall(
      'selectSpecialist',
      this.mockResponses.selectSpecialist.bind(this),
      type,
      availableSpecialists
    );
  }

  async selectBestSpecialist(skills, availableSpecialists) {
    // Enhanced selection based on skills
    if (!availableSpecialists || availableSpecialists.length === 0) {
      return null;
    }
    
    // Find specialist with most matching skills
    let bestSpecialist = availableSpecialists[0];
    let bestScore = 0;
    
    for (const specialist of availableSpecialists) {
      let score = 0;
      const specialistSkills = specialist.skills || [specialist.type];
      
      for (const skill of skills) {
        if (specialistSkills.includes(skill) || specialist.type === skill) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestSpecialist = specialist;
      }
    }
    
    return bestSpecialist;
  }

  async selectComplementarySpecialist(skills, availableSpecialists) {
    // Find specialist with different but complementary skills
    if (!availableSpecialists || availableSpecialists.length === 0) {
      return null;
    }
    
    // Prefer specialists from different departments
    for (const specialist of availableSpecialists) {
      const specialistSkills = specialist.skills || [specialist.type];
      const hasComplementarySkills = skills.some(skill => 
        !specialistSkills.includes(skill) && specialist.type !== skill
      );
      
      if (hasComplementarySkills) {
        return specialist;
      }
    }
    
    return availableSpecialists[1] || availableSpecialists[0];
  }

  async createDirectChannel(specialist1, specialist2) {
    return {
      id: `channel_${specialist1.id}_${specialist2.id}`,
      participants: [specialist1.id, specialist2.id],
      created_at: Date.now()
    };
  }

  async scorePatternMatch(pattern, taskAnalysis) {
    // Use the safe API call with intelligent fallback
    return this.safeApiCall(
      'scorePatternMatch',
      this.mockResponses.scorePatternMatch.bind(this),
      pattern,
      taskAnalysis
    );
  }

  // Development and testing methods
  enableApiConnection() {
    this.apiConnected = true;
    logger.info('🔗 API connection enabled');
  }

  disableApiConnection() {
    this.apiConnected = false;
    logger.info('📴 API connection disabled - using fallbacks');
  }

  async testPairingSystem(testTask = null) {
    if (!testTask) {
      testTask = {
        description: 'Implement secure API with performance optimization and user-friendly interface',
        requirements: ['security', 'performance', 'ui-design'],
        complexity: 'high'
      };
    }

    logger.info('🧪 Testing Specialist Pairing System...');
    
    const mockSpecialists = [
      { id: 'sec-1', type: 'security', department: 'technical', skills: ['security', 'auth'] },
      { id: 'perf-1', type: 'performance', department: 'technical', skills: ['performance', 'optimization'] },
      { id: 'ui-1', type: 'ui-design', department: 'experience', skills: ['ui-design', 'accessibility'] },
      { id: 'api-1', type: 'api-architecture', department: 'technical', skills: ['api', 'architecture'] }
    ];

    try {
      const pairing = await this.pairSpecialists(testTask, mockSpecialists);
      
      logger.info('🏁 Pairing test successful:', {
        pattern: pairing.pattern.name || pairing.pattern,
        primary: pairing.primary?.type,
        secondary: pairing.secondary?.type,
        synergy_score: pairing.synergy_score
      });

      // Test buddy connection
      if (pairing.primary && pairing.secondary) {
        const buddyConnection = await this.establishBuddyConnection(
          pairing.primary, 
          pairing.secondary
        );
        
        logger.info('🏁 Buddy connection test successful');
        
        // Test buddy conversation
        if (pairing.primary.askBuddy) {
          const response = await pairing.primary.askBuddy(
            'How should we approach the security vs performance trade-offs?'
          );
          logger.info('🏁 Buddy conversation test successful:', response);
        }
      }

      return {
        success: true,
        pairing: pairing,
        apiConnected: this.apiConnected,
        developmentMode: this.developmentMode
      };
    } catch (error) {
      logger.error('🔴 Pairing test failed:', error.message);
      return {
        success: false,
        error: error.message,
        apiConnected: this.apiConnected,
        developmentMode: this.developmentMode
      };
    }
  }

  getSystemStatus() {
    return {
      apiConnected: this.apiConnected,
      developmentMode: this.developmentMode,
      pairingPatterns: this.pairingPatterns.size,
      buddyRelationships: this.buddyRelationships.size,
      collaborationHistory: this.collaborationHistory.size,
      pairingEffectiveness: this.pairingEffectiveness.size
    };
  }
}

// Add EventEmitter capability
const { EventEmitter } = require('events');
Object.setPrototypeOf(SpecialistPairingSystem.prototype, EventEmitter.prototype);

module.exports = {
  SpecialistPairingSystem
};