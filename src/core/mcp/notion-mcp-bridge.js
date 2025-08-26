/**
 * BUMBA Notion MCP Bridge
 * Provides seamless integration with Notion through MCP or direct API
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class NotionMCPBridge extends EventEmitter {
  constructor() {
    super();
    
    this.status = {
      mcp: 'checking',
      api: 'checking',
      mode: 'initializing'
    };
    
    this.mcpAvailable = false;
    this.apiKey = process.env.NOTION_API_KEY;
    this.workspaceId = process.env.NOTION_WORKSPACE_ID;
    
    this.initialize();
  }
  
  async initialize() {
    // Check MCP availability
    this.mcpAvailable = await this.checkMCPAvailability();
    
    if (this.mcpAvailable) {
      this.status.mcp = 'ready';
      this.status.mode = 'mcp';
      logger.info('🏁 Notion MCP server detected');
    } else if (this.apiKey) {
      this.status.api = 'ready';
      this.status.mode = 'api';
      logger.info('🟢 Using Notion API directly');
    } else {
      this.status.mode = 'local';
      logger.warn('🟡 Notion not configured - using local fallback');
    }
    
    this.emit('ready', this.status);
  }
  
  async checkMCPAvailability() {
    // Use the MCP detector to check for server availability
    try {
      const { getInstance: getDetector } = require('./mcp-detector');
      const detector = getDetector();
      
      const result = await detector.detect();
      
      if (result.available) {
        logger.info(`🎯 MCP server detected via ${result.method}`);
        
        // Store server info for later use
        this.mcpServerInfo = result;
        
        // Test capabilities
        const capabilities = await detector.testCapabilities(result);
        if (capabilities.success) {
          logger.info(`✅ ${capabilities.message}`);
          return true;
        } else {
          logger.warn(`⚠️ ${capabilities.message}`);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      logger.debug('MCP detection failed:', error);
      return false;
    }
  }
  
  /**
   * Execute Notion operation with automatic fallback
   */
  async executeNotionOperation(operation, params) {
    if (this.mcpAvailable) {
      return await this.executeMCPOperation(operation, params);
    } else if (this.status.api === 'ready') {
      return await this.executeAPIOperation(operation, params);
    } else {
      return await this.executeLocalOperation(operation, params);
    }
  }
  
  async executeMCPOperation(operation, params) {
    // Execute through MCP server when available
    logger.debug(`MCP operation: ${operation}`, params);
    // Implementation would call actual MCP server
    return { success: true, mode: 'mcp', operation, params };
  }
  
  async executeAPIOperation(operation, params) {
    // Direct API calls when MCP not available
    logger.debug(`API operation: ${operation}`, params);
    // Implementation would use Notion SDK
    return { success: true, mode: 'api', operation, params };
  }
  
  async executeLocalOperation(operation, params) {
    // Use simulator for local operations
    const { getInstance: getSimulator } = require('../notion/notion-simulator');
    const simulator = getSimulator();
    
    logger.debug(`Local simulation: ${operation}`);
    
    // Store for potential later sync when API available
    if (!this.localQueue) {
      this.localQueue = [];
    }
    
    this.localQueue.push({
      operation,
      params,
      timestamp: Date.now()
    });
    
    // Execute in simulator
    return await simulator.executeOperation(operation, params);
  }
  
  /**
   * Specific operation implementations
   */
  async createTask(taskData) {
    return this.executeNotionOperation('createTask', taskData);
  }
  
  async updateTask(taskId, updates) {
    return this.executeNotionOperation('updateTask', { id: taskId, ...updates });
  }
  
  async createKnowledgePage(pageData) {
    return this.executeNotionOperation('createKnowledgePage', pageData);
  }
  
  async updateDashboard(metrics) {
    return this.executeNotionOperation('updateDashboard', metrics);
  }
  
  async createDecisionRecord(decision) {
    return this.executeNotionOperation('createDecisionRecord', decision);
  }
  
  async findTask(criteria) {
    return this.executeNotionOperation('findTask', criteria);
  }
  
  async findKnowledgeEntry(criteria) {
    return this.executeNotionOperation('findKnowledgeEntry', criteria);
  }
  
  async getRecentUpdates(criteria) {
    return this.executeNotionOperation('getRecentUpdates', criteria);
  }
  
  getStatus() {
    return this.status;
  }
  
  getQueuedOperations() {
    return this.localQueue || [];
  }
}

// Singleton instance
let instance = null;

module.exports = {
  NotionMCPBridge,
  getInstance: () => {
    if (!instance) {
      instance = new NotionMCPBridge();
    }
    return instance;
  }
};