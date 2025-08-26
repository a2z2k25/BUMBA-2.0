/**
 * BUMBA Task Orchestration Engine
 * Central coordinator for all task management and agent allocation
 * @module task-orchestrator
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { DependencyManager } = require('./dependency-manager');
const notionClientModule = require('./notion-client');
const SprintDecompositionSystem = require('../planning/sprint-decomposition-system');

class TaskOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxParallelAgents: config.maxParallelAgents || 10,
      sprintDuration: config.sprintDuration || 10,
      autoAllocate: config.autoAllocate !== false,
      priorityMode: config.priorityMode || 'critical-path',
      ...config
    };
    
    // Core components
    this.dependencyManager = new DependencyManager();
    this.notionClient = notionClientModule.getInstance(config.notion);
    this.sprintSystem = new SprintDecompositionSystem();
    
    // State management
    this.activeProject = null;
    this.sprints = new Map(); // sprintId -> sprint data
    this.agents = new Map(); // agentId -> agent info
    this.allocations = new Map(); // agentId -> current task
    this.executionQueue = [];
    this.completedSprints = new Set();
    
    // Metrics
    this.metrics = {
      totalSprints: 0,
      completedSprints: 0,
      failedSprints: 0,
      averageDuration: 0,
      parallelizationEfficiency: 0
    };
    
    logger.info('🟢 Task Orchestrator initialized');
  }
  
  /**
   * Initialize orchestrator and connect to Notion
   */
  async initialize() {
    await this.notionClient.connect();
    
    // Set up event listeners
    this.setupEventListeners();
    
    logger.info('🏁 Task Orchestrator ready');
    
    return true;
  }
  
  /**
   * Process a new project request
   */
  async processProjectRequest(request) {
    logger.info(`🟢 Processing project request: ${request.title || request.description}`);
    
    try {
      // Step 1: Deep understanding
      const understanding = await this.analyzeRequest(request);
      
      // Step 2: Solution architecture
      const solution = await this.designSolution(understanding);
      
      // Step 3: Sprint decomposition
      const sprintPlan = await this.decomposeIntoSprints(solution);
      
      // Step 4: Create project in Notion
      const project = await this.createNotionProject({
        title: request.title || 'New Project',
        epic: request.description,
        solution,
        sprintPlan
      });
      
      // Step 5: Setup dependencies
      await this.setupDependencies(sprintPlan);
      
      // Step 6: Identify parallel groups
      const parallelGroups = this.dependencyManager.getParallelGroups();
      
      // Step 7: Store project state
      this.activeProject = {
        id: project.id,
        request,
        understanding,
        solution,
        sprintPlan,
        parallelGroups,
        status: 'ready'
      };
      
      logger.info(`🏁 Project initialized with ${sprintPlan.sprints.length} sprints`);
      
      this.emit('project:ready', this.activeProject);
      
      return this.activeProject;
      
    } catch (error) {
      logger.error('Failed to process project request:', error);
      throw error;
    }
  }
  
  /**
   * Analyze and understand the request
   */
  async analyzeRequest(request) {
    return {
      problemSpace: this.identifyProblemSpace(request),
      requirements: this.extractRequirements(request),
      constraints: this.identifyConstraints(request),
      successCriteria: this.defineSuccessCriteria(request),
      complexity: this.assessComplexity(request)
    };
  }
  
  /**
   * Design complete solution
   */
  async designSolution(understanding) {
    return {
      architecture: this.designArchitecture(understanding),
      components: this.identifyComponents(understanding),
      deliverables: this.defineDeliverables(understanding),
      timeline: this.estimateTimeline(understanding),
      resources: this.identifyResources(understanding)
    };
  }
  
  /**
   * Decompose solution into sprints
   */
  async decomposeIntoSprints(solution) {
    const task = {
      title: solution.architecture.title || 'Project',
      description: solution.architecture.description,
      requirements: solution.components,
      deliverables: solution.deliverables
    };
    
    const sprintPlan = await this.sprintSystem.decomposeIntoSprints(task);
    
    // Enhance sprints with allocation info
    const enhancedSprints = sprintPlan.sprintPlan.sprints.map(sprint => {
      const requiredSkills = this.identifyRequiredSkills(sprint);
      const enhancedSprint = {
        ...sprint,
        requiredSkills,
        estimatedStart: null,
        actualStart: null,
        actualEnd: null
      };
      enhancedSprint.candidateAgents = this.identifyCandidateAgents(enhancedSprint);
      return enhancedSprint;
    });
    
    return {
      ...sprintPlan.sprintPlan,
      sprints: enhancedSprints
    };
  }
  
  /**
   * Create project in Notion
   */
  async createNotionProject(projectData) {
    // Create project dashboard
    const project = await this.notionClient.createProjectDashboard(projectData);
    
    // Create all sprint tasks
    for (const sprint of projectData.sprintPlan.sprints) {
      const task = await this.notionClient.createTask({
        title: sprint.title,
        sprintId: sprint.id,
        status: sprint.dependencies.length === 0 ? 'ready' : 'blocked',
        priority: sprint.priority,
        estimatedDuration: sprint.duration,
        requiredSkills: sprint.requiredSkills,
        dependencies: sprint.dependencies
      });
      
      // Store task ID
      sprint.notionTaskId = task.id;
      this.sprints.set(sprint.id, sprint);
    }
    
    return project;
  }
  
  /**
   * Setup dependency graph
   */
  async setupDependencies(sprintPlan) {
    for (const sprint of sprintPlan.sprints) {
      this.dependencyManager.addTask(sprint.id, sprint.dependencies, {
        estimatedDuration: sprint.duration,
        priority: sprint.priority,
        type: sprint.type
      });
    }
    
    // Validate dependency graph
    const validation = this.dependencyManager.validate();
    if (!validation.valid) {
      throw new Error(`Invalid dependencies: ${validation.errors.join(', ')}`);
    }
    
    logger.info(`🏁 Dependency graph created with ${sprintPlan.sprints.length} tasks`);
  }
  
  /**
   * Start project execution
   */
  async startExecution() {
    if (!this.activeProject) {
      throw new Error('No active project to execute');
    }
    
    logger.info('🟢 Starting project execution');
    
    this.activeProject.status = 'executing';
    this.activeProject.startTime = Date.now();
    
    // Start allocation loop
    await this.allocateReadyTasks();
    
    // Monitor progress
    this.startProgressMonitoring();
    
    this.emit('execution:started', this.activeProject);
    
    return true;
  }
  
  /**
   * Allocate ready tasks to available agents
   */
  async allocateReadyTasks() {
    const readyTasks = this.dependencyManager.getReadyTasks();
    const availableAgents = this.getAvailableAgents();
    
    logger.info(`🟢 Ready tasks: ${readyTasks.length}, Available agents: ${availableAgents.length}`);
    
    for (const taskId of readyTasks) {
      if (availableAgents.length === 0) {break;}
      
      const sprint = this.sprints.get(taskId);
      if (!sprint) {continue;}
      
      // Find best agent for task
      const agent = this.findBestAgent(sprint, availableAgents);
      if (!agent) {continue;}
      
      // Allocate task to agent
      await this.allocateTask(sprint, agent);
      
      // Remove agent from available list
      const index = availableAgents.indexOf(agent);
      availableAgents.splice(index, 1);
    }
    
    // Update Notion with allocations
    await this.syncAllocationsToNotion();
  }
  
  /**
   * Allocate a task to an agent
   */
  async allocateTask(sprint, agent) {
    logger.info(`🟢 Allocating ${sprint.id} to ${agent.id}`);
    
    // Update local state
    this.allocations.set(agent.id, sprint.id);
    sprint.assignedAgent = agent.id;
    sprint.status = 'allocated';
    sprint.estimatedStart = Date.now();
    
    // Update Notion
    await this.notionClient.claimTask(sprint.notionTaskId, agent.id);
    await this.notionClient.updateTaskStatus(sprint.notionTaskId, 'claimed');
    await this.notionClient.updateAgentStatus(agent.id, 'busy', sprint.notionTaskId);
    
    // Notify agent
    this.emit('task:allocated', {
      taskId: sprint.id,
      agentId: agent.id,
      sprint
    });
    
    // Start execution
    this.executeSprintWithAgent(sprint, agent);
  }
  
  /**
   * Execute sprint with assigned agent
   */
  async executeSprintWithAgent(sprint, agent) {
    try {
      // Update status
      sprint.status = 'in_progress';
      sprint.actualStart = Date.now();
      
      await this.notionClient.updateTaskStatus(sprint.notionTaskId, 'in_progress');
      
      // Simulate sprint execution (in real system, agent would execute)
      logger.info(`🟢 ${agent.id} executing ${sprint.id}`);
      
      // Wait for sprint duration (simulated)
      await new Promise(resolve => 
        setTimeout(resolve, Math.min(sprint.duration * 1000, 10000))
      );
      
      // Sprint completed
      await this.onSprintCompleted(sprint, agent);
      
    } catch (error) {
      logger.error(`Sprint ${sprint.id} failed:`, error);
      await this.onSprintFailed(sprint, agent, error);
    }
  }
  
  /**
   * Handle sprint completion
   */
  async onSprintCompleted(sprint, agent) {
    logger.info(`🏁 Sprint ${sprint.id} completed by ${agent.id}`);
    
    // Update sprint status
    sprint.status = 'completed';
    sprint.actualEnd = Date.now();
    sprint.actualDuration = (sprint.actualEnd - sprint.actualStart) / 60000;
    
    // Mark completed in dependency manager
    const unblockedTasks = this.dependencyManager.markCompleted(sprint.id);
    
    // Update Notion
    await this.notionClient.updateTaskStatus(sprint.notionTaskId, 'completed');
    await this.notionClient.updateAgentStatus(agent.id, 'available');
    
    // Add to knowledge base
    await this.notionClient.addKnowledge({
      title: `${sprint.title} - Results`,
      type: 'sprint_output',
      content: `Sprint ${sprint.id} completed successfully`,
      agentId: agent.id,
      taskId: sprint.notionTaskId,
      tags: sprint.deliverables
    });
    
    // Update metrics
    this.updateMetrics(sprint);
    
    // Free agent
    this.allocations.delete(agent.id);
    this.completedSprints.add(sprint.id);
    
    // Emit completion event
    this.emit('sprint:completed', {
      sprintId: sprint.id,
      agentId: agent.id,
      duration: sprint.actualDuration,
      unblockedTasks
    });
    
    // Check if project complete
    if (this.isProjectComplete()) {
      await this.onProjectComplete();
    } else {
      // Allocate newly ready tasks
      await this.allocateReadyTasks();
    }
  }
  
  /**
   * Handle sprint failure
   */
  async onSprintFailed(sprint, agent, error) {
    logger.error(`🔴 Sprint ${sprint.id} failed:`, error.message);
    
    sprint.status = 'failed';
    sprint.error = error.message;
    
    // Update Notion
    await this.notionClient.updateTaskStatus(sprint.notionTaskId, 'blocked');
    await this.notionClient.updateAgentStatus(agent.id, 'available');
    
    // Free agent
    this.allocations.delete(agent.id);
    
    // Update metrics
    this.metrics.failedSprints++;
    
    // Emit failure event
    this.emit('sprint:failed', {
      sprintId: sprint.id,
      agentId: agent.id,
      error: error.message
    });
    
    // Attempt retry or reallocation
    await this.handleSprintRetry(sprint);
  }
  
  /**
   * Check if project is complete
   */
  isProjectComplete() {
    if (!this.activeProject) {return false;}
    
    const totalSprints = this.activeProject.sprintPlan.sprints.length;
    const completed = this.completedSprints.size;
    
    return completed === totalSprints;
  }
  
  /**
   * Handle project completion
   */
  async onProjectComplete() {
    logger.info('🏁 Project completed successfully!');
    
    this.activeProject.status = 'completed';
    this.activeProject.endTime = Date.now();
    this.activeProject.duration = (this.activeProject.endTime - this.activeProject.startTime) / 60000;
    
    // Update Notion project status
    await this.notionClient.updateProjectStatus(this.activeProject.id, 'completed');
    
    // Calculate final metrics
    const finalMetrics = this.calculateFinalMetrics();
    
    // Emit completion event
    this.emit('project:completed', {
      project: this.activeProject,
      metrics: finalMetrics
    });
    
    logger.info(`🟢 Project Metrics:
      Total Duration: ${this.activeProject.duration.toFixed(2)} minutes
      Sprints Completed: ${this.completedSprints.size}
      Parallelization Efficiency: ${finalMetrics.parallelizationEfficiency.toFixed(2)}%
    `);
  }
  
  /**
   * Register an agent
   */
  registerAgent(agent) {
    this.agents.set(agent.id, {
      id: agent.id,
      type: agent.type,
      skills: agent.skills || [],
      status: 'available',
      currentTask: null,
      performance: {
        tasksCompleted: 0,
        averageDuration: 0,
        successRate: 100
      }
    });
    
    logger.info(`🟢 Registered agent: ${agent.id}`);
    
    return true;
  }
  
  /**
   * Get available agents
   */
  getAvailableAgents() {
    const available = [];
    
    for (const [agentId, agent] of this.agents) {
      if (!this.allocations.has(agentId)) {
        available.push(agent);
      }
    }
    
    return available;
  }
  
  /**
   * Find best agent for a sprint
   */
  findBestAgent(sprint, availableAgents) {
    // Score agents based on skill match
    const scores = availableAgents.map(agent => {
      let score = 0;
      
      // Skill match
      const skillMatch = sprint.requiredSkills.filter(skill => 
        agent.skills.includes(skill)
      ).length;
      score += skillMatch * 10;
      
      // Performance score
      score += agent.performance.successRate / 10;
      
      // Type match
      if (sprint.type === 'planning' && agent.type === 'manager') {
        score += 20;
      }
      
      return { agent, score };
    });
    
    // Sort by score and return best
    scores.sort((a, b) => b.score - a.score);
    
    return scores[0]?.agent || null;
  }
  
  /**
   * Identify required skills for sprint
   */
  identifyRequiredSkills(sprint) {
    const skills = [];
    const type = sprint.type.toLowerCase();
    
    if (type.includes('analysis')) {skills.push('research', 'analysis');}
    if (type.includes('planning')) {skills.push('planning', 'architecture');}
    if (type.includes('implementation')) {skills.push('coding', 'development');}
    if (type.includes('testing')) {skills.push('testing', 'qa');}
    if (type.includes('documentation')) {skills.push('documentation', 'writing');}
    if (type.includes('review')) {skills.push('review', 'quality');}
    
    return skills;
  }
  
  /**
   * Identify candidate agents for sprint
   */
  identifyCandidateAgents(sprint) {
    const candidates = [];
    
    for (const [agentId, agent] of this.agents) {
      const skillMatch = sprint.requiredSkills.some(skill => 
        agent.skills.includes(skill)
      );
      
      if (skillMatch) {
        candidates.push(agentId);
      }
    }
    
    return candidates;
  }
  
  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      activeProject: this.activeProject?.id || null,
      totalSprints: this.sprints.size,
      completedSprints: this.completedSprints.size,
      agents: this.agents.size,
      allocations: this.allocations.size,
      metrics: this.metrics
    };
  }
  
  /**
   * Update metrics
   */
  updateMetrics(sprint) {
    this.metrics.completedSprints++;
    
    // Update average duration
    const totalDuration = this.metrics.averageDuration * (this.metrics.completedSprints - 1);
    this.metrics.averageDuration = (totalDuration + sprint.actualDuration) / this.metrics.completedSprints;
  }
  
  /**
   * Calculate final project metrics
   */
  calculateFinalMetrics() {
    const totalPossibleTime = this.activeProject.sprintPlan.totalDuration;
    const actualTime = this.activeProject.duration;
    
    const parallelizationEfficiency = (totalPossibleTime / actualTime) * 100;
    
    return {
      totalSprints: this.activeProject.sprintPlan.sprints.length,
      completedSprints: this.completedSprints.size,
      failedSprints: this.metrics.failedSprints,
      averageDuration: this.metrics.averageDuration,
      parallelizationEfficiency,
      totalDuration: actualTime
    };
  }
  
  /**
   * Sync allocations to Notion
   */
  async syncAllocationsToNotion() {
    // Batch update all allocations
    const updates = [];
    
    for (const [agentId, taskId] of this.allocations) {
      const sprint = this.sprints.get(taskId);
      if (sprint) {
        updates.push({
          taskId: sprint.notionTaskId,
          agentId,
          status: sprint.status
        });
      }
    }
    
    // Process updates
    for (const update of updates) {
      await this.notionClient.updateTaskAllocation(update);
    }
  }
  
  /**
   * Start progress monitoring
   */
  startProgressMonitoring() {
    this.progressInterval = setInterval(async () => {
      const progress = await this.notionClient.getProjectProgress(this.activeProject.id);
      
      this.emit('progress:update', progress);
      
      logger.info(`🟢 Progress: ${progress.completedTasks}/${progress.totalTasks} (${progress.progress.toFixed(1)}%)`);
      
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Handle sprint retry
   */
  async handleSprintRetry(sprint) {
    // Reset sprint status
    sprint.status = 'ready';
    sprint.retryCount = (sprint.retryCount || 0) + 1;
    
    if (sprint.retryCount < 3) {
      logger.info(`🟢 Retrying sprint ${sprint.id} (attempt ${sprint.retryCount})`);
      
      // Re-add to ready queue
      await this.allocateReadyTasks();
    } else {
      logger.error(`Sprint ${sprint.id} failed after 3 attempts`);
      this.emit('sprint:abandoned', { sprintId: sprint.id });
    }
  }
  
  /**
   * Helper methods for request analysis
   */
  identifyProblemSpace(request) {
    return {
      domain: 'software_development',
      scope: 'full_stack',
      complexity: 'high'
    };
  }
  
  extractRequirements(request) {
    return ['functionality', 'performance', 'security', 'usability'];
  }
  
  identifyConstraints(request) {
    return ['time', 'resources', 'technology'];
  }
  
  defineSuccessCriteria(request) {
    return ['deliverables_complete', 'tests_passing', 'documentation_ready'];
  }
  
  assessComplexity(request) {
    return { score: 0.7, level: 'high' };
  }
  
  designArchitecture(understanding) {
    return {
      title: 'Solution Architecture',
      components: ['frontend', 'backend', 'database'],
      patterns: ['mvc', 'repository', 'observer']
    };
  }
  
  identifyComponents(understanding) {
    return ['ui', 'api', 'database', 'auth', 'cache'];
  }
  
  defineDeliverables(understanding) {
    return ['code', 'tests', 'documentation', 'deployment'];
  }
  
  estimateTimeline(understanding) {
    return { duration: 180, unit: 'minutes' };
  }
  
  identifyResources(understanding) {
    return ['developers', 'designers', 'testers'];
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen to dependency manager events
    this.dependencyManager.on('tasks:unblocked', ({ tasks }) => {
      logger.info(`🟡 Tasks unblocked: ${tasks.join(', ')}`);
      this.allocateReadyTasks();
    });
    
    // Listen to Notion client events
    this.notionClient.on('task:completed', ({ taskId }) => {
      this.emit('notion:task:completed', { taskId });
    });
  }
}

// Export singleton
let instance = null;

module.exports = {
  TaskOrchestrator,
  getInstance: (config) => {
    if (!instance) {
      instance = new TaskOrchestrator(config);
    }
    return instance;
  }
};