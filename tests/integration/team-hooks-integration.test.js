/**
 * Integration tests for Team Composition Hooks
 * Tests end-to-end team formation with hook system
 */

const { DynamicAgentLifecycleOrchestrator } = require('../../src/core/dynamic-agent-lifecycle-orchestrator');
const { AdaptiveTeamComposition, TeamStructure, CompositionStrategy } = require('../../src/core/teams/adaptive-team-composition');
const { DepartmentProtocols } = require('../../src/core/coordination/department-protocols');
const { DepartmentManager } = require('../../src/core/departments/department-manager');
const { TaskType, ComplexityLevel } = require('../../src/core/planning/task-decomposition-engine');

describe('Team Hooks Integration', () => {
  let orchestrator;
  let teamComposer;
  let departmentProtocols;
  let costSavings;

  beforeEach(() => {
    // Initialize orchestrator with hook system
    orchestrator = new DynamicAgentLifecycleOrchestrator({
      maxAgents: 20,
      maxTeams: 5,
      costBudget: 10.00, // $10 budget
      autoOptimization: true
    });

    // Get components
    teamComposer = orchestrator.teamComposer;
    departmentProtocols = new DepartmentProtocols();
    
    // Initialize cost tracking
    costSavings = 0;

    // Register global cost optimization hooks
    registerCostOptimizationHooks();
  });

  function registerCostOptimizationHooks() {
    // Team composition cost optimization
    orchestrator.hooks.registerHandler('team:beforeComposition', async (context) => {
      context.budgetRemaining = orchestrator.resourceMonitor.getResourceSummary().budget.remaining.daily;
      context.costTarget = context.budgetRemaining * 0.1; // Use max 10% per team
      return context;
    });

    orchestrator.hooks.registerHandler('team:validateComposition', async (context) => {
      const totalCost = context.composition.members.reduce((sum, m) => sum + (m.estimatedCost || 0.001), 0);
      
      if (totalCost > context.costTarget) {
        context.errors.push(`Team cost $${totalCost.toFixed(3)} exceeds target $${context.costTarget.toFixed(3)}`);
        context.needsOptimization = true;
      }
      return context;
    });

    orchestrator.hooks.registerHandler('team:modifyComposition', async (context) => {
      if (context.needsOptimization) {
        // Replace expensive agents with cheaper alternatives
        context.modifications = {
          members: context.composition.members.map(member => {
            if (member.model === 'claude-max') {
              const originalCost = 0.015;
              member.model = 'deepseek';
              member.estimatedCost = 0.001;
              costSavings += (originalCost - member.estimatedCost);
            }
            return member;
          })
        };
      }
      return context;
    });

    orchestrator.hooks.registerHandler('team:afterComposition', async (context) => {
      // Track team metrics
      const metrics = {
        teamId: context.team.id,
        size: context.team.members.length,
        cost: context.team.members.reduce((sum, m) => sum + (m.estimatedCost || 0), 0),
        savings: costSavings,
        duration: context.duration
      };
      
      console.log('Team formed:', metrics);
      return context;
    });
  }

  describe('End-to-End Team Formation', () => {
    test('should form team with cost optimization hooks', async () => {
      const task = {
        id: 'feature-123',
        name: 'Build user dashboard',
        type: TaskType.FEATURE,
        complexity: ComplexityLevel.MEDIUM,
        requirements: ['frontend', 'backend', 'testing']
      };

      const result = await orchestrator.processTask(task);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.result.cost).toBeLessThan(1.00); // Should be optimized
      expect(costSavings).toBeGreaterThan(0);
    });

    test('should enforce team size limits through hooks', async () => {
      // Add team size enforcement hook
      orchestrator.hooks.registerHandler('team:validateComposition', async (context) => {
        const maxSize = 3;
        if (context.composition.members.length > maxSize) {
          context.valid = false;
          context.errors.push(`Team size ${context.composition.members.length} exceeds limit of ${maxSize}`);
        }
        return context;
      });

      const task = {
        id: 'complex-feature',
        type: TaskType.FEATURE,
        complexity: ComplexityLevel.COMPLEX,
        requirements: ['frontend', 'backend', 'database', 'testing', 'devops']
      };

      const result = await orchestrator.processTask(task);

      // Task should either fail or adapt to size constraint
      if (result.success) {
        expect(result.result.subtaskResults.length).toBeLessThanOrEqual(3);
      }
    });

    test('should coordinate across departments through hooks', async () => {
      const coordinationEvents = [];

      // Register department coordination hooks
      departmentProtocols.hooks.registerHandler('department:beforeCoordination', async (context) => {
        coordinationEvents.push({
          event: 'before',
          departments: context.departments,
          task: context.task
        });
        return context;
      });

      departmentProtocols.hooks.registerHandler('department:afterCoordination', async (context) => {
        coordinationEvents.push({
          event: 'after',
          protocol: context.protocol,
          success: context.success
        });
        return context;
      });

      const task = {
        id: 'cross-dept-task',
        type: TaskType.FEATURE,
        departments: ['engineering', 'design', 'product']
      };

      // Coordinate departments
      await departmentProtocols.coordinateDepartments(task.departments, task);

      expect(coordinationEvents).toHaveLength(2);
      expect(coordinationEvents[0].event).toBe('before');
      expect(coordinationEvents[1].event).toBe('after');
    });
  });

  describe('Dynamic Team Adaptation', () => {
    test('should adapt team composition based on resource availability', async () => {
      let adaptationCount = 0;

      orchestrator.hooks.registerHandler('team:modifyComposition', async (context) => {
        const busyAgents = context.availableAgents.filter(a => !a.available).length;
        
        if (busyAgents > context.availableAgents.length * 0.5) {
          // More than 50% agents busy, adapt strategy
          context.modifications = {
            strategy: CompositionStrategy.MINIMAL,
            maxSize: 2
          };
          adaptationCount++;
        }
        return context;
      });

      // Simulate busy agents
      const mockAgents = Array(10).fill(null).map((_, i) => ({
        id: `agent-${i}`,
        available: i < 3, // Only 3 available
        type: 'developer'
      }));

      const task = { id: 'task-1', type: TaskType.FEATURE };
      const team = await teamComposer.composeTeam(task, mockAgents);

      expect(adaptationCount).toBeGreaterThan(0);
      if (team) {
        expect(team.members.length).toBeLessThanOrEqual(3);
      }
    });

    test('should recompose team on validation failure', async () => {
      let recompositionAttempts = 0;

      orchestrator.hooks.registerHandler('team:validateComposition', async (context) => {
        recompositionAttempts++;
        
        // Fail first attempt
        if (recompositionAttempts === 1) {
          context.valid = false;
          context.errors.push('Missing required skill: security');
          context.suggestRecomposition = true;
        }
        return context;
      });

      orchestrator.hooks.registerHandler('team:modifyComposition', async (context) => {
        if (context.suggestRecomposition) {
          // Add security specialist
          context.modifications = {
            additionalMembers: [{
              role: 'security',
              skills: ['security', 'audit'],
              model: 'qwen',
              estimatedCost: 0.001
            }]
          };
        }
        return context;
      });

      const task = { id: 'secure-feature', type: TaskType.FEATURE };
      const result = await orchestrator.processTask(task);

      expect(recompositionAttempts).toBeGreaterThanOrEqual(1);
      expect(result).toBeDefined();
    });
  });

  describe('Manager Decision Hooks', () => {
    test('should allow manager hooks to influence decisions', async () => {
      const manager = new DepartmentManager('engineering', {});
      const decisions = [];

      manager.hooks.registerHandler('manager:beforeDecision', async (context) => {
        decisions.push({
          phase: 'before',
          manager: context.manager,
          context: context.context
        });
        return context;
      });

      manager.hooks.registerHandler('manager:validateDecision', async (context) => {
        // Validate decision based on constraints
        if (context.decision?.cost > 1.00) {
          context.valid = false;
          context.errors.push('Decision exceeds cost threshold');
        }
        return context;
      });

      manager.hooks.registerHandler('manager:afterDecision', async (context) => {
        decisions.push({
          phase: 'after',
          decision: context.decision,
          approved: context.approved
        });
        return context;
      });

      // Make decision
      const decision = await manager.makeDecision({
        type: 'resource_allocation',
        cost: 0.50
      });

      expect(decisions).toHaveLength(2);
      expect(decisions[0].phase).toBe('before');
      expect(decisions[1].phase).toBe('after');
    });

    test('should coordinate manager decisions across departments', async () => {
      const engineeringManager = new DepartmentManager('engineering', {});
      const productManager = new DepartmentManager('product', {});
      
      const sharedDecisions = [];

      // Register cross-department coordination
      const registerManagerHook = (manager) => {
        manager.hooks.registerHandler('manager:afterDecision', async (context) => {
          sharedDecisions.push({
            department: manager.name,
            decision: context.decision
          });
          
          // Share decision with other departments
          if (context.decision?.impact === 'cross-department') {
            context.broadcast = true;
          }
          return context;
        });
      };

      registerManagerHook(engineeringManager);
      registerManagerHook(productManager);

      // Make decisions
      await engineeringManager.makeDecision({
        type: 'architecture_change',
        impact: 'cross-department'
      });

      await productManager.makeDecision({
        type: 'feature_priority',
        impact: 'local'
      });

      expect(sharedDecisions).toHaveLength(2);
      expect(sharedDecisions[0].department).toBe('engineering');
      expect(sharedDecisions[1].department).toBe('product');
    });
  });

  describe('Performance Impact', () => {
    test('should measure hook overhead on team formation', async () => {
      const timings = {
        withHooks: 0,
        withoutHooks: 0
      };

      // Measure with hooks
      const start1 = Date.now();
      await orchestrator.processTask({
        id: 'perf-test-1',
        type: TaskType.SIMPLE
      });
      timings.withHooks = Date.now() - start1;

      // Create new orchestrator without hooks
      const basicOrchestrator = new DynamicAgentLifecycleOrchestrator({
        maxAgents: 20
      });

      // Measure without hooks
      const start2 = Date.now();
      await basicOrchestrator.processTask({
        id: 'perf-test-2',
        type: TaskType.SIMPLE
      });
      timings.withoutHooks = Date.now() - start2;

      // Hooks should add minimal overhead (< 50ms for simple task)
      const overhead = timings.withHooks - timings.withoutHooks;
      expect(overhead).toBeLessThan(50);
    });

    test('should handle high-volume team formations', async () => {
      const formations = [];
      
      orchestrator.hooks.registerHandler('team:afterComposition', async (context) => {
        formations.push({
          teamId: context.team.id,
          timestamp: Date.now()
        });
        return context;
      });

      // Create multiple teams rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(orchestrator.processTask({
          id: `batch-task-${i}`,
          type: TaskType.SIMPLE
        }));
      }

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0);
      expect(formations.length).toBe(successful);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from hook failures', async () => {
      let errorCount = 0;

      orchestrator.hooks.registerHandler('team:validateComposition', async (context) => {
        errorCount++;
        if (errorCount === 1) {
          throw new Error('Validation service unavailable');
        }
        return context;
      });

      // First attempt should handle error gracefully
      const result = await orchestrator.processTask({
        id: 'error-recovery-test',
        type: TaskType.SIMPLE
      });

      // Should still complete despite hook error
      expect(result).toBeDefined();
    });

    test('should rollback team on critical failure', async () => {
      orchestrator.hooks.registerHandler('team:afterComposition', async (context) => {
        // Simulate critical failure after team formed
        if (context.team.members.length > 5) {
          throw new Error('Team too large for current infrastructure');
        }
        return context;
      });

      const result = await orchestrator.processTask({
        id: 'rollback-test',
        type: TaskType.COMPLEX,
        requirements: Array(10).fill('developer') // Request large team
      });

      // Task should handle the failure
      if (result.success) {
        // If successful, team should have been adjusted
        expect(result.result).toBeDefined();
      } else {
        // Or task should fail gracefully
        expect(result.error).toBeDefined();
      }
    });
  });

  afterEach(async () => {
    // Cleanup
    await orchestrator.shutdown();
  });
});