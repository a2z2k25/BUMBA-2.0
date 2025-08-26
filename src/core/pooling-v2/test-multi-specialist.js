#!/usr/bin/env node

/**
 * Test Suite for Multi-Specialist Pool
 * Validates intelligent pooling with multiple specialists
 */

const { MultiSpecialistPool, HeatLevel, Department } = require('./multi-specialist-pool');
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
  console.log('\n🧪 MULTI-SPECIALIST POOL TEST SUITE\n');
  console.log('=' .repeat(50));
  
  // Test 1: Initialization
  console.log('\n📋 Test Suite 1: Initialization');
  console.log('-'.repeat(40));
  
  const pool = new MultiSpecialistPool({ 
    verbose: false,
    maxSpecialists: 3,
    maxWarmSpecialists: 1
  });
  
  test('Pool initializes with 3 specialists', () => {
    assert(pool.specialists.size === 3, 'Should have 3 specialists');
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
  
  test('Departments are assigned correctly', () => {
    const types = pool.specialistTypes;
    assert(types.get('backend-1').department === Department.BACKEND, 'Backend department');
    assert(types.get('frontend-1').department === Department.FRONTEND, 'Frontend department');
    assert(types.get('data-1').department === Department.DATA, 'Data department');
  });
  
  // Test 2: Task Routing
  console.log('\n📋 Test Suite 2: Task Routing');
  console.log('-'.repeat(40));
  
  test('Routes backend tasks to backend specialist', () => {
    const selected = pool.selectSpecialist({ 
      type: 'api', 
      department: Department.BACKEND 
    });
    assert(selected === 'backend-1', 'Should select backend specialist');
  });
  
  test('Routes frontend tasks to frontend specialist', () => {
    const selected = pool.selectSpecialist({ 
      type: 'ui', 
      department: Department.FRONTEND 
    });
    assert(selected === 'frontend-1', 'Should select frontend specialist');
  });
  
  test('Routes data tasks to data specialist', () => {
    const selected = pool.selectSpecialist({ 
      type: 'ml', 
      department: Department.DATA 
    });
    assert(selected === 'data-1', 'Should select data specialist');
  });
  
  // Test 3: Usage Tracking
  console.log('\n📋 Test Suite 3: Usage Tracking');
  console.log('-'.repeat(40));
  
  await asyncTest('Tracks usage scores', async () => {
    const pool2 = new MultiSpecialistPool({ verbose: false });
    
    // Execute backend task
    await pool2.executeTask({ type: 'api', department: Department.BACKEND });
    
    const backendScore = pool2.usageScores.get('backend-1');
    assert(backendScore > 0, 'Backend should have usage score');
    assert(backendScore === 1.0, 'Should have full score after use');
  });
  
  await asyncTest('Updates heat levels based on usage', async () => {
    const pool3 = new MultiSpecialistPool({ verbose: false });
    
    // Execute multiple backend tasks
    await pool3.executeTask({ type: 'api' });
    
    const heatLevel = pool3.heatLevels.get('backend-1');
    assert(heatLevel === HeatLevel.HOT, 'Should be HOT after usage');
  });
  
  test('Applies usage decay', () => {
    const pool4 = new MultiSpecialistPool({ 
      verbose: false,
      usageDecayRate: 0.5 
    });
    
    // Set initial score
    pool4.usageScores.set('backend-1', 1.0);
    
    // Apply decay
    pool4.applyUsageDecay();
    
    const decayedScore = pool4.usageScores.get('backend-1');
    assert(decayedScore === 0.5, 'Score should decay');
  });
  
  // Test 4: Intelligent Warming
  console.log('\n📋 Test Suite 4: Intelligent Warming');
  console.log('-'.repeat(40));
  
  await asyncTest('Keeps hot specialists warm', async () => {
    const pool5 = new MultiSpecialistPool({ 
      verbose: false,
      maxWarmSpecialists: 1,
      warmThreshold: 0.4
    });
    
    // Make backend hot
    await pool5.executeTask({ type: 'api' });
    await pool5.executeTask({ type: 'api' });
    
    // Apply warming strategy
    await pool5.applyWarmingStrategy();
    
    // Check if backend is warm
    const backendState = pool5.specialists.get('backend-1').getState();
    assert(
      backendState === SpecialistState.WARM || 
      backendState === SpecialistState.ACTIVE,
      'Hot specialist should be warm'
    );
  });
  
  await asyncTest('Warming strategy works with usage patterns', async () => {
    const pool6 = new MultiSpecialistPool({ 
      verbose: false,
      maxWarmSpecialists: 1,
      warmThreshold: 0.4
    });
    
    // Set different usage scores directly
    pool6.usageScores.set('backend-1', 0.9);   // HOT
    pool6.usageScores.set('frontend-1', 0.3);  // COOL
    pool6.usageScores.set('data-1', 0.1);      // COLD
    
    // Update heat levels
    pool6.updateHeatLevels();
    
    // Apply warming strategy
    await pool6.applyWarmingStrategy();
    
    // Check heat levels are correct
    const backendHeat = pool6.heatLevels.get('backend-1');
    const frontendHeat = pool6.heatLevels.get('frontend-1');
    const dataHeat = pool6.heatLevels.get('data-1');
    
    assert(backendHeat === HeatLevel.HOT, 'Backend should be HOT');
    assert(frontendHeat === HeatLevel.COOL, 'Frontend should be COOL');
    assert(dataHeat === HeatLevel.COLD, 'Data should be COLD');
    
    // Backend should be selected for warming
    const backendState = pool6.specialists.get('backend-1').getState();
    assert(
      backendState === SpecialistState.WARMING || 
      backendState === SpecialistState.WARM,
      'Hot specialist should be warming or warm'
    );
  });
  
  // Test 5: Memory Efficiency
  console.log('\n📋 Test Suite 5: Memory Efficiency');
  console.log('-'.repeat(40));
  
  await asyncTest('Uses less memory than always-warm', async () => {
    const pool7 = new MultiSpecialistPool({ 
      verbose: false,
      cooldownTime: 1000 // Fast cooldown for test
    });
    
    // Execute a few tasks
    await pool7.executeTask({ type: 'api' });
    await pool7.executeTask({ type: 'ui' });
    
    // Wait for cooldown
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const metrics = pool7.getMetrics();
    const efficiency = metrics.efficiency.memoryVsAlwaysWarm;
    
    assert(efficiency.current < efficiency.alwaysWarm, 'Should use less memory');
  });
  
  test('Tracks peak memory usage', async () => {
    const pool8 = new MultiSpecialistPool({ verbose: false });
    
    await pool8.executeTask({ type: 'api' });
    await pool8.executeTask({ type: 'ui' });
    
    const metrics = pool8.getMetrics();
    assert(metrics.pool.peakMemory > 0, 'Should track peak memory');
    assert(metrics.pool.peakMemory >= metrics.pool.currentMemory, 'Peak >= current');
  });
  
  // Test 6: Department Patterns
  console.log('\n📋 Test Suite 6: Department Patterns');
  console.log('-'.repeat(40));
  
  await asyncTest('Tracks department usage', async () => {
    const pool9 = new MultiSpecialistPool({ verbose: false });
    
    await pool9.executeTask({ type: 'api', department: Department.BACKEND });
    await pool9.executeTask({ type: 'api', department: Department.BACKEND });
    await pool9.executeTask({ type: 'ui', department: Department.FRONTEND });
    
    const metrics = pool9.getMetrics();
    assert(metrics.usage.departmentUsage.BACKEND === 2, 'Should track backend usage');
    assert(metrics.usage.departmentUsage.FRONTEND === 1, 'Should track frontend usage');
  });
  
  test('Predicts next specialist based on patterns', async () => {
    const pool10 = new MultiSpecialistPool({ 
      verbose: false,
      predictionWindow: 3
    });
    
    // Create pattern
    await pool10.executeTask({ type: 'api', department: Department.BACKEND });
    await pool10.executeTask({ type: 'api', department: Department.BACKEND });
    
    const predicted = pool10.predictNextSpecialist();
    assert(predicted === 'backend-1', 'Should predict backend specialist');
  });
  
  // Test 7: Performance Metrics
  console.log('\n📋 Test Suite 7: Performance Metrics');
  console.log('-'.repeat(40));
  
  await asyncTest('Tracks warm hits and cold starts', async () => {
    const pool11 = new MultiSpecialistPool({ verbose: false });
    
    // First task = cold start
    await pool11.executeTask({ type: 'api' });
    // Second task = warm hit
    await pool11.executeTask({ type: 'api' });
    
    const metrics = pool11.getMetrics();
    assert(metrics.performance.coldStarts === 1, 'Should have 1 cold start');
    assert(metrics.performance.warmHits === 1, 'Should have 1 warm hit');
  });
  
  test('Calculates warm hit rate', async () => {
    const pool12 = new MultiSpecialistPool({ verbose: false });
    
    await pool12.executeTask({ type: 'api' });
    await pool12.executeTask({ type: 'api' });
    await pool12.executeTask({ type: 'api' });
    
    const metrics = pool12.getMetrics();
    const hitRate = metrics.performance.warmHitRate;
    assert(hitRate >= 0 && hitRate <= 1, 'Hit rate should be between 0 and 1');
    assert(hitRate > 0.5, 'Should have good hit rate for repeated tasks');
  });
  
  // Test 8: Edge Cases
  console.log('\n📋 Test Suite 8: Edge Cases');
  console.log('-'.repeat(40));
  
  await asyncTest('Handles unknown task types', async () => {
    const pool13 = new MultiSpecialistPool({ verbose: false });
    const result = await pool13.executeTask({ type: 'unknown' });
    assert(result.success === true, 'Should handle unknown task');
  });
  
  await asyncTest('Handles concurrent tasks', async () => {
    const pool14 = new MultiSpecialistPool({ verbose: false });
    
    const tasks = [
      pool14.executeTask({ type: 'api' }),
      pool14.executeTask({ type: 'ui' }),
      pool14.executeTask({ type: 'ml' })
    ];
    
    const results = await Promise.all(tasks);
    assert(results.every(r => r.success), 'All tasks should succeed');
  });
  
  test('Cleanup releases resources', () => {
    const pool15 = new MultiSpecialistPool({ verbose: false });
    pool15.destroy();
    
    // Check all specialists are destroyed
    let allDestroyed = true;
    for (const [id, specialist] of pool15.specialists) {
      if (specialist.cooldownTimer !== null) {
        allDestroyed = false;
      }
    }
    assert(allDestroyed, 'All specialists should be cleaned up');
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${testCount}`);
  console.log(`🏁 Passed: ${passCount}`);
  console.log(`🔴 Failed: ${failCount}`);
  console.log(`Success Rate: ${((passCount/testCount)*100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log('\n🏁 All tests passed! Multi-specialist system is working correctly.');
    console.log('🟡 Ready for production use.\n');
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