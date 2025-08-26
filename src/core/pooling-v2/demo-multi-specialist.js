#!/usr/bin/env node

/**
 * Demonstration Script for Multi-Specialist Pool
 * Shows intelligent selection and warming with 3 specialists
 * Compares against always-warm strategy
 */

const { MultiSpecialistPool, Department } = require('./multi-specialist-pool');
const { MEMORY_BY_STATE } = require('./single-specialist-pool');

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
  console.log('\n' + '='.repeat(70));
  console.log(colorize(text, 'bright'));
  console.log('='.repeat(70));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(50));
}

function formatMemory(mb) {
  return `${mb.toFixed(1)} MB`;
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Simulate Always-Warm strategy with 3 specialists
 */
class AlwaysWarmTriplePool {
  constructor() {
    this.specialists = ['backend-1', 'frontend-1', 'data-1'];
    this.memoryPerSpecialist = MEMORY_BY_STATE.warm;
    this.totalMemory = this.memoryPerSpecialist * 3;
    this.taskCount = 0;
    this.departmentUsage = {};
  }
  
  async executeTask(task) {
    // Always warm = instant response
    await new Promise(resolve => setTimeout(resolve, 150));
    
    this.taskCount++;
    const dept = task.department || 'GENERAL';
    this.departmentUsage[dept] = (this.departmentUsage[dept] || 0) + 1;
    
    return {
      success: true,
      responseTime: 150,
      poolStats: {
        totalMemory: this.totalMemory,
        warmCount: 3
      }
    };
  }
  
  getMetrics() {
    return {
      pool: {
        totalSpecialists: 3,
        warmCount: 3,
        currentMemory: this.totalMemory
      },
      performance: {
        totalTasks: this.taskCount,
        warmHitRate: 1.0
      },
      usage: {
        departmentUsage: this.departmentUsage
      }
    };
  }
}

/**
 * Task scenarios
 */
const taskScenarios = {
  backend_burst: [
    { type: 'api', department: Department.BACKEND },
    { type: 'api', department: Department.BACKEND },
    { type: 'api', department: Department.BACKEND }
  ],
  
  mixed_workload: [
    { type: 'api', department: Department.BACKEND },
    { type: 'ui', department: Department.FRONTEND },
    { type: 'ml', department: Department.DATA }
  ],
  
  frontend_heavy: [
    { type: 'ui', department: Department.FRONTEND },
    { type: 'ui', department: Department.FRONTEND },
    { type: 'api', department: Department.BACKEND },
    { type: 'ui', department: Department.FRONTEND }
  ],
  
  data_processing: [
    { type: 'ml', department: Department.DATA },
    { type: 'ml', department: Department.DATA },
    { type: 'data', department: Department.DATA }
  ]
};

/**
 * Main demonstration
 */
async function runDemo() {
  printHeader('🟢 MULTI-SPECIALIST POOL DEMONSTRATION');
  console.log('Comparing Intelligent vs Always-Warm with 3 Specialists\n');
  
  // Create both pools
  const intelligentPool = new MultiSpecialistPool({
    maxSpecialists: 3,
    maxWarmSpecialists: 1,  // Only keep 1 warm
    cooldownTime: 5000,     // 5 seconds for demo
    warmThreshold: 0.4,
    verbose: true
  });
  
  const alwaysWarmPool = new AlwaysWarmTriplePool();
  
  // Track overall metrics
  const results = {
    intelligent: {
      totalMemory: [],
      responseTimes: [],
      warmCounts: []
    },
    alwaysWarm: {
      totalMemory: [],
      responseTimes: []
    }
  };
  
  // Listen to state changes
  intelligentPool.on('specialist:stateChanged', (event) => {
    if (event.from !== event.to) {
      console.log(colorize(
        `    💫 ${event.specialistId}: ${event.from} → ${event.to} (${formatMemory(event.memory)})`,
        'yellow'
      ));
    }
  });
  
  // Scenario 1: Backend Burst
  printSection('Scenario 1: Backend Burst (3 API tasks)');
  console.log('Expected: Backend specialist should heat up\n');
  
  for (const task of taskScenarios.backend_burst) {
    const [smartResult, warmResult] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`  Task: ${task.type}`);
    console.log(`    Intelligent: ${smartResult.responseTime}ms (Memory: ${formatMemory(smartResult.poolStats.totalMemory)}, Warm: ${smartResult.poolStats.warmCount}/3)`);
    console.log(`    Always-Warm: ${warmResult.responseTime}ms (Memory: ${formatMemory(warmResult.poolStats.totalMemory)}, Warm: 3/3)`);
    
    results.intelligent.totalMemory.push(smartResult.poolStats.totalMemory);
    results.intelligent.responseTimes.push(smartResult.responseTime);
    results.intelligent.warmCounts.push(smartResult.poolStats.warmCount);
    results.alwaysWarm.totalMemory.push(warmResult.poolStats.totalMemory);
    results.alwaysWarm.responseTimes.push(warmResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Show heat levels
  const metrics1 = intelligentPool.getMetrics();
  console.log('\n  Heat Levels:');
  for (const [id, level] of Object.entries(metrics1.usage.heatLevels)) {
    const score = metrics1.usage.scores[id];
    const color = level === 'hot' ? 'red' : level === 'warm' ? 'yellow' : 'cyan';
    console.log(`    ${id}: ${colorize(level, color)} (score: ${score.toFixed(2)})`);
  }
  
  // Scenario 2: Mixed Workload
  printSection('Scenario 2: Mixed Workload (Backend → Frontend → Data)');
  console.log('Expected: Different specialists activate as needed\n');
  
  for (const task of taskScenarios.mixed_workload) {
    const [smartResult, warmResult] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`  Task: ${task.type} (${task.department})`);
    console.log(`    Intelligent: ${smartResult.responseTime}ms (Selected: ${smartResult.selectedSpecialist})`);
    console.log(`    Always-Warm: ${warmResult.responseTime}ms (All warm)`);
    
    results.intelligent.totalMemory.push(smartResult.poolStats.totalMemory);
    results.intelligent.responseTimes.push(smartResult.responseTime);
    results.intelligent.warmCounts.push(smartResult.poolStats.warmCount);
    results.alwaysWarm.totalMemory.push(warmResult.poolStats.totalMemory);
    results.alwaysWarm.responseTimes.push(warmResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Scenario 3: Idle Period
  printSection('Scenario 3: Idle Period (6 seconds)');
  console.log('Waiting for specialists to cool down...\n');
  
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentMetrics = intelligentPool.getMetrics();
    const warmCount = currentMetrics.pool.warmCount;
    const currentMemory = currentMetrics.pool.currentMemory;
    
    console.log(`  ${i+1}s - Intelligent: ${formatMemory(currentMemory)} (${warmCount} warm), Always-Warm: ${formatMemory(15.0)} (3 warm)`);
    
    results.intelligent.totalMemory.push(currentMemory);
    results.alwaysWarm.totalMemory.push(15.0);
  }
  
  // Scenario 4: Frontend Heavy
  printSection('Scenario 4: Frontend Heavy Workload');
  console.log('Expected: Frontend specialist should become HOT\n');
  
  for (const task of taskScenarios.frontend_heavy) {
    const [smartResult, warmResult] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`  Task: ${task.type}`);
    const wasWarm = smartResult.poolStats.wasWarm ? colorize('WARM', 'green') : colorize('COLD', 'red');
    console.log(`    Intelligent: ${smartResult.responseTime}ms (Start: ${wasWarm})`);
    console.log(`    Always-Warm: ${warmResult.responseTime}ms`);
    
    results.intelligent.responseTimes.push(smartResult.responseTime);
    results.alwaysWarm.responseTimes.push(warmResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Final heat levels
  const finalMetrics = intelligentPool.getMetrics();
  console.log('\n  Final Heat Levels:');
  for (const [id, level] of Object.entries(finalMetrics.usage.heatLevels)) {
    const score = finalMetrics.usage.scores[id];
    const color = level === 'hot' ? 'red' : level === 'warm' ? 'yellow' : 'cyan';
    console.log(`    ${id}: ${colorize(level, color)} (score: ${score.toFixed(2)})`);
  }
  
  // COMPREHENSIVE METRICS
  printHeader('📊 COMPREHENSIVE METRICS');
  
  const intelligentMetrics = intelligentPool.getMetrics();
  const warmMetrics = alwaysWarmPool.getMetrics();
  
  // Memory Comparison
  printSection('Memory Usage Analysis');
  
  const avgMemoryIntelligent = results.intelligent.totalMemory.reduce((a, b) => a + b, 0) / results.intelligent.totalMemory.length;
  const avgMemoryWarm = 15.0; // Always 3 * 5MB
  const memorySaved = avgMemoryWarm - avgMemoryIntelligent;
  const memorySavedPct = (memorySaved / avgMemoryWarm) * 100;
  
  console.log('Average Memory:');
  console.log(`  Intelligent: ${colorize(formatMemory(avgMemoryIntelligent), 'green')}`);
  console.log(`  Always-Warm: ${colorize(formatMemory(avgMemoryWarm), 'red')}`);
  console.log(`  ${colorize(`Savings: ${formatMemory(memorySaved)} (${formatPercentage(memorySavedPct)} reduction)`, 'bright')}`);
  
  console.log('\nPeak Memory:');
  console.log(`  Intelligent: ${formatMemory(intelligentMetrics.pool.peakMemory)}`);
  console.log(`  Always-Warm: ${formatMemory(15.0)}`);
  
  // Performance Comparison
  printSection('Performance Analysis');
  
  const avgResponseIntelligent = results.intelligent.responseTimes.reduce((a, b) => a + b, 0) / results.intelligent.responseTimes.length;
  const avgResponseWarm = 150;
  
  console.log('Response Times:');
  console.log(`  Intelligent: ${Math.round(avgResponseIntelligent)}ms average`);
  console.log(`    - Warm hits: ${intelligentMetrics.performance.warmHits}`);
  console.log(`    - Cold starts: ${intelligentMetrics.performance.coldStarts}`);
  console.log(`    - Warm hit rate: ${formatPercentage(intelligentMetrics.performance.warmHitRate * 100)}`);
  console.log(`  Always-Warm: ${avgResponseWarm}ms average`);
  console.log(`    - Warm hit rate: 100.0%`);
  
  // Usage Patterns
  printSection('Usage Patterns');
  
  console.log('Department Usage:');
  for (const [dept, count] of Object.entries(intelligentMetrics.usage.departmentUsage)) {
    console.log(`  ${dept}: ${count} tasks`);
  }
  
  console.log('\nSpecialist Utilization:');
  for (const [id, score] of Object.entries(intelligentMetrics.usage.scores)) {
    const heat = intelligentMetrics.usage.heatLevels[id];
    const color = heat === 'hot' ? 'red' : heat === 'warm' ? 'yellow' : 'cyan';
    console.log(`  ${id}: ${colorize(heat.toUpperCase(), color)} (score: ${score.toFixed(2)})`);
  }
  
  // Efficiency Summary
  printSection('Efficiency Summary');
  
  const avgWarmCount = results.intelligent.warmCounts.reduce((a, b) => a + b, 0) / results.intelligent.warmCounts.length;
  
  console.log(`Average Warm Specialists:`);
  console.log(`  Intelligent: ${colorize(avgWarmCount.toFixed(1), 'green')} / 3`);
  console.log(`  Always-Warm: ${colorize('3.0', 'red')} / 3`);
  
  console.log(`\nPrediction Accuracy: ${formatPercentage(intelligentMetrics.performance.predictionAccuracy * 100)}`);
  
  // Trade-offs
  printHeader('💡 KEY INSIGHTS');
  
  console.log(colorize('\n🏁 Intelligent Pooling Benefits:', 'green'));
  console.log(`  • ${formatPercentage(memorySavedPct)} less memory on average`);
  console.log(`  • Only ${avgWarmCount.toFixed(1)}/3 specialists kept warm`);
  console.log(`  • Adapts to workload patterns automatically`);
  console.log(`  • Heat-based warming prevents cold starts for hot paths`);
  
  console.log(colorize('\n🟠️ Trade-offs:', 'yellow'));
  console.log(`  • ${Math.round(avgResponseIntelligent - avgResponseWarm)}ms slower on average`);
  console.log(`  • ${intelligentMetrics.performance.coldStarts} cold starts occurred`);
  console.log(`  • Requires usage tracking overhead`);
  
  console.log(colorize('\n🟡 Best For:', 'cyan'));
  console.log('  • Variable workloads with clear patterns');
  console.log('  • Memory-constrained environments');
  console.log('  • Systems with many specialist types');
  console.log('  • Cost-optimized cloud deployments');
  
  // Projection
  printHeader('📈 FULL SYSTEM PROJECTION');
  
  const TOTAL_SPECIALISTS = 83;
  const INTELLIGENT_AVG_WARM = Math.ceil(TOTAL_SPECIALISTS * (avgWarmCount / 3));
  
  const projectedAlwaysWarm = TOTAL_SPECIALISTS * MEMORY_BY_STATE.warm;
  const projectedIntelligent = (INTELLIGENT_AVG_WARM * MEMORY_BY_STATE.warm) + 
                               ((TOTAL_SPECIALISTS - INTELLIGENT_AVG_WARM) * MEMORY_BY_STATE.cold);
  const projectedSavings = projectedAlwaysWarm - projectedIntelligent;
  const projectedSavingsPct = (projectedSavings / projectedAlwaysWarm) * 100;
  
  console.log(`\nWith ${TOTAL_SPECIALISTS} specialists:`);
  console.log(`  Always-Warm (all ${TOTAL_SPECIALISTS}): ${colorize(formatMemory(projectedAlwaysWarm), 'red')}`);
  console.log(`  Intelligent (~${INTELLIGENT_AVG_WARM} warm): ${colorize(formatMemory(projectedIntelligent), 'green')}`);
  console.log(`  ${colorize(`Projected Savings: ${formatMemory(projectedSavings)} (${formatPercentage(projectedSavingsPct)} reduction!)`, 'bright')}`);
  
  // Cleanup
  intelligentPool.destroy();
  
  console.log('\n' + '='.repeat(70));
  console.log(colorize('🟡 Multi-Specialist Demo Complete!', 'bright'));
  console.log('='.repeat(70) + '\n');
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };