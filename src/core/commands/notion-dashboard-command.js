/**
 * BUMBA Notion Dashboard Command
 * User-triggered dashboard creation with agent customization
 * NO automatic creation - explicit user control only
 */

const { logger } = require('../logging/bumba-logger');
const { EventEmitter } = require('events');

class NotionDashboardCommand extends EventEmitter {
  constructor() {
    super();
    this.name = 'notion:dashboard';
    this.aliases = ['dashboard', 'notion:project'];
    this.description = 'Create and manage Notion project dashboards';
    this.autoCreate = false; // Explicitly disable auto-creation
    
    // Track active dashboards
    this.activeDashboards = new Map();
  }

  /**
   * Main command handler
   */
  async execute(args = {}) {
    const { action, project, options = {} } = this.parseArgs(args);
    
    switch (action) {
      case 'create':
        return await this.createDashboard(project, options);
      
      case 'preview':
        return await this.previewDashboard(project, options);
      
      case 'list':
        return await this.listDashboards();
      
      case 'status':
        return await this.getDashboardStatus(project);
      
      case 'enable':
        return await this.enableUpdates(project);
      
      case 'disable':
        return await this.disableUpdates(project);
      
      case 'template':
        return await this.showTemplates(options.type);
      
      case 'customize':
        return await this.customizeDashboard(project, options);
      
      case 'handoff':
        return await this.prepareHandoff(project, options.toAgent);
      
      default:
        return this.showHelp();
    }
  }

  /**
   * Create dashboard with user confirmation - NO automatic creation
   */
  async createDashboard(projectName, options = {}) {
    if (!projectName) {
      return {
        error: 'Project name required',
        usage: '/bumba:notion:dashboard:create "project-name"'
      };
    }

    logger.info(`📋 Preparing Notion dashboard for: ${projectName}`);

    try {
      // 1. Check if project exists
      const project = await this.findOrCreateProject(projectName);
      
      // 2. Check if dashboard already exists
      if (this.activeDashboards.has(projectName)) {
        const existing = this.activeDashboards.get(projectName);
        return {
          error: 'Dashboard already exists',
          url: existing.url,
          message: `Dashboard exists at: ${existing.url}`
        };
      }

      // 3. Get agent customization suggestions
      const customizations = await this.getAgentCustomizations(project);
      
      // 4. Generate preview
      const preview = await this.generatePreview(project, customizations);
      
      // 5. REQUIRE EXPLICIT CONFIRMATION
      const confirmed = await this.getUserConfirmation(preview);
      
      if (!confirmed) {
        logger.info('❌ Dashboard creation cancelled by user');
        return {
          cancelled: true,
          message: 'Dashboard creation cancelled'
        };
      }

      // 6. Build dashboard with customizations
      const dashboard = await this.buildDashboard(project, customizations);
      
      // 7. Register for active updates
      await this.registerForUpdates(projectName, dashboard);
      
      // 8. Store in active dashboards
      this.activeDashboards.set(projectName, {
        id: dashboard.id,
        url: dashboard.url,
        created: Date.now(),
        customizations,
        updateEnabled: true
      });

      logger.info(`✅ Dashboard created: ${dashboard.url}`);
      
      return {
        success: true,
        url: dashboard.url,
        id: dashboard.id,
        message: `Dashboard created successfully!\nView at: ${dashboard.url}\nActive updates enabled.`
      };

    } catch (error) {
      logger.error('Dashboard creation failed:', error);
      return {
        error: error.message,
        suggestion: 'Check logs for details or try /bumba:notion:dashboard:help'
      };
    }
  }

  /**
   * Preview dashboard before creation
   */
  async previewDashboard(projectName, options = {}) {
    const project = await this.findOrCreateProject(projectName);
    const customizations = await this.getAgentCustomizations(project);
    const preview = await this.generatePreview(project, customizations);
    
    return {
      preview,
      message: 'Dashboard preview generated. Use :create to build it.'
    };
  }

  /**
   * Get agent customization suggestions
   */
  async getAgentCustomizations(project) {
    const { DashboardCustomizer } = require('../notion/dashboard-customizer');
    const customizer = new DashboardCustomizer();
    
    return await customizer.analyzeProject(project);
  }

  /**
   * Generate preview of dashboard structure
   */
  async generatePreview(project, customizations) {
    const { DashboardTemplate } = require('../notion/dashboard-template');
    const template = new DashboardTemplate();
    
    const structure = template.generateStructure(project, customizations);
    
    return {
      projectName: project.name,
      type: project.type,
      structure: {
        coreSections: structure.core,
        customSections: structure.custom,
        departments: structure.departments,
        views: structure.views
      },
      estimatedSize: `${structure.sections.length} sections, ${structure.tasks.length} initial tasks`,
      customizations: customizations.map(c => `- ${c.section}: ${c.reason}`)
    };
  }

  /**
   * Get user confirmation - EXPLICIT CONTROL
   */
  async getUserConfirmation(preview) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 NOTION DASHBOARD PREVIEW');
    console.log('='.repeat(60));
    console.log(`Project: ${preview.projectName}`);
    console.log(`Type: ${preview.type}`);
    console.log('\nCore Sections:');
    preview.structure.coreSections.forEach(s => console.log(`  - ${s}`));
    
    if (preview.structure.customSections.length > 0) {
      console.log('\nCustom Sections (Agent Recommendations):');
      preview.customizations.forEach(c => console.log(`  ${c}`));
    }
    
    console.log(`\nEstimated Size: ${preview.estimatedSize}`);
    console.log('='.repeat(60));

    return new Promise((resolve) => {
      rl.question('\nCreate this dashboard? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  /**
   * Build the actual dashboard
   */
  async buildDashboard(project, customizations) {
    const { ProjectDashboardGenerator } = require('../notion/project-dashboard-generator');
    const generator = new ProjectDashboardGenerator();
    
    // Build with flexibility for agent customization
    const dashboardConfig = {
      name: project.name,
      description: project.description,
      type: project.type,
      agents: project.agents || ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer'],
      customizations,
      flexible: true, // Allow agent creativity
      template: 'adaptive' // Use adaptive template
    };
    
    return await generator.createProjectDashboard(dashboardConfig);
  }

  /**
   * Register dashboard for active updates
   */
  async registerForUpdates(projectName, dashboard) {
    const { ActiveContributor } = require('../notion/active-contributor');
    const contributor = new ActiveContributor();
    
    contributor.register(projectName, dashboard.id, {
      frequency: 'on-event',
      types: ['task-complete', 'status-change', 'milestone', 'blocker'],
      agents: ['all']
    });

    logger.info(`📡 Dashboard registered for active updates: ${projectName}`);
  }

  /**
   * List all active dashboards
   */
  async listDashboards() {
    const dashboards = Array.from(this.activeDashboards.entries());
    
    if (dashboards.length === 0) {
      return {
        message: 'No active dashboards. Create one with :create'
      };
    }

    return {
      dashboards: dashboards.map(([name, info]) => ({
        project: name,
        url: info.url,
        created: new Date(info.created).toLocaleString(),
        updates: info.updateEnabled ? 'Enabled' : 'Disabled'
      })),
      count: dashboards.length
    };
  }

  /**
   * Enable updates for a dashboard
   */
  async enableUpdates(projectName) {
    const dashboard = this.activeDashboards.get(projectName);
    if (!dashboard) {
      return { error: 'Dashboard not found' };
    }

    dashboard.updateEnabled = true;
    
    // Re-register for updates
    const { ActiveContributor } = require('../notion/active-contributor');
    const contributor = new ActiveContributor();
    contributor.resume(projectName);

    return {
      success: true,
      message: `Updates enabled for ${projectName}`
    };
  }

  /**
   * Disable updates for a dashboard
   */
  async disableUpdates(projectName) {
    const dashboard = this.activeDashboards.get(projectName);
    if (!dashboard) {
      return { error: 'Dashboard not found' };
    }

    dashboard.updateEnabled = false;
    
    // Pause updates
    const { ActiveContributor } = require('../notion/active-contributor');
    const contributor = new ActiveContributor();
    contributor.pause(projectName);

    return {
      success: true,
      message: `Updates disabled for ${projectName}`
    };
  }

  /**
   * Show available templates
   */
  async showTemplates(type) {
    const templates = {
      feature: {
        name: 'Feature Development',
        sections: ['Requirements', 'Development Tasks', 'Testing', 'Deployment'],
        customizable: ['Velocity Tracking', 'Feature Flags']
      },
      bugfix: {
        name: 'Bug Fix',
        sections: ['Issue Description', 'Root Cause', 'Fix Tasks', 'Regression Tests'],
        customizable: ['Impact Analysis', 'Rollback Plan']
      },
      research: {
        name: 'Research Project',
        sections: ['Hypothesis', 'Methodology', 'Findings', 'Documentation'],
        customizable: ['Literature Review', 'Data Collection']
      },
      client: {
        name: 'Client Project',
        sections: ['Requirements', 'Milestones', 'Deliverables', 'Communication'],
        customizable: ['Budget Tracking', 'Stakeholder Updates']
      }
    };

    if (type && templates[type]) {
      return templates[type];
    }

    return {
      templates: Object.keys(templates),
      usage: '/bumba:notion:dashboard:template [type]'
    };
  }

  /**
   * Prepare handoff to another agent
   */
  async prepareHandoff(projectName, toAgent) {
    const dashboard = this.activeDashboards.get(projectName);
    if (!dashboard) {
      return { error: 'Dashboard not found' };
    }

    const { DashboardContext } = require('../notion/dashboard-context');
    const context = new DashboardContext(dashboard);
    
    const handoff = await context.prepareHandoff(toAgent);
    
    return {
      success: true,
      handoff,
      message: `Handoff prepared for ${toAgent}`
    };
  }

  /**
   * Parse command arguments
   */
  parseArgs(args) {
    if (typeof args === 'string') {
      const parts = args.split(' ');
      return {
        action: parts[0] || 'help',
        project: parts[1],
        options: {}
      };
    }

    return {
      action: args.action || 'help',
      project: args.project,
      options: args.options || {}
    };
  }

  /**
   * Find or create project
   */
  async findOrCreateProject(projectName) {
    // Try to find existing project
    // For now, create a basic project object
    return {
      name: projectName,
      type: 'feature', // Default type
      description: `Project dashboard for ${projectName}`,
      agents: ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer'],
      created: Date.now()
    };
  }

  /**
   * Show help
   */
  showHelp() {
    return {
      commands: [
        '/bumba:notion:dashboard:create [project] - Create dashboard (requires confirmation)',
        '/bumba:notion:dashboard:preview [project] - Preview before creating',
        '/bumba:notion:dashboard:list - List active dashboards',
        '/bumba:notion:dashboard:status [project] - Check dashboard status',
        '/bumba:notion:dashboard:enable [project] - Enable updates',
        '/bumba:notion:dashboard:disable [project] - Disable updates',
        '/bumba:notion:dashboard:template [type] - Show templates',
        '/bumba:notion:dashboard:handoff [project] [agent] - Prepare handoff'
      ],
      note: 'Dashboards are NEVER created automatically. User confirmation required.'
    };
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  NotionDashboardCommand,
  getInstance: () => {
    if (!instance) {
      instance = new NotionDashboardCommand();
    }
    return instance;
  }
};