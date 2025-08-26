/**
 * BUMBA Notion Simulator
 * Provides a local simulation of Notion functionality
 * for demonstration and development without API/MCP setup
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class NotionSimulator extends EventEmitter {
  constructor() {
    super();
    
    // Simulated database storage
    this.simulatedPages = new Map();
    this.simulatedDashboards = new Map();
    this.localStoragePath = path.join(process.cwd(), '.bumba', 'notion-simulation');
    
    // Initialize local storage
    this.initializeStorage();
    
    logger.info('🔴 Notion Simulator initialized (no API required)');
  }

  async initializeStorage() {
    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, 'dashboards'), { recursive: true });
      await fs.mkdir(path.join(this.localStoragePath, 'pages'), { recursive: true });
    } catch (error) {
      logger.debug('Storage directories already exist');
    }
  }

  /**
   * Simulate creating a Notion page
   */
  async createPage(pageContent) {
    const pageId = `sim-page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const simulatedPage = {
      id: pageId,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      url: `http://localhost:3000/notion-sim/${pageId}`,
      properties: pageContent.properties || {},
      content: pageContent.children || [],
      parent: pageContent.parent,
      icon: pageContent.icon
    };
    
    // Store in memory
    this.simulatedPages.set(pageId, simulatedPage);
    
    // Save to local file
    await this.savePage(pageId, simulatedPage);
    
    logger.info(`📄 Simulated Notion page created: ${pageId}`);
    
    return simulatedPage;
  }

  /**
   * Save page to local storage
   */
  async savePage(pageId, pageData) {
    const filePath = path.join(this.localStoragePath, 'pages', `${pageId}.json`);
    await fs.writeFile(filePath, JSON.stringify(pageData, null, 2));
  }

  /**
   * Create a local HTML dashboard that can be viewed in browser
   */
  async createLocalDashboard(projectName, dashboardHTML) {
    const dashboardId = `dashboard-${Date.now()}`;
    const fileName = `${dashboardId}.html`;
    const filePath = path.join(this.localStoragePath, 'dashboards', fileName);
    
    // Enhance HTML with auto-refresh and local data
    const enhancedHTML = this.enhanceDashboardHTML(dashboardHTML, projectName, dashboardId);
    
    // Save to file
    await fs.writeFile(filePath, enhancedHTML);
    
    // Store reference
    this.simulatedDashboards.set(dashboardId, {
      id: dashboardId,
      projectName,
      filePath,
      localUrl: `file://${filePath}`,
      created: new Date().toISOString()
    });
    
    logger.info(`🔴 Local dashboard created: ${filePath}`);
    
    return {
      id: dashboardId,
      url: `file://${filePath}`,
      filePath
    };
  }

  /**
   * Enhance dashboard HTML with live data simulation
   */
  enhanceDashboardHTML(html, projectName, dashboardId) {
    // Add WebSocket simulation for real-time updates
    const enhancementScript = `
    <script>
      // Simulated real-time updates
      let projectData = {
        completion: 0,
        quality: 100,
        activeTasks: 0,
        velocity: 0,
        activities: []
      };
      
      // Simulate progress updates
      function simulateProgress() {
        // Update completion
        if (projectData.completion < 100) {
          projectData.completion += Math.random() * 5;
          document.querySelector('.metric-value').textContent = Math.floor(projectData.completion) + '%';
        }
        
        // Update quality score
        projectData.quality = 90 + Math.floor(Math.random() * 10);
        document.querySelectorAll('.metric-value')[1].textContent = projectData.quality;
        
        // Update active tasks
        projectData.activeTasks = Math.floor(Math.random() * 10) + 3;
        document.querySelectorAll('.metric-value')[2].textContent = projectData.activeTasks;
        
        // Update velocity
        projectData.velocity = 100 + Math.floor(Math.random() * 50);
        document.querySelectorAll('.metric-value')[3].textContent = projectData.velocity;
      }
      
      // Simulate activity feed updates
      function addActivity() {
        const agents = [
          { name: 'Product-Strategist', icon: '📋', color: 'product' },
          { name: 'Design-Engineer', icon: '🔴', color: 'design' },
          { name: 'Backend-Engineer', icon: '🟢️', color: 'backend' }
        ];
        
        const actions = [
          'Completed task analysis',
          'Updated documentation',
          'Reviewed code changes',
          'Deployed to staging',
          'Created design mockups',
          'Validated requirements',
          'Optimized performance',
          'Fixed critical bug'
        ];
        
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        const activityHTML = \`
          <div class="activity-item" style="animation: slideIn 0.3s ease">
            <div class="activity-icon \${agent.color}">\${agent.icon}</div>
            <div class="activity-content">
              <div class="activity-agent">\${agent.name}</div>
              <div class="activity-action">\${action}</div>
              <div class="activity-time">Just now</div>
            </div>
          </div>
        \`;
        
        const feed = document.querySelector('.activity-feed');
        if (feed) {
          const items = feed.querySelectorAll('.activity-item');
          if (items.length > 5) {
            items[items.length - 1].remove();
          }
          feed.insertAdjacentHTML('afterbegin', activityHTML);
        }
      }
      
      // Update agent statuses
      function updateAgentStatus() {
        const statuses = ['status-active', 'status-idle', 'status-reviewing'];
        document.querySelectorAll('.agent-status').forEach(status => {
          status.className = 'agent-status ' + statuses[Math.floor(Math.random() * statuses.length)];
          status.textContent = status.classList.contains('status-active') ? 'Active' :
                              status.classList.contains('status-idle') ? 'Idle' : 'Reviewing';
        });
      }
      
      // Animation styles
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      \`;
      document.head.appendChild(style);
      
      // Run simulations
      setInterval(simulateProgress, 3000);
      setInterval(addActivity, 8000);
      setInterval(updateAgentStatus, 10000);
      
      // Initial updates
      simulateProgress();
      addActivity();
      
      console.log('🏁 BUMBA Dashboard Simulator Running - Project: ${projectName}');
    </script>
    `;
    
    // Insert before closing body tag
    return html.replace('</body>', enhancementScript + '</body>');
  }

  /**
   * Simulate Notion API operations
   */
  async executeOperation(operation, params) {
    logger.debug(`🔴 Simulating Notion operation: ${operation}`);
    
    switch (operation) {
      case 'createPage':
        return await this.createPage(params);
      
      case 'updatePage':
        return await this.updatePage(params.pageId, params);
      
      case 'appendBlock':
        return await this.appendBlock(params.pageId, params.block);
      
      case 'query':
        return await this.queryDatabase(params);
      
      default:
        logger.warn(`Unknown operation: ${operation}`);
        return { simulated: true, operation, params };
    }
  }

  /**
   * Update a simulated page
   */
  async updatePage(pageId, updates) {
    const page = this.simulatedPages.get(pageId);
    if (!page) {
      return { error: 'Page not found' };
    }
    
    // Update properties
    if (updates.properties) {
      Object.assign(page.properties, updates.properties);
    }
    
    page.last_edited_time = new Date().toISOString();
    
    // Save updated page
    await this.savePage(pageId, page);
    
    return page;
  }

  /**
   * Append block to page
   */
  async appendBlock(pageId, block) {
    const page = this.simulatedPages.get(pageId);
    if (!page) {
      return { error: 'Page not found' };
    }
    
    page.content.push(block);
    page.last_edited_time = new Date().toISOString();
    
    await this.savePage(pageId, page);
    
    return { success: true, blockId: `block-${Date.now()}` };
  }

  /**
   * Query simulated database
   */
  async queryDatabase(params) {
    const results = [];
    
    for (const [id, page] of this.simulatedPages) {
      // Simple filter simulation
      if (params.filter) {
        // Add filtering logic here if needed
      }
      results.push(page);
    }
    
    return {
      results,
      has_more: false,
      next_cursor: null
    };
  }

  /**
   * Generate a status report
   */
  async generateStatusReport() {
    const report = {
      mode: 'simulation',
      totalPages: this.simulatedPages.size,
      totalDashboards: this.simulatedDashboards.size,
      dashboards: [],
      message: 'Running in simulation mode - no Notion API connected'
    };
    
    // Add dashboard info
    for (const [id, dashboard] of this.simulatedDashboards) {
      report.dashboards.push({
        id,
        project: dashboard.projectName,
        url: dashboard.localUrl,
        created: dashboard.created
      });
    }
    
    return report;
  }

  /**
   * Open dashboard in browser
   */
  async openDashboard(dashboardId) {
    const dashboard = this.simulatedDashboards.get(dashboardId);
    if (!dashboard) {
      return { error: 'Dashboard not found' };
    }
    
    // Use system command to open in default browser
    const { exec } = require('child_process');
    const command = process.platform === 'darwin' ? 'open' :
                   process.platform === 'win32' ? 'start' : 'xdg-open';
    
    exec(`${command} "${dashboard.filePath}"`, (error) => {
      if (error) {
        logger.error('Failed to open dashboard:', error);
      } else {
        logger.info(`📊 Dashboard opened in browser: ${dashboard.projectName}`);
      }
    });
    
    return { success: true, url: dashboard.localUrl };
  }

  /**
   * List all simulated dashboards
   */
  async listDashboards() {
    const dashboards = [];
    
    for (const [id, dashboard] of this.simulatedDashboards) {
      dashboards.push({
        id,
        name: dashboard.projectName,
        url: dashboard.localUrl,
        created: dashboard.created
      });
    }
    
    return dashboards;
  }

  /**
   * Clean up old simulations
   */
  async cleanup() {
    try {
      const files = await fs.readdir(path.join(this.localStoragePath, 'dashboards'));
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const file of files) {
        const filePath = path.join(this.localStoragePath, 'dashboards', file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.debug(`Cleaned up old dashboard: ${file}`);
        }
      }
    } catch (error) {
      logger.debug('Cleanup error:', error);
    }
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new NotionSimulator();
  }
  return instance;
}

module.exports = {
  NotionSimulator,
  getInstance
};