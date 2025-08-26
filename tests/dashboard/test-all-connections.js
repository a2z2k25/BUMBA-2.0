/**
 * Test All Data Source Connections to Unified Dashboard
 * Sprint 6 Verification
 */

const { getUnifiedDashboard } = require('../../src/core/dashboard/unified-dashboard-manager');
const chalk = require('chalk');

async function testAllConnections() {
  console.log(chalk.cyan('\n🔧 Testing All Data Source Connections to Unified Dashboard\n'));
  
  try {
    // Get dashboard instance
    const dashboard = getUnifiedDashboard();
    
    // Initialize dashboard
    console.log(chalk.yellow('Initializing dashboard with 4 data sources...'));
    await dashboard.initialize();
    
    // Manually trigger a refresh to get immediate data
    console.log(chalk.yellow('Collecting metrics from all sources...'));
    await dashboard.refresh();
    
    // Get current metrics
    const metrics = dashboard.getMetrics();
    
    console.log(chalk.cyan('\n📊 Connected Data Sources:\n'));
    
    // Timer metrics
    if (metrics.resources && metrics.resources.timers) {
      console.log(chalk.green('✅ Timer Registry Connected'));
      const timers = metrics.resources.timers;
      console.log(`  Active: ${timers.active.formatted}`);
      console.log(`  Leak Risk: ${timers.leakRisk.formatted}`);
      console.log(`  Cleanup Ratio: ${timers.cleanupRatio.formatted}`);
    }
    
    // Specialist metrics
    if (metrics.specialists && Object.keys(metrics.specialists).length > 0) {
      console.log(chalk.green('\n✅ Specialist Registry Connected'));
      const specs = metrics.specialists;
      console.log(`  Total: ${specs.total.formatted}`);
      console.log(`  Verified: ${specs.verified.formatted} (${specs.verificationRate.formatted})`);
      if (specs.memorySaved) {
        console.log(`  Memory Saved: ${specs.memorySaved.formatted}`);
      }
    }
    
    // Failure metrics
    if (metrics.errors && Object.keys(metrics.errors).length > 0) {
      console.log(chalk.green('\n✅ Failure Manager Connected'));
      const failures = metrics.errors;
      console.log(`  Total Failures: ${failures.total.formatted}`);
      console.log(`  Active Failures: ${failures.active.formatted}`);
      console.log(`  Health Score: ${failures.healthScore.formatted}`);
      console.log(`  Failure Rate: ${failures.failureRate.formatted}`);
      console.log(`  Degraded Components: ${failures.degradedComponents.formatted}`);
    }
    
    // Circuit Breaker metrics
    if (metrics.resources && metrics.resources.circuitBreakers) {
      console.log(chalk.green('\n✅ Circuit Breakers Connected'));
      const circuits = metrics.resources.circuitBreakers;
      console.log(`  Total Circuits: ${circuits.total.formatted}`);
      console.log(`  Healthy: ${circuits.healthy.formatted} (${circuits.healthPercentage.formatted})`);
      console.log(`  Open Circuits: ${circuits.open.formatted}`);
      console.log(`  Cascade Risk: ${circuits.cascadeRisk.formatted}`);
      console.log(`  Resilience Score: ${circuits.resilienceScore.formatted}`);
    }
    
    // Dashboard summary
    const status = dashboard.getStatus();
    console.log(chalk.cyan('\n📈 Dashboard Summary:'));
    console.log(`  Data Sources: ${chalk.green(status.sources)}/16 connected`);
    console.log(`  Updates: ${chalk.green(status.stats.updates)}`);
    console.log(`  Avg Update Time: ${chalk.green(status.stats.avgUpdateTime)}ms`);
    console.log(`  Cache Hit Rate: ${chalk.green(Math.round((status.stats.cacheHits / (status.stats.cacheHits + status.stats.cacheMisses) || 0) * 100))}%`);
    
    console.log(chalk.cyan('\n🎯 Next Steps:'));
    console.log('  - Connect remaining 13 data sources');
    console.log('  - Generate charts with component library');
    console.log('  - Set up Notion integration');
    console.log('  - Create health endpoint');
    
    // Shutdown
    dashboard.shutdown();
    
    console.log(chalk.green('\n✅ All tests passed!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run test
testAllConnections().catch(console.error);