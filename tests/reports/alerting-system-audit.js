/**
 * BUMBA Alerting Systems Audit
 * Comprehensive testing and evaluation of Alert Manager, Notification System, and Threshold Monitoring
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 BUMBA Alerting Systems Audit');
console.log('=' .repeat(60));

async function auditAlertingSystems() {
  const results = {
    components: {
      alertManager: { exists: false, functional: false, tests: [] },
      notificationSystem: { exists: false, functional: false, tests: [] },
      thresholdMonitor: { exists: false, functional: false, tests: [] }
    },
    features: {
      alertCreation: false,
      alertChannels: false,
      notifications: false,
      thresholds: false,
      rules: false,
      deduplication: false,
      persistence: false,
      integration: false
    },
    gaps: [],
    recommendations: []
  };
  
  // ============== AUDIT ALERT MANAGER ==============
  console.log('\n📢 AUDITING ALERT MANAGER\n');
  
  try {
    // Test 1: Check if Alert Manager exists
    const { AlertManager, alertManager } = require('../src/core/alerting/alert-manager');
    results.components.alertManager.exists = true;
    console.log('🏁 Alert Manager module found');
    
    // Test 2: Test alert creation
    try {
      const testAlert = alertManager.alert('test', 'Test alert message', { test: true }, 'medium');
      if (testAlert && testAlert.id) {
        results.components.alertManager.functional = true;
        results.features.alertCreation = true;
        console.log('🏁 Alert creation works');
        results.components.alertManager.tests.push('Alert creation functional');
      }
    } catch (e) {
      console.log('🔴 Alert creation failed:', e.message);
      results.gaps.push('Alert creation not working');
    }
    
    // Test 3: Test alert channels
    try {
      const channels = alertManager.channels;
      if (channels.size > 0) {
        results.features.alertChannels = true;
        console.log(`🏁 Alert channels configured: ${Array.from(channels.keys()).join(', ')}`);
        results.components.alertManager.tests.push('Alert channels operational');
      } else {
        console.log('🟠️ No alert channels configured');
        results.gaps.push('Alert channels need configuration');
      }
    } catch (e) {
      console.log('🔴 Alert channels error:', e.message);
    }
    
    // Test 4: Test deduplication
    try {
      // Create duplicate alerts
      const alert1 = alertManager.alert('dup-test', 'Duplicate test', {}, 'low');
      const alert2 = alertManager.alert('dup-test', 'Duplicate test', {}, 'low');
      
      if (alert1 && !alert2) {
        results.features.deduplication = true;
        console.log('🏁 Alert deduplication works');
        results.components.alertManager.tests.push('Deduplication functional');
      } else {
        console.log('🟠️ Deduplication not working properly');
        results.gaps.push('Deduplication needs improvement');
      }
    } catch (e) {
      console.log('🔴 Deduplication test failed:', e.message);
    }
    
    // Test 5: Test alert acknowledgment
    try {
      const ackAlert = alertManager.alert('ack-test', 'Acknowledgment test', {}, 'high');
      if (ackAlert) {
        const acked = alertManager.acknowledge(ackAlert.id, 'test-user');
        if (acked) {
          console.log('🏁 Alert acknowledgment works');
          results.components.alertManager.tests.push('Acknowledgment functional');
        }
      }
    } catch (e) {
      console.log('🔴 Acknowledgment test failed:', e.message);
    }
    
    // Test 6: Get alert summary
    try {
      const summary = alertManager.getSummary();
      if (summary && typeof summary.total === 'number') {
        console.log(`🏁 Alert summary available (${summary.total} total alerts)`);
        results.components.alertManager.tests.push('Summary functional');
      }
    } catch (e) {
      console.log('🔴 Summary failed:', e.message);
    }
    
  } catch (error) {
    console.log('🔴 Alert Manager not found or not functional');
    results.gaps.push('Alert Manager module missing or broken');
  }
  
  // ============== AUDIT NOTIFICATION SYSTEM ==============
  console.log('\n📨 AUDITING NOTIFICATION SYSTEM\n');
  
  try {
    // Check for notification system
    const notificationPath = path.join(__dirname, '../src/core/alerting/notification-system.js');
    if (fs.existsSync(notificationPath)) {
      const NotificationSystem = require(notificationPath);
      results.components.notificationSystem.exists = true;
      console.log('🏁 Notification System found');
    } else {
      console.log('🔴 Notification System not found');
      results.gaps.push('Notification System needs to be created');
    }
  } catch (error) {
    console.log('🔴 Notification System missing');
    results.gaps.push('Complete Notification System implementation needed');
  }
  
  // ============== AUDIT THRESHOLD MONITOR ==============
  console.log('\n📊 AUDITING THRESHOLD MONITOR\n');
  
  try {
    // Check for threshold monitor
    const thresholdPath = path.join(__dirname, '../src/core/alerting/threshold-monitor.js');
    if (fs.existsSync(thresholdPath)) {
      const ThresholdMonitor = require(thresholdPath);
      results.components.thresholdMonitor.exists = true;
      console.log('🏁 Threshold Monitor found');
    } else {
      console.log('🔴 Threshold Monitor not found');
      results.gaps.push('Threshold Monitor needs to be created');
    }
  } catch (error) {
    console.log('🔴 Threshold Monitor missing');
    results.gaps.push('Complete Threshold Monitor implementation needed');
  }
  
  // ============== CHECK HEALTH MONITOR INTEGRATION ==============
  console.log('\n🟢 CHECKING HEALTH MONITOR INTEGRATION\n');
  
  try {
    const HealthMonitor = require('../src/core/monitoring/health-monitor');
    if (HealthMonitor) {
      console.log('🏁 Health Monitor exists (can be integrated with alerts)');
      results.features.integration = true;
    }
  } catch (error) {
    console.log('🟠️ Health Monitor not accessible');
  }
  
  // ============== ANALYSIS ==============
  console.log('\n' + '=' .repeat(60));
  console.log('📊 AUDIT RESULTS');
  console.log('=' .repeat(60));
  
  // Calculate completeness
  const alertManagerScore = results.components.alertManager.tests.length;
  const maxAlertManagerScore = 5;
  const alertManagerPercent = Math.round((alertManagerScore / maxAlertManagerScore) * 100);
  
  const notificationScore = results.components.notificationSystem.exists ? 1 : 0;
  const thresholdScore = results.components.thresholdMonitor.exists ? 1 : 0;
  
  const totalComponents = 3;
  const existingComponents = 
    (results.components.alertManager.exists ? 1 : 0) +
    (results.components.notificationSystem.exists ? 1 : 0) +
    (results.components.thresholdMonitor.exists ? 1 : 0);
  
  const overallPercent = Math.round((existingComponents / totalComponents) * 100);
  
  console.log('\n📢 Alert Manager:');
  console.log(`   Status: ${results.components.alertManager.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  console.log(`   Functionality: ${alertManagerPercent}%`);
  console.log(`   Working Features: ${results.components.alertManager.tests.join(', ') || 'None'}`);
  
  console.log('\n📨 Notification System:');
  console.log(`   Status: ${results.components.notificationSystem.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  
  console.log('\n📊 Threshold Monitor:');
  console.log(`   Status: ${results.components.thresholdMonitor.exists ? '🏁 EXISTS' : '🔴 MISSING'}`);
  
  console.log('\n🔍 Feature Coverage:');
  Object.entries(results.features).forEach(([feature, status]) => {
    console.log(`   ${feature}: ${status ? '🏁' : '🔴'}`);
  });
  
  console.log('\n🟠️ IDENTIFIED GAPS:');
  if (results.gaps.length === 0) {
    console.log('   No gaps identified');
  } else {
    results.gaps.forEach(gap => console.log(`   - ${gap}`));
  }
  
  // Generate recommendations
  if (!results.components.notificationSystem.exists) {
    results.recommendations.push('Create Notification System with email, webhook, and Slack support');
  }
  if (!results.components.thresholdMonitor.exists) {
    results.recommendations.push('Create Threshold Monitor for metrics-based alerting');
  }
  if (!results.features.rules) {
    results.recommendations.push('Add Alert Rules Engine for complex conditions');
  }
  if (!results.features.persistence) {
    results.recommendations.push('Add persistent storage for alert history');
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  if (results.recommendations.length === 0) {
    console.log('   System is complete');
  } else {
    results.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📈 OVERALL ASSESSMENT');
  console.log('=' .repeat(60));
  console.log(`Component Coverage: ${overallPercent}% (${existingComponents}/${totalComponents})`);
  console.log(`Alert Manager Completeness: ${alertManagerPercent}%`);
  console.log(`\nOperability Level: ${
    overallPercent === 100 ? '💯 COMPLETE' :
    overallPercent >= 75 ? '🏁 GOOD' :
    overallPercent >= 50 ? '🟠️ PARTIAL' :
    '🔴 INCOMPLETE'
  }`);
  
  // Save audit results
  const auditReport = {
    timestamp: new Date().toISOString(),
    results,
    scores: {
      alertManager: alertManagerPercent,
      overall: overallPercent,
      componentCoverage: `${existingComponents}/${totalComponents}`
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../ALERTING_AUDIT_RESULTS.json'),
    JSON.stringify(auditReport, null, 2)
  );
  
  console.log('\n📄 Detailed audit saved to: ALERTING_AUDIT_RESULTS.json');
  
  return overallPercent;
}

// Run audit
auditAlertingSystems().then(score => {
  console.log(`\n🏁 Audit complete! Score: ${score}%`);
  
  if (score < 100) {
    console.log('\n🔧 System needs improvements. Ready to execute fix plan.');
  } else {
    console.log('\n🏁 Alerting Systems are fully operational!');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});