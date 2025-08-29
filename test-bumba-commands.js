#!/usr/bin/env node

/**
 * BUMBA Command Test Suite
 * Tests all /bumba: commands to ensure they work properly
 */

const chalk = require('chalk');
const { bumbaCommand } = require('./src/core/bumba-claude-integration');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Color helpers
const success = chalk.green;
const error = chalk.red;
const info = chalk.blue;
const warn = chalk.yellow;

/**
 * Test a single command
 */
async function testCommand(command, description) {
  console.log(info(`\nTesting: ${description}`));
  console.log(chalk.gray(`Command: ${command}`));
  
  try {
    const result = await bumbaCommand(command);
    
    if (result.success !== false) {
      console.log(success('✅ PASSED'));
      results.passed++;
      
      // Show some result details
      if (result.message) {
        console.log(chalk.gray(`  Message: ${result.message}`));
      }
      if (result.type) {
        console.log(chalk.gray(`  Type: ${result.type}`));
      }
      if (result.action) {
        console.log(chalk.gray(`  Action: ${result.action}`));
      }
    } else {
      console.log(error('❌ FAILED'));
      console.log(error(`  Error: ${result.error}`));
      results.failed++;
      results.errors.push({ command, error: result.error });
    }
    
    return result;
  } catch (err) {
    console.log(error('❌ ERROR'));
    console.log(error(`  ${err.message}`));
    results.failed++;
    results.errors.push({ command, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(chalk.yellow('\n' + '='.repeat(60)));
  console.log(chalk.yellow.bold('🏁 BUMBA Command Test Suite'));
  console.log(chalk.yellow('='.repeat(60)));

  // Test system commands
  console.log(chalk.cyan('\n📋 System Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:menu', 'Show command menu');
  await testCommand('/bumba:help', 'Show general help');
  await testCommand('/bumba:help implement', 'Show command-specific help');
  await testCommand('/bumba:settings', 'Show settings');
  await testCommand('/bumba:status', 'Show status');

  // Test product strategy commands
  console.log(chalk.cyan('\n🟡 Product Strategy Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:prd user onboarding', 'Create PRD');
  await testCommand('/bumba:requirements mobile app', 'Gather requirements');
  await testCommand('/bumba:roadmap Q1', 'Create roadmap');
  await testCommand('/bumba:research-market SaaS', 'Market research');
  await testCommand('/bumba:analyze-business growth', 'Business analysis');

  // Test design commands
  console.log(chalk.cyan('\n🔴 Design Engineering Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:design dashboard', 'Create design');
  await testCommand('/bumba:ui Button react', 'Create UI component');
  await testCommand('/bumba:figma sync', 'Figma integration');
  await testCommand('/bumba:analyze-ux homepage', 'UX analysis');

  // Test backend commands
  console.log(chalk.cyan('\n🟢 Backend Engineering Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:api users CRUD', 'Create API');
  await testCommand('/bumba:secure application', 'Security audit');
  await testCommand('/bumba:database postgresql', 'Database setup');
  await testCommand('/bumba:devops production', 'DevOps setup');

  // Test collaboration commands
  console.log(chalk.cyan('\n🤝 Collaboration Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:implement-agents payment system', 'Multi-agent collaboration');
  await testCommand('/bumba:team coordinate', 'Team coordination');

  // Test core implementation commands
  console.log(chalk.cyan('\n⚡ Core Implementation Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:implement user authentication', 'Smart implementation');
  await testCommand('/bumba:analyze security', 'Analysis');
  await testCommand('/bumba:test unit', 'Testing');

  // Test consciousness commands
  console.log(chalk.cyan('\n✨ Consciousness Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:conscious-analyze', 'Consciousness analysis');

  // Test lite mode commands
  console.log(chalk.cyan('\n🚀 Lite Mode Commands'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:lite hello world', 'Lite mode development');
  await testCommand('/bumba:lite-analyze', 'Lite analysis');
  await testCommand('/bumba:lite-implement feature', 'Lite implementation');

  // Test error handling
  console.log(chalk.cyan('\n⚠️ Error Handling'));
  console.log(chalk.gray('-'.repeat(40)));
  await testCommand('/bumba:invalid-command', 'Invalid command handling');
  await testCommand('bumba:menu', 'Missing slash handling');
  await testCommand('/menu', 'Missing prefix handling');
  await testCommand('', 'Empty command handling');

  // Show results
  console.log(chalk.yellow('\n' + '='.repeat(60)));
  console.log(chalk.yellow.bold('📊 Test Results'));
  console.log(chalk.yellow('='.repeat(60)));
  console.log(success(`✅ Passed: ${results.passed}`));
  console.log(error(`❌ Failed: ${results.failed}`));
  console.log(info(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`));

  if (results.errors.length > 0) {
    console.log(chalk.red('\n❌ Errors:'));
    results.errors.forEach(err => {
      console.log(chalk.red(`  • ${err.command}: ${err.error}`));
    });
  }

  console.log(chalk.yellow('\n' + '='.repeat(60)));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(err => {
    console.error(error('Fatal error:'), err);
    process.exit(1);
  });
}

module.exports = { testCommand, runTests };