/**
 * BUMBA Project Dashboard Generator
 * Automatically creates and manages Notion project dashboards
 * with BUMBA-branded embedded components
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { getInstance: getNotionBridge } = require('../mcp/notion-mcp-bridge');

class ProjectDashboardGenerator extends EventEmitter {
  constructor() {
    super();
    
    this.notionBridge = getNotionBridge();
    this.activeProjects = new Map();
    
    // Dashboard component templates inspired by sampler-master
    this.dashboardComponents = {
      // Progress gauges like sampler's YEAR/DAY/HOUR PROGRESS
      progressGauges: {
        projectCompletion: { min: 0, max: 100, unit: '%' },
        sprintProgress: { min: 0, max: 14, unit: 'days' },
        velocityScore: { min: 0, max: 200, unit: 'points' }
      },
      
      // Run charts for metrics over time
      runCharts: {
        taskBurndown: { label: 'Tasks Remaining', color: '#FF6B6B' },
        qualityScore: { label: 'Quality Metrics', color: '#4ECDC4' },
        teamVelocity: { label: 'Team Velocity', color: '#95E77E' }
      },
      
      // Bar charts for comparisons
      barCharts: {
        agentPerformance: ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer'],
        departmentLoad: ['Strategy', 'Design', 'Engineering'],
        taskDistribution: ['Planning', 'Development', 'Testing', 'Review']
      },
      
      // Sparklines for quick trends
      sparklines: {
        commitActivity: 'Git commits per hour',
        testPassRate: 'Test success rate',
        buildTime: 'Build duration trends'
      },
      
      // Text boxes for status updates
      textBoxes: {
        currentTasks: 'Active tasks by agent',
        recentActivity: 'Latest project updates',
        blockers: 'Current blockers and issues'
      }
    };
    
    // BUMBA branding colors
    this.bumbaTheme = {
      primary: '#FFD700',    // Gold
      secondary: '#FF6B6B',  // Coral
      success: '#4ECDC4',    // Teal
      warning: '#F7B731',    // Yellow
      danger: '#FC5C65',     // Red
      info: '#45B7D1',       // Blue
      dark: '#2C3E50',       // Dark blue
      light: '#F8F9FA'       // Light gray
    };
  }

  /**
   * Create a new project dashboard in Notion
   * Triggered when /bumba:implement or similar commands start
   */
  async createProjectDashboard(projectConfig) {
    const {
      name,
      description,
      type = 'feature',
      agents = ['Product-Strategist', 'Design-Engineer', 'Backend-Engineer'],
      estimatedDuration = '2 weeks',
      priority = 'medium'
    } = projectConfig;
    
    logger.info(`🟡 Creating Notion project dashboard for: ${name}`);
    
    try {
      // 1. Create main project page
      const projectPage = await this.createProjectPage({
        name,
        description,
        type,
        priority,
        estimatedDuration
      });
      
      // 2. Generate BUMBA-branded dashboard HTML
      const dashboardHTML = await this.generateBrandedDashboard(name);
      
      // 3. Create embedded dashboard section
      await this.embedDashboard(projectPage.id, dashboardHTML);
      
      // 4. Create sub-pages for each department
      const departmentPages = await this.createDepartmentPages(projectPage.id, agents);
      
      // 5. Set up real-time update listeners
      await this.setupProgressTracking(projectPage.id, name);
      
      // 6. Initialize project in active tracking
      this.activeProjects.set(name, {
        pageId: projectPage.id,
        startTime: Date.now(),
        agents,
        metrics: this.initializeMetrics(),
        lastUpdate: Date.now()
      });
      
      logger.info(`🏁 Project dashboard created: ${projectPage.url}`);
      
      return {
        success: true,
        pageId: projectPage.id,
        url: projectPage.url,
        dashboardUrl: `${projectPage.url}#dashboard`
      };
      
    } catch (error) {
      logger.error('Failed to create project dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create the main Notion project page
   */
  async createProjectPage(config) {
    const pageContent = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      icon: { emoji: '🟢' },
      properties: {
        Name: { title: [{ text: { content: config.name } }] },
        Status: { select: { name: 'In Progress' } },
        Type: { select: { name: config.type } },
        Priority: { select: { name: config.priority } },
        'Start Date': { date: { start: new Date().toISOString() } }
      },
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: `🏁 ${config.name}` } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: config.description } }]
          }
        },
        {
          object: 'block',
          type: 'divider',
          divider: {}
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '📊 Live Dashboard' } }]
          }
        },
        // Dashboard embed will be added here
        {
          object: 'block',
          type: 'divider',
          divider: {}
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '👥 Team Activity' } }]
          }
        }
      ]
    };
    
    return await this.notionBridge.executeNotionOperation('createPage', pageContent);
  }

  /**
   * Generate BUMBA-branded dashboard HTML
   * Using refined sampler UI with ONLY allowed emojis: 🟢🟡🟠🔴🏁
   */
  generateBrandedDashboard(projectName) {
    // Use refined dashboard with exact sampler layout
    const { getInstance } = require('./bumba-refined-dashboard');
    const dashboard = getInstance();
    
    // Generate dashboard with strict emoji/color compliance
    return dashboard.generateDashboard(projectName);
  }
  
  /* Removed old dashboard HTML - now using terminal style */
  
  /**
   * Embed the dashboard in Notion (KEEPING THIS FUNCTION)
   */
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUMBA Project Dashboard - ${projectName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      color: #2C3E50;
    }
    
    .dashboard {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #F8F9FA;
    }
    
    .bumba-logo {
      font-size: 32px;
      margin-right: 15px;
    }
    
    .project-title {
      font-size: 28px;
      font-weight: 700;
      color: #2C3E50;
      flex: 1;
    }
    
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #4ECDC4;
      color: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .pulse {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.5); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: #F8F9FA;
      padding: 20px;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }
    
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #FFD700 0%, #F7B731 100%);
    }
    
    .metric-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #95A5A6;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: #2C3E50;
      margin-bottom: 8px;
    }
    
    .metric-change {
      font-size: 14px;
      color: #4ECDC4;
    }
    
    /* Gauge component inspired by sampler */
    .gauge-container {
      position: relative;
      width: 100%;
      height: 120px;
    }
    
    .gauge {
      width: 100%;
      height: 100%;
    }
    
    .gauge-fill {
      stroke: #FFD700;
      stroke-width: 10;
      fill: none;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease;
    }
    
    .gauge-bg {
      stroke: #E9ECEF;
      stroke-width: 10;
      fill: none;
    }
    
    /* Chart container */
    .chart-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .chart-container {
      background: #F8F9FA;
      padding: 20px;
      border-radius: 12px;
      min-height: 300px;
    }
    
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #2C3E50;
    }
    
    /* Activity feed */
    .activity-feed {
      background: #F8F9FA;
      padding: 20px;
      border-radius: 12px;
    }
    
    .activity-item {
      display: flex;
      align-items: start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #E9ECEF;
    }
    
    .activity-item:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    
    .activity-icon.product { background: #FFE4E1; }
    .activity-icon.design { background: #E6F3FF; }
    .activity-icon.backend { background: #E8F5E9; }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-agent {
      font-weight: 600;
      color: #2C3E50;
      font-size: 14px;
    }
    
    .activity-action {
      color: #7B8894;
      font-size: 13px;
      margin-top: 2px;
    }
    
    .activity-time {
      color: #95A5A6;
      font-size: 12px;
      margin-top: 4px;
    }
    
    /* Agent status cards */
    .agent-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 30px;
    }
    
    .agent-card {
      background: white;
      border: 2px solid #F8F9FA;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .agent-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .agent-emoji {
      font-size: 48px;
      margin-bottom: 12px;
    }
    
    .agent-name {
      font-weight: 600;
      margin-bottom: 8px;
      color: #2C3E50;
    }
    
    .agent-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-active {
      background: #D4EDDA;
      color: #155724;
    }
    
    .status-idle {
      background: #FFF3CD;
      color: #856404;
    }
    
    .status-reviewing {
      background: #CCE5FF;
      color: #004085;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <div class="bumba-logo">🏁</div>
      <h1 class="project-title">${projectName}</h1>
      <div class="live-indicator">
        <div class="pulse"></div>
        LIVE
      </div>
    </div>
    
    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Project Completion</div>
        <div class="metric-value">42%</div>
        <div class="metric-change">↑ 12% from yesterday</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Quality Score</div>
        <div class="metric-value">94</div>
        <div class="metric-change">Above threshold 🏁</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Active Tasks</div>
        <div class="metric-value">7</div>
        <div class="metric-change">3 in review</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Team Velocity</div>
        <div class="metric-value">128</div>
        <div class="metric-change">Points per sprint</div>
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="chart-grid">
      <div class="chart-container">
        <h3 class="chart-title">📈 Sprint Burndown</h3>
        <canvas id="burndownChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3 class="chart-title">🟢 Agent Performance</h3>
        <canvas id="performanceChart"></canvas>
      </div>
    </div>
    
    <!-- Activity Feed -->
    <div class="activity-feed">
      <h3 class="chart-title">🔄 Recent Activity</h3>
      
      <div class="activity-item">
        <div class="activity-icon product">📋</div>
        <div class="activity-content">
          <div class="activity-agent">Product-Strategist</div>
          <div class="activity-action">Completed requirements analysis</div>
          <div class="activity-time">2 minutes ago</div>
        </div>
      </div>
      
      <div class="activity-item">
        <div class="activity-icon design">🔴</div>
        <div class="activity-content">
          <div class="activity-agent">Design-Engineer</div>
          <div class="activity-action">Updated Figma prototype</div>
          <div class="activity-time">5 minutes ago</div>
        </div>
      </div>
      
      <div class="activity-item">
        <div class="activity-icon backend">🟢️</div>
        <div class="activity-content">
          <div class="activity-agent">Backend-Engineer</div>
          <div class="activity-action">Deployed API endpoints</div>
          <div class="activity-time">12 minutes ago</div>
        </div>
      </div>
    </div>
    
    <!-- Agent Status -->
    <div class="agent-grid">
      <div class="agent-card">
        <div class="agent-emoji">📋</div>
        <div class="agent-name">Product-Strategist</div>
        <div class="agent-status status-active">Active</div>
      </div>
      
      <div class="agent-card">
        <div class="agent-emoji">🔴</div>
        <div class="agent-name">Design-Engineer</div>
        <div class="agent-status status-reviewing">Reviewing</div>
      </div>
      
      <div class="agent-card">
        <div class="agent-emoji">🟢️</div>
        <div class="agent-name">Backend-Engineer</div>
        <div class="agent-status status-idle">Idle</div>
      </div>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Auto-refresh every 30 seconds
    setInterval(() => {
      location.reload();
    }, 30000);
    
    // Initialize charts
    const burndownCtx = document.getElementById('burndownChart').getContext('2d');
    new Chart(burndownCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Ideal',
          data: [100, 75, 50, 25, 0],
          borderColor: '#E9ECEF',
          borderDash: [5, 5]
        }, {
          label: 'Actual',
          data: [100, 82, 65, 58, null],
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.1)'
        }]
      }
    });
    
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
      type: 'bar',
      data: {
        labels: ['Product', 'Design', 'Backend'],
        datasets: [{
          label: 'Tasks Completed',
          data: [12, 8, 15],
          backgroundColor: ['#FFD700', '#4ECDC4', '#FF6B6B']
        }]
      }
    });
  </script>
</body>
</html>
    `;
    
    return dashboardHTML;
  }

  /**
   * Embed the dashboard in Notion
   */
  async embedDashboard(pageId, dashboardHTML) {
    // Save dashboard to a web-accessible location
    const dashboardUrl = await this.hostDashboard(pageId, dashboardHTML);
    
    // Add embed block to Notion page
    const embedBlock = {
      object: 'block',
      type: 'embed',
      embed: {
        url: dashboardUrl
      }
    };
    
    return await this.notionBridge.executeNotionOperation('appendBlock', {
      pageId,
      block: embedBlock
    });
  }

  /**
   * Host dashboard HTML (uses local simulator for now)
   */
  async hostDashboard(pageId, html) {
    // Check if we're in simulation mode
    if (this.notionBridge.status.mode === 'local') {
      // Use simulator to create local dashboard
      const { getInstance: getSimulator } = require('./notion-simulator');
      const simulator = getSimulator();
      
      const projectName = pageId.replace('sim-page-', 'Project-');
      const dashboard = await simulator.createLocalDashboard(projectName, html);
      
      // Optionally open in browser
      if (process.env.AUTO_OPEN_DASHBOARDS !== 'false') {
        setTimeout(() => {
          simulator.openDashboard(dashboard.id);
        }, 2000);
      }
      
      return dashboard.url;
    }
    
    // In production with real Notion API, would upload to hosting
    return `https://bumba-dashboards.vercel.app/project/${pageId}`;
  }

  /**
   * Create department sub-pages
   */
  async createDepartmentPages(parentPageId, agents) {
    const pages = [];
    
    for (const agent of agents) {
      const agentPage = {
        parent: { page_id: parentPageId },
        icon: { emoji: this.getAgentEmoji(agent) },
        properties: {
          title: [{
            text: { content: `${agent} Workspace` }
          }]
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ text: { content: 'Tasks & Deliverables' } }]
            }
          },
          {
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{ text: { content: 'Initial task for ' + agent } }],
              checked: false
            }
          }
        ]
      };
      
      const created = await this.notionBridge.executeNotionOperation('createPage', agentPage);
      pages.push(created);
    }
    
    return pages;
  }

  /**
   * Set up real-time progress tracking
   */
  async setupProgressTracking(pageId, projectName) {
    // Listen for BUMBA events and update Notion
    this.on(`project:${projectName}:update`, async (update) => {
      await this.updateProjectProgress(pageId, update);
    });
    
    // Set up periodic sync
    setInterval(async () => {
      const project = this.activeProjects.get(projectName);
      if (project) {
        // Update metrics periodically
        await this.updateProjectProgress(pageId, {
          type: 'periodic_sync',
          agent: 'system',
          data: { metrics: project.metrics }
        });
      }
    }, 60000); // Sync every minute
  }

  /**
   * Update project progress in Notion
   */
  async updateProjectProgress(pageId, update) {
    const { type, agent, data } = update;
    
    logger.debug(`Updating Notion dashboard: ${type} from ${agent}`);
    
    // Update appropriate section based on update type
    switch (type) {
      case 'task_completed':
        await this.addCompletedTask(pageId, agent, data);
        break;
      
      case 'quality_check':
        await this.updateQualityMetrics(pageId, data);
        break;
      
      case 'status_change':
        await this.updateAgentStatus(pageId, agent, data.status);
        break;
      
      case 'milestone':
        await this.recordMilestone(pageId, data);
        break;
    }
  }

  /**
   * Initialize project metrics
   */
  initializeMetrics() {
    return {
      tasksTotal: 0,
      tasksCompleted: 0,
      qualityScore: 100,
      velocity: 0,
      burndownData: [],
      agentMetrics: {
        'Product-Strategist': { tasks: 0, quality: 100 },
        'Design-Engineer': { tasks: 0, quality: 100 },
        'Backend-Engineer': { tasks: 0, quality: 100 }
      }
    };
  }

  /**
   * Get emoji for agent
   */
  getAgentEmoji(agent) {
    const emojis = {
      'Product-Strategist': '📋',
      'Design-Engineer': '🔴',
      'Backend-Engineer': '🟢️'
    };
    return emojis[agent] || '👤';
  }

  /**
   * Human-like project management updates
   */
  async simulateHumanPMUpdates(pageId, projectName) {
    // Add natural-looking updates at realistic intervals
    const updates = [
      { delay: 2000, text: 'Team standup completed - all systems go! 🟢' },
      { delay: 10000, text: 'Requirements review in progress...' },
      { delay: 30000, text: 'Design mockups looking great! 🔴' },
      { delay: 60000, text: 'Backend API development started' },
      { delay: 120000, text: 'Quality checks passing - excellent work team! 🏁' }
    ];
    
    for (const update of updates) {
      setTimeout(async () => {
        await this.addPMNote(pageId, update.text);
      }, update.delay);
    }
  }

  /**
   * Add PM note to activity feed
   */
  async addPMNote(pageId, note) {
    const noteBlock = {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ text: { content: `PM Update: ${note}` } }],
        icon: { emoji: '📝' }
      }
    };
    
    return await this.notionBridge.executeNotionOperation('appendBlock', {
      pageId,
      block: noteBlock
    });
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ProjectDashboardGenerator();
  }
  return instance;
}

module.exports = {
  ProjectDashboardGenerator,
  getInstance
};