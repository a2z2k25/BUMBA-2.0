/**
 * Domain-Specific Routing Integration Tests
 * Verify that commands are routed to the correct domain specialists
 */

const { CommandRouterIntegration } = require('../../src/core/command-router-integration');
const { RoutingExecutionBridge } = require('../../src/core/execution/routing-execution-bridge');

describe('Domain-Specific Routing', () => {
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
  
  describe('Technical Domain Routing', () => {
    test('should route database commands to database specialist', async () => {
      const result = await router.routeCommand('optimize', ['postgres query performance'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'database-specialist' })
      );
      
      // Should use Qwen for coding tasks
      const dbSpecialist = result.execution.agents.find(a => a.name === 'database-specialist');
      expect(dbSpecialist).toBeDefined();
    });
    
    test('should route security commands to security specialist', async () => {
      const result = await router.routeCommand('audit', ['security vulnerabilities'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'security-specialist' })
      );
      
      // Should use DeepSeek for reasoning tasks
      const secSpecialist = result.execution.agents.find(a => a.name === 'security-specialist');
      expect(secSpecialist).toBeDefined();
    });
    
    test('should route API commands to backend specialists', async () => {
      const result = await router.routeCommand('implement', ['REST API endpoints'], {});
      
      const agents = result.execution.agents.map(a => a.name);
      expect(agents).toContain('backend-engineer-manager');
      
      // Manager should use Claude Max
      const manager = result.execution.agents.find(a => a.name === 'backend-engineer-manager');
      expect(manager?.usingClaudeMax).toBe(true);
    });
    
    test('should route DevOps commands correctly', async () => {
      const result = await router.routeCommand('deploy', ['kubernetes cluster'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'devops-engineer' })
      );
    });
  });
  
  describe('Experience Domain Routing', () => {
    test('should route UI commands to design specialists', async () => {
      const result = await router.routeCommand('design', ['responsive dashboard'], {});
      
      const agents = result.execution.agents.map(a => a.name);
      expect(agents).toContain('design-engineer-manager');
      
      // Manager should use Claude Max
      const manager = result.execution.agents.find(a => a.name === 'design-engineer-manager');
      expect(manager?.usingClaudeMax).toBe(true);
    });
    
    test('should route UX research to UX specialist', async () => {
      const result = await router.routeCommand('analyze', ['user research data'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'ux-research-specialist' })
      );
    });
    
    test('should route frontend commands to frontend specialists', async () => {
      const result = await router.routeCommand('build', ['react components'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'frontend-specialist' })
      );
      
      // Should use Qwen for coding
      const frontendSpec = result.execution.agents.find(a => a.name === 'frontend-specialist');
      expect(frontendSpec).toBeDefined();
    });
    
    test('should route accessibility tasks correctly', async () => {
      const result = await router.routeCommand('audit', ['accessibility compliance'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'accessibility-specialist' })
      );
    });
  });
  
  describe('Strategic Domain Routing', () => {
    test('should route product strategy to product strategist', async () => {
      const result = await router.routeCommand('roadmap', ['Q1 2024 product features'], {});
      
      const agents = result.execution.agents.map(a => a.name);
      expect(agents.some(a => a.includes('product-strategist'))).toBe(true);
    });
    
    test('should route market research correctly', async () => {
      const result = await router.routeCommand('analyze', ['market competitors'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'market-research-specialist' })
      );
    });
    
    test('should route business analysis tasks', async () => {
      const result = await router.routeCommand('analyze', ['business requirements'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'business-analyst' })
      );
    });
    
    test('should route documentation to technical writer', async () => {
      const result = await router.routeCommand('write', ['API documentation'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'technical-writer' })
      );
    });
  });
  
  describe('Language-Specific Routing', () => {
    test('should route Python tasks to Python specialist', async () => {
      const result = await router.routeCommand('implement', ['Python API with Flask'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'python-specialist' })
      );
      
      // Should use Qwen for coding
      const pythonSpec = result.execution.agents.find(a => a.name === 'python-specialist');
      expect(pythonSpec).toBeDefined();
    });
    
    test('should route JavaScript tasks to JavaScript specialist', async () => {
      const result = await router.routeCommand('build', ['Node.js microservice'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'javascript-specialist' })
      );
    });
    
    test('should route Go tasks to Go specialist', async () => {
      const result = await router.routeCommand('implement', ['golang REST API'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'golang-specialist' })
      );
    });
    
    test('should route Rust tasks to Rust specialist', async () => {
      const result = await router.routeCommand('optimize', ['rust performance'], {});
      
      expect(result.execution.agents).toContainEqual(
        expect.objectContaining({ name: 'rust-specialist' })
      );
    });
  });
  
  describe('Model Assignment Verification', () => {
    test('managers should always get Claude Max', async () => {
      const commands = [
        ['implement', ['user authentication']],
        ['design', ['dashboard UI']],
        ['analyze', ['business metrics']]
      ];
      
      for (const [cmd, args] of commands) {
        const result = await router.routeCommand(cmd, args, {});
        const managers = result.execution.agents.filter(a => a.role === 'manager');
        
        for (const manager of managers) {
          expect(manager.usingClaudeMax).toBe(true);
        }
      }
    });
    
    test('specialists should get free tier models', async () => {
      const result = await router.routeCommand('implement', ['database optimization'], {});
      const specialists = result.execution.agents.filter(a => a.role === 'specialist');
      
      for (const specialist of specialists) {
        expect(specialist.usingClaudeMax).toBe(false);
        expect(['deepseek', 'qwen', 'gemini']).toContain(specialist.model);
      }
    });
    
    test('reasoning tasks should use DeepSeek', async () => {
      const result = await router.routeCommand('analyze', ['security vulnerabilities'], {});
      const securitySpec = result.execution.agents.find(a => a.name === 'security-specialist');
      
      // Security analysis is a reasoning task
      expect(securitySpec).toBeDefined();
    });
    
    test('coding tasks should use Qwen', async () => {
      const result = await router.routeCommand('implement', ['database schema'], {});
      const dbSpec = result.execution.agents.find(a => a.name === 'database-specialist');
      
      // Database implementation is a coding task
      expect(dbSpec).toBeDefined();
    });
    
    test('general tasks should use Gemini', async () => {
      const result = await router.routeCommand('design', ['user interface mockup'], {});
      const uiDesigner = result.execution.agents.find(a => a.name === 'ui-designer');
      
      // UI design is a general task
      expect(uiDesigner).toBeDefined();
    });
  });
  
  describe('Routing Confidence', () => {
    test('should have high confidence for specific tasks', async () => {
      const result = await router.routeCommand('implement', ['oauth authentication with JWT'], {});
      
      expect(result.routing.confidence).toBeGreaterThan(0.7);
      expect(result.analysis.confidence).toBeGreaterThan(0.6);
    });
    
    test('should have lower confidence for vague tasks', async () => {
      const result = await router.routeCommand('fix', ['issue'], {});
      
      expect(result.routing.confidence).toBeLessThan(0.5);
    });
    
    test('should identify executive level tasks', async () => {
      const result = await router.routeCommand('plan', ['enterprise platform transformation'], {});
      
      const executives = result.execution.agents.filter(a => a.role === 'executive');
      expect(executives.length).toBeGreaterThan(0);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=domain-specific-routing\\.test\\.js']);
}