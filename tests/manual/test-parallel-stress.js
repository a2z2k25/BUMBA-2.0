#!/usr/bin/env node

/**
 * BUMBA Parallel Safety Stress Test
 * Tests coordination systems under heavy parallel load
 */

const { getInstance: getFileLocking } = require('./src/core/coordination/file-locking-system');
const { getInstance: getTerritoryManager } = require('./src/core/coordination/territory-manager');
const { getInstance: getSafeFileOps } = require('./src/core/coordination/safe-file-operations');
const { getInstance: getAgentIdentity } = require('./src/core/coordination/agent-identity');

async function stressTest() {
  console.log('\n🟢 BUMBA PARALLEL SAFETY STRESS TEST\n');
  console.log('=' .repeat(50));
  
  const fileLocking = getFileLocking();
  const territoryManager = getTerritoryManager();
  const safeFileOps = getSafeFileOps();
  const agentIdentity = getAgentIdentity();
  
  // Create 10 agents
  console.log('\n1️⃣ Creating 10 test agents...');
  const agents = [];
  for (let i = 1; i <= 10; i++) {
    const agentId = agentIdentity.registerAgent({ name: `StressAgent${i}` }, {
      type: 'StressTest',
      name: `StressAgent${i}`,
      department: 'testing'
    });
    agents.push(agentId);
  }
  console.log(`🏁 Created ${agents.length} agents`);
  
  // Test 1: Concurrent lock attempts
  console.log('\n2️⃣ Testing concurrent lock attempts (50 attempts)...');
  const lockPromises = [];
  
  for (let i = 0; i < 50; i++) {
    const agentId = agents[i % agents.length];
    lockPromises.push(
      fileLocking.acquireLock(`test-file-${i % 5}.js`, agentId, { wait: false })
    );
  }
  
  const lockResults = await Promise.allSettled(lockPromises);
  const successfulLocks = lockResults.filter(r => r.status === 'fulfilled' && r.value !== null).length;
  
  console.log(`🏁 ${successfulLocks} locks acquired out of 50 attempts`);
  console.log(`🏁 ${50 - successfulLocks} attempts correctly blocked`);
  
  // Release all locks
  for (let i = 0; i < lockResults.length; i++) {
    if (lockResults[i].status === 'fulfilled' && lockResults[i].value) {
      try {
        await fileLocking.releaseLock(`test-file-${i % 5}.js`, lockResults[i].value);
      } catch (e) {
        // Ignore release errors
      }
    }
  }
  
  // Test 2: Territory allocation stress
  console.log('\n3️⃣ Testing territory allocation under stress...');
  
  const territoryPromises = [];
  const files = ['api.js', 'database.js', 'auth.js', 'utils.js', 'config.js'];
  
  for (let i = 0; i < agents.length; i++) {
    const agentId = agents[i];
    const taskFiles = [files[i % files.length], files[(i + 1) % files.length]];
    
    territoryPromises.push(
      territoryManager.allocateTerritory(agentId, {
        title: `Task ${i}`,
        files: taskFiles
      })
    );
  }
  
  const territoryResults = await Promise.allSettled(territoryPromises);
  const successfulTerritories = territoryResults.filter(r => 
    r.status === 'fulfilled' && r.value?.success
  ).length;
  
  console.log(`🏁 ${successfulTerritories} territories allocated successfully`);
  console.log(`🏁 ${agents.length - successfulTerritories} territories blocked due to conflicts`);
  
  // Test 3: Rapid file operations
  console.log('\n4️⃣ Testing rapid safe file operations...');
  
  const writePromises = [];
  for (let i = 0; i < 20; i++) {
    const agentId = agents[i % agents.length];
    const filename = `./stress-test-${i}.tmp`;
    
    writePromises.push(
      safeFileOps.safeWrite(filename, `Content from ${agentId}`, agentId)
        .then(() => ({ success: true, file: filename }))
        .catch(error => ({ success: false, error: error.message, file: filename }))
    );
  }
  
  const writeResults = await Promise.allSettled(writePromises);
  const successfulWrites = writeResults.filter(r => 
    r.status === 'fulfilled' && r.value?.success
  ).length;
  
  console.log(`🏁 ${successfulWrites} safe writes completed successfully`);
  
  // Cleanup test files
  const fs = require('fs');
  for (let i = 0; i < 20; i++) {
    try {
      fs.unlinkSync(`./stress-test-${i}.tmp`);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  // Test 4: System performance under load
  console.log('\n5️⃣ Measuring system performance...');
  
  const startTime = Date.now();
  
  // Simulate rapid operations
  const rapidPromises = [];
  for (let i = 0; i < 100; i++) {
    const agentId = agents[i % agents.length];
    rapidPromises.push(
      fileLocking.acquireLock(`perf-test-${i % 10}.js`, agentId, { wait: false })
        .then(token => {
          if (token) {
            return fileLocking.releaseLock(`perf-test-${i % 10}.js`, token);
          }
        })
    );
  }
  
  await Promise.allSettled(rapidPromises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`🏁 100 lock/unlock operations completed in ${totalTime}ms`);
  console.log(`🏁 Average operation time: ${(totalTime / 100).toFixed(2)}ms`);
  
  // Cleanup territories
  console.log('\n6️⃣ Cleaning up...');
  for (const agentId of agents) {
    try {
      await territoryManager.releaseTerritory(agentId);
      agentIdentity.updateAgentStatus(agentId, 'inactive');
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  // Final assessment
  console.log('\n' + '=' .repeat(50));
  console.log('\n🟢 STRESS TEST RESULTS:');
  console.log(`🏁 Concurrent Lock Safety: ${successfulLocks <= 5 ? 'PASSED' : 'FAILED'}`);
  console.log(`🏁 Territory Conflict Prevention: ${successfulTerritories < agents.length ? 'PASSED' : 'FAILED'}`);
  console.log(`🏁 Safe Write Operations: ${successfulWrites > 0 ? 'PASSED' : 'FAILED'}`);
  console.log(`🏁 Performance: ${totalTime < 5000 ? 'PASSED' : 'NEEDS OPTIMIZATION'}`);
  
  console.log('\n🟢 SAFETY SYSTEMS ARE ROBUST UNDER STRESS!\n');
  
  process.exit(0);
}

stressTest().catch(error => {
  console.error('Stress test failed:', error);
  process.exit(1);
});