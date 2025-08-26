#!/usr/bin/env node

/**
 * BUMBA Advanced Specialist Example
 * Demonstrates specialist pooling and management
 */

process.env.BUMBA_OFFLINE = 'true';
process.env.LOG_LEVEL = 'ERROR';

const {
  acquireSpecialist,
  releaseSpecialist,
  getPoolStats,
  clearPool
} = require('../src/core/pooling/optimized-pool');

async function main() {
  console.log('BUMBA Advanced Specialist Example\n');
  console.log('='.repeat(50));
  
  // Clear pool for fresh start
  clearPool();
  
  // Example 1: Creating Mock Specialists
  console.log('\n1. Creating Specialists:');
  
  const specialists = {
    'api-architect': {
      name: 'API Architect',
      execute: async (task) => `Designed API for: ${task}`,
      memory: 'low'
    },
    'database-admin': {
      name: 'Database Admin',
      execute: async (task) => `Optimized query: ${task}`,
      memory: 'medium'
    },
    'security-auditor': {
      name: 'Security Auditor',
      execute: async (task) => `Audited: ${task}`,
      memory: 'high'
    }
  };
  
  // Example 2: Acquiring Specialists
  console.log('\n2. Acquiring Specialists:');
  
  for (const [type, spec] of Object.entries(specialists)) {
    const specialist = await acquireSpecialist(type, async () => spec);
    console.log(`  ✅ Acquired: ${specialist.name}`);
  }
  
  let stats = getPoolStats();
  console.log(`\n  Pool size: ${stats.size}/${stats.maxSize}`);
  console.log(`  Created: ${stats.created}`);
  
  // Example 3: Specialist Reuse
  console.log('\n3. Testing Reuse:');
  
  // Request same specialists again
  const reused = await acquireSpecialist('api-architect', async () => ({
    name: 'New API Architect' // This won't be used
  }));
  
  console.log(`  Reused specialist: ${reused.name}`);
  console.log(`  (Should be original "API Architect")`);
  
  stats = getPoolStats();
  console.log(`\n  Reuse count: ${stats.reused}`);
  console.log(`  Reuse rate: ${stats.reuseRate}`);
  
  // Example 4: Task Execution
  console.log('\n4. Executing Tasks:');
  
  const tasks = [
    { type: 'api-architect', task: 'user authentication' },
    { type: 'database-admin', task: 'SELECT * optimization' },
    { type: 'security-auditor', task: 'login flow' }
  ];
  
  for (const { type, task } of tasks) {
    const specialist = await acquireSpecialist(type, async () => specialists[type]);
    const result = await specialist.execute(task);
    console.log(`  ${result}`);
  }
  
  // Example 5: Memory Management
  console.log('\n5. Memory Management:');
  
  // Add many specialists to test eviction
  for (let i = 0; i < 15; i++) {
    await acquireSpecialist(`specialist-${i}`, async () => ({
      name: `Specialist ${i}`,
      id: i
    }));
  }
  
  stats = getPoolStats();
  console.log(`  Pool size after overflow: ${stats.size}/${stats.maxSize}`);
  console.log(`  (Should be capped at ${stats.maxSize})`);
  
  // Example 6: Release and Cleanup
  console.log('\n6. Cleanup:');
  
  releaseSpecialist('api-architect');
  console.log('  Released API Architect');
  
  clearPool();
  stats = getPoolStats();
  console.log(`  Pool cleared. Size: ${stats.size}`);
  
  // Example 7: Performance Metrics
  console.log('\n7. Performance Test:');
  
  const startTime = Date.now();
  const iterations = 100;
  
  for (let i = 0; i < iterations; i++) {
    await acquireSpecialist(`perf-${i % 10}`, async () => ({
      id: i % 10
    }));
  }
  
  const totalTime = Date.now() - startTime;
  const avgTime = totalTime / iterations;
  
  console.log(`  ${iterations} acquisitions: ${totalTime}ms`);
  console.log(`  Average: ${avgTime.toFixed(2)}ms per acquisition`);
  
  stats = getPoolStats();
  console.log(`  Final reuse rate: ${stats.reuseRate}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('Advanced example complete!');
}

main().catch(console.error);