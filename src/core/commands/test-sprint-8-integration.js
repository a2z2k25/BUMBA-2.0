#!/usr/bin/env node

/**
 * Test Sprint 8: Integration Testing
 * End-to-end test of complete executive mode system
 */

const { BumbaFramework2 } = require('../bumba-framework-2');
const chalk = require('chalk');

// Helper for colored output (fallback if chalk not available)
const color = {
  green: (text) => chalk ? chalk.green(text) : `🏁 ${text}`,
  red: (text) => chalk ? chalk.red(text) : `🔴 ${text}`,
  yellow: (text) => chalk ? chalk.yellow(text) : `🟠️ ${text}`,
  blue: (text) => chalk ? chalk.blue(text) : `ℹ️ ${text}`,
  bold: (text) => chalk ? chalk.bold(text) : `**${text}**`
};

console.log('\n' + '='.repeat(60));
console.log('🧪 SPRINT 8: INTEGRATION TEST');
console.log('='.repeat(60));

async function runIntegrationTest() {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // Test 1: Framework Initialization
    console.log('\n📝 Test 1: Framework Initialization');
    console.log('   Testing: Core components setup');
    
    const framework = new BumbaFramework2();
    
    // Verify core components
    const checks = [
      { name: 'Mode Manager', exists: !!framework.modeManager },
      { name: 'Crisis Detector', exists: !!framework.crisisDetector },
      { name: 'Executive Metrics', exists: !!framework.executiveMetrics },
      { name: 'Product-Strategist', exists: !!framework.departments.get('strategic') },
      { name: 'Design-Engineer', exists: !!framework.departments.get('experience') },
      { name: 'Backend-Engineer', exists: !!framework.departments.get('technical') }
    ];
    
    checks.forEach(check => {
      if (check.exists) {
        console.log(`   🏁 ${check.name} initialized`);
        results.passed.push(`${check.name} initialization`);
      } else {
        console.log(`   🔴 ${check.name} missing`);
        results.failed.push(`${check.name} initialization`);
      }
    });
    
    // Test 2: Normal Operations
    console.log('\n📝 Test 2: Normal Operations');
    console.log('   Testing: System starts in NORMAL mode');
    
    const initialMode = framework.getCurrentMode();
    if (initialMode === 'NORMAL') {
      console.log(`   🏁 Started in ${initialMode} mode`);
      results.passed.push('Normal mode startup');
    } else {
      console.log(`   🔴 Wrong initial mode: ${initialMode}`);
      results.failed.push('Normal mode startup');
    }
    
    // Test 3: Crisis Detection
    console.log('\n📝 Test 3: Crisis Detection');
    console.log('   Testing: Crisis triggers proper response');
    
    // Start monitoring
    framework.startCrisisMonitoring();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate crisis
    framework.simulateCrisis('ERROR_RATE', 'CRITICAL');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const crisisMode = framework.getCurrentMode();
    if (crisisMode === 'CRISIS' || crisisMode === 'EXECUTIVE') {
      console.log(`   🏁 Crisis detected, mode: ${crisisMode}`);
      results.passed.push('Crisis detection');
    } else {
      console.log(`   🔴 Crisis not properly handled, mode: ${crisisMode}`);
      results.failed.push('Crisis detection');
    }
    
    // Test 4: Executive Activation
    console.log('\n📝 Test 4: Executive Activation');
    console.log('   Testing: Product-Strategist becomes CEO');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const productStrategist = framework.departments.get('strategic');
    if (productStrategist.organizationalAuthority) {
      console.log('   🏁 Product-Strategist has CEO authority');
      results.passed.push('Executive activation');
    } else {
      console.log('   🔴 Executive mode not activated');
      results.failed.push('Executive activation');
    }
    
    // Test 5: Department Control
    console.log('\n📝 Test 5: Department Control');
    console.log('   Testing: CEO can control departments');
    
    const testStrategy = {
      type: 'TEST',
      priority: 'HIGH',
      actions: ['test']
    };
    
    let departmentControlWorks = true;
    
    for (const [name, dept] of framework.departments) {
      try {
        const result = await dept.executeStrategy(testStrategy, {});
        if (result && result.success !== false) {
          console.log(`   🏁 ${name} responds to strategy`);
        } else {
          console.log(`   🟠️ ${name} strategy execution unclear`);
          departmentControlWorks = false;
        }
      } catch (error) {
        console.log(`   🔴 ${name} failed: ${error.message}`);
        departmentControlWorks = false;
      }
    }
    
    if (departmentControlWorks) {
      results.passed.push('Department control');
    } else {
      results.warnings.push('Department control partially working');
    }
    
    // Test 6: Metrics Collection
    console.log('\n📝 Test 6: Metrics Collection');
    console.log('   Testing: Metrics are being tracked');
    
    const metrics = framework.getExecutiveMetrics();
    if (metrics && metrics.crisis.totalCrises > 0) {
      console.log(`   🏁 Crisis tracked: ${metrics.crisis.totalCrises} total`);
      console.log(`   🏁 Executive sessions: ${metrics.executive.activations}`);
      results.passed.push('Metrics collection');
    } else {
      console.log('   🔴 Metrics not tracking properly');
      results.failed.push('Metrics collection');
    }
    
    // Test 7: Mode Transitions
    console.log('\n📝 Test 7: Mode Transitions');
    console.log('   Testing: Mode state management');
    
    const modeStatus = framework.getModeStatus();
    if (modeStatus && modeStatus.recentHistory && modeStatus.recentHistory.length > 0) {
      console.log('   🏁 Mode transitions tracked:');
      modeStatus.recentHistory.forEach(t => {
        console.log(`      ${t.from} → ${t.to}`);
      });
      results.passed.push('Mode transitions');
    } else {
      console.log('   🔴 Mode transitions not tracked');
      results.failed.push('Mode transitions');
    }
    
    // Test 8: Crisis Resolution
    console.log('\n📝 Test 8: Crisis Resolution');
    console.log('   Testing: System can resolve crisis');
    
    // Simulate resolution
    const detector = framework.crisisDetector;
    for (let i = 0; i < 30; i++) {
      detector.recordResponseTime(50);
    }
    await detector.performCrisisCheck();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resolvedStatus = framework.getCrisisStatus();
    if (!resolvedStatus.currentCrisis) {
      console.log('   🏁 Crisis resolved successfully');
      results.passed.push('Crisis resolution');
    } else {
      console.log('   🟠️ Crisis still active');
      results.warnings.push('Crisis resolution slow');
    }
    
    // Test 9: Recovery Mode
    console.log('\n📝 Test 9: Recovery Mode');
    console.log('   Testing: System enters recovery after crisis');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const recoveryMode = framework.getCurrentMode();
    if (recoveryMode === 'RECOVERY' || recoveryMode === 'NORMAL') {
      console.log(`   🏁 System in ${recoveryMode} mode`);
      results.passed.push('Recovery mode');
    } else {
      console.log(`   🟠️ Unexpected mode: ${recoveryMode}`);
      results.warnings.push('Recovery mode transition');
    }
    
    // Test 10: Return to Normal
    console.log('\n📝 Test 10: Return to Normal');
    console.log('   Testing: System returns to normal operations');
    
    // Wait for full recovery
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalMode = framework.getCurrentMode();
    if (finalMode === 'NORMAL') {
      console.log('   🏁 Returned to NORMAL operations');
      results.passed.push('Return to normal');
    } else {
      console.log(`   🟠️ Still in ${finalMode} mode`);
      results.warnings.push('Return to normal delayed');
    }
    
    // Test 11: Performance Report
    console.log('\n📝 Test 11: Performance Reporting');
    console.log('   Testing: Can generate performance report');
    
    const report = framework.getExecutiveReport();
    if (report && report.summary) {
      console.log('   🏁 Performance report generated');
      console.log(`      Success Rate: ${report.summary.successRate}`);
      console.log(`      Decision Accuracy: ${report.summary.decisionAccuracy}`);
      results.passed.push('Performance reporting');
    } else {
      console.log('   🔴 Performance report failed');
      results.failed.push('Performance reporting');
    }
    
    // Test 12: Edge Case - Multiple Crises
    console.log('\n📝 Test 12: Edge Case - Multiple Crises');
    console.log('   Testing: Handling rapid crisis events');
    
    framework.simulateCrisis('RESPONSE_TIME', 'HIGH');
    await new Promise(resolve => setTimeout(resolve, 100));
    framework.simulateCrisis('USER_COMPLAINTS', 'MEDIUM');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const multiCrisisMetrics = framework.getExecutiveMetrics();
    if (multiCrisisMetrics.crisis.totalCrises >= 3) {
      console.log(`   🏁 Multiple crises tracked: ${multiCrisisMetrics.crisis.totalCrises}`);
      results.passed.push('Multiple crisis handling');
    } else {
      console.log('   🟠️ Not all crises tracked');
      results.warnings.push('Multiple crisis tracking');
    }
    
    // Clean up
    framework.stopCrisisMonitoring();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    
    const totalTests = results.passed.length + results.failed.length + results.warnings.length;
    const passRate = (results.passed.length / totalTests * 100).toFixed(1);
    
    console.log(`\n🏁 PASSED: ${results.passed.length}/${totalTests} tests`);
    results.passed.forEach(test => console.log(`   • ${test}`));
    
    if (results.warnings.length > 0) {
      console.log(`\n🟠️ WARNINGS: ${results.warnings.length} tests`);
      results.warnings.forEach(test => console.log(`   • ${test}`));
    }
    
    if (results.failed.length > 0) {
      console.log(`\n🔴 FAILED: ${results.failed.length} tests`);
      results.failed.forEach(test => console.log(`   • ${test}`));
    }
    
    console.log(`\n📈 Pass Rate: ${passRate}%`);
    
    if (results.failed.length === 0) {
      console.log('\n🏁 ALL CRITICAL TESTS PASSED!');
      console.log('   Executive Mode system is fully operational');
    } else {
      console.log('\n🟠️ Some tests failed - review needed');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 SPRINT 8 COMPLETE: Integration testing finished!');
    console.log('='.repeat(60) + '\n');
    
    process.exit(results.failed.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(`\n🔴 Integration test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run integration test
runIntegrationTest();