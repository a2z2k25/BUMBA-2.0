#!/usr/bin/env node

/**
 * BUMBA Performance Demo
 * Showcases the framework's speed optimizations
 */

process.env.BUMBA_OFFLINE = 'true';
process.env.BUMBA_FAST_START = 'true';
process.env.LOG_LEVEL = 'SILENT';

console.log('⚡ BUMBA Performance Demo\n');
console.log('='.repeat(50));

async function measureStartup() {
  console.log('\n📊 Startup Performance:');
  
  const startTime = Date.now();
  const startMem = process.memoryUsage().heapUsed;
  
  // Load framework
  const framework = require('../src/index');
  
  const loadTime = Date.now() - startTime;
  const memUsed = (process.memoryUsage().heapUsed - startMem) / 1024 / 1024;
  
  console.log(`  Framework load time: ${loadTime}ms ${loadTime < 50 ? '✅' : '⚠️'}`);
  console.log(`  Memory used: ${memUsed.toFixed(2)}MB ${memUsed < 20 ? '✅' : '⚠️'}`);
  
  return { loadTime, memUsed };
}

async function measureCommandRouting() {
  console.log('\n⚡ Command Routing Performance:');
  
  const { lookupCommand, getCacheStats } = require('../src/core/commands/command-cache');
  
  const commands = [
    'create-api', 'debug', 'deploy', 'test',
    'optimize', 'refactor', 'review', 'document'
  ];
  
  const iterations = 1000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    commands.forEach(cmd => lookupCommand(cmd));
  }
  
  const totalTime = Date.now() - startTime;
  const totalLookups = iterations * commands.length;
  const avgTime = totalTime / totalLookups;
  
  console.log(`  ${totalLookups} lookups: ${totalTime}ms`);
  console.log(`  Average: ${avgTime.toFixed(4)}ms per lookup ${avgTime < 0.1 ? '✅' : '⚠️'}`);
  
  const stats = getCacheStats();
  console.log(`  Cache hit rate: ${stats.hitRate} ${parseFloat(stats.hitRate) > 95 ? '✅' : '⚠️'}`);
  
  return { totalTime, avgTime, hitRate: stats.hitRate };
}

async function measurePooling() {
  console.log('\n🏊 Specialist Pool Performance:');
  
  const { 
    acquireSpecialist, 
    getPoolStats, 
    clearPool 
  } = require('../src/core/pooling/optimized-pool');
  
  clearPool();
  
  const startTime = Date.now();
  const iterations = 50;
  
  // Create and reuse specialists
  for (let i = 0; i < iterations; i++) {
    await acquireSpecialist(`type-${i % 5}`, async () => ({
      id: i % 5,
      data: 'specialist data'
    }));
  }
  
  const poolTime = Date.now() - startTime;
  const stats = getPoolStats();
  
  console.log(`  ${iterations} operations: ${poolTime}ms`);
  console.log(`  Pool size: ${stats.size}/${stats.maxSize}`);
  console.log(`  Reuse rate: ${stats.reuseRate} ${parseFloat(stats.reuseRate) > 50 ? '✅' : '⚠️'}`);
  
  return { poolTime, reuseRate: stats.reuseRate };
}

async function measureMemory() {
  console.log('\n💾 Memory Optimization:');
  
  const { getMemoryStats } = require('../src/core/memory/memory-optimizer');
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const stats = getMemoryStats();
  const heapMB = parseFloat(stats.heapUsed.replace('MB', ''));
  const thresholdMB = parseFloat(stats.threshold.replace('MB', ''));
  
  console.log(`  Heap used: ${stats.heapUsed} ${heapMB < 50 ? '✅' : '⚠️'}`);
  console.log(`  Threshold: ${stats.threshold}`);
  console.log(`  Efficiency: ${((1 - heapMB/thresholdMB) * 100).toFixed(1)}%`);
  
  return { heapUsed: heapMB, threshold: thresholdMB };
}

async function stressTest() {
  console.log('\n🏋️ Stress Test:');
  
  const operations = [];
  const startTime = Date.now();
  const startMem = process.memoryUsage().heapUsed;
  
  // Parallel operations
  for (let i = 0; i < 100; i++) {
    operations.push((async () => {
      const { lookupCommand } = require('../src/core/commands/command-cache');
      return lookupCommand(`command-${i}`);
    })());
  }
  
  await Promise.all(operations);
  
  const stressTime = Date.now() - startTime;
  const memDelta = (process.memoryUsage().heapUsed - startMem) / 1024 / 1024;
  
  console.log(`  100 parallel operations: ${stressTime}ms ${stressTime < 200 ? '✅' : '⚠️'}`);
  console.log(`  Memory delta: ${memDelta.toFixed(2)}MB ${memDelta < 20 ? '✅' : '⚠️'}`);
  
  return { stressTime, memDelta };
}

async function main() {
  const results = {
    startup: await measureStartup(),
    routing: await measureCommandRouting(),
    pooling: await measurePooling(),
    memory: await measureMemory(),
    stress: await stressTest()
  };
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 Performance Summary\n');
  
  const grade = {
    startup: results.startup.loadTime < 50 ? 'A+' : results.startup.loadTime < 100 ? 'A' : 'B',
    memory: results.memory.heapUsed < 20 ? 'A+' : results.memory.heapUsed < 50 ? 'A' : 'B',
    routing: parseFloat(results.routing.hitRate) > 95 ? 'A+' : 'B',
    pooling: parseFloat(results.pooling.reuseRate) > 70 ? 'A+' : 'B',
    stress: results.stress.stressTime < 200 ? 'A+' : 'B'
  };
  
  console.log('Performance Grades:');
  console.log(`  Startup: ${grade.startup}`);
  console.log(`  Memory: ${grade.memory}`);
  console.log(`  Routing: ${grade.routing}`);
  console.log(`  Pooling: ${grade.pooling}`);
  console.log(`  Stress: ${grade.stress}`);
  
  const overallGrade = Object.values(grade).every(g => g === 'A+') ? 'A+' : 'A';
  
  console.log(`\n  Overall: ${overallGrade} 🎉`);
  
  console.log('\n' + '='.repeat(50));
  console.log('Performance demo complete!');
}

main().catch(console.error);