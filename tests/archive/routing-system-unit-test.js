/**
 * Routing System Unit Test
 * Tests core routing logic without external dependencies
 */

const { UnifiedRoutingSystem } = require('../src/core/unified-routing-system');

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function testSection(name) {
  console.log(`${colors.cyan}  ${name}${colors.reset}`);
}

function test(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    const result = fn();
    if (result) {
      console.log(`${colors.green}🏁${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}🟢${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}🟢 ${error.message}${colors.reset}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
  return true;
}

// Run tests
function runTests() {
  console.log(`${colors.cyan}║      ROUTING SYSTEM UNIT TESTS              ║${colors.reset}`);
  
  let totalTests = 0;
  let passedTests = 0;
  
  const routingSystem = new UnifiedRoutingSystem();
  const analyzer = routingSystem.analyzer;
  
  // Intent Analysis Tests
  testSection('Intent Analysis');
  
  totalTests++;
  if (test('Detects build intent', () => {
    const result = analyzer.analyzeIntent('implement', ['user authentication'], {});
    return assert(result.primaryIntent === 'build');
  })) passedTests++;
  
  totalTests++;
  if (test('Detects analyze intent', () => {
    const result = analyzer.analyzeIntent('analyze', ['security'], {});
    return assert(result.primaryIntent === 'analyze');
  })) passedTests++;
  
  totalTests++;
  if (test('Detects design intent', () => {
    const result = analyzer.analyzeIntent('design', ['dashboard'], {});
    return assert(result.primaryIntent === 'design');
  })) passedTests++;
  
  // Department Detection Tests
  testSection('Department Detection');
  
  totalTests++;
  if (test('Detects technical department', () => {
    const result = analyzer.analyzeIntent('implement', ['backend API'], {});
    return assert(result.departments.includes('technical'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects experience department', () => {
    const result = analyzer.analyzeIntent('design', ['user interface'], {});
    return assert(result.departments.includes('experience'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects strategic department', () => {
    const result = analyzer.analyzeIntent('roadmap', ['product features'], {});
    return assert(result.departments.includes('strategic'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects multiple departments', () => {
    const result = analyzer.analyzeIntent('implement', ['full-stack app with UI and API'], {});
    return assert(result.departments.length > 1);
  })) passedTests++;
  
  // Specialist Detection Tests
  testSection('Specialist Detection');
  
  totalTests++;
  if (test('Detects security specialist', () => {
    const result = analyzer.analyzeIntent('audit', ['security vulnerabilities'], {});
    return assert(result.specialists.includes('security-specialist'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects database specialist', () => {
    const result = analyzer.analyzeIntent('optimize', ['database queries'], {});
    return assert(result.specialists.includes('database-specialist'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects frontend specialist', () => {
    const result = analyzer.analyzeIntent('build', ['react components'], {});
    return assert(result.specialists.includes('frontend-specialist'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects Python specialist', () => {
    const result = analyzer.analyzeIntent('implement', ['python API'], {});
    return assert(result.specialists.includes('python-specialist'));
  })) passedTests++;
  
  totalTests++;
  if (test('Detects JavaScript specialist', () => {
    const result = analyzer.analyzeIntent('build', ['node.js service'], {});
    return assert(result.specialists.includes('javascript-specialist'));
  })) passedTests++;
  
  // Complexity Scoring Tests
  testSection('Complexity Scoring');
  
  totalTests++;
  if (test('Simple tasks have low complexity', () => {
    const result = analyzer.analyzeIntent('fix', ['typo'], {});
    return assert(result.complexity < 0.3);
  })) passedTests++;
  
  totalTests++;
  if (test('Multi-domain tasks have high complexity', () => {
    const result = analyzer.analyzeIntent('implement', ['complete platform with frontend, backend, database'], {});
    return assert(result.complexity > 0.5);
  })) passedTests++;
  
  totalTests++;
  if (test('Enterprise tasks are executive level', () => {
    const result = analyzer.analyzeIntent('plan', ['enterprise transformation'], {});
    return assert(result.isExecutiveLevel === true);
  })) passedTests++;
  
  // Language Detection Tests
  testSection('Language Detection');
  
  totalTests++;
  if (test('Detects Python explicitly', () => {
    const result = analyzer.analyzeIntent('implement', ['python flask API'], {});
    return assert(result.explicitLanguage === 'python');
  })) passedTests++;
  
  totalTests++;
  if (test('Detects JavaScript/Node.js', () => {
    const result = analyzer.analyzeIntent('build', ['node.js microservice'], {});
    return assert(result.explicitLanguage === 'javascript');
  })) passedTests++;
  
  totalTests++;
  if (test('Detects Golang', () => {
    const result = analyzer.analyzeIntent('implement', ['golang REST API'], {});
    return assert(result.explicitLanguage === 'golang');
  })) passedTests++;
  
  // Pattern Matching Tests
  testSection('Pattern Matching');
  
  totalTests++;
  if (test('Matches API development pattern', () => {
    const result = analyzer.analyzeIntent('build', ['REST API'], {});
    const apiPattern = result.patterns.find(p => p.name === 'api-development');
    return assert(apiPattern !== undefined);
  })) passedTests++;
  
  totalTests++;
  if (test('Matches database design pattern', () => {
    const result = analyzer.analyzeIntent('design', ['database schema'], {});
    const dbPattern = result.patterns.find(p => p.name === 'database-design');
    return assert(dbPattern !== undefined);
  })) passedTests++;
  
  totalTests++;
  if (test('Matches security audit pattern', () => {
    const result = analyzer.analyzeIntent('security', ['audit'], {});
    const secPattern = result.patterns.find(p => p.name === 'security-audit');
    return assert(secPattern !== undefined);
  })) passedTests++;
  
  // Confidence Calculation Tests
  testSection('Confidence Calculation');
  
  totalTests++;
  if (test('High confidence for specific tasks', () => {
    const result = analyzer.analyzeIntent('implement', ['python flask API with JWT auth'], {});
    return assert(result.confidence > 0.6);
  })) passedTests++;
  
  totalTests++;
  if (test('Low confidence for vague tasks', () => {
    const result = analyzer.analyzeIntent('fix', ['issue'], {});
    return assert(result.confidence < 0.5);
  })) passedTests++;
  
  // Routing Strategy Tests
  testSection('Routing Strategy Generation');
  
  totalTests++;
  if (test('Generates routing for simple task', async () => {
    const routing = await routingSystem.route('fix', ['typo'], {});
    return assert(routing.mode === 'simple' || routing.mode === 'moderate');
  })) passedTests++;
  
  totalTests++;
  if (test('Generates routing for complex task', async () => {
    const routing = await routingSystem.route('implement', ['enterprise platform'], {});
    return assert(routing.complexity > 0.5);
  })) passedTests++;
  
  totalTests++;
  if (test('Includes specialists in routing', async () => {
    const routing = await routingSystem.route('optimize', ['database performance'], {});
    return assert(routing.specialists.length > 0);
  })) passedTests++;
  
  // RESULTS
  console.log(`${colors.cyan}  TEST RESULTS${colors.reset}`);
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  const resultColor = passedTests === totalTests ? colors.green : 
                      passedTests > totalTests * 0.7 ? colors.yellow : colors.red;
  
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
  console.log(`  ${resultColor}Success Rate: ${percentage}%${colors.reset}\n`);
  
  if (passedTests === totalTests) {
    console.log(`${colors.green}🏁 ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}The routing system's core logic is working correctly.${colors.reset}\n`);
  } else if (passedTests > totalTests * 0.7) {
    console.log(`${colors.yellow}🟡  Most tests passed, but some issues remain.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}🔴 Multiple test failures detected.${colors.reset}\n`);
  }
  
  return passedTests === totalTests;
}

// Run the tests
const success = runTests();
process.exit(success ? 0 : 1);