/**
 * BUMBA Specialist Integration Module
 * Connects specialists with workflow systems for seamless orchestration
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const UnifiedSpecialistBase = require('../specialists/unified-specialist-base');
const { WorkflowEngine, getInstance: getWorkflowEngine } = require('./workflow-engine');
const { PipelineManager, getInstance: getPipelineManager } = require('./pipeline-manager');
const { TaskAutomation, getInstance: getTaskAutomation } = require('./task-automation');

class SpecialistIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.config = {
      maxSpecialists: config.maxSpecialists || 50,
      poolSize: config.poolSize || 10,
      loadBalancing: config.loadBalancing || 'round-robin',
      enableCaching: config.enableCaching !== false,
      enableMetrics: config.enableMetrics !== false,
      ...config
    };
    
    // Specialist registry
    this.specialists = new Map();
    this.specialistTypes = new Map();
    this.specialistPools = new Map();
    
    // Department management
    this.departments = new Map();
    this.departmentManagers = new Map();
    
    // Task routing
    this.taskRouter = new Map();
    this.skillMatrix = new Map();
    
    // Collaboration
    this.collaborationSessions = new Map();
    this.teamFormations = new Map();
    
    // Performance tracking
    this.performance = new Map();
    this.workload = new Map();
    
    // Metrics
    this.metrics = {
      specialistsRegistered: 0,
      tasksAssigned: 0,
      tasksCompleted: 0,
      collaborations: 0,
      averageResponseTime: 0,
      utilizationRate: 0
    };
    
    // System integrations
    this.workflowEngine = null;
    this.pipelineManager = null;
    this.taskAutomation = null;
    
    this.initialize();
  }
  
  /**
   * Initialize specialist integration
   */
  async initialize() {
    try {
      // Get system instances
      this.workflowEngine = getWorkflowEngine();
      this.pipelineManager = getPipelineManager();
      this.taskAutomation = getTaskAutomation();
      
      // Register specialist types
      await this.registerSpecialistTypes();
      
      // Setup departments
      await this.setupDepartments();
      
      // Initialize specialist pools
      await this.initializeSpecialistPools();
      
      // Setup workflow integration
      await this.setupWorkflowIntegration();
      
      // Setup pipeline integration
      await this.setupPipelineIntegration();
      
      // Setup automation integration
      await this.setupAutomationIntegration();
      
      logger.info('👥 Specialist Integration initialized');
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Specialist Integration:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Register a specialist
   */
  async registerSpecialist(specialist) {
    try {
      // Validate specialist
      if (!specialist.id || !specialist.type) {
        throw new Error('Invalid specialist configuration');
      }
      
      // Initialize specialist if needed
      if (!specialist.initialized) {
        await specialist.initialize();
      }
      
      // Store specialist
      this.specialists.set(specialist.id, specialist);
      
      // Add to type registry
      if (!this.specialistTypes.has(specialist.type)) {
        const typeInfo = this.specialistTypes.get(specialist.type) || { instances: new Set() };
        if (!typeInfo.instances) {
          typeInfo.instances = new Set();
        }
        this.specialistTypes.set(specialist.type, typeInfo);
      }
      const typeInfo = this.specialistTypes.get(specialist.type);
      if (typeInfo && typeInfo.instances) {
        typeInfo.instances.add(specialist.id);
      }
      
      // Add to department if specified
      if (specialist.department) {
        await this.assignToDepartment(specialist, specialist.department);
      }
      
      // Initialize performance tracking
      this.performance.set(specialist.id, {
        tasksCompleted: 0,
        successRate: 100,
        averageTime: 0,
        lastActive: Date.now()
      });
      
      // Initialize workload tracking
      this.workload.set(specialist.id, {
        current: 0,
        max: specialist.maxWorkload || 5,
        queue: []
      });
      
      // Setup event handlers
      this.setupSpecialistHandlers(specialist);
      
      this.metrics.specialistsRegistered++;
      
      this.emit('specialist:registered', specialist);
      logger.info(`👤 Registered specialist: ${specialist.name} (${specialist.type})`);
      
      return specialist;
      
    } catch (error) {
      logger.error('Failed to register specialist:', error);
      throw error;
    }
  }
  
  /**
   * Assign task to best specialist
   */
  async assignTask(task, options = {}) {
    try {
      // Analyze task requirements
      const requirements = await this.analyzeTaskRequirements(task);
      
      // Find suitable specialists
      const candidates = await this.findSuitableSpecialists(requirements);
      
      if (candidates.length === 0) {
        throw new Error('No suitable specialists available');
      }
      
      // Select best specialist
      const specialist = await this.selectBestSpecialist(candidates, task, options);
      
      // Check if collaboration is needed
      if (requirements.requiresCollaboration) {
        return await this.assignCollaborativeTask(task, specialist, requirements);
      }
      
      // Assign task to specialist
      const assignment = {
        taskId: task.id || this.generateTaskId(),
        specialistId: specialist.id,
        assignedAt: Date.now(),
        priority: task.priority || 5,
        deadline: task.deadline
      };
      
      // Update workload
      this.updateWorkload(specialist.id, 'add', task);
      
      // Process task
      const result = await specialist.processTask(task);
      
      // Update metrics
      this.updatePerformance(specialist.id, result);
      
      // Update workload
      this.updateWorkload(specialist.id, 'remove', task);
      
      this.metrics.tasksAssigned++;
      this.metrics.tasksCompleted++;
      
      this.emit('task:completed', { task, specialist, result });
      
      return result;
      
    } catch (error) {
      logger.error('Failed to assign task:', error);
      throw error;
    }
  }
  
  /**
   * Assign collaborative task
   */
  async assignCollaborativeTask(task, leadSpecialist, requirements) {
    try {
      // Form team
      const team = await this.formTeam(leadSpecialist, requirements);
      
      // Create collaboration session
      const session = {
        id: this.generateSessionId(),
        task,
        lead: leadSpecialist.id,
        team: team.map(s => s.id),
        startTime: Date.now(),
        status: 'active'
      };
      
      this.collaborationSessions.set(session.id, session);
      
      // Divide work
      const subtasks = await this.divideWork(task, team);
      
      // Execute in parallel
      const results = await Promise.all(
        subtasks.map((subtask, index) => 
          team[index].processTask(subtask)
        )
      );
      
      // Merge results
      const finalResult = await this.mergeResults(results, task);
      
      // Update session
      session.status = 'completed';
      session.duration = Date.now() - session.startTime;
      session.result = finalResult;
      
      // Update metrics
      this.metrics.collaborations++;
      
      this.emit('collaboration:completed', session);
      
      return finalResult;
      
    } catch (error) {
      logger.error('Failed to assign collaborative task:', error);
      throw error;
    }
  }
  
  /**
   * Form a team for collaborative task
   */
  async formTeam(leadSpecialist, requirements) {
    const team = [leadSpecialist];
    const neededSkills = [...requirements.skills];
    
    // Remove lead's skills
    leadSpecialist.skills.forEach(skill => {
      const index = neededSkills.indexOf(skill);
      if (index > -1) neededSkills.splice(index, 1);
    });
    
    // Find specialists for remaining skills
    for (const skill of neededSkills) {
      const specialist = await this.findSpecialistWithSkill(skill);
      if (specialist && !team.includes(specialist)) {
        team.push(specialist);
      }
    }
    
    // Store team formation
    const formation = {
      id: this.generateTeamId(),
      lead: leadSpecialist.id,
      members: team.map(s => s.id),
      skills: requirements.skills,
      formed: Date.now()
    };
    
    this.teamFormations.set(formation.id, formation);
    
    return team;
  }
  
  /**
   * Register specialist types
   */
  async registerSpecialistTypes() {
    const types = [
      // Technical specialists
      { type: 'backend', class: 'BackendSpecialist', department: 'technical' },
      { type: 'frontend', class: 'FrontendSpecialist', department: 'technical' },
      { type: 'database', class: 'DatabaseSpecialist', department: 'technical' },
      { type: 'devops', class: 'DevOpsSpecialist', department: 'technical' },
      { type: 'security', class: 'SecuritySpecialist', department: 'technical' },
      
      // Experience specialists
      { type: 'ux-research', class: 'UXResearchSpecialist', department: 'experience' },
      { type: 'ui-design', class: 'UIDesignSpecialist', department: 'experience' },
      { type: 'frontend-dev', class: 'FrontendDeveloper', department: 'experience' },
      
      // Strategic specialists
      { type: 'market-research', class: 'MarketResearchSpecialist', department: 'strategic' },
      { type: 'product-manager', class: 'ProductManager', department: 'strategic' },
      { type: 'business-analyst', class: 'BusinessAnalyst', department: 'strategic' }
    ];
    
    for (const typeConfig of types) {
      this.specialistTypes.set(typeConfig.type, {
        ...typeConfig,
        instances: new Set()
      });
    }
  }
  
  /**
   * Setup departments
   */
  async setupDepartments() {
    const departments = [
      {
        id: 'technical',
        name: 'Technical Department',
        focus: 'Backend, infrastructure, and technical implementation'
      },
      {
        id: 'experience',
        name: 'Experience Department',
        focus: 'User experience, design, and frontend'
      },
      {
        id: 'strategic',
        name: 'Strategic Department',
        focus: 'Business strategy, product, and market analysis'
      }
    ];
    
    for (const dept of departments) {
      this.departments.set(dept.id, {
        ...dept,
        specialists: new Set(),
        manager: null,
        metrics: {
          tasksCompleted: 0,
          utilizationRate: 0
        }
      });
    }
  }
  
  /**
   * Initialize specialist pools
   */
  async initializeSpecialistPools() {
    // Create pools for each type
    for (const [type, config] of this.specialistTypes) {
      const pool = [];
      const poolSize = Math.min(this.config.poolSize, 3);
      
      for (let i = 0; i < poolSize; i++) {
        const specialist = new UnifiedSpecialistBase({
          name: `${type}-specialist-${i}`,
          type,
          department: config.department,
          skills: this.getSkillsForType(type)
        });
        
        await this.registerSpecialist(specialist);
        pool.push(specialist);
      }
      
      this.specialistPools.set(type, pool);
    }
  }
  
  /**
   * Setup workflow integration
   */
  async setupWorkflowIntegration() {
    // Register specialist step type
    this.workflowEngine.registerStep('specialist-task', {
      name: 'Specialist Task',
      description: 'Execute task with specialist',
      handler: async (step, context) => {
        const task = {
          ...step.task,
          variables: context.variables
        };
        
        return await this.assignTask(task, step.options);
      }
    });
    
    // Listen to workflow events
    this.workflowEngine.on('step:started', ({ step }) => {
      if (step.type === 'specialist-task') {
        this.emit('workflow:specialist:started', step);
      }
    });
  }
  
  /**
   * Setup pipeline integration
   */
  async setupPipelineIntegration() {
    // Register specialist stage
    this.pipelineManager.registerStage('specialist-process', {
      name: 'Specialist Process',
      description: 'Process data with specialist',
      handler: async (input, stage) => {
        const task = {
          type: 'pipeline-processing',
          data: input,
          specialist: stage.specialist,
          config: stage.config
        };
        
        return await this.assignTask(task);
      }
    });
    
    // Register specialist transformer
    this.pipelineManager.registerTransformer('specialist', async (data, options) => {
      const task = {
        type: 'transform',
        data,
        specialist: options.specialist
      };
      
      const result = await this.assignTask(task);
      return result.data || data;
    });
  }
  
  /**
   * Setup automation integration
   */
  async setupAutomationIntegration() {
    // Register specialist action type
    this.taskAutomation.registerAutomation('specialist-automation', {
      name: 'Specialist Automation',
      action: {
        type: 'specialist',
        handler: async (params, context) => {
          const task = {
            ...params.task,
            context
          };
          
          return await this.assignTask(task, params.options);
        }
      }
    });
  }
  
  /**
   * Analyze task requirements
   */
  async analyzeTaskRequirements(task) {
    const requirements = {
      skills: [],
      expertise: {},
      complexity: 1,
      requiresCollaboration: false,
      estimatedTime: 60000 // 1 minute default
    };
    
    // Extract skills from task
    if (task.requiredSkills) {
      requirements.skills.push(...task.requiredSkills);
    }
    
    // Infer from task type
    if (task.type) {
      const typeSkills = this.getSkillsForType(task.type);
      requirements.skills.push(...typeSkills);
    }
    
    // Assess complexity
    requirements.complexity = this.assessComplexity(task);
    
    // Check collaboration need
    requirements.requiresCollaboration = 
      requirements.skills.length > 3 ||
      requirements.complexity > 7 ||
      task.requiresCollaboration;
    
    return requirements;
  }
  
  /**
   * Find suitable specialists
   */
  async findSuitableSpecialists(requirements) {
    const candidates = [];
    
    for (const [id, specialist] of this.specialists) {
      // Check availability
      const workload = this.workload.get(id);
      if (!workload) {
        // Initialize workload if not exists
        this.workload.set(id, {
          current: 0,
          max: specialist.maxWorkload || 5,
          queue: []
        });
      } else if (workload.current >= workload.max) {
        continue;
      }
      
      // Check skills match
      const skillMatch = requirements.skills.some(skill =>
        specialist.skills.includes(skill)
      );
      
      if (skillMatch) {
        candidates.push(specialist);
      }
    }
    
    return candidates;
  }
  
  /**
   * Select best specialist
   */
  async selectBestSpecialist(candidates, task, options) {
    // Score each candidate
    const scores = candidates.map(specialist => {
      let score = 0;
      
      // Skill match score
      const skillMatch = task.requiredSkills?.filter(skill =>
        specialist.skills.includes(skill)
      ).length || 0;
      score += skillMatch * 10;
      
      // Performance score
      const performance = this.performance.get(specialist.id);
      score += performance.successRate / 10;
      
      // Workload score (lower is better)
      const workload = this.workload.get(specialist.id);
      score += (workload.max - workload.current) * 5;
      
      // Experience score
      score += specialist.experience || 0;
      
      return { specialist, score };
    });
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    // Apply load balancing
    if (this.config.loadBalancing === 'round-robin') {
      // Rotate selection
      const index = this.metrics.tasksAssigned % scores.length;
      return scores[index].specialist;
    }
    
    // Return best scoring
    return scores[0].specialist;
  }
  
  /**
   * Helper methods
   */
  
  getSkillsForType(type) {
    const skillMap = {
      'backend': ['nodejs', 'api', 'database', 'architecture'],
      'frontend': ['react', 'vue', 'css', 'ui'],
      'database': ['sql', 'nosql', 'optimization', 'modeling'],
      'devops': ['ci/cd', 'docker', 'kubernetes', 'monitoring'],
      'security': ['authentication', 'encryption', 'audit', 'compliance'],
      'ux-research': ['user-research', 'usability', 'analytics'],
      'ui-design': ['design', 'figma', 'prototyping'],
      'market-research': ['analysis', 'trends', 'competition'],
      'product-manager': ['planning', 'strategy', 'roadmap'],
      'business-analyst': ['requirements', 'process', 'documentation']
    };
    
    return skillMap[type] || [];
  }
  
  assessComplexity(task) {
    let complexity = 1;
    
    if (task.requirements?.length > 5) complexity += 2;
    if (task.constraints?.length > 3) complexity += 2;
    if (task.dependencies?.length > 0) complexity += 1;
    if (task.priority === 'critical') complexity += 3;
    if (task.deadline) complexity += 1;
    
    return Math.min(10, complexity);
  }
  
  updateWorkload(specialistId, action, task) {
    const workload = this.workload.get(specialistId);
    
    if (action === 'add') {
      workload.current++;
      workload.queue.push(task.id || task);
    } else if (action === 'remove') {
      workload.current = Math.max(0, workload.current - 1);
      const index = workload.queue.indexOf(task.id || task);
      if (index > -1) workload.queue.splice(index, 1);
    }
  }
  
  updatePerformance(specialistId, result) {
    const performance = this.performance.get(specialistId);
    
    performance.tasksCompleted++;
    
    if (result.success) {
      performance.successRate = 
        ((performance.successRate * (performance.tasksCompleted - 1)) + 100) /
        performance.tasksCompleted;
    } else {
      performance.successRate = 
        (performance.successRate * (performance.tasksCompleted - 1)) /
        performance.tasksCompleted;
    }
    
    if (result.duration) {
      performance.averageTime = 
        ((performance.averageTime * (performance.tasksCompleted - 1)) + result.duration) /
        performance.tasksCompleted;
    }
    
    performance.lastActive = Date.now();
  }
  
  async assignToDepartment(specialist, departmentId) {
    const department = this.departments.get(departmentId);
    if (department) {
      department.specialists.add(specialist.id);
      specialist.department = departmentId;
    }
  }
  
  async findSpecialistWithSkill(skill) {
    for (const [id, specialist] of this.specialists) {
      if (specialist.skills.includes(skill)) {
        const workload = this.workload.get(id);
        if (workload.current < workload.max) {
          return specialist;
        }
      }
    }
    return null;
  }
  
  async divideWork(task, team) {
    // Simple division - override for complex logic
    const subtasks = [];
    const workPerSpecialist = Math.ceil(
      (task.requirements?.length || 1) / team.length
    );
    
    for (let i = 0; i < team.length; i++) {
      subtasks.push({
        ...task,
        id: `${task.id}_sub_${i}`,
        requirements: task.requirements?.slice(
          i * workPerSpecialist,
          (i + 1) * workPerSpecialist
        )
      });
    }
    
    return subtasks;
  }
  
  async mergeResults(results, task) {
    return {
      success: results.every(r => r.success),
      task: task.id,
      collaborative: true,
      results,
      timestamp: new Date().toISOString()
    };
  }
  
  setupSpecialistHandlers(specialist) {
    specialist.on('task:started', (data) => {
      this.emit('specialist:task:started', { specialist: specialist.id, ...data });
    });
    
    specialist.on('task:completed', (data) => {
      this.emit('specialist:task:completed', { specialist: specialist.id, ...data });
    });
    
    specialist.on('error', (error) => {
      this.emit('specialist:error', { specialist: specialist.id, error });
    });
  }
  
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  generateTeamId() {
    return `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    return {
      specialists: this.specialists.size,
      departments: this.departments.size,
      activeSessions: Array.from(this.collaborationSessions.values())
        .filter(s => s.status === 'active').length,
      metrics: this.getMetrics()
    };
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    // Calculate utilization
    let totalCapacity = 0;
    let totalUsed = 0;
    
    for (const [id, workload] of this.workload) {
      totalCapacity += workload.max;
      totalUsed += workload.current;
    }
    
    this.metrics.utilizationRate = totalCapacity > 0 ? 
      (totalUsed / totalCapacity) * 100 : 0;
    
    return {
      ...this.metrics,
      specialists: this.specialists.size,
      availableSpecialists: Array.from(this.workload.values())
        .filter(w => w.current < w.max).length,
      activeTasks: totalUsed,
      collaborationSessions: this.collaborationSessions.size
    };
  }
  
  /**
   * Destroy the integration
   */
  destroy() {
    this.removeAllListeners();
    
    // Destroy all specialists
    for (const specialist of this.specialists.values()) {
      specialist.destroy();
    }
    
    this.specialists.clear();
    this.specialistTypes.clear();
    this.specialistPools.clear();
    
    logger.info('💥 Specialist Integration destroyed');
  }
}

// Singleton instance
let instance = null;

module.exports = {
  SpecialistIntegration,
  getInstance: (config) => {
    if (!instance) {
      instance = new SpecialistIntegration(config);
    }
    return instance;
  }
};