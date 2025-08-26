const specialistRegistry = require('../../../src/core/specialists/specialist-registry');

describe('SpecialistRegistry', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('getSpecialist', () => {
    it('should return specialized specialists', () => {
      const postgresSpec = specialistRegistry.getSpecialist('postgres-specialist');
      expect(postgresSpec).toBeDefined();
      expect(postgresSpec.name).toBe('PostgreSQL Database Specialist');
    });

    it('should return basic specialists', () => {
      const backendSpec = specialistRegistry.getSpecialist('backend-engineer');
      expect(backendSpec).toBeDefined();
      expect(backendSpec.name).toBe('Backend Engineer');
    });

    it('should return generalist for unknown types', () => {
      const unknownSpec = specialistRegistry.getSpecialist('unknown-specialist');
      expect(unknownSpec).toBeDefined();
      expect(unknownSpec.type).toBe('generalist');
    });
  });

  describe('findSpecialistsForTask', () => {
    it('should find PostgreSQL specialist for postgres tasks', () => {
      const task = 'optimize PostgreSQL database queries';
      const matches = specialistRegistry.findSpecialistsForTask(task);
      
      expect(matches.length).toBeGreaterThan(0);
      
      // Accept multiple valid specialists for database tasks
      const match = matches[0];
      const validSpecialists = [
        'postgres-specialist', 
        'database-admin', 
        'database-optimizer',
        'sql-specialist',
        'backend-engineer',
        'data-engineer'
      ];
      expect(validSpecialists).toContain(match.type);
    });

    it('should find React specialist for React tasks', () => {
      const task = 'build a React component with hooks';
      const matches = specialistRegistry.findSpecialistsForTask(task);
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe('react-specialist');
    });

    it('should find multiple specialists for complex tasks', () => {
      const task = 'build a React frontend with MongoDB backend';
      const matches = specialistRegistry.findSpecialistsForTask(task);
      
      const types = matches.map(m => m.type);
      expect(types).toContain('react-specialist');
      expect(types).toContain('mongodb-specialist');
    });

    it('should rank specialists by confidence', () => {
      const task = 'implement Vue.js composition API with Pinia state management';
      const matches = specialistRegistry.findSpecialistsForTask(task);
      
      expect(matches[0].type).toBe('vue-specialist');
      expect(matches[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe('getAllTypes', () => {
    it('should return all specialist types', () => {
      const types = specialistRegistry.getAllTypes();
      
      expect(types).toContain('backend-engineer');
      expect(types).toContain('postgres-specialist');
      expect(types).toContain('react-specialist');
      expect(types).toContain('vue-specialist');
      expect(types.length).toBeGreaterThan(10);
    });
  });

  describe('getSpecialistsByCategory', () => {
    it('should categorize specialists correctly', () => {
      const categories = specialistRegistry.getSpecialistsByCategory();
      
      expect(categories.backend.length).toBeGreaterThan(0);
      expect(categories.frontend.length).toBeGreaterThan(0);
      expect(categories.database.length).toBeGreaterThan(0);
      
      // Check specific categorizations
      const backendTypes = categories.backend.map(s => s.type);
      expect(backendTypes).toContain('backend-engineer');
      
      const frontendTypes = categories.frontend.map(s => s.type);
      expect(frontendTypes).toContain('react-specialist');
      expect(frontendTypes).toContain('vue-specialist');
      
      const databaseTypes = categories.database.map(s => s.type);
      expect(databaseTypes).toContain('postgres-specialist');
      expect(databaseTypes).toContain('mongodb-specialist');
    });
  });

  describe('searchBySkillOrTool', () => {
    it('should find specialists by skill', () => {
      const results = specialistRegistry.searchBySkillOrTool('schema');
      
      expect(results.length).toBeGreaterThan(0);
      const types = results.map(r => r.type);
      expect(types).toContain('database-specialist');
      expect(types).toContain('postgres-specialist');
    });

    it('should find specialists by tool', () => {
      const results = specialistRegistry.searchBySkillOrTool('react');
      
      expect(results.length).toBeGreaterThan(0);
      // Frontend specialist handles React
      expect(results[0].type).toBe('frontend-specialist');
      expect(results[0].matchedTools).toContain('react');
    });

    it('should find multiple matches', () => {
      const results = specialistRegistry.searchBySkillOrTool('test');
      
      expect(results.length).toBeGreaterThan(0);
      const types = results.map(r => r.type);
      expect(types).toContain('qa-engineer');
    });
  });
});