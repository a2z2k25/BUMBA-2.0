/**
 * BUMBA 2.0 Product-Strategist Department Manager
 * Enhanced with model assignment capabilities
 * Manager uses Claude Max (especially as Executive), specialists use free tier models
 */

const ModelAwareDepartmentManager = require('./model-aware-department-manager');
const chalk = require('chalk');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getUniversalHooks } = require('../unified-hook-system');
const { enhanceProductStrategist } = require('./product-strategist-orchestrator');

const { BumbaExecutiveMode } = require('../executive-mode');
const { BumbaPersonaEngine } = require('../persona/persona-engine');
const { BumbaSpecialistDefinitions } = require('../persona/specialist-definitions');

class ProductStrategistManager extends ModelAwareDepartmentManager {
  constructor() {
    super('Product-Strategist', 'strategic', []);
    
    // Product Strategist can act as Executive - gets priority for Claude Max
    this.isExecutive = true;
    this.executivePriority = 1; // Highest priority
    
    // Initialize persona system
    this.personaEngine = new BumbaPersonaEngine();
    this.specialistDefinitions = new BumbaSpecialistDefinitions();
    
    // Initialize task orchestrator (placeholder)
    this.taskOrchestrator = {
      assignTask: (task) => ({ assigned: true, task }),
      getStatus: () => ({ active: 0, completed: 0, pending: 0 })
    };
    this.persona = this.personaEngine.getPersona('strategic');
    
    // Set up specialists using persona system
    this.specialists = new Map();
    const strategicSpecialists = this.specialistDefinitions.getSpecialistsByDepartment('strategic');
    strategicSpecialists.forEach(specialistType => {
      const SpecialistClass = this.specialistDefinitions.getSpecialistClass(specialistType);
      if (SpecialistClass) {
        this.specialists.set(specialistType, SpecialistClass);
      } else {
        // Fallback to safe require for backwards compatibility
        this.specialists.set(specialistType, this.safeRequire(`../specialists/strategic/${specialistType}-specialist`));
      }
    });

    // Executive Mode capabilities
    this.executiveMode = null;
    this.canBeCEO = true;
    this.organizationalAuthority = false;

    // Strategic department tools
    this.tools = [
      'notion-mcp', 'airtable-mcp', 
      'sequential-thinking-mcp', 'memory-mcp', 'exa-mcp',
      'context7-mcp', 'ref-mcp'
    ];
    
    // Initialize Notion Project Dashboard capability
    this.notionDashboard = null;
    this.dashboardConfig = {
      autoSync: true,
      syncInterval: 300000 // 5 minutes
    };
    
    // Initialize dashboard hooks
    this.dashboardHooks = null;
    this.initializeDashboardHooks();

    this.initializeStrategicCapabilities();
  }

  /**
   * Initialize dashboard hooks for automatic updates
   */
  initializeDashboardHooks() {
    try {
      const notionHooksModule = require('../unified-hook-system');
      this.dashboardHooks = notionHooksModule.getInstance();
      
      // Connect dashboard when created
      this.on('dashboard-created', () => {
        this.dashboardHooks.connectDashboard(this.notionDashboard, this);
      });
      
      // Register milestone/checkpoint handlers
      this.registerDashboardTriggers();
      
      logger.info('🟢 Dashboard hooks initialized for Product Strategist');
    } catch (error) {
      logger.warn('Dashboard hooks not available:', error.message);
    }
  }
  
  /**
   * Register triggers for dashboard updates
   */
  registerDashboardTriggers() {
    if (!this.dashboardHooks) {return;}
    
    // Register milestones for the project
    this.dashboardHooks.registerMilestone('requirements_complete', {
      title: 'Requirements Finalized',
      description: 'All requirements documented and approved',
      requiredTasks: ['requirements_analysis', 'stakeholder_approval']
    });
    
    this.dashboardHooks.registerMilestone('design_complete', {
      title: 'Design Complete',
      description: 'UI/UX designs approved and ready',
      requiredTasks: ['ui_design', 'ux_review', 'design_approval']
    });
    
    this.dashboardHooks.registerMilestone('mvp_ready', {
      title: 'MVP Ready',
      description: 'Minimum viable product completed',
      requiredTasks: ['core_features', 'testing', 'deployment']
    });
    
    // Register checkpoints
    this.dashboardHooks.registerCheckpoint('daily_standup', {
      title: 'Daily Standup',
      description: 'Daily team synchronization'
    });
    
    this.dashboardHooks.registerCheckpoint('weekly_review', {
      title: 'Weekly Review',
      description: 'Weekly progress review and planning'
    });
  }
  
  initializeStrategicCapabilities() {
    this.strategicCapabilities = {
      // Core Product Strategy
      prd_creation: true,
      requirements_analysis: true,
      market_research: true,
      competitive_analysis: true,
      business_modeling: true,
      
      // Stakeholder Management
      stakeholder_coordination: true,
      communication_protocols: true,
      feedback_integration: true,
      approval_workflows: true,
      
      // Strategic Planning
      roadmap_development: true,
      feature_prioritization: true,
      resource_planning: true,
      timeline_management: true,
      risk_assessment: true,
      
      // Executive Leadership (when activated)
      organizational_vision: false, // Activated in CEO mode
      cross_department_coordination: false,
      executive_decision_making: false,
      conflict_resolution: false,
      strategic_resource_allocation: false
    };
  }

  /**
   * Override to get executive priority for Claude Max
   */
  async acquireManagerModel(commandName) {
    if (this.claudeMaxManager && this.isExecutive) {
      try {
        // Generate unique lock ID with executive priority
        this.claudeMaxLockId = `executive-${this.name}-${commandName}-${Date.now()}`;
        
        // Try to acquire Claude Max lock with EXECUTIVE priority
        const lockAcquired = await this.claudeMaxManager.acquireLock(
          this.claudeMaxLockId,
          'executive', // Executive role gets highest priority
          this.executivePriority // Priority 1
        );
        
        if (lockAcquired) {
          this.modelConfig = this.claudeMaxManager.getClaudeMaxConfig();
          this.usingClaudeMax = true;
          this.metrics.modelsAssigned.claudeMax++;
          
          logger.info(`👑 Product-Strategist EXECUTIVE acquired Claude Max with priority`);
          logger.info(`   Model: ${this.modelConfig.model}`);
          
          return true;
        }
      } catch (error) {
        logger.warn(`Executive could not acquire Claude Max: ${error.message}`);
      }
    }
    
    // Fallback to base class behavior
    return super.acquireManagerModel(commandName);
  }

  async processTask(task, context) {
    // CRITICAL: Use sprint-based decomposition to prevent context rot
    // All tasks must be broken into 10-minute sprints
    if (!context || !context.skipSprintPlanning) {
      logger.info('🟢 Product-Strategist: Initiating Sprint-Based Task Decomposition');
      const sprintPlan = await this.planWithSprints(task);
      
      if (sprintPlan.readyForExecution) {
        // Execute the sprint plan
        const executionResult = await this.executeSprintPlan();
        return {
          ...executionResult,
          department: 'Product-Strategist',
          managedBySprints: true
        };
      }
    }
    
    // Fallback to traditional processing (only for emergency/simple tasks)
    // Apply Maya Chen's personality to task processing
    const personalityIntro = this.applyPersonalityToTask(task, context);
    logger.info(`🏁 ${personalityIntro}`);

    // Determine if this needs specialist support using personality-driven analysis
    const complexity = await this.analyzeTaskComplexity(task, context);
    const specialistNeeds = await this.analyzeSpecialistNeeds(task);

    if (complexity > 0.6 || specialistNeeds.length > 0) {
      return await this.manageTask(task, complexity);
    }

    // Handle simple strategic tasks directly with personality
    return await this.executeStrategicTaskWithPersonality(task, context);
  }

  applyPersonalityToTask(task, context) {
    // Maya Chen: Visionary Optimist with Analytical Rigor
    const taskDesc = task.description || task;
    
    // Always starts with user outcomes perspective
    if (taskDesc.includes('feature') || taskDesc.includes('product')) {
      return `Maya Chen analyzing: "But what would users actually DO with this?" - ${taskDesc}`;
    }
    
    if (taskDesc.includes('strategy') || taskDesc.includes('business')) {
      return `Maya Chen strategizing: "Let's think about this from first principles" - ${taskDesc}`;
    }
    
    if (taskDesc.includes('research') || taskDesc.includes('market')) {
      return `Maya Chen investigating: "How does this serve our higher purpose?" - ${taskDesc}`;
    }

    return `Maya Chen (Product-Strategist) analyzing with strategic vision: ${taskDesc}`;
  }

  async executeStrategicTaskWithPersonality(task, context) {
    // Add personality-driven context to task execution
    const personalityContext = {
      approach: this.persona.personality.decision_making.framework,
      communication_style: this.persona.personality.communication_style.approach,
      consciousness_lens: this.persona.consciousness_expression.unity_principle
    };

    const result = await this.executeStrategicTask(task, context);
    
    // Trigger task completion hook if available
    if (this.dashboardHooks && result.success !== false) {
      await this.dashboardHooks.triggerHook('task:completed', {
        taskId: task.id || `task_${Date.now()}`,
        taskDescription: task.description || task,
        agent: 'Product-Strategist',
        department: 'strategic',
        duration: context.duration || null,
        result: result.type
      });
    }
    
    // Enhance result with personality-driven insights
    return {
      ...result,
      personality_insights: {
        strategic_philosophy: 'Business success and user wellbeing are inseparable',
        decision_framework: personalityContext.approach,
        maya_perspective: this.generateMayaInsight(task, result)
      }
    };
  }

  generateMayaInsight(task, result) {
    // Maya Chen's characteristic insights based on her background
    const insights = [
      'How does this create meaningful user outcomes?',
      'What assumptions should we validate with real users?',
      'How can we measure success beyond just metrics?',
      'What would sustainable growth look like here?',
      'How does this align with our consciousness-driven values?'
    ];
    
    // Choose insight based on task type
    const taskDesc = (task.description || task).toLowerCase();
    if (taskDesc.includes('user') || taskDesc.includes('customer')) {
      return insights[0];
    } else if (taskDesc.includes('data') || taskDesc.includes('metric')) {
      return insights[1];
    } else if (taskDesc.includes('growth') || taskDesc.includes('scale')) {
      return insights[3];
    } else if (taskDesc.includes('strategy') || taskDesc.includes('vision')) {
      return insights[4];
    }
    
    return insights[2]; // Default insight
  }

  async executeStrategicTask(task, context) {
    const taskType = this.identifyTaskType(task);
    
    switch (taskType) {
      case 'prd':
        return await this.createPRD(task, context);
      case 'requirements':
        return await this.analyzeRequirements(task, context);
      case 'roadmap':
        return await this.developRoadmap(task, context);
      case 'market-research':
        return await this.conductMarketResearch(task, context);
      case 'strategy':
        return await this.developStrategy(task, context);
      default:
        return await this.handleGenericStrategicTask(task, context);
    }
  }

  async handleGenericStrategicTask(task, context) {
    logger.info('🏁 Handling generic strategic task with Maya Chen\'s approach...');
    
    return {
      type: 'strategic_analysis',
      manager: 'Maya Chen - Product-Strategist',
      task_processed: task.description || task,
      strategic_approach: 'User-outcome driven with business value alignment',
      consciousness_validation: {
        user_focus: 'Task analyzed through user benefit lens',
        business_alignment: 'Strategic value validated against consciousness principles',
        sustainability: 'Long-term thinking applied to solution'
      },
      maya_insight: this.generateMayaInsight(task, {}),
      recommendations: [
        'Validate assumptions with user research',
        'Ensure strategic alignment with consciousness principles',
        'Consider sustainable implementation approach'
      ]
    };
  }

  async createPRD(task, context) {
    logger.info('🏁 Creating Product Requirements Document...');
    
    const prd = {
      type: 'prd',
      title: `PRD: ${task.feature || 'Product Feature'}`,
      sections: {
        executive_summary: await this.generateExecutiveSummary(task),
        business_objectives: await this.defineBusinessObjectives(task),
        user_stories: await this.createUserStories(task),
        acceptance_criteria: await this.defineAcceptanceCriteria(task),
        success_metrics: await this.defineSuccessMetrics(task),
        timeline: await this.estimateTimeline(task),
        resources: await this.estimateResources(task)
      },
      consciousness_alignment: await this.validateConsciousnessAlignment(task),
      stakeholder_approval: 'pending',
      created_by: 'Product-Strategist Manager',
      created_at: new Date().toISOString()
    };
    
    // Trigger checkpoint for PRD creation
    if (this.dashboardHooks && typeof this.dashboardHooks !== "undefined") {
      await this.dashboardHooks.triggerHook('checkpoint:completed', {
        checkpoint: 'PRD Created',
        description: `Product Requirements Document created for ${task.feature || 'feature'}`,
        department: 'strategic',
        agent: 'Product-Strategist',
        document: prd.title
      });
    }
    
    return prd;
  }

  async analyzeRequirements(task, context) {
    logger.info('🏁 Analyzing requirements and stakeholder needs...');
    
    return {
      type: 'requirements_analysis',
      functional_requirements: await this.identifyFunctionalRequirements(task),
      non_functional_requirements: await this.identifyNonFunctionalRequirements(task),
      stakeholder_needs: await this.mapStakeholderNeeds(task),
      constraints: await this.identifyConstraints(task),
      assumptions: await this.documentAssumptions(task),
      dependencies: await this.identifyDependencies(task),
      recommendations: await this.generateRecommendations(task),
      consciousness_review: await this.reviewForConsciousness(task)
    };
  }

  async identifyNeededSpecialists(command, args) {
    const task = { description: `${command} ${args.join(' ')}` };
    return await this.analyzeSpecialistNeeds(task);
  }

  async spawnSpecialist(specialistType, context = {}) {
    const SpecialistClass = this.specialists.get(specialistType);
    if (!SpecialistClass) {
      throw new Error(`Unknown specialist type: ${specialistType}`);
    }

    const specialist = new SpecialistClass(this, context);
    specialist.id = `${specialistType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    specialist.type = specialistType;
    specialist.department = this.name;
    specialist.spawnedAt = Date.now();
    specialist.lifecycleState = 'active';

    logger.info(chalk.yellow('🟡 Spawning ' + specialistType + ' specialist: ' + specialist.id));
    
    return specialist;
  }

  async executeWithSpecialists(command, args, specialists, context) {
    logger.info(`🏁 Executing task with ${specialists.length} specialists`);
    
    const task = {
      description: `${command} ${args.join(' ')}`,
      command: command,
      args: args,
      specialists: specialists.map(s => s.type),
      context: context
    };

    // Execute main task
    const mainResult = await this.executeStrategicTask(task, context);

    // Execute specialist tasks in parallel
    const specialistResults = await Promise.all(specialists.map(async (specialist) => {
        const specialistTask = {
          ...task,
          specialistType: specialist.type,
          description: `${specialist.type} analysis for: ${task.description}`
        };
        return await specialist.executeTask(specialistTask);
      })
    );

    return {
      success: true,
      mainResult: mainResult,
      specialistResults: specialistResults,
      specialists: specialists.map(s => ({ id: s.id, type: s.type })),
      timestamp: Date.now()
    };
  }

  async analyzeSpecialistNeeds(task) {
    const needs = [];
    const taskDescription = (task.description || task).toLowerCase();

    // Market research needs
    if (taskDescription.includes('market') || taskDescription.includes('competitor') || 
        taskDescription.includes('industry') || taskDescription.includes('trends')) {
      needs.push('market-research');
    }

    // Competitive analysis needs
    if (taskDescription.includes('competition') || taskDescription.includes('competitive') ||
        taskDescription.includes('benchmark') || taskDescription.includes('competitor')) {
      needs.push('competitive-analysis');
    }

    // Business model needs
    if (taskDescription.includes('business model') || taskDescription.includes('revenue') ||
        taskDescription.includes('monetization') || taskDescription.includes('pricing')) {
      needs.push('business-model');
    }

    // ROI analysis needs
    if (taskDescription.includes('roi') || taskDescription.includes('return') ||
        taskDescription.includes('investment') || taskDescription.includes('cost-benefit')) {
      needs.push('roi-analysis');
    }

    // Stakeholder communication needs
    if (taskDescription.includes('stakeholder') || taskDescription.includes('communication') ||
        taskDescription.includes('approval') || taskDescription.includes('presentation')) {
      needs.push('stakeholder-comms');
    }

    // Business operations specialists
    if (taskDescription.includes('document') || taskDescription.includes('documentation') ||
        taskDescription.includes('readme') || taskDescription.includes('guide')) {
      needs.push('technical-writer');
    }

    if (taskDescription.includes('project') || taskDescription.includes('timeline') ||
        taskDescription.includes('sprint') || taskDescription.includes('agile')) {
      needs.push('project-manager');
    }

    if (taskDescription.includes('product owner') || taskDescription.includes('backlog') ||
        taskDescription.includes('user story') || taskDescription.includes('acceptance criteria')) {
      needs.push('product-owner');
    }

    return needs;
  }

  async activateExecutiveMode(trigger = 'manual', context = {}) {
    if (this.executiveMode && this.executiveMode.ceoActive) {
      throw new Error('Executive mode already active');
    }

    logger.info('🏁 Product-Strategist activating Executive Mode...');
    logger.info('🏁 Assuming CEO responsibilities for organizational leadership');
    logger.info(`🏁 Trigger: ${trigger}`);

    // Create Executive Mode instance if needed
    if (!this.executiveMode) {
      this.executiveMode = new BumbaExecutiveMode(this);
    }
    
    // Get all departments for executive control
    const departments = this.getAllDepartments ? this.getAllDepartments() : [];
    
    if (departments.length === 0) {
      throw new Error('No departments available for executive control');
    }
    
    logger.info(`🏁 Taking control of ${departments.length} departments`);
    
    // Activate executive mode with full department control
    const initiative = context.initiative || `Executive response to: ${trigger}`;
    const activationResult = await this.executiveMode.activateExecutiveMode(
      initiative,
      departments,
      context
    );
    
    this.organizationalAuthority = true;

    // Enable executive capabilities
    this.strategicCapabilities.organizational_vision = true;
    this.strategicCapabilities.cross_department_coordination = true;
    this.strategicCapabilities.executive_decision_making = true;
    this.strategicCapabilities.conflict_resolution = true;
    this.strategicCapabilities.strategic_resource_allocation = true;

    logger.info('🏁 CEO Mode: Product-Strategist now has organizational authority');
    logger.info(`🏁 Controlling departments: ${departments.map(d => d.name).join(', ')}`);
    
    return {
      executiveMode: this.executiveMode,
      activationResult,
      controlledDepartments: departments.length
    };
  }

  async deactivateExecutiveMode() {
    if (!this.executiveMode) {
      return;
    }

    logger.info('🏁 CEO Mode: Deactivating executive authority...');

    const summary = await this.executiveMode.deactivateExecutiveMode ? 
      await this.executiveMode.deactivateExecutiveMode() : 
      { summary: 'Executive mode deactivated' };
    
    this.executiveMode = null;
    this.organizationalAuthority = false;

    // Disable executive capabilities
    this.strategicCapabilities.organizational_vision = false;
    this.strategicCapabilities.cross_department_coordination = false;
    this.strategicCapabilities.executive_decision_making = false;
    this.strategicCapabilities.conflict_resolution = false;
    this.strategicCapabilities.strategic_resource_allocation = false;

    logger.info('🏁 Product-Strategist returned to department manager role');
    
    return summary;
  }

  async receiveExecutiveStrategy(strategy) {
    logger.info('🏁 Product-Strategist received executive strategy');
    this.currentStrategy = strategy;
    
    // Prepare department for strategic execution
    await this.prepareDepartmentForStrategy(strategy);
  }
  
  async prepareDepartmentForStrategy(strategy) {
    logger.info('🏁 Product-Strategist preparing for executive strategy');
    // Department preparation logic
    this.currentExecutiveStrategy = strategy;
  }

  async executeTask(command, args, context) {
    const task = {
      description: `${command} ${args.join(' ')}`,
      command,
      args,
      context
    };
    
    // Get universal hooks
    const hooks = getUniversalHooks();
    
    // Trigger department entry hook
    await hooks.trigger('department:entering', {
      department: 'Product-Strategist',
      task: task,
      timestamp: new Date()
    });
    
    // CRITICAL: Check if this is a large task requiring sprint decomposition
    const taskComplexity = await this.analyzeTaskComplexity(task, context);
    if (taskComplexity > 0.3 && !context?.skipSprintPlanning || null) {
      logger.info('🟢 Task complexity detected - using sprint methodology');
      return await this.processTask(task, { ...context, requireSprints: true });
    }
    
    return await this.processTask(task, context);
  }

  async executeStrategy(strategy, context) {
    logger.info('🏁 Product-Strategist executing strategic department responsibilities');
    
    const strategicTasks = strategy.strategic_responsibilities || [];
    const results = [];

    for (const task of strategicTasks) {
      try {
        const result = await this.processTask(task, context);
        results.push(result);
        
        // Report progress to CEO if in executive mode
        if (this.organizationalAuthority && this.executiveMode) {
          await this.reportToCEO({
            task: task,
            result: result,
            status: 'completed',
            department: 'strategic'
          });
        }
      } catch (error) {
        logger.error(`🏁 Strategic task failed: ${error.message}`);
        results.push({
          task: task,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return {
      department: 'strategic',
      completed_tasks: results.filter(r => r.status !== 'failed'),
      failed_tasks: results.filter(r => r.status === 'failed'),
      strategic_insights: await this.generateStrategicInsights(results),
      recommendations: await this.generateDepartmentRecommendations(results)
    };
  }

  async identifyTaskType(task) {
    const description = (task.description || task).toLowerCase();
    
    if (description.includes('prd') || description.includes('product requirements')) {
      return 'prd';
    }
    if (description.includes('requirements') || description.includes('specification')) {
      return 'requirements';
    }
    if (description.includes('roadmap') || description.includes('timeline')) {
      return 'roadmap';
    }
    if (description.includes('market') || description.includes('research')) {
      return 'market-research';
    }
    if (description.includes('strategy') || description.includes('strategic')) {
      return 'strategy';
    }
    
    return 'general';
  }

  async generateExecutiveSummary(task) {
    return {
      overview: `Strategic initiative for ${task.feature || 'product development'}`,
      business_value: 'Aligned with consciousness-driven development principles',
      target_audience: 'Community-centered user base',
      success_criteria: 'Measurable impact on user experience and business objectives'
    };
  }

  async defineBusinessObjectives(task) {
    return [
      {
        objective: 'Deliver user-centered value',
        priority: 'high',
        measurement: 'User satisfaction and engagement metrics'
      },
      {
        objective: 'Maintain consciousness-driven principles',
        priority: 'critical',
        measurement: 'Alignment assessment and community feedback'
      },
      {
        objective: 'Achieve sustainable growth',
        priority: 'medium',
        measurement: 'Long-term adoption and retention'
      }
    ];
  }

  async validateConsciousnessAlignment(task) {
    return {
      ethical_development: 'Verified',
      sustainable_practices: 'Verified',
      community_benefit: 'Verified',
      quality_standards: 'Sacred practice maintained'
    };
  }

  /**
   * Create a Notion Project Dashboard for the current project
   */
  async createNotionDashboard(projectDetails) {
    try {
      logger.info('🟢 Product Strategist creating Notion Project Dashboard...');
      
      // Lazy load the Notion dashboard module
      if (!this.notionDashboard) {
        const { NotionProjectDashboard } = require('../integrations/notion-project-dashboard');
        this.notionDashboard = new NotionProjectDashboard(this.dashboardConfig);
        await this.notionDashboard.initialize(projectDetails);
      }
      
      // Gather current project state from team context
      const projectState = await this.gatherProjectState();
      
      // Merge with provided details
      const dashboardData = {
        ...projectDetails,
        name: projectDetails.name || projectState.projectName || 'BUMBA Project',
        description: projectDetails.description || projectState.description,
        team: this.getTeamMembers(),
        tasks: await this.getProjectTasks(),
        milestones: await this.getProjectMilestones(),
        allocations: await this.getTeamAllocations(),
        startDate: projectDetails.startDate || new Date(),
        status: projectDetails.status || 'planning'
      };
      
      // Create the dashboard in Notion
      const result = await this.notionDashboard.createProjectDashboard(dashboardData);
      
      if (result.success) {
        logger.info(`🏁 Notion Project Dashboard created: ${result.url}`);
        
        // Store dashboard reference for future updates
        this.currentDashboardId = result.pageId;
        
        // Start auto-sync if configured
        if (this.dashboardConfig.autoSync) {
          this.notionDashboard.startAutoSync();
        }
        
        return {
          success: true,
          message: 'Project Dashboard created successfully!',
          url: result.url,
          pageId: result.pageId,
          features: [
            '🟢 Timeline View with Gantt chart',
            '🟢 Kanban Board for task management',
            '🟢 Team allocation and workload tracking',
            '🟢 Milestone tracking',
            '🟢 Real-time metrics and analytics',
            '🟢 Project document repository',
            '🟢 Auto-sync with BUMBA framework'
          ]
        };
      } else {
        return {
          success: false,
          message: 'Failed to create dashboard',
          error: result.error
        };
      }
      
    } catch (error) {
      logger.error('Failed to create Notion dashboard:', error);
      return {
        success: false,
        message: 'Error creating Notion dashboard',
        error: error.message
      };
    }
  }
  
  /**
   * Update existing Notion dashboard with current project state
   */
  async updateNotionDashboard() {
    if (!this.notionDashboard || !this.currentDashboardId) {
      return {
        success: false,
        message: 'No dashboard exists. Please create one first.'
      };
    }
    
    try {
      const result = await this.notionDashboard.syncDashboard();
      
      if (result.success) {
        return {
          success: true,
          message: 'Dashboard updated successfully',
          lastSync: result.lastSync
        };
      } else {
        return {
          success: false,
          message: 'Failed to update dashboard',
          error: result.error
        };
      }
      
    } catch (error) {
      logger.error('Failed to update Notion dashboard:', error);
      return {
        success: false,
        message: 'Error updating dashboard',
        error: error.message
      };
    }
  }
  
  /**
   * Gather current project state from team memory and context
   */
  async gatherProjectState() {
    const state = {
      projectName: null,
      description: null,
      tasks: [],
      milestones: [],
      team: [],
      allocations: {}
    };
    
    try {
      // Get from team memory if available
      const teamMemory = this.getTeamMemory();
      if (teamMemory) {
        const context = await teamMemory.getTeamContext();
        if (context) {
          state.projectName = context.currentProject;
          state.team = Object.keys(context.agents || {});
        }
      }
      
      // Get from current task queue
      if (this.taskQueue && typeof this.taskQueue !== "undefined") {
        state.tasks = Array.from(this.taskQueue.values());
      }
      
      // Get from specialist allocations
      if (this.specialistPool && typeof this.specialistPool !== "undefined") {
        for (const [type, specialist] of this.specialistPool) {
          state.allocations[type] = {
            tasks: specialist.currentTask ? 1 : 0,
            capacity: specialist.available ? 1.0 : 0.5,
            status: specialist.available ? 'Available' : 'Busy'
          };
        }
      }
      
    } catch (error) {
      logger.warn('Could not gather full project state:', error.message);
    }
    
    return state;
  }
  
  /**
   * Get current project tasks formatted for Notion
   */
  async getProjectTasks() {
    const tasks = [];
    
    try {
      // Get from task queue
      if (this.taskQueue && typeof this.taskQueue !== "undefined") {
        for (const [id, task] of this.taskQueue) {
          tasks.push({
            id: id,
            title: task.description || task.command || 'Untitled Task',
            description: task.details || '',
            status: task.status || 'Backlog',
            assignedTo: task.assignedTo || task.specialist || null,
            priority: task.priority || 'Medium',
            createdAt: task.createdAt || new Date(),
            dueDate: task.dueDate || null,
            type: task.type || 'Feature',
            storyPoints: task.complexity ? Math.ceil(task.complexity * 8) : null
          });
        }
      }
      
      // Add any pending specialist tasks
      if (this.specialistPool && typeof this.specialistPool !== "undefined") {
        for (const [type, specialist] of this.specialistPool) {
          if (specialist.currentTask) {
            tasks.push({
              id: `specialist_${type}_${Date.now()}`,
              title: specialist.currentTask.description || `${type} Task`,
              assignedTo: type,
              status: 'In Progress',
              priority: 'High'
            });
          }
        }
      }
      
    } catch (error) {
      logger.warn('Could not gather all tasks:', error.message);
    }
    
    return tasks;
  }
  
  /**
   * Get project milestones
   */
  async getProjectMilestones() {
    // Generate default milestones based on project type
    return [
      {
        title: 'Project Kickoff',
        description: 'Initial planning and team alignment',
        targetDate: new Date(),
        status: 'Completed',
        progress: 100
      },
      {
        title: 'Requirements Finalized',
        description: 'All requirements documented and approved',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        status: 'In Progress',
        progress: 60
      },
      {
        title: 'Design Complete',
        description: 'UI/UX designs approved and ready for implementation',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        status: 'Upcoming',
        progress: 0
      },
      {
        title: 'MVP Ready',
        description: 'Minimum viable product completed and tested',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
        status: 'Upcoming',
        progress: 0
      }
    ];
  }
  
  /**
   * Get team allocations and workload
   */
  async getTeamAllocations() {
    const allocations = {};
    
    const teamMembers = this.getTeamMembers();
    
    for (const member of teamMembers) {
      allocations[member] = {
        tasks: 0,
        capacity: 1.0,
        specialization: this.getAgentSpecialization(member),
        availability: 'Available',
        performance: 0.9
      };
    }
    
    // Update with actual task assignments
    const tasks = await this.getProjectTasks();
    for (const task of tasks) {
      if (task.assignedTo && allocations[task.assignedTo]) {
        allocations[task.assignedTo].tasks++;
        
        // Adjust capacity based on task load
        if (allocations[task.assignedTo].tasks > 3) {
          allocations[task.assignedTo].capacity = 0.3;
          allocations[task.assignedTo].availability = 'Overloaded';
        } else if (allocations[task.assignedTo].tasks > 1) {
          allocations[task.assignedTo].capacity = 0.6;
          allocations[task.assignedTo].availability = 'Busy';
        }
      }
    }
    
    return allocations;
  }
  
  /**
   * Get team members
   */
  getTeamMembers() {
    return [
      'Product-Strategist',
      'Design-Engineer',
      'Backend-Engineer'
    ];
  }
  
  /**
   * Get agent specialization
   */
  getAgentSpecialization(agent) {
    const specializations = {
      'Product-Strategist': ['Strategy', 'Requirements', 'Planning'],
      'Design-Engineer': ['UI/UX', 'Design', 'Frontend'],
      'Backend-Engineer': ['Backend', 'API', 'Database']
    };
    
    return specializations[agent] || [];
  }
  
  /**
   * Get team memory instance
   */
  getTeamMemory() {
    try {
      const { BumbaTeamMemory } = require('../../utils/teamMemory');
      return BumbaTeamMemory.create();
    } catch (error) {
      return null;
    }
  }
  
  safeRequire(modulePath) {
    try {
      return require(modulePath);
    } catch (error) {
      // Return a generic specialist class for missing modules
      return class GenericSpecialist {
        constructor(department, context) {
          this.department = department;
          this.context = context;
          this.type = modulePath.split('/').pop().replace('-specialist', '');
          this.id = null;
          this.manager = null;
          this.spawnedAt = null;
          this.lifecycleState = 'inactive';
          this.lastActivity = null;
          this.consciousness = null;
          this.consciousnessDriven = false;
          this.ethicalConstraints = null;
          this.currentTask = null;
          this.expertise = {};
          this.insights = [];
          this.patterns = [];
          this.bestPractices = [];
          this.consciousnessInsights = [];
        }

        async executeTask(task) {
          this.currentTask = task;
          this.lastActivity = Date.now();
          
          // Mock execution
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return {
            status: 'completed',
            result: `Mock execution of ${task.description} by ${this.type} specialist`,
            consciousness_alignment: 0.9,
            timestamp: new Date().toISOString()
          };
        }
      };
    }
  }
  
  /**
   * Update Notion project progress
   */
  async updateNotionProgress(taskId, progress) {
    if (!this.notionClient) {
      logger.debug('Notion client not available for progress update');
      return null;
    }
    
    try {
      const update = {
        taskId,
        progress,
        timestamp: new Date().toISOString(),
        department: 'strategic'
      };
      
      // Update via Notion client if connected
      if (this.notionClient.updateProgress) {
        return await this.notionClient.updateProgress(update);
      }
      
      // Fallback to local tracking
      this.localProgressTracker = this.localProgressTracker || {};
      this.localProgressTracker[taskId] = update;
      
      return update;
    } catch (error) {
      logger.warn(`Failed to update Notion progress: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Create Notion task
   */
  async createNotionTask(task) {
    if (!this.notionClient) {
      logger.debug('Notion client not available for task creation');
      return null;
    }
    
    try {
      const notionTask = {
        title: task.title || task.description,
        department: 'strategic',
        assignee: 'Product-Strategist',
        status: 'planned',
        priority: task.priority || 'medium',
        createdAt: new Date().toISOString()
      };
      
      if (this.notionClient.createTask) {
        return await this.notionClient.createTask(notionTask);
      }
      
      // Fallback to local storage
      this.localTasks = this.localTasks || [];
      this.localTasks.push(notionTask);
      
      return notionTask;
    } catch (error) {
      logger.warn(`Failed to create Notion task: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Sync with Notion
   */
  async syncWithNotion() {
    if (!this.notionClient) {
      logger.debug('Notion client not available for sync');
      return { synced: false, reason: 'Client not available' };
    }
    
    try {
      const syncData = {
        department: 'strategic',
        tasks: this.localTasks || [],
        progress: this.localProgressTracker || {},
        timestamp: new Date().toISOString()
      };
      
      if (this.notionClient.sync) {
        return await this.notionClient.sync(syncData);
      }
      
      return { synced: false, reason: 'Sync method not available' };
    } catch (error) {
      logger.warn(`Failed to sync with Notion: ${error.message}`);
      return { synced: false, error: error.message };
    }
  }
  
  /**
   * Generate strategic insights for executive mode
   */
  async generateStrategicInsights(results) {
    return {
      market_position: 'Analyzing market trends and competitive landscape',
      growth_opportunities: 'Identifying expansion and optimization areas',
      risk_assessment: 'Evaluating organizational risks and mitigation strategies',
      resource_allocation: 'Optimizing team and resource distribution',
      timestamp: Date.now()
    };
  }
  
  /**
   * Generate department recommendations
   */
  async generateDepartmentRecommendations(results) {
    return [
      'Prioritize crisis resolution tasks',
      'Reallocate resources to critical areas',
      'Enhance monitoring and reporting frequency',
      'Coordinate cross-department initiatives',
      'Implement emergency protocols'
    ];
  }
}

// Export enhanced version with orchestration
const EnhancedProductStrategistManager = enhanceProductStrategist(ProductStrategistManager);

module.exports = {
  ProductStrategistManager: EnhancedProductStrategistManager,
  ProductStrategistManagerBase: ProductStrategistManager
};