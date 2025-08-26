#!/usr/bin/env node

/**
 * Memory Baseline Profiler
 * Captures current memory consumption for comparison
 */

const fs = require('fs');
const path = require('path');
const v8 = require('v8');
const chalk = require('chalk');

console.log(chalk.blue('📊 BUMBA Memory Baseline Profiler\n'));
console.log(chalk.gray(`Timestamp: ${new Date().toISOString()}\n`));

// Capture initial Node.js memory
const initialMemory = process.memoryUsage();
console.log(chalk.yellow('Initial Node.js Memory:'));
console.log(`  RSS:        ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used:  ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`  External:   ${(initialMemory.external / 1024 / 1024).toFixed(2)} MB\n`);

// Load and measure each component
const components = [
  { name: 'Configuration Manager', path: '../src/core/configuration/configuration-manager' },
  { name: 'Command Handler', path: '../src/core/command-handler' },
  { name: 'Error Manager', path: '../src/core/error-handling/unified-error-manager' },
  { name: 'API Validator', path: '../src/core/validation/api-validator' },
  { name: 'Notion Hub', path: '../src/core/integrations/notion-hub' },
  { name: 'Resource Enforcer', path: '../src/core/resource-management/resource-enforcer' },
  { name: 'Specialist Registry', path: '../src/core/specialists/specialist-registry' },
  { name: 'Product Manager', path: '../src/core/departments/product-strategist-manager' },
  { name: 'Design Manager', path: '../src/core/departments/design-engineer-manager' },
  { name: 'Backend Manager', path: '../src/core/departments/backend-engineer-manager' }
];

const memoryReport = {
  timestamp: new Date().toISOString(),
  initial: initialMemory,
  components: {},
  total: null
};

console.log(chalk.yellow('Loading Components:\n'));

for (const component of components) {
  const before = process.memoryUsage();
  
  try {
    require(component.path);
    const after = process.memoryUsage();
    
    const delta = {
      rss: (after.rss - before.rss) / 1024 / 1024,
      heapUsed: (after.heapUsed - before.heapUsed) / 1024 / 1024,
      heapTotal: (after.heapTotal - before.heapTotal) / 1024 / 1024
    };
    
    memoryReport.components[component.name] = delta;
    
    console.log(`  ${chalk.green('🏁')} ${component.name.padEnd(25)} +${delta.heapUsed.toFixed(2)} MB`);
  } catch (error) {
    console.log(`  ${chalk.red('🔴')} ${component.name.padEnd(25)} Failed to load`);
    memoryReport.components[component.name] = { error: error.message };
  }
}

// Load framework
console.log(chalk.yellow('\nLoading Full Framework:\n'));
const beforeFramework = process.memoryUsage();

try {
  const { createBumbaFramework } = require('../src/core/bumba-framework-2');
  
  // Don't actually initialize, just load
  console.log('  Framework loaded (not initialized)');
  
  const afterFramework = process.memoryUsage();
  
  memoryReport.framework = {
    rss: (afterFramework.rss - beforeFramework.rss) / 1024 / 1024,
    heapUsed: (afterFramework.heapUsed - beforeFramework.heapUsed) / 1024 / 1024,
    heapTotal: (afterFramework.heapTotal - beforeFramework.heapTotal) / 1024 / 1024
  };
  
  console.log(`  ${chalk.green('🏁')} Framework Load: +${memoryReport.framework.heapUsed.toFixed(2)} MB\n`);
} catch (error) {
  console.log(`  ${chalk.red('🔴')} Framework failed to load: ${error.message}\n`);
}

// Final memory state
const finalMemory = process.memoryUsage();
memoryReport.final = finalMemory;
memoryReport.total = {
  rss: (finalMemory.rss - initialMemory.rss) / 1024 / 1024,
  heapUsed: (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024,
  heapTotal: (finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024
};

console.log(chalk.yellow('Final Memory State:'));
console.log(`  RSS:        ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used:  ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB\n`);

console.log(chalk.cyan('Memory Consumption Summary:'));
console.log(`  Total Increase: ${chalk.bold(memoryReport.total.heapUsed.toFixed(2))} MB`);

// Identify top memory consumers
const sortedComponents = Object.entries(memoryReport.components)
  .filter(([_, data]) => !data.error)
  .sort((a, b) => b[1].heapUsed - a[1].heapUsed)
  .slice(0, 5);

console.log(chalk.cyan('\nTop 5 Memory Consumers:'));
sortedComponents.forEach(([name, data], index) => {
  console.log(`  ${index + 1}. ${name.padEnd(25)} ${data.heapUsed.toFixed(2)} MB`);
});

// Save baseline to file
const baselineFile = path.join(__dirname, 'memory-baseline.json');
fs.writeFileSync(baselineFile, JSON.stringify(memoryReport, null, 2));
console.log(chalk.green(`\n🏁 Baseline saved to ${baselineFile}`));

// Heap snapshot
if (process.argv.includes('--snapshot')) {
  const heapSnapshot = v8.writeHeapSnapshot();
  console.log(chalk.green(`🏁 Heap snapshot saved to ${heapSnapshot}`));
}

console.log(chalk.blue('\n📊 Baseline profiling complete!'));
console.log(chalk.gray('Run with --snapshot to capture heap snapshot'));

process.exit(0);