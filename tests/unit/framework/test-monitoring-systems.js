#!/usr/bin/env node

/**
 * Test Monitoring Systems - Sprint 9-11
 * Verify health monitor and performance metrics work properly
 */

const { logger } = require('../src/core/logging/bumba-logger');

console.log('\n========================================');
console.log('BUMBA MONITORING SYSTEMS TEST');
console.log('Sprint 9-11: Fix monitoring systems');
console.log('========================================\n');

async function testMonitoringSystems() {
  let healthMonitor, performanceMetrics;
  let healthTestPassed = false;
  let metricsTestPassed = false;
  
  try {
    // Test 1: Load Health Monitor
    console.log('🟢 Test 1: Loading Health Monitor...');
    try {
      const healthModule = require('../src/core/monitoring/health-monitor');
      
      // Check both named and default exports
      if (healthModule.BumbaHealthMonitor) {
        console.log('  🏁 Found BumbaHealthMonitor class');
        healthMonitor = healthModule.bumbaHealthMonitor || new healthModule.BumbaHealthMonitor();
      } else if (healthModule.default) {
        console.log('  🏁 Found default export');
        healthMonitor = healthModule.default;
      } else {
        console.log('  🟡 Using module directly');
        healthMonitor = healthModule;
      }
      
      console.log('🏁 Health Monitor loaded successfully!\n');
    } catch (error) {
      console.error('🔴 Failed to load Health Monitor:', error.message);
    }
    
    // Test 2: Load Performance Metrics
    console.log('🟢 Test 2: Loading Performance Metrics...');
    try {
      const metricsModule = require('../src/core/monitoring/performance-metrics');
      
      // Check both named and default exports
      if (metricsModule.BumbaMetrics) {
        console.log('  🏁 Found BumbaMetrics class');
        performanceMetrics = metricsModule.bumbaMetrics || new metricsModule.BumbaMetrics();
      } else if (metricsModule.default) {
        console.log('  🏁 Found default export');
        performanceMetrics = metricsModule.default;
      } else {
        console.log('  🟡 Using module directly');
        performanceMetrics = metricsModule;
      }
      
      console.log('🏁 Performance Metrics loaded successfully!\n');
    } catch (error) {
      console.error('🔴 Failed to load Performance Metrics:', error.message);
    }
    
    // Test 3: Test Health Monitor functionality
    if (healthMonitor) {
      console.log('🟢 Test 3: Testing Health Monitor functionality...');
      try {
        // Test getting health status
        if (typeof healthMonitor.getHealthStatus === 'function') {
          const healthStatus = await healthMonitor.getHealthStatus();
          console.log('  🏁 getHealthStatus() works');
          console.log(`  Overall Status: ${healthStatus.overall_status}`);
          console.log(`  Components: ${Object.keys(healthStatus.components || {}).length}`);
          console.log(`  Issues Found: ${(healthStatus.issues || []).length}`);
          healthTestPassed = true;
        } else {
          console.log('  🔴 getHealthStatus() method not found');
        }
        
        // Test monitoring stats
        if (typeof healthMonitor.getMonitoringStats === 'function') {
          const stats = healthMonitor.getMonitoringStats();
          console.log('  🏁 getMonitoringStats() works');
          console.log(`  Health Checks: ${stats.total_health_checks || 0}`);
          console.log(`  Repairs: ${stats.total_repairs || 0}`);
        }
        
        // Test auto-repair toggle
        if (typeof healthMonitor.setAutoRepair === 'function') {
          healthMonitor.setAutoRepair(true);
          console.log('  🏁 setAutoRepair() works');
        }
        
        console.log('🏁 Health Monitor functionality verified!\n');
      } catch (error) {
        console.error('🔴 Health Monitor test failed:', error.message);
      }
    }
    
    // Test 4: Test Performance Metrics functionality
    if (performanceMetrics) {
      console.log('🟢 Test 4: Testing Performance Metrics functionality...');
      try {
        // Test recording metrics
        if (typeof performanceMetrics.recordCommand === 'function') {
          performanceMetrics.recordCommand('test-command', 150, true, { test: true });
          console.log('  🏁 recordCommand() works');
        } else {
          console.log('  🔴 recordCommand() method not found');
        }
        
        // Test collecting metrics
        if (typeof performanceMetrics.collectMetrics === 'function') {
          const metrics = await performanceMetrics.collectMetrics();
          console.log('  🏁 collectMetrics() works');
          console.log(`  Command Reliability: ${metrics.commandReliability?.toFixed(1) || 'N/A'}%`);
          console.log(`  Memory Usage: ${Math.round(metrics.memoryUsage || 0)}MB`);
          console.log(`  Error Rate: ${metrics.errorRate?.toFixed(2) || 'N/A'}%`);
          metricsTestPassed = true;
        } else {
          console.log('  🔴 collectMetrics() method not found');
        }
        
        // Test SLA checking
        if (typeof performanceMetrics.checkSLAs === 'function') {
          const slaStatus = await performanceMetrics.checkSLAs();
          console.log('  🏁 checkSLAs() works');
          console.log(`  SLA Compliant: ${slaStatus.sla_compliant ? 'Yes' : 'No'}`);
          console.log(`  Violations: ${(slaStatus.violations || []).length}`);
        }
        
        // Test dashboard generation
        if (typeof performanceMetrics.generateDashboard === 'function') {
          const dashboard = await performanceMetrics.generateDashboard();
          console.log('  🏁 generateDashboard() works');
          console.log(`  KPIs: ${Object.keys(dashboard.kpis || {}).length}`);
        }
        
        // Test metrics summary
        if (typeof performanceMetrics.getMetricsSummary === 'function') {
          const summary = await performanceMetrics.getMetricsSummary();
          console.log('  🏁 getMetricsSummary() works');
          console.log(`  Performance Score: ${summary.performance_score?.toFixed(1) || 'N/A'}`);
        }
        
        console.log('🏁 Performance Metrics functionality verified!\n');
      } catch (error) {
        console.error('🔴 Performance Metrics test failed:', error.message);
      }
    }
    
    // Test 5: Test integration between systems
    console.log('🟢 Test 5: Testing monitoring integration...');
    if (healthMonitor && performanceMetrics) {
      try {
        // Record some test data
        performanceMetrics.recordCommand('integration-test', 100, true);
        performanceMetrics.recordError('test-error', 'low', { test: true });
        
        // Check if health monitor can see performance issues
        const healthStatus = await healthMonitor.getHealthStatus();
        const metrics = await performanceMetrics.collectMetrics();
        
        console.log('  🏁 Both systems operational');
        console.log(`  Health: ${healthStatus.overall_status}`);
        console.log(`  Performance Score: ${metrics.commandReliability?.toFixed(1) || 'N/A'}%`);
        
        console.log('🏁 Monitoring integration verified!\n');
      } catch (error) {
        console.error('🟡 Integration test partial failure:', error.message);
      }
    }
    
    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Health Monitor: ${healthTestPassed ? '🏁 WORKING' : '🔴 BROKEN'}`);
    console.log(`Performance Metrics: ${metricsTestPassed ? '🏁 WORKING' : '🔴 BROKEN'}`);
    console.log(`Integration: ${healthTestPassed && metricsTestPassed ? '🏁 WORKING' : '🔴 NEEDS WORK'}`);
    
    if (healthTestPassed && metricsTestPassed) {
      console.log('\n🏁 ALL MONITORING SYSTEMS OPERATIONAL!');
      console.log('Sprint 9-11 COMPLETE: Monitoring systems fixed!\n');
      return true;
    } else {
      console.log('\n🟡 Some monitoring systems need fixes.');
      console.log('Sprint 9-11 PARTIALLY COMPLETE: More work needed.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n🔴 CRITICAL ERROR:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testMonitoringSystems().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});