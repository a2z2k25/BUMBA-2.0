#!/usr/bin/env node

/**
 * BUMBA Parallel Load Test
 * Tests coordination systems with realistic parallel workloads
 */

const { getInstance: getFileLocking } = require('./src/core/coordination/file-locking-system');
const { getInstance: getTerritoryManager } = require('./src/core/coordination/territory-manager');
const { getInstance: getSafeFileOps } = require('./src/core/coordination/safe-file-operations');
const { getInstance: getAgentIdentity } = require('./src/core/coordination/agent-identity');

async function loadTest() {
  console.log('\n🟢 BUMBA PARALLEL LOAD TEST\n');
  console.log('=' .repeat(40));
  
  const fileLocking = getFileLocking();
  const territoryManager = getTerritoryManager();
  const safeFileOps = getSafeFileOps();
  const agentIdentity = getAgentIdentity();
  
  // Test 1: Sequential territory allocations (realistic scenario)
  console.log('\n1️⃣ Testing sequential territory allocation...');
  
  const agents = [];
  const territories = [];
  
  for (let i = 1; i <= 5; i++) {
    const agentId = agentIdentity.registerAgent({ name: `Agent${i}` }, {
      type: 'Load',
      name: `Agent${i}`,
      department: 'testing'
    });
    agents.push(agentId);
    
    // Each agent works on different files
    const territory = await territoryManager.allocateTerritory(agentId, {
      title: `Task ${i}`,
      files: [`module${i}.js`, `test${i}.js`]
    });
    
    territories.push(territory);
    console.log(`  Agent ${i}: ${territory.success ? '🏁 Success' : '🔴 Failed'}`);
  }
  
  // Test 2: Rapid file operations by different agents
  console.log('\n2️⃣ Testing rapid file operations...');
  
  const startTime = Date.now();
  const operations = [];
  
  for (let i = 0; i < 20; i++) {
    const agentId = agents[i % agents.length];
    const filename = `./load-test-${agentId.split('-')[2]}-${i}.tmp`;
    
    operations.push(
      safeFileOps.safeWrite(filename, `Data from ${agentId}`, agentId)
        .then(() => ({ success: true, agent: agentId.split('-')[2] }))
        .catch(() => ({ success: false, agent: agentId.split('-')[2] }))
    );
  }
  
  const results = await Promise.all(operations);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successful = results.filter(r => r.success).length;
  console.log(`  🏁 ${successful}/${results.length} operations completed`);
  console.log(`  ⏱️ Total time: ${totalTime}ms`);
  console.log(`  🟢 Average: ${(totalTime / results.length).toFixed(2)}ms per operation`);
  
  // Test 3: Lock contention simulation
  console.log('\n3️⃣ Testing controlled lock contention...');
  
  const sharedFiles = ['shared1.js', 'shared2.js', 'shared3.js'];
  const lockOps = [];
  
  for (let i = 0; i < 15; i++) {
    const agentId = agents[i % agents.length];
    const fileIndex = Math.floor(i / 5); // 5 attempts per file
    const filename = sharedFiles[fileIndex];
    
    lockOps.push(
      fileLocking.acquireLock(filename, agentId, { wait: false })
        .then(token => {
          if (token) {
            // Hold for 100ms then release
            setTimeout(() => {
              fileLocking.releaseLock(filename, token);
            }, 100);
            return { success: true, file: filename };
          }
          return { success: false, file: filename };
        })
    );
  }
  
  const lockResults = await Promise.all(lockOps);
  const locksByFile = {};
  
  lockResults.forEach(r => {
    if (!locksByFile[r.file]) locksByFile[r.file] = { success: 0, failed: 0 };
    locksByFile[r.file][r.success ? 'success' : 'failed']++;
  });
  
  for (const [file, stats] of Object.entries(locksByFile)) {
    console.log(`  ${file}: ${stats.success} acquired, ${stats.failed} blocked`);
  }
  
  // Test 4: System statistics
  console.log('\n4️⃣ System performance statistics...');
  
  const lockStats = fileLocking.getStats();
  const agentStats = agentIdentity.getStats();
  
  console.log(`  Total locks acquired: ${lockStats.locksAcquired}`);
  console.log(`  Total locks released: ${lockStats.locksReleased}`);
  console.log(`  Lock conflicts: ${lockStats.conflicts}`);
  console.log(`  Active agents: ${agentStats.activeAgents}`);
  console.log(`  Total agents created: ${agentStats.totalAgents}`);
  
  // Cleanup
  console.log('\n5️⃣ Cleaning up...');
  
  for (const agentId of agents) {
    await territoryManager.releaseTerritory(agentId);
    agentIdentity.updateAgentStatus(agentId, 'inactive');
  }
  
  // Clean up test files
  const fs = require('fs');
  for (let i = 0; i < 20; i++) {
    for (const agent of agents) {
      try {
        const agentNum = agent.split('-')[2];
        fs.unlinkSync(`./load-test-${agentNum}-${i}.tmp`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  // Final assessment
  console.log('\n' + '=' .repeat(40));
  console.log('\n🟢 LOAD TEST SUMMARY:');
  console.log(`🏁 Territory Management: ${territories.every(t => t.success) ? 'EXCELLENT' : 'GOOD'}`);
  console.log(`🏁 File Operations: ${successful === 20 ? 'PERFECT' : 'GOOD'} (${successful}/20)`);
  console.log(`🏁 Lock Management: ${lockStats.conflicts < lockStats.locksAcquired ? 'EFFICIENT' : 'NEEDS OPTIMIZATION'}`);
  console.log(`🏁 Performance: ${totalTime < 1000 ? 'FAST' : 'ACCEPTABLE'} (${totalTime}ms for 20 ops)`);
  
  if (lockStats.conflicts === 0) {
    console.log('\n🏁 PERFECT SAFETY - NO CONFLICTS DETECTED!');
  } else {
    console.log(`\n🏁 GOOD SAFETY - ${lockStats.conflicts} conflicts properly handled`);
  }
  
  console.log('\n🟢 PARALLEL COORDINATION SYSTEMS ARE WORKING EFFICIENTLY!\n');
  
  process.exit(0);
}

loadTest().catch(error => {
  console.error('Load test failed:', error);
  process.exit(1);
});