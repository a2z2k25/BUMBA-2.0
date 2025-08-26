/**
 * BUMBA Intelligent Context Streaming System
 * Revolutionary real-time context sharing for maximum team velocity
 * 
 * This system enables agents to share deep working context continuously,
 * preventing the massive context loss that occurs during handoffs.
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class ContextStreamingSystem extends EventEmitter {
  constructor() {
    super();
    
    // Active context streams by agent
    this.activeStreams = new Map();
    
    // Context subscriptions
    this.subscriptions = new Map();
    
    // Shared working memory
    this.workingMemory = new Map();
    
    // Context patterns for intelligent routing
    this.contextPatterns = new Map();
    
    // Performance metrics
    this.metrics = {
      streamsCreated: 0,
      contextsShared: 0,
      subscriptionsActive: 0,
      avgContextSize: 0,
      contextHits: 0
    };
    
    logger.info('🟢 Context Streaming System initialized - Team velocity amplifier engaged');
  }
  
  /**
   * Create a new context stream for an agent
   */
  createStream(agentId, streamType = 'working') {
    const streamId = `${agentId}-${streamType}-${Date.now()}`;
    
    const stream = {
      id: streamId,
      agentId,
      type: streamType,
      created: new Date(),
      contexts: [],
      subscribers: new Set(),
      metadata: {
        taskId: null,
        department: null,
        priority: 'normal'
      }
    };
    
    this.activeStreams.set(streamId, stream);
    this.metrics.streamsCreated++;
    
    // Notify potential subscribers
    this.emit('stream:created', {
      streamId,
      agentId,
      type: streamType
    });
    
    logger.info(`🟢 Created context stream ${streamId} for agent ${agentId}`);
    
    return streamId;
  }
  
  /**
   * Stream context from an agent
   * This is the GAME CHANGER - agents continuously share their thinking
   */
  async streamContext(agentId, context) {
    try {
      // Structure the context for maximum value
      const structuredContext = {
        id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        timestamp: new Date(),
        type: context.type || 'analysis',
        content: context.content,
        
        // Deep context that prevents redundant work
        insights: context.insights || [],
        discoveries: context.discoveries || [],
        deadEnds: context.deadEnds || [], // What NOT to try
        assumptions: context.assumptions || [],
        questions: context.questions || [],
        
        // Relationships to other contexts
        relatedContexts: context.relatedContexts || [],
        supersedes: context.supersedes || null,
        
        // Actionable intelligence
        recommendations: context.recommendations || [],
        warnings: context.warnings || [],
        opportunities: context.opportunities || [],
        
        // Technical details
        codePatterns: context.codePatterns || [],
        dependencies: context.dependencies || [],
        constraints: context.constraints || [],
        
        // Collaboration hints
        needsExpertise: context.needsExpertise || [],
        canHelp: context.canHelp || [],
        
        // Priority and relevance
        priority: context.priority || 'normal',
        confidence: context.confidence || 0.7,
        relevanceScore: 1.0
      };
      
      // Add to agent's stream
      const streams = Array.from(this.activeStreams.values())
        .filter(s => s.agentId === agentId);
      
      for (const stream of streams) {
        stream.contexts.push(structuredContext);
        
        // Keep stream size manageable (rolling window)
        if (stream.contexts.length > 100) {
          stream.contexts.shift();
        }
      }
      
      // Add to working memory for cross-agent access
      this.addToWorkingMemory(structuredContext);
      
      // Notify subscribers intelligently
      await this.notifyRelevantSubscribers(structuredContext);
      
      // Update metrics
      this.metrics.contextsShared++;
      this.updateAverageContextSize(structuredContext);
      
      // Check for collaboration opportunities
      const opportunities = await this.identifyCollaborationOpportunities(structuredContext);
      if (opportunities.length > 0) {
        this.emit('collaboration:opportunity', {
          context: structuredContext,
          opportunities
        });
      }
      
      return structuredContext.id;
      
    } catch (error) {
      logger.error(`Failed to stream context: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Subscribe to context patterns
   * Agents can listen for relevant context from other agents
   */
  subscribeToContext(agentId, patterns) {
    const subscription = {
      agentId,
      patterns: patterns || [],
      created: new Date(),
      hits: 0
    };
    
    this.subscriptions.set(agentId, subscription);
    this.metrics.subscriptionsActive++;
    
    logger.info(`🟢 Agent ${agentId} subscribed to context patterns`);
    
    return subscription;
  }
  
  /**
   * Get relevant context for an agent
   * This prevents agents from starting from scratch
   */
  async getRelevantContext(agentId, task) {
    const relevantContexts = [];
    
    // Get contexts from working memory
    for (const [id, context] of this.workingMemory) {
      const relevance = this.calculateRelevance(context, task);
      
      if (relevance > 0.3) {
        relevantContexts.push({
          ...context,
          relevanceScore: relevance
        });
      }
    }
    
    // Sort by relevance
    relevantContexts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Limit to most relevant
    const topContexts = relevantContexts.slice(0, 10);
    
    if (topContexts.length > 0) {
      logger.info(`🟢 Found ${topContexts.length} relevant contexts for ${agentId}`);
      this.metrics.contextHits += topContexts.length;
    }
    
    return topContexts;
  }
  
  /**
   * Intelligent context inheritance for handoffs
   * This is what makes handoffs 5x faster
   */
  async inheritContext(fromAgentId, toAgentId, task) {
    logger.info(`🟢 Inheriting context from ${fromAgentId} to ${toAgentId}`);
    
    // Get all contexts from the source agent
    const sourceContexts = [];
    for (const stream of this.activeStreams.values()) {
      if (stream.agentId === fromAgentId) {
        sourceContexts.push(...stream.contexts);
      }
    }
    
    // Filter and transform for the receiving agent
    const inheritedContext = {
      id: `inherited-${Date.now()}`,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      task,
      timestamp: new Date(),
      
      // Consolidated insights
      insights: this.consolidateInsights(sourceContexts),
      discoveries: this.consolidateDiscoveries(sourceContexts),
      deadEnds: this.consolidateDeadEnds(sourceContexts),
      
      // Critical information
      assumptions: this.extractAssumptions(sourceContexts),
      constraints: this.extractConstraints(sourceContexts),
      dependencies: this.extractDependencies(sourceContexts),
      
      // Action items
      recommendations: this.extractRecommendations(sourceContexts),
      warnings: this.extractWarnings(sourceContexts),
      
      // Collaboration needs
      needsExpertise: this.extractExpertiseNeeds(sourceContexts),
      
      // Summary
      summary: this.generateContextSummary(sourceContexts)
    };
    
    // Create a stream for the receiving agent if needed
    let targetStream = Array.from(this.activeStreams.values())
      .find(s => s.agentId === toAgentId);
    
    if (!targetStream) {
      const streamId = this.createStream(toAgentId, 'inherited');
      targetStream = this.activeStreams.get(streamId);
    }
    
    // Add inherited context
    targetStream.contexts.push(inheritedContext);
    
    // Notify the receiving agent
    this.emit('context:inherited', {
      toAgent: toAgentId,
      fromAgent: fromAgentId,
      contextId: inheritedContext.id,
      insightCount: inheritedContext.insights.length
    });
    
    return inheritedContext;
  }
  
  /**
   * Add context to working memory
   */
  addToWorkingMemory(context) {
    // Keep working memory size bounded
    if (this.workingMemory.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.workingMemory.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < 100; i++) {
        this.workingMemory.delete(entries[i][0]);
      }
    }
    
    this.workingMemory.set(context.id, context);
  }
  
  /**
   * Notify relevant subscribers about new context
   */
  async notifyRelevantSubscribers(context) {
    for (const [agentId, subscription] of this.subscriptions) {
      // Skip self
      if (agentId === context.agentId) {continue;}
      
      // Check if context matches subscription patterns
      const matches = this.contextMatchesPatterns(context, subscription.patterns);
      
      if (matches) {
        subscription.hits++;
        
        this.emit('context:relevant', {
          subscriberAgent: agentId,
          context,
          matchedPatterns: matches
        });
        
        logger.info(`🟢 Notified ${agentId} about relevant context from ${context.agentId}`);
      }
    }
  }
  
  /**
   * Identify collaboration opportunities
   */
  async identifyCollaborationOpportunities(context) {
    const opportunities = [];
    
    // Check if agent needs help
    if (context.needsExpertise && context.needsExpertise.length > 0) {
      for (const expertise of context.needsExpertise) {
        opportunities.push({
          type: 'expertise_needed',
          expertise,
          requestingAgent: context.agentId,
          priority: context.priority
        });
      }
    }
    
    // Check if agent can help others
    if (context.canHelp && context.canHelp.length > 0) {
      for (const area of context.canHelp) {
        opportunities.push({
          type: 'expertise_available',
          area,
          offeringAgent: context.agentId
        });
      }
    }
    
    // Check for complementary work
    for (const [id, otherContext] of this.workingMemory) {
      if (otherContext.agentId === context.agentId) {continue;}
      
      // Look for related work
      const overlap = this.calculateOverlap(context, otherContext);
      if (overlap > 0.5) {
        opportunities.push({
          type: 'parallel_work',
          agents: [context.agentId, otherContext.agentId],
          overlapScore: overlap,
          suggestion: 'Consider collaborating on related work'
        });
      }
    }
    
    return opportunities;
  }
  
  /**
   * Calculate relevance score
   */
  calculateRelevance(context, task) {
    let score = 0;
    
    // Check content similarity
    if (context.content && task.description) {
      const contentWords = context.content.toLowerCase().split(/\s+/);
      const taskWords = task.description.toLowerCase().split(/\s+/);
      
      const commonWords = contentWords.filter(w => taskWords.includes(w));
      score += commonWords.length / Math.max(taskWords.length, 1) * 0.3;
    }
    
    // Check if insights are relevant
    if (context.insights) {
      for (const insight of context.insights) {
        if (task.description && task.description.includes(insight.keyword || '')) {
          score += 0.1;
        }
      }
    }
    
    // Check dependencies
    if (context.dependencies && task.dependencies) {
      const commonDeps = context.dependencies.filter(d => 
        task.dependencies.includes(d)
      );
      score += commonDeps.length * 0.15;
    }
    
    // Time decay - newer contexts are more relevant
    const age = Date.now() - new Date(context.timestamp).getTime();
    const ageHours = age / (1000 * 60 * 60);
    const timeFactor = Math.max(0, 1 - (ageHours / 24));
    score *= (0.5 + timeFactor * 0.5);
    
    return Math.min(1, score);
  }
  
  /**
   * Check if context matches subscription patterns
   */
  contextMatchesPatterns(context, patterns) {
    const matches = [];
    
    for (const pattern of patterns) {
      if (pattern.type && context.type === pattern.type) {
        matches.push(pattern);
      }
      
      if (pattern.keywords) {
        const contentStr = JSON.stringify(context).toLowerCase();
        const hasKeyword = pattern.keywords.some(k => 
          contentStr.includes(k.toLowerCase())
        );
        if (hasKeyword) {matches.push(pattern);}
      }
      
      if (pattern.agentType && context.agentId.includes(pattern.agentType)) {
        matches.push(pattern);
      }
    }
    
    return matches.length > 0 ? matches : null;
  }
  
  /**
   * Calculate overlap between contexts
   */
  calculateOverlap(context1, context2) {
    let overlap = 0;
    
    // Check dependency overlap
    if (context1.dependencies && context2.dependencies) {
      const common = context1.dependencies.filter(d => 
        context2.dependencies.includes(d)
      );
      overlap += common.length * 0.2;
    }
    
    // Check if working on same area
    if (context1.codePatterns && context2.codePatterns) {
      const commonPatterns = context1.codePatterns.filter(p =>
        context2.codePatterns.includes(p)
      );
      overlap += commonPatterns.length * 0.3;
    }
    
    return Math.min(1, overlap);
  }
  
  // Consolidation methods for context inheritance
  
  consolidateInsights(contexts) {
    const insights = [];
    const seen = new Set();
    
    for (const ctx of contexts) {
      if (ctx.insights) {
        for (const insight of ctx.insights) {
          const key = JSON.stringify(insight);
          if (!seen.has(key)) {
            seen.add(key);
            insights.push(insight);
          }
        }
      }
    }
    
    return insights;
  }
  
  consolidateDiscoveries(contexts) {
    const discoveries = [];
    for (const ctx of contexts) {
      if (ctx.discoveries) {
        discoveries.push(...ctx.discoveries);
      }
    }
    return [...new Set(discoveries)];
  }
  
  consolidateDeadEnds(contexts) {
    const deadEnds = [];
    for (const ctx of contexts) {
      if (ctx.deadEnds) {
        deadEnds.push(...ctx.deadEnds);
      }
    }
    return [...new Set(deadEnds)];
  }
  
  extractAssumptions(contexts) {
    const assumptions = [];
    for (const ctx of contexts) {
      if (ctx.assumptions) {
        assumptions.push(...ctx.assumptions);
      }
    }
    return [...new Set(assumptions)];
  }
  
  extractConstraints(contexts) {
    const constraints = [];
    for (const ctx of contexts) {
      if (ctx.constraints) {
        constraints.push(...ctx.constraints);
      }
    }
    return [...new Set(constraints)];
  }
  
  extractDependencies(contexts) {
    const deps = new Set();
    for (const ctx of contexts) {
      if (ctx.dependencies) {
        ctx.dependencies.forEach(d => deps.add(d));
      }
    }
    return Array.from(deps);
  }
  
  extractRecommendations(contexts) {
    const recs = [];
    for (const ctx of contexts) {
      if (ctx.recommendations) {
        recs.push(...ctx.recommendations);
      }
    }
    return recs;
  }
  
  extractWarnings(contexts) {
    const warnings = [];
    for (const ctx of contexts) {
      if (ctx.warnings) {
        warnings.push(...ctx.warnings);
      }
    }
    return warnings;
  }
  
  extractExpertiseNeeds(contexts) {
    const needs = new Set();
    for (const ctx of contexts) {
      if (ctx.needsExpertise) {
        ctx.needsExpertise.forEach(n => needs.add(n));
      }
    }
    return Array.from(needs);
  }
  
  generateContextSummary(contexts) {
    return {
      totalContexts: contexts.length,
      types: [...new Set(contexts.map(c => c.type))],
      timeRange: {
        start: contexts[0]?.timestamp,
        end: contexts[contexts.length - 1]?.timestamp
      },
      keyInsights: contexts
        .filter(c => c.insights && c.insights.length > 0)
        .slice(-3)
        .map(c => c.insights[0])
    };
  }
  
  /**
   * Update average context size metric
   */
  updateAverageContextSize(context) {
    const size = JSON.stringify(context).length;
    const currentAvg = this.metrics.avgContextSize;
    const totalContexts = this.metrics.contextsShared;
    
    this.metrics.avgContextSize = 
      (currentAvg * (totalContexts - 1) + size) / totalContexts;
  }
  
  /**
   * Get streaming system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeStreams: this.activeStreams.size,
      workingMemorySize: this.workingMemory.size,
      subscriptions: this.subscriptions.size
    };
  }
  
  /**
   * Clean up old streams
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, stream] of this.activeStreams) {
      const age = now - stream.created.getTime();
      if (age > maxAge) {
        this.activeStreams.delete(id);
        logger.info(`🟢 Cleaned up old stream ${id}`);
      }
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ContextStreamingSystem,
  getInstance: () => {
    if (!instance) {
      instance = new ContextStreamingSystem();
    }
    return instance;
  }
};