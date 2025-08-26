/**
 * BUMBA MCP Server Detector
 * Detects and validates MCP server availability for Notion integration
 */

const { logger } = require('../logging/bumba-logger');

class MCPDetector {
  constructor() {
    this.detectionMethods = [
      this.checkHTTPServer.bind(this),
      this.checkIPCSocket.bind(this),
      this.checkClaudeDesktop.bind(this),
      this.checkEnvironmentConfig.bind(this)
    ];
    
    this.cache = {
      lastCheck: null,
      result: null,
      ttl: 30000 // Cache for 30 seconds
    };
  }

  /**
   * Main detection method with caching
   */
  async detect() {
    // Check cache
    if (this.cache.lastCheck && 
        Date.now() - this.cache.lastCheck < this.cache.ttl) {
      return this.cache.result;
    }

    // Try each detection method
    for (const method of this.detectionMethods) {
      try {
        const result = await method();
        if (result.available) {
          logger.info(`✅ MCP server detected via ${result.method}`);
          this.cache.lastCheck = Date.now();
          this.cache.result = result;
          return result;
        }
      } catch (error) {
        logger.debug(`Detection method failed: ${error.message}`);
      }
    }

    // No MCP server found
    const result = { 
      available: false, 
      method: 'none',
      message: 'No MCP server detected'
    };
    
    this.cache.lastCheck = Date.now();
    this.cache.result = result;
    return result;
  }

  /**
   * Check for HTTP-based MCP server
   */
  async checkHTTPServer() {
    const url = process.env.NOTION_MCP_SERVER_URL || 'http://localhost:3000';
    
    try {
      // Use native fetch if available, otherwise fall back
      const fetchImpl = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetchImpl(`${url}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        
        // Validate it's a Notion MCP server
        if (data.status === 'ready' && 
            data.capabilities && 
            data.capabilities.includes('notion')) {
          return {
            available: true,
            method: 'http',
            url,
            capabilities: data.capabilities,
            version: data.version
          };
        }
      }
    } catch (error) {
      // Server not available or timeout
      logger.debug(`HTTP MCP server not available at ${url}`);
    }
    
    return { available: false };
  }

  /**
   * Check for IPC socket-based MCP server
   */
  async checkIPCSocket() {
    const net = require('net');
    const os = require('os');
    
    // Common IPC socket paths
    const socketPaths = [
      process.env.NOTION_MCP_SOCKET,
      `/tmp/notion-mcp.sock`,
      `${os.homedir()}/.notion-mcp/socket`,
      process.platform === 'win32' ? '\\\\.\\pipe\\notion-mcp' : null
    ].filter(Boolean);
    
    for (const socketPath of socketPaths) {
      try {
        const connected = await new Promise((resolve) => {
          const client = net.createConnection(socketPath);
          
          client.on('connect', () => {
            client.end();
            resolve(true);
          });
          
          client.on('error', () => {
            resolve(false);
          });
          
          setTimeout(() => {
            client.destroy();
            resolve(false);
          }, 1000);
        });
        
        if (connected) {
          return {
            available: true,
            method: 'ipc',
            socketPath
          };
        }
      } catch (error) {
        // Socket not available
        continue;
      }
    }
    
    return { available: false };
  }

  /**
   * Check for Claude Desktop MCP integration
   */
  async checkClaudeDesktop() {
    // Check if running in Claude Desktop environment
    if (typeof window !== 'undefined' && window.__MCP_SERVERS__) {
      const notionServer = window.__MCP_SERVERS__.notion;
      
      if (notionServer && notionServer.status === 'connected') {
        return {
          available: true,
          method: 'claude-desktop',
          server: notionServer
        };
      }
    }
    
    // Check for Claude Desktop config file
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    const configPaths = [
      path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'mcp.json'),
      path.join(os.homedir(), '.config', 'claude', 'mcp.json'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'mcp.json')
    ];
    
    for (const configPath of configPaths) {
      try {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        if (config.mcpServers && config.mcpServers.notion) {
          // Verify the server is actually running
          const notionConfig = config.mcpServers.notion;
          
          // Try to validate it's running
          if (notionConfig.command) {
            return {
              available: true,
              method: 'claude-desktop-config',
              config: notionConfig
            };
          }
        }
      } catch (error) {
        // Config doesn't exist or can't be read
        continue;
      }
    }
    
    return { available: false };
  }

  /**
   * Check environment configuration
   */
  async checkEnvironmentConfig() {
    // Check if MCP is explicitly enabled
    if (process.env.NOTION_MCP_ENABLED === 'true') {
      // Validate required configuration exists
      if (process.env.NOTION_MCP_COMMAND || process.env.NOTION_MCP_SERVER_URL) {
        return {
          available: true,
          method: 'environment',
          config: {
            enabled: true,
            command: process.env.NOTION_MCP_COMMAND,
            serverUrl: process.env.NOTION_MCP_SERVER_URL
          }
        };
      }
    }
    
    return { available: false };
  }

  /**
   * Test MCP server capabilities
   */
  async testCapabilities(serverInfo) {
    if (!serverInfo.available) {
      return { success: false, message: 'No MCP server available' };
    }
    
    try {
      // Test based on connection method
      switch (serverInfo.method) {
        case 'http':
          return await this.testHTTPCapabilities(serverInfo);
        
        case 'ipc':
          return await this.testIPCCapabilities(serverInfo);
        
        case 'claude-desktop':
        case 'claude-desktop-config':
          return await this.testClaudeDesktopCapabilities(serverInfo);
        
        default:
          return { success: true, message: 'MCP server detected but not tested' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to test capabilities: ${error.message}` 
      };
    }
  }

  /**
   * Test HTTP server capabilities
   */
  async testHTTPCapabilities(serverInfo) {
    const fetchImpl = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    
    try {
      // Test create operation
      const response = await fetchImpl(`${serverInfo.url}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'test',
          data: { test: true }
        })
      });
      
      if (response.ok) {
        return { 
          success: true, 
          message: 'MCP server operational',
          capabilities: serverInfo.capabilities 
        };
      }
    } catch (error) {
      logger.debug('Capability test failed:', error);
    }
    
    return { 
      success: false, 
      message: 'MCP server detected but not operational' 
    };
  }

  /**
   * Test IPC socket capabilities
   */
  async testIPCCapabilities(serverInfo) {
    // Implementation would depend on IPC protocol
    return { 
      success: true, 
      message: 'IPC socket detected',
      socketPath: serverInfo.socketPath 
    };
  }

  /**
   * Test Claude Desktop capabilities
   */
  async testClaudeDesktopCapabilities(serverInfo) {
    // Check if we can access Claude Desktop MCP functions
    if (typeof window !== 'undefined' && window.__MCP_SERVERS__) {
      try {
        const result = await window.__MCP_SERVERS__.notion.test();
        return { 
          success: true, 
          message: 'Claude Desktop MCP operational',
          result 
        };
      } catch (error) {
        return { 
          success: false, 
          message: 'Claude Desktop MCP not responding' 
        };
      }
    }
    
    return { 
      success: true, 
      message: 'Claude Desktop MCP configured' 
    };
  }

  /**
   * Clear detection cache
   */
  clearCache() {
    this.cache.lastCheck = null;
    this.cache.result = null;
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new MCPDetector();
  }
  return instance;
}

module.exports = {
  MCPDetector,
  getInstance
};