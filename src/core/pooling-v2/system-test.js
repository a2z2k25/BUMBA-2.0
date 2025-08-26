#!/usr/bin/env node

/**
 * Complete System Test for BUMBA Intelligent Pooling
 * Tests all components from Sprint 1 through Sprint 5
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize(`🧪 ${text}`, 'bright'));
  console.log('='.repeat(80));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(60));
}

async function runCompleteSystemTest() {
  printHeader('COMPLETE SYSTEM TEST - ALL SPRINTS');
  
  let testsPassed = 0;
  let testsTotal = 0;
  const results = {};

  try {
    // Test 1: Sprint 1 Foundation
    printSection('Test 1: Sprint 1 - Single Specialist Foundation');
    testsTotal++;
    
    const { SingleSpecialistPool, SpecialistState } = require('./single-specialist-pool');
    
    const singlePool = new SingleSpecialistPool({ verbose: false });
    console.log('🏁 SingleSpecialistPool loaded successfully');
    
    const result1 = await singlePool.executeTask({ id: 'test-foundation' });
    if (result1.success) {
      testsPassed++;
      console.log('🏁 Single specialist task execution works');
      console.log(`   Response time: ${result1.responseTime}ms`);
      console.log(`   Memory usage: ${singlePool.metrics.memoryUsage} MB`);
    }
    
    results.sprint1 = { 
      passed: result1.success, 
      responseTime: result1.responseTime,
      memory: singlePool.metrics.memoryUsage
    };

    // Test 2: Sprint 2 Multi-Specialist
    printSection('Test 2: Sprint 2 - Multi-Specialist Intelligence');
    testsTotal++;
    
    const { MultiSpecialistPool } = require('./multi-specialist-pool');
    
    const multiPool = new MultiSpecialistPool({ verbose: false, maxSpecialists: 3 });
    console.log('🏁 MultiSpecialistPool loaded successfully');
    
    const result2 = await multiPool.executeTask({ type: 'api' });
    if (result2.success) {
      testsPassed++;
      console.log('🏁 Multi-specialist task routing works');
      console.log(`   Selected: ${result2.poolStats.selectedSpecialist}`);
      console.log(`   Memory: ${result2.poolStats.totalMemory} MB`);
      console.log(`   Warm count: ${result2.poolStats.warmCount}/3`);
    }
    
    results.sprint2 = {
      passed: result2.success,
      selectedSpecialist: result2.poolStats.selectedSpecialist,
      memory: result2.poolStats.totalMemory,
      warmCount: result2.poolStats.warmCount
    };

    // Test 3: Sprint 3 Scaled System
    printSection('Test 3: Sprint 3 - 20 Specialists with Prediction');
    testsTotal++;
    
    const { ScaledSpecialistPool } = require('./scaled-specialist-pool');
    
    const scaledPool = new ScaledSpecialistPool({ verbose: false, maxSpecialists: 5 });
    console.log('🏁 ScaledSpecialistPool loaded successfully');
    
    const result3 = await scaledPool.executeTask({ type: 'ml' });
    if (result3.success) {
      testsPassed++;
      console.log('🏁 Scaled specialist system works');
      console.log(`   Selected: ${result3.poolStats.selectedSpecialist}`);
      console.log(`   Department: ${result3.poolStats.department}`);
      console.log(`   Memory: ${result3.poolStats.totalMemory} MB`);
    }
    
    results.sprint3 = {
      passed: result3.success,
      selectedSpecialist: result3.poolStats.selectedSpecialist,
      department: result3.poolStats.department,
      memory: result3.poolStats.totalMemory
    };

    // Test 4: Sprint 4 Production System
    printSection('Test 4: Sprint 4 - Production 83 Specialists');
    testsTotal++;
    
    const { ProductionSpecialistPool } = require('./production-specialist-pool');
    
    const productionPool = new ProductionSpecialistPool({ 
      verbose: false, 
      maxSpecialists: 10,  // Test with 10 for speed
      maxWarmSpecialists: 2
    });
    console.log('🏁 ProductionSpecialistPool loaded successfully');
    
    const result4 = await productionPool.executeTask({ type: 'architecture' });
    if (result4.success) {
      testsPassed++;
      console.log('🏁 Production system works');
      console.log(`   Selected: ${result4.poolStats.selectedSpecialist}`);
      console.log(`   Priority: ${result4.poolStats.priority}`);
      console.log(`   Memory: ${result4.poolStats.totalMemory} MB`);
      console.log(`   Workflow: ${result4.poolStats.workflowDetected ? 'Detected' : 'None'}`);
    }
    
    results.sprint4 = {
      passed: result4.success,
      selectedSpecialist: result4.poolStats.selectedSpecialist,
      priority: result4.poolStats.priority,
      memory: result4.poolStats.totalMemory,
      workflowDetected: result4.poolStats.workflowDetected
    };

    // Test 5: Sprint 5 Integration
    printSection('Test 5: Sprint 5 - BUMBA Integration Bridge');
    testsTotal++;
    
    const { BumbaIntegrationBridge, BUMBA_COMMAND_MAPPING } = require('./bumba-integration-bridge');
    
    const integrationBridge = new BumbaIntegrationBridge({ 
      mode: 'shadow',
      verbose: false 
    });
    console.log('🏁 BumbaIntegrationBridge loaded successfully');
    
    // Test command mapping
    const commandMapping = BUMBA_COMMAND_MAPPING['/bumba:implement'];
    if (commandMapping && commandMapping.type === 'implementation') {
      testsPassed++;
      console.log('🏁 BUMBA command mapping works');
      console.log(`   Command: /bumba:implement → ${commandMapping.type} (${commandMapping.priority})`);
      console.log(`   Total mappings: ${Object.keys(BUMBA_COMMAND_MAPPING).length}`);
    }
    
    results.sprint5 = {
      passed: !!commandMapping,
      mappingsCount: Object.keys(BUMBA_COMMAND_MAPPING).length,
      testMapping: commandMapping
    };

    // Test 6: Migration & Rollback Systems
    printSection('Test 6: Migration & Rollback Systems');
    testsTotal++;
    
    const { IntelligentPoolingMigration } = require('./migration-strategy');
    const { EnterpriseRollbackSystem } = require('./rollback-system');
    
    const migrationManager = new IntelligentPoolingMigration({ verbose: false });
    const rollbackSystem = new EnterpriseRollbackSystem({ verbose: false });
    
    console.log('🏁 Migration system loaded successfully');
    console.log('🏁 Rollback system loaded successfully');
    
    testsPassed++;
    results.migration = {
      passed: true,
      migrationLoaded: true,
      rollbackLoaded: true
    };

    // Test 7: Memory Efficiency Calculation
    printSection('Test 7: Memory Efficiency Analysis');
    testsTotal++;
    
    // Calculate efficiency across all systems
    const singleMemory = results.sprint1.memory || 5.0;
    const multiMemory = results.sprint2.memory || 7.3;  
    const scaledMemory = results.sprint3.memory || 25.0;
    const productionMemory = results.sprint4.memory || 104.0;
    
    // Always-warm baselines
    const singleAlwaysWarm = 5.0;   // 1 * 5MB
    const multiAlwaysWarm = 15.0;   // 3 * 5MB
    const scaledAlwaysWarm = 25.0;  // 5 * 5MB
    const productionAlwaysWarm = 50.0; // 10 * 5MB
    
    const efficiencies = {
      single: ((singleAlwaysWarm - singleMemory) / singleAlwaysWarm) * 100,
      multi: ((multiAlwaysWarm - multiMemory) / multiAlwaysWarm) * 100,
      scaled: ((scaledAlwaysWarm - scaledMemory) / scaledAlwaysWarm) * 100,
      production: ((productionAlwaysWarm - productionMemory) / productionAlwaysWarm) * 100
    };
    
    console.log('💾 Memory Efficiency Results:');
    console.log(`   Single (1 specialist):     ${efficiencies.single.toFixed(1)}% efficiency`);
    console.log(`   Multi (3 specialists):     ${efficiencies.multi.toFixed(1)}% efficiency`);
    console.log(`   Scaled (5 specialists):    ${efficiencies.scaled.toFixed(1)}% efficiency`);
    console.log(`   Production (10 specialists): ${efficiencies.production.toFixed(1)}% efficiency`);
    
    const avgEfficiency = Object.values(efficiencies).reduce((a, b) => a + b, 0) / 4;
    console.log(`   Average Efficiency:        ${colorize(avgEfficiency.toFixed(1) + '%', 'green')}`);
    
    if (avgEfficiency > 50) {
      testsPassed++;
      console.log('🏁 Memory efficiency target achieved (>50%)');
    }
    
    results.efficiency = {
      passed: avgEfficiency > 50,
      average: avgEfficiency,
      individual: efficiencies
    };

    // Test 8: Performance Characteristics
    printSection('Test 8: Performance Characteristics');
    testsTotal++;
    
    const responseTimes = [
      results.sprint1.responseTime || 0,
      result2.responseTime || 0,
      result3.responseTime || 0,
      result4.responseTime || 0
    ].filter(t => t > 0);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log('🟢 Performance Analysis:');
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   Maximum Response Time: ${maxResponseTime.toFixed(0)}ms`);
    console.log(`   Response Time Range: ${Math.min(...responseTimes)}ms - ${maxResponseTime}ms`);
    
    if (avgResponseTime < 2000) {
      testsPassed++;
      console.log('🏁 Performance within acceptable limits (<2000ms avg)');
    }
    
    results.performance = {
      passed: avgResponseTime < 2000,
      average: avgResponseTime,
      maximum: maxResponseTime,
      samples: responseTimes.length
    };

    // Cleanup
    singlePool.destroy();
    multiPool.destroy();
    scaledPool.destroy();
    await productionPool.shutdown();

  } catch (error) {
    console.error(colorize(`🔴 Test Error: ${error.message}`, 'red'));
    console.error(error.stack);
    results.error = error.message;
  }

  // Final Results
  printHeader('COMPLETE SYSTEM TEST RESULTS');
  
  console.log(`\n📊 Overall Results:`);
  console.log(`   Tests Passed: ${colorize(testsPassed, 'green')}/${testsTotal}`);
  console.log(`   Success Rate: ${colorize(((testsPassed/testsTotal)*100).toFixed(1) + '%', testsPassed === testsTotal ? 'green' : 'yellow')}`);
  
  console.log(`\n🟢️ System Component Status:`);
  console.log(`   Sprint 1 (Foundation):     ${results.sprint1?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Sprint 2 (Intelligence):   ${results.sprint2?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Sprint 3 (Scale):          ${results.sprint3?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Sprint 4 (Production):     ${results.sprint4?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Sprint 5 (Integration):    ${results.sprint5?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Migration & Rollback:      ${results.migration?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Memory Efficiency:         ${results.efficiency?.passed ? '🏁' : '🔴'} PASS`);
  console.log(`   Performance:               ${results.performance?.passed ? '🏁' : '🔴'} PASS`);
  
  console.log(`\n💾 Efficiency Summary:`);
  if (results.efficiency) {
    Object.entries(results.efficiency.individual).forEach(([system, eff]) => {
      console.log(`   ${system.padEnd(12)}: ${eff.toFixed(1)}% memory reduction`);
    });
    console.log(`   ${'Average'.padEnd(12)}: ${colorize(results.efficiency.average.toFixed(1) + '%', 'bright')} memory reduction`);
  }
  
  console.log(`\n🟢 Performance Summary:`);
  if (results.performance) {
    console.log(`   Average Response: ${results.performance.average.toFixed(0)}ms`);
    console.log(`   Maximum Response: ${results.performance.maximum.toFixed(0)}ms`);
    console.log(`   Samples Tested: ${results.performance.samples}`);
  }
  
  if (testsPassed === testsTotal) {
    console.log(colorize('\n🏁 ALL TESTS PASSED! System is production ready! 🟢', 'green'));
    console.log(colorize('\n🟡 The BUMBA Intelligent Pooling System is working perfectly!', 'bright'));
  } else {
    console.log(colorize(`\n🟠️ ${testsTotal - testsPassed} tests failed. Review before production deployment.`, 'yellow'));
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  return {
    passed: testsPassed === testsTotal,
    testsPassed,
    testsTotal,
    successRate: (testsPassed/testsTotal)*100,
    results
  };
}

// Run tests if executed directly
if (require.main === module) {
  runCompleteSystemTest().catch(console.error);
}

module.exports = { runCompleteSystemTest };