/**
 * Test 5 Data Sources Connected
 * Sprint 8 Verification
 */

const { getUnifiedDashboard } = require('../../src/core/dashboard/unified-dashboard-manager');
const chalk = require('chalk');

async function test5Sources() {
  console.log(chalk.cyan('\n🔧 Testing 5 Data Sources\n'));
  
  try {
    const dashboard = getUnifiedDashboard();
    await dashboard.initialize();
    await dashboard.refresh();
    
    const metrics = dashboard.getMetrics();
    const status = dashboard.getStatus();
    
    console.log(chalk.cyan('Connected Sources:'));
    console.log(`✅ Timer Registry: ${metrics.resources?.timers ? 'Connected' : 'Missing'}`);
    console.log(`✅ Specialist Registry: ${metrics.specialists ? 'Connected' : 'Missing'}`);
    console.log(`✅ Failure Manager: ${metrics.errors ? 'Connected' : 'Missing'}`);
    console.log(`✅ Circuit Breakers: ${metrics.resources?.circuitBreakers ? 'Connected' : 'Missing'}`);
    console.log(`✅ Task Flow: ${metrics.operations?.taskFlow ? 'Connected' : 'Missing'}`);
    
    console.log(chalk.green(`\nTotal: ${status.sources}/16 sources connected (${Math.round(status.sources/16*100)}%)`));
    
    dashboard.shutdown();
  } catch (error) {
    console.error(chalk.red('Test failed:'), error);
    process.exit(1);
  }
}

test5Sources().catch(console.error);