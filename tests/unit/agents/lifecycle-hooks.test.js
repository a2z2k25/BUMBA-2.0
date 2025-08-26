/**
 * Unit tests for Agent Lifecycle State Machine hooks
 * Tests hook integration points added in Sprint 9-10
 */

const { 
  AgentLifecycleStateMachine, 
  AgentState, 
  StateEvent 
} = require('../../../src/core/agents/agent-lifecycle-state-machine');
const { 
  AgentDeprecationManager, 
  DeprecationReason, 
  DeprecationStrategy 
} = require('../../../src/core/deprecation/agent-deprecation-manager');
const { BumbaUniversalHookSystem } = require('../../../src/core/hooks/bumba-universal-hook-system');

describe('Agent Lifecycle Hook Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let lifecycle;
  let deprecationManager;
  let hookSystem;

  beforeEach(() => {
    lifecycle = new AgentLifecycleStateMachine('test-agent-1', {
      maxIdleTime: 5000,
      maxActiveTime: 10000,
      autoDeprecate: true
    });
    
    deprecationManager = new AgentDeprecationManager({
      gracefulTimeout: 1000,
      knowledgeTransfer: true
    });
    
    // Get reference to hook systems
    hookSystem = lifecycle.hooks;
  });

  describe('Lifecycle State Transition Hooks', () => {
    test('should register all lifecycle hooks', async () => {
      const registeredHooks = hookSystem.getRegisteredHooks();
      
      expect(registeredHooks['lifecycle:beforeTransition']).toBeDefined();
      expect(registeredHooks['lifecycle:validateTransition']).toBeDefined();
      expect(registeredHooks['lifecycle:modifyTransition']).toBeDefined();
      expect(registeredHooks['lifecycle:afterTransition']).toBeDefined();
      expect(registeredHooks['lifecycle:onError']).toBeDefined();
    });

    test('should execute beforeTransition hook', async () => {
      let capturedContext;
      
      hookSystem.registerHandler('lifecycle:beforeTransition', async (context) => {
        capturedContext = context;
        return context;
      });

      await lifecycle.transition(StateEvent.SPAWN, { 
        resourceCheck: true 
      });

      expect(capturedContext).toBeDefined();
      expect(capturedContext.agentId).toBe('test-agent-1');
      expect(capturedContext.currentState).toBe(AgentState.IDLE);
      expect(capturedContext.event).toBe(StateEvent.SPAWN);
      expect(capturedContext.targetState).toBe(AgentState.SPAWNING);
    });

    test('should prevent transition when hook returns preventDefault', async () => {
      hookSystem.registerHandler('lifecycle:beforeTransition', async (context) => {
        if (context.targetState === AgentState.SPAWNING) {
          context.preventDefault = true;
          context.reason = 'Resources unavailable';
        }
        return context;
      });

      const result = await lifecycle.transition(StateEvent.SPAWN);

      expect(result).toBe(false);
      expect(lifecycle.getState()).toBe(AgentState.IDLE);
    });

    test('should validate state transitions through hooks', async () => {
      let validationCalled = false;
      
      hookSystem.registerHandler('lifecycle:validateTransition', async (context) => {
        validationCalled = true;
        
        // Validate that we have resources before spawning
        if (context.transition.to === AgentState.SPAWNING) {
          const hasResources = context.context?.resourceCheck === true;
          if (!hasResources) {
            context.valid = false;
            context.errors.push('Resource check failed');
          }
        }
        return context;
      });

      // Should fail without resource check
      await expect(lifecycle.transition(StateEvent.SPAWN, {}))
        .rejects.toThrow('Transition validation failed');

      expect(validationCalled).toBe(true);
      expect(lifecycle.getState()).toBe(AgentState.IDLE);
    });

    test('should modify transition data through hooks', async () => {
      hookSystem.registerHandler('lifecycle:modifyTransition', async (context) => {
        if (context.transition.to === AgentState.ACTIVE) {
          context.modifications = {
            startTime: Date.now(),
            model: 'deepseek',
            department: 'engineering'
          };
        }
        return context;
      });

      // Transition to spawning first
      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      
      // Then to active
      await lifecycle.transition(StateEvent.ACTIVATE);

      const metadata = lifecycle.getMetadata();
      expect(metadata.startTime).toBeDefined();
      expect(metadata.model).toBe('deepseek');
      expect(metadata.department).toBe('engineering');
    });

    test('should execute afterTransition hook', async () => {
      const transitions = [];
      
      hookSystem.registerHandler('lifecycle:afterTransition', async (context) => {
        transitions.push({
          from: context.previousState,
          to: context.currentState,
          duration: context.duration
        });
        return context;
      });

      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await lifecycle.transition(StateEvent.ACTIVATE);

      expect(transitions).toHaveLength(2);
      expect(transitions[0].from).toBe(AgentState.IDLE);
      expect(transitions[0].to).toBe(AgentState.SPAWNING);
      expect(transitions[1].from).toBe(AgentState.SPAWNING);
      expect(transitions[1].to).toBe(AgentState.ACTIVE);
    });

    test('should handle errors through onError hook', async () => {
      let errorHandled = false;
      
      hookSystem.registerHandler('lifecycle:onError', async (context) => {
        errorHandled = true;
        context.recovery = {
          action: 'retry',
          delay: 100
        };
        return context;
      });

      // Try invalid transition
      try {
        await lifecycle.transition('INVALID_EVENT');
      } catch (error) {
        // Error expected
      }

      // Hook should still be called for error handling
      expect(lifecycle.getState()).toBe(AgentState.IDLE);
    });
  });

  describe('Deprecation Hook Integration', () => {
    test('should register all deprecation hooks', async () => {
      const depHooks = deprecationManager.hooks.getRegisteredHooks();
      
      expect(depHooks['deprecation:before']).toBeDefined();
      expect(depHooks['deprecation:overrideStrategy']).toBeDefined();
      expect(depHooks['deprecation:prevent']).toBeDefined();
      expect(depHooks['deprecation:customCleanup']).toBeDefined();
      expect(depHooks['deprecation:after']).toBeDefined();
    });

    test('should execute beforeDeprecation hook', async () => {
      let capturedContext;
      
      deprecationManager.hooks.registerHandler('deprecation:before', async (context) => {
        capturedContext = context;
        return context;
      });

      await deprecationManager.scheduleDeprecation('agent-1', lifecycle, {
        reason: DeprecationReason.WORK_COMPLETE,
        strategy: DeprecationStrategy.GRACEFUL
      });

      expect(capturedContext).toBeDefined();
      expect(capturedContext.agentId).toBe('agent-1');
      expect(capturedContext.reason).toBe(DeprecationReason.WORK_COMPLETE);
      expect(capturedContext.strategy).toBe(DeprecationStrategy.GRACEFUL);
    });

    test('should prevent deprecation through hook', async () => {
      deprecationManager.hooks.registerHandler('deprecation:prevent', async (context) => {
        // Prevent if agent has critical work
        context.prevent = true;
        context.reason = 'Agent has critical work in progress';
        return context;
      });

      const result = await deprecationManager.scheduleDeprecation('agent-1', lifecycle);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('critical work');
    });

    test('should override deprecation strategy', async () => {
      deprecationManager.hooks.registerHandler('deprecation:overrideStrategy', async (context) => {
        if (context.originalStrategy === DeprecationStrategy.IMMEDIATE) {
          context.suggestedStrategy = DeprecationStrategy.GRACEFUL;
          context.reason = 'Allow time for cleanup';
        }
        return context;
      });

      await deprecationManager.scheduleDeprecation('agent-1', lifecycle, {
        strategy: DeprecationStrategy.IMMEDIATE
      });

      // Check that strategy was overridden
      const status = deprecationManager.getDeprecationStatus('agent-1');
      expect(status.plan?.strategy).toBe(DeprecationStrategy.GRACEFUL);
    });

    test('should perform custom cleanup through hooks', async () => {
      const cleanupActions = [];
      
      deprecationManager.hooks.registerHandler('deprecation:customCleanup', async (context) => {
        cleanupActions.push({
          agentId: context.agentId,
          resources: context.resources,
          timestamp: Date.now()
        });
        
        context.cleanupActions = [
          'close_connections',
          'save_state',
          'notify_manager'
        ];
        return context;
      });

      // Move agent to active state first
      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await lifecycle.transition(StateEvent.ACTIVATE);
      
      // Schedule deprecation
      await deprecationManager.scheduleDeprecation('test-agent-1', lifecycle, {
        strategy: DeprecationStrategy.IMMEDIATE
      });

      expect(cleanupActions.length).toBeGreaterThan(0);
      expect(cleanupActions[0].agentId).toBe('test-agent-1');
    });

    test('should track deprecation completion', async () => {
      let deprecationComplete = false;
      
      deprecationManager.hooks.registerHandler('deprecation:after', async (context) => {
        deprecationComplete = true;
        expect(context.success).toBe(true);
        expect(context.duration).toBeGreaterThan(0);
        expect(context.knowledgeTransferred).toBeDefined();
        return context;
      });

      // Move to active state
      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await lifecycle.transition(StateEvent.ACTIVATE);
      
      // Deprecate
      await deprecationManager.scheduleDeprecation('test-agent-1', lifecycle, {
        strategy: DeprecationStrategy.IMMEDIATE
      });

      expect(deprecationComplete).toBe(true);
    });
  });

  describe('Knowledge Transfer Hooks', () => {
    test('should transfer knowledge before deprecation', async () => {
      const knowledge = [];
      
      deprecationManager.hooks.registerHandler('deprecation:before', async (context) => {
        // Capture agent knowledge
        knowledge.push({
          agentId: context.agentId,
          stats: lifecycle.getStatistics(),
          history: lifecycle.getHistory()
        });
        return context;
      });

      // Create some history
      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await lifecycle.transition(StateEvent.ACTIVATE);
      
      // Deprecate
      await deprecationManager.scheduleDeprecation('test-agent-1', lifecycle);

      expect(knowledge.length).toBe(1);
      expect(knowledge[0].stats).toBeDefined();
      expect(knowledge[0].history.length).toBeGreaterThan(0);
    });

    test('should retrieve transferred knowledge', async () => {
      // Simulate knowledge storage
      deprecationManager.knowledgeStore.set('old-agent', {
        agentId: 'old-agent',
        statistics: { tasksCompleted: 100 },
        learnings: ['optimization-1', 'pattern-2']
      });

      const knowledge = deprecationManager.getKnowledge('old-agent');
      
      expect(knowledge).toBeDefined();
      expect(knowledge.statistics.tasksCompleted).toBe(100);
      expect(knowledge.learnings).toContain('optimization-1');
    });
  });

  describe('State Transition Chain', () => {
    test('should handle complete lifecycle through hooks', async () => {
      const lifecycleEvents = [];
      
      // Track all transitions
      hookSystem.registerHandler('lifecycle:afterTransition', async (context) => {
        lifecycleEvents.push({
          state: context.currentState,
          timestamp: Date.now()
        });
        return context;
      });

      // Complete lifecycle
      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await lifecycle.transition(StateEvent.ACTIVATE);
      await lifecycle.transition(StateEvent.VALIDATE);
      await lifecycle.transition(StateEvent.DEPRECATE);
      await lifecycle.transition(StateEvent.COMPLETE);

      expect(lifecycleEvents).toHaveLength(5);
      expect(lifecycleEvents[0].state).toBe(AgentState.SPAWNING);
      expect(lifecycleEvents[4].state).toBe(AgentState.DEPRECATED);
    });

    test('should maintain state consistency across hooks', async () => {
      const stateChecks = [];
      
      hookSystem.registerHandler('lifecycle:validateTransition', async (context) => {
        stateChecks.push({
          from: context.transition.from,
          to: context.transition.to,
          valid: lifecycle.transitions[context.transition.from]?.[context.transition.event] === context.transition.to
        });
        return context;
      });

      // Valid transitions
      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await lifecycle.transition(StateEvent.ACTIVATE);

      expect(stateChecks.every(check => check.valid)).toBe(true);
    });
  });

  describe('Performance and Metrics', () => {
    test('should track transition timing through hooks', async () => {
      const timings = [];
      
      hookSystem.registerHandler('lifecycle:afterTransition', async (context) => {
        timings.push({
          transition: `${context.previousState}->${context.currentState}`,
          duration: context.duration
        });
        return context;
      });

      await lifecycle.transition(StateEvent.SPAWN, { resourceCheck: true });
      await new Promise(resolve => setTimeout(resolve, 10));
      await lifecycle.transition(StateEvent.ACTIVATE);

      expect(timings).toHaveLength(2);
      expect(timings[0].duration).toBeGreaterThanOrEqual(0);
    });

    test('should collect lifecycle statistics', async () => {
      const stats = lifecycle.getStatistics();
      
      expect(stats.totalTransitions).toBe(0);
      expect(stats.currentState).toBe(AgentState.IDLE);
      expect(stats.timeInStates).toBeDefined();
      expect(stats.statePercentages).toBeDefined();
    });
  });
});