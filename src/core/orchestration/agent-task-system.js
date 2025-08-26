/**
 * BUMBA Agent Task Claiming and Execution System
 * Handles conflict-free task allocation and knowledge sharing
 * @module agent-task-system
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

/**
 * Sprint 8: Agent Task Claiming System
 */
class AgentTaskClaimingSystem extends EventEmitter {
  constructor() {
    super();
    
    this.claimLocks = new Map(); // taskId -> agentId
    this.claimQueue = [];
    this.claimHistory = new Map();
    
    logger.info('🟢 Agent Task Claiming System initialized');
  }
  
  /**
   * Atomic task claiming - prevents double allocation
   */
  async claimTask(agentId, taskId, notionClient) {
    // Check if already claimed
    if (this.claimLocks.has(taskId)) {
      const owner = this.claimLocks.get(taskId);
      if (owner !== agentId) {
        throw new Error(`Task ${taskId} already claimed by ${owner}`);
      }
      return false; // Already owned by this agent
    }
    
    // Atomic claim operation
    try {
      // Set lock immediately
      this.claimLocks.set(taskId, agentId);
      
      // Update Notion (this is the atomic operation)
      await notionClient.claimTask(taskId, agentId);
      
      // Record claim
      this.recordClaim(agentId, taskId);
      
      this.emit('task:claimed', { agentId, taskId });
      
      logger.info(`🏁 ${agentId} successfully claimed ${taskId}`);
      return true;
      
    } catch (error) {
      // Release lock on failure
      this.claimLocks.delete(taskId);
      throw error;
    }
  }
  
  /**
   * Release task claim
   */
  releaseClaim(agentId, taskId) {
    const owner = this.claimLocks.get(taskId);
    
    if (owner === agentId) {
      this.claimLocks.delete(taskId);
      this.emit('task:released', { agentId, taskId });
      return true;
    }
    
    return false;
  }
  
  /**
   * Record claim for history
   */
  recordClaim(agentId, taskId) {
    if (!this.claimHistory.has(agentId)) {
      this.claimHistory.set(agentId, []);
    }
    
    this.claimHistory.get(agentId).push({
      taskId,
      claimedAt: Date.now()
    });
  }
  
  /**
   * Get agent's current task
   */
  getAgentTask(agentId) {
    for (const [taskId, owner] of this.claimLocks) {
      if (owner === agentId) {
        return taskId;
      }
    }
    return null;
  }
}

/**
 * Sprint 9: Dependency Enforcement System
 */
class DependencyEnforcementSystem extends EventEmitter {
  constructor(dependencyManager) {
    super();
    
    this.dependencyManager = dependencyManager;
    this.violations = [];
    
    logger.info('🟢 Dependency Enforcement System initialized');
  }
  
  /**
   * Enforce dependencies before task execution
   */
  async enforceBeforeExecution(taskId) {
    const canExecute = this.dependencyManager.canExecute(taskId);
    
    if (!canExecute) {
      const blockers = this.getBlockingTasks(taskId);
      
      const violation = {
        taskId,
        blockers,
        timestamp: Date.now(),
        severity: 'critical'
      };
      
      this.violations.push(violation);
      
      this.emit('dependency:violation', violation);
      
      throw new Error(`Task ${taskId} cannot execute - dependencies not met: ${blockers.join(', ')}`);
    }
    
    return true;
  }
  
  /**
   * Get tasks blocking execution
   */
  getBlockingTasks(taskId) {
    const task = this.dependencyManager.dependencyGraph.get(taskId);
    if (!task) {return [];}
    
    const blockers = [];
    
    for (const depId of task.depends_on) {
      const status = this.dependencyManager.taskStatus.get(depId);
      if (status !== 'completed') {
        blockers.push(depId);
      }
    }
    
    return blockers;
  }
  
  /**
   * Monitor for violations
   */
  startMonitoring() {
    setInterval(() => {
      this.checkForViolations();
    }, 5000);
  }
  
  /**
   * Check for dependency violations
   */
  checkForViolations() {
    for (const [taskId, status] of this.dependencyManager.taskStatus) {
      if (status === 'in_progress') {
        try {
          this.enforceBeforeExecution(taskId);
        } catch (error) {
          logger.error(`Violation detected: ${error.message}`);
        }
      }
    }
  }
}

/**
 * Sprint 10: Timeline Optimization Logic
 */
class TimelineOptimizer {
  constructor(dependencyManager) {
    this.dependencyManager = dependencyManager;
    logger.info('⏱️ Timeline Optimizer initialized');
  }
  
  /**
   * Optimize task execution timeline
   */
  optimizeTimeline(tasks, agents) {
    // Calculate critical path
    const criticalPath = this.dependencyManager.updateCriticalPath();
    
    // Identify parallel opportunities
    const parallelGroups = this.dependencyManager.getParallelGroups();
    
    // Create optimized schedule
    const schedule = this.createOptimalSchedule(
      criticalPath,
      parallelGroups,
      agents
    );
    
    return {
      criticalPath: criticalPath.path,
      estimatedDuration: criticalPath.duration,
      parallelGroups,
      schedule
    };
  }
  
  /**
   * Create optimal execution schedule
   */
  createOptimalSchedule(criticalPath, parallelGroups, agents) {
    const schedule = [];
    let currentTime = 0;
    
    for (const group of parallelGroups) {
      const allocation = this.allocateGroupToAgents(group, agents);
      
      schedule.push({
        startTime: currentTime,
        endTime: currentTime + group.estimatedDuration,
        tasks: allocation,
        parallel: true
      });
      
      currentTime += group.estimatedDuration;
    }
    
    return schedule;
  }
  
  /**
   * Allocate parallel group to agents
   */
  allocateGroupToAgents(group, agents) {
    const allocations = [];
    const availableAgents = [...agents];
    
    for (const task of group.tasks) {
      if (availableAgents.length > 0) {
        const agent = availableAgents.shift();
        allocations.push({
          task,
          agent: agent.id,
          duration: group.estimatedDuration
        });
      }
    }
    
    return allocations;
  }
  
  /**
   * Calculate timeline efficiency
   */
  calculateEfficiency(schedule) {
    const totalPossibleTime = schedule.reduce((sum, slot) => 
      sum + slot.tasks.reduce((t, task) => t + task.duration, 0), 0
    );
    
    const actualTime = schedule[schedule.length - 1].endTime;
    
    return (totalPossibleTime / actualTime) * 100;
  }
}

/**
 * Sprint 11: Knowledge Sharing Mechanism
 */
class KnowledgeSharingSystem extends EventEmitter {
  constructor(notionClient) {
    super();
    
    this.notionClient = notionClient;
    this.sharedKnowledge = new Map();
    this.knowledgeSubscriptions = new Map();
    
    logger.info('🟢 Knowledge Sharing System initialized');
  }
  
  /**
   * Share knowledge from sprint completion
   */
  async shareKnowledge(agentId, sprintId, knowledge) {
    // Store locally
    const knowledgeEntry = {
      id: `knowledge_${Date.now()}`,
      agentId,
      sprintId,
      content: knowledge,
      timestamp: Date.now(),
      consumers: []
    };
    
    this.sharedKnowledge.set(knowledgeEntry.id, knowledgeEntry);
    
    // Post to Notion
    await this.notionClient.addKnowledge({
      title: `Sprint ${sprintId} Knowledge`,
      type: 'sprint_output',
      content: JSON.stringify(knowledge),
      agentId,
      taskId: sprintId,
      tags: knowledge.tags || []
    });
    
    // Notify subscribers
    this.notifySubscribers(sprintId, knowledgeEntry);
    
    this.emit('knowledge:shared', knowledgeEntry);
    
    return knowledgeEntry.id;
  }
  
  /**
   * Query knowledge for a topic
   */
  async queryKnowledge(query) {
    // Query Notion knowledge base
    const results = await this.notionClient.queryKnowledge({
      content: { type: 'rich_text', filter: { contains: query } }
    });
    
    return results;
  }
  
  /**
   * Subscribe to knowledge updates
   */
  subscribeToKnowledge(agentId, topics) {
    this.knowledgeSubscriptions.set(agentId, topics);
  }
  
  /**
   * Notify subscribers of new knowledge
   */
  notifySubscribers(sprintId, knowledge) {
    for (const [agentId, topics] of this.knowledgeSubscriptions) {
      if (topics.includes(sprintId) || topics.includes('all')) {
        this.emit('knowledge:notification', {
          agentId,
          knowledge
        });
      }
    }
  }
  
  /**
   * Get knowledge for dependent task
   */
  async getPrerequisiteKnowledge(taskId, dependencies) {
    const prerequisiteKnowledge = [];
    
    for (const depId of dependencies) {
      const knowledge = await this.queryKnowledge(depId);
      prerequisiteKnowledge.push(...knowledge);
    }
    
    return prerequisiteKnowledge;
  }
}

/**
 * Sprint 12: Parallel Execution Coordinator
 */
class ParallelExecutionCoordinator extends EventEmitter {
  constructor() {
    super();
    
    this.executingGroups = new Map();
    this.completedGroups = new Set();
    
    logger.info('🟢 Parallel Execution Coordinator initialized');
  }
  
  /**
   * Execute parallel task group
   */
  async executeParallelGroup(group, agents, executor) {
    const groupId = `group_${Date.now()}`;
    
    logger.info(`🟢 Executing parallel group ${groupId} with ${group.tasks.length} tasks`);
    
    // Track group execution
    this.executingGroups.set(groupId, {
      tasks: group.tasks,
      agents: agents.map(a => a.id),
      startTime: Date.now(),
      promises: []
    });
    
    // Start all tasks in parallel
    const promises = group.tasks.map((taskId, index) => {
      if (index < agents.length) {
        return executor(taskId, agents[index]);
      }
      return null;
    }).filter(p => p !== null);
    
    // Store promises for tracking
    this.executingGroups.get(groupId).promises = promises;
    
    // Wait for all to complete
    try {
      const results = await Promise.all(promises);
      
      this.completedGroups.add(groupId);
      this.executingGroups.delete(groupId);
      
      this.emit('group:completed', {
        groupId,
        results,
        duration: Date.now() - this.executingGroups.get(groupId)?.startTime || 0
      });
      
      return results;
      
    } catch (error) {
      this.emit('group:failed', {
        groupId,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get parallel execution status
   */
  getParallelStatus() {
    const executing = [];
    
    for (const [groupId, group] of this.executingGroups) {
      executing.push({
        groupId,
        taskCount: group.tasks.length,
        agentCount: group.agents.length,
        duration: Date.now() - group.startTime
      });
    }
    
    return {
      executingGroups: executing,
      completedGroups: this.completedGroups.size
    };
  }
  
  /**
   * Optimize agent allocation for parallel execution
   */
  optimizeParallelAllocation(tasks, agents) {
    // Sort tasks by priority/criticality
    const sortedTasks = [...tasks].sort((a, b) => {
      // Prioritize critical path tasks
      return (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0);
    });
    
    // Match best agents to tasks
    const allocations = [];
    const availableAgents = [...agents];
    
    for (const task of sortedTasks) {
      if (availableAgents.length === 0) {break;}
      
      // Find best matching agent
      const bestAgent = this.findBestMatch(task, availableAgents);
      
      if (bestAgent) {
        allocations.push({ task, agent: bestAgent });
        availableAgents.splice(availableAgents.indexOf(bestAgent), 1);
      }
    }
    
    return allocations;
  }
  
  /**
   * Find best agent match for task
   */
  findBestMatch(task, agents) {
    // Simple matching for now
    return agents[0];
  }
}

// Export all systems
module.exports = {
  AgentTaskClaimingSystem,
  DependencyEnforcementSystem,
  TimelineOptimizer,
  KnowledgeSharingSystem,
  ParallelExecutionCoordinator
};