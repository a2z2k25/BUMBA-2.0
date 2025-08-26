/**
 * Notion MCP Adapter with Mock Fallback
 * 
 * Provides a unified interface for Notion operations that works in both
 * mock mode (for development) and MCP mode (for production).
 */

const EventEmitter = require('events');
const config = require('../config/notion-mirror.config');

class NotionMCPAdapter extends EventEmitter {
  constructor(options = {}) {
    super();
    this.mode = options.mode || config.mirror.mode;
    this.credentials = null;
    this.connected = false;
    this.mockData = new Map();
    this.requestQueue = [];
    this.rateLimiter = this.initRateLimiter();
    
    // Statistics tracking
    this.stats = {
      requests: 0,
      successful: 0,
      failed: 0,
      mocked: 0,
      rateLimited: 0
    };
  }

  /**
   * Initialize connection (mock or real)
   */
  async connect(credentials = null) {
    console.log(`[NotionMCPAdapter] Connecting in ${this.mode} mode...`);
    
    if (this.mode === 'mcp' && credentials) {
      return await this.connectMCP(credentials);
    } else {
      return await this.connectMock();
    }
  }

  /**
   * Connect to real MCP server (future implementation)
   */
  async connectMCP(credentials) {
    try {
      // Future implementation will connect to actual MCP server
      // For now, we'll validate the credentials structure
      if (!credentials.mcpServer || !credentials.apiKey) {
        throw new Error('Invalid MCP credentials');
      }
      
      this.credentials = credentials;
      this.connected = true;
      this.mode = 'mcp';
      
      this.emit('connected', { mode: 'mcp' });
      return { success: true, mode: 'mcp' };
    } catch (error) {
      console.error('[NotionMCPAdapter] MCP connection failed, falling back to mock');
      return await this.connectMock();
    }
  }

  /**
   * Connect in mock mode for development
   */
  async connectMock() {
    this.mode = 'mock';
    this.connected = true;
    
    // Initialize mock dashboard
    this.mockData.set('dashboard', {
      id: 'mock-dashboard-' + Date.now(),
      url: 'https://notion.so/mock-dashboard',
      title: '[Project Name] - Bumba Dashboard',
      created: new Date().toISOString(),
      sections: config.template.sections
    });
    
    this.emit('connected', { mode: 'mock' });
    return { 
      success: true, 
      mode: 'mock',
      dashboardUrl: this.mockData.get('dashboard').url
    };
  }

  /**
   * Create a new project dashboard page
   */
  async createProjectDashboard(projectData) {
    return await this.executeWithRateLimit(async () => {
      if (this.mode === 'mcp') {
        return await this.mcpRequest('createPage', {
          parent: { database_id: config.template.id },
          properties: this.formatProjectProperties(projectData)
        });
      } else {
        return this.mockCreateDashboard(projectData);
      }
    });
  }

  /**
   * Update a block in the dashboard
   */
  async updateBlock(blockId, content) {
    return await this.executeWithRateLimit(async () => {
      if (this.mode === 'mcp') {
        return await this.mcpRequest('updateBlock', {
          block_id: blockId,
          ...content
        });
      } else {
        return this.mockUpdateBlock(blockId, content);
      }
    });
  }

  /**
   * Append content to a section
   */
  async appendToSection(sectionId, content) {
    return await this.executeWithRateLimit(async () => {
      if (this.mode === 'mcp') {
        return await this.mcpRequest('appendBlock', {
          block_id: sectionId,
          children: Array.isArray(content) ? content : [content]
        });
      } else {
        return this.mockAppendContent(sectionId, content);
      }
    });
  }

  /**
   * Update task in the task database
   */
  async updateTask(taskData) {
    return await this.executeWithRateLimit(async () => {
      const formattedTask = this.formatTaskData(taskData);
      
      if (this.mode === 'mcp') {
        return await this.mcpRequest('updateDatabaseItem', {
          database_id: 'tasks',
          item_id: taskData.id,
          properties: formattedTask
        });
      } else {
        return this.mockUpdateTask(taskData.id, formattedTask);
      }
    });
  }

  /**
   * Embed a visualization
   */
  async embedVisualization(sectionId, visualization) {
    return await this.executeWithRateLimit(async () => {
      const embedData = {
        type: 'embed',
        embed: {
          url: visualization.dataURL || visualization.url,
          caption: visualization.title
        }
      };
      
      if (this.mode === 'mcp') {
        return await this.mcpRequest('appendBlock', {
          block_id: sectionId,
          children: [embedData]
        });
      } else {
        return this.mockEmbedVisualization(sectionId, embedData);
      }
    });
  }

  /**
   * Mock implementations for development
   */
  mockCreateDashboard(projectData) {
    const dashboard = {
      id: 'mock-page-' + Date.now(),
      url: `https://notion.so/mock/${projectData.name.toLowerCase().replace(/\s/g, '-')}`,
      title: `${projectData.name} - Bumba Dashboard`,
      created: new Date().toISOString(),
      properties: projectData,
      sections: { ...config.template.sections },
      tasks: [],
      visualizations: [],
      activity: []
    };
    
    this.mockData.set('dashboard', dashboard);
    this.stats.mocked++;
    
    console.log(`[MOCK] Created dashboard: ${dashboard.title}`);
    this.emit('dashboard:created', dashboard);
    
    return { success: true, data: dashboard };
  }

  mockUpdateBlock(blockId, content) {
    const dashboard = this.mockData.get('dashboard');
    if (!dashboard.blocks) dashboard.blocks = {};
    
    dashboard.blocks[blockId] = {
      ...dashboard.blocks[blockId],
      ...content,
      updated: new Date().toISOString()
    };
    
    this.stats.mocked++;
    console.log(`[MOCK] Updated block ${blockId}:`, content);
    this.emit('block:updated', { blockId, content });
    
    return { success: true, blockId, content };
  }

  mockAppendContent(sectionId, content) {
    const dashboard = this.mockData.get('dashboard');
    if (!dashboard.sections[sectionId]) {
      dashboard.sections[sectionId] = { content: [] };
    }
    
    const contents = Array.isArray(content) ? content : [content];
    dashboard.sections[sectionId].content.push(...contents);
    
    this.stats.mocked++;
    console.log(`[MOCK] Appended to section ${sectionId}:`, contents.length, 'items');
    this.emit('section:appended', { sectionId, itemCount: contents.length });
    
    return { success: true, sectionId, itemsAdded: contents.length };
  }

  mockUpdateTask(taskId, taskData) {
    const dashboard = this.mockData.get('dashboard');
    if (!dashboard.tasks) dashboard.tasks = [];
    
    const existingIndex = dashboard.tasks.findIndex(t => t.id === taskId);
    if (existingIndex >= 0) {
      dashboard.tasks[existingIndex] = { ...dashboard.tasks[existingIndex], ...taskData };
    } else {
      dashboard.tasks.push({ id: taskId, ...taskData });
    }
    
    this.stats.mocked++;
    console.log(`[MOCK] Updated task ${taskId}:`, taskData.status);
    this.emit('task:updated', { taskId, ...taskData });
    
    return { success: true, taskId, data: taskData };
  }

  mockEmbedVisualization(sectionId, embedData) {
    const dashboard = this.mockData.get('dashboard');
    if (!dashboard.visualizations) dashboard.visualizations = [];
    
    const viz = {
      id: 'viz-' + Date.now(),
      sectionId,
      ...embedData,
      created: new Date().toISOString()
    };
    
    dashboard.visualizations.push(viz);
    
    this.stats.mocked++;
    console.log(`[MOCK] Embedded visualization in section ${sectionId}:`, embedData.embed.caption);
    this.emit('visualization:embedded', viz);
    
    return { success: true, visualizationId: viz.id };
  }

  /**
   * Format task data for Notion
   */
  formatTaskData(task) {
    return {
      title: { title: [{ text: { content: task.title } }] },
      status: { select: { name: config.taskStatuses[task.status]?.label || task.status } },
      priority: { select: { name: config.priorities[task.priority]?.label || task.priority } },
      department: { select: { name: task.department } },
      assignee: { rich_text: [{ text: { content: task.assignee || 'Unassigned' } }] },
      progress: { number: task.progress || 0 },
      dependencies: { rich_text: [{ text: { content: Array.isArray(task.dependencies) ? task.dependencies.join(', ') : (task.dependencies?.blockedBy?.join(', ') || '') } }] },
      description: { rich_text: [{ text: { content: task.description || '' } }] }
    };
  }

  /**
   * Format project properties for Notion
   */
  formatProjectProperties(project) {
    return {
      title: { title: [{ text: { content: `${project.name} - Bumba Dashboard` } }] },
      status: { select: { name: project.status || 'Planning' } },
      timeline: { 
        date: {
          start: project.startDate || new Date().toISOString(),
          end: project.endDate || null
        }
      },
      priority: { select: { name: project.priority || 'P2 - Medium' } },
      lead: { rich_text: [{ text: { content: 'Product-Strategist Manager' } }] }
    };
  }

  /**
   * Rate limiter implementation
   */
  initRateLimiter() {
    const limit = config.rateLimit.notion;
    return {
      tokens: limit.requestsPerSecond,
      lastRefill: Date.now(),
      refillRate: limit.requestsPerSecond,
      maxTokens: limit.burstLimit,
      
      async acquire() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = (elapsed / 1000) * this.refillRate;
        
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
        
        if (this.tokens < 1) {
          const waitTime = (1 - this.tokens) / this.refillRate * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.acquire();
        }
        
        this.tokens--;
        return true;
      }
    };
  }

  /**
   * Execute with rate limiting
   */
  async executeWithRateLimit(operation) {
    await this.rateLimiter.acquire();
    this.stats.requests++;
    
    try {
      const result = await operation();
      this.stats.successful++;
      return result;
    } catch (error) {
      this.stats.failed++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Make MCP request (future implementation)
   */
  async mcpRequest(endpoint, data) {
    // Future implementation will make actual MCP requests
    // For now, return mock data
    console.log(`[MCP-STUB] Would call ${endpoint} with:`, data);
    return this.mockCreateDashboard(data);
  }

  /**
   * Get adapter statistics
   */
  getStats() {
    return {
      ...this.stats,
      mode: this.mode,
      connected: this.connected,
      uptime: this.connected ? Date.now() - this.connectedAt : 0
    };
  }

  /**
   * Get mock data for testing
   */
  getMockData() {
    if (this.mode !== 'mock') {
      return null;
    }
    return Object.fromEntries(this.mockData);
  }
}

module.exports = NotionMCPAdapter;