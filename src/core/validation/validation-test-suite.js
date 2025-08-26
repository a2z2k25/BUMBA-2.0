/**
 * BUMBA Validation Test Suite
 * Tests validation with real code examples
 */

const { ValidatorFactory } = require('./validation-result');
const chalk = require('chalk');

/**
 * Test cases with known issues
 */
const TEST_CASES = {
  javascript: {
    security: `
      // Security issues
      function processUserInput(input) {
        eval(input);  // Dangerous!
        document.body.innerHTML = input;  // XSS vulnerability
        const query = "SELECT * FROM users WHERE id = " + input;  // SQL injection
      }
    `,
    
    logic: `
      // Logic issues
      function checkValue(value) {
        if (value = 5) {  // Assignment instead of comparison
          return true;
        }
        if (value == null) {  // Loose comparison
          return false;
        }
        return value
      }
    `,
    
    performance: `
      // Performance issues
      function slowFunction(items) {
        for (let i = 0; i < items.length; i++) {
          const element = document.querySelector('#item-' + i);  // DOM query in loop
          element.style.color = 'red';
        }
      }
    `,
    
    bestPractices: `
      // Best practice violations
      var globalVar = 'bad';  // Using var
      console.log('debug');    // Console statements
      
      function oldStyle() {
        arguments.callee();   // Deprecated
        with(obj) {          // Deprecated with statement
          prop = value
        }
      }
    `,
    
    clean: `
      // Clean code
      const processData = (data) => {
        const result = data.filter(item => item.active);
        return result.map(item => ({
          id: item.id,
          name: item.name
        }));
      };
    `
  }
};

/**
 * Run validation tests
 */
async function runValidationTests() {
  console.log(chalk.cyan.bold('\n🧪 Validation Test Suite\n'));
  
  const results = {};
  
  for (const [name, code] of Object.entries(TEST_CASES.javascript)) {
    console.log(chalk.yellow(`Testing: ${name}`));
    
    const result = await ValidatorFactory.validate(code, 'javascript');
    results[name] = result;
    
    console.log(`  Valid: ${result.isValid() ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`  Issues: ${result.stats.errors} errors, ${result.stats.warnings} warnings`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%\n`);
  }
  
  return results;
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║          VALIDATION TEST REPORT                      ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════╝\n'));
  
  let totalIssues = 0;
  let totalErrors = 0;
  
  Object.entries(results).forEach(([name, result]) => {
    console.log(chalk.yellow(`\n${name.toUpperCase()}:`));
    
    if (result.evidence.length === 0) {
      console.log(chalk.green('  ✓ No issues found'));
    } else {
      result.evidence.forEach(e => {
        console.log(e.format());
      });
    }
    
    totalIssues += result.evidence.length;
    totalErrors += result.stats.errors;
  });
  
  console.log(chalk.cyan('\n═══ Summary ═══'));
  console.log(`Total test cases: ${Object.keys(results).length}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Total errors: ${totalErrors}`);
  
  // Verify validation is working
  const hasFoundExpectedIssues = 
    results.security.stats.errors >= 2 &&  // Should find eval and innerHTML
    results.logic.stats.errors >= 1 &&     // Should find assignment in condition
    results.performance.stats.warnings >= 1 && // Should find DOM query in loop
    results.clean.evidence.length <= 2;    // Clean code should have minimal issues
  
  if (hasFoundExpectedIssues) {
    console.log(chalk.green('\n✅ Validation is working correctly!'));
  } else {
    console.log(chalk.red('\n❌ Validation may not be working correctly'));
  }
  
  return hasFoundExpectedIssues;
}

// Export for testing
module.exports = {
  runValidationTests,
  generateTestReport,
  TEST_CASES
};

// Run if called directly
if (require.main === module) {
  runValidationTests().then(results => {
    const success = generateTestReport(results);
    process.exit(success ? 0 : 1);
  });
}