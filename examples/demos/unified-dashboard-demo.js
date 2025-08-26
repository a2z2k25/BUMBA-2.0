#!/usr/bin/env node

/**
 * BUMBA Unified Dashboard Demo
 * Demonstrates the unified dashboard consolidating 16 dashboards into 1
 * 
 * Day 5 Sprint 19: Final Demo
 */

const chalk = require('chalk');
const { getUnifiedDashboard } = require('../src/core/dashboard/unified-dashboard-manager');
const { getHealth, HealthStatus } = require('../src/core/dashboard/health-endpoint');

// Demo configuration
const DEMO_STEPS = [
  'initialize',
  'showSources', 
  'collectMetrics',
  'showHealth',
  'simulateLoad',
  'showAlerts',
  'cleanup'
];

async function runDemo() {
  console.clear();
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           BUMBA Unified Dashboard System Demo               ║
║                                                              ║
║         Consolidating 16 Dashboards into 1 System           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `));
  
  await sleep(2000);
  
  try {
    // Step 1: Initialize
    await step1_initialize();
    
    // Step 2: Show Connected Sources
    await step2_showSources();
    
    // Step 3: Collect and Display Metrics
    await step3_collectMetrics();
    
    // Step 4: Show Health Status
    await step4_showHealth();
    
    // Step 5: Simulate Load
    await step5_simulateLoad();
    
    // Step 6: Show Alerts
    await step6_showAlerts();
    
    // Step 7: Cleanup
    await step7_cleanup();
    
    // Success
    console.log(chalk.green.bold('\n✅ Demo Complete!\n'));
    console.log(chalk.cyan('The unified dashboard successfully:'));
    console.log('  • Consolidated metrics from 5 critical systems');
    console.log('  • Provided real-time health monitoring');
    console.log('  • Generated alerts for issues');
    console.log('  • Eliminated dashboard redundancy');
    console.log('  • Standardized data collection\n');
    
  } catch (error) {
    console.error(chalk.red('\n❌ Demo failed:'), error);
    process.exit(1);
  }
}

async function step1_initialize() {
  console.log(chalk.yellow('\n📊 Step 1: Initializing Unified Dashboard System...\n'));
  
  const dashboard = getUnifiedDashboard();
  await dashboard.initialize();
  
  console.log(chalk.green('✅ Dashboard initialized'));
  console.log(chalk.gray('   Event-driven architecture active'));
  console.log(chalk.gray('   Caching system enabled'));
  console.log(chalk.gray('   History tracking configured'));
  
  await sleep(1500);
}

async function step2_showSources() {
  console.log(chalk.yellow('\n🔌 Step 2: Connected Data Sources\n'));
  
  const dashboard = getUnifiedDashboard();
  const status = dashboard.getStatus();
  
  console.log(chalk.cyan(`Connected: ${status.sources}/16 sources (${Math.round(status.sources/16*100)}%)\n`));
  
  const sources = [
    { name: 'Timer Registry', status: '✅', desc: 'Memory leak prevention' },
    { name: 'Specialist Registry', status: '✅', desc: '78+ specialists' },
    { name: 'Failure Manager', status: '✅', desc: 'Error tracking' },
    { name: 'Circuit Breakers', status: '✅', desc: 'Cascade prevention' },
    { name: 'Task Flow Registry', status: '✅', desc: 'Request tracing' },
    { name: 'Validation Manager', status: '⏳', desc: 'Not connected' },
    { name: 'Capability Manager', status: '⏳', desc: 'Not connected' },
    { name: 'Config Manager', status: '⏳', desc: 'Not connected' },
    { name: '...8 more sources', status: '⏳', desc: 'Pending migration' }
  ];
  
  sources.forEach(source => {
    const statusColor = source.status === '✅' ? chalk.green : chalk.gray;
    console.log(`  ${statusColor(source.status)} ${source.name.padEnd(20)} ${chalk.gray(source.desc)}`);
  });
  
  await sleep(2000);
}

async function step3_collectMetrics() {
  console.log(chalk.yellow('\n📈 Step 3: Collecting Metrics from All Sources...\n'));
  
  const dashboard = getUnifiedDashboard();
  await dashboard.refresh();
  
  const metrics = dashboard.getMetrics();
  
  // Display key metrics
  console.log(chalk.cyan('Key Metrics:'));
  
  if (metrics.resources?.timers) {
    console.log(`  • Timers: ${metrics.resources.timers.active.value} active, ${metrics.resources.timers.leakRisk.value}% leak risk`);
  }
  
  if (metrics.specialists) {
    console.log(`  • Specialists: ${metrics.specialists.verified.value}/${metrics.specialists.total.value} verified`);
  }
  
  if (metrics.errors) {
    console.log(`  • Failures: ${metrics.errors.total.value} total, ${metrics.errors.active.value} active`);
  }
  
  if (metrics.resources?.circuitBreakers) {
    console.log(`  • Circuits: ${metrics.resources.circuitBreakers.healthy.value}/${metrics.resources.circuitBreakers.total.value} healthy`);
  }
  
  if (metrics.operations?.taskFlow) {
    console.log(`  • Task Flows: ${metrics.operations.taskFlow.active.value} active, ${metrics.operations.taskFlow.completed.value} completed`);
  }
  
  await sleep(2000);
}

async function step4_showHealth() {
  console.log(chalk.yellow('\n🏥 Step 4: System Health Assessment\n'));
  
  const health = await getHealth();
  
  // Status with color
  const statusColor = health.status === HealthStatus.HEALTHY ? chalk.green :
                     health.status === HealthStatus.DEGRADED ? chalk.yellow :
                     chalk.red;
  
  console.log(`Overall Status: ${statusColor(health.status.toUpperCase())}\n`);
  
  // Health scores with visual bars
  console.log(chalk.cyan('Health Scores:'));
  console.log(`  Overall:     ${drawBar(health.scores.overall)} ${health.scores.overall}%`);
  console.log(`  Resources:   ${drawBar(health.scores.resources)} ${health.scores.resources}%`);
  console.log(`  Operations:  ${drawBar(health.scores.operations)} ${health.scores.operations}%`);
  console.log(`  Resilience:  ${drawBar(health.scores.resilience)} ${health.scores.resilience}%`);
  
  await sleep(2000);
}

async function step5_simulateLoad() {
  console.log(chalk.yellow('\n⚡ Step 5: Simulating System Load...\n'));
  
  // Create some task flows
  const { getTaskFlowRegistry } = require('../src/core/tracing/task-flow');
  const taskRegistry = getTaskFlowRegistry();
  
  console.log(chalk.gray('Creating task flows...'));
  const flow1 = taskRegistry.createFlow('demo-flow-1', { type: 'demo' });
  const flow2 = taskRegistry.createFlow('demo-flow-2', { type: 'demo' });
  
  flow1.addStep('dashboard', 'collect', { significant: true });
  flow2.addStep('dashboard', 'aggregate', { significant: true });
  
  // Trigger some timer activity
  const { getTimerRegistry } = require('../src/core/timers/timer-registry');
  const timerRegistry = getTimerRegistry();
  
  timerRegistry.setTimeout('demo-timer-1', () => {}, 1000, 'Demo timer');
  timerRegistry.setInterval('demo-interval-1', () => {}, 5000, 'Demo interval');
  
  console.log(chalk.gray('Load simulation active...'));
  await sleep(1000);
  
  // Refresh metrics
  const dashboard = getUnifiedDashboard();
  await dashboard.refresh();
  
  console.log(chalk.green('✅ Load simulation complete'));
  console.log(chalk.gray(`   Active flows: ${taskRegistry.getActiveFlows().length}`));
  console.log(chalk.gray(`   Active timers: ${timerRegistry.getActiveCount()}`));
  
  // Cleanup
  taskRegistry.completeFlow(flow1.taskId);
  taskRegistry.completeFlow(flow2.taskId);
  timerRegistry.clearTimeout('demo-timer-1');
  timerRegistry.clearInterval('demo-interval-1');
  
  await sleep(1500);
}

async function step6_showAlerts() {
  console.log(chalk.yellow('\n⚠️  Step 6: Alert Generation\n'));
  
  const health = await getHealth();
  
  if (health.alerts && health.alerts.length > 0) {
    console.log(chalk.cyan('Active Alerts:'));
    health.alerts.forEach(alert => {
      const icon = alert.level === 'critical' ? '🔴' :
                   alert.level === 'warning' ? '🟡' : '🔵';
      console.log(`  ${icon} ${alert.message}`);
    });
  } else {
    console.log(chalk.green('✅ No alerts - System healthy'));
  }
  
  console.log(chalk.gray('\nAlert thresholds:'));
  console.log(chalk.gray('  • Circuit breakers open > 0 → Warning'));
  console.log(chalk.gray('  • Active failures > 5 → Warning'));
  console.log(chalk.gray('  • Timer leak risk > 50% → Warning'));
  console.log(chalk.gray('  • Overall health < 70% → Critical'));
  
  await sleep(2000);
}

async function step7_cleanup() {
  console.log(chalk.yellow('\n🧹 Step 7: Cleanup\n'));
  
  const dashboard = getUnifiedDashboard();
  const finalStatus = dashboard.getStatus();
  
  console.log(chalk.cyan('Final Statistics:'));
  console.log(`  • Total updates: ${finalStatus.stats.updates}`);
  console.log(`  • Avg update time: ${finalStatus.stats.avgUpdateTime}ms`);
  console.log(`  • Cache size: ${finalStatus.cacheSize} entries`);
  console.log(`  • History size: ${finalStatus.historySize} records`);
  
  dashboard.shutdown();
  console.log(chalk.green('\n✅ Dashboard shutdown complete'));
  
  await sleep(1000);
}

// Helper functions
function drawBar(percentage) {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (percentage >= 85) return chalk.green(bar);
  if (percentage >= 70) return chalk.yellow(bar);
  return chalk.red(bar);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };