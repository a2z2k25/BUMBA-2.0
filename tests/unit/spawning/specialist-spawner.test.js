/**
 * Specialist Spawner Tests
 * Verify specialist spawning with correct model assignments
 */

const { SpecialistSpawner } = require('../../../src/core/spawning/specialist-spawner');

describe('Specialist Spawner', () => {
  let spawner;
  
  beforeEach(() => {
    spawner = new SpecialistSpawner();
  });
  
  afterEach(async () => {
    // Clean up any spawned specialists
    await spawner.dissolveAll('test_cleanup');
  });
  
  describe('Specialist Mappings', () => {
    test('should have all required specialist types', async () => {
      const available = spawner.getAvailableSpecialists();
      
      // Strategic specialists
      expect(available).toContain('market-research-specialist');
      expect(available).toContain('product-owner');
      expect(available).toContain('business-analyst');
      expect(available).toContain('technical-writer');
      
      // Experience specialists
      expect(available).toContain('ux-research-specialist');
      expect(available).toContain('ui-designer');
      expect(available).toContain('frontend-specialist');
      expect(available).toContain('accessibility-specialist');
      
      // Technical specialists
      expect(available).toContain('security-specialist');
      expect(available).toContain('database-specialist');
      expect(available).toContain('devops-engineer');
      expect(available).toContain('backend-developer');
      
      // Language specialists
      expect(available).toContain('javascript-specialist');
      expect(available).toContain('python-specialist');
      expect(available).toContain('golang-specialist');
      expect(available).toContain('rust-specialist');
    });
    
    test('should map specialists to correct departments', async () => {
      const mappings = spawner.specialistMappings;
      
      // Strategic department
      expect(mappings['market-research-specialist'].department).toBe('strategic');
      expect(mappings['product-owner'].department).toBe('strategic');
      
      // Experience department
      expect(mappings['ux-research-specialist'].department).toBe('experience');
      expect(mappings['frontend-specialist'].department).toBe('experience');
      
      // Technical department
      expect(mappings['security-specialist'].department).toBe('technical');
      expect(mappings['database-specialist'].department).toBe('technical');
    });
    
    test('should assign correct task types', async () => {
      const mappings = spawner.specialistMappings;
      
      // Reasoning specialists
      expect(mappings['security-specialist'].taskType).toBe('reasoning');
      expect(mappings['market-research-specialist'].taskType).toBe('reasoning');
      
      // Coding specialists
      expect(mappings['database-specialist'].taskType).toBe('coding');
      expect(mappings['frontend-specialist'].taskType).toBe('coding');
      expect(mappings['python-specialist'].taskType).toBe('coding');
      
      // General specialists
      expect(mappings['technical-writer'].taskType).toBe('general');
      expect(mappings['ui-designer'].taskType).toBe('general');
    });
  });
  
  describe('Model Assignment', () => {
    test('should assign DeepSeek for reasoning tasks', async () => {
      const mapping = {
        taskType: 'reasoning',
        department: 'technical'
      };
      
      const model = await spawner.assignModel(mapping);
      expect(model).toBe('deepseek');
    });
    
    test('should assign Qwen for coding tasks', async () => {
      const mapping = {
        taskType: 'coding',
        department: 'technical'
      };
      
      const model = await spawner.assignModel(mapping);
      expect(model).toBe('qwen');
    });
    
    test('should assign Gemini for general tasks', async () => {
      const mapping = {
        taskType: 'general',
        department: 'experience'
      };
      
      const model = await spawner.assignModel(mapping);
      expect(model).toBe('gemini');
    });
  });
  
  describe('Spawning from Routing Plan', () => {
    test('should spawn specialists from routing plan', async () => {
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
            }
          ]
        }
      };
      
      const specialists = await spawner.spawnSpecialistsForPlan(routingPlan);
      
      expect(specialists).toHaveLength(2);
      expect(specialists[0]).toBeDefined();
      expect(specialists[1]).toBeDefined();
    });
    
    test('should skip non-specialist agents', async () => {
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
      
      // Should only spawn the specialist, not the manager
      expect(specialists).toHaveLength(1);
      expect(spawner.activeSpecialists.size).toBe(1);
    });
  });
  
  describe('Specialist Tracking', () => {
    test('should track spawned specialists', async () => {
      const agentConfig = {
        name: 'python-specialist',
        role: 'specialist',
        model: 'qwen',
        usingClaudeMax: false
      };
      
      const specialist = await spawner.spawnSpecialist(agentConfig);
      
      expect(spawner.activeSpecialists.size).toBe(1);
      expect(spawner.getSpecialist(specialist.id)).toBe(specialist);
      
      const metrics = spawner.getMetrics();
      expect(metrics.totalSpawned).toBe(1);
      expect(metrics.byType['python-specialist']).toBe(1);
      expect(metrics.modelAssignments['qwen']).toBe(1);
    });
    
    test('should dissolve specialists', async () => {
      const agentConfig = {
        name: 'frontend-specialist',
        role: 'specialist',
        model: 'qwen',
        usingClaudeMax: false
      };
      
      const specialist = await spawner.spawnSpecialist(agentConfig);
      expect(spawner.activeSpecialists.size).toBe(1);
      
      await spawner.dissolveSpecialist(specialist.id);
      expect(spawner.activeSpecialists.size).toBe(0);
    });
  });
  
  describe('Capabilities Query', () => {
    test('should return specialist capabilities', async () => {
      const securityCaps = spawner.getSpecialistCapabilities('security-specialist');
      expect(securityCaps).toContain('security audit');
      expect(securityCaps).toContain('vulnerability assessment');
      
      const pythonCaps = spawner.getSpecialistCapabilities('python-specialist');
      expect(pythonCaps).toContain('django');
      expect(pythonCaps).toContain('flask');
      
      const unknownCaps = spawner.getSpecialistCapabilities('unknown-specialist');
      expect(unknownCaps).toEqual([]);
    });
    
    test('should check specialist availability', async () => {
      expect(spawner.isSpecialistAvailable('security-specialist')).toBe(true);
      expect(spawner.isSpecialistAvailable('python-specialist')).toBe(true);
      expect(spawner.isSpecialistAvailable('unknown-specialist')).toBe(false);
    });
  });
});

// Run tests
if (require.main === module) {
  const jest = require('jest');
  jest.run(['--testPathPattern=specialist-spawner\\.test\\.js']);
}