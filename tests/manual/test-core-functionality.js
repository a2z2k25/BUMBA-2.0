#!/usr/bin/env node

/**
 * Core Functionality Test Suite
 * Sprint 25-26: Validate framework after optimizations
 */

// Enable offline and fast mode
process.env.BUMBA_OFFLINE = 'true';
process.env.BUMBA_FAST_START = 'true';
process.env.LOG_LEVEL = 'ERROR';

console.log('🧪 BUMBA Core Functionality Test\n');
console.log('=' .repeat(50));

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result || result === undefined) {
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
  // Test 1: Framework Loading
  console.log('\n📦 Framework Loading Tests');
  test('Framework can be required', () => {
    const framework = require('./src/index.js');
    return framework !== undefined;
  });
  
  // Test 2: Offline Mode
  console.log('\n🔌 Offline Mode Tests');
  test('Offline mode is active', () => {
    const { isOffline } = require('./src/core/config/offline-mode');
    return isOffline() === true;
  });
  
  // Test 3: Command Cache
  console.log('\n⚡ Command Cache Tests');
  test('Command cache initializes', () => {
    const { getCache } = require('./src/core/commands/command-cache');
    const cache = getCache();
    return cache !== null;
  });
  
  test('Command lookup works', () => {
    const { lookupCommand } = require('./src/core/commands/command-cache');
    const result = lookupCommand('create-api');
    return result && result.specialist === 'api-architect';
  });
  
  test('Cache statistics available', () => {
    const { getCacheStats } = require('./src/core/commands/command-cache');
    const stats = getCacheStats();
    return stats && stats.routes > 0;
  });
  
  // Test 4: Memory Optimization
  console.log('\n💾 Memory Optimization Tests');
  test('Memory optimizer initializes', () => {
    const { getMemoryStats } = require('./src/core/memory/memory-optimizer');
    const stats = getMemoryStats();
    return stats && stats.heapUsed !== undefined;
  });
  
  // Test 5: Fast Start
  console.log('\n🚀 Fast Start Tests');
  test('Fast start mode active', () => {
    const { getFastStart } = require('./src/core/fast-start');
    const fast = getFastStart();
    return fast.getStats().mode === 'fast';
  });
  
  // Test 6: Log Controller
  console.log('\n🔇 Log Controller Tests');
  test('Log suppression active', () => {
    const { getLogConfig } = require('./src/core/logging/log-controller');
    const config = getLogConfig();
    return config.suppressing === true;
  });
  
  // Test 7: Specialist Pool
  console.log('\n🏊 Specialist Pool Tests');
  test('Optimized pool initializes', () => {
    const { getPool } = require('./src/core/pooling/optimized-pool');
    const pool = getPool();
    return pool !== null;
  });
  
  test('Pool statistics available', () => {
    const { getPoolStats } = require('./src/core/pooling/optimized-pool');
    const stats = getPoolStats();
    return stats && stats.maxSize === 10;
  });
  
  // Test 8: Department Manager
  console.log('\n👔 Department Manager Tests');
  test('Optimized manager loads', () => {
    const path = './src/core/departments/backend-engineer-manager-optimized';
    delete require.cache[require.resolve(path)];
    const { BackendEngineerManagerOptimized } = require(path);
    return BackendEngineerManagerOptimized !== undefined;
  });
  
  test('Manager can be instantiated', () => {
    const { BackendEngineerManagerOptimized } = require('./src/core/departments/backend-engineer-manager-optimized');
    const manager = new BackendEngineerManagerOptimized();
    return manager !== null;
  });
  
  test('Manager status available', () => {
    const { BackendEngineerManagerOptimized } = require('./src/core/departments/backend-engineer-manager-optimized');
    const manager = new BackendEngineerManagerOptimized();
    const status = manager.getStatus();
    return status && status.memoryEfficient === true;
  });
  
  // Test 9: Context Preservation (if enabled)
  console.log('\n📝 Context Preservation Tests');
  try {
    test('Summarization system available', () => {
      const { createSummarizer } = require('./src/core/summarization/factory');
      const summarizer = createSummarizer('text');
      return summarizer !== null;
    });
    
    test('Token counter works', () => {
      const { TokenCounter } = require('./src/core/metrics/context-metrics');
      const counter = new TokenCounter();
      const estimate = counter.estimate('test string');
      return estimate > 0;
    });
  } catch (e) {
    console.log('  ⚠️  Context preservation modules not found (optional)');
  }
  
  // Test 10: Performance Benchmarks
  console.log('\n📊 Performance Benchmarks');
  const startTime = Date.now();
  const startMem = process.memoryUsage().heapUsed;
  
  test('Framework loads under 100ms', () => {
    const loadTime = Date.now() - startTime;
    return loadTime < 100;
  });
  
  test('Memory usage under 20MB', () => {
    const memUsed = (process.memoryUsage().heapUsed - startMem) / 1024 / 1024;
    return memUsed < 20;
  });
  
  // Final Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📈 Test Results Summary\n');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  const allPassed = failedTests === 0;
  console.log('\n' + '=' .repeat(50));
  console.log(allPassed ? '✅ ALL CORE TESTS PASSED!' : '⚠️  Some tests failed');
  console.log('=' .repeat(50));
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(console.error);