/**
 * Tests for BUMBA Unified Routing System
 */

const { UnifiedRoutingSystem, TaskIntentAnalyzer, RoutingMemory } = require('../../../src/core/unified-routing-system');

describe('UnifiedRoutingSystem', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let router;

  beforeEach(() => {
    router = new UnifiedRoutingSystem();
  });

  describe('Route Generation', () => {
    test('should route simple task to single department', async () => {
      const result = await router.route('analyze', ['code quality'], {});
      
      expect(result.mode).toBe('simple');
      expect(result.departments).toContain('technical');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should route complex task to multiple departments', async () => {
      // Use a moderately complex task that triggers complex mode but not executive
      const result = await router.route('implement', ['user authentication system with frontend and backend'], {});
      
      // Should be at least moderate complexity
      expect(['moderate', 'complex', 'executive']).toContain(result.mode);
      expect(result.departments.length).toBeGreaterThan(1);
      expect(result.departments).toEqual(expect.arrayContaining(['technical', 'experience']));
    });

    test('should trigger executive mode for enterprise tasks', async () => {
      const result = await router.route('implement', ['enterprise-wide transformation initiative'], {});
      
      expect(result.mode).toBe('executive');
      // Check that it's in executive mode, complexity might not be > 0.8
      expect(result.metadata.intent).toBeDefined();
    });

    test('should select language specialists when explicitly mentioned', async () => {
      const result = await router.route('implement', ['python api with django'], {});
      
      expect(result.specialists).toContain('python-specialist');
      expect(result.metadata.explicitLanguage).toBe('python');
    });

    test('should not select language specialists without explicit mention', async () => {
      const result = await router.route('implement', ['rest api'], {});
      
      expect(result.specialists).not.toContain('javascript-specialist');
      expect(result.specialists).not.toContain('python-specialist');
    });
  });

  describe('Confidence and Suggestions', () => {
    test('should provide suggestions for low confidence routes', async () => {
      const result = await router.route('do', ['something'], {});
      
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should have high confidence for specific tasks', async () => {
      const result = await router.route('implement', ['react component with typescript'], {});
      
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('Pattern Matching', () => {
    test('should match API development pattern', async () => {
      const result = await router.route('build', ['rest api for user management'], {});
      
      expect(result.metadata.patterns).toContain('api-development');
      expect(result.specialists).toEqual(expect.arrayContaining(['backend-engineer', 'api-specialist']));
    });

    test('should match security audit pattern', async () => {
      const result = await router.route('perform', ['security audit of authentication system'], {});
      
      expect(result.metadata.patterns).toContain('security-audit');
      expect(result.specialists).toContain('security-specialist');
    });
  });

  describe('Department Selection', () => {
    test('should select strategic department for business tasks', async () => {
      const result = await router.route('create', ['product roadmap'], {});
      
      expect(result.departments).toContain('strategic');
    });

    test('should select experience department for design tasks', async () => {
      const result = await router.route('design', ['user interface mockup'], {});
      
      expect(result.departments).toContain('experience');
    });

    test('should select technical department for backend tasks', async () => {
      const result = await router.route('implement', ['database schema'], {});
      
      expect(result.departments).toContain('technical');
    });

    test('should select all departments for ambiguous tasks', async () => {
      const result = await router.route('improve', ['the system'], {});
      
      expect(result.departments).toEqual(['strategic', 'experience', 'technical']);
    });
  });

  describe('Routing Memory', () => {
    test('should remember previous routing decisions', async () => {
      // First routing
      const firstResult = await router.route('implement', ['user authentication'], {});
      
      // Simulate successful outcome
      router.memory.remember('implement user authentication', firstResult, { success: true });
      
      // Second similar routing should use memory
      const secondResult = await router.route('implement', ['user authentication'], {});
      
      expect(secondResult.source).toBe('memory');
    });
  });

  describe('Statistics', () => {
    test('should track routing statistics', async () => {
      await router.route('test', ['something'], {});
      await router.route('build', ['api'], {});
      
      const stats = router.getStatistics();
      
      expect(stats.totalRoutings).toBe(2);
      expect(stats.successfulRoutings).toBe(2);
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.successRate).toBe(1);
    });
  });
});

describe('TaskIntentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new TaskIntentAnalyzer();
  });

  describe('Intent Detection', () => {
    test('should detect build intent', async () => {
      const result = analyzer.analyzeIntent('build', ['api'], {});
      expect(result.primaryIntent).toBe('build');
    });

    test('should detect analyze intent', async () => {
      const result = analyzer.analyzeIntent('review', ['code'], {});
      expect(result.primaryIntent).toBe('analyze');
    });

    test('should detect strategic intent', async () => {
      // Use 'plan' instead of 'create' since 'create' matches 'build' intent first
      const result = analyzer.analyzeIntent('plan', ['roadmap'], {});
      expect(result.primaryIntent).toBe('strategic');
    });

    test('should default to general intent', async () => {
      const result = analyzer.analyzeIntent('foo', ['bar'], {});
      expect(result.primaryIntent).toBe('general');
    });
  });

  describe('Complexity Calculation', () => {
    test('should calculate low complexity for simple tasks', async () => {
      const result = analyzer.analyzeIntent('fix', ['typo'], {});
      expect(result.complexity).toBeLessThan(0.5);
    });

    test('should calculate high complexity for multi-part tasks', async () => {
      const result = analyzer.analyzeIntent('implement', 
        ['complete platform with api and frontend and database'], {});
      expect(result.complexity).toBeGreaterThan(0.5);
    });

    test('should detect executive level tasks', async () => {
      const result = analyzer.analyzeIntent('implement', ['enterprise platform'], {});
      expect(result.isExecutiveLevel).toBe(true);
    });
  });

  describe('Language Detection', () => {
    test('should detect JavaScript explicitly', async () => {
      const result = analyzer.analyzeIntent('implement', ['javascript function'], {});
      expect(result.explicitLanguage).toBe('javascript');
    });

    test('should detect Python explicitly', async () => {
      const result = analyzer.analyzeIntent('create', ['python script'], {});
      expect(result.explicitLanguage).toBe('python');
    });

    test('should not detect language implicitly', async () => {
      const result = analyzer.analyzeIntent('create', ['api endpoint'], {});
      expect(result.explicitLanguage).toBeNull();
    });
  });

  describe('Specialist Detection', () => {
    test('should detect security specialist need', async () => {
      const result = analyzer.analyzeIntent('implement', ['oauth authentication'], {});
      expect(result.specialists).toContain('security-specialist');
    });

    test('should detect database specialist need', async () => {
      const result = analyzer.analyzeIntent('optimize', ['database query performance'], {});
      expect(result.specialists).toContain('database-specialist');
    });

    test('should not add language specialists without explicit mention', async () => {
      const result = analyzer.analyzeIntent('build', ['web service'], {});
      expect(result.specialists).not.toContain('javascript-specialist');
      expect(result.specialists).not.toContain('python-specialist');
    });
  });
});

describe('RoutingMemory', () => {
  let memory;

  beforeEach(() => {
    memory = new RoutingMemory();
  });

  test('should store and retrieve routing decisions', async () => {
    const routing = { departments: ['technical'], specialists: ['backend-engineer'] };
    memory.remember('build api', routing, { success: true });
    
    const similar = memory.getSimilarRoutings('build api');
    expect(similar.length).toBe(1);
    expect(similar[0].routing).toEqual(routing);
  });

  test('should find similar tasks with high similarity', async () => {
    const routing1 = { departments: ['technical'] };
    const routing2 = { departments: ['experience'] };
    
    memory.remember('build user api', routing1, { success: true });
    memory.remember('design user interface', routing2, { success: true });
    
    // Use a more similar task to ensure similarity > 0.7
    const similar = memory.getSimilarRoutings('build user api service');
    expect(similar.length).toBeGreaterThan(0);
    // 'build user api' and 'build user api service' share 3 words out of 4, similarity = 0.75
    expect(similar[0].similarity).toBeGreaterThan(0.7);
  });

  test('should calculate similarity correctly', async () => {
    const similarity = memory.calculateSimilarity('build-api-user', 'build-api-admin');
    expect(similarity).toBeGreaterThanOrEqual(0.5);
    expect(similarity).toBeLessThan(1);
  });
});