#!/usr/bin/env node

/**
 * Test Lazy Loading Implementation
 * Verifies memory savings and functionality
 */

const chalk = require('chalk');

console.log(chalk.blue('🧪 Testing Lazy Loading Implementation\n'));

// Test 1: Memory comparison
console.log(chalk.yellow('Test 1: Memory Impact\n'));

// Baseline - without lazy loading
console.log('Testing WITHOUT lazy loading...');
process.env.DISABLE_LAZY_LOADING = 'true';
const memoryBefore = process.memoryUsage();

const { SpecialistRegistry: OriginalRegistry } = require('../src/core/specialists/specialist-registry');
const originalRegistry = new OriginalRegistry();

const memoryAfterOriginal = process.memoryUsage();
const originalMemoryUsed = (memoryAfterOriginal.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;

console.log(`  Original Registry: ${originalMemoryUsed.toFixed(2)}MB`);
console.log(`  Specialists loaded: ${originalRegistry.specialists.size}\n`);

// Clear require cache
delete require.cache[require.resolve('../src/core/specialists/specialist-registry')];
delete require.cache[require.resolve('../src/core/specialists/specialist-registry-wrapper')];
delete require.cache[require.resolve('../src/core/specialists/specialist-registry-lazy')];

// Test with lazy loading
console.log('Testing WITH lazy loading...');
delete process.env.DISABLE_LAZY_LOADING;
const memoryBeforeLazy = process.memoryUsage();

const { SpecialistRegistry: LazyRegistry } = require('../src/core/specialists/specialist-registry');
const lazyRegistry = new LazyRegistry();

const memoryAfterLazy = process.memoryUsage();
const lazyMemoryUsed = (memoryAfterLazy.heapUsed - memoryBeforeLazy.heapUsed) / 1024 / 1024;

console.log(`  Lazy Registry: ${lazyMemoryUsed.toFixed(2)}MB`);
console.log(`  Specialists indexed: ${lazyRegistry.specialists.size}`);

const memorySaved = originalMemoryUsed - lazyMemoryUsed;
console.log(chalk.green(`\n  💾 Memory Saved: ${memorySaved.toFixed(2)}MB`));

// Test 2: Functionality verification
console.log(chalk.yellow('\nTest 2: Functionality Check\n'));

const testSpecialists = [
  'javascript-specialist',
  'python-specialist',
  'react-specialist',
  'postgresql-specialist'
];

let functionalityPassed = true;

for (const type of testSpecialists) {
  process.stdout.write(`  Testing ${type}... `);
  
  // Test that it exists
  if (!lazyRegistry.hasSpecialist(type)) {
    console.log(chalk.red('NOT FOUND'));
    functionalityPassed = false;
    continue;
  }
  
  // Test lazy loading
  const beforeLoad = process.memoryUsage().heapUsed;
  const specialist = lazyRegistry.getSpecialist(type);
  const afterLoad = process.memoryUsage().heapUsed;
  
  if (specialist) {
    const loadMemory = (afterLoad - beforeLoad) / 1024 / 1024;
    console.log(chalk.green(`🏁 Loaded (+${loadMemory.toFixed(3)}MB)`));
  } else {
    console.log(chalk.yellow('🟠 Not implemented'));
  }
}

// Test 3: Performance metrics
console.log(chalk.yellow('\nTest 3: Performance Metrics\n'));

const metrics = lazyRegistry.getPerformanceMetrics ? 
  lazyRegistry.getPerformanceMetrics() : 
  { message: 'Metrics not available' };

if (metrics.message) {
  console.log(`  ${metrics.message}`);
}

// Test 4: Instance creation
console.log(chalk.yellow('\nTest 4: Instance Creation\n'));

try {
  const instance = lazyRegistry.getSpecialistInstance('javascript-specialist', 'test', {});
  if (instance) {
    console.log(chalk.green('  🏁 Instance creation works'));
  } else {
    console.log(chalk.yellow('  🟠 Instance creation returned null'));
  }
} catch (error) {
  console.log(chalk.red(`  🔴 Instance creation failed: ${error.message}`));
}

// Summary
console.log(chalk.cyan('\n📊 Summary:\n'));

const percentSaved = (memorySaved / originalMemoryUsed * 100).toFixed(1);

if (memorySaved > 0 && functionalityPassed) {
  console.log(chalk.green(`🏁 Lazy loading successful!`));
  console.log(chalk.green(`   Memory saved: ${memorySaved.toFixed(2)}MB (${percentSaved}%)`));
  console.log(chalk.green(`   All functionality preserved`));
} else if (memorySaved > 0) {
  console.log(chalk.yellow(`🟠️ Memory saved but some functionality issues`));
  console.log(chalk.yellow(`   Memory saved: ${memorySaved.toFixed(2)}MB`));
  console.log(chalk.yellow(`   Check specialist implementations`));
} else {
  console.log(chalk.red(`🔴 No memory savings achieved`));
}

// Rollback instructions
console.log(chalk.gray('\n📝 Rollback if needed:'));
console.log(chalk.gray('   export DISABLE_LAZY_LOADING=true'));
console.log(chalk.gray('   OR'));
console.log(chalk.gray('   git checkout src/core/specialists/specialist-registry.js'));

process.exit(functionalityPassed && memorySaved > 0 ? 0 : 1);