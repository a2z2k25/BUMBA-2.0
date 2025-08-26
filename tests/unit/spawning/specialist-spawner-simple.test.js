/**
 * Specialist Spawner Simple Tests (No External Dependencies)
 * Verify specialist spawning logic without mocks
 */

// Mock the domain router first
jest.mock('../../../src/core/agents/domain-model-router', () => ({
  DomainModelRouter: class {
    async assignModelToWorker(task) {
      const modelMap = {
        'reasoning': 'deepseek',
        'coding': 'qwen',
        'general': 'gemini'
      };
      return { model: modelMap[task.taskType] || 'gemini' };
    }
  }
}));

// Mock the lifecycle manager
jest.mock('../../../src/core/spawning/agent-lifecycle-manager', () => ({
  AgentLifecycleManager: class {
    constructor() {
      this.activeAgents = new Map();
    }
    
    async spawnSpecialist(department, type, context) {
      // Return a mock specialist
      return {
        id: `${department}-${type}-${Date.now()}`,
        department,
        type,
        context,
        executeTask: async (task) => ({
          status: 'completed',
          result: `Mock execution by ${type}`
        })
      };
    }
    
    async dissolveSpecialist(specialist) {
      return true;
    }
  }
}));

// Mock logger
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const { SpecialistSpawner } = require('../../../src/core/spawning/specialist-spawner');

describe('Specialist Spawner (Simple)', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let spawner;
  
  beforeEach(() => {
    spawner = new SpecialistSpawner();
  });
  
  describe('Specialist Mappings', () => {
    test('should have correct specialist mappings', async () => {
      const available = spawner.getAvailableSpecialists();
      
      // Check key specialists exist
      expect(available).toContain('security-specialist');
      expect(available).toContain('database-specialist');
      expect(available).toContain('python-specialist');
      expect(available).toContain('frontend-specialist');
      
      // Should have at least 15 specialist types
      expect(available.length).toBeGreaterThanOrEqual(15);
    });
    
    test('should map task types correctly', async () => {
      const mappings = spawner.specialistMappings;
      
      // Reasoning tasks
      expect(mappings['security-specialist'].taskType).toBe('reasoning');
      expect(mappings['market-research-specialist'].taskType).toBe('reasoning');
      expect(mappings['ux-research-specialist'].taskType).toBe('reasoning');
      
      // Coding tasks  
      expect(mappings['database-specialist'].taskType).toBe('coding');
      expect(mappings['frontend-specialist'].taskType).toBe('coding');
      expect(mappings['python-specialist'].taskType).toBe('coding');
      expect(mappings['javascript-specialist'].taskType).toBe('coding');
      
      // General tasks
      expect(mappings['technical-writer'].taskType).toBe('general');
      expect(mappings['ui-designer'].taskType).toBe('general');
    });
    
    test('should assign departments correctly', async () => {
      const mappings = spawner.specialistMappings;
      
      // Strategic
      expect(mappings['market-research-specialist'].department).toBe('strategic');
      expect(mappings['product-owner'].department).toBe('strategic');
      
      // Experience
      expect(mappings['ux-research-specialist'].department).toBe('experience');
      expect(mappings['frontend-specialist'].department).toBe('experience');
      
      // Technical
      expect(mappings['security-specialist'].department).toBe('technical');
      expect(mappings['database-specialist'].department).toBe('technical');
      expect(mappings['python-specialist'].department).toBe('technical');
    });
  });
  
  describe('Model Assignment', () => {
    test('should assign correct models based on task type', async () => {
      // Test reasoning task
      const reasoningModel = await spawner.assignModel({
        taskType: 'reasoning',
        department: 'technical'
      });
      expect(reasoningModel).toBe('deepseek');
      
      // Test coding task
      const codingModel = await spawner.assignModel({
        taskType: 'coding',
        department: 'technical'
      });
      expect(codingModel).toBe('qwen');
      
      // Test general task
      const generalModel = await spawner.assignModel({
        taskType: 'general',
        department: 'experience'
      });
      expect(generalModel).toBe('gemini');
    });
  });
  
  describe('Spawning Specialists', () => {
    test('should spawn specialist with correct configuration', async () => {
      const agentConfig = {
        name: 'security-specialist',
        role: 'specialist',
        model: 'deepseek',
        usingClaudeMax: false
      };
      
      const specialist = await spawner.spawnSpecialist(agentConfig);
      
      expect(specialist).toBeDefined();
      expect(specialist.department).toBe('technical');
      expect(specialist.type).toBe('security');
      expect(specialist.context.model).toBe('deepseek');
      expect(specialist.context.usingClaudeMax).toBe(false);
    });
    
    test('should track spawned specialists', async () => {
      const agentConfig = {
        name: 'database-specialist',
        role: 'specialist',
        model: 'qwen',
        usingClaudeMax: false
      };
      
      const specialist = await spawner.spawnSpecialist(agentConfig);
      
      // Check tracking
      expect(spawner.activeSpecialists.size).toBe(1);
      expect(spawner.getSpecialist(specialist.id)).toBe(specialist);
      
      // Check metrics
      const metrics = spawner.getMetrics();
      expect(metrics.totalSpawned).toBe(1);
      expect(metrics.byType['database-specialist']).toBe(1);
      expect(metrics.byDepartment['technical']).toBe(1);
      expect(metrics.modelAssignments['qwen']).toBe(1);
    });
    
    test('should spawn multiple specialists from routing plan', async () => {
      const routingPlan = {
        execution: {
          agents: [
            {
              name: 'security-specialist',
              role: 'specialist',
              model: 'deepseek',
              usingClaudeMax: false
            },
            {
              name: 'database-specialist',
              role: 'specialist',
              model: 'qwen',
              usingClaudeMax: false
            },
            {
              name: 'frontend-specialist',
              role: 'specialist',
              model: 'qwen',
              usingClaudeMax: false
            }
          ]
        }
      };
      
      const specialists = await spawner.spawnSpecialistsForPlan(routingPlan);
      
      expect(specialists).toHaveLength(3);
      expect(spawner.activeSpecialists.size).toBe(3);
      
      // Check metrics
      const metrics = spawner.getMetrics();
      expect(metrics.totalSpawned).toBe(3);
      expect(metrics.currentlyActive).toBe(3);
    });
    
    test('should skip non-specialist agents in routing plan', async () => {
      const routingPlan = {
        execution: {
          agents: [
            {
              name: 'backend-engineer-manager',
              role: 'manager',
              model: 'claude-max',
              usingClaudeMax: true
            },
            {
              name: 'security-specialist',
              role: 'specialist',
              model: 'deepseek',
              usingClaudeMax: false
            }
          ]
        }
      };
      
      const specialists = await spawner.spawnSpecialistsForPlan(routingPlan);
      
      // Should only spawn specialist, not manager
      expect(specialists).toHaveLength(1);
      expect(spawner.activeSpecialists.size).toBe(1);
    });
  });
  
  describe('Specialist Capabilities', () => {
    test('should return capabilities for known specialists', async () => {
      const securityCaps = spawner.getSpecialistCapabilities('security-specialist');
      expect(securityCaps).toContain('security audit');
      expect(securityCaps).toContain('vulnerability assessment');
      expect(securityCaps).toContain('encryption');
      
      const dbCaps = spawner.getSpecialistCapabilities('database-specialist');
      expect(dbCaps).toContain('sql');
      expect(dbCaps).toContain('optimization');
      expect(dbCaps).toContain('schema design');
      
      const pythonCaps = spawner.getSpecialistCapabilities('python-specialist');
      expect(pythonCaps).toContain('django');
      expect(pythonCaps).toContain('flask');
      expect(pythonCaps).toContain('fastapi');
    });
    
    test('should return empty array for unknown specialists', async () => {
      const caps = spawner.getSpecialistCapabilities('unknown-specialist');
      expect(caps).toEqual([]);
    });
  });
  
  describe('Availability Check', () => {
    test('should correctly check specialist availability', async () => {
      // Known specialists
      expect(spawner.isSpecialistAvailable('security-specialist')).toBe(true);
      expect(spawner.isSpecialistAvailable('database-specialist')).toBe(true);
      expect(spawner.isSpecialistAvailable('python-specialist')).toBe(true);
      expect(spawner.isSpecialistAvailable('frontend-specialist')).toBe(true);
      
      // Unknown specialists
      expect(spawner.isSpecialistAvailable('unknown-specialist')).toBe(false);
      expect(spawner.isSpecialistAvailable('random-specialist')).toBe(false);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=specialist-spawner-simple\\.test\\.js']);
}