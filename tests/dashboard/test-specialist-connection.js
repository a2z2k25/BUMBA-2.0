/**
 * Test Specialist Registry Connection to Unified Dashboard
 * Sprint 5 Verification
 */

const { getUnifiedDashboard } = require('../../src/core/dashboard/unified-dashboard-manager');
const { logger } = require('../../src/core/logging/bumba-logger');
const chalk = require('chalk');

async function testSpecialistConnection() {
  console.log(chalk.cyan('\n🔧 Testing Specialist Registry Connection to Unified Dashboard\n'));
  
  try {
    // Get dashboard instance
    const dashboard = getUnifiedDashboard();
    
    // Initialize dashboard
    console.log(chalk.yellow('Initializing dashboard with 2 data sources...'));
    await dashboard.initialize();
    
    // Manually trigger a refresh to get immediate data
    console.log(chalk.yellow('Collecting metrics from all sources...'));
    await dashboard.refresh();
    
    // Get current metrics
    const metrics = dashboard.getMetrics();
    
    // Check both timer and specialist metrics
    console.log(chalk.cyan('\n📊 Connected Data Sources:\n'));
    
    // Timer metrics
    if (metrics.resources && metrics.resources.timers) {
      console.log(chalk.green('✅ Timer Registry Connected'));
      console.log(`  Active: ${metrics.resources.timers.active.formatted}`);
      console.log(`  Leak Risk: ${metrics.resources.timers.leakRisk.formatted}`);
    }
    
    // Specialist metrics
    if (metrics.specialists && Object.keys(metrics.specialists).length > 0) {
      console.log(chalk.green('\n✅ Specialist Registry Connected'));
      const specs = metrics.specialists;
      console.log(`  Total: ${specs.total.formatted} specialists`);
      console.log(`  Verified: ${specs.verified.formatted}`);
      console.log(`  Verification Rate: ${specs.verificationRate.formatted}`);
      console.log(`  Health: ${specs.healthy.formatted}`);
      
      if (specs.memorySaved) {
        console.log(`  Memory Saved: ${specs.memorySaved.formatted}`);
      }
    } else {
      console.log(chalk.red('\n❌ Specialist metrics not found'));
    }
    
    // Get dashboard status
    const status = dashboard.getStatus();
    console.log(chalk.cyan('\n📈 Dashboard Status:'));
    console.log(`  Data Sources: ${chalk.green(status.sources)}`);
    console.log(`  Updates: ${chalk.green(status.stats.updates)}`);
    console.log(`  Avg Update Time: ${chalk.green(status.stats.avgUpdateTime)}ms`);
    console.log(`  Cache Size: ${chalk.green(status.cacheSize)}`);
    
    // Shutdown
    dashboard.shutdown();
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run test
testSpecialistConnection().catch(console.error);