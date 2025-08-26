#!/usr/bin/env node

/**
 * BUMBA Integrated Hooks Test
 * Demonstrates hooks actually working within the framework
 */

const { BumbaCommandHandler } = require('../src/core/command-handler');
const { getInstance: getUniversalHooks } = require('../src/core/hooks/bumba-universal-hook-system');
const { GlobalErrorBoundary } = require('../src/core/error-handling/global-error-boundary');
const { logger } = require('../src/core/logging/bumba-logger');

async function testIntegratedHooks() {
  console.log('\n' + '='.repeat(60));
  console.log('BUMBA INTEGRATED HOOKS TEST');
  console.log('Testing hooks in real framework components');
  console.log('='.repeat(60) + '\n');
  
  const hooks = getUniversalHooks();
  const results = {
    command: false,
    error: false,
    learning: false,
    department: false,
    mcp: false
  };
  
  // ========================================
  // 1. Register test handlers to verify hooks fire
  // ========================================
  console.log('🟢 Registering Test Handlers...\n');
  
  // Command hooks
  hooks.registerHandler('command:pre-validate', 'TestValidator', async (data) => {
    console.log(`  🏁 Command pre-validation hook fired: ${data.command}`);
    results.command = true;
    return { validated: true };
  });
  
  hooks.registerHandler('command:post-execute', 'TestMetrics', async (data) => {
    console.log(`  🏁 Command post-execution hook fired: ${data.duration}ms`);
    return { collected: true };
  });
  
  // Error hooks
  hooks.registerHandler('error:pattern-detected', 'TestErrorAnalyzer', async (data) => {
    console.log(`  🏁 Error pattern hook fired: ${data.pattern.type}`);
    results.error = true;
    return { analyzed: true };
  });
  
  // Learning hooks
  hooks.registerHandler('learning:insight-generated', 'TestLearning', async (data) => {
    console.log(`  🏁 Learning insight hook fired from ${data.source}`);
    results.learning = true;
    return { captured: true };
  });
  
  // Department hooks
  hooks.registerHandler('department:entering', 'TestDepartment', async (data) => {
    console.log(`  🏁 Department entry hook fired: ${data.department}`);
    results.department = true;
    return { entered: true };
  });
  
  // MCP hooks
  hooks.registerHandler('mcp:connection-degraded', 'TestMCP', async (data) => {
    console.log(`  🏁 MCP degradation hook fired: ${data.service}`);
    results.mcp = true;
    return { handled: true };
  });
  
  console.log('🏁 Test handlers registered\n');
  
  // ========================================
  // 2. Test Command Handler Integration
  // ========================================
  console.log('🟢 Testing Command Handler Integration...\n');
  
  try {
    const commandHandler = new BumbaCommandHandler();
    
    // This should trigger command:pre-validate and command:post-execute
    await commandHandler.handleCommand('status', [], {});
    
    console.log('  Command executed successfully\n');
  } catch (error) {
    console.log('  Command test error:', error.message, '\n');
  }
  
  // ========================================
  // 3. Test Error Handler Integration
  // ========================================
  console.log('🔴 Testing Error Handler Integration...\n');
  
  try {
    const errorBoundary = new GlobalErrorBoundary();
    
    // Create multiple errors to trigger pattern detection
    for (let i = 0; i < 4; i++) {
      const testError = new Error('Test database connection failed');
      testError.code = 'DB_CONNECTION_ERROR';
      await errorBoundary.handleError(testError, { category: 'database' });
    }
    
    console.log('  Error pattern detection tested\n');
  } catch (error) {
    console.log('  Error handler test failed:', error.message, '\n');
  }
  
  // ========================================
  // 4. Test Department Manager Integration
  // ========================================
  console.log('🟢 Testing Department Manager Integration...\n');
  
  try {
    const ProductStrategistManager = require('../src/core/departments/product-strategist-manager');
    const productStrategist = new ProductStrategistManager();
    
    // This should trigger department:entering
    await productStrategist.executeTask('analyze', ['market'], {});
    
    console.log('  Department task executed\n');
  } catch (error) {
    console.log('  Department test error:', error.message, '\n');
  }
  
  // ========================================
  // 5. Test Learning Engine Integration
  // ========================================
  console.log('🟢 Testing Learning Engine Integration...\n');
  
  try {
    const { LearningOptimizationEngine } = require('../src/core/learning/optimization-engine');
    const learningEngine = new LearningOptimizationEngine();
    
    // This should trigger learning:insight-generated
    const executionData = {
      adaptation_opportunities: [{
        type: 'performance',
        improvement: 0.25,
        strategy: 'cache_optimization'
      }]
    };
    
    await learningEngine.extractLearningInsights(executionData);
    
    console.log('  Learning engine tested\n');
  } catch (error) {
    console.log('  Learning engine test error:', error.message, '\n');
  }
  
  // ========================================
  // 6. Test MCP Integration
  // ========================================
  console.log('🟢 Testing MCP Integration...\n');
  
  try {
    const { MCPServerManager } = require('../src/core/mcp/mcp-resilience-system');
    const mcpManager = new MCPServerManager();
    
    // Try to connect to a non-existent server to trigger degradation
    try {
      await mcpManager.attemptConnection('test-server', {
        name: 'test-server',
        fallback: 'local-test'
      });
    } catch (error) {
      // Expected to fail and trigger hook
      console.log('  MCP connection test completed (expected failure)\n');
    }
  } catch (error) {
    console.log('  MCP test error:', error.message, '\n');
  }
  
  // ========================================
  // 7. Show Results
  // ========================================
  console.log('🟢 Integration Test Results:\n');
  console.log('  Hook Integration Status:');
  console.log(`    Command Handler:  ${results.command ? '🏁 WORKING' : '🔴 NOT FIRING'}`);
  console.log(`    Error Handler:    ${results.error ? '🏁 WORKING' : '🔴 NOT FIRING'}`);
  console.log(`    Learning Engine:  ${results.learning ? '🏁 WORKING' : '🔴 NOT FIRING'}`);
  console.log(`    Department Mgr:   ${results.department ? '🏁 WORKING' : '🔴 NOT FIRING'}`);
  console.log(`    MCP Services:     ${results.mcp ? '🏁 WORKING' : '🔴 NOT FIRING'}`);
  
  const totalWorking = Object.values(results).filter(v => v).length;
  const totalTests = Object.keys(results).length;
  const passRate = (totalWorking / totalTests * 100).toFixed(0);
  
  console.log(`\n  Overall: ${totalWorking}/${totalTests} integrations working (${passRate}%)`);
  
  // ========================================
  // 8. Hook Statistics
  // ========================================
  console.log('\n🟢 Hook System Statistics:\n');
  
  const stats = hooks.getStatistics();
  console.log(`  Total Hooks: ${stats.totalHooks}`);
  console.log(`  Total Handlers: ${stats.totalHandlers}`);
  console.log(`  Circuit Breakers: ${stats.circuitBreakers.closed} closed, ${stats.circuitBreakers.open} open`);
  
  // Get metrics for specific hooks
  const commandMetrics = hooks.getHookMetrics('command:pre-validate');
  if (commandMetrics) {
    console.log(`\n  Command Hook Metrics:`);
    console.log(`    Executions: ${commandMetrics.metrics.executions}`);
    console.log(`    Success Rate: ${commandMetrics.metrics.successes}/${commandMetrics.metrics.executions}`);
    console.log(`    Avg Duration: ${commandMetrics.metrics.averageDuration?.toFixed(2) || 0}ms`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (passRate === '100') {
    console.log('🏁 SUCCESS! All hooks are properly integrated!');
    console.log('The Universal Hook System is fully operational!');
  } else if (passRate >= '60') {
    console.log('🟡 PARTIAL SUCCESS - Most hooks are working');
    console.log('Check the failed integrations above');
  } else {
    console.log('🔴 INTEGRATION ISSUES - Many hooks not firing');
    console.log('Review the integration code for the failed components');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run the test
testIntegratedHooks().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});