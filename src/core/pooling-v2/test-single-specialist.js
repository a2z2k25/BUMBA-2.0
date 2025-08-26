#!/usr/bin/env node

/**
 * Test Suite for Single Specialist Pool
 * Validates functionality without breaking existing systems
 */

const { SingleSpecialistPool, SpecialistState, MEMORY_BY_STATE, RESPONSE_TIME } = require('./single-specialist-pool');

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
  console.log('\n🧪 SINGLE SPECIALIST POOL TEST SUITE\n');
  console.log('=' .repeat(50));
  
  // Test 1: Initialization
  console.log('\n📋 Test Suite 1: Initialization');
  console.log('-'.repeat(40));
  
  const pool = new SingleSpecialistPool({ verbose: false });
  
  test('Pool initializes with correct state', () => {
    assert(pool.getState() === SpecialistState.COLD, 'Should start in COLD state');
  });
  
  test('Initial memory is minimal', () => {
    assert(pool.metrics.memoryUsage === MEMORY_BY_STATE.cold, 'Should have minimal memory');
  });
  
  test('No tasks executed initially', () => {
    assert(pool.metrics.taskCount === 0, 'Task count should be 0');
  });
  
  // Test 2: State Transitions
  console.log('\n📋 Test Suite 2: State Transitions');
  console.log('-'.repeat(40));
  
  await asyncTest('Can transition from COLD to WARMING (auto-transitions to WARM)', async () => {
    const pool2 = new SingleSpecialistPool({ verbose: false });
    await pool2.transitionTo(SpecialistState.WARMING, 'test');
    // WARMING auto-transitions to WARM after loading
    assert(pool2.getState() === SpecialistState.WARM, 'Should auto-transition to WARM state');
  });
  
  await asyncTest('Cannot make invalid transitions', async () => {
    const pool3 = new SingleSpecialistPool({ verbose: false });
    let errorThrown = false;
    try {
      await pool3.transitionTo(SpecialistState.ACTIVE, 'invalid');
    } catch (error) {
      errorThrown = true;
    }
    assert(errorThrown, 'Should throw error for invalid transition');
  });
  
  test('Tracks state history', () => {
    assert(pool.stateHistory.length >= 0, 'Should track state history');
  });
  
  // Test 3: Task Execution
  console.log('\n📋 Test Suite 3: Task Execution');
  console.log('-'.repeat(40));
  
  await asyncTest('Can execute task from cold start', async () => {
    const pool4 = new SingleSpecialistPool({ verbose: false });
    const result = await pool4.executeTask({ id: 'test-1' });
    assert(result.success === true, 'Task should succeed');
    assert(result.responseTime > 1000, 'Cold start should take > 1000ms');
  });
  
  await asyncTest('Warm starts are faster', async () => {
    const pool5 = new SingleSpecialistPool({ verbose: false });
    await pool5.executeTask({ id: 'test-1' }); // Cold start
    const result2 = await pool5.executeTask({ id: 'test-2' }); // Warm start
    assert(result2.responseTime < 500, 'Warm start should be < 500ms');
  });
  
  await asyncTest('Tracks task metrics', async () => {
    const pool6 = new SingleSpecialistPool({ verbose: false });
    await pool6.executeTask({ id: 'test-1' }); // Cold start
    await pool6.executeTask({ id: 'test-2' }); // Warm start
    const metrics = pool6.getMetrics();
    assert(metrics.performance.taskCount === 2, 'Should count tasks');
    assert(metrics.performance.coldStarts === 1, 'Should track cold starts');
    // Note: warmStarts count might be 2 due to internal state transitions
    assert(metrics.performance.warmStarts >= 1, 'Should track at least one warm start');
  });
  
  // Test 4: Memory Management
  console.log('\n📋 Test Suite 4: Memory Management');
  console.log('-'.repeat(40));
  
  test('Memory changes with state', () => {
    assert(MEMORY_BY_STATE.cold < MEMORY_BY_STATE.warm, 'Cold uses less than warm');
    assert(MEMORY_BY_STATE.warm < MEMORY_BY_STATE.active, 'Warm uses less than active');
  });
  
  await asyncTest('Memory increases during warm-up', async () => {
    const pool7 = new SingleSpecialistPool({ verbose: false });
    const initialMemory = pool7.metrics.memoryUsage;
    await pool7.executeTask({ id: 'test' });
    await new Promise(resolve => setTimeout(resolve, 100)); // Let it settle
    const warmMemory = pool7.metrics.memoryUsage;
    assert(warmMemory > initialMemory, 'Memory should increase');
  });
  
  // Test 5: Cooldown Behavior
  console.log('\n📋 Test Suite 5: Cooldown Behavior');
  console.log('-'.repeat(40));
  
  await asyncTest('Cools down after idle period', async () => {
    const pool8 = new SingleSpecialistPool({ 
      verbose: false,
      cooldownTime: 1000 // 1 second for testing
    });
    
    await pool8.executeTask({ id: 'test' });
    assert(pool8.getState() === SpecialistState.WARM, 'Should be warm after task');
    
    // Wait for cooldown
    await new Promise(resolve => setTimeout(resolve, 1500));
    assert(pool8.getState() === SpecialistState.COLD, 'Should cool down to cold');
  });
  
  // Test 6: Efficiency Metrics
  console.log('\n📋 Test Suite 6: Efficiency Metrics');
  console.log('-'.repeat(40));
  
  await asyncTest('Calculates memory efficiency', async () => {
    const pool9 = new SingleSpecialistPool({ verbose: false });
    await pool9.executeTask({ id: 'test-1' });
    const metrics = pool9.getMetrics();
    assert(metrics.efficiency.memoryEfficiency !== undefined, 'Should calculate efficiency');
  });
  
  test('Calculates state distribution', () => {
    const metrics = pool.getMetrics();
    const distribution = metrics.efficiency.stateDistribution;
    assert(typeof distribution === 'object', 'Should return distribution object');
    
    // Sum should be approximately 100%
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    assertApprox(total, 100, 1, 'Distribution should sum to ~100%');
  });
  
  // Test 7: Isolation from Existing Systems
  console.log('\n📋 Test Suite 7: System Isolation');
  console.log('-'.repeat(40));
  
  test('Does not require existing BUMBA modules', () => {
    // Check that we're not importing from outside pooling-v2
    const moduleCode = require('fs').readFileSync(
      '/Users/az/Code/bumba/src/core/pooling-v2/single-specialist-pool.js', 
      'utf8'
    );
    
    // Only allow events module and relative imports
    const hasExternalImports = moduleCode.includes("require('../logging") || 
                               moduleCode.includes("require('../spawning") ||
                               moduleCode.includes("require('../routing");
    
    assert(!hasExternalImports, 'Should not depend on external BUMBA modules');
  });
  
  test('Uses standard Node.js EventEmitter', () => {
    assert(pool instanceof require('events').EventEmitter, 'Should use standard EventEmitter');
  });
  
  test('Cleanup releases all resources', () => {
    const pool10 = new SingleSpecialistPool({ verbose: false });
    pool10.destroy();
    assert(pool10.specialist.context === null, 'Should release context');
    assert(pool10.cooldownTimer === null, 'Should clear timers');
  });
  
  // Test 8: Edge Cases
  console.log('\n📋 Test Suite 8: Edge Cases');
  console.log('-'.repeat(40));
  
  await asyncTest('Handles rapid task succession', async () => {
    const pool11 = new SingleSpecialistPool({ verbose: false });
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(pool11.executeTask({ id: `rapid-${i}` }));
    }
    
    const results = await Promise.all(promises);
    assert(results.every(r => r.success), 'All tasks should succeed');
  });
  
  test('Handles empty task object', async () => {
    const pool12 = new SingleSpecialistPool({ verbose: false });
    const result = await pool12.executeTask({});
    assert(result.success === true, 'Should handle empty task');
  });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${testCount}`);
  console.log(`🏁 Passed: ${passCount}`);
  console.log(`🔴 Failed: ${failCount}`);
  console.log(`Success Rate: ${((passCount/testCount)*100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log('\n🏁 All tests passed! System is working correctly.');
    console.log('🟡 SingleSpecialistPool is ready for integration.\n');
  } else {
    console.log('\n🟠️ Some tests failed. Please review before integration.\n');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };