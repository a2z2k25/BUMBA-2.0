/**
 * BUMBA Enhanced Collaboration Layer
 * Integrates all collaboration systems for maximum team velocity
 * 
 * This layer orchestrates Context Streaming, Collaborative Sprints,
 * and Proactive Intelligence to create a hyper-efficient AI team.
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getContextStreaming } = require('./context-streaming-system');
const { getInstance: getCollaborativeSprints } = require('./collaborative-sprint-system');
const { getInstance: getProactiveIntelligence } = require('./proactive-intelligence-system');

class EnhancedCollaborationLayer extends EventEmitter {
  constructor() {
    super();
    
    // Core collaboration systems
    this.contextStreaming = getContextStreaming();
    this.collaborativeSprints = getCollaborativeSprints();
    this.proactiveIntelligence = getProactiveIntelligence();
    
    // Active collaboration sessions
    this.activeSessions = new Map();
    
    // Agent registry with capabilities
    this.agentRegistry = new Map();
    
    // Collaboration patterns
    this.collaborationPatterns = new Map();
    
    // Performance tracking
    this.performanceBaseline = new Map();
    this.performanceGains = new Map();
    
    // Initialize default patterns
    this.initializeCollaborationPatterns();
    
    // Set up system integrations
    this.setupSystemIntegrations();
    
    // Metrics
    this.metrics = {
      totalSessions: 0,
      avgVelocityGain: 1.0,
      contextSharingRate: 0,
      proactiveContributions: 0,
      collaborationScore: 0
    };
    
    logger.info('🟢 Enhanced Collaboration Layer initialized - Team velocity maximized');
  }
  
  /**
   * Initialize default collaboration patterns
   */
  initializeCollaborationPatterns() {
    // Full-stack feature pattern
    this.registerCollaborationPattern('full-stack-feature', {
      requiredDepartments: ['strategic', 'experience', 'technical'],
      parallelizable: true,
      contextSharing: 'continuous',
      proactiveMonitoring: ['security', 'performance', 'ux']
    });
    
    // Bug fix pattern
    this.registerCollaborationPattern('bug-fix', {
      requiredDepartments: ['technical'],
      optionalDepartments: ['experience'],
      parallelizable: false,
      contextSharing: 'on-discovery',
      proactiveMonitoring: ['testing', 'performance']
    });
    
    // Architecture refactor pattern
    this.registerCollaborationPattern('architecture-refactor', {
      requiredDepartments: ['technical', 'strategic'],
      parallelizable: true,
      contextSharing: 'continuous',
      proactiveMonitoring: ['architecture', 'performance', 'testing']
    });
    
    // UI/UX enhancement pattern
    this.registerCollaborationPattern('ui-enhancement', {
      requiredDepartments: ['experience'],
      optionalDepartments: ['technical'],
      parallelizable: true,
      contextSharing: 'on-milestone',
      proactiveMonitoring: ['ux', 'accessibility', 'performance']
    });
  }
  
  /**
   * Set up integrations between collaboration systems
   */
  setupSystemIntegrations() {
    // Context streaming feeds into collaborative sprints
    this.contextStreaming.on('context:inherited', (data) => {
      logger.info(`🟢 Context inherited: ${data.fromAgent} → ${data.toAgent}`);
      this.metrics.contextSharingRate++;
    });
    
    // Collaborative sprints trigger proactive monitoring
    this.collaborativeSprints.on('sprint:started', (data) => {
      this.startProactiveMonitoring(data.sprintId, data.agents);
    });
    
    // Proactive intelligence enhances context
    this.proactiveIntelligence.on('expertise:offered', (data) => {
      this.metrics.proactiveContributions++;
      this.enhanceCollaborationWithExpertise(data);
    });
    
    // Track collaboration opportunities
    this.contextStreaming.on('collaboration:opportunity', (data) => {
      this.handleCollaborationOpportunity(data);
    });
  }
  
  /**
   * Register a collaboration pattern
   */
  registerCollaborationPattern(name, config) {
    this.collaborationPatterns.set(name, {
      name,
      ...config
    });
  }
  
  /**
   * Start enhanced collaboration session
   * This is the main entry point for collaborative work
   */
  async startCollaboration(task, availableAgents) {
    logger.info(`🟢 Starting enhanced collaboration for task: ${task.description || task}`);
    
    const sessionId = `collab-${Date.now()}`;
    const session = {
      id: sessionId,
      task,
      agents: availableAgents,
      startTime: new Date(),
      pattern: this.identifyCollaborationPattern(task),
      streams: new Map(),
      metrics: {
        contextsShared: 0,
        proactiveContributions: 0,
        parallelSprints: 0
      }
    };
    
    this.activeSessions.set(sessionId, session);
    this.metrics.totalSessions++;
    
    try {
      // Step 1: Initialize context streams for all agents
      await this.initializeContextStreams(session);
      
      // Step 2: Set up proactive monitoring based on pattern
      await this.setupProactiveMonitoring(session);
      
      // Step 3: Share initial context with all agents
      await this.shareInitialContext(session);
      
      // Step 4: Plan collaborative sprints
      const sprintPlan = await this.collaborativeSprints.planCollaborativeSprints(
        task,
        availableAgents
      );
      
      session.sprintPlan = sprintPlan;
      
      // Step 5: Execute with full collaboration
      const results = await this.executeCollaborativeWork(session, sprintPlan);
      
      // Step 6: Consolidate and share final insights
      const consolidatedResults = await this.consolidateResults(session, results);
      
      // Update metrics
      await this.updateCollaborationMetrics(session, consolidatedResults);
      
      session.endTime = new Date();
      session.results = consolidatedResults;
      
      logger.info(`🏁 Collaboration session ${sessionId} completed successfully`);
      
      return {
        sessionId,
        results: consolidatedResults,
        metrics: session.metrics,
        velocityGain: this.calculateVelocityGain(session)
      };
      
    } catch (error) {
      logger.error(`Collaboration session ${sessionId} failed: ${error.message}`);
      session.error = error;
      throw error;
    }
  }
  
  /**
   * Initialize context streams for all agents
   */
  async initializeContextStreams(session) {
    for (const agent of session.agents) {
      const streamId = this.contextStreaming.createStream(agent.id, 'collaboration');
      session.streams.set(agent.id, streamId);
      
      // Subscribe agents to relevant patterns
      const patterns = this.createSubscriptionPatterns(agent, session.task);
      this.contextStreaming.subscribeToContext(agent.id, patterns);
    }
    
    logger.info(`🟢 Initialized ${session.agents.length} context streams`);
  }
  
  /**
   * Set up proactive monitoring
   */
  async setupProactiveMonitoring(session) {
    if (!session.pattern) {return;}
    
    const monitoringAreas = session.pattern.proactiveMonitoring || [];
    
    for (const agent of session.agents) {
      // Each agent monitors for their expertise areas
      const expertise = this.getAgentExpertise(agent);
      const relevantAreas = monitoringAreas.filter(area => 
        expertise.includes(area) || this.canMonitor(agent, area)
      );
      
      if (relevantAreas.length > 0) {
        await this.proactiveIntelligence.monitorForOpportunities(
          agent.id,
          relevantAreas
        );
      }
    }
    
    logger.info(`🟢️ Set up proactive monitoring for ${monitoringAreas.join(', ')}`);
  }
  
  /**
   * Share initial context with all agents
   */
  async shareInitialContext(session) {
    const initialContext = {
      type: 'session_start',
      content: `Starting collaborative session for: ${session.task.description || session.task}`,
      task: session.task,
      pattern: session.pattern,
      participants: session.agents.map(a => ({
        id: a.id,
        department: a.department,
        expertise: this.getAgentExpertise(a)
      })),
      timestamp: new Date()
    };
    
    // Broadcast to all agents
    for (const agent of session.agents) {
      await this.contextStreaming.streamContext(agent.id, initialContext);
    }
    
    session.metrics.contextsShared++;
  }
  
  /**
   * Execute collaborative work
   */
  async executeCollaborativeWork(session, sprintPlan) {
    logger.info(`🟢 Executing collaborative work with ${sprintPlan.plan.sprints.length} sprints`);
    
    // Execute sprints collaboratively
    const results = await this.collaborativeSprints.executeCollaborativeSprints(
      sprintPlan.sessionId
    );
    
    // Track parallel sprints
    session.metrics.parallelSprints = sprintPlan.parallelGroups.length;
    
    // Handle real-time context sharing during execution
    this.contextStreaming.on('context:relevant', async (data) => {
      if (this.isSessionAgent(session, data.subscriberAgent)) {
        session.metrics.contextsShared++;
        await this.handleRelevantContext(session, data);
      }
    });
    
    // Process proactive contributions during execution
    this.proactiveIntelligence.on('expertise:offered', async (data) => {
      if (this.isSessionAgent(session, data.fromAgent)) {
        session.metrics.proactiveContributions++;
        await this.integrateProactiveExpertise(session, data);
      }
    });
    
    return results;
  }
  
  /**
   * Consolidate results from all agents
   */
  async consolidateResults(session, results) {
    const consolidated = {
      completedTasks: results.completedSprints || [],
      insights: [],
      discoveries: [],
      recommendations: [],
      warnings: [],
      artifacts: [],
      knowledge: []
    };
    
    // Gather all context from session
    for (const [agentId, streamId] of session.streams) {
      const stream = this.contextStreaming.activeStreams.get(streamId);
      if (!stream) {continue;}
      
      // Extract valuable information from contexts
      for (const context of stream.contexts) {
        if (context.insights) {consolidated.insights.push(...context.insights);}
        if (context.discoveries) {consolidated.discoveries.push(...context.discoveries);}
        if (context.recommendations) {consolidated.recommendations.push(...context.recommendations);}
        if (context.warnings) {consolidated.warnings.push(...context.warnings);}
      }
    }
    
    // Deduplicate and prioritize
    consolidated.insights = this.deduplicateAndPrioritize(consolidated.insights);
    consolidated.discoveries = this.deduplicateAndPrioritize(consolidated.discoveries);
    consolidated.recommendations = this.deduplicateAndPrioritize(consolidated.recommendations);
    consolidated.warnings = this.deduplicateAndPrioritize(consolidated.warnings);
    
    // Create knowledge summary
    consolidated.knowledge = this.createKnowledgeSummary(session, consolidated);
    
    return consolidated;
  }
  
  /**
   * Handle collaboration opportunity
   */
  async handleCollaborationOpportunity(data) {
    const opportunities = data.opportunities;
    
    for (const opp of opportunities) {
      switch (opp.type) {
        case 'expertise_needed':
          // Find agent with needed expertise
          const expert = this.findExpert(opp.expertise);
          if (expert) {
            await this.requestExpertise(opp.requestingAgent, expert, opp);
          }
          break;
          
        case 'parallel_work':
          // Suggest collaboration to agents
          await this.suggestCollaboration(opp.agents, opp);
          break;
          
        case 'expertise_available':
          // Broadcast availability
          await this.broadcastExpertiseAvailability(opp);
          break;
      }
    }
  }
  
  /**
   * Enhance collaboration with proactive expertise
   */
  async enhanceCollaborationWithExpertise(data) {
    // Find active session for agent
    const session = this.findSessionForAgent(data.fromAgent);
    if (!session) {return;}
    
    // Integrate expertise into session context
    const enhancedContext = {
      type: 'expertise_contribution',
      content: `Proactive expertise from ${data.fromAgent}`,
      pattern: data.pattern,
      priority: data.priority,
      contributionId: data.contributionId,
      timestamp: new Date()
    };
    
    // Share with relevant agents
    for (const agent of session.agents) {
      if (agent.id !== data.fromAgent) {
        await this.contextStreaming.streamContext(agent.id, enhancedContext);
      }
    }
  }
  
  /**
   * Start proactive monitoring for sprint
   */
  async startProactiveMonitoring(sprintId, agents) {
    // Enable monitoring for sprint-specific patterns
    for (const agent of agents) {
      const expertise = this.getAgentExpertise(agent);
      await this.proactiveIntelligence.monitorForOpportunities(agent.id, expertise);
    }
  }
  
  // Utility methods
  
  identifyCollaborationPattern(task) {
    const taskDesc = (task.description || task).toLowerCase();
    
    if (taskDesc.includes('feature') || taskDesc.includes('implement')) {
      return this.collaborationPatterns.get('full-stack-feature');
    }
    if (taskDesc.includes('bug') || taskDesc.includes('fix')) {
      return this.collaborationPatterns.get('bug-fix');
    }
    if (taskDesc.includes('refactor') || taskDesc.includes('architecture')) {
      return this.collaborationPatterns.get('architecture-refactor');
    }
    if (taskDesc.includes('ui') || taskDesc.includes('design')) {
      return this.collaborationPatterns.get('ui-enhancement');
    }
    
    // Default to full-stack pattern
    return this.collaborationPatterns.get('full-stack-feature');
  }
  
  createSubscriptionPatterns(agent, task) {
    const patterns = [];
    
    // Department-specific patterns
    switch (agent.department) {
      case 'strategic':
        patterns.push(
          { type: 'requirements', keywords: ['requirement', 'spec', 'need'] },
          { type: 'business', keywords: ['roi', 'value', 'cost', 'benefit'] }
        );
        break;
      case 'experience':
        patterns.push(
          { type: 'design', keywords: ['ui', 'ux', 'component', 'style'] },
          { type: 'user', keywords: ['user', 'experience', 'interaction'] }
        );
        break;
      case 'technical':
        patterns.push(
          { type: 'technical', keywords: ['api', 'database', 'backend', 'performance'] },
          { type: 'architecture', keywords: ['structure', 'pattern', 'design'] }
        );
        break;
    }
    
    // Task-specific patterns
    const taskKeywords = (task.description || task).toLowerCase().split(/\s+/);
    patterns.push({
      type: 'task-specific',
      keywords: taskKeywords.slice(0, 5) // Top 5 keywords
    });
    
    return patterns;
  }
  
  getAgentExpertise(agent) {
    const expertise = [];
    
    switch (agent.department) {
      case 'strategic':
        expertise.push('requirements', 'business', 'strategy');
        break;
      case 'experience':
        expertise.push('design', 'ux', 'accessibility');
        break;
      case 'technical':
        expertise.push('architecture', 'performance', 'security', 'testing');
        break;
    }
    
    // Add agent-specific expertise if available
    if (agent.expertise) {
      expertise.push(...agent.expertise);
    }
    
    return expertise;
  }
  
  canMonitor(agent, area) {
    // Check if agent can monitor specific area
    const capabilities = {
      'strategic': ['business', 'requirements'],
      'experience': ['ux', 'design', 'accessibility'],
      'technical': ['security', 'performance', 'architecture', 'testing']
    };
    
    return capabilities[agent.department]?.includes(area) || false;
  }
  
  isSessionAgent(session, agentId) {
    return session.agents.some(a => a.id === agentId);
  }
  
  async handleRelevantContext(session, data) {
    // Process relevant context within session
    logger.info(`🟢 Relevant context shared in session ${session.id}`);
  }
  
  async integrateProactiveExpertise(session, data) {
    // Integrate proactive expertise into session
    logger.info(`🟢 Proactive expertise integrated in session ${session.id}`);
  }
  
  deduplicateAndPrioritize(items) {
    // Simple deduplication - in production would be more sophisticated
    const unique = [...new Set(items.map(i => JSON.stringify(i)))];
    return unique.map(i => JSON.parse(i)).slice(0, 10); // Top 10
  }
  
  createKnowledgeSummary(session, consolidated) {
    return {
      sessionId: session.id,
      task: session.task,
      duration: session.endTime - session.startTime,
      participants: session.agents.length,
      keyInsights: consolidated.insights.slice(0, 3),
      mainDiscoveries: consolidated.discoveries.slice(0, 3),
      topRecommendations: consolidated.recommendations.slice(0, 3),
      criticalWarnings: consolidated.warnings.filter(w => w.priority === 'high')
    };
  }
  
  findExpert(expertise) {
    // Find agent with specific expertise
    for (const [agentId, agent] of this.agentRegistry) {
      if (this.getAgentExpertise(agent).includes(expertise)) {
        return agent;
      }
    }
    return null;
  }
  
  async requestExpertise(requestingAgent, expert, opportunity) {
    logger.info(`🟢 Requesting expertise from ${expert.id} for ${requestingAgent}`);
    // Implementation would trigger expertise request
  }
  
  async suggestCollaboration(agents, opportunity) {
    logger.info(`🟢 Suggesting collaboration between ${agents.join(', ')}`);
    // Implementation would suggest collaboration
  }
  
  async broadcastExpertiseAvailability(opportunity) {
    logger.info(`🟢 Broadcasting expertise availability: ${opportunity.area}`);
    // Implementation would broadcast availability
  }
  
  findSessionForAgent(agentId) {
    for (const session of this.activeSessions.values()) {
      if (this.isSessionAgent(session, agentId)) {
        return session;
      }
    }
    return null;
  }
  
  calculateVelocityGain(session) {
    // Calculate actual velocity improvement
    const baselineTime = session.task.estimatedTime || (session.agents.length * 600000); // 10min per agent
    const actualTime = session.endTime - session.startTime;
    
    return baselineTime / actualTime;
  }
  
  async updateCollaborationMetrics(session, results) {
    // Update global metrics
    const velocityGain = this.calculateVelocityGain(session);
    this.metrics.avgVelocityGain = 
      (this.metrics.avgVelocityGain * (this.metrics.totalSessions - 1) + velocityGain) / 
      this.metrics.totalSessions;
    
    // Calculate collaboration score
    const contextScore = Math.min(100, session.metrics.contextsShared * 5);
    const proactiveScore = Math.min(100, session.metrics.proactiveContributions * 20);
    const parallelScore = Math.min(100, session.metrics.parallelSprints * 25);
    
    this.metrics.collaborationScore = (contextScore + proactiveScore + parallelScore) / 3;
    
    logger.info(`🟢 Collaboration metrics updated: Velocity ${velocityGain.toFixed(1)}x, Score ${this.metrics.collaborationScore.toFixed(0)}`);
  }
  
  /**
   * Register an agent with the collaboration layer
   */
  registerAgent(agent) {
    this.agentRegistry.set(agent.id, agent);
    logger.info(`🟢 Registered agent ${agent.id} with collaboration layer`);
  }
  
  /**
   * Get collaboration metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.activeSessions.size,
      registeredAgents: this.agentRegistry.size,
      contextStreaming: this.contextStreaming.getMetrics(),
      collaborativeSprints: this.collaborativeSprints.getMetrics(),
      proactiveIntelligence: this.proactiveIntelligence.getMetrics()
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  EnhancedCollaborationLayer,
  getInstance: () => {
    if (!instance) {
      instance = new EnhancedCollaborationLayer();
    }
    return instance;
  }
};