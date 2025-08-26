/**
 * Test All 16 Data Sources Connected
 * Verifies 100% dashboard unification
 */

const { getUnifiedDashboard } = require('../../src/core/dashboard/unified-dashboard-manager');
const chalk = require('chalk');

async function testAll16Sources() {
  console.log(chalk.cyan.bold('\n🎯 Testing Complete Dashboard Unification (16 Sources)\n'));
  
  try {
    const dashboard = getUnifiedDashboard();
    
    console.log(chalk.yellow('Initializing unified dashboard...'));
    await dashboard.initialize();
    
    console.log(chalk.yellow('Collecting metrics from all sources...'));
    await dashboard.refresh();
    
    const metrics = dashboard.getMetrics();
    const status = dashboard.getStatus();
    
    console.log(chalk.cyan('\n📊 Data Source Connection Report:\n'));
    
    // Check each expected source
    const sources = [
      { name: 'Timer Registry', check: () => metrics.resources?.timers, status: null },
      { name: 'Specialist Registry', check: () => metrics.specialists, status: null },
      { name: 'Failure Manager', check: () => metrics.errors, status: null },
      { name: 'Circuit Breakers', check: () => metrics.resources?.circuitBreakers, status: null },
      { name: 'Task Flow Registry', check: () => metrics.operations?.taskFlow, status: null },
      { name: 'Validation Metrics', check: () => metrics.validation, status: null },
      { name: 'Configuration Manager', check: () => metrics.configuration, status: null },
      { name: 'Coordination Main', check: () => metrics.collaboration?.coordination?.['coordination-main'], status: null },
      { name: 'Coordination Enhanced', check: () => metrics.collaboration?.coordination?.['coordination-enhanced'], status: null },
      { name: 'Coordination Complete', check: () => metrics.collaboration?.coordination?.['coordination-complete'], status: null },
      { name: 'Coordination UI', check: () => metrics.collaboration?.coordination?.['coordination-ui'], status: null },
      { name: 'Analytics Dashboard', check: () => metrics.analytics, status: null },
      { name: 'Status Dashboard', check: () => metrics.status, status: null },
      { name: 'Alert Dashboard', check: () => metrics.alerts, status: null },
      { name: 'Pooling Metrics', check: () => metrics.pooling, status: null },
      { name: 'Quality Metrics', check: () => metrics.quality, status: null }
    ];
    
    // Check each source
    let connected = 0;
    sources.forEach(source => {
      source.status = source.check() ? 'connected' : 'missing';
      if (source.status === 'connected') connected++;
      
      const icon = source.status === 'connected' ? chalk.green('✅') : chalk.red('❌');
      const statusText = source.status === 'connected' ? chalk.green('Connected') : chalk.red('Not Connected');
      console.log(`  ${icon} ${source.name.padEnd(25)} ${statusText}`);
    });
    
    // Summary
    console.log(chalk.cyan('\n📈 Summary:\n'));
    const percentage = Math.round((connected / 16) * 100);
    const percentageColor = percentage === 100 ? chalk.green : percentage >= 80 ? chalk.yellow : chalk.red;
    
    console.log(`  Connected Sources: ${chalk.bold(connected)}/16 (${percentageColor(percentage + '%')})`);
    console.log(`  Registry Reports: ${status.sources} sources`);
    console.log(`  Updates Performed: ${status.stats.updates}`);
    console.log(`  Avg Update Time: ${status.stats.avgUpdateTime}ms`);
    
    // Metrics breakdown
    console.log(chalk.cyan('\n🔍 Metrics Categories:\n'));
    const categories = ['system', 'resources', 'specialists', 'operations', 'errors', 'validation', 'collaboration', 'integrations', 'alerts'];
    categories.forEach(cat => {
      const hasData = metrics[cat] && Object.keys(metrics[cat]).length > 0;
      const icon = hasData ? '📦' : '📭';
      const status = hasData ? chalk.green('Has Data') : chalk.gray('Empty');
      console.log(`  ${icon} ${cat.padEnd(15)} ${status}`);
    });
    
    // Achievement check
    if (percentage === 100) {
      console.log(chalk.green.bold('\n🎉 ACHIEVEMENT UNLOCKED: 100% Dashboard Unification!'));
      console.log(chalk.green('All 16 dashboard sources are successfully connected and unified!'));
    } else if (percentage >= 80) {
      console.log(chalk.yellow(`\n⚠️  Nearly Complete: ${16 - connected} sources remaining`));
    } else {
      console.log(chalk.red(`\n❌ Incomplete: ${16 - connected} sources still need connection`));
    }
    
    // Cleanup
    dashboard.shutdown();
    
    process.exit(connected === 16 ? 0 : 1);
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run test
testAll16Sources().catch(console.error);