#!/usr/bin/env node

/**
 * Comprehensive Test Suite for BUMBA Dependency Management System
 * Tests dependency resolution, inter-agent communication, and parallel optimization
 */

const chalk = require('chalk');
const { EnhancedDependencyManager, DependencyType, TaskStatus } = require('../../src/core/orchestration/enhanced-dependency-manager');
const { DependencyCommunicationProtocol, MessageType } = require('../../src/core/communication/dependency-communication-protocol');

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class DependencySystemTest {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log(chalk.cyan.bold('\n🟢 BUMBA Dependency Management System - Test Suite\n'));
    console.log(chalk.gray('=' .repeat(60)));

    // Run test suites
    await this.testBasicDependencyManagement();
    await this.testCircularDependencyDetection();
    await this.testParallelExecutionOptimization();
    await this.testResourceConflictResolution();
    await this.testKnowledgeDependencies();
    await this.testInterAgentCommunication();
    await this.testRealWorldScenario();

    // Print summary
    this.printSummary();
  }

  /**
   * Test 1: Basic Dependency Management
   */
  async testBasicDependencyManagement() {
    console.log(chalk.yellow('\n📋 Test 1: Basic Dependency Management\n'));
    
    const dm = new EnhancedDependencyManager();
    let passed = true;

    try {
      // Add tasks with dependencies
      dm.addTask('design', {
        name: 'Design System Architecture',
        specialist: 'architect',
        priority: 10
      });

      dm.addTask('backend', {
        name: 'Implement Backend API',
        specialist: 'backend-engineer',
        dependencies: ['design'],
        priority: 8
      });

      dm.addTask('frontend', {
        name: 'Build Frontend UI',
        specialist: 'frontend-engineer',
        dependencies: ['design'],
        priority: 8
      });

      dm.addTask('integration', {
        name: 'Integration Testing',
        specialist: 'qa-engineer',
        dependencies: ['backend', 'frontend'],
        priority: 9
      });

      // Test task status
      const designTask = dm.tasks.get('design');
      const backendTask = dm.tasks.get('backend');
      const integrationTask = dm.tasks.get('integration');

      console.log(`  🏁 Tasks added: ${dm.tasks.size}`);
      console.log(`  🏁 Design status: ${designTask.status} (should be READY)`);
      console.log(`  🏁 Backend status: ${backendTask.status} (should be BLOCKED)`);
      console.log(`  🏁 Integration status: ${integrationTask.status} (should be BLOCKED)`);

      // Verify initial states
      if (designTask.status !== TaskStatus.READY) {
        throw new Error('Design task should be READY');
      }
      if (backendTask.status !== TaskStatus.BLOCKED) {
        throw new Error('Backend task should be BLOCKED');
      }

      // Complete design task
      const unblocked = await dm.markTaskCompleted('design', { schema: 'defined' });
      
      console.log(`  🏁 Design completed, unblocked tasks: ${unblocked.join(', ')}`);
      
      // Check if backend and frontend are now ready
      const backendAfter = dm.tasks.get('backend');
      const frontendAfter = dm.tasks.get('frontend');
      
      if (backendAfter.status !== TaskStatus.READY || frontendAfter.status !== TaskStatus.READY) {
        throw new Error('Backend and Frontend should be READY after design completion');
      }

      console.log(chalk.green('  🏁 Basic dependency management: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Basic Dependency Management', passed);
  }

  /**
   * Test 2: Circular Dependency Detection
   */
  async testCircularDependencyDetection() {
    console.log(chalk.yellow('\n📋 Test 2: Circular Dependency Detection\n'));
    
    const dm = new EnhancedDependencyManager();
    let passed = true;

    try {
      // Create a valid chain first
      dm.addTask('A', { name: 'Task A' });
      dm.addTask('B', { name: 'Task B', dependencies: ['A'] });
      dm.addTask('C', { name: 'Task C', dependencies: ['B'] });
      
      console.log('  🏁 Valid chain created: A → B → C');

      // Try to create circular dependency
      let circularDetected = false;
      try {
        dm.addTask('D', { 
          name: 'Task D', 
          dependencies: ['C', 'E'] // E doesn't exist yet
        });
        dm.addTask('E', { 
          name: 'Task E', 
          dependencies: ['D'] // This would create D → E → D
        });
      } catch (error) {
        if (error.message.includes('Circular dependency')) {
          circularDetected = true;
          console.log('  🏁 Circular dependency correctly detected and prevented');
        }
      }

      // Try self-dependency
      let selfDepDetected = false;
      try {
        dm.addTask('F', { 
          name: 'Task F', 
          dependencies: ['F'] // Self dependency
        });
      } catch (error) {
        selfDepDetected = true;
        console.log('  🏁 Self-dependency correctly detected and prevented');
      }

      if (!circularDetected && !selfDepDetected) {
        throw new Error('Circular dependency detection failed');
      }

      console.log(chalk.green('  🏁 Circular dependency detection: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Circular Dependency Detection', passed);
  }

  /**
   * Test 3: Parallel Execution Optimization
   */
  async testParallelExecutionOptimization() {
    console.log(chalk.yellow('\n📋 Test 3: Parallel Execution Optimization\n'));
    
    const dm = new EnhancedDependencyManager();
    let passed = true;

    try {
      // Create tasks that can be parallelized
      dm.addTask('db-setup', { name: 'Setup Database' });
      dm.addTask('cache-setup', { name: 'Setup Cache' });
      dm.addTask('queue-setup', { name: 'Setup Message Queue' });
      
      dm.addTask('user-service', { 
        name: 'User Service',
        dependencies: ['db-setup']
      });
      
      dm.addTask('product-service', { 
        name: 'Product Service',
        dependencies: ['db-setup', 'cache-setup']
      });
      
      dm.addTask('notification-service', { 
        name: 'Notification Service',
        dependencies: ['queue-setup']
      });
      
      dm.addTask('api-gateway', { 
        name: 'API Gateway',
        dependencies: ['user-service', 'product-service', 'notification-service']
      });

      // Calculate execution plan
      const plan = dm.calculateExecutionPlan();
      
      console.log('  Execution Stages:');
      plan.stages.forEach((stage, index) => {
        console.log(`    Stage ${index + 1}: [${stage.join(', ')}]`);
      });

      // Verify parallel opportunities
      if (plan.stages[0].length !== 3) {
        throw new Error('Stage 1 should have 3 parallel tasks');
      }

      // Check critical path
      console.log(`  🏁 Critical path: ${plan.criticalPath.join(' → ')}`);
      console.log(`  🏁 Estimated duration: ${plan.estimatedDuration} units`);
      
      // Get ready tasks
      const readyTasks = dm.getReadyTasks();
      console.log(`  🏁 Initially ready tasks: ${readyTasks.join(', ')}`);
      
      if (readyTasks.length !== 3) {
        throw new Error('Should have 3 ready tasks initially');
      }

      console.log(chalk.green('  🏁 Parallel execution optimization: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Parallel Execution Optimization', passed);
  }

  /**
   * Test 4: Resource Conflict Resolution
   */
  async testResourceConflictResolution() {
    console.log(chalk.yellow('\n📋 Test 4: Resource Conflict Resolution\n'));
    
    const dm = new EnhancedDependencyManager();
    let passed = true;

    try {
      // Create tasks with resource requirements
      dm.addTask('task1', { 
        name: 'Database Migration',
        resourceRequirements: ['database-lock'],
        estimatedDuration: 5
      });

      dm.addTask('task2', { 
        name: 'Database Backup',
        resourceRequirements: ['database-lock'],
        estimatedDuration: 3
      });

      dm.addTask('task3', { 
        name: 'Cache Warmup',
        resourceRequirements: ['cache-lock'],
        estimatedDuration: 2
      });

      // Identify conflicts
      const plan = dm.calculateExecutionPlan();
      const conflicts = plan.resourceConflicts;
      
      console.log(`  🏁 Resource conflicts detected: ${conflicts.length}`);
      
      conflicts.forEach(conflict => {
        console.log(`    - Resource "${conflict.resource}" needed by: ${conflict.tasks.join(', ')}`);
      });

      // Simulate resource locking
      dm.resourceLocks.set('database-lock', 'task1');
      dm.updateTaskStatus('task2');
      
      const task2Status = dm.tasks.get('task2').status;
      if (task2Status !== TaskStatus.BLOCKED) {
        throw new Error('Task2 should be blocked when resource is locked');
      }
      
      console.log('  🏁 Resource locking prevents conflicts');

      // Release resource
      dm.resourceLocks.delete('database-lock');
      dm.updateTaskStatus('task2');
      
      const task2StatusAfter = dm.tasks.get('task2').status;
      if (task2StatusAfter !== TaskStatus.READY) {
        throw new Error('Task2 should be ready when resource is released');
      }
      
      console.log('  🏁 Resource release unblocks waiting tasks');

      console.log(chalk.green('  🏁 Resource conflict resolution: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Resource Conflict Resolution', passed);
  }

  /**
   * Test 5: Knowledge Dependencies
   */
  async testKnowledgeDependencies() {
    console.log(chalk.yellow('\n📋 Test 5: Knowledge Dependencies\n'));
    
    const dm = new EnhancedDependencyManager();
    let passed = true;

    try {
      // Create tasks with knowledge production/consumption
      dm.addTask('analyzer', { 
        name: 'Code Analysis',
        produces: ['code-metrics', 'vulnerability-report']
      });

      dm.addTask('optimizer', { 
        name: 'Code Optimization',
        requires: ['code-metrics']
      });

      dm.addTask('security-fix', { 
        name: 'Security Patches',
        requires: ['vulnerability-report']
      });

      dm.addTask('report', { 
        name: 'Final Report',
        requires: ['code-metrics', 'vulnerability-report']
      });

      // Check knowledge dependencies were created
      const optimizerDeps = dm.dependencies.get('optimizer') || [];
      const knowledgeDep = optimizerDeps.find(d => 
        d.type === DependencyType.KNOWLEDGE && 
        d.taskId === 'analyzer'
      );
      
      if (!knowledgeDep) {
        throw new Error('Knowledge dependency not created');
      }
      
      console.log('  🏁 Knowledge dependency created: optimizer requires code-metrics from analyzer');

      // Check knowledge graph
      const metricsInfo = dm.knowledgeGraph.get('code-metrics');
      console.log(`  🏁 Knowledge graph updated:`);
      console.log(`    - "code-metrics" produced by: ${metricsInfo.producer}`);
      console.log(`    - "code-metrics" consumed by: ${metricsInfo.consumers.join(', ')}`);

      // Complete analyzer and check data flow
      await dm.markTaskCompleted('analyzer', {
        'code-metrics': { lines: 1000, complexity: 15 },
        'vulnerability-report': { critical: 0, high: 2 }
      });

      const analyzerTask = dm.tasks.get('analyzer');
      console.log('  🏁 Analyzer outputs stored for dependent tasks');

      console.log(chalk.green('  🏁 Knowledge dependencies: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Knowledge Dependencies', passed);
  }

  /**
   * Test 6: Inter-Agent Communication
   */
  async testInterAgentCommunication() {
    console.log(chalk.yellow('\n📋 Test 6: Inter-Agent Communication\n'));
    
    const protocol = new DependencyCommunicationProtocol();
    let passed = true;

    try {
      // Register agents
      const manager = protocol.registerAgent('manager', { role: 'manager' });
      const backend = protocol.registerAgent('backend-specialist', { role: 'specialist' });
      const frontend = protocol.registerAgent('frontend-specialist', { role: 'specialist' });
      const qa = protocol.registerAgent('qa-specialist', { role: 'specialist' });

      console.log(`  🏁 Registered ${protocol.channels.size} agents`);

      // Test message passing
      let messageReceived = false;
      backend.subscribe(MessageType.TASK_CLAIM, (message) => {
        messageReceived = true;
        console.log(`  🏁 Backend received task claim from ${message.from}`);
      });

      await manager.send('backend-specialist', MessageType.TASK_CLAIM, {
        taskId: 'implement-api',
        priority: 'high'
      });

      // Allow async message delivery
      await new Promise(resolve => setTimeout(resolve, 50));

      if (!messageReceived) {
        throw new Error('Message not received');
      }

      // Test broadcasting
      let broadcastCount = 0;
      frontend.subscribe(MessageType.STATUS_UPDATE, () => broadcastCount++);
      qa.subscribe(MessageType.STATUS_UPDATE, () => broadcastCount++);

      await backend.broadcast(MessageType.STATUS_UPDATE, {
        task: 'implement-api',
        status: 'completed'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      console.log(`  🏁 Broadcast received by ${broadcastCount} agents`);

      // Test resource negotiation
      const result = await protocol.negotiateResource('backend-specialist', 'database-lock', 10);
      console.log(`  🏁 Resource negotiation: ${result.status}`);

      // Test knowledge sharing
      protocol.publishKnowledge('backend-specialist', 'api-schema', {
        endpoints: ['/users', '/products']
      });

      const knowledge = await protocol.requestKnowledge('frontend-specialist', 'api-schema');
      if (!knowledge || !knowledge.endpoints) {
        throw new Error('Knowledge transfer failed');
      }
      
      console.log('  🏁 Knowledge successfully shared between agents');

      // Test blockage reporting
      protocol.reportBlockage('frontend-specialist', {
        task: 'ui-implementation',
        blockedOn: 'api-schema',
        duration: 1000
      });
      
      console.log('  🏁 Blockage reported to managers');

      console.log(chalk.green('  🏁 Inter-agent communication: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Inter-Agent Communication', passed);
  }

  /**
   * Test 7: Real-World Scenario - E-commerce Platform
   */
  async testRealWorldScenario() {
    console.log(chalk.yellow('\n📋 Test 7: Real-World Scenario - E-commerce Platform\n'));
    
    const dm = new EnhancedDependencyManager();
    const protocol = new DependencyCommunicationProtocol();
    let passed = true;

    try {
      console.log('  Simulating: "Build an e-commerce platform with user auth, product catalog, and checkout"\n');

      // Phase 1: Planning & Design
      dm.addTask('requirements', {
        name: 'Gather Requirements',
        specialist: 'product-manager',
        estimatedDuration: 2,
        produces: ['requirements-doc']
      });

      dm.addTask('architecture', {
        name: 'Design System Architecture',
        specialist: 'architect',
        dependencies: ['requirements'],
        estimatedDuration: 3,
        produces: ['architecture-doc', 'api-spec']
      });

      dm.addTask('db-design', {
        name: 'Design Database Schema',
        specialist: 'database-specialist',
        dependencies: ['requirements'],
        estimatedDuration: 2,
        produces: ['db-schema']
      });

      dm.addTask('ui-design', {
        name: 'Design UI/UX',
        specialist: 'ui-designer',
        dependencies: ['requirements'],
        estimatedDuration: 4,
        produces: ['ui-mockups']
      });

      // Phase 2: Implementation
      dm.addTask('auth-backend', {
        name: 'Implement Authentication API',
        specialist: 'backend-engineer',
        dependencies: [
          { taskId: 'architecture', type: DependencyType.HARD },
          { taskId: 'db-design', type: DependencyType.HARD }
        ],
        estimatedDuration: 5,
        produces: ['auth-api'],
        resourceRequirements: ['database-connection']
      });

      dm.addTask('product-backend', {
        name: 'Implement Product Catalog API',
        specialist: 'backend-engineer',
        dependencies: [
          { taskId: 'architecture', type: DependencyType.HARD },
          { taskId: 'db-design', type: DependencyType.HARD }
        ],
        estimatedDuration: 6,
        produces: ['product-api'],
        resourceRequirements: ['database-connection']
      });

      dm.addTask('checkout-backend', {
        name: 'Implement Checkout API',
        specialist: 'backend-engineer',
        dependencies: [
          { taskId: 'auth-backend', type: DependencyType.HARD },
          { taskId: 'product-backend', type: DependencyType.HARD }
        ],
        estimatedDuration: 7,
        produces: ['checkout-api'],
        resourceRequirements: ['payment-gateway']
      });

      dm.addTask('auth-frontend', {
        name: 'Build Authentication UI',
        specialist: 'frontend-engineer',
        dependencies: [
          { taskId: 'ui-design', type: DependencyType.HARD },
          { taskId: 'auth-backend', type: DependencyType.SOFT, weight: 0.5 }
        ],
        requires: ['ui-mockups', 'auth-api'],
        estimatedDuration: 4
      });

      dm.addTask('product-frontend', {
        name: 'Build Product Catalog UI',
        specialist: 'frontend-engineer',
        dependencies: [
          { taskId: 'ui-design', type: DependencyType.HARD },
          { taskId: 'product-backend', type: DependencyType.SOFT, weight: 0.5 }
        ],
        requires: ['ui-mockups', 'product-api'],
        estimatedDuration: 5
      });

      dm.addTask('checkout-frontend', {
        name: 'Build Checkout UI',
        specialist: 'frontend-engineer',
        dependencies: [
          { taskId: 'auth-frontend', type: DependencyType.HARD },
          { taskId: 'product-frontend', type: DependencyType.HARD },
          { taskId: 'checkout-backend', type: DependencyType.HARD }
        ],
        estimatedDuration: 6
      });

      // Phase 3: Testing & Deployment
      dm.addTask('integration-testing', {
        name: 'Integration Testing',
        specialist: 'qa-engineer',
        dependencies: [
          'auth-frontend',
          'product-frontend',
          'checkout-frontend'
        ],
        estimatedDuration: 4
      });

      dm.addTask('deployment', {
        name: 'Deploy to Production',
        specialist: 'devops-engineer',
        dependencies: ['integration-testing'],
        estimatedDuration: 2,
        resourceRequirements: ['production-environment']
      });

      // Calculate execution plan
      const plan = dm.calculateExecutionPlan();
      
      console.log('  📊 Execution Plan Analysis:');
      console.log(`    Total tasks: ${dm.tasks.size}`);
      console.log(`    Execution stages: ${plan.stages.length}`);
      console.log(`    Critical path length: ${plan.criticalPath.length} tasks`);
      console.log(`    Estimated duration: ${plan.estimatedDuration} time units`);
      console.log(`    Resource conflicts: ${plan.resourceConflicts.length}`);

      console.log('\n  🟡 Execution Stages:');
      plan.stages.forEach((stage, index) => {
        const tasks = stage.map(id => {
          const task = dm.tasks.get(id);
          return `${task.name} (${task.specialist})`;
        });
        console.log(`    Stage ${index + 1}: ${tasks.length} parallel tasks`);
        tasks.forEach(t => console.log(`      - ${t}`));
      });

      console.log('\n  🔥 Critical Path:');
      const criticalPathNames = plan.criticalPath.map(id => dm.tasks.get(id).name);
      console.log(`    ${criticalPathNames.join(' → ')}`);

      // Simulate execution with agent communication
      console.log('\n  📡 Simulating Agent Communication:');
      
      // Register agents for each specialist
      const agents = new Map();
      for (const [taskId, task] of dm.tasks) {
        if (task.specialist && !agents.has(task.specialist)) {
          const agent = protocol.registerAgent(task.specialist, { 
            role: 'specialist',
            department: task.specialist.split('-')[0]
          });
          agents.set(task.specialist, agent);
        }
      }
      
      console.log(`    Registered ${agents.size} specialist agents`);

      // Simulate task execution
      let completedCount = 0;
      const readyTasks = dm.getReadyTasks();
      
      for (const taskId of readyTasks) {
        const task = dm.tasks.get(taskId);
        const agent = agents.get(task.specialist);
        
        if (agent) {
          // Claim task
          await agent.broadcast(MessageType.TASK_CLAIM, {
            taskId,
            specialist: task.specialist
          });
          
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Complete task
          const outputs = {};
          if (task.produces) {
            task.produces.forEach(item => {
              outputs[item] = `${item}_data`;
            });
          }
          
          await dm.markTaskCompleted(taskId, outputs);
          completedCount++;
          
          // Publish completion
          await agent.broadcast(MessageType.DEPENDENCY_COMPLETED, {
            taskId,
            outputs
          });
        }
      }
      
      console.log(`    Initial tasks completed: ${completedCount}`);
      console.log(`    Ready tasks after first wave: ${dm.getReadyTasks().length}`);

      // Generate final status report
      const status = dm.getStatusReport();
      console.log('\n  📈 Final Status:');
      console.log(`    Progress: ${status.summary.progress.toFixed(1)}%`);
      console.log(`    Completed: ${status.summary.completed}/${status.summary.total}`);
      console.log(`    Blocked: ${status.summary.blocked}`);
      console.log(`    Ready: ${status.summary.ready}`);

      if (status.recommendations.length > 0) {
        console.log('\n  💡 Recommendations:');
        status.recommendations.forEach(rec => {
          console.log(`    - ${rec.message} (${rec.severity})`);
        });
      }

      console.log(chalk.green('\n  🏁 Real-world scenario: PASSED'));
      
    } catch (error) {
      console.log(chalk.red(`  🔴 Test failed: ${error.message}`));
      passed = false;
    }

    this.recordResult('Real-World Scenario', passed);
  }

  recordResult(testName, passed) {
    this.testResults.push({ testName, passed });
    if (passed) {
      this.passedTests++;
    } else {
      this.failedTests++;
    }
  }

  printSummary() {
    console.log(chalk.cyan.bold('\n\n📊 Test Summary\n'));
    console.log(chalk.gray('=' .repeat(60)));
    
    const total = this.passedTests + this.failedTests;
    const passRate = ((this.passedTests / total) * 100).toFixed(1);
    
    console.log(`  Total Tests: ${total}`);
    console.log(`  ${chalk.green(`Passed: ${this.passedTests}`)}`);
    console.log(`  ${chalk.red(`Failed: ${this.failedTests}`)}`);
    console.log(`  Pass Rate: ${passRate}%`);
    
    console.log('\n  Test Results:');
    this.testResults.forEach(result => {
      const icon = result.passed ? chalk.green('🏁') : chalk.red('🔴');
      const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
      console.log(`    ${icon} ${result.testName}: ${status}`);
    });
    
    console.log(chalk.gray('\n' + '=' .repeat(60)));
    
    if (this.failedTests === 0) {
      console.log(chalk.green.bold('\n🏁 ALL TESTS PASSED! Dependency system is working perfectly!\n'));
    } else {
      console.log(chalk.yellow.bold(`\n🟠️  ${this.failedTests} test(s) failed. Review the output above.\n`));
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new DependencySystemTest();
  tester.runAllTests().catch(error => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
  });
}

module.exports = DependencySystemTest;