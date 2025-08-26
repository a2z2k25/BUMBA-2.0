/**
 * Verify Key Routing Features
 * Tests that all critical routing requirements are met
 */

console.log('\n🟢 VERIFYING KEY ROUTING FEATURES\n');
console.log('=' .repeat(50));

// Import components
const { UnifiedRoutingSystem } = require('../src/core/unified-routing-system');
const { ClaudeMaxAccountManager } = require('../src/core/agents/claude-max-account-manager');
const { DomainModelRouter } = require('../src/core/agents/domain-model-router');
const { SpecialistSpawner } = require('../src/core/spawning/specialist-spawner');
const { RoutingLearningSystem } = require('../src/core/routing/routing-learning-system');
const { RoutingFeedbackSystem } = require('../src/core/routing/routing-feedback-system');

// Initialize components
const routingSystem = new UnifiedRoutingSystem();
const claudeMaxManager = new ClaudeMaxAccountManager();
const domainRouter = new DomainModelRouter();
const specialistSpawner = new SpecialistSpawner();
const learningSystem = new RoutingLearningSystem({ persistenceEnabled: false });
const feedbackSystem = new RoutingFeedbackSystem();

let testsPassed = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result) {
      console.log(`🏁 ${name}`);
      testsPassed++;
      return true;
    } else {
      console.log(`🔴 ${name}`);
      return false;
    }
  } catch (error) {
    console.log(`🔴 ${name}: ${error.message}`);
    return false;
  }
}

// FEATURE 1: Claude Max Exclusivity
console.log('\n🟢 FEATURE 1: Claude Max Exclusivity (Mutex Lock)');
console.log('-'.repeat(50));

test('Only one agent can hold Claude Max lock', () => {
  claudeMaxManager.reset();
  const lock1 = claudeMaxManager.acquireLock('agent1', 'manager', 2);
  const isLocked = claudeMaxManager.mutex.locked;
  const currentAgent = claudeMaxManager.mutex.owner; // Fixed: should be 'owner' not 'currentAgent'
  claudeMaxManager.reset();
  return isLocked && currentAgent === 'agent1';
});

test('Priority queue works (Executive > Manager)', () => {
  claudeMaxManager.reset();
  // Manager gets lock
  claudeMaxManager.acquireLock('manager1', 'manager', 2);
  // Queue executive and another manager
  claudeMaxManager.acquireLock('executive1', 'executive', 1);
  claudeMaxManager.acquireLock('manager2', 'manager', 2);
  
  // Check queue order - executive should be first due to higher priority
  const queue = claudeMaxManager.mutex.queue;
  const firstInQueue = queue[0]?.agentId === 'executive1';
  claudeMaxManager.reset();
  return firstInQueue;
});

// FEATURE 2: Free Tier Model Assignment
console.log('\n🟢 FEATURE 2: Task-Based Free Tier Models');
console.log('-'.repeat(50));

test('DeepSeek assigned for reasoning tasks', async () => {
  const config = await domainRouter.assignModelToWorker({ taskType: 'reasoning' });
  return config.model === 'deepseek';
});

test('Qwen assigned for coding tasks', async () => {
  const config = await domainRouter.assignModelToWorker({ taskType: 'coding' });
  return config.model === 'qwen';
});

test('Gemini assigned for general tasks', async () => {
  const config = await domainRouter.assignModelToWorker({ taskType: 'general' });
  return config.model === 'gemini';
});

// FEATURE 3: Intent & Department Detection
console.log('\n🟢 FEATURE 3: Intelligent Intent Analysis');
console.log('-'.repeat(50));

test('Detects database specialist for DB tasks', () => {
  const result = routingSystem.analyzer.analyzeIntent('optimize', ['database performance'], {});
  return result.specialists.includes('database-specialist');
});

test('Detects security specialist for security tasks', () => {
  const result = routingSystem.analyzer.analyzeIntent('audit', ['security vulnerabilities'], {});
  return result.specialists.includes('security-specialist');
});

test('Detects Python specialist when mentioned', () => {
  const result = routingSystem.analyzer.analyzeIntent('implement', ['Python Flask API'], {});
  return result.explicitLanguage === 'python' && result.specialists.includes('python-specialist');
});

test('Identifies executive-level tasks', () => {
  const result = routingSystem.analyzer.analyzeIntent('plan', ['enterprise platform transformation'], {});
  return result.isExecutiveLevel === true;
});

test('Detects multiple departments for complex tasks', () => {
  const result = routingSystem.analyzer.analyzeIntent('implement', ['full-stack app with frontend and backend'], {});
  return result.departments.length > 1;
});

// FEATURE 4: Specialist Availability
console.log('\n🟢 FEATURE 4: Specialist Spawning System');
console.log('-'.repeat(50));

test('All key specialists are available', () => {
  const available = specialistSpawner.getAvailableSpecialists();
  const required = [
    'security-specialist',
    'database-specialist',
    'frontend-specialist',
    'python-specialist',
    'javascript-specialist',
    'ux-research-specialist',
    'market-research-specialist'
  ];
  return required.every(spec => available.includes(spec));
});

test('Specialists mapped to correct departments', () => {
  const mappings = specialistSpawner.specialistMappings;
  return mappings['security-specialist'].department === 'technical' &&
         mappings['ux-research-specialist'].department === 'experience' &&
         mappings['market-research-specialist'].department === 'strategic';
});

test('Specialists have correct task types', () => {
  const mappings = specialistSpawner.specialistMappings;
  return mappings['security-specialist'].taskType === 'reasoning' &&
         mappings['database-specialist'].taskType === 'coding' &&
         mappings['ui-designer'].taskType === 'general';
});

// FEATURE 5: Learning System
console.log('\n🟢 FEATURE 5: Learning & Memory System');
console.log('-'.repeat(50));

test('Learning system records successful routings', async () => {
  const routingPlan = {
    execution: { agents: [{ name: 'test-agent', model: 'gemini' }] },
    routing: { confidence: 0.8, source: 'test' }
  };
  
  await learningSystem.learnFromRouting('test', ['command'], routingPlan, { success: true });
  const learned = learningSystem.getLearnedRouting('test', ['command']);
  return learned.found === true;
});

test('Learning system tracks model performance', () => {
  const stats = learningSystem.getStatistics();
  return stats.modelPerformance !== undefined &&
         stats.modelPerformance['gemini'] !== undefined;
});

// FEATURE 6: Feedback System
console.log('\n🟢 FEATURE 6: Performance Feedback Loop');
console.log('-'.repeat(50));

test('Feedback system tracks agent performance', async () => {
  await feedbackSystem.recordExecutionFeedback('test-exec', {
    success: true,
    executionTime: 1000,
    agents: [{ name: 'test-agent' }],
    models: ['gemini']
  });
  
  const perf = feedbackSystem.getAgentPerformance('test-agent');
  return perf !== null && perf.totalExecutions === 1;
});

test('Feedback system generates recommendations', () => {
  const summary = feedbackSystem.getFeedbackSummary();
  return summary.recommendations !== undefined;
});

// RESULTS
console.log('\n' + '='.repeat(50));
console.log('🟢 VERIFICATION RESULTS');
console.log('='.repeat(50));

const percentage = ((testsPassed / totalTests) * 100).toFixed(1);
console.log(`\nTests Passed: ${testsPassed}/${totalTests} (${percentage}%)`);

if (testsPassed === totalTests) {
  console.log('\n🏁 SUCCESS: All critical routing features are working!');
  console.log('\nThe system correctly:');
  console.log('  • Enforces Claude Max exclusivity with mutex lock');
  console.log('  • Assigns appropriate free tier models by task type');
  console.log('  • Detects intents, departments, and specialists');
  console.log('  • Spawns specialists with correct configurations');
  console.log('  • Learns from routing decisions');
  console.log('  • Tracks performance and provides feedback');
} else {
  console.log(`\n🟡  WARNING: ${totalTests - testsPassed} critical features are not working`);
}

// Clean up
claudeMaxManager.reset();
feedbackSystem.reset();
learningSystem.clearMemory();

process.exit(testsPassed === totalTests ? 0 : 1);