/**
 * Command Router Integration Tests
 * Tests intelligent routing of commands to appropriate agents
 */

const { CommandRouterIntegration } = require('../../../src/core/command-router-integration');

describe('Command Router Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let router;
  
  beforeEach(() => {
    router = new CommandRouterIntegration();
  });
  
  describe('Intent Analysis', () => {
    test('should detect build intent', async () => {
      const result = await router.routeCommand('implement', ['user authentication'], {});
      expect(result.analysis.intent).toBe('build');
    });
    
    test('should detect analyze intent', async () => {
      const result = await router.routeCommand('analyze', ['security vulnerabilities'], {});
      expect(result.analysis.intent).toBe('analyze');
    });
    
    test('should detect design intent', async () => {
      const result = await router.routeCommand('design', ['dashboard UI'], {});
      expect(result.analysis.intent).toBe('design');
    });
    
    test('should detect strategic intent', async () => {
      const result = await router.routeCommand('roadmap', ['Q1 2024'], {});
      expect(result.analysis.intent).toBe('strategic');
    });
  });
  
  describe('Department Detection', () => {
    test('should route backend commands to technical department', async () => {
      const result = await router.routeCommand('api', ['REST endpoints'], {});
      const agents = result.execution.agents;
      expect(agents.some(a => a.name === 'backend-engineer-manager')).toBe(true);
    });
    
    test('should route design commands to experience department', async () => {
      const result = await router.routeCommand('ui', ['component library'], {});
      const agents = result.execution.agents;
      expect(agents.some(a => a.name === 'design-engineer-manager')).toBe(true);
    });
    
    test('should route strategy commands to strategic department', async () => {
      const result = await router.routeCommand('prd', ['new feature'], {});
      const agents = result.execution.agents;
      expect(agents.some(a => a.name === 'product-strategist')).toBe(true);
    });
  });
  
  describe('Specialist Identification', () => {
    test('should identify security specialist for security tasks', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'implement', 
        ['oauth authentication'], 
        {}
      );
      expect(analysis.specialists).toContain('security-specialist');
    });
    
    test('should identify database specialist for database tasks', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'optimize', 
        ['postgres query performance'], 
        {}
      );
      expect(analysis.specialists).toContain('database-specialist');
    });
    
    test('should identify frontend specialist for UI tasks', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'build', 
        ['react components'], 
        {}
      );
      expect(analysis.specialists).toContain('frontend-specialist');
    });
    
    test('should identify Python specialist when explicitly mentioned', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'implement', 
        ['python API with Flask'], 
        {}
      );
      expect(analysis.specialists).toContain('python-specialist');
    });
  });
  
  describe('Complexity Scoring', () => {
    test('should score simple tasks as low complexity', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'fix', 
        ['typo'], 
        {}
      );
      expect(analysis.complexity).toBeLessThan(0.3);
    });
    
    test('should score multi-domain tasks as high complexity', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'implement', 
        ['full-stack application with frontend UI, backend API, and database'], 
        {}
      );
      expect(analysis.complexity).toBeGreaterThan(0.6);
    });
    
    test('should detect executive level tasks', async () => {
      const analysis = router.routingSystem.analyzer.analyzeIntent(
        'plan', 
        ['enterprise platform transformation'], 
        {}
      );
      expect(analysis.isExecutiveLevel).toBe(true);
    });
  });
  
  describe('Routing Strategy', () => {
    test('should use executive strategy for high complexity', async () => {
      const analysis = {
        complexity: 0.9,
        isExecutiveLevel: true,
        departments: ['strategic', 'technical'],
        specialists: []
      };
      
      const strategy = router.determineRoutingStrategy(analysis);
      expect(strategy.type).toBe('executive');
      expect(strategy.requiresClaudeMax).toBe(true);
    });
    
    test('should use cross-domain strategy for multiple departments', async () => {
      const analysis = {
        complexity: 0.5,
        isExecutiveLevel: false,
        departments: ['technical', 'experience'],
        specialists: ['frontend-specialist', 'backend-developer']
      };
      
      const strategy = router.determineRoutingStrategy(analysis);
      expect(strategy.type).toBe('cross-domain');
      expect(strategy.requiresClaudeMax).toBe(true);
    });
    
    test('should use specialist-only for simple tasks', async () => {
      const analysis = {
        complexity: 0.2,
        isExecutiveLevel: false,
        departments: ['technical'],
        specialists: ['database-specialist']
      };
      
      const strategy = router.determineRoutingStrategy(analysis);
      expect(strategy.type).toBe('specialist-only');
      expect(strategy.requiresClaudeMax).toBe(false);
    });
  });
  
  describe('Agent Selection', () => {
    test('should select executive for executive strategy', async () => {
      const strategy = {
        type: 'executive',
        departments: ['strategic'],
        specialists: []
      };
      
      const agents = await router.selectAgents(strategy, {});
      expect(agents[0].agent).toBe('product-strategist-executive');
      expect(agents[0].role).toBe('executive');
    });
    
    test('should select multiple managers for cross-domain', async () => {
      const strategy = {
        type: 'cross-domain',
        managers: ['backend-engineer-manager', 'design-engineer-manager'],
        specialists: []
      };
      
      const agents = await router.selectAgents(strategy, {});
      expect(agents.filter(a => a.role === 'manager').length).toBe(2);
    });
    
    test('should include specialists as workers', async () => {
      const strategy = {
        type: 'domain-specific',
        manager: 'backend-engineer-manager',
        specialists: ['security-specialist', 'database-specialist']
      };
      
      const agents = await router.selectAgents(strategy, {});
      expect(agents.filter(a => a.role === 'specialist').length).toBe(2);
      expect(agents.filter(a => a.type === 'worker').length).toBe(2);
    });
  });
  
  describe('Complete Routing Flow', () => {
    test('should route "implement user authentication" correctly', async () => {
      const result = await router.routeCommand('implement', ['user authentication'], {});
      
      expect(result.command).toBe('implement');
      expect(result.analysis.intent).toBe('build');
      expect(result.execution.agents.length).toBeGreaterThan(0);
      
      // Should have a manager
      const managers = result.execution.agents.filter(a => a.role === 'manager');
      expect(managers.length).toBeGreaterThanOrEqual(1);
      
      // Manager should use Claude Max
      expect(managers[0].usingClaudeMax).toBe(true);
    });
    
    test('should route "design responsive dashboard" correctly', async () => {
      const result = await router.routeCommand('design', ['responsive dashboard'], {});
      
      expect(result.analysis.intent).toBe('design');
      
      // Should assign design manager
      const agents = result.execution.agents;
      expect(agents.some(a => a.name === 'design-engineer-manager')).toBe(true);
    });
    
    test('should route "analyze market competitors" correctly', async () => {
      const result = await router.routeCommand('analyze', ['market competitors'], {});
      
      expect(result.analysis.intent).toBe('analyze');
      
      // Should assign product strategist
      const agents = result.execution.agents;
      expect(agents.some(a => a.name.includes('product-strategist'))).toBe(true);
    });
    
    test('should handle cross-domain "implement full-stack app"', async () => {
      const result = await router.routeCommand(
        'implement', 
        ['full-stack application with React frontend and Node.js backend'], 
        {}
      );
      
      // Should have multiple agents
      expect(result.execution.agents.length).toBeGreaterThan(1);
      
      // Should require coordination
      expect(result.execution.requiresCoordination).toBe(true);
    });
  });
  
  describe('Fallback Handling', () => {
    test('should use fallback for unknown commands', async () => {
      // Simulate error in routing
      router.routingSystem = null;
      
      const result = await router.routeCommand('unknown', ['task'], {});
      
      expect(result.routing.source).toBe('fallback');
      expect(result.routing.confidence).toBeLessThan(0.5);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=command-router-integration\\.test\\.js']);
}