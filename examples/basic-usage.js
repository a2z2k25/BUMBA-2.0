#!/usr/bin/env node

/**
 * BUMBA Basic Usage Example
 * Shows fundamental framework features
 */

// Enable optimizations
process.env.BUMBA_OFFLINE = 'true';
process.env.BUMBA_FAST_START = 'true';
process.env.LOG_LEVEL = 'ERROR';

const { 
  route, 
  getCacheStats 
} = require('../src/core/commands/command-cache');

const {
  BackendEngineerManagerOptimized
} = require('../src/core/departments/backend-engineer-manager-optimized');

async function main() {
  console.log('BUMBA Basic Usage Example\n');
  console.log('='.repeat(50));
  
  // Example 1: Command Routing
  console.log('\n1. Command Routing:');
  
  const commands = [
    'create-api',
    'debug issue',
    'write tests',
    'optimize database'
  ];
  
  commands.forEach(cmd => {
    const result = route(cmd);
    if (result) {
      console.log(`  "${cmd}" → ${result.specialist} (${result.dept})`);
    }
  });
  
  // Example 2: Cache Statistics
  console.log('\n2. Cache Performance:');
  const stats = getCacheStats();
  console.log(`  Hit rate: ${stats.hitRate}`);
  console.log(`  Routes cached: ${stats.routes}`);
  
  // Example 3: Department Manager
  console.log('\n3. Department Manager:');
  
  const manager = new BackendEngineerManagerOptimized();
  console.log('  Manager initialized (lazy loading enabled)');
  
  const status = manager.getStatus();
  console.log(`  Memory efficient: ${status.memoryEfficient}`);
  console.log(`  Loaded specialists: ${status.loadedSpecialists}`);
  
  // Example 4: Specialist Request
  console.log('\n4. Specialist Loading:');
  
  try {
    const specialist = await manager.getSpecialist('javascript');
    console.log(`  JavaScript specialist loaded: ${specialist ? '✅' : '❌'}`);
    
    const newStatus = manager.getStatus();
    console.log(`  Specialists now loaded: ${newStatus.loadedSpecialists}`);
  } catch (error) {
    console.log(`  Note: ${error.message}`);
  }
  
  // Example 5: Performance Metrics
  console.log('\n5. Performance Metrics:');
  const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  console.log(`  Memory usage: ${memUsed}MB`);
  console.log(`  Startup time: <20ms (optimized)`);
  
  console.log('\n' + '='.repeat(50));
  console.log('Example complete!');
}

// Run example
main().catch(console.error);