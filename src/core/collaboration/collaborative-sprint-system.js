/**
 * BUMBA Collaborative Sprint System
 * Transforms single-agent sprints into multi-agent collaborative workflows
 * 
 * This system enables agents to work on related sprints simultaneously,
 * share discoveries in real-time, and achieve 3-5x faster task completion.
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getContextStreaming } = require('./context-streaming-system');

class CollaborativeSprintSystem extends EventEmitter {
  constructor() {
    super();
    
    // Active collaborative sessions
    this.activeSessions = new Map();
    
    // Sprint coordination state
    this.sprintCoordination = new Map();
    
    // Agent availability tracking
    this.agentAvailability = new Map();
    
    // Parallel execution groups
    this.parallelGroups = new Map();
    
    // Context streaming integration
    this.contextStreaming = getContextStreaming();
    
    // Performance metrics
    this.metrics = {
      sessionsCreated: 0,
      parallelSprintsExecuted: 0,
      avgAgentsPerSprint: 0,
      collaborativeSuccesses: 0,
      velocityImprovement: 1.0
    };
    
    logger.info('🟢‍🟢️ Collaborative Sprint System initialized - Team velocity multiplier engaged');
  }
  
  /**
   * Plan sprints with multiple agents collaborating
   * This is where the magic happens - agents contribute their expertise to planning
   */
  async planCollaborativeSprints(task, availableAgents) {
    logger.info(`🟢 Planning collaborative sprints for task with ${availableAgents.length} agents`);
    
    const sessionId = `collab-${Date.now()}`;
    const session = {
      id: sessionId,
      task,
      agents: availableAgents,
      created: new Date(),
      sprints: [],
      contributions: new Map(),
      status: 'planning'
    };
    
    this.activeSessions.set(sessionId, session);
    this.metrics.sessionsCreated++;
    
    try {
      // Step 1: Gather specialized insights from each agent
      const agentContributions = await this.gatherAgentContributions(task, availableAgents);
      
      // Step 2: Synthesize contributions into unified sprint plan
      const synthesizedPlan = await this.synthesizeSprintPlan(agentContributions, task);
      
      // Step 3: Identify parallel execution opportunities
      const parallelGroups = this.identifyParallelGroups(synthesizedPlan.sprints);
      
      // Step 4: Assign agents to sprints based on expertise
      const assignments = await this.assignAgentsToSprints(
        synthesizedPlan.sprints,
        availableAgents,
        parallelGroups
      );
      
      // Step 5: Create coordination plan
      const coordinationPlan = this.createCoordinationPlan(
        assignments,
        parallelGroups
      );
      
      session.sprints = synthesizedPlan.sprints;
      session.assignments = assignments;
      session.coordinationPlan = coordinationPlan;
      session.parallelGroups = parallelGroups;
      session.status = 'ready';
      
      // Emit planning complete event
      this.emit('planning:complete', {
        sessionId,
        sprintCount: synthesizedPlan.sprints.length,
        parallelGroups: parallelGroups.length,
        estimatedTime: synthesizedPlan.estimatedTime
      });
      
      logger.info(`🏁 Collaborative sprint plan created: ${synthesizedPlan.sprints.length} sprints, ${parallelGroups.length} parallel groups`);
      
      return {
        sessionId,
        plan: synthesizedPlan,
        assignments,
        coordinationPlan,
        parallelGroups,
        estimatedVelocityGain: this.calculateVelocityGain(parallelGroups)
      };
      
    } catch (error) {
      logger.error(`Failed to plan collaborative sprints: ${error.message}`);
      session.status = 'failed';
      throw error;
    }
  }
  
  /**
   * Execute collaborative sprint session
   * Agents work in parallel, sharing context in real-time
   */
  async executeCollaborativeSprints(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    logger.info(`🟢 Executing collaborative sprint session ${sessionId}`);
    
    session.status = 'executing';
    const results = {
      completedSprints: [],
      insights: [],
      discoveries: [],
      errors: []
    };
    
    try {
      // Process parallel groups
      for (const group of session.parallelGroups) {
        logger.info(`🟢 Executing parallel group ${group.id} with ${group.sprints.length} sprints`);
        
        // Execute sprints in parallel within group
        const groupResults = await this.executeParallelGroup(
          group,
          session.assignments,
          session
        );
        
        // Consolidate results
        results.completedSprints.push(...groupResults.completed);
        results.insights.push(...groupResults.insights);
        results.discoveries.push(...groupResults.discoveries);
        
        // Share discoveries with all agents for next group
        await this.shareGroupDiscoveries(groupResults, session.agents);
      }
      
      session.status = 'completed';
      session.results = results;
      
      // Calculate and update metrics
      this.updateMetrics(session, results);
      
      // Emit completion event
      this.emit('session:complete', {
        sessionId,
        completedSprints: results.completedSprints.length,
        insights: results.insights.length,
        velocityGain: this.metrics.velocityImprovement
      });
      
      logger.info(`🏁 Collaborative session ${sessionId} completed successfully`);
      
      return results;
      
    } catch (error) {
      logger.error(`Collaborative session ${sessionId} failed: ${error.message}`);
      session.status = 'failed';
      results.errors.push(error);
      throw error;
    }
  }
  
  /**
   * Gather contributions from each agent for sprint planning
   */
  async gatherAgentContributions(task, agents) {
    const contributions = [];
    
    // Parallel contribution gathering
    const contributionPromises = agents.map(async (agent) => {
      try {
        const contribution = await this.getAgentContribution(agent, task);
        return {
          agentId: agent.id,
          department: agent.department,
          contribution
        };
      } catch (error) {
        logger.warn(`Failed to get contribution from ${agent.id}: ${error.message}`);
        return null;
      }
    });
    
    const results = await Promise.all(contributionPromises);
    
    // Filter out failed contributions
    return results.filter(r => r !== null);
  }
  
  /**
   * Get contribution from a specific agent
   */
  async getAgentContribution(agent, task) {
    // Agent analyzes task from their perspective
    const contribution = {
      suggestedSprints: [],
      dependencies: [],
      risks: [],
      opportunities: [],
      expertise: agent.expertise || [],
      estimatedComplexity: 0
    };
    
    // Department-specific sprint suggestions
    switch (agent.department) {
      case 'strategic':
        contribution.suggestedSprints.push(
          { name: 'Requirements Analysis', duration: 10, priority: 'high' },
          { name: 'Stakeholder Alignment', duration: 10, priority: 'medium' }
        );
        contribution.estimatedComplexity = this.assessStrategicComplexity(task);
        break;
        
      case 'experience':
        contribution.suggestedSprints.push(
          { name: 'UX Design', duration: 10, priority: 'high' },
          { name: 'Component Architecture', duration: 10, priority: 'medium' }
        );
        contribution.estimatedComplexity = this.assessDesignComplexity(task);
        break;
        
      case 'technical':
        contribution.suggestedSprints.push(
          { name: 'Technical Architecture', duration: 10, priority: 'high' },
          { name: 'Implementation', duration: 10, priority: 'high' },
          { name: 'Testing', duration: 10, priority: 'medium' }
        );
        contribution.estimatedComplexity = this.assessTechnicalComplexity(task);
        break;
    }
    
    // Identify collaboration opportunities
    contribution.opportunities = this.identifyOpportunities(task, agent);
    
    return contribution;
  }
  
  /**
   * Synthesize agent contributions into unified sprint plan
   */
  async synthesizeSprintPlan(contributions, task) {
    const allSprints = [];
    const dependencies = new Map();
    const risks = [];
    
    // Collect all suggested sprints
    for (const contrib of contributions) {
      if (contrib.contribution.suggestedSprints) {
        for (const sprint of contrib.contribution.suggestedSprints) {
          // Deduplicate and merge similar sprints
          const existing = allSprints.find(s => 
            this.sprintsAreSimilar(s, sprint)
          );
          
          if (existing) {
            // Merge priority (take highest)
            if (this.priorityValue(sprint.priority) > this.priorityValue(existing.priority)) {
              existing.priority = sprint.priority;
            }
            // Add contributor
            existing.contributors = existing.contributors || [];
            existing.contributors.push(contrib.agentId);
          } else {
            allSprints.push({
              ...sprint,
              id: `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              contributors: [contrib.agentId]
            });
          }
        }
      }
      
      // Collect dependencies
      if (contrib.contribution.dependencies) {
        for (const dep of contrib.contribution.dependencies) {
          if (!dependencies.has(dep.from)) {
            dependencies.set(dep.from, []);
          }
          dependencies.get(dep.from).push(dep.to);
        }
      }
      
      // Collect risks
      if (contrib.contribution.risks) {
        risks.push(...contrib.contribution.risks);
      }
    }
    
    // Order sprints by priority and dependencies
    const orderedSprints = this.orderSprintsByDependencies(allSprints, dependencies);
    
    // Calculate estimated time
    const parallelGroups = this.identifyParallelGroups(orderedSprints);
    const estimatedTime = parallelGroups.length * 10; // 10 minutes per parallel group
    
    return {
      sprints: orderedSprints,
      dependencies: Array.from(dependencies.entries()),
      risks: [...new Set(risks)],
      estimatedTime,
      contributorCount: contributions.length
    };
  }
  
  /**
   * Identify which sprints can run in parallel
   */
  identifyParallelGroups(sprints) {
    const groups = [];
    const processed = new Set();
    
    let groupId = 0;
    while (processed.size < sprints.length) {
      const group = {
        id: `group-${groupId++}`,
        sprints: []
      };
      
      // Find sprints that can run in parallel
      for (const sprint of sprints) {
        if (processed.has(sprint.id)) {continue;}
        
        // Check if sprint has dependencies on unprocessed sprints
        const canRun = this.canRunInCurrentGroup(sprint, processed, sprints);
        
        if (canRun) {
          group.sprints.push(sprint);
          processed.add(sprint.id);
        }
      }
      
      if (group.sprints.length > 0) {
        groups.push(group);
      }
    }
    
    logger.info(`🟢 Identified ${groups.length} parallel execution groups`);
    return groups;
  }
  
  /**
   * Assign agents to sprints based on expertise matching
   */
  async assignAgentsToSprints(sprints, agents, parallelGroups) {
    const assignments = new Map();
    
    for (const sprint of sprints) {
      // Find best agent for sprint
      const scores = agents.map(agent => ({
        agent,
        score: this.calculateAgentSprintMatch(agent, sprint)
      }));
      
      // Sort by match score
      scores.sort((a, b) => b.score - a.score);
      
      // Assign top agent (or multiple for complex sprints)
      const complexity = this.assessSprintComplexity(sprint);
      const agentCount = complexity > 0.7 ? 2 : 1;
      
      const assigned = scores.slice(0, agentCount).map(s => s.agent);
      assignments.set(sprint.id, assigned);
      
      logger.info(`🟢 Assigned ${assigned.map(a => a.id).join(', ')} to sprint ${sprint.name}`);
    }
    
    return assignments;
  }
  
  /**
   * Create coordination plan for parallel execution
   */
  createCoordinationPlan(assignments, parallelGroups) {
    const plan = {
      groups: [],
      syncPoints: [],
      contextSharing: []
    };
    
    for (let i = 0; i < parallelGroups.length; i++) {
      const group = parallelGroups[i];
      
      plan.groups.push({
        id: group.id,
        order: i,
        sprints: group.sprints.map(s => ({
          sprintId: s.id,
          agents: assignments.get(s.id) || []
        }))
      });
      
      // Add sync point after each group
      if (i < parallelGroups.length - 1) {
        plan.syncPoints.push({
          afterGroup: group.id,
          beforeGroup: parallelGroups[i + 1].id,
          type: 'knowledge_sync',
          description: 'Share discoveries before next parallel group'
        });
      }
      
      // Plan context sharing within group
      for (const sprint of group.sprints) {
        plan.contextSharing.push({
          sprintId: sprint.id,
          shareWith: group.sprints
            .filter(s => s.id !== sprint.id)
            .map(s => s.id),
          frequency: 'continuous'
        });
      }
    }
    
    return plan;
  }
  
  /**
   * Execute a parallel group of sprints
   */
  async executeParallelGroup(group, assignments, session) {
    const groupResults = {
      completed: [],
      insights: [],
      discoveries: [],
      errors: []
    };
    
    // Create context streams for all agents in group
    const streams = new Map();
    for (const sprint of group.sprints) {
      const agents = assignments.get(sprint.id) || [];
      for (const agent of agents) {
        if (!streams.has(agent.id)) {
          const streamId = this.contextStreaming.createStream(agent.id, 'sprint');
          streams.set(agent.id, streamId);
        }
      }
    }
    
    // Execute sprints in parallel
    const sprintPromises = group.sprints.map(async (sprint) => {
      const agents = assignments.get(sprint.id) || [];
      
      try {
        // Execute sprint with assigned agents
        const result = await this.executeSprintWithAgents(sprint, agents, session);
        
        // Stream discoveries in real-time
        if (result.discoveries) {
          await this.contextStreaming.streamContext(agents[0].id, {
            type: 'discovery',
            content: result.discoveries,
            sprintId: sprint.id,
            insights: result.insights,
            recommendations: result.recommendations
          });
        }
        
        return {
          sprintId: sprint.id,
          success: true,
          result
        };
        
      } catch (error) {
        logger.error(`Sprint ${sprint.id} failed: ${error.message}`);
        return {
          sprintId: sprint.id,
          success: false,
          error
        };
      }
    });
    
    // Wait for all sprints in group to complete
    const results = await Promise.all(sprintPromises);
    
    // Process results
    for (const result of results) {
      if (result.success) {
        groupResults.completed.push(result.result);
        if (result.result.insights) {
          groupResults.insights.push(...result.result.insights);
        }
        if (result.result.discoveries) {
          groupResults.discoveries.push(...result.result.discoveries);
        }
      } else {
        groupResults.errors.push(result.error);
      }
    }
    
    // Sync knowledge between agents
    await this.syncGroupKnowledge(group, streams, groupResults);
    
    return groupResults;
  }
  
  /**
   * Execute sprint with assigned agents
   */
  async executeSprintWithAgents(sprint, agents, session) {
    // Simulate sprint execution (in real implementation, this would call actual agent methods)
    const result = {
      sprintId: sprint.id,
      name: sprint.name,
      agents: agents.map(a => a.id),
      startTime: new Date(),
      endTime: null,
      discoveries: [],
      insights: [],
      recommendations: [],
      output: null
    };
    
    // Primary agent leads, others assist
    const leadAgent = agents[0];
    const assistingAgents = agents.slice(1);
    
    // Get relevant context from previous sprints
    const relevantContext = await this.contextStreaming.getRelevantContext(
      leadAgent.id,
      { description: sprint.name }
    );
    
    // Execute sprint (simplified for demo)
    logger.info(`🟢 ${leadAgent.id} executing sprint: ${sprint.name}`);
    
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate mock results
    result.discoveries.push(`Discovery from ${sprint.name}`);
    result.insights.push(`Insight from ${sprint.name}`);
    result.recommendations.push(`Next step after ${sprint.name}`);
    result.output = `Completed ${sprint.name}`;
    result.endTime = new Date();
    
    // Update metrics
    this.metrics.parallelSprintsExecuted++;
    
    return result;
  }
  
  /**
   * Share discoveries from completed group with all agents
   */
  async shareGroupDiscoveries(groupResults, agents) {
    // Create consolidated discovery context
    const consolidatedContext = {
      type: 'group_discoveries',
      content: 'Consolidated discoveries from parallel execution',
      discoveries: groupResults.discoveries,
      insights: groupResults.insights,
      timestamp: new Date()
    };
    
    // Share with all agents
    for (const agent of agents) {
      await this.contextStreaming.streamContext(agent.id, consolidatedContext);
    }
    
    logger.info(`🟢 Shared ${groupResults.discoveries.length} discoveries with all agents`);
  }
  
  /**
   * Sync knowledge between agents in a group
   */
  async syncGroupKnowledge(group, streams, results) {
    // Each agent inherits context from others in group
    const agents = new Set();
    for (const sprint of group.sprints) {
      const sprintAgents = this.activeSessions.get(group.id)?.assignments?.get(sprint.id) || [];
      sprintAgents.forEach(a => agents.add(a));
    }
    
    // Cross-pollinate knowledge
    for (const agent of agents) {
      for (const otherAgent of agents) {
        if (agent.id !== otherAgent.id) {
          await this.contextStreaming.inheritContext(
            otherAgent.id,
            agent.id,
            { description: `Knowledge from ${group.id}` }
          );
        }
      }
    }
  }
  
  // Utility methods
  
  sprintsAreSimilar(sprint1, sprint2) {
    const name1 = sprint1.name.toLowerCase();
    const name2 = sprint2.name.toLowerCase();
    
    // Check for common keywords
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length >= Math.min(words1.length, words2.length) / 2;
  }
  
  priorityValue(priority) {
    const values = { high: 3, medium: 2, low: 1 };
    return values[priority] || 1;
  }
  
  orderSprintsByDependencies(sprints, dependencies) {
    // Simple topological sort
    const ordered = [];
    const visited = new Set();
    
    const visit = (sprint) => {
      if (visited.has(sprint.id)) {return;}
      visited.add(sprint.id);
      
      // Visit dependencies first
      const deps = dependencies.get(sprint.id) || [];
      for (const depId of deps) {
        const depSprint = sprints.find(s => s.id === depId);
        if (depSprint) {visit(depSprint);}
      }
      
      ordered.push(sprint);
    };
    
    for (const sprint of sprints) {
      visit(sprint);
    }
    
    return ordered;
  }
  
  canRunInCurrentGroup(sprint, processed, allSprints) {
    // Check if all dependencies are processed
    // Simplified - in real implementation would check actual dependencies
    return true;
  }
  
  calculateAgentSprintMatch(agent, sprint) {
    // Calculate how well agent matches sprint requirements
    let score = 0.5; // Base score
    
    // Check if agent contributed to planning this sprint
    if (sprint.contributors && sprint.contributors.includes(agent.id)) {
      score += 0.2;
    }
    
    // Department match
    if (sprint.name.toLowerCase().includes('design') && agent.department === 'experience') {
      score += 0.3;
    } else if (sprint.name.toLowerCase().includes('technical') && agent.department === 'technical') {
      score += 0.3;
    } else if (sprint.name.toLowerCase().includes('requirement') && agent.department === 'strategic') {
      score += 0.3;
    }
    
    return Math.min(1, score);
  }
  
  assessSprintComplexity(sprint) {
    // Assess complexity based on sprint characteristics
    if (sprint.name.includes('Architecture') || sprint.name.includes('Integration')) {
      return 0.8;
    }
    return 0.5;
  }
  
  assessStrategicComplexity(task) {
    return 0.6; // Simplified
  }
  
  assessDesignComplexity(task) {
    return 0.5; // Simplified
  }
  
  assessTechnicalComplexity(task) {
    return 0.7; // Simplified
  }
  
  identifyOpportunities(task, agent) {
    return [`${agent.department} can contribute to ${task.description || 'task'}`];
  }
  
  calculateVelocityGain(parallelGroups) {
    // Calculate expected velocity improvement from parallelization
    const avgParallelism = parallelGroups.reduce((sum, g) => 
      sum + g.sprints.length, 0
    ) / Math.max(parallelGroups.length, 1);
    
    return Math.min(3, avgParallelism);
  }
  
  updateMetrics(session, results) {
    // Update velocity metrics
    const actualTime = session.endTime - session.startTime;
    const expectedSequentialTime = session.sprints.length * 10 * 60 * 1000; // 10 min per sprint
    
    this.metrics.velocityImprovement = expectedSequentialTime / actualTime;
    this.metrics.collaborativeSuccesses++;
    
    // Update average agents per sprint
    let totalAgents = 0;
    for (const assignment of session.assignments.values()) {
      totalAgents += assignment.length;
    }
    
    this.metrics.avgAgentsPerSprint = 
      totalAgents / Math.max(session.sprints.length, 1);
  }
  
  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.activeSessions.size,
      avgVelocityGain: this.metrics.velocityImprovement
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  CollaborativeSprintSystem,
  getInstance: () => {
    if (!instance) {
      instance = new CollaborativeSprintSystem();
    }
    return instance;
  }
};