/**
 * BUMBA Product-Strategist Orchestration Extensions
 * Extends Product-Strategist Manager with supreme orchestration capabilities
 * @module product-strategist-orchestrator
 */

const { logger } = require('../logging/bumba-logger');
const taskOrchestratorModule = require('../orchestration/task-orchestrator');
const notionClientModule = require('../orchestration/notion-client');
const dependencyManagerModule = require('../orchestration/dependency-manager');
const hookSystemModule = require('../orchestration/orchestration-hooks');

/**
 * Mixin to add orchestration capabilities to Product-Strategist Manager
 */
class ProductStrategistOrchestrator {
  /**
   * Initialize orchestration capabilities
   */
  initializeOrchestration() {
    logger.info('🟢 Initializing Product-Strategist as Supreme Orchestrator');
    
    // Core orchestration components
    this.orchestrator = taskOrchestratorModule.getInstance();
    this.notionClient = notionClientModule.getInstance();
    this.dependencyManager = dependencyManagerModule.getInstance();
    this.hookSystem = hookSystemModule.getInstance();
    
    // Connect to hook system as primary orchestrator
    this.hookSystem.connectProductStrategist(this);
    
    // Orchestration state
    this.activeProjects = new Map();
    this.taskAllocations = new Map();
    this.agentPerformance = new Map();
    this.knowledgeBase = new Map();
    
    // Advanced orchestration capabilities
    this.strategicOrchestration = this.initializeStrategicOrchestration();
    this.crossDepartmentCoordination = this.initializeCrossDepartmentCoordination();
    this.holisticMetrics = this.initializeHolisticMetrics();
    this.predictiveOrchestration = this.initializePredictiveOrchestration();
    this.stakeholderAlignment = this.initializeStakeholderAlignment();
    
    // Enhanced metrics tracking
    this.orchestrationMetrics = {
      projectsManaged: 0,
      tasksOrchestrated: 0,
      dependenciesManaged: 0,
      conflictsResolved: 0,
      notionUpdates: 0,
      // Advanced metrics
      crossDepartmentSynergy: 0,
      strategicAlignment: 0,
      valueDelivered: 0,
      innovationScore: 0,
      stakeholderSatisfaction: 0,
      predictiveAccuracy: 0
    };
    
    // Start periodic sync
    this.hookSystem.startPeriodicHooks();
    
    logger.info('🏁 Product-Strategist orchestration initialized');
    
    // Initialize advanced features
    if (this.strategicOrchestration && this.strategicOrchestration.enabled) {
      // Strategic orchestration is already initialized
      logger.info('🟡 Strategic orchestration enabled');
    }
  }

  // ========== STRATEGIC ORCHESTRATION ==========

  /**
   * Initialize strategic orchestration
   */
  initializeStrategicOrchestration() {
    return {
      enabled: true,
      strategies: {
        marketDriven: this.initializeMarketDrivenStrategy(),
        userCentric: this.initializeUserCentricStrategy(),
        innovationFocused: this.initializeInnovationStrategy(),
        dataInformed: this.initializeDataInformedStrategy()
      },
      decisionFramework: {
        criteria: ['user_value', 'business_impact', 'technical_feasibility', 'market_opportunity'],
        weights: new Map(),
        thresholds: new Map()
      },
      portfolioManagement: {
        projects: new Map(),
        resources: new Map(),
        risks: new Map(),
        opportunities: new Map()
      }
    };
  }

  /**
   * Initialize cross-department coordination
   */
  initializeCrossDepartmentCoordination() {
    return {
      enabled: true,
      departments: {
        engineering: {
          backend: { status: 'connected', sync: true },
          frontend: { status: 'connected', sync: true }
        },
        design: {
          ux: { status: 'connected', sync: true },
          ui: { status: 'connected', sync: true }
        },
        business: {
          marketing: { status: 'connected', sync: false },
          sales: { status: 'connected', sync: false }
        }
      },
      coordinationProtocols: {
        dailySync: this.initializeDailySyncProtocol(),
        sprintPlanning: this.initializeSprintPlanningProtocol(),
        retrospective: this.initializeRetrospectiveProtocol(),
        escalation: this.initializeEscalationProtocol()
      },
      communicationChannels: {
        realtime: new Map(),
        async: new Map(),
        documentation: new Map()
      },
      alignmentMetrics: {
        goalAlignment: 0,
        resourceAlignment: 0,
        timelineAlignment: 0,
        outcomeAlignment: 0
      }
    };
  }

  /**
   * Initialize holistic metrics system
   */
  initializeHolisticMetrics() {
    return {
      enabled: true,
      dimensions: {
        business: {
          revenue: new Map(),
          costs: new Map(),
          roi: new Map(),
          marketShare: new Map()
        },
        user: {
          satisfaction: new Map(),
          engagement: new Map(),
          retention: new Map(),
          nps: new Map()
        },
        technical: {
          performance: new Map(),
          reliability: new Map(),
          scalability: new Map(),
          security: new Map()
        },
        team: {
          productivity: new Map(),
          morale: new Map(),
          growth: new Map(),
          collaboration: new Map()
        }
      },
      dashboards: {
        executive: this.createExecutiveDashboard(),
        operational: this.createOperationalDashboard(),
        tactical: this.createTacticalDashboard()
      },
      reporting: {
        frequency: 'real-time',
        formats: ['dashboard', 'report', 'alert'],
        distribution: new Map()
      }
    };
  }

  /**
   * Initialize predictive orchestration
   */
  initializePredictiveOrchestration() {
    return {
      enabled: true,
      models: {
        demandForecasting: this.initializeDemandModel(),
        capacityPlanning: this.initializeCapacityModel(),
        riskPrediction: this.initializeRiskModel(),
        outcomeSimulation: this.initializeSimulationModel()
      },
      predictions: {
        projectCompletion: new Map(),
        resourceNeeds: new Map(),
        bottlenecks: new Map(),
        outcomes: new Map()
      },
      scenarios: {
        bestCase: null,
        worstCase: null,
        mostLikely: null,
        alternatives: []
      }
    };
  }

  /**
   * Initialize stakeholder alignment system
   */
  initializeStakeholderAlignment() {
    return {
      enabled: true,
      stakeholders: {
        internal: {
          executive: { priority: 'high', communication: 'weekly' },
          teams: { priority: 'high', communication: 'daily' },
          support: { priority: 'medium', communication: 'weekly' }
        },
        external: {
          customers: { priority: 'critical', communication: 'continuous' },
          partners: { priority: 'high', communication: 'weekly' },
          investors: { priority: 'high', communication: 'monthly' }
        }
      },
      alignment: {
        vision: new Map(),
        goals: new Map(),
        expectations: new Map(),
        feedback: new Map()
      },
      communication: {
        updates: new Map(),
        meetings: new Map(),
        reports: new Map()
      }
    };
  }

  /**
   * Orchestrate cross-department initiative
   */
  async orchestrateCrossDepartmentInitiative(initiative) {
    logger.info(`🟢 Orchestrating cross-department initiative: ${initiative.name}`);
    
    const orchestration = {
      id: this.generateInitiativeId(),
      initiative,
      departments: [],
      alignment: null,
      roadmap: null,
      metrics: {}
    };
    
    try {
      // Assess strategic fit
      const strategicFit = await this.assessStrategicFit(initiative);
      
      // Identify required departments
      orchestration.departments = await this.identifyRequiredDepartments(initiative);
      
      // Align department goals
      orchestration.alignment = await this.alignDepartmentGoals(orchestration.departments, initiative);
      
      // Create integrated roadmap
      orchestration.roadmap = await this.createIntegratedRoadmap(initiative, orchestration.departments);
      
      // Setup cross-department metrics
      await this.setupCrossDepartmentMetrics(orchestration);
      
      // Initialize coordination protocols
      await this.initializeCoordinationProtocols(orchestration);
      
      // Launch initiative
      const result = await this.launchCrossDepartmentInitiative(orchestration);
      
      // Update metrics
      this.updateHolisticMetrics(orchestration, result);
      
      this.orchestrationMetrics.crossDepartmentSynergy++;
      
      return result;
      
    } catch (error) {
      logger.error('Cross-department orchestration failed:', error);
      await this.handleStrategicFailure(orchestration, error);
      throw error;
    }
  }

  /**
   * Predict and optimize resource allocation
   */
  async predictAndOptimizeResources(timeframe) {
    const prediction = {
      timeframe,
      demand: await this.predictResourceDemand(timeframe),
      capacity: await this.assessCurrentCapacity(),
      gaps: [],
      recommendations: []
    };
    
    // Identify resource gaps
    prediction.gaps = this.identifyResourceGaps(prediction.demand, prediction.capacity);
    
    // Generate optimization recommendations
    if (prediction.gaps.length > 0) {
      prediction.recommendations = await this.generateResourceOptimizations(prediction.gaps);
    }
    
    // Simulate different scenarios
    const scenarios = await this.simulateResourceScenarios(prediction);
    
    // Select optimal allocation
    const optimal = this.selectOptimalAllocation(scenarios);
    
    // Update predictive models
    await this.updatePredictiveModels(prediction, optimal);
    
    return {
      prediction,
      scenarios,
      optimal,
      confidence: this.calculatePredictionConfidence(prediction)
    };
  }

  /**
   * Generate holistic performance report
   */
  async generateHolisticReport(period) {
    const report = {
      period,
      executive_summary: await this.generateExecutiveSummary(period),
      department_performance: {},
      cross_department_synergy: {},
      strategic_alignment: {},
      predictive_insights: {},
      recommendations: []
    };
    
    // Analyze each department
    for (const [dept, config] of Object.entries(this.crossDepartmentCoordination.departments)) {
      report.department_performance[dept] = await this.analyzeDepartmentPerformance(dept, period);
    }
    
    // Analyze cross-department synergy
    report.cross_department_synergy = await this.analyzeCrossDepartmentSynergy(period);
    
    // Assess strategic alignment
    report.strategic_alignment = await this.assessStrategicAlignment(period);
    
    // Generate predictive insights
    report.predictive_insights = await this.generatePredictiveInsights(period);
    
    // Generate recommendations
    report.recommendations = await this.generateStrategicRecommendations(report);
    
    return report;
  }

  // ========== HELPER METHODS ==========

  /**
   * Initialize strategy implementations
   */
  initializeMarketDrivenStrategy() {
    return { type: 'market_driven', weight: 0.25 };
  }
  
  initializeUserCentricStrategy() {
    return { type: 'user_centric', weight: 0.35 };
  }
  
  initializeInnovationStrategy() {
    return { type: 'innovation', weight: 0.2 };
  }
  
  initializeDataInformedStrategy() {
    return { type: 'data_informed', weight: 0.2 };
  }

  /**
   * Initialize coordination protocols
   */
  initializeDailySyncProtocol() {
    return { frequency: 'daily', duration: 15, format: 'standup' };
  }
  
  initializeSprintPlanningProtocol() {
    return { frequency: 'biweekly', duration: 120, format: 'workshop' };
  }
  
  initializeRetrospectiveProtocol() {
    return { frequency: 'biweekly', duration: 60, format: 'retrospective' };
  }
  
  initializeEscalationProtocol() {
    return { triggers: ['blocker', 'critical', 'deadline'], sla: 60 };
  }

  /**
   * Create dashboards
   */
  createExecutiveDashboard() {
    return { type: 'executive', refresh: 3600000 };
  }
  
  createOperationalDashboard() {
    return { type: 'operational', refresh: 300000 };
  }
  
  createTacticalDashboard() {
    return { type: 'tactical', refresh: 60000 };
  }

  /**
   * Initialize predictive models
   */
  initializeDemandModel() {
    return { type: 'demand_forecasting', accuracy: 0.75 };
  }
  
  initializeCapacityModel() {
    return { type: 'capacity_planning', accuracy: 0.8 };
  }
  
  initializeRiskModel() {
    return { type: 'risk_prediction', accuracy: 0.7 };
  }
  
  initializeSimulationModel() {
    return { type: 'outcome_simulation', accuracy: 0.65 };
  }

  /**
   * Utility methods
   */
  generateInitiativeId() {
    return `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Process and orchestrate a new project
   */
  async orchestrateProject(request) {
    logger.info('🟢 Product-Strategist orchestrating new project');
    
    try {
      // Deep understanding phase
      const understanding = await this.deepUnderstandRequest(request);
      
      // Solution design phase
      const solution = await this.designCompleteSolution(understanding);
      
      // Sprint decomposition with dependencies
      const sprintPlan = await this.createDependencyAwareSprints(solution);
      
      // Initialize Notion workspace
      const project = await this.initializeNotionProject({
        request,
        understanding,
        solution,
        sprintPlan
      });
      
      // Setup dependency tracking
      await this.setupProjectDependencies(sprintPlan);
      
      // Begin orchestration
      await this.startProjectOrchestration(project);
      
      this.orchestrationMetrics.projectsManaged++;
      
      return project;
      
    } catch (error) {
      logger.error('Failed to orchestrate project:', error);
      await this.handleOrchestrationError(error);
      throw error;
    }
  }
  
  /**
   * Deep understanding of request
   */
  async deepUnderstandRequest(request) {
    logger.info('🟢 Analyzing request deeply');
    
    return {
      core_problem: this.identifyCoreProblem(request),
      implicit_requirements: this.extractImplicitRequirements(request),
      success_definition: this.defineSuccess(request),
      constraints: this.identifyConstraints(request),
      risks: this.assessRisks(request),
      stakeholders: this.identifyStakeholders(request)
    };
  }
  
  /**
   * Design complete solution
   */
  async designCompleteSolution(understanding) {
    logger.info('🟢 Designing comprehensive solution');
    
    return {
      architecture: await this.designSystemArchitecture(understanding),
      components: await this.identifyAllComponents(understanding),
      integrations: await this.mapIntegrations(understanding),
      deliverables: await this.defineDeliverables(understanding),
      quality_criteria: await this.establishQualityCriteria(understanding),
      timeline: await this.createRealisticTimeline(understanding)
    };
  }
  
  /**
   * Create dependency-aware sprint plan
   */
  async createDependencyAwareSprints(solution) {
    logger.info('🟢 Creating dependency-aware sprint plan');
    
    // Use sprint decomposition system
    const rawSprints = await this.planWithSprints({
      title: solution.architecture.name,
      description: solution.architecture.description,
      components: solution.components,
      deliverables: solution.deliverables
    });
    
    // Enhance with dependencies
    const enhancedSprints = await this.addSprintDependencies(rawSprints);
    
    // Optimize execution order
    const optimizedPlan = await this.optimizeSprintSequence(enhancedSprints);
    
    return optimizedPlan;
  }
  
  /**
   * Initialize Notion project workspace
   */
  async initializeNotionProject(projectData) {
    logger.info('🟢 Setting up Notion project workspace');
    
    // Create main project
    const project = await this.notionClient.createProjectDashboard({
      title: projectData.request.title || 'New Project',
      epic: projectData.request.description,
      owner: 'Product-Strategist'
    });
    
    // Create all tasks with dependencies
    for (const sprint of projectData.sprintPlan.sprints) {
      await this.createNotionTask(sprint, project.id);
    }
    
    // Setup views and dashboards
    await this.setupProjectViews(project.id);
    
    // Initialize knowledge base
    await this.initializeKnowledgeBase(project.id);
    
    this.orchestrationMetrics.notionUpdates++;
    
    return project;
  }
  
  /**
   * MANDATORY: Update Notion on sprint completion
   */
  async onSprintCompleted(data) {
    logger.info(`🏁 MANDATORY: Updating Notion for completed sprint ${data.sprintId}`);
    
    await this.updateNotionSprintCompletion(data);
    await this.checkDependentTasks(data.sprintId);
    await this.updateProjectProgress();
    
    this.orchestrationMetrics.tasksOrchestrated++;
    this.orchestrationMetrics.notionUpdates++;
  }
  
  /**
   * MANDATORY: Validate task allocation
   */
  async validateAllocation(data) {
    logger.info(`🟢 MANDATORY: Validating allocation of ${data.taskId} to ${data.agentId}`);
    
    // Check dependencies are met
    const dependenciesMet = await this.checkDependencies(data.taskId);
    if (!dependenciesMet) {
      throw new Error(`Cannot allocate ${data.taskId} - dependencies not met`);
    }
    
    // Check agent capability match
    const capabilityMatch = await this.verifyAgentCapability(data.agentId, data.taskId);
    if (!capabilityMatch) {
      logger.warn(`Agent ${data.agentId} may not be optimal for ${data.taskId}`);
    }
    
    // Update allocation tracking
    this.taskAllocations.set(data.taskId, data.agentId);
    
    return true;
  }
  
  /**
   * MANDATORY: Check and update dependent tasks
   */
  async checkDependentTasks(sprintId) {
    logger.info(`🟢 Checking dependent tasks for ${sprintId}`);
    
    const dependentTasks = this.dependencyManager.dependencyGraph.get(sprintId)?.enables || [];
    
    for (const taskId of dependentTasks) {
      const canExecute = this.dependencyManager.canExecute(taskId);
      
      if (canExecute) {
        logger.info(`🏁 Task ${taskId} is now unblocked`);
        await this.notionClient.updateTaskStatus(taskId, 'ready');
        await this.allocateTaskIfAgentAvailable(taskId);
      }
    }
    
    this.orchestrationMetrics.dependenciesManaged++;
  }
  
  /**
   * MANDATORY: Analyze and handle blockers
   */
  async analyzeBlocker(data) {
    logger.warn(`🔴 MANDATORY: Analyzing blocker for ${data.taskId}`);
    
    const blockAnalysis = {
      taskId: data.taskId,
      reason: data.reason,
      impact: await this.assessBlockerImpact(data.taskId),
      alternatives: await this.findAlternatives(data.taskId),
      recommendation: await this.recommendAction(data)
    };
    
    // Update Notion with blocker analysis
    await this.notionClient.addKnowledge({
      title: `Blocker Analysis: ${data.taskId}`,
      type: 'blocker_analysis',
      content: JSON.stringify(blockAnalysis),
      agentId: 'Product-Strategist',
      tags: ['blocker', 'analysis', data.taskId]
    });
    
    // Take corrective action
    await this.executeBlockerResolution(blockAnalysis);
    
    this.orchestrationMetrics.conflictsResolved++;
  }
  
  /**
   * MANDATORY: Handle dependency violations
   */
  async handleDependencyViolation(data) {
    logger.error(`🔴 CRITICAL: Dependency violation in ${data.taskId}`);
    
    // Stop affected tasks immediately
    await this.stopAffectedTasks(data);
    
    // Analyze violation
    const violation = {
      task: data.taskId,
      dependency: data.dependency,
      severity: 'critical',
      timestamp: new Date().toISOString()
    };
    
    // Update Notion with violation
    await this.notionClient.updateTaskStatus(data.taskId, 'blocked');
    await this.updateNotionViolation(violation);
    
    // Notify human operator
    await this.notifyHumanOperator({
      type: 'dependency_violation',
      ...violation
    });
    
    // Plan recovery
    await this.planDependencyRecovery(data);
  }
  
  /**
   * MANDATORY: Comprehensive Notion sync
   */
  async comprehensiveNotionSync() {
    logger.info('🟢 MANDATORY: Comprehensive Notion synchronization');
    
    try {
      // Sync all active projects
      for (const [projectId, project] of this.activeProjects) {
        await this.syncProjectToNotion(project);
      }
      
      // Update agent statuses
      await this.syncAgentStatuses();
      
      // Update dependency graph
      await this.updateNotionDependencyGraph();
      
      // Update knowledge base
      await this.syncKnowledgeBase();
      
      // Calculate and update metrics
      await this.updateProjectMetrics();
      
      this.orchestrationMetrics.notionUpdates++;
      
      logger.info('🏁 Notion sync completed');
      
    } catch (error) {
      logger.error('Notion sync failed:', error);
      await this.handleSyncError(error);
    }
  }
  
  /**
   * Update Notion with sprint completion
   */
  async updateNotionSprintCompletion(data) {
    await this.notionClient.updateTaskStatus(data.sprintId, 'completed');
    
    // Add completion knowledge
    await this.notionClient.addKnowledge({
      title: `Sprint ${data.sprintId} Completion Report`,
      type: 'sprint_completion',
      content: `Completed by ${data.agentId} in ${data.duration} minutes`,
      agentId: data.agentId,
      taskId: data.sprintId,
      tags: ['completion', 'sprint', data.agentId]
    });
  }
  
  /**
   * Allocate task if agent available
   */
  async allocateTaskIfAgentAvailable(taskId) {
    const availableAgents = await this.orchestrator.getAvailableAgents();
    
    if (availableAgents.length > 0) {
      const sprint = this.orchestrator.sprints.get(taskId);
      const bestAgent = this.orchestrator.findBestAgent(sprint, availableAgents);
      
      if (bestAgent) {
        await this.orchestrator.allocateTask(sprint, bestAgent);
        logger.info(`🏁 Allocated ${taskId} to ${bestAgent.id}`);
      }
    }
  }
  
  /**
   * Reallocate resources if needed
   */
  async reallocateIfNeeded() {
    const stats = this.dependencyManager.getStats();
    
    if (stats.blockedTasks > stats.readyTasks * 2) {
      logger.warn('🟡 High number of blocked tasks - reallocating');
      await this.optimizeResourceAllocation();
    }
  }
  
  /**
   * Optimize resource allocation
   */
  async optimizeResourceAllocation() {
    logger.info('🟢 Optimizing resource allocation');
    
    // Get current state
    const readyTasks = this.dependencyManager.getReadyTasks();
    const availableAgents = await this.orchestrator.getAvailableAgents();
    
    // Create optimal allocation plan
    const allocationPlan = this.createOptimalAllocation(readyTasks, availableAgents);
    
    // Execute allocations
    for (const allocation of allocationPlan) {
      await this.orchestrator.allocateTask(allocation.task, allocation.agent);
    }
    
    logger.info(`🏁 Allocated ${allocationPlan.length} tasks optimally`);
  }
  
  /**
   * Stop affected tasks due to violation
   */
  async stopAffectedTasks(data) {
    const affected = this.findAffectedTasks(data.taskId);
    
    for (const taskId of affected) {
      const agent = this.taskAllocations.get(taskId);
      if (agent) {
        logger.warn(`⏹️ Stopping task ${taskId} on agent ${agent}`);
        // In real system, would send stop signal to agent
        await this.notionClient.updateTaskStatus(taskId, 'blocked');
      }
    }
  }
  
  /**
   * Update Notion with violation details
   */
  async updateNotionViolation(violation) {
    await this.notionClient.addKnowledge({
      title: 'DEPENDENCY VIOLATION',
      type: 'violation',
      content: JSON.stringify(violation),
      agentId: 'Product-Strategist',
      tags: ['violation', 'critical', 'dependency']
    });
  }
  
  /**
   * Notify human operator of critical issues
   */
  async notifyHumanOperator(notification) {
    logger.error(`🔴 NOTIFYING HUMAN: ${notification.type}`);
    
    // In real system, would send actual notification
    await this.notionClient.addKnowledge({
      title: `HUMAN ATTENTION REQUIRED: ${notification.type}`,
      type: 'alert',
      content: JSON.stringify(notification),
      agentId: 'Product-Strategist',
      tags: ['alert', 'human', 'critical']
    });
  }
  
  /**
   * Helper methods for orchestration
   */
  identifyCoreProblem(request) {
    return { description: 'Core problem identified', complexity: 'high' };
  }
  
  extractImplicitRequirements(request) {
    return ['scalability', 'maintainability', 'security'];
  }
  
  defineSuccess(request) {
    return { criteria: ['functional', 'performant', 'secure'] };
  }
  
  identifyConstraints(request) {
    return ['time', 'resources', 'technology'];
  }
  
  assessRisks(request) {
    return [{ risk: 'complexity', mitigation: 'sprint decomposition' }];
  }
  
  identifyStakeholders(request) {
    return ['human_operator', 'end_users', 'development_team'];
  }
  
  async checkDependencies(taskId) {
    return this.dependencyManager.canExecute(taskId);
  }
  
  async verifyAgentCapability(agentId, taskId) {
    const agent = this.orchestrator.agents.get(agentId);
    const sprint = this.orchestrator.sprints.get(taskId);
    
    if (!agent || !sprint) {return false;}
    
    return sprint.requiredSkills.some(skill => agent.skills.includes(skill));
  }
  
  findAffectedTasks(taskId) {
    const affected = [];
    const task = this.dependencyManager.dependencyGraph.get(taskId);
    
    if (task) {
      affected.push(...task.enables);
    }
    
    return affected;
  }
  
  createOptimalAllocation(tasks, agents) {
    const allocations = [];
    
    for (const taskId of tasks) {
      if (agents.length === 0) {break;}
      
      const sprint = this.orchestrator.sprints.get(taskId);
      const bestAgent = this.orchestrator.findBestAgent(sprint, agents);
      
      if (bestAgent) {
        allocations.push({ task: sprint, agent: bestAgent });
        agents = agents.filter(a => a.id !== bestAgent.id);
      }
    }
    
    return allocations;
  }
  
  /**
   * Get orchestration status
   */
  getOrchestrationStatus() {
    return {
      role: 'Supreme Orchestrator',
      activeProjects: this.activeProjects.size,
      metrics: this.orchestrationMetrics,
      hookSystemHealth: this.hookSystem.validateHealth(),
      dependencyStats: this.dependencyManager.getStats()
    };
  }
}

/**
 * Apply orchestration capabilities to Product-Strategist Manager
 */
function enhanceProductStrategist(ProductStrategistManager) {
  // Create enhanced class
  class EnhancedProductStrategistManager extends ProductStrategistManager {
    constructor(...args) {
      super(...args);
      this.initializeOrchestration();
    }
  }
  
  // Add all orchestration methods to the enhanced class
  Object.getOwnPropertyNames(ProductStrategistOrchestrator.prototype).forEach(name => {
    if (name !== 'constructor') {
      EnhancedProductStrategistManager.prototype[name] = ProductStrategistOrchestrator.prototype[name];
    }
  });
  
  return EnhancedProductStrategistManager;
}

module.exports = {
  ProductStrategistOrchestrator,
  enhanceProductStrategist
};