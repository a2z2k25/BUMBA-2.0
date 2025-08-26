/**
 * BUMBA Parallel Manager Coordinator
 * Coordinates multiple managers working in parallel
 * Ensures Claude Max goes to executive while other managers use free tier
 */

const { EventEmitter } = require('events');
const { getInstance: getClaudeMaxManager } = require('./claude-max-account-manager');
const { getInstance: getFreeTierManager } = require('./free-tier-manager');
const { getInstance: getDomainRouter } = require('./domain-model-router');
const { getInstance: getReviewRouter } = require('./review-validation-router');
const { logger } = require('../logging/bumba-logger');

class ParallelManagerCoordinator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxParallelManagers: config.maxParallelManagers || 3,
      executivePriority: config.executivePriority !== false,
      autoElevation: config.autoElevation !== false,
      ...config
    };
    
    // Initialize subsystems
    this.claudeMaxManager = getClaudeMaxManager(config);
    this.freeTierManager = getFreeTierManager(config);
    this.domainRouter = getDomainRouter(config);
    this.reviewRouter = getReviewRouter(config);
    
    // Coordination state
    this.activeCoordination = null;
    this.managerAssignments = new Map();
    this.subAgentAssignments = new Map();
    
    // Manager hierarchy for elevation
    this.managerHierarchy = {
      'product-strategist-executive': { level: 1, canElevate: true },
      'product-strategist': { level: 2, canElevate: true },
      'backend-engineer-manager': { level: 3, canElevate: false },
      'design-engineer-manager': { level: 3, canElevate: false }
    };
  }
  
  /**
   * Coordinate parallel execution with multiple managers
   */
  async coordinateParallelExecution(tasks, options = {}) {
    const startTime = Date.now();
    
    logger.info(`🟢 Coordinating ${tasks.length} tasks for parallel execution`);
    
    // Step 1: Analyze task distribution
    const analysis = this.analyzeTaskDistribution(tasks);
    
    // Step 2: Determine manager requirements
    const managerNeeds = this.determineManagerRequirements(analysis);
    
    // Step 3: Assign models to managers
    const managerAssignments = await this.assignManagerModels(managerNeeds);
    
    // Step 4: Distribute tasks to managers
    const taskDistribution = this.distributeTasksToManagers(
      tasks,
      managerAssignments,
      analysis
    );
    
    // Step 5: Spawn sub-agents for each manager
    const subAgentPlan = await this.planSubAgentSpawning(taskDistribution);
    
    // Step 6: Execute parallel coordination
    const result = await this.executeParallelCoordination(
      managerAssignments,
      taskDistribution,
      subAgentPlan,
      options
    );
    
    // Step 7: Aggregate results
    const aggregatedResult = this.aggregateResults(result);
    
    const duration = Date.now() - startTime;
    
    logger.info(`🏁 Parallel coordination completed in ${duration}ms`);
    
    return {
      success: true,
      coordinationType: 'parallel-managers',
      managers: managerAssignments,
      taskDistribution,
      subAgents: subAgentPlan,
      results: aggregatedResult,
      metadata: {
        duration,
        claudeMaxUsed: managerAssignments.some(m => m.usingClaudeMax),
        managersActive: managerAssignments.length,
        subAgentsSpawned: subAgentPlan.totalAgents
      }
    };
  }
  
  /**
   * Analyze task distribution across domains
   */
  analyzeTaskDistribution(tasks) {
    const analysis = {
      domains: new Set(),
      taskTypes: new Map(),
      reviewTasks: [],
      codingTasks: [],
      reasoningTasks: [],
      generalTasks: [],
      crossDomainTasks: []
    };
    
    tasks.forEach(task => {
      // Extract domain
      const domain = this.extractTaskDomain(task);
      analysis.domains.add(domain);
      
      // Categorize by type
      const taskType = this.categorizeTask(task);
      const count = analysis.taskTypes.get(taskType) || 0;
      analysis.taskTypes.set(taskType, count + 1);
      
      // Sort into buckets
      if (this.isReviewTask(task)) {
        analysis.reviewTasks.push(task);
      } else if (taskType === 'coding') {
        analysis.codingTasks.push(task);
      } else if (taskType === 'reasoning') {
        analysis.reasoningTasks.push(task);
      } else if (this.isCrossDomain(task, analysis.domains)) {
        analysis.crossDomainTasks.push(task);
      } else {
        analysis.generalTasks.push(task);
      }
    });
    
    analysis.requiresMultipleManagers = analysis.domains.size > 2 || 
                                        analysis.crossDomainTasks.length > 0;
    
    return analysis;
  }
  
  /**
   * Determine which managers are needed
   */
  determineManagerRequirements(analysis) {
    const managers = [];
    
    // Always need executive for cross-domain
    if (analysis.requiresMultipleManagers || analysis.crossDomainTasks.length > 0) {
      managers.push({
        type: 'product-strategist-executive',
        role: 'executive',
        priority: 1,
        reason: 'Cross-domain coordination required'
      });
    }
    
    // Backend manager for coding/backend tasks
    if (analysis.codingTasks.length > 0 || analysis.domains.has('backend')) {
      managers.push({
        type: 'backend-engineer-manager',
        role: 'manager',
        priority: 2,
        reason: 'Backend/coding tasks present'
      });
    }
    
    // Design manager for UI/UX tasks
    if (analysis.domains.has('design') || analysis.domains.has('ui') || analysis.domains.has('ux')) {
      managers.push({
        type: 'design-engineer-manager',
        role: 'manager',
        priority: 2,
        reason: 'Design/UI tasks present'
      });
    }
    
    // Product strategist for business/strategy
    if (analysis.domains.has('business') || analysis.domains.has('strategy')) {
      if (!managers.find(m => m.type.includes('product-strategist'))) {
        managers.push({
          type: 'product-strategist',
          role: 'manager',
          priority: 2,
          reason: 'Business/strategy tasks present'
        });
      }
    }
    
    // Review tasks always need a manager
    if (analysis.reviewTasks.length > 0 && managers.length === 0) {
      managers.push({
        type: 'product-strategist',
        role: 'manager',
        priority: 1,
        reason: 'Review tasks require manager'
      });
    }
    
    return managers;
  }
  
  /**
   * Assign models to managers based on parallel execution rules
   */
  async assignManagerModels(managerNeeds) {
    const assignments = [];
    
    // Sort by priority
    managerNeeds.sort((a, b) => a.priority - b.priority);
    
    // Single manager - gets Claude Max
    if (managerNeeds.length === 1) {
      const manager = managerNeeds[0];
      
      const lockAcquired = await this.claudeMaxManager.acquireLock(
        manager.type,
        manager.role,
        manager.priority
      );
      
      if (lockAcquired) {
        assignments.push({
          ...manager,
          modelConfig: this.claudeMaxManager.getClaudeMaxConfig(),
          usingClaudeMax: true,
          lockAcquired: true
        });
        
        logger.info(`🏁 Single manager ${manager.type} assigned Claude Max`);
      } else {
        throw new Error(`Failed to acquire Claude Max for single manager ${manager.type}`);
      }
    }
    // Multiple managers - executive gets Claude Max
    else if (managerNeeds.length > 1) {
      let claudeMaxAssigned = false;
      
      for (const manager of managerNeeds) {
        // Executive or first manager gets Claude Max
        if (!claudeMaxAssigned && (manager.role === 'executive' || manager.priority === 1)) {
          const lockAcquired = await this.claudeMaxManager.acquireLock(
            manager.type,
            'executive',
            1
          );
          
          if (lockAcquired) {
            assignments.push({
              ...manager,
              modelConfig: this.claudeMaxManager.getClaudeMaxConfig(),
              usingClaudeMax: true,
              lockAcquired: true,
              elevated: manager.type === 'product-strategist' ? true : false
            });
            
            claudeMaxAssigned = true;
            logger.info(`🏁 Executive ${manager.type} assigned Claude Max`);
          }
        }
        // Other managers get free tier
        else {
          const model = await this.freeTierManager.getBestAvailableModel({
            taskType: 'reasoning',
            allowPaid: false
          });
          
          assignments.push({
            ...manager,
            modelConfig: model,
            usingClaudeMax: false,
            lockAcquired: false
          });
          
          logger.info(`🟢 Manager ${manager.type} assigned ${model.model} (free tier)`);
        }
      }
      
      // Elevate if needed
      if (!claudeMaxAssigned && this.config.autoElevation) {
        const elevated = this.elevateManager(assignments);
        if (elevated) {
          logger.info(`⬆️ Elevated ${elevated.type} to executive role`);
        }
      }
    }
    
    this.managerAssignments = new Map(assignments.map(a => [a.type, a]));
    
    return assignments;
  }
  
  /**
   * Distribute tasks to assigned managers
   */
  distributeTasksToManagers(tasks, managerAssignments, analysis) {
    const distribution = new Map();
    
    // Initialize distribution for each manager
    managerAssignments.forEach(manager => {
      distribution.set(manager.type, {
        manager,
        tasks: [],
        domains: new Set()
      });
    });
    
    // Find executive manager (has Claude Max)
    const executive = managerAssignments.find(m => m.usingClaudeMax);
    
    // Distribute tasks
    tasks.forEach(task => {
      // Review tasks go to executive/Claude Max manager
      if (this.isReviewTask(task)) {
        if (executive) {
          distribution.get(executive.type).tasks.push(task);
        }
      }
      // Cross-domain tasks go to executive
      else if (this.isCrossDomain(task, analysis.domains) && executive) {
        distribution.get(executive.type).tasks.push(task);
      }
      // Domain-specific tasks go to appropriate manager
      else {
        const domain = this.extractTaskDomain(task);
        const manager = this.findManagerForDomain(domain, managerAssignments);
        
        if (manager) {
          distribution.get(manager.type).tasks.push(task);
          distribution.get(manager.type).domains.add(domain);
        } else if (executive) {
          // Fallback to executive
          distribution.get(executive.type).tasks.push(task);
        }
      }
    });
    
    // Log distribution
    distribution.forEach((data, managerType) => {
      logger.info(`🟢 ${managerType}: ${data.tasks.length} tasks, domains: ${Array.from(data.domains).join(', ')}`);
    });
    
    return distribution;
  }
  
  /**
   * Plan sub-agent spawning for each manager
   */
  async planSubAgentSpawning(taskDistribution) {
    const plan = {
      managers: [],
      totalAgents: 0,
      modelDistribution: {}
    };
    
    for (const [managerType, data] of taskDistribution) {
      const manager = data.manager;
      const tasks = data.tasks;
      
      // Skip if no tasks
      if (tasks.length === 0) {continue;}
      
      // Plan sub-agents for this manager
      const subAgents = await this.planManagerSubAgents(manager, tasks);
      
      plan.managers.push({
        manager: managerType,
        usingClaudeMax: manager.usingClaudeMax,
        subAgents,
        taskCount: tasks.length
      });
      
      plan.totalAgents += subAgents.length;
      
      // Track model distribution
      subAgents.forEach(agent => {
        const model = agent.model || 'unknown';
        plan.modelDistribution[model] = (plan.modelDistribution[model] || 0) + 1;
      });
    }
    
    this.subAgentAssignments = plan;
    
    return plan;
  }
  
  /**
   * Plan sub-agents for a specific manager
   */
  async planManagerSubAgents(manager, tasks) {
    const subAgents = [];
    
    // Group tasks by type for efficient sub-agent assignment
    const taskGroups = this.groupTasksByType(tasks);
    
    for (const [taskType, groupTasks] of Object.entries(taskGroups)) {
      // Route through domain router for model assignment
      const routedTasks = await this.domainRouter.routeMultipleTasks(
        groupTasks.map(t => ({ ...t, domain: taskType }))
      );
      
      // Create sub-agent for each unique model needed
      const modelGroups = this.groupByModel(routedTasks);
      
      for (const [model, modelTasks] of Object.entries(modelGroups)) {
        subAgents.push({
          id: `${manager.type}-${taskType}-${model}-${Date.now()}`,
          manager: manager.type,
          type: taskType,
          model,
          taskCount: modelTasks.length,
          tasks: modelTasks
        });
      }
    }
    
    return subAgents;
  }
  
  /**
   * Execute the parallel coordination
   */
  async executeParallelCoordination(managers, distribution, subAgentPlan, options) {
    const executionPromises = [];
    
    // Execute each manager's work in parallel
    for (const manager of managers) {
      const managerWork = distribution.get(manager.type);
      
      if (!managerWork || managerWork.tasks.length === 0) {continue;}
      
      const promise = this.executeManagerWork(
        manager,
        managerWork,
        subAgentPlan.managers.find(m => m.manager === manager.type),
        options
      );
      
      executionPromises.push(promise);
    }
    
    // Wait for all managers to complete
    const results = await Promise.allSettled(executionPromises);
    
    // Release Claude Max lock if held
    const claudeMaxManager = managers.find(m => m.lockAcquired);
    if (claudeMaxManager) {
      await this.claudeMaxManager.releaseLock(claudeMaxManager.type);
      logger.info(`🟡 Released Claude Max lock for ${claudeMaxManager.type}`);
    }
    
    return results;
  }
  
  /**
   * Execute work for a single manager
   */
  async executeManagerWork(manager, work, subAgentPlan, options) {
    try {
      logger.info(`🟢 ${manager.type} starting execution with ${work.tasks.length} tasks`);
      
      // Manager coordinates sub-agents
      const coordinationResult = {
        manager: manager.type,
        model: manager.modelConfig.model,
        usingClaudeMax: manager.usingClaudeMax,
        tasks: work.tasks,
        subAgents: subAgentPlan?.subAgents || [],
        startTime: Date.now()
      };
      
      // Simulate execution (in real implementation, this would call actual APIs)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      coordinationResult.endTime = Date.now();
      coordinationResult.duration = coordinationResult.endTime - coordinationResult.startTime;
      coordinationResult.success = true;
      
      return coordinationResult;
      
    } catch (error) {
      logger.error(`Manager ${manager.type} execution failed: ${error.message}`);
      
      return {
        manager: manager.type,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Aggregate results from all managers
   */
  aggregateResults(results) {
    const aggregated = {
      successful: [],
      failed: [],
      totalDuration: 0,
      modelUsage: {}
    };
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        aggregated.successful.push(result.value);
        aggregated.totalDuration += result.value.duration || 0;
        
        // Track model usage
        const model = result.value.model;
        aggregated.modelUsage[model] = (aggregated.modelUsage[model] || 0) + 1;
      } else {
        aggregated.failed.push(result.reason || result.value);
      }
    });
    
    aggregated.successRate = aggregated.successful.length / results.length;
    
    return aggregated;
  }
  
  // Helper methods
  
  extractTaskDomain(task) {
    return task.domain || task.type || 'general';
  }
  
  categorizeTask(task) {
    const desc = (task.description || task.prompt || '').toLowerCase();
    
    if (desc.match(/\b(code|implement|function|api)\b/)) {return 'coding';}
    if (desc.match(/\b(analyze|debug|reason|investigate)\b/)) {return 'reasoning';}
    if (desc.match(/\b(review|validate|approve|check)\b/)) {return 'review';}
    
    return 'general';
  }
  
  isReviewTask(task) {
    return this.categorizeTask(task) === 'review' || 
           task.type === 'review' || 
           task.type === 'validation';
  }
  
  isCrossDomain(task, domains) {
    const taskDomains = task.domains || [this.extractTaskDomain(task)];
    return taskDomains.filter(d => domains.has(d)).length > 1;
  }
  
  findManagerForDomain(domain, managers) {
    const domainManagerMap = {
      'backend': 'backend-engineer-manager',
      'frontend': 'design-engineer-manager',
      'ui': 'design-engineer-manager',
      'ux': 'design-engineer-manager',
      'design': 'design-engineer-manager',
      'business': 'product-strategist',
      'strategy': 'product-strategist'
    };
    
    const managerType = domainManagerMap[domain];
    return managers.find(m => m.type === managerType);
  }
  
  elevateManager(assignments) {
    // Find manager that can be elevated
    const elevatable = assignments.find(m => 
      this.managerHierarchy[m.type]?.canElevate && !m.usingClaudeMax
    );
    
    if (elevatable) {
      elevatable.type = elevatable.type + '-executive';
      elevatable.role = 'executive';
      elevatable.elevated = true;
      return elevatable;
    }
    
    return null;
  }
  
  groupTasksByType(tasks) {
    const groups = {};
    
    tasks.forEach(task => {
      const type = this.categorizeTask(task);
      if (!groups[type]) {groups[type] = [];}
      groups[type].push(task);
    });
    
    return groups;
  }
  
  groupByModel(tasks) {
    const groups = {};
    
    tasks.forEach(task => {
      const model = task.model || task.tierKey || 'unknown';
      if (!groups[model]) {groups[model] = [];}
      groups[model].push(task);
    });
    
    return groups;
  }
  
  /**
   * Get coordination statistics
   */
  getCoordinationStats() {
    return {
      activeCoordination: this.activeCoordination !== null,
      managerAssignments: Array.from(this.managerAssignments.values()),
      subAgentCount: this.subAgentAssignments?.totalAgents || 0,
      claudeMaxStatus: this.claudeMaxManager.getStatus(),
      freeTierStatus: this.freeTierManager.getUsageSummary()
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  ParallelManagerCoordinator,
  getInstance: (config) => {
    if (!instance) {
      instance = new ParallelManagerCoordinator(config);
    }
    return instance;
  }
};