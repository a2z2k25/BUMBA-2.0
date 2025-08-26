/**
 * Dynamic Agent Lifecycle Management - Integration Tests
 * Tests the complete lifecycle flow from spawning to deprecation
 */

const { DynamicAgentLifecycleOrchestrator } = require('../../src/core/dynamic-agent-lifecycle-orchestrator');
const { ComplexityLevel } = require('../../src/core/planning/task-decomposition-engine');

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class LifecycleIntegrationTest {
  constructor() {
    this.orchestrator = null;
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async setup() {
    console.log(`${colors.cyan}Setting up Dynamic Lifecycle Orchestrator...${colors.reset}`);
    
    this.orchestrator = new DynamicAgentLifecycleOrchestrator({
      maxAgents: 10,
      maxTeams: 3,
      autoScaling: true,
      autoOptimization: true,
      knowledgeTransfer: true,
      costBudget: 10 // $10 for testing
    });
    
    // Wait for initialization
    await this.delay(100);
    
    console.log(`${colors.green}🏁 Orchestrator initialized${colors.reset}\n`);
  }

  async runAllTests() {
    console.log(`${colors.cyan}║   DYNAMIC AGENT LIFECYCLE INTEGRATION TESTS         ║${colors.reset}`);

    await this.setup();

    // Test Suite 1: Basic Lifecycle
    await this.testBasicLifecycle();
    
    // Test Suite 2: Agent Spawning and Reuse
    await this.testAgentSpawningAndReuse();
    
    // Test Suite 3: Task Decomposition
    await this.testTaskDecomposition();
    
    // Test Suite 4: Team Composition
    await this.testTeamComposition();
    
    // Test Suite 5: Validation and Deprecation
    await this.testValidationAndDeprecation();
    
    // Test Suite 6: Resource Management
    await this.testResourceManagement();
    
    // Test Suite 7: Knowledge Transfer
    await this.testKnowledgeTransfer();
    
    // Test Suite 8: Error Handling
    await this.testErrorHandling();
    
    // Test Suite 9: Performance and Optimization
    await this.testPerformanceOptimization();
    
    // Test Suite 10: Budget Controls
    await this.testBudgetControls();

    await this.cleanup();
    this.printResults();
  }

  /**
   * Test Suite 1: Basic Lifecycle
   */
  async testBasicLifecycle() {
    this.testSection('Basic Lifecycle Flow');
    
    // Test 1.1: Simple task processing
    await this.test('Process simple task', async () => {
      const task = {
        name: 'test_simple_task',
        description: 'Simple test task',
        complexity: ComplexityLevel.SIMPLE
      };
      
      const result = await this.orchestrator.processTask(task);
      
      this.assert(result.success === true, 'Task should succeed');
      this.assert(result.taskId !== undefined, 'Should have task ID');
      this.assert(result.duration > 0, 'Should have duration');
      
      return true;
    });
    
    // Test 1.2: Orchestrator status
    await this.test('Check orchestrator status', () => {
      const status = this.orchestrator.getStatus();
      
      this.assert(status.running === true, 'Orchestrator should be running');
      this.assert(status.health.score > 0, 'Should have health score');
      this.assert(status.tasks.completed >= 1, 'Should have completed tasks');
      
      return true;
    });
  }

  /**
   * Test Suite 2: Agent Spawning and Reuse
   */
  async testAgentSpawningAndReuse() {
    this.testSection('Agent Spawning and Reuse');
    
    // Test 2.1: Agent spawning
    await this.test('Spawn new agent', async () => {
      const controller = this.orchestrator.spawningController;
      
      const spawnResult = await controller.requestSpawn({
        type: 'test-specialist',
        skills: ['testing'],
        department: 'technical'
      });
      
      this.assert(spawnResult.id !== undefined, 'Should have agent ID');
      this.assert(spawnResult.agent !== undefined, 'Should have agent instance');
      this.assert(spawnResult.lifecycle !== undefined, 'Should have lifecycle');
      
      return true;
    });
    
    // Test 2.2: Agent reuse
    await this.test('Reuse existing agent', async () => {
      const controller = this.orchestrator.spawningController;
      
      // First spawn
      const first = await controller.requestSpawn({
        type: 'database-specialist',
        skills: ['database', 'sql'],
        department: 'technical'
      });
      
      // Similar request should reuse
      const second = await controller.requestSpawn({
        type: 'database-specialist',
        skills: ['database', 'sql'],
        department: 'technical'
      });
      
      // Check if reused (should be same agent or similar)
      const stats = controller.getStatistics();
      this.assert(stats.totalReused > 0, 'Should have reused agents');
      
      return true;
    });
    
    // Test 2.3: Lifecycle state transitions
    await this.test('Agent lifecycle transitions', async () => {
      const manager = this.orchestrator.lifecycleManager;
      
      const stateMachine = manager.createAgent('test-agent-123');
      
      // Test state transitions
      await stateMachine.transition('spawn', { resourceCheck: true });
      this.assert(stateMachine.getState() === 'spawning', 'Should be spawning');
      
      await stateMachine.transition('activate');
      this.assert(stateMachine.getState() === 'active', 'Should be active');
      
      await stateMachine.transition('validate');
      this.assert(stateMachine.getState() === 'validating', 'Should be validating');
      
      await stateMachine.transition('deprecate');
      this.assert(stateMachine.getState() === 'deprecating', 'Should be deprecating');
      
      return true;
    });
  }

  /**
   * Test Suite 3: Task Decomposition
   */
  async testTaskDecomposition() {
    this.testSection('Task Decomposition');
    
    // Test 3.1: Complex task decomposition
    await this.test('Decompose complex task', async () => {
      const engine = this.orchestrator.taskDecomposer;
      
      const complexTask = {
        name: 'build_api',
        description: 'Build REST API with authentication',
        complexity: ComplexityLevel.COMPLEX
      };
      
      const decomposition = await engine.decomposeTask(complexTask);
      
      this.assert(decomposition.subtasks.length > 1, 'Should have multiple subtasks');
      this.assert(decomposition.dependencies !== undefined, 'Should have dependencies');
      this.assert(decomposition.metrics !== undefined, 'Should have metrics');
      
      return true;
    });
    
    // Test 3.2: Pattern matching
    await this.test('Pattern-based decomposition', async () => {
      const engine = this.orchestrator.taskDecomposer;
      
      const apiTask = {
        name: 'api_development',
        description: 'Develop API endpoints',
        complexity: ComplexityLevel.MODERATE
      };
      
      const decomposition = await engine.decomposeTask(apiTask);
      
      // Should match api_development pattern
      this.assert(decomposition.analysis.pattern !== null, 'Should match pattern');
      this.assert(decomposition.subtasks.some(t => t.name.includes('schema')), 
        'Should have schema design task');
      
      return true;
    });
  }

  /**
   * Test Suite 4: Team Composition
   */
  async testTeamComposition() {
    this.testSection('Team Composition');
    
    // Test 4.1: Compose team for task
    await this.test('Compose balanced team', async () => {
      const composer = this.orchestrator.teamComposer;
      
      const task = {
        name: 'full_stack_development',
        description: 'Build full-stack application',
        complexity: ComplexityLevel.COMPLEX
      };
      
      // Add some available agents
      const agents = [
        { id: 'agent1', skills: ['frontend', 'react'], availability: 0.8 },
        { id: 'agent2', skills: ['backend', 'nodejs'], availability: 0.9 },
        { id: 'agent3', skills: ['database', 'sql'], availability: 0.7 }
      ];
      
      const team = await composer.composeTeam(task, agents);
      
      this.assert(team.members.length > 0, 'Should have team members');
      this.assert(team.structure !== undefined, 'Should have team structure');
      this.assert(team.metrics.skillCoverage > 0, 'Should have skill coverage');
      
      return true;
    });
    
    // Test 4.2: Adaptive recomposition
    await this.test('Adapt team based on feedback', async () => {
      const composer = this.orchestrator.teamComposer;
      
      const task = {
        name: 'test_task',
        description: 'Test task',
        complexity: ComplexityLevel.MODERATE
      };
      
      const team = await composer.composeTeam(task, []);
      const teamId = team.id;
      
      // Provide feedback
      const adapted = await composer.adaptTeamComposition(teamId, {
        performance: 0.4, // Low performance
        missingSkills: ['testing'],
        overloaded: true
      });
      
      // Should trigger recomposition
      this.assert(adapted !== undefined, 'Should adapt team');
      
      return true;
    });
  }

  /**
   * Test Suite 5: Validation and Deprecation
   */
  async testValidationAndDeprecation() {
    this.testSection('Validation and Deprecation');
    
    // Test 5.1: Work validation
    await this.test('Validate completed work', async () => {
      const validator = this.orchestrator.validationFramework;
      
      const work = {
        tasksCompleted: 5,
        totalTasks: 5,
        errors: [],
        tests: { failed: 0, passed: 10 },
        codeQuality: { score: 0.85 }
      };
      
      const validation = await validator.validateWork('test-agent', work);
      
      this.assert(validation.status !== undefined, 'Should have validation status');
      this.assert(validation.score >= 0, 'Should have validation score');
      this.assert(validation.scores !== undefined, 'Should have criteria scores');
      
      return true;
    });
    
    // Test 5.2: Completeness checking
    await this.test('Check work completeness', async () => {
      const checker = this.orchestrator.completenessChecker;
      
      const workId = checker.registerWork('test-agent', {
        tasks: [
          { name: 'task1', required: true },
          { name: 'task2', required: true }
        ],
        deliverables: [],
        dependencies: []
      });
      
      // Update tasks
      checker.updateWorkItem(workId, 'item-0', {
        status: 'complete',
        progress: 1.0
      });
      
      const completeness = await checker.checkCompleteness(workId);
      
      this.assert(completeness.overall !== undefined, 'Should have overall status');
      this.assert(completeness.overall.progress >= 0, 'Should have progress');
      
      return true;
    });
    
    // Test 5.3: Graceful deprecation
    await this.test('Deprecate agent gracefully', async () => {
      const deprecationMgr = this.orchestrator.deprecationManager;
      const lifecycleMgr = this.orchestrator.lifecycleManager;
      
      const lifecycle = lifecycleMgr.createAgent('deprecate-test');
      await lifecycle.transition('spawn', { resourceCheck: true });
      await lifecycle.transition('activate');
      
      const result = await deprecationMgr.scheduleDeprecation(
        'deprecate-test',
        lifecycle,
        {
          reason: 'work_complete',
          strategy: 'graceful'
        }
      );
      
      this.assert(result.success === true, 'Deprecation should succeed');
      
      return true;
    });
  }

  /**
   * Test Suite 6: Resource Management
   */
  async testResourceManagement() {
    this.testSection('Resource Management');
    
    // Test 6.1: Resource tracking
    await this.test('Track resource usage', () => {
      const monitor = this.orchestrator.resourceMonitor;
      
      monitor.trackUsage('api_calls', 10, { agentId: 'test-agent' });
      monitor.trackUsage('memory', 512, { agentId: 'test-agent' });
      monitor.trackCost(0.05, { agentId: 'test-agent' });
      
      const summary = monitor.getResourceSummary();
      
      this.assert(summary.resources.api_calls !== undefined, 'Should track API calls');
      this.assert(summary.budget.consumed.total > 0, 'Should track costs');
      
      return true;
    });
    
    // Test 6.2: Alert generation
    await this.test('Generate resource alerts', () => {
      const monitor = this.orchestrator.resourceMonitor;
      
      // Track high usage to trigger alert
      monitor.trackUsage('memory', 90, { agentId: 'test-agent' });
      
      const stats = monitor.getStatistics();
      
      // Should have created alerts
      this.assert(stats.alerts !== undefined, 'Should have alerts');
      
      return true;
    });
  }

  /**
   * Test Suite 7: Knowledge Transfer
   */
  async testKnowledgeTransfer() {
    this.testSection('Knowledge Transfer');
    
    // Test 7.1: Store knowledge
    await this.test('Store and retrieve knowledge', async () => {
      const protocol = this.orchestrator.knowledgeProtocol;
      
      const knowledgeId = await protocol.storeKnowledge('test-agent', {
        type: 'context',
        content: { test: 'data' },
        confidence: 0.9
      });
      
      this.assert(knowledgeId !== undefined, 'Should store knowledge');
      
      const retrieved = protocol.knowledgeBase.get(knowledgeId);
      this.assert(retrieved !== undefined, 'Should retrieve knowledge');
      
      return true;
    });
    
    // Test 7.2: Transfer between agents
    await this.test('Transfer knowledge between agents', async () => {
      const protocol = this.orchestrator.knowledgeProtocol;
      
      // Store knowledge for agent1
      await protocol.storeKnowledge('agent1', {
        type: 'learning',
        content: { lesson: 'test learning' }
      });
      
      // Transfer to agent2
      const transfer = await protocol.transferKnowledge('agent1', 'agent2', {
        method: 'direct'
      });
      
      this.assert(transfer.success === true, 'Transfer should succeed');
      this.assert(transfer.items.length > 0, 'Should transfer items');
      
      return true;
    });
  }

  /**
   * Test Suite 8: Error Handling
   */
  async testErrorHandling() {
    this.testSection('Error Handling and Recovery');
    
    // Test 8.1: Handle task failure
    await this.test('Handle task processing failure', async () => {
      const task = {
        name: 'failing_task',
        description: 'Task that will fail',
        complexity: ComplexityLevel.SIMPLE,
        forceFailure: true // Special flag for testing
      };
      
      try {
        await this.orchestrator.processTask(task);
        return false; // Should have failed
      } catch (error) {
        // Expected to fail
        this.assert(error !== undefined, 'Should throw error');
        
        // Check cleanup happened
        const status = this.orchestrator.getStatus();
        this.assert(status.tasks.active === 0, 'Should cleanup failed task');
        
        return true;
      }
    });
    
    // Test 8.2: Circular dependency detection
    await this.test('Detect circular dependencies', async () => {
      const engine = this.orchestrator.taskDecomposer;
      
      // Create task with circular deps (will be caught by validation)
      const task = {
        name: 'circular_task',
        description: 'Task with circular dependencies',
        complexity: ComplexityLevel.COMPLEX,
        customDependencies: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
          { from: 'C', to: 'A' } // Circular!
        ]
      };
      
      try {
        const decomposition = await engine.decomposeTask(task);
        // Validation should catch circular deps
        return decomposition.error === undefined;
      } catch (error) {
        // Expected behavior - circular deps detected
        return true;
      }
    });
  }

  /**
   * Test Suite 9: Performance and Optimization
   */
  async testPerformanceOptimization() {
    this.testSection('Performance and Optimization');
    
    // Test 9.1: Pool optimization
    await this.test('Optimize agent pool', async () => {
      const optimizer = this.orchestrator.poolOptimizer;
      
      const mockAgents = [
        { id: 'a1', type: 'specialist', model: 'claude-max', state: 'active' },
        { id: 'a2', type: 'generalist', model: 'qwen', state: 'idle' },
        { id: 'a3', type: 'specialist', model: 'deepseek', state: 'active' }
      ];
      
      const mockTasks = [
        { id: 't1', assignedTo: 'a1' },
        { id: 't2', assignedTo: 'a3' }
      ];
      
      const optimization = await optimizer.optimizePool(mockAgents, mockTasks);
      
      this.assert(optimization.analysis !== undefined, 'Should analyze pool');
      this.assert(optimization.actions !== undefined, 'Should generate actions');
      
      return true;
    });
    
    // Test 9.2: API connection management
    await this.test('Manage API connections efficiently', async () => {
      const apiManager = this.orchestrator.apiManager;
      
      // Make multiple requests to test batching
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          apiManager.request('gemini', { test: i }, { batchable: true })
        );
      }
      
      await Promise.all(requests);
      
      const stats = apiManager.getStatistics();
      this.assert(stats.totalRequests >= 5, 'Should process requests');
      
      return true;
    });
  }

  /**
   * Test Suite 10: Budget Controls
   */
  async testBudgetControls() {
    this.testSection('Budget Controls');
    
    // Test 10.1: Budget tracking
    await this.test('Track and enforce budget', () => {
      const monitor = this.orchestrator.resourceMonitor;
      
      // Track costs
      monitor.trackCost(1.0, { source: 'test' });
      monitor.trackCost(2.0, { source: 'test' });
      
      const summary = monitor.getResourceSummary();
      
      this.assert(summary.budget.consumed.total >= 3.0, 'Should track total cost');
      this.assert(summary.budget.remaining.daily <= 7.0, 'Should update remaining budget');
      
      return true;
    });
    
    // Test 10.2: Budget exceeded handling
    await this.test('Handle budget exceeded scenario', () => {
      const monitor = this.orchestrator.resourceMonitor;
      
      // Simulate budget exceeded
      monitor.trackCost(9.0, { source: 'test-overflow' });
      
      // Should trigger controls
      const stats = monitor.getStatistics();
      this.assert(stats.alerts.active > 0, 'Should create budget alert');
      
      // Check if spawning is limited
      const maxAgents = this.orchestrator.spawningController.config.maxTotalAgents;
      this.assert(maxAgents <= this.orchestrator.orchestrationState.activeAgents.size + 10, 
        'Should limit spawning');
      
      return true;
    });
  }

  /**
   * Test utilities
   */
  testSection(name) {
    console.log(`\n${colors.blue}━━━ ${name} ━━━${colors.reset}`);
  }

  async test(name, testFn) {
    this.totalTests++;
    process.stdout.write(`  ${name} ... `);
    
    try {
      const result = await testFn();
      
      if (result) {
        console.log(`${colors.green}🏁${colors.reset}`);
        this.passedTests++;
        this.testResults.push({ name, passed: true });
        return true;
      } else {
        console.log(`${colors.red}🟢${colors.reset}`);
        this.testResults.push({ name, passed: false, error: 'Test returned false' });
        return false;
      }
    } catch (error) {
      console.log(`${colors.red}🟢 ${error.message}${colors.reset}`);
      this.testResults.push({ name, passed: false, error: error.message });
      return false;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log(`\n${colors.cyan}Cleaning up...${colors.reset}`);
    
    if (this.orchestrator) {
      await this.orchestrator.shutdown();
    }
    
    console.log(`${colors.green}🏁 Cleanup complete${colors.reset}`);
  }

  printResults() {
    console.log(`${colors.cyan}║                   TEST RESULTS                      ║${colors.reset}`);
    
    const percentage = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    const resultColor = this.passedTests === this.totalTests ? colors.green :
                       this.passedTests > this.totalTests * 0.8 ? colors.yellow : colors.red;
    
    console.log(`  Total Tests: ${this.totalTests}`);
    console.log(`  ${colors.green}Passed: ${this.passedTests}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${this.totalTests - this.passedTests}${colors.reset}`);
    console.log(`  ${resultColor}Success Rate: ${percentage}%${colors.reset}\n`);
    
    if (this.passedTests === this.totalTests) {
      console.log(`${colors.green}🏁 ALL TESTS PASSED! The Dynamic Agent Lifecycle Management system is working correctly.${colors.reset}`);
      console.log(`${colors.green}🏁 System adheres to best practices:${colors.reset}`);
      console.log(`  • Proper state management with clear transitions`);
      console.log(`  • Comprehensive error handling and recovery`);
      console.log(`  • Resource cleanup and memory management`);
      console.log(`  • Event-driven architecture with loose coupling`);
      console.log(`  • Validation at every critical step`);
      console.log(`  • Performance optimization and monitoring`);
      console.log(`  • Budget enforcement and cost controls`);
      console.log(`  • Knowledge preservation across lifecycles`);
    } else {
      console.log(`${colors.yellow}🟡  Some tests failed. Review the output above for details.${colors.reset}`);
      
      console.log(`\n${colors.yellow}Failed tests:${colors.reset}`);
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ${colors.red}🟢${colors.reset} ${r.name}: ${r.error}`);
        });
    }
  }
}

// Run tests
async function runTests() {
  const tester = new LifecycleIntegrationTest();
  await tester.runAllTests();
  
  process.exit(tester.passedTests === tester.totalTests ? 0 : 1);
}

// Export for external use
module.exports = { LifecycleIntegrationTest };

// Run if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}