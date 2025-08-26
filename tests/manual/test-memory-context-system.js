#!/usr/bin/env node

/**
 * BUMBA Memory & Context System Test Suite
 * Comprehensive testing and audit of memory management and context sharing
 */

const memoryIntegration = require('./src/core/memory/memory-integration-layer');
const memoryManager = require('./src/core/resource-management/memory-manager');
const { BumbaTeamMemory } = require('./src/utils/teamMemory');

// Test result storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  performance: {},
  recommendations: []
};

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function recordTest(name, passed, details = '') {
  if (passed) {
    testResults.passed.push({ name, details });
    log(`🏁 ${name}`, 'green');
  } else {
    testResults.failed.push({ name, details });
    log(`🔴 ${name}: ${details}`, 'red');
  }
}

function recordWarning(message) {
  testResults.warnings.push(message);
  log(`🟡  ${message}`, 'yellow');
}

// Test 1: Memory Manager Functionality
async function testMemoryManager() {
  logSection('Testing Memory Manager');
  
  try {
    const manager = memoryManager.getInstance({
      maxMemoryMB: 256,
      monitorInterval: 1000,
      warningThreshold: 0.7
    });
    
    // Test resource registration
    const resourceId = manager.registerResource('test-resource', {
      data: Buffer.alloc(1024 * 1024), // 1MB buffer
      type: 'buffer'
    }, {
      type: 'test',
      ttl: 5000
    });
    
    recordTest('Resource Registration', resourceId !== undefined);
    
    // Test cache registration
    const testCache = new Map();
    const cacheName = manager.registerCache('test-cache', testCache, {
      maxSize: 100,
      evictionPolicy: 'lru'
    });
    
    recordTest('Cache Registration', cacheName === 'test-cache');
    
    // Test memory monitoring
    const usage = manager.getMemoryUsage();
    recordTest('Memory Usage Monitoring', usage.heapUsed > 0);
    
    // Test resource cleanup
    const freed = manager.freeResource(resourceId);
    recordTest('Resource Cleanup', freed === true);
    
    // Test statistics
    const stats = manager.getStats();
    recordTest('Statistics Collection', stats.resourcesFreed > 0);
    
    // Performance metrics
    testResults.performance.memoryManager = {
      heapUsedMB: usage.heapUsedMB,
      heapUsedPercent: usage.heapUsedPercent,
      resourceCount: stats.resourceCount,
      cacheCount: stats.cacheCount
    };
    
    // Cleanup
    manager.shutdown();
    
  } catch (error) {
    recordTest('Memory Manager', false, error.message);
  }
}

// Test 2: Team Memory System
async function testTeamMemory() {
  logSection('Testing Team Memory System');
  
  try {
    const teamMemory = await BumbaTeamMemory.create();
    
    // Test initialization
    const context = await teamMemory.getTeamContext();
    recordTest('Team Memory Initialization', context !== null);
    
    // Test agent activity recording
    const activityRecorded = await teamMemory.recordAgentActivity(
      'Backend-Engineer',
      'test-activity',
      { test: true }
    );
    recordTest('Agent Activity Recording', activityRecorded === true);
    
    // Test handoff creation
    const handoffId = await teamMemory.createHandoff(
      'Backend-Engineer',
      'Design-Engineer',
      { task: 'UI implementation needed' },
      'high'
    );
    recordTest('Handoff Creation', handoffId !== false);
    
    // Test pending handoffs retrieval
    const pendingHandoffs = await teamMemory.getPendingHandoffs('Design-Engineer');
    recordTest('Pending Handoffs Retrieval', pendingHandoffs.length > 0);
    
    // Test quality checkpoint
    const checkpointAdded = await teamMemory.addQualityCheckpoint(
      'Backend-Engineer',
      'unit-test',
      { passed: 10, failed: 0 },
      ['test.js']
    );
    recordTest('Quality Checkpoint', checkpointAdded === true);
    
    // Test team decision recording
    const decisionRecorded = await teamMemory.recordTeamDecision(
      'Use TypeScript for new modules',
      ['Backend-Engineer', 'Design-Engineer'],
      'Better type safety and IDE support'
    );
    recordTest('Team Decision Recording', decisionRecorded === true);
    
    // Test team summary
    const summary = await teamMemory.getTeamSummary();
    recordTest('Team Summary Generation', summary !== null);
    
    // Performance metrics
    testResults.performance.teamMemory = {
      activeAgents: summary?.activeAgents?.length || 0,
      pendingHandoffs: summary?.pendingHandoffs || 0,
      sessionCount: summary?.sessionCount || 0
    };
    
  } catch (error) {
    recordTest('Team Memory System', false, error.message);
  }
}

// Test 3: Memory Integration Layer
async function testMemoryIntegration() {
  logSection('Testing Memory Integration Layer');
  
  try {
    // Note: Some dependencies might not exist, so we'll handle gracefully
    const integration = memoryIntegration.getInstance({
      enableAutoIntegration: false, // Disable auto-sync for testing
      syncInterval: 5000
    });
    
    // Wait for initialization
    await new Promise(resolve => {
      integration.once('initialized', resolve);
      setTimeout(resolve, 2000); // Timeout after 2 seconds
    });
    
    const status = integration.getStatus();
    
    // Test system connections
    recordTest('Memory System Connection', status.systems.memory);
    recordTest('Learning System Connection', status.systems.learning);
    recordTest('Handoff Manager Connection', status.systems.handoff);
    recordTest('Dashboard Connection', status.systems.dashboard);
    recordTest('Communication Protocol Connection', status.systems.communication);
    recordTest('Knowledge Transfer Connection', status.systems.knowledge);
    
    // Test user feedback processing
    const feedbackResult = await integration.processUserFeedback(
      'Good job on the implementation',
      { task: 'test-task', agent: 'Backend-Engineer' }
    );
    recordTest('User Feedback Processing', feedbackResult.knowledgeStored === true);
    
    // Test handoff triggering
    const handoffResult = await integration.triggerHandoff(
      'Backend-Engineer',
      'manual'
    );
    recordTest('Handoff Triggering', handoffResult !== null);
    
    // Performance metrics
    testResults.performance.integration = {
      syncOperations: status.metrics.syncOperations,
      dataTransferred: status.metrics.dataTransferred,
      integrationErrors: status.metrics.integrationErrors
    };
    
    // Stop integration
    await integration.stop();
    
  } catch (error) {
    recordTest('Memory Integration Layer', false, error.message);
    recordWarning('Some integration components may not be initialized');
  }
}

// Test 4: Context Sharing Between Modules
async function testContextSharing() {
  logSection('Testing Context Sharing');
  
  try {
    // Create test context
    const sharedContext = {
      projectId: 'test-project',
      currentTask: 'memory-system-test',
      timestamp: new Date().toISOString()
    };
    
    // Test context persistence
    const teamMemory = await BumbaTeamMemory.create();
    const context = await teamMemory.getTeamContext();
    context.sharedContext['test-context'] = sharedContext;
    const saved = await teamMemory.saveContext(context);
    recordTest('Context Persistence', saved === true);
    
    // Test context retrieval
    const retrievedContext = await teamMemory.getTeamContext();
    const testContext = retrievedContext?.sharedContext?.['test-context'];
    recordTest('Context Retrieval', testContext?.projectId === 'test-project');
    
    // Test cross-agent context sharing
    await teamMemory.recordAgentActivity('Product-Strategist', 'context-test', sharedContext);
    const updatedContext = await teamMemory.getTeamContext();
    const hasActivity = Object.values(updatedContext.sharedContext).some(
      item => item.activity === 'context-test'
    );
    recordTest('Cross-Agent Context Sharing', hasActivity);
    
  } catch (error) {
    recordTest('Context Sharing', false, error.message);
  }
}

// Test 5: Memory Pressure and Cleanup
async function testMemoryPressure() {
  logSection('Testing Memory Pressure Handling');
  
  try {
    const manager = memoryManager.getInstance();
    
    // Create memory pressure by registering large resources
    const largeResources = [];
    for (let i = 0; i < 5; i++) {
      const id = manager.registerResource(`large-${i}`, {
        data: Buffer.alloc(10 * 1024 * 1024), // 10MB each
        index: i
      });
      largeResources.push(id);
    }
    
    // Check memory usage
    const beforeCleanup = manager.getMemoryUsage();
    
    // Trigger cleanup
    manager.cleanupOldResources();
    manager.freeLargeResources(5); // Free resources > 5MB
    
    const afterCleanup = manager.getMemoryUsage();
    
    const memoryFreed = beforeCleanup.heapUsed > afterCleanup.heapUsed;
    recordTest('Memory Pressure Cleanup', memoryFreed);
    
    // Test cache eviction
    const cache = new Map();
    manager.registerCache('pressure-test', cache, { maxSize: 10 });
    
    // Fill cache beyond limit
    for (let i = 0; i < 15; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }
    
    recordTest('Cache Eviction', cache.size <= 10);
    
    // Cleanup
    manager.shutdown();
    
  } catch (error) {
    recordTest('Memory Pressure Handling', false, error.message);
  }
}

// Generate audit report
function generateAuditReport() {
  logSection('AUDIT REPORT');
  
  console.log('\n🟢 Test Results:');
  console.log(`🏁 Passed: ${testResults.passed.length}`);
  console.log(`🔴 Failed: ${testResults.failed.length}`);
  console.log(`🟡  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n🔴 Failed Tests:');
    testResults.failed.forEach(test => {
      console.log(`  - ${test.name}: ${test.details}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n🟡  Warnings:');
    testResults.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  console.log('\n🟢 Performance Metrics:');
  console.log(JSON.stringify(testResults.performance, null, 2));
  
  // Operability Assessment
  logSection('OPERABILITY ASSESSMENT');
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const successRate = (testResults.passed.length / totalTests * 100).toFixed(1);
  
  console.log(`\n🟢 Success Rate: ${successRate}%`);
  
  if (successRate >= 80) {
    log('🏁 System is OPERATIONAL', 'green');
    console.log('The memory and context sharing system is functioning well.');
  } else if (successRate >= 60) {
    log('🟡  System is PARTIALLY OPERATIONAL', 'yellow');
    console.log('Some components need attention but core functionality works.');
  } else {
    log('🔴 System has CRITICAL ISSUES', 'red');
    console.log('Significant problems detected. Immediate attention required.');
  }
  
  // Recommendations
  logSection('RECOMMENDATIONS');
  
  // Dynamic recommendations based on test results
  if (testResults.failed.some(t => t.name.includes('Integration'))) {
    console.log('1. Check dependency initialization in Memory Integration Layer');
    console.log('   - Ensure all required modules are properly installed');
    console.log('   - Verify singleton patterns are working correctly');
  }
  
  if (testResults.warnings.length > 0) {
    console.log('2. Address warning conditions:');
    console.log('   - Review integration component initialization');
    console.log('   - Check for missing dependencies');
  }
  
  if (testResults.performance.memoryManager?.heapUsedPercent > 50) {
    console.log('3. Monitor memory usage:');
    console.log('   - Consider increasing memory limits');
    console.log('   - Implement more aggressive cleanup strategies');
  }
  
  console.log('\n4. General improvements:');
  console.log('   - Add retry mechanisms for failed operations');
  console.log('   - Implement circuit breakers for external dependencies');
  console.log('   - Add more comprehensive error recovery');
  console.log('   - Consider implementing memory pooling for large objects');
  console.log('   - Add metrics collection for production monitoring');
  
  // Completeness Assessment
  logSection('COMPLETENESS ASSESSMENT');
  
  const components = [
    { name: 'Memory Manager', status: testResults.passed.some(t => t.name.includes('Memory Manager')) },
    { name: 'Team Memory', status: testResults.passed.some(t => t.name.includes('Team Memory')) },
    { name: 'Integration Layer', status: testResults.passed.some(t => t.name.includes('Integration')) },
    { name: 'Context Sharing', status: testResults.passed.some(t => t.name.includes('Context')) },
    { name: 'Pressure Handling', status: testResults.passed.some(t => t.name.includes('Pressure')) }
  ];
  
  console.log('\n🟢 Component Status:');
  components.forEach(comp => {
    const status = comp.status ? '🏁 Complete' : '🔴 Incomplete';
    console.log(`  ${comp.name}: ${status}`);
  });
  
  const completeCount = components.filter(c => c.status).length;
  const completeness = (completeCount / components.length * 100).toFixed(1);
  
  console.log(`\n🟢 Overall Completeness: ${completeness}%`);
  
  if (completeness === '100.0') {
    log('🏁 All components are complete and functional', 'green');
  } else {
    log(`🟡  ${components.length - completeCount} components need attention`, 'yellow');
  }
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(60));
  log('BUMBA MEMORY & CONTEXT SYSTEM AUDIT', 'blue');
  console.log('='.repeat(60));
  console.log('Starting comprehensive system test...\n');
  
  try {
    // Run all tests
    await testMemoryManager();
    await testTeamMemory();
    await testMemoryIntegration();
    await testContextSharing();
    await testMemoryPressure();
    
    // Generate report
    generateAuditReport();
    
  } catch (error) {
    log(`\n🔴 Critical error during testing: ${error.message}`, 'red');
    console.error(error.stack);
  }
  
  console.log('\n' + '='.repeat(60));
  log('AUDIT COMPLETE', 'blue');
  console.log('='.repeat(60) + '\n');
  
  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run the audit
main().catch(console.error);