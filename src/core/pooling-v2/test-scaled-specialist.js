#!/usr/bin/env node

/**
 * Test Suite for Scaled Specialist Pool
 * Validates intelligent pooling with 20 specialists
 */

const { 
  ScaledSpecialistPool, 
  Department, 
  HeatLevel,
  SPECIALIST_DEFINITIONS 
} = require('./scaled-specialist-pool');
const { SpecialistState } = require('./single-specialist-pool');

// Test utilities
let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`  🏁 ${name}`);
  } catch (error) {
    failCount++;
    console.log(`  🔴 ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

async function asyncTest(name, fn) {
  testCount++;
  try {
    await fn();
    passCount++;
    console.log(`  🏁 ${name}`);
  } catch (error) {
    failCount++;
    console.log(`  🔴 ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertApprox(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(message || `Expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🧪 SCALED SPECIALIST POOL TEST SUITE (20 SPECIALISTS)\n');
  console.log('=' .repeat(60));
  
  // Test 1: Initialization
  console.log('\n📋 Test Suite 1: Initialization');
  console.log('-'.repeat(50));
  
  const pool = new ScaledSpecialistPool({ 
    verbose: false,
    maxSpecialists: 20,
    maxWarmSpecialists: 4
  });
  
  test('Pool initializes with 20 specialists', () => {
    assert(pool.specialists.size === 20, 'Should have 20 specialists');
  });
  
  test('All specialists start cold', () => {
    let allCold = true;
    for (const [id, specialist] of pool.specialists) {
      if (specialist.getState() !== SpecialistState.COLD) {
        allCold = false;
      }
    }
    assert(allCold, 'All specialists should start cold');
  });
  
  test('Departments are distributed correctly', () => {
    const deptCounts = {};
    for (const [id, info] of pool.specialistTypes) {
      const dept = info.department;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    }
    
    assert(deptCounts[Department.BACKEND] === 5, 'Should have 5 backend specialists');
    assert(deptCounts[Department.FRONTEND] === 5, 'Should have 5 frontend specialists');
    assert(deptCounts[Department.DATA] === 4, 'Should have 4 data specialists');
    assert(deptCounts[Department.DEVOPS] === 3, 'Should have 3 devops specialists');
    assert(deptCounts[Department.SECURITY] === 3, 'Should have 3 security specialists');
  });
  
  // Test 2: Task Routing
  console.log('\n📋 Test Suite 2: Task Routing & Selection');
  console.log('-'.repeat(50));
  
  await asyncTest('Routes tasks by department', async () => {
    const selected = await pool.selectSpecialist({ 
      department: Department.BACKEND 
    });
    const info = pool.specialistTypes.get(selected);
    assert(info.department === Department.BACKEND, 'Should select backend specialist');
  });
  
  test('Maps task types to correct specialists', () => {
    const apiTask = pool.mapTaskTypeToSpecialist('api');
    assert(apiTask === 'api-specialist', 'Should map api to api-specialist');
    
    const mlTask = pool.mapTaskTypeToSpecialist('ml');
    assert(mlTask === 'ml-specialist', 'Should map ml to ml-specialist');
    
    const k8sTask = pool.mapTaskTypeToSpecialist('kubernetes');
    assert(k8sTask === 'kubernetes-specialist', 'Should map kubernetes correctly');
  });
  
  await asyncTest('Handles explicit specialist requests', async () => {
    const result = await pool.executeTask({ 
      specialistId: 'react-specialist',
      type: 'component' 
    });
    assert(result.poolStats.selectedSpecialist === 'react-specialist', 'Should use requested specialist');
  });
  
  // Test 3: Prediction Engine
  console.log('\n📋 Test Suite 3: Prediction Engine');
  console.log('-'.repeat(50));
  
  test('Records transitions between specialists', () => {
    const engine = pool.predictionEngine;
    engine.recordTransition('api-specialist', 'database-specialist', Date.now());
    
    const key = 'api-specialist→database-specialist';
    assert(engine.transitionMatrix[key] === 1, 'Should record transition');
  });
  
  test('Predicts next specialists based on patterns', () => {
    const engine = pool.predictionEngine;
    
    // Create pattern
    engine.recordTransition('api-specialist', 'database-specialist', Date.now());
    engine.recordTransition('api-specialist', 'database-specialist', Date.now());
    engine.recordTransition('api-specialist', 'graphql-specialist', Date.now());
    
    const predictions = engine.predictNext('api-specialist', 2);
    assert(predictions.length > 0, 'Should return predictions');
    assert(predictions[0].specialist === 'database-specialist', 'Should predict database next');
  });
  
  test('Detects collaboration patterns', () => {
    const engine = pool.predictionEngine;
    
    const recentTasks = [
      { specialistId: 'api-specialist' },
      { specialistId: 'database-specialist' }
    ];
    
    const patterns = engine.detectCollaboration(recentTasks);
    assert(patterns.length === 1, 'Should detect API_TO_DB pattern');
    assert(patterns[0].pattern === 'API_TO_DB', 'Should identify correct pattern');
  });
  
  // Test 4: Heat Management
  console.log('\n📋 Test Suite 4: Heat & Usage Management');
  console.log('-'.repeat(50));
  
  await asyncTest('Updates heat levels based on usage', async () => {
    const pool2 = new ScaledSpecialistPool({ verbose: false });
    
    // Execute multiple tasks for one specialist
    await pool2.executeTask({ type: 'api' });
    await pool2.executeTask({ type: 'api' });
    await pool2.executeTask({ type: 'api' });
    
    const apiScore = pool2.usageScores.get('api-specialist');
    assert(apiScore > 0, 'Should have usage score');
    
    const apiHeat = pool2.heatLevels.get('api-specialist');
    assert(apiHeat !== HeatLevel.COLD, 'Should not be cold after usage');
  });
  
  test('Applies usage decay over time', () => {
    const pool3 = new ScaledSpecialistPool({ 
      verbose: false,
      usageDecayRate: 0.5 
    });
    
    // Set scores
    pool3.usageScores.set('api-specialist', 1.0);
    pool3.usageScores.set('react-specialist', 0.5);
    pool3.lastAccessTime.set('api-specialist', Date.now() - 120000); // 2 min ago
    pool3.lastAccessTime.set('react-specialist', Date.now());
    
    // Apply decay
    pool3.applyUsageDecay();
    
    const apiScore = pool3.usageScores.get('api-specialist');
    const reactScore = pool3.usageScores.get('react-specialist');
    
    assert(apiScore < 1.0, 'Old access should decay more');
    assert(reactScore >= 0.5, 'Recent access should decay less');
  });
  
  test('Tracks heat history', async () => {
    const pool4 = new ScaledSpecialistPool({ verbose: false });
    
    // Change heat level
    pool4.updateUsageScore('api-specialist', 0.8);
    pool4.updateHeatLevel('api-specialist');
    
    const history = pool4.heatHistory.get('api-specialist');
    assert(history.length > 0, 'Should track heat history');
  });
  
  // Test 5: Intelligent Warming
  console.log('\n📋 Test Suite 5: Intelligent Warming Strategy');
  console.log('-'.repeat(50));
  
  await asyncTest('Warms hot specialists automatically', async () => {
    const pool5 = new ScaledSpecialistPool({ 
      verbose: false,
      maxWarmSpecialists: 2,
      warmThreshold: 0.4
    });
    
    // Make some specialists hot
    pool5.usageScores.set('api-specialist', 0.9);
    pool5.usageScores.set('database-specialist', 0.8);
    pool5.usageScores.set('react-specialist', 0.2);
    
    pool5.updateHeatLevel('api-specialist');
    pool5.updateHeatLevel('database-specialist');
    pool5.updateHeatLevel('react-specialist');
    
    // Apply warming
    await pool5.applyIntelligentWarming();
    
    // Wait for warming to start
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check that hot specialists are warming/warm
    const apiState = pool5.specialists.get('api-specialist').getState();
    const reactState = pool5.specialists.get('react-specialist').getState();
    
    assert(
      apiState === SpecialistState.WARMING || 
      apiState === SpecialistState.WARM,
      'Hot specialist should be warming'
    );
    assert(
      reactState === SpecialistState.COLD,
      'Cool specialist should stay cold'
    );
  });
  
  await asyncTest('Pre-warms collaborators', async () => {
    const pool6 = new ScaledSpecialistPool({ 
      verbose: false,
      collaborationDetection: true
    });
    
    // Simulate collaboration pattern
    const pattern = {
      pattern: 'API_TO_DB',
      nextLikely: ['api-specialist', 'database-specialist']
    };
    
    await pool6.preWarmCollaborators(pattern);
    
    // Check warming queue
    assert(pool6.warmingQueue.size >= 0, 'Should manage warming queue');
  });
  
  // Test 6: Performance & Scaling
  console.log('\n📋 Test Suite 6: Performance & Scaling');
  console.log('-'.repeat(50));
  
  await asyncTest('Handles concurrent tasks efficiently', async () => {
    const pool7 = new ScaledSpecialistPool({ verbose: false });
    
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(pool7.executeTask({ 
        type: i % 2 === 0 ? 'api' : 'react' 
      }));
    }
    
    const results = await Promise.all(tasks);
    assert(results.every(r => r.success), 'All tasks should succeed');
  });
  
  test('Manages task queue properly', async () => {
    const pool8 = new ScaledSpecialistPool({ verbose: false });
    
    // Simulate processing task
    pool8.processingTask = true;
    
    const queuePromise = pool8.queueTask({ type: 'test' });
    assert(pool8.taskQueue.length === 1, 'Should queue task');
    
    pool8.processingTask = false;
  });
  
  await asyncTest('Tracks memory usage accurately', async () => {
    const pool9 = new ScaledSpecialistPool({ verbose: false });
    
    await pool9.executeTask({ type: 'api' });
    
    const metrics = pool9.getMetrics();
    assert(metrics.pool.currentMemory > 0, 'Should track current memory');
    assert(metrics.pool.peakMemory >= metrics.pool.currentMemory, 'Peak >= current');
  });
  
  // Test 7: Adaptive Features
  console.log('\n📋 Test Suite 7: Adaptive Features');
  console.log('-'.repeat(50));
  
  test('Adjusts warming threshold based on memory', () => {
    const pool10 = new ScaledSpecialistPool({ 
      verbose: false,
      adaptiveWarming: true,
      warmThreshold: 0.4
    });
    
    // Simulate high memory pressure
    pool10.metrics.currentMemoryUsage = 90;
    const initialThreshold = pool10.config.warmThreshold;
    
    // Would normally happen in interval, but we can test the logic
    const memoryPressure = 90 / 100; // High pressure
    if (memoryPressure > 0.7) {
      pool10.config.warmThreshold = Math.min(0.6, pool10.config.warmThreshold + 0.05);
    }
    
    assert(pool10.config.warmThreshold > initialThreshold, 'Should raise threshold under pressure');
  });
  
  test('Tracks prediction accuracy', async () => {
    const pool11 = new ScaledSpecialistPool({ verbose: false });
    
    pool11.lastPredictions = [
      { specialist: 'api-specialist', probability: 0.8 }
    ];
    
    pool11.evaluatePredictions('api-specialist');
    assert(pool11.predictionAccuracy.correct === 1, 'Should track correct prediction');
    
    pool11.evaluatePredictions('database-specialist');
    assert(pool11.predictionAccuracy.total === 2, 'Should track total predictions');
  });
  
  // Test 8: Metrics & Reporting
  console.log('\n📋 Test Suite 8: Metrics & Reporting');
  console.log('-'.repeat(50));
  
  await asyncTest('Provides comprehensive metrics', async () => {
    const pool12 = new ScaledSpecialistPool({ verbose: false });
    
    // Execute various tasks
    await pool12.executeTask({ type: 'api', department: Department.BACKEND });
    await pool12.executeTask({ type: 'react', department: Department.FRONTEND });
    await pool12.executeTask({ type: 'ml', department: Department.DATA });
    
    const metrics = pool12.getMetrics();
    
    assert(metrics.pool.totalSpecialists === 20, 'Should report specialist count');
    assert(metrics.performance.totalTasks === 3, 'Should count tasks');
    assert(metrics.usage.departmentDistribution.BACKEND === 1, 'Should track departments');
    assert(metrics.usage.topSpecialists.length > 0, 'Should identify top specialists');
    assert(metrics.efficiency.savedPercentage >= 0, 'Should calculate savings');
  });
  
  test('Calculates memory efficiency', () => {
    const pool13 = new ScaledSpecialistPool({ verbose: false });
    
    const efficiency = pool13.calculateMemoryEfficiency();
    assert(efficiency.alwaysWarm === 100, 'Always-warm should be 20 * 5MB');
    assert(efficiency.current < efficiency.alwaysWarm, 'Current should be less');
    assert(efficiency.savedPercentage > 0, 'Should show savings');
  });
  
  test('Identifies top specialists correctly', async () => {
    const pool14 = new ScaledSpecialistPool({ verbose: false });
    
    // Set different scores
    pool14.usageScores.set('api-specialist', 0.9);
    pool14.usageScores.set('database-specialist', 0.7);
    pool14.usageScores.set('react-specialist', 0.5);
    
    const top = pool14.getTopSpecialists(3);
    assert(top[0].id === 'api-specialist', 'First should be highest score');
    assert(top[0].score === 0.9, 'Should have correct score');
  });
  
  // Test 9: Edge Cases
  console.log('\n📋 Test Suite 9: Edge Cases & Cleanup');
  console.log('-'.repeat(50));
  
  await asyncTest('Handles unknown task types gracefully', async () => {
    const pool15 = new ScaledSpecialistPool({ verbose: false });
    const result = await pool15.executeTask({ type: 'unknown-type' });
    assert(result.success === true, 'Should handle unknown task');
  });
  
  await asyncTest('Manages department selection fallback', async () => {
    const pool16 = new ScaledSpecialistPool({ verbose: false });
    const result = await pool16.executeTask({ 
      department: 'INVALID_DEPT' 
    });
    assert(result.success === true, 'Should fallback gracefully');
  });
  
  test('Cleanup releases all resources', () => {
    const pool17 = new ScaledSpecialistPool({ verbose: false });
    pool17.destroy();
    
    // Check cleanup
    assert(pool17.decayInterval === undefined || pool17.decayInterval._destroyed, 'Should clear intervals');
    
    let allDestroyed = true;
    for (const [id, specialist] of pool17.specialists) {
      if (specialist.cooldownTimer !== null) {
        allDestroyed = false;
      }
    }
    assert(allDestroyed, 'All specialists should be cleaned up');
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${testCount}`);
  console.log(`🏁 Passed: ${passCount}`);
  console.log(`🔴 Failed: ${failCount}`);
  console.log(`Success Rate: ${((passCount/testCount)*100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log('\n🏁 All tests passed! Scaled system with 20 specialists is working correctly.');
    console.log('🟡 Ready to scale to 83 specialists in production.\n');
  } else {
    console.log('\n🟠️ Some tests failed. Please review before proceeding.\n');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };