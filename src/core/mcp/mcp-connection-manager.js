/**
 * BUMBA MCP Connection Manager
 * Robust connection management for MCP servers with retry logic and validation
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');

class MCPConnectionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 2000,
      connectionTimeout: options.connectionTimeout || 5000,
      healthCheckInterval: options.healthCheckInterval || 30000,
      validateOnConnect: options.validateOnConnect !== false,
      ...options
    };
    
    // Connection state
    this.connections = new Map();
    this.connectionAttempts = new Map();
    this.healthCheckTimers = new Map();
    
    // Statistics
    this.stats = {
      connectionsAttempted: 0,
      connectionsSuccessful: 0,
      connectionsFailed: 0,
      reconnections: 0,
      validationsFailed: 0
    };
  }

  /**
   * Connect to an MCP server with retry logic
   */
  async connect(serverName, mcpClient, options = {}) {
    const config = { ...this.options, ...options };
    
    this.stats.connectionsAttempted++;
    
    // Check if already connected
    if (this.isConnected(serverName)) {
      logger.debug(`MCP ${serverName} already connected`);
      return this.connections.get(serverName);
    }
    
    // Initialize attempt counter
    if (!this.connectionAttempts.has(serverName)) {
      this.connectionAttempts.set(serverName, 0);
    }
    
    try {
      // Attempt connection with timeout
      const connection = await this.attemptConnection(
        serverName, 
        mcpClient, 
        config
      );
      
      // Validate connection if required
      if (config.validateOnConnect) {
        await this.validateConnection(serverName, connection);
      }
      
      // Store successful connection
      this.connections.set(serverName, {
        client: connection,
        status: 'connected',
        connectedAt: Date.now(),
        lastHealthCheck: Date.now(),
        metadata: options.metadata || {}
      });
      
      // Reset attempt counter
      this.connectionAttempts.set(serverName, 0);
      
      // Start health checking
      if (config.healthCheckInterval > 0) {
        this.startHealthCheck(serverName, config.healthCheckInterval);
      }
      
      this.stats.connectionsSuccessful++;
      logger.info(`🏁 MCP ${serverName} connected successfully`);
      this.emit('connected', serverName);
      
      return connection;
      
    } catch (error) {
      const attempts = this.connectionAttempts.get(serverName) + 1;
      this.connectionAttempts.set(serverName, attempts);
      
      // Check if we should retry
      if (attempts < config.maxRetries) {
        logger.warn(`MCP ${serverName} connection failed (attempt ${attempts}/${config.maxRetries}), retrying...`);
        
        // Wait before retry with exponential backoff
        const delay = config.retryDelay * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Recursive retry
        return await this.connect(serverName, mcpClient, options);
      }
      
      // Max retries reached
      this.stats.connectionsFailed++;
      logger.error(`🔴 MCP ${serverName} connection failed after ${attempts} attempts: ${error.message}`);
      
      this.connections.set(serverName, {
        client: null,
        status: 'failed',
        error: error.message,
        lastAttempt: Date.now()
      });
      
      this.emit('connection-failed', serverName, error);
      throw error;
    }
  }

  /**
   * Attempt a single connection with timeout
   */
  async attemptConnection(serverName, mcpClient, config) {
    return new Promise(async (resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout after ${config.connectionTimeout}ms`));
      }, config.connectionTimeout);
      
      try {
        // For memory MCP specifically
        if (serverName === 'memory') {
          // Check if memory tools are available
          const tools = await mcpClient.listTools();
          const memoryTools = tools.filter(t => 
            t.name.includes('memory') || 
            t.name.includes('store') || 
            t.name.includes('recall') ||
            t.name.includes('remember')
          );
          
          if (memoryTools.length === 0) {
            throw new Error('Memory MCP tools not available');
          }
          
          // Test a basic operation
          try {
            await mcpClient.callTool('memory_status', {});
          } catch (e) {
            // Some MCP servers might not have status, try a different test
            logger.debug(`Memory status check failed, trying alternative validation`);
          }
        }
        
        clearTimeout(timeout);
        resolve(mcpClient);
        
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Validate a connection is working properly
   */
  async validateConnection(serverName, connection) {
    try {
      // Generic validation - check if we can list tools
      if (connection.listTools) {
        const tools = await connection.listTools();
        if (!Array.isArray(tools)) {
          throw new Error('Invalid tools response');
        }
      }
      
      // Server-specific validation
      switch (serverName) {
        case 'memory':
          // Ensure memory operations are available
          const hasMemoryOps = await this.validateMemoryOperations(connection);
          if (!hasMemoryOps) {
            throw new Error('Memory operations not available');
          }
          break;
          
        case 'filesystem':
          // Ensure filesystem operations are available
          const hasFsOps = await this.validateFilesystemOperations(connection);
          if (!hasFsOps) {
            throw new Error('Filesystem operations not available');
          }
          break;
          
        // Add more server-specific validations as needed
      }
      
      logger.debug(`🏁 MCP ${serverName} validation passed`);
      return true;
      
    } catch (error) {
      this.stats.validationsFailed++;
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Validate memory MCP operations
   */
  async validateMemoryOperations(connection) {
    try {
      const tools = await connection.listTools();
      const requiredOps = ['store', 'recall'];
      const availableOps = tools.map(t => t.name.toLowerCase());
      
      return requiredOps.some(op => 
        availableOps.some(available => available.includes(op))
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate filesystem MCP operations
   */
  async validateFilesystemOperations(connection) {
    try {
      const tools = await connection.listTools();
      const requiredOps = ['read', 'write'];
      const availableOps = tools.map(t => t.name.toLowerCase());
      
      return requiredOps.every(op => 
        availableOps.some(available => available.includes(op))
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Start health checking for a connection
   */
  startHealthCheck(serverName, interval) {
    // Clear existing timer if any
    this.stopHealthCheck(serverName);
    
    const timer = setInterval(async () => {
      await this.checkHealth(serverName);
    }, interval);
    
    this.healthCheckTimers.set(serverName, timer);
  }

  /**
   * Stop health checking for a connection
   */
  stopHealthCheck(serverName) {
    const timer = this.healthCheckTimers.get(serverName);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(serverName);
    }
  }

  /**
   * Check health of a connection
   */
  async checkHealth(serverName) {
    const connection = this.connections.get(serverName);
    if (!connection || connection.status !== 'connected') {
      return false;
    }
    
    try {
      // Simple health check - list tools
      if (connection.client && connection.client.listTools) {
        await connection.client.listTools();
        connection.lastHealthCheck = Date.now();
        return true;
      }
      
      throw new Error('Health check failed');
      
    } catch (error) {
      logger.warn(`MCP ${serverName} health check failed: ${error.message}`);
      
      // Mark as disconnected
      connection.status = 'disconnected';
      connection.error = error.message;
      
      this.emit('disconnected', serverName);
      
      // Attempt reconnection
      if (connection.client) {
        this.stats.reconnections++;
        logger.info(`Attempting to reconnect MCP ${serverName}...`);
        
        try {
          await this.connect(serverName, connection.client, {
            metadata: connection.metadata
          });
        } catch (reconnectError) {
          logger.error(`Failed to reconnect MCP ${serverName}: ${reconnectError.message}`);
        }
      }
      
      return false;
    }
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverName) {
    const connection = this.connections.get(serverName);
    return connection && connection.status === 'connected';
  }

  /**
   * Get connection for a server
   */
  getConnection(serverName) {
    const connection = this.connections.get(serverName);
    if (connection && connection.status === 'connected') {
      return connection.client;
    }
    return null;
  }

  /**
   * Disconnect a server
   */
  disconnect(serverName) {
    this.stopHealthCheck(serverName);
    
    const connection = this.connections.get(serverName);
    if (connection) {
      connection.status = 'disconnected';
      this.connections.delete(serverName);
      this.emit('disconnected', serverName);
      logger.info(`MCP ${serverName} disconnected`);
    }
  }

  /**
   * Disconnect all servers
   */
  disconnectAll() {
    for (const serverName of this.connections.keys()) {
      this.disconnect(serverName);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    const status = {
      connections: {},
      stats: this.stats
    };
    
    for (const [name, connection] of this.connections) {
      status.connections[name] = {
        status: connection.status,
        connectedAt: connection.connectedAt,
        lastHealthCheck: connection.lastHealthCheck,
        error: connection.error
      };
    }
    
    return status;
  }

  /**
   * Wait for a connection to be ready
   */
  async waitForConnection(serverName, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.isConnected(serverName)) {
        return this.getConnection(serverName);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(`Timeout waiting for MCP ${serverName} connection`);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  MCPConnectionManager,
  getInstance: (options) => {
    if (!instance) {
      instance = new MCPConnectionManager(options);
    }
    return instance;
  },
  resetInstance: () => {
    if (instance) {
      instance.disconnectAll();
    }
    instance = null;
  }
};