/**
 * Comprehensive Integration Test for Intelligent Agent Management Systems
 * Tests: Intelligent Pooling, TTL Routing, Selection Matrix, Lifecycle States
 */

const path = require('path');

// Mock logger globally
global.logger = {
  info: jest.fn((...args) => console.log('[INFO]', ...args)),
  debug: jest.fn((...args) => console.log('[DEBUG]', ...args)),
  warn: jest.fn((...args) => console.log('[WARN]', ...args)),
  error: jest.fn((...args) => console.error('[ERROR]', ...args))
};

// Import all systems
const { IntelligentPoolingSystem } = require('../../src/core/pooling/intelligent-pooling-system');
const { TTLRouter } = require('../../src/core/routing/ttl-router');
const { SelectionMatrixIntegration } = require('../../src/core/selection/selection-matrix-system');
const { EnhancedLifecycleSystem } = require('../../src/core/lifecycle/lifecycle-system');

describe('Intelligent Agent Management Integration', () => {
  let poolingSystem;
  let ttlRouter;
  let selectionMatrix;
  let lifecycleSystem;
  
  beforeEach(() => {
    console.log('\n========== Setting up systems ==========\n');
    
    // Initialize all systems
    poolingSystem = new IntelligentPoolingSystem({
      minPoolSize: 5,
      maxPoolSize: 20,
      targetPoolSize: 10,
      enableLearning: true
    });
    
    ttlRouter = new TTLRouter({
      enableOptimization: true,
      enableMonitoring: true
    });
    
    selectionMatrix = new SelectionMatrixIntegration({
      matrix: { enablePersistence: false },
      scoring: { enableCache: false }
    });
    
    lifecycleSystem = new EnhancedLifecycleSystem({
      enableRecovery: true,
      enableOptimization: true,
      enableAnalytics: true
    });
  });
  
  afterEach(async () => {
    console.log('\n========== Cleaning up systems ==========\n');
    
    // Shutdown all systems
    await poolingSystem.shutdown();
    await ttlRouter.shutdown();
    await selectionMatrix.shutdown();
    await lifecycleSystem.shutdown();
  });
  
  describe('System Initialization', () => {
    test('all systems should initialize correctly', () => {
      expect(poolingSystem).toBeDefined();
      expect(poolingSystem.initialized).toBe(true);
      
      expect(ttlRouter).toBeDefined();
      expect(ttlRouter.tiers).toBeDefined();
      
      expect(selectionMatrix).toBeDefined();
      expect(selectionMatrix.initialized).toBe(true);
      
      expect(lifecycleSystem).toBeDefined();
      expect(lifecycleSystem.statistics).toBeDefined();
    });
    
    test('systems should have correct initial state', () => {
      // Pooling system
      expect(poolingSystem.pool.size).toBe(0);
      expect(poolingSystem.usageTracker.scores.size).toBe(0);
      
      // TTL Router
      expect(ttlRouter.getTierForTTL(1000)).toBe('ULTRA_FAST');
      expect(ttlRouter.getTierForTTL(10000)).toBe('FAST');
      
      // Selection Matrix
      const matrixStatus = selectionMatrix.getStatus();
      expect(matrixStatus.initialized).toBe(true);
      expect(matrixStatus.matrix).toBeDefined();
      
      // Lifecycle System
      expect(lifecycleSystem.stateMachines.size).toBe(0);
      expect(lifecycleSystem.statistics.totalMachines).toBe(0);
    });
  });
  
  describe('End-to-End Specialist Management', () => {
    test('should handle complete specialist lifecycle with intelligent pooling', async () => {
      console.log('\n--- Testing Complete Specialist Lifecycle ---\n');
      
      // 1. Create specialists with lifecycle management
      const specialists = [];
      for (let i = 0; i < 5; i++) {
        const specialist = {
          id: `backend-${i}`,
          type: 'backend',
          department: 'BACKEND',
          skills: ['nodejs', 'api'],
          performance: 0.8 + Math.random() * 0.2
        };
        specialists.push(specialist);
        
        // Create lifecycle state machine
        lifecycleSystem.createStateMachine(specialist.id);
        
        // Add to pool
        await poolingSystem.addSpecialist(specialist);
      }
      
      expect(poolingSystem.pool.size).toBe(5);
      expect(lifecycleSystem.stateMachines.size).toBe(5);
      
      // 2. Simulate usage to build patterns
      console.log('Simulating usage patterns...');
      
      for (let i = 0; i < 10; i++) {
        const specialist = specialists[i % 3]; // Use first 3 specialists more
        
        // Get specialist from pool
        const retrieved = await poolingSystem.getSpecialist(specialist.id);
        expect(retrieved).toBeDefined();
        
        // Transition through lifecycle states
        await lifecycleSystem.transitionSpecialist(
          specialist.id,
          'initializing',
          'task_assignment'
        );
        
        // Simulate task with TTL
        const ttl = (i < 5) ? 2000 : 30000; // Mix of fast and standard tasks
        const tier = ttlRouter.getTierForTTL(ttl);
        
        ttlRouter.recordTaskCompletion({
          specialist: specialist.id,
          task: `task-${i}`,
          ttl,
          tier,
          actualDuration: ttl * 0.8,
          success: true
        });
        
        // Release specialist
        await poolingSystem.releaseSpecialist(specialist.id);
      }
      
      // 3. Check intelligent pooling adapted
      const poolStatus = poolingSystem.getStatus();
      console.log('Pool status:', poolStatus);
      
      expect(poolStatus.activeCount).toBeGreaterThan(0);
      expect(poolStatus.statistics.poolHits).toBeGreaterThan(0);
      
      // Most used specialists should have higher scores
      const scores = poolingSystem.usageTracker.getScores();
      const topSpecialist = scores[0];
      expect(['backend-0', 'backend-1', 'backend-2']).toContain(topSpecialist.specialist);
      
      // 4. Check TTL routing learned patterns
      const routingStats = ttlRouter.getStatistics();
      console.log('Routing stats:', routingStats);
      
      expect(routingStats.totalTasks).toBe(10);
      expect(routingStats.tierDistribution.ULTRA_FAST).toBeGreaterThan(0);
      
      // 5. Verify lifecycle tracking
      const lifecycleAnalytics = lifecycleSystem.getAnalytics();
      expect(lifecycleAnalytics.stateTransitions.length).toBeGreaterThan(0);
      expect(lifecycleSystem.statistics.totalTransitions).toBeGreaterThan(0);
    });
    
    test('should use selection matrix for optimal specialist selection', async () => {
      console.log('\n--- Testing Selection Matrix Integration ---\n');
      
      // Create diverse specialists
      const specialists = [
        {
          id: 'backend-expert',
          type: 'backend',
          skillsMatch: 0.95,
          experience: 0.9,
          availability: 0.7,
          performance: 0.9
        },
        {
          id: 'backend-junior',
          type: 'backend', 
          skillsMatch: 0.6,
          experience: 0.3,
          availability: 0.9,
          performance: 0.7
        },
        {
          id: 'frontend-expert',
          type: 'frontend',
          skillsMatch: 0.2,
          experience: 0.9,
          availability: 0.8,
          performance: 0.85
        }
      ];
      
      // Add to pool and lifecycle
      for (const spec of specialists) {
        await poolingSystem.addSpecialist(spec);
        lifecycleSystem.createStateMachine(spec.id);
      }
      
      // Define task requirements
      const task = {
        type: 'api',
        complexity: 0.8,
        priority: 0.9,
        urgency: 0.7
      };
      
      const context = {
        urgency: 0.7,
        systemLoad: 0.5,
        projectPhase: 'development'
      };
      
      // Use selection matrix to find best specialist
      const selection = await selectionMatrix.select(task, specialists, context);
      
      console.log('Selection result:', {
        scores: selection.scores.map(s => ({
          id: s.specialist.id,
          score: s.score.toFixed(3),
          confidence: s.confidence.toFixed(3)
        })),
        decision: selection.decision
      });
      
      expect(selection).toBeDefined();
      expect(selection.scores).toHaveLength(3);
      
      // Backend expert should score highest for API task
      const topScore = selection.scores[0];
      expect(topScore.specialist.id).toBe('backend-expert');
      expect(topScore.score).toBeGreaterThan(0.5);
      
      // Decision should be made
      expect(selection.decision).toBeDefined();
      expect(selection.decision.specialist).toBe('backend-expert');
      expect(['accept', 'review']).toContain(selection.decision.action);
    });
    
    test('should handle dynamic pool resizing based on load', async () => {
      console.log('\n--- Testing Dynamic Pool Resizing ---\n');
      
      // Start with empty pool
      expect(poolingSystem.pool.size).toBe(0);
      
      // Simulate increasing load
      const specialists = [];
      for (let i = 0; i < 15; i++) {
        const specialist = {
          id: `dynamic-${i}`,
          type: i < 10 ? 'backend' : 'frontend',
          department: i < 10 ? 'BACKEND' : 'FRONTEND'
        };
        specialists.push(specialist);
        await poolingSystem.addSpecialist(specialist);
        lifecycleSystem.createStateMachine(specialist.id);
      }
      
      // Simulate high usage on first 8 specialists
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < 8; i++) {
          await poolingSystem.getSpecialist(`dynamic-${i}`);
          await poolingSystem.releaseSpecialist(`dynamic-${i}`);
        }
      }
      
      // Optimize pool
      await poolingSystem.optimizePool();
      
      const activeSpecialists = poolingSystem.getActiveSpecialists();
      console.log(`Active specialists after optimization: ${activeSpecialists.length}`);
      
      // Pool should keep frequently used specialists active
      expect(activeSpecialists.length).toBeGreaterThanOrEqual(5);
      expect(activeSpecialists.length).toBeLessThanOrEqual(10);
      
      // Check warm pool
      const warmCount = Array.from(poolingSystem.pool.values())
        .filter(s => s.state === 'warm').length;
      console.log(`Warm specialists: ${warmCount}`);
      
      expect(warmCount).toBeGreaterThan(0);
    });
    
    test('should coordinate TTL routing with lifecycle states', async () => {
      console.log('\n--- Testing TTL-Lifecycle Coordination ---\n');
      
      // Create specialists
      const fastSpecialist = {
        id: 'fast-spec',
        type: 'backend',
        optimizedFor: 'speed'
      };
      
      const thoroughSpecialist = {
        id: 'thorough-spec',
        type: 'backend',
        optimizedFor: 'quality'
      };
      
      await poolingSystem.addSpecialist(fastSpecialist);
      await poolingSystem.addSpecialist(thoroughSpecialist);
      
      lifecycleSystem.createStateMachine(fastSpecialist.id);
      lifecycleSystem.createStateMachine(thoroughSpecialist.id);
      
      // Route ultra-fast task to fast specialist
      const fastTask = {
        id: 'fast-task',
        ttl: 3000,
        specialist: fastSpecialist.id
      };
      
      const fastRoute = ttlRouter.routeTask(fastTask);
      expect(fastRoute.tier).toBe('ULTRA_FAST');
      expect(fastRoute.specialist).toBe(fastSpecialist.id);
      
      // Transition to appropriate state
      await lifecycleSystem.transitionSpecialist(
        fastSpecialist.id,
        'initializing',
        'fast_task'
      );
      
      // Route extended task to thorough specialist
      const extendedTask = {
        id: 'extended-task',
        ttl: 300000,
        specialist: thoroughSpecialist.id
      };
      
      const extendedRoute = ttlRouter.routeTask(extendedTask);
      expect(extendedRoute.tier).toBe('EXTENDED');
      
      // Record completions
      ttlRouter.recordTaskCompletion({
        ...fastRoute,
        actualDuration: 2500,
        success: true
      });
      
      ttlRouter.recordTaskCompletion({
        ...extendedRoute,
        actualDuration: 280000,
        success: true
      });
      
      // Check routing statistics
      const stats = ttlRouter.getStatistics();
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });
    
    test('should handle specialist lifecycle transitions under load', async () => {
      console.log('\n--- Testing Lifecycle Under Load ---\n');
      
      const specialists = [];
      const promises = [];
      
      // Create 10 specialists
      for (let i = 0; i < 10; i++) {
        const spec = {
          id: `load-test-${i}`,
          type: 'backend'
        };
        specialists.push(spec);
        
        await poolingSystem.addSpecialist(spec);
        const machine = lifecycleSystem.createStateMachine(spec.id);
      }
      
      // Transition all concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          lifecycleSystem.transitionSpecialist(
            `load-test-${i}`,
            'initializing',
            'concurrent_load'
          )
        );
      }
      
      await Promise.all(promises);
      
      // All should have transitioned
      const status = lifecycleSystem.getStatus();
      console.log('Lifecycle status:', status);
      
      expect(status.statistics.totalTransitions).toBe(10);
      expect(status.states.initializing).toBe(10);
      
      // No specialists should be in error state
      expect(status.states.error || 0).toBe(0);
    });
    
    test('should optimize specialist allocation using all systems', async () => {
      console.log('\n--- Testing Full System Optimization ---\n');
      
      // Create project context
      const projectContext = {
        phase: 'development',
        departments: ['BACKEND', 'FRONTEND', 'DATA'],
        expectedTasks: 50,
        averageTTL: 30000
      };
      
      // Create specialist pool
      const specialistPool = [];
      for (const dept of projectContext.departments) {
        for (let i = 0; i < 3; i++) {
          const specialist = {
            id: `${dept.toLowerCase()}-${i}`,
            type: dept.toLowerCase(),
            department: dept,
            skills: dept === 'BACKEND' ? ['api', 'database'] :
                    dept === 'FRONTEND' ? ['react', 'css'] :
                    ['python', 'ml'],
            performance: 0.7 + Math.random() * 0.3
          };
          
          specialistPool.push(specialist);
          await poolingSystem.addSpecialist(specialist);
          lifecycleSystem.createStateMachine(specialist.id);
        }
      }
      
      // Simulate task allocation
      const taskResults = [];
      
      for (let i = 0; i < 20; i++) {
        // Vary task types
        const taskType = i < 8 ? 'api' : i < 14 ? 'ui' : 'analysis';
        const requiredDept = taskType === 'api' ? 'BACKEND' :
                           taskType === 'ui' ? 'FRONTEND' : 'DATA';
        
        const task = {
          id: `task-${i}`,
          type: taskType,
          complexity: 0.5 + Math.random() * 0.5,
          priority: Math.random(),
          ttl: 10000 + Math.random() * 50000
        };
        
        // Filter specialists by department
        const eligibleSpecs = specialistPool.filter(s => s.department === requiredDept);
        
        // Use selection matrix to choose best specialist
        const selection = await selectionMatrix.select(task, eligibleSpecs, {
          projectPhase: projectContext.phase,
          systemLoad: i / 20 // Increasing load
        });
        
        if (selection && selection.decision.specialist) {
          const selectedId = selection.decision.specialist;
          
          // Get from pool
          const specialist = await poolingSystem.getSpecialist(selectedId);
          
          // Route based on TTL
          const route = ttlRouter.routeTask({
            ...task,
            specialist: selectedId
          });
          
          // Transition lifecycle state
          await lifecycleSystem.transitionSpecialist(
            selectedId,
            'initializing',
            `task_${taskType}`
          );
          
          // Simulate task execution
          const duration = task.ttl * (0.5 + Math.random() * 0.5);
          
          // Record completion
          ttlRouter.recordTaskCompletion({
            ...route,
            actualDuration: duration,
            success: Math.random() > 0.1
          });
          
          // Release specialist
          await poolingSystem.releaseSpecialist(selectedId);
          
          taskResults.push({
            task: task.id,
            specialist: selectedId,
            tier: route.tier,
            duration,
            success: true
          });
        }
      }
      
      console.log(`Completed ${taskResults.length} tasks`);
      
      // Verify optimization results
      const poolingStatus = poolingSystem.getStatus();
      const routingStats = ttlRouter.getStatistics();
      const lifecycleStatus = lifecycleSystem.getStatus();
      
      console.log('Final system state:', {
        pooling: {
          total: poolingStatus.totalCount,
          active: poolingStatus.activeCount,
          warm: poolingStatus.warmCount
        },
        routing: {
          tasks: routingStats.totalTasks,
          success: routingStats.successRate,
          tiers: routingStats.tierDistribution
        },
        lifecycle: {
          machines: lifecycleStatus.statistics.totalMachines,
          transitions: lifecycleStatus.statistics.totalTransitions,
          states: lifecycleStatus.states
        }
      });
      
      // Assertions
      expect(taskResults.length).toBeGreaterThan(15);
      expect(poolingStatus.statistics.poolHits).toBeGreaterThan(0);
      expect(routingStats.totalTasks).toBeGreaterThan(0);
      expect(lifecycleStatus.statistics.totalTransitions).toBeGreaterThan(0);
      
      // Pool should have optimized to active pattern
      const activeSpecs = poolingSystem.getActiveSpecialists();
      expect(activeSpecs.length).toBeLessThanOrEqual(poolingSystem.config.targetPoolSize);
    });
  });
  
  describe('Error Handling and Recovery', () => {
    test('should handle specialist failures gracefully', async () => {
      console.log('\n--- Testing Error Recovery ---\n');
      
      const specialist = {
        id: 'error-prone',
        type: 'backend'
      };
      
      await poolingSystem.addSpecialist(specialist);
      lifecycleSystem.createStateMachine(specialist.id);
      
      // Force error state
      await lifecycleSystem.transitionSpecialist(specialist.id, 'error', 'simulated_error');
      
      // System should attempt recovery
      const recovered = await lifecycleSystem.attemptRecovery(specialist.id, new Error('test'));
      
      expect(recovered).toBe(true);
      
      // Specialist should be usable again
      const retrieved = await poolingSystem.getSpecialist(specialist.id);
      expect(retrieved).toBeDefined();
    });
    
    test('should handle system shutdown gracefully', async () => {
      console.log('\n--- Testing Graceful Shutdown ---\n');
      
      // Add some specialists
      for (let i = 0; i < 5; i++) {
        await poolingSystem.addSpecialist({
          id: `shutdown-${i}`,
          type: 'backend'
        });
        lifecycleSystem.createStateMachine(`shutdown-${i}`);
      }
      
      // Shutdown all systems
      await poolingSystem.shutdown();
      await ttlRouter.shutdown();
      await selectionMatrix.shutdown();
      await lifecycleSystem.shutdown();
      
      // Systems should be shut down
      expect(poolingSystem.pool.size).toBe(0);
      expect(lifecycleSystem.statistics.activeMachines).toBe(0);
    });
  });
  
  describe('Performance Benchmarks', () => {
    test('should handle high throughput efficiently', async () => {
      console.log('\n--- Performance Benchmark ---\n');
      
      const startTime = Date.now();
      const operations = [];
      
      // Create 20 specialists
      for (let i = 0; i < 20; i++) {
        const spec = { id: `perf-${i}`, type: 'backend' };
        operations.push(poolingSystem.addSpecialist(spec));
        lifecycleSystem.createStateMachine(spec.id);
      }
      
      await Promise.all(operations);
      
      // Perform 100 operations
      const opPromises = [];
      for (let i = 0; i < 100; i++) {
        const specId = `perf-${i % 20}`;
        
        opPromises.push((async () => {
          const spec = await poolingSystem.getSpecialist(specId);
          
          const task = {
            id: `task-${i}`,
            ttl: 1000 + Math.random() * 10000,
            specialist: specId
          };
          
          ttlRouter.routeTask(task);
          await poolingSystem.releaseSpecialist(specId);
        })());
      }
      
      await Promise.all(opPromises);
      
      const duration = Date.now() - startTime;
      console.log(`Completed 100 operations in ${duration}ms`);
      
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      
      const stats = {
        pooling: poolingSystem.getStatus().statistics,
        routing: ttlRouter.getStatistics()
      };
      
      console.log('Performance stats:', stats);
      
      expect(stats.pooling.getRequests).toBe(100);
      expect(stats.routing.totalTasks).toBe(100);
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  const { execSync } = require('child_process');
  
  console.log('🧪 Running Intelligent Systems Integration Tests...\n');
  
  try {
    execSync('npm test tests/integration/intelligent-systems.test.js', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
  } catch (error) {
    console.error('🔴 Integration tests failed:', error.message);
    process.exit(1);
  }
}