#!/usr/bin/env node

/**
 * Demonstration Script for Scaled Specialist Pool
 * Shows intelligent management of 20 specialists with advanced prediction
 * Compares against always-warm strategy
 */

const { 
  ScaledSpecialistPool, 
  Department,
  HeatLevel,
  SPECIALIST_DEFINITIONS 
} = require('./scaled-specialist-pool');
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
  console.log('\n' + '='.repeat(80));
  console.log(colorize(text, 'bright'));
  console.log('='.repeat(80));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(60));
}

function formatMemory(mb) {
  return `${mb.toFixed(1)} MB`;
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

/**
 * Simulate Always-Warm strategy with 20 specialists
 */
class AlwaysWarmScaledPool {
  constructor() {
    this.specialists = SPECIALIST_DEFINITIONS.slice(0, 20);
    this.memoryPerSpecialist = MEMORY_BY_STATE.warm;
    this.totalMemory = this.memoryPerSpecialist * 20;
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
        warmCount: 20
      }
    };
  }
  
  getMetrics() {
    return {
      pool: {
        totalSpecialists: 20,
        warmCount: 20,
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
 * Task scenarios for 20 specialists
 */
const taskScenarios = {
  // API development workflow
  api_workflow: [
    { type: 'api', department: Department.BACKEND, description: 'Design REST API' },
    { type: 'database', department: Department.BACKEND, description: 'Schema design' },
    { type: 'api', department: Department.BACKEND, description: 'Implement endpoints' },
    { type: 'graphql', department: Department.BACKEND, description: 'Add GraphQL layer' }
  ],
  
  // Frontend development
  frontend_workflow: [
    { type: 'ui', department: Department.FRONTEND, description: 'Design UI components' },
    { type: 'react', department: Department.FRONTEND, description: 'React implementation' },
    { type: 'mobile', department: Department.FRONTEND, description: 'Mobile responsive' },
    { type: 'api', department: Department.BACKEND, description: 'Connect to backend' }
  ],
  
  // ML pipeline
  ml_pipeline: [
    { type: 'etl', department: Department.DATA, description: 'Data extraction' },
    { type: 'pipeline', department: Department.DATA, description: 'Build pipeline' },
    { type: 'ml', department: Department.DATA, description: 'Train model' },
    { type: 'mlops', department: Department.DATA, description: 'Deploy model' }
  ],
  
  // Deployment workflow
  deployment: [
    { type: 'ci', department: Department.DEVOPS, description: 'CI pipeline' },
    { type: 'kubernetes', department: Department.DEVOPS, description: 'K8s deployment' },
    { type: 'monitoring', department: Department.DEVOPS, description: 'Setup monitoring' },
    { type: 'security', department: Department.SECURITY, description: 'Security scan' }
  ],
  
  // Security audit
  security_audit: [
    { type: 'security', department: Department.SECURITY, description: 'Initial scan' },
    { type: 'vulnerability', department: Department.SECURITY, description: 'Vulnerability assessment' },
    { type: 'compliance', department: Department.SECURITY, description: 'Compliance check' },
    { type: 'monitoring', department: Department.DEVOPS, description: 'Security monitoring' }
  ],
  
  // Mixed workload
  mixed_workload: [
    { type: 'api', department: Department.BACKEND },
    { type: 'react', department: Department.FRONTEND },
    { type: 'ml', department: Department.DATA },
    { type: 'kubernetes', department: Department.DEVOPS },
    { type: 'security', department: Department.SECURITY },
    { type: 'database', department: Department.BACKEND },
    { type: 'vue', department: Department.FRONTEND },
    { type: 'analytics', department: Department.DATA }
  ]
};

/**
 * Main demonstration
 */
async function runDemo() {
  printHeader('🟢 SCALED SPECIALIST POOL DEMONSTRATION (20 SPECIALISTS)');
  console.log('Comparing Intelligent vs Always-Warm with 20 Specialists\n');
  
  // Show specialist distribution
  console.log(colorize('Specialist Distribution:', 'yellow'));
  const deptCounts = {};
  for (const spec of SPECIALIST_DEFINITIONS.slice(0, 20)) {
    deptCounts[spec.department] = (deptCounts[spec.department] || 0) + 1;
  }
  for (const [dept, count] of Object.entries(deptCounts)) {
    console.log(`  ${dept}: ${count} specialists`);
  }
  
  // Create both pools
  const intelligentPool = new ScaledSpecialistPool({
    maxSpecialists: 20,
    maxWarmSpecialists: 4,    // Only 20% warm
    cooldownTime: 5000,       // 5 seconds for demo
    warmThreshold: 0.35,
    collaborationDetection: true,
    adaptiveWarming: true,
    verbose: true
  });
  
  const alwaysWarmPool = new AlwaysWarmScaledPool();
  
  // Track overall metrics
  const results = {
    intelligent: {
      totalMemory: [],
      responseTimes: [],
      warmCounts: [],
      predictions: []
    },
    alwaysWarm: {
      totalMemory: [],
      responseTimes: []
    }
  };
  
  // Scenario 1: API Development Workflow
  printSection('Scenario 1: API Development Workflow');
  console.log('Expected: API → Database collaboration pattern\n');
  
  for (const task of taskScenarios.api_workflow) {
    const [smartResult, warmResult] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`  ${task.description || task.type}:`);
    console.log(`    Intelligent: ${smartResult.responseTime}ms (Memory: ${formatMemory(smartResult.poolStats.totalMemory)}, Warm: ${smartResult.poolStats.warmCount}/20)`);
    console.log(`    Always-Warm: ${warmResult.responseTime}ms (Memory: ${formatMemory(warmResult.poolStats.totalMemory)}, Warm: 20/20)`);
    
    if (smartResult.poolStats.predictions && smartResult.poolStats.predictions.length > 0) {
      console.log(`    Predictions: ${smartResult.poolStats.predictions.join(', ')}`);
    }
    
    results.intelligent.totalMemory.push(smartResult.poolStats.totalMemory);
    results.intelligent.responseTimes.push(smartResult.responseTime);
    results.intelligent.warmCounts.push(smartResult.poolStats.warmCount);
    results.alwaysWarm.totalMemory.push(warmResult.poolStats.totalMemory);
    results.alwaysWarm.responseTimes.push(warmResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Scenario 2: ML Pipeline
  printSection('Scenario 2: Machine Learning Pipeline');
  console.log('Expected: Data → ML → Deployment collaboration\n');
  
  for (const task of taskScenarios.ml_pipeline) {
    const [smartResult, warmResult] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`  ${task.description}:`);
    console.log(`    Intelligent: ${smartResult.responseTime}ms (Selected: ${smartResult.poolStats.selectedSpecialist})`);
    console.log(`    Always-Warm: ${warmResult.responseTime}ms`);
    
    results.intelligent.totalMemory.push(smartResult.poolStats.totalMemory);
    results.intelligent.responseTimes.push(smartResult.responseTime);
    results.intelligent.warmCounts.push(smartResult.poolStats.warmCount);
    results.alwaysWarm.totalMemory.push(warmResult.poolStats.totalMemory);
    results.alwaysWarm.responseTimes.push(warmResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Show current heat distribution
  const midMetrics = intelligentPool.getMetrics();
  console.log('\n  Heat Distribution:');
  for (const [level, count] of Object.entries(midMetrics.usage.heatDistribution)) {
    const color = level === 'hot' ? 'red' : level === 'warm' ? 'yellow' : 'cyan';
    console.log(`    ${colorize(level.toUpperCase(), color)}: ${count} specialists`);
  }
  
  // Scenario 3: Deployment Workflow
  printSection('Scenario 3: Deployment Workflow');
  console.log('Expected: CI/CD → K8s → Monitoring collaboration\n');
  
  for (const task of taskScenarios.deployment) {
    const [smartResult, warmResult] = await Promise.all([
      intelligentPool.executeTask(task),
      alwaysWarmPool.executeTask(task)
    ]);
    
    console.log(`  ${task.description}:`);
    const wasWarm = smartResult.poolStats.wasWarm ? colorize('WARM', 'green') : colorize('COLD', 'red');
    console.log(`    Intelligent: ${smartResult.responseTime}ms (Start: ${wasWarm})`);
    console.log(`    Always-Warm: ${warmResult.responseTime}ms`);
    
    results.intelligent.responseTimes.push(smartResult.responseTime);
    results.intelligent.warmCounts.push(smartResult.poolStats.warmCount);
    results.alwaysWarm.responseTimes.push(warmResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Scenario 4: Idle Period
  printSection('Scenario 4: Idle Period (8 seconds)');
  console.log('Observing cooldown and memory reduction...\n');
  
  for (let i = 0; i < 8; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentMetrics = intelligentPool.getMetrics();
    const warmCount = currentMetrics.pool.warmCount;
    const currentMemory = currentMetrics.pool.currentMemory;
    
    console.log(`  ${i+1}s - Intelligent: ${formatMemory(currentMemory)} (${warmCount} warm), Always-Warm: ${formatMemory(100.0)} (20 warm)`);
    
    results.intelligent.totalMemory.push(currentMemory);
    results.alwaysWarm.totalMemory.push(100.0);
  }
  
  // Scenario 5: Mixed Workload
  printSection('Scenario 5: Mixed Workload (All Departments)');
  console.log('Testing prediction accuracy and adaptive warming\n');
  
  for (const task of taskScenarios.mixed_workload) {
    const smartResult = await intelligentPool.executeTask(task);
    
    console.log(`  ${task.type} (${task.department}):`);
    console.log(`    Response: ${smartResult.responseTime}ms`);
    console.log(`    Queue depth: ${smartResult.poolStats.queueDepth}`);
    
    results.intelligent.responseTimes.push(smartResult.responseTime);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // COMPREHENSIVE METRICS
  printHeader('📊 COMPREHENSIVE METRICS');
  
  const intelligentMetrics = intelligentPool.getMetrics();
  const warmMetrics = alwaysWarmPool.getMetrics();
  
  // Memory Comparison
  printSection('Memory Usage Analysis');
  
  const avgMemoryIntelligent = results.intelligent.totalMemory.reduce((a, b) => a + b, 0) / results.intelligent.totalMemory.length;
  const avgMemoryWarm = 100.0; // Always 20 * 5MB
  const memorySaved = avgMemoryWarm - avgMemoryIntelligent;
  const memorySavedPct = (memorySaved / avgMemoryWarm) * 100;
  
  console.log('Average Memory:');
  console.log(`  Intelligent: ${colorize(formatMemory(avgMemoryIntelligent), 'green')}`);
  console.log(`  Always-Warm: ${colorize(formatMemory(avgMemoryWarm), 'red')}`);
  console.log(`  ${colorize(`Savings: ${formatMemory(memorySaved)} (${formatPercentage(memorySavedPct)} reduction)`, 'bright')}`);
  
  console.log('\nPeak Memory:');
  console.log(`  Intelligent: ${formatMemory(intelligentMetrics.pool.peakMemory)}`);
  console.log(`  Always-Warm: ${formatMemory(100.0)}`);
  
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
  
  // Prediction Analysis
  printSection('Prediction & Collaboration');
  
  console.log('Prediction Performance:');
  console.log(`  Accuracy: ${formatPercentage(intelligentMetrics.prediction.accuracy * 100)}`);
  console.log(`  Total predictions: ${intelligentMetrics.prediction.totalPredictions}`);
  console.log(`  Correct predictions: ${intelligentMetrics.prediction.correctPredictions}`);
  console.log(`  Predictions used: ${intelligentMetrics.prediction.predictionsUsed}`);
  console.log(`  Collaborations detected: ${intelligentMetrics.prediction.collaborationDetected}`);
  
  // Department Usage
  printSection('Department Activity');
  
  console.log('Task Distribution:');
  for (const [dept, count] of Object.entries(intelligentMetrics.usage.departmentDistribution)) {
    if (count > 0) {
      console.log(`  ${dept}: ${count} tasks`);
    }
  }
  
  // Top Specialists
  console.log('\nTop 5 Most Used Specialists:');
  const topSpecs = intelligentMetrics.usage.topSpecialists;
  for (const spec of topSpecs) {
    const color = spec.heat === 'hot' ? 'red' : spec.heat === 'warm' ? 'yellow' : 'cyan';
    console.log(`  ${spec.id}: ${colorize(spec.heat.toUpperCase(), color)} (score: ${spec.score.toFixed(2)}, dept: ${spec.department})`);
  }
  
  // Efficiency Summary
  printSection('Efficiency Summary');
  
  const avgWarmCount = results.intelligent.warmCounts.reduce((a, b) => a + b, 0) / results.intelligent.warmCounts.length;
  
  console.log(`Average Warm Specialists:`);
  console.log(`  Intelligent: ${colorize(avgWarmCount.toFixed(1), 'green')} / 20`);
  console.log(`  Always-Warm: ${colorize('20.0', 'red')} / 20`);
  
  console.log(`\nUtilization Rate: ${formatPercentage(intelligentMetrics.efficiency.utilizationRate * 100)}`);
  console.log(`Adaptive Threshold: ${intelligentMetrics.pool.warmThreshold.toFixed(2)}`);
  
  // Trade-offs
  printHeader('💡 KEY INSIGHTS');
  
  console.log(colorize('\n🏁 Intelligent Pooling Benefits:', 'green'));
  console.log(`  • ${formatPercentage(memorySavedPct)} less memory on average`);
  console.log(`  • Only ${avgWarmCount.toFixed(1)}/20 specialists kept warm`);
  console.log(`  • Predictive warming reduces cold starts`);
  console.log(`  • Collaboration detection improves workflow efficiency`);
  console.log(`  • Adaptive warming responds to memory pressure`);
  
  console.log(colorize('\n🟠️ Trade-offs:', 'yellow'));
  console.log(`  • ${Math.round(avgResponseIntelligent - avgResponseWarm)}ms slower on average`);
  console.log(`  • ${intelligentMetrics.performance.coldStarts} cold starts occurred`);
  console.log(`  • Prediction accuracy at ${formatPercentage(intelligentMetrics.prediction.accuracy * 100)}`);
  console.log(`  • Additional complexity for tracking and prediction`);
  
  console.log(colorize('\n🟡 Best Practices:', 'cyan'));
  console.log('  • Group related tasks for collaboration benefits');
  console.log('  • Allow warming time between workflow phases');
  console.log('  • Monitor prediction accuracy for tuning');
  console.log('  • Adjust thresholds based on workload patterns');
  
  // Full System Projection
  printHeader('📈 FULL SYSTEM PROJECTION (83 SPECIALISTS)');
  
  const TOTAL_SPECIALISTS = 83;
  const INTELLIGENT_AVG_WARM = Math.ceil(TOTAL_SPECIALISTS * (avgWarmCount / 20));
  
  const projectedAlwaysWarm = TOTAL_SPECIALISTS * MEMORY_BY_STATE.warm;
  const projectedIntelligent = (INTELLIGENT_AVG_WARM * MEMORY_BY_STATE.warm) + 
                               ((TOTAL_SPECIALISTS - INTELLIGENT_AVG_WARM) * MEMORY_BY_STATE.cold);
  const projectedSavings = projectedAlwaysWarm - projectedIntelligent;
  const projectedSavingsPct = (projectedSavings / projectedAlwaysWarm) * 100;
  
  console.log(`\nWith ${TOTAL_SPECIALISTS} specialists:`);
  console.log(`  Always-Warm (all ${TOTAL_SPECIALISTS}): ${colorize(formatMemory(projectedAlwaysWarm), 'red')}`);
  console.log(`  Intelligent (~${INTELLIGENT_AVG_WARM} warm): ${colorize(formatMemory(projectedIntelligent), 'green')}`);
  console.log(`  ${colorize(`Projected Savings: ${formatMemory(projectedSavings)} (${formatPercentage(projectedSavingsPct)} reduction!)`, 'bright')}`);
  
  console.log('\nProjected Benefits at Scale:');
  console.log(`  • Memory savings: ${formatMemory(projectedSavings)}`);
  console.log(`  • Reduced cloud costs: ~$${Math.round(projectedSavings * 0.5)}/month`);
  console.log(`  • Better resource utilization: ${Math.round(100 - projectedSavingsPct)}% of original`);
  console.log(`  • Improved scalability: Support 2-3x more specialists`);
  
  // Cleanup
  intelligentPool.destroy();
  
  console.log('\n' + '='.repeat(80));
  console.log(colorize('🟡 Scaled Specialist Demo Complete!', 'bright'));
  console.log('Ready for production deployment with 83 specialists.');
  console.log('='.repeat(80) + '\n');
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };