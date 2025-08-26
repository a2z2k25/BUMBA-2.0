#!/usr/bin/env node

/**
 * Demonstration Script for Single Specialist Pool
 * Shows the lifecycle and compares efficiency vs always-warm approach
 */

const { SingleSpecialistPool, SpecialistState, MEMORY_BY_STATE } = require('./single-specialist-pool');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(colorize(text, 'bright'));
  console.log('='.repeat(60));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(40));
}

function formatMemory(mb) {
  return `${mb.toFixed(1)} MB`;
}

function formatTime(ms) {
  return `${ms} ms`;
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Simulate Always-Warm Pool for comparison
 */
class AlwaysWarmPool {
  constructor() {
    this.memoryUsage = MEMORY_BY_STATE.warm;
    this.taskCount = 0;
    this.totalResponseTime = 0;
  }
  
  async executeTask(task) {
    // Always warm = always fast response
    const responseTime = 50 + 100; // warm start + execution
    await new Promise(resolve => setTimeout(resolve, responseTime));
    
    this.taskCount++;
    this.totalResponseTime += responseTime;
    
    return {
      success: true,
      responseTime,
      memory: this.memoryUsage
    };
  }
  
  getMetrics() {
    return {
      memory: {
        current: this.memoryUsage,
        average: this.memoryUsage, // Always constant
      },
      performance: {
        taskCount: this.taskCount,
        avgResponseTime: this.taskCount > 0 ? this.totalResponseTime / this.taskCount : 0
      }
    };
  }
}

/**
 * Main demonstration
 */
async function runDemo() {
  printHeader('🟢 SINGLE SPECIALIST POOL DEMONSTRATION');
  console.log('Comparing Intelligent Pooling vs Always-Warm Strategy\n');
  
  // Create both pools
  const intelligentPool = new SingleSpecialistPool({
    specialistType: 'backend-engineer',
    department: 'BACKEND',
    cooldownTime: 5000, // 5 seconds for demo
    verbose: false
  });
  
  const alwaysWarmPool = new AlwaysWarmPool();
  
  // Track comparison metrics
  const comparison = {
    intelligent: { memory: [], responseTimes: [] },
    alwaysWarm: { memory: [], responseTimes: [] }
  };
  
  // Listen to state changes
  intelligentPool.on('stateChanged', (event) => {
    console.log(colorize(
      `  [State Change] ${event.from} → ${event.to} (Memory: ${formatMemory(event.memory)})`,
      'yellow'
    ));
  });
  
  // Scenario 1: First task (cold start)
  printSection('Scenario 1: First Task (Cold Start)');
  
  console.log('Intelligent Pool: Starting from COLD state');
  console.log('Always-Warm Pool: Already WARM (consuming 5.0 MB)');
  
  const task1 = { id: 'task-1', type: 'api-endpoint' };
  
  const [result1Smart, result1Warm] = await Promise.all([
    intelligentPool.executeTask(task1),
    alwaysWarmPool.executeTask(task1)
  ]);
  
  console.log('\nResults:');
  console.log(`  Intelligent: ${formatTime(result1Smart.responseTime)} (${result1Smart.startState} start)`);
  console.log(`  Always-Warm: ${formatTime(result1Warm.responseTime)}`);
  
  comparison.intelligent.responseTimes.push(result1Smart.responseTime);
  comparison.alwaysWarm.responseTimes.push(result1Warm.responseTime);
  
  // Scenario 2: Quick succession tasks (warm cache benefit)
  printSection('Scenario 2: Quick Succession (3 tasks)');
  
  for (let i = 2; i <= 4; i++) {
    const task = { id: `task-${i}`, type: 'data-processing' };
    
    const [resultSmart, resultWarm] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`Task ${i}:`);
    console.log(`  Intelligent: ${formatTime(resultSmart.responseTime)} (${resultSmart.startState} start, ${formatMemory(resultSmart.memory)})`);
    console.log(`  Always-Warm: ${formatTime(resultWarm.responseTime)} (${formatMemory(resultWarm.memory)})`);
    
    comparison.intelligent.responseTimes.push(resultSmart.responseTime);
    comparison.alwaysWarm.responseTimes.push(resultWarm.responseTime);
    
    // Small delay between tasks
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Scenario 3: Idle period (cooldown)
  printSection('Scenario 3: Idle Period (6 seconds)');
  console.log('Waiting for intelligent pool to cool down...');
  
  // Sample memory during idle
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const metrics = intelligentPool.getMetrics();
    comparison.intelligent.memory.push(metrics.memory.current);
    comparison.alwaysWarm.memory.push(alwaysWarmPool.memoryUsage);
    console.log(`  ${i+1}s - Intelligent: ${formatMemory(metrics.memory.current)}, Always-Warm: ${formatMemory(alwaysWarmPool.memoryUsage)}`);
  }
  
  // Scenario 4: Task after idle (potential cold start)
  printSection('Scenario 4: Task After Idle');
  
  const task5 = { id: 'task-5', type: 'report-generation' };
  
  const [result5Smart, result5Warm] = await Promise.all([
    intelligentPool.executeTask(task5),
    alwaysWarmPool.executeTask(task5)
  ]);
  
  console.log('Results:');
  console.log(`  Intelligent: ${formatTime(result5Smart.responseTime)} (${result5Smart.startState} start)`);
  console.log(`  Always-Warm: ${formatTime(result5Warm.responseTime)}`);
  
  comparison.intelligent.responseTimes.push(result5Smart.responseTime);
  comparison.alwaysWarm.responseTimes.push(result5Warm.responseTime);
  
  // Final metrics
  printHeader('📊 FINAL METRICS COMPARISON');
  
  const smartMetrics = intelligentPool.getMetrics();
  const warmMetrics = alwaysWarmPool.getMetrics();
  
  // Memory comparison
  printSection('Memory Usage');
  
  const avgMemorySmart = smartMetrics.memory.average;
  const avgMemoryWarm = warmMetrics.memory.average;
  const memorySaved = ((avgMemoryWarm - avgMemorySmart) / avgMemoryWarm) * 100;
  
  console.log('Average Memory:');
  console.log(`  Intelligent: ${colorize(formatMemory(avgMemorySmart), 'green')}`);
  console.log(`  Always-Warm: ${colorize(formatMemory(avgMemoryWarm), 'red')}`);
  console.log(`  ${colorize(`Savings: ${formatPercentage(memorySaved)} less memory used!`, 'bright')}`);
  
  // Performance comparison
  printSection('Performance');
  
  console.log('Response Times:');
  console.log(`  Intelligent: ${formatTime(Math.round(smartMetrics.performance.avgResponseTime))} average`);
  console.log(`    - Cold starts: ${smartMetrics.performance.coldStarts}`);
  console.log(`    - Warm starts: ${smartMetrics.performance.warmStarts}`);
  console.log(`  Always-Warm: ${formatTime(Math.round(warmMetrics.performance.avgResponseTime))} average`);
  
  const performanceDiff = smartMetrics.performance.avgResponseTime - warmMetrics.performance.avgResponseTime;
  console.log(`  Difference: ${colorize(`+${formatTime(Math.round(performanceDiff))} slower on average`, 'yellow')}`);
  
  // Efficiency analysis
  printSection('Efficiency Analysis');
  
  console.log('State Distribution (Intelligent Pool):');
  const stateDistribution = smartMetrics.efficiency.stateDistribution;
  for (const [state, percentage] of Object.entries(stateDistribution)) {
    if (percentage > 0) {
      const color = state === 'cold' ? 'green' : state === 'active' ? 'red' : 'yellow';
      console.log(`  ${state}: ${colorize(formatPercentage(percentage), color)}`);
    }
  }
  
  console.log(`\nWarm Hit Rate: ${colorize(formatPercentage(smartMetrics.efficiency.warmHitRate * 100), 'cyan')}`);
  console.log(`Memory Efficiency: ${colorize(formatPercentage(smartMetrics.efficiency.memoryEfficiency), 'green')}`);
  
  // Trade-off summary
  printHeader('💡 TRADE-OFF SUMMARY');
  
  console.log(colorize('\n🏁 Intelligent Pooling Advantages:', 'green'));
  console.log(`  • ${formatPercentage(memorySaved)} less memory on average`);
  console.log(`  • Scales to zero when idle`);
  console.log(`  • Better for intermittent workloads`);
  
  console.log(colorize('\n🟠️ Trade-offs:', 'yellow'));
  console.log(`  • ${formatTime(Math.round(performanceDiff))} slower average response`);
  console.log(`  • Cold starts add ${formatTime(1000)} latency`);
  console.log(`  • Complexity of state management`);
  
  console.log(colorize('\n🟡 Best Use Cases:', 'cyan'));
  console.log('  • Development environments (save resources)');
  console.log('  • Bursty workloads (scale up/down as needed)');
  console.log('  • Cost-sensitive deployments');
  console.log('  • Systems with many specialist types (10-20 warm vs 80+)');
  
  // Projection for full system
  printHeader('📈 PROJECTION: Full System Impact');
  
  const TOTAL_SPECIALISTS = 83;
  const INTELLIGENT_WARM_COUNT = 15;
  
  const fullSystemAlwaysWarm = TOTAL_SPECIALISTS * MEMORY_BY_STATE.warm;
  const fullSystemIntelligent = (INTELLIGENT_WARM_COUNT * MEMORY_BY_STATE.warm) + 
                                ((TOTAL_SPECIALISTS - INTELLIGENT_WARM_COUNT) * MEMORY_BY_STATE.cold);
  const fullSystemSaved = fullSystemAlwaysWarm - fullSystemIntelligent;
  const fullSystemSavedPct = (fullSystemSaved / fullSystemAlwaysWarm) * 100;
  
  console.log(`\nWith ${TOTAL_SPECIALISTS} total specialists:`);
  console.log(`  Always-Warm (all ${TOTAL_SPECIALISTS}): ${colorize(formatMemory(fullSystemAlwaysWarm), 'red')}`);
  console.log(`  Intelligent (${INTELLIGENT_WARM_COUNT} warm): ${colorize(formatMemory(fullSystemIntelligent), 'green')}`);
  console.log(`  ${colorize(`Total Savings: ${formatMemory(fullSystemSaved)} (${formatPercentage(fullSystemSavedPct)} reduction!)`, 'bright')}`);
  
  // Cleanup
  intelligentPool.destroy();
  
  console.log('\n' + '='.repeat(60));
  console.log(colorize('🟡 Demo Complete!', 'bright'));
  console.log('='.repeat(60) + '\n');
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };