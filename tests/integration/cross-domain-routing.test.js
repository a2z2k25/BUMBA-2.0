/**
 * Cross-Domain Routing Integration Tests
 * Verify that multi-domain tasks are properly coordinated
 */

const { CommandRouterIntegration } = require('../../src/core/command-router-integration');
const { RoutingExecutionBridge } = require('../../src/core/execution/routing-execution-bridge');

describe('Cross-Domain Routing', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let router;
  let executionBridge;
  
  beforeEach(() => {
    router = new CommandRouterIntegration();
    executionBridge = new RoutingExecutionBridge();
  });
  
  describe('Multi-Department Coordination', () => {
    test('should coordinate full-stack application', async () => {
      const result = await router.routeCommand(
        'implement',
        ['full-stack application with React frontend and Node.js backend'],
        {}
      );
      
      // Should involve multiple departments
      expect(result.execution.requiresCoordination).toBe(true);
      
      // Should have both frontend and backend specialists
      const agents = result.execution.agents.map(a => a.name);
      expect(agents).toContain('backend-engineer-manager');
      expect(agents).toContain('frontend-specialist');
      
      // When multiple managers, executive gets Claude Max
      const managers = result.execution.agents.filter(a => a.role === 'manager');
      if (managers.length > 1) {
        const executive = result.execution.agents.find(a => a.role === 'executive');
        if (executive) {
          expect(executive.usingClaudeMax).toBe(true);
        }
      }
    });
    
    test('should coordinate UI with API integration', async () => {
      const result = await router.routeCommand(
        'build',
        ['dashboard UI with REST API integration'],
        {}
      );
      
      // Should have both design and technical specialists
      const agents = result.execution.agents.map(a => a.name);
      expect(agents.some(a => a.includes('design') || a.includes('ui'))).toBe(true);
      expect(agents.some(a => a.includes('backend') || a.includes('api'))).toBe(true);
    });
    
    test('should coordinate security audit across stack', async () => {
      const result = await router.routeCommand(
        'audit',
        ['full application security including frontend, backend, and database'],
        {}
      );
      
      // Should include security specialist
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'security-specialist' })
      );
      
      // Should involve multiple domains
      expect(result.analysis.departments.length).toBeGreaterThan(1);
    });
  });
  
  describe('Executive Level Coordination', () => {
    test('should elevate to executive for platform tasks', async () => {
      const result = await router.routeCommand(
        'implement',
        ['enterprise platform with microservices architecture'],
        {}
      );
      
      // Should identify as executive level
      expect(result.analysis.complexity).toBeGreaterThan(0.7);
      
      // Should have executive or high-level manager
      const hasExecutive = result.execution.agents.some(
        a => a.role === 'executive' || a.name.includes('executive')
      );
      expect(hasExecutive).toBe(true);
    });
    
    test('should coordinate organization-wide changes', async () => {
      const result = await router.routeCommand(
        'plan',
        ['company-wide digital transformation initiative'],
        {}
      );
      
      // Should be executive level
      const executives = result.execution.agents.filter(a => a.role === 'executive');
      expect(executives.length).toBeGreaterThan(0);
      
      // Executive should get Claude Max
      if (executives.length > 0) {
        expect(executives[0].usingClaudeMax).toBe(true);
      }
    });
  });
  
  describe('Parallel vs Sequential Execution', () => {
    test('should execute independent specialists in parallel', async () => {
      const result = await router.routeCommand(
        'analyze',
        ['frontend performance and backend optimization'],
        {}
      );
      
      // Should mark for parallel execution
      const workers = result.execution.agents.filter(a => a.type === 'worker');
      if (workers.length > 1) {
        expect(result.execution.parallel).toBe(true);
      }
    });
    
    test('should coordinate dependent tasks sequentially', async () => {
      const result = await router.routeCommand(
        'implement',
        ['database schema then API endpoints then frontend'],
        {}
      );
      
      // Should have multiple specialists
      const specialists = result.execution.agents.filter(a => a.role === 'specialist');
      expect(specialists.length).toBeGreaterThan(1);
      
      // Should require coordination for dependencies
      if (result.execution.agents.length > 2) {
        expect(result.execution.requiresCoordination).toBe(true);
      }
    });
  });
  
  describe('Model Distribution in Cross-Domain', () => {
    test('should assign one Claude Max when multiple managers', async () => {
      const result = await router.routeCommand(
        'implement',
        ['complete e-commerce platform with frontend, backend, and database'],
        {}
      );
      
      const managers = result.execution.agents.filter(a => a.role === 'manager');
      const claudeMaxManagers = managers.filter(m => m.usingClaudeMax);
      
      // Only one manager should get Claude Max at a time
      expect(claudeMaxManagers.length).toBeLessThanOrEqual(1);
    });
    
    test('should distribute free tier models appropriately', async () => {
      const result = await router.routeCommand(
        'build',
        ['API with database queries and security checks'],
        {}
      );
      
      const specialists = result.execution.agents.filter(a => a.role === 'specialist');
      
      // Each specialist should have a free tier model
      for (const specialist of specialists) {
        expect(specialist.usingClaudeMax).toBe(false);
        expect(['deepseek', 'qwen', 'gemini']).toContain(specialist.model);
      }
      
      // Different task types should get appropriate models
      const dbSpec = specialists.find(s => s.name.includes('database'));
      const secSpec = specialists.find(s => s.name.includes('security'));
      
      if (dbSpec && secSpec) {
        // Database (coding) vs Security (reasoning) should use different models
        expect(dbSpec.model).not.toBe(secSpec.model);
      }
    });
  });
  
  describe('Complex Scenario Handling', () => {
    test('should handle product launch scenario', async () => {
      const result = await router.routeCommand(
        'plan',
        ['product launch including development, marketing, and deployment'],
        {}
      );
      
      // Should involve multiple departments
      expect(result.analysis.departments).toContain('strategic');
      expect(result.analysis.departments.length).toBeGreaterThan(1);
      
      // Should have high complexity
      expect(result.analysis.complexity).toBeGreaterThan(0.5);
    });
    
    test('should handle migration scenario', async () => {
      const result = await router.routeCommand(
        'migrate',
        ['legacy system to microservices architecture'],
        {}
      );
      
      // Should involve technical specialists
      const agents = result.execution.agents.map(a => a.name);
      expect(agents.some(a => a.includes('backend') || a.includes('architect'))).toBe(true);
      
      // Should require coordination
      if (result.execution.agents.length > 2) {
        expect(result.execution.requiresCoordination).toBe(true);
      }
    });
    
    test('should handle optimization across stack', async () => {
      const result = await router.routeCommand(
        'optimize',
        ['application performance including frontend, backend, and database'],
        {}
      );
      
      // Should have specialists from different domains
      const specialists = result.execution.agents.filter(a => a.role === 'specialist');
      const specialistTypes = new Set(specialists.map(s => {
        if (s.name.includes('frontend')) return 'frontend';
        if (s.name.includes('backend')) return 'backend';
        if (s.name.includes('database')) return 'database';
        return 'other';
      }));
      
      expect(specialistTypes.size).toBeGreaterThan(1);
    });
  });
  
  describe('Routing Strategy Selection', () => {
    test('should use executive strategy for high complexity', async () => {
      const result = await router.routeCommand(
        'architect',
        ['enterprise-scale distributed system'],
        {}
      );
      
      // Should have high complexity
      expect(result.analysis.complexity).toBeGreaterThan(0.7);
      
      // Should use executive or elevated strategy
      const hasExecutive = result.execution.agents.some(
        a => a.role === 'executive' || a.name.includes('executive')
      );
      expect(hasExecutive).toBe(true);
    });
    
    test('should use cross-domain strategy for multi-department', async () => {
      const result = await router.routeCommand(
        'implement',
        ['user dashboard with analytics and API'],
        {}
      );
      
      // Should involve multiple departments
      expect(result.analysis.departments.length).toBeGreaterThan(1);
      
      // Should require coordination
      if (result.execution.agents.filter(a => a.role === 'manager').length > 1) {
        expect(result.execution.requiresCoordination).toBe(true);
      }
    });
    
    test('should handle ambiguous multi-domain requests', async () => {
      const result = await router.routeCommand(
        'create',
        ['something amazing'],
        {}
      );
      
      // Should still route to appropriate departments
      expect(result.execution.agents.length).toBeGreaterThan(0);
      
      // Should have lower confidence due to ambiguity
      expect(result.routing.confidence).toBeLessThan(0.6);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=cross-domain-routing\\.test\\.js']);
}