/**
 * Unit Tests for Chameleon Manager System
 * Testing dynamic expertise absorption and validation
 */

const ChameleonManager = require('../../../src/core/departments/chameleon-manager');
const ExpertiseAbsorptionEngine = require('../../../src/core/chameleon/expertise-absorption-engine');
const ValidationFramework = require('../../../src/core/chameleon/validation-framework');
const ExpertiseCache = require('../../../src/core/chameleon/expertise-cache');

describe('Chameleon Manager System', () => {
  let manager;
  
  beforeEach(() => {
    // Create a test manager
    manager = new ChameleonManager({
      name: 'Test Chameleon Manager',
      type: 'backend',
      cacheExpiry: 1000, // Short TTL for testing
      validationDepth: 'L2'
    });
  });
  
  afterEach(() => {
    // Cleanup
    if (manager) {
      manager.shutdown();
    }
  });
  
  describe('ChameleonManager', () => {
    test('should initialize with proper configuration', () => {
      expect(manager).toBeDefined();
      expect(manager.name).toBe('Test Chameleon Manager');
      expect(manager.config.validationDepth).toBe('L2');
      expect(manager.expertiseCache).toBeDefined();
      expect(manager.absorptionEngine).toBeDefined();
      expect(manager.validationEngine).toBeDefined();
    });
    
    test('should assume expertise for a specialist type', async () => {
      const expertise = await manager.assumeExpertise('python-specialist');
      
      expect(expertise).toBeDefined();
      expect(expertise.type).toBe('python-specialist');
      expect(expertise.capabilities).toContain('Detect Python-specific bugs and anti-patterns');
      expect(expertise.confidence).toBeGreaterThan(0.5);
    });
    
    test('should cache expertise after loading', async () => {
      // First load - should miss cache
      const expertise1 = await manager.assumeExpertise('javascript-specialist');
      expect(manager.metrics.cacheMisses).toBe(1);
      
      // Second load - should hit cache
      const expertise2 = await manager.assumeExpertise('javascript-specialist');
      expect(manager.metrics.cacheHits).toBe(1);
      expect(expertise2).toEqual(expertise1);
    });
    
    test('should validate work using absorbed expertise', async () => {
      const work = {
        code: 'def func(arr=[]): arr.append(1)',
        type: 'function',
        complexity: 'low'
      };
      
      const specialist = {
        name: 'Python Specialist',
        type: 'python-specialist'
      };
      
      const result = await manager.validateWork(work, specialist);
      
      expect(result).toBeDefined();
      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Mutable default argument detected - use None and initialize in function');
    });
    
    test('should determine validation depth based on work criticality', () => {
      expect(manager.determineValidationDepth({ critical: true })).toBe('L3');
      expect(manager.determineValidationDepth({ complexity: 'high' })).toBe('L2');
      expect(manager.determineValidationDepth({ complexity: 'low' })).toBe('L1');
    });
    
    test('should track metrics correctly', async () => {
      await manager.assumeExpertise('react-specialist');
      await manager.assumeExpertise('react-specialist'); // Cache hit
      
      const metrics = manager.getMetrics();
      
      expect(metrics.expertiseSwitches).toBe(1);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheEfficiency).toBeCloseTo(0.5);
    });
    
    test('should preload expertise for multiple specialists', async () => {
      const types = ['golang-specialist', 'database-specialist', 'security-specialist'];
      const loaded = await manager.preloadExpertise(types);
      
      expect(loaded).toBe(3);
      expect(manager.expertiseCache.size).toBe(3);
    });
    
    test('should handle expertise absorption failure gracefully', async () => {
      // Force an error by requesting non-existent specialist
      const expertise = await manager.assumeExpertise('non-existent-specialist');
      
      expect(expertise).toBeDefined();
      expect(expertise.fallback).toBe(true);
      expect(expertise.confidence).toBe(0.5);
    });
  });
  
  describe('ExpertiseAbsorptionEngine', () => {
    let engine;
    
    beforeEach(() => {
      engine = new ExpertiseAbsorptionEngine({
        temperature: 0.3
      });
    });
    
    test('should load expertise profile for known specialist', async () => {
      const expertise = await engine.load('python-specialist');
      
      expect(expertise).toBeDefined();
      expect(expertise.type).toBe('python-specialist');
      expect(expertise.systemPrompt).toContain('Python expert');
      expect(expertise.modelConfig.temperature).toBe(0.3);
    });
    
    test('should generate generic profile for unknown specialist', async () => {
      const expertise = await engine.load('unknown-specialist');
      
      expect(expertise).toBeDefined();
      expect(expertise.capabilities).toContain('Code quality and maintainability');
    });
    
    test('should build contextual expertise based on work context', async () => {
      const expertise = await engine.load('javascript-specialist', {
        workContext: { critical: true, type: 'security' }
      });
      
      expect(expertise.context.level).toBe('senior');
      expect(expertise.context.validationFocus).toContain('security');
      expect(expertise.context.capabilities).toContain('Security auditing');
    });
    
    test('should calculate confidence based on expertise completeness', async () => {
      const expertise = await engine.load('react-specialist');
      
      expect(expertise.confidence).toBeGreaterThan(0.7);
      expect(expertise.confidence).toBeLessThanOrEqual(1.0);
    });
  });
  
  describe('ValidationFramework', () => {
    let framework;
    
    beforeEach(() => {
      framework = new ValidationFramework({
        defaultDepth: 'L2'
      });
    });
    
    test('should perform L1 syntax validation', async () => {
      const work = {
        code: 'var x = 1; if (x == "1") { }',
        identifiers: ['myVariable']
      };
      
      const expertise = {
        domain: 'JavaScript',
        capabilities: []
      };
      
      const result = await framework.validate(work, expertise, { depth: 'L1' });
      
      expect(result).toBeDefined();
      expect(result.warnings).toContain('Use of var - prefer const or let');
      expect(result.level).toBe('L1');
    });
    
    test('should perform L2 logic validation', async () => {
      const work = {
        logic: {
          loops: [{ description: 'while loop', terminationCondition: null }],
          async: true,
          sharedState: true,
          synchronization: false
        }
      };
      
      const expertise = {
        domain: 'JavaScript',
        validationFocus: ['async-safety']
      };
      
      const result = await framework.validate(work, expertise, { depth: 'L2' });
      
      expect(result.errors).toContain('Potential infinite loop detected: while loop');
      expect(result.errors).toContain('Potential race condition: shared state without synchronization');
    });
    
    test('should perform L3 architecture validation', async () => {
      const work = {
        architecture: {
          coupling: 'high',
          cohesion: 'low',
          solidViolations: ['Single Responsibility Principle']
        },
        security: {
          sensitiveData: true,
          encryption: false
        }
      };
      
      const expertise = {
        capabilities: ['SOLID-principles']
      };
      
      const result = await framework.validate(work, expertise, { depth: 'L3' });
      
      expect(result.warnings).toContain('High coupling detected - consider dependency injection');
      expect(result.errors).toContain('Sensitive data not encrypted');
    });
    
    test('should handle validation timeout', async () => {
      const framework = new ValidationFramework({
        timeoutMs: 1 // Very short timeout
      });
      
      // Create work that takes time to validate
      const work = { code: 'complex code' };
      const expertise = {};
      
      // Mock slow validation
      framework.validators.L1.validate = () => new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await framework.validate(work, expertise, { depth: 'L1' });
      
      expect(result.timeout).toBe(true);
      expect(result.errors).toContain('Validation timeout - unable to complete analysis');
    });
  });
  
  describe('ExpertiseCache', () => {
    let cache;
    
    beforeEach(() => {
      cache = new ExpertiseCache({
        maxSize: 3,
        ttl: 1000
      });
    });
    
    test('should cache and retrieve expertise', () => {
      const expertise = { type: 'test', data: 'test data' };
      cache.set('test-specialist', expertise);
      
      const retrieved = cache.get('test-specialist');
      expect(retrieved).toEqual(expertise);
      expect(cache.metrics.hits).toBe(1);
    });
    
    test('should evict LRU when cache is full', () => {
      cache.set('specialist1', { data: 1 });
      cache.set('specialist2', { data: 2 });
      cache.set('specialist3', { data: 3 });
      
      // Access specialist1 to make it more recently used
      cache.get('specialist1');
      
      // Add new item - should evict specialist2 (LRU)
      cache.set('specialist4', { data: 4 });
      
      expect(cache.has('specialist2')).toBe(false);
      expect(cache.has('specialist1')).toBe(true);
      expect(cache.metrics.evictions).toBe(1);
    });
    
    test('should expire entries after TTL', async () => {
      cache.set('temp-specialist', { data: 'temp' });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const retrieved = cache.get('temp-specialist');
      expect(retrieved).toBeNull();
      expect(cache.metrics.expirations).toBe(1);
    });
    
    test('should calculate cache statistics', () => {
      cache.set('specialist1', { data: 1 });
      cache.get('specialist1');
      cache.get('specialist1');
      cache.get('non-existent');
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('66.67%');
      expect(stats.utilizationRate).toBe('33.33%');
    });
    
    test('should optimize cache by removing rarely used entries', () => {
      cache.set('rarely-used', { data: 'rare' });
      cache.set('frequently-used', { data: 'frequent' });
      
      // Access frequently-used multiple times
      cache.get('frequently-used');
      cache.get('frequently-used');
      cache.get('frequently-used');
      
      const evicted = cache.optimize();
      
      expect(evicted).toBe(0); // Won't evict until 80% full
      
      // Fill cache to trigger optimization
      cache.set('another', { data: 'another' });
      const evicted2 = cache.optimize();
      
      expect(cache.has('rarely-used')).toBe(false);
      expect(cache.has('frequently-used')).toBe(true);
    });
  });
  
  describe('Integration Tests', () => {
    test('should perform end-to-end validation with caching', async () => {
      const manager = new ChameleonManager({
        name: 'Integration Test Manager',
        type: 'backend'
      });
      
      // Python code with multiple issues
      const pythonWork = {
        code: `
def process_data(items=[]):
    try:
        for item in items:
            print(item)
    except:
        pass
`,
        complexity: 'medium'
      };
      
      const pythonSpecialist = {
        name: 'Python Dev',
        type: 'python-specialist'
      };
      
      // First validation - loads expertise
      const result1 = await manager.validateWork(pythonWork, pythonSpecialist);
      expect(result1.passed).toBe(false);
      expect(manager.metrics.cacheMisses).toBe(1);
      
      // Second validation - uses cached expertise
      const result2 = await manager.validateWork(pythonWork, pythonSpecialist);
      expect(result2.passed).toBe(false);
      expect(manager.metrics.cacheHits).toBe(1);
      
      // Validate different specialist type
      const jsWork = {
        code: 'const x = []; x.push(1);',
        complexity: 'low'
      };
      
      const jsSpecialist = {
        name: 'JS Dev',
        type: 'javascript-specialist'
      };
      
      const result3 = await manager.validateWork(jsWork, jsSpecialist);
      expect(manager.metrics.expertiseSwitches).toBe(2);
      
      manager.shutdown();
    });
    
    test('should handle rapid expertise switching', async () => {
      const manager = new ChameleonManager({
        name: 'Rapid Switch Manager',
        type: 'backend'
      });
      
      const specialists = [
        'python-specialist',
        'javascript-specialist',
        'golang-specialist',
        'react-specialist',
        'database-specialist'
      ];
      
      // Rapidly switch between different expertise
      for (const type of specialists) {
        const expertise = await manager.assumeExpertise(type);
        expect(expertise.type).toBe(type);
      }
      
      expect(manager.metrics.expertiseSwitches).toBe(5);
      expect(manager.expertiseCache.size).toBe(5);
      
      manager.shutdown();
    });
  });
});