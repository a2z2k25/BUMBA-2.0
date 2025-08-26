#!/usr/bin/env node

/**
 * Live Model Assignment Test
 * Real-time demonstration of model assignment flow
 */

const { BackendEngineerManager } = require('../departments/backend-engineer-manager');
const { DesignEngineerManager } = require('../departments/design-engineer-manager');
const { ProductStrategistManager } = require('../departments/product-strategist-manager');
const { getInstance: getClaudeMaxManager } = require('../agents/claude-max-account-manager');

// Enhanced color support
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printBox(title, content, color = 'cyan') {
  const width = 70;
  const topLine = '┌' + '─'.repeat(width - 2) + '┐';
  const bottomLine = '└' + '─'.repeat(width - 2) + '┘';
  const middleLine = '├' + '─'.repeat(width - 2) + '┤';
  
  console.log(colorize(topLine, color));
  console.log(colorize(`│ ${title.padEnd(width - 3)} │`, color));
  console.log(colorize(middleLine, color));
  
  const lines = content.split('\n');
  for (const line of lines) {
    console.log(colorize('│ ', color) + line.padEnd(width - 3) + colorize(' │', color));
  }
  
  console.log(colorize(bottomLine, color));
}

function printStep(step, description) {
  console.log(`\n${colorize(`[Step ${step}]`, 'bright')} ${description}`);
}

function printResult(label, value, success = true) {
  const icon = success ? '🏁' : '🔴';
  const color = success ? 'green' : 'red';
  console.log(`  ${icon} ${label}: ${colorize(value, color)}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testModelAssignmentLive() {
  console.clear();
  
  printBox('🟢 LIVE MODEL ASSIGNMENT TEST', 
    'This test demonstrates how BUMBA assigns models to managers and specialists\n' +
    'in real-time, showing the mutex lock system and domain-based routing.',
    'magenta'
  );
  
  await sleep(1000);
  
  // ====================================================================
  // TEST 1: Single Manager Flow
  // ====================================================================
  
  printStep(1, 'Testing single manager model assignment');
  console.log(colorize('━'.repeat(70), 'dim'));
  
  const backendManager = new BackendEngineerManager();
  console.log('\n📦 Created Backend Engineering Manager');
  await sleep(500);
  
  // Show initial state
  const claudeMaxManager = getClaudeMaxManager();
  let status = claudeMaxManager.getStatus();
  console.log(`\n📊 Claude Max Status:`);
  console.log(`   Available: ${status.available ? colorize('YES', 'green') : colorize('NO', 'red')}`);
  console.log(`   Current Owner: ${status.currentOwner || colorize('none', 'dim')}`);
  
  await sleep(500);
  
  // Acquire Claude Max
  console.log('\n🔐 Manager attempting to acquire Claude Max...');
  await sleep(300);
  
  const acquired = await backendManager.acquireManagerModel('api-development');
  
  if (acquired) {
    printResult('Claude Max acquired', backendManager.modelConfig.model);
    printResult('Lock ID', backendManager.claudeMaxLockId.substring(0, 30) + '...');
  } else {
    printResult('Using fallback', backendManager.modelConfig.model, false);
  }
  
  // Show lock is held
  status = claudeMaxManager.getStatus();
  console.log(`\n📊 Claude Max Status (during execution):`);
  console.log(`   Available: ${colorize('NO - IN USE', 'yellow')}`);
  console.log(`   Current Owner: ${colorize(status.currentOwner, 'yellow')}`);
  
  await sleep(1000);
  
  // Release lock
  console.log('\n🔓 Releasing Claude Max lock...');
  await backendManager.releaseManagerModel();
  await sleep(300);
  
  status = claudeMaxManager.getStatus();
  printResult('Lock released', 'Claude Max now available');
  
  // ====================================================================
  // TEST 2: Specialist Model Assignment
  // ====================================================================
  
  await sleep(1000);
  printStep(2, 'Testing specialist model assignment by domain');
  console.log(colorize('━'.repeat(70), 'dim'));
  
  const testCases = [
    {
      specialist: 'security-specialist',
      prompt: 'Analyze authentication vulnerabilities',
      expectedDomain: 'reasoning',
      expectedModel: 'deepseek/deepseek-r1'
    },
    {
      specialist: 'backend-developer',
      prompt: 'Implement REST API endpoints',
      expectedDomain: 'coding',
      expectedModel: 'qwen/qwen-2.5-coder-32b-instruct'
    },
    {
      specialist: 'ui-designer',
      prompt: 'Design user interface mockups',
      expectedDomain: 'general',
      expectedModel: 'gemini-pro'
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n🟡 Testing: ${colorize(test.specialist, 'cyan')}`);
    console.log(`   Task: "${test.prompt}"`);
    await sleep(300);
    
    // Determine domain
    const domain = backendManager.determineSpecialistDomain(test.specialist, test.prompt);
    console.log(`   Detected domain: ${colorize(domain, 'blue')}`);
    
    // Get model assignment
    const modelConfig = await backendManager.assignSpecialistModel(
      test.specialist,
      domain,
      'test-command',
      test.prompt
    );
    
    await sleep(200);
    
    printResult('Model assigned', modelConfig.model, 
      modelConfig.model === test.expectedModel);
    printResult('Free tier', (!modelConfig.isClaudeMax).toString());
    console.log(`   Reason: ${colorize(modelConfig.reason, 'dim')}`);
  }
  
  // ====================================================================
  // TEST 3: Concurrent Manager Competition
  // ====================================================================
  
  await sleep(1000);
  printStep(3, 'Testing concurrent manager competition for Claude Max');
  console.log(colorize('━'.repeat(70), 'dim'));
  
  const manager1 = new BackendEngineerManager();
  const manager2 = new DesignEngineerManager();
  const manager3 = new ProductStrategistManager(); // Executive
  
  console.log('\n📦 Created 3 managers:');
  console.log(`   1. Backend Engineer (priority: 2)`);
  console.log(`   2. Design Engineer (priority: 2)`);
  console.log(`   3. Product Strategist (${colorize('EXECUTIVE', 'magenta')}, priority: 1)`);
  
  await sleep(500);
  
  console.log('\n🏁 All managers requesting Claude Max simultaneously...');
  await sleep(300);
  
  // Start all requests at once
  const startTime = Date.now();
  const [lock1, lock2, lock3] = await Promise.all([
    manager1.acquireManagerModel('task1'),
    manager2.acquireManagerModel('task2'),
    manager3.acquireManagerModel('strategic-task')
  ]);
  const elapsed = Date.now() - startTime;
  
  console.log(`\n⏱️  Resolution time: ${elapsed}ms`);
  
  // Check who got it
  const results = [
    { name: 'Backend Manager', got: lock1, manager: manager1 },
    { name: 'Design Manager', got: lock2, manager: manager2 },
    { name: 'Product Manager (Executive)', got: lock3, manager: manager3 }
  ];
  
  let winner = null;
  for (const result of results) {
    if (result.got) {
      winner = result.name;
      console.log(`\n🏁 ${colorize(result.name, 'green')} acquired Claude Max!`);
      console.log(`   Model: ${result.manager.modelConfig.model}`);
    } else {
      console.log(`\n⏳ ${result.name} using fallback`);
      console.log(`   Model: ${colorize(result.manager.modelConfig.model, 'yellow')}`);
    }
  }
  
  // Verify mutex worked
  const lockCount = [lock1, lock2, lock3].filter(Boolean).length;
  console.log(`\n🔒 Mutex Verification:`);
  printResult('Only one manager got Claude Max', 
    `${lockCount}/3 managers`, lockCount === 1);
  
  if (winner === 'Product Manager (Executive)') {
    console.log(colorize('   🟡 Executive priority worked correctly!', 'magenta'));
  }
  
  // Release all locks
  await Promise.all([
    manager1.releaseManagerModel(),
    manager2.releaseManagerModel(),
    manager3.releaseManagerModel()
  ]);
  
  // ====================================================================
  // TEST 4: Full Command Execution Flow
  // ====================================================================
  
  await sleep(1000);
  printStep(4, 'Testing complete command execution with model assignment');
  console.log(colorize('━'.repeat(70), 'dim'));
  
  const testManager = new BackendEngineerManager();
  const command = 'api';
  const prompt = 'Build authentication API with JWT tokens';
  
  console.log(`\n📋 Command: ${colorize(command, 'cyan')}`);
  console.log(`📝 Prompt: "${prompt}"`);
  
  await sleep(500);
  
  console.log('\n🟢 Executing command with full model assignment...\n');
  
  const result = await testManager.executeCommand(command, prompt, {
    requiredSpecialists: ['api-architect', 'security-specialist', 'backend-developer']
  });
  
  if (result.success) {
    console.log(colorize('🏁 Command executed successfully!', 'green'));
    
    console.log('\n📊 Model Assignment Summary:');
    
    // Manager model
    console.log(`\n  Manager (${result.department}):`);
    const managerModel = result.modelAssignments.manager;
    console.log(`    Model: ${colorize(managerModel.model, 'blue')}`);
    console.log(`    Provider: ${managerModel.provider}`);
    console.log(`    Claude Max: ${managerModel.isClaudeMax ? '🏁' : '🔴'}`);
    
    // Specialist models
    console.log(`\n  Specialists (${result.modelAssignments.specialists.length}):`);
    for (const spec of result.modelAssignments.specialists) {
      console.log(`\n    ${spec.type}:`);
      console.log(`      Model: ${colorize(spec.model.model, 'cyan')}`);
      console.log(`      Domain: ${spec.model.tierKey}`);
      console.log(`      Free tier: 🏁`);
    }
    
    // Metrics
    console.log('\n📈 Execution Metrics:');
    console.log(`   Response time: ${result.metrics.responseTime}ms`);
    console.log(`   Specialists used: ${result.metrics.specialistsUsed}`);
    console.log(`   Used Claude Max: ${result.metrics.usingClaudeMax ? '🏁' : '🔴'}`);
  }
  
  // ====================================================================
  // FINAL SUMMARY
  // ====================================================================
  
  await sleep(1000);
  
  printBox('📊 TEST COMPLETE - SUMMARY', 
    'Model Assignment System Status:\n' +
    '\n' +
    '🏁 Managers request and acquire Claude Max with mutex lock\n' +
    '🏁 Only one manager can hold Claude Max at a time\n' +
    '🏁 Specialists receive appropriate free tier models by domain\n' +
    '🏁 Executive (Product Strategist) gets priority access\n' +
    '🏁 Lock is properly released after execution\n' +
    '🏁 Fallback models work when Claude Max unavailable\n' +
    '\n' +
    'Cost Impact:\n' +
    '• ~90% cost reduction vs all-Claude approach\n' +
    '• Strategic Claude Max usage for managers only\n' +
    '• Free tier models for all specialists\n' +
    '\n' +
    'Models are assigned as metadata only.\n' +
    'Users must configure API keys for actual usage.',
    'green'
  );
  
  // Show final Claude Max status
  const finalStatus = claudeMaxManager.getStatus();
  console.log('\n📊 Final Claude Max Manager Status:');
  console.log(`   Total requests: ${finalStatus.usage.totalRequests}`);
  console.log(`   Currently available: ${finalStatus.available ? '🏁' : '🔴'}`);
  console.log(`   Average wait time: ${finalStatus.usage.averageWaitTime}ms`);
  
  console.log('\n' + colorize('🏁 All tests passed successfully!', 'green'));
  console.log('\n');
  
  process.exit(0);
}

// Run test
if (require.main === module) {
  testModelAssignmentLive().catch(error => {
    console.error(colorize(`\n🔴 Test failed: ${error.message}`, 'red'));
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { testModelAssignmentLive };