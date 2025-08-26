/**
 * Bumba Framework Integration
 * 
 * Connects Notion Mirror to Bumba's command system
 */

const NotionMirror = require('./index');
const EventEmitter = require('events');

class BumbaNotionIntegration extends EventEmitter {
  constructor() {
    super();
    this.mirror = null;
    this.isActive = false;
    this.currentProject = null;
    
    // Command mappings
    this.commandHandlers = new Map();
    this.setupCommandHandlers();
  }

  /**
   * Setup command handlers for Bumba commands
   */
  setupCommandHandlers() {
    // Project initialization commands
    this.commandHandlers.set('/bumba:implement', this.handleImplementCommand.bind(this));
    this.commandHandlers.set('/bumba:project', this.handleProjectCommand.bind(this));
    
    // Task management commands
    this.commandHandlers.set('/bumba:task', this.handleTaskCommand.bind(this));
    this.commandHandlers.set('/bumba:sprint', this.handleSprintCommand.bind(this));
    
    // Status update commands
    this.commandHandlers.set('/bumba:status', this.handleStatusCommand.bind(this));
    this.commandHandlers.set('/bumba:complete', this.handleCompleteCommand.bind(this));
    this.commandHandlers.set('/bumba:block', this.handleBlockCommand.bind(this));
    
    // Visualization commands
    this.commandHandlers.set('/bumba:dashboard', this.handleDashboardCommand.bind(this));
    this.commandHandlers.set('/bumba:metrics', this.handleMetricsCommand.bind(this));
  }

  /**
   * Initialize Notion Mirror for a Bumba project
   */
  async initializeForProject(projectData) {
    try {
      // Create new mirror instance
      this.mirror = new NotionMirror({
        mode: process.env.NOTION_MODE || 'mock'
      });
      
      // Initialize with project data
      const result = await this.mirror.initialize({
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        priority: projectData.priority || 'P2',
        team: projectData.agents || []
      });
      
      this.isActive = true;
      this.currentProject = projectData;
      
      // Emit initialization event
      this.emit('notion:initialized', {
        projectId: result.projectId,
        dashboardUrl: result.dashboardUrl
      });
      
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  NOTION DASHBOARD CREATED                      ║
╠════════════════════════════════════════════════════════════════╣
║  Project: ${projectData.name.padEnd(52)} ║
║  Dashboard: ${result.dashboardUrl.padEnd(50)} ║
║  Status: Active                                               ║
╚════════════════════════════════════════════════════════════════╝
      `);
      
      return result;
      
    } catch (error) {
      console.error('[BumbaNotion] Initialization failed:', error);
      this.isActive = false;
      throw error;
    }
  }

  /**
   * Handle /bumba:implement command
   */
  async handleImplementCommand(command, args) {
    console.log('[BumbaNotion] Handling implement command');
    
    // Extract project info from command
    const projectData = {
      name: args.feature || 'New Feature Implementation',
      description: args.description || '',
      priority: this.extractPriority(args),
      agents: this.extractAgents(args)
    };
    
    // Initialize Notion mirror
    await this.initializeForProject(projectData);
    
    // Create initial tasks if provided
    if (args.tasks) {
      for (const taskData of args.tasks) {
        await this.createTaskFromCommand(taskData);
      }
    }
    
    return {
      success: true,
      dashboardUrl: this.mirror.pipeline.state.project.dashboardUrl
    };
  }

  /**
   * Handle /bumba:project command
   */
  async handleProjectCommand(command, args) {
    if (!this.isActive) {
      return { error: 'No active Notion mirror. Initialize with /bumba:implement first' };
    }
    
    switch (args.action) {
      case 'status':
        return this.getProjectStatus();
      case 'update':
        return await this.updateProjectInfo(args);
      case 'close':
        return await this.closeProject();
      default:
        return { error: 'Unknown project action' };
    }
  }

  /**
   * Handle /bumba:task command
   */
  async handleTaskCommand(command, args) {
    if (!this.isActive) {
      return { error: 'No active Notion mirror' };
    }
    
    switch (args.action) {
      case 'create':
        return await this.createTaskFromCommand(args);
      case 'update':
        return await this.updateTaskFromCommand(args);
      case 'list':
        return this.listTasks(args.filter);
      default:
        return { error: 'Unknown task action' };
    }
  }

  /**
   * Handle /bumba:sprint command
   */
  async handleSprintCommand(command, args) {
    if (!this.isActive) {
      return { error: 'No active Notion mirror' };
    }
    
    const sprintData = {
      name: args.name || `Sprint ${Date.now()}`,
      goal: args.goal || '',
      startDate: args.startDate || new Date().toISOString(),
      endDate: args.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      plannedStoryPoints: args.points || 0
    };
    
    const sprint = await this.mirror.createSprint(sprintData);
    
    return {
      success: true,
      sprint: sprint,
      message: `Sprint "${sprint.name}" created successfully`
    };
  }

  /**
   * Handle /bumba:status command
   */
  async handleStatusCommand(command, args) {
    if (!this.isActive) {
      return { error: 'No active Notion mirror' };
    }
    
    const stats = this.mirror.getStatistics();
    
    return {
      project: this.currentProject.name,
      dashboardUrl: stats.dashboardUrl,
      tasks: stats.tasks,
      sprints: stats.sprints,
      lastSync: stats.lastSync,
      progress: this.mirror.pipeline.calculateOverallProgress()
    };
  }

  /**
   * Handle /bumba:complete command
   */
  async handleCompleteCommand(command, args) {
    if (!this.isActive || !args.taskId) {
      return { error: 'No active mirror or missing task ID' };
    }
    
    const task = await this.mirror.updateTaskStatus(args.taskId, 'complete');
    
    return {
      success: true,
      task: task,
      message: `Task "${task.title}" marked as complete`
    };
  }

  /**
   * Handle /bumba:block command
   */
  async handleBlockCommand(command, args) {
    if (!this.isActive || !args.taskId) {
      return { error: 'No active mirror or missing task ID' };
    }
    
    const task = await this.mirror.updateTaskStatus(args.taskId, 'blocked');
    
    // Log blocker reason
    if (args.reason) {
      this.mirror.pipeline.logActivity(args.taskId, {
        type: 'blocker',
        actor: args.agent || 'system',
        details: args.reason
      });
    }
    
    return {
      success: true,
      task: task,
      message: `Task "${task.title}" marked as blocked`
    };
  }

  /**
   * Handle /bumba:dashboard command
   */
  async handleDashboardCommand(command, args) {
    if (!this.isActive) {
      return { error: 'No active Notion mirror' };
    }
    
    // Update all visualizations
    await this.mirror.updateProgressVisualization();
    await this.mirror.updateBurndownChart();
    await this.mirror.updateTimelineVisualization();
    
    return {
      success: true,
      dashboardUrl: this.mirror.pipeline.state.project.dashboardUrl,
      message: 'Dashboard updated with latest visualizations'
    };
  }

  /**
   * Handle /bumba:metrics command
   */
  async handleMetricsCommand(command, args) {
    if (!this.isActive) {
      return { error: 'No active Notion mirror' };
    }
    
    const metrics = {
      progress: this.mirror.pipeline.calculateOverallProgress(),
      progressByDepartment: this.mirror.pipeline.calculateProgressByDepartment(),
      velocity: this.calculateVelocity(),
      burndown: this.getBurndownData(),
      health: this.calculateProjectHealth()
    };
    
    return metrics;
  }

  /**
   * Create task from command arguments
   */
  async createTaskFromCommand(args) {
    const taskData = {
      title: args.title || args.name || 'Untitled Task',
      description: args.description || '',
      department: args.department || this.inferDepartment(args),
      priority: args.priority || 'P2',
      storyPoints: args.points || args.storyPoints || 3,
      assignee: args.assignee || args.agent,
      dependencies: args.dependencies || {}
    };
    
    const task = await this.mirror.createTask(taskData);
    
    return {
      success: true,
      task: task,
      message: `Task "${task.title}" created with ID: ${task.id}`
    };
  }

  /**
   * Update task from command arguments
   */
  async updateTaskFromCommand(args) {
    if (!args.taskId) {
      return { error: 'Task ID required for update' };
    }
    
    const task = this.mirror.pipeline.state.tasks.get(args.taskId);
    if (!task) {
      return { error: `Task ${args.taskId} not found` };
    }
    
    // Update task fields
    const updatedTask = await this.mirror.pipeline.reflectTask({
      ...task,
      ...args.updates,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      task: updatedTask,
      message: `Task "${updatedTask.title}" updated`
    };
  }

  /**
   * Get project status
   */
  getProjectStatus() {
    const stats = this.mirror.getStatistics();
    const progress = this.mirror.pipeline.calculateOverallProgress();
    
    const statusReport = `
╔════════════════════════════════════════════════════════════════╗
║                     PROJECT STATUS REPORT                      ║
╠════════════════════════════════════════════════════════════════╣
║  Project: ${this.currentProject.name.padEnd(52)} ║
║  Progress: ${progress.toFixed(1).padEnd(4)}%                                              ║
║                                                                ║
║  Tasks:                                                        ║
║    • Total: ${stats.tasks.total.toString().padEnd(51)} ║
║    • Completed: ${stats.tasks.completed.toString().padEnd(47)} ║
║    • In Progress: ${stats.tasks.inProgress.toString().padEnd(45)} ║
║    • Blocked: ${stats.tasks.blocked.toString().padEnd(49)} ║
║                                                                ║
║  Sprints: ${stats.sprints.toString().padEnd(53)} ║
║  Last Sync: ${new Date(stats.lastSync).toLocaleString().padEnd(51)} ║
║                                                                ║
║  Dashboard: ${stats.dashboardUrl.padEnd(50)} ║
╚════════════════════════════════════════════════════════════════╝
    `;
    
    return {
      success: true,
      report: statusReport,
      data: stats
    };
  }

  /**
   * List tasks with optional filter
   */
  listTasks(filter) {
    const tasks = Array.from(this.mirror.pipeline.state.tasks.values());
    
    let filtered = tasks;
    if (filter) {
      if (filter.status) {
        filtered = filtered.filter(t => t.status === filter.status);
      }
      if (filter.department) {
        filtered = filtered.filter(t => t.department === filter.department);
      }
      if (filter.assignee) {
        filtered = filtered.filter(t => t.assignee === filter.assignee);
      }
    }
    
    return {
      success: true,
      tasks: filtered.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        department: t.department,
        assignee: t.assignee || 'Unassigned',
        progress: t.progress
      })),
      count: filtered.length
    };
  }

  /**
   * Close project and cleanup
   */
  async closeProject() {
    if (this.mirror) {
      await this.mirror.shutdown();
    }
    
    this.isActive = false;
    this.currentProject = null;
    this.mirror = null;
    
    return {
      success: true,
      message: 'Project closed and Notion mirror shutdown'
    };
  }

  /**
   * Helper: Extract priority from args
   */
  extractPriority(args) {
    if (args.priority) return args.priority;
    if (args.urgent) return 'P0';
    if (args.high) return 'P1';
    if (args.low) return 'P3';
    return 'P2';
  }

  /**
   * Helper: Extract agents from args
   */
  extractAgents(args) {
    const agents = [];
    if (args.agents) {
      agents.push(...args.agents);
    }
    if (args.backend) agents.push('backend-engineer-1');
    if (args.frontend) agents.push('frontend-engineer-1');
    if (args.design) agents.push('design-engineer');
    if (args.qa) agents.push('qa-engineer');
    return agents;
  }

  /**
   * Helper: Infer department from args
   */
  inferDepartment(args) {
    const text = `${args.title} ${args.description}`.toLowerCase();
    if (text.includes('api') || text.includes('backend')) return 'Backend-Engineer';
    if (text.includes('ui') || text.includes('frontend')) return 'Frontend-Engineer';
    if (text.includes('design') || text.includes('ux')) return 'Design-Engineer';
    if (text.includes('test') || text.includes('qa')) return 'QA-Engineer';
    return 'Product-Strategist';
  }

  /**
   * Helper: Calculate velocity
   */
  calculateVelocity() {
    const sprints = Array.from(this.mirror.pipeline.state.sprints.values());
    if (sprints.length === 0) return 0;
    
    const completedSprints = sprints.filter(s => s.status === 'complete');
    if (completedSprints.length === 0) return 0;
    
    const totalVelocity = completedSprints.reduce((sum, s) => sum + s.completedStoryPoints, 0);
    return totalVelocity / completedSprints.length;
  }

  /**
   * Helper: Get burndown data
   */
  getBurndownData() {
    const currentSprint = this.mirror.getCurrentSprint();
    if (!currentSprint) return null;
    
    return currentSprint.burndownData || [];
  }

  /**
   * Helper: Calculate project health
   */
  calculateProjectHealth() {
    const stats = this.mirror.getStatistics();
    const blockedRatio = stats.tasks.blocked / stats.tasks.total;
    const progress = this.mirror.pipeline.calculateOverallProgress();
    
    if (blockedRatio > 0.3) return 'critical';
    if (blockedRatio > 0.15) return 'warning';
    if (progress < 25 && stats.tasks.total > 10) return 'slow';
    return 'healthy';
  }

  /**
   * Register with Bumba Framework
   */
  registerWithFramework(framework) {
    // Register command handlers
    this.commandHandlers.forEach((handler, command) => {
      framework.registerCommand(command, handler);
    });
    
    // Register event listeners
    framework.on('project:created', (data) => {
      this.initializeForProject(data);
    });
    
    framework.on('task:created', (data) => {
      if (this.isActive) {
        this.createTaskFromCommand(data);
      }
    });
    
    framework.on('task:updated', (data) => {
      if (this.isActive) {
        this.updateTaskFromCommand(data);
      }
    });
    
    console.log('[BumbaNotion] Registered with Bumba Framework');
  }
}

// Singleton instance
const bumbaNotionIntegration = new BumbaNotionIntegration();

module.exports = bumbaNotionIntegration;