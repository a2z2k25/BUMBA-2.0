/**
 * Routing Execution Bridge
 * Connects intelligent routing decisions to actual agent execution
 */

const { HierarchicalManagerSystem } = require('../agents/hierarchical-manager-system');
const { ParallelManagerCoordinator } = require('../agents/parallel-manager-coordinator');
const { AgentLifecycleManager } = require('../spawning/agent-lifecycle-manager');
const { SpecialistSpawner } = require('../spawning/specialist-spawner');
const { RoutingFeedbackSystem } = require('../routing/routing-feedback-system');
const { logger } = require('../logging/bumba-logger');

class RoutingExecutionBridge {
  constructor(config = {}) {
    this.config = config;
    
    // Initialize execution systems
    this.hierarchicalSystem = new HierarchicalManagerSystem(config);
    this.parallelCoordinator = new ParallelManagerCoordinator(config);
    this.lifecycleManager = new AgentLifecycleManager(config);
    this.specialistSpawner = new SpecialistSpawner(config);
    this.feedbackSystem = new RoutingFeedbackSystem(config);
    
    // Execution state
    this.activeExecutions = new Map();
    this.executionHistory = [];
    
    // Metrics
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };
  }
  
  /**
   * Execute a routing plan
   */
  async executeRoutingPlan(routingPlan) {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();
    
    logger.info('🟢 Executing routing plan:', {
      executionId,
      command: routingPlan.command,
      agentCount: routingPlan.execution.agents.length,
      parallel: routingPlan.execution.parallel,
      requiresCoordination: routingPlan.execution.requiresCoordination
    });
    
    try {
      // Store active execution
      this.activeExecutions.set(executionId, {
        plan: routingPlan,
        startTime,
        status: 'running'
      });
      
      // Determine execution strategy
      const executionStrategy = this.determineExecutionStrategy(routingPlan);
      
      // Execute based on strategy
      let result;
      switch (executionStrategy) {
        case 'hierarchical':
          result = await this.executeHierarchical(routingPlan);
          break;
          
        case 'parallel-coordination':
          result = await this.executeParallelCoordination(routingPlan);
          break;
          
        case 'single-agent':
          result = await this.executeSingleAgent(routingPlan);
          break;
          
        case 'specialist-team':
          result = await this.executeSpecialistTeam(routingPlan);
          break;
          
        default:
          throw new Error(`Unknown execution strategy: ${executionStrategy}`);
      }
      
      // Record success
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionId, 'success', result, executionTime);
      
      // Record result for learning and feedback
      if (routingPlan.learningId) {
        const executionResult = {
          executionId,
          strategy: executionStrategy,
          result,
          success: true,
          metrics: {
            executionTime,
            agentsUsed: routingPlan.execution.agents.length
          }
        };
        
        // Send result back to router for learning
        const { getInstance } = require('../command-router-integration');
        const router = getInstance();
        await router.recordExecutionResult(routingPlan, executionResult);
      }
      
      // Record feedback
      await this.feedbackSystem.recordExecutionFeedback(executionId, {
        success: true,
        executionTime,
        agents: routingPlan.execution.agents,
        models: routingPlan.execution.agents.map(a => a.model),
        confidence: routingPlan.routing?.confidence,
        taskType: this.determineTaskType(routingPlan)
      });
      
      logger.info(`🏁 Execution completed in ${executionTime}ms`, {
        executionId,
        strategy: executionStrategy
      });
      
      return {
        executionId,
        strategy: executionStrategy,
        result,
        metrics: {
          executionTime,
          agentsUsed: routingPlan.execution.agents.length
        }
      };
      
    } catch (error) {
      logger.error(`🔴 Execution failed: ${error.message}`, { executionId });
      
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionId, 'failed', error, executionTime);
      
      // Record failure for learning
      if (routingPlan.learningId) {
        const executionResult = {
          executionId,
          strategy: executionStrategy,
          error: error.message,
          success: false,
          metrics: {
            executionTime,
            agentsUsed: routingPlan.execution.agents.length
          }
        };
        
        // Send result back to router for learning
        const { getInstance } = require('../command-router-integration');
        const router = getInstance();
        await router.recordExecutionResult(routingPlan, executionResult);
      }
      
      throw error;
      
    } finally {
      // Clean up active execution
      this.activeExecutions.delete(executionId);
    }
  }
  
  /**
   * Determine execution strategy based on routing plan
   */
  determineExecutionStrategy(routingPlan) {
    const { agents, parallel, requiresCoordination } = routingPlan.execution;
    
    // Multiple managers requiring coordination
    if (requiresCoordination) {
      return 'parallel-coordination';
    }
    
    // Single manager with specialists (hierarchical)
    const managers = agents.filter(a => a.role === 'manager');
    const specialists = agents.filter(a => a.role === 'specialist');
    
    if (managers.length === 1 && specialists.length > 0) {
      return 'hierarchical';
    }
    
    // Single agent only
    if (agents.length === 1) {
      return 'single-agent';
    }
    
    // Multiple specialists without manager
    if (managers.length === 0 && specialists.length > 1) {
      return 'specialist-team';
    }
    
    // Default to hierarchical
    return 'hierarchical';
  }
  
  /**
   * Execute with hierarchical manager system
   */
  async executeHierarchical(routingPlan) {
    const { command, args, execution } = routingPlan;
    
    // Prepare tasks for hierarchical execution
    const tasks = this.prepareTasks(command, args, execution.agents);
    
    // Execute through hierarchical system
    const result = await this.hierarchicalSystem.executeHierarchical(tasks, {
      command,
      agents: execution.agents,
      modelAssignments: this.extractModelAssignments(execution.agents)
    });
    
    return result;
  }
  
  /**
   * Execute with parallel manager coordination
   */
  async executeParallelCoordination(routingPlan) {
    const { command, args, execution } = routingPlan;
    
    // Prepare tasks for parallel execution
    const tasks = this.prepareTasks(command, args, execution.agents);
    
    // Execute through parallel coordinator
    const result = await this.parallelCoordinator.coordinateParallelExecution(tasks, {
      command,
      agents: execution.agents,
      requiresExecutive: execution.agents.some(a => a.name.includes('executive'))
    });
    
    return result;
  }
  
  /**
   * Execute single agent
   */
  async executeSingleAgent(routingPlan) {
    const { command, args, execution } = routingPlan;
    const agent = execution.agents[0];
    
    // Spawn single agent
    const spawnedAgent = await this.lifecycleManager.spawnAgent({
      type: agent.name,
      role: agent.role,
      model: agent.model,
      usingClaudeMax: agent.usingClaudeMax
    });
    
    // Execute task
    const result = await spawnedAgent.execute({
      command,
      args,
      context: routingPlan.analysis
    });
    
    // Cleanup
    await this.lifecycleManager.terminateAgent(spawnedAgent.id);
    
    return result;
  }
  
  /**
   * Execute specialist team without manager
   */
  async executeSpecialistTeam(routingPlan) {
    const { command, args, execution } = routingPlan;
    
    // Use specialist spawner for proper model assignment
    const specialists = await this.specialistSpawner.spawnSpecialistsForPlan(routingPlan);
    
    if (specialists.length === 0) {
      throw new Error('Failed to spawn any specialists');
    }
    
    // Execute tasks in parallel
    const results = await Promise.all(
      specialists.map(specialist => 
        specialist.executeTask({
          command,
          args,
          context: routingPlan.analysis
        })
      )
    );
    
    // Cleanup specialists
    await Promise.all(
      specialists.map(specialist => 
        this.specialistSpawner.dissolveSpecialist(specialist.id)
      )
    );
    
    // Aggregate results
    return this.aggregateResults(results);
  }
  
  /**
   * Prepare tasks from routing plan
   */
  prepareTasks(command, args, agents) {
    return agents.map(agent => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command,
      args,
      agent: agent.name,
      role: agent.role,
      model: agent.model,
      usingClaudeMax: agent.usingClaudeMax,
      type: this.getTaskType(agent.name),
      description: `${command} ${args.join(' ')}`
    }));
  }
  
  /**
   * Get task type from agent name
   */
  getTaskType(agentName) {
    if (agentName.includes('manager')) {return 'management';}
    if (agentName.includes('specialist')) {return 'specialized';}
    if (agentName.includes('analyst')) {return 'analysis';}
    if (agentName.includes('developer')) {return 'development';}
    return 'general';
  }
  
  /**
   * Extract model assignments for agents
   */
  extractModelAssignments(agents) {
    const assignments = {};
    agents.forEach(agent => {
      assignments[agent.name] = {
        model: agent.model,
        usingClaudeMax: agent.usingClaudeMax
      };
    });
    return assignments;
  }
  
  /**
   * Aggregate results from multiple agents
   */
  aggregateResults(results) {
    return {
      success: results.every(r => r.success !== false),
      results: results,
      summary: this.generateSummary(results),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Generate summary from results
   */
  generateSummary(results) {
    const successful = results.filter(r => r.success !== false);
    const failed = results.filter(r => r.success === false);
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length * 100).toFixed(1) + '%'
    };
  }
  
  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Record execution for metrics
   */
  recordExecution(executionId, status, result, executionTime) {
    const execution = {
      id: executionId,
      status,
      result: status === 'success' ? result : result.message,
      executionTime,
      timestamp: new Date().toISOString()
    };
    
    this.executionHistory.push(execution);
    
    // Update metrics
    this.metrics.totalExecutions++;
    if (status === 'success') {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }
    
    // Update average execution time
    const successfulExecutions = this.executionHistory.filter(e => e.status === 'success');
    if (successfulExecutions.length > 0) {
      const totalTime = successfulExecutions.reduce((sum, e) => sum + e.executionTime, 0);
      this.metrics.averageExecutionTime = totalTime / successfulExecutions.length;
    }
    
    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }
  }
  
  /**
   * Get execution metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalExecutions > 0
        ? (this.metrics.successfulExecutions / this.metrics.totalExecutions * 100).toFixed(1) + '%'
        : '0%',
      activeExecutions: this.activeExecutions.size,
      historySize: this.executionHistory.length
    };
  }
  
  /**
   * Get active executions
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.entries()).map(([id, execution]) => ({
      id,
      command: execution.plan.command,
      status: execution.status,
      runningTime: Date.now() - execution.startTime
    }));
  }
  
  /**
   * Determine task type from routing plan
   */
  determineTaskType(routingPlan) {
    const agents = routingPlan.execution.agents;
    
    if (agents.some(a => a.name.includes('database'))) {return 'database';}
    if (agents.some(a => a.name.includes('security'))) {return 'security';}
    if (agents.some(a => a.name.includes('frontend'))) {return 'frontend';}
    if (agents.some(a => a.name.includes('backend'))) {return 'backend';}
    if (agents.some(a => a.name.includes('design'))) {return 'design';}
    
    return 'general';
  }
  
  /**
   * Get feedback summary
   */
  getFeedbackSummary() {
    return this.feedbackSystem.getFeedbackSummary();
  }
}

// Singleton instance
let instance = null;

module.exports = {
  RoutingExecutionBridge,
  getInstance: (config) => {
    if (!instance) {
      instance = new RoutingExecutionBridge(config);
    }
    return instance;
  }
};