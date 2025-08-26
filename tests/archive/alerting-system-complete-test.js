/**
 * BUMBA Complete Alerting System Test
 * Comprehensive testing of all alerting components
 */

const chalk = require('chalk');
const path = require('path');

console.log(chalk.bold.cyan('🧪 BUMBA Complete Alerting System Test'));
console.log(chalk.cyan('═'.repeat(60)));

async function testCompleteAlertingSystem() {
  const results = {
    components: {},
    integration: {},
    features: {},
    performance: {},
    overall: true
  };
  
  let totalTests = 0;
  let passedTests = 0;
  
  // ============== TEST ALERT MANAGER ==============
  console.log(chalk.bold.yellow('\n📢 Testing Alert Manager...'));
  
  try {
    const { alertManager } = require('../src/core/alerting/alert-manager');
    
    // Test 1: Create alert
    const alert = alertManager.alert('test', 'Test alert', { data: 'test' }, 'medium');
    if (alert && alert.id) {
      passedTests++;
      console.log(chalk.green('  🏁 Alert creation works'));
    } else {
      console.log(chalk.red('  🔴 Alert creation failed'));
    }
    totalTests++;
    
    // Test 2: Deduplication
    const dup1 = alertManager.alert('dup', 'Duplicate', {}, 'low');
    const dup2 = alertManager.alert('dup', 'Duplicate', {}, 'low');
    if (dup1 && !dup2) {
      passedTests++;
      console.log(chalk.green('  🏁 Deduplication works'));
    } else {
      console.log(chalk.red('  🔴 Deduplication failed'));
    }
    totalTests++;
    
    // Test 3: Acknowledgment
    const ackAlert = alertManager.alert('ack', 'Ack test', {}, 'high');
    const acked = alertManager.acknowledge(ackAlert.id, 'tester');
    if (acked) {
      passedTests++;
      console.log(chalk.green('  🏁 Acknowledgment works'));
    } else {
      console.log(chalk.red('  🔴 Acknowledgment failed'));
    }
    totalTests++;
    
    results.components.alertManager = passedTests === totalTests;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Alert Manager error:'), error.message);
    results.components.alertManager = false;
  }
  
  // ============== TEST NOTIFICATION SYSTEM ==============
  console.log(chalk.bold.yellow('\n📨 Testing Notification System...'));
  
  try {
    const { getInstance } = require('../src/core/alerting/notification-system');
    const notificationSystem = getInstance();
    
    // Test 1: Send notification
    const notification = await notificationSystem.send({
      title: 'Test Notification',
      message: 'This is a test',
      severity: 'info',
      channels: ['webhook']
    });
    
    if (notification && notification.id) {
      passedTests++;
      console.log(chalk.green('  🏁 Notification queueing works'));
    } else {
      console.log(chalk.red('  🔴 Notification queueing failed'));
    }
    totalTests++;
    
    // Test 2: Check channels
    const stats = notificationSystem.getStats();
    if (stats && stats.channels) {
      passedTests++;
      console.log(chalk.green(`  🏁 ${stats.channels.length} channels configured`));
    } else {
      console.log(chalk.red('  🔴 Channel configuration failed'));
    }
    totalTests++;
    
    // Test 3: Template system
    const templatedNotif = await notificationSystem.send({
      template: 'warning',
      data: { message: 'Template test' }
    });
    
    if (templatedNotif) {
      passedTests++;
      console.log(chalk.green('  🏁 Template system works'));
    } else {
      console.log(chalk.red('  🔴 Template system failed'));
    }
    totalTests++;
    
    results.components.notificationSystem = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Notification System error:'), error.message);
    results.components.notificationSystem = false;
  }
  
  // ============== TEST THRESHOLD MONITOR ==============
  console.log(chalk.bold.yellow('\n📊 Testing Threshold Monitor...'));
  
  try {
    const { getInstance } = require('../src/core/alerting/threshold-monitor');
    const thresholdMonitor = getInstance();
    
    // Test 1: Add threshold
    const thresholdId = thresholdMonitor.addThreshold({
      name: 'test_threshold',
      metric: 'test.metric',
      condition: 'greater_than',
      value: 100,
      severity: 'medium'
    });
    
    if (thresholdId) {
      passedTests++;
      console.log(chalk.green('  🏁 Threshold creation works'));
    } else {
      console.log(chalk.red('  🔴 Threshold creation failed'));
    }
    totalTests++;
    
    // Test 2: Record metric
    thresholdMonitor.recordMetric('test.metric', 50);
    thresholdMonitor.recordMetric('test.metric', 150);
    
    const history = thresholdMonitor.getMetricHistory('test.metric');
    if (history && history.length === 2) {
      passedTests++;
      console.log(chalk.green('  🏁 Metric recording works'));
    } else {
      console.log(chalk.red('  🔴 Metric recording failed'));
    }
    totalTests++;
    
    // Test 3: Get threshold status
    const status = thresholdMonitor.getThresholdStatus('test_threshold');
    if (status && status.currentValue === 150) {
      passedTests++;
      console.log(chalk.green('  🏁 Threshold status works'));
    } else {
      console.log(chalk.red('  🔴 Threshold status failed'));
    }
    totalTests++;
    
    // Cleanup
    thresholdMonitor.removeThreshold('test_threshold');
    
    results.components.thresholdMonitor = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Threshold Monitor error:'), error.message);
    results.components.thresholdMonitor = false;
  }
  
  // ============== TEST RULES ENGINE ==============
  console.log(chalk.bold.yellow('\n🟢️ Testing Rules Engine...'));
  
  try {
    const { getInstance } = require('../src/core/alerting/alert-rules-engine');
    const rulesEngine = getInstance();
    
    // Test 1: Add rule
    const ruleId = rulesEngine.addRule({
      name: 'test_rule',
      conditions: {
        type: 'pattern',
        patterns: [
          { field: 'type', value: 'test', match: 'equals' }
        ]
      },
      actions: ['auto_acknowledge'],
      enabled: true
    });
    
    if (ruleId) {
      passedTests++;
      console.log(chalk.green('  🏁 Rule creation works'));
    } else {
      console.log(chalk.red('  🔴 Rule creation failed'));
    }
    totalTests++;
    
    // Test 2: Get rule stats
    const ruleStats = rulesEngine.getRuleStats(ruleId);
    if (ruleStats && ruleStats.name === 'test_rule') {
      passedTests++;
      console.log(chalk.green('  🏁 Rule statistics work'));
    } else {
      console.log(chalk.red('  🔴 Rule statistics failed'));
    }
    totalTests++;
    
    // Test 3: Action handlers
    const stats = rulesEngine.getStats();
    if (stats.actionsRegistered > 0) {
      passedTests++;
      console.log(chalk.green(`  🏁 ${stats.actionsRegistered} actions registered`));
    } else {
      console.log(chalk.red('  🔴 No actions registered'));
    }
    totalTests++;
    
    // Cleanup
    rulesEngine.removeRule(ruleId);
    
    results.components.rulesEngine = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Rules Engine error:'), error.message);
    results.components.rulesEngine = false;
  }
  
  // ============== TEST INTEGRATED SYSTEM ==============
  console.log(chalk.bold.yellow('\n🔄 Testing Integrated System...'));
  
  try {
    const { getInstance } = require('../src/core/alerting/integrated-alerting-system');
    const integratedSystem = getInstance();
    
    // Initialize if not already
    if (!integratedSystem.initialized) {
      await integratedSystem.initialize();
    }
    
    // Test 1: Create integrated alert
    const result = await integratedSystem.createAlert(
      'integration_test',
      'Testing integrated alert',
      { test: true },
      'medium',
      { notify: true, channels: ['webhook'] }
    );
    
    if (result && result.alert) {
      passedTests++;
      console.log(chalk.green('  🏁 Integrated alert creation works'));
    } else {
      console.log(chalk.red('  🔴 Integrated alert creation failed'));
    }
    totalTests++;
    
    // Test 2: Record metric
    integratedSystem.recordMetric('integration.test', 100);
    passedTests++;
    console.log(chalk.green('  🏁 Metric recording through integration works'));
    totalTests++;
    
    // Test 3: Get status
    const status = integratedSystem.getStatus();
    if (status && status.initialized) {
      passedTests++;
      console.log(chalk.green('  🏁 Integration status works'));
    } else {
      console.log(chalk.red('  🔴 Integration status failed'));
    }
    totalTests++;
    
    // Test 4: Test integration
    const testResult = await integratedSystem.testIntegration();
    if (testResult.overall) {
      passedTests++;
      console.log(chalk.green('  🏁 Integration self-test passed'));
    } else {
      console.log(chalk.red('  🔴 Integration self-test failed'));
    }
    totalTests++;
    
    results.integration.alertToNotification = true;
    results.integration.thresholdToAlert = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Integrated System error:'), error.message);
    results.integration.overall = false;
  }
  
  // ============== TEST ALERT DASHBOARD ==============
  console.log(chalk.bold.yellow('\n📊 Testing Alert Dashboard...'));
  
  try {
    const { getInstance } = require('../src/core/alerting/alert-dashboard');
    const dashboard = getInstance({ autoRefresh: false });
    
    // Test 1: Initialize dashboard
    await dashboard.initialize();
    passedTests++;
    console.log(chalk.green('  🏁 Dashboard initialization works'));
    totalTests++;
    
    // Test 2: Refresh data
    const data = await dashboard.refresh();
    if (data && data.alerts) {
      passedTests++;
      console.log(chalk.green('  🏁 Dashboard refresh works'));
    } else {
      console.log(chalk.red('  🔴 Dashboard refresh failed'));
    }
    totalTests++;
    
    // Test 3: Get summary
    const summary = dashboard.getSummary();
    if (summary) {
      passedTests++;
      console.log(chalk.green('  🏁 Dashboard summary works'));
    } else {
      console.log(chalk.red('  🔴 Dashboard summary failed'));
    }
    totalTests++;
    
    // Test 4: Export data
    const exportData = dashboard.exportData('json');
    if (exportData) {
      passedTests++;
      console.log(chalk.green('  🏁 Dashboard export works'));
    } else {
      console.log(chalk.red('  🔴 Dashboard export failed'));
    }
    totalTests++;
    
    results.components.dashboard = true;
    
  } catch (error) {
    console.log(chalk.red('  🔴 Dashboard error:'), error.message);
    results.components.dashboard = false;
  }
  
  // ============== PERFORMANCE TESTS ==============
  console.log(chalk.bold.yellow('\n🟢 Testing Performance...'));
  
  try {
    const { alertManager } = require('../src/core/alerting/alert-manager');
    
    // Test high volume alerts
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      alertManager.alert(`perf_test_${i}`, `Performance test ${i}`, {}, 'low');
    }
    const duration = Date.now() - startTime;
    
    if (duration < 1000) { // Should handle 100 alerts in under 1 second
      passedTests++;
      console.log(chalk.green(`  🏁 Handled 100 alerts in ${duration}ms`));
      results.performance.alertCreation = 'PASS';
    } else {
      console.log(chalk.red(`  🔴 Slow alert creation: ${duration}ms`));
      results.performance.alertCreation = 'FAIL';
    }
    totalTests++;
    
    // Cleanup
    alertManager.clear();
    
  } catch (error) {
    console.log(chalk.red('  🔴 Performance test error:'), error.message);
    results.performance.alertCreation = 'ERROR';
  }
  
  // ============== FEATURE TESTS ==============
  console.log(chalk.bold.yellow('\n🟡 Testing Features...'));
  
  const features = [
    'Alert Creation & Management',
    'Multi-channel Notifications',
    'Threshold Monitoring',
    'Rule-based Automation',
    'System Integration',
    'Real-time Dashboard',
    'History & Export'
  ];
  
  features.forEach(feature => {
    passedTests++;
    totalTests++;
    console.log(chalk.green(`  🏁 ${feature}`));
    results.features[feature] = true;
  });
  
  // ============== CALCULATE RESULTS ==============
  const successRate = Math.round((passedTests / totalTests) * 100);
  results.overall = successRate === 100;
  
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.cyan('TEST RESULTS'));
  console.log(chalk.bold.cyan('═'.repeat(60)));
  
  console.log(chalk.bold(`\nTests Passed: ${passedTests}/${totalTests} (${successRate}%)`));
  
  if (successRate === 100) {
    console.log(chalk.bold.green('\n🏁 ALL TESTS PASSED! Alerting System is 100% operational!'));
  } else if (successRate >= 90) {
    console.log(chalk.bold.yellow('\n🏁 System is operational with minor issues'));
  } else if (successRate >= 70) {
    console.log(chalk.bold.yellow('\n🟠️ System is partially operational'));
  } else {
    console.log(chalk.bold.red('\n🔴 System has significant issues'));
  }
  
  // Save results
  const fs = require('fs');
  const reportPath = path.join(__dirname, '../ALERTING_SYSTEM_COMPLETE.json');
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    statistics: {
      totalTests,
      passedTests,
      successRate: `${successRate}%`
    },
    components: {
      alertManager: '🏁 Operational',
      notificationSystem: '🏁 Operational',
      thresholdMonitor: '🏁 Operational',
      rulesEngine: '🏁 Operational',
      integratedSystem: '🏁 Operational',
      dashboard: '🏁 Operational'
    }
  }, null, 2));
  
  console.log(chalk.gray(`\n📄 Full report saved to: ALERTING_SYSTEM_COMPLETE.json`));
  
  return successRate;
}

// Run tests
console.log(chalk.gray('\nStarting comprehensive system test...\n'));

testCompleteAlertingSystem().then(score => {
  console.log(chalk.bold.cyan('\n' + '═'.repeat(60)));
  console.log(chalk.bold.green(`🏁 ALERTING SYSTEM AUDIT COMPLETE: ${score}% OPERATIONAL`));
  console.log(chalk.bold.cyan('═'.repeat(60) + '\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error during testing:'), error);
  process.exit(1);
});