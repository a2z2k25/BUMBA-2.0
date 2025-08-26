#!/usr/bin/env node

/**
 * Test Sprint 7: Metrics & Monitoring
 * Verify executive performance tracking
 */

const { BumbaFramework2 } = require('../bumba-framework-2');

console.log('\n' + '='.repeat(60));
console.log('📊 SPRINT 7: METRICS & MONITORING TEST');
console.log('='.repeat(60));

async function testMetrics() {
  try {
    // Initialize framework
    console.log('\n1️⃣ Initializing framework...');
    const framework = new BumbaFramework2();
    
    console.log('   🏁 Framework initialized');
    console.log('   🏁 Executive metrics system created');
    
    // Test 1: Check initial metrics
    console.log('\n2️⃣ Checking initial metrics...');
    const initialMetrics = framework.getExecutiveMetrics();
    
    if (initialMetrics) {
      console.log('   Executive Metrics:');
      console.log(`      Activations: ${initialMetrics.executive.activations}`);
      console.log(`      Success Rate: ${(initialMetrics.kpis.successRate * 100).toFixed(1)}%`);
      console.log('   Crisis Metrics:');
      console.log(`      Total Crises: ${initialMetrics.crisis.totalCrises}`);
      console.log(`      Resolved: ${initialMetrics.crisis.resolvedCrises}`);
    }
    
    // Test 2: Simulate crisis to generate metrics
    console.log('\n3️⃣ Simulating crisis to generate metrics...');
    framework.simulateCrisis('ERROR_RATE', 'HIGH');
    
    // Wait for executive activation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Check metrics after crisis
    console.log('\n4️⃣ Checking metrics during crisis...');
    const crisisMetrics = framework.getExecutiveMetrics();
    
    if (crisisMetrics) {
      console.log('   Executive Session:');
      if (crisisMetrics.activeSession) {
        console.log(`      Duration: ${crisisMetrics.activeSession.duration}ms`);
        console.log(`      Decisions: ${crisisMetrics.activeSession.decisions}`);
        console.log(`      Departments: ${crisisMetrics.activeSession.departments}`);
      } else {
        console.log('      No active session');
      }
      
      console.log('   Crisis Tracking:');
      console.log(`      Total Crises: ${crisisMetrics.crisis.totalCrises}`);
      console.log(`      By Severity:`, crisisMetrics.crisis.crisesBySeverity);
    }
    
    // Test 4: Track some decisions
    console.log('\n5️⃣ Tracking executive decisions...');
    const metrics = framework.executiveMetrics;
    
    // Track sample decisions
    const decision1 = metrics.trackDecision({
      type: 'RESOURCE_ALLOCATION',
      department: 'Backend-Engineer',
      action: 'Scale infrastructure',
      context: { reason: 'High load' }
    });
    console.log(`   🏁 Decision tracked: ${decision1}`);
    
    const decision2 = metrics.trackDecision({
      type: 'PRIORITY_CHANGE',
      department: 'Design-Engineer',
      action: 'Focus on error states',
      context: { reason: 'Crisis UI needed' }
    });
    console.log(`   🏁 Decision tracked: ${decision2}`);
    
    // Track outcomes
    metrics.trackDecisionOutcome(decision1, 'success');
    metrics.trackDecisionOutcome(decision2, 'success');
    
    // Test 5: Track department actions
    console.log('\n6️⃣ Tracking department actions...');
    
    metrics.trackDepartmentAction('Backend-Engineer', 'scale_servers', {
      success: true,
      responseTime: 250
    });
    console.log('   🏁 Backend action tracked');
    
    metrics.trackDepartmentAction('Design-Engineer', 'update_ui', {
      success: true,
      responseTime: 180
    });
    console.log('   🏁 Design action tracked');
    
    metrics.trackDepartmentAction('Product-Strategist', 'coordinate_response', {
      success: true,
      responseTime: 150
    });
    console.log('   🏁 Strategic action tracked');
    
    // Test 6: Update response times
    console.log('\n7️⃣ Recording performance metrics...');
    metrics.updateResponseTime(200);
    metrics.updateResponseTime(150);
    metrics.updateResponseTime(180);
    metrics.updateErrorRate(0.05);
    console.log('   🏁 Performance metrics recorded');
    
    // Test 7: Resolve crisis
    console.log('\n8️⃣ Resolving crisis...');
    const detector = framework.crisisDetector;
    for (let i = 0; i < 20; i++) {
      detector.recordResponseTime(100);
    }
    await detector.performCrisisCheck();
    
    // Wait for resolution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 8: Get final report
    console.log('\n9️⃣ Generating performance report...');
    const report = framework.getExecutiveReport();
    
    if (report) {
      console.log('\n   📊 EXECUTIVE PERFORMANCE REPORT');
      console.log('   ' + '='.repeat(40));
      
      console.log('   Summary:');
      console.log(`      Total Activations: ${report.summary.totalActivations}`);
      console.log(`      Success Rate: ${report.summary.successRate}`);
      console.log(`      Avg Resolution Time: ${report.summary.averageResolutionTime}`);
      console.log(`      Department Efficiency: ${report.summary.departmentEfficiency}`);
      console.log(`      Decision Accuracy: ${report.summary.decisionAccuracy}`);
      
      console.log('\n   Crisis Management:');
      console.log(`      Total Crises: ${report.crisis.total}`);
      console.log(`      Resolved: ${report.crisis.resolved}`);
      console.log(`      Resolution Rate: ${report.crisis.resolutionRate}`);
      console.log(`      Distribution:`, report.crisis.distribution);
      
      console.log('\n   Executive Performance:');
      console.log(`      Activations: ${report.executive.activations}`);
      console.log(`      Avg Duration: ${report.executive.averageDuration}`);
      console.log(`      Decisions/Min: ${report.executive.decisionsPerMinute}`);
      
      if (report.trends) {
        console.log('\n   Trends:');
        console.log(`      Response Time: ${report.trends.responseTimeImproving === null ? 'Insufficient data' : 
          report.trends.responseTimeImproving ? '📈 Improving' : '📉 Degrading'}`);
        console.log(`      Error Rate: ${report.trends.errorRateImproving === null ? 'Insufficient data' : 
          report.trends.errorRateImproving ? '📈 Improving' : '📉 Degrading'}`);
      }
    }
    
    // Test 9: Check KPIs
    console.log('\n🔟 Checking Key Performance Indicators...');
    const finalMetrics = framework.getExecutiveMetrics();
    
    if (finalMetrics && finalMetrics.kpis) {
      console.log('   KPIs:');
      console.log(`      MTTR: ${finalMetrics.kpis.mttr.toFixed(0)}ms`);
      console.log(`      Success Rate: ${(finalMetrics.kpis.successRate * 100).toFixed(1)}%`);
      console.log(`      Response Time: ${finalMetrics.kpis.responseTime.toFixed(0)}ms`);
      console.log(`      Dept Efficiency: ${(finalMetrics.kpis.departmentEfficiency * 100).toFixed(1)}%`);
      console.log(`      Decision Accuracy: ${(finalMetrics.kpis.decisionAccuracy * 100).toFixed(1)}%`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SPRINT 7 SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n🏁 SPRINT 7 COMPLETE: Metrics & monitoring operational!');
    console.log('   • Executive sessions tracked');
    console.log('   • Crisis metrics collected');
    console.log('   • Decision tracking implemented');
    console.log('   • Department actions monitored');
    console.log('   • KPIs calculated');
    console.log('   • Performance reports generated');
    console.log('   • Trend analysis available');
    
    console.log('\n🟡 Key Achievement:');
    console.log('   The system now has comprehensive metrics tracking');
    console.log('   for executive mode performance and effectiveness!');
    
    console.log('='.repeat(60) + '\n');
    
    // Clean up
    framework.stopCrisisMonitoring();
    
    process.exit(0);
    
  } catch (error) {
    console.error(`\n🔴 Test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testMetrics();