/**
 * Notion Mock Provider
 * Provides full Notion API compatibility in development mode
 * Automatically replaced when real Notion API key is added
 */

const { EventEmitter } = require('events');
const { logger } = require('../../logging/bumba-logger');

class NotionMockProvider extends EventEmitter {
  constructor() {
    super();
    
    this.databases = new Map();
    this.pages = new Map();
    this.blocks = new Map();
    this.users = new Map();
    
    // Mock data storage
    this.data = {
      databases: [],
      pages: [],
      blocks: [],
      comments: []
    };
    
    // Initialize with sample data
    this.initializeMockData();
    
    logger.info('🔴 Notion Mock Provider initialized');
  }
  
  /**
   * Initialize mock data
   */
  initializeMockData() {
    // Create mock user
    this.users.set('mock-user-1', {
      object: 'user',
      id: 'mock-user-1',
      type: 'person',
      person: {
        email: 'user@example.com'
      },
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
    
    this.databases.set(mockDb.id, mockDb);
    this.data.databases.push(mockDb);
  }
  
  /**
   * Initialize databases API
   */
  initializeDatabasesAPI() {
    this.databases = {
    create: async (params) => {
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
      
      this.databases.set(database.id, database);
      this.data.databases.push(database);
      
      logger.debug(`📊 Created mock database: ${database.id}`);
      
      return database;
    },
    
    retrieve: async (params) => {
      const database = this.databases.get(params.database_id);
      
      if (!database) {
        throw new Error(`Database ${params.database_id} not found`);
      }
      
      return database;
    },
    
    update: async (params) => {
      const database = this.databases.get(params.database_id);
      
      if (!database) {
        throw new Error(`Database ${params.database_id} not found`);
      }
      
      Object.assign(database, params);
      database.last_edited_time = new Date().toISOString();
      
      return database;
    },
    
    query: async (params) => {
      const database = this.databases.get(params.database_id);
      
      if (!database) {
        throw new Error(`Database ${params.database_id} not found`);
      }
      
      // Return mock pages
      const pages = this.data.pages.filter(p => p.parent.database_id === params.database_id);
      
      return {
        object: 'list',
        results: pages.slice(0, params.page_size || 100),
        next_cursor: null,
        has_more: false
      };
    }
  };
  
  pages = {
    create: async (params) => {
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
      
      this.pages.set(page.id, page);
      this.data.pages.push(page);
      
      logger.debug(`📄 Created mock page: ${page.id}`);
      
      return page;
    },
    
    retrieve: async (params) => {
      const page = this.pages.get(params.page_id);
      
      if (!page) {
        throw new Error(`Page ${params.page_id} not found`);
      }
      
      return page;
    },
    
    update: async (params) => {
      const page = this.pages.get(params.page_id);
      
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
  };
  
  blocks = {
    children: {
      append: async (params) => {
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
          this.blocks.set(block.id, block);
          this.data.blocks.push(block);
        });
        
        logger.debug(`🧱 Added ${blocks.length} mock blocks`);
        
        return {
          object: 'list',
          results: blocks,
          next_cursor: null,
          has_more: false
        };
      },
      
      list: async (params) => {
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
    },
    
    retrieve: async (params) => {
      const block = this.blocks.get(params.block_id);
      
      if (!block) {
        throw new Error(`Block ${params.block_id} not found`);
      }
      
      return block;
    },
    
    update: async (params) => {
      const block = this.blocks.get(params.block_id);
      
      if (!block) {
        throw new Error(`Block ${params.block_id} not found`);
      }
      
      Object.assign(block, params);
      block.last_edited_time = new Date().toISOString();
      
      return block;
    },
    
    delete: async (params) => {
      const block = this.blocks.get(params.block_id);
      
      if (!block) {
        throw new Error(`Block ${params.block_id} not found`);
      }
      
      block.archived = true;
      
      return block;
    }
  };
  
  users = {
    retrieve: async (params) => {
      const user = this.users.get(params.user_id);
      
      if (!user) {
        throw new Error(`User ${params.user_id} not found`);
      }
      
      return user;
    },
    
    list: async () => {
      return {
        object: 'list',
        results: Array.from(this.users.values()),
        next_cursor: null,
        has_more: false
      };
    },
    
    me: async () => {
      return this.users.get('mock-user-1');
    }
  };
  
  search = async (params) => {
    const results = [];
    
    if (!params.filter || params.filter.property === 'object') {
      if (!params.filter || params.filter.value === 'database') {
        results.push(...this.data.databases);
      }
      if (!params.filter || params.filter.value === 'page') {
        results.push(...this.data.pages);
      }
    }
    
    // Apply query if provided
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
  
  /**
   * Export mock data for migration
   */
  async exportData() {
    logger.info('📦 Exporting mock Notion data');
    
    return {
      databases: Array.from(this.databases.values()),
      pages: Array.from(this.pages.values()),
      blocks: Array.from(this.blocks.values()),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Import data (for testing)
   */
  async importData(data) {
    if (data.databases) {
      data.databases.forEach(db => {
        this.databases.set(db.id, db);
      });
    }
    
    if (data.pages) {
      data.pages.forEach(page => {
        this.pages.set(page.id, page);
      });
    }
    
    if (data.blocks) {
      data.blocks.forEach(block => {
        this.blocks.set(block.id, block);
      });
    }
    
    logger.info('📥 Imported mock Notion data');
  }
  
  /**
   * Simulate API delay
   */
  async simulateDelay() {
    const delay = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      databases: this.databases.size,
      pages: this.pages.size,
      blocks: this.blocks.size,
      users: this.users.size
    };
  }
}

// Export as a class that mimics the real Notion client
class Client extends NotionMockProvider {
  constructor(options = {}) {
    super();
    logger.info('🔴 Initializing Notion Mock Client');
    
    // The parent class already has all the methods
    // This wrapper ensures compatibility with the real Notion client
  }
}

module.exports = { Client, NotionMockProvider };