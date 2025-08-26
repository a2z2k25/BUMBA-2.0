#!/usr/bin/env node

/**
 * Test Timer Registry Cleanup
 * Verifies that timers are properly cleaned on exit
 */

const { getTimerRegistry, ComponentTimers } = require('../src/core/timers/timer-registry');

console.log('🧪 Testing Timer Registry Cleanup...\n');

// Get the registry
const registry = getTimerRegistry();

// Create some test timers
const testTimers = new ComponentTimers('test-cleanup');

// Add various timers
testTimers.setTimeout('test1', () => {
  console.log('Test timeout 1 fired');
}, 10000, 'Test timeout 1');

testTimers.setTimeout('test2', () => {
  console.log('Test timeout 2 fired');
}, 20000, 'Test timeout 2');

testTimers.setInterval('test3', () => {
  console.log('Test interval fired');
}, 1000, 'Test interval');

// Add some direct registry timers
registry.setTimeout('direct1', () => {
  console.log('Direct timeout fired');
}, 15000, 'Direct timeout');

registry.setInterval('direct2', () => {
  console.log('Direct interval fired');
}, 2000, 'Direct interval');

// Show initial state
console.log('Initial state:');
registry.report();

// Simulate some cleanup
setTimeout(() => {
  console.log('\nCleaning component timers...');
  testTimers.clearAll();
  
  console.log('\nAfter component cleanup:');
  registry.report();
}, 2000);

// Test process exit cleanup
setTimeout(() => {
  console.log('\n🛑 Simulating process exit...');
  console.log('Registry should clean all remaining timers...\n');
  
  // Show final stats
  const stats = registry.getStats();
  console.log('Final stats before exit:');
  console.log(`  Active timers: ${stats.active}`);
  console.log(`  Total registered: ${stats.registered}`);
  console.log(`  Total cleaned: ${stats.cleaned}`);
  console.log(`  Auto-cleaned duplicates: ${stats.autoCleanedDuplicates}`);
  console.log(`  Leak risk: ${stats.leakRisk}`);
  
  console.log('\n✅ Test complete! Exiting...');
  process.exit(0);
}, 3000);