/**
 * Test Enhanced Hook System
 * Demonstrates agent communication and hook chaining
 */

const { bumbaHookSystem, HookContext } = require('../core/hooks/bumba-hook-system');
const { logger } = require('../core/logging/bumba-logger');

/**
 * Test agent communication hooks
 */
async function testAgentCommunication() {
  logger.info('🟢 Testing Agent Communication Hooks...\n');
  
  // Register agent-specific hooks
  bumbaHookSystem.registerHook('agent:design-engineer:task-received', async (context) => {
    logger.info('🟢 Design Engineer received task:', context.data.task);
    
    // Simulate design work
    context.set('design', {
      mockupUrl: '/designs/test-mockup.fig',
      components: ['HeaderComponent', 'MainView'],
      completed: true
    });
    
    return { success: true };
  }, {
    priority: 100,
    description: 'Design Engineer task handler'
  });
  
  bumbaHookSystem.registerHook('agent:backend-engineer:task-received', async (context) => {
    logger.info('🟢 Backend Engineer received task:', context.data.task);
    
    // Check if design is ready
    if (context.data.design && context.data.design.completed) {
      logger.info('🏁 Design is ready, implementing backend...');
      
      context.set('implementation', {
        apis: ['/api/test'],
        database: ['test_table'],
        completed: true
      });
    }
    
    return { success: true };
  }, {
    priority: 90,
    conditions: [
      data => data.design && data.design.completed
    ]
  });
  
  // Test handoff between agents
  const handoffContext = new HookContext({
    fromAgent: 'Product-Strategist',
    toAgent: 'Design-Engineer',
    task: 'Create user dashboard',
    priority: 'high'
  });
  
  logger.info('🟢 Testing agent handoff...');
  const handoffResult = await bumbaHookSystem.executeHook('agent:handoff', handoffContext);
  logger.info('Handoff result:', handoffResult.success ? 'Success' : 'Failed');
  
  // Notify Design Engineer
  await bumbaHookSystem.notifyAgent('design-engineer', 'task-received', handoffContext.data);
  
  // Design completes and hands off to Backend
  handoffContext.set('fromAgent', 'Design-Engineer');
  handoffContext.set('toAgent', 'Backend-Engineer');
  
  await bumbaHookSystem.executeHook('agent:handoff', handoffContext);
  await bumbaHookSystem.notifyAgent('backend-engineer', 'task-received', handoffContext.data);
  
  logger.info('\n🟢 Final Context:', JSON.stringify(handoffContext.data, null, 2));
}

/**
 * Test hook chaining
 */
async function testHookChaining() {
  logger.info('\n🟢 Testing Hook Chaining...\n');
  
  // Create a feature development chain
  bumbaHookSystem.createChain('test-feature-chain', [
    {
      type: 'pre-execution',
      transform: ctx => {
        logger.info('1️⃣ Pre-execution check');
        ctx.set('validated', true);
        return ctx;
      }
    },
    {
      type: 'agent:handoff',
      conditions: [data => data.validated === true],
      transform: ctx => {
        logger.info('2️⃣ Agent handoff');
        ctx.set('handoffComplete', true);
        return ctx;
      }
    },
    {
      type: 'consciousness-check',
      transform: ctx => {
        logger.info('3️⃣ Consciousness validation');
        ctx.set('consciousnessScore', 0.95);
        return ctx;
      }
    },
    {
      type: 'post-execution',
      transform: ctx => {
        logger.info('4️⃣ Post-execution quality check');
        ctx.set('qualityScore', 0.92);
        return ctx;
      }
    },
    {
      type: 'completion',
      transform: ctx => {
        logger.info('5️⃣ Completion notification');
        return ctx;
      }
    }
  ]);
  
  // Execute the chain
  const chainContext = new HookContext({
    feature: 'Test Feature',
    startTime: Date.now()
  });
  
  const chainResult = await bumbaHookSystem.executeChain('test-feature-chain', chainContext);
  
  logger.info('\n🟢 Chain execution result:', chainResult.success ? 'Success' : 'Failed');
  logger.info('Final context:', JSON.stringify(chainContext.data, null, 2));
}

/**
 * Test department coordination
 */
async function testDepartmentCoordination() {
  logger.info('\n🟢 Testing Department Coordination...\n');
  
  // Register department-specific hooks
  bumbaHookSystem.registerHook('department:technical:task', async (context) => {
    logger.info('🟢 Technical department processing task');
    context.set('technicalComplete', true);
    return { success: true };
  });
  
  bumbaHookSystem.registerHook('department:experience:task', async (context) => {
    logger.info('🟢 Experience department processing task');
    context.set('experienceComplete', true);
    return { success: true };
  });
  
  // Test department coordination
  const coordResult = await bumbaHookSystem.executeHook('department:coordinate', {
    departments: ['technical', 'experience', 'strategic'],
    task: 'Build new feature',
    coordination_type: 'collaborative'
  });
  
  logger.info('Coordination result:', coordResult.success ? 'Success' : 'Failed');
  
  // Broadcast to all departments
  const broadcastResult = await bumbaHookSystem.broadcastToAgents('new-sprint', {
    sprint: 'Sprint 42',
    goals: ['Enhanced hooks', 'Agent communication']
  }, { department: 'engineering' });
  
  logger.info('Broadcast result:', broadcastResult);
}

/**
 * Test learning hooks
 */
async function testLearningHooks() {
  logger.info('\n🟢 Testing Learning Hooks...\n');
  
  // Register learning hooks
  bumbaHookSystem.registerHook('learning:pattern', async (context) => {
    const { pattern, confidence } = context.data;
    logger.info(`🟢 Pattern detected: ${pattern.name || 'unknown'} (confidence: ${confidence})`);
    return { success: true };
  });
  
  bumbaHookSystem.registerHook('learning:insight', async (context) => {
    const { insight, type } = context.data;
    logger.info(`🟢 Insight generated: ${type} - ${insight.description || 'No description'}`);
    return { success: true };
  });
  
  // Simulate pattern detection
  await bumbaHookSystem.executeHook('learning:pattern', {
    pattern: { name: 'successful_handoff_pattern', occurrences: 15 },
    confidence: 0.89,
    type: 'success'
  });
  
  // Simulate insight generation
  await bumbaHookSystem.executeHook('learning:insight', {
    insight: { description: 'Agent handoffs work best with clear context' },
    confidence: 0.92,
    type: 'workflow_optimization'
  });
}

/**
 * Test hook metrics
 */
async function testHookMetrics() {
  logger.info('\n🟢 Testing Hook Metrics...\n');
  
  const status = bumbaHookSystem.getStatus();
  
  logger.info('🟢 Hook System Status:');
  logger.info(`  Total hooks: ${status.total_hooks}`);
  logger.info(`  Legacy hooks: ${status.legacy_hooks}`);
  logger.info(`  Enhanced hooks: ${status.enhanced_hooks}`);
  logger.info(`  Chains: ${status.chains.join(', ')}`);
  logger.info(`  Cache entries: ${status.cache_entries}`);
  
  logger.info('\n🟢 Hook Metrics:');
  Object.entries(status.metrics).forEach(([hook, metrics]) => {
    logger.info(`  ${hook}:`);
    logger.info(`    - Executions: ${metrics.executions}`);
    logger.info(`    - Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    logger.info(`    - Avg Duration: ${metrics.avgDuration.toFixed(0)}ms`);
  });
}

/**
 * Main test runner
 */
async function runTests() {
  logger.info('🟢 Starting Enhanced Hook System Tests\n');
  
  try {
    await testAgentCommunication();
    await testHookChaining();
    await testDepartmentCoordination();
    await testLearningHooks();
    await testHookMetrics();
    
    logger.info('\n🏁 All tests completed successfully!');
  } catch (error) {
    logger.error('🔴 Test failed:', error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testAgentCommunication,
  testHookChaining,
  testDepartmentCoordination,
  testLearningHooks,
  testHookMetrics
};