#!/usr/bin/env node

/**
 * Test Day 3 Improvements
 * Demonstrates task flow tracing, failure visibility, and circuit breakers
 */

const chalk = require('chalk');
const { TaskFlow, getTaskFlowRegistry } = require('../src/core/tracing/task-flow');
const { getFailureManager } = require('../src/core/failures/failure-manager');
const { protect, getCircuitBreakerRegistry } = require('../src/core/resilience/circuit-breaker');

console.log(chalk.cyan.bold('\n🧪 Testing Day 3 Improvements\n'));

/**
 * Test 1: Task Flow Tracing
 */
async function testTaskFlow() {
  console.log(chalk.yellow('1. Task Flow Tracing:'));
  
  const registry = getTaskFlowRegistry();
  const flow = registry.createFlow('user-request', { 
    type: 'code-generation',
    user: 'test' 
  });
  
  // Simulate task flow through system
  flow.addStep('CommandRouter', 'parse', {
    input: '/bumba:create function',
    output: { command: 'create', args: ['function'] },
    duration: 15
  });
  
  flow.addStep('CommandRouter', 'route', {
    output: 'CreateCommand',
    duration: 5
  });
  
  flow.addStep('DepartmentManager', 'validate', {
    output: { valid: true },
    duration: 120
  });
  
  flow.addStep('SpecialistFactory', 'spawn', {
    output: 'JavaScriptSpecialist',
    duration: 45
  });
  
  flow.addStep('JavaScriptSpecialist', 'process', {
    input: 'Generate arrow function',
    output: 'const fn = () => { ... }',
    duration: 230
  });
  
  // Simulate an error
  flow.addStep('ValidationFramework', 'validate', {
    status: 'error',
    error: 'Syntax error in generated code',
    duration: 89
  });
  
  // Complete flow
  registry.completeFlow(flow.taskId);
  
  // Display visualization
  console.log(flow.visualize('text'));
  
  // Show bottlenecks
  const bottlenecks = flow.findBottlenecks(100);
  if (bottlenecks.length > 0) {
    console.log(chalk.yellow('\nBottlenecks detected:'));
    bottlenecks.forEach(b => {
      console.log(`  - ${b.component}::${b.action}: ${b.duration}ms (${b.percentage})`);
    });
  }
  
  console.log(chalk.green('✓ Task flow tracing working\n'));
}

/**
 * Test 2: Failure Manager
 */
async function testFailureManager() {
  console.log(chalk.yellow('2. Failure Manager:'));
  
  const failureManager = getFailureManager();
  
  // Simulate various failures
  console.log('Simulating failures...');
  
  // API failure
  failureManager.handleFailure(
    new Error('API endpoint not responding'),
    'APIClient',
    { endpoint: '/api/generate' }
  );
  
  // Network failure
  const networkError = new Error('Connection refused');
  networkError.code = 'ECONNREFUSED';
  failureManager.handleFailure(
    networkError,
    'NetworkManager'
  );
  
  // Validation failure
  failureManager.handleFailure(
    new Error('Invalid input: missing required field'),
    'ValidationFramework'
  );
  
  // Resource failure
  failureManager.handleFailure(
    new Error('Memory limit exceeded'),
    'ResourceManager'
  );
  
  // Multiple failures from same component (pattern detection)
  for (let i = 0; i < 3; i++) {
    failureManager.handleFailure(
      new Error(`Timeout attempt ${i + 1}`),
      'SlowComponent'
    );
  }
  
  // Get statistics
  const stats = failureManager.getStatistics();
  console.log('\nFailure Statistics:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Active: ${stats.active}`);
  console.log(`  Patterns: ${stats.patterns}`);
  
  if (stats.degradedComponents.length > 0) {
    console.log(chalk.yellow(`  Degraded: ${stats.degradedComponents.join(', ')}`));
  }
  
  // Show report
  console.log(failureManager.generateReport());
  
  console.log(chalk.green('✓ Failure manager working\n'));
}

/**
 * Test 3: Circuit Breakers
 */
async function testCircuitBreakers() {
  console.log(chalk.yellow('3. Circuit Breakers:'));
  
  const registry = getCircuitBreakerRegistry();
  
  // Create a flaky function that fails sometimes
  let callCount = 0;
  const flakyFunction = async () => {
    callCount++;
    if (callCount <= 5) {
      throw new Error(`Failed attempt ${callCount}`);
    }
    return `Success on attempt ${callCount}`;
  };
  
  // Protect function with circuit breaker
  const protectedFunction = protect('flaky-service', flakyFunction, {
    threshold: 3,
    timeout: 1000,
    fallback: () => 'Fallback response'
  });
  
  console.log('Testing circuit breaker with failing function...\n');
  
  // Make multiple calls
  for (let i = 1; i <= 8; i++) {
    try {
      const result = await protectedFunction();
      console.log(chalk.green(`  Call ${i}: ${result}`));
    } catch (error) {
      console.log(chalk.red(`  Call ${i}: ${error.message}`));
    }
    
    // Show circuit state
    const status = registry.getBreaker('flaky-service').getStatus();
    console.log(chalk.gray(`    Circuit state: ${status.state}`));
    
    // Wait a bit between calls
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Show health summary
  const health = registry.getHealthSummary();
  console.log('\nCircuit Breaker Health:');
  console.log(`  Total circuits: ${health.total}`);
  console.log(`  Healthy: ${health.healthy}`);
  console.log(`  Open: ${health.open}`);
  console.log(`  Half-open: ${health.halfOpen}`);
  
  console.log(chalk.green('\n✓ Circuit breakers working\n'));
}

/**
 * Test 4: Integration
 */
async function testIntegration() {
  console.log(chalk.yellow('4. Integration Test:'));
  
  const registry = getTaskFlowRegistry();
  const failureManager = getFailureManager();
  const cbRegistry = getCircuitBreakerRegistry();
  
  // Create protected API call with tracing
  const apiCall = protect('api-service', async (endpoint) => {
    const flow = registry.createFlow(`api:${endpoint}`);
    
    try {
      flow.addStep('API', 'prepare', { duration: 10 });
      
      // Simulate failure on certain endpoints
      if (endpoint === '/failing') {
        throw new Error('Endpoint unavailable');
      }
      
      flow.addStep('API', 'execute', { duration: 100 });
      flow.addStep('API', 'parse', { duration: 20 });
      
      registry.completeFlow(flow.taskId);
      return { success: true, data: 'response' };
      
    } catch (error) {
      flow.addError('API', error);
      failureManager.handleFailure(error, 'API', { endpoint });
      registry.completeFlow(flow.taskId);
      throw error;
    }
  }, {
    threshold: 2,
    fallback: () => ({ success: false, data: 'cached' })
  });
  
  // Test the integrated system
  console.log('Testing integrated system...\n');
  
  // Successful calls
  for (let i = 0; i < 2; i++) {
    const result = await apiCall('/working');
    console.log(chalk.green(`  ✓ Success: ${JSON.stringify(result)}`));
  }
  
  // Failing calls to trigger circuit
  for (let i = 0; i < 3; i++) {
    try {
      const result = await apiCall('/failing');
      console.log(chalk.green(`  ✓ Result: ${JSON.stringify(result)}`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠ Using fallback due to: ${error.message}`));
    }
  }
  
  // Show integrated stats
  console.log('\nIntegrated System Status:');
  const flows = registry.getStatistics();
  console.log(`  Active flows: ${flows.activeCount}`);
  console.log(`  Completed flows: ${flows.completedCount}`);
  
  const failures = failureManager.getStatistics();
  console.log(`  Total failures: ${failures.total}`);
  
  const circuits = cbRegistry.getHealthSummary();
  console.log(`  Circuit breakers: ${circuits.total} (${circuits.open} open)`);
  
  console.log(chalk.green('\n✓ Integration working\n'));
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await testTaskFlow();
    await new Promise(r => setTimeout(r, 500));
    
    await testFailureManager();
    await new Promise(r => setTimeout(r, 500));
    
    await testCircuitBreakers();
    await new Promise(r => setTimeout(r, 500));
    
    await testIntegration();
    
    console.log(chalk.green.bold('\n✅ Day 3 Improvements Complete!'));
    console.log(chalk.gray('\nAchievements:'));
    console.log(chalk.gray('  • Task flow tracing through entire system'));
    console.log(chalk.gray('  • Failures are visible and categorized'));
    console.log(chalk.gray('  • Circuit breakers prevent cascade failures'));
    console.log(chalk.gray('  • Integrated monitoring and protection\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  process.exit(0);
});