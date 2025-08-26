#!/usr/bin/env node

/**
 * Sprint 26: Command Routing Tests
 * Validates optimized command cache and routing system
 */

process.env.BUMBA_OFFLINE = 'true';
process.env.BUMBA_FAST_START = 'true';
process.env.LOG_LEVEL = 'ERROR';

console.log('🎯 Sprint 26: Command Routing Tests\n');
console.log('=' .repeat(50));

const { lookupCommand, getCacheStats } = require('./src/core/commands/command-cache');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passedTests++;
    } else {
      console.log(`❌ ${name}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failedTests++;
  }
}

// Test direct command lookups
console.log('\n📍 Direct Command Lookups');
const directCommands = [
  { cmd: 'create-api', expected: 'api-architect', dept: 'backend' },
  { cmd: 'debug', expected: 'debugger-specialist', dept: 'backend' },
  { cmd: 'review-code', expected: 'code-reviewer', dept: 'backend' },
  { cmd: 'create-component', expected: 'react-specialist', dept: 'design' },
  { cmd: 'design-ui', expected: 'ui-design', dept: 'design' },
  { cmd: 'write-prd', expected: 'product-manager', dept: 'product' },
  { cmd: 'deploy', expected: 'devops-engineer', dept: 'backend' }
];

directCommands.forEach(({ cmd, expected, dept }) => {
  test(`Route: ${cmd} -> ${expected}`, () => {
    const result = lookupCommand(cmd);
    return result && result.specialist === expected && result.dept === dept;
  });
});

// Test keyword matching
console.log('\n🔍 Keyword Matching');
const keywordTests = [
  { input: 'help with python code', keyword: 'python', expected: 'python-specialist' },
  { input: 'javascript debugging', keyword: 'javascript', expected: 'javascript-specialist' },
  { input: 'react component issue', keyword: 'react', expected: 'react-specialist' },
  { input: 'database optimization', keyword: 'database', expected: 'database-admin' },
  { input: 'kubernetes deployment', keyword: 'kubernetes', expected: 'kubernetes-specialist' }
];

keywordTests.forEach(({ input, keyword, expected }) => {
  test(`Keyword: "${keyword}" -> ${expected}`, () => {
    const result = lookupCommand(input);
    return result && result.specialist === expected;
  });
});

// Test cache performance
console.log('\n⚡ Cache Performance');
const iterations = 1000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  lookupCommand('create-api');
  lookupCommand('debug');
  lookupCommand('deploy');
}

const lookupTime = Date.now() - startTime;
const avgTime = lookupTime / (iterations * 3);

test(`${iterations * 3} lookups < 50ms total`, () => lookupTime < 50);
test(`Average lookup < 0.02ms`, () => avgTime < 0.02);

// Test cache statistics
console.log('\n📊 Cache Statistics');
const stats = getCacheStats();

test('Cache hit rate > 80%', () => {
  const hitRate = parseFloat(stats.hitRate);
  return hitRate > 80;
});

test('Routes cached > 10', () => stats.routes > 10);
test('Keywords cached > 10', () => stats.keywords > 10);

// Test department routing
console.log('\n🏢 Department Routing');
const deptTests = [
  { cmd: 'create-api', dept: 'backend' },
  { cmd: 'design-ui', dept: 'design' },
  { cmd: 'write-prd', dept: 'product' }
];

deptTests.forEach(({ cmd, dept }) => {
  test(`${cmd} routes to ${dept}`, () => {
    const result = lookupCommand(cmd);
    return result && result.dept === dept;
  });
});

// Test fallback behavior
console.log('\n🔄 Fallback Behavior');
test('Unknown command returns null', () => {
  const result = lookupCommand('unknown-command-xyz');
  return result === null;
});

test('Empty command returns null', () => {
  const result = lookupCommand('');
  return result === null;
});

// Performance benchmarks
console.log('\n📈 Performance Benchmarks');
const finalStats = getCacheStats();

console.log(`  Total hits: ${finalStats.hits}`);
console.log(`  Total misses: ${finalStats.misses}`);
console.log(`  Hit rate: ${finalStats.hitRate}`);
console.log(`  Routes cached: ${finalStats.routes}`);
console.log(`  Keywords cached: ${finalStats.keywords}`);

// Summary
console.log('\n' + '=' .repeat(50));
console.log('📊 Sprint 26 Results\n');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

const sprintPassed = failedTests === 0;
console.log('\n' + '=' .repeat(50));
console.log(sprintPassed ? 
  '✅ SPRINT 26 COMPLETE: Command routing validated!' : 
  '⚠️  Sprint 26: Some routing tests failed');
console.log('=' .repeat(50));

process.exit(sprintPassed ? 0 : 1);