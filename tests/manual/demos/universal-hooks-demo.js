#!/usr/bin/env node

/**
 * BUMBA Universal Hook System Demonstration
 * Shows the power of the comprehensive hook system
 */

const { getInstance: getUniversalHooks } = require('../src/core/hooks/bumba-universal-hook-system');
const { getInstance: getIntegrationHelper } = require('../src/core/hooks/hook-integration-helper');

async function demonstrateUniversalHooks() {
  console.log('\n' + '='.repeat(60));
  console.log('BUMBA UNIVERSAL HOOK SYSTEM DEMONSTRATION');
  console.log('='.repeat(60) + '\n');
  
  const hooks = getUniversalHooks();
  const helper = getIntegrationHelper();
  
  // ========================================
  // 1. REGISTER CUSTOM HANDLERS
  // ========================================
  console.log('🟢 Registering Custom Hook Handlers...\n');
  
  // Command validation handler
  hooks.registerHandler('command:pre-validate', 'SecurityValidator', async (data) => {
    console.log(`  🟢 Validating command: ${data.command}`);
    // Simulate security check
    if (data.command.includes('delete') || data.command.includes('drop')) {
      console.log('    🟡 Dangerous command detected!');
    }
    return { validated: true };
  });
  
  // Performance monitoring handler
  hooks.registerHandler('command:post-execute', 'MetricsCollector', async (data) => {
    console.log(`  🟢 Collecting metrics: ${data.duration}ms execution time`);
    return { metrics_collected: true };
  });
  
  // Learning pattern handler
  hooks.registerHandler('learning:pattern-detected', 'OptimizationEngine', async (data) => {
    console.log(`  🟢 Pattern detected with ${(data.confidence * 100).toFixed(1)}% confidence`);
    console.log(`    Optimization opportunity: ${JSON.stringify(data.optimization_opportunity)}`);
    return { optimization_queued: true };
  });
  
  // Error pattern handler
  hooks.registerHandler('error:pattern-detected', 'SystemicAnalyzer', async (data) => {
    console.log(`  🟢 Analyzing error pattern: ${data.pattern.type || 'unknown'}`);
    console.log(`    Frequency: ${data.frequency}, Affected: ${data.affected_systems.join(', ')}`);
    return { analysis_complete: true };
  });
  
  // Department handoff handler
  hooks.registerHandler('department:context-handoff', 'ContextValidator', async (data) => {
    console.log(`  🟢 Handoff: ${data.from_department} → ${data.to_department}`);
    return { handoff_validated: true };
  });
  
  // Consciousness validation handler
  hooks.registerHandler('consciousness:ethical-concern', 'EthicalReviewer', async (data) => {
    console.log(`  🟢️ Ethical concern: ${data.concern}`);
    console.log(`    Severity: ${data.severity}, Alternatives: ${data.alternatives.length}`);
    return { review_complete: true };
  });
  
  // Resource warning handler
  hooks.registerHandler('resource:threshold-warning', 'ResourceOptimizer', async (data) => {
    console.log(`  🟡 Resource warning: ${data.resource}`);
    console.log(`    Usage: ${data.current_usage}/${data.threshold} (${data.trend} trend)`);
    return { optimization_triggered: true };
  });
  
  console.log('🏁 Registered 7 custom handlers\n');
  
  // ========================================
  // 2. SIMULATE COMMAND LIFECYCLE
  // ========================================
  console.log('🟢 Simulating Command Lifecycle...\n');
  
  // Trigger pre-validation
  await hooks.trigger('command:pre-validate', {
    command: 'delete-user',
    args: { userId: '123' },
    context: { source: 'api' },
    user: { role: 'admin' }
  });
  
  // Trigger post-execution
  await hooks.trigger('command:post-execute', {
    command: 'delete-user',
    result: { success: true },
    duration: 145,
    resources: { memory: process.memoryUsage(), cpu: process.cpuUsage() }
  });
  
  console.log();
  
  // ========================================
  // 3. SIMULATE LEARNING & OPTIMIZATION
  // ========================================
  console.log('🟢 Simulating Learning & Optimization...\n');
  
  // Trigger pattern detection
  await hooks.trigger('learning:pattern-detected', {
    pattern: { type: 'repeated_query', frequency: 10 },
    confidence: 0.85,
    optimization_opportunity: { cache: true, ttl: 3600 }
  });
  
  console.log();
  
  // ========================================
  // 4. SIMULATE ERROR HANDLING
  // ========================================
  console.log('🔴 Simulating Error Handling...\n');
  
  // Trigger error pattern
  await hooks.trigger('error:pattern-detected', {
    pattern: { type: 'connection_timeout' },
    frequency: 5,
    affected_systems: ['database', 'cache', 'api']
  });
  
  console.log();
  
  // ========================================
  // 5. SIMULATE DEPARTMENT COORDINATION
  // ========================================
  console.log('🟢 Simulating Department Coordination...\n');
  
  // Trigger context handoff
  await hooks.trigger('department:context-handoff', {
    from_department: 'Product-Strategist',
    to_department: 'Backend-Engineer',
    context: { task: 'implement-api', requirements: ['REST', 'GraphQL'] },
    requirements: { expertise: 'API design', priority: 'high' }
  });
  
  console.log();
  
  // ========================================
  // 6. SIMULATE CONSCIOUSNESS VALIDATION
  // ========================================
  console.log('🟢 Simulating Consciousness Validation...\n');
  
  // Trigger ethical concern
  await hooks.trigger('consciousness:ethical-concern', {
    concern: 'User data deletion without backup',
    context: { action: 'delete-user', permanent: true },
    severity: 'high',
    alternatives: ['soft-delete', 'archive', 'anonymize']
  });
  
  console.log();
  
  // ========================================
  // 7. SIMULATE RESOURCE MANAGEMENT
  // ========================================
  console.log('🟢 Simulating Resource Management...\n');
  
  // Trigger resource warning
  await hooks.trigger('resource:threshold-warning', {
    resource: 'memory',
    current_usage: 850,
    threshold: 1000,
    trend: 'increasing'
  });
  
  console.log();
  
  // ========================================
  // 8. DEMONSTRATE HOOK CHAINING
  // ========================================
  console.log('🟢 Demonstrating Hook Chaining...\n');
  
  // Register a hook with dependencies
  hooks.registerHook('workflow:complete', {
    category: 'workflow',
    priority: 80,
    dependencies: ['learning:pattern-detected', 'performance:sla-violation'],
    description: 'Workflow completion with dependencies'
  });
  
  hooks.registerHandler('workflow:complete', 'WorkflowManager', async (data) => {
    console.log('  🏁 Workflow completed after dependencies');
    return { workflow_status: 'complete' };
  });
  
  await hooks.trigger('workflow:complete', {
    workflow: 'data-processing',
    status: 'success'
  });
  
  console.log();
  
  // ========================================
  // 9. SHOW HOOK STATISTICS
  // ========================================
  console.log('🟢 Hook System Statistics:\n');
  
  const stats = hooks.getStatistics();
  console.log('  Total Hooks:', stats.totalHooks);
  console.log('  Total Handlers:', stats.totalHandlers);
  console.log('  Categories:');
  for (const [category, count] of Object.entries(stats.categories)) {
    if (count > 0) {
      console.log(`    - ${category}: ${count} hooks`);
    }
  }
  console.log('  Performance:');
  console.log(`    - Fast: ${stats.performance.fast} hooks`);
  console.log(`    - Normal: ${stats.performance.normal} hooks`);
  console.log(`    - Slow: ${stats.performance.slow} hooks`);
  console.log('  Circuit Breakers:');
  console.log(`    - Closed: ${stats.circuitBreakers.closed}`);
  console.log(`    - Open: ${stats.circuitBreakers.open}`);
  console.log(`    - Half-Open: ${stats.circuitBreakers.halfOpen}`);
  
  console.log();
  
  // ========================================
  // 10. DEMONSTRATE CIRCUIT BREAKER
  // ========================================
  console.log('🟢 Demonstrating Circuit Breaker...\n');
  
  // Register a failing handler
  hooks.registerHandler('test:circuit-breaker', 'FailingHandler', async () => {
    throw new Error('Simulated failure');
  });
  
  // Try to trigger multiple times
  console.log('  Triggering failing hook 6 times...');
  for (let i = 0; i < 6; i++) {
    const result = await hooks.trigger('test:circuit-breaker', {});
    if (!result.success) {
      console.log(`    Attempt ${i + 1}: ${result.message || result.error}`);
    }
  }
  
  console.log();
  
  // ========================================
  // 11. EXPORT CONFIGURATION
  // ========================================
  console.log('🟢 Hook Configuration Summary:\n');
  
  const config = hooks.exportConfiguration();
  console.log(`  Registered ${config.hooks.length} hooks across ${Object.keys(config.categories).length} categories`);
  console.log('  Most used categories:');
  const sortedCategories = Object.entries(config.categories)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);
  for (const [category, hooks] of sortedCategories) {
    console.log(`    - ${category}: ${hooks.length} hooks`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DEMONSTRATION COMPLETE');
  console.log('='.repeat(60) + '\n');
  
  console.log('🟢 Key Benefits Demonstrated:');
  console.log('  🏁 Comprehensive hook coverage across all systems');
  console.log('  🏁 Automatic error handling with circuit breakers');
  console.log('  🏁 Performance monitoring and optimization');
  console.log('  🏁 Department coordination and handoffs');
  console.log('  🏁 Consciousness-driven validation');
  console.log('  🏁 Resource management and warnings');
  console.log('  🏁 Learning and pattern detection');
  console.log('  🏁 Hook chaining with dependencies');
  console.log('  🏁 Rich statistics and monitoring');
  console.log('  🏁 Extensible handler system');
  
  console.log('\n🟢 The Universal Hook System transforms BUMBA into a');
  console.log('   self-managing, self-optimizing, intelligent framework!\n');
}

// Run the demonstration
demonstrateUniversalHooks().catch(console.error);