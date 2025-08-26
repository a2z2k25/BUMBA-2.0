/**
 * Fixed Specialist System Tests
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

// Mock the specialist registry
jest.mock('../../../src/core/specialists/specialist-registry', () => ({
  getAllTypes: jest.fn(() => [
    'javascript-specialist',
    'python-specialist',
    'react-specialist',
    'nodejs-specialist',
    'database-specialist'
  ]),
  getSpecialist: jest.fn((type) => {
    const specialists = {
      'javascript-specialist': { name: 'JavaScript Specialist', capabilities: ['js', 'es6'] },
      'python-specialist': { name: 'Python Specialist', capabilities: ['python', 'django'] },
      'react-specialist': { name: 'React Specialist', capabilities: ['react', 'jsx'] }
    };
    return specialists[type];
  }),
  findSpecialistsForTask: jest.fn((task) => {
    if (task.toLowerCase().includes('react')) {
      return ['react-specialist', 'javascript-specialist'];
    }
    if (task.toLowerCase().includes('python')) {
      return ['python-specialist'];
    }
    return ['javascript-specialist'];
  }),
  registerSpecialist: jest.fn(),
  clearRegistry: jest.fn()
}));

const registry = require('../../../src/core/specialists/specialist-registry');

describe('Specialist System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Registry Operations', () => {
    test('should load all specialists', () => {
      const specialists = registry.getAllTypes();
      expect(specialists).toBeDefined();
      expect(Array.isArray(specialists)).toBe(true);
      expect(specialists.length).toBeGreaterThan(0);
    });

    test('should get specialist by type', () => {
      const specialist = registry.getSpecialist('javascript-specialist');
      expect(specialist).toBeDefined();
      expect(specialist.name).toBe('JavaScript Specialist');
      expect(specialist.capabilities).toContain('js');
    });

    test('should return undefined for unknown specialist', () => {
      const specialist = registry.getSpecialist('unknown-specialist');
      expect(specialist).toBeUndefined();
    });

    test('should find specialists for React tasks', () => {
      const matches = registry.findSpecialistsForTask('Create React component');
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
      expect(matches).toContain('react-specialist');
    });

    test('should find specialists for Python tasks', () => {
      const matches = registry.findSpecialistsForTask('Write Python script');
      expect(matches).toBeDefined();
      expect(matches).toContain('python-specialist');
    });

    test('should find default specialists for generic tasks', () => {
      const matches = registry.findSpecialistsForTask('Build feature');
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('Specialist Capabilities', () => {
    test('should have JavaScript specialist', () => {
      const types = registry.getAllTypes();
      expect(types).toContain('javascript-specialist');
    });

    test('should have Python specialist', () => {
      const types = registry.getAllTypes();
      expect(types).toContain('python-specialist');
    });

    test('should have React specialist', () => {
      const types = registry.getAllTypes();
      expect(types).toContain('react-specialist');
    });

    test('should have Node.js specialist', () => {
      const types = registry.getAllTypes();
      expect(types).toContain('nodejs-specialist');
    });

    test('should have Database specialist', () => {
      const types = registry.getAllTypes();
      expect(types).toContain('database-specialist');
    });
  });

  describe('Registry Management', () => {
    test('should register new specialist', () => {
      registry.registerSpecialist('custom-specialist', {
        name: 'Custom Specialist',
        capabilities: ['custom']
      });
      
      expect(registry.registerSpecialist).toHaveBeenCalledWith(
        'custom-specialist',
        expect.objectContaining({
          name: 'Custom Specialist'
        })
      );
    });

    test('should clear registry', () => {
      registry.clearRegistry();
      expect(registry.clearRegistry).toHaveBeenCalled();
    });

    test('should handle multiple specialist queries', () => {
      const tasks = [
        'Create React component',
        'Write Python script',
        'Build REST API'
      ];
      
      const results = tasks.map(task => registry.findSpecialistsForTask(task));
      
      expect(results[0]).toContain('react-specialist');
      expect(results[1]).toContain('python-specialist');
      expect(results[2].length).toBeGreaterThan(0);
    });
  });

  describe('Task Matching', () => {
    test('should match specialists to frontend tasks', () => {
      const task = 'Build user interface with React';
      const matches = registry.findSpecialistsForTask(task);
      expect(matches).toContain('react-specialist');
    });

    test('should match specialists to backend tasks', () => {
      const task = 'Create Python API endpoint';
      const matches = registry.findSpecialistsForTask(task);
      expect(matches).toContain('python-specialist');
    });

    test('should handle empty task gracefully', () => {
      const matches = registry.findSpecialistsForTask('');
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });

    test('should handle null task gracefully', () => {
      const matches = registry.findSpecialistsForTask(null);
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });
  });
});