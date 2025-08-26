/**
 * BUMBA Orchestration System - Main Integration Module
 * Brings together all orchestration components
 * @module orchestration
 */

const { logger } = require('../logging/bumba-logger');

// Core orchestration components
const taskOrchestratorModule = require('./task-orchestrator');
const { TaskOrchestrator } = taskOrchestratorModule;
const notionClientModule = require('./notion-client');
const { NotionOrchestrationClient } = notionClientModule;
const dependencyManagerModule = require('./dependency-manager');
const { DependencyManager } = dependencyManagerModule;
const hookSystemModule = require('./orchestration-hooks');
const { OrchestrationHookSystem } = hookSystemModule;

// Agent and task systems
const {
  AgentTaskClaimingSystem,
  DependencyEnforcementSystem,
  TimelineOptimizer,
  KnowledgeSharingSystem,
  ParallelExecutionCoordinator
} = require('./agent-task-system');

// Monitoring and quality systems
const {
  ProgressTrackingDashboard,
  QualityAssuranceSystem,
  MilestoneTrackingSystem,
  NotificationSystem,
  ErrorRecoverySystem
} = require('./project-monitoring');

// Product-Strategist enhancements
const { enhanceProductStrategist } = require('../departments/product-strategist-orchestrator');

/**
 * Main Orchestration System
 */
class BumbaOrchestrationSystem {
  constructor(config = {}) {
    this.config = {
      notion: config.notion || {},
      maxAgents: config.maxAgents || 10,
      enableQualityChecks: config.enableQualityChecks !== false,
      enableMilestones: config.enableMilestones !== false,
      enableNotifications: config.enableNotifications !== false,
      autoStart: config.autoStart !== false,
      ...config
    };
    
    this.initialized = false;
    this.components = {};
    
    logger.info('🟢 BUMBA Orchestration System initializing...');
  }
  
  /**
   * Initialize all orchestration components
   */
  async initialize() {
    try {
      logger.info('🟢 Initializing orchestration components...');
      
      // Initialize core components
      this.components.orchestrator = taskOrchestratorModule.getInstance(this.config);
      this.components.notionClient = notionClientModule.getInstance(this.config.notion);
      this.components.dependencyManager = dependencyManagerModule.getInstance();
      this.components.hookSystem = hookSystemModule.getInstance();
      
      // Initialize task systems
      this.components.taskClaiming = new AgentTaskClaimingSystem();
      this.components.dependencyEnforcement = new DependencyEnforcementSystem(
        this.components.dependencyManager
      );
      this.components.timelineOptimizer = new TimelineOptimizer(
        this.components.dependencyManager
      );
      this.components.knowledgeSharing = new KnowledgeSharingSystem(
        this.components.notionClient
      );
      this.components.parallelCoordinator = new ParallelExecutionCoordinator();
      
      // Initialize monitoring systems
      this.components.progressDashboard = new ProgressTrackingDashboard(
        this.components.notionClient
      );
      
      if (this.config.enableQualityChecks) {
        this.components.qualityAssurance = new QualityAssuranceSystem();
      }
      
      if (this.config.enableMilestones) {
        this.components.milestoneTracking = new MilestoneTrackingSystem(
          this.components.notionClient
        );
      }
      
      if (this.config.enableNotifications) {
        this.components.notifications = new NotificationSystem();
      }
      
      this.components.errorRecovery = new ErrorRecoverySystem();
      
      // Connect components
      await this.connectComponents();
      
      // Initialize orchestrator
      await this.components.orchestrator.initialize();
      
      // Connect to Notion
      await this.components.notionClient.connect();
      
      // Start monitoring
      if (this.config.autoStart) {
        this.startMonitoring();
      }
      
      this.initialized = true;
      
      logger.info('🏁 Orchestration System initialized successfully');
      
      return true;
      
    } catch (error) {
      logger.error('Failed to initialize orchestration system:', error);
      throw error;
    }
  }
  
  /**
   * Connect components together
   */
  async connectComponents() {
    // Connect event listeners between components
    
    // Task completion events
    this.components.orchestrator.on('sprint:completed', async (data) => {
      await this.components.hookSystem.trigger('sprint:completed', data);
      
      if (this.components.qualityAssurance) {
        this.components.qualityAssurance.scheduleQualityCheck(
          data.sprintId,
          data.output
        );
      }
    });
    
    // Dependency events
    this.components.dependencyManager.on('task:completed', async (data) => {
      await this.components.hookSystem.trigger('dependency:resolved', data);
    });
    
    // Quality events
    if (this.components.qualityAssurance) {
      this.components.qualityAssurance.on('quality:check:completed', async (data) => {
        await this.components.hookSystem.trigger('quality:check:completed', data);
      });
    }
    
    // Milestone events
    if (this.components.milestoneTracking) {
      this.components.milestoneTracking.on('milestone:achieved', async (data) => {
        await this.components.hookSystem.trigger('milestone:reached', data);
      });
    }
    
    // Error events
    this.components.errorRecovery.on('recovery:initiated', async (data) => {
      await this.components.hookSystem.trigger('recovery:initiated', data);
    });
    
    logger.info('🟢 Components connected');
  }
  
  /**
   * Enhance Product-Strategist Manager with orchestration
   */
  enhanceProductStrategistManager(ProductStrategistManager) {
    const EnhancedManager = enhanceProductStrategist(ProductStrategistManager);
    
    logger.info('🏁 Product-Strategist Manager enhanced with orchestration capabilities');
    
    return EnhancedManager;
  }
  
  /**
   * Process a new project request
   */
  async processProject(request) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    logger.info(`🟢 Processing new project: ${request.title || request.description}`);
    
    // ENHANCED: Store original goal for testing validation
    const originalGoal = request.description || request.title;
    
    try {
      // Process through orchestrator
      const project = await this.components.orchestrator.processProjectRequest(request);
      
      // ENHANCED: Add testing checkpoints to milestones
      if (this.components.milestoneTracking) {
        await this.setupProjectMilestones(project);
        await this.addTestingCheckpoints(project, originalGoal);
      }
      
      // Subscribe to notifications
      if (this.components.notifications) {
        this.components.notifications.subscribe('human_operator', ['all']);
      }
      
      // Start execution
      await this.components.orchestrator.startExecution();
      
      return project;
      
    } catch (error) {
      logger.error('Failed to process project:', error);
      
      // Attempt recovery
      const recovery = await this.components.errorRecovery.handleError(
        error,
        'project_processing',
        { request }
      );
      
      if (recovery.action === 'retry') {
        return this.processProject(request);
      }
      
      throw error;
    }
  }
  
  /**
   * Register an agent with the system
   */
  registerAgent(agent) {
    this.components.orchestrator.registerAgent(agent);
    
    if (this.components.notifications) {
      this.components.notifications.subscribe(agent.id, [
        'task:allocated',
        'dependency:resolved',
        'project:completed'
      ]);
    }
    
    logger.info(`🟢 Agent registered: ${agent.id}`);
  }
  
  /**
   * Setup project milestones
   */
  async setupProjectMilestones(project) {
    const milestones = [
      {
        title: 'Project Kickoff',
        description: 'Initial setup and planning complete',
        targetDate: Date.now() + 3600000, // 1 hour
        requiredTasks: project.sprintPlan.sprints.slice(0, 2).map(s => s.id)
      },
      {
        title: 'Core Implementation',
        description: 'Main functionality implemented',
        targetDate: Date.now() + 7200000, // 2 hours
        requiredTasks: project.sprintPlan.sprints.slice(0, 10).map(s => s.id)
      },
      {
        title: 'Project Completion',
        description: 'All tasks completed',
        targetDate: Date.now() + 10800000, // 3 hours
        requiredTasks: project.sprintPlan.sprints.map(s => s.id)
      }
    ];
    
    for (const milestone of milestones) {
      this.components.milestoneTracking.registerMilestone(milestone);
    }
  }
  
  /**
   * Start monitoring systems
   */
  startMonitoring() {
    // Start dependency monitoring
    this.components.dependencyEnforcement.startMonitoring();
    
    // Start progress monitoring
    setInterval(async () => {
      if (this.components.orchestrator.activeProject) {
        await this.components.progressDashboard.updateProgress(
          this.components.orchestrator.activeProject.id
        );
      }
    }, 30000); // Every 30 seconds
    
    // Start milestone risk monitoring
    if (this.components.milestoneTracking) {
      setInterval(() => {
        const risks = this.components.milestoneTracking.checkMilestoneRisks();
        if (risks.length > 0) {
          logger.warn(`🟡 Milestone risks detected: ${risks.length}`);
        }
      }, 60000); // Every minute
    }
    
    logger.info('🟢 Monitoring systems started');
  }
  
  /**
   * Get system status
   */
  getStatus() {
    const status = {
      initialized: this.initialized,
      components: Object.keys(this.components),
      orchestrator: this.components.orchestrator?.getStatus(),
      dependencies: this.components.dependencyManager?.getStats(),
      quality: this.components.qualityAssurance?.getQualityMetrics(),
      errors: this.components.errorRecovery?.getErrorStats(),
      hooks: this.components.hookSystem?.getStats()
    };
    
    if (this.components.orchestrator?.activeProject) {
      status.activeProject = {
        id: this.components.orchestrator.activeProject.id,
        status: this.components.orchestrator.activeProject.status,
        sprints: this.components.orchestrator.activeProject.sprintPlan.sprints.length,
        completed: this.components.orchestrator.completedSprints.size
      };
    }
    
    return status;
  }
  
  /**
   * ENHANCED: Add testing checkpoints to project milestones
   */
  async addTestingCheckpoints(project, originalGoal) {
    logger.info('🟢 Adding testing checkpoints to orchestration');
    
    // Define testing checkpoints
    const checkpoints = [
      {
        name: 'Initial Implementation Testing',
        trigger: 'after_first_sprint',
        tests: ['unit', 'integration'],
        minCoverage: 70
      },
      {
        name: 'Mid-Project Testing',
        trigger: 'milestone_50',
        tests: ['unit', 'integration', 'performance'],
        minCoverage: 80
      },
      {
        name: 'Final Testing',
        trigger: 'before_completion',
        tests: ['unit', 'integration', 'e2e', 'security'],
        minCoverage: 90,
        validateCompleteness: true
      }
    ];
    
    // Register testing hooks for each checkpoint
    for (const checkpoint of checkpoints) {
      await this.components.hookSystem.register(checkpoint.trigger, async (data) => {
        logger.info(`🏁 Testing checkpoint: ${checkpoint.name}`);
        
        // Get testing framework if available
        const testingFramework = this.getTestingFramework();
        if (!testingFramework) {
          logger.warn('Testing framework not available, skipping checkpoint');
          return;
        }
        
        // Run tests
        const testReport = await testingFramework.testAtCheckpoint(
          data.results || [],
          originalGoal
        );
        
        // Check coverage requirement
        if (testReport.coverage < checkpoint.minCoverage) {
          logger.error(`🔴 Coverage ${testReport.coverage}% below required ${checkpoint.minCoverage}%`);
          // Could pause execution here if critical
        }
        
        // Validate completeness if required
        if (checkpoint.validateCompleteness) {
          const completeness = await testingFramework.validateCompleteness(
            data.results || {},
            originalGoal
          );
          
          if (!completeness.complete) {
            logger.warn(`🟡 Completeness only ${Math.round(completeness.score * 100)}%`);
            logger.warn(`Missing: ${completeness.missingElements.join(', ')}`);
          }
        }
        
        return testReport;
      });
    }
    
    // Set up periodic testing during execution
    if (this.config.continuousTesting) {
      this.setupContinuousTesting(originalGoal);
    }
  }
  
  /**
   * ENHANCED: Set up continuous testing during orchestration
   */
  setupContinuousTesting(originalGoal) {
    const interval = setInterval(async () => {
      const currentProgress = await this.components.progressDashboard?.getCurrentProgress();
      
      if (currentProgress && currentProgress.results) {
        const testingFramework = this.getTestingFramework();
        if (testingFramework) {
          const quickTests = await testingFramework.runQuickTests(currentProgress.results);
          
          if (!quickTests.passed) {
            logger.warn(`🟡 Continuous testing detected issues: ${quickTests.message}`);
          }
        }
      }
    }, 60000); // Every minute
    
    // Store interval for cleanup
    this.continuousTestingInterval = interval;
  }
  
  /**
   * ENHANCED: Get testing framework instance
   */
  getTestingFramework() {
    try {
      const { getInstance } = require('../testing/comprehensive-testing-framework');
      return getInstance();
    } catch (error) {
      logger.warn('Testing framework not available');
      return null;
    }
  }
  
  /**
   * Shutdown orchestration system
   */
  async shutdown() {
    logger.info('🔴 Shutting down orchestration system...');
    
    // Stop periodic hooks
    this.components.hookSystem?.stopPeriodicHooks();
    
    // ENHANCED: Clear continuous testing interval
    if (this.continuousTestingInterval) {
      clearInterval(this.continuousTestingInterval);
      this.continuousTestingInterval = null;
    }
    
    // Clear monitoring intervals
    // Would clear all intervals here
    
    logger.info('🏁 Orchestration system shut down');
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  BumbaOrchestrationSystem,
  getInstance: (config) => {
    if (!instance) {
      instance = new BumbaOrchestrationSystem(config);
    }
    return instance;
  },
  
  // Export individual components for direct access
  TaskOrchestrator,
  NotionOrchestrationClient,
  DependencyManager,
  OrchestrationHookSystem,
  AgentTaskClaimingSystem,
  DependencyEnforcementSystem,
  TimelineOptimizer,
  KnowledgeSharingSystem,
  ParallelExecutionCoordinator,
  ProgressTrackingDashboard,
  QualityAssuranceSystem,
  MilestoneTrackingSystem,
  NotificationSystem,
  ErrorRecoverySystem,
  enhanceProductStrategist
};