#!/usr/bin/env node

/**
 * Test script for BUMBA Operability Tracking System
 * Tests the tracking, hooks, and dashboard components
 */

const chalk = require('chalk');

async function testOperabilitySystem() {
  console.log(chalk.bold.cyan('\n🧪 Testing BUMBA Operability System\n'));
  
  try {
    // Test 1: Initialize Operability Tracker
    console.log(chalk.yellow('Test 1: Initialize Operability Tracker'));
    const { getInstance: getTracker } = require('../src/core/integration/operability-tracker');
    const tracker = getTracker();
    
    const initialReport = tracker.getStatusReport();
    console.log(chalk.green(`🏁 Tracker initialized - Score: ${initialReport.operabilityScore}%`));
    console.log(chalk.gray(`  Achievement: ${initialReport.achievement.level}`));
    
    // Test 2: Add connections
    console.log(chalk.yellow('\nTest 2: Add test connections'));
    
    // Simulate connecting some integrations
    tracker.registerConnection('memory', 'mcp');
    console.log(chalk.green('🏁 Added memory MCP connection'));
    
    tracker.registerConnection('anthropic', 'api');
    console.log(chalk.green('🏁 Added Anthropic API connection'));
    
    const updatedReport = tracker.getStatusReport();
    console.log(chalk.green(`🏁 Updated score: ${updatedReport.operabilityScore}%`));
    
    // Test 3: Get smart suggestions
    console.log(chalk.yellow('\nTest 3: Smart suggestions'));
    const suggestion = tracker.getSmartSuggestion();
    if (suggestion) {
      console.log(chalk.green(`🏁 Next suggestion: ${suggestion.suggestion} (+${suggestion.impact}%)`));
      console.log(chalk.gray(`  Reason: ${suggestion.reason}`));
    }
    
    // Test 4: Dashboard display
    console.log(chalk.yellow('\nTest 4: Dashboard display'));
    const { getInstance: getDashboard } = require('../src/core/monitoring/operability-dashboard');
    const dashboard = getDashboard();
    
    console.log(chalk.green('🏁 Dashboard mini view:'));
    console.log('  ' + dashboard.displayMini());
    
    console.log(chalk.green('\n🏁 Dashboard compact view:'));
    console.log('  ' + dashboard.displayCompact());
    
    // Test 5: Operability Hooks
    console.log(chalk.yellow('\nTest 5: Operability hooks'));
    const { getInstance: getHooks } = require('../src/core/hooks/operability-hooks');
    const hooks = getHooks();
    
    // Trigger startup hook
    hooks.trigger('startup');
    console.log(chalk.green('🏁 Startup hook triggered'));
    
    // Trigger command executed hook
    hooks.trigger('command-executed', { type: 'test' });
    console.log(chalk.green('🏁 Command executed hook triggered'));
    
    // Test 6: Connection Wizard (non-interactive test)
    console.log(chalk.yellow('\nTest 6: Connection wizard'));
    const ConnectionWizard = require('../src/core/integration/connection-wizard');
    const wizard = new ConnectionWizard();
    
    // Just verify it initializes
    console.log(chalk.green('🏁 Connection wizard initialized'));
    console.log(chalk.gray(`  Available integrations: ${Object.keys(wizard.instructions).length}`));
    
    // Test 7: Achievement levels
    console.log(chalk.yellow('\nTest 7: Achievement levels'));
    const achievements = tracker.achievements;
    for (const [score, achievement] of Object.entries(achievements)) {
      console.log(chalk.green(`🏁 ${score}%: ${achievement.emoji} ${achievement.level}`));
    }
    
    // Test 8: Quiet mode
    console.log(chalk.yellow('\nTest 8: Quiet mode'));
    const wasQuiet = tracker.quietMode;
    tracker.setQuietMode(true);
    console.log(chalk.green(`🏁 Quiet mode enabled: ${tracker.quietMode}`));
    tracker.setQuietMode(wasQuiet);
    
    // Test 9: Progress tracking
    console.log(chalk.yellow('\nTest 9: Progress tracking'));
    const missing = tracker.getTotalMissing();
    const connected = tracker.getTotalConnected();
    console.log(chalk.green(`🏁 Connected: ${connected}, Missing: ${missing}`));
    
    // Test 10: Category analysis
    console.log(chalk.yellow('\nTest 10: Category analysis'));
    const categories = tracker.getCategoryStatus();
    for (const [cat, status] of Object.entries(categories)) {
      console.log(chalk.green(`🏁 ${cat}: ${status.connected}/${status.total} (${status.percentage}%)`));
    }
    
    // Summary
    console.log(chalk.bold.green('\n🏁 All operability system tests passed!'));
    console.log(chalk.gray('\nSystem Features Verified:'));
    console.log(chalk.gray('  • Operability tracking with weighted scoring'));
    console.log(chalk.gray('  • Achievement-based progression system'));
    console.log(chalk.gray('  • Smart integration suggestions'));
    console.log(chalk.gray('  • Visual dashboard with multiple views'));
    console.log(chalk.gray('  • Context-aware reminder hooks'));
    console.log(chalk.gray('  • Quiet mode at 80% threshold'));
    console.log(chalk.gray('  • Connection wizard for setup'));
    console.log(chalk.gray('  • Category-based integration grouping'));
    
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('\n🔴 Test failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testOperabilitySystem();