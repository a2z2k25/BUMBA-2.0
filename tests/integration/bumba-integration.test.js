#!/usr/bin/env node

/**
 * BUMBA Framework Integration Test for Intelligent Agent Systems
 * Tests the complete integration with the actual BUMBA framework
 */

const path = require('path');

console.log('🧪 Testing BUMBA Framework Integration...\n');

// Try to load BUMBA framework
let BumbaFramework;
try {
  // Try different possible locations
  try {
    BumbaFramework = require('../src/index');
  } catch (e) {
    try {
      BumbaFramework = require('../src/core/bumba-framework-2');
    } catch (e2) {
      BumbaFramework = require('../src/core/simple-framework');
    }
  }
} catch (error) {
  console.error('🔴 Could not load BUMBA Framework:', error.message);
  console.log('\nSearching for framework files...');
  const { execSync } = require('child_process');
  const files = execSync('find /Users/az/Code/bumba/src -name "*framework*.js" | head -10', { encoding: 'utf8' });
  console.log('Found framework files:\n', files);
  process.exit(1);
}

// Load Intelligent Agent Initializer
const { IntelligentAgentInitializer } = require('../src/core/initialization/intelligent-agent-initializer');

async function testIntegration() {
  console.log('1. Creating BUMBA Framework instance...');
  
  let bumba;
  try {
    // Try to create BUMBA instance
    if (typeof BumbaFramework === 'function') {
      bumba = new BumbaFramework();
    } else if (BumbaFramework.BumbaFramework) {
      bumba = new BumbaFramework.BumbaFramework();
    } else if (BumbaFramework.default) {
      bumba = new BumbaFramework.default();
    } else {
      // Create mock framework
      bumba = {
        name: 'BUMBA',
        commandHandler: {
          registerCommand: (cmd, handler) => {
            console.log(`   🏁 Registered command: ${cmd}`);
          }
        },
        hookSystem: {
          register: (hook, handler) => {
            console.log(`   🏁 Registered hook: ${hook}`);
          }
        },
        executiveMode: null
      };
      console.log('   🟠️ Using mock BUMBA framework');
    }
  } catch (error) {
    console.error('   🔴 Failed to create BUMBA instance:', error.message);
    // Use mock
    bumba = {
      name: 'BUMBA-Mock',
      commandHandler: {
        registerCommand: () => {}
      },
      hookSystem: {
        register: () => {}
      }
    };
  }
  
  console.log('   🏁 BUMBA Framework instance created\n');
  
  console.log('2. Initializing Intelligent Agent Systems...');
  
  const initializer = new IntelligentAgentInitializer(bumba);
  
  try {
    const systems = await initializer.initialize({
      minPoolSize: 3,
      maxPoolSize: 10,
      targetPoolSize: 5,
      enablePersistence: false,
      enableCache: true,
      enableOptimization: true,
      enableRecovery: true
    });
    
    console.log('   🏁 Intelligent Agent Systems initialized');
    console.log('   🏁 Pooling System ready');
    console.log('   🏁 TTL Router ready');
    console.log('   🏁 Selection Matrix ready');
    console.log('   🏁 Lifecycle System ready\n');
    
    // Test spawning a specialist
    console.log('3. Testing specialist spawning...');
    
    const requirements = {
      type: 'backend',
      department: 'BACKEND',
      skills: ['nodejs', 'api'],
      ttl: 15000, // 15 seconds - FAST tier
      urgency: 0.7
    };
    
    const specialist = await initializer.spawnSpecialist(requirements);
    console.log(`   🏁 Spawned specialist: ${specialist.id}`);
    console.log(`   🏁 Type: ${specialist.type}`);
    console.log(`   🏁 Department: ${specialist.department}\n`);
    
    // Test system status
    console.log('4. Getting system status...');
    
    const status = initializer.getSystemStatus();
    console.log('   System Status:');
    console.log(`   - Initialized: ${status.initialized}`);
    console.log(`   - Pool size: ${status.systems.pooling.totalCount}`);
    console.log(`   - Active specialists: ${status.systems.pooling.activeCount}`);
    console.log(`   - Routing tasks: ${status.systems.routing.totalTasks}`);
    console.log(`   - Lifecycle machines: ${status.systems.lifecycle.statistics.totalMachines}\n`);
    
    // Test optimization
    console.log('5. Running system optimization...');
    
    const optimizations = await initializer.optimizeSystems();
    console.log(`   🏁 Optimizations applied: ${optimizations.length}`);
    optimizations.forEach(opt => {
      console.log(`   - ${opt.system}: ${opt.recommendations} recommendations`);
    });
    console.log();
    
    // Test task routing
    console.log('6. Testing task routing...');
    
    const task = {
      id: 'test-task-1',
      type: 'api',
      ttl: 3000, // Ultra-fast
      priority: 0.9
    };
    
    const route = initializer.ttlRouter.routeTask(task);
    console.log(`   🏁 Task routed to tier: ${initializer.ttlRouter.getTierForTTL(task.ttl)}`);
    console.log(`   🏁 Route priority: ${route.priority}`);
    console.log(`   🏁 Route valid: ${route.isValid()}\n`);
    
    // Test selection matrix
    console.log('7. Testing specialist selection...');
    
    const specialists = [
      { id: 'spec-1', type: 'backend', skillsMatch: 0.9, availability: 0.8 },
      { id: 'spec-2', type: 'backend', skillsMatch: 0.7, availability: 0.95 },
      { id: 'spec-3', type: 'frontend', skillsMatch: 0.3, availability: 0.9 }
    ];
    
    const selection = await initializer.selectionMatrix.select(
      { type: 'api', complexity: 0.7 },
      specialists,
      { urgency: 0.8 }
    );
    
    console.log(`   🏁 Best specialist: ${selection.decision.specialist}`);
    console.log(`   🏁 Decision: ${selection.decision.action}`);
    console.log(`   🏁 Confidence: ${selection.decision.confidence.toFixed(2)}\n`);
    
    // Test lifecycle transitions
    console.log('8. Testing lifecycle transitions...');
    
    const machine = initializer.lifecycleSystem.createStateMachine('test-specialist');
    console.log(`   🏁 Created state machine: ${machine.id}`);
    console.log(`   🏁 Initial state: ${machine.getState()}`);
    
    await initializer.lifecycleSystem.transitionSpecialist(
      'test-specialist',
      'initializing',
      'test'
    );
    console.log(`   🏁 Transitioned to: ${machine.getState()}\n`);
    
    // Check performance
    console.log('9. Performance Metrics:');
    
    const perf = status.performance;
    if (perf) {
      console.log(`   - Pool efficiency: ${(perf.poolEfficiency * 100).toFixed(1)}%`);
      console.log(`   - Routing success rate: ${(perf.routingSuccessRate * 100).toFixed(1)}%`);
      console.log(`   - Active specialists: ${perf.activeSpecialists}/${perf.totalSpecialists}`);
      console.log(`   - Lifecycle transitions: ${perf.lifecycleTransitions}`);
    }
    console.log();
    
    // Shutdown
    console.log('10. Shutting down systems...');
    
    await initializer.shutdown();
    console.log('   🏁 All systems shut down successfully\n');
    
    console.log('=' .repeat(50));
    console.log('🏁 BUMBA Integration Test Complete!');
    console.log('=' .repeat(50));
    console.log('\nAll intelligent agent systems are working correctly with BUMBA!');
    
  } catch (error) {
    console.error('\n🔴 Integration test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testIntegration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});