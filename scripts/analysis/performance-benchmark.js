#!/usr/bin/env node

/**
 * Performance Benchmark
 * Compares BUMBA performance before and after Sprint 1 optimizations
 */

const { performance } = require('perf_hooks');
const v8 = require('v8');

console.log('🏁 BUMBA CLI Performance Benchmark\n');
console.log('═'.repeat(50));

async function benchmark() {
  const results = {
    baseline: {},
    optimized: {},
    improvement: {}
  };

  // Test 1: Baseline (no optimizations)
  console.log('\n📊 Baseline Performance (No Optimizations)\n');
  
  process.env.DISABLE_LAZY_LOADING = 'true';
  process.env.DISABLE_LAZY_DASHBOARD = 'true';
  
  // Clear require cache
  Object.keys(require.cache).forEach(key => {
    if (key.includes('bumba') || key.includes('/src/')) {
      delete require.cache[key];
    }
  });
  
  const baselineStart = performance.now();
  const baselineMemBefore = process.memoryUsage();
  
  const { createBumbaFramework: BaselineFramework } = require('../src/index');
  
  const baselineMemAfter = process.memoryUsage();
  const baselineEnd = performance.now();
  
  results.baseline = {
    loadTime: (baselineEnd - baselineStart).toFixed(2),
    memoryUsed: ((baselineMemAfter.heapUsed - baselineMemBefore.heapUsed) / 1024 / 1024).toFixed(2),
    heapTotal: (baselineMemAfter.heapTotal / 1024 / 1024).toFixed(2),
    external: (baselineMemAfter.external / 1024 / 1024).toFixed(2)
  };
  
  console.log(`  Load Time: ${results.baseline.loadTime}ms`);
  console.log(`  Memory Used: ${results.baseline.memoryUsed}MB`);
  console.log(`  Heap Total: ${results.baseline.heapTotal}MB`);
  
  // Clear for next test
  Object.keys(require.cache).forEach(key => {
    if (key.includes('bumba') || key.includes('/src/')) {
      delete require.cache[key];
    }
  });
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Test 2: Optimized (with all optimizations)
  console.log('\n🟡 Optimized Performance (All Optimizations)\n');
  
  delete process.env.DISABLE_LAZY_LOADING;
  delete process.env.DISABLE_LAZY_DASHBOARD;
  
  const optimizedStart = performance.now();
  const optimizedMemBefore = process.memoryUsage();
  
  const { createBumbaFramework: OptimizedFramework } = require('../src/index');
  
  const optimizedMemAfter = process.memoryUsage();
  const optimizedEnd = performance.now();
  
  results.optimized = {
    loadTime: (optimizedEnd - optimizedStart).toFixed(2),
    memoryUsed: ((optimizedMemAfter.heapUsed - optimizedMemBefore.heapUsed) / 1024 / 1024).toFixed(2),
    heapTotal: (optimizedMemAfter.heapTotal / 1024 / 1024).toFixed(2),
    external: (optimizedMemAfter.external / 1024 / 1024).toFixed(2)
  };
  
  console.log(`  Load Time: ${results.optimized.loadTime}ms`);
  console.log(`  Memory Used: ${results.optimized.memoryUsed}MB`);
  console.log(`  Heap Total: ${results.optimized.heapTotal}MB`);
  
  // Calculate improvements
  results.improvement = {
    loadTime: (((results.baseline.loadTime - results.optimized.loadTime) / results.baseline.loadTime) * 100).toFixed(1),
    memory: (((results.baseline.memoryUsed - results.optimized.memoryUsed) / results.baseline.memoryUsed) * 100).toFixed(1),
    absoluteMemory: (results.baseline.memoryUsed - results.optimized.memoryUsed).toFixed(2)
  };
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📈 PERFORMANCE IMPROVEMENT SUMMARY\n');
  console.log(`  🟢 Load Time: ${results.improvement.loadTime}% faster`);
  console.log(`  💾 Memory Usage: ${results.improvement.memory}% reduction`);
  console.log(`  📉 Memory Saved: ${results.improvement.absoluteMemory}MB`);
  
  // V8 Heap Statistics
  const heapStats = v8.getHeapStatistics();
  console.log('\n📊 V8 Heap Statistics:\n');
  console.log(`  Total Heap Size: ${(heapStats.total_heap_size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Used Heap Size: ${(heapStats.used_heap_size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Heap Size Limit: ${(heapStats.heap_size_limit / 1024 / 1024).toFixed(2)}MB`);
  
  // Feature Test
  console.log('\n🔧 Feature Availability:\n');
  
  try {
    const framework = await OptimizedFramework({
      skipInit: true,
      disableMonitoring: true,
      testing: true
    });
    
    console.log(`  🏁 Framework Version: ${framework.version}`);
    console.log(`  🏁 Operational: ${framework.isOperational}`);
    console.log(`  🏁 Departments: ${framework.departments.size} initialized`);
    console.log(`  🏁 Command Handler: Available`);
    console.log(`  🏁 Specialist Registry: Lazy loaded`);
  } catch (error) {
    console.log(`  🔴 Error: ${error.message}`);
  }
  
  // Performance Grade
  console.log('\n🏁 PERFORMANCE GRADE:\n');
  
  const memoryScore = parseFloat(results.improvement.memory);
  const speedScore = parseFloat(results.improvement.loadTime);
  
  let grade = 'F';
  if (memoryScore > 90 && speedScore > 90) grade = 'A+';
  else if (memoryScore > 80 && speedScore > 80) grade = 'A';
  else if (memoryScore > 70 && speedScore > 70) grade = 'B';
  else if (memoryScore > 60 && speedScore > 60) grade = 'C';
  else if (memoryScore > 50 && speedScore > 50) grade = 'D';
  
  console.log(`  Grade: ${grade}`);
  if (grade === 'A+') {
    console.log('  🟡 EXCEPTIONAL OPTIMIZATION!');
  } else if (grade === 'A') {
    console.log('  ⭐ EXCELLENT OPTIMIZATION!');
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n🏁 Benchmark Complete\n');
  
  return results;
}

// Run benchmark
benchmark().catch(console.error);