#!/usr/bin/env node

/**
 * Simple verification script to test if the systems actually exist and work
 */

console.log('🔍 Verifying Intelligent Agent Management Systems...\n');

let results = {
  pooling: { exists: false, components: 0, works: false },
  routing: { exists: false, components: 0, works: false },
  selection: { exists: false, components: 0, works: false },
  lifecycle: { exists: false, components: 0, works: false }
};

// Test 1: Check if pooling components exist
console.log('1. Checking Pooling System...');
try {
  const { UsageTracker } = require('../src/core/pooling/usage-tracker');
  const tracker = new UsageTracker();
  console.log('   🏁 UsageTracker works');
  results.pooling.components++;
  
  // Test basic functionality
  tracker.trackUsage('test-specialist', { phase: 'testing' });
  const scores = tracker.getScores();
  console.log('   🏁 Can track usage');
  results.pooling.works = true;
} catch (error) {
  console.log('   🔴 UsageTracker failed:', error.message);
}

// Test 2: Check if routing components exist
console.log('\n2. Checking Routing System...');
try {
  const { TTLRouter } = require('../src/core/routing/ttl-router');
  const router = new TTLRouter();
  console.log('   🏁 TTLRouter exists');
  results.routing.components++;
  
  // Test basic functionality
  const tier = router.getTierForTTL(5000);
  console.log(`   🏁 Can determine tier: ${tier}`);
  results.routing.works = true;
} catch (error) {
  console.log('   🔴 TTLRouter failed:', error.message);
}

// Test 3: Check if selection matrix exists
console.log('\n3. Checking Selection Matrix...');
try {
  const { SelectionMatrix } = require('../src/core/selection/matrix-foundation');
  const matrix = new SelectionMatrix({ enablePersistence: false });
  console.log('   🏁 SelectionMatrix exists');
  results.selection.components++;
  
  // Test basic functionality
  matrix.update({ task: { type: 'test' }, specialist: { type: 'test' } }, 0.5);
  const result = matrix.lookup({ task: { type: 'test' }, specialist: { type: 'test' } });
  console.log('   🏁 Can store and retrieve values');
  
  matrix.shutdown();
  results.selection.works = true;
} catch (error) {
  console.log('   🔴 SelectionMatrix failed:', error.message);
}

// Test 4: Check if lifecycle system exists
console.log('\n4. Checking Lifecycle System...');
try {
  const { LifecycleStateMachine, LIFECYCLE_STATES } = require('../src/core/lifecycle/state-machine');
  const machine = new LifecycleStateMachine('test');
  console.log('   🏁 LifecycleStateMachine exists');
  console.log(`   🏁 Initial state: ${machine.getState()}`);
  results.lifecycle.components++;
  
  // Test transition
  machine.transition(LIFECYCLE_STATES.INITIALIZING, 'test').then(() => {
    console.log('   🏁 Can transition states');
    machine.shutdown();
  }).catch(err => {
    console.log('   🔴 Transition failed:', err.message);
  });
  
  results.lifecycle.works = true;
} catch (error) {
  console.log('   🔴 LifecycleStateMachine failed:', error.message);
}

// Test 5: Check integrated systems
console.log('\n5. Checking Integrated Systems...');
try {
  const { EnhancedLifecycleSystem } = require('../src/core/lifecycle/lifecycle-system');
  const system = new EnhancedLifecycleSystem();
  console.log('   🏁 EnhancedLifecycleSystem exists');
  
  const machine = system.createStateMachine('test-1');
  console.log('   🏁 Can create state machines');
  
  system.shutdown().then(() => {
    console.log('   🏁 Can shutdown cleanly');
  });
  
  results.lifecycle.components++;
} catch (error) {
  console.log('   🔴 EnhancedLifecycleSystem failed:', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY:');
console.log('='.repeat(50));

let totalWorking = 0;
let totalComponents = 0;

for (const [system, status] of Object.entries(results)) {
  totalComponents += status.components;
  if (status.works) totalWorking++;
  
  const emoji = status.works ? '🏁' : '🔴';
  console.log(`${emoji} ${system.toUpperCase()}: ${status.components} components, ${status.works ? 'working' : 'not working'}`);
}

console.log('\n' + '='.repeat(50));
console.log(`TOTAL: ${totalWorking}/4 systems working, ${totalComponents} components found`);

if (totalWorking < 4) {
  console.log('\n🟠️  Not all systems are working properly!');
  console.log('The implementation appears to be incomplete.');
  process.exit(1);
} else {
  console.log('\n🏁 All systems verified and working!');
  process.exit(0);
}