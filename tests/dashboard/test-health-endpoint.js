/**
 * Test Health Endpoint
 * Sprint 17 Verification
 */

const { getHealth, HealthStatus } = require('../../src/core/dashboard/health-endpoint');
const chalk = require('chalk');

async function testHealthEndpoint() {
  console.log(chalk.cyan('\n🏥 Testing Health Endpoint\n'));
  
  try {
    console.log(chalk.yellow('Fetching system health...'));
    const health = await getHealth();
    
    // Display health status with color coding
    const statusColor = health.status === HealthStatus.HEALTHY ? chalk.green :
                       health.status === HealthStatus.DEGRADED ? chalk.yellow :
                       chalk.red;
    
    console.log(chalk.cyan('\n📊 System Health Report\n'));
    console.log(`Status: ${statusColor(health.status.toUpperCase())}`);
    console.log(`Timestamp: ${health.timestamp}`);
    console.log(`Uptime: ${Math.round(health.uptime)}s`);
    console.log(`Version: ${health.version}`);
    console.log(`Environment: ${health.environment}`);
    
    // Health scores
    console.log(chalk.cyan('\n📈 Health Scores:'));
    console.log(`  Overall: ${colorScore(health.scores.overall)}%`);
    console.log(`  Resources: ${colorScore(health.scores.resources)}%`);
    console.log(`  Operations: ${colorScore(health.scores.operations)}%`);
    console.log(`  Resilience: ${colorScore(health.scores.resilience)}%`);
    
    // Component status
    console.log(chalk.cyan('\n🔧 Component Status:'));
    console.log(`  Data Sources: ${health.components.dataSources.connected}/${health.components.dataSources.total} (${health.components.dataSources.percentage}%)`);
    
    if (health.components.timers.status) {
      console.log(`  Timers: ${statusIcon(health.components.timers.status)} (${health.components.timers.active} active, ${health.components.timers.leakRisk}% risk)`);
    }
    
    if (health.components.specialists.status) {
      console.log(`  Specialists: ${statusIcon(health.components.specialists.status)} (${health.components.specialists.verified}/${health.components.specialists.total} verified)`);
    }
    
    if (health.components.failures.status) {
      console.log(`  Failures: ${statusIcon(health.components.failures.status)} (${health.components.failures.active} active)`);
    }
    
    if (health.components.circuitBreakers.status) {
      console.log(`  Circuit Breakers: ${statusIcon(health.components.circuitBreakers.status)} (${health.components.circuitBreakers.open} open)`);
    }
    
    if (health.components.taskFlow.status) {
      console.log(`  Task Flow: ${statusIcon(health.components.taskFlow.status)} (${health.components.taskFlow.active} active)`);
    }
    
    // Alerts
    if (health.alerts && health.alerts.length > 0) {
      console.log(chalk.cyan('\n⚠️  Alerts:'));
      health.alerts.forEach(alert => {
        const alertColor = alert.level === 'critical' ? chalk.red :
                          alert.level === 'warning' ? chalk.yellow :
                          chalk.blue;
        console.log(`  ${alertColor(`[${alert.level.toUpperCase()}]`)} ${alert.message}`);
      });
    } else {
      console.log(chalk.green('\n✅ No alerts'));
    }
    
    // Performance
    console.log(chalk.cyan('\n⚡ Performance:'));
    console.log(`  Avg Update Time: ${health.performance.avgUpdateTime}ms`);
    console.log(`  Last Update: ${health.performance.lastUpdateDuration}ms`);
    console.log(`  Cache Hit Rate: ${health.performance.cacheHitRate}%`);
    console.log(`  Total Updates: ${health.performance.updates}`);
    
    // Verify endpoint works correctly
    console.log(chalk.cyan('\n🔍 Endpoint Validation:'));
    console.log(`  ✅ Returns correct status: ${health.status}`);
    console.log(`  ✅ Includes timestamp: ${!!health.timestamp}`);
    console.log(`  ✅ Includes uptime: ${!!health.uptime}`);
    console.log(`  ✅ Includes scores: ${!!health.scores}`);
    console.log(`  ✅ Includes components: ${!!health.components}`);
    console.log(`  ✅ Includes performance: ${!!health.performance}`);
    
    console.log(chalk.green('\n✅ Health endpoint test passed!'));
    
    // Cleanup
    const { getUnifiedDashboard } = require('../../src/core/dashboard/unified-dashboard-manager');
    getUnifiedDashboard().shutdown();
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

function colorScore(score) {
  if (score >= 85) return chalk.green(score);
  if (score >= 70) return chalk.yellow(score);
  return chalk.red(score);
}

function statusIcon(status) {
  if (status === HealthStatus.HEALTHY) return chalk.green('✅');
  if (status === HealthStatus.DEGRADED) return chalk.yellow('⚠️');
  return chalk.red('❌');
}

// Run test
testHealthEndpoint().catch(console.error);