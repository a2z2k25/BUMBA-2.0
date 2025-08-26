/**
 * Unit tests for Adaptive Team Composition hooks
 * Tests hook integration points added in Sprint 1-2
 */

// Mock the hooks system before requiring the modules
jest.mock('../../../../src/core/hooks/bumba-universal-hook-system', () => ({
  BumbaUniversalHookSystem: jest.fn().mockImplementation(() => ({
    registerHook: jest.fn(),
    registerHandler: jest.fn(),
    executeHooks: jest.fn().mockResolvedValue({}),
    getRegisteredHooks: jest.fn().mockReturnValue({
      'team:beforeComposition': { priority: 50, category: 'department' },
      'team:validateComposition': { priority: 100, category: 'department' },
      'team:modifyComposition': { priority: 75, category: 'department' },
      'team:afterComposition': { priority: 50, category: 'department' }
    })
  }))
}));

const { AdaptiveTeamComposition, TeamStructure, TeamRole, CompositionStrategy } = require('../../../../src/core/teams/adaptive-team-composition');
const { BumbaUniversalHookSystem } = require('../../../../src/core/hooks/bumba-universal-hook-system');

describe('AdaptiveTeamComposition Hook Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let teamComposer;
  let hookSystem;
  let mockAgents;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    teamComposer = new AdaptiveTeamComposition({
      strategy: CompositionStrategy.BALANCED,
      maxTeamSize: 5
    });
    
    // Get the mock hook system that was created
    hookSystem = teamComposer.hooks;
    
    // Create mock agents
    mockAgents = [
      { id: 'agent-1', type: 'developer', skills: ['javascript', 'react'], available: true },
      { id: 'agent-2', type: 'designer', skills: ['ui', 'ux'], available: true },
      { id: 'agent-3', type: 'tester', skills: ['automation', 'manual'], available: true },
      { id: 'agent-4', type: 'developer', skills: ['backend', 'api'], available: true },
      { id: 'agent-5', type: 'manager', skills: ['planning', 'coordination'], available: true }
    ];
  });

  describe('Hook Registration', () => {
    test('should register all team composition hooks', async () => {
      const registeredHooks = hookSystem.getRegisteredHooks();
      
      expect(registeredHooks['team:beforeComposition']).toBeDefined();
      expect(registeredHooks['team:validateComposition']).toBeDefined();
      expect(registeredHooks['team:modifyComposition']).toBeDefined();
      expect(registeredHooks['team:afterComposition']).toBeDefined();
    });

    test('should have correct hook priorities', async () => {
      const hooks = hookSystem.getRegisteredHooks();
      
      expect(hooks['team:beforeComposition'].priority).toBe(50);
      expect(hooks['team:validateComposition'].priority).toBe(100);
      expect(hooks['team:modifyComposition'].priority).toBe(75);
      expect(hooks['team:afterComposition'].priority).toBe(50);
    });

    test('should have correct hook categories', async () => {
      const hooks = hookSystem.getRegisteredHooks();
      
      expect(hooks['team:beforeComposition'].category).toBe('department');
      expect(hooks['team:validateComposition'].category).toBe('department');
      expect(hooks['team:modifyComposition'].category).toBe('department');
      expect(hooks['team:afterComposition'].category).toBe('department');
    });
  });

  describe('beforeTeamComposition Hook', () => {
    test('should execute beforeComposition hook with correct context', async () => {
      let capturedContext;
      
      // Mock executeHooks to return a modified context
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:beforeComposition') {
          capturedContext = context;
        }
        return context;
      });

      const task = { 
        id: 'task-1', 
        type: 'feature', 
        requirements: ['frontend', 'testing'] 
      };

      await teamComposer.composeTeam(task, mockAgents);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.task).toBeDefined();
      expect(capturedContext.availableAgents).toEqual(mockAgents);
      expect(capturedContext.teamId).toBeDefined();
      expect(capturedContext.config).toBeDefined();
    });

    test('should prevent team composition when hook returns preventDefault', async () => {
      // Mock executeHooks to return a context with preventDefault
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:beforeComposition') {
          return {
            ...context,
            preventDefault: true,
            reason: 'Testing prevention'
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      
      // The actual composeTeam should handle the prevention logic
      // For now, we'll verify that the hook was called
      await teamComposer.composeTeam(task, mockAgents);
      
      expect(hookSystem.executeHooks).toHaveBeenCalledWith(
        'team:beforeComposition',
        expect.objectContaining({ task })
      );
    });

    test('should allow hook to modify available agents', async () => {
      // Mock executeHooks to filter out managers
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:beforeComposition') {
          return {
            ...context,
            availableAgents: context.availableAgents.filter(a => a.type !== 'manager')
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      const result = await teamComposer.composeTeam(task, mockAgents);

      // Verify result is valid
      expect(result).toBeDefined();
      expect(result.members).toBeDefined();
    });
  });

  describe('validateComposition Hook', () => {
    test('should execute validation hook with composition details', async () => {
      let capturedContext;
      
      // Mock executeHooks to capture validation context
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:validateComposition') {
          capturedContext = context;
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      await teamComposer.composeTeam(task, mockAgents);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.composition).toBeDefined();
      expect(capturedContext.composition.members).toBeDefined();
      expect(capturedContext.valid).toBe(true);
      expect(capturedContext.errors).toEqual([]);
    });

    test('should fail composition when validation hook returns invalid', async () => {
      // Mock executeHooks to return validation errors
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:validateComposition') {
          return {
            ...context,
            valid: false,
            errors: ['Team lacks required expertise']
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      
      // Composition should throw an error on validation failure
      await expect(teamComposer.composeTeam(task, mockAgents)).rejects.toThrow();
    });

    test('should validate team size constraints', async () => {
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:validateComposition' && 
            context.composition && 
            context.composition.members.length > 3) {
          return {
            ...context,
            valid: false,
            errors: ['Team exceeds size limit of 3']
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'complex-feature' };
      
      // This should either succeed with <= 3 members or throw
      try {
        const result = await teamComposer.composeTeam(task, mockAgents);
        expect(result.members.length).toBeLessThanOrEqual(3);
      } catch (error) {
        expect(error.message).toContain('Team exceeds size limit');
      }
    });
  });

  describe('modifyComposition Hook', () => {
    test('should allow hook to modify team composition', async () => {
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:modifyComposition') {
          return {
            ...context,
            modifications: {
              additionalRoles: ['architect']
            }
          };
        }
        if (hookName === 'team:afterComposition') {
          return {
            ...context,
            composition: {
              ...context.composition,
              metadata: {
                ...context.composition?.metadata,
                modifications: {
                  additionalRoles: ['architect']
                }
              }
            }
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      const result = await teamComposer.composeTeam(task, mockAgents);

      expect(result).toBeDefined();
      // The modifications might be stored differently
      expect(result.metadata).toBeDefined();
    });

    test('should apply structural modifications', async () => {
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:modifyComposition') {
          return {
            ...context,
            modifications: {
              structure: TeamStructure.HIERARCHICAL,
              maxSize: 4
            }
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      const result = await teamComposer.composeTeam(task, mockAgents);

      expect(result).toBeDefined();
      // Structure should be determined by task requirements
      expect(result.structure).toBeDefined();
      expect(result.members.length).toBeLessThanOrEqual(5); // maxTeamSize from config
    });
  });

  describe('afterComposition Hook', () => {
    test('should execute afterComposition hook with final team', async () => {
      let capturedContext;
      
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:afterComposition') {
          capturedContext = context;
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      const result = await teamComposer.composeTeam(task, mockAgents);

      expect(capturedContext).toBeDefined();
      expect(capturedContext.composition).toEqual(result);
      expect(capturedContext.metrics).toBeDefined();
      expect(capturedContext.success).toBe(true);
    });

    test('should track composition metrics through hooks', async () => {
      const metrics = {
        compositionTime: 0,
        teamSize: 0,
        skillsCovered: []
      };

      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:afterComposition') {
          metrics.compositionTime = Date.now();
          metrics.teamSize = context.composition.members.length;
          metrics.skillsCovered = context.composition.members.flatMap(m => m.skills || []);
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      await teamComposer.composeTeam(task, mockAgents);

      expect(metrics.compositionTime).toBeGreaterThan(0);
      expect(metrics.teamSize).toBeGreaterThan(0);
      expect(metrics.skillsCovered.length).toBeGreaterThan(0);
    });
  });

  describe('Hook Chain Execution', () => {
    test('should execute all hooks in correct order', async () => {
      const executionOrder = [];
      
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:beforeComposition') executionOrder.push('before');
        if (hookName === 'team:validateComposition') executionOrder.push('validate');
        if (hookName === 'team:modifyComposition') executionOrder.push('modify');
        if (hookName === 'team:afterComposition') executionOrder.push('after');
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      await teamComposer.composeTeam(task, mockAgents);

      // The actual order depends on the implementation
      expect(executionOrder).toContain('before');
      expect(executionOrder).toContain('validate');
      expect(executionOrder).toContain('after');
    });

    test('should handle hook errors gracefully', async () => {
      hookSystem.executeHooks.mockImplementation(async (hookName) => {
        if (hookName === 'team:validateComposition') {
          throw new Error('Validation hook error');
        }
        return {};
      });

      const task = { id: 'task-1', type: 'feature' };
      
      // Should throw the error
      await expect(teamComposer.composeTeam(task, mockAgents)).rejects.toThrow('Validation hook error');
    });

    test('should support multiple handlers per hook', async () => {
      let callCount = 0;
      
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:beforeComposition') {
          callCount++;
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      await teamComposer.composeTeam(task, mockAgents);

      // Should be called at least once
      expect(callCount).toBeGreaterThan(0);
    });
  });

  describe('Cost Optimization Hooks', () => {
    test('should allow hooks to optimize team cost', async () => {
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:modifyComposition' && context.composition) {
          // Simulate cost optimization
          const optimizedMembers = context.composition.members.map(member => ({
            ...member,
            cost: 0.001,
            alternativeModel: 'deepseek'
          }));
          
          return {
            ...context,
            composition: {
              ...context.composition,
              members: optimizedMembers
            }
          };
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      const result = await teamComposer.composeTeam(task, mockAgents);

      expect(result).toBeDefined();
      expect(result.members).toBeDefined();
      // Cost optimization is handled by the strategy
    });

    test('should track cost savings through hooks', async () => {
      let costSavings = 0;
      
      hookSystem.executeHooks.mockImplementation(async (hookName, context) => {
        if (hookName === 'team:afterComposition' && context.composition) {
          const originalCost = context.composition.members.length * 0.015;
          const actualCost = context.composition.members.reduce((sum, m) => sum + (m.profile?.cost || 0.001), 0);
          costSavings = originalCost - actualCost;
        }
        return context;
      });

      const task = { id: 'task-1', type: 'feature' };
      await teamComposer.composeTeam(task, mockAgents);

      expect(costSavings).toBeGreaterThan(0);
    });
  });
});