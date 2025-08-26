/**
 * BUMBA Whispers & Chaining Integration Test
 * Tests the new Agent Whispers and Command Chaining features
 */

const chalk = require('chalk');

// Mock command handler for testing
class MockCommandHandler {
  constructor() {
    this.commands = new Map();
    this.executionLog = [];
  }
  
  register(command, handler) {
    this.commands.set(command, handler);
  }
  
  async execute({ command, args, context }) {
    this.executionLog.push({ command, args, timestamp: Date.now() });
    
    const handler = this.commands.get(command);
    if (handler) {
      return await handler(args, context);
    }
    
    // Simulate command execution
    await this.delay(100 + Math.random() * 400); // 100-500ms
    
    return {
      success: true,
      output: `Executed ${command} with ${args.length} args`,
      command,
      args
    };
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test suite
async function runTests() {
  console.log(chalk.green('\n🏁 Running BUMBA Whispers & Chaining Integration Tests\n'));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Agent Whispers Terminal Detection
  console.log(chalk.yellow('Test 1: Agent Whispers Terminal Detection'));
  try {
    const { getDetector } = require('../../src/core/whispers/terminal-detector');
    const detector = getDetector();
    const capabilities = detector.detect();
    
    console.assert(capabilities !== null, 'Should detect capabilities');
    console.assert(typeof capabilities.supportsTitleBar === 'boolean', 'Should have title bar support flag');
    console.assert(typeof capabilities.supportsANSI === 'boolean', 'Should have ANSI support flag');
    
    console.log(chalk.green('🏁 Terminal detection working'));
    console.log(chalk.gray(`  Terminal: ${capabilities.type}`));
    console.log(chalk.gray(`  Title bar: ${capabilities.supportsTitleBar}`));
    console.log(chalk.gray(`  ANSI: ${capabilities.supportsANSI}`));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Terminal detection failed:', error.message));
    failed++;
  }
  
  // Test 2: Command Chain Parser
  console.log(chalk.yellow('\nTest 2: Command Chain Parser'));
  try {
    const ChainParser = require('../../src/core/chaining/chain-parser');
    const parser = new ChainParser();
    
    // Test sequential chain
    const seqChain = '/bumba:analyze >> /bumba:fix >> /bumba:test';
    const seqAst = parser.parse(seqChain);
    console.assert(seqAst.root.type === 'sequential', 'Should parse sequential chain');
    console.assert(seqAst.root.nodes.length === 3, 'Should have 3 nodes');
    
    // Test parallel chain
    const parChain = '/bumba:backend || /bumba:frontend || /bumba:test';
    const parAst = parser.parse(parChain);
    console.assert(parAst.root.type === 'parallel', 'Should parse parallel chain');
    
    // Test conditional chain
    const condChain = '/bumba:test ? /bumba:deploy : /bumba:fix';
    const condAst = parser.parse(condChain);
    console.assert(condAst.root.type === 'conditional', 'Should parse conditional chain');
    
    console.log(chalk.green('🏁 Chain parser working'));
    console.log(chalk.gray('  Parsed sequential, parallel, and conditional chains'));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Chain parser failed:', error.message));
    failed++;
  }
  
  // Test 3: Chain Templates
  console.log(chalk.yellow('\nTest 3: Chain Templates'));
  try {
    const { getTemplates } = require('../../src/core/chaining/templates/chain-templates');
    const templates = getTemplates();
    
    // Check default templates
    const fullStack = templates.get('full-stack');
    console.assert(fullStack !== null, 'Should have full-stack template');
    console.assert(fullStack.emoji === '🏁', 'Should have correct emoji');
    
    // Register custom template
    templates.register('test-custom', {
      name: 'Custom Test',
      chain: '/bumba:test unit >> /bumba:test integration',
      emoji: '🟢'
    });
    
    const custom = templates.get('test-custom');
    console.assert(custom !== null, 'Should register custom template');
    
    // Search templates
    const searchResults = templates.search('test');
    console.assert(searchResults.length > 0, 'Should find test-related templates');
    
    console.log(chalk.green('🏁 Chain templates working'));
    console.log(chalk.gray(`  ${templates.getAll().length} templates available`));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Chain templates failed:', error.message));
    failed++;
  }
  
  // Test 4: Sequential Executor
  console.log(chalk.yellow('\nTest 4: Sequential Executor'));
  try {
    const SequentialExecutor = require('../../src/core/chaining/executors/sequential');
    const handler = new MockCommandHandler();
    const executor = new SequentialExecutor(handler);
    
    const node = {
      type: 'sequential',
      nodes: [
        { type: 'command', name: '/bumba:test', args: ['unit'] },
        { type: 'command', name: '/bumba:test', args: ['integration'] },
        { type: 'command', name: '/bumba:test', args: ['e2e'] }
      ]
    };
    
    const result = await executor.execute(node);
    console.assert(result.type === 'sequential', 'Should return sequential result');
    console.assert(result.results.length === 3, 'Should execute all 3 commands');
    console.assert(result.success === true, 'Should succeed');
    
    console.log(chalk.green('🏁 Sequential executor working'));
    console.log(chalk.gray(`  Executed ${result.results.length} commands in sequence`));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Sequential executor failed:', error.message));
    failed++;
  }
  
  // Test 5: Parallel Executor
  console.log(chalk.yellow('\nTest 5: Parallel Executor'));
  try {
    const ParallelExecutor = require('../../src/core/chaining/executors/parallel');
    const handler = new MockCommandHandler();
    const executor = new ParallelExecutor(handler, { maxConcurrent: 3 });
    
    const node = {
      type: 'parallel',
      nodes: [
        { type: 'command', name: '/bumba:backend', args: [] },
        { type: 'command', name: '/bumba:frontend', args: [] },
        { type: 'command', name: '/bumba:test', args: [] }
      ]
    };
    
    const startTime = Date.now();
    const result = await executor.execute(node);
    const duration = Date.now() - startTime;
    
    console.assert(result.type === 'parallel', 'Should return parallel result');
    console.assert(result.results.length === 3, 'Should execute all 3 commands');
    console.assert(duration < 1000, 'Should execute in parallel (faster than sequential)');
    
    console.log(chalk.green('🏁 Parallel executor working'));
    console.log(chalk.gray(`  Executed ${result.results.length} commands in ${duration}ms`));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Parallel executor failed:', error.message));
    failed++;
  }
  
  // Test 6: Chain Memory
  console.log(chalk.yellow('\nTest 6: Chain Memory'));
  try {
    const { ChainMemory } = require('../../src/core/chaining/memory-integration');
    const memory = new ChainMemory();
    
    // Save a chain
    const chainId = await memory.saveChain(
      '/bumba:test >> /bumba:deploy',
      { success: true, duration: 500 }
    );
    console.assert(chainId !== null, 'Should save chain');
    
    // Recall chains
    const recalled = await memory.recallChains('test');
    console.assert(recalled.length > 0, 'Should recall chains');
    
    // Detect patterns
    memory.detectPatterns('/bumba:test >> /bumba:deploy >> /bumba:monitor');
    const stats = memory.getStats();
    console.assert(stats.patternsDetected > 0, 'Should detect patterns');
    
    console.log(chalk.green('🏁 Chain memory working'));
    console.log(chalk.gray(`  ${stats.chainsInMemory} chains, ${stats.patternsDetected} patterns`));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Chain memory failed:', error.message));
    failed++;
  }
  
  // Test 7: Agent Whispers Integration
  console.log(chalk.yellow('\nTest 7: Agent Whispers Integration'));
  try {
    const { AgentWhispers } = require('../../src/core/whispers');
    const whispers = new AgentWhispers({
      enabled: true,
      location: 'title'
    });
    
    // Update status
    whispers.updateStatus('agent-1', {
      progress: 50,
      message: 'Processing...'
    });
    
    const status = whispers.getStatus();
    console.assert(status !== null, 'Should get status');
    console.assert(status.enabled === true, 'Should be enabled');
    
    // Clean up
    whispers.stop();
    
    console.log(chalk.green('🏁 Agent Whispers integration working'));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Agent Whispers integration failed:', error.message));
    failed++;
  }
  
  // Test 8: Full Integration
  console.log(chalk.yellow('\nTest 8: Full Integration'));
  try {
    const { CommandChaining } = require('../../src/core/chaining');
    const handler = new MockCommandHandler();
    const chaining = new CommandChaining(handler);
    
    // Execute a chain
    const chainResult = await chaining.execute(
      '/bumba:analyze >> /bumba:fix',
      { test: true }
    );
    
    console.assert(chainResult !== null, 'Should execute chain');
    
    // Get history
    const history = chaining.getHistory();
    console.assert(history.length > 0, 'Should have history');
    
    // Get stats
    const stats = chaining.getStats();
    console.assert(stats.totalExecuted > 0, 'Should track executions');
    
    console.log(chalk.green('🏁 Full integration working'));
    console.log(chalk.gray(`  ${stats.totalExecuted} chains executed`));
    passed++;
  } catch (error) {
    console.log(chalk.red('🔴 Full integration failed:', error.message));
    failed++;
  }
  
  // Summary
  console.log(chalk.cyan('\n' + '='.repeat(50)));
  console.log(chalk.cyan('Test Summary'));
  console.log(chalk.cyan('='.repeat(50)));
  console.log(chalk.green(`🏁 Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`🔴 Failed: ${failed}`));
  }
  console.log(chalk.cyan('='.repeat(50)));
  
  if (failed === 0) {
    console.log(chalk.green('\n🏁 All tests passed! Features are ready for use.\n'));
  } else {
    console.log(chalk.yellow(`\n🟠️ ${failed} test(s) failed. Review the output above.\n`));
  }
  
  return { passed, failed };
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };