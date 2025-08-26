#!/usr/bin/env node

/**
 * Quick verification that hooks are integrated into framework
 */

console.log('\n=== HOOK INTEGRATION VERIFICATION ===\n');

// Check command handler
try {
  const commandHandlerSource = require('fs').readFileSync(
    './src/core/command-handler.js', 'utf8'
  );
  const hasCommandHooks = commandHandlerSource.includes('getUniversalHooks') && 
                          commandHandlerSource.includes("hooks.trigger('command:pre-validate'");
  console.log(`🏁 Command Handler: ${hasCommandHooks ? 'INTEGRATED' : 'NOT INTEGRATED'}`);
} catch (e) {
  console.log('🔴 Command Handler: ERROR', e.message);
}

// Check department manager
try {
  const deptSource = require('fs').readFileSync(
    './src/core/departments/product-strategist-manager.js', 'utf8'
  );
  const hasDeptHooks = deptSource.includes('getUniversalHooks') && 
                       deptSource.includes("hooks.trigger('department:entering'");
  console.log(`🏁 Department Manager: ${hasDeptHooks ? 'INTEGRATED' : 'NOT INTEGRATED'}`);
} catch (e) {
  console.log('🔴 Department Manager: ERROR', e.message);
}

// Check learning engine
try {
  const learningSource = require('fs').readFileSync(
    './src/core/learning/optimization-engine.js', 'utf8'
  );
  const hasLearningHooks = learningSource.includes('getUniversalHooks') && 
                          learningSource.includes("hooks.trigger('learning:insight-generated'");
  console.log(`🏁 Learning Engine: ${hasLearningHooks ? 'INTEGRATED' : 'NOT INTEGRATED'}`);
} catch (e) {
  console.log('🔴 Learning Engine: ERROR', e.message);
}

// Check error handler
try {
  const errorSource = require('fs').readFileSync(
    './src/core/error-handling/global-error-boundary.js', 'utf8'
  );
  const hasErrorHooks = errorSource.includes('getUniversalHooks') && 
                        errorSource.includes("hooks.trigger('error:pattern-detected'");
  console.log(`🏁 Error Handler: ${hasErrorHooks ? 'INTEGRATED' : 'NOT INTEGRATED'}`);
} catch (e) {
  console.log('🔴 Error Handler: ERROR', e.message);
}

// Check MCP services
try {
  const mcpSource = require('fs').readFileSync(
    './src/core/mcp/mcp-resilience-system.js', 'utf8'
  );
  const hasMCPHooks = mcpSource.includes('getUniversalHooks') && 
                      mcpSource.includes("hooks.trigger('mcp:connection-degraded'");
  console.log(`🏁 MCP Services: ${hasMCPHooks ? 'INTEGRATED' : 'NOT INTEGRATED'}`);
} catch (e) {
  console.log('🔴 MCP Services: ERROR', e.message);
}

// Check hook system exists
try {
  const { getInstance } = require('../src/core/hooks/bumba-universal-hook-system');
  const hooks = getInstance();
  const stats = hooks.getStatistics();
  console.log(`\n🟢 Hook System Stats:`);
  console.log(`   Total Hooks: ${stats.totalHooks}`);
  console.log(`   Categories: ${Object.keys(stats.categories).length}`);
  console.log(`   Ready: YES`);
} catch (e) {
  console.log('\n🔴 Hook System: ERROR', e.message);
}

console.log('\n=== VERIFICATION COMPLETE ===\n');