/**
 * Practical Routing System Test
 * Tests the actual routing system without external dependencies
 */

// Mock external dependencies
const mockLogger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.log('[WARN]', ...args),
  error: (...args) => console.log('[ERROR]', ...args)
};

// Mock the logger module
require.cache[require.resolve('../src/core/logging/bumba-logger')] = {
  exports: { logger: mockLogger }
};

// Import routing components
const { CommandRouterIntegration } = require('../src/core/command-router-integration');
const { ClaudeMaxAccountManager } = require('../src/core/agents/claude-max-account-manager');
const { DomainModelRouter } = require('../src/core/agents/domain-model-router');

// Test colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function testSection(name) {
  console.log(`${colors.cyan}  ${name}${colors.reset}`);
}

function testCase(name) {
  console.log(`${colors.blue}▶ ${name}${colors.reset}`);
}

function success(message) {
  console.log(`  ${colors.green}🏁${colors.reset} ${message}`);
}

function fail(message) {
  console.log(`  ${colors.red}🟢${colors.reset} ${message}`);
}

function info(message, data) {
  console.log(`  ${colors.yellow}ℹ${colors.reset} ${message}`);
  if (data) {
    console.log(`    ${JSON.stringify(data, null, 2).replace(/\n/g, '\n    ')}`);
  }
}

async function runTests() {
  console.log(`${colors.cyan}║   BUMBA ROUTING SYSTEM PRACTICAL TEST       ║${colors.reset}`);
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Initialize components
  const router = new CommandRouterIntegration();
  const claudeMaxManager = new ClaudeMaxAccountManager();
  const domainRouter = new DomainModelRouter();
  
  // TEST 1: Basic Routing
  testSection('TEST 1: Basic Command Routing');
  
  testCase('Route simple analyze command');
  totalTests++;
  try {
    const result = await router.routeCommand('analyze', ['code quality'], {});
    
    if (result && result.execution && result.execution.agents.length > 0) {
      success('Command routed successfully');
      info('Agents assigned:', result.execution.agents.map(a => `${a.name} (${a.model})`));
      info('Confidence:', result.routing.confidence);
      passedTests++;
    } else {
      fail('No agents assigned');
    }
  } catch (error) {
    fail(`Error: ${error.message}`);
  }
  
  // TEST 2: Claude Max Exclusivity
  testSection('TEST 2: Claude Max Exclusivity');
  
  testCase('Enforce single Claude Max usage');
  totalTests++;
  try {
    // First agent gets lock
    const lock1 = await claudeMaxManager.acquireLock('agent1', 'manager', 2);
    
    if (lock1) {
      success('First agent acquired Claude Max lock');
      
      // Second agent should be queued
      const lock2Promise = claudeMaxManager.acquireLock('agent2', 'manager', 2);
      
      // Check queue
      if (claudeMaxManager.queue.length === 1) {
        success('Second agent properly queued');
      }
      
      // Release first lock
      await claudeMaxManager.releaseLock('agent1');
      success('First agent released lock');
      
      // Second should now get it
      const lock2 = await lock2Promise;
      if (lock2) {
        success('Second agent acquired lock after first released');
        await claudeMaxManager.releaseLock('agent2');
        passedTests++;
      }
    }
  } catch (error) {
    fail(`Error: ${error.message}`);
  }
  
  // TEST 3: Domain-Specific Routing
  testSection('TEST 3: Domain-Specific Routing');
  
  const domainTests = [
    { command: 'optimize', args: ['database performance'], expected: 'database-specialist' },
    { command: 'audit', args: ['security vulnerabilities'], expected: 'security-specialist' },
    { command: 'design', args: ['user interface'], expected: 'design-engineer-manager' },
    { command: 'implement', args: ['Python API'], expected: 'python-specialist' }
  ];
  
  for (const test of domainTests) {
    testCase(`Route "${test.command} ${test.args.join(' ')}"`);
    totalTests++;
    
    try {
      const result = await router.routeCommand(test.command, test.args, {});
      const hasExpected = result.execution.agents.some(a => a.name === test.expected);
      
      if (hasExpected) {
        success(`Correctly routed to ${test.expected}`);
        passedTests++;
      } else {
        fail(`Did not route to ${test.expected}`);
        info('Got agents:', result.execution.agents.map(a => a.name));
      }
    } catch (error) {
      fail(`Error: ${error.message}`);
    }
  }
  
  // TEST 4: Model Assignment
  testSection('TEST 4: Free Tier Model Assignment');
  
  const modelTests = [
    { taskType: 'reasoning', expected: 'deepseek' },
    { taskType: 'coding', expected: 'qwen' },
    { taskType: 'general', expected: 'gemini' }
  ];
  
  for (const test of modelTests) {
    testCase(`Assign model for ${test.taskType} tasks`);
    totalTests++;
    
    try {
      const config = await domainRouter.assignModelToWorker({ taskType: test.taskType });
      
      if (config.model === test.expected) {
        success(`Correctly assigned ${test.expected} for ${test.taskType}`);
        passedTests++;
      } else {
        fail(`Expected ${test.expected}, got ${config.model}`);
      }
    } catch (error) {
      fail(`Error: ${error.message}`);
    }
  }
  
  // TEST 5: Complex Multi-Domain
  testSection('TEST 5: Complex Multi-Domain Routing');
  
  testCase('Route full-stack application command');
  totalTests++;
  try {
    const result = await router.routeCommand(
      'implement',
      ['full-stack app with React frontend, Node.js backend, and PostgreSQL'],
      {}
    );
    
    const managers = result.execution.agents.filter(a => a.role === 'manager');
    const specialists = result.execution.agents.filter(a => a.role === 'specialist');
    const claudeMaxCount = result.execution.agents.filter(a => a.usingClaudeMax).length;
    
    let allGood = true;
    
    // Check multiple agents assigned
    if (result.execution.agents.length > 2) {
      success(`Multiple agents assigned (${result.execution.agents.length} total)`);
    } else {
      fail('Not enough agents for complex task');
      allGood = false;
    }
    
    // Check Claude Max exclusivity
    if (claudeMaxCount <= 1) {
      success(`Claude Max exclusivity maintained (${claudeMaxCount} using)`);
    } else {
      fail(`Multiple agents using Claude Max (${claudeMaxCount})`);
      allGood = false;
    }
    
    // Check specialists have free tier models
    const specialistsValid = specialists.every(s => 
      !s.usingClaudeMax && ['deepseek', 'qwen', 'gemini'].includes(s.model)
    );
    
    if (specialistsValid) {
      success('All specialists using free tier models');
    } else {
      fail('Some specialists not using free tier models');
      allGood = false;
    }
    
    if (allGood) passedTests++;
    
    info('Routing details:', {
      managers: managers.map(m => `${m.name} (${m.model})`),
      specialists: specialists.map(s => `${s.name} (${s.model})`),
      requiresCoordination: result.execution.requiresCoordination
    });
    
  } catch (error) {
    fail(`Error: ${error.message}`);
  }
  
  // TEST 6: Manager Priority
  testSection('TEST 6: Manager Always Gets Claude Max');
  
  testCase('Single manager gets Claude Max');
  totalTests++;
  try {
    const result = await router.routeCommand('implement', ['REST API'], {});
    const managers = result.execution.agents.filter(a => a.role === 'manager');
    
    if (managers.length > 0 && managers[0].usingClaudeMax) {
      success('Manager correctly assigned Claude Max');
      passedTests++;
    } else {
      fail('Manager did not get Claude Max');
    }
  } catch (error) {
    fail(`Error: ${error.message}`);
  }
  
  // RESULTS
  console.log(`${colors.cyan}  TEST RESULTS${colors.reset}`);
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  const resultColor = passedTests === totalTests ? colors.green : 
                      passedTests > totalTests * 0.7 ? colors.yellow : colors.red;
  
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${resultColor}Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
  console.log(`  ${resultColor}Success Rate: ${percentage}%${colors.reset}`);
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.green}🏁 ALL TESTS PASSED! The routing system is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}🟡  Some tests failed. Review the output above for details.${colors.reset}`);
  }
  
  // Clean up
  claudeMaxManager.reset();
}

// Run the tests
runTests().catch(error => {
  console.error(`\n${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});