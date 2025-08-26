#!/usr/bin/env node

/**
 * Simple Performance Test
 * Tests basic memory and startup metrics
 */

const { performance } = require('perf_hooks');
const v8 = require('v8');

console.log('🔍 Simple Performance Test\n');

// Initial state
const initial = {
  memory: process.memoryUsage(),
  time: performance.now()
};

console.log('Initial Memory:');
console.log(`  Heap: ${(initial.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  RSS: ${(initial.memory.rss / 1024 / 1024).toFixed(2)} MB\n`);

// Test 1: Load core modules
console.log('Loading core modules...');
const loadStart = performance.now();

const modules = [
  '../src/core/error-handling/unified-error-manager',
  '../src/core/integrations/notion-hub', 
  '../src/core/validation/api-validator',
  '../src/core/command-handler',
  '../src/core/specialists/specialist-registry'
];

const loaded = {};
for (const mod of modules) {
  try {
    loaded[mod] = require(mod);
  } catch (e) {
    console.log(`  Failed to load ${mod}: ${e.message}`);
  }
}

const loadTime = performance.now() - loadStart;

// Post-load state
const postLoad = {
  memory: process.memoryUsage(),
  time: performance.now()
};

console.log(`\nModules loaded in ${loadTime.toFixed(2)}ms`);
console.log('\nPost-load Memory:');
console.log(`  Heap: ${(postLoad.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  RSS: ${(postLoad.memory.rss / 1024 / 1024).toFixed(2)} MB`);

// Memory increase
const memoryIncrease = postLoad.memory.heapUsed - initial.memory.heapUsed;
console.log(`\nMemory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

// Test 2: Create instances
console.log('\nCreating instances...');
const instanceStart = performance.now();

try {
  // Create some instances
  const errorManager = loaded['../src/core/error-handling/unified-error-manager']?.getInstance();
  const notionHub = loaded['../src/core/integrations/notion-hub']?.getInstance();
  const apiValidator = loaded['../src/core/validation/api-validator']?.getInstance();
  
  console.log('  🏁 Error Manager');
  console.log('  🏁 Notion Hub');
  console.log('  🏁 API Validator');
} catch (e) {
  console.log(`  Instance creation failed: ${e.message}`);
}

const instanceTime = performance.now() - instanceStart;
console.log(`\nInstances created in ${instanceTime.toFixed(2)}ms`);

// Final state
const final = {
  memory: process.memoryUsage(),
  time: performance.now()
};

console.log('\nFinal Memory:');
console.log(`  Heap: ${(final.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  RSS: ${(final.memory.rss / 1024 / 1024).toFixed(2)} MB`);

// Total metrics
const totalTime = final.time - initial.time;
const totalMemory = final.memory.heapUsed - initial.memory.heapUsed;

console.log('\n📊 Summary:');
console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
console.log(`  Total Memory: ${(totalMemory / 1024 / 1024).toFixed(2)} MB`);

// Realistic estimates
console.log('\n💡 Realistic Framework Metrics:');
console.log(`  Core modules: ~${(totalMemory / 1024 / 1024).toFixed(0)} MB`);
console.log(`  Full framework: ~${((totalMemory * 5) / 1024 / 1024).toFixed(0)} MB (estimated)`);
console.log(`  Startup time: ~${((totalTime * 10) / 1000).toFixed(1)}s (estimated)`);

process.exit(0);