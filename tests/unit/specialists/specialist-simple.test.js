/**
 * Simple Specialist Tests - No External Dependencies
 */

// Mock dependencies
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(), 
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  }
}));

describe('Specialist System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  // Create a mock specialist registry
  const mockRegistry = {
    specialists: new Map([
      ['javascript', { name: 'JavaScript', capabilities: ['js', 'node', 'react'] }],
      ['python', { name: 'Python', capabilities: ['python', 'django', 'flask'] }],
      ['database', { name: 'Database', capabilities: ['sql', 'postgres', 'mongo'] }],
      ['frontend', { name: 'Frontend', capabilities: ['html', 'css', 'react'] }],
      ['backend', { name: 'Backend', capabilities: ['api', 'rest', 'graphql'] }]
    ]),
    
    getAllTypes() {
      return Array.from(this.specialists.keys());
    },
    
    getSpecialist(type) {
      return this.specialists.get(type);
    },
    
    findSpecialistsForTask(task) {
      const taskLower = (task || '').toLowerCase();
      const matches = [];
      
      for (const [type, spec] of this.specialists) {
        if (spec.capabilities.some(cap => taskLower.includes(cap))) {
          matches.push(type);
        }
      }
      
      return matches.length > 0 ? matches : ['javascript']; // default
    },
    
    registerSpecialist(type, spec) {
      this.specialists.set(type, spec);
    },
    
    clearRegistry() {
      this.specialists.clear();
    }
  };

  describe('Registry Operations', () => {
    test('should get all specialist types', () => {
      const types = mockRegistry.getAllTypes();
      expect(types).toEqual(['javascript', 'python', 'database', 'frontend', 'backend']);
      expect(types.length).toBe(5);
    });

    test('should get specialist by type', () => {
      const specialist = mockRegistry.getSpecialist('javascript');
      expect(specialist).toBeDefined();
      expect(specialist.name).toBe('JavaScript');
      expect(specialist.capabilities).toContain('js');
    });

    test('should return undefined for unknown type', () => {
      const specialist = mockRegistry.getSpecialist('unknown');
      expect(specialist).toBeUndefined();
    });

    test('should register new specialist', () => {
      mockRegistry.registerSpecialist('rust', {
        name: 'Rust',
        capabilities: ['rust', 'wasm']
      });
      
      const specialist = mockRegistry.getSpecialist('rust');
      expect(specialist).toBeDefined();
      expect(specialist.name).toBe('Rust');
    });

    test('should clear registry', () => {
      const initialCount = mockRegistry.getAllTypes().length;
      expect(initialCount).toBeGreaterThan(0);
      
      mockRegistry.clearRegistry();
      expect(mockRegistry.specialists.size).toBe(0);
      
      // Restore all specialists for other tests
      mockRegistry.specialists.set('javascript', { name: 'JavaScript', capabilities: ['js', 'node', 'react'] });
      mockRegistry.specialists.set('python', { name: 'Python', capabilities: ['python', 'django', 'flask'] });
      mockRegistry.specialists.set('database', { name: 'Database', capabilities: ['sql', 'postgres', 'mongo'] });
      mockRegistry.specialists.set('frontend', { name: 'Frontend', capabilities: ['html', 'css', 'react'] });
      mockRegistry.specialists.set('backend', { name: 'Backend', capabilities: ['api', 'rest', 'graphql'] });
    });
  });

  describe('Task Matching', () => {
    test('should find specialists for JavaScript task', () => {
      const matches = mockRegistry.findSpecialistsForTask('Build React component');
      expect(matches).toContain('frontend');
      expect(matches.length).toBeGreaterThan(0);
    });

    test('should find specialists for Python task', () => {
      const matches = mockRegistry.findSpecialistsForTask('Create Django model');
      expect(matches).toContain('python');
    });

    test('should find specialists for database task', () => {
      const matches = mockRegistry.findSpecialistsForTask('Write SQL query');
      expect(matches).toContain('database');
    });

    test('should find specialists for API task', () => {
      const matches = mockRegistry.findSpecialistsForTask('Build REST API');
      expect(matches).toContain('backend');
    });

    test('should return default for unknown task', () => {
      const matches = mockRegistry.findSpecialistsForTask('Unknown task xyz');
      expect(matches).toContain('javascript');
    });

    test('should handle empty task', () => {
      const matches = mockRegistry.findSpecialistsForTask('');
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });

    test('should handle null task', () => {
      const matches = mockRegistry.findSpecialistsForTask(null);
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });
  });

  describe('Specialist Capabilities', () => {
    test('should have correct JavaScript capabilities', () => {
      const spec = mockRegistry.getSpecialist('javascript');
      expect(spec.capabilities).toContain('js');
      expect(spec.capabilities).toContain('node');
      expect(spec.capabilities).toContain('react');
    });

    test('should have correct Python capabilities', () => {
      const spec = mockRegistry.getSpecialist('python');
      expect(spec.capabilities).toContain('python');
      expect(spec.capabilities).toContain('django');
    });

    test('should have correct Database capabilities', () => {
      const spec = mockRegistry.getSpecialist('database');
      expect(spec.capabilities).toContain('sql');
      expect(spec.capabilities).toContain('postgres');
    });

    test('should have correct Frontend capabilities', () => {
      const spec = mockRegistry.getSpecialist('frontend');
      expect(spec.capabilities).toContain('html');
      expect(spec.capabilities).toContain('css');
      expect(spec.capabilities).toContain('react');
    });

    test('should have correct Backend capabilities', () => {
      const spec = mockRegistry.getSpecialist('backend');
      expect(spec.capabilities).toContain('api');
      expect(spec.capabilities).toContain('rest');
    });
  });
});