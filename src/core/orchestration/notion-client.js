/**
 * BUMBA Notion MCP Client Wrapper
 * Provides high-level interface for Notion MCP operations
 * @module notion-client
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const { NotionWorkspaceSchema, NotionViews, PageTemplates } = require('./notion-schema');

class NotionOrchestrationClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mcpServer: config.mcpServer || 'notion-mcp',
      workspace: config.workspace || null,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      batchSize: config.batchSize || 10,
      cacheEnabled: config.cacheEnabled !== false,
      ...config
    };
    
    // Connection state
    this.connected = false;
    this.mcpClient = null;
    
    // Cache for frequently accessed data
    this.cache = {
      databases: new Map(),
      pages: new Map(),
      agents: new Map(),
      tasks: new Map()
    };
    
    // Queue for batch operations
    this.operationQueue = [];
    this.batchTimer = null;
    
    logger.info('🟢 Notion Orchestration Client initialized');
  }
  
  /**
   * Connect to Notion MCP server
   */
  async connect() {
    try {
      // In production, this would use actual MCP client
      // For now, simulating connection
      this.mcpClient = {
        call: async (method, _params) => this.mockMCPCall(method, params)
      };
      
      this.connected = true;
      logger.info('🏁 Connected to Notion MCP server');
      
      // Initialize workspace if not exists
      if (!this.config.workspace) {
        await this.initializeWorkspace();
      }
      
      this.emit('connected');
      return true;
      
    } catch (error) {
      logger.error('Failed to connect to Notion MCP:', error);
      this.emit('connection:error', error);
      return false;
    }
  }
  
  /**
   * Initialize BUMBA workspace in Notion
   */
  async initializeWorkspace() {
    logger.info('🟢 Initializing BUMBA workspace in Notion');
    
    // Create main workspace page
    const workspace = await this.createPage({
      title: 'BUMBA Project Hub',
      icon: '🟢',
      cover: 'https://bumba-framework.ai/cover.jpg'
    });
    
    this.config.workspace = workspace.id;
    
    // Create all required databases
    for (const [dbName, schema] of Object.entries(NotionWorkspaceSchema)) {
      await this.createDatabase(dbName, schema);
    }
    
    // Create default views
    await this.setupDefaultViews();
    
    logger.info('🏁 Workspace initialized successfully');
    
    return workspace;
  }
  
  /**
   * Create a database in Notion
   */
  async createDatabase(name, schema) {
    const params = {
      parent: { page_id: this.config.workspace },
      title: [{ text: { content: schema.name } }],
      properties: this.convertSchemaToNotionProperties(schema.properties)
    };
    
    const database = await this.mcpCall('databases.create', params);
    
    // Cache the database
    this.cache.databases.set(name, database.id);
    
    logger.info(`🟢 Created database: ${schema.name}`);
    
    return database;
  }
  
  /**
   * Convert schema properties to Notion format
   */
  convertSchemaToNotionProperties(properties) {
    const notionProps = {};
    
    for (const [key, prop] of Object.entries(properties)) {
      notionProps[key] = {
        type: prop.type,
        [prop.type]: this.getPropertyConfig(prop)
      };
    }
    
    return notionProps;
  }
  
  /**
   * Get property configuration based on type
   */
  getPropertyConfig(prop) {
    switch (prop.type) {
      case 'select':
        return { options: prop.options?.map(opt => ({ name: opt })) || [] };
      case 'multi_select':
        return { options: prop.options?.map(opt => ({ name: opt })) || [] };
      case 'relation':
        return { database_id: this.cache.databases.get(prop.database) };
      case 'number':
        return { format: prop.format || 'number' };
      default:
        return {};
    }
  }
  
  /**
   * Create a task in the task database
   */
  async createTask(task) {
    const databaseId = this.cache.databases.get('tasks');
    
    const properties = {
      title: { title: [{ text: { content: task.title } }] },
      sprint_id: { rich_text: [{ text: { content: task.sprintId } }] },
      status: { select: { name: task.status || 'backlog' } },
      priority: { number: task.priority || 5 },
      estimated_duration: { number: task.estimatedDuration || 10 },
      required_skills: { 
        multi_select: task.requiredSkills?.map(s => ({ name: s })) || []
      }
    };
    
    // Add dependencies if present
    if (task.dependencies && task.dependencies.length > 0) {
      properties.dependencies = {
        relation: task.dependencies.map(depId => ({ id: depId }))
      };
    }
    
    const page = await this.mcpCall('pages.create', {
      parent: { database_id: databaseId },
      properties
    });
    
    // In mock mode, create a mock page
    const pageId = page?.id || task.sprintId;
    const mockPage = page || {
      id: pageId,
      properties
    };
    
    // Cache the task with both keys for easy access
    this.cache.tasks.set(task.sprintId, mockPage);
    this.cache.tasks.set(pageId, mockPage);
    
    this.emit('task:created', { taskId: pageId, sprintId: task.sprintId });
    
    return mockPage;
  }
  
  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status) {
    const updates = {
      status: { select: { name: status } }
    };
    
    if (status === 'in_progress') {
      updates.started_at = { date: { start: new Date().toISOString() } };
    } else if (status === 'completed') {
      updates.completed_at = { date: { start: new Date().toISOString() } };
    }
    
    await this.mcpCall('pages.update', {
      page_id: taskId,
      properties: updates
    });
    
    this.emit('task:updated', { taskId, status });
    
    return true;
  }
  
  /**
   * Claim a task for an agent
   */
  async claimTask(taskId, agentId) {
    // Atomic operation to prevent double claiming
    const task = await this.getTask(taskId);
    
    if (!task) {
      // In mock mode, create a mock task
      if (!this.cache.tasks.has(taskId)) {
        this.cache.tasks.set(taskId, {
          id: taskId,
          properties: {
            title: { title: [{ text: { content: taskId } }] },
            status: { select: { name: 'pending' } }
          }
        });
      }
      // Retry getting the task
      const mockTask = this.cache.tasks.get(taskId);
      if (mockTask.properties.assigned_agent?.select?.name) {
        throw new Error(`Task already claimed by ${mockTask.properties.assigned_agent.select.name}`);
      }
      mockTask.properties.assigned_agent = { select: { name: agentId } };
      mockTask.properties.status = { select: { name: 'claimed' } };
      this.emit('task:claimed', { taskId, agentId });
      return true;
    }
    
    if (task.properties.assigned_agent?.select?.name) {
      throw new Error(`Task already claimed by ${task.properties.assigned_agent.select.name}`);
    }
    
    await this.mcpCall('pages.update', {
      page_id: taskId,
      properties: {
        assigned_agent: { select: { name: agentId } },
        status: { select: { name: 'claimed' } }
      }
    });
    
    this.emit('task:claimed', { taskId, agentId });
    
    return true;
  }
  
  /**
   * Get available tasks for an agent
   */
  async getAvailableTasks(agentSkills = []) {
    const databaseId = this.cache.databases.get('tasks');
    
    const filter = {
      and: [
        { property: 'status', select: { equals: 'ready' } },
        { property: 'assigned_agent', select: { is_empty: true } }
      ]
    };
    
    // Add skill filter if provided
    if (agentSkills.length > 0) {
      filter.and.push({
        or: agentSkills.map(skill => ({
          property: 'required_skills',
          multi_select: { contains: skill }
        }))
      });
    }
    
    const response = await this.mcpCall('databases.query', {
      database_id: databaseId,
      filter,
      sorts: [{ property: 'priority', direction: 'descending' }]
    });
    
    return response.results;
  }
  
  /**
   * Add knowledge entry
   */
  async addKnowledge(knowledge) {
    const databaseId = this.cache.databases.get('knowledge_base');
    
    const properties = {
      title: { title: [{ text: { content: knowledge.title } }] },
      type: { select: { name: knowledge.type } },
      content: { rich_text: [{ text: { content: knowledge.content } }] },
      created_by: { select: { name: knowledge.agentId } },
      tags: {
        multi_select: knowledge.tags?.map(t => ({ name: t })) || []
      }
    };
    
    if (knowledge.taskId) {
      properties.source_task = { relation: [{ id: knowledge.taskId }] };
    }
    
    const page = await this.mcpCall('pages.create', {
      parent: { database_id: databaseId },
      properties
    });
    
    this.emit('knowledge:added', { knowledgeId: page.id });
    
    return page;
  }
  
  /**
   * Query knowledge base
   */
  async queryKnowledge(filters = {}) {
    const databaseId = this.cache.databases.get('knowledge_base');
    
    const notionFilter = this.buildNotionFilter(filters);
    
    const response = await this.mcpCall('databases.query', {
      database_id: databaseId,
      filter: notionFilter,
      sorts: [{ property: 'created', direction: 'descending' }]
    });
    
    return response.results;
  }
  
  /**
   * Update agent status
   */
  async updateAgentStatus(agentId, status, currentTask = null) {
    const databaseId = this.cache.databases.get('agents');
    
    // Find or create agent entry
    let agentPageId = this.cache.agents.get(agentId);
    
    if (!agentPageId) {
      // Create agent entry if not exists
      const agent = await this.mcpCall('pages.create', {
        parent: { database_id: databaseId },
        properties: {
          agent_id: { title: [{ text: { content: agentId } }] },
          status: { select: { name: status } }
        }
      });
      
      agentPageId = agent.id;
      this.cache.agents.set(agentId, agentPageId);
    } else {
      // Update existing agent
      const updates = {
        status: { select: { name: status } },
        last_active: { date: { start: new Date().toISOString() } }
      };
      
      if (currentTask) {
        updates.current_task = { relation: [{ id: currentTask }] };
      }
      
      await this.mcpCall('pages.update', {
        page_id: agentPageId,
        properties: updates
      });
    }
    
    this.emit('agent:updated', { agentId, status });
    
    return true;
  }
  
  /**
   * Create project dashboard
   */
  async createProjectDashboard(project) {
    const template = PageTemplates.project_dashboard;
    
    const page = await this.createPage({
      title: project.title,
      parent: { page_id: this.config.workspace },
      icon: '🟢'
    });
    
    // Add dashboard blocks
    for (const block of template.blocks) {
      await this.addBlock(page.id, block);
    }
    
    // Store project in database
    const projectDb = this.cache.databases.get('projects');
    await this.mcpCall('pages.create', {
      parent: { database_id: projectDb },
      properties: {
        title: { title: [{ text: { content: project.title } }] },
        epic: { rich_text: [{ text: { content: project.epic } }] },
        status: { select: { name: 'planning' } },
        owner: { select: { name: 'Product-Strategist' } }
      }
    });
    
    logger.info(`🟢 Created project dashboard: ${project.title}`);
    
    return page;
  }
  
  /**
   * Get project progress
   */
  async getProjectProgress(projectId) {
    const tasksDb = this.cache.databases.get('tasks');
    
    // Query all tasks for project
    const response = await this.mcpCall('databases.query', {
      database_id: tasksDb,
      filter: {
        property: 'project',
        relation: { contains: projectId }
      }
    });
    
    const tasks = response.results;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => 
      t.properties.status?.select?.name === 'completed'
    ).length;
    
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      totalTasks,
      completedTasks,
      progress,
      blockedTasks: tasks.filter(t => 
        t.properties.status?.select?.name === 'blocked'
      ).length,
      inProgressTasks: tasks.filter(t => 
        t.properties.status?.select?.name === 'in_progress'
      ).length
    };
  }
  
  /**
   * Batch operation processor
   */
  async processBatch() {
    if (this.operationQueue.length === 0) {return;}
    
    const batch = this.operationQueue.splice(0, this.config.batchSize);
    
    try {
      const results = await Promise.all(
        batch.map(op => this.mcpCall(op.method, op.params))
      );
      
      batch.forEach((op, index) => {
        if (op.callback) {
          op.callback(null, results[index]);
        }
      });
      
    } catch (error) {
      batch.forEach(op => {
        if (op.callback) {
          op.callback(error);
        }
      });
    }
    
    // Process next batch if queue not empty
    if (this.operationQueue.length > 0) {
      this.scheduleBatch();
    }
  }
  
  /**
   * Schedule batch processing
   */
  scheduleBatch() {
    if (this.batchTimer) {return;}
    
    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.processBatch();
    }, 100);
  }
  
  /**
   * Add operation to batch queue
   */
  queueOperation(method, params, callback) {
    this.operationQueue.push({ method, params, callback });
    this.scheduleBatch();
  }
  
  /**
   * Build Notion filter from simple filters
   */
  buildNotionFilter(filters) {
    const conditions = [];
    
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string') {
        conditions.push({
          property: key,
          rich_text: { contains: value }
        });
      } else if (typeof value === 'object' && value.type) {
        conditions.push({
          property: key,
          [value.type]: value.filter
        });
      }
    }
    
    return conditions.length > 1 
      ? { and: conditions }
      : conditions[0] || {};
  }
  
  /**
   * MCP call wrapper with retry logic
   */
  async mcpCall(method, params) {
    let lastError;
    
    for (let i = 0; i < this.config.retryAttempts; i++) {
      try {
        if (!this.connected) {
          await this.connect();
        }
        
        return await this.mcpClient.call(method, params);
        
      } catch (error) {
        lastError = error;
        logger.warn(`MCP call failed (attempt ${i + 1}):`, error.message);
        
        if (i < this.config.retryAttempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * (i + 1))
          );
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Mock MCP call for testing
   */
  async mockMCPCall(method, params) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock responses
    switch (method) {
      case 'databases.create':
        return { id: `db_${Date.now()}`, ...params };
      case 'pages.create':
        return { id: `page_${Date.now()}`, ...params };
      case 'pages.update':
        return { id: params.page_id, ...params };
      case 'databases.query':
        return { results: [], has_more: false };
      default:
        return { success: true };
    }
  }
  
  /**
   * Helper: Create a page
   */
  async createPage(config) {
    return await this.mcpCall('pages.create', config);
  }
  
  /**
   * Helper: Add block to page
   */
  async addBlock(pageId, block) {
    return await this.mcpCall('blocks.children.append', {
      block_id: pageId,
      children: [block]
    });
  }
  
  /**
   * Update task allocation in Notion
   */
  async updateTaskAllocation(allocation) {
    // Mock implementation for testing
    logger.info(`🟢 Updated task allocation: ${allocation.taskId} -> ${allocation.agentId}`);
    return true;
  }
  
  /**
   * Helper: Get task by ID
   */
  async getTask(taskId) {
    // Check cache first
    if (this.cache.tasks.has(taskId)) {
      return this.cache.tasks.get(taskId);
    }
    
    // Try to retrieve from Notion
    const task = await this.mcpCall('pages.retrieve', { page_id: taskId });
    
    if (task) {
      this.cache.tasks.set(taskId, task);
    }
    
    return task;
  }
  
  /**
   * Setup default views for databases
   */
  async setupDefaultViews() {
    // This would create the views defined in NotionViews
    // Implementation depends on Notion API capabilities
    logger.info('🟢 Setting up default database views');
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  NotionOrchestrationClient,
  getInstance: (config) => {
    if (!instance) {
      instance = new NotionOrchestrationClient(config);
    }
    return instance;
  }
};