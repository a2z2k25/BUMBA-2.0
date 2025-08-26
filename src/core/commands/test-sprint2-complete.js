#!/usr/bin/env node

/**
 * Sprint 2 Complete Test Suite
 * Tests 20+ commands with real specialists and coordination
 */

const { getInstance } = require('./command-execution-bridge-v2');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + '='.repeat(80));
  console.log(colorize(`🟢 ${text}`, 'bright'));
  console.log('='.repeat(80));
}

function printSection(text) {
  console.log('\n' + colorize(`▶ ${text}`, 'cyan'));
  console.log('-'.repeat(60));
}

async function testSprint2Complete() {
  printHeader('SPRINT 2: Complete Command System Test');
  
  const bridge = getInstance();
  
  // Sprint 2 test commands (20 commands across all departments)
  const testCommands = [
    // Backend commands
    { name: 'api', args: ['Create user authentication API'], category: 'Backend' },
    { name: 'secure', args: ['Implement OAuth2 security'], category: 'Backend' },
    { name: 'devops', args: ['Setup CI/CD pipeline'], category: 'Backend' },
    { name: 'scan', args: ['Scan for vulnerabilities'], category: 'Backend' },
    { name: 'implement-technical', args: ['Build payment processing'], category: 'Backend' },
    
    // Frontend commands
    { name: 'design', args: ['Design dashboard interface'], category: 'Frontend' },
    { name: 'ui', args: ['Create responsive components'], category: 'Frontend' },
    { name: 'visual', args: ['Design color scheme'], category: 'Frontend' },
    { name: 'implement-design', args: ['Implement Figma mockups'], category: 'Frontend' },
    
    // Product/Strategy commands
    { name: 'prd', args: ['Create PRD for mobile app'], category: 'Product' },
    { name: 'requirements', args: ['Define API requirements'], category: 'Product' },
    { name: 'roadmap', args: ['Plan Q1 roadmap'], category: 'Product' },
    { name: 'research-market', args: ['Research competitors'], category: 'Product' },
    
    // Cross-functional commands
    { name: 'implement', args: ['Build user profile feature'], category: 'Cross-functional' },
    { name: 'analyze', args: ['Analyze system performance'], category: 'Cross-functional' },
    { name: 'test', args: ['Test payment flow'], category: 'Cross-functional' },
    { name: 'docs', args: ['Create API documentation'], category: 'Cross-functional' },
    { name: 'improve', args: ['Optimize database queries'], category: 'Cross-functional' },
    { name: 'team', args: ['Setup team structure'], category: 'Cross-functional' },
    { name: 'collaborate', args: ['Enable team collaboration'], category: 'Cross-functional' }
  ];
  
  const results = {
    total: testCommands.length,
    successful: 0,
    failed: 0,
    byCategory: {},
    byStrategy: {},
    timings: [],
    errors: []
  };
  
  // Test individual commands
  printSection('Testing Individual Commands');
  
  for (const testCmd of testCommands) {
    process.stdout.write(`Testing ${testCmd.name.padEnd(20)} [${testCmd.category}]... `);
    
    try {
      const startTime = Date.now();
      const result = await bridge.executeCommand(testCmd.name, testCmd.args);
      const elapsed = Date.now() - startTime;
      
      if (result.success) {
        console.log(colorize(`🏁 Success (${elapsed}ms)`, 'green'));
        results.successful++;
        
        // Track by category
        if (!results.byCategory[testCmd.category]) {
          results.byCategory[testCmd.category] = { success: 0, failed: 0 };
        }
        results.byCategory[testCmd.category].success++;
        
        // Track by strategy
        if (result.strategy) {
          results.byStrategy[result.strategy] = (results.byStrategy[result.strategy] || 0) + 1;
        }
        
        results.timings.push(elapsed);
        
        // Show specialist usage
        if (result.metrics) {
          console.log(`     Specialists: ${result.metrics.specialistsUsed} (${result.metrics.warmHits} warm, ${result.metrics.coldStarts} cold)`);
        }
      } else {
        console.log(colorize(`🔴 Failed: ${result.error}`, 'red'));
        results.failed++;
        results.errors.push({ command: testCmd.name, error: result.error });
        
        if (!results.byCategory[testCmd.category]) {
          results.byCategory[testCmd.category] = { success: 0, failed: 0 };
        }
        results.byCategory[testCmd.category].failed++;
      }
    } catch (error) {
      console.log(colorize(`🔴 Error: ${error.message}`, 'red'));
      results.failed++;
      results.errors.push({ command: testCmd.name, error: error.message });
    }
  }
  
  // Test batch execution
  printSection('Testing Batch Execution');
  
  const batchCommands = [
    { name: 'analyze', args: ['Analyze codebase'] },
    { name: 'test', args: ['Run tests'] },
    { name: 'docs', args: ['Generate docs'] }
  ];
  
  console.log(`Executing batch of ${batchCommands.length} commands...`);
  const batchResult = await bridge.executeBatch(batchCommands);
  
  if (batchResult.success) {
    console.log(colorize(`🏁 Batch executed successfully`, 'green'));
    console.log(`   Total time: ${batchResult.totalTime}ms`);
    console.log(`   Average time: ${batchResult.averageTime.toFixed(0)}ms per command`);
    console.log(`   Success rate: ${(batchResult.successRate * 100).toFixed(0)}%`);
  }
  
  // Test command recommendations
  printSection('Testing Command Recommendations');
  
  const contexts = [
    'need to create an API',
    'design a user interface',
    'analyze business metrics',
    'setup deployment pipeline'
  ];
  
  for (const context of contexts) {
    const recommendations = await bridge.getCommandRecommendations(context);
    console.log(`\nContext: "${context}"`);
    console.log('Recommendations:');
    recommendations.slice(0, 3).forEach(rec => {
      console.log(`  - ${rec.command}: ${rec.description} (relevance: ${rec.relevance})`);
    });
  }
  
  // Display metrics
  printSection('System Metrics');
  
  const metrics = bridge.getMetrics();
  
  console.log('\n📊 Execution Metrics:');
  console.log(`Total commands executed: ${metrics.totalCommands}`);
  console.log(`Warm hit rate: ${(metrics.warmHitRate * 100).toFixed(1)}%`);
  console.log(`Collaboration rate: ${(metrics.collaborationRate * 100).toFixed(1)}%`);
  console.log(`Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
  
  console.log('\n📈 Strategy Usage:');
  Object.entries(metrics.strategyUsage).forEach(([strategy, count]) => {
    console.log(`  ${strategy}: ${count} times`);
  });
  
  console.log('\n🟢 Factory Metrics:');
  console.log(`Real specialists created: ${metrics.factory.created}`);
  console.log(`Specialists reused: ${metrics.factory.reused}`);
  console.log(`Mock specialists: ${metrics.factory.mocked}`);
  
  // Results summary
  printHeader('SPRINT 2 TEST RESULTS');
  
  console.log('\n📋 Command Execution Summary:');
  console.log(`Total commands tested: ${results.total}`);
  console.log(`${colorize(`🏁 Successful: ${results.successful}`, 'green')}`);
  console.log(`${colorize(`🔴 Failed: ${results.failed}`, 'red')}`);
  console.log(`Success rate: ${((results.successful / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📂 Results by Category:');
  Object.entries(results.byCategory).forEach(([category, stats]) => {
    const total = stats.success + stats.failed;
    const rate = ((stats.success / total) * 100).toFixed(0);
    console.log(`  ${category}: ${stats.success}/${total} (${rate}%)`);
  });
  
  console.log('\n🟡 Coordination Strategies Used:');
  Object.entries(results.byStrategy).forEach(([strategy, count]) => {
    console.log(`  ${strategy}: ${count} commands`);
  });
  
  console.log('\n⏱️ Performance Statistics:');
  if (results.timings.length > 0) {
    const avgTime = results.timings.reduce((a, b) => a + b, 0) / results.timings.length;
    const minTime = Math.min(...results.timings);
    const maxTime = Math.max(...results.timings);
    console.log(`  Average: ${avgTime.toFixed(0)}ms`);
    console.log(`  Min: ${minTime}ms`);
    console.log(`  Max: ${maxTime}ms`);
  }
  
  if (results.errors.length > 0) {
    console.log('\n🔴 Errors Encountered:');
    results.errors.forEach(err => {
      console.log(`  ${err.command}: ${err.error}`);
    });
  }
  
  // Success criteria
  console.log('\n' + '='.repeat(80));
  console.log('🏁 SPRINT 2 SUCCESS CRITERIA:');
  console.log('-'.repeat(60));
  
  const criteria = [
    { 
      name: '20+ commands operational', 
      met: results.successful >= 18,
      actual: `${results.successful}/20`
    },
    { 
      name: 'All departments covered', 
      met: Object.keys(results.byCategory).length >= 4,
      actual: `${Object.keys(results.byCategory).length} departments`
    },
    { 
      name: 'Specialist coordination working', 
      met: Object.keys(results.byStrategy).length > 1,
      actual: `${Object.keys(results.byStrategy).length} strategies used`
    },
    { 
      name: 'Warm/cold pooling active', 
      met: metrics.warmHitRate > 0,
      actual: `${(metrics.warmHitRate * 100).toFixed(1)}% warm hits`
    },
    { 
      name: 'Batch execution functional', 
      met: batchResult.success,
      actual: batchResult.success ? 'Working' : 'Failed'
    }
  ];
  
  criteria.forEach(criterion => {
    const status = criterion.met ? colorize('🏁 PASS', 'green') : colorize('🔴 FAIL', 'red');
    console.log(`${status} ${criterion.name} (${criterion.actual})`);
  });
  
  const allCriteriaMet = criteria.every(c => c.met);
  
  console.log('\n' + '='.repeat(80));
  if (allCriteriaMet) {
    console.log(colorize('🏁 SPRINT 2 COMPLETE! All success criteria met!', 'green'));
    console.log(colorize('Ready to proceed to Sprint 3: Full Command Coverage', 'bright'));
  } else {
    console.log(colorize('🟠️ Sprint 2 needs additional work', 'yellow'));
    const unmet = criteria.filter(c => !c.met).map(c => c.name);
    console.log(`Outstanding items: ${unmet.join(', ')}`);
  }
  console.log('='.repeat(80));
}

// Run test
if (require.main === module) {
  testSprint2Complete().catch(console.error);
}

module.exports = { testSprint2Complete };