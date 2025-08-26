/**
 * Mock MCP Server for testing
 * Simulates MCP server responses without requiring actual server connections
 */

class MockMCPServer {
  constructor(config = {}) {
    this.name = config.name || 'mock-server';
    this.type = config.type || 'generic';
    this.connected = false;
    this.capabilities = config.capabilities || ['read', 'write'];
    this.responseDelay = config.responseDelay || 0;
  }

  async connect() {
    await this.simulateDelay();
    this.connected = true;
    return {
      success: true,
      server: this.name,
      capabilities: this.capabilities,
      version: '1.0.0'
    };
  }

  async disconnect() {
    this.connected = false;
    return { success: true };
  }

  async execute(command, params = {}) {
    if (!this.connected) {
      throw new Error('Server not connected');
    }

    await this.simulateDelay();

    // Simulate different MCP server responses
    switch (this.type) {
      case 'notion':
        return this.handleNotionCommand(command, params);
      case 'github':
        return this.handleGitHubCommand(command, params);
      case 'figma':
        return this.handleFigmaCommand(command, params);
      case 'semgrep':
        return this.handleSemgrepCommand(command, params);
      default:
        return this.handleGenericCommand(command, params);
    }
  }

  handleNotionCommand(command, params) {
    switch (command) {
      case 'createPage':
        return {
          id: 'page-' + Date.now(),
          url: 'https://notion.so/mock-page',
          title: params.title || 'Mock Page'
        };
      case 'updatePage':
        return {
          id: params.pageId,
          updated: true,
          timestamp: new Date().toISOString()
        };
      case 'queryDatabase':
        return {
          results: [
            { id: 'item-1', title: 'Task 1', status: 'pending' },
            { id: 'item-2', title: 'Task 2', status: 'completed' }
          ],
          hasMore: false
        };
      default:
        return { success: true, command, params };
    }
  }

  handleGitHubCommand(command, params) {
    switch (command) {
      case 'createPR':
        return {
          number: Math.floor(Math.random() * 1000),
          url: 'https://github.com/org/repo/pull/123',
          title: params.title,
          state: 'open'
        };
      case 'listIssues':
        return {
          issues: [
            { number: 1, title: 'Bug: Test issue', state: 'open' },
            { number: 2, title: 'Feature: New feature', state: 'closed' }
          ]
        };
      case 'getRepo':
        return {
          name: 'mock-repo',
          owner: 'mock-owner',
          stars: 100,
          forks: 20
        };
      default:
        return { success: true, command, params };
    }
  }

  handleFigmaCommand(command, params) {
    switch (command) {
      case 'getFile':
        return {
          name: 'Mock Design',
          lastModified: new Date().toISOString(),
          components: [
            { id: 'comp-1', name: 'Button', type: 'COMPONENT' },
            { id: 'comp-2', name: 'Card', type: 'COMPONENT' }
          ]
        };
      case 'exportComponent':
        return {
          svg: '<svg>...</svg>',
          css: '.component { }',
          react: 'const Component = () => <div />'
        };
      default:
        return { success: true, command, params };
    }
  }

  handleSemgrepCommand(command, params) {
    switch (command) {
      case 'scan':
        return {
          findings: [
            {
              check_id: 'security.injection.sql',
              path: 'src/api/users.js',
              line: 42,
              severity: 'HIGH',
              message: 'Potential SQL injection'
            }
          ],
          summary: {
            total: 1,
            high: 1,
            medium: 0,
            low: 0
          }
        };
      default:
        return { success: true, command, params };
    }
  }

  handleGenericCommand(command, params) {
    return {
      success: true,
      command,
      params,
      timestamp: new Date().toISOString(),
      server: this.name
    };
  }

  async simulateDelay() {
    if (this.responseDelay > 0) {
      return new Promise(resolve => setTimeout(resolve, this.responseDelay));
    }
  }

  // Utility methods for testing
  async getStatus() {
    return {
      connected: this.connected,
      server: this.name,
      type: this.type,
      capabilities: this.capabilities
    };
  }

  async testConnection() {
    try {
      await this.connect();
      await this.disconnect();
      return { success: true, message: 'Connection test successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Mock MCP Manager for managing multiple servers
class MockMCPManager {
  constructor() {
    this.servers = new Map();
  }

  registerServer(name, config = {}) {
    const server = new MockMCPServer({ name, ...config });
    this.servers.set(name, server);
    return server;
  }

  getServer(name) {
    return this.servers.get(name);
  }

  async connectAll() {
    const results = [];
    for (const [name, server] of this.servers) {
      try {
        await server.connect();
        results.push({ server: name, status: 'connected' });
      } catch (error) {
        results.push({ server: name, status: 'failed', error: error.message });
      }
    }
    return results;
  }

  async disconnectAll() {
    for (const server of this.servers.values()) {
      await server.disconnect();
    }
    return { success: true };
  }

  getConnectedServers() {
    return Array.from(this.servers.entries())
      .filter(([_, server]) => server.connected)
      .map(([name, _]) => name);
  }
}

module.exports = {
  MockMCPServer,
  MockMCPManager,
  // Export as default for simple imports
  default: MockMCPServer
};