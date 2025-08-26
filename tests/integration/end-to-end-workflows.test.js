/**
 * End-to-End Workflow Integration Tests
 * Tests complete user workflows across all agents
 */

const { BumbaFramework2 } = require('../../src/index');
const { UnifiedRoutingSystem } = require('../../src/core/unified-routing-system');
const { ConfigurationManager } = require('../../src/core/configuration/configuration-manager');
const fs = require('fs');
const path = require('path');

// Mock all external dependencies
jest.mock('../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('fs');
jest.mock('child_process');

describe('End-to-End Workflow Integration Tests', () => {
  let framework;
  let originalEnv;
  
  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockReturnValue(true);
    fs.mkdirSync.mockReturnValue(true);
    
    // Initialize framework
    framework = new BumbaFramework2({
      mode: 'full',
      skipInit: false
    });
  });
  
  afterEach(async () => {
    if (framework) {
      await framework.shutdown();
    }
  });
  
  describe('Complete Feature Development Workflow', () => {
    test('should handle full feature implementation from requirements to deployment', async () => {
      const context = {
        user: 'developer',
        project: 'test-app',
        role: 'admin'
      };
      
      // Step 1: Product Strategy Phase
      const requirementsResult = await framework.processCommand(
        'requirements',
        ['user authentication system'],
        context
      );
      
      expect(requirementsResult.success).toBe(true);
      expect(requirementsResult.agent).toContain('product-strategist');
      
      // Step 2: Design Phase
      const designResult = await framework.processCommand(
        'design',
        ['login interface'],
        context
      );
      
      expect(designResult.success).toBe(true);
      expect(designResult.agent).toContain('design-engineer');
      
      // Step 3: Implementation Phase
      const implementResult = await framework.processCommand(
        'implement-technical',
        ['authentication API'],
        context
      );
      
      expect(implementResult.success).toBe(true);
      expect(implementResult.agent).toContain('backend-engineer');
      
      // Step 4: Security Validation
      const securityResult = await framework.processCommand(
        'secure',
        ['authentication endpoints'],
        context
      );
      
      expect(securityResult.success).toBe(true);
      
      // Step 5: Testing Phase
      const testResult = await framework.processCommand(
        'test',
        ['authentication flow'],
        context
      );
      
      expect(testResult.success).toBe(true);
    });
    
    test('should maintain context across agent handoffs', async () => {
      const context = {
        user: 'developer',
        project: 'context-test',
        sessionId: 'test-session-123'
      };
      
      // Create shared context
      const sharedData = {
        requirements: 'e-commerce checkout',
        constraints: ['PCI compliance', 'mobile-first']
      };
      
      // Product strategist creates requirements
      const strategyResult = await framework.processCommand(
        'prd',
        ['create', JSON.stringify(sharedData)],
        context
      );
      
      expect(strategyResult.success).toBe(true);
      
      // Design engineer should have access to requirements
      const designResult = await framework.processCommand(
        'implement-design',
        ['checkout flow'],
        { ...context, previousResult: strategyResult.result }
      );
      
      expect(designResult.success).toBe(true);
      
      // Backend engineer should have both requirements and design
      const backendResult = await framework.processCommand(
        'implement-technical',
        ['payment processing'],
        { ...context, previousResults: [strategyResult.result, designResult.result] }
      );
      
      expect(backendResult.success).toBe(true);
    });
  });
  
  describe('Multi-Agent Collaboration Workflow', () => {
    test('should coordinate all three agents for complex feature', async () => {
      const context = {
        user: 'developer',
        project: 'collaboration-test',
        role: 'admin'
      };
      
      const result = await framework.processCommand(
        'implement-agents',
        ['real-time collaboration feature'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.agentsInvolved).toEqual(
        expect.arrayContaining(['product-strategist', 'design-engineer', 'backend-engineer'])
      );
    });
    
    test('should handle agent conflicts and resolution', async () => {
      const context = {
        user: 'developer',
        project: 'conflict-test'
      };
      
      // Create conflicting requirements
      const conflictingTask = {
        performance: 'real-time updates every 100ms',
        battery: 'optimize for mobile battery life'
      };
      
      const result = await framework.processCommand(
        'implement-agents',
        [JSON.stringify(conflictingTask)],
        context
      );
      
      expect(result.success).toBe(true);
      // Should have resolution strategy
      expect(result.metadata.conflictResolution).toBeDefined();
    });
  });
  
  describe('Error Recovery Workflow', () => {
    test('should recover from agent failures gracefully', async () => {
      const context = {
        user: 'developer',
        project: 'recovery-test'
      };
      
      // Force an error in the middle of workflow
      const mockError = new Error('Simulated agent failure');
      jest.spyOn(UnifiedRoutingSystem.prototype, 'executeRouting')
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ success: true, result: 'Recovered' });
      
      const result = await framework.processCommand(
        'implement',
        ['fault-tolerant service'],
        context
      );
      
      // Should recover and complete
      expect(result.success).toBe(true);
      expect(result.metadata.recoveryAttempts).toBeGreaterThan(0);
    });
    
    test('should fallback to lite mode on resource exhaustion', async () => {
      const context = {
        user: 'developer',
        project: 'resource-test'
      };
      
      // Simulate high memory usage
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 450 * 1024 * 1024, // 450MB - near limit
        heapTotal: 512 * 1024 * 1024,
        rss: 600 * 1024 * 1024,
        external: 50 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024
      });
      
      const result = await framework.processCommand(
        'analyze',
        ['large codebase'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata.mode).toBe('lite'); // Should switch to lite mode
    });
  });
  
  describe('Security Validation Workflow', () => {
    test('should validate security at each workflow step', async () => {
      const context = {
        user: 'developer',
        project: 'security-test',
        role: 'developer' // Limited permissions
      };
      
      // Try to execute privileged command
      const result = await framework.processCommand(
        'execute',
        ['rm -rf /'],
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('denied');
    });
    
    test('should sanitize inputs across agent boundaries', async () => {
      const context = {
        user: 'developer',
        project: 'sanitization-test'
      };
      
      const maliciousInput = '../../../etc/passwd; cat /etc/shadow';
      
      const result = await framework.processCommand(
        'implement',
        [maliciousInput],
        context
      );
      
      // Should sanitize and continue safely
      expect(result.success).toBe(true);
      expect(result.metadata.sanitized).toBe(true);
    });
  });
  
  describe('Performance Optimization Workflow', () => {
    test('should optimize performance across workflow steps', async () => {
      const context = {
        user: 'developer',
        project: 'performance-test'
      };
      
      const startTime = Date.now();
      
      // Execute multiple commands in sequence
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await framework.processCommand(
          'analyze',
          [`component-${i}`],
          context
        );
        results.push(result);
      }
      
      const totalTime = Date.now() - startTime;
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Should complete within performance budget
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 5 commands
      
      // Should show caching benefits
      const durations = results.map(r => r.duration);
      expect(durations[4]).toBeLessThan(durations[0]); // Later commands faster
    });
  });
  
  describe('Health Monitoring Integration', () => {
    test('should monitor health throughout workflow', async () => {
      const context = {
        user: 'developer',
        project: 'health-test'
      };
      
      // Get initial health
      const initialHealth = framework.getHealth();
      expect(initialHealth.status).toBe('healthy');
      
      // Execute workflow
      await framework.processCommand(
        'implement-agents',
        ['monitoring dashboard'],
        context
      );
      
      // Check health after workflow
      const finalHealth = framework.getHealth();
      expect(finalHealth.status).toBe('healthy');
      expect(finalHealth.checks.components).toBeDefined();
      expect(finalHealth.checks.components.healthy).toBe(true);
    });
  });
  
  describe('Configuration Management Workflow', () => {
    test('should handle runtime configuration changes', async () => {
      const context = {
        user: 'admin',
        project: 'config-test',
        role: 'admin'
      };
      
      // Get config manager
      const configManager = ConfigurationManager.getInstance();
      
      // Change configuration mid-workflow
      configManager.set('performance.maxAgents', 5);
      
      const result = await framework.processCommand(
        'implement-agents',
        ['configurable feature'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata.config.maxAgents).toBe(5);
    });
  });
  
  describe('Lite Mode Integration', () => {
    test('should seamlessly switch between full and lite modes', async () => {
      const context = {
        user: 'developer',
        project: 'mode-test'
      };
      
      // Start in full mode
      let result = await framework.processCommand(
        'analyze',
        ['complex system'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata.mode).toBe('full');
      
      // Switch to lite mode
      framework.mode = 'lite';
      
      result = await framework.processCommand(
        'analyze',
        ['simple component'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata.mode).toBe('lite');
      expect(result.duration).toBeLessThan(1000); // Lite mode is faster
    });
  });
  
  describe('Command Chaining Workflow', () => {
    test('should execute command chains efficiently', async () => {
      const context = {
        user: 'developer',
        project: 'chain-test'
      };
      
      const result = await framework.processCommand(
        'chain',
        ['requirements,design,implement,test,deploy'],
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata.stepsCompleted).toBe(5);
      expect(result.metadata.chainDuration).toBeDefined();
    });
  });
});