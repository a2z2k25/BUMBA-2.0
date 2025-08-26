/**
 * Test Timer Registry Connection to Unified Dashboard
 * Sprint 4 Verification
 */

const { getUnifiedDashboard } = require('../../src/core/dashboard/unified-dashboard-manager');
const { logger } = require('../../src/core/logging/bumba-logger');
const chalk = require('chalk');

async function testTimerConnection() {
  console.log(chalk.cyan('\n🔧 Testing Timer Registry Connection to Unified Dashboard\n'));
  
  try {
    // Get dashboard instance
    const dashboard = getUnifiedDashboard();
    
    // Initialize dashboard
    console.log(chalk.yellow('Initializing dashboard...'));
    await dashboard.initialize();
    
    // Manually trigger a refresh to get immediate data
    console.log(chalk.yellow('Collecting metrics...'));
    await dashboard.refresh();
    
    // Get current metrics
    const metrics = dashboard.getMetrics();
    
    // Check if timer metrics exist
    if (metrics.resources && metrics.resources.timers) {
      console.log(chalk.green('\n✅ Timer metrics successfully connected!\n'));
      
      console.log(chalk.cyan('Timer Metrics:'));
      const timerMetrics = metrics.resources.timers;
      
      Object.entries(timerMetrics).forEach(([key, metric]) => {
        console.log(`  ${chalk.yellow(key)}: ${chalk.white(metric.formatted)} (${metric.metadata.description})`);
      });
      
      // Get dashboard status
      const status = dashboard.getStatus();
      console.log(chalk.cyan('\nDashboard Status:'));
      console.log(`  Data Sources: ${chalk.green(status.sources)}`);
      console.log(`  Updates: ${chalk.green(status.stats.updates)}`);
      console.log(`  Avg Update Time: ${chalk.green(status.stats.avgUpdateTime)}ms`);
      console.log(`  Cache Size: ${chalk.green(status.cacheSize)}`);
      
    } else {
      console.log(chalk.red('\n❌ Timer metrics not found in dashboard'));
      console.log('Current metrics structure:', JSON.stringify(metrics, null, 2));
    }
    
    // Shutdown
    dashboard.shutdown();
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run test
testTimerConnection().catch(console.error);