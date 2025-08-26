/**
 * Notion Mock Provider - Fixed Version
 * Provides full Notion API compatibility in development mode
 */

const { EventEmitter } = require('events');
const { logger } = require('../../logging/bumba-logger');

class NotionMockProvider extends EventEmitter {
  constructor() {
    super();
    
    // Storage
    this.databasesStore = new Map();
    this.pagesStore = new Map();
    this.blocksStore = new Map();
    this.usersStore = new Map();
    
    // Mock data
    this.data = {
      databases: [],
      pages: [],
      blocks: [],
      comments: []
    };
    
    // Initialize mock data
    this.initializeMockData();
    
    // Set up API methods
    this.setupAPIs();
    
    logger.info('🔴 Notion Mock Provider initialized');
  }
  
  initializeMockData() {
    // Create mock user
    this.usersStore.set('mock-user-1', {
      object: 'user',
      id: 'mock-user-1',
      type: 'person',
      person: { email: 'user@example.com' },
      name: 'Mock User',
      avatar_url: null
    });
    
    // Create mock database
    const mockDb = {
      object: 'database',
      id: 'mock-db-dashboard',
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      title: [{
        type: 'text',
        text: { content: 'BUMBA Dashboard (Mock)' }
      }],
      properties: {
        Name: { id: 'title', type: 'title', title: {} },
        Status: { 
          id: 'status', 
          type: 'select',
          select: {
            options: [
              { id: '1', name: 'To Do', color: 'gray' },
              { id: '2', name: 'In Progress', color: 'blue' },
              { id: '3', name: 'Done', color: 'green' }
            ]
          }
        },
        Department: {
          id: 'dept',
          type: 'select',
          select: {
            options: [
              { id: 'd1', name: 'Strategic', color: 'purple' },
              { id: 'd2', name: 'Experience', color: 'blue' },
              { id: 'd3', name: 'Technical', color: 'green' }
            ]
          }
        }
      },
      parent: { type: 'workspace', workspace: true },
      url: 'https://notion.so/mock-dashboard'
    };
    
    this.databasesStore.set(mockDb.id, mockDb);
    this.data.databases.push(mockDb);
  }
  
  setupAPIs() {
    // Databases API
    this.databases = {
      create: this.createDatabase.bind(this),
      retrieve: this.retrieveDatabase.bind(this),
      update: this.updateDatabase.bind(this),
      query: this.queryDatabase.bind(this)
    };
    
    // Pages API
    this.pages = {
      create: this.createPage.bind(this),
      retrieve: this.retrievePage.bind(this),
      update: this.updatePage.bind(this)
    };
    
    // Blocks API
    this.blocks = {
      children: {
        append: this.appendBlocks.bind(this),
        list: this.listBlocks.bind(this)
      },
      retrieve: this.retrieveBlock.bind(this),
      update: this.updateBlock.bind(this),
      delete: this.deleteBlock.bind(this)
    };
    
    // Users API
    this.users = {
      retrieve: this.retrieveUser.bind(this),
      list: this.listUsers.bind(this),
      me: this.getCurrentUser.bind(this)
    };
    
    // Search API
    this.search = this.searchContent.bind(this);
  }
  
  // Database methods
  async createDatabase(params) {
    const database = {
      object: 'database',
      id: `mock-db-${Date.now()}`,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      title: params.title || [],
      properties: params.properties || {},
      parent: params.parent,
      url: `https://notion.so/mock-db-${Date.now()}`
    };
    
    this.databasesStore.set(database.id, database);
    this.data.databases.push(database);
    
    logger.debug(`📊 Created mock database: ${database.id}`);
    return database;
  }
  
  async retrieveDatabase(params) {
    const database = this.databasesStore.get(params.database_id);
    if (!database) {
      throw new Error(`Database ${params.database_id} not found`);
    }
    return database;
  }
  
  async updateDatabase(params) {
    const database = this.databasesStore.get(params.database_id);
    if (!database) {
      throw new Error(`Database ${params.database_id} not found`);
    }
    
    Object.assign(database, params);
    database.last_edited_time = new Date().toISOString();
    return database;
  }
  
  async queryDatabase(params) {
    const database = this.databasesStore.get(params.database_id);
    if (!database) {
      throw new Error(`Database ${params.database_id} not found`);
    }
    
    const pages = this.data.pages.filter(p => p.parent?.database_id === params.database_id);
    
    return {
      object: 'list',
      results: pages.slice(0, params.page_size || 100),
      next_cursor: null,
      has_more: false
    };
  }
  
  // Page methods
  async createPage(params) {
    const page = {
      object: 'page',
      id: `mock-page-${Date.now()}`,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      created_by: { object: 'user', id: 'mock-user-1' },
      last_edited_by: { object: 'user', id: 'mock-user-1' },
      parent: params.parent,
      archived: false,
      properties: params.properties || {},
      url: `https://notion.so/mock-page-${Date.now()}`
    };
    
    this.pagesStore.set(page.id, page);
    this.data.pages.push(page);
    
    logger.debug(`📄 Created mock page: ${page.id}`);
    return page;
  }
  
  async retrievePage(params) {
    const page = this.pagesStore.get(params.page_id);
    if (!page) {
      throw new Error(`Page ${params.page_id} not found`);
    }
    return page;
  }
  
  async updatePage(params) {
    const page = this.pagesStore.get(params.page_id);
    if (!page) {
      throw new Error(`Page ${params.page_id} not found`);
    }
    
    if (params.properties) {
      Object.assign(page.properties, params.properties);
    }
    
    if (params.archived !== undefined) {
      page.archived = params.archived;
    }
    
    page.last_edited_time = new Date().toISOString();
    return page;
  }
  
  // Block methods
  async appendBlocks(params) {
    const blocks = params.children.map((child, index) => ({
      object: 'block',
      id: `mock-block-${Date.now()}-${index}`,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      created_by: { object: 'user', id: 'mock-user-1' },
      last_edited_by: { object: 'user', id: 'mock-user-1' },
      parent: { page_id: params.block_id },
      archived: false,
      has_children: false,
      type: child.type || 'paragraph',
      ...child
    }));
    
    blocks.forEach(block => {
      this.blocksStore.set(block.id, block);
      this.data.blocks.push(block);
    });
    
    logger.debug(`🧱 Added ${blocks.length} mock blocks`);
    
    return {
      object: 'list',
      results: blocks,
      next_cursor: null,
      has_more: false
    };
  }
  
  async listBlocks(params) {
    const blocks = this.data.blocks.filter(b => 
      b.parent.page_id === params.block_id || 
      b.parent.block_id === params.block_id
    );
    
    return {
      object: 'list',
      results: blocks.slice(0, params.page_size || 100),
      next_cursor: null,
      has_more: false
    };
  }
  
  async retrieveBlock(params) {
    const block = this.blocksStore.get(params.block_id);
    if (!block) {
      throw new Error(`Block ${params.block_id} not found`);
    }
    return block;
  }
  
  async updateBlock(params) {
    const block = this.blocksStore.get(params.block_id);
    if (!block) {
      throw new Error(`Block ${params.block_id} not found`);
    }
    
    Object.assign(block, params);
    block.last_edited_time = new Date().toISOString();
    return block;
  }
  
  async deleteBlock(params) {
    const block = this.blocksStore.get(params.block_id);
    if (!block) {
      throw new Error(`Block ${params.block_id} not found`);
    }
    
    block.archived = true;
    return block;
  }
  
  // User methods
  async retrieveUser(params) {
    const user = this.usersStore.get(params.user_id);
    if (!user) {
      throw new Error(`User ${params.user_id} not found`);
    }
    return user;
  }
  
  async listUsers() {
    return {
      object: 'list',
      results: Array.from(this.usersStore.values()),
      next_cursor: null,
      has_more: false
    };
  }
  
  async getCurrentUser() {
    return this.usersStore.get('mock-user-1');
  }
  
  // Search method
  async searchContent(params) {
    const results = [];
    
    if (!params.filter || params.filter.property === 'object') {
      if (!params.filter || params.filter.value === 'database') {
        results.push(...this.data.databases);
      }
      if (!params.filter || params.filter.value === 'page') {
        results.push(...this.data.pages);
      }
    }
    
    if (params.query) {
      const query = params.query.toLowerCase();
      return {
        object: 'list',
        results: results.filter(item => {
          const title = item.title?.[0]?.text?.content || '';
          return title.toLowerCase().includes(query);
        }),
        next_cursor: null,
        has_more: false
      };
    }
    
    return {
      object: 'list',
      results: results.slice(0, params.page_size || 100),
      next_cursor: null,
      has_more: false
    };
  }
  
  // Export/Import methods
  async exportData() {
    logger.info('📦 Exporting mock Notion data');
    
    return {
      databases: Array.from(this.databasesStore.values()),
      pages: Array.from(this.pagesStore.values()),
      blocks: Array.from(this.blocksStore.values()),
      timestamp: new Date().toISOString()
    };
  }
  
  async importData(data) {
    if (data.databases) {
      data.databases.forEach(db => {
        this.databasesStore.set(db.id, db);
      });
    }
    
    if (data.pages) {
      data.pages.forEach(page => {
        this.pagesStore.set(page.id, page);
      });
    }
    
    if (data.blocks) {
      data.blocks.forEach(block => {
        this.blocksStore.set(block.id, block);
      });
    }
    
    logger.info('📥 Imported mock Notion data');
  }
  
  getStats() {
    return {
      databases: this.databasesStore.size,
      pages: this.pagesStore.size,
      blocks: this.blocksStore.size,
      users: this.usersStore.size
    };
  }
}

// Client wrapper for compatibility
class Client extends NotionMockProvider {
  constructor(options = {}) {
    super();
    logger.info('🔴 Initializing Notion Mock Client');
  }
}

module.exports = { Client, NotionMockProvider };