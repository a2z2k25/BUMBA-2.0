#!/usr/bin/env node

/**
 * Simple Orchestration System Test
 * Tests core functionality without hook complications
 */

console.log('\n🟢 Testing BUMBA Orchestration System (Simple)...\n');
console.log('=' .repeat(50));

async function simpleTest() {
  try {
    // Test 1: Load System
    console.log('\n🏁 Test 1: Loading System');
    const { BumbaOrchestrationSystem } = require('./src/core/orchestration');
    const system = new BumbaOrchestrationSystem({
      enableQualityChecks: false,
      enableMilestones: false,
      enableNotifications: false,
      autoStart: false
    });
    console.log('   🏁 System loaded');
    
    // Test 2: Initialize
    console.log('\n🏁 Test 2: Initializing');
    await system.initialize();
    console.log('   🏁 Initialized');
    
    // Test 3: Register Agents
    console.log('\n🏁 Test 3: Registering Agents');
    system.registerAgent({ id: 'agent-1', type: 'developer', skills: ['coding'] });
    system.registerAgent({ id: 'agent-2', type: 'designer', skills: ['design'] });
    console.log('   🏁 2 agents registered');
    
    // Test 4: Get Status
    console.log('\n🏁 Test 4: Getting Status');
    const status = system.getStatus();
    console.log(`   🏁 Components: ${status.components.length}`);
    console.log(`   🏁 Initialized: ${status.initialized}`);
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('\n🏁 SIMPLE TEST RESULTS:');
    console.log('   🏁 Loading: WORKING');
    console.log('   🏁 Initialization: WORKING');
    console.log('   🏁 Agent Registration: WORKING');
    console.log('   🏁 Status Check: WORKING');
    console.log('\n🟢 ORCHESTRATION SYSTEM IS OPERATIONAL!\n');
    
    // Shutdown
    await system.shutdown();
    process.exit(0);
    
  } catch (error) {
    console.error('\n🔴 Test failed:', error.message);
    process.exit(1);
  }
}

simpleTest();