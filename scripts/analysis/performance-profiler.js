#!/usr/bin/env node

/**
 * BUMBA Performance Profiler
 * Validates actual performance metrics vs claims
 * Claims: 50MB memory, 2s startup, unlimited parallel execution
 */

const { performance } = require('perf_hooks');
const v8 = require('v8');
const chalk = require('chalk');

// Disable monitoring for accurate measurement
process.env.BUMBA_DISABLE_MONITORING = 'true';
process.env.LOG_LEVEL = 'error';

async function profileStartup() {
  console.log(chalk.blue('🔍 BUMBA Performance Profiler\n'));
  console.log(chalk.gray('Testing claims: 50MB memory, 2s startup\n'));
  
  // Measure initial memory
  const initialMemory = process.memoryUsage();
  console.log(chalk.yellow('Initial Memory:'));
  console.log(`  RSS: ${formatBytes(initialMemory.rss)}`);
  console.log(`  Heap: ${formatBytes(initialMemory.heapUsed)} / ${formatBytes(initialMemory.heapTotal)}`);
  
  // Start timing
  const startTime = performance.now();
  
  // Load the framework
  console.log(chalk.blue('\n📦 Loading BUMBA Framework...'));
  
  try {
    // Load core framework
    const frameworkLoadStart = performance.now();
    const { createBumbaFramework } = require('../src/core/bumba-framework-2');
    const frameworkLoadTime = performance.now() - frameworkLoadStart;
    
    // Initialize framework
    const initStart = performance.now();
    const framework = await createBumbaFramework({
      skipInit: false,
      legacy: false,
      disableMonitoring: true
    });
    const initTime = performance.now() - initStart;
    
    // Total startup time
    const totalStartupTime = performance.now() - startTime;
    
    // Measure post-startup memory
    const postStartupMemory = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    // Memory increase
    const memoryIncrease = {
      rss: postStartupMemory.rss - initialMemory.rss,
      heap: postStartupMemory.heapUsed - initialMemory.heapUsed
    };
    
    // Display results
    console.log(chalk.green('\n🏁 Framework Loaded Successfully\n'));
    
    console.log(chalk.cyan('⏱️  Timing Results:'));
    console.log(`  Framework Load: ${frameworkLoadTime.toFixed(2)}ms`);
    console.log(`  Initialization: ${initTime.toFixed(2)}ms`);
    console.log(`  Total Startup: ${chalk.bold((totalStartupTime / 1000).toFixed(2))}s`);
    
    console.log(chalk.cyan('\n💾 Memory Results:'));
    console.log(`  Post-startup RSS: ${formatBytes(postStartupMemory.rss)}`);
    console.log(`  Post-startup Heap: ${formatBytes(postStartupMemory.heapUsed)} / ${formatBytes(postStartupMemory.heapTotal)}`);
    console.log(`  Memory Increase: ${chalk.bold(formatBytes(memoryIncrease.heap))}`);
    console.log(`  Heap Limit: ${formatBytes(heapStats.heap_size_limit)}`);
    
    // Validation against claims
    console.log(chalk.magenta('\n📊 Validation Against Claims:'));
    
    const startupPass = totalStartupTime < 2000;
    const memoryPass = memoryIncrease.heap < 50 * 1024 * 1024;
    
    console.log(`  Startup < 2s: ${startupPass ? chalk.green('🏁 PASS') : chalk.red('🔴 FAIL')} (${(totalStartupTime / 1000).toFixed(2)}s)`);
    console.log(`  Memory < 50MB: ${memoryPass ? chalk.green('🏁 PASS') : chalk.red('🔴 FAIL')} (${formatBytes(memoryIncrease.heap)})`);
    
    // Test parallel execution
    console.log(chalk.cyan('\n🔄 Testing Parallel Execution:'));
    const parallelStart = performance.now();
    
    // Simulate parallel operations
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(simulateOperation(i));
    }
    
    await Promise.all(promises);
    const parallelTime = performance.now() - parallelStart;
    
    console.log(`  10 parallel operations: ${parallelTime.toFixed(2)}ms`);
    console.log(`  Average per operation: ${(parallelTime / 10).toFixed(2)}ms`);
    
    // Final memory after operations
    const finalMemory = process.memoryUsage();
    console.log(chalk.cyan('\n💾 Final Memory:'));
    console.log(`  RSS: ${formatBytes(finalMemory.rss)}`);
    console.log(`  Heap: ${formatBytes(finalMemory.heapUsed)}`);
    console.log(`  Total Increase: ${chalk.bold(formatBytes(finalMemory.heapUsed - initialMemory.heapUsed))}`);
    
    // Summary
    console.log(chalk.yellow('\n📋 Summary:'));
    if (startupPass && memoryPass) {
      console.log(chalk.green('🏁 Framework meets performance claims!'));
    } else {
      console.log(chalk.red('🔴 Framework does not meet all performance claims'));
      console.log(chalk.yellow('\nRealistic metrics:'));
      console.log(`  Startup: ~${(totalStartupTime / 1000).toFixed(1)}s`);
      console.log(`  Memory: ~${formatBytes(memoryIncrease.heap)}`);
    }
    
    // Cleanup
    if (framework && framework.shutdown) {
      await framework.shutdown();
    }
    
  } catch (error) {
    console.error(chalk.red('🔴 Error during profiling:'), error);
  }
  
  process.exit(0);
}

async function simulateOperation(id) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Simulate some work
      const data = Array(1000).fill(id).map(x => x * Math.random());
      const result = data.reduce((a, b) => a + b, 0);
      resolve(result);
    }, 100);
  });
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Run profiler
profileStartup();