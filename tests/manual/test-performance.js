#!/usr/bin/env node

/**
 * BUMBA Performance Test Suite
 * Tests all optimizations from Session 3
 */

// Enable offline and fast mode
process.env.BUMBA_OFFLINE = 'true';
process.env.BUMBA_FAST_START = 'true';
process.env.LOG_LEVEL = 'ERROR';

const startTime = Date.now();
const startMemory = process.memoryUsage().heapUsed;

console.log('🧪 BUMBA Performance Test\n');
console.log('=' .repeat(50));

// Test 1: Framework Load Time
console.log('\n1️⃣ Framework Load Time Test');
const loadStart = Date.now();
const framework = require('./src/index.js');
const loadTime = Date.now() - loadStart;
console.log(`   Load time: ${loadTime}ms ${loadTime < 500 ? '✅' : '⚠️'}`);

// Test 2: Offline Mode
console.log('\n2️⃣ Offline Mode Test');
const { isOffline, getOfflineMode } = require('./src/core/config/offline-mode');
console.log(`   Offline mode: ${isOffline() ? '✅ Enabled' : '❌ Disabled'}`);
const status = getOfflineMode().getStatus();
console.log(`   API calls: ${!status.features.apis ? '✅ Disabled' : '❌ Enabled'}`);

// Test 3: Memory Optimization
console.log('\n3️⃣ Memory Optimization Test');
const { getMemoryStats } = require('./src/core/memory/memory-optimizer');
const memStats = getMemoryStats();
console.log(`   Heap used: ${memStats.heapUsed}`);
console.log(`   Threshold: ${memStats.threshold}`);

// Test 4: Fast Start
console.log('\n4️⃣ Fast Start Test');
const { getFastStart } = require('./src/core/fast-start');
const fastStats = getFastStart().getStats();
console.log(`   Mode: ${fastStats.mode === 'fast' ? '✅ Fast' : '❌ Normal'}`);
console.log(`   Memory: ${fastStats.memoryUsage}`);

// Test 5: Log Suppression
console.log('\n5️⃣ Log Suppression Test');
const { getLogConfig } = require('./src/core/logging/log-controller');
const logConfig = getLogConfig();
console.log(`   Log level: ${logConfig.level}`);
console.log(`   Suppressing: ${logConfig.suppressing ? '✅ Yes' : '❌ No'}`);

// Test 6: Command Cache
console.log('\n6️⃣ Command Cache Test');
const { lookupCommand, getCacheStats } = require('./src/core/commands/command-cache');
// Test some lookups
lookupCommand('create-api');
lookupCommand('debug');
lookupCommand('deploy');
const cacheStats = getCacheStats();
console.log(`   Cached routes: ${cacheStats.routes}`);
console.log(`   Hit rate: ${cacheStats.hitRate}`);

// Test 7: Specialist Pool
console.log('\n7️⃣ Specialist Pool Test');
const { getPoolStats } = require('./src/core/pooling/optimized-pool');
const poolStats = getPoolStats();
console.log(`   Pool size: ${poolStats.size}/${poolStats.maxSize}`);
console.log(`   Reuse rate: ${poolStats.reuseRate}`);

// Test 8: Department Manager (Optimized)
console.log('\n8️⃣ Department Manager Test');
const managerStart = Date.now();
try {
  const { BackendEngineerManagerOptimized } = require('./src/core/departments/backend-engineer-manager-optimized');
  const manager = new BackendEngineerManagerOptimized();
  const managerTime = Date.now() - managerStart;
  console.log(`   Init time: ${managerTime}ms ${managerTime < 100 ? '✅' : '⚠️'}`);
  const managerStatus = manager.getStatus();
  console.log(`   Loaded specialists: ${managerStatus.loadedSpecialists}`);
  console.log(`   Memory efficient: ${managerStatus.memoryEfficient ? '✅' : '❌'}`);
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

// Final metrics
console.log('\n' + '=' .repeat(50));
console.log('📊 Final Metrics\n');

const totalTime = Date.now() - startTime;
const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;

console.log(`⏱️  Total time: ${totalTime}ms`);
console.log(`💾 Memory delta: ${memoryUsed.toFixed(2)}MB`);
console.log(`🔌 Mode: Offline`);
console.log(`⚡ Fast start: Enabled`);
console.log(`🔇 Logging: Suppressed`);

// Performance grades
console.log('\n📈 Performance Grades:');
console.log(`   Startup: ${totalTime < 1000 ? 'A+' : totalTime < 2000 ? 'B' : 'C'}`);
console.log(`   Memory: ${memoryUsed < 50 ? 'A+' : memoryUsed < 100 ? 'B' : 'C'}`);
console.log(`   Caching: ${parseFloat(cacheStats.hitRate) > 80 ? 'A+' : 'B'}`);

// Overall assessment
const passed = totalTime < 2000 && memoryUsed < 100;
console.log('\n' + '=' .repeat(50));
console.log(passed ? '✅ PERFORMANCE TEST PASSED!' : '⚠️  Performance needs improvement');
console.log('=' .repeat(50));

process.exit(passed ? 0 : 1);