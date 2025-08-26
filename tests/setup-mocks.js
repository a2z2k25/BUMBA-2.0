/**
 * Test Mock Setup
 * Configures all mocks for integration testing
 */

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.NOTION_API_KEY = 'test-key';

// Mock external dependencies
// Create virtual modules for packages that aren't installed
jest.mock('@notionhq/client', () => ({
  Client: class MockNotionClient {
    constructor() {
      this.pages = { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() };
      this.databases = { create: jest.fn(), query: jest.fn(), retrieve: jest.fn() };
      this.blocks = { children: { list: jest.fn(), append: jest.fn() } };
    }
  }
}), { virtual: true });

jest.mock('openai', () => ({
  default: class MockOpenAI {
    constructor() {
      this.chat = { completions: { create: jest.fn() } };
    }
  }
}), { virtual: true });

jest.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = { create: jest.fn() };
    }
  }
}), { virtual: true });

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleAI {
    constructor() {}
    getGenerativeModel() {
      return { generateContent: jest.fn() };
    }
  }
}), { virtual: true });

// Mock MCP servers
jest.mock('../src/core/mcp/mcp-resilience-system', () => {
  const { MockMCPManager } = require('./__mocks__/mcp-server');
  return {
    mcpServerManager: {
      initialize: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getServerStatus: jest.fn(() => 'disconnected'),
      startHealthMonitoring: jest.fn(),
      stopHealthMonitoring: jest.fn(),
      cleanup: jest.fn()
    },
    MCPServerManager: jest.fn().mockImplementation(() => ({
      initialize: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      healthMonitoringEnabled: false,
      cleanup: jest.fn()
    })),
    MCPResilienceSystem: class {
      constructor() {
        this.manager = new MockMCPManager();
        this.connected = false;
      }
      
      async initialize() {
        this.connected = true;
        return { success: true };
      }
      
      async executeOperation(server, command, params) {
        const mockServer = this.manager.getServer(server);
        if (!mockServer) {
          this.manager.registerServer(server, { type: server });
          return this.manager.getServer(server).execute(command, params);
        }
        return mockServer.execute(command, params);
      }
      
      getStatus() {
        return {
          connected: this.connected,
          servers: Array.from(this.manager.servers.keys())
        };
      }
      
      cleanup() {
        this.connected = false;
      }
    }
  };
});

// Mock the Notion MCP Bridge
jest.mock('../src/core/mcp/notion-mcp-bridge', () => {
  return {
    NotionMCPBridge: class {
      constructor(config = {}) {
        this.config = config;
        this.mode = 'mock';
        this.connected = false;
      }
      
      async initialize() {
        this.connected = true;
        return { success: true, mode: 'mock' };
      }
      
      async executeNotionOperation(operation, params) {
        // Return mock responses based on operation
        switch (operation) {
          case 'createDatabase':
            return {
              id: 'mock-db-' + Date.now(),
              url: 'https://notion.so/mock-database'
            };
          case 'createPage':
            return {
              id: 'mock-page-' + Date.now(),
              url: 'https://notion.so/mock-page'
            };
          case 'updatePage':
            return {
              id: params.pageId,
              updated: true
            };
          default:
            return { success: true, operation, params };
        }
      }
      
      getMode() {
        return this.mode;
      }
    }
  };
});

// Mock file system operations for tests
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('{}'),
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock logger to reduce test output noise
jest.mock('../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Global test utilities
global.testUtils = {
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create mock context
  createMockContext: () => ({
    project: 'test-project',
    user: 'test-user',
    session: 'test-session',
    timestamp: new Date().toISOString()
  }),
  
  // Create mock command
  createMockCommand: (cmd, args = {}) => ({
    command: cmd,
    args,
    context: global.testUtils.createMockContext()
  }),
  
  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks();
  }
};

// Export mock constructors for direct use in tests
module.exports = {
  MockNotionClient: require('./__mocks__/notion-api').Client,
  MockMCPServer: require('./__mocks__/mcp-server').MockMCPServer,
  MockOpenAI: require('./__mocks__/llm-api').MockOpenAI,
  MockAnthropic: require('./__mocks__/llm-api').MockAnthropic,
  createMockLLM: require('./__mocks__/llm-api').createMockLLM
};