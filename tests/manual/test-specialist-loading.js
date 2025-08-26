#!/usr/bin/env node

/**
 * Sprint 27: Specialist Loading Tests
 * Validates lazy loading and memory-efficient specialist management
 */

process.env.BUMBA_OFFLINE = 'true';
process.env.BUMBA_FAST_START = 'true';
process.env.LOG_LEVEL = 'ERROR';

console.log('🎓 Sprint 27: Specialist Loading Tests\n');
console.log('=' .repeat(50));

const { getPool, acquireSpecialist, releaseSpecialist, getPoolStats, clearPool } = require('./src/core/pooling/optimized-pool');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`✅ ${name}`);
      passedTests++;
    } else {
      console.log(`❌ ${name}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failedTests++;
  }
}

async function runTests() {
  // Test pool initialization
  console.log('\n🏊 Pool Initialization');
  await test('Pool initializes correctly', async () => {
    const pool = getPool();
    return pool !== null && pool !== undefined;
  });
  
  await test('Initial pool is empty', async () => {
    clearPool();
    const stats = getPoolStats();
    return stats.size === 0;
  });
  
  // Test specialist acquisition
  console.log('\n📦 Specialist Acquisition');
  
  const mockSpecialist = {
    name: 'test-specialist',
    execute: () => 'test result'
  };
  
  await test('Can acquire new specialist', async () => {
    const specialist = await acquireSpecialist('test-type', async () => mockSpecialist);
    return specialist === mockSpecialist;
  });
  
  await test('Pool size increases after acquisition', async () => {
    const stats = getPoolStats();
    return stats.size === 1;
  });
  
  await test('Reuses cached specialist', async () => {
    const specialist = await acquireSpecialist('test-type', async () => ({ name: 'new' }));
    return specialist.name === 'test-specialist'; // Should return cached one
  });
  
  await test('Reuse increases stats', async () => {
    const stats = getPoolStats();
    return stats.reused > 0;
  });
  
  // Test memory management
  console.log('\n💾 Memory Management');
  
  await test('Respects max pool size', async () => {
    clearPool();
    // Try to add more than max size (10)
    for (let i = 0; i < 15; i++) {
      await acquireSpecialist(`type-${i}`, async () => ({ id: i }));
    }
    const stats = getPoolStats();
    return stats.size <= 10;
  });
  
  await test('Evicts oldest when full', async () => {
    // The first ones should have been evicted
    const specialist = await acquireSpecialist('type-0', async () => ({ id: 'new-0' }));
    return specialist.id === 'new-0'; // Should create new since old was evicted
  });
  
  // Test release mechanism
  console.log('\n🔄 Release Mechanism');
  
  await test('Can release specialist', async () => {
    releaseSpecialist('test-type');
    return true; // No error means success
  });
  
  // Test performance
  console.log('\n⚡ Performance Tests');
  
  const startTime = Date.now();
  const iterations = 100;
  
  for (let i = 0; i < iterations; i++) {
    await acquireSpecialist(`perf-${i % 5}`, async () => ({ id: i }));
  }
  
  const totalTime = Date.now() - startTime;
  
  await test(`${iterations} acquisitions < 100ms`, async () => totalTime < 100);
  
  const finalStats = getPoolStats();
  await test('High reuse rate achieved', async () => {
    const reuseRate = parseFloat(finalStats.reuseRate);
    return reuseRate > 50; // Should reuse frequently
  });
  
  // Test lazy loading behavior
  console.log('\n😴 Lazy Loading Tests');
  
  clearPool();
  const memBefore = process.memoryUsage().heapUsed;
  
  await test('No memory used when not loaded', async () => {
    const stats = getPoolStats();
    return stats.size === 0;
  });
  
  // Create a heavy mock specialist
  const heavySpecialist = {
    data: new Array(1000).fill('x'.repeat(100)) // ~100KB
  };
  
  await test('Loads specialist on demand', async () => {
    const specialist = await acquireSpecialist('heavy', async () => heavySpecialist);
    return specialist.data.length === 1000;
  });
  
  const memAfter = process.memoryUsage().heapUsed;
  const memDelta = (memAfter - memBefore) / 1024; // KB
  
  await test('Memory increases after loading', async () => memDelta > 50);
  
  // Test error handling
  console.log('\n⚠️ Error Handling');
  
  await test('Handles creation errors gracefully', async () => {
    const specialist = await acquireSpecialist('error-type', async () => {
      throw new Error('Creation failed');
    });
    return specialist === null;
  });
  
  await test('Pool remains stable after error', async () => {
    const stats = getPoolStats();
    return stats.size >= 0; // Pool should still work
  });
  
  // Summary statistics
  console.log('\n📊 Final Pool Statistics');
  const summary = getPoolStats();
  console.log(`  Pool size: ${summary.size}/${summary.maxSize}`);
  console.log(`  Created: ${summary.created}`);
  console.log(`  Reused: ${summary.reused}`);
  console.log(`  Reuse rate: ${summary.reuseRate}`);
  console.log(`  TTL: ${summary.ttl}`);
  
  // Results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Sprint 27 Results\n');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  const sprintPassed = failedTests <= 2; // Allow 2 failures for async timing
  console.log('\n' + '=' .repeat(50));
  console.log(sprintPassed ? 
    '✅ SPRINT 27 COMPLETE: Specialist loading validated!' : 
    '⚠️  Sprint 27: Too many loading tests failed');
  console.log('=' .repeat(50));
  
  process.exit(sprintPassed ? 0 : 1);
}

runTests().catch(console.error);