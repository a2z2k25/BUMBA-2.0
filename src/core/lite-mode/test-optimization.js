/**
 * Test Resource Optimization for Lite Mode
 * Sprint 4: Verify optimization features work correctly
 */

const { createLiteMode } = require('./lite-mode-integration');

async function testOptimization() {
  console.log('🧪 LITE MODE RESOURCE OPTIMIZATION TEST\n');
  
  // Create optimized instance
  const lite = createLiteMode({ 
    visual: true,
    enableOptimization: true,
    enableCache: true
  });
  
  // Initialize
  await lite.initialize();
  
  console.log('📝 Testing cache performance...\n');
  
  // Test 1: Same task multiple times (should hit cache)
  const task1 = {
    prompt: 'Create a login form',
    type: 'component'
  };
  
  console.log('Executing task 1st time (cache miss expected)...');
  const start1 = Date.now();
  await lite.execute(task1);
  const time1 = Date.now() - start1;
  console.log(`   Time: ${time1}ms\n`);
  
  console.log('Executing same task 2nd time (cache hit expected)...');
  const start2 = Date.now();
  await lite.execute(task1);
  const time2 = Date.now() - start2;
  console.log(`   Time: ${time2}ms`);
  console.log(`   Speedup: ${time2 < time1 ? '🏁' : '🔴'} ${Math.round((time1 - time2) / time1 * 100)}% faster\n`);
  
  // Test 2: Multiple different tasks (test memory pool)
  console.log('📝 Testing memory pool...\n');
  
  const tasks = [
    { prompt: 'Create API endpoint', type: 'api' },
    { prompt: 'Design dashboard', type: 'ui' },
    { prompt: 'Write unit tests', type: 'test' },
    { prompt: 'Plan architecture', type: 'plan' },
    { prompt: 'Debug issue', type: 'debug' }
  ];
  
  for (const task of tasks) {
    await lite.execute(task);
  }
  
  // Test 3: Complex task with coordination
  console.log('📝 Testing optimized coordination...\n');
  
  const complexTask = {
    prompt: 'Build complete authentication system',
    type: 'feature'
  };
  
  const start3 = Date.now();
  await lite.execute(complexTask);
  const time3 = Date.now() - start3;
  console.log(`   Complex task time: ${time3}ms\n`);
  
  // Show detailed metrics
  lite.dashboard();
  
  // Show optimization dashboard
  if (lite.optimizer) {
    lite.optimizer.dashboard();
  }
  
  // Validate all constraints still met
  const validation = await lite.validate();
  
  // Test memory optimization
  console.log('📝 Testing memory optimization...\n');
  
  if (lite.optimizer) {
    const beforeOptimize = process.memoryUsage().heapUsed;
    console.log(`   Memory before optimization: ${Math.round(beforeOptimize / 1024 / 1024)}MB`);
    
    const reclaimed = await lite.optimizer.optimizeMemory();
    const afterOptimize = process.memoryUsage().heapUsed;
    
    console.log(`   Memory after optimization: ${Math.round(afterOptimize / 1024 / 1024)}MB`);
    console.log(`   Memory reclaimed: ${Math.round(reclaimed / 1024 / 1024)}MB\n`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const metrics = lite.getMetrics();
  
  if (metrics.optimization) {
    console.log('\n🏁 Optimization Features Working:');
    console.log(`   • Cache enabled: ${metrics.optimization.cache ? '🏁' : '🔴'}`);
    console.log(`   • Memory pool enabled: ${metrics.optimization.memoryPool ? '🏁' : '🔴'}`);
    console.log(`   • Task batching enabled: ${metrics.optimization.taskQueue ? '🏁' : '🔴'}`);
    console.log(`   • Resource monitoring: ${metrics.optimization.monitor ? '🏁' : '🔴'}`);
    
    if (metrics.optimization.cache) {
      console.log(`\n📦 Cache Performance:`);
      console.log(`   • Hit rate: ${(metrics.optimization.cache.hitRate * 100).toFixed(1)}%`);
      console.log(`   • Items cached: ${metrics.optimization.cache.size}`);
      console.log(`   • Cache memory: ${Math.round(metrics.optimization.cache.memory / 1024)}KB`);
    }
    
    if (metrics.optimization.memoryPool) {
      console.log(`\n🔄 Memory Pool:`);
      console.log(`   • Reuse rate: ${(metrics.optimization.memoryPool.reuseRate * 100).toFixed(1)}%`);
      console.log(`   • Objects created: ${metrics.optimization.memoryPool.created}`);
      console.log(`   • Objects reused: ${metrics.optimization.memoryPool.reused}`);
    }
  }
  
  console.log(`\n🟡 Overall Performance:`);
  console.log(`   • Tasks executed: ${metrics.tasksExecuted}`);
  console.log(`   • Avg execution time: ${Math.round(metrics.avgExecutionTime)}ms`);
  console.log(`   • Memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
  console.log(`   • Validation: ${validation.passed ? '🏁 PASSED' : '🔴 FAILED'}`);
  
  console.log('='.repeat(60) + '\n');
}

// Run test
testOptimization().catch(console.error);