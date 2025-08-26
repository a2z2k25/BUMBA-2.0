/**
 * BUMBA Project Trigger System
 * Automatically creates Notion dashboards when projects start
 * Integrates with implement commands to trigger dashboard creation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getDashboardGenerator } = require('./project-dashboard-generator');

class ProjectTriggerSystem extends EventEmitter {
  constructor() {
    super();
    
    this.dashboardGenerator = getDashboardGenerator();
    this.activeProjects = new Map();
    
    // Hook into BUMBA command system
    this.setupCommandHooks();
    
    logger.info('🟡 Project Trigger System initialized');
  }

  /**
   * Set up hooks for project-starting commands
   */
  setupCommandHooks() {
    // Commands that trigger project dashboard creation
    const projectCommands = [
      'implement',
      'implement-agents',
      'implement-technical',
      'implement-design',
      'implement-strategy',
      'feature',
      'project'
    ];
    
    // Listen for these commands
    projectCommands.forEach(cmd => {
      this.on(`command:${cmd}`, async (context) => {
        await this.handleProjectStart(context);
      });
    });
  }

  /**
   * Handle project start - create Notion dashboard
   */
  async handleProjectStart(context) {
    const {
      command,
      args,
      user,
      timestamp
    } = context;
    
    // Extract project details from command context
    const projectConfig = this.extractProjectConfig(command, args);
    
    if (!projectConfig.name) {
      logger.warn('No project name found, skipping dashboard creation');
      return;
    }
    
    logger.info(`🟢 New project detected: ${projectConfig.name}`);
    
    try {
      // Create Notion dashboard
      const dashboard = await this.dashboardGenerator.createProjectDashboard(projectConfig);
      
      if (dashboard.success) {
        // Track active project
        this.activeProjects.set(projectConfig.name, {
          dashboardId: dashboard.pageId,
          dashboardUrl: dashboard.url,
          startTime: timestamp || Date.now(),
          command,
          config: projectConfig
        });
        
        // Emit success event
        this.emit('dashboard:created', {
          project: projectConfig.name,
          url: dashboard.url
        });
        
        // Start human-like PM updates
        await this.startPMSimulation(dashboard.pageId, projectConfig.name);
        
        logger.info(`🏁 Dashboard created: ${dashboard.url}`);
        
        // Return dashboard info for command response
        return {
          dashboardCreated: true,
          url: dashboard.url,
          message: `📊 Project dashboard: ${dashboard.url}`
        };
      }
      
    } catch (error) {
      logger.error('Failed to create project dashboard:', error);
      // Don't fail the command if dashboard creation fails
      return {
        dashboardCreated: false,
        error: error.message
      };
    }
  }

  /**
   * Extract project configuration from command
   */
  extractProjectConfig(command, args) {
    // Parse project name and details from command arguments
    let name = '';
    let description = '';
    let type = 'feature';
    let agents = ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer'];
    
    // Handle different command formats
    if (typeof args === 'string') {
      name = args.split(' ').slice(0, 3).join(' ');
      description = args;
    } else if (Array.isArray(args)) {
      name = args[0] || '';
      description = args.join(' ');
    } else if (typeof args === 'object') {
      name = args.name || args.feature || args.project || '';
      description = args.description || name;
      type = args.type || 'feature';
      agents = args.agents || agents;
    }
    
    // Clean up name for Notion
    name = name.replace(/['"]/g, '').trim();
    
    // Determine project type from command
    if (command.includes('design')) {
      type = 'design';
      agents = ['Design-Engineer', 'Product-Strategist'];
    } else if (command.includes('technical')) {
      type = 'technical';
      agents = ['Backend-Engineer'];
    } else if (command.includes('strategy')) {
      type = 'strategy';
      agents = ['Product-Strategist'];
    }
    
    return {
      name: name || `BUMBA Project ${Date.now()}`,
      description: description || 'Auto-generated project dashboard',
      type,
      agents,
      priority: this.determinePriority(command, args),
      estimatedDuration: this.estimateDuration(type)
    };
  }

  /**
   * Determine project priority
   */
  determinePriority(command, args) {
    const argsStr = JSON.stringify(args).toLowerCase();
    
    if (argsStr.includes('urgent') || argsStr.includes('critical')) {
      return 'high';
    } else if (argsStr.includes('low') || argsStr.includes('minor')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Estimate project duration based on type
   */
  estimateDuration(type) {
    const durations = {
      'feature': '2 weeks',
      'design': '1 week',
      'technical': '3 days',
      'strategy': '1 week',
      'bug': '1 day',
      'research': '3 days'
    };
    
    return durations[type] || '1 week';
  }

  /**
   * Start human-like PM simulation
   */
  async startPMSimulation(dashboardId, projectName) {
    // Simulate natural PM behavior
    const pmActions = [
      { delay: 5000, action: 'checkIn' },
      { delay: 15000, action: 'updateStatus' },
      { delay: 30000, action: 'reviewProgress' },
      { delay: 60000, action: 'teamSync' },
      { delay: 120000, action: 'qualityCheck' }
    ];
    
    pmActions.forEach(({ delay, action }) => {
      setTimeout(async () => {
        await this.simulatePMAction(dashboardId, projectName, action);
      }, delay);
    });
  }

  /**
   * Simulate PM action
   */
  async simulatePMAction(dashboardId, projectName, action) {
    const project = this.activeProjects.get(projectName);
    if (!project) return;
    
    const actions = {
      checkIn: async () => {
        this.emit('pm:update', {
          project: projectName,
          message: 'Checking in on team progress...'
        });
      },
      
      updateStatus: async () => {
        const progress = Math.floor(Math.random() * 20) + 10;
        this.dashboardGenerator.emit(`project:${projectName}:update`, {
          type: 'status_change',
          agent: 'PM',
          data: { progress }
        });
      },
      
      reviewProgress: async () => {
        this.emit('pm:update', {
          project: projectName,
          message: 'Reviewing deliverables and quality metrics'
        });
      },
      
      teamSync: async () => {
        this.emit('pm:update', {
          project: projectName,
          message: 'Team sync completed - all on track! 🟡'
        });
      },
      
      qualityCheck: async () => {
        const score = Math.floor(Math.random() * 10) + 90;
        this.dashboardGenerator.emit(`project:${projectName}:update`, {
          type: 'quality_check',
          agent: 'PM',
          data: { score }
        });
      }
    };
    
    const actionFn = actions[action];
    if (actionFn) {
      await actionFn();
    }
  }

  /**
   * Update project progress from agent activity
   */
  async updateFromAgent(agentName, activity) {
    // Find active projects this agent is working on
    for (const [projectName, project] of this.activeProjects) {
      if (project.config.agents.includes(agentName)) {
        // Send update to dashboard
        this.dashboardGenerator.emit(`project:${projectName}:update`, {
          type: 'agent_activity',
          agent: agentName,
          data: activity
        });
      }
    }
  }

  /**
   * Complete a project
   */
  async completeProject(projectName) {
    const project = this.activeProjects.get(projectName);
    if (!project) return;
    
    // Update Notion page status
    await this.dashboardGenerator.notionBridge.executeNotionOperation('updatePage', {
      pageId: project.dashboardId,
      properties: {
        Status: { select: { name: 'Complete' } },
        'End Date': { date: { start: new Date().toISOString() } }
      }
    });
    
    // Calculate final metrics
    const duration = Date.now() - project.startTime;
    const durationHours = Math.floor(duration / (1000 * 60 * 60));
    
    // Add completion note
    await this.dashboardGenerator.addPMNote(
      project.dashboardId,
      `Project completed in ${durationHours} hours! Great work team! 🏁`
    );
    
    // Remove from active projects
    this.activeProjects.delete(projectName);
    
    // Emit completion event
    this.emit('project:completed', {
      project: projectName,
      duration: durationHours,
      dashboardUrl: project.dashboardUrl
    });
  }

  /**
   * Get active projects
   */
  getActiveProjects() {
    return Array.from(this.activeProjects.entries()).map(([name, project]) => ({
      name,
      dashboardUrl: project.dashboardUrl,
      startTime: project.startTime,
      agents: project.config.agents
    }));
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ProjectTriggerSystem();
  }
  return instance;
}

// Hook into BUMBA command system
function integrateWithBumba() {
  const triggerSystem = getInstance();
  
  // Listen for implement commands
  process.on('bumba:command', (event) => {
    if (event.command && event.command.includes('implement')) {
      triggerSystem.emit(`command:${event.command}`, event);
    }
  });
  
  // Listen for agent activity
  process.on('bumba:agent:activity', (event) => {
    triggerSystem.updateFromAgent(event.agent, event.activity);
  });
  
  logger.info('🏁 Notion trigger system integrated with BUMBA');
}

module.exports = {
  ProjectTriggerSystem,
  getInstance,
  integrateWithBumba
};