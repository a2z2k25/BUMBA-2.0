/**
 * MCP Server Integration Tests
 * Tests integration with Model Context Protocol servers
 */

const { BumbaFramework2 } = require('../../src/index');
const { MCPResilienceSystem } = require('../../src/core/mcp/mcp-resilience-system');
const EventEmitter = require('events');

// Mock MCP servers
jest.mock('../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock MCP server responses
const mockMCPServers = {
  ref: {
    search: jest.fn().mockResolvedValue({
      results: [
        { title: 'React Hooks', url: 'https://react.dev/hooks', snippet: 'Hooks let you...' }
      ]
    })
  },
  semgrep: {
    scan: jest.fn().mockResolvedValue({
      vulnerabilities: [],
      errors: 0,
      warnings: 2
    })
  },
  memory: {
    store: jest.fn().mockResolvedValue({ success: true }),
    retrieve: jest.fn().mockResolvedValue({ data: {} })
  },
  sequential: {
    think: jest.fn().mockResolvedValue({
      steps: ['analyze', 'design', 'implement'],
      conclusion: 'Feasible approach'
    })
  }
};

describe('MCP Server Integration', () => {
  let framework;
  let mcpSystem;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize framework with mocked MCP servers
    framework = new BumbaFramework2({
      mode: 'full',
      mcpServers: mockMCPServers
    });
    
    mcpSystem = new MCPResilienceSystem();
  });
  
  afterEach(async () => {
    if (framework) {
      await framework.shutdown();
    }
  });
  
  describe('Documentation Search (Ref MCP)', () => {
    test('should search documentation efficiently', async () => {
      const context = {
        user: 'developer',
        project: 'test-app'
      };
      
      const result = await framework.processCommand(
        'docs',
        ['React hooks useState'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(mockMCPServers.ref.search).toHaveBeenCalledWith('React hooks useState');
      expect(result.result).toContain('React Hooks');
    });
    
    test('should handle Ref MCP failures gracefully', async () => {
      mockMCPServers.ref.search.mockRejectedValueOnce(new Error('MCP timeout'));
      
      const result = await framework.processCommand(
        'docs',
        ['fallback test'],
        { user: 'developer' }
      );
      
      // Should fallback to web search
      expect(result.success).toBe(true);
      expect(result.metadata.fallback).toBe(true);
    });
  });
  
  describe('Security Scanning (Semgrep MCP)', () => {
    test('should perform security scans on code', async () => {
      const context = {
        user: 'developer',
        project: 'secure-app'
      };
      
      mockMCPServers.semgrep.scan.mockResolvedValueOnce({
        vulnerabilities: [
          {
            severity: 'high',
            rule: 'sql-injection',
            file: 'db.js',
            line: 42
          }
        ],
        errors: 0,
        warnings: 1
      });
      
      const result = await framework.processCommand(
        'scan',
        ['src/'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(mockMCPServers.semgrep.scan).toHaveBeenCalled();
      expect(result.result.vulnerabilities).toHaveLength(1);
      expect(result.result.vulnerabilities[0].severity).toBe('high');
    });
    
    test('should integrate security scanning into workflow', async () => {
      const context = {
        user: 'developer',
        project: 'workflow-security'
      };
      
      // Implement feature
      await framework.processCommand(
        'implement-technical',
        ['user input handler'],
        context
      );
      
      // Security scan should be triggered automatically
      expect(mockMCPServers.semgrep.scan).toHaveBeenCalled();
    });
  });
  
  describe('Context Persistence (Memory MCP)', () => {
    test('should persist context across sessions', async () => {
      const context = {
        user: 'developer',
        project: 'persistent-app',
        sessionId: 'session-123'
      };
      
      // First command stores context
      const result1 = await framework.processCommand(
        'implement-strategy',
        ['user authentication'],
        context
      );
      
      expect(mockMCPServers.memory.store).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          command: 'implement-strategy'
        })
      );
      
      // Simulate new session
      const newContext = {
        user: 'developer',
        project: 'persistent-app',
        sessionId: 'session-456',
        previousSession: 'session-123'
      };
      
      mockMCPServers.memory.retrieve.mockResolvedValueOnce({
        data: {
          previousWork: result1.result,
          context: context
        }
      });
      
      const result2 = await framework.processCommand(
        'continue',
        [],
        newContext
      );
      
      expect(mockMCPServers.memory.retrieve).toHaveBeenCalledWith('session-123');
      expect(result2.success).toBe(true);
    });
  });
  
  describe('Complex Reasoning (Sequential Thinking MCP)', () => {
    test('should use sequential thinking for complex problems', async () => {
      const context = {
        user: 'developer',
        project: 'complex-app'
      };
      
      mockMCPServers.sequential.think.mockResolvedValueOnce({
        steps: [
          'Analyze current architecture',
          'Identify bottlenecks',
          'Design caching strategy',
          'Implement Redis cache',
          'Add cache warming'
        ],
        conclusion: 'Caching will improve performance by 70%',
        recommendations: ['Use Redis', 'Implement cache warming', 'Monitor hit rates']
      });
      
      const result = await framework.processCommand(
        'improve-performance',
        ['API response times'],
        context
      );
      
      expect(mockMCPServers.sequential.think).toHaveBeenCalled();
      expect(result.result.steps).toHaveLength(5);
      expect(result.result.recommendations).toBeDefined();
    });
  });
  
  describe('MCP Server Coordination', () => {
    test('should coordinate multiple MCP servers for comprehensive analysis', async () => {
      const context = {
        user: 'developer',
        project: 'full-analysis'
      };
      
      // Complex command that requires multiple MCP servers
      const result = await framework.processCommand(
        'analyze',
        ['complete codebase review'],
        context
      );
      
      // Should use multiple MCP servers
      expect(mockMCPServers.ref.search).toHaveBeenCalled(); // For documentation
      expect(mockMCPServers.semgrep.scan).toHaveBeenCalled(); // For security
      expect(mockMCPServers.sequential.think).toHaveBeenCalled(); // For analysis
      expect(mockMCPServers.memory.store).toHaveBeenCalled(); // For persistence
      
      expect(result.success).toBe(true);
      expect(result.metadata.mcpServersUsed).toEqual(
        expect.arrayContaining(['ref', 'semgrep', 'sequential', 'memory'])
      );
    });
  });
  
  describe('MCP Resilience System', () => {
    test('should handle MCP server failures with circuit breaker', async () => {
      // Simulate repeated failures
      for (let i = 0; i < 5; i++) {
        mockMCPServers.ref.search.mockRejectedValueOnce(new Error('Server down'));
      }
      
      const results = [];
      for (let i = 0; i < 6; i++) {
        const result = await framework.processCommand(
          'docs',
          [`query-${i}`],
          { user: 'developer' }
        );
        results.push(result);
      }
      
      // Circuit breaker should open after failures
      const lastResult = results[results.length - 1];
      expect(lastResult.success).toBe(true);
      expect(lastResult.metadata.circuitBreakerOpen).toBe(true);
      expect(lastResult.metadata.fallback).toBe(true);
    });
    
    test('should implement retry logic with exponential backoff', async () => {
      let attempts = 0;
      mockMCPServers.semgrep.scan.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { vulnerabilities: [], errors: 0, warnings: 0 };
      });
      
      const start = Date.now();
      const result = await framework.processCommand(
        'scan',
        ['retry-test'],
        { user: 'developer' }
      );
      const duration = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
      expect(duration).toBeGreaterThan(300); // Backoff delays
    });
  });
  
  describe('MCP Performance Optimization', () => {
    test('should cache MCP responses for efficiency', async () => {
      const context = { user: 'developer' };
      
      // First call
      await framework.processCommand('docs', ['React hooks'], context);
      expect(mockMCPServers.ref.search).toHaveBeenCalledTimes(1);
      
      // Second call (should use cache)
      await framework.processCommand('docs', ['React hooks'], context);
      expect(mockMCPServers.ref.search).toHaveBeenCalledTimes(1); // Not called again
    });
    
    test('should batch MCP requests when possible', async () => {
      const context = { user: 'developer' };
      
      // Simulate multiple related queries
      const queries = [
        'React useState',
        'React useEffect',
        'React useContext'
      ];
      
      // Reset mock to track calls
      mockMCPServers.ref.search.mockClear();
      mockMCPServers.ref.search.mockResolvedValue({
        results: queries.map(q => ({ title: q, url: '#', snippet: 'Info...' }))
      });
      
      // Process queries in parallel
      const results = await Promise.all(
        queries.map(q => framework.processCommand('docs', [q], context))
      );
      
      // Should batch into fewer calls
      expect(mockMCPServers.ref.search.mock.calls.length).toBeLessThan(queries.length);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
  
  describe('MCP Configuration', () => {
    test('should handle missing MCP servers gracefully', async () => {
      // Create framework without MCP servers
      const basicFramework = new BumbaFramework2({
        mode: 'full',
        mcpServers: {} // No servers configured
      });
      
      const result = await basicFramework.processCommand(
        'docs',
        ['test query'],
        { user: 'developer' }
      );
      
      // Should fallback to alternative methods
      expect(result.success).toBe(true);
      expect(result.metadata.mcpAvailable).toBe(false);
      
      await basicFramework.shutdown();
    });
    
    test('should prioritize MCP servers based on configuration', async () => {
      const priorityConfig = {
        ref: { priority: 1, timeout: 5000 },
        semgrep: { priority: 2, timeout: 10000 },
        memory: { priority: 3, timeout: 3000 }
      };
      
      const frameworkWithPriority = new BumbaFramework2({
        mode: 'full',
        mcpServers: mockMCPServers,
        mcpConfig: priorityConfig
      });
      
      // Should respect priority order
      const result = await frameworkWithPriority.processCommand(
        'analyze',
        ['comprehensive'],
        { user: 'developer' }
      );
      
      expect(result.success).toBe(true);
      
      await frameworkWithPriority.shutdown();
    });
  });
});