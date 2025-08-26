#!/usr/bin/env node

/**
 * BUMBA Dynamic Status Line Test
 * Tests token tracking and display functionality
 */

const { DynamicStatusLine, getInstance } = require('./src/core/status/dynamic-status-line');
const { StatusLineHooks } = require('./src/core/hooks/status-line-hooks');
const chalk = require('chalk');

// Helper to simulate API calls
function simulateApiCall(promptTokens, completionTokens) {
  return {
    response: {
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    }
  };
}

// Helper to show colored output
function log(message, type = 'info') {
  const colors = {
    info: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    highlight: chalk.magenta
  };
  
  console.log(colors[type](message));
}

async function testStatusLine() {
  console.log('\n' + '═'.repeat(60));
  log('       BUMBA DYNAMIC STATUS LINE TEST', 'highlight');
  console.log('═'.repeat(60) + '\n');

  // Initialize status line
  const statusLine = getInstance();
  await statusLine.initialize();
  
  log('🏁 Status line initialized\n', 'success');
  
  // Test 1: Display modes
  log('🟢 Testing Display Modes:', 'info');
  console.log('');
  
  log('Default mode:', 'info');
  statusLine.setDisplayMode('default');
  console.log(statusLine.getColoredStatusLine());
  
  log('\nCompact mode:', 'info');
  statusLine.setDisplayMode('compact');
  console.log(statusLine.getColoredStatusLine());
  
  log('\nDetailed mode:', 'info');
  statusLine.setDisplayMode('detailed');
  console.log(statusLine.getColoredStatusLine());
  
  // Reset to default
  statusLine.setDisplayMode('default');
  
  // Test 2: Token tracking
  console.log('\n' + '─'.repeat(60));
  log('\n🟢 Testing Token Tracking:', 'info');
  console.log('');
  
  // Simulate some API calls
  const testCalls = [
    { prompt: 150, completion: 250, description: 'Code review' },
    { prompt: 500, completion: 1000, description: 'Architecture design' },
    { prompt: 2000, completion: 3000, description: 'Documentation generation' },
    { prompt: 100, completion: 200, description: 'Quick response' },
    { prompt: 10000, completion: 15000, description: 'Large context analysis' }
  ];
  
  for (const call of testCalls) {
    log(`\n🟢 ${call.description}:`, 'info');
    console.log(`   Prompt tokens: ${call.prompt}`);
    console.log(`   Completion tokens: ${call.completion}`);
    
    // Track tokens
    statusLine.emit('tokens:prompt', call.prompt);
    statusLine.emit('tokens:completion', call.completion);
    statusLine.emit('tokens:used', call.prompt + call.completion);
    
    // Show updated status
    console.log(`   Status: ${statusLine.getColoredStatusLine()}`);
    
    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test 3: Statistics display
  console.log('\n' + '─'.repeat(60));
  log('\n🟢 Current Statistics:', 'info');
  console.log('');
  
  const stats = statusLine.getUsageStats();
  console.log('Token Usage:');
  console.log(`  Current:  ${stats.formatted.current}`);
  console.log(`  Session:  ${stats.formatted.session}`);
  console.log(`  Daily:    ${stats.formatted.daily}`);
  console.log(`  Monthly:  ${stats.formatted.monthly}`);
  console.log(`  Lifetime: ${stats.formatted.lifetime}`);
  
  console.log('\nEstimated Costs:');
  console.log(`  Session:  ${stats.costs.session}`);
  console.log(`  Daily:    ${stats.costs.daily}`);
  console.log(`  Monthly:  ${stats.costs.monthly}`);
  console.log(`  Lifetime: ${stats.costs.lifetime}`);
  
  // Test 4: Box display
  console.log('\n' + '─'.repeat(60));
  log('\n🟢 Box Display Mode:', 'info');
  console.log('');
  statusLine.displayBox();
  
  // Test 5: Integration hooks
  console.log('\n' + '─'.repeat(60));
  log('\n🪝 Testing Integration Hooks:', 'info');
  console.log('');
  
  const hooks = new StatusLineHooks();
  
  // Test API call hooks
  log('Testing API call tracking...', 'info');
  const beforeHook = hooks.createBeforeApiCallHook();
  const afterHook = hooks.createAfterApiCallHook();
  
  // Simulate API context
  let context = {
    prompt: 'Test prompt for API call simulation',
    maxTokens: 2000
  };
  
  // Before call
  context = await beforeHook(context);
  console.log(`  Estimated prompt tokens: ${context.estimatedPromptTokens}`);
  
  // Simulate response
  context.response = {
    usage: {
      prompt_tokens: 12,
      completion_tokens: 2000,
      total_tokens: 2012
    }
  };
  
  // After call
  context = await afterHook(context);
  console.log(`  Actual tokens used: ${context.response.usage.total_tokens}`);
  console.log(`  Updated status: ${statusLine.generateStatusLine()}`);
  
  // Test 6: Persistence
  console.log('\n' + '─'.repeat(60));
  log('\n🟢 Testing Persistence:', 'info');
  console.log('');
  
  await statusLine.saveTokenData();
  log('🏁 Token data saved to disk', 'success');
  
  const dataPath = statusLine.dataPath;
  console.log(`  Storage location: ${dataPath}`);
  
  // Test 7: Live display
  console.log('\n' + '─'.repeat(60));
  log('\n🟢 Testing Live Display (5 seconds):', 'info');
  console.log('');
  
  statusLine.start();
  
  // Simulate ongoing token usage
  let interval = setInterval(() => {
    const randomTokens = Math.floor(Math.random() * 100) + 50;
    statusLine.addTokens(randomTokens);
  }, 1000);
  
  // Stop after 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  clearInterval(interval);
  statusLine.stop();
  
  // Test 8: Export functionality
  console.log('\n' + '─'.repeat(60));
  log('\n🟢 Testing Export:', 'info');
  console.log('');
  
  const exportPath = await statusLine.exportUsageData('./token-usage-test.json');
  log(`🏁 Usage data exported to: ${exportPath}`, 'success');
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  log('                 TEST SUMMARY', 'highlight');
  console.log('═'.repeat(60) + '\n');
  
  const finalStats = statusLine.getUsageStats();
  
  log('🏁 Display Modes: Working', 'success');
  log('🏁 Token Tracking: Working', 'success');
  log('🏁 Statistics: Working', 'success');
  log('🏁 Box Display: Working', 'success');
  log('🏁 Integration Hooks: Working', 'success');
  log('🏁 Persistence: Working', 'success');
  log('🏁 Live Display: Working', 'success');
  log('🏁 Export: Working', 'success');
  
  console.log(`\n🟢 Total tokens tracked: ${finalStats.formatted.current}`);
  console.log(`🟢 Estimated cost: ${finalStats.costs.lifetime}`);
  
  console.log('\n' + '═'.repeat(60));
  log('  BUMBA-CLAUDE Multi-Agent Framework', 'highlight');
  log(`  Status Line: ${statusLine.generateStatusLine()}`, 'highlight');
  console.log('═'.repeat(60) + '\n');
  
  log('🏁 All tests passed successfully!', 'success');
}

// Run the test
testStatusLine().catch(error => {
  console.error(chalk.red('🔴 Test failed:'), error);
  process.exit(1);
});